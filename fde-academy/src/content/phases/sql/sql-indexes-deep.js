import { PERF_SETUP, PLAN_NODES } from './shared.js';

export default {
  id: 'sql-indexes-deep',
  title: 'Indexes in depth: B-tree, hash, GIN, GiST, BRIN, partial, expression and covering',
  goal: 'You can choose the right type of index for a query, build partial, expression and covering indexes, explain what an index costs on every write, and review a database for missing, redundant and wasteful indexes.',
  roadmap: [
    'B-tree vs hash vs GIN vs GiST vs BRIN',
    'Partial, covering (INCLUDE) and expression indexes',
    'Index bloat and when an index hurts',
  ],
  blocks: [
    `## The problem
After the slow-report scare in the last lesson, the team added an index for every complaint. Six months later:

- the nightly load is **slower**, and nobody connects it with the 23 indexes on the ledger table,
- the database disk is nearly full, and the indexes take **as much space as the data**,
- two things are **still slow**: finding the failed jobs inside a JSON column, and answering "who was in Finance on 15 September?" from a table of date ranges. No B-tree helps with either.

An index is not one tool. It is a **toolbox** with different kinds of index, each for a different question, and every one of them has a price. This lesson teaches you to choose, and to count the cost.

We use the same table as before, \`gl_big\` (1,00,000 journal lines), and two more that the playgrounds build for you: \`job_events\` (50,000 job log entries with a JSON payload) and \`emp_hist\` (30,000 rows with a date range).`,
    `## Seven kinds of index, one question each
An index supports certain **operators**. The planner uses an index only if your query's operator is one the index understands. So the first step in choosing an index is to ask: *what am I searching with?*

| Type | Answers | Notes |
|---|---|---|
| **B-tree** (the default) | \`=\`, \`<\`, \`>\`, \`BETWEEN\`, \`ORDER BY\`, \`IS NULL\`, prefix \`LIKE 'Apex%'\` (with the right operator class) | Sorted tree. Use it unless you have a reason not to. |
| **Hash** | \`=\` only | No ordering, no ranges. Rarely smaller or faster than a B-tree in practice. |
| **GIN** | "does this row **contain** ...": \`jsonb @>\`, array \`@>\`, full-text search, trigram \`LIKE '%x%'\` | One row has **many keys** (every JSON key, every array element, every word). Slower to write, big. |
| **GiST** | overlap and nearness: range \`&&\` and \`@>\`, geometry, nearest neighbour, exclusion constraints | A general tree for data that is not simply "smaller or bigger". |
| **BRIN** | ranges on **huge tables whose physical order follows the column** (event time, ever-growing ids) | **Tiny**: it stores only the minimum and maximum of each block of pages. |
| **SP-GiST** | partitioned spaces: phone-number prefixes, IP addresses | Rare. Know the name. |
| **Bloom** (extension) | equality on many columns at once | Rare. |

Almost every index you write will be a B-tree. The others earn their place when the question is not "equal or between".`,
    { sketch: { w: 760, h: 300, caption: 'Choose the index by the question you ask, not by the column name.', items: [
      { t: 'box', x: 270, y: 8, w: 220, h: 50, label: 'What am I searching with?', fill: 'yellow', size: 15 },
      { t: 'box', x: 14, y: 100, w: 140, h: 60, label: 'B-tree', sub: '=  <  >  BETWEEN\nORDER BY', fill: 'green', size: 17 },
      { t: 'box', x: 166, y: 100, w: 140, h: 60, label: 'GIN', sub: 'contains: jsonb,\narray, words', fill: 'blue', size: 17 },
      { t: 'box', x: 318, y: 100, w: 140, h: 60, label: 'GiST', sub: 'overlap, nearest,\nranges', fill: 'purple', size: 17 },
      { t: 'box', x: 470, y: 100, w: 140, h: 60, label: 'BRIN', sub: 'huge table in\ndate order', fill: 'orange', size: 17 },
      { t: 'box', x: 622, y: 100, w: 124, h: 60, label: 'Hash', sub: '= only', fill: 'grey', size: 17 },
      { t: 'arrow', x1: 330, y1: 60, x2: 84, y2: 98 },
      { t: 'arrow', x1: 360, y1: 60, x2: 236, y2: 98 },
      { t: 'arrow', x1: 380, y1: 60, x2: 388, y2: 98 },
      { t: 'arrow', x1: 400, y1: 60, x2: 540, y2: 98 },
      { t: 'arrow', x1: 430, y1: 60, x2: 684, y2: 98 },
      { t: 'note', x: 14, y: 184, w: 732, h: 50, fill: 'grey', size: 14, text: 'Then shape it: PARTIAL (only some rows)   EXPRESSION (an expression, not a bare column)\nCOVERING with INCLUDE (extra columns so the table is not visited)   UNIQUE (and it enforces the rule)' },
      { t: 'note', x: 14, y: 248, w: 732, h: 40, fill: 'yellow', size: 14, text: 'Every index costs disk and slows writes. Build the smallest one that answers a measured question.' },
    ] } },
    `## BRIN: a tiny index for a huge, ordered table
Picture a table of ten crore log lines that is only ever appended to, so the rows are stored in the order of their \`event_time\`. A B-tree on \`event_time\` would hold ten crore entries. A **BRIN** (Block Range Index) does something much cheaper: it divides the table into **blocks of pages** and remembers only the **smallest and largest value** in each block. To find a time range it skips every block whose min and max cannot match.

That only works when **physical order follows the column**. PostgreSQL measures this as the column's **correlation** (in \`pg_stats\`): close to 1 or -1 means ordered, close to 0 means scattered. A BRIN on a scattered column is useless, because every block contains every value.`,
    { sketch: { w: 760, h: 276, caption: 'BRIN keeps min and max per block of pages. It works when the table is in column order (left), and is useless when values are scattered (right).', items: [
      { t: 'text', x: 190, y: 16, text: 'journal_id: stored in order', size: 16, bold: true, color: '#2f9e44' },
      { t: 'box', x: 14, y: 32, w: 172, h: 44, label: 'block 1', sub: 'min 1   max 12,500', fill: 'green', size: 15 },
      { t: 'box', x: 196, y: 32, w: 172, h: 44, label: 'block 2', sub: 'min 12,501   max 25,000', fill: 'green', size: 15 },
      { t: 'box', x: 14, y: 86, w: 172, h: 44, label: 'block 3', sub: 'min 25,001   max 37,500', fill: 'green', size: 15 },
      { t: 'box', x: 196, y: 86, w: 172, h: 44, label: 'block 4', sub: 'min 37,501   max 50,000', fill: 'green', size: 15 },
      { t: 'note', x: 14, y: 146, w: 354, h: 62, fill: 'green', size: 14, text: 'journal 4242: only block 1 can hold it.\nThe other blocks are skipped.\nIndex size: 24 kB for 1,00,000 rows.' },
      { t: 'line', x1: 380, y1: 12, x2: 380, y2: 262, dashed: true },
      { t: 'text', x: 572, y: 16, text: 'posting_date: scattered', size: 16, bold: true, color: '#c2255c' },
      { t: 'box', x: 392, y: 32, w: 172, h: 44, label: 'block 1', sub: 'min 1 Apr   max 31 Mar', fill: 'pink', size: 15 },
      { t: 'box', x: 574, y: 32, w: 172, h: 44, label: 'block 2', sub: 'min 1 Apr   max 31 Mar', fill: 'pink', size: 15 },
      { t: 'box', x: 392, y: 86, w: 172, h: 44, label: 'block 3', sub: 'min 1 Apr   max 31 Mar', fill: 'pink', size: 15 },
      { t: 'box', x: 574, y: 86, w: 172, h: 44, label: 'block 4', sub: 'min 1 Apr   max 31 Mar', fill: 'pink', size: 15 },
      { t: 'note', x: 392, y: 146, w: 354, h: 62, fill: 'pink', size: 14, text: '15 January can be in ANY block.\nNothing can be skipped, so the planner\nignores the index and reads the table.' },
      { t: 'note', x: 14, y: 224, w: 732, h: 38, fill: 'yellow', size: 14, text: 'Correlation near 1 or -1 = ordered = BRIN is a good, tiny index. Near 0 = scattered = use a B-tree.' },
    ] } },
    { sql: {
      title: 'Three index types on journal_id, and a BRIN that cannot work',
      setup: PERF_SETUP,
      starter: `-- The same column, three kinds of index. Compare their sizes.
CREATE INDEX gl_big_journal_btree ON gl_big USING btree (journal_id);
CREATE INDEX gl_big_journal_hash  ON gl_big USING hash  (journal_id);
CREATE INDEX gl_big_journal_brin  ON gl_big USING brin  (journal_id);

SELECT indexrelid::regclass AS index_name,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size,
       pg_relation_size(indexrelid) AS bytes
FROM pg_index
WHERE indrelid = 'gl_big'::regclass
ORDER BY bytes DESC;

-- Physical order: journal_id grows with the row position, posting_date repeats every 365 rows
ANALYZE gl_big;
SELECT attname, ROUND(correlation::numeric, 2) AS correlation
FROM pg_stats
WHERE tablename = 'gl_big' AND attname IN ('journal_id', 'posting_date')
ORDER BY attname;

-- A BRIN works on the ordered column and is ignored on the scattered one
CREATE INDEX gl_big_date_brin ON gl_big USING brin (posting_date);
DROP INDEX gl_big_journal_btree, gl_big_journal_hash;   -- leave only the BRIN indexes
SELECT plan_nodes('SELECT * FROM gl_big WHERE journal_id BETWEEN 1000 AND 1100')        AS ordered_column,
       plan_nodes($$SELECT * FROM gl_big WHERE posting_date = DATE '2026-01-15'$$)       AS scattered_column;`,
      note: 'The sizes are 4112 kB for the hash index, 1992 kB for the B-tree and only 24 kB for the BRIN: about 80 times smaller than the B-tree. (Here the hash index is even bigger than the B-tree, one more reason to prefer B-tree.) The correlation is 1.00 for journal_id and about 0 for posting_date. With only BRIN indexes left, the range on journal_id uses the BRIN (Bitmap Heap Scan over a Bitmap Index Scan) while the date filter is a Seq Scan: the planner knows the BRIN on a scattered column cannot skip anything.',
    } },
    `## GIN and GiST: searching inside values
A B-tree stores **one key per row**. Some questions are about the **inside** of a value:

- *Which job events have \`"status": "failed"\` in their JSON payload?*
- *Which rows have the tag \`'urgent'\` in an array column?*
- *Which suppliers' names contain the word "steel"?*

A **GIN** index (Generalized Inverted Index) works like the index at the back of a book, in reverse: it stores every **key found inside the values** (each JSON key and value, each array element, each word) and, for each key, the list of rows that contain it. A search for "status: failed" looks up that one key and gets the rows at once. A row with a big JSON document contributes many entries, which is why GIN is large and slow to update.

**GiST** (Generalized Search Tree) is for values that have **overlap and distance** rather than simple order: date ranges, geometry, nearest-neighbour. In finance the best use is a **date range**: *"which row was valid on 15 September?"* is the question \`validity @> DATE '2026-09-15'\`.`,
    { sql: {
      title: 'GIN for JSON containment, GiST for date ranges',
      setup: `CREATE TABLE job_events AS
SELECT g AS event_id,
       jsonb_build_object('job_id', 'J-' || (1000 + g),
                          'status', CASE WHEN g % 50 = 0 THEN 'failed' ELSE 'ok' END,
                          'rule',   (ARRAY['IFSC_INVALID','PAN_MISSING','DUPLICATE_ACCOUNT','OK'])[g % 4 + 1],
                          'tags',   jsonb_build_array('payroll', CASE WHEN g % 7 = 0 THEN 'urgent' ELSE 'normal' END)) AS payload
FROM generate_series(1, 50000) AS g;
CREATE TABLE emp_hist AS
SELECT g AS hist_id, g % 2000 + 1 AS emp_id, 'D' || (g % 5) AS department,
       daterange(DATE '2015-01-01' + (g / 2000) * 400, DATE '2015-01-01' + (g / 2000) * 400 + 399, '[)') AS validity
FROM generate_series(0, 29999) AS g;
${PLAN_NODES}`,
      starter: `-- job_events: 50,000 log entries with a JSON payload.  emp_hist: 30,000 rows, each with a date range (validity).
ANALYZE job_events;
ANALYZE emp_hist;
SELECT plan_nodes($$SELECT * FROM job_events WHERE payload @> '{"status": "failed"}'$$) AS json_contains_before_index;

-- GIN on the whole JSON column
CREATE INDEX job_events_payload_gin ON job_events USING gin (payload);
ANALYZE job_events;
SELECT plan_nodes($$SELECT * FROM job_events WHERE payload @> '{"status": "failed"}'$$)  AS contains_after_gin,
       plan_nodes($$SELECT * FROM job_events WHERE payload ->> 'status' = 'failed'$$)    AS arrow_operator_after_gin;

SELECT COUNT(*) FILTER (WHERE payload @> '{"status": "failed"}') AS failed_jobs,
       COUNT(*) FILTER (WHERE payload @> '{"tags": ["urgent"]}') AS urgent_jobs
FROM job_events;

-- GiST on a date range: "who was valid on 15 June 2020?"
SELECT plan_nodes($$SELECT * FROM emp_hist WHERE validity @> DATE '2020-06-15'$$) AS range_before_gist;
CREATE INDEX emp_hist_validity_gist ON emp_hist USING gist (validity);
ANALYZE emp_hist;
SELECT plan_nodes($$SELECT * FROM emp_hist WHERE validity @> DATE '2020-06-15'$$) AS range_after_gist;
SELECT COUNT(*) AS rows_valid_on_that_day FROM emp_hist WHERE validity @> DATE '2020-06-15';

-- Size of the GIN index against its table, and the smaller jsonb_path_ops variant (containment only)
CREATE INDEX job_events_payload_gin_pp ON job_events USING gin (payload jsonb_path_ops);
SELECT pg_size_pretty(pg_relation_size('job_events'))                  AS table_size,
       pg_size_pretty(pg_relation_size('job_events_payload_gin'))      AS gin_default,
       pg_size_pretty(pg_relation_size('job_events_payload_gin_pp'))   AS gin_path_ops;`,
      note: 'Before any index the JSON search is a Seq Scan. After the GIN index the containment filter (payload @> ...) uses it (Bitmap Heap Scan over a Bitmap Index Scan on job_events_payload_gin), but payload ->> \'status\' = \'failed\' is still a Seq Scan: the ->> operator is not one GIN supports. For the ->> form you would build a B-tree on the expression (see below). There are 1000 failed jobs (every 50th) and 7142 urgent jobs. The range query is a Seq Scan before the GiST and uses emp_hist_validity_gist after it, and 2000 rows are valid on 15 June 2020. The default GIN index is 3952 kB for a table of 7168 kB (GIN is big), and the jsonb_path_ops variant is smaller at 3040 kB.',
    } },
    { tip: 'GIN has two operator classes for `jsonb`. The default (`jsonb_ops`) supports `@>`, `?` (key exists) and more, and is larger. **`jsonb_path_ops`** supports only containment (`@>`) and is smaller and faster for it: `CREATE INDEX ... USING gin (payload jsonb_path_ops)`. On the table above the default is about 3,952 kB and `jsonb_path_ops` about 3,040 kB. If you only ever search with `@>`, choose the smaller one.' },
    `## Partial indexes: index only the rows that matter
In \`gl_big\` one line in a hundred is \`Parked\`, and the approval team looks at those lines all day. An index on **all** of \`journal_id\` is large. A **partial index** adds a \`WHERE\` clause, so it holds only the rows that satisfy it:

\`\`\`sql
CREATE INDEX gl_big_parked_journal ON gl_big (journal_id) WHERE status = 'Parked';
\`\`\`

It is tiny (1% of the entries) and cheap to maintain, because a row that is not \`Parked\` never touches it. The planner uses it only if the query's \`WHERE\` **implies** the index's \`WHERE\`, so the query must repeat \`status = 'Parked'\`.

A **unique partial index** also enforces rules that a plain \`UNIQUE\` cannot. The classic one for history tables (next lessons): *an employee may have many rows, but only **one current** row*:

\`\`\`sql
CREATE UNIQUE INDEX one_current_row ON emp_cur (emp_id) WHERE is_current;
\`\`\`

## Expression indexes: index the calculation
The last lesson showed that \`WHERE EXTRACT(MONTH FROM posting_date) = 1\` cannot use an index on \`posting_date\`. Another way out is to index the **expression itself**:

\`\`\`sql
CREATE INDEX gl_big_month ON gl_big ((EXTRACT(MONTH FROM posting_date)));
\`\`\`

The query must then use **exactly the same expression**. Two details: the expression needs its own statistics, so run \`ANALYZE\` after creating the index, and the function must be \`IMMUTABLE\` (same input, same output, as you saw in the functions lesson). Typical uses: \`LOWER(supplier_name)\` for case-insensitive search, \`(payload ->> 'status')\` for a JSON field, a fiscal year computed from a date.

## Covering indexes: INCLUDE and index-only scans
A normal index scan does two jobs: find the entry in the index, then **visit the table** for the other columns. If the index already holds **every column the query needs**, the second job disappears. That is an **Index Only Scan**.

\`\`\`sql
CREATE INDEX gl_big_journal_cover ON gl_big (journal_id) INCLUDE (amount);
SELECT journal_id, amount FROM gl_big WHERE journal_id BETWEEN 1000 AND 5000;   -- needs only these two columns
\`\`\`

\`INCLUDE\` columns ride along in the index but are not searchable or sorted, so they cost less than extra key columns. One more condition: PostgreSQL must be sure that a row is visible to everybody without looking at the table. It learns that from a **visibility map** that **VACUUM** maintains. Until VACUUM has run, the plan shows **Heap Fetches** (table visits) and the benefit is gone.`,
    { sketch: { w: 760, h: 270, caption: 'A normal index scan visits the table for every row. A covering index holds the columns the query needs, so the table is skipped.', items: [
      { t: 'text', x: 190, y: 16, text: 'Index on (journal_id)', size: 16, bold: true, color: '#c2410c' },
      { t: 'box', x: 14, y: 32, w: 160, h: 56, label: 'index entry', sub: 'journal_id = 1000', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 176, y1: 60, x2: 214, y2: 60 },
      { t: 'box', x: 216, y: 32, w: 160, h: 56, label: 'table page', sub: 'read amount here', fill: 'pink', size: 16 },
      { t: 'note', x: 14, y: 104, w: 362, h: 58, fill: 'pink', size: 14, text: 'One visit to the table per row.\nFor 8,002 rows: 8,002 visits.' },
      { t: 'line', x1: 392, y1: 12, x2: 392, y2: 190, dashed: true },
      { t: 'text', x: 570, y: 16, text: 'Index on (journal_id) INCLUDE (amount)', size: 16, bold: true, color: '#2f9e44' },
      { t: 'box', x: 406, y: 32, w: 220, h: 56, label: 'index entry', sub: 'journal_id = 1000, amount = 412.50', fill: 'green', size: 16 },
      { t: 'mark', x: 676, y: 60, ok: true },
      { t: 'note', x: 406, y: 104, w: 340, h: 58, fill: 'green', size: 14, text: 'Index Only Scan: no table visit,\nif VACUUM has marked the pages visible.' },
      { t: 'note', x: 14, y: 204, w: 732, h: 52, fill: 'yellow', size: 14, text: 'Heap Fetches = how many times an Index Only Scan still had to visit the table.\nBefore the first VACUUM it is every row, so the plan is an Index Only Scan in name only.' },
    ] } },
    { sql: {
      title: 'Partial, unique-partial, expression and covering indexes',
      setup: PERF_SETUP + `
CREATE TABLE emp_cur (hist_id serial PRIMARY KEY, emp_id int, department text, is_current boolean);
INSERT INTO emp_cur (emp_id, department, is_current) VALUES (6, 'Sales', false), (6, 'Finance', true);
CREATE TABLE attempt_log (msg text);`,
      starter: `-- 1) PARTIAL: index only the Parked lines
CREATE INDEX gl_big_journal_all     ON gl_big (journal_id);
CREATE INDEX gl_big_journal_parked  ON gl_big (journal_id) WHERE status = 'Parked';
ANALYZE gl_big;
SELECT pg_size_pretty(pg_relation_size('gl_big_journal_all'))    AS full_index,
       pg_size_pretty(pg_relation_size('gl_big_journal_parked')) AS partial_index;
DROP INDEX gl_big_journal_all;     -- so the planner has only the partial one to choose from
SELECT plan_nodes($$SELECT * FROM gl_big WHERE status = 'Parked' AND journal_id = 50$$) AS repeats_the_predicate,
       plan_nodes($$SELECT * FROM gl_big WHERE journal_id = 50$$)                       AS does_not;

-- 2) UNIQUE PARTIAL: only one current row per employee (emp_cur already has a current row for employee 6)
CREATE UNIQUE INDEX one_current_row ON emp_cur (emp_id) WHERE is_current;
DO $$
BEGIN
  INSERT INTO emp_cur (emp_id, department, is_current) VALUES (6, 'Operations', true);   -- a SECOND current row
  INSERT INTO attempt_log VALUES ('second current row was accepted');
EXCEPTION WHEN unique_violation THEN
  INSERT INTO attempt_log VALUES ('blocked: ' || SQLERRM);
END $$;
INSERT INTO emp_cur (emp_id, department, is_current) VALUES (6, 'Old role', false);        -- any number of NON-current rows is fine
SELECT msg FROM attempt_log;
SELECT COUNT(*) FILTER (WHERE is_current) AS current_rows, COUNT(*) AS all_rows FROM emp_cur WHERE emp_id = 6;

-- 3) EXPRESSION: make the EXTRACT filter usable
SELECT plan_nodes('SELECT * FROM gl_big WHERE EXTRACT(MONTH FROM posting_date) = 1') AS before_expression_index;
CREATE INDEX gl_big_posting_month ON gl_big ((EXTRACT(MONTH FROM posting_date)));
ANALYZE gl_big;                    -- the expression needs its own statistics
SELECT plan_nodes('SELECT * FROM gl_big WHERE EXTRACT(MONTH FROM posting_date) = 1') AS after_expression_index;

-- 4) COVERING: INCLUDE the column the query reads
CREATE INDEX gl_big_journal_cover ON gl_big (journal_id) INCLUDE (amount);
ANALYZE gl_big;
EXPLAIN (ANALYZE, BUFFERS OFF, TIMING OFF, SUMMARY OFF)
SELECT journal_id, amount FROM gl_big WHERE journal_id BETWEEN 1000 AND 5000;`,
      note: 'The partial index is 40 kB and the full one 1992 kB. The query that repeats status = \'Parked\' uses the partial index (Index Scan), the one that does not is a Seq Scan because the partial index does not hold every journal. The unique partial index rejects the second current row for employee 6 (the log says "blocked: duplicate key value violates unique constraint ...") while another non-current row is accepted: the result is 1 current row and 3 rows in all (the original two, plus the accepted non-current one: the failed insert left nothing behind). The EXTRACT filter is a Seq Scan before the expression index and uses it (Bitmap Heap Scan over gl_big_posting_month) afterwards. The covering index gives an Index Only Scan, but the plan says "Heap Fetches: 8002": no VACUUM has run, so every row still needs a table visit. On a real server, run VACUUM and the number drops to 0.',
    } },
    { local: `**Make the Index Only Scan really skip the table** (psql; the in-browser database cannot run VACUUM inside a multi-statement script):
\`\`\`sql
VACUUM gl_big;
EXPLAIN (ANALYZE, BUFFERS) SELECT journal_id, amount FROM gl_big WHERE journal_id BETWEEN 1000 AND 5000;
\`\`\`
**What to expect:** the plan is still \`Index Only Scan using gl_big_journal_cover\`, but the line **Heap Fetches** now shows a small number or \`0\` (before the VACUUM it was 8002), and the Buffers line is much smaller. In a busy table the visibility map is kept current by autovacuum, so the benefit holds as long as autovacuum keeps up.

**Two things the browser cannot do** (extensions need a server where they are installed; on a managed cloud database check your provider's list):
\`\`\`sql
-- Search INSIDE text: a GIN index on trigrams makes LIKE '%steel%' fast
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX purchase_supplier_trgm ON purchase_register USING gin (supplier_name gin_trgm_ops);
SELECT supplier_name FROM purchase_register WHERE supplier_name ILIKE '%steel%';

-- Forbid overlapping history rows for one employee: an EXCLUSION constraint (GiST)
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE emp_dept_history (
  emp_id int, department text, validity daterange,
  EXCLUDE USING gist (emp_id WITH =, validity WITH &&)
);
INSERT INTO emp_dept_history VALUES (6, 'Sales',   daterange('2015-06-01', '2026-09-01'));
INSERT INTO emp_dept_history VALUES (6, 'Finance', daterange('2026-08-15', '2027-01-01'));   -- overlaps: rejected
\`\`\`
**What to expect:** \`CREATE EXTENSION\` succeeds when the extension package is installed. On 30 rows the planner still scans the table (a Seq Scan on a tiny table is the cheapest plan), and the trigram index pays off on large tables. The last \`INSERT\` fails with \`conflicting key value violates exclusion constraint\`. That constraint is what you will use for history tables in the SCD lesson.` },
    `## What an index costs: space, writes and bloat
Reads get faster, **writes get slower**. Every \`INSERT\` adds an entry to **each** index of the table. Every \`UPDATE\` that writes a new row version must usually add new index entries too, and every \`DELETE\` leaves dead entries behind. The next playground makes three copies of the same 1,00,000 lines, with 0, 1 and 4 indexes, and then updates rows, so you can **see** the cost in bytes.

Two ideas make the numbers easy to read:

- **Index bloat.** In the MVCC lesson an \`UPDATE\` writes a new row version. The old index entries stay until VACUUM removes them, so an index can be **much bigger than it needs to be**. \`REINDEX\` (best \`REINDEX INDEX CONCURRENTLY\`) rebuilds it compactly.
- **HOT updates** (heap-only tuples). If an \`UPDATE\` changes **no indexed column** and the new row version fits on the **same page**, PostgreSQL can skip the index entries completely. That is why a table that is updated often benefits from free space in each page (\`fillfactor\`, for example 70) and from **not** indexing columns that change all the time, such as a status or a "last updated" timestamp.`,
    { sql: {
      title: 'The price of indexes, in bytes',
      setup: PERF_SETUP,
      starter: `-- Three copies of the same data: no index, one index, four indexes
CREATE TABLE copy_0 (LIKE gl_big);
CREATE TABLE copy_1 (LIKE gl_big);
CREATE TABLE copy_4 (LIKE gl_big);
CREATE INDEX copy_1_journal ON copy_1 (journal_id);
CREATE INDEX copy_4_journal ON copy_4 (journal_id);
CREATE INDEX copy_4_date    ON copy_4 (posting_date);
CREATE INDEX copy_4_account ON copy_4 (account_id, posting_date);
CREATE INDEX copy_4_amount  ON copy_4 (amount);
INSERT INTO copy_0 SELECT * FROM gl_big;
INSERT INTO copy_1 SELECT * FROM gl_big;
INSERT INTO copy_4 SELECT * FROM gl_big;

SELECT 'no index' AS version, pg_size_pretty(pg_table_size('copy_0')) AS table_size, pg_size_pretty(pg_indexes_size('copy_0')) AS index_size
UNION ALL SELECT '1 index',  pg_size_pretty(pg_table_size('copy_1')), pg_size_pretty(pg_indexes_size('copy_1'))
UNION ALL SELECT '4 indexes', pg_size_pretty(pg_table_size('copy_4')), pg_size_pretty(pg_indexes_size('copy_4'));

-- HOT: a table with free space in every page (fillfactor 70) and two indexes
CREATE TABLE gl_hot (LIKE gl_big) WITH (fillfactor = 70);
INSERT INTO gl_hot SELECT * FROM gl_big;
CREATE INDEX gl_hot_journal ON gl_hot (journal_id);
CREATE INDEX gl_hot_amount  ON gl_hot (amount);
CREATE TABLE size_log (n serial, step text, journal_index bigint, amount_index bigint);
INSERT INTO size_log (step, journal_index, amount_index) VALUES ('loaded', pg_relation_size('gl_hot_journal'), pg_relation_size('gl_hot_amount'));

UPDATE gl_hot SET status = 'Checked' WHERE line_id % 2 = 0;          -- status is NOT in any index
INSERT INTO size_log (step, journal_index, amount_index) VALUES ('after updating status (no index on it)', pg_relation_size('gl_hot_journal'), pg_relation_size('gl_hot_amount'));

UPDATE gl_hot SET amount = amount + 0.01 WHERE line_id % 2 = 0;      -- amount IS in an index
INSERT INTO size_log (step, journal_index, amount_index) VALUES ('after updating amount (indexed)', pg_relation_size('gl_hot_journal'), pg_relation_size('gl_hot_amount'));
SELECT step, journal_index, amount_index FROM size_log ORDER BY n;`,
      note: 'Same 6704 kB of table data in all three copies. The indexes cost 0 bytes, 1992 kB and 6176 kB: four indexes are almost as big as the data, and every one of them must be updated on every insert. In the HOT experiment the two index sizes do not change when only status is updated (no index contains it and each page has free room, so the new row versions are heap-only). After updating the indexed column amount, both indexes have roughly doubled: the journal index from 2039808 to 4071424 bytes and the amount index from 2260992 to 4513792 (the journal index too: a non-HOT update adds an entry to EVERY index of the table).',
    } },
    { warn: 'PostgreSQL does **not** create an index on a **foreign key** column automatically (the primary side is indexed, the referencing side is not). Two things then hurt: joins from the parent to the child, and **deleting a parent row**, because PostgreSQL must scan the whole child table to prove no row still points at it. On a ledger, `fact_gl.account_id`, `bu_id` and `entity_id` are exactly such columns. One of the challenges below finds them. Foreign-key columns are the first place to look for a missing index.' },
    `## When an index hurts: a review checklist
Use this list when you inherit a database:

1. **Missing**: foreign-key columns, and columns in frequent \`WHERE\`, \`JOIN\` and \`ORDER BY\` clauses of queries that are really slow.
2. **Duplicate or redundant**: the same columns twice, or an index that is the **first columns** of another (last lesson, challenge 3).
3. **Unused**: \`idx_scan = 0\` over a full business cycle on a real server. Remember that unique and primary-key indexes enforce rules even when no query reads them.
4. **Low selectivity**: an index on a column with two or three values (status, a yes/no flag). Make it **partial** if you care about the rare value, or drop it.
5. **Too wide**: ten columns in one index is almost always a mistake. It is big, and only the exact leftmost prefixes help.
6. **On a tiny table**: a table of 20 rows fits in one page. A scan of that page is cheaper than any index.
7. **On a hot write path**: a column that is updated constantly (a status, a counter) kills HOT updates and bloats the index. Index it only if a query truly needs it.
8. **Bloated**: an index much larger than it should be after heavy updates. Rebuild it with \`REINDEX INDEX CONCURRENTLY\`.`,
    `## Practice
Three catalog queries, the kind a DBA runs in the first hour on a new system. They read PostgreSQL's own catalog tables, which describe the indexes and constraints of the Kollana database.`,
    { challenge: {
      id: 'sql-indexes-deep-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'List the **unique** indexes of the `public` schema that are **not** primary keys, using the view `pg_indexes`. Return `table_name` (column `tablename`), `index_name` (column `indexname`) and `column_list`: the text between the parentheses of `indexdef`, for example `account_code`. Sort by `table_name`, then `index_name`. (4 rows. A unique index starts with `CREATE UNIQUE INDEX`, and primary-key index names end in `pkey`.)',
      starter: `SELECT tablename AS table_name, indexname AS index_name, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname`,
      hint: "Filter indexdef LIKE 'CREATE UNIQUE INDEX%' AND indexname NOT LIKE '%pkey'. Cut the columns out with substring(indexdef FROM '\\((.*)\\)').",
      solution: `SELECT tablename AS table_name, indexname AS index_name,
       substring(indexdef FROM '\\((.*)\\)') AS column_list
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  AND indexname NOT LIKE '%pkey'
ORDER BY tablename, indexname`,
    } },
    { challenge: {
      id: 'sql-indexes-deep-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'How much of each table is index? For every ordinary table in `public` that has at least one index return `table_name`, `table_kb` (`pg_table_size` divided by 1024), `index_kb` (`pg_indexes_size` divided by 1024, whole kB) and `index_pct`: the index share of table plus indexes, as a percentage with 1 decimal. Sort by `index_pct` descending, then `table_name`. (11 rows. Tables with no index at all are left out.)',
      starter: `SELECT c.relname AS table_name
FROM pg_class c
WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname`,
      hint: "Use pg_table_size(c.oid) and pg_indexes_size(c.oid). Divide the integer sizes by 1024 for kB. index_pct = 100.0 * indexes / (table + indexes). Keep only tables where pg_indexes_size(c.oid) > 0.",
      solution: `SELECT c.relname AS table_name,
       pg_table_size(c.oid) / 1024   AS table_kb,
       pg_indexes_size(c.oid) / 1024 AS index_kb,
       ROUND(100.0 * pg_indexes_size(c.oid) / (pg_table_size(c.oid) + pg_indexes_size(c.oid)), 1) AS index_pct
FROM pg_class c
WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
  AND pg_indexes_size(c.oid) > 0
ORDER BY index_pct DESC, c.relname`,
    } },
    { challenge: {
      id: 'sql-indexes-deep-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Find the **foreign-key columns that have no index** starting with that column. Use the catalogs: `pg_constraint` (`contype = \'f\'`, the referencing columns are in the array `conkey`) and `pg_index` (`indrelid` is the table, `indkey[0]` is the first column of the index, with the same attribute numbers). Only the **first** column of each foreign key counts. Return `table_name` (as text, for example `fact_gl`) and `fk_column`, sorted by both. Only the `public` schema. (4 rows.)',
      starter: `SELECT c.conrelid::regclass::text AS table_name, c.conname AS constraint_name
FROM pg_constraint c
WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
ORDER BY 1, 2`,
      hint: "Take the first column number with c.conkey[1], get its name from pg_attribute (attrelid = c.conrelid AND attnum = c.conkey[1]), and keep the constraint when NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]). Note that indkey is 0-based and conkey is 1-based.",
      solution: `SELECT c.conrelid::regclass::text AS table_name, a.attname AS fk_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1])
ORDER BY 1, 2`,
    } },
    { real: 'A quarterly **index review** is a small habit that pays for itself: list the biggest indexes with their `idx_scan` counts, list foreign keys without an index, list duplicates and prefixes, and look at any index much bigger than the table\'s data. On a client system, never drop an index on the same day you find it: first record its size and scan counts, then wait through a full month-end cycle before you decide, and keep the `CREATE INDEX` statement in your migration scripts so it can be rebuilt if a forgotten quarterly report turns out to need it. And before a big one-time load (a year of history, a migration), consider **dropping the secondary indexes, loading, and re-creating them**: building an index once is far cheaper than updating it row by row.' },
    { interview: '"When would you use a GIN index instead of a B-tree? And what is a partial index for?" Model answer: "A B-tree stores one key per row and answers equal, range and sort questions. A GIN index stores many keys per row, so it answers contains questions: a jsonb document with @>, an array element, a word in a text search, or a trigram for LIKE with a leading wildcard. It is bigger and slower to update, so I use it only when a measured query needs it, and I pick jsonb_path_ops when I only search with @>. A partial index has a WHERE clause and holds only the rows that matter, for example the 1% of ledger lines that are Parked, or the one current row of an employee in a history table. It is tiny, cheap on writes, and a unique partial index can enforce a rule such as one current row per key." Follow-up: "What does an index cost?" (disk, slower writes, bloat after updates, and it can block HOT updates).' },
    `## Recap
- An index supports certain **operators**. **B-tree** (default): equal, range, sort. **Hash**: equal only, rarely worth it. **GIN**: contains (jsonb \`@>\`, arrays, text, trigrams), big and slow to write. **GiST**: ranges, overlap, nearest, exclusion constraints. **BRIN**: tiny index for a huge table stored in column order (check **correlation** near 1 or -1).
- On \`gl_big\` the BRIN was 24 kB against 1,992 kB for the B-tree. A BRIN on a scattered column (\`posting_date\`) is useless.
- **Partial** indexes (\`WHERE ...\`) hold only some rows: tiny, cheap, used when the query repeats the predicate. A **unique partial** index enforces "one current row per key".
- **Expression** indexes index a calculation (\`EXTRACT\`, \`LOWER\`, \`payload ->> 'status'\`): the query must use the same expression, and you \`ANALYZE\` afterwards.
- **Covering** indexes (\`INCLUDE\`) enable **Index Only Scans**, which need **VACUUM** to keep the visibility map current: watch **Heap Fetches**.
- Every index slows writes and takes space (four indexes were almost as big as the data). Updates to indexed columns add entries to **every** index and **bloat** them. **HOT** updates avoid the index when no indexed column changes and the page has room. Rebuild with \`REINDEX ... CONCURRENTLY\`.
- PostgreSQL does **not** index foreign-key columns for you. Review a database for **missing**, **redundant**, **unused**, **low-selectivity**, **too-wide** and **bloated** indexes.`,
  ],
  quiz: [
    { q: 'You want to find job events whose JSON payload contains `{"status": "failed"}` using `payload @> \'{"status": "failed"}\'`. Which index type fits?', o: ['Hash on the payload column', 'BRIN on the payload column', 'GIN on the payload column', 'B-tree on the payload column'], a: 2, why: 'GIN stores every key found inside the value and the rows that contain it, which is what a containment search needs. A B-tree stores the whole document as one key.' },
    { q: 'A table of 10 crore log lines is only ever appended to, so rows are stored in `event_time` order. Which index gives range searches on `event_time` with the smallest size?', o: ['BRIN', 'GIN', 'B-tree', 'Hash'], a: 0, why: 'BRIN stores only the minimum and maximum of each block of pages. It works when physical order follows the column (correlation near 1), and it is tiny: 24 kB against 1,992 kB in the lesson.' },
    { q: 'An index is created `WHERE status = \'Parked\'`. A query filters `WHERE journal_id = 50` and nothing else. Can it use the partial index?', o: ['Yes, a partial index is used for any query on the table', 'Yes, but only after VACUUM', 'No, the query does not repeat the index predicate, so the index might not hold the rows it needs', 'No, partial indexes cannot be used by SELECT'], a: 2, why: 'The planner may use a partial index only if the query\'s WHERE implies the index\'s WHERE. Here the index holds only Parked lines, and the query asks for all lines of journal 50.' },
    { q: 'What does `Heap Fetches: 8002` in an Index Only Scan tell you?', o: ['The index is corrupt', 'Eight thousand rows were returned, nothing more', 'The table was fetched 8002 times by the index', 'The scan had to visit the table for those rows, usually because VACUUM has not marked the pages as all-visible yet'], a: 3, why: 'An Index Only Scan can skip the table only for pages the visibility map marks as visible to everyone. VACUUM maintains that map. Until it runs, every row needs a table visit and the saving is lost.' },
    { q: 'Which `UPDATE` can be a HOT (heap-only) update that does not touch the indexes?', o: ['One that changes an indexed column', 'One that changes only columns that no index contains, when the new row version fits on the same page', 'Any UPDATE on a table with a primary key', 'Any UPDATE inside a transaction'], a: 1, why: 'HOT needs two things: no indexed column changes, and room on the same page for the new version (a lower fillfactor helps). Then no index entries are written.' },
    { q: 'PostgreSQL creates a primary key index automatically. What about a foreign key column such as `fact_gl.account_id`?', o: ['It is indexed automatically too', 'It is indexed only if the table has fewer than 1000 rows', 'It cannot be indexed', 'No: the referencing column gets no index unless you create one, so joins and parent deletes may scan the whole child table'], a: 3, why: 'Only the referenced (primary or unique) side has an index. Create one on the referencing column yourself when you join or delete through it. The catalog query in the challenge finds the ones that are missing.' },
  ],
  task: {
    title: 'Index review of a small database',
    steps: [
      'Create `29_indexes_deep.sql` in `C:\\sql-practice`. Build `gl_big` and `plan_nodes` as in the last lesson. Create a B-tree, a hash and a BRIN index on `journal_id` and record the three sizes with `pg_size_pretty(pg_relation_size(...))`. Write one line on when you would pick each.',
      'Create `job_events` as in the lesson (50,000 rows with a JSON payload). Show the plan for `payload @> \'{"status": "failed"}\'` before and after a GIN index, and for `payload ->> \'status\' = \'failed\'`. Then make that second form fast with a B-tree on `((payload ->> \'status\'))` and show the plan.',
      'Build the partial index on `status = \'Parked\'`, the expression index on `EXTRACT(MONTH FROM posting_date)` and the covering index `(journal_id) INCLUDE (amount)`. For the covering index run `EXPLAIN (ANALYZE)` before and after `VACUUM gl_big;` and write down the Heap Fetches both times.',
      'Create the table `emp_cur` with the unique partial index `one_current_row` and prove it blocks a second current row. Then try the exclusion constraint with `btree_gist` from the callout and write down the error text.',
      'Run the three catalog queries of the practice section on your own laptop database and paste the results as comments. Create an index for each foreign key column you found, then run the query again: it must return no rows.',
      'On `gl_hot` (fillfactor 70) update a non-indexed column, then an indexed one, and record the index sizes. Finish with `REINDEX INDEX CONCURRENTLY gl_hot_amount;` and the size after VACUUM and REINDEX.',
    ],
    deliverable: '`29_indexes_deep.sql` with the commands you ran and, in comments, the three index sizes, the plans before and after each index, the Heap Fetches before and after VACUUM, the exclusion-constraint error, the three catalog results, and the index sizes before and after the HOT experiment.',
  },
};
