// ExplainViz engine: runs REAL EXPLAIN (ANALYZE, FORMAT JSON) in PGlite on a 100,000-line table and turns the plan into plain-English facts.
// No UI here, so Node can test it. The widget (ExplainViz.jsx) passes in a PGlite database that already holds the Kollana tables.

export const BIG_ROWS = 100000;

// The 15 real account ids of dim_account, so the table joins to the Kollana dimension.
const ACCOUNTS = '1000,2000,4000,4100,4200,5000,5100,5200,6000,6100,6110,6120,6200,6300,6400';

export const BIG_TABLE_SQL = `CREATE TABLE gl_big AS
SELECT g AS line_id,
       (g + 1) / 2 AS journal_id,
       g % 3 + 1 AS entity_id,
       (ARRAY[${ACCOUNTS}])[g % 15 + 1] AS account_id,
       DATE '2025-04-01' + (g % 365) AS posting_date,
       ROUND(((g::bigint * 7919) % 100000) / 100.0, 2) AS amount,
       CASE WHEN g % 100 = 0 THEN 'Parked' ELSE 'Posted' END AS status
FROM generate_series(1, ${BIG_ROWS}) AS g`;

// What the learner can switch. Every lever is a real change to the real database.
export const LEVERS = {
  idxJournal: { label: 'index on journal_id', sql: 'CREATE INDEX gl_big_journal_idx ON gl_big (journal_id)' },
  idxDate: { label: 'index on posting_date', sql: 'CREATE INDEX gl_big_date_idx ON gl_big (posting_date)' },
  idxAmount: { label: 'index on amount', sql: 'CREATE INDEX gl_big_amount_idx ON gl_big (amount)' },
  stats: { label: 'ANALYZE has run (statistics exist)' },
};

export const SCENARIOS = [
  {
    id: 'one-journal',
    title: 'Find one journal',
    story: 'An auditor asks for the lines of journal 4242. The table has 100,000 lines and the journal has 2 of them.',
    levers: ['idxJournal', 'stats'],
    sql: () => 'SELECT * FROM gl_big WHERE journal_id = 4242',
  },
  {
    id: 'month',
    title: 'One month of postings',
    story: 'January 2026 is about 8,500 of the 100,000 lines. You can write the filter as a range, or wrap the column in a function.',
    levers: ['idxDate', 'stats'],
    forms: [
      { id: 'range', label: 'a range on the column', sql: "SELECT * FROM gl_big WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01'" },
      { id: 'func', label: 'EXTRACT(MONTH ...) = 1', sql: 'SELECT * FROM gl_big WHERE EXTRACT(MONTH FROM posting_date) = 1' },
    ],
  },
  {
    id: 'join-all',
    title: 'Total per account',
    story: 'Join every line to the 15-row account table and add up the amounts. Nothing is filtered, so every line is needed.',
    levers: ['stats'],
    sql: () => 'SELECT a.account_name, SUM(g.amount) AS total\nFROM gl_big g\nJOIN dim_account a ON a.account_id = g.account_id\nGROUP BY a.account_name',
  },
  {
    id: 'join-one',
    title: 'Join, but only one journal',
    story: 'The same join, now for the two lines of journal 4242. With a tiny result the planner may choose a different join method.',
    levers: ['idxJournal', 'stats'],
    sql: () => 'SELECT a.account_name, g.amount\nFROM gl_big g\nJOIN dim_account a ON a.account_id = g.account_id\nWHERE g.journal_id = 4242',
  },
  {
    id: 'top-n',
    title: 'The five biggest lines',
    story: 'Show the five lines with the largest amount. The planner can sort everything, or walk an index from the big end and stop.',
    levers: ['idxAmount', 'stats'],
    sql: () => 'SELECT * FROM gl_big ORDER BY amount DESC LIMIT 5',
  },
];

export const defaultState = () => ({ idxJournal: false, idxDate: false, idxAmount: false, stats: false });

export const stateKey = (st) => ['idxJournal', 'idxDate', 'idxAmount', 'stats'].map((k) => (st[k] ? '1' : '0')).join('');

export function queryFor(scn, formId) {
  if (scn.forms) return (scn.forms.find((f) => f.id === formId) || scn.forms[0]).sql;
  return scn.sql();
}

// Rebuild the table from scratch in the requested state. Rebuilding is the only honest way to switch "statistics" off again.
export async function buildState(db, st) {
  await db.exec('DROP TABLE IF EXISTS gl_big');
  await db.exec(BIG_TABLE_SQL);
  for (const k of ['idxJournal', 'idxDate', 'idxAmount']) if (st[k]) await db.exec(LEVERS[k].sql);
  if (st.stats) await db.exec('ANALYZE gl_big; ANALYZE dim_account;');
}

const asJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

