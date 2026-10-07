export default {
  id: 'foundations-database-landscape',
  title: 'The database landscape and choosing a store',
  goal: 'You can name the main database families, say what each is good and bad at, choose a store from the access pattern, and explain why most projects should start with one relational database and add others only for a measured need.',
  roadmap: ['Relational, document, key-value and wide-column databases', 'Columnar warehouse, graph, time-series, search and vector stores', 'Object storage (S3, Blob, ADLS) as the base of a lake', 'Access patterns and choosing the right store', 'Polyglot persistence and its cost'],
  blocks: [
    `## The problem
Your manager asks: *"Should we put the invoices in MongoDB?"* A colleague says PostgreSQL can store JSON anyway. A consultant says Cosmos DB. Everyone talks about tools. Nobody asks the real question.

The real question is: **how will this data be written and read?** A database is a bundle of choices: how data is laid out on disk, how it is indexed, how copies are kept in step. Each bundle is good at some jobs and poor at others. There is no best database, only a best fit. This lesson gives you the map.

## The deciding question: the access pattern
An **access pattern** is the kind of question you ask the data, over and over. There are six that matter:
- **Point lookup:** "get invoice 4411".
- **Range scan:** "all invoices of one vendor between 1 April and 30 June".
- **Aggregation:** "spend by entity and month" over millions of rows.
- **Search:** "invoices that mention *cloud hosting*, even misspelled".
- **Relationships:** "who approves whom, and who is three steps from this vendor?"
- **Similarity:** "which documents are closest in meaning to this question?"

State your patterns first, with rough numbers (how many rows, how many per second, how fresh). The store follows from them.`,
    { sketch: { w: 760, h: 452, caption: 'Start from the question you will ask, not from the product name.', items: [
      { t: 'note', x: 14, y: 16, w: 360, h: 46, text: 'Fetch invoice 4411 by its id', fill: 'yellow' },
      { t: 'note', x: 14, y: 70, w: 360, h: 46, text: 'Invoices of one vendor, 1 Apr to 30 Jun', fill: 'yellow' },
      { t: 'note', x: 14, y: 124, w: 360, h: 46, text: 'Spend by entity and month, 50 million rows', fill: 'yellow' },
      { t: 'note', x: 14, y: 178, w: 360, h: 46, text: 'Find invoices that mention "cloud hosting"', fill: 'yellow' },
      { t: 'note', x: 14, y: 232, w: 360, h: 46, text: 'Who approves whom, 3 hops from this vendor', fill: 'yellow' },
      { t: 'note', x: 14, y: 286, w: 360, h: 46, text: 'Documents closest in meaning to a question', fill: 'yellow' },
      { t: 'note', x: 14, y: 340, w: 360, h: 46, text: 'Last hour of readings for each sensor', fill: 'yellow' },
      { t: 'note', x: 14, y: 394, w: 360, h: 46, text: 'Keep every raw file cheaply for years', fill: 'yellow' },
      { t: 'arrow', x1: 374, y1: 39, x2: 460, y2: 39 },
      { t: 'arrow', x1: 374, y1: 93, x2: 460, y2: 93 },
      { t: 'arrow', x1: 374, y1: 147, x2: 460, y2: 147 },
      { t: 'arrow', x1: 374, y1: 201, x2: 460, y2: 201 },
      { t: 'arrow', x1: 374, y1: 255, x2: 460, y2: 255 },
      { t: 'arrow', x1: 374, y1: 309, x2: 460, y2: 309 },
      { t: 'arrow', x1: 374, y1: 363, x2: 460, y2: 363 },
      { t: 'arrow', x1: 374, y1: 417, x2: 460, y2: 417 },
      { t: 'box', x: 464, y: 16, w: 284, h: 46, label: 'Key-value or relational', sub: 'Redis, DynamoDB, PostgreSQL', fill: 'orange', size: 15 },
      { t: 'box', x: 464, y: 70, w: 284, h: 46, label: 'Relational, indexed', sub: 'PostgreSQL, SQL Server', fill: 'blue', size: 15 },
      { t: 'box', x: 464, y: 124, w: 284, h: 46, label: 'Columnar warehouse', sub: 'Snowflake, Synapse, ClickHouse', fill: 'green', size: 15 },
      { t: 'box', x: 464, y: 178, w: 284, h: 46, label: 'Search engine', sub: 'Elasticsearch, OpenSearch', fill: 'purple', size: 15 },
      { t: 'box', x: 464, y: 232, w: 284, h: 46, label: 'Graph (or SQL recursion)', sub: 'Neo4j, PostgreSQL', fill: 'pink', size: 15 },
      { t: 'box', x: 464, y: 286, w: 284, h: 46, label: 'Vector search', sub: 'pgvector, Qdrant, Azure AI Search', fill: 'teal', size: 15 },
      { t: 'box', x: 464, y: 340, w: 284, h: 46, label: 'Time-series', sub: 'TimescaleDB, InfluxDB', fill: 'red', size: 15 },
      { t: 'box', x: 464, y: 394, w: 284, h: 46, label: 'Object storage', sub: 'ADLS, Blob, S3', fill: 'grey', size: 15 },
    ] } },
    `## The families
Each family is a bundle of trade-offs. Learn its shape, not a product list.
- **Relational** (PostgreSQL, SQL Server, MySQL, Oracle). Tables with fixed, typed columns, linked by keys, queried with SQL. *Good at:* correctness (constraints, transactions), joins, flexible questions, indexed lookups and ranges. *Weak at:* spreading writes over many machines, and huge scans on a row layout. The safe default for business data: invoices, journals, payroll.
- **Document** (MongoDB, Azure Cosmos DB, or JSONB inside PostgreSQL). One self-contained JSON document per key, such as a whole invoice with its lines inside. *Good at:* records whose shape varies, and reading or writing one whole object at once. *Weak at:* joins across documents and heavy analytics.
- **Key-value** (Redis, Azure Cache for Redis, DynamoDB). Give a key, get a value, nothing else. *Good at:* very fast lookups, caches, sessions, counters, idempotency keys. *Weak at:* any question that is not "this key": you must scan everything. Redis lives in memory; DynamoDB is managed and scales by key.
- **Wide-column** (Cassandra). Rows are grouped under a partition key and sorted inside it. *Good at:* enormous write volumes spread over many machines, read by key and time range. *Weak at:* ad-hoc questions: you design each table around one query in advance.
- **Columnar warehouse** (Snowflake, Azure Synapse, ClickHouse, BigQuery). The column layout from the file formats lesson, with SQL on top. *Good at:* scans and totals over millions or billions of rows. *Weak at:* single-row lookups and frequent small updates, so never the system of record for an application. DuckDB is the same idea running inside your own program, handy for Parquet files on a laptop.
- **Graph** (Neo4j). Stores things (nodes) and connections (edges) and follows them. *Good at:* questions many hops deep, such as fraud rings and who-is-linked-to-whom. *Weak at:* bulk totals. For a few hops, SQL joins or a recursive query are often enough.
- **Time-series** (TimescaleDB, InfluxDB). Values stamped with time, appended and read by time window. *Good at:* heavy appends, down-sampling, deleting data older than N days. *Weak at:* general business data. Think server metrics and sensors.
- **Search engine** (Elasticsearch, OpenSearch, Azure AI Search). Keeps an index from every word to the documents that contain it. *Good at:* full-text search, typo tolerance, ranking by relevance, counts per category. *Weak at:* being the source of truth. It is a copy fed from another store.
- **Vector database** (pgvector in PostgreSQL, Qdrant, Azure AI Search). Stores *embeddings*, lists of numbers that capture meaning, and finds the nearest ones. It powers search by meaning and retrieval for AI answers. Later phases cover it properly; for now know that it answers "what is similar?", not "what is equal?".
- **Object storage** (Azure Blob Storage and ADLS Gen2, Amazon S3). Files in containers, addressed by path, cheap, durable, nearly unlimited. It is not a database: no queries, and no row updates, you replace the whole file. It is the base of the lake: your Parquet files sit here and engines query them in place.

## Consistency and scale, in one paragraph
One PostgreSQL server gives strong, simple guarantees: once a transaction commits, everyone sees it. To grow past one machine a store must spread data over many (sharding) and keep copies (replication), and then it must choose: wait for the copies to agree (safer, slower) or answer from the nearest copy (faster, maybe briefly stale). Many distributed stores let you choose per request. The ACID, CAP and consistency lesson has the vocabulary. The practical rule: **money and approvals need strong consistency; counters and feeds can usually live with "eventually"**, and scaling out usually costs some query flexibility.

## One PostgreSQL, two shapes
PostgreSQL has a \`jsonb\` column type that holds a JSON document inside an ordinary row. Keep typed columns for what is stable (vendor, date, amount) and put the variable part in JSON. Three operators do most of the work: \`->\` gets a JSON value, \`->>\` gets it as text, and \`@>\` asks "does this document contain this fragment?". The table below is created for you; read the five queries.`,
    { sql: {
      title: 'Relational columns and a JSONB document in one table',
      setup: `CREATE TABLE invoices (
  invoice_id   int PRIMARY KEY,
  vendor       text NOT NULL,
  invoice_date date NOT NULL,
  amount       numeric(12,2) NOT NULL,
  extra        jsonb NOT NULL DEFAULT '{}'
);
INSERT INTO invoices VALUES
 (1, 'Sharma & Sons',  '2026-04-03', 125000.00, '{"gstin":"27AAAAA0000A1Z5","tags":["urgent","capex"],"approval":{"by":"Meera","level":2},"lines":[{"sku":"SRV-01","qty":2},{"sku":"LAP-07","qty":3}]}'),
 (2, 'Mehta Traders',  '2026-04-11',  18400.00, '{"gstin":"24BBBBB1111B1Z6","tags":[],"lines":[{"sku":"PAP-02","qty":40}]}'),
 (3, 'Kollana Cloud',  '2026-05-02', 240000.00, '{"gstin":"29CCCCC2222C1Z7","tags":["urgent"],"approval":{"by":"Arjun","level":3},"po_number":"PO-7781"}'),
 (4, 'Iyer Logistics', '2026-05-19',  97000.00, '{"gstin":"33DDDDD3333D1Z8","tags":["urgent"],"lines":[{"sku":"FRT-11","qty":1}]}'),
 (5, 'Desai Print',    '2026-06-07', 152000.00, '{"gstin":"27EEEEE4444E1Z9","tags":["capex"],"approval":{"by":"Meera","level":1},"po_number":"PO-7790"}'),
 (6, 'Sharma & Sons',  '2026-06-21',   6500.00, '{"gstin":"27AAAAA0000A1Z5","lines":[{"sku":"PAP-02","qty":10}]}');`,
      starter: `-- 1) Typed columns and JSON fields side by side. ->> returns text, so cast when you need a number.
SELECT invoice_id, vendor, amount,
       extra ->> 'gstin'                       AS gstin,
       (extra -> 'approval' ->> 'level')::int  AS approval_level   -- NULL when there is no approval
FROM invoices
ORDER BY invoice_id;

-- 2) Containment: documents that contain this fragment
SELECT invoice_id, vendor, extra -> 'tags' AS tags
FROM invoices
WHERE extra @> '{"tags": ["urgent"]}';

-- 3) Both worlds in one query: a relational filter plus a JSON filter
SELECT vendor, SUM(amount) AS urgent_total
FROM invoices
WHERE invoice_date >= '2026-04-01' AND extra @> '{"tags": ["urgent"]}'
GROUP BY vendor
ORDER BY vendor;

-- 4) Turn a JSON array into rows
SELECT i.invoice_id, l ->> 'sku' AS sku, (l ->> 'qty')::int AS qty
FROM invoices i, jsonb_array_elements(i.extra -> 'lines') AS l
ORDER BY 1, 2;

-- 5) A GIN index makes @> fast on big tables (no rows are returned)
CREATE INDEX invoices_extra_gin ON invoices USING GIN (extra);`,
      note: 'All five statements run in one go. Notice invoice 6 has no tags key and invoice 2 has an empty list: neither matches "urgent". Only some invoices have po_number or approval, and the table did not need a new column for them.',
      hint: 'Try extra ? \'po_number\' to find documents that have a key, or extra -> \'lines\' -> 0 to get the first line item.',
    } },
    { challenge: {
      id: 'foundations-ch-jsonb-urgent',
      level: 'medium',
      prompt: 'The CTE `docs` in the starter stands in for an invoices table with one `jsonb` column. Return `vendor` (as text) and `total` (as numeric) for invoices whose `tags` array contains `"urgent"` **and** whose `total` is above 100000, largest total first. Use `->>`, a cast to numeric, and the containment operator `@>`.',
      hint: 'WHERE doc @> \'{"tags": ["urgent"]}\' AND (doc ->> \'total\')::numeric > 100000, then ORDER BY the total descending.',
      ordered: true,
      starter: `WITH docs(id, doc) AS (VALUES
  (1, '{"vendor":"Sharma & Sons","total":125000,"tags":["urgent","capex"],"approval":{"level":2}}'::jsonb),
  (2, '{"vendor":"Mehta Traders","total":18400,"tags":[]}'::jsonb),
  (3, '{"vendor":"Kollana Cloud","total":240000,"tags":["urgent"],"approval":{"level":3}}'::jsonb),
  (4, '{"vendor":"Iyer Logistics","total":97000,"tags":["urgent"]}'::jsonb),
  (5, '{"vendor":"Desai Print","total":152000,"tags":["capex"],"approval":{"level":1}}'::jsonb),
  (6, '{"vendor":"Rao Stationers","total":6500}'::jsonb)
)
SELECT * FROM docs;`,
      solution: `WITH docs(id, doc) AS (VALUES
  (1, '{"vendor":"Sharma & Sons","total":125000,"tags":["urgent","capex"],"approval":{"level":2}}'::jsonb),
  (2, '{"vendor":"Mehta Traders","total":18400,"tags":[]}'::jsonb),
  (3, '{"vendor":"Kollana Cloud","total":240000,"tags":["urgent"],"approval":{"level":3}}'::jsonb),
  (4, '{"vendor":"Iyer Logistics","total":97000,"tags":["urgent"]}'::jsonb),
  (5, '{"vendor":"Desai Print","total":152000,"tags":["capex"],"approval":{"level":1}}'::jsonb),
  (6, '{"vendor":"Rao Stationers","total":6500}'::jsonb)
)
SELECT doc ->> 'vendor' AS vendor, (doc ->> 'total')::numeric AS total
FROM docs
WHERE doc @> '{"tags": ["urgent"]}' AND (doc ->> 'total')::numeric > 100000
ORDER BY total DESC`,
    } },
    { warn: '**"Schema-less" does not mean "schema-free".** The schema moves out of the database and into every program that reads the data. Six months later one invoice has `amount` as text, one as a number and one has none, and every report needs defensive code. Use documents when shapes truly vary, and keep the stable core (ids, dates, amounts) in typed columns, as the JSONB table above does.' },
    `## Key-value and document, in plain Python
The two simplest NoSQL ideas fit in a few lines. The cell below builds a key-value store and a document store from dictionaries, loads 50,000 invoices into both, and counts how many records each question has to look at. A real engine adds disks, copies and a network, but the access-pattern logic is the same.`,
    { py: {
      title: 'A toy key-value store and a toy document store',
      starter: `class KeyValueStore:
    """Redis / DynamoDB idea: a key, a value, nothing else."""
    def __init__(self):
        self._data = {}
    def put(self, key, value):
        self._data[key] = value
    def get(self, key):
        return self._data.get(key)            # one dictionary lookup, however big the store is
    def scan(self):                           # what you do when the question is not "this key"
        return self._data.items()

class DocumentStore:
    """MongoDB idea: documents found by their fields, with optional indexes."""
    def __init__(self):
        self._docs = {}                       # id -> document
        self._indexes = {}                    # field -> {value -> [ids]}
    def insert(self, doc_id, doc):
        self._docs[doc_id] = doc
        for field, index in self._indexes.items():     # every write also maintains each index
            index.setdefault(doc.get(field), []).append(doc_id)
    def create_index(self, field):
        index = self._indexes[field] = {}
        for doc_id, doc in self._docs.items():
            index.setdefault(doc.get(field), []).append(doc_id)
    def find(self, field, value):
        if field in self._indexes:                      # jump straight to the matching ids
            ids = self._indexes[field].get(value, [])
            return [self._docs[i] for i in ids], len(ids)
        hits = [d for d in self._docs.values() if d.get(field) == value]
        return hits, len(self._docs)                    # no index: every document was examined

N = 50000
kv, docs = KeyValueStore(), DocumentStore()
for i in range(1, N + 1):
    invoice = {"vendor": f"V{i % 50}", "amount": 1000 + i % 977}
    kv.put(f"invoice:{i}", invoice)
    docs.insert(i, invoice)

print("KEY-VALUE")
print("  get invoice:4411     ->", kv.get("invoice:4411"))
n = sum(1 for _, v in kv.scan() if v["vendor"] == "V7")
print(f"  vendor V7 via scan   -> {n} hits, {N} values examined")

print("DOCUMENT STORE")
hits, examined = docs.find("vendor", "V7")
print(f"  no index             -> {len(hits)} hits, {examined} examined")
docs.create_index("vendor")
hits, examined = docs.find("vendor", "V7")
print(f"  with index on vendor -> {len(hits)} hits, {examined} examined")`,
      note: 'A key-value store answers "this key" instantly and "which values match?" only by scanning. An index turns a scan into a jump, but every insert now has more work to do. The same trade appears in every database, including PostgreSQL.',
      hint: 'Add docs.create_index("amount") and look for a single amount. Which find calls got cheaper, and which write got dearer?',
    } },
    { pychallenge: {
      id: 'foundations-pych-filter-docs',
      prompt: 'Write `filter_docs(docs, query)`, a mini query matcher for a document store. `docs` is a list of dicts. `query` is a dict of field to condition. A condition is either a plain value (the field must **equal** it) or a dict with `"$gt"` and/or `"$lt"` (the field must be a number strictly greater and/or strictly less). A document matches only if **every** condition holds. A document **without** the field never matches, even if the query asks for `None`, and a non-number never matches `"$gt"`/`"$lt"`. An empty query matches everything. Return the matching documents in the original order.',
      starter: `def filter_docs(docs, query):
    return docs`,
      tests: `docs = [
    {"id": 1, "vendor": "Sharma", "amount": 125000, "status": "paid"},
    {"id": 2, "vendor": "Mehta", "amount": 18400, "status": "open"},
    {"id": 3, "vendor": "Sharma", "amount": 6500, "status": "open"},
    {"id": 4, "vendor": "Rao", "status": "open"},
    {"id": 5, "vendor": "Desai", "amount": 97000, "status": "open"},
]
ids = lambda found: [d["id"] for d in found]
assert ids(filter_docs(docs, {"vendor": "Sharma"})) == [1, 3]
assert ids(filter_docs(docs, {"vendor": "Sharma", "status": "open"})) == [3]
assert ids(filter_docs(docs, {"amount": {"$gt": 50000}})) == [1, 5]
assert ids(filter_docs(docs, {"amount": {"$lt": 20000}})) == [2, 3]
assert ids(filter_docs(docs, {"amount": {"$gt": 10000, "$lt": 100000}})) == [2, 5]
assert ids(filter_docs(docs, {"status": "open", "amount": {"$gt": 18400}})) == [5]
assert ids(filter_docs(docs, {})) == [1, 2, 3, 4, 5]
assert filter_docs(docs, {"vendor": "Nobody"}) == []
assert filter_docs([], {"a": 1}) == []
assert filter_docs(docs, {"amount": {"$gt": 0}})[0] is docs[0]
assert filter_docs([{"id": 9}], {"note": None}) == []
assert len(filter_docs([{"id": 9, "note": None}], {"note": None})) == 1
assert filter_docs([{"amount": "99999"}], {"amount": {"$gt": 1}}) == []`,
      solution: `def filter_docs(docs, query):
    def matches(doc):
        for field, cond in query.items():
            if field not in doc:
                return False
            value = doc[field]
            if isinstance(cond, dict):
                if not isinstance(value, (int, float)):
                    return False
                if "$gt" in cond and not value > cond["$gt"]:
                    return False
                if "$lt" in cond and not value < cond["$lt"]:
                    return False
            elif value != cond:
                return False
        return True
    return [d for d in docs if matches(d)]`,
      hint: 'Write a helper that checks one document against every field of the query and returns False at the first failure. Check "field not in doc" before reading it.',
    } },
    `## Polyglot persistence and what it costs
Using several stores, each for what it does best, is called **polyglot persistence**. Real platforms often end up there: PostgreSQL for the app, Redis for a cache, a search index, a warehouse. But every store sends a bill. It is another system to back up, patch, secure, monitor and pay for. Data is copied between systems with delay, so two stores can disagree. And your team must know all of them.`,
    { sketch: { w: 760, h: 310, caption: 'One system of record, several copies. Every arrow is a job someone must build, monitor and pay for.', items: [
      { t: 'box', x: 14, y: 100, w: 100, h: 60, label: 'app', fill: 'yellow' },
      { t: 'db', x: 190, y: 82, w: 140, h: 100, label: 'PostgreSQL\nsystem of record', fill: 'blue', size: 15 },
      { t: 'arrow', x1: 114, y1: 130, x2: 190, y2: 132, label: 'writes', ly: -12 },
      { t: 'box', x: 470, y: 16, w: 276, h: 52, label: 'Redis', sub: 'cache, sessions, keys', fill: 'orange', size: 15 },
      { t: 'box', x: 470, y: 104, w: 276, h: 52, label: 'OpenSearch', sub: 'full-text search copy', fill: 'purple', size: 15 },
      { t: 'box', x: 470, y: 192, w: 276, h: 52, label: 'Warehouse / lake', sub: 'analytics copy', fill: 'green', size: 15 },
      { t: 'arrow', x1: 330, y1: 120, x2: 470, y2: 44, label: 'hot keys', lx: -10, ly: -14 },
      { t: 'arrow', x1: 330, y1: 132, x2: 470, y2: 130, label: 'change events', ly: -12 },
      { t: 'arrow', x1: 330, y1: 146, x2: 470, y2: 218, label: 'nightly load', lx: -8, ly: 18 },
      { t: 'note', x: 14, y: 258, w: 732, h: 44, text: 'Each copy can lag or disagree. Rebuild copies from the system of record,\nnever the other way round.', fill: 'pink' },
    ] } },
    `Three habits keep the bill small:
- **Start with one relational database.** PostgreSQL already does JSON (as you just saw), full-text search and, with an extension, vectors.
- **Add a store when you can name the access pattern and show the current one cannot cope.** "It is fashionable" is not a requirement.
- **Keep one system of record.** Every other store is a copy that you can rebuild from it.

## Choosing: a decision table
Read it from the left: requirement first, product last.

| Requirement | Pick | Why, and the catch |
|---|---|---|
| Invoices, payments and journals: money must balance, reports join many tables | Relational (PostgreSQL, SQL Server) | Constraints, transactions, joins. Catch: scaling writes beyond one server takes work |
| A product catalogue where each product type has different attributes | Document store, or PostgreSQL with JSONB | One document per product. Catch: cross-product reports need flattening |
| Session tokens, rate-limit counters, idempotency keys, a cache with expiry | Key-value (Redis) | Very fast lookups, built-in expiry. Catch: memory-bound, no ad-hoc questions |
| Millions of device events a second, always read by device and time range | Wide-column (Cassandra) or DynamoDB | Writes spread over many machines. Catch: design tables around the queries |
| CFO dashboards over five years of history | Warehouse or lakehouse (Snowflake, Synapse, Databricks) | Column layout scans fast. Catch: not for transactions |
| A search box over vendor names and narrations, tolerant of typos | Search engine (OpenSearch) fed from the main database | Relevance and typo tolerance. Catch: a copy, not the truth |
| Detect rings of vendors sharing bank accounts and directors | Graph database, or SQL recursion if small | Multi-hop traversal is native. Catch: one more system to run |
| Server and sensor metrics, kept 90 days, charted by the minute | Time-series (TimescaleDB, InfluxDB) | Time-window queries and automatic retention |
| Answer questions from 10,000 policy PDFs by meaning | Vector search plus object storage for the PDFs | Nearest-neighbour on embeddings. Catch: approximate answers |
| Keep every raw file for years, cheaply | Object storage (ADLS, Blob, S3) | Cheap and durable. Catch: no queries without an engine on top |

A finished design usually uses one or two rows of this table, not all ten.`,
    { interview: `**"Which database would you choose for an invoice system that also needs search and analytics?"** Model answer: "I would not start with a product. I would ask for the access patterns: how many invoices, how many writes a second, what people search for, and how fresh the analytics must be. Then three decisions. One, the system of record is PostgreSQL, or SQL Server if the company already runs it: invoices are relational (vendors, GL accounts, payments), money must balance, so I want constraints and transactions, and vendor-specific extras can go in a JSONB column. Two, search: I start with PostgreSQL full-text search, and only if users need typo tolerance, ranking and facets at a scale it cannot serve do I add OpenSearch as a *copy* fed from the database, never as the source of truth. Three, analytics: not on the live database. I copy to a warehouse or lakehouse, for example Parquet files in ADLS queried by Synapse or Databricks, and BI reads the gold tables. So three stores, each with one job, one system of record, and the others rebuildable. I add each one only when the need is measured." Follow-up: "Why not MongoDB?" Answer: "Invoices are relational and need joins and strict rules. I would use it if the documents really vary and are read whole."` },
    { real: `Look at the Kollana platform you will build. Raw vendor files land in object storage (bronze). Cleaned tables and the gold marts live in PostgreSQL. The idempotency keys that stop a retried Power Automate run from posting a journal twice sit in a key-value store or a small Postgres table. That is four jobs but only one or two engines, because PostgreSQL does JSON, keys and full-text search well enough at this size. In a design review, the sentence that earns respect is: "one engine until a measured need says otherwise."` },
    `## Recap
- Choose a store from the **access pattern**: point lookup, range scan, aggregation, search, relationships or similarity. Product names come last.
- **Relational** is the safe default for business data. **Document** and **key-value** trade query power for flexibility and speed. **Wide-column** trades ad-hoc queries for huge writes. A **warehouse** is for big scans, **graph** for deep relationships, **time-series** for time windows, **search** for relevance, **vector** for similarity.
- **Object storage** is not a database; it is the cheap file base of the lake, with an engine on top.
- Distributed stores trade consistency and query flexibility for scale. Money needs strong consistency; counters and feeds can usually be eventual.
- **Polyglot persistence** works but every extra store adds cost and sync risk. Keep one system of record and add stores only for a measured need.`,
  ],
  quiz: [
    { q: 'What should you decide before picking a database product?', o: ['Which vendor has the best logo', 'Which database the newest tutorial uses', 'The access pattern: how the data will be written and read, and how much of it', 'The colour theme of the dashboard'], a: 2, why: 'Each family is good at some access patterns and poor at others, so the patterns and rough volumes come first and the product follows.' },
    { q: 'Which store fits session tokens, rate-limit counters and idempotency keys with automatic expiry?', o: ['A key-value store such as Redis', 'A graph database', 'A columnar warehouse', 'Object storage'], a: 0, why: 'These are lookups by one key that must be very fast, often with an expiry time, which is exactly what a key-value store does.' },
    { q: 'Why should a search engine such as OpenSearch not be your system of record?', o: ['It cannot store text', 'It is a secondary copy built for relevance, so keep the truth elsewhere and rebuild the index from it', 'SQL is banned in search engines', 'It only works offline'], a: 1, why: 'Search indexes are optimised for finding, not for strict correctness. Keep one system of record and treat the index as a rebuildable copy.' },
    { q: 'In PostgreSQL, what does `extra ->> \'gstin\'` return for a jsonb column?', o: ['The key name', 'A jsonb value', 'A number', 'The value as text'], a: 3, why: '`->` returns a JSON value, `->>` returns it as text. Cast the text, for example ::int, when you need a number.' },
    { q: 'What is the main cost of polyglot persistence?', o: ['SQL stops working', 'More systems to run, secure and pay for, and copies that can lag or disagree', 'Data becomes unreadable', 'Every query becomes slower'], a: 1, why: 'Each extra store adds operations work and a sync job between stores. That is why you start with one and add others only for a measured need.' },
    { q: 'Which statement about object storage (ADLS, Blob, S3) is true?', o: ['It is a fast transactional database', 'It supports joins and indexes', 'It stores files cheaply and durably but is not a query engine; you put an engine on top', 'It updates one row of a Parquet file in place'], a: 2, why: 'Object storage is the cheap file base of the lake. Queries come from an engine such as Synapse, Databricks, Snowflake or DuckDB, and files are replaced whole.' },
  ],
  task: {
    title: 'Write a store-choice memo',
    steps: [
      'In the SQL playground add three invoices of your own with different shapes in `extra` (for example a `po_number` on one, a `lines` array on another, an `approval` object on a third). Write one query that returns invoices that have a `po_number` and one that returns invoices without any `approval`.',
      'Change the Python cell to 200000 invoices and add an index on `amount`. Write down which question got cheaper, which write got dearer, and one real case from your job where that trade-off matters.',
      'Pick three systems from your job (payroll, a GST reconciliation, a monthly MIS pack). For each, fill a row: access patterns, rough volume, how fresh it must be, the store you would choose, and whether you would add a second store.',
      'Write the memo "Invoices + search + analytics for Kollana Tech": one system of record, what you would add and when, and what evidence would make you add it.',
    ],
    deliverable: 'A one-page memo with a three-row table (system, access patterns, volume, freshness, store) and a three-paragraph answer on the invoice, search and analytics design, naming the system of record.',
  },
};
