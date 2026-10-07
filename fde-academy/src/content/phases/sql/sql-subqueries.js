export default {
  id: 'sql-subqueries',
  title: 'Subqueries: scalar, IN, correlated and EXISTS',
  goal: 'You can put one query inside another to answer two-step questions, and choose between a scalar subquery, IN, a correlated subquery, EXISTS and a derived table.',
  roadmap: [
    'Scalar subqueries',
    'IN and NOT IN subqueries',
    'Correlated subqueries',
    'EXISTS and NOT EXISTS',
  ],
  blocks: [
    `## The problem
The sales head asks: *"Which orders are bigger than the **average** order?"*

You can already find the average: \`SELECT AVG(amount) FROM orders\` gives 95,364.89. And you can already filter: \`WHERE amount > 95364.89\`. But typing the number into the query is a mistake waiting to happen. Next month the average is different, and the query is silently wrong.

The question has **two steps**: first calculate the average, then compare each order with it. In SQL you do not run two queries and copy a number between them. You put the first query **inside** the second, in brackets. A query inside another query is called a **subquery**.

\`\`\`sql
SELECT order_id, amount
FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders);   -- the subquery runs first
\`\`\`
77 orders are above the average. The subquery is recalculated every time you run the report, so it never goes out of date.`,
    `## Three shapes of subquery
What a subquery **returns** decides where you may use it. Learn to ask "how many rows and columns come back?"`,
    { sketch: { w: 760, h: 255, caption: 'The shape of the result decides where a subquery fits: one value, a list, or a whole table.', items: [
      { t: 'box', x: 20, y: 40, w: 440, h: 52, label: 'WHERE amount > ( SELECT AVG(amount) FROM orders )', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 462, y1: 66, x2: 488, y2: 66 },
      { t: 'note', x: 490, y: 42, w: 255, h: 48, text: 'SCALAR: one row,\none column = one value', fill: 'blue', size: 15 },
      { t: 'box', x: 20, y: 108, w: 440, h: 52, label: 'WHERE customer_id IN ( SELECT customer_id … )', fill: 'green', size: 16 },
      { t: 'arrow', x1: 462, y1: 134, x2: 488, y2: 134 },
      { t: 'note', x: 490, y: 110, w: 255, h: 48, text: 'LIST: one column,\nany number of rows', fill: 'green', size: 15 },
      { t: 'box', x: 20, y: 176, w: 440, h: 52, label: 'FROM ( SELECT … GROUP BY … ) AS t', fill: 'yellow', size: 16 },
      { t: 'arrow', x1: 462, y1: 202, x2: 488, y2: 202 },
      { t: 'note', x: 490, y: 178, w: 255, h: 48, text: 'TABLE ("derived table"):\nany rows, any columns', fill: 'yellow', size: 15 },
    ] } },
    `## Scalar subquery: exactly one value
A **scalar** subquery returns one row with one column, so Postgres treats it like a single number. You can use it anywhere a value fits: in \`WHERE\`, in \`HAVING\`, or in the \`SELECT\` list.

\`\`\`sql
SELECT order_id, amount,
       amount - (SELECT AVG(amount) FROM orders) AS vs_average    -- in the SELECT list
FROM orders;

SELECT customer_id, AVG(amount)
FROM orders
GROUP BY customer_id
HAVING AVG(amount) > (SELECT AVG(amount) FROM orders);             -- in HAVING
\`\`\`
Two rules to remember:
- **More than one row is an error.** \`WHERE customer_id = (SELECT customer_id FROM customers WHERE city = 'Hyderabad')\` stops with *more than one row returned by a subquery used as an expression*, because several customers live in Hyderabad. If you meant "any of them", use \`IN\` instead of \`=\`.
- **Zero rows gives NULL**, and a comparison with NULL is never true (the NULLs lesson), so the outer query then returns nothing. It does not raise an error. That is easy to miss.

## IN: a list from a subquery
When the subquery returns **one column with many rows**, use \`IN\`. The outer query keeps the rows whose value appears in that list:

\`\`\`sql
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount >= 300000);
\`\`\`
Six customers have at least one order of ₹3,00,000 or more. Notice that a customer with many such orders still appears **once**, because \`IN\` only asks "is it in the list?". It does not multiply rows the way a join does.

\`NOT IN\` has the NULL trap you saw earlier: one NULL in the list and it returns nothing. Prefer \`NOT EXISTS\` (below).`,
    { sql: {
      title: 'Scalar and IN subqueries',
      starter: `-- Orders above the overall average, and how far above
SELECT order_id, amount,
       ROUND(amount - (SELECT AVG(amount) FROM orders), 2) AS vs_average
FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders)
ORDER BY amount DESC, order_id
LIMIT 5;

-- How many orders are above average?
SELECT COUNT(*) AS above_average
FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders);

-- Customers whose average order is above the overall average
SELECT customer_id, ROUND(AVG(amount), 0) AS avg_order
FROM orders
GROUP BY customer_id
HAVING AVG(amount) > (SELECT AVG(amount) FROM orders)
ORDER BY customer_id;

-- IN: customers with at least one order of 3,00,000 or more
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount >= 300000)
ORDER BY customer_id;

-- Remove the dashes to read the "more than one row" error:
-- SELECT order_id FROM orders WHERE customer_id = (SELECT customer_id FROM customers WHERE city = 'Hyderabad');`,
      note: 'The count is 77. Five customers have an average order above the overall average (2, 5, 6, 10 and the orphan customer 99). The IN query lists customers 2, 5, 6, 7, 9 and 10.',
    } },
    `## Correlated subquery: a query that depends on the outer row
So far each subquery could run **on its own**: copy it into a new window and it works. A **correlated** subquery cannot. It refers to a column of the **outer** query, so its answer changes for every outer row.

Question: *which employees earn more than the average of their own department?* The "average of their department" is different for each person:

\`\`\`sql
SELECT e.emp_id, e.emp_name, e.department, e.annual_ctc
FROM employees AS e
WHERE e.annual_ctc > (SELECT AVG(x.annual_ctc)
                      FROM employees AS x
                      WHERE x.department = e.department);   -- refers to the outer row
\`\`\`
Think of it as a loop: for each employee, run the inner query with that employee's department, and compare. The inner query must use a **different alias** (\`x\`) from the outer one (\`e\`), so Postgres knows which \`department\` is which.`,
    { sketch: { w: 760, h: 300, caption: 'A correlated subquery is like a loop: for every outer row, the inner query runs again with that row\'s department.', items: [
      { t: 'table', x: 20, y: 56, title: 'outer query: employees e', cols: ['emp', 'dept', 'ctc'], colW: [90, 110, 60], rows: [['Aarav', 'Finance', '42L'], ['Ishaan', 'Engineering', '13L'], ['Priya', 'Sales', '30L'], ['Ananya', 'Sales', '13L']] },
      { t: 'text', x: 440, y: 44, text: 'inner query, run for THIS row', size: 15, color: '#c2410c' },
      { t: 'arrow', x1: 282, y1: 98, x2: 328, y2: 98 },
      { t: 'arrow', x1: 282, y1: 126, x2: 328, y2: 126 },
      { t: 'arrow', x1: 282, y1: 154, x2: 328, y2: 154 },
      { t: 'arrow', x1: 282, y1: 182, x2: 328, y2: 182 },
      { t: 'note', x: 330, y: 86, w: 215, h: 24, text: 'AVG(Finance) = 24.6L', fill: 'blue', size: 14 },
      { t: 'note', x: 330, y: 114, w: 215, h: 24, text: 'AVG(Engineering) = 13.75L', fill: 'blue', size: 14 },
      { t: 'note', x: 330, y: 142, w: 215, h: 24, text: 'AVG(Sales) = 18.25L', fill: 'blue', size: 14 },
      { t: 'note', x: 330, y: 170, w: 215, h: 24, text: 'AVG(Sales) = 18.25L', fill: 'blue', size: 14 },
      { t: 'text', x: 635, y: 44, text: 'ctc > avg ?', size: 15, color: '#c2410c' },
      { t: 'mark', x: 590, y: 98, ok: true },
      { t: 'mark', x: 590, y: 126, ok: false },
      { t: 'mark', x: 590, y: 154, ok: true },
      { t: 'mark', x: 590, y: 182, ok: false },
      { t: 'text', x: 625, y: 98, text: 'kept', size: 15, color: '#2f9e44', anchor: 'start' },
      { t: 'text', x: 625, y: 126, text: 'dropped', size: 15, color: '#e03131', anchor: 'start' },
      { t: 'text', x: 625, y: 154, text: 'kept', size: 15, color: '#2f9e44', anchor: 'start' },
      { t: 'text', x: 625, y: 182, text: 'dropped', size: 15, color: '#e03131', anchor: 'start' },
      { t: 'note', x: 20, y: 222, w: 720, h: 62, text: 'The inner query uses e.department, a column of the outer row, so it cannot be run once.\nIt is worked out again for every outer row. Postgres often rewrites such queries into joins,\nbut as a way of thinking, a loop is exactly right.', fill: 'yellow', size: 15 },
    ] } },
    `Correlated subqueries are also the classic way to write "the latest row per group": \`WHERE o.order_date = (SELECT MAX(order_date) FROM orders x WHERE x.customer_id = o.customer_id)\`. It works, but it has a flaw that the ranking functions from the window lesson do not have: **ties**. Customer 8 has two orders on the same latest date (14 March 2026), so the query returns **both**, and you get 12 rows for 11 customers. If you need exactly one row per customer, use \`ROW_NUMBER\` with a tiebreaker.`,
    { sql: {
      title: 'Correlated subqueries and the tie problem',
      starter: `-- Employees who earn more than the average of their own department
SELECT e.emp_id, e.emp_name, e.department, e.annual_ctc
FROM employees AS e
WHERE e.annual_ctc > (SELECT AVG(x.annual_ctc)
                      FROM employees AS x
                      WHERE x.department = e.department)
ORDER BY e.emp_id;

-- The department averages the inner query keeps computing
SELECT department, ROUND(AVG(annual_ctc), 0) AS avg_ctc
FROM employees
GROUP BY department
ORDER BY department;

-- Latest order per customer with a correlated MAX: look at customer 8
SELECT o.customer_id, o.order_id, o.order_date, o.amount
FROM orders AS o
WHERE o.order_date = (SELECT MAX(x.order_date) FROM orders AS x WHERE x.customer_id = o.customer_id)
ORDER BY o.customer_id, o.order_id;`,
      note: 'Ten employees are above their department average (Aarav, Diya, Rohan, Sneha, Priya, Arjun, Kavya, Siddharth, Pooja and Manoj). The last query returns 12 rows for 11 customers: customer 8 appears twice (orders 73 and 220).',
    } },
    `## EXISTS: is there at least one matching row?
\`EXISTS (subquery)\` is true when the subquery returns **at least one row**, and false when it returns none. What the subquery selects does not matter, only whether a row exists, so the habit is to write \`SELECT 1\`.

\`\`\`sql
SELECT c.customer_id, c.customer_name
FROM customers c
WHERE EXISTS (SELECT 1
              FROM orders o
              WHERE o.customer_id = c.customer_id        -- correlated to the outer row
                AND o.status = 'Returned'
                AND o.amount >= 200000);
\`\`\`
This lists each customer who has **at least one** large returned order. Three customers qualify: Coastal Pharma, Delta Schools and Gemini Clinics. It is the **semi-join** from the previous lesson, now written as a subquery. It can stop at the first match, so it is efficient, and it never repeats a customer.

\`NOT EXISTS\` is the **anti-join**: rows with no match. It is the safe replacement for \`NOT IN\`, because a NULL in the subquery does not break it. The employees who manage nobody: \`WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.emp_id)\` returns 15 rows even though \`manager_id\` contains a NULL.

## A subquery in FROM: the derived table
When a subquery returns a whole table, you can use it in \`FROM\` and give it an alias. It acts like a temporary table that lives for one query. This is the answer to "an aggregate of an aggregate": you cannot write \`AVG(SUM(amount))\`, but you can sum per customer in the inner query and average those sums in the outer one. It is also the cure for fan-out from the last lesson: reduce a "many" table to one row per key **before** you join it.`,
    { sql: {
      title: 'EXISTS, NOT EXISTS and a derived table',
      starter: `-- EXISTS: customers with a large returned order
SELECT c.customer_id, c.customer_name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.customer_id = c.customer_id
                AND o.status = 'Returned' AND o.amount >= 200000)
ORDER BY c.customer_id;

-- NOT EXISTS: employees who manage nobody (the NULL manager_id does not hurt)
SELECT COUNT(*) AS non_managers
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.emp_id);

-- Derived table: the average of the customers' totals (an aggregate of an aggregate)
SELECT COUNT(*) AS customers, ROUND(AVG(t.total), 2) AS avg_customer_total
FROM (SELECT customer_id, SUM(amount) AS total
      FROM orders
      GROUP BY customer_id) AS t;`,
      note: 'EXISTS returns customers 3, 4 and 7. There are 15 non-managers. The derived table has 11 customers and an average total of 19,07,297.73 per customer.',
    } },
    { tip: 'Subquery or join? If you only need to **test** for a match (EXISTS, IN), use a subquery: it never multiplies rows. If you need **columns** from the other table, use a join. If the same subquery appears twice, or you have subqueries inside subqueries, stop and use a CTE (the next lesson) so that each step has a name and can be read from top to bottom.' },
    { warn: 'A correlated subquery **in the SELECT list** (`SELECT …, (SELECT SUM(…) FROM big_table x WHERE x.id = t.id) AS total`) can be slow on large tables because the inner query may run once per outer row. For big data, rewrite it as a join to a grouped query, or with a window function. The EXISTS form in WHERE is usually fine: Postgres turns it into an efficient semi-join.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-subqueries-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Return the orders that are **bigger than the average order amount**: `order_id, amount`, sorted by `order_id`. Do not type the average as a number. (77 rows.)',
      hint: 'WHERE amount > (SELECT AVG(amount) FROM orders).',
      solution: `SELECT order_id, amount
FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders)
ORDER BY order_id`,
    } },
    { challenge: {
      id: 'sql-subqueries-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'HR wants everyone who earns **more than the average annual CTC of their own department**: `emp_id, emp_name, department, annual_ctc`, sorted by `emp_id`. (10 rows.)',
      hint: 'A correlated subquery: WHERE e.annual_ctc > (SELECT AVG(x.annual_ctc) FROM employees x WHERE x.department = e.department).',
      solution: `SELECT e.emp_id, e.emp_name, e.department, e.annual_ctc
FROM employees e
WHERE e.annual_ctc > (SELECT AVG(x.annual_ctc) FROM employees x WHERE x.department = e.department)
ORDER BY e.emp_id`,
    } },
    { challenge: {
      id: 'sql-subqueries-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'Which customers have **at least one Returned order of ₹2,00,000 or more**? Return `customer_id, customer_name`, sorted by `customer_id`, each customer once. Use `EXISTS`. (3 rows.)',
      hint: "WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'Returned' AND o.amount >= 200000).",
      solution: `SELECT c.customer_id, c.customer_name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.customer_id = c.customer_id
                AND o.status = 'Returned'
                AND o.amount >= 200000)
ORDER BY c.customer_id`,
    } },
    { real: 'Subqueries appear in nearly every "compare to a benchmark" request: invoices above the vendor\'s own average, payroll that is more than 20% above last month, journals posted by users who are not on the approver list (`NOT EXISTS`). Write each step as its own small query first, check its result, and only then put it inside the outer query. When a data-quality rule is "this must not exist", that rule is a `NOT EXISTS` query, and it becomes a test in your pipeline.' },
    { interview: '"What is the difference between IN and EXISTS, and what is a correlated subquery?" Model answer: "IN compares a value with a list produced by the subquery, and EXISTS only tests whether the subquery returns at least one row. A correlated subquery refers to a column of the outer query, so it is evaluated for each outer row. EXISTS is safer with NOT, because NOT IN returns nothing when the list contains a NULL. Modern PostgreSQL plans IN and EXISTS well, so I choose by readability and NULL safety." Follow-up: "Find employees who earn more than their department average" (correlated subquery, or a window function `AVG() OVER (PARTITION BY department)`).' },
    `## Recap
- A **subquery** is a query inside brackets inside another query. Its **shape** decides where it fits: scalar (one value), list (one column), or table.
- **Scalar** subqueries work with \`=\`, \`>\`, \`<\` in WHERE, HAVING and SELECT. More than one row is an error; zero rows gives NULL.
- **IN** tests membership in a list; it never multiplies rows. Avoid \`NOT IN\`: one NULL in the list makes it return nothing.
- A **correlated** subquery uses a column of the outer row, so it runs for each outer row: "above the average of their own department" (10 employees).
- **EXISTS** asks "is there at least one matching row?" (use \`SELECT 1\`); **NOT EXISTS** is the NULL-safe anti-join. A **derived table** (subquery in FROM) gives you an aggregate of an aggregate and fixes fan-out.
- Correlated MAX for "latest per group" returns ties. Use \`ROW_NUMBER\` when you need exactly one row.`,
  ],
  quiz: [
    { q: '`WHERE customer_id = (SELECT customer_id FROM customers WHERE city = \'Hyderabad\')` fails with "more than one row returned by a subquery used as an expression". What is the right fix if you mean "any of those customers"?', o: ['Add LIMIT 1 and accept a random customer', 'Use ORDER BY inside the subquery', 'Wrap it in COALESCE', 'Replace = with IN'], a: 3, why: 'A scalar subquery must return one row. Several customers live in Hyderabad, so you need IN, which accepts a list.' },
    { q: 'What makes a subquery "correlated"?', o: ['It uses GROUP BY', 'It refers to a column of the outer query, so it is evaluated for each outer row', 'It is written in the FROM clause', 'It returns more than one column'], a: 1, why: 'The inner query depends on the current outer row (for example e.department), so it cannot be run on its own.' },
    { q: 'Why is NOT EXISTS safer than NOT IN when the subquery column can contain NULL?', o: ['NOT EXISTS is always faster', 'NOT IN cannot use a subquery', 'One NULL in a NOT IN list makes the condition never true, but NOT EXISTS ignores NULLs', 'NOT EXISTS returns more rows by design'], a: 2, why: 'x NOT IN (…, NULL) includes x <> NULL, which is unknown, so no row is kept. NOT EXISTS only checks whether a matching row exists.' },
    { q: 'Why do people write `SELECT 1` inside `EXISTS (SELECT 1 FROM …)`?', o: ['Only whether a row exists matters, not the column values', 'EXISTS requires a number', 'It makes the subquery return one row only', 'It converts the result to a boolean'], a: 0, why: 'EXISTS tests for the presence of any row. The selected columns are never used, so 1 is a neutral placeholder.' },
    { q: 'Which query returns the orders larger than the overall average without typing the average?', o: ['SELECT * FROM orders HAVING amount > AVG(amount)', 'SELECT * FROM orders WHERE amount > (SELECT AVG(amount) FROM orders)', 'SELECT * FROM orders WHERE amount > AVG(amount)', 'SELECT * FROM orders GROUP BY amount > AVG(amount)'], a: 1, why: 'An aggregate cannot be used directly in WHERE. A scalar subquery calculates the average first and gives WHERE a single value to compare with.' },
    { q: 'A correlated `MAX(order_date)` subquery for "latest order per customer" returns 12 rows for 11 customers. Why?', o: ['One customer has no orders', 'The subquery is not correlated', 'Customer 8 has two orders on the same latest date, so both match', 'MAX counts NULLs'], a: 2, why: 'The condition is "order_date equals the latest date". Both orders 73 and 220 have that date, so both are returned. Use ROW_NUMBER with a tiebreaker for exactly one row.' },
  ],
  task: {
    title: 'Practise subqueries on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `11_subqueries.sql` in `C:\\sql-practice`.',
      'Query 1: orders above the overall average, with a column showing the difference (expect 77 rows). Query 2: customers with at least one order of 3,00,000 or more, using `IN` (expect 6 rows).',
      'Query 3: employees above their department average with a correlated subquery (expect 10 rows). Write a comment explaining in one sentence why the inner query needs the alias `x`.',
      'Query 4: employees who manage nobody, once with `NOT IN` (it returns nothing) and once with `NOT EXISTS` (expect 15). Add a comment about the NULL.',
    ],
    deliverable: '`11_subqueries.sql` with four commented queries; the counts 77, 6, 10 and 15 appear in your results.',
  },
};
