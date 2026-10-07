import { useMemo, useState } from 'react';
import './extra.css';

// Two transactions, T1 and T2, run a fixed script against a tiny table. A small engine replays the script
// under the chosen isolation level, with row versions, snapshots, row locks, waiting and serialization failures,
// so every outcome below is computed, not drawn by hand. The behaviour follows PostgreSQL.
// The first level is the textbook READ UNCOMMITTED, which PostgreSQL itself does NOT implement (it runs READ COMMITTED).

const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
const num = (n) => String(n);
const clone = (o) => JSON.parse(JSON.stringify(o));
const rowKey = (t, id) => `${t}:${id}`;
const other = (n) => (n === 'T1' ? 'T2' : 'T1');

const LEVELS = [
  { id: 'RU', label: 'READ UNCOMMITTED', pill: 'textbook, not PostgreSQL', sql: 'READ UNCOMMITTED', desc: 'Textbook rule: you may read other transactions’ uncommitted changes. PostgreSQL accepts this keyword but quietly runs READ COMMITTED instead, so dirty reads cannot happen in PostgreSQL. It is shown here so you can see what a dirty read looks like.' },
  { id: 'RC', label: 'READ COMMITTED', pill: 'PostgreSQL default', sql: 'READ COMMITTED', desc: 'Every statement sees the data that was committed at the moment that statement started. A later statement in the same transaction can see newer data.' },
  { id: 'RR', label: 'REPEATABLE READ', pill: 'snapshot', sql: 'REPEATABLE READ', desc: 'The whole transaction works on one snapshot, taken at its first statement. In PostgreSQL the snapshot also hides new rows, and updating a row that changed after your snapshot fails with error 40001.' },
  { id: 'SER', label: 'SERIALIZABLE', pill: 'strictest', sql: 'SERIALIZABLE', desc: 'Behaves as if the transactions ran one after the other. PostgreSQL watches the read/write dependencies and aborts one transaction when they would break that rule (error 40001). Your code must retry.' },
];

const bankInit = () => ({ bank: [{ id: 'IN01', balance: 100000, ver: 0 }] });
const sel = (tx, sql, say, extra) => ({ tx, op: 'select', sql, say, ...extra });

const bankRead = { table: 'bank', test: (r) => r.id === 'IN01', agg: 'value', col: 'balance', fmt: money };

