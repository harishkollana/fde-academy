export default {
  id: 'sql-aggregates',
  title: 'Aggregates and GROUP BY: from rows to numbers',
  goal: 'You can summarise rows with COUNT, SUM, AVG, MIN and MAX, group them by one or more columns, filter groups with HAVING, and find journals whose debits and credits do not balance.',
  roadmap: [
    'COUNT, SUM, AVG, MIN, MAX; COUNT(DISTINCT)',
    'GROUP BY with one or more columns',
    'HAVING vs WHERE',
    'Unbalanced journals',
  ],
  blocks: [
    `## The problem
The CFO asks two questions in the same email:

1. *"What are our total sales, and how much does each channel bring in?"*
2. *"Month-end check: which journals do not balance?"*

Until now every query you wrote returned **one row for each row** of a table. These two questions need the opposite. They need many rows **squeezed into a few numbers**. In Excel this is a pivot table or a \`SUMIF\`. In SQL it is an **aggregate function**, and when you want one number per channel, per customer or per journal, you add \`GROUP BY\`.

The second question is not an exotic report. "Do the debits equal the credits?" is the first control that every finance team runs, and the same query will protect your pipelines in the projects later in this course.`,
    `## Aggregate functions: many rows in, one value out
An **aggregate function** reads a set of rows and returns **one value**.

| Function | Returns | Notes |
|---|---|---|
| \`COUNT(*)\` | number of rows | counts every row, whatever is in it |
| \`COUNT(col)\` | number of rows where \`col\` is not NULL | skips missing values |
| \`COUNT(DISTINCT col)\` | number of different non-NULL values | "how many customers", not "how many orders" |
| \`SUM(col)\` | total | skips NULLs |
| \`AVG(col)\` | average | skips NULLs; wrap in \`ROUND(…, 2)\` for tidy output |
| \`MIN(col)\`, \`MAX(col)\` | smallest, largest | work for numbers, dates and text |

Without \`GROUP BY\`, the **whole table is one group**, so you get exactly one row back:

\`\`\`sql
SELECT COUNT(*)                    AS orders,          -- 220
       COUNT(DISTINCT customer_id) AS customers,       -- 11
       SUM(amount)                 AS total_amount,    -- 2,09,80,275
       ROUND(AVG(amount), 2)       AS avg_amount,      -- 95,364.89
       MIN(amount)                 AS smallest,
       MAX(amount)                 AS largest
FROM orders;
\`\`\`
Notice 11 customers, although the customers table has 12 rows. Customers 11 and 12 never ordered, and order 77 belongs to customer 99, who does not exist in the customers table. The data has a story, and aggregates are how you discover it.

Two edge cases appear in interviews. **On an empty set, \`COUNT\` returns 0 but \`SUM\`, \`AVG\`, \`MIN\` and \`MAX\` return NULL**, not 0. And the nested form \`SUM(AVG(x))\` is not allowed; the aggregate of an aggregate needs a subquery.`,
    `## GROUP BY: one row per group
\`GROUP BY\` splits the rows into **buckets**, one bucket for each different value of the grouping column. The aggregates are then calculated **inside every bucket**. The result has one row per bucket.`,
    { sketch: { w: 760, h: 335, caption: 'GROUP BY channel: every row falls into exactly one bucket, and SUM is calculated per bucket.', items: [
      { t: 'table', x: 20, y: 56, title: 'orders (6 sample rows)', cols: ['channel', 'amount'], colW: [110, 100], rows: [['Online', '45,000'], ['Partner', '87,000'], ['Online', '30,000'], ['Direct', '54,000'], ['Partner', '21,000'], ['Online', '12,000']] },
      { t: 'arrow', x1: 235, y1: 150, x2: 322, y2: 150, label: 'GROUP BY\nchannel', lx: 0, ly: -30 },
      { t: 'box', x: 330, y: 46, w: 175, h: 62, label: 'Online', sub: '45 + 30 + 12', fill: 'blue', size: 18 },
      { t: 'box', x: 330, y: 126, w: 175, h: 62, label: 'Partner', sub: '87 + 21', fill: 'green', size: 18 },
      { t: 'box', x: 330, y: 206, w: 175, h: 62, label: 'Direct', sub: '54', fill: 'yellow', size: 18 },
      { t: 'arrow', x1: 507, y1: 78, x2: 548, y2: 102 },
      { t: 'arrow', x1: 507, y1: 158, x2: 548, y2: 130 },
      { t: 'arrow', x1: 507, y1: 236, x2: 548, y2: 158 },
      { t: 'table', x: 550, y: 56, title: 'result: SUM(amount)', cols: ['channel', 'total'], colW: [90, 100], rows: [['Online', '87,000'], ['Partner', '1,08,000'], ['Direct', '54,000']], fill: 'green' },
      { t: 'note', x: 20, y: 284, w: 720, h: 42, text: '6 rows in, 3 rows out. Rows are not lost: they are folded into their bucket.', fill: 'yellow', size: 15 },
    ] } },
    `\`\`\`sql
SELECT channel,
       COUNT(*)      AS orders,
       SUM(amount)   AS total_amount
FROM orders
GROUP BY channel
ORDER BY channel;
\`\`\`
The one rule you must learn: **every column in \`SELECT\` must be either in \`GROUP BY\` or inside an aggregate function.** If you write \`SELECT channel, SUM(amount) FROM orders\` with no GROUP BY, Postgres stops with *column "orders.channel" must appear in the GROUP BY clause or be used in an aggregate function*. It is asking a fair question: you want one row, but which of the three channels should it show?

More about grouping:
- **Several columns** make a bucket for every different *combination*. \`GROUP BY entity_id, source_system\` gives 3 entities × 3 sources = 9 rows.
- **Order is not guaranteed.** \`GROUP BY\` does not sort. Add \`ORDER BY\`.
- You can group by an **expression**, such as a \`CASE\` bucket from the last lesson. PostgreSQL also lets you use the output alias (\`SELECT channel AS ch … GROUP BY ch\`) or the column number (\`GROUP BY 1\`). Other databases are stricter, so spelling out the column or expression is the portable habit.
- **NULLs form their own group**, as you saw for the empty order status.`,
    { sql: {
      title: 'Totals by channel, and by two columns',
      starter: `-- One group: the whole table
SELECT COUNT(*) AS orders,
       COUNT(DISTINCT customer_id) AS customers,
       SUM(amount) AS total_amount,
       ROUND(AVG(amount), 2) AS avg_amount,
       MIN(amount) AS smallest,
       MAX(amount) AS largest
FROM orders;

-- One group per channel
SELECT channel,
       COUNT(*)              AS orders,
       SUM(amount)           AS total_amount,
       ROUND(AVG(amount), 2) AS avg_amount
FROM orders
GROUP BY channel
ORDER BY channel;

-- One group per combination of two columns
SELECT entity_id, source_system,
       COUNT(*)              AS lines,
       ROUND(SUM(debit), 2)  AS total_debit
FROM fact_gl
GROUP BY entity_id, source_system
ORDER BY entity_id, source_system;`,
      note: 'The channel totals add up to the table total: 70,41,185 + 68,22,430 + 71,16,660 = 2,09,80,275. The last query returns 9 rows (3 entities by 3 source systems).',
    } },
    { warn: 'The error "must appear in the GROUP BY clause or be used in an aggregate function" is not Postgres being fussy. It protects you. A column that is not grouped and not aggregated has many different values inside a bucket, and SQL refuses to pick one for you. (MySQL used to pick one silently. That produced wrong reports for years.)' },
    `## WHERE vs HAVING: filter rows, or filter groups
Both filter, but at different moments:

- **\`WHERE\`** works **before** grouping. It judges single rows and decides which rows enter the buckets.
- **\`HAVING\`** works **after** grouping. It judges whole buckets, using the aggregate values.

So \`WHERE COUNT(*) > 10\` cannot work, because at that moment nothing has been counted yet. Postgres says *aggregate functions are not allowed in WHERE*. Use \`HAVING COUNT(*) > 10\`. In \`HAVING\` you repeat the aggregate; Postgres does not allow the output alias there.`,
    { sketch: { w: 760, h: 250, caption: 'WHERE removes rows before the buckets are made. HAVING removes whole buckets after the numbers are known.', items: [
      { t: 'box', x: 15, y: 58, w: 135, h: 70, label: '220 rows', sub: 'orders table', fill: 'grey', size: 18 },
      { t: 'arrow', x1: 152, y1: 93, x2: 212, y2: 93, label: 'WHERE', lx: 0, ly: -12 },
      { t: 'box', x: 215, y: 58, w: 135, h: 70, label: '118 rows', sub: 'only Delivered', fill: 'blue', size: 18 },
      { t: 'arrow', x1: 352, y1: 93, x2: 412, y2: 93, label: 'GROUP BY', lx: 0, ly: -12 },
      { t: 'box', x: 415, y: 58, w: 135, h: 70, label: '11 groups', sub: 'one per customer', fill: 'yellow', size: 18 },
      { t: 'arrow', x1: 552, y1: 93, x2: 612, y2: 93, label: 'HAVING', lx: 0, ly: -12 },
      { t: 'box', x: 615, y: 58, w: 135, h: 70, label: '6 groups', sub: 'COUNT(*) >= 12', fill: 'green', size: 18 },
      { t: 'note', x: 40, y: 168, w: 290, h: 62, text: 'WHERE judges single rows,\nbefore any grouping.\nCheaper: fewer rows to group.', fill: 'blue', size: 15 },
      { t: 'note', x: 430, y: 168, w: 300, h: 62, text: 'HAVING judges whole groups,\nafter COUNT and SUM are known.', fill: 'green', size: 15 },
      { t: 'arrow', x1: 182, y1: 166, x2: 182, y2: 112, dashed: true },
      { t: 'arrow', x1: 582, y1: 166, x2: 682, y2: 132, dashed: true },
    ] } },
    `A simple rule: **put every condition that can go in \`WHERE\` into \`WHERE\`**. It removes rows early, so Postgres has less work to do. Keep \`HAVING\` only for conditions on aggregates.

Here is a query that uses both. Among the *delivered* orders (WHERE), which customers have *at least 12* of them (HAVING)?`,
    { sql: {
      title: 'WHERE and HAVING together',
      starter: `SELECT customer_id,
       COUNT(*)    AS delivered_orders,
       SUM(amount) AS delivered_total
FROM orders
WHERE status = 'Delivered'          -- row filter, before grouping
GROUP BY customer_id
HAVING COUNT(*) >= 12               -- group filter, after counting
ORDER BY delivered_orders DESC, customer_id;

-- Remove the dashes to read the error: counting has not happened yet in WHERE.
-- SELECT customer_id FROM orders WHERE COUNT(*) > 1 GROUP BY customer_id;`,
      note: 'Six customers qualify: 1, 3, 6, 7, 8 and 10. Customer 99 (the orphan order) has only one delivered order, so HAVING removes that group.',
    } },
    `## Unbalanced journals: the finance control
In double-entry bookkeeping, every journal has debit lines and credit lines, and **the total debit must equal the total credit**. A journal that does not balance is a posting error. In \`fact_gl\` a journal is a \`journal_id\` with its lines, so the check is a \`GROUP BY journal_id\` with a \`HAVING\` that compares the two sums:

\`\`\`sql
SELECT journal_id,
       COUNT(*)                    AS lines,
       SUM(debit)                  AS total_debit,
       SUM(credit)                 AS total_credit,
       SUM(debit) - SUM(credit)    AS difference
FROM fact_gl
GROUP BY journal_id
HAVING SUM(debit) <> SUM(credit)
ORDER BY journal_id;
\`\`\`
There are 612 journals and **4 of them are out of balance**. The \`lines\` column explains three of them: a normal journal has **2 lines** (the P&L line and its bank or payables partner), but three journals have **3 lines**. Someone loaded one line twice, which is the duplicate-line problem you fixed with \`ROW_NUMBER\` in the window lesson. The fourth, \`JV202504-0051\`, has two lines but its debit is ₹500 too high. A typo.

Look at how much the \`COUNT(*)\` helps. A number that does not balance tells you *that* something is wrong. The line count tells you *what kind* of wrong.`,
    { sql: {
      title: 'Find the unbalanced journals',
      starter: `SELECT journal_id,
       COUNT(*)                 AS lines,
       SUM(debit)               AS total_debit,
       SUM(credit)              AS total_credit,
       SUM(debit) - SUM(credit) AS difference
FROM fact_gl
GROUP BY journal_id
HAVING SUM(debit) <> SUM(credit)
ORDER BY journal_id;

-- Same idea per entity: does each entity balance as a whole?
SELECT entity_id, ROUND(SUM(debit) - SUM(credit), 2) AS difference
FROM fact_gl
GROUP BY entity_id
ORDER BY entity_id;`,
      note: 'Four journals: 0009, 0051, 0117 and 0256. Entity 2 is perfectly balanced; entity 3 is out by exactly 500.00 (the typo); entity 1 is out by the three duplicated lines.',
    } },
    { tip: '`STRING_AGG` is an aggregate that returns text: `SELECT department, STRING_AGG(emp_name, \', \' ORDER BY emp_name) FROM employees GROUP BY department` gives one cell per department with all the names in it. It is handy for a quick look at what is inside a group. (Other databases call it `LISTAGG` or `GROUP_CONCAT`.)' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-aggregates-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Sales summary by channel. Return `channel, order_count, total_amount, avg_amount`, where `avg_amount` is rounded to 2 decimals. Sort by `channel`. (3 rows.)',
      hint: 'GROUP BY channel, with COUNT(*), SUM(amount) and ROUND(AVG(amount), 2).',
      solution: `SELECT channel,
       COUNT(*) AS order_count,
       SUM(amount) AS total_amount,
       ROUND(AVG(amount), 2) AS avg_amount
FROM orders
GROUP BY channel
ORDER BY channel`,
    } },
    { challenge: {
      id: 'sql-aggregates-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Find the loyal customers. Among **Delivered** orders only, return the customers who have **at least 12** of them: `customer_id, delivered_orders, delivered_total`. Sort by `customer_id`. (6 rows.)',
      hint: "WHERE status = 'Delivered' first, then GROUP BY customer_id, then HAVING COUNT(*) >= 12.",
      solution: `SELECT customer_id,
       COUNT(*) AS delivered_orders,
       SUM(amount) AS delivered_total
FROM orders
WHERE status = 'Delivered'
GROUP BY customer_id
HAVING COUNT(*) >= 12
ORDER BY customer_id`,
    } },
    { challenge: {
      id: 'sql-aggregates-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'Month-end control. Return the journals whose total debit is not equal to their total credit: `journal_id, total_debit, total_credit`. Sort by `journal_id`. (4 rows.)',
      hint: 'GROUP BY journal_id, then HAVING SUM(debit) <> SUM(credit).',
      solution: `SELECT journal_id,
       SUM(debit) AS total_debit,
       SUM(credit) AS total_credit
FROM fact_gl
GROUP BY journal_id
HAVING SUM(debit) <> SUM(credit)
ORDER BY journal_id`,
    } },
    { real: 'The unbalanced-journal query is the first test of nearly every finance data pipeline, and you will build it into Project A: load the extract, run the balance check, and refuse to publish if any journal fails. Add the `COUNT(*)` and the difference to the error message, so that the person who fixes the problem can see at a glance whether it is a duplicate line or a wrong amount. For the monthly MIS pack, the same GROUP BY pattern (entity, account, month) is how you build every P&L row.' },
    { interview: '"What is the difference between WHERE and HAVING?" Model answer: "WHERE filters individual rows before they are grouped, so it cannot use aggregates. HAVING filters groups after aggregation, so it can. I put every condition I can in WHERE because it reduces the rows before grouping, and I use HAVING only for conditions on COUNT, SUM and so on." Likely follow-ups: "What do COUNT(*), COUNT(col) and COUNT(DISTINCT col) return?" (rows, non-NULL values, distinct non-NULL values) and "What does SUM return on an empty table?" (NULL, not 0).' },
    `## Recap
- An aggregate (\`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`) turns many rows into one value and skips NULLs. \`COUNT(*)\` counts rows, \`COUNT(DISTINCT col)\` counts different values.
- On an empty set \`COUNT\` gives 0, but \`SUM\`, \`AVG\`, \`MIN\` and \`MAX\` give NULL.
- \`GROUP BY\` makes one bucket per distinct value (or combination of values). Every \`SELECT\` column must be grouped or aggregated.
- \`WHERE\` filters rows **before** grouping; \`HAVING\` filters groups **after** aggregation. Use WHERE whenever you can.
- Balance check: \`GROUP BY journal_id HAVING SUM(debit) <> SUM(credit)\` finds 4 bad journals in the Kollana data; the line count tells you whether it is a duplicate or a wrong amount.`,
  ],
  quiz: [
    { q: 'What does `SELECT channel, SUM(amount) FROM orders` return in PostgreSQL?', o: ['One row per channel', 'The total with the first channel', 'An error: channel must be in GROUP BY or inside an aggregate', 'NULL'], a: 2, why: 'A column that is neither grouped nor aggregated has many values in the single group, so Postgres refuses to choose one.' },
    { q: 'You need the customers who have more than 10 delivered orders. Where does `COUNT(*) > 10` go?', o: ['In HAVING', 'In WHERE', 'In FROM', 'In ORDER BY only'], a: 0, why: 'The count exists only after grouping, so the condition belongs in HAVING. WHERE runs before any group is formed.' },
    { q: '`COUNT(DISTINCT customer_id)` on orders returns 11, but `COUNT(*)` returns 220. Why?', o: ['11 orders are distinct', 'It counts how many different customers placed orders', 'DISTINCT removes NULLs from the table', 'Postgres sampled the table'], a: 1, why: 'COUNT(*) counts rows (orders). COUNT(DISTINCT customer_id) counts the different customer ids that appear, here 10 real customers plus the orphan id 99.' },
    { q: 'What does `SELECT SUM(amount) FROM orders WHERE 1 = 0` return?', o: ['0', 'No rows', 'An error', 'One row containing NULL'], a: 3, why: 'An aggregate without GROUP BY always returns one row. On an empty set SUM is NULL (COUNT would be 0).' },
    { q: 'You run `GROUP BY entity_id, source_system` with 3 entities and 3 source systems. How many rows can come back at most?', o: ['3', '6', '9', '12'], a: 2, why: 'One bucket per combination of the two columns: 3 × 3 = 9. (The Kollana data has all 9.)' },
    { q: 'A journal has 3 lines instead of 2 and does not balance. What is the most likely cause?', o: ['A line was loaded twice (duplicate)', 'A rounding difference', 'The journal is in a different currency', 'GROUP BY dropped a line'], a: 0, why: 'A normal journal has a P&L line and a balancing line. A third line points to a duplicated load. A balanced-looking line count with a wrong sum points to a wrong amount instead.' },
  ],
  task: {
    title: 'Run the month-end controls on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `06_aggregates.sql` in `C:\\sql-practice`.',
      'Query 1: the whole-table summary of orders in one row (expect 220 orders, 11 customers). Query 2: totals by channel; check they add up to the total in query 1.',
      'Query 3: the unbalanced-journal check with `COUNT(*)` and the difference (expect 4 rows). Add a comment for each journal saying whether you think it is a duplicate (3 lines) or a wrong amount (2 lines).',
      'Query 4: loyal customers, with `WHERE status = \'Delivered\'` and `HAVING COUNT(*) >= 12` (expect 6 rows).',
    ],
    deliverable: '`06_aggregates.sql` with four commented queries; the numbers 220, 11, 4 and 6 appear in your results.',
  },
};
