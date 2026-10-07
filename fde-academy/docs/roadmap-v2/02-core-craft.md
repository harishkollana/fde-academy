# Stage 1 · Core craft (SQL, Python, pandas, Git, data modelling)

Closes with **Project A + Gate A**. Line format: `- [✅] \`lesson-id\` Title — covers`.

---
## Phase 1 · `sql` — SQL (PostgreSQL) · ★ core · 38 lessons

**Why companies need it.** SQL is asked in every data, analytics and automation interview, usually first, usually timed. Data engineers also need the *engine* side: transactions, indexes, plans, partitioning, incremental loads.
**Concept-first.** Lesson 1 shows what a relational database is doing (tables, keys, the logical order of a query) before any syntax.
**Setup.** PostgreSQL + DBeaver on Windows; the in-app PostgreSQL (PGlite) runs everything else with no install.
**Browser-runnable:** almost all lessons (real PostgreSQL in the browser). **Laptop only:** `pg_dump`, roles on a real server, `EXPLAIN` on bigger data, partition/VACUUM behaviour.

### Module A · SQL foundations
- ✅ `sql-setup` Install PostgreSQL and DBeaver; the practice data — install, create DB, load the Kollana Tech data, tour of tables, rows, columns, keys
- ✅ `sql-select` SELECT, WHERE, ORDER BY, LIMIT — first questions, DISTINCT, aliases, logical order of execution
- `sql-operators` Operators — IN, BETWEEN, LIKE, ILIKE, comparison and logical operators, AND/OR precedence
- `sql-nulls` NULLs — IS NULL, COALESCE, NULLIF, three-valued logic, NULLs in aggregates, `COUNT(*)` vs `COUNT(col)`
- `sql-case-cast` CASE, CAST and numbers — simple and searched CASE, `CAST` and `::`, ROUND, numeric precision, integer division

### Module B · Summarising data
- `sql-aggregates` Aggregates and GROUP BY — COUNT/SUM/AVG/MIN/MAX, COUNT DISTINCT, multiple group columns, HAVING vs WHERE, unbalanced journals
- `sql-conditional-agg` Conditional aggregation — `SUM(CASE WHEN …)`, FILTER, months-as-columns pivot
- `sql-rollup` Subtotals — GROUPING SETS, ROLLUP, CUBE, `GROUPING()`

### Module C · Joining tables
- `sql-joins` Joins — INNER, LEFT, RIGHT, FULL; ON vs WHERE; JoinVisualizer
- `sql-joins-advanced` Join patterns and traps — self join (employee–manager, account–parent), CROSS JOIN scaffolding, anti-join, semi-join, fan-out, NULL keys, many-to-many

### Module D · Subqueries and CTEs
- `sql-subqueries` Subqueries — scalar, IN, correlated, EXISTS
- `sql-ctes` CTEs — chained CTEs, recursive CTE for the account hierarchy and date series, CTE materialisation

### Module E · Window functions
- ✅ `sql-window-ranking` Window functions I — ROW_NUMBER, RANK, DENSE_RANK, top N per group, dedup
- `sql-window-analytics` Window functions II — LAG/LEAD month-on-month, running totals and YTD by fiscal year, moving averages, frames (ROWS vs RANGE), FIRST/LAST_VALUE, NTILE, percent of total; WindowViz

### Module F · Dates, text and JSON
- `sql-dates` Dates and time — DATE_TRUNC, EXTRACT, intervals, AGE, time zones, fiscal year April–March, `generate_series` calendar
- `sql-strings-regex` Strings and regex — TRIM…SPLIT_PART, CONCAT, REPLACE, REGEXP_REPLACE, `~`, validate GSTIN/IFSC/PAN; RegexTester
- `sql-json-arrays` JSON, JSONB and arrays — `->`, `->>`, `jsonb_each`, `jsonb_array_elements`, GIN-indexable queries, arrays and `unnest`, when not to use JSON

### Module G · Sets and reconciliation
- `sql-set-ops` Set operations — UNION vs UNION ALL, INTERSECT, EXCEPT
- `sql-reconciliation` Reconciliation queries — totals, EXCEPT, mismatches with tolerance, full GST reconciliation; FuzzyMatch

