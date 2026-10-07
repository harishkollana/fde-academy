export default {
  id: 'python-oop-dataclasses',
  title: 'Classes and dataclasses',
  goal: 'You can write a class with methods and dunder methods, replace boilerplate with a dataclass, use properties and class methods, choose composition over inheritance, and read a class-based repository without getting lost.',
  roadmap: ['classes and objects', 'dunder methods', 'dataclasses', 'properties and class methods', 'composition vs inheritance', 'protocols and duck typing', 'reading class-based repos'],
  blocks: [
    `## The problem
Your script reads the GL file and passes every row around as a dictionary. It works, until it does not. Someone types \`row["debt"]\` instead of \`row["debit"]\` and the error appears three functions later. A journal is "a list of rows that must balance", but that rule lives in a function in another file. A new colleague opens the project and cannot tell what a "row" even contains.

A **class** fixes this. It puts the **data** (fields) and the **behaviour** (functions that work on that data) in one named place:
- \`JournalLine\` knows it has an account, a debit and a credit, and can tell you its net amount.
- \`Journal\` knows it owns a list of lines and can tell you if it balances.

Python is not forced to be object-oriented, and a lot of data code is just functions and dictionaries. But most libraries you will use (pandas, SQLAlchemy, Pydantic, FastAPI, Airflow) are written with classes. You need to read them, and you need to write small ones well. This lesson teaches the part that matters for data work: simple classes, **dataclasses**, and the habits that keep class design simple.`,
    `## Classes and objects
A **class** is a blueprint. An **object** (also called an *instance*) is one thing built from the blueprint. Calling the class, \`JournalLine("JV1", 6110, 5000, 0)\`, builds one object. Each object has its **own copy of the fields**.

Four words to learn, once:
- **\`__init__\`** is the set-up method. Python calls it right after the object is created. It stores the incoming values as *attributes*.
- **\`self\`** is the object a method is working on. Python passes it automatically as the first argument. \`line.net()\` is the same as \`JournalLine.net(line)\`.
- An **attribute** is a variable that belongs to an object: \`line.debit\`.
- A **method** is a function defined inside a class: \`line.net()\`.

Names with two underscores on both sides, like \`__init__\`, are called **dunder methods** ("double underscore"). They are **hooks that Python calls for you**: \`print(x)\` calls \`x.__str__()\`, \`x == y\` calls \`x.__eq__(y)\`, \`len(x)\` calls \`x.__len__()\`.`,
    { sketch: { w: 760, h: 316, caption: 'The class is the blueprint, each call builds one object with its own field values', items: [
      { t: 'box', x: 14, y: 40, w: 214, h: 112, label: 'class JournalLine', sub: 'the blueprint:\nfields + methods', fill: 'yellow' },
      { t: 'arrow', x1: 232, y1: 96, x2: 292, y2: 96, label: 'call it', ly: -14 },
      { t: 'table', x: 296, y: 62, title: 'three objects (instances), each with its own values', cols: ['journal_id', 'account', 'debit', 'credit'], colW: [104, 94, 94, 94], rows: [['JV1', '6110', '5000', '0'], ['JV1', '1000', '0', '5000'], ['JV2', '4100', '0', '900']], rowH: 30, hl: [0] },
      { t: 'note', x: 14, y: 214, w: 360, h: 90, fill: 'blue', size: 13, text: '__init__ runs when the object is built\nand stores the values on self.\nself = the object the method works on:\nline.net()  is  JournalLine.net(line)' },
      { t: 'note', x: 392, y: 214, w: 354, h: 90, fill: 'pink', size: 13, text: 'Without __repr__, print(line) shows\n<JournalLine object at 0x...>: useless.\nWithout __eq__, two objects with the\nsame data are NOT equal.' },
    ] } },
    { py: {
      title: 'A plain class, and why the default behaviour disappoints',
      starter: `class PlainLine:
    def __init__(self, journal_id, account, debit, credit):
        self.journal_id = journal_id          # attributes belong to ONE object
        self.account = account
        self.debit = debit
        self.credit = credit

    def net(self):                            # self = the object this method is called on
        return self.debit - self.credit

a = PlainLine("JV1", 6110, 5000, 0)
b = PlainLine("JV1", 6110, 5000, 0)
print("net:", a.net())
print("default print is unhelpful:", "object at 0x" in repr(a))
print("same data, equal?", a == b)            # False: by default == compares identity, not content

# Step 2: teach the class what "equal" means and how to print itself
class Line:
    def __init__(self, journal_id, account, debit, credit):
        self.journal_id, self.account, self.debit, self.credit = journal_id, account, debit, credit

    def __repr__(self):                       # used by print() and by the notebook / debugger
        return f"Line({self.journal_id!r}, {self.account}, {self.debit}, {self.credit})"

    def __eq__(self, other):
        if not isinstance(other, Line):
            return NotImplemented             # "I do not know how to compare with that"
        return (self.journal_id, self.account, self.debit, self.credit) == (
            other.journal_id, other.account, other.debit, other.credit)

x = Line("JV1", 6110, 5000, 0)
y = Line("JV1", 6110, 5000, 0)
print(x, "| equal:", x == y)

# The catch: defining __eq__ switches OFF the default __hash__
try:
    print(len({x, y}))
except TypeError as exc:
    print("TypeError:", exc)

class HashableLine(Line):
    def __hash__(self):                       # equal objects MUST have equal hashes
        return hash((self.journal_id, self.account, self.debit, self.credit))

p, q = HashableLine("JV1", 6110, 5000, 0), HashableLine("JV1", 6110, 5000, 0)
print("a set now treats them as one:", len({p, q}))`,
      note: 'The TypeError is a classic interview question: when you define __eq__ yourself, Python removes __hash__, because two objects that are equal must also have the same hash. If you want to use such objects in a set or as dict keys, define __hash__ on the same fields. A dataclass (next) does this for you.',
    } },
    `## Dataclasses: the same class in four lines
Look at the \`Line\` class above. Most of it is boilerplate: repeat every field name in \`__init__\`, again in \`__repr__\`, again in \`__eq__\`, again in \`__hash__\`. Adding a field means editing four places, and forgetting one makes a bug.

The \`@dataclass\` decorator (from the last lesson, you know what a decorator is) writes all of it for you from a list of fields with type hints:
\`\`\`python
from dataclasses import dataclass

@dataclass
class Line:
    journal_id: str
    account: int
    debit: float = 0.0       # a default value
    credit: float = 0.0
\`\`\`
You get \`__init__\`, \`__repr__\` and \`__eq__\` for free. The options you will use most:

| Option | What it gives you |
|---|---|
| \`frozen=True\` | the object cannot be changed after creation, and it becomes hashable (usable in sets and as dict keys) |
| \`order=True\` | \`<\`, \`>\` and \`sorted()\` work, comparing the fields in order |
| \`field(default_factory=list)\` | a **fresh** list for each object |
| \`__post_init__\` | a method that runs right after \`__init__\`: validate or compute fields |
| \`slots=True\` | smaller and faster objects (an optimisation, not needed at first) |
| \`replace(obj, x=1)\` | a **copy** with some fields changed (the way to "edit" a frozen object) |
| \`asdict(obj)\` | the object as a dictionary, ready for JSON or a DataFrame |

**The mutable-default trap again.** \`items: list = []\` is refused with a \`ValueError\`, because all objects would share one list (the same bug as in the functions lesson). Use \`field(default_factory=list)\`.

The type hints in a dataclass are **not checked** when the program runs. \`Line("JV1", "abc")\` is accepted. If you want checking, you use Pydantic, which is the next lesson but one.`,
    { py: {
      title: 'Journal and GLLine as dataclasses: find the unbalanced journals',
      starter: `import csv
from collections import defaultdict
from dataclasses import dataclass, field, asdict, replace, FrozenInstanceError
from decimal import Decimal

@dataclass(frozen=True)                       # frozen: a posted line must never change
class GLLine:
    gl_id: int
    journal_id: str
    account_id: int
    debit: Decimal
    credit: Decimal

    @classmethod
    def from_row(cls, row):                   # an "alternative constructor": cls is the class itself
        return cls(int(row["gl_id"]), row["journal_id"], int(row["account_id"]),
                   Decimal(row["debit"]), Decimal(row["credit"]))

@dataclass
class Journal:
    journal_id: str
    lines: list = field(default_factory=list)   # a NEW list for every journal

    @property                                    # used like an attribute: journal.difference
    def difference(self):
        return sum((l.debit - l.credit for l in self.lines), Decimal("0"))

    @property
    def balanced(self):
        return self.difference == 0

journals = {}
with open("fact_gl.csv", newline="") as f:
    for row in csv.DictReader(f):
        line = GLLine.from_row(row)
        journals.setdefault(line.journal_id, Journal(line.journal_id)).lines.append(line)

bad = [j for j in journals.values() if not j.balanced]
print("journals:", len(journals), "| unbalanced:", len(bad))
for j in sorted(bad, key=lambda j: j.journal_id):
    print(f"  {j.journal_id}  lines={len(j.lines)}  debit - credit = {j.difference}")

first = next(iter(journals.values())).lines[0]
print(first)
print(asdict(first))
try:
    first.debit = Decimal("1")
except FrozenInstanceError:
    print("frozen: cannot assign to a field")
print(replace(first, debit=Decimal("1")).debit, "| the original is still", first.debit)

# the trap: a mutable default is refused
try:
    @dataclass
    class Wrong:
        items: list = []
except ValueError as exc:
    print("ValueError:", str(exc)[:46], "...")`,
      note: 'The four unbalanced journals match what you found with SQL: three have a duplicated line (3 lines instead of 2) and one has a debit inflated by 500. Frozen lines cannot be edited by accident; replace() builds a corrected copy. The computed difference is a property, so the code reads journal.balanced instead of balanced(journal).',
    } },
    `## Properties, class methods and static methods
- **\`@property\`** turns a method into something you read like an attribute: \`journal.balanced\`, not \`journal.balanced()\`. Use it for values **computed from other fields**, and to validate on assignment with a *setter*. It keeps the outside simple: callers do not care whether the value is stored or calculated.
- **\`@classmethod\`** receives the **class** as its first argument (\`cls\`), not an object. Its main use is an **alternative constructor**: \`GLLine.from_row(row)\`, \`Config.from_env()\`, \`Invoice.from_json(text)\`. Because it uses \`cls(...)\`, it also works for subclasses.
- **\`@staticmethod\`** receives neither. It is a plain function that lives inside the class only because it belongs there by topic. If you are unsure, use a normal module-level function.
- A leading underscore (\`_ifsc\`) is a **convention** that means "internal, please do not touch". Python does not enforce it.`,
    `## Inheritance, composition and duck typing
**Inheritance** means a class is built on another one: \`class CsvExporter(Exporter)\` gets everything from \`Exporter\`, and adds or changes what differs. \`super()\` calls the parent's version. Use it for a true **"is a"** relationship with shared behaviour.

**Composition** means an object **holds** other objects: a \`Journal\` *has* many \`GLLine\`s. Use it for **"has a"**.

Beginners reach for inheritance too early and end up with deep trees where nobody knows which class provides which method. A good rule: **prefer composition; inherit only for a clear "is a"; keep it one level deep.**

Python also has **duck typing**: "if it walks like a duck and quacks like a duck, it is a duck". A function that calls \`exporter.render(rows)\` works with **any** object that has a \`render\` method, whether or not it inherits from \`Exporter\`. A \`typing.Protocol\` (next lesson) writes this idea down so a type checker can verify it. An **abstract base class** (\`ABC\` with \`@abstractmethod\`) goes the other way: it **forces** children to implement the methods, and refuses to be created itself.`,
    { sketch: { w: 760, h: 316, caption: 'Composition: an object HAS parts. Inheritance: a class IS a kind of another class', items: [
      { t: 'text', x: 190, y: 24, text: 'composition: has a', size: 17, bold: true, anchor: 'middle' },
      { t: 'box', x: 110, y: 44, w: 160, h: 50, label: 'Journal', sub: 'journal_id, lines', fill: 'blue' },
      { t: 'arrow', x1: 150, y1: 98, x2: 70, y2: 138 },
      { t: 'arrow', x1: 190, y1: 98, x2: 190, y2: 138 },
      { t: 'arrow', x1: 230, y1: 98, x2: 310, y2: 138 },
      { t: 'box', x: 20, y: 140, w: 100, h: 44, label: 'GLLine', fill: 'white', size: 16 },
      { t: 'box', x: 140, y: 140, w: 100, h: 44, label: 'GLLine', fill: 'white', size: 16 },
      { t: 'box', x: 260, y: 140, w: 100, h: 44, label: 'GLLine', fill: 'white', size: 16 },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 200, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 570, y: 24, text: 'inheritance: is a', size: 17, bold: true, anchor: 'middle' },
      { t: 'box', x: 480, y: 44, w: 180, h: 50, label: 'Exporter', sub: 'render(rows), banner()', fill: 'yellow' },
      { t: 'arrow', x1: 520, y1: 140, x2: 540, y2: 98, label: 'is a', lx: -26, ly: 4 },
      { t: 'arrow', x1: 640, y1: 140, x2: 620, y2: 98 },
      { t: 'box', x: 430, y: 140, w: 150, h: 44, label: 'CsvExporter', fill: 'white', size: 15 },
      { t: 'box', x: 596, y: 140, w: 150, h: 44, label: 'JsonExporter', fill: 'white', size: 15 },
      { t: 'note', x: 14, y: 208, w: 360, h: 50, fill: 'blue', size: 13, text: 'The Journal keeps a list of its lines.\nChange the lines, the Journal class stays the same.' },
      { t: 'note', x: 392, y: 208, w: 354, h: 50, fill: 'yellow', size: 13, text: 'Both children reuse the parent code and\noverride only what differs (render).' },
      { t: 'note', x: 14, y: 270, w: 732, h: 36, fill: 'grey', size: 14, text: 'Rule of thumb: prefer composition. Inherit only for a clear "is a", and keep the tree one level deep.' },
    ] } },
    { py: {
      title: 'Properties with a setter, inheritance with super(), an abstract class and duck typing',
      starter: `import json
from abc import ABC, abstractmethod

# 1. a property with validation: assignment goes through the setter
class BankDetails:
    def __init__(self, ifsc):
        self.ifsc = ifsc                       # calls the setter below

    @property
    def ifsc(self):
        return self._ifsc

    @ifsc.setter
    def ifsc(self, value):
        value = value.strip().upper()
        if len(value) != 11 or value[4] != "0":
            raise ValueError(f"not an IFSC: {value!r}")
        self._ifsc = value

    @property
    def bank_code(self):                       # computed, read-only
        return self._ifsc[:4]

b = BankDetails("  hdfc0072307 ")
print(b.ifsc, b.bank_code)
try:
    b.ifsc = "HDFC123456"                      # the planted bad IFSC of employee 7
except ValueError as exc:
    print("ValueError:", exc)

# 2. an abstract parent and two children
class Exporter(ABC):
    def __init__(self, title):
        self.title = title

    @abstractmethod
    def render(self, rows):
        """Children MUST implement this."""

    def banner(self):
        return f"== {self.title} =="

class CsvExporter(Exporter):
    def render(self, rows):
        return "\\n".join(",".join(str(v) for v in row) for row in rows)

class JsonExporter(Exporter):
    def __init__(self, title, indent=None):
        super().__init__(title)                # reuse the parent's set-up
        self.indent = indent

    def render(self, rows):
        return json.dumps(rows, indent=self.indent)

try:
    Exporter("cannot build me")
except TypeError as exc:
    print("abstract class refuses to be created:", type(exc).__name__)

rows = [[6110, 5000], [4100, 900]]
for exporter in (CsvExporter("GL csv"), JsonExporter("GL json")):
    print(exporter.banner())
    print(exporter.render(rows))

# 3. duck typing: no parent class, still works
class ConsoleExporter:
    title = "console"
    def banner(self):
        return "== console =="
    def render(self, rows):
        return " | ".join(str(r) for r in rows)

def publish(exporter, rows):
    print(exporter.banner(), "->", exporter.render(rows))

publish(ConsoleExporter(), rows)
print(isinstance(ConsoleExporter(), Exporter))`,
      note: 'The abstract class cannot be built, because render has no body of its own. ConsoleExporter is not an Exporter, yet publish() accepts it: it only needs banner() and render(). That is duck typing.',
    } },
    `## How to read a class-based repository
You will often open someone else's code and meet a 300-line class. Read it in this order:

| Where to look | What it tells you |
|---|---|
| The class line \`class A(B):\` | A inherits from B. A missing method is probably in B. |
| \`__init__\` (or the dataclass fields) | The **state**: what the object remembers. Start here. |
| Methods without a leading underscore | The **public interface**: what other code calls. |
| \`@property\` | Looks like a field but is computed. |
| \`@classmethod\` named \`from_...\` | Other ways to build the object. |
| \`@abstractmethod\` / \`Protocol\` | A contract that other classes must follow. |
| \`_name\` | Internal detail. Skip it on the first read. |
| \`super()\` | The parent's version is called here. Open the parent. |

If you cannot find a method, search the repository for \`def method_name\`: the search shows which classes define it.`,
    { warn: `Things that go wrong with classes:
- **Forgetting \`self\`** in a method definition (\`def net(): ...\`) gives "takes 0 positional arguments but 1 was given".
- **\`__eq__\` without \`__hash__\`.** Your objects stop working in sets and as dict keys. Dataclasses with \`frozen=True\` handle both.
- **Mutable defaults** (\`items: list = []\`, or \`def __init__(self, items=[])\`). All objects would share one list. Use \`default_factory\` or \`None\`.
- **A mutable object as a dict key or set member** that is changed afterwards. Its hash changes and the lookup fails. Freeze it.
- **Deep inheritance.** Three levels with overridden methods is hard to follow. Use composition.
- **Classes where a function would do.** A class with only \`__init__\` and one method is a function wearing a costume. Use classes when data and behaviour belong together.
- **Trusting type hints.** In a dataclass they are documentation, not checks.` },
    { pychallenge: {
      id: 'python-oop-dataclasses-ch1',
      prompt: 'Write the **frozen dataclass** `LineItem` with the fields `sku` (str), `qty` (int) and `unit_price` (Decimal), in that order. Add a property `total` that returns `qty * unit_price`. A `qty` of zero or less must raise `ValueError` when the object is created (use `__post_init__`). Because it is frozen, equal items must be equal and hashable, and assigning to a field must fail.',
      starter: `from dataclasses import dataclass
from decimal import Decimal

# TODO: make LineItem a frozen dataclass with sku, qty, unit_price, a total property and a qty check
class LineItem:
    pass
`,
      tests: `from dataclasses import FrozenInstanceError, is_dataclass
from decimal import Decimal

item = LineItem("SKU-1", 3, Decimal("250.50"))
assert is_dataclass(item)
assert item.total == Decimal("751.50"), item.total
assert item == LineItem("SKU-1", 3, Decimal("250.50"))
assert repr(item).startswith("LineItem(")
assert len({item, LineItem("SKU-1", 3, Decimal("250.50"))}) == 1
try:
    item.qty = 5
    raise AssertionError("a frozen dataclass must not allow assignment")
except FrozenInstanceError:
    pass
for bad in (0, -2):
    try:
        LineItem("X", bad, Decimal("1"))
        raise AssertionError("qty must be positive")
    except ValueError:
        pass`,
      solution: `from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class LineItem:
    sku: str
    qty: int
    unit_price: Decimal

    def __post_init__(self):
        if self.qty <= 0:
            raise ValueError("qty must be positive")

    @property
    def total(self):
        return self.qty * self.unit_price
`,
      hint: 'Put `@dataclass(frozen=True)` above the class and list the three fields with type hints. `__post_init__(self)` can read `self.qty` (reading is allowed on a frozen object). Add `@property def total(self): return self.qty * self.unit_price`.',
    } },
    { pychallenge: {
      id: 'python-oop-dataclasses-ch2',
      prompt: 'The frozen dataclass `Line(debit, credit)` is given. Write the dataclass `Journal` with `journal_id` and a list `lines` (every journal must get its **own** empty list), a method `add(line)`, the properties `difference` (total debit minus total credit, as a `Decimal`) and `balanced` (`True` when the difference is zero), and the class method `from_rows(journal_id, rows)` that builds a journal from dicts like `{"debit": "50.25", "credit": "0"}` (text values).',
      starter: `from dataclasses import dataclass, field
from decimal import Decimal

@dataclass(frozen=True)
class Line:
    debit: Decimal
    credit: Decimal

# TODO: Journal needs journal_id, its own lines list, add(), difference, balanced and from_rows()
class Journal:
    pass
`,
      tests: `from decimal import Decimal

j = Journal("JV1")
k = Journal("JV2")
j.add(Line(Decimal("100.10"), Decimal("0")))
assert k.lines == [], "lines must not be shared between journals"
assert j.balanced is False
assert j.difference == Decimal("100.10")
j.add(Line(Decimal("0"), Decimal("100.10")))
assert j.balanced is True
assert j.difference == 0
assert len(j.lines) == 2

m = Journal.from_rows("JV3", [{"debit": "50.25", "credit": "0"}, {"debit": "0", "credit": "50.25"}])
assert isinstance(m, Journal) and m.journal_id == "JV3" and m.balanced
assert m.lines[0] == Line(Decimal("50.25"), Decimal("0"))
assert Journal("A") == Journal("A")
assert Journal.from_rows("E", []).balanced is True`,
      solution: `from dataclasses import dataclass, field
from decimal import Decimal

@dataclass(frozen=True)
class Line:
    debit: Decimal
    credit: Decimal

@dataclass
class Journal:
    journal_id: str
    lines: list = field(default_factory=list)

    def add(self, line):
        self.lines.append(line)

    @property
    def difference(self):
        return sum((l.debit - l.credit for l in self.lines), Decimal("0"))

    @property
    def balanced(self):
        return self.difference == 0

    @classmethod
    def from_rows(cls, journal_id, rows):
        return cls(journal_id, [Line(Decimal(r["debit"]), Decimal(r["credit"])) for r in rows])
`,
      hint: 'Use `@dataclass` and `lines: list = field(default_factory=list)`. For `difference` use `sum(..., Decimal("0"))` so an empty journal gives a Decimal. `from_rows` is a `@classmethod`: build `Line(Decimal(...), Decimal(...))` objects and return `cls(journal_id, those_lines)`.',
    } },
    { pychallenge: {
      id: 'python-oop-dataclasses-ch3',
      prompt: 'Write the normal class `Invoice(invoice_no)` (not a dataclass). Two invoices are **equal when their invoice numbers match after `strip()` and `upper()`**, so `"  inv/1 "` equals `"INV/1"`. Equal invoices must have equal hashes (so a set removes the duplicate). The attribute `invoice_no` keeps the text as it was given. `repr` must show the cleaned number, like `Invoice(\'INV/1\')`. Comparing with something that is not an Invoice must be `False`, not an error.',
      starter: `class Invoice:
    def __init__(self, invoice_no):
        self.invoice_no = invoice_no
    # TODO: __eq__, __hash__ and __repr__ based on the cleaned number
`,
      tests: `a = Invoice("INV/0042/25-26")
b = Invoice("  inv/0042/25-26 ")
c = Invoice("INV/0043/25-26")
assert a == b and a != c
assert hash(a) == hash(b)
assert len({a, b, c}) == 2
assert a != "INV/0042/25-26"
assert (a == 5) is False
assert repr(c) == "Invoice('INV/0043/25-26')", repr(c)
assert repr(b) == "Invoice('INV/0042/25-26')", repr(b)
assert a.invoice_no == "INV/0042/25-26" and b.invoice_no == "  inv/0042/25-26 "
d = {a: "first"}
assert d[b] == "first"`,
      solution: `class Invoice:
    def __init__(self, invoice_no):
        self.invoice_no = invoice_no

    @property
    def key(self):
        return self.invoice_no.strip().upper()

    def __eq__(self, other):
        if not isinstance(other, Invoice):
            return NotImplemented
        return self.key == other.key

    def __hash__(self):
        return hash(self.key)

    def __repr__(self):
        return f"Invoice({self.key!r})"
`,
      hint: 'Make a helper (a property `key`) that returns `self.invoice_no.strip().upper()`. `__eq__` returns `NotImplemented` when `other` is not an Invoice, otherwise compares the keys. `__hash__` must hash the same key. `__repr__` uses `{self.key!r}`.',
    } },
    { real: 'In a finance codebase, dataclasses (or Pydantic models) are the "shape" of your business objects: `Journal`, `Invoice`, `Employee`, `Mandate`. Everything else, such as the validation rules, the loader and the report, works with these objects instead of anonymous dictionaries. A typo becomes an error at the moment you create the object, a new colleague can read the fields in ten lines, and a change (a new column) is made in one place. When you open an orchestration or API repository later, you will see the same patterns: a config class, a model class, a client class with `from_env()`, and an abstract base class for "every connector must implement `read()`".' },
    { interview: `**"What is the difference between a list, a tuple and a set, and when would you use a dataclass instead?"**
Model answer: "A list is an ordered, changeable sequence, a tuple is ordered and fixed, a set is unordered with unique items. Once the items have names and meaning, such as a journal line with account, debit and credit, I use a dataclass, so fields have names, I get a readable repr and equality, and mistakes show up early. I make it \`frozen\` when the data should not change."

**"What does \`@dataclass\` generate?"** "\`__init__\`, \`__repr__\` and \`__eq__\` from the annotated fields. With \`frozen=True\` it also makes the object immutable and hashable, with \`order=True\` it adds comparison methods. Mutable defaults need \`field(default_factory=...)\`."

**"What is the relationship between \`__eq__\` and \`__hash__\`?"** "Objects that compare equal must have the same hash. If I define \`__eq__\` and no \`__hash__\`, Python sets \`__hash__\` to \`None\`, so the object cannot go into a set or be a dict key. I define \`__hash__\` on the same fields, or use a frozen dataclass."

**"Composition or inheritance?"** "I prefer composition: a Journal has lines. I use inheritance for a real 'is a' with shared behaviour, like a base exporter with CSV and JSON children, and keep it shallow. Python's duck typing also lets me accept any object with the right methods, and a Protocol or an ABC documents the contract."` },
    `## Recap
- A **class** is a blueprint, an **object** is one instance with its own field values. \`__init__\` sets up the object, \`self\` is the object a method works on, **dunder methods** are hooks Python calls (\`__repr__\`, \`__eq__\`, \`__len__\`).
- Defining \`__eq__\` removes the default \`__hash__\`: equal objects must hash equally, so add \`__hash__\` on the same fields, or use a frozen dataclass.
- **\`@dataclass\`** writes \`__init__\`, \`__repr__\`, \`__eq__\` for you. Use \`frozen=True\`, \`order=True\`, \`field(default_factory=list)\`, \`__post_init__\`, \`replace()\` and \`asdict()\`. Type hints are not enforced at run time.
- \`@property\` for computed values and validated setters, \`@classmethod\` for alternative constructors (\`from_row\`), \`@staticmethod\` rarely.
- **Prefer composition** (has a) to inheritance (is a). Duck typing accepts any object with the right methods; an ABC forces them; a Protocol describes them for a type checker.
- To read a class-based repo: base classes, then \`__init__\` and fields, then public methods, decorators and \`super()\`.`,
  ],
  quiz: [
    { q: 'In `def net(self): return self.debit - self.credit`, what is `self`?', o: ['the class `JournalLine` itself', 'the object the method is called on, passed in automatically by Python', 'a keyword that makes the method private', 'the module that contains the class'], a: 1, why: '`line.net()` is the same as `JournalLine.net(line)`: Python passes the object as the first argument, and by convention it is called `self`.' },
    { q: 'What happens with `@dataclass class Basket: items: list = []`?', o: ['it works and each basket starts empty', 'it works, but all baskets share one list', 'it works only if the class is frozen', 'it raises a `ValueError`: use `field(default_factory=list)` instead'], a: 3, why: 'A shared mutable default is such a common bug that dataclasses refuse it. `default_factory` creates a fresh list for each object.' },
    { q: 'You define `__eq__` in a normal class and nothing else. What breaks?', o: ['objects can no longer be put in a set or used as dict keys, because `__hash__` is removed', 'objects can no longer be printed', 'comparison with `<` stops working', 'nothing: `__hash__` is generated automatically'], a: 0, why: 'Python sets `__hash__` to None when you define `__eq__` without `__hash__`, so the object is unhashable. Define `__hash__` on the same fields or use a frozen dataclass.' },
    { q: 'When is `@property` the right tool?', o: ['to make a method run faster', 'to make an attribute private so nobody can read it', 'to make a value that is computed from other fields readable like an attribute, such as `journal.balanced`', 'to share one value between all objects of the class'], a: 2, why: 'A property looks like a plain attribute to the caller but runs code. It is ideal for computed values and for validating on assignment.' },
    { q: 'What is the first argument of a `@classmethod` such as `from_row`?', o: ['the object (`self`)', 'the row dictionary', 'nothing: it takes no first argument', 'the class itself (`cls`), so `cls(...)` builds an object and also works for subclasses'], a: 3, why: 'A class method receives the class. That is why it is used as an alternative constructor: `cls(...)` builds the right type even in a subclass.' },
    { q: 'A `Journal` holds many `GLLine` objects. Which design describes this best?', o: ['composition: the Journal has lines, so it keeps a list of them', 'inheritance: `Journal` should extend `GLLine`', 'a static method on `GLLine`', 'a global dictionary of lines'], a: 0, why: 'A journal is not a kind of line; it has lines. "Has a" is composition. Inheritance is for a true "is a" relationship.' },
  ],
  task: {
    title: 'Model the employees as dataclasses and check their bank details',
    steps: [
      'In `C:\\fde\\py-recap` create `oop_practice.py`. It needs `employees.csv` (exported in the *Comprehensions and control flow* task).',
      'Write a frozen dataclass `Employee` with `emp_id` (int), `name`, `manager_id` (int or None), `department`, `annual_ctc` (Decimal), `bank_account`, `ifsc` and `pan`. Add the class method `from_row(row)` that converts the types; an empty `manager_id` or `pan` becomes `None`.',
      'Add the property `monthly_ctc` (annual divided by 12, rounded to 2 places with `quantize`) and the property `ifsc_ok`: exactly 11 characters, the first four are capital letters, the fifth is `0`.',
      'Load all 20 employees and print the ones whose `ifsc_ok` is false. You should get employees 7 and 14. Print the total of `annual_ctc`: it must be 38900000.',
      'Find the employees that share a bank account with someone else (use a dict from account to list of employees). You should find employee 12 and employee 4.',
      'Write a class `Team` that holds a manager and a list of `Employee` objects (composition) with a property `headcount`, and print the team of employee 2.',
    ],
    deliverable: '`oop_practice.py` and its output: the two bad IFSC rows, the total CTC, the shared bank account pair and one team.',
  },
};
