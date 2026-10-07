// The history dimension of the lesson: one row per version of an employee. Type 2 columns: department and city. emp_name is a Type 1 column (corrected in place).
const SCD_DDL = `CREATE TABLE dim_employee_scd (
  sk          serial PRIMARY KEY,
  emp_id      int  NOT NULL,
  emp_name    text NOT NULL,
  department  text NOT NULL,
  city        text NOT NULL,
  row_hash    text NOT NULL,
  valid_from  date NOT NULL,
  valid_to    date NOT NULL DEFAULT DATE '9999-12-31',
  is_current  boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX one_current_per_employee ON dim_employee_scd (emp_id) WHERE is_current;
CREATE TABLE scd_run (run_date date);`;

const HASH = (a) => `md5(concat_ws('|', COALESCE(${a}department, '~'), COALESCE(${a}city, '~')))`;

// Day 1 loaded from the employees table; the day-2 snapshot (stg_employee) holds 2 Type 2 changes, 1 Type 1 correction and 1 new hire.
const DAY1 = `INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from)
SELECT emp_id, emp_name, department, city, ${HASH('')}, hire_date FROM employees;`;
const DAY2_SNAPSHOT = `CREATE TABLE stg_employee AS SELECT emp_id, emp_name, department, city, hire_date FROM employees;
UPDATE stg_employee SET department = 'Finance' WHERE emp_id = 6;
UPDATE stg_employee SET city = 'Pune' WHERE emp_id = 14;
UPDATE stg_employee SET emp_name = 'Sneha Verma' WHERE emp_id = 8;
INSERT INTO stg_employee VALUES (21, 'Rhea Kapoor', 'Engineering', 'Pune', DATE '2026-09-01');
INSERT INTO scd_run VALUES (DATE '2026-09-01');`;
const DAY2_TWO_STEP = `UPDATE dim_employee_scd d
SET valid_to = (SELECT run_date FROM scd_run) - 1, is_current = false
FROM stg_employee s
WHERE d.emp_id = s.emp_id AND d.is_current AND d.row_hash <> ${HASH('s.')};
INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from)
SELECT s.emp_id, s.emp_name, s.department, s.city, ${HASH('s.')}, (SELECT run_date FROM scd_run)
FROM stg_employee s
WHERE NOT EXISTS (SELECT 1 FROM dim_employee_scd d WHERE d.emp_id = s.emp_id AND d.is_current);
UPDATE dim_employee_scd d SET emp_name = s.emp_name FROM stg_employee s WHERE s.emp_id = d.emp_id AND s.emp_name <> d.emp_name;`;

