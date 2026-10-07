import { PERF_SETUP, GL_BIG, PLAN_NODES } from './shared.js';

export default {
  id: 'sql-performance',
  title: 'Indexes and EXPLAIN: why a query is slow and how to prove the fix',
  goal: 'You can explain why a query is slow in terms of pages read, create the right index, write filters that can use it, choose the column order of a composite index, and prove every change with EXPLAIN (ANALYZE, BUFFERS).',
  roadmap: [
    'B-tree indexes and composite indexes',
    'Unused and duplicate indexes',
    'EXPLAIN and EXPLAIN ANALYZE basics',
    'Sargable filters and SELECT *',
  ],
  blocks: [
    `## The problem
Month-end close, the last working day of the month. An auditor asks: *"Show me journal 4242."* The journal has **2 lines**. The query that fetches them takes a noticeable time. Last April the same query was instant. Nobody changed the SQL. **The table grew.**

\`\`\`sql
SELECT * FROM gl_big WHERE journal_id = 4242;
\`\`\`

Until now your tables had 220 to 1,227 rows, and every query was fast, however it was written. A real ledger has **lakhs or crores of lines**. On that size, two queries that return the same rows can differ a thousand times in cost. This lesson teaches you to see *why*, with numbers, instead of guessing.

The Kollana tables are too small to show this, so the playgrounds in this lesson build a table called \`gl_big\`: **1,00,000 journal lines** (one lakh), two lines per journal, three entities, the 15 real account ids, and posting dates in FY 2025-26. One line in a hundred has the status \`Parked\` (waiting for approval), all others are \`Posted\`. You will find the \`CREATE TABLE\` statement in a callout below, so you can build the same table on your laptop.`,
    `## How a table is stored: pages
PostgreSQL does not read a table row by row from disk. It stores a table in **pages** of 8 kB each, and a page holds many rows. To use a row, the engine must first read its page into memory. Reading pages is the slow part. Comparing values inside a page that is already in memory is cheap.

So the speed of a query is mostly decided by one question: **how many pages does it have to read?**

- A **Seq Scan** (sequential scan) reads **every page of the table**, from the first to the last, and keeps the rows that match the filter. It is the only choice when there is no better way.
- An **index** lets the engine jump straight to the pages that hold the rows you want.

An index is a **separate, sorted structure** stored next to the table. The usual kind is a **B-tree**. Think of the index at the back of a book: sorted words, and next to each word the page numbers. You do not read the whole book to find "GSTIN", you look it up in the index and open page 212. A B-tree does the same with a tree: the root says which branch to follow, the branch says which leaf, and the leaf holds the **key** (the value you search for) and a **pointer** to the row's page.`,
    { sketch: { w: 760, h: 322, caption: 'The same search two ways. Without an index PostgreSQL reads every page and throws almost everything away. With a B-tree it walks root, branch, leaf and opens one table page.', items: [
      { t: 'text', x: 195, y: 20, text: 'No index: Seq Scan', size: 17, bold: true, color: '#c2410c' },
      { t: 'box', x: 20, y: 40, w: 38, h: 30, label: '1', fill: 'grey', size: 13 },
      { t: 'box', x: 64, y: 40, w: 38, h: 30, label: '2', fill: 'grey', size: 13 },
      { t: 'box', x: 108, y: 40, w: 38, h: 30, label: '3', fill: 'grey', size: 13 },
      { t: 'box', x: 152, y: 40, w: 38, h: 30, label: '4', fill: 'grey', size: 13 },
      { t: 'box', x: 196, y: 40, w: 38, h: 30, label: '5', fill: 'grey', size: 13 },
      { t: 'box', x: 240, y: 40, w: 38, h: 30, label: '6', fill: 'grey', size: 13 },
      { t: 'box', x: 284, y: 40, w: 38, h: 30, label: '7', fill: 'grey', size: 13 },
      { t: 'box', x: 328, y: 40, w: 38, h: 30, label: '8', fill: 'grey', size: 13 },
      { t: 'box', x: 20, y: 78, w: 38, h: 30, label: '9', fill: 'grey', size: 13 },
      { t: 'box', x: 64, y: 78, w: 38, h: 30, label: '10', fill: 'grey', size: 13 },
      { t: 'box', x: 108, y: 78, w: 38, h: 30, label: '11', fill: 'grey', size: 13 },
      { t: 'box', x: 152, y: 78, w: 38, h: 30, label: '12', fill: 'pink', size: 13 },
      { t: 'box', x: 196, y: 78, w: 38, h: 30, label: '13', fill: 'grey', size: 13 },
      { t: 'box', x: 240, y: 78, w: 38, h: 30, label: '14', fill: 'grey', size: 13 },
      { t: 'box', x: 284, y: 78, w: 38, h: 30, label: '...', fill: 'grey', size: 13 },
      { t: 'box', x: 328, y: 78, w: 38, h: 30, label: '896', fill: 'grey', size: 12 },
      { t: 'note', x: 20, y: 124, w: 346, h: 78, fill: 'pink', size: 14, text: 'Reads all 896 pages of the table.\nThe 2 lines of journal 4242 are in page 12 only.\n99,998 rows are read and thrown away.' },
      { t: 'text', x: 195, y: 232, text: 'cost grows with the size of the table', size: 15, color: '#c2410c' },
      { t: 'line', x1: 392, y1: 14, x2: 392, y2: 300, dashed: true },
      { t: 'text', x: 572, y: 20, text: 'B-tree index on journal_id', size: 17, bold: true, color: '#2f9e44' },
      { t: 'box', x: 470, y: 36, w: 204, h: 46, label: 'root', sub: 'which range of journal_id?', fill: 'green', size: 16 },
      { t: 'arrow', x1: 572, y1: 84, x2: 572, y2: 106 },
      { t: 'box', x: 470, y: 108, w: 204, h: 46, label: 'branch', sub: 'narrower range', fill: 'green', size: 16 },
      { t: 'arrow', x1: 572, y1: 156, x2: 572, y2: 178 },
      { t: 'box', x: 470, y: 180, w: 204, h: 46, label: 'leaf', sub: '4242 points to page 12', fill: 'green', size: 16 },
      { t: 'arrow', x1: 572, y1: 228, x2: 572, y2: 250 },
      { t: 'box', x: 470, y: 252, w: 204, h: 46, label: 'table page 12', sub: 'the 2 lines', fill: 'pink', size: 16 },
      { t: 'text', x: 700, y: 160, text: '3 pages', size: 15, color: '#2f9e44', bold: true },
    ] } },
    { local: `**Build the same table on your laptop** (psql or DBeaver, database \`fde_practice\`). The playgrounds in this lesson run this for you before your own statements:
\`\`\`sql
${GL_BIG.replace(/`/g, '\\`')}
\`\`\`
and a small helper that tells you the **shape of the plan** without running the query. You will use it a lot, because it prints one line per query, which makes comparing plans easy:
\`\`\`sql
${PLAN_NODES.replace(/`/g, '\\`')}

