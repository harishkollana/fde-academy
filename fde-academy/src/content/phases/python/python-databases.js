export default {
  id: 'python-databases',
  title: 'Databases from Python',
  goal: 'You can connect to PostgreSQL from Python with psycopg and SQLAlchemy, use parameterised queries (never string building), run all-or-nothing transactions, load data fast with executemany and COPY, stream big results, understand connection pools, and handle database errors by type.',
  roadmap: ['psycopg', 'SQLAlchemy Core and ORM', 'sessions and transactions', 'parameterised queries', 'connection pooling', 'bulk loads with COPY'],
  blocks: [
    `## The problem
In the SQL phase you ran queries in DBeaver and in the browser. Real jobs run **inside Python**: read a month of GL lines from a CSV, load them into PostgreSQL, run a validation query, write the result back, and make sure that a failure half way does not leave the table in a mess. Three beginner mistakes spoil this, and each looks harmless:
- **Building SQL with f-strings.** It works until a supplier is called \`O'Brien & Co\`, and it opens the door to **SQL injection**, where a value changes the meaning of the query.
- **One \`INSERT\` per row.** 100,000 rows means 100,000 trips to the server. It is slow because of the **waiting**, not because of the data.
- **No transaction thinking.** The loader inserts 600 rows, crashes on row 601, and the table now holds half a month. A re-run then inserts the first 600 again.

This lesson gives you the tools of the trade: a **driver** (psycopg) that talks to PostgreSQL, a **toolkit** (SQLAlchemy) with an engine, connection pool and optional ORM, and the habits that make loads safe, fast and repeatable. The runnable parts in the browser simulate the database with small stand-ins (a spy cursor, an in-memory table), so you can see the *ideas* without a server. The real code, with real output, is in the laptop boxes.`,
    `## Driver, toolkit, ORM: which is which?
| Layer | What it is | You write | Typical use |
|---|---|---|---|
| **Driver** (\`psycopg\`, version 3) | speaks the PostgreSQL protocol; sends your SQL and parameters; returns rows | SQL text | scripts and ETL: loading, validating, reports |
| **SQLAlchemy Core** | an **engine** (connection pool), \`text()\` queries with named parameters, and a way to describe tables and build queries from Python objects | SQL or Python expressions | when you want pooling, several databases, or pandas \`read_sql\` / \`to_sql\` |
| **SQLAlchemy ORM** | maps a **class to a table** and a **row to an object**; a \`Session\` tracks changes | classes, not SQL | application back ends (a FastAPI service), not bulk data work |
| **pandas** \`read_sql\`, \`to_sql\` | reads a query into a DataFrame, writes a DataFrame to a table | a query | analysis and quick loads (pandas phase) |

For data engineering the usual choice is **a driver plus plain SQL**, or Core when you want a pool. The ORM is common in the API phase. Use \`psycopg\` (version 3: \`pip install "psycopg[binary]"\`); the older \`psycopg2\` still exists, and in a SQLAlchemy URL the driver is named: \`postgresql+psycopg://\` (version 3).

**Placeholders differ by library**, and mixing them up is a classic: **psycopg** uses \`%s\` and \`%(name)s\`, **SQLAlchemy \`text()\`** uses \`:name\`, SQLite and many ODBC drivers use \`?\`.`,
    { sketch: { w: 760, h: 300, caption: 'The layers: pick the lowest one that gives you what you need', items: [
      { t: 'box', x: 14, y: 24, w: 470, h: 50, label: 'your code and pandas', sub: 'read_sql, to_sql', fill: 'white', size: 16 },
      { t: 'arrow', x1: 249, y1: 76, x2: 249, y2: 92 },
      { t: 'box', x: 14, y: 94, w: 470, h: 50, label: 'SQLAlchemy ORM (optional)', sub: 'classes and a Session', fill: 'purple', size: 16 },
      { t: 'arrow', x1: 249, y1: 146, x2: 249, y2: 162 },
      { t: 'box', x: 14, y: 164, w: 470, h: 50, label: 'SQLAlchemy Core', sub: 'engine, pool, text(), tables', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 249, y1: 216, x2: 249, y2: 232 },
      { t: 'box', x: 14, y: 234, w: 470, h: 50, label: 'driver: psycopg 3', sub: 'protocol, parameters, COPY', fill: 'yellow', size: 16 },
      { t: 'arrow', x1: 488, y1: 259, x2: 560, y2: 259 },
      { t: 'db', x: 564, y: 224, w: 120, h: 70, label: 'PostgreSQL', fill: 'green' },
      { t: 'note', x: 520, y: 24, w: 226, h: 190, fill: 'grey', size: 13, text: 'ETL scripts and loaders:\nthe driver plus plain SQL.\n\nPooling, several databases,\npandas: add Core.\n\nWeb APIs with many small\nreads and writes:\nthe ORM.' },
    ] } },
    `## Connect, query, and always use parameters
\`\`\`python
import psycopg

with psycopg.connect(DSN) as conn:                  # commit at the end, rollback on an error, then close
    row = conn.execute(
        "SELECT emp_id, emp_name FROM employees WHERE emp_id = %s", (7,)
    ).fetchone()
\`\`\`
- **The DSN** (connection string) holds host, port, database, user and password. **Never write the password in the code**: build the DSN from environment variables (the Logging and configuration lesson).
- **\`conn.execute(sql, params)\`** runs one statement and returns a cursor. \`fetchone()\`, \`fetchall()\`, or **loop over the cursor** to stream rows. \`row_factory=dict_row\` gives dictionaries instead of tuples.
- **Parameters go in separately.** \`%s\` marks the place and the values are passed as a tuple (or \`%(name)s\` and a dict). The driver sends the SQL **text** and the **values** to the server separately, so a value can never become part of the SQL. That is the cure for injection **and** for the apostrophe problem.
- **Identifiers cannot be parameters.** A table or column name is not a value. If it must vary, **check it against a whitelist or a strict pattern**, or compose it with \`psycopg.sql.Identifier\`, which quotes it safely. Never paste user text into a name.

This is the same lesson as in the SQL phase (roles and security), now from the Python side: **SQL is code, data is data, and they travel separately.**`,
    { py: {
      title: 'String building versus placeholders: what the database would receive',
      starter: `import re

bad = "x' OR '1'='1"                     # an "supplier name" typed by an attacker (or a clumsy colleague)

def naive(name):                         # WRONG: the value becomes part of the SQL text
    return "SELECT count(*) FROM purchase_register WHERE supplier_name = '" + name + "'"

for name in ("Nandi Electricals", bad, "O'Brien & Co"):
    sql = naive(name)
    print(sql)
    print("   quotes balanced?", sql.count("'") % 2 == 0, "<- an odd number means the SQL is broken")
print()
print("The attacker's text is valid SQL: WHERE supplier_name = 'x' OR '1'='1'  is true for EVERY row.")
print("The apostrophe in O'Brien breaks the SQL even though nobody attacked anything.")

class SpyDriver:
    """Shows what a driver sends: the SQL text and the parameters, as two separate things."""
    def execute(self, sql, params=()):
        print("SQL text   :", sql)
        print("parameters :", params)

print()
print("--- the right way")
driver = SpyDriver()
driver.execute("SELECT count(*) FROM purchase_register WHERE supplier_name = %s", (bad,))
driver.execute("SELECT count(*) FROM purchase_register WHERE supplier_name = %s", ("O'Brien & Co",))
print("The SQL text is the same every time and contains no value, so there is nothing to inject into.")

# identifiers (table and column names) cannot be parameters: validate them yourself
IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*(\\.[A-Za-z_][A-Za-z0-9_]*)?")

def check_identifier(name):
    if not IDENT.fullmatch(name):
        raise ValueError(f"unsafe identifier: {name!r}")
    return name

print()
for name in ("fact_gl", "public.fact_gl", "fact_gl; DROP TABLE dim_entity", "fact gl", "1table"):
    try:
        print("OK     ", check_identifier(name))
    except ValueError as exc:
        print("REJECT ", exc)`,
      note: 'On a real server the first naive query counts all 30 rows of purchase_register, not zero (we ran exactly this: 30 of 30 rows with string building, 0 rows with a placeholder), and the O\'Brien query raises a syntax error. The parameterised form is correct for both. The identifier check is the same idea for names: allow only what you expect.',
    } },
    `## Transactions: all or nothing
A **transaction** is a group of statements that succeed **together or not at all**. In psycopg the first statement silently starts one, and nothing is visible to others until \`COMMIT\`. If an exception leaves the \`with psycopg.connect(...) as conn:\` block, everything since the last commit is **rolled back**. You also have:
- \`conn.commit()\` and \`conn.rollback()\` to end a transaction yourself.
- **\`with conn.transaction():\`** a block that is committed or rolled back on its own; inside an outer transaction it becomes a **savepoint**, so you can undo one step and continue.
- **\`autocommit=True\`** on the connection: every statement commits at once. Fine for \`VACUUM\` or a read-only script, wrong for a load.

**Design a load as one transaction per unit of work** (one month, one file). Then a failure leaves the table as it was, and a re-run is safe. Make the load **idempotent** so a second run changes nothing:
- **Upsert**: \`INSERT ... ON CONFLICT (key) DO UPDATE SET ...\` (SQL phase). Same input, same table.
- **Replace the partition**: in one transaction, \`DELETE\` the month and \`INSERT\` it again.
- A plain \`INSERT\` run twice fails with a unique violation (good: it tells you), or worse, creates duplicates when there is no key.

**Keep transactions short.** An open transaction holds locks and stops the cleaner (\`VACUUM\`) from removing old rows. Do not wait for a user, or call a slow API, in the middle of one.`,
    { py: {
      title: 'All or nothing: a load that fails half way, with and without a transaction',
      starter: `from contextlib import contextmanager

class IntegrityError(Exception):
    pass

class FakeConn:
    """A tiny in-memory 'database': one table keyed by gl_id, a CHECK (debit >= 0), and commit/rollback."""
    def __init__(self):
        self.table, self._snapshot = {}, None
    def begin(self):
        self._snapshot = dict(self.table)
    def commit(self):
        self._snapshot = None
    def rollback(self):
        self.table, self._snapshot = self._snapshot, None
    def insert(self, row):
        if row["debit"] < 0:
            raise IntegrityError(f"CHECK violated for gl_id {row['gl_id']}")
        if row["gl_id"] in self.table:
            raise IntegrityError(f"duplicate key {row['gl_id']}")
        self.table[row["gl_id"]] = row
    def upsert(self, row):                               # INSERT ... ON CONFLICT DO UPDATE
        if row["debit"] < 0:
            raise IntegrityError(f"CHECK violated for gl_id {row['gl_id']}")
        self.table[row["gl_id"]] = row

@contextmanager
def transaction(conn):
    conn.begin()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

good = [{"gl_id": i, "debit": 100 * i} for i in range(1, 6)]
bad = good[:3] + [{"gl_id": 99, "debit": -5}] + good[3:]       # row 4 breaks the CHECK constraint

print("1. no transaction, a bad row in the middle")
conn = FakeConn()
conn.table = {}
conn._snapshot = None
try:
    for row in bad:
        conn.insert(row)
except IntegrityError as exc:
    print("   error:", exc, "| rows left in the table:", len(conn.table), "<- half a load")

print("2. the same load inside a transaction")
conn = FakeConn()
try:
    with transaction(conn):
        for row in bad:
            conn.insert(row)
except IntegrityError as exc:
    print("   error:", exc, "| rows in the table:", len(conn.table), "<- nothing: the table is as before")

print("3. fix the data and load again")
with transaction(conn):
    for row in good:
        conn.insert(row)
print("   rows:", len(conn.table))

print("4. run the SAME load again with plain INSERT")
try:
    with transaction(conn):
        for row in good:
            conn.insert(row)
except IntegrityError as exc:
    print("   error:", exc, "| rows:", len(conn.table), "<- refused, nothing changed")

print("5. run it again as an upsert: idempotent")
for run in (1, 2, 3):
    with transaction(conn):
        for row in good:
            conn.upsert(row)
    print(f"   run {run}: rows = {len(conn.table)}")`,
      note: 'This is a model of what the database does for you. Case 1 is the dangerous one: the first three rows stay in. In case 2 the rollback restores the snapshot, so the failed month leaves no trace. Cases 4 and 5 show why idempotent upserts are used for re-runnable jobs: the plain insert refuses duplicates, the upsert simply gives the same table every time.',
    } },
    `## Loading data fast
Every statement you send costs a **round trip**: your request travels to the server, the server works, the answer travels back. The work on one row is tiny; the **waiting** is what takes the time. So loading fast means **fewer, bigger trips**:

| Method | Round trips for 100,000 rows | Notes |
|---|---|---|
| a \`for\` loop with \`execute\` per row | about 100,000 | slowest; fine for a handful of rows |
| \`cur.executemany(sql, rows)\` | few (psycopg 3 pipelines the statements) | the easy, good default for up to some hundred thousand rows |
| a multi-row \`INSERT ... VALUES (...), (...), ...\` | one per batch | you must build the SQL; keep batches modest |
| **\`COPY ... FROM STDIN\`** | **one stream** | the fastest way to load. psycopg: \`with cur.copy("COPY t (a, b) FROM STDIN") as copy: copy.write_row(row)\` |

Rules of thumb: **batch** (1,000 to 10,000 rows) and commit once per unit of work; use **COPY** for large loads, usually into a **staging table**, then \`INSERT ... SELECT ... ON CONFLICT\` into the real table (so you can validate first and stay idempotent); \`TRUNCATE\` the staging table afterwards.

**What COPY consumes.** In its text format each row is one line, columns are separated by a **tab**, \`NULL\` is written \`\\N\`, and the special characters are escaped (\`\\\\\` for a backslash, \`\\t\`, \`\\n\`, \`\\r\`). psycopg's \`copy.write_row()\` produces this for you; the playground below builds it by hand so you can see it.

**Reading big results without loading them all:** loop over the cursor, call \`cur.fetchmany(1000)\` in a loop, or use a **server-side cursor** (\`conn.cursor(name="stream")\`) so the server keeps the result and sends it in chunks. It is the generator idea from the iterators lesson, applied to the database.`,
    { sketch: { w: 760, h: 292, caption: 'The same 5,000 rows: the work is the same, the number of trips to the server is not', items: [
      { t: 'text', x: 14, y: 17, text: 'one INSERT per row: 5,000 trips', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 44, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 74, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 104, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 134, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 164, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 194, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 224, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 254, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'box', x: 284, y: 30, w: 26, h: 22, fill: 'pink' },
      { t: 'text', x: 322, y: 48, text: '... and so on, each waits for the answer', size: 13, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 14, y: 85, text: 'executemany in batches of 1,000: 5 trips', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 98, w: 130, h: 26, label: '1,000 rows', size: 13, fill: 'yellow' },
      { t: 'box', x: 150, y: 98, w: 130, h: 26, label: '1,000 rows', size: 13, fill: 'yellow' },
      { t: 'box', x: 286, y: 98, w: 130, h: 26, label: '1,000 rows', size: 13, fill: 'yellow' },
      { t: 'box', x: 422, y: 98, w: 130, h: 26, label: '1,000 rows', size: 13, fill: 'yellow' },
      { t: 'box', x: 558, y: 98, w: 130, h: 26, label: '1,000 rows', size: 13, fill: 'yellow' },
      { t: 'text', x: 14, y: 155, text: 'COPY: one stream', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 168, w: 700, h: 26, label: 'all 5,000 rows flow in one go', size: 13, fill: 'green' },
      { t: 'note', x: 14, y: 214, w: 732, h: 68, fill: 'grey', size: 14, text: 'Cost = (trips x waiting per trip) + (rows x work per row). Batching shrinks the first part.\nLoad into a staging table with COPY, check it, then upsert into the real table in ONE transaction.' },
    ] } },
    { py: {
      title: 'Round trips counted by a spy cursor, with a modelled time (assumed numbers)',
      starter: `class SpyCursor:
    """Records what a driver would send. Each entry is one network round trip."""
    def __init__(self):
        self.trips = []                                   # (kind, number of rows)
    def execute(self, sql, params=None):
        self.trips.append(("one INSERT per row", 1))
    def executemany(self, sql, param_sets):
        self.trips.append(("executemany, batches", len(list(param_sets))))
    def copy_rows(self, rows):
        self.trips.append(("COPY, one stream", len(list(rows))))

SQL = "INSERT INTO gl_copy VALUES (%s, %s, %s, %s, %s)"
rows = [(i, "JV202504-%04d" % (i // 2), 1, "100.00", "0") for i in range(5000)]

def row_by_row(cur):
    for r in rows:
        cur.execute(SQL, r)

def in_batches(cur, size=1000):
    for i in range(0, len(rows), size):
        cur.executemany(SQL, rows[i:i + size])

def with_copy(cur):
    cur.copy_rows(rows)

# A MODEL, not a measurement. Assumed: each round trip waits 1.0 ms for the network,
# each row costs a little work on the server (COPY has the leanest path).
WAIT_PER_TRIP_MS = 1.0
WORK_PER_ROW_MS = {"one INSERT per row": 0.05, "executemany, batches": 0.05, "COPY, one stream": 0.01}

def modelled_ms(cur):
    return sum(WAIT_PER_TRIP_MS + n * WORK_PER_ROW_MS[kind] for kind, n in cur.trips)

results = []
for load in (row_by_row, in_batches, with_copy):
    cur = SpyCursor()
    load(cur)
    rows_sent = sum(n for _, n in cur.trips)
    results.append((cur.trips[0][0], len(cur.trips), rows_sent, modelled_ms(cur)))

base = results[0][3]
print(f"{'method':<22}{'trips':>7}{'rows':>7}{'modelled ms':>13}{'speed-up':>10}")
for name, trips, rows_sent, ms in results:
    print(f"{name:<22}{trips:>7,}{rows_sent:>7,}{ms:>13,.0f}{base / ms:>9.1f}x")`,
      note: 'The number of trips is exact: 5,000, then 5, then 1. The times are modelled from the assumptions written in the code (1 ms of waiting per trip), so do not quote them as measurements; with a database on another machine the wait per trip is usually larger, which makes batching matter even more. In the laptop box below you load the 1,227 GL rows with executemany and with COPY against a real server.',
    } },
    { py: {
      title: 'What COPY consumes: the text format, written and read back',
      starter: `def copy_value(v):
    if v is None:
        return "\\\\N"                                       # NULL is the two characters backslash-N
    text = str(v)
    return (text.replace("\\\\", "\\\\\\\\").replace("\\t", "\\\\t")
                .replace("\\n", "\\\\n").replace("\\r", "\\\\r"))   # escape what would break the format

def copy_row(values):
    return "\\t".join(copy_value(v) for v in values)         # columns are separated by a TAB

rows = [
    ("JV202504-0001", 130833.18, None, "Sales invoice"),                 # a NULL
    ("JV202504-0002", 0, 64788.72, "Rent\\tApril"),                       # a tab inside the text
    ("JV202504-0003", 0, 12.5, "line one\\nline two"),                    # a line break inside the text
    ("JV202504-0004", 0, 9.99, "C:\\\\fde\\\\input"),                         # backslashes
    ("JV202504-0005", 5, 0, ""),                                          # an EMPTY string is not NULL
]
buffer = "\\n".join(copy_row(r) for r in rows) + "\\n"
print("what COPY ... FROM STDIN receives:")
print(buffer)
print("one line per row:", buffer.count("\\n") == len(rows), "| a raw tab is only ever a column separator")
print("raw text of row 3 :", repr(copy_row(rows[2])))
print("NULL versus empty :", repr(copy_row((None, ""))))

print()
print("In psycopg you never write this by hand:")
print("    with cur.copy('COPY gl_copy (gl_id, journal_id) FROM STDIN') as copy:")
print("        for row in rows:")
print("            copy.write_row(row)       # escapes, NULLs and types are handled for you")`,
      note: 'The text format has two rules worth remembering: a tab separates columns and a line ends a row, so a tab or a line break inside the data must be escaped; and NULL (\\N) is different from an empty string, which is just an empty field. This is why you should use copy.write_row() and not join strings yourself. Challenge 3 asks for the reverse: reading such a line back into Python values.',
    } },
    { local: `**Connect from Python to your own PostgreSQL** (the database \`fde_practice\` from the SQL setup lesson; virtual environment active; \`pip install "psycopg[binary]" sqlalchemy pandas\`). First set the password for this PowerShell window only, never in the code:
\`\`\`powershell
$env:APP_DB_PASSWORD = "your-postgres-password"
\`\`\`
Save as \`db_lab.py\` next to your exported \`fact_gl.csv\`:
\`\`\`python
"""Databases from Python: psycopg 3 against the Kollana practice database."""
import csv
import os

import psycopg
from psycopg.rows import dict_row

DSN = (
    f"host={os.environ.get('APP_DB_HOST', 'localhost')} port=5432 dbname=fde_practice "
    f"user=postgres password={os.environ['APP_DB_PASSWORD']}"
)

CREATE = """
CREATE TABLE IF NOT EXISTS gl_copy (
    gl_id       integer PRIMARY KEY,
    journal_id  text NOT NULL,
    entity_id   integer NOT NULL,
    debit       numeric(14,2) NOT NULL DEFAULT 0,
    credit      numeric(14,2) NOT NULL DEFAULT 0
)
"""


def read_gl(path="fact_gl.csv"):
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            yield (int(r["gl_id"]), r["journal_id"], int(r["entity_id"]), r["debit"], r["credit"])


def main():
    with psycopg.connect(DSN) as conn:               # commits at the end, rolls back on an error, then closes
        conn.execute("DROP TABLE IF EXISTS gl_copy")
        conn.execute(CREATE)

        row = conn.execute("SELECT emp_id, emp_name FROM employees WHERE emp_id = %s", (7,)).fetchone()
        print("employee 7:", row)

        rows = list(read_gl())
        with conn.cursor() as cur:                   # executemany: one statement, many parameter sets
            cur.executemany("INSERT INTO gl_copy VALUES (%s, %s, %s, %s, %s)", rows[:500])
            print(f"executemany: {cur.rowcount} rows")
        conn.execute("TRUNCATE gl_copy")

        with conn.cursor() as cur:                   # COPY: the fastest way to load
            with cur.copy("COPY gl_copy (gl_id, journal_id, entity_id, debit, credit) FROM STDIN") as copy:
                for r in rows:
                    copy.write_row(r)
        count = conn.execute("SELECT count(*) FROM gl_copy").fetchone()[0]
        print("rows loaded with COPY:", count, "| rows in the file:", len(rows))

        upsert = (
            "INSERT INTO gl_copy (gl_id, journal_id, entity_id, debit, credit) VALUES (%s, %s, %s, %s, %s) "
            "ON CONFLICT (gl_id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit"
        )
        for attempt in (1, 2):                       # idempotent: the second run changes nothing
            with conn.cursor() as cur:
                cur.executemany(upsert, rows)
            print(f"upsert run {attempt}:", conn.execute("SELECT count(*) FROM gl_copy").fetchone()[0], "rows")

        try:
            with conn.transaction():                 # a savepoint: only this block is undone
                conn.execute("INSERT INTO gl_copy VALUES (1, 'JV-X', 1, 0, 0)")
        except psycopg.errors.UniqueViolation as exc:
            print("duplicate key:", type(exc).__name__, "| sqlstate", exc.sqlstate)
        print("the connection is still usable:", conn.execute("SELECT 1").fetchone()[0])

        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT entity_id, COUNT(*) AS lines, SUM(debit) AS debit FROM gl_copy GROUP BY entity_id ORDER BY 1")
            for r in cur:
                print(r)

        total = 0
        with conn.cursor(name="stream_gl") as cur:   # a server-side cursor: streams in chunks
            cur.itersize = 200
            cur.execute("SELECT debit FROM gl_copy")
            for (debit,) in cur:
                total += debit
        print("streamed total debit:", total)

        try:
            with conn.transaction():
                conn.execute("DELETE FROM gl_copy")
                raise RuntimeError("something went wrong half way")
        except RuntimeError:
            print("after the error:", conn.execute("SELECT count(*) FROM gl_copy").fetchone()[0], "rows are still there")
        conn.execute("DROP TABLE gl_copy")


if __name__ == "__main__":
    main()
\`\`\`
Run \`python db_lab.py\`. Output to expect (the numbers are the ones you already know from the SQL phase):
\`\`\`text
employee 7: (7, 'Kabir Menon')
executemany: 500 rows
rows loaded with COPY: 1227 | rows in the file: 1227
upsert run 1: 1227 rows
upsert run 2: 1227 rows
duplicate key: UniqueViolation | sqlstate 23505
the connection is still usable: 1
{'entity_id': 1, 'lines': 411, 'debit': Decimal('6288358.95')}
{'entity_id': 2, 'lines': 408, 'debit': Decimal('154012.10')}
{'entity_id': 3, 'lines': 408, 'debit': Decimal('245847.69')}
streamed total debit: 6688218.74
after the error: 1227 rows are still there
\`\`\`
**Common errors and fixes.** \`password authentication failed for user "postgres"\`: wrong password in \`APP_DB_PASSWORD\`. \`connection refused\` or \`could not connect to server\`: PostgreSQL is not running (start the service) or the port is not 5432. \`database "fde_practice" does not exist\`: you are on another server, or the database name differs from your setup lesson. \`KeyError: 'APP_DB_PASSWORD'\`: the variable is not set in this PowerShell window. \`ModuleNotFoundError: No module named 'psycopg'\`: the virtual environment is not active. In the middle of a load: \`relation "gl_copy" does not exist\` means the CREATE ran in another transaction that rolled back.

**The same data through SQLAlchemy** (\`sa_lab.py\`): one **engine per process**, \`text()\` queries with \`:name\` parameters, Core tables, an ORM class, and pandas:
\`\`\`python
import os

import pandas as pd
from sqlalchemy import MetaData, Table, create_engine, func, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

URL = f"postgresql+psycopg://postgres:{os.environ['APP_DB_PASSWORD']}@localhost:5432/fde_practice"
engine = create_engine(URL, pool_size=5, max_overflow=0, pool_pre_ping=True)   # ONE engine per process

with engine.begin() as conn:                         # commits at the end, rolls back on an error
    row = conn.execute(text("SELECT emp_id, emp_name FROM employees WHERE emp_id = :id"), {"id": 7}).one()
    print("employee:", tuple(row))

fact_gl = Table("fact_gl", MetaData(), autoload_with=engine)       # read the table definition
query = (select(fact_gl.c.entity_id, func.count().label("lines"), func.sum(fact_gl.c.debit).label("debit"))
         .group_by(fact_gl.c.entity_id).order_by(fact_gl.c.entity_id))
with engine.connect() as conn:
    for r in conn.execute(query):
        print(tuple(r))


class Base(DeclarativeBase):
    pass


class Entity(Base):
    __tablename__ = "dim_entity"
    entity_id: Mapped[int] = mapped_column(primary_key=True)
    entity_code: Mapped[str]
    currency: Mapped[str]


with Session(engine) as session:                     # a Session is a unit of work
    for e in session.scalars(select(Entity).order_by(Entity.entity_id)):
        print(e.entity_id, e.entity_code, e.currency)

df = pd.read_sql(text("SELECT entity_id, SUM(debit) AS debit FROM fact_gl GROUP BY entity_id ORDER BY 1"), engine)
print(df.to_string(index=False))
print("pool:", engine.pool.status())
engine.dispose()
\`\`\`
Output to expect (SQLAlchemy 2.x):
\`\`\`text
employee: (7, 'Kabir Menon')
(1, 411, Decimal('6288358.95'))
(2, 408, Decimal('154012.10'))
(3, 408, Decimal('245847.69'))
1 IN01 INR
2 SG01 SGD
3 US01 USD
 entity_id      debit
         1 6288358.95
         2  154012.10
         3  245847.69
pool: Pool size: 5  Connections in pool: 1 Current Overflow: -4 Current Checked out connections: 0
\`\`\`
**What the pool did.** Opening a connection (network, login, memory on the server) is slow compared with a query. The engine keeps up to \`pool_size\` connections open and **lends** them: \`engine.connect()\` or \`engine.begin()\` borrows one, and leaving the \`with\` block gives it back, not closed. That is why the pool status shows one idle connection after the work. \`pool_pre_ping=True\` tests a connection before lending it, so a connection that the server dropped overnight is replaced. **Create the engine once per process**, not inside every function, and give each worker process its own engine.` },
    { warn: `Things that go wrong with databases from Python:
- **f-strings and \`+\` to build SQL with values.** Injection, and breakage on any apostrophe. Always use placeholders; whitelist identifiers.
- **A new connection or engine for every query.** Slow, and it can exhaust the server's connection limit. One engine per process, borrow and return.
- **Forgetting that a transaction is open.** A script that reads and never commits or closes keeps a transaction open and locks things. Use \`with\` blocks.
- **Commit after every row.** Each commit forces a disk write. Commit once per batch or per unit of work.
- **One INSERT per row** for big loads. Use \`executemany\` or COPY.
- **\`fetchall()\` on a huge result.** The whole result lands in memory. Stream with the cursor, \`fetchmany\`, or a server-side cursor.
- **Plain INSERT in a re-runnable job.** A re-run fails or duplicates. Use upserts or replace the partition in one transaction.
- **Float for money** coming back from \`numeric\`: psycopg returns \`Decimal\`, keep it. Do not convert with \`float()\`.
- **Retrying every error.** Retry **connection** problems and **deadlocks or serialization failures** (transient). Do not retry a \`UniqueViolation\`, a \`ForeignKeyViolation\` or a syntax error: they will fail again.
- **Passwords in the code or the DSN in git.** Environment variables, as in the Logging and configuration lesson.
- **Mixing placeholder styles.** \`%s\` for psycopg, \`:name\` for SQLAlchemy \`text()\`, \`?\` for SQLite and ODBC.` },
    { pychallenge: {
      id: 'python-databases-ch1',
      prompt: 'Write `insert_in_batches(cur, sql, rows, batch_size)`. `rows` is any iterable (it may be a generator, and it may be big). Collect rows into batches of `batch_size`; call `cur.executemany(sql, batch)` for each full batch **as soon as it is full** (do not read ahead), and once more for a last smaller batch. Return the number of `executemany` calls. An empty input makes no call. Raise `ValueError` if `batch_size` is less than 1.',
      starter: `def insert_in_batches(cur, sql, rows, batch_size):
    # TODO: loop over rows, fill a list, call cur.executemany(sql, batch) when it is full, and for the rest at the end
    return 0
`,
      tests: `class Spy:
    def __init__(self):
        self.calls = []
    def executemany(self, sql, params):
        self.calls.append((sql, list(params)))

cur = Spy()
rows = ((i, f"r{i}") for i in range(7))                  # a generator
n = insert_in_batches(cur, "INSERT INTO t VALUES (%s, %s)", rows, 3)
assert n == 3, n
assert [len(c[1]) for c in cur.calls] == [3, 3, 1]
assert cur.calls[0] == ("INSERT INTO t VALUES (%s, %s)", [(0, "r0"), (1, "r1"), (2, "r2")])
assert cur.calls[2][1] == [(6, "r6")]

cur = Spy()
assert insert_in_batches(cur, "x", [], 5) == 0 and cur.calls == []
cur = Spy()
assert insert_in_batches(cur, "x", [(1,), (2,)], 5) == 1 and len(cur.calls) == 1
cur = Spy()
assert insert_in_batches(cur, "x", [(1,), (2,), (3,), (4,)], 2) == 2

try:
    insert_in_batches(Spy(), "x", [(1,)], 0)
    raise AssertionError("expected ValueError")
except ValueError:
    pass

def source():
    yield (1,)
    yield (2,)
    raise RuntimeError("the source failed")

cur = Spy()
try:
    insert_in_batches(cur, "x", source(), 2)
    raise AssertionError("expected RuntimeError")
except RuntimeError:
    pass
assert len(cur.calls) == 1 and cur.calls[0][1] == [(1,), (2,)], "a full batch must be sent before reading further"`,
      solution: `def insert_in_batches(cur, sql, rows, batch_size):
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")
    batch, calls = [], 0
    for row in rows:
        batch.append(row)
        if len(batch) == batch_size:
            cur.executemany(sql, batch)
            calls += 1
            batch = []
    if batch:
        cur.executemany(sql, batch)
        calls += 1
    return calls
`,
      hint: 'Keep a `batch` list and a counter. For each row append it; when `len(batch) == batch_size` call `cur.executemany(sql, batch)`, add one to the counter and start a new list. After the loop send the leftover rows if there are any. Check `batch_size` first and raise `ValueError`.',
    } },
    { pychallenge: {
      id: 'python-databases-ch2',
      prompt: 'Write `build_upsert(table, columns, key_columns)` that returns a parameterised PostgreSQL upsert statement as text, for example `INSERT INTO fact_gl (gl_id, debit) VALUES (%s, %s) ON CONFLICT (gl_id) DO UPDATE SET debit = EXCLUDED.debit`. The columns that are not keys are updated, in their order; if every column is a key the statement ends with `DO NOTHING`. Identifiers cannot be parameters, so **validate** them: each name must match `[A-Za-z_][A-Za-z0-9_]*`; the table may be `schema.table` (one dot at most). Raise `ValueError` for an unsafe name, an empty column or key list, or a key that is not one of the columns.',
      starter: `import re

def build_upsert(table, columns, key_columns):
    # TODO: validate every identifier, then build the INSERT ... ON CONFLICT statement
    return ""
`,
      tests: `assert build_upsert("fact_gl", ["gl_id", "debit", "credit"], ["gl_id"]) == (
    "INSERT INTO fact_gl (gl_id, debit, credit) VALUES (%s, %s, %s) "
    "ON CONFLICT (gl_id) DO UPDATE SET debit = EXCLUDED.debit, credit = EXCLUDED.credit")
assert build_upsert("public.dim_entity", ["entity_id", "entity_code"], ["entity_id"]) == (
    "INSERT INTO public.dim_entity (entity_id, entity_code) VALUES (%s, %s) "
    "ON CONFLICT (entity_id) DO UPDATE SET entity_code = EXCLUDED.entity_code")
assert build_upsert("fx", ["currency", "month", "rate"], ["currency", "month"]) == (
    "INSERT INTO fx (currency, month, rate) VALUES (%s, %s, %s) "
    "ON CONFLICT (currency, month) DO UPDATE SET rate = EXCLUDED.rate")
assert build_upsert("t", ["a", "b"], ["a", "b"]) == "INSERT INTO t (a, b) VALUES (%s, %s) ON CONFLICT (a, b) DO NOTHING"

bad_calls = [
    ("fact_gl; DROP TABLE x", ["a"], ["a"]),
    ("t", ["a b"], ["a b"]),
    ("t", ["a", "b); DROP TABLE t; --"], ["a"]),
    ("t", ["a"], ["b"]),
    ("t", [], []),
    ("t", ["a"], []),
    ("1t", ["a"], ["a"]),
    ("a.b.c", ["a"], ["a"]),
]
for args in bad_calls:
    try:
        build_upsert(*args)
        raise AssertionError(f"expected ValueError for {args}")
    except ValueError:
        pass`,
      solution: `import re

IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")

def _check(name):
    if not isinstance(name, str) or not IDENT.fullmatch(name):
        raise ValueError(f"unsafe identifier: {name!r}")
    return name

def build_upsert(table, columns, key_columns):
    parts = table.split(".")
    if len(parts) > 2:
        raise ValueError(f"unsafe table name: {table!r}")
    for part in parts:
        _check(part)
    if not columns or not key_columns:
        raise ValueError("columns and key_columns must not be empty")
    for name in list(columns) + list(key_columns):
        _check(name)
    if not set(key_columns) <= set(columns):
        raise ValueError("every key column must be one of the columns")
    placeholders = ", ".join(["%s"] * len(columns))
    sql = (f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders}) "
           f"ON CONFLICT ({', '.join(key_columns)}) ")
    updates = [c for c in columns if c not in key_columns]
    if updates:
        sql += "DO UPDATE SET " + ", ".join(f"{c} = EXCLUDED.{c}" for c in updates)
    else:
        sql += "DO NOTHING"
    return sql
`,
      hint: 'Write a small `check(name)` that raises `ValueError` unless `re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name)`. Split the table on "." (at most two parts, each checked). Check every column and key, make sure the keys are a subset of the columns, then build the text with `", ".join(columns)`, one `%s` per column and `EXCLUDED.col` for each non-key column.',
    } },
    { pychallenge: {
      id: 'python-databases-ch3',
      prompt: 'Write `parse_copy_row(line)`, the reader for one line of COPY text format. Remove one trailing newline if present, split the line on tab characters into fields, and turn each field into a Python value: a field that is exactly `\\N` (backslash and the letter N) is `None`; in every other field the escapes `\\\\`, `\\t`, `\\n` and `\\r` become a backslash, a tab, a line feed and a carriage return. An empty field is an empty string, not `None`. Return the list of values.',
      starter: `def parse_copy_row(line):
    # TODO: strip one trailing newline, split on tabs, decode each field (None for \\N, escapes otherwise)
    return []
`,
      tests: `def copy_value(v):
    if v is None:
        return "\\\\N"
    text = str(v)
    return text.replace("\\\\", "\\\\\\\\").replace("\\t", "\\\\t").replace("\\n", "\\\\n").replace("\\r", "\\\\r")

def copy_row(values):
    return "\\t".join(copy_value(v) for v in values)

assert parse_copy_row("JV1\\t100.5\\t\\\\N\\ta\\\\tb") == ["JV1", "100.5", None, "a\\tb"]
assert parse_copy_row("a\\\\\\\\b") == ["a\\\\b"]
assert parse_copy_row("line1\\\\nline2\\\\r") == ["line1\\nline2\\r"]
assert parse_copy_row("\\t") == ["", ""]
assert parse_copy_row("x\\ty\\n") == ["x", "y"]
assert parse_copy_row("\\\\\\\\N") == ["\\\\N"], "a backslash followed by N in the DATA is not NULL"
assert parse_copy_row("") == [""]

values = ["JV202504-0002", 0, None, "Rent\\tApril", "line one\\nline two", "C:\\\\fde\\\\input", ""]
back = parse_copy_row(copy_row(values))
assert back == ["JV202504-0002", "0", None, "Rent\\tApril", "line one\\nline two", "C:\\\\fde\\\\input", ""], back`,
      solution: `ESCAPES = {"t": "\\t", "n": "\\n", "r": "\\r", "\\\\": "\\\\"}

def _decode(field):
    out, i = [], 0
    while i < len(field):
        ch = field[i]
        if ch == "\\\\" and i + 1 < len(field):
            out.append(ESCAPES.get(field[i + 1], field[i + 1]))
            i += 2
        else:
            out.append(ch)
            i += 1
    return "".join(out)

def parse_copy_row(line):
    if line.endswith("\\n"):
        line = line[:-1]
    return [None if field == "\\\\N" else _decode(field) for field in line.split("\\t")]
`,
      hint: 'First `line.split("\\t")` gives the fields (real tabs inside values are written as the two characters backslash-t, so they do not split). A field equal to the two characters backslash and N is `None`. Decode every other field by walking through its characters: when you see a backslash, look at the next character and map `t`, `n`, `r` and `\\\\` to the real character, then skip both.',
    } },
    { real: 'This is the daily bread of data engineering: a job reads a file or an API, validates it with Pydantic, loads it into a **staging table** with COPY, runs SQL checks (the SQL phase), upserts into the real table in **one transaction**, and exits with a clear code. When a month is re-run because a source file was corrected, the idempotent upsert or the delete-and-insert inside one transaction makes the re-run safe. Later you will meet the same ideas in dlt (which loads in batches with schemas), in Airflow tasks (one transaction per task), and in dbt (which runs set-based SQL for you). The connection pool and the engine reappear in FastAPI services, which hold a pool open for the lifetime of the app.' },
    { interview: `**"Why use parameterised queries?"**
Model answer: "Because they keep SQL code and data separate. The driver sends the statement text and the values separately, so a value can never change the structure of the query: that prevents SQL injection, and it also handles quotes, dates and numbers correctly. I never build SQL with f-strings. For table or column names, which cannot be parameters, I validate them against a strict pattern or whitelist, or compose them with \`psycopg.sql.Identifier\`."

**"How do you load a few hundred thousand rows into PostgreSQL from Python efficiently?"** "Avoid one insert per row because the cost is mostly network round trips. I use COPY, usually into a staging table with \`cur.copy\` and \`write_row\`, or \`executemany\` in batches for smaller loads. I validate in the staging table, then upsert into the target in a single transaction, and commit once per unit of work."

**"How do you make a load idempotent?"** "With an upsert (\`INSERT ... ON CONFLICT DO UPDATE\`) on the business key, or by deleting and re-inserting the partition inside one transaction, so running it twice gives the same result. The whole load is one transaction, so a failure leaves nothing half done."

**"What is a connection pool and why do you need one?"** "Opening a database connection is expensive, so a pool keeps a number of connections open and lends them to the code that needs them, and takes them back afterwards. SQLAlchemy's engine is the pool: I create one engine per process and borrow connections with \`engine.begin()\` or \`engine.connect()\`. \`pool_pre_ping\` replaces connections that the server has dropped."

**"SQLAlchemy Core or ORM?"** "For data pipelines I use the driver or Core with plain SQL, because I think in set-based statements. The ORM maps tables to classes and tracks changes in a session, which fits application back ends such as a FastAPI service with many small reads and writes."` },
    `## Recap
- **Driver** (psycopg 3) talks to PostgreSQL; **SQLAlchemy Core** adds the engine, pool and \`text()\`; the **ORM** maps classes to tables (APIs); pandas \`read_sql\` and \`to_sql\` ride on the engine. Placeholders: \`%s\` (psycopg), \`:name\` (SQLAlchemy \`text\`), \`?\` (SQLite, ODBC).
- **Always use parameters**; never f-strings. Values travel separately from the SQL, which stops injection and quote bugs. **Identifiers** are validated or composed with \`sql.Identifier\`. Passwords come from the environment.
- **Transactions are all or nothing.** \`with psycopg.connect(...)\` commits or rolls back; \`conn.transaction()\` is a savepoint. One transaction per unit of work, kept short, and **idempotent** (upsert or replace the partition).
- **Load with fewer trips:** \`executemany\` in batches, **COPY** for big loads into a staging table, then upsert. Stream big results with a server-side cursor. Round trips, not rows, are the cost.
- **Pool:** create one engine per process; borrowing is cheap, opening is expensive; \`pool_pre_ping\`. Handle errors by type: retry connection errors, deadlocks and serialization failures; never retry constraint violations.`,
  ],
  quiz: [
    { q: 'Why is `cur.execute("... WHERE name = %s", (name,))` safe, while `"... WHERE name = \'" + name + "\'"` is not?', o: ['the first one is shorter', 'the driver sends the SQL and the value separately, so a value can never become part of the SQL', 'the first one is faster', '%s checks the name against a list'], a: 1, why: 'With a placeholder the value cannot change the statement structure. String building lets quotes and keywords inside the value become SQL.' },
    { q: 'A load inserts 600 rows and fails on row 601. What protects you from a half-loaded table?', o: ['committing after every row', 'running the load inside one transaction, so the failure rolls everything back', 'using a faster driver', 'using `autocommit=True`'], a: 1, why: 'A transaction is all or nothing. Committing per row or using autocommit would leave the first 600 rows in place.' },
    { q: 'Which is the fastest way to load 1,000,000 rows into PostgreSQL from Python?', o: ['`execute` in a for loop with a commit after each row', 'an f-string with all rows in one huge INSERT', 'COPY (for example `cur.copy(...)` with `write_row`), usually into a staging table', '`fetchall` then insert'], a: 2, why: 'COPY streams the rows in one go and avoids the per-row round trips and parsing. A staging table lets you validate before upserting.' },
    { q: 'What does a connection pool, such as the SQLAlchemy engine, give you?', o: ['it keeps connections open and lends them out, so you do not pay for a new connection on every query', 'it encrypts the password', 'it makes SQL run faster on the server', 'it replaces transactions'], a: 0, why: 'Opening a connection is slow. The pool reuses a few open ones, which is why you create one engine per process and borrow from it.' },
    { q: 'Which database error is reasonable to retry?', o: ['`UniqueViolation` from a duplicate key', '`SyntaxError` in the SQL', '`ForeignKeyViolation` for a missing parent row', 'a dropped connection or a `DeadlockDetected`'], a: 3, why: 'Connection drops and deadlocks are transient and may succeed on retry. Constraint and syntax errors fail again every time.' },
    { q: 'You need the table name to come from a setting. A placeholder `%s` does not work there. What is the safe approach?', o: ['paste it into an f-string', 'use a placeholder anyway', 'validate it against a strict pattern or whitelist, or compose it with `psycopg.sql.Identifier`', 'convert it to upper case'], a: 2, why: 'Placeholders are for values, not names. Names must be validated or quoted safely with an identifier helper.' },
  ],
  task: {
    title: 'A re-runnable GL loader with staging, COPY and an upsert',
    steps: [
      'In `C:\\fde\\py-recap` save `db_lab.py` from the laptop box. Set `$env:APP_DB_PASSWORD` in your PowerShell window, run it, and compare every output line with the lesson. Fix any connection error using the "Common errors" list.',
      'Write `load_gl.py` with a function `load_month(conn, rows)`: create a `stg_gl` staging table (`CREATE TEMP TABLE`), fill it with COPY, then `INSERT ... SELECT ... ON CONFLICT (gl_id) DO UPDATE` into a real `gl_loaded` table, all inside one `with conn.transaction():`.',
      'Make it fail on purpose: add a CHECK constraint `debit >= 0` and put one negative debit in the file. Show that `gl_loaded` is empty after the failed run, and full after fixing the file. Run the load three times and show the count stays 1,227.',
      'Write `build_upsert` (challenge 2) in a module and use it for the upsert statement of three different tables (`fact_gl`, `employees`, `fx_rates`) with the right key columns. Try to pass `"fact_gl; DROP TABLE x"` as a table name and show the `ValueError`.',
      'Read the whole `fact_gl` table with a server-side cursor and compute the total debit per entity in Python without ever holding all rows (a dict of totals). The totals must be 6288358.95, 154012.10 and 245847.69.',
      'Write `sa_lab.py` from the lesson with SQLAlchemy, print `engine.pool.status()` after your queries, and add one `pd.read_sql` with a named parameter (`:entity`) to list the GL lines of one entity.',
    ],
    deliverable: '`db_lab.py` output, `load_gl.py` with the failed-run and re-run proof (row counts), `build_upsert` with its tests, and the streamed totals.',
  },
};