const SCENARIOS = {
  dirty: {
    label: 'Dirty read',
    story: 'Treasury is moving ₹50,000 into the IN01 bank account (T2). Before that transfer is committed, the cash dashboard (T1) reads the balance. Then the transfer is cancelled. Did the dashboard ever show money that was never there?',
    col: 0,
    init: bankInit,
    steps: [
      { tx: 'T1', op: 'begin', say: 'T1, the cash dashboard, starts a transaction.' },
      { tx: 'T2', op: 'begin', say: 'T2, the transfer job, starts a transaction.' },
      { tx: 'T2', op: 'update', table: 'bank', id: 'IN01', col: 'balance', rel: 50000, sql: "UPDATE bank SET balance = balance + 50000 WHERE acct = 'IN01';", say: 'T2 adds ₹50,000. It is not committed, so officially it has not happened yet.' },
      sel('T1', "SELECT balance FROM bank WHERE acct = 'IN01';", 'T1 reads the balance while T2’s change is still uncommitted.', { ...bankRead, tag: 'r1' }),
      { tx: 'T2', op: 'rollback', say: 'The transfer is cancelled. T2 rolls back and the ₹50,000 never existed.' },
      sel('T1', "SELECT balance FROM bank WHERE acct = 'IN01';", 'T1 reads again, after the rollback.', { ...bankRead, tag: 'r2' }),
      { tx: 'T1', op: 'commit', say: 'T1 finishes.' },
    ],
    verdict: ({ results }) => (results.r1 !== 100000
      ? { bad: true, head: 'Dirty read happened', text: `T1 read ${money(results.r1)}, but that transfer was rolled back, so the real balance never left ${money(100000)}. The dashboard showed money that never existed.` }
      : { bad: false, head: 'No dirty read', text: `T1 saw only committed data: ${money(results.r1)} before and ${money(results.r2)} after T2’s rollback. PostgreSQL never shows uncommitted data at any level.` }),
  },
  nonrep: {
    label: 'Non-repeatable read',
    story: 'A month-end report (T1) reads the IN01 balance, does some other work, and reads it again to cross-check. In between, another job (T2) commits a ₹50,000 receipt. Does the report see two different balances inside one transaction?',
    col: 1,
    init: bankInit,
    steps: [
      { tx: 'T1', op: 'begin', say: 'T1, the report, starts a transaction.' },
      sel('T1', "SELECT balance FROM bank WHERE acct = 'IN01';", 'T1 reads the balance for the first time.', { ...bankRead, tag: 'r1' }),
      { tx: 'T2', op: 'begin', say: 'T2, the receipts job, starts.' },
      { tx: 'T2', op: 'update', table: 'bank', id: 'IN01', col: 'balance', rel: 50000, sql: "UPDATE bank SET balance = balance + 50000 WHERE acct = 'IN01';", say: 'T2 adds a ₹50,000 receipt.' },
      { tx: 'T2', op: 'commit', say: 'T2 commits. The new balance is now official.' },
      sel('T1', "SELECT balance FROM bank WHERE acct = 'IN01';", 'T1 reads the same row again.', { ...bankRead, tag: 'r2' }),
      { tx: 'T1', op: 'commit', say: 'T1 finishes.' },
    ],
    verdict: ({ results }) => (results.r1 !== results.r2
      ? { bad: true, head: 'Non-repeatable read happened', text: `T1 read the same row twice and got ${money(results.r1)} and then ${money(results.r2)}, because T2 committed in between. A report that combines several reads can contradict itself.` }
      : { bad: false, head: 'Reads are repeatable', text: `Both reads returned ${money(results.r1)}. T1 works on a snapshot taken at its first statement, so T2’s committed change stays invisible until T1 is finished.` }),
  },
  phantom: {
    label: 'Phantom read',
    story: 'A check (T1) counts the invoices above ₹1,00,000 twice. Between the two counts, another transaction (T2) inserts and commits one more large invoice. Does a new row appear out of nowhere?',
    col: 2,
    init: () => ({ invoices: [{ id: 1, amount: 40000, ver: 0 }, { id: 2, amount: 120000, ver: 0 }, { id: 3, amount: 250000, ver: 0 }] }),
    steps: [
      { tx: 'T1', op: 'begin', say: 'T1 starts a transaction.' },
      sel('T1', 'SELECT COUNT(*) FROM invoices WHERE amount > 100000;', 'T1 counts the large invoices.', { table: 'invoices', test: (r) => r.amount > 100000, agg: 'count', fmt: num, tag: 'r1' }),
      { tx: 'T2', op: 'begin', say: 'T2 starts.' },
      { tx: 'T2', op: 'insert', table: 'invoices', row: { id: 4, amount: 180000 }, sql: 'INSERT INTO invoices VALUES (4, 180000);', say: 'T2 inserts a new ₹1,80,000 invoice.' },
      { tx: 'T2', op: 'commit', say: 'T2 commits.' },
      sel('T1', 'SELECT COUNT(*) FROM invoices WHERE amount > 100000;', 'T1 runs the same count again.', { table: 'invoices', test: (r) => r.amount > 100000, agg: 'count', fmt: num, tag: 'r2' }),
      { tx: 'T1', op: 'commit', say: 'T1 finishes.' },
    ],
    verdict: ({ results }) => (results.r1 !== results.r2
      ? { bad: true, head: 'Phantom read happened', text: `The same query counted ${results.r1} invoices and then ${results.r2}: a new row that matches the filter appeared inside T1.` }
      : { bad: false, head: 'No phantom', text: `Both counts are ${results.r1}. In PostgreSQL the snapshot of REPEATABLE READ also hides new rows. (The SQL standard alone would still allow phantoms at this level; PostgreSQL is stricter.)` }),
  },
  lost: {
    label: 'Lost update (value computed in the app)',
    story: 'Two clerks add receipts to the IN01 balance at the same time: ₹20,000 (T1) and ₹30,000 (T2). Each program reads the balance, adds its amount in code, and writes the total back. The balance should end at ₹1,50,000.',
    col: 3,
    init: bankInit,
    steps: [
      { tx: 'T1', op: 'begin', say: 'Clerk 1 (T1) starts.' },
      { tx: 'T2', op: 'begin', say: 'Clerk 2 (T2) starts.' },
      sel('T1', "SELECT balance FROM bank WHERE acct = 'IN01';", 'T1 reads ₹1,00,000.', { ...bankRead, tag: 'r1' }),
      sel('T2', "SELECT balance FROM bank WHERE acct = 'IN01';", 'T2 reads the same ₹1,00,000.', { ...bankRead, tag: 'r2' }),
      { tx: 'T1', op: 'update', table: 'bank', id: 'IN01', col: 'balance', from: 'r1', add: 20000, sql: "UPDATE bank SET balance = 120000 WHERE acct = 'IN01';  -- 1,00,000 + 20,000, added in the app", say: 'T1 writes back 1,00,000 + 20,000 = 1,20,000.' },
      { tx: 'T2', op: 'update', table: 'bank', id: 'IN01', col: 'balance', from: 'r2', add: 30000, sql: "UPDATE bank SET balance = 130000 WHERE acct = 'IN01';  -- 1,00,000 + 30,000, added in the app", say: 'T2 writes back 1,00,000 + 30,000 = 1,30,000. T1 holds the row lock, so T2 has to wait.' },
      { tx: 'T1', op: 'commit', say: 'T1 commits and releases the row lock.' },
      { tx: 'T2', op: 'commit', say: 'T2 tries to commit.' },
    ],
    verdict: ({ db, txs }) => {
      const final = db.bank[0].balance;
      if (txs.T2.error) return { bad: false, head: 'Prevented, with an error', text: `T2’s UPDATE failed with SQLSTATE 40001 because the row changed after T2’s snapshot. Nothing was overwritten silently: the table shows ${money(final)}. Your code must catch 40001, start T2 again and read the new balance; the second attempt ends at ${money(150000)}.` };
      if (final !== 150000) return { bad: true, head: 'Lost update happened', text: `Both receipts were saved, yet the balance is ${money(final)} instead of ${money(150000)}. T2 wrote back a value computed from an old read and wiped out T1’s ₹20,000. No error was raised.` };
      return { bad: false, head: 'Correct result', text: `The balance is ${money(final)}.` };
    },
  },
  atomic: {
    label: 'Lost update, avoided (atomic UPDATE)',
    story: 'The same two receipts, ₹20,000 (T1) and ₹30,000 (T2), but now each program lets the database do the arithmetic: SET balance = balance + amount. The balance should end at ₹1,50,000.',
    col: 3,
    init: bankInit,
    steps: [
      { tx: 'T1', op: 'begin', say: 'Clerk 1 (T1) starts.' },
      { tx: 'T2', op: 'begin', say: 'Clerk 2 (T2) starts.' },
      { tx: 'T1', op: 'update', table: 'bank', id: 'IN01', col: 'balance', rel: 20000, sql: "UPDATE bank SET balance = balance + 20000 WHERE acct = 'IN01';", say: 'T1 adds ₹20,000 inside the database and locks the row.' },
      { tx: 'T2', op: 'update', table: 'bank', id: 'IN01', col: 'balance', rel: 30000, sql: "UPDATE bank SET balance = balance + 30000 WHERE acct = 'IN01';", say: 'T2 wants to add ₹30,000 to the same row, so it has to wait for T1.' },
      { tx: 'T1', op: 'commit', say: 'T1 commits and releases the row lock.' },
      { tx: 'T2', op: 'commit', say: 'T2 tries to commit.' },
    ],
    verdict: ({ db, txs }) => {
      const final = db.bank[0].balance;
      if (txs.T2.error) return { bad: false, head: 'Safe, but T2 must retry', text: `At this level T2 may not update a row that changed after its snapshot, so it receives error 40001 and rolls back. The table is still correct for T1 (${money(final)}). Retrying T2 as a new transaction adds its ₹30,000 and ends at ${money(150000)}.` };
      if (final === 150000) return { bad: false, head: 'Correct result', text: `The balance is ${money(final)}. T2 waited for T1’s lock and then added its ₹30,000 to the newest committed balance. At READ COMMITTED, PostgreSQL re-reads the latest version of the row after a wait, so SET balance = balance + n is safe.` };
      return { bad: true, head: 'Wrong result', text: `The balance is ${money(final)}.` };
    },
  },
  deadlock: {
    label: 'Deadlock (two transfers, opposite order)',
    story: 'Two transfers run at the same moment between the OPS and PAYROLL accounts. T1 moves ₹10,000 from OPS to PAYROLL. T2 moves ₹5,000 the other way, from PAYROLL to OPS. Each transfer updates two rows, but T1 touches OPS first and T2 touches PAYROLL first. What happens when each one needs the row the other already holds?',
    col: -1,
    init: () => ({ bank: [{ id: 'OPS', balance: 100000, ver: 0 }, { id: 'PAYROLL', balance: 50000, ver: 0 }] }),
    steps: [
      { tx: 'T1', op: 'begin', say: 'Transfer 1 (T1) starts.' },
      { tx: 'T2', op: 'begin', say: 'Transfer 2 (T2) starts.' },
      { tx: 'T1', op: 'update', table: 'bank', id: 'OPS', col: 'balance', rel: -10000, sql: "UPDATE bank SET balance = balance - 10000 WHERE acct = 'OPS';", say: 'T1 takes ₹10,000 out of OPS. It now holds the lock on the OPS row.' },
      { tx: 'T2', op: 'update', table: 'bank', id: 'PAYROLL', col: 'balance', rel: -5000, sql: "UPDATE bank SET balance = balance - 5000 WHERE acct = 'PAYROLL';", say: 'T2 takes ₹5,000 out of PAYROLL. It now holds the lock on the PAYROLL row.' },
      { tx: 'T1', op: 'update', table: 'bank', id: 'PAYROLL', col: 'balance', rel: 10000, sql: "UPDATE bank SET balance = balance + 10000 WHERE acct = 'PAYROLL';", say: 'T1 wants to put the ₹10,000 into PAYROLL, but T2 holds that row. T1 must wait.' },
      { tx: 'T2', op: 'update', table: 'bank', id: 'OPS', col: 'balance', rel: 5000, sql: "UPDATE bank SET balance = balance + 5000 WHERE acct = 'OPS';", say: 'T2 wants to put its ₹5,000 into OPS, but T1 holds that row. Now each waits for the other, forever. This is a deadlock.' },
      { tx: 'T1', op: 'commit', say: 'T1 can commit now that PostgreSQL has cancelled T2.' },
      { tx: 'T2', op: 'rollback', say: 'T2 has already been cancelled. Its application must roll back and run the whole transfer again.' },
    ],
    verdict: ({ db, txs }) => {
      const ops = db.bank.find((r) => r.id === 'OPS').balance; const pay = db.bank.find((r) => r.id === 'PAYROLL').balance;
      return txs.T2.error || txs.T1.error
        ? { bad: true, head: 'Deadlock: one transaction was cancelled', text: `Each transfer waited for a row the other one held, so neither could ever continue. PostgreSQL noticed the circle, cancelled one transaction (SQLSTATE 40P01, "deadlock detected") and let the other finish. The table shows OPS ${money(ops)} and PAYROLL ${money(pay)}: only the survivor's transfer was applied. The cancelled transfer must be retried by your code. The isolation level makes no difference here. The cure is to always touch rows in the same order, for example by account name, so the circle can never form.` }
        : { bad: false, head: 'No deadlock', text: 'Both transactions finished.' };
    },
  },
  skew: {
    label: 'Write skew (budget limit)',
    story: 'The OPS department has a payment budget of ₹1,00,000 and has already paid ₹50,000. Two approvers (T1 and T2) each check "paid so far + new payment is still within the limit" and then insert a ₹40,000 payment. Each one alone is allowed. Both together are not.',
    col: 4,
    init: () => ({ payments: [{ id: 1, dept: 'OPS', amount: 50000, ver: 0 }] }),
    steps: [
      { tx: 'T1', op: 'begin', say: 'Approver 1 (T1) starts.' },
      { tx: 'T2', op: 'begin', say: 'Approver 2 (T2) starts.' },
      sel('T1', "SELECT SUM(amount) FROM payments WHERE dept = 'OPS';", 'T1 checks the spend so far: ₹50,000. Adding ₹40,000 stays within ₹1,00,000, so it may go on.', { table: 'payments', test: (r) => r.dept === 'OPS', agg: 'sum', col: 'amount', fmt: money, tag: 'r1' }),
      sel('T2', "SELECT SUM(amount) FROM payments WHERE dept = 'OPS';", 'T2 checks too and also sees ₹50,000.', { table: 'payments', test: (r) => r.dept === 'OPS', agg: 'sum', col: 'amount', fmt: money, tag: 'r2' }),
      { tx: 'T1', op: 'insert', table: 'payments', row: { id: 2, dept: 'OPS', amount: 40000 }, sql: "INSERT INTO payments VALUES (2, 'OPS', 40000);  -- app checked 50,000 + 40,000 <= 1,00,000", say: 'T1 inserts its ₹40,000 payment.' },
      { tx: 'T2', op: 'insert', table: 'payments', row: { id: 3, dept: 'OPS', amount: 40000 }, sql: "INSERT INTO payments VALUES (3, 'OPS', 40000);  -- app checked 50,000 + 40,000 <= 1,00,000", say: 'T2 inserts its own ₹40,000 payment. It is a different row, so the two transactions do not touch the same row.' },
      { tx: 'T1', op: 'commit', say: 'T1 commits.' },
      { tx: 'T2', op: 'commit', say: 'T2 tries to commit.' },
    ],
    verdict: ({ db }) => {
      const total = db.payments.reduce((a, r) => a + r.amount, 0);
      return total > 100000
        ? { bad: true, head: 'Write skew happened: the limit is broken', text: `Each transaction checked ₹50,000 + ₹40,000 ≤ ₹1,00,000 against its own view and found it safe. They inserted different rows, so there was no row conflict, and together they spent ${money(total)}, which is ${money(total - 100000)} over the budget.` }
        : { bad: false, head: 'Prevented, with an error', text: `T2 was stopped with SQLSTATE 40001 because its check depended on data that T1 changed. The total is ${money(total)}, within the limit. T2 must retry: its new check sees ${money(total)}, finds ${money(total)} + ₹40,000 over the limit and rejects the payment.` };
    },
  },
};

