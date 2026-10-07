export default {
  id: 'foundations-data-product',
  title: 'What an end-to-end data product is',
  goal: 'You can draw the six stages of a data product, name what breaks at each stage, say who builds each part, and place every phase of this course on that map.',
  roadmap: ['End-to-end data product anatomy', 'Roles: analyst, analytics engineer, data engineer, FDE'],
  blocks: [
    `## The problem
Your CFO writes to you: *"Why did Singapore's marketing cost jump in September? And can I see this every month without anyone touching Excel?"*

The first half is a **query**. The second half is a **data product**. A query answers a question once. A data product answers it **every month, correctly, for people who never talk to you**, and tells you when it cannot.

That difference is what companies pay engineers for. This phase gives you the map. Every other phase in this course is one part of it.

## What is a data product?
A **data product** is data *plus* the machinery that keeps it correct, *plus* the promises made to the people who use it. It has:
- **Inputs**: files, databases, APIs, people typing into forms.
- **Steps**: copy, check, clean, join, calculate.
- **Outputs**: a dashboard, an Excel pack, an API, a table another team reads.
- **Guarantees**: "updated by 8 am", "totals match the ledger", "only Finance can see salaries".
- **An owner**: a named person who gets the phone call when it breaks.

A one-off Excel report has inputs and outputs. It has no steps anyone can re-run, no guarantees and no owner. That is why it breaks the month you are on leave.`,
    { sketch: { w: 760, h: 330, caption: 'Six stages in a line, and three things that cut across all of them', items: [
      { t: 'text', x: 380, y: 20, text: 'one data product, end to end', bold: true, size: 19 },
      { t: 'box', x: 12, y: 40, w: 112, h: 66, label: 'Sources', sub: 'SAP · Excel', fill: 'yellow' },
      { t: 'box', x: 138, y: 40, w: 112, h: 66, label: 'Ingest', sub: 'copy + check', fill: 'orange' },
      { t: 'box', x: 264, y: 40, w: 112, h: 66, label: 'Store', sub: 'DB · lake', fill: 'blue' },
      { t: 'box', x: 390, y: 40, w: 112, h: 66, label: 'Transform', sub: 'clean · model', fill: 'purple' },
      { t: 'box', x: 516, y: 40, w: 112, h: 66, label: 'Serve', sub: 'BI · API', fill: 'green' },
      { t: 'person', x: 690, y: 38, label: 'users' },
      { t: 'arrow', x1: 124, y1: 73, x2: 138, y2: 73 },
      { t: 'arrow', x1: 250, y1: 73, x2: 264, y2: 73 },
      { t: 'arrow', x1: 376, y1: 73, x2: 390, y2: 73 },
      { t: 'arrow', x1: 502, y1: 73, x2: 516, y2: 73 },
      { t: 'arrow', x1: 628, y1: 73, x2: 664, y2: 73 },
      { t: 'text', x: 68, y: 138, text: 'column\nrenamed', size: 13, color: '#c2410c' },
      { t: 'text', x: 194, y: 138, text: 'file sent\ntwice', size: 13, color: '#c2410c' },
      { t: 'text', x: 320, y: 138, text: 'disk full,\nwrong type', size: 13, color: '#c2410c' },
      { t: 'text', x: 446, y: 138, text: 'wrong FX\nrate used', size: 13, color: '#c2410c' },
      { t: 'text', x: 572, y: 138, text: 'dashboard\nis stale', size: 13, color: '#c2410c' },
      { t: 'box', x: 12, y: 186, w: 736, h: 38, label: 'Orchestration: runs every step in order, retries, alerts', fill: 'teal', size: 16 },
      { t: 'box', x: 12, y: 232, w: 736, h: 38, label: 'Security and identity: who may read, write, run, see salaries', fill: 'pink', size: 16 },
      { t: 'box', x: 12, y: 278, w: 736, h: 38, label: 'Quality and monitoring: tests, freshness, row counts, cost', fill: 'grey', size: 16 },
    ] } },
    `## The six stages, with a finance example
Take the CFO's question and follow the data.

1. **Sources.** Where the facts start: the SAP general ledger export, the budget in Excel, monthly FX rates from a bank's website, payroll from the HR system. You rarely control these. They change without telling you.
2. **Ingest.** Getting the data to where you can work on it, and checking it on arrival. Does the file have the columns you expect? Is it a duplicate of last week's file? *Ingest is where most outages begin* because sources change.
3. **Store.** Putting the data somewhere safe and queryable: a PostgreSQL database, files in cloud storage (a *data lake*), or a *warehouse* built for analysis. Chosen for cost, size and who needs it.
4. **Transform.** Turning raw rows into business meaning: convert SGD to INR at the right month's rate, roll accounts up the hierarchy, calculate budget vs actual. This is where SQL, Python and dbt live.
5. **Serve.** Handing the result to people or programs: a Power BI report, an Excel MIS pack, a REST API, a table in a shared schema.
6. **Monitor.** Knowing it still works: Did the load run? Are row counts normal? Do debits equal credits? Is the number of GL lines today close to yesterday's? Silent failure is the worst failure, because a CFO acts on a wrong number.

Across all six: **orchestration** (something runs the steps in order and retries), **security** (who can touch what), and **quality** (tests that prove the numbers).

## Who builds what
Job titles blur, but these roles show up everywhere:

| Role | Typical focus |
|---|---|
| **Data analyst** | Questions and dashboards (mostly Serve). |
| **Analytics engineer** | Clean, tested models in the warehouse (Transform, with dbt and SQL). |
| **Data engineer** | Pipelines and platforms (Ingest, Store, Orchestration, Monitor). |
| **Platform / cloud engineer** | The infrastructure and security under everything. |
| **Forward Deployed Engineer (FDE)** | Sits with the customer, understands the messy process, and builds the *whole* thing end to end, including the AI parts. |

You are training for the last row. An FDE does not get to say "that is the data team's job". The customer's problem crosses every stage, so you need to understand all of them. That is why this course starts with concepts, not tools.`,
    { analogy: 'A data product is a restaurant kitchen, not a single dish. **Sources** are the suppliers, **ingest** is the delivery door where you check the crates, **store** is the cold room, **transform** is the cooking, **serve** is the pass to the waiter, and **monitor** is the health inspector plus the temperature log. A great dish once is a query. A kitchen that is safe and consistent every night is a product.' },
    `## The map of this course
Every phase fits a place on the map. When a later phase feels abstract, come back to this table.

| Stage of the product | Phases in this course |
|---|---|
| Sources and how systems talk | \`foundations\`, \`http-rest\`, \`entra\` |
| Ingest | \`python\`, \`pandas\`, \`dlt\`, \`airbyte\`, \`kafka\`, \`power-automate\` |
| Store | \`sql\`, \`azure\`, \`snowflake\`, \`databricks\`, \`modelling\` |
| Transform | \`sql\`, \`dbt\`, \`spark\`, \`modelling\` |
| Serve | \`power-bi\`, \`fastapi\`, \`llm-apis\`, \`rag\` |
| Orchestration | \`adf\`, \`airflow\`, \`dagster\`, \`github-actions\`, \`docker\` |
| Security | \`foundations\`, \`entra\`, \`guardrails\` |
| Quality and monitoring | \`sql\`, \`dbt\`, \`evals\`, \`observability\` |

## See a tiny data product run
The program below is a miniature product with **one function per stage**, running on the Kollana Tech GL. It ingests the file, runs a quality gate, transforms to monthly totals, serves a table, and prints monitoring facts. Read the function names first. The structure matters more than the code.`,
    { py: {
      title: 'A six-stage mini pipeline',
      starter: `import pandas as pd

def ingest():                         # SOURCES -> INGEST
    return pd.read_csv("fact_gl.csv", parse_dates=["posting_date"])

def validate(gl):                     # QUALITY gate: debits must equal credits per journal
    sums = gl.groupby("journal_id")[["debit", "credit"]].sum()
    return list(sums[(sums.debit - sums.credit).abs() > 0.005].index)

def transform(gl):                    # TRANSFORM: monthly totals per entity
    gl = gl.assign(month=gl.posting_date.dt.to_period("M").astype(str))
    return gl.groupby(["entity_id", "month"])[["debit", "credit"]].sum().round(2).reset_index()

def serve(table):                     # SERVE: here we just print it
    print(table.head(6).to_string(index=False))

def monitor(gl, bad):                 # MONITOR: facts an on-call person needs
    print(f"rows={len(gl)}  unbalanced journals={len(bad)}  latest posting={gl.posting_date.max().date()}")

gl = ingest()
bad = validate(gl)
serve(transform(gl))
monitor(gl, bad)
print("unbalanced:", bad)`,
      note: 'Four journals do not balance on purpose. A real product would stop or quarantine them. Notice the quality gate sits **before** the numbers are served.',
      hint: 'Change validate() to return an empty list and see which journals would have slipped into the report.',
    } },
    `## A monitor is just a query
The **monitor** stage is often a small SQL query that runs on a schedule. Try this one: for each entity, when was the last posting and how many lines do we hold? If an entity's last posting is weeks old, the feed from that entity has silently stopped.`,
    { sql: {
      starter: `SELECT e.entity_code,
       MAX(g.posting_date) AS last_posting,
       COUNT(*)            AS gl_lines,
       ROUND(SUM(g.debit) - SUM(g.credit), 2) AS imbalance
FROM fact_gl g
JOIN dim_entity e ON e.entity_id = g.entity_id
GROUP BY e.entity_code
ORDER BY e.entity_code;`,
      note: 'A non-zero imbalance means debits and credits do not match for that entity. That is a quality alarm.',
    } },
    { challenge: {
      id: 'foundations-ch-freshness',
      level: 'easy',
      prompt: 'Write the **freshness check** for the General Ledger. Return one row per entity with `entity_code`, `last_posting` (latest `posting_date`) and `gl_lines` (number of GL lines). Order does not matter.',
      hint: 'Join fact_gl to dim_entity on entity_id, then GROUP BY entity_code with MAX and COUNT.',
      solution: `SELECT e.entity_code, MAX(g.posting_date) AS last_posting, COUNT(*) AS gl_lines
FROM fact_gl g
JOIN dim_entity e ON e.entity_id = g.entity_id
GROUP BY e.entity_code`,
    } },
    { warn: 'The most dangerous data product is one that **looks fine and is wrong**. A pipeline that crashes loudly gets fixed by lunchtime. A pipeline that quietly drops 3% of rows gets quoted in a board meeting. Always build the monitor and the quality gate before you build the pretty dashboard.' },
    { real: 'Look at any recurring report you built in your job. Name its six stages. You will find stage 2 (ingest) is "someone emails me an Excel", stage 6 (monitor) is "the user complains", and the owner is you. This course teaches you how to replace each of those with something that runs by itself and tells you when it cannot.' },
    { interview: '**"Walk me through how you would build X end to end."** You will hear this in almost every data or FDE interview. A strong answer follows the stages out loud: *clarify* who uses it and how fresh it must be → *sources* and how they change → *ingest* with validation → *store* and why that choice → *transform* and where business rules live → *serve* to which users → *orchestrate* and retry → *secure* who sees what → *monitor* what you alert on → *cost and failure modes*. Saying "and here is how it fails" at each step is what separates senior answers from junior ones.' },
    `## Recap
- A **data product** is data plus the machinery that keeps it correct plus promises to users plus a named owner.
- Six stages: **sources, ingest, store, transform, serve, monitor**, with **orchestration, security and quality** cutting across all of them.
- Most outages start at **ingest** (sources change) and most damage comes from **silent** quality failures.
- Roles blur, but an **FDE builds the whole thing end to end** with the customer, so you need every stage.
- Put quality gates and monitors in **before** the dashboard.`,
  ],
  quiz: [
    { q: 'What best separates a *data product* from a one-off report?', o: ['A data product uses a database', 'A data product has re-runnable steps, guarantees and an owner', 'A data product always has a dashboard', 'A data product is always bigger'], a: 1, why: 'The steps can be re-run, the promises (freshness, correctness, access) are explicit, and someone owns it. Size and tooling are not the difference.' },
    { q: 'Which stage is the most common starting point for outages, and why?', o: ['Monitor, because alerts are noisy', 'Serve, because dashboards are complicated', 'Store, because disks fill up', 'Ingest, because sources change without warning'], a: 3, why: 'Source systems rename columns, resend files or change formats. Ingest is where you meet those changes first, so validate there.' },
    { q: 'A pipeline drops 3% of rows every night and nobody notices. This is a failure of…', o: ['Quality and monitoring', 'Serving', 'Security', 'Orchestration'], a: 0, why: 'Row-count checks and reconciliation tests exist exactly to catch silent loss.' },
    { q: 'In which stage does converting SGD to INR at the month\'s FX rate belong?', o: ['Ingest', 'Store', 'Transform', 'Serve'], a: 2, why: 'Applying business rules to raw data is transformation. Ingest should only bring data in and check its shape.' },
    { q: 'Why does a Forward Deployed Engineer need to understand every stage?', o: ['Because dashboards are the only thing that matters', 'Because it is required by law', 'Because FDEs write all the code themselves', 'Because the customer\'s problem crosses every stage and nobody else will connect them'], a: 3, why: 'FDEs are embedded with the customer and own the outcome end to end, so gaps between stages become their problem.' },
    { q: 'You are asked "walk me through how you would build this". What should you add at every step?', o: ['The names of as many tools as possible', 'How that step can fail and how you would notice', 'The price of each tool', 'A promise to finish quickly'], a: 1, why: 'Failure modes and monitoring show you have run real systems, not just drawn boxes.' },
  ],
  task: {
    title: 'Draw your own data product',
    steps: [
      'Pick one recurring report or automation from your real job (no client names).',
      'On paper or in draw.io, draw the six stages for it: write the real source, the way data is ingested today, where it is stored, where the rules live, how users get the result, and how you find out it broke.',
      'Under each stage write one thing that has actually gone wrong there, and one check that would have caught it.',
      'Run the mini pipeline above, then change one function so that unbalanced journals are removed from the transform step. Note how the monthly totals change.',
    ],
    deliverable: 'A photo or PNG of your six-stage diagram with a failure and a check under each stage. You will reuse it in the design-doc lesson at the end of this phase.',
  },
};