SELECT plan_nodes('SELECT * FROM gl_big WHERE journal_id = 4242');   -- try it
\`\`\`
**What to expect:** \`CREATE TABLE gl_big\` finishes quickly and \`SELECT COUNT(*) FROM gl_big;\` returns 100000. The helper returns \`Seq Scan\` for the query above, because there is no index yet.` },
    `## See the cost: EXPLAIN ANALYZE with BUFFERS
\`EXPLAIN\` shows the **plan**: the steps PostgreSQL chooses. Add \`ANALYZE\` and it also **runs** the query and reports what really happened. Add \`BUFFERS\` and it counts the **pages** touched. That page count is the honest measure of work, because it does not change from one run to the next (a clock does).

In the first playground there is no index and \`ANALYZE\` has never been run on the table. Read the plan from the **top line**, and notice three things: the **node** (what kind of step), **rows=** (how many rows the planner *expected* against how many it *got*), and the **Buffers** line (pages).`,
    { sql: {
      title: 'Without an index: every page is read',
      setup: PERF_SETUP,
      starter: `-- gl_big is built for you: 1,00,000 journal lines (the statement is in the callout above).
SELECT COUNT(*) AS lines, MAX(journal_id) AS journals FROM gl_big;
SELECT pg_relation_size('gl_big') / 8192 AS pages, pg_size_pretty(pg_relation_size('gl_big')) AS size;

-- The journal the auditor asked for. It has 2 lines. There is no index, so PostgreSQL has to read the whole table.
-- TIMING OFF and SUMMARY OFF hide the clock, so the output is the same every time you run it.
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF)
SELECT * FROM gl_big WHERE journal_id = 4242;`,
      note: 'The table has 100000 lines in 50000 journals, and it occupies 896 pages (7168 kB). The plan is one node, a Seq Scan with the filter journal_id = 4242. It says "Rows Removed by Filter: 99998" (the 2 matching rows are kept) and the Buffers line adds up to 896 pages: the whole table was read for 2 rows. Notice rows=323 in the first bracket: that is the planner\'s GUESS, made without statistics, against actual rows=2.00. The next playgrounds run ANALYZE and the guess becomes right.',
    } },
    `## Create the index
\`\`\`sql
CREATE INDEX gl_big_journal_idx ON gl_big (journal_id);
\`\`\`
That one statement reads the table once, sorts the \`journal_id\` values and writes the B-tree. Then **\`ANALYZE gl_big\`** refreshes the **statistics** the planner uses to choose between plans (the next lesson is about that). Run both, then the same query again.`,
    { sql: {
      title: 'The same query with an index',
      setup: PERF_SETUP,
      starter: `CREATE INDEX gl_big_journal_idx ON gl_big (journal_id);
ANALYZE gl_big;

EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY OFF)
SELECT * FROM gl_big WHERE journal_id = 4242;

-- What did the index cost? It is a second structure on disk.
SELECT pg_size_pretty(pg_relation_size('gl_big'))            AS table_size,
       pg_size_pretty(pg_relation_size('gl_big_journal_idx')) AS index_size;

-- A B-tree keeps the keys SORTED, so the same index also helps ranges and ORDER BY ... LIMIT
SELECT plan_nodes('SELECT * FROM gl_big WHERE journal_id BETWEEN 100 AND 110')   AS small_range,
       plan_nodes('SELECT * FROM gl_big ORDER BY journal_id LIMIT 10')           AS order_by_limit,
       plan_nodes('SELECT * FROM gl_big WHERE journal_id <> 4242')               AS everything_else;`,
      note: 'The plan is now an Index Scan using gl_big_journal_idx with Index Cond: (journal_id = 4242). It returns the same 2 rows, now estimated correctly (rows=2) because of ANALYZE, and the Buffers line under the scan adds up to only 3 pages (hit=1 read=2, or all hits) instead of 896. The index costs 1992 kB next to the 7168 kB table. A narrow range and ORDER BY ... LIMIT also use the index (the sorted order gives the first 10 rows for free), but "everything except one journal" is a Seq Scan: when you need almost the whole table, walking an index is slower than reading the table.',
    } },
    `## "Why did it not use my index?" Selectivity
Having an index does not force PostgreSQL to use it. The planner compares **costs** and picks the cheapest plan. The deciding idea is **selectivity**: *what fraction of the table does the filter keep?*

- Keeps **a tiny fraction** (one journal in 50,000): the index wins. A few lookups, a few pages.
- Keeps **most of the table** (99% of the lines are \`Posted\`): the index loses. Each index entry sends the engine to a table page at random, and the engine would visit almost every page anyway, many of them twice. Reading the table in order is cheaper.

This is why you do **not** index every column. A column with few distinct values (status, channel, a yes/no flag) is a poor index on its own. A column with **many** distinct values (journal id, invoice number, GSTIN) is a good one. The same index can be great for \`status = 'Parked'\` (1%) and useless for \`status = 'Posted'\` (99%).`,
    { sql: {
      title: 'The same index, a useful and a useless filter',
      setup: PERF_SETUP,
      starter: `CREATE INDEX gl_big_status_idx ON gl_big (status);
ANALYZE gl_big;

SELECT status, COUNT(*) AS lines, ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_of_table
FROM gl_big
GROUP BY status
ORDER BY status;

-- plan_nodes() returns the steps of the plan, then the name of every index it uses
SELECT plan_nodes($$SELECT * FROM gl_big WHERE status = 'Parked'$$) AS parked_1_percent,
       plan_nodes($$SELECT * FROM gl_big WHERE status = 'Posted'$$) AS posted_99_percent;`,
      note: 'Parked is 1000 lines (1.0 percent) and Posted is 99000 lines (99.0 percent). For Parked the plan is an Index Scan using gl_big_status_idx. For Posted it is a plain Seq Scan: the index exists, and the planner does not use it, because keeping 99 percent of the table makes the index slower than reading the table once.',
    } },
    { warn: 'An index is **not free**. Every `INSERT` must add an entry to every index on the table, every `DELETE` and most `UPDATE`s must change them, and each index uses disk space and memory. Ten indexes on a table that is loaded all night make the load ten times more work. Create an index for a **query you have measured**, not "just in case". The lesson after this one covers partial indexes, which keep an index small when only a few rows matter.' },
    `## Sargable filters: keep the column alone
Now the most common reason an index is ignored. An index is sorted by the **column value**. If your filter changes the column first (calls a function on it, does arithmetic on it, casts it), the index is sorted by the wrong thing and cannot be searched. PostgreSQL must compute the expression for **every row**.

A filter that an index can search is called **sargable**: *Search ARGument ABLE*. The rule is short: **put the indexed column alone on one side of the comparison, and move all calculation to the other side.**`,
    { sketch: { w: 760, h: 292, caption: 'Left: filters that hide the column inside an expression. Right: the same question written so a plain index on the column can be used.', items: [
      { t: 'text', x: 180, y: 16, text: 'cannot use an index on the column', size: 16, bold: true, color: '#c2255c' },
      { t: 'text', x: 580, y: 16, text: 'can use it', size: 16, bold: true, color: '#2f9e44' },
      { t: 'box', x: 14, y: 34, w: 334, h: 46, label: 'EXTRACT(MONTH FROM posting_date) = 1', fill: 'pink', size: 14 },
      { t: 'arrow', x1: 350, y1: 57, x2: 394, y2: 57 },
      { t: 'box', x: 396, y: 34, w: 350, h: 46, label: "posting_date >= '2026-01-01'\nAND posting_date < '2026-02-01'", fill: 'green', size: 13 },
      { t: 'box', x: 14, y: 94, w: 334, h: 46, label: 'amount * 1.18 > 1000', fill: 'pink', size: 14 },
      { t: 'arrow', x1: 350, y1: 117, x2: 394, y2: 117 },
      { t: 'box', x: 396, y: 94, w: 350, h: 46, label: 'amount > 1000 / 1.18', fill: 'green', size: 14 },
      { t: 'box', x: 14, y: 154, w: 334, h: 46, label: "journal_id::text = '4242'", fill: 'pink', size: 14 },
      { t: 'arrow', x1: 350, y1: 177, x2: 394, y2: 177 },
      { t: 'box', x: 396, y: 154, w: 350, h: 46, label: 'journal_id = 4242', fill: 'green', size: 14 },
      { t: 'box', x: 14, y: 214, w: 334, h: 46, label: "UPPER(supplier_name) = 'APEX RETAIL'", fill: 'pink', size: 14 },
      { t: 'arrow', x1: 350, y1: 237, x2: 394, y2: 237 },
      { t: 'box', x: 396, y: 214, w: 350, h: 46, label: 'an index ON (UPPER(supplier_name))\n(next lesson), or store a clean name', fill: 'green', size: 13 },
    ] } },
    { sql: {
      title: 'Four ways to ask for January, with the same index',
      setup: PERF_SETUP,
      starter: `CREATE INDEX gl_big_date_idx ON gl_big (posting_date);
CREATE INDEX gl_big_journal_idx ON gl_big (journal_id);
ANALYZE gl_big;

-- All three January filters give the SAME answer ...
SELECT (SELECT COUNT(*) FROM gl_big WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01') AS range_filter,
       (SELECT COUNT(*) FROM gl_big WHERE EXTRACT(MONTH FROM posting_date) = 1)                                    AS extract_filter,
       (SELECT COUNT(*) FROM gl_big WHERE TO_CHAR(posting_date, 'YYYY-MM') = '2026-01')                            AS to_char_filter;

-- ... but not the same plan
SELECT how, plan
FROM (VALUES
  (1, 'range on the column',   plan_nodes($$SELECT * FROM gl_big WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01'$$)),
  (2, 'EXTRACT on the column', plan_nodes($$SELECT * FROM gl_big WHERE EXTRACT(MONTH FROM posting_date) = 1$$)),
  (3, 'TO_CHAR on the column', plan_nodes($$SELECT * FROM gl_big WHERE TO_CHAR(posting_date, 'YYYY-MM') = '2026-01'$$)),
  (4, 'journal_id = 4242',     plan_nodes($$SELECT * FROM gl_big WHERE journal_id = 4242$$)),
  (5, 'journal_id + 0 = 4242', plan_nodes($$SELECT * FROM gl_big WHERE journal_id + 0 = 4242$$)),
  (6, 'journal_id::text = ...', plan_nodes($$SELECT * FROM gl_big WHERE journal_id::text = '4242'$$))
) AS t(n, how, plan)
ORDER BY n;`,
      note: 'All three January filters count 8494 lines. The range filter uses the date index (Bitmap Heap Scan, Bitmap Index Scan, gl_big_date_idx: a bitmap scan is the middle choice for several thousand rows). EXTRACT and TO_CHAR are Seq Scans although the index exists. The single-journal lookup is an Index Scan, while journal_id + 0 and journal_id::text are Seq Scans: the arithmetic and the cast hide the column. Same question, same answer, and the cost depends only on how it was written.',
    } },
    `Three more things to keep in mind:

- **Implicit casts count.** If you compare a *text* column with a *number* (\`WHERE invoice_no = 689\`), PostgreSQL has to cast the column, not the number, and the index is lost. Compare like with like: text with text. This is a classic bug when a GSTIN or an invoice number is stored as text and the application sends a number.
- **A leading wildcard** (\`LIKE '%Retail'\`) cannot use a normal B-tree, because the tree is sorted from the **start** of the text. \`LIKE 'Apex%'\` is a prefix and can (on suitable settings). Searching *inside* text needs a different kind of index, which comes in the next lesson.
- **\`BETWEEN\` and half-open ranges.** For dates and timestamps prefer \`>= start AND < next_start\`. It is sargable, and it does not lose the last day (you saw the reason in the dates lesson).`,
    `## Composite indexes: the order of the columns
An index can cover **several columns**: \`CREATE INDEX ... ON gl_big (entity_id, posting_date)\`. It is sorted by \`entity_id\` first, and **inside each entity** by \`posting_date\`. Think of a telephone directory sorted by city, then by name: easy to find *"Rao in Pune"*, easy to list *"everyone in Pune"*, but to find *"every Rao"* in all cities you must open every city's section.

The same happens in the index:

- \`WHERE entity_id = 2 AND posting_date = DATE '2026-01-15'\`: both columns, one jump. **Best.**
- \`WHERE entity_id = 2\`: the **leftmost column** alone, one block. **Good.**
- \`WHERE posting_date = DATE '2026-01-15'\`: only the **second** column. The matching entries are scattered in every entity's block. This is the **leftmost-prefix rule**: an index helps a filter that uses its first column, or the first two, and so on, but classically *not* a filter that skips the first column.

Rules of thumb for the order: put the columns you compare with **\`=\`** first, then the column with a **range** (\`>\`, \`<\`, \`BETWEEN\`) or the one you sort by. And check which filters your real queries use before you build the index.`,
    { sketch: { w: 760, h: 290, caption: 'An index on (entity_id, posting_date) is sorted by entity first. A filter on the date alone finds its entries in every entity block.', items: [
      { t: 'table', x: 14, y: 40, title: 'the index, in sorted order', cols: ['entity_id', 'posting_date'], colW: [100, 140], rows: [['1', '2026-01-14'], ['1', '2026-01-15'], ['1', '2026-01-16'], ['2', '2026-01-14'], ['2', '2026-01-15'], ['2', '2026-01-16'], ['3', '2026-01-14'], ['3', '2026-01-15']], rowH: 26, hl: [4] },
      { t: 'note', x: 280, y: 36, w: 466, h: 56, fill: 'green', size: 14, text: 'entity_id = 2 AND posting_date = 15 Jan\nOne jump to the highlighted entry. The best case.' },
      { t: 'note', x: 280, y: 104, w: 466, h: 56, fill: 'green', size: 14, text: 'entity_id = 2\nOne block of three entries. Good.' },
      { t: 'note', x: 280, y: 172, w: 466, h: 100, fill: 'yellow', size: 14, text: 'posting_date = 15 Jan alone\nThe 15 Jan entries sit in every entity block (rows 2, 5 and 8).\nOlder PostgreSQL must read the whole index. PostgreSQL 18 can\nskip from block to block, but only when the first column has few\ndistinct values, as entity_id does.' },
    ] } },
    { sql: {
      title: 'Leftmost prefix: which index serves which filter',
      setup: PERF_SETUP,
      starter: `-- Index A: first column has only 3 distinct values (entity_id).
CREATE INDEX gl_big_entity_date_idx ON gl_big (entity_id, posting_date);
ANALYZE gl_big;
SELECT plan_nodes($$SELECT * FROM gl_big WHERE entity_id = 2 AND posting_date = DATE '2026-01-15'$$) AS both_columns,
       plan_nodes($$SELECT * FROM gl_big WHERE entity_id = 2$$)                                      AS first_column_only,
       plan_nodes($$SELECT * FROM gl_big WHERE posting_date = DATE '2026-01-15'$$)                   AS second_column_only;

-- The filter on the second column alone: look for "Index Searches" in the index node
EXPLAIN (ANALYZE, BUFFERS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM gl_big WHERE posting_date = DATE '2026-01-15';

-- Index B: first column has 50,000 distinct values (journal_id). Replace A with B.
DROP INDEX gl_big_entity_date_idx;
CREATE INDEX gl_big_journal_date_idx ON gl_big (journal_id, posting_date);
ANALYZE gl_big;
SELECT plan_nodes($$SELECT * FROM gl_big WHERE journal_id = 4242 AND posting_date = DATE '2026-01-15'$$) AS both_columns,
       plan_nodes($$SELECT * FROM gl_big WHERE posting_date = DATE '2026-01-15'$$)                       AS second_column_only;`,
      note: 'With index A (entity_id first) all three filters use it, including the one on posting_date alone: this database is PostgreSQL 18, which can "skip" from one of the 3 entity blocks to the next (the EXPLAIN shows Index Searches: 5 in the index node, instead of 1: five separate searches). With index B (journal_id first, 50000 distinct values) a filter on posting_date alone cannot be helped: the plan is a Seq Scan. Do not rely on the skip: it only pays when the first column has very few values, and older servers and other databases do not have it. Design the order for the filters you have.',
    } },
    `## SELECT *, OFFSET and other slow habits
- **\`SELECT *\`** reads and sends **every column**, including wide text columns the report never shows. It also blocks the cheapest kind of scan (an *index-only scan*, next lesson) and makes a query change behaviour silently when someone adds a column. Name the columns you need.
- **\`OFFSET\`** for paging (\`LIMIT 50 OFFSET 100000\`) reads and discards 100,000 rows to show 50. For long lists use **keyset paging**: remember the last key you showed and ask for the next page with \`WHERE journal_id > 4242 ORDER BY journal_id LIMIT 50\`, which an index answers directly.
- **\`DISTINCT\` as a bandage.** If a join returns duplicates, \`DISTINCT\` hides the symptom and adds a sort. Find the fan-out instead (the joins lesson).
- **A function in the join or filter on a big table.** \`WHERE DATE_TRUNC('month', posting_date) = ...\` is the same sargable trap as \`EXTRACT\`.`,
    `## EXPLAIN is not harmless: it can run your statement
\`EXPLAIN\` alone only plans. **\`EXPLAIN ANALYZE\` really executes the statement**, so on an \`UPDATE\`, \`DELETE\` or \`INSERT\` it changes the data. When you want to measure a change, wrap it in a transaction you roll back:`,
    { sql: {
      title: 'Measure an UPDATE and leave no trace',
      setup: PERF_SETUP,
      starter: `BEGIN;
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
UPDATE gl_big SET status = 'Posted' WHERE status = 'Parked';
ROLLBACK;

-- The data is exactly as before: the 1000 parked lines are still parked
SELECT COUNT(*) FILTER (WHERE status = 'Parked') AS parked_lines FROM gl_big;`,
      note: 'The plan is "Update on gl_big" over a Seq Scan, and the scan reports the rows it found and changed (actual rows=1000.00). After the ROLLBACK the table is untouched: 1000 lines are still Parked. Without the BEGIN ... ROLLBACK the EXPLAIN ANALYZE would have posted all 1000 lines for good.',
    } },
    { local: `**Measuring on your laptop** (psql or DBeaver):
\`\`\`sql
\\timing on
SELECT * FROM gl_big WHERE journal_id = 4242;              -- note the time psql prints
CREATE INDEX gl_big_journal_idx ON gl_big (journal_id);
SELECT * FROM gl_big WHERE journal_id = 4242;              -- run it twice: the second run is the honest one
\`\`\`
**What to expect:** psql prints \`Time: ... ms\` after each statement. Times change from run to run (the first run may read from disk, the second from memory), so trust the **Buffers** page counts in \`EXPLAIN (ANALYZE, BUFFERS)\` and compare times only by orders of magnitude. DBeaver has a plan viewer: right-click a query and choose **Explain Execution Plan**.

**On a real production table** create the index with \`CREATE INDEX CONCURRENTLY gl_big_journal_idx ON gl_big (journal_id);\`. A plain \`CREATE INDEX\` blocks writes to the table while it builds. The \`CONCURRENTLY\` form takes longer and cannot run inside a transaction block, but the application keeps working. If it fails it leaves an *invalid* index behind: look for it with \`SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;\`, drop it and try again.

**Find indexes nobody uses** (on a real server that has been running through a full month-end cycle):
\`\`\`sql
SELECT relname AS table_name, indexrelname AS index_name, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
\`\`\`
**What to expect:** one row per index that no query has used since the statistics were last reset. Read it carefully before dropping anything: the counters restart when the statistics are reset or after some crashes, an index may serve only a quarterly report, and an index that enforces \`UNIQUE\` or a primary key does work even with \`idx_scan = 0\`. (In the in-browser database these counters stay at 0, so this query is for a real server.)` },
    `## Practice
All three are single \`SELECT\` statements on the Kollana data. The first picks index candidates by selectivity, the second writes the half-open date ranges of a sargable filter, the third reviews a list of index definitions for waste.`,
    { challenge: {
      id: 'sql-performance-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Which `orders` columns would make a useful index? Return `column_name, distinct_values, avg_rows_per_value` for the five columns `order_id`, `customer_id`, `product_id`, `channel` and `status`. `distinct_values` is `COUNT(DISTINCT column)` (NULL does not count), `avg_rows_per_value` is the number of rows in `orders` divided by `distinct_values`, rounded to 1 decimal. Sort by `distinct_values` descending, then `column_name`. (5 rows. A column that gives few rows per value is selective.)',
      starter: `SELECT 'order_id' AS column_name, COUNT(DISTINCT order_id) AS distinct_values
FROM orders
-- add the other four columns with UNION ALL, then compute avg_rows_per_value and sort`,
      hint: "Build the five (column_name, distinct_values) rows with UNION ALL, wrap them in a subquery, and divide (SELECT COUNT(*) FROM orders) by distinct_values. Cast to numeric before dividing.",
      solution: `SELECT column_name, distinct_values,
       ROUND((SELECT COUNT(*) FROM orders)::numeric / distinct_values, 1) AS avg_rows_per_value
FROM (
  SELECT 'order_id' AS column_name, COUNT(DISTINCT order_id) AS distinct_values FROM orders
  UNION ALL SELECT 'customer_id', COUNT(DISTINCT customer_id) FROM orders
  UNION ALL SELECT 'product_id',  COUNT(DISTINCT product_id)  FROM orders
  UNION ALL SELECT 'channel',     COUNT(DISTINCT channel)     FROM orders
  UNION ALL SELECT 'status',      COUNT(DISTINCT status)      FROM orders
) AS t
ORDER BY distinct_values DESC, column_name`,
    } },
    { challenge: {
      id: 'sql-performance-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'The four quarters of FY 2025-26 start on 1 April, 1 July, 1 October and 1 January. For each quarter return `quarter` (`Q1` to `Q4`), `range_start`, `range_end_exclusive` (the first day of the NEXT quarter) and `orders`: the number of orders with `order_date >= range_start AND order_date < range_end_exclusive`. This is the sargable way to filter a quarter. Sort by `quarter`. (4 rows.)',
      starter: `SELECT q.quarter,
       q.range_start
       -- add range_end_exclusive and the order count
FROM (VALUES ('Q1', DATE '2025-04-01'), ('Q2', DATE '2025-07-01'),
             ('Q3', DATE '2025-10-01'), ('Q4', DATE '2026-01-01')) AS q(quarter, range_start)
ORDER BY q.quarter`,
      hint: "range_end_exclusive is range_start + INTERVAL '3 months' (cast it back to date). The count can be a scalar subquery on orders with the two comparisons, or a LEFT JOIN with GROUP BY.",
      solution: `SELECT q.quarter,
       q.range_start,
       (q.range_start + INTERVAL '3 months')::date AS range_end_exclusive,
       (SELECT COUNT(*) FROM orders o
        WHERE o.order_date >= q.range_start AND o.order_date < q.range_start + INTERVAL '3 months') AS orders
FROM (VALUES ('Q1', DATE '2025-04-01'), ('Q2', DATE '2025-07-01'),
             ('Q3', DATE '2025-10-01'), ('Q4', DATE '2026-01-01')) AS q(quarter, range_start)
ORDER BY q.quarter`,
    } },
    { challenge: {
      id: 'sql-performance-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'An index is **redundant** when another index on the same table starts with the same columns in the same order (the longer index can do its job), or when it is an exact copy of another one (then flag the one whose name sorts **later**). The review list is in the starter. Return `redundant_index, covered_by`, sorted by table name, then `redundant_index`. Do not flag an index that merely has the same columns in a different order. (4 rows.)',
      starter: `WITH idx(index_name, table_name, cols) AS (
  VALUES ('gl_journal',       'fact_gl', ARRAY['journal_id']),
         ('gl_journal_date',  'fact_gl', ARRAY['journal_id', 'posting_date']),
         ('gl_entity',        'fact_gl', ARRAY['entity_id']),
         ('gl_entity_date',   'fact_gl', ARRAY['entity_id', 'posting_date']),
         ('gl_date_entity',   'fact_gl', ARRAY['posting_date', 'entity_id']),
         ('gl_date',          'fact_gl', ARRAY['posting_date']),
         ('ord_customer',     'orders',  ARRAY['customer_id']),
         ('ord_customer_dup', 'orders',  ARRAY['customer_id']),
         ('ord_product_date', 'orders',  ARRAY['product_id', 'order_date'])
)
SELECT a.index_name AS redundant_index, b.index_name AS covered_by
FROM idx a
JOIN idx b ON a.table_name = b.table_name AND a.index_name <> b.index_name
-- add the rule: b starts with all the columns of a`,
      hint: "Compare the first cardinality(a.cols) elements of b with a: b.cols[1:cardinality(a.cols)] = a.cols. Then add: b is longer, OR the lists are equal and a.index_name > b.index_name.",
      solution: `WITH idx(index_name, table_name, cols) AS (
  VALUES ('gl_journal',       'fact_gl', ARRAY['journal_id']),
         ('gl_journal_date',  'fact_gl', ARRAY['journal_id', 'posting_date']),
         ('gl_entity',        'fact_gl', ARRAY['entity_id']),
         ('gl_entity_date',   'fact_gl', ARRAY['entity_id', 'posting_date']),
         ('gl_date_entity',   'fact_gl', ARRAY['posting_date', 'entity_id']),
         ('gl_date',          'fact_gl', ARRAY['posting_date']),
         ('ord_customer',     'orders',  ARRAY['customer_id']),
         ('ord_customer_dup', 'orders',  ARRAY['customer_id']),
         ('ord_product_date', 'orders',  ARRAY['product_id', 'order_date'])
)
SELECT a.index_name AS redundant_index, b.index_name AS covered_by
FROM idx a
JOIN idx b ON a.table_name = b.table_name AND a.index_name <> b.index_name
          AND b.cols[1:cardinality(a.cols)] = a.cols
          AND (cardinality(b.cols) > cardinality(a.cols) OR a.index_name > b.index_name)
ORDER BY a.table_name, a.index_name`,
    } },
    { real: 'On a real engagement the slow query is rarely one you wrote. It is a report someone built two years ago, now taking too long. The professional routine is the same every time: **(1) reproduce it** on a copy with realistic volume, **(2) read the plan** with `EXPLAIN (ANALYZE, BUFFERS)`, **(3) change one thing** (an index, a rewrite, fresh statistics), **(4) measure again** and keep the page counts as evidence, **(5) check the cost on writes** before you add an index to a table that is loaded every night. Write the before and after numbers in the ticket. "I added an index" is a guess. "Pages touched fell from 896 to 3" is a result.' },
    { interview: '"A query on a 10-crore-row table is slow. What do you do?" Model answer: "I do not guess. I run EXPLAIN (ANALYZE, BUFFERS) on the real query and look at the biggest node. If it is a Seq Scan that keeps a small fraction of the rows, the table needs an index on the filter column, or the filter is not sargable and I rewrite it (no function or cast on the column, half-open date ranges). If the planner\'s row estimate is far from the actual rows, I refresh the statistics with ANALYZE before touching anything else. For a composite index I put the equality columns first and the range or sort column last. I create the index with CONCURRENTLY on a busy system, I check that the plan really uses it, and I compare the buffer counts before and after. I also check what the index costs on writes, and I look for indexes the new one makes redundant." Follow-up: "Why might the planner ignore your new index?" (the filter keeps most of the table, the expression is not sargable, the statistics are stale, or a different plan is cheaper).' },
    `## Recap
- A table is stored in **8 kB pages**, and speed is mostly **pages read**. A **Seq Scan** reads them all. An **index** (usually a **B-tree**, a sorted structure with pointers to table pages) jumps to the right ones.
- \`EXPLAIN\` shows the plan. \`EXPLAIN (ANALYZE, BUFFERS)\` **runs** the query and counts pages: use **Buffers** as your evidence, because times vary. Wrap a measured \`UPDATE\`/\`DELETE\` in \`BEGIN ... ROLLBACK\`.
- The planner picks the cheapest plan. A filter that keeps **a tiny fraction** (high **selectivity**) uses the index. A filter that keeps most of the table does not, which is why you do not index low-cardinality columns on their own.
- An index is **not free**: it costs disk and slows every write. Index measured queries only.
- A **sargable** filter keeps the **column alone** on one side: no function, arithmetic or cast on it, no leading wildcard, compare like types. Use \`>= start AND < next_start\` for dates.
- In a **composite index** the first column leads: it serves filters on the first column, or the first two, and so on. Put \`=\` columns first, then the range or sort column. PostgreSQL 18 can skip over a first column with few values, but do not depend on it.
- Avoid \`SELECT *\`, deep \`OFFSET\`, and \`DISTINCT\` as a bandage. Use \`CREATE INDEX CONCURRENTLY\` on a busy server, and review indexes for duplicates and prefixes.`,
  ],
  quiz: [
    { q: 'Why is `SELECT * FROM gl_big WHERE journal_id = 4242` slow when there is no index on `journal_id`?', o: ['PostgreSQL has to sort the table first', 'The query returns too many columns', 'PostgreSQL has to read every page of the table and discard the rows that do not match', 'The WHERE clause is not valid SQL'], a: 2, why: 'Without an index the only plan is a Seq Scan: it reads all 896 pages and keeps the 2 matching rows. The cost grows with the size of the table, not with the size of the answer.' },
    { q: 'There is an index on `posting_date`. Which filter for January 2026 can use it?', o: ["`posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01'`", '`EXTRACT(MONTH FROM posting_date) = 1`', "`TO_CHAR(posting_date, 'YYYY-MM') = '2026-01'`", "`posting_date::text LIKE '2026-01%'`"], a: 0, why: 'Only the range keeps posting_date alone on one side of the comparison. The other three compute something from every row first, so the sorted index cannot be searched.' },
    { q: '99% of the lines in a table have `status = \'Posted\'` and there is an index on `status`. What does the planner do for `WHERE status = \'Posted\'`?', o: ['It always uses the index, because one exists', 'It refuses to run the query', 'It builds a new index on the fly', 'It reads the table with a Seq Scan, because walking the index for 99% of the rows costs more'], a: 3, why: 'The planner compares costs. Keeping almost the whole table through an index means a random page visit per entry, which is slower than reading the table once. The same index is useful for the rare status.' },
    { q: 'You create an index on `(entity_id, posting_date)`. Which filter helps the index most reliably on any PostgreSQL version?', o: ['`WHERE posting_date = DATE \'2026-01-15\'`', '`WHERE entity_id = 2 AND posting_date = DATE \'2026-01-15\'`', '`WHERE posting_date > entity_id`', '`WHERE amount > 1000`'], a: 1, why: 'The index is sorted by entity_id first, then by date inside each entity. A filter on both columns, or on the first one, can jump straight in. A filter on the second column alone is the case that older versions cannot help.' },
    { q: 'What is the difference between `EXPLAIN` and `EXPLAIN ANALYZE`?', o: ['They are the same', 'EXPLAIN ANALYZE also runs the statement and reports the real row counts and pages, so on an UPDATE it really changes the data', 'EXPLAIN ANALYZE is faster because it skips planning', 'EXPLAIN ANALYZE only works on SELECT'], a: 1, why: 'Plain EXPLAIN only plans. ANALYZE executes the statement and adds actual rows, loops and (with BUFFERS) pages. Wrap data-changing statements in BEGIN ... ROLLBACK when you measure them.' },
    { q: 'What is the main cost of adding an extra index to a table that is loaded every night?', o: ['Every INSERT and most UPDATEs and DELETEs must also change the index, and it uses disk space and memory', 'SELECT queries become slower', 'The table can no longer have a primary key', 'Nothing, indexes are free'], a: 0, why: 'Reads get faster, writes get slower. Each index is a second structure that must be kept in step with the table, so index the queries you have measured and review the rest for duplicates.' },
  ],
  task: {
    title: 'Make a slow query fast, and prove it',
    steps: [
      'Create `28_performance.sql` in `C:\\sql-practice`. Build `gl_big` with the statement from the callout (and the `plan_nodes` helper). Check `SELECT COUNT(*) FROM gl_big;` is 100000.',
      'Run `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM gl_big WHERE journal_id = 4242;`. Write down the node type, `Rows Removed by Filter` and the pages from the Buffers line. Turn on `\\timing` and note the time too.',
      'Create the index on `journal_id`, run `ANALYZE gl_big;`, and run the same EXPLAIN again. Write down the new node type and pages. Put the two results side by side in a comment.',
      'Run `plan_nodes()` for the three January filters (range, `EXTRACT`, `TO_CHAR`) with an index on `posting_date`. Write one sentence on why only one of them uses the index.',
      'Build a composite index `(entity_id, posting_date)` and then `(journal_id, posting_date)`. For each, check which of the filters "first column", "second column" and "both" use it. Note the PostgreSQL version your server reports with `SELECT version();`.',
      'Make an index on `status` and compare the plans for `\'Parked\'` and `\'Posted\'`. Write the percentage of the table each one keeps.',
      'Run the redundant-index review (challenge 3) idea against your own database: list your indexes with `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = \'public\';` and decide which, if any, are redundant.',
    ],
    deliverable: '`28_performance.sql` with the commands you ran and, in comments, the before and after plan node and page counts for the journal lookup, the sargable and non-sargable January plans, and one sentence on what each index costs.',
  },
};