// Which anomaly each level allows (PostgreSQL behaviour). yes = can happen, no = cannot, err = stopped by error 40001.
const COLS = ['Dirty read', 'Non-repeatable read', 'Phantom read', 'Lost update', 'Write skew'];
const MATRIX = {
  RU: ['yes', 'yes', 'yes', 'yes', 'yes'],
  RC: ['no', 'yes', 'yes', 'yes*', 'yes'],
  RR: ['no', 'no', 'no', 'err', 'yes'],
  SER: ['no', 'no', 'no', 'err', 'err'],
};
const CELL = { yes: ['possible', 'bad'], 'yes*': ['possible *', 'bad'], no: ['cannot happen', 'ok'], err: ['stopped by error', 'warn'] };

function makeRun(scn, level, n) {
  const db = scn.init();
  const state = { seq: 0, committed: [] };
  const mk = () => ({ status: 'idle', snapSeq: null, snap: null, writes: [], reads: [], blocked: null, error: null });
  const txs = { T1: mk(), T2: mk() };
  const results = {};
  const locks = {};
  const entries = [];
  const snapshotting = level === 'RR' || level === 'SER';

  const ensureSnap = (name) => { const t = txs[name]; if (t.snapSeq === null) { t.snapSeq = state.seq; t.snap = clone(db); } };
  const overlay = (rows, writes) => {
    writes.forEach((w) => {
      const i = rows.findIndex((r) => r.id === w.id);
      if (w.after === null) { if (i >= 0) rows.splice(i, 1); } else if (i >= 0) rows[i] = clone(w.after); else rows.push(clone(w.after));
    });
    return rows;
  };
  const view = (name, table) => {
    const t = txs[name];
    const rows = clone(snapshotting ? t.snap[table] : db[table]);
    if (level === 'RU') overlay(rows, txs[other(name)].writes.filter((w) => w.table === table));
    return overlay(rows, t.writes.filter((w) => w.table === table));
  };
  const releaseLocks = (name) => { Object.keys(locks).forEach((k) => { if (locks[k] === name) delete locks[k]; }); };
  const touches = (reads, writes) => reads.some((r) => writes.some((w) => r.table === w.table && ((w.before && r.test(w.before)) || (w.after && r.test(w.after)))));

  let resume;
  const abort = (name, entry, msg) => {
    const t = txs[name];
    t.status = 'aborted'; t.error = msg; t.writes = []; t.blocked = null; releaseLocks(name);
    entry.lines.push({ tone: 'bad', text: msg });
    entry.lines.push({ tone: 'bad', text: 'This transaction is now aborted. Every later command in it is ignored until ROLLBACK.' });
    resume(other(name), name);
  };
  const applyUpdate = (name, step, entry) => {
    const t = txs[name];
    const latest = db[step.table].find((r) => r.id === step.id);
    const own = t.writes.find((w) => w.table === step.table && w.id === step.id);
    if (snapshotting && !own && latest.ver > t.snapSeq) {
      abort(name, entry, 'ERROR: could not serialize access due to concurrent update (SQLSTATE 40001)');
      return;
    }
    const base = own ? own.after : latest;
    const value = step.rel !== undefined ? base[step.col] + step.rel : results[step.from] + step.add;
    const after = { ...base, [step.col]: value };
    if (own) own.after = after; else t.writes.push({ table: step.table, id: step.id, before: clone(latest), after });
    locks[rowKey(step.table, step.id)] = name;
    entry.lines.push({ tone: 'ok', text: `UPDATE 1 → ${step.col} is now ${money(value)} (uncommitted)` });
  };
  resume = (name, releasedBy) => {
    const t = txs[name];
    if (!t.blocked) return;
    const { step, entry } = t.blocked;
    if (locks[rowKey(step.table, step.id)]) return;
    t.blocked = null;
    entry.lines.push({ tone: 'ok', text: `🔓 ${releasedBy} let go of its locks (commit, rollback or cancel). ${name}’s UPDATE continues.` });
    applyUpdate(name, step, entry);
  };

  scn.steps.slice(0, n).forEach((step) => {
    const name = step.tx; const t = txs[name];
    const entry = { tx: name, sql: step.sql, say: step.say, lines: [] };
    if (step.op === 'begin') entry.sql = `BEGIN ISOLATION LEVEL ${LEVELS.find((l) => l.id === level).sql};`;
    if (step.op === 'commit') entry.sql = 'COMMIT;';
    if (step.op === 'rollback') entry.sql = 'ROLLBACK;';
    entries.push(entry);

    if (step.op === 'begin') {
      t.status = 'active';
      if (snapshotting) entry.lines.push({ tone: 'note', text: 'The snapshot is taken at the first statement, not at BEGIN.' });
      return;
    }
    if (t.status === 'aborted' && step.op !== 'commit' && step.op !== 'rollback') {
      entry.lines.push({ tone: 'bad', text: 'ignored: the transaction is aborted' });
      return;
    }
    if (t.blocked) { entry.lines.push({ tone: 'wait', text: 'not run: still waiting for a lock' }); return; }

    if (step.op === 'select') {
      ensureSnap(name);
      const rows = view(name, step.table).filter(step.test);
      let v;
      if (step.agg === 'count') v = rows.length; else if (step.agg === 'sum') v = rows.reduce((a, r) => a + r[step.col], 0); else v = rows[0] ? rows[0][step.col] : null;
      results[step.tag] = v;
      t.reads.push({ table: step.table, test: step.test });
      entry.lines.push({ tone: 'out', text: `→ ${step.fmt(v)}` });
    } else if (step.op === 'update') {
      ensureSnap(name);
      const holder = locks[rowKey(step.table, step.id)];
      if (holder && holder !== name) {
        t.blocked = { step, entry };
        entry.lines.push({ tone: 'wait', text: `⏳ waiting: the row is locked by ${holder}’s uncommitted UPDATE` });
        // Deadlock check: does the holder wait, in turn, for a row that this transaction holds?
        const h = txs[holder];
        if (h.blocked && locks[rowKey(h.blocked.step.table, h.blocked.step.id)] === name) {
          abort(name, entry, 'ERROR: deadlock detected (SQLSTATE 40P01)');
        }
      } else applyUpdate(name, step, entry);
    } else if (step.op === 'insert') {
      ensureSnap(name);
      t.writes.push({ table: step.table, id: step.row.id, before: null, after: { ...step.row, ver: 0 } });
      entry.lines.push({ tone: 'ok', text: 'INSERT 0 1 (uncommitted)' });
    } else if (step.op === 'rollback') {
      t.writes = []; releaseLocks(name); t.status = 'aborted'; t.rolledBack = true;
      entry.lines.push({ tone: 'note', text: 'ROLLBACK: every change of this transaction is thrown away.' });
      resume(other(name), name);
    } else if (step.op === 'commit') {
      if (t.status === 'aborted') {
        entry.lines.push({ tone: 'bad', text: 'COMMIT is answered with ROLLBACK: the transaction was aborted, nothing is saved.' });
        return;
      }
      if (level === 'SER') {
        const o = txs[other(name)];
        const outgoing = state.committed.some((c) => c.seq > (t.snapSeq ?? 0) && touches(t.reads, c.writes));
        const incoming = (o.status === 'active' || o.status === 'committed') && touches(o.reads, t.writes);
        if (outgoing && incoming) {
          abort(name, entry, 'ERROR: could not serialize access due to read/write dependencies among transactions (SQLSTATE 40001)');
          return;
        }
      }
      state.seq += 1;
      t.writes.forEach((w) => {
        const i = db[w.table].findIndex((r) => r.id === w.id);
        if (w.after === null) { if (i >= 0) db[w.table].splice(i, 1); } else if (i >= 0) db[w.table][i] = { ...w.after, ver: state.seq }; else db[w.table].push({ ...w.after, ver: state.seq });
      });
      state.committed.push({ name, seq: state.seq, writes: clone(t.writes) });
      entry.lines.push({ tone: 'ok', text: `COMMIT: ${t.writes.length} change${t.writes.length === 1 ? '' : 's'} saved for everyone` });
      t.writes = []; releaseLocks(name); t.status = 'committed';
      resume(other(name), name);
    }
  });

  return { entries, db, txs, results, pending: ['T1', 'T2'].flatMap((name) => txs[name].writes.map((w) => ({ tx: name, ...w }))) };
}