### Module H · Changing data safely
- `sql-dml` INSERT, UPDATE, DELETE — INSERT…SELECT, UPDATE…FROM, DELETE USING, RETURNING
- `sql-upsert-merge` Upsert and MERGE — `ON CONFLICT DO UPDATE`, MERGE, idempotent loads
- `sql-transactions-isolation` Transactions and isolation — BEGIN/COMMIT/ROLLBACK, savepoints, isolation levels, dirty/non-repeatable/phantom reads, MVCC in plain words; IsolationLevels simulator
- `sql-locks-deadlocks` Locks and deadlocks — row locks, `FOR UPDATE`, `SKIP LOCKED` job queues, advisory locks, deadlocks and how to avoid them

### Module I · Designing databases
- `sql-ddl` CREATE TABLE and constraints — data types, PK/FK/UNIQUE/CHECK/NOT NULL, DEFAULT, identity, audit columns, ALTER, views, materialized views
- `sql-modelling` Normalisation and keys — 1NF–3NF, surrogate vs natural keys, star-schema basics, SCD basics (runnable)

### Module J · Programmability, security and operations
- `sql-functions-procedures` Functions, procedures and triggers — SQL and PL/pgSQL functions, procedures, DO blocks, audit triggers, when logic belongs in the database
- `sql-roles-security` Roles, privileges and row-level security — roles, GRANT/REVOKE, schemas, RLS, SQL injection and prepared statements
- `sql-ops-backup` Operating PostgreSQL — `pg_dump`/`pg_restore`, `COPY`/`\copy`, extensions, config, `pg_stat_*`, connection pooling concept

### Module K · Performance
- `sql-performance` Indexes and EXPLAIN — B-tree, composite, unused index, EXPLAIN/ANALYZE basics, sargable filters, SELECT *
- `sql-indexes-deep` Indexes in depth — B-tree vs hash vs GIN vs GiST vs BRIN, partial, covering (INCLUDE), expression indexes, index bloat, when an index hurts
- `sql-explain-deep` Reading query plans — scan and join nodes, nested loop vs hash vs merge join, cost model, statistics and ANALYZE, bad row estimates; ExplainViz
- `sql-partitioning-maintenance` Partitioning and maintenance — declarative partitioning, pruning, VACUUM/autovacuum, bloat, table statistics

### Module L · Data-engineering SQL patterns
- `sql-incremental-loads` Incremental loads — watermarks, change detection, idempotent re-runs, late-arriving data, soft deletes
- `sql-scd2` SCD Type 2 in SQL — effective dating, MERGE-based SCD2, point-in-time queries; ScdViz
- `sql-advanced-patterns` Interview patterns — gaps and islands, sessionisation, cohorts and retention, funnels, top-N per group, pivot and unpivot, running streaks
- `sql-data-quality` Data quality in SQL — duplicates, null rates, orphans, ranges and outliers, layer reconciliation

### Module M · Dialects and interviews
- `sql-dialects` SQL across engines — PostgreSQL vs SQL Server (T-SQL) vs MySQL vs Snowflake vs BigQuery: syntax and behaviour differences cheat sheet
- `sql-interview-method` SQL interview method — approach, explain out loud, a practice routine that suits you, 3 timed challenges

**Lab.** Module L doubles as the lab. The 50 SQL arena problems (Task P) are your regular practice.
**Interview questions:** Explain the logical order of a query · WHERE vs HAVING · INNER vs LEFT JOIN with NULLs · Window function vs GROUP BY · What is an index and when does it not help? · Explain isolation levels and MVCC · How do you load incrementally and idempotently? · Find gaps/islands · How do you read `EXPLAIN ANALYZE`? · SCD2 design · Delete duplicates keeping the latest.

---
## Phase 2 · `python` — Python · ★ core · 26 lessons

**Why companies need it.** Python is the glue of data engineering and automation: ingestion, APIs, validation, orchestration code, tests. Interviews test the language *and* engineering habits (typing, tests, packaging, concurrency).
**Concept-first.** Lesson 1 explains how Python runs (interpreter, objects, names vs values, the memory model), because every confusing bug (mutable defaults, copies, closures) comes from it.
**Browser-runnable:** language lessons (Pyodide). **Laptop:** environments, pytest, concurrency timings, CLI, scheduling.

### Module A · Python core
- ✅ `python-setup-types` Setup, types, f-strings — install, VS Code, how Python runs, int/float/str/bool/None, f-strings
- ✅ `python-collections` Lists, tuples, dicts, sets — when to use which, copying, mutability
- `python-comprehensions-flow` Comprehensions and control flow — list/dict/set comprehensions, nested, enumerate, zip, unpacking, match
- `python-functions` Functions — positional/keyword args, defaults and the mutable-default trap, `*args/**kwargs`, closures, lambda, sorted with key, map, filter
- `python-modules` Modules and packages — imports, packages, `__name__ == "__main__"`, import paths

