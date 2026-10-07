export default {
  id: 'sql-dates',
  title: 'Dates and time: DATE_TRUNC, fiscal years, calendars and time zones',
  goal: 'You can shift, truncate and extract dates, work out the fiscal year, quarter and month of an April to March year, build a calendar with generate_series, age invoices as of a fixed date, and avoid the time-zone bug that moves a payment into the wrong fiscal year.',
  roadmap: [
    'DATE_TRUNC, EXTRACT, intervals, AGE',
    'Time zones: timestamp vs timestamptz, AT TIME ZONE',
    'Fiscal year April to March',
    'generate_series calendar',
  ],
  blocks: [
    `## The problem
Four requests reach you in one week, and all four are about dates.

1. The payables head wants an **ageing report** for the purchase register: how many invoices are 0-30, 31-60 and 61-90 days old on 30 September.
2. The CFO's MIS pack must show **orders per fiscal quarter**, and the fiscal year runs from April to March.
3. An auditor asks how many journal lines were **posted on a Saturday or Sunday**.
4. A payment made at 00:30 on 1 April was booked in the **old fiscal year**. Nobody can explain why.

Dates are where reports quietly go wrong: formats that mean two things, months with different lengths, a year that does not start in January, and clocks in different countries. This lesson gives you the small set of tools that handles all of them in PostgreSQL.`,
    `## The four date types
| Type | What it holds | Example |
|---|---|---|
| \`date\` | a calendar day, no time | \`DATE '2026-03-31'\` |
| \`timestamp\` | a day and a clock time, **no time zone** (a "wall clock" reading) | \`TIMESTAMP '2026-03-31 14:45:00'\` |
| \`timestamptz\` | a **moment in time**. Stored as UTC, shown in the session's time zone | \`TIMESTAMPTZ '2026-03-31 14:45:00+05:30'\` |
| \`interval\` | a duration | \`INTERVAL '1 month'\`, \`INTERVAL '90 minutes'\` |

The rule of thumb: use \`date\` when the business thinks in days (invoice date, posting date, hire date), use \`timestamptz\` for events that happened at an exact moment (a payment, a file upload, a log line), and use \`interval\` for gaps.

**Write dates in ISO format**, year first: \`'2026-03-31'\`. The slash formats are dangerous. On this server the setting \`DateStyle\` is \`ISO, MDY\`, so \`'03/04/2026'\` means **4 March**, not 3 April, and \`'31/03/2026'\` fails with *date/time field value out of range*. When data arrives in a local format, parse it with an explicit pattern: \`TO_DATE('31/03/2026', 'DD/MM/YYYY')\`. An impossible date such as 31 February is rejected with the same error.`,
    { warn: 'Two display facts about this course\'s playground. It shows only the **date part** of a timestamp, so `SELECT now()` or `DATE_TRUNC(…)` would hide the time. Cast to text (`::text`) or use `TO_CHAR(ts, \'YYYY-MM-DD HH24:MI\')` when you want to see the clock. And `DATE_TRUNC` on a `date` returns a `timestamptz`, so write `DATE_TRUNC(\'month\', d)::date` whenever you want a plain date back (the lessons before this one did that every time).' },
    `## Date arithmetic
- **date + whole number** adds days: \`DATE '2026-03-31' + 7\` is 7 April. **date - date** gives a **whole number of days**: \`DATE '2026-03-31' - DATE '2025-04-01'\` is 364, the number of days from the first to the last day of FY 2025-26.
- **date + interval** gives a timestamp, so cast back: \`(d + INTERVAL '1 month')::date\`.
- **Months have different lengths**, so month arithmetic clamps. 31 January + 1 month is **28 February** (29 in a leap year), and 30 April + 1 month is **30 May**, not 31 May. If you need "the last day of the month", never add months to a month end. Do this instead: **first of the month, plus one month, minus one day**:

\`\`\`sql
(DATE_TRUNC('month', d) + INTERVAL '1 month - 1 day')::date     -- month end of d
\`\`\`
- \`AGE(later, earlier)\` returns an interval in years, months and days: \`AGE(DATE '2026-03-31', DATE '2016-01-10')\` is *10 years 2 mons 21 days*. For whole years only, use \`EXTRACT(YEAR FROM AGE(...))\`.

## An ageing report needs an as-of date
Ageing means "how many days old is this item **on a given date**". Write that date into the query:

\`\`\`sql
DATE '2026-09-30' - invoice_date AS days_old,
CASE WHEN DATE '2026-09-30' - invoice_date <= 30 THEN '0-30'
     WHEN DATE '2026-09-30' - invoice_date <= 60 THEN '31-60'
     WHEN DATE '2026-09-30' - invoice_date <= 90 THEN '61-90'
     ELSE '90+' END AS bucket
\`\`\`
Never use \`CURRENT_DATE\` for a report that someone must be able to **reproduce**. Tomorrow it gives different numbers, and the auditor cannot get yesterday's answer back. Pass the as-of date in explicitly.`,
    { sql: {
      title: 'Parsing, arithmetic, AGE and an ageing report',
      starter: `-- 1) ISO, explicit formats, and the ambiguity of slashes
SELECT DATE '2026-03-31'                           AS iso,
       TO_DATE('31/03/2026', 'DD/MM/YYYY')         AS parsed_dmy,
       '03/04/2026'::date                          AS slash_means_mdy,
       DATE '2026-03-31' - DATE '2025-04-01'       AS days_in_fy,
       DATE '2026-03-31' + 7                       AS plus_7_days;
-- Remove the dashes to see impossible dates rejected:
-- SELECT '2026-02-30'::date;

-- 2) Month arithmetic clamps; the month-end recipe
SELECT (DATE '2025-01-31' + INTERVAL '1 month')::date AS jan31_plus_1m,
       (DATE '2025-04-30' + INTERVAL '1 month')::date AS apr30_plus_1m,
       (DATE_TRUNC('month', DATE '2025-02-10') + INTERVAL '1 month - 1 day')::date AS feb_2025_end,
       (DATE_TRUNC('month', DATE '2024-02-10') + INTERVAL '1 month - 1 day')::date AS feb_2024_end;

-- 3) Tenure on 31 March 2026
SELECT emp_name, hire_date,
       AGE(DATE '2026-03-31', hire_date)::text AS tenure,
       EXTRACT(YEAR FROM AGE(DATE '2026-03-31', hire_date))::int AS full_years
FROM employees
ORDER BY hire_date
LIMIT 4;

-- 4) Ageing of the purchase register as of 30 September 2026
SELECT CASE WHEN DATE '2026-09-30' - invoice_date <= 30 THEN '0-30'
            WHEN DATE '2026-09-30' - invoice_date <= 60 THEN '31-60'
            WHEN DATE '2026-09-30' - invoice_date <= 90 THEN '61-90'
            ELSE '90+' END AS bucket,
       COUNT(*) AS invoices,
       SUM(taxable_value + gst_amount) AS gross_amount
FROM purchase_register
GROUP BY 1
ORDER BY 1;`,
      note: 'The slash date comes back as 2026-03-04, which is 4 March. 2025-01-31 plus a month is 2025-02-28, and April 30 plus a month is May 30. The oldest tenure is Ananya Rao with 10 full years. The ageing has 6 invoices at 0-30 days, 15 at 31-60 and 9 at 61-90, and none older, for a gross total of 42,37,869.23.',
    } },
    `## DATE_TRUNC and EXTRACT: buckets and parts
Two functions cover most reporting needs.

- **\`DATE_TRUNC('month', d)\`** cuts a date **down** to the start of its period: \`'year'\`, \`'quarter'\`, \`'month'\`, \`'week'\` (the Monday), \`'day'\`, \`'hour'\`. Use it as the key in \`GROUP BY\` for "per month" reports.
- **\`EXTRACT(part FROM d)\`** pulls **one number** out: \`YEAR\`, \`MONTH\`, \`QUARTER\`, \`DAY\`, \`WEEK\`, \`DOW\` (Sunday = 0, Saturday = 6), \`ISODOW\` (Monday = 1 to Sunday = 7), \`EPOCH\` (seconds since 1970). \`ISODOW >= 6\` is the clean test for a weekend.

There is one catch for finance people. \`DATE_TRUNC\` and \`QUARTER\` work on the **calendar**. A calendar year starts on 1 January and a calendar quarter on 1 January, 1 April, 1 July and 1 October. Your fiscal year does not.`,
    { sketch: { w: 760, h: 215, caption: 'DATE_TRUNC follows the calendar. Look at the middle row: 10 February 2026 belongs to FY 2025-26, but truncating to the year gives 1 January 2026.', items: [
      { t: 'table', x: 60, y: 50, title: 'DATE_TRUNC(…, date)', cols: ['date', "'month'", "'quarter'", "'year'"], colW: [150, 150, 150, 150], rows: [['2025-11-15', '2025-11-01', '2025-10-01', '2025-01-01'], ['2026-02-10', '2026-02-01', '2026-01-01', '2026-01-01'], ['2025-06-20', '2025-06-01', '2025-04-01', '2025-01-01']], hl: [1] },
      { t: 'note', x: 60, y: 168, w: 600, h: 36, text: 'For a fiscal year (April to March) you must compute it yourself. That comes next.', fill: 'yellow', size: 15 },
    ] } },
    { sql: {
      title: 'Orders per month, and which weekdays journals are posted on',
      starter: `-- Orders per calendar month (the key is the first day of the month)
SELECT DATE_TRUNC('month', order_date)::date AS month,
       COUNT(*)    AS orders,
       SUM(amount) AS total_amount
FROM orders
GROUP BY 1
ORDER BY 1;

-- Journal lines by weekday (ISODOW: Monday = 1 ... Sunday = 7)
SELECT EXTRACT(ISODOW FROM posting_date)::int AS isodow,
       TO_CHAR(posting_date, 'Dy')            AS day_name,
       COUNT(*)                               AS lines
FROM fact_gl
GROUP BY 1, 2
ORDER BY 1;

-- The auditor's question: weekend postings by source system
SELECT source_system,
       COUNT(*) AS total_lines,
       COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM posting_date) >= 6) AS weekend_lines,
       ROUND(100.0 * COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM posting_date) >= 6) / COUNT(*), 1) AS weekend_pct
FROM fact_gl
GROUP BY source_system
ORDER BY source_system;`,
      note: 'April 2025 has 18 orders worth 20,19,310 and March 2026 has 27 orders worth 26,86,155. Journals are posted on every day of the week (Saturday 183 lines, Sunday 152), 335 of the 1,227 lines at weekends. Manual journals at weekends are 45 of 166 lines (27.1%), a typical line in a controls report.',
    } },
    `## The fiscal year, April to March
The fiscal year of **FY 2025-26** runs from 1 April 2025 to 31 March 2026. SQL has no fiscal-year function, but one trick gives you all of it: **move the date three months back, then use the calendar functions.**

| You want | Expression | 1 Apr 2025 | 31 Mar 2026 |
|---|---|---|---|
| Fiscal year (start year) | \`EXTRACT(YEAR FROM (d - INTERVAL '3 months'))\` | 2025 | 2025 |
| Fiscal month (April = 1) | \`(EXTRACT(MONTH FROM d)::int + 8) % 12 + 1\` | 1 | 12 |
| Fiscal quarter | \`((EXTRACT(MONTH FROM d)::int + 8) % 12) / 3 + 1\` | Q1 | Q4 |

To print a label such as FY 2025-26, join the start year to the next year with text: \`'FY ' || fy || '-' || RIGHT((fy + 1)::text, 2)\`.

Why does the first one work? Take 15 February 2026. Three months earlier is 15 November 2025, whose year is 2025, and that is the start year of FY 2025-26. Take 1 April 2026: three months earlier is 1 January 2026, so the year is 2026 and a new fiscal year has begun. The fiscal month works the same way: the calendar months 4 to 12 are fiscal months 1 to 9, and the calendar months 1 to 3 are fiscal months 10 to 12.`,
    { sketch: { w: 760, h: 270, caption: 'FY 2025-26 on the calendar. The calendar year changes after December, in the middle of the fiscal year.', items: [
      { t: 'text', x: 101, y: 30, text: 'Q1', size: 17, bold: true, color: '#1971c2' },
      { t: 'text', x: 287, y: 30, text: 'Q2', size: 17, bold: true, color: '#2f9e44' },
      { t: 'text', x: 473, y: 30, text: 'Q3', size: 17, bold: true, color: '#c2410c' },
      { t: 'text', x: 659, y: 30, text: 'Q4', size: 17, bold: true, color: '#c2255c' },
      { t: 'box', x: 8, y: 50, w: 56, h: 58, label: 'Apr', sub: '1', fill: 'blue', size: 15 },
      { t: 'box', x: 70, y: 50, w: 56, h: 58, label: 'May', sub: '2', fill: 'blue', size: 15 },
      { t: 'box', x: 132, y: 50, w: 56, h: 58, label: 'Jun', sub: '3', fill: 'blue', size: 15 },
      { t: 'box', x: 194, y: 50, w: 56, h: 58, label: 'Jul', sub: '4', fill: 'green', size: 15 },
      { t: 'box', x: 256, y: 50, w: 56, h: 58, label: 'Aug', sub: '5', fill: 'green', size: 15 },
      { t: 'box', x: 318, y: 50, w: 56, h: 58, label: 'Sep', sub: '6', fill: 'green', size: 15 },
      { t: 'box', x: 380, y: 50, w: 56, h: 58, label: 'Oct', sub: '7', fill: 'orange', size: 15 },
      { t: 'box', x: 442, y: 50, w: 56, h: 58, label: 'Nov', sub: '8', fill: 'orange', size: 15 },
      { t: 'box', x: 504, y: 50, w: 56, h: 58, label: 'Dec', sub: '9', fill: 'orange', size: 15 },
      { t: 'box', x: 566, y: 50, w: 56, h: 58, label: 'Jan', sub: '10', fill: 'pink', size: 15 },
      { t: 'box', x: 628, y: 50, w: 56, h: 58, label: 'Feb', sub: '11', fill: 'pink', size: 15 },
      { t: 'box', x: 690, y: 50, w: 56, h: 58, label: 'Mar', sub: '12', fill: 'pink', size: 15 },
      { t: 'brace', x: 8, y: 118, w: 552, label: 'calendar year 2025', color: '#1971c2' },
      { t: 'brace', x: 566, y: 118, w: 180, label: 'calendar 2026', color: '#2f9e44' },
      { t: 'note', x: 8, y: 196, w: 738, h: 60, text: 'Fiscal year = calendar year of (date - 3 months). Fiscal month = (calendar month + 8) % 12 + 1.\n15 Feb 2026 - 3 months = 15 Nov 2025, so it is in FY 2025-26, fiscal month 11, Q4.', fill: 'yellow', size: 15 },
    ] } },
    { sql: {
      title: 'Fiscal year, month and quarter',
      starter: `-- The three expressions on sample dates
SELECT d,
       EXTRACT(YEAR FROM (d - INTERVAL '3 months'))::int                      AS fy_start_year,
       (EXTRACT(MONTH FROM d)::int + 8) % 12 + 1                              AS fiscal_month,
       'Q' || (((EXTRACT(MONTH FROM d)::int + 8) % 12) / 3 + 1)               AS fiscal_quarter
FROM (VALUES (DATE '2025-03-31'), (DATE '2025-04-01'), (DATE '2025-12-31'),
             (DATE '2026-02-15'), (DATE '2026-03-31'), (DATE '2026-04-01')) AS t(d)
ORDER BY d;

-- Orders per fiscal quarter
SELECT 'Q' || (((EXTRACT(MONTH FROM order_date)::int + 8) % 12) / 3 + 1) AS fiscal_quarter,
       COUNT(*)    AS orders,
       SUM(amount) AS total_amount
FROM orders
GROUP BY 1
ORDER BY 1;`,
      note: '31 March 2025 is still FY 2024 (the year before) and 1 April 2025 starts FY 2025. The fiscal quarters of orders are 38, 59, 59 and 64 orders, which add up to the 220 orders, with totals of 35,23,075, 59,11,115, 54,40,325 and 61,05,760.',
    } },
    `## generate_series: a calendar made on the spot
\`generate_series(start, stop, step)\` produces a row for each step. With dates and an interval it is a **calendar** that you build inside the query, with no calendar table:

\`\`\`sql
generate_series(DATE '2025-04-01', DATE '2026-03-01', INTERVAL '1 month')   -- the 12 months of FY 2025-26
generate_series(DATE '2026-03-01', DATE '2026-03-31', INTERVAL '1 day')     -- every day of March 2026
\`\`\`
The result is a \`timestamptz\`, so cast it: \`d::date\`. This is the **scaffold** idea from the join lessons, with dates. Join the facts onto the calendar with a \`LEFT JOIN\` (or test with \`NOT EXISTS\`) and the days without any data appear instead of being silently missing. Add a weekday filter and you can count **business days**. A plain weekday count ignores public holidays. For those you need a holiday table, because no SQL function knows India's holiday list.`,
    { sql: {
      title: 'Calendar scaffold: days with no postings',
      starter: `-- The 12 months of the fiscal year
SELECT m::date AS month_start
FROM generate_series(DATE '2025-04-01', DATE '2026-03-01', INTERVAL '1 month') AS m;

-- Business days (Monday to Friday) in March 2026
SELECT COUNT(*) AS business_days
FROM generate_series(DATE '2026-03-01', DATE '2026-03-31', INTERVAL '1 day') AS d
WHERE EXTRACT(ISODOW FROM d) < 6;

-- Business days in March 2026 on which IN01 (entity 1) posted nothing
SELECT d::date AS day
FROM generate_series(DATE '2026-03-01', DATE '2026-03-31', INTERVAL '1 day') AS d
WHERE EXTRACT(ISODOW FROM d) < 6
  AND NOT EXISTS (SELECT 1 FROM fact_gl g WHERE g.entity_id = 1 AND g.posting_date = d::date)
ORDER BY day;`,
      note: 'March 2026 has 22 business days, and IN01 posted nothing on 12 of them (the first is Monday 2 March). Over the whole month IN01 posted on only 12 of 31 days, so 19 calendar days have no posting.',
    } },
    `## Time zones: the same moment, two calendars
A \`timestamptz\` is **one moment**. The server stores it in UTC. What you see, and what a cast to \`date\` returns, depends on the **session time zone**. That can move a payment to a different day.

India is UTC+5:30. A payment made at **00:30 on 1 April 2026, IST** is **19:00 on 31 March, UTC**. Cast it to a date in a UTC session and you get 31 March, which is **FY 2025-26**. Cast it in an IST session and you get 1 April, which is **FY 2026-27**. The same row lands in two different fiscal years.`,
    { sketch: { w: 760, h: 330, caption: 'One moment, two calendars. Event B happens at 00:30 IST on 1 April, which is still 31 March in UTC.', items: [
      { t: 'line', x1: 40, y1: 100, x2: 720, y2: 100 },
      { t: 'circle', x: 208, y: 100, r: 9, fill: 'blue', label: '', size: 14 },
      { t: 'text', x: 160, y: 70, text: 'A  18:00 UTC', size: 14, bold: true },
      { t: 'circle', x: 238, y: 100, r: 9, fill: 'pink' },
      { t: 'text', x: 300, y: 70, text: 'B  19:00 UTC', size: 14, bold: true, color: '#e03131' },
      { t: 'circle', x: 656, y: 100, r: 9, fill: 'blue' },
      { t: 'text', x: 656, y: 70, text: 'C  10:00 UTC', size: 14, bold: true },
      { t: 'line', x1: 222, y1: 112, x2: 222, y2: 236, dashed: true, color: '#c2410c' },
      { t: 'line', x1: 376, y1: 112, x2: 376, y2: 290, dashed: true, color: '#1971c2' },
      { t: 'text', x: 8, y: 150, text: 'IST', size: 15, anchor: 'start', bold: true },
      { t: 'box', x: 40, y: 134, w: 182, h: 44, label: '31 Mar · FY 2025-26', fill: 'blue', size: 14 },
      { t: 'box', x: 222, y: 134, w: 498, h: 44, label: '1 April · FY 2026-27 (IST day starts at 18:30 UTC)', fill: 'green', size: 14 },
      { t: 'text', x: 8, y: 212, text: 'UTC', size: 15, anchor: 'start', bold: true },
      { t: 'box', x: 40, y: 190, w: 336, h: 44, fill: 'blue' },
      { t: 'text', x: 128, y: 212, text: '31 March · FY 2025-26', size: 14, bold: true },
      { t: 'box', x: 376, y: 190, w: 344, h: 44, label: '1 April · FY 2026-27 (UTC midnight)', fill: 'green', size: 14 },
      { t: 'note', x: 40, y: 252, w: 680, h: 60, text: 'B is 1 April in India (FY 2026-27) but 31 March in UTC (FY 2025-26).\nConvert to the business time zone BEFORE you cast to a date: (ts AT TIME ZONE \'Asia/Kolkata\')::date.', fill: 'pink', size: 15 },
    ] } },
    `Three rules keep you safe:
1. **Say the zone out loud.** Do not rely on the session setting. \`SET TIME ZONE 'Asia/Kolkata'\` at the top of a script, or better, convert explicitly in the query.
2. **\`ts AT TIME ZONE 'zone'\` flips the type.** On a \`timestamptz\` it returns the **wall-clock** \`timestamp\` in that zone. On a plain \`timestamp\` it says "this clock reading is in that zone" and returns the \`timestamptz\`. So \`(paid_at AT TIME ZONE 'Asia/Kolkata')::date\` is the **Indian business date** of a moment, whatever the session says.
3. **Store moments as \`timestamptz\`.** A plain \`timestamp\` forgets which clock it came from. Two files from two countries then cannot be compared.`,
    { sql: {
      title: 'The same payment in two sessions',
      starter: `-- Session in UTC: the payment (00:30 IST on 1 April) falls on 31 March
SET TIME ZONE 'UTC';
SELECT paid_at::text                                   AS stored_as_seen_in_utc,
       paid_at::date                                   AS naive_date,
       (paid_at AT TIME ZONE 'Asia/Kolkata')::date     AS ist_business_date
FROM (SELECT TIMESTAMPTZ '2026-04-01 00:30:00+05:30' AS paid_at) AS p;

-- Session in India: the naive cast changes, the explicit conversion does not
SET TIME ZONE 'Asia/Kolkata';
SELECT paid_at::text                                   AS stored_as_seen_in_ist,
       paid_at::date                                   AS naive_date,
       (paid_at AT TIME ZONE 'Asia/Kolkata')::date     AS ist_business_date
FROM (SELECT TIMESTAMPTZ '2026-04-01 00:30:00+05:30' AS paid_at) AS p;

-- Fiscal year of that payment, computed safely
SELECT EXTRACT(YEAR FROM ((paid_at AT TIME ZONE 'Asia/Kolkata') - INTERVAL '3 months'))::int AS fy_start_year
FROM (SELECT TIMESTAMPTZ '2026-04-01 00:30:00+05:30' AS paid_at) AS p;`,
      note: 'In the UTC session the naive date is 2026-03-31 and the text shows 2026-03-31 19:00:00+00. In the Kolkata session the naive date is 2026-04-01 and the text shows 2026-04-01 00:30:00+05:30. The explicit column ist_business_date is 2026-04-01 in both, and the fiscal year start is 2026.',
    } },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-dates-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Orders per **fiscal quarter**. Return `fiscal_quarter, orders, total_amount`, where `fiscal_quarter` is `Q1` for April to June, `Q2` for July to September, `Q3` for October to December and `Q4` for January to March, based on `order_date`. Sort by `fiscal_quarter`. (4 rows: 38, 59, 59 and 64 orders.)',
      hint: "fiscal quarter = 'Q' || (((EXTRACT(MONTH FROM order_date)::int + 8) % 12) / 3 + 1). GROUP BY that expression.",
      solution: `SELECT 'Q' || (((EXTRACT(MONTH FROM order_date)::int + 8) % 12) / 3 + 1) AS fiscal_quarter,
       COUNT(*) AS orders,
       SUM(amount) AS total_amount
FROM orders
GROUP BY 1
ORDER BY 1`,
    } },
    { challenge: {
      id: 'sql-dates-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Payables ageing **as of 30 September 2026**. For `purchase_register`, return `bucket, invoices, gross_amount`, where the bucket is `0-30`, `31-60` or `61-90` days (days = 30 Sep 2026 minus `invoice_date`; every invoice falls in one of these) and `gross_amount` is the sum of `taxable_value + gst_amount`. Sort by `bucket`. (3 rows: 6, 15 and 9 invoices.)',
      hint: "DATE '2026-09-30' - invoice_date gives the days. Use CASE with <= 30, <= 60 and ELSE '61-90', then GROUP BY the bucket.",
      solution: `SELECT CASE WHEN DATE '2026-09-30' - invoice_date <= 30 THEN '0-30'
            WHEN DATE '2026-09-30' - invoice_date <= 60 THEN '31-60'
            ELSE '61-90' END AS bucket,
       COUNT(*) AS invoices,
       SUM(taxable_value + gst_amount) AS gross_amount
FROM purchase_register
GROUP BY 1
ORDER BY 1`,
    } },
    { challenge: {
      id: 'sql-dates-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'The bank file has three payments with UTC timestamps. Return `payment_id, ist_date, fy_start_year`: the **Indian business date** of each payment (convert to `Asia/Kolkata` first, then cast to a date) and the start year of its **fiscal year** (April to March). Your answer must not depend on the session time zone. Sort by `payment_id`. (Payment 2 must come out as 2026-04-01 and FY 2026.)',
      starter: `WITH p(payment_id, paid_at) AS (
  VALUES (1, TIMESTAMPTZ '2026-03-31 18:00:00+00'),
         (2, TIMESTAMPTZ '2026-03-31 19:00:00+00'),
         (3, TIMESTAMPTZ '2026-04-01 10:00:00+00')
)
SELECT payment_id
FROM p
ORDER BY payment_id`,
      hint: "(paid_at AT TIME ZONE 'Asia/Kolkata') is a wall-clock timestamp in India. Cast it to date, and subtract INTERVAL '3 months' from it before EXTRACT(YEAR ...) for the fiscal year.",
      solution: `WITH p(payment_id, paid_at) AS (
  VALUES (1, TIMESTAMPTZ '2026-03-31 18:00:00+00'),
         (2, TIMESTAMPTZ '2026-03-31 19:00:00+00'),
         (3, TIMESTAMPTZ '2026-04-01 10:00:00+00')
)
SELECT payment_id,
       (paid_at AT TIME ZONE 'Asia/Kolkata')::date AS ist_date,
       EXTRACT(YEAR FROM ((paid_at AT TIME ZONE 'Asia/Kolkata') - INTERVAL '3 months'))::int AS fy_start_year
FROM p
ORDER BY payment_id`,
    } },
    { real: 'Date logic is where finance reports are most often challenged. Keep **one definition** of fiscal year, quarter and month in one place (a function or a view), and let every report use it. Pass the as-of date as a parameter, so the 30 September ageing can be reproduced next year. Name the time zone of every timestamp column in its documentation. In the load pipelines of the later phases, convert to the business time zone at the **edge** (when the data enters) and store `timestamptz`, so nobody downstream has to guess.' },
    { interview: '"How do you get the first and last day of the month in PostgreSQL, and what is the difference between timestamp and timestamptz?" Model answer: "First day: `DATE_TRUNC(\'month\', d)::date`. Last day: add one month to that and subtract one day, because adding a month to a month-end clamps and gives the wrong day. `timestamp` has no zone, so it is only a clock reading. `timestamptz` is a moment in time, stored in UTC and displayed in the session time zone, so it is the right type for events. To get a business date from a `timestamptz` I convert with AT TIME ZONE for the business zone first, then cast to date." Common follow-up: "How would you compute the fiscal year for an April to March year?" (subtract 3 months, take the year).' },
    `## Recap
- Types: \`date\` for days, \`timestamptz\` for moments, \`timestamp\` for a bare clock reading, \`interval\` for durations. Write dates in ISO (\`'2026-03-31'\`) or parse with \`TO_DATE(text, 'DD/MM/YYYY')\`. On this server \`'03/04/2026'\` is 4 March.
- \`date - date\` is a whole number of days; \`date + interval\` is a timestamp, so cast back to \`date\`. Month arithmetic clamps, so a month end is "first of the month + 1 month - 1 day". \`AGE\` gives years, months and days.
- \`DATE_TRUNC\` buckets a date (cast to \`::date\`), \`EXTRACT\` pulls out a number (\`ISODOW >= 6\` means weekend). Both follow the **calendar**, not the fiscal year.
- Fiscal year (April to March): year of \`(d - INTERVAL '3 months')\`. Fiscal month \`(month + 8) % 12 + 1\`, fiscal quarter \`((month + 8) % 12) / 3 + 1\`.
- \`generate_series\` builds calendars. Use it as a scaffold to find days or months with no data. Ageing needs an explicit **as-of date**, never \`CURRENT_DATE\`.
- A \`timestamptz\` is one moment shown in the session zone. Convert with \`AT TIME ZONE 'Asia/Kolkata'\` **before** casting to a date, or a payment at 00:30 IST on 1 April lands in the old fiscal year.`,
  ],
  quiz: [
    { q: 'What does `DATE \'2026-03-31\' - DATE \'2025-04-01\'` return?', o: ['An interval of 12 months', 'The whole number 364', 'The date 2025-04-01', 'An error: dates cannot be subtracted'], a: 1, why: 'Subtracting two dates gives a whole number of days: 364 for the span of FY 2025-26 (the first day to the last day).' },
    { q: 'What is `DATE \'2025-01-31\' + INTERVAL \'1 month\'`?', o: ['2025-03-03', '2025-02-31', 'An error, because February has no 31st', '2025-02-28 (the month arithmetic clamps to the last day)'], a: 3, why: 'PostgreSQL clamps to the end of the shorter month. That is why a month end must be calculated as the first of the month plus one month minus one day.' },
    { q: 'Why does `DATE_TRUNC(\'year\', DATE \'2026-02-10\')` not give the start of the fiscal year?', o: ['DATE_TRUNC follows the calendar, so it returns 1 January 2026, not 1 April 2025', 'DATE_TRUNC cannot work on a date', 'It returns 1 April 2026', 'Because 2026 is a leap year'], a: 0, why: 'A calendar year starts on 1 January. For an April to March fiscal year, subtract 3 months first and then take the year.' },
    { q: 'Which expression gives the start year of the fiscal year (April to March) of the date d?', o: ['EXTRACT(YEAR FROM d)', 'EXTRACT(YEAR FROM d) + 1', 'EXTRACT(YEAR FROM (d - INTERVAL \'3 months\'))', 'EXTRACT(QUARTER FROM d)'], a: 2, why: 'Moving the date back three months puts January to March in the previous calendar year, which is exactly their fiscal start year.' },
    { q: 'A payment is stamped 19:00 UTC on 31 March. Your business works in India (UTC+5:30). What is its business date?', o: ['31 March, because the stamp says 31 March', '30 March', '2 April', '1 April (00:30 IST)'], a: 3, why: '19:00 UTC plus 5 hours 30 minutes is 00:30 the next day in India, so the Indian business date is 1 April, and the payment belongs to the new fiscal year.' },
    { q: 'What does `ts AT TIME ZONE \'Asia/Kolkata\'` return when `ts` is a timestamptz?', o: ['Another timestamptz, shifted by 5 hours 30 minutes', 'The wall-clock timestamp (without time zone) as read in Kolkata', 'Only the date part', 'An error unless the session is in Kolkata'], a: 1, why: 'On a timestamptz, AT TIME ZONE returns the plain timestamp showing the clock in that zone. Cast that to date to get the business date.' },
  ],
  task: {
    title: 'Build the date toolkit on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `14_dates.sql` in `C:\\sql-practice`. Put `SET TIME ZONE \'Asia/Kolkata\';` on the first line.',
      'Query 1: the payables ageing as of 30 September 2026 (expect 6, 15 and 9 invoices). Query 2: orders per fiscal quarter (expect 38, 59, 59 and 64).',
      'Query 3: the weekend-postings control by source system with the percentage (expect Manual 45 of 166 lines).',
      'Query 4: the business days of March 2026 on which IN01 posted nothing, built with `generate_series` and `NOT EXISTS` (expect 12 rows).',
      'Query 5: the three bank payments with their Indian business date and fiscal year, then run the same script again with `SET TIME ZONE \'UTC\'`. Write one comment on what stayed the same and why.',
    ],
    deliverable: '`14_dates.sql` with five commented queries; the numbers 6/15/9, 38/59/59/64, 45 of 166, 12 and the unchanged IST dates appear in your results.',
  },
};
