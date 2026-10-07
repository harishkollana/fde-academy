export default {
  id: 'pandas-parquet-arrow',
  title: 'Parquet and Arrow: typed, compressed, columnar files',
  goal: 'You can explain why Parquet beats CSV for data work, write and read Parquet with pandas and pyarrow (compression, column selection, row filters), read the schema and the file statistics without loading the data, store money as an exact decimal type, and write a partitioned dataset that you can reload safely.',
  roadmap: ['read and write Parquet', 'partitioned datasets', 'compression', 'schema', 'Arrow'],
  blocks: [
    `## The problem
CSV is how files travel between people and systems, and it is also why data pipelines get slow and wrong. A CSV has **no types** (is \`007\` text or the number 7?), **no schema** (a column can move and nothing complains), and it is **text**: the number \`130833.18\` takes nine bytes. It is read **row by row**, so a 5 GB file must be parsed from the first byte even when you want one column. Every consumer guesses the types again, and guesses differently.

**Parquet** is the file format that data engineering uses instead. It stores data **column by column**, with **types and a schema inside the file**, **compression**, and **statistics** that let a reader skip parts of the file. **Arrow** is its in-memory twin: the same column layout in RAM, shared by pandas, Spark, DuckDB, Polars and most cloud data tools. When your Azure pipeline lands raw CSV and the next layer (the "silver" layer of the medallion pattern you met earlier) is Parquet, this is the format they mean. This lesson teaches you to use it from pandas and to read what is inside.`,
    `## Row files and column files
A CSV, an Excel sheet and a database row store are **row-oriented**: all the values of row 1, then all the values of row 2. Parquet is **column-oriented**: all the values of column 1, then all the values of column 2. For analysis that is a big difference:

- **You read only the columns you ask for.** "Total debit" touches the \`debit\` column and nothing else. A row file has to read the whole file to find the debit values between the other fields.
- **Neighbours have the same type**, so they compress well: a column with a few distinct values (a currency, an entity) is stored as a small dictionary plus small codes, and numbers are stored as binary, not as text.
- **Types and statistics are stored**, so a reader never has to guess, and it can skip data that cannot match a filter.

The price: a Parquet file is binary (you cannot open it in Notepad), it is written once and not edited in place, and it has a **fixed overhead** for the schema and the footer. A tiny table can be *bigger* as Parquet than as CSV. It pays for itself with volume.`,
    { sketch: { w: 760, h: 330, caption: 'The same 12 values laid out two ways: a CSV keeps rows together, Parquet keeps each column together, so a query on one column can read one block', items: [
      { t: 'text', x: 40, y: 22, text: 'CSV: row by row, the order of the bytes in the file', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 40, y: 38, w: 54, h: 32, fill: 'blue', label: '1', size: 14 },
      { t: 'box', x: 96, y: 38, w: 54, h: 32, fill: 'green', label: '1', size: 14 },
      { t: 'box', x: 152, y: 38, w: 54, h: 32, fill: 'orange', label: '0', size: 14 },
      { t: 'box', x: 208, y: 38, w: 54, h: 32, fill: 'blue', label: '2', size: 14 },
      { t: 'box', x: 264, y: 38, w: 54, h: 32, fill: 'green', label: '1', size: 14 },
      { t: 'box', x: 320, y: 38, w: 54, h: 32, fill: 'orange', label: '500', size: 14 },
      { t: 'box', x: 376, y: 38, w: 54, h: 32, fill: 'blue', label: '3', size: 14 },
      { t: 'box', x: 432, y: 38, w: 54, h: 32, fill: 'green', label: '2', size: 14 },
      { t: 'box', x: 488, y: 38, w: 54, h: 32, fill: 'orange', label: '0', size: 14 },
      { t: 'box', x: 544, y: 38, w: 54, h: 32, fill: 'blue', label: '4', size: 14 },
      { t: 'box', x: 600, y: 38, w: 54, h: 32, fill: 'green', label: '2', size: 14 },
      { t: 'box', x: 656, y: 38, w: 54, h: 32, fill: 'orange', label: '250', size: 14 },
      { t: 'brace', x: 40, y: 76, w: 670, label: 'SUM(debit): the reader has to go through the whole file', color: '#c0392b' },
      { t: 'text', x: 40, y: 168, text: 'Parquet: column by column', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 40, y: 184, w: 54, h: 32, fill: 'blue', label: '1', size: 14 },
      { t: 'box', x: 96, y: 184, w: 54, h: 32, fill: 'blue', label: '2', size: 14 },
      { t: 'box', x: 152, y: 184, w: 54, h: 32, fill: 'blue', label: '3', size: 14 },
      { t: 'box', x: 208, y: 184, w: 54, h: 32, fill: 'blue', label: '4', size: 14 },
      { t: 'box', x: 264, y: 184, w: 54, h: 32, fill: 'green', label: '1', size: 14 },
      { t: 'box', x: 320, y: 184, w: 54, h: 32, fill: 'green', label: '1', size: 14 },
      { t: 'box', x: 376, y: 184, w: 54, h: 32, fill: 'green', label: '2', size: 14 },
      { t: 'box', x: 432, y: 184, w: 54, h: 32, fill: 'green', label: '2', size: 14 },
      { t: 'box', x: 488, y: 184, w: 54, h: 32, fill: 'orange', label: '0', size: 14 },
      { t: 'box', x: 544, y: 184, w: 54, h: 32, fill: 'orange', label: '500', size: 14 },
      { t: 'box', x: 600, y: 184, w: 54, h: 32, fill: 'orange', label: '0', size: 14 },
      { t: 'box', x: 656, y: 184, w: 54, h: 32, fill: 'orange', label: '250', size: 14 },
      { t: 'brace', x: 488, y: 222, w: 222, label: 'SUM(debit): reads only this block', color: '#2f9e44' },
      { t: 'text', x: 40, y: 290, text: 'blue = gl_id,   green = entity_id,   orange = debit', size: 15, anchor: 'start' },
    ] } },
    `## Inside a Parquet file
A Parquet file is built in layers, and knowing them explains every option you will meet:

- The data is cut into **row groups** (in real files, many thousand or million rows each).
- Inside a row group, every column has its own **column chunk**, compressed on its own.
- The **footer**, at the end of the file, holds the **schema** (column names and types), where every chunk is, and **statistics for each chunk**: the minimum, the maximum and the number of nulls.

A reader opens the footer first. For a query such as "posting date on or after 1 March 2026" it compares the filter with the min and max of each row group and **skips the groups that cannot contain a match**, without reading their data. This is **predicate pushdown**, and it is why a filter on a Parquet file can be much faster than a filter after loading everything. Combined with reading only the columns you need (**projection**), a query touches a small part of the file.`,
    { sketch: { w: 760, h: 342, caption: 'Row-group statistics in the footer let the reader skip groups: here a filter for March 2026 onwards never opens groups 0, 1 and 2', items: [
      { t: 'text', x: 14, y: 26, text: 'filter: posting_date >= 2026-03-01', size: 17, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 46, w: 430, h: 44, fill: 'grey', label: 'row group 0   (300 rows)', sub: 'posting_date 2025-04-01 to 2025-06-28', size: 15 },
      { t: 'box', x: 14, y: 98, w: 430, h: 44, fill: 'grey', label: 'row group 1   (300 rows)', sub: 'posting_date 2025-06-16 to 2025-09-26', size: 15 },
      { t: 'box', x: 14, y: 150, w: 430, h: 44, fill: 'grey', label: 'row group 2   (300 rows)', sub: 'posting_date 2025-09-01 to 2025-12-28', size: 15 },
      { t: 'box', x: 14, y: 202, w: 430, h: 44, fill: 'green', label: 'row group 3   (300 rows)', sub: 'posting_date 2025-12-01 to 2026-03-27', size: 15 },
      { t: 'box', x: 14, y: 254, w: 430, h: 44, fill: 'green', label: 'row group 4   (27 rows)', sub: 'posting_date 2025-04-10 to 2026-03-27', size: 15 },
      { t: 'mark', x: 478, y: 68, ok: false },
      { t: 'mark', x: 478, y: 120, ok: false },
      { t: 'mark', x: 478, y: 172, ok: false },
      { t: 'mark', x: 478, y: 224, ok: true },
      { t: 'mark', x: 478, y: 276, ok: true },
      { t: 'text', x: 500, y: 68, text: 'skip', size: 15, anchor: 'start' },
      { t: 'text', x: 500, y: 120, text: 'skip', size: 15, anchor: 'start' },
      { t: 'text', x: 500, y: 172, text: 'skip', size: 15, anchor: 'start' },
      { t: 'text', x: 500, y: 224, text: 'read', size: 15, anchor: 'start' },
      { t: 'text', x: 500, y: 276, text: 'read', size: 15, anchor: 'start' },
      { t: 'note', x: 568, y: 46, w: 182, h: 170, fill: 'yellow', size: 13, text: 'FOOTER\n(read first)\n\nschema: names\nand types\n\nper column chunk:\nmin, max, nulls\n\nthe reader decides\nwhat to skip here' },
      { t: 'note', x: 568, y: 228, w: 182, h: 70, fill: 'blue', size: 13, text: 'Group 4 has dates all\nover the year, so its\nrange cannot rule it out.' },
    ] } },
    `## Writing and reading with pandas
\`\`\`python
df.to_parquet("lake/fact_gl.parquet", compression="zstd", index=False)
df = pd.read_parquet("lake/fact_gl.parquet")
df = pd.read_parquet(path, columns=["entity_id", "debit"])          # projection: only these columns
df = pd.read_parquet(path, filters=[("entity_id", "==", 1)])        # predicate: only matching rows
\`\`\`

- **\`index=False\`** keeps the row numbers out of the file. Without it a non-default index is stored as a column.
- **Compression:** \`snappy\` (the default) is fast, \`gzip\` and \`zstd\` make smaller files, and \`zstd\` is a good general choice. Measure on your own data: it depends on the columns.
- **Types are stored**, so convert before you write: parse dates with \`to_datetime\`, keep IDs as text or integers. The playground shows the round trip: a CSV forgets that a column was a date, Parquet does not.
- **Mixed-type columns cannot be written.** A column that holds numbers and text raises \`ArrowInvalid\`. That is a gift: the cleaning lesson's job is to fix it before it reaches the lake.
- \`filters=[(column, operator, value)]\` takes \`==\`, \`!=\`, \`<\`, \`<=\`, \`>\`, \`>=\`, \`in\` and \`not in\`. Several tuples in the list are combined with AND.
- pandas reads and writes Parquet through the \`pyarrow\` package (or \`fastparquet\`). On your laptop you installed it in the first pandas task.`,
    { py: {
      title: 'CSV against Parquet: four compression settings, types that survive, columns and filters',
      starter: `import os
import shutil
import pandas as pd
pd.set_option("display.width", 120)

gl = pd.read_csv("fact_gl.csv")
gl["posting_date"] = pd.to_datetime(gl["posting_date"])         # a real date: Parquet keeps the type

shutil.rmtree("lake_demo", ignore_errors=True)
os.makedirs("lake_demo")
csv_bytes = os.path.getsize("fact_gl.csv")

# 1) the same table with four compression settings
print(f"{'file':<22}{'bytes':>10}{'smaller than csv':>20}")
print(f"{'fact_gl.csv':<22}{csv_bytes:>10,}")
for codec in ["none", "snappy", "gzip", "zstd"]:
    path = f"lake_demo/gl_{codec}.parquet"
    gl.to_parquet(path, compression=None if codec == "none" else codec, index=False)
    size = os.path.getsize(path)
    print(f"{'gl_' + codec + '.parquet':<22}{size:>10,}{csv_bytes / size:>19.1f}x")

# 2) types survive: a CSV forgets that posting_date was a date, Parquet does not
back = pd.read_parquet("lake_demo/gl_zstd.parquet")
print("posting_date read from the CSV    :", pd.read_csv("fact_gl.csv")["posting_date"].dtype)
print("posting_date read from the Parquet:", back["posting_date"].dtype)
pd.testing.assert_frame_equal(gl, back)
print("the Parquet round trip returns exactly the same table")

# 3) read only the columns you need, and let the file skip what you do not need
slim = pd.read_parquet("lake_demo/gl_zstd.parquet", columns=["entity_id", "debit"])
print("two columns:", slim.shape)
one_entity = pd.read_parquet("lake_demo/gl_zstd.parquet", filters=[("entity_id", "==", 1)])
print("filter entity_id == 1:", len(one_entity), "rows | pandas count:", int((gl["entity_id"] == 1).sum()))
shutil.rmtree("lake_demo")`,
      note: 'Parquet is smaller than the CSV even for this small table, and gzip and zstd are smaller than snappy. The sizes differ a little between pyarrow versions, so compare the pattern, not the exact bytes. Try `compression="brotli"` too. The round-trip check at the end is the habit: write, read back, compare.',
    } },
    { py: {
      title: 'Inside the file: schema, row groups and statistics, read from the footer',
      starter: `import os
import shutil
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
pd.set_option("display.width", 120)

gl = pd.read_csv("fact_gl.csv")
gl["posting_date"] = pd.to_datetime(gl["posting_date"])
shutil.rmtree("lake_demo", ignore_errors=True)
os.makedirs("lake_demo")
path = "lake_demo/gl.parquet"

# small row groups so that a 1,227-row file has several (real files use far bigger groups)
pq.write_table(pa.Table.from_pandas(gl, preserve_index=False), path, row_group_size=300, compression="zstd")

# 1) the schema is stored in the file
print(pq.read_schema(path).remove_metadata())

# 2) the footer: sizes and statistics, read without reading the data
meta = pq.ParquetFile(path).metadata
print("rows:", meta.num_rows, "| columns:", meta.num_columns, "| row groups:", meta.num_row_groups)
date_col = meta.schema.names.index("posting_date")
print(f"{'group':<7}{'rows':>6}   {'first date':<12}{'last date':<12}")
spans = []
for i in range(meta.num_row_groups):
    stats = meta.row_group(i).column(date_col).statistics
    spans.append((stats.min, stats.max))
    print(f"{i:<7}{meta.row_group(i).num_rows:>6}   {stats.min:%Y-%m-%d}  {stats.max:%Y-%m-%d}")

# 3) predicate pushdown: which groups can a filter skip, using only these statistics?
cutoff = pd.Timestamp("2026-03-01")
to_read = [i for i, (low, high) in enumerate(spans) if high >= cutoff]
skipped = [i for i in range(len(spans)) if i not in to_read]
print("filter posting_date >=", cutoff.date(), "| groups to read:", to_read, "| groups skipped:", skipped)
hit = pq.read_table(path, filters=[("posting_date", ">=", cutoff)])
print("rows returned:", hit.num_rows, "| rows counted by pandas:", int((gl["posting_date"] >= cutoff).sum()))
shutil.rmtree("lake_demo")`,
      note: 'The five groups hold 300, 300, 300, 300 and 27 rows. Groups 0, 1 and 2 end before March 2026, so a reader skips them using only the footer. Group 4 has dates from April to March, so its range cannot rule it out: statistics help most when the data is **sorted** by the column you filter on.',
    } },
    `## Schema, types and exact money
The **schema** is the list of column names and types stored in the footer: \`int64\`, \`double\`, \`string\`, \`timestamp[ns]\`, \`date32\`, \`bool\`, \`decimal128(18, 2)\` and more. \`pq.read_schema(path)\` shows it without reading any data, which makes it a cheap check on a file that arrived from somewhere else: **has a column been renamed, or has an amount turned into text?**

**Money.** A \`double\` is a binary fraction, so \`0.1 + 0.2\` is not exactly \`0.3\`. For a ledger or a bank file, store money as **\`decimal128(18, 2)\`**: 18 digits in total, 2 after the point, exact. With pyarrow you cast a rounded column: \`pc.cast(pc.round(table["debit"], 2), pa.decimal128(18, 2))\`. Back in pandas, a decimal column becomes a column of Python \`Decimal\` objects (or an Arrow dtype if you ask for \`types_mapper=pd.ArrowDtype\`). Doubles are fine for analysis; decimals are for books you must tie out to the paisa.

**Arrow in memory.** A \`pyarrow.Table\` is the same columns in RAM. \`pa.Table.from_pandas(df)\` and \`table.to_pandas()\` convert in both directions, and \`pyarrow.compute\` (\`pc.sum\`, \`pc.filter\`, \`pc.equal\` …) works on the table directly, without pandas. A table is also usually smaller than the pandas version: strings are stored once in a compact block, not as one Python object per cell.`,
    { py: {
      title: 'Money as decimal128, computing on an Arrow table, and the type after a round trip',
      starter: `from decimal import Decimal
import os
import shutil
import pandas as pd
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq

gl = pd.read_csv("fact_gl.csv")

# 1) floats are binary: 0.1 + 0.2 is not exactly 0.3. A decimal type keeps rupees and paise exact
print("float64 :", repr(float(pd.Series([0.1, 0.2]).sum())))
exact = pa.array([Decimal("0.10"), Decimal("0.20")], type=pa.decimal128(18, 2))
print("decimal :", pc.sum(exact).as_py(), "| type:", exact.type)

# 2) a pandas table becomes an Arrow table; the money columns are cast to decimal128(18, 2)
table = pa.Table.from_pandas(gl, preserve_index=False)
print("debit type before:", table.schema.field("debit").type)
for col in ["debit", "credit"]:
    idx = table.schema.get_field_index(col)
    table = table.set_column(idx, col, pc.cast(pc.round(table[col], 2), pa.decimal128(18, 2)))
print("debit type after :", table.schema.field("debit").type)

# 3) compute on the Arrow table without pandas
entity1 = pc.filter(table["debit"], pc.equal(table["entity_id"], 1))
print("entity 1 debit total:", pc.sum(entity1).as_py())
print("pandas says         :", round(gl.loc[gl["entity_id"] == 1, "debit"].sum(), 2))

# 4) write it, read it back: the type is stored in the file
shutil.rmtree("lake_demo", ignore_errors=True)
os.makedirs("lake_demo")
pq.write_table(table, "lake_demo/gl_money.parquet", compression="zstd")
back = pq.read_table("lake_demo/gl_money.parquet")
print("type after reading:", back.schema.field("debit").type)
as_pandas = back.to_pandas()
print("in pandas          :", type(as_pandas["debit"].iloc[1]).__name__, as_pandas["debit"].iloc[1])
print("with Arrow dtypes  :", str(back.to_pandas(types_mapper=pd.ArrowDtype)["debit"].dtype))

# 5) in memory, the Arrow table is more compact than the pandas columns
print("arrow table bytes:", table.nbytes, "| pandas bytes (deep):", int(gl.memory_usage(deep=True).sum()))
shutil.rmtree("lake_demo")`,
      note: 'The decimal total and the pandas total agree here, but only because pandas rounded: the decimal type needs no rounding to be exact. In pandas the decimal column holds `Decimal` objects, which are exact but slow for big maths. Use decimals at the edges (files, ledgers) and float64 inside heavy analysis.',
    } },
    `## Partitioned datasets
One file is fine for a small table. A big table is written as a **dataset**: a folder of many files, split by the values of one or more columns. \`df.to_parquet(root, partition_cols=["entity_id"])\` creates:

\`\`\`text
gl/
  entity_id=1/ 3b6f…-0.parquet
  entity_id=2/ 91ac…-0.parquet
  entity_id=3/ f07d…-0.parquet
\`\`\`

The partition value moves **out of the file and into the folder name**. When you read the folder, pandas puts it back as a column (dtype \`category\`). A filter on the partition column, \`filters=[("entity_id", "==", 2)]\`, is **partition pruning**: the other folders are never opened.

How to choose partition columns:
- Partition by the column you **filter on most** and that has **few distinct values**: month, entity, country. **Never** by an ID (a million folders) or a timestamp.
- Do not over-partition. Each file has overhead, so many tiny files are slow: this is the **small-files problem**. Entity times month gave 36 files for 1,227 rows in the playground, which is silly for a table this size and normal for crores of rows.
- Keep **one schema** across all files of a dataset.

**The trap: writing again adds files.** Each write creates new files with random names in the same folders. Running a monthly load twice leaves every row **twice**, with no error. Make the load **idempotent**: delete the partition you are about to write (or write to a fresh folder and swap), so the same run can be repeated safely.`,
    { sketch: { w: 760, h: 322, caption: 'A partitioned dataset is a folder tree: the partition value is in the folder name, and a filter on it opens only the matching folder', items: [
      { t: 'text', x: 14, y: 24, text: 'pd.read_parquet(root, filters=[("entity_id", "==", 2)])', font: 'mono', size: 13, anchor: 'start', bold: true },
      { t: 'box', x: 14, y: 132, w: 110, h: 46, fill: 'blue', label: 'gl/', size: 18 },
      { t: 'box', x: 196, y: 50, w: 190, h: 46, fill: 'grey', label: 'entity_id=1', size: 16 },
      { t: 'box', x: 196, y: 132, w: 190, h: 46, fill: 'green', label: 'entity_id=2', size: 16 },
      { t: 'box', x: 196, y: 214, w: 190, h: 46, fill: 'grey', label: 'entity_id=3', size: 16 },
      { t: 'arrow', x1: 126, y1: 148, x2: 192, y2: 76 },
      { t: 'arrow', x1: 126, y1: 155, x2: 192, y2: 155 },
      { t: 'arrow', x1: 126, y1: 162, x2: 192, y2: 234 },
      { t: 'doc', x: 450, y: 48, w: 140, h: 50, fill: 'grey', label: '3b6f-0.parquet' },
      { t: 'doc', x: 450, y: 130, w: 140, h: 50, fill: 'green', label: '91ac-0.parquet' },
      { t: 'doc', x: 450, y: 212, w: 140, h: 50, fill: 'grey', label: 'f07d-0.parquet' },
      { t: 'arrow', x1: 388, y1: 73, x2: 446, y2: 73 },
      { t: 'arrow', x1: 388, y1: 155, x2: 446, y2: 155 },
      { t: 'arrow', x1: 388, y1: 237, x2: 446, y2: 237 },
      { t: 'mark', x: 642, y: 74, ok: false },
      { t: 'mark', x: 642, y: 156, ok: true },
      { t: 'mark', x: 642, y: 238, ok: false },
      { t: 'text', x: 664, y: 74, text: 'pruned', size: 15, anchor: 'start' },
      { t: 'text', x: 664, y: 156, text: 'read', size: 15, anchor: 'start' },
      { t: 'text', x: 664, y: 238, text: 'pruned', size: 15, anchor: 'start' },
      { t: 'note', x: 14, y: 282, w: 732, h: 32, fill: 'yellow', size: 14, text: 'The partition value lives in the folder name, not in the file. Folders that cannot match are never opened.' },
    ] } },
    { py: {
      title: 'A partitioned dataset: folders, pruning, many small files, and the duplicate-on-rerun trap',
      starter: `import os
import shutil
import pandas as pd
pd.set_option("display.width", 120)

gl = pd.read_csv("fact_gl.csv")
gl["posting_date"] = pd.to_datetime(gl["posting_date"])
gl["month"] = gl["posting_date"].dt.strftime("%Y-%m")
root = "lake_demo/gl"
shutil.rmtree("lake_demo", ignore_errors=True)

# 1) one folder per entity: the partition value moves out of the file and into the folder name
gl.to_parquet(root, partition_cols=["entity_id"], index=False)
folders = sorted(os.listdir(root))
print(folders)
print(folders[0], "->", len(os.listdir(os.path.join(root, folders[0]))), "file(s)")

# 2) reading the folder returns the whole table; the partition column comes back as a category
everything = pd.read_parquet(root)
print(everything.shape, "| entity_id dtype:", everything["entity_id"].dtype)

# 3) a filter on the partition column opens only the matching folder
only_sg = pd.read_parquet(root, filters=[("entity_id", "==", 2)])
print("entity 2:", len(only_sg), "rows | pandas count:", int((gl["entity_id"] == 2).sum()))

# 4) two partition levels make many small files: choose columns you filter on, with few values
deep = "lake_demo/gl_deep"
gl.to_parquet(deep, partition_cols=["entity_id", "month"], index=False)
files = sum(len(names) for _, _, names in os.walk(deep))
print("entity x month ->", files, "files for", len(gl), "rows")

# 5) the trap: writing again ADDS files to the same folders
gl.to_parquet(root, partition_cols=["entity_id"], index=False)
print("rows after running the write twice:", len(pd.read_parquet(root)), "(it should be", len(gl), ")")
shutil.rmtree("lake_demo")`,
      note: 'Step 5 gives 2,454 rows: every line twice, and no error. This is how a re-run of a monthly job quietly doubles a report. The next playground shows the fix.',
    } },
    { py: {
      title: 'An idempotent monthly load: replace one partition, and compare with the naive append',
      starter: `import os
import shutil
import pandas as pd
pd.set_option("display.width", 120)

gl = pd.read_csv("fact_gl.csv")
gl["posting_date"] = pd.to_datetime(gl["posting_date"])
gl["month"] = gl["posting_date"].dt.strftime("%Y-%m")
root = "lake_demo/gl_by_month"
shutil.rmtree("lake_demo", ignore_errors=True)

def load_month(frame, root, month):
    """Replace ONE month: delete its folder, then write it again. Running it twice gives the same lake."""
    part = frame[frame["month"] == month]
    shutil.rmtree(os.path.join(root, f"month={month}"), ignore_errors=True)
    part.to_parquet(root, partition_cols=["month"], index=False)
    return len(part)

def lake_rows(root):
    return len(pd.read_parquet(root)) if os.path.isdir(root) else 0

for month in sorted(gl["month"].unique()):
    load_month(gl, root, month)
print("first full load:", lake_rows(root), "rows | the CSV has", len(gl))

# a correction arrives for April: run the April load three more times
for _ in range(3):
    april_rows = load_month(gl, root, "2025-04")
print("after reloading April 3 times:", lake_rows(root), "rows | April has", april_rows, "rows")

# the naive way, for comparison: append without deleting
naive = "lake_demo/naive"
april = gl[gl["month"] == "2025-04"]
for _ in range(4):
    april.to_parquet(naive, partition_cols=["month"], index=False)
print("naive append, 4 runs:", lake_rows(naive), "April rows (it should be", april_rows, ")")
shutil.rmtree("lake_demo")`,
      note: '`load_month` deletes the folder of the month it is about to write, so a repeat gives the same result. That property has a name, **idempotent**, and every scheduled load you build should have it. (A production lake format such as Delta adds transactions so that readers never see a half-replaced partition: later in the course.)',
    } },
    { warn: `Parquet traps:
- **Tiny tables are bigger as Parquet than as CSV.** The footer and the schema cost a few KB per file. Use Parquet for volume, not for a 12-row lookup.
- **Append is not idempotent.** A repeated write to a partitioned folder keeps the old files and adds new ones. Delete or replace the partition first.
- **Too many small files** (partitioning by a high-cardinality column, or one file per run) makes reads slow. Partition by month or entity, not by ID.
- **A mixed-type column cannot be written.** Clean it first. And an integer column with missing values arrives as float unless you use \`Int64\`.
- **The partition column returns as a \`category\`**, not as the original dtype. Convert it back (\`astype\`) if the next step needs it.
- **Do not edit in place.** Parquet files are immutable. To change data you rewrite the file or the partition.
- **Keep the raw CSV.** Parquet is the clean, typed copy for analysis; the raw file is your evidence of what arrived.` },
    { pychallenge: {
      id: 'pandas-parquet-arrow-ch1',
      prompt: 'Write `write_checked(df, path)`. Write `df` to a Parquet file at `path` with `zstd` compression and no index, read it back, and check with `pd.testing.assert_frame_equal` that the table you read is **identical** to the one you wrote (this raises `AssertionError` if not). Return the size of the file in bytes as an int. Calling it twice with the same path must work (the second call replaces the file).',
      starter: `import os
import pandas as pd

def write_checked(df, path):
    # TODO: to_parquet(..., compression="zstd", index=False), read_parquet, assert_frame_equal, return the size
    return 0
`,
      tests: `import os
import shutil
import tempfile
import pandas as pd
d = tempfile.mkdtemp()
path = os.path.join(d, "t.parquet")
df = pd.DataFrame({
    "gl_id": [1, 2, 3],
    "journal": ["JV1", "JV1", "JV2"],
    "posted": pd.to_datetime(["2025-04-01", "2025-04-02", "2025-05-03"]),
    "amount": [10.5, None, 7.25],
})
size = write_checked(df, path)
assert type(size) is int and size > 0, size
assert size == os.path.getsize(path)
back = pd.read_parquet(path)
pd.testing.assert_frame_equal(df, back)
assert str(back["posted"].dtype).startswith("datetime64"), back["posted"].dtype
assert write_checked(df, path) == os.path.getsize(path)
assert len(pd.read_parquet(path)) == 3
shutil.rmtree(d)`,
      solution: `import os
import pandas as pd

def write_checked(df, path):
    df.to_parquet(path, compression="zstd", index=False)
    back = pd.read_parquet(path)
    pd.testing.assert_frame_equal(df, back)
    return int(os.path.getsize(path))
`,
      hint: '`df.to_parquet(path, compression="zstd", index=False)`, then `pd.read_parquet(path)`, then `pd.testing.assert_frame_equal(df, back)`. `os.path.getsize(path)` gives the bytes.',
    } },
    { pychallenge: {
      id: 'pandas-parquet-arrow-ch2',
      prompt: 'Write `read_slice(path, columns, key, value)`. Read from the Parquet file at `path` **only** the columns in `columns` and **only** the rows where the column `key` equals `value`. Use `columns=` and `filters=` of `pd.read_parquet`, so that the file does the skipping. The `key` column does not have to be one of `columns`. Return the DataFrame with the index `0, 1, 2 …`.',
      starter: `import pandas as pd

def read_slice(path, columns, key, value):
    # TODO: pd.read_parquet(path, columns=columns, filters=[(key, "==", value)])
    return pd.DataFrame()
`,
      tests: `import os
import shutil
import tempfile
import pandas as pd
d = tempfile.mkdtemp()
path = os.path.join(d, "t.parquet")
df = pd.DataFrame({
    "gl_id": [1, 2, 3, 4, 5, 6],
    "entity_id": [1, 2, 2, 3, 2, 1],
    "debit": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0],
    "currency": ["INR", "SGD", "SGD", "USD", "SGD", "INR"],
})
df.to_parquet(path, index=False)
r = read_slice(path, ["gl_id", "debit"], "entity_id", 2)
assert list(r.columns) == ["gl_id", "debit"], list(r.columns)
assert r["gl_id"].tolist() == [2, 3, 5], r["gl_id"].tolist()
assert r["debit"].tolist() == [20.0, 30.0, 50.0]
assert r.index.tolist() == [0, 1, 2], r.index.tolist()
assert read_slice(path, ["currency"], "entity_id", 9).shape == (0, 1)
assert read_slice(path, ["gl_id", "entity_id"], "entity_id", 1)["gl_id"].tolist() == [1, 6]
shutil.rmtree(d)`,
      solution: `import pandas as pd

def read_slice(path, columns, key, value):
    out = pd.read_parquet(path, columns=columns, filters=[(key, "==", value)])
    return out.reset_index(drop=True)
`,
      hint: '`pd.read_parquet(path, columns=columns, filters=[(key, "==", value)])` does both the projection and the filter. Finish with `.reset_index(drop=True)`.',
    } },
    { pychallenge: {
      id: 'pandas-parquet-arrow-ch3',
      prompt: 'Write `write_partitioned(df, root, col)`. Write `df` as a Parquet dataset partitioned by the column `col` into the folder `root`. It must be **idempotent**: if `root` already exists, remove it first, so that calling the function twice leaves every row exactly once. Return the sorted list of the folder names directly inside `root` (like `["entity_id=1", "entity_id=2"]`).',
      starter: `import os
import shutil
import pandas as pd

def write_partitioned(df, root, col):
    # TODO: remove root if it exists, then df.to_parquet(root, partition_cols=[col], index=False)
    return []
`,
      tests: `import os
import shutil
import tempfile
import pandas as pd
d = tempfile.mkdtemp()
root = os.path.join(d, "gl")
df = pd.DataFrame({
    "gl_id": [1, 2, 3, 4, 5, 6],
    "entity_id": [1, 2, 2, 3, 2, 1],
    "debit": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0],
})
r = write_partitioned(df, root, "entity_id")
assert r == ["entity_id=1", "entity_id=2", "entity_id=3"], r
assert len(pd.read_parquet(root)) == 6
r2 = write_partitioned(df, root, "entity_id")
assert r2 == r
assert len(pd.read_parquet(root)) == 6, "the second run added rows: the write is not idempotent"
assert sorted(pd.read_parquet(root)["gl_id"].tolist()) == [1, 2, 3, 4, 5, 6]
only2 = pd.read_parquet(root, filters=[("entity_id", "==", 2)])
assert sorted(only2["gl_id"].tolist()) == [2, 3, 5]
shutil.rmtree(d)`,
      solution: `import os
import shutil
import pandas as pd

def write_partitioned(df, root, col):
    shutil.rmtree(root, ignore_errors=True)
    df.to_parquet(root, partition_cols=[col], index=False)
    return sorted(os.listdir(root))
`,
      hint: '`shutil.rmtree(root, ignore_errors=True)` removes an old dataset (and does nothing if there is none). Then `df.to_parquet(root, partition_cols=[col], index=False)` and `sorted(os.listdir(root))`.',
    } },
    { pychallenge: {
      id: 'pandas-parquet-arrow-ch4',
      prompt: 'Write `column_stats(path, column)`. Without reading the data, use the Parquet footer (`pq.ParquetFile(path).metadata`) to return a dict with the keys `"min"`, `"max"` and `"num_rows"`: the smallest and the largest value of `column` over **all row groups** (from the statistics of each group) and the total number of rows of the file. The file may have several row groups.',
      starter: `import pyarrow.parquet as pq

def column_stats(path, column):
    # TODO: metadata = pq.ParquetFile(path).metadata; loop over row groups; min of mins, max of maxes
    return {}
`,
      tests: `import os
import shutil
import tempfile
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
d = tempfile.mkdtemp()
path = os.path.join(d, "t.parquet")
df = pd.DataFrame({"gl_id": [5, 3, 9, 1, 7, 2, 8], "amount": [1.5, 2.5, 0.5, 9.5, 4.0, 3.0, 6.0]})
pq.write_table(pa.Table.from_pandas(df, preserve_index=False), path, row_group_size=3)
assert pq.ParquetFile(path).metadata.num_row_groups == 3
r = column_stats(path, "gl_id")
assert r == {"min": 1, "max": 9, "num_rows": 7}, r
r2 = column_stats(path, "amount")
assert r2 == {"min": 0.5, "max": 9.5, "num_rows": 7}, r2
assert set(r) == {"min", "max", "num_rows"}
shutil.rmtree(d)`,
      solution: `import pyarrow.parquet as pq

def column_stats(path, column):
    meta = pq.ParquetFile(path).metadata
    idx = meta.schema.names.index(column)
    lows, highs = [], []
    for i in range(meta.num_row_groups):
        stats = meta.row_group(i).column(idx).statistics
        if stats is not None and stats.has_min_max:
            lows.append(stats.min)
            highs.append(stats.max)
    return {"min": min(lows), "max": max(highs), "num_rows": meta.num_rows}
`,
      hint: '`meta.schema.names.index(column)` is the column number. For each row group, `meta.row_group(i).column(idx).statistics` has `.min` and `.max`. Collect them and take the min of the mins and the max of the maxes. `meta.num_rows` is the total.',
    } },
    { local: `**Convert the practice tables into a small Parquet lake** (virtual environment active, in \`C:\\fde\\pandas-lab\`, where the 13 CSV files are). Save this as \`07_lake.py\` and run \`python 07_lake.py\`:
\`\`\`python
from pathlib import Path
import pandas as pd

lake = Path("lake")
lake.mkdir(exist_ok=True)
dates = {
    "fact_gl": ["posting_date"], "orders": ["order_date"], "employees": ["hire_date"],
    "payroll": ["run_month"], "fx_rates": ["rate_month"], "fact_budget": ["budget_month"],
    "purchase_register": ["invoice_date"], "supplier_invoices": ["invoice_date"], "customers": ["signup_date"],
}
print(f"{'table':<20}{'csv bytes':>12}{'parquet bytes':>16}")
for csv in sorted(Path(".").glob("*.csv")):
    df = pd.read_csv(csv, parse_dates=dates.get(csv.stem, []))
    out = lake / (csv.stem + ".parquet")
    df.to_parquet(out, compression="zstd", index=False)
    print(f"{csv.stem:<20}{csv.stat().st_size:>12,}{out.stat().st_size:>16,}")
back = pd.read_parquet(lake / "fact_gl.parquet")
print(back.dtypes["posting_date"], back.shape)
\`\`\`
Expected output (the Parquet sizes can differ by a few bytes between pyarrow versions):
\`\`\`text
table                  csv bytes   parquet bytes
customers                    572           3,889
dim_account                  533           4,023
dim_bu                        87           2,356
dim_entity                   178           3,573
employees                  1,799           7,448
fact_budget               17,001           7,211
fact_gl                   69,838          23,105
fx_rates                     717           2,725
orders                     9,628           8,169
payroll                    1,212           3,279
products                     407           3,799
purchase_register          2,434           5,895
supplier_invoices          1,787           5,138
datetime64[ns] (1227, 10)
\`\`\`
Read the two columns. The three big tables (\`fact_gl\`, \`fact_budget\`, \`orders\`) get smaller; the small ones get **bigger**, because every Parquet file carries a footer with the schema and the statistics. Parquet pays off with volume. The folder \`lake\` is now your typed copy of the practice data, and the next lessons can read from it.` },
    { real: `Your Azure data product will have layers. The **bronze** layer keeps what arrived: the vendor CSV, the bank file, the Excel MIS, untouched, as evidence. The **silver** layer is cleaned and typed, and it is almost always Parquet (or Delta, which is Parquet with transactions), partitioned by month or entity. Reports and models read silver with a column list and a month filter, and touch a fraction of the bytes. Two habits from this lesson matter on day one: write the **schema** on purpose (dates as dates, money as decimals), and make every load **idempotent**, because the first time a scheduler retries a failed run, a non-idempotent append will double your general ledger.` },
    { interview: `**"CSV versus Parquet: why do data teams prefer Parquet?"**
Model answer: "Parquet is a columnar, typed, compressed binary format. A reader loads only the columns it needs, the file carries its schema so nobody has to guess types, similar values compress well, and the min and max statistics per row group let the reader skip data that cannot match a filter. A CSV is text, row by row, untyped and has to be parsed in full. The cost is that Parquet is not human readable and not edited in place, and tiny files are not worth it."

**"What is partitioning, and how do you choose the partition column?"**
"Splitting a dataset into folders by the value of a column, so that a filter on that column opens only the matching folders. I pick the column that queries filter on most, with few distinct values, usually month or entity or country. Never an ID or a timestamp, and I avoid so many partitions that I create lots of tiny files."

**"How do you make a load idempotent?"**
"A re-run must give the same result as the first run. For a partitioned lake I replace the partition I am loading: delete it or overwrite it, then write, instead of appending. For a database I use upsert, MERGE or delete-then-insert for the same key. And I verify with row counts and totals after the load."` },
    `## Recap
- **Parquet** is columnar, typed, compressed and carries its **schema** and **min / max statistics** in the footer. A reader loads only the columns it needs (\`columns=\`) and skips row groups that cannot match (\`filters=\`). It is binary, written once, and has a fixed overhead, so tiny tables get bigger.
- \`df.to_parquet(path, compression="zstd", index=False)\` and \`pd.read_parquet(path, columns=..., filters=...)\`. Convert types before writing (dates as dates). **Write, read back, compare.**
- \`pq.read_schema\` and \`pq.ParquetFile(path).metadata\` show the schema, row groups and statistics **without reading the data**: a cheap way to profile a file that arrived from outside.
- Money in a ledger: **\`decimal128(18, 2)\`** (exact), doubles for analysis. **Arrow** is the in-memory twin: \`pa.Table.from_pandas\`, \`to_pandas\`, and \`pyarrow.compute\`; Spark, DuckDB, Polars and cloud tools share it.
- **Partitioned datasets** are folders named \`column=value\`: choose few-valued columns you filter on (month, entity), avoid the small-files problem, and make every write **idempotent** (replace the partition; an append doubles the rows).`,
  ],
  quiz: [
    { q: 'Why is a Parquet file usually smaller than the same data as CSV?', o: ['Parquet drops rows that contain missing values', 'columns are stored together, typed and compressed, instead of as text row by row', 'Parquet keeps only the first 1,000 rows', 'Parquet stores numbers as text with fewer digits'], a: 1, why: 'Values of one column sit together, have one type, and compress well (dictionary, run-length, zstd). Numbers are stored in binary, not as text.' },
    { q: 'What does `pd.read_parquet(path, columns=["debit", "entity_id"])` save you?', o: ['nothing: the whole file is read and then two columns are kept', 'it converts the file to CSV first', 'it sorts the rows by debit', 'it reads only those two columns from the file, because columns are stored separately'], a: 3, why: 'Parquet keeps each column in its own chunks, so the reader can fetch only the chunks it needs (projection).' },
    { q: 'What do the min and max statistics in the Parquet footer allow a reader to do?', o: ['repair rows with wrong values', 'rename the columns', 'skip row groups that cannot contain a match for a filter, without reading their data', 'compress the file again'], a: 2, why: 'If the maximum date of a row group is before the filter date, no row in that group can match, so the group is skipped. This is predicate pushdown.' },
    { q: 'You partition a ten-crore-line GL dataset. Which column is the best partition column?', o: ['`gl_id`', '`journal_id`', 'the posting month', 'a random identifier for each file'], a: 2, why: 'A month has few distinct values and is the column that reports filter on. An ID would create millions of folders and files (the small-files problem).' },
    { q: 'You run the April load twice and the lake now holds twice the April rows, with no error. What went wrong?', o: ['Parquet files cannot be read twice', 'the second run added new files to the same partition: delete or replace the partition before writing it again', 'snappy compression duplicates rows', 'pandas sorted the file twice'], a: 1, why: 'A write to a partitioned folder adds files; it does not replace old ones. An idempotent load removes the target partition first.' },
    { q: 'Which Parquet type stores rupee amounts exactly, without binary rounding?', o: ['`decimal128(18, 2)`', '`float`', '`double`', '`string` with the commas kept'], a: 0, why: 'A decimal type keeps digits exactly. `float` and `double` are binary fractions, so sums can differ from the true value by tiny amounts.' },
  ],
  task: {
    title: 'Build a typed Parquet lake from the Kollana tables',
    steps: [
      'In `C:\\fde\\pandas-lab` run the `local` callout script (`07_lake.py`). Check that you get the table of sizes and that `fact_gl` is smaller as Parquet. In a comment, explain why `customers` is bigger.',
      'Create `07_parquet.py`. Read `lake/fact_gl.parquet` with `columns=["entity_id", "debit"]` and `filters=[("entity_id", "==", 1)]`. You should get 411 rows and 2 columns.',
      'Print `pq.read_schema` of the file and, with `pq.ParquetFile(...).metadata`, the number of rows (1,227), columns (10) and the minimum and maximum `posting_date` without reading the data.',
      'Write `fact_gl` partitioned by `entity_id` into `lake/gl_by_entity` and list the three folders. Read back only entity 2 (408 rows).',
      'Write the partitioned dataset a second time and show that the row count doubled to 2,454. Then make the write idempotent with `shutil.rmtree` and show 1,227 again after three runs.',
      'Cast `debit` and `credit` to `decimal128(18, 2)`, write `lake/fact_gl_money.parquet`, and check with `pyarrow.compute.sum` that the debit total of entity 1 is 6,288,358.95.',
    ],
    deliverable: '`07_lake.py`, `07_parquet.py` and the `lake` folder, with the printed size table and the idempotency check (1,227 rows after three runs).',
  },
};
