// The vendor master and the nightly feed are defined once; the playground setup and the challenge CTEs are generated from them.
const MASTER = [
  ['29AAHCN9902L1ZX', 'Nandi Electricals', 'Bengaluru', true, '2026-09-01'],
  ['37AABCG4471E1Z1', 'Godavari Chemicals', 'Visakhapatnam', true, '2026-09-01'],
  ['37AAFCV7781M1ZQ', 'Vizag Steel Supplies', 'Visakhapatnam', true, '2026-09-01'],
  ['36AABCS1429B1Z5', 'Sri Lakshmi Traders', 'Hyderabad', true, '2026-09-01'],
  ['27AAACM1111M1Z9', 'Mumbai Metals', 'Mumbai', false, '2026-08-01'],
];
const FEED = [
  [1, '29AAHCN9902L1ZX', 'Nandi Electricals', 'Bengaluru'],
  [2, '37AABCG4471E1Z1', 'Godavari Chemicals Pvt Ltd', 'Visakhapatnam'],
  [3, '37AAFCV7781M1ZQ', 'Vizag Steel Supplies', 'Visakhapatnam'],
  [4, '36AADCD5521K1Z2', 'Deccan Packaging', 'Hyderabad'],
  [5, '36AAGFK3310P1Z8', 'Krishna Logistics', 'Hyderabad'],
  [6, '36AADCD5521K1Z2', 'Deccan Packaging', 'Hyderabad'],
];
const q = (s) => `'${s}'`;
const MASTER_VALUES = MASTER.map(([g, n, c, a, d]) => `(${q(g)}, ${q(n)}, ${q(c)}, ${a}, DATE ${q(d)})`).join(',\n  ');
const FEED_VALUES = FEED.map(([s, g, n, c]) => `(${s}, ${q(g)}, ${q(n)}, ${q(c)})`).join(',\n  ');
const SETUP = `CREATE TABLE vendor_master (gstin text PRIMARY KEY, supplier_name text NOT NULL, city text, active boolean NOT NULL DEFAULT true, last_loaded date);
INSERT INTO vendor_master VALUES
  ${MASTER_VALUES};
CREATE TABLE vendor_feed (seq int, gstin text, supplier_name text, city text);
INSERT INTO vendor_feed VALUES
  ${FEED_VALUES};`;
const CTES = `WITH vendor_master(gstin, supplier_name, city, active, last_loaded) AS (
  VALUES
  ${MASTER_VALUES}
),
vendor_feed(seq, gstin, supplier_name, city) AS (
  VALUES
  ${FEED_VALUES}
)`;

