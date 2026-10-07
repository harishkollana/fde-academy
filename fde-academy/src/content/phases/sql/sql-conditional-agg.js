export default {
  id: 'sql-conditional-agg',
  title: 'Conditional aggregation: pivots without a pivot table',
  goal: 'You can count and sum only the rows that match a condition, using SUM(CASE WHEN ...) and FILTER, and build a months-across-the-page report and percentage columns in one query.',
  roadmap: [
    'SUM(CASE WHEN ...) and FILTER',
    'Months-as-columns pivot',
    'Ratios and percentages per group',
  ],
  blocks: [
    `## The problem
The sales head wants a small grid for the board pack: **one row per channel, one column per order status**.

| channel | Delivered | Shipped | Returned |
|---|---|---|---|
| Direct | … | … | … |
| Online | … | … | … |
| Partner | … | … | … |

With \`GROUP BY channel, status\` you get the right numbers, but in the wrong shape: 12 rows, one for each combination, stacked one below the other. Finance has the same need with a bigger table: **months across the page**, accounts down the side. That is the shape of every MIS pack.

In Excel you would build a pivot table. In SQL you use a trick that is simple and extremely useful: an aggregate that **only looks at the rows you choose**. It is called **conditional aggregation**, and it is the way analysts produce nearly every cross-tab, ratio and "of which" column.`,
    `## An aggregate that sees only some rows
There are two ways to write it. They mean the same.

**1. \`CASE\` inside the aggregate.** This works in every database:
\`\`\`sql
SUM(CASE WHEN status = 'Returned' THEN amount ELSE 0 END)   -- amount of returned orders
COUNT(CASE WHEN status = 'Returned' THEN 1 END)             -- how many returned orders
\`\`\`
**2. \`FILTER\`.** This is standard SQL that PostgreSQL supports. It reads almost like English:
\`\`\`sql
SUM(amount) FILTER (WHERE status = 'Returned')
COUNT(*)    FILTER (WHERE status = 'Returned')
\`\`\`
How it works: for **each row**, the \`CASE\` produces the amount if the row matches, and \`0\` (or NULL) if it does not. Then \`SUM\` adds up the column. Rows that do not match add nothing. The next picture shows one such column for each of two conditions, calculated side by side on the same five rows.`,
    { sketch: { w: 760, h: 300, caption: 'Each conditional column keeps the amounts of the rows that match and contributes 0 for the others. SUM then adds the column.', items: [
      { t: 'table', x: 20, y: 52, title: 'five sample orders (amounts in thousands)', cols: ['status', 'amount', 'if Delivered', 'if Returned'], colW: [100, 80, 120, 120], rows: [['Delivered', '45', '45', '0'], ['Returned', '30', '0', '30'], ['Delivered', '20', '20', '0'], ['Shipped', '15', '0', '0'], ['Returned', '10', '0', '10'], ['SUM', '120', '65', '40']], hl: [5] },
      { t: 'note', x: 470, y: 52, w: 275, h: 78, text: "SUM(CASE WHEN status = 'Delivered'\nTHEN amount ELSE 0 END)\n= 45 + 20 = 65", fill: 'blue', size: 14 },
      { t: 'note', x: 470, y: 146, w: 275, h: 78, text: "SUM(CASE WHEN status = 'Returned'\nTHEN amount ELSE 0 END)\n= 30 + 10 = 40", fill: 'pink', size: 14 },
      { t: 'note', x: 470, y: 238, w: 275, h: 46, text: 'Shipped rows count in the total,\nbut in neither conditional column.', fill: 'yellow', size: 14 },
    ] } },
    `Because the filter is inside the aggregate, you can have **many differently filtered aggregates in the same \`SELECT\`**. One pass over the table fills every column. That is also why it is fast.

### Percentages and "of which" columns
A ratio is a conditional aggregate divided by a plain one. Remember the lesson on CASE and numbers: write \`100.0\` first so the division is not an integer division.

\`\`\`sql
ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Delivered') / COUNT(*), 1)   -- 53.6 for the whole table
\`\`\`
That is the answer to the question from the last lesson: 118 of 220 orders delivered is **53.6%**. Put the same expression in a \`GROUP BY channel\` query and you get the delivery rate **per channel**. In finance you will use this shape for "% of journals posted manually", "% of invoices overdue" and "% of lines with a missing cost centre".`,
    { sql: {
      title: 'Conditional counts, sums and ratios per group',
      starter: `-- 1) The status grid. FILTER and CASE give the same numbers.
SELECT channel,
       COUNT(*) FILTER (WHERE status = 'Delivered')              AS delivered,
       COUNT(*) FILTER (WHERE status = 'Shipped')                AS shipped,
       COUNT(*) FILTER (WHERE status = 'Returned')               AS returned,
       COUNT(CASE WHEN status = 'Returned' THEN 1 END)           AS returned_case_form,
       COUNT(*) FILTER (WHERE status IS NULL)                    AS no_status,
       COUNT(*)                                                  AS total
FROM orders
GROUP BY channel
ORDER BY channel;

-- 2) Return rate and returned value per channel
SELECT channel,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Returned') / COUNT(*), 1) AS return_pct,
       SUM(amount) FILTER (WHERE status = 'Returned')                          AS returned_amount
FROM orders
GROUP BY channel
ORDER BY channel;

-- 3) Share of Manual journal lines per entity (a classic control)
SELECT entity_id,
       COUNT(*) AS lines,
       COUNT(*) FILTER (WHERE source_system = 'Manual') AS manual_lines,
       ROUND(100.0 * COUNT(*) FILTER (WHERE source_system = 'Manual') / COUNT(*), 1) AS manual_pct
FROM fact_gl
GROUP BY entity_id
ORDER BY entity_id;`,
      note: 'Direct 33 / 14 / 16 delivered, shipped, returned; Online 38 / 13 / 20; Partner 47 / 21 / 9. In each row delivered + shipped + returned + no_status equals total. Online has the highest return rate (27.0%), Partner the lowest (11.4%). The manual share is 12.4%, 13.2% and 15.0%.',
    } },
    { warn: 'A famous bug: `COUNT(CASE WHEN status = \'Returned\' THEN 1 ELSE 0 END)`. `COUNT` counts every value that is **not NULL**, and `0` is not NULL, so this counts all 220 rows instead of the 45 returned ones. Either leave out the `ELSE` (`COUNT(CASE WHEN … THEN 1 END)`), or use `SUM(CASE WHEN … THEN 1 ELSE 0 END)`, or use `COUNT(*) FILTER (WHERE …)`.' },
    `## Pivot: turn rows into columns
The status grid in the playground is already a pivot. Each column is one conditional aggregate and \`GROUP BY channel\` gives one row per channel. Compare the two shapes:`,
    { sketch: { w: 760, h: 285, caption: 'Long shape (one row per combination) becomes wide shape (one row per channel) with one conditional aggregate per column.', items: [
      { t: 'table', x: 20, y: 56, title: 'GROUP BY channel, status (long)', cols: ['channel', 'status', 'orders'], colW: [90, 100, 80], rows: [['Direct', 'Delivered', '33'], ['Direct', 'Returned', '16'], ['Online', 'Delivered', '38'], ['Online', 'Returned', '20'], ['Partner', 'Delivered', '47'], ['Partner', 'Returned', '9']] },
      { t: 'arrow', x1: 302, y1: 150, x2: 400, y2: 150, label: 'one FILTER\nper column', lx: 0, ly: -34 },
      { t: 'table', x: 412, y: 100, title: 'GROUP BY channel (wide)', cols: ['channel', 'Delivered', 'Returned'], colW: [90, 100, 100], rows: [['Direct', '33', '16'], ['Online', '38', '20'], ['Partner', '47', '9']], fill: 'green' },
      { t: 'note', x: 412, y: 212, w: 290, h: 58, text: 'The columns are written into the query.\nA new status means a new line of SQL.', fill: 'yellow', size: 14 },
    ] } },
    `### The months-across-the-page report
The finance version is the same idea with twelve columns, one for each month of the fiscal year (April to March). Each column is \`SUM(...) FILTER (WHERE month = n)\`. Here we use \`EXTRACT(MONTH FROM posting_date)\`, which returns the month number 1 to 12. (The dates lesson covers date functions fully.)

Two details matter in a finance pivot:
- **Add a total column** (\`SUM(...)\` without a filter) and check that it equals the sum of the twelve months. If it does not, a row fell outside your months, for example a date from another year.
- **Amounts are in each entity's own currency** (INR for IN01, SGD for SG01, USD for US01). The query below keeps one row per entity and never adds them together. To add across entities, you first convert with the FX rates, which is a job for the joins lesson.`,
    { sql: {
      title: 'Revenue by month, one row per entity',
      starter: `SELECT entity_id,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 4)  AS apr,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 5)  AS may,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 6)  AS jun,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 7)  AS jul,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 8)  AS aug,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 9)  AS sep,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 10) AS oct,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 11) AS nov,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 12) AS dec,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 1)  AS jan,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 2)  AS feb,
       SUM(credit - debit) FILTER (WHERE EXTRACT(MONTH FROM posting_date) = 3)  AS mar,
       SUM(credit - debit)                                                       AS fy_total
FROM fact_gl
WHERE account_id IN (4100, 4200)        -- the two revenue accounts
GROUP BY entity_id
ORDER BY entity_id;`,
      note: 'For IN01 the April revenue is 2,33,914.19 and May is 2,31,135.99. Check yourself: the twelve months of one row should add up to fy_total. Notice that when a month has no matching rows, FILTER gives NULL, not 0.',
    } },
    { tip: 'Wrap a conditional sum in `COALESCE(..., 0)` when the report must show `0` for "nothing happened". `SUM(amount) FILTER (WHERE status = \'Cancelled\')` returns **NULL** when no order is cancelled, because SUM of no rows is NULL. Business readers expect a 0.' },
    `### What a pivot cannot do
A conditional-aggregation pivot has a limit you should know. **The columns are fixed when you write the query.** If a new order status appears next year, it silently falls into no column: your \`no_status\` or total column will stop matching, or worse, nobody will notice. PostgreSQL has a \`crosstab\` function in an extension, but it also needs the column list in advance. When columns really are unknown, a program (a Python script, a dbt macro) first reads the distinct values and then **writes** the SQL for you. In reporting, it is common and sensible to pivot only in the last step, and keep the data in the long shape everywhere else. Power BI and Excel can pivot a long table in one click.`,
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-conditional-agg-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Build the board grid: return `channel, delivered, shipped, returned`, where each of the three columns is the **number of orders** with that status in the channel. Sort by `channel`. (3 rows.)',
      hint: "COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered, and the same for the other two, with GROUP BY channel.",
      solution: `SELECT channel,
       COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered,
       COUNT(*) FILTER (WHERE status = 'Shipped')   AS shipped,
       COUNT(*) FILTER (WHERE status = 'Returned')  AS returned
FROM orders
GROUP BY channel
ORDER BY channel`,
    } },
    { challenge: {
      id: 'sql-conditional-agg-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Which channel has the worst return problem? Return `channel, return_pct`, where `return_pct` is the percentage of the channel\'s orders (all statuses, including no status) that are **Returned**, rounded to 1 decimal. Sort by `return_pct` from highest to lowest. (3 rows: Online first.)',
      hint: "ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Returned') / COUNT(*), 1). Use 100.0 so the division is not an integer division.",
      solution: `SELECT channel,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Returned') / COUNT(*), 1) AS return_pct
FROM orders
GROUP BY channel
ORDER BY return_pct DESC`,
    } },
    { challenge: {
      id: 'sql-conditional-agg-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'Quarter-one revenue pivot (April, May, June 2025). From `fact_gl`, using only the revenue accounts **4100 and 4200**, return `entity_id, apr, may, jun`, where each month column is `SUM(credit - debit)` for that month of 2025. Sort by `entity_id`. (3 rows. IN01 April is 233914.19.)',
      hint: "Use SUM(credit - debit) FILTER (WHERE posting_date >= '2025-04-01' AND posting_date < '2025-05-01') for April, and the same pattern for May and June.",
      solution: `SELECT entity_id,
       SUM(credit - debit) FILTER (WHERE posting_date >= '2025-04-01' AND posting_date < '2025-05-01') AS apr,
       SUM(credit - debit) FILTER (WHERE posting_date >= '2025-05-01' AND posting_date < '2025-06-01') AS may,
       SUM(credit - debit) FILTER (WHERE posting_date >= '2025-06-01' AND posting_date < '2025-07-01') AS jun
FROM fact_gl
WHERE account_id IN (4100, 4200)
GROUP BY entity_id
ORDER BY entity_id`,
    } },
    { real: 'Almost every MIS report is conditional aggregation: months or quarters across, actual and budget side by side, "of which manual", "of which overdue". Build the report as one query that returns the long shape plus the pivot columns, and let Power BI or Excel handle formatting. When someone asks "why does the pivot not match the ledger?", you answer with the control column: total minus the sum of the months. If it is not zero, a row fell outside the columns.' },
    { interview: '"How do you turn rows into columns in PostgreSQL?" Model answer: "With conditional aggregation: one `SUM(CASE WHEN …)` or `SUM(…) FILTER (WHERE …)` per output column, plus `GROUP BY` for the row labels. `crosstab` from the tablefunc extension does the same but needs a fixed column list too. If the columns are not known in advance, I generate the SQL from the distinct values in a script, or I pivot in the BI tool." A frequent follow-up is the `COUNT(CASE … ELSE 0 END)` trap: it counts all rows, because 0 is not NULL.' },
    `## Recap
- **Conditional aggregation** is an aggregate that sees only some rows: \`SUM(CASE WHEN cond THEN x ELSE 0 END)\`, or the cleaner \`SUM(x) FILTER (WHERE cond)\`. CASE works in every database; FILTER is standard SQL that PostgreSQL supports.
- Many differently filtered aggregates can sit in one \`SELECT\`. One pass over the table fills all columns.
- Ratios: \`ROUND(100.0 * COUNT(*) FILTER (WHERE …) / COUNT(*), 1)\`. Start with \`100.0\` to avoid integer division.
- A pivot is one conditional aggregate per column plus \`GROUP BY\` for the rows. Months across the page is twelve of them. Add a total column as a control.
- Traps: \`COUNT(CASE … ELSE 0 END)\` counts everything; SUM over no matching rows is NULL (wrap in COALESCE); the pivot's columns are fixed in the query.
- \`fact_gl\` amounts are in local currency, so compare within an entity unless you convert first.`,
  ],
  quiz: [
    { q: 'Which expression counts only the Returned orders in each group?', o: ["COUNT(*) WHERE status = 'Returned'", "COUNT(*) FILTER (WHERE status = 'Returned')", "COUNT(status = 'Returned')", "COUNT(*) HAVING status = 'Returned'"], a: 1, why: 'FILTER (WHERE …) restricts the rows seen by that one aggregate. COUNT(status = …) would count every non-NULL boolean, and WHERE or HAVING cannot be attached to an aggregate like that.' },
    { q: 'What does `COUNT(CASE WHEN status = \'Returned\' THEN 1 ELSE 0 END)` return on the 220 orders?', o: ['45', '0', '175', '220'], a: 3, why: 'COUNT counts every non-NULL value, and 0 is not NULL, so all 220 rows are counted. Remove the ELSE, or use SUM, or use FILTER.' },
    { q: 'Why wrap `SUM(amount) FILTER (WHERE status = \'Cancelled\')` in COALESCE(…, 0)?', o: ['SUM returns NULL when no row matches the filter', 'FILTER removes NULL automatically', 'COALESCE makes SUM faster', 'Otherwise the query fails'], a: 0, why: 'SUM over zero rows is NULL, not 0. A report usually wants to show 0.' },
    { q: 'Which expression gives the delivered percentage per channel with decimals (not 0 or 53)?', o: ["COUNT(*) FILTER (WHERE status = 'Delivered') / COUNT(*)", "100 * COUNT(*) FILTER (WHERE status = 'Delivered') / COUNT(*)", "100.0 * COUNT(*) FILTER (WHERE status = 'Delivered') / COUNT(*)", "COUNT(status) / 100"], a: 2, why: 'Starting with 100.0 makes the division decimal. The first two forms are integer divisions and cut the decimals.' },
    { q: 'What is the main limit of a pivot built with FILTER or CASE?', o: ['It is very slow on large tables', 'It cannot use GROUP BY', 'The output columns are fixed when you write the query', 'It only works with numbers'], a: 2, why: 'A new status or month needs a new line of SQL. For unknown columns, generate the SQL from a script, or pivot in the BI tool.' },
    { q: 'Why does the months pivot keep one row per entity instead of adding all entities together?', o: ['GROUP BY cannot be removed', 'Amounts are in different local currencies (INR, SGD, USD)', 'The revenue accounts differ per entity', 'FILTER works only with one group'], a: 1, why: 'Adding INR to SGD to USD gives a meaningless number. Convert to one currency with the FX rates first (joins lesson), then add.' },
  ],
  task: {
    title: 'Build the board grid and the MIS pivot on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `07_conditional_agg.sql` in `C:\\sql-practice`.',
      'Query 1: the channel by status grid with `COUNT(*) FILTER`. Check each row adds up to the channel total (67, 74, 79).',
      'Query 2: write the same grid with `COUNT(CASE WHEN … THEN 1 END)` and confirm the numbers are identical. Add a comment on why `ELSE 0` would break it.',
      'Query 3: the twelve-month revenue pivot for the entities, with a `fy_total` column. Pick one entity row, add its twelve month values with a calculator or in Excel, and confirm they equal `fy_total`. Write the result in a comment.',
    ],
    deliverable: '`07_conditional_agg.sql` with three commented queries; the grid rows 33/14/16, 38/13/20 and 47/21/9, and a comment that confirms the months add up to fy_total.',
  },
};
