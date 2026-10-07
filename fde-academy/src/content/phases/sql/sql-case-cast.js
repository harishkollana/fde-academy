export default {
  id: 'sql-case-cast',
  title: 'CASE, CAST and numbers: labels, types and rounding',
  goal: 'You can turn values into labels with CASE, convert between types with CAST and ::, and avoid the integer-division and rounding mistakes that quietly corrupt percentages and money.',
  roadmap: [
    'Simple and searched CASE',
    'CAST and the :: operator',
    'ROUND, numeric precision, integer division',
  ],
  blocks: [
    `## The problem
Two requests arrive on the same day.

**Request 1.** The sales head says: *"Label every order as Large, Medium or Small. Large is ₹2,00,000 or more, Medium is ₹50,000 or more, the rest is Small."* In Excel you would write a nested \`IF\`. SQL has \`CASE\`.

**Request 2.** The controller asks for the delivered share of orders. 118 of the 220 orders were delivered. You write \`118 / 220\`, expecting 0.536 or 53.6%, and Postgres answers **0**.

Both problems are about **values and their types**: how to turn a number into a label, and how SQL decides whether a number is a whole number or a decimal. This lesson closes Module A and gives you the last everyday tools for \`SELECT\`.`,
    `## CASE: if-then-else inside a query
\`CASE\` checks conditions from top to bottom and returns the value of the **first one that is true**:

\`\`\`sql
SELECT order_id, amount,
       CASE
         WHEN amount >= 200000 THEN 'Large'
         WHEN amount >= 50000  THEN 'Medium'
         ELSE 'Small'
       END AS size_band
FROM orders;
\`\`\`
Four rules cover almost every mistake:

1. **First match wins.** An amount of 2,10,000 passes both tests, and it gets \`Large\` because that line comes first. If you wrote the \`>= 50000\` line first, every large order would be called Medium. Order the lines from the most specific to the most general.
2. **No match and no ELSE gives NULL.** Always add an \`ELSE\`, even if it is \`ELSE 'Check this'\`.
3. **Every THEN and the ELSE must be the same kind of value**: all text, or all numbers. A \`CASE\` is one column, and a column has one type.
4. **\`END\` is required.** A missing \`END\` is the most common syntax error.`,
    { sketch: { w: 760, h: 345, caption: 'CASE is a ladder: a value falls down it and stops at the first WHEN that is true.', items: [
      { t: 'text', x: 380, y: 24, text: 'CASE checks the WHEN lines from top to bottom and stops at the first true one', size: 17, bold: true },
      { t: 'box', x: 40, y: 48, w: 300, h: 56, label: 'WHEN amount >= 2,00,000', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 342, y1: 76, x2: 468, y2: 76, label: 'true', lx: 0, ly: -10 },
      { t: 'box', x: 470, y: 48, w: 190, h: 56, label: "'Large'", fill: 'green', size: 19 },
      { t: 'arrow', x1: 190, y1: 106, x2: 190, y2: 140, label: 'false', lx: 28, ly: 0 },
      { t: 'box', x: 40, y: 142, w: 300, h: 56, label: 'WHEN amount >= 50,000', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 342, y1: 170, x2: 468, y2: 170, label: 'true', lx: 0, ly: -10 },
      { t: 'box', x: 470, y: 142, w: 190, h: 56, label: "'Medium'", fill: 'green', size: 19 },
      { t: 'arrow', x1: 190, y1: 200, x2: 190, y2: 234, label: 'false', lx: 28, ly: 0 },
      { t: 'box', x: 40, y: 236, w: 300, h: 56, label: 'ELSE', fill: 'grey', size: 17 },
      { t: 'arrow', x1: 342, y1: 264, x2: 468, y2: 264, label: 'always', lx: 0, ly: -10 },
      { t: 'box', x: 470, y: 236, w: 190, h: 56, label: "'Small'", fill: 'green', size: 19 },
      { t: 'note', x: 40, y: 303, w: 680, h: 34, text: "Order matters: 2,10,000 matches both tests but gets 'Large', because that WHEN is first.", fill: 'yellow', size: 15 },
    ] } },
    `### Simple CASE: compare one column with several values
When every test is "is this column equal to…", you can write the column once:

\`\`\`sql
CASE status
  WHEN 'Delivered' THEN 'Done'
  WHEN 'Shipped'   THEN 'On the way'
  WHEN 'Returned'  THEN 'Reversed'
  ELSE 'Unknown'
END
\`\`\`
This form only tests **equality**. It cannot test for NULL, because \`status = NULL\` is never true (the previous lesson). The \`ELSE\` catches the orders with no status, which is why the \`ELSE\` is not optional in practice. For ranges, or for \`IS NULL\`, use the searched form with a full condition after each \`WHEN\`.

### CASE is useful in more places than SELECT
- **Labels and buckets** in \`SELECT\`, as above. Salary bands, age bands, "within budget / over budget".
- **Custom sort order** in \`ORDER BY\`. Alphabetical order is rarely the business order: "High, Medium, Low" sorts A–Z as High, Low, Medium. The customer segments sorted A–Z are Enterprise, Mid-market, SMB, but suppose the sales head wants the smallest segment first. \`ORDER BY CASE segment WHEN 'SMB' THEN 1 WHEN 'Mid-market' THEN 2 ELSE 3 END\` lets you choose.
- **Inside aggregates**, to count or add only some rows. That is the next module's most powerful trick (conditional aggregation).`,
    { sql: {
      title: 'Searched CASE, simple CASE and a custom sort',
      starter: `-- Size bands (searched CASE) and a status label (simple CASE)
SELECT order_id, amount,
       CASE WHEN amount >= 200000 THEN 'Large'
            WHEN amount >= 50000  THEN 'Medium'
            ELSE 'Small' END AS size_band,
       CASE status WHEN 'Delivered' THEN 'Done'
                   WHEN 'Shipped'   THEN 'On the way'
                   WHEN 'Returned'  THEN 'Reversed'
                   ELSE 'Unknown' END AS status_label
FROM orders
ORDER BY order_id
LIMIT 8;

-- Customers in the order we choose: smallest segment first (A-Z would put Enterprise first)
SELECT customer_id, customer_name, segment
FROM customers
ORDER BY CASE segment WHEN 'SMB' THEN 1 WHEN 'Mid-market' THEN 2 ELSE 3 END,
         customer_name;`,
      note: 'Change LIMIT 8 to LIMIT 30 and find order 23: its status is NULL, and the label says Unknown because of the ELSE. Also try swapping the first two WHEN lines of the size bands and see what changes.',
    } },
    `## CAST and ::, converting one type into another
Every value has a **type**: whole number, decimal, text, date, true/false. Sometimes you must convert one into another. \`CAST(value AS type)\` is the standard way, and PostgreSQL also accepts the short form \`value::type\`. They do exactly the same:

\`\`\`sql
SELECT CAST('2025-04-01' AS date),     -- text to date
       '2025-04-01'::date,             -- same thing, shorter
       '42'::int + 1,                  -- text to whole number: 43
       order_id::text || '-A',         -- number to text, so it can be joined with ||
       12345.678::numeric(10, 2)       -- 12345.68
FROM orders LIMIT 1;
\`\`\`

| Type | Holds | Example |
|---|---|---|
| \`integer\`, \`bigint\` | whole numbers (bigint for very large counts) | \`qty\`, \`emp_id\` |
| \`numeric(12,2)\` | exact decimals: 12 digits in total, 2 after the point | \`amount\`, \`debit\` |
| \`double precision\` | approximate decimals (fast, but not exact) | scientific data, not money |
| \`text\` | any text | \`customer_name\` |
| \`date\`, \`timestamp\` | a day, or a day with a time | \`order_date\` |
| \`boolean\` | true or false | \`'true'::boolean\` |

Three things to know about casting:
- **A bad value stops the whole query.** \`'abc'::int\` raises *ERROR: invalid input syntax for type integer*, and not a single row comes back. When you import files, clean the text before you cast it.
- **Casting a decimal to a whole number rounds it**: \`7.9::int\` is **8**, not 7. To cut the decimals off, use \`TRUNC(7.9)\`, which gives 7.
- **A value that does not fit is refused.** \`12345.678::numeric(4,2)\` fails with *numeric field overflow*, because a \`numeric(4,2)\` holds at most 99.99.`,
    { sql: {
      title: 'Casting in practice',
      starter: `SELECT '2025-04-01'::date                    AS d,
       '2025-04-01'::date + 30               AS thirty_days_later,
       CAST('2026-03-31' AS date) - CAST('2025-04-01' AS date) AS days_in_fy,
       '42'::int + 1                          AS text_to_int,
       42::text || '-A'                       AS int_to_text,
       7.9::int                               AS cast_rounds,
       TRUNC(7.9)                             AS trunc_cuts,
       12345.678::numeric(10, 2)              AS two_decimals;

-- Remove the dashes to see a cast fail. The error is the lesson.
-- SELECT 'abc'::int;`,
      note: 'Subtracting two dates gives a whole number of days (364 for FY 2025-26, from 1 April to 31 March). Un-comment the last line to read the real error message.',
    } },
    `## Integer division and rounding
Now the second request. In Postgres, **a whole number divided by a whole number gives a whole number**. The decimals are cut off:

| Expression | Result | Why |
|---|---|---|
| \`7 / 2\` | 3 | integer / integer = integer |
| \`7 / 2.0\` | 3.5 | one side is a decimal, so the result is a decimal |
| \`118 / 220\` | 0 | 0.536 is cut to 0 |
| \`100 * 118 / 220\` | 53 | 53.63 is cut to 53, and not even rounded |
| \`100.0 * 118 / 220\` | 53.636… | \`100.0\` makes the whole expression decimal |

The safe habit for percentages: **put \`100.0\` first** (or cast one side to \`numeric\`), multiply before you divide, and round at the end: \`ROUND(100.0 * delivered / total, 1)\` gives 53.6.

\`ROUND(x, n)\` rounds to \`n\` decimals. A negative \`n\` rounds to tens, hundreds and thousands: \`ROUND(1234567, -3)\` is 1235000. \`TRUNC\` cuts, \`CEIL\` rounds up, \`FLOOR\` rounds down.

### Money is numeric, not floating point
Computers store \`double precision\` numbers in binary, and many decimals cannot be written exactly in binary. The classic example: \`0.1 + 0.2\` in floating point is \`0.30000000000000004\`, and it is **not equal** to \`0.3\`. With \`numeric\` the sum is exactly 0.3. Every money column in this course (\`amount\`, \`debit\`, \`gst_amount\`) is \`numeric(12,2)\` or similar for that reason.

### Round late, not early
When you add many rounded numbers, the rounding errors add up too. Three invoice lines of ₹33.335 each: round every line first (₹33.34 × 3) and you get **₹100.02**; add first and round the total once and you get **₹100.01**. This difference of a few paise is exactly what makes a GST reconciliation not match to the last rupee. Keep full precision while you calculate, and round once, at the end.`,
    { sql: {
      title: 'Percentages, floats and the rounding order',
      starter: `-- Integer division: three ways to compute "118 of 220"
SELECT 118 / 220            AS wrong_zero,
       100 * 118 / 220      AS wrong_53,
       100.0 * 118 / 220    AS decimal_pct,
       ROUND(100.0 * 118 / 220, 1) AS pct_1dp;

-- Floating point vs numeric
SELECT 0.1::float8 + 0.2::float8                    AS float_sum,
       (0.1::float8 + 0.2::float8) = 0.3::float8    AS float_equals_03,
       0.1::numeric + 0.2::numeric                  AS numeric_sum,
       (0.1::numeric + 0.2::numeric) = 0.3::numeric AS numeric_equals_03;

-- Round each line, or round the total?
SELECT SUM(ROUND(x, 2)) AS round_each_then_sum,
       ROUND(SUM(x), 2) AS sum_then_round
FROM (VALUES (33.335), (33.335), (33.335)) AS t(x);`,
      note: 'Expected: 0, 53, 53.636…, 53.6. Then 0.30000000000000004 with false, and 0.3 with true. Finally 100.02 against 100.01.',
    } },
    { warn: 'Integer division fails **silently**. There is no error, only a smaller number. Every time you divide two columns in a report, ask: "could both be whole numbers?" Quantities (`qty`), counts and IDs are integers, so `qty / 2` cuts the decimals. Cast one side (`qty::numeric / 2`) or multiply by `1.0`.' },
    { tip: 'To label values by a bucket in one line without CASE, you can use `ROUND(x, -5)` (nearest lakh) or `FLOOR(x / 100000.0)`. But CASE is easier to read and to change, so prefer it whenever the bucket names are not simple numbers.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-case-cast-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'HR wants salary bands. Return `emp_id, emp_name, band` for all employees, where `band` is `A` for `annual_ctc >= 30,00,000`, `B` for `>= 20,00,000`, `C` for `>= 10,00,000`, and `D` for everything else. Sort by `emp_id`. (20 rows.)',
      hint: 'Searched CASE with WHEN annual_ctc >= 3000000 THEN \'A\' ... ELSE \'D\' END. Start with the highest band.',
      solution: `SELECT emp_id, emp_name,
       CASE WHEN annual_ctc >= 3000000 THEN 'A'
            WHEN annual_ctc >= 2000000 THEN 'B'
            WHEN annual_ctc >= 1000000 THEN 'C'
            ELSE 'D' END AS band
FROM employees
ORDER BY emp_id`,
    } },
    { challenge: {
      id: 'sql-case-cast-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'The purchase register mixes GST slabs. For every row of `purchase_register`, return `pr_id, taxable_value, gst_rate_pct`, where `gst_rate_pct` is the GST rate as a **whole number** worked out from the data: `gst_amount` as a percentage of `taxable_value`, rounded and cast to `integer` (the result is 5, 12 or 18). Sort by `pr_id`. (30 rows.)',
      hint: 'CAST(ROUND(100 * gst_amount / taxable_value) AS integer). The columns are numeric, so there is no integer-division problem here.',
      solution: `SELECT pr_id, taxable_value,
       CAST(ROUND(100 * gst_amount / taxable_value) AS integer) AS gst_rate_pct
FROM purchase_register
ORDER BY pr_id`,
    } },
    { challenge: {
      id: 'sql-case-cast-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'The warehouse works the **first 30 orders** (`order_id <= 30`) in pipeline order: **Shipped** first, then **Delivered**, then **Returned**, and orders with **no status** last. Inside each status sort by `order_id`. Return `order_id, status` (30 rows). Row order matters.',
      hint: "ORDER BY CASE status WHEN 'Shipped' THEN 1 WHEN 'Delivered' THEN 2 WHEN 'Returned' THEN 3 ELSE 4 END, order_id. The ELSE catches the NULL statuses.",
      solution: `SELECT order_id, status
FROM orders
WHERE order_id <= 30
ORDER BY CASE status WHEN 'Shipped' THEN 1 WHEN 'Delivered' THEN 2 WHEN 'Returned' THEN 3 ELSE 4 END,
         order_id`,
    } },
    { real: 'CASE is how business rules enter SQL: GST slab by rate, ageing bucket for an invoice (0-30, 31-60, 61-90, 90+ days), approval level by amount, "within tolerance" flags in a reconciliation. Keep the rule in **one** place, in one CASE inside a view or CTE, and let every report use it. When the rule changes (a new approval limit), you change one line instead of ten spreadsheets. Write the business meaning in a comment next to each WHEN.' },
    { interview: '"What does `SELECT 5 / 2` return in PostgreSQL, and how do you get 2.5?" Model answer: "It returns 2, because integer divided by integer is integer division. I make one side a decimal: `5 / 2.0`, `5::numeric / 2`, or `5 * 1.0 / 2`. For percentages I write `100.0 * part / total` and round at the end. For money I use `numeric`, never `float`, because floating point cannot store 0.1 exactly." A follow-up is often: "what happens if CASE has no ELSE?" Answer: it returns NULL when no WHEN matches.' },
    `## Recap
- \`CASE WHEN cond THEN value ... ELSE value END\` is SQL's if-then-else. The **first true WHEN wins**; with no match and no ELSE the result is NULL. All results must be the same type.
- Simple CASE (\`CASE col WHEN 'x' THEN ...\`) tests equality only. For ranges or NULL use the searched form. CASE also works in \`ORDER BY\` for a custom sort.
- \`CAST(x AS type)\` and \`x::type\` are the same. A bad value fails the whole query. Casting a decimal to integer **rounds**; \`TRUNC\` cuts.
- Integer / integer is integer in Postgres (\`118 / 220\` is 0). Use \`100.0 * part / total\` and \`ROUND(..., 1)\`.
- Money is \`numeric\`, not floating point (\`0.1 + 0.2\` is not 0.3 as a float). Round once, at the end.`,
  ],
  quiz: [
    { q: 'An order of ₹2,10,000 runs through `CASE WHEN amount >= 50000 THEN \'Medium\' WHEN amount >= 200000 THEN \'Large\' ELSE \'Small\' END`. What does it get?', o: ['NULL', 'Large', 'Medium', 'Small'], a: 2, why: 'The first true WHEN wins, and 2,10,000 is already >= 50,000. The more specific test must come first.' },
    { q: 'A CASE expression has no ELSE and no WHEN matches a row. What is returned?', o: ['NULL', 'An error', '0', 'An empty string'], a: 0, why: 'Without ELSE the value is NULL. Add an ELSE so that unexpected values are visible instead of silently empty.' },
    { q: 'What does `SELECT 118 / 220` return in PostgreSQL?', o: ['An error', '0.536', '54', '0'], a: 3, why: 'Both numbers are integers, so Postgres does integer division and cuts the decimals. Write `118 / 220.0` or `100.0 * 118 / 220`.' },
    { q: 'What does `SELECT 7.9::int` return?', o: ['7', '8', '7.9', 'An error'], a: 1, why: 'Casting a decimal to integer rounds it. TRUNC(7.9) gives 7.' },
    { q: 'Why is `numeric(12,2)` better than `double precision` for an invoice amount?', o: ['It is exact for decimals, while floating point cannot store 0.1 exactly', 'It allows negative numbers', 'It converts to text automatically', 'It uses less disk space'], a: 0, why: 'numeric stores decimal digits exactly. Floating point gives results such as 0.30000000000000004, which is not equal to 0.3.' },
    { q: 'Three invoice lines of ₹33.335. Which gives the more accurate total?', o: ['Both are always identical', 'Neither can be calculated in SQL', 'Round each line to 2 decimals, then add (100.02)', 'Add the lines, then round the total once (100.01)'], a: 3, why: 'Rounding every line adds three rounding errors. Keep full precision while calculating, and round once at the end.' },
  ],
  task: {
    title: 'Label and convert on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `05_case_cast.sql` in `C:\\sql-practice`.',
      'Query 1: all orders with a `size_band` (Large / Medium / Small) and a `status_label` (Done / On the way / Reversed / Unknown). Check order 23 shows Unknown.',
      'Query 2: the delivered percentage written three ways, `118 / 220`, `100 * 118 / 220` and `ROUND(100.0 * 118 / 220, 1)`. Write a one-line comment on why the first two are wrong (expect 0, 53 and 53.6).',
      'Query 3: the purchase register with the GST rate in whole percent, and an `ageing` style label of your own invention using CASE on `taxable_value`.',
    ],
    deliverable: '`05_case_cast.sql` with three commented queries; the values 0, 53 and 53.6 appear in your results.',
  },
};
