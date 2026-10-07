export default {
  id: 'sql-nulls',
  title: 'NULLs: the value that is not a value',
  goal: 'You can explain what NULL means, filter and test it correctly, replace it with COALESCE and NULLIF, predict how aggregates treat it, and avoid the NOT IN trap.',
  roadmap: [
    'IS NULL, COALESCE, NULLIF',
    'Three-valued logic',
    'NULLs in aggregates; COUNT(*) vs COUNT(col)',
  ],
  blocks: [
    `## The problem
Your sales head asks: *"How many orders were **not** returned?"*

The orders table has 220 rows. 45 of them have the status \`Returned\`. You expect 220 − 45 = 175. You write the obvious filter:

\`\`\`sql
SELECT COUNT(*) FROM orders WHERE status <> 'Returned';
\`\`\`

The answer is **166**. Nine orders have disappeared. They are not in the "returned" group and they are not in the "not returned" group. Those nine orders have **no status at all**. In SQL, "no value" is written \`NULL\`, and \`NULL\` does not behave like anything you know from Excel or from everyday life.

NULLs are behind a large share of wrong totals in real reports. You will meet them in every ERP extract: a missing PAN, an invoice with no due date, an employee with no manager. This lesson gives you the rules once, so they stop surprising you.`,
    `## What NULL means
\`NULL\` means **unknown or missing**. It is not zero. It is not an empty text \`''\`. It is not the word "NULL". It says: *"we do not have a value here"*.

That one idea explains every rule below. If you do not know a number, anything you calculate with it is also unknown:

- \`5 + NULL\` is \`NULL\` (unknown plus five is still unknown)
- \`'IN' || NULL\` is \`NULL\`
- \`NULL = NULL\` is **not true**. It is \`NULL\`. Are two unknown amounts equal? We cannot say.
- \`NULL <> 'Returned'\` is \`NULL\`. We cannot say that an unknown status differs from \`Returned\`.`,
    { analogy: 'Two sealed envelopes with an amount written inside. Someone asks: "Is the amount in this envelope bigger than ₹100?" You cannot answer yes or no until you open it. And "are the two envelopes equal?" also has no answer yet. SQL says the same: the answer is **unknown**, which it shows as NULL. An Excel blank is different, because Excel quietly treats it as zero in a SUM.' },
    `## Three-valued logic
Normal logic has two answers, true and false. SQL has **three**: **TRUE, FALSE and UNKNOWN** (shown as \`NULL\`). A condition on a row can come out as any of them.

The rule for \`WHERE\` is short: **it keeps a row only when the condition is TRUE.** FALSE is dropped. UNKNOWN is dropped too. That is where the nine orders went.`,
    { sketch: { w: 760, h: 300, caption: 'WHERE keeps only TRUE. A NULL status makes the comparison UNKNOWN, so the row disappears from both the "returned" and the "not returned" groups.', items: [
      { t: 'table', x: 20, y: 52, title: "WHERE status <> 'Returned', row by row", cols: ['status', "status <> 'Returned'", 'WHERE keeps it?'], colW: [120, 220, 180], rows: [['Delivered', 'TRUE', 'kept'], ['Shipped', 'TRUE', 'kept'], ['Returned', 'FALSE', 'dropped'], [null, 'NULL (unknown)', 'dropped']], hl: [3] },
      { t: 'note', x: 565, y: 56, w: 180, h: 138, text: 'An unknown status\nis not "different\nfrom Returned".\nIt is simply\nunknown, and\nWHERE drops it.', fill: 'pink', size: 15 },
      { t: 'box', x: 20, y: 218, w: 225, h: 64, label: '166 kept', sub: 'Delivered 118 + Shipped 48', fill: 'green', size: 18 },
      { t: 'box', x: 268, y: 218, w: 225, h: 64, label: '45 dropped', sub: 'Returned (FALSE)', fill: 'grey', size: 18 },
      { t: 'box', x: 516, y: 218, w: 225, h: 64, label: '9 vanish', sub: 'no status (UNKNOWN)', fill: 'pink', size: 18 },
    ] } },
    `The same three values flow through \`AND\`, \`OR\` and \`NOT\`. You only need two shortcuts:

- \`FALSE AND anything\` is FALSE, and \`TRUE OR anything\` is TRUE. The unknown part cannot change the answer.
- In every other case an unknown part makes the whole answer unknown. \`TRUE AND NULL\` is NULL, \`FALSE OR NULL\` is NULL, and \`NOT NULL\` is NULL.

## Testing for NULL: IS NULL and IS DISTINCT FROM
Because \`= NULL\` is never true, SQL has its own words:

\`\`\`sql
WHERE status IS NULL                      -- the rows with no status (9 of them)
WHERE status IS NOT NULL                  -- the rows that have a status (211)
WHERE status IS DISTINCT FROM 'Returned'  -- "different from", counting NULL as a real value
\`\`\`
\`IS DISTINCT FROM\` is the clean answer to the sales head's question. It treats NULL as an ordinary value, so a missing status counts as "different from Returned". (The long way to say it is \`status <> 'Returned' OR status IS NULL\`.)`,
    { sql: {
      title: 'Four ways to count "not returned"',
      starter: `-- 1) The trap: NULL <> 'Returned' is unknown, so 9 rows vanish
SELECT COUNT(*) AS wrong FROM orders WHERE status <> 'Returned';

-- 2) The long fix
SELECT COUNT(*) AS right_long FROM orders WHERE status <> 'Returned' OR status IS NULL;

-- 3) The short fix
SELECT COUNT(*) AS right_short FROM orders WHERE status IS DISTINCT FROM 'Returned';

-- 4) = NULL never matches anything (a very common mistake)
SELECT COUNT(*) AS equals_null FROM orders WHERE status = NULL;`,
      note: 'You should see 166, 175, 175 and 0. COUNT(*) just counts rows here; the next lesson covers it fully. Change query 4 to IS NULL and you get the 9 orders.',
    } },
    { warn: 'Never write `= NULL` or `<> NULL`. Postgres does not raise an error. It silently returns **zero rows** because the condition is always unknown. Always use `IS NULL` or `IS NOT NULL`.' },
    `## COALESCE and NULLIF: choose what NULL becomes
\`COALESCE(a, b, c, ...)\` returns the **first value that is not NULL**. It is how you give a missing value a default for a report:

\`\`\`sql
SELECT emp_name, COALESCE(pan, 'MISSING') AS pan_status FROM employees;
-- the amount of a journal line when an extract leaves the empty side blank:
SELECT COALESCE(debit, 0) - COALESCE(credit, 0) AS net FROM fact_gl;
\`\`\`
In the Kollana data the empty side of a journal line is stored as 0, not NULL, so the second query gives the same numbers as \`debit - credit\`. Many real ERP extracts leave it blank instead, and then \`debit - credit\` would turn the whole line into NULL.

\`NULLIF(a, b)\` does the opposite: it returns **NULL when a equals b**, otherwise it returns a. It has two everyday uses:

- **Divide safely.** \`10 / 0\` stops the query with *ERROR: division by zero*. \`10 / NULLIF(0, 0)\` returns NULL, and the query carries on. You will write \`actual / NULLIF(budget, 0)\` for variance percentages.
- **Turn empty text into a real NULL.** Imported files often contain \`''\` where a value is missing. \`NULLIF(TRIM(col), '')\` converts that to NULL so the rules above work.`,
    { sql: {
      title: 'COALESCE and NULLIF in action',
      starter: `-- Missing PANs get a label (employees 9 and 18 have no PAN)
SELECT emp_id, emp_name, COALESCE(pan, 'MISSING') AS pan_status
FROM employees
WHERE emp_id IN (8, 9, 18)
ORDER BY emp_id;

-- NULLIF: zero becomes NULL, so the division does not fail
SELECT 10 / NULLIF(0, 0)  AS safe_division,
       NULLIF('', '')      AS empty_to_null,
       COALESCE(NULL, NULL, 'third') AS first_non_null;

-- Remove the first dashes to see the real error:
-- SELECT 10 / 0;`,
      note: 'safe_division and empty_to_null show NULL. Un-comment the last line and read the error: "division by zero".',
    } },
    { warn: '`COALESCE(x, 0)` is not free. It changes what your numbers mean. The average of 10, 20 and an unknown value is 15 if the unknown is skipped, but 10 if you turn it into 0. Decide on purpose: is "missing" really zero (a blank discount), or unknown (a salary nobody entered)?' },
    `## NULLs inside aggregates
Aggregate functions have one simple habit: **they skip NULLs**. \`SUM\`, \`AVG\`, \`MIN\` and \`MAX\` only look at rows that have a value. \`COUNT\` has two forms:

- \`COUNT(*)\` counts **rows**, whatever is in them.
- \`COUNT(col)\` counts the rows where \`col\` is **not NULL**.

The difference between them is a ready-made data-quality check: \`COUNT(*) - COUNT(col)\` is the number of missing values in a column.

Two more places where NULL behaves in its own way:
- \`GROUP BY\` and \`DISTINCT\` treat all NULLs as **one group**. That is why a status summary shows one extra line with an empty status.
- \`ORDER BY\` puts NULLs **last** in ascending order and **first** in descending order. Control it with \`NULLS FIRST\` or \`NULLS LAST\`.`,
    { sql: {
      title: 'Aggregates and NULL',
      starter: `-- A tiny made-up column: 10, 20 and a missing value
SELECT SUM(x)               AS total,
       AVG(x)               AS average,
       AVG(COALESCE(x, 0))  AS average_if_zero,
       COUNT(x)             AS count_col,
       COUNT(*)             AS count_rows
FROM (VALUES (10), (20), (NULL)) AS t(x);

-- Missing PANs in the real employee table
SELECT COUNT(*) AS employees, COUNT(pan) AS pan_given, COUNT(*) - COUNT(pan) AS pan_missing
FROM employees;

-- NULL forms its own group (GROUP BY makes one output row per status; the next module teaches it)
SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
ORDER BY status NULLS FIRST;`,
      note: 'Expect total 30, average 15, average_if_zero 10, count_col 2, count_rows 3. For employees: 20, 18 and 2. In the status summary the empty status has 9 orders.',
    } },
    `## The NOT IN trap
There is one more classic. Which employees do **not** manage anyone? You write a subquery inside \`NOT IN\`:

\`\`\`sql
SELECT emp_name FROM employees
WHERE emp_id NOT IN (SELECT manager_id FROM employees);
\`\`\`
It returns **no rows**, although 15 people have no reports. The list \`manager_id\` contains one NULL, because the top boss has no manager. \`x NOT IN (a, b, NULL)\` really means \`x <> a AND x <> b AND x <> NULL\`. The last part is unknown for every x, so the whole condition can never be TRUE.`,
    { sketch: { w: 760, h: 250, caption: 'One NULL in the list makes NOT IN return nothing. NOT EXISTS, or filtering the NULL out of the list, fixes it.', items: [
      { t: 'text', x: 380, y: 24, text: '5 NOT IN (1, 2, NULL)  means  5 <> 1  AND  5 <> 2  AND  5 <> NULL', size: 17, bold: true },
      { t: 'box', x: 30, y: 56, w: 200, h: 62, label: '5 <> 1', sub: 'TRUE', fill: 'green', size: 18 },
      { t: 'text', x: 255, y: 90, text: 'AND', bold: true, size: 18 },
      { t: 'box', x: 280, y: 56, w: 200, h: 62, label: '5 <> 2', sub: 'TRUE', fill: 'green', size: 18 },
      { t: 'text', x: 505, y: 90, text: 'AND', bold: true, size: 18 },
      { t: 'box', x: 530, y: 56, w: 200, h: 62, label: '5 <> NULL', sub: 'UNKNOWN', fill: 'pink', size: 18 },
      { t: 'arrow', x1: 130, y1: 120, x2: 270, y2: 162 },
      { t: 'arrow', x1: 380, y1: 120, x2: 380, y2: 160 },
      { t: 'arrow', x1: 630, y1: 120, x2: 490, y2: 162 },
      { t: 'box', x: 220, y: 165, w: 320, h: 66, label: 'UNKNOWN', sub: 'never TRUE, so no row is ever kept', fill: 'pink', size: 20 },
    ] } },
    { sql: {
      title: 'The same question three ways',
      starter: `-- 1) NOT IN with a NULL in the list: returns 0 rows
SELECT COUNT(*) AS not_in_trap
FROM employees
WHERE emp_id NOT IN (SELECT manager_id FROM employees);

-- 2) Fix: remove the NULL from the list
SELECT COUNT(*) AS not_in_fixed
FROM employees
WHERE emp_id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL);

-- 3) Better: NOT EXISTS ignores NULLs by design
SELECT COUNT(*) AS not_exists
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.emp_id);`,
      note: '0, 15 and 15. The subqueries lesson explains EXISTS in detail; for now remember the rule: with NOT, prefer NOT EXISTS.',
    } },
    { tip: 'A quick data-quality habit: for any column you are about to rely on, run `SELECT COUNT(*) - COUNT(col) FROM table`. If the answer is not zero, decide what to do with those rows **before** you write the report.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-nulls-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'The sales head wants every order that was **not returned**, including the orders with no status. Return `order_id, status`, sorted by `order_id`. (You should get 175 rows.)',
      hint: "WHERE status IS DISTINCT FROM 'Returned', or status <> 'Returned' OR status IS NULL.",
      solution: `SELECT order_id, status
FROM orders
WHERE status IS DISTINCT FROM 'Returned'
ORDER BY order_id`,
    } },
    { challenge: {
      id: 'sql-nulls-ch2',
      level: 'easy',
      ordered: true,
      prompt: 'HR needs a PAN check for the **HR** and **Sales** departments. Return `emp_id, emp_name, pan_status`, where `pan_status` is the PAN, or the text `MISSING` when the PAN is NULL. Sort by `emp_id`. (7 rows, one of them MISSING.)',
      hint: "COALESCE(pan, 'MISSING') AS pan_status, and department IN ('HR', 'Sales').",
      solution: `SELECT emp_id, emp_name, COALESCE(pan, 'MISSING') AS pan_status
FROM employees
WHERE department IN ('HR', 'Sales')
ORDER BY emp_id`,
    } },
    { challenge: {
      id: 'sql-nulls-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'Return the employees who **do not manage anyone**: `emp_id, emp_name`, sorted by `emp_id`. Someone is a manager when their `emp_id` appears in the `manager_id` column. Beware the NOT IN trap: you should get 15 rows.',
      hint: 'Either NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL), or NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.emp_id).',
      solution: `SELECT emp_id, emp_name
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.emp_id)
ORDER BY emp_id`,
    } },
    { real: 'Missing values arrive in many disguises: an empty string, a space, `NA`, `-`, `0`, `9999-12-31`, or a real NULL. Excel exports and ERP files rarely agree. The first cleaning step of any pipeline is to turn every "this means missing" marker into a real NULL (`NULLIF(TRIM(col), \'\')`), and the second is to count them per column with `COUNT(*) - COUNT(col)`. Report that number to the data owner. A pipeline that quietly fills gaps with zero is the pipeline that gets blamed when the totals do not match.' },
    { interview: '"What is the difference between `COUNT(*)` and `COUNT(column)`, and why can `NOT IN` return no rows?" Model answer: "`COUNT(*)` counts rows. `COUNT(column)` counts only rows where the column is not NULL, like most aggregates, which skip NULLs. `NOT IN (subquery)` returns nothing when the subquery produces even one NULL, because `x <> NULL` is unknown, so the AND of all comparisons is never true. I use NOT EXISTS, or add `WHERE col IS NOT NULL` to the subquery."' },
    `## Recap
- \`NULL\` means unknown or missing. It is not 0 and not empty text. Any calculation with it gives NULL.
- SQL has three truth values: TRUE, FALSE, UNKNOWN. **WHERE keeps only TRUE**, so rows with NULL in the compared column quietly disappear from \`<>\` filters.
- Test with \`IS NULL\`, \`IS NOT NULL\` and \`IS DISTINCT FROM\`. Never \`= NULL\`.
- \`COALESCE\` returns the first non-NULL value; \`NULLIF(a, b)\` returns NULL when they are equal, which makes \`x / NULLIF(y, 0)\` safe.
- Aggregates skip NULLs. \`COUNT(*)\` counts rows, \`COUNT(col)\` counts non-NULL values, and the difference is your missing count.
- \`GROUP BY\` and \`DISTINCT\` put all NULLs together; \`ORDER BY\` puts them last (ascending) unless you say \`NULLS FIRST\`.
- One NULL in a \`NOT IN\` list makes the whole filter return nothing. Use \`NOT EXISTS\`.`,
  ],
  quiz: [
    { q: 'What does `SELECT NULL = NULL` return?', o: ['true', 'false', 'NULL (unknown)', 'an error'], a: 2, why: 'Comparing two unknown values gives unknown. Use `IS NULL` to test for a missing value.' },
    { q: 'The orders table has 220 rows, 45 with status Returned and 9 with a NULL status. How many rows does `WHERE status <> \'Returned\'` return?', o: ['166', '211', '45', '175'], a: 0, why: '220 − 45 − 9 = 166. The 9 NULL rows give UNKNOWN, and WHERE keeps only TRUE.' },
    { q: 'Which query returns all orders that are not Returned, including those with no status?', o: ['WHERE status != NULL', 'WHERE NOT status = \'Returned\'', 'WHERE status <> \'Returned\' AND status IS NOT NULL', 'WHERE status IS DISTINCT FROM \'Returned\''], a: 3, why: 'IS DISTINCT FROM treats NULL as a normal value. `NOT status = \'Returned\'` still gives UNKNOWN for NULL rows, and `!= NULL` never matches.' },
    { q: 'A column has the values 10, 20 and NULL. What are `AVG(x)` and `COUNT(*)`?', o: ['10 and 2', '15 and 3', '15 and 2', '10 and 3'], a: 1, why: 'AVG skips the NULL: (10 + 20) / 2 = 15. COUNT(*) counts rows, so it is 3. COUNT(x) would be 2.' },
    { q: 'What is `10 / NULLIF(0, 0)`?', o: ['NULL', '10', 'An error: division by zero', '0'], a: 0, why: 'NULLIF returns NULL when both values are equal, so the division becomes 10 / NULL = NULL instead of failing.' },
    { q: 'Why does `WHERE emp_id NOT IN (SELECT manager_id FROM employees)` return no rows?', o: ['emp_id and manager_id have different types', 'The subquery needs a LIMIT', 'NOT IN cannot use a subquery', 'manager_id contains a NULL, which makes every comparison unknown'], a: 3, why: '`x NOT IN (..., NULL)` includes `x <> NULL`, which is unknown, so the condition is never TRUE. Use NOT EXISTS or filter the NULL out.' },
  ],
  task: {
    title: 'Find the missing rows on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `04_nulls.sql` in `C:\\sql-practice`.',
      'Query 1: the wrong and the right count of "not returned" orders side by side (expect 166 and 175). Add a comment explaining where the 9 rows went.',
      'Query 2: a PAN report for all employees with `COALESCE(pan, \'MISSING\')`, and one line `SELECT COUNT(*) - COUNT(pan)` that returns 2.',
      'Query 3: the employees who manage nobody, written with NOT EXISTS (expect 15 rows). Then write the broken NOT IN version as a comment and note that it returns 0.',
    ],
    deliverable: '`04_nulls.sql` with three commented queries; the counts 166, 175, 2 and 15 appear in your results.',
  },
};
