import { PERF_SETUP } from './shared.js';

const PLAN_COST = `CREATE FUNCTION plan_cost(q text) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE j json;
BEGIN
  EXECUTE 'EXPLAIN (FORMAT JSON) ' || q INTO j;
  RETURN (j->0->'Plan'->>'Total Cost')::numeric;
END $$;`;

export default {
  id: 'sql-explain-deep',
  title: 'Reading query plans: nodes, joins, the cost model and statistics',
  goal: 'You can read an EXPLAIN ANALYZE plan from the inside out, tell scans and joins apart, explain how the planner turns statistics into a cost, find the first bad row estimate, and fix it.',
  roadmap: [
    'Scan and join nodes',
    'Nested loop vs hash vs merge join',
    'Cost model, statistics and ANALYZE',
    'Bad row estimates',
  ],
  blocks: [
    `## The problem
A month-end report ran well for months. Last night it took far longer, although **nobody changed the SQL**. The database is the same, the indexes are the same. What changed is the **data**: yesterday's bulk load added a lot of rows, and PostgreSQL **picked a different plan**.

To fix a problem like this you must be able to **read a plan**. A plan is PostgreSQL's own explanation of how it will answer your query, and it tells you exactly where the work goes. In the last two lessons you looked at the top line and the Buffers. Now you will read the whole tree: every kind of step, how the planner chooses between them, and why it sometimes chooses wrongly.`,
    `## How PostgreSQL turns SQL into a plan
Your SQL does not say *how* to get the answer, only *what* the answer is. A part of PostgreSQL called the **planner** (or optimizer) decides how. It works in four steps:

1. **Parse and rewrite.** Check the syntax, expand views.
2. **Plan.** Consider many ways to run the query: which table to scan first, scan or index, which join algorithm, in which order. For each way it **estimates a cost**, and it picks the cheapest.
3. **Execute.** The executor runs the chosen plan.
4. **Return** the rows.

The cost estimate depends on **statistics**: facts about your data that \`ANALYZE\` collects (how many rows, how many distinct values, which values are common). **The planner never looks at your data while planning. It only reads the statistics.** If the statistics are wrong or missing, the estimates are wrong, and a wrong estimate leads to a wrong plan.

\`EXPLAIN\` stops after step 2 and prints the plan with the **estimates**. \`EXPLAIN ANALYZE\` also runs step 3 and adds the **actual** numbers. The gap between estimated and actual is the most useful thing in a plan.`,
    { sketch: { w: 760, h: 292, caption: 'EXPLAIN shows the planner\'s choice and its estimates. EXPLAIN ANALYZE also runs the plan and adds what really happened.', items: [
      { t: 'box', x: 10, y: 40, w: 118, h: 56, label: 'your SQL', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 130, y1: 68, x2: 168, y2: 68 },
      { t: 'box', x: 170, y: 40, w: 128, h: 56, label: 'parse', sub: 'and rewrite', fill: 'grey', size: 17 },
      { t: 'arrow', x1: 300, y1: 68, x2: 338, y2: 68 },
      { t: 'box', x: 340, y: 40, w: 150, h: 56, label: 'planner', sub: 'chooses by cost', fill: 'yellow', size: 18 },
      { t: 'arrow', x1: 492, y1: 68, x2: 530, y2: 68 },
      { t: 'box', x: 532, y: 40, w: 118, h: 56, label: 'executor', sub: 'runs the plan', fill: 'green', size: 17 },
      { t: 'arrow', x1: 652, y1: 68, x2: 676, y2: 68 },
      { t: 'box', x: 678, y: 40, w: 74, h: 56, label: 'rows', fill: 'blue', size: 17 },
      { t: 'db', x: 330, y: 150, w: 170, h: 68, label: 'statistics', fill: 'orange' },
      { t: 'arrow', x1: 415, y1: 148, x2: 415, y2: 100, label: 'estimates', lx: 52, ly: 0 },
      { t: 'text', x: 415, y: 238, text: 'made by ANALYZE: row counts, distinct values, common values', size: 14 },
      { t: 'note', x: 10, y: 112, w: 262, h: 74, fill: 'yellow', size: 14, text: 'EXPLAIN\nshows the plan and the ESTIMATES\n(rows=..., cost=...)' },
      { t: 'note', x: 506, y: 112, w: 246, h: 74, fill: 'green', size: 14, text: 'EXPLAIN ANALYZE\nruns it too and adds the ACTUAL\nrows, loops and pages' },
      { t: 'note', x: 10, y: 254, w: 742, h: 30, fill: 'pink', size: 14, text: 'Wrong or missing statistics -> wrong estimates -> a wrong plan. The planner never looks at the data itself.' },
    ] } },
    `## Reading one plan line
Every line of a plan that starts a step looks like this:`,
    { sketch: { w: 760, h: 258, caption: 'One plan node. Read the estimates on the left bracket and the facts on the right bracket, then compare them.', items: [
      { t: 'text', x: 18, y: 40, text: 'Seq Scan on gl_big  (cost=0.00..2146.00 rows=2 width=33)', size: 17, anchor: 'start', font: 'mono', bold: true },
      { t: 'text', x: 222, y: 68, text: '(actual rows=2.00 loops=1)', size: 17, anchor: 'start', font: 'mono', bold: true },
      { t: 'text', x: 40, y: 96, text: 'Filter: (journal_id = 4242)', size: 15, anchor: 'start', font: 'mono' },
      { t: 'text', x: 40, y: 120, text: 'Rows Removed by Filter: 99998', size: 15, anchor: 'start', font: 'mono' },
      { t: 'text', x: 40, y: 144, text: 'Buffers: shared hit=896', size: 15, anchor: 'start', font: 'mono' },
      { t: 'note', x: 12, y: 168, w: 176, h: 78, fill: 'blue', size: 13, text: 'NODE TYPE\nwhat kind of step.\nSeq Scan reads the\nwhole table' },
      { t: 'note', x: 196, y: 168, w: 176, h: 78, fill: 'yellow', size: 13, text: 'cost=a..b\nunits chosen by the\nplanner. a = before the\nfirst row, b = all rows' },
      { t: 'note', x: 380, y: 168, w: 176, h: 78, fill: 'orange', size: 13, text: 'rows=2 (expected)\nversus actual rows=2.00:\ncompare these two\nnumbers first' },
      { t: 'note', x: 564, y: 168, w: 184, h: 78, fill: 'green', size: 13, text: 'loops=1: how often\nthe node ran. Total rows\n= actual rows x loops.\nBuffers = pages' },
    ] } },
    `Four rules cover most of what you need:

- **Read from the innermost (most indented) node outwards.** The inner nodes run first and feed the nodes above them. The top node is the last step.
- **Costs have no unit.** \`cost=1.34..2234.01\` means "start-up cost .. total cost" in the planner's own scale. Compare costs only with other costs from the same server and the same query.
- **\`rows=\` is an estimate and \`actual rows=\` is a fact.** When they differ by 10 times or more, that node is where the plan went wrong.
- **\`loops\`** matters for the inner side of a join. If a node says \`actual rows=2.00 loops=500\`, it produced 2 rows each time and ran 500 times, **1,000 rows** in total.

Now the simulator. It builds a real table of 1,00,000 lines in your browser, runs a real \`EXPLAIN ANALYZE\`, and lets you **change the database**: add an index, run \`ANALYZE\`, or rewrite the filter. Click a node to see what it does. A red tag means the planner's guess was 10 or more times wrong. (The first scenario starts with no statistics, as after a fresh load. Try it before and after ticking *ANALYZE has run*.)`,
    { widget: 'ExplainViz' },
    `## The nodes you will meet
**Scans** read a table:

| Node | What it does | Good when |
|---|---|---|
| **Seq Scan** | reads every page | you need most of the table, or the table is small |
| **Index Scan** | walks the index, then visits the table for each row | few rows |
| **Index Only Scan** | answers from the index alone (needs VACUUM) | the index holds every column you need |
| **Bitmap Index Scan** + **Bitmap Heap Scan** | builds a map of the pages that hold matches, then reads each page once | a medium number of rows |

**Joins** combine two inputs. This is where plans differ most:

- **Nested Loop**: for each row of the first (outer) input, look up the matching rows in the second (inner) input. Perfect when the outer side is **tiny** and the inner side has an **index**. Ruinous when both sides are big and the inner side has no index: the inner work runs once per outer row.
- **Hash Join**: read the smaller input into an in-memory **hash table** (the **Hash** node), then stream the bigger input past it and look each row up. The standard choice for joining large inputs on equality. It needs memory (\`work_mem\`).
- **Merge Join**: walk two inputs that are **both sorted** on the join key, side by side, like merging two sorted lists. Good when both sides arrive sorted already (from an index). If a side must be sorted first, a **Sort** node pays for it.

**Other nodes:** **Sort** (a *top-N heapsort* keeps only the best few rows when there is a \`LIMIT\`), **Aggregate** and **HashAggregate** / **GroupAggregate** (GROUP BY with a hash table, or on sorted input), **Limit**, **Materialize** (store rows to read them several times), **Memoize** (cache lookups for repeated keys). Large queries may also show a **Gather** node: PostgreSQL started extra worker processes to scan in parallel. The in-browser database has one process, so you will see those on a real server.`,
    { sketch: { w: 760, h: 310, caption: 'Three ways to join. The planner estimates the cost of each and picks the cheapest.', items: [
      { t: 'box', x: 10, y: 8, w: 238, h: 40, label: 'Nested Loop', fill: 'yellow', size: 18 },
      { t: 'note', x: 10, y: 58, w: 238, h: 120, fill: 'grey', size: 13, text: 'for each row in A:\n   look up B by index\n   output the matches\n\nbest: A is tiny, B has an\nindex on the join column' },
      { t: 'box', x: 261, y: 8, w: 238, h: 40, label: 'Hash Join', fill: 'green', size: 18 },
      { t: 'note', x: 261, y: 58, w: 238, h: 120, fill: 'grey', size: 13, text: '1. read the small side into\n   a hash table in memory\n2. stream the big side\n   and probe the table\n\nbest: large equality joins' },
      { t: 'box', x: 512, y: 8, w: 238, h: 40, label: 'Merge Join', fill: 'blue', size: 18 },
      { t: 'note', x: 512, y: 58, w: 238, h: 120, fill: 'grey', size: 13, text: 'both inputs sorted on the key:\n   walk them together,\n   like merging two lists\n\nbest: inputs already sorted\n(index order)' },
      { t: 'note', x: 10, y: 196, w: 740, h: 46, fill: 'yellow', size: 14, text: 'Nested loop cost grows with (outer rows x one lookup). Hash join cost grows with (both sizes added).\nA wrong estimate of the outer row count is the classic way to get a catastrophic nested loop.' },
      { t: 'note', x: 10, y: 256, w: 740, h: 44, fill: 'pink', size: 14, text: 'You can steer the planner to compare them (SET enable_hashjoin = off), but never fix production that way:\nfix the estimate, the index or the query instead.' },
    ] } },
    { sql: {
      title: 'Read a whole plan: a join with a filter',
      setup: PERF_SETUP,
      starter: `CREATE INDEX gl_big_journal_idx ON gl_big (journal_id);
ANALYZE gl_big;
ANALYZE dim_account;

-- The two lines of journal 4242, with the name of their account.
-- Read it from the innermost node outwards, then compare "rows=" with "actual rows=" at every node.
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF)
SELECT a.account_name, g.amount
FROM gl_big g
JOIN dim_account a ON a.account_id = g.account_id
WHERE g.journal_id = 4242;`,
      note: 'The plan is a Hash Join with two children: an Index Scan using gl_big_journal_idx (the 2 lines of the journal, Index Cond: journal_id = 4242) and a Hash node over a Seq Scan on dim_account (the 15 accounts are read into a hash table). Run order: the Seq Scan on dim_account and the Hash are built, the Index Scan finds the 2 lines, the Hash Join matches them, 2 rows come out. Every node has rows= equal to or very near actual rows= (2, 15 and 2), because ANALYZE ran. The Buffers lines add up to a handful of pages, against 896 for the whole table.',
    } },
    `## The cost model: a formula, not magic
The planner's cost is arithmetic over a few **settings**, and you can reproduce it. For a plain Seq Scan:

\`\`\`text
cost = pages x seq_page_cost  +  rows x cpu_tuple_cost  +  rows x (filter conditions) x cpu_operator_cost
\`\`\`

With the defaults (\`seq_page_cost = 1\`, \`cpu_tuple_cost = 0.01\`, \`cpu_operator_cost = 0.0025\`) and the 896 pages and 1,00,000 rows of \`gl_big\`: 896 + 1,000 + 250 = **2,146**. That is exactly the cost of the Seq Scan you saw. An index scan is costed with \`random_page_cost\` (default **4**) for each table page it must visit at random, which is why it **loses** when it must fetch many rows: four times the price per page, for most of the pages.

Two settings you may be told to change on a server with fast SSD storage: lower \`random_page_cost\` (random reads are no longer much dearer than sequential ones) and set \`effective_cache_size\` to describe how much of the data the operating system caches. Do this on a measured basis, not as a first reaction.`,
    { sql: {
      title: 'Reproduce the cost, and look at the statistics behind the rows',
      setup: PERF_SETUP,
      starter: `ANALYZE gl_big;

-- 1) The Seq Scan cost, calculated by hand from pg_class and the settings
SELECT relpages AS pages, reltuples::bigint AS rows,
       relpages * current_setting('seq_page_cost')::numeric
         + reltuples * current_setting('cpu_tuple_cost')::numeric                          AS no_filter,
       relpages * current_setting('seq_page_cost')::numeric
         + reltuples * current_setting('cpu_tuple_cost')::numeric
         + reltuples * current_setting('cpu_operator_cost')::numeric                       AS one_filter_condition
FROM pg_class
WHERE relname = 'gl_big';

-- 2) ... and the same two numbers from the planner
EXPLAIN SELECT * FROM gl_big;
EXPLAIN SELECT * FROM gl_big WHERE journal_id = 4242;

-- 3) The cost settings, and when autovacuum re-analyses a table by itself
SELECT name, setting
FROM pg_settings
WHERE name IN ('seq_page_cost', 'random_page_cost', 'cpu_tuple_cost', 'cpu_operator_cost', 'cpu_index_tuple_cost',
               'autovacuum_analyze_threshold', 'autovacuum_analyze_scale_factor', 'default_statistics_target')
ORDER BY name;

-- 4) What ANALYZE stored about the columns (pg_stats). n_distinct < 0 means "that fraction of the rows".
SELECT attname AS column_name, n_distinct, null_frac,
       most_common_vals::text AS common_values,
       (SELECT string_agg(ROUND(f::numeric, 2)::text, ' ') FROM unnest(most_common_freqs) AS f) AS common_freqs
FROM pg_stats
WHERE tablename = 'gl_big' AND attname IN ('status', 'entity_id')
ORDER BY attname;`,
      note: 'The hand-made numbers are 896 pages, 100000 rows, a cost of 1896 without a filter and 2146 with one condition, and EXPLAIN prints exactly cost=0.00..1896.00 and cost=0.00..2146.00. The defaults are seq_page_cost 1, random_page_cost 4, cpu_tuple_cost 0.01, cpu_operator_cost 0.0025, cpu_index_tuple_cost 0.005, default_statistics_target 100, and autovacuum re-analyses a table after about 50 rows plus 10 percent of its size have changed (threshold 50, scale factor 0.1). In pg_stats, status has n_distinct 2 with common values Posted and Parked at frequencies 0.99 and 0.01, and entity_id has n_distinct 3 with three values at about 0.33 each: this is how the planner knows that status = \'Parked\' keeps about 1 percent of the rows.',
    } },
    { sql: {
      title: 'The same query, three join algorithms and their costs',
      setup: PERF_SETUP + '\n' + PLAN_COST,
      starter: `CREATE INDEX gl_big_account_idx ON gl_big (account_id);
ANALYZE gl_big;
ANALYZE dim_account;

-- The query, kept in a table so we can plan it three times. plan_nodes() lists the steps, plan_cost() gives the total cost.
CREATE TABLE q (sql text);
INSERT INTO q VALUES ($$SELECT a.account_name, SUM(g.amount) FROM gl_big g JOIN dim_account a ON a.account_id = g.account_id GROUP BY a.account_name$$);
CREATE TABLE compare (n serial, setting text, plan text, total_cost numeric);

INSERT INTO compare (setting, plan, total_cost) SELECT 'planner default', plan_nodes(sql), plan_cost(sql) FROM q;
SET enable_hashjoin = off;           -- ask the planner to avoid hash joins if it can
INSERT INTO compare (setting, plan, total_cost) SELECT 'no hash join', plan_nodes(sql), plan_cost(sql) FROM q;
SET enable_nestloop = off;           -- ... and nested loops too
INSERT INTO compare (setting, plan, total_cost) SELECT 'no hash join, no nested loop', plan_nodes(sql), plan_cost(sql) FROM q;

SELECT setting, plan, total_cost FROM compare ORDER BY n;`,
      note: 'The planner\'s own choice is Aggregate over a Hash Join (Seq Scan on gl_big, Hash over a Seq Scan on dim_account) at a total cost of about 2730. With hash joins switched off it uses a Nested Loop with a Memoize node and an Index Scan on dim_account_pkey, at about 4810. With both switched off it uses a Merge Join over two index scans at about 7180 (the last digits move a little between runs, because the statistics come from a random sample). All three plans give the same 15 rows; the default is the cheapest, which is exactly why the planner chose it. The enable_ settings are for experiments: they do not delete an algorithm, they ask the planner to avoid it, and it then picks the next cheapest.',
    } },
    `## Why estimates go wrong, and the three fixes
Most "the plan suddenly got slow" problems come down to one wrong row estimate, because every choice above (scan type, join type, join order) is made from estimated row counts. The usual causes:

1. **Missing or stale statistics.** After a large load, update or delete, the statistics describe the old table. Autovacuum re-analyses a table when enough rows have changed, but it is not instant, and in an ETL job you often query **right after** a bulk load. **Fix: run \`ANALYZE\` after the load.** It is cheap and it is the first thing to try.
2. **Columns that are not independent.** The planner multiplies selectivities as if columns were unrelated. If \`entity_id = 1\` and \`account_id = 1000\` always go together (every Indian entity books its own accounts), the product is far too small. **Fix: \`CREATE STATISTICS ... (dependencies)\`** to teach it the link.
3. **Expressions and functions.** For \`EXTRACT(MONTH FROM posting_date) = 1\` the planner has no statistics on the expression and falls back to a fixed guess (the widget showed it: expected 500 rows, got 8,494). **Fix: an expression index** (it also collects statistics) or rewrite the filter as a range.

A fourth, less common one: a very **skewed** column with many distinct values. Raise its statistics target (\`ALTER TABLE t ALTER COLUMN c SET STATISTICS 500\`) so \`ANALYZE\` keeps more common values.`,
    { sql: {
      title: 'Stale statistics: the plan flips after a bulk change',
      setup: PERF_SETUP,
      starter: `CREATE INDEX gl_big_status_idx ON gl_big (status);
ANALYZE gl_big;

-- 1) With fresh statistics: about 1 percent of the lines are Parked, and the planner knows it.
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big WHERE status = 'Parked';

-- 2) A big change: 60,000 lines become Parked. Nobody runs ANALYZE.
UPDATE gl_big SET status = 'Parked' WHERE line_id <= 60000;
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big WHERE status = 'Parked';

-- 3) Refresh the statistics. The estimate and the plan both change.
ANALYZE gl_big;
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big WHERE status = 'Parked';`,
      note: 'Step 1: an Index Scan on gl_big_status, estimate about 1000 rows against 1000 actual. Step 2: after the UPDATE the table has 60400 Parked lines, but the statistics are old, so the planner still expects only about 1500 rows and keeps the Index Scan, which now fetches 60400 rows one by one (actual rows=60400). Step 3: after ANALYZE the estimate is about 60400 and the plan becomes a Seq Scan with "Rows Removed by Filter: 39600", which is the right plan. The exact estimates differ a little from run to run because ANALYZE reads a random sample of the table; the pattern is always the same.',
    } },
    { sql: {
      title: 'Correlated columns: teach the planner with CREATE STATISTICS',
      setup: PERF_SETUP,
      starter: `ANALYZE gl_big;

-- In gl_big, entity_id 1 only ever appears with account 1000 (and 2 other accounts): the columns are NOT independent.
SELECT COUNT(*) AS actual_lines FROM gl_big WHERE entity_id = 1 AND account_id = 1000;

-- Before: the planner multiplies 1/3 (entity) by 1/15 (account) and expects far too few rows
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big WHERE entity_id = 1 AND account_id = 1000;

CREATE STATISTICS gl_entity_account (dependencies) ON entity_id, account_id FROM gl_big;
ANALYZE gl_big;

-- After: the dependency is known and the estimate comes close
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big WHERE entity_id = 1 AND account_id = 1000;`,
      note: 'The query really returns 6666 lines. Before CREATE STATISTICS the planner estimates about 2200 rows (100000 x 1/3 x 1/15 = 2222), three times too low. After it, with the dependency on record, the estimate is about 6900, close to the 6666 actual. Both are Seq Scans here, so the plan does not change, but in a bigger query a three-times-too-low estimate on one input is exactly what turns a Hash Join into a bad Nested Loop. The exact numbers move a little with each ANALYZE because it reads a random sample.',
    } },
    `## Memory: sorts and hashes that spill to disk
Sorts and hash tables use memory up to \`work_mem\` **per step**. If the data does not fit, PostgreSQL writes it to temporary files, and you see it in the plan: **\`Sort Method: external merge  Disk: 4360kB\`**, or a **Hash** node with **\`Batches: 8\`** instead of 1. A **top-N heapsort** for \`ORDER BY ... LIMIT\` is the cheap case: it keeps only the best few rows. Raising \`work_mem\` for one report session (\`SET LOCAL work_mem = '256MB'\`, as in the operations lesson) is often the right fix. Raising it for the whole server is dangerous, because every step of every query may take that much.`,
    { sql: {
      title: 'The same sort in memory and on disk',
      setup: PERF_SETUP,
      starter: `ANALYZE gl_big;

-- A small work_mem: sorting 1,00,000 lines does not fit and spills to disk
SET work_mem = '64kB';
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big ORDER BY amount;

-- A bigger work_mem: the same sort stays in memory
SET work_mem = '64MB';
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big ORDER BY amount;

-- With a LIMIT only the best 10 rows are kept, so memory is never a problem
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM gl_big ORDER BY amount DESC LIMIT 10;`,
      note: 'With 64kB the Sort says "Sort Method: external merge  Disk: 4360kB" (it wrote about 4 MB of temporary files). With 64MB the same sort says "Sort Method: quicksort  Memory: 7509kB" and the estimated cost is much lower. With LIMIT 10 the method is "top-N heapsort  Memory: 18kB": the sort only ever holds 10 rows. The plan shape is identical; only the Sort Method line shows where the work happened.',
    } },
    `## How to read a slow plan: a routine
1. Run \`EXPLAIN (ANALYZE, BUFFERS)\` on the **real query** with realistic data volume.
2. Find the **first node (from the inside) where \`rows=\` and \`actual rows=\` differ by 10 times or more**. That is usually the cause. Everything above it was chosen on a wrong guess.
3. Look for a **Seq Scan with a large "Rows Removed by Filter"** (a missing index, or a filter that is not sargable).
4. Look for **Sort** or **Hash** nodes that spill (\`Disk\`, \`Batches > 1\`).
5. Look at **loops** on the inner side of a Nested Loop: tiny cost times a huge number of loops.
6. Fix the cause: **statistics** (\`ANALYZE\`, \`CREATE STATISTICS\`), **index**, **rewrite**, or **memory**. Run the plan again and compare the Buffers.`,
    { local: `**More EXPLAIN on your laptop** (psql or DBeaver):
\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS) SELECT * FROM gl_big WHERE journal_id = 4242;
EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM gl_big WHERE journal_id = 4242;   -- for tools that draw the plan
\`\`\`
**What to expect:** \`VERBOSE\` adds the output column list of each node, \`SETTINGS\` lists any non-default planner setting that influenced the plan, and \`FORMAT JSON\` prints the same plan as a document. Pasting a plan into an online **plan visualizer** is convenient, but a plan contains your table names, column names and filter constants, so on a client system **do not paste plans from production into a public website** without permission.

**Catch slow plans automatically** (a real server; extensions are not available in the browser database): the \`auto_explain\` module logs the plan of any statement slower than a limit you choose (\`auto_explain.log_min_duration\`), and \`pg_stat_statements\` lists the queries that used the most total time. Together they tell you *which* queries to explain, which is half the job.` },
    `## Practice
All three practise the skills of this lesson with plain SQL: triage a plan by its estimates, parse plan text with regular expressions (a real job when you collect plans in a table), and reproduce the planner's row estimate from statistics.`,
    { challenge: {
      id: 'sql-explain-deep-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Plan triage. The starter holds the nodes of a plan with the planner\'s estimate and the actual rows. Return `node, est_rows, actual_rows, off_by` for the nodes whose estimate is **10 times or more** away from the actual rows, where `off_by` = the larger of the two numbers divided by the smaller (use 1 instead of 0 as the smaller number), rounded to 1 decimal. Sort by `off_by` descending. (3 rows.)',
      starter: `WITH plan(node, est_rows, actual_rows) AS (
  VALUES ('Seq Scan on gl_big',         323,    2),
         ('Hash Join',                   24,    2),
         ('Hash',                        15,   15),
         ('Seq Scan on dim_account',     15,   15),
         ('Bitmap Heap Scan on gl_big', 500, 8494),
         ('HashAggregate',               15,   15)
)
SELECT node, est_rows, actual_rows
FROM plan`,
      hint: "off_by = GREATEST(est_rows, actual_rows)::numeric / GREATEST(LEAST(est_rows, actual_rows), 1). Compute it in a second CTE (or a subquery) so you can filter on it and sort by it.",
      solution: `WITH plan(node, est_rows, actual_rows) AS (
  VALUES ('Seq Scan on gl_big',         323,    2),
         ('Hash Join',                   24,    2),
         ('Hash',                        15,   15),
         ('Seq Scan on dim_account',     15,   15),
         ('Bitmap Heap Scan on gl_big', 500, 8494),
         ('HashAggregate',               15,   15)
),
scored AS (
  SELECT node, est_rows, actual_rows,
         ROUND(GREATEST(est_rows, actual_rows)::numeric / GREATEST(LEAST(est_rows, actual_rows), 1), 1) AS off_by
  FROM plan
)
SELECT node, est_rows, actual_rows, off_by
FROM scored
WHERE off_by >= 10
ORDER BY off_by DESC`,
    } },
    { challenge: {
      id: 'sql-explain-deep-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Parse plan text. The starter holds five lines of `EXPLAIN ANALYZE` output as text. For each line return `depth`, `node`, `total_cost`, `est_rows`, `actual_rows`, in the original order. `depth` is the nesting level: a line with 0 leading spaces is level 0, with 2 leading spaces level 1, with 8 leading spaces level 2 (each level adds 6 spaces after the first). `node` is the text before the first `(cost=`, without the `->` arrow and without surrounding spaces. `total_cost` is the number after the `..` in `cost=a..b` (numeric), `est_rows` is `rows=` (integer) and `actual_rows` is the number in `(actual rows=...)` as an integer. (5 rows.)',
      starter: `WITH plan(n, line) AS (
  VALUES (1, 'Hash Join  (cost=1.34..2234.01 rows=100000 width=17) (actual rows=100000.00 loops=1)'),
         (2, '  ->  Seq Scan on gl_big g  (cost=0.00..1896.00 rows=100000 width=10) (actual rows=100000.00 loops=1)'),
         (3, '  ->  Hash  (cost=1.15..1.15 rows=15 width=15) (actual rows=15.00 loops=1)'),
         (4, '        ->  Seq Scan on dim_account a  (cost=0.00..1.15 rows=15 width=15) (actual rows=15.00 loops=1)'),
         (5, '  ->  Index Scan using gl_big_journal_idx on gl_big  (cost=0.29..8.33 rows=2 width=33) (actual rows=2.00 loops=1)')
)
SELECT n, line
FROM plan
ORDER BY n`,
      hint: "Count leading spaces with length(line) - length(ltrim(line)); depth = (spaces + 4) / 6 as integer division. Use regexp_match(line, '^\\s*(?:->\\s+)?(.+?)\\s+\\(cost=[0-9.]+\\.\\.([0-9.]+) rows=([0-9]+) width=[0-9]+\\) \\(actual rows=([0-9.]+)') and read m[1] to m[4]. A lateral join or a second CTE keeps it readable.",
      solution: `WITH plan(n, line) AS (
  VALUES (1, 'Hash Join  (cost=1.34..2234.01 rows=100000 width=17) (actual rows=100000.00 loops=1)'),
         (2, '  ->  Seq Scan on gl_big g  (cost=0.00..1896.00 rows=100000 width=10) (actual rows=100000.00 loops=1)'),
         (3, '  ->  Hash  (cost=1.15..1.15 rows=15 width=15) (actual rows=15.00 loops=1)'),
         (4, '        ->  Seq Scan on dim_account a  (cost=0.00..1.15 rows=15 width=15) (actual rows=15.00 loops=1)'),
         (5, '  ->  Index Scan using gl_big_journal_idx on gl_big  (cost=0.29..8.33 rows=2 width=33) (actual rows=2.00 loops=1)')
),
parsed AS (
  SELECT n, line,
         regexp_match(line, '^\\s*(?:->\\s+)?(.+?)\\s+\\(cost=[0-9.]+\\.\\.([0-9.]+) rows=([0-9]+) width=[0-9]+\\) \\(actual rows=([0-9.]+)') AS m
  FROM plan
)
SELECT (length(line) - length(ltrim(line)) + 4) / 6 AS depth,
       m[1] AS node,
       m[2]::numeric AS total_cost,
       m[3]::int AS est_rows,
       m[4]::numeric::int AS actual_rows
FROM parsed
ORDER BY n`,
    } },
    { challenge: {
      id: 'sql-explain-deep-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Reproduce the planner\'s row estimate for `column = value`. The table has 100,000 rows. For a value in the **most common values** list the estimate is `rows x its frequency`. For any other value PostgreSQL spreads the **remaining** frequency evenly over the remaining distinct values: `rows x (1 - sum of the common frequencies) / (n_distinct - number of common values)` (there are no NULLs here). The statistics and the six lookups are in the starter. Return `column_name, value, estimated_rows` (rounded to a whole number), sorted by `column_name`, then `value`. (6 rows.)',
      starter: `WITH stats(column_name, n_distinct, vals, freqs) AS (
  VALUES ('status',  2, ARRAY['Posted', 'Parked'],           ARRAY[0.99, 0.01]),
         ('channel', 3, ARRAY['Online', 'Partner'],          ARRAY[0.5, 0.3]),
         ('region',  8, ARRAY['South', 'West', 'North'],     ARRAY[0.4, 0.2, 0.1])
),
lookups(column_name, value) AS (
  VALUES ('status', 'Parked'), ('channel', 'Online'), ('channel', 'Direct'),
         ('region', 'South'), ('region', 'East'), ('region', 'Central')
)
SELECT l.column_name, l.value
FROM lookups l
JOIN stats s USING (column_name)
ORDER BY l.column_name, l.value`,
      hint: "Find the position of the value with array_position(s.vals, l.value). If it is not NULL, use s.freqs[position]. Otherwise: (1 - (SELECT SUM(f) FROM unnest(s.freqs) AS f)) / (s.n_distinct - cardinality(s.vals)). Multiply by 100000 and ROUND.",
      solution: `WITH stats(column_name, n_distinct, vals, freqs) AS (
  VALUES ('status',  2, ARRAY['Posted', 'Parked'],           ARRAY[0.99, 0.01]),
         ('channel', 3, ARRAY['Online', 'Partner'],          ARRAY[0.5, 0.3]),
         ('region',  8, ARRAY['South', 'West', 'North'],     ARRAY[0.4, 0.2, 0.1])
),
lookups(column_name, value) AS (
  VALUES ('status', 'Parked'), ('channel', 'Online'), ('channel', 'Direct'),
         ('region', 'South'), ('region', 'East'), ('region', 'Central')
)
SELECT l.column_name, l.value,
       ROUND(100000 * COALESCE(
         s.freqs[array_position(s.vals, l.value)],
         (1 - (SELECT SUM(f) FROM unnest(s.freqs) AS f)) / (s.n_distinct - cardinality(s.vals))
       )) AS estimated_rows
FROM lookups l
JOIN stats s USING (column_name)
ORDER BY l.column_name, l.value`,
    } },
    { real: 'When a client says "the report got slow", ask two questions before opening the plan: **what changed in the data** (a bulk load, a big update, a month-end close) and **when did the statistics last refresh** (`SELECT relname, last_analyze, last_autoanalyze FROM pg_stat_user_tables;` on a real server). A surprising number of "slow query" tickets end with `ANALYZE`. In your own ETL jobs make it a habit: **load, then `ANALYZE` the tables you loaded, then run the heavy queries.** And when a plan changes after an upgrade or a data load, keep the before and after plans: they are your evidence, and they show whether the cause was the data, the statistics or the settings.' },
    { interview: '"The same query was fast yesterday and slow today. How do you investigate?" Model answer: "I get the actual plan with EXPLAIN (ANALYZE, BUFFERS) and, if I have it, yesterday\'s plan to compare. I look for the first node where the estimated rows and the actual rows are far apart, because the planner chose everything above it on that guess. The usual suspects are stale statistics after a bulk load, so I run ANALYZE and compare; correlated columns, which I can teach the planner with CREATE STATISTICS; and filters on expressions, which I fix with an expression index or by making the filter sargable. I also check for a sort or hash spilling to disk and for a nested loop whose inner side runs thousands of times. I confirm the fix by comparing buffers and the plan shape, not just the time, and I do not rely on enable_ settings in production." Follow-up: "Explain the three join algorithms." (nested loop: for each outer row an inner lookup, best when the outer side is tiny and the inner side is indexed; hash join: build a hash table on the smaller input and probe it, the default for big equality joins; merge join: walk two sorted inputs together).' },
    `## Recap
- The **planner** chooses a plan by **estimated cost**, using **statistics** collected by \`ANALYZE\`. It never looks at the data while planning. \`EXPLAIN\` shows the plan and estimates, \`EXPLAIN ANALYZE\` also runs it and shows actual rows, loops and pages.
- Read a plan **from the innermost node outwards**. \`cost=a..b\` is start-up and total cost in arbitrary units. Compare \`rows=\` with \`actual rows=\`: a gap of 10 times or more marks the node where things went wrong. Total rows = actual rows x loops.
- **Scans**: Seq, Index, Index Only, Bitmap. **Joins**: **Nested Loop** (tiny outer side, indexed inner side), **Hash Join** (big equality joins, needs memory), **Merge Join** (sorted inputs). Also Sort, Aggregate, Limit, Materialize, Memoize and Gather (parallel).
- **Cost is a formula**: for a Seq Scan, pages x seq_page_cost + rows x cpu_tuple_cost + rows x conditions x cpu_operator_cost = 2,146 for \`gl_big\`. An index scan pays \`random_page_cost\` (4) per table page.
- **Bad estimates**: stale statistics (run **ANALYZE** after bulk loads), correlated columns (**CREATE STATISTICS**), expressions (expression index or sargable rewrite), skewed columns (higher statistics target).
- **Spills**: \`Sort Method: external merge Disk\` or \`Batches > 1\` means \`work_mem\` was too small for that step. Use \`SET LOCAL work_mem\` for one heavy report.
- Do not fix production with \`enable_*\` settings. Fix the estimate, the index or the query, and prove it with the plan and the Buffers.`,
  ],
  quiz: [
    { q: 'In `Seq Scan on gl_big  (cost=0.00..2146.00 rows=2 width=33) (actual rows=2.00 loops=1)`, what do `rows=2` and `actual rows=2.00` tell you?', o: ['The planner expected 2 rows and 2 rows really came out: the estimate was right', 'The table has only 2 rows', 'The query was run twice', 'The scan read 2 pages'], a: 0, why: 'rows= is the planner\'s estimate (from statistics) and actual rows= is what the executor found. When they differ by 10 times or more, that node is where the plan went wrong.' },
    { q: 'What does the planner use to decide between plans?', o: ['The actual data, which it scans before planning', 'The statistics collected by ANALYZE, turned into estimated costs', 'The order of the tables in the FROM clause only', 'The size of the result set returned yesterday'], a: 1, why: 'The planner never reads your data while planning. It estimates row counts and costs from the statistics, so stale or missing statistics lead to wrong plans.' },
    { q: 'A nested loop joins a small outer input to an inner table on an indexed column. When is a nested loop a bad choice?', o: ['When the inner table is small', 'When both inputs are big and the inner side has no index, so the inner work repeats once per outer row', 'When the join column is a primary key', 'Never, nested loops are always fastest'], a: 1, why: 'The cost of a nested loop is roughly outer rows times one inner lookup. A wrong estimate that makes the outer side look tiny, when it is actually huge, produces a catastrophic nested loop.' },
    { q: 'After a bulk load of 60,000 rows the same query becomes slow, and EXPLAIN ANALYZE shows `rows=1500` but `actual rows=60400` on an Index Scan. What is the first thing to try?', o: ['Add another index', 'Raise max_connections', 'Rewrite the query with DISTINCT', 'Run ANALYZE on the table, then compare the plan'], a: 3, why: 'The estimate comes from statistics that still describe the old table. ANALYZE refreshes them. Here it changes the plan to a Seq Scan, which is right for 60 percent of the table.' },
    { q: 'What does `Sort Method: external merge  Disk: 4360kB` mean?', o: ['The sort used an index', 'The sort did not fit in work_mem and wrote temporary files to disk', 'The sort was parallel', 'The result was cached from an earlier query'], a: 1, why: 'A sort or hash that exceeds work_mem spills to temporary files. A bigger work_mem for that session (SET LOCAL) keeps it in memory, and a LIMIT can turn it into a cheap top-N heapsort.' },
    { q: 'Two columns, `entity_id` and `account_id`, always occur together, and the planner underestimates `WHERE entity_id = 1 AND account_id = 1000` by three times. Which statement helps?', o: ['VACUUM FULL gl_big', 'SET enable_seqscan = off', 'CREATE STATISTICS (dependencies) ON entity_id, account_id FROM gl_big; then ANALYZE', 'DROP INDEX on entity_id'], a: 2, why: 'By default the planner multiplies the selectivities as if the columns were independent. Extended statistics tell it they are correlated, so the estimate comes close to the real count.' },
  ],
  task: {
    title: 'Read and repair three plans',
    steps: [
      'Create `30_explain.sql` in `C:\\sql-practice`. Build `gl_big` and the helpers (`plan_nodes`, `plan_cost`). Run `EXPLAIN (ANALYZE, BUFFERS)` for the join with a filter on journal 4242 and write, in a comment, the order in which the nodes run, and the estimated and actual rows of each.',
      'Reproduce the Seq Scan cost by hand from `relpages`, `reltuples` and the three cost settings. Check that your numbers match `EXPLAIN SELECT * FROM gl_big;` and the filtered version exactly.',
      'Run the same aggregate join under the three `enable_` settings and record the join algorithm and the total cost of each. Which one is cheapest, and why does that match the default?',
      'Do the stale-statistics experiment: index on `status`, `ANALYZE`, the `Parked` plan; update 60,000 rows without `ANALYZE` and note the estimate; then `ANALYZE` and note the plan change. Write the estimate and the actual rows for all three steps.',
      'Create the `CREATE STATISTICS` dependency on `(entity_id, account_id)`. Compare the estimate before and after. Then `SELECT * FROM pg_stats_ext;` and describe what you see.',
      'Make a sort spill: `SET work_mem = \'64kB\'` and sort `gl_big` by `amount`. Note the Sort Method line, then raise `work_mem` and compare. Finish by running `SELECT relname, last_analyze, last_autoanalyze FROM pg_stat_user_tables;` and write down what it tells you about your own tables.',
    ],
    deliverable: '`30_explain.sql` with the commands you ran and, in comments, the node order of the join plan, the hand-made and planner costs, the three join algorithms with their costs, the estimate against actual rows in the stale-statistics and `CREATE STATISTICS` experiments, and the Sort Method lines for both `work_mem` values.',
  },
};
