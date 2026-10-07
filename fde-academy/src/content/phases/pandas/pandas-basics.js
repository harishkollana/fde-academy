export default {
  id: 'pandas-basics',
  title: 'DataFrames: your Excel sheet as code',
  goal: 'You can load a CSV into a DataFrame, read its shape and dtypes, pick columns and rows with loc, iloc, boolean masks and query, add a computed column without a loop, and avoid the four classic traps (NaN, and vs &, chained assignment, sort ties).',
  roadmap: ['Series and DataFrame', 'read_csv and read_excel', 'dtypes', 'loc, iloc, boolean masks, query'],
  blocks: [
    `## The problem
Your Excel workbook is a grid. You click a cell, type a formula and drag it down. That works for one file. It stops working when the file has 2,00,000 rows, arrives every month, and a script must check it at 2 a.m. with nobody watching.

In Python you already know lists and dicts. A table of 220 orders is a list of 220 dicts, and "total amount per channel" is a loop you write by hand. It works, but it is long, slow on big files, and every new report needs a new loop.

**pandas** fixes this. Its main object, the **DataFrame**, is an Excel sheet that lives in memory, with two big differences: every column has **one type**, and a formula works on the **whole column at once**. Almost every finance automation you will write (a reconciliation, an MIS pack, loading a file into a database) is a chain of DataFrame steps: read, filter, compute, combine, write. This lesson teaches the object itself and the four ways to pick data out of it. Every later pandas lesson stands on it.`,
    `## What a DataFrame is made of
A DataFrame has three parts. Learn the words once, because every error message uses them.

| Part | What it is | Excel word |
|---|---|---|
| **Column** | one named list of values, all of **one dtype**. A single column on its own is called a **Series**. | a column of the sheet |
| **Index** | the row labels. By default \`0, 1, 2 …\`, but it can be anything: an \`order_id\`, a date. | the row numbers on the left |
| **dtype** | the type of a column: \`int64\` (whole numbers), \`float64\` (decimals), \`object\` (text, in the plain default), \`datetime64[ns]\` (dates), \`bool\`, \`category\` | the cell format |

**Why one dtype per column matters.** pandas stores each column as one block of numbers (a NumPy array). A formula such as \`orders["amount"] * 0.18\` is then one operation, done in compiled code, over the whole block. It is not 220 trips through Python. This is called **vectorisation**, and it is the first rule of fast pandas: if you write a Python \`for\` loop over the rows of a DataFrame, you have probably missed a vectorised way.

**Missing values.** An empty cell becomes \`NaN\` ("not a number") in number columns and in plain text columns; for dates it is \`NaT\`. \`NaN\` has one famous property: it is **not equal to anything, not even to itself**. You will pay for that in the traps below.`,
    { sketch: { w: 760, h: 330, caption: 'A DataFrame is an index plus named columns, and every column has exactly one dtype', items: [
      { t: 'text', x: 316, y: 40, text: 'columns: each one is a Series with ONE dtype', size: 15, bold: true },
      { t: 'table', x: 30, y: 62, cols: ['index'], colW: [70], rows: [['0'], ['1'], ['2'], ['22']], rowH: 32, fill: 'yellow' },
      { t: 'table', x: 100, y: 62, cols: ['order_id', 'channel', 'qty', 'amount', 'status'], colW: [86, 86, 60, 96, 104], rows: [['1', 'Direct', '3', '45000', 'Delivered'], ['2', 'Direct', '1', '87400', 'Delivered'], ['3', 'Partner', '5', '42275', 'Shipped'], ['23', 'Direct', '1', '8900', 'NaN']], rowH: 32 },
      { t: 'text', x: 65, y: 244, text: 'dtype', size: 15, bold: true },
      { t: 'text', x: 143, y: 244, text: 'int64', font: 'mono', size: 13 },
      { t: 'text', x: 229, y: 244, text: 'object', font: 'mono', size: 13 },
      { t: 'text', x: 302, y: 244, text: 'int64', font: 'mono', size: 13 },
      { t: 'text', x: 380, y: 244, text: 'int64', font: 'mono', size: 13 },
      { t: 'text', x: 480, y: 244, text: 'object', font: 'mono', size: 13 },
      { t: 'note', x: 556, y: 62, w: 194, h: 76, fill: 'blue', size: 14, text: 'df.shape gives\n(rows, columns)\nhere: (4, 5)' },
      { t: 'note', x: 556, y: 150, w: 194, h: 84, fill: 'pink', size: 14, text: 'NaN = missing.\nIt is not equal to\nanything, not even\nto NaN.' },
      { t: 'note', x: 30, y: 270, w: 720, h: 48, fill: 'green', size: 14, text: 'Excel: you edit cells one by one.   pandas: you compute on whole columns.\ndf["amount"] * 0.18 touches every row in one step, with no loop.' },
    ] } },
    `## Reading a file: read_csv and its options
\`pd.read_csv("file.csv")\` returns a DataFrame. pandas **guesses** every dtype from the data, and the guess is where bugs are born. These options tell it what you mean:

| Option | What it does | Why you care |
|---|---|---|
| \`dtype={"bank_account": "string"}\` | forces a type per column | IDs, GSTIN, IFSC, PAN and account numbers are **text**, even when they look like numbers. A leading zero is lost in an integer |
| \`parse_dates=["hire_date"]\` | reads those columns as real dates | date maths, sorting by date and \`resample\` need it |
| \`usecols=[...]\` | reads only these columns | less memory, faster |
| \`index_col="emp_id"\` | uses a column as the index | look up one employee by id with \`loc\` |
| \`na_values=["NA", "-", "n/a"]\` | extra texts that mean "missing" | ERP exports write "-" for an empty value |
| \`nrows=1000\` | reads only the first rows | peek at a 5 GB file safely |
| \`sep=";"\`, \`encoding="utf-8-sig"\`, \`thousands=","\` | delimiter, file encoding, thousands separator | CSVs saved from Excel often need \`utf-8-sig\` |
| \`skiprows\`, \`header\` | where the header row really is | title lines above the table |

\`pd.read_excel("MIS.xlsx", sheet_name="Apr", header=2)\` takes the same ideas, but it needs one extra package, \`openpyxl\`, that you install on your laptop. It is not available in the lesson playgrounds, so the Excel lesson teaches it with real code you run locally.`,
    { py: {
      title: 'Load orders and look before you touch anything',
      starter: `import pandas as pd
pd.set_option("display.width", 120)        # print wide tables on one screen
pd.set_option("display.max_columns", 20)

orders = pd.read_csv("orders.csv")         # the file is in the working folder
print(orders.shape)                        # (rows, columns)
print(orders.head(3))                      # the first rows
print(orders.dtypes)                       # ONE type per column
orders.info()                              # types and how many values are not missing
print(orders["amount"].describe())         # a quick summary of one column
print(orders["status"].value_counts(dropna=False))   # NaN is counted too`,
      note: 'Read the `info()` table: `status` has 211 non-null values out of 220, so 9 orders have no status. The `order_date` column is `object` (plain text), not a date yet. The next playground and the dates lesson fix that.',
    } },
    { py: {
      title: 'read_csv options: say what you mean',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

# Default: pandas guesses. bank_account looks like a number, so it becomes int64.
guess = pd.read_csv("employees.csv")
print(guess.dtypes[["hire_date", "bank_account", "pan"]])

# Say what you mean: text stays text, dates become dates, one column is the index.
emp = pd.read_csv(
    "employees.csv",
    usecols=["emp_id", "emp_name", "department", "hire_date", "annual_ctc", "bank_account"],
    dtype={"bank_account": "string"},
    parse_dates=["hire_date"],
    index_col="emp_id",
)
print(emp.dtypes)
print(emp.head(3))
print(emp.shape)
print(emp.loc[6])                          # one row, by its index label (emp_id 6)`,
      note: 'Try `nrows=5`. Then remove `usecols` and see the shape grow. A bank account that starts with 0 would lose its zero as `int64`: that is why account numbers are read as text.',
    } },
    `## Picking data: four tools
| You want | You write | You get |
|---|---|---|
| one column | \`df["amount"]\` | a Series |
| several columns | \`df[["order_id", "amount"]]\` (a **list** inside the brackets) | a DataFrame |
| rows and columns by **label** | \`df.loc[rows, columns]\` | whatever fits: a value, a Series or a DataFrame |
| rows and columns by **position** | \`df.iloc[rows, columns]\` | the same, counted from 0 |
| the rows that pass a test | \`df[mask]\` or \`df.query("...")\` | a DataFrame |

**loc is labels, iloc is positions.** The difference everyone trips on: a \`loc\` slice **includes** its end, an \`iloc\` slice **excludes** it, like a Python list. And a label is not a position. With \`order_id\` as the index, the row labelled 1 sits at position 0 (see the picture).

With the default index the two look the same, until you sort or filter. After \`sort_values\`, \`df.loc[0]\` is still the row *labelled* 0 wherever it moved to, while \`df.iloc[0]\` is the row that is now on top. That is why bugs hide here.`,
    { sketch: { w: 760, h: 330, caption: 'loc counts labels and includes the end; iloc counts positions from 0 and excludes the end', items: [
      { t: 'table', x: 40, y: 70, cols: ['pos', 'order_id', 'amount'], colW: [56, 84, 90], rows: [['0', '1', '45000'], ['1', '2', '87400'], ['2', '3', '42275'], ['3', '4', '136800'], ['4', '5', '138000']], rowH: 30, hl: [1, 2, 3], title: 'df.loc[2:4]   (labels)' },
      { t: 'table', x: 370, y: 70, cols: ['pos', 'order_id', 'amount'], colW: [56, 84, 90], rows: [['0', '1', '45000'], ['1', '2', '87400'], ['2', '3', '42275'], ['3', '4', '136800'], ['4', '5', '138000']], rowH: 30, hl: [2, 3], title: 'df.iloc[2:4]   (positions)' },
      { t: 'note', x: 40, y: 262, w: 230, h: 56, fill: 'yellow', size: 14, text: 'labels 2, 3 AND 4: 3 rows\nthe end label is included' },
      { t: 'note', x: 370, y: 262, w: 230, h: 56, fill: 'yellow', size: 14, text: 'positions 2 and 3: 2 rows\nthe end position is excluded' },
      { t: 'note', x: 616, y: 70, w: 134, h: 96, fill: 'grey', size: 13, text: 'The index here is\norder_id (set_index).\nPositions always\nstart at 0.' },
    ] } },
    `## Boolean masks: filter without a loop
A comparison on a column does not give one answer. It gives a **column of answers**. \`orders["channel"] == "Online"\` is a Series with one \`True\` or \`False\` per row. That Series is a **mask**. Put it inside square brackets and pandas keeps the rows where the mask is \`True\`.

Masks combine with \`&\` (and), \`|\` (or) and \`~\` (not). **Each comparison needs its own brackets**: \`(a == 1) & (b > 2)\`. Without the brackets Python reads the operators in the wrong order and fails with an error that mentions "ambiguous".

Helpers that return masks: \`isin([...])\` (is one of these), \`between(low, high)\` (both ends included), \`isna()\` and \`notna()\` (missing or not). The text helpers \`str.contains\` and friends come in the dates-and-text lesson.

\`query()\` is the same filter written as text: \`df.query("channel == 'Online' and amount > @limit")\`. Inside \`query\` you may write \`and\` and \`or\`, and \`@limit\` reads a Python variable. It reads well for short filters. Use real masks when the logic is long, computed or reused.`,
    { sketch: { w: 760, h: 320, caption: 'A mask is a column of True/False. & combines two masks, and df[mask] keeps the True rows', items: [
      { t: 'text', x: 111, y: 32, text: 'df  (5 sample rows)', size: 14, bold: true },
      { t: 'table', x: 14, y: 50, cols: ['order', 'channel', 'amount'], colW: [50, 76, 80], rows: [['1', 'Direct', '45000'], ['4', 'Online', '136800'], ['9', 'Online', '69000'], ['5', 'Online', '138000'], ['3', 'Partner', '42275']], rowH: 30 },
      { t: 'text', x: 275, y: 32, text: 'channel == "Online"', size: 14, bold: true },
      { t: 'table', x: 240, y: 50, cols: ['mask 1'], colW: [70], rows: [['False'], ['True'], ['True'], ['True'], ['False']], rowH: 30, fill: 'green' },
      { t: 'text', x: 410, y: 32, text: 'amount >= 100000', size: 14, bold: true },
      { t: 'table', x: 375, y: 50, cols: ['mask 2'], colW: [70], rows: [['False'], ['True'], ['False'], ['True'], ['False']], rowH: 30, fill: 'green' },
      { t: 'text', x: 545, y: 32, text: 'mask 1 & mask 2', size: 14, bold: true },
      { t: 'table', x: 510, y: 50, cols: ['both'], colW: [70], rows: [['False'], ['True'], ['False'], ['True'], ['False']], rowH: 30, fill: 'orange', hl: [1, 3] },
      { t: 'arrow', x1: 588, y1: 140, x2: 630, y2: 140 },
      { t: 'text', x: 692, y: 32, text: 'df[both]', size: 14, bold: true },
      { t: 'table', x: 636, y: 50, cols: ['order', 'amount'], colW: [50, 66], rows: [['4', '136800'], ['5', '138000']], rowH: 30, fill: 'yellow' },
      { t: 'note', x: 14, y: 250, w: 732, h: 56, fill: 'blue', size: 14, text: 'A comparison gives a True/False column. & | ~ combine masks; put every comparison in its own brackets.\nAnd order 9 is Online but small, so it fails mask 2 and drops out.' },
    ] } },
    { py: {
      title: 'Selecting: columns, loc, iloc, masks, query',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")

print(orders["amount"].head(3))                    # one column: a Series
print(orders[["order_id", "amount"]].head(3))      # a LIST of names: a DataFrame

s = orders.set_index("order_id")                   # order_id becomes the index
print(s.loc[2:4, "amount"])                        # loc: LABELS, the end is included
print(s.iloc[2:4, [3, 5]])                         # iloc: POSITIONS, the end is excluded
# (columns 3 and 5 are qty and amount: order_id is the index now, so it is not counted)

online = orders["channel"] == "Online"             # a Series of True / False
big = orders["amount"] >= 100000
print(online.head(3).tolist(), int(online.sum()), int(big.sum()))
print(len(orders[online & big]), "Online orders of one lakh or more")
print(len(orders[~orders["channel"].isin(["Online", "Direct"])]), "Partner orders")
print(len(orders[orders["amount"].between(50000, 100000)]), "orders from 50,000 to 1,00,000 (both ends included)")

# query() says the same thing as text; @name brings in a Python variable
limit = 300000
print(orders.query("channel == 'Online' and amount > @limit")[["order_id", "amount"]])`,
      note: 'Check by eye: `online & big` keeps 23 rows. Change `&` to `|` and the count jumps, because `|` keeps an order that passes either test. Then change `[3, 5]` to `[4, 6]` and see which columns you get.',
    } },
    { warn: `Four traps that cost an afternoon each:
- **\`and\` / \`or\` do not work on columns.** \`(a == 1) and (b > 2)\` raises *The truth value of a Series is ambiguous*. Use \`&\`, \`|\`, \`~\` and brackets.
- **NaN is not equal to anything, so \`!=\` keeps the missing rows.** \`orders["status"] != "Delivered"\` returns 102 rows, but only 93 orders have a known status other than Delivered. The other 9 are the missing ones. Decide what you mean and say it: \`df["status"].notna() & (df["status"] != "Delivered")\`.
- **Chained assignment changes a temporary copy.** \`df[df["qty"] > 10]["amount"] = 0\` first makes a new DataFrame with \`[...]\`, then assigns into *that*, so \`df\` is unchanged and pandas raises \`SettingWithCopyWarning\`. Write one \`.loc\` call instead: \`df.loc[df["qty"] > 10, "amount"] = 0\`.
- **\`b = a\` does not copy.** Both names point to the same DataFrame, so changing one changes the other. Use \`b = a.copy()\` when you want your own.` },
    { py: {
      title: 'Run the traps once so you recognise them',
      starter: `import warnings
import pandas as pd
orders = pd.read_csv("orders.csv")

# Trap 1: and / or do not work on columns
try:
    orders[(orders["channel"] == "Online") and (orders["amount"] > 1)]
except ValueError as e:
    print("and ->", str(e).split(".")[0])

# Trap 2: NaN is "not equal" to everything, so != keeps the missing rows
print("status != Delivered      :", int((orders["status"] != "Delivered").sum()))
print("known and != Delivered   :", int((orders["status"].notna() & (orders["status"] != "Delivered")).sum()))
print("missing status           :", int(orders["status"].isna().sum()))

# Trap 3: chained assignment changes a temporary copy
work = orders.copy()
with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    work[work["qty"] > 10]["amount"] = 0                 # looks right, does nothing
print("warning raised             :", [w.category.__name__ for w in caught])
print("zero amounts after chained :", int((work["amount"] == 0).sum()))
work.loc[work["qty"] > 10, "amount"] = 0                 # one .loc call: it works
print("zero amounts after .loc    :", int((work["amount"] == 0).sum()))

# Trap 4: b = a is not a copy
alias = orders
alias["flag"] = 1
print("orders changed through the alias:", "flag" in orders.columns)`,
      note: 'The alias line adds a `flag` column to `orders` itself. Run the playground twice: the second run starts from a fresh `read_csv`, so the output is the same.',
    } },
    `## New columns, and thinking in whole columns
You add a column by assigning to a name that does not exist yet. The right-hand side is column maths:

\`\`\`python
orders["gst"] = (orders["amount"] * 0.18).round(2)        # every row at once
orders["gross"] = orders["amount"] + orders["gst"]
orders["unit_value"] = orders["amount"] / orders["qty"]
\`\`\`

For an if-else per row, **do not loop**. Use \`np.where(test, value_if_true, value_if_false)\`. To translate codes into labels (a small VLOOKUP), use \`Series.map({...})\`: a value that is not in the dict, and every NaN, becomes NaN.

**Alignment.** When you add two Series, pandas matches **labels, not positions**. A label that exists on one side only gives NaN. This is a feature (a safe join on the index), and it is also a classic surprise. The playground shows it.

**Sorting.** \`sort_values(["amount", "order_id"], ascending=[False, True])\` sorts by several columns. Always add a **tie-breaker** column as the last key. Many orders have the same amount, and pandas does not promise any order among equal values, so two runs (or two machines) can print different rows.`,
    { py: {
      title: 'Computed columns, np.where, map, alignment and a stable sort',
      starter: `import numpy as np
import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")

# whole-column maths: no loop
orders["gst"] = (orders["amount"] * 0.18).round(2)         # assume 18 percent for this exercise
orders["gross"] = orders["amount"] + orders["gst"]
orders["unit_value"] = orders["amount"] / orders["qty"]
print(orders[["order_id", "qty", "amount", "gst", "gross", "unit_value"]].head(3))

# if-else per row without a loop
orders["size"] = np.where(orders["amount"] >= 100000, "large", "small")
print(orders["size"].value_counts())

# a code-to-label lookup with a dict (a tiny VLOOKUP)
orders["is_open"] = orders["status"].map({"Shipped": True, "Delivered": False, "Returned": False})
print(orders["is_open"].value_counts(dropna=False))      # the 9 missing statuses stay NaN

# sorting with a tie-breaker gives the same answer on every machine
top = orders.sort_values(["amount", "order_id"], ascending=[False, True]).head(3)
print(top[["order_id", "channel", "amount"]])

# alignment: labels are matched, not positions
a = pd.Series({"IN01": 100, "SG01": 50})
b = pd.Series({"SG01": 5, "US01": 7})
print(a + b)                                             # only SG01 exists on both sides`,
      note: 'The sum `a + b` shows `IN01` and `US01` as NaN because each exists on one side only. `a.add(b, fill_value=0)` treats a missing label as 0, which is what you want when adding two lists of totals.',
    } },
    { pychallenge: {
      id: 'pandas-basics-ch1',
      prompt: 'Write `online_big(df, limit)`. `df` has the columns of `orders.csv`. Return a **new** DataFrame with only the columns `order_id` and `amount`, for the rows whose `channel` is `"Online"` and whose `amount` is **at least** `limit`. Sort it by `amount` from biggest to smallest (ties: smaller `order_id` first) and give it a fresh index `0, 1, 2 …`.',
      starter: `def online_big(df, limit):
    # TODO: build a mask with &, pick the two columns, sort, then reset the index
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6],
    "channel": ["Online", "Online", "Direct", "Online", "Online", "Partner"],
    "amount": [150000, 90000, 500000, 150000, 100000, 200000],
    "status": ["Delivered", None, "Shipped", "Returned", "Delivered", "Delivered"],
})
r = online_big(df, 100000)
assert list(r.columns) == ["order_id", "amount"], list(r.columns)
assert r["order_id"].tolist() == [1, 4, 5], r["order_id"].tolist()
assert r["amount"].tolist() == [150000, 150000, 100000], r["amount"].tolist()
assert r.index.tolist() == [0, 1, 2], r.index.tolist()
assert list(df.columns) == ["order_id", "channel", "amount", "status"] and len(df) == 6
assert online_big(df, 10**7).empty`,
      solution: `def online_big(df, limit):
    mask = (df["channel"] == "Online") & (df["amount"] >= limit)
    out = df.loc[mask, ["order_id", "amount"]]
    return out.sort_values(["amount", "order_id"], ascending=[False, True]).reset_index(drop=True)
`,
      hint: 'Mask: `(df["channel"] == "Online") & (df["amount"] >= limit)`. Then `df.loc[mask, ["order_id", "amount"]]`, then `sort_values(["amount", "order_id"], ascending=[False, True])`, then `reset_index(drop=True)`.',
    } },
    { pychallenge: {
      id: 'pandas-basics-ch2',
      prompt: 'Write `delivered_share(df)`. `df` has a `status` column with the values `Delivered`, `Shipped`, `Returned` and missing values (NaN or None). Return the share of orders that are `Delivered` **among the orders that have a status**, as a float rounded to 4 decimals. Orders with a missing status are ignored. If no order has a status, return `0.0`.',
      starter: `def delivered_share(df):
    # TODO: drop the missing statuses first, then take the share of "Delivered"
    return 0.0
`,
      tests: `import pandas as pd
df = pd.DataFrame({"status": ["Delivered", "Shipped", None, "Delivered", "Returned", None, "Delivered", "Shipped"]})
assert delivered_share(df) == 0.5, delivered_share(df)
assert delivered_share(pd.DataFrame({"status": [None, None]})) == 0.0
assert delivered_share(pd.DataFrame({"status": ["Delivered"]})) == 1.0
assert delivered_share(pd.DataFrame({"status": ["Shipped", "Returned", "Shipped"]})) == 0.0
three = pd.DataFrame({"status": ["Delivered", "Shipped", "Returned"]})
assert delivered_share(three) == 0.3333, delivered_share(three)
assert delivered_share(pd.DataFrame({"status": pd.Series([], dtype="object")})) == 0.0`,
      solution: `def delivered_share(df):
    known = df["status"].dropna()
    if known.empty:
        return 0.0
    return round(float((known == "Delivered").mean()), 4)
`,
      hint: '`known = df["status"].dropna()` removes the missing values. The mean of a True/False Series is the share of True: `(known == "Delivered").mean()`. Guard the empty case before dividing.',
    } },
    { pychallenge: {
      id: 'pandas-basics-ch3',
      prompt: 'Write `add_gst(df, rate)`. `rate` is a percentage such as `18`. Return a **new** DataFrame equal to `df` plus two columns: `gst` = `amount * rate / 100` rounded to 2 decimals, and `gross` = `amount + gst` rounded to 2 decimals. The `df` you were given must **not** change (no new columns on it).',
      starter: `def add_gst(df, rate):
    # TODO: copy or assign, then add the two columns
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({"order_id": [1, 2, 3], "amount": [1000, 42275, 333]})
r = add_gst(df, 18)
assert r["gst"].tolist() == [180.0, 7609.5, 59.94], r["gst"].tolist()
assert r["gross"].tolist() == [1180.0, 49884.5, 392.94], r["gross"].tolist()
assert list(r.columns) == ["order_id", "amount", "gst", "gross"], list(r.columns)
assert list(df.columns) == ["order_id", "amount"], "the input DataFrame was changed"
assert add_gst(df, 5)["gst"].tolist() == [50.0, 2113.75, 16.65]
assert r is not df`,
      solution: `def add_gst(df, rate):
    out = df.copy()
    out["gst"] = (out["amount"] * rate / 100).round(2)
    out["gross"] = (out["amount"] + out["gst"]).round(2)
    return out
`,
      hint: '`out = df.copy()` gives you your own DataFrame, so assigning new columns cannot touch the original. `.assign(gst=..., gross=...)` on `df` also returns a new frame.',
    } },
    { real: `In your current automation you probably loop over \`ws.iter_rows()\` or a list of dicts: read a row, test it, add to a total. That code is 20 lines and slow on big sheets. The pandas version is a mask and a column: \`df[(df["status"] == "Overdue") & (df["amount"] > 100000)]["amount"].sum()\`. Three ideas carry most reporting code: **read with the right dtypes** (IDs as text, dates as dates), **filter with masks**, **compute with whole columns**. Get these right and the rest of the phase is variations. And check \`df.shape\` and \`df.dtypes\` the moment a file arrives: a changed shape or a column that suddenly turned into \`object\` is how you notice a bad export before it reaches the MIS.` },
    { interview: `**"What is a DataFrame?"**
Model answer: "A two-dimensional table with labelled columns and a labelled index. Each column is a Series with one dtype, stored as a typed array, which is why column operations are vectorised and fast. Rows are aligned by index label when I combine data."

**"\`loc\` versus \`iloc\`?"**
"\`loc\` selects by label and includes the end of a slice. \`iloc\` selects by integer position and excludes the end. They only look the same on a default index that has not been sorted or filtered. I use \`loc\` for business meaning (the row for this order) and \`iloc\` for position (the first five rows)."

**"What is \`SettingWithCopyWarning\` and how do you avoid it?"**
"It means I assigned into something that may be a copy of the data, for example \`df[mask]["col"] = x\`, so the change may be lost. I do the selection and the assignment in one \`.loc\` call, \`df.loc[mask, "col"] = x\`, or I call \`.copy()\` when I really want an independent frame. Newer pandas versions are moving towards a copy-on-write mode that removes the ambiguity, but the habit is the same."` },
    { local: `**Set up your pandas lab (once).** In PowerShell:
\`\`\`powershell
mkdir C:\\fde\\pandas-lab
cd C:\\fde\\pandas-lab
py -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install "pandas==2.3.3" pyarrow openpyxl
python -c "import pandas as pd; print(pd.__version__)"
\`\`\`
Expected output of the last line: \`2.3.3\`. The prompt starts with \`(.venv)\` while the environment is active. If PowerShell refuses to run \`Activate.ps1\`, use the fix in the Environments lesson of the Python phase. The course is written against pandas 2.3, which is what the playgrounds run, so pin that version; a newer major version may change some defaults, and its release notes list them.` },
    `## Recap
- A DataFrame is an **index plus named columns**; each column is a **Series with one dtype**. Column maths is vectorised: no loop over rows.
- \`read_csv\` guesses types, so say what you mean: \`dtype\` for IDs and account numbers (text), \`parse_dates\` for dates, \`usecols\` and \`nrows\` for big files, \`na_values\` for "-" and "NA".
- \`df["a"]\` is a Series, \`df[["a", "b"]]\` is a DataFrame. \`loc\` is **labels, end included**; \`iloc\` is **positions, end excluded**.
- A comparison gives a **mask**; combine masks with \`&\`, \`|\`, \`~\` and brackets; \`df[mask]\` keeps the True rows. \`isin\`, \`between\`, \`isna\` and \`query\` are the helpers.
- Traps: \`and\` instead of \`&\`, \`!=\` keeps NaN rows, chained assignment (use one \`.loc\`), \`b = a\` is not a copy, and sorting needs a tie-breaker.`,
  ],
  quiz: [
    { q: 'The index of `s` is `order_id` (1, 2, 3, 4, 5, …). How many rows do `s.loc[2:4]` and `s.iloc[2:4]` return?', o: ['2 and 3', '2 and 2', '3 and 2', '3 and 3'], a: 2, why: '`loc` counts labels and includes the end, so labels 2, 3 and 4 give three rows. `iloc` counts positions from 0 and excludes the end, so positions 2 and 3 give two rows.' },
    { q: 'Which line keeps the Online orders of one lakh or more?', o: ['`df[df.channel == "Online" and df.amount >= 100000]`', '`df[(df["channel"] == "Online") & (df["amount"] >= 100000)]`', '`df[df["channel"] == "Online" & df["amount"] >= 100000]`', '`df["Online" & 100000]`'], a: 1, why: 'Masks combine with `&`, and each comparison needs its own brackets. `and` raises an "ambiguous" error, and without brackets `&` binds before `==`.' },
    { q: '`(orders["status"] != "Delivered").sum()` returns 102, but only 93 orders have a known status other than Delivered. Why?', o: ['the 9 orders with a missing status (NaN) also count as "not equal to Delivered"', 'pandas counts every order twice that was returned', '`!=` compares text with numbers and rounds up', 'the `sum()` function adds one for the header row'], a: 0, why: 'NaN is not equal to anything, so `NaN != "Delivered"` is True. 93 known statuses plus 9 missing ones make 102. Add `notna()` to the mask if you mean only known statuses.' },
    { q: 'Why does `work[work["qty"] > 10]["amount"] = 0` leave `work` unchanged?', o: ['the column `amount` is read-only', '`qty` has to be a string to be compared', 'pandas ignores assignments that contain a number', 'the first `[...]` returns a new DataFrame and the assignment goes into that temporary copy'], a: 3, why: 'Chained indexing makes a temporary object first. Use one `.loc` call, `work.loc[work["qty"] > 10, "amount"] = 0`, so the assignment targets the real frame.' },
    { q: 'Why is `df["amount"] * 0.18` so much faster than a Python `for` loop over the rows?', o: ['pandas skips rows that are zero', 'the column is one typed array and the multiplication runs in compiled code over all of it', 'pandas always runs its maths on the graphics card', 'pandas caches every multiplication result on disk'], a: 1, why: 'A column is stored as one block of same-type values (a NumPy array). One compiled operation handles the whole block; a Python loop pays the interpreter cost on every row.' },
    { q: '`read_csv("employees.csv")` gives `bank_account` the dtype `int64`. How do you keep it as text and keep any leading zeros?', o: ['`parse_dates=["bank_account"]`', '`index_col="bank_account"`', '`dtype={"bank_account": "string"}`', '`nrows=0`'], a: 2, why: 'IDs and account numbers are text, not quantities. `dtype=` tells `read_csv` to skip the number guess for that column, so leading zeros survive.' },
  ],
  task: {
    title: 'Open the Kollana files in your own pandas lab',
    steps: [
      'Set up the lab with the `local` callout above (folder `C:\\fde\\pandas-lab`, virtual environment, pandas 2.3.3, pyarrow, openpyxl). Keep this folder for the whole pandas phase.',
      'Export all 13 practice tables from your PostgreSQL database into it. In PowerShell: `cd C:\\fde\\pandas-lab`, then `foreach ($t in "dim_entity","dim_bu","dim_account","fx_rates","fact_gl","fact_budget","employees","payroll","purchase_register","supplier_invoices","products","customers","orders") { psql -U postgres -d fde_practice -c "\\copy $t TO \'$t.csv\' WITH (FORMAT csv, HEADER true)" }`. Set `$env:PGPASSWORD` first if you do not want to type the password 13 times. You should see 13 `.csv` files. (The tables you exported earlier into `C:\\fde\\py-recap` are the same files.)',
      'Create `01_basics.py`. Read `orders.csv` with `parse_dates=["order_date"]`. Print `shape`, `dtypes` and `info()`. Check that `order_date` is now `datetime64[ns]`.',
      'Read `employees.csv` with the bank account and PAN as text. Print the employees whose `pan` is missing using `isna()`. You should find two (employees 9 and 18).',
      'Write one mask that selects Partner orders with `qty` of 5 or more and `status` Delivered. Print the count, then print the same count with `query()`. Both must match.',
      'Add the columns `gst` (18 percent) and `gross` to a copy of the orders, and write the result to `orders_gross.csv` with `to_csv(index=False)`. Open it in Excel and check three rows by hand.',
    ],
    deliverable: '`01_basics.py` and its output, with a one-line comment above each of the masks saying what it means in business words.',
  },
};
