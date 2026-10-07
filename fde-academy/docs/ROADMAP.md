# Harish's Master FDE / AI Automation Roadmap (source: Notion, 2026-10-04)

> **STATUS (4 Oct 2026): this file is the ORIGINAL 24-week plan from the Notion/PDF export, now complete (Resources and Sources added from the PDF).**
> **Ignore every week number, hour count and "time" rule below: Harish goes at his own pace and V2 has no schedule.** The course has since been re-planned into a deeper, one-tool-per-phase journey: see `docs/roadmap-v2/00-index.md`. Where the two differ, **roadmap-v2 wins**. This file is still the checklist source for the topics every V2 phase must keep covering.

Built from Harish's resume and merged with the "RPA → FDE" and "Forward Deployed Engineer / AI Automation Engineer" notes.

Six phases over ~24 weeks. Each phase ends with one portfolio project and an apply gate: the remote roles you can apply for with what you've built so far. Keep applying from Gate A onward; each gate adds better-paid titles. Remote first; relocation (Hyderabad/Bengaluru) fallback after Gate D.
- Time: 2–3 h weekdays, 3–4 h Saturday building, Sunday revision + applications.
- Data rule: every project uses synthetic data generated yourself (Faker, reportlab). No client data, no client names, nothing that breaks company policy.
- Resume rule: don't list individual client projects; keep domain groupings (Finance, Sales, Supply Chain, HR & Compliance); add portfolio projects in a separate "Projects" section with GitHub links.

| Phase | Weeks | Project | Apply gate | Rough target |
|---|---|---|---|---|
| 0 · SQL + Python recap | 1–4 | Finance Reporting Automation Engine | A: Reporting / BI automation, Python automation | 13–18 LPA |
| 1 · Microsoft automation layer | 5–7 | GST Reconciliation in the Cloud | B: Intelligent automation, Power Platform | 15–20 LPA |
| 2 · Engineering foundations | 8–11 | Payroll Bank Mandate Validation API | C: Python automation, integration engineer | 15–22 LPA |
| 3 · Modern data stack (properly) | 12–14 | Sales & Inventory Analytics Warehouse | C+: Analytics engineer, data engineer | 15–22 LPA |
| 4 · AI engineering | 15–19 | Invoice-to-Ledger AI + Ask-Your-Finance-Data | D: AI automation, applied AI | 18–25 LPA |
| 5 · Agents and production | 20–24 | AI Data Operations Agent (flagship) | E: FDE, AI deployment, solutions engineer AI | 20–30+ LPA |

Targets are rough planning numbers, not guarantees. A genuine FDE role with production AI work at 15–20 is worth taking: it sets up 30+ on the next move.

---
## Phase 0 · SQL + Python recap (weeks 1–4)
Weeks 1–2.5 recap (PostgreSQL + VS Code), weeks 2.5–4 build Project 0. 30 min interview-style practice daily without AI.

