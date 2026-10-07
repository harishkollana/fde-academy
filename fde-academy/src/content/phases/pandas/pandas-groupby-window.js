export default {
  id: 'pandas-groupby-window',
  title: 'GroupBy and window logic: one row per group, or one per row',
  goal: 'You can total, count and average by group with named aggregation, keep every row with transform, take the top N per group, and do previous-row, running-total and moving-average logic with shift, cumsum, rolling and expanding.',
  roadmap: ['groupby and named aggregation', 'transform versus agg', 'rolling, expanding and shift', 'top N per group'],
  blocks: [
    `## The problem
In Excel you have two tools for this lesson. A PivotTable gives one row per channel with the total. And for "each order as a share of its channel" or "this month minus last month" you write a formula that looks at other rows: \`SUMIFS\`, or \`=B3-B2\` dragged down.

You met the same two ideas in SQL. \`GROUP BY\` makes **one row per group**. Window functions (\`SUM(...) OVER (PARTITION BY ...)\`, \`LAG\`, running totals) keep **one row per input row** and add a calculated column. pandas has both, and they are easy to mix up. This lesson teaches you to tell them apart and to pick the right one, because a wrong pick gives you a table of the wrong shape, or, worse, numbers that look right and are not.`,
    `## Split, apply, combine
\`groupby\` works in three steps. **Split** the rows into groups by a key (the channel). **Apply** a function to each group (sum, count, rank …). **Combine** the answers into one result. What the function returns decides the shape of the result:

| You call | The function returns | The result has |
|---|---|---|
| \`agg\` (or \`sum\`, \`mean\`, \`count\`, \`max\` …) | one value per group | **one row per group** |
| \`transform\` (or \`cumsum\`, \`shift\`, \`rank\` on a group) | one value per original row | **the same length as the input** |
| \`filter\` | True or False per group | the original rows of the groups that pass |

Keep this table in your head. Every \`groupby\` line you write is one of the three.`,
    { sketch: { w: 760, h: 330, caption: 'agg shrinks the table to one row per group; transform keeps every row and fills it with the value of ITS group', items: [
      { t: 'table', x: 14, y: 62, cols: ['order', 'channel', 'amount'], colW: [50, 76, 80], rows: [['1', 'Direct', '45000'], ['2', 'Direct', '87400'], ['3', 'Partner', '42275'], ['4', 'Online', '136800'], ['5', 'Online', '138000'], ['6', 'Partner', '48060']], rowH: 28, title: 'orders (6 sample rows)' },
      { t: 'table', x: 296, y: 62, cols: ['channel', 'total'], colW: [86, 90], rows: [['Direct', '132400'], ['Online', '274800'], ['Partner', '90335']], rowH: 28, fill: 'green', title: 'agg: one row per group' },
      { t: 'note', x: 280, y: 190, w: 208, h: 64, fill: 'yellow', size: 13, text: 'df.groupby("channel")\n["amount"].sum()\n3 groups = 3 rows' },
      { t: 'table', x: 510, y: 62, cols: ['order', 'amount', 'channel_total'], colW: [50, 70, 118], rows: [['1', '45000', '132400'], ['2', '87400', '132400'], ['3', '42275', '90335'], ['4', '136800', '274800'], ['5', '138000', '274800'], ['6', '48060', '90335']], rowH: 28, fill: 'orange', title: 'transform: one value per row' },
      { t: 'note', x: 510, y: 270, w: 238, h: 50, fill: 'yellow', size: 13, text: '.groupby("channel")["amount"]\n.transform("sum")  -> 6 rows' },
      { t: 'arrow', x1: 224, y1: 100, x2: 290, y2: 100 },
      { t: 'note', x: 14, y: 270, w: 470, h: 48, fill: 'blue', size: 14, text: 'Same split in both. Only the shape of the answer differs.\nShare of channel = amount / channel_total: you need transform.' },
    ] } },
    `## Named aggregation: your group totals
The clearest way to summarise is **named aggregation**. You write each result column as \`name=("column", "function")\`:

\`\`\`python
by_channel = orders.groupby("channel").agg(
    orders=("order_id", "count"),
    total=("amount", "sum"),
    average=("amount", "mean"),
)
\`\`\`

The keys (\`channel\`) become the **index** of the result. Call \`.reset_index()\` (or pass \`as_index=False\`) when you want them back as an ordinary column, for example before a merge or before writing to Excel. Several keys work the same way: \`groupby(["entity_id", "account_id"])\` gives a two-level index.

Built-in functions you will use all the time: \`sum\`, \`mean\`, \`median\`, \`min\`, \`max\`, \`std\`, \`nunique\` (how many different values), \`first\`, \`last\`, \`count\` and \`size\`. **\`size\` counts rows; \`count\` counts the values that are not missing.** A \`lambda\` also works as the function, but it runs as a Python loop per group, so prefer a built-in whenever one exists.

**Group by anything, not only by a column.** The key can be any Series as long as the table. The finance classic is a **band**: an ageing bucket, a value band, a salary slab. \`pd.cut\` puts every number into a labelled interval, and you group by the result:

\`\`\`python
band = pd.cut(orders["amount"], bins=[0, 50000, 100000, 200000, float("inf")],
              labels=["up to 50k", "50k-1L", "1L-2L", "above 2L"])
orders.groupby(band, observed=True).agg(orders=("order_id", "count"), total=("amount", "sum"))
\`\`\`

An interval includes its **right** edge by default, so exactly 50,000 lands in "up to 50k". \`observed=True\` skips bands that have no rows. Group by two keys and call \`.unstack()\` to move the second key into the columns: that is a PivotTable made from \`groupby\`. The next lesson shows the shortcut, \`pivot_table\`.`,
    { py: {
      title: 'Totals per channel: agg, named aggregation, two keys, bands',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")

# split by channel, apply sum, combine: one row per channel
print(orders.groupby("channel")["amount"].sum())

# named aggregation: result name = (column, function)
by_channel = orders.groupby("channel").agg(
    orders=("order_id", "count"),
    total=("amount", "sum"),
    average=("amount", "mean"),
    biggest=("amount", "max"),
)
print(by_channel.round(2))
print("grand total:", by_channel["total"].sum())

# two keys: reset_index turns the keys back into ordinary columns
by_two = orders.groupby(["channel", "status"]).agg(orders=("order_id", "count"), total=("amount", "sum")).reset_index()
print(by_two.head(6))

# size counts rows, count counts non-missing values
print(orders.groupby("channel").agg(rows=("status", "size"), with_status=("status", "count")))

# group by a computed key: bands, like an ageing bucket
band = pd.cut(orders["amount"], bins=[0, 50000, 100000, 200000, float("inf")],
              labels=["up to 50k", "50k-1L", "1L-2L", "above 2L"])
print(orders.groupby(band, observed=True).agg(orders=("order_id", "count"), total=("amount", "sum")))
print(orders.groupby(["channel", band], observed=True)["amount"].sum().unstack())   # second key becomes the columns`,
      note: 'The three channel totals add up to 20,980,275, the same total you got in SQL. `Direct` has 67 rows but 63 with a status: its other 4 orders have no status. The four bands hold 83, 64, 48 and 25 orders and add up to the same 20,980,275.',
    } },
    { py: {
      title: 'Balance check of every journal, and totals per entity',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
gl = pd.read_csv("fact_gl.csv")

# a journal is balanced when its debits equal its credits
by_journal = gl.groupby("journal_id").agg(lines=("gl_id", "count"), debit=("debit", "sum"), credit=("credit", "sum"))
by_journal["difference"] = (by_journal["debit"] - by_journal["credit"]).round(2)   # round: floats add with tiny errors
print(len(by_journal), "journals")
print(by_journal[by_journal["difference"] != 0])

# totals per entity: each entity has its own currency, so never add across entities
by_entity = gl.groupby("entity_id").agg(lines=("gl_id", "count"), debit=("debit", "sum")).round(2)
print(by_entity)

# several keys: entity x account, then look at one entity
by_ent_acc = gl.groupby(["entity_id", "account_id"]).agg(lines=("gl_id", "count"), debit=("debit", "sum"), credit=("credit", "sum")).round(2)
print(by_ent_acc.loc[1])          # loc on the first index level: all accounts of entity 1`,
      note: 'Four journals are out of balance: three whose lines were duplicated (an extra copy of a line) and JV202504-0051, whose debit is 500 too high. It is the same finding as the SQL data-quality lesson, in six lines.',
    } },
    `## transform: a group value on every row
\`transform\` computes something per group and **broadcasts it back to every row of that group**. The result has the same length and the same index as the input, so you can assign it straight to a new column. It is the pandas version of \`SUM(amount) OVER (PARTITION BY channel)\`.

\`\`\`python
orders["channel_total"] = orders.groupby("channel")["amount"].transform("sum")
orders["share"] = orders["amount"] / orders["channel_total"]
\`\`\`

**Top N per group** is the interview classic. Sort first, then keep the head of each group, and give the sort a tie-breaker so the answer is the same every time:

\`\`\`python
ranked = orders.sort_values(["amount", "order_id"], ascending=[False, True])
top2 = ranked.groupby("channel").head(2)
\`\`\`

\`cumcount()\` numbers the rows inside each group from 0 (the pandas \`ROW_NUMBER\`), and \`rank(method="min")\` gives ties the same rank (the pandas \`RANK\`). \`filter\` keeps or drops **whole groups**: \`groupby("customer_id").filter(lambda g: len(g) >= 25)\` keeps only the customers with 25 or more orders.`,
    { py: {
      title: 'transform, rank, top N per group and filter',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")

# transform: one value per ORIGINAL row, so it can become a column
orders["channel_total"] = orders.groupby("channel")["amount"].transform("sum")
orders["share"] = orders["amount"] / orders["channel_total"]
print(orders[["order_id", "channel", "amount", "channel_total", "share"]].head(4).round(4))
print(orders.groupby("channel")["share"].sum().round(6))      # each channel adds up to 1

# top 2 per channel: sort first (with a tie-breaker), then take the head of each group
ranked = orders.sort_values(["amount", "order_id"], ascending=[False, True])
top2 = ranked.groupby("channel").head(2)
print(top2.sort_values(["channel", "amount", "order_id"], ascending=[True, False, True])[["channel", "order_id", "amount"]])

# a rank column: cumcount numbers the rows inside each group, from 0
ranked["rank_in_channel"] = ranked.groupby("channel").cumcount() + 1
print(ranked[ranked["rank_in_channel"] <= 2][["channel", "order_id", "rank_in_channel"]].sort_values(["channel", "rank_in_channel"]))

# filter: keep whole groups that pass a test on the group
busy = orders.groupby("customer_id").filter(lambda g: len(g) >= 25)
print("customers with 25 or more orders:", sorted(busy["customer_id"].unique().tolist()))`,
      note: 'Many orders share the top amount, 368,000, so the tie-breaker `order_id` decides who is first. Remove it from the sort and the top 2 may change from one machine to another.',
    } },
    { sketch: { w: 760, h: 330, caption: 'Window logic on a monthly series: shift looks one row up, rolling looks a few rows back, cumsum adds everything so far', items: [
      { t: 'table', x: 14, y: 60, cols: ['month', 'revenue', 'shift(1)', 'diff()', 'rolling(3)', 'cumsum()'], colW: [76, 90, 90, 98, 100, 92], rows: [['2025-04', '2019310', 'NaN', 'NaN', 'NaN', '2019310'], ['2025-05', '828790', '2019310', '-1190520', 'NaN', '2848100'], ['2025-06', '674975', '828790', '-153815', '1174358', '3523075'], ['2025-07', '1554525', '674975', '879550', '1019430', '5077600'], ['2025-08', '2697565', '1554525', '1143040', '1642355', '7775165'], ['2025-09', '1659025', '2697565', '-1038540', '1970372', '9434190']], rowH: 28, hl: [1, 2, 3] },
      { t: 'note', x: 580, y: 60, w: 170, h: 84, fill: 'blue', size: 13, text: 'shift(1): the value\nof the row above.\ndiff(): this row\nminus the row above.' },
      { t: 'note', x: 580, y: 156, w: 170, h: 100, fill: 'green', size: 13, text: 'rolling(3).mean():\nthis row and the 2\nbefore it. The first\ntwo rows have no full\nwindow, so NaN.' },
      { t: 'note', x: 14, y: 268, w: 560, h: 52, fill: 'yellow', size: 14, text: 'The yellow rows are the 3-month window that ends at 2025-07:\n(828790 + 674975 + 1554525) / 3 = 1019430' },
      { t: 'note', x: 580, y: 268, w: 170, h: 52, fill: 'grey', size: 13, text: 'Sort by date first:\nthese tools use row order.' },
    ] } },
    `## Window logic: shift, diff, rolling, expanding
These tools look at **neighbouring rows**, so **row order matters**. Sort by time (and by the group key) before you use them.

- \`shift(1)\` is the value of the previous row (SQL \`LAG\`); \`shift(-1)\` is the next row (\`LEAD\`). \`diff()\` is "this row minus the previous row". \`pct_change()\` is that difference divided by the previous value.
- \`cumsum()\` is a running total. \`expanding().mean()\` is the average of everything so far. A running total that restarts per group is \`groupby("entity_id")["amount"].cumsum()\`.
- \`rolling(3).mean()\` is a moving average over the current row and the two before it. The first rows have no full window and give NaN; \`min_periods=1\` lets a smaller window count.
- Inside a group, put the group first: \`pay.groupby("emp_id")["gross_pay"].pct_change()\` restarts the comparison for each employee, so employee 2's first month is never compared with employee 1's last month.
- **A rolling window per group:** \`df.groupby("channel")["amount"].rolling(3).mean()\` adds the group key as an extra index level, so it does not line up with \`df\`. \`df.groupby("channel")["amount"].transform(lambda s: s.rolling(3).mean())\` keeps the original index, so you can assign it straight back to a column.
- **Gaps:** \`pct_change()\` forward-fills a missing value before it divides, and in current pandas it warns about that default. Pass \`fill_method=None\` to keep the gap as NaN.`,
    { py: {
      title: 'Month over month, running total, moving average, and per-employee change',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
orders = pd.read_csv("orders.csv")
orders["month"] = orders["order_date"].str[:7]      # "2025-04": the first 7 characters (the dates lesson has a better way)
monthly = orders.groupby("month")["amount"].sum().to_frame("revenue")

monthly["previous"] = monthly["revenue"].shift(1)                    # the row above (LAG)
monthly["change"] = monthly["revenue"].diff()                        # this minus the row above
monthly["change_pct"] = (monthly["revenue"].pct_change() * 100).round(1)
monthly["avg_3m"] = monthly["revenue"].rolling(3).mean().round(0)    # this row and the 2 before it
monthly["ytd"] = monthly["revenue"].cumsum()                         # running total from April
print(monthly.head(6))
print("last YTD equals the grand total:", int(monthly["ytd"].iloc[-1]), int(orders["amount"].sum()))

# the same logic per employee: payroll month over month
pay = pd.read_csv("payroll.csv").sort_values(["emp_id", "run_month"])      # sort BEFORE shift or pct_change
pay["change_pct"] = (pay.groupby("emp_id")["gross_pay"].pct_change() * 100).round(1)
print(pay[pay["change_pct"] > 0][["emp_id", "run_month", "gross_pay", "change_pct"]])`,
      note: 'Only one employee changed: employee 6 went from 108,333.33 to 259,999.99, a rise of 140 percent (the planted salary outlier). Remove the `sort_values` and see what happens to `change_pct` if the rows arrive in another order.',
    } },
    { warn: `Five traps that give wrong numbers without any error:
- **\`groupby\` drops rows whose key is missing.** The 9 orders with no status belong to no group, so the group totals no longer add up to the grand total. Pass \`dropna=False\` to keep a NaN group, and always check the pieces against the total.
- **An average of averages is not the overall average.** The groups have different sizes, so average the rows, not the group averages.
- **A \`size\` is not a \`count\`.** \`count\` skips missing values, \`size\` does not; mixing them up changes a "number of invoices" by the number of blanks.
- **Assigning an \`agg\` result back to a column.** \`orders["x"] = orders.groupby("channel")["amount"].sum()\` has 3 values indexed by the channel names, so pandas aligns on the index and fills every row with NaN, without an error. Use \`transform\`.
- **\`shift\`, \`diff\` and \`pct_change\` use row order.** Sort by group and time first, or the "previous row" is some other row.` },
    { sketch: { w: 760, h: 270, caption: 'groupby leaves out rows whose key is missing: the pieces then add up to less than the real total', items: [
      { t: 'table', x: 14, y: 52, cols: ['status', 'total'], colW: [110, 130], rows: [['Delivered', '12667395'], ['Shipped', '4109545'], ['Returned', '3627925'], ['NaN', '575410']], rowH: 30, dim: [3], title: 'groupby("status")' },
      { t: 'mark', x: 276, y: 156, ok: false },
      { t: 'box', x: 330, y: 44, w: 190, h: 66, fill: 'yellow', label: 'sum of the groups', sub: '20404865', size: 17 },
      { t: 'box', x: 556, y: 44, w: 190, h: 66, fill: 'green', label: 'real total', sub: '20980275', size: 17 },
      { t: 'text', x: 538, y: 80, text: '≠', size: 28, bold: true },
      { t: 'note', x: 330, y: 128, w: 416, h: 64, fill: 'pink', size: 14, text: 'The 9 orders with status NaN fall in no group,\nso 575410 disappears from the result.\nFix: groupby("status", dropna=False)' },
      { t: 'note', x: 14, y: 214, w: 732, h: 40, fill: 'blue', size: 14, text: 'Habit: after every groupby, compare the sum of the pieces with the total of the source.' },
    ] } },
    { py: {
      title: 'Run the traps once',
      starter: `import pandas as pd
orders = pd.read_csv("orders.csv")

# Trap 1: groupby drops rows whose KEY is missing, so the totals stop adding up
by_status = orders.groupby("status")["amount"].sum()
print("sum of the groups  :", int(by_status.sum()))
print("real total         :", int(orders["amount"].sum()))
print("with dropna=False  :", int(orders.groupby("status", dropna=False)["amount"].sum().sum()))
print(orders.groupby("status", dropna=False)["amount"].sum())

# Trap 2: an average of averages is not the overall average
print("average of channel averages:", round(orders.groupby("channel")["amount"].mean().mean(), 2))
print("real average of all orders :", round(orders["amount"].mean(), 2))

# Trap 3: an agg result assigned to a column is matched on the INDEX, not on position
orders["bad"] = orders.groupby("channel")["amount"].sum()
print("rows that got a value:", int(orders["bad"].notna().sum()), "of", len(orders))
orders["good"] = orders.groupby("channel")["amount"].transform("sum")
print("with transform       :", int(orders["good"].notna().sum()), "of", len(orders))`,
      note: 'Trap 3 gives no error: that is what makes it dangerous. The result of `agg` is indexed by channel names, the orders are indexed 0 to 219, so nothing matches.',
    } },
    `## The same thinking in SQL and pandas
| SQL | pandas |
|---|---|
| \`GROUP BY channel\` with \`SUM(amount)\` | \`df.groupby("channel")["amount"].sum()\` |
| \`COUNT(*)\` versus \`COUNT(status)\` | \`size()\` versus \`count()\` |
| \`SUM(amount) OVER (PARTITION BY channel)\` | \`df.groupby("channel")["amount"].transform("sum")\` |
| \`ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)\` | \`sort_values(...)\` then \`groupby(...).cumcount() + 1\` |
| \`RANK()\` and \`DENSE_RANK()\` | \`groupby(...)["amount"].rank(method="min")\` and \`method="dense"\` |
| \`LAG(amount) OVER (ORDER BY month)\` | \`shift(1)\` |
| running total \`SUM(...) OVER (ORDER BY month)\` | \`cumsum()\` |
| \`AVG(...) OVER (... ROWS 2 PRECEDING)\` | \`rolling(3).mean()\` |
| \`HAVING SUM(amount) > 1000\` | filter the aggregated result: \`g[g["total"] > 1000]\` |
| \`COUNT(*) FILTER (WHERE status = 'Returned')\` | filter with a mask **before** the groupby, or sum a True/False column |`,
    { pychallenge: {
      id: 'pandas-groupby-window-ch1',
      prompt: 'Write `channel_summary(df)`. `df` has the columns `order_id`, `channel` and `amount`. Return a DataFrame with exactly these columns in this order: `channel`, `orders` (number of rows), `total` (sum of `amount`), `average` (mean of `amount`). Sort it by `total` from biggest to smallest (ties: `channel` A to Z) and give it a fresh index `0, 1, 2 …`. Use named aggregation.',
      starter: `def channel_summary(df):
    # TODO: groupby + agg with named aggregation, reset_index, sort
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6],
    "channel": ["Direct", "Direct", "Partner", "Online", "Online", "Partner"],
    "amount": [45000, 87400, 42275, 136800, 138000, 48060],
})
r = channel_summary(df)
assert list(r.columns) == ["channel", "orders", "total", "average"], list(r.columns)
assert r["channel"].tolist() == ["Online", "Direct", "Partner"], r["channel"].tolist()
assert r["orders"].tolist() == [2, 2, 2]
assert r["total"].tolist() == [274800, 132400, 90335], r["total"].tolist()
assert r["average"].tolist() == [137400.0, 66200.0, 45167.5], r["average"].tolist()
assert r.index.tolist() == [0, 1, 2]
tie = pd.DataFrame({"order_id": [1, 2], "channel": ["Partner", "Direct"], "amount": [100, 100]})
assert channel_summary(tie)["channel"].tolist() == ["Direct", "Partner"]`,
      solution: `def channel_summary(df):
    out = df.groupby("channel").agg(
        orders=("order_id", "count"),
        total=("amount", "sum"),
        average=("amount", "mean"),
    ).reset_index()
    return out.sort_values(["total", "channel"], ascending=[False, True]).reset_index(drop=True)
`,
      hint: '`df.groupby("channel").agg(orders=("order_id", "count"), total=("amount", "sum"), average=("amount", "mean"))` gives the numbers with `channel` as the index. Then `.reset_index()`, then `sort_values(["total", "channel"], ascending=[False, True])`, then `reset_index(drop=True)`.',
    } },
    { pychallenge: {
      id: 'pandas-groupby-window-ch2',
      prompt: 'Write `add_share(df)`. Return a **new** DataFrame equal to `df` plus a column `share`: each row\'s `amount` divided by the total `amount` of **its own channel**, rounded to 4 decimals. Use `transform`. The input must not change.',
      starter: `def add_share(df):
    # TODO: copy, then transform("sum") per channel and divide
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6, 7],
    "channel": ["Direct", "Direct", "Partner", "Online", "Online", "Partner", "Solo"],
    "amount": [45000, 87400, 42275, 136800, 138000, 48060, 500],
})
r = add_share(df)
assert r["share"].tolist() == [0.3399, 0.6601, 0.468, 0.4978, 0.5022, 0.532, 1.0], r["share"].tolist()
assert list(r.columns) == ["order_id", "channel", "amount", "share"], list(r.columns)
assert list(df.columns) == ["order_id", "channel", "amount"], "the input DataFrame was changed"
assert r["order_id"].tolist() == [1, 2, 3, 4, 5, 6, 7]
assert len(r) == len(df)`,
      solution: `def add_share(df):
    out = df.copy()
    channel_total = out.groupby("channel")["amount"].transform("sum")
    out["share"] = (out["amount"] / channel_total).round(4)
    return out
`,
      hint: '`out.groupby("channel")["amount"].transform("sum")` returns a Series as long as `out`, with each row\'s channel total. Divide `out["amount"]` by it and `.round(4)`.',
    } },
    { pychallenge: {
      id: 'pandas-groupby-window-ch3',
      prompt: 'Write `top_n_per_channel(df, n)`. Return the `n` biggest orders **per channel** with the columns `channel`, `order_id`, `amount`. Inside a channel the biggest `amount` comes first; equal amounts: smaller `order_id` first. Sort the whole result by `channel` (A to Z), then by that order, and give it a fresh index `0, 1, 2 …`. A channel with fewer than `n` orders returns all of its orders.',
      starter: `def top_n_per_channel(df, n):
    # TODO: sort with a tie-breaker, groupby("channel").head(n), then sort the result
    return df
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6, 7, 8],
    "channel": ["Online", "Online", "Online", "Direct", "Direct", "Partner", "Online", "Direct"],
    "amount": [500, 900, 900, 100, 700, 50, 900, 700],
    "status": ["Delivered"] * 8,
})
r = top_n_per_channel(df, 2)
assert list(r.columns) == ["channel", "order_id", "amount"], list(r.columns)
assert r["channel"].tolist() == ["Direct", "Direct", "Online", "Online", "Partner"], r["channel"].tolist()
assert r["order_id"].tolist() == [5, 8, 2, 3, 6], r["order_id"].tolist()
assert r["amount"].tolist() == [700, 700, 900, 900, 50]
assert r.index.tolist() == [0, 1, 2, 3, 4]
assert len(top_n_per_channel(df, 1)) == 3
assert len(top_n_per_channel(df, 10)) == 8`,
      solution: `def top_n_per_channel(df, n):
    ranked = df.sort_values(["amount", "order_id"], ascending=[False, True])
    top = ranked.groupby("channel").head(n)
    top = top.sort_values(["channel", "amount", "order_id"], ascending=[True, False, True])
    return top[["channel", "order_id", "amount"]].reset_index(drop=True)
`,
      hint: 'Sort the whole frame by `["amount", "order_id"]` with `ascending=[False, True]`, then `.groupby("channel").head(n)` keeps the first `n` rows of each channel. Finally sort by `["channel", "amount", "order_id"]` with `ascending=[True, False, True]`, pick the 3 columns and `reset_index(drop=True)`.',
    } },
    { pychallenge: {
      id: 'pandas-groupby-window-ch4',
      prompt: 'Write `salary_jumps(pay, threshold)`. `pay` has the columns `emp_id`, `run_month` (text like `"2026-08-01"`) and `gross_pay`, and its rows are in **no particular order**. For each employee compare every month with that employee\'s **previous** month. Return a sorted list of the `emp_id`s (plain Python ints) that had at least one rise of **more than** `threshold` (`0.5` means 50 percent). An employee with one month only has nothing to compare.',
      starter: `def salary_jumps(pay, threshold):
    # TODO: sort by emp_id and run_month, then groupby("emp_id")["gross_pay"].pct_change()
    return []
`,
      tests: `import pandas as pd
pay = pd.DataFrame({
    "emp_id":    [2, 1, 3, 2, 1, 1, 2, 4, 3],
    "run_month": ["2026-09-01", "2026-10-01", "2026-10-01", "2026-08-01", "2026-09-01", "2026-08-01", "2026-10-01", "2026-08-01", "2026-09-01"],
    "gross_pay": [250, 100, 101, 100, 110, 100, 260, 999, 100],
})
assert salary_jumps(pay, 0.5) == [2], salary_jumps(pay, 0.5)
assert salary_jumps(pay, 0.05) == [1, 2], salary_jumps(pay, 0.05)
assert salary_jumps(pay, 5) == []
r = salary_jumps(pay, 0.0)
assert r == [1, 2, 3], r
assert all(type(x) is int for x in r)
assert pay["emp_id"].tolist() == [2, 1, 3, 2, 1, 1, 2, 4, 3], "the input was reordered"`,
      solution: `def salary_jumps(pay, threshold):
    p = pay.sort_values(["emp_id", "run_month"])
    change = p.groupby("emp_id")["gross_pay"].pct_change()
    return sorted(int(e) for e in p.loc[change > threshold, "emp_id"].unique())
`,
      hint: '`sort_values` returns a new frame, so the input stays as it was. After sorting, `p.groupby("emp_id")["gross_pay"].pct_change()` gives each month\'s change versus the previous month of the same employee (NaN for the first month). Keep the rows where it is greater than `threshold` and take the unique `emp_id`s.',
    } },
    { real: `Month-end work is full of group logic. "Total spend per cost centre" is a \`groupby\` with named aggregation. "Each vendor's share of total payables" is a \`transform\`. "Which employees' pay moved by more than 20 percent since last month" is \`groupby("emp_id")["gross_pay"].pct_change()\` on a sorted frame: that single line replaces a VLOOKUP of last month's sheet. "Top 5 overdue invoices per customer" is sort + \`groupby().head(5)\`. And the habit that saves you in review: after every groupby, compare the sum of the pieces with the total of the source. If a key was missing, rows fell out silently.` },
    { interview: `**"\`groupby\` with \`transform\` versus \`agg\`?"**
Model answer: "\`agg\` reduces each group to one value, so the result has one row per group. \`transform\` returns a result with the same length as the input: the group's value repeated on every row of the group. I use \`agg\` for summary tables and \`transform\` when I need the group value next to each row, for example a share of the group total or a value minus the group average. It is the pandas version of a SQL window function with \`PARTITION BY\`."

**"How do you get the top N rows per group?"**
"Sort by the value I care about, with a tie-breaker column, and then call \`groupby(key).head(n)\`. If I also need the rank, \`groupby(key).cumcount() + 1\` after the sort, or \`rank(method=...)\` when ties should share a rank."

**"What is the difference between \`size()\` and \`count()\` in a groupby?"**
"\`size\` counts the rows in each group, including rows with missing values. \`count\` counts the non-missing values of a given column. They differ by the number of NaNs."` },
    `## Recap
- \`groupby\` is **split, apply, combine**. \`agg\` gives **one row per group**, \`transform\` gives **one value per original row**, \`filter\` keeps or drops whole groups.
- Use **named aggregation**: \`.agg(total=("amount", "sum"), orders=("order_id", "count"))\`. The keys become the index: \`reset_index()\` brings them back. \`size\` counts rows, \`count\` counts non-missing values.
- Top N per group = sort with a tie-breaker, then \`groupby(key).head(n)\`. \`cumcount()\` is \`ROW_NUMBER\`, \`rank(method=...)\` is \`RANK\`.
- Window logic: \`shift\` (LAG), \`diff\`, \`pct_change\`, \`cumsum\` (running total), \`rolling(n).mean()\` (moving average), \`expanding()\`. They use **row order**, so sort first and put \`groupby\` before them when each group needs its own window.
- Traps: missing keys drop out of \`groupby\` (use \`dropna=False\` and check against the total), an average of averages, assigning an \`agg\` result back to a column (use \`transform\`), and \`pct_change\` forward-filling gaps.`,
  ],
  quiz: [
    { q: 'What does `orders.groupby("channel")["amount"].transform("sum")` return?', o: ['three numbers, one per channel', 'a Series as long as `orders`, each row holding the total of its own channel', 'one number, the grand total', 'a DataFrame with a column per channel'], a: 1, why: '`transform` broadcasts the group result back to every row of the group, so the length equals the input. `agg`/`sum` is the one that gives one value per group.' },
    { q: '`orders.groupby("status")["amount"].sum().sum()` gives 20,404,865, but the real total is 20,980,275. Why?', o: ['`sum()` rounds large numbers', 'the second `sum()` double counts Delivered', 'the 9 orders with a missing status belong to no group and are dropped; `dropna=False` keeps them', 'groupby sorts the amounts and loses the biggest'], a: 2, why: 'By default `groupby` leaves out rows whose key is NaN. The difference, 575,410, is exactly the amount of the 9 orders without a status.' },
    { q: 'What is the difference between `size()` and `count()` in a groupby?', o: ['`size` counts all rows of the group; `count` counts the non-missing values of a column', 'there is none, they are aliases', '`count` counts rows; `size` counts distinct values', '`size` only works on numbers'], a: 0, why: '`size` includes rows with NaN. `count` skips them. For `Direct` orders: 67 rows, but 63 with a status.' },
    { q: 'You run `pay.groupby("emp_id")["gross_pay"].pct_change()` on rows in random order. What goes wrong?', o: ['pandas raises an error', 'it sorts by itself, so nothing goes wrong', 'the first month of each employee becomes zero', 'the "previous row" is just the row above in the table, so it may be another month or another employee'], a: 3, why: '`shift`, `diff` and `pct_change` use row order, not dates. Sort by `["emp_id", "run_month"]` before them.' },
    { q: 'Which line gives a 3-month moving average of a monthly `revenue` Series?', o: ['`revenue.cumsum() / 3`', '`revenue.rolling(3).mean()`', '`revenue.shift(3).mean()`', '`revenue.expanding(3).sum()`'], a: 1, why: '`rolling(3)` makes a window of the current row and the two before it, and `.mean()` averages it. `cumsum` is a running total, `expanding` grows without limit, `shift(3)` only moves values down.' },
    { q: 'Which code returns the 2 biggest orders per channel, with ties decided by the smaller `order_id`?', o: ['`df.nlargest(2, "amount")`', '`df.groupby("channel").head(2)`', '`df.sort_values(["amount", "order_id"], ascending=[False, True]).groupby("channel").head(2)`', '`df.groupby("channel")["amount"].max(2)`'], a: 2, why: 'Sort first, with the tie-breaker, then keep the first two rows of each group. `nlargest` gives the top 2 overall, `head(2)` on an unsorted frame gives the first two rows, and `max` takes no count.' },
  ],
  task: {
    title: 'Group reports for the Kollana data',
    steps: [
      'In `C:\\fde\\pandas-lab` create `02_groupby_window.py`. Read `orders.csv`, `fact_gl.csv` and `payroll.csv` (the CSVs from the first pandas task).',
      'Build `by_channel` with named aggregation: orders, total, average, biggest. Check that the three totals add up to 20,980,275 and print the check.',
      'Add the columns `channel_total` and `share` with `transform`. Print the three channels\' shares: each must add up to 1 (use `round(6)`).',
      'Print the top 3 orders per channel with the tie-breaker `order_id`, as in the lesson.',
      'Build the monthly revenue Series, add `previous`, `change_pct` and `ytd`. The last `ytd` must equal 20,980,275.',
      'From `fact_gl.csv` list the journals whose debits and credits differ after rounding to 2 decimals. You should find 4.',
      'From `payroll.csv` print the employees whose gross pay rose by more than 50 percent. You should find employee 6.',
    ],
    deliverable: '`02_groupby_window.py` and its output, with the three checks (channel totals, last YTD, 4 unbalanced journals) printed as `OK`/`MISMATCH` lines.',
  },
};
