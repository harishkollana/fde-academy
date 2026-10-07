import { BRONZE_SETUP } from './shared.js';

export default {
  id: 'dlt-stack-overview',
  title: 'How a modern data stack fits together',
  goal: 'You can draw the ingestion → transformation → orchestration → serving picture, explain ELT and bronze/silver/gold in plain words, and set up the data-stack workspace on your laptop.',
  roadmap: ['medallion bronze/silver/gold', 'ETL vs ELT', 'jobs of ingestion, transformation, orchestration, serving', 'why gold matters for AI agents'],
  blocks: [
    `## Why this phase exists
Some time back you built a dlt + dbt + Dagster stack with an AI assistant. It ran. But if an interviewer asks *"Why is this table merge and not append?"* or *"What happens if yesterday's file arrives twice?"*, you would have to guess.

This phase fixes that. You will build the same kind of stack **by hand**, one file at a time, and you will be able to explain every line. The good news: you already understand the business side better than most data engineers. You have cleaned SAP dumps, rebuilt MIS packs and chased missing invoices. A data stack is the same work, done with tools that make it repeatable, tested and scheduled.

## The four jobs of a data platform
Every data platform, from a startup to a bank, does four jobs. Learn these four words and every tool will fit into place.

| Job | Question it answers | Tool in our stack | What you did by hand before |
|---|---|---|---|
| **Ingestion** | How does raw data get in? | dlt | Downloading the SAP export, saving it in a shared folder |
| **Transformation** | How does raw become trusted numbers? | dbt (SQL) | VLOOKUPs, cleaning macros, pivot tables |
| **Orchestration** | What runs when, in which order, and who is told if it fails? | Dagster | You, opening files every morning at 9 |
| **Serving** | Who reads the final numbers? | Gold views → Power BI, AI agents | Emailing the MIS pack |

*Storage* sits in the middle: one **warehouse**, a database built for analysis. In this phase the warehouse is PostgreSQL 16 running in Docker. In a company it may be Snowflake, BigQuery or Fabric, but the ideas are identical.`,
    { sketch: { w: 760, h: 420, caption: 'The whole stack on one page: dlt loads raw, dbt builds silver and gold, Dagster runs it all', items: [
      { t: 'box', x: 190, y: 12, w: 470, h: 54, label: 'Dagster (orchestration)', sub: 'schedule 06:30 IST · sensor: new file · retries · alerts', fill: 'purple' },
      { t: 'doc', x: 20, y: 100, w: 115, h: 62, label: 'orders_*.csv\ndaily drops' },
      { t: 'doc', x: 20, y: 185, w: 115, h: 62, label: 'inventory\n_*.csv' },
      { t: 'cloud', x: 12, y: 272, w: 135, h: 72, label: 'Price API' },
      { t: 'box', x: 175, y: 185, w: 95, h: 70, label: 'dlt', sub: 'ingest', fill: 'orange' },
      { t: 'arrow', x1: 135, y1: 135, x2: 175, y2: 200 },
      { t: 'arrow', x1: 135, y1: 218, x2: 175, y2: 220 },
      { t: 'arrow', x1: 145, y1: 305, x2: 178, y2: 245 },
      { t: 'text', x: 482, y: 150, text: 'PostgreSQL warehouse', anchor: 'middle', bold: true },
      { t: 'db', x: 300, y: 172, w: 95, h: 92, label: 'bronze\nraw', fill: 'orange' },
      { t: 'db', x: 435, y: 172, w: 95, h: 92, label: 'silver\nclean', fill: 'grey' },
      { t: 'db', x: 570, y: 172, w: 95, h: 92, label: 'gold\nmarts', fill: 'yellow' },
      { t: 'arrow', x1: 270, y1: 220, x2: 300, y2: 220 },
      { t: 'arrow', x1: 395, y1: 220, x2: 435, y2: 220, label: 'dbt', ly: -12 },
      { t: 'arrow', x1: 530, y1: 220, x2: 570, y2: 220, label: 'dbt', ly: -12 },
      { t: 'arrow', x1: 222, y1: 66, x2: 222, y2: 184, dashed: true, color: '#7048e8' },
      { t: 'arrow', x1: 482, y1: 66, x2: 482, y2: 135, dashed: true, color: '#7048e8' },
      { t: 'person', x: 590, y: 330, label: 'Power BI' },
      { t: 'box', x: 650, y: 315, w: 105, h: 62, label: 'AI agent', sub: 'reads gold only', fill: 'pink' },
      { t: 'arrow', x1: 610, y1: 266, x2: 592, y2: 312 },
      { t: 'arrow', x1: 640, y1: 266, x2: 690, y2: 314 },
      { t: 'note', x: 290, y: 300, w: 240, h: 74, text: 'ELT: Load raw first,\nthen Transform inside\nthe warehouse with SQL' },
    ] } },
    `## ETL vs ELT
For 20 years the standard was **ETL**: Extract from the source, Transform in a separate tool (a Python script, SSIS, Informatica), then Load only the clean result into the warehouse. Warehouses were expensive, so you only stored the finished numbers.

Today the standard is **ELT**: Extract, **Load the raw data as it is**, then Transform *inside* the warehouse with SQL. Storage is cheap now, and warehouses are fast at SQL.`,
    { cols: [
      `### ETL (old default)
- Transform happens **before** loading, in a script
- Raw data is thrown away after the run
- A bug in the logic? Re-extract from the source (if it still exists)
- Logic hides inside Python files few people can read
- Still useful when you must mask PII *before* it lands, or filter a 50 GB file down to 1%`,
      `### ELT (modern default)
- Raw data is loaded first, untouched (bronze)
- Transform is SQL in the warehouse (dbt)
- A bug? Fix the SQL and **rebuild** from bronze: no re-extract
- Logic is versioned SQL that any analyst can review
- Every number can be traced back to the raw row and file it came from`,
    ] },
    { sketch: { w: 760, h: 300, caption: 'ETL throws raw data away; ELT keeps it, so you can rebuild any time', items: [
      { t: 'text', x: 20, y: 40, text: 'ETL', size: 22, bold: true },
      { t: 'doc', x: 70, y: 15, w: 90, h: 55, label: 'source' },
      { t: 'box', x: 215, y: 15, w: 150, h: 55, label: 'Python script', sub: 'clean + aggregate', fill: 'blue' },
      { t: 'db', x: 420, y: 8, w: 110, h: 72, label: 'warehouse\n(clean only)', fill: 'yellow' },
      { t: 'arrow', x1: 160, y1: 42, x2: 215, y2: 42 },
      { t: 'arrow', x1: 365, y1: 42, x2: 420, y2: 42 },
      { t: 'note', x: 565, y: 12, w: 180, h: 64, text: 'raw is gone.\nbug = re-extract', fill: 'pink' },
      { t: 'line', x1: 15, y1: 112, x2: 745, y2: 112, dashed: true },
      { t: 'text', x: 20, y: 185, text: 'ELT', size: 22, bold: true },
      { t: 'doc', x: 70, y: 155, w: 90, h: 55, label: 'source' },
      { t: 'box', x: 190, y: 155, w: 90, h: 55, label: 'dlt load', fill: 'orange' },
      { t: 'db', x: 310, y: 145, w: 100, h: 75, label: 'bronze\nas-is', fill: 'orange' },
      { t: 'box', x: 440, y: 155, w: 95, h: 55, label: 'dbt SQL', fill: 'green' },
      { t: 'db', x: 565, y: 145, w: 115, h: 75, label: 'silver +\ngold', fill: 'yellow' },
      { t: 'arrow', x1: 160, y1: 182, x2: 190, y2: 182 },
      { t: 'arrow', x1: 280, y1: 182, x2: 310, y2: 182 },
      { t: 'arrow', x1: 410, y1: 182, x2: 440, y2: 182 },
      { t: 'arrow', x1: 535, y1: 182, x2: 565, y2: 182 },
      { t: 'arrow', x1: 620, y1: 222, x2: 360, y2: 222, dashed: true, bend: 40, label: 'fix SQL, rebuild', ly: 40 },
      { t: 'mark', x: 715, y: 182, ok: true },
    ] } },
    { analogy: 'ELT is like keeping the original bank statements in a file before you prepare the reconciliation. If the auditor finds a mistake in your working, you redo the working from the statements. You never have to ask the bank to send the statements again.' },
    `## Medallion layers: bronze, silver, gold
"Medallion" is just a naming convention for the layers inside the warehouse. It came from Databricks, but every modern team uses the idea, whatever they call it (raw / staging / marts is the dbt name for the same thing).

| Layer | What it holds | Who writes it | Rules |
|---|---|---|---|
| **Bronze** | Raw data exactly as it arrived, plus load metadata (file name, load id, load time) | dlt | Append or merge only. **Never edit by hand.** Everything is allowed to be messy. |
| **Silver** | Clean, typed, deduplicated, standardised data. One row = one real thing (one order, one product) | dbt staging + intermediate models | Correct types, one naming style, no duplicates, tested keys |
| **Gold** | Business-ready tables and views: facts, dimensions, KPIs, named the way the business talks | dbt mart models | Tested, documented, stable column names. The **only** layer that dashboards and agents read |

Think of it as a promise that gets stronger at each step. Bronze promises "this is what arrived". Silver promises "this is correct". Gold promises "this answers a business question".

Step through five messy order rows below. Watch what each layer fixes.`,
    { widget: 'MedallionStepper' },
    `## Try the three layers in SQL
The playground below has a **bronze** table, \`bronze.orders_raw\`, built the way dlt would land our ERP CSV drops: every column is text, dates come in two formats (\`2025-08-25\` and \`25/08/2025\`), some SKUs are lowercase, some channels have trailing spaces, big amounts have commas (\`1,36,800\` style), blank status, and 22 orders that were **re-sent** in a later file with an updated status.

The query builds silver and gold as CTEs. In dbt, each CTE block would become its own model file. Run it, then read the comments.`,
    { sql: {
      title: 'bronze → silver → gold in one query',
      setup: BRONZE_SETUP,
      starter: `-- 1) Bronze: what actually arrived (note the mess)
SELECT order_id, order_date, sku, channel, amount, status, _source_file
FROM bronze.orders_raw
WHERE order_id IN ('20', '24', '30', '77')
ORDER BY order_id, _dlt_load_id;

-- 2) Silver + 3) Gold
WITH silver_orders AS (            -- dbt model: stg_erp__orders
  SELECT order_id::int AS order_id,
         CASE WHEN order_date ~ '^\\d{2}/\\d{2}/\\d{4}$'
              THEN to_date(order_date, 'DD/MM/YYYY')
              ELSE order_date::date END            AS order_date,
         upper(trim(sku))                          AS sku,
         initcap(trim(channel))                    AS channel,
         replace(amount, ',', '')::numeric(12,2)   AS amount,
         NULLIF(status, '')                        AS status,
         row_number() OVER (PARTITION BY order_id
                            ORDER BY _dlt_load_id DESC) AS rn  -- latest version wins
  FROM bronze.orders_raw
),
gold_channel_month AS (            -- dbt model: mart_channel_monthly
  SELECT date_trunc('month', order_date)::date AS month,
         channel,
         count(*)    AS orders,
         sum(amount) AS revenue
  FROM silver_orders
  WHERE rn = 1                     -- deduplicated
    AND status IN ('Delivered', 'Shipped')
  GROUP BY 1, 2
)
SELECT * FROM gold_channel_month ORDER BY month, channel LIMIT 12;`,
      note: 'The first result shows bronze: order 20 appears twice (original + re-sent), order 24 has a DD/MM date and lowercase SKU, order 30 has "direct " with a trailing space. The second result is gold.',
      hint: 'Change `WHERE rn = 1` to `WHERE rn >= 1` and re-run. Revenue goes up: that is the double counting a missing dedupe step causes.',
    } },
    { warn: '**Two rules people break in their first stack.** (1) Never "fix" bronze with an UPDATE. If bronze is wrong, the source was wrong; fix it in silver so the history stays honest. (2) Never point a dashboard or an agent at bronze or silver "just for now". Once a report depends on a messy table, you can never clean that table without breaking the report.' },
    `## Why this matters for AI work
In the AI stages you will build an agent that answers finance questions with a \`run_readonly_sql\` tool. That agent will read **gold only**. Here is why gold makes AI work possible:

1. **Clear names.** An LLM writes better SQL against \`fct_sales.net_revenue_inr\` than against \`orders_raw.amt2\`.
2. **Tested numbers.** dbt tests guarantee there are no duplicates or orphan rows, so the agent cannot double count.
3. **Documentation travels.** dbt column descriptions become the data dictionary you paste into the agent's prompt.
4. **Safe permissions.** A database role that can only \`SELECT\` from the gold schema means the agent physically cannot read raw PAN numbers or change data.
5. **Stable contracts.** Gold column names do not change every time the ERP export changes; silver absorbs that.

This is the real reason FDE and AI-automation roles ask about dbt and medallion layers: **an AI system is only as good as the tables it reads.**`,
    { challenge: {
      id: 'dlt-ch-gold-channel',
      prompt: 'Build a tiny gold table from the practice data. For each `channel`, return `channel, orders, revenue` where: only orders with status **Delivered** or **Shipped** count, and the order\'s customer must exist in `customers` (orphans are excluded). `revenue` = sum of `amount`.',
      hint: 'INNER JOIN customers removes the orphan order 77. `status IN (...)` also drops NULL statuses automatically.',
      solution: `SELECT o.channel, count(*) AS orders, sum(o.amount) AS revenue
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status IN ('Delivered', 'Shipped')
GROUP BY o.channel`,
    } },
    { challenge: {
      id: 'dlt-ch-gold-quarantine',
      prompt: 'Good pipelines explain what they excluded. Return `order_id, reason` for every order that will **not** reach the revenue mart. Reasons, checked in this order: `orphan customer` (customer_id not in customers), `unknown status` (status is NULL), `returned` (status = Returned).',
      hint: 'LEFT JOIN customers, then a CASE in the order given. The WHERE keeps rows that match any of the three conditions.',
      solution: `SELECT o.order_id,
       CASE WHEN c.customer_id IS NULL THEN 'orphan customer'
            WHEN o.status IS NULL THEN 'unknown status'
            ELSE 'returned' END AS reason
FROM orders o
LEFT JOIN customers c ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL OR o.status IS NULL OR o.status = 'Returned'`,
    } },
    { real: 'Your monthly MIS pack already follows medallion layers. The SAP FBL3N dump you save untouched in the "raw" folder is **bronze**. The cleaned sheet where you fix dates, remove duplicates and map GL codes is **silver**. The P&L pivot the CFO sees is **gold**. The difference now: each step is SQL in Git, it runs on a schedule, and tests catch errors before the CFO does.' },
    `## Set up your data-stack workspace (do this once)
You will use one project folder for the whole ingestion and transformation stage (dlt, Airbyte, dbt) and its projects. We run a **separate** PostgreSQL 16 in Docker on port **5433**, so it does not clash with the PostgreSQL you installed natively in the SQL phase (which uses 5432).`,
    { local: `Open **PowerShell** (not CMD) and run these one by one:
\`\`\`powershell
mkdir C:\\fde\\sales-wh; cd C:\\fde\\sales-wh
py -3.12 -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install "dlt[postgres]" dbt-core dbt-postgres dagster dagster-webserver dagster-dbt dagster-dlt pandas
docker run --name wh-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=warehouse -p 5433:5432 -v wh_pgdata:/var/lib/postgresql/data -d postgres:16
\`\`\`
Check everything:
\`\`\`powershell
python --version        # Python 3.12.x
dlt --version           # dlt 1.x.x
dbt --version           # Core: installed: 1.x  /  Plugins: postgres: 1.x
dagster --version       # dagster, version 1.x.x
docker ps               # wh-postgres ... 0.0.0.0:5433->5432/tcp
\`\`\`
In DBeaver, create a new PostgreSQL connection: host \`localhost\`, port \`5433\`, database \`warehouse\`, user \`postgres\`, password \`postgres\`. Then run:
\`\`\`sql
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;
CREATE ROLE bi_reader LOGIN PASSWORD 'reader_pwd';   -- for Power BI and the AI agent later
GRANT USAGE ON SCHEMA gold TO bi_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA gold GRANT SELECT ON TABLES TO bi_reader;
\`\`\`
**Common errors:**
- \`Activate.ps1 cannot be loaded because running scripts is disabled\` → run \`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned\` once, then activate again.
- \`Bind for 0.0.0.0:5433 failed: port is already allocated\` → another container uses 5433. Run \`docker ps -a\`, then \`docker rm -f <name>\` or pick 5434.
- \`dbt: The term 'dbt' is not recognized\` → the venv is not active. Your prompt must start with \`(.venv)\`.
- pip fails building a package → you are on Python 3.13+ or 3.9. Use 3.12 (\`py -0\` lists installed versions).` },
    { interview: '**"Explain medallion architecture and why you used it."** Model answer: "Bronze is the raw landing zone, loaded as-is by dlt with load metadata, so we always have a receipt of what the source sent. Silver is typed, deduplicated and standardised in dbt staging models, one row per business entity, with tests on keys. Gold is the business layer: facts, dimensions and KPI marts that dashboards and our AI agent read. The benefit is that I can rebuild silver and gold from bronze at any time when logic changes, and every gold number traces back to a source file."' },
    `## Recap
- A data platform does four jobs: **ingest** (dlt), **transform** (dbt), **orchestrate** (Dagster), **serve** (gold → BI and agents).
- **ELT** loads raw data first and transforms with SQL inside the warehouse, so you can rebuild without re-extracting.
- **Bronze** = raw receipt, **silver** = clean and deduplicated, **gold** = business-ready and tested.
- Dashboards and AI agents read **gold only**; that is what makes their answers trustworthy.
- Your workspace: \`C:\\fde\\sales-wh\`, a Python 3.12 venv, and Postgres 16 in Docker on port 5433 with bronze / silver / gold schemas.`,
  ],
  quiz: [
    { q: 'What is the key difference between ETL and ELT?', o: ['ELT is only for cloud warehouses', 'ELT loads raw data first and transforms inside the warehouse', 'ETL is faster because it uses SQL', 'ELT never transforms data'], a: 1, why: 'In ELT the raw data lands untouched (bronze) and the transformation is SQL in the warehouse, so it can be rerun any time.' },
    { q: 'A dbt bug doubled last month\'s revenue in gold. In an ELT + medallion setup, what do you do?', o: ['Ask the ERP team to resend all files', 'UPDATE the gold table by hand', 'Fix the SQL model and rebuild silver/gold from bronze', 'Delete bronze and reload'], a: 2, why: 'Bronze still holds the raw data, so you fix the logic and rebuild. No re-extract and no manual edits.' },
    { q: 'Which layer should a Power BI report or an AI agent read?', o: ['Gold', 'Silver', 'Bronze', 'Whichever is fastest'], a: 0, why: 'Gold has stable names, tests and documentation. Reading silver or bronze ties reports to messy, changing tables.' },
    { q: 'Which tool in our stack decides *when* things run and who gets alerted on failure?', o: ['dlt', 'dbt', 'PostgreSQL', 'Dagster'], a: 3, why: 'Orchestration (schedules, sensors, retries, alerts) is Dagster\'s job.' },
    { q: 'You notice a wrong date format in bronze. Best fix?', o: ['UPDATE bronze so it is clean', 'Parse both formats in the silver staging model', 'Ignore it, gold will handle it', 'Drop the bad rows from bronze'], a: 1, why: 'Bronze is the honest receipt of what arrived. Cleaning belongs in silver.' },
    { q: 'Why does an AI agent give better answers on gold tables?', o: ['Gold tables are smaller', 'LLMs can only read gold schemas', 'Gold has clear names, tested numbers and documentation, and a read-only role can be limited to it', 'Gold is stored in a vector database'], a: 2, why: 'Clear names, tests, docs and safe permissions are exactly what an LLM-driven SQL tool needs.' },
  ],
  task: {
    title: 'Set up the data-stack workspace',
    steps: [
      'Create `C:\\fde\\sales-wh`, a Python 3.12 venv, and install dlt, dbt-core, dbt-postgres, dagster, dagster-webserver, dagster-dbt, dagster-dlt.',
      'Start Postgres 16 in Docker on port 5433 and create the bronze, silver and gold schemas plus the `bi_reader` role.',
      'Run `pip freeze > requirements.txt`, then `git init` and commit with a `.gitignore` that contains `.venv/`.',
      'On paper (or Excalidraw), draw your own version of the stack sketch above with the four jobs labelled. Save it as `docs/architecture.png`.',
    ],
    deliverable: 'A Git repo `sales-wh` with requirements.txt, .gitignore and docs/architecture.png, plus a screenshot of DBeaver showing the three schemas.',
  },
};