### Module B · Idioms every engineer uses
- `python-iterators-generators` Iterators and generators — lazy streams, `yield`, itertools, processing a file bigger than memory
- `python-decorators-context-managers` Decorators and context managers — writing `@retry`, `with` blocks, `contextlib`
- `python-oop-dataclasses` Classes and dataclasses — `__init__`, methods, dunder methods, dataclasses, composition vs inheritance, `@property`, protocols, reading class-based repos
- `python-typing-pydantic` Type hints and Pydantic — `list[str]`, Optional/Union/Literal, TypedDict, Protocol, Pydantic v2 models, constraints, custom validators
- `python-errors` Errors and exceptions — try/except/else/finally, raising, custom exceptions, retryable vs non-retryable, retry with backoff

### Module C · Files, text and time
- `python-files` Files and folders — pathlib, glob, `open`, csv and json modules, many files in a folder, shutil, zipfile
- `python-text-time-money` Text, dates and money — `re`, `datetime`/`zoneinfo`/`dateutil`, `decimal` for money (never float), hashlib, uuid, Indian number formats

### Module D · Concurrency and performance
- `python-concurrency` Threads, processes and the GIL — threading, multiprocessing, `concurrent.futures`, I/O-bound vs CPU-bound
- `python-asyncio` asyncio — async/await, event loop, gathering API calls, when async helps
- `python-performance` Profiling and performance — cProfile, timeit, memory, Big-O in practice, generators vs lists

### Module E · Engineering practice
- `python-logging-config` Logging and configuration — logging levels/handlers, one logger per module, env vars, `.env`, YAML/TOML
- `python-testing-pytest` Testing with pytest — fixtures, parametrize, mocking, tmp_path, coverage, testing transforms
- `python-quality-debugging` Code quality and debugging — Ruff, mypy basics, pre-commit, VS Code debugger and breakpoints
- `python-environments-packaging` Environments and packaging — venv, pip, `uv`, requirements vs `pyproject.toml`, project layout, wheels, PyInstaller
- `python-cli` Command-line tools — argparse, Typer, exit codes, `python run.py --month 2026-09`

### Module F · Python for data work
- `python-databases` Databases from Python — psycopg, SQLAlchemy Core/ORM, sessions and transactions, parameterised queries, pooling, bulk loads with COPY
- `python-http-apis` Calling APIs — requests/httpx, headers, auth, pagination, timeouts, retries with backoff, 4xx vs 5xx
- `python-scheduling` Scheduling — Windows Task Scheduler, cron, APScheduler, why you will outgrow it
- `python-security-secrets` Security basics in code — secrets handling, input validation, hashing, SQL injection, SSRF, dependency risks

### Module G · Interview
- `python-algorithms-de` Interview toolkit — hash maps, sorting, two pointers, parsing CSV and logs, complexity
- `python-interview-method` Python interview method — approach, solving aloud, a practice routine that suits you, 4 timed challenges

**Lab.** Module F doubles as the lab; the 30 Python arena problems are regular practice.
**Interview questions:** List vs tuple vs set · Mutable default arguments · What is a generator and why use one? · GIL: threads vs processes vs asyncio · `__eq__`/`__hash__` · Decorators · How do you test code that calls an API? · How do you make a script idempotent? · Why not float for money?

---
## Phase 3 · `pandas` — pandas and data files · ★ core · 10 lessons

**Why companies need it.** Most automation and reporting code ends up as DataFrame transformations and Excel/CSV/Parquet I/O. Interviews ask for groupby, merge, window-like logic and performance.
**Concept-first.** What a DataFrame really is (columnar blocks, index, dtypes), vectorisation, why `apply` is slow.

- `pandas-basics` DataFrames — Series/DataFrame, read_csv/read_excel, dtypes, loc/iloc/boolean masks/query
- `pandas-groupby-window` GroupBy and window logic — named aggregation, transform, rolling/expanding/shift
- `pandas-combine` Combining data — merge (`validate=`), concat, join, pivot_table, melt
- `pandas-dates-text` Dates and text — to_datetime, `.dt`, resample, periods, `.str`
- `pandas-cleaning` Cleaning — missing data, duplicates, dtypes, outliers, categoricals
- `pandas-performance` Speed and memory — vectorisation vs apply, dtypes, chunks, categorical, Arrow-backed dtypes
- `pandas-parquet-arrow` Parquet and Arrow — read/write Parquet, partitioned datasets, compression, schema
- `pandas-excel-openpyxl` Excel in and out — messy sheets, header rows, writing MIS packs with openpyxl (formats, widths, formulas, charts, multiple sheets)
- `pandas-validation-testing` Validating DataFrames — checks, schema validation, testing pandas transforms
- `pandas-reconciliation-lab` Lab: reconciliation in pandas — exact + tolerance + fuzzy matching on GST data

