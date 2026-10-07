# FDE Academy — Content & Build Spec (read fully before writing anything)

## 1. Who this is for
Harish: 4.6 years as a process-automation specialist in India (finance, sales, supply chain, HR & compliance automations; Python scripts, Excel, Power BI, some SQL). B.Tech Mechanical, doing an MBA in International Finance. Goal: move into **Forward Deployed Engineer / AI Automation Engineer** roles (remote first).

He said: **"I don't want to learn from any other resource, this should be final."** So every lesson must be **self-contained and complete**: explain from zero, show the syntax, show real examples, give practice, check understanding. If a topic needs an install on his Windows laptop, give exact steps. Never say "see the docs for details" as a substitute for teaching. You may add a single "go deeper" link at the very end of a lesson, nothing more.

### Writing style (very important)
- **Simple English** (B1 level). Short sentences. One idea per paragraph. Explain every term the first time ("A *primary key* is the column that uniquely identifies each row, like an employee ID").
- Use **Indian finance / business examples**: GL journals, P&L, budget vs actual, GST reconciliation, GSTIN, IFSC, PAN, payroll, fiscal year April–March, ₹, LPA, vendors, invoices, MIS packs. He knows the business side well; connect each concept to his day job ("In your real job…" callouts).
- Analogies are welcome (one per lesson is enough).
- Warm, direct, no fluff, no hype, no emojis inside prose (emojis only in callout headers, which the app adds).
- Each lesson: **800–1600 words of explanation** in total across markdown blocks, plus code, plus interactive parts.
- End every lesson's content with a `## Recap` markdown block (3–6 bullets).

## 2. Files & ownership
The app is React + Vite in the repository root. **Only write the files you are assigned.** Never edit other agents' files. Never edit anything in `src/components`, `src/lib`, `src/data` unless fixing a real bug.

> **V2 (4 Oct 2026):** the curriculum is `docs/roadmap-v2/` (41 phases, 403 lessons after the 5 Oct 2026 revision; no weeks, hours or deadlines: Harish goes at his own pace). Each task = one phase (or a slice of a big one). Read `docs/roadmap-v2/00-index.md` and the stage file for your phase. The lesson list in that file is the contract: write those ids, in that order, with those titles; `npm run status` checks plan vs files.

Content files are **pure data JavaScript ES modules** (no React, no JSX, no imports except other content files you own). Use explicit `.js` extensions in imports (Node runs them).

Layout (one lesson per file keeps each Write call manageable):
```
src/content/phases/<phase-id>.js             <- the phase aggregator you own (already exists as a stub)
src/content/phases/<phase-id>/<lesson-id>.js <- one lesson per file, `export default { ...lesson }`
src/content/phases/<phase-id>/shared.js      <- optional shared setup snippets for that phase
```
Aggregator example (modules follow the `### Module X · …` headings in the roadmap file):
```js
import selectBasics from './sql/sql-select.js';
import nulls from './sql/sql-nulls.js';
export default {
  modules: [
    { id: 'sql-mod-foundations', title: 'SQL foundations', lessons: [selectBasics, nulls] },
  ],
  // project: {...}, gate: {...}   (only on the phase that closes a stage; see the roadmap file)
};
```
The app finds `phases/<phase-id>.js` automatically; there is nothing else to register. If your aggregator already exists (a stub or a partly done phase), **Read it first**, then extend it. After editing the roadmap docs run `npm run plan` to refresh `src/content/plan.json`.

## 3. Validation (mandatory)
Run after every few lessons and before you finish:
```
npm run validate -- src/content/phases/<phase-id>.js
```
It checks the schema AND **executes** every SQL playground/challenge against the real seeded PostgreSQL (PGlite) and every Python playground/challenge with python3 + pandas 2.3. **Finish only with 0 errors.** Fix warnings where reasonable (missing sketch/playground warnings are OK for lessons where that truly does not fit, but most lessons should have both).

