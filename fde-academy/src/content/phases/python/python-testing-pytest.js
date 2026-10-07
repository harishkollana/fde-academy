export default {
  id: 'python-testing-pytest',
  title: 'Testing with pytest',
  goal: 'You can write automatic tests for data code: plain asserts, fixtures, parametrize, tmp_path, raises, mocks and fakes (pytest on your laptop, unittest and unittest.mock in the browser), test transforms on tiny data, read coverage honestly, and explain how to test code that calls an API.',
  roadmap: ['pytest basics', 'fixtures and parametrize', 'mocking', 'tmp_path', 'coverage', 'testing transforms'],
  blocks: [
    `## The problem
Last month's reporting script worked. This month you improved one function, and now the Q2 total is different from the old report by ₹37. Which change caused it? You do not know, because the only "test" was to run the script and look at the output with tired eyes.

A **test** is a small piece of code that calls your code with an input whose correct answer you already know, and checks the result. When you keep these tests and run them **automatically** after every change, you get three things:
- **Safety**: a change that breaks something shows up in seconds, in the function that broke, not a week later in a report.
- **Freedom to improve**: you can clean up or speed up code (the Performance lesson) and know that the answers did not change.
- **Documentation**: a good test shows how a function is meant to be used and what the edge cases are.

For data engineers the best targets are the **transforms**: functions that take rows in and give rows out (a GST calculation, a fiscal-year label, a reconciliation rule, an allocation of costs). They are small, they have no side effects, and a bug in them is expensive. You do not test your whole pipeline against production data; you test the pieces against **tiny, hand-made data where you know the answer**.

**Where this runs.** \`pytest\` is not available in the browser playground, so the pytest parts are shown in code blocks and in "Do this on your laptop" boxes with the real output. In the browser you will run the same ideas with Python's built-in \`unittest\` and \`unittest.mock\`, and with a test runner you write yourself, so you see exactly what a test framework does.`,
    `## What a test looks like
A test is a function whose name starts with \`test_\`, with the shape **arrange, act, assert**:
\`\`\`python
def test_gst_on_a_round_amount():
    taxable = Decimal("1000.00")          # arrange: the input
    result = gst(taxable)                 # act: call the code under test
    assert result == Decimal("180.00")    # assert: the answer you know is right
\`\`\`
A plain \`assert\` is enough. If the condition is false the test **fails**, and **pytest**, the standard test tool, prints both sides of the comparison so you can see what went wrong. If the function raises an unexpected error the test is an **error**. If nothing is raised the test **passes**. The tool finds tests by name: files called \`test_*.py\`, functions called \`test_*\`.

**What makes a good test:**
- It tests **one behaviour** and its name says which: \`test_gst_rejects_negative_amounts\`.
- It is **independent**: it does not rely on another test having run first.
- It is **fast** and **deterministic**: no real network, no real clock, no random numbers without a seed, no reading production files.
- It checks **edge cases**: empty input, one row, duplicates, nulls, the odd paisa, the last day of the fiscal year, the planted quirks in the Kollana data (the 4 unbalanced journals).
- It fails for the right reason: when you break the code on purpose, it goes red.`,
    { sketch: { w: 760, h: 300, caption: 'Test data jobs as a pyramid: many fast tests of small pieces, few slow tests of the whole', items: [
      { t: 'box', x: 220, y: 24, w: 320, h: 62, label: 'smoke test: the whole job', sub: 'on a 20-row sample file. one or two', fill: 'pink', size: 16 },
      { t: 'box', x: 130, y: 96, w: 500, h: 62, label: 'integration tests', sub: 'a real test database, a temp folder (tmp_path). some', fill: 'yellow', size: 16 },
      { t: 'box', x: 40, y: 168, w: 680, h: 70, label: 'unit tests: pure transforms on tiny hand-made data', sub: 'gst(), fiscal_year(), allocate(), unbalanced_journals(). many, instant, run on every save', fill: 'green', size: 16 },
      { t: 'arrow', x1: 740, y1: 232, x2: 740, y2: 40 },
      { t: 'text', x: 740, y: 26, text: 'slower, fewer', size: 13, anchor: 'end', color: '#c0392b' },
      { t: 'note', x: 14, y: 252, w: 732, h: 40, fill: 'grey', size: 14, text: 'Data-quality checks also run in production: they test the DATA, these tests check the CODE.' },
    ] } },
    { py: {
      title: 'What a test runner does: tests are just functions, found by name',
      starter: `from decimal import Decimal

# the code under test
def gst(taxable, rate=Decimal("0.18")):
    if taxable < 0:
        raise ValueError("taxable value cannot be negative")
    return (Decimal(taxable) * rate).quantize(Decimal("0.01"))

# three tests: plain functions with plain asserts. This is all pytest asks of you.
def test_gst_on_a_round_amount():
    assert gst(Decimal("1000")) == Decimal("180.00")

def test_gst_rejects_negative():
    try:
        gst(Decimal("-1"))
    except ValueError as exc:
        assert "negative" in str(exc)
    else:
        raise AssertionError("expected a ValueError")

def test_gst_with_an_odd_paisa():            # this test has a WRONG expected value, on purpose
    assert gst(Decimal("1234.50")) == Decimal("222.20")

# a test runner in a dozen lines: find test_* names, call each, record the outcome
def run_all():
    names = [n for n in list(globals()) if n.startswith("test_")]
    passed = failed = 0
    for name in names:
        try:
            globals()[name]()
        except AssertionError as exc:
            failed += 1
            print(f"FAIL  {name}: {str(exc) or 'assertion failed (no message)'}")
        except Exception as exc:
            failed += 1
            print(f"ERROR {name}: {type(exc).__name__}: {exc}")
        else:
            passed += 1
            print(f"PASS  {name}")
    print(f"{passed} passed, {failed} failed")

run_all()
print()
print("the right answer for 1234.50 is:", gst(Decimal("1234.50")), "-> so the TEST was wrong. Fix the expected value and run again.")`,
      note: 'Real pytest does this plus much more: it rewrites assert so the failure shows both sides ("assert Decimal(\'222.21\') == Decimal(\'222.20\')"), supports fixtures and parametrize, runs tests in isolation, and has a huge plug-in ecosystem. Our runner shows only "assertion failed (no message)" for the failing test, which is why you use pytest. When a test fails, first ask: is the code wrong or is the test wrong? Here the test was wrong.',
    } },
    `## pytest in practice
Install it in your virtual environment (\`pip install pytest pytest-cov\`) and arrange the project like this:
\`\`\`text
kollana-reports/
  kollana/                 <- the code (a package)
    __init__.py
    finance.py
  tests/                   <- the tests
    test_finance.py
  pyproject.toml           <- pytest settings
\`\`\`
Run it with \`pytest\` (or \`python -m pytest\`). Useful options: \`-v\` (one line per test), \`-q\` (quiet), \`-x\` (stop at the first failure), \`-k gst\` (only tests whose name contains "gst"), \`--lf\` (only the tests that failed last time), \`-s\` (show \`print\` output).

The five features that give pytest its power:
1. **Fixtures** (\`@pytest.fixture\`): a function that **prepares something** a test needs (a sample file, a database, a settings object). A test asks for it **by naming it as a parameter**, and pytest builds it fresh for that test. Shared fixtures live in \`tests/conftest.py\`. Built-in ones you will use constantly: **\`tmp_path\`** (a new empty temporary folder), \`monkeypatch\` (change an environment variable or attribute for one test only), \`capsys\` (capture what the code prints), \`caplog\` (capture log messages).
2. **\`@pytest.mark.parametrize\`**: one test function, many cases. Each row becomes its own test with its own pass or fail.
3. **\`pytest.raises(ValueError, match="negative")\`**: assert that code raises an error with a matching message.
4. **\`pytest.approx\`**: compare floats with a tolerance (\`assert total == pytest.approx(0.3)\`). For money use \`Decimal\` and exact equality instead.
5. **Markers**: \`@pytest.mark.skip\`, \`xfail\` (known failing), and your own such as \`@pytest.mark.integration\`, so slow tests can be left out of the quick run (\`pytest -m "not integration"\`).`,
    { sketch: { w: 760, h: 292, caption: 'What pytest does when you run it: find, prepare, run, report', items: [
      { t: 'box', x: 14, y: 36, w: 150, h: 70, label: '1. collect', sub: 'tests/test_*.py\nfunctions test_*', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 168, y1: 71, x2: 208, y2: 71 },
      { t: 'box', x: 212, y: 36, w: 170, h: 70, label: '2. fixtures', sub: 'build what the test asks\nfor: tmp_path, gl_csv', fill: 'yellow', size: 16 },
      { t: 'arrow', x1: 386, y1: 71, x2: 426, y2: 71 },
      { t: 'box', x: 430, y: 36, w: 150, h: 70, label: '3. run the test', sub: 'act, then assert', fill: 'green', size: 16 },
      { t: 'arrow', x1: 584, y1: 71, x2: 624, y2: 71 },
      { t: 'box', x: 628, y: 36, w: 118, h: 70, label: '4. result', sub: '. pass   F fail\nE error', fill: 'pink', size: 16 },
      { t: 'line', x1: 505, y1: 108, x2: 505, y2: 132, dashed: true },
      { t: 'line', x1: 505, y1: 132, x2: 297, y2: 132, dashed: true },
      { t: 'arrow', x1: 297, y1: 132, x2: 297, y2: 110, dashed: true },
      { t: 'text', x: 401, y: 126, text: 'next test', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'note', x: 14, y: 154, w: 360, h: 120, fill: 'grey', size: 13, text: 'parametrize turns one function into several tests:\n("1000.00", "180.00")  ->  test 1\n("1234.50", "222.21")  ->  test 2\n("0", "0.00")  ->  test 3\nEach is reported on its own.' },
      { t: 'note', x: 392, y: 154, w: 354, h: 120, fill: 'yellow', size: 13, text: 'A failing assert prints BOTH sides:\n  assert [\'J2\'] == []\n  Left contains one more item: \'J2\'\nso you see what the code returned,\nnot just that something is wrong.' },
    ] } },
    { local: `**A real pytest project, step by step** (PowerShell, in a new folder \`C:\\fde\\kollana-reports\` with your virtual environment active; \`pip install pytest pytest-cov\`).

\`kollana\\__init__.py\` is an empty file. \`kollana\\finance.py\`:
\`\`\`python
import csv
from decimal import Decimal, ROUND_HALF_UP

PAISA = Decimal("0.01")


def gst(taxable, rate=Decimal("0.18")):
    """GST on a taxable value, rounded half up to the paisa."""
    if taxable < 0:
        raise ValueError("taxable value cannot be negative")
    return (Decimal(taxable) * rate).quantize(PAISA, rounding=ROUND_HALF_UP)


def unbalanced_journals(rows):
    """Journal ids whose debit and credit totals differ."""
    totals = {}
    for row in rows:
        debit, credit = totals.get(row["journal_id"], (Decimal(0), Decimal(0)))
        totals[row["journal_id"]] = (debit + Decimal(row["debit"]), credit + Decimal(row["credit"]))
    return sorted(j for j, (d, c) in totals.items() if d != c)


def load_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def usd_to_inr(amount, get_rate):
    """get_rate is passed in, so a test can replace the real API call."""
    return (Decimal(amount) * Decimal(str(get_rate("USD")))).quantize(PAISA, rounding=ROUND_HALF_UP)
\`\`\`
\`tests\\test_finance.py\`:
\`\`\`python
from decimal import Decimal
from unittest.mock import Mock

import pytest

from kollana.finance import gst, load_rows, unbalanced_journals, usd_to_inr


@pytest.mark.parametrize("taxable, expected", [
    ("1000.00", "180.00"),
    ("1234.50", "222.21"),      # 222.21 exactly: an odd paisa
    ("0", "0.00"),
])
def test_gst_rounds_half_up(taxable, expected):
    assert gst(Decimal(taxable)) == Decimal(expected)


def test_gst_rejects_negative():
    with pytest.raises(ValueError, match="negative"):
        gst(Decimal("-1"))


def test_unbalanced_journals_finds_the_bad_one():
    rows = [
        {"journal_id": "J1", "debit": "100", "credit": "0"},
        {"journal_id": "J1", "debit": "0", "credit": "100"},
        {"journal_id": "J2", "debit": "50", "credit": "0"},
        {"journal_id": "J2", "debit": "0", "credit": "40"},
    ]
    assert unbalanced_journals(rows) == ["J2"]


@pytest.fixture
def gl_csv(tmp_path):                      # tmp_path is built in: a fresh temporary folder per test
    path = tmp_path / "gl.csv"
    path.write_text("\\ufeffjournal_id,debit,credit\\r\\nJ1,10,0\\r\\nJ1,0,10\\r\\n", encoding="utf-8")
    return path


def test_load_rows_handles_a_bom(gl_csv):
    rows = load_rows(gl_csv)
    assert rows[0]["journal_id"] == "J1"
    assert unbalanced_journals(rows) == []


def test_usd_to_inr_uses_the_injected_rate():
    get_rate = Mock(return_value=83.21)
    assert usd_to_inr("100", get_rate) == Decimal("8321.00")
    get_rate.assert_called_once_with("USD")
\`\`\`
Run \`python -m pytest -v\`. Output to expect (pytest 9 on Python 3.12; the header lines will differ on your PC):
\`\`\`text
collected 7 items

tests/test_finance.py::test_gst_rounds_half_up[1000.00-180.00] PASSED    [ 14%]
tests/test_finance.py::test_gst_rounds_half_up[1234.50-222.21] PASSED    [ 28%]
tests/test_finance.py::test_gst_rounds_half_up[0-0.00] PASSED            [ 42%]
tests/test_finance.py::test_gst_rejects_negative PASSED                  [ 57%]
tests/test_finance.py::test_unbalanced_journals_finds_the_bad_one PASSED [ 71%]
tests/test_finance.py::test_load_rows_handles_a_bom PASSED               [ 85%]
tests/test_finance.py::test_usd_to_inr_uses_the_injected_rate PASSED     [100%]

============================== 7 passed in 0.08s ==============================
\`\`\`
**Gotcha 1: \`ModuleNotFoundError: No module named 'kollana'\`.** Plain \`pytest\` does not always put your project folder on the import path (\`python -m pytest\` does). Fix it once for everyone in \`pyproject.toml\`:
\`\`\`toml
[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
\`\`\`
**Gotcha 2: how a failure looks.** Change the last line of a test to \`assert unbalanced_journals(rows) == []\` and run again:
\`\`\`text
>       assert unbalanced_journals(rows) == []
E       AssertionError: assert ['J2'] == []
E         Left contains one more item: 'J2'
E         Use -v to get more diff

FAILED tests/test_fail.py::test_example_failure - AssertionError: assert ['J2...
1 failed in 0.13s
\`\`\`
**Coverage.** \`python -m pytest -q --cov=kollana --cov-report=term-missing\` prints which lines no test ran:
\`\`\`text
Name                  Stmts   Miss  Cover   Missing
---------------------------------------------------
kollana\\__init__.py       0      0   100%
kollana\\finance.py       18      0   100%
TOTAL                    18      0   100%
\`\`\`` },
    `## Mocks, fakes and "how do you test code that calls an API?"
A test must not depend on the internet, the real clock or a production database. It would be slow, it would fail for reasons that are not bugs, and it could do damage (send a payment!). So you **replace the outside world** with something you control. The words:
- A **stub or fake** is a simple stand-in that returns fixed data (a function that always returns rate 83.21).
- A **mock** (\`unittest.mock.Mock\`) is a stand-in that also **records how it was used**, so you can assert "it was called once with USD". \`Mock(return_value=...)\` returns a fixed value; \`Mock(side_effect=[...])\` returns or **raises** different things on each call (perfect for "fail twice, then succeed").
- \`patch("time.sleep")\` swaps a real function for a mock **while a \`with\` block runs**, so retry tests do not really wait. In pytest the same job is done by the \`monkeypatch\` fixture.

**The best answer is design, not patching: inject the dependency.** Compare:
\`\`\`python
def usd_to_inr(amount):                       # hard to test: the API call is hidden inside
    rate = requests.get(URL).json()["rate"]
    return amount * rate

def usd_to_inr(amount, get_rate):             # easy to test: the caller passes the rate source in
    return amount * get_rate("USD")
\`\`\`
In production you pass a function that really calls the API. In a test you pass a \`Mock\` or a lambda. The same idea made the retry function in the Errors lesson testable: it receives \`sleep\` as an argument, so a test passes a fake that records the waits.

**Do not over-mock.** A test that replaces everything only proves that your mocks agree with your code. Mock the **boundary** (network, clock, database), keep your own logic real, and add a small number of integration tests where the real database or file system is used.`,
    { sketch: { w: 760, h: 276, caption: 'Pass the outside world in: then a test can hand over a fake', items: [
      { t: 'text', x: 190, y: 22, text: 'hard to test', size: 16, bold: true, anchor: 'middle' },
      { t: 'box', x: 40, y: 38, w: 300, h: 70, label: 'usd_to_inr(amount)', sub: 'calls the real API inside', fill: 'pink', size: 16 },
      { t: 'arrow', x1: 190, y1: 112, x2: 190, y2: 150, label: 'no way to replace it', lx: 70, ly: 0 },
      { t: 'cloud', x: 100, y: 152, w: 180, h: 66, label: 'real API' },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 230, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 570, y: 22, text: 'easy to test', size: 16, bold: true, anchor: 'middle' },
      { t: 'box', x: 420, y: 38, w: 320, h: 70, label: 'usd_to_inr(amount, get_rate)', sub: 'the rate source is a parameter', fill: 'green', size: 15 },
      { t: 'arrow', x1: 500, y1: 150, x2: 500, y2: 112 },
      { t: 'text', x: 508, y: 136, text: 'production', size: 13, anchor: 'start', color: '#c0392b' },
      { t: 'arrow', x1: 660, y1: 150, x2: 660, y2: 112 },
      { t: 'text', x: 668, y: 136, text: 'test', size: 13, anchor: 'start', color: '#c0392b' },
      { t: 'cloud', x: 424, y: 154, w: 150, h: 60, label: 'real API' },
      { t: 'box', x: 590, y: 156, w: 150, h: 52, label: 'Mock(83.21)', size: 14, fill: 'yellow' },
      { t: 'note', x: 14, y: 236, w: 732, h: 34, fill: 'grey', size: 14, text: 'A test passes a Mock, then asserts on the answer AND on how the mock was called.' },
    ] } },
    { py: {
      title: 'unittest in the browser: setUp, assertions, subTest and a failing run',
      starter: `import io
import unittest
from decimal import Decimal, ROUND_HALF_UP

def split_gst(gst_total):
    """CGST and SGST from the total GST: half each, the odd paisa goes to SGST."""
    cgst = (gst_total / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return cgst, gst_total - cgst

def split_gst_buggy(gst_total):                # a wrong version: both halves rounded
    half = (gst_total / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return half, half

class SplitGstTests(unittest.TestCase):
    def setUp(self):                           # runs before EACH test: a fresh start every time
        self.even = Decimal("222.20")
        self.odd = Decimal("222.21")

    def test_even_total_splits_equally(self):
        self.assertEqual(split_gst(self.even), (Decimal("111.10"), Decimal("111.10")))

    def test_odd_paisa_goes_to_sgst(self):
        self.assertEqual(split_gst(self.odd), (Decimal("111.11"), Decimal("111.10")))

    def test_parts_always_add_up(self):
        for total in ("0.01", "0.05", "222.21", "1000.00"):
            with self.subTest(total=total):    # like pytest's parametrize: each case is reported on its own
                cgst, sgst = split_gst(Decimal(total))
                self.assertEqual(cgst + sgst, Decimal(total))

    def test_wrong_type_raises(self):
        with self.assertRaises(TypeError):     # like pytest.raises
            split_gst("not a number")

class BuggyTests(unittest.TestCase):           # the same property, run against the buggy function
    def test_parts_always_add_up(self):
        for total in ("0.01", "0.05", "222.21", "1000.00"):
            with self.subTest(total=total):
                cgst, sgst = split_gst_buggy(Decimal(total))
                self.assertEqual(cgst + sgst, Decimal(total))

def run(test_case):
    stream = io.StringIO()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(test_case)
    result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    return result, stream.getvalue()

result, text = run(SplitGstTests)
for line in text.splitlines():
    if line.endswith(" ok"):
        print("ok  ", line.split(" (")[0])
print("ran", result.testsRun, "tests | all passed:", result.wasSuccessful())

print("--- the same property against the buggy function")
result, text = run(BuggyTests)
print("all passed:", result.wasSuccessful(), "| failing sub-cases:", len(result.failures))
for _, message in result.failures:
    for line in message.splitlines():
        if line.startswith("AssertionError") or "(total=" in line:
            print("  ", line.strip())`,
      note: 'subTest keeps going after a failing case and reports each one separately: the buggy function fails for the totals with an odd paisa (0.01, 0.05 and 222.21) and passes for the even ones. setUp gives every test fresh data, so tests cannot affect each other. The structure is the same in pytest; only the spelling differs (plain assert instead of assertEqual).',
    } },
    { py: {
      title: 'unittest.mock: fake the API, fake the clock, assert how they were used',
      starter: `import time
from unittest.mock import Mock, patch

def call_with_retry(func, attempts, base, retryable):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            if attempt == attempts:
                raise
            time.sleep(base * 2 ** (attempt - 1))       # the REAL clock: a test must never wait for this

# 1. a Mock replaces a function and records how it was used
get_rate = Mock(return_value=83.21)
print(get_rate("USD"), "| calls:", get_rate.call_count, "|", get_rate.call_args)
get_rate.assert_called_once_with("USD")                 # raises AssertionError if this is not true

# 2. side_effect: a list gives one item per call, and an exception is RAISED
flaky = Mock(side_effect=[ConnectionError("busy"), ConnectionError("busy"), 83.21])
with patch("time.sleep") as fake_sleep:                 # for the length of this block time.sleep is a Mock
    result = call_with_retry(flaky, attempts=5, base=1, retryable=(ConnectionError,))
waits = [c.args[0] for c in fake_sleep.call_args_list]
print("result:", result, "| calls:", flaky.call_count, "| waits it asked for:", waits)

# 3. when the attempts run out: the error comes out, and there is no wait after the last one
always_down = Mock(side_effect=ConnectionError("down"))
with patch("time.sleep") as fake_sleep:
    try:
        call_with_retry(always_down, attempts=3, base=2, retryable=(ConnectionError,))
    except ConnectionError as exc:
        waits = [c.args[0] for c in fake_sleep.call_args_list]
        print("raised:", exc, "| calls:", always_down.call_count, "| waits:", waits)

# 4. patch.object swaps one method of one object, and puts the real one back afterwards
class Client:
    def get(self, url):
        raise RuntimeError("no real network in tests!")

client = Client()
with patch.object(client, "get", return_value={"rate": 83.21}) as fake_get:
    print(client.get("https://api.example.test/usd"), "| called with:", fake_get.call_args.args)
try:
    client.get("again")
except RuntimeError as exc:
    print("outside the with block the real method is back:", exc)

# 5. assert something was NOT called
never = Mock()
never.assert_not_called()
print("the retry above never touched a real clock or a real network")`,
      note: 'No test here waited for a second: time.sleep was a Mock, so we could check the waits (1 then 2) instantly. Mock(side_effect=[...]) is the standard way to script "fail, fail, succeed". The better design is to pass sleep in as a parameter (as in the Errors lesson), which needs no patching, but patch is what you use on code you cannot change.',
    } },
    `## Testing transforms, and what coverage means
A **transform test** feeds a small, hand-made input to a pure function and checks the output. For tabular code this means a handful of rows with a known answer:
\`\`\`python
def test_reconcile_finds_missing_and_amount_mismatch():
    books    = [row("INV/1", 100), row("INV/2", 200), row("INV/3", 300)]
    supplier = [row("INV/1", 100), row("INV/2", 250)]          # INV/3 missing, INV/2 differs
    result = reconcile(books, supplier)
    assert result.missing == ["INV/3"]
    assert result.mismatched == [("INV/2", 200, 250)]
\`\`\`
Good habits for data code:
- Test **invariants** that must always hold: the row count after a join is not larger than expected, debit total equals credit total, no duplicate keys, the allocation parts add up to the total.
- Keep **tiny fixtures** next to the tests, and one **sample file** for a smoke test of the whole job through \`tmp_path\`.
- For DataFrames compare with \`pandas.testing.assert_frame_equal\` (covered in the pandas phase).
- Add a **regression test** for every bug you fix: first write a test that reproduces it (it fails), then fix the code (it passes). The bug can never silently return.

**Coverage** counts which lines were executed during the tests. It is good for finding **untested code** (look at the "Missing" column). It is **not** a measure of quality: a test with no assert gives 100 percent coverage and proves nothing. Aim to cover the important logic and the error branches, not a magic percentage.

**Run the tests automatically.** Locally on every change (\`pytest -x -q\`), and in **CI** (GitHub Actions, a later phase) on every push, so the main branch is never broken. A pre-commit hook can run the fast tests before each commit (next lesson).`,
    { warn: `Things that go wrong with tests:
- **Tests that call the real API, clock or database.** They are slow and flaky. Inject the dependency or mock the boundary.
- **Tests that depend on each other or on order.** Each test must prepare its own data (a fixture) and clean up (\`tmp_path\` does it).
- **Weak asserts.** \`assert result\` or "it did not crash" proves little. Assert the exact expected value.
- **Floats for money in tests.** Use \`Decimal\` and exact equality; use \`pytest.approx\` only for real floating-point maths.
- **Copying the code into the test.** If the test computes the expected value with the same formula, both can be wrong in the same way. Use hand-computed numbers.
- **Over-mocking.** If everything is a mock, you test your mocks. Keep the logic real.
- **Chasing 100 percent coverage** with tests that assert nothing.
- **Tests that pass on your laptop only**, because they read \`C:\\fde\\...\` or today's date. Use \`tmp_path\` and fixed dates.
- **A failing test that is ignored** or \`skip\`ped for months. Fix it or delete it.
- **\`ModuleNotFoundError\` when running \`pytest\`.** Set \`pythonpath = ["."]\` in \`pyproject.toml\` or run \`python -m pytest\`.` },
    { pychallenge: {
      id: 'python-testing-pytest-ch1',
      prompt: 'Write `run_cases(func, cases)`, a hand-made `parametrize`. `cases` is a list of `(args, expected)`; `args` is a tuple. Call `func(*args)` for each case (numbering from 1). If `expected` is an **exception class**, the call must raise it. Return a list of failure messages (empty if everything passes) in exactly these forms: `case 2: expected 4, got 3`; `case 1: expected ValueError, got 3` (it returned instead of raising); `case 1: expected ValueError, raised ZeroDivisionError`; `case 3: expected 5, raised ZeroDivisionError` (a value was expected but it raised).',
      starter: `def run_cases(func, cases):
    # TODO: loop with enumerate(cases, start=1); call func(*args); compare or check the raised exception
    return []
`,
      tests: `def add(a, b):
    return a + b

def div(a, b):
    return a / b

assert run_cases(add, [((1, 2), 3), ((0, 0), 0), ((-1, 1), 0)]) == []
assert run_cases(add, [((1, 2), 4), ((2, 2), 4)]) == ["case 1: expected 4, got 3"]
assert run_cases(div, [((1, 0), ZeroDivisionError), ((4, 2), 2.0)]) == []
assert run_cases(div, [((1, 0), ValueError)]) == ["case 1: expected ValueError, raised ZeroDivisionError"]
assert run_cases(add, [((1, 2), ValueError)]) == ["case 1: expected ValueError, got 3"]
assert run_cases(div, [((1, 0), 5)]) == ["case 1: expected 5, raised ZeroDivisionError"]
assert run_cases(add, []) == []
assert run_cases(add, [((1, 1), 2), ((1, 1), 3), ((2, 2), 5)]) == ["case 2: expected 3, got 2", "case 3: expected 5, got 4"]`,
      solution: `def run_cases(func, cases):
    failures = []
    for number, (args, expected) in enumerate(cases, start=1):
        expects_error = isinstance(expected, type) and issubclass(expected, BaseException)
        try:
            actual = func(*args)
        except Exception as exc:
            if expects_error and isinstance(exc, expected):
                continue
            wanted = expected.__name__ if expects_error else repr(expected)
            failures.append(f"case {number}: expected {wanted}, raised {type(exc).__name__}")
            continue
        if expects_error:
            failures.append(f"case {number}: expected {expected.__name__}, got {actual!r}")
        elif actual != expected:
            failures.append(f"case {number}: expected {expected!r}, got {actual!r}")
    return failures
`,
      hint: 'Decide first whether `expected` is an exception class: `isinstance(expected, type) and issubclass(expected, BaseException)`. Wrap `func(*args)` in `try/except Exception as exc`. In the `except` branch: if an error was expected and `isinstance(exc, expected)` the case passes, otherwise record the "raised" message. After a normal return: record "got" if an error was expected, or if `actual != expected`.',
    } },
    { pychallenge: {
      id: 'python-testing-pytest-ch2',
      prompt: 'Test the tests. The function `check(retry_impl)` is yours to write. `retry_impl(func, attempts, base, retryable, sleep)` is a retry function (as in the Errors lesson: it calls `func()`, retries only the exceptions in the tuple `retryable`, calls `sleep(base * 2 ** (k - 1))` after failed attempt `k` except after the last one, re-raises when attempts run out). Write `check` so that it raises (any exception) for a **buggy** implementation and returns quietly for the correct one. The grader tries one correct and five buggy versions: it sleeps after the last attempt, it waits a constant time, it retries every exception, it swallows the final error, and it makes one attempt too few.',
      starter: `class Busy(Exception):
    pass

class Bad(Exception):
    pass

def check(retry_impl):
    # TODO: use a fake func that fails N times and a fake sleep that records the waits (waits.append).
    # Assert on: the result, the waits, how many times func was called, and what is raised.
    pass
`,
      tests: `def good(func, attempts, base, retryable, sleep):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            if attempt == attempts:
                raise
            sleep(base * 2 ** (attempt - 1))

def bug_sleeps_after_last(func, attempts, base, retryable, sleep):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            sleep(base * 2 ** (attempt - 1))
            if attempt == attempts:
                raise

def bug_constant_wait(func, attempts, base, retryable, sleep):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            if attempt == attempts:
                raise
            sleep(base)

def bug_retries_everything(func, attempts, base, retryable, sleep):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except Exception:
            if attempt == attempts:
                raise
            sleep(base * 2 ** (attempt - 1))

def bug_swallows_final_error(func, attempts, base, retryable, sleep):
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            if attempt < attempts:
                sleep(base * 2 ** (attempt - 1))
    return None

def bug_off_by_one(func, attempts, base, retryable, sleep):
    attempts -= 1
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retryable:
            if attempt == attempts:
                raise
            sleep(base * 2 ** (attempt - 1))

check(good)
bugs = {
    "sleeps after the last attempt": bug_sleeps_after_last,
    "waits a constant time": bug_constant_wait,
    "retries every exception": bug_retries_everything,
    "swallows the final error": bug_swallows_final_error,
    "makes one attempt too few": bug_off_by_one,
}
for name, impl in bugs.items():
    caught = False
    try:
        check(impl)
    except Exception:
        caught = True
    assert caught, f"your check did not catch this bug: {name}"`,
      solution: `class Busy(Exception):
    pass

class Bad(Exception):
    pass

def check(retry_impl):
    def make(failures, error=Busy):
        state = {"calls": 0}
        def func():
            state["calls"] += 1
            if state["calls"] <= failures:
                raise error("x")
            return "ok"
        return func, state

    func, state = make(2)
    waits = []
    assert retry_impl(func, 5, 1, (Busy,), waits.append) == "ok"
    assert waits == [1, 2], waits
    assert state["calls"] == 3

    func, state = make(99)
    waits = []
    try:
        retry_impl(func, 3, 1, (Busy,), waits.append)
    except Busy:
        pass
    else:
        raise AssertionError("must raise Busy when the attempts run out")
    assert state["calls"] == 3, state
    assert waits == [1, 2], waits

    func, state = make(99, error=Bad)
    waits = []
    try:
        retry_impl(func, 5, 1, (Busy,), waits.append)
    except Bad:
        pass
    else:
        raise AssertionError("Bad must be raised")
    assert state["calls"] == 1 and waits == []
`,
      hint: 'Write three scenarios. (1) A function that fails twice then returns "ok": assert the result is "ok", the recorded waits are `[1, 2]` and it was called 3 times. (2) A function that always fails with `Busy`, attempts=3: assert it raises `Busy` (use `try/except/else`), was called 3 times, and the waits are `[1, 2]`. (3) A function that raises `Bad` (not retryable): assert `Bad` comes out after 1 call and no waits.',
    } },
    { pychallenge: {
      id: 'python-testing-pytest-ch3',
      prompt: 'Write `run_tests(namespace)`, a tiny test runner. `namespace` is a dict like `globals()`. Run every **callable** whose name starts with `test_`, in dict order, with no arguments. Return `{"passed": [names], "failed": {name: message}}`. For a failed `assert` the message is `str(error)`, or `"assertion failed"` if that text is empty. For any other exception the message is `"<ExceptionName>: <text>"`. Values that are not callable (such as `test_value = 5`) and names that do not start with `test_` are ignored.',
      starter: `def run_tests(namespace):
    # TODO: loop over namespace.items(); pick callables whose name starts with "test_"; call; classify
    return {"passed": [], "failed": {}}
`,
      tests: `def test_a():
    assert 1 + 1 == 2

def test_b():
    assert 2 + 2 == 5, "math is broken"

def test_c():
    assert False

def test_d():
    {}["x"]

def helper():
    raise RuntimeError("not a test")

ns = {"test_a": test_a, "test_b": test_b, "test_c": test_c, "test_d": test_d, "helper": helper, "test_value": 5}
result = run_tests(ns)
assert result == {"passed": ["test_a"], "failed": {"test_b": "math is broken", "test_c": "assertion failed", "test_d": "KeyError: 'x'"}}, result
assert run_tests({}) == {"passed": [], "failed": {}}
assert run_tests({"test_x": lambda: None}) == {"passed": ["test_x"], "failed": {}}`,
      solution: `def run_tests(namespace):
    passed, failed = [], {}
    for name, obj in namespace.items():
        if not name.startswith("test_") or not callable(obj):
            continue
        try:
            obj()
        except AssertionError as exc:
            failed[name] = str(exc) or "assertion failed"
        except Exception as exc:
            failed[name] = f"{type(exc).__name__}: {exc}"
        else:
            passed.append(name)
    return {"passed": passed, "failed": failed}
`,
      hint: 'Loop over `namespace.items()` and skip anything that does not satisfy `name.startswith("test_") and callable(obj)`. Call `obj()` in a `try`. Catch `AssertionError` first (message `str(exc) or "assertion failed"`), then `Exception` (message `f"{type(exc).__name__}: {exc}"`), and add the name to `passed` in the `else` branch.',
    } },
    { real: 'For Project A you will put the transforms (GST, fiscal year, allocation, journal balance checks, the reconciliation rules) in a package with a `tests/` folder, and show `pytest` going green in the README and in the video. In a team, tests are what lets someone else change your code without fear, and **a pull request without tests for new logic is usually sent back**. When a finance user reports "the number is wrong for these three invoices", you add those three invoices as a failing test, fix the code, and the bug is closed for good. In interviews the question is rarely "do you know pytest" and more often "how do you know your pipeline is correct", and the answer is: unit tests on the transforms, data-quality checks on the data, and a smoke test on a sample file.' },
    { interview: `**"How do you test code that calls an API?"**
Model answer: "I do not call the real API in unit tests. I design the function so the API access is injected, for example it receives a \`get_rate\` function or a client object, and the test passes a fake or a \`Mock\` that returns fixed data or raises errors with \`side_effect\`. I assert on the result and on how the fake was called. For code I cannot change I patch the boundary with \`unittest.mock.patch\` or pytest's \`monkeypatch\`. I also keep one or two integration tests against a sandbox or a local test server, marked so they can be skipped in the quick run."

**"What is a fixture, and what is \`parametrize\`?"** "A fixture is a function that prepares something a test needs, such as a temporary file or a database connection. The test asks for it by parameter name, pytest builds it fresh and cleans up afterwards. \`parametrize\` runs one test function with many input and expected pairs, and reports each case on its own."

**"How would you test a data transformation?"** "I write a pure function with rows in and rows out, and test it with a few hand-made rows whose answer I know, including edge cases: empty input, duplicates, nulls and boundary dates. I also test invariants such as row counts and that debits equal credits, and I add a regression test for every bug I fix."

**"What does 100 percent coverage tell you?"** "Only that every line ran during the tests, not that the behaviour is checked. A test with no assertion gives coverage and no safety. I use coverage to find untested code and judge the tests by their assertions."` },
    `## Recap
- A **test** is a function \`test_*\` that arranges an input, calls the code and **asserts** a known answer. Make tests small, independent, fast and deterministic, and test **edge cases**. For data work, test **transforms** on tiny hand-made data.
- **pytest** (laptop): plain \`assert\`, **fixtures** (\`tmp_path\`, \`monkeypatch\`, \`capsys\`, \`caplog\`, your own), **\`parametrize\`**, **\`pytest.raises\`**, markers, \`-x -k --lf\`, and a project layout with \`tests/\` and \`pythonpath = ["."]\`.
- **Mock the boundary, not your logic.** \`Mock(return_value=...)\`, \`Mock(side_effect=[...])\`, \`patch("time.sleep")\`, \`assert_called_once_with\`. Better still, **inject** the dependency (pass \`get_rate\` or \`sleep\` in) so no patching is needed.
- In the browser the same ideas run with **\`unittest\`** (\`setUp\`, \`assertEqual\`, \`assertRaises\`, \`subTest\`) and \`unittest.mock\`. A test runner is only: find \`test_*\`, call, record pass or fail.
- **Coverage** shows untested lines, not good tests. Add a **regression test** for each bug, run tests on every change and in CI.`,
  ],
  quiz: [
    { q: 'How does pytest decide which functions are tests?', o: ['functions decorated with `@test`', 'functions called `test_*` in files called `test_*.py` (or `*_test.py`)', 'every function in the project', 'only functions listed in `pyproject.toml`'], a: 1, why: 'pytest collects tests by naming convention: files matching test_*.py and functions whose names start with test_.' },
    { q: 'What does `@pytest.mark.parametrize("taxable, expected", [("1000.00", "180.00"), ("0", "0.00")])` do?', o: ['it runs the test once with both values together', 'it skips the test when a value is zero', 'it creates a fixture called taxable', 'it runs the test function once per row, and each row passes or fails on its own'], a: 3, why: 'Parametrize turns one test function into several test cases, one for each tuple, each reported separately.' },
    { q: 'A function reads today\'s FX rate from a web API. What is the best way to unit-test it?', o: ['let it call the real API during the test', 'skip the test', 'make the rate source a parameter (or patch it) and give the test a fake that returns a fixed rate', 'copy the live rate into the code'], a: 2, why: 'Unit tests must be fast and deterministic. Injecting the dependency lets the test control the rate and also check how the function used it.' },
    { q: 'What is `tmp_path` in pytest?', o: ['a built-in fixture that gives each test a fresh, empty temporary folder', 'a command-line option', 'the path of the pytest executable', 'a marker that skips slow tests'], a: 0, why: 'tmp_path is a built-in fixture. Tests that write files use it, so they never touch real folders and clean up automatically.' },
    { q: 'A module has 100 percent coverage. What can you safely conclude?', o: ['it has no bugs', 'all edge cases are tested', 'every line was executed during the tests, but the tests may still assert nothing useful', 'the tests are fast'], a: 2, why: 'Coverage only records that lines ran. A test without a real assert still counts. Judge tests by what they assert.' },
    { q: 'You fixed a bug that made one invoice total wrong. What should you add?', o: ['a comment in the code', 'a regression test that reproduces the bug (fails before the fix, passes after)', 'a new log line', 'nothing: the fix is enough'], a: 1, why: 'A regression test keeps the bug from coming back unnoticed and documents the case that went wrong.' },
  ],
  task: {
    title: 'Give your finance helpers a pytest suite',
    steps: [
      'Create `C:\\fde\\kollana-reports` with a virtual environment, `pip install pytest pytest-cov`, and the structure from the lesson: `kollana\\finance.py`, `tests\\test_finance.py` and a `pyproject.toml` with `pythonpath = ["."]`.',
      'Copy the code and tests from the "A real pytest project" box and run `python -m pytest -v`. Break `gst` on purpose (use `ROUND_HALF_EVEN`) and see which parametrized case fails and how the failure looks. Put it back.',
      'Move your functions from the earlier tasks into the package: `fiscal_info`, `allocate`, `format_inr`. Write at least 5 parametrized cases for each, including 31 March and 1 April, an odd-paisa split and a negative amount.',
      'Write a fixture that builds a small GL list with one unbalanced journal (copy the structure of `fact_gl.csv`). Test `unbalanced_journals` on it. Then write a smoke test: `tmp_path` holds a 10-row CSV, the loader runs and the result is checked.',
      'Test `call_with_retry` from the Errors lesson using `Mock(side_effect=[...])` for the function and a fake `sleep` that records the waits. Assert the waits and the number of calls.',
      'Run `python -m pytest -q --cov=kollana --cov-report=term-missing`. Find one line with no coverage and either test it or write one sentence why it does not need a test. Add a README line with the exact command to run the tests.',
    ],
    deliverable: 'The project folder with `tests/`, the output of `pytest -v` showing all tests passing, and the coverage table.',
  },
};
