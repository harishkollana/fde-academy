// Data-quality rules of the lesson as a view: one row per rule with how many rows failed and how many were checked.
const DQ_CHECKS = `CREATE VIEW dq_checks AS
SELECT 'R1' AS rule_id, 'fact_gl duplicate lines' AS rule_name, 'critical' AS severity, 0.0 AS max_fail_pct,
       (SELECT COUNT(*) FROM (SELECT ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit ORDER BY gl_id) AS rn
                              FROM fact_gl) x WHERE rn > 1) AS failed_rows,
       (SELECT COUNT(*) FROM fact_gl) AS total_rows
UNION ALL
SELECT 'R2', 'unbalanced journals', 'critical', 0.0,
       (SELECT COUNT(*) FROM (SELECT journal_id FROM fact_gl GROUP BY journal_id HAVING SUM(debit) <> SUM(credit)) x),
       (SELECT COUNT(DISTINCT journal_id) FROM fact_gl)
UNION ALL
SELECT 'R3', 'employees with an invalid IFSC', 'warning', 5.0,
       (SELECT COUNT(*) FROM employees WHERE ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'), (SELECT COUNT(*) FROM employees)
UNION ALL
SELECT 'R4', 'orders with an unknown customer', 'critical', 0.0,
       (SELECT COUNT(*) FROM orders o WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id)), (SELECT COUNT(*) FROM orders)
UNION ALL
SELECT 'R5', 'orders with no status', 'warning', 2.0,
       (SELECT COUNT(*) FROM orders WHERE status IS NULL), (SELECT COUNT(*) FROM orders);`;

