# Stage 8 · Big-data platforms (Spark, Databricks, Snowflake, Kafka — four separate phases)

The original PDF put these in "Not now". Harish asked for full data-engineer depth, so V2 teaches them. Closes with **Project E + Gate E**. Line format: `- [✅] \`lesson-id\` Title — covers`.

**Setup and cost.** Spark runs locally (Docker or Windows). Databricks and Snowflake need a free edition / trial account: terms change, so each first lesson says "check the current page" and sets a budget or usage limit. Kafka runs locally in Docker.
**Concept-first for the whole stage:** why one machine is not enough, what "distributed" costs (shuffles, skew, small files, consistency), columnar storage + table formats (from `modelling`), compute separated from storage.

---
## Phase 25 · `spark` — Apache Spark and PySpark · ★ core · 10 lessons

**Why companies need it.** The engine behind Databricks and most big-data jobs. Interviews ask partitions, shuffles, joins, skew and tuning.
**Concept-first.** Driver and executors, lazy evaluation, the DAG, narrow vs wide transformations.
**Setup.** PySpark local (Java needed; Windows quirks explained) or a Spark Docker image.

- `spark-concepts-architecture` Spark architecture — driver/executors, partitions, lazy evaluation, jobs/stages/tasks, shuffle; ShuffleViz
- `spark-local-setup` Local setup on Windows — Java, PySpark, Docker alternative, the Spark UI, common errors
- `spark-dataframe-api` DataFrame API — select/filter/withColumn/groupBy/join/window, column expressions
- `spark-sql-catalog` Spark SQL and the catalog — temp views, tables, managed vs external, the metastore
- `spark-io-partitioning` Reading and writing — Parquet/CSV/JSON, schemas, `partitionBy`, bucketing, the small-files problem
- `spark-joins-shuffle-skew` Joins, shuffles and skew — broadcast joins, sort-merge, skew handling, adaptive query execution
- `spark-performance-tuning` Performance tuning — caching, partitions, memory, serialisation, reading the Spark UI
- `spark-udfs` UDFs and pandas UDFs — when to avoid them, built-in functions first
- `spark-structured-streaming` Structured Streaming — micro-batch model, watermarks, checkpoints, output modes
- `spark-lab` Lab: Kollana GL at scale — rebuild the P&L in PySpark, compare with SQL and pandas

**Interview questions:** What is a shuffle and why is it expensive? · narrow vs wide transformations · How do you fix data skew? · Broadcast join: when? · repartition vs coalesce · How do you tune a slow job? · Spark vs pandas.

---
## Phase 26 · `databricks` — Databricks and Delta Lake · ★ core · 9 lessons

**Why companies need it.** The most common lakehouse platform in Azure/Indian data jobs; Delta Lake knowledge is assumed.
**Concept-first.** Control plane vs data plane, lakehouse = open files + a transaction log.
**Setup.** Free edition / trial ("check the current page"), or run Delta locally with PySpark.

- `databricks-concepts-workspace` Databricks concepts — workspace, clusters, serverless, control/data plane
- `databricks-setup-free` Getting an account — free options, first notebook, cost guard-rails
- `databricks-notebooks-jobs` Notebooks, jobs and workflows — parameters, tasks, schedules, repair runs
- `databricks-delta-lake` Delta Lake — transaction log, ACID, time travel, MERGE, schema enforcement/evolution, OPTIMIZE, Z-ORDER / clustering, VACUUM
- `databricks-unity-catalog` Unity Catalog — catalogs/schemas/tables, permissions, lineage, volumes
- `databricks-autoloader-pipelines` Auto Loader and declarative pipelines — incremental file ingestion, Lakeflow / DLT-style pipelines ("check the current names")
- `databricks-sql-warehouses` SQL warehouses and BI — dashboards, connecting Power BI
- `databricks-cost-performance` Cost and performance — cluster sizing, photon concept, job clusters vs all-purpose, guard-rails
- `databricks-lab` Lab: medallion pipeline on Delta — bronze → silver → gold with MERGE and time travel

**Interview questions:** What does Delta add on top of Parquet? · Time travel and VACUUM · MERGE and idempotency · Medallion in Databricks · Unity Catalog: what does it govern? · All-purpose vs job cluster.

---
## Phase 27 · `snowflake` — Snowflake · ★ core · 9 lessons

**Why companies need it.** The leading cloud warehouse in many job posts; interviews ask architecture, cost and loading.
**Concept-first.** Storage, compute (virtual warehouses) and services are separate; micro-partitions; pay per second of compute.
**Setup.** Trial account ("check the current page"); lessons set resource monitors/limits first.

- `snowflake-architecture` Architecture — storage / compute / cloud services, virtual warehouses, micro-partitions, caching layers
- `snowflake-setup-trial` Account setup — trial, roles, Snowsight, Python connector, cost limits
- `snowflake-loading` Loading data — stages, COPY INTO, file formats, Snowpipe, error handling
- `snowflake-sql-features` Snowflake SQL — VARIANT and FLATTEN, QUALIFY, time travel, zero-copy clone
- `snowflake-performance-cost` Performance and cost — pruning, clustering, warehouse sizing, auto-suspend, resource monitors
- `snowflake-security-governance` Security and governance — RBAC, masking policies, row access, data sharing
- `snowflake-streams-tasks-dynamic` Streams, tasks and dynamic tables — CDC and incremental pipelines inside Snowflake
- `snowflake-dbt-python` Snowflake with dbt and Python — dbt adapter, Snowpark concept, connector
- `snowflake-lab` Lab: load Kollana data, model it, mask PII, and keep cost near zero

**Interview questions:** Explain Snowflake's architecture · What are micro-partitions? · How do you control cost? · Time travel vs fail-safe · Streams and tasks · Snowflake vs Databricks vs Synapse/Fabric.

---
## Phase 28 · `kafka` — Kafka and streaming · ◆ plus · 7 lessons

**Why companies need it.** Event-driven and real-time pipelines; interviews ask partitions, consumer groups, delivery guarantees and CDC.
**Concept-first.** The log as the core abstraction; topics, partitions, offsets; consumer groups.
**Setup.** Kafka (KRaft mode) in Docker Compose.

- `kafka-streaming-concepts` Streaming concepts — events, topics, partitions, offsets, consumer groups, retention, ordering; KafkaPartitions simulator
- `kafka-local-docker` Run Kafka locally — Compose, CLI tools, first topic
- `kafka-python-clients` Producers and consumers in Python — serialisation, keys, acks, commits, schema registry concept
- `kafka-connect-cdc` Kafka Connect and CDC — Debezium concept, sinks, exactly-once reality
- `kafka-stream-processing` Stream processing — windows, joins, state, Flink / Spark Structured Streaming / ksqlDB overview
- `kafka-azure-event-hubs` Event Hubs and friends — Event Hubs (Kafka endpoint), Service Bus vs Event Hubs vs Event Grid
- `kafka-ops-lab` Operations and lab — lag, partition design, DLQs, schema evolution; lab: stream Kollana orders end to end

### Project E · Order Events Lakehouse (`proj-e`) + Gate E
*New (not in the PDF).* Kollana orders become events: producer → Kafka topic → Spark Structured Streaming into Delta (Databricks or local) and/or Snowflake → batch backfill with Spark → silver/gold with dbt or Spark SQL → data-quality checks and a lag/freshness dashboard → README with architecture, replay and failure-mode notes, video.
**Interview questions:** Partitions and consumer groups · At-least-once vs exactly-once · How do you guarantee ordering? · What is consumer lag? · Batch vs micro-batch vs true streaming · Lambda vs kappa architecture · Event Hubs vs Kafka.
