export default {
  id: 'foundations-file-formats',
  title: 'File formats: CSV, JSON, Excel, Parquet and friends',
  goal: 'You can choose the right file format for a job, avoid the CSV and Excel traps, explain why Parquet beats CSV for analytics, and lay out a partitioned folder for a bronze table.',
  roadmap: ['CSV, JSON, JSON Lines and XML', 'Excel files (.xlsx is a zip of XML)', 'Parquet, ORC and Avro: row-based vs columnar', 'Compression: gzip, snappy, zstd', 'Schema evolution', 'Partitioned folder layouts and the small-files problem'],
  blocks: [
    `## The problem
On one Monday three files arrive. A vendor sends \`payments.xlsx\`. A colleague forwards a JSON download from a government portal. Your data team says: *"Please land it as Parquet."*

A **file format** is an agreement about how the bytes in a file stand for a table. Before you choose one, ask: who reads it (a person in Excel, or a program)? How big will it grow? Will the shape change over time? Will readers want all the columns, or just a few?

## Text formats: CSV, JSON, JSON Lines, XML
You can open a text format in Notepad. That makes it easy to inspect and easy to get wrong.

**CSV** (*comma-separated values*) is one record per line, with fields split by a delimiter. It is the common language of finance exports. But it has no types and no schema: every value is plain text and the reader guesses. The traps:
- **Delimiter.** Some tools write semicolons, tabs (TSV) or pipes.
- **Quoting.** A field with a comma, a quote or a line break must be wrapped in double quotes, and a quote inside it is doubled. Splitting on commas yourself breaks on "Sharma & Sons, Pune". Use a CSV library.
- **Encoding.** Use UTF-8. Excel's "CSV UTF-8" adds an invisible marker, the **BOM** (*byte order mark*), so your first column name becomes \`\\ufeffcode\`. Read UTF-8 bytes as Windows-1252 and the ₹ sign turns to junk.
- **Dates.** \`03/04/2026\` is 3 April in India and 4 March in the US. Write ISO 8601: \`2026-04-03\`.
- **Missing values.** Empty, \`NA\`, \`NULL\` or \`-\`? Agree on one.

**JSON** stores nested, typed data: objects, arrays, text, numbers, true/false and null. Every record repeats its key names, so it is bulky, but it holds what a flat table cannot, such as an invoice with many line items. A **JSON array** must be read in full before you can trust it. **JSON Lines** (\`.jsonl\`, also called NDJSON) puts one complete object on each line: you can append, stream, and cut the file at any newline. Logs and API dumps belong in JSON Lines.

**XML** wraps values in nested tags. It is verbose but strict, and you meet it in Tally exports, bank payment messages (ISO 20022) and older integrations. Python reads it with \`xml.etree.ElementTree\`.

Run the next cell: the 220 Kollana orders in three text layouts, each gzipped.`,
    { py: {
      title: 'The same table as CSV, JSON array and JSON Lines',
      starter: `import gzip
import io
import pandas as pd

orders = pd.read_csv("orders.csv")
print(orders.shape)

csv_text   = orders.to_csv(index=False)                     # header once, then one line per row
json_array = orders.to_json(orient="records")               # [{...}, {...}]  one big array
json_lines = orders.to_json(orient="records", lines=True)   # one JSON object per line

print("--- how each one starts ---")
print(csv_text[:76].replace("\\n", " | "))
print(json_array[:110])
print(json_lines[:110].replace("\\n", " | "))

def gzip_size(text):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0) as f:
        f.write(text.encode("utf-8"))
    return len(buf.getvalue())

print()
print(f"{'format':<12}{'plain':>8}{'gzip':>8}{'gzip is':>9}")
for name, text in [("CSV", csv_text), ("JSON array", json_array), ("JSON Lines", json_lines)]:
    plain = len(text.encode("utf-8"))
    packed = gzip_size(text)
    print(f"{name:<12}{plain:>8}{packed:>8}{packed / plain:>9.0%}")`,
      note: 'Sizes are in bytes. Try orders.head(20) and see how the ratios move. Try adding more columns and watch the JSON grow faster than the CSV.',
      hint: 'JSON repeats every key name in every record; CSV says the names once. gzip is very good at squeezing repeated text.',
    } },
    `JSON is about three times the size of CSV because every key name repeats in all 220 records. After gzip the gap nearly closes, because repeated text is what gzip removes best. JSON array and JSON Lines are the same size to within a byte; the difference is how you read them. Now the traps, with the \`csv\` module.`,
    { py: {
      title: 'CSV traps you will meet',
      starter: `import csv
import io
from datetime import datetime

# 1) A comma and a line break INSIDE a field. Real CSV wraps such a field in double quotes.
raw = (
    'invoice,vendor,narration\\r\\n'
    'INV/001,"Sharma & Sons, Pune","Paid in two parts:\\nadvance + balance"\\r\\n'
    'INV/002,Mehta Traders,"Said ""urgent"" on the email"\\r\\n'
)
print("naive split on commas:", raw.splitlines()[1].split(","))
rows = list(csv.reader(io.StringIO(raw, newline="")))
print("csv module           :", rows[1])
print("quote inside a field :", rows[2][2])

# 2) UTF-8 and the BOM that Excel adds when you choose "CSV UTF-8"
data = '\\ufeffcode,amount\\nA1,"1,36,800"\\n'.encode("utf-8")
print()
print("header read as utf-8     :", repr(data.decode("utf-8").split(",")[0]))
print("header read as utf-8-sig :", repr(data.decode("utf-8-sig").split(",")[0]))
print("rupee sign read as cp1252:", "\\u20b9".encode("utf-8").decode("cp1252"))

# 3) Codes that LOOK like numbers
text = "state_code,hsn,bank_account\\n07,0910,00123456789012\\n"
row = next(csv.DictReader(io.StringIO(text)))
print()
print("as text (csv module):", row)
print("as int              :", {k: int(v) for k, v in row.items()})
account = "123456789012345678"
print("18-digit account through a float:", int(float(account)), "instead of", account)

# 4) Dates: the same text means two different days
d = "03/04/2026"
print()
print("DD/MM:", datetime.strptime(d, "%d/%m/%Y").date(), "| MM/DD:", datetime.strptime(d, "%m/%d/%Y").date())
print("ISO 8601 has only one reading:", datetime.strptime("2026-04-03", "%Y-%m-%d").date())`,
      note: 'The csv module handles quotes and line breaks for you. Splitting on commas does not. The last two blocks show what happens when a code is treated as a number or a date.',
      hint: 'pandas has the same problem: pd.read_csv turns "07" into 7 unless you pass dtype=str for code columns.',
    } },
    { warn: 'Excel changes your data **silently, on open**. A pure-digit code such as an HSN \`0910\`, a state code \`07\` or a cost centre \`00417\` loses its leading zeros. A 16-digit bank account is shown as \`1.23457E+15\`, and Excel keeps only 15 significant digits, so the rest become zeros for good once you save. \`12-05\` can become a date. A GSTIN has letters, so Excel leaves the whole code alone, but the numeric pieces you split from it are not safe. **Rule: identifiers are text, never numbers.** Import with Data > From Text/CSV and set those columns to Text, or do not open the CSV in Excel at all.' },
    `## Excel: a zip of XML
An \`.xlsx\` is not text. It is a **zip archive** (rename it to \`.zip\` and look) of small XML files: sheets, shared strings, styles. Three things follow:
- **A date is a number** (days since 1899-12-30) plus a display style. Text is stored once, in a shared list.
- **A formula cell holds the formula and its last calculated value.** A reader gets the cached value, which is stale if nobody recalculated. A file written by a script has none.
- **Reading needs a library** (pandas uses \`openpyxl\`) and sees what the screen shows: merged cells, a header on row 4, hidden sheets. A sheet stops at 1,048,576 rows.

\`\`\`python
# needs openpyxl: runs on your laptop, not in the browser
df = pd.read_excel("payments.xlsx", sheet_name="Sept", header=3, dtype=str)  # header=3 means row 4; dtype=str keeps codes as text
\`\`\`

Excel is a format for people. Between systems, ask for CSV or JSON. The next cell builds a tiny workbook by hand with the standard library and reads it back, so you see there is no magic.`,
    { py: {
      title: 'An .xlsx is a zip of XML',
      starter: `import io
import zipfile
import xml.etree.ElementTree as ET
from datetime import date, timedelta

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'

# A tiny hand-made workbook: two of the parts a real .xlsx has.
shared = f'<sst {NS}><si><t>gstin</t></si><si><t>invoice_date</t></si><si><t>taxable</t></si><si><t>gst</t></si><si><t>07AAAAA0000A1Z5</t></si></sst>'
serial = (date(2026, 4, 3) - date(1899, 12, 30)).days
sheet = (
    f'<worksheet {NS}><sheetData>'
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>'
    f'<row r="2"><c r="A2" t="s"><v>4</v></c><c r="B2" s="1"><v>{serial}</v></c><c r="C2"><v>100000</v></c>'
    '<c r="D2"><f>C2*0.18</f><v>18000</v></c></row></sheetData></worksheet>'
)
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("xl/worksheets/sheet1.xml", sheet)
    z.writestr("xl/sharedStrings.xml", shared)

# Reading it = unzip + parse XML
z = zipfile.ZipFile(io.BytesIO(buf.getvalue()))
print("inside the file:", z.namelist())
strings = [si.find(M + "t").text for si in ET.fromstring(z.read("xl/sharedStrings.xml"))]
for c in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter(M + "c"):
    raw = c.find(M + "v").text
    value = strings[int(raw)] if c.get("t") == "s" else raw
    f = c.find(M + "f")
    note = "   <- formula " + repr(f.text) + ", value cached" if f is not None else ""
    print(c.get("r"), repr(value), note)

print()
print("B2 is stored as the number", serial, "= date", date(1899, 12, 30) + timedelta(days=serial))`,
      note: 'Cell B2 holds a plain number; only its style (s="1") makes Excel show a date. D2 holds a formula and a cached answer. Change the 18000 to 99 and read it back: the reader trusts the cached value, not the formula.',
      hint: 'A string cell has t="s" and its value is a position in sharedStrings.xml. Any other cell holds the value itself.',
    } },
    `## Binary formats: Avro, Parquet and ORC
Binary files cannot be read in Notepad, but they win on three counts. The **schema is stored in the file**, so nobody guesses. Values keep their **real types**, so a code stored as text cannot lose its zeros. And they are **compressed**.

The OLTP vs OLAP lesson introduced row stores and column stores. The same idea now lives inside files:
- **Avro** is **row-based**: each record is written whole, with the schema in the header. It is quick to write and good at schema changes, and a common format for Kafka messages and landing streams.
- **Parquet** is **columnar** and the default for analytics. Spark, Databricks, Synapse, Snowflake, DuckDB and pandas all read it.
- **ORC** is columnar too, from the Hive world. You meet it in Hive and Trino shops; most new tools favour Parquet.`,
    { sketch: { w: 760, h: 400, caption: 'Same three orders, same information. Only the order of the bytes differs, and that decides what a query must read.', items: [
      { t: 'table', x: 235, y: 44, title: 'orders (3 of 220 rows)', cols: ['order_id', 'channel', 'amount'], colW: [90, 100, 100], rows: [['1', 'Direct', '45000'], ['2', 'Direct', '87400'], ['3', 'Partner', '42275']], fill: 'blue' },
      { t: 'arrow', x1: 300, y1: 162, x2: 190, y2: 192 },
      { t: 'arrow', x1: 460, y1: 162, x2: 570, y2: 192 },
      { t: 'text', x: 190, y: 210, text: 'ROW layout: CSV, JSON Lines, Avro', size: 16, bold: true },
      { t: 'text', x: 570, y: 210, text: 'COLUMN layout: Parquet, ORC', size: 16, bold: true },
      { t: 'line', x1: 380, y1: 190, x2: 380, y2: 342, dashed: true },
      { t: 'box', x: 30, y: 230, w: 320, h: 34, label: '1, Direct, 45000', fill: 'yellow', size: 15 },
      { t: 'box', x: 30, y: 270, w: 320, h: 34, label: '2, Direct, 87400', fill: 'yellow', size: 15 },
      { t: 'box', x: 30, y: 310, w: 320, h: 34, label: '3, Partner, 42275', fill: 'yellow', size: 15 },
      { t: 'box', x: 410, y: 230, w: 320, h: 34, label: 'order_id: 1, 2, 3', fill: 'grey', size: 15 },
      { t: 'box', x: 410, y: 270, w: 320, h: 34, label: 'channel: Direct, Direct, Partner', fill: 'grey', size: 15 },
      { t: 'box', x: 410, y: 310, w: 320, h: 34, label: 'amount: 45000, 87400, 42275', fill: 'green', size: 15 },
      { t: 'note', x: 30, y: 354, w: 320, h: 40, text: 'SUM(amount) reads all 3 rows,\nevery field of each', fill: 'pink' },
      { t: 'note', x: 410, y: 354, w: 320, h: 40, text: 'SUM(amount) reads one strip;\nthe other two are skipped', fill: 'green' },
    ] } },
    `### Inside a Parquet file
A Parquet file is cut into **row groups**, slices of rows (for example 100,000). Inside a row group each column is its own **column chunk**. A **footer** at the end lists the schema and, for every column chunk, the smallest value, the largest value and the null count.

Two ideas make it fast:
1. **Encode, then compress.** A column with three distinct values (Direct, Online, Partner) becomes a tiny dictionary plus small numbers; repeats become "value × count"; growing numbers become differences. Then snappy or zstd squeezes the result.
2. **Skip what you do not need.** *Column pruning*: read only the column chunks the query names. *Predicate push-down*: read the footer first, and if a row group's largest \`order_id\` is below your filter, skip that whole row group.

Parquet files are **immutable**: you write a new file instead of changing a row. That is why Delta and Iceberg keep a log of which files make up a table (see the architecture patterns lesson).`,
    { sketch: { w: 760, h: 345, caption: 'Predicate push-down: the footer says which row groups can possibly match, so most of the file is never read.', items: [
      { t: 'note', x: 20, y: 24, w: 280, h: 50, text: 'SELECT channel, amount FROM orders\nWHERE order_id > 400000', fill: 'pink' },
      { t: 'arrow', x1: 300, y1: 50, x2: 690, y2: 166, label: '1. read the footer first', lx: -100, ly: 22 },
      { t: 'box', x: 14, y: 170, w: 118, h: 70, label: 'group 0', sub: '1-100000', fill: 'grey', size: 15 },
      { t: 'box', x: 138, y: 170, w: 118, h: 70, label: 'group 1', sub: '100001-200000', fill: 'grey', size: 15 },
      { t: 'box', x: 262, y: 170, w: 118, h: 70, label: 'group 2', sub: '200001-300000', fill: 'grey', size: 15 },
      { t: 'box', x: 386, y: 170, w: 118, h: 70, label: 'group 3', sub: '300001-400000', fill: 'grey', size: 15 },
      { t: 'box', x: 510, y: 170, w: 118, h: 70, label: 'group 4', sub: '400001-440000', fill: 'green', size: 15 },
      { t: 'box', x: 646, y: 170, w: 104, h: 70, label: 'footer', sub: 'min/max stats', fill: 'yellow', size: 15 },
      { t: 'mark', x: 73, y: 150, ok: false },
      { t: 'mark', x: 197, y: 150, ok: false },
      { t: 'mark', x: 321, y: 150, ok: false },
      { t: 'mark', x: 445, y: 150, ok: false },
      { t: 'mark', x: 569, y: 150, ok: true },
      { t: 'brace', x: 14, y: 250, w: 490, label: 'skipped: their largest order_id is below 400001', color: '#c2410c' },
      { t: 'brace', x: 510, y: 250, w: 118, label: 'read this one', color: '#2f9e44' },
      { t: 'note', x: 14, y: 304, w: 736, h: 32, text: '2. Inside group 4 only the channel and amount column chunks are fetched: column pruning.', fill: 'green' },
    ] } },
    { pychallenge: {
      id: 'foundations-pych-to-columns',
      prompt: 'Make the column-store idea concrete. Write `to_columns(rows)` that takes a list of dict rows (all rows have the same keys) and returns a dict of column lists: `[{"a": 1, "b": 2}, {"a": 3, "b": 4}]` becomes `{"a": [1, 3], "b": [2, 4]}`. Column order follows the key order of the first row. An empty list gives `{}`. Do not change the input.',
      starter: `def to_columns(rows):
    return {}`,
      tests: `rows = [
    {"order_id": 1, "channel": "Direct", "amount": 45000},
    {"order_id": 2, "channel": "Direct", "amount": 87400},
    {"order_id": 3, "channel": "Partner", "amount": 42275},
]
cols = to_columns(rows)
assert cols == {"order_id": [1, 2, 3], "channel": ["Direct", "Direct", "Partner"], "amount": [45000, 87400, 42275]}
assert list(cols) == ["order_id", "channel", "amount"]
assert sum(cols["amount"]) == 174675       # one strip is enough to add up one column
assert rows[0] == {"order_id": 1, "channel": "Direct", "amount": 45000}   # input untouched
assert to_columns([]) == {}
assert to_columns([{"x": None}]) == {"x": [None]}`,
      solution: `def to_columns(rows):
    if not rows:
        return {}
    return {key: [row[key] for row in rows] for key in rows[0]}`,
      hint: 'Take the keys from rows[0], and for each key collect row[key] over all rows with a list comprehension.',
    } },
    { pychallenge: {
      id: 'foundations-pych-to-rows',
      prompt: 'Now the reverse, which is what a column store does when you ask for whole records. Write `to_rows(columns)` that turns `{"a": [1, 3], "b": [2, 4]}` into `[{"a": 1, "b": 2}, {"a": 3, "b": 4}]`. An empty dict gives `[]`. If the column lists have different lengths, raise `ValueError`.',
      starter: `def to_rows(columns):
    return []`,
      tests: `cols = {"order_id": [1, 2, 3], "channel": ["Direct", "Direct", "Partner"], "amount": [45000, 87400, 42275]}
rows = to_rows(cols)
assert rows == [
    {"order_id": 1, "channel": "Direct", "amount": 45000},
    {"order_id": 2, "channel": "Direct", "amount": 87400},
    {"order_id": 3, "channel": "Partner", "amount": 42275},
]
assert list(rows[0]) == ["order_id", "channel", "amount"]
assert to_rows({}) == []
assert to_rows({"a": [], "b": []}) == []
try:
    to_rows({"a": [1, 2], "b": [1]})
    raise AssertionError('expected an error')
except ValueError:
    pass`,
      solution: `def to_rows(columns):
    if not columns:
        return []
    if len({len(values) for values in columns.values()}) != 1:
        raise ValueError("columns have different lengths")
    names = list(columns)
    return [dict(zip(names, values)) for values in zip(*columns.values())]`,
      hint: 'zip(*columns.values()) walks the columns in step and gives one tuple per row. Pair each tuple with the column names using dict(zip(names, values)).',
    } },
    { local: `**Parquet on your laptop (PowerShell).** Parquet needs \`pyarrow\`, which does not run in the browser. This was tested with pandas 2.3 and pyarrow 25. Open a folder that holds \`orders.csv\` (export the orders table from the playground data), then:
\`\`\`powershell
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install pandas pyarrow
\`\`\`
Save this as \`parquet_lab.py\` next to the CSV and run \`python parquet_lab.py\`:
\`\`\`python
import os
import pandas as pd
import pyarrow.parquet as pq

df = pd.read_csv("orders.csv")
big = pd.concat([df] * 2000, ignore_index=True)        # 440,000 rows, so the effect is visible
big["order_id"] = range(1, len(big) + 1)
big.to_csv("big.csv", index=False)
big.to_parquet("big_snappy.parquet", compression="snappy", row_group_size=100_000)
big.to_parquet("big_zstd.parquet", compression="zstd", row_group_size=100_000)
for f in ["big.csv", "big_snappy.parquet", "big_zstd.parquet"]:
    print(f"{f:<20}{os.path.getsize(f):>12,} bytes")

only = pd.read_parquet("big_snappy.parquet", columns=["channel", "amount"])
print("column pruning ->", only.shape)

recent = pd.read_parquet("big_snappy.parquet", filters=[("order_id", ">", 400000)])
print("push-down      ->", recent.shape)

meta = pq.ParquetFile("big_snappy.parquet").metadata
print(meta.num_rows, "rows in", meta.num_row_groups, "row groups")
for g in range(meta.num_row_groups):
    s = meta.row_group(g).column(0).statistics      # column 0 = order_id
    print(f"  row group {g}: order_id min {s.min}, max {s.max}")

big["load_date"] = "2026-09-30"
big.to_parquet("bronze/orders", partition_cols=["load_date"])
for root, dirs, files in os.walk("bronze"):
    print(root, files)
\`\`\`
**Output to expect** (sizes differ by a few percent between versions; the order of magnitude is the point, and repeated rows compress better than real data):
\`\`\`text
big.csv               20,984,965 bytes
big_snappy.parquet     2,822,025 bytes
big_zstd.parquet       1,392,791 bytes
column pruning -> (440000, 2)
push-down      -> (40000, 8)
440000 rows in 5 row groups
  row group 0: order_id min 1, max 100000
  row group 1: order_id min 100001, max 200000
  row group 2: order_id min 200001, max 300000
  row group 3: order_id min 300001, max 400000
  row group 4: order_id min 400001, max 440000
bronze []
bronze\\orders []
bronze\\orders\\load_date=2026-09-30 ['91620622d8da44f89210647ee784a455-0.parquet']
\`\`\`
The file name is a random id, yours will differ. On the original 220-row file Parquet is hardly smaller than the CSV, because the footer is a large share of a tiny file. Columnar formats pay off with volume.` },
    `## Schema evolution
Sources change: a vendor adds a column, renames \`Amt\` to \`Amount\`, or sends text where numbers were. **Schema evolution** is how well a format and its readers survive that.

| Change | CSV / JSON | Avro | Parquet |
|---|---|---|---|
| Add a column | Nothing checks; readers must cope | Safe with a default | Safe: old files give NULL |
| Rename a column | Breaks readers using the old name | Safe with an alias | Seen as drop plus add |
| Change a type | Silent until a cast fails | Only safe widening, such as int to long | Risky across files: rewrite or cast |

Adding an optional column is safe; renaming or retyping is breaking. Treat a rename as "add the new name, keep the old one for a while, remove it later", and agree it in the data contract (see the governance lesson).

## Compression
Compression trades CPU time for smaller files. **gzip** is small but slow, and one big \`.csv.gz\` is read from the start by one worker, so it cannot be split for parallel reads. **snappy** is very fast and medium in size, long the default inside Parquet. **zstd** is small, close to gzip or better, and fast: increasingly the best all-round pick. Parquet compresses each column chunk separately, so workers read different row groups in parallel. Compression is a setting, not a format; check the default of the tool you use.

## Folders, partitions and the small-files problem
A lake is folders of files, so the folder layout is part of the design. **Hive-style partitioning** puts a column and its value in the folder name, as \`load_date=2026-09-30\`. The engine reads the value from the path and, when your query filters on it, opens only the matching folder: *partition pruning*.`,
    { sketch: { w: 760, h: 330, caption: 'A filter on the partition column opens one folder. Fewer, bigger files beat thousands of tiny ones.', items: [
      { t: 'box', x: 14, y: 106, w: 150, h: 50, label: 'bronze/orders/', fill: 'blue', size: 15 },
      { t: 'note', x: 14, y: 196, w: 170, h: 70, text: "WHERE load_date =\n'2026-09-30'\nopens ONE folder", fill: 'pink' },
      { t: 'box', x: 220, y: 28, w: 230, h: 56, label: 'load_date=2026-09-29/', sub: 'skipped, never opened', fill: 'grey', size: 15 },
      { t: 'box', x: 220, y: 108, w: 230, h: 56, label: 'load_date=2026-09-30/', sub: 'opened', fill: 'green', size: 15 },
      { t: 'box', x: 220, y: 188, w: 230, h: 56, label: 'load_date=2026-10-01/', sub: 'skipped, never opened', fill: 'grey', size: 15 },
      { t: 'line', x1: 164, y1: 131, x2: 220, y2: 56, dashed: true },
      { t: 'arrow', x1: 164, y1: 131, x2: 220, y2: 136 },
      { t: 'line', x1: 164, y1: 131, x2: 220, y2: 216, dashed: true },
      { t: 'doc', x: 500, y: 36, w: 110, h: 40, label: 'part-0001', fill: 'grey' },
      { t: 'doc', x: 630, y: 36, w: 110, h: 40, label: 'part-0002', fill: 'grey' },
      { t: 'doc', x: 500, y: 116, w: 110, h: 40, label: 'part-0001', fill: 'green' },
      { t: 'doc', x: 630, y: 116, w: 110, h: 40, label: 'part-0002', fill: 'green' },
      { t: 'doc', x: 500, y: 196, w: 110, h: 40, label: 'part-0001', fill: 'grey' },
      { t: 'line', x1: 450, y1: 56, x2: 500, y2: 56, dashed: true },
      { t: 'arrow', x1: 450, y1: 136, x2: 500, y2: 136 },
      { t: 'line', x1: 450, y1: 216, x2: 500, y2: 216, dashed: true },
      { t: 'note', x: 220, y: 270, w: 520, h: 48, text: 'Too many tiny files (a file a minute is 1,440 a day) hurts:\nthe engine spends its time listing and opening, not reading.', fill: 'yellow' },
    ] } },
    `Two rules keep this healthy:
- **Partition by what you filter on, with few distinct values.** A load date is good; \`order_id\` would make a folder per order.
- **Avoid the small-files problem.** Every file costs a listing, an open and a footer read. A job writing a file a minute leaves 1,440 files a day, and queries spend their time on bookkeeping. Aim for files of tens to hundreds of megabytes (check your engine's advice) and **compact** small files into bigger ones on a schedule.

## Which format when
| You need to... | Use | Why |
|---|---|---|
| Hand a table to someone using Excel | CSV in UTF-8, or xlsx | The reader is human |
| Exchange data with a vendor or bank | CSV with a header and a written spec, or JSON | Everyone can make it; the spec protects you |
| Call or answer an API | JSON | Nested, typed, universal |
| Collect logs or API dumps | JSON Lines, gzipped | Append a line; split anywhere |
| Pass Kafka messages with changing schemas | Avro | Compact, schema travels along |
| Store silver and gold tables in the lake | Parquet (snappy or zstd), often in Delta or Iceberg | Columnar, typed, fast to scan |
| Talk to Tally or ISO 20022 bank systems | XML | The other side dictates it |
| Keep a replayable raw copy | The file exactly as received | Bronze fixes nothing on the way in |`,
    { interview: `**"Why is Parquet faster than CSV for analytics?"** Model answer: "Four reasons. First, it is columnar, so a query that needs three columns out of forty reads only those chunks (column pruning). Second, the footer keeps min and max per row group and the folders carry partition values, so the engine skips row groups and files that cannot match (predicate push-down). Third, each column is dictionary-encoded and compressed, so the file is much smaller and there is less to read from disk. Fourth, values are stored with real types, so the reader does not parse text or guess. The costs: it is not human-readable, files are immutable so updates mean rewrites, single-row lookups are poor, and thousands of tiny files erase the gains." Follow-up: "When would you not use Parquet?" Answer: small hand-edited files, one-row-at-a-time writes, and exchange with people.` },
    { real: `Your GST reconciliation receives a supplier JSON download (one invoice with many items, nested) and a purchase register CSV from SAP. Land both **untouched** in bronze, in folders like \`bronze/gstr2b/load_date=2026-09-30/\`. Build silver as Parquet with the types fixed: GSTIN and invoice number as text, invoice date as a date, amounts as decimals. Never let an identifier pass through a number type or through Excel. Check which download formats the portal offers today; they change.` },
    `## Recap
- **CSV** has no types, so quoting, delimiters, UTF-8 and the BOM, ambiguous dates and number-like codes all bite. Treat identifiers as text; write dates as ISO 8601.
- **JSON** is nested and typed but repeats key names; **JSON Lines** suits logs and landing files. **XML** survives in Tally and bank messages. **Excel** is a zip of XML for people, with cached formulas and silent reformatting.
- **Avro** is row-based binary; **Parquet** and **ORC** are columnar. Parquet's footer, encodings, column pruning and predicate push-down make scans fast.
- Adding an optional column is a safe schema change; renames and type changes are breaking. gzip is small but slow, snappy fast, zstd a strong all-rounder.
- Partition folders like \`load_date=2026-09-30\` let engines skip data. Avoid thousands of tiny files: compact them.`,
  ],
  quiz: [
    { q: 'A CSV field holds Sharma & Sons, Pune with a comma inside the name. How must it be written?', o: ['With the comma removed', 'Wrapped in double quotes', 'With a backslash before the comma', 'In a separate file'], a: 1, why: 'A field containing a comma, a quote or a line break is wrapped in double quotes. A CSV library does this for you; splitting on commas yourself breaks.' },
    { q: 'Excel opens a column of HSN codes and shows 0910 as 910. What is the right defence?', o: ['Use a bigger font', 'Treat identifiers as text and import the column as Text', 'Save the file as xlsx', 'Add a formula'], a: 1, why: 'Codes are labels, not quantities. Once a column is read as a number the leading zero is gone. Keep identifiers as text everywhere.' },
    { q: 'Which format puts one complete JSON object on each line, so you can append and stream it?', o: ['A JSON array', 'XML', 'JSON Lines', 'Parquet'], a: 2, why: 'JSON Lines (NDJSON) has one object per line. A single JSON array has to be read in full first.' },
    { q: 'How does predicate push-down skip data in a Parquet file?', o: ['It deletes old rows', 'It sorts the file', 'It compresses with gzip', 'It reads the footer min and max per row group and skips groups that cannot match'], a: 3, why: 'The footer stores min, max and null counts for every column chunk of every row group, so a row group whose maximum is below your filter is never read.' },
    { q: 'Which schema change is usually safe for existing readers?', o: ['Adding an optional column with a default', 'Renaming a column', 'Changing a text column to a number', 'Reordering columns in a CSV read by position'], a: 0, why: 'A new optional column can be filled with a default or NULL for old data. Renames and type changes break readers and need a plan.' },
    { q: 'What is the small-files problem?', o: ['Files that are too small to open in Excel', 'Thousands of tiny files make the engine spend its time listing and opening them; compact them into fewer, bigger files', 'Parquet cannot store small tables', 'Snappy fails on small data'], a: 1, why: 'Each file costs a listing, an open and a footer read. A job writing a file a minute leaves 1,440 files a day; compaction fixes it.' },
  ],
  task: {
    title: 'Convert, compare and lay out',
    steps: [
      'Create a folder and a virtual environment, install pandas and pyarrow, and run the parquet_lab.py script from the laptop callout. Compare your three file sizes with the expected output.',
      'Read only the `amount` column from the Parquet file and sum it. Then do the same from `big.csv` with `usecols=["amount"]` and time both with `time.perf_counter()`. Write down what you see.',
      'Create a small CSV with a column of codes such as `07`, `0910` and `00123456789012`. Open it in Excel, save it, and reopen it in Notepad. Note exactly what changed. Then read the original in Python with `dtype=str`.',
      'Pick three real files from your job (no client names). For each, write the format you would choose for bronze and for silver, and one sentence of why.',
    ],
    deliverable: 'A one-page note: the three file sizes from your run, what Excel did to your codes, and a three-row table (file, bronze format, silver format, reason).',
  },
};
