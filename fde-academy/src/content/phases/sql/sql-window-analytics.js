export default {
  id: 'sql-window-analytics',
  title: 'Window functions II: LAG, running totals, frames, NTILE',
  goal: 'You can compare each row with its neighbours (LAG, LEAD), build running totals and year-to-date by fiscal year, control the window frame (ROWS vs RANGE), and add percent-of-total and quartile columns without losing rows.',
  roadmap: [
    'LAG and LEAD: month-on-month change',
    'Running totals and YTD by fiscal year',
    'Moving averages and frames (ROWS vs RANGE)',
    'FIRST_VALUE, LAST_VALUE, NTILE, percent of total',
  ],
  blocks: [
    `## The problem
The CFO wants one table for the monthly review. For each entity and each month it should show:
- the revenue, and the **previous month's** revenue,
- the **month-on-month change in percent**,
- the **year-to-date** total (the fiscal year starts in April),
- a **3-month moving average** that smooths out the ups and downs.

In Excel you would write a formula and copy it down, with each formula pointing at the row above. In SQL, rows have no "above" unless you ask for it, and \`GROUP BY\` would collapse the months you want to keep. The tool for this is the **window function** from the ranking lesson: calculate over a set of related rows, but **keep every row**. This lesson covers the second half of the toolbox: looking at neighbours, accumulating, and choosing exactly **which rows** each window sees.`,
    `## A base query: monthly revenue
Every example below starts from the same small CTE, one row per entity and month, in the entity's own currency:

\`\`\`sql
WITH monthly AS (
  SELECT entity_id,
         DATE_TRUNC('month', posting_date)::date AS month,
         SUM(credit - debit) AS rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)          -- the revenue accounts
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
)
\`\`\`
Remember the three parts of \`OVER (...)\`: \`PARTITION BY\` splits the rows into independent groups (one per entity), \`ORDER BY\` puts each group in order (by month), and an optional **frame** says which rows around the current one the function may use.

## LAG and LEAD: look at the neighbour
\`LAG(col)\` returns the value from the **previous** row of the ordered partition. \`LEAD(col)\` returns it from the **next** row. Both take an optional offset and a default: \`LAG(rev, 1, 0)\` means "one row back, and 0 if there is none".

\`\`\`sql
LAG(rev) OVER (PARTITION BY entity_id ORDER BY month)            -- last month's revenue
100.0 * (rev - LAG(rev) OVER (…)) / NULLIF(LAG(rev) OVER (…), 0) -- month-on-month change in percent
\`\`\`
The first month of each entity has no row above it, so \`LAG\` returns **NULL** and so does the percentage. That is correct: there is nothing to compare with. Wrap the divisor in \`NULLIF(…, 0)\` so a zero month cannot cause a division error.

## Running totals and year-to-date
Put an **aggregate** in a window, add \`ORDER BY\`, and it becomes a **running** aggregate: each row sees all rows from the start of the partition up to itself. \`SUM(rev) OVER (PARTITION BY entity_id ORDER BY month)\` is the running revenue.

For **year-to-date** the running total must **restart every fiscal year**. Add the fiscal year to the partition. A fiscal year that runs April to March can be identified by moving the date three months back and taking the year: April 2025 minus three months is January 2025 (fiscal year 2025), and March 2026 minus three months is December 2025 (still fiscal year 2025).

\`\`\`sql
SUM(rev) OVER (PARTITION BY entity_id, EXTRACT(YEAR FROM (month - INTERVAL '3 months'))
               ORDER BY month)                                    -- YTD, restarts in April
\`\`\`
The Kollana data holds only one fiscal year, so you will not see a restart on it. A small made-up table in the playground below does show it.`,
    { sketch: { w: 760, h: 300, caption: 'LAG reads the row above; the running total adds each row to everything above it. IN01 revenue, first four months, in lakh rupees.', items: [
      { t: 'table', x: 20, y: 56, title: 'IN01, ordered by month', cols: ['month', 'rev', 'LAG(rev)', 'MoM %', 'YTD'], colW: [70, 70, 90, 80, 80], rows: [['Apr', '2.34', null, null, '2.34'], ['May', '2.31', '2.34', '-1.2', '4.65'], ['Jun', '2.47', '2.31', '+6.9', '7.12'], ['Jul', '2.22', '2.47', '-10.1', '9.35']] },
      { t: 'note', x: 440, y: 52, w: 305, h: 70, text: 'LAG looks one row UP in the\nordered partition. April has\nno row above, so it is NULL.', fill: 'blue', size: 15 },
      { t: 'note', x: 440, y: 136, w: 305, h: 70, text: 'YTD = SUM(rev) OVER (ORDER BY month):\neach row adds itself to everything\nabove it. 2.34 + 2.31 = 4.65.', fill: 'green', size: 15 },
      { t: 'note', x: 20, y: 232, w: 725, h: 48, text: 'Four rows in, four rows out. A window function never removes a row. It only adds a column.', fill: 'yellow', size: 15 },
    ] } },
    { sql: {
      title: 'Month-on-month, year-to-date and moving average',
      starter: `WITH monthly AS (
  SELECT entity_id,
         DATE_TRUNC('month', posting_date)::date AS month,
         SUM(credit - debit) AS rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
)
SELECT entity_id, month, rev,
       LAG(rev) OVER w AS prev_rev,
       ROUND(100.0 * (rev - LAG(rev) OVER w) / NULLIF(LAG(rev) OVER w, 0), 1) AS mom_pct,
       SUM(rev) OVER w AS ytd_rev,
       ROUND(AVG(rev) OVER (w ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS avg_3m
FROM monthly
WINDOW w AS (PARTITION BY entity_id ORDER BY month)     -- one definition, used four times
ORDER BY entity_id, month;`,
      note: 'For IN01: May is -1.2% against April, June +6.9%, and the year-to-date after March is 27,66,772.33. Notice the WINDOW clause: it names the window once, so you do not repeat the PARTITION BY and ORDER BY in every column. Every entity starts again at its own April.',
    } },
    { warn: 'Forget `PARTITION BY` and the window is one big group. LAG would then compare the first month of Singapore with the **last month of India**, and the running total would add rupees to dollars. Open the visualizer below, switch off PARTITION BY and choose LAG to see exactly this.' },
    `## Frames: which rows does the window see?
The **frame** is the slice of the partition that the function uses for the current row. You write it after \`ORDER BY\`:

\`\`\`sql
ROWS BETWEEN 2 PRECEDING AND CURRENT ROW         -- this row and the two before it
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW -- from the start up to this row
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING         -- one row on each side
ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING   -- the whole partition
\`\`\`
A **3-month moving average** is just \`AVG(rev) OVER (… ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)\`. For the first two months fewer than three rows exist, so the average uses what is there (April's average is April itself). If you want NULL there instead, add a condition on a row number.

### ROWS vs RANGE, and the default frame
\`ROWS\` counts **physical rows**. \`RANGE\` works with **values**: all rows that have the same \`ORDER BY\` value as the current row ("peers") are treated as one step. It matters when there are **ties**.

The default is the surprise. **If you write \`ORDER BY\` inside \`OVER\` and no frame, you get \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`.** That is a running total, and tied rows all get the **same** total. Customer 8 has two orders on 14 March 2026. With the default frame both show the same running total. With \`ROWS\`, the total grows one row at a time. (Without \`ORDER BY\`, the frame is the whole partition.)`,
    { sketch: { w: 760, h: 300, caption: 'Left: a 3-row frame slides along the months. Right: with tied dates, RANGE gives the peers the same total, ROWS adds one row at a time.', items: [
      { t: 'table', x: 20, y: 60, title: 'IN01 revenue (k)', cols: ['month', 'rev'], colW: [90, 80], rows: [['Apr', '120'], ['May', '135'], ['Jun', '128'], ['Jul', '150'], ['Aug', '142']], hl: [2, 3, 4], titleColor: '#1f2a44' },
      { t: 'text', x: 215, y: 160, text: '<- frame of the Aug row', size: 15, color: '#c2410c', anchor: 'start' },
      { t: 'note', x: 20, y: 236, w: 340, h: 48, text: 'Aug: (128 + 150 + 142) / 3 = 140.0\nThe frame moves down one row at a time.', fill: 'yellow', size: 14 },
      { t: 'table', x: 400, y: 60, title: 'ties: customer 8, two orders on 14 March', cols: ['date', 'amount', 'RANGE', 'ROWS'], colW: [78, 76, 78, 78], rows: [['10 Mar', '10.8k', '10.8k', '10.8k'], ['14 Mar', '36.0k', '183.6k', '46.8k'], ['14 Mar', '136.8k', '183.6k', '183.6k']], hl: [1, 2], titleColor: '#1f2a44' },
      { t: 'note', x: 400, y: 190, w: 345, h: 94, text: 'RANGE (the default with ORDER BY):\nthe two 14 March rows are peers, so\nboth show 183.6k.\nROWS: 46.8k first, then 183.6k.', fill: 'pink', size: 14 },
    ] } },
    `Click through the visualizer. Choose **AVG(rev) 3-month moving**, keep PARTITION BY on, and click the **Aug** row of IN01: the yellow rows are Jun, Jul and Aug and the result is 140.0. Click the **Apr** row of SG01: its frame is only itself (40), because SG01 has no earlier month in its partition. Then switch to **LAG** and turn the partition off: the SG01 April row now shows 142, which is India's August. That is the mistake from the warning above.`,
    { widget: 'WindowViz' },
    { sql: {
      title: 'Fiscal-year restart, and ROWS against RANGE',
      starter: `-- 1) YTD that restarts every April (made-up months across two fiscal years)
SELECT month, rev,
       EXTRACT(YEAR FROM (month - INTERVAL '3 months'))::int AS fiscal_year,
       SUM(rev) OVER (PARTITION BY EXTRACT(YEAR FROM (month - INTERVAL '3 months'))
                      ORDER BY month) AS ytd
FROM (VALUES (DATE '2025-02-01', 10), (DATE '2025-03-01', 20),
             (DATE '2025-04-01', 30), (DATE '2025-05-01', 40)) AS t(month, rev)
ORDER BY month;

-- 2) Customer 8, March 2026: the same running total with RANGE (default) and ROWS
SELECT order_id, order_date, amount,
       SUM(amount) OVER (ORDER BY order_date) AS running_default_range,
       SUM(amount) OVER (ORDER BY order_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_rows
FROM orders
WHERE customer_id = 8 AND order_date >= '2026-03-01'
ORDER BY order_date, order_id;`,
      note: 'In the first result the total restarts at 30 in April: 10, 30, 30, 70. In the second, orders 73 and 220 share the date 14 March: RANGE shows 1,83,600 for both, ROWS shows 46,800 and then 1,83,600.',
    } },
    `## FIRST_VALUE, LAST_VALUE and the frame trap
\`FIRST_VALUE(col)\` returns the value from the first row of the frame and \`LAST_VALUE(col)\` from the last. A natural use is an **index**: each month as a percentage of April, \`100.0 * rev / FIRST_VALUE(rev) OVER (… ORDER BY month)\`.

\`LAST_VALUE\` has a famous trap, and it comes straight from the default frame. The default frame **ends at the current row**, so "the last value in the frame" is simply the current row itself. \`LAST_VALUE(rev) OVER (ORDER BY month)\` therefore just repeats \`rev\`. To get the real last month you must **widen the frame**: \`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\`.

## NTILE and percent of total
- \`NTILE(n)\` cuts the ordered rows into \`n\` buckets of (nearly) equal size and numbers them 1 to n. \`NTILE(4)\` makes quartiles, \`NTILE(10)\` deciles. With 20 employees, \`NTILE(4)\` gives four groups of 5. If the rows do not divide evenly, the first groups get one extra.
- **Percent of total** divides a row by a window total: \`100.0 * rev / SUM(rev) OVER (PARTITION BY entity_id)\` is each month's share of its entity's year. With \`OVER ()\` the total is over all rows.
- You can even use a window over an **aggregate**. Window functions run after \`GROUP BY\` (the logical order from the ranking lesson), so \`SUM(SUM(amount)) OVER ()\` is the grand total of the group totals, and \`100.0 * SUM(amount) / SUM(SUM(amount)) OVER ()\` is each channel's share of all sales.`,
    { sql: {
      title: 'FIRST/LAST_VALUE, NTILE and share of total',
      starter: `-- 1) The LAST_VALUE trap, and an index against April (IN01)
WITH monthly AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, SUM(credit - debit) AS rev
  FROM fact_gl WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
)
SELECT month, rev,
       LAST_VALUE(rev) OVER (PARTITION BY entity_id ORDER BY month) AS last_default_frame,
       LAST_VALUE(rev) OVER (PARTITION BY entity_id ORDER BY month
                             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_full_frame,
       ROUND(100.0 * rev / FIRST_VALUE(rev) OVER (PARTITION BY entity_id ORDER BY month), 1) AS index_vs_apr
FROM monthly
WHERE entity_id = 1
ORDER BY month;

-- 2) Salary quartiles: 1 = the top 5 earners
SELECT emp_id, emp_name, annual_ctc,
       NTILE(4) OVER (ORDER BY annual_ctc DESC, emp_id) AS quartile
FROM employees
ORDER BY quartile, annual_ctc DESC, emp_id;

-- 3) Each channel's share of all sales: a window over an aggregate
SELECT channel, SUM(amount) AS total,
       ROUND(100.0 * SUM(amount) / SUM(SUM(amount)) OVER (), 1) AS pct_of_total
FROM orders
GROUP BY channel
ORDER BY channel;`,
      note: 'last_default_frame repeats rev on every row, while last_full_frame shows March (2,28,062.21) on every row. The index is 100.0 for April and 98.8 for May. The quartiles are 5, 5, 5, 5 rows. The shares are 33.6, 32.5 and 33.9 percent.',
    } },
    { tip: 'When a calculation needs the **same** window several times, name it once with `WINDOW w AS (PARTITION BY … ORDER BY …)` and write `OVER w`. You can add a frame to a named window: `OVER (w ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`. The query is shorter, and you cannot change the partition in one column and forget the others.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-window-analytics-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Month-on-month for IN01. Build the monthly revenue per entity (accounts **4100 and 4200**, `SUM(credit - debit)` by month) and return, for entity **1**, `month, rev, prev_rev, mom_pct` for all 12 months, where `prev_rev` is the previous month\'s revenue (NULL for April) and `mom_pct = 100 * (rev - prev_rev) / prev_rev` rounded to 1 decimal. Sort by `month`. (May is -1.2.)',
      hint: "A CTE grouped by entity_id and DATE_TRUNC('month', posting_date)::date. Then LAG(rev) OVER (PARTITION BY entity_id ORDER BY month). Filter entity 1 in the final SELECT, not inside the CTE, or use PARTITION BY anyway.",
      solution: `WITH monthly AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, SUM(credit - debit) AS rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
),
calc AS (
  SELECT entity_id, month, rev,
         LAG(rev) OVER (PARTITION BY entity_id ORDER BY month) AS prev_rev
  FROM monthly
)
SELECT month, rev, prev_rev,
       ROUND(100.0 * (rev - prev_rev) / NULLIF(prev_rev, 0), 1) AS mom_pct
FROM calc
WHERE entity_id = 1
ORDER BY month`,
    } },
    { challenge: {
      id: 'sql-window-analytics-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Running revenue for every entity. Using the same monthly revenue, return `entity_id, month, rev, ytd_rev` for **all entities and all months** (36 rows), where `ytd_rev` is the running total of `rev` that **restarts for each entity** in month order. Sort by `entity_id`, then `month`.',
      hint: 'SUM(rev) OVER (PARTITION BY entity_id ORDER BY month) in the final SELECT, over the monthly CTE.',
      solution: `WITH monthly AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, SUM(credit - debit) AS rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
)
SELECT entity_id, month, rev,
       SUM(rev) OVER (PARTITION BY entity_id ORDER BY month) AS ytd_rev
FROM monthly
ORDER BY entity_id, month`,
    } },
    { challenge: {
      id: 'sql-window-analytics-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Smooth the revenue. For every entity and month (36 rows) return `entity_id, month, rev, avg_3m`, where `avg_3m` is the **average of this month and the two months before it** within the same entity, rounded to 2 decimals. The first two months of each entity use the rows that exist. Sort by `entity_id`, then `month`.',
      hint: 'AVG(rev) OVER (PARTITION BY entity_id ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), wrapped in ROUND(…, 2).',
      solution: `WITH monthly AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, SUM(credit - debit) AS rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
)
SELECT entity_id, month, rev,
       ROUND(AVG(rev) OVER (PARTITION BY entity_id ORDER BY month
                            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS avg_3m
FROM monthly
ORDER BY entity_id, month`,
    } },
    { real: 'These are the columns of every management report: previous month, month-on-month percent, year-to-date, moving average, share of total, and a top-quartile flag. Build them in **one place** (a CTE or a view) and have Power BI, Excel and your scripts read it. When someone questions a number, you can point at one query. A moving average is also the simplest anomaly check for payroll or expense feeds: flag a month that is more than, say, 30% away from its 3-month average. Always state in the report header whether year-to-date is on the fiscal year (April to March) or the calendar year.' },
    { interview: '"What is the difference between ROWS and RANGE in a window frame, and what is the default?" Model answer: "ROWS counts a fixed number of physical rows before or after the current row. RANGE works on the ORDER BY value, so rows with the same value (peers) are treated together. If you give ORDER BY and no frame, the default is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, so tied rows get the same running total, and LAST_VALUE just returns the current row. For a moving average or a strict running total I write ROWS explicitly." Other favourites: "Calculate month-on-month growth" (LAG and NULLIF), "running total per customer" (SUM OVER with PARTITION BY) and "top 3 per group" (ROW_NUMBER, from the previous lesson).' },
    `## Recap
- \`LAG(col, n, default)\` and \`LEAD(col, n, default)\` read the previous or next row of the ordered partition. The first row has no previous one, so LAG is NULL. Month-on-month % = \`100.0 * (rev - LAG(rev)) / NULLIF(LAG(rev), 0)\`.
- An aggregate with \`OVER (… ORDER BY …)\` is a running aggregate. **YTD**: partition by entity and fiscal year; for an April to March year, \`EXTRACT(YEAR FROM (month - INTERVAL '3 months'))\` identifies the year.
- A **frame** picks the rows around the current row: \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\` is a 3-row moving average. With ORDER BY and no frame, the default is \`RANGE … UNBOUNDED PRECEDING AND CURRENT ROW\`: tied rows share the same total.
- \`LAST_VALUE\` needs \`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\`, otherwise it returns the current row. \`FIRST_VALUE\` makes an index (\`100.0 * rev / FIRST_VALUE(rev)\`).
- \`NTILE(4)\` makes quartiles (20 employees give 5 per group). Percent of total is \`100.0 * x / SUM(x) OVER (…)\`, and \`SUM(SUM(x)) OVER ()\` works on grouped data.
- Name repeated windows with \`WINDOW w AS (…)\` and always think about \`PARTITION BY\`: without it you compare entities and currencies with each other.`,
  ],
  quiz: [
    { q: 'What does `LAG(rev) OVER (PARTITION BY entity_id ORDER BY month)` return for the first month of each entity?', o: ['0', 'NULL', 'The same month\'s rev', 'An error'], a: 1, why: 'There is no row above the first one in the partition, so LAG returns NULL, unless you supply a default as the third argument.' },
    { q: 'You want a year-to-date total that restarts every April. What goes into the PARTITION BY?', o: ['Only the month', 'Only the entity', 'Nothing: ORDER BY is enough', 'The entity and the fiscal year'], a: 3, why: 'The running total restarts when the partition changes. Partition by entity and fiscal year (for April to March, the year of the date minus three months).' },
    { q: 'Which frame gives a 3-month moving average (this month and the two before)?', o: ['ROWS BETWEEN 2 PRECEDING AND CURRENT ROW', 'ROWS BETWEEN 3 PRECEDING AND CURRENT ROW', 'ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING', 'RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW'], a: 0, why: '2 PRECEDING plus the current row is 3 rows. 3 PRECEDING would average 4 months, and the last option is a running average from the start.' },
    { q: 'Why does `LAST_VALUE(rev) OVER (ORDER BY month)` usually just repeat the current row\'s value?', o: ['LAST_VALUE is broken in PostgreSQL', 'It needs PARTITION BY', 'The default frame ends at the current row, so the last row in the frame is the current row', 'It only works on text'], a: 2, why: 'With ORDER BY and no frame the frame runs from the start to the current row. Use ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING to see the real last row.' },
    { q: 'Two rows share the same ORDER BY value. How do ROWS and RANGE running totals differ?', o: ['They never differ', 'ROWS ignores ties completely', 'RANGE fails with ties', 'RANGE gives the tied (peer) rows the same total; ROWS adds one physical row at a time'], a: 3, why: 'RANGE treats rows with an equal ORDER BY value as peers and includes them all. ROWS counts rows one by one, so the totals grow row by row.' },
    { q: '`NTILE(4) OVER (ORDER BY annual_ctc DESC)` on the 20 employees gives…', o: ['Four groups of 4, plus 4 left out', 'Four groups of 5 rows, with group 1 holding the highest earners', 'Twenty groups', 'Four groups, ordered by lowest pay first'], a: 1, why: 'NTILE(4) splits the 20 ordered rows into 4 buckets of 5. Ordering by annual_ctc DESC puts the top earners in bucket 1.' },
  ],
  task: {
    title: 'Build the monthly review table on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `13_window_analytics.sql` in `C:\\sql-practice`.',
      'Query 1: the monthly revenue per entity with `prev_rev`, `mom_pct`, `ytd_rev` and `avg_3m`, using a named `WINDOW`. Check that IN01 YTD after March is 27,66,772.33.',
      'Query 2: switch off the partition on purpose (remove `PARTITION BY entity_id`) and note in a comment how the LAG of the first Singapore month changes.',
      'Query 3: customer 8 in March 2026, running total with the default frame and with `ROWS`. Write the two numbers for order 73 in a comment.',
      'Query 4: salary quartiles with `NTILE(4)` (expect 5 employees in each) and each channel\'s share of sales.',
    ],
    deliverable: '`13_window_analytics.sql` with four commented queries; the numbers 27,66,772.33, 183600 against 46800, and 5 rows per quartile appear in your results.',
  },
};
