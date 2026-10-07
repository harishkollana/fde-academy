// Hidden setup for the procedure playground.
const BANK = `CREATE TABLE bank_accounts (acct text PRIMARY KEY, balance numeric(12,2) NOT NULL CHECK (balance >= 0));
INSERT INTO bank_accounts VALUES ('OPS', 100000.00), ('PAYROLL', 50000.00), ('TAX', 20000.00);
CREATE TABLE transfer_log (log_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, from_acct text, to_acct text, amount numeric(12,2));`;

export default {
  id: 'sql-functions-procedures',
  title: 'Functions, procedures and triggers: logic inside the database',
  goal: 'You can write SQL and PL/pgSQL functions and procedures, explain function volatility, build an audit trigger, and decide when a rule belongs in the database and when it does not.',
  roadmap: [
    'SQL and PL/pgSQL functions',
    'Procedures and DO blocks',
    'Audit triggers',
    'When logic belongs in the database',
  ],
  blocks: [
    `## The problem
The rule for working out GST on an invoice is written in **four places**: in an Excel template, in a Power BI measure, in a Python script and in a SQL report. Each was written by a different person, and each rounds slightly differently. Once a month the totals differ by a few paise and nobody knows which one is right.

A second problem: the product price list is changed by three people and two scripts, and last Friday a price dropped by 20%. Nobody can say **who** did it, or **when**, because the change went straight into the table.

A third: moving money between two accounts takes three steps (check, debit, credit, log). Every program that does it has to remember all of them, in the right order.

PostgreSQL can hold the logic itself, so that there is **one** version of the rule that **every** client uses. It offers three tools. A **function** calculates a value and can be used inside a query. A **procedure** runs a multi-step job that you start with \`CALL\`. A **trigger** reacts automatically when a row changes. Used well, they remove whole classes of disagreement. Used carelessly, they hide business logic where nobody looks for it. This lesson teaches the tools and, just as important, the judgement of when to use them.`,
    `## Functions
A function takes inputs and returns a value. The simplest kind is written in plain SQL:

\`\`\`sql
CREATE FUNCTION gst_amount(taxable numeric, rate numeric DEFAULT 18)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$ SELECT ROUND(taxable * rate / 100, 2) $$;
\`\`\`
Now every client calls the same rule: \`SELECT gst_amount(41460)\`, \`gst_amount(41460, 12)\`, or with names, \`gst_amount(rate => 5, taxable => 1000)\`. The body sits between \`$$ … $$\`, which is just a quoting style that saves you from doubling every single quote. \`CREATE OR REPLACE FUNCTION\` changes the body later without breaking the callers. A function can also return a **table**: \`RETURNS TABLE (customer_id int, total numeric)\`, and you use it in \`FROM\` like a table.

Functions with the **same name but different argument types** are different functions (overloading), so \`DROP FUNCTION\` must name the argument types: \`DROP FUNCTION gst_amount(numeric, numeric)\`.

### Volatility: a promise you make to the planner
Every function carries a promise about how it behaves, and the planner uses it:

- **\`IMMUTABLE\`**: the same inputs give the same output, **always**, and nothing else is read. \`abs\`, \`upper\` and your \`gst_amount\` qualify. The planner may calculate it once, and only an \`IMMUTABLE\` function may be used in an **index expression**.
- **\`STABLE\`**: the same inputs give the same result **within one statement**, but it may differ between statements. It may read tables or the clock or the session settings. \`now()\` and \`to_char\` are stable.
- **\`VOLATILE\`** (the **default**): the result may change at any call, or the function has side effects. \`random()\` and \`clock_timestamp()\` are volatile. The planner calls it every time and never caches it.

The promise must be **true**. If you mark a function \`IMMUTABLE\` and it reads a table, indexes built on it can silently go wrong. A subtle built-in example from the dates lesson: \`date_trunc(text, timestamp)\` is immutable, but \`date_trunc(text, timestamptz)\` is only **stable**, because its answer depends on the session time zone. If you try \`CREATE INDEX … (my_volatile_fn(col))\`, PostgreSQL stops you: *functions in index expression must be marked IMMUTABLE*. The default of \`VOLATILE\` is safe but slow, so **mark your pure functions \`IMMUTABLE\`**.`,
    { sketch: { w: 760, h: 262, caption: 'Volatility: how much you promise the planner. More promises let it do more.', items: [
      { t: 'box', x: 14, y: 22, w: 225, h: 66, label: 'IMMUTABLE', sub: 'same input, same output', fill: 'blue', size: 21 },
      { t: 'box', x: 269, y: 22, w: 225, h: 66, label: 'STABLE', sub: 'same within one statement', fill: 'green', size: 21 },
      { t: 'box', x: 524, y: 22, w: 225, h: 66, label: 'VOLATILE', sub: 'may change on every call', fill: 'orange', size: 21 },
      { t: 'arrow', x1: 241, y1: 55, x2: 267, y2: 55 },
      { t: 'arrow', x1: 496, y1: 55, x2: 522, y2: 55 },
      { t: 'note', x: 14, y: 104, w: 225, h: 96, fill: 'blue', size: 14, text: 'abs, upper, gst_amount\nCan be calculated once.\nAllowed in index\nexpressions.' },
      { t: 'note', x: 269, y: 104, w: 225, h: 96, fill: 'green', size: 14, text: 'now(), to_char, a function\nthat reads a table.\nCalled once per statement\nat most.' },
      { t: 'note', x: 524, y: 104, w: 225, h: 96, fill: 'orange', size: 14, text: 'random(), clock_timestamp,\nanything with side effects.\nCalled every time,\nnever cached.' },
      { t: 'note', x: 14, y: 214, w: 735, h: 36, fill: 'yellow', size: 15, text: 'The default is VOLATILE. Mark pure functions IMMUTABLE, but only if it is true.' },
    ] } },
    { sql: {
      title: 'Writing and using SQL functions',
      starter: `-- 1) The GST rule, written once
CREATE FUNCTION gst_amount(taxable numeric, rate numeric DEFAULT 18)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT ROUND(taxable * rate / 100, 2) $$;

-- 2) A fiscal-year label, from the dates lesson, as a function
CREATE FUNCTION fy_label(d date)
RETURNS text LANGUAGE sql IMMUTABLE
AS $$ SELECT 'FY ' || EXTRACT(YEAR FROM (d - INTERVAL '3 months'))::int
              || '-' || RIGHT((EXTRACT(YEAR FROM (d - INTERVAL '3 months'))::int + 1)::text, 2) $$;

-- 3) A format check that treats NULL as invalid (the NULL trap from the strings lesson, solved once)
CREATE FUNCTION is_valid_ifsc(code text)
RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$ SELECT COALESCE(code ~ '^[A-Z]{4}0[A-Z0-9]{6}$', false) $$;

-- Use them like any built-in function
SELECT gst_amount(41460) AS default_18, gst_amount(41460, 12) AS at_12, gst_amount(rate => 5, taxable => 1000) AS named_args;
SELECT fy_label(DATE '2025-04-01') AS apr_2025, fy_label(DATE '2026-03-31') AS mar_2026, fy_label(DATE '2026-04-01') AS apr_2026;
SELECT emp_id, ifsc, is_valid_ifsc(ifsc) AS valid FROM employees WHERE emp_id IN (1, 7, 14) ORDER BY emp_id;

-- The function in a real query: which GST slab does each purchase invoice follow?
SELECT COUNT(*) FILTER (WHERE gst_amount = gst_amount(taxable_value, 18)) AS slab_18,
       COUNT(*) FILTER (WHERE gst_amount = gst_amount(taxable_value, 12)) AS slab_12,
       COUNT(*) FILTER (WHERE gst_amount = gst_amount(taxable_value, 5))  AS slab_5
FROM purchase_register;

-- The promises PostgreSQL makes for some built-ins
SELECT DISTINCT proname,
       CASE provolatile WHEN 'i' THEN 'immutable' WHEN 's' THEN 'stable' ELSE 'volatile' END AS volatility
FROM pg_proc
WHERE pronamespace = 'pg_catalog'::regnamespace
  AND proname IN ('abs', 'upper', 'now', 'random', 'clock_timestamp')
ORDER BY proname;`,
      note: 'The GST rule gives 7,462.80 for 41,460 at the default 18% and 4,975.20 at 12%, and the named-argument call (1,000 at 5%) gives 50.00. The fiscal labels are FY 2025-26, FY 2025-26 and FY 2026-27. Employee 1 has a valid IFSC, while 7 and 14 do not. In the register 16 invoices follow the 18% slab, 9 follow 12% and 5 follow 5%, which adds up to the 30 invoices. The built-ins are abs and upper immutable, now stable, and random and clock_timestamp volatile.',
    } },
    `## PL/pgSQL: when one query is not enough
A SQL function is a single query. When you need **variables, branches and loops**, use **PL/pgSQL**, PostgreSQL's procedural language. A block has a \`DECLARE\` part for variables and a \`BEGIN … END\` body:

\`\`\`sql
CREATE FUNCTION classify_amount(a numeric) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF a IS NULL THEN RAISE EXCEPTION 'amount is required'; END IF;
  IF a >= 200000 THEN RETURN 'Large';
  ELSIF a >= 50000 THEN RETURN 'Medium';
  END IF;
  RETURN 'Small';
END; $$;
\`\`\`
The tools you need: \`IF / ELSIF\`, \`FOR r IN SELECT … LOOP\`, \`RETURN\`, \`RETURN QUERY\` (a function that returns rows), \`PERFORM\` (run a query and ignore the result), \`RAISE EXCEPTION '…'\` to stop with a clear message, and **\`EXCEPTION WHEN … THEN\`** to catch an error and carry on. You have already used that last one: the \`DO\` blocks in the constraints lesson caught each failed insert. An \`EXCEPTION\` clause makes PostgreSQL start a hidden **savepoint**, so everything inside the block is undone when the error is caught, and it costs a little time, so use it where you really need it.

**A warning about loops.** A \`FOR … LOOP\` in PL/pgSQL handles **one row at a time**, which is slow for large data. If a plain SQL statement can do the job (\`SUM\`, a join, an \`UPDATE … FROM\`), use it. The database is built for **sets**, not for loops. A \`DO\` block is an anonymous PL/pgSQL block that runs once, handy for one-off scripts.`,
    { sql: {
      title: 'PL/pgSQL: branches, errors and a loop you should not need',
      starter: `CREATE FUNCTION classify_amount(a numeric) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF a IS NULL THEN RAISE EXCEPTION 'amount is required'; END IF;
  IF a >= 200000 THEN RETURN 'Large';
  ELSIF a >= 50000 THEN RETURN 'Medium';
  END IF;
  RETURN 'Small';
END; $$;

-- Catch an error inside the function and return NULL instead
CREATE FUNCTION safe_div(a numeric, b numeric) RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN a / b;
EXCEPTION WHEN division_by_zero THEN
  RETURN NULL;
END; $$;

-- A function that returns rows
CREATE FUNCTION top_customers(n int)
RETURNS TABLE (customer_id int, total numeric) LANGUAGE sql STABLE AS $$
  SELECT o.customer_id, SUM(o.amount)
  FROM orders o
  GROUP BY o.customer_id
  ORDER BY SUM(o.amount) DESC
  LIMIT n
$$;

SELECT classify_amount(210000) AS big, classify_amount(60000) AS medium, classify_amount(1000) AS small;
SELECT safe_div(10, 4) AS ok, safe_div(10, 0) IS NULL AS null_instead_of_error;
SELECT * FROM top_customers(3);

-- A loop that adds up the big orders one by one ...
DO $$
DECLARE
  r record; total numeric := 0; n int := 0;
BEGIN
  FOR r IN SELECT amount FROM orders WHERE amount >= 300000 LOOP
    total := total + r.amount;
    n := n + 1;
  END LOOP;
  CREATE TABLE loop_result AS SELECT n AS orders, total AS total_amount;
END $$;

-- ... gives exactly what one set-based statement gives
SELECT * FROM loop_result;
SELECT COUNT(*) AS orders, SUM(amount) AS total_amount FROM orders WHERE amount >= 300000;

-- Remove the dashes to see the function's own error:
-- SELECT classify_amount(NULL);`,
      note: 'The three classes are Large, Medium and Small. safe_div returns 2.5 and NULL for a division by zero. The three best customers are 6 (29,42,475), 10 (29,26,680) and 2 (25,32,500). The loop and the single SUM agree on 10 orders worth 36,24,800.00, but the SUM is shorter, clearer and much faster on a big table.',
    } },
    `## Procedures: multi-step jobs you CALL
A **procedure** is started with \`CALL\` instead of being used inside a query. It does not return a value. It is the right tool for a job with several steps. The big difference from a function: a procedure may contain **\`COMMIT\` and \`ROLLBACK\`** (when it is not called from inside a transaction already), which is what lets a long batch job commit in chunks.

Here is the money transfer that every program used to repeat, written once. It brings together the lessons of this module: validation, **locking in a fixed order** (so two transfers cannot deadlock), the \`CHECK\` constraint that guards the balance, and a log row:

\`\`\`sql
CREATE PROCEDURE transfer(p_from text, p_to text, p_amount numeric)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'amount must be positive, got %', p_amount; END IF;
  IF p_from = p_to THEN RAISE EXCEPTION 'cannot transfer to the same account'; END IF;
  PERFORM 1 FROM bank_accounts WHERE acct IN (p_from, p_to) ORDER BY acct FOR UPDATE;
  UPDATE bank_accounts SET balance = balance - p_amount WHERE acct = p_from;
  UPDATE bank_accounts SET balance = balance + p_amount WHERE acct = p_to;
  INSERT INTO transfer_log (from_acct, to_acct, amount) VALUES (p_from, p_to, p_amount);
END; $$;
\`\`\`
The whole body runs in the caller's transaction. If any step fails (the account would go below zero, the amount is negative) the error undoes **every** step, so a transfer is all or nothing and the log never shows a half-done transfer.`,
    { sql: {
      title: 'A transfer procedure, and the calls that must fail',
      setup: BANK,
      starter: `CREATE PROCEDURE transfer(p_from text, p_to text, p_amount numeric)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'amount must be positive, got %', p_amount; END IF;
  IF p_from = p_to THEN RAISE EXCEPTION 'cannot transfer to the same account'; END IF;
  PERFORM 1 FROM bank_accounts WHERE acct IN (p_from, p_to) ORDER BY acct FOR UPDATE;   -- always the same lock order
  UPDATE bank_accounts SET balance = balance - p_amount WHERE acct = p_from;
  UPDATE bank_accounts SET balance = balance + p_amount WHERE acct = p_to;
  INSERT INTO transfer_log (from_acct, to_acct, amount) VALUES (p_from, p_to, p_amount);
END; $$;

-- Try one good call and three bad ones. Each result is recorded, so we can see all four.
CREATE TABLE call_tests (n serial, test text, result text);
DO $$
BEGIN
  BEGIN CALL transfer('OPS', 'PAYROLL', 10000);
    INSERT INTO call_tests (test, result) VALUES ('10,000 from OPS to PAYROLL', 'done');
  EXCEPTION WHEN OTHERS THEN INSERT INTO call_tests (test, result) VALUES ('10,000 from OPS to PAYROLL', SQLERRM); END;
  BEGIN CALL transfer('TAX', 'OPS', 25000);
    INSERT INTO call_tests (test, result) VALUES ('25,000 from TAX, which holds 20,000', 'done');
  EXCEPTION WHEN OTHERS THEN INSERT INTO call_tests (test, result) VALUES ('25,000 from TAX, which holds 20,000', SQLERRM); END;
  BEGIN CALL transfer('OPS', 'OPS', 5);
    INSERT INTO call_tests (test, result) VALUES ('OPS to OPS', 'done');
  EXCEPTION WHEN OTHERS THEN INSERT INTO call_tests (test, result) VALUES ('OPS to OPS', SQLERRM); END;
  BEGIN CALL transfer('OPS', 'PAYROLL', -5);
    INSERT INTO call_tests (test, result) VALUES ('negative amount', 'done');
  EXCEPTION WHEN OTHERS THEN INSERT INTO call_tests (test, result) VALUES ('negative amount', SQLERRM); END;
END $$;

SELECT test, result FROM call_tests ORDER BY n;
SELECT acct, balance FROM bank_accounts ORDER BY acct;
SELECT log_id, from_acct, to_acct, amount FROM transfer_log ORDER BY log_id;`,
      note: 'Only the first call succeeds. The overdraft is stopped by the CHECK constraint (violates check constraint "bank_accounts_balance_check"), the same-account call and the negative amount by the procedure\'s own messages. The balances are OPS 90,000, PAYROLL 60,000 and TAX 20,000, and the log holds exactly one row: the failed calls changed nothing.',
    } },
    `## Triggers: the database reacts by itself
A **trigger** runs a function automatically when rows are inserted, updated or deleted. Two pieces: a **trigger function** (it \`RETURNS trigger\`) and a \`CREATE TRIGGER\` that attaches it. Inside, \`NEW\` is the row being written and \`OLD\` is the row before the change. \`TG_OP\` says which operation fired it.

- **\`BEFORE\`** triggers run before the row is written. They can **change \`NEW\`** (set \`updated_on\`, tidy a value) or return \`NULL\` to **skip** the row.
- **\`AFTER\`** triggers run after the row is written. They are the place for **audit** rows, because the change has happened.
- **\`FOR EACH ROW\`** runs once per row, \`FOR EACH STATEMENT\` once per statement.
- **\`WHEN (condition)\`** limits when it fires, and it can use \`OLD\` and \`NEW\` but not \`TG_OP\`. That is why an audit trigger for updates and one for deletes are written as **two triggers**, or the function checks \`TG_OP\` itself.

An **audit trigger** answers the problem of the silent price drop. This version logs a price update only when the price **really changed**, so a re-run or a change to another column adds nothing:

\`\`\`sql
CREATE TRIGGER price_list_audit_upd AFTER UPDATE ON price_list
  FOR EACH ROW WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION trg_price_audit();
\`\`\`
\`changed_by\` is a column with \`DEFAULT current_user\`, so the trigger records **who** did it without any help from the application. Because the audit row is written inside the same transaction as the change, the two commit or roll back **together**.`,
    { sketch: { w: 760, h: 270, caption: 'The life of one UPDATE with two triggers. The audit row and the change commit together.', items: [
      { t: 'box', x: 10, y: 28, w: 130, h: 66, label: 'UPDATE', sub: 'price = 120', fill: 'blue', size: 19 },
      { t: 'box', x: 163, y: 28, w: 130, h: 66, label: 'BEFORE', sub: 'sets updated_on', fill: 'yellow', size: 19 },
      { t: 'box', x: 316, y: 28, w: 130, h: 66, label: 'row written', sub: 'a new version', fill: 'grey', size: 17 },
      { t: 'box', x: 469, y: 28, w: 130, h: 66, label: 'AFTER', sub: 'logs the change', fill: 'orange', size: 19 },
      { t: 'box', x: 622, y: 28, w: 128, h: 66, label: 'COMMIT', sub: 'all or nothing', fill: 'green', size: 19 },
      { t: 'arrow', x1: 142, y1: 61, x2: 161, y2: 61 },
      { t: 'arrow', x1: 295, y1: 61, x2: 314, y2: 61 },
      { t: 'arrow', x1: 448, y1: 61, x2: 467, y2: 61 },
      { t: 'arrow', x1: 601, y1: 61, x2: 620, y2: 61 },
      { t: 'note', x: 143, y: 116, w: 170, h: 72, fill: 'grey', size: 14, text: 'Can change NEW, or\nreturn NULL to skip\nthe row.' },
      { t: 'note', x: 439, y: 116, w: 156, h: 72, fill: 'grey', size: 14, text: 'WHEN (OLD.price IS\nDISTINCT FROM\nNEW.price)' },
      { t: 'note', x: 610, y: 116, w: 140, h: 72, fill: 'grey', size: 14, text: 'The audit row and\nthe change are one\ntransaction.' },
      { t: 'note', x: 10, y: 206, w: 740, h: 50, fill: 'yellow', size: 15, text: 'A no-op update (the price is already 120) fires the BEFORE trigger but not the audit trigger,\nso the audit table only records real changes.' },
    ] } },
    { sql: {
      title: 'An updated_on trigger and a price audit',
      starter: `CREATE TABLE price_list (sku text PRIMARY KEY, price numeric(10,2) NOT NULL, updated_on date);
CREATE TABLE price_audit (
  audit_id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku        text, old_price numeric, new_price numeric, op text,
  changed_by text DEFAULT current_user               -- who did it, without the application's help
);

-- BEFORE trigger: keep updated_on current
CREATE FUNCTION trg_set_updated() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_on := DATE '2026-09-04';
  RETURN NEW;
END $$;
CREATE TRIGGER price_list_updated BEFORE UPDATE ON price_list
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated();

-- AFTER triggers: audit real price changes and deletes
CREATE FUNCTION trg_price_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO price_audit (sku, old_price, new_price, op) VALUES (OLD.sku, OLD.price, NEW.price, TG_OP);
  ELSE
    INSERT INTO price_audit (sku, old_price, new_price, op) VALUES (OLD.sku, OLD.price, NULL, TG_OP);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER price_list_audit_upd AFTER UPDATE ON price_list
  FOR EACH ROW WHEN (OLD.price IS DISTINCT FROM NEW.price) EXECUTE FUNCTION trg_price_audit();
CREATE TRIGGER price_list_audit_del AFTER DELETE ON price_list
  FOR EACH ROW EXECUTE FUNCTION trg_price_audit();

INSERT INTO price_list VALUES ('SKU-A', 100, DATE '2026-01-01'), ('SKU-B', 200, DATE '2026-01-01');

UPDATE price_list SET price = 120 WHERE sku = 'SKU-A';                       -- a real change
UPDATE price_list SET price = 120 WHERE sku = 'SKU-A';                       -- a no-op: nothing is audited
UPDATE price_list SET updated_on = DATE '2026-09-04' WHERE sku = 'SKU-B';    -- another column: nothing is audited
DELETE FROM price_list WHERE sku = 'SKU-B';                                  -- a delete is audited

SELECT sku, price, updated_on FROM price_list ORDER BY sku;
SELECT audit_id, sku, old_price, new_price, op, changed_by FROM price_audit ORDER BY audit_id;
SELECT tgname FROM pg_trigger WHERE tgrelid = 'price_list'::regclass AND NOT tgisinternal ORDER BY tgname;`,
      note: 'SKU-A now costs 120.00 and its updated_on was set by the BEFORE trigger to 2026-09-04. The audit table has exactly two rows: the update of SKU-A from 100.00 to 120.00 and the delete of SKU-B (old price 200.00, new price empty), both with changed_by postgres. The repeated update and the update of the other column left no trace. Three triggers are listed.',
    } },
    { warn: 'Triggers are **invisible** to someone reading the application code, run for **every row** (a bulk load of a million rows fires a million trigger calls), and can trigger each other. Keep trigger functions short and **fast**, do not call external services from them (a slow API inside a transaction holds locks the whole time), and document every trigger next to the table. If a rule can be a constraint (`CHECK`, `UNIQUE`, a foreign key), make it a constraint, which is simpler, faster and visible in the table definition.' },
    `## When does logic belong in the database?
| Put it in the database | Keep it in the application or the pipeline |
|---|---|
| **Invariants** that must hold for every writer: constraints first, triggers when a constraint cannot say it | **Workflows** with human approval, retries and notifications |
| **Audit trails** and derived columns such as \`updated_on\` | Calls to **external services** (APIs, e-mail, queues) |
| A **calculation shared by many clients**: GST, fiscal year, a validation format | Logic that changes often, needs **unit tests** in CI and a normal release process |
| **Set-based data work** that is faster next to the data (a nightly procedure) | Heavy computation that must **scale out** across machines |
| **Permissions**: functions with \`SECURITY DEFINER\`, covered in the next lesson | Complicated branching that nobody wants to debug in SQL |

Two rules keep database code healthy. **Version it like any code**: every function, procedure and trigger lives in a numbered script in Git (\`CREATE OR REPLACE FUNCTION\` is made for that), and changes go through review. And **test it**: a small script with calls and expected results, run on a copy. (The \`pgTAP\` extension offers a proper test framework on a real server, but extensions are not installed in the browser playground.) The honest summary is that the database is the best place for **rules about data**, and a poor place for **business processes**.`,
    `## Practice
Challenges are single \`SELECT\` statements, so they cannot create functions. They practise the **logic** a function or a trigger would hold, and the **catalog** that describes it.`,
    { challenge: {
      id: 'sql-functions-procedures-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Would the transfers succeed? The accounts and requests are in the starter. For each request return `transfer_id, status`: `same account` if the two accounts are equal, `insufficient funds` if the source balance is lower than the amount, otherwise `ok`. These are the checks of the `transfer` procedure. Sort by `transfer_id`. (4 rows: ok, insufficient funds, ok, same account.)',
      starter: `WITH accts(acct, balance) AS (
  VALUES ('OPS', 100000), ('PAYROLL', 50000), ('TAX', 20000)
),
req(transfer_id, from_acct, to_acct, amount) AS (
  VALUES (1, 'OPS', 'PAYROLL', 10000),
         (2, 'TAX', 'OPS', 25000),
         (3, 'PAYROLL', 'TAX', 50000),
         (4, 'OPS', 'OPS', 500)
)
SELECT r.transfer_id
FROM req r
ORDER BY r.transfer_id`,
      hint: 'JOIN req r to accts a ON a.acct = r.from_acct, then a CASE: first the same-account test, then a.balance < r.amount, then ELSE ok. Transfer 3 moves exactly the whole balance, which is allowed.',
      solution: `WITH accts(acct, balance) AS (
  VALUES ('OPS', 100000), ('PAYROLL', 50000), ('TAX', 20000)
),
req(transfer_id, from_acct, to_acct, amount) AS (
  VALUES (1, 'OPS', 'PAYROLL', 10000),
         (2, 'TAX', 'OPS', 25000),
         (3, 'PAYROLL', 'TAX', 50000),
         (4, 'OPS', 'OPS', 500)
)
SELECT r.transfer_id,
       CASE WHEN r.from_acct = r.to_acct THEN 'same account'
            WHEN a.balance < r.amount THEN 'insufficient funds'
            ELSE 'ok' END AS status
FROM req r
JOIN accts a ON a.acct = r.from_acct
ORDER BY r.transfer_id`,
    } },
    { challenge: {
      id: 'sql-functions-procedures-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Read the volatility promise from the catalog. For the built-in functions `abs`, `upper`, `now`, `random` and `clock_timestamp` in the schema `pg_catalog`, return `proname, volatility` where `volatility` is the word `immutable`, `stable` or `volatile` (from the `provolatile` column of `pg_proc`: `i`, `s` or `v`). One row per function, sorted by `proname`. (5 rows.)',
      hint: "SELECT DISTINCT proname, CASE provolatile WHEN 'i' THEN 'immutable' WHEN 's' THEN 'stable' ELSE 'volatile' END FROM pg_proc WHERE pronamespace = 'pg_catalog'::regnamespace AND proname IN (...).",
      solution: `SELECT DISTINCT proname,
       CASE provolatile WHEN 'i' THEN 'immutable' WHEN 's' THEN 'stable' ELSE 'volatile' END AS volatility
FROM pg_proc
WHERE pronamespace = 'pg_catalog'::regnamespace
  AND proname IN ('abs', 'upper', 'now', 'random', 'clock_timestamp')
ORDER BY proname`,
    } },
    { challenge: {
      id: 'sql-functions-procedures-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Review an audit table. The price changes are in the starter. Return the changes of **more than 10% in either direction**: `audit_id, sku, pct_change, changed_by`, where `pct_change = 100 * (new_price - old_price) / old_price` rounded to 1 decimal. A change of exactly 10% is not included. Sort by `audit_id`. (2 rows: audit 4 with 25.0 by admin and audit 6 with -20.0 by intern.)',
      starter: `WITH price_audit(audit_id, sku, old_price, new_price, changed_by) AS (
  VALUES (1, 'SKU-LAP-01', 92000, 96600, 'pricing_team'),
         (2, 'SKU-MOU-04', 1800, 1890, 'pricing_team'),
         (3, 'SKU-LAP-01', 96600, 86940, 'intern'),
         (4, 'SKU-LIC-05', 36000, 45000, 'admin'),
         (5, 'SKU-SUP-06', 15000, 15750, 'pricing_team'),
         (6, 'SKU-HDD-08', 8900, 7120, 'intern')
)
SELECT audit_id
FROM price_audit
ORDER BY audit_id`,
      hint: 'Calculate 100.0 * (new_price - old_price) / old_price once and test ABS(...) > 10 in the WHERE. Audit 3 is exactly -10.0 and must not be returned.',
      solution: `WITH price_audit(audit_id, sku, old_price, new_price, changed_by) AS (
  VALUES (1, 'SKU-LAP-01', 92000, 96600, 'pricing_team'),
         (2, 'SKU-MOU-04', 1800, 1890, 'pricing_team'),
         (3, 'SKU-LAP-01', 96600, 86940, 'intern'),
         (4, 'SKU-LIC-05', 36000, 45000, 'admin'),
         (5, 'SKU-SUP-06', 15000, 15750, 'pricing_team'),
         (6, 'SKU-HDD-08', 8900, 7120, 'intern')
)
SELECT audit_id, sku,
       ROUND(100.0 * (new_price - old_price) / old_price, 1) AS pct_change,
       changed_by
FROM price_audit
WHERE ABS(100.0 * (new_price - old_price) / old_price) > 10
ORDER BY audit_id`,
    } },
    { real: 'In a finance data platform the useful database code is small and boring: a handful of shared **functions** (GST and rounding, fiscal year, format checks), one or two **procedures** for nightly set-based jobs, and **audit triggers** on the tables that matter (prices, bank details, approval limits, journal status). The audit table is what you open when an auditor asks "who changed this vendor\'s bank account, and when?" Everything else, the orchestration, the notifications, the retries, belongs in the pipeline tools you meet in later phases (Airflow, Dagster, Python), where it can be tested and monitored properly.' },
    { interview: '"What is the difference between a function and a procedure, what are the volatility categories, and when would you use a trigger?" Model answer: "A function returns a value and can be used inside a query, while a procedure is run with CALL, returns nothing and can commit or roll back inside it. Volatility tells the planner what to expect: IMMUTABLE gives the same output for the same input forever and is needed for index expressions, STABLE is constant within one statement, and VOLATILE (the default) can change on every call. I use triggers sparingly, mainly for audit trails and derived columns like updated_at, with a WHEN clause so they only fire on real changes. Rules that a CHECK, UNIQUE or foreign key can express should be constraints, and workflows or calls to external services should stay out of the database." Follow-ups: "Why avoid row-by-row loops in PL/pgSQL?" (set-based SQL is far faster) and "what does SECURITY DEFINER mean?" (the function runs with its owner\'s privileges, see the security lesson).' },
    `## Recap
- **SQL functions** hold a calculation written once (\`gst_amount\`, \`fy_label\`, \`is_valid_ifsc\`). \`CREATE OR REPLACE\` changes the body, named arguments and defaults make calls readable, and \`RETURNS TABLE\` gives a function you can select from.
- **Volatility** is a promise to the planner: \`IMMUTABLE\` (same input, same output, allowed in index expressions), \`STABLE\` (same within a statement; \`now()\`), \`VOLATILE\` (the default; \`random()\`). The promise must be true.
- **PL/pgSQL** adds variables, \`IF\`, loops, \`RAISE EXCEPTION\` and \`EXCEPTION WHEN\` (which creates a savepoint). Prefer set-based SQL to loops: the loop and \`SUM\` both give 36,24,800.00, but \`SUM\` is faster.
- **Procedures** are started with \`CALL\`, return no value, and may commit or roll back inside. The \`transfer\` procedure validates, locks in a fixed order, relies on the \`CHECK\`, logs, and is all or nothing.
- **Triggers** react to row changes: \`BEFORE\` can change \`NEW\`, \`AFTER\` audits. \`WHEN (OLD.col IS DISTINCT FROM NEW.col)\` fires only on real changes, and \`WHEN\` cannot use \`TG_OP\`. Keep them short and visible, and never call an external service from one.
- Database logic suits **rules about data** (constraints, audit, shared calculations), not **business processes**. Keep it in numbered scripts in Git and test it.`,
  ],
  quiz: [
    { q: 'Your function always returns the same output for the same input and reads nothing else (gst_amount). Which volatility fits?', o: ['VOLATILE', 'STABLE', 'DETERMINISTIC', 'IMMUTABLE'], a: 3, why: 'IMMUTABLE tells the planner that the result never changes for the same input, so it may pre-calculate it and you may use the function in an index expression.' },
    { q: 'What can a procedure do that a function cannot?', o: ['Return a value', 'Contain COMMIT or ROLLBACK (when not called inside an existing transaction)', 'Use IF statements', 'Be called inside a SELECT'], a: 1, why: 'A procedure is started with CALL and may control transactions, which lets a batch job commit in chunks. A function runs inside the transaction of its caller.' },
    { q: 'Why does `CREATE INDEX ON employees (my_function(emp_id))` fail with "functions in index expression must be marked IMMUTABLE"?', o: ['The function is not marked IMMUTABLE, so the index could return wrong results if the output changed', 'Indexes cannot be created on functions', 'The function has too many arguments', 'emp_id is not a text column'], a: 0, why: 'The index stores the function result at write time. If the result could change later (STABLE or VOLATILE), the stored entries would be wrong, so PostgreSQL requires IMMUTABLE.' },
    { q: 'You want the audit trigger to log an UPDATE only when the price really changed. What do you add?', o: ['A second table', 'FOR EACH STATEMENT', 'WHEN (OLD.price IS DISTINCT FROM NEW.price)', 'RETURN NULL in a BEFORE trigger'], a: 2, why: 'A WHEN condition on the trigger limits when it fires. IS DISTINCT FROM also treats NULL correctly. (WHEN cannot use TG_OP, so updates and deletes get separate triggers.)' },
    { q: 'A PL/pgSQL FOR loop adds up order amounts one by one, and a SUM gives the same result. Which should you prefer?', o: ['The loop, because it is procedural', 'The SUM: set-based SQL is shorter and much faster than row-by-row loops', 'Both are equally fast', 'The loop, because SUM cannot add numeric values'], a: 1, why: 'The database is optimised for sets. A loop makes one trip per row, which is slow on large tables.' },
    { q: 'Which of these should NOT be done inside a database trigger?', o: ['Setting an updated_on column', 'Writing an audit row', 'Rejecting a row that breaks a rule', 'Calling an external web service for each row'], a: 3, why: 'A trigger runs inside the transaction and holds locks while it works. A slow external call makes every writer wait, and the call cannot be rolled back with the transaction.' },
  ],
  task: {
    title: 'Write shared rules and an audit trail on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `25_functions.sql` in `C:\\sql-practice`. Write `gst_amount`, `fy_label` and `is_valid_ifsc` as SQL functions marked IMMUTABLE, and test them on `purchase_register`, `orders` and `employees` (expect the slab counts 16, 9 and 5).',
      'Query the catalog for the volatility of `now`, `abs`, `random` and `date_trunc` (note the two kinds of date_trunc). Then try to create an index on a VOLATILE function and write the error in a comment.',
      'Create `bank_accounts`, `transfer_log` and the `transfer` procedure. Call it with one good transfer and the three bad ones (one at a time, in autocommit mode) and write the four outcomes in comments. Check that the balances and the log did not change after the failures.',
      'Create `price_list`, `price_audit` and the two triggers. Make four changes (a real price change, the same change again, a change of another column, a delete) and show that exactly two audit rows appear.',
      'Write a short paragraph in the file: one rule you would put in the database for the Kollana data, one you would keep in the application, and why.',
    ],
    deliverable: '`25_functions.sql` with the three functions, the volatility query and index error, the transfer procedure and its four outcomes, the triggers with the two audit rows, and your paragraph.',
  },
};