// Runs EXPLAIN ANALYZE (no timings, so the numbers are repeatable) and returns the root plan node plus a few facts.
export async function explain(db, sql) {
  const r = await db.query(`EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT JSON) ${sql}`);
  const doc = asJson(Object.values(r.rows[0])[0])[0];
  const root = doc.Plan;
  return { root, planningMs: doc['Planning Time'], executionMs: doc['Execution Time'], pages: pages(root), rows: totalRows(root), cost: root['Total Cost'] };
}

const pages = (n) => (n['Shared Hit Blocks'] || 0) + (n['Shared Read Blocks'] || 0);
export const totalRows = (n) => Math.round((n['Actual Rows'] || 0) * (n['Actual Loops'] || 1));

// How far off was the planner? A factor of 1 means a perfect guess.
export function estimateFactor(n) {
  // 'Plan Rows' and 'Actual Rows' are both per loop, so compare them directly.
  const est = Math.max(1, n['Plan Rows'] || 0);
  const act = Math.max(1, n['Actual Rows'] || 0);
  return Math.max(est, act) / Math.min(est, act);
}

// A node under a LIMIT is allowed to stop early, so its row count is naturally far below the estimate: that is not a bad guess.
export function misestimate(n, underLimit = false) {
  if (underLimit) return { level: 'ok', factor: 1, early: true };
  const f = estimateFactor(n);
  if (f >= 10) return { level: 'bad', factor: f };
  if (f >= 3) return { level: 'warn', factor: f };
  return { level: 'ok', factor: f };
}

export const label = (n) => {
  const t = n['Node Type'];
  if (t === 'Aggregate') return n.Strategy === 'Hashed' ? 'HashAggregate' : n.Strategy === 'Sorted' ? 'GroupAggregate' : 'Aggregate';
  if (/Join$/.test(t) || t === 'Nested Loop') return t;
  return t;
};

// Plain-English help for every node type that can appear in the five scenarios (and a safe fallback).
export const NODE_HELP = {
  'Seq Scan': { what: 'Reads the whole table from the first page to the last and keeps the rows that pass the filter.', good: 'Fine when you need most of the table, or the table is small.', bad: 'Slow when you need a few rows out of many: "Rows Removed by Filter" is the work that was thrown away.' },
  'Index Scan': { what: 'Walks the index to the matching entries, then fetches each row from the table.', good: 'Fast for a few rows.', bad: 'Each row is a separate trip to the table, so it loses to a Seq Scan when many rows match.' },
  'Index Only Scan': { what: 'Answers the query from the index alone, without visiting the table.', good: 'The cheapest read when the index holds every column you need.', bad: 'Needs a recently vacuumed table to skip the table visits.' },
  'Bitmap Index Scan': { what: 'Reads the index and builds a map of which table pages hold matching rows.', good: 'Cheap way to find where the rows are.', bad: 'On its own it returns no rows: the Bitmap Heap Scan above it fetches them.' },
  'Bitmap Heap Scan': { what: 'Visits the table pages named by the bitmap, in page order, and rechecks the condition.', good: 'Good for a medium number of rows: each page is read once.', bad: 'If almost every page is on the map, a plain Seq Scan would have been simpler.' },
  'Nested Loop': { what: 'For each row from the first input, looks up matching rows in the second input.', good: 'Excellent when the first input is tiny and the second has an index.', bad: 'Terrible when the first input is big and the second has no index: the inner side runs once per row.' },
  'Hash Join': { what: 'Loads the smaller input into an in-memory hash table, then streams the bigger input past it.', good: 'The usual choice to join large inputs on equality.', bad: 'Needs memory (work_mem) for the hash table. If it does not fit, it spills to disk in batches.' },
  'Merge Join': { what: 'Walks two inputs that are both sorted on the join key, side by side.', good: 'Good when both sides arrive sorted already (from an index, for example).', bad: 'If a side must be sorted first, the Sort node pays for it.' },
  Hash: { what: 'Builds the in-memory hash table that the Hash Join above it probes.', good: 'It sits on the smaller input.', bad: 'Memory use shows in the plan as "Memory Usage" and "Batches".' },
  Sort: { what: 'Orders the rows. A top-N sort keeps only the best few rows while it reads.', good: 'A top-N heapsort for a LIMIT is cheap on memory.', bad: 'A big sort that does not fit in memory spills to disk ("external merge").' },
  Aggregate: { what: 'Computes one summary row (COUNT, SUM, ...) over its input.', good: 'Cheap on top of a good scan.', bad: 'It can only be as fast as the node that feeds it.' },
  HashAggregate: { what: 'Groups rows with a hash table, one entry per group, and adds up each group.', good: 'No sort needed.', bad: 'With millions of groups the hash table is large.' },
  GroupAggregate: { what: 'Groups rows that already arrive sorted by the group key.', good: 'Uses almost no memory.', bad: 'Needs sorted input: a Sort node below it may be the real cost.' },
  Limit: { what: 'Stops asking for rows once enough have been produced.', good: 'Lets the node below stop early. Combined with an index in the right order it can be almost free.', bad: 'Without an index in the ORDER BY order, the node below still has to produce and sort everything.' },
  Materialize: { what: 'Stores the rows of its input in memory so they can be read several times.', good: 'Avoids re-running an expensive inner side.', bad: 'Uses memory.' },
  Memoize: { what: 'Remembers the result of each lookup so a repeated key is answered from a cache.', good: 'Helps a nested loop that looks up the same value again and again.', bad: 'Only helps if keys repeat.' },
};

