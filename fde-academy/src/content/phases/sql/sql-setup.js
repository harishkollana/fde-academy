export default {
  id: 'sql-setup',
  title: 'Set up PostgreSQL, DBeaver and the practice data',
  goal: 'You can install PostgreSQL and DBeaver on Windows, create a practice database, load the Kollana Tech data, and explain tables, rows, columns and keys.',
  roadmap: [
    'Install PostgreSQL + DBeaver (or pgAdmin); create a practice database',
    'Load a sample dataset (or synthetic finance data from Project 0 step 1)',
  ],
  blocks: [
    `## Why a database, and not one more Excel file?
In your automation work you already move data between Excel files, SAP exports and Power BI. That works until the files get big, many people edit them, or one wrong paste breaks a VLOOKUP and nobody notices.

A **database** is a program whose only job is to store data safely and answer questions about it fast. You ask questions in **SQL** (Structured Query Language). Every FDE and AI-automation job you are aiming for expects you to be fluent in SQL, because almost every client system ends in a database: the ERP, the payroll tool, the CRM, the data warehouse your AI agent will query.

We use **PostgreSQL** (people say "Postgres"). It is free, open source, very strict about data types, and it is what most startups and many enterprises use. What you learn here also works, with small changes, in SQL Server, MySQL, Snowflake and BigQuery.

In this lesson you will set up Postgres on your Windows laptop, load our practice data, and learn how a database "thinks" before writing real queries in the next lesson.`,
    { sketch: { w: 760, h: 330, caption: 'You talk to the PostgreSQL server through a client (DBeaver or psql). The server holds databases → schemas → tables.', items: [
      { t: 'person', x: 55, y: 70, label: 'You' },
      { t: 'box', x: 115, y: 35, w: 180, h: 70, label: 'DBeaver', sub: 'app you type SQL in', fill: 'blue' },
      { t: 'box', x: 115, y: 130, w: 180, h: 60, label: 'psql', sub: 'command-line client', fill: 'grey' },
      { t: 'arrow', x1: 298, y1: 72, x2: 405, y2: 110, label: 'SQL' },
      { t: 'arrow', x1: 298, y1: 160, x2: 405, y2: 150, label: 'SQL', ly: 18 },
      { t: 'box', x: 405, y: 25, w: 345, h: 290 },
      { t: 'text', x: 578, y: 48, text: 'PostgreSQL server  (port 5432)', size: 17, bold: true },
      { t: 'db', x: 420, y: 80, w: 125, h: 75, label: 'postgres', fill: 'grey' },
      { t: 'db', x: 590, y: 80, w: 145, h: 75, label: 'fde_practice', fill: 'yellow' },
      { t: 'line', x1: 662, y1: 157, x2: 662, y2: 180 },
      { t: 'box', x: 580, y: 180, w: 165, h: 40, label: 'schema: public', size: 16 },
      { t: 'line', x1: 625, y1: 220, x2: 610, y2: 240 },
      { t: 'line', x1: 700, y1: 220, x2: 705, y2: 240 },
      { t: 'box', x: 565, y: 240, w: 85, h: 34, label: 'fact_gl', size: 15, fill: 'green' },
      { t: 'box', x: 660, y: 240, w: 85, h: 34, label: 'orders', size: 15, fill: 'green' },
      { t: 'text', x: 655, y: 296, text: '+ 11 more tables', size: 14, color: '#5c6478' },
      { t: 'text', x: 482, y: 180, text: 'default DB,\nleave it alone', size: 14, color: '#5c6478' },
      { t: 'box', x: 20, y: 235, w: 290, h: 70, label: "This app's playground", sub: 'PGlite = Postgres inside your browser', fill: 'green' },
    ] } },
    `## How a database thinks
Before installing anything, learn the five words you will use every day.

- A **table** is like one Excel sheet with a strict shape. \`fact_gl\` is a table of general-ledger lines.
- A **column** is one attribute, and it has **one data type**. \`posting_date\` is a \`DATE\`, \`debit\` is \`NUMERIC(14,2)\`. Postgres refuses to store "abc" in a date column. Excel would happily accept it.
- A **row** is one record. In \`fact_gl\` one row is one journal line. The question "what does one row mean?" is called the **grain** of the table. Always ask it first.
- A **primary key** is the column (or columns) that uniquely identifies each row, like an employee ID. It can never be empty and never repeat. \`dim_entity.entity_id\` is a primary key.
- A **foreign key** is a column that points to a primary key in another table. \`fact_gl.entity_id\` must exist in \`dim_entity\`. The database enforces it, so you cannot post a journal to an entity that does not exist.

Above tables there are two containers. A **database** (\`fde_practice\`) is a separate box of data; you connect to one database at a time. Inside it, a **schema** is a folder of tables. The default schema is called \`public\`, and that is all we need for now.

Finally, an empty cell is called **NULL**. NULL means "unknown" or "missing", not zero. It gets its own lesson soon because it causes many real bugs.`,
    { sketch: { w: 760, h: 330, caption: 'Rows, columns, a primary key, and a foreign key that links fact_gl to dim_entity', items: [
      { t: 'table', x: 20, y: 60, title: 'dim_entity (dimension)', cols: ['entity_id', 'entity_code', 'currency'], colW: [95, 110, 90], rows: [['1', 'IN01', 'INR'], ['2', 'SG01', 'SGD'], ['3', 'US01', 'USD']] },
      { t: 'table', x: 345, y: 60, title: 'fact_gl (fact: one row = one journal line)', cols: ['gl_id', 'journal_id', 'entity_id', 'debit', 'credit'], colW: [50, 120, 80, 80, 80], rows: [['1', 'JV202504-0001', '1', '0.00', '130833.18'], ['2', 'JV202504-0001', '1', '130833.18', '0.00'], ['59', 'JV202504-0030', '2', '51.54', '0.00']], hl: [2] },
      { t: 'arrow', x1: 555, y1: 178, x2: 68, y2: 178, bend: -55, label: 'foreign key → primary key' },
      { t: 'note', x: 20, y: 255, w: 250, h: 56, text: 'Primary key: entity_id\nunique + never NULL' },
      { t: 'note', x: 490, y: 255, w: 260, h: 56, text: 'Foreign key: fact_gl.entity_id\nmust exist in dim_entity' },
    ] } },
    { analogy: 'A database server is like your company\'s record room. Each **database** is a separate cupboard, each **schema** is a shelf, each **table** is a register on that shelf. The **primary key** is the serial number printed on every page, and a **foreign key** is a reference like "see vendor no. 104 in the vendor register".' },
    `## Step 1: install PostgreSQL on Windows
We install the official build from EDB. It includes the database server, the \`psql\` command-line client and pgAdmin (a second GUI we will not need much).`,
    { local: `1. Open https://www.postgresql.org/download/windows/ and click **Download the installer**. Pick the newest version for **Windows x86-64** (version 17 or 18 is fine; this app's playground runs 18).
2. Run the downloaded \`.exe\`. Click **Yes** when Windows asks for admin rights.
3. Installation directory: keep the default, for example \`C:\\Program Files\\PostgreSQL\\18\`.
4. Components: tick **PostgreSQL Server**, **pgAdmin 4** and **Command Line Tools**. Untick **Stack Builder** (not needed).
5. Data directory: keep the default.
6. Password: this is the password of the superuser called \`postgres\`. Choose one and **write it down**. You cannot see it again.
7. Port: keep **5432**. Locale: keep **Default locale**. Click Next, then Install, then Finish.
8. Add the tools to PATH so PowerShell can find \`psql\`: Start menu → type "environment" → **Edit the system environment variables** → **Environment Variables…** → under *System variables* select **Path** → **Edit** → **New** → paste \`C:\\Program Files\\PostgreSQL\\18\\bin\` (use your version number) → OK on all windows.
9. Open a **new** PowerShell window and check:
\`\`\`powershell
psql --version
# expected: psql (PostgreSQL) 18.x
psql -U postgres
# type your password, then you see the prompt:  postgres=#
SELECT version();
\\q
\`\`\`` },
    { warn: `Common install errors and fixes:
- \`'psql' is not recognized…\` → PATH is not set, or you used an old PowerShell window. Redo step 8 and open a new window.
- \`password authentication failed for user "postgres"\` → wrong password. If you truly forgot it, uninstalling and reinstalling is the fastest fix on a fresh practice machine.
- \`Connection refused\` → the server is not running. Start menu → **Services** → find **postgresql-x64-18** → Start, and set Startup type to Automatic.
- Port 5432 already used → choose 5433 during install and add \`-p 5433\` to every psql command (and use 5433 in DBeaver).
- \`Console code page (437) differs from Windows code page (1252)\` → harmless warning. Run \`chcp 1252\` first if it bothers you.` },
    `## Step 2: install DBeaver and connect
**DBeaver Community** is a free database GUI. It is where you will write and save most of your SQL. Think of it as "SSMS / SQL Developer, but for every database".`,
    { local: `1. Open https://dbeaver.io/download/ → **Community Edition** → **Windows (installer)**. Install with all defaults (it includes its own Java).
2. Open DBeaver. Menu **Database → New Database Connection** → choose **PostgreSQL** → Next.
3. Fill in: Host \`localhost\`, Port \`5432\`, Database \`postgres\`, Username \`postgres\`, Password = your password, tick **Save password**.
4. Click **Test Connection…**. The first time, DBeaver asks to download the PostgreSQL driver: click **Download**. You should see **Connected**.
5. Click **Finish**. The connection appears in the *Database Navigator* panel on the left.` },
    `## Step 3: create a practice database
Never practise inside the default \`postgres\` database. Create your own, so you can delete and rebuild it any time.

In DBeaver, select your connection, press **Ctrl + ]** (new SQL script) and run:
\`\`\`sql
CREATE DATABASE fde_practice;
\`\`\`
Press **Ctrl + Enter** to run the statement under the cursor. Then right-click the connection → **Edit Connection** (F4) → change *Database* from \`postgres\` to \`fde_practice\` → OK. Now everything you run goes into \`fde_practice\`.

From PowerShell the same thing is one command: \`createdb -U postgres fde_practice\`.

## Step 4: load the practice data
The Kollana Tech practice data is one SQL script: in your FDE Academy folder it is \`src/data/seed.sql\`. A script is just many SQL statements in one file: \`CREATE TABLE …\` statements that build empty tables, then \`INSERT INTO … VALUES …\` statements that fill them. Copy it to a simple path such as \`C:\\sql-practice\\seed.sql\`.`,
    { local: `**Option A, psql (fastest):**
\`\`\`powershell
psql -U postgres -d fde_practice -f C:\\sql-practice\\seed.sql
\`\`\`
Expected output: a list of \`CREATE TABLE\` and \`INSERT 0 3\`, \`INSERT 0 200\`, … lines, and no ERROR lines.

**Option B, DBeaver:** make sure the connection points to \`fde_practice\`, then **File → Open File…** → \`seed.sql\`. Run it with **Alt + X** (*Execute SQL Script*). Do not use Ctrl + Enter here: that runs only the one statement under the cursor.

Then refresh the navigator (F5): \`fde_practice → Schemas → public → Tables\` shows 13 tables.` },
    { warn: 'If you run `seed.sql` a second time you get `relation "dim_entity" already exists`, because the tables are already there. To start fresh, run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` (this deletes every table in the schema), then load the script again.' },
    `### Loading CSV files (you will do this in Project A)
Real data usually arrives as CSV, not as a SQL script. The table must exist first, with the same columns in the same order. Then use \`\\copy\` in psql:
\`\`\`sql
-- export a table to CSV (round-trip practice)
\\copy customers TO 'C:/sql-practice/customers.csv' WITH (FORMAT csv, HEADER true)

-- make an empty table with the same columns, then import the CSV into it
CREATE TABLE customers_copy (LIKE customers);
\\copy customers_copy FROM 'C:/sql-practice/customers.csv' WITH (FORMAT csv, HEADER true)
\`\`\`
- \`\\copy\` (with backslash) is a psql command. **Your** PowerShell reads the file and streams it to the server. Use it on Windows.
- \`COPY\` (no backslash) makes the **server** read the file. The Postgres service runs as a different Windows user and often gets "Permission denied" on your folders.
- Use forward slashes in the path, and \`HEADER true\` when the first line has column names.
- In DBeaver: right-click a table → **Import Data** → CSV → pick the file → check the column mapping → Proceed.

## A guided tour of the practice data
All lessons use one fake company group, **Kollana Tech**, with three entities. Fiscal year **FY 2025-26** runs 1 Apr 2025 to 31 Mar 2026, the Indian way.

| table | one row is… | use it for |
|---|---|---|
| \`dim_entity\` | a legal entity (IN01, SG01, US01) with its currency | entity names, local currency |
| \`dim_bu\` | a business unit (SALES, OPS, TECH, CORP) | BU names |
| \`dim_account\` | a GL account; \`parent_account_id\` builds a tree | P&L grouping, hierarchy |
| \`fx_rates\` | one currency's rate to INR for one month | currency restatement |
| \`fact_gl\` | one journal line (debit or credit) | actuals, P&L, trial balance |
| \`fact_budget\` | budget for entity × BU × account × month | budget vs actual |
| \`employees\` | an employee with bank, IFSC, PAN, CTC | self joins, validation |
| \`payroll\` | one employee's pay for one month | outliers |
| \`purchase_register\` | an invoice in our books | GST reconciliation |
| \`supplier_invoices\` | an invoice as the supplier reported it (GSTR-2B style) | GST reconciliation |
| \`products\`, \`customers\`, \`orders\` | catalogue, customers, sales orders | sales analysis |

**dim** tables describe things (who, what, where). **fact** tables record events with amounts. The data contains deliberate mistakes (duplicate lines, unbalanced journals, a missing FX rate, invalid IFSC codes, an order for a customer that does not exist). You will find every one of them during this course.`,
    { sql: {
      title: 'Peek at the data',
      starter: `-- Every table in the public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Row counts in one row (each (SELECT COUNT(*) ...) is a tiny query inside the big one)
SELECT
  (SELECT COUNT(*) FROM dim_entity)  AS dim_entity,
  (SELECT COUNT(*) FROM dim_account) AS dim_account,
  (SELECT COUNT(*) FROM fact_gl)     AS fact_gl,
  (SELECT COUNT(*) FROM fact_budget) AS fact_budget,
  (SELECT COUNT(*) FROM employees)   AS employees,
  (SELECT COUNT(*) FROM orders)      AS orders;

-- What does one row of fact_gl look like?
SELECT * FROM fact_gl LIMIT 6;`,
      note: 'Three statements, three result grids. Run the same row-count query on your laptop after loading seed.sql: the numbers must match (3, 15, 1227, 612, 20, 220).',
    } },
    `## How the in-browser playground works
The grey boxes in this app run **real PostgreSQL** (a build called PGlite, compiled to WebAssembly) **inside your browser tab**. No server, no internet needed once the page has loaded.

- Each playground gets its **own fresh copy** of the data. You can \`DELETE\` everything and nothing breaks: press **reset data** to get the original back, **restore code** to get the starter SQL back.
- **Ctrl + Enter** runs the code. If you write several statements, you see one result grid per statement.
- **tables** shows every table and its columns. Use it whenever you forget a column name.
- **SQL challenges** are auto-graded: your result is compared with the model answer by **values only**. Column names do not matter, numbers are compared at 2 decimals, and row order is ignored unless the prompt says it matters. A challenge accepts exactly one \`SELECT\` (or \`WITH … SELECT\`) query.
- Give every output column a **different name**. Two columns both called \`count\` would hide each other in the grid.`,
    { tip: 'Practise in both places. The playground is for quick experiments while reading. DBeaver on your laptop is where you build muscle memory and save `.sql` files in Git, like you will on a real client project.' },
    { challenge: {
      id: 'sql-setup-ch1',
      level: 'easy',
      prompt: 'Your first graded query: show **every column and every row** of the business-unit table `dim_bu`.',
      hint: '`SELECT * FROM table_name` returns all columns. No WHERE needed.',
      starter: 'SELECT ',
      solution: `SELECT * FROM dim_bu`,
    } },
    { challenge: {
      id: 'sql-setup-ch2',
      level: 'easy',
      prompt: 'Show the chart of accounts: return `account_code, account_name, account_type` for every row of `dim_account`.',
      hint: 'List the three columns after SELECT, separated by commas, in that order.',
      solution: `SELECT account_code, account_name, account_type FROM dim_account`,
    } },
    { real: 'On a client project, the first thing you ask for is read access to the database and a list of tables with their grain ("one row = one invoice line?"). The second thing is the row counts, so you can check later that nothing was lost in your pipeline. You just did both.' },
    { interview: '"What is the difference between a primary key and a foreign key?" Model answer: "A primary key uniquely identifies each row in its own table and cannot be NULL or repeat, for example `employee_id`. A foreign key is a column in another table that refers to that primary key, for example `payroll.emp_id`. The database uses it to stop orphan records, like a payroll line for an employee who does not exist."' },
    `## Recap
- PostgreSQL is a database **server**; DBeaver and psql are **clients** that send it SQL.
- Server → database (\`fde_practice\`) → schema (\`public\`) → tables → rows and typed columns.
- Primary key = unique row ID; foreign key = pointer to another table's primary key. Always ask "what is one row?" (the **grain**).
- Load scripts with \`psql -f\` or DBeaver's Alt + X; load CSV files with \`\\copy … WITH (FORMAT csv, HEADER true)\`.
- The playgrounds run real Postgres in your browser, each with a fresh copy of the Kollana Tech data.`,
  ],
  quiz: [
    { q: 'Which statement about a **primary key** is true?', o: ['It can contain NULL if the value is unknown', 'It must be unique and never NULL', 'It must be a text column', 'A table can have many primary keys'], a: 1, why: 'A primary key identifies each row, so it must be unique and NOT NULL. A table has at most one primary key (which may span several columns).' },
    { q: 'What is the correct order from biggest container to smallest?', o: ['Schema → database → table → server', 'Table → schema → database → server', 'Server → database → schema → table', 'Database → server → table → schema'], a: 2, why: 'One server hosts many databases; each database has schemas; each schema holds tables.' },
    { q: 'You open `seed.sql` in DBeaver and press **Ctrl + Enter**. Only one table appears. Why?', o: ['Ctrl + Enter runs only the statement under the cursor; use Alt + X to run the whole script', 'The file is broken', 'DBeaver can only run one CREATE TABLE per day', 'You must restart PostgreSQL first'], a: 0, why: 'Ctrl + Enter = execute statement. Alt + X = execute script (every statement in the file).' },
    { q: 'On Windows, `COPY orders FROM \'C:/Users/asha/orders.csv\'` fails with "Permission denied", but `\\copy` works. Why?', o: ['COPY only works on Linux', '\\copy is faster', 'COPY makes the server process read the file, and the Postgres service user cannot read your folder; \\copy reads it on the client side', 'The CSV has a header row'], a: 2, why: 'COPY runs on the server with the service account. \\copy is a psql command that reads the file with your own permissions and streams it.' },
    { q: 'In `fact_gl`, what is the **grain** (what one row means)?', o: ['One journal', 'One month of postings', 'One account', 'One journal line (a debit or a credit)'], a: 3, why: 'Each journal has two lines (e.g. revenue and bank), so one row = one journal line. Knowing the grain stops you from double counting later.' },
    { q: 'Running `seed.sql` a second time gives `relation "dim_entity" already exists`. What is a clean fix?', o: ['Ignore it; the data is now doubled', 'Run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` and load the script again', 'Reinstall PostgreSQL', 'Rename the file'], a: 1, why: 'The script creates tables that already exist. Dropping and recreating the practice schema gives a clean start.' },
  ],
  task: {
    title: 'Build your local practice environment',
    steps: [
      'Install PostgreSQL and add its `bin` folder to PATH. Confirm `psql --version` works in a new PowerShell window.',
      'Install DBeaver Community and create a connection to `localhost:5432` as user `postgres`.',
      'Create the database `fde_practice` and point your DBeaver connection to it.',
      'Load `seed.sql` (psql `-f` or DBeaver Alt + X) and run the row-count query from the playground above. The counts must match.',
      'Do the CSV round trip: `\\copy customers TO …`, `CREATE TABLE customers_copy (LIKE customers)`, `\\copy customers_copy FROM …`, then `SELECT COUNT(*) FROM customers_copy;` (expect 12).',
      'Create a folder `C:\\sql-practice` and save every query from this course there as `.sql` files, one file per lesson.',
    ],
    deliverable: 'A screenshot of DBeaver showing the 13 tables under fde_practice → public, plus the row-count result, saved in C:\\sql-practice.',
  },
};
