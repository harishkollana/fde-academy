# Stage 7 · Orchestration (ADF, Airflow, Dagster — three separate phases)

Prerequisites: `dlt`, `dbt`, `docker`, and `azure` for ADF. Closes with **Project D + Gate D**. Line format: `- [✅] \`lesson-id\` Title — covers`.

**Concept-first, shared by all three** (taught in `foundations` and recapped in each Concepts lesson): why cron breaks (no dependencies, no retries, no visibility), DAGs, idempotent tasks, backfills, SLAs, alerting. Each phase then shows how its tool answers those problems.

---
## Phase 22 · `adf` — Azure Data Factory · ◆ plus · 9 lessons

**Why companies need it.** Very common in Azure data-engineering job posts (copy, orchestrate, trigger). Interviews ask integration runtimes, triggers and parameterisation.
**Setup.** Azure free account (budget alert first), a Data Factory in your resource group, tear down after each lab.

- `adf-concepts` ADF concepts — factory, pipelines, activities, datasets, linked services, integration runtimes, the control/data plane
- `adf-copy-activity` Copy activity — sources and sinks, mapping, performance concepts, Blob/ADLS ↔ Postgres/SQL
- `adf-data-flows` Mapping data flows — transformations, debug clusters, when to use data flows vs SQL/dbt/Databricks
- `adf-triggers-parameters` Triggers and parameters — schedule, tumbling window, event triggers; parameters, variables, expressions
- `adf-control-flow` Control flow — If, ForEach, Until, Lookup, Web, error paths and retries
- `adf-security-networking` Security and networking — managed identity, Key Vault, private endpoints, self-hosted integration runtime
- `adf-cicd-monitoring` CI/CD and monitoring — Git integration, ARM/Bicep deployment, alerts, run history
- `adf-vs-others` ADF vs Airflow vs Databricks Workflows vs Fabric pipelines — choosing
- `adf-lab` Lab: parameterised copy pipeline with an event trigger and an alert

**Interview questions:** What is an integration runtime? · Linked service vs dataset · How do you parameterise one pipeline for 50 tables? · Tumbling window vs schedule trigger · How do you do CI/CD for ADF?

---
## Phase 23 · `airflow` — Apache Airflow · ★ core · 9 lessons

**Why companies need it.** The most-requested orchestrator in data-engineering job posts. Interviews ask the architecture, scheduling semantics and idempotency.
**Setup.** Airflow in Docker Compose (needs several GB RAM; the lesson says how much). Check the current major version's docs for any changed names.

- `airflow-concepts-architecture` Airflow concepts and architecture — scheduler, executor, workers, metadata DB, web server; DAG, task, operator, XCom
- `airflow-install-docker` Install with Docker Compose — first DAG, the UI, logs, common errors
- `airflow-dags-taskflow` Writing DAGs — the TaskFlow API, dependencies, params, templating
- `airflow-scheduling-backfills` Scheduling semantics — data intervals, logical date, catchup, backfills, timetables, asset-based scheduling
- `airflow-operators-sensors` Operators, providers and sensors — Postgres/HTTP/Azure providers, sensors, deferrable operators
- `airflow-reliability` Reliability — retries, timeouts, SLAs, alerting, pools, trigger rules, idempotent tasks
- `airflow-testing-ci` Testing and CI — DAG integrity tests, unit tests, linting, deploying DAGs
- `airflow-dbt-dlt` Airflow with dbt and dlt — running dbt and dlt, Cosmos concept; lab: the Sales & Inventory pipeline
- `airflow-production-ops` Production — executors (Celery, Kubernetes), secrets backends, monitoring, upgrades, scaling

**Interview questions:** Explain scheduler / executor / worker · What is the logical date and why is it confusing? · catchup and backfill · How do you make a task idempotent? · XCom limits · How do you scale Airflow? · Airflow vs Dagster.

---
## Phase 24 · `dagster` — Dagster · ◆ plus · 8 lessons

**Why companies need it.** Asset-centric orchestration, strong with dbt and dlt, popular with newer data teams. Interviews ask software-defined assets and how they differ from task-based DAGs.
**Concept-first.** Assets (the thing you want to exist) vs tasks (the steps to get there).

- `dagster-concepts` Dagster concepts — software-defined assets, the asset graph, ops/jobs, resources
- `dagster-install-project` Install and project layout — `dagster dev`, code locations, the UI
- `dagster-assets-resources` Assets, resources and IO — dependencies, configurable resources, metadata
- `dagster-partitions-backfills` Partitions and backfills — time partitions, backfills, freshness
- `dagster-schedules-sensors` Schedules and sensors — cron schedules, a file-arrival sensor, run requests
- `dagster-dbt-dlt` dbt and dlt in Dagster — dbt assets, dlt assets, lineage across tools
- `dagster-checks-observability` Asset checks and observability — checks, alerts, run failure sensors, email/Teams webhook
- `dagster-deploy-vs-airflow` Deploying Dagster and choosing — Docker, Dagster+ concept, Dagster vs Airflow vs ADF

### Project D · Sales & Inventory Analytics Warehouse (`proj-d`) + Gate D
Follows PDF Project 3, steps 1–5: synthetic ERP exports as daily CSV drops + a REST source (FastAPI mock) → dlt (or Airbyte) incremental loads into Postgres bronze, handling a schema change → dbt silver (typed, deduplicated) and gold (price-volume-mix, slow-moving inventory ageing, promotion uplift, SKU/channel performance) with tests and docs → Dagster assets for dlt and dbt, daily schedule, file sensor, failure alert (an Airflow version of the same pipeline is a stretch goal) → dashboard on gold views (a React app reusing what you built in `react-dashboards` and `azure-e2e`, or Power BI), docker compose for the stack, README with dbt lineage graph, video.
**Interview questions:** How would you orchestrate dlt + dbt? · Assets vs tasks · How do you backfill one month? · How do you alert on failure? · Where do tests run?
