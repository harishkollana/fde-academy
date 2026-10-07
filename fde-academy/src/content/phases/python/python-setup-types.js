export default {
  id: 'python-setup-types',
  title: 'Setup, basic types and f-strings',
  goal: 'You can install Python 3.12 and VS Code on Windows, run a script and the REPL, and use int, float, str, bool, None, f-strings and string methods to clean and format finance values.',
  roadmap: ['types int float str bool None', 'f-strings, string methods'],
  blocks: [
    `## Why start from zero?
You already write Python automations. So why go back to \`int\` and \`str\`?

Two reasons. First, interviews for automation and FDE roles test the basics hard: "why is \`0.1 + 0.2\` not \`0.3\`?", "what does \`strip()\` return?". Second, most production bugs in finance scripts come from the basics: an amount read as text, a trailing space in a vendor code, a \`None\` that slipped into a total.

This lesson rebuilds the base properly. First the setup on your Windows laptop, then the five basic types, then formatting numbers the way a CFO expects to read them.

## How Python runs your code
A Python *script* is a plain text file ending in \`.py\`. The *interpreter* (\`python.exe\`) reads the file from top to bottom and runs one statement at a time. If line 40 has an error, lines 1 to 39 have already run.

There are two ways to talk to the interpreter:
- **Script mode**: \`py report.py\` runs the whole file.
- **Interactive mode (REPL)**: type \`py\` alone. You get a \`>>>\` prompt. REPL means Read, Evaluate, Print, Loop: it reads one line, runs it, prints the result, and waits for the next line.

The Python playgrounds in this app behave like a small script, with one REPL touch: the value of the **last line** is printed for you.`,
    { sketch: { w: 760, h: 340, caption: 'Script mode runs a whole file; the REPL runs one line at a time', items: [
      { t: 'text', x: 200, y: 24, text: 'Script mode:  py report.py', bold: true },
      { t: 'doc', x: 40, y: 50, w: 110, h: 110, label: 'report.py' },
      { t: 'arrow', x1: 160, y1: 105, x2: 235, y2: 105, label: 'reads top→down' },
      { t: 'box', x: 245, y: 65, w: 200, h: 80, label: 'python.exe', sub: 'the interpreter (3.12)', fill: 'blue' },
      { t: 'arrow', x1: 455, y1: 105, x2: 530, y2: 105 },
      { t: 'box', x: 540, y: 65, w: 190, h: 80, label: 'output', sub: 'terminal, files, Excel', fill: 'green' },
      { t: 'text', x: 220, y: 205, text: 'Interactive mode (REPL):  py', bold: true },
      { t: 'box', x: 40, y: 230, w: 130, h: 52, label: 'Read', sub: '>>> 2 + 3', fill: 'yellow' },
      { t: 'arrow', x1: 175, y1: 256, x2: 225, y2: 256 },
      { t: 'box', x: 230, y: 230, w: 130, h: 52, label: 'Evaluate', sub: 'runs it', fill: 'yellow' },
      { t: 'arrow', x1: 365, y1: 256, x2: 415, y2: 256 },
      { t: 'box', x: 420, y: 230, w: 130, h: 52, label: 'Print', sub: '5', fill: 'yellow' },
      { t: 'arrow', x1: 555, y1: 256, x2: 605, y2: 256 },
      { t: 'box', x: 610, y: 230, w: 120, h: 52, label: 'Loop', sub: 'wait for next', fill: 'yellow' },
      { t: 'arrow', x1: 670, y1: 286, x2: 105, y2: 286, bend: -36, dashed: true },
    ] } },
    `## Step 1: install Python 3.12 and VS Code
Do this once. Take it slowly: a clean install saves hours of "module not found" pain later.`,
    { local: `**Install Python 3.12**
1. Open **python.org/downloads/windows** and download the newest **Python 3.12.x "Windows installer (64-bit)"** (3.12.10 is the last 3.12 release that has a Windows installer; that is fine).
2. Run it. On the first screen tick **"Add python.exe to PATH"** at the bottom, and keep **"Use admin privileges when installing py.exe"** ticked. *PATH* is the list of folders Windows searches when you type a command.
3. Click **Install Now**. At the end, click **"Disable path length limit"** if it is offered.
4. Open a **new** PowerShell window and run:
\`\`\`powershell
py --version
py -0
python --version
\`\`\`
Expected output (your patch number may differ):
\`\`\`text
Python 3.12.10
 -V:3.12 *        Python 3.12 (64-bit)
Python 3.12.10
\`\`\`
\`py\` is the **Python launcher for Windows**. It finds every Python on your laptop: \`py -0\` lists them (the \`*\` marks the default) and \`py -3.12 script.py\` runs a script with a chosen version.

**If \`python\` opens the Microsoft Store:** Windows has fake "app execution aliases". Go to Settings → Apps → Advanced app settings → App execution aliases and switch off \`python.exe\` and \`python3.exe\`. Open a new terminal. Using \`py\` avoids this problem completely.` },
    { local: `**Install VS Code and run your first script**
1. Install VS Code from **code.visualstudio.com** (User Installer). Tick "Add to PATH" and the two "Open with Code" options.
2. In VS Code open Extensions (Ctrl+Shift+X), search **Python**, install the one published by **Microsoft**. It also installs **Pylance** (autocomplete and type checks) and **Python Debugger**.
3. Create the folder \`C:\\fde\\py-recap\` and open it with File → Open Folder.
4. Create \`hello.py\`:
\`\`\`python
name = "Asha"
print(f"Hello {name}, Python is working")
\`\`\`
5. Press Ctrl+Shift+P → **Python: Select Interpreter** → choose Python 3.12.
6. Run it: click ▶ at the top right, or open the terminal (Ctrl+\`) and type \`py hello.py\`. Expected: \`Hello Asha, Python is working\`.
7. Try the REPL: type \`py\` in the terminal, then \`2 + 3\` (it prints \`5\`), then \`exit()\`. In VS Code you can also select lines and press **Shift+Enter** to send them to a REPL.` },
    `## The five basic types
Every value in Python has a *type*. The type decides what you can do with the value.

| Type | What it holds | Finance example |
|---|---|---|
| \`int\` | whole numbers, any size | \`qty = 3\`, \`headcount = 20\` |
| \`float\` | decimal numbers (approximate) | \`rate_to_inr = 83.21\` |
| \`str\` | text, inside quotes | \`gstin = "29AAHCN9902L1ZX"\` |
| \`bool\` | \`True\` or \`False\` | \`is_balanced = True\` |
| \`NoneType\` | only the value \`None\` ("no value") | \`pan = None\` (PAN missing) |

Python is *dynamically typed*: you never declare a type, the value carries it. \`type(x)\` tells you the type. You convert with \`int()\`, \`float()\`, \`str()\` and \`bool()\`.

The big trap in finance files: **everything you read from a CSV or a text file is a \`str\`** until you convert it. \`"1000" + "500"\` gives \`"1000500"\`, not \`1500\`.`,
    { py: {
      title: 'Types and conversions',
      starter: `qty = 3
rate = 83.21
gstin = "29AAHCN9902L1ZX"
is_balanced = True
pan = None
print(type(qty), type(rate), type(gstin), type(is_balanced), type(pan))

# Text from a CSV is always str. Remove the commas, then convert.
amount_text = "1,23,456.50"
amount = float(amount_text.replace(",", ""))
print(amount, type(amount))

print("1000" + "500")            # joins text, no maths!
print(int("1000") + int("500"))  # 1500

print(int(99.99))     # int() cuts the decimals, it does not round
print(round(99.99))   # 100

print(0.1 + 0.2)                  # float maths is approximate
print(0.1 + 0.2 == 0.3)
print(round(0.1 + 0.2, 2) == 0.3)
str(42) + " invoices"`,
      note: 'Run it, then change `amount_text` to `"1,23,456.50 "` (with a space). Does `float()` still work? (Yes: `float()` ignores spaces at the ends, but not in the middle.)',
    } },
    { warn: `Floats are stored in binary, so most decimals are approximate: \`0.1 + 0.2\` is \`0.30000000000000004\`. Two rules for money:
1. **Round at the end**, with \`round(x, 2)\`, before you display or compare.
2. When every paisa must match (GL postings, tax), use \`decimal.Decimal\` and create it from a **string**: \`Decimal("0.10")\`, never \`Decimal(0.1)\`.

Also, \`round(2.5)\` is \`2\` and \`round(3.5)\` is \`4\`. Python uses *banker's rounding* (round half to even). For "half up" invoice rounding use \`Decimal.quantize(..., rounding=ROUND_HALF_UP)\`.` },
    { py: {
      title: 'Decimal for exact money',
      starter: `from decimal import Decimal, ROUND_HALF_UP

print(Decimal("0.1") + Decimal("0.2"))   # exactly 0.3
print(Decimal(0.1))                       # built from a float: carries the float error

taxable = Decimal("41460")
gst = taxable * Decimal("0.18")
print(gst)

print(round(2.675, 2))   # float: 2.67, because 2.675 is really 2.67499999...
print(Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 2.68
print(round(2.5), round(3.5))   # banker's rounding: 2 4`,
    } },
    `## None and bool
\`None\` means "there is no value here". It is Python's version of SQL \`NULL\`. A missing PAN, an optional approver, a function that returns nothing: all \`None\`.
- Check it with \`x is None\`, not \`x == None\`.
- \`None\` is not \`0\` and not \`""\`. \`None + 5\` raises a \`TypeError\`.

\`bool\` has two values, \`True\` and \`False\`. Comparisons such as \`>\`, \`<=\`, \`!=\` and \`in\` produce bools, and you combine them with \`and\`, \`or\`, \`not\`.

Python also treats some values as *falsy* inside an \`if\`: \`0\`, \`0.0\`, \`""\`, \`[]\`, \`{}\`, \`None\` and \`False\`. Everything else is *truthy*. So \`if not pan:\` catches both \`None\` and \`""\`, which is handy for "PAN missing". But it is dangerous for amounts: \`if not amount:\` is also true for a perfectly valid amount of \`0\`.

## f-strings: format values for humans
An *f-string* is a string with an \`f\` before the quote. Anything inside \`{ }\` is evaluated and inserted. After the value you can add a colon and a *format spec* that controls how it looks:

| Spec | Example | Result |
|---|---|---|
| \`,.2f\` | \`f"{1234567.891:,.2f}"\` | \`1,234,567.89\` |
| \`.0f\` | \`f"{1234567.891:.0f}"\` | \`1234568\` |
| \`.1%\` | \`f"{0.0734:.1%}"\` | \`7.3%\` |
| \`>12\` | \`f"{'IN01':>12}"\` | \`IN01\` right-aligned in 12 characters |
| \`<10\` | \`f"{'Rent':<10}"\` | \`Rent\` left-aligned in 10 characters |
| \`05d\` | \`f"{42:05d}"\` | \`00042\` |
| \`+,.0f\` | \`f"{2500:+,.0f}"\` | \`+2,500\` (always show the sign) |
| \`=\` | \`f"{total=}"\` | \`total=1234.5\` (quick debugging) |

The pattern is always \`{value:[align][width][,][.precision][type]}\`. You will use \`,.2f\`, \`.1%\` and the alignment specs every week.`,
    { py: {
      title: 'A mini MIS table with f-strings',
      starter: `rows = [
    ("Revenue", 12345678.5, 11800000),
    ("Salaries", 4210000.0, 4000000),
    ("Rent", 615000.25, 600000),
    ("Travel", 98500.0, 120000),
]
print(f"{'Account':<12}{'Actual':>16}{'Budget':>16}{'Var %':>9}")
print("-" * 53)
for name, actual, budget in rows:
    var_pct = (actual - budget) / budget
    print(f"{name:<12}{actual:>16,.2f}{budget:>16,.0f}{var_pct:>+9.1%}")

month = 9
print(f"Run for month {month:02d}, entity {'IN01'}")
total = sum(r[1] for r in rows)
print(f"{total=:,.2f}")

pan = None
print("PAN missing" if pan is None else pan)`,
      note: 'Change the widths (12, 16, 9) and watch the columns move. Add a row for "Software" and re-run.',
    } },
    `## Indian number format: lakhs and crores
The \`,\` spec groups digits in thousands: \`12,345,678.00\`. Indian reports group the last three digits, then pairs: \`1,23,45,678.00\` (1 crore, 23 lakh, 45 thousand, 678). Python has no built-in spec for this, so you build it with string methods:
1. Format with 2 decimals and no commas: \`f"{abs(x):.2f}"\` gives \`"12345678.00"\`.
2. Split at the dot into the whole part \`"12345678"\` and the decimals \`"00"\`.
3. Keep the last 3 digits of the whole part (\`"678"\`). Group the rest from the right in pairs: \`"1"\`, \`"23"\`, \`"45"\`.
4. Join with commas and add the \`₹\` and the minus sign.

For headline numbers, short forms are often better: \`x / 1e7\` gives crores and \`x / 1e5\` gives lakhs.`,
    { py: {
      title: 'Lakhs formatting, step by step',
      starter: `x = 12345678.5
s = f"{x:.2f}"              # '12345678.50' (no commas)
whole, dec = s.split(".")   # '12345678' and '50'
last3 = whole[-3:]          # '678'
rest = whole[:-3]           # '12345' -> must become '1,23,45'
print(whole, dec, last3, rest)

# take two digits at a time from the RIGHT of rest
print(rest[-2:], rest[:-2])     # '45' and '123'

print(f"{x / 1e7:.2f} Cr")    # crores
print(f"{x / 1e5:.2f} L")     # lakhs
print(f"{x:,.2f}   <- built-in grouping is western (thousands)")`,
      note: 'You will turn these steps into a reusable function in the challenge below.',
    } },
    `## String methods
Strings are *immutable*: a method never changes the original string, it **returns a new one**. So \`name.strip()\` on its own line does nothing useful. Write \`name = name.strip()\`.

| Method | What it does | Example and result |
|---|---|---|
| \`strip()\` | remove spaces and newlines at both ends | \`"  IN01 ".strip()\` gives \`"IN01"\` |
| \`upper()\`, \`lower()\`, \`title()\` | change case | \`"sbin0001234".upper()\` gives \`"SBIN0001234"\` |
| \`replace(a, b, n)\` | replace a with b (first n only, if n given) | \`"1,000".replace(",", "")\` gives \`"1000"\` |
| \`split(sep)\` | cut into a list | \`"INV/0042/25-26".split("/")\` gives \`['INV', '0042', '25-26']\` |
| \`sep.join(items)\` | glue a list together | \`"-".join(["INV", "0042"])\` gives \`"INV-0042"\` |
| \`startswith()\`, \`endswith()\` | check start or end | \`"sales_2026-09.csv".endswith(".csv")\` is \`True\` |
| \`x in s\` | contains? | \`"Pvt" in "Kollana Tech India Pvt Ltd"\` is \`True\` |
| \`find(x)\` | position of x, or -1 | \`"JV202504-0001".find("-")\` gives \`8\` |
| \`zfill(n)\` | pad with zeros on the left | \`"42".zfill(4)\` gives \`"0042"\` |
| \`isdigit()\` | only digits? | \`"18163244337".isdigit()\` is \`True\` |
| \`len(s)\` | length (a function, not a method) | \`len("29AAHCN9902L1ZX")\` gives \`15\` |

**Indexing and slicing.** \`s[0]\` is the first character and \`s[-1]\` the last. \`s[a:b]\` takes characters from position a up to, but **not including**, b. A GSTIN is 2 digits of state code, then the 10-character PAN, then 3 more characters, so slicing pulls it apart.`,
    { sketch: { w: 760, h: 250, caption: 'Slicing a GSTIN: positions start at 0, and the end of a slice is excluded', items: [
      { t: 'table', x: 50, y: 60, title: 'gstin = "29AAHCN9902L1ZX"', cols: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'], colW: [44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44], rowH: 30, rows: [['2', '9', 'A', 'A', 'H', 'C', 'N', '9', '9', '0', '2', 'L', '1', 'Z', 'X'], ['-15', '-14', '-13', '-12', '-11', '-10', '-9', '-8', '-7', '-6', '-5', '-4', '-3', '-2', '-1']], dim: [1] },
      { t: 'brace', x: 52, y: 156, w: 84, label: 'state code\ns[0:2]' },
      { t: 'brace', x: 140, y: 156, w: 436, label: 'PAN   s[2:12]' },
      { t: 'brace', x: 668, y: 156, w: 40, label: 's[-1]' },
    ] } },
    { py: {
      title: 'Cleaning a messy purchase line',
      starter: `line = "  29aahcn9902l1zx | nandi ELECTRICALS  | INV-3523/25-26 |  41,460.00 "
gstin, name, inv, amt = line.split("|")    # 4 pieces

gstin = gstin.strip().upper()
name = name.strip().title()
inv_wrong = inv.strip().replace("-", "/")      # replaces EVERY '-'
inv = inv.strip().replace("-", "/", 1)         # only the first one
amount = float(amt.strip().replace(",", ""))

print(gstin, "|", name, "|", inv, "|", amount)
print("wrong fix:", inv_wrong)
print("state:", gstin[:2], " PAN:", gstin[2:12], " check char:", gstin[-1])
print(len(gstin) == 15, gstin[:2].isdigit())
print(inv.split("/"))
print("/".join(["INV", "42".zfill(4), "25-26"]))
print(name.startswith("Nandi"), "Electricals" in name)`,
      note: 'Notice `inv_wrong`: `replace` changes every match unless you pass a count. That is exactly the supplier typo (`INV-0689/25-26` vs `INV/0689/25-26`) you will reconcile later.',
    } },
    { pychallenge: {
      id: 'python-setup-types-ch1',
      prompt: 'Write `format_inr(amount)` that returns the amount in Indian format with the rupee sign and 2 decimals: `format_inr(12345678.5)` gives `"₹1,23,45,678.50"`, `format_inr(999)` gives `"₹999.00"`, and negatives put the minus first: `format_inr(-2500.756)` gives `"-₹2,500.76"`.',
      starter: `def format_inr(amount):
    # TODO: Indian grouping (last 3 digits, then pairs), 2 decimals, ₹, minus sign in front
    return f"₹{amount:,.2f}"
`,
      tests: `assert format_inr(0) == "₹0.00", format_inr(0)
assert format_inr(999) == "₹999.00", format_inr(999)
assert format_inr(1000) == "₹1,000.00", format_inr(1000)
assert format_inr(100000) == "₹1,00,000.00", f"format_inr(100000) returned {format_inr(100000)!r}"
assert format_inr(12345678.5) == "₹1,23,45,678.50", format_inr(12345678.5)
assert format_inr(1234567890) == "₹1,23,45,67,890.00", format_inr(1234567890)
assert format_inr(-2500.756) == "-₹2,500.76", format_inr(-2500.756)`,
      solution: `def format_inr(amount):
    sign = "-" if amount < 0 else ""
    whole, dec = f"{abs(amount):.2f}".split(".")
    last3 = whole[-3:]
    rest = whole[:-3]
    groups = []
    while rest:                      # take 2 digits at a time from the right
        groups.insert(0, rest[-2:])
        rest = rest[:-2]
    body = ",".join(groups + [last3])
    return f"{sign}₹{body}.{dec}"
`,
      hint: 'Use the steps from the playground. A `while rest:` loop can take `rest[-2:]`, insert it at the front of a list, then cut it off with `rest = rest[:-2]`. Finish with `",".join(...)`.',
    } },
    { pychallenge: {
      id: 'python-setup-types-ch2',
      prompt: 'Payroll logs must never show full bank account numbers. Write `mask_account(account)` that removes all spaces, then replaces every character except the **last 4** with `X`. Values of 4 characters or fewer are returned unchanged (after removing spaces). Example: `mask_account(" 4786 0558 007 ")` gives `"XXXXXXX8007"`.',
      starter: `def mask_account(account):
    # TODO: remove spaces, keep the last 4 characters, X for the rest
    return account
`,
      tests: `assert mask_account("18163244337") == "XXXXXXX4337", mask_account("18163244337")
assert mask_account(" 4786 0558 007 ") == "XXXXXXX8007", mask_account(" 4786 0558 007 ")
assert mask_account("1234") == "1234"
assert mask_account("98") == "98"
assert mask_account("12345") == "X2345"`,
      solution: `def mask_account(account):
    digits = account.replace(" ", "")
    if len(digits) <= 4:
        return digits
    return "X" * (len(digits) - 4) + digits[-4:]
`,
      hint: '`"X" * 3` gives `"XXX"`. Combine it with the slice `digits[-4:]`.',
    } },
    { real: 'Bank files where account numbers lost their leading zeros, PIN codes shown as `5.6e5`, employee codes `"0042"` turned into `42`: all of these happen because a tool treated an ID as a number. Rule: **if you would never do maths on it, keep it as a `str`** (account numbers, PAN, GSTIN, IFSC, employee codes, PIN codes, invoice numbers). In pandas you will do this with `dtype=str` when reading.' },
    { interview: `**"Are Python strings mutable? What does \`s.replace()\` return?"**
Model answer: "No, strings are immutable. Methods like \`replace\`, \`strip\` and \`upper\` return a **new** string and leave the original unchanged, so I always assign the result back, for example \`code = code.strip().upper()\`. Immutability is also why strings can be dictionary keys."

**"Why is \`0.1 + 0.2 != 0.3\`?"** "Floats are binary fractions, and 0.1 has no exact binary form, so tiny errors appear. For display I round at the end; for money that must reconcile to the paisa I use \`Decimal\` built from strings."` },
    `## Recap
- Install Python 3.12 with **Add to PATH** ticked; use the \`py\` launcher (\`py --version\`, \`py -0\`, \`py script.py\`) and VS Code with the Microsoft Python extension.
- Five basic types: \`int\`, \`float\`, \`str\`, \`bool\`, \`None\`. Values read from files are \`str\` until you convert them.
- Floats are approximate: round at the end, use \`Decimal("...")\` for exact money. Check missing values with \`is None\`.
- f-strings with format specs (\`,.2f\`, \`.1%\`, \`>12\`) turn numbers into report-ready text; Indian grouping needs a small helper.
- String methods return new strings; slicing (\`s[2:12]\`, \`s[-4:]\`) pulls IDs like GSTIN and PAN apart.`,
  ],
  quiz: [
    { q: 'You read `"1000"` and `"500"` from a CSV and add them with `+`. What do you get?', o: ['`1500`', '`"1500"`', '`"1000500"`', 'a TypeError'], a: 2, why: 'Both values are `str`, so `+` joins the text. Convert with `int()` or `float()` first.' },
    { q: 'What does `f"{1234567.891:,.2f}"` produce?', o: ['`1,234,567.89`', '`12,34,567.89`', '`1234567.89`', '`1,234,567.891`'], a: 0, why: '`,` adds thousands separators (western grouping) and `.2f` rounds to 2 decimals.' },
    { q: 'After `code = "  in01 "` and then the line `code.strip().upper()` (result not assigned), what is `code`?', o: ['`"IN01"`', '`"in01"`', '`"  IN01 "`', '`"  in01 "`'], a: 3, why: 'Strings are immutable. The methods returned a new string, but it was never assigned back, so `code` is unchanged.' },
    { q: 'What is the correct way to check that a PAN value is missing (`None`)?', o: ['`if pan == 0:`', '`if pan is None:`', '`if pan == "None":`', '`if pan.empty():`'], a: 1, why: '`None` is a single special object, so the identity check `is None` is the standard and safest test.' },
    { q: '`"29AAHCN9902L1ZX"[2:12]` returns…', o: ['`"AAHCN9902L1"`', '`"9AAHCN9902L"`', '`"AAHCN9902L"`', '`"29AAHCN990"`'], a: 2, why: 'The slice starts at index 2 and stops **before** index 12, giving the 10-character PAN.' },
    { q: 'Which statement about floats is true?', o: ['`round(2.5)` gives `3` in Python', 'Build `Decimal` values from strings when every paisa must match', '`Decimal(0.1)` is exactly 0.1', '`0.1 + 0.2 == 0.3` is `True`'], a: 1, why: '`Decimal("0.1")` is exact; `Decimal(0.1)` copies the float error. `round(2.5)` is `2` (banker\'s rounding) and the float sum is `0.30000000000000004`.' },
  ],
  task: {
    title: 'Set up your laptop and build a formatting helper',
    steps: [
      'Install Python 3.12 with "Add python.exe to PATH" ticked. Run `py --version` and `py -0` in a new PowerShell window.',
      'Install VS Code and the Microsoft Python extension, open the folder `C:\\fde\\py-recap` and select the 3.12 interpreter.',
      'Create `formatting.py` with your `format_inr` and `mask_account` functions from this lesson.',
      'At the bottom, print a 5-line mini MIS: account name left-aligned in 20 characters and the amount right-aligned in Indian format.',
      'Run it with `py formatting.py` in the VS Code terminal, then open the REPL with `py` and test `format_inr(-1)` by hand.',
    ],
    deliverable: '`formatting.py` plus a screenshot showing `py --version` and the script output.',
  },
};
