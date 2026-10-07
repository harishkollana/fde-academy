export default {
  id: 'python-text-time-money',
  title: 'Text, dates and money',
  goal: 'You can validate and extract text with regular expressions, work with dates, time zones and the April-March fiscal year, calculate money with Decimal (rounding and splitting to the paisa), and make stable ids and fingerprints with uuid and hashlib.',
  roadmap: ['regular expressions', 'datetime, zoneinfo and dateutil', 'fiscal year helpers', 'decimal for money', 'hashlib and uuid', 'Indian number formats'],
  blocks: [
    `## The problem
Three things go wrong in almost every finance script, and each looks harmless:
1. **Text.** A narration says \`Paid INV/0042/25-26 to Nandi Electricals GSTIN 29AAHCN9902L1ZX on 12-09-2026 amount Rs. 1,25,000.50\`. You need the invoice number, the GSTIN, the date and the amount out of that sentence. Or a vendor sheet has IFSC codes in lower case and with spaces.
2. **Dates.** \`12-09-2026\` is 12 September in India and 9 December in the USA. A transaction at 11:30 p.m. in Mumbai on 31 March is already 1 April in Singapore, so it belongs to a different financial year there. February has 28 or 29 days. Your fiscal year starts in April.
3. **Money.** \`0.1 + 0.2\` is not \`0.3\` in Python. A total that is off by one paisa fails a reconciliation. Splitting ₹100 three ways gives ₹33.33 three times, and a paisa disappears.

Each has a standard tool: \`re\` for text patterns, \`datetime\` with \`zoneinfo\` and \`dateutil\` for time, and \`decimal\` for money. At the end you also meet two small tools that every pipeline uses: \`uuid\` and \`hashlib\`, for stable ids and for detecting that data changed.`,
    `## Regular expressions: patterns for text
A **regular expression** (regex) describes the *shape* of a text. \`[A-Z]{5}\\d{4}[A-Z]\` means "five capital letters, four digits, one capital letter", which is a PAN. You write a regex once and the \`re\` module checks or searches text with it. Write patterns as **raw strings**, \`r"..."\`, so Python leaves the backslashes alone.

| Piece | Meaning |
|---|---|
| \`.\` | any one character (except a line break) |
| \`\\d\`  \`\\w\`  \`\\s\` | a digit, a letter/digit/underscore, a whitespace |
| \`[A-Z]\`  \`[0-9A-F]\`  \`[^,]\` | one character from a set; \`^\` inside means "not these" |
| \`{5}\`  \`{2,4}\` | exactly 5, or 2 to 4 times |
| \`+\`  \`*\`  \`?\` | one or more, zero or more, zero or one |
| \`^\`  \`$\`  \`\\b\` | start of text, end of text, a word boundary |
| \`(...)\`  \`(?P<name>...)\` | a group, and a named group you can read back |
| \`(?:...)\` | a group for structure only, no capture |

Alternation ("this or that") is written with a vertical bar between two options, for example \`INV or CN\`.

**Which function?**
- \`pattern.fullmatch(text)\`: the **whole** text must fit. Use it to **validate** a field.
- \`pattern.search(text)\`: finds the first match **anywhere**. Use it to **extract**.
- \`pattern.match(text)\`: must match from the **start** (but not necessarily to the end). The mistake of using \`match\` when you meant \`fullmatch\` lets \`29AAHCN9902L1ZXJUNK\` pass as a GSTIN.
- \`findall\` and \`finditer\`: all matches. \`re.sub(pattern, replacement, text)\`: replace. \`re.compile\` once if you reuse the pattern.

**Greedy or lazy.** \`.*\` takes as much as it can; \`.*?\` takes as little as it can. Between two markers you almost always want the lazy form.

A GSTIN has fifteen characters, and its structure is what the regex expresses. The PAN of the business is inside it (characters 3 to 12), so a vendor's PAN can be cross-checked against its GSTIN.`,
    { sketch: { w: 760, h: 292, caption: 'A GSTIN in five parts: each part is one piece of the regular expression', items: [
      { t: 'text', x: 14, y: 22, text: 'GSTIN = 15 characters, five parts', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 36, w: 62, h: 44, fill: 'blue' },
      { t: 'box', x: 82, y: 36, w: 168, h: 44, fill: 'yellow' },
      { t: 'box', x: 256, y: 36, w: 52, h: 44, fill: 'white' },
      { t: 'box', x: 314, y: 36, w: 52, h: 44, fill: 'pink' },
      { t: 'box', x: 372, y: 36, w: 52, h: 44, fill: 'white' },
      { t: 'text', x: 45, y: 65, text: '29', font: 'mono', size: 15, anchor: 'middle' },
      { t: 'text', x: 166, y: 65, text: 'AAHCN9902L', font: 'mono', size: 15, anchor: 'middle' },
      { t: 'text', x: 282, y: 65, text: '1', font: 'mono', size: 15, anchor: 'middle' },
      { t: 'text', x: 340, y: 65, text: 'Z', font: 'mono', size: 15, anchor: 'middle' },
      { t: 'text', x: 398, y: 65, text: 'X', font: 'mono', size: 15, anchor: 'middle' },
      { t: 'text', x: 14, y: 108, text: 'part', size: 12, color: '#7a8296', anchor: 'start' },
      { t: 'text', x: 130, y: 108, text: 'meaning', size: 12, color: '#7a8296', anchor: 'start' },
      { t: 'text', x: 290, y: 108, text: 'regex', size: 12, color: '#7a8296', anchor: 'start' },
      { t: 'text', x: 14, y: 134, text: '29', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 130, y: 134, text: 'state code', size: 14, anchor: 'start' },
      { t: 'text', x: 290, y: 134, text: '\\d{2}', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 14, y: 162, text: 'AAHCN9902L', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 130, y: 162, text: 'PAN of the business', size: 14, anchor: 'start' },
      { t: 'text', x: 290, y: 162, text: '[A-Z]{5}\\d{4}[A-Z]', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 14, y: 190, text: '1', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 130, y: 190, text: 'registration number', size: 14, anchor: 'start' },
      { t: 'text', x: 290, y: 190, text: '[A-Z0-9]', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 14, y: 218, text: 'Z', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 130, y: 218, text: 'a fixed letter', size: 14, anchor: 'start' },
      { t: 'text', x: 290, y: 218, text: 'Z', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 14, y: 246, text: 'X', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 130, y: 246, text: 'check character', size: 14, anchor: 'start' },
      { t: 'text', x: 290, y: 246, text: '[A-Z0-9]', font: 'mono', size: 13, anchor: 'start' },
      { t: 'note', x: 466, y: 40, w: 280, h: 96, fill: 'green', size: 13, text: 'fullmatch(): the WHOLE text must fit.\nUse it to validate a field.\nsearch(): finds a match anywhere.\nUse it to pull data out of a sentence.' },
      { t: 'note', x: 466, y: 152, w: 280, h: 92, fill: 'yellow', size: 13, text: 'The shape check cannot tell if a\nGSTIN really exists. For that you\nneed the register or the check\ncharacter rule. A regex checks form.' },
    ] } },
    { py: {
      title: 'Validate Indian ids and pull data out of a narration',
      starter: `import re
from decimal import Decimal

GSTIN = re.compile(r"\\d{2}[A-Z]{5}\\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]")
PAN = re.compile(r"[A-Z]{5}\\d{4}[A-Z]")
IFSC = re.compile(r"[A-Z]{4}0[A-Z0-9]{6}")

checks = [("GSTIN", GSTIN, "29AAHCN9902L1ZX"), ("GSTIN", GSTIN, "29AAHCN9902L1X"),
          ("PAN", PAN, "AAHCN9902L"), ("IFSC", IFSC, "HDFC0072307"),
          ("IFSC", IFSC, "HDFC123456"), ("IFSC", IFSC, "hdfc0072307")]
for label, pattern, value in checks:
    print(f"{label:<6}{value:<18}{'valid' if pattern.fullmatch(value) else 'INVALID'}")

# match / search / fullmatch on the same text
text = "29AAHCN9902L1ZX!"
print("match:", bool(GSTIN.match(text)), "| search:", bool(GSTIN.search(text)), "| fullmatch:", bool(GSTIN.fullmatch(text)))

# extraction with named groups
narration = "Paid INV/0042/25-26 to Nandi Electricals GSTIN 29AAHCN9902L1ZX on 12-09-2026 amount Rs. 1,25,000.50"
m = re.search(
    r"(?P<invoice>INV/\\d+/\\d{2}-\\d{2}).*?(?P<gstin>\\d{2}[A-Z]{5}\\d{4}[A-Z][A-Z0-9]Z[A-Z0-9])"
    r".*?(?P<date>\\d{2}-\\d{2}-\\d{4}).*?Rs\\.\\s*(?P<amount>[\\d,]+(?:\\.\\d+)?)", narration)
print(m.groupdict())
print("PAN inside the GSTIN:", m["gstin"][2:12], "| amount as Decimal:", Decimal(m["amount"].replace(",", "")))

# findall, finditer, sub
log = "INV/1/25-26 paid; inv/22/25-26 pending; INV/333/25-26 failed"
print(re.findall(r"INV/\\d+/\\d{2}-\\d{2}", log, flags=re.IGNORECASE))
print([(mm.group(), mm.span()) for mm in re.finditer(r"\\d+", "A12B345")])
print(repr(re.sub(r"\\s+", " ", "  Nandi   Electricals \\t Pune  ").strip()))
print(re.sub(r"[^0-9A-Za-z]", "", "INV/0042/25-26"))

# greedy versus lazy
html = "<b>GST</b> and <b>TDS</b>"
print(re.findall(r"<b>.*</b>", html), re.findall(r"<b>.*?</b>", html))`,
      note: 'The third result of the match line is the lesson: match() accepts the text because it only checks the start, search() finds the id inside the text, and fullmatch() rejects it because of the extra "!". Use fullmatch for validation. The lazy pattern stops at the first closing tag, the greedy one runs to the last.',
    } },
    { widget: 'RegexTester', props: { preset: 'Invoice no' } },
    { warn: `Regex traps:
- **\`match\` instead of \`fullmatch\`** when validating. Junk at the end passes.
- **Forgetting the raw string.** \`"\\d"\` works by luck, \`"\\b"\` means a backspace character. Always write \`r"\\b"\`.
- **A regex is not a parser.** Do not parse nested brackets, HTML or full addresses with a regex. For CSV use \`csv\`, for JSON use \`json\`.
- **Catastrophic backtracking.** A pattern with nested repeats such as \`(a+)+$\` can take forever on a bad input. Keep patterns simple and be careful with user-supplied text.
- **Over-trusting a shape check.** A GSTIN that fits the pattern may still not exist. The regex is the first filter, not the last.` },
    `## Dates, time zones and the fiscal year
Python has \`date\` (a day), \`datetime\` (a day and a time) and \`timedelta\` (a length of time). Rules that save you from most bugs:
- **Parse with an explicit format.** \`datetime.strptime("12-09-2026", "%d-%m-%Y")\`. ISO text (\`2026-09-12\`) is read by \`date.fromisoformat\`. Never let a library guess day and month.
- **An invalid date raises \`ValueError\`**: \`31-04-2026\` does not exist. That is a data-quality finding, not a crash to ignore.
- **\`timedelta\` has days and seconds but no months.** To add a month use \`dateutil.relativedelta\`: 31 January plus one month gives 28 February (it clips to the month end). \`calendar.monthrange(year, month)\` gives the number of days, so you can find a month end.
- **Naive or aware.** A *naive* datetime has no time zone, an *aware* one does. You cannot compare the two (\`TypeError\`). Store and compute in **UTC**, convert to a local zone only to display. \`zoneinfo.ZoneInfo("Asia/Kolkata")\` gives a zone; \`dt.astimezone(zone)\` converts. India has no daylight saving, but other countries do, which is why you should use named zones and not "plus 5:30".
- In the **browser** Python you must write \`import tzdata\` before using \`zoneinfo\` (the zone database is a package there). On your laptop \`pip install tzdata\` helps on Windows.

**The financial year** runs from 1 April to 31 March and is named after the year it **starts** in: 15 February 2026 is in **FY2025-26**, and 1 April 2026 starts FY2026-27. A tiny helper turns any date into a fiscal year, a fiscal quarter (Q1 is April to June) and a fiscal month number (April is 1, March is 12). Put these helpers in one module and use them everywhere, so the whole project agrees.`,
    { sketch: { w: 760, h: 262, caption: 'The fiscal year starts in April, and its label uses the year it starts in', items: [
      { t: 'table', x: 14, y: 44, title: 'FY2025-26: 1 April 2025 to 31 March 2026', cols: ['', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], colW: [116, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52], rows: [['fiscal month', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], ['fiscal quarter', 'Q1', 'Q1', 'Q1', 'Q2', 'Q2', 'Q2', 'Q3', 'Q3', 'Q3', 'Q4', 'Q4', 'Q4'], ['calendar year', '2025', '2025', '2025', '2025', '2025', '2025', '2025', '2025', '2025', '2026', '2026', '2026']], rowH: 28, hl: [0] },
      { t: 'note', x: 14, y: 170, w: 360, h: 78, fill: 'yellow', size: 13, text: 'start = d.year if d.month >= 4 else d.year - 1\nlabel = "FY" + start + "-" + last two digits of start + 1\n15 Feb 2026 gives start 2025, so FY2025-26' },
      { t: 'note', x: 392, y: 170, w: 354, h: 78, fill: 'green', size: 13, text: 'fiscal month = (d.month - 4) % 12 + 1\nfiscal quarter = (d.month - 4) % 12 // 3 + 1\nFeb 2026: fiscal month 11, quarter Q4' },
    ] } },
    { py: {
      title: 'Dates: parsing, month arithmetic, time zones and a fiscal helper',
      starter: `import calendar
from datetime import date, datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
import tzdata                                  # the browser needs this so zoneinfo can find the zone database
from zoneinfo import ZoneInfo

# parsing: always say the format
print(datetime.strptime("12-09-2026", "%d-%m-%Y").date(), "| ISO:", date.fromisoformat("2026-09-12"))
print(date(2026, 9, 30).strftime("%d-%b-%Y"), "|", (date(2026, 9, 30) - date(2026, 4, 1)).days, "days since 1 April")
try:
    datetime.strptime("31-04-2026", "%d-%m-%Y")
except ValueError as exc:
    print("ValueError:", exc)

# months are not a fixed number of days
print(date(2026, 1, 31) + relativedelta(months=1), "<- relativedelta clips to the month end")
print(date(2026, 1, 31) + timedelta(days=30), "<- timedelta only knows days")
def month_end(d):
    return d.replace(day=calendar.monthrange(d.year, d.month)[1])
print("month ends:", month_end(date(2026, 2, 10)), month_end(date(2028, 2, 10)))   # 2028 is a leap year

# time zones: the same instant is a different calendar date in two places
ist, sgt = ZoneInfo("Asia/Kolkata"), ZoneInfo("Asia/Singapore")
t = datetime(2026, 3, 31, 23, 30, tzinfo=ist)
print("India    :", t.isoformat())
print("UTC      :", t.astimezone(timezone.utc).isoformat())
print("Singapore:", t.astimezone(sgt).isoformat(), "->", t.astimezone(sgt).date(), "(the next financial year)")
try:
    datetime(2026, 3, 31, 23, 30) < t
except TypeError as exc:
    print("TypeError:", exc)

# fiscal helpers
def fiscal_year(d):
    start = d.year if d.month >= 4 else d.year - 1
    return f"FY{start}-{(start + 1) % 100:02d}"

def fiscal_quarter(d):
    return ((d.month - 4) % 12) // 3 + 1

def fiscal_month(d):
    return (d.month - 4) % 12 + 1

for d in [date(2026, 3, 31), date(2026, 4, 1), date(2025, 12, 15), date(2026, 2, 15)]:
    print(d, fiscal_year(d), f"Q{fiscal_quarter(d)}", "fiscal month", fiscal_month(d))`,
      note: 'The Singapore line is a famous source of off-by-one-month bugs: 11:30 p.m. on 31 March in India is 2:00 a.m. on 1 April in Singapore, so the same payment falls into different months and different financial years depending on the zone you read it in. Store UTC and decide which zone defines the booking date.',
    } },
    `## Money: Decimal, never float
A computer stores a \`float\` in binary, and most decimal fractions, such as 0.1, have **no exact binary form**. \`0.1 + 0.2\` is \`0.30000000000000004\`. For a scientific model that is fine. For a ledger it is not, because a total that is off by one paisa fails a reconciliation and, over millions of lines, real money disappears.

Use \`decimal.Decimal\`, which stores decimal digits exactly. Four rules:
1. **Create it from text (or an int), never from a float.** \`Decimal("0.1")\` is exact. \`Decimal(0.1)\` copies the float's error. Read money from files as text and convert straight away.
2. **Round once, at the end, with \`quantize\`** and an explicit rule: \`amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)\`. The built-in \`round()\` on floats rounds halves to the nearest even number (\`round(2.5)\` is 2) and float errors (\`round(2.675, 2)\` is 2.67). Tax rules usually say "half up", which is \`ROUND_HALF_UP\`.
3. **Split in whole paise.** If a total of ₹100.00 is shared in three equal parts, each rounded part is 33.33 and the sum is 99.99. Work in integer paise, give every part its integer share, and hand the leftover paise to the parts with the largest remainders (the *largest remainder method*). Then the parts **always add up to the total**. The same trap sits in GST: CGST and SGST are half of the GST each, and when the GST has an odd paisa you compute one half and take the other as "total minus that half".
4. **Never add amounts in different currencies**, and keep the currency next to the amount. (Remember: entity 1 is in rupees, entity 2 in Singapore dollars.)

Indian digit grouping (1,25,000.50: groups of two after the first three) is a **display** matter. Python's \`format(n, ",")\` produces 125,000.50, so Indian grouping needs a small function of your own, like the one in challenge 2. Store the plain number, format only when you show it.`,
    { sketch: { w: 760, h: 270, caption: 'Float is close, Decimal is exact; a split must be done in paise so the parts add up', items: [
      { t: 'table', x: 14, y: 42, title: 'the same sums, two ways', cols: ['what you compute', 'with float', 'with Decimal (from text)'], colW: [220, 210, 300], rows: [['0.1 + 0.2', '0.30000000000000004', '0.3'], ['1.1 * 3', '3.3000000000000003', '3.3'], ['round 2.675 to 2 places', '2.67 (float error)', '2.68 with ROUND_HALF_UP'], ['share 100.00 three ways', '33.33 x 3 = 99.99', '33.34 + 33.33 + 33.33 = 100.00']], rowH: 30, hl: [3] },
      { t: 'note', x: 14, y: 196, w: 732, h: 58, fill: 'yellow', size: 14, text: 'Build Decimals from TEXT, round once at the end with quantize(), and split in whole paise\nso the parts always add up to the total.' },
    ] } },
    { py: {
      title: 'Float errors, rounding, GST and an odd-paisa split',
      starter: `from decimal import Decimal, ROUND_HALF_UP

print(0.1 + 0.2, "|", 0.1 + 0.2 == 0.3, "|", 1.1 * 3)
print(Decimal("0.1") + Decimal("0.2"), "|", Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))
print("Decimal(0.1)  keeps the float error:", Decimal(0.1))
print('Decimal("0.1") is exact           :', Decimal("0.1"))
print("float round:", round(2.675, 2), "| banker's rounding:", round(0.5), round(1.5), round(2.5))

cents = Decimal("0.01")
print("HALF_UP     :", Decimal("2.675").quantize(cents, rounding=ROUND_HALF_UP))

# GST 18 percent on an invoice
taxable = Decimal("1234.50")
gst = (taxable * Decimal("0.18")).quantize(cents, rounding=ROUND_HALF_UP)
print("taxable", taxable, "| GST", gst, "| invoice total", taxable + gst)

# CGST and SGST are half each: with an odd paisa both halves cannot be equal
naive_half = (gst / 2).quantize(cents, rounding=ROUND_HALF_UP)
print("naive: CGST", naive_half, "+ SGST", naive_half, "=", naive_half * 2, "(is it", gst, "?)")
cgst = naive_half
sgst = gst - cgst                                   # the other half is "what is left"
print("fixed: CGST", cgst, "+ SGST", sgst, "=", cgst + sgst)

# splitting 100.00 in three: integer paise and the leftover
paise = 10000
base, left = divmod(paise, 3)
parts = [base + (1 if i < left else 0) for i in range(3)]
print("paise:", parts, "=", sum(parts), "->", [Decimal(p).scaleb(-2) for p in parts])
print("three unrounded parts add up to", round(sum([100.00 / 3] * 3), 2), "but three parts rounded to the paisa add up to", round(sum([round(100 / 3, 2)] * 3), 2))

# adding up many floats drifts, Decimal does not
print(sum([0.1] * 10) == 1.0, "|", sum([Decimal("0.1")] * 10) == Decimal("1.0"))`,
      note: 'GST of 222.21 cannot be split into two equal halves in paise, so "half and half" produces 222.22 or 222.20. The fix is to compute one half, then take the remainder for the other. The same idea, applied to many parts, is the allocate() function you write in challenge 1.',
    } },
    `## Stable ids and fingerprints: uuid and hashlib
Two jobs come up in every pipeline: giving a record an **id that never changes**, and noticing that a record **has changed**.
- **\`uuid.uuid4()\`** is a random id. Use it when you only need uniqueness.
- **\`uuid.uuid5(namespace, text)\`** is **deterministic**: the same namespace and the same text always give the same UUID. Build it from the **business key** (supplier GSTIN plus invoice number) and loading the same invoice twice produces the same id, so a second run updates the row instead of creating a duplicate. This is the heart of an **idempotent** load. Clean the text first (strip, upper) so that harmless differences do not create a new id.
- **\`hashlib.sha256(data).hexdigest()\`** turns any data into a 64-character **fingerprint**. A tiny change gives a completely different fingerprint, and you cannot get the data back. Use it to detect changed rows (hash of the columns that matter), to check that a file arrived unchanged (hash it in chunks), and as a partition or dedupe key.
- **Do not use the built-in \`hash()\`** for anything you store. For strings it is deliberately different in every run of Python.
- **Do not use a plain SHA-256 for passwords.** Passwords need a slow, salted method; the Security lesson covers it.`,
    { py: {
      title: 'uuid5 keys, row fingerprints and a chunked file hash',
      starter: `import hashlib
import uuid

NAMESPACE = uuid.UUID("12345678-1234-5678-1234-567812345678")   # pick one fixed UUID and keep it forever

def invoice_key(gstin, invoice_no):
    clean = f"{gstin.strip().upper()}|{invoice_no.strip().upper()}"
    return uuid.uuid5(NAMESPACE, clean)

a = invoice_key("29AAHCN9902L1ZX", "INV/0042/25-26")
b = invoice_key("29aahcn9902l1zx", " inv/0042/25-26 ")
c = invoice_key("29AAHCN9902L1ZX", "INV/0043/25-26")
print(a)
print("same invoice, same id:", a == b, "| another invoice:", a == c)
print("uuid4 is random:", uuid.uuid4() == uuid.uuid4(), "| versions:", uuid.uuid4().version, a.version)

# a row fingerprint to detect change
def row_hash(row):
    text = "\\x1f".join(f"{k}={row[k]}" for k in sorted(row))      # \\x1f cannot appear in normal data
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

before = {"emp_id": 6, "department": "Sales", "gross_pay": "108333.33"}
after = dict(before, gross_pay="259999.99")
print(len(row_hash(before)), "hex characters |", row_hash(before)[:12], "->", row_hash(after)[:12])
print("unchanged row, same hash:", row_hash(before) == row_hash(dict(before)))
print("changed row, different  :", row_hash(before) != row_hash(after))

# the fingerprint of a whole file, read in chunks so memory stays small
def file_sha256(path, chunk_size=65536):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(chunk_size), b""):       # call read() until it returns b""
            h.update(block)
    return h.hexdigest()

print("fact_gl.csv sha256 starts with:", file_sha256("fact_gl.csv")[:16], "... (same file, same value, every time)")
print(file_sha256("fact_gl.csv") == file_sha256("fact_gl.csv"))`,
      note: 'uuid5 gives the first two invoices the same id even though the text was written differently, because the key is cleaned first. The exact hash values are not important: what matters is that the same input always gives the same output, and any change gives a different one. The file hash is how you prove that "this is the file we processed" and how a job can skip a file it has already loaded.',
    } },
    { warn: `Things that go wrong with text, time and money:
- **\`Decimal(0.1)\`** instead of \`Decimal("0.1")\`. The float error comes along.
- **Mixing Decimal and float** in one calculation raises \`TypeError\`. Convert the float source at the edge, from text.
- **Rounding every line and then summing** can differ from summing and then rounding. Decide the rule (usually: round each invoice line to the paisa, and then sum) and write it down.
- **Parsing dates without a format**, or with a day/month guess. \`01/02/2026\` is 1 February in India and 2 January in the US.
- **Naive datetimes.** Mixing them with aware ones raises \`TypeError\`. Store UTC, convert for display.
- **Month arithmetic with \`timedelta(days=30)\`.** It does not know months. Use \`relativedelta\`.
- **Fiscal year by calendar year.** Group by \`d.year\` and January to March lands in the wrong year. Use one \`fiscal_year()\` function.
- **\`hash()\` as an id**, or a plain SHA-256 for a password.
- **Letting the regex be the only validation.** A GSTIN or IFSC that matches the shape can still be wrong.` },
    { pychallenge: {
      id: 'python-text-time-money-ch1',
      prompt: 'Write `allocate(total, weights)`. `total` is a `Decimal` with at most two decimal places; `weights` is a list of non-negative integers. Return a list of `Decimal` shares in the same order, in whole paise, so that **their sum equals `total` exactly**. Each share is `total * weight / sum(weights)`; round **down** to whole paise first, then give the leftover paise one by one to the shares with the **largest remainders** (on a tie, the earlier share wins). Raise `ValueError` if `weights` is empty, has a negative number, or sums to zero.',
      starter: `from decimal import Decimal

def allocate(total, weights):
    # TODO: work in integer paise: floor each share, then hand the leftover paise to the largest remainders
    return []
`,
      tests: `import random
from decimal import Decimal

assert allocate(Decimal("100.00"), [1, 1, 1]) == [Decimal("33.34"), Decimal("33.33"), Decimal("33.33")]
assert allocate(Decimal("0.05"), [3, 7]) == [Decimal("0.02"), Decimal("0.03")]
assert allocate(Decimal("10.00"), [0, 1]) == [Decimal("0.00"), Decimal("10.00")]
assert allocate(Decimal("1000.00"), [50, 30, 20]) == [Decimal("500.00"), Decimal("300.00"), Decimal("200.00")]
assert all(isinstance(x, Decimal) for x in allocate(Decimal("5"), [1, 1]))

rng = random.Random(3)
for _ in range(300):
    total = Decimal(rng.randint(0, 10_000_000)) / 100
    weights = [rng.randint(0, 9) for _ in range(rng.randint(1, 7))]
    if sum(weights) == 0:
        continue
    shares = allocate(total, weights)
    assert len(shares) == len(weights)
    assert sum(shares) == total, (total, weights, shares)
    assert all(s >= 0 and s == s.quantize(Decimal("0.01")) for s in shares)

for bad in ([], [0, 0], [-1, 2]):
    try:
        allocate(Decimal("10.00"), bad)
        raise AssertionError("expected ValueError")
    except ValueError:
        pass`,
      solution: `from decimal import Decimal

def allocate(total, weights):
    if not weights or any(w < 0 for w in weights) or sum(weights) == 0:
        raise ValueError("weights must be non-negative and not all zero")
    paise = int(total.scaleb(2))
    s = sum(weights)
    shares = [paise * w // s for w in weights]
    remainders = [paise * w % s for w in weights]
    leftover = paise - sum(shares)
    order = sorted(range(len(weights)), key=lambda i: (-remainders[i], i))
    for i in order[:leftover]:
        shares[i] += 1
    return [Decimal(x).scaleb(-2) for x in shares]
`,
      hint: 'Convert the total to integer paise with `int(total.scaleb(2))`. For each weight the floor share is `paise * w // s` and the remainder is `paise * w % s`. The leftover paise are `paise - sum(shares)`. Sort the indexes by `(-remainder, index)` and add one paisa to the first `leftover` of them. At the end turn each integer back with `Decimal(x).scaleb(-2)`.',
    } },
    { pychallenge: {
      id: 'python-text-time-money-ch2',
      prompt: 'Write `format_inr(amount)` that returns a string in the Indian format: the symbol `₹`, grouping of the integer part as 3 digits at the end and then groups of 2 (`1,25,000.50`), always two decimals, rounded half up. A negative amount is written `-₹12,34,567.89` (sign first). An amount that rounds to zero has no sign. The argument may be a `Decimal`, an `int` or a `str`; convert it with `Decimal(str(amount))`.',
      starter: `from decimal import Decimal, ROUND_HALF_UP

def format_inr(amount):
    # TODO: quantize to 2 places (half up), split whole and fraction, group the whole part 3 then 2s
    return str(amount)
`,
      tests: `from decimal import Decimal

assert format_inr(Decimal("125000.5")) == "₹1,25,000.50"
assert format_inr(Decimal("999")) == "₹999.00"
assert format_inr(Decimal("1000")) == "₹1,000.00"
assert format_inr(Decimal("100000")) == "₹1,00,000.00"
assert format_inr(Decimal("12345678.9")) == "₹1,23,45,678.90"
assert format_inr(Decimal("-1234567.891")) == "-₹12,34,567.89"
assert format_inr(Decimal("0")) == "₹0.00"
assert format_inr(Decimal("0.005")) == "₹0.01"
assert format_inr(Decimal("-0.001")) == "₹0.00"
assert format_inr(5) == "₹5.00"
assert format_inr("2500.456") == "₹2,500.46"`,
      solution: `from decimal import Decimal, ROUND_HALF_UP

def format_inr(amount):
    q = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    negative = q < 0
    whole, frac = f"{abs(q):.2f}".split(".")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        whole = ",".join(groups + [tail])
    return f"{'-' if negative else ''}₹{whole}.{frac}"
`,
      hint: 'Round first: `q = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)`. Take the sign from `q < 0` (so negative zero has no sign), then `f"{abs(q):.2f}".split(".")` gives the whole and fraction parts. Keep the last 3 digits as `tail`, and cut the rest from the right in pieces of 2 digits. Join all the groups with commas.',
    } },
    { pychallenge: {
      id: 'python-text-time-money-ch3',
      prompt: 'Write `fiscal_info(d)` for the April-March financial year. It returns a tuple `(label, quarter, month)`: the label like `"FY2025-26"` (the year the FY starts in, then the last two digits of the next year), the fiscal quarter 1 to 4 (April to June is 1) and the fiscal month 1 to 12 (April is 1, March is 12). `d` is a `date` or `datetime`.',
      starter: `def fiscal_info(d):
    # TODO: start year = d.year from April on, else d.year - 1; quarter and month from (d.month - 4) % 12
    return ("", 0, 0)
`,
      tests: `from datetime import date, datetime

assert fiscal_info(date(2026, 2, 15)) == ("FY2025-26", 4, 11)
assert fiscal_info(date(2026, 3, 31)) == ("FY2025-26", 4, 12)
assert fiscal_info(date(2026, 4, 1)) == ("FY2026-27", 1, 1)
assert fiscal_info(date(2025, 12, 15)) == ("FY2025-26", 3, 9)
assert fiscal_info(date(2025, 4, 30)) == ("FY2025-26", 1, 1)
assert fiscal_info(date(1999, 12, 31)) == ("FY1999-00", 3, 9)
assert fiscal_info(datetime(2026, 7, 1, 23, 59)) == ("FY2026-27", 2, 4)`,
      solution: `def fiscal_info(d):
    start = d.year if d.month >= 4 else d.year - 1
    label = f"FY{start}-{(start + 1) % 100:02d}"
    month = (d.month - 4) % 12 + 1
    quarter = (month - 1) // 3 + 1
    return (label, quarter, month)
`,
      hint: 'Fiscal month is `(d.month - 4) % 12 + 1`, which maps April to 1 and March to 12. The quarter is `(month - 1) // 3 + 1`. The start year is `d.year` when `d.month >= 4`, otherwise `d.year - 1`. Use `(start + 1) % 100` with `:02d` for the two-digit end year.',
    } },
    { pychallenge: {
      id: 'python-text-time-money-ch4',
      prompt: 'Write `parse_narration(text)` that returns a dict with the keys `invoice_no`, `gstin`, `date` and `amount`. `invoice_no` matches `INV/<digits>/<2 digits>-<2 digits>`; `gstin` is a 15-character GSTIN shape; `date` is written `dd-mm-yyyy` or `dd/mm/yyyy` and becomes a `date` object (an impossible date such as 31-04-2026 gives `None`); `amount` follows `Rs.`, `Rs`, `INR` or `₹` (spaces allowed), may contain Indian commas and decimals, and becomes a `Decimal` without commas. Anything not found is `None`. Use `re`.',
      starter: `import re
from datetime import date
from decimal import Decimal

def parse_narration(text):
    # TODO: one compiled pattern per field; search the text; convert date and amount
    return {"invoice_no": None, "gstin": None, "date": None, "amount": None}
`,
      tests: `from datetime import date
from decimal import Decimal

r = parse_narration("Paid INV/0042/25-26 to Nandi Electricals GSTIN 29AAHCN9902L1ZX on 12-09-2026 amount Rs. 1,25,000.50")
assert r == {"invoice_no": "INV/0042/25-26", "gstin": "29AAHCN9902L1ZX", "date": date(2026, 9, 12), "amount": Decimal("125000.50")}, r

r = parse_narration("NEFT to vendor on 05/10/2026 INR 4500")
assert r == {"invoice_no": None, "gstin": None, "date": date(2026, 10, 5), "amount": Decimal("4500")}, r

r = parse_narration("Reversal of INV/7/25-26 dated 31-04-2026 ₹ 99.5")
assert r == {"invoice_no": "INV/7/25-26", "gstin": None, "date": None, "amount": Decimal("99.5")}, r

assert parse_narration("nothing useful here") == {"invoice_no": None, "gstin": None, "date": None, "amount": None}`,
      solution: `import re
from datetime import date
from decimal import Decimal

INVOICE = re.compile(r"INV/\\d+/\\d{2}-\\d{2}")
GSTIN = re.compile(r"\\b\\d{2}[A-Z]{5}\\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\\b")
DATE = re.compile(r"\\b(\\d{2})[-/](\\d{2})[-/](\\d{4})\\b")
AMOUNT = re.compile(r"(?:Rs\\.?|INR|₹)\\s*(\\d[\\d,]*(?:\\.\\d+)?)")

def parse_narration(text):
    result = {"invoice_no": None, "gstin": None, "date": None, "amount": None}
    m = INVOICE.search(text)
    if m:
        result["invoice_no"] = m.group()
    m = GSTIN.search(text)
    if m:
        result["gstin"] = m.group()
    m = DATE.search(text)
    if m:
        day, month, year = (int(x) for x in m.groups())
        try:
            result["date"] = date(year, month, day)
        except ValueError:
            pass
    m = AMOUNT.search(text)
    if m:
        result["amount"] = Decimal(m.group(1).replace(",", ""))
    return result
`,
      hint: 'Make four compiled patterns. For the amount use `(?:Rs\\.?|INR|₹)\\s*(\\d[\\d,]*(?:\\.\\d+)?)` and read group 1. For the date capture three groups and build `date(year, month, day)` inside `try/except ValueError`. Use `search` and `m.group()` for the invoice number and the GSTIN. Start from a dict of four `None`s.',
    } },
    { real: 'These helpers are the quiet backbone of every finance pipeline. The **fiscal helper** is the single place that knows April to March, so your monthly, quarterly and YTD reports all agree. **`Decimal` plus `allocate`** is how you split an expense across cost centres or entities and still tie out to the paisa. **`format_inr`** is for the reports people read, while the stored numbers stay plain. **Regex** turns bank narrations and vendor sheets into clean fields and flags the rows that do not fit. **`uuid5` and hashes** give every invoice a stable id and tell you which rows changed since the last load, which is what makes re-runs safe.' },
    { interview: `**"Why not use float for money?"**
Model answer: "Floats are binary and cannot represent most decimal fractions exactly, so 0.1 + 0.2 is 0.30000000000000004. Small errors add up and totals stop reconciling. I use Decimal created from strings, round once with quantize and an explicit rounding mode, and for splits I work in integer paise so the parts add up exactly."

**"How do you handle time zones?"** "I store and compute in UTC with timezone-aware datetimes, and convert to a named zone such as Asia/Kolkata only to display or to decide a business date. Naive and aware datetimes cannot be compared, and a fixed offset ignores daylight saving, so I use \`zoneinfo\` names."

**"Explain \`match\`, \`search\` and \`fullmatch\`."** "\`match\` anchors at the start, \`search\` finds the pattern anywhere, and \`fullmatch\` requires the whole string to match. For validating a field such as a GSTIN I use \`fullmatch\`, because \`match\` would accept junk after a valid prefix."

**"How do you make a load idempotent?"** "I derive a deterministic key from the business key, for example a \`uuid5\` of the cleaned supplier GSTIN and invoice number, and upsert on it. A fingerprint of the row (a SHA-256 of the relevant columns) tells me whether anything changed, so a re-run updates or skips instead of duplicating."` },
    `## Recap
- **Regex:** raw strings, \`fullmatch\` to validate, \`search\` to extract, named groups, lazy \`.*?\`, \`sub\` to clean. A pattern checks the **shape** only. Keep patterns simple.
- **Dates:** parse with an explicit format, invalid dates raise \`ValueError\`, months need \`relativedelta\`, store **UTC** and convert with \`zoneinfo\` (\`import tzdata\` in the browser). Put the **April-March fiscal helper** in one function.
- **Money:** \`Decimal\` from **text**, \`quantize\` with \`ROUND_HALF_UP\` once at the end, split in **whole paise** with the largest-remainder rule, never mix currencies. Indian grouping is formatting only.
- **\`uuid5\`** from the cleaned business key gives a stable, repeatable id; **\`sha256\`** fingerprints rows and files (read files in chunks). Never use \`hash()\` or plain SHA-256 for these jobs or for passwords.`,
  ],
  quiz: [
    { q: 'A field must be exactly a GSTIN and nothing else. Which call validates it?', o: ['`pattern.fullmatch(value)`', '`pattern.match(value)`', '`pattern.search(value)`', '`pattern.findall(value)`'], a: 0, why: '`fullmatch` requires the whole text to fit the pattern. `match` checks only the start and `search` finds it anywhere, so both would accept extra junk.' },
    { q: 'What is the safest way to create a Decimal for 0.1 rupees?', o: ['`Decimal(0.1)`', '`Decimal(float("0.1"))`', '`Decimal(1) / 10.0`', '`Decimal("0.1")`'], a: 3, why: 'Building from text is exact. `Decimal(0.1)` starts from the float, which already carries the binary error.' },
    { q: 'A payment is made at 23:30 on 31 March in Mumbai. In Singapore (2 hours 30 minutes ahead) what is the date?', o: ['31 March, the same date everywhere', '1 April: the same instant is already the next day there', '30 March', 'it depends on daylight saving in India'], a: 1, why: '23:30 IST is 02:00 the next morning in Singapore. This is why you store UTC and decide which zone defines the booking date.' },
    { q: 'Which fiscal year, quarter and fiscal month does 15 February 2026 fall in (April to March year)?', o: ['FY2026-27, Q1, month 11', 'FY2025-26, Q1, month 2', 'FY2025-26, Q4, month 11', 'FY2026-27, Q4, month 2'], a: 2, why: 'February belongs to the year that started the previous April: FY2025-26. April is fiscal month 1, so February is month 11, which is in Q4 (January to March).' },
    { q: 'Why is `uuid.uuid5(NAMESPACE, cleaned_business_key)` useful in a load job?', o: ['it is faster than uuid4', 'it creates a secret that cannot be guessed', 'it encrypts the invoice number', 'the same business key always gives the same id, so a re-run updates the row instead of creating a duplicate'], a: 3, why: 'uuid5 is deterministic. That makes the key repeatable, which is what idempotent loads and upserts need. uuid4 is random and would differ on each run.' },
    { q: 'You split Decimal("100.00") into three equal parts by rounding each to two places. What is the problem, and what is the fix?', o: ['nothing: 33.33 three times is 100.00', 'the parts add up to 99.99; work in integer paise and give the leftover paisa to the largest remainder', 'Decimal cannot be divided by 3', 'use float because it divides exactly'], a: 1, why: 'Three rounded parts of 33.33 lose one paisa. In whole paise the leftover paisa is handed out, so 33.34 + 33.33 + 33.33 equals 100.00 exactly.' },
  ],
  task: {
    title: 'A finance helpers module with tests of your own',
    steps: [
      'In `C:\\fde\\py-recap` create `fin_helpers.py` with these functions: `fiscal_info(d)`, `month_end(d)`, `allocate(total, weights)`, `format_inr(amount)`, `parse_narration(text)` and `invoice_key(gstin, invoice_no)` (uuid5).',
      'Create `check_fin_helpers.py` with plain `assert` lines: at least five cases for each function, including edge cases (31 March and 1 April, a leap-year February, an odd-paisa split, a negative amount, a narration with no amount).',
      'Use the helpers on the data: read `fx_rates.csv` and `fact_gl.csv`, add a `fiscal_month` to each GL line, and print the number of GL lines per fiscal month (it should cover April 2025 to March 2026).',
      'Allocate the total of entity 1 debits across the four business units with the weights 40, 30, 20, 10 and check that the four parts add up exactly to the total.',
      'Print the first three GL amounts of entity 1 with `format_inr`. Then find the SGD rate for 2026-02-01 in `fx_rates.csv` and report that it is missing (the planted quirk).',
      'Hash `fact_gl.csv` with `sha256` in chunks and write the result to `fact_gl.sha256.txt`. Run the script twice: the value must be identical.',
    ],
    deliverable: '`fin_helpers.py`, `check_fin_helpers.py` (all asserts pass), the per-fiscal-month counts and `fact_gl.sha256.txt`.',
  },
};
