export default {
  id: 'pandas-performance',
  title: 'Speed and memory: vectorise, shrink, stream',
  goal: 'You can explain why a row loop and apply(axis=1) are slow, replace them with column operations, measure with a timer, cut memory with category, downcast and Arrow-backed dtypes without changing a number, and total a file that does not fit in memory by reading it in chunks.',
  roadmap: ['vectorisation vs apply', 'dtypes and memory', 'categorical', 'Arrow-backed dtypes', 'chunks'],
  blocks: [
    `## The problem
Two things go wrong when a pandas script meets real volume. The first is **time**: a month-end script that took 20 seconds on the test file takes two hours on the real one, and nobody can say why. The second is **memory**: a 4 GB CSV is loaded with \`read_csv\`, the laptop starts swapping to disk, and then Python stops with a \`MemoryError\`.

Both have the same shape. pandas is fast when it works on **whole columns of one type** and slow when you pull the work back into Python one row at a time. And a DataFrame is large when its columns are stored carelessly: text as one Python object per cell, whole numbers in 8 bytes when 1 byte would do. This lesson gives you the mental model, the recipes, and the check that proves a speed-up did not change an answer. It also answers two interview classics: **"Why is \`apply\` slow?"** and **"How do you process a 10 GB CSV?"**`,
    `## Where the time goes
A vectorised operation such as \`df["qty"] * df["unit_price"]\` is **one call into compiled code** that walks a block of numbers in memory. A row loop is one Python step **per row**, and each step costs interpreter time. The usual ways to compute a value row by row, from slowest to fastest:

| Method | What happens | Speed |
|---|---|---|
| \`iterrows()\` | builds a whole Series object for every row | slowest, and it can change the types |
| \`apply(f, axis=1)\` | calls your Python function once per row, with a Series for each row | slow: a loop in disguise |
| \`itertuples()\` | one light tuple per row | much better, still a Python loop |
| \`zip(col_a, col_b)\` in a list comprehension | plain Python on the raw values | fast for a loop |
| **vectorised column maths** | compiled code on the whole column | by far the fastest |

The picture shows one measured run. **\`iterrows\` also changes the types**: a row is **one** Series, so when the columns are mixed numbers the integers become floats (\`qty\` turns into \`3.0\`).`,
    { sketch: { w: 760, h: 330, caption: 'One run on 20,000 invoices, time on a log scale: the vectorised column operation sits far below every kind of loop', items: [
      { t: 'text', x: 380, y: 24, text: 'invoice total = qty x unit_price x (1 + gst_rate), 20,000 rows', size: 16, bold: true },
      { t: 'text', x: 160, y: 72, text: 'iterrows', font: 'mono', size: 14, anchor: 'end' },
      { t: 'box', x: 170, y: 54, w: 433, h: 34, fill: 'red' },
      { t: 'text', x: 611, y: 72, text: '1700 ms', size: 15, anchor: 'start', bold: true },
      { t: 'text', x: 160, y: 122, text: 'apply(axis=1)', font: 'mono', size: 14, anchor: 'end' },
      { t: 'box', x: 170, y: 104, w: 361, h: 34, fill: 'orange' },
      { t: 'text', x: 539, y: 122, text: '326 ms', size: 15, anchor: 'start', bold: true },
      { t: 'text', x: 160, y: 172, text: 'itertuples', font: 'mono', size: 14, anchor: 'end' },
      { t: 'box', x: 170, y: 154, w: 280, h: 34, fill: 'yellow' },
      { t: 'text', x: 458, y: 172, text: '50 ms', size: 15, anchor: 'start', bold: true },
      { t: 'text', x: 160, y: 222, text: 'zip in a list', font: 'mono', size: 14, anchor: 'end' },
      { t: 'box', x: 170, y: 204, w: 241, h: 34, fill: 'blue' },
      { t: 'text', x: 419, y: 222, text: '20 ms', size: 15, anchor: 'start', bold: true },
      { t: 'text', x: 160, y: 272, text: 'vectorised', font: 'mono', size: 14, anchor: 'end' },
      { t: 'box', x: 170, y: 254, w: 40, h: 34, fill: 'green' },
      { t: 'text', x: 218, y: 272, text: '0.2 ms', size: 15, anchor: 'start', bold: true },
      { t: 'note', x: 14, y: 296, w: 732, h: 28, fill: 'grey', size: 13, text: 'Measured in the lesson playground. Your numbers will differ; the order will not.' },
    ] } },
    { py: {
      title: 'The ladder: five ways to compute a column, timed, and checked against each other',
      starter: `import time
import numpy as np
import pandas as pd
pd.set_option("display.width", 120)

def make_invoices(n, seed=7):
    rng = np.random.default_rng(seed)
    return pd.DataFrame({
        "invoice_id": np.arange(1, n + 1, dtype="int64"),
        "branch": rng.choice(["Chennai", "Hyderabad", "Mumbai", "Pune", "Delhi"], n),
        "status": rng.choice(["Open", "Paid", "Disputed"], n, p=[0.5, 0.45, 0.05]),
        "qty": rng.integers(1, 13, n, dtype="int64"),
        "unit_price": rng.choice(np.array([1800, 5400, 8900, 11500, 21000], dtype="int64"), n),
        "gst_rate": rng.choice([0.05, 0.12, 0.18], n),
    })

df = make_invoices(20000)          # synthetic invoices with a fixed seed: the same data on every run

def best_of(fn, repeat):
    best = None
    for _ in range(repeat):
        t0 = time.perf_counter()
        out = fn()
        spent = time.perf_counter() - t0
        if best is None or spent < best:
            best = spent
    return best, out

def with_iterrows():
    out = []
    for _, r in df.iterrows():
        out.append(r["qty"] * r["unit_price"] * (1 + r["gst_rate"]))
    return pd.Series(out, index=df.index)

def with_apply():
    return df.apply(lambda r: r["qty"] * r["unit_price"] * (1 + r["gst_rate"]), axis=1)

def with_itertuples():
    return pd.Series([r.qty * r.unit_price * (1 + r.gst_rate) for r in df.itertuples()], index=df.index)

def with_zip():
    return pd.Series([q * p * (1 + g) for q, p, g in zip(df["qty"], df["unit_price"], df["gst_rate"])], index=df.index)

def vectorised():
    return df["qty"] * df["unit_price"] * (1 + df["gst_rate"])

results, outputs = {}, {}
for name, fn, repeat in [("iterrows", with_iterrows, 1), ("apply(axis=1)", with_apply, 1),
                         ("itertuples", with_itertuples, 3), ("zip in a list", with_zip, 3), ("vectorised", vectorised, 50)]:
    results[name], outputs[name] = best_of(fn, repeat)

fastest = results["vectorised"]
print(f"{'method':<16}{'milliseconds':>14}{'times slower':>14}")
for name, secs in results.items():
    print(f"{name:<16}{secs * 1000:>14.2f}{secs / fastest:>14.0f}")

# the answers must be the same, or the speed means nothing
print("all five agree:", all(np.allclose(outputs[k], outputs["vectorised"]) for k in outputs))

# iterrows also changes the types: a row is ONE Series, so the integers become floats
first_row = next(df[["qty", "unit_price", "gst_rate"]].iterrows())[1]
print(first_row.dtype, "| qty is now", first_row["qty"], "| in the column it is", df["qty"].iloc[0])`,
      note: 'Read the last column: on a typical run `iterrows` is thousands of times slower than the vectorised line, and `apply(axis=1)` more than a thousand times. The exact numbers depend on your machine. The `np.allclose` line is the important habit: whenever you speed something up, compare it with the old answer.',
    } },
    `## Vectorise: the replacements
Almost every \`apply\` or loop has a column-level replacement:

| Instead of a row function that does… | Use |
|---|---|
| arithmetic on several columns | column maths: \`df["a"] * df["b"]\` |
| \`if / elif / else\` | \`np.where(test, a, b)\` for two outcomes, \`np.select([test1, test2], [a, b], default=c)\` for several |
| translate a code into a label | \`Series.map({...})\` |
| look a value up in another table | \`merge\` (with \`validate="m:1"\`) |
| "is it one of these?" | \`isin([...])\` |
| a total per group, next to each row | \`groupby(...).transform("sum")\` |
| a bucket of a number | \`pd.cut\` |
| text clean-up | \`.str\` methods, and the Arrow string dtype below for speed |
| dates | the \`.dt\` accessor and date maths |

\`apply\` is still fine when the logic really is complicated per row and the table is small, or when the function runs **once per group** (\`groupby(...).apply\`). Two rules: **measure before you optimise** (the profiling tools from the Python phase tell you where the time goes; most scripts have one hot spot), and **check the answer** of the fast version against the slow one.`,
    { py: {
      title: 'np.select instead of an if/elif function, and map or merge instead of a lookup',
      starter: `import time
import numpy as np
import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")
products = pd.read_csv("products.csv")

def timed(fn, repeat=20):
    t0 = time.perf_counter()
    for _ in range(repeat):
        out = fn()
    return out, (time.perf_counter() - t0) / repeat * 1000

# 1) if / elif / else: a Python function through apply, versus np.select on whole columns
def tier_of(amount):
    if amount >= 200000:
        return "A"
    if amount >= 100000:
        return "B"
    if amount >= 50000:
        return "C"
    return "D"

by_apply, ms_apply = timed(lambda: orders["amount"].apply(tier_of))
conditions = [orders["amount"] >= 200000, orders["amount"] >= 100000, orders["amount"] >= 50000]
by_select, ms_select = timed(lambda: pd.Series(np.select(conditions, ["A", "B", "C"], default="D"), index=orders.index))
print("same tiers:", by_apply.equals(by_select), "| apply %.3f ms, np.select %.3f ms" % (ms_apply, ms_select))
print(by_select.value_counts().sort_index().to_dict())

# 2) a lookup: a dict through map, versus a merge
price_of = dict(zip(products["product_id"], products["unit_price"]))
mapped, ms_map = timed(lambda: orders["product_id"].map(price_of))
merged, ms_merge = timed(lambda: orders.merge(products[["product_id", "unit_price"]], on="product_id", how="left", validate="m:1")["unit_price"])
print("map and merge agree:", mapped.tolist() == merged.tolist(), "| map %.3f ms, merge %.3f ms" % (ms_map, ms_merge))

# 3) the business check from the cleaning lesson, vectorised in three lines
ratio = (orders["amount"] / (orders["qty"] * mapped)).round(4)
print("orders at a discount tier other than 100, 95 or 90 percent:", int((~ratio.isin([1.0, 0.95, 0.9])).sum()))`,
      note: 'On 220 rows the timings are tiny and close, because the setup cost of each call dominates. The gap grows with the number of rows: that is why a script that was fine on the test file is slow on the real one. The equality checks are the part to copy.',
    } },
    `## Memory: store less, with the same numbers
\`df.memory_usage(deep=True)\` shows the bytes per column (\`deep=True\` counts the text objects too, which is where the cost hides). Where the memory goes, and the fix:

- **Text columns (\`object\`)** are the big spender: each cell is a pointer to its own Python string, so the same word (\`"Chennai"\`) is stored again and again. A column with **few distinct values** becomes a \`category\`: each label is stored once and each row holds a small code. The picture shows the difference.
- **Whole numbers** default to 8 bytes (\`int64\`). \`pd.to_numeric(col, downcast="unsigned")\` picks the smallest type that fits (1, 2 or 4 bytes). IDs and quantities rarely need more.
- **Columns you never use**: \`usecols=[...]\` in \`read_csv\` never loads them.
- **Floats and money:** \`float32\` halves the memory but keeps only about 7 significant digits. Totals over many rows are then **wrong in the rupees**. Keep money as \`float64\` (or integer paise).`,
    { sketch: { w: 760, h: 300, caption: 'A category stores each label once and keeps one small code per row; an object column keeps a separate Python string for every row', items: [
      { t: 'text', x: 190, y: 26, text: 'object (plain text)', size: 17, bold: true },
      { t: 'table', x: 14, y: 46, cols: ['branch'], colW: [92], rows: [['row 0'], ['row 1'], ['row 2'], ['row 3'], ['row 4']], rowH: 28 },
      { t: 'arrow', x1: 110, y1: 88, x2: 196, y2: 88 },
      { t: 'arrow', x1: 110, y1: 116, x2: 196, y2: 116 },
      { t: 'arrow', x1: 110, y1: 144, x2: 196, y2: 144 },
      { t: 'arrow', x1: 110, y1: 172, x2: 196, y2: 172 },
      { t: 'arrow', x1: 110, y1: 200, x2: 196, y2: 200 },
      { t: 'box', x: 200, y: 76, w: 110, h: 24, fill: 'grey', label: 'Chennai', size: 14 },
      { t: 'box', x: 200, y: 104, w: 110, h: 24, fill: 'grey', label: 'Pune', size: 14 },
      { t: 'box', x: 200, y: 132, w: 110, h: 24, fill: 'grey', label: 'Chennai', size: 14 },
      { t: 'box', x: 200, y: 160, w: 110, h: 24, fill: 'grey', label: 'Mumbai', size: 14 },
      { t: 'box', x: 200, y: 188, w: 110, h: 24, fill: 'grey', label: 'Chennai', size: 14 },
      { t: 'text', x: 570, y: 26, text: 'category', size: 17, bold: true },
      { t: 'table', x: 400, y: 46, cols: ['codes'], colW: [80], rows: [['0'], ['1'], ['0'], ['2'], ['0']], rowH: 28, fill: 'green' },
      { t: 'arrow', x1: 486, y1: 88, x2: 560, y2: 88 },
      { t: 'table', x: 566, y: 46, cols: ['code', 'label'], colW: [50, 110], rows: [['0', 'Chennai'], ['1', 'Pune'], ['2', 'Mumbai']], rowH: 28, fill: 'green' },
      { t: 'note', x: 14, y: 236, w: 350, h: 50, fill: 'pink', size: 13, text: 'Every row points to its own string:\nthe same word is stored again and again.' },
      { t: 'note', x: 400, y: 236, w: 346, h: 50, fill: 'green', size: 13, text: 'Every row holds a tiny code:\neach label is stored once, in the dictionary.' },
    ] } },
    { py: {
      title: 'Shrink a 100,000-row table, prove nothing changed, and see why float32 is dangerous',
      starter: `import numpy as np
import pandas as pd
pd.set_option("display.width", 120)

def make_invoices(n, seed=7):
    rng = np.random.default_rng(seed)
    return pd.DataFrame({
        "invoice_id": np.arange(1, n + 1, dtype="int64"),
        "branch": rng.choice(["Chennai", "Hyderabad", "Mumbai", "Pune", "Delhi"], n),
        "status": rng.choice(["Open", "Paid", "Disputed"], n, p=[0.5, 0.45, 0.05]),
        "qty": rng.integers(1, 13, n, dtype="int64"),
        "unit_price": rng.choice(np.array([1800, 5400, 8900, 11500, 21000], dtype="int64"), n),
        "gst_rate": rng.choice([0.05, 0.12, 0.18], n),
    })

big = make_invoices(100000)

def report(frame, title):
    mem = frame.memory_usage(deep=True).drop("Index")
    print(title, "-", round(mem.sum() / 1e6, 2), "MB in total")
    print("  ", (mem / 1e6).round(2).to_dict())
    return mem.sum()

before = report(big, "as created")

small = big.copy()
for col in ["branch", "status"]:                              # few distinct values: category
    small[col] = small[col].astype("category")
for col in ["invoice_id", "qty", "unit_price"]:               # whole numbers: the smallest type that fits
    small[col] = pd.to_numeric(small[col], downcast="unsigned")
after = report(small, "shrunk")
print({c: str(t) for c, t in small.dtypes.items()})
print("smaller by a factor of", round(before / after, 1))

# the numbers must not change: convert back and compare every cell
pd.testing.assert_frame_equal(big, small.astype(big.dtypes.to_dict()))
print("every value is identical after converting back")
print("same totals per branch:", big.groupby("branch")["qty"].sum().to_dict() == small.groupby("branch", observed=True)["qty"].sum().to_dict())

# a trap: float32 saves memory, but it changes money
gross = big["qty"] * big["unit_price"] * (1 + big["gst_rate"])
total64 = float(gross.sum())
total32 = float(gross.astype("float32").sum())
print("float64 total:", round(total64, 2))
print("float32 total:", round(total32, 2), "| difference:", round(total32 - total64, 2))`,
      note: 'The exact megabytes depend on your machine, the factor is what matters: the two text columns were most of the memory and become tiny. The float32 total is off by a couple of hundred rupees on a total of about 700 crore: that is why floats that hold money are never downcast.',
    } },
    `## Arrow-backed dtypes
Since pandas 2, a column can be stored in **Apache Arrow** format instead of NumPy: \`df.convert_dtypes(dtype_backend="pyarrow")\`, or \`astype("string[pyarrow]")\` for text, or \`read_csv(..., dtype_backend="pyarrow")\`. Arrow is the in-memory column format that Parquet files and many other tools use, so the same data can move between them without conversion. For pandas it brings:
- **Compact text**: strings are stored in one block, not as one Python object per cell, and text operations run in compiled code.
- **Native missing values** in every type (\`<NA>\`), without turning integers into floats.
- **Zero-copy handoff** to Arrow-based tools and Parquet (the next lesson).

The cost: it is newer, a few operations are slower or not supported yet, and a different dtype name (\`int64[pyarrow]\`, \`double[pyarrow]\`) shows up in your code. Check the release notes of the pandas version you use, and test your pipeline. On your laptop it needs the \`pyarrow\` package (you installed it in the first pandas task); the lesson playgrounds load it for you.`,
    { py: {
      title: 'Arrow-backed strings: memory, speed and identical answers',
      starter: `import time
import numpy as np
import pandas as pd
pd.set_option("display.width", 120)         # pandas finds pyarrow by itself when it is installed

def make_invoices(n, seed=7):
    rng = np.random.default_rng(seed)
    return pd.DataFrame({
        "branch": rng.choice(["Chennai", "Hyderabad", "Mumbai", "Pune", "Delhi"], n),
        "status": rng.choice(["Open", "Paid", "Disputed"], n, p=[0.5, 0.45, 0.05]),
        "qty": rng.integers(1, 13, n, dtype="int64"),
        "gst_rate": rng.choice([0.05, 0.12, 0.18], n),
    })

big = make_invoices(100000)
arrow = big.convert_dtypes(dtype_backend="pyarrow")
print({c: str(t) for c, t in arrow.dtypes.items()})

mb = lambda s: round(s.memory_usage(deep=True) / 1e6, 2)
print("branch as object  :", mb(big["branch"]), "MB")
print("branch as pyarrow :", mb(arrow["branch"]), "MB")
print("branch as category:", mb(big["branch"].astype("category")), "MB")

def timed(fn, repeat=5):
    t0 = time.perf_counter()
    for _ in range(repeat):
        out = fn()
    return out, (time.perf_counter() - t0) / repeat * 1000

_, ms_object = timed(lambda: big["branch"].str.upper())
_, ms_arrow = timed(lambda: arrow["branch"].str.upper())
print("str.upper: object %.1f ms | pyarrow %.1f ms" % (ms_object, ms_arrow))

# the answers do not change
print("same totals:", arrow.groupby("branch")["qty"].sum().to_dict() == big.groupby("branch")["qty"].sum().to_dict())

# native missing values: an integer column keeps its integers
ids = pd.Series([1, None, 3], dtype="Int64")
print(ids.tolist(), "|", str(ids.dtype), "| numpy int64 cannot hold a missing value")`,
      note: 'The Arrow column is much smaller than the object column and its text method is faster. A `category` is smaller still for a column with few distinct values, but it is not a good fit for free text such as names. Pick by the column: category for few labels, Arrow strings for text, NumPy for numbers.',
    } },
    `## Files that do not fit: chunks
\`read_csv(path, chunksize=50000)\` does not return a DataFrame. It returns an **iterator** that gives you the file 50,000 rows at a time, so only one chunk is in memory. The pattern for a 10 GB CSV:

1. **Read only what you need**: \`usecols=[...]\`, and \`dtype=\` so the chunk is small.
2. **Reduce each chunk to a small partial answer**: totals and counts per key.
3. **Combine the partial answers** into the final result.

What you can combine: **sums, counts, minimum, maximum** are easy (add them, or take the min of mins). A **mean** needs the sum **and** the count of every chunk, divided at the end: never the average of the chunk averages. A **median** or a distinct count cannot be combined from small pieces: use another tool for those.

When the same file is read often, **convert it once to Parquet** (next lesson): a column format that is smaller, typed, and lets you read only some columns. And when pandas is no longer enough (several GB, repeated heavy joins), the next steps are a database, DuckDB or Spark, which this course covers later.`,
    { sketch: { w: 760, h: 320, caption: 'Read a big file in chunks: only one chunk is in memory at a time, and the small partial answers are combined at the end', items: [
      { t: 'doc', x: 14, y: 102, w: 96, h: 108, fill: 'blue', label: 'big\nfile' },
      { t: 'box', x: 170, y: 30, w: 130, h: 58, fill: 'yellow', label: 'chunk 1', sub: '40,000 rows', size: 16 },
      { t: 'box', x: 170, y: 114, w: 130, h: 58, fill: 'yellow', label: 'chunk 2', sub: '40,000 rows', size: 16 },
      { t: 'box', x: 170, y: 198, w: 130, h: 58, fill: 'yellow', label: 'chunk 3', sub: 'and so on', size: 16 },
      { t: 'arrow', x1: 114, y1: 140, x2: 166, y2: 66 },
      { t: 'arrow', x1: 114, y1: 156, x2: 166, y2: 144 },
      { t: 'arrow', x1: 114, y1: 172, x2: 166, y2: 226 },
      { t: 'box', x: 346, y: 30, w: 170, h: 58, fill: 'orange', label: 'partial sums', sub: 'sum + count per branch', size: 15 },
      { t: 'box', x: 346, y: 114, w: 170, h: 58, fill: 'orange', label: 'partial sums', sub: 'sum + count per branch', size: 15 },
      { t: 'box', x: 346, y: 198, w: 170, h: 58, fill: 'orange', label: 'partial sums', sub: 'sum + count per branch', size: 15 },
      { t: 'arrow', x1: 304, y1: 59, x2: 342, y2: 59 },
      { t: 'arrow', x1: 304, y1: 143, x2: 342, y2: 143 },
      { t: 'arrow', x1: 304, y1: 227, x2: 342, y2: 227 },
      { t: 'box', x: 576, y: 114, w: 170, h: 58, fill: 'green', label: 'combine', sub: 'add the partial sums', size: 17 },
      { t: 'arrow', x1: 520, y1: 62, x2: 572, y2: 128 },
      { t: 'arrow', x1: 520, y1: 143, x2: 572, y2: 143 },
      { t: 'arrow', x1: 520, y1: 224, x2: 572, y2: 158 },
      { t: 'note', x: 14, y: 276, w: 732, h: 36, fill: 'grey', size: 14, text: 'Sums, counts, min and max combine. A mean needs the sum AND the count. A median does not combine.' },
    ] } },
    { py: {
      title: 'Total a file in chunks and check it against the one-shot answer',
      starter: `import os
import numpy as np
import pandas as pd

def make_invoices(n, seed=7):
    rng = np.random.default_rng(seed)
    return pd.DataFrame({
        "invoice_id": np.arange(1, n + 1, dtype="int64"),
        "branch": rng.choice(["Chennai", "Hyderabad", "Mumbai", "Pune", "Delhi"], n),
        "qty": rng.integers(1, 13, n, dtype="int64"),
        "unit_price": rng.choice(np.array([1800, 5400, 8900, 11500, 21000], dtype="int64"), n),
    })

# 1) make a file that we pretend is too big for memory
make_invoices(150000).to_csv("big_invoices.csv", index=False)
print("file size:", round(os.path.getsize("big_invoices.csv") / 1e6, 1), "MB")

# 2) read only the needed columns, 40,000 rows at a time, and keep small partial answers
totals = {}                                     # branch -> (sum, count)
rows = 0
for chunk in pd.read_csv("big_invoices.csv", usecols=["branch", "qty", "unit_price"], chunksize=40000):
    rows += len(chunk)
    chunk["value"] = chunk["qty"] * chunk["unit_price"]
    part = chunk.groupby("branch")["value"].agg(["sum", "count"])
    for branch, row in part.iterrows():
        s, c = totals.get(branch, (0, 0))
        totals[branch] = (s + int(row["sum"]), c + int(row["count"]))
print("rows seen:", rows)
chunked = {b: s for b, (s, c) in sorted(totals.items())}
print(chunked)
print({b: round(s / c, 1) for b, (s, c) in sorted(totals.items())}, "<- a mean from the sums and the counts")

# 3) the same answer in one go (possible only because this file is small)
full = pd.read_csv("big_invoices.csv", usecols=["branch", "qty", "unit_price"])
one_shot = (full["qty"] * full["unit_price"]).groupby(full["branch"]).sum().to_dict()
print("chunked equals one-shot:", one_shot == chunked)
os.remove("big_invoices.csv")`,
      note: 'The chunked loop holds 40,000 rows at a time, so its memory stays flat whether the file has 150,000 rows or 150 million. The last line is the test you always write: on a small sample the chunked answer must equal the one-shot answer before you trust it on the big file.',
    } },
    { warn: `Performance traps:
- **Optimising before measuring.** Time the whole script first (\`time.perf_counter\`, or \`python -m cProfile\`) and fix the one slow step. A faster line in the wrong place saves nothing.
- **A speed-up that changes the answer.** Always compare the new result with the old one (\`np.allclose\`, \`equals\`, \`assert_frame_equal\`) on a sample.
- **\`iterrows\` changes dtypes.** Each row becomes one Series with a common type, so integers can turn into floats and everything into \`object\` when text is mixed in.
- **\`float32\` for money.** About 7 significant digits: totals drift by whole rupees. Keep money in \`float64\` or integer paise.
- **\`category\` on a column with mostly unique values** (invoice numbers, names) saves nothing and makes some operations slower. Use it for few distinct labels.
- **A mean of chunk means** is wrong unless every chunk has the same size. Combine sums and counts.` },
    { pychallenge: {
      id: 'pandas-performance-ch1',
      prompt: 'Write `invoice_total(df)`. `df` has the columns `qty`, `unit_price` and `gst_rate` (like `0.18`). Return a Series with the same index: `qty * unit_price * (1 + gst_rate)` rounded to 2 decimals. It must be **fast**: the tests run it on 100,000 rows and fail if it takes more than half a second, so do not loop over the rows with `iterrows` or `apply(axis=1)`.',
      starter: `def invoice_total(df):
    # TODO: one column expression, then .round(2); no row loop
    return df["qty"]
`,
      tests: `import time
import numpy as np
import pandas as pd
df = pd.DataFrame({"qty": [3, 1, 5], "unit_price": [15000, 87400, 8455], "gst_rate": [0.18, 0.05, 0.12]}, index=[10, 11, 12])
r = invoice_total(df)
assert r.tolist() == [53100.0, 91770.0, 47348.0], r.tolist()
assert r.index.tolist() == [10, 11, 12]
rng = np.random.default_rng(1)
n = 100000
big = pd.DataFrame({
    "qty": rng.integers(1, 13, n),
    "unit_price": rng.integers(1000, 30000, n),
    "gst_rate": rng.choice([0.05, 0.12, 0.18], n),
})
t0 = time.perf_counter()
out = invoice_total(big)
elapsed = time.perf_counter() - t0
assert len(out) == n, len(out)
assert elapsed < 0.5, "too slow (%.2f s): do not loop over the rows" % elapsed
expected = round(float(big["qty"].iloc[0] * big["unit_price"].iloc[0] * (1 + big["gst_rate"].iloc[0])), 2)
assert abs(out.iloc[0] - expected) < 0.005, (out.iloc[0], expected)
assert list(df.columns) == ["qty", "unit_price", "gst_rate"]`,
      solution: `def invoice_total(df):
    return (df["qty"] * df["unit_price"] * (1 + df["gst_rate"])).round(2)
`,
      hint: 'One expression on whole columns: `df["qty"] * df["unit_price"] * (1 + df["gst_rate"])`, then `.round(2)`. A column expression keeps the index of `df`.',
    } },
    { pychallenge: {
      id: 'pandas-performance-ch2',
      prompt: 'Write `tier_labels(amounts)`. `amounts` is a Series of numbers (it may contain NaN). Return a Series with the same index and the labels: `"n/a"` for a missing value, `"A"` for 200000 or more, `"B"` for 100000 or more, `"C"` for 50000 or more, and `"D"` for the rest. Use `np.select`, not `apply`. The first condition that is true wins.',
      starter: `import numpy as np
import pandas as pd

def tier_labels(amounts):
    # TODO: np.select([missing, >= 200000, >= 100000, >= 50000], ["n/a", "A", "B", "C"], default="D")
    return amounts.astype(str)
`,
      tests: `import numpy as np
import pandas as pd
s = pd.Series([250000, 100000, 99999.99, 50000, 10, np.nan, 200000], index=list("abcdefg"))
r = tier_labels(s)
assert r.tolist() == ["A", "B", "C", "C", "D", "n/a", "A"], r.tolist()
assert r.index.tolist() == list("abcdefg")
assert tier_labels(pd.Series([], dtype="float64")).tolist() == []
big = pd.Series(np.arange(0, 300000, 3.0))
out = tier_labels(big)
assert len(out) == len(big) and out.iloc[0] == "D" and out.iloc[-1] == "A"`,
      solution: `import numpy as np
import pandas as pd

def tier_labels(amounts):
    conditions = [amounts.isna(), amounts >= 200000, amounts >= 100000, amounts >= 50000]
    labels = np.select(conditions, ["n/a", "A", "B", "C"], default="D")
    return pd.Series(labels, index=amounts.index)
`,
      hint: '`np.select(conditions, choices, default="D")` checks the conditions in order and takes the first true one, so put `amounts.isna()` first (a NaN makes every comparison False). Wrap the result in `pd.Series(..., index=amounts.index)`.',
    } },
    { pychallenge: {
      id: 'pandas-performance-ch3',
      prompt: 'Write `shrink(df)`. Return a **new** DataFrame in which every text column (dtype `object`) is converted to `category` and every integer column is downcast to the smallest integer type that fits (`pd.to_numeric(..., downcast="integer")`). **Float columns must stay `float64`** (they hold money). The values must not change and the input must not change.',
      starter: `import pandas as pd

def shrink(df):
    # TODO: copy, then loop over the columns: object -> category, integer -> downcast, floats untouched
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "invoice_id": [1, 2, 3, 4, 5, 6],
    "branch": ["Chennai", "Pune", "Chennai", "Mumbai", "Chennai", "Pune"],
    "qty": [3, 1, 5, 12, 7, 2],
    "amount": [1000.5, 2000.25, 3000.0, 4000.75, 5000.0, 6000.5],
})
r = shrink(df)
assert str(r["branch"].dtype) == "category", r["branch"].dtype
assert str(r["qty"].dtype) in ("int8", "uint8"), r["qty"].dtype
assert str(r["invoice_id"].dtype) in ("int8", "uint8"), r["invoice_id"].dtype
assert str(r["amount"].dtype) == "float64", "money columns must stay float64"
assert r["amount"].tolist() == df["amount"].tolist() and r["qty"].tolist() == df["qty"].tolist()
assert r["branch"].tolist() == df["branch"].tolist()
big = pd.concat([df] * 2000, ignore_index=True)
assert shrink(big).memory_usage(deep=True).sum() < big.memory_usage(deep=True).sum() / 2
assert str(df["qty"].dtype) == "int64", "the input was changed"`,
      solution: `import pandas as pd

def shrink(df):
    out = df.copy()
    for col in out.columns:
        if out[col].dtype == object:
            out[col] = out[col].astype("category")
        elif pd.api.types.is_integer_dtype(out[col]):
            out[col] = pd.to_numeric(out[col], downcast="integer")
    return out
`,
      hint: 'Loop over `out.columns`. `out[col].dtype == object` finds the text columns; `pd.api.types.is_integer_dtype(out[col])` finds the integers; floats are simply skipped. Work on `df.copy()`.',
    } },
    { pychallenge: {
      id: 'pandas-performance-ch4',
      prompt: 'Write `chunked_totals(path, key, value, chunksize)`. The CSV at `path` is too big to load at once. Read it with `pd.read_csv(..., chunksize=chunksize)`, using only the two columns `key` and `value`, and return a dict `{key: total of value}` of whole-number totals (plain Python ints), with the keys in sorted order. A key may appear in several chunks.',
      starter: `import pandas as pd

def chunked_totals(path, key, value, chunksize):
    # TODO: loop over the chunks, add each chunk's groupby sum into a dict
    return {}
`,
      tests: `import os
import shutil
import tempfile
import pandas as pd
d = tempfile.mkdtemp()
path = os.path.join(d, "t.csv")
rows = pd.DataFrame({
    "branch": ["A", "B", "A", "C", "B", "A", "C", "A", "B", "D"],
    "amount": [10, 20, 30, 40, 50, 60, 70, 80, 90, 5],
    "note": ["x"] * 10,
})
rows.to_csv(path, index=False)
r = chunked_totals(path, "branch", "amount", 3)
assert r == {"A": 180, "B": 160, "C": 110, "D": 5}, r
assert list(r) == ["A", "B", "C", "D"], list(r)
assert all(type(v) is int for v in r.values()), r
assert chunked_totals(path, "branch", "amount", 1000) == r
assert chunked_totals(path, "branch", "amount", 1) == r
shutil.rmtree(d)`,
      solution: `import pandas as pd

def chunked_totals(path, key, value, chunksize):
    totals = {}
    for chunk in pd.read_csv(path, usecols=[key, value], chunksize=chunksize):
        part = chunk.groupby(key)[value].sum()
        for k, v in part.items():
            totals[k] = totals.get(k, 0) + int(v)
    return dict(sorted(totals.items()))
`,
      hint: '`for chunk in pd.read_csv(path, usecols=[key, value], chunksize=chunksize):` gives DataFrames. Reduce each one with `chunk.groupby(key)[value].sum()` and add it into a dict with `totals[k] = totals.get(k, 0) + int(v)`. Sort the keys at the end.',
    } },
    { real: `You will meet both problems in your first data-engineering job. A consolidation that loops over three million GL lines with \`iterrows\` becomes a merge on the FX table, a vectorised multiplication and a \`groupby\`: minutes become seconds. A vendor file that does not fit in memory is read in chunks with only the columns you need, reduced to a few hundred partial totals, and written to Parquet once, so the next run reads it in a moment. The habit is the same each time: **measure**, replace the loop with a column operation or a smaller dtype, and **prove with a comparison that the numbers did not move**. Put that comparison in a test: a performance fix without a test is how a wrong total reaches the CFO faster.` },
    { interview: `**"Why is \`apply\` slow?"**
Model answer: "\`apply(axis=1)\` calls a Python function once for every row, and for each call pandas builds a Series for that row. So the cost is the Python interpreter overhead per row, not the pandas library. A vectorised expression runs once, in compiled code, over a whole typed column. I replace \`apply\` with column maths, \`np.where\` or \`np.select\`, \`map\`, \`merge\`, or the \`.str\` and \`.dt\` accessors, and I compare the new result with the old one."

**"How do you process a 10 GB CSV with pandas?"**
"I do not load it at once. I read it with \`chunksize\`, only the needed columns and explicit dtypes, reduce each chunk to a small partial result such as sums and counts per key, and combine the partials. A mean needs sum and count, not the mean of means. If the file is read often I convert it once to Parquet, which is smaller, typed and column-oriented. If pandas is still not enough, I move the work to a database, DuckDB or Spark."

**"How do you reduce the memory of a DataFrame?"**
"Look at \`memory_usage(deep=True)\` per column. Convert text with few distinct values to \`category\`, or text to Arrow strings, downcast integers, read only the columns I need, and never downcast money to float32. Then I check that the values are unchanged."` },
    { tip: `**Measure on your own laptop.** Put \`import time\` and \`t0 = time.perf_counter()\` before a step and \`print(time.perf_counter() - t0)\` after it. To see where a whole script spends its time, run \`python -m cProfile -s cumtime 06_performance.py\` in PowerShell and read the first 10 lines. In a notebook, \`%timeit\` repeats a line for you. Time the step that surprised you, not everything.` },
    `## Recap
- A **vectorised** column operation runs once in compiled code; a row loop pays interpreter cost per row. The ladder, slowest to fastest: \`iterrows\`, \`apply(axis=1)\`, \`itertuples\`, \`zip\` in a list, vectorised. \`iterrows\` also changes dtypes.
- Replace a row function with column maths, \`np.where\` / \`np.select\`, \`map\`, \`merge\`, \`isin\`, \`transform\`, \`pd.cut\`, \`.str\` / \`.dt\`. **Measure first, and compare the new answer with the old one.**
- Memory: \`memory_usage(deep=True)\`; \`category\` for few distinct labels; downcast integers; \`usecols\`; **never float32 for money**. Arrow-backed dtypes (\`string[pyarrow]\`, \`dtype_backend="pyarrow"\`) give compact text, native \`<NA>\` and a path to Parquet.
- Big files: \`read_csv(chunksize=...)\`, only the needed columns, a small partial answer per chunk, then combine. Sums, counts, min and max combine; a mean needs sum and count; a median does not. Convert to Parquet once if the file is read often.
- Arrow-backed columns need the \`pyarrow\` package (\`pip install pyarrow\` on your laptop, as in the first pandas task).`,
  ],
  quiz: [
    { q: 'Which way of computing a new column from three other columns is the slowest?', o: ['a vectorised expression such as `df["a"] * df["b"]`', 'a Python loop over `df.iterrows()`', '`np.where`', '`np.select`'], a: 1, why: '`iterrows` builds a whole Series object for every row and runs Python code per row, so it is the slowest of the common options. The others work on whole columns.' },
    { q: 'What makes `df.apply(f, axis=1)` slow?', o: ['it copies the file to disk first', 'it runs `f` in compiled code but sorts the rows first', 'it sends the rows to the graphics card', 'it calls a Python function once per row and builds a Series for each row'], a: 3, why: 'The cost is the Python call and the Series creation for every row. A vectorised expression is one call over the whole column.' },
    { q: 'A `branch` column has 5 distinct values across 1,00,000 rows. Which change cuts its memory the most?', o: ['`astype("int64")`', '`astype("float64")`', '`astype("category")`', '`pd.to_datetime`'], a: 2, why: 'A category stores each label once and keeps a small code per row, instead of a separate Python string for every row.' },
    { q: 'Why is `astype("float32")` a bad idea for a column of rupee amounts?', o: ['it turns the column into text', 'pandas refuses to do it', 'it keeps only about 7 significant digits, so totals over many rows change', 'it sorts the rows'], a: 2, why: 'float32 cannot represent large totals exactly: the total of 1,00,000 invoices was off by about two hundred rupees in the playground. Keep money in float64 or integer paise.' },
    { q: 'You must total `amount` per branch from a CSV that is bigger than memory. What do you do?', o: ['read it all with `read_csv` and buy more memory', 'read it in chunks, aggregate each chunk, and combine the partial results', 'open it in Excel and use a PivotTable', 'run `iterrows` over the whole file'], a: 1, why: '`chunksize` gives the file in pieces, so memory stays flat. Each chunk is reduced to a small partial total, and the partials are added at the end.' },
    { q: 'You read a file in chunks and need the mean amount per branch. What do you keep from each chunk?', o: ['the sum and the count per branch; divide at the end', 'the mean per branch; average them at the end', 'the median per branch', 'only the mean of the first chunk'], a: 0, why: 'The average of chunk averages is wrong when the chunks have different sizes. Sums and counts combine exactly, and the division happens once at the end.' },
  ],
  task: {
    title: 'Make a slow script fast, and prove it',
    steps: [
      'In `C:\\fde\\pandas-lab` create `06_performance.py`. Write `make_invoices(n)` as in the lesson (fixed seed) and build 200,000 invoices.',
      'Compute the invoice total three ways on the first 20,000 rows: `iterrows`, `apply(axis=1)` and vectorised. Time each one with `time.perf_counter`, print a small table and assert that all three agree with `np.allclose`.',
      'Replace the tier function from the lesson with `np.select` on the 220 Kollana orders and assert that both give the same labels.',
      'Print `memory_usage(deep=True)` for the 200,000 rows. Shrink them with `category` and downcast integers, print the new total and the factor, and assert that `assert_frame_equal` passes after converting back.',
      'Write the 200,000 rows to `invoices.csv`, then total `qty * unit_price` per branch in chunks of 50,000 rows with `usecols`. Assert that it equals the one-shot result and print the three numbers: file size, chunks read, and the match.',
      'Write two lines in a comment at the top: which step gave the biggest gain, and which check proves the numbers did not change.',
    ],
    deliverable: '`06_performance.py` and its output: the timing table, the memory before and after, and the chunk check.',
  },
};
