export default {
  id: 'pandas-combine',
  title: 'Combining data: merge, concat, pivot and melt',
  goal: 'You can join two DataFrames on a key and prove the row count is right (merge with validate and indicator), stack monthly files with concat, attach a number per key with join, and reshape between wide and long with pivot_table and melt.',
  roadmap: ['merge with validate=', 'concat', 'join', 'pivot_table', 'melt'],
  blocks: [
    `## The problem
Real work is never one table. Orders need the customer's segment. GL lines need an exchange rate. The books need to be compared with what the supplier filed. Twelve monthly files need to become one. And a manager wants the answer as a grid with channels across the top, while Power BI wants it as a long list.

In Excel you do these with VLOOKUP, copy-paste and PivotTables. In pandas there are three families:

| Job | Tool | SQL word |
|---|---|---|
| put rows **under** rows (same columns) | \`pd.concat\` | \`UNION ALL\` |
| put columns **next to** columns, matched on a key | \`merge\` (and \`join\`, which merges on the index) | \`JOIN\` |
| change the **shape** of one table: wide to long and back | \`melt\` and \`pivot_table\` | \`UNPIVOT\` / \`PIVOT\` |

The danger is the same in all three: **a silent wrong answer**. A join that duplicates rows doubles a total and raises no error. This lesson teaches you to combine data and then **prove** the result is right.`,
    `## merge: join on a key
\`left.merge(right, on="customer_id", how="left")\` returns every row of \`left\` with the matching columns of \`right\` added. The words you need:

- **\`on\`** is the key column(s) with the same name on both sides. Use \`left_on="a", right_on="b"\` when the names differ. Several columns make a **compound key**: \`on=["currency", "rate_month"]\`.
- **\`how\`** decides which rows survive: \`inner\` (only keys found on both sides, **the default**), \`left\` (all left rows, NaN where the right has no match), \`right\`, \`outer\` (everything).
- **\`suffixes=("_books", "_gstr")\`** renames columns that exist on both sides but are not the key. Without it you get \`amount_x\` and \`amount_y\`.
- **\`indicator=True\`** adds a column \`_merge\` with the value \`both\`, \`left_only\` or \`right_only\` for each row. It is your audit trail: count it.
- **\`validate="m:1"\`** states what you believe about the keys: \`"1:1"\`, \`"m:1"\` (many left rows, one right row per key), \`"1:m"\`, \`"m:m"\`. If the data disagrees, pandas stops with a \`MergeError\` (a kind of \`ValueError\`) instead of returning a wrong table.

**Fan-out** is the bug that \`validate\` prevents. If the right table has the same key twice, every matching left row is copied twice, and a total that was ₹350 becomes ₹650. In a lookup (a fact table joined to a dimension such as customers, accounts or rates) the right side must have **one row per key**: say so with \`validate="m:1"\`.`,
    { sketch: { w: 760, h: 330, caption: 'An outer merge with indicator=True shows exactly which rows matched and which stayed alone', items: [
      { t: 'table', x: 14, y: 50, cols: ['order_id', 'customer_id'], colW: [80, 100], rows: [['1', '8'], ['3', '6'], ['77', '99']], rowH: 28, title: 'orders (left)' },
      { t: 'table', x: 14, y: 200, cols: ['customer_id', 'customer_name'], colW: [100, 150], rows: [['6', 'Falcon Logistics'], ['8', 'Horizon Realty'], ['11', 'Kite Media']], rowH: 28, title: 'customers (right)' },
      { t: 'arrow', x1: 200, y1: 96, x2: 326, y2: 96 },
      { t: 'arrow', x1: 268, y1: 256, x2: 360, y2: 190 },
      { t: 'table', x: 336, y: 50, cols: ['order_id', 'customer_id', 'customer_name', '_merge'], colW: [76, 104, 136, 96], rows: [['1', '8', 'Horizon Realty', 'both'], ['3', '6', 'Falcon Logistics', 'both'], ['77', '99', 'NaN', 'left_only'], ['NaN', '11', 'Kite Media', 'right_only']], rowH: 28, hl: [2, 3], title: 'how="outer", indicator=True' },
      { t: 'note', x: 396, y: 214, w: 350, h: 100, fill: 'yellow', size: 14, text: 'how= decides which rows survive:\ninner: only "both"\nleft: both + left_only\nright: both + right_only\nouter: all three' },
    ] } },
    { py: {
      title: 'Orders and customers: how=, indicator, validate',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")
customers = pd.read_csv("customers.csv")

# orders is the LEFT table: it names the rows we want to keep
for how in ["inner", "left", "right", "outer"]:
    n = len(orders.merge(customers, on="customer_id", how=how))
    print(f"{how:<6} {n} rows")

# indicator=True adds a column that says where each row came from
audit = orders.merge(customers, on="customer_id", how="outer", indicator=True)
print(audit["_merge"].value_counts())
print(audit[audit["_merge"] != "both"][["order_id", "customer_id", "customer_name", "amount", "_merge"]])

# the normal job, wrapped once so you never forget the checks
def safe_merge(left, right, on, how="left", validate="m:1"):
    before = len(left)
    out = left.merge(right, on=on, how=how, validate=validate, indicator=True)
    print("merge result:", out["_merge"].value_counts().to_dict())
    if how == "left":
        assert len(out) == before, f"row count changed: {before} -> {len(out)}"
    return out.drop(columns="_merge")

enriched = safe_merge(orders, customers[["customer_id", "customer_name", "segment"]], on="customer_id")
print(enriched.groupby("segment", dropna=False)["amount"].sum())

# when validate fails, find the guilty keys: pretend the customer master has a duplicate row
master = pd.concat([customers, customers.iloc[[0]]], ignore_index=True)
print(master[master.duplicated("customer_id", keep=False)][["customer_id", "customer_name"]])
try:
    safe_merge(orders, master, on="customer_id")
except pd.errors.MergeError as e:
    print("validate caught it:", e)
print(len(orders.merge(master, on="customer_id", how="left")), "rows without validate (it was", len(orders), ")")`,
      note: 'Same data as the SQL join lesson, tables the other way round: with `orders` on the left, LEFT gives 220 and RIGHT gives 221 (in SQL, with customers on the left, it was the opposite). Order 77 has customer 99, who does not exist, so its segment is NaN. Customers 11 and 12 never ordered. The duplicated master row (customer 1 has 20 orders) would have turned 220 rows into 240 without `validate`.',
    } },
    { py: {
      title: 'GL lines and FX rates: a compound key, fan-out, and merge_asof',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
gl = pd.read_csv("fact_gl.csv")
fx = pd.read_csv("fx_rates.csv")
gl["rate_month"] = gl["posting_date"].str[:7] + "-01"     # "2026-02-17" -> "2026-02-01"

# the right key: currency AND month. validate="m:1": many GL lines, ONE rate per key
j = gl.merge(fx, on=["currency", "rate_month"], how="left", validate="m:1", indicator=True)
print(len(gl), "->", len(j), "rows")
print(j["_merge"].value_counts())
print(j[j["_merge"] == "left_only"].groupby(["currency", "rate_month"]).size())

# the classic mistake: join on currency only. Every line matches every month's rate.
wrong = gl.merge(fx, on="currency", how="left")
print("join on currency only:", len(wrong), "rows (it was", len(gl), ")")
try:
    gl.merge(fx, on="currency", how="left", validate="m:1")
except pd.errors.MergeError as e:
    print("validate caught it:", e)

# a policy for the missing month: the last known rate (merge_asof: both sides sorted by date)
left = gl.drop(columns="rate_month").assign(posting_date=pd.to_datetime(gl["posting_date"])).sort_values("posting_date")
right = fx.assign(rate_month=pd.to_datetime(fx["rate_month"])).sort_values("rate_month")
asof = pd.merge_asof(left, right, left_on="posting_date", right_on="rate_month", by="currency", direction="backward")
print("missing rates after merge_asof:", int(asof["rate_to_inr"].isna().sum()))
feb = asof[(asof["currency"] == "SGD") & (asof["posting_date"].dt.strftime("%Y-%m") == "2026-02")]
print(len(feb), "SGD lines of Feb 2026 now use", feb["rate_to_inr"].unique().tolist(), "from", feb["rate_month"].dt.strftime("%Y-%m-%d").unique().tolist())`,
      note: 'The correct compound key keeps 1,227 rows and shows the 34 SGD lines of February 2026 that have no rate. Joining on the currency alone gives 14,316 rows: a silent explosion. `merge_asof` fills the gap with the last known rate (January), but that is a **policy**: ask finance whether January, an average or a manual rate is right before you use it.',
    } },
    `## The merge checklist
Run these checks every time, in this order. They take a minute and they catch almost every wrong merge.

1. **Clean the keys on both sides.** \`str.strip()\`, \`str.upper()\`, the same dtype (read IDs as text), and no missing keys (\`dropna(subset=["customer_id"])\` or flag them first).
2. **Find out if the right side is unique.** For a lookup, \`right.duplicated("customer_id").sum()\` must be 0. To see the guilty rows: \`right[right.duplicated("customer_id", keep=False)]\`.
3. **Say \`how=\` and \`validate=\` in the call.** They are documentation that the computer checks.
4. **After the merge, count.** Rows before and after; the \`_merge\` counts; the total of the amount column before and after.
5. **Decide what the unmatched rows mean.** An order with a customer that does not exist is a data-quality finding, not something to hide with \`fillna\`.

The first playground above wraps steps 3 and 4 in one small function, \`safe_merge\`. Copy it into your own toolkit: you will use it again in the reconciliation lab. The picture below shows what step 2 protects you from.`,
    { sketch: { w: 760, h: 345, caption: 'A duplicate key on the right makes every matching left row appear twice: the total doubles and nothing complains, unless you say validate="m:1"', items: [
      { t: 'table', x: 14, y: 60, cols: ['order', 'customer', 'amount'], colW: [56, 80, 70], rows: [['1', '1', '100'], ['2', '1', '200'], ['3', '2', '50']], rowH: 28, title: 'orders: total 350' },
      { t: 'table', x: 14, y: 214, cols: ['customer', 'name'], colW: [80, 150], rows: [['1', 'Apex Retail'], ['1', 'Apex Retail Ltd'], ['2', 'Blue Lotus Hotels']], rowH: 28, title: 'customers (key 1 twice!)', fill: 'pink' },
      { t: 'arrow', x1: 226, y1: 100, x2: 326, y2: 100 },
      { t: 'arrow', x1: 252, y1: 268, x2: 340, y2: 214 },
      { t: 'table', x: 336, y: 60, cols: ['order', 'customer', 'name', 'amount'], colW: [56, 80, 150, 70], rows: [['1', '1', 'Apex Retail', '100'], ['1', '1', 'Apex Retail Ltd', '100'], ['2', '1', 'Apex Retail', '200'], ['2', '1', 'Apex Retail Ltd', '200'], ['3', '2', 'Blue Lotus Hotels', '50']], rowH: 28, hl: [1, 3], title: 'merge result: 5 rows, total 650' },
      { t: 'note', x: 336, y: 250, w: 410, h: 78, fill: 'pink', size: 14, text: 'validate="m:1" says: ONE row per key on the right.\nWith the duplicate customer, pandas stops with a\nMergeError instead of returning the wrong total.' },
    ] } },
    { warn: `Merge traps that give wrong answers quietly:
- **Missing keys match each other.** In pandas a NaN or None key **does** match another NaN key, unlike SQL where NULL never matches. Two invoices without a GSTIN on the left and one on the right become two joined rows. Drop or flag rows with missing keys before you merge.
- **Whitespace and case.** \`"INV/2 "\` does not match \`"INV/2"\`, and nothing tells you. \`strip()\` and normalise keys on both sides first (the dates-and-text lesson).
- **The default is \`how="inner"\`.** Rows without a match vanish silently. Say \`how=\` every time, and compare the row count with what you expect.
- **Key types.** Merging an \`int64\` column with an \`object\` (text) column raises a \`ValueError\` that names the key. Read ID columns as text on both sides.
- **Overlapping column names** get \`_x\` and \`_y\`. Pass \`suffixes=\` with names that mean something.
- **\`concat\` with different column names does not stack them.** A column called \`Amount\` and a column called \`amount\` become two columns, each half full of NaN.` },
    `## concat and join: stacking and attaching
\`pd.concat([jan, feb, mar])\` puts the frames **one under the other**. Three options matter:

- \`ignore_index=True\` gives a clean \`0, 1, 2 …\` index. Without it, each file keeps its own index and you get duplicates such as three rows labelled 0.
- \`keys=["jan", "feb"]\` adds an outer index level that remembers which file each row came from. A column made with \`assign(source="2026-08")\` does the same job and is easier to use later.
- Columns are matched **by name**, and a column missing in one frame is filled with NaN. So always look at \`columns\` of every file before you stack them.

\`join\` is \`merge\` on the **index**: \`emp.join(gross)\` attaches the Series \`gross\` (indexed by \`emp_id\`) to the employee table. It is handy right after a \`groupby\`, because the group keys are the index.`,
    { py: {
      title: 'Stack two monthly files, avoid the header trap, join a groupby result',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
pd.set_option("display.max_columns", 20)
aug = pd.read_csv("input/sales_2026-08.csv")
sep = pd.read_csv("input/sales_2026-09.csv")
print(aug.shape, sep.shape)

# concat stacks rows. ignore_index gives a clean 0..n-1 index; assign() remembers the source file
sales = pd.concat([aug.assign(source="2026-08"), sep.assign(source="2026-09")], ignore_index=True)
print(sales.shape, "| unique order ids:", sales["order_id"].is_unique)
print(sales["source"].value_counts())

# keys= builds a two-level index instead
two_level = pd.concat([aug, sep], keys=["2026-08", "2026-09"])
print(two_level.loc["2026-09"].head(2))

# trap: a header spelled differently does not stack, it makes a NEW column full of NaN
odd = sep.rename(columns={"amount": "Amount"})
bad = pd.concat([aug, odd])
print(bad[["amount", "Amount"]].isna().sum())
# fix: normalise the headers before stacking
fixed = pd.concat([f.rename(columns=str.lower) for f in (aug, odd)], ignore_index=True)
print(int(fixed["amount"].isna().sum()), "missing amounts after normalising the headers")

# join = merge on the INDEX: attach one number per employee
emp = pd.read_csv("employees.csv").set_index("emp_id")
pay = pd.read_csv("payroll.csv")
gross = pay.groupby("emp_id")["gross_pay"].sum().rename("gross_aug_sep")
print(emp[["emp_name", "department"]].join(gross).head(3))`,
      note: 'The August file has 59 orders and the September file has 60, with different order ids, so the stacked table has 119 unique ids. The wrongly spelled `Amount` column leaves 60 missing values in `amount` and 59 in `Amount`: no error, just holes.',
    } },
    `## pivot_table and melt: wide and long
The same numbers can be laid out two ways.

- **Wide**: one row per month, one **column per channel**. This is how people read a report, and how an Excel PivotTable looks.
- **Long** (also called *tidy*): one row per month **and** channel, with the channel as a normal column. This is what \`groupby\`, filters, charts and Power BI want: a new channel is a new row, not a new column.

\`pivot_table(index=..., columns=..., values=..., aggfunc=...)\` goes long to wide, and **adds up** rows that share a cell. Useful options: \`fill_value=0\` for empty cells, \`margins=True\` for a Total row and column. \`melt(id_vars=..., var_name=..., value_name=...)\` goes wide to long.`,
    { sketch: { w: 760, h: 320, caption: 'melt turns columns into rows (wide to long); pivot_table turns rows into columns and adds up duplicates (long to wide)', items: [
      { t: 'table', x: 14, y: 60, cols: ['month', 'Direct', 'Online', 'Partner'], colW: [70, 76, 76, 76], rows: [['2025-04', '1599685', '235530', '184095'], ['2025-05', '236600', '21600', '570590']], rowH: 30, title: 'wide: one column per channel' },
      { t: 'note', x: 14, y: 168, w: 298, h: 86, fill: 'yellow', size: 13, text: 'Easy to read, like a PivotTable.\nBad for groupby, filters and Power BI:\na new channel means a new column.' },
      { t: 'arrow', x1: 322, y1: 90, x2: 452, y2: 90, label: 'melt', ly: -12 },
      { t: 'arrow', x1: 452, y1: 138, x2: 322, y2: 138, label: 'pivot_table', ly: 18 },
      { t: 'table', x: 460, y: 60, cols: ['month', 'channel', 'amount'], colW: [76, 84, 84], rows: [['2025-04', 'Direct', '1599685'], ['2025-04', 'Online', '235530'], ['2025-04', 'Partner', '184095'], ['2025-05', 'Direct', '236600'], ['2025-05', 'Online', '21600'], ['2025-05', 'Partner', '570590']], rowH: 30, fill: 'green', title: 'long: one row per month and channel' },
      { t: 'note', x: 14, y: 268, w: 430, h: 40, fill: 'blue', size: 14, text: 'Same 6 numbers. Wide is for people, long is for tools.' },
    ] } },
    { py: {
      title: 'pivot_table with totals, wide to long and back, and a payroll comparison',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")

# pivot_table: the Excel PivotTable
pt = orders.pivot_table(index="channel", columns="status", values="amount", aggfunc="sum", margins=True, margins_name="Total")
print(pt)
print("amount of orders with NO status, missing from this table:", int(orders["amount"].sum() - pt.loc["Total", "Total"]))
counts = orders.pivot_table(index="channel", columns="status", values="order_id", aggfunc="count", fill_value=0)
print(counts)

# wide -> long -> wide
orders["month"] = orders["order_date"].str[:7]
wide = orders.pivot_table(index="month", columns="channel", values="amount", aggfunc="sum", fill_value=0)
print(wide.head(3))
long = wide.reset_index().melt(id_vars="month", var_name="channel", value_name="amount")
print(long.head(4))
print(long.shape, "rows = 12 months x 3 channels; total", int(long["amount"].sum()))
back = long.pivot_table(index="month", columns="channel", values="amount", aggfunc="sum")
print("round trip gives the same table:", back.equals(wide))

# payroll: one column per run month makes "September minus August" a one-liner
pay = pd.read_csv("payroll.csv")
cmp = pay.pivot_table(index="emp_id", columns="run_month", values="gross_pay", aggfunc="sum")
cmp["change"] = cmp["2026-09-01"] - cmp["2026-08-01"]
print(cmp[cmp["change"] != 0])`,
      note: 'The Total of the pivot is 20,404,865, not 20,980,275: the 9 orders without a status have no column, so they are left out, exactly like in `groupby`. The long table adds up to 20,980,275 again.',
    } },
    { py: {
      title: 'GST: why GSTIN alone is not a key',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
books = pd.read_csv("purchase_register.csv")        # our books: 30 invoices
gstr = pd.read_csv("supplier_invoices.csv")         # what the suppliers filed: 29 invoices
print(len(books), len(gstr))

# a supplier files many invoices, so the GSTIN alone is NOT a key
print("merge on supplier_gstin only :", len(books.merge(gstr, on="supplier_gstin")), "rows")
print("merge on GSTIN + invoice_no  :", len(books.merge(gstr, on=["supplier_gstin", "invoice_no"])), "rows")
try:
    books.merge(gstr, on="supplier_gstin", validate="1:1")
except pd.errors.MergeError as e:
    print("validate caught it:", e)

# the honest comparison: outer merge on the full key, audit with indicator, suffixes name the sides
both = books.merge(gstr, on=["supplier_gstin", "invoice_no"], how="outer", suffixes=("_books", "_gstr"), indicator=True)
print(both["_merge"].value_counts())
print(both[both["_merge"] == "left_only"][["supplier_gstin", "invoice_no", "taxable_value_books"]])`,
      note: 'Joining on the GSTIN alone gives 156 rows from two files of about 30 invoices each. The full key gives 23 exact matches, 7 invoices only in the books and 6 only in the supplier file. The unmatched ones are not all missing: some have a typo in the invoice number or a wrong last character in the GSTIN. The reconciliation lab at the end of this phase matches them in passes.',
    } },
    { pychallenge: {
      id: 'pandas-combine-ch1',
      prompt: 'Write `merge_audit(left, right, key)`. `key` is the name of a column that both frames have. Do an **outer** merge with `indicator=True` and return a dict with exactly the keys `"both"`, `"left_only"` and `"right_only"`, whose values are the number of **rows of the merged result** in each group (plain Python ints, `0` when a group is empty).',
      starter: `def merge_audit(left, right, key):
    # TODO: outer merge with indicator=True, then count the _merge values
    return {}
`,
      tests: `import pandas as pd
left = pd.DataFrame({"k": [1, 2, 3, 3], "x": ["a", "b", "c", "d"]})
right = pd.DataFrame({"k": [3, 4, 5], "y": [10, 20, 30]})
r = merge_audit(left, right, "k")
assert r == {"both": 2, "left_only": 2, "right_only": 2}, r
assert all(type(v) is int for v in r.values()), r
same = merge_audit(left, left, "k")
assert same["left_only"] == 0 and same["right_only"] == 0 and same["both"] == 6, same
empty = merge_audit(left, right.iloc[0:0], "k")
assert empty == {"both": 0, "left_only": 4, "right_only": 0}, empty
assert list(left.columns) == ["k", "x"]`,
      solution: `def merge_audit(left, right, key):
    merged = left.merge(right, on=key, how="outer", indicator=True)
    counts = merged["_merge"].value_counts()
    return {name: int(counts.get(name, 0)) for name in ["both", "left_only", "right_only"]}
`,
      hint: '`left.merge(right, on=key, how="outer", indicator=True)["_merge"].value_counts()` counts the three values. Build the dict with `int(counts.get(name, 0))` so a missing group becomes 0.',
    } },
    { pychallenge: {
      id: 'pandas-combine-ch2',
      prompt: 'Write `attach_rate(gl, fx)`. `gl` has the columns `gl_id`, `currency`, `month` (text like `"2026-01"`) and `debit`. `fx` has `currency`, `month` and `rate_to_inr`. Return `gl` with two extra columns: `rate_to_inr` and `debit_inr` (= `debit * rate_to_inr`, rounded to 2 decimals, NaN when there is no rate). Keep **every** `gl` row in its original order. If `fx` has the same `(currency, month)` twice, raise a `ValueError`: use `validate="m:1"`.',
      starter: `def attach_rate(gl, fx):
    # TODO: left merge on the compound key with validate="m:1", then compute debit_inr
    return gl
`,
      tests: `import math
import pandas as pd
gl = pd.DataFrame({
    "gl_id": [1, 2, 3, 4],
    "currency": ["INR", "SGD", "SGD", "USD"],
    "month": ["2026-01", "2026-01", "2026-02", "2026-01"],
    "debit": [100.0, 10.0, 10.0, 5.0],
})
fx = pd.DataFrame({
    "currency": ["USD", "INR", "SGD"],
    "month": ["2026-01", "2026-01", "2026-01"],
    "rate_to_inr": [83.21, 1.0, 62.37],
})
r = attach_rate(gl, fx)
assert r["gl_id"].tolist() == [1, 2, 3, 4], r["gl_id"].tolist()
assert r["debit_inr"].tolist()[:2] == [100.0, 623.7], r["debit_inr"].tolist()
assert math.isnan(r["debit_inr"].iloc[2]) and math.isnan(r["rate_to_inr"].iloc[2])
assert r["debit_inr"].iloc[3] == 416.05, r["debit_inr"].iloc[3]
assert len(r) == len(gl)
dup = pd.concat([fx, fx.iloc[[2]]], ignore_index=True)
try:
    attach_rate(gl, dup)
    raise AssertionError("expected an error for the duplicate rate")
except ValueError:
    pass
assert list(gl.columns) == ["gl_id", "currency", "month", "debit"]`,
      solution: `def attach_rate(gl, fx):
    out = gl.merge(fx, on=["currency", "month"], how="left", validate="m:1")
    out["debit_inr"] = (out["debit"] * out["rate_to_inr"]).round(2)
    return out
`,
      hint: '`gl.merge(fx, on=["currency", "month"], how="left", validate="m:1")` keeps all `gl` rows in order and raises `MergeError` (a `ValueError`) when `fx` has a duplicate key. Then add `debit_inr` with `(out["debit"] * out["rate_to_inr"]).round(2)`.',
    } },
    { pychallenge: {
      id: 'pandas-combine-ch3',
      prompt: 'Write `month_matrix(df)`. `df` is long, with the columns `month`, `channel` and `amount`, and several rows may share a month and channel. Return a **wide** DataFrame: the column `month` first, then one column per channel in A-to-Z order, each cell the **sum** of `amount`, `0` where there is no data. The index must be `0, 1, 2 …` and the columns must have no name (`result.columns.name is None`).',
      starter: `def month_matrix(df):
    # TODO: pivot_table with fill_value=0, clear columns.name, reset_index
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "month": ["2025-05", "2025-04", "2025-04", "2025-04", "2025-05"],
    "channel": ["Online", "Online", "Direct", "Online", "Online"],
    "amount": [10, 20, 5, 30, 1],
})
r = month_matrix(df)
assert list(r.columns) == ["month", "Direct", "Online"], list(r.columns)
assert r["month"].tolist() == ["2025-04", "2025-05"], r["month"].tolist()
assert r["Direct"].tolist() == [5, 0], r["Direct"].tolist()
assert r["Online"].tolist() == [50, 11], r["Online"].tolist()
assert r.index.tolist() == [0, 1]
assert r.columns.name is None`,
      solution: `def month_matrix(df):
    wide = df.pivot_table(index="month", columns="channel", values="amount", aggfunc="sum", fill_value=0)
    wide.columns.name = None
    return wide.reset_index()
`,
      hint: '`df.pivot_table(index="month", columns="channel", values="amount", aggfunc="sum", fill_value=0)` does the sum and the zeros. The columns carry the name `channel`: set `wide.columns.name = None`, then `reset_index()` turns `month` back into a column.',
    } },
    { pychallenge: {
      id: 'pandas-combine-ch4',
      prompt: 'Write `unpivot(wide)`. `wide` has a `month` column and one column per channel. Return the **long** version with the columns `month`, `channel`, `amount`, sorted by `month` and then `channel` (A to Z), with the index `0, 1, 2 …`.',
      starter: `def unpivot(wide):
    # TODO: melt with id_vars, then sort and reset the index
    return wide
`,
      tests: `import pandas as pd
wide = pd.DataFrame({
    "month": ["2025-05", "2025-04"],
    "Partner": [7, 3],
    "Direct": [5, 1],
    "Online": [6, 2],
})
r = unpivot(wide)
assert list(r.columns) == ["month", "channel", "amount"], list(r.columns)
assert r["month"].tolist() == ["2025-04"] * 3 + ["2025-05"] * 3, r["month"].tolist()
assert r["channel"].tolist() == ["Direct", "Online", "Partner"] * 2, r["channel"].tolist()
assert r["amount"].tolist() == [1, 2, 3, 5, 6, 7], r["amount"].tolist()
assert r.index.tolist() == [0, 1, 2, 3, 4, 5]
assert list(wide.columns) == ["month", "Partner", "Direct", "Online"]`,
      solution: `def unpivot(wide):
    long = wide.melt(id_vars="month", var_name="channel", value_name="amount")
    return long.sort_values(["month", "channel"]).reset_index(drop=True)
`,
      hint: '`wide.melt(id_vars="month", var_name="channel", value_name="amount")` gives one row per month and channel. Then `sort_values(["month", "channel"])` and `reset_index(drop=True)`.',
    } },
    { real: `Three of your recurring jobs are exactly this lesson. **The monthly consolidation**: twelve branch files with the same layout become one table with \`concat\` plus a \`source\` column, and a column-name check before you stack. **The enrichment**: every GL line gets its exchange rate or its cost-centre owner with a \`merge\` on a compound key and \`validate="m:1"\`, followed by an assert that the row count did not move. **The reconciliation**: books against the supplier's GSTR-2B file with an outer merge and \`indicator=True\`, where the counts of \`both\`, \`left_only\` and \`right_only\` are the first lines of your report. Any time a total changes after a merge, suspect fan-out first.` },
    { interview: `**"\`merge\` vs \`join\` vs \`concat\`?"**
Model answer: "\`concat\` stacks frames, rows under rows (or side by side along an axis) and matches columns by name; it is a \`UNION ALL\`. \`merge\` is a SQL-style join on key columns with \`how\`, \`on\`, \`suffixes\`, \`indicator\` and \`validate\`. \`join\` is \`merge\` on the index, a shortcut for attaching a Series or frame that is indexed by the key."

**"How do you make sure a merge did not duplicate or lose rows?"**
"I state the relationship with \`validate\`, for example \`"m:1"\` for a lookup, so pandas raises if the key is not unique. I use \`indicator=True\` and count \`left_only\` and \`right_only\`. And I assert that the row count after a left merge equals the row count before, and that the key totals still match."

**"\`pivot_table\` vs \`groupby\`?"**
"\`pivot_table\` is \`groupby\` plus a reshape: it aggregates and then moves one key into the columns, with options like margins and fill_value. A \`groupby\` with two keys followed by \`unstack()\` gives the same grid. For further processing I keep the long form, because it is easier to filter and to chart."` },
    `## Recap
- **\`concat\`** stacks rows (use \`ignore_index=True\` and a \`source\` column; check the column names first). **\`merge\`** joins on keys. **\`join\`** merges on the index. **\`melt\`** goes wide to long, **\`pivot_table\`** goes long to wide and adds up duplicates.
- \`merge\` words: \`on\` (or \`left_on\`/\`right_on\`), \`how\` (default **inner**, say it every time), \`suffixes\`, \`indicator=True\` (counts of both / left_only / right_only), \`validate="m:1"\`.
- **Fan-out** is the silent killer: a duplicate key on the right multiplies left rows and inflates totals. \`validate\` turns it into an error. Joining GSTIN alone gave 156 rows; GSTIN plus invoice number gave 23.
- NaN keys match each other in pandas; whitespace and case differences prevent matches; int and text keys cannot be merged. Clean the keys before the merge.
- Prove it after every combine: row count as expected, \`_merge\` counts printed, grand total unchanged. A pivot or groupby on a missing key drops those rows.`,
  ],
  quiz: [
    { q: '`orders` has 3 rows for customer 1. The `customers` table has customer 1 twice (a duplicate master record). How many rows does `orders.merge(customers, on="customer_id", how="left")` return for customer 1?', o: ['3 rows', '1 row', '6 rows', 'a MergeError'], a: 2, why: 'Each of the 3 order rows matches both customer rows, so 3 x 2 = 6 rows: the totals are inflated. `validate="m:1"` is what would raise the `MergeError`.' },
    { q: 'You do not pass `how=` to `merge`. Which rows do you get?', o: ['all rows of the left table', 'only the rows whose key exists in both tables', 'all rows of both tables', 'all rows of the right table'], a: 1, why: 'The default is `how="inner"`: unmatched rows disappear without a message. That is why you should always write `how=` and compare row counts.' },
    { q: 'What does `indicator=True` add to the result of a merge?', o: ['a column `_merge` saying `both`, `left_only` or `right_only` for every row', 'an index with the names of both files', 'a warning when a key is missing', 'the time the merge took'], a: 0, why: 'The `_merge` column is the audit trail of a join. Counting its values is the first step of every reconciliation.' },
    { q: 'You stack two files with `pd.concat`. One file has a column `Amount` and the other has `amount`. What happens?', o: ['pandas matches the two names, because it ignores case', 'pandas raises a KeyError', 'the file with `Amount` is dropped', 'you get two columns, `Amount` and `amount`, each with NaN where the other file had values'], a: 3, why: '`concat` matches columns by exact name and fills the gaps with NaN. Normalise the headers (`rename(columns=str.lower)`) before you stack.' },
    { q: 'Which call turns a long table (`month`, `channel`, `amount`) into a grid with one column per channel and zeros in the empty cells?', o: ['`df.melt(id_vars="month", value_name="amount")`', '`df.pivot_table(index="month", columns="channel", values="amount", aggfunc="sum", fill_value=0)`', '`df.merge(df, on="channel")`', '`pd.concat([df, df])`'], a: 1, why: '`pivot_table` goes long to wide and sums rows that share a cell. `melt` is the opposite direction.' },
    { q: 'Two invoices on the left have no GSTIN (NaN), and the right table has one row with no GSTIN. What does a merge on `supplier_gstin` do with them?', o: ['it never matches them, like SQL NULL', 'it raises a ValueError at once', 'it joins both left invoices to the right row, because NaN keys match each other in pandas', 'it drops all three rows'], a: 2, why: 'pandas treats missing keys as equal, so they join: 2 rows appear where you might expect none. Remove or flag rows with missing keys before the merge.' },
  ],
  task: {
    title: 'Enrich, stack and reshape the Kollana files',
    steps: [
      'In `C:\\fde\\pandas-lab` create `03_combine.py`. Read `orders.csv`, `customers.csv`, `fact_gl.csv`, `fx_rates.csv`, `purchase_register.csv` and `supplier_invoices.csv` (the 13 CSVs from the first pandas task). Copy the `input` folder from `C:\\fde\\py-recap` too, or recreate two monthly files with the `orders` you already have.',
      'Merge `orders` with `customers` (left, `validate="m:1"`) and assert the row count is 220. Print the total amount of the rows whose `segment` is missing (order 77, 171,000).',
      'Merge `fact_gl` with `fx_rates` on `["currency", "rate_month"]` with `indicator=True`. Print the `_merge` counts (1,193 and 34) and the currency and month of the 34 rows.',
      'Stack `input/sales_2026-08.csv` and `input/sales_2026-09.csv` with a `source` column and check that the order ids are unique.',
      'Build the month by channel matrix with `pivot_table`, check that it adds up to 20,980,275, melt it back to long and check the total again.',
      'Merge the purchase register with the supplier file on GSTIN and invoice number (outer, indicator). Print the three counts: 23, 7 and 6.',
    ],
    deliverable: '`03_combine.py` and its output, with one `assert` per check (row count after the left merge, unchanged totals after pivot and melt).',
  },
};