export default {
  id: 'sql-data-quality',
  title: 'Data quality in SQL: profiling, duplicates, validity, orphans, outliers and layer reconciliation',
  goal: 'You can profile a table, find duplicates, orphans, invalid values, outliers and missing periods with SQL, turn the checks into a rule table with severities and a results table, and prove that no rows were lost between the bronze, silver and gold layers.',
  roadmap: [
    'Duplicates and null rates',
    'Orphans, ranges and outliers',
    'Quality rules, severity and results',
    'Layer reconciliation',
  ],
  blocks: [
    `## The problem
The CFO looks at the revenue dashboard and asks one question: *"How do you know this number is right?"*

An honest engineer who has worked with the Kollana data can already answer part of it, because the data was built with **planted mistakes**, the kind real systems contain:

- **3 journal lines are duplicated** (same journal, account, date and amount, a different \`gl_id\`),
- **4 journals do not balance** (debit is not equal to credit): three because of those duplicates, one because a debit was inflated by 500,
- **34 lines in February 2026 have no exchange rate**, because the SGD rate for that month is missing,
- **one order belongs to a customer that does not exist** (order 77, customer 99),
- **two employees have an invalid IFSC**, **two have no PAN**, **two share a bank account**,
- **one salary jumped 2.4 times** from August to September,
- **nine orders have no status**.

A dashboard built on this data without checks will be wrong, and nobody will notice until an auditor does. **Data quality is the discipline of finding problems like these automatically, every day, before the numbers are used.** In this lesson you write the checks in SQL, organise them into a system, and learn the most important control of all: proving that **no rows were silently lost** between the layers of a pipeline.`,
    `## What "quality" means: six questions
Quality is not one thing. It is a list of questions, each with its own kind of check:

| Dimension | The question | A Kollana example | The check |
|---|---|---|---|
| **Completeness** | Is anything missing? | PAN is empty for 2 employees. SGD rate missing for February 2026 | null counts, a calendar of expected periods against what exists |
| **Uniqueness** | Is anything there twice? | 3 duplicated journal lines. 2 employees on one bank account | \`GROUP BY ... HAVING COUNT(*) > 1\` |
| **Validity** | Does it look right? | IFSC \`HDFC123456\` is not a valid code | regex, allowed values, ranges |
| **Consistency** | Do related facts agree? | 4 journals where debit is not equal to credit | cross-table and cross-row rules |
| **Integrity** | Do references exist? | Order 77 points to customer 99, who does not exist | anti-join (\`NOT EXISTS\`) |
| **Plausibility** | Is it believable? | Gross pay of employee 6 jumps 2.4 times in a month | ratios, z-scores, comparison with the previous period |

Two more matter for pipelines: **timeliness** (did the data arrive when expected?) and **reconciliation** (do the totals agree between systems and layers?).

Where to check? **At every layer**, with different rules:`,
    { sketch: { w: 760, h: 300, caption: 'Checks belong at every layer. Bad rows go to a quarantine table with a reason, never silently into the report, and never silently away.', items: [
      { t: 'box', x: 10, y: 20, w: 150, h: 70, label: 'Source / bronze', sub: 'raw, as received', fill: 'grey', size: 17 },
      { t: 'arrow', x1: 162, y1: 55, x2: 206, y2: 55 },
      { t: 'box', x: 208, y: 20, w: 150, h: 70, label: 'Silver', sub: 'typed, deduplicated', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 360, y1: 55, x2: 404, y2: 55 },
      { t: 'box', x: 406, y: 20, w: 150, h: 70, label: 'Gold', sub: 'reports, aggregates', fill: 'green', size: 17 },
      { t: 'arrow', x1: 558, y1: 55, x2: 602, y2: 55 },
      { t: 'box', x: 604, y: 20, w: 146, h: 70, label: 'Dashboard', sub: 'what people see', fill: 'yellow', size: 17 },
      { t: 'note', x: 10, y: 108, w: 180, h: 84, fill: 'grey', size: 13, text: 'arrived? (timeliness)\nfile complete? row count\nnot empty, columns as\nexpected' },
      { t: 'note', x: 208, y: 108, w: 150, h: 84, fill: 'blue', size: 13, text: 'types cast, ranges,\nvalid codes, duplicates,\norphans, NULL rules' },
      { t: 'note', x: 406, y: 108, w: 150, h: 84, fill: 'green', size: 13, text: 'totals equal silver,\nbalances balance,\nno outliers' },
      { t: 'note', x: 604, y: 108, w: 146, h: 84, fill: 'yellow', size: 13, text: 'freshness shown,\nknown issues\nfootnoted' },
      { t: 'arrow', x1: 283, y1: 194, x2: 283, y2: 226 },
      { t: 'box', x: 188, y: 228, w: 190, h: 52, label: 'quarantine table', sub: 'bad rows + reason', fill: 'pink', size: 16 },
      { t: 'note', x: 396, y: 226, w: 354, h: 62, fill: 'yellow', size: 13, text: 'RECONCILE every hop:\nrows in = rows out + rejected + deduplicated.\nAny difference you cannot explain is a bug.' },
    ] } },
    `## Step 1: profile before you check
You cannot write sensible rules for a table you have not looked at. A **profile** is a one-screen summary of every column: how many rows, how many \`NULL\`s, how many distinct values. It takes one query, and it points you at the next questions. A column with 20 rows and 20 distinct values looks like a key. A column with 2 \`NULL\`s needs a rule. A column with 19 distinct values in 20 rows has a duplicate.

The query below profiles **any** table without naming its columns: it reads the column names from \`information_schema\` and runs one counting query per column (the \`query_to_xml\` trick from the operations lesson).`,
    { sql: {
      title: 'Profile every column of a table in one query',
      starter: `-- Change 'employees' to 'orders', 'customers', 'payroll' ... in the two places it appears to profile another table.
SELECT c.column_name,
       c.data_type,
       (xpath('/row/n/text()', query_to_xml(format('SELECT COUNT(*) AS n FROM %I', 'employees'), false, true, '')))[1]::text::int AS total_rows,
       (xpath('/row/n/text()', query_to_xml(format('SELECT COUNT(*) AS n FROM %I WHERE %I IS NULL', 'employees', c.column_name), false, true, '')))[1]::text::int AS null_count,
       (xpath('/row/n/text()', query_to_xml(format('SELECT COUNT(DISTINCT %I) AS n FROM %I', c.column_name, 'employees'), false, true, '')))[1]::text::int AS distinct_values
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name = 'employees'
ORDER BY c.ordinal_position;

-- The columns of orders that contain NULLs, with the null rate
SELECT c.column_name,
       (xpath('/row/n/text()', query_to_xml(format('SELECT COUNT(*) FILTER (WHERE %I IS NULL) AS n FROM %I', c.column_name, 'orders'), false, true, '')))[1]::text::int AS null_count,
       ROUND(100.0 * (xpath('/row/n/text()', query_to_xml(format('SELECT COUNT(*) FILTER (WHERE %I IS NULL) AS n FROM %I', c.column_name, 'orders'), false, true, '')))[1]::text::int
             / (SELECT COUNT(*) FROM orders), 1) AS null_pct
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.table_name = 'orders'
ORDER BY null_count DESC, c.ordinal_position
LIMIT 3;`,
      note: 'For employees (20 rows): manager_id has 1 NULL (the top boss), pan has 2 NULLs (employees 9 and 18) and 18 distinct values, bank_account has 19 distinct values in 20 rows (two employees share one account), emp_id, emp_name, hire_date and ifsc have 20 distinct values. For orders the only column with NULLs is status, with 9 NULLs, 4.1 percent of the 220 orders. The profile did not need to know the columns in advance.',
    } },
    `## Step 2: uniqueness: find the duplicates
There are three kinds of "the same row twice", and you should name which one you are looking for:

1. **Exact duplicates**: every business column is identical (only a technical id such as \`gl_id\` differs). Group by all business columns.
2. **Business-key duplicates**: the same invoice number and supplier, but the amounts differ. Group by the **key**, then look at what differs.
3. **Fuzzy duplicates**: "Sharma & Co" and "Sharma and Co." (the fuzzy matching of the reconciliation lesson). Group by a cleaned or similarity key.

Finding duplicates is a \`GROUP BY ... HAVING COUNT(*) > 1\`. **Removing** them needs a rule for which copy to keep. The standard is \`ROW_NUMBER()\` over the business columns, ordered by the technical id, and then keep row number 1. **Do the delete on a copy or move the extras to a quarantine table first**: in finance you must be able to show an auditor what you removed and why.`,
    { sql: {
      title: 'Find exact duplicates, keep one copy, and list shared bank accounts',
      starter: `-- 1) Exact duplicates in fact_gl: same journal, entity, BU, account, date, debit and credit
SELECT journal_id, TO_CHAR(posting_date, 'YYYY-MM-DD') AS posting_date, debit, credit,
       COUNT(*) AS copies, array_agg(gl_id ORDER BY gl_id) AS gl_ids
FROM fact_gl
GROUP BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit
HAVING COUNT(*) > 1
ORDER BY journal_id;

-- 2) Keep the first copy (lowest gl_id) of each, quarantine the rest, and delete them from a COPY of the table
CREATE TABLE fact_gl_clean AS SELECT * FROM fact_gl;
CREATE TABLE fact_gl_quarantine AS
SELECT *, 'exact duplicate of an earlier line' AS reason
FROM (SELECT g.*, ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit ORDER BY gl_id) AS rn
      FROM fact_gl_clean g) x
WHERE rn > 1;
DELETE FROM fact_gl_clean WHERE gl_id IN (SELECT gl_id FROM fact_gl_quarantine);
SELECT (SELECT COUNT(*) FROM fact_gl) AS before_rows, (SELECT COUNT(*) FROM fact_gl_clean) AS after_rows, (SELECT COUNT(*) FROM fact_gl_quarantine) AS quarantined;

-- 3) Business-key duplicates: two employees with the same bank account (a classic payroll fraud signal)
SELECT e.bank_account, e.emp_id, e.emp_name, e.department
FROM employees e
WHERE e.bank_account IN (SELECT bank_account FROM employees GROUP BY bank_account HAVING COUNT(*) > 1)
ORDER BY e.bank_account, e.emp_id;`,
      note: 'The duplicates are in journals JV202504-0009 (gl_ids 18 and 1225), JV202506-0117 (234 and 1226) and JV202509-0256 (512 and 1227): 3 groups of 2 copies. The clean copy has 1224 rows instead of 1227 and the quarantine table holds the 3 removed lines (gl_id 1225, 1226 and 1227) with the reason. Employees 4 (Meera Sharma, Sales) and 12 (Kavya Sharma, Finance) share the bank account 47860558007: not necessarily wrong, but a payroll control would ask for an explanation.',
    } },
    `## Step 3: validity, integrity, consistency and plausibility
Each check is a query that returns the **bad rows**. If it returns nothing, the rule passes. You already know the building blocks:

- **Validity**: a regex (\`ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'\`), a list of allowed values, a range. Remember the \`NULL\` trap from the strings lesson: \`NULL !~ pattern\` is \`NULL\`, not true, so test \`IS NULL\` separately.
- **Integrity (orphans)**: \`WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id)\`. Prefer \`NOT EXISTS\` to \`NOT IN\`, which breaks when the list contains a \`NULL\`.
- **Consistency**: a rule across rows. A journal must balance: \`GROUP BY journal_id HAVING SUM(debit) <> SUM(credit)\`.
- **Plausibility**: compare with the previous period (\`LAG\`) and flag a ratio outside a band, say above 1.5 or below 0.67.
- **Completeness of periods**: build the **calendar of what should exist** with \`generate_series\`, then anti-join to what exists. This finds the **missing** SGD rate for February, which no \`NULL\` check can see, because the row simply is not there.`,
    { sql: {
      title: 'Six checks, each returning the bad rows',
      starter: `-- 1) Validity: IFSC codes that do not match the pattern
SELECT emp_id, ifsc FROM employees WHERE ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$' ORDER BY emp_id;

-- 2) Completeness: PAN is NULL
SELECT emp_id, emp_name FROM employees WHERE pan IS NULL ORDER BY emp_id;

-- 3) Integrity: orders whose customer does not exist
SELECT o.order_id, o.customer_id, o.amount FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id);

-- 4) Consistency: journals where debit is not equal to credit
SELECT journal_id, SUM(debit) AS debit, SUM(credit) AS credit, SUM(debit) - SUM(credit) AS difference
FROM fact_gl GROUP BY journal_id HAVING SUM(debit) <> SUM(credit) ORDER BY journal_id;

-- 5) Plausibility: gross pay at least 1.5 times last month's
WITH p AS (SELECT emp_id, run_month, gross_pay, LAG(gross_pay) OVER (PARTITION BY emp_id ORDER BY run_month) AS previous FROM payroll)
SELECT emp_id, TO_CHAR(run_month, 'YYYY-MM') AS month, previous, gross_pay, ROUND(gross_pay / previous, 2) AS ratio
FROM p WHERE previous IS NOT NULL AND gross_pay / previous >= 1.5;

-- 6) Completeness of periods: foreign currencies and months of FY 2025-26 without an exchange rate
WITH months AS (SELECT DATE '2025-04-01' + n * INTERVAL '1 month' AS month FROM generate_series(0, 11) AS n),
     currencies AS (SELECT DISTINCT currency FROM fx_rates WHERE currency <> 'INR')
SELECT cur.currency, TO_CHAR(m.month, 'YYYY-MM') AS missing_month,
       (SELECT COUNT(*) FROM fact_gl g JOIN dim_entity e USING (entity_id)
        WHERE e.currency = cur.currency AND DATE_TRUNC('month', g.posting_date)::date = m.month::date) AS gl_lines_affected
FROM currencies cur
CROSS JOIN months m
WHERE NOT EXISTS (SELECT 1 FROM fx_rates f WHERE f.currency = cur.currency AND f.rate_month = m.month::date)
ORDER BY cur.currency, m.month;`,
      note: 'Check 1: employees 7 (HDFC123456) and 14 (sbin0001234, lower case). Check 2: employees 9 (Vikram Reddy) and 18 (Lakshmi Varma). Check 3: order 77, customer 99. Check 4: four journals, JV202504-0009 (debit 59006.88, credit 118013.76), JV202504-0051 (704.10 against 204.10, the debit inflated by 500), JV202506-0117 and JV202509-0256. Check 5: employee 6, 108333.33 in August and 259999.99 in September, a ratio of 2.40. Check 6: SGD has no rate for 2026-02, and 34 journal lines are affected. Each check lists the exact rows, so a person can fix them.',
    } },
    `## Step 4: from queries to a system
Fifteen checks scattered in notebooks are not a quality process. A process has four parts:

1. **A rule table or view**: each rule has an id, a name, a **severity** and a threshold, and a query that returns *how many rows failed* and *how many were checked*.
2. **A results table**: every run writes one row per rule: run id, time, failed, total, **status**. History lets you see trends ("duplicates are growing") and prove what was checked when.
3. **Severity decides what happens.** A **critical** rule (a journal that does not balance, an orphan payment) **blocks** the load or the report. A **warning** (a missing PAN on 10% of employees) is reported and tracked but does not stop the pipeline. Thresholds make the rule honest: "0 failures allowed" for money, "at most 2%" for a descriptive field.
4. **Bad rows are quarantined, not dropped**, with the reason, so someone can fix the source and re-run.

Tools such as dbt tests, Great Expectations and Soda implement exactly this idea with their own syntax. Learn it in SQL once and every tool will look familiar.`,
    { sql: {
      title: 'A rule view, a results table, and the effect of a fix',
      setup: DQ_CHECKS,
      starter: `-- dq_checks is a view with one row per rule: rule_id, rule_name, severity, max_fail_pct, failed_rows, total_rows.
-- A results table keeps the history of every run.
CREATE TABLE dq_results (run_id int, rule_id text, rule_name text, severity text, failed_rows bigint, total_rows bigint, failed_pct numeric, status text);

-- RUN 1: the data as it is. FAIL = critical rule above its threshold, WARN = warning rule above its threshold, PASS otherwise.
INSERT INTO dq_results
SELECT 1, rule_id, rule_name, severity, failed_rows, total_rows,
       ROUND(100.0 * failed_rows / total_rows, 1) AS failed_pct,
       CASE WHEN 100.0 * failed_rows / total_rows <= max_fail_pct THEN 'PASS'
            WHEN severity = 'critical' THEN 'FAIL' ELSE 'WARN' END
FROM dq_checks;

-- Fix the duplicates (delete the extra copies), then RUN 2 with the same rules
DELETE FROM fact_gl WHERE gl_id IN (
  SELECT gl_id FROM (SELECT gl_id, ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit ORDER BY gl_id) AS rn FROM fact_gl) x WHERE rn > 1);
INSERT INTO dq_results
SELECT 2, rule_id, rule_name, severity, failed_rows, total_rows,
       ROUND(100.0 * failed_rows / total_rows, 1),
       CASE WHEN 100.0 * failed_rows / total_rows <= max_fail_pct THEN 'PASS'
            WHEN severity = 'critical' THEN 'FAIL' ELSE 'WARN' END
FROM dq_checks;

-- The scorecard of the last run
SELECT rule_id, rule_name, severity, failed_rows, total_rows, failed_pct, status FROM dq_results WHERE run_id = 2 ORDER BY rule_id;

-- Run 1 against run 2: what changed? (a monitoring view)
SELECT a.rule_id, a.rule_name, a.failed_rows AS failed_run_1, b.failed_rows AS failed_run_2, a.status AS status_run_1, b.status AS status_run_2
FROM dq_results a JOIN dq_results b ON b.rule_id = a.rule_id AND b.run_id = 2
WHERE a.run_id = 1 AND a.failed_rows <> b.failed_rows
ORDER BY a.rule_id;`,
      note: 'Run 1: R1 (duplicate lines) fails with 3 of 1227, R2 (unbalanced journals) fails with 4 of 612, R3 (invalid IFSC) is a WARN with 2 of 20 (10.0 percent against a 5.0 limit), R4 (unknown customer) fails with 1 of 220, R5 (no status) is a WARN with 9 of 220 (4.1 percent against 2.0). After deleting the 3 extra copies, run 2 shows R1 with 0 failures (PASS, 0 of 1224) and R2 with only 1 unbalanced journal left (JV202504-0051): the three other imbalances were caused by the duplicates. The comparison query lists exactly these two rules. One fix cleared one rule and shrank another, which is why you re-run all the rules after any fix.',
    } },
    `## Step 5: reconcile the layers
The most valuable data-quality control is the simplest: **count rows and add up amounts at every hop, and explain every difference.** The identity to prove:

\`\`\`text
rows in bronze  =  rows in silver  +  rows quarantined  +  duplicates dropped
rows in gold (sum of its counts)  =  rows in silver
amount in gold  =  amount in silver
\`\`\`

If the identity holds, nothing was lost silently. If it does not, you have found a bug (a filter that drops \`NULL\`s, an inner join that loses unmatched rows) **before** a user finds it. Reconciliation catches the failures that no individual rule can imagine.`,
    { sketch: { w: 760, h: 296, caption: 'A reconciliation waterfall. Every row that leaves a layer is accounted for: rejected, deduplicated, or passed on.', items: [
      { t: 'box', x: 14, y: 40, w: 170, h: 70, label: 'bronze: 225 rows', sub: 'as received', fill: 'grey', size: 17 },
      { t: 'arrow', x1: 186, y1: 75, x2: 226, y2: 75 },
      { t: 'box', x: 228, y: 40, w: 200, h: 70, label: 'silver: 221 rows', sub: 'typed, unique', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 430, y1: 75, x2: 470, y2: 75 },
      { t: 'box', x: 472, y: 40, w: 240, h: 70, label: 'gold: 221 orders', sub: 'monthly by channel', fill: 'green', size: 17 },
      { t: 'arrow', x1: 120, y1: 112, x2: 120, y2: 150, color: '#c2410c' },
      { t: 'note', x: 14, y: 152, w: 232, h: 78, fill: 'pink', size: 14, text: '2 quarantined (bad date,\namount N/A)\n2 duplicates dropped (re-sent file)\n225 - 2 - 2 = 221' },
      { t: 'note', x: 262, y: 152, w: 230, h: 78, fill: 'green', size: 14, text: 'expected silver = 221\nactual silver = 221\nunexplained = 0' },
      { t: 'note', x: 508, y: 152, w: 242, h: 78, fill: 'pink', size: 14, text: 'a silver step with WHERE status\nIS NOT NULL would give 212:\n9 rows UNEXPLAINED = a bug' },
      { t: 'note', x: 14, y: 244, w: 736, h: 40, fill: 'yellow', size: 14, text: 'Also compare amounts: SUM(amount) must match between silver and gold, and between the source system and bronze.' },
    ] } },
    { sql: {
      title: 'Bronze, silver, gold: quarantine, deduplicate, reconcile, and catch a bug',
      starter: `-- BRONZE: a raw load, every column as text, as received. 220 good rows plus a re-sent file with 5 extra rows.
CREATE TABLE bronze_orders AS
SELECT order_id::text AS order_id, order_date::text AS order_date, customer_id::text AS customer_id, product_id::text AS product_id,
       qty::text AS qty, channel, amount::text AS amount, status, 'orders_2026-03.csv' AS source_file
FROM orders;
INSERT INTO bronze_orders VALUES
  ('3',   '2025-04-03', '1', '2', '1', 'Online',  '1.00',     'Shipped',   'orders_2026-03_resend.csv'),   -- a duplicate order id
  ('4',   '2025-04-03', '1', '2', '1', 'Online',  '1.00',     'Shipped',   'orders_2026-03_resend.csv'),   -- a duplicate order id
  ('301', '2026-03-29', '4', '1', '2', 'Partner', '12500.00', 'Shipped',   'orders_2026-03_resend.csv'),   -- a good new order
  ('302', '2026-02-30', '5', '3', '1', 'Direct',  '8000.00',  'Delivered', 'orders_2026-03_resend.csv'),   -- 30 February does not exist
  ('303', '2026-03-30', '6', '2', '1', 'Online',  'N/A',      'Shipped',   'orders_2026-03_resend.csv');   -- amount is not a number

-- pg_input_is_valid(text, type) tests a cast WITHOUT failing: ideal for validity checks on raw text
SELECT order_id, pg_input_is_valid(order_date, 'date') AS date_ok, pg_input_is_valid(amount, 'numeric') AS amount_ok
FROM bronze_orders WHERE order_id IN ('301', '302', '303') ORDER BY order_id;

-- QUARANTINE: rows that cannot be cast, with the reason
CREATE TABLE quarantine_orders AS
SELECT b.*, CASE WHEN NOT pg_input_is_valid(b.order_date, 'date') THEN 'invalid date' WHEN NOT pg_input_is_valid(b.amount, 'numeric') THEN 'invalid amount' END AS reason
FROM bronze_orders b
WHERE NOT pg_input_is_valid(b.order_date, 'date') OR NOT pg_input_is_valid(b.amount, 'numeric');

-- SILVER: typed, valid, one row per order_id (the earliest file wins)
CREATE TABLE silver_orders AS
SELECT DISTINCT ON (b.order_id::int)
       b.order_id::int AS order_id, b.order_date::date AS order_date, b.customer_id::int AS customer_id, b.product_id::int AS product_id,
       b.qty::int AS qty, b.channel, b.amount::numeric AS amount, b.status
FROM bronze_orders b
WHERE pg_input_is_valid(b.order_date, 'date') AND pg_input_is_valid(b.amount, 'numeric')
ORDER BY b.order_id::int, b.source_file;

-- GOLD: monthly totals by channel
CREATE TABLE gold_orders_month AS
SELECT DATE_TRUNC('month', order_date)::date AS month, channel, COUNT(*) AS orders, SUM(amount) AS amount
FROM silver_orders GROUP BY 1, 2;

-- RECONCILIATION: rows in bronze = silver + quarantined + duplicates dropped
WITH b AS (SELECT COUNT(*) AS rows FROM bronze_orders),
     q AS (SELECT COUNT(*) AS rows FROM quarantine_orders),
     d AS (SELECT COUNT(*) - COUNT(DISTINCT order_id) AS extra
           FROM bronze_orders WHERE pg_input_is_valid(order_date, 'date') AND pg_input_is_valid(amount, 'numeric')),
     s AS (SELECT COUNT(*) AS rows FROM silver_orders)
SELECT b.rows AS bronze, q.rows AS quarantined, d.extra AS duplicates_dropped,
       b.rows - q.rows - d.extra AS expected_silver, s.rows AS silver,
       s.rows - (b.rows - q.rows - d.extra) AS unexplained
FROM b, q, d, s;

-- Silver against gold: counts and amounts must match
SELECT (SELECT COUNT(*) FROM silver_orders) AS silver_rows, (SELECT SUM(orders) FROM gold_orders_month) AS gold_orders,
       (SELECT SUM(amount) FROM silver_orders) AS silver_amount, (SELECT SUM(amount) FROM gold_orders_month) AS gold_amount;

-- A BUGGY silver step (WHERE status IS NOT NULL) and what the reconciliation says about it
CREATE TABLE silver_bug AS SELECT * FROM silver_orders WHERE status IS NOT NULL;
SELECT (SELECT COUNT(*) FROM silver_orders) - (SELECT COUNT(*) FROM silver_bug) AS unexplained_rows_lost,
       (SELECT SUM(amount) FROM silver_orders WHERE status IS NULL) AS unexplained_amount_lost;`,
      note: 'Bronze has 225 rows. The quarantine holds 2 (order 302: invalid date, because 30 February does not exist, and order 303: invalid amount, N/A). Silver has 221 rows: 225 - 2 quarantined - 2 duplicates dropped (orders 3 and 4 re-sent in the second file, where the earliest file wins). The reconciliation says expected_silver = 221, silver = 221, unexplained = 0. Silver and gold agree: 221 orders and an amount of 20992775.00 (the 20980275.00 of the original 220 orders plus the new order 301 of 12500.00). The buggy silver_bug keeps only 212 rows: the reconciliation shows 9 rows and 575410.00 of amount lost with no explanation, which is exactly how a silent bug looks.',
    } },
    { warn: '**Do not "fix" data quality by deleting inconvenient rows from the source or the warehouse.** Duplicates, orphans and invalid rows are **evidence**. Move them to a quarantine table with a reason and a date, fix them at the source where possible, and keep a count in the report footnote ("3 duplicate lines excluded, see DQ-2026-04"). A number that quietly changes because someone removed rows cannot be audited. A number with a footnote can.' },
    { local: `**Make the checks part of a nightly job** (psql, \`fde_practice\` database). Save the rule view and the results table in \`35_data_quality.sql\`, and run it so that a failed **critical** rule stops the pipeline:
\`\`\`powershell
$env:PGPASSWORD = 'your-password'
psql -U postgres -d fde_practice -v ON_ERROR_STOP=1 -f C:\\sql-practice\\35_data_quality.sql
psql -U postgres -d fde_practice -t -A -c "SELECT COUNT(*) FROM dq_results WHERE run_id = (SELECT MAX(run_id) FROM dq_results) AND status = 'FAIL';"
\`\`\`
**What to expect:** the second command prints one number: how many critical rules failed in the latest run. Your scheduler (Task Scheduler, Airflow, an Azure Function) treats a number above 0 as a reason to **stop** the downstream steps and send an alert. Warnings are only logged. Keep the results table for months, because the trend ("duplicates doubled this quarter") is often more valuable than any single run.` },
    `## Practice
Three tasks on the real Kollana data: a null-rate report, duplicates with the ids to remove, and a scorecard with severities.`,
    { challenge: {
      id: 'sql-data-quality-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'A null-rate report for three columns. Return `table_name`, `column_name`, `null_count`, `total_rows` and `null_pct` (1 decimal) for `employees.manager_id`, `employees.pan` and `orders.status`, **only where `null_count` is greater than 0**, sorted by `null_pct` descending. (3 rows.)',
      starter: `SELECT 'employees' AS table_name, 'pan' AS column_name,
       COUNT(*) FILTER (WHERE pan IS NULL) AS null_count, COUNT(*) AS total_rows
FROM employees`,
      hint: "Build one row per column with SELECT ... FROM employees and UNION ALL, each with COUNT(*) FILTER (WHERE col IS NULL) and COUNT(*). Wrap them in a subquery to add null_pct = ROUND(100.0 * null_count / total_rows, 1), filter null_count > 0 and sort.",
      solution: `SELECT table_name, column_name, null_count, total_rows,
       ROUND(100.0 * null_count / total_rows, 1) AS null_pct
FROM (
  SELECT 'employees' AS table_name, 'manager_id' AS column_name, COUNT(*) FILTER (WHERE manager_id IS NULL) AS null_count, COUNT(*) AS total_rows FROM employees
  UNION ALL
  SELECT 'employees', 'pan', COUNT(*) FILTER (WHERE pan IS NULL), COUNT(*) FROM employees
  UNION ALL
  SELECT 'orders', 'status', COUNT(*) FILTER (WHERE status IS NULL), COUNT(*) FROM orders
) t
WHERE null_count > 0
ORDER BY null_pct DESC, column_name`,
    } },
    { challenge: {
      id: 'sql-data-quality-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'List the **exact duplicate** journal lines of `fact_gl`: lines with the same `journal_id`, `entity_id`, `bu_id`, `account_id`, `posting_date`, `debit` and `credit`. For each duplicated group return `journal_id`, `posting_date`, `copies` (how many lines), `keep_gl_id` (the lowest `gl_id`) and `remove_gl_ids` (the other `gl_id` values as text joined with `, `, in order). Sort by `journal_id`. (3 rows.)',
      starter: `SELECT journal_id, posting_date, COUNT(*) AS copies
FROM fact_gl
GROUP BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit
HAVING COUNT(*) > 1
ORDER BY journal_id`,
      hint: "Add MIN(gl_id) AS keep_gl_id. For the ids to remove use string_agg(gl_id::text, ', ' ORDER BY gl_id) FILTER (WHERE gl_id > (the minimum)). A subquery with ROW_NUMBER() over the business columns ordered by gl_id is the easiest way to know which are the extra copies.",
      solution: `WITH r AS (
  SELECT gl_id, journal_id, posting_date,
         ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit ORDER BY gl_id) AS rn,
         COUNT(*) OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit) AS copies
  FROM fact_gl
)
SELECT journal_id, posting_date, MAX(copies) AS copies,
       MIN(gl_id) FILTER (WHERE rn = 1) AS keep_gl_id,
       string_agg(gl_id::text, ', ' ORDER BY gl_id) FILTER (WHERE rn > 1) AS remove_gl_ids
FROM r
WHERE copies > 1
GROUP BY journal_id, posting_date
ORDER BY journal_id`,
    } },
    { challenge: {
      id: 'sql-data-quality-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'A quality scorecard. For each of these six rules return `rule_id`, `failed_rows`, `total_rows`, `failed_pct` (1 decimal) and `status`. Q1: duplicate `fact_gl` lines (the number of **extra** copies, out of all lines); Q2: unbalanced journals (out of all journals); Q3: employees with an invalid IFSC (pattern `^[A-Z]{4}0[A-Z0-9]{6}$`, out of all employees); Q4: employees with no PAN; Q5: orders whose customer does not exist; Q6: orders with no status. Thresholds: Q1, Q2 and Q5 are `critical` with 0.0 allowed; Q3 is `warning` with 5.0 allowed; Q4 is `warning` with 10.0 allowed; Q6 is `warning` with 2.0 allowed. `status` is `PASS` when `failed_pct` is within the threshold (not above it), otherwise `FAIL` for critical rules and `WARN` for warning rules. Sort by `rule_id`. (6 rows.)',
      starter: `SELECT 'Q1' AS rule_id,
       (SELECT COUNT(*) FROM fact_gl) AS total_rows`,
      hint: "Build one row per rule with UNION ALL: rule_id, severity, max_fail_pct, failed_rows (a scalar subquery) and total_rows. The extra copies of Q1 are rows with ROW_NUMBER() > 1 over the business columns; unbalanced journals are GROUP BY journal_id HAVING SUM(debit) <> SUM(credit), counted. Then compute failed_pct and the CASE for status in an outer query.",
      solution: `WITH rules AS (
  SELECT 'Q1' AS rule_id, 'critical' AS severity, 0.0 AS max_fail_pct,
         (SELECT COUNT(*) FROM (SELECT ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date, debit, credit ORDER BY gl_id) AS rn FROM fact_gl) x WHERE rn > 1) AS failed_rows,
         (SELECT COUNT(*) FROM fact_gl) AS total_rows
  UNION ALL
  SELECT 'Q2', 'critical', 0.0,
         (SELECT COUNT(*) FROM (SELECT journal_id FROM fact_gl GROUP BY journal_id HAVING SUM(debit) <> SUM(credit)) x),
         (SELECT COUNT(DISTINCT journal_id) FROM fact_gl)
  UNION ALL
  SELECT 'Q3', 'warning', 5.0, (SELECT COUNT(*) FROM employees WHERE ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'), (SELECT COUNT(*) FROM employees)
  UNION ALL
  SELECT 'Q4', 'warning', 10.0, (SELECT COUNT(*) FROM employees WHERE pan IS NULL), (SELECT COUNT(*) FROM employees)
  UNION ALL
  SELECT 'Q5', 'critical', 0.0, (SELECT COUNT(*) FROM orders o WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id)), (SELECT COUNT(*) FROM orders)
  UNION ALL
  SELECT 'Q6', 'warning', 2.0, (SELECT COUNT(*) FROM orders WHERE status IS NULL), (SELECT COUNT(*) FROM orders)
)
SELECT rule_id, failed_rows, total_rows,
       ROUND(100.0 * failed_rows / total_rows, 1) AS failed_pct,
       CASE WHEN 100.0 * failed_rows / total_rows <= max_fail_pct THEN 'PASS'
            WHEN severity = 'critical' THEN 'FAIL' ELSE 'WARN' END AS status
FROM rules
ORDER BY rule_id`,
    } },
    { real: 'Quality work is mostly about **ownership and agreement**, not clever SQL. For each rule, decide with the business: **who owns the data** and fixes the source, **what severity** it has (does it block the month-end pack or only get reported), **what threshold** is acceptable, and **what the report says** while the issue is open. Put the rule list, owners and thresholds in one reviewed document, run the checks every night, and publish the **scorecard** (pass, warn, fail per rule, with the trend) next to the dashboard. When a number is challenged you can answer with a log: "these checks ran at 02:10, two warnings, none critical, the three duplicate lines were quarantined on 4 April, ticket DQ-118". That is what makes people trust a warehouse.' },
    { interview: '"How do you ensure the data in the warehouse is correct?" Model answer: "In layers. At ingestion I check that the file arrived, is complete and has the expected columns. In the silver layer I cast types with safe tests, validate formats and ranges, find duplicates, orphans and imbalances, and move failing rows to a quarantine table with a reason, never silently dropping them. Each rule has a severity and a threshold: critical rules, such as a journal that does not balance, stop the pipeline, warnings are logged and tracked. Results go to a table so I can see trends. And I reconcile every hop: rows in the bronze layer must equal silver plus quarantined plus deduplicated rows, and the totals of amounts must match between silver and gold. Any unexplained difference is treated as a bug. On top of that I compare key figures with the source system and with the previous period for plausibility." Follow-up: "A check fails at 3 a.m. What happens?" (a critical rule stops downstream jobs and alerts the owner; a warning is logged and shown on the scorecard; the bad rows are in quarantine so the load can be re-run after a fix).' },
    `## Recap
- **Quality** has dimensions: completeness, uniqueness, validity, consistency, integrity, plausibility (plus timeliness and reconciliation). Each has its own kind of check. Check at **every layer**.
- **Profile first**: rows, NULLs and distinct values per column (one query for any table with \`information_schema\` and \`query_to_xml\`).
- **Duplicates**: exact, business-key and fuzzy. \`GROUP BY ... HAVING COUNT(*) > 1\` finds them; \`ROW_NUMBER()\` decides which copy to keep. Quarantine the extras, do not just delete.
- **Rule queries return the bad rows**: regex validity, \`NOT EXISTS\` for orphans, \`SUM(debit) <> SUM(credit)\` for consistency, \`LAG\` ratios for outliers, a \`generate_series\` calendar anti-joined to what exists for **missing periods**.
- **A system, not a script**: a rule view with severity and threshold, a results table with history, critical rules block, warnings report, bad rows go to quarantine with a reason.
- **Reconcile every hop**: bronze = silver + quarantined + duplicates dropped; gold = silver in rows and amounts. An unexplained difference is a bug (the \`WHERE status IS NOT NULL\` that lost 9 rows). \`pg_input_is_valid(text, type)\` tests casts without failing.
- **Never hide bad data by deleting it.** Quarantine, footnote and fix at the source. Re-run all rules after a fix: one fix can change other results.`,
  ],
  quiz: [
    { q: 'Order 77 has `customer_id = 99`, but there is no customer 99. Which dimension of quality is this, and which check finds it?', o: ['Uniqueness, with GROUP BY and HAVING', 'Integrity (an orphan), with NOT EXISTS against the customers table', 'Completeness, with COUNT(*) FILTER (WHERE col IS NULL)', 'Plausibility, with LAG'], a: 1, why: 'A reference to a row that does not exist is an integrity problem. An anti-join (NOT EXISTS) lists the orphans. NOT IN is risky because a NULL in the list makes it return nothing.' },
    { q: 'Why can a NULL check never find the missing SGD exchange rate for February 2026?', o: ['Because SGD is not a real currency', 'Because exchange rates are never NULL', 'Because NULL checks only work on dates', 'Because the row simply does not exist: you must build a calendar of expected periods and anti-join it to what exists'], a: 3, why: 'A missing row has no column to be NULL. Generate the periods that should exist (generate_series) and find those that have no matching row.' },
    { q: 'What is the safest way to handle three duplicate journal lines found in the warehouse?', o: ['DELETE them from the production table at once', 'Ignore them, since the difference is small', 'Keep one copy with ROW_NUMBER, move the others to a quarantine table with a reason, and note it in the report', 'Add them to the totals of the next month'], a: 2, why: 'Duplicates are evidence. Quarantine them with a reason so the removal can be shown to an auditor and fixed at the source.' },
    { q: 'What is the difference between a critical and a warning rule?', o: ['A failed critical rule blocks the load or the report; a warning is reported and tracked but does not stop the pipeline', 'Critical rules run daily, warnings run monthly', 'They are the same, only the names differ', 'Warnings can be deleted, critical rules cannot'], a: 0, why: 'Severity decides the action. A journal that does not balance is critical. A missing PAN on 10 percent of employees is a warning that is tracked until fixed.' },
    { q: 'Bronze has 225 rows, 2 were quarantined and 2 duplicates were dropped, but silver has 212 rows. What does reconciliation tell you?', o: ['Everything is fine', 'The gold layer is wrong', 'Quarantine should be bigger', '9 rows are unexplained: expected silver is 221, so a step lost rows silently, and it is a bug to find'], a: 3, why: 'rows in = rows out + rejected + deduplicated. 225 - 2 - 2 = 221 expected, 212 actual, so 9 rows vanished without a reason, for example through a filter on status IS NOT NULL.' },
    { q: 'After you delete the 3 duplicate journal lines, you re-run all the rules and the unbalanced-journal count drops from 4 to 1. Why?', o: ['The duplicates caused three of the imbalances: with the extra copy gone, those journals balance again', 'The rule is broken', 'The deleted lines were the inflated debits', 'The checks are random'], a: 0, why: 'A duplicated line adds its amount twice to one side of a journal. Removing the extra copy restores the balance. This is why you re-run every rule after a fix.' },
  ],
  task: {
    title: 'Build a data-quality scorecard for the Kollana data',
    steps: [
      'Create `35_data_quality.sql` in `C:\\sql-practice`. Run the profile query for `employees`, `orders`, `payroll` and `fact_gl`. For each table write down which columns have NULLs and which look like keys.',
      'Write the six check queries (IFSC, PAN, orphan orders, unbalanced journals, payroll jump, missing FX month) and paste the bad rows as comments. Add two checks of your own for the tables `purchase_register` and `supplier_invoices` (for example a GSTIN with the wrong length, or an invoice dated outside FY 2025-26).',
      'Create `dq_checks` as a view and `dq_results` as a table. Run all rules as run 1, remove the duplicate lines on a copy of `fact_gl` (with a quarantine table), re-run as run 2 and write the comparison query. Explain why R2 changed.',
      'Create the bronze, silver and gold tables from the lesson with the five problem rows. Write the reconciliation query and prove that it reports 0 unexplained rows. Then add a bug on purpose (an inner join that loses rows) and show the unexplained count.',
      'Add a **severity** and **owner** column to your rule list and write, for each of your rules, what the report footnote should say while the issue is open.',
      'Write the PowerShell line that runs the checks and returns the number of failed critical rules, and describe in two sentences what your scheduler should do with it.',
    ],
    deliverable: '`35_data_quality.sql` with the commands you ran and, in comments, the profile findings, the bad rows of each check, the two run results and their comparison, the reconciliation with and without the bug, and the footnotes for each rule.',
  },
};
