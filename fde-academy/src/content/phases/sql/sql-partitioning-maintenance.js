import { PERF_SETUP } from './shared.js';

// The ledger of the lesson as a partitioned table: one partition per month of FY 2025-26, loaded from gl_big.
const PART_SETUP = `CREATE TABLE gl_part (line_id int, journal_id int, entity_id int, account_id int,
                      posting_date date NOT NULL, amount numeric(12,2), status text)
PARTITION BY RANGE (posting_date);
DO $$
DECLARE m date := DATE '2025-04-01';
BEGIN
  WHILE m < DATE '2026-04-01' LOOP
    EXECUTE format('CREATE TABLE %I PARTITION OF gl_part FOR VALUES FROM (%L) TO (%L)',
                   'gl_part_' || to_char(m, 'YYYY_MM'), m, (m + INTERVAL '1 month')::date);
    m := (m + INTERVAL '1 month')::date;
  END LOOP;
END $$;
INSERT INTO gl_part SELECT * FROM gl_big;`;

// partitions_scanned(sql): how many partitions of gl_part the plan will touch (without running the query).
const PARTITIONS_SCANNED = `CREATE FUNCTION partitions_scanned(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE j json;
BEGIN
  EXECUTE 'EXPLAIN (FORMAT JSON) ' || q INTO j;
  RETURN (SELECT COUNT(DISTINCT m[1]) || ' of 12: ' || COALESCE(string_agg(DISTINCT m[1], ', '), 'none')
          FROM regexp_matches(j::text, '"Relation Name": "(gl_part_[0-9_]+)"', 'g') AS m);
END $$;`;