### SQL recap (PostgreSQL)
Setup: Install PostgreSQL + DBeaver (or pgAdmin); create a practice database · Load a sample dataset (or synthetic finance data from Project 0 step 1)
Fundamentals: SELECT, WHERE, ORDER BY, LIMIT/OFFSET, DISTINCT · Operators: IN, BETWEEN, LIKE, ILIKE, comparison and logical · NULL handling: IS NULL, COALESCE, NULLIF, NULLs in comparisons and aggregates · CASE WHEN (simple and searched) · Column and table aliases; CAST and :: conversion; ROUND, numeric precision
Aggregation: COUNT, COUNT DISTINCT, SUM, AVG, MIN, MAX · GROUP BY multiple columns; HAVING vs WHERE · Conditional aggregation: SUM(CASE WHEN …), Postgres FILTER · GROUPING SETS, ROLLUP, CUBE (subtotals like an Excel pivot)
Joins: INNER, LEFT, RIGHT, FULL OUTER · Self join (employee–manager, account–parent) · CROSS JOIN for scaffolding (every entity × every month) · Anti-join: LEFT JOIN … WHERE key IS NULL, and NOT EXISTS · Semi-join: EXISTS · Join pitfalls: duplicate fan-out, NULL keys, many-to-many
Subqueries and CTEs: Scalar, IN and correlated subqueries · Chained CTEs for step-by-step logic · Recursive CTE: hierarchy (chart of accounts) and date series
Window functions: ROW_NUMBER, RANK, DENSE_RANK; dedup with ROW_NUMBER · PARTITION BY + ORDER BY · LAG/LEAD month-on-month · Running totals and YTD: SUM() OVER (ORDER BY …) · Moving averages with ROWS BETWEEN · FIRST_VALUE, LAST_VALUE, NTILE; percent of total
Dates and strings: DATE_TRUNC, EXTRACT, intervals, date differences, AGE · Fiscal year and fiscal month logic (April–March) · generate_series to build a calendar / dim_date · TRIM, UPPER/LOWER, SUBSTRING, SPLIT_PART, CONCAT, REPLACE · Regex: REGEXP_REPLACE, ~ matching (validate GSTIN or IFSC)
Set operations and reconciliation: UNION vs UNION ALL, INTERSECT, EXCEPT · Reconciliation queries: source vs target totals, missing records with EXCEPT, mismatched amounts
Changing data: INSERT, INSERT … SELECT, UPDATE with a join, DELETE · Upsert: INSERT … ON CONFLICT DO UPDATE; MERGE · Transactions: BEGIN, COMMIT, ROLLBACK
Modelling and DDL: CREATE TABLE, data types, PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, NOT NULL, DEFAULT · Normalisation 1NF 2NF 3NF · Star schema: facts vs dimensions, surrogate keys, grain · SCD type 1 and 2 · Audit columns: created_at, updated_at, loaded_by, source_file · Views and materialized views (REFRESH MATERIALIZED VIEW)
Performance: Indexes: B-tree, composite, when an index is not used · EXPLAIN and EXPLAIN ANALYZE; reading a plan · Sargable filters; avoid SELECT * in production · Partitioning (concept)
Data quality checks in SQL: duplicate detection, null-rate checks, orphan records · range and outlier checks; row-count and total reconciliation between layers
Practice: LeetCode SQL 50 / DataLemur: 40 problems medium (→ our in-app Practice Arena replaces this) · Explain every answer out loud as if in an interview

### Python recap
Core: types int float str bool None; f-strings, string methods · lists, tuples, dicts, sets; when to use which · comprehensions list/dict/set, nested · control flow; enumerate, zip, unpacking · functions: positional & keyword args, defaults, *args, **kwargs, return · lambda, sorted with key, map, filter · modules, packages, imports; if __name__ == "__main__":
Files and folders: pathlib; glob; with open() · csv and json modules; reading many files from a folder · shutil: move, copy, archive processed files; zip files
Error handling: try/except/else/finally · raising errors; custom exceptions (ValidationError, MissingColumnError) · retryable vs non-retryable errors; retry loop with backoff
Classes: classes, __init__, methods, attributes · dataclasses · composition vs inheritance; @property · reading class-based code in real repos
Type hints and validation: list[str], dict[str, float], Optional, Union, Literal · TypedDict · Pydantic BaseModel: validation, field constraints, custom validators
Logging and config: logging levels, format, file handler, one logger per module · env vars, .env with python-dotenv · config files YAML or TOML
Environment and packaging: venv, pip, requirements.txt; try uv · project structure app/, tests/, data/, logs/, config/ · CLI scripts with argparse or Typer · PyInstaller exe (he has done this; know how it works)
Pandas: read_excel (multiple sheets, header rows, usecols), read_csv; dtypes on read · loc, iloc, boolean masks, query · groupby + agg (named aggregations) · merge (inner/left, validate="one_to_one"), concat · pivot_table and melt · dates: to_datetime, .dt, resample, period · .str methods · missing data, duplicates, data types, outliers · vectorisation vs apply; chunks for large files · writing Excel with openpyxl: formats, column widths, formulas, multiple sheets
Databases from Python: SQLAlchemy engine + psycopg · pd.read_sql and df.to_sql; bulk loads · parameterised queries (never f-string SQL: injection) · transactions from Python
APIs from Python: requests or httpx GET, POST, headers, params, JSON bodies · auth: API keys, bearer tokens · pagination, timeouts, retries with backoff, 4xx vs 5xx
Testing and tooling: pytest functions, fixtures, parametrize, testing pandas transforms · Ruff lint + format · VS Code debugger, breakpoints · Git: init, add, commit, branch, merge, push, pull requests, .gitignore
Scheduling: Windows Task Scheduler and cron basics
Practice: 30 interview-style problems: strings, hash maps, sorting, two pointers, parsing CSV and logs · solve without AI, then compare with AI

