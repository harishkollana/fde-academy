// A pretend source system (src_orders, built from the Kollana orders) and an empty warehouse copy (dw_orders).
// updated_at = order date + (order_id mod 24) hours, so every run gives the same data. The last order of FY 2025-26 is on 28 Mar 2026.
const BASE = `CREATE TABLE src_orders AS
SELECT order_id, order_date, customer_id, product_id, qty, channel, amount, status,
       (order_date + (order_id % 24) * INTERVAL '1 hour')::timestamp AS updated_at,
       false AS is_deleted
FROM orders;
ALTER TABLE src_orders ADD PRIMARY KEY (order_id);
CREATE TABLE dw_orders (LIKE src_orders INCLUDING DEFAULTS);
ALTER TABLE dw_orders ADD PRIMARY KEY (order_id);
ALTER TABLE dw_orders ADD COLUMN loaded_at timestamp, ADD COLUMN row_hash text;
CREATE TABLE etl_watermark (source_name text PRIMARY KEY, last_updated_at timestamp NOT NULL);`;

const LOAD_COLS = 'order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted';

// Day 1 (full load) and day 2 (changes in the source, then the incremental load) already done: the state the later playgrounds start from.
const AFTER_DAY2 = `${BASE}
INSERT INTO dw_orders (${LOAD_COLS}, loaded_at) SELECT ${LOAD_COLS}, TIMESTAMP '2026-04-01 02:00' FROM src_orders;
INSERT INTO etl_watermark SELECT 'orders', MAX(updated_at) FROM src_orders;
UPDATE src_orders SET status = 'Returned', updated_at = TIMESTAMP '2026-04-01 09:30'
WHERE order_id IN (3, 17, 33, 48, 59, 71, 84, 96, 108, 120, 133, 150);
INSERT INTO src_orders (${LOAD_COLS}) VALUES
  (221, DATE '2026-04-01', 1, 2, 3, 'Online',  4500.00, 'Shipped',   TIMESTAMP '2026-04-01 10:15', false),
  (222, DATE '2026-04-01', 4, 1, 1, 'Partner', 1200.00, 'Shipped',   TIMESTAMP '2026-04-01 10:20', false),
  (223, DATE '2026-04-01', 6, 3, 2, 'Direct',  8800.00, 'Delivered', TIMESTAMP '2026-04-01 10:45', false),
  (224, DATE '2026-04-01', 9, 5, 5, 'Online',  2300.00, 'Shipped',   TIMESTAMP '2026-04-01 11:05', false),
  (225, DATE '2026-04-01', 2, 4, 1, 'Partner',  640.00, 'Shipped',   TIMESTAMP '2026-04-01 11:30', false);
DELETE FROM src_orders WHERE order_id IN (5, 6, 7);
CREATE TABLE stg_orders AS
SELECT * FROM src_orders WHERE updated_at > (SELECT last_updated_at FROM etl_watermark WHERE source_name = 'orders');
INSERT INTO dw_orders (${LOAD_COLS}, loaded_at)
SELECT ${LOAD_COLS}, TIMESTAMP '2026-04-02 02:00' FROM stg_orders
ON CONFLICT (order_id) DO UPDATE SET order_date = EXCLUDED.order_date, customer_id = EXCLUDED.customer_id, product_id = EXCLUDED.product_id,
  qty = EXCLUDED.qty, channel = EXCLUDED.channel, amount = EXCLUDED.amount, status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at, is_deleted = EXCLUDED.is_deleted, loaded_at = EXCLUDED.loaded_at;
UPDATE etl_watermark SET last_updated_at = (SELECT MAX(updated_at) FROM stg_orders) WHERE source_name = 'orders';`;

