export default {
  id: 'pandas-dates-text',
  title: 'Dates and text: to_datetime, .dt, resample and .str',
  goal: 'You can turn text into real dates and count the ones that fail, pull out month, quarter and Indian fiscal year, do date maths and monthly totals without holes, and clean and validate text columns (GSTIN, IFSC, PAN, invoice numbers, amounts) with the .str methods.',
  roadmap: ['to_datetime', '.dt accessor', 'resample and periods', '.str methods'],
  blocks: [
    `## The problem
Two things break more finance scripts than anything else. The first is **dates**. They arrive as text: \`2026-08-27\`, \`27/08/2026\`, \`27-Aug-26\`, or an Excel serial number such as \`45000\`. Is \`03/04/2026\` the 3rd of April or the 4th of March? Your fiscal year starts in April, so "month 1" is not January. And a month with no invoices simply disappears from a \`groupby\`.

The second is **text keys**. The supplier typed \`INV-0689/25-26\`, your books have \`INV/0689/25-26\`. One cell has a trailing space, another is in lower case, another has the rupee sign in front of the amount. A join or a total quietly misses these rows, and the reconciliation shows a difference that is not real.

pandas has one tool for each: the **\`.dt\`** accessor (and \`resample\`) for dates, and the **\`.str\`** accessor for text. This lesson teaches both, and the habit that goes with them: **parse strictly, count what failed, never drop it silently.**`,
    `## Dates: from text to a real date
\`pd.to_datetime\` turns text into the \`datetime64\` dtype. Give it the **format** with the codes below, so pandas does not have to guess.

| Code | Meaning | Example |
|---|---|---|
| \`%Y\` / \`%y\` | 4-digit / 2-digit year | 2026 / 26 |
| \`%m\` | month number | 08 |
| \`%d\` | day of the month | 27 |
| \`%b\` / \`%B\` | month name, short / long | Aug / August |
| \`%H:%M:%S\` | hour, minute, second | 14:35:00 |

\`pd.to_datetime(raw, format="%d/%m/%Y", errors="coerce")\` reads \`27/08/2026\` as 27 August 2026. The \`errors\` option decides what happens to a bad value: \`"raise"\` (the default) stops the script, \`"coerce"\` turns the value into \`NaT\` ("not a time", the date version of NaN). Use \`coerce\`, then **count the \`NaT\`s that were not empty before**. That count is a data-quality finding.

Three things to know:
- **Day first or month first?** For \`dd/mm/yyyy\` data say \`format="%d/%m/%Y"\` or at least \`dayfirst=True\`. The same text gives two different dates otherwise.
- **pandas 2 guesses the format from the first value** and applies it to the whole column. With \`errors="coerce"\`, a value in another format later in the column becomes \`NaT\` **without any warning**. \`format="mixed"\` parses each value separately, which is slower and guesses again, so use it only when you must.
- **Excel serial numbers** are days since 30 December 1899: \`pd.to_datetime(45000, unit="D", origin="1899-12-30")\` is 15 March 2023.`,
    { sketch: { w: 760, h: 310, caption: 'With one explicit format, anything that does not fit becomes NaT: count those rows instead of letting them vanish', items: [
      { t: 'text', x: 380, y: 28, text: 'pd.to_datetime(raw, format="%d/%m/%Y", errors="coerce")', font: 'mono', size: 13, bold: true },
      { t: 'table', x: 14, y: 52, cols: ['raw text'], colW: [130], rows: [['27/08/2026'], ['03/04/2026'], ['31/02/2026'], ['27-Aug-26'], ['N/A']], rowH: 30 },
      { t: 'arrow', x1: 150, y1: 142, x2: 262, y2: 142 },
      { t: 'table', x: 270, y: 52, cols: ['parsed', 'what happened'], colW: [100, 220], rows: [['2026-08-27', 'day first: 27 August'], ['2026-04-03', '3 April, not 4 March'], ['NaT', 'no 31 February: coerced'], ['NaT', 'other format: coerced'], ['NaT', 'not a date: coerced']], rowH: 30, fill: 'green', hl: [2, 3, 4] },
      { t: 'note', x: 612, y: 52, w: 138, h: 180, fill: 'yellow', size: 13, text: 'Count the failures:\nraw.notna() &\nparsed.isna()\n\nThey are findings.\nNever drop them\nsilently.' },
      { t: 'note', x: 14, y: 252, w: 736, h: 48, fill: 'blue', size: 14, text: 'pandas 2 guesses the format from the FIRST value. With errors="coerce", a later value in\nanother format becomes NaT without a word. Say format= every time.' },
    ] } },
    { py: {
      title: 'to_datetime: explicit format, coerce, day first, and the first-value trap',
      starter: `import pandas as pd

raw = pd.Series(["27/08/2026", "03/04/2026", "31/02/2026", "27-Aug-26", "", "N/A", None])

# one explicit format; bad values become NaT instead of stopping the script
parsed = pd.to_datetime(raw, format="%d/%m/%Y", errors="coerce")
print(pd.DataFrame({"raw": raw, "parsed": parsed}))

# count and show the failures: a non-empty text that did not parse
failed = raw.notna() & raw.ne("") & parsed.isna()
print("failed to parse:", raw[failed].tolist())

# the ambiguity: is 03/04/2026 the 3rd of April or the 4th of March?
one = pd.Series(["03/04/2026"])
print("dayfirst=True :", pd.to_datetime(one, dayfirst=True)[0].date())
print("dayfirst=False:", pd.to_datetime(one, dayfirst=False)[0].date())

# pandas 2 guesses the format from the FIRST value and applies it to the rest
mixed = pd.Series(["2026-08-27", "27/08/2026"])
print(pd.to_datetime(mixed, errors="coerce").tolist())                  # the second value silently becomes NaT
print(pd.to_datetime(mixed, format="mixed", dayfirst=True).tolist())    # each value on its own: slower, and it guesses

# an Excel serial number: days since 1899-12-30
print(pd.to_datetime(pd.Series([45000, 45123]), unit="D", origin="1899-12-30").dt.strftime("%Y-%m-%d").tolist())`,
      note: 'Look at the first `print` of the trap: the list has a date and then `NaT`, and pandas printed no warning. That is the case where a whole month of rows can disappear from a report.',
    } },
    `## .dt: the parts of a date, and the fiscal year
Once a column has the \`datetime64\` dtype, the \`.dt\` accessor gives you its parts: \`.dt.year\`, \`.dt.month\`, \`.dt.day\`, \`.dt.quarter\`, \`.dt.dayofweek\` (Monday is 0), \`.dt.day_name()\`, \`.dt.is_month_end\`, and \`.dt.to_period("M")\` (the month as a label such as \`2025-04\`). If the column is still text, \`.dt\` raises \`AttributeError: Can only use .dt accessor with datetimelike values\`: parse it first.

**The Indian fiscal year** runs from 1 April to 31 March, and pandas does not know that by default. Do it with arithmetic that you can read and test:
- the fiscal year **starts** in \`year - (month < 4)\`: January to March 2026 belong to the year that started in 2025;
- the label is \`FY2025-26\`: the start year, a dash, and the last two digits of the next year;
- the fiscal quarter is \`((month - 4) % 12) // 3 + 1\`: April to June is Q1.

pandas has a built-in too, \`to_period("Q-MAR")\`, quarters of a year that ends in March. Be careful with its **label**: it names a fiscal year by the year in which it **ends**, so April 2025 is called \`2026Q1\`. That is an easy way to report the wrong year.

**Date maths.** Subtracting two dates gives a *timedelta*: \`(as_of - due).dt.days\` is the number of days between them. Add days with \`pd.Timedelta(days=30)\`. Add months with \`pd.DateOffset(months=1)\`: it keeps the day when it can and lands on the last day of the month when it cannot (31 January plus one month is 28 February). \`pd.offsets.MonthEnd(0)\` moves a date to the end of its own month.`,
    { sketch: { w: 760, h: 292, caption: 'The fiscal year starts in April: months 1 to 12 run from April to March, four quarters of three months', items: [
      { t: 'text', x: 380, y: 26, text: 'FY2025-26: 1 April 2025 to 31 March 2026', size: 18, bold: true },
      { t: 'box', x: 14, y: 52, w: 56, h: 40, label: 'Apr', fill: 'blue', size: 16 },
      { t: 'box', x: 74, y: 52, w: 56, h: 40, label: 'May', fill: 'blue', size: 16 },
      { t: 'box', x: 134, y: 52, w: 56, h: 40, label: 'Jun', fill: 'blue', size: 16 },
      { t: 'box', x: 194, y: 52, w: 56, h: 40, label: 'Jul', fill: 'green', size: 16 },
      { t: 'box', x: 254, y: 52, w: 56, h: 40, label: 'Aug', fill: 'green', size: 16 },
      { t: 'box', x: 314, y: 52, w: 56, h: 40, label: 'Sep', fill: 'green', size: 16 },
      { t: 'box', x: 374, y: 52, w: 56, h: 40, label: 'Oct', fill: 'orange', size: 16 },
      { t: 'box', x: 434, y: 52, w: 56, h: 40, label: 'Nov', fill: 'orange', size: 16 },
      { t: 'box', x: 494, y: 52, w: 56, h: 40, label: 'Dec', fill: 'orange', size: 16 },
      { t: 'box', x: 554, y: 52, w: 56, h: 40, label: 'Jan', fill: 'purple', size: 16 },
      { t: 'box', x: 614, y: 52, w: 56, h: 40, label: 'Feb', fill: 'purple', size: 16 },
      { t: 'box', x: 674, y: 52, w: 56, h: 40, label: 'Mar', fill: 'purple', size: 16 },
      { t: 'text', x: 14, y: 110, text: '2025', size: 13, anchor: 'start' },
      { t: 'text', x: 554, y: 110, text: '2026', size: 13, anchor: 'start' },
      { t: 'brace', x: 14, y: 124, w: 176, label: 'Q1' },
      { t: 'brace', x: 194, y: 124, w: 176, label: 'Q2' },
      { t: 'brace', x: 374, y: 124, w: 176, label: 'Q3' },
      { t: 'brace', x: 554, y: 124, w: 176, label: 'Q4' },
      { t: 'note', x: 14, y: 196, w: 360, h: 78, fill: 'yellow', size: 13, text: 'fiscal start year = year - (month < 4)\nJan to Mar 2026 belong to the year\nthat started in 2025: FY2025-26' },
      { t: 'note', x: 390, y: 196, w: 356, h: 78, fill: 'grey', size: 13, text: 'fiscal quarter = ((month - 4) % 12) // 3 + 1\nQ1 is April to June.\nto_period("Q-MAR") calls Q1 of FY2025-26 "2026Q1".' },
    ] } },
    { py: {
      title: 'Fiscal year and quarter, and days overdue on the purchase register',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

# the .dt accessor on a real date column
orders = pd.read_csv("orders.csv", parse_dates=["order_date"])
d = orders["order_date"].dt
print(orders["order_date"].dtype, "|", d.year.iloc[0], d.month.iloc[0], d.day_name().iloc[0])

# fiscal year (April to March) and fiscal quarter by arithmetic: easy to read and to test
def fiscal_year(dates):
    start = dates.dt.year - (dates.dt.month < 4).astype(int)
    return "FY" + start.astype(str) + "-" + ((start + 1) % 100).astype(str).str.zfill(2)

def fiscal_quarter(dates):
    return ((dates.dt.month - 4) % 12) // 3 + 1

edge = pd.Series(pd.to_datetime(["2025-04-01", "2026-03-31", "2026-04-01", "2025-01-15"]))
print(pd.DataFrame({"date": edge.dt.date, "fy": fiscal_year(edge), "fq": fiscal_quarter(edge)}))

orders["fq"] = fiscal_quarter(orders["order_date"])
print(orders.groupby("fq")["amount"].sum())            # Q1 = April to June

# the built-in way: periods that end in March. Look at the label of the year
first = orders["order_date"].iloc[0]
print(first.date(), "is in", orders["order_date"].dt.to_period("Q-MAR").iloc[0], "(FY2025-26, named by the year it ends)")

# date maths: 30-day terms, days overdue on 30 September 2026
pr = pd.read_csv("purchase_register.csv", parse_dates=["invoice_date"])
pr["due"] = pr["invoice_date"] + pd.Timedelta(days=30)
as_of = pd.Timestamp("2026-09-30")
pr["overdue_days"] = (as_of - pr["due"]).dt.days.clip(lower=0)      # not yet due -> 0
print(pr[["pr_id", "invoice_date", "due", "overdue_days"]].head(4))
bucket = pd.cut(pr["overdue_days"], bins=[-1, 0, 30, 60, 10_000], labels=["not due", "1-30", "31-60", "over 60"])
print(pr.groupby(bucket, observed=True).agg(invoices=("pr_id", "count"), taxable=("taxable_value", "sum")))`,
      note: 'The four fiscal quarters add up to 20,980,275, and Q1 (3,523,075) equals the year-to-date total at the end of June from the groupby lesson. The ageing table has 6 + 15 + 9 = 30 invoices: no row lost. The bucket "over 60" has no invoices, so `observed=True` leaves it out.',
    } },
    `## Time as an axis: resample, periods and calendars
\`resample\` is \`groupby\` for time. You give it a **frequency** and it makes one row per period: \`orders.resample("MS", on="order_date")["amount"].sum()\`. The frequency codes you need:

| Code | Period |
|---|---|
| \`"D"\`, \`"W"\` | day, week |
| \`"MS"\` / \`"ME"\` | month, labelled by its start / its end |
| \`"QS-APR"\` / \`"QE-MAR"\` | fiscal quarters, labelled by the start / the end of the quarter |
| \`"YS-APR"\` / \`"YE-MAR"\` | fiscal years, labelled by the start / the end |

The old code \`"M"\` is deprecated and warns: write \`"ME"\` or \`"MS"\`.

**The big difference from \`groupby\`:** \`resample\` creates a row for **every** period between the first and the last date, including the empty ones. A sum for an empty month is 0 and a mean is NaN. A \`groupby\` on the month leaves such a month out, and a missing month looks like nothing happened. That is why a monthly report should be built with \`resample\` or with \`reindex(pd.date_range(...))\`.

**Completing a calendar** finds holes in reference data. \`pd.date_range(start, end, freq="MS")\` makes every month, \`reindex\` puts your data on it, and the months that are NaN are the gaps. Filling them (\`ffill\`, "carry the last value forward") is a **policy decision**, not a technical one: ask who owns the number.

**Time zones.** Keep timestamps in UTC inside systems and convert only for display: \`ts.tz_localize("Asia/Kolkata")\` says "this clock time was in India", \`tz_convert("UTC")\` converts it. Mixing time-zone-aware and naive timestamps raises an error. Midnight in India is 18:30 UTC on the day before, so a transaction near midnight can land in the wrong month when the clock is not the one you think it is.`,
    { py: {
      title: 'resample, empty months, a gap in the FX table, month maths and time zones',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv", parse_dates=["order_date"])

# resample = groupby on time. "MS" = month start, "QS-APR" = quarters that start in April
monthly = orders.resample("MS", on="order_date")["amount"].sum()
print(monthly.head(3))
fiscal_q = orders.resample("QS-APR", on="order_date")["amount"].sum()
print(fiscal_q)
print("same total:", int(monthly.sum()), int(fiscal_q.sum()), int(orders["amount"].sum()))

# an empty month gives 0 with resample; groupby simply leaves it out
few = orders[orders["order_date"].dt.month.isin([4, 6])]
print(few.resample("MS", on="order_date")["amount"].sum())
print(few.groupby(few["order_date"].dt.to_period("M"))["amount"].sum())

# complete a calendar and find the holes: the FX table has no SGD rate for one month
fx = pd.read_csv("fx_rates.csv", parse_dates=["rate_month"])
sgd = fx[fx["currency"] == "SGD"].set_index("rate_month")["rate_to_inr"]
calendar = pd.date_range(sgd.index.min(), sgd.index.max(), freq="MS")
print("SGD rates:", len(sgd), "of", len(calendar), "months; missing:", calendar.difference(sgd.index).strftime("%Y-%m").tolist())
filled = sgd.reindex(calendar).ffill()                  # a POLICY: carry the last known rate forward
print("Feb 2026 would use", filled.loc["2026-02-01"], "(the January rate)")

# month arithmetic: the 31st plus one month lands on the last day of the next month
print(pd.Timestamp("2026-01-31") + pd.DateOffset(months=1))
print(pd.Timestamp("2026-02-10") + pd.offsets.MonthEnd(0))      # the end of this month

# time zones: keep UTC inside systems, convert for display
t = pd.Timestamp("2026-03-31 23:30").tz_localize("Asia/Kolkata")
print(t, "->", t.tz_convert("UTC"))`,
      note: 'The `resample` of April and June shows May with 0; the `groupby` version has no May at all. The time-zone line shows why: 23:30 on 31 March in India is 18:00 UTC the same day, but 00:30 on 1 April is still 31 March in UTC, so a "month" depends on the clock you use.',
    } },
    { warn: `Traps with dates:
- **A column that looks like dates but is text.** \`.dt\` fails, sorting is alphabetical (fine only for \`YYYY-MM-DD\`), and \`resample\` fails. Check \`df.dtypes\` after reading a file.
- **Format guessed from the first value.** One odd first row, such as a header repeated inside the data, can turn the rest into \`NaT\` or into the wrong day and month.
- **dd/mm versus mm/dd.** Never rely on the default for slashes. Say \`format="%d/%m/%Y"\`.
- **\`NaT\` in a date filter.** \`df[df["date"] > "2026-04-01"]\` silently drops the rows with \`NaT\`. Count them first.
- **Fiscal labels.** \`to_period("Q-MAR")\` names a fiscal year by the year it ends. Write your own label function and test it on 31 March and 1 April.
- **Naive and aware timestamps** cannot be compared. Convert both to the same kind first.` },
    `## .str: text columns without a loop
The \`.str\` accessor applies a text operation to every value of a column. Missing values stay missing, and calling it on a column that is not text raises \`AttributeError: Can only use .str accessor with string values\`.

| You want to | Write |
|---|---|
| remove spaces, change case | \`.str.strip()\`, \`.str.upper()\`, \`.str.lower()\`, \`.str.title()\` |
| replace text | \`.str.replace("-", "/", regex=False)\` or with a pattern: \`.str.replace(r"\\s+", " ", regex=True)\` |
| test a pattern | \`.str.contains("INV", na=False)\`, \`.str.startswith("INV")\`, \`.str.fullmatch(PATTERN, na=False)\` |
| cut a piece | \`.str[:2]\` (first 2 characters), \`.str.slice(2, 12)\`, \`.str.split("/", expand=True)\` |
| pull parts into columns | \`.str.extract(r"INV/(?P<number>\\d+)/(?P<fy>\\d{2}-\\d{2})")\` |
| pad with zeros | \`.astype(str).str.zfill(4)\` |

Three habits:
- **\`na=False\` in every test that becomes a filter.** Without it, a missing value gives NaN, and a mask with NaN cannot be used.
- **\`fullmatch\` to validate** a whole value (a GSTIN, an IFSC, a PAN). \`contains\` and \`match\` accept a value that merely *starts with* or *contains* the pattern.
- **Normalise before you compare**: strip, upper-case, collapse spaces, remove punctuation. Do it to **both** sides of a join, with the same function. In pandas 2 \`str.replace\` reads its pattern as plain text unless you pass \`regex=True\`.

A regex only checks the **shape**. A GSTIN has 15 characters in a fixed pattern, and the last one is a checksum, but the pattern accepts any letter or digit there. A GSTIN with a wrong last character passes the shape test. Real validation needs the checksum or a lookup of the supplier master.`,
    { sketch: { w: 760, h: 280, caption: 'Normalise both sides with the same function, then they match: the key ignores punctuation and case', items: [
      { t: 'box', x: 14, y: 36, w: 176, h: 52, fill: 'blue', label: 'INV/0689/25-26', sub: 'our books', size: 17 },
      { t: 'box', x: 14, y: 116, w: 176, h: 52, fill: 'orange', label: 'INV-0689/25-26', sub: 'supplier file', size: 17 },
      { t: 'arrow', x1: 192, y1: 64, x2: 232, y2: 84 },
      { t: 'arrow', x1: 192, y1: 142, x2: 232, y2: 122 },
      { t: 'box', x: 236, y: 52, w: 158, h: 100, fill: 'yellow', label: 'upper()', sub: 'then keep only\nA-Z and 0-9', size: 18 },
      { t: 'arrow', x1: 396, y1: 102, x2: 448, y2: 102 },
      { t: 'box', x: 452, y: 52, w: 176, h: 100, fill: 'green', label: 'INV06892526', sub: 'the same key\non both sides', size: 18 },
      { t: 'mark', x: 676, y: 92, ok: true },
      { t: 'text', x: 692, y: 128, text: 'they match', size: 15 },
      { t: 'note', x: 14, y: 196, w: 732, h: 70, fill: 'grey', size: 14, text: 'On the Kollana data: merge on GSTIN + exact invoice_no gives 23 rows;\nmerge on GSTIN + the normalised key gives 25. The two extra ones were typed INV-0689 and INV-8812.' },
    ] } },
    { py: {
      title: 'Validate GSTIN, IFSC and PAN with .str, and extract parts of an invoice number',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
GSTIN = r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
IFSC = r"[A-Z]{4}0[A-Z0-9]{6}"
PAN = r"[A-Z]{5}[0-9]{4}[A-Z]"

emp = pd.read_csv("employees.csv", dtype=str)           # all text: IDs must never become numbers
emp["ifsc_ok"] = emp["ifsc"].str.fullmatch(IFSC, na=False)
emp["pan_ok"] = emp["pan"].str.fullmatch(PAN, na=False)
print(emp.loc[~emp["ifsc_ok"], ["emp_id", "emp_name", "ifsc"]])
print(emp.loc[~emp["pan_ok"], ["emp_id", "emp_name", "pan"]])

# normalise first, then validate: upper() rescues the lower-case IFSC, not the one with the wrong shape
fixed = emp["ifsc"].str.strip().str.upper()
print("valid IFSC after strip + upper:", int(fixed.str.fullmatch(IFSC, na=False).sum()), "of", len(emp))

# two employees with one bank account: a fraud flag
dup = emp[emp["bank_account"].duplicated(keep=False)]
print(dup[["emp_id", "emp_name", "bank_account"]])

# a GSTIN regex checks the SHAPE only: every GSTIN here has a valid shape
books = pd.read_csv("purchase_register.csv")
gstr = pd.read_csv("supplier_invoices.csv")
print("valid shape in the books:", int(books["supplier_gstin"].str.fullmatch(GSTIN).sum()), "of", len(books))
print("valid shape in the supplier file:", int(gstr["supplier_gstin"].str.fullmatch(GSTIN).sum()), "of", len(gstr))
print("GSTINs only in the supplier file:", sorted(set(gstr["supplier_gstin"]) - set(books["supplier_gstin"])))

# extract: pull the parts of an invoice number into columns
parts = books["invoice_no"].str.extract(r"INV/(?P<number>\\d+)/(?P<fy>\\d{2}-\\d{2})")
print(parts.head(3))
print(books["supplier_gstin"].str[:2].value_counts().to_dict(), "<- the first two characters are the state code")`,
      note: 'Two IFSC codes are invalid: employee 7 (`HDFC123456` has no zero in the fifth place) and employee 14 (lower case). Stripping and upper-casing repairs only the second, so 19 of 20 are valid afterwards. Two PANs are missing (employees 9 and 18). The supplier file has a GSTIN that ends in `ZZ` instead of `ZX`: its shape is fine, so a regex cannot catch it. Only the comparison with the books does.',
    } },
    { py: {
      title: 'Clean amounts, names and invoice keys, then merge again',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

# 1) amounts typed as text: a currency prefix, Indian commas, brackets for negatives
raw = pd.Series(["Rs. 1,25,000.50", "(1,200.00)", "2,50,000", " 75000 ", "", None, "n/a"])
text = raw.str.strip().str.replace(r"^(?:Rs\\.?|INR)\\s*", "", regex=True, case=False)   # the prefix first: its dot is not a decimal point
text = text.str.replace(r"^\\(([^)]*)\\)$", r"-\\1", regex=True)                       # (1,200.00) -> -1,200.00
text = text.str.replace(r"[^\\d.\\-]", "", regex=True)                                 # keep digits, the point and the minus
amount = pd.to_numeric(text, errors="coerce")                                        # what is left and not a number -> NaN
print(pd.DataFrame({"raw": raw, "amount": amount}))

# 2) one supplier, three spellings
names = pd.Series([" Nandi Electricals ", "NANDI ELECTRICALS", "nandi  electricals", "Godavari Chemicals", None])
clean = names.str.strip().str.replace(r"\\s+", " ", regex=True).str.title()
print("distinct names before and after:", names.nunique(), "->", clean.nunique())

# 3) invoice numbers: the same normalising function on both sides, then merge
books = pd.read_csv("purchase_register.csv")
gstr = pd.read_csv("supplier_invoices.csv")
def make_key(s):
    return s.str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)          # INV-0689/25-26 -> INV06892526
books["key"] = make_key(books["invoice_no"])
gstr["key"] = make_key(gstr["invoice_no"])
print("exact invoice_no + GSTIN :", len(books.merge(gstr, on=["supplier_gstin", "invoice_no"])), "rows")
print("normalised key + GSTIN   :", len(books.merge(gstr, on=["supplier_gstin", "key"])), "rows")
print(gstr.loc[gstr["invoice_no"].str.startswith("INV-"), ["si_id", "invoice_no", "key"]])`,
      note: 'Remove the first `replace` line and the first amount turns into NaN: the dot of `Rs.` survives the digit filter and looks like a second decimal point. The pattern `[^\\d.\\-]` keeps only digits, the decimal point and the minus, and removes the rupee sign the same way. The brackets rule turns an accounting negative into a real negative. The normalised key finds two more matches (23 to 25): the two invoices where the supplier typed a dash instead of a slash.',
    } },
    { pychallenge: {
      id: 'pandas-dates-text-ch1',
      prompt: 'Write `fiscal_year(dates)`. `dates` is a pandas Series of `datetime64` values. Return a Series with the same index and the Indian fiscal-year label for each date: `"FY2025-26"` for 1 April 2025 to 31 March 2026, `"FY2026-27"` for the next year, and so on. The two-digit part is the last two digits of the end year, so the year that ends in 2100 is `"FY2099-00"`.',
      starter: `def fiscal_year(dates):
    # TODO: start year = year - (month < 4); label = "FY" + start + "-" + last two digits of start + 1
    return dates.dt.year.astype(str)
`,
      tests: `import pandas as pd
d = pd.Series(pd.to_datetime(["2026-03-31", "2026-04-01", "2025-01-15", "2025-04-01", "2099-05-01"]), index=[10, 11, 12, 13, 14])
r = fiscal_year(d)
assert r.tolist() == ["FY2025-26", "FY2026-27", "FY2024-25", "FY2025-26", "FY2099-00"], r.tolist()
assert r.index.tolist() == [10, 11, 12, 13, 14]
assert fiscal_year(pd.Series(pd.to_datetime(["2024-12-31"]))).tolist() == ["FY2024-25"]
assert len(fiscal_year(pd.Series(pd.to_datetime([])))) == 0`,
      solution: `def fiscal_year(dates):
    start = dates.dt.year - (dates.dt.month < 4).astype(int)
    return "FY" + start.astype(str) + "-" + ((start + 1) % 100).astype(str).str.zfill(2)
`,
      hint: '`start = dates.dt.year - (dates.dt.month < 4).astype(int)`. The second part is `(start + 1) % 100` as text with `.astype(str).str.zfill(2)`. Join with `"FY" + start.astype(str) + "-" + ...`.',
    } },
    { pychallenge: {
      id: 'pandas-dates-text-ch2',
      prompt: 'Write `days_overdue(invoice_dates, as_of, terms_days=30)`. `invoice_dates` is a Series of text dates like `"2026-08-27"`; `as_of` is a text date. An invoice is due `terms_days` days after its invoice date. Return a Series with the same index and the **whole number of days overdue** on `as_of`: `0` when the invoice is not yet due or is due exactly on `as_of`, never negative.',
      starter: `def days_overdue(invoice_dates, as_of, terms_days=30):
    # TODO: parse, add the terms, subtract from as_of, take .dt.days, clip at 0
    return invoice_dates
`,
      tests: `import pandas as pd
inv = pd.Series(["2026-08-27", "2026-09-25", "2026-08-31", "2026-07-20"], index=[5, 6, 7, 8])
r = days_overdue(inv, "2026-09-30")
assert r.tolist() == [4, 0, 0, 42], r.tolist()
assert r.index.tolist() == [5, 6, 7, 8]
assert days_overdue(inv, "2026-09-30", terms_days=45).tolist() == [0, 0, 0, 27]
assert days_overdue(inv, "2026-06-01").tolist() == [0, 0, 0, 0]
assert str(r.dtype).startswith("int"), r.dtype`,
      solution: `def days_overdue(invoice_dates, as_of, terms_days=30):
    due = pd.to_datetime(invoice_dates) + pd.Timedelta(days=terms_days)
    return (pd.Timestamp(as_of) - due).dt.days.clip(lower=0)
`,
      hint: '`due = pd.to_datetime(invoice_dates) + pd.Timedelta(days=terms_days)`. The difference `pd.Timestamp(as_of) - due` is a timedelta Series: `.dt.days` gives whole days and `.clip(lower=0)` removes the negative ones.',
    } },
    { pychallenge: {
      id: 'pandas-dates-text-ch3',
      prompt: 'Write `monthly_totals(df)`. `df` has a text column `date` (like `"2026-01-15"`, rows in any order) and a number column `amount`. Return a Series of the **total `amount` per month**, indexed by the month label `"YYYY-MM"`, with a row for **every month from the first to the last date**, and `0` for months without any row.',
      starter: `def monthly_totals(df):
    # TODO: parse the dates, resample("MS", on="date"), sum, then label the index "YYYY-MM"
    return df["amount"]
`,
      tests: `import pandas as pd
df = pd.DataFrame({"date": ["2026-03-05", "2026-01-15", "2026-01-20"], "amount": [30, 100, 50]})
r = monthly_totals(df)
assert r.index.tolist() == ["2026-01", "2026-02", "2026-03"], r.index.tolist()
assert r.tolist() == [150, 0, 30], r.tolist()
one = monthly_totals(pd.DataFrame({"date": ["2026-05-31"], "amount": [7]}))
assert one.index.tolist() == ["2026-05"] and one.tolist() == [7]
wide = monthly_totals(pd.DataFrame({"date": ["2025-11-30", "2026-02-01"], "amount": [1, 2]}))
assert wide.index.tolist() == ["2025-11", "2025-12", "2026-01", "2026-02"], wide.index.tolist()
assert wide.tolist() == [1, 0, 0, 2]
assert df["date"].tolist() == ["2026-03-05", "2026-01-15", "2026-01-20"]`,
      solution: `def monthly_totals(df):
    d = df.assign(date=pd.to_datetime(df["date"]))
    totals = d.resample("MS", on="date")["amount"].sum()
    totals.index = totals.index.strftime("%Y-%m")
    return totals
`,
      hint: '`df.assign(date=pd.to_datetime(df["date"]))` gives a copy with real dates. `resample("MS", on="date")["amount"].sum()` makes one row for every month, 0 when empty. Then `totals.index = totals.index.strftime("%Y-%m")`.',
    } },
    { pychallenge: {
      id: 'pandas-dates-text-ch4',
      prompt: 'Write `parse_amounts(s)`. `s` is a Series of amounts typed as text, such as `"\u20b9 1,25,000.50"`, `"(1,200.00)"` (brackets mean negative), `"2,50,000"`, `" 75000 "`, an empty text, `None` or text that is not a number. Return a Series of floats with the same index: the number, negative for brackets, and NaN when there is no number. Do not change `s`.',
      starter: `def parse_amounts(s):
    # TODO: strip, turn (x) into -x, keep only digits . and -, then pd.to_numeric(errors="coerce")
    return s
`,
      tests: `import math
import pandas as pd
s = pd.Series(["\\u20b9 1,25,000.50", "(1,200.00)", "2,50,000", " 75000 ", "", None, "abc", "-30.5"], index=list("abcdefgh"))
r = parse_amounts(s)
assert r.index.tolist() == list("abcdefgh")
assert r.iloc[:4].tolist() == [125000.5, -1200.0, 250000.0, 75000.0], r.tolist()
assert r.iloc[7] == -30.5
assert all(math.isnan(x) for x in r.iloc[4:7].tolist()), r.tolist()
assert str(r.dtype) == "float64", r.dtype
assert parse_amounts(pd.Series([1500, 20.5])).tolist() == [1500.0, 20.5]
assert s.iloc[1] == "(1,200.00)" and s.iloc[0].startswith("\\u20b9")`,
      solution: `def parse_amounts(s):
    text = s.astype("string").str.strip()
    text = text.str.replace(r"^\\(([^)]*)\\)$", r"-\\1", regex=True)
    text = text.str.replace(r"[^\\d.\\-]", "", regex=True)
    return pd.to_numeric(text, errors="coerce").astype(float)
`,
      hint: 'Convert with `s.astype("string")` so numbers and None are handled too. First turn `(1,200.00)` into `-1,200.00` with `str.replace(r"^\\(([^)]*)\\)$", r"-\\1", regex=True)`, then delete everything except digits, the point and the minus with `r"[^\\d.\\-]"`, then `pd.to_numeric(..., errors="coerce").astype(float)`.',
    } },
    { real: `Dates and text clean-up is where reconciliations are won. **Payables ageing**: due date = invoice date + terms, days overdue on the reporting date, bucket with \`pd.cut\`, and the totals of the buckets must add up to the register. **FY reporting**: a tested \`fiscal_year\` function in your toolkit, because "FY2025-26" is wrong in half of the files in any shared drive. **Month-end completeness**: build the month calendar with \`resample\` and check that no branch is missing a month before the consolidation. **GST matching**: normalise GSTIN and invoice numbers with the same function on both sides, validate shapes with \`fullmatch\`, and keep the rows that fail in a separate "needs a human" list rather than dropping them.` },
    { interview: `**"How do you handle a column with mixed date formats in pandas?"**
Model answer: "I first find out which formats exist. I parse each known format with an explicit \`format=\` and \`errors="coerce"\`, combine the results with \`fillna\`, and count what is still \`NaT\`: those go to an exception list. I avoid format guessing because pandas 2 takes the format of the first value, and a different format later in the column becomes NaT without a warning."

**"How do you compute the fiscal quarter for an April to March year?"**
"With arithmetic: \`((month - 4) % 12) // 3 + 1\` for the quarter and \`year - (month < 4)\` for the starting year, wrapped in a function with tests for 31 March and 1 April. The built-in \`to_period("Q-MAR")\` works too, but it labels a fiscal year by the year it ends, so I check the label before I report it."

**"How would you validate GSTIN or PAN values in a DataFrame?"**
"Read the column as text, strip and upper-case it, and use \`str.fullmatch\` with the pattern and \`na=False\`. That checks the shape only, so I also compare against the supplier master or verify the checksum, and I report the rows that fail instead of deleting them."` },
    `## Recap
- \`pd.to_datetime(raw, format="%d/%m/%Y", errors="coerce")\`: always give the **format**, coerce bad values to \`NaT\`, and **count the failures**. pandas 2 guesses the format from the first value, so a different format later silently becomes \`NaT\`.
- \`.dt\` needs the \`datetime64\` dtype. Indian fiscal year: start year = \`year - (month < 4)\`, quarter = \`((month - 4) % 12) // 3 + 1\`. \`to_period("Q-MAR")\` labels a fiscal year by the year it **ends**.
- Date maths: subtract dates for a timedelta (\`.dt.days\`), \`pd.Timedelta(days=30)\`, \`DateOffset(months=1)\`, \`MonthEnd(0)\`. Keep UTC inside systems and convert for display.
- \`resample("MS")\` (or \`"QS-APR"\`) gives a row for **every** period, so empty months show up as 0; \`groupby\` leaves them out. A calendar built with \`date_range\` and \`reindex\` finds gaps; filling a gap is a policy decision.
- \`.str\`: strip, upper, replace (with \`regex=True\` when you mean a pattern), \`contains(..., na=False)\`, \`fullmatch\` to validate, \`extract\` to split into columns. Normalise **both** sides of a join with the same function. A regex checks the shape, not the checksum.`,
  ],
  quiz: [
    { q: 'What does `pd.to_datetime(pd.Series(["2026-08-27", "27/08/2026"]), errors="coerce")` return?', o: ['both values become dates, because pandas tries every format', 'the first value becomes a date and the second silently becomes NaT', 'pandas raises a ValueError', 'both values become NaT'], a: 1, why: 'pandas 2 guesses the format from the first value and applies it to the whole column. A value in another format becomes NaT without a warning. Give an explicit `format=`.' },
    { q: 'Which expression gives the start year of the Indian fiscal year (April to March) for a Series of dates?', o: ['`dates.dt.year`', '`dates.dt.year + (dates.dt.month < 4)`', '`dates.dt.year - (dates.dt.month > 4)`', '`dates.dt.year - (dates.dt.month < 4).astype(int)`'], a: 3, why: 'January to March belong to the fiscal year that started in the previous calendar year, so subtract 1 when the month is below 4. The other lines give the calendar year or move the wrong months.' },
    { q: 'A month has no orders. What does `orders.resample("MS", on="order_date")["amount"].sum()` return for that month?', o: ['the month is left out of the result', 'NaN', '0: the month is kept in the result', 'a KeyError'], a: 2, why: '`resample` creates a row for every period between the first and last date and sums an empty period to 0. A `groupby` on the month would leave that month out.' },
    { q: 'What does `df["pan"].str.contains("[A-Z]{5}")` return for the rows where `pan` is missing?', o: ['NaN, so pass `na=False` before you use it as a filter', 'False', 'True', 'it raises a TypeError'], a: 0, why: 'String methods keep missing values missing. A mask that contains NaN cannot be used to select rows, so write `contains(..., na=False)`.' },
    { q: 'A supplier GSTIN passes `str.fullmatch` with the GSTIN pattern. What does that prove?', o: ['the GSTIN is registered with the tax department', 'the supplier invoice is valid', 'only that it has the right shape: a wrong last character can still pass', 'that the state code is correct'], a: 2, why: 'The pattern checks 15 characters in a fixed layout, and it accepts any letter or digit in the checksum position. Compare with the supplier master or verify the checksum for real validation.' },
    { q: '`pd.to_datetime(pd.Series(["03/04/2026"]), dayfirst=True)` gives which date?', o: ['4 March 2026', '3 April 2026', 'NaT', 'the text unchanged'], a: 1, why: '`dayfirst=True` reads the first number as the day, so 03/04/2026 is 3 April 2026. Without it the same text can be read as 4 March.' },
  ],
  task: {
    title: 'A dates-and-text toolkit for the Kollana files',
    steps: [
      'In `C:\\fde\\pandas-lab` create `04_dates_text.py`. Read `orders.csv` with `parse_dates=["order_date"]` and `purchase_register.csv` with `parse_dates=["invoice_date"]`.',
      'Write `fiscal_year(dates)` and `fiscal_quarter(dates)`, test them on 2026-03-31 and 2026-04-01, and print the order total per fiscal quarter. The four quarters must add up to 20,980,275.',
      'Compute `due` (30-day terms) and `overdue_days` as of 30 September 2026 for the purchase register. Bucket the days into not due, 1-30, 31-60 and over 60, and check that the buckets contain all 30 invoices.',
      'Build the monthly revenue with `resample("MS")`. Then drop the months April and June from a copy of the orders and show that `resample` still lists May with 0.',
      'Read `employees.csv` as text and print the employees with an invalid IFSC (7 and 14) and a missing PAN (9 and 18), using `str.fullmatch` with `na=False`.',
      'Write `make_key(s)` and merge the purchase register with the supplier file on GSTIN and the normalised invoice key. You should get 25 rows, up from 23 on the exact invoice number.',
    ],
    deliverable: '`04_dates_text.py` and its output, with `fiscal_year` and `make_key` as small functions that have at least two `assert` tests each.',
  },
};