### Project 0 · Finance Reporting Automation Engine
Your day job, rebuilt cleanly and publicly: monthly P&L with currency restatement, budget vs actual, and exception reporting.
Step 1 Synthetic data: Python + Faker GL transactions for 3 companies, 4 BUs, 12 months, 3 currencies · masters in Excel: chart of accounts (with parents), entity master, BU master · budget file (Excel) and monthly FX rates (CSV) · inject errors: unknown accounts, missing FX rates, unbalanced journals, duplicates, wrong date formats
Step 2 Database: tables dim_account, dim_entity, dim_bu, dim_date, dim_currency, fx_rates, fact_gl, fact_budget, load_log, exceptions · DDL with PK/FK, CHECK, audit columns · dim_date with generate_series incl. fiscal year Apr–Mar
Step 3 Ingestion with validation (Python): watch input/ folder · schema checks (required columns, data types, sheet names) · business rules: debits = credits per journal, account exists, FX rate exists for currency+month, no duplicate journal lines · valid rows → upsert into fact_gl; invalid → exceptions table + exception_report.xlsx · move processed files to archive/, record each run in load_log
Step 4 Transformations (SQL): P&L view by entity, BU, month via account hierarchy (recursive CTE) · currency restatement at actual and constant rates · budget vs actual variance and % · YTD and MoM with windows
Step 5 Outputs: formatted Excel MIS pack with openpyxl (summary + detail sheets) · Power BI report on the views
Step 6 Engineering: logging to logs/, config in .env, one command `python run.py --month 2026-09` · pytest for every validation rule · meaningful Git history
Step 7 Publish: README (problem, architecture diagram, data model, validation rules, before/after manual hours vs runtime, screenshots) · 3-minute walkthrough video
Resume line: Built a Python + PostgreSQL finance reporting engine that validates multi-entity GL data, restates currencies, and produces P&L and budget-variance MIS packs with automated exception reporting.

### Gate A · apply from week 4
Titles: Reporting Automation Engineer, BI Automation Engineer, Python Automation Engineer, Analytics Engineer, Finance Data Analyst (automation)
- Update resume headline to "Data & Process Automation Engineer | Python | SQL | Power BI"
- 5 targeted remote applications a week from now on

---
## Phase 1 · Microsoft automation layer (weeks 5–7)
Learn: Power Automate cloud flows: triggers, actions, conditions, variables, expressions, Apply to each, scheduled flows · SharePoint, OneDrive, Outlook, Teams, Excel connectors; approvals; adaptive cards in Teams · error handling: Configure run after, scopes (try/catch), retry policies · licensing: which connectors (e.g. HTTP) need premium; Microsoft developer plan if available · Azure basics: resource groups, Storage, Key Vault, Azure Functions in Python (HTTP trigger) · Copilot Studio: a small agent that triggers a flow