export default {
  id: 'sql-incremental-loads',
  title: 'Incremental loads: watermarks, change detection, idempotent re-runs, late data and deletes',
  goal: 'You can load only what changed since the last run with a watermark, make a load safe to run twice, catch changes without a timestamp using a row hash, handle late-arriving rows, and find deleted rows that a watermark can never see.',
  roadmap: [
    'Watermarks and change detection',
    'Idempotent re-runs',
    'Late-arriving data',
    'Soft deletes and detecting deletes',
  ],
  blocks: [
    `## The problem
Every night a job copies the \`orders\` table from the sales system into the warehouse. Today the table has 220 rows, and the job reloads all of them in a blink. In two years it will have **ten crore rows**, and the nightly copy will run for hours, lock tables, and move 99.9% of data that did not change.

The fix sounds simple: **load only what changed since the last run.** But that one sentence hides four hard questions, and each is a classic interview topic:

1. **How do I know what changed?** (a watermark, a hash, or a change log)
2. **What if the job runs twice**, or fails halfway and is restarted? (*idempotency*)
3. **What if a row arrives late**, after the job has already moved on?
4. **What about rows that were deleted** in the source? A deleted row leaves no trace to find.

This lesson answers all four with working SQL on a small copy of the Kollana orders. The same ideas appear later as the *incremental cursor* of an ingestion tool and as an *incremental model* in dbt, so it is worth learning them once in plain SQL.`,
    `## Full refresh or incremental?
| | Full refresh | Incremental |
|---|---|---|
| What it does | delete everything, reload everything | load only new and changed rows |
| Simple? | **Very.** Nothing to remember between runs | No: needs a watermark, a key, rules for deletes |
| Cost | grows with the **table size** | grows with the **amount of change** |
| Fixes its own mistakes? | **Yes**, every run rebuilds the truth | No: a missed row stays missing |
| Use it when | the table is small, or there is no reliable change marker | the table is big and changes are a small part of it |

Full refresh is not a sin. For a 12-row customer list it is the right answer. Reach for incremental when the cost of copying everything is a real problem, and **keep a way to run a full refresh** for the day you need to repair a table.`,
    `## The watermark pattern
Most sources have a column that records *when a row last changed*: \`updated_at\`, a modified date, or an ever-growing id. The **watermark** is the highest value of that column that you have **already loaded**. You store it in a small table. Each run does four steps:

1. **Read** the watermark.
2. **Stage**: copy the rows with \`updated_at > watermark\` into a staging table.
3. **Upsert** the staged rows into the warehouse by their key (insert new, update existing).
4. **Advance** the watermark to the **highest \`updated_at\` of the staged batch**, only after step 3 succeeded.

Two rules that people get wrong:

- **Advance to the maximum of the batch you staged, not to \`now()\`**, and not to a fresh \`MAX()\` of the source. Rows can arrive between your read and your update, and \`now()\` would skip them for ever.
- **Advance last.** If the job fails in step 3, the watermark must still be the old value, so the next run picks up the same rows again.`,
    { sketch: { w: 760, h: 316, caption: 'One incremental run. The watermark moves forward only after the warehouse has the rows.', items: [
      { t: 'db', x: 10, y: 40, w: 130, h: 90, label: 'source', fill: 'blue' },
      { t: 'text', x: 75, y: 150, text: 'orders, with updated_at', size: 14 },
      { t: 'arrow', x1: 144, y1: 85, x2: 280, y2: 85, label: '2  rows newer\nthan the watermark', lx: 0, ly: -34 },
      { t: 'box', x: 282, y: 54, w: 180, h: 62, label: 'staging table', sub: 'stg_orders', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 464, y1: 85, x2: 600, y2: 85, label: '3  upsert by key', lx: 0, ly: -20 },
      { t: 'db', x: 602, y: 40, w: 148, h: 90, label: 'dw_orders', fill: 'green' },
      { t: 'text', x: 676, y: 150, text: 'the warehouse', size: 14 },
      { t: 'box', x: 290, y: 190, w: 200, h: 54, label: 'etl_watermark', sub: 'orders: 2026-03-28 10:00', fill: 'orange', size: 16 },
      { t: 'arrow', x1: 352, y1: 188, x2: 352, y2: 120, label: '1  read', lx: 28, ly: 0 },
      { t: 'arrow', x1: 660, y1: 134, x2: 494, y2: 208, label: '4  advance to MAX(updated_at)\nof the staged batch', lx: 78, ly: 30, dashed: true },
      { t: 'note', x: 10, y: 262, w: 736, h: 44, fill: 'yellow', size: 14, text: 'If step 3 fails, the watermark is still the old value: the next run stages the same rows again.\nThat is only safe because the upsert in step 3 is IDEMPOTENT (running it twice gives the same table).' },
    ] } },
    { sql: {
      title: 'Day 1 full load, day 2 incremental load, then run it again',
      setup: BASE,
      starter: `-- src_orders (the source system) and an EMPTY dw_orders (the warehouse) exist, plus the etl_watermark table.
-- updated_at is shown as text (the app shows only the date part of timestamps).

-- DAY 1: load everything once, and record the watermark
INSERT INTO dw_orders (order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted, loaded_at)
SELECT order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted, TIMESTAMP '2026-04-01 02:00'
FROM src_orders;
INSERT INTO etl_watermark SELECT 'orders', MAX(updated_at) FROM src_orders;
SELECT (SELECT COUNT(*) FROM dw_orders) AS dw_rows,
       (SELECT to_char(last_updated_at, 'YYYY-MM-DD HH24:MI') FROM etl_watermark) AS watermark;

-- DURING DAY 2 the source changes: 12 orders become Returned, 5 new orders arrive, 3 orders are deleted
UPDATE src_orders SET status = 'Returned', updated_at = TIMESTAMP '2026-04-01 09:30'
WHERE order_id IN (3, 17, 33, 48, 59, 71, 84, 96, 108, 120, 133, 150);
INSERT INTO src_orders (order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted) VALUES
  (221, DATE '2026-04-01', 1, 2, 3, 'Online',  4500.00, 'Shipped',   TIMESTAMP '2026-04-01 10:15', false),
  (222, DATE '2026-04-01', 4, 1, 1, 'Partner', 1200.00, 'Shipped',   TIMESTAMP '2026-04-01 10:20', false),
  (223, DATE '2026-04-01', 6, 3, 2, 'Direct',  8800.00, 'Delivered', TIMESTAMP '2026-04-01 10:45', false),
  (224, DATE '2026-04-01', 9, 5, 5, 'Online',  2300.00, 'Shipped',   TIMESTAMP '2026-04-01 11:05', false),
  (225, DATE '2026-04-01', 2, 4, 1, 'Partner',  640.00, 'Shipped',   TIMESTAMP '2026-04-01 11:30', false);
DELETE FROM src_orders WHERE order_id IN (5, 6, 7);

-- NIGHT 2, step 2: stage the rows newer than the watermark, and see what kind of change each one is
CREATE TABLE stg_orders AS
SELECT s.* FROM src_orders s
WHERE s.updated_at > (SELECT last_updated_at FROM etl_watermark WHERE source_name = 'orders');
SELECT CASE WHEN d.order_id IS NULL THEN 'new' ELSE 'changed' END AS kind, COUNT(*) AS rows
FROM stg_orders s LEFT JOIN dw_orders d USING (order_id)
GROUP BY 1 ORDER BY 1;

-- step 3: upsert by the key (order_id). Insert the new rows, update the changed ones.
INSERT INTO dw_orders (order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted, loaded_at)
SELECT order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted, TIMESTAMP '2026-04-02 02:00'
FROM stg_orders
ON CONFLICT (order_id) DO UPDATE SET
  order_date = EXCLUDED.order_date, customer_id = EXCLUDED.customer_id, product_id = EXCLUDED.product_id, qty = EXCLUDED.qty,
  channel = EXCLUDED.channel, amount = EXCLUDED.amount, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at,
  is_deleted = EXCLUDED.is_deleted, loaded_at = EXCLUDED.loaded_at;

-- step 4: advance the watermark to the maximum of the STAGED batch (not now())
UPDATE etl_watermark SET last_updated_at = (SELECT MAX(updated_at) FROM stg_orders) WHERE source_name = 'orders';
SELECT (SELECT COUNT(*) FROM dw_orders) AS dw_rows, (SELECT COUNT(*) FROM src_orders) AS src_rows,
       (SELECT to_char(last_updated_at, 'YYYY-MM-DD HH24:MI') FROM etl_watermark) AS watermark;

-- IDEMPOTENT? Take a fingerprint, run the SAME upsert a second time (as a restart after a failure would), compare.
CREATE TABLE fingerprint AS
SELECT md5(string_agg(order_id || '/' || status || '/' || amount, ',' ORDER BY order_id)) AS before_rerun FROM dw_orders;
INSERT INTO dw_orders (order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted, loaded_at)
SELECT order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted, TIMESTAMP '2026-04-02 02:00'
FROM stg_orders
ON CONFLICT (order_id) DO UPDATE SET
  order_date = EXCLUDED.order_date, customer_id = EXCLUDED.customer_id, product_id = EXCLUDED.product_id, qty = EXCLUDED.qty,
  channel = EXCLUDED.channel, amount = EXCLUDED.amount, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at,
  is_deleted = EXCLUDED.is_deleted, loaded_at = EXCLUDED.loaded_at;
SELECT f.before_rerun = (SELECT md5(string_agg(order_id || '/' || status || '/' || amount, ',' ORDER BY order_id)) FROM dw_orders) AS same_after_second_run,
       (SELECT COUNT(*) FROM dw_orders) AS dw_rows_after_second_run
FROM fingerprint f;

-- And the next night, nothing has changed in the source: how many rows are staged?
SELECT COUNT(*) AS rows_staged_next_night
FROM src_orders s
WHERE s.updated_at > (SELECT last_updated_at FROM etl_watermark WHERE source_name = 'orders');`,
      note: 'Day 1 loads 220 rows and the watermark is 2026-03-28 10:00 (the latest updated_at of the whole FY). On day 2 the staging query finds 17 rows: 12 changed and 5 new. After the upsert the warehouse has 225 rows but the source has only 222, and the watermark is 2026-04-01 11:30 (the maximum of the staged batch). The second run of the same upsert leaves the table identical (same_after_second_run is true, still 225 rows): that is what idempotent means. The next night finds 0 rows to stage. Notice the problem the counts reveal: 225 against 222. The three deleted orders (5, 6 and 7) are still in the warehouse, because a watermark only sees rows that exist. Deletes are the last playground.',
    } },
    { warn: '**`updated_at` is only as good as the application that sets it.** Before you trust a watermark column, check: (1) does **every** kind of change update it (a trigger or the ORM, not just the web form; a bulk SQL fix by a DBA often forgets it), (2) is it stored in one **time zone**, (3) is it set when the row is **committed**, not when the transaction **started**, and (4) what happens to **ties**: ten rows with exactly the watermark value can be split by a batch boundary, so rows committed later with the same value are missed by `>`. Using `>=` and relying on the idempotent upsert to absorb the repeats is the safe choice. If the column fails any of these tests, use a row hash or a change log instead.' },
    `## Idempotent: the property that saves you at 2 a.m.
A load is **idempotent** when running it twice (or ten times) leaves the same result as running it once. It matters because loads *do* run twice: a scheduler retries after a timeout, someone clicks "re-run", a half-finished job is restarted. Real systems cannot promise that a job runs exactly once. They promise that running it **at least once** is **safe**. Three ways to get it:

- **Upsert by a stable key** (what you just ran): \`INSERT ... ON CONFLICT (key) DO UPDATE\`, or \`MERGE\`. The same input row updates the same target row.
- **Delete-then-insert a whole slice** inside one transaction: delete the target rows of that day or partition, insert the day again. Safe to repeat, and simple for append-only facts.
- **Replace a partition**, from the last lesson: load into a new table and swap it in.

What is **not** idempotent: a plain \`INSERT\` with no key (every re-run adds duplicates), and \`UPDATE balance = balance + amount\` (every re-run adds the amount again). If you ever write the second form in a load, stop and redesign it.`,
    `## Late-arriving data
The watermark has a blind spot. Imagine the nightly job ends with watermark \`2026-04-01 11:30\`. A little later a **delayed** row is committed whose \`updated_at\` is **\`2026-04-01 08:45\`**: the application stamped it when its transaction began, and the transaction was slow, or the row came from an offline device or a partner file. The next run asks for \`updated_at > 11:30\` and **that row is never loaded**. Nothing fails. The warehouse is silently one row short.

Three defences, from cheapest to strongest:

1. **A lookback window.** Ask for \`updated_at > watermark - INTERVAL '4 hours'\` (or a day). The load re-reads a few rows that are already in the warehouse, and the idempotent upsert makes that harmless. Pick a window longer than the worst delay you have seen.
2. **A load timestamp set by the database**, such as \`inserted_at DEFAULT now()\`, or an ever-growing sequence, instead of a business date that people can back-date. The ordering then follows the **commit**, not the event.
3. **A change log (CDC):** the database's own log of changes (logical replication, or a tool such as Debezium) gives every insert, update **and delete** in commit order. It is the strongest option and needs more setup.`,
    { sketch: { w: 760, h: 300, caption: 'A row stamped before the watermark but committed after the run is invisible to "updated_at > watermark". A lookback window reads it, and the upsert absorbs the repeats.', items: [
      { t: 'line', x1: 20, y1: 112, x2: 740, y2: 112 },
      { t: 'line', x1: 90, y1: 60, x2: 90, y2: 134, dashed: true, color: '#1971c2' },
      { t: 'text', x: 20, y: 46, text: 'watermark minus 4 hours (07:30)', size: 14, color: '#1971c2', bold: true, anchor: 'start' },
      { t: 'line', x1: 430, y1: 60, x2: 430, y2: 134, color: '#c2410c' },
      { t: 'text', x: 430, y: 46, text: 'watermark after the run (11:30)', size: 14, color: '#c2410c', bold: true },
      { t: 'circle', x: 45, y: 112, r: 9, fill: 'grey' },
      { t: 'circle', x: 196, y: 112, r: 9, fill: 'pink' },
      { t: 'circle', x: 260, y: 112, r: 9, fill: 'green' },
      { t: 'circle', x: 324, y: 112, r: 9, fill: 'green' },
      { t: 'circle', x: 409, y: 112, r: 9, fill: 'green' },
      { t: 'text', x: 45, y: 142, text: 'older rows', size: 14, color: '#718096' },
      { t: 'text', x: 196, y: 142, text: 'L  08:45', size: 14, color: '#c2255c', bold: true },
      { t: 'text', x: 334, y: 142, text: 'already loaded', size: 14, color: '#2f9e44' },
      { t: 'note', x: 14, y: 168, w: 360, h: 120, fill: 'pink', size: 14, text: 'NAIVE:  updated_at > watermark\nRows after 11:30 only.\nL has updated_at = 08:45, so it is\nskipped for ever. No error, one row missing.' },
      { t: 'note', x: 388, y: 168, w: 358, h: 120, fill: 'green', size: 14, text: 'LOOKBACK:  updated_at > watermark - 4 hours\nReads everything after 07:30, so L is found.\nThe green rows are read again: the\nidempotent upsert changes nothing.' },
    ] } },
    { sql: {
      title: 'A late row: the naive watermark against a lookback window',
      setup: AFTER_DAY2,
      starter: `-- State: day 2 is loaded. The watermark is 2026-04-01 11:30. dw_orders has 225 rows.
SELECT to_char(last_updated_at, 'YYYY-MM-DD HH24:MI') AS watermark FROM etl_watermark;

-- A delayed row commits NOW, but it was stamped at 08:45, before the watermark
INSERT INTO src_orders (order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted)
VALUES (226, DATE '2026-04-01', 3, 2, 1, 'Online', 999.00, 'Shipped', TIMESTAMP '2026-04-01 08:45', false);

-- Next night, the NAIVE extraction
SELECT COUNT(*) AS naive_rows_staged
FROM src_orders s
WHERE s.updated_at > (SELECT last_updated_at FROM etl_watermark WHERE source_name = 'orders');

-- With a lookback window of 4 hours
SELECT COUNT(*) AS lookback_rows_staged,
       COUNT(*) FILTER (WHERE d.order_id IS NULL) AS truly_new,
       COUNT(*) FILTER (WHERE d.order_id IS NOT NULL) AS already_in_warehouse
FROM src_orders s
LEFT JOIN dw_orders d USING (order_id)
WHERE s.updated_at > (SELECT last_updated_at - INTERVAL '4 hours' FROM etl_watermark WHERE source_name = 'orders');

-- How many source rows are missing from the warehouse right now? (a reconciliation)
SELECT s.order_id, to_char(s.updated_at, 'YYYY-MM-DD HH24:MI') AS updated_at
FROM src_orders s
WHERE NOT EXISTS (SELECT 1 FROM dw_orders d WHERE d.order_id = s.order_id);`,
      note: 'The watermark is 2026-04-01 11:30. The naive extraction stages 0 rows, so the late order 226 would never be loaded. The 4-hour lookback stages 18 rows: 1 truly new (order 226) and 17 that are already in the warehouse (the 12 returned orders and the 5 new orders of day 2, re-read harmlessly because the upsert is idempotent). The last query is the reconciliation that proves the hole: order 226, updated_at 2026-04-01 08:45, exists in the source and not in the warehouse.',
    } },
    `## Change detection without a timestamp: the row hash
Some sources have **no trustworthy \`updated_at\` column**: a legacy export, a partner file, a table edited by SQL scripts. Then compare **content**. A **row hash** is a short fingerprint of all the columns you care about (for example \`md5\` of the values joined together). Store it in the warehouse next to each row. To detect changes, hash the source rows again and compare by key:

| In source? | In warehouse? | Hash | Action |
|---|---|---|---|
| yes | no | - | **insert** |
| yes | yes | different | **update** |
| yes | yes | same | skip |
| no | yes | - | **delete** (or mark deleted) |

That is a \`FULL OUTER JOIN\` on the key, which you wrote in the set operations lesson. The cost is that you must **read the whole source** every time (so it detects changes but does not reduce the read), but you move and write only the changed rows.

**Hash carefully.** Joining the columns with a separator is not enough when a value can be \`NULL\`. \`concat_ws\` **skips** NULLs, so a row with \`('a', NULL, 'b')\` and a row with \`('a', 'b')\` produce the same text and the same hash. Replace NULL with a marker first (\`COALESCE(col::text, '~')\`), keep the **same column order** on both sides, and use a separator that cannot appear in the data.`,
    { sql: {
      title: 'Find new, changed and deleted rows with a hash, when updated_at is not reliable',
      setup: AFTER_DAY2,
      starter: `-- A source with NO reliable updated_at: someone edits amounts with a SQL script and does not touch updated_at.
UPDATE src_orders SET amount = ROUND(amount * 1.18, 2) WHERE order_id IN (10, 20, 30);      -- 3 silent changes
INSERT INTO src_orders (order_id, order_date, customer_id, product_id, qty, channel, amount, status, updated_at, is_deleted)
VALUES (230, DATE '2026-04-02', 5, 2, 2, 'Direct', 3100.00, 'Shipped', TIMESTAMP '2026-04-02 09:00', false);   -- 1 new
DELETE FROM src_orders WHERE order_id = 40;                                                  -- 1 deleted

-- The watermark finds nothing, because updated_at did not change for the 3 edited rows:
SELECT COUNT(*) AS watermark_finds
FROM src_orders s
WHERE s.updated_at > (SELECT last_updated_at FROM etl_watermark WHERE source_name = 'orders');

-- A null-safe hash of the business columns (NULL becomes the marker '~', so NULL and '' and shifted columns differ)
CREATE VIEW src_hashed AS
SELECT order_id, md5(concat_ws('|', COALESCE(order_date::text, '~'), COALESCE(customer_id::text, '~'), COALESCE(product_id::text, '~'),
                               COALESCE(qty::text, '~'), COALESCE(channel, '~'), COALESCE(amount::text, '~'), COALESCE(status, '~'))) AS row_hash
FROM src_orders;
CREATE VIEW dw_hashed AS
SELECT order_id, md5(concat_ws('|', COALESCE(order_date::text, '~'), COALESCE(customer_id::text, '~'), COALESCE(product_id::text, '~'),
                               COALESCE(qty::text, '~'), COALESCE(channel, '~'), COALESCE(amount::text, '~'), COALESCE(status, '~'))) AS row_hash
FROM dw_orders;

-- Compare by key: one FULL OUTER JOIN gives all four cases
SELECT CASE WHEN d.order_id IS NULL THEN 'insert'
            WHEN s.order_id IS NULL THEN 'delete'
            WHEN s.row_hash <> d.row_hash THEN 'update'
            ELSE 'same' END AS action,
       COUNT(*) AS rows
FROM src_hashed s
FULL OUTER JOIN dw_hashed d ON d.order_id = s.order_id
GROUP BY 1
ORDER BY 1;

-- Which rows exactly?
SELECT COALESCE(s.order_id, d.order_id) AS order_id,
       CASE WHEN d.order_id IS NULL THEN 'insert' WHEN s.order_id IS NULL THEN 'delete' ELSE 'update' END AS action
FROM src_hashed s
FULL OUTER JOIN dw_hashed d ON d.order_id = s.order_id
WHERE s.order_id IS NULL OR d.order_id IS NULL OR s.row_hash <> d.row_hash
ORDER BY 1;

-- Why COALESCE matters: the same two rows with and without it
SELECT md5(concat_ws('|', 'a', NULL, 'b')) = md5(concat_ws('|', 'a', 'b')) AS plain_concat_ws_collides,
       md5(concat_ws('|', COALESCE('a', '~'), COALESCE(NULL, '~'), COALESCE('b', '~')))
         = md5(concat_ws('|', COALESCE('a', '~'), COALESCE('b', '~'))) AS with_coalesce_collides;`,
      note: 'The watermark query finds only 1 row, the new order 230 (updated_at 2026-04-02 09:00). The three silent edits (orders 10, 20 and 30) did not change updated_at, so a load by watermark would never see them. The hash comparison finds everything: update 3 (orders 10, 20 and 30), insert 1 (order 230) and delete 4 (orders 5, 6 and 7, which the day-2 load never removed from the warehouse, and the newly deleted order 40), and the other 218 rows are the same. The last query shows the trap: a plain concat_ws gives the same text for (a, NULL, b) and (a, b), so the hashes collide (true), and with the COALESCE marker they do not (false).',
    } },
    `## Deletes: the change a watermark cannot see
A watermark finds rows that **exist** and are newer. A row **deleted** in the source is simply gone, so no query on the source can return it. There are three ways to deal with this:

1. **Soft deletes in the source.** The application sets \`is_deleted = true\` (and updates \`updated_at\`) instead of removing the row. The watermark sees it like any other change. This is the cleanest design and worth asking for. In the warehouse you keep the flag, so reports can filter on \`is_deleted = false\`.
2. **Compare the keys.** Once in a while (nightly or weekly) pull **only the key column** from the source, and find the keys that the warehouse has but the source no longer has: an **anti-join** (\`NOT EXISTS\`). Keys are cheap to read, so this works even for big tables. Then **mark** those warehouse rows as deleted, or delete them if the policy says so.
3. **A change log (CDC)**, which records deletes as events.

In a finance warehouse **mark, do not erase**, unless a rule says otherwise: an auditor may ask "what did we report last quarter, and which invoice did it include?", and a physically deleted row cannot answer. Keep \`deleted_at\` and the reason if you have it.

Finally, **trust but verify**. After every run, compare **control totals** between source and warehouse: the row count, and the sum of an amount column, per day. A difference tells you that *something* is wrong long before a user finds it. The next playground does both the key comparison and the control totals.`,
    { sketch: { w: 760, h: 276, caption: 'Delete detection by key comparison: the anti-join finds keys the warehouse still has but the source has dropped.', items: [
      { t: 'table', x: 14, y: 40, title: 'compare the key lists (not all columns)', cols: ['order_id', 'in source', 'in warehouse', 'verdict'], colW: [120, 130, 150, 300], rows: [['4', 'yes', 'yes', 'check hash: same or update'], ['5', 'NO', 'yes', 'deleted in the source: mark it'], ['6', 'NO', 'yes', 'deleted in the source: mark it'], ['221', 'yes', 'NO', 'new: insert it']], rowH: 30, hl: [1, 2] },
      { t: 'note', x: 14, y: 196, w: 362, h: 66, fill: 'yellow', size: 14, text: 'SELECT d.order_id FROM dw_orders d\nWHERE NOT EXISTS (SELECT 1 FROM src_orders s\n                  WHERE s.order_id = d.order_id)' },
      { t: 'note', x: 390, y: 196, w: 356, h: 66, fill: 'green', size: 14, text: 'Then: UPDATE dw_orders SET is_deleted = true.\nMark, do not erase: the audit trail stays.\nCompare control totals (count and sum) after.' },
    ] } },
    { sql: {
      title: 'Detect deleted rows, mark them, and reconcile control totals',
      setup: AFTER_DAY2,
      starter: `-- State: day 2 is loaded. The source has 222 rows, the warehouse 225. Which rows did the watermark miss?
SELECT (SELECT COUNT(*) FROM src_orders) AS src_rows, (SELECT COUNT(*) FROM dw_orders) AS dw_rows,
       (SELECT SUM(amount) FROM src_orders) AS src_total, (SELECT SUM(amount) FROM dw_orders) AS dw_total;

-- 1) Anti-join on the keys: in the warehouse, not in the source
SELECT d.order_id, d.status, d.amount
FROM dw_orders d
WHERE NOT EXISTS (SELECT 1 FROM src_orders s WHERE s.order_id = d.order_id)
ORDER BY d.order_id;

-- 2) Mark them as deleted (do not erase), and record when we noticed
ALTER TABLE dw_orders ADD COLUMN deleted_at timestamp;
UPDATE dw_orders d
SET is_deleted = true, deleted_at = TIMESTAMP '2026-04-02 02:30'
WHERE NOT EXISTS (SELECT 1 FROM src_orders s WHERE s.order_id = d.order_id)
  AND NOT d.is_deleted;

-- 3) Reports use the active rows only. Now the control totals match.
SELECT (SELECT COUNT(*) FROM src_orders) AS src_rows,
       (SELECT COUNT(*) FROM dw_orders WHERE NOT is_deleted) AS dw_active_rows,
       (SELECT SUM(amount) FROM src_orders) AS src_total,
       (SELECT SUM(amount) FROM dw_orders WHERE NOT is_deleted) AS dw_active_total,
       (SELECT COUNT(*) FROM dw_orders WHERE is_deleted) AS marked_deleted;

-- 4) A daily control total to compare, day by day (here: the days of April 2026)
SELECT s.order_date, COUNT(*) AS src_orders, SUM(s.amount) AS src_amount,
       COUNT(d.order_id) AS dw_orders, SUM(d.amount) AS dw_amount
FROM src_orders s
LEFT JOIN dw_orders d ON d.order_id = s.order_id AND NOT d.is_deleted
WHERE s.order_date >= DATE '2026-04-01'
GROUP BY s.order_date
ORDER BY s.order_date;`,
      note: 'Before: the source has 222 rows and the warehouse 225, and the totals differ because the three deleted orders are still counted. The anti-join lists orders 5, 6 and 7. After marking them as deleted, the warehouse has 222 active rows and 3 marked_deleted, and the count and the sum of the active rows equal the source totals. The last query compares the control totals for 1 April 2026: 5 orders and an amount of 17440.00 on both sides (4500 + 1200 + 8800 + 2300 + 640).',
    } },
    { local: `**Run an incremental load on a schedule** (your laptop, \`fde_practice\` database). Put the day-2 steps in a script \`load_orders.sql\` and call it from PowerShell. The script must be safe to run twice:
\`\`\`powershell
$env:PGPASSWORD = 'your-password'
psql -U postgres -d fde_practice -v ON_ERROR_STOP=1 -f C:\\sql-practice\\load_orders.sql
\`\`\`
**What to expect:** with \`-v ON_ERROR_STOP=1\` psql stops at the first error and returns a non-zero exit code, which a scheduler such as Task Scheduler, cron, Airflow or an Azure Function treats as a failed run. Wrap steps 3 and 4 in \`BEGIN ... COMMIT\` so that the upsert and the new watermark are saved **together or not at all**. Write one row per run to a log table (\`run_id\`, start and end time, rows staged, rows inserted, rows updated, watermark before and after). When a load that normally stages thousands of rows stages **zero**, treat it as an alert, not as good news: the source may have stopped updating \`updated_at\`.` },
    `## Practice
Three tasks on the logic of incremental loads, with the data inline so they run on the plain Kollana database: choose the next batch, classify rows by hash, and apply a lookback window with out-of-order events.`,
    { challenge: {
      id: 'sql-incremental-loads-ch1',
      level: 'easy',
      ordered: false,
      prompt: 'The watermark is `2026-04-01 10:00:00`. For the eight source rows in the starter return one row with `rows_to_load` (rows with `updated_at` **greater than** the watermark), `rows_at_the_watermark` (rows whose `updated_at` is **exactly** the watermark: the ties that `>` misses) and `new_watermark` (the largest `updated_at` among the rows to load, as text in the format `YYYY-MM-DD HH24:MI:SS`). (1 row.)',
      starter: `WITH wm(last_ts) AS (VALUES (TIMESTAMP '2026-04-01 10:00:00')),
src(order_id, status, updated_at) AS (
  VALUES (1, 'Shipped',   TIMESTAMP '2026-04-01 08:15:00'),
         (2, 'Delivered', TIMESTAMP '2026-04-01 09:59:59'),
         (3, 'Returned',  TIMESTAMP '2026-04-01 10:00:00'),
         (4, 'Shipped',   TIMESTAMP '2026-04-01 10:00:00'),
         (5, 'Delivered', TIMESTAMP '2026-04-01 10:30:00'),
         (6, 'Shipped',   TIMESTAMP '2026-04-01 10:45:30'),
         (7, 'Returned',  TIMESTAMP '2026-04-01 11:10:00'),
         (8, 'Shipped',   TIMESTAMP '2026-04-01 11:10:00')
)
SELECT COUNT(*) AS rows_to_load
FROM src, wm
WHERE src.updated_at > wm.last_ts`,
      hint: "Use COUNT(*) FILTER (WHERE updated_at > last_ts) and COUNT(*) FILTER (WHERE updated_at = last_ts), and MAX(updated_at) FILTER (WHERE updated_at > last_ts) wrapped in TO_CHAR(..., 'YYYY-MM-DD HH24:MI:SS').",
      solution: `WITH wm(last_ts) AS (VALUES (TIMESTAMP '2026-04-01 10:00:00')),
src(order_id, status, updated_at) AS (
  VALUES (1, 'Shipped',   TIMESTAMP '2026-04-01 08:15:00'),
         (2, 'Delivered', TIMESTAMP '2026-04-01 09:59:59'),
         (3, 'Returned',  TIMESTAMP '2026-04-01 10:00:00'),
         (4, 'Shipped',   TIMESTAMP '2026-04-01 10:00:00'),
         (5, 'Delivered', TIMESTAMP '2026-04-01 10:30:00'),
         (6, 'Shipped',   TIMESTAMP '2026-04-01 10:45:30'),
         (7, 'Returned',  TIMESTAMP '2026-04-01 11:10:00'),
         (8, 'Shipped',   TIMESTAMP '2026-04-01 11:10:00')
)
SELECT COUNT(*) FILTER (WHERE src.updated_at > wm.last_ts) AS rows_to_load,
       COUNT(*) FILTER (WHERE src.updated_at = wm.last_ts) AS rows_at_the_watermark,
       TO_CHAR(MAX(src.updated_at) FILTER (WHERE src.updated_at > wm.last_ts), 'YYYY-MM-DD HH24:MI:SS') AS new_watermark
FROM src, wm`,
    } },
    { challenge: {
      id: 'sql-incremental-loads-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Classify by hash. The starter has the key and row hash of each source row and each warehouse row. Return `order_id` and `action` for every key that needs work, sorted by `order_id`: `insert` (only in the source), `update` (in both, different hash), `delete` (only in the warehouse). Do not return rows that are the same. (5 rows.)',
      starter: `WITH src(order_id, row_hash) AS (
  VALUES (1, 'a1'), (2, 'b2'), (3, 'c3'), (4, 'd4'), (5, 'e5'), (6, 'f6'), (7, 'g7')
),
dw(order_id, row_hash) AS (
  VALUES (2, 'b2'), (3, 'XX'), (4, 'd4'), (5, 'YY'), (6, 'f6'), (7, 'g7'), (8, 'h8'), (9, 'i9')
)
SELECT s.order_id, s.row_hash
FROM src s
ORDER BY s.order_id`,
      hint: "FULL OUTER JOIN src and dw ON order_id. COALESCE(s.order_id, d.order_id) is the key. A CASE with d.order_id IS NULL, s.order_id IS NULL, and s.row_hash <> d.row_hash gives the three actions. Filter out the rows that are the same.",
      solution: `WITH src(order_id, row_hash) AS (
  VALUES (1, 'a1'), (2, 'b2'), (3, 'c3'), (4, 'd4'), (5, 'e5'), (6, 'f6'), (7, 'g7')
),
dw(order_id, row_hash) AS (
  VALUES (2, 'b2'), (3, 'XX'), (4, 'd4'), (5, 'YY'), (6, 'f6'), (7, 'g7'), (8, 'h8'), (9, 'i9')
)
SELECT COALESCE(s.order_id, d.order_id) AS order_id,
       CASE WHEN d.order_id IS NULL THEN 'insert'
            WHEN s.order_id IS NULL THEN 'delete'
            ELSE 'update' END AS action
FROM src s
FULL OUTER JOIN dw d ON d.order_id = s.order_id
WHERE d.order_id IS NULL OR s.order_id IS NULL OR s.row_hash <> d.row_hash
ORDER BY 1`,
    } },
    { challenge: {
      id: 'sql-incremental-loads-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Lookback and out-of-order events. The watermark is `2026-04-01 11:00` and the lookback is 2 hours, so the extraction window is every event with `updated_at` **after** `2026-04-01 09:00`. Events can repeat per order and can arrive out of order. For each order that has at least one event in the window, take its **latest** event in the window, and compare it with the warehouse: `insert` if the order is not in the warehouse, `update` if the event is **newer** than the warehouse row, `skip` otherwise (stale or identical). Return `order_id, status, updated_at` (as text `YYYY-MM-DD HH24:MI`) and `action`, sorted by `order_id`. (5 rows.)',
      starter: `WITH params(watermark, lookback) AS (VALUES (TIMESTAMP '2026-04-01 11:00', INTERVAL '2 hours')),
events(order_id, status, updated_at) AS (
  VALUES (10, 'Shipped',   TIMESTAMP '2026-04-01 08:30'),
         (11, 'Returned',  TIMESTAMP '2026-04-01 09:30'),
         (11, 'Delivered', TIMESTAMP '2026-04-01 10:10'),
         (12, 'Shipped',   TIMESTAMP '2026-04-01 10:45'),
         (13, 'Delivered', TIMESTAMP '2026-04-01 09:45'),
         (14, 'Returned',  TIMESTAMP '2026-04-01 11:20'),
         (14, 'Shipped',   TIMESTAMP '2026-04-01 09:50'),
         (15, 'Shipped',   TIMESTAMP '2026-04-01 09:20')
),
dw(order_id, status, updated_at) AS (
  VALUES (11, 'Returned',  TIMESTAMP '2026-04-01 09:30'),
         (12, 'Shipped',   TIMESTAMP '2026-04-01 10:45'),
         (14, 'Shipped',   TIMESTAMP '2026-04-01 09:50'),
         (15, 'Delivered', TIMESTAMP '2026-04-01 09:40')
)
SELECT e.order_id, e.status
FROM events e
ORDER BY e.order_id`,
      hint: "Step 1: filter events to updated_at > watermark - lookback. Step 2: keep the latest per order with ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1 (or DISTINCT ON). Step 3: LEFT JOIN dw and CASE: dw.order_id IS NULL -> insert, latest.updated_at > dw.updated_at -> update, else skip.",
      solution: `WITH params(watermark, lookback) AS (VALUES (TIMESTAMP '2026-04-01 11:00', INTERVAL '2 hours')),
events(order_id, status, updated_at) AS (
  VALUES (10, 'Shipped',   TIMESTAMP '2026-04-01 08:30'),
         (11, 'Returned',  TIMESTAMP '2026-04-01 09:30'),
         (11, 'Delivered', TIMESTAMP '2026-04-01 10:10'),
         (12, 'Shipped',   TIMESTAMP '2026-04-01 10:45'),
         (13, 'Delivered', TIMESTAMP '2026-04-01 09:45'),
         (14, 'Returned',  TIMESTAMP '2026-04-01 11:20'),
         (14, 'Shipped',   TIMESTAMP '2026-04-01 09:50'),
         (15, 'Shipped',   TIMESTAMP '2026-04-01 09:20')
),
dw(order_id, status, updated_at) AS (
  VALUES (11, 'Returned',  TIMESTAMP '2026-04-01 09:30'),
         (12, 'Shipped',   TIMESTAMP '2026-04-01 10:45'),
         (14, 'Shipped',   TIMESTAMP '2026-04-01 09:50'),
         (15, 'Delivered', TIMESTAMP '2026-04-01 09:40')
),
latest AS (
  SELECT e.order_id, e.status, e.updated_at,
         ROW_NUMBER() OVER (PARTITION BY e.order_id ORDER BY e.updated_at DESC) AS rn
  FROM events e, params p
  WHERE e.updated_at > p.watermark - p.lookback
)
SELECT l.order_id, l.status,
       TO_CHAR(l.updated_at, 'YYYY-MM-DD HH24:MI') AS updated_at,
       CASE WHEN d.order_id IS NULL THEN 'insert'
            WHEN l.updated_at > d.updated_at THEN 'update'
            ELSE 'skip' END AS action
FROM latest l
LEFT JOIN dw d ON d.order_id = l.order_id
WHERE l.rn = 1
ORDER BY l.order_id`,
    } },
    { real: 'On a real engagement, the first meeting about an incremental pipeline is really about **trust**. Ask the source owner: *which column marks a change, who sets it, does a bulk fix or a back-dated entry touch it, and how are deletes shown?* Write the answers in the pipeline\'s README. Then build three safety nets: an **idempotent** upsert, a **lookback window** a little longer than the longest delay you can find, and a **nightly reconciliation** of row counts and amount totals per day against the source, with an alert when they differ. Finally, keep a documented **full-refresh switch** (a flag that resets the watermark), because on the day the source system is migrated or someone back-dates a year of invoices, the fastest honest fix is to reload.' },
    { interview: '"Design an incremental load from an operational database into a warehouse." Model answer: "I need a way to find changed rows, so I would ask which column reliably marks changes, and I would use a watermark on it, stored in a control table. Each run stages the rows newer than the watermark, upserts them into the warehouse by the business key, and only then advances the watermark to the maximum of the staged batch, in the same transaction if possible. The upsert makes the load idempotent, so a retry is safe. I would add a lookback window to catch late-arriving rows, since a late row with an old timestamp is otherwise skipped for ever. Deletes are invisible to a watermark, so I would either ask for soft deletes in the source or compare the key lists periodically and mark missing keys as deleted. Where there is no trustworthy timestamp I would compare a null-safe row hash, or use change data capture. I would log every run and reconcile counts and totals against the source." Follow-up: "What if two rows share the exact watermark value?" (use >= with an idempotent upsert, or a composite cursor of timestamp and key).' },
    `## Recap
- **Incremental** loads move only what changed; **full refresh** is simpler and self-healing, and is right for small tables. Keep a full-refresh switch for repairs.
- **Watermark pattern**: (1) read the watermark, (2) stage \`updated_at > watermark\`, (3) upsert by key, (4) advance the watermark to the **maximum of the staged batch**, last. Never use \`now()\`.
- **Idempotent** means a re-run leaves the same result: upsert by a stable key, delete-then-insert a slice in one transaction, or replace a partition. A plain \`INSERT\` or \`balance = balance + x\` is not.
- **\`updated_at\` must be trustworthy**: set on every change, one time zone, set at commit, ties handled (\`>=\` plus an idempotent upsert).
- **Late-arriving rows** are skipped by a naive watermark. Use a **lookback window**, a database-set load timestamp or an ever-growing sequence, or **CDC**.
- Without a timestamp, compare a **null-safe row hash** with a \`FULL OUTER JOIN\`: insert, update, skip, delete. \`concat_ws\` hides NULLs, so use \`COALESCE(col, '~')\`.
- **Deletes** are invisible to a watermark: use soft deletes, compare the **key lists** with an anti-join and **mark** the missing ones, or CDC. Mark, do not erase.
- **Reconcile** every run with control totals (row count and amount sum per day), log every run, and alert on zero rows.`,
  ],
  quiz: [
    { q: 'An incremental job stages rows with `updated_at > watermark`. When should it move the watermark forward, and to what?', o: ['At the start of the run, to now()', 'After the upsert succeeded, to the maximum updated_at of the staged batch', 'Before the upsert, to the maximum updated_at of the whole source table', 'Never, the watermark is fixed'], a: 1, why: 'Advancing last means a failure leaves the old watermark, so the next run repeats the batch. Using the staged batch maximum (not now()) avoids skipping rows that arrived after the extraction started.' },
    { q: 'Which statement describes an idempotent load?', o: ['It runs faster the second time', 'It can only run once', 'Running it twice leaves the same result as running it once', 'It never writes to the warehouse'], a: 2, why: 'Schedulers retry and people re-run jobs, so loads must be safe to repeat. An upsert by a stable key is the usual way to get that.' },
    { q: 'A row stamped `2026-04-01 08:45` is committed after the run whose watermark is `2026-04-01 11:30`. What happens with `updated_at > watermark`?', o: ['It is loaded in the next run', 'The job fails with an error', 'It is loaded twice', 'It is never loaded, and nothing reports a problem'], a: 3, why: 'The late row is older than the watermark, so the filter never selects it. A lookback window (watermark minus a few hours) re-reads it, and the idempotent upsert absorbs the repeats.' },
    { q: 'Why can a watermark on `updated_at` never detect a row that was deleted in the source?', o: ['A deleted row no longer exists, so no query on the source can return it', 'Deleted rows have a NULL updated_at', 'DELETE statements are not logged', 'The watermark column is read-only'], a: 0, why: 'A watermark looks for rows that exist and are newer. For deletes use soft deletes in the source, a key comparison (anti-join), or change data capture.' },
    { q: 'Why is `md5(concat_ws(\'|\', a, b, c))` a risky row hash when a column can be NULL?', o: ['md5 cannot hash text', 'concat_ws skips NULL arguments, so ("x", NULL, "y") and ("x", "y") give the same text and the same hash', 'The separator makes the hash too long', 'NULL values make md5 return an error'], a: 1, why: 'concat_ws drops NULLs. Replace them with a marker first, for example COALESCE(col::text, \'~\'), keep the same column order on both sides, and use a separator that cannot occur in the data.' },
    { q: 'After a nightly load, the warehouse has 225 rows and the source has 222. What is the most likely cause, and a good check?', o: ['Rows deleted in the source are still in the warehouse. Find them with an anti-join on the keys', 'The watermark is too low. Delete the watermark', 'The upsert created duplicates. Add DISTINCT', 'Autovacuum removed rows from the source'], a: 0, why: 'A watermark only sees rows that exist. Comparing key lists (NOT EXISTS) finds the keys the source dropped, and control totals (count and sum) prove the fix.' },
  ],
  task: {
    title: 'Build and break an incremental load',
    steps: [
      'Create `32_incremental.sql` in `C:\\sql-practice`. Build `src_orders`, `dw_orders` and `etl_watermark` with the statements from the lesson. Do the day-1 full load and record the watermark.',
      'Apply the day-2 changes (12 returned orders, 5 new, 3 deleted) and run the four-step incremental load. Write the staged count, the inserted and updated counts, and the new watermark in comments.',
      'Run the upsert a second time and prove with a fingerprint (`md5(string_agg(...))`) that nothing changed. Then change it, on purpose, into a plain `INSERT` without `ON CONFLICT` and describe the error or the duplicates you get.',
      'Insert a late row (`updated_at` before the watermark). Show that the naive extraction misses it, that a 4-hour lookback finds it, and write the reconciliation query that proves it was missing.',
      'Edit three amounts without touching `updated_at`. Build the null-safe hash views, run the `FULL OUTER JOIN` and list the inserts, updates and deletes. Add a row with a NULL status and check that your hash treats NULL and an empty string as different.',
      'Detect the deleted rows with the anti-join, mark them with `is_deleted` and `deleted_at`, and finish with a daily control-total comparison of count and sum between source and warehouse. Write a one-paragraph note: what would you ask the source owner before trusting `updated_at`?',
    ],
    deliverable: '`32_incremental.sql` with the commands you ran and, in comments, the day-1 and day-2 counts, the watermark values, the fingerprint comparison, the naive and lookback counts for the late row, the hash classification, the deleted keys, the final control totals, and your note about trusting `updated_at`.',
  },
};
