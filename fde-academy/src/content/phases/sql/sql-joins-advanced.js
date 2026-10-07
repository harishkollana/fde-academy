export default {
  id: 'sql-joins-advanced',
  title: 'Join patterns and traps: self, anti, semi, cross and fan-out',
  goal: 'You can join a table to itself, find rows with no match, build a full grid with CROSS JOIN, and recognise and avoid fan-out when a join multiplies your rows.',
  roadmap: [
    'Self join (employee-manager, account-parent)',
    'CROSS JOIN scaffolding',
    'Anti-join and semi-join',
    'Fan-out, NULL keys and many-to-many joins',
  ],
  blocks: [
    `## The problem
Four requests, and a plain \`INNER JOIN\` answers none of them well.

1. *"List every employee with the name of their manager."* Employees and managers are **in the same table**.
2. *"Which customers have never placed an order?"* You need the rows that have **no** match.
3. *"After I added payroll to my query, the company's total CTC doubled."* The join **multiplied** the rows.
4. *"Give me a line for every entity and every account, even when nothing was posted."* You need **every combination**, including the empty ones.

These are the join patterns of everyday work. Each one is simple once you see the mechanism, and each has a trap that produces a wrong number without any error message.`,
    `## Self join: a table joined to itself
In \`employees\`, the column \`manager_id\` holds the \`emp_id\` of another employee **in the same table**. To show the manager's name, you join the table to itself. Give it two different aliases and treat it as two tables: \`e\` is "the employee" and \`m\` is "the manager".

\`\`\`sql
SELECT e.emp_name AS employee, m.emp_name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.emp_id = e.manager_id;
\`\`\`
The two aliases are not optional: without them Postgres cannot tell which copy a column belongs to. We use \`LEFT JOIN\` because of **employee 1**, the top boss. His \`manager_id\` is NULL, and NULL never matches anything. With an INNER JOIN he would disappear (19 rows instead of 20).

The same pattern gives the **account hierarchy**: \`dim_account AS a LEFT JOIN dim_account AS p ON p.account_id = a.parent_account_id\` shows each account next to its parent (6110 Salaries sits under 6100 People Costs). A self join climbs **one** level. For a whole tree of unknown depth you need a recursive CTE, which comes in the CTEs lesson.`,
    { sketch: { w: 760, h: 345, caption: 'A self join uses the same table twice. manager_id on the employee side is matched to emp_id on the manager side.', items: [
      { t: 'table', x: 20, y: 56, title: 'employees AS e', cols: ['emp_id', 'emp_name', 'manager_id'], colW: [70, 110, 110], rows: [['1', 'Aarav', null], ['2', 'Diya', '1'], ['6', 'Ananya', '2']] },
      { t: 'table', x: 440, y: 56, title: 'employees AS m (same table)', cols: ['emp_id', 'emp_name'], colW: [70, 110], rows: [['1', 'Aarav'], ['2', 'Diya'], ['6', 'Ananya']], fill: 'green' },
      { t: 'arrow', x1: 312, y1: 126, x2: 438, y2: 98, color: '#2f9e44' },
      { t: 'arrow', x1: 312, y1: 154, x2: 438, y2: 126, color: '#2f9e44' },
      { t: 'mark', x: 335, y: 98, ok: false },
      { t: 'text', x: 540, y: 190, text: 'ON m.emp_id = e.manager_id', size: 15, color: '#2f9e44' },
      { t: 'table', x: 20, y: 212, title: 'result of the LEFT JOIN', cols: ['employee', 'manager'], colW: [110, 110], rows: [['Aarav', null], ['Diya', 'Aarav'], ['Ananya', 'Diya']], fill: 'yellow' },
      { t: 'note', x: 290, y: 222, w: 450, h: 72, text: 'Aarav has no manager (NULL matches nothing).\nLEFT JOIN keeps his row, with a NULL manager.\nAn INNER JOIN would drop him: 19 rows, not 20.', fill: 'pink', size: 14 },
    ] } },
    { sql: {
      title: 'Employee and manager; account and parent',
      starter: `-- Employee with manager name. LEFT JOIN keeps the top boss.
SELECT e.emp_id, e.emp_name, m.emp_name AS manager
FROM employees e
LEFT JOIN employees m ON m.emp_id = e.manager_id
ORDER BY e.emp_id
LIMIT 8;

-- The row counts: INNER loses employee 1
SELECT (SELECT COUNT(*) FROM employees e JOIN      employees m ON m.emp_id = e.manager_id) AS inner_rows,
       (SELECT COUNT(*) FROM employees e LEFT JOIN employees m ON m.emp_id = e.manager_id) AS left_rows;

-- Each account next to its parent account (one level up)
SELECT a.account_id, a.account_name, p.account_name AS parent_account
FROM dim_account a
LEFT JOIN dim_account p ON p.account_id = a.parent_account_id
ORDER BY a.account_id;`,
      note: 'Employee 1 has a NULL manager. The count query shows 19 and 20. In the account list, the five top-level accounts (1000, 2000, 4000, 5000, 6000) have no parent.',
    } },
    `## Anti-join and semi-join: rows with and without a partner
These two patterns do not add columns from the other table. They only ask **whether a match exists**.

**Anti-join: "rows in A that have no match in B."** The classic: customers who never ordered. The usual way is a \`LEFT JOIN\` followed by a test for the NULL the join left behind:

\`\`\`sql
SELECT c.customer_id, c.customer_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;          -- no order found: customers 11 and 12
\`\`\`
Turn the tables around and you find orphans: \`orders LEFT JOIN customers … WHERE c.customer_id IS NULL\` returns order 77, whose customer 99 does not exist. Anti-joins are the core of every "what is missing?" check.

**Semi-join: "rows in A that have at least one match in B."** Use \`EXISTS\`:

\`\`\`sql
SELECT c.customer_id, c.customer_name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
\`\`\`
This lists each customer **once**, even if they have 26 orders. An \`INNER JOIN\` would repeat the customer 26 times, which is exactly the problem of the next section. The anti-join also has an \`EXISTS\` form, \`NOT EXISTS\`, which the subqueries lesson covers. (The visualizer in the previous lesson has ANTI and SEMI buttons if you want to see them again.)`,
    { sql: {
      title: 'Anti-joins and a semi-join',
      starter: `-- Anti-join: customers who never ordered
SELECT c.customer_id, c.customer_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;

-- Anti-join the other way: orders whose customer does not exist
SELECT o.order_id, o.customer_id, o.amount
FROM orders o
LEFT JOIN customers c ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL;

-- Semi-join: customers with at least one order, each listed once
SELECT c.customer_id, c.customer_name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)
ORDER BY c.customer_id;`,
      note: 'The first query returns customers 11 (Kite Media) and 12 (Lotus Motors). The second returns order 77 with customer_id 99. The semi-join returns 10 customers.',
    } },
    `## Fan-out: when a join multiplies your rows
Every table has a **grain**: what one row means. \`employees\` has one row per employee. \`payroll\` has one row per employee **per month**, and it holds two months, so every employee appears **twice**.

When you join a "one" table to a "many" table, each row of the "one" side is **repeated once for every match**. If you then add up a column from the one side, you add it once for each repeat. This is **fan-out**.`,
    { sketch: { w: 760, h: 290, caption: 'Fan-out: joining employees to payroll repeats each employee once per payroll row, so SUM(annual_ctc) counts everyone twice.', items: [
      { t: 'table', x: 15, y: 56, title: 'employees', cols: ['emp', 'ctc'], colW: [90, 70], rows: [['Aarav', '42L'], ['Diya', '27L']] },
      { t: 'table', x: 235, y: 56, title: 'payroll (2 months)', cols: ['emp', 'month'], colW: [90, 80], rows: [['Aarav', 'Aug'], ['Aarav', 'Sep'], ['Diya', 'Aug'], ['Diya', 'Sep']], fill: 'green' },
      { t: 'arrow', x1: 179, y1: 100, x2: 233, y2: 100, label: 'ON emp', lx: 0, ly: -12 },
      { t: 'arrow', x1: 409, y1: 130, x2: 498, y2: 130, label: 'result', lx: 0, ly: -12 },
      { t: 'table', x: 502, y: 56, title: 'after the JOIN', cols: ['emp', 'ctc', 'month'], colW: [80, 60, 80], rows: [['Aarav', '42L', 'Aug'], ['Aarav', '42L', 'Sep'], ['Diya', '27L', 'Aug'], ['Diya', '27L', 'Sep']], fill: 'pink', hl: [0, 1, 2, 3] },
      { t: 'note', x: 15, y: 220, w: 395, h: 56, text: 'Each employee has 2 payroll rows,\nso the join makes 2 copies of each employee.', fill: 'yellow', size: 15 },
      { t: 'note', x: 435, y: 220, w: 310, h: 56, text: 'SUM(ctc) = 42 + 42 + 27 + 27 = 138\nbut the real total is 42 + 27 = 69', fill: 'pink', size: 15 },
    ] } },
    `In the real data the damage is easy to measure. The 20 employees have a total CTC of **₹3,89,00,000**. Join them to \`payroll\` (40 rows) and the same \`SUM(annual_ctc)\` says **₹7,78,00,000**. Nothing failed. The report is simply twice as large.

Defences against fan-out:
- **Know the grain** of each table before you join, and write it in a comment.
- After a join, **compare the row count** with the table you meant to keep. 20 employees should still be 20 rows. If it is 40, the join multiplied.
- **Aggregate the "many" side down to the grain of the "one" side first**, then join. (A query in brackets used as a table is called a subquery; the next module explains them.)
- If you only need to know **whether** a match exists, use a **semi-join** (\`EXISTS\`): it never multiplies.

### Many-to-many: the worst case
Fan-out gets dramatic when both sides repeat. In the GST reconciliation, \`purchase_register\` has 30 invoices from only 6 different supplier GSTINs, and \`supplier_invoices\` has 29. Join them on \`supplier_gstin\` alone and every invoice of a supplier is paired with every invoice of that supplier on the other side: **156 rows**. Join on the full key, GSTIN **and** invoice number, and you get **23 exact matches**. (The other invoices differ by a typo or are missing on one side. Finding them is the job of the reconciliation lesson.) Always join on the **complete** key that identifies a record.`,
    { sql: {
      title: 'Fan-out and many-to-many, measured',
      starter: `-- The true total, one row per employee
SELECT SUM(annual_ctc) AS total_ctc, COUNT(*) AS rows_counted
FROM employees;

-- After joining payroll: every employee appears twice
SELECT SUM(e.annual_ctc) AS fanned_out_ctc, COUNT(*) AS rows_counted
FROM employees e
JOIN payroll p ON p.emp_id = e.emp_id;

-- The fix: reduce payroll to one row per employee first, then join
SELECT SUM(e.annual_ctc) AS fixed_ctc, COUNT(*) AS rows_counted
FROM employees e
JOIN (SELECT emp_id, SUM(gross_pay) AS gross_paid FROM payroll GROUP BY emp_id) p
  ON p.emp_id = e.emp_id;

-- Many-to-many: GSTIN alone vs the full key
SELECT (SELECT COUNT(*) FROM purchase_register p
          JOIN supplier_invoices s ON s.supplier_gstin = p.supplier_gstin) AS gstin_only,
       (SELECT COUNT(*) FROM purchase_register p
          JOIN supplier_invoices s ON s.supplier_gstin = p.supplier_gstin
                                  AND s.invoice_no     = p.invoice_no)     AS gstin_and_invoice_no;`,
      note: 'You should see 3,89,00,000 with 20 rows; then 7,78,00,000 with 40 rows; then 3,89,00,000 with 20 rows again; and finally 156 against 23. The third query is the fixed version of the second one: compare their totals and row counts.',
    } },
    { warn: '**Fan-out never raises an error.** The query runs, the report looks fine, and the total is simply too big. Whenever a number in a joined report looks "a bit high", count the rows before and after the join. This single habit catches most join bugs.' },
    `## NULL keys never match
\`NULL = NULL\` is not true (the NULLs lesson), and a join condition is an equality test. So **rows with a NULL key never find a partner**. That was employee 1 in the self join. In an inner join the row vanishes, and in a LEFT JOIN it stays with NULLs. If you really want NULL to match NULL, write the condition with \`IS NOT DISTINCT FROM\`:

\`\`\`sql
ON a.key IS NOT DISTINCT FROM b.key      -- treats NULL as a normal value
\`\`\`
Use it rarely and on purpose. Usually a NULL key is a data problem you want to **see**, not hide.

## CROSS JOIN: every combination
\`A CROSS JOIN B\` has no \`ON\`. It pairs **every row of A with every row of B**: 3 entities × 15 accounts = 45 rows. That sounds useless, but it is the standard way to build a **scaffold**: a complete grid of everything that *should* exist. You then \`LEFT JOIN\` the facts onto the scaffold, and the combinations without data show up as zero instead of being missing.

For example: *which accounts have never had a posting, in any entity?* Without the scaffold you cannot list something that is not in \`fact_gl\`:

\`\`\`sql
SELECT e.entity_code, a.account_code, a.account_name, COUNT(g.gl_id) AS lines
FROM dim_entity e
CROSS JOIN dim_account a                             -- the full grid: 3 × 15 = 45
LEFT JOIN fact_gl g ON g.entity_id = e.entity_id
                   AND g.account_id = a.account_id
GROUP BY e.entity_code, a.account_code, a.account_name
HAVING COUNT(g.gl_id) = 0;                           -- grid cells with no data
\`\`\`
The answer is 12 rows: the four **header accounts** 4000, 5000, 6000 and 6100 for each of the three entities. They only group other accounts, so nothing is posted to them. The same trick, with a calendar of months as one side, gives you a report that shows a month with no sales as 0 and not as a missing row. Be careful: \`CROSS JOIN\` of two big tables is the fastest way to create a query that never finishes.`,
    { sql: {
      title: 'Scaffold: the full grid, then the facts',
      starter: `-- 3 entities x 15 accounts = 45 combinations; the LEFT JOIN adds the postings
SELECT e.entity_code, a.account_code, a.account_name, COUNT(g.gl_id) AS lines
FROM dim_entity e
CROSS JOIN dim_account a
LEFT JOIN fact_gl g ON g.entity_id = e.entity_id AND g.account_id = a.account_id
GROUP BY e.entity_code, a.account_code, a.account_name
HAVING COUNT(g.gl_id) = 0
ORDER BY e.entity_code, a.account_code;

-- Without the scaffold you never see them: only combinations that have postings
SELECT COUNT(*) AS combinations_with_postings
FROM (SELECT DISTINCT entity_id, account_id FROM fact_gl) t;

-- NULL keys: NULL matches NULL only with IS NOT DISTINCT FROM
SELECT COUNT(*) AS plain_equals
FROM (VALUES (1), (NULL)) AS a(x) JOIN (VALUES (1), (NULL)) AS b(x) ON a.x = b.x;
SELECT COUNT(*) AS not_distinct
FROM (VALUES (1), (NULL)) AS a(x) JOIN (VALUES (1), (NULL)) AS b(x) ON a.x IS NOT DISTINCT FROM b.x;`,
      note: 'The first query lists 12 rows (accounts 4000, 5000, 6000, 6100 for each entity). Only 33 combinations (45 - 12) have postings. The last two queries return 1 and 2.',
    } },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-joins-advanced-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Employee directory. Return `emp_id, emp_name, manager_name` for **all 20 employees**, where `manager_name` is the name of their manager (NULL for the top boss). Sort by `emp_id`.',
      hint: 'Join employees to itself: employees e LEFT JOIN employees m ON m.emp_id = e.manager_id.',
      solution: `SELECT e.emp_id, e.emp_name, m.emp_name AS manager_name
FROM employees e
LEFT JOIN employees m ON m.emp_id = e.manager_id
ORDER BY e.emp_id`,
    } },
    { challenge: {
      id: 'sql-joins-advanced-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Find the customers who **never placed an order**: `customer_id, customer_name`, sorted by `customer_id`. (2 rows.) Any correct anti-join works.',
      hint: 'customers LEFT JOIN orders ... WHERE o.order_id IS NULL. Do not use NOT IN unless you filter NULLs.',
      solution: `SELECT c.customer_id, c.customer_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL
ORDER BY c.customer_id`,
    } },
    { challenge: {
      id: 'sql-joins-advanced-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Which account has never been posted to in any entity? Build the full grid of entities and accounts with `CROSS JOIN`, `LEFT JOIN` the `fact_gl` lines onto it, and return the combinations with **no postings**: `entity_code, account_code, account_name`. Sort by `entity_code`, then `account_code`. (12 rows.)',
      hint: 'dim_entity e CROSS JOIN dim_account a LEFT JOIN fact_gl g ON g.entity_id = e.entity_id AND g.account_id = a.account_id, GROUP BY the three output columns, HAVING COUNT(g.gl_id) = 0.',
      solution: `SELECT e.entity_code, a.account_code, a.account_name
FROM dim_entity e
CROSS JOIN dim_account a
LEFT JOIN fact_gl g ON g.entity_id = e.entity_id AND g.account_id = a.account_id
GROUP BY e.entity_code, a.account_code, a.account_name
HAVING COUNT(g.gl_id) = 0
ORDER BY e.entity_code, a.account_code`,
    } },
    { real: 'Fan-out is the number-one cause of inflated totals in reports built by joining tables. A GST reconciliation that joins on GSTIN only will "match" every invoice of a supplier to every other invoice of that supplier, so the matched amount can be many times the real one. Match on the **full key** (GSTIN + invoice number, and often the date), check that each side matches **at most once**, and put a test in the pipeline: `COUNT(*)` after the join must equal `COUNT(*)` before it. That one-line assertion will save you more hours than any other check in this course.' },
    { interview: '"You join orders to order_lines and SUM(order_total). The result is too high. Why, and how do you fix it?" Model answer: "The order table has one row per order but the lines table has several lines per order, so the join repeats each order once per line. SUM(order_total) then counts the total once per line. I would aggregate the lines to one row per order before joining, or sum the line amounts instead of the order total, or use a semi-join if I only need to know that lines exist. I always compare the row count before and after a join." Another common question: "How do you find rows in A with no match in B?" (LEFT JOIN … IS NULL, or NOT EXISTS; careful with NOT IN and NULLs).' },
    `## Recap
- **Self join**: the same table twice with two aliases (\`e\` and \`m\`). Use \`LEFT JOIN\` so rows with a NULL key, such as the top boss, are kept. A self join climbs one level; a recursive CTE climbs the whole tree.
- **Anti-join** (\`LEFT JOIN … WHERE right.key IS NULL\`) finds rows with no match: customers 11 and 12, and the orphan order 77. **Semi-join** (\`WHERE EXISTS\`) finds rows with at least one match, each listed once.
- **Fan-out**: joining one-to-many repeats the "one" rows, so sums from the one side are inflated (3,89,00,000 became 7,78,00,000). Know the grain, compare row counts, aggregate before you join.
- **Many-to-many** on a partial key explodes (156 rows against 23 exact matches on the full key). Join on the complete key.
- **NULL keys never match**, unless you use \`IS NOT DISTINCT FROM\`.
- **CROSS JOIN** builds the full grid of combinations (a scaffold). \`LEFT JOIN\` the facts onto it to see the combinations that have no data (12 never-posted accounts).`,
  ],
  quiz: [
    { q: 'Why must a self join give the table two different aliases?', o: ['Postgres limits a table to one use per query', 'Without aliases, column names like emp_id are ambiguous: which copy of the table is meant?', 'Aliases make the query faster', 'A self join only works with CROSS JOIN'], a: 1, why: 'The same table appears twice, so every column exists twice. The aliases (e and m) say which copy each column belongs to.' },
    { q: 'Which query correctly lists customers who have never ordered?', o: ['customers INNER JOIN orders … WHERE o.order_id IS NULL', 'customers LEFT JOIN orders … WHERE o.order_id = NULL', 'customers RIGHT JOIN orders … WHERE c.customer_id IS NOT NULL', 'customers LEFT JOIN orders … WHERE o.order_id IS NULL'], a: 3, why: 'The LEFT JOIN leaves NULLs in the order columns for customers without orders, and IS NULL finds them. INNER JOIN has no such rows, and = NULL is never true.' },
    { q: 'You join employees (20 rows) to payroll (2 rows per employee) and run SUM(annual_ctc). What do you get?', o: ['Twice the real total, because each employee appears twice', 'The correct total', 'An error: ambiguous column', 'Half of the real total'], a: 0, why: 'This is fan-out: the join produces 40 rows, so every annual_ctc is added twice.' },
    { q: 'Which pattern lists each customer at most once, even if they have 26 orders, without any DISTINCT?', o: ['INNER JOIN', 'LEFT JOIN', 'Semi-join with EXISTS', 'CROSS JOIN'], a: 2, why: 'EXISTS only tests whether a match exists, so it never repeats the left row. INNER and LEFT joins repeat it once per matching order.' },
    { q: 'Joining purchase_register to supplier_invoices on supplier_gstin alone returns 156 rows, but only 23 invoices match exactly. What is wrong?', o: ['The tables need a RIGHT JOIN', 'GSTIN is always NULL', 'DISTINCT was forgotten', 'The key is incomplete: every invoice of a GSTIN matches every invoice of the same GSTIN on the other side'], a: 3, why: 'This is a many-to-many join. Add the rest of the key (invoice number, and often date) so each record matches at most once.' },
    { q: 'What is the purpose of a CROSS JOIN scaffold followed by a LEFT JOIN of the facts?', o: ['To make the query faster', 'To see every combination of the two lists, including those with no data', 'To remove duplicates', 'To sort the result'], a: 1, why: 'The CROSS JOIN builds the complete grid. The LEFT JOIN then shows the facts, and combinations without data appear with NULL or 0 instead of missing.' },
  ],
  task: {
    title: 'Practise the join patterns on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `10_join_patterns.sql` in `C:\\sql-practice`.',
      'Query 1: employees with their manager (20 rows). Then change LEFT JOIN to JOIN and note in a comment which employee disappears and why.',
      'Query 2: customers who never ordered, with a LEFT JOIN anti-join (expect customers 11 and 12), and the orphan order 77 with the join turned around.',
      'Query 3: the total CTC of all employees, then the same SUM after joining payroll. Write down both numbers (3,89,00,000 and 7,78,00,000) and a one-line comment on the grain of each table.',
      'Query 4: the scaffold query for accounts that were never posted to (expect 12 rows).',
    ],
    deliverable: '`10_join_patterns.sql` with four commented queries; the numbers 19 and 20, 2, 38900000 and 77800000, and 12 appear in your results.',
  },
};