### Project 1 · GST Reconciliation in the Cloud
Purchase register vs supplier-reported data (GSTR-2B style), automated end to end in the Microsoft stack.
Step 1 Synthetic data: purchase register (Excel) and supplier invoices (Excel) with Faker · inject: exact match, amount mismatch, invoice-number typo, missing either side, wrong GSTIN
Step 2 SharePoint: document library with folders Incoming / Processed / Exceptions · a SharePoint list to log each run (file, status, counts, timestamp)
Step 3 Azure Function (Python): HTTP-triggered, receives both files · match on GSTIN + invoice number + amount, with rounding tolerance and fuzzy match for typos · classify matched / mismatched / missing in books / missing in supplier data · write results to Azure SQL (or Postgres) and return an Excel report
Step 4 Power Automate: trigger file created in Incoming · get file content → call Function → save report to Processed · Teams adaptive card summary + approval to finance lead · on approval email the report; on rejection move to Exceptions with comments · error scope: notify on failure, log to SharePoint list
Step 5 Report and publish: Power BI page on reconciliation status and ageing of mismatches · README with architecture diagram, flow screenshots (export flow definition), Function code, walkthrough video
Resume line: Automated GST purchase reconciliation using SharePoint, Power Automate and a Python Azure Function, with fuzzy matching, Teams approvals and Power BI exception tracking.
### Gate B · apply from week 7
Titles: Intelligent Automation Engineer, Power Platform Developer, Process Automation Engineer, Automation Consultant

---
## Phase 2 · Engineering foundations (weeks 8–11)
Learn: FastAPI routes, path/query params, request bodies, Pydantic models, status codes, dependency injection · background tasks; file uploads · webhooks, pagination, rate limits, retries with backoff, idempotency keys · auth: OAuth2 password flow, JWT access tokens, role-based access · Docker: Dockerfile, images, containers, volumes, env vars; docker compose with Postgres · GitHub Actions: Ruff + pytest on push; build the Docker image · Azure: Container Apps (or App Service), Key Vault, Application Insights
### Project 2 · Payroll Bank Mandate Validation API
Pre-payroll checks that catch bad bank details before salaries go out. Synthetic employees only (fake names, fake account numbers).
Step 1 Synthetic data: employee master + monthly payroll files (Faker) · inject invalid IFSC, duplicate account across employees, name mismatch vs master, salary jump vs last month, missing PAN
Step 2 Database: employees, payroll_runs, files, validation_results, exceptions, users, audit_logs
Step 3 API: POST /payroll-files (upload, store, start validation as background job) · GET /jobs/{id} · GET /jobs/{id}/exceptions (paginated, filter by rule) · POST /exceptions/{id}/resolve (comment, audit logged)
Step 4 Rules: IFSC regex, account length, duplicates, fuzzy name match vs master, salary outlier vs previous month, mandatory fields · each rule a small tested function; rules configurable in YAML
Step 5 Security: JWT login; roles uploader, reviewer, admin · mask account numbers in logs and responses
Step 6 Ship: docker compose (api + db); pytest for rules and endpoints · GitHub Actions CI; deploy to Azure; secrets in Key Vault; logs in Application Insights · /docs screenshot in README + walkthrough video
Resume line: Built and deployed a containerised FastAPI service on Azure that validates payroll bank mandates with configurable rules, JWT role-based access, audit logging and CI/CD.
### Gate C · apply from week 11
Titles: Python Automation Engineer, Integration Engineer, Backend Engineer (data), Solutions Engineer (data) · start Python coding practice 3–4 medium problems a week

