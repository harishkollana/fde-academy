export default {
  id: 'pandas-cleaning',
  title: 'Cleaning: missing data, duplicates, types, outliers and categoricals',
  goal: 'You can find and handle missing values on purpose, detect exact copies and key clashes, convert columns to the right dtypes, flag outliers with a rule you can explain, use categoricals, and wrap it all in a cleaning function that keeps an audit trail (rows in = rows kept + rows rejected).',
  roadmap: ['missing data', 'duplicates', 'dtypes', 'outliers', 'categoricals'],
  blocks: [
    `## The problem
Clean data does not exist. A bank file arrives with a blank IFSC. An ERP export repeats three lines. A column of IDs became numbers and lost its leading zeros. One salary looks far too big. Cleaning is where the credibility of your report is decided, because **every fix is a decision**: fill or drop, merge or keep, trust or question. In finance somebody will ask "why is this number different from last month?" and the answer must be a line in your log, not "I fixed some things".

Three rules for the whole lesson:
1. **Flag, don't delete.** Keep the original value. Add a flag column, or move bad rows to a *rejects* table with a reason.
2. **Count everything.** Rows in = rows kept + rows rejected. Print the numbers, every run.
3. **Put each decision in a named function** (\`fill_status\`, \`drop_gl_copies\`), not in an unexplained line, so a reviewer can read it and test it.`,
    `## Missing data
In pandas, "missing" is \`NaN\` (numbers), \`None\` or \`NaN\` (text), \`NaT\` (dates) and \`pd.NA\` (the nullable types). Real files also use **look-alikes** that pandas does not know: an empty text, \`"N/A"\`, \`"-"\`, \`0\`, \`9999\`, \`1900-01-01\`. Turn them into real missing values at load time with \`na_values=[...]\`, or with \`replace\`, so that the tools below work.

| Job | Code |
|---|---|
| count and percentage per column | \`df.isna().sum()\` and \`df.isna().mean()\` |
| drop rows that are useless without a value | \`df.dropna(subset=["status"])\` |
| fill with a constant or a label | \`df["status"].fillna("Unknown")\` |
| fill from the neighbouring row (sorted time series only) | \`ffill()\` and \`bfill()\` |
| fill with the typical value of the group | \`df["amount"].fillna(df.groupby("dept")["amount"].transform("median"))\` |
| fill a smooth numeric series | \`interpolate()\` |

Which one is right is a business question. The picture gives the order in which to ask it. Notice the first question: a blank is sometimes **information**. The top boss has no \`manager_id\`, and that is correct. And notice the cost of \`dropna\`: dropping the 9 orders without a status removes 575,410 of revenue from your report.`,
    { sketch: { w: 760, h: 330, caption: 'Ask these questions in this order before you touch a missing value', items: [
      { t: 'box', x: 14, y: 22, w: 240, h: 52, fill: 'blue', label: 'Is the blank meaningful?', sub: 'manager_id of the top boss', size: 16 },
      { t: 'box', x: 14, y: 112, w: 240, h: 52, fill: 'blue', label: 'Can you get it elsewhere?', sub: 'another system, the supplier', size: 16 },
      { t: 'box', x: 14, y: 202, w: 240, h: 52, fill: 'blue', label: 'Is a typical value fair?', sub: 'group median, last known value', size: 16 },
      { t: 'box', x: 14, y: 280, w: 240, h: 40, fill: 'red', label: 'leave NaN, flag, review', size: 15 },
      { t: 'arrow', x1: 134, y1: 74, x2: 134, y2: 110 },
      { t: 'text', x: 156, y: 92, text: 'no', size: 14 },
      { t: 'arrow', x1: 134, y1: 164, x2: 134, y2: 200 },
      { t: 'text', x: 156, y: 182, text: 'no', size: 14 },
      { t: 'arrow', x1: 134, y1: 254, x2: 134, y2: 278 },
      { t: 'text', x: 156, y: 266, text: 'no', size: 14 },
      { t: 'box', x: 310, y: 22, w: 220, h: 52, fill: 'green', label: 'keep it as it is', sub: 'a blank is information', size: 16 },
      { t: 'box', x: 310, y: 112, w: 220, h: 52, fill: 'green', label: 'fill from the source', sub: 'and record where it came from', size: 16 },
      { t: 'box', x: 310, y: 202, w: 220, h: 52, fill: 'green', label: 'fill and add a flag', sub: 'amount_imputed = True', size: 16 },
      { t: 'arrow', x1: 256, y1: 48, x2: 306, y2: 48 },
      { t: 'text', x: 281, y: 34, text: 'yes', size: 14 },
      { t: 'arrow', x1: 256, y1: 138, x2: 306, y2: 138 },
      { t: 'text', x: 281, y: 124, text: 'yes', size: 14 },
      { t: 'arrow', x1: 256, y1: 228, x2: 306, y2: 228 },
      { t: 'text', x: 281, y: 214, text: 'yes', size: 14 },
      { t: 'note', x: 556, y: 22, w: 194, h: 232, fill: 'yellow', size: 14, text: 'Rules of the road\n\nNever fill with 0 or the\nmean in silence.\n\nAlways count: rows in =\nrows kept + rows flagged.\n\nDropping rows loses\nmoney: 9 orders = 575410.' },
    ] } },
    { py: {
      title: 'A missing-value report, a meaningful blank, a label with a flag, and a group median',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")
emp = pd.read_csv("employees.csv")

# 1) a missing-value report: how many, and what percent, per column
report = pd.DataFrame({"missing": orders.isna().sum(), "percent": (orders.isna().mean() * 100).round(1)})
print(report[report["missing"] > 0])
print("employees:", emp.isna().sum()[lambda s: s > 0].to_dict())

# 2) is the blank meaningful? The top boss has no manager: information, not an error
print(emp.loc[emp["manager_id"].isna(), ["emp_id", "emp_name", "manager_id"]])

# 3) what would dropna cost? Then fill with a label AND keep a flag, so the change can be audited
at_stake = orders.loc[orders["status"].isna(), "amount"].sum()
print("dropna would remove", int(orders["status"].isna().sum()), "orders worth", int(at_stake))
orders["status_filled"] = orders["status"].isna()
orders["status"] = orders["status"].fillna("Unknown")
print(orders["status"].value_counts())

# 4) fill a number with the typical value of its group (the median per department), and flag it
claims = pd.DataFrame({
    "claim_id": range(1, 9),
    "dept": ["Sales", "Sales", "Ops", "Ops", "Ops", "HR", "HR", "Sales"],
    "amount": [1200, None, 800, 950, None, 400, 450, 1500],
})
claims["imputed"] = claims["amount"].isna()
claims["amount"] = claims["amount"].fillna(claims.groupby("dept")["amount"].transform("median"))
print(claims)`,
      note: 'Claim 2 gets 1,350 (the median of the other two Sales claims, 1,200 and 1,500) and claim 5 gets 875 (the median of 800 and 950). The `imputed` column keeps the evidence: you can always filter the filled rows and show them to the reviewer.',
    } },
    `## Duplicates
\`df.duplicated(subset, keep)\` returns True for the rows that repeat an earlier row, and \`drop_duplicates\` removes them. Everything depends on the **subset**: which columns must be equal for two rows to count as the same thing.

- \`keep="first"\` (the default) marks only the **extra** copies. \`keep=False\` marks **every** member of a duplicate group, which is what you want to *look at* them.
- **The surrogate-id trap.** The GL has 1,227 lines and \`df.duplicated()\` finds **0** duplicates, because every line has its own \`gl_id\`. Ignore the id and compare the business columns: now you find 3 extra copies.
- **Three kinds of duplicate need three different actions** (see the picture): an exact copy is dropped, a repeated key with different values is investigated, and a near duplicate (different spelling) is normalised first and then compared.
- To keep the **latest** version of a record, sort by date and use \`drop_duplicates(subset=key, keep="last")\`.`,
    { sketch: { w: 760, h: 330, caption: 'Not every duplicate is a copy: choose the action by the kind of duplicate', items: [
      { t: 'box', x: 14, y: 14, w: 232, h: 62, fill: 'blue', label: 'A. exact copy', sub: 'same in every column\nexcept the surrogate id', size: 16 },
      { t: 'box', x: 264, y: 14, w: 232, h: 62, fill: 'orange', label: 'B. same key, other data', sub: 'the key repeats but\nthe values differ', size: 16 },
      { t: 'box', x: 514, y: 14, w: 232, h: 62, fill: 'purple', label: 'C. near duplicate', sub: 'the same thing,\nspelled differently', size: 16 },
      { t: 'table', x: 24, y: 96, cols: ['gl_id', 'credit'], colW: [70, 130], rows: [['18', '59006.88'], ['1225', '59006.88']], rowH: 28, hl: [1] },
      { t: 'table', x: 274, y: 96, cols: ['emp_id', 'bank_account'], colW: [70, 130], rows: [['4', '47860558007'], ['12', '47860558007']], rowH: 28, hl: [0, 1] },
      { t: 'table', x: 524, y: 96, cols: ['supplier'], colW: [200], rows: [[' Nandi Electricals '], ['NANDI ELECTRICALS']], rowH: 28, hl: [0, 1] },
      { t: 'note', x: 14, y: 198, w: 232, h: 70, fill: 'green', size: 14, text: 'drop the extra copy:\ndrop_duplicates(subset,\nkeep="first")' },
      { t: 'note', x: 264, y: 198, w: 232, h: 70, fill: 'red', size: 14, text: 'do NOT drop it.\nAsk why two people share\none bank account.' },
      { t: 'note', x: 514, y: 198, w: 232, h: 70, fill: 'yellow', size: 14, text: 'normalise first (strip,\nupper), then compare\nand deduplicate' },
      { t: 'note', x: 14, y: 282, w: 732, h: 40, fill: 'blue', size: 14, text: 'keep=False marks every member of a group, keep="first" only the extra copies.\nChoose the subset of columns on purpose.' },
    ] } },
    { py: {
      title: 'Duplicates in the GL, a shared bank account and near-duplicate names',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
gl = pd.read_csv("fact_gl.csv")

# 1) with the surrogate id included, nothing is a duplicate
print("duplicated on all columns:", int(gl.duplicated().sum()))

# 2) ignore the surrogate id: lines that are the same in every business column
business = [c for c in gl.columns if c != "gl_id"]
print("extra copies (keep='first'):", int(gl.duplicated(business).sum()))
print(gl[gl.duplicated(business, keep=False)].sort_values(business)[["gl_id", "journal_id", "account_id", "debit", "credit"]])

# 3) drop the extra copies and see what it does to the journals
deduped = gl.drop_duplicates(business, keep="first")
print(len(gl), "->", len(deduped), "lines")

def unbalanced(df):
    g = df.groupby("journal_id")[["debit", "credit"]].sum()
    return int(((g["debit"] - g["credit"]).round(2) != 0).sum())
print("unbalanced journals before:", unbalanced(gl), "| after:", unbalanced(deduped))

# 4) the same KEY with other data is not a copy: investigate, do not drop
emp = pd.read_csv("employees.csv", dtype=str)
print(emp[emp["bank_account"].duplicated(keep=False)][["emp_id", "emp_name", "bank_account"]])

# 5) near duplicates: normalise, then compare
names = pd.Series([" Nandi Electricals ", "NANDI ELECTRICALS", "Godavari Chemicals"])
print("exact duplicates:", int(names.duplicated().sum()), "| after strip + upper:", int(names.str.strip().str.upper().duplicated().sum()))`,
      note: 'Removing the 3 copies repairs 3 of the 4 unbalanced journals. The fourth, JV202504-0051, is not a duplicate problem: one debit is 500 too high, which no deduplication can fix. A cleaning step must never claim to have fixed more than it did, so count before and after.',
    } },
    `## Types: the silent bug
A wrong dtype does not raise an error. It changes the answer. IDs read as numbers lose their leading zeros. A number column with one missing value turns into \`float64\`, so the IDs print as \`1.0\` and \`2.0\`. A text column of amounts cannot be summed. You find out in the report.

| Tool | Use it for |
|---|---|
| \`read_csv(dtype=..., thousands=",", parse_dates=...)\` | get the type right at load time, the cheapest place |
| \`astype("string")\`, \`astype("category")\` | a safe conversion that you are sure about |
| \`pd.to_numeric(s, errors="coerce")\` | text to numbers; failures become NaN, which you then count |
| \`pd.to_datetime(s, format=..., errors="coerce")\` | text to dates (the dates lesson) |
| \`Int64\`, \`Float64\`, \`boolean\`, \`string\` | the **nullable** dtypes: they hold missing values without turning into float or object |
| \`df.convert_dtypes()\` | let pandas pick the nullable dtype for every column |

\`astype(int)\` on a column that has a missing value raises \`IntCastingNaNError\`. That is the correct behaviour: use \`astype("Int64")\`, with the capital I, which allows \`<NA>\`.

**Money and floats.** Decimal amounts are stored in binary, so \`0.1 + 0.2\` is not exactly \`0.3\`. For reports, round to 2 decimals before you compare (or compare with \`np.isclose\`). When exactness matters (a ledger, a bank file), keep amounts as whole **paise** in an \`int64\` column, or as \`Decimal\` objects as you learned in the Python phase.`,
    { py: {
      title: 'Read a messy file with the right dtypes, then fix the rest with to_datetime and map',
      starter: `import io
import numpy as np
import pandas as pd
pd.set_option("display.width", 120)

csv = """emp_id,joined,salary,active,pin
007,05/04/2021,"1,25,000",Y,560001
012,17/11/2022,"98,500",N,
031,not known,"2,10,000",Y,600042
"""
raw = pd.read_csv(io.StringIO(csv))
print(raw.dtypes)                       # pandas guessed: emp_id lost its zeros, salary is text, pin became float
print(raw)

# say what you mean at load time
typed = pd.read_csv(io.StringIO(csv), dtype={"emp_id": "string", "pin": "string"}, thousands=",")
typed["joined"] = pd.to_datetime(typed["joined"], format="%d/%m/%Y", errors="coerce")
typed["active"] = typed["active"].map({"Y": True, "N": False}).astype("boolean")
print(typed.dtypes)
print(typed)

# a number column with a missing value turns into float; the nullable Int64 keeps integers
manager = pd.read_csv("employees.csv")["manager_id"]
print(manager.dtype, manager.head(3).tolist())
print(manager.astype("Int64").head(3).tolist())
try:
    manager.astype(int)
except Exception as e:
    print(type(e).__name__, "-", e)

# floats and money: round before you compare
total = pd.Series([0.1, 0.2]).sum()
print(total == 0.3, round(total, 2) == 0.3, np.isclose(total, 0.3))`,
      note: '`thousands=","` removes the commas of Indian grouping too (`1,25,000` becomes 125000). The date `not known` becomes `NaT` and the missing `pin` becomes `<NA>`: both are now real missing values you can count. Run the file with `dtype` removed to see what the guess would have cost you.',
    } },
    `## Outliers: far from the rest is not the same as wrong
An **outlier** is a value far away from the others. It may be an error (an extra zero), or it may be the most interesting row in the file (a very big, correct order). The statistics only tell you where to **look**. Three common rules:

| Rule | Flags a value when | Good for | Weak because |
|---|---|---|---|
| **IQR fences** | below Q1 - 1.5 x IQR or above Q3 + 1.5 x IQR (IQR = Q3 - Q1) | skewed money data, easy to explain | the 1.5 is a convention |
| **z-score** | more than 3 standard deviations from the mean | roughly bell-shaped data | the mean and the standard deviation are pulled by the outliers themselves |
| **robust z (MAD)** | far from the median, measured in median absolute deviations | data with a few extreme values | less well known, so explain it |

Statistics find *unusual* values. **Business rules find errors.** Two that work in finance: a **reference check** (the amount of an order must equal quantity x list price x one of the allowed discounts) and a **change rule** (an employee's pay must not move by more than 50 percent in a month). Use the statistical rule to explore, and write the business rule down once you understand it. And as always: **flag, do not delete.**`,
    { sketch: { w: 760, h: 300, caption: 'IQR rule on the order amounts: the box holds the middle half of the data, the fence is 1.5 boxes beyond it', items: [
      { t: 'note', x: 14, y: 10, w: 300, h: 62, fill: 'blue', size: 13, text: 'IQR = Q3 - Q1 = 126000 - 32400 = 93600\nupper fence = Q3 + 1.5 x IQR = 266400' },
      { t: 'line', x1: 43, y1: 150, x2: 95, y2: 150 },
      { t: 'box', x: 95, y: 132, w: 159, h: 36, fill: 'blue' },
      { t: 'line', x1: 163, y1: 132, x2: 163, y2: 168 },
      { t: 'line', x1: 254, y1: 150, x2: 493, y2: 150, dashed: true },
      { t: 'line', x1: 493, y1: 126, x2: 493, y2: 174, color: '#c0392b' },
      { t: 'circle', x: 509, y: 150, r: 7, fill: 'red' },
      { t: 'circle', x: 634, y: 150, r: 7, fill: 'red' },
      { t: 'circle', x: 666, y: 150, r: 7, fill: 'red' },
      { t: 'line', x1: 40, y1: 196, x2: 730, y2: 196 },
      { t: 'line', x1: 40, y1: 190, x2: 40, y2: 202 },
      { t: 'line', x1: 210, y1: 190, x2: 210, y2: 202 },
      { t: 'line', x1: 380, y1: 190, x2: 380, y2: 202 },
      { t: 'line', x1: 550, y1: 190, x2: 550, y2: 202 },
      { t: 'line', x1: 720, y1: 190, x2: 720, y2: 202 },
      { t: 'text', x: 40, y: 216, text: '0', size: 13 },
      { t: 'text', x: 210, y: 216, text: '100000', size: 13 },
      { t: 'text', x: 380, y: 216, text: '200000', size: 13 },
      { t: 'text', x: 550, y: 216, text: '300000', size: 13 },
      { t: 'text', x: 720, y: 216, text: '400000', size: 13 },
      { t: 'text', x: 95, y: 112, text: 'Q1 32400', size: 13 },
      { t: 'text', x: 163, y: 90, text: 'median 72270', size: 13 },
      { t: 'text', x: 254, y: 112, text: 'Q3 126000', size: 13 },
      { t: 'text', x: 493, y: 106, text: 'fence 266400', size: 14, color: '#c0392b', bold: true },
      { t: 'text', x: 600, y: 128, text: '17 flagged', size: 14, bold: true },
      { t: 'note', x: 14, y: 244, w: 560, h: 46, fill: 'pink', size: 14, text: 'All 17 flagged orders are Laptop Pro 14 with quantity 3 or 4 (276000 and above):\nbig, but correct. A statistical outlier is a reason to look, not a reason to delete.' },
    ] } },
    { py: {
      title: 'Three statistical rules and two business rules on the Kollana data',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")
amt = orders["amount"]

# rule 1: IQR fences
q1, q3 = amt.quantile([0.25, 0.75])
iqr = q3 - q1
low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
print(f"Q1 {q1:,.0f}  Q3 {q3:,.0f}  IQR {iqr:,.0f}  fences {low:,.0f} to {high:,.0f}")
iqr_flag = (amt < low) | (amt > high)
print("IQR flags:", int(iqr_flag.sum()))

# rule 2: z-score (the mean and standard deviation are pulled by the outliers themselves)
z = (amt - amt.mean()) / amt.std()
print("|z| > 3 flags:", int((z.abs() > 3).sum()), "| |z| > 2 flags:", int((z.abs() > 2).sum()))

# rule 3: robust z, with the median and the MAD (median absolute deviation)
med = amt.median()
mad = (amt - med).abs().median()
robust = 0.6745 * (amt - med) / mad
print("robust z > 3.5 flags:", int((robust.abs() > 3.5).sum()))

# are the flagged orders wrong? look at what they are
print(orders[iqr_flag].groupby("product_id").agg(orders=("order_id", "count"), min_qty=("qty", "min"), min_amount=("amount", "min")))

# business rule 1: amount must be qty x list price x an allowed discount (1.00, 0.95 or 0.90)
products = pd.read_csv("products.csv")
chk = orders.merge(products[["product_id", "unit_price"]], on="product_id", validate="m:1")
ratio = (chk["amount"] / (chk["qty"] * chk["unit_price"])).round(4)
print(ratio.value_counts().sort_index())
print("orders outside the three price tiers:", int((~ratio.isin([0.90, 0.95, 1.00])).sum()))

# business rule 2: pay must not move by more than 50 percent from one month to the next
pay = pd.read_csv("payroll.csv").sort_values(["emp_id", "run_month"])
pay["change"] = pay.groupby("emp_id")["gross_pay"].pct_change()
print(pay[pay["change"].abs() > 0.5][["emp_id", "run_month", "gross_pay", "change"]])`,
      note: 'The statistical rules flag 8 to 17 orders, and all of them are valid big laptop orders. The price rule flags nothing: every order is exactly 100, 95 or 90 percent of quantity x list price. The change rule finds the one real anomaly: employee 6, +140 percent in September.',
    } },
    `## Categoricals: store each label once
A column with few distinct values (channel, status, department, ageing bucket) is wasteful as text: the same word is stored on every row. The \`category\` dtype stores each distinct value **once** and keeps a small integer **code** per row. It gives you three things:
- **Memory and speed**: far less memory, and faster \`groupby\` and \`merge\` on that column.
- **Order**: an *ordered* categorical sorts and compares in the order **you** define, not alphabetically. \`Shipped < Delivered < Returned\` follows the life cycle of an order.
- **Fixed vocabulary**: a value outside the list is not accepted silently.

Traps:
- Assigning a value that is not in the categories fails (\`fillna("Unknown")\` raises \`TypeError\`): call \`cat.add_categories("Unknown")\` first.
- A categorical group-by lists **every** category, even unused ones, with a count of 0, unless you pass \`observed=True\`. After filtering rows, use \`cat.remove_unused_categories()\`.
- Missing values have the code **-1** and are not a category.`,
    { py: {
      title: 'Categoricals, and a cleaning function with an audit trail',
      starter: `import numpy as np
import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")

# a categorical stores each distinct text once; every row holds a small code
before = orders["status"].memory_usage(deep=True)
orders["status"] = pd.Categorical(orders["status"], categories=["Shipped", "Delivered", "Returned"], ordered=True)
after = orders["status"].memory_usage(deep=True)
print("memory shrinks about", round(before / after), "times (the exact number depends on your machine)")
print(orders["status"].cat.categories.tolist(), orders["status"].cat.codes.head(4).tolist(), "<- codes, -1 means missing")
print("sorted by life cycle:", orders.sort_values(["status", "order_id"]).head(3)["status"].tolist())
print("orders after Shipped in the life cycle:", int((orders["status"] > "Shipped").sum()))

try:
    orders["status"].fillna("Unknown")
except TypeError as e:
    print("fillna:", e)
orders["status"] = orders["status"].cat.add_categories("Unknown").fillna("Unknown")
print(orders["status"].value_counts())

# a cleaning function that keeps the audit trail: (clean rows, rejected rows with a reason, counts)
def clean_claims(df):
    work = df.copy()
    work["claim_id"] = work["claim_id"].astype("string").str.strip()
    work["dept"] = work["dept"].str.strip().str.title()
    work["amount"] = pd.to_numeric(work["amount"], errors="coerce")
    dup = work.duplicated(["claim_id"], keep="first")
    bad_amount = work["amount"].isna() | (work["amount"] <= 0)
    reject = dup | bad_amount
    rejects = work[reject].assign(reason=np.where(dup[reject], "duplicate claim_id", "missing or non-positive amount"))
    clean = work[~reject]
    report = {"rows in": len(df), "clean": len(clean), "rejected": len(rejects),
              "duplicates": int(dup.sum()), "bad amounts": int(bad_amount.sum())}
    assert report["clean"] + report["rejected"] == report["rows in"]
    return clean, rejects, report

messy = pd.DataFrame({
    "claim_id": ["C1", "C2 ", "C3", "C3", "C5", "C6"],
    "dept": ["sales", "OPS", " hr", "hr", "Sales", "ops"],
    "amount": ["1200", "abc", "450", "450", "-30", "800"],
})
clean, rejects, report = clean_claims(messy)
print(clean)
print(rejects)
print(report)`,
      note: 'The ordered categorical lets you ask "which orders are past Shipped?" with a comparison. In `clean_claims`, nothing is lost: 3 rows are clean, 3 are rejected with a reason, and the `assert` fails loudly if the two ever stop adding up to the rows that came in.',
    } },
    { warn: `Cleaning steps that hide damage:
- **\`astype(str)\` turns missing values into the text \`"nan"\` and \`"None"\`.** They are not missing any more: \`isna()\` finds 0, and a merge happily matches the \`"None"\` rows with each other. Use \`astype("string")\`, which keeps \`<NA>\`.
- **\`errors="coerce"\` hides bad data.** Count what it created: \`raw.notna().sum() - parsed.notna().sum()\` is the number of values that failed.
- **\`fillna(0)\` on a whole table** also fills columns where 0 means something else. A missing exchange rate becomes a rate of 0 and the converted amounts vanish.
- **\`drop_duplicates()\` with no \`subset\`** compares every column, including a surrogate id, so it removes nothing (or the wrong rows).
- **A fix you cannot count is not a fix.** Print the number of rows before and after every cleaning step.` },
    { pychallenge: {
      id: 'pandas-cleaning-ch1',
      prompt: 'Write `fill_group_median(df, group, col)`. Return a **new** DataFrame where the missing values of `col` are filled with the **median of `col` within the same `group`**, and which has an extra boolean column named `col + "_imputed"` that is True for the rows that were filled. A row whose whole group has no value stays NaN. The input must not change.',
      starter: `def fill_group_median(df, group, col):
    # TODO: copy, build the flag first, then fillna with groupby(...).transform("median")
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "dept": ["Sales", "Sales", "Ops", "Ops", "Ops", "HR", "Sales", "Legal"],
    "amount": [1200.0, None, 800.0, 950.0, None, None, 1500.0, None],
})
r = fill_group_median(df, "dept", "amount")
assert r["amount"].iloc[1] == 1350.0 and r["amount"].iloc[4] == 875.0, r["amount"].tolist()
assert pd.isna(r["amount"].iloc[5]) and pd.isna(r["amount"].iloc[7])
assert r["amount_imputed"].tolist() == [False, True, False, False, True, True, False, True], r["amount_imputed"].tolist()
assert r["amount"].iloc[0] == 1200.0 and r["amount"].iloc[3] == 950.0
assert list(r.columns) == ["dept", "amount", "amount_imputed"], list(r.columns)
assert df["amount"].isna().sum() == 4 and list(df.columns) == ["dept", "amount"], "the input DataFrame was changed"`,
      solution: `def fill_group_median(df, group, col):
    out = df.copy()
    out[col + "_imputed"] = out[col].isna()
    out[col] = out[col].fillna(out.groupby(group)[col].transform("median"))
    return out
`,
      hint: '`out[col + "_imputed"] = out[col].isna()` must come **before** the fill. Then `out[col].fillna(out.groupby(group)[col].transform("median"))`: `transform` gives every row the median of its group, and NaN where the whole group is empty.',
    } },
    { pychallenge: {
      id: 'pandas-cleaning-ch2',
      prompt: 'Write `copy_ids(df, id_col)`. Two rows are **copies** when they are identical in **every column except** `id_col` (a surrogate id). Return a sorted list of the `id_col` values of the **extra** copies: for each group of identical rows keep the first one and report the ids of the others. Return an empty list when there are no copies.',
      starter: `def copy_ids(df, id_col):
    # TODO: the business columns are all columns except id_col; use duplicated(subset) with keep="first"
    return []
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "gl_id": [1, 2, 3, 4, 5, 6],
    "journal": ["J1", "J1", "J2", "J2", "J1", "J3"],
    "amount": [100, 100, 50, 60, 100, 50],
})
r = copy_ids(df, "gl_id")
assert r == [2, 5], r
assert all(type(x) is int for x in r), r
assert copy_ids(df.iloc[[0, 2, 3, 5]], "gl_id") == []
other = df.rename(columns={"gl_id": "line_id"})
assert copy_ids(other, "line_id") == [2, 5]
assert copy_ids(df.iloc[0:0], "gl_id") == []
assert list(df.columns) == ["gl_id", "journal", "amount"]`,
      solution: `def copy_ids(df, id_col):
    business = [c for c in df.columns if c != id_col]
    extra = df.duplicated(business, keep="first")
    return sorted(df.loc[extra, id_col].tolist())
`,
      hint: '`business = [c for c in df.columns if c != id_col]`. `df.duplicated(business, keep="first")` is True only for the extra copies. `df.loc[mask, id_col].tolist()` gives plain Python ints; sort them.',
    } },
    { pychallenge: {
      id: 'pandas-cleaning-ch3',
      prompt: 'Write `flag_outliers(s)`. `s` is a Series of numbers (it may contain NaN). Return a boolean Series with the same index that is True where a value is **below** `Q1 - 1.5 x IQR` or **above** `Q3 + 1.5 x IQR`. Use the default `quantile` method. NaN values are never outliers (False).',
      starter: `def flag_outliers(s):
    # TODO: q1, q3 = s.quantile([0.25, 0.75]); fences; compare
    return s.isna()
`,
      tests: `import numpy as np
import pandas as pd
s = pd.Series([10, 12, 11, 13, 12, 11, 200, -150], index=list("abcdefgh"))
r = flag_outliers(s)
assert r.tolist() == [False, False, False, False, False, False, True, True], r.tolist()
assert r.index.tolist() == list("abcdefgh")
assert str(r.dtype) == "bool", r.dtype
s2 = pd.Series([1, 2, 3, 4, 100, np.nan])
r2 = flag_outliers(s2)
assert r2.tolist() == [False, False, False, False, True, False], r2.tolist()
assert flag_outliers(pd.Series([5, 5, 5, 5])).tolist() == [False] * 4`,
      solution: `def flag_outliers(s):
    q1, q3 = s.quantile([0.25, 0.75])
    iqr = q3 - q1
    return (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)
`,
      hint: '`q1, q3 = s.quantile([0.25, 0.75])` and `iqr = q3 - q1`. Comparisons with NaN are False, so `(s < low) | (s > high)` already leaves NaN as False.',
    } },
    { pychallenge: {
      id: 'pandas-cleaning-ch4',
      prompt: 'Write `to_clean_types(df)`. `df` has four text columns. Return a **new** DataFrame where: `emp_id` has the dtype `string` (keep the leading zeros); `joined` (like `"05/04/2021"`, day first) is `datetime64[ns]` with `NaT` for anything that is not a date; `salary` (like `"1,25,000"`, may be None) has the dtype `Int64` with `<NA>` for missing or invalid values; `active` (`"Y"` or `"N"`, anything else is unknown) has the dtype `boolean` with `<NA>` for unknown values. The input must not change.',
      starter: `def to_clean_types(df):
    # TODO: astype("string"), to_datetime(format=..., errors="coerce"), to_numeric + astype("Int64"), map + astype("boolean")
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "emp_id": ["007", "012", "031"],
    "joined": ["05/04/2021", "17/11/2022", "not known"],
    "salary": ["1,25,000", "98,500", None],
    "active": ["Y", "N", "maybe"],
})
r = to_clean_types(df)
assert r["emp_id"].tolist() == ["007", "012", "031"] and str(r["emp_id"].dtype) == "string", (r["emp_id"].tolist(), r["emp_id"].dtype)
assert str(r["joined"].dtype) == "datetime64[ns]", r["joined"].dtype
assert r["joined"].iloc[0] == pd.Timestamp("2021-04-05") and r["joined"].iloc[1] == pd.Timestamp("2022-11-17")
assert pd.isna(r["joined"].iloc[2])
assert str(r["salary"].dtype) == "Int64", r["salary"].dtype
assert r["salary"].iloc[0] == 125000 and r["salary"].iloc[1] == 98500 and pd.isna(r["salary"].iloc[2])
assert str(r["active"].dtype) == "boolean", r["active"].dtype
assert r["active"].iloc[0] == True and r["active"].iloc[1] == False and pd.isna(r["active"].iloc[2])
assert df["salary"].iloc[0] == "1,25,000" and df["joined"].iloc[0] == "05/04/2021", "the input was changed"`,
      solution: `def to_clean_types(df):
    out = df.copy()
    out["emp_id"] = out["emp_id"].astype("string")
    out["joined"] = pd.to_datetime(out["joined"], format="%d/%m/%Y", errors="coerce")
    out["salary"] = pd.to_numeric(out["salary"].str.replace(",", "", regex=False), errors="coerce").astype("Int64")
    out["active"] = out["active"].map({"Y": True, "N": False}).astype("boolean")
    return out
`,
      hint: 'Work on `df.copy()`. Dates: `pd.to_datetime(..., format="%d/%m/%Y", errors="coerce")`. Salary: remove the commas with `str.replace(",", "", regex=False)`, then `pd.to_numeric(..., errors="coerce").astype("Int64")`. Active: `.map({"Y": True, "N": False}).astype("boolean")`: values that are not in the dict become missing.',
    } },
    { real: `Every recurring job starts with a cleaning function, and the good ones all look alike: they take the raw frame and return **three things**: the clean rows, the rejected rows with a reason, and a small dict of counts. The counts go to the log (and to the email that tells the finance team the file was loaded). The rejects go to an Excel sheet the business can fix. That is how you stop "the data was wrong" from being an argument: the reject list names the invoice, the column and the rule. Add the checks you learned here as rules: missing mandatory fields, exact copies, key clashes (one bank account, two employees), values outside the reference data, and month-on-month jumps.` },
    { interview: `**"How do you handle missing data?"**
Model answer: "First I ask whether the blank means something, for example a top-level employee without a manager. If not, I count how much is missing and decide per column: drop the row only if it is useless without that value, fill with a label or with a group statistic such as the median per department, or leave it missing. Whatever I fill, I add a flag column and I log the counts, so the change can be audited."

**"How do you find outliers, and what do you do with them?"**
"I explore with the IQR rule or a robust z-score, because the mean and the standard deviation are themselves pulled by outliers. Then I look at the rows: a statistical outlier is not an error. Errors I catch with business rules such as a price check against the product master or a month-on-month change limit. I flag the rows and send them for review. I do not delete them."

**"When would you use the \`category\` dtype?"**
"For a column with few distinct values repeated on many rows, such as channel, status or department. It stores each value once, so memory drops a lot and \`groupby\` and \`merge\` get faster. An ordered categorical also sorts and compares in a business order such as Shipped, Delivered, Returned. I watch out for new values, which need \`add_categories\`, and I use \`observed=True\` in group-bys."` },
    `## Recap
- **Flag, don't delete; count everything; put every decision in a named function.** A good cleaning function returns the clean rows, the rejects with a reason, and a counts dict, and asserts that rows in = kept + rejected.
- **Missing:** find look-alikes (\`""\`, \`"-"\`, \`0\`) and turn them into real NaN. A blank can be information. \`dropna\` costs rows (and money), \`fillna\` with a constant or a **group median** needs a flag column.
- **Duplicates:** the answer depends on the \`subset\`. Include a surrogate id and you find none; ignore it and you find the copies. A repeated key with different values is a finding, not a copy.
- **Types:** \`dtype=\` at load time, \`to_numeric\` and \`to_datetime\` with \`errors="coerce"\`, and the nullable \`Int64\`, \`string\`, \`boolean\` for columns with gaps. Round money before comparing, or keep paise as integers.
- **Outliers:** IQR fences, z-score and robust z only say where to look; business rules (reference prices, month-on-month change) find errors. **Categoricals** save memory, give ordered comparisons, and need \`add_categories\` and \`observed=True\`.`,
  ],
  quiz: [
    { q: 'You want to fill a missing claim `amount` with the median of its own department. Which line does that?', o: ['`df["amount"].fillna(0)`', '`df.dropna()`', '`df["amount"].fillna(df.groupby("dept")["amount"].transform("median"))`', '`df["amount"].fillna(df["amount"].max())`'], a: 2, why: '`transform("median")` gives every row the median of its group, and `fillna` uses it only where the amount is missing. Add a flag column so the fill can be audited.' },
    { q: '`gl.duplicated()` finds 0 duplicates, yet 3 GL lines are extra copies. Why?', o: ['`duplicated()` ignores the last rows of a frame', 'the copies differ in the surrogate `gl_id`, so no row is identical on all columns: use `subset=` with the business columns', '`duplicated()` only works on text columns', 'the copies are removed automatically when the file is loaded'], a: 1, why: 'Every line has its own `gl_id`, so with all columns included nothing repeats. Compare the business columns and you find the 3 extra copies.' },
    { q: '`manager_id` is `float64` because one value is missing. Which dtype keeps whole numbers and allows a missing value?', o: ['`int64`', '`Int64` with a capital I (the nullable integer)', '`int32`', 'only `object`'], a: 1, why: 'Plain NumPy integers cannot hold a missing value, so pandas switches to float. The nullable `Int64` stores integers and `<NA>`. `astype(int)` on a column with NaN raises `IntCastingNaNError`.' },
    { q: 'The IQR rule flags 17 orders. All are Laptop Pro 14 with quantity 3 or 4 and they match qty x list price. What do you do?', o: ['delete them, outliers are always errors', 'replace them with the median amount', 'keep them and note that they are valid: a statistical outlier is a reason to look, not an error by itself', 'cut them down to the fence value'], a: 2, why: 'The price check shows every order is exactly 100, 95 or 90 percent of quantity x list price, so these are big but correct. Statistics find unusual values; business rules find errors.' },
    { q: '`orders["status"].fillna("Unknown")` raises a `TypeError` on a categorical column. What is the fix?', o: ['pandas cannot hold text in a categorical', 'convert the column back to `int64` first', 'call `drop_duplicates()` first', 'add the label first with `cat.add_categories("Unknown")`, then `fillna`'], a: 3, why: 'A categorical accepts only values from its list of categories. Add the new label to the list, then fill.' },
    { q: '`pd.Series([0.1, 0.2]).sum() == 0.3` is False. How do you compare money safely?', o: ['round both sides to 2 decimals, or use `np.isclose`, before comparing', 'use `==` on `float32` values', 'convert both to text and test with `in`', 'floats are exact for amounts below one lakh'], a: 0, why: 'Decimals are stored in binary, so sums carry tiny errors. Round (or use a tolerance) before comparing, or keep amounts as whole paise in an integer column.' },
  ],
  task: {
    title: 'A cleaning function for the GL and the employee file',
    steps: [
      'In `C:\\fde\\pandas-lab` create `05_cleaning.py`. Read `fact_gl.csv`, `employees.csv` (as text, with `dtype=str`), `orders.csv` and `payroll.csv`.',
      'Print a missing-value report for the orders and the employees. Explain in a comment why the missing `manager_id` of employee 1 is not an error.',
      'Write `drop_gl_copies(gl)`: drop lines that are identical on every column except `gl_id`, and return the cleaned frame and the list of removed `gl_id`s (1225, 1226 and 1227). Print the number of unbalanced journals before (4) and after (1).',
      'Validate the employee file: find the employees with an invalid IFSC (7, 14), a missing PAN (9, 18) and a shared bank account (4, 12). Put each of these 6 employees **once** in a `rejects` table whose `reason` column names the rule that failed, and keep the other 14 in `clean`.',
      'Flag the orders above the IQR upper fence (17) and show, with a `groupby` on `product_id`, that they are all laptops. Flag the payroll rows whose pay changed by more than 50 percent (employee 6).',
      'Wrap steps 3 to 5 in `clean_all(...)` that returns `(clean, rejects, report)` and asserts `len(clean) + len(rejects) == len(input)` for the employee file. Print the report.',
    ],
    deliverable: '`05_cleaning.py` and its output: the missing-value report, the reject table with reasons, and the counts report.',
  },
};
