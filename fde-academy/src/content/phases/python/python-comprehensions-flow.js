export default {
  id: 'python-comprehensions-flow',
  title: 'Comprehensions and control flow',
  goal: 'You can make decisions with if / elif / else and match, repeat work with for and while, walk two lists together with zip and enumerate, unpack values, and build lists, dicts and sets in one readable line with comprehensions.',
  roadmap: ['list, dict and set comprehensions', 'nested comprehensions', 'enumerate, zip, unpacking', 'if / elif / else, for, while, break, continue', 'match (structural pattern matching)'],
  blocks: [
    `## The problem
In Excel you decide with \`IF\`, you repeat by dragging a formula down a column, and you build a new column from an old one with a helper column. In Python the same three jobs have three tools:

- **Decisions**: \`if\`, \`elif\`, \`else\`, and \`match\` when the *shape* of the data decides.
- **Repetition**: \`for\` (once per item) and \`while\` (until a condition stops being true).
- **Building a new collection from an old one**: a *comprehension*, which is "drag the formula down" written in one line.

Almost every automation you write is these three tools in some order: read rows, decide what to do with each row, collect the results. This lesson makes you fast and safe with all of them, and shows the traps that cost people an afternoon.`,
    `## Decisions: if, elif, else
An \`if\` runs its block only when the condition is true. \`elif\` ("else if") adds more conditions, and \`else\` catches the rest. Python checks them **from the top, and the first true branch wins**. The rest are skipped, even if they would also be true.
\`\`\`python
amount = 250000
if amount > 1000000:
    route = "CFO approval"
elif amount > 100000:        # only checked when the first test was False
    route = "finance head approval"
else:
    route = "auto-post"
\`\`\`
Because the first match wins, **order matters**: put the strictest test first. If you wrote \`amount > 100000\` first, a ten-lakh amount would stop there and never reach the CFO branch.

Useful building blocks:
- Combine tests with \`and\`, \`or\`, \`not\`. A *chained comparison* reads like maths: \`0 < amount <= 100000\`.
- \`x in ("NEFT", "RTGS", "IMPS")\` checks several values in one test.
- A *conditional expression* is an \`if\` that produces a value: \`status = "late" if days > 30 else "ok"\`. Use it when the whole job is choosing one of two values.
- Remember truthiness from the first lesson: \`if not pan:\` is true for \`None\` and for \`""\`. In a CSV an empty cell is read as \`""\`, not \`None\`.

## Loops: for and while
A \`for\` loop takes items from any iterable (list, dict, string, file, \`range\`) one at a time. A \`while\` loop repeats while a condition stays true, which is right when you do not know the number of rounds in advance (retry until success, read until the file ends).
\`\`\`python
for line in lines:                 # once per item
    ...
for i in range(3):                 # 0, 1, 2  (the end is excluded, like slices)
    ...
while attempts < 3 and not done:   # until the condition is False
    attempts += 1
\`\`\`
Three keywords change the flow inside a loop:
- \`break\` leaves the loop now.
- \`continue\` skips to the next item.
- \`else\` on a loop runs only if the loop **finished without hitting \`break\`**. It is the clean way to say "I searched everything and found nothing".

**The helpers you will use every day**

| Tool | What it gives you | Example |
|---|---|---|
| \`enumerate(items, start=1)\` | a counter and the item together | \`for n, line in enumerate(lines, start=2):\` |
| \`zip(a, b)\` | items of two lists side by side | \`for code, name in zip(codes, names):\` |
| \`sorted(x)\`, \`reversed(x)\` | a new ordering, original untouched | \`for row in sorted(rows):\` |
| \`dict.items()\` | key and value together | \`for code, name in master.items():\` |

Do not write \`for i in range(len(lines)): line = lines[i]\`. It works, but \`for line in lines:\` is shorter, and \`enumerate\` gives you the position when you really need it.`,
    { sketch: { w: 760, h: 290, caption: 'A comprehension is a loop, a test and an output expression written together: rows that fail the test never reach the new list', items: [
      { t: 'text', x: 380, y: 26, text: 'ids = [ line["gl_id"]  for line in lines  if float(line["debit"]) > 1000 ]', font: 'mono', size: 13, anchor: 'middle', bold: true },
      { t: 'text', x: 105, y: 62, text: 'lines  (the source)', size: 15, bold: true },
      { t: 'table', x: 30, y: 84, cols: ['gl_id', 'debit'], colW: [70, 100], rows: [['1', '500'], ['2', '2500'], ['3', '800'], ['4', '4100']], rowH: 30, hl: [1, 3] },
      { t: 'mark', x: 230, y: 129, ok: false },
      { t: 'mark', x: 230, y: 159, ok: true },
      { t: 'mark', x: 230, y: 189, ok: false },
      { t: 'mark', x: 230, y: 219, ok: true },
      { t: 'text', x: 262, y: 62, text: 'if debit > 1000 ?', size: 15, bold: true },
      { t: 'arrow', x1: 252, y1: 159, x2: 410, y2: 159, label: 'keep: take line["gl_id"]', ly: -14 },
      { t: 'arrow', x1: 252, y1: 219, x2: 410, y2: 190, bend: 14 },
      { t: 'text', x: 470, y: 120, text: 'ids  (the new list)', size: 15, bold: true },
      { t: 'table', x: 420, y: 138, cols: ['0', '1'], colW: [60, 60], rows: [['2', '4']], rowH: 30, fill: 'green' },
      { t: 'note', x: 580, y: 72, w: 170, h: 100, fill: 'yellow', size: 14, text: 'Rows 1 and 3 fail the\ntest and never reach\nthe output.\nThe source list is\nnot changed.' },
      { t: 'note', x: 30, y: 245, w: 720, h: 36, fill: 'blue', size: 14, text: 'Three parts, always in this order:  OUTPUT  for  ITEM in SOURCE  [if TEST]. Read it aloud like a sentence.' },
    ] } },
    `## Comprehensions: build a collection in one line
A *comprehension* builds a new list, set or dict by looping over something, optionally keeping only some items, and computing what to store. The loop version and the comprehension do the same job:
\`\`\`python
# loop version: 4 lines
ids = []
for line in lines:
    if float(line["debit"]) > 1000:
        ids.append(line["gl_id"])

# comprehension: 1 line
ids = [line["gl_id"] for line in lines if float(line["debit"]) > 1000]
\`\`\`
The three brackets give you three kinds of collection:

| Written as | Builds | Typical use |
|---|---|---|
| \`[expr for x in src if test]\` | a **list** (keeps order and duplicates) | "all GL ids over ₹1,000" |
| \`{expr for x in src}\` | a **set** (unique values) | "which entities appear in this file" |
| \`{key: value for x in src}\` | a **dict** | "account code → account name" |

Two different places for an \`if\`:
- **At the end** (\`... for x in src if test\`) is a **filter**: items that fail are dropped, so the result can be shorter.
- **In the output** (\`["BIG" if d >= 100000 else "normal" for d in debits]\`) is a **conditional expression**: every item stays, only the value changes. The result has the same length.

**Nested loops.** More than one \`for\` is allowed. They read **left to right in the same order as nested loops**, which is how you flatten a list of lists:
\`\`\`python
batches = [["JV-1", "JV-2"], ["JV-3"]]
flat = [j for batch in batches for j in batch]     # ['JV-1', 'JV-2', 'JV-3']
\`\`\`
**A comprehension has its own scope.** Its loop variable does not exist after it ends, unlike the variable of a plain \`for\` loop, which stays alive.

**When not to use one.** If you need more than one \`for\` plus an \`if\`, or the line no longer fits one screen line, write a normal loop. A comprehension must be easier to read than the loop, never harder. And never use a comprehension just for its side effects (\`[print(x) for x in xs]\` builds a useless list of \`None\`).`,
    { py: {
      title: 'Loops over the GL file: for, enumerate, zip, break and else',
      starter: `import csv

with open("fact_gl.csv", newline="") as f:
    lines = list(csv.DictReader(f))      # a list of dicts, every value is text
print(len(lines), "GL lines")

# 1. for + if: count lines of one lakh or more, and remember the biggest
count = 0
biggest = None
for line in lines:
    debit = float(line["debit"])
    if debit >= 100000:
        count += 1
    if biggest is None or debit > float(biggest["debit"]):
        biggest = line
print("debit lines of 1 lakh or more:", count)
print("biggest debit line: gl_id", biggest["gl_id"], "debit", biggest["debit"])

# 2. enumerate: a counter that starts where YOU want (CSV row 2 = first data row)
for row_no, line in enumerate(lines[:3], start=2):
    print(f"CSV row {row_no}: {line['journal_id']}  debit {line['debit']}  credit {line['credit']}")

# 3. zip: walk two lists together
codes = ["6110", "6200", "6300"]
names = ["Salaries", "Rent", "Travel"]
for code, name in zip(codes, names):
    print(code, "=", name)

# 4. for ... else: the else part runs only when the loop did NOT break
for line in lines:
    if line["journal_id"] == "JV202504-0051":
        print("first line of JV202504-0051 is gl_id", line["gl_id"])
        break
else:
    print("journal not found")

for line in lines:
    if line["journal_id"] == "JV209999-0001":
        break
else:
    print("JV209999-0001 not found (the else ran because there was no break)")`,
      note: 'Change the 100000 to 50000 and run again. Then change the journal id in the first search to one that does not exist and watch the `else` branch run.',
    } },
    { py: {
      title: 'Comprehensions: list, set, dict, conditional expression, nested',
      starter: `import csv

def read(path):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

lines = read("fact_gl.csv")
accounts = read("dim_account.csv")

# list comprehension: [output  for item in source  if test]
big_ids = [row["gl_id"] for row in lines if float(row["debit"]) >= 100000]
print(len(big_ids), "ids over a lakh, first three:", big_ids[:3])

# if INSIDE the output: every item stays, only the value changes
labels = ["BIG" if float(row["debit"]) >= 100000 else "normal" for row in lines[:6]]
print(labels)

# dict comprehension: {key: value for ...}
name_of = {a["account_code"]: a["account_name"] for a in accounts}
print(len(name_of), "accounts; 6200 is", name_of["6200"])

# set comprehension: {value for ...}  (unique values only)
entities = {int(row["entity_id"]) for row in lines}
months = {row["posting_date"][:7] for row in lines}
print("entities:", sorted(entities), "| months:", len(months))

# nested comprehension: for-clauses read like nested loops, left to right
batches = [lines[0:3], lines[3:5]]
flat = [row["gl_id"] for batch in batches for row in batch]
print("flattened:", flat)

# the same first job as a loop: same answer
loop_ids = []
for row in lines:
    if float(row["debit"]) >= 100000:
        loop_ids.append(row["gl_id"])
print("loop and comprehension agree:", loop_ids == big_ids)

# scope: a comprehension variable disappears, a for-loop variable stays
for step in range(3):
    pass
squares = [sq_n * sq_n for sq_n in range(3)]
print("for-loop variable still exists:", step)
try:
    print(sq_n)
except NameError:
    print("sq_n does not exist outside the comprehension")`,
      note: 'Try a dict comprehension that maps each gl_id to its debit as a float. How many entries does it have? Why is it not 1,227 if two rows shared a gl_id? (Duplicate keys overwrite each other.)',
    } },
    { warn: `Four traps that cost an afternoon:
- **\`zip\` stops at the shortest list, silently.** \`zip(codes, names)\` with 3 codes and 2 names gives only 2 pairs and no error. Use \`zip(codes, names, strict=True)\` (Python 3.10+) when the lengths must match: it raises \`ValueError\` instead.
- **Never remove items from a list while looping over it.** The list shifts under the loop and items are skipped. Build a new list: \`[a for a in amounts if a != 0]\`.
- **A \`for\` variable leaks.** After \`for step in range(3)\`, \`step\` still exists. This also means a loop variable can overwrite a variable of the same name defined earlier.
- **Empty text is falsy, but the text \`"0"\` is truthy.** \`bool("")\` is \`False\` and \`bool("0")\` is \`True\`, so \`if row["amount"]:\` does not mean "the amount is not zero". Convert first, then test: \`if float(row["amount"] or 0) > 0:\`.` },
    { py: {
      title: 'Traps, run them once so you recognise them',
      starter: `amounts = [100, 0, 0, 40]

bad = amounts.copy()
for a in bad:
    if a == 0:
        bad.remove(a)          # changes the list we are looping over
print("removing while looping:", bad, "(one zero survived)")

good = [a for a in amounts if a != 0]
print("comprehension         :", good)

codes = ["6110", "6200", "6300"]
names = ["Salaries", "Rent"]
print("zip drops silently    :", list(zip(codes, names)))
try:
    list(zip(codes, names, strict=True))
except ValueError as e:
    print("zip strict raises     :", e)

# text vs number: the text "0" is truthy, the empty text is falsy
print(bool("0"), bool(""), bool(0), bool(float("0")))`,
    } },
    `## match: when the shape of the data decides
Python 3.10 added \`match\` (*structural pattern matching*). It looks like a switch statement from other languages, but it matches the **shape** of a value, not only its content. Use it when a record can arrive in several forms and each form needs different handling: events from an API, rows from different source systems, messages in a queue.

\`\`\`python
match event:
    case {"type": "invoice", "amount": amount} if amount > 100000:   # dict shape + a guard
        route = "approve"
    case {"type": "payment", "mode": "NEFT" | "RTGS" | "IMPS"}:      # | means "or"
        route = "bank file"
    case [first, *rest]:                                             # a non-empty list
        route = f"batch of {1 + len(rest)}"
    case _:                                                          # _ catches everything else
        route = "reject"
\`\`\`
The rules, in the order Python applies them:
1. Cases are tried **top to bottom; the first match wins**, like \`elif\`.
2. A *mapping pattern* (\`{"type": "invoice"}\`) matches any dict that has **at least** those keys with those values. Extra keys are fine.
3. A name in a pattern (\`amount\`) **captures** the value so you can use it in the block. A bare name never compares: it always matches and assigns.
4. \`case ... if condition:\` adds a *guard*: the pattern must match **and** the guard must be true.
5. \`_\` is the wildcard. Put it last as the "anything else" case.
6. Strings are not treated as sequences, so \`"hello"\` does not match \`[first, *rest]\`.`,
    { sketch: { w: 760, h: 300, caption: 'match tries the cases from the top: the first pattern that fits (and whose guard is true) runs, the rest are skipped', items: [
      { t: 'note', x: 14, y: 14, w: 200, h: 84, fill: 'blue', size: 14, text: 'event =\n{"type": "payment",\n "mode": "UPI",\n "amount": 250000}' },
      { t: 'arrow', x1: 216, y1: 56, x2: 244, y2: 56 },
      { t: 'box', x: 250, y: 14, w: 470, h: 40, fill: 'grey' },
      { t: 'text', x: 262, y: 39, text: '1  {"type": "invoice", "amount": a}  if a > 100000', font: 'mono', size: 12, anchor: 'start' },
      { t: 'mark', x: 742, y: 34, ok: false },
      { t: 'box', x: 250, y: 62, w: 470, h: 40, fill: 'grey' },
      { t: 'text', x: 262, y: 87, text: '2  {"type": "payment", "mode": "NEFT" | "RTGS" | "IMPS"}', font: 'mono', size: 12, anchor: 'start' },
      { t: 'mark', x: 742, y: 82, ok: false },
      { t: 'box', x: 250, y: 110, w: 470, h: 40, fill: 'yellow' },
      { t: 'text', x: 262, y: 135, text: '3  {"type": "payment", "mode": "UPI", "amount": a} if a <= 100000', font: 'mono', size: 11, anchor: 'start' },
      { t: 'mark', x: 742, y: 130, ok: false },
      { t: 'box', x: 250, y: 158, w: 470, h: 40, fill: 'green' },
      { t: 'text', x: 262, y: 183, text: '4  {"type": "payment"}', font: 'mono', size: 12, anchor: 'start' },
      { t: 'mark', x: 742, y: 178, ok: true },
      { t: 'box', x: 250, y: 206, w: 470, h: 40, fill: 'grey' },
      { t: 'text', x: 262, y: 231, text: '5  _      (anything else)', font: 'mono', size: 12, anchor: 'start', color: '#8a93a6' },
      { t: 'note', x: 14, y: 118, w: 226, h: 126, fill: 'yellow', size: 14, text: 'Case 3: the shape fits but\nthe guard (a <= 100000)\nis False, so Python moves on.\nCase 4 fits: "manual review".\nCase 5 is never reached.' },
      { t: 'text', x: 380, y: 276, text: 'Order the cases from most specific to least specific.', size: 15, bold: true, anchor: 'middle' },
    ] } },
    { py: {
      title: 'A router with match',
      starter: `def route(event):
    match event:
        case {"type": "invoice", "amount": amount} if amount > 100000:
            return "send for approval"
        case {"type": "invoice"}:
            return "auto-post"
        case {"type": "payment", "mode": "NEFT" | "RTGS" | "IMPS"}:
            return "bank file"
        case {"type": "payment", "mode": "UPI", "amount": amount} if amount <= 100000:
            return "UPI batch"
        case {"type": "payment"}:
            return "manual review"
        case [first, *rest]:
            return f"batch of {1 + len(rest)}, first type: {first['type']}"
        case _:
            return "reject: unknown shape"

events = [
    {"type": "invoice", "amount": 250000},
    {"type": "invoice", "amount": 4200},
    {"type": "payment", "mode": "RTGS", "amount": 900000},
    {"type": "payment", "mode": "UPI", "amount": 4500},
    {"type": "payment", "mode": "UPI", "amount": 250000},
    {"type": "payment", "mode": "CASH", "amount": 10},
    [{"type": "invoice"}, {"type": "payment"}],
    "hello",
    42,
]
for e in events:
    print(f"{str(e)[:52]:<54}-> {route(e)}")`,
      note: 'Add a new event with an extra key, such as `{"type": "invoice", "amount": 10, "gstin": "29AAHCN9902L1ZX"}`. It still matches case 2, because a mapping pattern only needs the listed keys.',
    } },
    `## From Excel formula to Python
You already think in these tools. This table is the translation you will use in your first weeks:

| In Excel | In Python |
|---|---|
| \`=IF(A2>100000,"Review","OK")\` | \`"Review" if amount > 100000 else "OK"\` |
| nested \`IF(...,IF(...,...))\` or \`IFS\` | \`if / elif / else\`, or \`match\` when the shape decides |
| a helper column | a list comprehension |
| \`FILTER(range, test)\` | \`[row for row in rows if test]\` |
| \`COUNTIF(range, ">1000")\` | \`sum(1 for x in xs if x > 1000)\` |
| \`SUMIF(range, test, sum_range)\` | \`sum(x for x in xs if test)\` |
| \`VLOOKUP\` / \`XLOOKUP\` | a dict: \`name_of[code]\` |
| "remove duplicates" | a set, or \`list(dict.fromkeys(xs))\` to keep the order |

\`sum(1 for x in xs if x > 1000)\` uses a *generator expression*: a comprehension without brackets, passed straight to a function. It never builds the list, so it uses almost no memory. You will meet it properly in the iterators lesson.`,
    { pychallenge: {
      id: 'python-comprehensions-flow-ch1',
      prompt: 'Write `big_debits(lines, limit)`. `lines` is a list of dicts as read by `csv.DictReader` (all values are text) with the keys `gl_id` and `debit`. Return a list of `(debit, gl_id)` tuples for the lines whose `debit` (as a float) is **at least** `limit`, with the biggest debit first. Use a comprehension, then `sorted(..., reverse=True)`.',
      starter: `def big_debits(lines, limit):
    # TODO: one list comprehension of (float debit, gl_id) tuples, then sort it
    return []
`,
      tests: `lines = [
    {"gl_id": "1", "debit": "0"},
    {"gl_id": "2", "debit": "130833.18"},
    {"gl_id": "3", "debit": "99999.99"},
    {"gl_id": "4", "debit": "100000"},
    {"gl_id": "5", "debit": "250000.5"},
]
assert big_debits(lines, 100000) == [(250000.5, "5"), (130833.18, "2"), (100000.0, "4")], big_debits(lines, 100000)
assert big_debits(lines, 1000000) == []
assert big_debits([], 1) == []
assert len(big_debits(lines, 0)) == 5`,
      solution: `def big_debits(lines, limit):
    pairs = [(float(row["debit"]), row["gl_id"]) for row in lines if float(row["debit"]) >= limit]
    return sorted(pairs, reverse=True)
`,
      hint: 'The comprehension is `[(float(row["debit"]), row["gl_id"]) for row in lines if float(row["debit"]) >= limit]`. Tuples sort by their first item, so `sorted(pairs, reverse=True)` puts the biggest debit first.',
    } },
    { pychallenge: {
      id: 'python-comprehensions-flow-ch2',
      prompt: 'Write `entities_by_month(lines)`. `lines` is a list of dicts with the text keys `posting_date` (like `"2025-04-07"`) and `entity_id` (like `"1"`). Return a dict whose keys are the months (`"2025-04"`) and whose values are **sorted lists of entity ids as integers** that have at least one line in that month. Use a dict comprehension with a set comprehension inside.',
      starter: `def entities_by_month(lines):
    # TODO: first the set of months, then {month: sorted({entity ids}) for month in ...}
    return {}
`,
      tests: `lines = [
    {"posting_date": "2025-04-07", "entity_id": "1"},
    {"posting_date": "2025-04-13", "entity_id": "2"},
    {"posting_date": "2025-04-30", "entity_id": "1"},
    {"posting_date": "2025-05-02", "entity_id": "3"},
]
r = entities_by_month(lines)
assert r == {"2025-04": [1, 2], "2025-05": [3]}, r
assert list(r) == ["2025-04", "2025-05"], list(r)
assert entities_by_month([]) == {}`,
      solution: `def entities_by_month(lines):
    months = sorted({row["posting_date"][:7] for row in lines})
    return {
        m: sorted({int(row["entity_id"]) for row in lines if row["posting_date"].startswith(m)})
        for m in months
    }
`,
      hint: 'Step 1: \`months = sorted({row["posting_date"][:7] for row in lines})\`. Step 2: for each month, a set comprehension \`{int(row["entity_id"]) for row in lines if row["posting_date"].startswith(m)}\`, wrapped in \`sorted(...)\`.',
    } },
    { pychallenge: {
      id: 'python-comprehensions-flow-ch3',
      prompt: 'Write `route(event)` with a `match` statement. First match wins: (1) a dict with `"type": "invoice"` and an `amount` **above** 100000 returns `"approve"`; (2) any other invoice dict returns `"post"`; (3) a payment dict with `mode` NEFT, RTGS or IMPS returns `"bank"`; (4) a payment with `mode` UPI and an `amount` of 100000 **or less** returns `"upi"`; (5) any other payment returns `"review"`; (6) a list or tuple with at least one item returns `"batch"`; (7) everything else, including `"hello"`, `None` and an empty list, returns `"reject"`.',
      starter: `def route(event):
    # TODO: match event: case {...}: ... first match wins
    return "reject"
`,
      tests: `assert route({"type": "invoice", "amount": 250000}) == "approve"
assert route({"type": "invoice", "amount": 100000}) == "post"
assert route({"type": "invoice"}) == "post"
assert route({"type": "invoice", "amount": 5, "gstin": "29AAHCN9902L1ZX"}) == "post"
assert route({"type": "payment", "mode": "RTGS", "amount": 5}) == "bank"
assert route({"type": "payment", "mode": "IMPS"}) == "bank"
assert route({"type": "payment", "mode": "UPI", "amount": 4500}) == "upi"
assert route({"type": "payment", "mode": "UPI", "amount": 250000}) == "review"
assert route({"type": "payment", "mode": "CASH"}) == "review"
assert route([{"type": "invoice"}]) == "batch"
assert route(("a", "b")) == "batch"
assert route([]) == "reject"
assert route("hello") == "reject"
assert route(None) == "reject"
assert route({"type": "refund"}) == "reject"`,
      solution: `def route(event):
    match event:
        case {"type": "invoice", "amount": amount} if amount > 100000:
            return "approve"
        case {"type": "invoice"}:
            return "post"
        case {"type": "payment", "mode": "NEFT" | "RTGS" | "IMPS"}:
            return "bank"
        case {"type": "payment", "mode": "UPI", "amount": amount} if amount <= 100000:
            return "upi"
        case {"type": "payment"}:
            return "review"
        case [_, *_]:
            return "batch"
        case _:
            return "reject"
`,
      hint: 'Write the cases in the order of the rules. Guards go after the pattern: `case {"type": "invoice", "amount": amount} if amount > 100000:`. `[_, *_]` matches a non-empty list or tuple. Finish with `case _:`.',
    } },
    { real: 'Your reconciliation and reporting scripts are made of exactly this: a `for` over rows, an `if / elif` that classifies each row ("matched", "amount mismatch", "missing at supplier"), and a comprehension that collects one class into a list. When a script grows a tower of nested `if`s, stop and ask: is this really a decision on *values* (`if / elif`), or on the *shape* of the record (`match`)? The second one is far easier to read and to extend when a new source system arrives.' },
    { interview: `**"List comprehension vs generator expression vs \`map\`/\`filter\`?"**
Model answer: "A list comprehension builds the whole list in memory now. A generator expression, written with round brackets, produces items one at a time, so it suits big or endless data and one-pass work like \`sum(...)\`. \`map\` and \`filter\` do the same as the two parts of a comprehension, but a comprehension is usually more readable and does not need \`lambda\`."

**"What does \`zip\` do when the lists have different lengths?"** "It stops at the shortest and silently drops the rest. In Python 3.10 and later \`strict=True\` raises \`ValueError\`, and \`itertools.zip_longest\` pads the short one."

**"What is \`for ... else\`?"** "The \`else\` block runs only when the loop ended normally, without \`break\`. I use it for search loops: break when found, else handle 'not found'."` },
    `## Recap
- \`if / elif / else\` checks from the top and **the first true branch wins**; put the strictest test first. A conditional expression (\`a if test else b\`) picks one of two values.
- \`for\` walks any iterable; \`while\` repeats until a condition fails; \`break\`, \`continue\` and loop \`else\` control the flow. Prefer \`enumerate\` and \`zip\` over \`range(len(...))\`.
- A comprehension is output, loop and optional filter in one line: \`[x for x in src if test]\`, \`{x for ...}\`, \`{k: v for ...}\`. Use a plain loop when it stops being easy to read.
- Traps: \`zip\` drops extra items silently (use \`strict=True\`), never remove from a list while looping, a \`for\` variable leaks but a comprehension variable does not.
- \`match\` chooses by the shape of the data: first match wins, mapping patterns need only the listed keys, names capture, \`if\` adds a guard, \`_\` is "anything else".`,
  ],
  quiz: [
    { q: 'Which line builds a dict that maps each `gl_id` to its debit as a number?', o: ['`[row["gl_id"]: float(row["debit"]) for row in lines]`', '`{row["gl_id"], float(row["debit"]) for row in lines}`', '`{row["gl_id"]: float(row["debit"]) for row in lines}`', '`(row["gl_id"]: float(row["debit"]) for row in lines)`'], a: 2, why: 'A dict comprehension uses curly braces and a `key: value` pair. Square brackets make a list and cannot hold `key: value`.' },
    { q: 'What does `list(zip(["6110", "6200", "6300"], ["Salaries", "Rent"]))` return?', o: ['`[("6110", "Salaries"), ("6200", "Rent")]`', '`[("6110", "Salaries"), ("6200", "Rent"), ("6300", None)]`', 'a `ValueError`', 'an empty list'], a: 0, why: '`zip` stops at the shortest input and drops the rest without any error. Only `strict=True` raises `ValueError`.' },
    { q: 'When does the `else` block of a `for` loop run?', o: ['every time the loop runs once more', 'only when the loop body raised an error', 'only when the list is empty', 'only when the loop finished without hitting `break`'], a: 3, why: 'Loop `else` means "no break happened", which makes it ideal for "searched everything, found nothing".' },
    { q: 'How is `["BIG" if d >= 100000 else "normal" for d in debits]` different from `[d for d in debits if d >= 100000]`?', o: ['no difference, they give the same list', 'the first keeps every item and changes the value; the second drops items that fail the test', 'the first is a filter; the second is a conditional expression', 'the first needs a dict'], a: 1, why: 'An `if/else` in the output is a conditional expression and keeps the length. A trailing `if` is a filter and can shorten the list.' },
    { q: 'You remove items from `bad` with `bad.remove(a)` inside `for a in bad:`. What goes wrong?', o: ['Python raises `RuntimeError`', 'the list shifts under the loop, so some items are skipped', 'the original list is copied automatically', 'nothing, this is the recommended pattern'], a: 1, why: 'Removing shifts every later item one place left, but the loop moves on by one, so the neighbour is never looked at. Build a new list with a comprehension instead.' },
    { q: 'For `event = {"type": "invoice", "amount": 10, "gstin": "29AAHCN9902L1ZX"}`, does `case {"type": "invoice"}:` match?', o: ['yes, a mapping pattern only needs the listed keys to be present', 'no, the dict has extra keys', 'only if you add `_` at the end of the pattern', 'only if the cases are sorted alphabetically'], a: 0, why: 'A mapping pattern matches any dict that contains at least those keys with those values. Extra keys do not matter.' },
  ],
  task: {
    title: 'Classify the employee master with loops, comprehensions and match',
    steps: [
      'One-time setup: export the practice tables from the PostgreSQL database you built in the SQL phase into CSV files. In PowerShell run `cd C:\\fde\\py-recap`, then `foreach ($t in "employees","payroll","fact_gl","dim_account","orders","purchase_register","supplier_invoices","fx_rates") { psql -U postgres -d fde_practice -c "\\copy $t TO \'$t.csv\' WITH (FORMAT csv, HEADER true)" }`. psql asks for the postgres password on every call; to type it once, run `$env:PGPASSWORD = "your-password"` first (it lasts only for that PowerShell window). Each line should answer `COPY` and a row count, and you should now see eight `.csv` files in the folder. The Python lessons use these files for their tasks.',
      'In `C:\\fde\\py-recap` create `comprehensions_flow.py` and read `employees.csv` with `csv.DictReader` into a list of dicts.',
      'With comprehensions build: a dict `emp_id → emp_name`, a list of the names of employees whose `annual_ctc` is above 20 lakh (2000000), and a set of the departments.',
      'With a `for` loop and `enumerate(start=1)` print a numbered list of the employees with a missing PAN (an empty `pan` cell).',
      'Write `bank_status(row)` with `match` on the tuple `(ifsc_looks_ok, pan_present)` and return "ok", "fix IFSC", "fix PAN" or "fix both". Print how many employees fall in each class.',
      'Run it with `py comprehensions_flow.py` and add a comment at the top: which two spots did a comprehension replace a loop, and which one did you keep as a loop and why?',
    ],
    deliverable: '`comprehensions_flow.py` and its printed output.',
  },
};
