export default {
  id: 'python-interview-method',
  title: 'The Python interview method: approach, solving aloud, practice, and four timed problems',
  goal: 'You have a repeatable seven-step method for any Python problem, you can narrate your thinking while you code, you know the classic traps and how to test for them, you can find the lesson behind any interview question, you have a practice routine that fits you, and you have solved four interview-style problems from a vague question to a tested answer.',
  roadmap: [
    'A repeatable approach to Python problems',
    'Solving aloud',
    'A practice routine',
    'Four timed interview problems',
    'Model answers to the Python interview questions',
  ],
  blocks: [
    `## The problem
You now know a lot of Python. You can still fail a Python interview, and not because a feature is missing. It is **how** you work:

- You hear the question and **start typing** before you know what the function must return.
- You work in **silence**, so nobody can tell whether you are stuck or thinking.
- You test one example, never the **edges**: an empty list, \`None\`, one item, a duplicate, a tie.
- You never state the **cost**. "It works" does not answer "what is the complexity?"
- You write a clever **one-liner** that you cannot explain, or change when the question changes.

These are habits, and habits can be trained. This lesson gives you a **method**, the **words to say**, a **map from questions to lessons**, a **checklist of traps**, a **practice routine**, four problems and **model answers** to the nine questions of this phase. The same method works for a vague request from a manager, which is most of the real job.`,
    `## The method: seven steps
Do these in order, even for an easy problem. The order keeps you calm and shows how you think.

1. **Restate** the problem in your own words and **name the output**: *"So I write a function that takes the GL lines and returns one entry for each group of duplicate lines. Is that right?"*
2. **Clarify the input.** A list, a generator or a file? How big? Duplicates, \`None\`, messy text? Sorted? May I change it? What do I return when there is no answer?
3. **Work an example by hand.** Three to five items and the answer you expect. It becomes your first test.
4. **Plan and name the pattern.** Counting or grouping is a dict, neighbours in sorted data are two pointers, top k is a heap. Say the slow way and its cost, then the better way.
5. **Write small functions**, one job each, and run each on your example before you build on it.
6. **Test the edges.** Empty input, one item, \`None\`, duplicates, ties, boundaries. Check that the input was **not changed**.
7. **Discuss.** State the **time and memory cost**, the alternatives, what happens with a million rows, how you would **test** it, and whether it is **safe to run twice** (idempotent).`,
    { sketch: { w: 760, h: 312, caption: 'The seven steps. Step 6 can send you back to step 5: that loop is normal, and saying it aloud shows that you test your own work.', items: [
      { t: 'box', x: 8, y: 20, w: 170, h: 58, label: '1  Restate', sub: 'name the output', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 180, y1: 49, x2: 200, y2: 49 },
      { t: 'box', x: 202, y: 20, w: 170, h: 58, label: '2  Clarify input', sub: 'size, None, dupes', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 374, y1: 49, x2: 394, y2: 49 },
      { t: 'box', x: 396, y: 20, w: 170, h: 58, label: '3  Example', sub: 'by hand, 3 to 5 items', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 568, y1: 49, x2: 588, y2: 49 },
      { t: 'box', x: 590, y: 20, w: 162, h: 58, label: '4  Plan', sub: 'name the pattern', fill: 'green', size: 16 },
      { t: 'arrow', x1: 670, y1: 80, x2: 670, y2: 118 },
      { t: 'box', x: 590, y: 120, w: 162, h: 58, label: '5  Write', sub: 'small functions', fill: 'green', size: 16 },
      { t: 'arrow', x1: 588, y1: 149, x2: 568, y2: 149 },
      { t: 'box', x: 396, y: 120, w: 170, h: 58, label: '6  Test edges', sub: 'empty, None, dupes', fill: 'orange', size: 16 },
      { t: 'arrow', x1: 394, y1: 149, x2: 374, y2: 149 },
      { t: 'box', x: 202, y: 120, w: 170, h: 58, label: '7  Discuss', sub: 'cost, tests, rerun', fill: 'yellow', size: 16 },
      { t: 'note', x: 8, y: 120, w: 182, h: 58, fill: 'pink', size: 13, text: 'Stuck? Shrink the problem:\nsolve it for ONE invoice first.' },
      { t: 'line', x1: 481, y1: 180, x2: 481, y2: 200, dashed: true },
      { t: 'line', x1: 481, y1: 200, x2: 671, y2: 200, dashed: true },
      { t: 'arrow', x1: 671, y1: 200, x2: 671, y2: 182, dashed: true },
      { t: 'text', x: 576, y: 222, text: 'a bug found in step 6: back to step 5', size: 13, anchor: 'middle', color: '#5c6478' },
      { t: 'note', x: 8, y: 236, w: 744, h: 66, fill: 'yellow', size: 14, text: 'Say each step aloud as you do it: "I am going to test the edges now: what if the list is empty, or has one item?"\nThe interviewer hears a process, not a guess. A clear process beats a lucky answer.' },
    ] } },
    `## A worked example, narrated
**Question:** *"The GL extract is a list of rows. Some lines were loaded twice. Find them, and tell me how much they overstate the books."*

The whole method, aloud:

1. **Restate.** "I need a function that returns every group of identical lines that appears more than once, and the extra debit and credit that the surplus copies add. I only report. I delete nothing."
2. **Clarify.** "Identical means every column except \`gl_id\`, the id given at load time. Amounts are text, and \`0\` and \`0.00\` are the same amount, so I compare them as \`Decimal\`, never float. The rows are dicts from \`csv.DictReader\`, and I must not change them."
3. **Example.** "Four lines. Lines 1 and 3 are the same credit of 500.00 in journal A, with the zero written differently. Line 4 is the same in journal B, so it is not a duplicate. The answer: one group of two lines, extra credit 500.00."
4. **Plan.** "Group by key: a dictionary. The key is a tuple of the identifying fields and the two amounts. One pass, then keep groups with more than one line. Comparing every pair would be O(n squared); this is O(n)."
5. **Write.** "Three small functions: \`line_key\`, \`find_duplicates\` and \`overstatement\`. I run each on the four lines."
6. **Test.** "An empty list gives no groups. Three copies give two surplus copies. Currencies are never added together. The input is unchanged afterwards."
7. **Discuss.** "Time and memory are O(n). If the data did not fit in memory, I would let the database do it with \`GROUP BY ... HAVING COUNT(*) > 1\`. The report is read-only, so a second run gives the same answer. My four lines become pytest cases."`,
    { sketch: { w: 760, h: 312, caption: 'Step 3 on paper: a tiny input and the answer you expect. It becomes your test.', items: [
      { t: 'table', x: 14, y: 44, title: 'four lines on paper', cols: ['gl_id', 'journal', 'account', 'debit', 'credit'], colW: [60, 80, 80, 70, 90], rows: [['1', 'JV-A', '4100', '0', '500.00'], ['2', 'JV-A', '1000', '500.00', '0'], ['3', 'JV-A', '4100', '0.00', '500.00'], ['4', 'JV-B', '4100', '0', '500.00']], rowH: 26, hl: [0, 2] },
      { t: 'arrow', x1: 400, y1: 100, x2: 452, y2: 100 },
      { t: 'table', x: 460, y: 44, title: 'expected answer', cols: ['journal', 'gl_ids', 'extra credit'], colW: [70, 70, 120], rows: [['JV-A', '1, 3', '500.00']], rowH: 26, fill: 'green' },
      { t: 'note', x: 14, y: 196, w: 362, h: 100, fill: 'green', size: 14, text: 'The key is every column except gl_id.\nAmounts are compared as Decimal:\n"0" and "0.00" are the same amount.\nLine 4 is another journal: not a duplicate.' },
      { t: 'note', x: 392, y: 196, w: 358, h: 100, fill: 'yellow', size: 14, text: 'Write this BEFORE the code.\nWhen the code returns something else,\nyou know at once which of the two is wrong,\nand you can say why. It is your first test.' },
    ] } },
    { py: {
      title: 'The worked example: duplicate lines in the real GL extract',
      starter: `import csv
from collections import defaultdict
from decimal import Decimal

# Step 5: small functions. The key is every column except gl_id. Amounts are Decimal, so "0" and "0.00" match.
KEY_FIELDS = ("journal_id", "entity_id", "bu_id", "account_id", "posting_date", "currency", "source_system")

def line_key(row):
    return tuple(row[name] for name in KEY_FIELDS) + (Decimal(row["debit"]), Decimal(row["credit"]))

def find_duplicates(rows):
    """Groups of rows that share a key and appear more than once. The input is not changed."""
    groups = defaultdict(list)
    for row in rows:
        groups[line_key(row)].append(row)
    return [group for group in groups.values() if len(group) > 1]

def overstatement(groups):
    """The debit and credit added by the surplus copies, per currency (never add INR to SGD)."""
    extra = defaultdict(lambda: {"debit": Decimal("0"), "credit": Decimal("0")})
    for group in groups:
        first, surplus = group[0], len(group) - 1
        extra[first["currency"]]["debit"] += Decimal(first["debit"]) * surplus
        extra[first["currency"]]["credit"] += Decimal(first["credit"]) * surplus
    return dict(extra)

# Steps 3 and 6: the hand example from the sketch, then the edges, as asserts
def make_line(gl_id, journal, account, debit, credit):
    return {"gl_id": gl_id, "journal_id": journal, "entity_id": "1", "bu_id": "4", "account_id": account,
            "posting_date": "2025-04-10", "currency": "INR", "debit": debit, "credit": credit, "source_system": "SAP"}

example = [make_line("1", "JV-A", "4100", "0", "500.00"), make_line("2", "JV-A", "1000", "500.00", "0"),
           make_line("3", "JV-A", "4100", "0.00", "500.00"), make_line("4", "JV-B", "4100", "0", "500.00")]
before = [dict(row) for row in example]
found = find_duplicates(example)
assert [[row["gl_id"] for row in group] for group in found] == [["1", "3"]]
assert overstatement(found) == {"INR": {"debit": Decimal("0"), "credit": Decimal("500.00")}}
assert example == before                               # the input was not changed
assert find_duplicates([]) == []                       # empty input
triple = [make_line(str(n), "JV-A", "4100", "0", "500") for n in (1, 2, 3)]
assert overstatement(find_duplicates(triple))["INR"]["credit"] == Decimal("1000")   # three copies = two surplus ones
print("the hand example and the edge cases pass")

# The real extract
with open("fact_gl.csv", newline="") as f:
    gl_rows = list(csv.DictReader(f))
real_groups = find_duplicates(gl_rows)
print(len(gl_rows), "lines,", len(real_groups), "groups of duplicate lines")
for group in real_groups:
    first = group[0]
    print(f"   {first['journal_id']}  account {first['account_id']}  gl_ids {[row['gl_id'] for row in group]}  debit {first['debit']:>9}  credit {first['credit']:>9}")
for currency, amounts in overstatement(real_groups).items():
    print(f"overstated in {currency}: debit {amounts['debit']}, credit {amounts['credit']}")`,
      note: 'The loop reads the extract once. The three groups are the three duplicate lines of the Kollana GL: the copies are gl_id 1225, 1226 and 1227, copies of 18, 234 and 512. Together the copies overstate the books by debit 104550.46 and credit 63494.28. All three lines are in entity 1, so the amounts are all INR; the code still groups by currency, because a total across currencies means nothing. The function only reports and never changes its input, so running it twice gives the same answer. In SQL you would keep the lowest gl_id of each group with ROW_NUMBER.',
    } },
    `## Question families and where you learned them
Almost every question belongs to a family. Recognising the family is half of the answer, and it tells you which lesson to reread.

| Family | Typical wording | Pattern | Lesson |
|---|---|---|---|
| Hash maps | "two invoices that add up to X", "count per supplier", "remove duplicates" | dict, set, \`Counter\`, \`defaultdict\` | \`python-algorithms-de\` Interview toolkit: algorithms for data work |
| Sorting | "top 3 per department" | \`sorted\` with a tuple key, \`groupby\` | \`python-algorithms-de\` |
| Intervals | "merge overlapping dates", "gaps in validity" | sort by start, one pass | \`python-algorithms-de\` |
| Windows, two pointers | "most events in any window", "match two sorted lists" | \`deque\`, two indexes | \`python-algorithms-de\` |
| Heaps | "top k of a stream" | \`heapq\` | \`python-algorithms-de\` |
| Binary search | "the rate valid on a date" | \`bisect\` | \`python-algorithms-de\` |
| Trees | "all reports of a manager" | BFS, queue, visited set | \`python-algorithms-de\` |
| Log and CSV parsing | "errors per component" | regex, \`Counter\` | \`python-algorithms-de\`, \`python-text-time-money\` Text, dates and money |
| Streams | "a file bigger than memory" | generators, \`itertools\` | \`python-iterators-generators\` Iterators and generators |
| Money and dates | "round the GST", "fiscal year" | \`Decimal\`, \`datetime\`, \`zoneinfo\` | \`python-text-time-money\` |

| Lesson | Typical questions |
|---|---|
| \`python-setup-types\` Setup, basic types and f-strings | how Python runs, \`is\` against \`==\` |
| \`python-collections\` Lists, tuples, dicts and sets | list, tuple or set, copies |
| \`python-comprehensions-flow\` Comprehensions and control flow | comprehension or loop, \`zip\` |
| \`python-functions\` Functions | mutable defaults, closures |
| \`python-modules\` Modules and packages | imports, \`__name__\` |
| \`python-decorators-context-managers\` Decorators and context managers | a retry decorator, \`with\` |
| \`python-oop-dataclasses\` Classes and dataclasses | \`__eq__\` and \`__hash__\`, dataclasses |
| \`python-typing-pydantic\` Type hints and Pydantic | validating a payload |
| \`python-errors\` Errors and exceptions | what to retry, bare \`except\` |
| \`python-files\` Files and folders | \`pathlib\`, \`csv\` and \`json\` |
| \`python-concurrency\` Threads, processes and the GIL | the GIL, race conditions |
| \`python-asyncio\` asyncio | when async helps, blocking calls |
| \`python-performance\` Profiling and performance | make it faster, Big-O |
| \`python-logging-config\` Logging and configuration | log levels, secrets in config |
| \`python-testing-pytest\` Testing with pytest | test code that calls an API |
| \`python-quality-debugging\` Code quality and debugging | linting, types, the debugger |
| \`python-environments-packaging\` Environments and packaging | venv, \`uv\`, \`pyproject.toml\` |
| \`python-cli\` Command-line tools | \`argparse\`, exit codes |
| \`python-databases\` Databases from Python | parameterised queries, transactions |
| \`python-http-apis\` Calling APIs | timeouts, retries, 4xx against 5xx |
| \`python-scheduling\` Scheduling | cron, idempotent scripts |
| \`python-security-secrets\` Security basics in code | secrets, SQL injection, SSRF |`,
    `## The traps: check these before you say "done"
Most wrong answers fail in the same eleven places. Go through this list at step 6. The playground after it runs six; the others come back in the problems and the answers below.`,
    { checklist: [
      'Mutable default argument: def f(x, items=[]) shares ONE list between all calls. Use None and create the list inside.',
      'Float for money: 0.1 + 0.2 is not 0.3. Use Decimal built from text, or integer paise.',
      'Mutating the input: sort(), pop() or append() on a list that the caller passed in. Use sorted() or a copy, and test that the input is unchanged.',
      'Exhausted generator: a generator is used up after one pass, and a second loop silently gives nothing.',
      'groupby on unsorted data: it groups only neighbours. Sort by the same key first.',
      'Off-by-one: range ends, slices, windows, binary search. Test with 0, 1 and 2 items and with the target at both ends. Closed or half-open?',
      'Empty input and no answer: what do you return for [] or when nothing matches (None, an error, an empty list)? Say it.',
      'Shared state and the GIL: threads that change a shared list or counter (counter += 1 is read, add, write). Return results or use a queue or a lock. Threads do not speed up CPU-bound work.',
      'Bare except: it hides real bugs, and even Ctrl+C. Catch the specific error you can handle. Log or re-raise the rest.',
      'A blocking call in async code: time.sleep, requests.get or a long loop inside async def freezes every task. Use await with an async library, or move the call to a thread.',
      '== without __hash__: defining __eq__ removes the default __hash__, so the object cannot go into a set or be a dict key. Define both from the same fields, or use a frozen dataclass.',
    ] },
    { py: {
      title: 'Spot the bug: six wrong snippets and their fixes',
      starter: `from decimal import Decimal, InvalidOperation
from itertools import groupby

# BUG 1: a mutable default argument is created once and shared by every call
def sb_add_line_bug(line, lines=[]):
    lines.append(line)
    return lines

def sb_add_line_fixed(line, lines=None):
    if lines is None:
        lines = []
    lines.append(line)
    return lines

sb_add_line_bug("DR 100")
print("bug 1, second call:", sb_add_line_bug("CR 100"))
sb_add_line_fixed("DR 100")
print("fix 1, second call:", sb_add_line_fixed("CR 100"))

# BUG 2: float money. Ten invoice lines of 0.10 should add up to exactly 1.00
sb_lines = ["0.10"] * 10
sb_float_total, sb_decimal_total = 0.0, Decimal("0")
for sb_text in sb_lines:                       # adding line by line, as real code does
    sb_float_total += float(sb_text)
    sb_decimal_total += Decimal(sb_text)
print("bug 2:", sb_float_total, "| equal to 1?", sb_float_total == 1)
print("fix 2:", sb_decimal_total, "| equal to 1?", sb_decimal_total == 1)

# BUG 3: the function changes the list that the caller passed in
def sb_top_two_bug(amounts):
    amounts.sort(reverse=True)
    return amounts[:2]

def sb_top_two_fixed(amounts):
    return sorted(amounts, reverse=True)[:2]

sb_book = [250, 900, 120, 700]
print("bug 3:", sb_top_two_bug(sb_book), "| the caller's list is now", sb_book)
sb_book = [250, 900, 120, 700]
print("fix 3:", sb_top_two_fixed(sb_book), "| the caller's list is still", sb_book)

# BUG 4: a generator is used up after one pass
sb_amounts = (n * 100 for n in range(1, 5))
sb_total = sum(sb_amounts)
sb_count = len(list(sb_amounts))
print("bug 4: total", sb_total, "| count", sb_count, "(the generator was already used up)")
sb_amounts = [n * 100 for n in range(1, 5)]
print("fix 4: total", sum(sb_amounts), "| count", len(sb_amounts), "| average", sum(sb_amounts) / len(sb_amounts))

# BUG 5: groupby groups only NEIGHBOURS
sb_entities = ["IN01", "SG01", "IN01", "US01", "SG01"]
print("bug 5:", [(key, len(list(group))) for key, group in groupby(sb_entities)])
print("fix 5:", [(key, len(list(group))) for key, group in groupby(sorted(sb_entities))])

# BUG 6: a bare except hides a bug in the caller
def sb_to_paise_bug(text):
    try:
        return int(Decimal(text) * 100)
    except:
        return 0

def sb_to_paise_fixed(text):
    try:
        return int(Decimal(text) * 100)
    except InvalidOperation:           # only a badly written number is handled here
        return None

print("bug 6: a typo and a None both give", sb_to_paise_bug("12,50"), "and", sb_to_paise_bug(None), "(the bug is hidden)")
print("fix 6: a typo gives", sb_to_paise_fixed("12,50"))
try:
    sb_to_paise_fixed(None)
except TypeError as error:
    print("fix 6: None is a bug in the caller, so it is NOT hidden:", type(error).__name__)`,
      note: 'Bug 1: the second call returns both lines because the default list is shared, and the fix returns only the new line. Bug 2: adding 0.10 ten times as float gives 0.9999999999999999, which is not equal to 1, while Decimal gives exactly 1.00. (Recent Python versions make the built-in sum() of floats more exact, which would hide this bug, so the snippet adds in a loop, the way real code adds line by line.) Bug 3: the buggy function reorders the caller\'s list, the fix leaves it alone. Bug 4: the count is 0 because the total already used up the generator, so an average would divide by zero. Bug 5: five groups instead of three. Bug 6: a typo and a None both become 0 without a sound, while the fix returns None for bad text and lets the real bug, a None, raise TypeError.',
    } },
    `## Solving aloud
In a live interview the other person wants to **follow your thinking**. Habits that help:

- **Narrate before you type.** *"First a small function that cleans the invoice number, then one that groups."*
- **Name your assumptions.** *"I assume a list of dicts, with amounts as text."* A spoken assumption is never a mistake. A silent one can be.
- **Write the signature and one \`assert\` first**, from your hand example, so you and the interviewer agree on the question. Then run each piece on it and read the result aloud: does it match?
- **When you are stuck, shrink the problem.** Solve it for one supplier, or three items. Or write the **slow obvious version** first and say *"this is O(n squared), now I remove the repeated work"*. A working slow answer beats a broken fast one.
- **Own your mistakes calmly.** *"My test shows that I changed the caller's list. I will sort a copy."*
- **Do not guess a name.** Say what you want (*"the class that counts items"*) and write what you remember.
- **Choose the readable version.** A three-line loop you can explain beats a clever one-liner you cannot debug.

**"Can it be faster, or use less memory?"** *Measure first* (\`timeit\`, \`cProfile\`, \`tracemalloc\`). Remove a **loop inside a loop** with a dict or set. **Stream** with a generator instead of building a list. Do column maths in **pandas or numpy**. Use threads or asyncio when the work is **waiting**, processes when it is **computing**.`,
    { sketch: { w: 760, h: 306, caption: 'The think-aloud loop: say, write, run, read. Repeat it for every small piece, and the interviewer can follow you.', items: [
      { t: 'box', x: 14, y: 36, w: 164, h: 62, label: '1  Say', sub: 'what and why', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 180, y1: 67, x2: 200, y2: 67 },
      { t: 'box', x: 202, y: 36, w: 164, h: 62, label: '2  Write', sub: 'one small function', fill: 'green', size: 16 },
      { t: 'arrow', x1: 368, y1: 67, x2: 388, y2: 67 },
      { t: 'box', x: 390, y: 36, w: 164, h: 62, label: '3  Run', sub: 'on your example', fill: 'yellow', size: 16 },
      { t: 'arrow', x1: 556, y1: 67, x2: 576, y2: 67 },
      { t: 'box', x: 578, y: 36, w: 164, h: 62, label: '4  Read', sub: 'match or not?', fill: 'orange', size: 16 },
      { t: 'note', x: 14, y: 116, w: 164, h: 82, fill: 'blue', size: 13, text: '"I will clean the\ninvoice number first:\nstrip and upper-case."' },
      { t: 'note', x: 202, y: 116, w: 164, h: 82, fill: 'green', size: 13, text: 'A few lines, a clear\nname, no tricks.\nSignature first.' },
      { t: 'note', x: 390, y: 116, w: 164, h: 82, fill: 'yellow', size: 13, text: 'print or assert the\nanswer you expected\nfrom the hand example.' },
      { t: 'note', x: 578, y: 116, w: 164, h: 82, fill: 'orange', size: 13, text: '"It prints 3, I expected\n2. So the key is wrong.\nLet me look."' },
      { t: 'line', x1: 660, y1: 200, x2: 660, y2: 218 },
      { t: 'line', x1: 660, y1: 218, x2: 96, y2: 218 },
      { t: 'arrow', x1: 96, y1: 218, x2: 96, y2: 200 },
      { t: 'text', x: 378, y: 238, text: 'next small piece: same loop', size: 14, anchor: 'middle', color: '#5c6478' },
      { t: 'note', x: 14, y: 254, w: 732, h: 44, fill: 'yellow', size: 14, text: 'If the output differs from your example, say which one you trust and why, BEFORE you change anything.' },
    ] } },
    `## Step 7 in practice: say the cost, and count it
"What is the complexity?" has a short answer. **Count what grows with the input.** One loop over it is O(n). A loop inside that loop is O(n squared). A sort is O(n log n). A dict or set lookup is O(1) on average, and a binary search is O(log n). Say **time and memory**, and what happens with a hundred times more input. An O(n squared) solution is usually repaired with a dict, a set, a sort or \`bisect\`.`,
    { sketch: { w: 760, h: 316, caption: 'The five costs you will name. Each step down the ladder is a bigger bill when the input grows.', items: [
      { t: 'table', x: 14, y: 42, title: 'the five costs and how many steps they take', cols: ['cost', 'what it looks like in Python', 'n = 1,000', 'n = 1 lakh'], colW: [112, 340, 110, 150], rows: [['O(1)', 'dict or set lookup, append', '1', '1'], ['O(log n)', 'bisect on a sorted list', 'about 10', 'about 17'], ['O(n)', 'one loop, sum, max, one pass over a file', '1,000', '1,00,000'], ['O(n log n)', 'sorted(), sort then one pass', 'about 10,000', 'about 17 lakh'], ['O(n squared)', 'nested loops, x in a list inside a loop', '10 lakh', '1,000 crore']], rowH: 30, hl: [4] },
      { t: 'note', x: 14, y: 244, w: 362, h: 62, fill: 'yellow', size: 14, text: 'Say it like this: "The simple way is O(n squared).\nWith a dictionary it is O(n) time and O(n) memory."' },
      { t: 'note', x: 392, y: 244, w: 358, h: 62, fill: 'grey', size: 14, text: 'The usual repair of O(n squared): a dict, a set,\na sort, or bisect. Remove the repeated work.' },
    ] } },
    { py: {
      title: 'Count the steps: four ways to check a list for a duplicate',
      starter: `import random
from functools import cmp_to_key

def steps_nested_loops(items):
    """Compare every pair. Counts the comparisons."""
    steps = 0
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            steps += 1
            if items[i] == items[j]:
                return steps
    return steps

def steps_set(items):
    """One set lookup per item."""
    seen, steps = set(), 0
    for x in items:
        steps += 1
        if x in seen:
            return steps
        seen.add(x)
    return steps

def steps_sort_then_neighbours(items):
    """Sort, then compare each item with the next one. Counts the comparisons of the sort plus the pass."""
    comparisons = 0
    def compare(a, b):
        nonlocal comparisons
        comparisons += 1
        return (a > b) - (a < b)
    ordered = sorted(items, key=cmp_to_key(compare))
    steps = comparisons
    for a, b in zip(ordered, ordered[1:]):
        steps += 1
        if a == b:
            break
    return steps

def steps_binary_search(ordered, target):
    low, high, steps = 0, len(ordered), 0
    while low < high:
        steps += 1
        middle = (low + high) // 2
        if ordered[middle] < target:
            low = middle + 1
        else:
            high = middle
    return steps

print(f"{'n':>6} {'nested loops':>13} {'set':>6} {'sort + pass':>12} {'binary search':>14}")
for n in (250, 500, 1000, 2000):
    items = random.Random(n).sample(range(n * 10), n)      # n different numbers: no duplicate, the worst case
    print(f"{n:>6} {steps_nested_loops(items):>13,} {steps_set(items):>6,} {steps_sort_then_neighbours(items):>12,} {steps_binary_search(sorted(items), items[0]):>14}")`,
      note: 'Count the steps instead of timing them: the numbers do not depend on your computer. When n doubles, the nested loops need four times as many steps (n times n minus 1, divided by 2: 31,125 for 250 items and 1,999,000 for 2,000), the set pass needs twice as many, the sort a little more than twice as many, and the binary search just one more. These are the shapes O(n squared), O(n), O(n log n) and O(log n). Experiment: add the line items[1] = items[0] after the line that makes items. The nested loops and the set now stop after 1 and 2 steps (the best case), but the sort still has to sort everything.',
    } },
    `## A practice routine that suits you
Practising Python is not "do many problems". It is "**learn from each one**". A routine that fits your life has four parts:

1. **Choose by pattern, not by count.** Pick the family you are weakest at and repeat it until the template feels automatic.
2. **Three passes on each problem.** *Understand*: restate it and write the example by hand. *Solve*: the seven steps, aloud, with your own tests. *Improve*: state the cost, then ask what breaks on a million rows and whether it is safe to run twice.
3. **Keep a mistake log.** Write the problem, the pattern, **what went wrong** and the one-line fix. Read it before you start: a few mistakes cause most of your errors.
4. **Come back to it.** Redo old problems after other work, so you recall the method and not the answer.

Also practise **without autocomplete**, **aloud**, and **reading** code from earlier lessons as in a code review. After the four problems below, your log might look like this:

| Problem | Pattern | What went wrong | The fix |
|---|---|---|---|
| duplicate GL lines | hash map | the key used text, so 0 and 0.00 differed | key with Decimal |
| busiest window | sliding window | two events 60 seconds apart shared a window | closed or half-open? |
| load payments twice | idempotency | the second run doubled the ledger | skip known keys |
| top two amounts | mutating the input | sort() changed the caller's list | use sorted() |`,
    `## Four interview-style problems
Each problem is worded as an interviewer would say it, with the function name and the rules spelled out so it can be checked. **Use the method.** Time yourself (a phone timer is enough) and write down how long each took and what went wrong. There is no target: your own times going down is the point. The tests check the traps of the list above.`,
    { pychallenge: {
      id: 'python-interview-method-ch1',
      prompt: 'Messy money text. Write `parse_amount(text)` for a column that comes from a bank file or an ERP export. Return a `Decimal` with exactly two decimal places, rounded half up. Spaces around the number and after a leading `₹` sign are ignored, and commas are ignored (so `1,25,000.50` works). A number in brackets, `(1,200.00)`, or with a leading minus, `-45.5`, is negative. Anything else raises `ValueError`: an empty or blank string, `None` or any value that is not text, letters, `NaN`, `Infinity`, `1e5`, two dots, a plus sign, a minus inside brackets, a sign or a `₹` in the wrong place. Never use `float`.',
      starter: `from decimal import Decimal

def parse_amount(text):
    # TODO: strip, remove the rupee sign and the commas, handle (brackets) and a leading minus,
    #       reject everything that is not a plain number, then quantize to two places (ROUND_HALF_UP)
    return Decimal(text)
`,
      tests: `from decimal import Decimal

def rejects(value):
    try:
        parse_amount(value)
    except ValueError:
        return True
    return False

assert parse_amount("₹ 1,25,000.50") == Decimal("125000.50")
assert parse_amount("1,234") == Decimal("1234.00")
assert str(parse_amount("1,234")) == "1234.00", "two decimal places"
assert parse_amount("  99.9  ") == Decimal("99.90")
assert parse_amount("(1,200.00)") == Decimal("-1200.00")
assert parse_amount("-45.5") == Decimal("-45.50")
assert parse_amount("₹0") == Decimal("0.00")
assert parse_amount(".5") == Decimal("0.50")
assert parse_amount("10.005") == Decimal("10.01"), "round half up, with Decimal"
assert parse_amount("2.675") == Decimal("2.68")
assert parse_amount("1,00,00,000") == Decimal("10000000.00")
assert parse_amount("123456789012345678.99") == Decimal("123456789012345678.99"), "a float would lose digits"
assert isinstance(parse_amount("5"), Decimal)
for bad in [None, 12.5, 100, "", "   ", "abc", "NaN", "Infinity", "-Infinity", "1e5", "12.3.4", "₹", "₹₹5", "12₹", "()", "(5", "5)", "--5", "+5", "(-5)", "5-", "12,50.x"]:
    assert rejects(bad), f"{bad!r} must raise ValueError"`,
      solution: `import re
from decimal import Decimal, ROUND_HALF_UP

def parse_amount(text):
    if not isinstance(text, str):
        raise ValueError(f"not text: {text!r}")
    s = text.strip()
    if s.startswith("₹"):
        s = s[1:].strip()
    negative = False
    if s.startswith("(") and s.endswith(")"):
        negative, s = True, s[1:-1].strip()
    elif s.startswith("-"):
        negative, s = True, s[1:].strip()
    s = s.replace(",", "")
    if not re.fullmatch(r"[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+", s):
        raise ValueError(f"not an amount: {text!r}")
    value = Decimal(s).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return -value if negative else value
`,
      hint: 'Check `isinstance(text, str)` first. Strip the text, remove one leading `₹`, then look for brackets or a leading minus and remember the sign. Remove the commas. Accept the rest only if `re.fullmatch(r"[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+", s)` matches: that single check rejects letters, `NaN`, `1e5`, two dots, a plus sign and an empty string, so `Decimal` never sees them. Then `Decimal(s).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)` and apply the sign.',
    } },
    { pychallenge: {
      id: 'python-interview-method-ch2',
      prompt: 'The busiest window. Our bank API allows only a limited number of calls in any window of `width` seconds. Write `busiest_window(times, width)`. `times` is an iterable of call times in seconds (numbers, in any order, repeats allowed). Return the **largest number of calls that fit in one window**. Calls fit together when the last time minus the first time is **less than** `width`: two calls exactly `width` seconds apart do not. An empty input gives `0`. A `width` of zero or less raises `ValueError`. Do not change the input. The tests also count your operations on 2,000 calls, so do not compare every pair.',
      starter: `def busiest_window(times, width):
    # TODO: check the width; sort a COPY of the times; keep two indexes, left and right;
    #       move left forward while times[right] - times[left] >= width; the answer is the largest right - left + 1
    return 0
`,
      tests: `import operator
import random

assert busiest_window([], 60) == 0
assert busiest_window([5], 60) == 1
assert busiest_window([0, 60], 60) == 1, "two calls exactly width apart do not share a window"
assert busiest_window([0, 59], 60) == 2
assert busiest_window([10, 1, 2, 30, 3], 3) == 3, "the input is not sorted"
assert busiest_window([1, 2, 3, 10], 2) == 2
assert busiest_window([5, 5, 5, 5], 1) == 4, "several calls in the same second"
assert busiest_window([0.5, 1.2, 1.4], 1) == 3
assert busiest_window([-3, -2, 10], 2) == 2
assert busiest_window([1, 2, 3], 1000) == 3
assert busiest_window((t for t in [1, 2, 3]), 5) == 3, "a generator is allowed"
for bad_width in (0, -5):
    try:
        busiest_window([1, 2], bad_width)
        raise AssertionError("a width of zero or less must raise ValueError")
    except ValueError:
        pass
data = [30, 10, 20, 11]
before = list(data)
busiest_window(data, 5)
assert data == before, "the input list must not be changed"

def counted(op):
    def method(self, other):
        Tick.ops += 1
        if Tick.ops > Tick.limit:
            raise AssertionError("too many operations: sort once and keep two pointers, do not compare every pair of calls")
        return op(int(self), int(other))
    return method

class Tick(int):
    ops = 0
    limit = 0
    __lt__ = counted(operator.lt)
    __le__ = counted(operator.le)
    __gt__ = counted(operator.gt)
    __ge__ = counted(operator.ge)
    __sub__ = counted(operator.sub)
    __rsub__ = counted(lambda a, b: b - a)

def run_counted(values, width):
    ticks = [Tick(v) for v in values]
    Tick.ops, Tick.limit = 0, 40 * len(ticks)
    return busiest_window(ticks, width)

shuffled = random.Random(1).sample(range(0, 6000, 3), 2000)
assert run_counted(shuffled, 10) == 4
assert run_counted(range(2000), 10000) == 2000, "all calls fit in one window"`,
      solution: `def busiest_window(times, width):
    if width <= 0:
        raise ValueError("width must be positive")
    ordered = sorted(times)
    best = left = 0
    for right, t in enumerate(ordered):
        while t - ordered[left] >= width:
            left += 1
        best = max(best, right - left + 1)
    return best
`,
      hint: 'Raise `ValueError` first when `width <= 0`. Then `ordered = sorted(times)`: it makes a new list (the caller\'s data stays as it was) and it also accepts a generator. Walk `right` over `ordered` with `enumerate`. While `t - ordered[left] >= width`, move `left` one step forward. The window then holds `right - left + 1` calls: keep the largest. Both indexes only move forward, so the pass is O(n).',
    } },
    { pychallenge: {
      id: 'python-interview-method-ch3',
      prompt: 'A payment loader that is safe to run twice. Write `load_payments(ledger, payments)`. `ledger` is a dict `{payment_id: Decimal amount}`. `payments` is any iterable (it may be a generator) of `(payment_id, amount_text)` pairs. Clean each id with `strip()` and `upper()`; an id that is not text or is blank raises `ValueError`. The amount must be **text** (a float is a `ValueError`) that `Decimal` can read, finite and above zero, otherwise `ValueError`. A payment whose id is already in the ledger, or appeared earlier in this batch, is **skipped** (the first line wins). The load is **all or nothing**: if any line is bad, raise `ValueError` and leave the ledger exactly as it was. Return `(inserted, skipped)`. Running the same batch twice must change nothing the second time.',
      starter: `from decimal import Decimal

def load_payments(ledger, payments):
    # TODO: clean and check every line first; collect the new ones in a separate dict;
    #       change the ledger only after ALL lines passed; count skipped lines
    for payment_id, amount_text in payments:
        ledger[payment_id] = amount_text
    return (len(ledger), 0)
`,
      tests: `from decimal import Decimal

ledger = {}
batch = [("PAY-001", "1250.50"), ("PAY-002", "99.00"), ("PAY-001", "7.00")]
assert load_payments(ledger, batch) == (2, 1)
assert ledger == {"PAY-001": Decimal("1250.50"), "PAY-002": Decimal("99.00")}, "the first line with an id wins"
assert load_payments(ledger, batch) == (0, 3), "the same batch again changes nothing"
assert ledger == {"PAY-001": Decimal("1250.50"), "PAY-002": Decimal("99.00")}

ledger = {"PAY-001": Decimal("5.00")}
assert load_payments(ledger, [(" pay-001 ", "9.00"), ("pay-003", "10")]) == (1, 1)
assert ledger == {"PAY-001": Decimal("5.00"), "PAY-003": Decimal("10")}, ledger
assert load_payments({}, []) == (0, 0)
assert load_payments({}, (p for p in [("A", "1.00")])) == (1, 0), "a generator is allowed"

def refuses(before, payments):
    ledger = dict(before)
    try:
        load_payments(ledger, payments)
    except ValueError:
        assert ledger == before, "a rejected batch must leave the ledger exactly as it was"
        return True
    return False

good = ("P1", "10.00")
assert refuses({}, [good, ("P2", "abc")])
assert refuses({}, [good, ("P2", "-5")])
assert refuses({}, [good, ("P2", "0")])
assert refuses({}, [good, ("P2", "NaN")])
assert refuses({}, [good, ("P2", "Infinity")])
assert refuses({}, [good, ("P2", 12.5)]), "an amount must be text, never a float"
assert refuses({}, [good, ("   ", "5.00")])
assert refuses({}, [good, (None, "5.00")])
assert refuses({"P9": Decimal("1")}, (p for p in [good, ("P2", "x")]))`,
      solution: `from decimal import Decimal, InvalidOperation

def load_payments(ledger, payments):
    new, skipped = {}, 0
    for payment_id, amount_text in payments:
        if not isinstance(payment_id, str) or not payment_id.strip():
            raise ValueError(f"bad payment id: {payment_id!r}")
        key = payment_id.strip().upper()
        if not isinstance(amount_text, str):
            raise ValueError(f"the amount of {key} must be text")
        try:
            amount = Decimal(amount_text)
        except InvalidOperation:
            raise ValueError(f"bad amount for {key}: {amount_text!r}") from None
        if not amount.is_finite() or amount <= 0:
            raise ValueError(f"the amount of {key} must be above zero")
        if key in ledger or key in new:
            skipped += 1
        else:
            new[key] = amount
    ledger.update(new)
    return len(new), skipped
`,
      hint: 'Do not touch `ledger` inside the loop. Keep a new dict `new` and a counter `skipped`. For each line: check that the id and the amount are text, clean the id, convert the amount with `Decimal(...)` (turn `InvalidOperation` into `ValueError`), then reject amounts that are not `is_finite()` or not above zero. Skip an id that is in `ledger` or already in `new`. Only after the loop call `ledger.update(new)`: a bad line raised before, so the ledger was never changed, and a generator was read only once.',
    } },
    { pychallenge: {
      id: 'python-interview-method-ch4',
      prompt: 'Reconcile two lists. Write `reconcile(books, bank, tolerance=Decimal("0"))`. `books` and `bank` are iterables (maybe generators) of `(invoice_no, amount)` pairs where `amount` is a `Decimal`. Clean each invoice number with `strip()` and `upper()`. If an invoice appears several times on one side, **add** its amounts (part payments). Return a dict with four keys, all lists sorted by invoice number (as plain text): `matched` (invoices on both sides whose totals differ by **no more than** `tolerance`), `amount_differs` (`(invoice_no, books_total, bank_total)` for invoices on both sides whose totals differ by **more than** `tolerance`), `only_in_books` and `only_in_bank` (invoice numbers). Do not change the inputs.',
      starter: `from decimal import Decimal

def reconcile(books, bank, tolerance=Decimal("0")):
    # TODO: total the amounts per cleaned invoice number on each side (a dict of Decimal),
    #       then compare the two dicts with set operations on their keys
    return {"matched": [], "amount_differs": [], "only_in_books": [], "only_in_bank": []}
`,
      tests: `from decimal import Decimal as D

books = [("INV/1", D("100.00")), ("INV/2", D("250.50")), ("inv/3 ", D("40.00")), ("INV/4", D("75.00")), ("INV/6", D("10.00"))]
bank = [("INV/1", D("100.00")), ("INV/2", D("250.00")), ("INV/3", D("40.00")), ("INV/5", D("60.00"))]
copy_of_books, copy_of_bank = list(books), list(bank)
result = reconcile(books, bank)
assert result == {
    "matched": ["INV/1", "INV/3"],
    "amount_differs": [("INV/2", D("250.50"), D("250.00"))],
    "only_in_books": ["INV/4", "INV/6"],
    "only_in_bank": ["INV/5"],
}, result
assert books == copy_of_books and bank == copy_of_bank, "the inputs must not be changed"

result = reconcile([("INV/7", D("100.00"))], [("INV/7", D("60.00")), ("inv/7", D("40.00"))])
assert result["matched"] == ["INV/7"] and result["amount_differs"] == [], "part payments are added"

small = D("0.40")
off = [("INV/8", D("1000.40"))], [("INV/8", D("1000.00"))]
assert reconcile(*off)["amount_differs"] == [("INV/8", D("1000.40"), D("1000.00"))], "no tolerance means an exact match"
assert reconcile(*off, tolerance=small)["matched"] == ["INV/8"], "a difference equal to the tolerance still matches"
assert reconcile(*off, tolerance=D("0.39"))["amount_differs"] != [], "above the tolerance does not match"

result = reconcile([("INV/10", D("1")), ("INV/2", D("1"))], [])
assert result["only_in_books"] == ["INV/10", "INV/2"], "sorted as text"
assert reconcile([], []) == {"matched": [], "amount_differs": [], "only_in_books": [], "only_in_bank": []}
assert reconcile(iter(books), iter(bank)) == reconcile(books, bank), "generators are allowed"
assert reconcile([], bank)["only_in_bank"] == ["INV/1", "INV/2", "INV/3", "INV/5"]`,
      solution: `from collections import defaultdict
from decimal import Decimal

def totals(pairs):
    result = defaultdict(Decimal)
    for invoice_no, amount in pairs:
        result[invoice_no.strip().upper()] += amount
    return result

def reconcile(books, bank, tolerance=Decimal("0")):
    mine, theirs = totals(books), totals(bank)
    matched, differs = [], []
    for invoice in sorted(mine.keys() & theirs.keys()):
        if abs(mine[invoice] - theirs[invoice]) <= tolerance:
            matched.append(invoice)
        else:
            differs.append((invoice, mine[invoice], theirs[invoice]))
    return {
        "matched": matched,
        "amount_differs": differs,
        "only_in_books": sorted(mine.keys() - theirs.keys()),
        "only_in_bank": sorted(theirs.keys() - mine.keys()),
    }
`,
      hint: 'Write a helper `totals(pairs)` that returns a `defaultdict(Decimal)` and adds each amount to the cleaned invoice number. Then use set operations on the keys: `mine.keys() & theirs.keys()` for invoices on both sides, `mine.keys() - theirs.keys()` for only in the books. Sort every list. For invoices on both sides use `abs(a - b) <= tolerance`.',
    } },
    { warn: 'A green test on **your own example** proves little: the traps live in the cases you did not write. Add one case that could fail. And use `assert` for tests only: `python -O` removes assert statements, so real input checks must `raise ValueError`.' },
    `## Model answers to the questions of this phase
Here are the nine questions of this phase, and the method question before them. Read each answer aloud and change the words until it sounds like you. The code in the answers runs in the two playgrounds after them.`,
    { interview: `**"Walk me through how you approach a coding problem you have not seen before."**
Model answer: "First I restate the problem and say what the function returns. I ask about the input: type, size, duplicates, \`None\`, sorted or not, and whether I may change it. I write a small example with the answer I expect, so I have a test. I name the pattern, such as a dictionary for grouping, and say the slow way and its cost. I write small functions and run each on the example. Then I test the edges. At the end I state the time and memory cost, how I would test it properly, and whether it is safe to run twice. I say all of this aloud as I go."

**Follow-up: "What do you do when you are stuck?"** "I say what I am trying to do, shrink the problem to one item, write the slow obvious version first, and ask a clarifying question."` },
    { interview: `**"What is the difference between a list, a tuple and a set?"**
"A list is ordered and changeable: it fits a collection that grows. A tuple is ordered and fixed, so it fits a record such as (entity, month), and it can be a dictionary key if its items are hashable. A set has no order and no duplicates, and \`x in s\` is one hash lookup instead of a scan, so I use it to de-duplicate and to ask "have I seen this?" To remove duplicates and keep the order I use \`list(dict.fromkeys(items))\`."

\`\`\`python
"INV/3" in ["INV/1", "INV/2", "INV/3"]   # scans the list: O(n)
"INV/3" in {"INV/1", "INV/2", "INV/3"}   # one hash lookup: O(1) on average
{("IN01", "2026-09"): 1250}   # a tuple is a valid key, a list is not
\`\`\`

**"What is the mutable default argument problem?"**
"A default value is created once, when the function is defined, not on each call. If it is a list or a dict, every call that leaves it out shares that one object, so data leaks from call to call. I write \`lines=None\` and create the list inside: \`if lines is None: lines = []\`."` },
    { interview: `**"What is a generator, and why use one?"**
"A function with \`yield\` that makes values one at a time and pauses between them. Memory stays flat however big the data is, so I use it to stream big files and API pages and to build pipeline stages. The trade-off: a generator is used up after one pass and has no length or index."

**"What is the link between \`__eq__\` and \`__hash__\`?"**
"Equal objects must have equal hashes. If I define \`__eq__\` and no \`__hash__\`, Python sets \`__hash__\` to \`None\`, so the objects cannot go into a set or be dictionary keys. I define both from the same fields, or use a frozen dataclass. I never hash fields that can change."

\`\`\`python
class Gstin:
    def __init__(self, text):
        self.text = text.strip().upper()
    def __eq__(self, other):
        return isinstance(other, Gstin) and self.text == other.text
    def __hash__(self):
        return hash(self.text)
\`\`\`

**"What is a decorator?"**
"A function that takes a function and returns a new one, usually a wrapper that runs code before and after the call. \`@name\` above \`def f\` means \`f = name(f)\`. I use it for logging, timing, retry and caching, and add \`functools.wraps\` so the name survives. A decorator with settings has one more layer."` },
    { py: {
      title: 'The language answers, run for real: list, tuple, set, generator, __eq__ and __hash__, decorator',
      starter: `from decimal import Decimal
from functools import wraps
from itertools import islice

# 1. list, tuple, set
seen_list = ["INV/1", "INV/2", "INV/3"]
seen_set = set(seen_list)
print("1. 'INV/3' in the list:", "INV/3" in seen_list, "(a scan) | in the set:", "INV/3" in seen_set, "(one hash lookup)")
by_entity_month = {("IN01", "2026-09"): 1250}
print("   a tuple is a key:", by_entity_month[("IN01", "2026-09")])
try:
    by_entity_month[["IN01", "2026-09"]] = 1
except TypeError as error:
    print("   a list is not a key:", type(error).__name__)
print("   duplicates removed, order kept:", list(dict.fromkeys(["B", "A", "B", "C", "A"])))

# 2. a generator is lazy: a million possible values, only three are made
made = []
def amounts():
    for n in range(1_000_000):
        made.append(n)
        yield n * 100

print("2. first three:", list(islice(amounts(), 3)), "| values made:", len(made))

# 3. __eq__ without __hash__
class GstinNoHash:
    def __init__(self, text):
        self.text = text.strip().upper()
    def __eq__(self, other):
        return isinstance(other, GstinNoHash) and self.text == other.text

class Gstin:
    def __init__(self, text):
        self.text = text.strip().upper()
    def __eq__(self, other):
        return isinstance(other, Gstin) and self.text == other.text
    def __hash__(self):
        return hash(self.text)

try:
    {GstinNoHash("27AAAAA0000A1Z5")}
except TypeError as error:
    print("3. __eq__ only:", type(error).__name__, "(unhashable: it cannot go into a set)")
print("   __eq__ and __hash__:", len({Gstin("27AAAAA0000A1Z5"), Gstin(" 27aaaaa0000a1z5 ")}), "entry in the set")

# 4. a decorator that counts calls, with wraps
def count_calls(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@count_calls
def gst(amount):
    """18 percent GST on a Decimal amount."""
    return (amount * Decimal("0.18")).quantize(Decimal("0.01"))

print("4.", gst(Decimal("1999.99")), gst(Decimal("500")), "| calls:", gst.calls, "| name kept by wraps:", gst.__name__)`,
      note: 'Item 1 repeats the collections lesson: the tuple is a valid key, the list is not, and dict.fromkeys removes duplicates and keeps the order. Item 2 shows laziness: a million values are possible and only three were made. Item 3 shows the trap: with __eq__ only, the class is unhashable, so building the set raises TypeError. With __hash__ built from the same cleaned text, two spellings of the same (made-up) GSTIN become one entry. In item 4 the wrapper keeps its call count on itself, and wraps keeps the original name.',
    } },
    { interview: `**"Threads, processes or asyncio: what does the GIL change?"**
"In CPython the Global Interpreter Lock lets one thread run Python code at a time. Threads still help when the work is waiting for the network, a disk or a database, because a waiting thread releases the lock. They do not speed up CPU-bound Python: for that I use processes, or numpy and pandas. asyncio runs many tasks on one thread and switches at \`await\`. It is light for thousands of waits, but one blocking call freezes every task."

**"How do you test code that calls an API?"**
"Not with the real API. I pass the function that makes the call into my code, so a test can pass a fake that returns a prepared answer, or fails twice and then succeeds. I pass the sleep function too, so retry tests are instant and I can assert the waits."

**"How do you make a script idempotent?"**
"Idempotent means that running it twice leaves the same result as running it once. I give each unit of work a stable key, such as a file hash or GSTIN plus invoice number, and skip or upsert by that key. The date is a parameter, not \`now\`. The "done" marker is written in the same transaction as the load. Then I test by running it twice."

**"Why not use float for money?"**
"Floats are binary and cannot store most decimal fractions exactly: \`0.1 + 0.2\` is \`0.30000000000000004\`. Small errors add up and totals stop reconciling. I use \`Decimal\` made from strings and round once, or I count integer paise."` },
    { py: {
      title: 'The engineering answers, run for real: a fake API, a script that runs twice, and money',
      starter: `import hashlib
from decimal import Decimal, ROUND_HALF_UP

# 5. test code that calls an API: pass the call and the sleep in, so a test can fake both
def fetch_rate(get_json, sleep, day, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            return Decimal(get_json(f"/rates?date={day}")["INR"])
        except TimeoutError:
            if attempt == attempts:
                raise
            sleep(2 ** (attempt - 1))                      # wait 1 second, then 2, then 4 ...

scripted = [TimeoutError(), TimeoutError(), {"INR": "83.25"}]     # two timeouts, then an answer
waits = []
def fake_get_json(url):
    item = scripted.pop(0)
    if isinstance(item, Exception):
        raise item
    return item

print("5. rate:", fetch_rate(fake_get_json, waits.append, "2026-09-30"), "| waits asked for:", waits)
scripted = [TimeoutError(), TimeoutError(), TimeoutError()]
waits = []
try:
    fetch_rate(fake_get_json, waits.append, "2026-09-30")
except TimeoutError:
    print("   three timeouts: TimeoutError is raised after the waits", waits)

# 6. an idempotent load: a file is loaded once, recognised by its fingerprint
loaded_lines, loaded_files = [], set()
def load_file_once(content):
    digest = hashlib.sha256(content).hexdigest()
    if digest in loaded_files:
        return "skipped"
    loaded_lines.extend(content.decode().splitlines())
    loaded_files.add(digest)             # in a database: in the SAME transaction as the insert
    return "loaded"

statement = b"INV/1,1000.00\\nINV/2,250.00\\n"
print("6. first run:", load_file_once(statement), "| second run:", load_file_once(statement), "| lines in the ledger:", len(loaded_lines))

# 7. why not float for money
print("7. float:", 0.1 + 0.2, "| round(2.675, 2) =", round(2.675, 2))
print("   Decimal:", Decimal("0.1") + Decimal("0.2"), "| half up:", Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
paise = [int(Decimal(x) * 100) for x in ("0.10", "0.20")]
print("   integer paise:", paise, "add up to", sum(paise))`,
      note: 'Item 5: fetch_rate never touches the network or the clock, so the test passes a scripted fake (two timeouts and then an answer) and a list that records the waits. The retry rule, wait 1 second and then 2, is checked instantly. Item 6: the file is recognised by its SHA-256 fingerprint, so the second run skips it and the ledger still has 2 lines. In a database the marker and the rows are written in one transaction. Item 7: float shows 0.30000000000000004 and round(2.675, 2) gives 2.67, Decimal gives 0.3 and, rounded half up, 2.68, and integer paise add up exactly.',
    } },
    { real: 'The seven steps are not only for interviews. When a finance controller writes *"can you list the duplicate postings in the GL?"*, the professional reply is steps 1 and 2: *"Duplicate by what? Do I delete them or only report them? Which entity and which month?"* Good questions at the start save a great deal of rework, and the answers become the **docstring** of your function and the note under the report.' },
    `## What you can do now: the Python phase in one table
The 26 lessons of the Python phase add up to this:

| Modules | You can now |
|---|---|
| Core and idioms | write functions, generators, decorators, classes and typed models, and handle errors |
| Files, text, time and money | read files, parse text, handle dates and \`Decimal\` money |
| Concurrency and engineering | choose threads, processes or asyncio; profile, log, test, lint and package code |
| Data work and interview | call databases and APIs, schedule jobs, keep secrets safe, and solve problems with a method |

Next comes **pandas**. Keep practising: the four problems above, redone every so often, are your first practice set.`,
    `## Recap
- Interviews test **how you think**. Do the **seven steps** in order and **say them aloud**: restate, clarify, example, plan, write, test the edges, discuss.
- Write a **tiny example** first: it is your first test. Decide what to return for **empty input and no answer**, and check that the input was **not changed**.
- **Name the pattern and the cost**: dict or set, sort first, two pointers, heap, \`bisect\`. Say the slow way, then the fast way.
- **Check the traps**: mutable default, float money, mutating the input, exhausted generator, \`groupby\` on unsorted data, off-by-one, empty input, shared state, bare \`except\`, blocking call in async code, \`==\` without \`__hash__\`.
- When stuck, **shrink the problem** and write the slow version first. **Practise by pattern**, keep a **mistake log** and practise **out loud**.`,
  ],
  quiz: [
    { q: 'You are given a vague coding problem in an interview. What should you do first?', o: ['Start typing the solution at once, to show how fast you are', 'Pick the most advanced library function you know and build around it', 'Restate the problem, name the output, and ask about the input: type, size, duplicates, `None`, and whether you may change it', 'Write the final tests first and ask no questions, so nobody disturbs you'], a: 2, why: 'Restating and clarifying prevents you from solving the wrong problem, and it shows the interviewer how you think, which is what they are testing.' },
    { q: 'A function has an empty list as the default value of a parameter, written `lines=[]`. It appends the new line to that list and returns the list. It is called twice: first with "DR 100", then with "CR 100". What does the second call return?', o: ['`["DR 100", "CR 100"]`, because the default list is created once and shared by every call', '`["CR 100"]`, because each call starts with a new empty list', '`None`, because `append` returns nothing', 'a `TypeError`, because a list cannot be a default value'], a: 0, why: 'A default value is evaluated once, when `def` runs. Both calls append to the same list. The fix is `lines=None` and `if lines is None: lines = []` inside.' },
    { q: 'A script loads a bank statement into a table. It was run twice by mistake and every line is now there twice. Which change makes it safe to run twice (idempotent)?', o: ['Schedule it at a quiet time, so that two runs can never overlap or repeat', 'Wrap the load in `try/except` and ignore every error, so a second run cannot fail', 'Retry the load until it succeeds, so that no line is ever missing', 'Give each line a stable key, such as the file hash or GSTIN plus invoice number, and skip or upsert by that key'], a: 3, why: 'Idempotent means that a second run leaves the same result as the first. A stable key lets the second run recognise what is already loaded. Scheduling, ignoring errors and retrying do not do that.' },
    { q: 'A loop over n invoice numbers checks `number in seen`, where seen is a list that grows with every new number. What is the cost, and what is the fix?', o: ['O(n), and there is nothing to fix', 'O(n squared), because each `in` scans the list. Use a set for `seen`', 'O(log n), because Python searches lists with binary search', 'O(1), because a list lookup is a hash lookup'], a: 1, why: 'The `in` test on a list scans it, so n scans of up to n items are O(n squared). A set answers `in` with one hash lookup on average, so the loop becomes O(n).' },
    { q: 'You must call 200 slow supplier APIs and wait for each answer. Later you must run a heavy pure-Python calculation on every row of a big file. What fits best?', o: ['Threads for both, because Python threads always run in parallel on every CPU core', 'Processes for both, because the GIL stops every kind of waiting from overlapping', 'Threads or asyncio for the API calls (waiting), and processes or pandas for the calculation (computing)', 'asyncio for both, because it removes the GIL and runs the calculation in parallel'], a: 2, why: 'The GIL lets one thread run Python code at a time, but a waiting thread releases it, so waits overlap. CPU-bound Python needs separate processes or native code. asyncio does not remove the GIL.' },
    { q: 'You are stuck on a problem in an interview. Which approach is best?', o: ['Stay silent and think until the idea comes, so the interviewer sees you concentrate', 'Say what you are trying to do, shrink the problem, write the slow obvious version first, and ask a question', 'Say that you do not know the answer and ask to move on to the next question', 'Guess a library function that might exist and hope that nobody notices'], a: 1, why: 'Interviewers want to see problem solving. Narrating, simplifying and asking questions shows it even before the answer is complete, and a working slow solution can be improved.' },
  ],
  task: {
    title: 'Your own Python interview kit',
    steps: [
      'In `C:\\fde\\py-recap` create `interview_kit.py`. At the top, write the seven steps as a comment card in your own words, with one sentence you would say aloud at each step.',
      'Add the four timed problems (`parse_amount`, `busiest_window`, `load_payments` and `reconcile`) and solve them again from scratch, using the seven steps. Above each function write as comments: the restated problem, your assumptions, the tiny example, the pattern and the cost. Note how long each one took.',
      'Create `test_interview_kit.py` with at least five cases per function, including empty input, `None` and a check that the input was not changed. Run it with `pytest` on your laptop (or with plain `assert` statements).',
      'Run the duplicate-line code from the worked example on your own `fact_gl.csv` (exported in the *Comprehensions and control flow* task). It must find 3 groups of duplicate lines, the same lines that your SQL query found in the SQL phase. Print the surplus debit and credit.',
      'Run the six spot-the-bug snippets on your laptop. For each one write the one-line rule from the checklist that would have caught it. Then write two more bugs of your own from the checklist (an off-by-one and a blocking call in async code) with their fixes.',
      'Create `mistake_log.csv` with the columns `problem`, `pattern`, `what_went_wrong` and `the_fix`, and at least five rows from the lessons so far. Write a few lines of Python that count the rows per pattern with `Counter` and print the pattern you fail most often.',
      'Record yourself (a voice memo on your phone) answering the nine interview questions of this phase, one at a time. Listen back and write two things to change. Then write each answer in `interview_answers.md`, short enough to say in one breath per sentence.',
    ],
    deliverable: '`interview_kit.py` with the method card and four solutions, `test_interview_kit.py` (all passing), the duplicate-line output on your own GL export, the six bug rules, `mistake_log.csv` with its `Counter` output, and `interview_answers.md`.',
  },
};
