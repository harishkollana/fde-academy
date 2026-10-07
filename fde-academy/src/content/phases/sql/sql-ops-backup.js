export default {
  id: 'sql-ops-backup',
  title: 'Running PostgreSQL: backups, COPY, settings, VACUUM and monitoring',
  goal: 'You can take and verify a backup (pg_dump, pg_restore, and the idea of point-in-time recovery), move CSV data in and out with COPY, read and change server settings, explain why tables grow and what VACUUM and ANALYZE do, and watch a server with the system views and a connection pooler in mind.',
  roadmap: [
    'Backups and restore',
    'COPY and CSV rules',
    'Settings, VACUUM, monitoring and pooling',
  ],
  blocks: [
    `## The problem
Five things that happen to every database sooner or later, and who gets the phone call.

1. A deployment script drops \`dim_account\` on the production database. Someone has to **get it back**.
2. A new analyst needs last quarter's customers and orders **on a laptop**. The data has to leave the database as a file and arrive in another one.
3. Month-end close is slow. Nobody knows **who is connected, what they are running, or which table is huge**.
4. The web application stops with *"sorry, too many clients already"*. Two hundred workers each opened their own connection.
5. A table with 220 rows takes **more disk space every week**, although nobody adds rows.

None of this is query writing. It is **running a database**, and a forward-deployed engineer who owns a client's finance data is expected to know the basics: how to back up and *prove* the backup works, how to move data in bulk, which settings matter, and where to look when the server is slow or full. This last lesson of the SQL programme gives you that map.`,
    `## Backups: two families
There are two ways to back up PostgreSQL, and they answer different questions.

| | Logical backup (\`pg_dump\`) | Physical backup (base backup + WAL) |
|---|---|---|
| What is saved | the **contents**: tables, rows, definitions, written as SQL commands or a compact archive | a **copy of the data files**, plus a continuous stream of the write-ahead log (WAL) |
| Tool | \`pg_dump\`, restored with \`psql\` or \`pg_restore\` | \`pg_basebackup\`, plus WAL archiving |
| Restore to | the moment the dump started | **any moment you choose** (point-in-time recovery, PITR) |
| Can restore one table? | yes (\`pg_restore -t orders\`) | no, you restore the whole server, then copy out what you need |
| Moves between PostgreSQL versions? | yes, it is just SQL and data | no, same major version |
| Good for | small and medium databases, migrations, one-table rescues, copying to a laptop | big databases, "undo the accident from 14:05" |

\`pg_dump\` reads the database inside **one snapshot** (the snapshots of the isolation lesson), so the dump is consistent even while other people keep writing. It writes one database. The **roles** (logins and groups) live outside it, so also save them with \`pg_dumpall --globals-only\`.

The **WAL** is PostgreSQL's diary: before any change touches a table, it is written to the WAL. If you keep a base backup and every WAL file after it, you can replay the diary up to a chosen minute and stop.`,
    { sketch: { w: 760, h: 304, caption: 'Point-in-time recovery: restore the last base backup, then replay the archived WAL up to a moment of your choice, here one minute before the accident.', items: [
      { t: 'arrow', x1: 30, y1: 170, x2: 738, y2: 170 },
      { t: 'box', x: 36, y: 70, w: 170, h: 62, label: 'Base backup', sub: 'a full copy of the files', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 121, y1: 134, x2: 121, y2: 166 },
      { t: 'box', x: 190, y: 186, w: 56, h: 34, label: 'WAL', fill: 'yellow', size: 15 },
      { t: 'box', x: 254, y: 186, w: 56, h: 34, label: 'WAL', fill: 'yellow', size: 15 },
      { t: 'box', x: 318, y: 186, w: 56, h: 34, label: 'WAL', fill: 'yellow', size: 15 },
      { t: 'box', x: 382, y: 186, w: 56, h: 34, label: 'WAL', fill: 'yellow', size: 15 },
      { t: 'box', x: 446, y: 186, w: 56, h: 34, label: 'WAL', fill: 'yellow', size: 15 },
      { t: 'text', x: 346, y: 238, text: 'WAL = a log of every change. Keep archiving it.', size: 14, anchor: 'middle' },
      { t: 'box', x: 520, y: 70, w: 210, h: 62, label: 'DELETE without WHERE', sub: 'Tuesday 14:05', fill: 'pink', size: 16 },
      { t: 'arrow', x1: 625, y1: 134, x2: 565, y2: 166 },
      { t: 'box', x: 520, y: 196, w: 216, h: 62, label: 'Recovery target', sub: '14:04:59, just before', fill: 'green', size: 16 },
      { t: 'note', x: 36, y: 254, w: 470, h: 44, fill: 'grey', size: 13, text: '1) restore the base backup   2) replay the WAL up to the target time\n3) open the database: the DELETE never happened' },
    ] } },
    { local: `**Logical backup and restore on your laptop** (PowerShell, PostgreSQL's \`bin\` folder on PATH as in lesson 1):
\`\`\`powershell
$env:PGPASSWORD = 'your-password'        # only for this window; do not save it in a script
mkdir C:\\sql-practice\\backup
pg_dump -U postgres -d fde_practice -Fc -f C:\\sql-practice\\backup\\fde_practice.dump
pg_restore -l C:\\sql-practice\\backup\\fde_practice.dump        # list what is inside
createdb -U postgres fde_restore
pg_restore -U postgres -d fde_restore --no-owner C:\\sql-practice\\backup\\fde_practice.dump
\`\`\`
**What to expect:** \`pg_dump\` prints nothing when it works. The list from \`pg_restore -l\` has lines such as \`TABLE public customers postgres\`. \`-Fc\` is the compact **custom** format. A plain SQL script is \`-Fp\` (restore it with \`psql -f\`), and \`-Fd -j 4\` writes a directory in parallel. To rescue one table: \`pg_restore -U postgres -d fde_restore -t orders --clean --if-exists …dump\`. To save the roles: \`pg_dumpall -U postgres --globals-only -f roles.sql\`.

**Common errors:**
- \`no password supplied\` → set \`$env:PGPASSWORD\` (or use a \`pgpass.conf\` file).
- \`role "xyz" does not exist\` while restoring → add \`--no-owner\`, or create the role first.
- \`aborting because of server version mismatch\` → \`pg_dump\` must be the **same or a newer** major version than the server.` },
    `For physical backups the server needs \`wal_level = replica\` (or higher), archiving switched on, and a way to copy each finished WAL file to safe storage. This is the idea; a managed cloud database does all of it for you and shows it as "backup retention" and "restore to a point in time":
\`\`\`text
# postgresql.conf on the server that is backed up
wal_level = replica
archive_mode = on
archive_command = 'copy "%p" "D:\\\\wal_archive\\\\%f"'      # an example for Windows; real systems copy to remote storage

# to recover: restore the base backup, then add
restore_command = 'copy "D:\\\\wal_archive\\\\%f" "%p"'
recovery_target_time = '2026-03-10 14:04:59'
# create an empty file named recovery.signal in the data directory and start the server
\`\`\`
The exact procedure, with every step and safeguard, is in the PostgreSQL manual under *Continuous Archiving and Point-in-Time Recovery*. Two words to know for any client conversation: **RPO** (how much data you can afford to lose, for example "five minutes") and **RTO** (how long the restore may take). A nightly dump gives an RPO of up to a day. WAL archiving shrinks it to minutes.`,
    { warn: 'A **standby (replica) server is not a backup.** It copies every change as it happens, so the accidental `DELETE` is replayed on the standby a moment later. A backup also has to be **restored at least once** before you trust it: restore into a scratch database and compare row counts with the source (you will write that query in a challenge). Dumps contain PAN and bank numbers, so protect them like the database itself: access control and encryption, as in the last lesson.' },
    `## Moving data: COPY and the CSV rules
\`COPY\` is PostgreSQL's bulk loader and exporter, far faster than a thousand \`INSERT\` statements. You met \`\\copy\` in lesson 1. The two forms are easy to confuse:

- \`COPY customers TO '/data/c.csv'\` runs **in the server**. The path is on the **server's** disk, and the role needs special rights (\`pg_write_server_files\` / \`pg_read_server_files\`). On a managed cloud database you cannot use it at all.
- \`\\copy customers TO 'C:/sql-practice/c.csv'\` is a **psql command**. Your own computer reads or writes the file and streams it to the server. It needs no special rights. This is the one you use from a laptop.

Both accept the same options: \`WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', ENCODING 'UTF8')\`, and you can export a query: \`\\copy (SELECT … ) TO 'file.csv' WITH (FORMAT csv, HEADER true)\`.

The rules of a CSV field are small but they cause most loading bugs:
1. A field that contains a **comma, a double quote or a line break** is wrapped in double quotes.
2. A double quote inside a quoted field is **doubled**: \`"The ""Big"" Store"\`.
3. **NULL is an empty field** (nothing between the commas), while an **empty string is \`""\`**. The two are different values, and a careless export turns one into the other.
4. Write the file as **UTF-8**. A name with ₹ or an accent in another encoding becomes garbage, and Excel on Windows may need a UTF-8 file with a byte-order mark to show it correctly.

The safe loading pattern from the ETL phase applies here too: \`\\copy\` into a **staging table** whose columns are all text, check and clean the data with SQL, and only then insert into the real table. That way one bad row is a finding, not a failed load.`,
    { sql: {
      title: 'What COPY does to each field, written by hand',
      starter: `-- A tiny version of the CSV rules, as a function
CREATE FUNCTION csv_field(v text) RETURNS text
LANGUAGE sql IMMUTABLE
AS $$ SELECT CASE
         WHEN v IS NULL THEN ''                                     -- NULL: nothing between the commas
         WHEN v = '' OR v ~ '[,"\\n\\r]' THEN '"' || replace(v, '"', '""') || '"'
         ELSE v END $$;

CREATE TABLE csv_demo (id int, name text, amount numeric(12,2), city text);
INSERT INTO csv_demo VALUES
  (1, 'Apex Retail',        12500.50, 'Mumbai'),
  (2, 'Sharma, Gupta & Co',  8000.00, 'Delhi'),     -- a comma inside the value
  (3, 'The "Big" Store',     NULL,     'Pune'),      -- quotes inside, and a NULL amount
  (4, '',                     150.00,  NULL);        -- an empty string and a NULL city

-- The four lines of the file
SELECT id::text || ',' || csv_field(name) || ',' || COALESCE(amount::text, '') || ',' || csv_field(city) AS csv_line
FROM csv_demo
ORDER BY id;

-- The naive way: join with commas and no quoting. Count the fields a reader would find in row 2.
SELECT array_length(string_to_array(concat_ws(',', id, name, amount, city), ','), 1) AS naive_field_count
FROM csv_demo
WHERE id = 2;

-- NULL and the empty string are different things in the table
SELECT COUNT(*) FILTER (WHERE name = '')      AS empty_names,
       COUNT(*) FILTER (WHERE city IS NULL)   AS null_cities,
       COUNT(*) FILTER (WHERE amount IS NULL) AS null_amounts
FROM csv_demo;`,
      note: 'The four lines are: 1,Apex Retail,12500.50,Mumbai / 2,"Sharma, Gupta & Co",8000.00,Delhi / 3,"The ""Big"" Store",,Pune / 4,"",150.00, . Row 3 has an empty amount (NULL) and row 4 has "" for the empty name but nothing for the NULL city. Without quoting, row 2 would be read as 5 fields instead of 4. The last query finds 1 empty name, 1 NULL city and 1 NULL amount.',
    } },
    { local: `**CSV round trip with your own files** (psql, database \`fde_practice\`):
\`\`\`sql
\\copy (SELECT * FROM customers ORDER BY customer_id) TO 'C:/sql-practice/customers_export.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')
CREATE TABLE customers_stage (LIKE customers INCLUDING DEFAULTS);
\\copy customers_stage FROM 'C:/sql-practice/customers_export.csv' WITH (FORMAT csv, HEADER true)
SELECT COUNT(*) FROM customers_stage;
\`\`\`
**What to expect:** psql prints \`COPY 12\` after each \`\\copy\`, and the count query returns 12. Open the CSV in Notepad: the first line is the header, then 12 lines. **Common errors:** \`invalid input syntax for type …\` (a text value sits in a number column, so load into an all-text staging table first), \`extra data after last expected column\` (the file has more fields than the table, usually an unquoted comma), \`could not open file … Permission denied\` (you used \`COPY\` instead of \`\\copy\`).` },
    `## Settings: SHOW, SET and where a value comes from
PostgreSQL has hundreds of **settings**. You read them with \`SHOW work_mem\`, \`current_setting('work_mem')\` or the \`pg_settings\` view, and change them at four levels, from narrow to wide:

1. **One transaction**: \`SET LOCAL work_mem = '256MB'\` ends at COMMIT or ROLLBACK.
2. **One session**: \`SET statement_timeout = '45s'\` lasts until the connection closes or \`RESET statement_timeout\`.
3. **One role or database**: \`ALTER ROLE batch_job SET statement_timeout = '30s'\` is applied every time that role **connects**. This is the neat way to give a reporting login a time limit.
4. **The whole server**: \`postgresql.conf\` (or \`ALTER SYSTEM SET …\`), for everybody.

How a change takes effect depends on the setting's **context** in \`pg_settings\`:

| context | who can change it | when it applies |
|---|---|---|
| \`user\` | any user, with SET | at once, in that session |
| \`superuser\` | a superuser, with SET | at once, in that session |
| \`sighup\` | edit the config file | after a **reload** (\`SELECT pg_reload_conf()\`) |
| \`postmaster\` | edit the config file | only after a **restart** of the server |
| \`internal\` | nobody | fixed when the server was built |

The settings you will meet again and again:
- \`work_mem\`: memory for one sort or hash step. A bigger value avoids spilling to disk but is **per step, per query**, so a large value times many queries can exhaust memory.
- \`statement_timeout\`, \`lock_timeout\`, \`idle_in_transaction_session_timeout\`: safety nets that cancel runaway queries, long lock waits and sessions that open a transaction and forget it. Put them on application and reporting roles.
- \`max_connections\` and \`shared_buffers\`: sized once for the server (both need a restart).
- \`search_path\`, \`TimeZone\`, \`DateStyle\`: how names and dates are read and shown. A wrong time zone on a pooled connection shifts every timestamp.`,
    { sql: {
      title: 'Read settings, then SET, SET LOCAL and ALTER ROLE',
      starter: `BEGIN;
CREATE TABLE setting_log (n serial, step text, work_mem text, statement_timeout text);
INSERT INTO setting_log (step, work_mem, statement_timeout) VALUES ('start', current_setting('work_mem'), current_setting('statement_timeout'));

SET LOCAL work_mem = '256MB';              -- this transaction only
SET statement_timeout = '45s';             -- this session
INSERT INTO setting_log (step, work_mem, statement_timeout) VALUES ('inside the transaction', current_setting('work_mem'), current_setting('statement_timeout'));
COMMIT;

INSERT INTO setting_log (step, work_mem, statement_timeout) VALUES ('after COMMIT', current_setting('work_mem'), current_setting('statement_timeout'));
RESET statement_timeout;
INSERT INTO setting_log (step, work_mem, statement_timeout) VALUES ('after RESET', current_setting('work_mem'), current_setting('statement_timeout'));
SELECT step, work_mem, statement_timeout FROM setting_log ORDER BY n;

-- A default for a role: applied when that role connects
CREATE ROLE batch_job LOGIN;
ALTER ROLE batch_job SET statement_timeout = '30s';
ALTER ROLE batch_job SET work_mem = '64MB';
SELECT rolname, array_to_string(rolconfig, ', ') AS role_defaults FROM pg_roles WHERE rolname = 'batch_job';

-- Which settings are easy to change, and which need a restart?
SELECT name, setting, unit, context
FROM pg_settings
WHERE name IN ('work_mem', 'statement_timeout', 'lock_timeout', 'idle_in_transaction_session_timeout',
               'max_connections', 'shared_buffers', 'wal_level')
ORDER BY context, name;`,
      note: 'The log shows work_mem 4MB and statement_timeout 0 (no limit) at the start. Inside the transaction they are 256MB and 45s. After COMMIT work_mem is back to 4MB (SET LOCAL ended) but statement_timeout is still 45s (a session SET survives COMMIT); after RESET it is 0 again. The role defaults are statement_timeout=30s and work_mem=64MB. In the last query max_connections, shared_buffers and wal_level have context postmaster (they need a restart), the other four have context user.',
    } },
    { local: `**Watch a timeout fire** (psql on your laptop; the in-browser database runs in one thread and does not enforce timeouts, so you can set and read them there but not see them cancel anything):
\`\`\`sql
SET statement_timeout = '100ms';
SELECT pg_sleep(2);
\`\`\`
**What to expect:** \`ERROR: canceling statement due to statement timeout\` after about a tenth of a second. Run \`RESET statement_timeout;\` afterwards. The same idea with \`SET lock_timeout = '2s'\` makes a blocked \`UPDATE\` give up with \`canceling statement due to lock timeout\` instead of waiting forever.` },
    `## Why a table with 220 rows keeps growing: MVCC, VACUUM and ANALYZE
In the isolation lesson, readers and writers did not block each other because PostgreSQL keeps **several versions of a row**. The price is here. An \`UPDATE\` does **not** change a row in place. It writes a **new version** and marks the old one as dead, because an older transaction may still need to see it. A \`DELETE\` only marks the row dead. The dead versions stay in the file until they are cleaned.

- **VACUUM** finds dead versions that nobody can see any more and marks their space as **reusable** for new rows. It does not usually make the file smaller. \`VACUUM FULL\` rewrites the whole table into a smaller file, but it **locks the table exclusively**, so it is a maintenance-window tool.
- **autovacuum** is a background process that runs VACUUM (and ANALYZE) for you when enough rows have changed. On most servers you leave it on and tune it, you never switch it off.
- **ANALYZE** collects **statistics** about the data (row counts, common values) that the query planner uses to choose a plan. After a big load the planner is guessing until ANALYZE runs.
- A **long transaction**, or a session left *idle in transaction*, holds an old snapshot and **stops VACUUM** from removing anything newer. That is why the timeouts above matter.`,
    { analogy: 'PostgreSQL writes like someone using a ledger in ink. To change an amount, you strike the old line through and write the new line below. Nothing is erased, so a colleague who started reading earlier still sees the old line. **VACUUM** is the clerk who later marks the struck-out lines as free space, so new entries can go there.' },
    { sketch: { w: 760, h: 300, caption: 'Why an UPDATE grows the table. PostgreSQL writes a new version and keeps the old one until VACUUM clears it.', items: [
      { t: 'text', x: 14, y: 62, text: '1  loaded', size: 16, anchor: 'start', bold: true },
      { t: 'box', x: 150, y: 34, w: 66, h: 46, label: 'A', fill: 'green', size: 17 },
      { t: 'box', x: 226, y: 34, w: 66, h: 46, label: 'B', fill: 'green', size: 17 },
      { t: 'box', x: 302, y: 34, w: 66, h: 46, label: 'C', fill: 'green', size: 17 },
      { t: 'box', x: 378, y: 34, w: 66, h: 46, label: 'D', fill: 'green', size: 17 },
      { t: 'note', x: 608, y: 28, w: 146, h: 56, fill: 'grey', size: 13, text: 'every row has\none version' },
      { t: 'arrow', x1: 330, y1: 84, x2: 330, y2: 122, label: 'UPDATE B and C', lx: 70, ly: 0 },
      { t: 'text', x: 14, y: 152, text: '2  after UPDATE', size: 16, anchor: 'start', bold: true },
      { t: 'box', x: 150, y: 124, w: 66, h: 46, label: 'A', fill: 'green', size: 17 },
      { t: 'box', x: 226, y: 124, w: 66, h: 46, label: 'B old', fill: 'grey', size: 15 },
      { t: 'box', x: 302, y: 124, w: 66, h: 46, label: 'C old', fill: 'grey', size: 15 },
      { t: 'box', x: 378, y: 124, w: 66, h: 46, label: 'D', fill: 'green', size: 17 },
      { t: 'box', x: 454, y: 124, w: 66, h: 46, label: 'B new', fill: 'green', size: 15 },
      { t: 'box', x: 530, y: 124, w: 66, h: 46, label: 'C new', fill: 'green', size: 15 },
      { t: 'note', x: 608, y: 114, w: 146, h: 66, fill: 'pink', size: 13, text: 'old versions stay:\ndead space, and\nthe table grows' },
      { t: 'arrow', x1: 330, y1: 174, x2: 330, y2: 212, label: 'VACUUM', lx: 50, ly: 0 },
      { t: 'text', x: 14, y: 242, text: '3  after VACUUM', size: 16, anchor: 'start', bold: true },
      { t: 'box', x: 150, y: 214, w: 66, h: 46, label: 'A', fill: 'green', size: 17 },
      { t: 'box', x: 226, y: 214, w: 66, h: 46, label: 'free', fill: 'white', size: 15 },
      { t: 'box', x: 302, y: 214, w: 66, h: 46, label: 'free', fill: 'white', size: 15 },
      { t: 'box', x: 378, y: 214, w: 66, h: 46, label: 'D', fill: 'green', size: 17 },
      { t: 'box', x: 454, y: 214, w: 66, h: 46, label: 'B new', fill: 'green', size: 15 },
      { t: 'box', x: 530, y: 214, w: 66, h: 46, label: 'C new', fill: 'green', size: 15 },
      { t: 'note', x: 608, y: 204, w: 146, h: 66, fill: 'yellow', size: 13, text: 'space is reused\nby new rows. The\nfile rarely shrinks' },
    ] } },
    { sql: {
      title: 'Watch a table grow while the row count stays the same',
      starter: `-- Work on a copy of orders, so the practice data stays as it was.
-- (Everything runs as one transaction, so VACUUM could not run here. It can on your laptop.)
BEGIN;
CREATE TABLE orders_copy AS SELECT * FROM orders;
CREATE TABLE bloat_log (n serial, step text, pages bigint, live_rows bigint, order_1_ctid text);

-- pages = file size / 8 kB.  ctid = (page number, slot): where the current version of a row lives
INSERT INTO bloat_log (step, pages, live_rows, order_1_ctid)
  SELECT 'after the copy', pg_relation_size('orders_copy') / 8192, COUNT(*), MAX(ctid::text) FILTER (WHERE order_id = 1) FROM orders_copy;

UPDATE orders_copy SET amount = amount + 1;          -- rewrites every row
INSERT INTO bloat_log (step, pages, live_rows, order_1_ctid)
  SELECT 'after UPDATE 1', pg_relation_size('orders_copy') / 8192, COUNT(*), MAX(ctid::text) FILTER (WHERE order_id = 1) FROM orders_copy;

UPDATE orders_copy SET amount = amount + 1;
INSERT INTO bloat_log (step, pages, live_rows, order_1_ctid)
  SELECT 'after UPDATE 2', pg_relation_size('orders_copy') / 8192, COUNT(*), MAX(ctid::text) FILTER (WHERE order_id = 1) FROM orders_copy;

UPDATE orders_copy SET amount = amount + 1;
INSERT INTO bloat_log (step, pages, live_rows, order_1_ctid)
  SELECT 'after UPDATE 3', pg_relation_size('orders_copy') / 8192, COUNT(*), MAX(ctid::text) FILTER (WHERE order_id = 1) FROM orders_copy;
COMMIT;

SELECT step, pages, live_rows, order_1_ctid FROM bloat_log ORDER BY n;

-- The data did change (each order is 3 rupees higher), but there are still 220 rows
SELECT (SELECT SUM(amount) FROM orders_copy) - (SELECT SUM(amount) FROM orders) AS total_increase,
       (SELECT COUNT(*) FROM orders_copy) AS rows_now;`,
      note: 'The row count never leaves 220, yet the table file grows from 4 pages to 6, 8 and 10 pages, and order 1 moves: its ctid goes from (0,1) to (2,5), (5,9) and (7,13) because every UPDATE writes a new version somewhere else. After the three updates each amount is 3 higher, so the total increase is 660 (3 x 220). Within one transaction nothing can be cleaned, and even afterwards the space is only reclaimed by VACUUM.',
    } },
    { local: `**Do the same on your laptop and clean it up** (psql, \`fde_practice\`):
\`\`\`sql
CREATE TABLE orders_copy AS SELECT * FROM orders;
UPDATE orders_copy SET amount = amount + 1;
UPDATE orders_copy SET amount = amount + 1;
SELECT pg_size_pretty(pg_relation_size('orders_copy')) AS size_before_vacuum;
VACUUM (VERBOSE) orders_copy;
SELECT pg_size_pretty(pg_relation_size('orders_copy')) AS size_after_vacuum;
ANALYZE orders_copy;
\`\`\`
**What to expect:** \`VACUUM VERBOSE\` prints how many dead row versions it removed (those left by the updates). The size after VACUUM is usually about the same as before: the space is free for reuse, not returned to the operating system. In a real server also run \`SELECT relname, n_live_tup, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;\` to see which tables carry the most dead rows. (In the in-browser database those counters stay at 0, so use the size and ctid view above to see the effect.)` },
    `## Watching the server
When somebody says "the database is slow", you look in three places before you touch anything.

1. **Who is doing what: \`pg_stat_activity\`.** One row per connection: user, state, the current query, how long it has been running, and what it waits for. States to notice: \`active\` (running now) and **\`idle in transaction\`** (opened a transaction and stopped, holding locks and blocking VACUUM). \`pg_cancel_backend(pid)\` cancels the running query. \`pg_terminate_backend(pid)\` closes the whole connection. Use both with care.
2. **How big things are: the size functions.** \`pg_total_relation_size\` (table plus indexes plus TOAST), \`pg_relation_size\`, \`pg_database_size\`, and \`pg_size_pretty\` to print them for humans.
3. **What is expensive: slow-query tools.** \`log_min_duration_statement = '500ms'\` writes every statement slower than that to the server log. The \`pg_stat_statements\` extension adds a table of the queries that used the most total time. Then \`EXPLAIN\` shows why one query is slow, which is the next part of the SQL programme.

Here is a query that is worth saving. It lists what is running now and for how long, oldest transaction first (run it on a real server):
\`\`\`sql
SELECT pid, usename, state, now() - xact_start AS transaction_age,
       wait_event_type, left(query, 60) AS query
FROM pg_stat_activity
WHERE state <> 'idle' AND pid <> pg_backend_pid()
ORDER BY transaction_age DESC NULLS LAST;
\`\`\``,
    { sql: {
      title: 'Sizes, planner statistics, sessions and extensions',
      starter: `-- 1) The five biggest tables (data + indexes)
SELECT c.relname AS table_name,
       pg_total_relation_size(c.oid)  AS bytes,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY bytes DESC, table_name
LIMIT 5;

-- 2) Planner statistics. reltuples = -1 means "never analysed"
ANALYZE customers;
ANALYZE orders;
SELECT relname, reltuples::int AS estimated_rows
FROM pg_class
WHERE relname IN ('customers', 'orders', 'fact_gl') AND relkind = 'r'
ORDER BY relname;

-- 3) Sessions. Here you are alone; a real server has one row per connection
SELECT COUNT(*) AS sessions_here, COUNT(*) FILTER (WHERE pid = pg_backend_pid()) AS that_is_me
FROM pg_stat_activity;

-- 4) Which extensions can this server load?
SELECT name, default_version, installed_version FROM pg_available_extensions ORDER BY name;`,
      note: 'The biggest tables are fact_gl (184 kB), orders (72 kB) and fact_budget (56 kB), then dim_account and dim_bu (48 kB each). After ANALYZE the estimates are 12 for customers and 220 for orders, while fact_gl still shows -1 because it was never analysed. You are the only session (1 and 1). Only plpgsql is available in the browser; on a real server the list is long and includes pg_stat_statements, pg_trgm (fuzzy text matching) and pgcrypto, and you load one with CREATE EXTENSION.',
    } },
    `## Connections and pooling
Every PostgreSQL connection is served by its **own server process**, with its own memory. That is why \`max_connections\` is a modest number (100 here) and why *"too many clients already"* is a classic outage. A web application with 200 workers that each hold a connection overwhelms a database that only needs about 20 to do all the work, because most connections are idle most of the time.

A **connection pooler** sits between the application and the database and lends server connections out. Many client connections share a few server connections. **PgBouncer** is the usual stand-alone pooler. Most drivers and ORMs also have a built-in pool (SQLAlchemy and psycopg do), which is the first thing to configure.

Pools have modes. In **session** mode a client keeps a server connection until it disconnects. In **transaction** mode it keeps one only for the length of one transaction, which is how you serve hundreds of clients with a handful of connections. Transaction mode has a rule you already know from the security lesson: anything stored on the session, a plain \`SET\`, a session advisory lock, a temporary table, may be seen by the **next client** that gets the same server connection. Use \`SET LOCAL\` and \`set_config(…, true)\`, which die with the transaction.`,
    { sketch: { w: 760, h: 296, caption: 'A pooler lets hundreds of client connections share a few server connections. In transaction mode a connection is lent for one transaction only.', items: [
      { t: 'box', x: 20, y: 20, w: 130, h: 46, label: 'worker 1', fill: 'grey', size: 15 },
      { t: 'box', x: 20, y: 80, w: 130, h: 46, label: 'worker 2', fill: 'grey', size: 15 },
      { t: 'box', x: 20, y: 140, w: 130, h: 46, label: 'worker 3', fill: 'grey', size: 15 },
      { t: 'box', x: 20, y: 200, w: 130, h: 46, label: '... worker 200', fill: 'grey', size: 15 },
      { t: 'arrow', x1: 152, y1: 43, x2: 302, y2: 80 },
      { t: 'arrow', x1: 152, y1: 103, x2: 302, y2: 105 },
      { t: 'arrow', x1: 152, y1: 163, x2: 302, y2: 145 },
      { t: 'arrow', x1: 152, y1: 223, x2: 302, y2: 170 },
      { t: 'box', x: 304, y: 50, w: 190, h: 150, label: 'Connection pooler', sub: 'PgBouncer / driver pool', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 496, y1: 100, x2: 586, y2: 100 },
      { t: 'arrow', x1: 496, y1: 125, x2: 586, y2: 125 },
      { t: 'arrow', x1: 496, y1: 150, x2: 586, y2: 150 },
      { t: 'db', x: 588, y: 70, w: 150, h: 120, label: 'PostgreSQL', fill: 'blue' },
      { t: 'text', x: 85, y: 270, text: '200 client connections', size: 14, anchor: 'middle' },
      { t: 'text', x: 662, y: 214, text: 'about 20 server connections', size: 14, anchor: 'middle' },
      { t: 'note', x: 304, y: 222, w: 270, h: 64, fill: 'yellow', size: 13, text: 'Transaction mode lends a server\nconnection for one transaction. Use\nSET LOCAL or set_config(..., true).' },
    ] } },
    `## Versions, extensions and migrations
Two last habits for a system that other people depend on.

- **Versions.** A *minor* upgrade (for example 18.2 to 18.3) is bug and security fixes: install and restart. A *major* upgrade (17 to 18) changes the on-disk format, so you use \`pg_upgrade\` or a dump and restore, and you test your own queries first. Managed cloud services schedule both for you. You still choose the window and run the tests.
- **Extensions** add features: \`pg_trgm\` (fuzzy matching, like the FuzzyMatch widget), \`pgcrypto\`, \`pg_stat_statements\`, \`PostGIS\`. \`CREATE EXTENSION name;\` installs one into a database, and it is part of the dump.
- **Migrations.** Never change production structure by hand in a GUI. Write the change as a **versioned script** (\`V12__add_gstin_to_customers.sql\`), keep it in Git next to the application, and let a tool such as Flyway, Liquibase or Alembic apply each script exactly once, in order. Then the test, staging and production databases cannot drift apart, and a restore plus the newer scripts rebuilds any state.`,
    `## Practice
All three are single \`SELECT\` statements: the catalog, CSV formatting, and the row-count manifest that proves a restore.`,
    { challenge: {
      id: 'sql-ops-backup-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Which timeout settings can **every user** change in their own session? From `pg_settings` return `name, setting, unit` for the settings whose name contains `timeout` and whose `context` is `user`, sorted by `name`. (7 rows. A value of 0 means "no limit".)',
      hint: "pg_settings WHERE name ILIKE '%timeout%' AND context = 'user' ORDER BY name.",
      solution: `SELECT name, setting, unit
FROM pg_settings
WHERE name ILIKE '%timeout%' AND context = 'user'
ORDER BY name`,
    } },
    { challenge: {
      id: 'sql-ops-backup-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Write the four CSV lines that `COPY … WITH (FORMAT csv)` would produce for the rows in the starter (no header line): one column `line`, sorted by `id`. Rules: a NULL is an empty field; a text field is wrapped in double quotes when it contains a comma, a double quote or a line break, **or is an empty string**; double quotes inside are doubled. (4 rows, for example row 2 is `2,"Sharma, Gupta & Co",8000.00,Delhi`.)',
      starter: `WITH rows(id, name, amount, city) AS (
  VALUES (1, 'Apex Retail',        12500.50, 'Mumbai'),
         (2, 'Sharma, Gupta & Co',  8000.00, 'Delhi'),
         (3, 'The "Big" Store',     NULL::numeric, 'Pune'),
         (4, '',                     150.00,  NULL::text)
)
SELECT id::text AS line      -- replace with the real CSV line
FROM rows
ORDER BY id`,
      hint: "First compute the quoted name and city in a second CTE with CASE (NULL gives an empty string, an empty value or one matching '[,\"\\n]' gets quotes with replace(v, '\"', '\"\"')). Then join the pieces with || and COALESCE(amount::text, '').",
      solution: `WITH rows(id, name, amount, city) AS (
  VALUES (1, 'Apex Retail',        12500.50, 'Mumbai'),
         (2, 'Sharma, Gupta & Co',  8000.00, 'Delhi'),
         (3, 'The "Big" Store',     NULL::numeric, 'Pune'),
         (4, '',                     150.00,  NULL::text)
),
q AS (
  SELECT id, amount,
         CASE WHEN name IS NULL THEN ''
              WHEN name = '' OR name ~ '[,"\\n\\r]' THEN '"' || replace(name, '"', '""') || '"'
              ELSE name END AS name_f,
         CASE WHEN city IS NULL THEN ''
              WHEN city = '' OR city ~ '[,"\\n\\r]' THEN '"' || replace(city, '"', '""') || '"'
              ELSE city END AS city_f
  FROM rows
)
SELECT id::text || ',' || name_f || ',' || COALESCE(amount::text, '') || ',' || city_f AS line
FROM q
ORDER BY id`,
    } },
    { challenge: {
      id: 'sql-ops-backup-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'After a restore you must **prove** that nothing is missing. Write the **row-count manifest**: for every base table in the `public` schema return `table_name, row_count`, sorted by `table_name`. Do not hard-code the table names: read them from `information_schema.tables` and count each table dynamically. (13 rows; `fact_gl` has 1,227 and `orders` 220.)',
      hint: "query_to_xml(format('SELECT COUNT(*) AS c FROM %I.%I', table_schema, table_name), false, true, '') runs a query given as text and returns the result as XML. Read the number with (xpath('/row/c/text()', that_xml))[1]::text::int.",
      solution: `SELECT t.table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT COUNT(*) AS c FROM %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name`,
    } },
    { real: 'A sound backup routine for a finance database is boring and written down: a **nightly logical dump** (so one table can be rescued quickly), **continuous WAL archiving** (so the database can be rewound to a minute), a stated **RPO and RTO** that the business has agreed to, retention that follows what your auditors and policies require, **encrypted and access-controlled** copies (they contain PAN and bank numbers), and a **restore drill every quarter** into a scratch database, finished by the row-count manifest compared with production. The drill is what turns "we have backups" into "we can recover".' },
    { interview: '"At 14:05 someone ran a DELETE on production orders without a WHERE clause. It has committed. What do you do?" Model answer: "First stop the damage: ask the team to stop writes to that table, or revoke the role, and note the exact time. If the delete was inside an open transaction I would roll it back, but it has committed, so I recover. With WAL archiving I do a point-in-time recovery to 14:04:59 on a **separate** server, extract the lost rows there, and insert them back into production. I do not rewind the whole production database, because that would lose everything written since. If there is no WAL archive, I restore the last dump into a scratch database and re-insert the rows from it, then reconcile what changed in between from the audit trigger table. Afterwards I find out why a statement without a WHERE could run: safer roles, a required review, and running manual changes in a transaction that I check before COMMIT." Follow-up: "Why is a replica not enough?" (it replays the DELETE too).' },
    `## Recap
- **Logical backup** (\`pg_dump\`, restore with \`psql\` or \`pg_restore\`): consistent snapshot of one database, portable across versions, can restore a single table, needs \`pg_dumpall --globals-only\` for roles. **Physical backup** (base backup + archived WAL): restores to **any chosen minute** (PITR) but only to the same major version. A **replica is not a backup**. Know **RPO** and **RTO**, and **restore-test** every backup.
- **COPY** is the bulk loader. \`COPY\` runs on the server and needs rights, \`\\copy\` runs on your machine. CSV rules: quote fields that contain a comma, a quote or a line break, double inner quotes, **NULL is empty and an empty string is \`""\`**, write UTF-8, and load into a **staging table** first.
- **Settings**: \`SHOW\`, \`current_setting\`, \`pg_settings\`. Change them per transaction (\`SET LOCAL\`), session (\`SET\`), role or database (\`ALTER ROLE … SET\`), or server (config file). The \`context\` says whether a restart (\`postmaster\`), a reload (\`sighup\`) or nothing (\`user\`) is needed. Put \`statement_timeout\`, \`lock_timeout\` and \`idle_in_transaction_session_timeout\` on application roles.
- **MVCC** means an UPDATE writes a new row version and the old one stays as dead space (220 rows grew from 4 pages to 10). **VACUUM** makes dead space reusable, **autovacuum** does it in the background, **ANALYZE** refreshes planner statistics, and long or idle-in-transaction sessions block cleanup.
- **Monitoring**: \`pg_stat_activity\` (who and what), the size functions (how big), \`pg_stat_user_tables\` (dead rows) and slow-query tools (\`log_min_duration_statement\`, \`pg_stat_statements\`, then \`EXPLAIN\`).
- **Pooling**: each connection is a server process, so use a pooler or driver pool; in transaction mode use \`SET LOCAL\` and \`set_config(…, true)\`. Keep changes in **versioned migration scripts**.`,
  ],
  quiz: [
    { q: 'At 14:05 a DELETE without WHERE has committed. You want the database as it was at 14:04. Which backup setup makes that possible?', o: ['A nightly pg_dump file only', 'A base backup plus continuously archived WAL (point-in-time recovery)', 'A streaming replica of the production server', 'A weekly CSV export of every table'], a: 1, why: 'A base backup plus the WAL lets you replay changes up to a chosen moment. A nightly dump only returns to last night, and a replica replays the DELETE as well.' },
    { q: 'What is the difference between COPY and the psql command \\copy?', o: ['They are identical, only the spelling differs', '\\copy is faster because it skips the network', 'COPY always writes SQL and \\copy always writes CSV', 'COPY reads or writes a file on the server machine and needs special rights, while \\copy uses a file on your own computer and needs none'], a: 3, why: 'COPY runs inside the server, so its paths are server paths and it is restricted. \\copy streams the data through psql from or to your machine, which is what you want from a laptop or against a managed database.' },
    { q: 'A 220-row table keeps getting bigger on disk although no rows are added, only updated. Why?', o: ['Each UPDATE writes a new row version, and the old versions stay as dead space until VACUUM makes it reusable', 'The updates duplicate the rows', 'ANALYZE adds padding to every page', 'The column types change after an update'], a: 0, why: 'PostgreSQL never edits a row in place (MVCC). The old version is kept for transactions that may still need it, and VACUUM, usually run by autovacuum, later frees that space for reuse.' },
    { q: 'Why put a connection pooler such as PgBouncer in front of PostgreSQL?', o: ['It encrypts every query', 'It caches query results so queries run faster', 'It lets hundreds of application connections share a small number of server connections, because each PostgreSQL connection is a server process with its own memory', 'It replaces the need for backups'], a: 2, why: 'Idle connections still cost memory and count against max_connections. A pooler lends a few real connections to many clients.' },
    { q: 'In pg_settings, max_connections has context postmaster. What does that mean?', o: ['Any user can change it with SET', 'It changes at once for everyone after ALTER ROLE', 'It is read-only and can never be changed', 'It is set in the server configuration and only takes effect after a server restart'], a: 3, why: 'Context says when a change applies: user (immediately in the session), sighup (after a reload), postmaster (after a restart), internal (never).' },
    { q: 'You write a CSV field by joining values with commas, and one customer is called Sharma, Gupta & Co. What goes wrong?', o: ['The loader adds the quote marks itself', 'The comma is read as a separator, so the row has one field too many. A field with a comma, a quote or a line break must be wrapped in quotes, and inner quotes doubled', 'Nothing, commas inside values are always fine', 'The file is rejected because of the ampersand'], a: 1, why: 'CSV has no other way to tell a separator from text. Quoting the field (and doubling any quote inside it) keeps the meaning. A proper writer such as COPY does this for you.' },
  ],
  task: {
    title: 'Back up, restore, prove it, and watch the server',
    steps: [
      'Create `27_ops_backup.sql` in `C:\\sql-practice`. Take a custom-format dump of `fde_practice` with `pg_dump -Fc` and list its contents with `pg_restore -l`. Note the file size.',
      'Create the database `fde_restore`, restore the dump into it, then run the row-count manifest query (challenge 3) in **both** databases. The two results must be identical (13 tables, `fact_gl` 1,227). Paste both in comments.',
      'Simulate the accident: in `fde_restore` run `DROP TABLE orders CASCADE;`, then rescue only that table with `pg_restore -t orders`, and show the count is 220 again.',
      'Do the CSV round trip with `\\copy` (export customers, load into an all-text `customers_stage`, check `COUNT(*)`). Then add one customer whose name contains a comma and a quote, export again, open the file in Notepad and confirm the quoting.',
      'Run `SET statement_timeout = \'100ms\'; SELECT pg_sleep(2);` and write down the exact error. Then use `ALTER ROLE … SET statement_timeout` for a new login and confirm it with `pg_roles.rolconfig`.',
      'Open two DBeaver connections. In the first run `BEGIN; UPDATE customers SET city = city WHERE customer_id = 1;` and leave it open. In the second run the `pg_stat_activity` query from the lesson, find the **idle in transaction** session and close it with `pg_terminate_backend`.',
      'Repeat the bloat experiment on a copy of `orders`: three `UPDATE` statements, check `pg_relation_size`, run `VACUUM (VERBOSE)`, and check again. Write one sentence explaining what changed and what did not.',
    ],
    deliverable: '`27_ops_backup.sql` with the commands you ran, the two identical row-count manifests, the timeout error text, the `idle in transaction` finding, and the before/after sizes of the bloat experiment, each with a one-line comment.',
  },
};