export default {
  id: 'sql-partitioning-maintenance',
  title: 'Partitioning and table maintenance: pruning, retention, autovacuum and bloat',
  goal: 'You can split a big table into partitions by date, check that queries prune them, retire old data with DETACH instead of DELETE, and keep tables healthy: calculate when autovacuum runs, tune it per table, and recognise bloat.',
  roadmap: [
    'Declarative partitioning and pruning',
    'VACUUM, autovacuum and bloat',
    'Table statistics and maintenance',
  ],
  blocks: [
    `## The problem
The Kollana ledger gets about **three crore new lines every year**. Two things are now painful:

1. **Almost every report asks about one month**, but PostgreSQL's indexes and scans work on the whole table, which keeps getting bigger.
2. The retention policy says *"keep seven years of ledger lines, then remove the oldest year"*. Running \`DELETE FROM fact_gl WHERE posting_date < ...\` on **three crore rows** takes very long, writes a huge amount of log, and leaves a lot of **dead space** behind for VACUUM to clean.

The standard answer for a table that is huge and has a natural time axis is **partitioning**: keep it as one *logical* table, but store it as many **smaller physical tables**, one per month. A query for January touches only January's table. Removing a year means **dropping a table**, which is instant.

The second half of this lesson is about **maintenance**: how PostgreSQL cleans up after its own MVCC (the dead row versions from the operations lesson), and how to tell when it is not keeping up.`,
    `## What partitioning is
In **declarative partitioning** you create a **partitioned table** (the *parent*) that stores no rows itself, and then create **partitions** (the *children*), each of which holds the rows whose **partition key** falls in a range or list you define. You write \`INSERT\` and \`SELECT\` against the parent. PostgreSQL routes each inserted row to the right partition and, for queries, reads only the partitions that can contain the answer.

Three ways to divide:

| Kind | Rule | Good for |
|---|---|---|
| **RANGE** | \`FROM ... TO ...\` (the end is **exclusive**) | dates: one partition per month or per year |
| **LIST** | \`FOR VALUES IN (1)\`, \`IN (2, 3)\` | a known set of values: one partition per entity or region |
| **HASH** | \`MODULUS 4, REMAINDER 0\` | spreading rows evenly when there is no natural range |

Every partition is a real table with **its own indexes, statistics and VACUUM**. That is where the gains come from: small indexes, small scans, small maintenance jobs.`,
    { sql: {
      title: 'Partition the ledger by month',
      setup: PERF_SETUP,
      starter: `-- gl_big (1,00,000 lines, 1 Apr 2025 to 31 Mar 2026) is built for you.
-- 1) The parent: it holds no rows itself. It is partitioned by RANGE on posting_date.
CREATE TABLE gl_part (line_id int, journal_id int, entity_id int, account_id int,
                      posting_date date NOT NULL, amount numeric(12,2), status text)
PARTITION BY RANGE (posting_date);

-- 2) One partition per month: FROM is inclusive, TO is exclusive, so the ranges join up without a gap or overlap.
CREATE TABLE gl_part_2025_04 PARTITION OF gl_part FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE gl_part_2025_05 PARTITION OF gl_part FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
-- ... ten more. A loop writes them (this is how you would do it for real):
DO $$
DECLARE m date := DATE '2025-06-01';
BEGIN
  WHILE m < DATE '2026-04-01' LOOP
    EXECUTE format('CREATE TABLE %I PARTITION OF gl_part FOR VALUES FROM (%L) TO (%L)',
                   'gl_part_' || to_char(m, 'YYYY_MM'), m, (m + INTERVAL '1 month')::date);
    m := (m + INTERVAL '1 month')::date;
  END LOOP;
END $$;

-- 3) Load through the parent: every row is routed to its own month.
INSERT INTO gl_part SELECT * FROM gl_big;

-- tableoid says which partition a row really lives in
SELECT tableoid::regclass::text AS partition, COUNT(*) AS lines
FROM gl_part
GROUP BY 1
ORDER BY 1;

SELECT COUNT(*) AS lines_through_the_parent FROM gl_part;
SELECT relkind AS kind, COUNT(*) AS tables
FROM pg_class
WHERE relname LIKE 'gl_part%' AND relkind IN ('p', 'r')
GROUP BY relkind
ORDER BY relkind;`,
      note: 'The 12 partitions hold 8219, 8494, 8220, 8494, 8494, 8220, 8494, 8220, 8494, 8494, 7672 and 8485 lines (April to March), 1,00,000 in all, and the parent also returns 100000. The last query shows 1 table of kind p (the partitioned parent, which stores nothing) and 12 of kind r (ordinary tables, the partitions). The row counts differ by month because the months have 28 to 31 days.',
    } },
    `## Pruning: the reason it works
**Partition pruning** means the planner leaves out the partitions that cannot match the filter. It works from the **partition key**, so the rules are the same as for an index:

- A filter **on the key column, written plainly**, prunes: \`posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01'\` reads **one** partition.
- A filter on the key **wrapped in a function** does **not** prune: \`EXTRACT(MONTH FROM posting_date) = 1\` reads **all** twelve (and would also match January of other years).
- A filter **only on another column** (\`journal_id = 4242\`) cannot prune, because journal 4242 could be in any month. It needs each partition's own index.
- A filter on **the key and another column** prunes first, then uses the index inside the surviving partition.`,
    { sketch: { w: 760, h: 276, caption: 'A query on January touches one partition. The other eleven are skipped before any page is read.', items: [
      { t: 'text', x: 380, y: 16, text: 'gl_part (logical table, stores nothing)', size: 17, bold: true },
      { t: 'box', x: 8, y: 36, w: 54, h: 50, label: 'Apr', fill: 'grey', size: 15 },
      { t: 'box', x: 66, y: 36, w: 54, h: 50, label: 'May', fill: 'grey', size: 15 },
      { t: 'box', x: 124, y: 36, w: 54, h: 50, label: 'Jun', fill: 'grey', size: 15 },
      { t: 'box', x: 182, y: 36, w: 54, h: 50, label: 'Jul', fill: 'grey', size: 15 },
      { t: 'box', x: 240, y: 36, w: 54, h: 50, label: 'Aug', fill: 'grey', size: 15 },
      { t: 'box', x: 298, y: 36, w: 54, h: 50, label: 'Sep', fill: 'grey', size: 15 },
      { t: 'box', x: 356, y: 36, w: 54, h: 50, label: 'Oct', fill: 'grey', size: 15 },
      { t: 'box', x: 414, y: 36, w: 54, h: 50, label: 'Nov', fill: 'grey', size: 15 },
      { t: 'box', x: 472, y: 36, w: 54, h: 50, label: 'Dec', fill: 'grey', size: 15 },
      { t: 'box', x: 530, y: 36, w: 54, h: 50, label: 'Jan', fill: 'green', size: 16 },
      { t: 'box', x: 588, y: 36, w: 54, h: 50, label: 'Feb', fill: 'grey', size: 15 },
      { t: 'box', x: 646, y: 36, w: 54, h: 50, label: 'Mar', fill: 'grey', size: 15 },
      { t: 'arrow', x1: 400, y1: 118, x2: 557, y2: 90 },
      { t: 'note', x: 8, y: 106, w: 392, h: 62, fill: 'yellow', size: 14, text: "WHERE posting_date >= '2026-01-01'\n  AND posting_date <  '2026-02-01'\nThe planner reads the ranges and keeps only Jan." },
      { t: 'note', x: 8, y: 184, w: 360, h: 78, fill: 'pink', size: 14, text: 'Not pruned: EXTRACT(MONTH FROM posting_date) = 1\nthe function hides the key, so all 12 are read.\nAlso not pruned: journal_id = 4242 alone.' },
      { t: 'note', x: 384, y: 184, w: 368, h: 78, fill: 'green', size: 14, text: 'Pruned set = 1 of 12 partitions: about 8,500 of\n1,00,000 lines are even considered.\nThe index inside that partition is also small.' },
    ] } },
    { sql: {
      title: 'Which partitions does each query touch?',
      setup: PERF_SETUP + '\n' + PART_SETUP + '\n' + PARTITIONS_SCANNED,
      starter: `-- gl_part (12 monthly partitions, loaded from gl_big) and a helper partitions_scanned(sql) are ready.
-- The helper asks the planner for the plan and counts the partitions it will read.
ANALYZE gl_part;

SELECT 'range on the key'        AS filter, partitions_scanned($$SELECT * FROM gl_part WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01'$$) AS partitions
UNION ALL
SELECT 'two months',                        partitions_scanned($$SELECT * FROM gl_part WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-03-01'$$)
UNION ALL
SELECT 'EXTRACT on the key',                partitions_scanned($$SELECT * FROM gl_part WHERE EXTRACT(MONTH FROM posting_date) = 1$$)
UNION ALL
SELECT 'another column only',               partitions_scanned($$SELECT * FROM gl_part WHERE journal_id = 4242$$)
UNION ALL
SELECT 'the key AND another column',        partitions_scanned($$SELECT * FROM gl_part WHERE posting_date = DATE '2026-01-15' AND journal_id = 4242$$);

-- The plan for the one-month query: a scan of ONE partition, no Append node at all
EXPLAIN (COSTS OFF)
SELECT * FROM gl_part WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01';

-- Two months: an Append node over the two partitions that survive
EXPLAIN (COSTS OFF)
SELECT COUNT(*) FROM gl_part WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-03-01';`,
      note: 'The range on the key reads 1 of 12 partitions (gl_part_2026_01), the two-month range reads 2 (January and February), the key combined with journal_id reads 1, and the EXTRACT filter and the journal_id-only filter each read all 12. The first EXPLAIN is a single "Seq Scan on gl_part_2026_01 gl_part" with the date filter. The second is an Aggregate over an Append of two Seq Scans, on gl_part_2026_01 and gl_part_2026_02. Same table, same data: only the way the filter is written decides how much is read.',
    } },
    `## What you pay for partitioning
Partitioning is not free, and many tables should **not** be partitioned.

- **Rules for keys.** A \`PRIMARY KEY\` or \`UNIQUE\` constraint on a partitioned table must **include the partition key**, because PostgreSQL enforces uniqueness inside each partition only. So \`line_id\` alone cannot be the primary key of \`gl_part\`; \`(line_id, posting_date)\` can. Foreign keys to and from partitioned tables have extra rules too: check the manual for your version before you design around them.
- **Every row must have a partition.** Without a matching partition the \`INSERT\` fails. A **DEFAULT partition** catches rows that match no other partition, which is good as a safety net (and a place where you will find the data errors).
- **Planning cost.** The planner looks at every partition. Hundreds of partitions slow planning, and thousands are a design smell.
- **Someone must create the future partitions.** Next month's partition has to exist before the first row for that month arrives. Scheduled jobs usually create them a few periods ahead.
- **Queries that do not filter on the key** get no benefit: they scan all partitions.

**When to partition:** a table with **hundreds of millions of rows** (or one that will have them), a **time axis** that queries and retention both use, and a need to **drop old data fast**. A table of 1,00,000 rows does not need it. Use the playground table to learn the mechanics, not as a size to copy.`,
    { sketch: { w: 760, h: 262, caption: 'A partition lifecycle: create ahead, load, query, then retire the oldest partition with DETACH. No DELETE of crores of rows.', items: [
      { t: 'line', x1: 20, y1: 128, x2: 740, y2: 128 },
      { t: 'box', x: 20, y: 40, w: 160, h: 62, label: 'Old partitions', sub: 'beyond retention', fill: 'pink', size: 16 },
      { t: 'box', x: 196, y: 40, w: 330, h: 62, label: 'Live partitions', sub: 'queried by reports, indexed', fill: 'green', size: 16 },
      { t: 'box', x: 542, y: 40, w: 198, h: 62, label: 'Next months', sub: 'created ahead of time', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 100, y1: 104, x2: 100, y2: 150 },
      { t: 'note', x: 20, y: 152, w: 160, h: 90, fill: 'pink', size: 13, text: 'DETACH PARTITION,\nthen archive it to\ncheap storage or\nDROP TABLE (instant)' },
      { t: 'arrow', x1: 640, y1: 104, x2: 640, y2: 150 },
      { t: 'note', x: 542, y: 152, w: 198, h: 90, fill: 'blue', size: 13, text: 'a scheduled job runs\nCREATE TABLE ... PARTITION OF\n... FOR VALUES ... ahead of\nthe first row' },
      { t: 'note', x: 196, y: 152, w: 330, h: 90, fill: 'grey', size: 13, text: 'every partition has its own indexes, statistics\nand VACUUM.\nA DEFAULT partition catches rows that fit nowhere:\nany row in it is a data error to look at.' },
    ] } },
    { sql: {
      title: 'No partition, a DEFAULT partition, the key rule, and retiring a month',
      setup: PERF_SETUP + '\n' + PART_SETUP + `
CREATE TABLE attempt_log (n serial, what text, message text);`,
      starter: `-- 1) A row for a date that no partition covers (FY 2026-27 has not been created yet)
DO $$
BEGIN
  INSERT INTO gl_part VALUES (900001, 450001, 1, 1000, DATE '2026-04-15', 1500.00, 'Posted');
EXCEPTION WHEN OTHERS THEN
  INSERT INTO attempt_log (what, message) VALUES ('insert into April 2026', SQLERRM);
END $$;

-- 2) A DEFAULT partition catches it
CREATE TABLE gl_part_default PARTITION OF gl_part DEFAULT;
INSERT INTO gl_part VALUES (900001, 450001, 1, 1000, DATE '2026-04-15', 1500.00, 'Posted');
SELECT tableoid::regclass::text AS partition, COUNT(*) AS lines FROM gl_part WHERE posting_date >= DATE '2026-04-01' GROUP BY 1;

-- 3) A primary key must include the partition key
DO $$
BEGIN
  ALTER TABLE gl_part ADD PRIMARY KEY (line_id);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO attempt_log (what, message) VALUES ('primary key (line_id)', SQLERRM);
END $$;
ALTER TABLE gl_part ADD PRIMARY KEY (line_id, posting_date);
SELECT what, message FROM attempt_log ORDER BY n;

-- 4) An index on the parent becomes one index per partition
CREATE INDEX gl_part_journal_idx ON gl_part (journal_id);
SELECT COUNT(*) FILTER (WHERE isleaf) AS partition_indexes, COUNT(*) FILTER (WHERE NOT isleaf) AS parent_index
FROM pg_partition_tree('gl_part_journal_idx');

-- 5) Retention: retire the oldest month. DETACH is a catalog change, not a DELETE.
SELECT (SELECT COUNT(*) FROM gl_part) AS before_detach;
ALTER TABLE gl_part DETACH PARTITION gl_part_2025_04;
SELECT (SELECT COUNT(*) FROM gl_part) AS in_parent_now, (SELECT COUNT(*) FROM gl_part_2025_04) AS in_detached_table;`,
      note: 'Step 1 logs: no partition of relation "gl_part" found for row. In step 2 the default partition accepts it: 1 line in gl_part_default. Step 3 logs: unique constraint on partitioned table must include all partitioning columns, and the key (line_id, posting_date) is accepted. The index on journal_id exists once per partition: 13 partition indexes (12 months and the default partition) under 1 parent index. Before the detach the parent has 100001 lines. After DETACH PARTITION gl_part_2025_04 the parent has 91782 lines (100001 - 8219) and the detached month, 8219 lines, is an ordinary table you can archive or drop, without any DELETE and without dead rows to vacuum.',
    } },
    { local: `**On a real server, retiring a partition safely** (psql):
\`\`\`sql
ALTER TABLE gl_part DETACH PARTITION gl_part_2025_04 CONCURRENTLY;   -- does not block queries on the other partitions
\\copy (SELECT * FROM gl_part_2025_04) TO 'C:/sql-practice/gl_2025_04.csv' WITH (FORMAT csv, HEADER true)
DROP TABLE gl_part_2025_04;                                         -- only after you have checked the archive
\`\`\`
**What to expect:** \`DETACH PARTITION ... CONCURRENTLY\` cannot run inside a transaction block, and the partitioned table keeps answering queries while it runs. \`DROP TABLE\` returns at once, however many rows the partition held, because it removes the file. For the next month, a scheduled job (pg_cron, Airflow, an Azure Function) runs the \`CREATE TABLE ... PARTITION OF\` statement before the first row arrives. **Back up before you drop.** A dropped partition is not in the parent any more, and without a backup it is gone.` },
    `## Maintenance: why PostgreSQL needs cleaning
You met the cause in the operations lesson: an \`UPDATE\` or \`DELETE\` does not remove a row, it marks the old version **dead**. Dead versions take space and make scans and indexes bigger and slower. Four jobs keep a table healthy, and **autovacuum** does all four for you in the background:

1. **VACUUM** makes the space of dead rows reusable and keeps the *visibility map* current (needed by Index Only Scans, last lessons).
2. **ANALYZE** refreshes the planner's statistics.
3. **Freezing** old row versions so the 32-bit transaction counter never wraps around. If a database goes too long without it, PostgreSQL protects itself by refusing writes. This is why you **never switch autovacuum off**.
4. It runs **per table**, when enough rows have changed.

"Enough" is a formula, and you can calculate it:

\`\`\`text
VACUUM when dead rows  >  autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor x live rows
                          (defaults: 50 and 0.2)         (PostgreSQL 18 also caps this at autovacuum_vacuum_max_threshold)
ANALYZE when changed rows  >  autovacuum_analyze_threshold + autovacuum_analyze_scale_factor x live rows
                          (defaults: 50 and 0.1)
\`\`\`

For \`gl_big\`: 50 + 0.2 x 1,00,000 = **20,050 dead rows** before it is vacuumed. For a table of **100 crore** rows the plain formula would wait for 20 crore dead rows, which is far too late, and that is exactly why the cap and the **per-table settings** exist: \`ALTER TABLE big SET (autovacuum_vacuum_scale_factor = 0.01)\` makes it start at 1%.`,
    { sketch: { w: 760, h: 282, caption: 'Autovacuum starts when dead rows pass threshold + scale factor x live rows. The percentage that suits a small table is far too late for a huge one.', items: [
      { t: 'table', x: 14, y: 40, title: 'when does autovacuum start VACUUM? (defaults)', cols: ['table', 'live rows', 'dead rows needed'], colW: [240, 190, 250], rows: [['payroll (40 rows)', '40', '58 (50 + 8)'], ['gl_big', '1,00,000', '20,050'], ['fact_gl in production', '20,00,00,000', '4,00,00,050'], ['events log, 1 arab rows', '1,00,00,00,000', 'capped at 10,00,00,000'], ['same log, scale factor 0.01', '1,00,00,00,000', '1,00,00,050']], rowH: 28, hl: [3] },
      { t: 'note', x: 14, y: 216, w: 732, h: 54, fill: 'yellow', size: 14, text: 'Lower the scale factor only for the big, busy tables:\nALTER TABLE ... SET (autovacuum_vacuum_scale_factor = 0.01). Leave the server default alone.' },
    ] } },
    { sql: {
      title: 'Autovacuum arithmetic, per-table settings and the partitioned parent',
      setup: PERF_SETUP + '\n' + PART_SETUP,
      starter: `-- 1) The server's autovacuum settings
SELECT name, setting
FROM pg_settings
WHERE name IN ('autovacuum', 'autovacuum_vacuum_threshold', 'autovacuum_vacuum_scale_factor', 'autovacuum_vacuum_max_threshold',
               'autovacuum_analyze_threshold', 'autovacuum_analyze_scale_factor')
ORDER BY name;

-- 2) The default trigger points for gl_big (1,00,000 rows)
SELECT 100000 AS live_rows,
       current_setting('autovacuum_vacuum_threshold')::int + current_setting('autovacuum_vacuum_scale_factor')::numeric * 100000  AS dead_rows_before_vacuum,
       current_setting('autovacuum_analyze_threshold')::int + current_setting('autovacuum_analyze_scale_factor')::numeric * 100000 AS changed_rows_before_analyze;

-- 3) Tune one table: vacuum when 1 percent of it is dead. The setting is stored with the table.
ALTER TABLE gl_big SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.02);
SELECT relname, reloptions FROM pg_class WHERE relname = 'gl_big';
SELECT 50 + 0.01 * 100000 AS dead_rows_before_vacuum_now;

-- 4) The partitioned parent has no data of its own, and its statistics come only from an explicit ANALYZE
SELECT relname, relkind, reltuples::bigint AS estimated_rows FROM pg_class WHERE relname IN ('gl_part', 'gl_part_2026_01') ORDER BY relname;
ANALYZE gl_part;
SELECT relname, relkind, reltuples::bigint AS estimated_rows FROM pg_class WHERE relname IN ('gl_part', 'gl_part_2026_01') ORDER BY relname;`,
      note: 'Step 1: autovacuum is on, vacuum threshold 50 and scale factor 0.2, analyze threshold 50 and scale factor 0.1, and a vacuum max threshold of 100000000. Step 2: 1,00,000 rows give 20050 dead rows before a VACUUM and 10050 changed rows before an ANALYZE. Step 3: after the ALTER TABLE, reloptions shows autovacuum_vacuum_scale_factor=0.01 and autovacuum_analyze_scale_factor=0.02, and the new vacuum trigger is 1050 dead rows (50 + 0.01 x 100000). Step 4: before ANALYZE the partitioned parent has no row estimate at all (relkind p, estimated_rows -1) and the January partition has none either; after ANALYZE gl_part the parent shows 100000 and the partitions are analysed too. On a real server autovacuum analyses each partition by itself but does NOT analyse the partitioned parent, so run ANALYZE on the parent after a big load.',
    } },
    { warn: '**Bloat is silent.** A table or an index that has grown far bigger than its live data makes every scan slower and fills the disk, and nothing in the application shows an error. Typical causes: autovacuum cannot keep up with a big update job, or a **long-running transaction** (or an *idle in transaction* session, see the operations lesson) holds an old snapshot, so VACUUM is not allowed to remove anything newer. Look at the size of a table against its live rows, and at `n_dead_tup` in `pg_stat_user_tables` on a real server. `VACUUM FULL` rewrites the table to give space back to the operating system, but it **locks the table exclusively** for the whole run, so on a busy system use a tool that rebuilds online (`pg_repack`) or rebuild the **indexes** with `REINDEX INDEX CONCURRENTLY`.' },
    { local: `**Watch maintenance on a real server** (psql, your own \`fde_practice\` database; these counters stay at 0 in the in-browser database):
\`\`\`sql
SELECT relname, n_live_tup, n_dead_tup,
       ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;

-- Is something holding VACUUM back? The oldest open transactions:
SELECT pid, usename, state, now() - xact_start AS open_for, left(query, 50) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start
LIMIT 5;
\`\`\`
**What to expect:** one row per table with the number of live and dead rows, the percentage of dead rows, and when autovacuum last ran. A healthy table has a small \`dead_pct\` (a few percent) and a recent \`last_autovacuum\`. A table with a high \`dead_pct\` and an old \`last_autovacuum\` is falling behind: look at the second query for a transaction that has been open for hours. For exact bloat numbers the \`pgstattuple\` extension reports free space inside a table or index (\`CREATE EXTENSION pgstattuple;\`, where your server has it).` },
    `## Practice
Three calculations a data engineer does when designing and running big tables: generate the partition boundaries, work out which partitions a query touches, and decide which tables autovacuum is behind on.`,
    { challenge: {
      id: 'sql-partitioning-maintenance-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Generate the partition boundaries for FY 2025-26 (April 2025 to March 2026). Return `partition_name` (for example `gl_part_2025_04`), `from_date` (the first day of the month) and `to_date_exclusive` (the first day of the next month), one row per month, sorted by `from_date`. Use `generate_series` and `TO_CHAR`. (12 rows.)',
      starter: `SELECT m::date AS from_date
FROM generate_series(DATE '2025-04-01', DATE '2026-03-01', INTERVAL '1 month') AS m
ORDER BY from_date`,
      hint: "to_date_exclusive is (m + INTERVAL '1 month')::date. The name is 'gl_part_' || TO_CHAR(m, 'YYYY_MM').",
      solution: `SELECT 'gl_part_' || TO_CHAR(m, 'YYYY_MM') AS partition_name,
       m::date AS from_date,
       (m + INTERVAL '1 month')::date AS to_date_exclusive
FROM generate_series(DATE '2025-04-01', DATE '2026-03-01', INTERVAL '1 month') AS m
ORDER BY from_date`,
    } },
    { challenge: {
      id: 'sql-partitioning-maintenance-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Pruning by hand. The starter has the quarterly partitions of FY 2025-26 and four report date ranges. A partition is scanned when its range overlaps the report range: `part_from < range_end` AND `part_to > range_start` (all ends are exclusive). Return `report`, `partitions_scanned` (how many) and `partitions` (their names joined with `, ` in order of `part_from`), sorted by `report`. (4 rows.)',
      starter: `WITH parts(part_name, part_from, part_to) AS (
  VALUES ('gl_q1', DATE '2025-04-01', DATE '2025-07-01'),
         ('gl_q2', DATE '2025-07-01', DATE '2025-10-01'),
         ('gl_q3', DATE '2025-10-01', DATE '2026-01-01'),
         ('gl_q4', DATE '2026-01-01', DATE '2026-04-01')
),
reports(report, range_start, range_end) AS (
  VALUES ('January only',    DATE '2026-01-01', DATE '2026-02-01'),
         ('H1 (Apr-Sep)',    DATE '2025-04-01', DATE '2025-10-01'),
         ('Sep 15 to Oct 15', DATE '2025-09-15', DATE '2025-10-16'),
         ('Whole year',      DATE '2025-04-01', DATE '2026-04-01')
)
SELECT r.report
FROM reports r
ORDER BY r.report`,
      hint: "Join reports to parts with p.part_from < r.range_end AND p.part_to > r.range_start, then GROUP BY report and use COUNT(*) and string_agg(p.part_name, ', ' ORDER BY p.part_from).",
      solution: `WITH parts(part_name, part_from, part_to) AS (
  VALUES ('gl_q1', DATE '2025-04-01', DATE '2025-07-01'),
         ('gl_q2', DATE '2025-07-01', DATE '2025-10-01'),
         ('gl_q3', DATE '2025-10-01', DATE '2026-01-01'),
         ('gl_q4', DATE '2026-01-01', DATE '2026-04-01')
),
reports(report, range_start, range_end) AS (
  VALUES ('January only',    DATE '2026-01-01', DATE '2026-02-01'),
         ('H1 (Apr-Sep)',    DATE '2025-04-01', DATE '2025-10-01'),
         ('Sep 15 to Oct 15', DATE '2025-09-15', DATE '2025-10-16'),
         ('Whole year',      DATE '2025-04-01', DATE '2026-04-01')
)
SELECT r.report,
       COUNT(*) AS partitions_scanned,
       string_agg(p.part_name, ', ' ORDER BY p.part_from) AS partitions
FROM reports r
JOIN parts p ON p.part_from < r.range_end AND p.part_to > r.range_start
GROUP BY r.report
ORDER BY r.report`,
    } },
    { challenge: {
      id: 'sql-partitioning-maintenance-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Which tables is autovacuum behind on? A table is **due** for VACUUM when `dead_rows` is greater than its threshold. The threshold is `LEAST(vacuum_max_threshold, vacuum_threshold + scale_factor * live_rows)`, where the first two come from the server settings `autovacuum_vacuum_max_threshold` and `autovacuum_vacuum_threshold` (use `current_setting`), and `scale_factor` is the table\'s own `scale_override` if it is not NULL, otherwise the server setting `autovacuum_vacuum_scale_factor`. Return `table_name`, `vacuum_threshold` (rounded to a whole number), `dead_rows` and `vacuum_due` (true or false), sorted by `table_name`. (6 rows. Careful: one table is due only because of the cap.)',
      starter: `WITH tables(table_name, live_rows, dead_rows, scale_override) AS (
  VALUES ('events_log',       1000000000::bigint,  90000000::bigint, NULL::numeric),
         ('events_log_2',     1000000000::bigint, 120000000::bigint, NULL),
         ('fact_gl_prod',      200000000::bigint,  30000000::bigint, NULL),
         ('gl_big',               100000::bigint,     25000::bigint, NULL),
         ('journal_lines',       5000000::bigint,     20000::bigint, 0.001),
         ('payroll',                  40::bigint,        30::bigint, NULL)
)
SELECT table_name, live_rows, dead_rows
FROM tables
ORDER BY table_name`,
      hint: "Compute the threshold in a CTE: LEAST(current_setting('autovacuum_vacuum_max_threshold')::numeric, current_setting('autovacuum_vacuum_threshold')::numeric + COALESCE(scale_override, current_setting('autovacuum_vacuum_scale_factor')::numeric) * live_rows). Then vacuum_due = dead_rows > threshold.",
      solution: `WITH tables(table_name, live_rows, dead_rows, scale_override) AS (
  VALUES ('events_log',       1000000000::bigint,  90000000::bigint, NULL::numeric),
         ('events_log_2',     1000000000::bigint, 120000000::bigint, NULL),
         ('fact_gl_prod',      200000000::bigint,  30000000::bigint, NULL),
         ('gl_big',               100000::bigint,     25000::bigint, NULL),
         ('journal_lines',       5000000::bigint,     20000::bigint, 0.001),
         ('payroll',                  40::bigint,        30::bigint, NULL)
),
calc AS (
  SELECT table_name, dead_rows,
         LEAST(current_setting('autovacuum_vacuum_max_threshold')::numeric,
               current_setting('autovacuum_vacuum_threshold')::numeric
               + COALESCE(scale_override, current_setting('autovacuum_vacuum_scale_factor')::numeric) * live_rows) AS threshold
  FROM tables
)
SELECT table_name, ROUND(threshold) AS vacuum_threshold, dead_rows, dead_rows > threshold AS vacuum_due
FROM calc
ORDER BY table_name`,
    } },
    { real: 'Ask these questions before anyone proposes partitioning: **How big is the table, and how fast does it grow? Do the queries filter on one column (usually a date)? Is there a retention rule that needs fast deletes?** If the table is a few crore rows and the slow query lacks an index, add the index first: it is far cheaper than partitioning and you can undo it. Partition when the answers are "hundreds of millions of rows, always a date filter, and old data must go". Then agree **who creates next month\'s partition** (a scheduled job, with an alert if it fails) and what happens to rows in the DEFAULT partition. The most common failure is not the design: it is the January partition that nobody created on 31 December.' },
    { interview: '"How would you handle a ledger table that grows by crores of rows a year, with a seven-year retention rule?" Model answer: "I would partition it by RANGE on the posting date, one partition per month, because the reports filter by period and retention works by period. Queries that filter on the date prune to a few partitions, indexes stay small, and each partition is vacuumed on its own. Retention becomes DETACH PARTITION and then archive or DROP, instead of a huge DELETE that bloats the table. I would add a DEFAULT partition as a safety net, create future partitions ahead of time with a scheduled job and an alert, and make sure keys include the partition column, because primary keys on a partitioned table must. I would lower autovacuum scale factors on the largest partitions, run ANALYZE on the parent after big loads, and check that queries really prune with EXPLAIN. I would not partition a table that is only a few crore rows without a clear retention or pruning benefit." Follow-up: "Why does a filter like EXTRACT(MONTH FROM posting_date) = 1 not prune?" (the planner can only compare the key column against constants, not a function of it).' },
    `## Recap
- **Partitioning** splits one logical table into physical partitions by a key: **RANGE** (dates), **LIST** (entity, region), **HASH** (even spread). Each partition has its own indexes, statistics and VACUUM.
- **Pruning** reads only partitions that can match, but only for a filter on the **key itself** (no function). Check with \`EXPLAIN\`: one \`Seq Scan on gl_part_2026_01\`, or an \`Append\` of a few, instead of all twelve.
- The costs: keys of \`PRIMARY KEY\`/\`UNIQUE\` must include the partition key, every row needs a partition (use a **DEFAULT** partition as a net), planning slows with very many partitions, and someone must create future partitions.
- **Retention**: \`DETACH PARTITION\` (\`CONCURRENTLY\` on a live system), archive, \`DROP TABLE\`. It is instant, unlike \`DELETE\` of crores of rows. Back up before you drop.
- **Autovacuum** vacuums when dead rows exceed 50 + 0.2 x live rows (capped in PostgreSQL 18) and analyses at 50 + 0.1 x live rows. Tune big tables with \`ALTER TABLE ... SET (autovacuum_vacuum_scale_factor = 0.01)\`. Never disable it: it also prevents transaction-ID wraparound.
- Autovacuum does not analyse the **partitioned parent**: run \`ANALYZE\` on it after a big load.
- **Bloat** is silent: watch dead rows in \`pg_stat_user_tables\`, long-open transactions, and rebuild online with \`REINDEX CONCURRENTLY\` or \`pg_repack\`, not \`VACUUM FULL\` on a busy table.`,
  ],
  quiz: [
    { q: 'A table `gl_part` is partitioned by month on `posting_date`. Which filter lets PostgreSQL read only the January partition?', o: ["`WHERE posting_date >= DATE '2026-01-01' AND posting_date < DATE '2026-02-01'`", '`WHERE EXTRACT(MONTH FROM posting_date) = 1`', '`WHERE journal_id = 4242`', "`WHERE TO_CHAR(posting_date, 'MM') = '01'`"], a: 0, why: 'Pruning compares the partition key itself with constants. A function of the key, or a filter on another column, gives the planner nothing to compare with the partition bounds, so all partitions are read.' },
    { q: 'You try `ALTER TABLE gl_part ADD PRIMARY KEY (line_id)` on a table partitioned by `posting_date`. What happens?', o: ['It works and gives a global unique index', 'It works but is slow', 'It is rejected, because a unique constraint on a partitioned table must include the partition key', 'It silently drops the partitions'], a: 2, why: 'Uniqueness is enforced inside each partition, so the key must contain the partition column. (line_id, posting_date) is accepted.' },
    { q: 'The retention policy says to remove the oldest year of a three-crore-row yearly ledger. What is the best approach with monthly partitions?', o: ['DELETE the rows with a WHERE on the date, then VACUUM FULL', 'TRUNCATE the whole parent table', 'Run UPDATE to mark the rows as deleted', 'DETACH the old partitions, archive them if needed, then DROP the detached tables'], a: 3, why: 'Detaching and dropping a partition is a catalog and file operation: it takes no time per row and leaves no dead rows. A DELETE of crores of rows is slow and bloats the table.' },
    { q: 'Which statement about autovacuum is correct?', o: ['It can safely be switched off on a table that is only inserted into', 'It runs per table, vacuuming when dead rows pass a threshold plus a fraction of the table size, and it also protects against transaction-ID wraparound', 'It always rewrites the table to return space to the operating system', 'It locks the table exclusively while it runs'], a: 1, why: 'Autovacuum is a background process that applies a formula per table. It makes dead space reusable, keeps statistics fresh and freezes old row versions. VACUUM FULL, not autovacuum, rewrites the table and takes an exclusive lock.' },
    { q: 'A table has 10 crore live rows and the default scale factor 0.2. Why might you set `autovacuum_vacuum_scale_factor = 0.01` for it?', o: ['The default would wait for about 2 crore dead rows before the first vacuum, which is far too late', 'The default is 0.2 percent, which is too small', 'It makes VACUUM FULL unnecessary', 'It makes queries use indexes'], a: 0, why: 'A fraction of the table size is a huge number of rows when the table is huge. A lower scale factor on the big, busy tables starts vacuum earlier, so bloat does not build up.' },
    { q: 'After loading a large batch into a partitioned table, what should an ETL job do to help the planner?', o: ['Run VACUUM FULL on the parent', 'Run ANALYZE on the partitioned parent (autovacuum analyses the partitions but not the parent)', 'Nothing, autovacuum always handles it at once', 'Drop all indexes'], a: 1, why: 'Autovacuum keeps each partition\'s statistics, but a partitioned parent has statistics only after an explicit ANALYZE. Fresh statistics on the parent matter for queries that span partitions.' },
  ],
  task: {
    title: 'Partition a ledger, retire a month, and tune autovacuum',
    steps: [
      'Create `31_partitioning.sql` in `C:\\sql-practice`. Build `gl_big`, then the partitioned `gl_part` with 12 monthly partitions and load it (use the `DO` loop from the lesson). Show the row count per partition with `tableoid::regclass`.',
      'Write the `partitions_scanned` helper and run it for five filters: range on the key, two months, `EXTRACT` on the key, `journal_id` only, and the key plus `journal_id`. Put the five results in a comment and write one sentence on why two of them read all twelve.',
      'Try to insert a row dated 15 April 2026. Write down the error. Add a DEFAULT partition and insert it again. Then try `PRIMARY KEY (line_id)` and `PRIMARY KEY (line_id, posting_date)` and record both outcomes.',
      'Create an index on `journal_id` on the parent and count the indexes in `pg_partition_tree`. Then `DETACH PARTITION gl_part_2025_04` (use `CONCURRENTLY` on your laptop server), export it with `\\copy`, and `DROP` it. Check the parent row count before and after.',
      'Calculate by hand the number of dead rows after which autovacuum vacuums `gl_big` with the defaults and after `ALTER TABLE gl_big SET (autovacuum_vacuum_scale_factor = 0.01)`. Confirm the setting in `pg_class.reloptions`.',
      'On your laptop server run the `pg_stat_user_tables` query from the callout. Pick the table with the most dead rows and write down its `dead_pct` and `last_autovacuum`. Then run `UPDATE gl_big SET amount = amount + 1;` twice, check `pg_relation_size`, run `VACUUM (VERBOSE) gl_big;` and describe what changed.',
    ],
    deliverable: '`31_partitioning.sql` with the commands you ran and, in comments, the per-partition counts, the five pruning results, the two error messages, the index count, the parent counts before and after the detach, the two autovacuum thresholds, and the `dead_pct` and size observations.',
  },
};
