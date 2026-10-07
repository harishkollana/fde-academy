export default {
  id: 'python-iterators-generators',
  title: 'Iterators and generators',
  goal: 'You can explain iterables and iterators, write generator functions and expressions, build lazy pipelines that process one row at a time, use itertools, and handle a file that is bigger than memory.',
  roadmap: ['iterators and the iteration protocol', 'generators and yield', 'generator expressions', 'itertools', 'processing a file bigger than memory'],
  blocks: [
    `## The problem
Your bank sends a statement of three million lines, a 4 GB CSV. You write the obvious code: \`rows = list(csv.DictReader(f))\`. The laptop slows down, the fan screams, and Python dies with \`MemoryError\`. Excel would have refused the file long ago.

The data was never the problem. The problem is that you asked for **all rows at once**. To total a column you need only **one row at a time**: read a row, add its amount, forget the row, read the next. Python has a built-in way to work like that, called *lazy evaluation*: values are produced **only when someone asks for the next one**.

The tools are *iterators* (the objects that hand out values one by one) and *generators* (the easy way to write them). With them you can process a file of any size using almost no memory, build clean "read, clean, validate, load" pipelines, and even work with endless streams. This is the idea behind every data pipeline tool you will meet later.`,
    `## Iterable and iterator: two different things
You have used \`for\` loops since lesson one. Here is what really happens inside one.
- An **iterable** is anything you can loop over: a list, a string, a dict, a file, a \`range\`. It can give you an *iterator* when asked: \`iter(x)\`.
- An **iterator** is the object that actually walks. It remembers **where it is** (like a bookmark) and has a \`__next__\` method. Calling \`next(it)\` returns the next value and moves the bookmark. When nothing is left it raises \`StopIteration\`.

A \`for\` loop is just this:
1. Call \`iter()\` on the iterable once, to get an iterator.
2. Call \`next()\` again and again, running the loop body each time.
3. Stop quietly when \`StopIteration\` is raised.

Two facts that explain most surprises:
- **An iterator is used up after one pass.** It never rewinds. Loop over it a second time and you get nothing, with no error.
- **An open file is an iterator.** Each step reads one more line from disk. That is why \`for line in f:\` works on a huge file, while \`f.readlines()\` or \`list(f)\` loads it all.`,
    { sketch: { w: 760, h: 300, caption: 'A for loop asks the iterable for an iterator once, then calls next() until StopIteration', items: [
      { t: 'box', x: 14, y: 40, w: 150, h: 64, label: 'iterable', sub: 'list, file, range', fill: 'blue' },
      { t: 'arrow', x1: 168, y1: 72, x2: 262, y2: 72, label: 'iter()', ly: -14 },
      { t: 'box', x: 266, y: 28, w: 200, h: 90, label: 'iterator', sub: 'remembers its position', fill: 'yellow' },
      { t: 'table', x: 276, y: 150, title: 'the iterator keeps a position', cols: ['10', '20', '30'], colW: [62, 66, 62], rows: [['done', 'bookmark', 'to do']], rowH: 28, hl: [0] },
      { t: 'arrow', x1: 470, y1: 60, x2: 560, y2: 60, label: 'next()', ly: -14 },
      { t: 'box', x: 564, y: 30, w: 180, h: 60, label: 'loop body runs', sub: 'with the value', fill: 'green' },
      { t: 'arrow', x1: 654, y1: 94, x2: 654, y2: 130, bend: -10 },
      { t: 'arrow', x1: 640, y1: 132, x2: 470, y2: 98, dashed: true, label: 'again', lx: 20, ly: -10 },
      { t: 'box', x: 564, y: 136, w: 180, h: 56, label: 'StopIteration', sub: 'nothing left: loop ends', fill: 'pink', size: 16 },
      { t: 'note', x: 14, y: 220, w: 730, h: 66, fill: 'yellow', size: 14, text: 'A list is iterable but is not an iterator: every for loop gets a fresh iterator from it, so you can loop many times.\nAn iterator is single use: once it is exhausted it stays empty. Files and generators are iterators.' },
    ] } },
    { py: {
      title: 'The iteration protocol by hand',
      starter: `nums = [10, 20, 30]          # a list is an ITERABLE: it can give you an iterator
it = iter(nums)              # the iterator keeps a position, like a bookmark
print(next(it), next(it), next(it))
try:
    next(it)                 # nothing left
except StopIteration:
    print("StopIteration: the iterator is used up")
print(list(it))              # an exhausted iterator stays empty, it never rewinds

# this is what a for loop does for you
it = iter(nums)
while True:
    try:
        item = next(it)
    except StopIteration:
        break
    print("item", item)

# You can build your own iterator. (A class is a blueprint for objects; you meet
# classes properly in the Classes lesson. Just notice the two special methods.)
class Countdown:
    def __init__(self, start):
        self.n = start
    def __iter__(self):          # an iterator returns itself
        return self
    def __next__(self):          # give the next value, or say "finished"
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1

print(list(Countdown(3)))

# an open file is an iterator over its lines: each next() reads one more line
with open("fact_gl.csv") as f:
    header = next(f)
    first = next(f)
    print(header.strip())
    print(first.strip())`,
      note: 'Writing a class just to count down is a lot of code. A generator does the same in four lines. That is the next section.',
    } },
    `## Generators: write a function that pauses
A *generator function* looks like a normal function but uses \`yield\` instead of \`return\`. Calling it does **not run the body**. It gives you a *generator object*, which is an iterator. Each time something asks for the next value, the body runs **until the next \`yield\`**, hands that value out, and **freezes right there**, keeping all its local variables. The next request wakes it up on the line after the \`yield\`.
\`\`\`python
def read_amounts(rows):
    for row in rows:
        yield float(row)      # hand out one value, then pause here

gen = read_amounts(["100", "250.5"])   # nothing has run yet
next(gen)                              # runs until the first yield: 100.0
next(gen)                              # resumes after the yield: 250.5
next(gen)                              # the body ends: StopIteration
\`\`\`
A \`return\` inside a generator simply ends it. The consumer (a \`for\` loop, \`sum\`, \`list\`) never sees the freezing: it just receives values.

A **generator expression** is the same idea as a comprehension, with round brackets: \`(float(r["debit"]) for r in rows)\`. It builds no list. When it is the only argument of a function you can drop the extra brackets: \`sum(float(r["debit"]) for r in rows)\`.

| | List comprehension \`[...]\` | Generator expression \`(...)\` |
|---|---|---|
| Memory | all items at once | one item at a time |
| Can you loop twice? | yes | no, single use |
| \`len()\`, indexing, slicing | yes | no |
| Start-up | all the work happens first | work happens as you consume |
| Best for | small results you will reuse | big or endless data, one pass |`,
    { py: {
      title: 'Watch a generator pause and resume',
      starter: `def read_amounts(rows):
    for n, row in enumerate(rows, start=1):
        print(f"  generator: producing item {n}")
        yield float(row)

rows = ["100", "250.5", "75"]
print("calling the function runs NOTHING yet:")
gen = read_amounts(rows)
print(" ", gen)
print("first next():")
print("  got", next(gen))
print("second next():")
print("  got", next(gen))

print("--- a for loop: producer and consumer take turns")
for amount in read_amounts(rows):
    print("  consumer: got", amount)

# generator expression: the same idea without writing a function
squares = (n * n for n in range(5))
print(next(squares), next(squares), sum(squares))    # sum() takes the REST: 4 + 9 + 16
print(list(squares))                                  # used up: empty

# an endless generator is fine: values are made only when asked for
def invoice_numbers(prefix):
    n = 1
    while True:
        yield f"{prefix}-{n:04d}"
        n += 1

from itertools import islice
print(list(islice(invoice_numbers("INV"), 3)))      # islice takes just 3 and stops

# a return inside a generator ends it
def until_blank(lines):
    for line in lines:
        if not line.strip():
            return
        yield line.strip()
print(list(until_blank(["a", "b", "", "c"])))`,
      note: 'Read the output top to bottom. "generator: producing item 2" appears only after you asked for the second value. In the for loop the two sides alternate: that is the lazy pipeline in miniature.',
    } },
    `## Pipelines: generators that feed generators
Because a generator is an iterator, one generator can consume another. Chain a few and you get a **pipeline** where each row travels through *all* the stages before the next row is read. Nothing is stored in between.

\`yield from other\` hands every value of another iterable straight to your consumer. It is perfect for "go through all the files in this folder as one stream".`,
    { sketch: { w: 760, h: 316, caption: 'A list holds every row at once. A generator pipeline holds one row at a time, pulled through all the stages', items: [
      { t: 'text', x: 190, y: 22, text: 'list: read everything first', size: 16, bold: true, anchor: 'middle' },
      { t: 'db', x: 20, y: 40, w: 90, h: 66, label: 'file', fill: 'grey' },
      { t: 'arrow', x1: 114, y1: 74, x2: 168, y2: 74, label: 'all rows', ly: -14 },
      { t: 'table', x: 172, y: 40, cols: ['row 1', 'row 2', 'row 3', '...'], colW: [52, 52, 52, 36], rows: [['', '', '', '']], rowH: 30, fill: 'pink' },
      { t: 'note', x: 20, y: 120, w: 340, h: 50, fill: 'pink', size: 13, text: 'Memory = every row of the file.\n4 GB file, 4 GB of RAM (and more).' },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 190, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 570, y: 22, text: 'pipeline: pull one row through', size: 16, bold: true, anchor: 'middle' },
      { t: 'db', x: 396, y: 40, w: 70, h: 56, label: 'file', fill: 'grey' },
      { t: 'arrow', x1: 468, y1: 68, x2: 494, y2: 68 },
      { t: 'box', x: 496, y: 44, w: 72, h: 48, label: 'read', fill: 'blue', size: 15 },
      { t: 'arrow', x1: 570, y1: 68, x2: 590, y2: 68 },
      { t: 'box', x: 592, y: 44, w: 72, h: 48, label: 'clean', fill: 'blue', size: 15 },
      { t: 'arrow', x1: 666, y1: 68, x2: 684, y2: 68 },
      { t: 'box', x: 686, y: 44, w: 62, h: 48, label: 'sum', fill: 'green', size: 15 },
      { t: 'note', x: 396, y: 120, w: 352, h: 50, fill: 'green', size: 13, text: 'Memory = one row at a time.\nThe same code works for 3 rows or 3 million.' },
      { t: 'text', x: 380, y: 214, text: 'Who pulls?  The last stage asks "next row?", each stage asks the one before it, back to the file.', size: 14, anchor: 'middle', color: '#5c6478' },
      { t: 'note', x: 14, y: 236, w: 732, h: 64, fill: 'yellow', size: 14, text: 'for line in f: ...   →   streams a file line by line (a file is an iterator)\nsum(x for x in stage)   →   a generator expression never builds the list\nyield from other   →   passes on every value of another source, so many files read as one' },
    ] } },
    { py: {
      title: 'A lazy pipeline over the sales files in input/',
      starter: `import csv
from pathlib import Path

def read_rows(path):
    """One dict per CSV row. The file stays open only while we are reading it."""
    with open(path, newline="") as f:
        yield from csv.DictReader(f)

def read_folder(folder):
    for path in sorted(Path(folder).glob("sales_*.csv")):
        yield from read_rows(path)               # hand over to another generator

def only_with_status(rows):
    for row in rows:
        if row["status"]:                        # skip rows where status is empty (NULL)
            yield row

def to_pair(rows):
    for row in rows:
        yield row["channel"], float(row["amount"])

pipeline = to_pair(only_with_status(read_folder("input")))
print("built the pipeline:", pipeline)           # nothing has been read yet

totals = {}
for channel, amount in pipeline:                 # NOW rows flow through all four stages, one by one
    totals[channel] = totals.get(channel, 0) + amount
for channel, total in sorted(totals.items()):
    print(f"{channel:<8}{total:>12,.0f}")

print("second pass over the same pipeline:", list(pipeline))   # used up: empty`,
      note: 'Two sales files, each with some rows that have no status. The pipeline joined them, dropped those rows and totalled the rest without ever holding a whole file in a list. The last line shows the single-use rule.',
    } },
    `## itertools: ready-made lazy tools
The standard module \`itertools\` is a toolbox of generators written by experts. Every function returns an iterator, so they work on files and endless streams.

| Function | What it does | Example |
|---|---|---|
| \`islice(it, n)\` | the first \`n\` items (also a start and stop) | peek at the first 5 rows of a big file |
| \`chain(a, b)\` | several iterables as one stream | the August and September files together |
| \`groupby(it, key)\` | groups of **neighbouring** items with the same key | lines of one journal, in a sorted file |
| \`accumulate(it)\` | running totals | cumulative sales |
| \`pairwise(it)\` | each item with the next one | month-on-month change |
| \`batched(it, n)\` | fixed-size chunks (Python 3.12 and later) | insert 1,000 rows at a time |
| \`zip_longest(a, b)\` | like \`zip\`, but pads the short one | compare two files of different length |
| \`takewhile(test, it)\` | items until the test first fails | read lines until a blank line |

**The \`groupby\` trap.** \`groupby\` groups only items that sit **next to each other**. If the data is not sorted by the key, the same key shows up as several separate groups. Sort first (or know that the file is already ordered).`,
    { sketch: { w: 760, h: 270, caption: 'groupby makes a new group every time the key changes, so unsorted input splits one key into pieces', items: [
      { t: 'text', x: 190, y: 24, text: 'groupby(["IN01", "SG01", "IN01"])', font: 'mono', size: 12, anchor: 'middle', bold: true },
      { t: 'table', x: 40, y: 44, cols: ['key', 'items'], colW: [90, 110], rows: [['IN01', '1'], ['SG01', '1'], ['IN01', '1']], rowH: 30, fill: 'pink' },
      { t: 'note', x: 40, y: 180, w: 300, h: 66, fill: 'pink', size: 13, text: 'THREE groups. IN01 appears twice\nbecause SG01 sits between its rows.\nEasy to miss: no error is raised.' },
      { t: 'text', x: 570, y: 24, text: 'groupby(sorted([...]))', font: 'mono', size: 12, anchor: 'middle', bold: true },
      { t: 'table', x: 430, y: 44, cols: ['key', 'items'], colW: [90, 110], rows: [['IN01', '2'], ['SG01', '1']], rowH: 30, fill: 'green' },
      { t: 'note', x: 430, y: 150, w: 310, h: 66, fill: 'green', size: 13, text: 'TWO groups, as intended.\nSort by the same key you group by,\nthen groupby gives one group per key.' },
      { t: 'arrow', x1: 345, y1: 106, x2: 425, y2: 88, label: 'sort first', ly: -14 },
    ] } },
    { py: {
      title: 'itertools on the GL data',
      starter: `import csv
from itertools import accumulate, batched, chain, groupby, islice, pairwise

with open("fact_gl.csv", newline="") as f:
    rows = list(csv.DictReader(f))

# islice: the first n items of ANY iterable, without loading the rest
print([r["gl_id"] for r in islice(rows, 3)])

# chain: several sources as one stream
print(len(list(chain(rows[:5], rows[5:8]))), "rows from two slices")

# groupby: sort first, then each journal is one group
by_journal = sorted(rows, key=lambda r: r["journal_id"])
for journal, group in islice(groupby(by_journal, key=lambda r: r["journal_id"]), 3):
    print(journal, [r["gl_id"] for r in group])

# the trap: neighbours only
mixed = ["IN01", "SG01", "IN01"]
print("unsorted:", [(k, len(list(g))) for k, g in groupby(mixed)])
print("sorted  :", [(k, len(list(g))) for k, g in groupby(sorted(mixed))])

# accumulate: running total; pairwise: neighbours
monthly_sales = [100, 120, 90, 150]
print("running total   :", list(accumulate(monthly_sales)))
print("month on month  :", [b - a for a, b in pairwise(monthly_sales)])

# batched: fixed-size chunks (the last one can be smaller)
print([list(b) for b in batched(range(7), 3)])
print("batches of 500 over the GL file:", [len(b) for b in batched(rows, 500)])`,
      note: '`batched` needs Python 3.12 or newer. You installed 3.12 in the first lesson, so it works on your laptop. For older versions the challenge below shows how to write it yourself.',
    } },
    `## A file bigger than memory: the standard pattern
Putting it together, the safe shape of any big-file job is:
1. **Stream** the input (\`for line in f\` or \`csv.DictReader\`), never \`list(...)\` it.
2. **Transform** in generator stages (clean, validate, convert types).
3. **Keep only what you need**: running totals, a set of seen ids, or one *batch* of rows.
4. **Write out in batches** (insert 1,000 rows, append 10,000 lines) so the output is also never fully in memory.

Two details that matter in production:
- **Errors show up late.** A generator does nothing until consumed, so a bad value in row 2,900,000 raises its error only when the pipeline reaches that row. Validate each row as it passes, count the rejects, and write them to a rejects file instead of crashing the whole run.
- **A generator that reads a file keeps the file open.** Use \`with open(...)\` *inside* the generator so the file closes when the generator finishes (or is garbage-collected).`,
    { py: {
      title: 'Why it matters: peak memory of a list versus a generator',
      starter: `import tracemalloc

def fake_lines(n):
    """Pretend to read n GL lines from a big file."""
    for i in range(n):
        yield {"gl_id": i, "account": 6000 + i % 12, "debit": (i % 1000) * 1.5}

def peak_kb(func):
    tracemalloc.start()
    result = func()
    peak = tracemalloc.get_traced_memory()[1]      # the highest memory use during the call
    tracemalloc.stop()
    return result, peak / 1024

def with_list():
    rows = list(fake_lines(100_000))               # ALL rows alive at the same time
    return sum(r["debit"] for r in rows)

def with_generator():
    return sum(r["debit"] for r in fake_lines(100_000))   # one row alive at a time

total1, kb1 = peak_kb(with_list)
total2, kb2 = peak_kb(with_generator)
print("same answer:", total1 == total2, total1)
print(f"peak memory with a list     : {kb1 * 1024:>12,.0f} bytes")
print(f"peak memory with a generator: {kb2 * 1024:>12,.0f} bytes")
print(f"the list version needed roughly {kb1 / kb2:,.0f} times more memory")`,
      note: 'The exact numbers depend on your machine, but the pattern does not: the list grows with the data, the generator stays flat. With 100 million lines the list version would not fit in RAM at all.',
    } },
    { warn: `Things that go wrong with iterators and generators:
- **A second loop over a used-up generator silently does nothing.** If a report suddenly shows zeros, check whether you looped over the same generator twice. Create it again, or store the results in a list when you need them twice.
- **No \`len()\`, no \`gen[0]\`, no slicing.** Use \`next(gen)\`, \`islice(gen, 5)\` or \`list(gen)\`. To peek at a pipeline while debugging, use \`list(islice(pipeline, 5))\`.
- **\`groupby\` on unsorted data** gives several groups for one key. Sort by the same key first.
- **A list of a million rows built "just to be safe"** defeats the point. If you only loop once, stay lazy.
- **Generators hide exceptions until they run.** Wrap the consuming loop, not the line that creates the generator, in \`try / except\`.` },
    { pychallenge: {
      id: 'python-iterators-generators-ch1',
      prompt: 'Write the generator `batched_rows(iterable, size)` that yields **lists** of `size` items from any iterable. The last list may be shorter. It must be lazy (it has to work on an endless stream) and `size` below 1 must raise `ValueError`. Do not use `itertools.batched`: write the loop yourself.',
      starter: `def batched_rows(iterable, size):
    # TODO: collect items in a list; when it has size items, yield it and start a new one
    return []
`,
      tests: `from itertools import count, islice
assert list(batched_rows([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]], list(batched_rows([1, 2, 3, 4, 5], 2))
assert list(batched_rows([], 3)) == []
assert list(batched_rows(iter("abcdef"), 3)) == [["a", "b", "c"], ["d", "e", "f"]]
assert list(islice(batched_rows(count(), 3), 2)) == [[0, 1, 2], [3, 4, 5]]
assert isinstance(next(batched_rows([1], 5)), list)
try:
    list(batched_rows([1], 0))
    raise AssertionError("size 0 must raise ValueError")
except ValueError:
    pass`,
      solution: `def batched_rows(iterable, size):
    if size < 1:
        raise ValueError("size must be at least 1")
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch
`,
      hint: 'Keep a list `batch`. For each item append it; when `len(batch) == size` do `yield batch` and then `batch = []` (a NEW list). After the loop, `if batch: yield batch` sends the short last one.',
    } },
    { pychallenge: {
      id: 'python-iterators-generators-ch2',
      prompt: 'Write the generator `unique_by(rows, key)` that streams rows and yields a row **only the first time** its `key(row)` is seen, keeping the original order. It must work lazily on an endless stream, and `key` is a function. This is how you de-duplicate a huge invoice file without loading it.',
      starter: `def unique_by(rows, key):
    # TODO: remember the keys already seen in a set; yield the row only when its key is new
    return []
`,
      tests: `from itertools import count, islice
rows = [{"inv": "A", "n": 1}, {"inv": "B", "n": 2}, {"inv": "A", "n": 3}, {"inv": "C", "n": 4}, {"inv": "B", "n": 5}]
assert [r["n"] for r in unique_by(rows, key=lambda r: r["inv"])] == [1, 2, 4]
assert list(unique_by([3, 1, 3, 2, 1], key=lambda x: x)) == [3, 1, 2]
assert list(unique_by(["apple", "avocado", "banana"], key=lambda s: s[0])) == ["apple", "banana"]
assert list(islice(unique_by(count(), key=lambda n: n % 3), 3)) == [0, 1, 2]
assert next(unique_by([], key=len), "empty") == "empty"`,
      solution: `def unique_by(rows, key):
    seen = set()
    for row in rows:
        k = key(row)
        if k not in seen:
            seen.add(k)
            yield row
`,
      hint: 'Create `seen = set()` before the loop. For each row compute `k = key(row)`; if `k not in seen`, add it to the set and `yield row`.',
    } },
    { pychallenge: {
      id: 'python-iterators-generators-ch3',
      prompt: 'Write the generator `parse_stream(lines)`. `lines` is any iterable of CSV text lines whose first line is the header `invoice_no,amount`. Use `csv.DictReader(lines)` and yield one dict `{"invoice_no": text, "amount": float}` per **valid** row. Skip a row when the invoice number is blank, or the amount is not a number, or the amount is zero or negative. It must be lazy: reading the first valid row must not read the rest of the input.',
      starter: `import csv

def parse_stream(lines):
    # TODO: for each DictReader row validate it and yield a clean dict
    return []
`,
      tests: `lines = ["invoice_no,amount", "INV/1,1000.50", "INV/2,abc", ",500", "INV/3,-5", "INV/4,0", "", "INV/5,250", "INV/6,"]
assert list(parse_stream(lines)) == [{"invoice_no": "INV/1", "amount": 1000.5}, {"invoice_no": "INV/5", "amount": 250.0}], list(parse_stream(lines))
assert list(parse_stream(["invoice_no,amount"])) == []
assert list(parse_stream(["invoice_no,amount", "INV/7"])) == []

def source():
    yield "invoice_no,amount"
    yield "INV/1,10"
    raise RuntimeError("read too far: the generator is not lazy")

g = parse_stream(source())
assert next(g) == {"invoice_no": "INV/1", "amount": 10.0}`,
      solution: `import csv

def parse_stream(lines):
    for row in csv.DictReader(lines):
        invoice = (row.get("invoice_no") or "").strip()
        if not invoice:
            continue
        try:
            amount = float(row["amount"])
        except (TypeError, ValueError):
            continue
        if amount <= 0:
            continue
        yield {"invoice_no": invoice, "amount": amount}
`,
      hint: 'Loop over `csv.DictReader(lines)`. Use `continue` to skip bad rows. Wrap `float(row["amount"])` in `try / except (TypeError, ValueError)`: a row that is too short gives `None`, which raises `TypeError`. Then `yield` the cleaned dict.',
    } },
    { real: 'Every real ingestion job has this skeleton: **read** a source lazily (a CSV, an API page by page, a queue), **clean** and **validate** each record in a generator stage, count and set aside the rejects, and **load** in batches. When you meet `dlt`, Airflow tasks and Spark later, you will see the same idea with bigger engines: records flow through stages, and only a batch is ever in memory. The month-end bank statement, the GL extract from SAP and a 10-year payroll history are all just streams of rows to this pattern.' },
    { interview: `**"What is a generator and why use one?"**
Model answer: "A generator is a function that uses \`yield\` to produce values one at a time and pauses between them, keeping its local state. It is lazy, so memory use stays flat however big the data is. I use it to stream files and API pages and to build pipelines of small stages. The trade-off is that a generator is single use: after one pass it is empty, and you cannot index it or take its length."

**"What is the difference between an iterable and an iterator?"** "An iterable can give you an iterator through \`iter()\`; a list is an example. An iterator has \`__next__\`, remembers its position and is used up after one pass. A \`for\` loop calls \`iter()\` once and then \`next()\` until \`StopIteration\`."

**"How would you process a 10 GB CSV on a laptop?"** "Stream it with \`csv.DictReader\` or a \`for\` loop, never \`list()\` it. Validate and transform in generator stages, keep only running aggregates or a small batch, and write results in batches. In pandas the same idea is \`chunksize\`."

**"\`yield\` vs \`return\`?"** "\`return\` ends the function and gives one value. \`yield\` hands out a value and pauses, so the function can produce many values over time."` },
    `## Recap
- An **iterable** can give you an **iterator** (\`iter()\`). An iterator walks with \`next()\`, remembers its place, raises \`StopIteration\` at the end and is **single use**. A file is an iterator over lines.
- A function with \`yield\` is a **generator**: calling it runs nothing, each \`next()\` runs to the next \`yield\` and pauses. \`(x for x in src)\` is the one-line form.
- Generators chain into **lazy pipelines**: one row travels through every stage, memory stays flat, and \`yield from\` merges several sources.
- \`itertools\` gives you \`islice\`, \`chain\`, \`groupby\` (sorted input only), \`accumulate\`, \`pairwise\` and \`batched\`.
- For a file bigger than memory: stream it, transform lazily, keep only aggregates or a batch, write in batches, and validate rows as they pass.`,
  ],
  quiz: [
    { q: 'Which statement about iterables and iterators is correct?', o: ['a list is an iterable; `iter(list)` gives an iterator that is used up after one pass', 'a list is an iterator, so it can only be looped once', 'every iterator can be indexed with `[0]`', 'an iterator and an iterable are the same thing'], a: 0, why: 'A list can hand out a fresh iterator every time you loop over it. The iterator remembers a position and never rewinds.' },
    { q: 'What happens when you call a generator function such as `gen = read_amounts(rows)`?', o: ['the whole body runs and returns a list', 'it raises `StopIteration` immediately', 'a generator object is returned and none of the body has run yet', 'only the first line of the body runs'], a: 2, why: 'Calling it only creates the generator object. The body runs, up to the next `yield`, when something asks for the next value.' },
    { q: '`sq = (n * n for n in range(3))`. After `print(list(sq))`, what does a second `print(list(sq))` show?', o: ['`[0, 1, 4]` again', 'a `StopIteration` error', '`[0, 1, 4, 9]`', '`[]`'], a: 3, why: 'A generator expression is single use. After the first pass it is exhausted, and looping again silently gives nothing.' },
    { q: 'You must total a column in a 4 GB CSV on a laptop. Which approach is safe?', o: ['`rows = list(csv.DictReader(f))` then sum', '`f.readlines()` then loop', '`sum(float(r["amount"]) for r in csv.DictReader(f))`', 'copy the file into a dict first'], a: 2, why: 'The generator expression pulls one row at a time through `csv.DictReader`, so memory stays flat. The other options load every row first.' },
    { q: '`groupby(["IN01", "SG01", "IN01"])` yields how many groups?', o: ['2, one per distinct key', '3, because only neighbouring equal keys are grouped', '1', 'it raises an error because the data is unsorted'], a: 1, why: '`groupby` starts a new group whenever the key changes. Sort by the key first if you want one group per key.' },
    { q: 'What does `for line in f:` rely on when `f` is an open file?', o: ['the file is an iterator: each `next()` reads one more line, and `StopIteration` marks the end', 'Python loads the whole file into a list first', 'the file must be smaller than memory', 'it only works for CSV files'], a: 0, why: 'A file object is an iterator over its lines, which is why looping over it works on files of any size.' },
  ],
  task: {
    title: 'Stream the GL file and check it against SQL',
    steps: [
      'In `C:\\fde\\py-recap` create `streaming_totals.py`. It needs `fact_gl.csv` (exported in the *Comprehensions and control flow* task).',
      'Write a generator `read_rows(path)` using `with open(...)` and `yield from csv.DictReader(f)`, and a generator `to_amounts(rows)` that yields `(entity_id, debit, credit)` with `Decimal` values built from the text (`Decimal(row["debit"])`).',
      'Loop over the pipeline once and keep running totals per entity in a dict. Never build a list of all rows.',
      'Use `batched` from `itertools` on the pipeline to print a progress line after every 500 rows, for example `processed 500 rows`.',
      'Print the totals per entity and compare them with PostgreSQL: run `SELECT entity_id, SUM(debit), SUM(credit), COUNT(*) FROM fact_gl GROUP BY entity_id ORDER BY 1;` in DBeaver or psql. They must match: entity 1 has 411 lines with debit 6288358.95 and credit 6247302.77; entity 2 has 408 lines, 154012.10 on both sides; entity 3 has 408 lines, debit 245847.69, credit 245347.69.',
      'Add a comment: why must you never add entity 1 and entity 2 together? (Hint: their amounts are in different currencies.)',
    ],
    deliverable: '`streaming_totals.py`, its output and the SQL result side by side.',
  },
};