export const helpFor = (n) => NODE_HELP[label(n)] || NODE_HELP[n['Node Type']] || { what: 'A step of the plan.', good: '', bad: '' };

// One short line for the card: what it touched and what it kept.
export function detail(n) {
  const bits = [];
  const rel = n['Relation Name'];
  if (rel) bits.push(n['Index Name'] ? `${n['Index Name']} on ${rel}` : rel);
  else if (n['Index Name']) bits.push(n['Index Name']);
  if (n['Scan Direction'] === 'Backward') bits.push('walks the index backwards (largest first)');
  if (n['Index Cond']) bits.push(`Index Cond: ${n['Index Cond']}`);
  if (n['Recheck Cond']) bits.push(`Recheck: ${n['Recheck Cond']}`);
  if (n.Filter) bits.push(`Filter: ${n.Filter}`);
  if (n['Hash Cond']) bits.push(`Hash Cond: ${n['Hash Cond']}`);
  if (n['Join Filter']) bits.push(`Join Filter: ${n['Join Filter']}`);
  if (n['Sort Key']) bits.push(`Sort Key: ${n['Sort Key'].join(', ')}`);
  if (n['Group Key']) bits.push(`Group Key: ${n['Group Key'].join(', ')}`);
  return bits;
}

export function extra(n) {
  const out = [];
  if (n['Rows Removed by Filter']) out.push(`${n['Rows Removed by Filter'].toLocaleString('en-IN')} rows read and thrown away by the filter`);
  if (n['Sort Method']) out.push(`${n['Sort Method']}${n['Sort Space Used'] ? ` (${n['Sort Space Used']} kB)` : ''}`);
  if (n['Hash Batches'] > 1) out.push(`hash spilled to ${n['Hash Batches']} batches`);
  if (n['Heap Fetches']) out.push(`${n['Heap Fetches']} table visits`);
  return out;
}

// Flatten the tree so a test (or a caption) can ask "does this plan contain X?"
export function nodes(n, out = []) {
  out.push(n);
  (n.Plans || []).forEach((c) => nodes(c, out));
  return out;
}

// Same walk, but remembers which nodes sit under a LIMIT (they may stop early) and how bad each estimate was.
export function annotate(n, underLimit = false, out = []) {
  const m = misestimate(n, underLimit);
  out.push({ node: n, m });
  (n.Plans || []).forEach((c) => annotate(c, underLimit || n['Node Type'] === 'Limit', out));
  return out;
}

// A verdict sentence for the current plan. It only states things that are visible in the plan.
export function verdict(res) {
  const all = nodes(res.root);
  const scanKinds = all.filter((n) => /Scan$/.test(n['Node Type']) && n['Relation Name'] === 'gl_big');
  const worst = annotate(res.root).map(({ node, m }) => ({ n: node, m })).sort((a, b) => b.m.factor - a.m.factor)[0];
  const parts = [];
  const seq = scanKinds.find((n) => n['Node Type'] === 'Seq Scan');
  const idx = scanKinds.find((n) => /Index|Bitmap/.test(n['Node Type']));
  if (seq && seq['Rows Removed by Filter']) {
    parts.push(`The Seq Scan on gl_big read every row and threw ${seq['Rows Removed by Filter'].toLocaleString('en-IN')} away to return ${totalRows(seq).toLocaleString('en-IN')}.`);
  } else if (seq) {
    parts.push('The Seq Scan on gl_big read the whole table because the query needs the whole table.');
  }
  if (idx) parts.push(`The planner used ${idx['Index Name'] || 'an index'}: it touched ${res.pages.toLocaleString('en-IN')} pages in total.`);
  if (worst && worst.m.level === 'bad') {
    parts.push(`Warning: at "${label(worst.n)}" the planner expected ${Math.max(1, worst.n['Plan Rows']).toLocaleString('en-IN')} row(s) and got ${totalRows(worst.n) === 0 ? 0 : Math.round(worst.n['Actual Rows']).toLocaleString('en-IN')} (about ${Math.round(worst.m.factor)} times off). Bad estimates lead to bad plans.`);
  }
  return parts.join(' ');
}
