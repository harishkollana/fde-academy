export default {
  id: 'sql-advanced-patterns',
  title: 'Interview patterns: gaps and islands, sessions, cohorts, funnels, top-N and unpivot',
  goal: 'You can recognise the classic SQL interview and reporting patterns by their clue words, and write each from a template: gaps and islands, sessionisation, running streaks, cohort retention, funnels, top-N per group with ties, and unpivot.',
  roadmap: [
    'Gaps and islands, running streaks',
    'Sessionisation',
    'Cohorts and retention',
    'Funnels',
    'Top-N per group, pivot and unpivot',
  ],
  blocks: [
    `## The problem
Some questions look simple in English and are awkward in SQL:

- *"What is the **longest run of consecutive days** on which Entity 1 posted a journal? And what was the longest stretch with **no** postings?"*
- *"Group these portal clicks into **sessions**. A new session starts after 30 minutes of silence."*
- *"Of the customers whose first order was in April, **how many are still ordering** one month later, two months later?"*
- *"Of 10 expense claims submitted, how many were approved, and **where do they drop out**?"*
- *"Show each customer's **two biggest orders**."* (And what if two orders tie?)
- *"Turn these four quarter columns **into rows**."*

None of these is a new SQL feature. Each is a **pattern**: a known way to combine window functions, \`CASE\` and aggregation that experienced people recognise from the wording of the question. Interviewers ask them because they test exactly that recognition, and finance teams need them for real reports (activity streaks, onboarding funnels, retention of customers or vendors). This lesson gives you each pattern as a **template** with the clue words that should make you think of it.

You need the window functions from the earlier lessons: \`ROW_NUMBER\`, \`RANK\`, \`LAG\`, \`LEAD\`, and \`SUM() OVER\`.`,
    `## Gaps and islands
An **island** is an unbroken run of consecutive values (consecutive days, invoice numbers, month numbers). A **gap** is what lies between two islands. *"Longest streak"*, *"consecutive days"*, *"missing numbers"*, *"periods of continuous activity"* are the clue words.

**Method 1: subtract the row number.** Take the distinct days, number them 1, 2, 3, ... with \`ROW_NUMBER\`, and subtract that number from the date. Inside one island the date goes up by one and the row number goes up by one, so the **difference stays the same**. A gap makes the date jump ahead, so the difference changes. The difference is therefore a label for the island, and you \`GROUP BY\` it.

**Method 2: flag the starts.** With \`LAG\`, mark a day as the **start of a new island** when the previous day is not exactly one day earlier. A running \`SUM\` of those flags numbers the islands. This is the more flexible version: it works when "consecutive" means *within 3 days*, or when the values are timestamps (it is the **sessionisation** pattern in the next section).

Gaps come from the other direction: \`LEAD(day)\` gives the next day, and a gap exists when \`next_day - day > 1\`.`,
    { sketch: { w: 760, h: 296, caption: 'Date minus row number is constant inside an island and jumps at a gap. That constant is the island label.', items: [
      { t: 'table', x: 14, y: 40, title: 'distinct posting days, entity 1', cols: ['day', 'row_number', 'day - row_number'], colW: [120, 120, 170], rows: [['16 May', '1', '15 May'], ['17 May', '2', '15 May'], ['18 May', '3', '15 May'], ['22 May', '7', '15 May'], ['24 May', '8', '16 May']], rowH: 28, hl: [4] },
      { t: 'note', x: 450, y: 40, w: 296, h: 106, fill: 'green', size: 14, text: 'ISLAND 1: 16 May to 22 May\nSame label (15 May) on every row.\nGROUP BY the label:\nMIN(day), MAX(day), COUNT(*) = 7 days' },
      { t: 'note', x: 450, y: 158, w: 296, h: 72, fill: 'pink', size: 14, text: 'GAP: 23 May has no posting.\n24 May: the label jumps to 16 May,\nso a NEW island starts.' },
      { t: 'note', x: 14, y: 246, w: 732, h: 40, fill: 'yellow', size: 14, text: 'Remember to take DISTINCT days first: two postings on the same day would give two row numbers for one date.' },
    ] } },
    { sql: {
      title: 'Longest run of posting days, and the gaps between runs',
      starter: `-- The distinct days on which entity 1 posted at least one journal line in FY 2025-26
-- Method 1: day minus row number is the island label
WITH d AS (SELECT DISTINCT posting_date AS day FROM fact_gl WHERE entity_id = 1),
n AS (SELECT day, day - (ROW_NUMBER() OVER (ORDER BY day))::int AS grp FROM d)
SELECT TO_CHAR(MIN(day), 'YYYY-MM-DD') AS from_day, TO_CHAR(MAX(day), 'YYYY-MM-DD') AS to_day, COUNT(*) AS days
FROM n
GROUP BY grp
ORDER BY days DESC, MIN(day)
LIMIT 5;

-- Method 2: LAG flags the start of an island, a running SUM numbers the islands. Summary of all islands:
WITH d AS (SELECT DISTINCT posting_date AS day FROM fact_gl WHERE entity_id = 1),
f AS (SELECT day, CASE WHEN day - LAG(day) OVER (ORDER BY day) = 1 THEN 0 ELSE 1 END AS new_island FROM d),
n AS (SELECT day, SUM(new_island) OVER (ORDER BY day) AS island FROM f),
i AS (SELECT island, COUNT(*) AS days FROM n GROUP BY island)
SELECT COUNT(*) AS islands, MAX(days) AS longest_island, COUNT(*) FILTER (WHERE days = 1) AS single_day_islands FROM i;

-- The gaps: LEAD gives the next posting day. A gap is a jump of more than 1 day.
WITH d AS (SELECT DISTINCT posting_date AS day FROM fact_gl WHERE entity_id = 1),
g AS (SELECT day, LEAD(day) OVER (ORDER BY day) AS next_day FROM d)
SELECT TO_CHAR(day + 1, 'YYYY-MM-DD') AS gap_from, TO_CHAR(next_day - 1, 'YYYY-MM-DD') AS gap_to, next_day - day - 1 AS days_without_postings
FROM g
WHERE next_day - day > 1
ORDER BY days_without_postings DESC, day
LIMIT 3;

-- A running streak counter: which day of its island is each day?
WITH d AS (SELECT DISTINCT posting_date AS day FROM fact_gl WHERE entity_id = 1),
n AS (SELECT day, day - (ROW_NUMBER() OVER (ORDER BY day))::int AS grp FROM d)
SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day, ROW_NUMBER() OVER (PARTITION BY grp ORDER BY day) AS streak_day
FROM n
WHERE day BETWEEN DATE '2025-05-14' AND DATE '2025-05-26'
ORDER BY day;`,
      note: 'The longest run is 7 days, 2025-05-16 to 2025-05-22, followed by 6 days (2025-10-07 to 2025-10-12 and 2026-01-22 to 2026-01-27). Method 2 finds 85 islands in all, the longest is 7 days and 47 of them are single days. The longest gap is 10 days without a posting, 2025-09-27 to 2025-10-06, then 7 days (2025-04-25 to 2025-05-01). The running streak shows days 1 to 7 for 16 to 22 May and then restarts at 1 on 24 May, because 23 May has no posting.',
    } },
    `## Sessionisation: islands in time
A **session** is a burst of activity with no long pause: portal clicks, invoice uploads, approvals by one person. You decide a **timeout** (30 minutes here). Sessionisation is Method 2 with timestamps:

1. For each user, order events by time and compute the **gap to the previous event** with \`LAG\`.
2. Flag an event as a **session start** if it is the user's first event, or if the gap is **more than the timeout**.
3. A running \`SUM\` of the flags, \`PARTITION BY\` user, gives the **session number**.
4. Aggregate by user and session: start, end, events, duration.

Watch the boundary: "more than 30 minutes" and "30 minutes or more" give different answers for an event exactly 30 minutes after the last one. Ask which one the question means, and say it.`,
    { sketch: { w: 760, h: 250, caption: 'One user, six events. A pause of more than 30 minutes starts a new session. The running sum of the "new session" flags gives each session its number.', items: [
      { t: 'line', x1: 20, y1: 90, x2: 740, y2: 90 },
      { t: 'circle', x: 60, y: 90, r: 8, fill: 'blue' },
      { t: 'circle', x: 150, y: 90, r: 8, fill: 'green' },
      { t: 'circle', x: 172, y: 90, r: 8, fill: 'green' },
      { t: 'circle', x: 520, y: 90, r: 8, fill: 'orange' },
      { t: 'circle', x: 560, y: 90, r: 8, fill: 'orange' },
      { t: 'circle', x: 668, y: 90, r: 8, fill: 'pink' },
      { t: 'text', x: 60, y: 62, text: '09:05', size: 14 },
      { t: 'text', x: 161, y: 62, text: '09:50 09:58', size: 14 },
      { t: 'text', x: 540, y: 62, text: '14:00 14:20', size: 14 },
      { t: 'text', x: 668, y: 62, text: '15:10', size: 14 },
      { t: 'text', x: 60, y: 122, text: 'session 1', size: 14, bold: true, color: '#1971c2' },
      { t: 'text', x: 161, y: 122, text: 'session 2', size: 14, bold: true, color: '#2f9e44' },
      { t: 'text', x: 540, y: 122, text: 'session 3', size: 14, bold: true, color: '#c2410c' },
      { t: 'text', x: 668, y: 122, text: 'session 4', size: 14, bold: true, color: '#c2255c' },
      { t: 'note', x: 14, y: 150, w: 362, h: 86, fill: 'grey', size: 14, text: 'gap = time since the previous event (LAG)\nnew_session = 1 if first event or gap > 30 min\nsession_no = SUM(new_session) OVER\n(PARTITION BY user ORDER BY time)' },
      { t: 'note', x: 388, y: 150, w: 358, h: 86, fill: 'yellow', size: 14, text: 'gaps: 45 min, 8 min, 4 h 2 min,\n20 min, 50 min. Three of them pass 30\nmin (45 min, 4 h 2 min, 50 min), so\nthere are four sessions.' },
    ] } },
    { sql: {
      title: 'Sessions from timestamps with a 30-minute timeout',
      starter: `WITH ev(user_name, at) AS (
  VALUES ('Ananya', TIMESTAMP '2026-04-01 09:00'), ('Ananya', TIMESTAMP '2026-04-01 09:10'), ('Ananya', TIMESTAMP '2026-04-01 09:25'),
         ('Ananya', TIMESTAMP '2026-04-01 10:30'), ('Ananya', TIMESTAMP '2026-04-01 10:35'),
         ('Rohan',  TIMESTAMP '2026-04-01 09:05'), ('Rohan',  TIMESTAMP '2026-04-01 09:50'), ('Rohan',  TIMESTAMP '2026-04-01 09:58'),
         ('Rohan',  TIMESTAMP '2026-04-01 14:00'), ('Rohan',  TIMESTAMP '2026-04-01 14:20'), ('Rohan',  TIMESTAMP '2026-04-01 15:10')
),
-- 1) the gap to the previous event of the same user, in minutes
f AS (
  SELECT user_name, at, EXTRACT(EPOCH FROM at - LAG(at) OVER (PARTITION BY user_name ORDER BY at)) / 60 AS gap_minutes
  FROM ev
),
-- 2) a session starts at the first event, or after a pause of more than 30 minutes; 3) a running SUM numbers the sessions
s AS (
  SELECT user_name, at, gap_minutes,
         SUM(CASE WHEN gap_minutes IS NULL OR gap_minutes > 30 THEN 1 ELSE 0 END) OVER (PARTITION BY user_name ORDER BY at) AS session_no
  FROM f
)
-- 4) one row per session
SELECT user_name, session_no,
       TO_CHAR(MIN(at), 'HH24:MI') AS started, TO_CHAR(MAX(at), 'HH24:MI') AS ended,
       COUNT(*) AS events,
       ROUND(EXTRACT(EPOCH FROM MAX(at) - MIN(at)) / 60) AS minutes
FROM s
GROUP BY user_name, session_no
ORDER BY user_name, session_no;`,
      note: 'Ananya has 2 sessions: 09:00 to 09:25 (3 events, 25 minutes) and 10:30 to 10:35 (2 events, 5 minutes), because the pause from 09:25 to 10:30 is 65 minutes. Rohan has 4 sessions: 09:05 alone (0 minutes), 09:50 to 09:58 (2 events, 8 minutes), 14:00 to 14:20 (2 events, 20 minutes) and 15:10 alone. A single-event session has a duration of 0, which is a real question in sessionisation: say how you treat it.',
    } },
    `## Cohorts and retention
A **cohort** is a group of entities that **started in the same period**: customers by their first order month, vendors by their first invoice, employees by hire month. **Retention** asks what share of the cohort is **still active** N periods later. Clue words: *"still ordering"*, *"came back"*, *"repeat"*, *"churn"*.

The template has four steps:

1. **One row per entity and active period**: \`SELECT DISTINCT customer_id, month\`.
2. **Cohort of each entity** = its **earliest** active period (\`MIN\`).
3. **Periods later** = active period minus cohort period (in whole months here).
4. \`COUNT\` the active entities per cohort and period, and divide by the **cohort size** (the count at period 0).

Always take \`DISTINCT\` in step 1: an entity with five orders in a month is still **one** active entity. Retention is not always a falling curve: a customer who skips a month and returns is active again later.`,
    { sketch: { w: 760, h: 300, caption: 'Retention of the April cohort: seven customers whose first order was in April 2025, and the share who ordered again 0 to 11 months later.', items: [
      { t: 'text', x: 380, y: 16, text: 'share of the April cohort active N months after the first order', size: 15, bold: true },
      { t: 'box', x: 20, y: 134, w: 46, h: 140, fill: 'green' }, { t: 'text', x: 43, y: 122, text: '100', size: 13 },
      { t: 'box', x: 78, y: 174, w: 46, h: 100, fill: 'green' }, { t: 'text', x: 101, y: 162, text: '71', size: 13 },
      { t: 'box', x: 136, y: 214, w: 46, h: 60, fill: 'orange' }, { t: 'text', x: 159, y: 202, text: '43', size: 13 },
      { t: 'box', x: 194, y: 134, w: 46, h: 140, fill: 'green' }, { t: 'text', x: 217, y: 122, text: '100', size: 13 },
      { t: 'box', x: 252, y: 134, w: 46, h: 140, fill: 'green' }, { t: 'text', x: 275, y: 122, text: '100', size: 13 },
      { t: 'box', x: 310, y: 134, w: 46, h: 140, fill: 'green' }, { t: 'text', x: 333, y: 122, text: '100', size: 13 },
      { t: 'box', x: 368, y: 154, w: 46, h: 120, fill: 'green' }, { t: 'text', x: 391, y: 142, text: '86', size: 13 },
      { t: 'box', x: 426, y: 134, w: 46, h: 140, fill: 'green' }, { t: 'text', x: 449, y: 122, text: '100', size: 13 },
      { t: 'box', x: 484, y: 194, w: 46, h: 80, fill: 'orange' }, { t: 'text', x: 507, y: 182, text: '57', size: 13 },
      { t: 'box', x: 542, y: 174, w: 46, h: 100, fill: 'green' }, { t: 'text', x: 565, y: 162, text: '71', size: 13 },
      { t: 'box', x: 600, y: 154, w: 46, h: 120, fill: 'green' }, { t: 'text', x: 623, y: 142, text: '86', size: 13 },
      { t: 'box', x: 658, y: 134, w: 46, h: 140, fill: 'green' }, { t: 'text', x: 681, y: 122, text: '100', size: 13 },
      { t: 'text', x: 43, y: 288, text: 'M0', size: 13 }, { t: 'text', x: 101, y: 288, text: 'M1', size: 13 }, { t: 'text', x: 159, y: 288, text: 'M2', size: 13 },
      { t: 'text', x: 217, y: 288, text: 'M3', size: 13 }, { t: 'text', x: 275, y: 288, text: 'M4', size: 13 }, { t: 'text', x: 333, y: 288, text: 'M5', size: 13 },
      { t: 'text', x: 391, y: 288, text: 'M6', size: 13 }, { t: 'text', x: 449, y: 288, text: 'M7', size: 13 }, { t: 'text', x: 507, y: 288, text: 'M8', size: 13 },
      { t: 'text', x: 565, y: 288, text: 'M9', size: 13 }, { t: 'text', x: 623, y: 288, text: 'M10', size: 13 }, { t: 'text', x: 681, y: 288, text: 'M11', size: 13 },
      { t: 'note', x: 14, y: 36, w: 360, h: 56, fill: 'yellow', size: 13, text: 'Retention can go UP: a customer who skips\nMay can order again in June.' },
    ] } },
    { sql: {
      title: 'Monthly retention of the April 2025 cohort of customers',
      starter: `WITH act AS (   -- 1) one row per customer and active month (customers that exist in the customers table)
  SELECT DISTINCT o.customer_id, DATE_TRUNC('month', o.order_date)::date AS month
  FROM orders o
  JOIN customers c USING (customer_id)
),
coh AS (        -- 2) the cohort of a customer = its first active month
  SELECT customer_id, MIN(month) AS cohort FROM act GROUP BY customer_id
),
size AS (       -- the size of each cohort
  SELECT cohort, COUNT(*) AS cohort_size FROM coh GROUP BY cohort
)
SELECT TO_CHAR(c.cohort, 'YYYY-MM') AS cohort,
       s.cohort_size,
       (EXTRACT(YEAR FROM AGE(a.month, c.cohort)) * 12 + EXTRACT(MONTH FROM AGE(a.month, c.cohort)))::int AS months_later,   -- 3)
       COUNT(*) AS active_customers,                                                                                          -- 4)
       ROUND(100.0 * COUNT(*) / s.cohort_size, 1) AS retention_pct
FROM coh c
JOIN act a USING (customer_id)
JOIN size s ON s.cohort = c.cohort
WHERE c.cohort = DATE '2025-04-01'
GROUP BY c.cohort, s.cohort_size, 3
ORDER BY months_later;

-- Who is in which cohort? (customer 99 is not in the customers table, so it was left out)
SELECT TO_CHAR(cohort, 'YYYY-MM') AS cohort, COUNT(*) AS customers
FROM (SELECT o.customer_id, DATE_TRUNC('month', MIN(o.order_date))::date AS cohort FROM orders o JOIN customers c USING (customer_id) GROUP BY o.customer_id) x
GROUP BY cohort
ORDER BY cohort;`,
      note: 'Seven customers started in April 2025. Their retention by months since the first order is 100 (month 0), 71.4 (5 of 7), 42.9 (3 of 7), 100, 100, 100, 85.7, 100, 57.1, 71.4, 85.7 and 100 percent in month 11: it falls and rises again, because customers skip months and come back. The second query lists the cohorts: 7 customers in April 2025, and one each in May, June and July (10 customers in all). Order 77 belongs to customer 99, who does not exist in the customers table, and the join drops it.',
    } },
    `## Funnels
A **funnel** is a sequence of steps that each entity should pass through, and the question is **how many get through each step**: *"of 10 claims submitted, how many were approved by the manager, then by finance, then paid?"* The clue words are *"conversion"*, *"drop-off"*, *"how many reached"*, *"the process"*.

The trap is **strict** against **loose**. A loose funnel counts a claim at step 3 if a step-3 event exists. A **strict** funnel counts it only if it also passed steps 1 and 2. If a claim is paid without a manager approval (a control failure, or a data error), the loose funnel hides it, and the strict funnel stops it at step 1. Finance auditors care about exactly that difference.

A neat way to build the strict count: collect each claim's steps into an **array** and test that the array **contains** \`{1}\`, \`{1,2}\`, \`{1,2,3}\` with the \`@>\` operator.`,
    { sketch: { w: 760, h: 268, caption: 'A strict funnel for 10 expense claims. Each bar is the number of claims that passed ALL steps up to that one.', items: [
      { t: 'box', x: 20, y: 24, w: 460, h: 44, label: 'submitted: 10  (100%)', fill: 'blue', size: 17 },
      { t: 'box', x: 20, y: 76, w: 322, h: 44, label: 'manager approved: 7  (70%)', fill: 'green', size: 16 },
      { t: 'box', x: 20, y: 128, w: 276, h: 44, label: 'finance approved: 6  (60%)', fill: 'yellow', size: 16 },
      { t: 'box', x: 20, y: 180, w: 230, h: 44, label: 'paid: 5  (50%)', fill: 'orange', size: 16 },
      { t: 'note', x: 496, y: 76, w: 254, h: 44, fill: 'pink', size: 13, text: '3 claims dropped out here\n(70% of the previous step)' },
      { t: 'note', x: 496, y: 128, w: 254, h: 60, fill: 'yellow', size: 13, text: 'loose count says 7: one claim has a\nfinance approval but NO manager\napproval. Strict says 6.' },
      { t: 'note', x: 496, y: 196, w: 254, h: 44, fill: 'pink', size: 13, text: '1 claim stopped at finance\n(83% of the previous step)' },
      { t: 'note', x: 14, y: 232, w: 466, h: 28, fill: 'grey', size: 13, text: 'pct of previous step = strict_reached / previous strict_reached' },
    ] } },
    { sql: {
      title: 'A strict and a loose funnel of expense claims',
      starter: `WITH ev(claim_id, step_no, at) AS (   -- the events: step 1 submitted, 2 manager approved, 3 finance approved, 4 paid
  VALUES ('C01',1,TIMESTAMP '2026-04-01 09:00'),('C01',2,TIMESTAMP '2026-04-01 15:00'),('C01',3,TIMESTAMP '2026-04-02 11:00'),('C01',4,TIMESTAMP '2026-04-03 10:00'),
         ('C02',1,TIMESTAMP '2026-04-01 10:00'),('C02',2,TIMESTAMP '2026-04-02 10:00'),('C02',3,TIMESTAMP '2026-04-03 10:00'),('C02',4,TIMESTAMP '2026-04-06 10:00'),
         ('C03',1,TIMESTAMP '2026-04-01 11:00'),('C03',2,TIMESTAMP '2026-04-01 17:00'),
         ('C04',1,TIMESTAMP '2026-04-01 12:00'),
         ('C05',1,TIMESTAMP '2026-04-02 09:00'),('C05',2,TIMESTAMP '2026-04-02 12:00'),('C05',3,TIMESTAMP '2026-04-03 09:00'),('C05',4,TIMESTAMP '2026-04-04 09:00'),
         ('C06',1,TIMESTAMP '2026-04-02 10:00'),('C06',3,TIMESTAMP '2026-04-03 10:00'),('C06',4,TIMESTAMP '2026-04-04 10:00'),   -- no manager approval!
         ('C07',1,TIMESTAMP '2026-04-02 11:00'),('C07',2,TIMESTAMP '2026-04-02 16:00'),('C07',3,TIMESTAMP '2026-04-04 11:00'),
         ('C08',1,TIMESTAMP '2026-04-03 09:00'),('C08',2,TIMESTAMP '2026-04-03 13:00'),('C08',3,TIMESTAMP '2026-04-04 09:00'),('C08',4,TIMESTAMP '2026-04-07 09:00'),
         ('C09',1,TIMESTAMP '2026-04-03 10:00'),
         ('C10',1,TIMESTAMP '2026-04-03 11:00'),('C10',2,TIMESTAMP '2026-04-03 15:00'),('C10',3,TIMESTAMP '2026-04-04 12:00'),('C10',4,TIMESTAMP '2026-04-05 12:00')
),
steps(step_no, step) AS (VALUES (1, 'submitted'), (2, 'manager_approved'), (3, 'finance_approved'), (4, 'paid')),
per_claim AS (SELECT claim_id, array_agg(step_no ORDER BY step_no) AS steps FROM ev GROUP BY claim_id),
reach AS (
  SELECT s.step_no, s.step,
         COUNT(*) FILTER (WHERE s.step_no = ANY (pc.steps)) AS loose_reached,                                              -- a step-N event exists
         COUNT(*) FILTER (WHERE pc.steps @> (SELECT array_agg(g) FROM generate_series(1, s.step_no) AS g)) AS strict_reached   -- steps 1..N all exist
  FROM steps s
  CROSS JOIN per_claim pc
  GROUP BY s.step_no, s.step
)
SELECT step, loose_reached, strict_reached,
       ROUND(100.0 * strict_reached / FIRST_VALUE(strict_reached) OVER (ORDER BY step_no), 1) AS pct_of_start,
       ROUND(100.0 * strict_reached / LAG(strict_reached) OVER (ORDER BY step_no), 1) AS pct_of_previous
FROM reach
ORDER BY step_no;`,
      note: 'Strict counts are 10, 7, 6 and 5 claims for the four steps (100, 70, 60 and 50 percent of the start; 70.0, 85.7 and 83.3 percent of the previous step). The loose counts are 10, 7, 7 and 6: claim C06 has a finance approval and a payment but no manager approval, so a loose funnel counts it at steps 3 and 4 while the strict funnel stops it at step 1. That difference is the control failure the funnel should expose.',
    } },
    `## Top-N per group, and what to do with ties
*"The two biggest orders of each customer."* The template is a window function with \`PARTITION BY\` the group and \`ORDER BY\` the measure, then a filter on the rank. The decision is **which rank function**, and it matters when values **tie**:

| Function | Ties | If three orders tie at 3,68,000 and you keep rank <= 2 |
|---|---|---|
| \`ROW_NUMBER()\` | none: always 1, 2, 3, ... (ties broken arbitrarily unless you add a tie-breaker) | exactly 2 rows. Which two is not defined without a tie-breaker |
| \`RANK()\` | ties share a rank, then the next rank **skips** (1, 1, 1, 4) | the **3** tied rows (all have rank 1) |
| \`DENSE_RANK()\` | ties share a rank, **no skipping** (1, 1, 1, 2) | the 3 tied rows **and** the next amount (rank 2) |

Ask the interviewer which one is meant: *"top 2 orders"* usually means \`ROW_NUMBER\` with a tie-breaker (add \`order_id\`), *"top 2 amounts, including ties"* means \`RANK\` or \`DENSE_RANK\`.

Another way is **\`LATERAL\`**: for each customer, run a small query that sorts that customer's orders and takes \`LIMIT 2\`. It reads naturally and, with an index on \`(customer_id, amount DESC)\`, it is fast on a big table. Use \`LEFT JOIN LATERAL ... ON true\` to keep customers who have no orders.`,
    { sql: {
      title: 'Top 2 per customer: ROW_NUMBER, RANK, DENSE_RANK, LATERAL, and an unpivot',
      starter: `-- 1) The ranks side by side for customer 2, who has three orders of exactly 3,68,000
SELECT customer_id, order_id, amount,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS row_number_,
       RANK()       OVER (PARTITION BY customer_id ORDER BY amount DESC)           AS rank_,
       DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC)           AS dense_rank_
FROM orders
WHERE customer_id = 2
ORDER BY amount DESC, order_id
LIMIT 6;

-- 2) How many rows each rule keeps per customer (keep rank <= 2)
SELECT customer_id,
       COUNT(*) FILTER (WHERE rn <= 2)  AS with_row_number,
       COUNT(*) FILTER (WHERE rnk <= 2) AS with_rank,
       COUNT(*) FILTER (WHERE dr <= 2)  AS with_dense_rank
FROM (SELECT customer_id,
             ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS rn,
             RANK()       OVER (PARTITION BY customer_id ORDER BY amount DESC)           AS rnk,
             DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC)           AS dr
      FROM orders WHERE amount IS NOT NULL) t
GROUP BY customer_id
ORDER BY customer_id;

-- 3) LATERAL: for each customer, the two biggest orders (ties broken by order_id). Customers without orders stay, with NULLs.
SELECT c.customer_id, t.order_id, t.amount
FROM customers c
LEFT JOIN LATERAL (
  SELECT o.order_id, o.amount FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY o.amount DESC, o.order_id
  LIMIT 2
) t ON true
WHERE c.customer_id IN (1, 2, 11)
ORDER BY c.customer_id, t.amount DESC NULLS LAST;

-- 4) UNPIVOT: a wide table (one column per quarter) turned into rows with LATERAL VALUES
WITH wide AS (
  SELECT channel,
         SUM(amount) FILTER (WHERE order_date <  DATE '2025-07-01')                                      AS q1,
         SUM(amount) FILTER (WHERE order_date >= DATE '2025-07-01' AND order_date < DATE '2025-10-01')  AS q2,
         SUM(amount) FILTER (WHERE order_date >= DATE '2025-10-01' AND order_date < DATE '2026-01-01')  AS q3,
         SUM(amount) FILTER (WHERE order_date >= DATE '2026-01-01')                                      AS q4
  FROM orders GROUP BY channel
)
SELECT w.channel, u.quarter, u.amount
FROM wide w
CROSS JOIN LATERAL (VALUES ('Q1', w.q1), ('Q2', w.q2), ('Q3', w.q3), ('Q4', w.q4)) AS u(quarter, amount)
ORDER BY w.channel, u.quarter;`,
      note: 'Customer 2 has three orders of 368000.00 (orders 74, 174 and 189), then 184000.00, 174800.00 and so on. ROW_NUMBER numbers them 1 to 6 (it needs the order_id tie-breaker to be repeatable), RANK gives 1, 1, 1, 4, 5, 6, and DENSE_RANK gives 1, 1, 1, 2, 3, 4. Keeping rank <= 2 returns 2 rows with ROW_NUMBER, 3 with RANK (the three tied rows) and 4 with DENSE_RANK for customer 2; customer 10 also has ties (2, 4, 4), customer 99 has one order only. The LATERAL query returns exactly two orders for customers 1 and 2 (customer 2: orders 74 and 174) and one row of NULLs for customer 11, who never ordered. The unpivot gives 12 rows: for example Direct has 2000685.00, 1833125.00, 1479300.00 and 1728075.00 in Q1 to Q4.',
    } },
    `## Unpivot, and a map for the interview
**Pivot** (rows to columns) you know from the conditional-aggregation lesson: \`SUM(...) FILTER (WHERE ...)\` per column. **Unpivot** is the reverse, and the tidy PostgreSQL way is \`CROSS JOIN LATERAL (VALUES (label, column), ...)\`, as above. It is how you turn a spreadsheet-shaped table (a column per month) into rows that group, filter and chart properly. (The \`crosstab\` function of the \`tablefunc\` extension does pivots, but \`FILTER\` is portable and clearer.)

**Spot the pattern by the clue words:**

| The question says | Pattern | The template |
|---|---|---|
| "consecutive", "longest streak", "missing numbers", "continuous periods" | **gaps and islands** | day - ROW_NUMBER(), or LAG flag + running SUM |
| "sessions", "inactivity", "burst of activity" | **sessionisation** | LAG gap, flag if first or gap > timeout, running SUM per user |
| "still active after N months", "repeat", "churn" | **cohort retention** | DISTINCT entity-period, MIN as cohort, period difference, divide by cohort size |
| "conversion", "drop-off", "how many reached" | **funnel** | per-entity step set, strict @> test, LAG for the previous step |
| "top N per group", "best of each" | **top-N per group** | ROW_NUMBER/RANK/DENSE_RANK in a subquery, or LATERAL ... LIMIT |
| "columns to rows" / "rows to columns" | **unpivot / pivot** | LATERAL VALUES / FILTER |
| "compare with previous row", "change since last" | **LAG / LEAD** | partition, order, subtract |
| "running total", "moving average" | **window frame** | SUM() OVER (ORDER BY ... ROWS BETWEEN ...) |`,
    `## Practice
Three tasks, one per pattern family, with the data inline or in the Kollana tables: the top two orders with ties, sessions with a timeout, and a strict funnel with conversion and timing.`,
    { challenge: {
      id: 'sql-advanced-patterns-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'For every customer return their **two largest orders, including ties for second place**: use `RANK()` over `amount DESC` and keep rank 1 and 2. Ignore orders with no amount. Return `customer_id, order_id, amount, amount_rank`, sorted by `customer_id`, `amount_rank`, then `order_id`. (24 rows, because a few customers have tied amounts.)',
      starter: `SELECT customer_id, order_id, amount
FROM orders
WHERE amount IS NOT NULL
ORDER BY customer_id, amount DESC`,
      hint: "Wrap RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS amount_rank in a subquery or CTE, then WHERE amount_rank <= 2.",
      solution: `SELECT customer_id, order_id, amount, amount_rank
FROM (
  SELECT customer_id, order_id, amount,
         RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS amount_rank
  FROM orders
  WHERE amount IS NOT NULL
) t
WHERE amount_rank <= 2
ORDER BY customer_id, amount_rank, order_id`,
    } },
    { challenge: {
      id: 'sql-advanced-patterns-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Sessions with a 30-minute timeout. A new session starts at a user\'s first event, or when the pause since their previous event is **more than** 30 minutes (exactly 30 minutes stays in the same session). Return `user_name`, `sessions` (how many) and `longest_session_minutes` (the longest session, from its first to its last event, in whole minutes), sorted by `user_name`. (3 rows.)',
      starter: `WITH ev(user_name, at) AS (
  VALUES ('Priya',   TIMESTAMP '2026-04-02 10:00'), ('Priya',   TIMESTAMP '2026-04-02 10:12'), ('Priya',   TIMESTAMP '2026-04-02 10:25'),
         ('Priya',   TIMESTAMP '2026-04-02 11:10'), ('Priya',   TIMESTAMP '2026-04-02 11:20'),
         ('Karthik', TIMESTAMP '2026-04-02 09:00'), ('Karthik', TIMESTAMP '2026-04-02 09:30'), ('Karthik', TIMESTAMP '2026-04-02 09:31'),
         ('Karthik', TIMESTAMP '2026-04-02 13:00'),
         ('Meera',   TIMESTAMP '2026-04-02 12:00')
)
SELECT user_name, at
FROM ev
ORDER BY user_name, at`,
      hint: "LAG(at) per user gives the previous event; new session when it is NULL or at - previous > INTERVAL '30 minutes'. A running SUM of that flag is the session number. Then GROUP BY user and session for the duration, and GROUP BY user for the count and the maximum.",
      solution: `WITH ev(user_name, at) AS (
  VALUES ('Priya',   TIMESTAMP '2026-04-02 10:00'), ('Priya',   TIMESTAMP '2026-04-02 10:12'), ('Priya',   TIMESTAMP '2026-04-02 10:25'),
         ('Priya',   TIMESTAMP '2026-04-02 11:10'), ('Priya',   TIMESTAMP '2026-04-02 11:20'),
         ('Karthik', TIMESTAMP '2026-04-02 09:00'), ('Karthik', TIMESTAMP '2026-04-02 09:30'), ('Karthik', TIMESTAMP '2026-04-02 09:31'),
         ('Karthik', TIMESTAMP '2026-04-02 13:00'),
         ('Meera',   TIMESTAMP '2026-04-02 12:00')
),
flagged AS (
  SELECT user_name, at,
         CASE WHEN LAG(at) OVER (PARTITION BY user_name ORDER BY at) IS NULL
                OR at - LAG(at) OVER (PARTITION BY user_name ORDER BY at) > INTERVAL '30 minutes' THEN 1 ELSE 0 END AS new_session
  FROM ev
),
numbered AS (
  SELECT user_name, at, SUM(new_session) OVER (PARTITION BY user_name ORDER BY at) AS session_no
  FROM flagged
),
sessions AS (
  SELECT user_name, session_no, ROUND(EXTRACT(EPOCH FROM MAX(at) - MIN(at)) / 60) AS minutes
  FROM numbered
  GROUP BY user_name, session_no
)
SELECT user_name, COUNT(*) AS sessions, MAX(minutes) AS longest_session_minutes
FROM sessions
GROUP BY user_name
ORDER BY user_name`,
    } },
    { challenge: {
      id: 'sql-advanced-patterns-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'A strict funnel with timing. Twelve expense claims go through step 1 (submitted), 2 (manager approved), 3 (finance approved) and 4 (paid). A claim counts at step N only if it has events for **all** steps 1 to N. Return, for each step: `step_no`, `claims_reached` (strict), `pct_of_previous` (`claims_reached` divided by the previous step\'s, in percent with 1 decimal; NULL for step 1) and `avg_hours_from_previous` (the average hours between the claim\'s step N-1 event and its step N event, over the claims that strictly reached step N; 1 decimal; NULL for step 1). Sort by `step_no`. (4 rows.)',
      starter: `WITH ev(claim_id, step_no, at) AS (
  VALUES ('K01',1,TIMESTAMP '2026-04-01 09:00'),('K01',2,TIMESTAMP '2026-04-01 17:00'),('K01',3,TIMESTAMP '2026-04-02 17:00'),('K01',4,TIMESTAMP '2026-04-04 17:00'),
         ('K02',1,TIMESTAMP '2026-04-01 10:00'),('K02',2,TIMESTAMP '2026-04-02 10:00'),('K02',3,TIMESTAMP '2026-04-03 10:00'),('K02',4,TIMESTAMP '2026-04-04 10:00'),
         ('K03',1,TIMESTAMP '2026-04-01 11:00'),('K03',2,TIMESTAMP '2026-04-01 13:00'),('K03',3,TIMESTAMP '2026-04-02 13:00'),
         ('K04',1,TIMESTAMP '2026-04-02 09:00'),
         ('K05',1,TIMESTAMP '2026-04-02 10:00'),('K05',2,TIMESTAMP '2026-04-03 10:00'),('K05',3,TIMESTAMP '2026-04-04 10:00'),('K05',4,TIMESTAMP '2026-04-05 10:00'),
         ('K06',1,TIMESTAMP '2026-04-02 11:00'),('K06',3,TIMESTAMP '2026-04-03 11:00'),('K06',4,TIMESTAMP '2026-04-04 11:00'),
         ('K07',1,TIMESTAMP '2026-04-02 12:00'),('K07',2,TIMESTAMP '2026-04-02 18:00'),
         ('K08',1,TIMESTAMP '2026-04-03 09:00'),('K08',2,TIMESTAMP '2026-04-03 12:00'),('K08',3,TIMESTAMP '2026-04-04 12:00'),('K08',4,TIMESTAMP '2026-04-06 12:00'),
         ('K09',1,TIMESTAMP '2026-04-03 10:00'),
         ('K10',1,TIMESTAMP '2026-04-03 11:00'),('K10',2,TIMESTAMP '2026-04-04 11:00'),('K10',3,TIMESTAMP '2026-04-05 11:00'),
         ('K11',1,TIMESTAMP '2026-04-03 12:00'),('K11',2,TIMESTAMP '2026-04-03 14:00'),('K11',3,TIMESTAMP '2026-04-03 20:00'),('K11',4,TIMESTAMP '2026-04-04 20:00'),
         ('K12',1,TIMESTAMP '2026-04-04 09:00')
)
SELECT claim_id, step_no, at
FROM ev
ORDER BY claim_id, step_no`,
      hint: "Pivot each claim to one row: MAX(at) FILTER (WHERE step_no = 1) AS t1, and so on up to t4. Then CROSS JOIN LATERAL (VALUES (1, t1 IS NOT NULL, NULL), (2, t1 IS NOT NULL AND t2 IS NOT NULL, hours t2 - t1), (3, ... t3 - t2), (4, ... t4 - t3)) to get one row per claim and step. Aggregate with COUNT(*) FILTER (WHERE reached) and AVG(hours) FILTER (WHERE reached), and use LAG for pct_of_previous.",
      solution: `WITH ev(claim_id, step_no, at) AS (
  VALUES ('K01',1,TIMESTAMP '2026-04-01 09:00'),('K01',2,TIMESTAMP '2026-04-01 17:00'),('K01',3,TIMESTAMP '2026-04-02 17:00'),('K01',4,TIMESTAMP '2026-04-04 17:00'),
         ('K02',1,TIMESTAMP '2026-04-01 10:00'),('K02',2,TIMESTAMP '2026-04-02 10:00'),('K02',3,TIMESTAMP '2026-04-03 10:00'),('K02',4,TIMESTAMP '2026-04-04 10:00'),
         ('K03',1,TIMESTAMP '2026-04-01 11:00'),('K03',2,TIMESTAMP '2026-04-01 13:00'),('K03',3,TIMESTAMP '2026-04-02 13:00'),
         ('K04',1,TIMESTAMP '2026-04-02 09:00'),
         ('K05',1,TIMESTAMP '2026-04-02 10:00'),('K05',2,TIMESTAMP '2026-04-03 10:00'),('K05',3,TIMESTAMP '2026-04-04 10:00'),('K05',4,TIMESTAMP '2026-04-05 10:00'),
         ('K06',1,TIMESTAMP '2026-04-02 11:00'),('K06',3,TIMESTAMP '2026-04-03 11:00'),('K06',4,TIMESTAMP '2026-04-04 11:00'),
         ('K07',1,TIMESTAMP '2026-04-02 12:00'),('K07',2,TIMESTAMP '2026-04-02 18:00'),
         ('K08',1,TIMESTAMP '2026-04-03 09:00'),('K08',2,TIMESTAMP '2026-04-03 12:00'),('K08',3,TIMESTAMP '2026-04-04 12:00'),('K08',4,TIMESTAMP '2026-04-06 12:00'),
         ('K09',1,TIMESTAMP '2026-04-03 10:00'),
         ('K10',1,TIMESTAMP '2026-04-03 11:00'),('K10',2,TIMESTAMP '2026-04-04 11:00'),('K10',3,TIMESTAMP '2026-04-05 11:00'),
         ('K11',1,TIMESTAMP '2026-04-03 12:00'),('K11',2,TIMESTAMP '2026-04-03 14:00'),('K11',3,TIMESTAMP '2026-04-03 20:00'),('K11',4,TIMESTAMP '2026-04-04 20:00'),
         ('K12',1,TIMESTAMP '2026-04-04 09:00')
),
pivoted AS (
  SELECT claim_id,
         MAX(at) FILTER (WHERE step_no = 1) AS t1, MAX(at) FILTER (WHERE step_no = 2) AS t2,
         MAX(at) FILTER (WHERE step_no = 3) AS t3, MAX(at) FILTER (WHERE step_no = 4) AS t4
  FROM ev GROUP BY claim_id
),
per_step AS (
  SELECT v.step_no, v.reached, v.hours
  FROM pivoted p
  CROSS JOIN LATERAL (VALUES
    (1, p.t1 IS NOT NULL, NULL::numeric),
    (2, p.t1 IS NOT NULL AND p.t2 IS NOT NULL, EXTRACT(EPOCH FROM p.t2 - p.t1) / 3600),
    (3, p.t1 IS NOT NULL AND p.t2 IS NOT NULL AND p.t3 IS NOT NULL, EXTRACT(EPOCH FROM p.t3 - p.t2) / 3600),
    (4, p.t1 IS NOT NULL AND p.t2 IS NOT NULL AND p.t3 IS NOT NULL AND p.t4 IS NOT NULL, EXTRACT(EPOCH FROM p.t4 - p.t3) / 3600)
  ) AS v(step_no, reached, hours)
),
agg AS (
  SELECT step_no, COUNT(*) FILTER (WHERE reached) AS claims_reached, AVG(hours) FILTER (WHERE reached) AS avg_hours
  FROM per_step GROUP BY step_no
)
SELECT step_no, claims_reached,
       ROUND(100.0 * claims_reached / LAG(claims_reached) OVER (ORDER BY step_no), 1) AS pct_of_previous,
       ROUND(avg_hours, 1) AS avg_hours_from_previous
FROM agg
ORDER BY step_no`,
    } },
    { real: 'These patterns turn up in finance as **control reports**, not just interview puzzles. *Islands* find the longest period a reconciliation was **not** done, or the consecutive months a cost centre overspent. *Sessions* group the bursts of manual journals posted by one user, which is a classic fraud and segregation-of-duties check. *Cohorts* show whether customers or vendors acquired in one quarter still transact later. A *strict funnel* of the approval workflow is an audit test: it finds invoices paid without approval. When a stakeholder asks for one of these, say the pattern name and the definition you will use (the timeout, "consecutive" meaning, strict or loose, ties kept or dropped) **before** you write the query, and put the definition in the report footnote.' },
    { interview: '"Find the longest streak of consecutive days on which a user logged in." Model answer: "First I take the distinct login days per user, so several logins on one day count once. Then I number the days with ROW_NUMBER over the user ordered by day. For consecutive days the date minus the row number is constant, and it changes when there is a gap, so I group by user and that difference and take COUNT(*), MIN(day) and MAX(day) for each island. The longest streak is the biggest count, and I add a tie-breaker so the result is repeatable. If \'consecutive\' allowed a one-day gap, or the data were timestamps, I would use LAG to flag a new island when the gap exceeds the limit and number the islands with a running SUM." Follow-up: "What would you do with ties at the longest length?" (ask whether to return all of them: RANK over the lengths, or DENSE_RANK; or break the tie by the most recent streak).' },
    `## Recap
- Interview patterns are **templates** recognised by clue words. State the **definition** you assume (timeout, consecutive, strict, ties) before you write the query.
- **Gaps and islands**: distinct days, \`day - ROW_NUMBER()\` is constant inside an island (group by it); or flag starts with \`LAG\` and number islands with a running \`SUM\`. Gaps: \`LEAD\` and \`next - day > 1\`. A running streak is \`ROW_NUMBER() OVER (PARTITION BY island ORDER BY day)\`.
- **Sessionisation**: gap to the previous event with \`LAG\`, flag the first event or a gap above the timeout, a running \`SUM\` per user numbers the sessions. Decide the boundary (> or >=) and what a one-event session lasts.
- **Cohort retention**: DISTINCT entity-period, cohort = MIN period, periods later = difference, divide by the cohort size. Retention can rise again.
- **Funnel**: collect each entity's steps; **strict** (all earlier steps present, test with \`@>\`) against **loose**; conversion = reached / previous reached. The difference exposes control failures.
- **Top-N per group**: \`ROW_NUMBER\` (plus a tie-breaker) gives exactly N; \`RANK\` keeps ties and skips; \`DENSE_RANK\` keeps ties and does not skip. \`LEFT JOIN LATERAL ... LIMIT N\` is the other way.
- **Unpivot** with \`CROSS JOIN LATERAL (VALUES (...), (...))\`. **Pivot** with \`FILTER\`.`,
  ],
  quiz: [
    { q: 'For consecutive days, which expression stays constant inside one island of the distinct days?', o: ['The day plus the row number', 'The day minus ROW_NUMBER() over the days in date order', 'The day divided by the row number', 'The row number alone'], a: 1, why: 'Inside an island both the date and the row number go up by one each step, so their difference is constant. A gap makes the date jump, so the difference changes and labels the next island.' },
    { q: 'In sessionisation with LAG, when does an event start a new session?', o: ['When it is the user\'s first event, or the gap since the previous event is more than the timeout', 'Only when it is the user\'s first event', 'When the event type changes', 'When the gap is exactly zero'], a: 0, why: 'The flag is 1 for the first event and for a gap beyond the timeout. A running SUM of the flags per user then numbers the sessions.' },
    { q: 'Three orders tie for the largest amount of a customer. You keep `rank <= 2`. How many of that customer\'s rows does each function return?', o: ['ROW_NUMBER 3, RANK 2, DENSE_RANK 2', 'ROW_NUMBER 2, RANK 2, DENSE_RANK 2', 'ROW_NUMBER 2, RANK 3, DENSE_RANK 4 (the three ties plus the next amount)', 'All three return 3'], a: 2, why: 'ROW_NUMBER numbers each row separately, so 2 rows. RANK gives the three ties rank 1 and the next row rank 4, so 3 rows. DENSE_RANK gives the ties rank 1 and the next amount rank 2, so 3 + 1 = 4 rows.' },
    { q: 'A claim has a finance approval and a payment but no manager approval. How do a loose and a strict funnel treat it?', o: ['Both count it at every step', 'Neither counts it', 'A loose funnel counts it at steps 3 and 4. A strict funnel counts it only at step 1, which exposes the missing approval', 'A strict funnel counts it at every step'], a: 2, why: 'Strict means all earlier steps must exist. The array test steps @> {1,2,3} fails for this claim, so the control failure shows up as a gap between the loose and strict numbers.' },
    { q: 'What does retention of 42.9% for month 2 of a cohort of 7 customers mean?', o: ['3 of the 7 customers ordered in that month', '43 customers ordered', '42.9% of orders were returned', 'The cohort lost 42.9% of its customers for good'], a: 0, why: 'Retention is active customers in that period divided by the cohort size: 3/7 = 42.9%. It is not a permanent loss: in the lesson the same cohort is back to 100% in month 3.' },
    { q: 'What does `LEFT JOIN LATERAL (SELECT ... ORDER BY amount DESC LIMIT 2) t ON true` give you over a plain join?', o: ['The two largest orders per customer, with customers that have no orders kept (as NULLs)', 'The two smallest orders per customer', 'All orders of every customer', 'An error, because LIMIT is not allowed in a subquery'], a: 0, why: 'A LATERAL subquery can refer to the current customer row, so each customer gets its own top-2. The LEFT JOIN with ON true keeps customers whose subquery returns no rows.' },
  ],
  task: {
    title: 'Six patterns on the Kollana data',
    steps: [
      'Create `34_patterns.sql` in `C:\\sql-practice`. For `orders`, find the islands of consecutive order days with both methods (day minus row number, and `LAG` plus running `SUM`). Show the longest island and the longest gap, and check that the two methods agree.',
      'Sessionise the event list from the lesson with a 30-minute timeout. Then change the rule to "30 minutes or more" and describe which user\'s sessions change.',
      'Build the monthly retention of the April cohort, then repeat for the May, June and July cohorts. Add a column that shows the first month in which retention fell below 50%.',
      'Run the strict and loose funnels. Add a query that lists the claims that appear in the loose but not the strict count (the control failures) with their step lists.',
      'List each customer\'s two biggest orders three ways (ROW_NUMBER with `order_id` as tie-breaker, RANK, `LEFT JOIN LATERAL`). Write which customers get a different number of rows and why.',
      'Unpivot the channel by quarter table, then pivot it back with `FILTER` and confirm you get the original numbers. Write the clue words of each pattern in a comment, with one finance example for each.',
    ],
    deliverable: '`34_patterns.sql` with the queries and, in comments, the longest island and gap, the session counts under both timeout rules, the cohort tables, the loose-against-strict claims, the tie differences, and the clue-word cheat sheet.',
  },
};
