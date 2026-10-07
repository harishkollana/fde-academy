export default {
  id: 'pandas-excel-openpyxl',
  title: 'Excel in and out: messy sheets in, MIS packs out',
  goal: 'You can read a messy real-world Excel sheet (title block, merged headers, blank rows, subtotals, several tabs) into a clean DataFrame, and write a formatted multi-sheet MIS pack with pandas and openpyxl: number formats, widths, header style, freeze panes, formulas and a chart, without the classic traps.',
  roadmap: ['read_excel: sheets, header rows, usecols', 'messy sheets', 'writing with ExcelWriter and openpyxl', 'formats, widths, formulas, charts, multiple sheets'],
  blocks: [
    `## The problem
Excel is where finance data starts and where it ends. It **starts** there because people type, paste and merge cells: a branch sends a sheet with a title block, a two-line merged header, a subtotal after every group, a blank row, and a "Total" line at the bottom. It **ends** there because the CFO, the auditor and the branch head will not read a CSV: they open an Excel file, and it has to look right (thousands separators, column widths, a frozen header, a total that is a live formula, maybe a chart).

Both directions are code you will write many times. The reading side is mostly **defence**: you cannot trust the layout, so you find things by what they say, not by where they are, and you check the numbers against the totals the sheet already contains. The writing side is mostly **presentation**: compute everything in pandas, write the values, then decorate with \`openpyxl\`. This lesson teaches both.

A note on what runs where. \`pandas.read_excel\` and \`openpyxl\` are installed on your laptop (first pandas task). The lesson playgrounds in the browser do **not** have \`openpyxl\`, so they work on the same data in the form pandas gives you after reading: a raw grid. Every line of openpyxl code in this lesson was run on a real file, and the output you should expect is shown.`,
    `## Reading Excel: the options you need
\`\`\`python
df = pd.read_excel("MIS_Apr.xlsx", sheet_name="Apr", header=4, usecols="A:E", skipfooter=1,
                   dtype={"GSTIN": str}, na_values=["-"])
\`\`\`
- **\`sheet_name\`**: a name or a position. **\`sheet_name=None\` reads every sheet** and returns a dict \`{sheet name: DataFrame}\`: that is the tool for "twelve monthly tabs".
- **\`header\`**: the row (counted from 0) that holds the column names. \`header=[3, 4]\` uses two rows and makes a two-level column index. \`header=None\` means no header: you get the **raw grid**.
- **\`usecols\`**: columns by Excel letters (\`"A:E"\`, \`"A,C:F"\`) or by name. **\`skiprows\`**, **\`skipfooter\`**, **\`nrows\`**: skip the top, skip the bottom, read only the first rows.
- **\`dtype\`**, **\`na_values\`**, **\`converters\`**: the same ideas as \`read_csv\` (keep GSTINs and account numbers as text).
- It needs \`openpyxl\` for \`.xlsx\` (and \`xlrd\` for the old \`.xls\`).

What a real sheet looks like to pandas:
- **Blank rows are kept** (as rows of NaN). Unlike \`read_csv\`, nothing is skipped, so row numbers match what you see in Excel (minus one).
- A **merged cell** holds its value **only in its top-left cell**; the other cells of the merge are blank.
- Two columns with the same header (\`Rev\`, \`Rev\`) become \`Rev\` and \`Rev.1\`.
- You get the **cached value** of a formula, the number Excel last calculated and saved, never the formula itself.

The robust technique is therefore to read the sheet as a **raw grid** (\`header=None\`) and **find the header row by its text**. A hard-coded \`header=4\` breaks the month somebody inserts a row above the table.`,
    { sketch: { w: 760, h: 340, caption: 'A sheet as pandas sees it with header=None: find the header row by its text, fill the merged group, drop the subtotals and use the Total as a check', items: [
      { t: 'table', x: 44, y: 36, cols: ['A', 'B', 'C', 'D', 'E'], colW: [168, 52, 52, 52, 52], rows: [['Branch sales MIS', 'NaN', 'NaN', 'NaN', 'NaN'], ['April 2025 (INR)', 'NaN', 'NaN', 'NaN', 'NaN'], ['NaN', 'NaN', 'NaN', 'NaN', 'NaN'], ['NaN', 'Q1', 'NaN', 'Q2', 'NaN'], ['Account', 'Rev', 'Cost', 'Rev', 'Cost'], ['4100 Product sales', '1000', '400', '1200', '500'], ['4200 Services', '800', '300', '900', '350'], ['Subtotal sales', '1800', '700', '2100', '850'], ['NaN', 'NaN', 'NaN', 'NaN', 'NaN'], ['Total', '1800', '700', '2100', '850']], rowH: 26, dim: [0, 1, 2, 7, 8, 9], hl: [4] },
      { t: 'text', x: 30, y: 75, text: '0', size: 13 }, { t: 'text', x: 30, y: 101, text: '1', size: 13 }, { t: 'text', x: 30, y: 127, text: '2', size: 13 },
      { t: 'text', x: 30, y: 153, text: '3', size: 13 }, { t: 'text', x: 30, y: 179, text: '4', size: 13 }, { t: 'text', x: 30, y: 205, text: '5', size: 13 },
      { t: 'text', x: 30, y: 231, text: '6', size: 13 }, { t: 'text', x: 30, y: 257, text: '7', size: 13 }, { t: 'text', x: 30, y: 283, text: '8', size: 13 }, { t: 'text', x: 30, y: 309, text: '9', size: 13 },
      { t: 'text', x: 440, y: 101, text: 'title block and a blank row: skip', size: 14, anchor: 'start' },
      { t: 'text', x: 440, y: 153, text: 'merged group header: fill it to the right', size: 14, anchor: 'start' },
      { t: 'text', x: 440, y: 179, text: 'HEADER ROW: find it by its text', size: 14, anchor: 'start', bold: true },
      { t: 'text', x: 440, y: 218, text: 'data rows: keep', size: 14, anchor: 'start' },
      { t: 'text', x: 440, y: 283, text: 'subtotal, blank row, Total: drop', size: 14, anchor: 'start' },
      { t: 'note', x: 440, y: 296, w: 310, h: 36, fill: 'yellow', size: 13, text: 'The Total row is a free check: your own\nsum of the data rows must equal it.' },
    ] } },
    { py: {
      title: 'The raw grid: find the header row by its text, fill the merged group, drop the blanks',
      starter: `import io
import pandas as pd
pd.set_option("display.width", 120)

# This is what pd.read_excel("file.xlsx", sheet_name="Apr", header=None) returns for a typical finance sheet:
# every cell is kept, blank cells are NaN, and a merged cell keeps its text in the top-left cell only.
rows = [
    ["Kollana Tech - Branch sales MIS", None, None, None, None],
    ["April 2025 (amounts in INR)", None, None, None, None],
    [None, None, None, None, None],
    [None, "Q1", None, "Q2", None],
    ["Account", "Rev", "Cost", "Rev", "Cost"],
    ["4100 Product sales", 1000, 400, 1200, 500],
    ["4200 Services", 800, 300, 900, 350],
    ["Subtotal sales", 1800, 700, 2100, 850],
    [None, None, None, None, None],
    ["Total", 1800, 700, 2100, 850],
]
grid = pd.DataFrame(rows)
print(grid)

# 1) find the header row by what it says, not by a fixed number (people insert rows)
header_row = int(grid.index[grid[0] == "Account"][0])
print("header row:", header_row)

# 2) a two-row header: the group (Q1, Q2) sits above, blank under a merged cell: fill it to the right
group = grid.iloc[header_row - 1].ffill().fillna("")
names = (group + " " + grid.iloc[header_row]).str.strip()
print(names.tolist())

# 3) the data: everything below the header, without the blank rows
data = grid.iloc[header_row + 1:].copy()
data.columns = names
data = data.dropna(how="all")
print(data)

# if you let pandas read a header row that repeats a name, it renames the repeats (read_excel does the same)
print(pd.read_csv(io.StringIO("Rev,Cost,Rev,Cost\\n1,2,3,4")).columns.tolist())`,
      note: 'The merged cells **Q1** (over B and C) and **Q2** (over D and E) are blank in C and E. \`ffill()\` copies each group name to the right, so the four columns become Q1 Rev, Q1 Cost, Q2 Rev and Q2 Cost. The subtotal and the Total are still in `data`: the next playground handles them.',
    } },
    { py: {
      title: 'Subtotals, the Total as a free check, and numbers stored as text',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

rows = [
    ["Kollana Tech - Branch sales MIS", None, None, None, None],
    [None, None, None, None, None],
    [None, "Q1", None, "Q2", None],
    ["Account", "Rev", "Cost", "Rev", "Cost"],
    ["4100 Product sales", 1000, 400, 1200, 500],
    ["4200 Services", "800", "300", "900", "350"],          # numbers typed as text: a classic
    ["Subtotal sales", 1800, 700, 2100, 850],
    [None, None, None, None, None],
    ["TOTAL", 1800, 700, 2100, 850],
]

def tidy(rows, first_header="Account"):
    grid = pd.DataFrame(rows)
    h = int(grid.index[grid[0] == first_header][0])
    group = grid.iloc[h - 1].ffill().fillna("")
    names = (group + " " + grid.iloc[h]).str.strip()
    data = grid.iloc[h + 1:].copy()
    data.columns = names
    data = data.dropna(how="all")
    label = data[first_header].astype("string")
    is_total = label.str.contains(r"^(?:sub)?total", case=False, na=False)      # Subtotal..., Total, TOTAL
    sheet_totals = data[label.str.contains(r"^total", case=False, na=False)]
    detail = data[~is_total].reset_index(drop=True)
    numbers = [c for c in detail.columns if c != first_header]
    detail[numbers] = detail[numbers].apply(pd.to_numeric, errors="coerce")          # "800" -> 800
    return detail, sheet_totals.iloc[0][numbers].astype(float)

detail, stated_total = tidy(rows)
print(detail)
print("dtypes:", detail.dtypes.astype(str).to_dict())

# the sheet's own Total row is a free check on the data
my_total = detail.drop(columns="Account").sum()
print("stated total:", stated_total.tolist())
print("my total    :", my_total.tolist())
print("sheet adds up:", bool((my_total == stated_total).all()))

# somebody typed over a cell: the check catches it
rows[4][1] = 1100
detail2, stated2 = tidy(rows)
diff = detail2.drop(columns="Account").sum() - stated2
print("after the typo, differences by column:", diff[diff != 0].to_dict())`,
      note: 'Two habits: classify rows by what they **say** (\`Subtotal\`, \`Total\`, in any case) and never by their position, and always reconcile your detail to the total the sheet states. The typo of 100 in one cell shows up as exactly 100 in the Q1 Rev column.',
    } },
    { py: {
      title: 'Twelve monthly tabs into one table, with a check per tab',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

def make_tab(month, values):
    """Build the rows of one tab like a branch would send it."""
    body = [[name, *vals] for name, vals in values.items()]
    total = [sum(v[i] for v in values.values()) for i in range(2)]
    return [
        [f"Branch sales {month}", None, None],
        [None, None, None],
        ["Account", "Rev", "Cost"],
        *body,
        [None, None, None],
        ["Total", *total],
    ]

# what pd.read_excel("pack.xlsx", sheet_name=None, header=None) returns: a dict of raw grids, one per tab
tabs = {
    "Apr": pd.DataFrame(make_tab("Apr", {"4100 Product sales": [1000, 400], "4200 Services": [800, 300]})),
    "May": pd.DataFrame(make_tab("May", {"4100 Product sales": [1100, 450], "4200 Services": [700, 280]})),
    "Jun": pd.DataFrame(make_tab("Jun", {"4100 Product sales": [900, 380], "4200 Services": [950, 310], "4300 Licences": [200, 50]})),
}

def tidy_tab(grid):
    h = int(grid.index[grid[0] == "Account"][0])
    data = grid.iloc[h + 1:].copy()
    data.columns = grid.iloc[h].tolist()
    data = data.dropna(how="all")
    is_total = data["Account"].astype("string").str.match(r"(?i)total", na=False)
    stated = data[is_total].iloc[0][["Rev", "Cost"]].astype(float)
    detail = data[~is_total].reset_index(drop=True)
    detail[["Rev", "Cost"]] = detail[["Rev", "Cost"]].apply(pd.to_numeric)
    return detail, stated

frames = []
for name, grid in tabs.items():
    detail, stated = tidy_tab(grid)
    mine = detail[["Rev", "Cost"]].sum()
    assert (mine == stated).all(), f"tab {name} does not add up"           # stop loudly, name the tab
    frames.append(detail.assign(tab=name))
    print(f"{name}: {len(detail)} lines, Rev {mine['Rev']:,.0f}, Cost {mine['Cost']:,.0f}  (matches the tab's Total)")

all_tabs = pd.concat(frames, ignore_index=True)
print(all_tabs)
print(all_tabs.groupby("Account")[["Rev", "Cost"]].sum())`,
      note: 'This is the consolidation pattern: read every tab (`sheet_name=None`), tidy each one with the same function, **check it against its own Total**, add the tab name as a column and stack with `concat`. The June tab has a third account: the stacked table simply has one more row, because accounts are data, not layout.',
    } },
    `## Writing Excel: pandas for the data, openpyxl for the looks
The pattern is always the same: **compute in pandas, write the values, then decorate**.

\`\`\`python
with pd.ExcelWriter("pack.xlsx", engine="openpyxl") as writer:
    summary.to_excel(writer, sheet_name="Summary", index=False, startrow=2)   # leave rows 1-2 for a title
    detail.to_excel(writer, sheet_name="Detail", index=False)
    ws = writer.sheets["Summary"]            # the openpyxl worksheet: now use openpyxl on it
    ws["A1"] = "Kollana Tech IN01: monthly P&L"
\`\`\`

What openpyxl gives you on that worksheet \`ws\`:

| You want | You write |
|---|---|
| bold, colours, fills | \`cell.font = Font(bold=True, color="FFFFFF")\`, \`cell.fill = PatternFill("solid", fgColor="1F4E78")\` |
| alignment | \`cell.alignment = Alignment(horizontal="center")\` |
| number display | \`cell.number_format = "#,##0.00"\` (display only; the value stays a number) |
| column width | \`ws.column_dimensions["B"].width = 18\` |
| frozen header | \`ws.freeze_panes = "A4"\` (rows above row 4 stay visible) |
| filter buttons | \`ws.auto_filter.ref = ws.dimensions\` |
| a formula | \`ws["E4"] = "=B4-C4-D4"\` (a text that starts with \`=\`) |
| a chart | \`BarChart()\`, \`Reference(ws, ...)\`, \`ws.add_chart(chart, "G3")\` |
| another sheet | another \`to_excel(writer, sheet_name=...)\` |

**Never write formatted text.** If you turn \`125000.5\` into the string \`"1,25,000.50"\` before writing, Excel gets text and cannot add it up. Write the **number** and set \`number_format\`; the grouping you see is decided by the format and by the machine's regional settings, so check on the computer that will open the file.

**Formulas or values?** A formula keeps the pack alive (the reader changes a cell and the total follows) and shows its workings to an auditor. But **openpyxl does not calculate**. It stores the formula text; the result appears when Excel opens the file. Until then the file has **no cached value**, and \`pd.read_excel\` (or \`load_workbook(data_only=True)\`) sees NaN or \`None\` in those cells. So: compute the numbers in pandas as well (your "shadow" calculation), write plain values for anything that code will read again, and use formulas for totals and ratios that people will read.`,
    { sketch: { w: 760, h: 330, caption: 'A pack is values from pandas, plus styles, widths, formulas and a chart from openpyxl: the formulas only get their results when Excel opens the file', items: [
      { t: 'table', x: 24, y: 50, cols: ['month', 'Revenue', 'COGS', 'Opex', 'Operating profit'], colW: [76, 104, 96, 104, 170], rows: [['2025-04', '233,914.19', '44,519.69', '272,371.92', '=B4-C4-D4'], ['2025-05', '231,135.99', '46,764.48', '245,100.77', '=B5-C5-D5'], ['...', '...', '...', '...', '...'], ['Total', '=SUM(B4:B15)', '=SUM(C4:C15)', '=SUM(D4:D15)', '=SUM(E4:E15)']], rowH: 30, fill: 'blue' },
      { t: 'note', x: 614, y: 38, w: 136, h: 44, fill: 'blue', size: 13, text: 'header style:\nFont + PatternFill' },
      { t: 'note', x: 614, y: 88, w: 136, h: 44, fill: 'green', size: 13, text: 'number_format\n"#,##0.00"' },
      { t: 'note', x: 614, y: 138, w: 136, h: 44, fill: 'yellow', size: 13, text: 'formulas are text\nstarting with =' },
      { t: 'note', x: 614, y: 188, w: 136, h: 44, fill: 'pink', size: 13, text: 'freeze_panes = "A4"\nrows 1-3 stay' },
      { t: 'arrow', x1: 612, y1: 60, x2: 580, y2: 60 },
      { t: 'arrow', x1: 612, y1: 110, x2: 580, y2: 110 },
      { t: 'arrow', x1: 612, y1: 160, x2: 580, y2: 160 },
      { t: 'box', x: 24, y: 250, w: 120, h: 40, fill: 'blue', label: 'Summary', size: 16 },
      { t: 'box', x: 150, y: 250, w: 120, h: 40, fill: 'grey', label: 'Detail', size: 16 },
      { t: 'box', x: 276, y: 250, w: 120, h: 40, fill: 'grey', label: 'Checks', size: 16 },
      { t: 'text', x: 420, y: 262, text: 'one to_excel(writer, sheet_name=...) per tab', size: 14, anchor: 'start' },
      { t: 'text', x: 420, y: 284, text: 'chart: BarChart + Reference, ws.add_chart(chart, "G3")', size: 14, anchor: 'start' },
    ] } },
    { py: {
      title: 'Prepare the data of a pack (summary, detail, checks) and the widths, before any Excel is involved',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

gl = pd.read_csv("fact_gl.csv", parse_dates=["posting_date"])
accounts = pd.read_csv("dim_account.csv")
business = [c for c in gl.columns if c != "gl_id"]
gl = gl.drop_duplicates(business)                         # the 3 extra copies found in the cleaning lesson

in01 = gl[gl["entity_id"] == 1].merge(
    accounts[["account_id", "account_code", "account_name", "account_type"]],
    on="account_id", how="left", validate="m:1",
)
in01["signed"] = in01["credit"] - in01["debit"]           # revenue: the credit side is positive
costs = in01["account_type"].isin(["COGS", "Opex"])
in01.loc[costs, "signed"] = in01["debit"] - in01["credit"]
pl = in01[in01["account_type"].isin(["Revenue", "COGS", "Opex"])].copy()
pl["month"] = pl["posting_date"].dt.strftime("%Y-%m")

summary = pl.pivot_table(index="month", columns="account_type", values="signed", aggfunc="sum", fill_value=0).round(2)
summary = summary[["Revenue", "COGS", "Opex"]].reset_index()
summary.columns.name = None
detail = pl.pivot_table(index=["account_code", "account_name"], columns="month", values="signed", aggfunc="sum", fill_value=0).round(2)
detail = detail.reset_index()
detail.columns.name = None
journals = gl.groupby("journal_id")[["debit", "credit"]].sum()
journals["difference"] = (journals["debit"] - journals["credit"]).round(2)
checks = journals[journals["difference"] != 0].reset_index()

print(summary.head(3))
print("revenue, April:", summary["Revenue"].iloc[0], "| whole year:", f"{summary['Revenue'].sum():,.2f}")
print(checks)

# the layout decisions that need no Excel: a width per column from its longest text
def auto_widths(df, min_width=8, max_width=40):
    widths = {}
    for col in df.columns:
        longest = max([len(str(col))] + [len(str(v)) for v in df[col]])
        widths[col] = max(min_width, min(max_width, longest + 2))
    return widths

for name, frame in {"Summary": summary, "Detail": detail, "Checks": checks}.items():
    print(f"{name:<8}{frame.shape[0]:>3} rows x {frame.shape[1]:>2} columns | widths:", list(auto_widths(frame).values()))`,
      note: 'Revenue for IN01 is 233,914.19 in April and 2,766,772.33 for the year: the same figures the SQL lessons produced from the database. One journal, JV202504-0051, is out of balance by 500: it goes on the Checks sheet of the pack, so the reader sees the problem instead of a silent total. The widths are what you would pass to `ws.column_dimensions[...]`.',
    } },
    { py: {
      title: 'Column letters and formula text, plus the shadow calculation Excel must agree with',
      starter: `import pandas as pd

def excel_col(n):
    """1 -> A, 26 -> Z, 27 -> AA, 703 -> AAA (the letters of Excel columns)"""
    name = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        name = chr(65 + rem) + name
    return name

print([excel_col(n) for n in (1, 2, 26, 27, 52, 53, 702, 703)])

summary = pd.DataFrame({
    "month": ["2025-04", "2025-05", "2025-06"],
    "Revenue": [233914.19, 231135.99, 247185.73],
    "COGS": [44519.69, 46764.48, 55598.08],
    "Opex": [272371.92, 245100.77, 275243.75],
})

def total_formulas(df, first_row):
    """A SUM formula for every numeric column. The data starts in sheet row first_row."""
    last_row = first_row + len(df) - 1
    out = {}
    for position, col in enumerate(df.columns, start=1):
        if pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_bool_dtype(df[col]):
            letter = excel_col(position)
            out[letter] = f"=SUM({letter}{first_row}:{letter}{last_row})"
    return out

formulas = total_formulas(summary, first_row=4)             # the header is in row 3, the data from row 4
print(formulas)
print("row formulas:", [f"=B{r}-C{r}-D{r}" for r in range(4, 4 + len(summary))])

# openpyxl will not calculate these. You do, in pandas, so you know what Excel must show when it opens the file
profit = summary["Revenue"] - summary["COGS"] - summary["Opex"]
print("Excel must show, per month:", profit.round(2).tolist())
print("Excel must show in the totals:", summary[["Revenue", "COGS", "Opex"]].sum().round(2).to_dict(), "| profit", round(float(profit.sum()), 2))`,
      note: 'This is a "shadow calculation": the file holds formulas, your script holds the numbers they must produce. After you open the pack in Excel once, compare the total row with the printed shadow values. Production scripts sometimes also write the shadow numbers on the Checks sheet.',
    } },
    { local: `**Write a real MIS pack and look inside it** (virtual environment active, in \`C:\\fde\\pandas-lab\`, with the CSV files). Save this as \`08_pack.py\`:
\`\`\`python
from pathlib import Path
import pandas as pd
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Font, PatternFill

OUT = Path("kollana_mis_in01.xlsx")


def prepare():
    gl = pd.read_csv("fact_gl.csv", parse_dates=["posting_date"])
    accounts = pd.read_csv("dim_account.csv")
    business = [c for c in gl.columns if c != "gl_id"]
    gl = gl.drop_duplicates(business)                        # the 3 extra copies found in the cleaning lesson

    in01 = gl[gl["entity_id"] == 1].merge(
        accounts[["account_id", "account_code", "account_name", "account_type"]],
        on="account_id", how="left", validate="m:1",
    )
    in01["signed"] = in01["credit"] - in01["debit"]          # revenue: credit side is positive
    costs = in01["account_type"].isin(["COGS", "Opex"])
    in01.loc[costs, "signed"] = in01["debit"] - in01["credit"]
    pl = in01[in01["account_type"].isin(["Revenue", "COGS", "Opex"])].copy()
    pl["month"] = pl["posting_date"].dt.strftime("%Y-%m")

    summary = pl.pivot_table(index="month", columns="account_type", values="signed", aggfunc="sum", fill_value=0).round(2)
    summary = summary[["Revenue", "COGS", "Opex"]].reset_index()
    summary.columns.name = None
    detail = pl.pivot_table(index=["account_code", "account_name"], columns="month", values="signed", aggfunc="sum", fill_value=0).round(2)
    detail = detail.reset_index()
    detail.columns.name = None
    journals = gl.groupby("journal_id")[["debit", "credit"]].sum()
    journals["difference"] = (journals["debit"] - journals["credit"]).round(2)
    checks = journals[journals["difference"] != 0].reset_index()
    return summary, detail, checks


def write_pack(path, summary, detail, checks):
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        summary.to_excel(writer, sheet_name="Summary", index=False, startrow=2)    # rows 1-2 stay free for a title
        detail.to_excel(writer, sheet_name="Detail", index=False)
        checks.to_excel(writer, sheet_name="Checks", index=False)

        ws = writer.sheets["Summary"]
        ws["A1"] = "Kollana Tech IN01: monthly P&L, FY 2025-26 (INR)"
        ws["A1"].font = Font(bold=True, size=14)
        ws["E3"] = "Operating profit"
        blue = PatternFill("solid", fgColor="1F4E78")
        for cell in ws[3]:                                     # style the header row
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = blue
            cell.alignment = Alignment(horizontal="center")

        first, last = 4, 3 + len(summary)                      # the data rows of the table
        for r in range(first, last + 1):
            ws[f"E{r}"] = f"=B{r}-C{r}-D{r}"                   # a formula is a text that starts with =
        total = last + 1
        ws[f"A{total}"] = "Total"
        for col in "BCDE":
            ws[f"{col}{total}"] = f"=SUM({col}{first}:{col}{last})"
        for cell in ws[total]:
            cell.font = Font(bold=True)
        for row in ws.iter_rows(min_row=first, max_row=total, min_col=2, max_col=5):
            for cell in row:
                cell.number_format = "#,##0.00"                # display only: the value stays a number
        ws.column_dimensions["A"].width = 12
        for col in "BCDE":
            ws.column_dimensions[col].width = 18
        ws.freeze_panes = "A4"                                 # rows 1-3 stay visible when you scroll

        chart = BarChart()
        chart.title = "Revenue and Opex by month"
        chart.add_data(Reference(ws, min_col=2, max_col=2, min_row=3, max_row=last), titles_from_data=True)
        chart.add_data(Reference(ws, min_col=4, max_col=4, min_row=3, max_row=last), titles_from_data=True)
        chart.set_categories(Reference(ws, min_col=1, min_row=first, max_row=last))
        chart.width, chart.height = 16, 8
        ws.add_chart(chart, "G3")

        writer.sheets["Detail"].freeze_panes = "C2"
        writer.sheets["Detail"].column_dimensions["A"].width = 14
        writer.sheets["Detail"].column_dimensions["B"].width = 26


if __name__ == "__main__":
    summary, detail, checks = prepare()
    write_pack(OUT, summary, detail, checks)
    print(f"wrote {OUT}: 3 sheets, revenue total {summary['Revenue'].sum():,.2f}, {len(checks)} unbalanced journal(s) on the Checks sheet")
\`\`\`
Run \`python 08_pack.py\`. Expected output:
\`\`\`text
wrote kollana_mis_in01.xlsx: 3 sheets, revenue total 2,766,772.33, 1 unbalanced journal(s) on the Checks sheet
\`\`\`
Now **close Excel if the file is open** (a file open in Excel is locked, and Python raises \`PermissionError\`), open \`kollana_mis_in01.xlsx\` in Excel and look: a dark blue header, a frozen top, two number columns with thousands separators, a total row, a bar chart on the right, and the **Operating profit** column filled with numbers that Excel calculated when it opened the file.` },
    { local: `**Look inside the pack with code.** Save as \`08_check.py\`, run it **before** you open the file in Excel for the first time:
\`\`\`python
import openpyxl
import pandas as pd

path = "kollana_mis_in01.xlsx"
wb = openpyxl.load_workbook(path)                       # formulas as written
ws = wb["Summary"]
print(wb.sheetnames)
print("Summary!E4 formula  :", ws["E4"].value)
print("Summary!B16 formula :", ws["B16"].value)
print("freeze panes:", ws.freeze_panes, "| width of column B:", ws.column_dimensions["B"].width,
      "| number format of B4:", ws["B4"].number_format, "| charts:", len(ws._charts))

cached = openpyxl.load_workbook(path, data_only=True)["Summary"]      # the values Excel last calculated
print("cached value of E4 :", cached["E4"].value, "(no Excel has calculated it yet)")

frame = pd.read_excel(path, sheet_name="Summary", header=2)
print("pandas reads the formula column as:", frame["Operating profit"].head(3).tolist())
print("revenue column (plain numbers)    :", frame["Revenue"].head(2).tolist())
\`\`\`
Expected output:
\`\`\`text
['Summary', 'Detail', 'Checks']
Summary!E4 formula  : =B4-C4-D4
Summary!B16 formula : =SUM(B4:B15)
freeze panes: A4 | width of column B: 18.0 | number format of B4: #,##0.00 | charts: 1
cached value of E4 : None (no Excel has calculated it yet)
pandas reads the formula column as: [nan, nan, nan]
revenue column (plain numbers)    : [233914.19, 231135.99]
\`\`\`
This is the whole lesson in six lines: the **values** you wrote with pandas are readable, the **formulas** you wrote with openpyxl are not calculated until Excel opens the file, and every look-and-feel setting can be checked from code. If Excel opens the file and you save it, the cached values appear and \`pandas\` reads numbers in the formula cells too.` },
    { sketch: { w: 760, h: 300, caption: 'openpyxl stores the formula but not its result: pandas sees NaN until Excel has calculated and saved the file', items: [
      { t: 'box', x: 14, y: 110, w: 170, h: 70, fill: 'blue', label: 'openpyxl writes', sub: '"=SUM(B4:B15)"', size: 16 },
      { t: 'arrow', x1: 186, y1: 145, x2: 232, y2: 145 },
      { t: 'doc', x: 236, y: 105, w: 150, h: 80, fill: 'yellow', label: 'pack.xlsx\nformula, no value' },
      { t: 'arrow', x1: 388, y1: 130, x2: 450, y2: 70 },
      { t: 'arrow', x1: 388, y1: 160, x2: 450, y2: 222 },
      { t: 'box', x: 454, y: 40, w: 190, h: 56, fill: 'pink', label: 'pd.read_excel', sub: 'reads it straight away', size: 15 },
      { t: 'arrow', x1: 646, y1: 68, x2: 676, y2: 68 },
      { t: 'text', x: 716, y: 68, text: 'NaN', size: 22, bold: true, color: '#c0392b' },
      { t: 'box', x: 454, y: 194, w: 190, h: 56, fill: 'green', label: 'Excel opens, saves', sub: 'calculates the formula', size: 15 },
      { t: 'arrow', x1: 646, y1: 222, x2: 676, y2: 222 },
      { t: 'text', x: 716, y: 222, text: '2766772.33', size: 14, bold: true, color: '#2f9e44' },
      { t: 'text', x: 549, y: 150, text: 'two roads', size: 15 },
      { t: 'note', x: 14, y: 262, w: 732, h: 30, fill: 'grey', size: 13, text: 'So compute the numbers in pandas as well (a shadow calculation), and write plain values for anything that code will read again.' },
    ] } },
    { warn: `Excel traps:
- **openpyxl does not calculate formulas.** The cells have no value until Excel opens the file; \`pd.read_excel\` returns NaN for them.
- **A file open in Excel is locked.** Writing to it raises \`PermissionError\`. Close it, or write to a new file name with the date in it.
- **Never overwrite the input.** Write the pack to a new file, and keep the raw file you received.
- **Formatted text is not a number.** Write \`125000.5\`, set \`number_format\`, and let Excel group the digits.
- **Hard-coded positions.** \`header=4\` and \`usecols="A:F"\` break when somebody inserts a row or a column: find the header by its text.
- **Reading is not editing.** \`openpyxl.load_workbook(...)\` followed by \`save\` can lose objects it does not read (shapes, and in some cases charts or images). Write new packs from scratch, and test what survives before you edit a workbook someone else built.
- **Big sheets and per-cell styling are slow.** For very large outputs write the data first and style only the header, or use a write-only tool such as XlsxWriter.
- **\`.xls\` and password-protected files** need different tools: \`xlrd\` reads the old format; a protected file cannot be opened by openpyxl at all.` },
    { pychallenge: {
      id: 'pandas-excel-openpyxl-ch1',
      prompt: 'Write `tidy_sheet(rows)`. `rows` is a list of lists, the raw grid of an Excel sheet (blank cells are `None`). The header row is the row whose **first cell is `"Account"`**. The row **just above** it may hold group names in a merged layout (only the first cell of each merged group has text, the others are `None`): fill the names to the right, and name each column `"<group> <name>"` (just `"<name>"` when there is no group; the first column is just `"Account"`). Return a DataFrame with those column names and the rows **below** the header, without blank rows and without rows whose first cell starts with `"Subtotal"` or `"Total"` (any case). The numbers may be numbers or text such as `"1,000"`: convert every column except `Account` to numbers. The index must be `0, 1, 2 …`.',
      starter: `import pandas as pd

def tidy_sheet(rows):
    # TODO: grid = pd.DataFrame(rows); find the header row; build the names; keep the data rows; convert to numbers
    return pd.DataFrame(rows)
`,
      tests: `import pandas as pd
rows = [
    ["Kollana Tech - Branch sales MIS", None, None, None, None],
    ["April 2025 (amounts in INR)", None, None, None, None],
    [None, None, None, None, None],
    [None, "Q1", None, "Q2", None],
    ["Account", "Rev", "Cost", "Rev", "Cost"],
    ["4100 Product sales", 1000, 400, 1200, 500],
    ["4200 Services", "800", "300", "1,900", "350"],
    ["Subtotal sales", 1800, 700, 3100, 850],
    [None, None, None, None, None],
    ["TOTAL", 1800, 700, 3100, 850],
]
r = tidy_sheet(rows)
assert list(r.columns) == ["Account", "Q1 Rev", "Q1 Cost", "Q2 Rev", "Q2 Cost"], list(r.columns)
assert r["Account"].tolist() == ["4100 Product sales", "4200 Services"], r["Account"].tolist()
assert r["Q2 Rev"].tolist() == [1200, 1900], r["Q2 Rev"].tolist()
assert r["Q1 Rev"].tolist() == [1000, 800]
assert r.index.tolist() == [0, 1]
assert all(pd.api.types.is_numeric_dtype(r[c]) for c in r.columns[1:]), r.dtypes
rows2 = [
    ["Title"],
    [None, None, None],
    [None, None, None],
    ["Account", "Rev", "Cost"],
    ["4100", 5, 1],
    [None, None, None],
    ["4200", "7", "2"],
    ["total", 12, 3],
    [None, None, None],
]
r2 = tidy_sheet(rows2)
assert list(r2.columns) == ["Account", "Rev", "Cost"], list(r2.columns)
assert r2["Rev"].tolist() == [5, 7] and r2["Cost"].tolist() == [1, 2], r2
assert r2["Account"].tolist() == ["4100", "4200"]`,
      solution: `import pandas as pd

def tidy_sheet(rows):
    grid = pd.DataFrame(rows)
    h = int(grid.index[grid[0] == "Account"][0])
    if h > 0:
        group = grid.iloc[h - 1].ffill().fillna("")
    else:
        group = pd.Series([""] * grid.shape[1], index=grid.columns)
    names = (group.astype(str) + " " + grid.iloc[h].astype(str)).str.strip()
    data = grid.iloc[h + 1:].copy()
    data.columns = names.tolist()
    data = data.dropna(how="all")
    label = data["Account"].astype("string")
    data = data[~label.str.contains(r"^(?:sub)?total", case=False, na=False)].reset_index(drop=True)
    for col in data.columns[1:]:
        data[col] = pd.to_numeric(data[col].astype("string").str.replace(",", "", regex=False), errors="coerce")
    return data
`,
      hint: '`grid = pd.DataFrame(rows)`. The header row index is `grid.index[grid[0] == "Account"][0]`. The group row is the row above: `.ffill().fillna("")`. Names: `(group + " " + header_row).str.strip()`. Drop the blank rows with `dropna(how="all")`, drop the rows whose first cell matches `^(?:sub)?total` (case-insensitive), and convert the other columns with `pd.to_numeric` after removing commas.',
    } },
    { pychallenge: {
      id: 'pandas-excel-openpyxl-ch2',
      prompt: 'Write `excel_col(n)`. Return the Excel column letters for the column number `n` (counting from 1): `1` is `"A"`, `26` is `"Z"`, `27` is `"AA"`, `52` is `"AZ"`, `53` is `"BA"`, `702` is `"ZZ"`, `703` is `"AAA"`. The numbering is not a normal base 26 (there is no zero), so be careful at `26`, `52` and `702`.',
      starter: `def excel_col(n):
    # TODO: repeat: n, rem = divmod(n - 1, 26); put chr(65 + rem) in front
    return ""
`,
      tests: `cases = {1: "A", 2: "B", 25: "Y", 26: "Z", 27: "AA", 28: "AB", 52: "AZ", 53: "BA", 78: "BZ", 702: "ZZ", 703: "AAA", 16384: "XFD"}
for n, letters in cases.items():
    assert excel_col(n) == letters, (n, excel_col(n), letters)
assert excel_col(0) == ""`,
      solution: `def excel_col(n):
    name = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        name = chr(65 + rem) + name
    return name
`,
      hint: 'Subtract 1 before the division: `n, rem = divmod(n - 1, 26)`. The remainder 0 to 25 is the letter `chr(65 + rem)`. Put each new letter **in front** of the ones you have, and repeat while `n > 0`.',
    } },
    { pychallenge: {
      id: 'pandas-excel-openpyxl-ch3',
      prompt: 'Write `col_widths(df, min_width=8, max_width=40)`. Return a dict `{column name: width}`. The width of a column is the length of the **longest text** in it (the column name included, and every value converted with `str`) **plus 2**, but never below `min_width` and never above `max_width`.',
      starter: `def col_widths(df, min_width=8, max_width=40):
    # TODO: for each column: longest = max length of the header and of every str(value); clamp longest + 2
    return {}
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "month": ["2025-04", "2025-05"],
    "Revenue": [233914.19, 1.5],
    "account_name": ["Salaries", "A very long account name that goes on and on and on"],
    "n": [1, 2],
})
w = col_widths(df)
assert w["month"] == 9, w
assert w["Revenue"] == 11, w
assert w["account_name"] == 40, w
assert w["n"] == 8, w
assert list(w) == ["month", "Revenue", "account_name", "n"]
assert col_widths(df, min_width=12)["n"] == 12
assert col_widths(df, max_width=10)["account_name"] == 10
assert col_widths(pd.DataFrame({"a": []})) == {"a": 8}`,
      solution: `def col_widths(df, min_width=8, max_width=40):
    widths = {}
    for col in df.columns:
        longest = max([len(str(col))] + [len(str(v)) for v in df[col]])
        widths[col] = max(min_width, min(max_width, longest + 2))
    return widths
`,
      hint: '`longest = max([len(str(col))] + [len(str(v)) for v in df[col]])` includes the header. Then `max(min_width, min(max_width, longest + 2))` clamps the width.',
    } },
    { pychallenge: {
      id: 'pandas-excel-openpyxl-ch4',
      prompt: 'The helper `excel_col(n)` is already in the starter. Write `total_formulas(df, first_row)`. The DataFrame will be written to a sheet with its **data starting in sheet row `first_row`** (the header is in the row above). Return a dict `{column letter: "=SUM(<letter><first_row>:<letter><last_row>)"}` for every **numeric** column (booleans are not numeric here), where the letter is the column\'s position in the DataFrame counted from `A`. Text columns get no entry.',
      starter: `import pandas as pd

def excel_col(n):
    name = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        name = chr(65 + rem) + name
    return name

def total_formulas(df, first_row):
    # TODO: last_row = first_row + len(df) - 1; for each numeric, non-bool column build the SUM text
    return {}
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "month": ["2025-04", "2025-05", "2025-06"],
    "Revenue": [1.5, 2.5, 3.5],
    "ok": [True, False, True],
    "Cost": [1, 2, 3],
    "note": ["a", "b", "c"],
})
r = total_formulas(df, 4)
assert r == {"B": "=SUM(B4:B6)", "D": "=SUM(D4:D6)"}, r
assert total_formulas(df, 2) == {"B": "=SUM(B2:B4)", "D": "=SUM(D2:D4)"}
wide = pd.DataFrame({f"c{i}": [i, i] for i in range(1, 30)})
r2 = total_formulas(wide, 5)
assert r2["AA"] == "=SUM(AA5:AA6)" and r2["Z"] == "=SUM(Z5:Z6)" and len(r2) == 29, (len(r2), r2.get("AA"))
assert total_formulas(pd.DataFrame({"t": ["x"]}), 2) == {}`,
      solution: `import pandas as pd

def excel_col(n):
    name = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        name = chr(65 + rem) + name
    return name

def total_formulas(df, first_row):
    last_row = first_row + len(df) - 1
    out = {}
    for position, col in enumerate(df.columns, start=1):
        if pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_bool_dtype(df[col]):
            letter = excel_col(position)
            out[letter] = f"=SUM({letter}{first_row}:{letter}{last_row})"
    return out
`,
      hint: '`enumerate(df.columns, start=1)` gives the position, `excel_col(position)` the letter. Test `pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_bool_dtype(df[col])`. The last row is `first_row + len(df) - 1`.',
    } },
    { real: `A month-end MIS pack has two jobs, and good code keeps them in separate functions. **Make the numbers**: read the GL and the other inputs, clean them, compute the summary, detail and checks tables in pandas, and test them against totals you already trust. **Make the file**: one function that takes those DataFrames and returns a formatted workbook, with the same fonts, widths and number formats every month. When the layout changes (a new tab, a new column), you change the second function only; when a number is questioned, you open the first. On the input side, the habit that saves you is to read every branch file as a raw grid, find the header by its text, reconcile your sum to the total the sheet states, and refuse to continue (loudly, naming the tab) when they differ.` },
    { interview: `**"How do you read a messy Excel file reliably?"**
Model answer: "I read it with \`header=None\` so I get the raw grid, find the header row by its text instead of its position, fill merged header cells to the right, drop blank rows and subtotal rows by what they say, convert text numbers, and then reconcile my total with the total row of the sheet. If a sheet fails the check I stop and report which tab, instead of loading wrong numbers. For many tabs I use \`sheet_name=None\` and tidy each one with the same function."

**"How would you automate a monthly MIS pack in Excel?"**
"Compute the tables in pandas, write them with \`ExcelWriter\` and the openpyxl engine, then style with openpyxl: header fill and font, number formats, column widths, freeze panes, formulas for totals, a chart, and a Checks sheet with the reconciliations. I keep data preparation and file writing in separate functions, write to a new file name with the date, never overwrite the input, and compare the printed totals with what Excel shows when I open the file."

**"Why does \`read_excel\` show NaN where the sheet has formulas?"**
"\`read_excel\` returns the cached value, the result Excel last saved. A file that a script wrote with openpyxl has formulas but no cached values until Excel opens and saves it, so pandas sees NaN. I write plain values for anything code will read again, and use formulas for what people will read."` },
    `## Recap
- Read a messy sheet as a **raw grid** (\`header=None\`) and **find the header row by its text**. Blank rows are kept, merged cells hold their text in the top-left cell only, repeated headers become \`Rev\`, \`Rev.1\`, and formulas arrive as **cached values**. \`sheet_name=None\` reads every tab into a dict.
- Classify subtotal and total rows by what they say, convert numbers stored as text, and **reconcile your sum to the sheet's own Total**: stop loudly, naming the tab, when it differs.
- Write with \`pd.ExcelWriter(path, engine="openpyxl")\`: \`to_excel\` for the values (use \`startrow\` for a title), then openpyxl on \`writer.sheets[name]\` for fonts, fills, \`number_format\`, \`column_dimensions\`, \`freeze_panes\`, formulas and charts.
- **openpyxl does not calculate**: a formula has no cached value until Excel opens and saves the file, and pandas then reads NaN. Keep a shadow calculation in pandas.
- Write numbers, not formatted text. Close the file in Excel before writing (\`PermissionError\`), never overwrite the input, and keep **making the numbers** and **making the file** in separate functions.`,
  ],
  quiz: [
    { q: 'What does `pd.read_excel("MIS.xlsx", header=None)` return?', o: ['only the cells that contain numbers', 'every row and column of the sheet as a raw grid: blank cells are NaN and the columns are numbered 0, 1, 2…', 'the formulas of the sheet as text', 'a dict with one DataFrame per sheet'], a: 1, why: 'With `header=None` nothing is used as a header, so you get the whole grid, blank rows included. That makes it possible to find the header row by its text.' },
    { q: 'You write `ws["E4"] = "=B4-C4-D4"` with openpyxl and then read the file with `pd.read_excel`. What does pandas show in E4?', o: ['the calculated result, because pandas evaluates formulas', 'the text `=B4-C4-D4`', 'an error', 'NaN: the file has no calculated value until Excel opens and saves it'], a: 3, why: 'openpyxl stores the formula but does not calculate it. `read_excel` returns cached values, and there are none yet, so the cell is NaN.' },
    { q: 'How do you read every sheet of a workbook in one call?', o: ['`sheet_name="all"`', '`header=None`', '`sheet_name=None`, which returns a dict of DataFrames', '`usecols="A:Z"`'], a: 2, why: '`sheet_name=None` returns `{sheet name: DataFrame}`, the starting point for consolidating twelve monthly tabs.' },
    { q: 'Why is it safer to find the header row by its text than to write `header=4`?', o: ['pandas cannot read a header above row 3', 'Excel counts rows from 1, which pandas cannot convert', 'users insert or delete rows above the table, so its position changes from file to file', '`header=` only works for CSV files'], a: 2, why: 'A sheet that comes from people changes shape. Searching for the row that starts with "Account" keeps working when a row is added above it.' },
    { q: 'Your table has its header in row 1. Which openpyxl line keeps that header row visible when you scroll?', o: ['`ws.freeze_panes = "A1"`', '`ws.freeze_panes = "A2"`', '`ws.header = True`', '`ws.pin_row(1)`'], a: 1, why: '`freeze_panes` names the first cell that scrolls: `"A2"` freezes everything above row 2, that is row 1.' },
    { q: 'Why should you not write amounts to Excel as formatted text such as `"1,25,000.50"`?', o: ['the cell becomes text, so Excel cannot sum, filter or chart it as a number; write the number and set `number_format`', 'openpyxl refuses to write strings that contain commas', 'Excel converts every text cell to a date', 'formatted text is deleted when the workbook is saved'], a: 0, why: 'A string is not a number. Write the value as a number and use `cell.number_format` for how it looks, so sums, filters and charts keep working.' },
  ],
  task: {
    title: 'Read a messy sheet, then build and inspect an MIS pack',
    steps: [
      'In `C:\\fde\\pandas-lab` create `08_excel_in.py`. With `openpyxl` (as in the lesson) build a messy workbook `messy_apr.xlsx` with 3 tabs (Apr, May, Jun): a title row, a blank row, a merged `Q1` / `Q2` group header, an `Account` header row, 3 account lines, a `Subtotal`, a blank row and a `Total` that is a **typed value** (not a formula), different in each tab.',
      'Read it back with `pd.read_excel("messy_apr.xlsx", sheet_name=None, header=None)`. Write `tidy_sheet(grid)` that finds the header by its text, fills the merged group, drops subtotal, blank and total rows, and returns the numbers. Assert for every tab that your sum equals the typed Total.',
      'Stack the three tabs with a `tab` column and print the total per account. Now change one number in the workbook by hand in Excel, run again, and confirm that your assert names the tab that no longer adds up.',
      'Run the `local` scripts `08_pack.py` and `08_check.py` from this lesson and compare your output with the expected lines.',
      'Open `kollana_mis_in01.xlsx` in Excel and check: the **Operating profit** column and the **Total** row show numbers, the header is frozen, and the chart is on the right. Compare the Total row with the shadow values printed by the last playground of this lesson.',
      'Extend `08_pack.py`: add a `Checks` row for each unbalanced journal (1 in this data), set `ws.auto_filter.ref` on the Detail sheet, and write the file to a name with today\'s date (`kollana_mis_in01_2026-10-07.xlsx` style) instead of overwriting.',
    ],
    deliverable: '`08_excel_in.py`, `08_pack.py`, `08_check.py`, the generated `.xlsx` files and the printed output of the two checks.',
  },
};