**Interview questions:** merge vs join vs concat · `loc` vs `iloc` · Why is `apply` slow? · How do you process a 10 GB CSV? · SettingWithCopyWarning · groupby + transform vs agg.

---
## Phase 4 · `git` — Git and GitHub · ★ core · 9 lessons

**Why companies need it.** Every job runs on pull requests. Interviewers check that you can recover from mistakes and collaborate.
**Concept-first.** Git as snapshots on a graph, and the three areas (working tree, index, repository).

- `git-mental-model` How Git thinks — commits as snapshots, the DAG, working tree/index/repo, HEAD; GitGraph
- `git-daily-workflow` Everyday workflow — init, add, commit, status, diff, log, `.gitignore`
- `git-branching-merging` Branches and merges — branch, switch, merge, fast-forward vs merge commit, conflicts, rebase basics
- `git-remotes-github` Remotes and GitHub — clone, fetch, pull, push, SSH keys / credential manager, GitHub UI
- `git-pull-requests` Pull requests and review — PR flow, forks, reviewing, templates, protected branches
- `git-undo-recovery` Undoing things — restore, reset (soft/mixed/hard), revert, amend, stash, reflog rescue
- `git-team-workflows` Team workflows — trunk-based vs gitflow, conventional commits, tags, releases, semantic versioning
- `git-security-hygiene` Keeping secrets out — leaked-secret recovery, `.env`, pre-commit hooks, signed commits
- `git-interview-lab` Lab: a clean repo history for Project A — meaningful commits, PR, README

**Interview questions:** merge vs rebase · reset vs revert · How do you undo a pushed commit? · You committed a secret, what now? · Describe your PR process.

---
## Phase 5 · `modelling` — Data modelling and warehousing · ★ core · 11 lessons

**Why companies need it.** The model decides whether reports are right, fast and trusted. Every data-engineer and analytics-engineer interview has a modelling question ("design a schema for…").
**Concept-first.** Business process → grain → facts and dimensions.

- `modelling-oltp-vs-dw` OLTP schema vs warehouse schema — why reporting models differ, normalised vs denormalised
- `modelling-dimensional-basics` Dimensional modelling (Kimball) — facts, dimensions, grain, star vs snowflake, the bus matrix
- `modelling-dimensions` Designing dimensions — surrogate keys, SCD types 0–6, role-playing, junk, degenerate, bridge dimensions, hierarchies; ScdViz
- `modelling-facts` Designing facts — transaction, periodic snapshot, accumulating snapshot, factless; additive/semi/non-additive measures, late-arriving facts, currency conversion
- `modelling-data-vault` Data Vault in one lesson — hubs, links, satellites, when it is used and when it is overkill
- `modelling-medallion-lakehouse` Medallion and lakehouse — bronze/silver/gold, Delta/Iceberg/Hudi concepts, ACID on files, time travel; MedallionStepper
- `modelling-warehouse-architecture` Warehouse architecture — Inmon vs Kimball, staging, ODS, marts, MPP columnar engines, distribution/partition/cluster keys
- `modelling-quality-contracts` Quality and data contracts — tests, expectations, contracts between teams, SLAs
- `modelling-lineage-catalog` Lineage, catalog and metadata — column-level lineage, ownership, glossary
- `modelling-semantic-layer` Semantic layer and metrics — one definition of revenue, KPI governance, semantic models
- `modelling-finance-case-study` Case study: model Kollana Tech's GL — star schema, runnable in the browser

### Project A · Finance Reporting Automation Engine (`proj-a`) + Gate A
Follows PDF Project 0, steps 1–7, using everything from Stage 0–1: synthetic data → PostgreSQL schema (PK/FK/CHECK/audit, `dim_date` with fiscal year) → validated ingestion → SQL transformations (recursive CTE P&L, restatement, variance, YTD/MoM) → Excel MIS pack → engineering (logging, `.env`, `python run.py --month 2026-09`, pytest, Git history) → publish (README, 3-minute video). The Power BI report is added later in the Power BI lab.
**Interview questions:** Star vs snowflake · What is the grain? · Design a schema for … · SCD2: how and why? · Additive vs semi-additive measures · Kimball vs Inmon vs Data Vault · Where would you put data quality tests?
