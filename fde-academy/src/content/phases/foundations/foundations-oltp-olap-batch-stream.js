export default {
  id: 'foundations-oltp-olap-batch-stream',
  title: 'OLTP vs OLAP, batch vs streaming',
  goal: 'You can explain why one database design cannot serve both the clerk and the CFO, choose batch, micro-batch or streaming for a requirement, and say where ETL and ELT differ.',
  roadmap: ['OLTP vs OLAP', 'Batch, micro-batch and streaming', 'Latency vs throughput', 'ETL vs ELT'],
  blocks: [
    `## The problem
At 11:03 am an accountant posts a journal. The system must save it **now**, check nothing else changed it at the same time, and answer in a few milliseconds.

At 11:04 your CFO asks: *"Budget vs actual by entity and month, for the whole year."* That question reads over a million GL lines and adds them up. It may take seconds, and that is fine.

Both questions use the same table. But a database tuned for the first is slow at the second, and the other way round. If you run the CFO's query on the live ledger, the accountant's screen freezes. This is the oldest problem in data engineering, and it explains why data warehouses exist.

## OLTP and OLAP
- **OLTP** (*Online Transaction Processing*) runs the business. Many small reads and writes, each touching one or a few rows, each must be fast and correct. Examples: the SAP posting screen, an order app, a payroll system. The database is usually **PostgreSQL**, SQL Server or Oracle, organised in many small, *normalised* tables.
- **OLAP** (*Online Analytical Processing*) analyses the business. Few queries, but each scans millions of rows and adds, groups and compares them. Examples: a P&L, a sales trend, budget vs actual. The database is a **warehouse** or lakehouse (Snowflake, Azure Synapse, Databricks, BigQuery), organised for reading.`,
    { sketch: { w: 760, h: 340, caption: 'OLTP: many tiny jobs on single rows. OLAP: a few huge jobs on a few columns, all rows.', items: [
      { t: 'text', x: 190, y: 22, text: 'OLTP: run the business', bold: true, size: 19 },
      { t: 'box', x: 14, y: 44, w: 170, h: 34, label: 'post journal JV-0051', fill: 'yellow', size: 15 },
      { t: 'box', x: 14, y: 92, w: 170, h: 34, label: 'look up invoice 4411', fill: 'yellow', size: 15 },
      { t: 'box', x: 14, y: 140, w: 170, h: 34, label: 'change order status', fill: 'yellow', size: 15 },
      { t: 'db', x: 262, y: 62, w: 100, h: 100, label: 'app\nDB', fill: 'blue' },
      { t: 'arrow', x1: 184, y1: 61, x2: 262, y2: 90 },
      { t: 'arrow', x1: 184, y1: 109, x2: 262, y2: 110 },
      { t: 'arrow', x1: 184, y1: 157, x2: 262, y2: 135 },
      { t: 'text', x: 190, y: 204, text: 'one row at a time · milliseconds · must be exactly right', size: 14, color: '#5c6478' },
      { t: 'line', x1: 395, y1: 20, x2: 395, y2: 220, dashed: true },
      { t: 'text', x: 580, y: 22, text: 'OLAP: analyse the business', bold: true, size: 19 },
      { t: 'note', x: 430, y: 40, w: 300, h: 36, text: '"budget vs actual, every entity, every month"', fill: 'pink' },
      { t: 'arrow', x1: 580, y1: 78, x2: 580, y2: 104 },
      { t: 'table', x: 470, y: 112, cols: ['gl_id', 'entity', 'amount'], colW: [70, 80, 100], rows: [['1', 'IN01', '130833'], ['2', 'IN01', '64788'], ['…', '…', '…']], fill: 'green', hl: [2], title: '1.2 million rows' },
      { t: 'text', x: 580, y: 236, text: 'few columns, ALL rows · seconds · a total, not a record', size: 14, color: '#5c6478' },
      { t: 'note', x: 20, y: 262, w: 340, h: 56, text: 'ROW store keeps each row together:\nfast to fetch ONE whole row', fill: 'blue' },
      { t: 'note', x: 400, y: 262, w: 340, h: 56, text: 'COLUMN store keeps each column together:\nfast to add up ONE column', fill: 'green' },
    ] } },
    `## Row stores and column stores
This is the physical reason for the split.

A **row store** (PostgreSQL, SQL Server) writes each row's values next to each other on disk. Fetching "invoice 4411, all its fields" reads one small chunk. Perfect for OLTP. But adding up \`amount\` over a million rows drags every other column along too.

A **column store** (Parquet files, Snowflake, Synapse, Databricks) writes each *column* together. Adding up \`amount\` reads only the \`amount\` strip, and a strip of one type compresses very well (the same currency code repeated a million times shrinks to almost nothing). The price: reading one whole row means collecting pieces from every column, which is slow. We cover file formats in a later lesson.

| | OLTP | OLAP |
|---|---|---|
| Purpose | Run the business | Understand the business |
| Typical query | "Get/insert/update this one record" | "Total by month and entity" |
| Rows touched | 1 to a few | Millions |
| Layout | Row store, many normalised tables | Column store, few wide tables (star schema) |
| Users | Thousands, in many tiny sessions | A few analysts, big queries |
| Data | Current state | History, kept for years |
| Priority | Correct and fast per write | Fast scans over large data |

Try one of each on the same table below. The first touches one journal. The second reads everything.`,
    { sql: {
      starter: `-- OLTP-style: fetch one journal
SELECT * FROM fact_gl WHERE journal_id = 'JV202504-0051';

-- OLAP-style: summarise everything
SELECT e.entity_code,
       DATE_TRUNC('month', g.posting_date)::date AS month,
       ROUND(SUM(g.debit), 2)  AS debit,
       ROUND(SUM(g.credit), 2) AS credit
FROM fact_gl g JOIN dim_entity e ON e.entity_id = g.entity_id
GROUP BY 1, 2
ORDER BY 1, 2;`,
      note: 'Both statements run in one go and both result sets are shown. Check the row counts at the bottom of each grid: 2 rows touched vs the whole table summarised.',
    } },
    { challenge: {
      id: 'foundations-ch-olap-channel',
      level: 'easy',
      prompt: 'An OLAP-style question: which sales **channel** brings in the most money? Return one row with `channel` and `total_amount` (the sum of `orders.amount`), for the top channel only.',
      hint: 'GROUP BY channel, SUM(amount), ORDER BY the total descending, LIMIT 1.',
      solution: `SELECT channel, SUM(amount) AS total_amount
FROM orders
GROUP BY channel
ORDER BY total_amount DESC
LIMIT 1`,
    } },
    `## Batch, micro-batch and streaming
OLTP and OLAP is about *where data lives*. **Batch and streaming** is about *when it moves*.

- **Batch**: collect data for a period, then process it in one go. "Every night at 2 am load the day's GL." Simple, cheap, easy to re-run.
- **Micro-batch**: tiny batches, every minute or every few minutes. "Refresh the inventory dashboard every 5 minutes."
- **Streaming**: process each event within seconds of it happening. "Flag this card swipe as fraud before the transaction completes."

Two words you must keep apart:
- **Latency** is how long **one** item waits from happening to being usable.
- **Throughput** is how many items you can process **per second or per hour in total**.

A bus has high throughput (many people per trip) and high latency (you wait for it to fill and leave). A taxi has low latency and lower throughput. Batch is the bus; streaming is the taxi. Neither is better. *Choose by the question the business asks:*

| Requirement said out loud | Choose |
|---|---|
| "The month-end close can be ready by day 3." | Batch |
| "Show me yesterday's sales each morning." | Batch |
| "The sales dashboard should be at most 5 minutes old." | Micro-batch |
| "Block the payment if it looks like fraud." | Streaming |
| "Show live stock for the warehouse picker." | Streaming or micro-batch |

The mistake beginners make is picking streaming because it sounds modern. Streaming costs more to build, to run and to debug. Ask **"how stale can this be before someone is harmed?"** and choose the slowest option that is still safe.`,
    { py: {
      title: 'The latency vs cost trade-off, in numbers',
      starter: `import pandas as pd

orders = pd.read_csv("orders.csv")
n = len(orders)                       # one order arrives every minute

def run(batch_size, startup_cost=40, per_record_cost=1):
    # A batch job only starts when the batch is full. Each start costs 'startup_cost' units,
    # each record costs 'per_record_cost' units.
    waits = [batch_size - 1 - (i % batch_size) for i in range(n)]   # minutes an order waits for its batch
    batches = -(-n // batch_size)                                   # ceiling division
    cost = batches * startup_cost + n * per_record_cost
    return sum(waits) / n, cost

print(f"{n} orders")
print("batch size | avg wait (min) | total cost")
for size in [1, 5, 20, 60, 220]:
    wait, cost = run(size)
    print(f"{size:>10} | {wait:>14.1f} | {cost:>10}")`,
      note: 'Batch size 1 behaves like streaming: nothing waits, but you pay the startup cost for every order. A single batch of 220 is cheap but the first order waits over 3 hours. Change startup_cost to 5 and see how the best choice moves.',
      hint: 'Streaming engines make startup_cost small by keeping the process running. That is part of what you pay for.',
    } },
    `## ETL vs ELT
Once data moves, where do you clean it?
- **ETL**: *Extract, Transform, Load.* Clean and reshape on a separate server **before** loading into the warehouse. This was necessary when warehouses were small and expensive.
- **ELT**: *Extract, Load, Transform.* Load the raw data first, then transform it **inside** the warehouse with SQL. Storage is cheap and warehouses are powerful, so this is now the default.

ELT also keeps the **raw copy**. When the CFO says "last quarter's FX logic was wrong, redo it", you re-run the transform on raw data. Under ETL the raw data may be gone. The medallion layers (bronze raw, silver clean, gold business-ready) you will meet later are ELT in practice.`,
    { warn: 'Do not run big reports on the live OLTP database "just this once". The query holds locks and takes CPU and disk away from the people entering transactions. If you must, use a **read replica** (a copy that follows the main database) as a stopgap. The real fix is a separate analytical store.' },
    { interview: '**"Why not run reports on the production database?"** Model answer: "Production is tuned for many small transactions. A large report scans millions of rows, competes for CPU and I/O, and can hold locks. The row-oriented, normalised design also needs many joins for analytics. I would copy data to a warehouse with a column-oriented layout, using a read replica only as a short-term stopgap." Follow-up: "Batch or stream that copy?" Answer by asking how stale the report can be.' },
    { real: 'Your month-end MIS runs as batch because finance accepts "ready on day 3". But your treasury colleague wants the cash position by 11 am every day, so that part needs a daily or hourly refresh. One company, three freshness requirements. Always ask for the number ("how old can it be?"), never "real-time".' },
    `## Recap
- **OLTP** runs the business with many tiny, fast, correct reads and writes. **OLAP** analyses it with few huge scans. They need different designs.
- **Row stores** are good at one whole row; **column stores** are good at one column across all rows.
- **Batch** collects then processes, **streaming** processes each event as it happens, **micro-batch** sits between. Choose by how stale the answer may be.
- **Latency** is the wait for one item; **throughput** is the total processed over time.
- **ELT** loads raw first and transforms in the warehouse, which keeps the raw copy and is now the default.`,
  ],
  quiz: [
    { q: 'Which statement describes an OLTP workload?', o: ['A query that sums a year of sales by region', 'Thousands of small inserts and updates, each touching a few rows', 'Nightly export to a data lake', 'Training a model on historical data'], a: 1, why: 'OLTP is many small, fast, correct transactions on current data.' },
    { q: 'Why is a column store faster for "total amount over a million rows"?', o: ['It never uses disks', 'It avoids SQL', 'It stores fewer rows', 'It reads only the amount column instead of every field of every row'], a: 3, why: 'Column layout lets the engine read just the needed column, and similar values compress well.' },
    { q: 'A bank must block a suspicious card payment before it completes. Which style fits?', o: ['Streaming', 'Monthly batch', 'Nightly batch', 'Weekly batch'], a: 0, why: 'The decision must happen within seconds of the event, so each event is processed as it arrives.' },
    { q: 'In the batch-size experiment, going from batch size 220 to size 1 changed what?', o: ['Nothing changed', 'Wait went up, cost went down', 'Wait went down, cost went up', 'Both went down'], a: 2, why: 'Smaller batches reduce waiting but you pay the startup cost many more times. That is the latency vs cost trade-off.' },
    { q: 'What is the main reason ELT became the default over ETL?', o: ['ETL tools are illegal', 'Streaming requires it', 'SQL is a newer language', 'Storage is cheap and warehouses are powerful, so load raw first and transform inside'], a: 3, why: 'Loading raw first keeps the original data and uses the warehouse\'s own power for the transforms.' },
    { q: 'The CFO says "we need it real-time". What is the best first response?', o: ['Start building a Kafka cluster', 'Ask how old the number can be before it causes harm', 'Say it is impossible', 'Add more dashboards'], a: 1, why: 'Real-time is usually shorthand. A clear freshness number lets you pick the simplest safe design.' },
  ],
  task: {
    title: 'Classify five requirements',
    steps: [
      'Write down five reports or automations from your job and, for each, the real freshness requirement as a number ("by 9 am", "within 5 minutes").',
      'Label each one batch, micro-batch or streaming, and OLTP or OLAP, with one sentence explaining why.',
      'In the Python playground change `startup_cost` to 5 and then to 200. Write down which batch size gives the lowest cost in each case and why a streaming platform tries to make startup cost small.',
    ],
    deliverable: 'A five-row table: requirement, freshness number, batch/micro-batch/streaming, OLTP/OLAP, reason.',
  },
};
