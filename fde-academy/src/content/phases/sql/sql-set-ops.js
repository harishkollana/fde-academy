export default {
  id: 'sql-set-ops',
  title: 'Set operations: UNION, INTERSECT and EXCEPT',
  goal: 'You can stack query results with UNION ALL, merge and de-duplicate with UNION, find rows that are in both results or in only one with INTERSECT and EXCEPT, compare two snapshots, and choose between a set operator and a join.',
  roadmap: [
    'UNION vs UNION ALL',
    'INTERSECT and EXCEPT',
  ],
  blocks: [
    `## The problem
Three requests come in on the same Monday.

1. *"Put the cities of our customers and the cities of our employees into one list."* Two different tables, one list.
2. *"Which customers ordered in **both** halves of the financial year?"*
3. *"What changed between last month's payroll and this month's?"*

A join can answer the second and third questions, but the SQL gets long and easy to get wrong. SQL has a smaller tool for exactly these situations. It treats a query result as a **set of rows** and combines two such sets, the way you combine two lists in Python or two ranges in Excel: *stack them*, *keep what both have*, *keep what only the first has*.`,
    `## The four operators
Put one operator between two complete \`SELECT\` statements:

| Operator | Result |
|---|---|
| \`A UNION ALL B\` | every row of A, then every row of B. **Nothing is removed**, duplicates stay |
| \`A UNION B\` | the same, then **duplicates removed** |
| \`A INTERSECT B\` | the rows that appear in **both** A and B |
| \`A EXCEPT B\` | the rows of A that do **not** appear in B (the order matters) |

The rules are few and strict:
- Both queries must return the **same number of columns**, and the columns in each position must have **compatible types**. \`SELECT 1, 2 UNION SELECT 3\` fails with *each UNION query must have the same number of columns*, and \`SELECT 1 UNION SELECT 'a'\` fails because 'a' is not a number.
- The **column names** come from the **first** query.
- A set operator compares **whole rows**, using all selected columns. \`INTERSECT\`, \`EXCEPT\` and \`UNION\` also remove duplicates inside each result. (\`INTERSECT ALL\` and \`EXCEPT ALL\` keep duplicate counts; you will rarely need them.)
- **NULL equals NULL here.** In a join, two NULLs never match. In a set operation they are treated as the same value, so \`SELECT NULL UNION SELECT NULL\` returns **one** row. This makes the set operators safe where \`NOT IN\` is dangerous, as you will see.
- \`ORDER BY\` goes **once, at the very end**, and sorts the whole result.`,
    { sketch: { w: 760, h: 330, caption: 'The four operators on two small lists. A is 1, 2, 2, 3 and B is 2, 3, 3, 4.', items: [
      { t: 'table', x: 20, y: 50, title: 'A', cols: ['x'], colW: [70], rows: [['1'], ['2'], ['2'], ['3']] },
      { t: 'table', x: 120, y: 50, title: 'B', cols: ['x'], colW: [70], rows: [['2'], ['3'], ['3'], ['4']], fill: 'green' },
      { t: 'note', x: 235, y: 40, w: 505, h: 46, fill: 'blue', size: 15, text: 'A UNION ALL B  =  1, 2, 2, 3, 2, 3, 3, 4\nStacked. All 8 rows kept. The cheapest one.' },
      { t: 'note', x: 235, y: 98, w: 505, h: 46, fill: 'yellow', size: 15, text: 'A UNION B  =  1, 2, 3, 4\nStacked, then duplicates removed (needs a sort or hash).' },
      { t: 'note', x: 235, y: 156, w: 505, h: 46, fill: 'green', size: 15, text: 'A INTERSECT B  =  2, 3\nOnly the values that are in both lists.' },
      { t: 'note', x: 235, y: 214, w: 505, h: 46, fill: 'pink', size: 15, text: 'A EXCEPT B  =  1\nIn A but not in B.  B EXCEPT A would be 4: the order matters.' },
      { t: 'note', x: 20, y: 276, w: 720, h: 38, fill: 'grey', size: 15, text: 'Both queries need the same number of columns with compatible types. Names come from the first query.' },
    ] } },
    { sql: {
      title: 'Stack, merge, overlap and difference',
      starter: `-- UNION ALL keeps everything, UNION removes duplicates
SELECT (SELECT COUNT(*) FROM (SELECT city FROM customers UNION ALL SELECT city FROM employees) AS a) AS union_all_rows,
       (SELECT COUNT(*) FROM (SELECT city FROM customers UNION     SELECT city FROM employees) AS b) AS union_rows;

-- The distinct cities of customers and employees together
SELECT city FROM customers
UNION
SELECT city FROM employees
ORDER BY city;

-- In both lists, and only in employees
SELECT city FROM customers INTERSECT SELECT city FROM employees ORDER BY city;
SELECT city FROM employees EXCEPT    SELECT city FROM customers;

-- Set operators treat NULL as equal to NULL
SELECT NULL::int AS x UNION     SELECT NULL::int;
SELECT NULL::int AS x UNION ALL SELECT NULL::int;

-- Remove the dashes to read the two errors:
-- SELECT 1, 2 UNION SELECT 3;
-- SELECT 1 UNION SELECT 'a';`,
      note: 'The stacked lists have 32 rows (12 customers plus 20 employees) but only 5 different cities: Bengaluru, Chennai, Hyderabad, Mumbai and Pune. All 4 customer cities also have employees, and the only city with employees and no customers is Bengaluru. Two NULLs collapse into one row with UNION, and stay two rows with UNION ALL.',
    } },
    `## UNION ALL: the stacker
\`UNION ALL\` is the one you use most. Typical jobs:
- **Combine files that share a shape**: this month's extract and last month's, one table per entity, an archive table and a live table. Add a **label column** so you know where each row came from: \`SELECT 'IN01' AS source, … UNION ALL SELECT 'SG01', …\`.
- **Stack two measures into one long list, then summarise**. This is a neat alternative to a join. To compare actual revenue with the budget, stack the two (one query per source, both at the same grain), then use conditional aggregation to put them in columns:

\`\`\`sql
WITH stacked AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, 'actual' AS source, SUM(credit - debit) AS amount
  FROM fact_gl WHERE account_id IN (4100, 4200) GROUP BY 1, 2
  UNION ALL
  SELECT entity_id, budget_month, 'budget', SUM(budget_amount)
  FROM fact_budget WHERE account_id IN (4100, 4200) GROUP BY 1, 2
)
SELECT month,
       SUM(amount) FILTER (WHERE source = 'actual') AS actual,
       SUM(amount) FILTER (WHERE source = 'budget') AS budget
FROM stacked WHERE entity_id = 1
GROUP BY month ORDER BY month;
\`\`\`
The advantage over an inner join: a month that exists on **only one side** (budget with no actuals yet, or the other way round) still appears, with NULL on the missing side. Stacking behaves like a **full outer join** here and cannot drop a row by accident.

**Prefer \`UNION ALL\` unless you really want duplicates removed.** \`UNION\` has to sort or hash all the rows to find duplicates, which costs time, and it also hides duplicates that might be a **sign of a problem** (the same journal loaded twice). Use \`UNION\` when you know that duplicates can occur and you want a list of distinct values.`,
    { sql: {
      title: 'Stack, then pivot: actual against budget for IN01',
      starter: `WITH stacked AS (
  SELECT entity_id,
         DATE_TRUNC('month', posting_date)::date AS month,
         'actual' AS source,
         SUM(credit - debit) AS amount
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY 1, 2
  UNION ALL
  SELECT entity_id, budget_month, 'budget', SUM(budget_amount)
  FROM fact_budget
  WHERE account_id IN (4100, 4200)
  GROUP BY 1, 2
)
SELECT month,
       SUM(amount) FILTER (WHERE source = 'actual') AS actual,
       SUM(amount) FILTER (WHERE source = 'budget') AS budget
FROM stacked
WHERE entity_id = 1
GROUP BY month
ORDER BY month;`,
      note: 'The result matches the join-based report from the CTE lesson: April has an actual of 2,33,914.19 against a budget of 2,18,239.68. Change the WHERE to entity_id = 2 to see Singapore, in its own currency.',
    } },
    `## INTERSECT and EXCEPT: both, and only one
These two answer membership questions in one short line.

\`\`\`sql
-- customers who ordered in the first half AND in the second half of FY 2025-26
SELECT customer_id FROM orders WHERE order_date <  DATE '2025-10-01'
INTERSECT
SELECT customer_id FROM orders WHERE order_date >= DATE '2025-10-01';
\`\`\`
The answer is customers 1 to 10, ten customers. Reverse the idea with \`EXCEPT\`: customers who ordered in the second half but **not** in the first: just **99**, the orphan customer who does not exist in \`customers\`. The same shape finds data problems directly: \`SELECT customer_id FROM orders EXCEPT SELECT customer_id FROM customers\` returns 99, and the reverse query returns 11 and 12, the customers who never ordered. These are the anti-joins from the join lessons in one line each.

### EXCEPT is NULL-safe
Remember the trap: \`WHERE emp_id NOT IN (SELECT manager_id FROM employees)\` returns **nothing**, because \`manager_id\` contains one NULL. The set operator does not have that problem:

\`\`\`sql
SELECT emp_id FROM employees
EXCEPT
SELECT manager_id FROM employees;       -- 15 rows: everyone who manages nobody
\`\`\`
The NULL in the second list is simply one more value that does not match any employee id.`,
    { sql: {
      title: 'Who is in both, and who is in only one',
      starter: `-- Customers who ordered in BOTH halves of FY 2025-26
SELECT customer_id FROM orders WHERE order_date <  DATE '2025-10-01'
INTERSECT
SELECT customer_id FROM orders WHERE order_date >= DATE '2025-10-01'
ORDER BY customer_id;

-- In the second half but not in the first
SELECT customer_id FROM orders WHERE order_date >= DATE '2025-10-01'
EXCEPT
SELECT customer_id FROM orders WHERE order_date <  DATE '2025-10-01';

-- Orphans, both directions
SELECT customer_id FROM orders    EXCEPT SELECT customer_id FROM customers;
SELECT customer_id FROM customers EXCEPT SELECT customer_id FROM orders ORDER BY customer_id;

-- NULL-safe: who manages nobody?
SELECT COUNT(*) AS non_managers
FROM (SELECT emp_id FROM employees
      EXCEPT
      SELECT manager_id FROM employees) AS t;`,
      note: 'Ten customers (1 to 10) ordered in both halves, and customer 99 appears only in the second half. The orphan check returns 99, and the reverse returns customers 11 and 12. 15 employees manage nobody, the same answer as NOT EXISTS, with no NULL trap.',
    } },
    `## Comparing two snapshots
The most useful pattern in data engineering is the **snapshot diff**: "what is different between yesterday's data and today's?" Two \`EXCEPT\` queries, one in each direction, give you every row that was added, removed or changed:

\`\`\`sql
(SELECT … FROM today     EXCEPT SELECT … FROM yesterday)    -- new or changed rows, in their new form
UNION ALL
(SELECT … FROM yesterday EXCEPT SELECT … FROM today)        -- removed or changed rows, in their old form
\`\`\`
Apply it to the payroll runs of August and September 2026, comparing the pair \`(emp_id, gross_pay)\`. A changed row shows up **twice**, once with its new value and once with its old one. An unchanged row disappears. In the Kollana data exactly **one** employee changed: employee 6, whose gross pay jumped from ₹1,08,333.33 to ₹2,59,999.99, which is 2.4 times as much. That is the salary outlier an automation job should catch before payroll is released.`,
    { sketch: { w: 760, h: 320, caption: 'The snapshot diff on three employees. Rows 5 and 7 are identical in both months and vanish. Row 6 changed, so it appears once on each side.', items: [
      { t: 'table', x: 20, y: 60, title: 'August 2026', cols: ['emp', 'gross_pay'], colW: [60, 130], rows: [['5', '166666.67'], ['6', '108333.33'], ['7', '58333.33']], fill: 'blue' },
      { t: 'table', x: 232, y: 60, title: 'September 2026', cols: ['emp', 'gross_pay'], colW: [60, 130], rows: [['5', '166666.67'], ['6', '259999.99'], ['7', '58333.33']], fill: 'green', hl: [1] },
      { t: 'table', x: 510, y: 60, title: 'Sep EXCEPT Aug', cols: ['emp', 'gross_pay'], colW: [60, 130], rows: [['6', '259999.99']], fill: 'green' },
      { t: 'table', x: 510, y: 160, title: 'Aug EXCEPT Sep', cols: ['emp', 'gross_pay'], colW: [60, 130], rows: [['6', '108333.33']], fill: 'blue' },
      { t: 'arrow', x1: 428, y1: 132, x2: 504, y2: 132, label: 'EXCEPT\nboth ways', lx: 0, ly: -30 },
      { t: 'note', x: 20, y: 232, w: 720, h: 68, fill: 'yellow', size: 15, text: 'UNION ALL of the two results = 2 rows for employee 6: the new value (2,59,999.99)\nand the old value (1,08,333.33). The whole row is compared, so any changed column\nmakes the row appear. Use the key to pair them up.' },
    ] } },
    { sql: {
      title: 'Snapshot diff of two payroll runs',
      starter: `-- Rows that differ between August and September, with a label for each side
SELECT emp_id, 'only in Sep' AS side, gross_pay
FROM (SELECT emp_id, gross_pay FROM payroll WHERE run_month = DATE '2026-09-01'
      EXCEPT
      SELECT emp_id, gross_pay FROM payroll WHERE run_month = DATE '2026-08-01') AS new_or_changed
UNION ALL
SELECT emp_id, 'only in Aug' AS side, gross_pay
FROM (SELECT emp_id, gross_pay FROM payroll WHERE run_month = DATE '2026-08-01'
      EXCEPT
      SELECT emp_id, gross_pay FROM payroll WHERE run_month = DATE '2026-09-01') AS removed_or_changed
ORDER BY emp_id, side;

-- The same finding as a ratio, for the exception report
SELECT s.emp_id,
       a.gross_pay AS august,
       s.gross_pay AS september,
       ROUND(s.gross_pay / a.gross_pay, 2) AS ratio
FROM payroll s
JOIN payroll a ON a.emp_id = s.emp_id AND a.run_month = DATE '2026-08-01'
WHERE s.run_month = DATE '2026-09-01'
  AND s.gross_pay IS DISTINCT FROM a.gross_pay;`,
      note: 'Two rows come out of the first query, both for employee 6. The second query uses a join to add the ratio, 2.40. The set operators find WHAT differs, and the join adds the detail you need to explain it.',
    } },
    `## Precedence and parentheses
When you chain several operators, \`INTERSECT\` binds **tighter** than \`UNION\` and \`EXCEPT\` (like multiplication before addition). \`UNION\` and \`EXCEPT\` run left to right. So \`SELECT 1 UNION SELECT 2 INTERSECT SELECT 2\` means \`1 UNION (2 INTERSECT 2)\` and returns **1 and 2**, while \`(SELECT 1 UNION SELECT 2) INTERSECT SELECT 2\` returns only **2**. Write the brackets whenever you mix operators.

Brackets are also required when one branch needs its own \`ORDER BY\` or \`LIMIT\`: a bare \`ORDER BY\` at the end belongs to the whole result, so for "the two biggest and the two smallest orders" you wrap each branch: \`(SELECT … ORDER BY amount DESC LIMIT 2) UNION ALL (SELECT … ORDER BY amount LIMIT 2)\`.

## Set operator or join?
| You need | Use |
|---|---|
| to **stack** rows of the same shape | \`UNION ALL\` |
| a **list of keys** that are in both, or only in one | \`INTERSECT\` / \`EXCEPT\`. Short, and safe with NULLs |
| to compare **whole rows** (a snapshot diff) | \`EXCEPT\` in both directions |
| **extra columns** from the other side (names, amounts, a ratio) | a join |
| to match on **some** columns and compare the rest | a join (a set operator compares every selected column) |`,
    { sql: {
      title: 'Precedence and one LIMIT per branch',
      starter: `-- INTERSECT binds tighter: this is 1 UNION (2 INTERSECT 2)
SELECT x FROM (VALUES (1)) AS a(x)
UNION
SELECT x FROM (VALUES (2)) AS b(x)
INTERSECT
SELECT x FROM (VALUES (2)) AS c(x)
ORDER BY x;

-- With brackets we force the other reading: (1 UNION 2) INTERSECT 2
(SELECT x FROM (VALUES (1)) AS a(x) UNION SELECT x FROM (VALUES (2)) AS b(x))
INTERSECT
SELECT x FROM (VALUES (2)) AS c(x)
ORDER BY x;

-- The two biggest and the two smallest orders, one LIMIT per branch
(SELECT order_id, amount FROM orders ORDER BY amount DESC, order_id LIMIT 2)
UNION ALL
(SELECT order_id, amount FROM orders ORDER BY amount, order_id LIMIT 2);`,
      note: 'The first query returns 1 and 2, the second only 2. The last query returns orders 66 and 74 (the first two of the eight orders worth 3,68,000, by order id) and orders 190 and 42, the two smallest.',
    } },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-set-ops-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Loyal customers. Return `customer_id` for the customers who placed at least one order in the **first half** of FY 2025-26 (`order_date` before 1 October 2025) **and** at least one in the **second half** (1 October 2025 or later). Use `INTERSECT`. Sort by `customer_id`. (10 rows: customers 1 to 10.)',
      hint: "SELECT customer_id FROM orders WHERE order_date < DATE '2025-10-01' INTERSECT SELECT customer_id FROM orders WHERE order_date >= DATE '2025-10-01', then ORDER BY customer_id at the end.",
      solution: `SELECT customer_id FROM orders WHERE order_date < DATE '2025-10-01'
INTERSECT
SELECT customer_id FROM orders WHERE order_date >= DATE '2025-10-01'
ORDER BY customer_id`,
    } },
    { challenge: {
      id: 'sql-set-ops-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'One list of mismatches between `customers` and `orders`. Return `problem, customer_id`: the text `customer without orders` for each customer id that is in `customers` but never in `orders`, and the text `order without customer` for each customer id that is in `orders` but not in `customers`. Sort by `problem`, then `customer_id`. (3 rows: 11, 12 and 99.)',
      hint: "Two EXCEPT queries (one each way), each with a text label in the SELECT list, joined with UNION ALL. Wrap each EXCEPT in a subquery, then add the label.",
      solution: `SELECT 'customer without orders' AS problem, customer_id
FROM (SELECT customer_id FROM customers EXCEPT SELECT customer_id FROM orders) AS a
UNION ALL
SELECT 'order without customer', customer_id
FROM (SELECT customer_id FROM orders EXCEPT SELECT customer_id FROM customers) AS b
ORDER BY problem, customer_id`,
    } },
    { challenge: {
      id: 'sql-set-ops-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Actual against budget with **no join**. Stack the monthly **actual** revenue of `fact_gl` (accounts **4100 and 4200**, `SUM(credit - debit)` by entity and month) and the monthly **budget** of `fact_budget` (same accounts, `SUM(budget_amount)`) with `UNION ALL`, then return for entity **1**: `month, actual, budget` for the 12 months, using conditional aggregation. Sort by `month`. (April: 233914.19 and 218239.68.)',
      hint: "A CTE with the two stacked queries and a source label ('actual' / 'budget'); then SUM(amount) FILTER (WHERE source = 'actual') and the same for budget, GROUP BY month.",
      solution: `WITH stacked AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, 'actual' AS source, SUM(credit - debit) AS amount
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY 1, 2
  UNION ALL
  SELECT entity_id, budget_month, 'budget', SUM(budget_amount)
  FROM fact_budget
  WHERE account_id IN (4100, 4200)
  GROUP BY 1, 2
)
SELECT month,
       SUM(amount) FILTER (WHERE source = 'actual') AS actual,
       SUM(amount) FILTER (WHERE source = 'budget') AS budget
FROM stacked
WHERE entity_id = 1
GROUP BY month
ORDER BY month`,
    } },
    { real: 'Set operators are the backbone of **reconciliation and change detection**. After every load, a pipeline can run `source EXCEPT target` and `target EXCEPT source`: both must be empty, or you have missing or extra rows, and the two results tell you which. Comparing yesterday\'s and today\'s extract with the snapshot diff gives you an audit trail of what changed. And `UNION ALL` with a label is how you build one reporting table from the monthly files, the entity extracts or the archive. Prefer `UNION ALL`: if the stacked result has duplicates you did not expect, that is information you want to see, not hide.' },
    { interview: '"What is the difference between UNION and UNION ALL, and which is faster?" Model answer: "UNION ALL appends the rows of the second query to the first and keeps all of them. UNION does the same and then removes duplicate rows, which needs a sort or a hash, so UNION ALL is faster. I use UNION ALL unless I want distinct values, because UNION can also hide real duplicates." Follow-ups: "How do you find rows in table A that are not in table B?" (EXCEPT, NOT EXISTS, or a LEFT JOIN with IS NULL; avoid NOT IN when NULLs are possible, while EXCEPT is NULL-safe) and "what must be true of the two queries?" (the same number of columns with compatible types).' },
    `## Recap
- \`UNION ALL\` stacks and keeps every row; \`UNION\` stacks and removes duplicates (slower, and it can hide problems); \`INTERSECT\` keeps rows in both results; \`EXCEPT\` keeps rows of the first that are not in the second (order matters).
- Both queries need the same number of columns with compatible types. Column names come from the first query. \`ORDER BY\` is written once, at the end. Set operators compare **whole rows**.
- **NULL equals NULL** in set operations, so \`EXCEPT\` is safe where \`NOT IN\` fails: 15 employees manage nobody.
- A **snapshot diff** is \`(today EXCEPT yesterday) UNION ALL (yesterday EXCEPT today)\`. Payroll August against September has one changed row, employee 6.
- \`UNION ALL\` plus a source label plus conditional aggregation compares two measures without a join, and cannot lose a month that exists on one side only.
- \`INTERSECT\` binds tighter than \`UNION\` and \`EXCEPT\`; use brackets. A branch with its own \`LIMIT\` needs brackets.`,
  ],
  quiz: [
    { q: 'Which operator stacks two results and keeps every row, including duplicates?', o: ['UNION', 'INTERSECT', 'UNION ALL', 'EXCEPT'], a: 2, why: 'UNION ALL simply appends the second result to the first. UNION also removes duplicates, INTERSECT keeps common rows and EXCEPT subtracts.' },
    { q: 'Why is UNION ALL usually faster than UNION?', o: ['It does not have to sort or hash the rows to remove duplicates', 'It reads the tables in parallel', 'It ignores NULL values', 'It uses an index automatically'], a: 0, why: 'Removing duplicates means comparing all rows with each other, usually with a sort or a hash. UNION ALL skips that work.' },
    { q: '`WHERE emp_id NOT IN (SELECT manager_id …)` returns nothing because manager_id contains a NULL. Why does `SELECT emp_id FROM employees EXCEPT SELECT manager_id FROM employees` still return 15 rows?', o: ['EXCEPT ignores the second query', 'EXCEPT removes NULLs from both queries first', 'EXCEPT only works on primary keys', 'Set operators treat NULL as an ordinary value that equals NULL, so the NULL does not poison the comparison'], a: 3, why: 'NOT IN uses = comparisons, which are unknown for NULL. Set operators compare rows as "not distinct", so a NULL in the second list is just one more value that matches no employee.' },
    { q: 'What does `SELECT 1 UNION SELECT 2 INTERSECT SELECT 2` return?', o: ['Only 2', 'Both 1 and 2, because INTERSECT is evaluated first', 'Only 1', 'An error'], a: 1, why: 'INTERSECT binds tighter, so it is 1 UNION (2 INTERSECT 2), which is 1 UNION 2. Add brackets to say which order you mean.' },
    { q: 'How do you find every row that differs between yesterday\'s and today\'s snapshot of a table?', o: ['(today EXCEPT yesterday) UNION ALL (yesterday EXCEPT today)', 'today UNION yesterday', 'today INTERSECT yesterday', 'today EXCEPT today'], a: 0, why: 'One EXCEPT in each direction gives the new or changed rows and the removed or changed rows. Rows that are identical in both snapshots appear in neither result.' },
    { q: 'Why does `SELECT 1, 2 UNION SELECT 3` fail?', o: ['UNION cannot combine numbers', 'The second query needs a FROM clause', 'A comma is not allowed in a SELECT', 'The two queries return a different number of columns'], a: 3, why: 'Every query in a set operation must return the same number of columns, and the types in each position must be compatible.' },
  ],
  task: {
    title: 'Compare lists and snapshots on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `17_set_ops.sql` in `C:\\sql-practice`.',
      'Query 1: UNION ALL and UNION of customer and employee cities, with the two row counts (expect 32 and 5), then INTERSECT and EXCEPT of the same lists (expect Bengaluru as the city with employees and no customers).',
      'Query 2: customers who ordered in both halves of the year (expect 10) and the two orphan checks between `orders` and `customers` (expect 99, and 11 and 12).',
      'Query 3: the payroll snapshot diff for August and September (expect two rows, both for employee 6). Add a comment saying how you would turn it into an automatic check that stops the payroll release.',
      'Query 4: the stacked actual-against-budget report for entity 1, written with `UNION ALL` and conditional aggregation (expect 12 rows). Change the entity to 3 and check that the result still has 12 months.',
    ],
    deliverable: '`17_set_ops.sql` with four commented queries; the numbers 32 and 5, 10, 99 / 11 / 12, the two payroll rows and the 12-month report appear in your results.',
  },
};
