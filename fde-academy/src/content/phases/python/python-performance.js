export default {
  id: 'python-performance',
  title: 'Profiling and performance',
  goal: 'You can measure before you optimise (perf_counter, timeit, cProfile, tracemalloc), read Big-O in practice, replace the usual slow patterns (list lookups, nested loops, row-by-row work) with fast ones, and keep memory flat with generators.',
  roadmap: ['cProfile', 'timeit', 'memory profiling', 'Big-O in practice', 'generators vs lists'],
  blocks: [
    `## The problem
"My script is slow." On the test file of 500 rows it takes a second. On the real file of 500,000 rows it runs all night and nobody knows why. The tempting move is to guess ("it must be the CSV reading") and start changing code. Most of the time the guess is wrong, and the real cause is one line that nobody suspected.

Two rules from experienced engineers:
1. **Measure first.** Programs spend most of their time in a very small part of the code. Speeding up the other 90 percent changes nothing.
2. **Fix the biggest cause first, then measure again.** Optimise in a loop of *measure, change one thing, measure*. A change that no measurement supports is a risk without a benefit.

In this lesson you get the measuring tools that ship with Python (\`time\`, \`timeit\`, \`cProfile\`, \`tracemalloc\`), the idea of **Big-O** in plain words, and the short list of fixes that solve most real problems. All the measurements below run in your browser, and we always talk about **ratios** ("30 times faster"), never absolute seconds, because the seconds depend on the computer.`,
    `## Measure: time, timeit, cProfile, tracemalloc
| Tool | Question it answers | Use it when |
|---|---|---|
| \`time.perf_counter()\` | "How long did this whole step take?" | a quick check of a job or a stage |
| \`timeit\` | "Which of these two small snippets is faster?" | comparing two ways of doing one thing |
| \`cProfile\` + \`pstats\` | "Which **functions** eat the time?" | the program is slow and you do not know where |
| \`tracemalloc\` | "How much **memory** did this use at its peak?" | the program crashes or swaps on big data |

**\`timeit\`** runs a snippet many times, because one run is too short and noisy to trust. Run several repeats and take the **minimum**: the minimum is the run that was disturbed least by other programs on your PC.

**\`cProfile\`** records every function call. Its report has these columns: \`ncalls\` (how many calls), \`tottime\` (time inside the function itself, without the functions it called), \`cumtime\` (time including everything it called). Sort by \`cumtime\` to find the **big branch**, and by \`tottime\` to find the **hot function**. Two warnings: profiling slows the program a little, and a function with a huge \`ncalls\` is a suspect even if each call is fast.

**\`tracemalloc\`** tracks memory that Python allocates. \`tracemalloc.get_traced_memory()\` returns the current and the **peak** use. (\`sys.getsizeof(x)\` is *shallow*: for a list it counts the list itself, not the objects inside.)

On your laptop, two more tools are worth knowing by name: \`line_profiler\` (time per **line**) and \`py-spy\` (looks into a program that is already running without changing it). Check the current documentation for how to install them.`,
    { sketch: { w: 760, h: 296, caption: 'Optimise in a loop: measure, find the biggest cause, change one thing, measure again', items: [
      { t: 'box', x: 14, y: 36, w: 214, h: 62, label: '1. measure', sub: 'perf_counter, timeit', fill: 'blue' },
      { t: 'arrow', x1: 232, y1: 67, x2: 278, y2: 67 },
      { t: 'box', x: 282, y: 36, w: 214, h: 62, label: '2. profile', sub: 'cProfile: where is the time?', fill: 'yellow' },
      { t: 'arrow', x1: 389, y1: 102, x2: 389, y2: 156 },
      { t: 'box', x: 282, y: 160, w: 214, h: 62, label: '3. fix the biggest cause', sub: 'only ONE change', fill: 'green' },
      { t: 'arrow', x1: 278, y1: 191, x2: 232, y2: 191 },
      { t: 'box', x: 14, y: 160, w: 214, h: 62, label: '4. measure again', sub: 'faster? keep it. no? undo it.', fill: 'pink' },
      { t: 'arrow', x1: 121, y1: 156, x2: 121, y2: 102, dashed: true, label: 'repeat', lx: 24, ly: 0 },
      { t: 'note', x: 520, y: 30, w: 226, h: 196, fill: 'grey', size: 13, text: 'Fixes that usually pay most,\nin this order:\n1. a better algorithm or\n    data structure\n2. read and keep less data\n3. batch the I/O\n4. vectorise (pandas) or push\n    the work into SQL\n5. only then: parallel code' },
      { t: 'note', x: 14, y: 244, w: 732, h: 40, fill: 'yellow', size: 14, text: 'A change that no measurement supports is a risk without a benefit. Readable code first, fast code where the profile points.' },
    ] } },
    { py: {
      title: 'timeit: the same job done two ways, compared as ratios',
      starter: `import timeit
from collections import deque

def best(stmt, number, repeat=3, **env):
    """Seconds per run: the minimum of several repeats. 'number' runs per repeat, big enough
    that one repeat lasts many milliseconds (a browser clock is too coarse for tiny times)."""
    return min(timeit.repeat(stmt, number=number, repeat=repeat, globals=env)) / number

def ratio(slow, fast):
    return slow / fast if fast > 0 else float("inf")

# 1. is this invoice number in the list? list versus set
invoices = [f"INV/{i:06d}" for i in range(20_000)]
invoice_set = set(invoices)
target = invoices[-1]                                   # the worst case for a list: it must scan everything
t_list = best("target in invoices", number=100, invoices=invoices, target=target)
t_set = best("target in invoice_set", number=300_000, invoice_set=invoice_set, target=target)
print(f"list lookup versus set lookup : set is {ratio(t_list, t_set):,.0f}x faster")

# 2. take items from the FRONT of a queue: list.pop(0) versus deque.popleft()
def drain_list(n):
    items = list(range(n))
    while items:
        items.pop(0)                                    # every pop shifts all remaining items

def drain_deque(n):
    items = deque(range(n))
    while items:
        items.popleft()                                 # constant time

t_pop = best("drain_list(20000)", number=3, drain_list=drain_list)
t_dq = best("drain_deque(20000)", number=20, drain_deque=drain_deque)
print(f"list.pop(0) versus deque       : deque is {ratio(t_pop, t_dq):,.1f}x faster")

# 3. match 1000 invoices to 1000 payments: nested loop versus dict lookup
left = [f"INV/{i}" for i in range(1000)]
right = [f"INV/{i}" for i in range(1000)]
def nested_loops():
    return sum(1 for a in left for b in right if a == b)
def with_dict():
    index = set(right)
    return sum(1 for a in left if a in index)
assert nested_loops() == with_dict() == 1000            # same answer, very different cost
t_nested = best("nested_loops()", number=1, nested_loops=nested_loops)
t_dict = best("with_dict()", number=200, with_dict=with_dict)
print(f"nested loops versus a set      : the set version is {ratio(t_nested, t_dict):,.0f}x faster")

# 4. built-ins run in C: sum() versus a hand-written loop
numbers = list(range(100_000))
def manual():
    total = 0
    for n in numbers:
        total += n
    return total
t_manual = best("manual()", number=10, manual=manual)
t_sum = best("sum(numbers)", number=100, numbers=numbers)
print(f"loop versus built-in sum       : sum() is {ratio(t_manual, t_sum):,.1f}x faster")`,
      note: 'Your ratios will differ from the next person\'s, but the order of magnitude will be the same: a set beats a list lookup by hundreds or thousands of times, a nested loop loses to a hash lookup by a huge factor, and deque beats pop(0). These are not tricks: each one changes the amount of work from "grows with the data" to "does not". The first two lines are the single most common performance fix in reconciliation scripts.',
    } },
    `## Big-O in plain words
**Big-O** describes how the work **grows when the data grows**. It ignores small constants. You only need these:

| Name | Plain meaning | Example |
|---|---|---|
| **O(1)** | the same work, however big the data | dict or set lookup, \`list[i]\`, \`append\` |
| **O(log n)** | the work grows very slowly: doubling the data adds one step | binary search in a sorted list (\`bisect\`) |
| **O(n)** | work grows in step with the data | one pass over a list, \`x in list\`, \`sum\` |
| **O(n log n)** | a bit more than one pass | sorting |
| **O(n squared)** | double the data, four times the work | a loop inside a loop over the same data |

The table below shows why it matters. A nested loop that is instant on 1,000 rows needs **ten billion steps** for 100,000 rows. That is the difference between "works on my test file" and "never finishes in production".

**How to spot the usual culprits**
- \`x in some_list\` or \`some_list.index(x)\` inside a loop: an **O(n) lookup inside an O(n) loop**. Make the list a set or dict first.
- A loop inside a loop that compares every row of A with every row of B: that is a join done by brute force. Build a **dict from one side** (a *hash join*, exactly what a database does) and look up from the other.
- \`list.pop(0)\`, \`list.insert(0, x)\` and \`x in list\` are O(n). Use \`collections.deque\` for queues, \`set\` for membership.
- Rebuilding the same value on every pass of a loop (opening a file, compiling a regex, looking up a master list). Move it **out of the loop**, or cache it with \`lru_cache\`.
- Sorting inside a loop. Sort once, then use \`bisect\` for look-ups in a sorted list.
- Row-by-row work where a **set-based** operation exists: one SQL statement or one pandas expression instead of a Python loop with a database call per row (a classic: 100,000 single-row \`INSERT\`s instead of one bulk load).`,
    { sketch: { w: 760, h: 258, caption: 'How the work grows with the data: the last column is why a nested loop never finishes on real data', items: [
      { t: 'table', x: 14, y: 40, title: 'steps needed for n items (rounded)', cols: ['n items', 'binary search', 'one pass', 'sort', 'nested loop'], colW: [120, 140, 140, 150, 180], rows: [['1,000', '10', '1,000', '10 thousand', '1 million'], ['100,000', '17', '100,000', '1.7 million', '10 billion'], ['1,000,000', '20', '1 million', '20 million', '1 trillion']], rowH: 30, hl: [1] },
      { t: 'note', x: 14, y: 170, w: 360, h: 74, fill: 'green', size: 13, text: 'Fine at any size: one pass, sort, set or\ndict lookup, binary search. Their curve\nstays gentle when the data gets 1000 times bigger.' },
      { t: 'note', x: 392, y: 170, w: 354, h: 74, fill: 'pink', size: 13, text: 'Not fine: a loop inside a loop over the\nsame data. 1000 times more rows means\na MILLION times more work.' },
    ] } },
    { py: {
      title: 'Big-O by counting steps (exact numbers, no clock)',
      starter: `def linear_search(items, target):
    steps = 0
    for item in items:
        steps += 1
        if item == target:
            break
    return steps

def binary_search(items, target):          # items must be sorted
    low, high, steps = 0, len(items) - 1, 0
    while low <= high:
        steps += 1
        mid = (low + high) // 2
        if items[mid] == target:
            break
        if items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return steps

def nested_loop_matches(a, b):
    steps = 0
    for x in a:
        for y in b:                        # every x is compared with every y
            steps += 1
    return steps

def set_matches(a, b):
    steps = 0
    index = set()
    for y in b:                            # n steps to build the index ...
        index.add(y)
        steps += 1
    for x in a:                            # ... then ONE step per lookup
        steps += 1
        x in index
    return steps

print("looking for the LAST item of a sorted list")
print(f"{'n':>9} | {'linear search':>14} | {'binary search':>14}")
for n in (1_000, 10_000, 100_000):
    items = list(range(n))
    print(f"{n:>9,} | {linear_search(items, n - 1):>14,} | {binary_search(items, n - 1):>14,}")

print()
print("matching n invoices against n payments")
print(f"{'n':>9} | {'nested loop':>14} | {'set lookups':>14}")
for n in (100, 200, 400, 800):
    print(f"{n:>9,} | {nested_loop_matches(range(n), range(n)):>14,} | {set_matches(range(n), range(n)):>14,}")`,
      note: 'Every number is a count of steps, so they are the same on every computer. Linear search grows in step with n: ten times more data, ten times more steps. Binary search adds only about three steps for ten times more data. In the second table, doubling n doubles the set steps but multiplies the nested-loop steps by four. Keep doubling and the nested loop soon becomes impossible: at 100,000 rows it would need ten billion steps.',
    } },
    { py: {
      title: 'cProfile: find the hot function in a slow reconciliation, fix it, profile again',
      starter: `import cProfile
import io
import pstats

books = [f"INV/{i:05d}" for i in range(3000)]                 # invoices in our books
bank = [f"INV/{i:05d}" for i in range(1500, 4500)]            # payments reported by the bank

def is_paid(invoice, payments):
    return invoice in payments                                # a list lookup: scans the list each time

def reconcile_slow():
    return [inv for inv in books if is_paid(inv, bank)]       # bank is a LIST

def reconcile_fast():
    paid = set(bank)                                          # build the set ONCE
    return [inv for inv in books if is_paid(inv, paid)]       # the same function, now a set lookup

def profile(func):
    profiler = cProfile.Profile()
    profiler.enable()
    result = func()
    profiler.disable()
    out = io.StringIO()
    pstats.Stats(profiler, stream=out).strip_dirs().sort_stats("cumulative").print_stats(4)
    return result, out.getvalue()

slow_result, slow_report = profile(reconcile_slow)
print(slow_report)

fast_result, fast_report = profile(reconcile_fast)
print(fast_report)
print("same answer:", slow_result == fast_result, "|", len(slow_result), "invoices matched")`,
      note: 'How to read it: the line for is_paid shows ncalls = 3000, one call per invoice. In the slow run almost all the cumulative time sits in that one function (or in the built-in call that scans the list), which tells you exactly where to look. After switching the list to a set, the same function is called the same number of times, but each call is cheap. The seconds printed are specific to your machine; compare the two reports with each other, not with anyone else\'s.',
    } },
    `## Memory: keep it flat
Running out of memory is a different problem from running slowly, and the cure is usually the same idea you met in the generators lesson: **do not hold all the rows at once**.
- **Stream and aggregate.** If you only need a total per entity, read row by row and keep a small dict of totals. Do not build a list of a million dicts first.
- **Choose a lighter row.** A dict per row is the heaviest option, a tuple is lighter, and a class with \`__slots__\` (or a dataclass with \`slots=True\`) sits in between with named fields.
- **Read only what you need.** With \`csv\` pick the columns you use; with pandas use \`usecols=\`, \`dtype=\` and \`chunksize=\`.
- **Release big objects** you no longer need (\`del big\`) before you build the next one.
- Use \`tracemalloc\` to **measure the peak**, not your guess.`,
    { py: {
      title: 'tracemalloc: how much memory does the same data need?',
      starter: `import tracemalloc
from dataclasses import dataclass

N = 50_000

@dataclass(slots=True)
class Line:
    gl_id: int
    account: int
    amount: float

def peak_bytes(build):
    tracemalloc.start()
    data = build()                                    # keep the result alive, so it is counted
    peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    del data
    return peak

as_dicts = peak_bytes(lambda: [{"gl_id": i, "account": 6000 + i % 12, "amount": i * 1.5} for i in range(N)])
as_tuples = peak_bytes(lambda: [(i, 6000 + i % 12, i * 1.5) for i in range(N)])
as_slots = peak_bytes(lambda: [Line(i, 6000 + i % 12, i * 1.5) for i in range(N)])
print(f"dict rows : {as_dicts / as_tuples:.1f}x the memory of tuples")
print(f"slots rows: {as_slots / as_tuples:.1f}x the memory of tuples")

# stream and aggregate: a total per account without ever holding the rows
def stream_total():
    totals = {}
    for i in range(N):                                # imagine this reading a file line by line
        account = 6000 + i % 12
        totals[account] = totals.get(account, 0.0) + i * 1.5
    return totals

streamed = peak_bytes(stream_total)
print(f"streaming : {as_dicts / streamed:,.0f}x less memory than building the list of dicts")

import sys
small = [1, 2, 3]
big_inside = [list(range(1000)) for _ in range(3)]
print("getsizeof is shallow:", sys.getsizeof(small) == sys.getsizeof([0, 0, 0]),
      "| three lists of 1000 numbers report only", sys.getsizeof(big_inside), "bytes for the outer list")`,
      note: 'The exact ratios depend on the Python version, but the ordering does not: dicts cost the most, tuples the least, slots classes sit in the middle with readable field names. The streaming version keeps only twelve totals, so its memory is tiny and does not grow with the number of rows. getsizeof counts the outer list only, not the numbers inside, so use tracemalloc for the real picture.',
    } },
    { local: `**Profile a real script.** Any script can be profiled without changing it:
\`\`\`powershell
python -m cProfile -s cumulative reconcile.py | more
python -m cProfile -o run.prof reconcile.py
python -m pstats run.prof
\`\`\`
At the \`pstats\` prompt type \`sort cumulative\` then \`stats 15\`. For a picture, \`pip install snakeviz\` and run \`snakeviz run.prof\`, which opens a browser page with a flame chart (check the current documentation for its options). To time a snippet from the command line: \`python -m timeit -s "s = set(range(20000))" "19999 in s"\`.

For memory, \`python -X tracemalloc=5 script.py\` keeps the call stacks of the allocations, and inside the code \`tracemalloc.take_snapshot().statistics("lineno")[:10]\` shows the ten lines that allocated the most.

**Habit for Project A:** after every big change, run the month-end job on the large synthetic file and write down the time of each stage in the README (a small table: stage, before, after). It shows you improved something with evidence, which is exactly what an interviewer wants to hear.` },
    { warn: `Things that go wrong with performance work:
- **Optimising without measuring.** You make code harder to read and the program no faster.
- **Timing one run.** Noise from other programs is large. Repeat and take the minimum, or use \`timeit\`.
- **Profiling the wrong data.** A test file of 500 rows hides an O(n squared) problem. Profile with data of realistic size.
- **Timing the first call.** Caches, imports and disk reads make the first run slower. Warm up, then measure.
- **Micro-optimising.** Saving a few nanoseconds in a loop that runs once is pointless. Look for **algorithm** problems first.
- **\`x in list\` in a loop**, nested loops over the same data, and row-by-row database calls. The three most common real causes.
- **Holding every row in memory** "to be safe". Stream, aggregate, and write in batches.
- **Comparing absolute times between computers.** Compare ratios on the same machine.
- **Giving up readability for a 5 percent gain.** Keep the clear version unless the profile says the spot matters.` },
    { pychallenge: {
      id: 'python-performance-ch1',
      prompt: 'Write `find_duplicates(rows, key)`. `key(row)` returns the key of a row (an object that supports `==`, hashing and `<`). Return a **sorted list of the keys that appear more than once**, each key once. It must be fast: the tests count how often `==` is called on the keys, and a list-based "have I seen this?" check will call it far too often. Use a `set` or a `Counter`.',
      starter: `def find_duplicates(rows, key):
    # TODO: one pass over the rows; use a set / Counter so lookups do not scan a list
    return []
`,
      tests: `class K:
    eq_calls = 0
    def __init__(self, v):
        self.v = v
    def __eq__(self, other):
        K.eq_calls += 1
        return self.v == other.v
    def __hash__(self):
        return hash(self.v)
    def __lt__(self, other):
        return self.v < other.v

rows = [{"inv": "A"}, {"inv": "B"}, {"inv": "A"}, {"inv": "C"}, {"inv": "B"}, {"inv": "B"}, {"inv": "D"}]
result = find_duplicates(rows, key=lambda r: r["inv"])
assert result == ["A", "B"], result
assert find_duplicates([], key=lambda r: r) == []
assert find_duplicates([{"inv": "X"}], key=lambda r: r["inv"]) == []

big = [{"inv": f"INV/{i % 600}"} for i in range(1200)]       # 600 keys, each twice
K.eq_calls = 0
dups = find_duplicates(big, key=lambda r: K(r["inv"]))
assert [k.v for k in dups] == sorted(f"INV/{i}" for i in range(600)), "wrong duplicates"
assert K.eq_calls < 5000, f"too slow: {K.eq_calls} comparisons (use a set or Counter)"`,
      solution: `from collections import Counter

def find_duplicates(rows, key):
    counts = Counter(key(row) for row in rows)
    return sorted(k for k, n in counts.items() if n > 1)
`,
      hint: 'Count how often each key occurs with `Counter(key(row) for row in rows)`, then return `sorted(k for k, n in counts.items() if n > 1)`. A Counter is a dict, so each lookup is one hash lookup and not a scan.',
    } },
    { pychallenge: {
      id: 'python-performance-ch2',
      prompt: 'Write `hash_join(left, right, key_left, key_right)`, an **inner join** of two lists of rows. Return a list of `(left_row, right_row)` pairs where `key_left(left_row) == key_right(right_row)`. Order: follow `left`; for one left row follow the order of `right`. A key may repeat on either side (many-to-many gives every combination). Rows without a match are left out. Build a **dict index** of the right side first: the tests count `==` calls and a nested loop will fail them.',
      starter: `def hash_join(left, right, key_left, key_right):
    # TODO: index the right side in a dict (key -> list of rows), then look up every left row
    return []
`,
      tests: `left = [{"inv": "A", "amt": 1}, {"inv": "B", "amt": 2}, {"inv": "A", "amt": 3}, {"inv": "Z", "amt": 9}]
right = [{"inv": "A", "paid": 10}, {"inv": "B", "paid": 20}, {"inv": "A", "paid": 30}, {"inv": "Q", "paid": 5}]
pairs = hash_join(left, right, key_left=lambda r: r["inv"], key_right=lambda r: r["inv"])
assert [(l["amt"], r["paid"]) for l, r in pairs] == [(1, 10), (1, 30), (2, 20), (3, 10), (3, 30)], pairs
assert hash_join([], right, lambda r: r["inv"], lambda r: r["inv"]) == []
assert hash_join(left, [], lambda r: r["inv"], lambda r: r["inv"]) == []

class K:
    eq_calls = 0
    def __init__(self, v):
        self.v = v
    def __eq__(self, other):
        K.eq_calls += 1
        return self.v == other.v
    def __hash__(self):
        return hash(self.v)

a = [{"k": i % 400} for i in range(1000)]
b = [{"k": (i * 7) % 400} for i in range(1000)]
from collections import Counter
ca, cb = Counter(r["k"] for r in a), Counter(r["k"] for r in b)
expected = sum(ca[k] * cb[k] for k in ca)
K.eq_calls = 0
big = hash_join(a, b, key_left=lambda r: K(r["k"]), key_right=lambda r: K(r["k"]))
assert len(big) == expected, (len(big), expected)
assert all(l["k"] == r["k"] for l, r in big)
assert K.eq_calls < 20000, f"too slow: {K.eq_calls} comparisons (index one side in a dict)"`,
      solution: `from collections import defaultdict

def hash_join(left, right, key_left, key_right):
    index = defaultdict(list)
    for row in right:
        index[key_right(row)].append(row)
    pairs = []
    for l in left:
        for r in index.get(key_left(l), ()):
            pairs.append((l, r))
    return pairs
`,
      hint: 'Build `index = defaultdict(list)` and for every right row do `index[key_right(row)].append(row)`. Then loop over the left rows and, for each, loop over `index.get(key_left(l), ())` and append `(l, r)`. The index keeps the right-side order inside each key.',
    } },
    { pychallenge: {
      id: 'python-performance-ch3',
      prompt: 'Write `totals_by_key(rows, key, value)`. `rows` is any iterable (it may be a generator of 100,000 rows). Return a dict `{key(row): sum of value(row)}`. It must make **one pass** and must **not build a list** of the rows: the test measures the peak memory with `tracemalloc` and the limit is small.',
      starter: `def totals_by_key(rows, key, value):
    # TODO: one loop over rows, adding value(row) into a dict of totals. Do not call list(rows).
    return {}
`,
      tests: `import tracemalloc

def rows(n):
    for i in range(n):
        yield {"entity": i % 3, "amount": i % 100}

assert totals_by_key([], key=lambda r: r, value=lambda r: 1) == {}
assert totals_by_key([{"k": "a", "v": 2}, {"k": "b", "v": 3}, {"k": "a", "v": 4}], key=lambda r: r["k"], value=lambda r: r["v"]) == {"a": 6, "b": 3}

expected = {}
for i in range(100_000):
    expected[i % 3] = expected.get(i % 3, 0) + i % 100

tracemalloc.start()
result = totals_by_key(rows(100_000), key=lambda r: r["entity"], value=lambda r: r["amount"])
peak = tracemalloc.get_traced_memory()[1]
tracemalloc.stop()
assert result == expected, result
assert peak < 500_000, f"peak memory {peak:,} bytes: do not hold all the rows"`,
      solution: `def totals_by_key(rows, key, value):
    totals = {}
    for row in rows:
        k = key(row)
        totals[k] = totals.get(k, 0) + value(row)
    return totals
`,
      hint: 'Make `totals = {}`. For each row compute `k = key(row)` and do `totals[k] = totals.get(k, 0) + value(row)`. Because the loop touches one row at a time and keeps only the small dict, memory stays flat.',
    } },
    { real: 'In real work three performance problems cover most cases. (1) **A lookup in a list** inside a loop: GST or bank reconciliation scripts that were fine for a month of data and stall on a year. The cure is almost always a set or a dict, or a hash join. (2) **Row-by-row database or API calls**: 50,000 single inserts, or one call per invoice. The cure is batching (`executemany`, `COPY`, a bulk endpoint). (3) **Loading everything**: a 4 GB export read into one list. The cure is streaming and aggregating, or `chunksize` in pandas. When you profile before you change anything, you can say in an interview "I measured, found X took 80 percent, changed it, and the stage went from slow to fast", and that is a much stronger story than "I made it faster".' },
    { interview: `**"How do you find out why a Python program is slow?"**
Model answer: "I measure first. I time the stages with \`perf_counter\`, then profile with \`cProfile\` and sort by cumulative time to find the function that dominates, and I use \`tracemalloc\` if memory is the problem. I use realistic data, change one thing at a time, and measure again. Most often the cause is an algorithm or data-structure problem, such as a list lookup in a loop, not the language itself."

**"What is the time complexity of \`x in list\` versus \`x in set\`?"** "O(n) for a list, because it scans, and O(1) on average for a set or dict, because it hashes. Inside a loop over n items that is the difference between O(n squared) and O(n). I convert the list to a set once, outside the loop."

**"How would you join two big lists of records in pure Python?"** "A hash join: build a dict from the smaller side keyed by the join key, then stream the other side and look up each key. That is O(n + m) instead of the O(n times m) of a nested loop, and it is what the database does too. If the data fits a DataFrame, \`merge\` does it."

**"Generators versus lists for big data?"** "A generator produces one item at a time, so memory stays flat and I can stream a file of any size. A list holds everything and allows indexing and re-reading. For one pass over big data I stream, and I can show the peak with \`tracemalloc\`."` },
    `## Recap
- **Measure before you change anything.** \`perf_counter\` for stages, \`timeit\` (take the minimum of repeats) for snippets, \`cProfile\` + \`pstats\` for the hot function (\`ncalls\`, \`tottime\`, \`cumtime\`), \`tracemalloc\` for peak memory. Compare **ratios**, not seconds.
- **Big-O** is how work grows with data: O(1) set or dict lookup, O(log n) binary search, O(n) one pass or \`x in list\`, O(n log n) sort, **O(n squared)** a loop inside a loop. 1000 times more data means a million times more work for the last one.
- The usual fixes: **set or dict** instead of list lookup, **hash join** instead of nested loops, **deque** instead of \`pop(0)\`, move work **out of loops**, cache pure calls, **batch** I/O, **vectorise** or push to SQL.
- **Memory:** stream and aggregate, use lighter rows (tuple, \`slots\`), read only the columns you need, and measure the peak with \`tracemalloc\`. \`getsizeof\` is shallow.
- Work in a loop: measure, profile, change **one** thing, measure again. Keep the clear code unless the profile says the spot matters.`,
  ],
  quiz: [
    { q: 'Your script is slow and you do not know why. What is the best first step?', o: ['run a profiler such as cProfile on realistic data and read where the time goes', 'rewrite the main loop in a "faster" style', 'add threads to everything', 'buy more memory'], a: 0, why: 'Guessing usually targets the wrong code. A profile shows which functions take the time, so you fix the real cause.' },
    { q: 'You loop over 100,000 invoices and for each one write `if inv in bank_list:`. What is the problem and the fix?', o: ['nothing: lists are fast', 'each check scans the whole list, so the loop is O(n squared); convert `bank_list` to a set once, outside the loop', 'the loop should be written as recursion', 'use `sorted` inside the loop'], a: 1, why: '`in` on a list scans every item. A set looks the value up by hash in about one step, which turns the nested work into one pass.' },
    { q: 'A function has a huge `ncalls` in the cProfile output but each call is very cheap. Why still look at it?', o: ['it never matters, cheap calls are always fine', 'cProfile counts calls wrongly', 'it means the function has a bug', 'many cheap calls can add up to most of the run time, so it can be the real hot spot'], a: 3, why: 'Total cost is calls times cost per call. A function called millions of times is a common hot spot and a good candidate for caching, hoisting or batching.' },
    { q: 'For 100 times more data, how does the work of an O(n squared) nested loop grow?', o: ['100 times', '10 times', '10,000 times', 'about the same'], a: 2, why: 'Squared growth multiplies the work by 100 times 100, which is 10,000. That is why brute-force joins fail on real files.' },
    { q: 'You need the total amount per entity from a 4 GB CSV. Which approach keeps memory flat?', o: ['read all rows into a list of dicts, then total them', 'read the file into a pandas DataFrame without options', 'read row by row and keep only a small dict of totals', 'copy the file twice to be safe'], a: 2, why: 'Streaming and aggregating holds one row and a few totals at any moment. The other options hold the whole file in memory.' },
    { q: 'Why do you take the MINIMUM of several `timeit` repeats?', o: ['it is the fastest result, so it makes your code look good', 'other programs on the computer can only slow a run down, so the minimum is the least disturbed measurement', 'the maximum is always wrong', 'timeit cannot return an average'], a: 1, why: 'Noise from the operating system only adds time. The smallest of several repeats is closest to the true cost of the code itself.' },
  ],
  task: {
    title: 'Profile and speed up a reconciliation, with a before and after table',
    steps: [
      'In `C:\\fde\\py-recap` create `perf_practice.py`. It needs `purchase_register.csv` and `supplier_invoices.csv` (exported in the *Comprehensions and control flow* task).',
      'Build a bigger test: repeat the 30 purchase-register rows with new invoice numbers until you have 20,000 "books" rows, and the same for 20,000 "supplier" rows with 5,000 of them missing.',
      'Write `reconcile_slow(books, supplier)` with a nested loop (or `in` on a list). Time it with `perf_counter` on 2,000 rows only (it is slow), then profile it with `python -m cProfile -s cumulative perf_practice.py`.',
      'Write `reconcile_fast` with a set or a hash join and check that both give the same result on the 2,000 rows. Run the fast version on all 20,000 rows.',
      'Use `tracemalloc` to compare the peak memory of loading the 20,000 rows as dicts, as tuples and as a generator that only counts matches.',
      'Write a small table in a comment: version, rows, time, peak memory, and the ratio. Add one sentence that explains the Big-O change you made.',
    ],
    deliverable: '`perf_practice.py` with both versions, the cProfile top lines of the slow one, and the before and after table.',
  },
};