export default {
  id: 'sql-scd2',
  title: 'SCD Type 2 in SQL: effective dating, MERGE, point-in-time queries and late changes',
  goal: 'You can build a Type 2 history dimension from nightly snapshots (with UPDATE and INSERT, or one MERGE), query it as it was on any date, check it for gaps and overlaps, and load a change that arrives late.',
  roadmap: [
    'Effective dating (valid_from, valid_to, is_current)',
    'MERGE-based SCD Type 2',
    'Point-in-time queries',
    'Late-arriving changes',
  ],
  blocks: [
    `## The problem
Ananya Rao moved from **Sales** to **Finance** on 1 September 2026. Her pay rose the same month. The CFO's team asks two questions that sound alike and are not:

1. *"What did **Sales** cost us in August?"* The answer must still include Ananya, because she was in Sales in August. This is the report **as it was**.
2. *"What does **Finance** cost us per month, by today's structure?"* This one puts all her pay in Finance, even August. This is the report **as it is now**.

If the warehouse keeps only today's department (**Type 1**: overwrite), question 1 can no longer be answered, and last month's report changes when somebody is transferred. You met this in the modelling lesson. Today you build the real thing: a **Type 2** dimension, loaded every night from a snapshot of the HR system, queryable for any date.

Start with the simulator. Pick a scenario and a design, apply the changes, and watch the dimension, the SQL and the report. **Try the third scenario with the naive loader on Type 2:** it breaks, and the rest of the lesson shows how to prevent it.`,
    { widget: 'ScdViz' },
    `## Anatomy of a Type 2 dimension
Each **version** of an employee is one row. One employee has several rows over time, so \`emp_id\` is no longer unique. You need:

| Column | Role |
|---|---|
| \`sk\` (surrogate key) | unique id of this **version**. A fact can point at it |
| \`emp_id\` (natural / business key) | the employee, the same in every version |
| attributes (\`department\`, \`city\`) | the values that were true in this version |
| \`valid_from\`, \`valid_to\` | the **effective dates**: the first and last day this version was true |
| \`is_current\` | a convenience flag: \`true\` on the one open row |
| \`row_hash\` | fingerprint of the tracked attributes, for change detection (last lesson) |

Two conventions to settle once and write down:

- **The open row ends at \`9999-12-31\`.** A real date (not \`NULL\`) keeps every comparison and \`BETWEEN\` simple. The row where \`valid_to = '9999-12-31'\` is the current one.
- **Inclusive end: \`valid_to\` is the *last day* the row was true**, so the next row starts on the next day (\`valid_from = previous valid_to + 1\`). The alternative is a **half-open** range where \`valid_to\` is the *first day of the next version* and you test \`valid_from <= d AND d < valid_to\`. It avoids the "+ 1", and it is what PostgreSQL's range types use. Either works. **Do not mix them**, and never test half-open ranges with \`BETWEEN\`.

**Which attributes are Type 2?** Not all of them. A change in **department** or **city** must keep history. A **corrected spelling** of a name should not create a new version: fix it **in place** on every row (Type 1 for that column). Deciding this per column is the real design work, and it is a business question: ask what reports must reproduce.`,
    { sketch: { w: 760, h: 312, caption: 'Employee 6 after her move. The old row is closed the day before, a new row opens on the day of the change. Exactly one row is open.', items: [
      { t: 'table', x: 14, y: 34, title: 'dim_employee_scd', cols: ['sk', 'emp_id', 'department', 'valid_from', 'valid_to', 'is_current'], colW: [50, 80, 120, 140, 140, 110], rows: [['6', '6', 'Sales', '2015-06-01', '2026-08-31', 'false'], ['21', '6', 'Finance', '2026-09-01', '9999-12-31', 'true']], rowH: 30, hl: [1] },
      { t: 'circle', x: 692, y: 79, r: 12, fill: 'pink', label: '1', size: 15 },
      { t: 'circle', x: 692, y: 109, r: 12, fill: 'green', label: '2', size: 15 },
      { t: 'note', x: 300, y: 146, w: 300, h: 56, fill: 'pink', size: 14, text: '1. CLOSE the old row:\nvalid_to = change date - 1, is_current = false' },
      { t: 'note', x: 612, y: 146, w: 138, h: 56, fill: 'green', size: 13, text: '2. OPEN the new\nrow, 9999-12-31' },
      { t: 'note', x: 14, y: 146, w: 276, h: 56, fill: 'grey', size: 14, text: 'sk is the id of the VERSION.\nemp_id is the id of the PERSON.' },
      { t: 'note', x: 14, y: 220, w: 736, h: 80, fill: 'yellow', size: 14, text: 'Rules that keep it correct:  no gap (the next row starts the day after),  no overlap,\nno negative row (valid_to >= valid_from),  and exactly ONE open row per employee.\nA unique partial index on (emp_id) WHERE is_current enforces the last rule in the database itself.' },
    ] } },
    `## Loading it every night from a snapshot
The HR system gives you a **snapshot**: today's list of employees with today's attributes. It does not say what changed. So the nightly job compares the snapshot with the **current rows** of the dimension (by hash, from the last lesson) and does three things inside **one transaction**:

1. **Close** the current row of every employee whose tracked attributes changed: \`valid_to = run_date - 1\`, \`is_current = false\`.
2. **Insert** a new open row for every changed employee **and** for every employee not seen before: \`valid_from = run_date\`.
3. **Correct** Type 1 columns in place (the name), on all versions.

What about an employee who **disappears** from the snapshot (a leaver)? Do not delete the history. Close the current row (\`valid_to\` = the last working day, or the day before the snapshot) and decide with the business whether to mark the person inactive. The facts that point at the old rows must still make sense.

Here is the plain version with an \`UPDATE\` and an \`INSERT\`.`,
    { sql: {
      title: 'Day 1 load, then the nightly UPDATE and INSERT',
      setup: SCD_DDL,
      starter: `-- dim_employee_scd (empty) and scd_run (the run date) exist. Tracked columns: department and city (Type 2). emp_name is Type 1.
-- DAY 1: the first snapshot. Everybody starts in one open row, valid from the hire date.
INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from)
SELECT emp_id, emp_name, department, city, md5(concat_ws('|', COALESCE(department, '~'), COALESCE(city, '~'))), hire_date
FROM employees;
SELECT COUNT(*) AS version_rows, COUNT(*) FILTER (WHERE is_current) AS open_rows FROM dim_employee_scd;

-- DAY 2 (1 Sep 2026): the HR snapshot. 2 real changes, 1 spelling correction, 1 new hire.
CREATE TABLE stg_employee AS SELECT emp_id, emp_name, department, city, hire_date FROM employees;
UPDATE stg_employee SET department = 'Finance' WHERE emp_id = 6;       -- moved: Type 2 change
UPDATE stg_employee SET city = 'Pune'          WHERE emp_id = 14;      -- relocated: Type 2 change
UPDATE stg_employee SET emp_name = 'Sneha Verma' WHERE emp_id = 8;     -- typo fixed: Type 1 only
INSERT INTO stg_employee VALUES (21, 'Rhea Kapoor', 'Engineering', 'Pune', DATE '2026-09-01');   -- new hire
INSERT INTO scd_run VALUES (DATE '2026-09-01');

-- 1) CLOSE the current row of everybody whose tracked attributes (the hash) changed
UPDATE dim_employee_scd d
SET valid_to = (SELECT run_date FROM scd_run) - 1, is_current = false
FROM stg_employee s
WHERE d.emp_id = s.emp_id AND d.is_current
  AND d.row_hash <> md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~')));

-- 2) INSERT an open row for everybody who has no open row now (changed employees and new hires)
INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from)
SELECT s.emp_id, s.emp_name, s.department, s.city,
       md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~'))), (SELECT run_date FROM scd_run)
FROM stg_employee s
WHERE NOT EXISTS (SELECT 1 FROM dim_employee_scd d WHERE d.emp_id = s.emp_id AND d.is_current);

-- 3) Type 1 correction: fix the name on every version
UPDATE dim_employee_scd d SET emp_name = s.emp_name FROM stg_employee s WHERE s.emp_id = d.emp_id AND s.emp_name <> d.emp_name;

SELECT COUNT(*) AS version_rows, COUNT(*) FILTER (WHERE is_current) AS open_rows FROM dim_employee_scd;
SELECT emp_id, emp_name, department, city, TO_CHAR(valid_from, 'YYYY-MM-DD') AS valid_from, TO_CHAR(valid_to, 'YYYY-MM-DD') AS valid_to, is_current
FROM dim_employee_scd
WHERE emp_id IN (6, 8, 14, 21)
ORDER BY emp_id, valid_from;`,
      note: 'Day 1 creates 20 version rows, all open. After the day-2 run there are 23 rows and 21 open ones (20 employees plus the new hire): employee 6 has two rows (Sales to 2026-08-31, Finance from 2026-09-01), employee 14 has two rows (Mumbai to 2026-08-31, Pune from 2026-09-01), employee 21 has one new open row, and employee 8 still has ONE row, now with the corrected name Sneha Verma (a Type 1 change creates no new version). The row of employee 6 that was closed starts on her hire date, 2015-06-01.',
    } },
    `## MERGE: the whole load in one statement
The two statements above are clear, but there is a neat way to do both in **one \`MERGE\`**. The problem is that a \`MERGE\` can act **once per source row**, and a changed employee needs two actions: close the old row and insert the new one. The classic trick is to feed the \`MERGE\` **each changed employee twice**:

- a copy with the **real key** (\`emp_id\`), which **matches** the current row and runs the \`WHEN MATCHED\` branch (close it);
- a copy with a **\`NULL\` key**, which can never match, so it falls into \`WHEN NOT MATCHED\` (insert the new version).

New employees need only the normal copy, because they have no current row to match, so they fall into \`WHEN NOT MATCHED\` too.`,
    { sketch: { w: 760, h: 308, caption: 'MERGE acts once per source row, so a changed employee is fed in twice: with its real key (closes the old row) and with a NULL key (inserts the new one).', items: [
      { t: 'table', x: 14, y: 44, title: 'source rows for the MERGE', cols: ['merge_key', 'emp_id', 'department'], colW: [110, 90, 130], rows: [['6', '6', 'Finance'], ['NULL', '6', 'Finance'], ['14', '14', 'Sales'], ['NULL', '14', 'Sales'], ['21', '21', 'Engineering']], rowH: 28, hl: [1, 3] },
      { t: 'arrow', x1: 354, y1: 86, x2: 410, y2: 86, color: '#c2410c' },
      { t: 'note', x: 414, y: 56, w: 336, h: 62, fill: 'pink', size: 14, text: 'merge_key = 6 matches the current row of\nemployee 6 and its hash differs:\nWHEN MATCHED -> close it (valid_to, is_current)' },
      { t: 'arrow', x1: 354, y1: 142, x2: 410, y2: 142, color: '#2f9e44' },
      { t: 'note', x: 414, y: 128, w: 336, h: 62, fill: 'green', size: 14, text: 'merge_key = NULL never matches anything:\nWHEN NOT MATCHED -> insert the new version.\nEmployee 21 (new hire) also lands here.' },
      { t: 'note', x: 14, y: 226, w: 736, h: 72, fill: 'yellow', size: 14, text: 'The second copy exists only for employees that CHANGED (hash differs from the current row).\nUnchanged employees: one copy, it matches, the hash is the same, no WHEN branch applies: nothing happens.\nRETURNING merge_action() tells you what each source row did.' },
    ] } },
    { sql: {
      title: 'The same load as one MERGE, and a check that it equals the two-step version',
      setup: `${SCD_DDL}
${DAY1}
${DAY2_SNAPSHOT}`,
      starter: `-- State: day 1 is loaded into dim_employee_scd (20 open rows). stg_employee holds the day-2 snapshot, scd_run says 2026-09-01.
-- Two copies of the day-1 dimension: one for MERGE, one for the two-step UPDATE and INSERT.
CREATE TABLE dim_merge    (LIKE dim_employee_scd INCLUDING ALL);
CREATE TABLE dim_twostep  (LIKE dim_employee_scd INCLUDING ALL);
INSERT INTO dim_merge   SELECT * FROM dim_employee_scd;
INSERT INTO dim_twostep SELECT * FROM dim_employee_scd;

-- ONE MERGE. The source feeds every snapshot row once, and the changed employees a second time with a NULL key.
-- RETURNING shows what each source row did.
MERGE INTO dim_merge d
USING (
  SELECT s.emp_id AS merge_key, s.emp_id, s.emp_name, s.department, s.city,
         md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~'))) AS row_hash
  FROM stg_employee s
  UNION ALL
  SELECT NULL, s.emp_id, s.emp_name, s.department, s.city,
         md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~')))
  FROM stg_employee s
  JOIN dim_merge c ON c.emp_id = s.emp_id AND c.is_current
  WHERE c.row_hash <> md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~')))
) src ON d.emp_id = src.merge_key AND d.is_current
WHEN MATCHED AND d.row_hash <> src.row_hash THEN
  UPDATE SET valid_to = (SELECT run_date FROM scd_run) - 1, is_current = false
WHEN NOT MATCHED THEN
  INSERT (emp_id, emp_name, department, city, row_hash, valid_from)
  VALUES (src.emp_id, src.emp_name, src.department, src.city, src.row_hash, (SELECT run_date FROM scd_run))
RETURNING merge_action() AS action, d.emp_id, d.department, d.city;

-- The Type 1 correction is a separate small UPDATE (no new version)
UPDATE dim_merge d SET emp_name = s.emp_name FROM stg_employee s WHERE s.emp_id = d.emp_id AND s.emp_name <> d.emp_name;

-- The two-step version on the other copy
UPDATE dim_twostep d SET valid_to = (SELECT run_date FROM scd_run) - 1, is_current = false
FROM stg_employee s
WHERE d.emp_id = s.emp_id AND d.is_current
  AND d.row_hash <> md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~')));
INSERT INTO dim_twostep (emp_id, emp_name, department, city, row_hash, valid_from)
SELECT s.emp_id, s.emp_name, s.department, s.city, md5(concat_ws('|', COALESCE(s.department, '~'), COALESCE(s.city, '~'))), (SELECT run_date FROM scd_run)
FROM stg_employee s
WHERE NOT EXISTS (SELECT 1 FROM dim_twostep d WHERE d.emp_id = s.emp_id AND d.is_current);
UPDATE dim_twostep d SET emp_name = s.emp_name FROM stg_employee s WHERE s.emp_id = d.emp_id AND s.emp_name <> d.emp_name;

-- Same result? Rows in one table and not in the other (everything except the surrogate key)
SELECT (SELECT COUNT(*) FROM (SELECT emp_id, emp_name, department, city, valid_from, valid_to, is_current FROM dim_merge
                              EXCEPT SELECT emp_id, emp_name, department, city, valid_from, valid_to, is_current FROM dim_twostep) x) AS only_in_merge,
       (SELECT COUNT(*) FROM (SELECT emp_id, emp_name, department, city, valid_from, valid_to, is_current FROM dim_twostep
                              EXCEPT SELECT emp_id, emp_name, department, city, valid_from, valid_to, is_current FROM dim_merge) x) AS only_in_twostep,
       (SELECT COUNT(*) FROM dim_merge) AS merge_rows, (SELECT COUNT(*) FROM dim_twostep) AS twostep_rows;`,
      note: 'The MERGE reports 5 actions: UPDATE for employee 6 and for employee 14 (their old rows are closed), and INSERT for 6 (Finance), 14 (Pune) and 21 (the new hire). The check query finds 0 rows only in one table and 0 only in the other, and both tables have 23 rows: the single MERGE and the UPDATE-plus-INSERT give the same dimension. Without the second, NULL-keyed copy the MERGE could close the old rows but could not insert the new versions.',
    } },
    `## Point-in-time queries: as it was, and as it is
With the history in place, every question about the past becomes a **date comparison**. The central pattern is the **as-was join**: attach to each fact the dimension row that was **valid on the fact's date**.

\`\`\`sql
-- as it WAS: the department that each payroll month belonged to
FROM payroll p
JOIN dim_employee_scd d ON d.emp_id = p.emp_id
                       AND p.run_month BETWEEN d.valid_from AND d.valid_to

-- as it IS: today's department for the whole history
FROM payroll p
JOIN dim_employee_scd d ON d.emp_id = p.emp_id AND d.is_current
\`\`\`

Other useful queries are one-liners: the **snapshot on a date** (\`WHERE DATE '2026-08-31' BETWEEN valid_from AND valid_to\`: the headcount by department as of month end), the **history of one person** (order by \`valid_from\`), and **time in each role** (\`valid_to - valid_from + 1\` days, capped at today for the open row).

**A design choice for the fact table.** You can compute the as-was join at **query time** (above), or store the dimension's **surrogate key** (\`sk\`) in the fact at **load time**, choosing the version valid on the fact's date. Query-time joins are simple and survive history corrections. Load-time keys make report queries a plain equi-join and fast, but a late change then forces you to **re-point** the facts. Many warehouses do the second in the gold layer, from the first in the silver layer.`,
    { sketch: { w: 760, h: 276, caption: 'The same payroll line joined two ways. As-was matches the version valid in that month. As-is always takes the open row.', items: [
      { t: 'table', x: 14, y: 30, title: 'payroll line', cols: ['emp_id', 'run_month', 'gross_pay'], colW: [70, 110, 120], rows: [['6', '2026-08-01', '1,08,333.33']], rowH: 30 },
      { t: 'table', x: 440, y: 30, title: 'dim_employee_scd', cols: ['department', 'valid_from', 'valid_to'], colW: [100, 110, 100], rows: [['Sales', '2015-06-01', '2026-08-31'], ['Finance', '2026-09-01', '9999-12-31']], rowH: 30, hl: [0] },
      { t: 'arrow', x1: 320, y1: 76, x2: 434, y2: 76, color: '#2f9e44', label: 'AS WAS', lx: 0, ly: -10 },
      { t: 'note', x: 14, y: 130, w: 350, h: 62, fill: 'green', size: 14, text: 'run_month BETWEEN valid_from AND valid_to\n2026-08-01 falls in the first row:\nthis line belongs to SALES' },
      { t: 'arrow', x1: 320, y1: 100, x2: 434, y2: 108, color: '#c2410c', dashed: true, label: 'AS IS', lx: 0, ly: 18 },
      { t: 'note', x: 380, y: 130, w: 366, h: 62, fill: 'pink', size: 14, text: 'WHERE is_current\nalways the open row: the same line\nbelongs to FINANCE, in every month' },
      { t: 'note', x: 14, y: 208, w: 732, h: 56, fill: 'yellow', size: 14, text: 'Use as-was for "what did we report then, and what did it cost the department that month".\nUse as-is for "restate the past in today\'s structure". State which one a report uses, in its header.' },
    ] } },
    { sql: {
      title: 'As-was against as-is payroll, a snapshot on a date, and time in role',
      setup: `${SCD_DDL}
${DAY1}
${DAY2_SNAPSHOT}
${DAY2_TWO_STEP}`,
      starter: `-- State: day 2 is loaded (employee 6 moved to Finance on 2026-09-01; employee 14 moved to Pune; employee 21 is new).

-- 1) Payroll by department and month, AS WAS and AS IS. Show only the cells where they differ.
WITH was AS (
  SELECT d.department, p.run_month, SUM(p.gross_pay) AS amount
  FROM payroll p
  JOIN dim_employee_scd d ON d.emp_id = p.emp_id AND p.run_month BETWEEN d.valid_from AND d.valid_to
  GROUP BY d.department, p.run_month
),
asis AS (
  SELECT d.department, p.run_month, SUM(p.gross_pay) AS amount
  FROM payroll p
  JOIN dim_employee_scd d ON d.emp_id = p.emp_id AND d.is_current
  GROUP BY d.department, p.run_month
)
SELECT COALESCE(w.department, a.department) AS department,
       TO_CHAR(COALESCE(w.run_month, a.run_month), 'YYYY-MM') AS month,
       w.amount AS as_was, a.amount AS as_is, a.amount - w.amount AS difference
FROM was w
FULL OUTER JOIN asis a ON a.department = w.department AND a.run_month = w.run_month
WHERE w.amount IS DISTINCT FROM a.amount
ORDER BY 1, 2;

-- 2) A snapshot on a date: headcount by department on the last day of August and on 1 September
SELECT d.department,
       COUNT(*) FILTER (WHERE DATE '2026-08-31' BETWEEN d.valid_from AND d.valid_to) AS on_31_aug,
       COUNT(*) FILTER (WHERE DATE '2026-09-01' BETWEEN d.valid_from AND d.valid_to) AS on_1_sep
FROM dim_employee_scd d
GROUP BY d.department
ORDER BY d.department;

-- 3) Time in each role for employee 6, up to 30 September 2026 (the open row is capped at that date)
SELECT d.department, TO_CHAR(d.valid_from, 'YYYY-MM-DD') AS from_day,
       LEAST(d.valid_to, DATE '2026-09-30') - d.valid_from + 1 AS days_in_role
FROM dim_employee_scd d
WHERE d.emp_id = 6
ORDER BY d.valid_from;`,
      note: 'Query 1 shows only August: as was, Sales cost 608333.33 and Finance 1433333.35, but as it is now (employee 6 counted in Finance for her August pay too) Sales shows 500000.00 and Finance 1541666.68, a difference of 108333.33 (her August gross pay) moving from Sales to Finance. September matches in both views, because the move was effective on 1 September. Query 2: on 1 September Finance has 8 people against 7 on 31 August, Sales has 3 against 4 (employee 6 moved), and Engineering has 5 against 4 (the new hire, employee 21). Query 3: employee 6 spent 4110 days in Sales and 30 days in Finance up to 30 September 2026.',
    } },
    `## Keeping it honest: integrity checks
A history table can be **silently wrong**, and every report on it inherits the error. Four defects to test for, each a one-line rule:

1. **Gap**: the next row does not start the day after this one ends.
2. **Overlap**: the next row starts on or before this one ends. A fact would match **two** versions and be counted **twice**.
3. **Negative row**: \`valid_to < valid_from\`.
4. **Open-row rule**: not exactly one open row (\`valid_to = '9999-12-31'\`) per employee.

\`LEAD(valid_from) OVER (PARTITION BY emp_id ORDER BY valid_from)\` finds the next row's start in one pass. Run the check **after every load** and fail the job if it returns rows. In the database itself, a **unique partial index** \`ON (emp_id) WHERE is_current\` rejects a second open row. On a server with the \`btree_gist\` extension, an **exclusion constraint** with a date range rejects overlaps outright (the callout in the indexes lesson).

## Late-arriving changes
Everything above assumes changes arrive **in date order**, and the simulator showed what happens when they do not. Suppose the Operations move (1 November) is already loaded, and then HR reports that the move to **Finance on 1 September** was missed. The naive loader closes "the current row" (Operations!) with an end date of 31 August, which is before its start, and opens a Finance row that overlaps everything. The correct logic is to **find the row that covers the effective date** and **split** it: end it the day before, and insert the new version with the **same end date the old row had**. The later row is untouched. If the covering row was the open one, the result is the normal "close and open".`,
    { sql: {
      title: 'A change arrives late: the naive loader against the split',
      setup: `${SCD_DDL}
${DAY1}
UPDATE dim_employee_scd SET valid_to = DATE '2026-10-31', is_current = false WHERE emp_id = 6;
INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from)
VALUES (6, 'Ananya Rao', 'Operations', 'Bengaluru', md5(concat_ws('|', 'Operations', 'Bengaluru')), DATE '2026-11-01');`,
      starter: `-- State: employee 6 has two rows: Sales (to 2026-10-31) and Operations (from 2026-11-01, open).
-- HR now says: she was in Finance from 2026-09-01. That is the late change.

-- The structure check, as a view: gaps, overlaps, negative rows, and the open-row rule
CREATE VIEW scd_problems AS
SELECT emp_id, valid_from, valid_to,
       CASE WHEN valid_to < valid_from THEN 'ends before it starts'
            WHEN next_from IS NOT NULL AND next_from <= valid_to THEN 'overlaps the next row'
            WHEN next_from IS NOT NULL AND next_from > valid_to + 1 THEN 'gap before the next row'
            WHEN next_from IS NULL AND valid_to <> DATE '9999-12-31' THEN 'last row is not open' END AS problem
FROM (SELECT emp_id, valid_from, valid_to, LEAD(valid_from) OVER (PARTITION BY emp_id ORDER BY valid_from, sk) AS next_from
      FROM dim_employee_scd) t;
SELECT COUNT(*) AS problems_before FROM scd_problems WHERE problem IS NOT NULL;

-- 1) The NAIVE loader, on a copy: "close the open row the day before, open a new row"
CREATE TABLE dim_naive (LIKE dim_employee_scd INCLUDING DEFAULTS);
INSERT INTO dim_naive SELECT * FROM dim_employee_scd;
UPDATE dim_naive SET valid_to = DATE '2026-09-01' - 1, is_current = false WHERE emp_id = 6 AND valid_to = DATE '9999-12-31';
INSERT INTO dim_naive (emp_id, emp_name, department, city, row_hash, valid_from)
VALUES (6, 'Ananya Rao', 'Finance', 'Bengaluru', md5('Finance|Bengaluru'), DATE '2026-09-01');
SELECT department, TO_CHAR(valid_from, 'YYYY-MM-DD') AS valid_from, TO_CHAR(valid_to, 'YYYY-MM-DD') AS valid_to, is_current
FROM dim_naive WHERE emp_id = 6 ORDER BY valid_from, sk;

-- 2) The SPLIT, on the real dimension: find the row that covers 2026-09-01, shorten it, insert the new version
WITH cover AS (
  SELECT sk, valid_to AS old_to, is_current AS old_current
  FROM dim_employee_scd
  WHERE emp_id = 6 AND DATE '2026-09-01' BETWEEN valid_from AND valid_to
),
closed AS (
  UPDATE dim_employee_scd d
  SET valid_to = DATE '2026-09-01' - 1, is_current = false
  FROM cover c
  WHERE d.sk = c.sk
  RETURNING d.emp_id, d.emp_name, d.city, c.old_to, c.old_current
)
INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from, valid_to, is_current)
SELECT emp_id, emp_name, 'Finance', city, md5('Finance|' || city), DATE '2026-09-01', old_to, old_current
FROM closed;
SELECT department, TO_CHAR(valid_from, 'YYYY-MM-DD') AS valid_from, TO_CHAR(valid_to, 'YYYY-MM-DD') AS valid_to, is_current
FROM dim_employee_scd WHERE emp_id = 6 ORDER BY valid_from;
SELECT COUNT(*) AS problems_after_split FROM scd_problems WHERE problem IS NOT NULL;

-- 3) The database itself refuses a second open row for the same employee
CREATE TABLE attempt_log (msg text);
DO $$
BEGIN
  INSERT INTO dim_employee_scd (emp_id, emp_name, department, city, row_hash, valid_from) VALUES (6, 'Ananya Rao', 'Sales', 'Bengaluru', 'x', DATE '2027-01-01');
EXCEPTION WHEN unique_violation THEN
  INSERT INTO attempt_log VALUES (SQLERRM);
END $$;
SELECT msg FROM attempt_log;`,
      note: 'Before any change the check finds 0 problems. The naive loader (run on a copy) ends the open Operations row on 2026-08-31, which is BEFORE its start of 2026-11-01, and adds an open Finance row from 2026-09-01: the table now has three rows for employee 6 that overlap. The split on the real table gives the correct history: Sales to 2026-08-31, Finance from 2026-09-01 to 2026-10-31 (not current), Operations from 2026-11-01 (open). The check then reports 0 problems. The last step shows the unique partial index rejecting a second open row: duplicate key value violates unique constraint "one_current_per_employee".',
    } },
    { local: `**Two things the browser cannot show** (psql, your \`fde_practice\` database; extensions need to be installed on the server):
\`\`\`sql
-- 1) Let the database forbid overlapping versions with a range column and an EXCLUSION constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE dim_emp_ranged (
  emp_id int NOT NULL, department text NOT NULL, validity daterange NOT NULL,
  EXCLUDE USING gist (emp_id WITH =, validity WITH &&)
);
INSERT INTO dim_emp_ranged VALUES (6, 'Sales',   daterange('2015-06-01', '2026-09-01', '[)'));
INSERT INTO dim_emp_ranged VALUES (6, 'Finance', daterange('2026-09-01', NULL, '[)'));    -- touching, not overlapping: accepted
INSERT INTO dim_emp_ranged VALUES (6, 'Ops',     daterange('2026-08-15', '2026-10-01', '[)'));   -- overlaps: rejected

-- 2) The as-of query with the range operator
SELECT emp_id, department FROM dim_emp_ranged WHERE validity @> DATE '2026-09-15';
\`\`\`
**What to expect:** the third insert fails with \`conflicting key value violates exclusion constraint\`. The range \`[2026-09-01,)\` has **no end** (\`NULL\`), which is how range types say "open", so no \`9999-12-31\` sentinel is needed. The last query returns the Finance row for employee 6. Range types use **half-open** ranges: the end date is the first day of the *next* version, which is why \`'[)'\` is written.` },
    `## Practice
Three tasks on the logic of a history table with the data inline: the department on a date, the report as it was against as it is, and an integrity check.`,
    { challenge: {
      id: 'sql-scd2-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Point in time. The starter holds the history of four employees (`valid_to` of `9999-12-31` means open). Return `emp_id` and `department` for the row that was valid on `2026-09-15`, sorted by `emp_id`. One employee left on 31 August, so there is no row for them on that day. (3 rows.)',
      starter: `WITH hist(emp_id, department, valid_from, valid_to) AS (
  VALUES (1, 'Finance', DATE '2016-01-10', DATE '9999-12-31'),
         (2, 'Sales',   DATE '2023-12-26', DATE '2026-05-31'),
         (2, 'Finance', DATE '2026-06-01', DATE '9999-12-31'),
         (3, 'Engineering', DATE '2023-05-24', DATE '2026-08-31'),
         (4, 'Sales',   DATE '2025-06-24', DATE '2026-09-14'),
         (4, 'Operations', DATE '2026-09-15', DATE '9999-12-31')
)
SELECT emp_id, department
FROM hist
ORDER BY emp_id`,
      hint: "Keep the rows where DATE '2026-09-15' BETWEEN valid_from AND valid_to. Employee 3 has no such row, so it does not appear.",
      solution: `WITH hist(emp_id, department, valid_from, valid_to) AS (
  VALUES (1, 'Finance', DATE '2016-01-10', DATE '9999-12-31'),
         (2, 'Sales',   DATE '2023-12-26', DATE '2026-05-31'),
         (2, 'Finance', DATE '2026-06-01', DATE '9999-12-31'),
         (3, 'Engineering', DATE '2023-05-24', DATE '2026-08-31'),
         (4, 'Sales',   DATE '2025-06-24', DATE '2026-09-14'),
         (4, 'Operations', DATE '2026-09-15', DATE '9999-12-31')
)
SELECT emp_id, department
FROM hist
WHERE DATE '2026-09-15' BETWEEN valid_from AND valid_to
ORDER BY emp_id`,
    } },
    { challenge: {
      id: 'sql-scd2-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'As was against as is, on the real `payroll` table. The history of employee 6 is in the starter (Sales to 2026-08-31, Finance from 2026-09-01); every other employee keeps the department they have in `employees` for the whole period. Return `department`, `month` (as `YYYY-MM`), `as_was` and `as_is` (total `gross_pay`) for the department-months where the two views **differ**, sorted by `department`, then `month`. (2 rows. As was uses the version valid on `run_month`, as is uses employee 6\'s latest department for all months.)',
      starter: `WITH hist(emp_id, department, valid_from, valid_to) AS (
  SELECT emp_id, department, DATE '2000-01-01', DATE '9999-12-31' FROM employees WHERE emp_id <> 6
  UNION ALL SELECT 6, 'Sales',   DATE '2015-06-01', DATE '2026-08-31'
  UNION ALL SELECT 6, 'Finance', DATE '2026-09-01', DATE '9999-12-31'
)
SELECT h.department, TO_CHAR(p.run_month, 'YYYY-MM') AS month, SUM(p.gross_pay) AS as_was
FROM payroll p
JOIN hist h ON h.emp_id = p.emp_id AND p.run_month BETWEEN h.valid_from AND h.valid_to
GROUP BY h.department, p.run_month
ORDER BY 1, 2`,
      hint: "Build two aggregates: was (join on the date range) and asis (join on h.valid_to = DATE '9999-12-31'). FULL OUTER JOIN them on department and month, and keep rows where the amounts are DISTINCT FROM each other.",
      solution: `WITH hist(emp_id, department, valid_from, valid_to) AS (
  SELECT emp_id, department, DATE '2000-01-01', DATE '9999-12-31' FROM employees WHERE emp_id <> 6
  UNION ALL SELECT 6, 'Sales',   DATE '2015-06-01', DATE '2026-08-31'
  UNION ALL SELECT 6, 'Finance', DATE '2026-09-01', DATE '9999-12-31'
),
was AS (
  SELECT h.department, p.run_month, SUM(p.gross_pay) AS amount
  FROM payroll p JOIN hist h ON h.emp_id = p.emp_id AND p.run_month BETWEEN h.valid_from AND h.valid_to
  GROUP BY h.department, p.run_month
),
asis AS (
  SELECT h.department, p.run_month, SUM(p.gross_pay) AS amount
  FROM payroll p JOIN hist h ON h.emp_id = p.emp_id AND h.valid_to = DATE '9999-12-31'
  GROUP BY h.department, p.run_month
)
SELECT COALESCE(w.department, a.department) AS department,
       TO_CHAR(COALESCE(w.run_month, a.run_month), 'YYYY-MM') AS month,
       w.amount AS as_was, a.amount AS as_is
FROM was w
FULL OUTER JOIN asis a ON a.department = w.department AND a.run_month = w.run_month
WHERE w.amount IS DISTINCT FROM a.amount
ORDER BY 1, 2`,
    } },
    { challenge: {
      id: 'sql-scd2-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Integrity check. The starter holds the history of five employees with deliberate defects. For every row return `emp_id`, `valid_from` (as `YYYY-MM-DD` text) and `problem`, **only for rows that have a problem**, sorted by `emp_id`, then `valid_from`. Test in this order and report the first that applies: `ends before it starts` (`valid_to < valid_from`), `overlaps the next row` (the next row of the same employee, ordered by `valid_from`, starts on or before this row\'s `valid_to`), `gap before the next row` (the next row starts more than 1 day after this row\'s `valid_to`), `last row is not open` (there is no next row and `valid_to` is not `9999-12-31`). (4 rows.)',
      starter: `WITH hist(emp_id, valid_from, valid_to) AS (
  VALUES (1, DATE '2020-01-01', DATE '2024-12-31'), (1, DATE '2025-01-01', DATE '9999-12-31'),
         (2, DATE '2020-01-01', DATE '2024-06-30'), (2, DATE '2024-08-01', DATE '9999-12-31'),
         (3, DATE '2020-01-01', DATE '2024-12-31'), (3, DATE '2024-12-01', DATE '9999-12-31'),
         (4, DATE '2020-01-01', DATE '2024-12-31'), (4, DATE '2025-01-01', DATE '2025-06-30'),
         (5, DATE '2025-03-01', DATE '2025-02-01'), (5, DATE '2025-03-02', DATE '9999-12-31')
)
SELECT emp_id, valid_from, valid_to
FROM hist
ORDER BY emp_id, valid_from`,
      hint: "Add next_from with LEAD(valid_from) OVER (PARTITION BY emp_id ORDER BY valid_from) in a subquery, then CASE the four rules in the stated order, and keep rows where the CASE is not NULL. Note: next_from <= valid_to is an overlap; next_from > valid_to + 1 is a gap.",
      solution: `WITH hist(emp_id, valid_from, valid_to) AS (
  VALUES (1, DATE '2020-01-01', DATE '2024-12-31'), (1, DATE '2025-01-01', DATE '9999-12-31'),
         (2, DATE '2020-01-01', DATE '2024-06-30'), (2, DATE '2024-08-01', DATE '9999-12-31'),
         (3, DATE '2020-01-01', DATE '2024-12-31'), (3, DATE '2024-12-01', DATE '9999-12-31'),
         (4, DATE '2020-01-01', DATE '2024-12-31'), (4, DATE '2025-01-01', DATE '2025-06-30'),
         (5, DATE '2025-03-01', DATE '2025-02-01'), (5, DATE '2025-03-02', DATE '9999-12-31')
),
nxt AS (
  SELECT emp_id, valid_from, valid_to,
         LEAD(valid_from) OVER (PARTITION BY emp_id ORDER BY valid_from) AS next_from
  FROM hist
),
checked AS (
  SELECT emp_id, valid_from,
         CASE WHEN valid_to < valid_from THEN 'ends before it starts'
              WHEN next_from IS NOT NULL AND next_from <= valid_to THEN 'overlaps the next row'
              WHEN next_from IS NOT NULL AND next_from > valid_to + 1 THEN 'gap before the next row'
              WHEN next_from IS NULL AND valid_to <> DATE '9999-12-31' THEN 'last row is not open' END AS problem
  FROM nxt
)
SELECT emp_id, TO_CHAR(valid_from, 'YYYY-MM-DD') AS valid_from, problem
FROM checked
WHERE problem IS NOT NULL
ORDER BY emp_id, valid_from`,
    } },
    { real: 'The SCD2 dimension is the table the whole organisation ends up trusting, so protect it like a ledger. In a real project: write the **business rule per column** (which attributes are Type 2, which are corrected in place) and get it signed off; load inside **one transaction** with the integrity check as the last statement; keep the **raw snapshots** (bronze layer) so the dimension can be **rebuilt** from them when a rule changes; and put the **integrity check on a schedule**, with an alert. Also name the reports. A finance report built "as was" and one built "as is" can give different totals for the same month, and the first time someone puts both in one pack, you want the headers to explain why.' },
    { interview: '"How do you track history of a changing attribute in a warehouse, and how do you query it?" Model answer: "I use a Type 2 slowly changing dimension. Each version of the entity is a row with a surrogate key, the business key, the tracked attributes, valid_from and valid_to dates, and an is_current flag. When a tracked attribute changes, I close the current row the day before and insert a new open row, in one transaction; if there is no reliable change log I detect changes by comparing a null-safe hash of the tracked columns with the current row. In SQL I can do it with an UPDATE and an INSERT, or with one MERGE where changed rows are fed twice, once with the real key to close the old row and once with a NULL key to insert the new one. Facts are joined as-was with BETWEEN valid_from AND valid_to on the fact date, or as-is on the current row. I protect it with a unique partial index for one open row per key, an integrity query for gaps and overlaps, and a rule for late-arriving changes: find the row that covers the effective date and split it." Follow-up: "Which attributes would you not version?" (corrections such as spelling, and attributes nobody reports on by history; those stay Type 1).' },
    `## Recap
- **Type 2** keeps history: one row per **version** with a surrogate key, the business key, the tracked attributes, \`valid_from\`, \`valid_to\` (open row = \`9999-12-31\`) and \`is_current\`. Settle the end-date convention (inclusive here) and never mix it with half-open ranges.
- Choose per column: **Type 2** for changes reports must reproduce (department, city), **Type 1** for corrections (a spelling), applied in place on every version.
- **Nightly load from a snapshot**: compare a null-safe **hash** with the current row, **close** changed rows (\`valid_to = run_date - 1\`), **insert** new versions and new keys, fix Type 1 columns, all in one transaction. A leaver's current row is closed, never deleted.
- **MERGE** can do it in one statement by feeding each changed employee **twice**: with its real key (\`WHEN MATCHED\` closes the old row) and with a **NULL key** (\`WHEN NOT MATCHED\` inserts the new version). \`RETURNING merge_action()\` shows what happened.
- **Point in time**: as-was join with \`run_month BETWEEN valid_from AND valid_to\`, as-is join on \`is_current\`, snapshot on a date, time in role. State which one a report uses.
- **Integrity**: no gaps, no overlaps, no negative rows, exactly one open row per key. Check with \`LEAD\` after every load, enforce one open row with a **unique partial index**, and forbid overlaps with an **exclusion constraint** where \`btree_gist\` is available.
- **Late-arriving change**: find the row that **covers the effective date** and **split** it, keeping its old end date. The naive "close the current row" loader corrupts the history.`,
  ],
  quiz: [
    { q: 'An employee moves department on 1 September. In a Type 2 dimension, what are the two steps?', o: ['Update the department in the existing row', 'Insert a second row and delete the first', 'Close the old row (valid_to = 31 August, is_current = false) and insert a new open row valid from 1 September', 'Add a previous_department column'], a: 2, why: 'Type 2 keeps every version as its own row. The old version ends the day before and the new version starts on the change date, so a join on the date range finds exactly one row.' },
    { q: 'Why does a MERGE-based SCD2 load feed each changed employee into the source twice?', o: ['To make the MERGE run faster', 'Because MERGE acts once per source row: one copy with the real key closes the old row, the other with a NULL key cannot match and inserts the new version', 'To count the changes', 'Because MERGE cannot handle new employees otherwise'], a: 1, why: 'A single source row can trigger only one WHEN branch. The NULL-keyed copy falls into WHEN NOT MATCHED and inserts the new version, while the real-keyed copy matches the current row and closes it.' },
    { q: 'What is an "as-was" join?', o: ['A join that attaches the current dimension row to every fact', 'A join on the surrogate key only', 'A join that ignores dates', 'A join that attaches to each fact the dimension version valid on the fact\'s date (fact_date BETWEEN valid_from AND valid_to)'], a: 3, why: 'As-was reproduces what was true when the fact happened. As-is (join on is_current) restates all history in today\'s structure. Reports should say which one they use.' },
    { q: 'Which defect in a Type 2 history makes a fact be counted twice?', o: ['Two versions of an employee overlap, so a date matches both', 'A gap between two versions', 'The open row ends at 9999-12-31', 'A surrogate key that is larger than the business key'], a: 0, why: 'If two rows both cover the same date, the as-was join returns two rows for each fact on that date, doubling its amount. A LEAD-based check or an exclusion constraint prevents it.' },
    { q: 'The Operations move (1 November) is loaded. Then the missed move to Finance on 1 September arrives. What does the correct loader do?', o: ['Closes the current Operations row on 31 August and opens Finance as the current row', 'Ignores the late change', 'Finds the row covering 1 September (Sales), shortens it to 31 August and inserts Finance from 1 September to the end date the old row had', 'Deletes the employee and reloads everyone'], a: 2, why: 'The effective date decides where the new version goes, not the order of arrival. Splitting the covering row keeps the later Operations row untouched and leaves no gap or overlap.' },
    { q: 'Which statement enforces, inside the database, that an employee has at most one current row?', o: ['CREATE INDEX ON dim_employee_scd (emp_id)', 'CREATE UNIQUE INDEX ON dim_employee_scd (emp_id) WHERE is_current', 'ALTER TABLE ADD CHECK (is_current)', 'CREATE UNIQUE INDEX ON dim_employee_scd (valid_from)'], a: 1, why: 'A unique partial index applies the uniqueness rule only to the rows where is_current is true, so any number of closed versions is fine but a second open row is rejected.' },
  ],
  task: {
    title: 'Build a Type 2 employee dimension and break it on purpose',
    steps: [
      'Create `33_scd2.sql` in `C:\\sql-practice`. Create `dim_employee_scd` with the unique partial index, load day 1 from `employees`, and build the day-2 snapshot (two moves, one name correction, one new hire).',
      'Apply day 2 with the `UPDATE` plus `INSERT` and write the version and open-row counts. Then reset (drop and rebuild the day-1 table) and apply it again with the single `MERGE` and `RETURNING merge_action()`. Prove with `EXCEPT` that both give the same table.',
      'Write the as-was and as-is payroll reports by department and month. Describe in one comment which cells differ and why. Add the headcount snapshot on 31 August and 1 September.',
      'Create the integrity view with `LEAD`. Load the late change the naive way on a copy and show the three problems the view reports. Then load it with the split and show the view returns nothing.',
      'Try to insert a second open row for one employee and write down the error. Then, with `btree_gist`, build the range-based table from the callout and write down the exclusion-constraint error for an overlapping row.',
      'Add a leaver: remove one employee from the snapshot and extend the load to close their current row without deleting history. Write what you would ask HR before deciding the closing date.',
    ],
    deliverable: '`33_scd2.sql` with the commands you ran and, in comments, the row counts for both load methods, the `EXCEPT` check result, the as-was and as-is differences, the naive-loader problems, the problem count after the split, the two error messages, and your note on the leaver.',
  },
};
