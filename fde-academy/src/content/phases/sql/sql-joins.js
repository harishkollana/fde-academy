export default {
  id: 'sql-joins',
  title: 'Joins: INNER, LEFT, RIGHT and FULL',
  goal: 'You can combine tables with INNER, LEFT, RIGHT and FULL joins, predict the row count, put conditions in ON or WHERE on purpose, and join a fact table to its dimensions and the FX rates.',
  roadmap: [
    'INNER, LEFT, RIGHT, FULL joins',
    'ON vs WHERE',
    'Joining a fact table to dimension tables',
  ],
  blocks: [
    `## The problem
The controller sends you a list of sales and asks: *"Can I have the customer **name** next to each order? A customer id like 7 means nothing to me."*

Look at the \`orders\` table. It has \`customer_id\`, a number, but no names. The names live in the \`customers\` table. This is not a mistake. Databases store each fact **once**: a customer's name sits in one row of \`customers\`, and every order only points to it with the id. If Gemini Clinics changes its name, you update one row, and all 26 of its orders show the new name.

The price of this design is that to see names next to orders, you must **stitch the tables back together** when you ask the question. That stitching is a **join**.`,
    `## Keys: how tables point at each other
- A **primary key** (PK) is the column that identifies each row of a table uniquely. \`customers.customer_id\` is the PK of customers: no two rows share it.
- A **foreign key** (FK) is a column in another table that stores those ids. \`orders.customer_id\` is an FK: each order says which customer it belongs to.

A join says: *"pair every order with the customer row whose PK equals the order's FK."* That sentence is the \`ON\` clause:

\`\`\`sql
SELECT o.order_id, o.amount, c.customer_name
FROM orders AS o
INNER JOIN customers AS c ON c.customer_id = o.customer_id;
\`\`\`
Read it like this: *take each row of \`orders\`; find the customer rows where \`customer_id\` is equal; output one result row for each matching pair.* The aliases \`o\` and \`c\` are now required, because both tables have a column called \`customer_id\`. Without the prefix, Postgres stops with *column reference "customer_id" is ambiguous*.

(\`JOIN\` alone means \`INNER JOIN\`. If the two columns have the same name you may write \`USING (customer_id)\` instead of \`ON …\`.)`,
    { sketch: { w: 760, h: 310, caption: 'A join pairs the rows whose keys are equal. The three join types differ only in what happens to rows that have no partner.', items: [
      { t: 'text', x: 310, y: 22, text: 'ON c.id = o.cust', size: 16, color: '#c2410c' },
      { t: 'table', x: 20, y: 52, title: 'customers (c)', cols: ['id', 'name'], colW: [50, 160], rows: [['1', 'Apex Retail'], ['2', 'Blue Lotus'], ['3', 'Coastal Pharma'], ['4', 'Delta Schools']] },
      { t: 'table', x: 400, y: 52, title: 'orders (o)', cols: ['oid', 'cust', 'amt'], colW: [60, 60, 90], rows: [['101', '1', '5,400'], ['102', '1', '1,800'], ['103', '3', '21,000'], ['104', '9', '900']] },
      { t: 'arrow', x1: 232, y1: 94, x2: 398, y2: 94, color: '#2f9e44' },
      { t: 'arrow', x1: 232, y1: 94, x2: 398, y2: 122, color: '#2f9e44' },
      { t: 'arrow', x1: 232, y1: 150, x2: 398, y2: 150, color: '#2f9e44' },
      { t: 'mark', x: 262, y: 122, ok: false },
      { t: 'mark', x: 262, y: 178, ok: false },
      { t: 'mark', x: 378, y: 178, ok: false },
      { t: 'text', x: 625, y: 178, text: 'no customer 9', size: 15, color: '#e03131', anchor: 'start' },
      { t: 'note', x: 20, y: 236, w: 230, h: 56, text: 'INNER: 3 rows\nonly the matched pairs', fill: 'blue', size: 15 },
      { t: 'note', x: 265, y: 236, w: 235, h: 56, text: 'LEFT: 5 rows\n+ customers 2 and 4 with NULLs', fill: 'orange', size: 15 },
      { t: 'note', x: 515, y: 236, w: 230, h: 56, text: 'FULL: 6 rows\n+ order 104 with NULL customer', fill: 'green', size: 15 },
    ] } },
    `## What happens to rows without a partner
Not every row finds a match. In the Kollana data two things are deliberately wrong:
- **Customers 11 and 12 have never ordered.** They have no partner in \`orders\`.
- **Order 77 belongs to customer 99**, who does not exist in \`customers\`. It is an orphan.

The join type decides what happens to such rows:

| Join | Keeps | Orders and customers |
|---|---|---|
| \`INNER JOIN\` | only pairs that match | **219** rows (order 77 is dropped) |
| \`LEFT JOIN\` (customers on the left) | every row of the left table; NULLs where the right has no match | **221** rows (219 + customers 11 and 12) |
| \`RIGHT JOIN\` | every row of the right table; NULLs where the left has no match | **220** rows (219 + order 77 with a NULL customer) |
| \`FULL JOIN\` | every row of both tables | **222** rows (219 + 2 customers + 1 order) |

Two points that save a lot of confusion:
- An **inner join silently drops** rows. Your 220 orders became 219 and no error told you. Whenever you join, compare the row count before and after.
- **\`RIGHT JOIN\` is just \`LEFT JOIN\` with the tables swapped.** Most people never write it. Pick one table to be "the main one", put it on the left, and use \`LEFT JOIN\` for everything else. Your queries will read the same way every time.

\`LEFT OUTER JOIN\` and \`LEFT JOIN\` are the same thing; the word OUTER is optional.`,
    { sql: {
      title: 'The four joins and their row counts',
      starter: `-- INNER JOIN: only matched pairs. Look at the first rows.
SELECT o.order_id, o.amount, c.customer_name
FROM orders AS o
INNER JOIN customers AS c ON c.customer_id = o.customer_id
ORDER BY o.order_id
LIMIT 5;

-- Row counts of all four joins
SELECT
  (SELECT COUNT(*) FROM orders o    JOIN      customers c ON c.customer_id = o.customer_id) AS inner_rows,
  (SELECT COUNT(*) FROM customers c LEFT JOIN orders o    ON o.customer_id = c.customer_id) AS left_rows,
  (SELECT COUNT(*) FROM customers c RIGHT JOIN orders o   ON o.customer_id = c.customer_id) AS right_rows,
  (SELECT COUNT(*) FROM customers c FULL JOIN orders o    ON o.customer_id = c.customer_id) AS full_rows;

-- The two rows without a partner: customers who never ordered, and the orphan order
SELECT c.customer_id, c.customer_name, o.order_id
FROM customers c FULL JOIN orders o ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL OR o.order_id IS NULL
ORDER BY c.customer_id, o.order_id;`,
      note: 'Expected: 219, 221, 220 and 222. The last query returns three rows: customers 11 and 12 with a NULL order, and order 77 with a NULL customer.',
    } },
    `Now try the visualizer. It uses four customers and four orders so you can see every match. Click each join type and watch which rows light up: **INNER** gives 3 rows, **LEFT** gives 5 (Blue Lotus and Delta Schools appear with NULL orders), **RIGHT** gives 4 (order 104 has no customer), and **FULL** gives 6. The two last buttons, ANTI and SEMI, are patterns for the next lesson.`,
    { widget: 'JoinVisualizer' },
    `## ON vs WHERE: the LEFT JOIN trap
Both \`ON\` and \`WHERE\` hold conditions, but they act at different moments:

- **\`ON\`** decides **which rows pair up**. For a LEFT JOIN, rows of the left table without a match are still kept, with NULLs.
- **\`WHERE\`** filters the **finished result**. It runs after the join and removes any row that fails.

For an INNER JOIN the difference does not matter, and many people put filters in either place. For a **LEFT JOIN it changes the answer**. Suppose the question is: *"For every customer, how many Delivered orders do they have? Show 0 if none."* Look at the two ways to write the filter:

\`\`\`sql
-- Wrong: the WHERE removes the rows with NULLs, so customers 11 and 12 disappear.
-- The LEFT JOIN has quietly become an INNER JOIN.
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'Delivered'

-- Right: the filter is part of the matching. Customers with no delivered order stay, with NULLs.
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'Delivered'
\`\`\`
The rule: **a condition on the right-hand table of a LEFT JOIN belongs in ON**. A condition on the left-hand table can go in WHERE.

There is a second trap in the same query, in the counting. After a LEFT JOIN, a customer with no orders still produces **one** row, filled with NULLs. \`COUNT(*)\` counts that row and says 1. \`COUNT(o.order_id)\` skips the NULL and says 0, which is the truth. When you count what the right table contributes, **count a column of the right table**.`,
    { sql: {
      title: 'Delivered orders per customer, done right and wrong',
      starter: `-- Wrong: WHERE turns the LEFT JOIN into an INNER JOIN (only 10 customers survive)
SELECT COUNT(DISTINCT c.customer_id) AS customers_in_wrong_version
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'Delivered';

-- Right: the status test lives in ON. All 12 customers appear.
SELECT c.customer_id, c.customer_name,
       COUNT(*)          AS count_star_wrong,
       COUNT(o.order_id) AS delivered_orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'Delivered'
GROUP BY c.customer_id, c.customer_name
ORDER BY c.customer_id;`,
      note: 'The first query says 10. The second lists 12 customers. For customers 11 and 12, count_star_wrong is 1 (the NULL row) while delivered_orders is 0.',
    } },
    { warn: 'Joins can **multiply** rows as well as drop them. If one customer matches 26 orders, that customer appears 26 times. A `SUM` of a customer-level number after such a join is multiplied by 26. The next lesson ("fan-out") shows how to spot and avoid it. The habit that protects you now: count the rows before and after every join.' },
    `## Joining a fact table to its dimensions
Real reporting queries join a **fact table** (events with numbers: \`fact_gl\`) to several **dimension tables** (descriptions: who, where, what). Each join is one more \`JOIN … ON\` line. The ids in \`fact_gl\` become names:

- \`entity_id\` → \`dim_entity\` (entity code and name)
- \`bu_id\` → \`dim_bu\` (business unit)
- \`account_id\` → \`dim_account\` (account name and type)

### The multi-column join: converting to rupees
\`fact_gl\` amounts are in the entity's own currency. To report in rupees you join \`fx_rates\`, and a rate is identified by **two** things: the currency **and** the month. Both go in \`ON\`, joined with \`AND\`:

\`\`\`sql
LEFT JOIN fx_rates r
       ON r.currency   = g.currency
      AND r.rate_month = DATE_TRUNC('month', g.posting_date)::date
\`\`\`
\`DATE_TRUNC('month', d)\` cuts a date down to the first day of its month (5 Feb 2026 becomes 1 Feb 2026), which is exactly how \`rate_month\` is stored. The dates lesson explains it fully.

Why **LEFT** JOIN and not INNER? Because the FX table is **incomplete on purpose**: the SGD rate for February 2026 is missing. An INNER JOIN would silently throw away every Singapore line from that month and your rupee total would be too low with no warning. A LEFT JOIN keeps the lines and shows a **NULL rate**, so you can find them, count them and raise an exception.`,
    { sketch: { w: 760, h: 290, caption: 'The fact table sits in the middle and each dimension joins on one key. The FX table needs two keys, and a LEFT JOIN keeps the lines that find no rate.', items: [
      { t: 'box', x: 300, y: 100, w: 170, h: 74, label: 'fact_gl', sub: 'one row per journal line', fill: 'yellow', size: 20 },
      { t: 'box', x: 30, y: 28, w: 190, h: 56, label: 'dim_account', sub: 'name, type', fill: 'blue', size: 17 },
      { t: 'box', x: 30, y: 112, w: 190, h: 56, label: 'dim_entity', sub: 'code, currency', fill: 'blue', size: 17 },
      { t: 'box', x: 30, y: 196, w: 190, h: 56, label: 'dim_bu', sub: 'business unit', fill: 'blue', size: 17 },
      { t: 'box', x: 550, y: 100, w: 190, h: 74, label: 'fx_rates', sub: 'rate_to_inr', fill: 'pink', size: 18 },
      { t: 'arrow', x1: 298, y1: 120, x2: 222, y2: 62, label: 'account_id', lx: 0, ly: -14 },
      { t: 'arrow', x1: 298, y1: 138, x2: 222, y2: 140, label: 'entity_id', lx: 0, ly: -12 },
      { t: 'arrow', x1: 298, y1: 158, x2: 222, y2: 216, label: 'bu_id', lx: 24, ly: 12 },
      { t: 'arrow', x1: 472, y1: 137, x2: 548, y2: 137, label: 'currency\n+ month', lx: 0, ly: -34 },
      { t: 'note', x: 480, y: 196, w: 265, h: 66, text: 'LEFT JOIN: SGD in Feb 2026\nhas no rate, so 34 lines\nshow a NULL rate', fill: 'pink', size: 14 },
    ] } },
    { sql: {
      title: 'Fact table, dimensions and FX rates',
      starter: `-- 1) Readable journal lines: ids turned into names
SELECT g.gl_id, e.entity_code, b.bu_code, a.account_code, a.account_name, g.debit, g.credit
FROM fact_gl g
JOIN dim_entity  e ON e.entity_id  = g.entity_id
JOIN dim_bu      b ON b.bu_id      = g.bu_id
JOIN dim_account a ON a.account_id = g.account_id
ORDER BY g.gl_id
LIMIT 6;

-- 2) Add the INR rate with a LEFT JOIN and count lines that found no rate
SELECT e.entity_code,
       COUNT(*)                         AS lines,
       COUNT(r.rate_to_inr)             AS lines_with_rate,
       COUNT(*) - COUNT(r.rate_to_inr)  AS lines_missing_rate
FROM fact_gl g
JOIN dim_entity e ON e.entity_id = g.entity_id
LEFT JOIN fx_rates r
       ON r.currency   = g.currency
      AND r.rate_month = DATE_TRUNC('month', g.posting_date)::date
GROUP BY e.entity_code
ORDER BY e.entity_code;`,
      note: 'The second query shows 411 / 411 / 0 for IN01, 408 / 374 / 34 for SG01 and 408 / 408 / 0 for US01. All 34 missing rates are Singapore lines posted in February 2026. Change LEFT JOIN to JOIN and watch SG01 lose 34 lines without any error.',
    } },
    { tip: 'Always write the join condition on the **keys**, and add a comment for any join that is not a simple id-to-id match. A forgotten ON clause (or `ON 1 = 1`) pairs every row with every row, so 220 orders and 12 customers would produce 2,640 rows. If a result suddenly has far more rows than you expected, look at the ON clause first.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-joins-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Big orders from Mumbai. Return `order_id, customer_name, amount` for orders of customers whose `city` is **Mumbai** and whose `amount` is **at least 2,00,000**. Sort by `order_id`. (6 rows.)',
      hint: 'JOIN customers c ON c.customer_id = o.customer_id, then WHERE c.city = \'Mumbai\' AND o.amount >= 200000.',
      solution: `SELECT o.order_id, c.customer_name, o.amount
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE c.city = 'Mumbai' AND o.amount >= 200000
ORDER BY o.order_id`,
    } },
    { challenge: {
      id: 'sql-joins-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Return **all 12 customers** with their number of **Delivered** orders: `customer_id, customer_name, delivered_orders` (0 for customers with none). Sort by `customer_id`. Mind where the status filter goes, and what you count.',
      hint: "customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'Delivered', then GROUP BY customer, with COUNT(o.order_id).",
      solution: `SELECT c.customer_id, c.customer_name, COUNT(o.order_id) AS delivered_orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'Delivered'
GROUP BY c.customer_id, c.customer_name
ORDER BY c.customer_id`,
    } },
    { challenge: {
      id: 'sql-joins-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Missing-FX exception report. Return `gl_id, entity_id, posting_date` for every `fact_gl` line whose currency has **no rate** in `fx_rates` for the month of its posting date. Sort by `gl_id`. (34 rows.)',
      hint: "LEFT JOIN fx_rates r ON r.currency = g.currency AND r.rate_month = DATE_TRUNC('month', g.posting_date)::date, then WHERE r.rate_to_inr IS NULL.",
      solution: `SELECT g.gl_id, g.entity_id, g.posting_date
FROM fact_gl g
LEFT JOIN fx_rates r
       ON r.currency = g.currency
      AND r.rate_month = DATE_TRUNC('month', g.posting_date)::date
WHERE r.rate_to_inr IS NULL
ORDER BY g.gl_id`,
    } },
    { real: 'The missing-FX report is a real month-end exception: a conversion job that quietly skips lines is worse than one that fails. In Project A you will build a check like this one into the load: join to the rates with a LEFT JOIN, collect the lines with a NULL rate in an exceptions table, and stop the consolidation until someone supplies the rate. The same pattern finds invoices with no matching vendor, journals with an unknown cost centre, and employees with no bank record.' },
    { interview: '"What is the difference between INNER JOIN and LEFT JOIN, and what is the difference between putting a condition in ON and in WHERE?" Model answer: "INNER JOIN keeps only rows that match on both sides. LEFT JOIN keeps every row from the left table and fills the right-hand columns with NULL when there is no match. In a LEFT JOIN, a filter on the right table in WHERE removes the NULL rows and turns the query into an inner join, so I put right-table conditions in ON. For counting, I use COUNT of a right-table column, not COUNT(*)."' },
    `## Recap
- Tables store each fact once and point to each other with keys: a **primary key** in one table, a **foreign key** in the other. A join pairs rows where the keys are equal (\`ON c.customer_id = o.customer_id\`).
- \`INNER\` keeps matched pairs only (219 of 220 orders; order 77 is an orphan). \`LEFT\` keeps all of the left table (221), \`RIGHT\` all of the right (220), \`FULL\` everything (222). Prefer \`LEFT\` and choose a main table.
- Inner joins drop rows silently, and one-to-many joins repeat rows. Compare row counts before and after.
- In a LEFT JOIN, put filters on the **right** table in \`ON\`, not \`WHERE\`. Count with \`COUNT(right.column)\`, not \`COUNT(*)\`.
- A fact table joins to several dimensions, one \`JOIN … ON\` each. Some joins need two keys (\`currency\` and month). Use a \`LEFT JOIN\` to FX rates so missing rates show up as NULL instead of vanishing.`,
  ],
  quiz: [
    { q: '`orders` has 220 rows and order 77 belongs to a customer id that does not exist. How many rows does `orders INNER JOIN customers ON customers.customer_id = orders.customer_id` return?', o: ['220', '221', '219', '222'], a: 2, why: 'Order 77 has no matching customer, so the inner join drops it: 219 rows. LEFT from customers gives 221, RIGHT gives 220, FULL gives 222.' },
    { q: 'In `customers LEFT JOIN orders ON …`, why do customers 11 and 12 appear in the result?', o: ['A LEFT JOIN keeps every left-table row; the order columns are NULL when no order matches', 'LEFT JOIN creates fake orders for them', 'They match order 77', 'They are customers with status NULL'], a: 0, why: 'LEFT JOIN never drops a row of the left table. When no partner is found, the right-hand columns are filled with NULLs.' },
    { q: 'You want every customer, with a count of their Delivered orders (0 allowed). Where does `o.status = \'Delivered\'` go?', o: ['In WHERE', 'In HAVING', 'After ORDER BY', 'In the ON clause of the LEFT JOIN'], a: 3, why: 'In WHERE it removes the NULL rows and the LEFT JOIN behaves like an INNER JOIN. In ON it only decides which orders pair up.' },
    { q: 'After a LEFT JOIN, a customer has no orders. What do `COUNT(*)` and `COUNT(o.order_id)` return for that customer?', o: ['0 and 0', '1 and 0', '1 and 1', '0 and 1'], a: 1, why: 'The customer still produces one row, full of NULLs. COUNT(*) counts that row (1). COUNT(o.order_id) skips the NULL (0).' },
    { q: 'What is `A RIGHT JOIN B` equivalent to?', o: ['B LEFT JOIN A', 'A LEFT JOIN B', 'A FULL JOIN B', 'A INNER JOIN B'], a: 0, why: 'A RIGHT JOIN B keeps every row of B, which is B LEFT JOIN A with the tables written the other way round. Most people always use LEFT.' },
    { q: 'Why do we use LEFT JOIN, not INNER JOIN, when attaching fx_rates to fact_gl?', o: ['LEFT JOIN is always faster', 'INNER JOIN cannot join on two columns', 'It lets us use GROUP BY', 'Lines with no rate stay in the result with a NULL rate instead of vanishing'], a: 3, why: 'The SGD rate for February 2026 is missing. An INNER JOIN would silently drop those 34 lines. A LEFT JOIN keeps them so the exception can be reported.' },
  ],
  task: {
    title: 'Join the Kollana tables on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `09_joins.sql` in `C:\\sql-practice`.',
      'Query 1: the row counts of INNER, LEFT, RIGHT and FULL joins between orders and customers in one result (expect 219, 221, 220, 222). Comment on which rows explain each difference.',
      'Query 2: all 12 customers with their delivered-order count, with the status test in ON. Then move the test to WHERE and note in a comment how many customers remain (expect 10).',
      'Query 3: the missing-FX exception list from `fact_gl` (expect 34 rows). Save the result as a CSV and note which entity and month it belongs to.',
    ],
    deliverable: '`09_joins.sql` with three commented queries and the CSV of the 34 exception lines.',
  },
};
