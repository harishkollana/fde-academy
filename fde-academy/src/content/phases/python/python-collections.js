export default {
  id: 'python-collections',
  title: 'Lists, tuples, dicts and sets',
  goal: 'You can pick the right container (list, tuple, dict, set), avoid mutability bugs, use a dict as a fast lookup table and a set for membership checks and de-duplication.',
  roadmap: ['lists, tuples, dicts, sets; when to use which'],
  blocks: [
    `## The problem
You have 1,227 GL lines, each with an \`account_id\`, and a master of 15 accounts. In Excel you would VLOOKUP the account name. In Python, the right *container* makes this one line, and instant.

A *container* is a value that holds other values. Python has four built-in ones, and choosing the right one is a daily skill:
- **list**: an ordered sequence you can change. "All GL lines from this file."
- **tuple**: an ordered sequence you cannot change. "One fixed record: (entity, month)."
- **dict**: key → value pairs. "Account code → account name."
- **set**: unique items with no order. "Every GSTIN we have already seen."`,
    { sketch: { w: 760, h: 380, caption: 'The four built-in containers and what each is good at', items: [
      { t: 'text', x: 200, y: 26, text: 'list [ ]  ordered, can change', bold: true },
      { t: 'table', x: 30, y: 50, cols: ['0', '1', '2', '3'], colW: [85, 85, 85, 85], rows: [['"JV-01"', '"JV-02"', '"JV-03"', '"JV-02"']] },
      { t: 'text', x: 200, y: 128, text: 'duplicates allowed · append() adds at the end', size: 14, color: '#5c6478' },
      { t: 'text', x: 590, y: 26, text: 'tuple ( )  fixed record', bold: true },
      { t: 'table', x: 480, y: 50, cols: ['0', '1'], colW: [100, 120], rows: [['"IN01"', '"2026-09"']], fill: 'grey' },
      { t: 'text', x: 590, y: 128, text: 'locked: cannot change after creation', size: 14, color: '#5c6478' },
      { t: 'text', x: 170, y: 186, text: 'dict { key: value }  lookup', bold: true },
      { t: 'table', x: 30, y: 210, cols: ['key', 'value'], colW: [100, 140], rows: [['"6110"', '"Salaries"'], ['"6200"', '"Rent"'], ['"6300"', '"Travel"']], hl: [1], fill: 'green' },
      { t: 'note', x: 295, y: 235, w: 150, h: 70, text: 'master["6200"]\n→ "Rent"\n(instant)' },
      { t: 'text', x: 620, y: 186, text: 'set { }  unique, no order', bold: true },
      { t: 'circle', x: 620, y: 285, r: 78, label: '29AAHCN…\n37AABCG…\n37AAFCV…', fill: 'yellow' },
      { t: 'arrow', x1: 470, y1: 345, x2: 548, y2: 320, label: 'add a duplicate:\nignored', lx: -40, ly: 22 },
    ] } },
    `## Lists
A *list* keeps items in order, allows duplicates and can grow or shrink. Positions (*indexes*) start at 0, and negative indexes count from the end.
\`\`\`python
journals = ["JV202509-0001", "JV202509-0002"]
journals.append("JV202509-0003")       # add one item at the end
journals.extend(["JV-A", "JV-B"])      # add several items
journals.insert(0, "JV-FIRST")         # add at a position
journals.remove("JV-A")                # remove by value (first match)
last = journals.pop()                  # remove and return the last item
journals[0], journals[-1]              # first and last
journals[1:3]                          # slice: items 1 and 2
len(journals), "JV-B" in journals      # size, membership
\`\`\`
**\`sort()\` vs \`sorted()\`**: \`amounts.sort()\` changes the list *in place* and returns \`None\`. \`sorted(amounts)\` returns a **new** sorted list and leaves the original alone. A classic bug is \`amounts = amounts.sort()\`, which sets \`amounts\` to \`None\`.`,
    { py: {
      title: 'List basics',
      starter: `amounts = [130833.18, 64788.72, 98500.0, 64788.72, 5200.5]
print(len(amounts), sum(amounts), min(amounts), max(amounts))
print(amounts.count(64788.72), "copies of 64788.72")   # duplicates are allowed
print(amounts.index(98500.0))                         # position of a value

top = sorted(amounts, reverse=True)    # new list, original untouched
print("sorted copy:", top[:3])
print("original   :", amounts)

amounts.sort()                         # in place, returns None
print("after sort :", amounts)

result = amounts.sort()
print("amounts.sort() returned:", result)

amounts.append(1000.0)
amounts.pop(0)
amounts`,
    } },
    `## Tuples
A *tuple* is a list that is locked: once created, you cannot add, remove or change items. Use it for a small fixed record where each **position has a meaning**: \`("IN01", "2026-09")\` is (entity, month); \`(debit, credit)\` is a pair of amounts.
\`\`\`python
key = ("IN01", "2026-09")      # packing
entity, month = key            # unpacking: entity='IN01', month='2026-09'
single = ("IN01",)             # one-item tuple needs the trailing comma
\`\`\`
When a function "returns two values", it really returns one tuple. And because tuples cannot change, they can be **dict keys** and **set members**. Lists cannot.

## Mutability: variables are name tags
A variable is a *name tag* stuck on an object, not a box with its own copy. \`b = a\` puts a second tag on the **same** list. Change the list through \`b\` and \`a\` sees the change too. Types that can change in place (list, dict, set) are *mutable*; types that cannot (int, float, str, bool, None, tuple) are *immutable*, so sharing them is always safe.`,
    { sketch: { w: 760, h: 250, caption: 'b = a shares one list; a.copy() makes a second, independent list', items: [
      { t: 'box', x: 40, y: 40, w: 70, h: 40, label: 'a', fill: 'yellow' },
      { t: 'box', x: 40, y: 110, w: 70, h: 40, label: 'b', fill: 'yellow' },
      { t: 'box', x: 40, y: 180, w: 70, h: 40, label: 'c', fill: 'yellow' },
      { t: 'table', x: 260, y: 70, cols: ['list object #1'], colW: [220], rows: [['[100, 200, 300]']], fill: 'blue' },
      { t: 'table', x: 260, y: 170, cols: ['list object #2'], colW: [220], rows: [['[100, 200]']], fill: 'green' },
      { t: 'arrow', x1: 115, y1: 60, x2: 255, y2: 95, label: 'a = [100, 200]', ly: -14 },
      { t: 'arrow', x1: 115, y1: 130, x2: 255, y2: 105, label: 'b = a', ly: 18 },
      { t: 'arrow', x1: 115, y1: 200, x2: 255, y2: 200, label: 'c = a.copy()', ly: 18 },
      { t: 'note', x: 530, y: 60, w: 200, h: 80, text: 'b.append(300)\nchanges the ONE list\nthat a and b share' },
      { t: 'note', x: 530, y: 165, w: 200, h: 60, text: 'c is a separate list:\nnot affected', fill: 'green' },
    ] } },
    { py: {
      title: 'Aliasing and copies',
      starter: `a = [100, 200]
b = a              # same list, two names
c = a.copy()       # a new list with the same items
b.append(300)
print("a:", a)
print("b:", b)
print("c:", c)
print(a is b, a is c)   # 'is' asks: the same object?

# Shallow copy trap with nested lists
batches = [["JV-1", "JV-2"], ["JV-3"]]
shallow = batches.copy()
shallow[0].append("JV-99")      # the inner list is still shared!
print("batches:", batches)

import copy
deep = copy.deepcopy(batches)
deep[0].append("JV-100")
print("after deepcopy change:", batches)`,
      note: '`copy()`, `list(a)` and `a[:]` make *shallow* copies: the outer list is new but inner lists are shared. Use `copy.deepcopy` for nested data.',
    } },
    `## Dicts: the hash map
A *dict* stores **key → value** pairs. You look things up by key, not by position.
\`\`\`python
master = {"6110": "Salaries", "6200": "Rent"}
master["6300"] = "Travel"            # add (or overwrite)
master["6200"]                       # 'Rent' (KeyError if the key is missing)
master.get("9999", "UNKNOWN")        # safe lookup with a default
"6110" in master                     # checks KEYS, not values
for code, name in master.items():    # loop over pairs
    print(code, name)
master.keys(), master.values()
master.pop("6300")                   # remove a key and return its value
master.update({"6400": "Software"})  # add or overwrite several keys
\`\`\`
**Why a dict lookup is instant.** A dict is a *hash map*. Python turns each key into a number called its *hash*, and that number points almost directly to where the value is stored. Finding one key among 15 or among 15 million takes about the same time. A list must be scanned item by item. It is the difference between VLOOKUP scanning a whole sheet and jumping straight to the right row.

Rules worth knowing:
- Keys must be immutable (*hashable*): \`str\`, \`int\`, \`tuple\`. Values can be anything, even lists and other dicts.
- Dicts remember insertion order (since Python 3.7).
- Counting pattern: \`counts[k] = counts.get(k, 0) + 1\`.
- Grouping pattern: \`groups.setdefault(k, []).append(item)\`.`,
    { py: {
      title: 'Account master as a dict (replaces VLOOKUP)',
      starter: `import csv, time

# csv.DictReader gives each row as a dict of strings (full details in the Files lesson)
with open("dim_account.csv", newline="") as f:
    master = {row["account_id"]: row["account_name"] for row in csv.DictReader(f)}
print(len(master), "accounts. 6110 ->", master["6110"])

with open("fact_gl.csv", newline="") as f:
    lines = list(csv.DictReader(f))
print(len(lines), "GL lines. First:", lines[0])

# total debit per account NAME using the counting/grouping pattern
debit_by_name = {}
for line in lines:
    name = master.get(line["account_id"], "UNKNOWN")
    debit_by_name[name] = debit_by_name.get(name, 0) + float(line["debit"])
for name, total in sorted(debit_by_name.items()):
    print(f"{name:<14}{total:>18,.2f}")

# Why dicts: membership test speed on 20,000 codes
codes_list = [str(i) for i in range(20000)]
codes_dict = dict.fromkeys(codes_list)
t = time.perf_counter(); hits = sum(str(i * 37) in codes_list for i in range(500)); t_list = time.perf_counter() - t
t = time.perf_counter(); hits = sum(str(i * 37) in codes_dict for i in range(500)); t_dict = time.perf_counter() - t
print(f"list scan: {t_list * 1000:.1f} ms   dict lookup: {t_dict * 1000:.3f} ms")`,
      note: 'The list scan is hundreds of times slower, and the gap grows with the data. That is why every lookup in your automations should go through a dict (or a pandas merge).',
    } },
    `## Sets
A *set* holds **unique** items with no order and no index. Adding an item that is already there does nothing. Membership tests (\`x in s\`) are instant, like dict keys.
\`\`\`python
seen = {"29AAHCN9902L1ZX", "37AABCG4471E1Z1"}
seen.add("29AAHCN9902L1ZX")      # already there: nothing happens
unique = set(list_with_dupes)    # de-duplicate in one step
empty = set()                    # NOT {} (that is an empty dict)

books & supplier     # in both            (intersection)
books - supplier     # only in books      (difference)
supplier - books     # only in supplier   (difference)
books | supplier     # in either          (union)
books ^ supplier     # in exactly one     (symmetric difference)
\`\`\`
Set maths is a reconciliation engine in one line. Here is the purchase register against the supplier (GSTR-2B style) data from the practice set, compared on invoice number:`,
    { sketch: { w: 760, h: 300, caption: 'Invoice numbers: our books vs supplier data, as two sets', items: [
      { t: 'circle', x: 300, y: 160, r: 120, fill: 'blue' },
      { t: 'circle', x: 460, y: 160, r: 120, fill: 'yellow' },
      { t: 'text', x: 250, y: 22, text: 'books = purchase_register (30)', bold: true, size: 16 },
      { t: 'text', x: 540, y: 22, text: 'supplier_invoices (29)', bold: true, size: 16 },
      { t: 'text', x: 235, y: 150, text: 'books - supplier', size: 15 },
      { t: 'text', x: 235, y: 180, text: '5', size: 30, bold: true },
      { t: 'text', x: 380, y: 150, text: 'books & supplier', size: 15 },
      { t: 'text', x: 380, y: 180, text: '25', size: 30, bold: true },
      { t: 'text', x: 525, y: 150, text: 'supplier - books', size: 15 },
      { t: 'text', x: 525, y: 180, text: '4', size: 30, bold: true },
      { t: 'note', x: 600, y: 225, w: 150, h: 64, text: '2 of these are\n"INV-0689" typos' },
    ] } },
    { py: {
      title: 'Reconcile with sets',
      starter: `import csv

def invoice_numbers(path):
    with open(path, newline="") as f:
        return {row["invoice_no"].strip().upper() for row in csv.DictReader(f)}

books = invoice_numbers("purchase_register.csv")
supplier = invoice_numbers("supplier_invoices.csv")

print("matched          :", len(books & supplier))
print("only in books    :", sorted(books - supplier))
print("only in supplier :", sorted(supplier - books))

# Normalise the typo 'INV-0689/25-26' -> 'INV/0689/25-26' and compare again
def norm(inv):
    return "INV/" + inv[4:] if inv.startswith("INV-") else inv

books_n = {norm(i) for i in books}
supplier_n = {norm(i) for i in supplier}
print("after normalising:", len(books_n & supplier_n), "matched,",
      len(books_n - supplier_n), "only in books,", len(supplier_n - books_n), "only in supplier")`,
      note: 'Matching on invoice number alone is only the first pass. The full reconciliation (GSTIN, amounts with tolerance, fuzzy typos) comes in Project B.',
    } },
    `## When to use which
| You need… | Use | Why |
|---|---|---|
| an ordered collection you will add to | list | keeps order, allows duplicates |
| a small fixed record, or a key made of several parts | tuple | immutable, so it can be a dict key |
| lookup by a key (code → name, GSTIN → vendor) | dict | instant lookup by key |
| uniqueness, or "have I seen this before?" | set | instant membership, automatic de-duplication |
| a count or total per key | dict | key → running number |
| rows of a table | list of dicts | each row maps column name → value (pandas comes later) |`,
    { warn: `Four bugs you will meet:
- \`{}\` is an empty **dict**. An empty set is \`set()\`.
- \`x in big_list\` scans the whole list. Inside a loop over thousands of rows, convert the list to a set first.
- Removing items from a list while looping over the same list skips items. Build a new list instead.
- \`{["IN01", "2026-09"]: 5}\` raises \`TypeError: unhashable type: 'list'\`. Use a tuple key: \`{("IN01", "2026-09"): 5}\`.` },
    { pychallenge: {
      id: 'python-collections-ch1',
      prompt: 'Write `total_by_account(lines, master)`. `lines` is a list of `(account_code, amount)` tuples and `master` is a dict `code → name`. Return a dict `name → total amount`. Codes missing from the master go under the name `"UNKNOWN"`.',
      starter: `def total_by_account(lines, master):
    totals = {}
    # TODO: look up each code in master (default "UNKNOWN") and add the amount
    return totals
`,
      tests: `master = {"6110": "Salaries", "6200": "Rent"}
lines = [("6110", 1000.0), ("6200", 500.0), ("6110", 250.0), ("9999", 75.0)]
assert total_by_account(lines, master) == {"Salaries": 1250.0, "Rent": 500.0, "UNKNOWN": 75.0}, total_by_account(lines, master)
assert total_by_account([], master) == {}
assert total_by_account([("1", 5.0), ("2", 5.0)], {}) == {"UNKNOWN": 10.0}`,
      solution: `def total_by_account(lines, master):
    totals = {}
    for code, amount in lines:
        name = master.get(code, "UNKNOWN")
        totals[name] = totals.get(name, 0) + amount
    return totals
`,
      hint: 'Loop with `for code, amount in lines:`, find the name with `master.get(code, "UNKNOWN")`, then use the counting pattern `totals[name] = totals.get(name, 0) + amount`.',
    } },
    { pychallenge: {
      id: 'python-collections-ch2',
      prompt: 'Write `reconcile(books, supplier)`. Both arguments are lists of invoice numbers that may contain duplicates, extra spaces and lowercase. Clean each value with `.strip().upper()`, then return a dict with keys `"matched"`, `"only_in_books"` and `"only_in_supplier"`, each a **sorted list** with no duplicates.',
      starter: `def reconcile(books, supplier):
    # TODO: clean values, build two sets, use set maths
    return {"matched": [], "only_in_books": [], "only_in_supplier": []}
`,
      tests: `r = reconcile(["INV/1", "inv/2 ", "INV/3", "INV/3"], [" INV/2", "INV/4", "INV/4"])
assert r == {"matched": ["INV/2"], "only_in_books": ["INV/1", "INV/3"], "only_in_supplier": ["INV/4"]}, r
r2 = reconcile([], ["A"])
assert r2 == {"matched": [], "only_in_books": [], "only_in_supplier": ["A"]}, r2`,
      solution: `def reconcile(books, supplier):
    b = {x.strip().upper() for x in books}
    s = {x.strip().upper() for x in supplier}
    return {
        "matched": sorted(b & s),
        "only_in_books": sorted(b - s),
        "only_in_supplier": sorted(s - b),
    }
`,
      hint: 'Build the sets with a loop or `{x.strip().upper() for x in books}`. Then `sorted(b & s)`, `sorted(b - s)`, `sorted(s - b)`.',
    } },
    { pychallenge: {
      id: 'python-collections-ch3',
      prompt: 'Two employees paid into one bank account is a classic payroll fraud flag. Write `shared_accounts(pairs)` where `pairs` is a list of `(emp_id, bank_account)` tuples. Return a dict `bank_account → sorted list of emp_ids`, containing **only** accounts used by more than one employee.',
      starter: `def shared_accounts(pairs):
    # TODO: group emp_ids by bank_account, keep groups with 2+ employees
    return {}
`,
      tests: `pairs = [(4, "47860558007"), (12, "47860558007"), (1, "18163244337"), (9, "999"), (7, "999"), (3, "999")]
assert shared_accounts(pairs) == {"47860558007": [4, 12], "999": [3, 7, 9]}, shared_accounts(pairs)
assert shared_accounts([(1, "a"), (2, "b")]) == {}`,
      solution: `def shared_accounts(pairs):
    groups = {}
    for emp_id, account in pairs:
        groups.setdefault(account, []).append(emp_id)
    return {acc: sorted(ids) for acc, ids in groups.items() if len(ids) > 1}
`,
      hint: 'Group first with `groups.setdefault(account, []).append(emp_id)`. Then keep only the groups where `len(ids) > 1`, sorting each list.',
    } },
    { real: 'Every lookup you did with VLOOKUP or XLOOKUP becomes a dict: account code → name, GSTIN → vendor, IFSC prefix → bank, emp_id → manager. Every "have we processed this already?" check becomes a set: processed file names, journal IDs already loaded, invoice numbers already paid. Build the dict or set **once** before the loop, then look up inside the loop.' },
    { interview: `**"List vs tuple?"** "A list is mutable and is for a collection that grows, like rows read from a file. A tuple is immutable and is for a fixed record where position has meaning, like (entity, month). Because a tuple is hashable it can be a dict key or a set member."

**"Why is dict lookup O(1)?"** "A dict is a hash table. The key's hash points to a slot, so lookup cost does not grow with the size of the dict, on average. A list membership test is O(n) because it scans."

**"Remove duplicates but keep the original order?"** "\`list(dict.fromkeys(items))\`. A set would remove duplicates but lose the order."` },
    `## Recap
- **list** = ordered and changeable; **tuple** = ordered and locked (good dict keys); **dict** = key → value lookup; **set** = unique items with instant membership.
- \`sort()\` changes a list in place and returns \`None\`; \`sorted()\` returns a new list.
- Variables are name tags: \`b = a\` shares one list. Use \`.copy()\` (shallow) or \`copy.deepcopy\` (nested).
- Dicts are hash maps: the counting (\`get(k, 0) + 1\`) and grouping (\`setdefault(k, [])\`) patterns cover most aggregation jobs.
- Set maths (\`&\`, \`-\`, \`|\`, \`^\`) is a quick reconciliation between two sources.`,
  ],
  quiz: [
    { q: 'You need to look up a vendor name from a GSTIN for 50,000 invoices. Which container fits best?', o: ['a list of GSTINs', 'a dict GSTIN → vendor name', 'a tuple of names', 'a set of vendor names'], a: 1, why: 'A dict gives instant lookup by key. A list would be scanned 50,000 times.' },
    { q: '`a = [1, 2]`, `b = a`, `b.append(3)`. What does `print(a)` show?', o: ['`[1, 2]`', '`[3]`', '`[1, 2, 3]`', 'an error'], a: 2, why: '`b = a` makes a second name for the same list, so the change is visible through both names.' },
    { q: 'What is the value of `amounts` after `amounts = amounts.sort()`?', o: ['the sorted list', 'the original list', '`None`', 'an empty list'], a: 2, why: '`list.sort()` sorts in place and returns `None`, which is then assigned to `amounts`. Use `sorted(amounts)` for a new list.' },
    { q: 'What does `{}` create?', o: ['an empty dict', 'an empty set', 'an empty tuple', 'a syntax error'], a: 0, why: 'Curly braces with nothing inside create a dict. An empty set must be written `set()`.' },
    { q: 'Why does `{["IN01", "2026-09"]: 100}` fail while `{("IN01", "2026-09"): 100}` works?', o: ['lists cannot hold strings', 'lists are mutable, so they are not hashable and cannot be keys', 'tuples are faster to type', 'dict keys must be numbers'], a: 1, why: 'Dict keys must be hashable (immutable). A tuple is, a list is not.' },
    { q: '`books` and `supplier` are sets of invoice numbers. Which expression gives invoices recorded in our books but missing from the supplier data?', o: ['`books & supplier`', '`supplier - books`', '`books | supplier`', '`books - supplier`'], a: 3, why: 'Difference `books - supplier` keeps items in books that are not in supplier.' },
  ],
  task: {
    title: 'Build a lookup-and-reconcile script on your laptop',
    steps: [
      'In `C:\\fde\\py-recap` create `collections_practice.py`.',
      'Type a dict `account_master` with 6 accounts (6110 Salaries, 6120 Bonus, 6200 Rent, 6300 Travel, 6400 Software, 4100 Product Revenue).',
      'Type a list of 10 `(account_code, amount)` tuples, including one unknown code, and print the totals per account name using your `total_by_account` function.',
      'Type two lists of 8 invoice numbers each (with a duplicate, a lowercase value and one typo) and print the result of your `reconcile` function.',
      'Run it with `py collections_practice.py` and add a comment at the top explaining why you used a dict and a set.',
    ],
    deliverable: '`collections_practice.py` and its printed output.',
  },
};
