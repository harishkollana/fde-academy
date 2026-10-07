export default {
  id: 'sql-select',
  title: 'SELECT, WHERE, ORDER BY, LIMIT: asking your first questions',
  goal: 'You can pick columns, filter rows, sort, take the top N, page through results, remove duplicates, and explain the order in which Postgres runs a query.',
  roadmap: [
    'SELECT, WHERE, ORDER BY, LIMIT/OFFSET, DISTINCT',
    'Column and table aliases',
    'Logical order of execution (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT)',
  ],
  blocks: [
    `## The problem
Your sales head messages you: *"Send me the 10 biggest orders this year. Just order number, customer and amount."*

In Excel you would open the file, apply a filter, sort the amount column descending, and copy the first ten rows. In SQL this is **one query**, and you can run it again next month without clicking anything:

\`\`\`sql
SELECT order_id, customer_id, amount   -- 3. which columns to show
FROM orders                            -- 1. which table
ORDER BY amount DESC                   -- 2. biggest first
LIMIT 10;                              -- 4. keep only 10 rows
\`\`\`

This lesson teaches each of those clauses, plus \`WHERE\`, \`OFFSET\`, \`DISTINCT\` and aliases. These six things are maybe 60% of all SQL you will ever write.`,
    `## SELECT and FROM: choose columns from a table
\`FROM\` names the table. \`SELECT\` lists the columns you want, separated by commas.

- \`SELECT *\` means "all columns". It is great for a quick look. In production code, always list the columns: if someone adds a column to the table later, your Python script or Power BI model will not suddenly break.
- You can compute new columns with **expressions**: \`debit - credit\`, \`qty * 2\`, \`amount * 0.18\`.
- Text values go in **single quotes**: \`'Online'\`. Double quotes are only for names of columns/tables (you will rarely need them).
- SQL keywords are not case-sensitive (\`select\` = \`SELECT\`). The habit is to write keywords in capitals so the query is easy to scan.
- \`--\` starts a comment until the end of the line. \`/* … */\` is a multi-line comment.
- A statement ends with \`;\`. Line breaks and spaces do not matter, so use them to make the query readable.

## Aliases: give things short or friendly names
A **column alias** renames an output column with \`AS\`:
\`\`\`sql
SELECT journal_id,
       debit - credit AS net_amount,      -- the new column is called net_amount
       posting_date   AS "Posting Date"   -- double quotes allow spaces (avoid in pipelines)
FROM fact_gl;
\`\`\`
A **table alias** gives a table a short nickname, used as a prefix:
\`\`\`sql
SELECT g.journal_id, g.debit
FROM fact_gl AS g;      -- AS is optional: FROM fact_gl g
\`\`\`
For one table it only saves typing. Once you join two tables that both have a column called \`entity_id\`, the prefix (\`g.entity_id\` vs \`e.entity_id\`) becomes **required**. Good habit: use short aliases from day one (\`g\` for fact_gl, \`o\` for orders, \`c\` for customers).`,
    { sql: {
      title: 'Columns, expressions and aliases',
      starter: `SELECT g.gl_id,
       g.journal_id,
       g.posting_date,
       g.debit,
       g.credit,
       g.debit - g.credit AS net_amount     -- computed column with an alias
FROM fact_gl AS g
LIMIT 8;`,
      note: 'Revenue lines are credits, so their net_amount is negative; bank lines are debits, so positive. Try adding a column `g.debit * 2 AS double_debit`.',
    } },
    `## WHERE: keep only the rows you need
\`WHERE\` is a filter. Postgres checks the condition for every row and keeps only rows where it is **true**.

\`\`\`sql
SELECT gl_id, journal_id, posting_date, debit
FROM fact_gl
WHERE entity_id = 1                    -- numbers: no quotes
  AND source_system = 'Manual'         -- text: single quotes, case-sensitive
  AND posting_date >= '2025-04-01'     -- dates: 'YYYY-MM-DD' in quotes
  AND posting_date <  '2025-07-01';    -- Q1 of FY 2025-26 (Apr–Jun)
\`\`\`
- \`=\` equal, \`<>\` not equal, \`<\` \`>\` \`<=\` \`>=\` work for numbers, dates and text.
- \`AND\` means both conditions must be true. The next lesson covers \`OR\`, \`IN\`, \`BETWEEN\` and \`LIKE\` in depth.
- Text comparison is **case-sensitive**: \`'manual'\` does not match \`'Manual'\`.
- Write dates as \`'2025-04-01'\` (ISO format). Never \`'01/04/2025'\`: is that 1 April or 4 January? The ISO format is never ambiguous.

## ORDER BY: sort the result
\`ORDER BY amount DESC\` sorts biggest first; \`ASC\` (the default) sorts smallest first. You can sort by several columns: the second column breaks ties in the first.

\`\`\`sql
ORDER BY entity_id ASC, posting_date DESC, gl_id
\`\`\`
- You may sort by a column alias: \`ORDER BY net_amount\`.
- \`ORDER BY 3\` sorts by the third column. It works, but breaks silently when someone edits the column list. Prefer names.
- **Without ORDER BY, the row order is not guaranteed.** The same query can return rows in a different order tomorrow. If order matters, say so.

## LIMIT and OFFSET: top N and pages
\`LIMIT 10\` keeps the first 10 rows (after sorting). \`OFFSET 20\` skips the first 20 rows. Together they give you **pages**: page \`n\` of size \`s\` is \`LIMIT s OFFSET (n - 1) * s\`. This is exactly how an API returns "page 3 of exceptions" (you will build one in the FastAPI phase).

\`\`\`sql
-- page 2 of the customer list, 5 per page
SELECT customer_id, customer_name
FROM customers
ORDER BY customer_name
LIMIT 5 OFFSET 5;
\`\`\``,
    { sql: {
      title: 'Top 10 orders, and a tie problem',
      starter: `-- The 10 biggest orders
SELECT order_id, customer_id, amount
FROM orders
ORDER BY amount DESC
LIMIT 10;

-- Eight orders share the top amount of 368000. Which 5 does LIMIT 5 return?
-- Without a tie-breaker the answer is "any 5". Add one so it is always the same:
SELECT order_id, customer_id, amount
FROM orders
ORDER BY amount DESC, order_id
LIMIT 5;`,
      note: 'Eight orders are worth exactly ₹3,68,000 (4 laptops). A "top 5" without a tie-breaker can change between runs, which makes reports and tests flaky.',
    } },
    { warn: 'Always pair LIMIT/OFFSET with an ORDER BY that is **unique** (add the primary key as the last sort column). Otherwise page 2 can repeat a row from page 1 or skip a row, and your top-N report can change between runs.' },
    `## DISTINCT: remove duplicate rows
\`SELECT DISTINCT\` removes duplicate **rows** from the result.

\`\`\`sql
SELECT DISTINCT city FROM customers;                 -- 4 cities
SELECT DISTINCT channel, status FROM orders;         -- unique combinations (12)
\`\`\`
DISTINCT applies to the **whole row**, not just the first column. \`SELECT DISTINCT channel, status\` gives every unique *pair*.

Postgres also has **DISTINCT ON**, a handy extra: it keeps the **first row per group**, where "first" is decided by ORDER BY. For example, the single biggest order of each customer:
\`\`\`sql
SELECT DISTINCT ON (customer_id) customer_id, order_id, amount
FROM orders
ORDER BY customer_id, amount DESC, order_id;   -- must start with the DISTINCT ON column
\`\`\`
(Other databases do not have DISTINCT ON; there you use \`ROW_NUMBER()\`, which you will learn in the window-functions lesson.)`,
    { warn: 'Do not use DISTINCT to "fix" duplicate rows you do not understand. If a query returns duplicates, usually a join is wrong or the data really has duplicates (fact_gl has 3 duplicated lines!). DISTINCT hides the symptom; find the cause.' },
    `## The order Postgres actually runs your query
You **write** a query in this order: \`SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT\`. But Postgres **runs** it in a different, logical order. Knowing this order explains most beginner errors.`,
    { sketch: { w: 760, h: 330, caption: 'Logical order of execution: the data flows FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT', items: [
      { t: 'text', x: 20, y: 28, text: 'Postgres runs a query in THIS order:', anchor: 'start', bold: true, size: 19 },
      { t: 'box', x: 20, y: 55, w: 150, h: 64, label: '1  FROM', sub: 'pick the table(s)', fill: 'blue' },
      { t: 'box', x: 210, y: 55, w: 150, h: 64, label: '2  WHERE', sub: 'filter rows', fill: 'blue' },
      { t: 'box', x: 400, y: 55, w: 150, h: 64, label: '3  GROUP BY', sub: 'make groups', fill: 'blue' },
      { t: 'box', x: 590, y: 55, w: 150, h: 64, label: '4  HAVING', sub: 'filter groups', fill: 'blue' },
      { t: 'arrow', x1: 172, y1: 87, x2: 208, y2: 87 },
      { t: 'arrow', x1: 362, y1: 87, x2: 398, y2: 87 },
      { t: 'arrow', x1: 552, y1: 87, x2: 588, y2: 87 },
      { t: 'arrow', x1: 660, y1: 122, x2: 100, y2: 172, dashed: true },
      { t: 'box', x: 20, y: 175, w: 150, h: 64, label: '5  SELECT', sub: 'columns, aliases', fill: 'yellow' },
      { t: 'box', x: 210, y: 175, w: 150, h: 64, label: '6  DISTINCT', sub: 'drop duplicates', fill: 'green' },
      { t: 'box', x: 400, y: 175, w: 150, h: 64, label: '7  ORDER BY', sub: 'sort', fill: 'green' },
      { t: 'box', x: 590, y: 175, w: 150, h: 64, label: '8  LIMIT', sub: 'keep N rows', fill: 'green' },
      { t: 'arrow', x1: 172, y1: 207, x2: 208, y2: 207 },
      { t: 'arrow', x1: 362, y1: 207, x2: 398, y2: 207 },
      { t: 'arrow', x1: 552, y1: 207, x2: 588, y2: 207 },
      { t: 'note', x: 20, y: 262, w: 340, h: 56, text: 'WHERE runs BEFORE SELECT,\nso WHERE cannot see your aliases' },
      { t: 'note', x: 400, y: 262, w: 340, h: 56, text: 'ORDER BY runs AFTER SELECT,\nso ORDER BY can use aliases', fill: 'green' },
    ] } },
    `Three consequences you will meet in real work:

1. **WHERE cannot use a column alias.** \`WHERE net_amount > 0\` fails with *column "net_amount" does not exist*, because when WHERE runs, SELECT has not created \`net_amount\` yet. Repeat the expression (\`WHERE debit - credit > 0\`) or use a subquery/CTE (later lessons).
2. **ORDER BY can use an alias**, because it runs after SELECT.
3. **LIMIT is the very last step.** Postgres filters, groups and sorts everything first, then cuts. So "top 10" is correct only if the sort is correct.

\`GROUP BY\` and \`HAVING\` (steps 3 and 4) come in the aggregation lessons. For now just remember where they sit.`,
    { sql: {
      title: 'See the alias error, then fix it',
      starter: `-- 1) This line would fail: WHERE runs before SELECT creates net_amount.
--    Remove the two dashes in front of it and run to see the error yourself.
-- SELECT journal_id, debit - credit AS net_amount FROM fact_gl WHERE net_amount > 100000;

-- 2) Fix: repeat the expression in WHERE. ORDER BY may use the alias.
SELECT journal_id, account_id, debit - credit AS net_amount
FROM fact_gl
WHERE debit - credit > 100000
ORDER BY net_amount DESC
LIMIT 5;`,
      note: 'Uncomment the first query to read the real Postgres error message. Learning to read errors calmly is half of SQL.',
    } },
    { challenge: {
      id: 'sql-select-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Return the **5 biggest orders**: columns `order_id, customer_id, amount`, sorted by amount (largest first). Several orders share the same amount, so break ties by `order_id` (smallest first). Row order matters.',
      hint: 'ORDER BY amount DESC, order_id … then LIMIT 5.',
      solution: `SELECT order_id, customer_id, amount
FROM orders
ORDER BY amount DESC, order_id
LIMIT 5`,
    } },
    { challenge: {
      id: 'sql-select-ch2',
      level: 'easy',
      ordered: true,
      prompt: 'The customer list is shown **5 per page**, sorted by `customer_name` A–Z. Return **page 2**: `customer_id, customer_name`. Row order matters.',
      hint: 'Page 2 skips the first 5 rows: LIMIT 5 OFFSET 5.',
      solution: `SELECT customer_id, customer_name
FROM customers
ORDER BY customer_name
LIMIT 5 OFFSET 5`,
    } },
    { challenge: {
      id: 'sql-select-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'Travel expense check for India: from `fact_gl`, return the lines of entity **1** for account **6300** (Travel) posted in **April 2025**. Columns: `gl_id, journal_id, posting_date, net_amount` where `net_amount = debit - credit`. Sort by `posting_date`, then `gl_id`.',
      hint: "WHERE entity_id = 1 AND account_id = 6300 AND posting_date >= '2025-04-01' AND posting_date < '2025-05-01'",
      solution: `SELECT gl_id, journal_id, posting_date, debit - credit AS net_amount
FROM fact_gl
WHERE entity_id = 1
  AND account_id = 6300
  AND posting_date >= '2025-04-01'
  AND posting_date < '2025-05-01'
ORDER BY posting_date, gl_id`,
    } },
    { real: 'Most "can you quickly pull…" requests from finance are exactly this lesson: a few columns, a WHERE on entity / account / date range, sorted, maybe top N. Save each one as a `.sql` file with a comment on top saying who asked and why. In a month you will have a personal library that answers half of the MIS questions in seconds.' },
    { interview: '"In what order does SQL execute a SELECT statement?" Model answer: "Logically FROM first, then WHERE filters rows, GROUP BY forms groups, HAVING filters groups, SELECT computes the output columns, DISTINCT removes duplicates, ORDER BY sorts, and LIMIT/OFFSET cut the result. That is why a WHERE clause cannot reference a SELECT alias but ORDER BY can."' },
    `## Recap
- \`SELECT\` picks columns (and computes expressions), \`FROM\` picks the table. List columns explicitly in production code.
- Column aliases (\`AS net_amount\`) rename outputs; table aliases (\`fact_gl g\`) shorten prefixes and become essential in joins.
- \`WHERE\` keeps rows where the condition is true; text in single quotes, dates as \`'YYYY-MM-DD'\`.
- \`ORDER BY\` with a unique tie-breaker, then \`LIMIT\` / \`OFFSET\` for top-N and paging.
- \`DISTINCT\` removes duplicate whole rows; \`DISTINCT ON\` keeps the first row per group (Postgres only).
- Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT.`,
  ],
  quiz: [
    { q: 'Why does `SELECT debit - credit AS net FROM fact_gl WHERE net > 0` fail?', o: ['`net` is a reserved word', 'WHERE runs before SELECT, so the alias does not exist yet', 'You cannot subtract columns', 'AS is not allowed with expressions'], a: 1, why: 'Logical order: FROM → WHERE → … → SELECT. The alias is created in SELECT, after WHERE has already run. Repeat the expression in WHERE instead.' },
    { q: 'Which query returns page 3 of a list with 20 rows per page?', o: ['LIMIT 20 OFFSET 40', 'LIMIT 20 OFFSET 60', 'LIMIT 60 OFFSET 20', 'LIMIT 3 OFFSET 20'], a: 0, why: 'Page n skips (n − 1) × size rows: (3 − 1) × 20 = 40.' },
    { q: '`SELECT DISTINCT channel, status FROM orders` returns…', o: ['unique channels only', 'unique statuses only', 'every unique (channel, status) pair', 'an error: DISTINCT takes one column'], a: 2, why: 'DISTINCT works on the whole output row, so you get unique combinations.' },
    { q: 'You run `SELECT * FROM orders LIMIT 5` twice and get different rows. Why is that allowed?', o: ['A bug in Postgres', 'LIMIT picks random rows on purpose', 'The data changed', 'Without ORDER BY, row order is not guaranteed'], a: 3, why: 'SQL tables have no built-in order. Only ORDER BY guarantees order, and only a unique ORDER BY guarantees the same top N each time.' },
    { q: 'Which filter correctly selects posting dates in April 2025?', o: ["posting_date = '2025-04'", "posting_date >= '2025-04-01' AND posting_date < '2025-05-01'", "posting_date LIKE '04/2025'", "posting_date > '2025-04-01' AND posting_date < '2025-04-30'"], a: 1, why: 'A half-open range (>= first day, < first day of next month) includes every day of April, also 1 and 30 April, and works for timestamps too. Option D misses 1 and 30 April.' },
    { q: 'Which clause can use a column alias defined in SELECT?', o: ['WHERE', 'FROM', 'ORDER BY', 'none of them'], a: 2, why: 'ORDER BY runs after SELECT, so it can see the alias.' },
  ],
  task: {
    title: 'Answer three manager questions on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create a new script `02_select_basics.sql` in `C:\\sql-practice`.',
      'Query 1: the 10 biggest orders with a tie-breaker. Query 2: every distinct `(department, city)` pair in `employees`, sorted (expect 14 rows).',
      'Query 3: all Manual journal lines for IN01 (entity 1) in Q1 FY 2025-26 (Apr–Jun 2025), with `debit - credit AS net_amount`, sorted by date (expect 10 rows).',
      'Above each query write a `--` comment with the business question in plain English.',
    ],
    deliverable: '`02_select_basics.sql` with three commented queries that run without errors.',
  },
};
