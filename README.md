# FDE Academy

**A dedicated roadmap for experienced data analysts to become Forward Deployed Engineers.**

## What this roadmap is

A roadmap is an ordered path from where you are to where you want to be: what to learn, in which order, and what to build to prove it. This one starts with an experienced data analyst (SQL, Excel, reports, a finance or operations domain) and ends with the skills and portfolio for **Forward Deployed Engineer, AI Automation Engineer and Data Engineer** roles.

A **Forward Deployed Engineer (FDE)** works directly with a customer: understands their messy real-world process and data, then builds and ships the working solution (data pipelines, APIs, automations, AI agents) in the customer's own environment. It is a technical job and a customer-facing job at once, which is why an analyst who already knows the business side is well placed to move into it.

The roadmap is built around three ideas:

1. **Learn one thing at a time.** 41 phases in 12 stages, each on a single tool or topic. Every phase opens with why the tool exists and how it fails, and only then teaches the tool.
2. **Prove it with a project.** Seven portfolio projects close the stages, each built on the same synthetic company data, so you finish with working, publishable work rather than certificates.
3. **Apply as you go.** Each project also opens an **apply gate**: a list of job titles you can already go for. You do not have to finish everything before applying.

There are no deadlines, no weekly targets and no time estimates. You go at your own pace; the only ordering is the order of the phases.

## The journey

| Stage | Phases | Ends with |
|---|---|---|
| 0 · Concepts first | How data products, the network, auth and storage work | |
| 1 · Core craft | SQL (PostgreSQL), Python, pandas, Git and GitHub, data modelling | **Project A** |
| 2 · Microsoft Power Platform | Power Automate, Power BI, Copilot Studio | |
| 3 · APIs and web apps | HTTP and REST, FastAPI, React for data apps | |
| 4 · Microsoft Azure | Azure fundamentals, Entra ID and security, Azure Functions | **Project B** |
| 5 · Ship it | Docker, GitHub Actions, deploying to Azure, an end-to-end Azure data product | **Project C** |
| 6 · Ingestion and transformation | dlt, Airbyte, dbt | |
| 7 · Orchestration | Azure Data Factory, Airflow, Dagster | **Project D** |
| 8 · Big-data platforms | Spark, Databricks, Snowflake, Kafka | **Project E** |
| 9 · AI engineering | LLM basics, LLM APIs, vector databases, RAG, evals, guardrails | **Project F** |
| 10 · Agents and production | LangGraph, MCP, observability | **Project G** |
| 11 · Career | System design, the FDE craft, interview bootcamp | |

An optional track (Kubernetes, Terraform, Bicep, Fabric, DuckDB, Redis) is there for when a job asks for it. The lesson-by-lesson plan is in [fde-academy/docs/roadmap-v2/00-index.md](fde-academy/docs/roadmap-v2/00-index.md).

## The seven projects and apply gates

| Project | What you build | Apply gate: titles you can go for |
|---|---|---|
| **A** · Finance Reporting Automation Engine | A pipeline that validates multi-entity general-ledger files, restates currencies and produces P&L and budget-variance Excel packs with exception reports (SQL, Python, pandas, Git, star schema) | Reporting Automation Engineer, BI Automation Engineer, Python Automation Engineer, Analytics Engineer |
| **B** · GST Reconciliation in the Cloud | Purchase register vs supplier-reported data, matched with fuzzy logic and approved in Teams (Power Automate, SharePoint, an Azure Function, Power BI) | Intelligent Automation Engineer, Power Platform Developer, Process Automation Engineer |
| **C** · Payroll Bank Mandate Validation: API and Web App | A deployed API and React app that catch bad bank details before salaries go out (FastAPI, PostgreSQL, Docker, GitHub Actions, Azure, Entra sign-in) | Python Automation Engineer, Integration Engineer, Backend Engineer (data), Solutions Engineer (data) |
| **D** · Sales & Inventory Analytics Warehouse | A medallion-style warehouse with incremental loads, tested models and scheduled runs (dlt or Airbyte, dbt, Dagster, PostgreSQL, dashboard) | Analytics Engineer, Data Engineer, Data Platform Engineer |
| **E** · Order Events Lakehouse | Streaming and batch order data landing in a lakehouse through to gold tables (Kafka, Spark, Databricks or Snowflake) | Data Engineer (Spark / Databricks), Azure Data Engineer, Snowflake Data Engineer, Streaming Data Engineer |
| **F** · Invoice-to-Ledger AI + Ask-Your-Finance-Data | LLM invoice extraction with human review, a tool-calling finance Q&A agent and RAG over policies, all measured with evals | AI Automation Engineer, Applied AI Engineer, GenAI Engineer, AI Integration Engineer |
| **G** · AI Data Operations Agent (flagship) | An agent that diagnoses broken client files, auto-fixes low-risk problems and escalates the rest for approval, tested on 40 failure scenarios (LangGraph, MCP, FastAPI, Azure) | Forward Deployed Engineer, AI Deployment Engineer, AI Solutions Engineer, Customer Engineer (AI) |

## Principles

- **Concepts before tools.** Networking, auth, storage and failure modes come first, so every later tool has somewhere to attach.
- **Same story throughout.** One synthetic company, Kollana Tech (general ledger, budget, FX, GST, payroll, orders), runs through every phase, with Indian finance examples: ₹, GST, GSTIN, IFSC, PAN and the April–March financial year.
- **Synthetic data only.** No client data, client names or anything that breaks a company policy. Portfolio projects are safe to publish.
- **Deterministic first, AI second.** Rules and validation handle what they can; models and agents handle only what is left, with guardrails and human approval for risky actions.
- **Interview built in.** Every phase prepares the questions an interviewer is likely to ask, and has a lesson on how it fails in production.
- **Honest about cost.** Free tiers, budgets and tear-down steps come before any paid resource. Prices, quotas and tool versions are never stated as fixed facts: lessons say "check the current page".

## Deliberately left out

UiPath and Power Automate Desktop, MLOps theory, deep dives into AWS and GCP, and agent frameworks such as CrewAI, AutoGen and LlamaIndex. Everything else is taught or offered in the optional track.

## The course

The roadmap is delivered as an interactive course in [fde-academy/](fde-academy/): hand-drawn lessons, real SQL and Python in the browser, quizzes and auto-graded challenges.

> **Work in progress.** 97 of 403 planned lessons are written (as of 7 Oct 2026). Foundations, SQL, Python and pandas are complete; Git is next.

```powershell
cd fde-academy
npm install
npm run dev          # http://localhost:5173
```

You need [Node.js](https://nodejs.org/) (a current LTS release). Progress is saved in your browser only.

## License

Apache License 2.0. See [LICENSE](LICENSE).