JS string escaping: markdown blocks are template literals. Inside them escape backticks as \` and `${` as `\${`. Code fences therefore look like \`\`\`sql … \`\`\`. Look at `docs/example-lesson.js` — it is the **reference example of format and quality**. Read it first.

## 4. Lesson schema
```js
{
  id: 'sql-joins',                 // kebab-case, globally unique, MUST start with its phase id + '-' (sql-, python-, azure-functions-…); the file is named <id>.js
  title: 'LEFT JOIN: keep everything on the left',
  goal: 'One sentence: what you can DO after this lesson.',
  roadmap: ['INNER, LEFT, RIGHT, FULL OUTER'],   // the Notion roadmap checklist items this lesson covers (verbatim-ish)
  blocks: [ ...see block types... ],
  quiz: [ { q: 'question (markdown inline ok)', o: ['opt A', 'opt B', 'opt C', 'opt D'], a: 1, why: 'explanation' } ],  // 5–6 questions, vary the correct index
  task: { title: 'Do it on your laptop', steps: ['step', 'step'], deliverable: 'what file/commit/screenshot proves it' },
}
```

### Block types (array items in `blocks`)
| Block | Shape | Notes |
|---|---|---|
| Markdown | `'string'` | Supports `## h2`, `### h3`, paragraphs, `- lists`, `1. lists`, fenced code \`\`\`lang, pipe tables, `> quote`, **bold**, *italic*, \`code\`, ==highlight==, [links](url). |
| Sketch | `{ sketch: { w, h, caption, items: [...] } }` | Hand-drawn diagram (rough.js). See §5. **At least one per lesson.** |
| SQL playground | `{ sql: { starter, note?, hint?, solution?, setup?, title? } }` | Runs in a fresh copy of the seeded DB. `setup` = SQL run once before (e.g. CREATE TABLE for a DDL lesson). Multiple statements allowed; all result sets are shown. |
| SQL challenge (auto-graded) | `{ challenge: { id, prompt, solution, hint?, starter?, ordered?, level? } }` | Learner result is compared to the `solution` result (values only, column names ignored; numbers rounded to 2dp). `ordered: true` only if the prompt demands an order. Solution must be ONE SELECT/WITH query returning ≥1 row. Tell the learner exactly which columns to return, in which order. |
| Python playground | `{ py: { starter, note?, hint?, solution?, title? } }` | Pyodide in the browser. Working dir has the CSV files (§6). |
| Python challenge (auto-graded) | `{ pychallenge: { id, prompt, starter, tests, solution, hint? } }` | `tests` is Python with `assert`s, run after the learner code in the same namespace. Starter must FAIL the tests. Ask for a function with a fixed name/signature. |
| Widget | `{ widget: 'Name', props?: {} }` | Interactive simulators, see §7. |
| Checklist | `{ checklist: ['item', 'item'] }` | Tickable items (saved). |
| Two columns | `{ cols: ['markdown', 'markdown'] }` | Good for "bad vs good", "SQL vs pandas". |
| Callouts | `{ tip: 'md' }` `{ warn: 'md' }` `{ analogy: 'md' }` `{ interview: 'md' }` `{ real: 'md' }` `{ remember: 'md' }` `{ local: 'md' }` | `real` = "In your real job", `local` = "Do this on your laptop" (exact steps/commands), `interview` = how it is asked in interviews + a model answer. |

**Good lesson rhythm:** problem in his words → sketch → concept in plain English → syntax with comments → runnable playground → a gotcha (`warn`) → widget if one fits → 1–3 auto-graded challenges (SQL/Python lessons) → `real` or `interview` callout → `## Recap`.

For topics that cannot run in a browser (Power Automate, Azure, FastAPI, Docker, dbt, Dagster, LangGraph, MCP…): teach with sketches + full annotated code in fenced blocks + the relevant widget + `local` callouts with exact commands and **what output to expect**, + common errors and their fixes. Python playgrounds can still simulate the *logic* (e.g. a reconciliation matcher, a validation rule, an idempotency store, a chunker) in plain Python/pandas.

## 5. Sketch (hand-drawn diagram) API
Coordinates are in a viewBox; use `w: 760` and `h` between 180 and 460. Keep everything inside the canvas. Text is a handwriting font ~18px: allow ~9px per character for labels, ~7px for 14px text. Use `\n` for multi-line labels.

| type | fields |
|---|---|
| `box` | `x, y, w, h, label, sub?, fill?, color?, size?` |
| `db` (cylinder) | `x, y, w, h, label, fill?` |
| `doc` (file icon) | `x, y, w, h, label, fill?` |
| `circle` | `x, y (centre), r, label?, fill?` |
| `cloud` | `x, y, w, h, label` |
| `person` | `x, y (head centre), label` (≈ 80px tall incl. label) |
| `note` (sticky note) | `x, y, w, h, text, fill?` |
| `arrow` | `x1, y1, x2, y2, label?, dashed?, color?, bend? (px curve), lx?, ly? (label offset)` |
| `line` | `x1, y1, x2, y2, dashed?, color?` |
| `text` | `x, y, text, size?, color?, anchor? ('start'|'middle'|'end'), bold?, font? ('mono')` |
| `table` | `x, y, cols[], rows[][] (strings or null), colW[] (px per column), rowH? (28), title?, hl? [row indexes to highlight yellow], dim? [row indexes greyed], fill?` |
| `mark` | `x, y, ok (true=✓ green, false=✗ red)` |
| `brace` | `x, y, w, label?` (curly brace under something) |

Fills: `'blue' 'green' 'yellow' 'pink' 'orange' 'purple' 'teal' 'grey' 'red' 'white'` or any hex. Colors for strokes: hex.
Draw **mechanisms**, not decoration: data flowing between boxes, before/after tables, the steps of an algorithm, an architecture. Tables are great for showing SQL results. Keep 3–10 items for simple ideas; architecture diagrams can have more.

## 6. The practice data (already loaded in every SQL and Python playground)
A synthetic group "Kollana Tech" with 3 entities. Fiscal year **FY 2025-26 = 1 Apr 2025 … 31 Mar 2026**. All data is fake.

| table | rows | columns | deliberate quirks to teach with |
|---|---|---|---|
| `dim_entity` | 3 | entity_id, entity_code (IN01, SG01, US01), entity_name, country, currency (INR, SGD, USD) | |
| `dim_bu` | 4 | bu_id, bu_code (SALES, OPS, TECH, CORP), bu_name | |
| `dim_account` | 15 | account_id, account_code, account_name, account_type (Asset, Liability, Revenue, COGS, Opex), parent_account_id | 3-level hierarchy: 6000 Operating Expenses → 6100 People Costs → 6110 Salaries / 6120 Bonus; 4000 → 4100/4200; 5000 → 5100/5200; 6000 → 6200 Rent, 6300 Travel, 6400 Software. 1000 Bank, 2000 Payables are balance-sheet accounts. |
| `fx_rates` | 35 | currency, rate_month (1st of month), rate_to_inr | INR always 1. **SGD rate for 2026-02-01 is missing** (missing-FX exception). |
| `fact_gl` | 1227 | gl_id, journal_id (e.g. JV202504-0051), entity_id, bu_id, account_id, posting_date, currency, debit, credit, source_system (SAP, Manual, Interface) | Each journal = 2 lines: a P&L line (revenue = credit, expenses = debit) + a balancing line to 1000 Bank (revenue) or 2000 Payables (expenses). Amounts are in the entity's local currency. **3 duplicated lines** (identical except gl_id) and **1 journal with debit inflated by 500** → exactly **4 unbalanced journals** (sum(debit) ≠ sum(credit)). |
| `fact_budget` | 612 | entity_id, bu_id, account_id, budget_month, budget_amount | Local currency, P&L accounts only, positive numbers. |
| `employees` | 20 | emp_id, emp_name, manager_id, department, city, hire_date, annual_ctc, bank_account, ifsc, pan | emp 1 is the top boss (manager_id NULL), emps 2–5 report to 1, others report to 2–5 (self-join / recursive CTE). **IFSC invalid for emp 7 ('HDFC123456') and emp 14 (lowercase)**; **emp 12 shares bank_account with emp 4**; **PAN NULL for emps 9 and 18**. |
| `payroll` | 40 | run_month (2026-08-01, 2026-09-01), emp_id, gross_pay, net_pay | **emp 6 gross jumps ×2.4 in September** (salary outlier). |
| `purchase_register` | 30 | pr_id, invoice_no (e.g. INV/0042/25-26), supplier_gstin, supplier_name, invoice_date, taxable_value, gst_amount | Our books. |
| `supplier_invoices` | 29 | si_id, invoice_no, supplier_gstin, invoice_date, taxable_value, gst_amount | GSTR-2B style. Relative to purchase_register (si_id = pr_id for shared ones): some missing on supplier side (pr_id multiple of 9), GST amount mismatches (multiples of 7), invoice-no typo '/'→'-' (multiples of 11), wrong GSTIN last char (multiples of 13), ₹0.40 rounding differences (multiples of 5), plus **2 invoices only on supplier side** (si_id 31, 32). Always check actual results by running queries — do not trust this summary blindly. |
| `products` | 8 | product_id, sku, product_name, category (Hardware, Accessories, Software, Services), unit_price | |
| `customers` | 12 | customer_id, customer_name, city, segment (Enterprise, SMB, Mid-market), signup_date | **Customers 11 and 12 never ordered** (anti-join). |
| `orders` | 220 | order_id, order_date (FY 2025-26), customer_id, product_id, qty, channel (Online, Partner, Direct), amount, status (Delivered, Shipped, Returned, NULL) | **order 77 has customer_id 99** (orphan — no such customer). Every 23rd order has status NULL. |

PostgreSQL in the browser is PGlite (real PostgreSQL 18 compiled to WASM): MERGE, FILTER, GROUPING SETS, generate_series, regex, window functions, recursive CTEs, EXPLAIN, CREATE INDEX, materialized views, transactions all work. Each playground gets its **own fresh copy** of this data, so DDL/DML lessons are safe. Extensions are not available.

**Python playground (Pyodide)** working directory contains every table above as CSV: `dim_entity.csv, dim_bu.csv, dim_account.csv, fx_rates.csv, fact_gl.csv, fact_budget.csv, employees.csv, payroll.csv, purchase_register.csv, supplier_invoices.csv, products.csv, customers.csv, orders.csv`, plus a folder `input/` with `sales_2026-08.csv`, `sales_2026-09.csv` (order rows, same columns as orders) and `notes.txt`. Files can be written (in-memory). Available packages: **standard library (no network, avoid sqlite3), pandas 2.3, numpy, pydantic v2, pyyaml, python-dateutil, jsonschema**. NOT available in the browser: requests, httpx calls, fastapi, openpyxl, pytest, sqlalchemy, faker, dotenv, typer, langgraph, openai, qdrant, dlt, dagster, azure… → show those as fenced ```python code blocks and a `local` callout instead (the validator rejects them in runnable blocks). `print()` output and the value of the last expression are shown. Keep runtimes under a few seconds.

## 7. Interactive widgets available (`{ widget: 'Name' }`)
| Widget | What it does | Use in |
|---|---|---|
| `JoinVisualizer` | customers/orders mini tables, buttons for INNER/LEFT/RIGHT/FULL/ANTI/SEMI, Venn + result rows, shows fan-out | joins |
| `WindowViz` | click a row to see PARTITION + frame for running SUM, 3-month moving AVG, LAG, ROW_NUMBER | window functions |
| `RegexTester` (props `{ preset: 'GSTIN'|'IFSC'|'PAN'|'Invoice no'|'Email' }`) | live regex tester with Indian ID presets + SQL/Python snippets | regex, validation rules |
| `FuzzyMatch` | Levenshtein similarity, normalisation, threshold + amount tolerance on invoice pairs | reconciliation, fuzzy matching |
| `IsolationLevels` (no props) | mini-MVCC engine: pick a scenario (dirty read, non-repeatable read, phantom, lost update, atomic update, deadlock, write skew) and an isolation level (Read Uncommitted / Read Committed / Repeatable Read / Serializable), step two sessions through it and see what each reads, the locks, and the verdict | transactions, isolation levels, locks and deadlocks |
| `ExplainViz` (no props) | builds a REAL table of 1,00,000 journal lines (`gl_big`) in the in-browser PostgreSQL and runs `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on it. Pick a scenario (one journal, one month as a range or as `EXTRACT(MONTH ...)`, total per account, join of one journal, five biggest lines), switch real levers (indexes on journal_id / posting_date / amount, "ANALYZE has run"), and read the plan as a tree of clickable nodes: expected vs actual rows (flagged when 3x or 10x off, never under a LIMIT), pages touched, plan cost, plain-English help per node type | query plans, indexes, statistics, sargable filters, join methods |
| `ScdViz` (no props) | slowly changing dimensions on employee 6 (Ananya Rao, Sales to Finance): pick a scenario (one move, two moves, a change that arrives late), a design (Type 1 overwrite, Type 2 add a row, Type 3 add a column) and a loader (naive = arrival order, careful = effective dates), apply the changes one by one and see the dimension table, the SQL the loader ran, the payroll lines with the department each design gives them, the department x month report compared with the real timeline, and the Type 2 structure check (gaps, overlaps, exactly one open row) | SCD, effective dating, late-arriving data, dimensional modelling |
| `FlowSimulator` | Power Automate flow (SharePoint trigger → Function → condition → Teams approval → email/move) with Try/Catch scopes, run-after, toggles for failure & approval | Power Automate lessons, error handling |
| `CronHelper` | cron expression → next 5 run times, presets | scheduling |
| `GitGraph` | commit / branch / switch / merge with live graph and git command log | Git |
| `ApiPlayground` | mock FastAPI "Payroll Bank Mandate Validation API": /health, POST /token (users uploader/uploader, reviewer/reviewer, admin/admin), POST /payroll-files (202, Idempotency-Key), GET /jobs/{id} (queued→running→completed), GET /jobs/{id}/exceptions?page&size&rule (pagination), POST /exceptions/{id}/resolve (roles), 401/403/404/422/429 | HTTP, REST, FastAPI, auth, pagination, idempotency, rate limits |
| `JwtDecoder` | decodes a real HS256 JWT, tamper button shows signature failure, expired token | JWT / auth |
| `DockerCache` | Dockerfile layer cache simulator, good vs bad instruction order | Docker |
| `MedallionStepper` | 5 messy rows through source → bronze → silver → gold | medallion, dlt, dbt |
| `TokenCost` | rough tokenizer view, monthly cost calculator, temperature → next-token probabilities | LLM basics |
| `RagSearch` | synthetic accounting SOP corpus; chunk size/overlap sliders; query → top-k chunks with similarity scores (TF-IDF cosine), answer with citations or "I don't know" below a threshold | embeddings, chunking, retrieval, RAG |
| `ToolCallDemo` | pick a question; step through system → user → assistant tool_call JSON → tool result → final answer for a finance agent with tools run_readonly_sql / get_variance / explain_kpi | tool calling, agents |
| `AgentGraph` | LangGraph-style graph for the AI Data Ops Agent (validate → diagnose → lookup → propose → risk → auto_fix | human_approval → rerun → notify); choose a broken-file scenario and step through with live state JSON | LangGraph, agents, human-in-the-loop |
| `GuardrailTester` | type a user message / SQL; see checks: prompt-injection patterns, PII detection & masking (PAN, IFSC, account no., email, phone), SQL guard (only SELECT, allowed tables, LIMIT added), topic scope | guardrails, security |
| `EvalRunner` | 12-invoice extraction eval set; switch prompt v1/v2/v3 and model small/large; per-field accuracy table, latency, cost, regressions highlighted | evals |

## 8. Project schema (one per phase, in the file that owns it)
```js
project: {
  id: 'proj-a', title: 'Finance Reporting Automation Engine', tagline: 'one line',
  problem: 'markdown: the business problem in his words, why it matters, before/after',
  architecture: { w: 760, h: 380, caption, items: [...] },   // sketch spec
  stack: ['Python 3.12', 'PostgreSQL', ...],
  folder: 'markdown with a ```text folder tree```',
  steps: [ { title: 'Step 1: Generate synthetic data', why: 'markdown', blocks: [ ...blocks, mostly code + local callouts... ], checklist: ['…the roadmap checklist items for this step…'] } ],   // follow the Notion roadmap steps exactly, add detail
  resume: 'the resume line',
  dod: ['definition of done items'],
  video: ['walkthrough video script bullets'],
}
```
Projects are built on his laptop, so steps must contain **real, complete, working code** (full files where reasonable, not fragments), exact commands, expected outputs, and common errors. This is where "no other resource" matters most.

## 9. Gate schema
```js
gate: {
  id: 'gate-a', letter: 'A', target: '13–18 LPA',   // gates open when the closing phase is finished; no weeks (see src/content/meta.js)
  titles: ['Reporting Automation Engineer', …],
  checklist: ['…roadmap gate items + practical ones…'],
  blocks: [ markdown: what these roles want, keywords for the resume, resume headline, how to phrase his experience without client names, 3 sample bullet points, how to search (LinkedIn/Naukri/Wellfound/Instahyre filters for remote), a short cover note template, what interviews at this level ask ],
}
```

## 10. Roadmap source — cover every item
The curriculum is `docs/roadmap-v2/` (V2). `docs/ROADMAP.md` is the original Notion/PDF checklist: every item in it is still taught somewhere in V2. In each lesson's `roadmap` field list the checklist items it covers (verbatim-ish, from ROADMAP.md where one exists, otherwise from the V2 "covers" text). Project and gate ids: `proj-a`…`proj-g`, `gate-a`…`gate-g` (letters A–G; the PDF's "C+" is now D). The projects and gates are listed in `docs/roadmap-v2/00-index.md`.

## 11. V2 depth rules (read these before writing any lesson)
1. **Concept first.** The first lesson(s) of a phase explain *why the tool exists, the mental model, the vocabulary, and how it fails* before any command. The last module is "production and interview": security, cost, performance, monitoring, failure modes.
2. **Interview built in.** Each phase's roadmap file lists the interview questions it must prepare for. Put a model answer in an `interview` callout somewhere in the phase, and add each as a Q&A to `src/content/interview.js` (ids `iv-<phase>-NN`, `topic` = phase id) when your task owns it.
3. **A lab closes every phase.** Last lesson = a small end-to-end build on Kollana Tech data with expected output and common errors. The phase that closes a stage also gets the stage **project** (complete working code, exact commands) and the **gate**.
4. **Tool-heavy phases** (Azure, Entra, Power Platform, FastAPI, Docker, Airbyte, dbt, Airflow, Dagster, Spark, Databricks, Snowflake, Kafka, LangGraph, MCP…): cannot run in the browser. Teach with sketches, full annotated code in fenced blocks, a `local` callout with Windows commands and **the output to expect**, a "common errors and fixes" list, the relevant widget, and a Python playground that simulates the *logic* where possible. Python playgrounds may only import what the browser has (see §6).
5. **Accounts and cost.** Any lesson that needs a cloud account, trial or paid API first says what is free, sets a budget/limit, and ends with a clean-up step. Never state prices, quotas, model names or free-tier terms as facts: write "check the current page".
6. **Version drift.** For fast-moving tools (Airflow, dbt, Databricks, Snowflake, LangGraph, MCP, Azure, Power Platform) say which major version the lesson was written against and add a "if your screen looks different" note. Don't invent UI labels you are unsure of: describe by purpose.
7. **Windows first.** Steps are for Windows 11 (PowerShell, WSL2, Docker Desktop). Mention Mac/Linux differences only in one line.
8. **Planned simulators** (docs/roadmap-v2/00-index.md "New simulators"): don't reference a widget that does not exist yet; the validator rejects unknown widget names. Build the widget first (add it to `src/widgets/index.js` and to `WIDGETS` in `scripts/validate-content.mjs`).
