export default {
  id: 'foundations-architecture-patterns',
  title: 'Warehouse, lake, lakehouse, medallion and mesh',
  goal: 'You can explain the difference between a warehouse, a lake and a lakehouse, describe bronze/silver/gold, say when data mesh is and is not relevant, and justify build vs buy for a small team.',
  roadmap: ['Data warehouse vs data lake vs lakehouse', 'Medallion architecture', 'Data mesh (concept)', 'Build vs buy'],
  blocks: [
    `## The problem
Your manager says: *"We need a proper data platform. Should we buy Snowflake, build a lake on Azure, or use Databricks?"*

Three words (warehouse, lake, lakehouse) are used as if everyone agrees what they mean. They do not. If you cannot say what each one is, you will nod in the meeting and get the answer wrong. This lesson gives you the vocabulary, the layers (bronze, silver, gold), and a way to decide.

## Data warehouse
A **data warehouse** is a database built for analysis. Data goes in already **structured** (tables with columns and types) and is modelled for reading. It is queried with SQL. *Schema-on-write*: you decide the shape before you load, so bad data is rejected at the door.
- **Good at:** fast, reliable SQL; governance and access control; one version of the truth.
- **Weak at:** raw files, images, PDFs, JSON that keeps changing; cost grows with data kept and queried.
- **Examples:** Snowflake, Azure Synapse dedicated pools, Google BigQuery, Amazon Redshift.

## Data lake
A **data lake** is cheap storage (Azure Data Lake Storage, Amazon S3) holding **files in any format**: CSV, JSON, Parquet, PDFs, images. *Schema-on-read*: you decide the shape when you read, not when you save.
- **Good at:** storing everything cheaply, including data you do not yet understand; machine learning; huge volumes.
- **Weak at:** files alone have no transactions, no easy updates and no governance. Without discipline a lake turns into a **data swamp**: nobody knows what is in it or which copy is right.

## Lakehouse
A **lakehouse** keeps the lake's cheap open files but adds a **table format** on top (Delta Lake, Apache Iceberg, Apache Hudi). The table format adds a transaction log, so you get **ACID transactions, updates and deletes, time travel and schema enforcement on plain files**, and a SQL engine can query them like a warehouse.
- **Good at:** one copy of the data serving both BI and data science; open formats reduce lock-in.
- **Weak at:** more moving parts to learn; the benefits depend on how well the tables are managed.
- **Examples:** Databricks (Delta), Microsoft Fabric (OneLake), Snowflake or Trino reading Iceberg.

| | Warehouse | Lake | Lakehouse |
|---|---|---|---|
| Stores | Structured tables | Any files | Files + transaction log |
| Schema | On write | On read | Enforced, can evolve |
| Updates/deletes | Yes | Hard | Yes |
| Cost of storage | Higher | Lowest | Low |
| Best for | BI, finance reporting | Raw/unstructured, ML | Both |`,
    { sketch: { w: 760, h: 310, caption: 'Medallion layers: data gets cleaner and more trusted as it moves right', items: [
      { t: 'cloud', x: 8, y: 52, w: 112, h: 76, label: 'sources' },
      { t: 'box', x: 170, y: 44, w: 140, h: 92, label: 'BRONZE', sub: 'raw, as received', fill: 'orange' },
      { t: 'box', x: 350, y: 44, w: 140, h: 92, label: 'SILVER', sub: 'cleaned, typed', fill: 'grey' },
      { t: 'box', x: 530, y: 44, w: 140, h: 92, label: 'GOLD', sub: 'business-ready', fill: 'yellow' },
      { t: 'person', x: 722, y: 52, label: 'users' },
      { t: 'arrow', x1: 120, y1: 90, x2: 170, y2: 90 },
      { t: 'arrow', x1: 310, y1: 90, x2: 350, y2: 90 },
      { t: 'arrow', x1: 490, y1: 90, x2: 530, y2: 90 },
      { t: 'arrow', x1: 670, y1: 90, x2: 700, y2: 90 },
      { t: 'note', x: 150, y: 158, w: 180, h: 74, text: 'append only\nnever edited\nreplay any time', fill: 'orange' },
      { t: 'note', x: 330, y: 158, w: 180, h: 74, text: 'duplicates removed\ntypes fixed\none row = one fact', fill: 'grey' },
      { t: 'note', x: 510, y: 158, w: 180, h: 74, text: 'P&L, KPIs, marts\nwhat BI and APIs read', fill: 'yellow' },
      { t: 'arrow', x1: 170, y1: 270, x2: 670, y2: 270, label: 'more trusted, smaller, easier to use', ly: -12 },
    ] } },
    `## Medallion: bronze, silver, gold
Most modern platforms organise data in three layers. It is a naming habit, not a product.
- **Bronze** is the raw landing zone. Exactly what arrived, plus when and from where. Append only. If a source file was wrong, you still have it, which makes **replays** and audits possible.
- **Silver** is cleaned and conformed. Types fixed, duplicates removed, codes standardised, same customer ID everywhere. Analysts can trust it but it is not yet shaped for one report.
- **Gold** is business-ready: the P&L, the budget-vs-actual mart, the customer 360. Dashboards and APIs read gold only.

The big benefit is **separation of concerns**: ingest problems stay in bronze, cleaning rules in silver, business definitions in gold. When the CFO changes the definition of "net revenue" you edit gold, not the ingestion code.

## Data mesh (the idea, not a product)
In a very large company one central data team becomes a bottleneck. **Data mesh** is an organisational idea: each business domain (Finance, Sales, Supply Chain) **owns its data as a product**, a central team provides a self-serve platform, and governance is shared. It is a way of dividing *people and responsibility*, not a tool you install. For a company with one data team it is usually unnecessary. You should recognise the term in interviews and know that it solves an organisational scale problem.

## Monolith, services, serverless (one paragraph)
The same ideas appear in application design. A **monolith** is one program doing everything: simple to build and run, hard to scale in parts. **Services** (or microservices) split it into separate programs that talk over the network, which brings independence and a lot of network problems (the next module). **Serverless** (like Azure Functions) lets the cloud run your small piece only when an event arrives. Most data products are a handful of services plus a database, not hundreds.

## Build vs buy
Every component forces a choice: write it, or rent it.

| Ask | Leans to **buy** | Leans to **build** |
|---|---|---|
| Does it make us different? | No (everyone needs ingestion) | Yes (our scoring rules) |
| Team size | Small | Large, with platform engineers |
| Time to first value | Weeks | Months are acceptable |
| Cost shape | Predictable subscription | Cheap at scale, expensive in people |
| Compliance / data residency | Vendor meets it | Needs full control |
| Lock-in risk | Acceptable | Must stay portable |

A good rule for a small team: **buy the boring, build the differentiating.** Rent the warehouse and the connectors. Write the finance rules that are unique to your customer.

## Three reference architectures
1. **Small team, open source:** PostgreSQL + dlt (load) + dbt (transform) + Dagster (schedule) + Power BI or Metabase. All runs in Docker. You will build this in a later project.
2. **Azure native:** Azure Data Lake Storage + Data Factory (move) + Databricks or Synapse (transform) + Power BI (serve) + Entra ID and Key Vault (security).
3. **Warehouse-centred:** Airbyte or Fivetran-style connectors + Snowflake + dbt + Airflow + a BI tool.

None is "right". Each is a different trade of money, people and control.`,
    { analogy: 'A **warehouse** is a supermarket: everything is labelled, shelved and ready, but you pay for the shelf space. A **lake** is a godown: cheap, takes anything, but finding a thing is your problem. A **lakehouse** is a godown with a good inventory system, so you get supermarket-style access to cheap storage. **Medallion** is the flow from the goods-received dock (bronze) through quality check (silver) to the shelf (gold).' },
    { py: {
      title: 'A decision helper (rules you can argue with)',
      starter: `def recommend(data_gb, needs_streaming, has_unstructured, team_size):
    """Return 'postgres', 'warehouse' or 'lakehouse' for a first platform."""
    if data_gb < 200 and not needs_streaming and not has_unstructured:
        return "postgres"            # small and structured: do not over-build
    if needs_streaming or has_unstructured:
        return "lakehouse"           # files + streams need a lake-style store
    if team_size <= 3:
        return "warehouse"           # rent the operations
    return "lakehouse"

cases = [
    ("Kollana finance MIS",       dict(data_gb=5,    needs_streaming=False, has_unstructured=False, team_size=2)),
    ("Retail sales, 2 TB",        dict(data_gb=2000, needs_streaming=False, has_unstructured=False, team_size=3)),
    ("Invoice PDFs + events",     dict(data_gb=800,  needs_streaming=True,  has_unstructured=True,  team_size=6)),
]
for name, kw in cases:
    print(f"{name:<24} -> {recommend(**kw)}")`,
      note: 'These rules are a conversation starter, not a law. Change a number or a rule and discuss whether you would defend the result in a design review.',
    } },
    { pychallenge: {
      id: 'foundations-pych-platform',
      prompt: 'Write `pick_layer(rows_in_bronze, passed_checks, used_by_dashboards)` that returns the **medallion layer** a table belongs in: `"gold"` if `used_by_dashboards` is true and `passed_checks` is true; `"silver"` if `passed_checks` is true but it is not used by dashboards; otherwise `"bronze"` (raw, unchecked). `rows_in_bronze` is just extra information you ignore.',
      starter: `def pick_layer(rows_in_bronze, passed_checks, used_by_dashboards):
    return "bronze"`,
      tests: `assert pick_layer(1000, True, True) == "gold"
assert pick_layer(1000, True, False) == "silver"
assert pick_layer(1000, False, False) == "bronze"
assert pick_layer(0, False, True) == "bronze"   # unchecked data never goes to gold, even if a dashboard wants it`,
      solution: `def pick_layer(rows_in_bronze, passed_checks, used_by_dashboards):
    if passed_checks and used_by_dashboards:
        return "gold"
    if passed_checks:
        return "silver"
    return "bronze"`,
      hint: 'Check the strongest condition first. Unchecked data is always bronze.',
    } },
    { warn: 'A lake with no rules becomes a **data swamp**. Before you save the first file, decide naming, folder layout (for example \`bronze/source/table/load_date=2026-09-30/\`), who owns each area, and how long raw data is kept. Cheap storage does not mean free confusion.' },
    { interview: '**"Warehouse vs lake vs lakehouse?"** Model answer: "A warehouse stores structured, modelled tables and enforces schema on write, great for governed SQL. A lake stores any file cheaply with schema on read, great for raw and unstructured data but weak on transactions and governance. A lakehouse puts a table format like Delta or Iceberg on lake files, adding ACID, updates and time travel, so one copy serves both BI and ML. I would choose by data shape, team skills and cost, and for a small structured workload I might simply use PostgreSQL." The last sentence shows judgement.' },
    { real: 'Your finance data today lives in SAP exports and Excel. Those exports are your **bronze**. The cleaned master of accounts and entities is **silver**. The P&L pack the CFO opens is **gold**. You have been doing medallion by hand for years; this course teaches you to make each layer automatic and testable.' },
    `## Recap
- **Warehouse**: structured tables, schema on write, governed SQL. **Lake**: any files, cheap, schema on read, easy to turn into a swamp. **Lakehouse**: lake files plus a table format that adds ACID and time travel.
- **Medallion** = bronze (raw, append-only), silver (cleaned, conformed), gold (business-ready). It separates ingest, cleaning and business rules.
- **Data mesh** is an organisational idea for very large companies, not a tool.
- **Build vs buy**: buy the boring, build what makes the customer different.
- Choose from team size, data shape and cost; a small structured workload may only need PostgreSQL.`,
  ],
  quiz: [
    { q: 'What does a table format such as Delta Lake add to files in a lake?', o: ['A faster network', 'Transactions, updates/deletes, time travel and schema enforcement', 'A graphical dashboard', 'Free storage'], a: 1, why: 'The table format keeps a transaction log over the files, which is what makes them behave like database tables.' },
    { q: 'Which layer should dashboards read from?', o: ['Bronze', 'Silver', 'Gold', 'Any layer, they are the same'], a: 2, why: 'Gold holds business-ready, tested definitions. Reading bronze would expose raw errors to users.' },
    { q: 'A raw file turned out to be wrong, and you want to rebuild last month. Why does medallion help?', o: ['Bronze keeps the original data so you can replay the transforms', 'Silver deletes old files', 'Gold re-downloads from the source', 'It does not help'], a: 0, why: 'Bronze is append-only and unedited, so you can re-run the later layers after fixing a rule.' },
    { q: '"Data mesh" mainly solves…', o: ['Slow disks', 'An organisational bottleneck of one central data team in a large company', 'SQL syntax differences', 'Network latency'], a: 1, why: 'It is about domain ownership of data as a product, plus a self-serve platform and shared governance.' },
    { q: 'For a small team, which approach to ingestion connectors is usually wiser?', o: ['Write every connector from scratch', 'Buy or use an existing connector tool, and build only what is unique to the business', 'Avoid ingestion completely', 'Always build streaming'], a: 1, why: 'Connectors are commodity work. Your time is better spent on finance rules that differentiate the customer.' },
    { q: 'What is a "data swamp"?', o: ['A lake with no naming, ownership or catalogue, so nobody knows what is trustworthy', 'A very fast warehouse', 'A type of Parquet file', 'A backup of the lake'], a: 0, why: 'Cheap storage without discipline produces a pile of files nobody can use safely.' },
  ],
  task: {
    title: 'Classify your own data',
    steps: [
      'List the data files, tables and reports from one process in your job (no client names).',
      'Assign each one to bronze, silver or gold, or say "not in a layer yet". Write which rule would move it up one layer.',
      'Run the decision helper with numbers from your own company. Do you agree with its answer? Write two sentences of why or why not.',
    ],
    deliverable: 'A page with three columns (bronze, silver, gold) listing your real data assets, and a short note on whether a warehouse, lake or lakehouse would fit.',
  },
};
