export default {
  id: 'sql-dialects',
  title: 'SQL across engines: PostgreSQL, SQL Server, MySQL, Snowflake and BigQuery',
  goal: 'You can say which parts of SQL are the same everywhere and which differ, read and translate a query between PostgreSQL, T-SQL, MySQL, Snowflake and BigQuery, avoid the behaviour traps (integer division, case, NULLs, enforced keys), and write portable SQL when it matters.',
  roadmap: [
    'Standard SQL core and where engines differ',
    'PostgreSQL vs SQL Server (T-SQL) vs MySQL vs Snowflake vs BigQuery',
    'Translating queries and avoiding behaviour traps',
  ],
  blocks: [
    `## The problem
You learned SQL on PostgreSQL. Your next client says: *"Our finance data is in **SQL Server**."* The one after that: *"We moved to **Snowflake**."* An interviewer hands you a whiteboard and says: *"Any dialect you like, but tell me which."*

Here is the good news. About **nine tenths of SQL is the same everywhere**: \`SELECT\`, \`WHERE\`, \`JOIN\`, \`GROUP BY\`, \`HAVING\`, \`CASE\`, \`COALESCE\`, \`UNION\`, subqueries, CTEs, and window functions (\`ROW_NUMBER\`, \`LAG\`, \`SUM() OVER\`). Everything you practised for the last 30 lessons carries over. The other tenth is where the bugs live: how you limit rows, join text, add to a date, quote a name, or what \`5 / 2\` returns. This lesson is a **map of that tenth** for the five engines you will meet in data engineering, with the behaviour traps that cause real incidents.

How to use it: **do not memorise it.** Skim it once, keep it as a cheat sheet, and for any real task check the engine's own documentation, because engines add features (SQL Server and PostgreSQL both added several in recent versions). Always **test a translated query on the target engine** before you trust it.`,
    { sketch: { w: 760, h: 296, caption: 'Most SQL is shared. The differences cluster in a few areas: syntax of everyday functions, types and behaviour, and how the engine is built.', items: [
      { t: 'box', x: 160, y: 20, w: 440, h: 90, label: 'The shared core (about 90%)', sub: 'SELECT, JOIN, GROUP BY, CASE, CTEs, windows', fill: 'green', size: 18 },
      { t: 'box', x: 10, y: 150, w: 140, h: 62, label: 'Row limits', sub: 'LIMIT / TOP', fill: 'yellow', size: 15 },
      { t: 'box', x: 160, y: 150, w: 140, h: 62, label: 'Text and dates', sub: 'concat, DATEADD ...', fill: 'yellow', size: 15 },
      { t: 'box', x: 310, y: 150, w: 140, h: 62, label: 'Types', sub: 'casts, booleans', fill: 'yellow', size: 15 },
      { t: 'box', x: 460, y: 150, w: 140, h: 62, label: 'Behaviour', sub: '5/2, case, NULLs', fill: 'orange', size: 15 },
      { t: 'box', x: 610, y: 150, w: 140, h: 62, label: 'Architecture', sub: 'indexes, constraints', fill: 'orange', size: 15 },
      { t: 'arrow', x1: 380, y1: 112, x2: 80, y2: 148 },
      { t: 'arrow', x1: 380, y1: 112, x2: 230, y2: 148 },
      { t: 'arrow', x1: 380, y1: 112, x2: 380, y2: 148 },
      { t: 'arrow', x1: 380, y1: 112, x2: 530, y2: 148 },
      { t: 'arrow', x1: 380, y1: 112, x2: 680, y2: 148 },
      { t: 'note', x: 10, y: 228, w: 740, h: 56, fill: 'pink', size: 14, text: 'Syntax differences make a query FAIL (easy to see).\nBehaviour differences make it return a DIFFERENT ANSWER (dangerous).\nLearn the orange boxes first.' },
    ] } },
    `## Who is who
| Engine | What it is | You will meet it |
|---|---|---|
| **PostgreSQL** | open-source relational database, row store, rich SQL | application databases, analytics, cloud-managed services |
| **SQL Server** and its **T-SQL** dialect | Microsoft's relational database, also Azure SQL | Windows and Azure shops, Power BI back ends, many Indian finance and ERP systems |
| **MySQL** (and its fork MariaDB) | open-source relational database, row store | web applications, many ERP and e-commerce back ends |
| **Snowflake** | cloud data warehouse, columnar, compute and storage separated | the analytics warehouse for many companies |
| **BigQuery** | Google's serverless cloud data warehouse, columnar | analytics on Google Cloud |

Two **families**: PostgreSQL, SQL Server and MySQL are **row stores with indexes**, built to run an application and also report on it. Snowflake and BigQuery are **columnar cloud warehouses** built for large scans. They have no OLTP-style B-tree indexes: you design **partitioning and clustering** instead, and the cost (money and time) follows how much data you scan, so \`SELECT *\` is a worse habit there than anywhere.

The first practical difference is the **name** of a table:`,
    { sketch: { w: 760, h: 274, caption: 'How each engine names a table. PostgreSQL cannot query another database from the same connection.', items: [
      { t: 'table', x: 14, y: 40, title: 'fully qualified name of the customers table', cols: ['engine', 'name', 'quote a name with'], colW: [150, 330, 250], rows: [['PostgreSQL', 'schema.table', 'double quotes'], ['SQL Server', 'database.schema.table', 'square brackets [name]'], ['MySQL', 'database.table', 'backticks'], ['Snowflake', 'database.schema.table', 'double quotes'], ['BigQuery', 'project.dataset.table', 'backticks']], rowH: 30 },
      { t: 'note', x: 14, y: 222, w: 732, h: 44, fill: 'yellow', size: 14, text: 'In MySQL a "schema" and a "database" are the same thing.\nPostgreSQL folds unquoted names to lower case, Snowflake to UPPER case.' },
    ] } },
    `## The cheat sheet: everyday differences
**Limiting and paging rows**

| Task | PostgreSQL | SQL Server | MySQL | Snowflake | BigQuery |
|---|---|---|---|---|---|
| First 10 rows | \`LIMIT 10\` | \`SELECT TOP (10) ...\` | \`LIMIT 10\` | \`LIMIT 10\` | \`LIMIT 10\` |
| Page 2 | \`LIMIT 10 OFFSET 10\` | \`ORDER BY ... OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY\` | \`LIMIT 10 OFFSET 10\` | \`LIMIT 10 OFFSET 10\` | \`LIMIT 10 OFFSET 10\` |

**Text**

| Task | PostgreSQL | SQL Server | MySQL | Snowflake | BigQuery |
|---|---|---|---|---|---|
| Join text | the double-pipe operator, or \`concat()\` | \`+\` or \`CONCAT()\` | \`CONCAT()\` (a double pipe means OR by default) | double pipe or \`CONCAT()\` | double pipe or \`CONCAT()\` |
| Length | \`length(s)\` | \`LEN(s)\` | \`CHAR_LENGTH(s)\` | \`LENGTH(s)\` | \`LENGTH(s)\` |
| Join the values of a group | \`string_agg(x, ',' ORDER BY x)\` | \`STRING_AGG(x, ',') WITHIN GROUP (ORDER BY x)\` | \`GROUP_CONCAT(x ORDER BY x SEPARATOR ',')\` | \`LISTAGG(x, ',') WITHIN GROUP (ORDER BY x)\` | \`STRING_AGG(x, ',' ORDER BY x)\` |
| Regex test | \`s ~ 'pattern'\` | no built-in regex (\`LIKE\`, \`PATINDEX\`); check your version | \`s REGEXP 'pattern'\` | \`REGEXP_LIKE(s, 'pattern')\` | \`REGEXP_CONTAINS(s, 'pattern')\` |

**Dates**

| Task | PostgreSQL | SQL Server | MySQL | Snowflake | BigQuery |
|---|---|---|---|---|---|
| Today | \`CURRENT_DATE\` | \`CAST(GETDATE() AS date)\` | \`CURDATE()\` | \`CURRENT_DATE()\` | \`CURRENT_DATE()\` |
| Add a month | \`d + INTERVAL '1 month'\` | \`DATEADD(month, 1, d)\` | \`DATE_ADD(d, INTERVAL 1 MONTH)\` | \`DATEADD(month, 1, d)\` | \`DATE_ADD(d, INTERVAL 1 MONTH)\` |
| Days from a to b | \`b - a\` | \`DATEDIFF(day, a, b)\` | \`DATEDIFF(b, a)\` | \`DATEDIFF(day, a, b)\` | \`DATE_DIFF(b, a, DAY)\` |
| First of the month | \`DATE_TRUNC('month', d)\` | \`DATETRUNC(month, d)\` in newer versions, else \`DATEFROMPARTS(YEAR(d), MONTH(d), 1)\` | \`DATE_FORMAT(d, '%Y-%m-01')\` (text) | \`DATE_TRUNC('month', d)\` | \`DATE_TRUNC(d, MONTH)\` (note the order) |
| Format as text | \`TO_CHAR(d, 'YYYY-MM')\` | \`FORMAT(d, 'yyyy-MM')\` | \`DATE_FORMAT(d, '%Y-%m')\` | \`TO_CHAR(d, 'YYYY-MM')\` | \`FORMAT_DATE('%Y-%m', d)\` |

Look at the argument order of \`DATEDIFF\`, and of \`DATE_TRUNC\` in BigQuery. Getting those backwards gives a negative number or an error, and a careless test with positive-looking data can hide it.

**NULLs, conditions, casts, keys**

| Task | PostgreSQL | SQL Server | MySQL | Snowflake | BigQuery |
|---|---|---|---|---|---|
| Replace NULL | \`COALESCE\` | \`ISNULL(a, b)\` or \`COALESCE\` | \`IFNULL(a, b)\` or \`COALESCE\` | \`IFNULL\`, \`NVL\` or \`COALESCE\` | \`IFNULL\` or \`COALESCE\` |
| If / else | \`CASE\` | \`IIF(c, a, b)\` or \`CASE\` | \`IF(c, a, b)\` or \`CASE\` | \`IFF(c, a, b)\` or \`CASE\` | \`IF(c, a, b)\` or \`CASE\` |
| Cast | \`x::int\` or \`CAST\` | \`CAST\` or \`CONVERT\` | \`CAST\` | \`x::int\` or \`CAST\` | \`CAST\` |
| Cast that returns NULL instead of failing | test with \`pg_input_is_valid()\` first | \`TRY_CAST\` | no direct equivalent | \`TRY_CAST\` | \`SAFE_CAST\` |
| Automatic id | \`GENERATED ... AS IDENTITY\` | \`IDENTITY(1,1)\` | \`AUTO_INCREMENT\` | \`AUTOINCREMENT\` | none: use \`GENERATE_UUID()\` |
| Upsert | \`INSERT ... ON CONFLICT\`, or \`MERGE\` | \`MERGE\` | \`INSERT ... ON DUPLICATE KEY UPDATE\` | \`MERGE\` | \`MERGE\` |

**Features that only some engines have**

| Feature | Where |
|---|---|
| \`DISTINCT ON (col)\`: first row per group | PostgreSQL only |
| \`SUM(x) FILTER (WHERE ...)\` | PostgreSQL (others use \`SUM(CASE WHEN ... THEN x END)\`) |
| \`QUALIFY\`: filter on a window function without a subquery | Snowflake and BigQuery (check the exact rules in each) |
| \`PIVOT\` and \`UNPIVOT\` operators | SQL Server, Snowflake, BigQuery |
| \`generate_series\` | PostgreSQL (newer SQL Server has \`GENERATE_SERIES\`; others use recursive CTEs or array generators) |
| Variables and procedures in plain SQL | SQL Server (\`DECLARE @x int = 5\`), BigQuery scripting, Snowflake Scripting. PostgreSQL uses PL/pgSQL \`DO\` blocks |
| \`WITH RECURSIVE\` | PostgreSQL, MySQL, BigQuery (SQL Server writes just \`WITH\`) |`,
    `## Behaviour traps: the same query, a different answer
Syntax errors announce themselves. These do not.

| Test | PostgreSQL | SQL Server | MySQL | Snowflake | BigQuery |
|---|---|---|---|---|---|
| \`SELECT 5 / 2\` | **2** | **2** | **2.5000** | **2.500000** | **2.5** |
| Is \`'a' = 'A'\`? | no | **yes** (default collation) | **yes** (default collation) | no | no |
| \`NULL\` first or last in \`ORDER BY x\` | last | **first** | **first** | last | **first** |
| Is a primary or foreign key enforced? | yes | yes | yes (InnoDB) | **no, informational** | **no, informational** |
| Can DDL be rolled back? | yes | yes | **no**, it commits | **no**, it commits | n/a |
| Unquoted name \`Customers\` is stored as | customers | as written | depends on the operating system | **CUSTOMERS** | as written |

What each row means for you:

- **Integer division.** In PostgreSQL and SQL Server, \`5 / 2\` on two integers gives **2**. A percentage written as \`amount * 100 / total\` with integer columns silently rounds down. In MySQL, Snowflake and BigQuery the same expression gives a decimal. Moving a query between engines changes every ratio. Cast one side to \`numeric\` (\`CAST(x AS decimal(18,2))\`) so the intention is explicit.
- **Case sensitivity.** SQL Server and MySQL compare text **case-insensitively** by default, so \`WHERE city = 'mumbai'\` matches \`Mumbai\`. PostgreSQL, Snowflake and BigQuery do not. A join on a name column can return different row counts. Normalise with \`LOWER()\` or \`UPPER()\` on both sides when you must be sure.
- **NULL and text.** In PostgreSQL \`'x' || NULL\` is NULL, but \`concat('x', NULL)\` ignores the NULL and returns \`x\`. In SQL Server \`+\` gives NULL and \`CONCAT()\` treats NULL as empty. In MySQL, Snowflake and BigQuery \`CONCAT()\` returns NULL if any argument is NULL. Wrap nullable columns in \`COALESCE\` so the result does not depend on the engine.
- **NULL ordering.** Always write \`NULLS FIRST\` or \`NULLS LAST\` where an engine supports it (PostgreSQL, Snowflake, BigQuery). On SQL Server and MySQL sort by \`CASE WHEN x IS NULL THEN 1 ELSE 0 END\` first.
- **Unenforced keys.** In Snowflake and BigQuery a primary key and a foreign key are **documentation**: the engine does not stop duplicates or orphans. The data-quality checks of the last lesson are not optional there.
- **DDL and transactions.** In PostgreSQL and SQL Server you can wrap \`CREATE TABLE\` and \`ALTER TABLE\` in a transaction and roll back a failed migration. In MySQL and Snowflake most DDL commits at once, so a half-finished migration stays half-finished.
- **Time zones.** PostgreSQL's \`timestamptz\` stores an instant and shows it in your session's zone. SQL Server separates \`datetime2\` (no zone) from \`datetimeoffset\`. Snowflake has three timestamp types (no zone, local zone, with zone). BigQuery's \`TIMESTAMP\` is an instant in UTC and \`DATETIME\` has no zone. Moving data between them without naming the zone shifts times by hours.

Also worth knowing: **Oracle** (common in banks and large ERPs) treats an empty string \`''\` as \`NULL\`, which no other engine in this table does.`,
    { sketch: { w: 760, h: 258, caption: 'The same expression, five answers. Integer division is the classic silent change when a query moves engine.', items: [
      { t: 'table', x: 14, y: 40, title: 'SELECT 5 / 2', cols: ['PostgreSQL', 'SQL Server', 'MySQL', 'Snowflake', 'BigQuery'], colW: [146, 146, 146, 146, 146], rows: [['2', '2', '2.5000', '2.500000', '2.5']], rowH: 36, hl: [0] },
      { t: 'note', x: 14, y: 124, w: 360, h: 74, fill: 'pink', size: 14, text: 'amount * 100 / total_amount\nwith integer columns: a whole number in\nPostgreSQL and SQL Server, a decimal elsewhere.' },
      { t: 'note', x: 388, y: 124, w: 358, h: 74, fill: 'green', size: 14, text: 'Portable and clear:\nCAST(amount AS decimal(18,2)) * 100 / total_amount\nor multiply by 100.0 first.' },
      { t: 'note', x: 14, y: 212, w: 732, h: 40, fill: 'yellow', size: 14, text: 'Rule: when a ratio matters, say the type you want. Never rely on what / does by default.' },
    ] } },
    `## One query, five dialects
Here is one report question: **the three customers with the highest revenue in FY 2025-26, with a label and the month of their first order**. In PostgreSQL (the version you can run below):

\`\`\`sql
SELECT c.customer_name || ' (' || c.city || ')' AS customer,
       COALESCE(SUM(o.amount), 0) AS revenue,
       TO_CHAR(DATE_TRUNC('month', MIN(o.order_date)), 'YYYY-MM') AS first_order_month
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
                  AND o.order_date >= DATE '2025-04-01' AND o.order_date < DATE '2026-04-01'
GROUP BY c.customer_name, c.city
ORDER BY revenue DESC
LIMIT 3;
\`\`\`

The same query in **SQL Server (T-SQL)**: \`TOP\`, \`+\`, \`ISNULL\`, \`FORMAT\`, and date literals in the language-safe \`yyyymmdd\` form.

\`\`\`sql
SELECT TOP (3)
       c.customer_name + ' (' + c.city + ')' AS customer,
       ISNULL(SUM(o.amount), 0) AS revenue,
       FORMAT(DATEFROMPARTS(YEAR(MIN(o.order_date)), MONTH(MIN(o.order_date)), 1), 'yyyy-MM') AS first_order_month
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
                  AND o.order_date >= '20250401' AND o.order_date < '20260401'
GROUP BY c.customer_name, c.city
ORDER BY revenue DESC;
\`\`\`

**MySQL**: \`CONCAT\`, \`IFNULL\`, \`DATE_FORMAT\`, \`LIMIT\`.

\`\`\`sql
SELECT CONCAT(c.customer_name, ' (', c.city, ')') AS customer,
       IFNULL(SUM(o.amount), 0) AS revenue,
       DATE_FORMAT(MIN(o.order_date), '%Y-%m') AS first_order_month
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
                  AND o.order_date >= '2025-04-01' AND o.order_date < '2026-04-01'
GROUP BY c.customer_name, c.city
ORDER BY revenue DESC
LIMIT 3;
\`\`\`

**Snowflake** is almost identical to PostgreSQL (the same double pipe, \`DATE_TRUNC\`, \`TO_CHAR\` and \`LIMIT\`), with one habit to remember: unquoted names are upper-cased.

**BigQuery**: a project and dataset in the table name, \`CONCAT\`, \`FORMAT_DATE\`, and no need to cast the date literal.

\`\`\`sql
SELECT CONCAT(c.customer_name, ' (', c.city, ')') AS customer,
       IFNULL(SUM(o.amount), 0) AS revenue,
       FORMAT_DATE('%Y-%m', MIN(o.order_date)) AS first_order_month
FROM \`my-project.kollana.customers\` AS c
LEFT JOIN \`my-project.kollana.orders\` AS o ON o.customer_id = c.customer_id
                  AND o.order_date >= DATE '2025-04-01' AND o.order_date < DATE '2026-04-01'
GROUP BY c.customer_name, c.city
ORDER BY revenue DESC
LIMIT 3;
\`\`\`

Notice what did **not** change: the join, the \`GROUP BY\`, the aggregates, the \`ORDER BY\`. Translation is a search-and-replace on a handful of function names, plus a check of the traps above.`,
    { sql: {
      title: 'The PostgreSQL version, and the traps it shows',
      starter: `-- 1) The report query in its PostgreSQL form (the SQL Server, MySQL and BigQuery forms are in the lesson text)
SELECT c.customer_name || ' (' || c.city || ')' AS customer,
       COALESCE(SUM(o.amount), 0) AS revenue,
       TO_CHAR(DATE_TRUNC('month', MIN(o.order_date)), 'YYYY-MM') AS first_order_month
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
                  AND o.order_date >= DATE '2025-04-01' AND o.order_date < DATE '2026-04-01'
GROUP BY c.customer_name, c.city
ORDER BY revenue DESC
LIMIT 3;

-- 2) Integer division: what PostgreSQL does, and the explicit, portable way
SELECT 5 / 2                       AS integer_division,
       5 / 2.0                     AS decimal_division,
       CAST(5 AS decimal(18, 2)) / 2 AS cast_then_divide,
       ROUND(100.0 * 1 / 3, 1)     AS percentage_with_100_point_zero;

-- 3) Case and NULL behaviour in PostgreSQL
SELECT ('a' = 'A')                          AS a_equals_A,
       (LOWER('a') = LOWER('A'))            AS lower_on_both_sides,
       'x' || NULL                          AS double_pipe_with_null,
       concat('x', NULL)                    AS concat_with_null,
       'x' || COALESCE(NULL, '')            AS portable_with_coalesce;

-- 4) NULL ordering: PostgreSQL puts NULLs last in ascending order. Say what you mean.
SELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY status;
SELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY status NULLS FIRST;

-- 5) Date arithmetic: subtracting two dates gives a number of days in PostgreSQL
SELECT DATE '2026-04-01' - DATE '2026-01-01' AS days_between,
       (DATE '2026-01-31' + INTERVAL '1 month')::date AS plus_one_month;`,
      note: 'Query 1 returns the three customers with the highest FY revenue and the month of their first order. Query 2: 5 / 2 is 2, 5 / 2.0 is 2.5, the cast version is also 2.5 (both numeric results are shown with many decimals), and the percentage is 33.3. Query 3: \'a\' = \'A\' is false, comparing LOWER on both sides is true, the double pipe with NULL gives NULL, concat gives x, and the COALESCE version gives x. Query 4: in ascending order the NULL status comes last, and with NULLS FIRST it comes first (the 9 orders without a status). Query 5: 90 days between 1 January and 1 April 2026, and 31 January plus one month is 28 February 2026 (PostgreSQL clips to the last day of the shorter month). All of these are facts about PostgreSQL: on the other engines the answers can differ, as the tables show.',
    } },
    `## Portable SQL
Sometimes you must write SQL that runs on **several** engines (a tool that supports all of them, a library of reports for different clients). The portable subset is the standard core, plus a few habits:

- Use \`CAST(x AS type)\` and \`CASE\` and \`COALESCE\`, not \`x::type\`, \`IIF\` or \`ISNULL\`.
- Use \`CURRENT_DATE\` and \`EXTRACT(YEAR FROM d)\` where available, and keep engine-specific date arithmetic in **one place** (a view or a macro), not scattered through queries.
- Prefer \`ROW_NUMBER() OVER (...)\` in a subquery over \`DISTINCT ON\` and \`QUALIFY\`. Prefer \`SUM(CASE WHEN ...)\` over \`FILTER\`. Use \`FETCH FIRST n ROWS ONLY\` (standard, in PostgreSQL, Snowflake, Oracle and newer SQL Server with \`OFFSET\`) where \`LIMIT\` or \`TOP\` would tie you to one engine.
- Quote nothing you do not need to, and name objects in lower case with underscores so case-folding differences do not matter.

Tools such as **dbt** help by adding a thin layer of macros over the dialect differences. Even then, the person who understands the differences is the one who finds the bug.`,
    { sql: {
      title: 'The same result three ways: engine-specific and portable',
      starter: `-- 1) A conditional sum: FILTER (PostgreSQL) against CASE (portable everywhere)
SELECT SUM(amount) FILTER (WHERE channel = 'Online')                  AS online_with_filter,
       SUM(CASE WHEN channel = 'Online' THEN amount END)              AS online_with_case
FROM orders;

-- 2) The first order of each customer: DISTINCT ON (PostgreSQL only) against ROW_NUMBER (portable, and the way QUALIFY is rewritten)
SELECT DISTINCT ON (customer_id) customer_id, order_id, amount
FROM orders
ORDER BY customer_id, amount DESC, order_id
LIMIT 4;

SELECT customer_id, order_id, amount
FROM (SELECT customer_id, order_id, amount,
             ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS rn
      FROM orders) t
WHERE rn = 1
ORDER BY customer_id
LIMIT 4;

-- 3) Are the two forms really identical? Rows in one and not in the other (expect 0 and 0)
SELECT (SELECT COUNT(*) FROM (SELECT DISTINCT ON (customer_id) customer_id, order_id FROM orders ORDER BY customer_id, amount DESC, order_id) a
        WHERE (customer_id, order_id) NOT IN (SELECT customer_id, order_id FROM (SELECT customer_id, order_id, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS rn FROM orders) t WHERE rn = 1)) AS only_in_distinct_on,
       (SELECT COUNT(*) FROM (SELECT customer_id, order_id FROM (SELECT customer_id, order_id, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS rn FROM orders) t WHERE rn = 1) b
        WHERE (customer_id, order_id) NOT IN (SELECT customer_id, order_id FROM (SELECT DISTINCT ON (customer_id) customer_id, order_id FROM orders ORDER BY customer_id, amount DESC, order_id) x)) AS only_in_row_number;

-- 4) Paging in standard SQL: FETCH FIRST works in PostgreSQL (and Snowflake, Oracle, newer SQL Server with OFFSET)
SELECT order_id, amount FROM orders ORDER BY amount DESC, order_id OFFSET 2 ROWS FETCH FIRST 3 ROWS ONLY;
SELECT order_id, amount FROM orders ORDER BY amount DESC, order_id LIMIT 3 OFFSET 2;`,
      note: 'The conditional sums agree: FILTER and CASE both give 6822430.00 for the Online channel. DISTINCT ON and ROW_NUMBER return the same first row per customer (customer 1 order 203 at 219450.00, customer 2 order 74 at 368000.00, and so on), and the comparison finds 0 rows only in one and 0 only in the other. The FETCH FIRST form and the LIMIT form return the same 3 rows (the 3rd to 5th largest amounts). Portable forms exist for everything the engine-specific shortcuts do.',
    } },
    `## Practice: translate to PostgreSQL
Each task gives you a query written for another engine in the **starter comments**. Write the PostgreSQL equivalent. The result is compared with the expected rows, so the translation must give the **same answer**, not just run.`,
    { challenge: {
      id: 'sql-dialects-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Translate the **SQL Server** query in the starter comments to PostgreSQL. It returns the five employees who have been employed the longest on 1 April 2026: `emp_name`, `pan` (with the text `MISSING` where PAN is NULL) and `days_employed` (days from `hire_date` to 2026-04-01). Sorted by `days_employed` descending. (5 rows.)',
      starter: `-- T-SQL (SQL Server):
-- SELECT TOP (5) emp_name, ISNULL(pan, 'MISSING') AS pan, DATEDIFF(day, hire_date, '20260401') AS days_employed
-- FROM employees
-- ORDER BY days_employed DESC;
SELECT emp_name FROM employees`,
      hint: "TOP (5) becomes LIMIT 5. ISNULL becomes COALESCE. DATEDIFF(day, a, b) is b - a for dates: DATE '2026-04-01' - hire_date.",
      solution: `SELECT emp_name, COALESCE(pan, 'MISSING') AS pan, DATE '2026-04-01' - hire_date AS days_employed
FROM employees
ORDER BY days_employed DESC
LIMIT 5`,
    } },
    { challenge: {
      id: 'sql-dialects-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Translate the **MySQL** query in the starter comments to PostgreSQL. It returns, per department, the employee names joined with `, ` in alphabetical order (`people`), the number of employees (`n`) and the month of the first hire as text `YYYY-MM` (`first_hire`). Sorted by `n` descending, then `department`. Return the columns `department, people, n, first_hire`. (5 rows.)',
      starter: `-- MySQL:
-- SELECT department,
--        GROUP_CONCAT(emp_name ORDER BY emp_name SEPARATOR ', ') AS people,
--        COUNT(*) AS n,
--        DATE_FORMAT(MIN(hire_date), '%Y-%m') AS first_hire
-- FROM employees
-- GROUP BY department
-- ORDER BY n DESC, department;
SELECT department FROM employees`,
      hint: "GROUP_CONCAT(x ORDER BY x SEPARATOR ', ') is string_agg(x, ', ' ORDER BY x). DATE_FORMAT(d, '%Y-%m') is TO_CHAR(d, 'YYYY-MM').",
      solution: `SELECT department,
       string_agg(emp_name, ', ' ORDER BY emp_name) AS people,
       COUNT(*) AS n,
       TO_CHAR(MIN(hire_date), 'YYYY-MM') AS first_hire
FROM employees
GROUP BY department
ORDER BY n DESC, department`,
    } },
    { challenge: {
      id: 'sql-dialects-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Translate the **Snowflake** query in the starter comments to PostgreSQL. For each customer it keeps only the **largest order** (ties broken by the smaller `order_id`) and returns `customer_id, order_id, amount`, `size` (`big` when the amount is above 100000, otherwise `small`) and `due_date` (the order date plus 30 days). Sorted by `customer_id`. PostgreSQL has no `QUALIFY`, so use a subquery or CTE. (11 rows, one per customer that has orders.)',
      starter: `-- Snowflake:
-- SELECT customer_id, order_id, amount,
--        IFF(amount > 100000, 'big', 'small') AS size,
--        DATEADD(day, 30, order_date) AS due_date
-- FROM orders
-- QUALIFY ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) = 1
-- ORDER BY customer_id;
SELECT customer_id FROM orders`,
      hint: "Put the ROW_NUMBER() in a CTE or subquery and filter rn = 1 outside (that is how QUALIFY is rewritten). IFF(c, a, b) is CASE WHEN c THEN a ELSE b END. DATEADD(day, 30, d) is d + 30 for a date.",
      solution: `WITH ranked AS (
  SELECT customer_id, order_id, amount, order_date,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, order_id) AS rn
  FROM orders
)
SELECT customer_id, order_id, amount,
       CASE WHEN amount > 100000 THEN 'big' ELSE 'small' END AS size,
       order_date + 30 AS due_date
FROM ranked
WHERE rn = 1
ORDER BY customer_id`,
    } },
    { real: 'Dialect knowledge pays off in three situations. **Migrations**: a client moves from SQL Server to Snowflake or from MySQL to PostgreSQL. You make a list of every function and trap from this lesson, translate with tests, and compare **row counts and totals** between old and new (the reconciliation habit of the last lesson). **Multi-client delivery**: you keep one logic definition (a dbt model or a view) and let a thin layer handle the dialect. **Reading other people\'s code**: knowing that \`DATEDIFF(day, a, b)\` and \`DATEDIFF(a, b)\` mean different things lets you spot a sign error in a report written for another engine. When in doubt, run the \`5 / 2\`, case and NULL tests from the lesson on the target engine first: they take a minute and have saved many projects from silent errors.' },
    { interview: '"The report works in PostgreSQL. We need it in Snowflake (or SQL Server). What do you check?" Model answer: "The shared core, the joins, grouping and window functions, should carry over unchanged. I translate the function names: limiting rows, date arithmetic and truncation, string functions and conditional functions, and I check whether the new engine supports shortcuts I used such as DISTINCT ON or FILTER. Then I look at behaviour, because that changes answers without errors: integer division, case-sensitive comparison, the ordering of NULLs, how NULL behaves in concatenation, time zone handling, and whether keys and constraints are enforced. I run both versions on the same data and compare row counts and totals, and I keep the translation in tests so a future change is caught." Follow-up: "Name three differences between T-SQL and PostgreSQL." (TOP against LIMIT, + against the double pipe for text, ISNULL and DATEDIFF against COALESCE and date subtraction, and case-insensitive default comparison).' },
    `## Recap
- About **nine tenths of SQL is shared** (select, joins, grouping, CTEs, window functions, CASE, COALESCE). The rest are **syntax differences** (which make a query fail) and **behaviour differences** (which silently change the answer). Learn the behaviour ones first.
- The five engines: **PostgreSQL**, **SQL Server (T-SQL)**, **MySQL**, **Snowflake**, **BigQuery**. The first three are row stores with indexes. Snowflake and BigQuery are columnar cloud warehouses: no OLTP indexes, partitioning and clustering instead, cost follows data scanned.
- Everyday differences: \`LIMIT\` against \`TOP\` (and \`OFFSET ... FETCH\`); text joined with the double pipe, \`+\` or \`CONCAT\`; \`DATEADD\`, \`DATEDIFF\` and \`DATE_TRUNC\` with different argument orders; \`COALESCE\` against \`ISNULL\` and \`IFNULL\`; \`IIF\`, \`IF\` and \`IFF\`; upsert syntax; \`QUALIFY\`, \`DISTINCT ON\` and \`FILTER\` only in some engines. Table names have 2, 3 or project-style parts.
- **Traps**: integer division (\`5 / 2\` is 2 in PostgreSQL and SQL Server), case-insensitive comparison in SQL Server and MySQL, NULL ordering and NULL in concatenation, informational keys in Snowflake and BigQuery, DDL that commits in MySQL and Snowflake, and time zone types.
- **Portable SQL**: \`CAST\`, \`CASE\`, \`COALESCE\`, \`ROW_NUMBER\` in a subquery, \`SUM(CASE ...)\`, \`FETCH FIRST\`; keep engine-specific bits in one place. **Test on the target engine** and compare row counts and totals.`,
  ],
  quiz: [
    { q: 'You move a query from PostgreSQL to MySQL. It computes `amount * 100 / total` with integer columns. What can happen?', o: ['Nothing, the result is identical', 'PostgreSQL returns a whole number, MySQL returns a decimal, so the percentages differ', 'MySQL raises a syntax error', 'MySQL returns NULL'], a: 1, why: 'Integer division of two integers gives an integer in PostgreSQL and SQL Server (5 / 2 is 2), but a decimal in MySQL, Snowflake and BigQuery (2.5). Cast one side explicitly so the intent is the same everywhere.' },
    { q: 'Which expression limits a query to the first 10 rows in SQL Server?', o: ['SELECT TOP (10) ...', 'SELECT ... LIMIT 10', 'SELECT ... FETCH 10', 'SELECT ... ROWNUM <= 10'], a: 0, why: 'T-SQL uses TOP. LIMIT is used by PostgreSQL, MySQL, Snowflake and BigQuery. Newer SQL Server also supports OFFSET ... FETCH after an ORDER BY.' },
    { q: 'In which pair of engines is `WHERE city = \'mumbai\'` likely to match the value `Mumbai` by default?', o: ['PostgreSQL and Snowflake', 'BigQuery and PostgreSQL', 'Snowflake and BigQuery', 'SQL Server and MySQL'], a: 3, why: 'SQL Server and MySQL use case-insensitive default collations. PostgreSQL, Snowflake and BigQuery compare text case-sensitively unless you say otherwise.' },
    { q: 'Snowflake and BigQuery let you declare a primary key. What happens if you insert a duplicate key value?', o: ['The statement fails, as in PostgreSQL', 'The old row is replaced', 'Nothing: the constraint is informational and is not enforced, so duplicates are accepted', 'The duplicate is moved to a quarantine table'], a: 2, why: 'In these warehouses primary and foreign keys document the model but do not enforce it. Data-quality checks must find duplicates and orphans.' },
    { q: 'Snowflake supports `QUALIFY ROW_NUMBER() OVER (...) = 1`. How do you write the same filter in PostgreSQL?', o: ['QUALIFY works in PostgreSQL too', 'Use HAVING instead', 'Use DISTINCT', 'Put the ROW_NUMBER() in a subquery or CTE and filter rn = 1 in the outer query'], a: 3, why: 'PostgreSQL has no QUALIFY, so the window function is computed in an inner query and filtered outside. DISTINCT ON is a PostgreSQL shortcut for the same idea.' },
    { q: 'You roll back a transaction that contained a `CREATE TABLE` and an `ALTER TABLE`. On which engines is the table really gone afterwards?', o: ['MySQL and Snowflake, where DDL is transactional', 'PostgreSQL and SQL Server, where DDL can be rolled back', 'All five engines', 'None of them'], a: 1, why: 'PostgreSQL and SQL Server allow DDL inside a transaction and roll it back. In MySQL and Snowflake most DDL commits implicitly, so a rollback cannot undo it.' },
  ],
  task: {
    title: 'Build your own dialect cheat sheet and translate three queries',
    steps: [
      'Create `36_dialects.sql` in `C:\\sql-practice` (a comment-heavy file). Copy the traps table from the lesson and add, for each row, the exact PostgreSQL query you ran to confirm the PostgreSQL column (for example `SELECT 5 / 2;` and `SELECT \'a\' = \'A\';`).',
      'Run the five queries of the first playground on your laptop PostgreSQL. Write down any difference from the lesson notes and the PostgreSQL version from `SELECT version();`.',
      'Take three of your own earlier queries (a window-function query, a date-bucket query and a string-aggregation query) and write the T-SQL, MySQL and Snowflake or BigQuery version of each as comments. Underline in a comment every function you had to change.',
      'Translate the three practice challenges in the opposite direction: write the Snowflake or T-SQL version of your PostgreSQL solution, with the changes in comments.',
      'If you have access to another engine (SQL Server Express or Developer, a BigQuery sandbox, a Snowflake trial: check each vendor\'s current page for what is free and what the terms are), run the `5 / 2`, case and NULL-ordering tests there and record the real answers next to the table in the lesson.',
      'Write a half-page "migration checklist" for moving a report from PostgreSQL to another engine: syntax list, behaviour list, and the reconciliation queries you would run (row counts and totals) to prove the result is the same.',
    ],
    deliverable: '`36_dialects.sql` with your cheat sheet, the PostgreSQL confirmation queries and results, the three translated queries with the changes marked, the reverse translations of the practice tasks, and the migration checklist.',
  },
};
