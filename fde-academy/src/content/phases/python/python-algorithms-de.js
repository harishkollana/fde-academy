export default {
  id: 'python-algorithms-de',
  title: 'Interview toolkit: algorithms for data work',
  goal: 'You can pick the right data structure and pattern for common data-engineering interview problems (hash maps, sorting, intervals, two pointers, sliding windows, heaps, binary search, graphs, log parsing), write each one cleanly in Python, and state its time and space cost.',
  roadmap: ['hash maps', 'sorting', 'two pointers', 'parsing CSV and logs', 'complexity'],
  blocks: [
    `## The problem
Python and data-engineering interviews often contain a **timed coding problem**, and it is rarely a puzzle from a maths contest. It is something like:
- "Given a list of transactions, find two that add up to a target amount."
- "Merge these overlapping date ranges." (The SCD2 validity check in disguise.)
- "Return the top 3 earners per department."
- "Parse this log and count errors per component."
- "Match two sorted lists of invoice numbers without a nested loop."
- "Find the closest earlier exchange rate for a date."

The interviewer is not hunting for a trick. They check three things: (1) can you **choose the right data structure**, (2) do you know **how the cost grows** (the Performance lesson), and (3) do you write **clear code with edge cases**, while explaining your thinking. There are about **ten patterns** that cover most of it. Each one has a Python idiom, a typical cost and a data-engineering example. This lesson is that toolkit, with the Kollana data to practise on. The next lesson turns it into a method you can apply under time pressure.`,
    `## The pattern map
Read the **shape of the problem**, then reach for the matching tool:`,
    { sketch: { w: 760, h: 332, caption: 'Match the shape of the problem to the tool, and say its cost out loud', items: [
      { t: 'table', x: 14, y: 36, title: 'if you see this ... reach for this', cols: ['the problem asks for', 'tool in Python', 'cost'], colW: [350, 255, 125], rows: [['count, group, de-duplicate, look up by key', 'dict, set, Counter, defaultdict', 'O(1) each'], ['ranges, overlaps, "in order" questions', 'sort first, then one pass', 'O(n log n)'], ['pairs in sorted data, merging two lists', 'two pointers', 'O(n)'], ['the last k items, "in any window of size k"', 'sliding window, deque', 'O(n)'], ['top k, merge many sorted streams', 'heapq (nlargest, merge)', 'O(n log k)'], ['find a value or a position in sorted data', 'bisect (binary search)', 'O(log n)'], ['hierarchies, dependencies, "who reports to"', 'queue or stack, BFS and DFS', 'O(n + links)']], rowH: 30, hl: [0] },
      { t: 'note', x: 14, y: 288, w: 732, h: 34, fill: 'yellow', size: 14, text: 'First say the slow obvious way and its cost. Then say which structure removes the repeated work.' },
    ] } },
    `## 1. Hash maps: count, group, de-duplicate, look up
A \`dict\` or \`set\` finds a key in about **one step**, however many items it holds (the Performance lesson). Nearly every "find", "count" or "group" problem becomes a dictionary:
- **Count**: \`Counter(items)\`, then \`.most_common(3)\`.
- **Group**: \`defaultdict(list)\`: \`groups[supplier].append(invoice)\`.
- **Dedupe**: a \`set\` of keys already seen, in one pass.
- **Look up the partner** instead of searching for it. This is the classic **two-sum**: "find two numbers that add to a target". For each number, the number you *need* is \`target - x\`. Keep a dict of the numbers already seen: if \`target - x\` is in it, you are done. One pass instead of two nested loops: O(n) instead of O(n squared). The same idea reconciles two lists, joins on a key (the hash join) and detects duplicate invoices.

**With money, use integers or Decimal.** Compare amounts in **paise** (\`int\`) so a float error cannot make two equal amounts differ.`,
    { py: {
      title: 'Hash maps on the purchase register: two-sum, counting and grouping',
      starter: `import csv
from collections import Counter, defaultdict
from decimal import Decimal

with open("purchase_register.csv", newline="") as f:
    invoices = list(csv.DictReader(f))
paise = [int(Decimal(r["gst_amount"]) * 100) for r in invoices]       # integers: no float surprises
print(len(invoices), "invoices; first four GST amounts in paise:", paise[:4])

# 1. two-sum: which two invoices have GST amounts that add up to the target?
def two_sum_slow(nums, target):
    comparisons = 0
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            comparisons += 1
            if nums[i] + nums[j] == target:
                return (i, j), comparisons
    return None, comparisons

def two_sum_fast(nums, target):
    first_index, steps = {}, 0                     # value -> the first index where we saw it
    for j, x in enumerate(nums):
        steps += 1
        i = first_index.get(target - x)            # is the partner already in the dict?
        if i is not None:
            return (i, j), steps
        first_index.setdefault(x, j)
    return None, steps

target = paise[5] + paise[24]
print("target:", target, "paise")
print("slow :", two_sum_slow(paise, target))
print("fast :", two_sum_fast(paise, target))
print("no pair adds up to -1:", two_sum_slow(paise, -1)[1], "comparisons (slow) versus", two_sum_fast(paise, -1)[1], "steps (fast)")

# 2. count and group
by_supplier = Counter(r["supplier_name"] for r in invoices)
print()
print("invoices per supplier, top 3:", by_supplier.most_common(3))

groups = defaultdict(list)
for r in invoices:
    groups[r["supplier_gstin"]].append(r["invoice_no"])
biggest = max(groups, key=lambda g: len(groups[g]))
print("most invoices under one GSTIN:", biggest, "->", len(groups[biggest]), "invoices")

# 3. de-duplicate in one pass, keeping the first
seen, unique = set(), []
for r in invoices:
    if r["invoice_no"] not in seen:
        seen.add(r["invoice_no"])
        unique.append(r)
print("duplicate invoice numbers:", len(invoices) - len(unique))`,
      note: 'The slow version scans pairs, the fast version asks the dictionary one question per invoice. With 30 invoices the difference is small; with 3 million it is the difference between seconds and days, and the dictionary version also works on a stream. Storing the first index with setdefault makes the answer deterministic when a value repeats. A real reconciliation uses the same idea with the invoice number as the key.',
    } },
    `## 2. Sorting, and "sort first, then one pass"
Many problems that look hard become easy **after sorting**, because equal or neighbouring items end up next to each other: duplicates, overlaps, gaps, top-N per group.
- \`sorted(items, key=...)\` returns a new list; \`items.sort()\` sorts in place. Both are **stable**: items with equal keys keep their original order. So you can sort by a secondary key first and the primary key second.
- **Multi-key and descending**: use a tuple key and negate numbers: \`key=lambda e: (e["department"], -salary, e["name"])\`.
- After sorting by a key, \`itertools.groupby\` gives one group per key (remember: it only groups **neighbours**, which is exactly why you sort first).
- **Intervals**: sort by start, then walk once. If the next start is not after the current end, they **overlap** and you extend the current one. This **merge intervals** pattern checks effective-dated rows (SCD2), booking calendars, and shift schedules: **no overlaps** and **no gaps** is exactly the "gaps and islands" check from the SQL phase, done in Python.`,
    { sketch: { w: 760, h: 292, caption: 'Merge intervals: sort by start, then one pass, extending the current interval while the next one overlaps', items: [
      { t: 'text', x: 14, y: 22, text: 'unsorted input', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 266, y: 34, w: 60, h: 20, label: '(8, 10)', size: 12, fill: 'pink' },
      { t: 'box', x: 56, y: 58, w: 60, h: 20, label: '(1, 3)', size: 12, fill: 'pink' },
      { t: 'box', x: 86, y: 82, w: 120, h: 20, label: '(2, 6)', size: 12, fill: 'pink' },
      { t: 'box', x: 476, y: 106, w: 90, h: 20, label: '(15, 18)', size: 12, fill: 'pink' },
      { t: 'arrow', x1: 620, y1: 56, x2: 620, y2: 150 },
      { t: 'text', x: 634, y: 98, text: 'sort by start,', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'text', x: 634, y: 116, text: 'then one pass', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'text', x: 14, y: 156, text: 'merged', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 56, y: 168, w: 150, h: 22, label: '(1, 6)', size: 13, fill: 'green' },
      { t: 'box', x: 266, y: 168, w: 60, h: 22, label: '(8, 10)', size: 13, fill: 'green' },
      { t: 'box', x: 476, y: 168, w: 90, h: 22, label: '(15, 18)', size: 13, fill: 'green' },
      { t: 'note', x: 14, y: 206, w: 360, h: 76, fill: 'yellow', size: 13, text: 'sorted: (1,3) (2,6) (8,10) (15,18)\nstart 2 is not after end 3: overlap, so the\ncurrent end becomes max(3, 6) = 6.\nstart 8 is after 6: a new interval begins.' },
      { t: 'note', x: 392, y: 206, w: 354, h: 76, fill: 'grey', size: 13, text: 'Cost: sorting O(n log n), the pass O(n).\nIn finance: validity ranges of a rate or an\nemployee record must have no overlap and\nno gap.' },
    ] } },
    { py: {
      title: 'Sorting with several keys, top earner per department, and gaps and overlaps in effective dates',
      starter: `import csv
from itertools import groupby
from datetime import date, timedelta

with open("employees.csv", newline="") as f:
    emps = list(csv.DictReader(f))

# 1. a tuple key: department ascending, salary DESCENDING (negate it), name as the tie-break
ranked = sorted(emps, key=lambda e: (e["department"], -int(e["annual_ctc"]), e["emp_name"]))
print("top earner per department (sorted first, then groupby):")
for dept, rows in groupby(ranked, key=lambda e: e["department"]):
    top = next(rows)                                  # the first row of each group is the highest paid
    print(f"   {dept:<12}{top['emp_name']:<16}{int(top['annual_ctc']):>10,}")

# 2. stability: sort by a secondary key first, then by the primary key
by_city_then_dept = sorted(sorted(emps, key=lambda e: e["city"]), key=lambda e: e["department"])
print("first three by department, then city:", [(e["department"], e["city"]) for e in by_city_then_dept[:3]])

# 3. effective-dated rows: find gaps and overlaps (the SCD2 check from the SQL phase)
rows = [
    ("Sales",   date(2024, 1, 1),  date(2025, 6, 30)),
    ("Finance", date(2025, 7, 1),  date(2025, 12, 31)),
    ("Finance", date(2025, 12, 15), date(2026, 3, 31)),     # starts BEFORE the previous one ended: overlap
    ("Ops",     date(2026, 5, 1),  None),                    # April 2026 is missing: a gap; open-ended row
]

def check_validity(rows):
    problems = []
    ordered = sorted(rows, key=lambda r: r[1])               # sort by start date
    for (_, _, prev_end), (name, start, _) in zip(ordered, ordered[1:]):
        if prev_end is None:
            problems.append(f"row {name} starts at {start} but the previous row has no end date")
        elif start <= prev_end:
            problems.append(f"overlap: {name} starts {start}, previous row ends {prev_end}")
        elif start > prev_end + timedelta(days=1):
            problems.append(f"gap: {prev_end + timedelta(days=1)} to {start - timedelta(days=1)} has no row")
    return problems

for problem in check_validity(rows):
    print("  ", problem)`,
      note: 'The top-earner loop works because the list was sorted by department first, so each department is one block, and the highest salary comes first inside it. The validity check walks neighbouring pairs of the sorted rows: that is a two-element window sliding over the data. Run the same check as a SQL query with LEAD() and you get the same findings, which is a good thing to say in an interview.',
    } },
    `## 3. Two pointers and sliding windows
When data is **sorted** (or you can sort it), two indexes that walk toward each other or in the same direction replace a nested loop, and the cost drops to O(n):
- **Merge two sorted lists** (or **match** them): keep a pointer in each; advance the smaller one. This is how you compare two sorted invoice lists and list "only in A", "only in B" and "in both" without a lookup structure.
- **Pair with a sum in a sorted list**: one pointer at each end; move the left one up if the sum is too small, the right one down if too large.
- **In-place de-duplication** of a sorted list: a slow pointer for where to write, a fast one for where to read.

A **sliding window** keeps a running answer for "the last k items" and updates it by **adding the new item and dropping the old one**, instead of re-adding k numbers every time:
- **Moving average or sum** over 3 months: \`total += new - old\`.
- **"Requests in the last 60 seconds"** (rate limiting): a \`deque\` of timestamps; \`popleft()\` the ones that fell out of the window.
- **Longest stretch** satisfying a rule (for example the longest run of days without an error): a variable-size window that grows on the right and shrinks on the left.

Use \`collections.deque\` for queues and windows: \`popleft()\` is O(1), while \`list.pop(0)\` is O(n).`,
    { py: {
      title: 'Two pointers (reconcile sorted lists), a sliding window, and heapq for top-k and merging',
      starter: `import csv
import heapq
from collections import defaultdict, deque

with open("purchase_register.csv", newline="") as f:
    books = sorted(r["invoice_no"] for r in csv.DictReader(f))
with open("supplier_invoices.csv", newline="") as f:
    theirs = sorted(r["invoice_no"] for r in csv.DictReader(f))

# 1. two pointers over two SORTED lists: one pass, no lookup structure
both, only_books, only_theirs = [], [], []
i = j = 0
while i < len(books) and j < len(theirs):
    if books[i] == theirs[j]:
        both.append(books[i]); i += 1; j += 1
    elif books[i] < theirs[j]:
        only_books.append(books[i]); i += 1               # smaller: it cannot appear later in the other list
    else:
        only_theirs.append(theirs[j]); j += 1
only_books += books[i:]
only_theirs += theirs[j:]
print(f"in both: {len(both)} | only in our books: {len(only_books)} | only in the supplier's file: {len(only_theirs)}")

# 2. a sliding window: monthly order totals and their 3-month moving average
with open("orders.csv", newline="") as f:
    monthly = defaultdict(int)
    for r in csv.DictReader(f):
        monthly[r["order_date"][:7]] += int(float(r["amount"]))
months = sorted(monthly)
window, total, moving = deque(), 0, []
for m in months:
    window.append(monthly[m]); total += monthly[m]
    if len(window) > 3:
        total -= window.popleft()                          # drop the month that left the window
    if len(window) == 3:
        moving.append((m, total / 3))
print("months:", len(months), "| first moving averages:", [(m, round(v)) for m, v in moving[:3]])

# 3. heapq: the 3 biggest orders without sorting everything, and merging sorted streams
with open("orders.csv", newline="") as f:
    orders = list(csv.DictReader(f))
top3 = heapq.nlargest(3, orders, key=lambda r: float(r["amount"]))      # O(n log k)
print("top 3 orders:", [(r["order_id"], r["amount"]) for r in top3])

online = sorted(int(r["order_id"]) for r in orders if r["channel"] == "Online")
partner = sorted(int(r["order_id"]) for r in orders if r["channel"] == "Partner")
direct = sorted(int(r["order_id"]) for r in orders if r["channel"] == "Direct")
merged = heapq.merge(online, partner, direct)               # k-way merge: lazy, one item at a time
print("first ten of the merged stream:", [next(merged) for _ in range(10)])`,
      note: 'The reconcile loop touches each list once, which is why sorted inputs are so valuable: a lookup structure is not needed, and the memory stays small even for files that do not fit in memory (the merge is a stream). heapq.merge does the same for any number of sorted inputs, which is how external sorting and merging of daily files works. nlargest keeps only 3 candidates in a heap, so it is O(n log 3) rather than sorting all of them.',
    } },
    `## 4. Binary search with bisect
On a **sorted list**, \`bisect\` finds a position in about log2(n) steps: 20 steps for a million items.
- \`bisect_left(a, x)\`: the index of the first item that is **not smaller** than \`x\` (where \`x\` would be inserted before equals).
- \`bisect_right(a, x)\`: the index **after** the last item equal to \`x\`.
- **"The last value at or before x"** is \`a[bisect_right(a, x) - 1]\`. This is the **effective-date lookup**: the exchange rate valid on a given day, the tax slab for an income, the price list version for an order date.

**The data-quality catch:** the lookup always returns *something*. If the February rate is missing, a February date silently gets January's rate. In real code, also check **how old** the rate is, and fail or warn when the gap is bigger than expected (the Kollana data has exactly such a hole: the SGD rate for February 2026).

## 5. Hierarchies: BFS and DFS
The employee table is a **tree**: \`manager_id\` points to a parent. In SQL you used a recursive CTE; in Python you use a **queue** (BFS, level by level) or a **stack** or recursion (DFS, deep first). Build an adjacency dict \`manager -> [reports]\` once (hash map), then walk it. The same code handles the account hierarchy (6000 Operating Expenses, 6100 People Costs, 6110 Salaries) and any "depends on" graph, such as which task runs before which (a DAG in Airflow). Always keep a **visited set** if the data could contain a cycle, or the walk never ends.`,
    { py: {
      title: 'bisect for an effective-date FX lookup, and BFS over the employee tree',
      starter: `import csv
from bisect import bisect_right
from collections import defaultdict, deque
from datetime import date

# 1. effective-date lookup with bisect
rates = defaultdict(list)                                    # currency -> sorted list of (month start, rate)
with open("fx_rates.csv", newline="") as f:
    for r in csv.DictReader(f):
        rates[r["currency"]].append((date.fromisoformat(r["rate_month"]), r["rate_to_inr"]))
for currency in rates:
    rates[currency].sort()

def rate_on(currency, day):
    series = rates[currency]
    starts = [d for d, _ in series]                          # (build this once in real code)
    position = bisect_right(starts, day) - 1                 # the last month start on or before the day
    if position < 0:
        return None
    return series[position]

print("USD on 2025-09-17 ->", rate_on("USD", date(2025, 9, 17)))
print("USD on 2025-04-01 ->", rate_on("USD", date(2025, 4, 1)))
print("USD on 2025-03-31 ->", rate_on("USD", date(2025, 3, 31)), "(before the first rate: no answer)")
found = rate_on("SGD", date(2026, 2, 15))
print("SGD on 2026-02-15 ->", found, "<- the February rate is missing, so January's rate is returned!")
age_days = (date(2026, 2, 15) - found[0]).days
print(f"   the rate is {age_days} days old: a check like 'age > 31 days' would catch it")

# 2. BFS over the manager tree
with open("employees.csv", newline="") as f:
    emps = {int(r["emp_id"]): r for r in csv.DictReader(f)}
reports = defaultdict(list)
root = None
for emp_id, r in emps.items():
    if r["manager_id"]:
        reports[int(r["manager_id"])].append(emp_id)
    else:
        root = emp_id

levels = defaultdict(list)
queue, seen = deque([(root, 0)]), {root}
while queue:
    emp_id, depth = queue.popleft()                          # FIFO: level by level
    levels[depth].append(emp_id)
    for report in reports[emp_id]:
        if report not in seen:                               # protects against cycles in bad data
            seen.add(report)
            queue.append((report, depth + 1))
print()
print("top of the tree:", root, emps[root]["emp_name"])
for depth in sorted(levels):
    print(f"   level {depth}: {len(levels[depth])} employees", levels[depth][:6])

def path_to_top(emp_id):                                     # walking UP is just following manager_id
    path = [emp_id]
    while emps[path[-1]]["manager_id"]:
        path.append(int(emps[path[-1]]["manager_id"]))
    return path
print("path from employee 14 to the top:", path_to_top(14))`,
      note: 'bisect_right minus one is the idiom for "the latest entry that is not after this date". The third lookup shows the danger: the SGD rate for 1 February 2026 does not exist, so February dates quietly get the January rate. A lookup function that also returns the age of the rate lets the caller decide. The BFS prints the tree level by level (the same result as a recursive CTE with a depth column), and following manager_id upward gives the chain of command.',
    } },
    `## 6. Parsing CSV and logs
Interview data problems come as **text**. The skill is turning lines into structured values **without crashing on the bad ones**:
- **CSV**: use the \`csv\` module (\`DictReader\`), not \`split(",")\`. Convert types on the way in, and decide what a bad row does (skip and count, or stop).
- **Logs**: one **regular expression** with **named groups** per line format. A line that does not match is **counted, not fatal**. Then aggregate with a \`Counter\` or \`defaultdict\`.
- **Stream** the file line by line (a generator) so size does not matter, and keep only the aggregates.
- Typical questions: count by level, **errors per component**, the **slowest** operations (parse \`in 3.2s\`), the **first** error, **errors per hour** (bucket by the timestamp's hour), **top-N** frequent messages.

Say what you do with **bad lines** and **blank lines** before you are asked; it shows you have worked with real data.`,
    { py: {
      title: 'A log parser with a named-group regex, a counter and per-hour buckets',
      starter: `import re
from collections import Counter, defaultdict

LOG = '''2026-09-30 02:00:01 INFO loader: started month 2026-09
2026-09-30 02:00:04 INFO loader: loaded 612 rows in 3.2s
2026-09-30 02:00:05 WARNING validator: 4 of 612 journals are unbalanced
2026-09-30 02:00:09 ERROR api: GET /rates failed with HTTP 503
2026-09-30 02:00:11 ERROR api: GET /rates failed with HTTP 503
this line is not a log line at all
2026-09-30 03:15:40 INFO loader: loaded 1227 rows in 9.8s
2026-09-30 03:15:41 ERROR db: connection reset

2026-09-30 03:16:02 INFO report: wrote kollana_2026-09.xlsx
2026-09-30 04:02:10 CRITICAL scheduler: job month_end overran its slot
'''

LINE = re.compile(r"(?P<ts>\\d{4}-\\d{2}-\\d{2} (?P<hour>\\d{2}):\\d{2}:\\d{2}) (?P<level>[A-Z]+) (?P<component>[\\w.]+): (?P<message>.*)")

levels, errors_by_component, per_hour = Counter(), Counter(), defaultdict(Counter)
bad_lines, durations = 0, []
for line in LOG.splitlines():
    if not line.strip():
        continue                                           # a blank line is not an error
    m = LINE.fullmatch(line)
    if not m:
        bad_lines += 1                                     # count it, never crash on it
        continue
    levels[m["level"]] += 1
    per_hour[m["hour"]][m["level"]] += 1
    if m["level"] in ("ERROR", "CRITICAL"):
        errors_by_component[m["component"]] += 1
    took = re.search(r"in (\\d+(?:\\.\\d+)?)s", m["message"])
    if took:
        durations.append((float(took.group(1)), m["message"]))

print("lines by level      :", dict(levels))
print("bad lines           :", bad_lines)
print("errors by component :", errors_by_component.most_common())
print("slowest operation   :", max(durations))
for hour in sorted(per_hour):
    print(f"   hour {hour}: {dict(per_hour[hour])}")`,
      note: 'One compiled regex with named groups does the parsing, and the counters do the answering. The blank line is skipped, the sentence that is not a log line is counted as a bad line, and nothing crashes. In an interview, say how you treat bad and blank lines before writing the loop. For a log of many gigabytes the same loop runs over the open file instead of a string, so memory stays flat.',
    } },
    { warn: `Things that go wrong in interview-style (and real) algorithm code:
- **A nested loop where a dict would do.** The most common reason a solution is "too slow". Name the cost and fix it.
- **\`list.pop(0)\` and \`x in some_list\`** inside loops. Use \`deque\` and \`set\`.
- **\`groupby\` on unsorted data**, giving several groups for one key.
- **Mutating the input** (sorting it in place, removing items) when the caller expects it unchanged.
- **Off-by-one in windows and binary search.** Test with a list of 0, 1, 2 items and with the target at both ends.
- **Float money.** Compare in integers (paise) or Decimal.
- **Interval boundaries.** Closed intervals touch at the end (3, 3), half-open ones do not. Ask which one you have.
- **Assuming sorted input.** Ask, or sort and say what it costs.
- **Ignoring empty input, duplicates, negatives and a missing answer.** Decide what to return (\`None\`, an exception, an empty list) and say it.
- **A lookup that always returns something** (bisect, \`dict.get\` with a default): check that the answer is valid (the rate is not 10 months old).
- **Reading the whole file** to count lines. Stream it.` },
    { pychallenge: {
      id: 'python-algorithms-de-ch1',
      prompt: 'Write `two_sum(nums, target)`. Scan from left to right and return the tuple `(i, j)` of indexes with `i < j` and `nums[i] + nums[j] == target` for the **first** `j` that completes a pair; if several earlier indexes could pair with it, use the **earliest** `i`. Return `None` if there is no pair. The tests count how often your function reads `nums`: a nested loop reads it far too often, so use a dict.',
      starter: `def two_sum(nums, target):
    # TODO: one pass; remember the first index of every value in a dict; look up target - x
    return None
`,
      tests: `assert two_sum([2, 7, 11, 15], 9) == (0, 1)
assert two_sum([3, 2, 4], 6) == (1, 2)
assert two_sum([3, 3], 6) == (0, 1)
assert two_sum([2, 2, 5], 7) == (0, 2)
assert two_sum([1, 2, 3], 7) is None
assert two_sum([], 5) is None
assert two_sum([5], 5) is None
assert two_sum([-3, 4, 3, 90], 0) == (0, 2)
assert two_sum([0, 4, 3, 0], 0) == (0, 3)
assert two_sum([1, 1, 1], 2) == (0, 1)

class Counted(list):
    reads = 0
    def __iter__(self):
        for item in super().__iter__():
            Counted.reads += 1
            yield item
    def __getitem__(self, index):
        Counted.reads += 1
        return super().__getitem__(index)

data = Counted(range(0, 4000, 2))
Counted.reads = 0
assert two_sum(data, 1) is None
assert Counted.reads <= 3 * len(data), f"{Counted.reads} reads for {len(data)} items: use a dict, not a nested loop"
Counted.reads = 0
assert two_sum(data, 7994) == (1998, 1999)
assert Counted.reads <= 3 * len(data), Counted.reads`,
      solution: `def two_sum(nums, target):
    first_index = {}
    for j, x in enumerate(nums):
        i = first_index.get(target - x)
        if i is not None:
            return (i, j)
        first_index.setdefault(x, j)
    return None
`,
      hint: 'Keep a dict `first_index` from a value to the first index where it appeared. For every `j, x` in `enumerate(nums)` look up `target - x`; if it is in the dict, return `(that_index, j)`. Only after the check add `x` to the dict with `setdefault(x, j)`, so an element is never paired with itself.',
    } },
    { pychallenge: {
      id: 'python-algorithms-de-ch2',
      prompt: 'Write `merge_intervals(intervals)`. `intervals` is a list of `(start, end)` tuples of numbers with `start <= end` (closed intervals), in any order. Return a **new** sorted list of tuples in which overlapping or **touching** intervals (the next start is `<=` the current end) are merged. Do not change the input list. An empty list gives an empty list.',
      starter: `def merge_intervals(intervals):
    # TODO: sort by start; walk once; extend the last merged interval while the next one starts at or before its end
    return []
`,
      tests: `assert merge_intervals([(1, 3), (2, 6), (8, 10), (15, 18)]) == [(1, 6), (8, 10), (15, 18)]
assert merge_intervals([(8, 10), (1, 3), (2, 6), (15, 18)]) == [(1, 6), (8, 10), (15, 18)]
assert merge_intervals([(1, 4), (4, 5)]) == [(1, 5)]
assert merge_intervals([(1, 10), (2, 3), (4, 5)]) == [(1, 10)]
assert merge_intervals([(5, 5)]) == [(5, 5)]
assert merge_intervals([]) == []
assert merge_intervals([(1, 2), (3, 4)]) == [(1, 2), (3, 4)]
assert merge_intervals([(-5, -1), (-3, 2), (4, 4)]) == [(-5, 2), (4, 4)]
assert merge_intervals([(1, 5), (1, 3), (0, 0)]) == [(0, 0), (1, 5)]
original = [(3, 4), (1, 2)]
copy = list(original)
merge_intervals(original)
assert original == copy, "the input list must not be changed"
assert all(isinstance(t, tuple) for t in merge_intervals([(1, 2)]))`,
      solution: `def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged
`,
      hint: '`sorted(intervals)` returns a new sorted list (sorting tuples sorts by start first). Keep a list `merged`. For each `(start, end)`: if `merged` is not empty and `start <= merged[-1][1]` replace the last item with `(merged[-1][0], max(merged[-1][1], end))`, otherwise append `(start, end)`.',
    } },
    { pychallenge: {
      id: 'python-algorithms-de-ch3',
      prompt: 'Write `top_k(items, k, key)`. `items` is any iterable (it may be a generator that cannot be indexed). Return a list of the `k` items with the **largest** `key(item)`, from largest to smallest; items with equal keys keep their original order. If `k` is 0 or negative return `[]`; if `k` is larger than the number of items return all of them, sorted. Call `key` **exactly once per item**.',
      starter: `import heapq

def top_k(items, k, key):
    # TODO: use heapq.nlargest (it works on any iterable and never sorts everything), or build a heap of size k
    return []
`,
      tests: `calls = []
def key(x):
    calls.append(x)
    return x["amount"]

orders = [{"id": 1, "amount": 50}, {"id": 2, "amount": 90}, {"id": 3, "amount": 70}, {"id": 4, "amount": 90}, {"id": 5, "amount": 10}]
result = top_k(iter(orders), 3, key)
assert [o["id"] for o in result] == [2, 4, 3], result
assert len(calls) == len(orders), "key must be called exactly once per item"
assert top_k(orders, 0, lambda o: o["amount"]) == []
assert top_k(orders, -2, lambda o: o["amount"]) == []
assert [o["id"] for o in top_k(orders, 99, lambda o: o["amount"])] == [2, 4, 3, 1, 5]
assert top_k([], 3, lambda x: x) == []
assert top_k((x for x in [5, 1, 9, 3]), 2, lambda x: x) == [9, 5]
assert top_k(["pear", "fig", "banana", "kiwi"], 2, len) == ["banana", "pear"]
big = (i * 7919 % 100003 for i in range(100000))
best = top_k(big, 3, lambda x: x)
assert best == sorted(best, reverse=True) and len(best) == 3`,
      solution: `import heapq

def top_k(items, k, key):
    if k <= 0:
        return []
    return heapq.nlargest(k, items, key=key)
`,
      hint: '`heapq.nlargest(k, iterable, key=key)` does exactly this: it keeps only `k` candidates in a heap, returns them from largest to smallest, keeps the original order for equal keys, and calls `key` once per item. Handle `k <= 0` yourself first.',
    } },
    { pychallenge: {
      id: 'python-algorithms-de-ch4',
      prompt: 'Write `summarise_log(lines)`. A good line looks like `2026-09-30 03:15:41 ERROR db: connection reset` (date, time, UPPER-CASE level, a component name made of letters, digits, `_`, `.`, a colon and a space, then the message). Skip blank lines (not counted). Count a non-matching line in `bad_lines`. Return a dict with `levels` (a dict level -> count), `errors_by_component` (a list of `(component, count)` for lines with level ERROR or CRITICAL, sorted by count descending and then by component name), `bad_lines` (an int) and `first_error` (the timestamp text `"2026-09-30 03:15:41"` of the first ERROR or CRITICAL line, or `None`).',
      starter: `import re
from collections import Counter

LINE = re.compile(r"(?P<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) (?P<level>[A-Z]+) (?P<component>[\\w.]+): (?P<message>.*)")

def summarise_log(lines):
    # TODO: loop over the lines; skip blanks; match LINE; count levels, errors per component, bad lines
    return {"levels": {}, "errors_by_component": [], "bad_lines": 0, "first_error": None}
`,
      tests: `lines = [
    "2026-09-30 02:00:01 INFO loader: started",
    "2026-09-30 02:00:04 INFO loader: loaded 612 rows in 3.2s",
    "2026-09-30 02:00:09 ERROR api: GET /rates failed with HTTP 503",
    "",
    "this is not a log line",
    "2026-09-30 02:00:11 ERROR api: GET /rates failed with HTTP 503",
    "2026-09-30 03:15:41 ERROR db.pool: connection reset",
    "2026-09-30 04:02:10 CRITICAL scheduler: job overran",
    "   ",
    "2026-09-30 04:03:00 WARNING validator: 4 unbalanced",
    "2026-09-30 04:03:01 info lower: not an upper-case level",
]
result = summarise_log(lines)
assert result["levels"] == {"INFO": 2, "ERROR": 3, "CRITICAL": 1, "WARNING": 1}, result["levels"]
assert result["errors_by_component"] == [("api", 2), ("db.pool", 1), ("scheduler", 1)], result["errors_by_component"]
assert result["bad_lines"] == 2, result["bad_lines"]
assert result["first_error"] == "2026-09-30 02:00:09", result["first_error"]

empty = summarise_log([])
assert empty == {"levels": {}, "errors_by_component": [], "bad_lines": 0, "first_error": None}
only_info = summarise_log(["2026-09-30 02:00:01 INFO loader: ok"])
assert only_info["first_error"] is None and only_info["errors_by_component"] == []
tie = summarise_log(["2026-01-01 00:00:00 ERROR b: x", "2026-01-01 00:00:01 ERROR a: y"])
assert tie["errors_by_component"] == [("a", 1), ("b", 1)]
assert isinstance(tie["bad_lines"], int)
stream = summarise_log(iter(lines))
assert stream == result`,
      solution: `import re
from collections import Counter

LINE = re.compile(r"(?P<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) (?P<level>[A-Z]+) (?P<component>[\\w.]+): (?P<message>.*)")

def summarise_log(lines):
    levels, errors, bad, first_error = Counter(), Counter(), 0, None
    for line in lines:
        if not line.strip():
            continue
        m = LINE.fullmatch(line)
        if not m:
            bad += 1
            continue
        levels[m["level"]] += 1
        if m["level"] in ("ERROR", "CRITICAL"):
            errors[m["component"]] += 1
            if first_error is None:
                first_error = m["ts"]
    ranked = sorted(errors.items(), key=lambda item: (-item[1], item[0]))
    return {"levels": dict(levels), "errors_by_component": ranked, "bad_lines": bad, "first_error": first_error}
`,
      hint: 'Loop over the lines: skip them when `not line.strip()`. Use `LINE.fullmatch(line)`; a `None` result adds one to `bad`. Count `m["level"]` in a Counter; for ERROR and CRITICAL also count `m["component"]` and remember the first `m["ts"]`. Sort the error counts with `key=lambda item: (-item[1], item[0])` and return `dict(levels)` for the levels.',
    } },
    { real: 'These patterns are the vocabulary of everyday data work, not only of interviews. The two-pointer merge is how a reconciliation walks two sorted extracts. A hash map is the join inside a pandas merge and the dedupe inside a loader. Merge intervals is the SCD2 and rate-validity check. A heap gives top-N without sorting a table. `bisect` is the as-of lookup of an FX rate or a tax slab. BFS is the employee or account hierarchy and the order of tasks in a pipeline. And log parsing is what you do at 2 a.m. when a job fails. If you can name the pattern, say its cost, and write it in ten lines, you have the skill that both the interview and the job reward.' },
    { interview: `**"Find two numbers in a list that add up to a target."**
Model answer: "The brute force checks every pair, which is O(n squared). Instead I scan once and keep a dictionary of the numbers I have seen. For each number I look up target minus the number: if it is in the dictionary I have the pair. That is O(n) time and O(n) space. I use integers for money, and I decide what to return when there is no pair, here \`None\`."

**"Merge overlapping intervals."** "Sort by start time, then walk once. If the next interval starts at or before the end of the current one they overlap, so I extend the end to the larger of the two; otherwise I start a new one. Sorting dominates, so it is O(n log n). I ask whether touching intervals count as overlapping. It is the same idea as checking an SCD2 table for overlaps and gaps."

**"Top 3 earners per department."** "Sort by department and by salary descending, then group by department and take the first three of each group; or use a heap of size 3 per group for O(n log 3). In SQL it is ROW_NUMBER over a partition. I mention ties and how I would break them."

**"How do you process a huge log file?"** "Stream it line by line with a generator, parse each line with a compiled regular expression using named groups, count bad lines instead of crashing, and keep only counters. Memory stays flat, whatever the file size."

**"What is the complexity of your solution?"** "I say it for both time and space, and explain the dominant part: for example a sort of n items is O(n log n), a pass over the sorted data is O(n), a dictionary lookup is O(1) on average, so overall O(n log n) time and O(n) space."` },
    `## Recap
- Read the **shape of the problem**: count, group, dedupe or look up means **dict, set, Counter, defaultdict** (O(1) each); ranges and "in order" mean **sort first, then one pass** (O(n log n)); sorted pairs or merging mean **two pointers** (O(n)); "last k" means a **sliding window** with a \`deque\`; top-k and merging sorted streams mean **\`heapq\`** (O(n log k)); a position in sorted data means **\`bisect\`** (O(log n)); hierarchies mean **BFS or DFS** with a visited set.
- **Two-sum** with a dict of seen values; **merge intervals** by sorting by start and extending the last interval; **effective-date lookup** is \`bisect_right - 1\`, and it needs an age check; the **employee tree** is an adjacency dict plus a queue.
- **Parse text defensively**: \`csv\` module, one compiled regex with named groups, count bad lines, skip blanks, stream the file, keep counters.
- Compare money as **integers or Decimal**, do not mutate inputs, handle **empty input, duplicates and no answer**, and **say the cost** of the slow way and the fast way.`,
  ],
  quiz: [
    { q: 'What is the time cost of the dictionary solution to two-sum, compared with the nested-loop solution?', o: ['O(n) versus O(n squared)', 'O(n squared) versus O(n)', 'both O(n)', 'O(log n) versus O(n)'], a: 0, why: 'The dictionary version scans once and does a constant-time lookup per item. The nested loop compares every pair.' },
    { q: 'What is the first step of the merge-intervals algorithm?', o: ['put the intervals in a dictionary', 'sort the intervals by start', 'compute their average length', 'reverse the list'], a: 1, why: 'After sorting by start, any interval that overlaps the current one is next in line, so one pass is enough.' },
    { q: 'You need the 10 largest orders from 50 million rows. Which is the better approach?', o: ['sort all 50 million rows and take 10', 'load them into a list and use `max` ten times', 'use a nested loop', '`heapq.nlargest(10, rows, key=...)`, which keeps only 10 candidates'], a: 3, why: 'A heap of size k gives O(n log k) time and O(k) memory, and it works on a stream. A full sort does far more work and needs all rows in memory.' },
    { q: 'You use `bisect_right(starts, day) - 1` to find the FX rate for a date and the February rate is missing. What happens?', o: ['it raises KeyError', 'it returns None', 'it returns the January rate without any warning, so you must also check how old the rate is', 'it returns the March rate'], a: 2, why: 'bisect finds the latest start on or before the date, so a missing month silently falls back to an older one. The caller has to check the age.' },
    { q: 'Why is `collections.deque` better than a list for a sliding window or a queue?', o: ['it uses less memory per item', 'it keeps items sorted', '`popleft()` is O(1) while `list.pop(0)` is O(n)', 'it cannot hold duplicates'], a: 2, why: 'Removing from the front of a list shifts every other item. A deque removes from either end in constant time.' },
    { q: 'A log has blank lines and lines that are not log lines at all. What is the best way to handle them?', o: ['crash so the problem is visible', 'skip blank lines, count the non-matching ones as bad lines, and report the count', 'delete them from the file', 'treat them as ERROR lines'], a: 1, why: 'Real logs are messy. A parser must not crash, and it must not hide problems either: count the bad lines and say how many there were.' },
  ],
  task: {
    title: 'A small toolkit repo with tests, run on the Kollana data',
    steps: [
      'In `C:\\fde\\py-recap` create `toolkit.py` with `two_sum`, `merge_intervals`, `top_k` and `summarise_log` (challenges 1 to 4) and `test_toolkit.py` with at least five `assert` cases for each, including empty input and duplicates. Run it with `pytest` or with plain Python.',
      'Use `two_sum` on the `gst_amount` column of `purchase_register.csv` in paise to find two invoices that add up to a number you choose, and explain the cost of the slow and the fast way in a comment.',
      'Build `reconcile_sorted(a, b)` with two pointers that returns the three lists (in both, only in a, only in b) and run it on the invoice numbers of `purchase_register.csv` and `supplier_invoices.csv`. Compare the counts with your SQL reconciliation result from the SQL phase.',
      'Write `check_effective_dates(rows)` for `(key, start, end)` rows that reports overlaps and gaps (half-open or closed: state your choice) and test it on the employee 6 department history you used in the SQL phase.',
      'Write `rate_on(currency, day, max_age_days=40)` with `bisect` that raises `LookupError` when the best rate is older than the limit. Show that it catches the missing SGD rate of February 2026 and accepts USD for every day of FY2025-26.',
      'Parse a log file that your own earlier job wrote (`run.log` from the Logging lesson) with `summarise_log`. Print the levels, the errors per component and the first error, and write two sentences about how you treated bad lines.',
    ],
    deliverable: '`toolkit.py`, `test_toolkit.py` (all passing), the reconciliation counts, and the output on your own `run.log`.',
  },
};
