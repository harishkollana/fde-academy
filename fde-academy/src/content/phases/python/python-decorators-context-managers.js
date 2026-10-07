export default {
  id: 'python-decorators-context-managers',
  title: 'Decorators and context managers',
  goal: 'You can write a decorator (with and without arguments) that adds timing, retry or caching to a function, use functools.wraps and lru_cache, and write your own with-block with a class or with contextlib so cleanup never gets forgotten.',
  roadmap: ['decorators', 'functools.wraps and lru_cache', 'writing @retry', 'with blocks and context managers', 'contextlib'],
  blocks: [
    `## The problem
You have ten functions in your month-end script. You want to know how long each one takes. Three of them call a bank API that fails now and then, so they need "try again up to three times". Two of them open a database connection that must be committed on success and rolled back on failure.

The slow way is to paste the same ten lines into every function. The timing code is now in ten places, and the day you want to change it you must remember all ten. The worse version is forgetting: one function opens a file and an error happens before \`close()\`. Nobody notices until the file stays locked.

Python has two tools for exactly this:
- A **decorator** wraps a function with extra behaviour (timing, retry, caching, logging) **without touching the function's own code**.
- A **context manager** (the \`with\` block) guarantees that **set-up and clean-up happen as a pair**, even when an error occurs in between.

You will meet both everywhere. \`@app.get("/jobs")\` in FastAPI, \`@task\` in orchestration tools and \`@pytest.fixture\` are decorators. \`with open(...)\`, \`with engine.begin()\` and \`with tempfile.TemporaryDirectory()\` are context managers.`,
    `## Decorators: a function that wraps a function
You already know two facts from the functions lesson. A function is an object, so you can pass it to another function. And a function can build and return another function (a closure). A decorator is just those two facts together:

> A **decorator** is a function that takes a function and returns a new function that usually calls the original inside it.

Here is the shape. Read it slowly once; it is only five lines.
\`\`\`python
def timed(func):                      # 1. receives the ORIGINAL function
    def wrapper(*args, **kwargs):     # 2. a new function with the same inputs
        # ... do something before ...
        result = func(*args, **kwargs)  # 3. call the original
        # ... do something after ...
        return result                 # 4. give back the original answer
    return wrapper                    # 5. hand out the wrapper instead
\`\`\`
The \`@\` line is only a shortcut:
\`\`\`python
@timed
def report(rows): ...
# means exactly the same as:
def report(rows): ...
report = timed(report)      # the NAME report now points to the wrapper
\`\`\`
\`*args, **kwargs\` in the wrapper means "accept whatever the original accepts and pass it on", so one decorator works for any function.`,
    { sketch: { w: 760, h: 300, caption: 'A decorator puts a wrapper in front of the function: the caller talks to the wrapper, the wrapper talks to the original', items: [
      { t: 'box', x: 14, y: 90, w: 120, h: 60, label: 'caller', sub: 'report(rows)', fill: 'blue' },
      { t: 'arrow', x1: 138, y1: 112, x2: 238, y2: 112, label: '1  call', ly: -14 },
      { t: 'box', x: 242, y: 14, w: 330, h: 206, fill: 'yellow' },
      { t: 'text', x: 407, y: 36, text: 'wrapper = the code inside @timed', size: 15, bold: true, anchor: 'middle' },
      { t: 'box', x: 264, y: 52, w: 286, h: 38, label: 'start the clock', size: 15, fill: 'white' },
      { t: 'arrow', x1: 407, y1: 92, x2: 407, y2: 108 },
      { t: 'box', x: 264, y: 110, w: 286, h: 48, label: 'run the ORIGINAL report', size: 15, fill: 'green' },
      { t: 'arrow', x1: 407, y1: 160, x2: 407, y2: 172 },
      { t: 'box', x: 264, y: 174, w: 286, h: 38, label: 'stop the clock, print', size: 15, fill: 'white' },
      { t: 'arrow', x1: 242, y1: 196, x2: 138, y2: 146, dashed: true, label: '2  same result back', lx: -16, ly: 34 },
      { t: 'note', x: 592, y: 30, w: 158, h: 176, fill: 'pink', size: 13, text: 'Before:\nreport = original\n\nAfter @timed:\nreport = wrapper\n\nThe wrapper still\ncalls the original.' },
      { t: 'note', x: 14, y: 238, w: 732, h: 50, fill: 'grey', size: 14, text: '@timed above def report  is only a shortcut for  report = timed(report).\nThe original code of report is never edited.' },
    ] } },
    { py: {
      title: 'Write @timed and see why functools.wraps matters',
      starter: `import csv
import time
from functools import wraps

def timed(func):
    @wraps(func)                           # copy the name and docstring of func onto the wrapper
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)     # run the ORIGINAL function
        elapsed = time.perf_counter() - start
        print(f"  [{func.__name__}] finished in {elapsed * 1000:.2f} ms")
        return result                      # return the original answer unchanged
    return wrapper

@timed                                     # same as: total_debit = timed(total_debit)
def total_debit(rows):
    """Add up the debit column."""
    return sum(float(r["debit"]) for r in rows)

with open("fact_gl.csv", newline="") as f:
    rows = list(csv.DictReader(f))

print("total debit:", round(total_debit(rows), 2))
print("name and docstring survive:", total_debit.__name__, "|", total_debit.__doc__)

# the same decorator without @wraps hides the real name
def careless(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@careless
def month_close():
    """Close the month."""

print("without wraps:", month_close.__name__, "|", month_close.__doc__)`,
      note: 'The total is the debit side of all three entities added together, so it is only a demo number (never add entities in real work: their currencies differ). Look at the last two lines: without @wraps the function loses its identity, and tools that print names (logs, tracebacks, test reports) would all say "wrapper".',
    } },
    `## Decorators that take arguments: three layers
\`@timed\` has no settings. What about \`@retry(times=3)\`? Now you need to **pass a number to the decorator and still receive the function**. Python solves this with one more layer. Read it from the outside in:
1. \`retry(times=3)\` runs first and **returns a decorator**. It remembers \`times\` (a closure).
2. That decorator receives your function and **returns the wrapper**.
3. The wrapper runs **every time** you call the function.

So \`@retry(times=3)\` means "call \`retry(3)\`, then apply the result as the decorator". If you forget the brackets and write \`@retry\`, Python passes your function as \`times\`, and the error you get is confusing. The rule: a decorator **with settings needs brackets, even when you use the defaults**.`,
    { sketch: { w: 760, h: 290, caption: 'Three layers: the factory takes the settings, the decorator takes the function, the wrapper takes each call', items: [
      { t: 'box', x: 14, y: 30, w: 196, h: 76, label: 'retry(times=3)', sub: 'the factory: takes settings', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 214, y1: 68, x2: 276, y2: 68, label: 'returns', ly: -14 },
      { t: 'box', x: 280, y: 30, w: 196, h: 76, label: 'decorator(func)', sub: 'takes your function', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 480, y1: 68, x2: 542, y2: 68, label: 'returns', ly: -14 },
      { t: 'box', x: 546, y: 30, w: 200, h: 76, label: 'wrapper(*args)', sub: 'runs on every call', fill: 'green', size: 17 },
      { t: 'note', x: 14, y: 124, w: 196, h: 70, fill: 'blue', size: 13, text: 'Runs ONCE, when the\ndef line is read.\nKeeps times = 3.' },
      { t: 'note', x: 280, y: 124, w: 196, h: 70, fill: 'yellow', size: 13, text: 'Runs ONCE, right after.\nGets fetch_rate and\nbuilds the wrapper.' },
      { t: 'note', x: 546, y: 124, w: 200, h: 70, fill: 'green', size: 13, text: 'Runs EVERY call:\ntry, catch, try again,\nup to 3 attempts.' },
      { t: 'note', x: 14, y: 214, w: 732, h: 62, fill: 'grey', size: 14, text: '@retry(times=3) above def fetch_rate   means   fetch_rate = retry(times=3)(fetch_rate)\nNo settings needed?  Then use the two-layer form, like @timed.  Settings?  Add the outer layer.' },
    ] } },
    { py: {
      title: 'Write @retry(times, exceptions) and stack two decorators',
      starter: `from functools import wraps

def retry(times=3, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as exc:
                    print(f"  attempt {attempt} of {times} failed: {exc}")
                    if attempt == times:
                        raise                  # out of attempts: let the caller see the error
        return wrapper
    return decorator

calls = {"n": 0}

@retry(times=3, exceptions=(ConnectionError,))
def get_usd_rate():
    calls["n"] += 1
    if calls["n"] < 3:                         # fails twice, works the third time
        raise ConnectionError("server busy")
    return 83.21

print("rate:", get_usd_rate(), "after", calls["n"], "calls")

@retry(times=2, exceptions=(ConnectionError,))
def always_down():
    raise ConnectionError("server down")

try:
    always_down()
except ConnectionError as exc:
    print("gave up:", exc)

@retry(times=3, exceptions=(ConnectionError,))
def bad_input():
    raise ValueError("amount is not a number")  # not in the retry list

try:
    bad_input()
except ValueError as exc:
    print("not retried, raised at once:", exc)

# Stacked decorators: the one NEAREST to def is applied first
def tag(name):
    def deco(func):
        def wrapper(*args, **kwargs):
            return f"<{name}>{func(*args, **kwargs)}</{name}>"
        return wrapper
    return deco

@tag("b")
@tag("i")
def label():
    return "GST filed"

print(label())`,
      note: 'A retry decorator must only retry errors that can go away (a busy server, a timeout). A ValueError will fail the same way on every attempt, so retrying it only wastes time: that is why the decorator takes an exceptions list. You build the full production version, with waiting between attempts, in the Errors lesson. The last line shows the order: i is applied first, b wraps the result.',
    } },
    `## Caching with functools.lru_cache
The standard library already has a ready-made decorator for one very common job: **do not repeat expensive work for the same input**. \`@lru_cache\` remembers the result for each set of arguments. The second call with the same arguments returns the stored answer without running the function body. Typical use: looking up an FX rate, a GL account name or a config value that you ask for thousands of times.

Rules for \`lru_cache\`:
- The arguments must be **hashable** (numbers, strings, tuples; **not** lists or dicts).
- Use it only on **pure** functions: the same input must always give the same answer, with no side effects.
- \`f.cache_info()\` shows hits and misses, and \`f.cache_clear()\` empties the cache. \`@cache\` is the short form with no size limit.
- If the function returns a **mutable object** (a list), every caller gets the **same** list, so one caller can change what the others see.`,
    { py: {
      title: 'lru_cache on an FX-rate lookup, with cache_info',
      starter: `import csv
from functools import lru_cache

file_reads = {"n": 0}

@lru_cache(maxsize=None)
def fx_rate(currency, month):
    file_reads["n"] += 1                 # counts how often the REAL work runs
    with open("fx_rates.csv", newline="") as f:
        for row in csv.DictReader(f):
            if row["currency"] == currency and row["rate_month"] == month:
                return float(row["rate_to_inr"])
    return None

print(fx_rate("USD", "2025-04-01"))      # miss: opens the file
print(fx_rate("USD", "2025-04-01"))      # hit: answer comes from memory
print(fx_rate("SGD", "2025-04-01"))      # new arguments: another miss
for _ in range(1000):
    fx_rate("USD", "2025-04-01")         # a thousand more hits

print(fx_rate.cache_info())
print("the file was opened", file_reads["n"], "times for", 1003, "calls")

fx_rate.cache_clear()
print("after cache_clear:", fx_rate.cache_info())

try:
    fx_rate("USD", ["2025-04-01"])       # a list is not hashable
except TypeError as exc:
    print("TypeError:", exc)`,
      note: 'cache_info shows hits=1001, misses=2: only two calls did real work. Hashing is the reason lists are rejected: the cache stores the arguments as a dictionary key.',
    } },
    `## Context managers: set-up and clean-up as a pair
Now the second tool. Look at this:
\`\`\`python
f = open("statement.csv")
data = f.read()        # if this line raises an error ...
f.close()              # ... this line never runs and the file stays open
\`\`\`
The fix you already use is the \`with\` block:
\`\`\`python
with open("statement.csv") as f:
    data = f.read()
# f is closed here, whatever happened inside the block
\`\`\`
\`open(...)\` returns a **context manager**. The rules of the \`with\` statement are:
1. Python calls the object's \`__enter__()\`. Its return value is what \`as f\` receives.
2. Your indented block runs.
3. Python calls \`__exit__()\` **always**: when the block ends normally, when it hits \`return\` or \`break\`, and when an exception is raised.

If the block raised an error, \`__exit__\` receives it (type, value, traceback). It can do its clean-up and then either let the error continue (the usual case) or return \`True\` to swallow it. Use that second option very rarely.`,
    { sketch: { w: 760, h: 270, caption: 'A with block always runs the exit step, whether the body worked or failed', items: [
      { t: 'box', x: 14, y: 40, w: 150, h: 64, label: 'enter', sub: 'open, BEGIN, lock', fill: 'blue' },
      { t: 'arrow', x1: 168, y1: 72, x2: 212, y2: 72 },
      { t: 'box', x: 216, y: 40, w: 170, h: 64, label: 'your block', sub: 'the indented code', fill: 'yellow' },
      { t: 'arrow', x1: 390, y1: 56, x2: 484, y2: 40, label: 'no error', lx: -4, ly: -14 },
      { t: 'arrow', x1: 390, y1: 90, x2: 484, y2: 130, label: 'error raised', lx: -6, ly: 22 },
      { t: 'box', x: 488, y: 12, w: 258, h: 62, label: 'exit: COMMIT', sub: 'close, release, save', fill: 'green' },
      { t: 'box', x: 488, y: 106, w: 258, h: 62, label: 'exit: ROLLBACK', sub: 'close, release, undo; then re-raise', fill: 'pink' },
      { t: 'note', x: 14, y: 186, w: 732, h: 70, fill: 'yellow', size: 14, text: 'The exit step runs in BOTH cases. That is the whole point: clean-up you cannot forget.\nA class does it with __enter__ and __exit__. A generator does it with try / yield / finally (shown next).' },
    ] } },
    `## Write your own: a class, or a generator
**With a class**, you write the two special methods. This is the explicit version.

**With \`contextlib.contextmanager\`**, you write one generator function with **one \`yield\`**. Everything before the \`yield\` is the enter step, the yielded value is what \`as\` receives, and everything after it is the exit step. Put the exit step in \`finally\` (or in an \`except\` that re-raises) so it runs when the block fails.
\`\`\`python
from contextlib import contextmanager

@contextmanager
def transaction(conn):
    try:
        yield conn            # the with-block runs here
        conn.commit()         # no error: save
    except Exception:
        conn.rollback()       # error: undo
        raise                 # and let the caller see it
\`\`\`
The generator style is shorter, so it is the one you will write most. The class style is useful when the object needs more behaviour or must be reused.

A few ready-made context managers in the standard library:
| Tool | What it does |
|---|---|
| \`open(path)\` | closes the file |
| \`tempfile.TemporaryDirectory()\` | makes a temp folder and deletes it afterwards |
| \`contextlib.suppress(KeyError)\` | ignores one kind of error (use sparingly) |
| \`contextlib.redirect_stdout(buf)\` | captures \`print\` output into \`buf\` |
| \`decimal.localcontext()\` | changes decimal settings inside the block only |
| \`threading.Lock()\` | holds a lock and always releases it |`,
    { py: {
      title: 'A class and a generator context manager, and a fake transaction',
      starter: `import io
import time
from contextlib import contextmanager, redirect_stdout, suppress

# 1. the class version: two special methods
class Stopwatch:
    def __enter__(self):
        self.start = time.perf_counter()
        return self                          # this is what "as sw" receives
    def __exit__(self, exc_type, exc, tb):
        self.seconds = time.perf_counter() - self.start
        return False                         # False (or None): do not hide any error

with Stopwatch() as sw:
    total = sum(range(100_000))
print("class version measured:", sw.seconds >= 0)

# 2. the generator version, with a fake database connection
class FakeConn:
    def __init__(self):
        self.log = []
    def execute(self, sql):
        self.log.append("EXECUTE " + sql)
    def commit(self):
        self.log.append("COMMIT")
    def rollback(self):
        self.log.append("ROLLBACK")

@contextmanager
def transaction(conn):
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

good = FakeConn()
with transaction(good) as c:
    c.execute("INSERT journal 1")
    c.execute("INSERT journal 2")
print("success:", good.log)

bad = FakeConn()
try:
    with transaction(bad) as c:
        c.execute("INSERT journal 1")
        raise ValueError("journal does not balance")
        c.execute("INSERT journal 2")        # never reached
except ValueError as exc:
    print("failure:", bad.log, "| error still visible:", exc)

# 3. ready-made tools
with suppress(KeyError):
    {}["missing"]                            # the KeyError is ignored
print("suppress: the program carried on")

buffer = io.StringIO()
with redirect_stdout(buffer):
    print("this goes into the buffer, not the screen")
print("captured:", repr(buffer.getvalue()))`,
      note: 'The failure case is the whole reason transactions exist: the first INSERT is rolled back because the second step never happened. In the SQL phase you did the same with BEGIN and ROLLBACK; here Python does it for you on every exit.',
    } },
    { warn: `Things that go wrong with decorators and context managers:
- **Forgetting \`@wraps\`.** The decorated function loses its name and docstring, so logs and test reports show "wrapper".
- **Forgetting to return the result** in the wrapper. The function then returns \`None\` and a report quietly shows blanks.
- **Using \`@retry\` without brackets.** A decorator with settings is always \`@retry()\` or \`@retry(times=3)\`.
- **Caching a function that is not pure.** If \`lru_cache\` stores "today's rate" it will return that value for ever, even tomorrow. Cache only things that do not change, or clear the cache.
- **Retrying everything.** Retrying a bug (a \`ValueError\`) or a non-idempotent action such as "send payment" can do harm. Retry only errors that can heal, and only safe actions.
- **Swallowing errors in \`__exit__\`.** Returning \`True\` hides the exception. A \`with\` block that silently eats errors is a nightmare to debug.
- **No \`yield\` inside \`try/finally\` in a \`@contextmanager\`.** Without \`try\`, the code after \`yield\` does not run when the block fails.` },
    { pychallenge: {
      id: 'python-decorators-context-managers-ch1',
      prompt: 'Write the decorator `count_calls`. A decorated function must work exactly as before, but the wrapper must have an attribute `calls` that holds how many times the function has been called so far (start at 0). The name and docstring of the original function must be kept. Use it as `@count_calls` with no brackets.',
      starter: `from functools import wraps

def count_calls(func):
    # TODO: build a wrapper that increases wrapper.calls on each call and returns the result
    return func
`,
      tests: `@count_calls
def add(a, b=1):
    """Add two numbers."""
    return a + b

assert add.calls == 0
assert add(2) == 3
assert add(2, b=5) == 7
assert add.calls == 2, add.calls
assert add.__name__ == "add"
assert add.__doc__ == "Add two numbers."

@count_calls
def other():
    return "x"
other(); other(); other()
assert other.calls == 3
assert add.calls == 2   # each function has its own counter`,
      solution: `from functools import wraps

def count_calls(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper
`,
      hint: 'Define `wrapper(*args, **kwargs)` inside, decorate it with `@wraps(func)`, set `wrapper.calls = 0` before returning it, and do `wrapper.calls += 1` inside the wrapper before calling `func`. A function is an object, so you can give it attributes.',
    } },
    { pychallenge: {
      id: 'python-decorators-context-managers-ch2',
      prompt: 'Write the decorator factory `retry(times, exceptions=(Exception,))`. The decorated function is called up to `times` times in total. If it raises one of `exceptions`, try again; if the last attempt also fails, raise that error. Any other exception must be raised at once without a retry. Return the function\'s value on success and keep its name. Do not sleep (no waiting) in this version.',
      starter: `from functools import wraps

def retry(times, exceptions=(Exception,)):
    # TODO: three layers: retry(...) -> decorator(func) -> wrapper(*args, **kwargs)
    def decorator(func):
        return func
    return decorator
`,
      tests: `attempts = {"n": 0}

@retry(times=3, exceptions=(ConnectionError,))
def flaky():
    """Fails twice."""
    attempts["n"] += 1
    if attempts["n"] < 3:
        raise ConnectionError("busy")
    return "ok"

assert flaky() == "ok"
assert attempts["n"] == 3
assert flaky.__name__ == "flaky"

attempts["n"] = 0
@retry(times=2, exceptions=(ConnectionError,))
def down():
    attempts["n"] += 1
    raise ConnectionError("down")
try:
    down()
    raise AssertionError("must raise after the last attempt")
except ConnectionError:
    pass
assert attempts["n"] == 2

attempts["n"] = 0
@retry(times=5, exceptions=(ConnectionError,))
def wrong_input():
    attempts["n"] += 1
    raise ValueError("bad data")
try:
    wrong_input()
    raise AssertionError("ValueError must propagate")
except ValueError:
    pass
assert attempts["n"] == 1, "a ValueError must not be retried"

@retry(times=3)
def adds(a, b):
    return a + b
assert adds(2, b=3) == 5`,
      solution: `from functools import wraps

def retry(times, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if attempt == times:
                        raise
        return wrapper
    return decorator
`,
      hint: 'Loop `for attempt in range(1, times + 1)`. Inside, `try: return func(*args, **kwargs)` and `except exceptions:`; when `attempt == times` do a bare `raise`. Exceptions that are not in `exceptions` are not caught, so they propagate by themselves.',
    } },
    { pychallenge: {
      id: 'python-decorators-context-managers-ch3',
      prompt: 'Write the context manager `collect_lines()` with `@contextmanager`. Inside the `with` block everything that is printed must be captured instead of shown. The `as` value is a list; after the block ends it must hold the printed lines (one string per line, without the trailing newline). `sys.stdout` must be restored afterwards, also when the block raises an error, and the error must still reach the caller.',
      starter: `from contextlib import contextmanager, redirect_stdout
import io

@contextmanager
def collect_lines():
    # TODO: redirect stdout into a StringIO; when the block ends, fill the list with the lines
    yield []
`,
      tests: `import sys
before = sys.stdout

with collect_lines() as lines:
    print("one")
    print("two", "three")
assert lines == ["one", "two three"], lines
assert sys.stdout is before

try:
    with collect_lines() as lines:
        print("x")
        raise KeyError("boom")
    raise AssertionError("the error must reach the caller")
except KeyError:
    pass
assert lines == ["x"], lines
assert sys.stdout is before

with collect_lines() as lines:
    pass
assert lines == []`,
      solution: `from contextlib import contextmanager, redirect_stdout
import io

@contextmanager
def collect_lines():
    lines = []
    buffer = io.StringIO()
    try:
        with redirect_stdout(buffer):
            yield lines
    finally:
        lines.extend(buffer.getvalue().splitlines())
`,
      hint: 'Create `lines = []` and `buffer = io.StringIO()`. Use `with redirect_stdout(buffer): yield lines` inside a `try`, and in `finally` do `lines.extend(buffer.getvalue().splitlines())`. `redirect_stdout` restores `sys.stdout` for you, even on errors.',
    } },
    { real: 'In real pipeline code these two tools do the quiet, important jobs. A **decorator** gives every task the same timing, retry, logging and metrics, so all ten steps of your month-end run behave the same. `@task`, `@asset`, `@dag`, `@app.get` and `@pytest.fixture` are all decorators: you now know what they do (they register or wrap your function). A **context manager** makes sure a database transaction is committed or rolled back, a temp folder is removed, a lock is released and a connection goes back to the pool. When a colleague asks "what if it fails halfway?", the answer is usually a `with` block.' },
    { interview: `**"What is a decorator?"**
Model answer: "A decorator is a function that takes a function and returns a new one, usually a wrapper that calls the original. The \`@name\` line is shorthand for \`func = name(func)\`. I use decorators for cross-cutting behaviour such as timing, retry, caching and logging so I do not repeat it in every function. I always use \`functools.wraps\` so the wrapped function keeps its name and docstring."

**"How do you write a decorator that takes arguments?"** "Add one more layer: an outer function takes the arguments and returns the real decorator, which takes the function and returns the wrapper. \`@retry(times=3)\` first calls \`retry(3)\`, then applies the result to my function."

**"What is a context manager and why use one?"** "It is an object with \`__enter__\` and \`__exit__\` that the \`with\` statement calls, so clean-up always runs, even when an error occurs. I use it for files, transactions, locks and temp folders. The easiest way to write one is a generator with \`@contextmanager\`: code before \`yield\` is set-up, code after is clean-up, wrapped in \`try/finally\`."

**"What does \`lru_cache\` do and when would you not use it?"** "It stores the result of a function for each set of arguments. I use it for pure, repeated look-ups. I would not use it when the function has side effects, depends on time or changing data, or takes unhashable arguments such as lists."` },
    `## Recap
- A **decorator** takes a function and returns a wrapper. \`@timed\` above \`def f\` means \`f = timed(f)\`. Use \`*args, **kwargs\`, return the original result, and add \`@wraps(func)\`.
- A decorator **with settings** has three layers: factory (settings), decorator (function), wrapper (each call). Always write the brackets: \`@retry(times=3)\`. The nearest decorator to \`def\` is applied first.
- \`@lru_cache\` remembers results per arguments: pure functions, hashable arguments, \`cache_info()\` to check hits. \`retry\` must only repeat errors that can heal.
- A **context manager** pairs set-up and clean-up. \`with\` calls \`__enter__\`, runs the block, and **always** calls \`__exit__\`, also on errors.
- Write one with a class (\`__enter__\`/\`__exit__\`) or, more simply, with \`@contextmanager\`: set-up, one \`yield\`, clean-up in \`try/finally\`. Do not swallow errors by accident.`,
  ],
  quiz: [
    { q: 'What does the line `@timed` above `def report(rows):` do?', o: ['it runs `report` once at import time', 'it makes `report` run in a separate thread', 'it is the same as `report = timed(report)`, so the name `report` now points to the wrapper', 'it adds a comment that tools can read'], a: 2, why: 'A decorator line is only a shortcut for passing the function to the decorator and rebinding the name to what it returns.' },
    { q: 'You write `@retry(times=3)`. In what order do the layers run?', o: ['wrapper, then decorator, then retry', '`retry(3)` returns a decorator, which receives your function and returns the wrapper that runs on every call', 'only the wrapper exists, `times` is ignored', 'the decorator runs on every call, the wrapper only once'], a: 1, why: 'The outer call takes the settings and returns the real decorator. The decorator takes the function and returns the wrapper. Only the wrapper runs each time the function is called.' },
    { q: 'What is the purpose of `functools.wraps(func)` inside a decorator?', o: ['it copies the name and docstring of the original function onto the wrapper', 'it makes the decorated function run faster', 'it lets the decorator accept arguments', 'it caches the result'], a: 0, why: 'Without it, `__name__` and `__doc__` of the decorated function are those of the wrapper, which confuses logs, tracebacks and documentation tools.' },
    { q: 'Which function is a good candidate for `@lru_cache`?', o: ['`send_payment(vendor, amount)`, which calls the bank', '`today_rate()`, which reads a live feed', '`rows_of(path)`, which returns a new list each time and is then edited by the caller', '`gl_name(account_code)`, which looks up a fixed name for a code'], a: 3, why: 'Cache only pure functions: same input, same answer, no side effects. A payment has side effects, a live rate changes, and a shared mutable list would be edited by every caller.' },
    { q: 'In a `with` block the body raises an error. What happens to `__exit__`?', o: ['it is skipped, because the block did not finish', 'it is called, receives the error details, can clean up, and the error then continues unless `__exit__` returns True', 'it is called only if the error is a `ValueError`', 'it is called but cannot see the error'], a: 1, why: '`__exit__` always runs. It receives exception type, value and traceback, which is how a transaction knows to roll back. The error continues to the caller unless `__exit__` returns True.' },
    { q: 'In a `@contextmanager` generator, where must the clean-up code go so that it runs even when the block fails?', o: ['after the `yield`, inside `try/finally` (or an `except` that re-raises)', 'before the `yield`', 'in a second `yield`', 'anywhere: it always runs'], a: 0, why: 'When the block raises, the error is thrown into the generator at the `yield`. Code placed after it without try/finally is skipped.' },
  ],
  task: {
    title: 'Build a small toolkit of decorators and a transaction helper',
    steps: [
      'In `C:\\fde\\py-recap` create `decorators_practice.py` (it needs `fx_rates.csv` and `fact_gl.csv` from the *Comprehensions and control flow* task).',
      'Write `timed` (two layers) and `retry(times, exceptions)` (three layers), both with `functools.wraps`. Put them in a module `tools.py` and import them in `decorators_practice.py`.',
      'Write `fx_rate(currency, month)` that reads `fx_rates.csv` once into a dict, decorate it with `@lru_cache`, call it 10,000 times and print `fx_rate.cache_info()`. Check the hits and misses make sense.',
      'Write a `@retry(times=3, exceptions=(ConnectionError,))` function that fails twice and then succeeds, and another that raises `ValueError`. Show that the first is retried and the second is not.',
      'Write `transaction(conn)` with `@contextmanager` and a small `FakeConn` class that records `COMMIT` and `ROLLBACK`. Use it twice: once with success, once with an exception halfway. Print both logs.',
      'Write a context manager `cd(path)` with `@contextmanager` that changes the working directory (`os.chdir`) and always changes back in `finally`. Test that it changes back even after an error.',
    ],
    deliverable: '`tools.py`, `decorators_practice.py` and its printed output (cache_info, both retry runs, both transaction logs).',
  },
};
