export default {
  id: 'python-functions',
  title: 'Functions',
  goal: 'You can write functions with positional, keyword, default, *args and **kwargs parameters, avoid the mutable-default trap, explain scope and closures, and use lambda, sorted with key, map and filter.',
  roadmap: ['functions: positional and keyword arguments, defaults', 'the mutable default argument trap', '*args and **kwargs', 'closures, lambda', 'sorted with key, map, filter'],
  blocks: [
    `## The problem
You clean a bank amount like \`"₹ 1,23,456.50 "\` in your GL script. Three weeks later you paste the same five lines into the GST script, then into the payroll script. One day the bank starts sending negative amounts as \`"(2,500.00)"\`. Now you must fix it in six places, and you will miss one.

A **function** fixes this. It is a named, reusable piece of code: you write the cleaning once, give it a name, and call it from everywhere. In Excel the nearest idea is a named formula or a \`LAMBDA\`. In Python functions are even more central: they are *values* you can store in a dict, pass to other functions and return from functions. Understanding that is the key to decorators, callbacks, retries and almost every library you will use.

A good function does **one job**, has a clear name (\`clean_amount\`, \`load_gl_file\`), and **returns** its answer instead of printing it, so the caller can test it, store it or print it.`,
    `## Defining and calling
\`\`\`python
def gst_amount(taxable, rate=0.18):
    """Return the GST for a taxable value. rate is a fraction (0.18 = 18%)."""
    return round(taxable * rate, 2)

gst_amount(41460)             # 7462.8   (uses the default rate)
gst_amount(41460, 0.05)       # 2073.0
gst_amount(rate=0.12, taxable=1000)   # 120.0  (keywords, any order)
\`\`\`
Some vocabulary, because interviewers use it:
- **Parameters** are the names in the \`def\` line (\`taxable\`, \`rate\`). **Arguments** are the values you pass in the call.
- The text in triple quotes right after the \`def\` line is a *docstring*. \`help(gst_amount)\` and your editor show it.
- \`return\` sends a value back and ends the function. A function that never reaches a \`return\` gives back \`None\`.
- To "return two values" you return one **tuple**: \`return low, high\`, and the caller unpacks it: \`low, high = stats(xs)\`.
- Variables created inside a function are *local*: they exist only during the call.

### Four kinds of parameters
| Kind | Looks like | Rule |
|---|---|---|
| normal | \`def f(entity, month)\` | can be given by position or by name |
| with default | \`def f(rate=0.18)\` | optional; the default is used if you skip it |
| \`*args\` | \`def f(*amounts)\` | collects any number of extra **positional** arguments into a **tuple** |
| \`**kwargs\` | \`def f(**options)\` | collects any extra **named** arguments into a **dict** |

A bare \`*\` in the list makes everything after it **keyword-only**: the caller must write the name. This is the safest way to design flags: \`post(entity, month, *, dry_run=False)\` means nobody can accidentally write \`post("IN01", "2026-09", True)\` and wonder what \`True\` meant. The order in a \`def\` line is always: normal, defaults, \`*args\` (or a bare \`*\`), keyword-only, \`**kwargs\`.

The stars also work at the **call**: \`f(*values)\` spreads a list into separate arguments, and \`f(**config)\` spreads a dict into named arguments. That is how a config dict becomes a function call.`,
    { sketch: { w: 760, h: 322, caption: 'How a call is matched to the parameters: positions fill the first slots, names fill the rest, extras go to **options', items: [
      { t: 'text', x: 380, y: 24, text: 'def post_journal(entity, month, *, dry_run=False, **options):', font: 'mono', size: 13, anchor: 'middle', bold: true },
      { t: 'text', x: 55, y: 58, text: 'parameters', size: 15, bold: true, color: '#5c6478' },
      { t: 'box', x: 20, y: 68, w: 150, h: 62, label: 'entity', sub: 'required', fill: 'blue' },
      { t: 'box', x: 188, y: 68, w: 150, h: 62, label: 'month', sub: 'required', fill: 'blue' },
      { t: 'box', x: 372, y: 68, w: 170, h: 62, label: 'dry_run', sub: 'keyword-only, default False', fill: 'yellow', size: 17 },
      { t: 'box', x: 560, y: 68, w: 180, h: 62, label: '**options', sub: 'the rest, as a dict', fill: 'green' },
      { t: 'line', x1: 355, y1: 62, x2: 355, y2: 138, dashed: true, color: '#c0392b' },
      { t: 'text', x: 355, y: 52, text: 'bare star: after it, names are required', size: 13, color: '#c0392b', anchor: 'middle' },
      { t: 'arrow', x1: 95, y1: 200, x2: 95, y2: 134 },
      { t: 'arrow', x1: 263, y1: 200, x2: 263, y2: 134 },
      { t: 'arrow', x1: 457, y1: 200, x2: 457, y2: 134 },
      { t: 'arrow', x1: 650, y1: 200, x2: 650, y2: 134 },
      { t: 'text', x: 38, y: 190, text: 'arguments in the call', size: 15, bold: true, color: '#5c6478', anchor: 'start' },
      { t: 'box', x: 20, y: 206, w: 150, h: 40, fill: 'white' },
      { t: 'text', x: 95, y: 231, text: '"IN01"', font: 'mono', size: 13 },
      { t: 'box', x: 188, y: 206, w: 150, h: 40, fill: 'white' },
      { t: 'text', x: 263, y: 231, text: '"2026-09"', font: 'mono', size: 13 },
      { t: 'box', x: 372, y: 206, w: 170, h: 40, fill: 'white' },
      { t: 'text', x: 457, y: 231, text: 'dry_run=True', font: 'mono', size: 13 },
      { t: 'box', x: 560, y: 206, w: 180, h: 40, fill: 'white' },
      { t: 'text', x: 650, y: 231, text: 'source="SAP"', font: 'mono', size: 13 },
      { t: 'note', x: 20, y: 260, w: 720, h: 54, fill: 'yellow', size: 14, text: 'Positional arguments fill entity and month from the left.\nA named argument that matches no parameter lands in options: {"source": "SAP"}' },
    ] } },
    { py: {
      title: 'Arguments: positional, keyword, defaults, *args, **kwargs',
      starter: `def post_journal(entity, month, *, dry_run=False, **options):
    """entity and month are required; dry_run is keyword-only; extras land in options."""
    mode = "DRY RUN" if dry_run else "POSTED"
    return f"{mode}: {entity} {month} {options}"

print(post_journal("IN01", "2026-09"))
print(post_journal(month="2026-09", entity="SG01", dry_run=True))   # names: any order
print(post_journal("US01", "2026-09", source="SAP", batch=7))       # extras go to **options
try:
    post_journal("IN01", "2026-09", True)    # dry_run cannot be passed by position
except TypeError as e:
    print("TypeError:", e)

def total(*amounts):            # *args collects extra positional arguments into a tuple
    return sum(amounts)
print(total(), total(100), total(100, 250.5, 49.5))

values = [10, 20, 30]
print(total(*values))           # * spreads a list into separate arguments
config = {"entity": "IN01", "month": "2026-09", "dry_run": True}
print(post_journal(**config))   # ** spreads a dict into named arguments

def stats(amounts):
    return min(amounts), max(amounts), sum(amounts) / len(amounts)   # one tuple
low, high, avg = stats([100, 250, 400])
print(low, high, round(avg, 2))

def nothing():
    pass
print(nothing())                # no return statement: the answer is None
help(post_journal)`,
      note: 'Read the `TypeError` text: Python tells you exactly which call was wrong. Try calling `post_journal("IN01")` and read the message for a missing argument.',
    } },
    `## What a function can change: names, not boxes
Remember from the collections lesson that a variable is a *name tag* on an object. When you call a function, the parameter becomes a **new name tag on the same object** you passed. Python calls this *pass by object reference*:
- If the function **changes the object** (\`lines.append(...)\`), the caller sees the change, because it is one object with two names.
- If the function **points its name elsewhere** (\`lines = ["new"]\`), only the local name moves. The caller is unaffected.

This is why a function that silently sorts or empties the list you passed in is a bug magnet. The safe habit: **return a new value, do not modify the input**, unless the function's whole purpose is to modify it (and then say so in its name: \`add_line\`, \`clear_cache\`).

### The mutable default trap
This is the most famous Python interview question, and it comes from one fact: **default values are created once, when the \`def\` line runs, not each time you call the function.**
\`\`\`python
def add_error(message, errors=[]):     # the [] is built ONCE, stored on the function
    errors.append(message)
    return errors

add_error("bad IFSC")        # ['bad IFSC']
add_error("missing PAN")     # ['bad IFSC', 'missing PAN']   <- the old message is still here!
\`\`\`
Every call that skips \`errors\` shares the same list object. With numbers and strings this never shows, because they cannot change in place. With a list, dict or set it creates bugs that appear only on the second run of a long-running job. **The fix: default to \`None\` and build the list inside.**
\`\`\`python
def add_error(message, errors=None):
    if errors is None:
        errors = []                    # a NEW list on every call
    errors.append(message)
    return errors
\`\`\``,
    { sketch: { w: 760, h: 330, caption: 'A default value is made once, at def time. Every call that skips the argument shares that one object', items: [
      { t: 'text', x: 260, y: 22, text: 'def add_error(message, errors=[]) :  the [] is created ONCE', font: 'mono', size: 12, anchor: 'middle', bold: true },
      { t: 'box', x: 20, y: 46, w: 190, h: 66, label: 'function add_error', sub: 'keeps its defaults', fill: 'blue' },
      { t: 'arrow', x1: 214, y1: 79, x2: 300, y2: 79, label: 'default', ly: -14 },
      { t: 'table', x: 305, y: 56, title: 'the one shared list', cols: ['0', '1'], colW: [110, 130], rows: [['bad IFSC', 'missing PAN']], rowH: 30, fill: 'pink' },
      { t: 'box', x: 20, y: 140, w: 190, h: 40, label: 'call 1: "bad IFSC"', fill: 'white', size: 15 },
      { t: 'box', x: 20, y: 188, w: 190, h: 40, label: 'call 2: "missing PAN"', fill: 'white', size: 15 },
      { t: 'arrow', x1: 214, y1: 160, x2: 340, y2: 114, bend: -12 },
      { t: 'arrow', x1: 214, y1: 208, x2: 430, y2: 114, bend: -10 },
      { t: 'note', x: 570, y: 50, w: 180, h: 100, fill: 'pink', size: 14, text: 'Both calls appended to\nthe SAME list, so call 2\nreturns both messages.' },
      { t: 'line', x1: 20, y1: 246, x2: 740, y2: 246, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 190, y: 270, text: 'errors=None  and  errors = []  inside', font: 'mono', size: 12, anchor: 'middle', bold: true },
      { t: 'table', x: 320, y: 262, cols: ['call 1: new list'], colW: [170], rows: [['bad IFSC']], rowH: 30, fill: 'green' },
      { t: 'table', x: 520, y: 262, cols: ['call 2: new list'], colW: [170], rows: [['missing PAN']], rowH: 30, fill: 'green' },
    ] } },
    { py: {
      title: 'Same object or a copy? And the mutable default trap',
      starter: `# 1. A function receives the SAME object, not a copy
def add_line(lines, line):
    lines.append(line)            # changes the caller's list

def rebind(lines):
    lines = ["something new"]     # moves the LOCAL name only; the caller is unaffected

journal = ["L1"]
add_line(journal, "L2")
print("after add_line:", journal)
rebind(journal)
print("after rebind  :", journal)

# 2. The mutable default trap
def add_error(message, errors=[]):
    errors.append(message)
    return errors

print(add_error("bad IFSC"))
print(add_error("missing PAN"))      # the first message is still in there
print(add_error.__defaults__)         # the ONE list lives on the function object

def add_error_fixed(message, errors=None):
    if errors is None:
        errors = []                  # a NEW list on every call
    errors.append(message)
    return errors

print(add_error_fixed("bad IFSC"))
print(add_error_fixed("missing PAN"))
print(add_error_fixed("typo", ["already here"]))   # your own list still works`,
      note: 'Linters flag a mutable default (Ruff rule B006). Also use `None` as the default for dicts and sets, and for `datetime.now()`: a default of `datetime.now()` is evaluated once, when the function is defined.',
    } },
    `## Scope and closures
Python looks up a name in four places, in this order, and stops at the first hit. People remember it as **LEGB**:
1. **L**ocal: names inside the current function.
2. **E**nclosing: names in any function that this function is *inside* of.
3. **G**lobal: names at the top level of the file.
4. **B**uilt-in: \`len\`, \`print\`, \`sum\`…

You can read a global from a function, but **assigning** to a name inside a function always creates a *local*. That is why \`total += 1\` on a global counter fails with \`UnboundLocalError\`. Avoid globals: pass values in and return values out.

### Closures: a function that remembers
You can define a function **inside** another function. The inner function can use the outer function's variables, and it **keeps them alive even after the outer function has returned**. The inner function together with those remembered variables is called a *closure*.
\`\`\`python
def make_converter(rate):
    def convert(amount):
        return round(amount * rate, 2)     # 'rate' comes from the enclosing function
    return convert                          # return the function itself, not its result

usd_to_inr = make_converter(83.21)         # a function that "knows" the rate
usd_to_inr(100)                            # 8321.0
\`\`\`
Each call to \`make_converter\` creates a **separate** closure with its own remembered \`rate\`. This is the engine behind decorators (next lessons), callbacks and "configure once, use many times" helpers. If the inner function must **change** a remembered variable (a counter), declare it with \`nonlocal\`, otherwise Python treats the assignment as a new local.`,
    { sketch: { w: 760, h: 270, caption: 'Calling make_converter twice creates two closures; each one carries its own remembered rate', items: [
      { t: 'box', x: 20, y: 96, w: 190, h: 66, label: 'make_converter(rate)', sub: 'the factory', fill: 'blue' },
      { t: 'arrow', x1: 214, y1: 112, x2: 376, y2: 66, label: 'call with 83.21', lx: -20, ly: -20 },
      { t: 'arrow', x1: 214, y1: 148, x2: 376, y2: 206, label: 'call with 61.5', lx: -30, ly: 24 },
      { t: 'box', x: 380, y: 34, w: 190, h: 64, label: 'usd_to_inr', sub: 'a convert() function', fill: 'green' },
      { t: 'table', x: 620, y: 44, title: 'remembered', cols: ['rate'], colW: [110], rows: [['83.21']], rowH: 30, fill: 'yellow' },
      { t: 'arrow', x1: 574, y1: 66, x2: 616, y2: 66 },
      { t: 'box', x: 380, y: 174, w: 190, h: 64, label: 'sgd_to_inr', sub: 'another convert()', fill: 'green' },
      { t: 'table', x: 620, y: 184, title: 'remembered', cols: ['rate'], colW: [110], rows: [['61.5']], rowH: 30, fill: 'yellow' },
      { t: 'arrow', x1: 574, y1: 206, x2: 616, y2: 206 },
      { t: 'note', x: 20, y: 210, w: 250, h: 48, fill: 'grey', size: 13, text: 'The factory has finished, but the\nremembered values live on.' },
    ] } },
    { py: {
      title: 'Closures, nonlocal and the loop trap',
      starter: `def make_converter(rate, decimals=2):
    def convert(amount):
        return round(amount * rate, decimals)    # remembers rate and decimals
    return convert

usd_to_inr = make_converter(83.21)
sgd_to_inr = make_converter(61.5, decimals=1)
print(usd_to_inr(100), sgd_to_inr(100))
# peek inside: what did each closure remember?
for fn in (usd_to_inr, sgd_to_inr):
    cells = [c.cell_contents for c in fn.__closure__]
    print(dict(zip(fn.__code__.co_freevars, cells)))

def make_counter():
    count = 0
    def next_number():
        nonlocal count               # without this line: UnboundLocalError
        count += 1
        return count
    return next_number

inv_a, inv_b = make_counter(), make_counter()
print(inv_a(), inv_a(), inv_a(), inv_b())    # each closure has its own count: 1 2 3 1

# The classic trap: all the lambdas look up r AFTER the loop has finished
rates = [1, 2, 3]
bad = [lambda x: x * r for r in rates]
print("bad :", [f(10) for f in bad])         # [30, 30, 30]
good = [lambda x, r=r: x * r for r in rates] # r=r freezes the current value as a default
print("good:", [f(10) for f in good])

from functools import partial
def scale(r, x):
    return x * r
also_good = [partial(scale, r) for r in rates]   # partial pre-fills the first argument
print("partial:", [f(10) for f in also_good])`,
      note: 'The loop trap happens because a closure remembers the *variable*, not its value at that moment. After the loop `r` is 3, so every lambda sees 3.',
    } },
    `## Functions are values: lambda, key, map, filter
Because a function is an object, you can pass it as an argument. The most common use is the **\`key\`** argument of \`sorted\`, \`min\` and \`max\`: you hand over a small function that tells Python *what to sort by*.
\`\`\`python
sorted(orders, key=lambda o: float(o["amount"]), reverse=True)   # biggest first
max(lines, key=lambda l: float(l["debit"]))                       # the biggest line
\`\`\`
A **\`lambda\`** is a nameless one-expression function: \`lambda o: float(o["amount"])\` means "given \`o\`, return its amount as a number". Use it for tiny throw-away functions. If you need two lines or a name, write a normal \`def\`.

Two more rules about \`key\`:
- It must return something sortable. A **tuple** sorts on several columns at once: \`key=lambda o: (o["channel"], -float(o["amount"]))\` means channel A to Z, then amount high to low (the minus flips a number).
- **Text sorts as text.** \`sorted(["9", "10", "100"])\` gives \`['10', '100', '9']\`, because it compares character by character. Convert inside the key.

\`map(func, items)\` applies a function to every item and \`filter(func, items)\` keeps the items for which the function returns true. Both return lazy iterators (wrap in \`list(...)\` to see them). In practice a comprehension does the same job and is easier to read: \`[float(x) for x in xs]\` instead of \`map(float, xs)\`. Keep \`map\` for the one case where you already have a named function, like \`map(float, xs)\`. The \`operator\` module offers ready-made key functions: \`itemgetter("amount")\` is the same as \`lambda o: o["amount"]\`.`,
    { py: {
      title: 'Sorting orders with key, map and filter',
      starter: `import csv
from operator import itemgetter

with open("orders.csv", newline="") as f:
    orders = list(csv.DictReader(f))      # every value is text

# top 3 orders by amount: convert INSIDE the key
top3 = sorted(orders, key=lambda o: float(o["amount"]), reverse=True)[:3]
for o in top3:
    print(o["order_id"], o["channel"], o["amount"], o["status"] or "(no status)")

# several columns: channel A-Z, then amount high to low
by_two = sorted(orders, key=lambda o: (o["channel"], -float(o["amount"])))
print([(o["channel"], o["amount"], o["order_id"]) for o in by_two[:3]])

# the text-sorting trap
print(sorted(["9", "10", "100"]), "<- text order")
print(sorted(["9", "10", "100"], key=int), "<- number order")

# min / max also take a key
smallest = min(orders, key=lambda o: float(o["amount"]))
print("smallest order:", smallest["order_id"], smallest["amount"])

# map and filter, next to the comprehension that does the same
amounts = list(map(float, (o["amount"] for o in orders)))
delivered = list(filter(lambda o: o["status"] == "Delivered", orders))
delivered2 = [o for o in orders if o["status"] == "Delivered"]
print(len(amounts), "amounts;", len(delivered), "delivered;", delivered == delivered2)

# itemgetter: a ready-made key function for a plain lookup
print(sorted(orders[:5], key=itemgetter("channel"))[0]["channel"])

# functions in a dict: choose the behaviour by name
cleaners = {"upper": str.upper, "strip": str.strip, "title": str.title}
print({name: fn("  nandi ELECTRICALS ") for name, fn in cleaners.items()})`,
      note: 'Three orders tie for the largest amount (368000). Python\'s sort is *stable*: items that compare equal keep the order they had in the file, so 66, 74 and 147 appear in that order. Change `reverse=True` to `False` for the smallest three, then try sorting by `o["amount"]` without `float(...)` and look at which order comes first.',
    } },
    { warn: `Things that go wrong with functions:
- **A function that prints instead of returning** cannot be tested or reused. \`print\` is for the outermost layer of your script; inner functions return values.
- **\`sorted(rows, key=...)\` returns a new list; \`rows.sort(key=...)\` changes the list and returns \`None\`.** Do not write \`rows = rows.sort(...)\`.
- **Forgetting the call brackets**: \`key=len()\` calls \`len\` immediately and fails. Pass the function itself: \`key=len\`.
- **\`return\` inside a loop** ends the whole function at the first iteration. If you want to collect values, append to a list and return it after the loop.
- **Too many parameters.** More than four or five usually means the function does two jobs, or that some arguments belong together in a dict (or the dataclass you will meet soon).` },
    { pychallenge: {
      id: 'python-functions-ch1',
      prompt: 'Bank files write amounts in many styles. Write `clean_amount(text, *, default=0.0)` that returns a float: strip spaces and the ₹ sign, remove commas, treat an amount in brackets as negative (`"(2,500.00)"` gives `-2500.0`), and return `default` for an empty text or a lone dash. `default` must be **keyword-only**, so calling `clean_amount("5", 1)` must raise `TypeError`.',
      starter: `def clean_amount(text, default=0.0):
    # TODO: strip, remove the rupee sign and commas, handle (brackets), "" and "-"
    return default
`,
      tests: `assert clean_amount("1,23,456.50") == 123456.5, clean_amount("1,23,456.50")
assert clean_amount(" ₹ 4,500 ") == 4500.0
assert clean_amount("(2,500.00)") == -2500.0
assert clean_amount("-1,000") == -1000.0
assert clean_amount("5") == 5.0
assert clean_amount("") == 0.0
assert clean_amount("  -  ") == 0.0
assert clean_amount("", default=None) is None
try:
    clean_amount("5", 1)
    raise AssertionError("default must be keyword-only")
except TypeError:
    pass`,
      solution: `def clean_amount(text, *, default=0.0):
    t = text.strip().replace("₹", "").replace(",", "").strip()
    if t in ("", "-"):
        return default
    negative = t.startswith("(") and t.endswith(")")
    if negative:
        t = t[1:-1].strip()
    value = float(t)
    return -value if negative else value
`,
      hint: 'Clean first: `t = text.strip().replace("₹", "").replace(",", "").strip()`. Return `default` when `t in ("", "-")`. Then check `t.startswith("(") and t.endswith(")")`, remove the brackets with `t[1:-1]`, convert with `float`, and flip the sign. Put a bare `*` before `default` in the `def` line.',
    } },
    { pychallenge: {
      id: 'python-functions-ch2',
      prompt: 'This function has the mutable default trap: the second call returns both messages. Fix `add_error(message, errors=None)` so that a call without `errors` starts a **new** list each time, and a call that passes its own list appends to that list and returns **the same list object**.',
      starter: `def add_error(message, errors=[]):
    errors.append(message)
    return errors
`,
      tests: `first = add_error("bad IFSC")
second = add_error("missing PAN")
assert first == ["bad IFSC"], first
assert second == ["missing PAN"], second
mine = ["x"]
result = add_error("y", mine)
assert result is mine and mine == ["x", "y"]
assert add_error("z") == ["z"]`,
      solution: `def add_error(message, errors=None):
    if errors is None:
        errors = []
    errors.append(message)
    return errors
`,
      hint: 'Change the default to `None`. Inside the function write `if errors is None: errors = []`. Use `is None`, not `if not errors`, so an empty list passed by the caller is still used.',
    } },
    { pychallenge: {
      id: 'python-functions-ch3',
      prompt: 'Write the factory `make_numberer(prefix, width=4)`. It returns a function `next_id()` that gives `"INV-0001"`, then `"INV-0002"` and so on, zero-padded to `width` digits. Each numberer keeps its own count. Use a closure and `nonlocal`.',
      starter: `def make_numberer(prefix, width=4):
    # TODO: remember a counter in the enclosing function; return next_id
    def next_id():
        return prefix
    return next_id
`,
      tests: `inv = make_numberer("INV")
jv = make_numberer("JV", width=6)
assert [inv(), inv(), inv()] == ["INV-0001", "INV-0002", "INV-0003"]
assert jv() == "JV-000001"
assert inv() == "INV-0004"
fresh = make_numberer("INV")
assert fresh() == "INV-0001"
assert jv() == "JV-000002"`,
      solution: `def make_numberer(prefix, width=4):
    count = 0
    def next_id():
        nonlocal count
        count += 1
        return f"{prefix}-{count:0{width}d}"
    return next_id
`,
      hint: 'Start with `count = 0` in the outer function. In `next_id` write `nonlocal count`, add 1, and format with an f-string: `f"{prefix}-{count:0{width}d}"` (a format spec can itself contain `{width}`).',
    } },
    { pychallenge: {
      id: 'python-functions-ch4',
      prompt: 'Write `top_n(rows, n, key, *, reverse=True)`. `key` is a function that takes one row and returns the value to sort by. Return a **new list** with the first `n` rows after sorting (biggest first when `reverse=True`). The input list must not be changed, and `n` larger than the list is fine.',
      starter: `def top_n(rows, n, key, *, reverse=True):
    # TODO: sorted(...) with the key function, then slice the first n
    return []
`,
      tests: `rows = [{"id": 1, "amt": 50}, {"id": 2, "amt": 900}, {"id": 3, "amt": 400}, {"id": 4, "amt": 75}]
before = list(rows)
assert [r["id"] for r in top_n(rows, 2, key=lambda r: r["amt"])] == [2, 3]
assert [r["id"] for r in top_n(rows, 2, key=lambda r: r["amt"], reverse=False)] == [1, 4]
assert rows == before, "top_n must not change the input list"
assert len(top_n(rows, 10, key=lambda r: r["amt"])) == 4
assert top_n(rows, 0, key=lambda r: r["amt"]) == []
assert top_n([], 3, key=len) == []
assert top_n(["bb", "a", "ccc"], 1, key=len) == ["ccc"]`,
      solution: `def top_n(rows, n, key, *, reverse=True):
    return sorted(rows, key=key, reverse=reverse)[:n]
`,
      hint: '`sorted(rows, key=key, reverse=reverse)` returns a new sorted list and leaves `rows` alone. Slice the result with `[:n]`.',
    } },
    { real: 'Your first reusable library is a small file of cleaners: `clean_amount`, `normalise_gstin`, `parse_invoice_no`, `mask_account`. Every script you write imports them instead of re-typing the logic, and one fix repairs all your automations. Give each function one job, keep it free of `print` and file access, and it becomes trivially testable: you will test these exact functions with pytest later in this phase.' },
    { interview: `**"What is the mutable default argument problem?"**
Model answer: "Default values are evaluated once, when the function is defined, not on each call. If the default is a list or dict, every call that omits the argument shares the same object, so changes leak between calls. The fix is \`def f(x, items=None):\` and \`if items is None: items = []\` inside."

**"Is Python pass-by-value or pass-by-reference?"** "Neither exactly: it is pass by object reference. The parameter is a new name for the same object. If the function mutates the object, the caller sees it. If the function rebinds the name, the caller does not."

**"What are args and kwargs?"** "\`*args\` collects extra positional arguments into a tuple and \`**kwargs\` collects extra named arguments into a dict. At the call site the same stars unpack a list or a dict into arguments. I use \`**kwargs\` to pass options through to another function."

**"What is a closure, and where have you used one?"** "A function that remembers variables from the function it was defined in, even after that function returned. I used one to build configured helpers such as \`make_converter(rate)\`; decorators are closures too."` },
    `## Recap
- A function is a named, reusable unit: parameters in, \`return\` out. No \`return\` means \`None\`. Return values, do not print them.
- Parameters: normal, default, \`*args\` (tuple), keyword-only after a bare \`*\`, \`**kwargs\` (dict). At a call, \`*list\` and \`**dict\` spread values into arguments.
- Arguments are the same object, not copies: mutating is visible to the caller, rebinding is not. Default values are created **once**, so use \`None\` instead of \`[]\` or \`{}\`.
- Name lookup is LEGB (local, enclosing, global, built-in). A closure remembers variables of its enclosing function; use \`nonlocal\` to change one, and beware the late-binding loop trap.
- Functions are values: \`sorted\`, \`min\` and \`max\` take \`key=\`; a tuple key sorts on several columns; \`lambda\` is for tiny one-expression helpers; comprehensions usually beat \`map\` and \`filter\`.`,
  ],
  quiz: [
    { q: 'Given `def post(entity, *, dry_run=False)`, what does `post("IN01", True)` do?', o: ['posts with `dry_run=True`', 'raises `TypeError` because `dry_run` can only be passed by name', 'ignores the second argument', 'sets `entity` to `True`'], a: 1, why: 'Parameters after the bare `*` are keyword-only. Python raises `TypeError: post() takes 1 positional argument but 2 were given`.' },
    { q: 'With `def add(x, items=[])` whose body is `items.append(x)` and `return items`, you call `add(1)` and then `add(2)`. What does the second call return?', o: ['`[2]`', '`[1]`', '`[]`', '`[1, 2]`'], a: 3, why: 'The default list is created once and shared by every call that omits `items`, so the second call sees the first call\'s change.' },
    { q: 'What does `sorted(["9", "10", "100"])` return?', o: ['`["10", "100", "9"]`', '`["9", "10", "100"]`', '`[9, 10, 100]`', 'a `TypeError`'], a: 0, why: 'Strings compare character by character, so `"10"` comes before `"9"`. Use `key=int` to sort by number.' },
    { q: 'After `fs = [lambda x: x * r for r in [1, 2, 3]]`, what is `[f(10) for f in fs]`?', o: ['`[10, 20, 30]`', '`[10, 10, 10]`', '`[30, 30, 30]`', 'a `NameError`'], a: 2, why: 'Each lambda looks up `r` when it is called, after the loop has ended, so all of them see the last value, 3. Fix it with `lambda x, r=r: x * r`.' },
    { q: 'Inside a closure you write `count += 1` for a variable of the enclosing function. What must you add to avoid `UnboundLocalError`?', o: ['`global count`', '`return count` first', '`import count`', '`nonlocal count`'], a: 3, why: 'Assigning to a name makes it local unless you declare it `nonlocal` (enclosing function) or `global` (module level).' },
    { q: 'A function does `lines.append("L2")` on the list it received. What does the caller see?', o: ['nothing: the function works on a copy', 'the list with "L2" added, because it is the same object', 'a `RuntimeError`', 'the list with "L2" only if the function also returns it'], a: 1, why: 'Arguments are passed as references to the same object. Mutating it is visible to the caller; only rebinding the local name is not.' },
  ],
  task: {
    title: 'Build your first toolbox of reusable functions',
    steps: [
      'In `C:\\fde\\py-recap` create `functions_practice.py`.',
      'Write `clean_amount(text, *, default=0.0)` from the challenge and test it by hand on `"₹ 1,23,456.50 "`, `"(2,500.00)"` and `""`.',
      'Write `make_converter(rate, decimals=2)` and build `usd_to_inr` and `sgd_to_inr` closures with two of the rates from `fx_rates.csv`. Print `usd_to_inr(250)`.',
      'Write `top_n(rows, n, key, *, reverse=True)`. Read `payroll.csv` with `csv.DictReader` and print the three highest `gross_pay` rows of September (`run_month` is `2026-09-01`).',
      'Write `report(rows, *, title, limit=5, **filters)` that keeps only the rows where every filter matches (`report(rows, title="IN", department="Finance")`), then prints `title` and the first `limit` rows. Use `**filters` and `all(...)`.',
      'Add a comment above each function: what is its one job, and what does it return?',
    ],
    deliverable: '`functions_practice.py` and its printed output.',
  },
};
