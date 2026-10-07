export default {
  id: 'sql-modelling',
  title: 'Data modelling basics: normalisation, keys, star schemas and history',
  goal: 'You can explain why data is split into tables (normalisation, 1NF to 3NF), choose keys, read and build a star schema with a date dimension, and keep history with a slowly changing dimension (Type 1 versus Type 2).',
  roadmap: [
    'Normalisation 1NF to 3NF',
    'Surrogate and natural keys',
    'Star-schema basics: facts, dimensions, grain, date dimension',
    'SCD basics (runnable)',
  ],
  blocks: [
    `## The problem
A colleague sends you "the orders file": **one big sheet**. Every row has the order, the customer's name and city, the product's name, category and price. It looks convenient, because everything is in one place. Then the questions start.

- Customer 7 moves from Hyderabad to Bengaluru. In the sheet that means changing **26 rows**. If you change 25 and miss one, the sheet now says the customer lives in two cities, and every report that groups by city is wrong.
- A new customer signs up but has not ordered yet. There is **no row** to put them in.
- You delete the last order of a customer, and the customer **disappears** from your records.

These three are classic **anomalies**, and they all have one cause: the same fact is stored **in many places**. **Normalisation** is the discipline of storing each fact **once**. It is the reason the Kollana database has separate \`customers\`, \`products\` and \`orders\` tables.

But there is a second job. When you build **reports**, you want the opposite: few joins, easy columns, predictable shapes. That is a **star schema**. A data engineer needs both ideas, and needs to know when to use which. This lesson covers normalisation, keys, the star, and how to keep **history** when a fact changes.`,
    `## Normalisation in three steps
Think of it as one sentence: **every column should depend on the key, the whole key, and nothing but the key.**

- **First normal form (1NF): atomic values.** One value per cell, no repeating groups, and every row identified by a key. A cell that holds \`R-001, R-002\` (two receipts) breaks it: you cannot filter, count or join on one receipt. Give each receipt its own row. (A \`jsonb\` or array column is a deliberate exception, chosen knowingly.)
- **Second normal form (2NF): the whole key.** If the key has **several columns**, every other column must depend on **all** of them. In an order-lines table keyed by \`(order_id, product_id)\`, the \`product_name\` depends only on \`product_id\`. It belongs in a \`products\` table.
- **Third normal form (3NF): nothing but the key.** A column must not depend on **another non-key column**. In an employee table, if \`department_head\` depends on \`department\`, and \`department\` depends on \`emp_id\`, then the head depends on the key only **through** the department. Move it to a \`departments\` table.`,
    { sketch: { w: 760, h: 306, caption: 'The three steps, each with the kind of mistake it removes. A table in 3NF stores every fact once.', items: [
      { t: 'box', x: 14, y: 28, w: 225, h: 62, label: '1NF', sub: 'atomic values + a key', fill: 'blue', size: 22 },
      { t: 'arrow', x1: 241, y1: 59, x2: 267, y2: 59 },
      { t: 'box', x: 269, y: 28, w: 225, h: 62, label: '2NF', sub: 'the WHOLE key', fill: 'green', size: 22 },
      { t: 'arrow', x1: 496, y1: 59, x2: 522, y2: 59 },
      { t: 'box', x: 524, y: 28, w: 225, h: 62, label: '3NF', sub: 'nothing BUT the key', fill: 'yellow', size: 22 },
      { t: 'note', x: 14, y: 108, w: 225, h: 124, fill: 'pink', size: 14, text: 'Breaks it:\nthe cell "R-001, R-002"\nholds two receipts.\n\nFix: one receipt\nper row.' },
      { t: 'note', x: 269, y: 108, w: 225, h: 124, fill: 'pink', size: 14, text: 'Breaks it:\nproduct_name depends on\nproduct_id only, but the\nkey is (order_id,\nproduct_id).\nFix: a products table.' },
      { t: 'note', x: 524, y: 108, w: 225, h: 124, fill: 'pink', size: 14, text: 'Breaks it:\ndepartment_head depends\non department, not on\nemp_id.\n\nFix: a departments\ntable.' },
      { t: 'note', x: 14, y: 246, w: 735, h: 48, fill: 'yellow', size: 15, text: '"The key, the whole key, and nothing but the key."  The result: every fact is stored\nonce, so there is nothing to forget to update.' },
    ] } },
    `The Kollana tables follow these rules. To see why, build the **opposite**: a flat table that joins orders, customers and products into one, which is what a spreadsheet export looks like, and measure what goes wrong.`,
    { sql: {
      title: 'The flat table and its three anomalies',
      starter: `-- What an Excel export looks like: orders, customers and products in one table
CREATE TABLE orders_flat AS
SELECT o.order_id, o.order_date, o.qty, o.amount,
       c.customer_id, c.customer_name, c.city AS customer_city, c.segment,
       p.product_id, p.product_name, p.category, p.unit_price
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN products  p ON p.product_id  = o.product_id;

-- 1) Redundancy and a lost record: 220 orders but only 219 rows, 12 customers but only 10 in the flat table
SELECT COUNT(*)                    AS flat_rows,
       COUNT(DISTINCT customer_id) AS customers_in_flat,
       (SELECT COUNT(*) FROM customers) AS customers_in_customers_table
FROM orders_flat;

-- 2) Deletion/insertion anomaly: these customers cannot exist in the flat table (no orders yet)
SELECT customer_id, customer_name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders_flat f WHERE f.customer_id = c.customer_id)
ORDER BY customer_id;

-- 3) Update anomaly: the city of customer 7 is stored 26 times. Change only the first row ...
UPDATE orders_flat SET customer_city = 'Bengaluru'
WHERE order_id = (SELECT MIN(order_id) FROM orders_flat WHERE customer_id = 7);

-- ... and the table now has two truths for one customer
SELECT customer_city, COUNT(*) AS rows_with_this_city
FROM orders_flat
WHERE customer_id = 7
GROUP BY customer_city
ORDER BY rows_with_this_city DESC;

-- In the normalised design the city lives in ONE row, and one UPDATE is enough
UPDATE customers SET city = 'Bengaluru' WHERE customer_id = 7;
SELECT c.city, COUNT(*) AS orders_seeing_it
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE o.customer_id = 7
GROUP BY c.city;`,
      note: 'The flat table has 219 rows for 220 orders (order 77 has no customer, so the inner join drops it) and only 10 of the 12 customers: Kite Media (11) and Lotus Motors (12) vanish because they have no orders. After the partial update customer 7 has 25 rows saying Hyderabad and 1 saying Bengaluru. In the normalised tables one UPDATE changes the city for all 26 orders at once.',
    } },
    `### Normalise on purpose, denormalise on purpose
Normalise the systems that **change** data (the OLTP side from the foundations phase): orders, claims, payroll entry. There the cost of an update anomaly is a wrong number in the books. **Denormalise** the systems that **read** data (the warehouse and reports), where joins cost time and nobody updates a row after it is loaded. The flat table is not "wrong". It is wrong **as the place where data is entered**, and fine as a **report** that is rebuilt from the normalised tables.

## Keys: natural, surrogate, composite
- A **natural key** is a value from the business: GSTIN, invoice number, SKU, IFSC. It is meaningful and already known, but it can **change** (a GSTIN changes when a company moves state), be **typed wrongly**, or **repeat** across sources.
- A **surrogate key** is a meaningless number the database creates (\`GENERATED ALWAYS AS IDENTITY\`). It never changes, it is small and fast to join, and it says nothing about the row.
- A **composite key** has several columns, like \`fx_rates (currency, rate_month)\`. It is fine when the combination is truly stable, as an exchange rate for a month is.

The common practice: a **surrogate primary key**, plus a **\`UNIQUE\` constraint on the natural key**, so the business rule "one row per GSTIN" is still enforced. Foreign keys point at the surrogate. When the natural key has to change, you update **one** row and nothing that references it breaks.`,
    { sql: {
      title: 'A surrogate key with a unique natural key',
      starter: `CREATE TABLE vendor (
  vendor_id  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- surrogate: never changes
  gstin      text NOT NULL UNIQUE,                               -- natural key: still protected
  name       text NOT NULL
);
CREATE TABLE vendor_invoice (
  invoice_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vendor_id  integer NOT NULL REFERENCES vendor (vendor_id),     -- points at the surrogate
  invoice_no text NOT NULL,
  amount     numeric(12,2) NOT NULL,
  UNIQUE (vendor_id, invoice_no)                                 -- natural key of an invoice: composite
);

INSERT INTO vendor (gstin, name) VALUES ('29AAHCN9902L1ZX', 'Nandi Electricals'), ('37AABCG4471E1Z1', 'Godavari Chemicals');
INSERT INTO vendor_invoice (vendor_id, invoice_no, amount)
SELECT vendor_id, 'INV/0001/25-26', 41460.00 FROM vendor WHERE gstin = '29AAHCN9902L1ZX';
INSERT INTO vendor_invoice (vendor_id, invoice_no, amount)
SELECT vendor_id, 'INV/0002/25-26', 83525.00 FROM vendor WHERE gstin = '29AAHCN9902L1ZX';

-- The supplier's GSTIN was recorded wrongly. One UPDATE fixes it; the invoices are untouched
UPDATE vendor SET gstin = '29AAHCN9902L1ZY' WHERE gstin = '29AAHCN9902L1ZX';

SELECT v.gstin, v.name, i.invoice_no, i.amount
FROM vendor_invoice i
JOIN vendor v ON v.vendor_id = i.vendor_id
ORDER BY i.invoice_id;`,
      note: 'Both invoices still belong to Nandi Electricals and now show the corrected GSTIN. Had the GSTIN been the primary key, every invoice row would have needed the change, or the foreign keys would have refused it. The UNIQUE constraint on gstin still blocks a second vendor with the same GSTIN.',
    } },
    `## The star schema: how a warehouse is shaped
A warehouse keeps data in two kinds of tables.

- A **fact table** records **events with numbers**: a journal line, an order, a payroll run. Its columns are **measures** (debit, credit, amount) and **keys** to the dimensions. It is long and grows all the time.
- A **dimension table** describes the **who, what, where, when** of the facts: entity, business unit, account, product, customer, date. It is wide, short, and full of text you group and filter by.

Before anything else you must state the **grain**: **what does one row of the fact table mean?** For \`fact_gl\` it is **one journal line**. Every measure and every key must be true at that grain. Most modelling mistakes are a grain that was never written down. If you do not know what one row means, you cannot tell whether a total is correct.

Draw the fact table in the middle and the dimensions around it, and the picture looks like a **star**. Queries become simple and uniform: join the fact to the dimensions you need, filter on their attributes, and group by them. When a dimension is itself split into several tables (accounts with parent accounts) people call it a **snowflake**. Both work. The star is easier to read and faster to join.`,
    { sketch: { w: 760, h: 322, caption: 'The Kollana ledger as a star. fact_gl is the center, one row per journal line. The date dimension is the one you will build below.', items: [
      { t: 'box', x: 300, y: 118, w: 160, h: 86, label: 'fact_gl', sub: 'grain: one journal line', fill: 'yellow', size: 22 },
      { t: 'box', x: 20, y: 24, w: 190, h: 62, label: 'dim_entity', sub: 'code, name, currency', fill: 'blue', size: 17 },
      { t: 'box', x: 20, y: 130, w: 190, h: 62, label: 'dim_bu', sub: 'code, name', fill: 'blue', size: 17 },
      { t: 'box', x: 20, y: 236, w: 190, h: 62, label: 'dim_account', sub: 'name, type, parent', fill: 'blue', size: 17 },
      { t: 'box', x: 572, y: 130, w: 170, h: 62, label: 'dim_date', sub: 'FY, quarter, weekday', fill: 'green', size: 17 },
      { t: 'arrow', x1: 298, y1: 138, x2: 212, y2: 70, label: 'entity_id', lx: 23, ly: -20 },
      { t: 'arrow', x1: 298, y1: 162, x2: 212, y2: 162, label: 'bu_id', lx: 0, ly: -10 },
      { t: 'arrow', x1: 298, y1: 188, x2: 212, y2: 250, label: 'account_id', lx: 27, ly: 19 },
      { t: 'arrow', x1: 462, y1: 162, x2: 570, y2: 162, label: 'posting_date', lx: 0, ly: -10 },
      { t: 'note', x: 334, y: 232, w: 406, h: 70, fill: 'grey', size: 14, text: 'Measures: debit, credit.  Keys: one to each dimension.\nA report joins the fact to the dimensions it needs, filters on their\nattributes and groups by them.' },
    ] } },
    `### The date dimension
The most useful dimension of all is the **calendar**. Instead of calculating the fiscal year, the fiscal quarter, the weekday and "is it a weekend" in every query, build a \`dim_date\` table **once**, with one row per day, and join every fact to it on its date. The fiscal-year trick from the dates lesson (move the date back three months) then lives in one place. You can add holiday flags and "working day number" there too, which no date function can know.`,
    { sql: {
      title: 'Build a date dimension and report with it',
      starter: `-- One row per day of FY 2025-26, with the fiscal attributes worked out once
CREATE TABLE dim_date AS
SELECT d::date                                              AS date_key,
       EXTRACT(YEAR  FROM d)::int                           AS cal_year,
       EXTRACT(MONTH FROM d)::int                           AS cal_month,
       TO_CHAR(d, 'Mon')                                    AS month_name,
       EXTRACT(YEAR FROM (d - INTERVAL '3 months'))::int    AS fiscal_year,
       (EXTRACT(MONTH FROM d)::int + 8) % 12 + 1            AS fiscal_month,
       'Q' || (((EXTRACT(MONTH FROM d)::int + 8) % 12) / 3 + 1) AS fiscal_quarter,
       EXTRACT(ISODOW FROM d) >= 6                          AS is_weekend
FROM generate_series(DATE '2025-04-01', DATE '2026-03-31', INTERVAL '1 day') AS d;
ALTER TABLE dim_date ADD PRIMARY KEY (date_key);

SELECT COUNT(*) AS days, COUNT(*) FILTER (WHERE is_weekend) AS weekend_days FROM dim_date;

-- A star query: the fact table joined to the dimension, grouped by its attributes
SELECT dd.fiscal_quarter,
       COUNT(*)      AS orders,
       SUM(o.amount) AS total_amount
FROM orders o
JOIN dim_date dd ON dd.date_key = o.order_date
GROUP BY dd.fiscal_quarter
ORDER BY dd.fiscal_quarter;

SELECT CASE WHEN dd.is_weekend THEN 'Weekend' ELSE 'Weekday' END AS day_type,
       COUNT(*) AS orders
FROM orders o
JOIN dim_date dd ON dd.date_key = o.order_date
GROUP BY 1
ORDER BY 1;

-- The same dimension serves every fact table: journal lines per fiscal quarter
SELECT dd.fiscal_quarter, COUNT(*) AS gl_lines
FROM fact_gl g
JOIN dim_date dd ON dd.date_key = g.posting_date
GROUP BY dd.fiscal_quarter
ORDER BY dd.fiscal_quarter;`,
      note: 'FY 2025-26 has 365 days, 104 of them at weekends. Orders per fiscal quarter are 38, 59, 59 and 64 (totals 35,23,075, 59,11,115, 54,40,325 and 61,05,760), the same numbers as in the dates lesson, but no query had to know the fiscal rules. 156 orders were placed on weekdays and 64 at weekends. The journal lines split almost evenly across the quarters: 308, 307, 306 and 306.',
    } },
    `## History: slowly changing dimensions
Dimensions change. An employee moves from Sales to Finance. A supplier gets a new name. A product changes category. The question is: **what happens to the old reports?** There are a few standard answers, called **slowly changing dimension (SCD)** types:

- **Type 1: overwrite.** Update the row. Simple, no history. Every old fact is now described by the **new** value.
- **Type 2: add a row.** Close the old row with an end date and insert a new row with a start date. The old facts keep pointing to the old description. This is the standard for history.
- **Type 3: add a column** (\`previous_department\`). Keeps one step of history. Rarely used.

Why it matters is easiest to see in numbers. Employee 6 is paid ₹1,08,333.33 in August and ₹2,59,999.99 in September 2026, and **moves from Sales to Finance on 1 September**. How much did Sales cost in **August**? Under Type 1, the department column is overwritten, so a report on August payroll is now **wrong**: it says ₹5,00,000.00. Under Type 2, August is still described by the department the employee had **at the time**, and the answer stays ₹6,08,333.33.`,
    { sketch: { w: 760, h: 306, caption: 'Employee 6 moves to Finance on 1 September 2026. Type 1 overwrites the row and loses the past. Type 2 keeps both rows and says when each was true.', items: [
      { t: 'table', x: 20, y: 56, title: 'Type 1: overwrite', cols: ['emp_id', 'department'], colW: [90, 150], rows: [['6', 'Finance']], fill: 'pink' },
      { t: 'note', x: 20, y: 152, w: 250, h: 84, fill: 'pink', size: 14, text: 'August payroll of employee 6\nis now reported under Finance.\nThe old report cannot be\nrebuilt.' },
      { t: 'table', x: 310, y: 56, title: 'Type 2: add a row', cols: ['emp_id', 'department', 'valid_from', 'valid_to', 'current'], colW: [60, 100, 105, 105, 70], rows: [['6', 'Sales', '2015-01-01', '2026-08-31', 'no'], ['6', 'Finance', '2026-09-01', '9999-12-31', 'yes']], fill: 'green', hl: [1] },
      { t: 'note', x: 310, y: 152, w: 440, h: 84, fill: 'green', size: 14, text: 'A fact joins the row whose validity range contains its date:\nAugust payroll (1 Aug 2026) falls in the Sales row,\nSeptember payroll (1 Sep 2026) falls in the Finance row.\nJoin condition: run_month BETWEEN valid_from AND valid_to.' },
      { t: 'note', x: 20, y: 250, w: 730, h: 44, fill: 'yellow', size: 15, text: 'Use Type 1 for corrections (a typo in a name).\nUse Type 2 when the old value was true and reports must remember it.' },
    ] } },
    { sql: {
      title: 'Type 1 against Type 2, on the payroll',
      starter: `-- Department cost per month, with every employee in the department they have today (no history yet)
SELECT e.department,
       SUM(p.gross_pay) FILTER (WHERE p.run_month = DATE '2026-08-01') AS august,
       SUM(p.gross_pay) FILTER (WHERE p.run_month = DATE '2026-09-01') AS september
FROM payroll p
JOIN employees e ON e.emp_id = p.emp_id
GROUP BY e.department
ORDER BY e.department;

-- TYPE 2: a history table with one open row per employee, then employee 6 moves to Finance on 1 Sep 2026
CREATE TABLE emp_history AS
SELECT emp_id, department,
       DATE '2015-01-01' AS valid_from,
       DATE '9999-12-31' AS valid_to
FROM employees;

BEGIN;
UPDATE emp_history SET valid_to = DATE '2026-08-31'
WHERE emp_id = 6 AND valid_to = DATE '9999-12-31';                     -- close the old row
INSERT INTO emp_history (emp_id, department, valid_from, valid_to)
VALUES (6, 'Finance', DATE '2026-09-01', DATE '9999-12-31');          -- open the new one
COMMIT;

-- Point-in-time join: each payroll run uses the department that was valid on its date
SELECT h.department,
       SUM(p.gross_pay) FILTER (WHERE p.run_month = DATE '2026-08-01') AS august,
       SUM(p.gross_pay) FILTER (WHERE p.run_month = DATE '2026-09-01') AS september
FROM payroll p
JOIN emp_history h ON h.emp_id = p.emp_id
                  AND p.run_month BETWEEN h.valid_from AND h.valid_to
GROUP BY h.department
ORDER BY h.department;

-- TYPE 1 for comparison: just overwrite the employee row
UPDATE employees SET department = 'Finance' WHERE emp_id = 6;

SELECT e.department,
       SUM(p.gross_pay) FILTER (WHERE p.run_month = DATE '2026-08-01') AS august,
       SUM(p.gross_pay) FILTER (WHERE p.run_month = DATE '2026-09-01') AS september
FROM payroll p
JOIN employees e ON e.emp_id = p.emp_id
GROUP BY e.department
ORDER BY e.department;`,
      note: 'Before any change Sales costs 6,08,333.33 in August and 7,59,999.99 in September (employee 6 is a Sales employee, and the September figure includes the jump of 2.4 times). With Type 2, Sales keeps 6,08,333.33 in August and falls to 5,00,000.00 in September, while Finance gets the 2,59,999.99 only from September: 14,33,333.35 in August and 16,93,333.34 in September. With Type 1, August is rewritten: Sales shows 5,00,000.00 and Finance 15,41,666.68, so a report you already published can no longer be reproduced.',
    } },
    { warn: 'The playground makes every Type 2 change in **two steps** (close the old row, insert the new one). Always do both in **one transaction**: if the first runs and the second does not, the employee has no current row, and every join to the history table drops them. The module on data-engineering patterns shows how to do the whole thing with a single `MERGE` and how to keep it idempotent.' },
    `## A modelling checklist
1. **Start from the questions**, not from the source files. Who will ask what, and by which attributes?
2. **Write the grain** of every fact table in one sentence.
3. **Normalise** the tables where data is entered; **denormalise** (star) the tables where it is read.
4. Give every table a **primary key** and every relationship a **foreign key**. Surrogate keys for identity, a unique constraint for the business key.
5. Build a **date dimension**. Decide on a Type 1 or Type 2 policy for each dimension **before** the data arrives.
6. Use consistent **names**: snake_case, the same name for the same thing everywhere (\`entity_id\`, not \`ent\` in one table and \`company_no\` in another), \`dim_\` and \`fact_\` prefixes, and no reserved words.
7. **Document** each table: grain, owner, source, refresh schedule.

The next phases build on this. The \`modelling\` phase turns it into a full warehouse design, dbt builds the star with SQL models, and the SCD lesson in the data-engineering module does Type 2 with \`MERGE\`.`,
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-modelling-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Use a calendar built inside the query (a CTE with `generate_series` for 1 April 2025 to 31 March 2026 and the flag `is_weekend`, ISO weekday 6 or 7) and join `orders` to it on `order_date`. Return `day_type, orders` with the text `Weekday` or `Weekend`, sorted by `day_type`. (2 rows: 156 and 64.)',
      hint: "WITH cal AS (SELECT d::date AS date_key, EXTRACT(ISODOW FROM d) >= 6 AS is_weekend FROM generate_series(DATE '2025-04-01', DATE '2026-03-31', INTERVAL '1 day') AS d), then JOIN orders o ON o.order_date = cal.date_key and GROUP BY the CASE.",
      solution: `WITH cal AS (
  SELECT d::date AS date_key, EXTRACT(ISODOW FROM d) >= 6 AS is_weekend
  FROM generate_series(DATE '2025-04-01', DATE '2026-03-31', INTERVAL '1 day') AS d
)
SELECT CASE WHEN cal.is_weekend THEN 'Weekend' ELSE 'Weekday' END AS day_type,
       COUNT(*) AS orders
FROM orders o
JOIN cal ON cal.date_key = o.order_date
GROUP BY 1
ORDER BY 1`,
    } },
    { challenge: {
      id: 'sql-modelling-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Grain check. The grain of `fact_gl` is "one journal line", so no two lines should be identical apart from `gl_id`. Return the combinations that **break** it: group by `journal_id, entity_id, bu_id, account_id, posting_date, currency, debit, credit, source_system` and return `journal_id, account_id, copies` for the groups with more than one row. Sort by `journal_id`. (3 rows, each with 2 copies.)',
      hint: 'GROUP BY all nine business columns and HAVING COUNT(*) > 1; select journal_id, account_id and COUNT(*) AS copies.',
      solution: `SELECT journal_id, account_id, COUNT(*) AS copies
FROM fact_gl
GROUP BY journal_id, entity_id, bu_id, account_id, posting_date, currency, debit, credit, source_system
HAVING COUNT(*) > 1
ORDER BY journal_id`,
    } },
    { challenge: {
      id: 'sql-modelling-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Type 2 point-in-time report. The employee history and the payroll are in the starter. Return the payroll cost per month and department using the department that was **valid on the run date**: `run_month, department, gross_total`. Sort by `run_month`, then `department`. (4 rows: employee 6 is in Sales in August and in Finance in September.)',
      starter: `WITH emp_history(emp_id, department, valid_from, valid_to) AS (
  VALUES (6, 'Sales',   DATE '2015-06-01', DATE '2026-08-31'),
         (6, 'Finance', DATE '2026-09-01', DATE '9999-12-31'),
         (8, 'HR',      DATE '2016-07-14', DATE '9999-12-31')
),
payroll(emp_id, run_month, gross_pay) AS (
  VALUES (6, DATE '2026-08-01', 108333.33), (6, DATE '2026-09-01', 259999.99),
         (8, DATE '2026-08-01', 166666.67), (8, DATE '2026-09-01', 166666.67)
)
SELECT run_month
FROM payroll
ORDER BY run_month`,
      hint: 'JOIN emp_history h ON h.emp_id = p.emp_id AND p.run_month BETWEEN h.valid_from AND h.valid_to, then GROUP BY p.run_month, h.department.',
      solution: `WITH emp_history(emp_id, department, valid_from, valid_to) AS (
  VALUES (6, 'Sales',   DATE '2015-06-01', DATE '2026-08-31'),
         (6, 'Finance', DATE '2026-09-01', DATE '9999-12-31'),
         (8, 'HR',      DATE '2016-07-14', DATE '9999-12-31')
),
payroll(emp_id, run_month, gross_pay) AS (
  VALUES (6, DATE '2026-08-01', 108333.33), (6, DATE '2026-09-01', 259999.99),
         (8, DATE '2026-08-01', 166666.67), (8, DATE '2026-09-01', 166666.67)
)
SELECT p.run_month, h.department, SUM(p.gross_pay) AS gross_total
FROM payroll p
JOIN emp_history h
  ON h.emp_id = p.emp_id
 AND p.run_month BETWEEN h.valid_from AND h.valid_to
GROUP BY p.run_month, h.department
ORDER BY p.run_month, h.department`,
    } },
    { real: 'Most of the arguments in a data team are modelling arguments in disguise: "why does this total not match that one" (different grain), "why did last year\'s report change" (a Type 1 overwrite), "why is our customer count 12 here and 10 there" (a flat table that lost the customers without orders). Write the grain and the history policy next to every table, and a new colleague, an auditor and your future self can all answer those questions in a minute. When you design a table for a Power Automate flow or a FastAPI service, start from the normalised design with keys and constraints. When you design for Power BI, shape a star with a date dimension.' },
    { interview: '"Explain normalisation and when you would denormalise. What is a star schema, and what is a slowly changing dimension?" Model answer: "Normalisation stores each fact once so there are no update, insert or delete anomalies: 1NF means atomic values, 2NF means every column depends on the whole key, and 3NF means nothing depends on a non-key column. I normalise operational tables, where data is changed, and denormalise for analytics, where data is read: a star schema has a fact table at a stated grain with measures and keys, surrounded by dimension tables with descriptive attributes, and a date dimension. A slowly changing dimension is a dimension whose attributes change over time. Type 1 overwrites and loses history, Type 2 closes the old row and adds a new one with validity dates, so facts are joined to the version that was valid on their date, and Type 3 keeps a previous-value column." Follow-up: "surrogate or natural key?" (surrogate primary key plus a unique constraint on the natural key).' },
    `## Recap
- **Normalisation** stores each fact once: 1NF atomic values and a key, 2NF the **whole** key, 3NF **nothing but** the key. The flat orders table shows the anomalies: customer 7's city stored 26 times, customers 11 and 12 missing, one update leaving two truths.
- Normalise where data is **entered**, denormalise where it is **read**.
- **Surrogate** primary key (identity) plus a **unique** natural key. Composite keys when the combination is stable (\`currency\`, \`rate_month\`).
- A **star schema** is a fact table at a written **grain** (\`fact_gl\`: one journal line) with dimensions around it. Build a **date dimension** once: fiscal year, quarter and weekend flag live there.
- **SCD Type 1** overwrites and rewrites old reports (Sales' August payroll drops from 6,08,333.33 to 5,00,000.00). **Type 2** adds a row with \`valid_from\` and \`valid_to\`, and facts join with \`run_month BETWEEN valid_from AND valid_to\`. Do the close-and-insert in one transaction.
- Checklist: questions first, grain in one sentence, keys everywhere, consistent names, documented tables.`,
  ],
  quiz: [
    { q: 'You delete the last order of a customer from a flat orders table and the customer disappears from the data. Which anomaly is this?', o: ['Update anomaly', 'Deletion anomaly', 'Insert anomaly', 'Grain anomaly'], a: 1, why: 'The customer exists only inside the order rows, so removing the last row removes the only record of the customer. A separate customers table avoids it.' },
    { q: 'A column depends on another non-key column (department_head depends on department). Which normal form does this violate?', o: ['1NF', '2NF', '3NF', 'None: it is fine'], a: 2, why: '3NF says every column must depend on the key and nothing but the key. The department head depends on the department, so it belongs in a departments table.' },
    { q: 'Why use a surrogate key plus a UNIQUE constraint on the natural key (GSTIN)?', o: ['The surrogate key never changes and is small to join on, while the UNIQUE constraint still enforces one row per GSTIN', 'Natural keys cannot be indexed', 'Surrogate keys are required by PostgreSQL', 'It makes the table smaller than having no key'], a: 0, why: 'A GSTIN can change or be recorded wrongly. With a surrogate key the correction touches one row and the foreign keys stay valid, and the unique constraint prevents duplicates.' },
    { q: 'What is the grain of fact_gl?', o: ['One row per account', 'One row per entity per month', 'One row per journal', 'One row per journal line'], a: 3, why: 'Each row is a single debit or credit line of a journal. The grain is the statement of what one row means, and every measure and key must be true at that level.' },
    { q: 'How does a Type 2 slowly changing dimension keep history?', o: ['It overwrites the old value', 'It adds a column called previous_value', 'It closes the old row and inserts a new row with validity dates, so a fact joins the row valid on its date', 'It deletes the old fact rows'], a: 2, why: 'Type 2 keeps one row per version with valid_from and valid_to. Facts are joined with date BETWEEN valid_from AND valid_to.' },
    { q: 'Why did a Type 1 overwrite of an employee\'s department change a report that was already published?', o: ['Because the old department value is overwritten, so every old fact is now described by the new value', 'Because the fact table was also updated', 'Because Type 1 deletes the employee', 'Because reports cannot be repeated'], a: 0, why: 'There is only one row per employee. After the overwrite, the join gives every payroll run the new department, including runs made before the move.' },
  ],
  task: {
    title: 'Normalise, build a star and keep history on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `24_modelling.sql` in `C:\\sql-practice`. Build `orders_flat` with `CREATE TABLE AS` and show the three anomalies with numbers (219 rows, 10 of 12 customers, 25 + 1 city rows after a partial update). Drop the flat table afterwards.',
      'Create `vendor` and `vendor_invoice` with a surrogate primary key, a `UNIQUE` GSTIN and a composite unique key on the invoice. Correct a GSTIN with one UPDATE and show that the invoices still join.',
      'Build `dim_date` for FY 2025-26 (365 rows, 104 weekend days) with a primary key, and write the quarterly orders report through it (expect 38, 59, 59 and 64). Add a column `is_month_end` and use it to count GL lines on month ends.',
      'Create `emp_history`, move employee 6 to Finance on 1 September 2026 inside one transaction, and produce the department payroll report for August and September under Type 2 and under Type 1. Write the two Sales figures for August in a comment (6,08,333.33 and 5,00,000.00).',
      'Write a one-paragraph model note for `fact_gl` in the file: the grain, the measures, the dimensions, and the history policy you would choose for each dimension.',
    ],
    deliverable: '`24_modelling.sql` with the flat-table anomalies, the surrogate-key demo, `dim_date` and its reports, the SCD comparison and the model note.',
  },
};