export default {
  id: 'sql-upsert-merge',
  title: 'Upsert and MERGE: loads you can safely run twice',
  goal: 'You can load changing data with INSERT ... ON CONFLICT and MERGE so that each row is inserted, updated or left alone, and running the same load twice leaves exactly the same result.',
  roadmap: [
    'ON CONFLICT DO UPDATE and DO NOTHING',
    'MERGE',
    'Idempotent loads',
  ],
  blocks: [
    `## The problem
Every night the ERP sends a **vendor master feed**: the list of all suppliers and their details. Your database already holds yesterday's version. Tonight's file contains four kinds of rows:

- vendors that are **unchanged**,
- vendors whose **name or city changed**,
- **new** vendors,
- and, because the feed is a full list, some vendors from your table are **missing from the file** (the supplier was closed, or the ERP dropped it).

A plain \`INSERT\` is no use. It stops with *duplicate key value violates unique constraint* on the first vendor that already exists, and your 2 a.m. job fails. "Delete everything and reload" works on paper, but it breaks every table that points to the vendor, loses history, and leaves the table empty if the job dies halfway.

There is one more requirement, and it is the most important one. Jobs get **retried**: a timeout, a restart, an operator who runs the script again "just to be sure". If running the load twice gives a different result from running it once (duplicates, double updates), your data cannot be trusted. A load that leaves the **same final state, however many times you run it,** is called **idempotent**, the same idea as the idempotency key in the HTTP lessons. SQL gives you two commands that make it natural: **upsert** (\`INSERT … ON CONFLICT\`) and \`MERGE\`.`,
    `## The practice data
The playgrounds below hold two small tables.

**\`vendor_master\`** (what you have): five vendors with a \`last_loaded\` date. Four are active (Nandi, Godavari, Vizag and Sri Lakshmi), and \`Mumbai Metals\` was already deactivated in August.

**\`vendor_feed\`** (tonight's file, with a running number \`seq\`): six rows.

| seq | gstin | supplier_name | what it means |
|---|---|---|---|
| 1 | 29AAHCN9902L1ZX | Nandi Electricals | unchanged |
| 2 | 37AABCG4471E1Z1 | Godavari Chemicals Pvt Ltd | **changed**: the name now ends in "Pvt Ltd" |
| 3 | 37AAFCV7781M1ZQ | Vizag Steel Supplies | unchanged |
| 4 | 36AADCD5521K1Z2 | Deccan Packaging | **new** |
| 5 | 36AAGFK3310P1Z8 | Krishna Logistics | **new** |
| 6 | 36AADCD5521K1Z2 | Deccan Packaging | the **same row as 4**, sent twice |

Sri Lakshmi Traders (36AABCS1429B1Z5) is in the master but **not in the feed**. Following the routine from the last lesson, **preview before you change**: classify every feed row by comparing it with the master.`,
    { sketch: { w: 760, h: 300, caption: 'The decision for every feed row. A MERGE adds a branch for master rows that are missing from the feed.', items: [
      { t: 'box', x: 14, y: 22, w: 150, h: 50, label: 'feed row', sub: 'one vendor', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 166, y1: 47, x2: 246, y2: 47 },
      { t: 'box', x: 248, y: 16, w: 210, h: 62, label: 'key in the master?', sub: 'the GSTIN', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 460, y1: 47, x2: 524, y2: 47, label: 'yes', lx: 0, ly: -12 },
      { t: 'box', x: 526, y: 16, w: 220, h: 62, label: 'any column different?', sub: 'name or city', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 330, y1: 80, x2: 150, y2: 136, label: 'no', lx: -10, ly: -4 },
      { t: 'box', x: 70, y: 138, w: 160, h: 54, label: 'INSERT', sub: 'new vendor', fill: 'green', size: 18 },
      { t: 'arrow', x1: 590, y1: 80, x2: 560, y2: 136, label: 'yes', lx: -14, ly: -2 },
      { t: 'box', x: 480, y: 138, w: 160, h: 54, label: 'UPDATE', sub: 'changed vendor', fill: 'orange', size: 18 },
      { t: 'arrow', x1: 700, y1: 80, x2: 712, y2: 136, label: 'no', lx: 12, ly: -2 },
      { t: 'box', x: 664, y: 138, w: 84, h: 54, label: 'skip', sub: 'unchanged', fill: 'grey', size: 17 },
      { t: 'line', x1: 20, y1: 214, x2: 740, y2: 214, dashed: true },
      { t: 'box', x: 248, y: 232, w: 250, h: 52, label: 'in the master, not in the feed?', fill: 'yellow', size: 15 },
      { t: 'arrow', x1: 500, y1: 258, x2: 556, y2: 258, label: 'MERGE', lx: 0, ly: -12 },
      { t: 'box', x: 558, y: 232, w: 190, h: 52, label: 'active = false', sub: 'soft delete', fill: 'pink', size: 17 },
    ] } },
    { sql: {
      title: 'Preview: what would tonight\'s load do?',
      setup: SETUP,
      starter: `-- The feed contains the same row twice; DISTINCT gives one row per vendor.
-- Classify each feed row against the master.
SELECT f.gstin,
       f.supplier_name,
       CASE WHEN m.gstin IS NULL                                                THEN 'new'
            WHEN (m.supplier_name, m.city) IS DISTINCT FROM (f.supplier_name, f.city) THEN 'changed'
            ELSE 'unchanged' END AS action
FROM (SELECT DISTINCT gstin, supplier_name, city FROM vendor_feed) AS f
LEFT JOIN vendor_master m ON m.gstin = f.gstin
ORDER BY f.gstin;

-- Active vendors in the master that are missing from the feed
SELECT m.gstin, m.supplier_name
FROM vendor_master m
WHERE m.active
  AND NOT EXISTS (SELECT 1 FROM vendor_feed f WHERE f.gstin = m.gstin);`,
      note: 'Two rows are unchanged (Nandi and Vizag), one is changed (Godavari), and two are new (Deccan and Krishna). One active vendor, Sri Lakshmi Traders, is missing from the feed. Mumbai Metals is also absent from the feed, but it is already inactive, so it is not listed. The comparison uses IS DISTINCT FROM so that a NULL city cannot make a changed row look unchanged.',
    } },
    `## INSERT … ON CONFLICT: the upsert
\`\`\`sql
INSERT INTO vendor_master (gstin, supplier_name, city, last_loaded)
SELECT DISTINCT gstin, supplier_name, city, DATE '2026-09-02' FROM vendor_feed
ON CONFLICT (gstin) DO UPDATE
   SET supplier_name = EXCLUDED.supplier_name,
       city          = EXCLUDED.city,
       last_loaded   = EXCLUDED.last_loaded
 WHERE (vendor_master.supplier_name, vendor_master.city)
       IS DISTINCT FROM (EXCLUDED.supplier_name, EXCLUDED.city)
RETURNING gstin, supplier_name;
\`\`\`
Read it as: *try to insert each row. If a row with the same \`gstin\` already exists (the **conflict target**, which must be a primary key or a unique index), do not fail, update that row instead.*

- **\`EXCLUDED\`** is a pseudo-table that holds **the row you tried to insert**. \`vendor_master.city\` is the existing value and \`EXCLUDED.city\` is the new one.
- **\`DO NOTHING\`** is the other choice: skip rows that already exist. It is the tool for "insert if new" (a log of processed files, a list of event ids).
- The **\`WHERE\`** after \`DO UPDATE SET\` is a filter on the **update**. Without it, every existing row is rewritten, even when nothing changed. That creates dead row versions that VACUUM has to clean up, makes every row look "changed" in your audit, and breaks idempotency checks. With it, unchanged rows are skipped and **\`RETURNING\` lists only the rows that were really inserted or updated**. Never compare the \`last_loaded\` column in that test: it changes on every run, and every row would be updated every time.
- The command is **atomic and safe under concurrency**: if two loads run at the same moment, one inserts and the other updates, and neither fails with a duplicate-key error.

### The trap: duplicates inside the feed
Row 6 of the feed repeats row 4. If you insert the feed as it is, PostgreSQL stops with:

\`\`\`text
ERROR:  ON CONFLICT DO UPDATE command cannot affect row a second time
\`\`\`
Both copies of Deccan want to create or update the **same** target row in one statement, and the database refuses to guess which one should win. Fix the **source**, not the command: reduce the feed to **one row per key** before loading. \`SELECT DISTINCT\` is enough when the copies are identical. When they can differ, use the "latest row wins" recipe from the window lesson (\`ROW_NUMBER() OVER (PARTITION BY gstin ORDER BY seq DESC)\`, keep \`rn = 1\`). \`DO NOTHING\` does not raise the error, but it silently keeps whichever copy arrived first, which is rarely what you intend.`,
    { sql: {
      title: 'Upsert, then run it again',
      setup: SETUP,
      starter: `-- 1) Load the feed (deduplicated). RETURNING shows only rows that were inserted or updated.
INSERT INTO vendor_master (gstin, supplier_name, city, last_loaded)
SELECT DISTINCT gstin, supplier_name, city, DATE '2026-09-02'
FROM vendor_feed
ON CONFLICT (gstin) DO UPDATE
   SET supplier_name = EXCLUDED.supplier_name,
       city          = EXCLUDED.city,
       last_loaded   = EXCLUDED.last_loaded
 WHERE (vendor_master.supplier_name, vendor_master.city)
       IS DISTINCT FROM (EXCLUDED.supplier_name, EXCLUDED.city)
RETURNING gstin, supplier_name;

-- 2) The same load again: an idempotent load changes nothing
INSERT INTO vendor_master (gstin, supplier_name, city, last_loaded)
SELECT DISTINCT gstin, supplier_name, city, DATE '2026-09-02'
FROM vendor_feed
ON CONFLICT (gstin) DO UPDATE
   SET supplier_name = EXCLUDED.supplier_name,
       city          = EXCLUDED.city,
       last_loaded   = EXCLUDED.last_loaded
 WHERE (vendor_master.supplier_name, vendor_master.city)
       IS DISTINCT FROM (EXCLUDED.supplier_name, EXCLUDED.city)
RETURNING gstin, supplier_name;

SELECT gstin, supplier_name, city, active, last_loaded
FROM vendor_master
ORDER BY gstin;

-- Remove the dashes and drop the DISTINCT in query 1 to read the error from the lesson:
-- INSERT INTO vendor_master (gstin, supplier_name, city) SELECT gstin, supplier_name, city FROM vendor_feed
--   ON CONFLICT (gstin) DO UPDATE SET city = EXCLUDED.city;`,
      note: 'The first load returns three rows: Godavari (updated) and Deccan and Krishna (inserted). The second load returns no rows at all, which is the proof of idempotency. Nandi and Vizag keep their old last_loaded date of 2026-09-01, because they were not touched. Sri Lakshmi is still active: an upsert never removes anything. That needs MERGE.',
    } },
    `## MERGE: several actions in one statement
\`MERGE\` compares a **source** with a **target** on a join condition and chooses the action by the **situation of each row**:

\`\`\`sql
MERGE INTO vendor_master m
USING (SELECT DISTINCT gstin, supplier_name, city FROM vendor_feed) f
   ON m.gstin = f.gstin
WHEN MATCHED AND (m.supplier_name, m.city, m.active)
                 IS DISTINCT FROM (f.supplier_name, f.city, true) THEN
     UPDATE SET supplier_name = f.supplier_name, city = f.city, active = true, last_loaded = DATE '2026-09-02'
WHEN NOT MATCHED BY TARGET THEN
     INSERT (gstin, supplier_name, city, last_loaded)
     VALUES (f.gstin, f.supplier_name, f.city, DATE '2026-09-02')
WHEN NOT MATCHED BY SOURCE AND m.active THEN
     UPDATE SET active = false, last_loaded = DATE '2026-09-02'
RETURNING merge_action() AS action, COALESCE(m.gstin, f.gstin) AS gstin;
\`\`\`
- **\`WHEN MATCHED\`**: the key exists on both sides. Add an \`AND\` condition so that you only touch rows that really differ. You may \`UPDATE\`, \`DELETE\` or \`DO NOTHING\`.
- **\`WHEN NOT MATCHED BY TARGET\`** (plain \`WHEN NOT MATCHED\` means the same): the row is in the source but not in the target, so \`INSERT\`.
- **\`WHEN NOT MATCHED BY SOURCE\`**: the row is in the target but **not in the source**. This is how a full feed can deactivate (or delete) vendors that disappeared. The \`AND m.active\` guard means an already inactive vendor is not touched again, which keeps the load idempotent. (This branch needs PostgreSQL 17 or later; the course was written against 18.)
- **\`RETURNING merge_action()\`** tells you whether each row was an \`INSERT\`, an \`UPDATE\` or a \`DELETE\`.

MERGE has the same trap as the upsert: if the source has **two rows for the same target row**, it stops with *MERGE command cannot affect row a second time*. Deduplicate the source first, as above. For soft-deleted vendors that come back in a later feed, the \`MATCHED\` branch sets \`active = true\` again.`,
    { sketch: { w: 760, h: 285, caption: 'The master after MERGE. Four rows were touched, two were left alone, and Mumbai Metals (inactive since August) was ignored.', items: [
      { t: 'table', x: 14, y: 42, title: 'vendor_master after the MERGE', cols: ['vendor', 'active', 'last_loaded', 'what the MERGE did'], colW: [232, 80, 118, 300], rows: [['Nandi Electricals', 'true', '2026-09-01', 'nothing: unchanged'], ['Godavari Chemicals Pvt Ltd', 'true', '2026-09-02', 'UPDATE: name changed'], ['Vizag Steel Supplies', 'true', '2026-09-01', 'nothing: unchanged'], ['Sri Lakshmi Traders', 'false', '2026-09-02', 'UPDATE: not in the feed, deactivated'], ['Deccan Packaging', 'true', '2026-09-02', 'INSERT: new vendor'], ['Krishna Logistics', 'true', '2026-09-02', 'INSERT: new vendor'], ['Mumbai Metals', 'false', '2026-08-01', 'nothing: already inactive']], hl: [1, 3, 4, 5] },
    ] } },
    { sql: {
      title: 'MERGE with actions, and a second run',
      setup: SETUP,
      starter: `-- First run: every action is reported by merge_action()
MERGE INTO vendor_master m
USING (SELECT DISTINCT gstin, supplier_name, city FROM vendor_feed) f
   ON m.gstin = f.gstin
WHEN MATCHED AND (m.supplier_name, m.city, m.active) IS DISTINCT FROM (f.supplier_name, f.city, true) THEN
  UPDATE SET supplier_name = f.supplier_name, city = f.city, active = true, last_loaded = DATE '2026-09-02'
WHEN NOT MATCHED BY TARGET THEN
  INSERT (gstin, supplier_name, city, last_loaded)
  VALUES (f.gstin, f.supplier_name, f.city, DATE '2026-09-02')
WHEN NOT MATCHED BY SOURCE AND m.active THEN
  UPDATE SET active = false, last_loaded = DATE '2026-09-02'
RETURNING merge_action() AS action, COALESCE(m.gstin, f.gstin) AS gstin, m.supplier_name, m.active;

-- Second run: the same statement changes nothing
MERGE INTO vendor_master m
USING (SELECT DISTINCT gstin, supplier_name, city FROM vendor_feed) f
   ON m.gstin = f.gstin
WHEN MATCHED AND (m.supplier_name, m.city, m.active) IS DISTINCT FROM (f.supplier_name, f.city, true) THEN
  UPDATE SET supplier_name = f.supplier_name, city = f.city, active = true, last_loaded = DATE '2026-09-02'
WHEN NOT MATCHED BY TARGET THEN
  INSERT (gstin, supplier_name, city, last_loaded)
  VALUES (f.gstin, f.supplier_name, f.city, DATE '2026-09-02')
WHEN NOT MATCHED BY SOURCE AND m.active THEN
  UPDATE SET active = false, last_loaded = DATE '2026-09-02'
RETURNING merge_action() AS action, COALESCE(m.gstin, f.gstin) AS gstin;

SELECT gstin, supplier_name, active, last_loaded FROM vendor_master ORDER BY gstin;`,
      note: 'The first run reports four actions: an UPDATE for Godavari, two INSERTs (Deccan and Krishna), and an UPDATE that deactivates Sri Lakshmi (the second UPDATE is the NOT MATCHED BY SOURCE branch). The second run reports nothing. The final table has seven vendors, with Sri Lakshmi and Mumbai Metals inactive.',
    } },
    `## Upsert or MERGE?
| | \`INSERT … ON CONFLICT\` | \`MERGE\` |
|---|---|---|
| Needs a unique key or index | yes (the conflict target) | no, any join condition |
| Actions | insert, or update, or skip | insert, update, delete or skip, chosen per situation |
| Rows missing from the source | cannot handle them | \`WHEN NOT MATCHED BY SOURCE\` |
| Two sessions at the same time | **safe**: atomic insert-or-update | a concurrent insert of the same key can still fail with a duplicate-key error |
| Portability | PostgreSQL and SQLite (MySQL uses a different syntax) | the SQL standard: SQL Server, Oracle, Snowflake and Databricks have it, each with small differences |

Use the **upsert** for the simple "insert or update by key" and when several jobs may run at the same time. Use **MERGE** when a full feed must also deactivate or delete, when different situations need different actions, or when you move to a warehouse that speaks MERGE.

## Rules of an idempotent load
1. A **business key** with a unique constraint decides "same row" (the GSTIN here).
2. The **source is reduced to one row per key** (\`DISTINCT\`, or latest-wins with \`ROW_NUMBER\`).
3. **Compare only business columns** when deciding whether to update, never the load timestamp.
4. **Write only what changed**, and let the statement report what it did (\`RETURNING\`, \`merge_action()\`).
5. **Run it as one transaction**, so a failure leaves the target as it was.
6. **Prove it:** run the load twice. The second run must report zero changes.
7. For out-of-order data, make an older row unable to overwrite a newer one: \`WHERE EXCLUDED.version > vendor_master.version\`.

The same \`DO NOTHING\` idea builds an **idempotency ledger**: \`INSERT INTO processed_files (file_name) VALUES (…) ON CONFLICT DO NOTHING RETURNING file_name\`. If it returns a row, you are the first to see this file and you process it. If it returns nothing, someone already did, and you skip it. That is how a pipeline stops a retried upload from loading the same payroll file twice.`,
    { sql: {
      title: 'An idempotency ledger with DO NOTHING',
      starter: `CREATE TABLE processed_files (file_name text PRIMARY KEY, first_seen date NOT NULL DEFAULT DATE '2026-09-02');

-- First attempt: we are the first to see the file, so we get a row back and may process it
INSERT INTO processed_files (file_name) VALUES ('payroll_sep.csv')
ON CONFLICT DO NOTHING
RETURNING file_name;

-- The upload is retried: nothing comes back, so we skip the file
INSERT INTO processed_files (file_name) VALUES ('payroll_sep.csv')
ON CONFLICT DO NOTHING
RETURNING file_name;

-- A different file is new again
INSERT INTO processed_files (file_name) VALUES ('payroll_oct.csv')
ON CONFLICT DO NOTHING
RETURNING file_name;

SELECT file_name, first_seen FROM processed_files ORDER BY file_name;`,
      note: 'The first insert returns payroll_sep.csv, the retry returns no rows (the file is skipped), and payroll_oct.csv returns a row because it is new. The table ends with two rows: no duplicates, however many times the upload is retried.',
    } },
    `## Practice
These challenges use only \`SELECT\`: they **preview** a load, which is step 1 of the safe routine. Each query starts with the same master and feed as the playgrounds, supplied as a \`WITH\` block.`,
    { challenge: {
      id: 'sql-upsert-merge-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Preview tonight\'s load. For every **different** vendor in `vendor_feed` (one row per `gstin`; the repeated Deccan row counts once), return `gstin, action`, where `action` is `new` (not in the master), `changed` (in the master, but the name or the city differs) or `unchanged`. Sort by `gstin`. (5 rows: 2 new, 1 changed, 2 unchanged.)',
      starter: `${CTES}
SELECT DISTINCT f.gstin
FROM vendor_feed f
ORDER BY f.gstin`,
      hint: 'LEFT JOIN a DISTINCT feed (gstin, supplier_name, city) to vendor_master on gstin. A CASE with m.gstin IS NULL for new, (m.supplier_name, m.city) IS DISTINCT FROM (f.supplier_name, f.city) for changed.',
      solution: `${CTES}
SELECT f.gstin,
       CASE WHEN m.gstin IS NULL THEN 'new'
            WHEN (m.supplier_name, m.city) IS DISTINCT FROM (f.supplier_name, f.city) THEN 'changed'
            ELSE 'unchanged' END AS action
FROM (SELECT DISTINCT gstin, supplier_name, city FROM vendor_feed) f
LEFT JOIN vendor_master m ON m.gstin = f.gstin
ORDER BY f.gstin`,
    } },
    { challenge: {
      id: 'sql-upsert-merge-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'This time a feed contains two **different** rows for the same vendor, and the **latest** `seq` must win. The feed is in the `WITH` block of the starter: Deccan appears at `seq` 4 (Hyderabad) and again at `seq` 6 (Secunderabad). Return one row per vendor with the winning data: `gstin, supplier_name, city`, sorted by `gstin`. (4 rows. Deccan must show Secunderabad.)',
      starter: `WITH vendor_feed(seq, gstin, supplier_name, city) AS (
  VALUES (1, '29AAHCN9902L1ZX', 'Nandi Electricals', 'Bengaluru'),
         (2, '37AABCG4471E1Z1', 'Godavari Chemicals Pvt Ltd', 'Visakhapatnam'),
         (4, '36AADCD5521K1Z2', 'Deccan Packaging', 'Hyderabad'),
         (5, '36AAGFK3310P1Z8', 'Krishna Logistics', 'Hyderabad'),
         (6, '36AADCD5521K1Z2', 'Deccan Packaging', 'Secunderabad')
)
SELECT gstin
FROM vendor_feed
ORDER BY gstin`,
      hint: 'ROW_NUMBER() OVER (PARTITION BY gstin ORDER BY seq DESC) in a CTE, then keep rn = 1.',
      solution: `WITH vendor_feed(seq, gstin, supplier_name, city) AS (
  VALUES (1, '29AAHCN9902L1ZX', 'Nandi Electricals', 'Bengaluru'),
         (2, '37AABCG4471E1Z1', 'Godavari Chemicals Pvt Ltd', 'Visakhapatnam'),
         (4, '36AADCD5521K1Z2', 'Deccan Packaging', 'Hyderabad'),
         (5, '36AAGFK3310P1Z8', 'Krishna Logistics', 'Hyderabad'),
         (6, '36AADCD5521K1Z2', 'Deccan Packaging', 'Secunderabad')
),
ranked AS (
  SELECT gstin, supplier_name, city,
         ROW_NUMBER() OVER (PARTITION BY gstin ORDER BY seq DESC) AS rn
  FROM vendor_feed
)
SELECT gstin, supplier_name, city
FROM ranked
WHERE rn = 1
ORDER BY gstin`,
    } },
    { challenge: {
      id: 'sql-upsert-merge-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Which vendors would the `NOT MATCHED BY SOURCE` branch deactivate? Return `gstin, supplier_name` of the vendors in `vendor_master` that are **active** and whose `gstin` does **not appear** in `vendor_feed`. Sort by `gstin`. (1 row: Sri Lakshmi Traders. Mumbai Metals is also absent from the feed, but it is already inactive.)',
      starter: `${CTES}
SELECT m.gstin, m.supplier_name
FROM vendor_master m
ORDER BY m.gstin`,
      hint: 'WHERE m.active AND NOT EXISTS (SELECT 1 FROM vendor_feed f WHERE f.gstin = m.gstin).',
      solution: `${CTES}
SELECT m.gstin, m.supplier_name
FROM vendor_master m
WHERE m.active
  AND NOT EXISTS (SELECT 1 FROM vendor_feed f WHERE f.gstin = m.gstin)
ORDER BY m.gstin`,
    } },
    { real: 'Nearly every pipeline in this course ends in an upsert or a MERGE: loading a vendor or customer master, applying a daily file of changes, merging staged data into a warehouse table (dlt and dbt can both generate MERGE statements for you, depending on the destination and the settings). The habit that matters is the **second run**. Before you call a load finished, run it again and check that it reports zero changes. Put the check in the job itself: if the second pass of a test reports changes, the job is not idempotent, and a retry in production will corrupt the table. Pair it with the ledger (`ON CONFLICT DO NOTHING`) so that a re-delivered file is skipped as a whole.' },
    { interview: '"What does idempotent mean for a data load, and how do you achieve it in PostgreSQL?" Model answer: "An idempotent load leaves the same final state whether it runs once or many times, so a retry cannot duplicate or corrupt data. I use INSERT … ON CONFLICT DO UPDATE with a WHERE that compares the business columns, or MERGE, on a business key with a unique constraint. I reduce the source to one row per key first, because otherwise PostgreSQL raises ‘cannot affect row a second time’. I only write rows that changed, run the load in one transaction, and test it by running it twice: the second run must change nothing." Follow-ups: "When would you choose MERGE over ON CONFLICT?" (when I need deletes or soft deletes for rows missing from the source, several actions, or portability) and "what does EXCLUDED mean?" (the row that was proposed for insertion).' },
    `## Recap
- An **idempotent** load gives the same result however many times it runs. Retries are normal, so build for them.
- **\`INSERT … ON CONFLICT (key) DO UPDATE\`** inserts or updates by a unique key; \`EXCLUDED\` is the proposed row. **\`DO NOTHING\`** skips existing rows (an idempotency ledger). A \`WHERE\` with \`IS DISTINCT FROM\` on the business columns skips unchanged rows, and \`RETURNING\` then lists only real changes.
- **Duplicates in the source** raise *ON CONFLICT DO UPDATE command cannot affect row a second time* (and the same for MERGE). Reduce the source to one row per key: \`DISTINCT\` or latest-wins with \`ROW_NUMBER\`.
- **\`MERGE\`** chooses an action per situation: \`WHEN MATCHED\`, \`WHEN NOT MATCHED BY TARGET\` (insert), \`WHEN NOT MATCHED BY SOURCE\` (update or delete rows missing from the source). \`merge_action()\` reports what happened.
- Preview first. On the vendor feed the load does 1 update, 2 inserts and 1 deactivation; the second run does nothing.
- Never compare the load timestamp when testing for changes. Run the load twice to prove idempotency.`,
  ],
  quiz: [
    { q: 'What does it mean that a data load is idempotent?', o: ['It runs faster the second time', 'Running it once or many times leaves the same final state', 'It can only insert, never update', 'It runs without a transaction'], a: 1, why: 'Retries and re-runs are normal in pipelines. An idempotent load makes them harmless: no duplicates and no double updates.' },
    { q: 'In `INSERT … ON CONFLICT (gstin) DO UPDATE SET city = EXCLUDED.city`, what is EXCLUDED?', o: ['The rows that were deleted', 'The rows that failed a constraint check', 'A table of all excluded vendors', 'The row that you tried to insert, with its new values'], a: 3, why: 'EXCLUDED is a pseudo-table holding the proposed row, so EXCLUDED.city is the new value and the plain column name is the existing value.' },
    { q: 'Why add `WHERE (t.name, t.city) IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.city)` to the DO UPDATE?', o: ['PostgreSQL requires it', 'It makes the key unique', 'It skips rows that did not change, so the load rewrites nothing needlessly and RETURNING shows only real changes; IS DISTINCT FROM also handles NULL', 'It lets the statement update two rows at once'], a: 2, why: 'Without the filter every existing row is rewritten on each run. With it, an identical re-run changes nothing, and NULLs compare correctly.' },
    { q: 'What causes "ON CONFLICT DO UPDATE command cannot affect row a second time"?', o: ['The same key appears more than once in the rows being inserted, so reduce the source to one row per key first', 'The table has no primary key', 'The transaction was not committed', 'The column list is missing'], a: 0, why: 'Two source rows target the same existing row in one statement, and PostgreSQL refuses to pick a winner. Deduplicate with DISTINCT or ROW_NUMBER.' },
    { q: 'Which statement can also deactivate or delete target rows that are missing from the source?', o: ['INSERT … ON CONFLICT DO UPDATE', 'MERGE with WHEN NOT MATCHED BY SOURCE', 'INSERT … SELECT', 'UPDATE … FROM'], a: 1, why: 'An upsert only sees rows that are in the source. MERGE (PostgreSQL 17 and later) can act on target rows that have no partner in the source.' },
    { q: 'When is INSERT … ON CONFLICT a better choice than MERGE?', o: ['When you must delete rows', 'When you need three different actions', 'When there is no unique key', 'For a simple insert-or-update by a unique key, especially when several sessions may run at the same time'], a: 3, why: 'ON CONFLICT is an atomic insert-or-update on a unique key and is safe under concurrency. MERGE is more general but a concurrent insert of the same key can still fail.' },
  ],
  task: {
    title: 'Load the vendor feed twice on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `20_upsert_merge.sql` in `C:\\sql-practice`. Create `vendor_master` and `vendor_feed` as shown in the lesson table (copy the CREATE TABLE and INSERT statements from the playground starter text), with `gstin` as the primary key of the master.',
      'Query 1: the preview classification (expect 2 unchanged, 1 changed, 2 new) and the active vendor missing from the feed (expect Sri Lakshmi Traders).',
      'Query 2: the upsert with `ON CONFLICT … DO UPDATE … WHERE … IS DISTINCT FROM`. First run it **without** the DISTINCT on the source and copy the error text into a comment. Then run it correctly (expect 3 rows from RETURNING) and run it a second time (expect 0 rows).',
      'Query 3: reset the tables and load with `MERGE`, including the `NOT MATCHED BY SOURCE` branch and `merge_action()` (expect 4 actions, then 0 on the second run). Compare the final tables of the two methods and write one comment on the difference (Sri Lakshmi).',
      'Query 4: build an idempotency ledger `processed_files` and show the retry of one file returning no rows.',
    ],
    deliverable: '`20_upsert_merge.sql` with the four queries, the error text, and the outputs showing 3 then 0 rows for the upsert and 4 then 0 actions for the MERGE.',
  },
};
