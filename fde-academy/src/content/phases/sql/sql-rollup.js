export default {
  id: 'sql-rollup',
  title: 'Subtotals: GROUPING SETS, ROLLUP, CUBE and GROUPING()',
  goal: 'You can produce detail rows, subtotals and a grand total in one query, and you can tell a subtotal NULL from a real NULL with GROUPING().',
  roadmap: [
    'GROUPING SETS',
    'ROLLUP and CUBE',
    'GROUPING() to label subtotal rows',
  ],
  blocks: [
    `## The problem
The sales head is happy with the channel by status grid, but now asks for the version that goes into the monthly pack: *"The same list, but with a **subtotal for each channel** and a **grand total** at the bottom."*

You already know a way. You write three queries: one grouped by channel and status, one grouped by channel, one with no grouping, and stack them with \`UNION ALL\` (a lesson later in this phase). It works, but the query is long, the table is read three times, and the three parts can drift apart when someone edits only one.

SQL has a cleaner tool for exactly this. You tell \`GROUP BY\` **which groupings you want**, and Postgres computes all of them in a single pass.`,
    `## GROUPING SETS: list the groupings you want
A **grouping set** is one \`GROUP BY\` list. \`GROUPING SETS\` lets you write several of them in one clause. The empty set \`()\` means "no grouping at all", which is the grand total:

\`\`\`sql
SELECT channel, status, COUNT(*) AS orders
FROM orders
GROUP BY GROUPING SETS (
  (channel, status),    -- detail: one row per channel and status
  (channel),            -- subtotal per channel
  ()                    -- grand total
);
\`\`\`
In each output row, a column that is **not part of that row's grouping set is filled with NULL**. A subtotal row for Direct shows \`channel = Direct, status = NULL\`. The grand total row shows NULL in both columns.

You do not always write the sets by hand. There are two shorthands for the most common patterns:

- **\`ROLLUP (a, b)\`** is the **hierarchy**: subtotals that roll up from right to left. It expands to \`(a, b), (a), ()\`. This is the P&L shape: account within group within entity, and a total.
- **\`CUBE (a, b)\`** is **every combination**: \`(a, b), (a), (b), ()\`. It gives totals in both directions, like a cross-tab with margins.`,
    { sketch: { w: 760, h: 200, caption: 'The shorthands and what they expand to. On the orders table, a = channel and b = status.', items: [
      { t: 'table', x: 70, y: 50, title: 'one clause, several GROUP BYs', cols: ['you write', 'groupings you get', 'rows on orders'], colW: [220, 230, 150], rows: [['ROLLUP (a, b)', '(a,b)  (a)  ()', '16'], ['CUBE (a, b)', '(a,b)  (a)  (b)  ()', '20'], ['GROUPING SETS ((a), (b))', '(a)  (b)', '7']] },
      { t: 'note', x: 70, y: 160, w: 600, h: 30, text: 'ROLLUP goes right to left and has a direction. CUBE has no direction: every combination.', fill: 'yellow', size: 14 },
    ] } },
    { sql: {
      title: 'Subtotals and a grand total in one query',
      starter: `-- ROLLUP on one column: channels plus a grand total row (channel is NULL there)
SELECT channel,
       COUNT(*)    AS orders,
       SUM(amount) AS total_amount
FROM orders
GROUP BY ROLLUP (channel)
ORDER BY channel NULLS LAST;

-- GROUPING SETS: totals by channel AND, separately, totals by status
SELECT channel, status, COUNT(*) AS orders
FROM orders
GROUP BY GROUPING SETS ((channel), (status))
ORDER BY channel, status;

-- How many rows do ROLLUP and CUBE give for channel and status?
SELECT (SELECT COUNT(*) FROM (SELECT 1 FROM orders GROUP BY ROLLUP (channel, status)) AS r) AS rollup_rows,
       (SELECT COUNT(*) FROM (SELECT 1 FROM orders GROUP BY CUBE (channel, status)) AS c)   AS cube_rows;`,
      note: 'The first query ends with 220 orders and 2,09,80,275 in the grand-total row, which matches the table total. The second gives 7 rows: 3 channel rows with a NULL status, and 4 status rows with a NULL channel. ROLLUP gives 16 rows and CUBE gives 20.',
    } },
    `## The NULL problem, and GROUPING()
Now run the full rollup and look at the Direct rows carefully:

\`\`\`sql
SELECT channel, status, COUNT(*) AS orders
FROM orders
GROUP BY ROLLUP (channel, status);
\`\`\`
You will see **two rows** with \`channel = Direct\` and \`status = NULL\`. One has 4 orders, the other 67. They mean very different things:

- **4** is a **real NULL**: four Direct orders have no status (you met this in the NULLs lesson).
- **67** is a **subtotal**: all of Direct's orders, with the status column "rolled up".

From the outside both look the same. If you copy this result into an email or load it into a table, nobody can tell which is which. The function **\`GROUPING(column)\`** solves it. It returns **1** when the column was rolled up in that row (the NULL is made by ROLLUP) and **0** when the column was part of the grouping (any NULL is real data).`,
    { sketch: { w: 760, h: 305, caption: 'In a ROLLUP result a NULL can be real data or a placeholder for "all". GROUPING(status) tells them apart.', items: [
      { t: 'table', x: 20, y: 56, title: 'ROLLUP (channel, status), Direct and the grand total', cols: ['channel', 'status', 'orders', 'GROUPING(status)'], colW: [90, 100, 80, 160], rows: [['Direct', 'Delivered', '33', '0'], ['Direct', 'Returned', '16', '0'], ['Direct', 'Shipped', '14', '0'], ['Direct', null, '4', '0'], ['Direct', null, '67', '1'], [null, null, '220', '1']], hl: [3] },
      { t: 'note', x: 480, y: 56, w: 265, h: 56, text: 'Detail rows: one for each\n(channel, status) pair', fill: 'blue', size: 14 },
      { t: 'note', x: 480, y: 126, w: 265, h: 56, text: 'A REAL NULL: 4 Direct orders\nhave no status (GROUPING = 0)', fill: 'pink', size: 14 },
      { t: 'note', x: 480, y: 196, w: 265, h: 56, text: 'A SUBTOTAL: status rolled up.\nThe NULL means "all statuses"', fill: 'green', size: 14 },
      { t: 'arrow', x1: 478, y1: 84, x2: 444, y2: 112, dashed: true },
      { t: 'arrow', x1: 478, y1: 154, x2: 444, y2: 182, dashed: true },
      { t: 'arrow', x1: 478, y1: 224, x2: 444, y2: 210, dashed: true },
      { t: 'text', x: 230, y: 282, text: 'last row: both columns rolled up = the grand total', size: 15, color: '#c2410c' },
    ] } },
    `The professional pattern is to use \`GROUPING()\` inside a \`CASE\` to write a proper label, so the subtotal rows say what they are. Use it in \`ORDER BY\` as well, so each subtotal appears **after** its detail rows and the grand total comes last:

\`\`\`sql
SELECT CASE WHEN GROUPING(channel) = 1 THEN 'ALL CHANNELS' ELSE channel END AS channel_label,
       CASE WHEN GROUPING(status)  = 1 THEN 'ALL STATUSES'
            ELSE COALESCE(status, '(no status)') END                       AS status_label,
       COUNT(*) AS orders
FROM orders
GROUP BY ROLLUP (channel, status)
ORDER BY GROUPING(channel), channel, GROUPING(status), status;
\`\`\``,
    { sql: {
      title: 'Labelled subtotals',
      starter: `-- 1) Ambiguous: two Direct rows with a NULL status
SELECT channel, status, COUNT(*) AS orders,
       GROUPING(channel) AS g_channel, GROUPING(status) AS g_status
FROM orders
GROUP BY ROLLUP (channel, status)
ORDER BY GROUPING(channel), channel, GROUPING(status), status;

-- 2) Clear: labels written with GROUPING()
SELECT CASE WHEN GROUPING(channel) = 1 THEN 'ALL CHANNELS' ELSE channel END AS channel_label,
       CASE WHEN GROUPING(status) = 1 THEN 'ALL STATUSES'
            ELSE COALESCE(status, '(no status)') END                        AS status_label,
       COUNT(*) AS orders
FROM orders
GROUP BY ROLLUP (channel, status)
ORDER BY GROUPING(channel), channel, GROUPING(status), status;

-- 3) A finance flavour: journal lines per entity and source system
SELECT entity_id, source_system, COUNT(*) AS lines
FROM fact_gl
GROUP BY ROLLUP (entity_id, source_system)
ORDER BY GROUPING(entity_id), entity_id, GROUPING(source_system), source_system;`,
      note: 'Query 1 has 16 rows. In query 2 each channel ends with an ALL STATUSES row (67, 74, 79) and the last row is ALL CHANNELS / ALL STATUSES with 220. Query 3 ends with 1227 lines in total.',
    } },
    { warn: 'Never add amounts across entities in a rollup of `fact_gl`. The entities book in **different currencies** (INR, SGD, USD), so a grand total of `debit` over all three is a meaningless number. That is why query 3 counts lines. To get a group total in rupees you first convert with the FX rates (joins lesson), then roll up.' },
    { tip: 'ROLLUP is only as good as its column order. `ROLLUP (entity, bu, account)` gives subtotals per entity, then per entity and BU, then a grand total. Reversing the order gives different subtotals. Think of it as the order of the rows in your report, from the outside to the inside.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-rollup-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Channel totals with a grand total row. Return `channel, orders, total_amount` using `ROLLUP`, sorted by `channel` with the NULL (grand total) row **last**. (4 rows: Direct, Online, Partner, then the total of 220 orders.)',
      hint: 'GROUP BY ROLLUP (channel), and ORDER BY channel NULLS LAST.',
      solution: `SELECT channel, COUNT(*) AS orders, SUM(amount) AS total_amount
FROM orders
GROUP BY ROLLUP (channel)
ORDER BY channel NULLS LAST`,
    } },
    { challenge: {
      id: 'sql-rollup-ch2',
      level: 'medium',
      prompt: 'In one query, return the number of orders **by channel** and, separately, **by status**: `channel, status, orders`. In the channel rows the status is NULL, and in the status rows the channel is NULL. Use `GROUPING SETS`. (7 rows: 3 channels and 4 statuses including the missing one.)',
      hint: 'GROUP BY GROUPING SETS ((channel), (status)).',
      solution: `SELECT channel, status, COUNT(*) AS orders
FROM orders
GROUP BY GROUPING SETS ((channel), (status))`,
    } },
    { challenge: {
      id: 'sql-rollup-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Produce the report exactly as it would appear in the pack, with labels: `channel_label, status_label, orders`. Use `ROLLUP (channel, status)`. `channel_label` is the channel or `ALL CHANNELS`; `status_label` is the status, or `(no status)` for a real missing status, or `ALL STATUSES` for a subtotal. Sort by `GROUPING(channel)`, `channel`, `GROUPING(status)`, `status` so each subtotal follows its detail rows. (16 rows.)',
      hint: 'Two CASE expressions: CASE WHEN GROUPING(col) = 1 THEN \'ALL …\' ELSE … END. For the status, put COALESCE(status, \'(no status)\') in the ELSE branch.',
      solution: `SELECT CASE WHEN GROUPING(channel) = 1 THEN 'ALL CHANNELS' ELSE channel END AS channel_label,
       CASE WHEN GROUPING(status) = 1 THEN 'ALL STATUSES'
            ELSE COALESCE(status, '(no status)') END AS status_label,
       COUNT(*) AS orders
FROM orders
GROUP BY ROLLUP (channel, status)
ORDER BY GROUPING(channel), channel, GROUPING(status), status`,
    } },
    { real: 'Use ROLLUP when the output is a **finished flat report**: an email table, a CSV for the auditors, a quick board table. For dashboards, the better habit is to keep the data at detail level and let the BI tool compute subtotals, because it can drill down and change the grouping for you. In pipelines, `GROUPING()` keeps your subtotal rows from being loaded as if they were real data. A "NULL" product line that is in fact a rollup row is a classic way to double-count revenue in a warehouse.' },
    { interview: '"What is the difference between ROLLUP and CUBE, and how do you tell a subtotal NULL from a real NULL?" Model answer: "ROLLUP (a, b) produces the hierarchy of subtotals (a, b), (a) and the grand total. CUBE (a, b) produces every combination: (a, b), (a), (b) and the grand total. In the output a rolled-up column is NULL, which is indistinguishable from real missing data, so I use GROUPING(col), which is 1 for rolled-up and 0 otherwise, to label the rows or to filter them out."' },
    `## Recap
- \`GROUP BY GROUPING SETS (...)\` computes several groupings in one pass. \`()\` is the grand total. A column outside a row's set shows NULL in that row.
- \`ROLLUP (a, b)\` = \`(a, b), (a), ()\`: hierarchical subtotals and a grand total. \`CUBE (a, b)\` = every combination, including \`(b)\`.
- On the orders table, ROLLUP (channel, status) returns 16 rows, CUBE returns 20, and \`GROUPING SETS ((channel), (status))\` returns 7.
- A NULL from ROLLUP looks the same as a real NULL (the 9 orders without status). \`GROUPING(col)\` is 1 for rolled-up, 0 for real. Use it in CASE labels and in ORDER BY.
- Order the report with \`ORDER BY GROUPING(a), a, GROUPING(b), b\`. Never add amounts across currencies in a rollup.`,
  ],
  quiz: [
    { q: 'Which grouping sets does `ROLLUP (a, b)` produce?', o: ['(a), (b), ()', '(a, b), (b), ()', '(a, b), (a)', '(a, b), (a), ()'], a: 3, why: 'ROLLUP removes columns from the right: (a, b), then (a), then the empty set for the grand total.' },
    { q: 'How many rows does `GROUP BY ROLLUP (channel, status)` return on the orders table (3 channels, 4 statuses including NULL, all combinations present)?', o: ['12', '16', '20', '4'], a: 1, why: '12 detail rows + 3 channel subtotals + 1 grand total = 16. CUBE would add the 4 status subtotals and give 20.' },
    { q: 'In a ROLLUP result you see `status = NULL`. What can it mean?', o: ['Only that the order has no status', 'Only that it is a subtotal row', 'Either a real missing status or a rolled-up subtotal; GROUPING() tells which', 'The query has an error'], a: 2, why: 'Both produce NULL. GROUPING(status) = 1 marks a subtotal, 0 marks real data.' },
    { q: 'What does `GROUPING(status)` return for a subtotal row where status was rolled up?', o: ['1', '0', 'NULL', 'The text ALL'], a: 0, why: 'GROUPING returns 1 when the column is aggregated away in that row, and 0 when it is part of the grouping.' },
    { q: 'How many grouping sets does `CUBE (a, b)` produce?', o: ['3', '4', '2', '6'], a: 1, why: 'Every subset of {a, b}: (a, b), (a), (b) and (). That is 2 × 2 = 4.' },
    { q: 'What is the main advantage of GROUPING SETS over stacking three GROUP BY queries with UNION ALL?', o: ['It returns more columns', 'It allows HAVING', 'One query reads the table once and keeps all the levels consistent', 'It sorts the result automatically'], a: 2, why: 'A single statement computes every level in one pass, and nobody can change one level and forget the others.' },
  ],
  task: {
    title: 'Build a report with subtotals on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `08_rollup.sql` in `C:\\sql-practice`.',
      'Query 1: channel totals with a grand-total row using `ROLLUP (channel)` (expect 4 rows, the last with 220 orders).',
      'Query 2: the labelled `ROLLUP (channel, status)` report with `GROUPING()` (expect 16 rows). Add a comment next to the "(no status)" rows saying why they are not subtotals.',
      'Query 3: the same grouping with `CUBE`. Count the rows (expect 20) and write a comment on which 4 extra rows CUBE adds.',
    ],
    deliverable: '`08_rollup.sql` with three commented queries; the row counts 4, 16 and 20 appear in your results.',
  },
};
