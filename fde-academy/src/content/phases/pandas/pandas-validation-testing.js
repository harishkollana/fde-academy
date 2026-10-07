export default {
  id: 'pandas-validation-testing',
  title: 'Validating and testing DataFrames: rules, schemas and tests',
  goal: 'You can write checks that return the failing rows, run a set of rules and get one report with severities, describe a table with a schema and collect every problem at once, validate rows with pydantic or pandera, and test a pandas transform with fixtures, assert_frame_equal and property checks.',
  roadmap: ['DataFrame checks', 'schema validation', 'pydantic and pandera', 'testing pandas transforms'],
  blocks: [
    `## The problem
A file arrives. It loads without an error. Is it **right**? Every silent failure in the earlier lessons had the same shape: the code ran, the totals looked plausible, and the mistake sat inside them: an orphan order, a shared bank account, three copied GL lines, a salary that moved by 140 percent. Nobody was told.

**Validation** means writing down what must be true about the data, as code, and running it every time. **Testing** means doing the same for your own code: writing down what each transform must do, so that a change that breaks it is caught on your laptop, not by the CFO. This is what separates a script that worked once from a pipeline someone can rely on.

Validation is not the same as cleaning. **Cleaning repairs** (fill, drop, convert). **Validation judges and reports**: it says what is wrong, where and how many, and decides whether the pipeline may continue. The two work together: validate the input, clean what you may, validate the output.`,
    `## Four levels of rules
Think of the rules in four levels, from cheap to expensive:

1. **Structure**: the columns you expect are there (and no surprise columns), with the expected types. A renamed column or a text amount is caught here.
2. **Row rules**: each row on its own: GSTIN, IFSC and PAN shapes, amount above 0, quantity between 1 and 12, status one of three values, date not in the future.
3. **Dataset rules**: the whole table: a key is unique (\`order_id\`, a bank account), no copied lines, row count within the usual range, the **detail adds up to the total**, every journal balances.
4. **Cross-table rules**: tables against each other: every \`customer_id\` in the orders exists in the customers (a **foreign key**), every GL line has an FX rate, books agree with the supplier file.

Run the cheap levels first: there is no point in checking totals when the amount column has turned into text.`,
    { sketch: { w: 760, h: 330, caption: 'Four levels of rules, from cheap to expensive: each level has its own examples, and the Kollana data fails a few of them on purpose', items: [
      { t: 'box', x: 14, y: 14, w: 210, h: 62, fill: 'blue', label: '1. structure', sub: 'columns and types', size: 17 },
      { t: 'box', x: 14, y: 90, w: 210, h: 62, fill: 'green', label: '2. row rules', sub: 'one row at a time', size: 17 },
      { t: 'box', x: 14, y: 166, w: 210, h: 62, fill: 'yellow', label: '3. dataset rules', sub: 'the whole table', size: 17 },
      { t: 'box', x: 14, y: 242, w: 210, h: 62, fill: 'orange', label: '4. cross-table rules', sub: 'tables against tables', size: 17 },
      { t: 'arrow', x1: 226, y1: 45, x2: 262, y2: 45 },
      { t: 'arrow', x1: 226, y1: 121, x2: 262, y2: 121 },
      { t: 'arrow', x1: 226, y1: 197, x2: 262, y2: 197 },
      { t: 'arrow', x1: 226, y1: 273, x2: 262, y2: 273 },
      { t: 'note', x: 266, y: 14, w: 480, h: 62, fill: 'blue', size: 13, text: 'amount is a number, not text   |   no renamed or extra columns\nthe file the CFO sends next month has the same columns as this one' },
      { t: 'note', x: 266, y: 90, w: 480, h: 62, fill: 'green', size: 13, text: 'IFSC shape: 2 employees fail (7 and 14)   |   PAN missing: 2 (9 and 18)\nqty from 1 to 12   |   status in 3 allowed values (9 orders have none)' },
      { t: 'note', x: 266, y: 166, w: 480, h: 62, fill: 'yellow', size: 13, text: 'bank account unique: employees 4 and 12 share one   |   no copied GL lines: 3\nevery journal balances: 4 do not   |   detail adds up to the sheet total' },
      { t: 'note', x: 266, y: 242, w: 480, h: 62, fill: 'orange', size: 13, text: 'every order has a customer: order 77 points to customer 99, who does not exist\nevery GL line has an FX rate: 34 SGD lines of February 2026 have none' },
    ] } },
    `## Checks that return the failing rows
The most useful shape for a check is a function that **returns the failing rows**. An empty frame means "passed"; a non-empty frame is the evidence, which a reviewer can read, count, export, or quarantine. A function that returns only \`True\` or \`False\` makes you re-run the logic to find out *which* rows failed.

\`\`\`python
def bad_ifsc(df):
    return df[~df["ifsc"].str.fullmatch(IFSC, na=False)]
\`\`\`

Write one small function per rule, give it a name that says what it finds, and test each one on a file you know is bad (the Kollana data was built with planted problems for exactly this). A check that has never failed is a check you do not yet trust.`,
    { py: {
      title: 'Six checks that return the failing rows, on the planted problems of the Kollana data',
      starter: `import pandas as pd
pd.set_option("display.width", 120)
IFSC = r"[A-Z]{4}0[A-Z0-9]{6}"

emp = pd.read_csv("employees.csv", dtype={"bank_account": "string", "ifsc": "string", "pan": "string"})
orders = pd.read_csv("orders.csv")
customers = pd.read_csv("customers.csv")
gl = pd.read_csv("fact_gl.csv")

# every check returns the FAILING ROWS: an empty frame means "passed"
def bad_ifsc(df):
    return df[~df["ifsc"].str.fullmatch(IFSC, na=False)]

def missing_pan(df):
    return df[df["pan"].isna()]

def shared_bank_account(df):
    return df[df["bank_account"].duplicated(keep=False)]

def orphans(child, parent, key):
    return child[~child[key].isin(parent[key])]

def unbalanced_journals(df, tolerance=0.005):
    g = df.groupby("journal_id")[["debit", "credit"]].sum()
    g["difference"] = (g["debit"] - g["credit"]).round(2)
    return g[g["difference"].abs() > tolerance].reset_index()

def copied_lines(df):
    business = [c for c in df.columns if c != "gl_id"]
    return df[df.duplicated(business, keep=False)]

print("IFSC with a wrong shape      :", bad_ifsc(emp)["emp_id"].tolist())
print("PAN missing                  :", missing_pan(emp)["emp_id"].tolist())
print("bank account shared by       :", shared_bank_account(emp)["emp_id"].tolist())
print("orders of an unknown customer:", orphans(orders, customers, "customer_id")["order_id"].tolist())
print("unbalanced journals          :", unbalanced_journals(gl)["journal_id"].tolist())
print("GL lines that are copies     :", copied_lines(gl)["gl_id"].tolist(), "(both members of each pair)")

# a check that never fails is not trusted yet: feed it a frame that must fail, and one that must pass
print("clean frame passes:", bad_ifsc(pd.DataFrame({"ifsc": ["HDFC0001234"]})).empty, "| bad frame fails:", not bad_ifsc(pd.DataFrame({"ifsc": ["HDFC123456"]})).empty)`,
      note: 'Three of the four unbalanced journals are caused by the three copied lines (the copies double one side of a journal). The fourth, JV202504-0051, is a different problem: one debit is 500 too high. Two checks, two different causes: that is why each rule gets its own function and its own name.',
    } },
    `## A rule registry and one report
Ten loose functions are hard to run and hard to read. Put the rules in a **registry**: a list where each entry says the rule's **name**, the **table**, the **severity**, the check function, and the column that identifies a failing row. Then one loop runs them all and builds a **findings report**: one line per rule with the number of failing rows and a few examples.

Two decisions belong in the registry, not in your head:
- **Severity.** An *error* means the data must not be used (an unbalanced journal, a duplicated key). A *warning* means somebody should look, but the pipeline may go on (a missing PAN, a salary jump). Without severity, either everything stops, or nobody reads the output.
- **Collect all, then decide.** Do not stop at the first failure. Run every rule, print the whole report, and **then** stop (or not) based on the errors. One run should give the data owner the complete list of what to fix.

Where to run the rules: **at the border**, on the input as soon as it is loaded, and on the output before it is published. Keep the report: write it to the log, to a \`Checks\` sheet of the pack, or to a file next to the output. Be careful with what the report shows: PAN and bank account numbers are personal data, so show the **row id**, not the value.`,
    { sketch: { w: 760, h: 320, caption: 'Validate at the border: collect every finding in one report, then decide. Errors stop the run, warnings travel with the output', items: [
      { t: 'box', x: 14, y: 120, w: 100, h: 60, fill: 'grey', label: 'raw file', size: 17 },
      { t: 'arrow', x1: 116, y1: 150, x2: 150, y2: 150 },
      { t: 'box', x: 154, y: 100, w: 140, h: 100, fill: 'yellow', label: 'validate input', sub: 'all rules, one report', size: 16 },
      { t: 'arrow', x1: 296, y1: 150, x2: 400, y2: 150, label: 'no errors', ly: -12 },
      { t: 'box', x: 404, y: 120, w: 100, h: 60, fill: 'green', label: 'transform', size: 17 },
      { t: 'arrow', x1: 506, y1: 150, x2: 540, y2: 150 },
      { t: 'box', x: 544, y: 100, w: 130, h: 100, fill: 'yellow', label: 'validate output', sub: 'totals, keys', size: 16 },
      { t: 'arrow', x1: 676, y1: 150, x2: 700, y2: 150 },
      { t: 'box', x: 702, y: 120, w: 48, h: 60, fill: 'green', label: 'out', size: 15 },
      { t: 'arrow', x1: 224, y1: 202, x2: 224, y2: 252 },
      { t: 'arrow', x1: 609, y1: 202, x2: 450, y2: 252 },
      { t: 'box', x: 160, y: 254, w: 300, h: 50, fill: 'red', label: 'ERROR: stop, report, keep the file', size: 16 },
      { t: 'box', x: 480, y: 254, w: 266, h: 50, fill: 'orange', label: 'WARNING: continue, report', size: 16 },
      { t: 'text', x: 380, y: 40, text: 'findings report: rule, table, severity, number of rows, example ids', size: 16, bold: true },
      { t: 'text', x: 380, y: 66, text: 'show ids, not PAN or bank account numbers', size: 14 },
    ] } },
    { py: {
      title: 'A rule registry with severities, and the findings report',
      starter: `from dataclasses import dataclass
from typing import Callable

import numpy as np
import pandas as pd
pd.set_option("display.width", 140)
IFSC = r"[A-Z]{4}0[A-Z0-9]{6}"

tables = {
    "employees": pd.read_csv("employees.csv", dtype={"bank_account": "string", "ifsc": "string", "pan": "string"}),
    "orders": pd.read_csv("orders.csv"),
    "customers": pd.read_csv("customers.csv"),
    "payroll": pd.read_csv("payroll.csv"),
    "fact_gl": pd.read_csv("fact_gl.csv"),
    "supplier_invoices": pd.read_csv("supplier_invoices.csv"),
}

@dataclass
class Rule:
    name: str
    table: str
    severity: str                    # "error": the data must not be used. "warning": somebody should look
    check: Callable                  # takes the tables, returns the FAILING rows
    key: str                         # the column that identifies a failing row in the report

def jump_over_50_percent(t):
    pay = t["payroll"].sort_values(["emp_id", "run_month"]).copy()
    pay["change"] = pay.groupby("emp_id")["gross_pay"].pct_change()
    return pay[pay["change"].abs() > 0.5]

def unbalanced(t):
    g = t["fact_gl"].groupby("journal_id")[["debit", "credit"]].sum()
    g["difference"] = (g["debit"] - g["credit"]).round(2)
    return g[g["difference"].abs() > 0.005].reset_index()

def off_standard_gst_rate(t):
    si = t["supplier_invoices"]
    rate = (si["gst_amount"] / si["taxable_value"]).to_numpy()
    distance = np.abs(rate[:, None] - np.array([0.05, 0.12, 0.18])).min(axis=1)
    return si[distance > 0.0001]

RULES = [
    Rule("ifsc has the right shape", "employees", "error", lambda t: t["employees"][~t["employees"]["ifsc"].str.fullmatch(IFSC, na=False)], "emp_id"),
    Rule("bank account is unique", "employees", "error", lambda t: t["employees"][t["employees"]["bank_account"].duplicated(keep=False)], "emp_id"),
    Rule("pan is present", "employees", "warning", lambda t: t["employees"][t["employees"]["pan"].isna()], "emp_id"),
    Rule("order has a known customer", "orders", "error", lambda t: t["orders"][~t["orders"]["customer_id"].isin(t["customers"]["customer_id"])], "order_id"),
    Rule("order has a status", "orders", "warning", lambda t: t["orders"][t["orders"]["status"].isna()], "order_id"),
    Rule("order amount is positive", "orders", "error", lambda t: t["orders"][t["orders"]["amount"] <= 0], "order_id"),
    Rule("pay moves less than 50 percent", "payroll", "warning", jump_over_50_percent, "emp_id"),
    Rule("every journal balances", "fact_gl", "error", unbalanced, "journal_id"),
    Rule("no copied GL lines", "fact_gl", "error", lambda t: t["fact_gl"][t["fact_gl"].duplicated([c for c in t["fact_gl"].columns if c != "gl_id"])], "gl_id"),
    Rule("gst is a standard rate", "supplier_invoices", "warning", off_standard_gst_rate, "si_id"),
]

def run_rules(tables, rules):
    rows = []
    for rule in rules:
        bad = rule.check(tables)
        rows.append({"rule": rule.name, "table": rule.table, "severity": rule.severity,
                     "failing": len(bad), "examples": bad[rule.key].head(3).tolist()})
    return pd.DataFrame(rows)

report = run_rules(tables, RULES)
print(report.to_string(index=False))

errors = report[(report["severity"] == "error") & (report["failing"] > 0)]
print()
print(len(errors), "rule(s) of severity error failed ->", "STOP the pipeline" if len(errors) else "continue")
print("warnings with findings:", int(((report["severity"] == "warning") & (report["failing"] > 0)).sum()))`,
      note: 'The report is the deliverable: one line per rule, the number of failing rows and examples (ids, not personal data). Five error rules fail, so the pipeline would stop, but only **after** the whole report exists. Try changing the severity of "no copied GL lines" to a warning and see how the decision at the bottom changes: severity is policy, so it lives in the registry.',
    } },
    `## Schemas: describing the table
Checking columns, types, nulls, ranges and allowed values one by one is repetitive. A **schema** describes the whole table as data (a dict, a class, a YAML file) and one function **checks the frame against it and returns every problem**. Schemas also document the contract: the data owner and you read the same description.

A good schema function has the same habits as the rule registry: it collects **all** problems (not just the first), reports **how many rows** and which **column**, and treats a *missing column*, a *wrong type* and an *unexpected extra column* (a sign that the export changed) as separate findings. If the type is wrong, skip the range rules for that column: comparing text with a number would only raise an error.

Ready-made tools do the same, and you will meet them at work:
- **pydantic** validates **one row at a time** against a typed model (types, ranges, patterns). It is very expressive and good for API input and small files. It cannot see other rows, so it cannot check uniqueness or totals, and a Python loop over millions of rows is slow.
- **pandera** validates a **whole DataFrame** against a schema with column checks, uniqueness and cross-column rules, and with \`lazy=True\` it collects all failures. It works vectorised, so it suits big tables. It is a separate package that you install on your laptop (the lesson playground does not have it).
- **Great Expectations** and similar platforms add stored expectation suites, data docs and scheduling. Worth knowing the name; the ideas are the ones you are writing by hand here.`,
    { py: {
      title: 'A schema-driven validator that collects every problem, and what a changed file looks like',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

def kind_ok(series, kind):
    if kind == "number":
        return pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)
    if kind == "text":
        return pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series)
    return True

def validate(df, schema):
    """Return ALL the problems as (column, rule, number of rows). Never stop at the first one."""
    problems = []
    for col, spec in schema.items():
        if col not in df.columns:
            problems.append((col, "missing column", 1))
            continue
        s = df[col]
        if "kind" in spec and not kind_ok(s, spec["kind"]):
            problems.append((col, "wrong kind", 1))
            continue                                        # the other rules need the right kind
        if not spec.get("nullable", True) and s.isna().any():
            problems.append((col, "null", int(s.isna().sum())))
        present = s.dropna()
        if spec.get("unique") and present.duplicated(keep=False).any():
            problems.append((col, "duplicate", int(present.duplicated(keep=False).sum())))
        if "min" in spec and (present < spec["min"]).any():
            problems.append((col, "below min", int((present < spec["min"]).sum())))
        if "max" in spec and (present > spec["max"]).any():
            problems.append((col, "above max", int((present > spec["max"]).sum())))
    for col in df.columns:
        if col not in schema:
            problems.append((col, "unexpected column", 1))
    return problems

EMPLOYEES = {
    "emp_id": {"kind": "number", "unique": True, "min": 1},
    "emp_name": {"kind": "text", "nullable": False},
    "manager_id": {"kind": "number"},
    "department": {"kind": "text", "nullable": False},
    "city": {"kind": "text", "nullable": False},
    "hire_date": {"kind": "text", "nullable": False},
    "annual_ctc": {"kind": "number", "min": 1},
    "bank_account": {"kind": "number", "unique": True},
    "ifsc": {"kind": "text", "nullable": False},
    "pan": {"kind": "text", "nullable": False},
}
ORDERS = {
    "order_id": {"kind": "number", "unique": True, "min": 1},
    "order_date": {"kind": "text", "nullable": False},
    "customer_id": {"kind": "number", "min": 1},
    "product_id": {"kind": "number", "min": 1},
    "qty": {"kind": "number", "min": 1, "max": 12},
    "channel": {"kind": "text", "nullable": False},
    "amount": {"kind": "number", "min": 1},
    "status": {"kind": "text", "nullable": False},
}

emp = pd.read_csv("employees.csv")
orders = pd.read_csv("orders.csv")
print("employees:", validate(emp, EMPLOYEES))
print("orders   :", validate(orders, ORDERS))

# next month the export changes: a column is renamed and one quantity arrives as text
orders2 = orders.rename(columns={"amount": "Amount"})
orders2["qty"] = orders2["qty"].astype(object)
orders2.loc[3, "qty"] = "x"
print("changed  :")
for problem in validate(orders2, ORDERS):
    print("   ", problem)`,
      note: 'The employees fail 2 rules (the shared bank account and the 2 missing PANs), the orders fail 1 (9 orders without a status). The changed file shows the structure level: a renamed column appears twice (missing `amount`, unexpected `Amount`) and the text in `qty` is reported once as the wrong kind, instead of crashing the range check. IFSC shapes are not in this schema: patterns and allowed values are the challenge below.',
    } },
    { py: {
      title: 'Row-level validation with pydantic, and what it cannot see',
      starter: `import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, ValidationError
pd.set_option("display.width", 120)

class Employee(BaseModel):
    emp_id: int = Field(ge=1)
    emp_name: str
    annual_ctc: int = Field(gt=0)
    ifsc: str = Field(pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$")
    pan: str | None = Field(default=None, pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]$")     # a missing PAN is allowed here, a wrong one is not

emp = pd.read_csv("employees.csv", dtype=str)                       # read everything as text, as it arrives
rows = emp.astype(object).where(emp.notna(), None).to_dict("records")

problems = []
for i, row in enumerate(rows):
    try:
        Employee(**row)                                             # extra columns such as city are ignored
    except ValidationError as e:
        for err in e.errors():
            field = err["loc"][0]
            problems.append({"row": i, "emp_id": row["emp_id"], "field": field, "problem": err["type"]})

print(pd.DataFrame(problems))
print(len(problems), "problem(s) found in", len(rows), "rows")

# pydantic converted the text to the right types, row by row
ok = Employee(**rows[0])
print(type(ok.emp_id).__name__, ok.emp_id, "|", type(ok.annual_ctc).__name__, ok.annual_ctc)

# what a row-by-row validator cannot see: employees 4 and 12 share a bank account
print("pydantic found the shared bank account:", any(p["emp_id"] in ("4", "12") for p in problems))`,
      note: 'pydantic finds the two invalid IFSC codes (employees 7 and 14) and converts the text to numbers as it goes, but it cannot find the shared bank account, because that needs two rows. Use pydantic for the shape of each row (API payloads, small files, configuration) and pandas or pandera for rules that look across rows.',
    } },
    { local: `**The same validation with pandera** (virtual environment active; \`pip install pandera\` first; in \`C:\\fde\\pandas-lab\`). Save as \`09_pandera.py\`:
\`\`\`python
import pandas as pd
import pandera.pandas as pa

employees = pd.read_csv("employees.csv", dtype={"bank_account": "string", "ifsc": "string", "pan": "string"})

schema = pa.DataFrameSchema(
    {
        "emp_id": pa.Column(int, pa.Check.ge(1), unique=True),
        "emp_name": pa.Column(str, nullable=False),
        "annual_ctc": pa.Column(int, pa.Check.gt(0)),
        "bank_account": pa.Column("string", unique=True),
        "ifsc": pa.Column("string", pa.Check.str_matches(r"^[A-Z]{4}0[A-Z0-9]{6}$")),
        "pan": pa.Column("string", pa.Check.str_matches(r"^[A-Z]{5}[0-9]{4}[A-Z]$"), nullable=False),
    },
    strict=False,                       # extra columns are allowed
)

try:
    schema.validate(employees, lazy=True)           # lazy=True: collect every problem, do not stop at the first
except pa.errors.SchemaErrors as err:
    report = err.failure_cases[["column", "check", "failure_case", "index"]]
    print(report.to_string(index=False))
    print(len(report), "failure cases")
\`\`\`
Expected output (pandera 0.34 on pandas 2.3; the exact wording of the check names can differ between versions):
\`\`\`text
      column                                 check failure_case  index
bank_account                      field_uniqueness  47860558007      3
bank_account                      field_uniqueness  47860558007     11
        ifsc str_matches('^[A-Z]{4}0[A-Z0-9]{6}$')   HDFC123456      6
        ifsc str_matches('^[A-Z]{4}0[A-Z0-9]{6}$')  sbin0001234     13
         pan                          not_nullable         <NA>      8
         pan                          not_nullable         <NA>     17
6 failure cases
\`\`\`
Compare it with your hand-written checks: the same six rows (employees 4 and 12, 7 and 14, 9 and 18, as zero-based index 3 and 11, 6 and 13, 8 and 17), found in one vectorised pass. Note that the report shows the **values** of the failing PAN and bank account: for a real report, keep only the index or the employee id.` },
    `## Testing your transforms
A validated input does not help if your **own code** is wrong. A transform is a function from a DataFrame to a DataFrame, which makes it easy to test: build a tiny frame by hand, run the function, and compare the result with the frame you expect.

Four kinds of test cover most of the risk:

| Kind | It asks | Example |
|---|---|---|
| **example** | does it give *this* output for *this* input? | 1,000 at 18 percent gives 180 of GST |
| **property** | what must be true for *any* input? | the row count does not change, \`gross = amount + gst\`, the input frame is not modified |
| **edge case** | does it survive the odd input? | an empty frame, a NaN, one row, a duplicate key |
| **regression** | does an old bug stay fixed? | the February 2026 SGD lines still find a rate |

Tools: \`pd.testing.assert_frame_equal(actual, expected)\` compares values, dtypes, index and columns, and prints **which** column and which value differ. Useful options: \`check_dtype=False\` (ignore int versus float), \`check_like=True\` (ignore the order of rows and columns), \`rtol\`/\`atol\` (float tolerance). \`pytest\` runs functions named \`test_...\`, gives them **fixtures** (shared small frames), and \`parametrize\` repeats a test for several inputs.

Two rules of thumb. **Test the test:** break the code on purpose (change a rounding, drop a filter) and confirm that a test fails; a test that cannot fail proves nothing. And **keep the frames tiny**: five rows you can check by hand beat 5,000 rows you cannot.`,
    { sketch: { w: 760, h: 306, caption: 'Four kinds of test for a transform: each answers a different question, and a good set has all four', items: [
      { t: 'table', x: 30, y: 24, cols: ['kind', 'it asks', 'example'], colW: [110, 250, 330], rows: [['example', 'THIS output for THIS input?', 'gst of 1000 at 18% is 180'], ['property', 'true for ANY input?', 'rows unchanged, gross = amount + gst'], ['edge case', 'survives the odd input?', 'empty frame, NaN, one row'], ['regression', 'old bug stays fixed?', 'Feb 2026 SGD lines find a rate']], rowH: 40, fill: 'blue' },
      { t: 'note', x: 30, y: 246, w: 690, h: 40, fill: 'yellow', size: 14, text: 'Test the test: break the code on purpose. If no test turns red, the tests are not testing.' },
    ] } },
    { py: {
      title: 'A mini test runner: tests for a transform, then break the code on purpose',
      starter: `import pandas as pd

def add_gst(df, rate):
    out = df.copy()
    out["gst"] = (out["amount"] * rate / 100).round(2)
    out["gross"] = (out["amount"] + out["gst"]).round(2)
    return out

def make_orders():
    return pd.DataFrame({"order_id": [1, 2, 3], "amount": [1000, 42275, 333]})

# tests are plain functions that raise when something is wrong (pytest on your laptop runs the same functions)
def test_values():
    out = add_gst(make_orders(), 18)
    expected = make_orders().assign(gst=[180.0, 7609.5, 59.94], gross=[1180.0, 49884.5, 392.94])
    pd.testing.assert_frame_equal(out, expected)

def test_input_is_not_changed():
    orders = make_orders()
    before = orders.copy()
    add_gst(orders, 18)
    pd.testing.assert_frame_equal(orders, before)

def test_properties_hold_for_any_rate():
    for rate in (0, 5, 12, 18, 28):
        out = add_gst(make_orders(), rate)
        assert len(out) == 3
        assert (out["gross"] - out["amount"] - out["gst"]).abs().max() < 0.005
        assert out["gst"].ge(0).all()

def test_empty_frame_keeps_its_columns():
    out = add_gst(pd.DataFrame({"amount": pd.Series([], dtype="float64")}), 18)
    assert out.empty and list(out.columns) == ["amount", "gst", "gross"]

TESTS = [test_values, test_input_is_not_changed, test_properties_hold_for_any_rate, test_empty_frame_keeps_its_columns]

def run_tests(tests):
    passed = 0
    for fn in tests:
        try:
            fn()
            status, why = "PASS", ""
            passed += 1
        except AssertionError as e:
            status, why = "FAIL", (str(e).splitlines() or ["assertion failed"])[0]
        except Exception as e:
            status, why = "ERROR", f"{type(e).__name__}: {e}"
        print(f"{status:<6}{fn.__name__}  {why}")
    print(passed, "of", len(tests), "passed")

run_tests(TESTS)

# test the test: a buggy version rounds the GST to one decimal. A good test set must notice.
print("--- with a bug in add_gst ---")
def add_gst(df, rate):
    out = df.copy()
    out["gst"] = (out["amount"] * rate / 100).round(1)
    out["gross"] = (out["amount"] + out["gst"]).round(2)
    return out
run_tests(TESTS)`,
      note: 'The bug rounds 59.94 to 59.9. Only the example test notices: the property tests still pass, because `gross` is computed from the rounded `gst`, so the identity holds. This is why a good set has all four kinds, and why you break the code on purpose to see which test turns red.',
    } },
    { local: `**Run the same tests with pytest** (virtual environment active; \`pip install pytest\`; in a new folder \`C:\\fde\\pandas-lab\\gst_tests\`). Two files. \`transforms.py\`:
\`\`\`python
import pandas as pd


def add_gst(df, rate):
    """Return a new frame with gst and gross columns. rate is a percentage such as 18."""
    out = df.copy()
    out["gst"] = (out["amount"] * rate / 100).round(2)
    out["gross"] = (out["amount"] + out["gst"]).round(2)
    return out


def monthly_total(df):
    """Total amount per month, as a frame with the columns month and amount."""
    month = df["date"].dt.strftime("%Y-%m")
    return df.groupby(month)["amount"].sum().rename_axis("month").reset_index()
\`\`\`
and \`tests/test_transforms.py\`:
\`\`\`python
import pandas as pd
import pytest

from transforms import add_gst, monthly_total


@pytest.fixture
def orders():
    return pd.DataFrame({"order_id": [1, 2, 3], "amount": [1000, 42275, 333]})


def test_add_gst_values(orders):
    out = add_gst(orders, 18)
    expected = orders.assign(gst=[180.0, 7609.5, 59.94], gross=[1180.0, 49884.5, 392.94])
    pd.testing.assert_frame_equal(out, expected)


def test_add_gst_does_not_change_its_input(orders):
    before = orders.copy()
    add_gst(orders, 18)
    pd.testing.assert_frame_equal(orders, before)


def test_add_gst_properties(orders):                 # properties hold for any rate
    out = add_gst(orders, 5)
    assert len(out) == len(orders)
    assert (out["gross"] - out["amount"] - out["gst"]).abs().max() < 0.005


@pytest.mark.parametrize("rate, expected_gst", [(0, 0.0), (5, 50.0), (18, 180.0)])
def test_rates(rate, expected_gst):
    out = add_gst(pd.DataFrame({"amount": [1000]}), rate)
    assert out["gst"].iloc[0] == pytest.approx(expected_gst)


def test_empty_frame_keeps_the_columns():
    out = add_gst(pd.DataFrame({"amount": pd.Series([], dtype="float64")}), 18)
    assert out.empty and list(out.columns) == ["amount", "gst", "gross"]


def test_monthly_total():
    df = pd.DataFrame({"date": pd.to_datetime(["2025-04-01", "2025-04-30", "2025-05-02"]), "amount": [10, 20, 5]})
    expected = pd.DataFrame({"month": ["2025-04", "2025-05"], "amount": [30, 5]})
    pd.testing.assert_frame_equal(monthly_total(df), expected)
\`\`\`
Run \`python -m pytest -q\`. Expected output (the time will differ):
\`\`\`text
........                                                                 [100%]
8 passed in 0.67s
\`\`\`
Now **break it on purpose**: in \`transforms.py\` change \`round(2)\` to \`round(1)\` in the \`gst\` line and run again. Expected: one failure, and pandas tells you exactly which column and value:
\`\`\`text
E   AssertionError: DataFrame.iloc[:, 2] (column name="gst") are different
E   DataFrame.iloc[:, 2] (column name="gst") values are different (33.33333 %)
E   [index]: [0, 1, 2]
E   [left]:  [180.0, 7609.5, 59.9]
E   [right]: [180.0, 7609.5, 59.94]
E   At positional index 2, first diff: 59.9 != 59.94
FAILED tests/test_transforms.py::test_add_gst_values - AssertionError: DataFr...
1 failed, 7 passed in 0.95s
\`\`\`
Put the \`round(2)\` back and the eight tests pass again. This red-then-green loop is the whole discipline: a test you have seen fail is a test you can trust.` },
    { pychallenge: {
      id: 'pandas-validation-testing-ch1',
      prompt: 'Write `find_orphans(child, parent, child_key, parent_key)`. Return the rows of `child` whose value in `child_key` does **not** exist in the column `parent_key` of `parent` (a foreign-key check). A missing key (NaN) counts as not found. Keep the original index and the original order of the rows. An empty result means the check passed.',
      starter: `import pandas as pd

def find_orphans(child, parent, child_key, parent_key):
    # TODO: the rows of child whose key is not in parent[parent_key]
    return child.iloc[0:0]
`,
      tests: `import numpy as np
import pandas as pd
orders = pd.DataFrame({"order_id": [1, 2, 3, 4, 5], "cust": [8, 99, 6, np.nan, 8], "amount": [10, 20, 30, 40, 50]}, index=[10, 11, 12, 13, 14])
customers = pd.DataFrame({"customer_id": [6, 8, 11]})
r = find_orphans(orders, customers, "cust", "customer_id")
assert r["order_id"].tolist() == [2, 4], r
assert r.index.tolist() == [11, 13], r.index.tolist()
assert list(r.columns) == ["order_id", "cust", "amount"]
ok = find_orphans(orders.iloc[[0, 2, 4]], customers, "cust", "customer_id")
assert ok.empty and list(ok.columns) == ["order_id", "cust", "amount"]
assert len(find_orphans(orders, customers.iloc[0:0], "cust", "customer_id")) == 5
assert len(orders) == 5`,
      solution: `import pandas as pd

def find_orphans(child, parent, child_key, parent_key):
    return child[~child[child_key].isin(parent[parent_key])]
`,
      hint: '`child[child_key].isin(parent[parent_key])` is True for the rows that have a parent. Negate it with `~` and use it as a mask on `child`. A NaN is never "in" the parent keys, so it is returned as an orphan.',
    } },
    { pychallenge: {
      id: 'pandas-validation-testing-ch2',
      prompt: 'Write `validate_frame(df, schema)`. `schema` maps column names to a dict that may contain: `"kind"` (`"number"` or `"text"`), `"nullable"` (default True), `"unique"`, `"min"`, `"max"`, `"allowed"` (a set of values) and `"pattern"` (a regex that the **whole** text must match). Return a **sorted** list of tuples `(column, rule, number of rows)` with these rule names: `"missing column"` (count 1, and no other rule for that column), `"wrong kind"` (count 1, and no further rules for that column), `"null"`, `"duplicate"` (count every row that shares its value), `"below min"`, `"above max"`, `"not allowed"`, `"pattern"`. Missing values are ignored by every rule except `"null"`. Do not report extra columns. A clean frame returns `[]`.',
      starter: `import pandas as pd

def validate_frame(df, schema):
    # TODO: for each column of the schema: missing? wrong kind? then null, duplicate, min, max, allowed, pattern
    return []
`,
      tests: `import pandas as pd
df = pd.DataFrame({
    "id": [1, 2, 2, 4],
    "name": ["a", None, "c", "d"],
    "amount": [10.0, -5.0, 300.0, None],
    "status": ["Open", "Paid", "Lost", "Open"],
    "ifsc": ["HDFC0001234", "HDFC123456", "sbin0001234", "ICIC0089970"],
    "extra": [1, 2, 3, 4],
})
schema = {
    "id": {"kind": "number", "unique": True, "min": 1},
    "name": {"kind": "text", "nullable": False},
    "amount": {"kind": "number", "min": 0, "max": 250},
    "status": {"kind": "text", "allowed": {"Open", "Paid"}},
    "ifsc": {"kind": "text", "pattern": r"[A-Z]{4}0[A-Z0-9]{6}"},
    "gstin": {"kind": "text"},
}
r = validate_frame(df, schema)
expected = [
    ("amount", "above max", 1), ("amount", "below min", 1), ("gstin", "missing column", 1),
    ("id", "duplicate", 2), ("ifsc", "pattern", 2), ("name", "null", 1), ("status", "not allowed", 1),
]
assert r == expected, r
assert validate_frame(pd.DataFrame({"a": ["x", "y"]}), {"a": {"kind": "number", "min": 0}}) == [("a", "wrong kind", 1)]
clean = pd.DataFrame({"id": [1, 2], "status": ["Open", "Paid"]})
assert validate_frame(clean, {"id": {"kind": "number", "unique": True, "min": 1}, "status": {"allowed": {"Open", "Paid"}}}) == []
assert validate_frame(pd.DataFrame({"a": [None, None]}), {"a": {"nullable": False}}) == [("a", "null", 2)]
assert list(df.columns) == ["id", "name", "amount", "status", "ifsc", "extra"]`,
      solution: `import pandas as pd

def kind_ok(series, kind):
    if kind == "number":
        return pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)
    if kind == "text":
        return pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series)
    return True

def validate_frame(df, schema):
    problems = []
    for col, spec in schema.items():
        if col not in df.columns:
            problems.append((col, "missing column", 1))
            continue
        s = df[col]
        if "kind" in spec and not kind_ok(s, spec["kind"]):
            problems.append((col, "wrong kind", 1))
            continue
        if not spec.get("nullable", True) and s.isna().any():
            problems.append((col, "null", int(s.isna().sum())))
        present = s.dropna()
        if spec.get("unique") and present.duplicated(keep=False).any():
            problems.append((col, "duplicate", int(present.duplicated(keep=False).sum())))
        if "min" in spec and (present < spec["min"]).any():
            problems.append((col, "below min", int((present < spec["min"]).sum())))
        if "max" in spec and (present > spec["max"]).any():
            problems.append((col, "above max", int((present > spec["max"]).sum())))
        if "allowed" in spec and (~present.isin(spec["allowed"])).any():
            problems.append((col, "not allowed", int((~present.isin(spec["allowed"])).sum())))
        if "pattern" in spec:
            bad = ~present.astype("string").str.fullmatch(spec["pattern"])
            if bad.any():
                problems.append((col, "pattern", int(bad.sum())))
    return sorted(problems)
`,
      hint: 'Follow the structure of the `validate` function in the lesson. Work on `present = s.dropna()` for every rule except `"null"`. For `allowed`: `(~present.isin(spec["allowed"])).sum()`. For `pattern`: `~present.astype("string").str.fullmatch(spec["pattern"])`. Collect tuples in a list and `return sorted(problems)`.',
    } },
    { pychallenge: {
      id: 'pandas-validation-testing-ch3',
      prompt: 'Write `reconcile_totals(detail, summary, key, value, tolerance=0.01)`. `detail` has many rows per `key`; `summary` has one row per `key`; both have a number column called `value`. Return a **sorted list of the keys** where the total of `value` in `detail` differs from the `value` in `summary` by **more than** `tolerance`. A key that exists on one side only counts as 0 on the other side. An empty list means the two agree.',
      starter: `import pandas as pd

def reconcile_totals(detail, summary, key, value, tolerance=0.01):
    # TODO: detail.groupby(key)[value].sum() against summary.set_index(key)[value]; keys missing on one side count as 0
    return []
`,
      tests: `import pandas as pd
detail = pd.DataFrame({"acct": ["A", "A", "B", "C"], "amt": [10.0, 20.0, 5.005, 7.0]})
summary = pd.DataFrame({"acct": ["A", "B", "D"], "amt": [30.0, 5.0, 4.0]})
r = reconcile_totals(detail, summary, "acct", "amt")
assert r == ["C", "D"], r
assert reconcile_totals(detail, summary, "acct", "amt", tolerance=0.001) == ["B", "C", "D"]
same = pd.DataFrame({"acct": ["A", "B"], "amt": [30.0, 5.005]})
assert reconcile_totals(detail[detail["acct"].isin(["A", "B"])], same, "acct", "amt") == []
assert reconcile_totals(detail.iloc[0:0], summary.iloc[0:0], "acct", "amt") == []
assert reconcile_totals(detail, summary.iloc[0:0], "acct", "amt") == ["A", "B", "C"]
assert list(detail.columns) == ["acct", "amt"]`,
      solution: `import pandas as pd

def reconcile_totals(detail, summary, key, value, tolerance=0.01):
    d = detail.groupby(key)[value].sum()
    s = summary.set_index(key)[value]
    difference = d.sub(s, fill_value=0).abs()
    return sorted(difference[difference > tolerance].index.tolist())
`,
      hint: '`d = detail.groupby(key)[value].sum()` and `s = summary.set_index(key)[value]`. `d.sub(s, fill_value=0)` subtracts and treats a key missing on one side as 0. Take `.abs()`, keep the values above `tolerance`, and return the sorted index as a list.',
    } },
    { pychallenge: {
      id: 'pandas-validation-testing-ch4',
      prompt: 'Write `assert_idempotent(fn, df)`. A transform is **idempotent** when applying it twice gives the same result as applying it once. Call `fn` on `df`, then call `fn` on that result, and compare the two results with `pd.testing.assert_frame_equal`. If they differ the function must raise an `AssertionError`; otherwise return `True`.',
      starter: `import pandas as pd

def assert_idempotent(fn, df):
    # TODO: once = fn(df); twice = fn(once); assert_frame_equal(once, twice); return True
    return True
`,
      tests: `import pandas as pd
df = pd.DataFrame({"id": [1, 1, 2], "x": [10, 10, 20]})
assert assert_idempotent(lambda d: d.drop_duplicates().reset_index(drop=True), df) is True
assert assert_idempotent(lambda d: d.assign(x=d["x"].clip(upper=15)), df) is True
raised = False
try:
    assert_idempotent(lambda d: d.assign(x=d["x"] + 1), df)
except AssertionError:
    raised = True
assert raised, "expected an AssertionError for a function that is not idempotent"
raised = False
try:
    assert_idempotent(lambda d: d.assign(x=d["x"] * 2), df)
except AssertionError:
    raised = True
assert raised, "expected an AssertionError for doubling"
assert df["x"].tolist() == [10, 10, 20]`,
      solution: `import pandas as pd

def assert_idempotent(fn, df):
    once = fn(df)
    twice = fn(once)
    pd.testing.assert_frame_equal(once, twice)
    return True
`,
      hint: '`once = fn(df)` and `twice = fn(once)`. `pd.testing.assert_frame_equal(once, twice)` raises `AssertionError` by itself when they differ, so you only need to call it and then `return True`.',
    } },
    { warn: `Validation and testing traps:
- **A check that never fails proves nothing.** Run every rule once on a bad sample (the Kollana data has planted problems for this) before you trust it.
- **\`assert\` is not for production data checks.** Python removes asserts when run with \`-O\`, and the message is poor. Raise a \`ValueError\` with the rule, the count and a few ids.
- **Stopping at the first problem.** The data owner then fixes one thing per run. Collect all findings, then decide.
- **Every rule an error, or every rule a warning.** Both end the same way: nobody reads the report. Decide the severity once, in the registry.
- **Float totals compared with \`==\`.** Compare with a tolerance (\`abs(a - b) <= 0.005\`) or round first.
- **Personal data in the report.** Print row ids, not PAN, bank account or Aadhaar-like numbers. Reports travel by email.
- **Row-by-row validation on big tables.** A Python loop over millions of rows is slow. Do the vectorised checks first and loop only over the few rows that need explaining.
- **Tests with big, unreadable frames.** Five rows you can check by hand are worth more than five thousand you cannot.` },
    { real: `Make validation the first and the last step of every pipeline you build. At the **border**: read the file as text, validate structure and rows, quarantine what fails with a reason, and send the findings to the data owner (a branch accountant, an ERP team) in a form they can act on: the id, the rule, what is expected. At the **exit**: validate that the totals tie to the source and that nothing was lost (row counts, sums per entity). And keep the transforms between the two small and tested, so that when someone asks "why did this number change?", you can answer from the findings report and the test history instead of from memory.` },
    { interview: `**"How do you validate a DataFrame before you load it?"**
Model answer: "In levels. Structure first: expected columns, types, no surprise columns. Then row rules (formats, ranges, allowed values), dataset rules (unique keys, no copies, totals tie to the control total) and cross-table rules (foreign keys). I write each rule as a function that returns the failing rows, register them with a severity, run all of them, produce one report, and stop only on errors. For schemas I use pandera for whole-frame checks and pydantic for row-by-row input such as API payloads."

**"How do you test a pandas transformation?"**
"With small hand-made frames and \`pd.testing.assert_frame_equal\`: an example test with known input and output, property tests (row count unchanged, totals preserved, input not modified, idempotent), edge cases (empty frame, NaN, duplicates) and a regression test for every bug I fix. I run them with pytest, using fixtures and parametrize. I also break the code on purpose to confirm a test fails."

**"What is the difference between data validation and data cleaning?"**
"Cleaning changes data to make it usable: fill, convert, drop. Validation checks the data against rules and reports without changing it, so I know what is wrong, how much, and whether the pipeline may continue. I validate before cleaning to learn what needs cleaning, and after to prove the result is right."` },
    `## Recap
- **Validation** writes down what must be true as code; **testing** does it for your own transforms. Validation judges and reports, cleaning repairs.
- Four levels, cheap to expensive: **structure**, **row rules**, **dataset rules** (unique keys, copies, totals), **cross-table rules** (foreign keys, reconciliation).
- A check **returns the failing rows**. Put checks in a **registry** with a **severity** (error stops, warning travels), run **all** of them, produce one **report**, then decide. Show ids, not personal data.
- A **schema** describes the table as data and one function collects every problem (missing column, wrong kind, null, duplicate, range, allowed values, pattern). **pydantic** checks one row at a time, **pandera** a whole frame (\`lazy=True\` collects all), and neither replaces dataset rules you write yourself.
- Test transforms with **example**, **property**, **edge-case** and **regression** tests, using \`pd.testing.assert_frame_equal\` and pytest fixtures. **Break the code on purpose** to see a test fail.`,
  ],
  quiz: [
    { q: 'What should a validation step do in production when several rules fail?', o: ['stop at the first failure and show only that one', 'run every rule, produce one report with all the findings, then decide from the severities', 'ignore failures and fix the data silently', 'delete the failing rows and continue'], a: 1, why: 'Collect all findings so the data owner gets the full list in one run, then stop only for errors. Silent fixes and silent deletes hide the problem.' },
    { q: 'Which of these is a cross-table rule?', o: ['`amount` is greater than 0', '`order_id` is unique', 'the file has the columns you expect', 'every `customer_id` in the orders exists in the customers table'], a: 3, why: 'A foreign key compares two tables. The others are a row rule, a dataset rule and a structure rule.' },
    { q: 'Why raise a `ValueError` for a data problem instead of using `assert` in production code?', o: ['`assert` is slower than `ValueError`', 'pandas does not allow `assert`', '`assert` is removed when Python runs with `-O`, and its message is poor', '`ValueError` can be caught but `assert` cannot'], a: 2, why: 'Asserts are for tests and for your own assumptions. A data check must always run and must explain what failed, how many rows and a few ids.' },
    { q: 'What does `pd.testing.assert_frame_equal(a, b, check_like=True)` ignore?', o: ['the order of the rows and of the columns', 'all float differences, however large', 'the column names', 'the number of rows'], a: 0, why: '`check_like=True` ignores the order of the index and the columns. Differences in values, names or the number of rows still fail.' },
    { q: 'You test a transform that adds a `gst` column. Which is a good property test?', o: ['`gst` of the first row equals 180', 'the output frame has exactly 3 rows for the one input you wrote', 'the number of rows does not change, `gross = amount + gst`, and the input frame is not modified, for several rates', 'the test passes today'], a: 2, why: 'A property is something that must hold for any input or rate. A value check is an example test, and a test that merely passes today says nothing about the code.' },
    { q: 'How do you check that your test is a good one?', o: ['run it twice', 'break the code on purpose and confirm that the test fails', 'make the test shorter', 'delete the fixture'], a: 1, why: 'A test that cannot fail proves nothing. Change a rounding or a filter, watch the test turn red, then restore the code.' },
  ],
  task: {
    title: 'A validation report and a tested transform for the Kollana data',
    steps: [
      'In `C:\\fde\\pandas-lab` create `09_validation.py`. Load `employees.csv` (as text), `orders.csv`, `customers.csv`, `payroll.csv`, `fact_gl.csv`, `fx_rates.csv` and `supplier_invoices.csv`.',
      'Write the rules of the lesson as functions that return the failing rows, and add two of your own: **every GL line has an FX rate** (34 lines of SGD in February 2026 do not) and **no GL line has both a debit and a credit** (1 line does). Register all of them with a severity and print the findings report.',
      'Add a rule that compares the **detail with a control total**: the sum of `fact_gl.debit` per entity must equal the sum of `credit` per entity within 0.01. Say in a comment which entities fail and why (use `reconcile_totals`-style logic).',
      'Write the same schema for `employees` with pandera (see the `local` callout), run it with `lazy=True`, and check that it finds the same six failing rows as your hand-written rules.',
      'In a new folder `gst_tests`, create `transforms.py` and `tests/test_transforms.py` from the second `local` callout, run `python -m pytest -q` (8 passed), then break `round(2)` on purpose, see the failure, and restore it.',
      'Add two tests of your own: an idempotence test for a `drop_copies(gl)` transform (the 3 copied GL lines), and a regression test that a row with `status` missing stays in the output of `fill_status`.',
    ],
    deliverable: '`09_validation.py` with its printed findings report, the pandera output, and the `gst_tests` folder with `pytest` output before and after the deliberate bug.',
  },
};
