export default {
  id: 'sql-ctes',
  title: 'CTEs: queries in readable steps, and recursion',
  goal: 'You can write a query as a chain of named steps with WITH, compare actual and budget at the same grain, walk a hierarchy or build a date series with a recursive CTE, and explain how Postgres treats a CTE.',
  roadmap: [
    'WITH and chained CTEs',
    'Recursive CTE: account hierarchy and date series',
    'CTE materialisation',
  ],
  blocks: [
    `## The problem
The CFO asks for **actual revenue against budget, by month, for each entity, with the variance in percent.**

Think about how many steps that needs. (1) Total the actual revenue from \`fact_gl\` by entity and month. (2) Total the budget from \`fact_budget\` by entity and month. (3) Put the two side by side. (4) Calculate the variance. With the tools you have, you would write a subquery inside a subquery inside a join. It works, but nobody can read it, and when the numbers look wrong you cannot see which step is guilty.

A **common table expression (CTE)** fixes this. It lets you give each step a **name** and write the query from top to bottom, like a recipe. The step you write first is the step that runs first in your head.`,
    `## WITH: name each step
A CTE starts with \`WITH\`, then a name, then the step in brackets. Several CTEs are separated by commas, and the main query comes last:

\`\`\`sql
WITH actual AS (
  SELECT entity_id,
         DATE_TRUNC('month', posting_date)::date AS month,
         SUM(credit - debit) AS actual_rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)                 -- the revenue accounts
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
),
budget AS (
  SELECT entity_id, budget_month AS month, SUM(budget_amount) AS budget_rev
  FROM fact_budget
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, budget_month
)
SELECT a.entity_id, a.month, a.actual_rev, b.budget_rev,
       ROUND(100.0 * (a.actual_rev - b.budget_rev) / NULLIF(b.budget_rev, 0), 1) AS var_pct
FROM actual a
JOIN budget b ON b.entity_id = a.entity_id AND b.month = a.month;
\`\`\`
The rules are short:
- A CTE **exists only for that one statement**. It is not a table and nothing is saved.
- A **later CTE can use an earlier one** (a chain). The main query can use all of them.
- There is a **comma between CTEs** but no comma before the final \`SELECT\`.
- Use a CTE name like a table name: \`FROM actual a\`.`,
    { sketch: { w: 760, h: 300, caption: 'Two CTEs prepare the data at the same grain (entity and month). The join is then one row to one row.', items: [
      { t: 'db', x: 15, y: 40, w: 100, h: 70, label: 'fact_gl', fill: 'blue' },
      { t: 'db', x: 15, y: 160, w: 100, h: 70, label: 'fact_budget', fill: 'blue', size: 14 },
      { t: 'box', x: 150, y: 40, w: 170, h: 70, label: 'WITH actual', sub: 'entity x month', fill: 'green', size: 18 },
      { t: 'box', x: 150, y: 160, w: 170, h: 70, label: 'budget', sub: 'entity x month', fill: 'green', size: 18 },
      { t: 'arrow', x1: 117, y1: 75, x2: 148, y2: 75 },
      { t: 'arrow', x1: 117, y1: 195, x2: 148, y2: 195 },
      { t: 'box', x: 360, y: 100, w: 130, h: 70, label: 'JOIN', sub: 'on entity + month', fill: 'yellow', size: 19 },
      { t: 'arrow', x1: 322, y1: 80, x2: 358, y2: 122 },
      { t: 'arrow', x1: 322, y1: 190, x2: 358, y2: 150 },
      { t: 'arrow', x1: 492, y1: 135, x2: 523, y2: 135 },
      { t: 'table', x: 525, y: 70, title: 'IN01 result', cols: ['month', 'actual', 'budget', 'var%'], colW: [52, 62, 62, 52], rows: [['Apr', '2.34L', '2.18L', '7.2'], ['May', '2.31L', '2.13L', '8.3'], ['Jun', '2.47L', '2.17L', '13.9']], fill: 'yellow' },
      { t: 'note', x: 15, y: 252, w: 730, h: 36, text: 'Each CTE has exactly one row per entity and month, so the join is one row to one row: no fan-out.', fill: 'yellow', size: 15 },
    ] } },
    `Pay attention to what the picture shows. Both CTEs are **grouped to the same grain** (one row per entity and month) **before** they are joined. That is the cure for fan-out from the join lessons: each side is reduced first, so each month matches exactly one month. A CTE is the natural place to do that reduction.`,
    { sql: {
      title: 'Actual against budget, in two named steps',
      starter: `WITH actual AS (
  SELECT entity_id,
         DATE_TRUNC('month', posting_date)::date AS month,
         SUM(credit - debit) AS actual_rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
),
budget AS (
  SELECT entity_id, budget_month AS month, SUM(budget_amount) AS budget_rev
  FROM fact_budget
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, budget_month
)
SELECT a.month, a.actual_rev, b.budget_rev,
       ROUND(100.0 * (a.actual_rev - b.budget_rev) / NULLIF(b.budget_rev, 0), 1) AS var_pct
FROM actual a
JOIN budget b ON b.entity_id = a.entity_id AND b.month = a.month
WHERE a.entity_id = 1                      -- IN01, in rupees
ORDER BY a.month;`,
      note: 'April: actual 2,33,914.19 against a budget of 2,18,239.68, which is 7.2% above. Debug tip: replace the last SELECT with `SELECT * FROM actual` (or `FROM budget`) to look at one step on its own. That is the big advantage over nested subqueries.',
    } },
    `### CTE or subquery?
A CTE and a subquery in \`FROM\` give the same result. Choose the CTE when:
- the query has **more than two steps**, or a step has a meaningful name (\`actual\`, \`budget\`, \`ranked\`, \`clean_orders\`);
- you need the **same step twice**. Write it once, use it twice. Example: customers whose total is above the average of all customers' totals. The totals CTE is read once for the rows and once for the average:

\`\`\`sql
WITH totals AS (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id)
SELECT customer_id, total
FROM totals
WHERE total > (SELECT AVG(total) FROM totals);
\`\`\`
- you want to **test the steps one at a time**. Most analysts build a CTE query exactly like that: write the first CTE, run it, add the second, run it again.

### How Postgres runs a CTE (materialisation)
You will meet this word in performance discussions, so here it is in plain terms. **Materialising** a CTE means the database calculates it once and stores the result in a temporary place, then reads it from there.

Since PostgreSQL 12 the default is sensible: a CTE that is **read only once** is simply **inlined** (merged into the main query like a subquery, so the planner can optimise the whole thing together), while a CTE **read more than once** is **materialised**, so its work is not repeated. You can override this:

\`\`\`sql
WITH totals AS MATERIALIZED     (SELECT …)    -- force: compute once, store
WITH totals AS NOT MATERIALIZED (SELECT …)    -- force: merge into the main query
\`\`\`
Before version 12, every CTE was materialised, which made them a performance barrier, and old articles still tell you "CTEs are slow". Today you should write the readable version first and only add a hint when \`EXPLAIN\` shows a problem (the performance module teaches that). Other databases behave differently: some always inline, some always materialise.`,
    `## Recursive CTE: queries that repeat themselves
Some questions have no fixed number of steps. *"Show the whole reporting line under the top boss."* The CEO has direct reports, they have reports, and those have reports. A self join climbs **one** level. A **recursive CTE** keeps going until there is nothing left.

It always has **two parts joined by \`UNION ALL\`**:
1. The **anchor member**: a normal query that gives the **starting rows** (the top boss).
2. The **recursive member**: a query that **refers to the CTE itself**, and finds the next level from the rows found in the previous pass.

Postgres runs the anchor once, then runs the recursive part again and again, each time using only the rows that the previous pass produced. When a pass returns no new rows, it stops.`,
    { sketch: { w: 760, h: 335, caption: 'A recursive CTE repeats until a pass finds nothing new. The org chart has three levels: 1 + 4 + 15 = 20 employees.', items: [
      { t: 'text', x: 10, y: 66, text: 'pass 1', size: 14, anchor: 'start', color: '#c2410c' },
      { t: 'box', x: 260, y: 40, w: 240, h: 52, label: 'Aarav', sub: 'anchor: manager_id IS NULL', fill: 'pink', size: 18 },
      { t: 'text', x: 10, y: 156, text: 'pass 2', size: 14, anchor: 'start', color: '#c2410c' },
      { t: 'box', x: 70, y: 130, w: 130, h: 52, label: 'Diya', fill: 'blue', size: 17 },
      { t: 'box', x: 235, y: 130, w: 130, h: 52, label: 'Ishaan', fill: 'blue', size: 17 },
      { t: 'box', x: 400, y: 130, w: 130, h: 52, label: 'Meera', fill: 'blue', size: 17 },
      { t: 'box', x: 565, y: 130, w: 130, h: 52, label: 'Rohan', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 340, y1: 94, x2: 150, y2: 128 },
      { t: 'arrow', x1: 365, y1: 94, x2: 300, y2: 128 },
      { t: 'arrow', x1: 395, y1: 94, x2: 450, y2: 128 },
      { t: 'arrow', x1: 420, y1: 94, x2: 600, y2: 128 },
      { t: 'text', x: 10, y: 250, text: 'pass 3', size: 14, anchor: 'start', color: '#c2410c' },
      { t: 'box', x: 70, y: 224, w: 625, h: 52, label: 'the other 15 employees', sub: 'each one has a manager from pass 2', fill: 'green', size: 18 },
      { t: 'arrow', x1: 135, y1: 184, x2: 135, y2: 222 },
      { t: 'arrow', x1: 300, y1: 184, x2: 300, y2: 222 },
      { t: 'arrow', x1: 465, y1: 184, x2: 465, y2: 222 },
      { t: 'arrow', x1: 630, y1: 184, x2: 630, y2: 222 },
      { t: 'note', x: 70, y: 292, w: 625, h: 36, text: 'Pass 4 finds no one who reports to those 15, so the CTE stops. 1 + 4 + 15 = 20 rows.', fill: 'yellow', size: 15 },
    ] } },
    `\`\`\`sql
WITH RECURSIVE org AS (
  SELECT emp_id, emp_name, manager_id, 0 AS lvl            -- anchor: the top boss
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.emp_id, e.emp_name, e.manager_id, o.lvl + 1      -- recursive: the next level
  FROM employees e
  JOIN org o ON e.manager_id = o.emp_id                     -- refers to the CTE itself
)
SELECT * FROM org ORDER BY lvl, emp_id;
\`\`\`
Keep the extra column \`lvl\`: it counts the level and is how you show an indented org chart. In the same way you can build a **path** (\`Operating Expenses > People Costs > Salaries\`) by joining the parent's path to the child's name. That is the **account hierarchy** for a P&L: a self join only gives you the parent, while the recursive CTE gives every account its complete path and level.

### A date series, and why recursion needs a brake
The recursive member can also **generate** rows with no table at all. A series of days:

\`\`\`sql
WITH RECURSIVE days AS (
  SELECT DATE '2025-04-01' AS day
  UNION ALL
  SELECT day + 1 FROM days WHERE day < DATE '2025-04-30'    -- the brake
)
SELECT day FROM days;
\`\`\`
The **\`WHERE\` in the recursive member is the brake**. Without it, the query would add a new day forever and never finish. The same danger exists in data: if a bad record says A manages B and B manages A, an org-chart recursion loops endlessly. Protect yourself with a depth limit (\`WHERE o.lvl < 10\`) or with the \`CYCLE\` clause of PostgreSQL 14 and later. (Postgres also has a shortcut for number and date series, \`generate_series\`, which the dates lesson covers.)

A date series is a **scaffold**, the idea from the join lesson. Join the days to \`fact_gl\` and you can list the days on which IN01 posted **nothing**: 15 of the 30 days in April 2025.`,
    { sql: {
      title: 'Recursion: org chart, account tree and a date scaffold',
      starter: `-- 1) Org chart: level of every employee
WITH RECURSIVE org AS (
  SELECT emp_id, emp_name, manager_id, 0 AS lvl
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.emp_id, e.emp_name, e.manager_id, o.lvl + 1
  FROM employees e JOIN org o ON e.manager_id = o.emp_id
)
SELECT lvl, COUNT(*) AS employees FROM org GROUP BY lvl ORDER BY lvl;

-- 2) Account tree with the full path of every account
WITH RECURSIVE tree AS (
  SELECT account_id, account_name, 0 AS lvl, account_name::text AS path
  FROM dim_account WHERE parent_account_id IS NULL
  UNION ALL
  SELECT a.account_id, a.account_name, t.lvl + 1, t.path || ' > ' || a.account_name
  FROM dim_account a JOIN tree t ON a.parent_account_id = t.account_id
)
SELECT account_id, lvl, path FROM tree ORDER BY path;

-- 3) Days of April 2025 on which IN01 posted nothing
WITH RECURSIVE days AS (
  SELECT DATE '2025-04-01' AS day
  UNION ALL
  SELECT day + 1 FROM days WHERE day < DATE '2025-04-30'
)
SELECT day
FROM days d
WHERE NOT EXISTS (SELECT 1 FROM fact_gl g WHERE g.entity_id = 1 AND g.posting_date = d.day)
ORDER BY day;`,
      note: 'The first query shows 1, 4 and 15 employees on levels 0, 1 and 2. The second lists 15 accounts: Salaries has the path "Operating Expenses > People Costs > Salaries" at level 2. The third lists 15 days, the first being 3 April.',
    } },
    { warn: 'A recursive CTE with no stopping condition runs forever or until the server gives up. Always check three things before you run one: does the recursive member have a `WHERE` brake (or does the data have a natural end)? Could the data contain a **cycle**? Is `UNION ALL` used (fast, keeps duplicates) rather than `UNION`? Test it on a small dataset first.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-ctes-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Use a CTE to total the order amount per customer, then return the customers whose **total is above the average of all customers\' totals**: `customer_id, total`, sorted by `customer_id`. (6 rows.)',
      hint: 'WITH totals AS (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id), then WHERE total > (SELECT AVG(total) FROM totals).',
      solution: `WITH totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
)
SELECT customer_id, total
FROM totals
WHERE total > (SELECT AVG(total) FROM totals)
ORDER BY customer_id`,
    } },
    { challenge: {
      id: 'sql-ctes-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Revenue variance for IN01. Build two CTEs, `actual` and `budget`, both at the grain **entity and month** and both for revenue accounts **4100 and 4200**. Return, for entity **1**, `month, actual_rev, budget_rev, var_pct` for all 12 months, where `var_pct = 100 * (actual - budget) / budget` rounded to 1 decimal. Sort by `month`. (April should be 7.2.)',
      hint: "actual: SUM(credit - debit) grouped by entity_id and DATE_TRUNC('month', posting_date)::date. budget: SUM(budget_amount) grouped by entity_id and budget_month. Join on entity_id and month.",
      solution: `WITH actual AS (
  SELECT entity_id, DATE_TRUNC('month', posting_date)::date AS month, SUM(credit - debit) AS actual_rev
  FROM fact_gl
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, DATE_TRUNC('month', posting_date)::date
),
budget AS (
  SELECT entity_id, budget_month AS month, SUM(budget_amount) AS budget_rev
  FROM fact_budget
  WHERE account_id IN (4100, 4200)
  GROUP BY entity_id, budget_month
)
SELECT a.month, a.actual_rev, b.budget_rev,
       ROUND(100.0 * (a.actual_rev - b.budget_rev) / NULLIF(b.budget_rev, 0), 1) AS var_pct
FROM actual a
JOIN budget b ON b.entity_id = a.entity_id AND b.month = a.month
WHERE a.entity_id = 1
ORDER BY a.month`,
    } },
    { challenge: {
      id: 'sql-ctes-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Cost-centre tree. With a **recursive CTE**, return account **6000 (Operating Expenses) and every account below it at any depth**: `account_id, account_name, lvl`, where `lvl` is 0 for account 6000, 1 for its children, and so on. Sort by `account_id`. (7 rows.)',
      hint: 'Anchor: WHERE account_id = 6000 with 0 AS lvl. Recursive member: JOIN dim_account a ON a.parent_account_id = s.account_id with s.lvl + 1.',
      solution: `WITH RECURSIVE sub AS (
  SELECT account_id, account_name, 0 AS lvl
  FROM dim_account
  WHERE account_id = 6000
  UNION ALL
  SELECT a.account_id, a.account_name, s.lvl + 1
  FROM dim_account a
  JOIN sub s ON a.parent_account_id = s.account_id
)
SELECT account_id, account_name, lvl
FROM sub
ORDER BY account_id`,
    } },
    { real: 'Almost every serious reporting query is written as a chain of CTEs: `clean` (fix types, remove duplicates), `converted` (apply FX), `grouped` (aggregate to the right grain), then the final select. dbt, the transformation tool you will meet later, is built on exactly this idea: each model is a named step. Recursive CTEs unlock the account hierarchy for roll-ups (what is "all Operating Expenses"?), the org chart for approval limits, and bill-of-materials trees. When someone asks you to explain a number, a CTE chain lets you answer "step three, here are its rows".' },
    { interview: '"What is a CTE, and is it the same as a temporary table? What is a recursive CTE?" Model answer: "A CTE is a named subquery defined with WITH. It exists only for the one statement and is not stored, unlike a temporary table. I use CTEs to break a query into readable steps and to reuse a step. A recursive CTE has an anchor query and a recursive query joined by UNION ALL; the recursive part refers to the CTE itself and repeats until it returns no new rows. I use it for hierarchies like the org chart or the chart of accounts, and I make sure it has a stopping condition." Follow-up: "Is a CTE faster than a subquery?" (In PostgreSQL 12+ a CTE used once is inlined, so usually no difference; one used several times is materialised.)' },
    `## Recap
- \`WITH name AS (…)\` gives a query step a name. Steps are chained with commas, later ones can use earlier ones, and the whole thing lives for one statement only.
- Reduce each side to the **same grain** in its own CTE, then join: actual and budget by entity and month have a one-to-one join and no fan-out.
- CTE or subquery? Use a CTE for more than two steps, for a step you need twice, and to test one step at a time.
- Materialisation (PostgreSQL 12 and later): a CTE read once is inlined; read more than once it is calculated once and stored. Override with \`AS MATERIALIZED\` or \`AS NOT MATERIALIZED\`, but only after \`EXPLAIN\` tells you to.
- **Recursive** CTE = anchor + \`UNION ALL\` + recursive member that refers to itself. It repeats until nothing new appears. Use it for org charts (levels 0, 1, 2 with 1, 4, 15 employees), the account tree with its path, and date series. Always add a brake.`,
  ],
  quiz: [
    { q: 'What is a CTE?', o: ['A named query step defined with WITH that exists only for one statement', 'A temporary table stored on disk', 'A special index type', 'A permanent view'], a: 0, why: 'A CTE gives a name to a subquery inside one statement. Nothing is stored, unlike a temporary table, and it disappears when the statement ends.' },
    { q: 'In `WITH a AS (...), b AS (...) SELECT ...`, what is true about `b`?', o: ['b must not use a', 'b must be recursive', 'b can use a, because later CTEs can refer to earlier ones', 'b replaces a in the main query'], a: 2, why: 'CTEs form a chain from top to bottom. A later CTE can read an earlier one, and the main query can read all of them.' },
    { q: 'What are the two parts of a recursive CTE?', o: ['A SELECT and an INSERT', 'An anchor query and a recursive query, joined with UNION ALL', 'A WHERE and a HAVING', 'A CROSS JOIN and a FULL JOIN'], a: 1, why: 'The anchor gives the starting rows. The recursive member refers to the CTE itself and finds the next level, repeating until it returns nothing new.' },
    { q: 'How do you stop a recursive CTE from looping forever?', o: ['Add DISTINCT to the final SELECT', 'Use LEFT JOIN instead of JOIN', 'Put ORDER BY at the end', 'Give the recursive member a stopping condition, such as `WHERE day < …` or a depth limit'], a: 3, why: 'Without a brake the recursive member keeps producing rows. A WHERE condition, a depth limit, or the CYCLE clause ends it. DISTINCT at the end does not help, because the CTE never finishes.' },
    { q: 'In PostgreSQL 12 and later, how is a CTE that the main query reads twice treated by default?', o: ['It is merged into the main query twice', 'It is rejected as an error', 'It is calculated once and the result is reused (materialised)', 'It is always written to disk as a table'], a: 2, why: 'A CTE read once is inlined like a subquery. A CTE read more than once is materialised so that its work is not repeated. You can override with MATERIALIZED or NOT MATERIALIZED.' },
    { q: 'Why do the `actual` and `budget` CTEs each group by entity and month before the join?', o: ['So that both sides have one row per entity and month and the join cannot multiply rows', 'Because CTEs must contain GROUP BY', 'To make the budget smaller', 'To avoid using NULLIF'], a: 0, why: 'Reducing both sides to the same grain makes the join one row to one row. Joining raw journal lines to monthly budget rows would fan out and inflate the totals.' },
  ],
  task: {
    title: 'Build a CTE report and a recursive query on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `12_ctes.sql` in `C:\\sql-practice`.',
      'Query 1: the actual-against-budget revenue report for all three entities (not only entity 1) with `actual` and `budget` CTEs. Add a comment on which entities are in a different currency and why you must not add them together.',
      'Query 2: the customers whose total is above the average customer total, with the `totals` CTE read twice (expect 6 rows).',
      'Query 3: the org-chart recursion with a `lvl` column (expect 1, 4 and 15 employees per level) and the account tree with its `path` column.',
      'Query 4: change the date-series CTE to cover the whole of May 2025 and list the days with no IN01 postings. Write down the number of days.',
    ],
    deliverable: '`12_ctes.sql` with four commented queries; the 1/4/15 level counts and the 15 April days without postings appear in your results.',
  },
};