function DbPanel({ run, scn }) {
  const tables = Object.keys(run.db);
  return (
    <div className="w-iso-db">
      {tables.map((tb) => {
        const cols = Object.keys(run.db[tb][0] || scn.init()[tb][0]).filter((c) => c !== 'ver');
        const pend = run.pending.filter((p) => p.table === tb);
        return (
          <div key={tb}>
            <div className="mini-cap">table {tb} (committed data)</div>
            <table className="grid mini">
              <thead><tr>{cols.map((c) => <th key={c}>{c === 'id' && tb === 'bank' ? 'acct' : c}</th>)}<th>pending (uncommitted)</th></tr></thead>
              <tbody>
                {run.db[tb].map((r) => {
                  const p = pend.filter((x) => x.id === r.id && x.after);
                  return (
                    <tr key={r.id}>
                      {cols.map((c) => <td key={c} className={typeof r[c] === 'number' && c !== 'id' ? 'num' : ''}>{typeof r[c] === 'number' && c !== 'id' ? money(r[c]) : r[c]}</td>)}
                      <td>{p.length ? p.map((x) => <span key={x.tx} className="iso-pend">{x.tx}: {cols.filter((c) => c !== 'id' && x.after[c] !== r[c]).map((c) => `${c} → ${money(x.after[c])}`).join(', ')}</span>) : <span className="null">none</span>}</td>
                    </tr>
                  );
                })}
                {pend.filter((x) => x.before === null).map((x) => (
                  <tr key={`new-${x.tx}-${x.id}`} className="k-right">
                    {cols.map((c) => <td key={c} className={typeof x.after[c] === 'number' && c !== 'id' ? 'num' : ''}>{typeof x.after[c] === 'number' && c !== 'id' ? money(x.after[c]) : x.after[c]}</td>)}
                    <td><span className="iso-pend">{x.tx}: new row, not visible to others yet</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default function IsolationLevels() {
  const [sid, setSid] = useState('dirty');
  const [level, setLevel] = useState('RC');
  const [n, setN] = useState(0);
  const scn = SCENARIOS[sid];
  const lv = LEVELS.find((l) => l.id === level);
  const total = scn.steps.length;
  const run = useMemo(() => makeRun(scn, level, n), [sid, level, n]);
  const verdict = n === total ? scn.verdict(run) : null;
  const last = n > 0 ? scn.steps[n - 1] : null;

  const pickScenario = (k) => { setSid(k); setN(0); };

  return (
    <div className="w-iso">
      <div className="w-title">Two transactions, one table: isolation levels</div>
      <div className="mini-cap">1 · pick a scenario</div>
      <div className="chips" role="group" aria-label="Scenario">
        {Object.keys(SCENARIOS).map((k) => <button key={k} className={k === sid ? 'chip on' : 'chip'} onClick={() => pickScenario(k)}>{SCENARIOS[k].label}</button>)}
      </div>
      <p className="w-desc">{scn.story}</p>

      <div className="mini-cap">2 · pick the isolation level (both transactions use it)</div>
      <div className="chips" role="group" aria-label="Isolation level">
        {LEVELS.map((l) => <button key={l.id} className={l.id === level ? 'chip on' : 'chip'} onClick={() => setLevel(l.id)}>{l.label}</button>)}
      </div>
      <p className="w-desc"><b>{lv.label}</b> <span className="iso-pill">{lv.pill}</span> {lv.desc}</p>

      <div className="row wrap">
        <button className="btn primary" onClick={() => setN(Math.min(total, n + 1))} disabled={n >= total}>Step ▶</button>
        <button className="btn-mini" onClick={() => setN(total)} disabled={n >= total}>run all</button>
        <button className="btn-mini" onClick={() => setN(0)} disabled={n === 0}>reset</button>
        <span className="small">step {n} of {total}. Change the level at any step to see the same moment under another rule.</span>
      </div>
      {last && <p className="w-desc iso-say" aria-live="polite"><b>Step {n}, {last.tx}:</b> {last.say}</p>}

      <DbPanel run={run} scn={scn} />

      <div className="w-iso-lanes" role="group" aria-label="Timeline of the two transactions">
        <div className="iso-head"><div>T1</div><div>T2</div></div>
        {scn.steps.map((st, i) => {
          const e = run.entries[i];
          const done = i < n; const next = i === n;
          return (
            <div key={i} className={`iso-row${done ? '' : ' future'}${next ? ' next' : ''}`}>
              {['T1', 'T2'].map((who) => (
                <div key={who} className={`iso-cell ${who.toLowerCase()}${st.tx === who ? '' : ' iso-empty'}`}>
                  {st.tx === who && (
                    <>
                      <div className="iso-sql"><span className="iso-no">{i + 1}</span>{e ? e.sql : (st.sql || (st.op === 'begin' ? `BEGIN ISOLATION LEVEL ${lv.sql};` : st.op === 'commit' ? 'COMMIT;' : 'ROLLBACK;'))}</div>
                      {e && e.lines.map((l, k) => <div key={k} className={`iso-line ${l.tone}`}>{l.text}</div>)}
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {verdict && <div className={verdict.bad ? 'verdict bad' : 'verdict ok'} role="status"><b>{verdict.head}.</b> {verdict.text}</div>}

      <div className="mini-cap" style={{ marginTop: 14 }}>What each level allows in PostgreSQL (your current scenario and level are highlighted)</div>
      <div className="w-iso-matrix">
        <table className="grid mini">
          <thead><tr><th>level</th>{COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {LEVELS.map((l) => (
              <tr key={l.id} className={l.id === level ? 'iso-hl-row' : ''}>
                <td>{l.label}</td>
                {MATRIX[l.id].map((v, ci) => <td key={ci} className={`iso-m ${CELL[v][1]}${l.id === level && ci === scn.col ? ' iso-hl' : ''}`}>{CELL[v][0]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small">* A lost update can only happen when the program computes the new value itself and writes it back. <code>SET balance = balance + n</code> is safe at READ COMMITTED. "Stopped by error" means PostgreSQL raises error 40001 and your code must run the transaction again. READ UNCOMMITTED is the textbook rule; PostgreSQL runs it as READ COMMITTED. The deadlock scenario is not in this table because a deadlock can happen at every level.</p>
    </div>
  );
}

// Exported so the engine can be checked outside the browser (see the T04 notes in RESUME.md).
export { makeRun, SCENARIOS, LEVELS };
