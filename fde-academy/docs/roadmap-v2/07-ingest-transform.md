# Stage 6 · Ingestion and transformation (one tool per phase)

Prerequisites: `sql`, `python`, `modelling` (medallion), `docker`. Everything here runs on the laptop in Docker with a local PostgreSQL; no cloud account needed. The first lesson of the stage (`dlt-stack-overview`) draws the whole picture; each tool is then taught alone. Line format: `- [✅] \`lesson-id\` Title — covers`.

**Shared workspace.** A separate PostgreSQL 16 in Docker on port 5433 (so it does not clash with the native PostgreSQL on 5432). Bronze / silver / gold schemas. Setup snippets live in `src/content/phases/dlt/shared.js` (`BRONZE_SETUP`).

---
## Phase 19 · `dlt` — dlt (data load tool) · ◆ plus · 8 lessons

**Why companies need it.** A Python-native way to build reliable extract-and-load pipelines without a platform. Interviews ask incremental loading, schema evolution and idempotency (these apply to every ingestion tool).
**Concept-first.** EL vs ETL, extract/normalize/load, state, schema inference.

- ✅ `dlt-stack-overview` The modern data stack in one picture — ingestion → transformation → orchestration → serving, ELT, bronze/silver/gold, and the Phase workspace setup *(previously `p3-mds-overview`)*
- `dlt-concepts` dlt concepts and first pipeline — pipeline, source, resource, destination; install; load a CSV into Postgres
- `dlt-resources-sources` Sources and resources — generators, `@dlt.resource`/`@dlt.source`, the REST API source, pagination, auth
- `dlt-incremental-loading` Incremental loading — cursor fields, state, write dispositions (append, replace, merge), primary keys, idempotent re-runs
- `dlt-schema-contracts` Schema evolution and contracts — inferred schema, new columns, variant columns, nested data to child tables, freeze/evolve contracts
- `dlt-destinations` Destinations — Postgres, DuckDB, filesystem/Parquet, warehouse pointers; staging
- `dlt-testing-observability` Testing and observability — load info, tracing, retries, failing loudly, alerts
- `dlt-lab` Lab: files and a REST API into bronze — daily CSV drops + a FastAPI mock, with a schema change

**Interview questions:** ETL vs ELT · How do you load incrementally and idempotently? · What happens when the source adds a column? · append vs replace vs merge · How do you handle a late-arriving record?

---
## Phase 20 · `airbyte` — Airbyte · ○ breadth · 7 lessons

**Why companies need it.** Many teams buy/host connectors instead of coding them. You need to explain build vs buy and CDC.
**Concept-first.** Source → connection → destination; sync modes; state.
**Setup.** `abctl` on Docker (needs RAM; the lesson says how much) or Airbyte Cloud trial ("check the current terms").

- `airbyte-concepts` Airbyte concepts — connectors, sources, destinations, connections, sync modes (full refresh, incremental append, incremental dedupe), normalisation
- `airbyte-install` Install and first sync — `abctl` / Docker, UI tour, resources, common errors
- `airbyte-connectors-config` Configuring connectors — Postgres source, file source, REST via the Connector Builder, destinations
- `airbyte-schemas-state-scheduling` Schemas, state and scheduling — schema change handling, resets, state, schedules, notifications
- `airbyte-cdc-debezium` CDC explained — WAL and logical replication, log-based CDC vs polling, deletes, ordering
- `airbyte-build-vs-buy` Airbyte vs dlt vs Fivetran-style tools — when to build, when to buy, cost and control
- `airbyte-api-lab` Lab: sync Postgres → bronze and trigger it from the API — API/Terraform provider concept, hand-off to the orchestrators

**Interview questions:** What is CDC and why use it? · Full refresh vs incremental · How does Airbyte know what changed? · When would you not use Airbyte?

---
## Phase 21 · `dbt` — dbt · ★ core · 11 lessons

**Why companies need it.** The standard for SQL transformation, testing and documentation; "analytics engineer" roles are built on it.
**Concept-first.** ELT, models as SELECT statements, the DAG, tests as contracts.
**Setup.** dbt Core with dbt-postgres in a venv (dbt platform / Fusion naming changes: "check the current docs").

- `dbt-concepts-install` dbt concepts and setup — what dbt does and does not do, project layout, `profiles.yml`, `dbt run`
- `dbt-models-materializations` Models and materializations — view, table, incremental, ephemeral; choosing
- `dbt-ref-sources-lineage` ref(), sources and lineage — dependencies, source freshness, the DAG
- `dbt-jinja-macros` Jinja and macros — templating, control flow, writing macros
- `dbt-tests` Tests — generic and singular tests, not_null/unique/relationships/accepted_values, packages
- `dbt-incremental-snapshots` Incremental models and snapshots — strategies, merge keys, SCD2 snapshots
- `dbt-docs-contracts` Docs, contracts and exposures — docs site, lineage graph, model contracts, versions, exposures
- `dbt-seeds-packages` Seeds and packages — seeds, dbt_utils, expectations-style tests
- `dbt-project-structure` Project structure — staging / intermediate / marts, naming, style guide, semantic layer concept
- `dbt-ci-state` CI with dbt — `dbt build`, state-based slim CI, environments
- `dbt-lab` Lab: silver and gold for Sales & Inventory — typed staging, price-volume-mix, slow-moving inventory ageing, promotion uplift

**Interview questions:** What are the dbt materializations? · How do incremental models work and what can go wrong? · How do you test data? · ref() vs source() · How would you structure a dbt project? · snapshot vs incremental.
