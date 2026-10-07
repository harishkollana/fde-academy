// Hidden setup data for the playgrounds.
const JOBS = `CREATE TABLE jobs (job_id int PRIMARY KEY, file_name text NOT NULL,
                   status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done')),
                   claimed_by text, claimed_at timestamp);
INSERT INTO jobs (job_id, file_name) VALUES
  (1, 'payroll_aug.csv'), (2, 'payroll_sep.csv'), (3, 'gl_aug.csv'),
  (4, 'vendors.csv'), (5, 'gl_sep.csv'), (6, 'budget.csv');`;
const BANK = `CREATE TABLE bank_accounts (acct text PRIMARY KEY, balance numeric(12,2) NOT NULL CHECK (balance >= 0));
INSERT INTO bank_accounts VALUES ('OPS', 100000.00), ('PAYROLL', 50000.00), ('TAX', 20000.00);`;

export default {
  id: 'sql-locks-deadlocks',
  title: 'Locks and deadlocks: why queries wait, and how to stop it hurting',
  goal: 'You can explain row and table locks and why a query waits, claim work safely with FOR UPDATE SKIP LOCKED, use advisory locks, recognise and avoid deadlocks, find who is blocking whom, and set timeouts so that waiting never becomes an outage.',
  roadmap: [
    'Row locks, SELECT ... FOR UPDATE',
    'SKIP LOCKED job queues',
    'Advisory locks',
    'Deadlocks and how to avoid them',
  ],
  blocks: [
    `## The problem
Three tickets land in your queue in the same week, and they are all about **waiting**.

1. Your validation service runs five **workers**. Each one picks "the next queued payroll file" from a \`jobs\` table. Two of them picked the **same** file, and the payroll was validated twice.
2. Two month-end scripts update the same accounts. Every few days one of them dies with *deadlock detected*.
3. Someone added a column to a busy table. The change itself takes a millisecond, but for 40 seconds **every query on that table hung**, and the application looked dead.

All three are about **locks**. The previous lesson showed that PostgreSQL's MVCC lets readers and writers work without waiting for each other. But two writers on the **same row** must wait, and some commands need the **whole table** to themselves. Locks are the mechanism that makes this waiting safe. They are also behind most "why is my query stuck?" tickets, so this is a lesson worth knowing well.`,
    `## Row locks: automatic, and until the end of the transaction
When a transaction runs \`UPDATE\` or \`DELETE\` on a row, PostgreSQL puts a **row lock** on it. A second transaction that wants to change the **same row** has to **wait**. The lock is released only when the first transaction **ends**, with \`COMMIT\` or \`ROLLBACK\`, never earlier. Remember what the simulator showed: T2 stood still until T1 committed.

Three facts keep you out of trouble:
- **Plain \`SELECT\` takes no row locks.** Reading never blocks writing and writing never blocks reading (MVCC). Only writers wait for writers.
- **The wait lasts as long as the other transaction.** A transaction that stays open (a script paused at a prompt, an application waiting for a user) makes everyone who touches its rows wait with it.
- **Locks on different rows do not interfere.** Updating OPS never waits for someone who is updating PAYROLL.

### SELECT … FOR UPDATE: lock before you decide
Sometimes you must **read a row and then decide** what to write, and you do not want anyone to change it in between. \`SELECT … FOR UPDATE\` reads the rows **and locks them** as if you had updated them. Another transaction that tries to update or lock them waits until you finish. This is the standard cure for the lost update from the last lesson, when the new value cannot be computed in one \`UPDATE\`:

\`\`\`sql
BEGIN;
SELECT balance FROM bank_accounts WHERE acct = 'OPS' FOR UPDATE;   -- others wait here
-- the program decides, calculates ...
UPDATE bank_accounts SET balance = 123456 WHERE acct = 'OPS';
COMMIT;
\`\`\`
There are lighter variants, \`FOR NO KEY UPDATE\`, \`FOR SHARE\` and \`FOR KEY SHARE\` (the last one is what foreign-key checks use), but \`FOR UPDATE\` is the one you will write. Two modifiers change what happens when a row is already locked:

| Modifier | When the row is locked by someone else |
|---|---|
| (none) | **wait** until the lock is released |
| \`NOWAIT\` | **fail at once** with *could not obtain lock on row in relation* |
| \`SKIP LOCKED\` | **skip** that row and carry on with the next one |

Lock only the rows you need, hold the lock for as short a time as possible, and keep the transaction free of slow work.

## SKIP LOCKED: a safe work queue
Back to ticket 1. A naive worker does \`SELECT … WHERE status = 'queued' LIMIT 1\` and then updates the row. Two workers can read **the same** row before either one updates it. The fix is to claim the row **while selecting it**, and to let other workers **skip** rows that are already claimed:

\`\`\`sql
UPDATE jobs
SET status = 'running', claimed_by = 'worker-1', claimed_at = TIMESTAMP '2026-09-04 10:00:00'
WHERE job_id = (SELECT job_id
                FROM jobs
                WHERE status = 'queued'
                ORDER BY job_id
                FOR UPDATE SKIP LOCKED
                LIMIT 1)
RETURNING job_id, file_name;
\`\`\`
Each worker's subquery takes the first queued row that **nobody else is locking right now**. Two workers running at the same instant get two **different** jobs. Nobody waits and nobody double-claims. \`RETURNING\` hands the claimed job straight back to the worker. (In a real system \`claimed_at\` would be \`now()\`. The demos use a fixed time so that every run gives the same result.)`,
    { sketch: { w: 760, h: 300, caption: 'Three workers run the claim query at the same moment. SKIP LOCKED makes each of them take the first row that is not already locked.', items: [
      { t: 'table', x: 20, y: 50, title: 'jobs', cols: ['job', 'status', 'locked by'], colW: [60, 100, 110], rows: [['1', 'running', 'worker A'], ['2', 'running', 'worker B'], ['3', 'running', 'worker C'], ['4', 'queued', ''], ['5', 'queued', ''], ['6', 'queued', '']], hl: [0, 1, 2] },
      { t: 'box', x: 400, y: 50, w: 340, h: 54, label: 'worker A', sub: 'first queued row, not locked: job 1', fill: 'blue', size: 17 },
      { t: 'box', x: 400, y: 120, w: 340, h: 54, label: 'worker B', sub: 'job 1 is locked: SKIP it, take job 2', fill: 'green', size: 17 },
      { t: 'box', x: 400, y: 190, w: 340, h: 54, label: 'worker C', sub: 'jobs 1 and 2 locked: SKIP, take job 3', fill: 'orange', size: 17 },
      { t: 'arrow', x1: 398, y1: 77, x2: 294, y2: 92 },
      { t: 'arrow', x1: 398, y1: 147, x2: 294, y2: 120 },
      { t: 'arrow', x1: 398, y1: 217, x2: 294, y2: 148 },
      { t: 'note', x: 20, y: 252, w: 720, h: 40, fill: 'yellow', size: 15, text: 'No waiting and no double claim. Jobs 4, 5 and 6 stay queued for the next workers.' },
    ] } },
    { sql: {
      title: 'Claiming jobs, finishing them, and rescuing a stuck one',
      setup: JOBS,
      starter: `-- Three workers claim a job each (in real life they run at the same moment)
UPDATE jobs SET status = 'running', claimed_by = 'worker-1', claimed_at = TIMESTAMP '2026-09-04 10:00:00'
WHERE job_id = (SELECT job_id FROM jobs WHERE status = 'queued' ORDER BY job_id FOR UPDATE SKIP LOCKED LIMIT 1)
RETURNING job_id, file_name, claimed_by;

UPDATE jobs SET status = 'running', claimed_by = 'worker-2', claimed_at = TIMESTAMP '2026-09-04 10:05:00'
WHERE job_id = (SELECT job_id FROM jobs WHERE status = 'queued' ORDER BY job_id FOR UPDATE SKIP LOCKED LIMIT 1)
RETURNING job_id, file_name, claimed_by;

UPDATE jobs SET status = 'running', claimed_by = 'worker-3', claimed_at = TIMESTAMP '2026-09-04 10:20:00'
WHERE job_id = (SELECT job_id FROM jobs WHERE status = 'queued' ORDER BY job_id FOR UPDATE SKIP LOCKED LIMIT 1)
RETURNING job_id, file_name, claimed_by;

-- Worker 2 finishes; worker 1 crashed after claiming and never reported back
UPDATE jobs SET status = 'done' WHERE job_id = 2;

-- The reaper at 10:30: which running jobs have been running for more than 15 minutes?
SELECT job_id, claimed_by,
       ROUND(EXTRACT(EPOCH FROM (TIMESTAMP '2026-09-04 10:30:00' - claimed_at)) / 60) AS minutes_running
FROM jobs
WHERE status = 'running'
  AND claimed_at < TIMESTAMP '2026-09-04 10:30:00' - INTERVAL '15 minutes'
ORDER BY job_id;

-- Put the stuck job back in the queue
UPDATE jobs SET status = 'queued', claimed_by = NULL, claimed_at = NULL
WHERE status = 'running'
  AND claimed_at < TIMESTAMP '2026-09-04 10:30:00' - INTERVAL '15 minutes'
RETURNING job_id;

SELECT status, COUNT(*) AS jobs FROM jobs GROUP BY status ORDER BY status;`,
      note: 'The three claims return jobs 1, 2 and 3: each claim skips the rows that are already running. The reaper finds only job 1 (30 minutes). Job 3 has run for 10 minutes and job 2 is done. After the rescue the queue holds 4 queued jobs (1 and 4, 5, 6), 1 running job (3) and 1 done job (2).',
    } },
    { warn: 'A queue built with `SKIP LOCKED` needs a plan for **crashed workers**. If the claim is committed (as here) and the worker then dies, the job stays `running` forever. Always store **when** and **by whom** it was claimed, and run a reaper that returns jobs that have been running for too long to the queue. The other design is to do the whole job **inside** the claiming transaction. Then a crash rolls everything back, but you hold the row lock and a transaction open for the whole job, so it only suits short jobs.' },
    `## Table locks, and the queue that takes your app down
Every statement also takes a **table-level lock**, in a mode that matches what it does. The ones to know:

| Lock mode | Taken by | Conflicts with |
|---|---|---|
| \`ACCESS SHARE\` | plain \`SELECT\` | only \`ACCESS EXCLUSIVE\` |
| \`ROW SHARE\` | \`SELECT … FOR UPDATE\` | \`EXCLUSIVE\` and \`ACCESS EXCLUSIVE\` |
| \`ROW EXCLUSIVE\` | \`INSERT\`, \`UPDATE\`, \`DELETE\` | \`SHARE\` and stronger (so writers do not block each other) |
| \`SHARE\` | \`CREATE INDEX\` (the normal kind) | every writer, so inserts and updates wait |
| \`ACCESS EXCLUSIVE\` | \`ALTER TABLE\` (most forms), \`DROP\`, \`TRUNCATE\`, \`VACUUM FULL\` | **everything, including a plain SELECT** |

You do not normally think about these, because \`SELECT\`, \`INSERT\` and \`UPDATE\` never conflict with one another. The danger is the **strongest** lock. A command that needs \`ACCESS EXCLUSIVE\` must wait until **every** transaction that has touched the table has finished, even a harmless report that has been running for ten minutes. And here is the trap: **while that \`ALTER TABLE\` waits, every new query on the table queues up behind it**, because the lock queue is first come, first served and the newcomers would conflict with the waiting \`ALTER\`. One waiting DDL statement stops the whole table.`,
    { sketch: { w: 760, h: 285, caption: 'Why one waiting ALTER TABLE can freeze an application. New queries cannot jump the queue, so they all wait behind it.', items: [
      { t: 'text', x: 20, y: 24, text: 'time passes to the right', size: 14, anchor: 'start', color: '#718096' },
      { t: 'box', x: 20, y: 40, w: 460, h: 40, label: 'long report query (holds an ACCESS SHARE lock)', fill: 'green', size: 15 },
      { t: 'box', x: 120, y: 94, w: 360, h: 40, label: 'ALTER TABLE waits for ACCESS EXCLUSIVE', fill: 'pink', size: 15 },
      { t: 'box', x: 482, y: 94, w: 70, h: 40, label: 'runs', fill: 'orange', size: 14 },
      { t: 'text', x: 518, y: 148, text: 'for 1 ms', size: 13, color: '#718096' },
      { t: 'box', x: 200, y: 148, w: 280, h: 36, label: 'new query 1 waits behind the ALTER', fill: 'grey', size: 14 },
      { t: 'box', x: 260, y: 194, w: 220, h: 36, label: 'new query 2 waits', fill: 'grey', size: 14 },
      { t: 'box', x: 320, y: 240, w: 160, h: 36, label: 'new query 3 waits', fill: 'grey', size: 14 },
      { t: 'arrow', x1: 560, y1: 114, x2: 740, y2: 114, color: '#2f9e44', label: 'everything continues', lx: 0, ly: -12 },
      { t: 'note', x: 560, y: 150, w: 185, h: 110, fill: 'yellow', size: 14, text: 'A one-millisecond\nschema change became\nan outage. SET\nlock_timeout lets the\nALTER give up instead.' },
    ] } },
    `The protection is a **timeout**. Before any schema change on a busy table, run \`SET lock_timeout = '2s';\`. If the lock cannot be taken within two seconds, the statement fails with *canceling statement due to lock timeout*, the queue behind it clears, and you try again at a quieter moment. Three timeouts are worth setting for a service:

| Setting | What it stops |
|---|---|
| \`lock_timeout\` | a statement that waits too long **for a lock** |
| \`statement_timeout\` | a statement that **runs** too long |
| \`idle_in_transaction_session_timeout\` | a session that opened a transaction and then went quiet, holding its locks |

## Advisory locks: locks you define yourself
Sometimes the thing you must protect is not a row. It is a **job**: "only one copy of the nightly vendor load may run at a time". An **advisory lock** is a lock on a **number that you choose**. The database enforces it, but gives it no meaning of its own.

- \`pg_try_advisory_lock(7001)\` returns \`true\` if you got it and \`false\` at once if someone else holds it. \`pg_advisory_lock(7001)\` waits instead. \`pg_advisory_unlock(7001)\` releases it.
- The \`xact\` variants (\`pg_try_advisory_xact_lock\`) are released automatically at the **end of the transaction**, which is the safer choice. The plain versions last until you unlock them or the session ends, which is risky behind a **connection pool**, where the "session" lives on after your job is finished.

The job starts with \`SELECT pg_try_advisory_lock(7001)\`. If it returns \`false\`, another copy is running, so this one exits quietly. Use one agreed number per job, and write the numbers down in one place.`,
    { sql: {
      title: 'Ordered locking, lock modes and advisory locks',
      setup: BANK,
      starter: `-- Lock BOTH accounts first, always in alphabetical order, then update (the deadlock-safe way)
BEGIN;
SELECT acct, balance
FROM bank_accounts
WHERE acct IN ('PAYROLL', 'OPS')
ORDER BY acct
FOR UPDATE;

UPDATE bank_accounts SET balance = balance - 10000 WHERE acct = 'OPS';
UPDATE bank_accounts SET balance = balance + 10000 WHERE acct = 'PAYROLL';

-- Which table-level locks does this transaction hold right now?
SELECT c.relname, l.mode, l.granted
FROM pg_locks l
JOIN pg_class c ON c.oid = l.relation
WHERE c.relname = 'bank_accounts' AND l.pid = pg_backend_pid()
ORDER BY l.mode;
COMMIT;

-- The strongest lock: nothing else could even SELECT from this table while we hold it
BEGIN;
LOCK TABLE bank_accounts IN ACCESS EXCLUSIVE MODE;
SELECT c.relname, l.mode, l.granted
FROM pg_locks l
JOIN pg_class c ON c.oid = l.relation
WHERE c.relname = 'bank_accounts' AND l.pid = pg_backend_pid();
ROLLBACK;

-- An advisory lock on a number we chose (7001 = "nightly vendor load")
BEGIN;
SELECT pg_try_advisory_xact_lock(7001) AS got_the_lock,
       pg_try_advisory_xact_lock(7001) AS same_session_again;
SELECT locktype, mode, granted, objid
FROM pg_locks
WHERE locktype = 'advisory' AND pid = pg_backend_pid();
COMMIT;

-- Safety timeouts for a session
SET lock_timeout = '2s';
SET statement_timeout = '30s';
SET idle_in_transaction_session_timeout = '60s';
SELECT name, setting, unit
FROM pg_settings
WHERE name IN ('lock_timeout', 'statement_timeout', 'idle_in_transaction_session_timeout', 'deadlock_timeout')
ORDER BY name;

-- The balances after the committed transfer
SELECT acct, balance FROM bank_accounts ORDER BY acct;`,
      note: 'The first lock list shows RowShareLock (from FOR UPDATE) and RowExclusiveLock (from UPDATE), two table-level modes. The row locks themselves are not listed, because PostgreSQL stores them in the row. The LOCK TABLE shows a single AccessExclusiveLock. The advisory lock query returns true twice, because the same session may take its own lock again, and it appears with the objid 7001. The deadlock_timeout is 1000 ms, which is how long PostgreSQL waits before it looks for a deadlock. The last query shows the balances after the transfer: OPS 90,000, PAYROLL 60,000 and TAX 20,000.',
    } },
    `## Deadlocks: waiting in a circle
A **deadlock** is a circle of waiting. T1 holds row A and wants row B. T2 holds row B and wants row A. Neither can ever continue, because each is waiting for the other to finish first. Waiting longer does not help.`,
    { sketch: { w: 760, h: 262, caption: 'A deadlock: each transaction holds one row and waits for the row the other one holds.', items: [
      { t: 'box', x: 300, y: 18, w: 160, h: 50, label: 'row OPS', fill: 'yellow', size: 18 },
      { t: 'box', x: 300, y: 192, w: 160, h: 50, label: 'row PAYROLL', fill: 'yellow', size: 18 },
      { t: 'box', x: 14, y: 100, w: 196, h: 60, label: 'T1', sub: 'transfer OPS to PAYROLL', fill: 'blue', size: 20 },
      { t: 'box', x: 550, y: 100, w: 196, h: 60, label: 'T2', sub: 'transfer PAYROLL to OPS', fill: 'orange', size: 20 },
      { t: 'arrow', x1: 212, y1: 112, x2: 298, y2: 58, color: '#2f9e44', label: 'holds', lx: -20, ly: -8 },
      { t: 'arrow', x1: 212, y1: 150, x2: 298, y2: 208, color: '#e03131', dashed: true, label: 'wants', lx: -22, ly: 10 },
      { t: 'arrow', x1: 548, y1: 150, x2: 462, y2: 208, color: '#2f9e44', label: 'holds', lx: 22, ly: 10 },
      { t: 'arrow', x1: 548, y1: 112, x2: 462, y2: 58, color: '#e03131', dashed: true, label: 'wants', lx: 22, ly: -8 },
      { t: 'text', x: 380, y: 135, text: 'a circle:', size: 17, color: '#e03131', bold: true },
      { t: 'text', x: 380, y: 158, text: 'nobody can move', size: 15, color: '#e03131' },
    ] } },
    `PostgreSQL notices. After a transaction has waited for \`deadlock_timeout\` (one second by default) it looks for a circle, and if it finds one it **cancels one of the transactions** with:

\`\`\`text
ERROR:  deadlock detected
\`\`\`
followed by a DETAIL that names the two processes. The error code is **\`40P01\`**, the same one you saw in the retry loop of the last lesson. The other transaction is then free to continue. You cannot choose which one is cancelled. The simulator below has the scenario: choose **Deadlock** and step through it (any isolation level gives the same result, because a deadlock has nothing to do with what you can see, only with who holds which lock).`,
    { widget: 'IsolationLevels' },
    `### How to avoid deadlocks
1. **Always lock rows in the same order.** This one rule prevents almost every deadlock. If every transfer first locks its two accounts **in alphabetical order** (\`ORDER BY acct FOR UPDATE\`, as in the playground above), a circle can never form. T1 and T2 both ask for OPS first, so the second one simply waits for the first.
2. **Lock early, all at once.** Take every lock you will need at the start of the transaction, instead of discovering them one by one.
3. **Keep transactions short.** The less time you hold locks, the smaller the window for a circle.
4. **Never hold locks while waiting for something slow** (an API call, a human, a big file).
5. **Retry on 40P01.** Some deadlocks will still happen. Run the whole transaction again.
6. **Use timeouts** (\`lock_timeout\`, \`statement_timeout\`) so a waiting statement fails visibly instead of hanging.

### Finding who is blocking whom
When something hangs, ask PostgreSQL. \`pg_blocking_pids(pid)\` lists the sessions that stop a given session, and \`pg_stat_activity\` shows what each session is doing:

\`\`\`sql
SELECT pid,
       pg_blocking_pids(pid) AS blocked_by,
       now() - xact_start    AS transaction_age,
       state,
       left(query, 60)       AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
\`\`\`
The session at the **end of the chain** (the one that blocks others but waits for nobody) is the one to look at. Very often it is an old transaction in the state \`idle in transaction\`. As a last resort, \`pg_cancel_backend(pid)\` cancels its current statement and \`pg_terminate_backend(pid)\` ends its session. Use them knowingly: the transaction is rolled back.`,
    { local: `**Two sessions, real waiting.** Open two PowerShell windows with \`psql -U postgres -d fde_practice\` (called **A** and **B**), and create the tables from the lesson once (\`bank_accounts\` with OPS, PAYROLL and TAX, and the \`jobs\` table with six jobs). In both windows type \`\\t on\` and \`\\pset format unaligned\`.

**Experiment 1: a writer waits for a writer.**

| # | Session A | Session B | What you see |
|---|---|---|---|
| 1 | \`BEGIN;\` then \`UPDATE bank_accounts SET balance = balance - 1000 WHERE acct = 'OPS';\` | | \`BEGIN\`, then \`UPDATE 1\` |
| 2 | | \`UPDATE bank_accounts SET balance = balance + 5 WHERE acct = 'OPS';\` | **no prompt comes back**: B is waiting for A's row lock |
| 3 | In a third window: the blocker query from the lesson | | one row: B's pid, with A's pid in \`blocked_by\` |
| 4 | \`COMMIT;\` | | A prints \`COMMIT\`, and B immediately prints \`UPDATE 1\` |

Repeat step 2 after \`SET lock_timeout = '2s';\` in B: after two seconds B prints \`ERROR:  canceling statement due to lock timeout\`. B no longer hangs.

**Experiment 2: NOWAIT and SKIP LOCKED.** A: \`BEGIN;\` then \`SELECT job_id FROM jobs WHERE status = 'queued' ORDER BY job_id FOR UPDATE SKIP LOCKED LIMIT 1;\` prints \`1\`. B: \`BEGIN;\` and the same query prints \`2\` (job 1 is locked, so B skips it). B: \`SELECT job_id FROM jobs WHERE job_id = 1 FOR UPDATE NOWAIT;\` prints

\`\`\`text
ERROR:  could not obtain lock on row in relation "jobs"
\`\`\`
Type \`ROLLBACK;\` in both windows.

**Experiment 3: a deadlock.** A: \`BEGIN;\` and \`UPDATE bank_accounts SET balance = balance - 1000 WHERE acct = 'OPS';\`. B: \`BEGIN;\` and \`UPDATE bank_accounts SET balance = balance - 500 WHERE acct = 'PAYROLL';\`. A: \`UPDATE bank_accounts SET balance = balance + 1000 WHERE acct = 'PAYROLL';\` (A now waits). B: \`UPDATE bank_accounts SET balance = balance + 500 WHERE acct = 'OPS';\`. After about one second **one** of the two windows prints \`ERROR:  deadlock detected\` (followed by DETAIL lines that name the two processes; the numbers differ on your machine) and the other window finishes with \`UPDATE 1\`. Type \`ROLLBACK;\` in the window that got the error and \`COMMIT;\` in the other. Then repeat it with the cure: both sessions first run \`SELECT acct FROM bank_accounts WHERE acct IN ('OPS', 'PAYROLL') ORDER BY acct FOR UPDATE;\`. The second session just waits and no deadlock occurs.` },
    `## Practice
These challenges use only \`SELECT\`. They are the **monitoring queries** a data engineer writes for queues and locks.`,
    { challenge: {
      id: 'sql-locks-deadlocks-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Which job would the next worker claim? The jobs are in the starter. Return the **oldest queued job** (the queued job with the smallest `job_id`): `job_id, file_name`. (1 row: job 3, gl_aug.csv.)',
      starter: `WITH jobs(job_id, file_name, status) AS (
  VALUES (1, 'payroll_aug.csv', 'done'),
         (2, 'payroll_sep.csv', 'running'),
         (3, 'gl_aug.csv', 'queued'),
         (4, 'vendors.csv', 'queued'),
         (5, 'gl_sep.csv', 'queued')
)
SELECT job_id, file_name
FROM jobs`,
      hint: "WHERE status = 'queued' ORDER BY job_id LIMIT 1. (In the real claim query this subquery also gets FOR UPDATE SKIP LOCKED.)",
      solution: `WITH jobs(job_id, file_name, status) AS (
  VALUES (1, 'payroll_aug.csv', 'done'),
         (2, 'payroll_sep.csv', 'running'),
         (3, 'gl_aug.csv', 'queued'),
         (4, 'vendors.csv', 'queued'),
         (5, 'gl_sep.csv', 'queued')
)
SELECT job_id, file_name
FROM jobs
WHERE status = 'queued'
ORDER BY job_id
LIMIT 1`,
    } },
    { challenge: {
      id: 'sql-locks-deadlocks-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'The reaper preview. As of **2026-09-04 10:30:00**, find the jobs with status `running` that were claimed **more than 15 minutes** earlier: `job_id, minutes_running` (the whole minutes from `claimed_at` to 10:30:00). Sort by `job_id`. (2 rows: job 1 with 30 minutes and job 3 with 35.)',
      starter: `WITH jobs(job_id, status, claimed_at) AS (
  VALUES (1, 'running', TIMESTAMP '2026-09-04 10:00:00'),
         (2, 'running', TIMESTAMP '2026-09-04 10:20:00'),
         (3, 'running', TIMESTAMP '2026-09-04 09:55:00'),
         (4, 'queued',  NULL),
         (5, 'done',    TIMESTAMP '2026-09-04 09:00:00')
)
SELECT job_id
FROM jobs
ORDER BY job_id`,
      hint: "WHERE status = 'running' AND claimed_at < TIMESTAMP '2026-09-04 10:30:00' - INTERVAL '15 minutes'. Minutes: ROUND(EXTRACT(EPOCH FROM (TIMESTAMP '2026-09-04 10:30:00' - claimed_at)) / 60).",
      solution: `WITH jobs(job_id, status, claimed_at) AS (
  VALUES (1, 'running', TIMESTAMP '2026-09-04 10:00:00'),
         (2, 'running', TIMESTAMP '2026-09-04 10:20:00'),
         (3, 'running', TIMESTAMP '2026-09-04 09:55:00'),
         (4, 'queued',  NULL),
         (5, 'done',    TIMESTAMP '2026-09-04 09:00:00')
)
SELECT job_id,
       ROUND(EXTRACT(EPOCH FROM (TIMESTAMP '2026-09-04 10:30:00' - claimed_at)) / 60) AS minutes_running
FROM jobs
WHERE status = 'running'
  AND claimed_at < TIMESTAMP '2026-09-04 10:30:00' - INTERVAL '15 minutes'
ORDER BY job_id`,
    } },
    { challenge: {
      id: 'sql-locks-deadlocks-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Deadlock risk review. A log records, for each transaction, the order (`step`) in which it locks accounts (starter). Two transactions are a **deadlock risk** when one locks account X **before** Y and the other locks Y **before** X. Return each risky pair once: `tx_a, tx_b`, with `tx_a < tx_b`, sorted by `tx_a`, then `tx_b`. (2 rows: T1 with T2, and T2 with T4.)',
      starter: `WITH lock_log(tx, step, acct) AS (
  VALUES ('T1', 1, 'OPS'),     ('T1', 2, 'PAYROLL'),
         ('T2', 1, 'PAYROLL'), ('T2', 2, 'OPS'),
         ('T3', 1, 'OPS'),     ('T3', 2, 'TAX'),
         ('T4', 1, 'OPS'),     ('T4', 2, 'PAYROLL')
)
SELECT DISTINCT tx
FROM lock_log
ORDER BY tx`,
      hint: 'First build "edges": every pair of locks of one transaction where the first has a smaller step (a self join on tx with b.step > a.step). Then join the edges with themselves where one edge is the reverse of the other (first = second and second = first) and the first transaction is smaller. Use DISTINCT.',
      solution: `WITH lock_log(tx, step, acct) AS (
  VALUES ('T1', 1, 'OPS'),     ('T1', 2, 'PAYROLL'),
         ('T2', 1, 'PAYROLL'), ('T2', 2, 'OPS'),
         ('T3', 1, 'OPS'),     ('T3', 2, 'TAX'),
         ('T4', 1, 'OPS'),     ('T4', 2, 'PAYROLL')
),
edges AS (
  SELECT a.tx, a.acct AS first_acct, b.acct AS second_acct
  FROM lock_log a
  JOIN lock_log b ON b.tx = a.tx AND b.step > a.step
)
SELECT DISTINCT e1.tx AS tx_a, e2.tx AS tx_b
FROM edges e1
JOIN edges e2
  ON e1.first_acct = e2.second_acct
 AND e1.second_acct = e2.first_acct
 AND e1.tx < e2.tx
ORDER BY tx_a, tx_b`,
    } },
    { real: 'Most lock trouble in real systems is not a clever deadlock. It is **one forgotten transaction**: a notebook that ran `BEGIN` and was left open overnight, a script waiting on an API inside a transaction, a migration that waited for `ACCESS EXCLUSIVE` behind a report. The standard defences are boring and effective: timeouts on every service connection (`lock_timeout`, `statement_timeout`, `idle_in_transaction_session_timeout`), short transactions, a consistent locking order, a retry loop for 40P01 and 40001, and a dashboard query on `pg_stat_activity` and `pg_blocking_pids` that your on-call person knows by heart. Run schema changes with `SET lock_timeout` and be ready to retry them at a quiet hour.' },
    { interview: '"What is a deadlock, how does PostgreSQL deal with it, and how do you prevent them?" Model answer: "A deadlock is a circle of transactions, each waiting for a lock held by the next. PostgreSQL checks for it after deadlock_timeout, one second by default, and cancels one transaction with error 40P01, so the others can continue. The application must catch that error and retry the whole transaction. To prevent them I lock rows in a consistent order (for example `ORDER BY id FOR UPDATE` before updating), keep transactions short, take all locks early and avoid holding locks during slow external calls." Follow-ups: "How do you build a job queue in PostgreSQL?" (`SELECT … FOR UPDATE SKIP LOCKED LIMIT 1` inside the claiming UPDATE, plus a reaper for crashed workers) and "why can an ALTER TABLE freeze a busy table?" (it waits for ACCESS EXCLUSIVE and everything queues behind it; use lock_timeout).' },
    `## Recap
- **Row locks** come automatically with \`UPDATE\` and \`DELETE\` and last until the **end of the transaction**. A second writer on the same row waits. Plain \`SELECT\` takes no row lock. \`SELECT … FOR UPDATE\` locks the rows you are about to change. \`NOWAIT\` fails at once, \`SKIP LOCKED\` skips locked rows.
- **\`FOR UPDATE SKIP LOCKED\`** makes a safe work queue: each worker claims the first unlocked queued row, with no waiting and no double claims. Add \`claimed_at\` and a **reaper** for crashed workers.
- **Table locks**: \`SELECT\`, \`INSERT\`, \`UPDATE\` do not conflict. \`ACCESS EXCLUSIVE\` (\`ALTER TABLE\`, \`DROP\`, \`TRUNCATE\`) conflicts with everything, and while it waits **all new queries queue behind it**. Use \`SET lock_timeout\` before schema changes.
- **Advisory locks** protect a number you choose (one copy of a job). Prefer the \`xact\` variants.
- A **deadlock** is a circle of waiting. PostgreSQL cancels one transaction (\`40P01\`, "deadlock detected"). Prevent it by locking in a consistent order, taking locks early, keeping transactions short, and retrying.
- When something hangs: \`pg_stat_activity\` and \`pg_blocking_pids(pid)\`. Set \`lock_timeout\`, \`statement_timeout\` and \`idle_in_transaction_session_timeout\`.`,
  ],
  quiz: [
    { q: 'When is the row lock taken by an UPDATE released?', o: ['As soon as the UPDATE statement finishes', 'After one second', 'At the end of the transaction, with COMMIT or ROLLBACK', 'When another session asks for it'], a: 2, why: 'A row lock lives until the transaction ends. That is why a transaction left open keeps other writers waiting.' },
    { q: 'What does `FOR UPDATE SKIP LOCKED` do?', o: ['It waits for every lock to be released', 'It skips rows that are currently locked by other transactions instead of waiting for them', 'It deletes the locked rows', 'It raises an error when a row is locked'], a: 1, why: 'SKIP LOCKED passes over locked rows and returns the next free ones, so several workers can claim different jobs at the same time without waiting.' },
    { q: 'Does a plain SELECT block an UPDATE of the same row in PostgreSQL?', o: ['Yes, until the SELECT finishes', 'Yes, in SERIALIZABLE mode only', 'Yes, if the table is large', 'No: thanks to MVCC, reading takes no row lock and does not block writers'], a: 3, why: 'A plain SELECT works on a snapshot and takes only a weak ACCESS SHARE table lock, which conflicts only with ACCESS EXCLUSIVE.' },
    { q: 'What is a deadlock?', o: ['Two or more transactions each waiting for a lock held by another, in a circle, so none can continue', 'A query that runs for too long', 'A table that has no primary key', 'A transaction that was rolled back'], a: 0, why: 'In a deadlock each transaction holds a lock the other needs. PostgreSQL detects the circle and cancels one transaction with error 40P01.' },
    { q: 'Two transfers update the accounts OPS and PAYROLL in opposite order and sometimes deadlock. What is the simplest fix?', o: ['Use READ UNCOMMITTED', 'Make every transfer lock the accounts in the same order (for example alphabetical)', 'Disable constraints', 'Run each transfer twice'], a: 1, why: 'If everybody asks for OPS first and PAYROLL second, a circle cannot form: the second transaction just waits for the first.' },
    { q: 'Why run `SET lock_timeout = \'2s\'` before an ALTER TABLE on a busy table?', o: ['It makes the ALTER faster', 'It lets the ALTER skip locked rows', 'It prevents any other session from reading the table', 'The ALTER waits for ACCESS EXCLUSIVE and all new queries queue behind it, so the timeout makes it give up instead of freezing the application'], a: 3, why: 'A waiting ALTER TABLE blocks every query that arrives after it. With a lock timeout it fails after two seconds, the queue clears, and you retry at a quieter moment.' },
  ],
  task: {
    title: 'Make things wait, then fix it, on your laptop',
    steps: [
      'In DBeaver or psql (database fde_practice), create the `bank_accounts` and `jobs` tables from the lesson, and a file `22_locks.sql` in `C:\\sql-practice`.',
      'Experiment 1: reproduce the blocked UPDATE with two sessions and find the blocker with `pg_blocking_pids`. Then repeat it with `SET lock_timeout = \'2s\'` in the waiting session and copy the exact error text into a comment.',
      'Experiment 2: show `SKIP LOCKED` (jobs 1 and 2 claimed by two sessions) and `NOWAIT` (the error text). Write one sentence on why the plain SELECT-then-UPDATE queue would fail.',
      'Experiment 3: cause a deadlock with the opposite-order transfers and note which session received the error. Then redo it with `ORDER BY acct FOR UPDATE` first and confirm that no deadlock happens.',
      'Write the reaper UPDATE for your job queue (15 minutes) and the advisory-lock guard (`pg_try_advisory_lock(7001)`) that a nightly script would start with.',
    ],
    deliverable: '`22_locks.sql` with the commands and outputs of the three experiments, the exact error texts, and the reaper and advisory-lock statements.',
  },
};
