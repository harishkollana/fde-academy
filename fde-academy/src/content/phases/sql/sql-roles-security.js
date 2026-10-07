export default {
  id: 'sql-roles-security',
  title: 'Roles, privileges and row-level security: who can see and change what',
  goal: 'You can design roles with least privilege, use GRANT and REVOKE (including column-level grants), restrict rows with row-level security, expose sensitive data only through views or SECURITY DEFINER functions, and prevent SQL injection with parameters.',
  roadmap: [
    'Roles, GRANT and REVOKE, schemas',
    'Row-level security',
    'SQL injection and prepared statements',
  ],
  blocks: [
    `## The problem
Four things went wrong in one quarter at a company like Kollana Tech.

1. The BI analyst needs customers and orders for a dashboard. The easiest way to give access was the \`postgres\` password, so now the dashboard connection can also read every employee's **PAN and bank account number**, and could delete the ledger.
2. The Singapore finance team must see **only SG01** journal lines. Their Power BI model contains a "filter" for it, but anyone who opens the database with another tool sees everything.
3. The nightly ETL job runs as a **superuser** "because it was simpler". A bug in it dropped a table that nobody had asked it to touch.
4. A web form builds its search query by gluing the typed city name into the SQL text. A test user typed a strange sentence into the box and got **every customer back**.

All four are failures of **security by design**, and PostgreSQL has a precise tool for each: **roles and privileges** (what each login may do), **row-level security** (which rows it may see), **views and definer functions** (a safe window onto sensitive columns), and **parameters** (keep user text out of the SQL). The guiding rule is **least privilege**: every person and every program gets the **minimum** rights that its job needs, and nothing more.`,
    `## Roles: users and groups are the same thing
In PostgreSQL a **role** is an identity that can own objects and hold privileges. A role that can **log in** is what you usually call a user. A role that cannot log in (\`NOLOGIN\`) is a **group**. A role can be a **member** of other roles and **inherits** their privileges, so you grant rights **once to a group** and then add people to it.

\`\`\`sql
CREATE ROLE readonly NOLOGIN;                       -- a group: holds the rights
CREATE ROLE analyst LOGIN PASSWORD '…';             -- a person or a service that can connect
GRANT readonly TO analyst;                          -- analyst now has everything readonly has
\`\`\`
A sound starting design for a data application:

| Role | Purpose | Rights |
|---|---|---|
| \`app_owner\` | owns the tables, runs migrations | all rights on its own objects; used by the deployment pipeline only |
| \`app_rw\` | the application and the ETL job | \`SELECT, INSERT, UPDATE, DELETE\` on the tables it needs, and nothing else |
| \`readonly\` | BI tools, analysts | \`SELECT\` on the tables or views they may read |
| a login role per person or service | the actual connection | a **member** of one group, so access is removed by revoking membership |

**Never connect an application as a superuser.** A superuser ignores every privilege and every row-level policy, so one bug or one injected statement has the power to do anything. And never put the password in the code: read it from an environment variable or a secret store, as you learned in the foundations phase.

## Privileges: GRANT and REVOKE
A privilege is granted on a specific **kind of object**, and to use an object you need the right at **every level above it**:

- the **database**: \`CONNECT\`;
- the **schema**: \`USAGE\` (to see the objects inside) and \`CREATE\` (to make new ones);
- the **table**: \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`, and so on, or only **some columns**: \`GRANT SELECT (emp_id, emp_name) ON employees TO readonly\`;
- a **sequence**: \`USAGE\` (needed to insert into a table with an identity column);
- a **function or procedure**: \`EXECUTE\`.`,
    { sketch: { w: 760, h: 300, caption: 'To read one column you need a right at every layer. A missing layer gives permission denied, even if the layer below is granted.', items: [
      { t: 'box', x: 30, y: 18, w: 330, h: 50, label: 'the database', sub: 'CONNECT', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 195, y1: 70, x2: 195, y2: 88 },
      { t: 'box', x: 30, y: 90, w: 330, h: 50, label: 'the schema public', sub: 'USAGE', fill: 'green', size: 17 },
      { t: 'arrow', x1: 195, y1: 142, x2: 195, y2: 160 },
      { t: 'box', x: 30, y: 162, w: 330, h: 50, label: 'the table employees', sub: 'SELECT, or only some columns', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 195, y1: 214, x2: 195, y2: 232 },
      { t: 'box', x: 30, y: 234, w: 330, h: 50, label: 'the column emp_name', sub: 'allowed here, denied for pan', fill: 'orange', size: 17 },
      { t: 'note', x: 400, y: 24, w: 345, h: 56, fill: 'grey', size: 14, text: 'By default the pseudo-role PUBLIC can connect.\nIt can not create tables in schema public\n(PostgreSQL 15 and later).' },
      { t: 'note', x: 400, y: 98, w: 345, h: 56, fill: 'grey', size: 14, text: 'No USAGE on the schema:\n"permission denied for schema public",\neven if the table is granted.' },
      { t: 'note', x: 400, y: 172, w: 345, h: 60, fill: 'grey', size: 14, text: 'A column grant allows only those columns.\nSELECT pan then fails: "permission denied\nfor table employees".' },
      { t: 'note', x: 400, y: 246, w: 345, h: 40, fill: 'yellow', size: 14, text: 'REVOKE takes a right away. Grant to groups.' },
    ] } },
    { sql: {
      title: 'A read-only group with column-level access',
      starter: `-- A group with limited rights, and a login that belongs to it
CREATE ROLE readonly NOLOGIN;
CREATE ROLE analyst LOGIN PASSWORD 'not-a-real-password';
GRANT readonly TO analyst;

GRANT USAGE  ON SCHEMA public TO readonly;
GRANT SELECT ON customers, orders TO readonly;
GRANT SELECT (emp_id, emp_name, department, city) ON employees TO readonly;   -- no pan, ifsc, bank_account

-- A table for the test results, which the analyst may write to
CREATE TABLE access_tests (n serial, test text, outcome text);
GRANT INSERT ON access_tests TO analyst;
GRANT USAGE ON SEQUENCE access_tests_n_seq TO analyst;

-- Act as the analyst and try seven things. Every try is caught and recorded,
-- so one denied statement does not stop the script.
DO $$
DECLARE c bigint;
BEGIN
  SET LOCAL ROLE analyst;
  BEGIN SELECT COUNT(*) INTO c FROM customers;
    INSERT INTO access_tests (test, outcome) VALUES ('read customers', 'allowed: ' || c || ' rows');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('read customers', SQLERRM); END;
  BEGIN SELECT COUNT(emp_name) INTO c FROM employees;
    INSERT INTO access_tests (test, outcome) VALUES ('read employees.emp_name', 'allowed: ' || c || ' rows');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('read employees.emp_name', SQLERRM); END;
  BEGIN PERFORM * FROM employees LIMIT 1;
    INSERT INTO access_tests (test, outcome) VALUES ('read ALL columns of employees', 'allowed');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('read ALL columns of employees', SQLERRM); END;
  BEGIN PERFORM pan FROM employees LIMIT 1;
    INSERT INTO access_tests (test, outcome) VALUES ('read employees.pan', 'allowed');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('read employees.pan', SQLERRM); END;
  BEGIN UPDATE customers SET city = 'Delhi' WHERE customer_id = 1;
    INSERT INTO access_tests (test, outcome) VALUES ('update customers', 'allowed');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('update customers', SQLERRM); END;
  BEGIN DELETE FROM orders;
    INSERT INTO access_tests (test, outcome) VALUES ('delete from orders', 'allowed');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('delete from orders', SQLERRM); END;
  BEGIN CREATE TABLE public.analyst_scratch (a int);
    INSERT INTO access_tests (test, outcome) VALUES ('create a table in public', 'allowed');
  EXCEPTION WHEN OTHERS THEN INSERT INTO access_tests (test, outcome) VALUES ('create a table in public', SQLERRM); END;
END $$;
RESET ROLE;   -- SET LOCAL ROLE lasts until the end of the transaction, so go back to the owner

SELECT test, outcome FROM access_tests ORDER BY n;

-- The privilege functions answer the same questions without trying
SELECT has_table_privilege('analyst', 'employees', 'SELECT')              AS whole_table,
       has_column_privilege('analyst', 'employees', 'emp_name', 'SELECT') AS name_column,
       has_column_privilege('analyst', 'employees', 'pan', 'SELECT')      AS pan_column;

-- Nothing was damaged by the denied statements
SELECT current_user AS back_to_owner, (SELECT COUNT(*) FROM orders) AS orders_still_there;`,
      note: 'The analyst can read customers (12 rows) and the one allowed column (20 rows), but not the whole employees table, not pan, not update customers, not delete orders and not create a table in the public schema. The three privilege checks say false, true, false. All 220 orders are still there. One surprise: COUNT(*) on employees would even work for the analyst, because it reads no column, so column grants hide values but not how many rows a table has.',
    } },
    `## Views and definer functions: a safe window
A **view** runs with the privileges of its **owner**, not of the person reading it. That makes a view a safe window onto sensitive data: the owner has the rights on the table, and the analyst has the right on the view only. The classic use is **masking** personal data:

\`\`\`sql
CREATE VIEW employees_masked AS
SELECT emp_id, emp_name, department,
       CASE WHEN pan IS NULL THEN 'MISSING' ELSE LEFT(pan, 2) || '*****' || RIGHT(pan, 1) END AS pan_masked,
       '******' || RIGHT(bank_account, 4) AS account_masked
FROM employees;
GRANT SELECT ON employees_masked TO readonly;       -- readonly gets the view, not the table
\`\`\`
A **function** can do the same with \`SECURITY DEFINER\`: it runs with the privileges of the function's **owner**, so a role with no rights on the table can still call \`dept_headcount('Finance')\` and get a number. Two safeguards are essential for such functions: set \`search_path\` inside the definition (\`SET search_path = public, pg_temp\`) so that nobody can sneak in a look-alike object, and take \`EXECUTE\` away from \`PUBLIC\` and give it only to the roles that need it.

Treat personal data such as PAN and bank account numbers with care: expose it only to those who need it, mask it elsewhere, and check your organisation's data-protection policy and the rules that apply to you.`,
    { sql: {
      title: 'A masked view and a SECURITY DEFINER function',
      starter: `CREATE ROLE reporting NOLOGIN;
GRANT USAGE ON SCHEMA public TO reporting;

-- 1) A view that masks personal data. reporting gets the view only.
CREATE VIEW employees_masked AS
SELECT emp_id, emp_name, department,
       CASE WHEN pan IS NULL THEN 'MISSING' ELSE LEFT(pan, 2) || '*****' || RIGHT(pan, 1) END AS pan_masked,
       '******' || RIGHT(bank_account, 4) AS account_masked
FROM employees;
GRANT SELECT ON employees_masked TO reporting;

-- 2) A definer function: runs with its owner's rights and returns only a number
CREATE FUNCTION dept_headcount(p_dept text) RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT COUNT(*) FROM employees WHERE department = p_dept $$;
REVOKE EXECUTE ON FUNCTION dept_headcount(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dept_headcount(text) TO reporting;

-- Now act as the reporting role
SET ROLE reporting;
SELECT emp_id, emp_name, pan_masked, account_masked FROM employees_masked WHERE emp_id IN (1, 9, 18) ORDER BY emp_id;
SELECT dept_headcount('Finance') AS finance_people;
RESET ROLE;

-- The raw table stays closed to that role
SELECT has_table_privilege('reporting', 'employees', 'SELECT') AS can_read_the_raw_table;`,
      note: 'Through the view the reporting role sees XU*****R for employee 1 and MISSING for employee 9 and 18, and only the last four digits of each bank account. The function returns 7 people in Finance. The last query confirms that the role has no right on the employees table itself.',
    } },
    `## Row-level security: which rows may this login see?
Privileges decide **which tables and columns**. **Row-level security (RLS)** decides **which rows**. You switch it on for a table and define **policies**. PostgreSQL then adds the policy's condition to **every** query on that table, whatever tool sends it.

- \`USING (condition)\` decides which existing rows are **visible** (and which can be updated or deleted).
- \`WITH CHECK (condition)\` decides which rows may be **written**. A row that does not satisfy it is rejected.
- A policy can apply to \`ALL\` commands or just \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`, and to specific roles.
- **Superusers and the table owner bypass RLS** (unless you also run \`ALTER TABLE … FORCE ROW LEVEL SECURITY\`). So an application must **not** connect as the owner.

The policy needs to know **who is asking**. A login per user is one way. The common alternative for web applications is a **setting** that the application sets after it authenticates the user: \`app.entity_id\`. The policy compares the row with it: \`USING (entity_id = NULLIF(current_setting('app.entity_id', true), '')::int)\`.

Two details make this safe:
- The second argument \`true\` of \`current_setting\` means "return NULL if the setting does not exist" instead of an error. A comparison with NULL is never true, so when the setting is **missing** the user sees **no rows**. The policy **fails closed**.
- Set the value with \`set_config('app.entity_id', '1', true)\`. The \`true\` makes it **local to the current transaction**, so a pooled connection that is reused for the next user does not carry the previous user's entity with it. A session-wide setting on a shared connection is a classic leak.`,
    { sketch: { w: 760, h: 280, caption: 'One policy, one query, three different answers. The policy adds a WHERE to every query on fact_gl.', items: [
      { t: 'db', x: 14, y: 40, w: 130, h: 96, label: 'fact_gl', fill: 'blue', size: 19 },
      { t: 'text', x: 80, y: 156, text: '1,227 lines', size: 15, bold: true },
      { t: 'arrow', x1: 146, y1: 88, x2: 214, y2: 88 },
      { t: 'box', x: 216, y: 44, w: 250, h: 90, label: 'RLS policy', sub: 'WHERE entity_id = app.entity_id', fill: 'yellow', size: 20 },
      { t: 'arrow', x1: 468, y1: 70, x2: 540, y2: 44 },
      { t: 'arrow', x1: 468, y1: 90, x2: 540, y2: 110 },
      { t: 'arrow', x1: 468, y1: 112, x2: 540, y2: 176 },
      { t: 'box', x: 542, y: 20, w: 210, h: 50, label: 'entity 1 logged in', sub: '411 lines', fill: 'green', size: 16 },
      { t: 'box', x: 542, y: 86, w: 210, h: 50, label: 'entity 2 logged in', sub: '408 lines', fill: 'green', size: 16 },
      { t: 'box', x: 542, y: 152, w: 210, h: 50, label: 'setting not set', sub: '0 lines: fails closed', fill: 'pink', size: 16 },
      { t: 'note', x: 14, y: 200, w: 500, h: 66, fill: 'grey', size: 14, text: 'WITH CHECK also blocks writes: logged in as entity 2,\nan INSERT of a line for entity 1 is rejected.\nSuperusers and the table owner bypass RLS (unless FORCE).' },
      { t: 'note', x: 542, y: 214, w: 210, h: 52, fill: 'yellow', size: 14, text: 'set_config(..., true)\nis local to the transaction.' },
    ] } },
    { sql: {
      title: 'Row-level security on the ledger',
      starter: `-- A role for the entity teams, allowed to read and insert journal lines
CREATE ROLE entity_analyst NOLOGIN;
GRANT USAGE ON SCHEMA public TO entity_analyst;
GRANT SELECT, INSERT ON fact_gl TO entity_analyst;

-- Switch on RLS and add the policy: a row is visible/writable only for the entity in app.entity_id
ALTER TABLE fact_gl ENABLE ROW LEVEL SECURITY;
CREATE POLICY entity_isolation ON fact_gl
  FOR ALL TO entity_analyst
  USING      (entity_id = NULLIF(current_setting('app.entity_id', true), '')::int)
  WITH CHECK (entity_id = NULLIF(current_setting('app.entity_id', true), '')::int);

-- A place to record what the analyst sees
CREATE TABLE rls_results (n serial, check_name text, result text);
GRANT INSERT ON rls_results TO entity_analyst;
GRANT USAGE ON SEQUENCE rls_results_n_seq TO entity_analyst;

DO $$
DECLARE c bigint;
BEGIN
  SET LOCAL ROLE entity_analyst;

  SELECT COUNT(*) INTO c FROM fact_gl;
  INSERT INTO rls_results (check_name, result) VALUES ('setting not set', c || ' lines');

  PERFORM set_config('app.entity_id', '1', true);
  SELECT COUNT(*) INTO c FROM fact_gl;
  INSERT INTO rls_results (check_name, result) VALUES ('entity 1 logged in', c || ' lines');

  PERFORM set_config('app.entity_id', '2', true);
  SELECT COUNT(*) INTO c FROM fact_gl;
  INSERT INTO rls_results (check_name, result) VALUES ('entity 2 logged in', c || ' lines');

  BEGIN
    INSERT INTO fact_gl (gl_id, journal_id, entity_id, bu_id, account_id, posting_date, currency, debit, credit, source_system)
    VALUES (9001, 'JV-TEST', 1, 1, 1000, DATE '2026-03-01', 'INR', 10, 0, 'Manual');
    INSERT INTO rls_results (check_name, result) VALUES ('entity 2 writes a line for entity 1', 'allowed');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rls_results (check_name, result) VALUES ('entity 2 writes a line for entity 1', SQLERRM);
  END;
END $$;
RESET ROLE;   -- back to the owner, who is not filtered by the policy

SELECT check_name, result FROM rls_results ORDER BY n;

-- The owner is not filtered by the policy
SELECT COUNT(*) AS owner_sees_all FROM fact_gl;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'fact_gl';`,
      note: 'Without the setting the analyst sees 0 lines. As entity 1 the analyst sees 411 lines and as entity 2 408 lines (the entities hold 411, 408 and 408 of the 1,227 lines). The attempt to write a line for entity 1 while logged in as entity 2 is refused with: new row violates row-level security policy for table "fact_gl". The owner still sees all 1,227 lines.',
    } },
    `## SQL injection: when user text becomes SQL
The fourth problem. A program builds a query by **gluing text**:

\`\`\`text
"SELECT * FROM customers WHERE city = '" + typed_text + "'"
\`\`\`
For \`Mumbai\` this works. But the user can type \`x' OR '1'='1\`, and the database now receives \`… WHERE city = 'x' OR '1'='1'\`. The typed text has **become part of the SQL**, and the condition is true for every row. With a bit more skill an attacker can read other tables, change data, or run destructive statements. This is **SQL injection**, and it has been the cause of some of the largest data breaches in history. It is also **entirely preventable**.`,
    { sketch: { w: 760, h: 296, caption: 'Why injection works, and why parameters stop it. The unsafe query mixes data into the SQL text. The safe query sends the SQL and the value separately.', items: [
      { t: 'text', x: 14, y: 22, text: 'UNSAFE: the text is glued into the SQL', size: 17, bold: true, color: '#e03131', anchor: 'start' },
      { t: 'note', x: 14, y: 34, w: 730, h: 40, fill: 'white', size: 14, text: "\"SELECT * FROM customers WHERE city = '\"  +  typed_text  +  \"'\"" },
      { t: 'note', x: 14, y: 82, w: 730, h: 36, fill: 'pink', size: 14, text: "the user types:   x' OR '1'='1" },
      { t: 'arrow', x1: 380, y1: 120, x2: 380, y2: 138 },
      { t: 'note', x: 14, y: 140, w: 730, h: 40, fill: 'pink', size: 14, text: "SELECT * FROM customers WHERE city = 'x' OR '1'='1'      ->      all 12 customers" },
      { t: 'text', x: 14, y: 208, text: 'SAFE: SQL and value travel separately', size: 17, bold: true, color: '#2f9e44', anchor: 'start' },
      { t: 'note', x: 14, y: 220, w: 360, h: 38, fill: 'green', size: 14, text: 'SELECT * FROM customers WHERE city = $1' },
      { t: 'note', x: 392, y: 220, w: 352, h: 38, fill: 'green', size: 14, text: "$1 = \"x' OR '1'='1\"   (just a text value)" },
      { t: 'note', x: 14, y: 264, w: 730, h: 28, fill: 'yellow', size: 15, text: 'The database looks for a city literally called  x\' OR \'1\'=\'1  and finds none: 0 customers.' },
    ] } },
    `The cure is simple and has no exceptions: **never build SQL by joining text. Pass user input as parameters.** The database receives the statement with a placeholder (\`$1\`) and the value **separately**, so the value can never be read as SQL, whatever characters it contains. Every database driver has this: in Python's \`psycopg\` it is \`cur.execute("… WHERE city = %s", (city,))\`, and **never** \`f"… WHERE city = '{city}'"\`. In PL/pgSQL dynamic SQL it is \`EXECUTE '… WHERE city = $1' USING p_city\`. \`PREPARE\` / \`EXECUTE\` does the same inside SQL.

Sometimes you must build SQL dynamically, for example when a **table or column name** comes from input. A placeholder cannot stand in for a name. Then you use the quoting functions, \`format('%I', name)\` for identifiers and \`format('%L', value)\` for literals (or \`quote_ident\` and \`quote_literal\`), and better still an **allow-list**: accept only names that you listed.

Parameters are your first defence. The second is the least privilege you set up earlier. Even if an injection slips through, a role that can only \`SELECT\` from two views cannot drop a table or read the PAN column.`,
    { sql: {
      title: 'Break an unsafe function, and fix it with a parameter',
      starter: `-- UNSAFE: the city text is glued into the SQL string
CREATE FUNCTION find_customer_unsafe(p_city text) RETURNS SETOF customers
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT * FROM customers WHERE city = ''' || p_city || '''';
END $$;

-- SAFE: the value is passed as a parameter, never as part of the SQL
CREATE FUNCTION find_customer_safe(p_city text) RETURNS SETOF customers
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT * FROM customers WHERE city = $1' USING p_city;
END $$;

-- A normal search works the same in both
SELECT 'unsafe, Mumbai' AS call, COUNT(*) AS customers_returned FROM find_customer_unsafe('Mumbai')
UNION ALL
SELECT 'safe, Mumbai',   COUNT(*) FROM find_customer_safe('Mumbai');

-- The attack: the typed text is  x' OR '1'='1
SELECT 'unsafe, attack' AS call, COUNT(*) AS customers_returned FROM find_customer_unsafe('x'' OR ''1''=''1')
UNION ALL
SELECT 'safe, attack',   COUNT(*) FROM find_customer_safe('x'' OR ''1''=''1');

-- When you must build SQL text, let PostgreSQL quote it
SELECT format('SELECT * FROM customers WHERE city = %L', 'x'' OR ''1''=''1') AS quoted_literal,
       quote_ident('Order Details')                                         AS quoted_identifier;

-- PREPARE keeps the statement and the value apart inside SQL too
PREPARE big_orders(numeric) AS SELECT COUNT(*) AS orders FROM orders WHERE amount > $1;
EXECUTE big_orders(300000);`,
      note: 'Both functions return 4 customers for Mumbai. For the attack text the unsafe function returns all 12 customers, while the safe one returns 0. format with %L turns the attack into a harmless quoted literal (the quote marks are doubled), and quote_ident adds the double quotes a name with a space needs. The prepared statement counts the 10 orders above 3,00,000.',
    } },
    `## More habits that protect you
- **Separate roles for separate jobs**: migrations, the application, reporting. Each with only what it needs. Review the grants regularly (\`information_schema.role_table_grants\` and \`pg_roles\` show them).
- **Encrypt the connection** (SSL/TLS) whenever the database is not on the same machine, and let the server accept connections only from the networks that need them (\`pg_hba.conf\` on a self-managed server, firewall rules in the cloud).
- **Keep secrets out of code and Git**: use environment variables or a secret manager, and rotate passwords.
- **Log and audit**: statement logging, and an audit extension on a server where you can install one. The audit triggers of the last lesson cover changes to the tables that matter most.
- **Protect non-production copies**: do not copy real PAN and bank numbers to a laptop or a test database. Use masked data.`,
    `## Practice
These challenges are single \`SELECT\` statements, so they cannot create roles. They practise the **logic** of masking, of a row-level policy, and the **discovery** of sensitive columns.`,
    { challenge: {
      id: 'sql-roles-security-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Write the query behind a masking view. For all 20 employees return `emp_id, masked_pan`: the first 2 characters of the PAN, then `*****`, then the last character (for example `XU*****R`), and the text `MISSING` when the PAN is NULL. Sort by `emp_id`.',
      hint: "CASE WHEN pan IS NULL THEN 'MISSING' ELSE LEFT(pan, 2) || '*****' || RIGHT(pan, 1) END.",
      solution: `SELECT emp_id,
       CASE WHEN pan IS NULL THEN 'MISSING'
            ELSE LEFT(pan, 2) || '*****' || RIGHT(pan, 1) END AS masked_pan
FROM employees
ORDER BY emp_id`,
    } },
    { challenge: {
      id: 'sql-roles-security-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'What would a row-level policy let each user see? The users and their entity are in the starter (`dev` has no entity). The policy shows a user only the `fact_gl` lines of their own entity. Return `app_user, visible_lines`, with 0 for a user who has no entity (the policy fails closed). Sort by `app_user`. (4 rows: asha 411, ben 408, chitra 411, dev 0.)',
      starter: `WITH users(app_user, entity_id) AS (
  VALUES ('asha', 1), ('ben', 2), ('chitra', 1), ('dev', NULL::int)
)
SELECT u.app_user
FROM users u
ORDER BY u.app_user`,
      hint: 'LEFT JOIN fact_gl g ON g.entity_id = u.entity_id, GROUP BY u.app_user, and COUNT(g.gl_id). A NULL entity matches nothing in the join, so dev gets 0.',
      solution: `WITH users(app_user, entity_id) AS (
  VALUES ('asha', 1), ('ben', 2), ('chitra', 1), ('dev', NULL::int)
)
SELECT u.app_user, COUNT(g.gl_id) AS visible_lines
FROM users u
LEFT JOIN fact_gl g ON g.entity_id = u.entity_id
GROUP BY u.app_user
ORDER BY u.app_user`,
    } },
    { challenge: {
      id: 'sql-roles-security-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'Sensitive-data discovery. List the columns of the `public` schema whose **name** contains `pan`, `bank`, `ifsc` or `gstin` (any case): `table_name, column_name`, sorted by `table_name`, then `column_name`. (5 rows.) This is the first step of a data-protection review: know where the sensitive columns are.',
      hint: "information_schema.columns WHERE table_schema = 'public' AND column_name ILIKE ANY (ARRAY['%pan%', '%bank%', '%ifsc%', '%gstin%']).",
      solution: `SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ILIKE ANY (ARRAY['%pan%', '%bank%', '%ifsc%', '%gstin%'])
ORDER BY table_name, column_name`,
    } },
    { real: 'In a finance data platform the common pattern is: a **login per person or service**, each a member of a **small number of groups**; BI tools read **views** (with personal data masked) rather than tables; entity or region teams are separated by **row-level security** driven by a setting that the application sets per transaction; and the application connects with a role that **cannot** change the schema. Write the role design on one page, put the grants in versioned scripts next to your migrations, and review them every quarter. When an auditor asks "who can see employee bank accounts?", the answer should be one query against the catalog, and a short list.' },
    { interview: '"How would you secure a PostgreSQL database for a multi-entity finance application, and how do you prevent SQL injection?" Model answer: "I use least privilege. There is an owner role for migrations, a read-write role for the application and a read-only role for reporting, and people are members of groups, never superusers. I grant on schemas, tables and even columns, and expose sensitive columns only through masked views or SECURITY DEFINER functions with a fixed search_path. Entities are separated with row-level security: a policy compares the row with a transaction-local setting that the application sets after login, and an unset setting returns no rows. The application must not connect as the table owner or a superuser, which would bypass RLS. For injection, I never concatenate user input into SQL: I use parameters (placeholders with bound values) in the driver and in PL/pgSQL, quote identifiers with %I only from an allow-list, and keep the role privileges small to limit the damage." Follow-up: "Does RLS apply to the table owner?" (not unless FORCE ROW LEVEL SECURITY, and superusers always bypass it).' },
    `## Recap
- A **role** is a user or a group. Grant rights **to groups** and make logins members. Never run an application as a superuser, and keep passwords out of code.
- **Least privilege**: grant only what the job needs, at every level: \`CONNECT\` on the database, \`USAGE\` on the schema, table or **column** rights, \`USAGE\` on sequences, \`EXECUTE\` on functions. \`REVOKE\` removes rights. Column grants hide values, not the row count.
- A **view** or a **SECURITY DEFINER** function runs with its owner's rights, so it can offer masked data to a role that has no right on the table. Fix \`search_path\` in definer functions and revoke \`EXECUTE\` from \`PUBLIC\`.
- **Row-level security** adds a policy condition to every query: \`USING\` for visible rows, \`WITH CHECK\` for allowed writes. Drive it with a **transaction-local** setting (\`set_config(…, true)\`), so a missing setting means **no rows**. Owners and superusers bypass it unless \`FORCE\`.
- **SQL injection**: user text glued into SQL becomes SQL (12 customers instead of 4). Use **parameters** (\`$1\`, driver placeholders, \`EXECUTE … USING\`, \`PREPARE\`). Quote identifiers with \`%I\` and use allow-lists when names must be dynamic.
- Add encryption in transit, secret management, audit logging, and masked copies for non-production.`,
  ],
  quiz: [
    { q: 'To let a role read only the column `emp_name` of the `employees` table, which rights does it need?', o: ['SUPERUSER', 'SELECT on the whole table only', 'CONNECT on the database, USAGE on the schema, and SELECT on that column', 'UPDATE on the table'], a: 2, why: 'A right is needed at every layer: the database, the schema, and then the table or the specific column. A column-level SELECT allows only the listed columns.' },
    { q: 'Why should an application never connect to the database as a superuser?', o: ['A superuser ignores all privileges and row-level policies, so any bug or injected statement can do anything', 'Superusers cannot run SELECT', 'Superusers cannot use transactions', 'Superuser connections are slower'], a: 0, why: 'Least privilege limits the damage of a bug or an attack. A superuser has no limits, and bypasses row-level security as well.' },
    { q: 'In a row-level security policy, what is the difference between USING and WITH CHECK?', o: ['USING is for SELECT only and WITH CHECK is for DELETE only', 'USING decides which existing rows are visible or targeted, WITH CHECK decides which rows may be written', 'They are the same condition written twice', 'WITH CHECK makes the table read-only'], a: 1, why: 'USING filters the rows a command can see or act on. WITH CHECK validates the new or changed rows, so a user cannot write a row that the policy would hide from them.' },
    { q: 'The policy compares `entity_id` with `current_setting(\'app.entity_id\', true)::int`, and the application forgot to set the setting. What does the user see?', o: ['All rows', 'An error every time', 'The rows of entity 1', 'No rows: the missing setting is NULL, a comparison with NULL is never true, so the policy fails closed'], a: 3, why: 'With true as the second argument current_setting returns NULL for a missing setting. entity_id = NULL is unknown, so no row qualifies. That is the safe default.' },
    { q: 'What is the correct defence against SQL injection?', o: ['Pass user input as bound parameters (placeholders) and never concatenate it into the SQL text', 'Remove the quote characters from the input', 'Run the query as a superuser', 'Convert the input to upper case'], a: 0, why: 'With parameters the statement and the value travel separately, so the value cannot be read as SQL. Filtering characters is fragile and incomplete.' },
    { q: 'How can a role that has no right on the `employees` table still read masked PAN values?', o: ['By being granted SUPERUSER', 'By guessing the table name', 'Through a view (or a SECURITY DEFINER function) owned by someone who has the rights, because it runs with its owner\'s privileges', 'By setting app.entity_id'], a: 2, why: 'A view is evaluated with the privileges of its owner. The role needs only SELECT on the view, which exposes the masked columns.' },
  ],
  task: {
    title: 'Lock down the Kollana database on your laptop',
    steps: [
      'In DBeaver or psql (database fde_practice), create `26_security.sql` in `C:\\sql-practice`. Create the roles `readonly` (NOLOGIN) and `analyst` (LOGIN, member of `readonly`), and grant `USAGE` on schema public, `SELECT` on customers and orders, and column-level `SELECT` on `employees (emp_id, emp_name, department, city)`.',
      'Connect as `analyst` (a second DBeaver connection, or `SET ROLE analyst;`) and try the seven actions of the lesson. Write the exact error messages in comments. Confirm that `SELECT pan FROM employees` is denied.',
      'Create `employees_masked`, grant it to `readonly`, and show that `analyst` can read masked PANs and bank accounts but not the table. Add a `SECURITY DEFINER` function with a fixed `search_path` and grant `EXECUTE` only to `readonly`.',
      'Enable row-level security on `fact_gl` with the entity policy, test it as a role with `set_config(\'app.entity_id\', \'1\', true)` inside a transaction (expect 411 lines), without the setting (0 lines), and the rejected write for another entity.',
      'Write the unsafe and the safe version of a city search in a small Python-style comment block, and run the attack text against the PL/pgSQL versions (expect 12 and 0).',
    ],
    deliverable: '`26_security.sql` with the roles and grants, the seven access results, the masked view and definer function, the RLS tests with counts 411 / 0 and the rejected write, and the injection comparison 12 against 0.',
  },
};
