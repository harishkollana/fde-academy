// A tiny bank, created in the hidden setup of the playgrounds below.
const BANK = `CREATE TABLE bank_accounts (acct text PRIMARY KEY, balance numeric(12,2) NOT NULL CHECK (balance >= 0));
INSERT INTO bank_accounts VALUES ('OPS', 100000.00), ('PAYROLL', 50000.00);`;

export default {
  id: 'sql-transactions-isolation',
  title: 'Transactions and isolation: all or nothing, and what others can see',
  goal: 'You can group statements into a transaction with BEGIN, COMMIT, ROLLBACK and SAVEPOINT, explain ACID and how MVCC lets readers and writers work together, and predict which anomalies (dirty, non-repeatable and phantom reads, lost update, write skew) each isolation level allows.',
  roadmap: [
    'BEGIN, COMMIT, ROLLBACK, savepoints',
    'ACID, isolation levels, dirty, non-repeatable and phantom reads',
    'MVCC in plain words',
    'IsolationLevels simulator',
  ],
  blocks: [
    `## The problem
Treasury moves ₹50,000 from the OPS account to the PAYROLL account. In the database that is **two statements**: take ₹50,000 from OPS, add ₹50,000 to PAYROLL.

Two things can go wrong.

1. **The server stops between the two statements.** The money has left OPS and never arrived in PAYROLL. ₹50,000 has vanished from the books, and nobody gets an error message.
2. **Someone reads the balances in the middle.** The CFO's dashboard sums all accounts while the transfer is half done and shows ₹50,000 too little. Another process reads OPS, waits a second, reads it again, and gets two different numbers.

The first is a question of **atomicity**: both statements happen, or neither does. The second is a question of **isolation**: what may one running operation see of another's unfinished work? A **transaction** is the tool that answers both. You met the idea of ACID in the foundations phase. This lesson is where you use it, and where you learn what PostgreSQL does when many users work at once.`,
    { sketch: { w: 760, h: 322, caption: 'The same crash with and without a transaction. A transaction makes the two legs of the transfer one unit.', items: [
      { t: 'text', x: 190, y: 26, text: 'Without a transaction', size: 19, bold: true, color: '#e03131' },
      { t: 'box', x: 20, y: 46, w: 340, h: 50, label: 'UPDATE OPS: -50,000', sub: 'committed on its own', fill: 'green', size: 17 },
      { t: 'arrow', x1: 190, y1: 98, x2: 190, y2: 128 },
      { t: 'box', x: 20, y: 130, w: 340, h: 46, label: 'SERVER CRASHES', fill: 'pink', size: 18 },
      { t: 'box', x: 20, y: 192, w: 340, h: 50, label: 'UPDATE PAYROLL: +50,000', sub: 'never runs', fill: 'grey', size: 17 },
      { t: 'note', x: 20, y: 256, w: 340, h: 50, fill: 'pink', size: 15, text: 'Result: ₹50,000 has vanished.\nOPS is lower, PAYROLL is unchanged.' },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 310, dashed: true },
      { t: 'text', x: 570, y: 26, text: 'With a transaction', size: 19, bold: true, color: '#2f9e44' },
      { t: 'box', x: 400, y: 46, w: 340, h: 40, label: 'BEGIN', fill: 'yellow', size: 17 },
      { t: 'box', x: 400, y: 96, w: 340, h: 40, label: 'UPDATE OPS: -50,000 (not final)', fill: 'blue', size: 15 },
      { t: 'box', x: 400, y: 146, w: 340, h: 40, label: 'SERVER CRASHES', fill: 'pink', size: 18 },
      { t: 'box', x: 400, y: 196, w: 340, h: 40, label: 'no COMMIT was reached', fill: 'grey', size: 16 },
      { t: 'note', x: 400, y: 256, w: 340, h: 50, fill: 'green', size: 15, text: 'Result: the first update is undone.\nBoth balances are exactly as before.' },
    ] } },
    `## ACID in four lines
| Letter | Promise | In your books |
|---|---|---|
| **A**tomicity | all statements of a transaction take effect, or none | both legs of a journal are posted, or neither |
| **C**onsistency | a transaction moves the database from one valid state to another; the rules (\`NOT NULL\`, \`CHECK\`, keys) always hold | a balance can never go below zero if a \`CHECK (balance >= 0)\` forbids it |
| **I**solation | concurrent transactions do not see each other's half-finished work (to a degree you choose) | the dashboard never shows a transfer in the middle |
| **D**urability | once committed, the data survives a crash | a posted journal is still there after the power cut |

## The commands
- \`BEGIN\` starts a transaction. Everything after it is provisional.
- \`COMMIT\` makes all the changes permanent and visible to others, all at once.
- \`ROLLBACK\` throws every change since \`BEGIN\` away.
- \`SAVEPOINT name\` marks a point inside the transaction. \`ROLLBACK TO SAVEPOINT name\` undoes only what came after it and keeps the transaction going.

Without \`BEGIN\`, every statement is its own tiny transaction that commits at once (**autocommit**). That is why the safe routine of the last lesson opens a transaction first. Four facts that surprise people:
- **An error aborts the transaction.** After a failed statement, PostgreSQL answers every command with *current transaction is aborted, commands ignored until end of transaction block* until you \`ROLLBACK\` (or roll back to a savepoint). A savepoint is how you retry one step without losing the rest.
- **DDL is transactional in PostgreSQL.** A \`CREATE TABLE\` inside a transaction disappears on \`ROLLBACK\`. That makes schema changes testable, and most other databases cannot do this.
- **Sequences are not rolled back.** An identity or serial column that handed out a number inside a rolled-back transaction does not take it back, so ids have **gaps**. Never use a sequence for "gap-free" numbers such as invoice numbers.
- **\`SET TRANSACTION ISOLATION LEVEL\`** must be the first thing after \`BEGIN\` (or write \`BEGIN ISOLATION LEVEL REPEATABLE READ\`), or you get *must be called before any query*.`,
    { sql: {
      title: 'Commit, rollback, a savepoint and a CHECK',
      setup: BANK,
      starter: `-- 1) A transfer that is rolled back: the half-done state is visible only inside the transaction
BEGIN;
UPDATE bank_accounts SET balance = balance - 50000 WHERE acct = 'OPS';
SELECT acct, balance FROM bank_accounts ORDER BY acct;     -- inside: OPS is 50,000
ROLLBACK;
SELECT acct, balance FROM bank_accounts ORDER BY acct;     -- after: back to 1,00,000

-- 2) A transfer with a savepoint: the second leg goes wrong, and only that step is undone
BEGIN;
UPDATE bank_accounts SET balance = balance - 20000 WHERE acct = 'OPS';
SAVEPOINT after_first_leg;
UPDATE bank_accounts SET balance = balance + 99999 WHERE acct = 'PAYROLL';   -- a typo: wrong amount
SELECT acct, balance FROM bank_accounts ORDER BY acct;
ROLLBACK TO SAVEPOINT after_first_leg;                                       -- undo only the typo
UPDATE bank_accounts SET balance = balance + 20000 WHERE acct = 'PAYROLL';   -- the correct second leg
COMMIT;
SELECT acct, balance FROM bank_accounts ORDER BY acct;

-- 3) The CHECK constraint protects consistency (remove the dashes to see the error; it is the last statement)
-- UPDATE bank_accounts SET balance = balance - 500000 WHERE acct = 'OPS';`,
      note: 'In the first transfer OPS shows 50,000 inside the transaction and 1,00,000 after the ROLLBACK. In the second, PAYROLL briefly holds 1,49,999 (the typo), the savepoint rollback removes only that step, and the committed result is OPS 80,000 and PAYROLL 70,000. The error from the CHECK reads: new row for relation "bank_accounts" violates check constraint "bank_accounts_balance_check".',
    } },
    { warn: '**A gotcha of this browser playground.** It sends your whole script to PostgreSQL as **one message**. In that mode, PostgreSQL treats everything after a `COMMIT` or `ROLLBACK`, up to the end of the script, as one new **implicit** transaction, and a later `BEGIN` only prints a warning ("already a transaction in progress"). A `ROLLBACK` further down can then undo more than you meant, even a `CREATE TABLE` from earlier in the same script. DBeaver and psql send statements one at a time, so they do not do this. To keep a demo safe here, **end every experiment with an explicit `COMMIT` or `ROLLBACK`**, as the scripts in this lesson do.' },
    { sql: {
      title: 'DDL is transactional, and sequences leave gaps',
      starter: `-- A table created inside a transaction vanishes on ROLLBACK
BEGIN;
CREATE TABLE scratch_table (x int);
INSERT INTO scratch_table VALUES (1);
ROLLBACK;
SELECT to_regclass('scratch_table') AS scratch_table_exists;        -- NULL: it was never created

-- An identity column keeps the number it handed out in a rolled-back transaction
BEGIN;
CREATE TABLE ledger_notes (note_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, note text);
INSERT INTO ledger_notes (note) VALUES ('first');
COMMIT;                                                              -- the table and row 1 are now permanent

BEGIN;
INSERT INTO ledger_notes (note) VALUES ('this one is rolled back');
ROLLBACK;

BEGIN;
INSERT INTO ledger_notes (note) VALUES ('second');
COMMIT;

SELECT note_id, note FROM ledger_notes ORDER BY note_id;`,
      note: 'scratch_table_exists is NULL. The ledger notes have ids 1 and 3: the rolled-back row used id 2, and the sequence does not give it back. Never use a sequence for numbers that must have no gaps.',
    } },
    `## MVCC: how PostgreSQL lets everyone work at once
A simple database would **lock** a row while someone changes it, and make everyone else wait, including readers. PostgreSQL does better with **MVCC** (multi-version concurrency control). In plain words:

- An \`UPDATE\` does **not overwrite** a row. It writes a **new version** of the row and marks the old version as replaced. Both versions exist for a while.
- Every version carries the number of the transaction that **created** it (\`xmin\`) and, if it was replaced or deleted, the number of the transaction that **ended** it (\`xmax\`).
- Each query works with a **snapshot**: the list of which transactions had committed at a given moment. It sees a version only if its creator was committed in the snapshot and its ender was not.
- So a reader simply reads the version that fits its snapshot. **Readers never block writers, and writers never block readers.** Only two writers on the **same row** have to wait for each other.
- Old versions nobody can see any more are cleaned up later by \`VACUUM\` (the performance module).

You can watch it: the hidden column \`ctid\` is the physical position of a row version. After an \`UPDATE\`, the row has a **new** \`ctid\`, because it is a new version.`,
    { sketch: { w: 760, h: 310, caption: 'MVCC in one picture. The UPDATE writes version 2 and leaves version 1 behind. Each reader gets the version that matches its snapshot. (Transaction numbers are illustrative.)', items: [
      { t: 'text', x: 380, y: 24, text: 'one row: the OPS balance', size: 17, bold: true },
      { t: 'box', x: 40, y: 40, w: 300, h: 72, label: 'version 1: ₹1,00,000', sub: 'created by tx 100, replaced by tx 105', fill: 'blue', size: 17 },
      { t: 'box', x: 420, y: 40, w: 300, h: 72, label: 'version 2: ₹1,50,000', sub: 'created by tx 105 (committed)', fill: 'green', size: 17 },
      { t: 'arrow', x1: 342, y1: 76, x2: 418, y2: 76, label: 'UPDATE', lx: 0, ly: -12 },
      { t: 'arrow', x1: 190, y1: 152, x2: 190, y2: 116, color: '#1971c2' },
      { t: 'person', x: 190, y: 172, label: 'reader A' },
      { t: 'arrow', x1: 570, y1: 152, x2: 570, y2: 116, color: '#2f9e44' },
      { t: 'person', x: 570, y: 172, label: 'reader B' },
      { t: 'note', x: 20, y: 252, w: 345, h: 50, fill: 'blue', size: 14, text: 'A took its snapshot BEFORE tx 105 committed,\nso it keeps seeing version 1: ₹1,00,000.' },
      { t: 'note', x: 395, y: 252, w: 345, h: 50, fill: 'green', size: 14, text: 'B took its snapshot AFTER tx 105 committed,\nso it sees version 2: ₹1,50,000.' },
    ] } },
    { sql: {
      title: 'An UPDATE creates a new row version',
      setup: BANK,
      starter: `-- ctid = where the row version physically lives (page, position)
SELECT ctid, acct, balance FROM bank_accounts ORDER BY acct;

UPDATE bank_accounts SET balance = balance + 50000 WHERE acct = 'OPS';

-- OPS has a NEW ctid: it is a new version. PAYROLL was not touched, so it did not move.
SELECT ctid, acct, balance FROM bank_accounts ORDER BY acct;

-- The transaction numbers that created the current versions (they differ per row)
SELECT acct, xmin::text AS created_by_tx FROM bank_accounts ORDER BY acct;`,
      note: 'Your exact ctid and transaction numbers may differ from someone else\'s, but the pattern is the same: after the UPDATE the OPS row sits at a new ctid and has a newer creating transaction, while PAYROLL keeps its old ones. The old version of OPS is still stored (invisible to new queries) until VACUUM removes it.',
    } },
    `## Isolation levels
Isolation is a **dial**. The more protection you ask for, the more PostgreSQL has to check, and the more often it may have to stop one of your transactions. The SQL standard names five **anomalies** that overlapping transactions can cause. Here they are with the finance example you will use in the simulator below:

- **Dirty read**: you read a change that another transaction has **not committed**, and it may be rolled back (a cash dashboard shows a transfer that is later cancelled).
- **Non-repeatable read**: you read a row twice in one transaction and get **different values**, because someone committed in between (a report contradicts itself).
- **Phantom read**: you run the same query twice and a **new row** appears (a count of large invoices grows).
- **Lost update**: two transactions read the same value, both compute a new one in the program and write back, and one write **silently erases** the other.
- **Write skew**: two transactions each check a rule using what they read, then each write a **different** row. Each is fine alone, and together they break the rule (the budget limit).

PostgreSQL offers three real levels:

| Level | What it means in PostgreSQL |
|---|---|
| \`READ COMMITTED\` (**default**) | each **statement** sees the data committed when that statement started. Later statements in the same transaction can see newer data. (\`READ UNCOMMITTED\` is accepted but behaves exactly like this level, so PostgreSQL has **no dirty reads**) |
| \`REPEATABLE READ\` | the whole transaction sees **one snapshot**, taken at its first statement. New rows are hidden too (no phantoms). Updating a row that changed after your snapshot fails with error 40001 |
| \`SERIALIZABLE\` | as if the transactions ran one after another. PostgreSQL watches read/write dependencies and aborts one transaction (error 40001) if the result could differ from any serial order |

Set the level with \`BEGIN ISOLATION LEVEL REPEATABLE READ;\`, or \`SET TRANSACTION ISOLATION LEVEL …\` as the first statement after \`BEGIN\`. \`SHOW transaction_isolation\` shows the current one, and \`default_transaction_isolation\` is the default for new transactions.

### Play with it
Two transactions, T1 and T2, run a fixed script. Pick a **scenario**, pick the **level**, press **Step** (or **run all**) and watch. Row locks, waiting and errors are all calculated, not drawn. Change the level in the middle of a script to see the same moment under another rule. The table at the bottom shows what each level allows, and highlights your current choice.

Things to try (every result below is what the simulator shows):
1. **Dirty read** with *READ UNCOMMITTED*: T1 reads ₹1,50,000, a balance that is rolled back afterwards. Switch to *READ COMMITTED* and T1 reads ₹1,00,000. (The textbook level is shown only so that you can see what it would do; PostgreSQL never does it.)
2. **Non-repeatable read** at *READ COMMITTED*: T1 reads ₹1,00,000 and then ₹1,50,000. At *REPEATABLE READ* both reads show ₹1,00,000.
3. **Lost update (value computed in the app)** at *READ COMMITTED*: the balance ends at ₹1,30,000, and the ₹20,000 receipt of T1 is wiped out with no error. At *REPEATABLE READ* T2 gets error 40001 and the table keeps ₹1,20,000.
4. **Lost update, avoided (atomic UPDATE)** at *READ COMMITTED*: T2 waits for the row lock and then adds to the new balance: ₹1,50,000. Nothing is lost, so \`SET balance = balance + n\` is the safe way to write it.
5. **Write skew** at *READ COMMITTED* **and** at *REPEATABLE READ*: both approvers pass the check and the OPS budget ends at ₹1,30,000, over its ₹1,00,000 limit. Only *SERIALIZABLE* stops it: T2 fails at commit.
6. **Deadlock**: this one belongs to the next lesson, but try it now: whatever the level, one transaction is cancelled.`,
    { widget: 'IsolationLevels' },
    `## Retry the transaction when PostgreSQL asks you to
Two of the errors above are not bugs. They are PostgreSQL saying "I protected your data by cancelling this transaction; please run it again":

| SQLSTATE | Name | Seen when |
|---|---|---|
| \`40001\` | serialization_failure | REPEATABLE READ or SERIALIZABLE found a conflict |
| \`40P01\` | deadlock_detected | two transactions waited for each other |

Your program must **catch these two codes and run the whole transaction again from the start**, with a short wait that grows (the retry-with-backoff idea from the foundations simulator), and give up after a few attempts. Re-running only the failed statement is wrong: the transaction is aborted and the values it read may be stale. This sketch is for your laptop later (it uses the \`psycopg\` library, which is not available in the browser):

\`\`\`python
import time
import psycopg

RETRYABLE = {"40001", "40P01"}            # serialization_failure, deadlock_detected

def run_with_retry(conn, work, attempts=5):
    for attempt in range(1, attempts + 1):
        try:
            with conn.transaction():       # BEGIN ... COMMIT, or ROLLBACK if an exception is raised
                return work(conn)          # all the reads and writes of one unit of work
        except psycopg.Error as e:
            if e.sqlstate not in RETRYABLE or attempt == attempts:
                raise                      # a real error, or out of attempts
            time.sleep(0.1 * 2 ** attempt) # back off, then run the WHOLE transaction again
\`\`\`
Keep transactions **short and small**: do the slow work (calling an API, waiting for a human, reading a big file) **outside** the transaction. A transaction left open ("idle in transaction") holds locks and stops VACUUM from cleaning up old row versions. \`idle_in_transaction_session_timeout\` is the safety net that closes forgotten ones.`,
    { local: `**Two sessions, one table.** You need two PowerShell windows with \`psql\` connected to \`fde_practice\`, and this table (create it once in either window):

\`\`\`sql
CREATE TABLE bank_accounts (acct text PRIMARY KEY, balance numeric(12,2) NOT NULL CHECK (balance >= 0));
INSERT INTO bank_accounts VALUES ('OPS', 100000.00), ('PAYROLL', 50000.00);
\`\`\`
In **both** windows type \`\\t on\` and \`\\pset format unaligned\`, so that every query prints just its value on one line. Then follow the table.

**Experiment 1: a non-repeatable read at the default level.**

| # | Session A | Session B | Output to expect |
|---|---|---|---|
| 1 | \`BEGIN;\` | | \`BEGIN\` |
| 2 | \`SELECT balance FROM bank_accounts WHERE acct = 'OPS';\` | | \`100000.00\` |
| 3 | | \`UPDATE bank_accounts SET balance = balance + 50000 WHERE acct = 'OPS';\` | \`UPDATE 1\` (autocommit: already final) |
| 4 | \`SELECT balance FROM bank_accounts WHERE acct = 'OPS';\` | | \`150000.00\`, different from step 2 |
| 5 | \`COMMIT;\` | | \`COMMIT\` |

Put the balance back with \`UPDATE bank_accounts SET balance = 100000 WHERE acct = 'OPS';\` and repeat the experiment, but start Session A with **\`BEGIN ISOLATION LEVEL REPEATABLE READ;\`**. Step 4 now prints \`100000.00\` again, and only after \`COMMIT\` does a new query show \`150000.00\`.

**Experiment 2: the error that asks for a retry.** Reset the balance. In Session A: \`BEGIN ISOLATION LEVEL REPEATABLE READ;\` then \`SELECT balance FROM bank_accounts WHERE acct = 'OPS';\` (prints \`100000.00\`). In Session B: \`UPDATE bank_accounts SET balance = balance + 50000 WHERE acct = 'OPS';\` (prints \`UPDATE 1\`). Back in Session A: \`UPDATE bank_accounts SET balance = balance + 20000 WHERE acct = 'OPS';\` prints

\`\`\`text
ERROR:  could not serialize access due to concurrent update
\`\`\`
Now every command in Session A is answered with *current transaction is aborted, commands ignored until end of transaction block*. Type \`ROLLBACK;\` and start the transaction again. That is exactly what the retry loop above does for you.` },
    { warn: 'A transaction is **not** a lock on the whole table, and a higher isolation level is **not** a cure for slow code. `SERIALIZABLE` everywhere means more cancelled transactions and more retries. A sensible default is `READ COMMITTED` with atomic updates (`SET balance = balance + n`), constraints that protect your rules, and `REPEATABLE READ` for a report that reads several tables and needs them to agree. Use `SERIALIZABLE` only for rules that span several rows (like the budget limit), and always with a retry loop.' },
    `## Practice
These challenges use only \`SELECT\`. They are the **monitoring queries** that find, after the fact, the damage the anomalies above would have done.`,
    { challenge: {
      id: 'sql-transactions-isolation-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Atomicity check on the ledger. In `fact_gl` a journal is posted as exactly **two lines**. Return the journals that do **not** have exactly two lines: `journal_id, lines`, sorted by `journal_id`. (3 rows: the journals whose lines were loaded twice.)',
      hint: 'GROUP BY journal_id HAVING COUNT(*) <> 2.',
      solution: `SELECT journal_id, COUNT(*) AS lines
FROM fact_gl
GROUP BY journal_id
HAVING COUNT(*) <> 2
ORDER BY journal_id`,
    } },
    { challenge: {
      id: 'sql-transactions-isolation-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Find the write skew after the fact. The limits and payments are in the starter. Return the departments whose **total payments exceed their limit**: `dept, total_paid, budget_limit, over_by`, where `over_by = total_paid - budget_limit`. Sort by `dept`. (1 row: OPS, paid 1,30,000 against a limit of 1,00,000, over by 30,000.)',
      starter: `WITH limits(dept, budget_limit) AS (
  VALUES ('OPS', 100000), ('TECH', 200000)
),
payments(payment_id, dept, amount) AS (
  VALUES (1, 'OPS', 50000), (2, 'OPS', 40000), (3, 'OPS', 40000),
         (4, 'TECH', 120000), (5, 'TECH', 50000)
)
SELECT l.dept
FROM limits l
ORDER BY l.dept`,
      hint: 'Join limits to payments grouped by dept (SUM(amount)), then HAVING SUM(p.amount) > l.budget_limit.',
      solution: `WITH limits(dept, budget_limit) AS (
  VALUES ('OPS', 100000), ('TECH', 200000)
),
payments(payment_id, dept, amount) AS (
  VALUES (1, 'OPS', 50000), (2, 'OPS', 40000), (3, 'OPS', 40000),
         (4, 'TECH', 120000), (5, 'TECH', 50000)
)
SELECT l.dept,
       SUM(p.amount)                    AS total_paid,
       l.budget_limit,
       SUM(p.amount) - l.budget_limit   AS over_by
FROM limits l
JOIN payments p ON p.dept = l.dept
GROUP BY l.dept, l.budget_limit
HAVING SUM(p.amount) > l.budget_limit
ORDER BY l.dept`,
    } },
    { challenge: {
      id: 'sql-transactions-isolation-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Detect lost updates in an audit log. Each row of the log is an update that a program computed from the balance it **read** (`read_balance`) and then wrote (`written_balance`), in commit order (`seq`). An update is **stale** when the balance it read is not the balance written by the **previous** committed update. Return the stale updates: `seq, tx, read_balance, previous_written`, sorted by `seq`. (2 rows: sequence 2 and sequence 5.)',
      starter: `WITH log(seq, tx, read_balance, written_balance) AS (
  VALUES (1, 'T1', 100000, 120000),
         (2, 'T2', 100000, 130000),
         (3, 'T3', 130000, 135000),
         (4, 'T4', 135000, 140000),
         (5, 'T5', 135000, 150000)
)
SELECT seq, tx
FROM log
ORDER BY seq`,
      hint: 'LAG(written_balance) OVER (ORDER BY seq) gives the previous written balance. Do the comparison in an outer query or a CTE, because a window function cannot be used in WHERE. The first row has no previous value, so it is not stale.',
      solution: `WITH log(seq, tx, read_balance, written_balance) AS (
  VALUES (1, 'T1', 100000, 120000),
         (2, 'T2', 100000, 130000),
         (3, 'T3', 130000, 135000),
         (4, 'T4', 135000, 140000),
         (5, 'T5', 135000, 150000)
),
checked AS (
  SELECT seq, tx, read_balance,
         LAG(written_balance) OVER (ORDER BY seq) AS previous_written
  FROM log
)
SELECT seq, tx, read_balance, previous_written
FROM checked
WHERE previous_written IS NOT NULL
  AND read_balance <> previous_written
ORDER BY seq`,
    } },
    { real: 'Most production problems with transactions are not exotic. They are (1) a script without a transaction that dies halfway, (2) a transaction left open while a program waits for a human or an API, and (3) a read-modify-write done in application code instead of one atomic `UPDATE`. For month-end reports that read several tables, run them in one `REPEATABLE READ` transaction so that all the totals come from one snapshot. For rules that span rows, add the monitoring query that proves the rule holds (like the budget check above), even if you also use `SERIALIZABLE`. And in every pipeline: small transactions, idempotent steps, a retry loop for 40001 and 40P01.' },
    { interview: '"Explain isolation levels and which anomalies each prevents. What does PostgreSQL do differently?" Model answer: "The SQL standard defines read uncommitted, read committed, repeatable read and serializable, with dirty reads, non-repeatable reads and phantoms as the anomalies. PostgreSQL implements three real levels: READ UNCOMMITTED behaves as READ COMMITTED, so there are no dirty reads. READ COMMITTED gives every statement a fresh snapshot. REPEATABLE READ uses one snapshot for the whole transaction, which also prevents phantoms, and raises a serialization failure if you update a row that changed after your snapshot. SERIALIZABLE adds detection of read/write dependencies and aborts a transaction that would break serial order, which prevents write skew. All of it rests on MVCC: updates create new row versions, so readers never block writers. The application must retry on SQLSTATE 40001 and 40P01." Follow-ups: "What is write skew? Give an example." (two approvers each check the budget and insert a different payment) and "How do you avoid a lost update?" (an atomic UPDATE, SELECT … FOR UPDATE, or a version column).' },
    `## Recap
- A **transaction** (\`BEGIN … COMMIT/ROLLBACK\`) makes statements **atomic**. Without \`BEGIN\` every statement commits by itself. \`SAVEPOINT\` lets you undo part of a transaction. An error aborts the transaction until \`ROLLBACK\`. DDL is transactional, and sequences leave gaps.
- **ACID**: atomicity, consistency (constraints), isolation, durability.
- **MVCC**: an \`UPDATE\` writes a new row version; each query reads the version that fits its **snapshot**. Readers and writers do not block each other; two writers on the same row do.
- Anomalies: **dirty read**, **non-repeatable read**, **phantom read**, **lost update**, **write skew**. PostgreSQL has no dirty reads. \`READ COMMITTED\` (default) allows non-repeatable reads, phantoms, app-computed lost updates and write skew. \`REPEATABLE READ\` stops the first three and turns a lost update into error 40001, but still allows write skew. \`SERIALIZABLE\` stops them all, at the price of retries.
- Avoid lost updates with an atomic \`UPDATE … SET x = x + n\`. Stop write skew with \`SERIALIZABLE\` (and a retry loop) or an explicit lock.
- **Retry the whole transaction** on 40001 and 40P01. Keep transactions short, and do slow work outside them.`,
  ],
  quiz: [
    { q: 'What does ROLLBACK do?', o: ['Commits the changes and starts a new transaction', 'Stops the server', 'Deletes the table', 'Throws away every change made since BEGIN'], a: 3, why: 'ROLLBACK discards all changes of the current transaction, so the data is exactly as it was at BEGIN.' },
    { q: 'A transaction reads the same row twice and gets two different values because another transaction committed in between. What is this called?', o: ['Non-repeatable read', 'Dirty read', 'Phantom read', 'Write skew'], a: 0, why: 'A dirty read sees uncommitted data, and a phantom is a new row. Seeing a committed change to the same row between two reads is a non-repeatable read.' },
    { q: 'What is the default transaction isolation level in PostgreSQL?', o: ['SERIALIZABLE', 'REPEATABLE READ', 'READ COMMITTED', 'READ UNCOMMITTED'], a: 2, why: 'READ COMMITTED is the default (SHOW default_transaction_isolation says read committed).' },
    { q: 'In PostgreSQL, what does READ UNCOMMITTED do?', o: ['Allows dirty reads', 'Behaves exactly like READ COMMITTED, so dirty reads never happen', 'Behaves like SERIALIZABLE', 'Raises an error'], a: 1, why: 'PostgreSQL accepts the keyword for compatibility but gives READ COMMITTED. It never shows uncommitted data.' },
    { q: 'What does MVCC make possible?', o: ['Readers and writers do not block each other, because an UPDATE writes a new row version and each query reads the version for its snapshot', 'Every query locks the whole table', 'Transactions can never fail', 'Rows are never stored twice'], a: 0, why: 'Multi-version concurrency control keeps old and new versions of a row, so a reader keeps seeing its snapshot while a writer creates the next version.' },
    { q: 'Which SQLSTATE codes should your program catch to retry the whole transaction?', o: ['23505 and 23503', '42601 and 42703', '40001 and 40P01', '08006 and 57014'], a: 2, why: '40001 is serialization_failure and 40P01 is deadlock_detected. Both mean "run the transaction again". The others are errors like duplicate keys or syntax errors, which a retry cannot fix.' },
  ],
  task: {
    title: 'See isolation with two sessions on your laptop',
    steps: [
      'In DBeaver or psql (database fde_practice), create the `bank_accounts` table from the lesson. Put your script in `21_transactions.sql` in `C:\\sql-practice`.',
      'Single session: run the rolled-back transfer, then the transfer with a savepoint. Write the balances you see inside and after the transaction (expect OPS 50,000 inside and 1,00,000 after the rollback). Then show that a table created inside a transaction disappears on ROLLBACK.',
      'Two sessions, Experiment 1: reproduce the non-repeatable read at READ COMMITTED (100000.00 then 150000.00) and the stable read at REPEATABLE READ (100000.00 twice). Write the six outputs in a comment.',
      'Two sessions, Experiment 2: reproduce `ERROR:  could not serialize access due to concurrent update` under REPEATABLE READ, then ROLLBACK. Write in one comment what your retry loop would do next.',
      'In the lesson simulator, find the one scenario and level where write skew is stopped, and note in a comment what error T2 receives and why your code needs a retry loop.',
    ],
    deliverable: '`21_transactions.sql` with the commands of each experiment as comments and the outputs you saw, including the exact error text of the serialization failure.',
  },
};
