export default {
  id: 'sql-window-ranking',
  title: 'Window functions I: ROW_NUMBER, RANK, DENSE_RANK',
  goal: 'You can rank rows inside groups, pick the top N per group, and remove duplicate rows with ROW_NUMBER, without losing any detail rows.',
  roadmap: ['ROW_NUMBER, RANK, DENSE_RANK; dedup with ROW_NUMBER', 'PARTITION BY + ORDER BY'],
  blocks: [
    `## The problem
Two requests land on your desk on the same morning:

1. HR asks: "Give me the **top 2 earners in every department**."
2. The finance controller says: "Our GL extract has **duplicate lines**. Remove the extra copies, but keep one of each."

You already know \`GROUP BY\`. But \`GROUP BY\` **collapses** rows. If you group employees by department, you get one row per department. The names of the people are gone. You cannot pick "the top 2 people" from a row that no longer has people in it.

You need a tool that can look at a **group of rows** (a department, a journal) while still **keeping every row** in the output. That tool is a **window function**.`,
    { sketch: { w: 760, h: 380, caption: 'GROUP BY squashes rows into one per group. A window function keeps every row and adds a column.', items: [
      { t: 'table', x: 20, y: 70, title: 'employees (5 rows)', cols: ['dept', 'name', 'ctc_L'], colW: [80, 75, 60], rows: [['Finance', 'Aarav', '42'], ['Finance', 'Diya', '27'], ['HR', 'Sneha', '20'], ['HR', 'Pooja', '20'], ['HR', 'Vikram', '18']] },
      { t: 'arrow', x1: 245, y1: 100, x2: 445, y2: 80, label: 'GROUP BY dept' },
      { t: 'table', x: 460, y: 45, title: 'GROUP BY result', cols: ['dept', 'total_L'], colW: [90, 80], rows: [['Finance', '69'], ['HR', '58']] },
      { t: 'note', x: 640, y: 50, w: 110, h: 60, text: '5 rows\nbecome 2' },
      { t: 'arrow', x1: 245, y1: 200, x2: 345, y2: 250, label: 'SUM() OVER', lx: -10, ly: -16 },
      { t: 'table', x: 360, y: 190, title: 'window result', cols: ['dept', 'name', 'ctc_L', 'dept_total'], colW: [80, 70, 60, 100], rows: [['Finance', 'Aarav', '42', '69'], ['Finance', 'Diya', '27', '69'], ['HR', 'Sneha', '20', '58'], ['HR', 'Pooja', '20', '58'], ['HR', 'Vikram', '18', '58']] },
      { t: 'text', x: 130, y: 300, text: 'rows stay +\none extra column', size: 17, color: '#2f9e44' },
    ] } },
    { analogy: 'Think of school report cards. **GROUP BY** is the principal\'s summary: "Class 10-A average = 78%". The students disappear. A **window function** is the rank printed on each student\'s own report card: "Rank 3 of 40". Every student still has their card; the rank is just one more line on it, worked out by looking at the whole class.' },
    `## Anatomy of a window function
A window function is a normal function followed by \`OVER ( … )\`. The part inside \`OVER\` describes the **window**: which rows this row is allowed to look at.

\`\`\`sql
SELECT emp_name, department, annual_ctc,
       SUM(annual_ctc) OVER (            -- the function, then OVER
         PARTITION BY department         -- 1. split rows into groups (like GROUP BY, but rows stay)
       ) AS dept_total_ctc
FROM employees;
\`\`\`

- **PARTITION BY** splits the rows into groups. Each row only "sees" rows from its own group. Leave it out and the whole table is one big group.
- **ORDER BY** (inside \`OVER\`) puts the rows of each group in order. Ranking functions need it: "rank by salary, highest first".
- \`OVER ()\` with nothing inside means "look at every row of the result".

Any aggregate you know (\`SUM\`, \`COUNT\`, \`AVG\`, \`MIN\`, \`MAX\`) becomes a window function when you add \`OVER\`. Run the query below. Look at the row count: 20 employees in, 20 rows out.`,
    { sql: {
      title: 'Rows stay: department totals next to every employee',
      starter: `SELECT emp_name, department, annual_ctc,
       SUM(annual_ctc) OVER (PARTITION BY department) AS dept_total_ctc,
       COUNT(*)        OVER (PARTITION BY department) AS dept_headcount,
       ROUND(100.0 * annual_ctc / SUM(annual_ctc) OVER (PARTITION BY department), 1) AS pct_of_dept,
       SUM(annual_ctc) OVER () AS company_total_ctc
FROM employees
ORDER BY department, annual_ctc DESC;`,
      note: 'Every employee row is still here. The window columns repeat the department number on each row. `OVER ()` (empty) uses the whole table.',
    } },
    `## The three ranking functions
All three give each row a number based on the \`ORDER BY\` inside \`OVER\`. They only behave differently when there is a **tie** (two rows with the same value).

| Function | What it does with a tie | Example for salaries 20, 20, 18 |
|---|---|---|
| \`ROW_NUMBER()\` | Ignores ties. Always 1, 2, 3, 4… with no repeats | 1, 2, 3 |
| \`RANK()\` | Tied rows share a rank, then it **skips** numbers | 1, 1, 3 |
| \`DENSE_RANK()\` | Tied rows share a rank, **no gaps** after | 1, 1, 2 |

The HR department has a real tie: Sneha Varma and Pooja Varma both earn ₹20,00,000.`,
    { sketch: { w: 760, h: 250, caption: 'Same data, three ranking functions. They only differ when values tie.', items: [
      { t: 'table', x: 30, y: 50, title: 'HR, ORDER BY annual_ctc DESC', cols: ['emp_name', 'annual_ctc', 'ROW_NUMBER', 'RANK', 'DENSE_RANK'], colW: [140, 110, 110, 70, 110], rows: [['Sneha Varma', '20,00,000', '1', '1', '1'], ['Pooja Varma', '20,00,000', '2', '1', '1'], ['Vikram Reddy', '18,00,000', '3', '3', '2']], hl: [0, 1] },
      { t: 'note', x: 590, y: 40, w: 160, h: 70, text: 'RANK skips 2:\n"two people are\nahead of Vikram"' },
      { t: 'note', x: 590, y: 130, w: 160, h: 70, text: 'DENSE_RANK:\n"Vikram has the\n2nd highest pay"', fill: 'green' },
      { t: 'text', x: 280, y: 200, text: 'ROW_NUMBER breaks the tie at random unless you add a tiebreaker', size: 16, color: '#c2410c' },
    ] } },
    `Which one should you use?
- **ROW_NUMBER**: when you need exactly one row per position. Deduplication, "latest record per vendor", "first order per customer".
- **RANK**: sports-style ranking. "Two people tied for first, so nobody is second."
- **DENSE_RANK**: "the 2nd highest salary" questions, where ties should not create gaps.

Run all three side by side:`,
    { sql: {
      title: 'ROW_NUMBER vs RANK vs DENSE_RANK',
      starter: `SELECT department, emp_name, annual_ctc,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY annual_ctc DESC, emp_id) AS row_num,
       RANK()       OVER (PARTITION BY department ORDER BY annual_ctc DESC)         AS rnk,
       DENSE_RANK() OVER (PARTITION BY department ORDER BY annual_ctc DESC)         AS dense_rnk
FROM employees
ORDER BY department, annual_ctc DESC, emp_id;`,
      note: 'Look at HR (Sneha and Pooja tie) and Finance (Karthik Nair and Divya Menon tie at the bottom). The numbering restarts at 1 for each department because of PARTITION BY.',
    } },
    { warn: 'If two rows tie and you only `ORDER BY annual_ctc DESC`, ROW_NUMBER decides who gets 1 and who gets 2 **arbitrarily**. Run the same query tomorrow and the answer can flip. Always add a **tiebreaker** column that is unique, like `ORDER BY annual_ctc DESC, emp_id`. Auditors love repeatable numbers.' },
    `## Top N per group
"Top 2 earners per department" means: number the rows inside each department, then keep numbers 1 and 2.

Your first instinct will be this:

\`\`\`sql
-- DOES NOT WORK
SELECT department, emp_name, annual_ctc
FROM employees
WHERE ROW_NUMBER() OVER (PARTITION BY department ORDER BY annual_ctc DESC) <= 2;
-- ERROR: window functions are not allowed in WHERE
\`\`\`

Why? Because SQL does not run in the order you write it. It runs in a fixed **logical order**, and window functions are calculated **after** \`WHERE\` has already finished.`,
    { sketch: { w: 760, h: 300, caption: 'The logical order of a SELECT. Window functions run late, after WHERE, GROUP BY and HAVING.', items: [
      { t: 'box', x: 20, y: 40, w: 150, h: 54, label: 'FROM / JOIN', sub: '1. get rows' },
      { t: 'box', x: 210, y: 40, w: 150, h: 54, label: 'WHERE', sub: '2. filter rows', fill: 'pink' },
      { t: 'box', x: 400, y: 40, w: 150, h: 54, label: 'GROUP BY', sub: '3. collapse' },
      { t: 'box', x: 590, y: 40, w: 150, h: 54, label: 'HAVING', sub: '4. filter groups' },
      { t: 'arrow', x1: 170, y1: 67, x2: 208, y2: 67 },
      { t: 'arrow', x1: 360, y1: 67, x2: 398, y2: 67 },
      { t: 'arrow', x1: 550, y1: 67, x2: 588, y2: 67 },
      { t: 'arrow', x1: 665, y1: 96, x2: 95, y2: 148, dashed: true, bend: -30 },
      { t: 'box', x: 20, y: 150, w: 150, h: 54, label: 'WINDOW', sub: '5. OVER (...)', fill: 'yellow' },
      { t: 'box', x: 210, y: 150, w: 150, h: 54, label: 'SELECT', sub: '6. pick columns' },
      { t: 'box', x: 400, y: 150, w: 150, h: 54, label: 'ORDER BY', sub: '7. sort' },
      { t: 'box', x: 590, y: 150, w: 150, h: 54, label: 'LIMIT', sub: '8. cut' },
      { t: 'arrow', x1: 170, y1: 177, x2: 208, y2: 177 },
      { t: 'arrow', x1: 360, y1: 177, x2: 398, y2: 177 },
      { t: 'arrow', x1: 550, y1: 177, x2: 588, y2: 177 },
      { t: 'note', x: 140, y: 225, w: 480, h: 60, text: 'At step 2 (WHERE) the row numbers do not exist yet.\nSo: number the rows in a CTE, then filter in the outer query.' },
    ] } },
    `The fix is a two-step query. Step 1 (a CTE) adds the row number. Step 2 filters on it. By the time the outer query runs, \`rn\` is just an ordinary column.

\`\`\`sql
WITH ranked AS (                          -- step 1: add the number
  SELECT department, emp_name, annual_ctc,
         ROW_NUMBER() OVER (PARTITION BY department
                            ORDER BY annual_ctc DESC, emp_id) AS rn
  FROM employees
)
SELECT department, emp_name, annual_ctc   -- step 2: filter on it
FROM ranked
WHERE rn <= 2;
\`\`\`

A useful side effect of the logical order: window functions run **after** \`GROUP BY\`, so you can rank an aggregate directly, for example \`RANK() OVER (PARTITION BY entity_id ORDER BY SUM(debit) DESC)\` in a grouped query.`,
    { sql: {
      title: 'Top 2 per department',
      starter: `WITH ranked AS (
  SELECT department, emp_name, annual_ctc,
         ROW_NUMBER() OVER (PARTITION BY department
                            ORDER BY annual_ctc DESC, emp_id) AS rn
  FROM employees
)
SELECT department, emp_name, annual_ctc, rn
FROM ranked
WHERE rn <= 2
ORDER BY department, rn;`,
      note: 'Now try it on finance data: change the query to show the **3 biggest single expense lines** (debit > 0 on accounts 5000 and above) **per entity** from `fact_gl`.',
      hint: 'PARTITION BY entity_id, ORDER BY debit DESC, gl_id. Filter `account_id >= 5000` inside the CTE.',
      solution: `WITH ranked AS (
  SELECT entity_id, gl_id, journal_id, account_id, posting_date, debit,
         ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY debit DESC, gl_id) AS rn
  FROM fact_gl
  WHERE account_id >= 5000 AND debit > 0
)
SELECT * FROM ranked WHERE rn <= 3 ORDER BY entity_id, rn;`,
    } },
    `## Deduplicate with ROW_NUMBER
Back to the controller's problem. Our \`fact_gl\` table has 1,227 lines. Three of them are **exact copies** of another line: every business column is the same, only the technical \`gl_id\` is different. This happens in real life when an interface file is loaded twice, or a batch is retried after a timeout.

The recipe:
1. **PARTITION BY every business column** (everything except the technical id). Identical lines land in the same partition.
2. **ORDER BY the technical id** inside the window, so the oldest copy gets number 1.
3. Rows with \`rn = 1\` are the keepers. Rows with \`rn > 1\` are the extra copies.`,
    { sql: {
      title: 'Find the duplicate GL lines',
      starter: `WITH numbered AS (
  SELECT gl_id, journal_id, account_id, posting_date, debit, credit,
         ROW_NUMBER() OVER (
           PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date,
                        currency, debit, credit, source_system
           ORDER BY gl_id
         ) AS rn
  FROM fact_gl
)
SELECT * FROM numbered WHERE rn > 1;

-- How many lines before and after cleaning?
SELECT COUNT(*) AS all_lines,
       COUNT(*) FILTER (WHERE rn = 1) AS clean_lines
FROM (
  SELECT ROW_NUMBER() OVER (
           PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date,
                        currency, debit, credit, source_system
           ORDER BY gl_id) AS rn
  FROM fact_gl
) t;`,
      note: 'Three extra copies: gl_id 1225, 1226 and 1227. Each is a twin of an older line (18, 234 and 512). 1,227 lines become 1,224 clean lines.',
    } },
    { tip: 'PostgreSQL has a shortcut for "first row per group": `SELECT DISTINCT ON (customer_id) customer_id, order_id, amount FROM orders ORDER BY customer_id, amount DESC, order_id;` It keeps the first row of each `customer_id` according to the ORDER BY. It is PostgreSQL-only. Snowflake, BigQuery and Databricks instead have `QUALIFY rn = 1`, which filters on a window function without a CTE. ROW_NUMBER in a CTE works **everywhere**, so learn that first.' },
    `## See it move
In the widget below, choose **ROW_NUMBER()**, then click different rows. Turn **PARTITION BY entity** on and off. With the partition on, the numbering restarts for SG01. With it off, all ten rows are one group and the numbers run 1 to 10.`,
    { widget: 'WindowViz' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the **number and order of columns** do.`,
    { challenge: {
      id: 'sql-window-win-dedup-ids',
      prompt: 'The duplicated GL lines must be deleted. Return **one column, `gl_id`**, listing only the **extra copies** (keep the copy with the smallest `gl_id`). Two lines are duplicates when every column except `gl_id` is the same.',
      hint: 'ROW_NUMBER() OVER (PARTITION BY every column except gl_id ORDER BY gl_id) in a CTE, then keep rn > 1.',
      solution: `WITH numbered AS (
  SELECT gl_id,
         ROW_NUMBER() OVER (
           PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date,
                        currency, debit, credit, source_system
           ORDER BY gl_id) AS rn
  FROM fact_gl
)
SELECT gl_id FROM numbered WHERE rn > 1`,
      level: 'easy',
    } },
    { challenge: {
      id: 'sql-window-top2-dense',
      prompt: 'HR wants the **top 2 salary levels in every department**. If two people tie, both must appear. Use **DENSE_RANK** on `annual_ctc` (highest first) and return `department, emp_name, annual_ctc` for everyone with dense rank 1 or 2.',
      hint: 'DENSE_RANK() OVER (PARTITION BY department ORDER BY annual_ctc DESC) in a CTE, then WHERE dr <= 2. HR should return 3 people.',
      solution: `WITH ranked AS (
  SELECT department, emp_name, annual_ctc,
         DENSE_RANK() OVER (PARTITION BY department ORDER BY annual_ctc DESC) AS dr
  FROM employees
)
SELECT department, emp_name, annual_ctc FROM ranked WHERE dr <= 2`,
      level: 'medium',
    } },
    { challenge: {
      id: 'sql-window-win-biggest-order',
      prompt: 'For **each `customer_id` in `orders`**, return the **single biggest order** by `amount`. If a customer has two orders with the same top amount, keep the one with the **smaller `order_id`**. Return `customer_id, order_id, amount`.',
      hint: 'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id). Keep rn = 1. Customer 99 is in orders too, so it appears.',
      solution: `WITH ranked AS (
  SELECT customer_id, order_id, amount,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS rn
  FROM orders
)
SELECT customer_id, order_id, amount FROM ranked WHERE rn = 1`,
      level: 'medium',
    } },
    { real: 'You will use ROW_NUMBER every week as an automation engineer. **Vendor master snapshots**: the ERP sends the full vendor list daily, and you need the latest row per vendor: `ROW_NUMBER() OVER (PARTITION BY vendor_code ORDER BY extracted_at DESC) = 1`. **Bank statement imports** that overlap by one day: dedupe on account, value date, amount and narration. **Top 5 vendors by spend per plant** for the monthly MIS pack: RANK over a grouped SUM. In Project 0 your ingestion step must reject duplicate journal lines, and this is exactly the query behind that rule.' },
    { interview: 'The most common SQL interview question in India is some version of **"find the second highest salary in each department"**. A strong spoken answer: *"I will use DENSE_RANK, not ROW_NUMBER, because if two people share the top salary, the next salary is still the second highest. I partition by department, order by salary descending, put that in a CTE, and filter dense rank = 2. If a department has only one salary level it returns nothing, which I would confirm with the interviewer."* Then mention the tiebreaker if they ask for exactly one person.' },
    `## Recap
- A **window function** = function + \`OVER (PARTITION BY … ORDER BY …)\`. It looks at a group of rows but **keeps every row**, unlike GROUP BY.
- \`ROW_NUMBER\` never repeats; \`RANK\` repeats on ties and skips (1, 1, 3); \`DENSE_RANK\` repeats without gaps (1, 1, 2).
- Window functions run **after WHERE**, so for top-N per group: number rows in a CTE, then filter in the outer query.
- **Dedup recipe**: PARTITION BY all business columns, ORDER BY the technical id, keep \`rn = 1\`.
- Always add a unique **tiebreaker** to the ORDER BY so results are repeatable.`,
  ],
  quiz: [
    { q: 'What is the main difference between `GROUP BY` and a window function?', o: ['GROUP BY is faster', 'Window functions can only count', 'A window function keeps every input row; GROUP BY collapses rows into one per group', 'GROUP BY cannot use SUM'], a: 2, why: 'The window function adds a calculated column while every original row stays in the result.' },
    { q: 'Salaries in a team are 100, 100, 90. What does `RANK()` (highest first) return?', o: ['1, 2, 3', '1, 1, 3', '1, 1, 2', '2, 2, 3'], a: 1, why: 'Tied rows share rank 1, and RANK skips the next number because two rows are ahead of the third.' },
    { q: 'Same salaries 100, 100, 90. What does `DENSE_RANK()` return?', o: ['1, 2, 3', '1, 1, 3', '0, 0, 1', '1, 1, 2'], a: 3, why: 'DENSE_RANK shares the rank on ties and does not leave a gap.' },
    { q: 'Why does `WHERE ROW_NUMBER() OVER (...) <= 3` give an error?', o: ['WHERE is evaluated before window functions are calculated', 'ROW_NUMBER needs GROUP BY', 'You must write LIMIT 3 instead', 'PARTITION BY is missing'], a: 0, why: 'In the logical order, WHERE (step 2) runs long before window functions (step 5). Compute the number in a CTE, then filter outside.' },
    { q: 'To delete duplicate GL lines but keep one copy of each, you…', o: ['GROUP BY gl_id and delete where COUNT(*) > 1', 'Use DENSE_RANK ordered by debit', 'Number rows with ROW_NUMBER partitioned by all business columns, ordered by gl_id, and delete rn > 1', 'Use SELECT DISTINCT gl_id'], a: 2, why: 'Identical lines fall into one partition; numbering by the technical id keeps the oldest copy as rn = 1.' },
    { q: 'You use `ROW_NUMBER() OVER (ORDER BY amount DESC)` and two orders have the same amount. What can happen?', o: ['PostgreSQL raises an error', 'The two tied rows may swap numbers between runs', 'Both rows get the same number', 'The tied rows are removed'], a: 1, why: 'Without a unique tiebreaker the order among ties is arbitrary. Add `, order_id` to make it repeatable.' },
  ],
  task: {
    title: 'Rank and dedupe on your own PostgreSQL',
    steps: [
      'Open DBeaver and connect to your local practice database (the Kollana Tech data from the setup lesson).',
      'Write a query that finds the **top 3 expense accounts by total debit per entity** for FY 2025-26: GROUP BY entity_id, account_id first, then `RANK() OVER (PARTITION BY entity_id ORDER BY SUM(debit) DESC)` and filter rank <= 3 in an outer query.',
      'Write the deduplication query for `fact_gl` and confirm it finds exactly 3 extra copies.',
      'Add a comment above each query explaining why you chose ROW_NUMBER, RANK or DENSE_RANK.',
      'Save both queries as `sql-practice/window_ranking.sql` and commit it to Git.',
    ],
    deliverable: 'A committed `window_ranking.sql` with two working queries and a one-line comment on each explaining the ranking function choice.',
  },
};