---
## Phase 3 · Modern data stack, properly (weeks 12–14)
(He vibe-coded dlt + dbt + Dagster before; this time by hand.)
Learn: dlt: sources, resources, incremental loading, schema evolution, write dispositions (append, merge) · dbt: models, ref(), sources, materializations (view, table, incremental), tests, docs, seeds, macros basics · medallion bronze/silver/gold · Dagster: assets, jobs, schedules, sensors, dbt and dlt integrations
### Project 3 · Sales & Inventory Analytics Warehouse
Step 1 Sources: synthetic ERP exports (orders, products, price lists, promotions, inventory movements) as daily CSV drops · one REST API source (public API or small FastAPI mock) for products or prices
Step 2 Ingestion dlt → bronze: incremental loads from files and API into Postgres bronze · handle a schema change (new column) and show dlt evolving it
Step 3 dbt → silver and gold: silver typed, deduplicated, standardised staging · gold: price-volume-mix, slow-moving inventory with ageing buckets, promotion uplift, SKU and channel performance · dbt tests (not_null, unique, relationships, accepted_values) and dbt docs
Step 4 Dagster: assets for dlt and dbt; daily schedule; sensor for new file · failure alert (email or Teams webhook)
Step 5 Serve: dashboard on gold views (React or Power BI) · docker compose for whole stack; README with dbt lineage graph; walkthrough video
Resume line: Designed a medallion data warehouse using dlt, dbt and Dagster on PostgreSQL, with incremental ingestion, tested gold marts for price-volume-mix and slow-moving inventory, and a dashboard layer.
### Gate C+ · apply from week 14
Titles: Analytics Engineer, Data Engineer, Data Platform Engineer (junior/mid)

---
## Phase 4 · AI engineering (weeks 15–19)
Learn: LLM basics: tokens, context windows, temperature, system vs user messages, model choice, cost · structured outputs with JSON schema / Pydantic · tool (function) calling · Azure OpenAI as well as a direct provider API · embeddings, chunking, retrieval, reranking (concept), citations; one vector DB: Qdrant · evals: test sets, accuracy, latency, cost; regression testing prompts · guardrails: input/output validation, prompt injection, PII handling, read-only tools, human-in-the-loop
### Project 4 · Invoice-to-Ledger AI + Ask-Your-Finance-Data
Step 1: 50 PDF invoices with reportlab in 5 layouts (some scanned-looking)
Step 2 Extraction: Pydantic Invoice schema (supplier, GSTIN, invoice number, date, line items, tax, total) · LLM structured extraction; validation totals = lines + tax, GSTIN format, date sanity · low-confidence / failed → human review queue (table + simple UI or Excel) · approved invoices load into the Project 0 database
Step 3 Ask-Your-Finance-Data agent: tools run_readonly_sql over gold views only, get_variance(entity, month), explain_kpi(name) · guardrails: allowed tables, row limits, no writes, refuse out-of-scope
Step 4 RAG over policies: write 10 synthetic accounting SOP/policy docs · chunk, embed, store in Qdrant; answers with citations; "I don't know" when not found
Step 5 Evals: extraction accuracy per field on all 50 invoices · 50-question eval set for agent + RAG with expected answers; accuracy, latency, cost per question
Step 6 Publish: FastAPI endpoints + simple chat UI; Docker; README with eval results table; walkthrough video
Resume line: Built an LLM invoice-extraction pipeline with schema validation and human review, plus a tool-calling finance Q&A agent and RAG over policies, measured with field-level and question-level evals.
### Gate D · apply from week 19
Titles: AI Automation Engineer, Applied AI Engineer, GenAI Engineer, AI Application Engineer, AI Integration Engineer · if remote traction is weak, add relocation roles

