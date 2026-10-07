export default {
  id: 'python-errors',
  title: 'Errors and exceptions',
  goal: 'You can use try/except/else/finally correctly, know the exception hierarchy, raise and chain custom exceptions, choose between failing fast and collecting row errors, and write a retry with exponential backoff and jitter that only retries errors that can heal.',
  roadmap: ['try / except / else / finally', 'exception hierarchy', 'raising and custom exceptions', 'collect errors vs fail fast', 'retryable vs non-retryable errors', 'retry with backoff and jitter'],
  blocks: [
    `## The problem
It is 2 a.m. and your month-end job processes 400 supplier invoices. Invoice 12 has a blank amount. Two things can happen, and both are bad:
- **The job crashes.** Eleven invoices are done, 389 are not, and nobody knows which. At 9 a.m. the finance team has half a report.
- **The job hides the problem.** Someone wrote \`except: pass\` long ago. The bad invoice is skipped in silence, the report is wrong by that amount, and nobody ever finds out.

Errors are not the enemy. They are information. The skill is deciding, for each kind of error, **what should happen**: stop the whole run, skip one row and write it to a rejects file, try again in a few seconds, or ask a human. A good engineer can tell these cases apart. This lesson gives you the language (exceptions), the rules, and one very useful tool: a safe **retry with backoff**.`,
    `## try, except, else, finally
When Python meets a problem it **raises an exception**. If nothing catches it, the program stops and prints a traceback. A \`try\` statement lets you catch it:
\`\`\`python
try:
    value = float(text)          # risky code: keep this block SMALL
except ValueError:               # the specific error you can handle
    value = None
else:
    print("parsed fine")         # runs only if the try block raised nothing
finally:
    print("always runs")         # clean-up: runs on success, on error, even after return
\`\`\`
Read it as four separate jobs:
- **\`try\`**: the one or two lines that can fail.
- **\`except\`**: what to do about **one named kind** of failure.
- **\`else\`**: code that must run only when nothing failed. It is **outside** the protection of the \`except\`, so a bug in it is not hidden by accident.
- **\`finally\`**: clean-up that must always happen (close, release, remove a temp file). A \`with\` block (previous lesson) is the tidier way for most cases.

Python programmers prefer **EAFP**: "easier to ask forgiveness than permission". Instead of checking first (\`if the file exists\` and then open it), just try and handle the failure. It is shorter and it has no gap between the check and the use.`,
    { sketch: { w: 760, h: 300, caption: 'The four parts of try: which one runs when', items: [
      { t: 'box', x: 14, y: 100, w: 130, h: 62, label: 'try', sub: 'the risky lines', fill: 'blue' },
      { t: 'arrow', x1: 148, y1: 116, x2: 236, y2: 62, label: 'no error', lx: -12, ly: -12 },
      { t: 'arrow', x1: 148, y1: 148, x2: 236, y2: 202, label: 'error raised', lx: -14, ly: 24 },
      { t: 'box', x: 240, y: 30, w: 176, h: 62, label: 'else', sub: 'only if no error', fill: 'green' },
      { t: 'box', x: 240, y: 172, w: 176, h: 62, label: 'except', sub: 'the named error', fill: 'pink' },
      { t: 'arrow', x1: 420, y1: 62, x2: 512, y2: 112 },
      { t: 'arrow', x1: 420, y1: 202, x2: 512, y2: 150 },
      { t: 'box', x: 516, y: 90, w: 230, h: 80, label: 'finally', sub: 'ALWAYS runs:\nclose, release, tidy up', fill: 'grey' },
      { t: 'note', x: 14, y: 250, w: 732, h: 40, fill: 'yellow', size: 14, text: 'If no except matches the error, it keeps travelling up (after finally runs) until something catches it or the program stops.' },
    ] } },
    { py: {
      title: 'See the four clauses run, then the hierarchy and chaining',
      starter: `# 1. which clause runs when
def to_amount(text):
    try:
        value = float(text)                  # the risky line
    except ValueError:                       # only the error we know how to handle
        print("  except : cannot read", repr(text))
        return None
    else:
        print("  else   : parsed fine")       # only when nothing was raised
        return value
    finally:
        print("  finally: always runs, even after return")

print("good input:")
print("  ->", to_amount("1250.5"))
print("bad input:")
print("  ->", to_amount("TBD"))

# 2. exceptions form a family tree: catching a parent also catches its children
print([c.__name__ for c in FileNotFoundError.__mro__])
print(issubclass(KeyError, LookupError), issubclass(ValueError, LookupError))

def read_text(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:                # the most specific first
        return "(file is missing)"
    except OSError:                          # a broader parent, after the specific one
        return "(cannot read it)"

print(read_text("no_such_file.txt"))

# 3. raise your own error and keep the original as the cause
class AmountError(ValueError):               # a custom exception is just a class
    pass

def parse_amount(text):
    try:
        return float(text.replace(",", ""))
    except ValueError as exc:
        raise AmountError(f"bad amount {text!r}") from exc

try:
    parse_amount("1,2x")
except AmountError as err:
    print(err, "| caused by:", type(err.__cause__).__name__)

# 4. catch, do something, and let the error continue
def risky_step():
    try:
        {}["missing"]
    except KeyError:
        print("  logging the problem ...")
        raise                                # a bare raise re-raises the SAME error

try:
    risky_step()
except KeyError as err:
    print("caller still sees it:", repr(err))

# 5. several errors at once (Python 3.11+): ExceptionGroup and except*
try:
    raise ExceptionGroup("2 of 3 tasks failed", [ValueError("a"), KeyError("b")])
except* ValueError as group:
    print("value errors:", [str(e) for e in group.exceptions])
except* KeyError as group:
    print("key errors  :", len(group.exceptions))`,
      note: 'Notice the order in the first example: for the good input the order is else, then finally. For the bad input it is except, then finally. The ExceptionGroup at the end is how asyncio and thread pools report that several tasks failed at the same time; you will see it again in the asyncio lesson.',
    } },
    `## The exception family tree
Every exception is a class, and the classes form a tree. \`except SomeError\` catches \`SomeError\` **and all its children**. That is why order matters and why you should pick the narrowest type you can handle.

- \`BaseException\` is the root. Under it sit \`KeyboardInterrupt\` (Ctrl+C) and \`SystemExit\`. **You almost never want to catch these.** A bare \`except:\` catches them too, so the program can no longer be stopped with Ctrl+C. Never write a bare \`except:\`.
- \`Exception\` is the parent of all normal errors. \`except Exception\` is acceptable in **one** place: at the very top of a job, to log the error and exit with a failure code.
- Common children: \`ValueError\` (right type, wrong value, such as \`float("TBD")\`), \`TypeError\` (wrong type), \`KeyError\` and \`IndexError\` (both are \`LookupError\`), \`OSError\` (files, network: \`FileNotFoundError\`, \`PermissionError\`, \`TimeoutError\`, \`ConnectionError\`), \`ZeroDivisionError\`.
- **Your own errors** should inherit from \`Exception\` (or a more fitting child) and have a base class for your project, so callers can catch "any pipeline problem" or one specific kind.`,
    { sketch: { w: 760, h: 316, caption: 'Exceptions are a family tree: catch the narrowest branch you can handle', items: [
      { t: 'box', x: 290, y: 8, w: 180, h: 36, label: 'BaseException', fill: 'grey', size: 16 },
      { t: 'arrow', x1: 380, y1: 46, x2: 380, y2: 66 },
      { t: 'box', x: 290, y: 68, w: 180, h: 36, label: 'Exception', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 470, y1: 26, x2: 530, y2: 26 },
      { t: 'note', x: 534, y: 8, w: 212, h: 50, fill: 'pink', size: 13, text: 'KeyboardInterrupt, SystemExit\nDo not catch these.' },
      { t: 'arrow', x1: 330, y1: 106, x2: 64, y2: 138 },
      { t: 'arrow', x1: 340, y1: 106, x2: 174, y2: 138 },
      { t: 'arrow', x1: 360, y1: 106, x2: 294, y2: 138 },
      { t: 'arrow', x1: 400, y1: 106, x2: 424, y2: 138 },
      { t: 'arrow', x1: 440, y1: 106, x2: 620, y2: 138 },
      { t: 'box', x: 14, y: 140, w: 100, h: 40, label: 'ValueError', fill: 'white', size: 15 },
      { t: 'box', x: 124, y: 140, w: 100, h: 40, label: 'TypeError', fill: 'white', size: 15 },
      { t: 'box', x: 234, y: 140, w: 120, h: 40, label: 'LookupError', fill: 'white', size: 15 },
      { t: 'box', x: 364, y: 140, w: 120, h: 40, label: 'OSError', fill: 'white', size: 15 },
      { t: 'box', x: 494, y: 140, w: 252, h: 40, label: 'PipelineError (yours)', fill: 'yellow', size: 15 },
      { t: 'arrow', x1: 294, y1: 182, x2: 294, y2: 202 },
      { t: 'arrow', x1: 424, y1: 182, x2: 424, y2: 202 },
      { t: 'arrow', x1: 560, y1: 182, x2: 560, y2: 202 },
      { t: 'arrow', x1: 680, y1: 182, x2: 680, y2: 202 },
      { t: 'note', x: 234, y: 204, w: 120, h: 50, fill: 'white', size: 13, text: 'KeyError\nIndexError' },
      { t: 'note', x: 364, y: 204, w: 120, h: 62, fill: 'white', size: 13, text: 'FileNotFound\nTimeout\nConnection' },
      { t: 'box', x: 494, y: 204, w: 120, h: 40, label: 'DataError', fill: 'pink', size: 15 },
      { t: 'box', x: 626, y: 204, w: 120, h: 40, label: 'Retryable', fill: 'green', size: 15 },
      { t: 'note', x: 14, y: 276, w: 732, h: 34, fill: 'grey', size: 14, text: 'except OSError also catches FileNotFoundError. Put the specific branch first, and never write a bare  except:' },
    ] } },
    `## Fail fast or collect the errors?
In a data job a **bad row** is not the same as a **broken run**. You must decide, per kind of error:

| Situation | What to do |
|---|---|
| The file is missing, the header is wrong, the database is down | **Fail fast.** Nothing that follows can be trusted. Stop with a clear message. |
| A few rows have bad values (blank status, unknown customer) | **Collect and continue.** Process the good rows, write each bad row to a **rejects file** with row number, field and reason. |
| So many rows are bad that something is probably wrong with the whole file | **Collect, with a threshold.** Stop when more than, say, 2 % of the rows are bad. |
| A bug in your own code (\`TypeError\`, \`KeyError\` on a name you wrote) | **Do not catch it.** Let it crash: hiding a bug gives wrong numbers. |

The way to implement this cleanly is a **custom exception for "this row is bad"** (for example \`DataError\`) that carries the row number, the field and the reason, and a loop that catches **only that exception**. Everything else keeps travelling up.`,
    { sketch: { w: 760, h: 270, caption: 'Fail fast stops at the first bad row. Collect-and-continue keeps working and reports the bad rows', items: [
      { t: 'text', x: 190, y: 22, text: 'fail fast', size: 17, bold: true, anchor: 'middle' },
      { t: 'table', x: 12, y: 40, cols: ['row 1', '...', 'row 22', 'row 23', 'row 24', '...'], colW: [48, 36, 58, 58, 72, 72], rows: [['ok', 'ok', 'ok', 'BAD', 'skipped', 'skipped']], rowH: 30, hl: [0] },
      { t: 'note', x: 14, y: 110, w: 346, h: 84, fill: 'pink', size: 13, text: 'The run stops. Nothing after row 23 is done.\nRight when ONE error ruins everything:\na wrong header, a missing file, a down database.' },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 210, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 570, y: 22, text: 'collect and continue', size: 17, bold: true, anchor: 'middle' },
      { t: 'table', x: 396, y: 40, cols: ['row 1', '...', 'row 23', 'row 24', '...'], colW: [50, 40, 100, 60, 50], rows: [['ok', 'ok', 'BAD > rejects', 'ok', 'ok']], rowH: 30 },
      { t: 'note', x: 396, y: 110, w: 350, h: 84, fill: 'green', size: 13, text: 'Good rows are processed. Each bad row goes to\nrejects with row number, field and reason.\nAdd a threshold: stop if more than 2 percent\nof the rows are bad.' },
      { t: 'note', x: 14, y: 218, w: 732, h: 40, fill: 'yellow', size: 14, text: 'Catch only your own DataError in the loop. A bug (TypeError, KeyError) must still crash the run.' },
    ] } },
    { py: {
      title: 'Orders: fail fast, collect and continue, and a threshold',
      starter: `import csv

class DataError(Exception):
    """One row is bad. The run itself is fine."""
    def __init__(self, row_number, field, reason):
        super().__init__(f"row {row_number}: {field}: {reason}")
        self.row_number, self.field, self.reason = row_number, field, reason

class TooManyErrors(Exception):
    """So many rows are bad that the file itself is probably wrong."""

VALID_STATUS = {"Delivered", "Shipped", "Returned"}

with open("customers.csv", newline="") as f:
    customer_ids = {int(r["customer_id"]) for r in csv.DictReader(f)}
with open("orders.csv", newline="") as f:
    rows = list(csv.DictReader(f))

def check_order(number, row):
    if row["status"] not in VALID_STATUS:
        raise DataError(number, "status", f"{row['status']!r} is not allowed")
    if int(row["customer_id"]) not in customer_ids:
        raise DataError(number, "customer_id", f"unknown customer {row['customer_id']}")
    return float(row["amount"])

# style 1: fail fast
done = 0
try:
    for n, row in enumerate(rows, start=1):
        check_order(n, row)
        done += 1
except DataError as err:
    print("fail fast stopped ->", err, "| rows done before that:", done)

# style 2: collect and continue
total, rejects = 0.0, []
for n, row in enumerate(rows, start=1):
    try:
        total += check_order(n, row)
    except DataError as err:                  # ONLY our own error type
        rejects.append(err)
print("collected:", len(rows) - len(rejects), "good rows,", len(rejects), "rejects,", f"good total {total:,.0f}")
for err in rejects[:2] + rejects[-1:]:
    print("  ", err)

# style 3: collect, but stop when too many are bad
def run(rows, max_error_rate):
    rejects = []
    for n, row in enumerate(rows, start=1):
        try:
            check_order(n, row)
        except DataError as err:
            rejects.append(err)
            if len(rejects) / len(rows) > max_error_rate:
                raise TooManyErrors(f"{len(rejects)} bad rows so far, limit is {max_error_rate:.0%}")
    return rejects

print(len(run(rows, 0.10)), "rejects: inside the 10% limit")
try:
    run(rows, 0.02)
except TooManyErrors as err:
    print("aborted:", err)`,
      note: 'The status column is empty on every 23rd order, so fail-fast stops at the first one. Collecting shows the full picture: nine missing statuses and one order (row 77) that points to a customer who does not exist, which is the same orphan you found with SQL. A bug such as int("abc") would not be caught here, because the loop only catches DataError.',
    } },
    `## Retry: only for errors that can heal
Some failures **go away by themselves**: a timeout, a dropped connection, "429 too many requests", "503 service busy". Trying again after a short wait often works. Other failures **never go away**: a wrong password, "404 not found", a row that fails validation. Retrying those just wastes time and can lock an account.

| Retry (transient) | Do not retry (permanent) |
|---|---|
| connection reset, timeout | 400 bad request, 422 validation error |
| 429 too many requests (wait as told) | 401 or 403 (wrong or missing rights) |
| 500, 502, 503, 504 from the server | 404 not found |
| database deadlock or "try again" error | your own bug (\`TypeError\`) |

Design your exceptions around this split, for example \`TransientError\` and \`PermanentError\`, and retry only the first kind. Three more rules:
1. **Only retry safe operations.** Repeating "send payment" can pay twice. Repeating a read, or a write that is **idempotent** (it has the same effect run twice, for example an upsert or a call with an idempotency key), is safe.
2. **Wait longer each time: exponential backoff.** Wait 1 s, then 2, 4, 8 and so on, up to a **cap**. A server that is struggling needs space to recover.
3. **Add jitter: a random part in the wait.** If 1,000 clients all failed together and all wait exactly 1, 2, 4 seconds, they hit the server together again and again. "Full jitter" picks a **random** wait between 0 and the backoff limit, so the crowd spreads out.

Also set a **maximum number of attempts** (or a total time limit). An endless retry loop is an outage waiting to happen. After the last attempt, raise the error so a person or a dead-letter queue can take over.`,
    { py: {
      title: 'Retry with exponential backoff and seeded jitter, on a fake clock',
      starter: `import random

class TransientError(Exception):
    """Might work next time: timeout, 429, 503, connection reset."""

class PermanentError(Exception):
    """Will fail again: bad request, unknown id, wrong password."""

def call_with_retry(func, attempts=5, base=1.0, cap=30.0, rng=None, sleep=None):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except TransientError as exc:             # PermanentError is NOT caught: it stops at once
            if attempt == attempts:
                raise                             # out of attempts: let the caller decide
            wait = min(cap, base * 2 ** (attempt - 1))      # 1, 2, 4, 8 ... but never above the cap
            if rng is not None:
                wait = rng.uniform(0, wait)                 # "full jitter"
            print(f"  attempt {attempt} failed ({exc}); wait {wait:.2f} s")
            sleep(wait)

class FlakyService:
    def __init__(self, failures):
        self.failures, self.calls = failures, 0
    def get_rate(self):
        self.calls += 1
        if self.calls <= self.failures:
            raise TransientError("503 busy")
        return 83.21

class Clock:                                       # a fake clock: no real waiting, but we keep score
    def __init__(self):
        self.now = 0.0
    def sleep(self, seconds):
        self.now += seconds

print("A) three failures, plain exponential backoff")
clock, service = Clock(), FlakyService(failures=3)
print("  result:", call_with_retry(service.get_rate, sleep=clock.sleep), "| virtual time waited:", clock.now, "s")

print("B) the same, with full jitter (seeded, so the output is repeatable)")
clock, service = Clock(), FlakyService(failures=3)
print("  result:", call_with_retry(service.get_rate, rng=random.Random(7), sleep=clock.sleep))

print("C) gives up after the last attempt")
clock, service = Clock(), FlakyService(failures=99)
try:
    call_with_retry(service.get_rate, attempts=3, sleep=clock.sleep)
except TransientError as exc:
    print("  gave up after", service.calls, "calls:", exc)

print("D) a permanent error is not retried")
def wrong_password():
    raise PermanentError("401 unauthorised")
try:
    call_with_retry(wrong_password, sleep=clock.sleep)
except PermanentError as exc:
    print("  raised at once:", exc)

print("E) the cap keeps the waits bounded:", [min(30.0, 1.0 * 2 ** (a - 1)) for a in range(1, 9)])`,
      note: 'The fake clock is the trick for testing retry code: you inject the sleep function, so the test runs instantly and you can check the waits afterwards. In production you pass time.sleep. Example B is repeatable only because the random generator has a seed; in a real job you would not seed it.',
    } },
    { widget: 'RetryBackoff' },
    { warn: `Things that go wrong with errors:
- **A bare \`except:\` or \`except Exception: pass\`.** It hides bugs and even Ctrl+C. If you must catch broadly, log the full traceback and re-raise or exit with a failure.
- **A \`try\` block that covers 30 lines.** You no longer know which line failed. Keep it to the one risky call.
- **Catching an error and returning \`None\`.** The caller gets a mysterious \`None\` later (\`'NoneType' object has no attribute ...\`). Raise a clear error instead, or return a result object with the reason.
- **Using \`assert\` for validation.** Assertions are removed when Python runs with \`-O\`. Use \`if ...: raise ValueError(...)\`.
- **Losing the cause.** Use \`raise NewError("...") from exc\` so the traceback shows both.
- **Retrying forever, or retrying everything.** Set attempts and a cap, and retry only errors that can heal and operations that are safe to repeat.
- **Silent partial success.** If you skipped 10 rows, say so: print the count, write the rejects file, and exit with a non-zero code if the rejects are above your limit.` },
    { pychallenge: {
      id: 'python-errors-ch1',
      prompt: 'Write the custom exception `AmountError` (it must be a subclass of `ValueError`) and the function `load_amount(text)`. The function removes thousands commas and spaces around the text and returns a `Decimal`. For a blank string or text that is not a number it must raise `AmountError` with the message `bad amount: ` followed by the `repr` of the original text (for example `bad amount: \'abc\'`), and the original `decimal.InvalidOperation` error must be kept as its cause (use `raise ... from`). A blank string has no original error: raise `AmountError` without a cause.',
      starter: `from decimal import Decimal, InvalidOperation

class AmountError(Exception):
    pass

def load_amount(text):
    # TODO: strip, remove commas, convert to Decimal; wrap failures in AmountError
    return Decimal(text)
`,
      tests: `from decimal import Decimal, InvalidOperation

assert issubclass(AmountError, ValueError)
assert load_amount("1,250.50") == Decimal("1250.50")
assert load_amount("  75 ") == Decimal("75")
assert load_amount("1,00,000.5") == Decimal("100000.5")

try:
    load_amount("abc")
    raise AssertionError("expected AmountError")
except AmountError as err:
    assert str(err) == "bad amount: 'abc'", str(err)
    assert isinstance(err.__cause__, InvalidOperation), err.__cause__

try:
    load_amount("   ")
    raise AssertionError("expected AmountError")
except AmountError as err:
    assert str(err) == "bad amount: '   '", str(err)

try:
    load_amount("12x")
    raise AssertionError("expected AmountError")
except ValueError:
    pass`,
      solution: `from decimal import Decimal, InvalidOperation

class AmountError(ValueError):
    pass

def load_amount(text):
    cleaned = text.strip().replace(",", "")
    if not cleaned:
        raise AmountError(f"bad amount: {text!r}")
    try:
        return Decimal(cleaned)
    except InvalidOperation as exc:
        raise AmountError(f"bad amount: {text!r}") from exc
`,
      hint: 'Make `AmountError` inherit from `ValueError`. Clean the text with `text.strip().replace(",", "")`. If the cleaned text is empty, raise `AmountError(f"bad amount: {text!r}")`. Otherwise `try: return Decimal(cleaned)` and `except InvalidOperation as exc: raise AmountError(...) from exc`.',
    } },
    { pychallenge: {
      id: 'python-errors-ch2',
      prompt: 'The exceptions `DataError` and `TooManyErrors` are given. Write `process_all(rows, handler, max_errors=None)`. Call `handler(row)` for every row in order. A `DataError` raised by the handler is **collected**: store `(row_number, str(error))` with row numbers counting from 1, and carry on. Any other exception must **not** be caught. If `max_errors` is not `None` and the number of collected errors becomes **greater than** `max_errors`, raise `TooManyErrors` immediately. Return the tuple `(results, errors)`: the handler results of the good rows, in order, and the collected errors.',
      starter: `class DataError(Exception):
    pass

class TooManyErrors(Exception):
    pass

def process_all(rows, handler, max_errors=None):
    # TODO: loop with enumerate(rows, start=1); catch only DataError; stop when there are too many
    return [], []
`,
      tests: `def handler(row):
    if row < 0:
        raise DataError(f"negative: {row}")
    if row == 999:
        raise KeyError("a bug, not a data error")
    return row * 2

results, errors = process_all([1, -2, 3, -4, 5], handler)
assert results == [2, 6, 10], results
assert errors == [(2, "negative: -2"), (4, "negative: -4")], errors

assert process_all([], handler) == ([], [])

try:
    process_all([1, 999, 3], handler)
    raise AssertionError("a KeyError must not be swallowed")
except KeyError:
    pass

results, errors = process_all([-1, -2, 3], handler, max_errors=2)
assert len(errors) == 2 and results == [6]

try:
    process_all([-1, -2, -3, 4], handler, max_errors=2)
    raise AssertionError("expected TooManyErrors")
except TooManyErrors:
    pass`,
      solution: `class DataError(Exception):
    pass

class TooManyErrors(Exception):
    pass

def process_all(rows, handler, max_errors=None):
    results, errors = [], []
    for number, row in enumerate(rows, start=1):
        try:
            results.append(handler(row))
        except DataError as exc:
            errors.append((number, str(exc)))
            if max_errors is not None and len(errors) > max_errors:
                raise TooManyErrors(f"more than {max_errors} bad rows")
    return results, errors
`,
      hint: 'Keep two lists. Inside the loop: `try: results.append(handler(row))`, `except DataError as exc:` append `(number, str(exc))`, then check `if max_errors is not None and len(errors) > max_errors: raise TooManyErrors(...)`. Do not write `except Exception`.',
    } },
    { pychallenge: {
      id: 'python-errors-ch3',
      prompt: 'Write `call_with_retry(func, attempts, base, cap, retryable, sleep, rng=None)`. Call `func()`. If it raises an exception that is an instance of `retryable` (a tuple of exception classes), wait and try again; the wait after failed attempt number `k` (starting at 1) is `min(cap, base * 2 ** (k - 1))` seconds, passed to `sleep(seconds)`. If `rng` is given, the wait becomes `rng.uniform(0, that_value)` instead. After the **last** failed attempt, re-raise the error and do **not** sleep. Other exceptions are raised at once. Return the result of `func()` on success.',
      starter: `def call_with_retry(func, attempts, base, cap, retryable, sleep, rng=None):
    # TODO: loop over the attempts, catch only the retryable errors, sleep between attempts
    return func()
`,
      tests: `import random

class Busy(Exception):
    pass

class Bad(Exception):
    pass

def make(failures, error=Busy):
    state = {"calls": 0}
    def func():
        state["calls"] += 1
        if state["calls"] <= failures:
            raise error("x")
        return "ok"
    func.state = state
    return func

waits = []
f = make(3)
assert call_with_retry(f, attempts=5, base=1, cap=30, retryable=(Busy,), sleep=waits.append) == "ok"
assert waits == [1, 2, 4], waits
assert f.state["calls"] == 4

waits = []
f = make(99)
try:
    call_with_retry(f, attempts=4, base=2, cap=5, retryable=(Busy,), sleep=waits.append)
    raise AssertionError("expected Busy")
except Busy:
    pass
assert waits == [2, 4, 5], waits
assert f.state["calls"] == 4

waits = []
f = make(99, error=Bad)
try:
    call_with_retry(f, attempts=5, base=1, cap=30, retryable=(Busy,), sleep=waits.append)
    raise AssertionError("expected Bad")
except Bad:
    pass
assert waits == [] and f.state["calls"] == 1

waits = []
f = make(2)
call_with_retry(f, attempts=5, base=1, cap=30, retryable=(Busy,), sleep=waits.append, rng=random.Random(5))
check = random.Random(5)
assert waits == [check.uniform(0, 1), check.uniform(0, 2)], waits`,
      solution: `def call_with_retry(func, attempts, base, cap, retryable, sleep, rng=None):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            if attempt == attempts:
                raise
            wait = min(cap, base * 2 ** (attempt - 1))
            if rng is not None:
                wait = rng.uniform(0, wait)
            sleep(wait)
`,
      hint: 'Use `for attempt in range(1, attempts + 1)` with `try: return func()` and `except retryable:` (a tuple works there). On the last attempt do a bare `raise`. Otherwise compute `wait = min(cap, base * 2 ** (attempt - 1))`, apply `rng.uniform(0, wait)` if `rng` is given, and call `sleep(wait)`.',
    } },
    { real: 'Every unattended job needs this error policy written down, and it is a good thing to put into the README of Project A: which errors stop the run (missing file, bad header, database down), which are collected as rejects (bad rows), what the reject threshold is, and which calls are retried and how often. The **rejects file** is what the finance user actually reads in the morning. The retry rules are what keeps your API calls from failing at 2 a.m. because of one slow second. And the exit code (0 for success, non-zero for failure) is how a scheduler or a pipeline tool knows that your job needs attention.' },
    { interview: `**"Explain try, except, else and finally."**
Model answer: "\`try\` holds the risky code, \`except\` handles a specific error, \`else\` runs only if nothing was raised, and \`finally\` always runs for clean-up. I keep the try block small and catch the narrowest exception I can handle. I never use a bare \`except\`, because it also catches Ctrl+C and hides bugs."

**"How do you handle bad rows in a data pipeline?"** "I separate a bad row from a broken run. A broken run (missing file, wrong header) fails fast. Bad rows are caught with a custom \`DataError\`, written to a rejects file with row number, field and reason, and counted. If the reject rate is above a threshold I fail the run. Bugs are not caught."

**"How do you design a retry?"** "Retry only transient errors, such as timeouts, 429 and 5xx, and only for operations that are safe to repeat. Use exponential backoff with a cap and random jitter, a maximum number of attempts, and then raise or send to a dead-letter queue. Jitter stops many clients from retrying in step and hitting a recovering server together."

**"How do you make a script idempotent?"** "Running it twice must give the same result as running it once. I use upserts or \`ON CONFLICT\` instead of plain inserts, deterministic keys (for example a hash of the business key), write output to a temp file and rename it, track which files were already processed, and re-run by date or partition so a retry replaces data instead of adding it twice."` },
    `## Recap
- \`try\` = risky lines, \`except\` = one named error you can handle, \`else\` = only on success, \`finally\` = always. Catch the **narrowest** type, never write a bare \`except:\`, and keep the \`try\` block small.
- Exceptions form a **tree**: catching a parent catches its children. Make your own base error (\`PipelineError\`) and children (\`DataError\`, \`TransientError\`). Use \`raise X from exc\` to keep the cause, and a bare \`raise\` to pass an error on.
- A bad **row** is not a broken **run**: fail fast on structural problems, **collect** row errors into a rejects file, and stop on a threshold. Let bugs crash.
- **Retry only transient errors** and only operations that are safe to repeat. Use exponential backoff, a cap, jitter and a maximum number of attempts. Inject \`sleep\` so the code can be tested on a fake clock.
- Make jobs **idempotent**, report partial success honestly, and exit with a non-zero code when the run needs attention.`,
  ],
  quiz: [
    { q: 'Which clause runs only when the `try` block raised no exception?', o: ['`finally`', '`else`', '`except`', 'all of them'], a: 1, why: '`else` runs after a successful `try`. `finally` runs always, and `except` only when a matching error was raised.' },
    { q: 'Why should you avoid a bare `except:`?', o: ['it is slower than `except Exception`', 'it is a syntax error in Python 3', 'it also catches `KeyboardInterrupt` and `SystemExit` and hides bugs', 'it cannot be combined with `finally`'], a: 2, why: 'A bare `except:` catches everything, including Ctrl+C. You can no longer stop the program, and real bugs disappear silently.' },
    { q: '`except OSError:` is written before `except FileNotFoundError:`. What is wrong?', o: ['nothing: the order does not matter', 'Python raises a SyntaxError', 'the first clause is skipped', 'the second clause can never run, because `FileNotFoundError` is a child of `OSError` and the first clause catches it already'], a: 3, why: 'Python checks the except clauses in order. A parent class placed first catches all its children, so the specific clause after it is unreachable.' },
    { q: 'Which error should a retry loop retry?', o: ['a 503 "service busy" response', 'a 401 "wrong password" response', 'a `ValidationError` from your own check', 'a `TypeError` caused by your code'], a: 0, why: 'A 503 is transient and may succeed later. The others will fail in exactly the same way every time, so retrying only wastes time or locks an account.' },
    { q: 'What does jitter do in a retry policy?', o: ['it makes every wait exactly the same length', 'it adds a random part to each wait, so many clients do not retry at the same moment', 'it increases the number of attempts', 'it turns a permanent error into a transient one'], a: 1, why: 'Without jitter, clients that failed together retry together at 1, 2, 4 seconds and hit the recovering server in waves. Random waits spread them out.' },
    { q: 'Your loader meets a blank status in 10 of 220 order rows. What is the best default?', o: ['collect them as rejects with row number and reason, load the good rows, and fail only if the reject rate passes a limit', 'crash at the first one so nobody can miss it', 'ignore them silently with `except: pass`', 'delete the file'], a: 0, why: 'A few bad rows should not stop a whole run, and they must not vanish either. Rejects with reasons plus a threshold gives safe progress and full visibility.' },
  ],
  task: {
    title: 'A loader that collects rejects and a retrying fetch',
    steps: [
      'In `C:\\fde\\py-recap` create `errors_practice.py`. It needs `orders.csv` and `customers.csv` (exported in the *Comprehensions and control flow* task).',
      'Define `PipelineError` and its children `DataError(row_number, field, reason)`, `TransientError` and `PermanentError`. Write `check_order(number, row, customer_ids)` like the lesson: blank or unknown status, unknown customer, amount not a positive number.',
      'Load all orders, collect every `DataError` and write them to `rejects.csv` with the columns `row_number,field,reason`. You should find 10 rejects among the 220 orders (9 missing statuses and the orphan order 77).',
      'Add a threshold of 5 percent: if rejects are above it, print a message and finish with `sys.exit(1)`; otherwise `sys.exit(0)`. Check the exit code in PowerShell with `$LASTEXITCODE`.',
      'Write `call_with_retry(func, attempts, base, cap, retryable, sleep, rng=None)` (challenge 3). Test it with a function that fails twice using a fake `sleep` that records the waits.',
      'Add `finally` to the script so the rejects file is always closed, and write two sentences in a comment: which of your errors are retryable and why re-running the script is safe (idempotent).',
    ],
    deliverable: '`errors_practice.py`, `rejects.csv` (10 rows), the printed exit code and the recorded retry waits.',
  },
};
