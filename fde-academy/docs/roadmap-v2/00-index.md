# FDE Academy — Roadmap V2 (deep dive, one tool per phase)

Written 4 Oct 2026 at Harish's request. **This replaces the 6-phase plan** in `docs/ROADMAP.md` (which stays as the record of the original Notion/PDF plan). Where V2 and `ROADMAP.md` differ, V2 wins. Everything in the original plan is still taught: V2 only splits it into smaller single-topic phases and adds the depth a real data-engineer / FDE job and its interviews expect.

**There is no schedule.** No weeks, no hours per day, no deadlines, no time estimates on lessons: Harish goes at his own pace. The only ordering is the order of the phases. (The original PDF's study-time rules and week numbers are historical and are ignored.)

## What Harish asked for
1. SQL becomes **Phase 1** and Python becomes **Phase 2**, each taught in real depth.
2. Start with **concepts** (how a data product, the network, auth, load balancing, storage actually work) before tools.
3. **One tool per phase.** Power Platform and Azure are separate. dlt, Airbyte, dbt, Airflow, Dagster each get their own phase. No phase mixes tools.
4. Job-ready: every concept a company uses in production and an interviewer can ask about.
5. No pacing: remove lengths, weeks and timings.
6. *(Added 5 Oct 2026.)* One **end-to-end Azure data product with a React app as the end product**, with exact setup for every service and how each connects to the next: app registrations, a virtual machine, storage, a database, an API and the React front end. The API phases (`http-rest`, `fastapi`) come **before** Azure, so the Azure stage can secure and host what you have already built.

### Revision of 5 Oct 2026 (what changed and why)
- **New Stage 3 · APIs and web apps** before Azure: `http-rest` and `fastapi` moved here (Azure's `entra-protect-your-api` and the Functions lessons need them), plus a new phase **`react-dashboards`** (JavaScript and React from zero, built around data screens).
- **`azure` +3 lessons:** `azure-postgres-lab` and `azure-sql-lab` (create a database, open the firewall for yourself, connect, load data) and `azure-vm-lab` (a Linux VM end to end). **`entra` +1:** `entra-register-api-and-spa`.
- **New phase `azure-e2e`** (13 lessons) after `azure-deploy`: Blob → PostgreSQL → FastAPI on Container Apps → Entra sign-in → React app, with a connection map, a VM variant, one pipeline per tier and a failure table by arrow. **Project C and Gate C now close `azure-e2e`** instead of `azure-deploy`, and Project C gains the Blob landing and the React web app (you may still apply earlier than the gate opens).
- Stage 5 `backend` is retitled "Ship it" and keeps `docker`, `github-actions`, `azure-deploy`. Phase numbers from `http-rest` onwards and stage numbers from Stage 3 onwards changed (the app numbers them by order, so only ids matter); stage files `04`–`11` were renamed `05`–`12` to make room for `04-apis-web.md`. Totals: 39 → 41 phases, 11 → 12 stages, 376 → 403 lessons.

## Principles for every phase
- **Concept first.** Each phase opens with *why this exists, the mental model, the vocabulary and how it fails*, and only then the tool.
- **Same dataset, same story.** Kollana Tech (GL, budget, FX, GST, payroll, orders) is used everywhere, so ideas connect across phases.
- **Lab per phase, project per stage.** Every phase ends with a lab. Seven portfolio projects close the stages (A–G). Each project is also an apply gate.
- **Interview built in.** Every phase lists the interview questions it must prepare you for (feeds `interview.js`) and has a "failure modes" lesson.
- **Honest about cost and accounts.** Free tiers, trial accounts, budgets and alerts are taught *before* any paid resource. Prices and model names are never stated as facts: "check the current page".
- **Windows first.** Exact steps for Windows 11 (PowerShell, WSL2, Docker Desktop). Browser-runnable parts (SQL, Python logic) run in the app; tool-heavy parts are laptop labs with expected output and common errors.

## The journey: 12 stages, 41 phases (+ 6 optional)
Priority tag: **★ core** = most job posts ask for it · **◆ plus** = common, a clear differentiator · **○ breadth** = know it well enough to talk about it, deepen when a job asks. Do the ★ phases first; skip ○ phases until a job asks.

| # | Phase id | Phase | Pri | Lessons | Closes with |
|---|---|---|---|---|---|
| **Stage 0 · Concepts first** | | | | | |
| 0 | `foundations` | How data products and the internet work | ★ | 22 | Design doc |
| **Stage 1 · Core craft** | | | | | |
| 1 | `sql` | SQL (PostgreSQL) | ★ | 38 | |
| 2 | `python` | Python | ★ | 26 | |
| 3 | `pandas` | pandas and data files | ★ | 10 | |
| 4 | `git` | Git and GitHub | ★ | 9 | |
| 5 | `modelling` | Data modelling and warehousing | ★ | 11 | **Project A + Gate A** |
| **Stage 2 · Microsoft Power Platform** | | | | | |
| 6 | `power-automate` | Power Automate | ◆ | 11 | |
| 7 | `power-bi` | Power BI | ◆ | 10 | |
| 8 | `copilot-studio` | Copilot Studio | ○ | 6 | |
| **Stage 3 · APIs and web apps** | | | | | |
| 9 | `http-rest` | HTTP and REST API design | ★ | 6 | |
| 10 | `fastapi` | FastAPI | ★ | 10 | |
| 11 | `react-dashboards` | React for data apps | ◆ | 10 | |
| **Stage 4 · Microsoft Azure** | | | | | |
| 12 | `azure` | Azure fundamentals (account, storage, databases, VMs, network, load balancing) | ★ | 14 | |
| 13 | `entra` | Microsoft Entra ID and Azure security | ★ | 12 | |
| 14 | `azure-functions` | Azure Functions | ◆ | 7 | **Project B + Gate B** |
| **Stage 5 · Ship it: containers, CI/CD, Azure deploy** | | | | | |
| 15 | `docker` | Docker | ★ | 8 | |
| 16 | `github-actions` | GitHub Actions (CI/CD) | ★ | 6 | |
| 17 | `azure-deploy` | Deploying to Azure (Container Apps) | ◆ | 8 | |
| 18 | `azure-e2e` | The end-to-end Azure data product (React app on top) | ◆ | 13 | **Project C + Gate C** |
| **Stage 6 · Ingestion and transformation** | | | | | |
| 19 | `dlt` | dlt | ◆ | 8 | |
| 20 | `airbyte` | Airbyte | ○ | 7 | |
| 21 | `dbt` | dbt | ★ | 11 | |
| **Stage 7 · Orchestration** | | | | | |
| 22 | `adf` | Azure Data Factory | ◆ | 9 | |
| 23 | `airflow` | Apache Airflow | ★ | 9 | |
| 24 | `dagster` | Dagster | ◆ | 8 | **Project D + Gate D** |
| **Stage 8 · Big-data platforms** | | | | | |
| 25 | `spark` | Apache Spark and PySpark | ★ | 10 | |
| 26 | `databricks` | Databricks and Delta Lake | ★ | 9 | |
| 27 | `snowflake` | Snowflake | ★ | 9 | |
| 28 | `kafka` | Kafka and streaming | ◆ | 7 | **Project E + Gate E** |
| **Stage 9 · AI engineering** | | | | | |
| 29 | `llm-basics` | LLM fundamentals and prompting | ★ | 6 | |
| 30 | `llm-apis` | LLM APIs, structured outputs, tool calling | ★ | 7 | |
| 31 | `vector-db` | Embeddings and vector databases (Qdrant) | ★ | 7 | |
| 32 | `rag` | Retrieval-augmented generation | ★ | 8 | |
| 33 | `evals` | Evals | ★ | 5 | |
| 34 | `guardrails` | Guardrails and AI security | ★ | 6 | **Project F + Gate F** |
| **Stage 10 · Agents and production** | | | | | |
| 35 | `langgraph` | Agents with LangGraph | ★ | 8 | |
| 36 | `mcp` | Model Context Protocol (MCP) | ◆ | 5 | |
| 37 | `observability` | Observability and production AI | ★ | 6 | **Project G (flagship) + Gate G** |
| **Stage 11 · Career** | | | | | |
| 38 | `system-design` | System design for data and AI | ★ | 9 | |
| 39 | `fde-craft` | The Forward Deployed Engineer craft | ★ | 6 | |
| 40 | `interview-prep` | Interview bootcamp | ★ | 6 | Offer-ready |
| **Optional extended track (do when a job asks)** | | | | | |
| X1 | `kubernetes` | Kubernetes | ○ | 6 | |
| X2 | `terraform` | Terraform | ○ | 5 | |
| X3 | `bicep` | Azure Bicep | ○ | 4 | |
| X4 | `fabric` | Microsoft Fabric | ○ | 7 | |
| X5 | `duckdb` | DuckDB | ○ | 5 | |
| X6 | `redis` | Redis | ○ | 4 | |

**Totals:** 41 main phases, **403 lessons**. Optional track: 31 more lessons.

### Applying early
You do not need to finish everything to apply. **Gate A opens as soon as you finish `modelling` (Project A).** Every later gate adds better-paid titles. The app marks a gate "open" when the phase that owns it is finished, but you may apply earlier whenever you feel ready; the application tracker works from any page. Practice (SQL/Python arena, system design, mock interviews) can run alongside any phase.

## Apply gates
| Gate | Opens after phase | Titles | Target |
|---|---|---|---|
| A | `modelling` (Project A) | Reporting Automation Engineer · BI Automation Engineer · Python Automation Engineer · Analytics Engineer · Finance Data Analyst (automation) | 13–18 LPA |
| B | `azure-functions` (Project B) | Intelligent Automation Engineer · Power Platform Developer · Process Automation Engineer · Automation Consultant | 15–20 LPA |
| C | `azure-e2e` (Project C) | Python Automation Engineer · Integration Engineer · Backend Engineer (data) · Solutions Engineer (data) | 15–22 LPA |
| D | `dagster` (Project D) | Analytics Engineer · Data Engineer · Data Platform Engineer (junior/mid) | 15–22 LPA |
| E | `kafka` (Project E) | Data Engineer (Spark / Databricks) · Azure Data Engineer · Snowflake Data Engineer · Streaming Data Engineer | verify on live job posts *(new gate, not in the PDF; no salary invented)* |
| F | `guardrails` (Project F) | AI Automation Engineer · Applied AI Engineer · GenAI Engineer · AI Application Engineer · AI Integration Engineer | 18–25 LPA |
| G | `observability` (Project G) | Forward Deployed Engineer · Forward Deployed Software Engineer · AI Deployment Engineer · AI Solutions Engineer · Customer Engineer AI | 20–30+ LPA |

Gate letters: the PDF's A, B, C, C+, D, E became **A, B, C, D, F, G**; **E is new** (big-data platforms). If remote traction is weak after Gate F, add relocation roles (Hyderabad/Bengaluru), as in the PDF. Salary targets are rough planning numbers from the PDF, not guarantees.

## Projects
| Id | Project | Closes phase | Uses |
|---|---|---|---|
| `proj-a` | Finance Reporting Automation Engine | `modelling` | SQL, Python, pandas, Git, star schema, Excel MIS pack. *(The PDF's "Power BI report" step moves to the Power BI lab and Project B, because Power BI is taught after Project A.)* |
| `proj-b` | GST Reconciliation in the Cloud | `azure-functions` | Power Automate, SharePoint, Teams, Azure Function, Entra/Key Vault, Power BI |
| `proj-c` | Payroll Bank Mandate Validation: API and Web App | `azure-e2e` | FastAPI, Postgres, Docker, GitHub Actions, Container Apps, Key Vault, App Insights, Blob storage, Entra sign-in, React *(the web app and the Blob-to-database landing were added on 5 Oct 2026; the PDF project was API only)* |
| `proj-d` | Sales & Inventory Analytics Warehouse | `dagster` | dlt (or Airbyte), dbt, Dagster (Airflow variant), Postgres medallion, dashboard |
| `proj-e` | Order Events Lakehouse *(new)* | `kafka` | Kafka, Spark, Delta/Databricks (or Snowflake), streaming + batch to gold |
| `proj-f` | Invoice-to-Ledger AI + Ask-Your-Finance-Data | `guardrails` | LLM API, Pydantic, Qdrant RAG, evals, guardrails, FastAPI |
| `proj-g` | AI Data Operations Agent (flagship) | `observability` | LangGraph, MCP, FastAPI, Azure, traces, 40-scenario eval |

## Old plan → new plan
| Original (PDF) | Now |
|---|---|
| Phase 0 · SQL + Python recap | `sql`, `python`, `pandas`, `git`, `modelling` (+ `foundations` first) |
| Phase 1 · Microsoft automation layer | `power-automate`, `power-bi`, `copilot-studio`, `azure`, `entra`, `azure-functions` |
| Phase 2 · Engineering foundations | `http-rest`, `fastapi`, `react-dashboards`, `docker`, `github-actions`, `azure-deploy`, `azure-e2e` |
| Phase 3 · Modern data stack | `dlt`, `airbyte`, `dbt`, `dagster` (+ `adf`, `airflow`) |
| (skipped in PDF "Not now") | `spark`, `databricks`, `snowflake`, `kafka`; optional `kubernetes`, `terraform`, `bicep`, `fabric` |
| Phase 4 · AI engineering | `llm-basics`, `llm-apis`, `vector-db`, `rag`, `evals`, `guardrails` |
| Phase 5 · Agents and production | `langgraph`, `mcp`, `observability`, `system-design`, `fde-craft`, `interview-prep` |

## Level template (every phase follows it)
1. **Module "Concepts"** (1–4 lessons): the problem, the mental model, architecture, vocabulary, how it fails, when *not* to use it.
2. **Modules "Hands-on"**: tool setup (Windows, exact steps, expected output, common errors), then the feature set in the order a job needs it.
3. **Module "Production and interview"**: security, cost, performance, monitoring, failure modes, plus the interview Q&A for the phase.
4. **Lab** (last lesson): a small end-to-end build on Kollana Tech data. Phases that close a stage also have the stage **project**.
5. Each lesson: 800–1600 words, ≥ 1 sketch, runnable playground/challenge where the browser allows, relevant widget, 5–6 quiz questions, a laptop task, a Recap (see `docs/CONTENT_SPEC.md`). No time estimates.

## Accounts, installs and cost control (taught in the phase that needs it)
| Needed from | Thing | Note |
|---|---|---|
| `foundations` | Windows 11 + PowerShell, WSL2 (Ubuntu), VS Code | free |
| `sql` | PostgreSQL + DBeaver (local) | free |
| `python` | Python 3.12+, `uv` or `venv` | free |
| `git` | Git, GitHub account | free tier |
| `power-automate` | Microsoft 365 developer/trial tenant if available | availability changes: "check the current page" |
| `react-dashboards` | Node.js (current LTS) and npm | free |
| `azure` | Azure free account (needs a card for identity check), **budget alert first** | follow the budget lesson before creating anything; the labs create a database and a VM, so stop or delete them the same day |
| `docker` | Docker Desktop (check the current licence terms for your use) or Podman | free for personal learning, check terms |
| `airbyte`, `dagster`, `airflow`, `kafka` | run locally in Docker | needs 8–16 GB RAM free; the lessons say how much |
| `databricks`, `snowflake` | free edition / trial | terms change: "check the current page" |
| `llm-apis` onward | an LLM provider key (direct or Azure OpenAI) | pay-per-use: set a hard monthly limit; every lab uses a tiny dataset |

## New simulators this plan needs (Task W2, build before the lessons that use them)
`LoadBalancer` (algorithms + health checks) · `OAuthFlow` (auth code + PKCE, client credentials, step by step) · `IsolationLevels` (two transactions, dirty/non-repeatable/phantom reads) · `DnsResolver` · `RetryBackoff` (idempotency, backoff, DLQ) · `ScdViz` (SCD 1/2/3) · `ExplainViz` (reading a query plan) · `ShuffleViz` (Spark partitions and shuffle) · `KafkaPartitions` (consumer groups, offsets) · `DagViz` (Airflow/Dagster run states).
Existing 12 simulators and the 5 AI stubs (`RagSearch`, `ToolCallDemo`, `AgentGraph`, `GuardrailTester`, `EvalRunner`) stay.

## Stage files (read the one for your task)
`01-concepts.md` · `02-core-craft.md` · `03-power-platform.md` · `04-apis-web.md` · `05-azure.md` · `06-backend.md` · `07-ingest-transform.md` · `08-orchestration.md` · `09-big-data.md` · `10-ai.md` · `11-agents-production.md` · `12-career-and-optional.md`