---
## Phase 5 · Agents and production (weeks 20–24)
Learn: LangGraph: state, nodes, edges, conditional routing, persistence, human-approval interrupts · MCP: servers, tools, resources, permissions; connect a client · observability: logs, metrics, traces of every LLM and tool call; cost per run · system design: AI document pipeline, support agent, RAG over 10,000 PDFs, safe action-taking agent
### Project 5 · AI Data Operations Agent (flagship)
Problem: client files arrive with renamed columns, missing sheets, changed formats; automation breaks.
Step 1: take Project 0 inputs and create 40 broken variants: renamed/missing columns, extra header rows, merged cells, new sheet names, date-format changes, currency codes changed
Step 2 Deterministic first: Project 0 validator runs first; valid files go straight through
Step 3 Agent for failures (LangGraph): diagnose node (compare schema to expected, classify) · lookup node (RAG over SOPs and past fixes) · propose node (column mapping or transformation fix) · risk node (auto-fix only low-risk; otherwise human approval via Teams/Power Automate or webhook) · re-run node (apply fix, re-validate, load, notify)
Step 4 Tools via MCP: MCP server exposing read_file_schema, validate_file, apply_mapping, run_pipeline, notify
Step 5 Production: FastAPI + Docker + Azure; traces for every step; cost per run; audit log of every fix and approval
Step 6 Evals and publish: run all 40 scenarios: % correctly diagnosed, % safely auto-fixed, % correctly escalated, average cost and time · README with architecture, eval table, before/after; 5-minute demo video
Resume line: Built an AI data-operations agent (LangGraph, MCP, FastAPI, Azure) that diagnoses broken client files, auto-fixes low-risk schema issues and escalates the rest for approval, evaluated on 40 failure scenarios.
### Gate E · apply from week 24
Titles: Forward Deployed Engineer, Forward Deployed Software Engineer, AI Deployment Engineer, AI Solutions Engineer, Customer Engineer AI
Interview prep: 6 STAR stories from client work (no client names): most complex multi-step automation, an unclear process you uncovered, a production failure, pushing back on a request, measurable impact (2–3 days → 30 minutes), learning a tool fast · system design practice weekly; 2 mock interviews a week

---
## Not now (skip until a job asks)
UiPath and Power Automate Desktop · Airflow (Dagster covers the concept) · Fabric, Databricks, PySpark, Snowflake · MLOps courses and ML theory books · AWS, GCP, multiple certifications (one Azure cert at most; confirm the current exam before booking) · Kubernetes, Kafka, Terraform, CrewAI, AutoGen, LlamaIndex
> V2 note: the V2 plan deliberately teaches Airflow, Spark/PySpark, Databricks, Snowflake and Kafka (and offers Kubernetes, Terraform, Fabric as optional levels), because Harish asked for a full data-engineer depth. UiPath / Power Automate Desktop, MLOps theory, AWS/GCP deep dives, CrewAI, AutoGen and LlamaIndex stay out.

---
## Resources (one per topic) — from the PDF, page 17
| Topic | Resource |
|---|---|
| SQL practice | LeetCode SQL 50 or DataLemur; PostgreSQL docs *(this app's Practice arena replaces the practice part)* |
| Python + pandas | Official Python tutorial; pandas user guide |
| Power Automate | [Microsoft Learn — Power Automate](https://learn.microsoft.com/en-us/training/powerplatform/power-automate) |
| FastAPI | [FastAPI official tutorial](https://fastapi.tiangolo.com/tutorial/) |
| Docker | [Docker Get Started](https://docs.docker.com/get-started/) |
| dlt, dbt, Dagster | Each tool's official docs and tutorials |
| LLM apps, RAG, evals | [LLM Zoomcamp](https://courses.datatalks.club/llm-zoomcamp-2025/) · provider docs |
| Vector DB | [Qdrant tutorials](https://qdrant.tech/documentation/tutorials/) |
| Agents | [LangChain / LangGraph docs](https://docs.langchain.com/oss/python/langchain/overview) |
| Book | *AI Engineering* by Chip Huyen |

These are the PDF's suggested outside resources. This app is meant to be Harish's only resource, so lessons use them only as a single optional "go deeper" link at the very end.

## Sources — from the PDF, page 18
- CIEL HR: FDE demand study, Aug 2026 — https://www.cielhr.com/?p=357198
- BuildFastWithAI: FDE salary bands India 2026 — https://www.buildfastwithai.com/blogs/forward-deployed-engineer-salary-india
- FDE Academy: FDE jobs in India — https://fde.academy/blog/forward-deployed-engineer-jobs-in-india
- Salesforce FDE listing — https://jobs.accel.com/companies/airkit-2/jobs/87226715-forward-deployed-engineer-agentforce-data-cloud
- Lenovo FDE listing and Apple FDE listing — https://to.indeed.com/aaf4w8p9822q and https://to.indeed.com/aaypj94v8msq *(the PDF has two short links here; which one is Lenovo and which is Apple is not recoverable from the export)*
