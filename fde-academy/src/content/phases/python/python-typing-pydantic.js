export default {
  id: 'python-typing-pydantic',
  title: 'Type hints and Pydantic',
  goal: 'You can write type hints (Optional, Union, Literal, TypedDict, Protocol), explain that Python does not enforce them, and use Pydantic v2 models with constraints and custom validators to check messy input at the door and report every error.',
  roadmap: ['type hints', 'Optional, Union and Literal', 'TypedDict and Protocol', 'Pydantic v2 models', 'constraints', 'custom validators'],
  blocks: [
    `## The problem
A vendor sends a CSV. The column \`amount\` holds \`"1,00,000"\` in one row, an empty string in another and the word \`TBD\` in a third. Your function does \`amount * 0.18\`. Python gives you a \`TypeError\` deep inside the GST calculation, and the error message says nothing about row 4,812 of the file.

Two ideas fix this, and they work together:
1. **Type hints** say what the data **should** be: \`amount: Decimal\`, \`ifsc: str\`, \`manager_id: int | None\`. They make code easier to read and let tools find mistakes **before** you run anything.
2. **Pydantic** is a library that reads those same hints at **run time** and checks the **real data**. Bad input is stopped at the door with a clear message, and good input arrives as clean, correctly typed objects.

The rule of thumb for data work: **never trust data that comes from outside** (a file, an API, an LLM answer, a form). Check its shape once, at the entry point. After that, the rest of your code can trust it.`,
    `## Type hints: notes that tools can read
A **type hint** (or *annotation*) is a label after a colon. It does not change how the code runs.
\`\`\`python
def net(debit: float, credit: float) -> float:   # inputs and output
    return debit - credit

total: float = 0.0              # a variable
names: list[str] = []           # a list of strings
rates: dict[str, float] = {}    # keys are str, values are float
pair: tuple[int, str] = (1, "IN01")
\`\`\`
The ones you will use all the time:

| Hint | Meaning |
|---|---|
| \`int\`, \`float\`, \`str\`, \`bool\`, \`bytes\` | the basic types |
| \`list[int]\`, \`set[str]\`, \`dict[str, float]\` | containers and what is inside |
| \`Optional[str]\` | a string **or** \`None\`: "can be missing" |
| \`Union[int, str]\` | one of several types |
| \`Literal["INR", "USD", "SGD"]\` | only these exact values |
| \`Callable[[int], str]\` | a function that takes an int and returns a str |
| \`Any\` | "turn the checking off for this value" |
| \`TypedDict\` | a dict with **known keys** and a type for each one |
| \`Protocol\` | "any object that has these methods" (duck typing, written down) |

Since Python 3.10 you write the "or" with a vertical bar: \`str | None\` means the same as \`Optional[str]\`, and \`int | str\` means the same as \`Union[int, str]\`. This lesson uses the short form, and you will see both in real code.

**The most important fact: Python does not enforce hints.** \`net("a", "b")\` runs happily and returns an error only if the code inside fails. A hint is a promise you write for people and tools. Three kinds of readers use it: your editor (autocomplete and red underlines), a **type checker** such as *mypy* or *Pyright* (they scan the code without running it), and libraries such as Pydantic and FastAPI (they read hints while running).`,
    { sketch: { w: 760, h: 300, caption: 'A hint is only a label: tools and libraries decide whether to act on it', items: [
      { t: 'note', x: 14, y: 40, w: 250, h: 160, fill: 'blue', size: 14, text: 'your function\nwith type hints\n\ndebit: float\ncredit: float\n-> float' },
      { t: 'arrow', x1: 268, y1: 70, x2: 330, y2: 48 },
      { t: 'arrow', x1: 268, y1: 120, x2: 330, y2: 128 },
      { t: 'arrow', x1: 268, y1: 170, x2: 330, y2: 208 },
      { t: 'box', x: 334, y: 20, w: 412, h: 56, label: 'editor + mypy / Pyright', sub: 'read the hints BEFORE the program runs and flag mistakes', fill: 'green', size: 16 },
      { t: 'box', x: 334, y: 100, w: 412, h: 56, label: 'Python itself', sub: 'ignores hints at run time: net("a", "b") still runs', fill: 'pink', size: 16 },
      { t: 'box', x: 334, y: 180, w: 412, h: 56, label: 'Pydantic, FastAPI', sub: 'read the hints WHILE running and CHECK the real data', fill: 'yellow', size: 16 },
      { t: 'note', x: 14, y: 252, w: 732, h: 40, fill: 'grey', size: 14, text: 'A hint says what you INTEND. Only a checker or a library like Pydantic acts on it.' },
    ] } },
    { py: {
      title: 'Hints are not enforced; TypedDict, Literal and Protocol',
      starter: `from typing import Literal, Protocol, TypedDict, get_type_hints

# 1. a hint is not a guard
def add(a: int, b: int) -> int:
    return a + b

print(add(2, 3))
print(add("GST", "IN"))              # runs: Python never checks the hints
print(get_type_hints(add))           # the hints are stored, tools can read them

# 2. TypedDict: a dict with known keys (only a type checker uses it)
class GLRow(TypedDict):
    journal_id: str
    account_id: int
    debit: float

row: GLRow = {"journal_id": "JV1", "account_id": 6110, "debit": 5000.0}
print(row["debit"], type(row).__name__)       # at run time it is just a dict

# 3. Literal: only these values are allowed (a checker enforces it)
Currency = Literal["INR", "USD", "SGD"]

def symbol(currency: Currency) -> str:
    return {"INR": "Rs", "USD": "$", "SGD": "S$"}[currency]

print(symbol("INR"))
# symbol("EUR") would be flagged by mypy before running, but Python raises only a KeyError

# 4. Protocol: "anything with these methods is fine", no inheritance needed
class Exporter(Protocol):
    def render(self, rows: list[tuple]) -> str: ...

class CsvExporter:                    # does NOT inherit from Exporter
    def render(self, rows: list[tuple]) -> str:
        return "\\n".join(",".join(map(str, r)) for r in rows)

def publish(exporter: Exporter, rows: list[tuple]) -> None:
    print(exporter.render(rows))

publish(CsvExporter(), [(6110, 5000), (4100, 900)])

# 5. None-able values: a checker makes you handle the missing case
def manager_name(names: dict[int, str], manager_id: int | None) -> str:
    if manager_id is None:            # without this check, mypy complains
        return "(top of the tree)"
    return names[manager_id]

print(manager_name({1: "Aarav Patel"}, None), "|", manager_name({1: "Aarav Patel"}, 1))`,
      note: 'Line 2 of the output is the proof: add("GST", "IN") returns "GSTIN" even though the hints say int. Hints never stop the program. That job belongs to a checker (before running) or to Pydantic (while running).',
    } },
    { local: `**Run a real type checker.** It reads your hints without running the program. In your project folder (with the virtual environment active, you set this up properly in the *Environments and packaging* lesson):
\`\`\`powershell
pip install mypy
mypy typing_demo.py
\`\`\`
Save this as \`typing_demo.py\` first:
\`\`\`python
from typing import Literal


def net(debit: float, credit: float) -> float:
    return debit - credit


def convert(amount: float, currency: Literal["INR", "USD", "SGD"]) -> float:
    return amount


def find_emp(emp_id: int) -> str | None:
    return None


net("100", 20)
total: int = net(100, 20)
convert(10.0, "EUR")
print(find_emp(1).upper())
\`\`\`
Output to expect (written with mypy 2.x; the wording can change a little between versions):
\`\`\`text
typing_demo.py:16: error: Argument 1 to "net" has incompatible type "str"; expected "float"  [arg-type]
typing_demo.py:17: error: Incompatible types in assignment (expression has type "float", variable has type "int")  [assignment]
typing_demo.py:18: error: Argument 2 to "convert" has incompatible type "Literal['EUR']"; expected "Literal['INR', 'USD', 'SGD']"  [arg-type]
typing_demo.py:19: error: Item "None" of "str | None" has no attribute "upper"  [union-attr]
Found 4 errors in 1 file (checked 1 source file)
\`\`\`
Four mistakes found without running the program. The last one is the most valuable: the function can return \`None\`, and calling \`.upper()\` on it would crash at run time.` },
    `## Pydantic: hints that check real data
Pydantic (version 2 here) turns a class with type hints into a **validator**. You describe the shape once; every time you create an object, Pydantic checks and converts the input.
\`\`\`python
from pydantic import BaseModel

class Employee(BaseModel):
    emp_id: int
    name: str
    manager_id: int | None = None      # optional, default None

e = Employee.model_validate({"emp_id": "7", "name": "Rohan", "manager_id": ""})
\`\`\`
What you need to know:
- **It converts** (this is called *lax mode*): the text \`"7"\` becomes the integer 7. It does **not** guess wildly: \`"abc"\` for an int is an error. Use \`strict=True\` on a field or model if you want no conversion at all.
- **It collects all errors.** If three fields are wrong you get **one** \`ValidationError\` that lists all three, with the field path (\`loc\`), a machine-readable \`type\` and a human message. \`exc.errors()\` gives them as a list of dictionaries: perfect for writing a rejects file.
- **Constraints** go in \`Field(...)\`: \`gt=0\`, \`ge=0\`, \`max_length=10\`, \`pattern=r"..."\`, \`decimal_places=2\`.
- **Useful methods:** \`model_validate(dict)\`, \`model_validate_json(text)\`, \`model_dump()\` (to a dict), \`model_dump_json()\`, \`model_json_schema()\` (a JSON Schema that describes the model).
- **Config:** \`model_config = ConfigDict(extra="forbid", frozen=True)\` rejects unknown keys (a typo like \`debt\`) and makes the object immutable.

**Custom rules.** \`@field_validator("ifsc", mode="before")\` runs on **one field**; \`mode="before"\` means "before the normal check", which is the place to clean the raw input (strip spaces, turn \`""\` into \`None\`). \`@model_validator(mode="after")\` runs when **all fields are valid**, for rules that compare fields (debit and credit must not both be filled). Raise \`ValueError("message")\` inside a validator and Pydantic turns it into a proper validation error.`,
    { py: {
      title: 'Validate employees.csv at the door and collect every problem',
      starter: `import csv
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

class Employee(BaseModel):
    model_config = ConfigDict(extra="forbid")        # a column we did not expect is an error

    emp_id: int
    emp_name: str = Field(min_length=1)
    manager_id: int | None = None
    department: str
    annual_ctc: Decimal = Field(gt=0)
    bank_account: str = Field(pattern=r"^\\d{9,18}$")
    ifsc: str = Field(pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    pan: str = Field(pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]$")

    @field_validator("manager_id", mode="before")
    @classmethod
    def blank_manager_is_none(cls, value):           # the top boss has an empty manager_id
        return None if value == "" else value

good, rejects = [], []
with open("employees.csv", newline="") as f:
    for number, row in enumerate(csv.DictReader(f), start=1):
        row = {k: v for k, v in row.items() if k not in ("city", "hire_date")}   # columns we do not model
        try:
            good.append(Employee.model_validate(row))
        except ValidationError as exc:
            for err in exc.errors():
                rejects.append((row["emp_id"], err["loc"][0], err["type"]))

print("valid:", len(good), "| rejected rows:", len({r[0] for r in rejects}))
for emp_id, field, kind in rejects:
    print(f"  emp {emp_id:>2}  field={field:<5} problem={kind}")

# a second check that one row can never see: the same bank account used twice
seen = {}
for e in good:
    seen.setdefault(e.bank_account, []).append(e.emp_id)
print("shared bank accounts:", {k: v for k, v in seen.items() if len(v) > 1})
print(good[0].model_dump())`,
      note: 'Four rows are rejected: employees 7 and 14 for the IFSC pattern, 9 and 18 because the PAN is empty (an empty string does not match the PAN pattern). Employee 12 passes row by row, because sharing a bank account is a rule about two rows, so it needs the second check. Always run row checks and cross-row checks separately and report both.',
    } },
    { sketch: { w: 760, h: 300, caption: 'Validate at the door: clean typed objects go on, every problem is written down with row, field and reason', items: [
      { t: 'doc', x: 14, y: 36, w: 110, h: 80, label: 'employees.csv', fill: 'grey' },
      { t: 'arrow', x1: 128, y1: 76, x2: 192, y2: 76, label: 'row dict', ly: -14 },
      { t: 'box', x: 196, y: 40, w: 212, h: 74, label: 'Employee model', sub: 'model_validate(row)', fill: 'yellow' },
      { t: 'arrow', x1: 412, y1: 58, x2: 500, y2: 40, label: 'valid', lx: -6, ly: -12 },
      { t: 'arrow', x1: 412, y1: 98, x2: 500, y2: 128, label: 'ValidationError', lx: -4, ly: 20 },
      { t: 'box', x: 504, y: 14, w: 242, h: 58, label: 'Employee objects', sub: 'typed, trusted, go on', fill: 'green', size: 16 },
      { t: 'box', x: 504, y: 100, w: 242, h: 62, label: 'rejects.csv', sub: 'row, field, reason: for a human', fill: 'pink', size: 16 },
      { t: 'table', x: 14, y: 196, title: 'what the rejects file holds (from exc.errors())', cols: ['emp', 'field', 'problem'], colW: [60, 70, 250], rows: [['7', 'ifsc', 'string_pattern_mismatch'], ['9', 'pan', 'string_pattern_mismatch'], ['14', 'ifsc', 'string_pattern_mismatch']], rowH: 24, fill: 'pink' },
      { t: 'note', x: 420, y: 200, w: 326, h: 84, fill: 'yellow', size: 13, text: 'Do not stop at the first bad row:\nfinish the file, write every reject,\nthen decide: fail the run, or load the\ngood rows and send the rejects to a person.' },
    ] } },
    { py: {
      title: 'Constraints, coercion, a model validator and the JSON Schema',
      starter: `import json
from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

class JournalLine(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    journal_id: str = Field(pattern=r"^JV\\d{6}-\\d{4}$")
    posting_date: date
    account_id: int = Field(ge=1000, le=9999)
    currency: Literal["INR", "SGD", "USD"]
    debit: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    credit: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)

    @model_validator(mode="after")
    def one_side_only(self):
        if (self.debit > 0) == (self.credit > 0):    # both filled, or both empty
            raise ValueError("a line needs a debit OR a credit, not both and not neither")
        return self

# text in, typed values out
ok = JournalLine.model_validate({"journal_id": "JV202504-0001", "posting_date": "2025-04-07",
                                 "account_id": "4100", "currency": "INR", "credit": "130833.18"})
print(ok)
print(type(ok.posting_date).__name__, type(ok.account_id).__name__, type(ok.credit).__name__)
print(ok.model_dump_json())

# several mistakes at once: ONE error object lists them all
bad = {"journal_id": "JV-1", "posting_date": "31/04/2025", "account_id": 12, "currency": "EUR",
       "debit": "10.123", "debt": 5}
try:
    JournalLine.model_validate(bad)
except ValidationError as exc:
    print(exc.error_count(), "problems:")
    for err in exc.errors():
        print(f"  {str(err['loc'][0]):<13} {err['type']}")

# the model validator, and a frozen object
try:
    JournalLine.model_validate({"journal_id": "JV202504-0001", "posting_date": "2025-04-07",
                                "account_id": 4100, "currency": "INR", "debit": 5, "credit": 5})
except ValidationError as exc:
    print("model rule:", exc.errors()[0]["type"])
try:
    ok.debit = Decimal("1")
except ValidationError as exc:
    print("frozen:", exc.errors()[0]["type"])

# the same model describes itself as a JSON Schema (FastAPI and LLM tools use this)
schema = JournalLine.model_json_schema()
print(sorted(schema["properties"])[:3], "...", "required:", schema["required"])`,
      note: 'Look at the "problems" list: six things are wrong and all six are reported together, including the unknown key "debt" (caught by extra="forbid") and the date written as 31/04/2025 (Pydantic reads dates as year-month-day, like 2025-04-30, so it refuses this format). The model_json_schema() output is the same description your tools will later send to an LLM or an API framework, so one model serves as validator, documentation and contract.',
    } },
    `## Which one: dict, TypedDict, dataclass or Pydantic?
| Tool | Checks data at run time? | Use it for |
|---|---|---|
| plain \`dict\` | no | quick scripts, exploring |
| \`TypedDict\` | no (checker only) | JSON-like dicts whose keys you want documented |
| \`@dataclass\` | no | **trusted** internal objects (data you built yourself) |
| Pydantic \`BaseModel\` | **yes** | **untrusted** data crossing a boundary: files, API requests, config, LLM output |

A good pattern: Pydantic **at the edge** (reading files, receiving requests), and plain dataclasses or Pydantic objects inside. Pydantic is a little slower than a dataclass, so for millions of already-clean rows pandas or a dataclass is the better inner tool.`,
    { warn: `Things that go wrong with hints and Pydantic:
- **Believing that hints protect you.** Without a checker or Pydantic, \`add("a", "b")\` still runs. Hints are not tests.
- **\`Any\` everywhere.** It switches the checker off. Use it only when you truly do not know.
- **Lax mode surprises.** Pydantic turns \`"7"\` into 7 and also \`1\` into \`True\` for a bool, and \`1.0\` into 1. Use \`strict=True\` where conversion would hide a bug.
- **Float for money.** Declare money as \`Decimal\` and send it as text. A float field accepts \`0.1\` and already carries an error.
- **Stopping at the first error.** Catch \`ValidationError\`, record all of \`exc.errors()\`, then decide. A file with one bad row out of a million should not hide the other 999,999 results.
- **Forgetting cross-row rules.** A model sees one row. Duplicates, totals and "this id must exist in the master" are checks you write around the model.
- **A mutable default** in a model field. Pydantic copies defaults safely, but \`default_factory\` is still the clear way to write it.
- **Version mix-ups.** Pydantic v1 code (\`@validator\`, \`.dict()\`, \`class Config\`) is old. In v2 it is \`@field_validator\`, \`.model_dump()\`, \`model_config\`.` },
    { pychallenge: {
      id: 'python-typing-pydantic-ch1',
      prompt: 'Write the Pydantic model `Payment` with these fields: `payment_id` (text, at least 1 character), `amount` (`Decimal`, greater than 0, at most 2 decimal places), `currency` (only `"INR"`, `"USD"` or `"SGD"`), `ifsc` (pattern: four capital letters, a zero, then six capital letters or digits) and `value_date` (a `date`). Text input like `"2026-09-30"` and `"1250.50"` must be converted. A model with several wrong fields must raise ONE `ValidationError` listing all of them.',
      starter: `from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field

class Payment(BaseModel):
    # TODO: add the five fields with constraints
    payment_id: str
`,
      tests: `from datetime import date
from decimal import Decimal
from pydantic import ValidationError

p = Payment.model_validate({"payment_id": "PAY-1", "amount": "1250.50", "currency": "INR",
                            "ifsc": "HDFC0072307", "value_date": "2026-09-30"})
assert p.amount == Decimal("1250.50") and isinstance(p.amount, Decimal)
assert p.value_date == date(2026, 9, 30)

def failing_fields(data):
    try:
        Payment.model_validate(data)
    except ValidationError as exc:
        return sorted({str(e["loc"][0]) for e in exc.errors()})
    return []

good = {"payment_id": "PAY-1", "amount": "10", "currency": "USD", "ifsc": "ICIC0089970", "value_date": "2026-09-30"}
assert failing_fields(good) == []
assert failing_fields({**good, "amount": "0"}) == ["amount"]
assert failing_fields({**good, "amount": "-5"}) == ["amount"]
assert failing_fields({**good, "amount": "10.123"}) == ["amount"]
assert failing_fields({**good, "currency": "EUR"}) == ["currency"]
assert failing_fields({**good, "ifsc": "HDFC123456"}) == ["ifsc"]
assert failing_fields({**good, "ifsc": "hdfc0072307"}) == ["ifsc"]
assert failing_fields({**good, "payment_id": ""}) == ["payment_id"]
assert failing_fields({**good, "value_date": "31/04/2026"}) == ["value_date"]
assert failing_fields({"payment_id": "", "amount": "0", "currency": "EUR", "ifsc": "x", "value_date": "no"}) == ["amount", "currency", "ifsc", "payment_id", "value_date"]`,
      solution: `from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field

class Payment(BaseModel):
    payment_id: str = Field(min_length=1)
    amount: Decimal = Field(gt=0, decimal_places=2)
    currency: Literal["INR", "USD", "SGD"]
    ifsc: str = Field(pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    value_date: date
`,
      hint: 'Use `Field(min_length=1)` for the id, `Field(gt=0, decimal_places=2)` for the amount, `Literal["INR", "USD", "SGD"]` for the currency, `Field(pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")` for the IFSC and plain `date` for the date. Pydantic reports all failing fields in one error by itself.',
    } },
    { pychallenge: {
      id: 'python-typing-pydantic-ch2',
      prompt: 'Write the function `validate_rows(rows, model)`. `rows` is a list of dicts, `model` is a Pydantic model class. Return a tuple `(good, rejects)`. `good` is a list of model objects for the valid rows. `rejects` is a list of dicts `{"row_number": n, "fields": [...]}` for the invalid rows, where `n` counts from **1** and `fields` is the **sorted** list of the field names that failed. Valid and invalid rows keep their order. Never raise.',
      starter: `from pydantic import ValidationError

def validate_rows(rows, model):
    # TODO: loop with enumerate(rows, start=1), try model.model_validate(row), catch ValidationError
    return [], []
`,
      tests: `from pydantic import BaseModel, Field

class Item(BaseModel):
    sku: str = Field(min_length=1)
    qty: int = Field(gt=0)

rows = [{"sku": "A", "qty": "2"}, {"sku": "", "qty": "0"}, {"sku": "B", "qty": 5}, {"sku": "C"}, {"qty": 3}]
good, rejects = validate_rows(rows, Item)
assert [g.sku for g in good] == ["A", "B"], good
assert good[0].qty == 2
assert rejects == [
    {"row_number": 2, "fields": ["qty", "sku"]},
    {"row_number": 4, "fields": ["qty"]},
    {"row_number": 5, "fields": ["sku"]},
], rejects
assert validate_rows([], Item) == ([], [])
g, r = validate_rows([{"sku": "A", "qty": 1}], Item)
assert len(g) == 1 and r == []`,
      solution: `from pydantic import ValidationError

def validate_rows(rows, model):
    good, rejects = [], []
    for number, row in enumerate(rows, start=1):
        try:
            good.append(model.model_validate(row))
        except ValidationError as exc:
            fields = sorted({str(err["loc"][0]) for err in exc.errors()})
            rejects.append({"row_number": number, "fields": fields})
    return good, rejects
`,
      hint: 'For each row, `try: good.append(model.model_validate(row))` and `except ValidationError as exc:`. Take `err["loc"][0]` from each item of `exc.errors()`, put them in a `set` to remove repeats, then `sorted(...)`. A missing field also appears in `errors()` with its name in `loc`.',
    } },
    { pychallenge: {
      id: 'python-typing-pydantic-ch3',
      prompt: 'Write the Pydantic model `Vendor` with `name` (text), `gstin` (text) and `pan` (text or `None`, default `None`). **Before** checking, `gstin` must be cleaned with `strip()` and `upper()`; after cleaning it must match the shape of a GSTIN: 2 digits, 5 capital letters, 4 digits, 1 capital letter, 1 letter or digit, the letter `Z`, and 1 letter or digit. An empty or blank `pan` must become `None`. If a `pan` is given, it must be equal to the characters at positions 3 to 12 of the GSTIN (`gstin[2:12]`), otherwise the whole model is invalid.',
      starter: `import re
from pydantic import BaseModel, field_validator, model_validator

class Vendor(BaseModel):
    name: str
    gstin: str
    pan: str | None = None
    # TODO: clean gstin, check its shape, blank pan -> None, pan must equal gstin[2:12]
`,
      tests: `from pydantic import ValidationError

v = Vendor(name="Nandi Electricals", gstin="  29aahcn9902l1zx ")
assert v.gstin == "29AAHCN9902L1ZX"
assert v.pan is None
assert Vendor(name="N", gstin="29AAHCN9902L1ZX", pan="").pan is None
assert Vendor(name="N", gstin="29AAHCN9902L1ZX", pan="   ").pan is None
assert Vendor(name="N", gstin="29AAHCN9902L1ZX", pan="AAHCN9902L").pan == "AAHCN9902L"

def invalid(**data):
    try:
        Vendor(**data)
    except ValidationError:
        return True
    return False

assert invalid(name="N", gstin="29AAHCN9902L1ZX", pan="AAAAA1111A")      # pan does not match the gstin
assert invalid(name="N", gstin="29AAHCN9902L1X")                          # too short
assert invalid(name="N", gstin="29AAHCN9902L1AX")                         # 14th character must be Z
assert invalid(name="N", gstin="ZZAAHCN9902L1ZX")                         # state code must be digits`,
      solution: `import re
from pydantic import BaseModel, field_validator, model_validator

GSTIN_SHAPE = re.compile(r"^\\d{2}[A-Z]{5}\\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$")

class Vendor(BaseModel):
    name: str
    gstin: str
    pan: str | None = None

    @field_validator("gstin", mode="before")
    @classmethod
    def clean_gstin(cls, value):
        return value.strip().upper() if isinstance(value, str) else value

    @field_validator("gstin")
    @classmethod
    def check_shape(cls, value):
        if not GSTIN_SHAPE.match(value):
            raise ValueError("not a valid GSTIN shape")
        return value

    @field_validator("pan", mode="before")
    @classmethod
    def blank_pan_is_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def pan_inside_gstin(self):
        if self.pan is not None and self.pan != self.gstin[2:12]:
            raise ValueError("PAN does not match the GSTIN")
        return self
`,
      hint: 'Use a compiled regex for the shape. One `@field_validator("gstin", mode="before")` cleans the text, a second `@field_validator("gstin")` (normal mode) checks the regex and raises `ValueError`. Another `before` validator turns a blank `pan` into `None`. Finally `@model_validator(mode="after")` compares `self.pan` with `self.gstin[2:12]`. Remember `@classmethod` under each field validator.',
    } },
    { real: 'Almost every integration you will build has a place where outside data enters: a vendor file, a webhook, a JSON answer from an LLM, a config file. Put a Pydantic model there. The model is also the **contract** you can show to the other side: `model_json_schema()` produces a document that describes the fields. FastAPI uses exactly these models for request and response bodies and builds its documentation page from them, and later, when you ask an LLM for structured output, you will send it a model like this and validate the reply with it, retrying when it fails. Learn this lesson well: it comes back in almost every phase after this one.' },
    { interview: `**"Does Python enforce type hints?"**
Model answer: "No. Hints are metadata. Python stores them but never checks them when the program runs. A static checker such as mypy or Pyright checks them before running, and libraries such as Pydantic and FastAPI read them at run time to validate data. So I use hints for readability and tooling, and Pydantic where I do not trust the input."

**"Pydantic versus dataclass?"** "A dataclass is a convenient container and does no validation: the hints are not checked. A Pydantic model validates and converts incoming data and reports all errors. I use Pydantic at the boundary, for files, APIs and config, and dataclasses for trusted internal objects."

**"What is \`Optional\`, and how do you write it today?"** "\`Optional[str]\` means \`str\` or \`None\`. In modern Python it is written \`str | None\`. It is a reminder that the value can be missing, and a type checker then forces me to handle \`None\`."

**"How would you validate a CSV with a million rows and report problems?"** "Stream the rows, validate each with a Pydantic model, catch \`ValidationError\`, store row number, field and error type, and keep going. I write the rejects to a file, count them, and decide by a threshold whether the run fails or the good rows are loaded. Cross-row rules, like duplicates, are separate checks."` },
    `## Recap
- **Type hints** (\`int\`, \`list[str]\`, \`str | None\`, \`Literal[...]\`, \`TypedDict\`, \`Protocol\`) describe intent. **Python does not enforce them**; editors and checkers like mypy read them before running.
- **Pydantic v2** reads the hints at run time: \`Model.model_validate(data)\` converts (lax mode) and checks, and raises one \`ValidationError\` listing every problem (\`exc.errors()\`: \`loc\`, \`type\`, \`msg\`).
- Constraints live in \`Field(gt=0, pattern=..., decimal_places=2)\`. Use \`@field_validator(mode="before")\` to clean raw input and \`@model_validator(mode="after")\` for rules across fields. \`extra="forbid"\` catches typos, \`frozen=True\` makes objects immutable.
- Validate at the **edge**: collect all rejects with row number, field and reason, then decide. Cross-row rules (duplicates, master data) are separate checks.
- Pydantic for untrusted data, dataclasses for trusted internal objects, \`Decimal\` for money, and \`model_json_schema()\` turns a model into a contract.`,
  ],
  quiz: [
    { q: 'You call `add("GST", "IN")` for `def add(a: int, b: int) -> int: return a + b`. What happens?', o: ['Python raises a TypeError before running the function', 'it runs and returns "GSTIN": hints are not enforced at run time', 'Python converts the strings to integers', 'the program stops with a syntax error'], a: 1, why: 'Type hints are not checked by Python itself. Only a type checker (before running) or a library like Pydantic (while running) acts on them.' },
    { q: 'Which hint means "a string or nothing"?', o: ['`str & None`', '`Literal[str]`', '`list[str]`', '`str | None` (or `Optional[str]`)'], a: 3, why: '`str | None` says the value may be missing. A type checker then makes you handle the `None` case before using the string.' },
    { q: '`Employee.model_validate({"emp_id": "7", "name": "Rohan"})` with `emp_id: int`. What does Pydantic do by default?', o: ['converts the text "7" into the integer 7 (lax mode)', 'raises an error because "7" is text', 'keeps "7" as text', 'sets `emp_id` to None'], a: 0, why: 'In lax mode Pydantic converts compatible input. Use `strict=True` when you want an error instead of a conversion.' },
    { q: 'A row has three wrong fields. How many `ValidationError`s are raised by `model_validate`?', o: ['three, one for each field', 'one for the first wrong field only', 'none: wrong fields are ignored', 'one, and `errors()` lists all three problems'], a: 3, why: 'Pydantic validates every field and reports everything in one `ValidationError`, which is ideal for a rejects file.' },
    { q: 'Where do you put a rule such as "a line must have a debit OR a credit, not both"?', o: ['in `@model_validator(mode="after")`, because it compares two fields', 'in a `@field_validator` on one field only', 'in the type hint', 'in a comment'], a: 0, why: 'A model validator in "after" mode runs when all fields are valid and can look at several fields together. Raise `ValueError` to reject.' },
    { q: 'Employees 4 and 12 share one bank account. Why does the row-by-row Pydantic check not find this?', o: ['Pydantic cannot read bank accounts', 'the pattern for the account is wrong', 'a model sees one row at a time, so a rule about two rows needs a separate check across all rows', 'the CSV is too large for Pydantic'], a: 2, why: 'Each row on its own is valid. Duplicates and "must exist in the master" rules are cross-row checks that you write around the model.' },
  ],
  task: {
    title: 'Build a validated loader for the employee file with a rejects report',
    steps: [
      'In `C:\\fde\\py-recap` create `validate_employees.py`. It needs `employees.csv` (exported in the *Comprehensions and control flow* task).',
      'Write the `Employee` Pydantic model (the one from the lesson, now also with `hire_date` as `date` and `city`). Use `Decimal` for `annual_ctc` and `extra="forbid"`.',
      'Write `validate_rows(rows, model)` (from challenge 2) in the same file. Run it on the CSV and write the rejects to `rejects.csv` with the columns `row_number,emp_id,field,problem`, one line per problem.',
      'Add the cross-row check: report every `bank_account` that belongs to more than one employee. Employee 12 and employee 4 must show up.',
      'Print a summary: rows read, valid, rejected, and the cross-row findings. Compare with the SQL facts: PAN is NULL for employees 9 and 18, IFSC is bad for 7 and 14.',
      'Install mypy (`pip install mypy`), add type hints to your functions and run `mypy validate_employees.py`. Fix what it reports.',
    ],
    deliverable: '`validate_employees.py`, `rejects.csv` and the printed summary.',
  },
};
