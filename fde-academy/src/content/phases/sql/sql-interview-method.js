export default {
  id: 'sql-interview-method',
  title: 'The SQL interview method: approach, explain out loud, practise, and three timed problems',
  goal: 'You have a repeatable seven-step method for any SQL problem, you can narrate your thinking, you know the classic traps and how to test for them, you have a practice routine that fits you, and you have solved three interview-style problems from a vague question to a checked answer.',
  roadmap: [
    'A repeatable approach to SQL problems',
    'Explaining out loud',
    'A practice routine',
    'Three timed interview problems',
  ],
  blocks: [
    `## The problem
You now know a lot of SQL: joins, window functions, dates, text, JSON, transactions, indexes, plans, SCD, data quality. You can still fail a SQL interview. Not because you lack a feature, but because of **how** you go about the problem:

- You hear the question and **start typing** before you know what one output row means.
- You work in **silence**, so the interviewer cannot tell whether you are stuck or thinking.
- Your query runs but **quietly ignores** NULLs, ties, duplicates from a join, or the last day of the month.
- You never **test** it, so a small mistake survives.
- When asked *"how would you make it faster?"* you freeze.

All of these are habits, and habits can be trained. This lesson gives you a **method** (a fixed order of steps), the **words to say** at each step, the **traps** to check before you say "done", a **practice routine**, and three interview-style problems to practise on. The same method works with a stakeholder who sends you a vague request in a chat message, which is most of the real job.`,
    `## The method: seven steps
Do these in order, every time, even for an easy problem. The order is the point: it keeps you calm and it shows the interviewer how you think.

1. **Restate the question** in your own words, and name the output: *"So I need one row per customer, with the order that first took their spend past ten lakh. Is that right?"*
2. **Clarify the data.** Ask or state: which tables, what is the **grain** (one row per what?), the keys, whether columns can be \`NULL\`, whether there can be **duplicates** or **ties**, the date type, the time zone, which SQL dialect.
3. **Work an example by hand.** Write three to five sample rows and the answer you expect. This is your test case for later.
4. **Plan in plain words.** Name the tables, the joins, the filters, the grouping, the window. Name the **pattern** (anti-join, top-N per group, running total, gaps and islands, funnel).
5. **Write in small steps.** Build it as CTEs, one idea each, and check each against your example. Name things clearly.
6. **Test the edges.** Empty input, \`NULL\`s, ties, duplicates, a customer with no orders, the boundary dates. Say what you checked.
7. **Discuss.** State your assumptions, the complexity, how you would speed it up (an index, a rewrite, pre-aggregation), what changes in another dialect, and how you would turn it into a reliable job.`,
    { sketch: { w: 760, h: 296, caption: 'The seven steps. Step 6 can send you back to step 5: that loop is normal, and saying it aloud shows you test your own work.', items: [
      { t: 'box', x: 8, y: 20, w: 170, h: 58, label: '1  Restate', sub: 'name the output row', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 180, y1: 49, x2: 200, y2: 49 },
      { t: 'box', x: 202, y: 20, w: 170, h: 58, label: '2  Clarify data', sub: 'grain, keys, NULLs', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 374, y1: 49, x2: 394, y2: 49 },
      { t: 'box', x: 396, y: 20, w: 170, h: 58, label: '3  Example', sub: 'by hand, 3 to 5 rows', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 568, y1: 49, x2: 588, y2: 49 },
      { t: 'box', x: 590, y: 20, w: 162, h: 58, label: '4  Plan', sub: 'name the pattern', fill: 'green', size: 16 },
      { t: 'arrow', x1: 670, y1: 80, x2: 670, y2: 118 },
      { t: 'box', x: 590, y: 120, w: 162, h: 58, label: '5  Write', sub: 'small CTEs', fill: 'green', size: 16 },
      { t: 'arrow', x1: 588, y1: 149, x2: 568, y2: 149 },
      { t: 'box', x: 396, y: 120, w: 170, h: 58, label: '6  Test edges', sub: 'NULL, ties, dupes', fill: 'orange', size: 16 },
      { t: 'arrow', x1: 394, y1: 149, x2: 374, y2: 149 },
      { t: 'box', x: 202, y: 120, w: 170, h: 58, label: '7  Discuss', sub: 'speed, dialect, jobs', fill: 'yellow', size: 16 },
      { t: 'note', x: 8, y: 120, w: 182, h: 58, fill: 'pink', size: 13, text: 'Stuck? Shrink the problem:\nsolve it for ONE customer first.' },
      { t: 'note', x: 8, y: 204, w: 744, h: 78, fill: 'yellow', size: 14, text: 'Say each step aloud as you do it:\n"I am going to check ties now: if two orders have the same amount, which one do we want?"\nThe interviewer hears a process, not a guess. A clear process beats a lucky answer.' },
    ] } },
    `## A worked example, narrated
**Question:** *"Show the second highest order amount in each sales channel."*

Here is the whole method as speech, the way you would say it:

> **1. Restate.** "So the output is one row per channel with the second highest amount. Do you want the second highest **order**, or the second highest **distinct amount**? They differ if two orders tie for the top."
>
> **2. Clarify.** "I will use the \`orders\` table: one row per order, with \`channel\` and \`amount\`. The amount has no NULLs in this data, but I will filter NULLs out anyway. I will assume *second highest distinct amount*, because otherwise a tie for first would make the second row show the same amount twice."
>
> **3. Example.** "For a channel with amounts 100, 100, 80, 60 the answer is 80, not 100."
>
> **4. Plan.** "This is a ranking per group, so a window function. I need ties to share a rank and no gaps, so \`DENSE_RANK\` over distinct amounts, partitioned by channel, ordered by amount descending. Then I keep rank 2."
>
> **5. Write.** "First a CTE of distinct channel and amount pairs, then the ranking, then the filter."
>
> **6. Test.** "A channel with only one distinct amount would return **no row**, not NULL. Should that channel appear with NULL? I will mention it."
>
> **7. Discuss.** "On a big table an index on (channel, amount DESC) would let the planner read the top of each channel. In SQL Server I would write the same with DENSE_RANK; there is no change."`,
    { sketch: { w: 760, h: 292, caption: 'Step 3 on paper: a tiny input and the answer you expect. It becomes your test case.', items: [
      { t: 'table', x: 14, y: 40, title: 'one channel', cols: ['order_id', 'amount'], colW: [90, 110], rows: [['1', '100'], ['2', '100'], ['3', '80'], ['4', '60']], rowH: 28 },
      { t: 'table', x: 270, y: 40, title: 'distinct amounts, ranked', cols: ['amount', 'rank'], colW: [110, 90], rows: [['100', '1'], ['80', '2'], ['60', '3']], rowH: 28, hl: [1] },
      { t: 'note', x: 500, y: 40, w: 250, h: 112, fill: 'green', size: 14, text: 'Expected answer: 80.\nRANK or ROW_NUMBER on ALL rows\nwould give 100 for "second"\nbecause of the tie. DENSE_RANK on\ndistinct amounts gives 80.' },
      { t: 'note', x: 14, y: 200, w: 736, h: 80, fill: 'yellow', size: 14, text: 'Write the example BEFORE the query. When the query returns something different from the example,\nyou know at once which of the two is wrong, and you can explain why.' },
    ] } },
    { sql: {
      title: 'The worked example: second highest distinct amount per channel',
      starter: `-- 5) Write in small steps. Step A: the distinct (channel, amount) pairs. NULL amounts are filtered out.
-- Step B: rank the distinct amounts inside each channel, highest first. Ties cannot exist among DISTINCT amounts, but DENSE_RANK keeps the idea clear.
-- Step C: keep rank 2.
WITH pairs AS (
  SELECT DISTINCT channel, amount
  FROM orders
  WHERE amount IS NOT NULL
),
ranked AS (
  SELECT channel, amount, DENSE_RANK() OVER (PARTITION BY channel ORDER BY amount DESC) AS amount_rank
  FROM pairs
)
SELECT channel, amount AS second_highest_amount
FROM ranked
WHERE amount_rank = 2
ORDER BY channel;

-- 6) Test the edge: does the top amount have ties? (If it does, the "second order" and the "second distinct amount" differ.)
SELECT channel, MAX(amount) AS top_amount, COUNT(*) FILTER (WHERE amount = (SELECT MAX(o2.amount) FROM orders o2 WHERE o2.channel = o.channel)) AS orders_at_the_top
FROM orders o
GROUP BY channel
ORDER BY channel;

-- 7) An alternative that is easy to explain: OFFSET 1 after sorting the distinct amounts of ONE channel
SELECT DISTINCT amount FROM orders WHERE channel = 'Online' AND amount IS NOT NULL ORDER BY amount DESC OFFSET 1 LIMIT 1;`,
      note: 'The second highest distinct amounts are 331200.00 for Direct, 349600.00 for Online and 276000.00 for Partner. The edge test shows why the clarifying question mattered: every channel has an order of 368000.00 at the top, and in Direct and Online several orders share it (the third column shows 3 and 4 orders at the top), so ranking all orders and taking rank 2 would return 368000.00 again, a wrong answer to the question as it was understood. The OFFSET version gives the same 349600.00 for Online, and is a good one to mention as an alternative for a single group.',
    } },
    `## Question families and where you learned them
Almost every interview question belongs to a family. Recognising the family is half the solution.

| Family | Typical wording | Pattern | Lesson |
|---|---|---|---|
| Missing or extra rows | "customers with no orders", "orders without a customer" | anti-join (\`NOT EXISTS\`), outer joins | joins, subqueries |
| Aggregation with a filter | "departments with more than 3 people" | \`GROUP BY\` ... \`HAVING\`, conditional aggregation | aggregates, conditional aggregation |
| Ranking | "second highest", "top 3 per group" | \`ROW_NUMBER\`, \`RANK\`, \`DENSE_RANK\` | window ranking, interview patterns |
| Running and comparing | "running total", "change since last month" | \`SUM() OVER\`, \`LAG\`, \`LEAD\` | window analytics |
| Duplicates | "find and remove duplicates" | \`GROUP BY ... HAVING\`, \`ROW_NUMBER\` | data quality, set operations |
| Sequences | "longest streak", "sessions" | gaps and islands | interview patterns |
| Time | "this fiscal year", "last 30 days", "by month" | \`DATE_TRUNC\`, half-open ranges, fiscal arithmetic | dates |
| Hierarchies | "employees and managers", "all reports of a manager" | self-join, recursive CTE | joins, CTEs |
| Cohorts and funnels | "retention", "conversion" | first event, period difference, strict steps | interview patterns |
| Change over time | "history of a customer's city" | SCD Type 2, effective dates | modelling, SCD Type 2 |
| Changing data | "update without losing data", "two users at once" | transactions, upserts, locks | DML, transactions, locks |
| Speed | "this query is slow, what do you do" | \`EXPLAIN\`, indexes, statistics, sargable filters | performance, plans, partitioning |

Questions about **design** come too: *"design a table for ... "* (keys, types, constraints, normal forms), *"how would you load only new rows"* (watermarks), *"how do you check the data is right"* (quality rules, reconciliation). Those are the lessons you have just finished.`,
    `## The traps: check these before you say "done"
Most wrong answers fail in the same ten places. Run through this list at step 6. The playground after it shows six of them with real numbers.`,
    { checklist: [
      'Grain: do I know what one row of my result means? Did a join multiply rows (a fan-out) and inflate a SUM?',
      'NULLs: COUNT(*) against COUNT(column); NULL in a comparison or in NOT IN; NULL in concatenation; NULL in an average.',
      'Joins: did a WHERE on the right table of a LEFT JOIN turn it into an INNER JOIN? Should the condition be in ON?',
      'Ties: ROW_NUMBER, RANK or DENSE_RANK? What should happen when two rows are equal?',
      'Duplicates: is DISTINCT hiding a bug (a join that returns a row twice) instead of fixing it?',
      'Dates: inclusive or exclusive ends? BETWEEN on timestamps loses the last day. Which time zone?',
      'Division: integer division, division by zero (NULLIF), average of ratios against ratio of sums.',
      'Ordering: a result without ORDER BY has no order. Is "top" defined by a sort with a tie-breaker?',
      'Empty cases: a group with no rows, a customer with no orders, an empty table. Do they appear, and should they?',
      'Dialect and performance: is a function engine-specific? Would this scan the whole table, and does an index or a rewrite help?',
    ] },
    { sql: {
      title: 'Spot the bug: six wrong queries and their fixes',
      starter: `-- BUG 1: a WHERE on the right-hand table of a LEFT JOIN turns it into an INNER JOIN
SELECT 'bug: WHERE after LEFT JOIN' AS version, COUNT(*) AS customers_listed
FROM (SELECT c.customer_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
      WHERE o.status = 'Delivered' GROUP BY c.customer_id) x
UNION ALL
SELECT 'fix: the condition in ON', COUNT(*)
FROM (SELECT c.customer_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'Delivered'
      GROUP BY c.customer_id) x;

-- BUG 2: COUNT(*) counts rows, COUNT(column) skips NULLs
SELECT COUNT(*) AS count_star, COUNT(status) AS count_status, COUNT(*) - COUNT(status) AS orders_without_status FROM orders;

-- BUG 3: NOT IN with a NULL in the list returns nothing. "Employees who are not anybody's manager":
SELECT (SELECT COUNT(*) FROM employees e WHERE e.emp_id NOT IN (SELECT manager_id FROM employees)) AS wrong_with_not_in,
       (SELECT COUNT(*) FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.emp_id)) AS right_with_not_exists;

-- BUG 4: a join that fans out inflates a SUM. Total annual CTC, joined to payroll (2 rows per employee)
SELECT 'bug: joined to payroll' AS version, SUM(e.annual_ctc) AS total_ctc FROM employees e JOIN payroll p ON p.emp_id = e.emp_id
UNION ALL
SELECT 'fix: no fan-out', SUM(annual_ctc) FROM employees;

-- BUG 5: BETWEEN on timestamps loses everything after midnight of the last day
WITH ev(id, at) AS (VALUES (1, TIMESTAMP '2026-03-10 09:00'), (2, TIMESTAMP '2026-03-31 00:00'), (3, TIMESTAMP '2026-03-31 11:30'),
                           (4, TIMESTAMP '2026-03-31 17:45'), (5, TIMESTAMP '2026-04-01 08:00'))
SELECT (SELECT COUNT(*) FROM ev WHERE at BETWEEN '2026-03-01' AND '2026-03-31')        AS between_bug,
       (SELECT COUNT(*) FROM ev WHERE at >= '2026-03-01' AND at < '2026-04-01')        AS half_open_fix;

-- BUG 6: the average of ratios is not the ratio of sums. Average price per unit:
SELECT ROUND(AVG(amount / qty), 2) AS average_of_ratios, ROUND(SUM(amount) / SUM(qty), 2) AS ratio_of_sums FROM orders;`,
      note: 'Bug 1: the buggy query lists 10 customers (the two who never ordered, customers 11 and 12, disappear) and the fix lists all 12. Bug 2: COUNT(*) is 220 and COUNT(status) is 211, so 9 orders have no status. Bug 3: NOT IN returns 0 because manager_id contains a NULL (the top boss), while NOT EXISTS correctly finds 15 employees who manage nobody. Bug 4: the join to payroll doubles every salary, 77800000.00 against the correct 38900000.00. Bug 5: BETWEEN with the date 2026-03-31 means midnight, so it counts only 2 of the 4 events of March (it loses the 11:30 and 17:45 events of the 31st); the half-open range counts 4. Bug 6: the average of the per-order unit prices is 23764.07 but the ratio of the totals is 16113.88: which one is right depends on the question, so say which one you mean.',
    } },
    `## Explaining out loud
In a live interview the interviewer wants to **follow your reasoning**. A few habits help:

- **Narrate before you type.** *"I will start with a CTE that gets one row per customer, then add the window."* Short sentences, in the order of the method.
- **Name your assumptions.** *"I assume the amount column has no NULLs. If it can, I will filter them."* A stated assumption is never a mistake. A silent one can be.
- **Check a CTE before you build on it.** Run it, look at five rows, say what you see.
- **When you are stuck, shrink the problem.** Solve it for **one** customer or **one** month. Then generalise with \`GROUP BY\` or \`PARTITION BY\`. Or write the **slow, obvious** version first (a correlated subquery) and say *"this works, and I would then rewrite it with a window function"*.
- **If you make a mistake, say so calmly and fix it.** *"That would double count, because of the join. Let me aggregate first."* Catching your own bug is a strength.
- **Do not guess a function.** If you forget a name, say what you want (*"the function that truncates a date to the month"*) and write what you remember. Interviewers care about the idea.
- **Ask the dialect.** If it is not PostgreSQL, say which functions you will adapt, using the last lesson.

**When they ask "how would you make it faster?"**, answer in the order of the performance lessons: *measure first* with \`EXPLAIN (ANALYZE, BUFFERS)\`; look for a **Seq Scan that discards most rows** (an index, or a sargable rewrite); compare the planner's **estimated and actual rows** (statistics, \`ANALYZE\`); look for a **fan-out** or a **sort that spills**; and consider **pre-aggregating** or **partitioning** a huge table. Then say what it would cost on writes.`,
    `## A practice routine that suits you
Practising SQL is not "do many problems". It is "**learn from each one**". A routine that works, and that you can fit around your own life, has four parts:

1. **Choose by pattern, not by count.** Pick the pattern you are weakest at (the family table above). Do problems of that pattern until the template feels automatic, then move on.
2. **Three passes on each problem.** *Understand*: restate it and write the example by hand. *Solve*: the seven steps, narrated aloud. *Improve*: after the answer works, ask "how would I speed it up, and what changes in another dialect?"
3. **Keep a mistake log.** Every wrong answer is data. Write the problem, the pattern, **what you got wrong**, and the fix. Read the log before your next session. The same three or four mistakes cause most of your errors, and a log makes them visible.
4. **Come back to it.** Redo problems you got wrong after you have worked on other things, so you are recalling the method, not remembering the answer. Re-solve the three timed problems below from scratch whenever you feel rusty.

Practise **without autocomplete** sometimes, in a plain text box, because many interview editors do not complete anything. And practise **aloud**, with a friend, a recording, or just to the wall: speaking is a separate skill, and it is the one most people have never trained.`,
    { sketch: { w: 760, h: 270, caption: 'A mistake log. Three columns do most of the work: the pattern, what went wrong, and the one-line fix.', items: [
      { t: 'table', x: 14, y: 40, title: 'mistake log', cols: ['problem', 'pattern', 'what went wrong', 'the fix'], colW: [205, 110, 205, 215], rows: [['customers with no orders', 'anti-join', 'WHERE after LEFT JOIN', 'condition in ON'], ['second highest amount', 'ranking', 'ties at the top', 'DENSE_RANK on distinct'], ['revenue per month', 'dates', 'BETWEEN lost last day', 'half-open range'], ['total CTC by department', 'aggregation', 'join doubled the rows', 'aggregate first, then join']], rowH: 30, hl: [1] },
      { t: 'note', x: 14, y: 200, w: 732, h: 58, fill: 'yellow', size: 14, text: 'Read the log before you start. After a while you will see that the same few mistakes repeat:\nthat is your personal checklist, and it is worth more than any list in a book.' },
    ] } },
    `## Three interview-style problems
Now the practice. Each problem is worded the way an interviewer would say it, with the columns to return spelled out so it can be checked. **Use the method:** restate, clarify, write a small example, plan, write in steps, test. Time yourself (a phone timer is enough), and write down how long each took and what you got wrong. There is no target: your own times going down is the point. The data is the Kollana database you know.`,
    { challenge: {
      id: 'sql-interview-method-ch1',
      level: 'medium',
      ordered: true,
      prompt: 'Employees who earn **more than their manager**. Using `employees` (`manager_id` points to the manager\'s `emp_id`, `annual_ctc` is the yearly cost), return `emp_name`, `annual_ctc`, `manager_name` and `manager_ctc` for every employee whose `annual_ctc` is greater than their manager\'s. The top boss has no manager and cannot appear. Sort by `emp_name`. (5 rows. Pattern: self-join.)',
      starter: `-- Restate: one row per employee who earns more than their manager.
-- Clarify: employees has emp_id, emp_name, manager_id, annual_ctc. manager_id is NULL for the boss.
-- Example: employee A (ctc 30), manager B (ctc 20) -> A appears. Employee C (ctc 10), manager B -> does not.
SELECT emp_name, annual_ctc
FROM employees
ORDER BY emp_name`,
      hint: "Join employees to itself: employees e JOIN employees m ON m.emp_id = e.manager_id. Then filter e.annual_ctc > m.annual_ctc. An inner join already removes the boss, whose manager_id is NULL.",
      solution: `SELECT e.emp_name, e.annual_ctc, m.emp_name AS manager_name, m.annual_ctc AS manager_ctc
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.annual_ctc > m.annual_ctc
ORDER BY e.emp_name`,
    } },
    { challenge: {
      id: 'sql-interview-method-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Monthly revenue and **month-over-month change**. From `orders`, for each calendar month return `month` (as text `YYYY-MM`), `revenue` (sum of `amount`), `prev_revenue` (the previous month\'s revenue, NULL for the first month) and `mom_pct` (the change from the previous month in percent, one decimal, NULL for the first month; guard against division by zero). Sort by `month`. (12 rows. Pattern: aggregate, then `LAG`.)',
      starter: `-- Restate: one row per month, with revenue and the percentage change on the month before.
-- Clarify: month = calendar month of order_date. The first month has no previous month, so its change is NULL.
-- Example: Apr 100, May 150, Jun 120 -> May +50.0, Jun -20.0.
SELECT order_date, amount
FROM orders
ORDER BY order_date`,
      hint: "Aggregate to one row per month first (DATE_TRUNC in a CTE), then use LAG(revenue) OVER (ORDER BY month) in the outer query. mom_pct = 100.0 * (revenue - prev) / NULLIF(prev, 0). Format the month with TO_CHAR(month, 'YYYY-MM').",
      solution: `WITH m AS (
  SELECT DATE_TRUNC('month', order_date)::date AS month, SUM(amount) AS revenue
  FROM orders
  GROUP BY 1
)
SELECT TO_CHAR(month, 'YYYY-MM') AS month,
       revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS mom_pct
FROM m
ORDER BY month`,
    } },
    { challenge: {
      id: 'sql-interview-method-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'The order that crossed **ten lakh**. For each customer, add up their order amounts in time order (by `order_date`, then `order_id`). Find the **first order** at which the running total reaches **1,000,000 or more**. Return `customer_id`, `order_id`, `order_date` and `cumulative_amount` (the running total at that order), sorted by `customer_id`. Customers who never reach ten lakh are left out. (10 rows. Pattern: running total, then first row that satisfies a condition.)',
      starter: `-- Restate: for each customer, the single order where their running total first reaches 1,000,000.
-- Clarify: time order = order_date, then order_id as the tie-breaker. Customers who never reach it do not appear.
-- Example: amounts 400, 300, 500, 200 -> running totals 400, 700, 1200, 1400 (using a limit of 1000): the answer is the third order.
SELECT customer_id, order_id, order_date, amount
FROM orders
ORDER BY customer_id, order_date, order_id`,
      hint: "SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) is the running total. Keep the rows where it is >= 1000000, then number them with ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) and keep number 1. Two window steps need two CTEs, because you cannot filter on a window function directly.",
      solution: `WITH running AS (
  SELECT customer_id, order_id, order_date, amount,
         SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS cumulative_amount
  FROM orders
),
crossed AS (
  SELECT customer_id, order_id, order_date, cumulative_amount,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS rn
  FROM running
  WHERE cumulative_amount >= 1000000
)
SELECT customer_id, order_id, order_date, cumulative_amount
FROM crossed
WHERE rn = 1
ORDER BY customer_id`,
    } },
    { real: 'The seven steps are not only for interviews. When a finance controller writes *"can you give me the revenue by region?"*, the professional reply is steps 1 and 2: *"One row per region and month? Revenue before or after credit notes? Which fiscal year, and what is a region when a customer has two sites?"* A few good questions at the start save a great deal of rework, and the answers become the **definition** at the top of the query and in the report footnote. The engineers who are trusted with the important numbers are the ones who ask these questions before they write SQL, and who can explain in plain words why the number is what it is.' },
    { interview: '"Walk me through how you approach a SQL problem you have not seen before." Model answer: "First I restate the question and the output: what one row of the result means. Then I ask about the data: the tables and keys, whether columns can be NULL, whether there can be duplicates or ties, and the date types. I write a tiny example with the answer I expect, so I have a test. Then I name the pattern, for example an anti-join, a ranking per group, or a running total, and plan the joins and windows in words. I write the query in small CTEs and check each one on the example. At the end I test the edges: empty groups, NULLs, ties, boundary dates, and a join that could multiply rows. Last I state my assumptions and talk about performance: where an index or a rewrite would help, how the query would behave on a large table, and what I would change for another database. I narrate this as I go, so you can follow my thinking." Follow-up: "What do you do when you are completely stuck?" (shrink the problem to one entity, write the slow obvious version first, say what I am trying to achieve, and ask a clarifying question).' },
    `## What you can do now: the SQL programme in one table
This is the last lesson of the SQL phase. Here is what the 38 lessons added up to:

| Modules | You can now |
|---|---|
| **Foundations, summarising, joins** | set up PostgreSQL, filter and sort, handle \`NULL\`, \`CASE\` and casts, aggregate with \`GROUP BY\`/\`HAVING\`/\`ROLLUP\`, join any tables without fan-out, find missing rows with anti-joins |
| **Subqueries, CTEs, windows** | break a problem into steps, write recursive hierarchies, rank, take running totals, compare with the previous row |
| **Dates, text, JSON, sets, reconciliation** | do fiscal-year arithmetic, validate IFSC/GSTIN/PAN with regex, read and flatten JSON, compare snapshots with set operations, reconcile two ledgers |
| **Changing data safely** | \`UPDATE\`/\`DELETE\` safely, upsert and \`MERGE\`, use transactions, isolation levels and locks, avoid deadlocks |
| **Designing, programmability, security, operations** | design normalised tables and star schemas, write functions, procedures and triggers, apply roles and row-level security, back up and restore, read the server |
| **Performance** | read plans, add the right index, write sargable filters, fix bad estimates, partition and maintain big tables |
| **Data-engineering patterns** | load incrementally with watermarks, build SCD Type 2 with \`MERGE\`, solve gaps-and-islands, cohort and funnel problems, run data-quality checks and reconcile layers |
| **Dialects and interviews** | translate between engines, avoid behaviour traps, and approach any problem with a method |

Keep going with Python next, and **keep practising SQL**: the three problems above, redone from scratch every so often, and the challenges of earlier lessons, are your first practice set.`,
    `## Recap
- Interviews test **how you think**: restate, clarify, example, plan, write, test, discuss. Do the **seven steps** in order, and **say them aloud**.
- **Clarify the grain** (what one output row means), NULLs, duplicates, ties, date types and the dialect before you type. Write a **tiny example** with the expected answer: it is your test.
- **Name the pattern** (anti-join, aggregation with \`HAVING\`, ranking, running total, gaps and islands, funnel, SCD). Build in small **CTEs** and check each one.
- **Check the traps**: fan-out, \`COUNT(*)\` against \`COUNT(col)\`, a \`WHERE\` after a \`LEFT JOIN\`, \`NOT IN\` with NULLs, ties, \`BETWEEN\` on timestamps, integer division and average of ratios, no \`ORDER BY\`, empty groups.
- When stuck: **shrink the problem** (one customer), write the slow obvious version first, state assumptions, fix your own mistakes calmly. For "make it faster": measure, look for scans that discard rows, compare estimated and actual rows, check fan-outs and spills, then index, rewrite, pre-aggregate or partition.
- **Practise by pattern**, in three passes (understand, solve, improve), keep a **mistake log**, come back to problems later, practise without autocomplete and **out loud**.`,
  ],
  quiz: [
    { q: 'You are given a vague SQL question in an interview. What should you do first?', o: ['Start typing the query to show speed', 'Ask about the tables and then immediately write the final query', 'Pick the most advanced function you know', 'Restate the question, name what one output row means, and ask about grain, NULLs, duplicates and ties'], a: 3, why: 'Restating and clarifying the grain prevents solving the wrong problem. It also shows the interviewer how you think, which is what they are testing.' },
    { q: 'A query lists customers with a count of Delivered orders, using `LEFT JOIN orders o ON ... WHERE o.status = \'Delivered\'`. Customers with no delivered orders disappear. Why?', o: ['The WHERE on the right-hand table removes the NULL rows the LEFT JOIN produced, which turns it into an INNER JOIN. Put the condition in the ON clause', 'LEFT JOIN cannot be combined with GROUP BY', 'The status column is case-sensitive', 'Delivered is a reserved word'], a: 0, why: 'For a customer without a matching order, o.status is NULL, so o.status = \'Delivered\' is not true and the row is filtered out. Moving the condition into the ON clause keeps the customer with a zero count.' },
    { q: 'An employee table has a NULL `manager_id` for the top boss. `WHERE emp_id NOT IN (SELECT manager_id FROM employees)` returns no rows. Why, and what is the safe fix?', o: ['The subquery is too slow. Add an index', 'NOT IN returns nothing when the list contains a NULL, so use NOT EXISTS (or filter out NULLs in the subquery)', 'emp_id must be a text column', 'NOT IN only works with numbers'], a: 1, why: 'x NOT IN (..., NULL) is never true, because comparing with NULL gives unknown. NOT EXISTS has no such trap.' },
    { q: 'You join `employees` to `payroll` (two rows per employee) and `SUM(annual_ctc)`. The total is twice what it should be. What happened?', o: ['The join multiplied each employee row (a fan-out), so each CTC was added twice. Aggregate before joining, or do not join', 'annual_ctc contains duplicates', 'SUM counts NULLs twice', 'payroll has the wrong currency'], a: 0, why: 'A join to a table with several rows per key repeats the left rows. Always ask what one row of the joined result means.' },
    { q: 'You are stuck on a hard problem during an interview. Which approach is best?', o: ['Stay silent until you find the answer', 'Shrink the problem to one entity, write the simple version first, say aloud what you are trying to do, and ask a clarifying question if needed', 'Say you do not know and stop', 'Guess a function name and hope'], a: 1, why: 'Interviewers want to see problem solving. Simplifying, narrating and asking questions shows it even before the answer is complete.' },
    { q: 'Why keep a mistake log?', o: ['Interviewers ask to see it', 'To count how many problems you solved', 'Because the same few mistakes cause most of your errors, and writing them down makes them visible so you stop repeating them', 'It replaces practice'], a: 2, why: 'A log of problem, pattern, mistake and fix becomes your personal checklist. Reading it before practice targets exactly the habits you need to change.' },
  ],
  task: {
    title: 'Your own interview kit',
    steps: [
      'Create `37_interview.sql` in `C:\\sql-practice`. At the top, write the seven steps as a comment card in your own words, with one sentence of what you would say aloud at each step.',
      'Solve the three timed problems again from scratch in this file, using the seven steps. For each, write as comments: the restated question, your assumptions, the tiny example, the pattern, and the edge cases you tested. Note how long each took.',
      'Run the six "spot the bug" queries on your laptop. For each, write the one-line rule that would have caught it (the checklist item).',
      'Make a mistake log (a text file or a table `mistake_log` in your practice database) with the columns problem, pattern, what went wrong, the fix. Fill it with at least five entries from the lessons so far (for example the NOT IN trap, the BETWEEN trap, the fan-out).',
      'Choose three problems from the challenges of earlier lessons that you found hard. Redo them aloud, narrating the seven steps, and record yourself (voice memo on your phone). Listen back and write two things you would change.',
      'Prepare answers, in your own words, for: "how would you make this query faster", "what is the difference between RANK and DENSE_RANK", "how do you load only the new rows", and "how do you know the data is right". Keep each answer short enough to say in one breath per step.',
    ],
    deliverable: '`37_interview.sql` with the method card, your three worked solutions with assumptions and tested edge cases, the six rules, the mistake log, the notes from your recording, and your four short answers.',
  },
};
