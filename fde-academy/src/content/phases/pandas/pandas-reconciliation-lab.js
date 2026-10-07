export default {
  id: 'pandas-reconciliation-lab',
  title: 'Lab: GST reconciliation in pandas',
  goal: 'You can build a complete multi-pass reconciliation in pandas: exact match, amount statuses with a tolerance, matching after cleaning the keys, a guarded fuzzy pass, one status per record, a bridge that ties to the control gap, and exception lists a person can act on.',
  roadmap: ['reconciliation in pandas', 'exact, tolerance and fuzzy matching', 'GST data'],
  blocks: [
    `## The brief
It is the middle of the month and the GST return must be filed. Your books (the **purchase register**) and the file the suppliers have filed (the **supplier file**, in the style of GSTR-2B) should agree, invoice by invoice. They never do. Your manager wants three things: **how big is the difference**, **why**, and **a list for each team** of what to chase: invoices missing at the supplier, invoices missing in our books, and pairs that need a person to look.

You did exactly this in SQL in the SQL phase. This lab does it in pandas, for the same two files, and **your result must agree with the SQL one**: 30 invoices against 29, a GST gap of 45,415.88, and the statuses 13 / 6 / 4 / 4 / 3 / 2. It uses everything from this phase: merge with \`validate\` and \`indicator\` (combine), cleaned keys (dates and text), tolerance and rounding (cleaning), group totals (groupby), checks that return failing rows (validation) and an Excel output (Excel lesson).

The rules of the game come **before** the code. Write them down, because a reconciliation is only as good as its rules:
1. **Every invoice, on either side, ends with exactly one status.**
2. **A record is matched at most once.** (Two invoices with the same key do not both match the same partner.)
3. **Passes run from strict to loose, and each pass sees only what the earlier passes left.** A looser rule can then never steal a record from a better match.
4. **Probable matches** (after cleaning, fuzzy) keep **their own status**, so a person can review them.
5. **The bridge adds up to the control gap**, rupee by rupee.`,
    { sketch: { w: 760, h: 384, caption: 'The passes of the reconciliation on the Kollana data: each pass takes only what the earlier ones left, and the exceptions are the only rows a person has to look at', items: [
      { t: 'box', x: 14, y: 12, w: 330, h: 44, fill: 'grey', label: 'start: books 30, supplier file 29', size: 15 },
      { t: 'text', x: 370, y: 34, text: 'control gap: GST 45,415.88 (this must be explained)', size: 14, anchor: 'start' },
      { t: 'arrow', x1: 179, y1: 58, x2: 179, y2: 72 },
      { t: 'box', x: 14, y: 74, w: 330, h: 44, fill: 'green', label: 'pass 1: exact (GSTIN + invoice no)', size: 15 },
      { t: 'text', x: 370, y: 96, text: '23 pairs: 13 identical, 6 within ₹1, 4 differ  ->  left 7 | 6', size: 14, anchor: 'start' },
      { t: 'arrow', x1: 179, y1: 120, x2: 179, y2: 134 },
      { t: 'box', x: 14, y: 136, w: 330, h: 44, fill: 'yellow', label: 'pass 2: cleaned invoice no + GSTIN', size: 15 },
      { t: 'text', x: 370, y: 158, text: '2 pairs (a dash instead of a slash)  ->  left 5 | 4', size: 14, anchor: 'start' },
      { t: 'arrow', x1: 179, y1: 182, x2: 179, y2: 196 },
      { t: 'box', x: 14, y: 198, w: 330, h: 44, fill: 'yellow', label: 'pass 3: cleaned invoice no + taxable value', size: 15 },
      { t: 'text', x: 370, y: 220, text: '2 pairs (GSTIN typo in the last character)  ->  left 3 | 2', size: 14, anchor: 'start' },
      { t: 'arrow', x1: 179, y1: 244, x2: 179, y2: 258 },
      { t: 'box', x: 14, y: 260, w: 330, h: 44, fill: 'orange', label: 'pass 4: fuzzy (GSTIN + amount + similar)', size: 15 },
      { t: 'text', x: 370, y: 282, text: '0 pairs: nothing is similar enough  ->  left 3 | 2', size: 14, anchor: 'start' },
      { t: 'arrow', x1: 179, y1: 306, x2: 179, y2: 320 },
      { t: 'box', x: 14, y: 322, w: 330, h: 44, fill: 'red', label: 'exceptions for a person', size: 15 },
      { t: 'text', x: 370, y: 344, text: '3 only in the books, 2 only in the supplier file', size: 14, anchor: 'start' },
    ] } },
    `## Step 1: control totals and clean keys
Start with the **control totals**: the number of invoices and the GST on each side. The gap between them is the number you must be able to explain at the end. Then write the one function that normalises an invoice number, and use it on **both** sides, because a key that is cleaned on one side only matches nothing.`,
    { py: {
      title: 'Step 1: control totals, the fan-out warning and one cleaning function for both sides',
      starter: `import pandas as pd
pd.set_option("display.width", 120)

books = pd.read_csv("purchase_register.csv")        # our books: what we recorded
supplier = pd.read_csv("supplier_invoices.csv")      # what the suppliers filed (GSTR-2B style)

# 1) control totals FIRST: the gap you must be able to explain, rupee by rupee
b_gst, s_gst = books["gst_amount"].sum(), supplier["gst_amount"].sum()
print(f"books   : {len(books)} invoices, GST {b_gst:,.2f}")
print(f"supplier: {len(supplier)} invoices, GST {s_gst:,.2f}")
print(f"control gap (books - supplier): {b_gst - s_gst:,.2f}")

# 2) a partial key fans out: a supplier files many invoices
print("rows when joining on GSTIN alone        :", len(books.merge(supplier, on="supplier_gstin")))
print("rows when joining on GSTIN + invoice_no :", len(books.merge(supplier, on=["supplier_gstin", "invoice_no"])))

# 3) the rules of the game, written down before any code
for rule in ["every record ends with exactly ONE status",
             "a record is matched at most once",
             "passes run strict to loose, each on what the earlier passes left",
             "probable matches keep their own status",
             "the bridge adds up to the control gap"]:
    print(" -", rule)

# 4) one normalising function, used on BOTH sides
def clean_key(s):
    return s.str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)       # INV-0689/25-26 -> INV06892526

books["key"] = clean_key(books["invoice_no"])
supplier["key"] = clean_key(supplier["invoice_no"])
print(supplier.loc[supplier["invoice_no"].str.startswith("INV-"), ["invoice_no", "key"]])
print(books.loc[books["invoice_no"] == "INV/0689/25-26", ["invoice_no", "key"]])`,
      note: 'The books hold 30 invoices with GST of 533,646.23, the supplier file 29 invoices with 488,230.35: the gap is 45,415.88, the same target as in the SQL lesson. A join on the GSTIN alone gives 156 rows (fan-out); with the invoice number too, 23. And `INV/0689/25-26` (books) and `INV-0689/25-26` (supplier) both clean to `INV06892526`.',
    } },
    `## Step 2: pass 1, the exact key, and the amount status
The first pass pairs invoices that agree on the **complete key**: GSTIN and invoice number. The function \`match_pass\` is the heart of the lab, so read it slowly. Two rows with the same key must not both match the same partner. The trick: number the occurrences of each key with \`cumcount\` (0, 1, 2 …) and merge on the key **plus that number**. The 1st occurrence pairs with the 1st, the 2nd with the 2nd, and a surplus row finds no partner.

For every pair then comes the **amount status**, from the difference of the GST amounts (books minus supplier): **identical** (0), **within tolerance** (not 0 but at most ₹1.00, which absorbs rounding) or **amount differs** (more). Round the difference to 2 decimals before you compare, or float noise (\`0.4000000000001\`) will turn rounding pairs into mismatches. The tolerance is a **decision**, so it is a parameter, and it is printed in the output.`,
    { py: {
      title: 'Step 2: match_pass, pass 1 and the amount statuses',
      starter: `import numpy as np
import pandas as pd
pd.set_option("display.width", 120)

books = pd.read_csv("purchase_register.csv").rename(columns={"pr_id": "id"})
supplier = pd.read_csv("supplier_invoices.csv").rename(columns={"si_id": "id"})
TOLERANCE = 1.00

def match_pass(left, right, keys):
    """Pair rows that agree on every key column. Each row is used at most once:
    when a key repeats, the 1st occurrence pairs with the 1st, the 2nd with the 2nd, and so on."""
    l = left[["id", *keys]].copy()
    r = right[["id", *keys]].copy()
    l["_n"] = l.groupby(keys).cumcount()
    r["_n"] = r.groupby(keys).cumcount()
    pairs = l.merge(r, on=[*keys, "_n"], suffixes=("_books", "_supplier"))
    return pairs[["id_books", "id_supplier"]]

def amount_status(diff, tolerance):
    d = diff.round(2).abs()                      # round first: 0.4000000000001 must count as 0.40
    labels = np.select([d == 0, d <= tolerance], ["identical", "within tolerance"], default="amount differs")
    return pd.Series(labels, index=diff.index)

pass1 = match_pass(books, supplier, ["supplier_gstin", "invoice_no"])
print("pass 1 (GSTIN + invoice no):", len(pass1), "pairs")

pass1["gst_books"] = books.set_index("id").loc[pass1["id_books"], "gst_amount"].to_numpy()
pass1["gst_supplier"] = supplier.set_index("id").loc[pass1["id_supplier"], "gst_amount"].to_numpy()
pass1["diff"] = (pass1["gst_books"] - pass1["gst_supplier"]).round(2)
pass1["status"] = amount_status(pass1["diff"], TOLERANCE)
print(pass1["status"].value_counts().to_dict())
print(pass1.groupby("status")["diff"].agg(["count", "sum"]).round(2))
print(pass1[pass1["status"] == "amount differs"][["id_books", "id_supplier", "gst_books", "gst_supplier", "diff"]])

# the tolerance is a decision: tighten it and the six rounding pairs change status
print("tolerance 0.30 ->", amount_status(pass1["diff"], 0.30).value_counts().to_dict())

# a repeated key must not match twice: two books rows, one supplier row
l = pd.DataFrame({"id": [1, 2], "k": ["A", "A"]})
r = pd.DataFrame({"id": [7], "k": ["A"]})
print(match_pass(l, r, ["k"]).to_dict("records"), "<- row 1 pairs, row 2 stays unmatched")`,
      note: 'Pass 1 finds 23 pairs: 13 identical, 6 within tolerance (the books are 0.40 higher each, 2.40 in total) and 4 where the GST differs by exactly 100.00 (400.00 in total). With a tolerance of 0.30 the six rounding pairs would become "amount differs": this is why the tolerance is printed with the result.',
    } },
    `## Step 3: pass 2 and pass 3, matching after cleaning
Seven books invoices and six supplier invoices are left. Many are the **same invoice with a typo in the key**: it shows up twice, once on each side, and a full join on the exact key would list it as two separate exceptions. So the next passes use **cleaned keys**:
- **Pass 2**: cleaned invoice number **and** GSTIN. It catches the supplier who typed a dash for a slash.
- **Pass 3**: cleaned invoice number **and** taxable value, **without** the GSTIN. It catches a wrong character in the GSTIN, because an invoice number and an exact taxable amount are very unlikely to agree by accident.

Both passes give the status **matched after cleaning**, not "identical". They are *probable* matches, and keeping them apart lets a person check each one before the pair is accepted. Never merge them silently into the exact matches.`,
    { py: {
      title: 'Step 3: the second and third pass, and what they found',
      starter: `import pandas as pd
pd.set_option("display.width", 130)

def clean_key(s):
    return s.str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)

def match_pass(left, right, keys):
    l = left[["id", *keys]].copy()
    r = right[["id", *keys]].copy()
    l["_n"] = l.groupby(keys).cumcount()
    r["_n"] = r.groupby(keys).cumcount()
    pairs = l.merge(r, on=[*keys, "_n"], suffixes=("_books", "_supplier"))
    return pairs[["id_books", "id_supplier"]]

def run_pass(rest_b, rest_s, keys, label):
    """One pass: pair what it can, then remove the paired rows from what is left."""
    pairs = match_pass(rest_b, rest_s, keys).assign(pass_name=label)
    rest_b = rest_b[~rest_b["id"].isin(pairs["id_books"])]
    rest_s = rest_s[~rest_s["id"].isin(pairs["id_supplier"])]
    return pairs, rest_b, rest_s

books = pd.read_csv("purchase_register.csv").rename(columns={"pr_id": "id"})
supplier = pd.read_csv("supplier_invoices.csv").rename(columns={"si_id": "id"})
books["key"], supplier["key"] = clean_key(books["invoice_no"]), clean_key(supplier["invoice_no"])

p1, rest_b, rest_s = run_pass(books, supplier, ["supplier_gstin", "invoice_no"], "1 exact")
print(f"pass 1: {len(p1)} pairs | left {len(rest_b)} books, {len(rest_s)} supplier")
p2, rest_b, rest_s = run_pass(rest_b, rest_s, ["supplier_gstin", "key"], "2 cleaned invoice no + GSTIN")
print(f"pass 2: {len(p2)} pairs | left {len(rest_b)} books, {len(rest_s)} supplier")
p3, rest_b, rest_s = run_pass(rest_b, rest_s, ["key", "taxable_value"], "3 cleaned invoice no + taxable value")
print(f"pass 3: {len(p3)} pairs | left {len(rest_b)} books, {len(rest_s)} supplier")

# what the two passes found: print both sides of every pair, so a person can check them
both = pd.concat([p2, p3], ignore_index=True)
b_side = books[["id", "invoice_no", "supplier_gstin"]].add_suffix("_books")           # id_books, invoice_no_books, ...
s_side = supplier[["id", "invoice_no", "supplier_gstin"]].add_suffix("_supplier")     # id_supplier, invoice_no_supplier, ...
look = both.merge(b_side, on="id_books").merge(s_side, on="id_supplier")
print(look[["pass_name", "invoice_no_books", "invoice_no_supplier", "supplier_gstin_books", "supplier_gstin_supplier"]].to_string(index=False))

print("still unmatched in the books   :", rest_b["id"].tolist())
print("still unmatched in the supplier:", rest_s["id"].tolist())`,
      note: 'Pass 2 finds the two invoices where the supplier wrote `INV-0689` and `INV-8812` instead of `INV/...`. Pass 3 finds two where the last character of the GSTIN differs (`1ZX` in the books, `1ZZ` at the supplier). That leaves 3 books invoices and 2 supplier invoices that nothing has matched.',
    } },
    `## Step 4: the fuzzy pass, and why it needs guards
The last resort is a **fuzzy** match: invoice numbers that are *similar*, not equal (a swapped pair of digits, a lost character). The standard library has \`difflib.SequenceMatcher(None, a, b).ratio()\`, a similarity from 0 to 1 (\`rapidfuzz\` is faster on a big job and is installed on your laptop; the idea is the same).

Look at the picture first. **A similarity score alone is dangerous** on invoice numbers, because they all look alike: \`INV\` + four digits + \`25-26\`. Two unrelated invoices score between 0.64 and 0.82. A threshold of 0.7 would pair four invoices that have nothing to do with each other. So the fuzzy pass in this lab has **three guards**, all at once: the **same GSTIN**, the **same taxable value** (within the tolerance), and a **high similarity** (0.85). And it stays the **last** pass.

The widget below lets you feel the trade-off: change the threshold and the amount tolerance and watch which pairs survive.`,
    { sketch: { w: 760, h: 330, caption: 'The leftovers of the Kollana data: every pair scores between 0.64 and 0.82 on similarity alone, yet none of them is the same invoice', items: [
      { t: 'table', x: 30, y: 44, cols: ['books id', 'supplier id', 'similarity', 'same GSTIN?', 'taxable difference'], colW: [84, 100, 96, 108, 168], rows: [['9', '32', '0.818', 'no', '163165'], ['18', '32', '0.818', 'no', '7208'], ['27', '31', '0.727', 'no', '128964'], ['27', '32', '0.727', 'no', '152964'], ['9', '31', '0.636', 'no', '139165'], ['18', '31', '0.636', 'no', '16792']], rowH: 32, hl: [0, 1, 2, 3], title: 'every leftover books invoice against every leftover supplier invoice' },
      { t: 'note', x: 600, y: 44, w: 150, h: 130, fill: 'yellow', size: 13, text: 'At threshold 0.7:\n4 pairs, all wrong.\nAt 0.85: none.\n\nGSTIN and amount\nsay "no" to every\none of them.' },
      { t: 'note', x: 30, y: 276, w: 720, h: 40, fill: 'blue', size: 14, text: 'Invoice numbers all look alike (INV + 4 digits + 25-26), so similarity alone proves nothing.\nCombine it with the GSTIN and the amount.' },
    ] } },
    { widget: 'FuzzyMatch' },
    { py: {
      title: 'Step 4: a guarded fuzzy pass, the danger of a low threshold, and a typo experiment',
      starter: `from difflib import SequenceMatcher
import pandas as pd
pd.set_option("display.width", 130)

def clean_key(s):
    return s.str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

books = pd.read_csv("purchase_register.csv").rename(columns={"pr_id": "id"})
supplier = pd.read_csv("supplier_invoices.csv").rename(columns={"si_id": "id"})
books["key"], supplier["key"] = clean_key(books["invoice_no"]), clean_key(supplier["invoice_no"])

# the leftovers after passes 1 to 3 (see the previous playground): 3 books invoices, 2 supplier invoices
rest_b = books[books["id"].isin([9, 18, 27])]
rest_s = supplier[supplier["id"].isin([31, 32])]

# similarity alone, for every combination
rows = []
for _, b in rest_b.iterrows():
    for _, s in rest_s.iterrows():
        rows.append({"books": b["id"], "supplier": s["id"], "similarity": round(similarity(b["key"], s["key"]), 3),
                     "same_gstin": b["supplier_gstin"] == s["supplier_gstin"], "taxable_diff": abs(b["taxable_value"] - s["taxable_value"])})
scores = pd.DataFrame(rows).sort_values("similarity", ascending=False)
print(scores.to_string(index=False))
for threshold in (0.85, 0.7, 0.5):
    print(f"similarity alone at {threshold}: {int((scores['similarity'] >= threshold).sum())} pairs")

# the guarded pass: the same GSTIN AND the same taxable value (within the tolerance) AND a high similarity
def fuzzy_pass(rest_b, rest_s, threshold=0.85, tolerance=1.0):
    used, out = set(), []
    for _, b in rest_b.iterrows():
        best, best_score = None, 0.0
        for _, s in rest_s.iterrows():
            if s["id"] in used or s["supplier_gstin"] != b["supplier_gstin"]:
                continue
            if abs(s["taxable_value"] - b["taxable_value"]) > tolerance:
                continue
            score = similarity(b["key"], s["key"])
            if score >= threshold and score > best_score:
                best, best_score = s["id"], score
        if best is not None:
            used.add(best)
            out.append({"id_books": b["id"], "id_supplier": best, "score": round(best_score, 3)})
    return pd.DataFrame(out, columns=["id_books", "id_supplier", "score"])

print("guarded fuzzy pass on the real leftovers:", len(fuzzy_pass(rest_b, rest_s)), "pairs")

# experiment: pretend two supplier invoices were typed badly in a way that cleaning cannot repair
sup2 = supplier.copy()
n5 = sup2.loc[sup2["id"] == 5, "invoice_no"].iloc[0]
n6 = sup2.loc[sup2["id"] == 6, "invoice_no"].iloc[0]
sup2.loc[sup2["id"] == 5, "invoice_no"] = n5[:4] + n5[5] + n5[4] + n5[6:]        # two digits swapped
sup2.loc[sup2["id"] == 6, "invoice_no"] = n6[:5] + n6[6:]                        # one digit lost
sup2["key"] = clean_key(sup2["invoice_no"])
print("typed badly:", n5, "->", sup2.loc[sup2["id"] == 5, "invoice_no"].iloc[0], "|", n6, "->", sup2.loc[sup2["id"] == 6, "invoice_no"].iloc[0])
rb = pd.concat([rest_b, books[books["id"].isin([5, 6])]])
rs = pd.concat([rest_s, sup2[sup2["id"].isin([5, 6])]])
print(fuzzy_pass(rb, rs).to_string(index=False))`,
      note: 'On the real leftovers the guarded pass finds nothing, which is the correct answer: the 3 and 2 invoices are genuinely missing on one side. In the experiment, the same pass rescues the swapped-digit and the lost-digit invoices (scores 0.909 and 0.952) because they also share the GSTIN and the taxable value. And look at the first table: at a threshold of 0.7, similarity alone would have created four wrong pairs.',
    } },
    `## Step 5: put it together, with a bridge and checks
Now the passes become one function, \`reconcile(books, supplier)\`. It returns two things: the **result**, one row per record with exactly one **status**, and the **bridge**, a summary that shows, for each status, how many invoices and how much of the GST gap it explains:
- a matched pair explains **books minus supplier** (0 for identical and for cleaned matches, -0.40 for each rounding pair, -100.00 for each differing pair);
- an invoice **only in the books** explains **+ its GST** (we have it, the supplier does not);
- an invoice **only in the supplier file** explains **- its GST**.

The total of the bridge **must equal the control gap**. The function also **asserts** its own rules: no record matched twice, every record has a status, and the bridge ties. If you change a rule and break one of these, it stops loudly instead of printing a plausible wrong table.

One honest limit: the bridge is an accounting identity, so it ties **whatever pairs you chose**. It proves that every rupee is accounted for. It does **not** prove that the pairs are right. That is what the review list (the cleaned and fuzzy matches) and the exception lists are for.`,
    { sketch: { w: 760, h: 330, caption: 'The bridge: every status explains a part of the gap, and the total equals the control gap', items: [
      { t: 'table', x: 30, y: 44, cols: ['status', 'invoices', 'GST effect'], colW: [240, 100, 150], rows: [['identical', '13', '0.00'], ['within tolerance', '6', '-2.40'], ['amount differs', '4', '-400.00'], ['matched after cleaning', '4', '0.00'], ['only in books', '3', '55538.28'], ['only in supplier file', '2', '-9720.00'], ['TOTAL', '32', '45415.88']], rowH: 30, hl: [6], title: 'bridge: books minus supplier' },
      { t: 'note', x: 560, y: 44, w: 190, h: 130, fill: 'blue', size: 14, text: 'books GST  533646.23\nsupplier   488230.35\n-----------------------\ncontrol gap  45415.88\n\n= the TOTAL row' },
      { t: 'note', x: 560, y: 186, w: 190, h: 100, fill: 'yellow', size: 13, text: 'The bridge ties whatever\npairs you chose: it proves\nevery rupee is accounted\nfor, not that the pairs are\nright. Review the lists.' },
    ] } },
    { py: {
      title: 'Step 5: reconcile(), the bridge, the checks and the exception lists',
      starter: `from difflib import SequenceMatcher
import numpy as np
import pandas as pd
pd.set_option("display.width", 140)

def clean_key(s):
    return s.str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)

def match_pass(left, right, keys):
    l = left[["id", *keys]].copy()
    r = right[["id", *keys]].copy()
    l["_n"] = l.groupby(keys).cumcount()
    r["_n"] = r.groupby(keys).cumcount()
    pairs = l.merge(r, on=[*keys, "_n"], suffixes=("_books", "_supplier"))
    return pairs[["id_books", "id_supplier"]]

def run_pass(rest_b, rest_s, keys, label):
    pairs = match_pass(rest_b, rest_s, keys).assign(pass_name=label)
    rest_b = rest_b[~rest_b["id"].isin(pairs["id_books"])]
    rest_s = rest_s[~rest_s["id"].isin(pairs["id_supplier"])]
    return pairs, rest_b, rest_s

def fuzzy_pass(rest_b, rest_s, threshold=0.85, tolerance=1.0):
    used, out = set(), []
    for _, b in rest_b.iterrows():
        best, best_score = None, 0.0
        for _, s in rest_s.iterrows():
            if s["id"] in used or s["supplier_gstin"] != b["supplier_gstin"]:
                continue
            if abs(s["taxable_value"] - b["taxable_value"]) > tolerance:
                continue
            score = SequenceMatcher(None, b["key"], s["key"]).ratio()
            if score >= threshold and score > best_score:
                best, best_score = s["id"], score
        if best is not None:
            used.add(best)
            out.append({"id_books": b["id"], "id_supplier": best, "score": round(best_score, 3)})
    return pd.DataFrame(out, columns=["id_books", "id_supplier", "score"])

def amount_status(diff, tolerance):
    d = diff.round(2).abs()
    labels = np.select([d == 0, d <= tolerance], ["identical", "within tolerance"], default="amount differs")
    return pd.Series(labels, index=diff.index)

def reconcile(books, supplier, tolerance=1.00, fuzzy_threshold=0.85):
    b = books.rename(columns={"pr_id": "id"}).copy()
    s = supplier.rename(columns={"si_id": "id"}).copy()
    b["key"], s["key"] = clean_key(b["invoice_no"]), clean_key(s["invoice_no"])

    found, rest_b, rest_s = [], b, s
    for label, keys in [("exact", ["supplier_gstin", "invoice_no"]),
                        ("cleaned", ["supplier_gstin", "key"]),
                        ("cleaned", ["key", "taxable_value"])]:
        pairs, rest_b, rest_s = run_pass(rest_b, rest_s, keys, label)
        found.append(pairs)
    fuzzy = fuzzy_pass(rest_b, rest_s, fuzzy_threshold, tolerance).assign(pass_name="fuzzy")
    rest_b = rest_b[~rest_b["id"].isin(fuzzy["id_books"])]
    rest_s = rest_s[~rest_s["id"].isin(fuzzy["id_supplier"])]
    pairs = pd.concat([*found, fuzzy], ignore_index=True)

    pairs["gst_books"] = b.set_index("id").loc[pairs["id_books"], "gst_amount"].to_numpy()
    pairs["gst_supplier"] = s.set_index("id").loc[pairs["id_supplier"], "gst_amount"].to_numpy()
    pairs["gst_effect"] = (pairs["gst_books"] - pairs["gst_supplier"]).round(2)
    pairs["status"] = np.where(pairs["pass_name"] == "exact", amount_status(pairs["gst_effect"], tolerance),
                      np.where(pairs["pass_name"] == "cleaned", "matched after cleaning", "probable match (fuzzy)"))

    only_b = rest_b.assign(id_books=rest_b["id"], status="only in books", gst_effect=rest_b["gst_amount"].round(2))
    only_s = rest_s.assign(id_supplier=rest_s["id"], status="only in supplier file", gst_effect=-rest_s["gst_amount"].round(2))
    result = pd.concat([pairs[["status", "id_books", "id_supplier", "gst_effect"]],
                        only_b[["status", "id_books", "gst_effect"]],
                        only_s[["status", "id_supplier", "gst_effect"]]], ignore_index=True)

    bridge = result.groupby("status")["gst_effect"].agg(invoices="count", gst_effect="sum").round(2)
    total = pd.DataFrame({"invoices": [int(bridge["invoices"].sum())], "gst_effect": [round(float(bridge["gst_effect"].sum()), 2)]}, index=["TOTAL"])
    bridge = pd.concat([bridge, total])

    gap = round(float(books["gst_amount"].sum() - supplier["gst_amount"].sum()), 2)
    assert result["id_books"].dropna().is_unique and result["id_supplier"].dropna().is_unique, "a record was matched twice"
    assert result["id_books"].notna().sum() == len(books) and result["id_supplier"].notna().sum() == len(supplier), "a record has no status"
    assert abs(bridge.loc["TOTAL", "gst_effect"] - gap) < 0.005, "the bridge does not tie to the control gap"
    return result, bridge

books = pd.read_csv("purchase_register.csv")
supplier = pd.read_csv("supplier_invoices.csv")
result, bridge = reconcile(books, supplier)
print("tolerance 1.00, fuzzy threshold 0.85")
print(bridge)
print("control gap:", round(books["gst_amount"].sum() - supplier["gst_amount"].sum(), 2), "| unexplained:", round(bridge.loc["TOTAL", "gst_effect"] - (books["gst_amount"].sum() - supplier["gst_amount"].sum()), 2))

# the exception lists: one for each team
b = books.rename(columns={"pr_id": "id_books"})
s = supplier.rename(columns={"si_id": "id_supplier"})
only_books = result[result["status"] == "only in books"].merge(b, on="id_books")[["id_books", "invoice_no", "supplier_name", "gst_amount"]]
only_supplier = result[result["status"] == "only in supplier file"].merge(s, on="id_supplier")[["id_supplier", "invoice_no", "supplier_gstin", "gst_amount"]]
print("\\nchase the supplier for these invoices (in our books, not in their file):")
print(only_books.to_string(index=False))
print("\\nask the purchase team about these (in the supplier file, not in our books):")
print(only_supplier.to_string(index=False))`,
      note: 'The statuses are 13 identical, 6 within tolerance (-2.40), 4 where the amount differs (-400.00), 4 matched after cleaning (0.00), 3 only in the books (+55,538.28) and 2 only in the supplier file (-9,720.00): 32 rows and a TOTAL of 45,415.88, exactly the control gap, as in the SQL lesson. Two ideas for experiments: set `tolerance=0.30` and see six pairs move to "amount differs"; set `fuzzy_threshold=0.5` and see that the guards still refuse the wrong pairs.',
    } },
    `## Step 6: hand it over
A reconciliation ends with **people**, so the output must be shaped for them: a one-page **summary** (the bridge) for the manager, a list of **invoices to chase at the supplier** for the purchase team, a list of **invoices we do not have** for accounts payable, and a short **review list** of the cleaned and fuzzy matches (both invoice numbers, both GSTINs) for a person to confirm. The \`local\` callout below puts all five onto the tabs of an Excel workbook with the tools from the Excel lesson, and shows the output to expect.

Before you call it finished, run the **four checks** that make a reconciliation trustworthy, all of which the function already asserts: every record has exactly one status (the statuses add up to 32); no record is matched twice; the bridge equals the control gap; and the tolerance and thresholds are printed with the result. Then write a **test** (in the style of the validation lesson) that runs \`reconcile\` on a tiny hand-made pair of frames and checks each status once. A reconciliation that you cannot re-run and check next month is a one-off, not a tool.`,
    { local: `**The complete script with the Excel hand-over** (virtual environment active, in \`C:\\fde\\pandas-lab\`; \`openpyxl\` installed as in the first pandas task). Save the functions of the last playground (from \`clean_key\` to the end of \`reconcile\`) as \`10_reconciliation.py\`, and add this at the bottom:
\`\`\`python
def exception_lists(result, books, supplier):
    b = books.rename(columns={"pr_id": "id_books", "invoice_no": "invoice_no_books", "supplier_gstin": "gstin_books"})
    s = supplier.rename(columns={"si_id": "id_supplier", "invoice_no": "invoice_no_supplier", "supplier_gstin": "gstin_supplier"})
    only_books = result[result["status"] == "only in books"][["id_books"]].merge(
        b[["id_books", "invoice_no_books", "gstin_books", "supplier_name", "gst_amount"]], on="id_books")
    only_supplier = result[result["status"] == "only in supplier file"][["id_supplier"]].merge(
        s[["id_supplier", "invoice_no_supplier", "gstin_supplier", "gst_amount"]], on="id_supplier")
    review = (result[result["status"].isin(["matched after cleaning", "probable match (fuzzy)"])][["status", "id_books", "id_supplier"]]
              .merge(b[["id_books", "invoice_no_books", "gstin_books"]], on="id_books")
              .merge(s[["id_supplier", "invoice_no_supplier", "gstin_supplier"]], on="id_supplier"))
    return only_books, only_supplier, review


if __name__ == "__main__":
    books = pd.read_csv("purchase_register.csv")
    supplier = pd.read_csv("supplier_invoices.csv")
    result, bridge = reconcile(books, supplier)
    print(bridge)

    only_books, only_supplier, review = exception_lists(result, books, supplier)
    with pd.ExcelWriter("gst_reconciliation.xlsx", engine="openpyxl") as writer:
        bridge.reset_index(names="status").to_excel(writer, sheet_name="Bridge", index=False)
        only_books.to_excel(writer, sheet_name="Only in books", index=False)
        only_supplier.to_excel(writer, sheet_name="Only in supplier", index=False)
        review.to_excel(writer, sheet_name="Review", index=False)
        result.to_excel(writer, sheet_name="All", index=False)
        for ws in writer.sheets.values():
            ws.freeze_panes = "A2"
            for col in ws.columns:
                width = max(len(str(cell.value)) if cell.value is not None else 0 for cell in col)
                ws.column_dimensions[col[0].column_letter].width = min(40, max(10, width + 2))
    print(f"wrote gst_reconciliation.xlsx: {len(only_books)} only in books, {len(only_supplier)} only in supplier, {len(review)} to review, {len(result)} rows in all")
\`\`\`
Run \`python 10_reconciliation.py\`. Expected output:
\`\`\`text
                        invoices  gst_effect
amount differs                 4     -400.00
identical                     13        0.00
matched after cleaning         4        0.00
only in books                  3    55538.28
only in supplier file          2    -9720.00
within tolerance               6       -2.40
TOTAL                         32    45415.88
wrote gst_reconciliation.xlsx: 3 only in books, 2 only in supplier, 4 to review, 32 rows in all
\`\`\`
Open the workbook. **Review** lists the four pairs to confirm: \`INV/0689/25-26\` against \`INV-0689/25-26\`, \`INV/8812/25-26\` against \`INV-8812/25-26\`, and two pairs whose GSTIN ends in \`ZX\` in your books and \`ZZ\` at the supplier. **Only in books** lists invoices 9, 18 and 27 (to chase: Nandi Electricals twice and Krishna Logistics once), and **Only in supplier** lists invoices 31 and 32.` },
    { pychallenge: {
      id: 'pandas-reconciliation-lab-ch1',
      prompt: 'Write `amount_status(diff, tolerance=1.0)`. `diff` is a Series of GST differences (books minus supplier). Return a Series with the same index and one label per row: `"identical"` when the difference is 0 **after rounding to 2 decimals**, `"within tolerance"` when its absolute value is more than 0 but **at most** `tolerance` (the boundary counts as within), and `"amount differs"` otherwise. Negative differences are treated like positive ones.',
      starter: `import numpy as np
import pandas as pd

def amount_status(diff, tolerance=1.0):
    # TODO: d = diff.round(2).abs(); np.select([d == 0, d <= tolerance], [...], default=...)
    return diff.astype(str)
`,
      tests: `import pandas as pd
diff = pd.Series([0.0, -0.4, 0.4, 1.0, -1.0, 1.01, -100.0, 0.004, 0.40000000000001], index=list("abcdefghi"))
r = amount_status(diff)
assert r.tolist() == ["identical", "within tolerance", "within tolerance", "within tolerance", "within tolerance", "amount differs", "amount differs", "identical", "within tolerance"], r.tolist()
assert r.index.tolist() == list("abcdefghi")
assert amount_status(pd.Series([0.4, 0.2]), 0.3).tolist() == ["amount differs", "within tolerance"]
assert amount_status(pd.Series([], dtype="float64")).tolist() == []`,
      solution: `import numpy as np
import pandas as pd

def amount_status(diff, tolerance=1.0):
    d = diff.round(2).abs()
    labels = np.select([d == 0, d <= tolerance], ["identical", "within tolerance"], default="amount differs")
    return pd.Series(labels, index=diff.index)
`,
      hint: 'Round first (`diff.round(2)`), then take `.abs()`. `np.select([d == 0, d <= tolerance], ["identical", "within tolerance"], default="amount differs")` checks the conditions in order. Wrap the result in `pd.Series(..., index=diff.index)`.',
    } },
    { pychallenge: {
      id: 'pandas-reconciliation-lab-ch2',
      prompt: 'Write `match_pass(left, right, keys)`. `left` and `right` each have a column `id` and the key columns in the list `keys`. Pair rows that are equal on **every** key column, **each row at most once**: when a key occurs several times, the 1st occurrence on the left pairs with the 1st on the right, the 2nd with the 2nd, and so on; a surplus row stays unmatched. Return a DataFrame with the columns `left_id` and `right_id`, sorted by `left_id`, with the index `0, 1, 2 …` (an empty frame with those two columns when nothing matches).',
      starter: `import pandas as pd

def match_pass(left, right, keys):
    # TODO: number the occurrences of every key with groupby(keys).cumcount(), then merge on keys + that number
    return pd.DataFrame(columns=["left_id", "right_id"])
`,
      tests: `import pandas as pd
left = pd.DataFrame({"id": [1, 2, 3, 4], "gstin": ["A", "A", "B", "C"], "inv": ["x", "x", "y", "z"]})
right = pd.DataFrame({"id": [10, 11, 12], "gstin": ["A", "B", "A"], "inv": ["x", "y", "q"]})
r = match_pass(left, right, ["gstin", "inv"])
assert list(r.columns) == ["left_id", "right_id"], list(r.columns)
assert r.values.tolist() == [[1, 10], [3, 11]], r.values.tolist()
assert r.index.tolist() == [0, 1]
dup = match_pass(pd.DataFrame({"id": [1, 2], "k": ["A", "A"]}), pd.DataFrame({"id": [7, 8, 9], "k": ["A", "A", "A"]}), ["k"])
assert dup.values.tolist() == [[1, 7], [2, 8]], dup.values.tolist()
elsewhere = pd.DataFrame({"id": [20], "gstin": ["Z"], "inv": ["x"]})
none = match_pass(left, elsewhere, ["gstin", "inv"])
assert none.empty and list(none.columns) == ["left_id", "right_id"], none
one_key = match_pass(left, right, ["gstin"])
assert one_key.values.tolist() == [[1, 10], [2, 12], [3, 11]], one_key.values.tolist()
assert list(left.columns) == ["id", "gstin", "inv"]`,
      solution: `import pandas as pd

def match_pass(left, right, keys):
    l = left[["id", *keys]].copy()
    r = right[["id", *keys]].copy()
    l["_n"] = l.groupby(keys).cumcount()
    r["_n"] = r.groupby(keys).cumcount()
    pairs = l.merge(r, on=[*keys, "_n"], suffixes=("_left", "_right"))
    out = pairs[["id_left", "id_right"]].rename(columns={"id_left": "left_id", "id_right": "right_id"})
    return out.sort_values("left_id").reset_index(drop=True)
`,
      hint: 'Add a column `_n = groupby(keys).cumcount()` on both sides: the 0-based number of the occurrence of that key. Then `merge` on `[*keys, "_n"]` with `suffixes=("_left", "_right")`: the 1st occurrence meets the 1st, the 2nd the 2nd, and extras find no partner. Rename `id_left`/`id_right`, sort and reset the index.',
    } },
    { pychallenge: {
      id: 'pandas-reconciliation-lab-ch3',
      prompt: 'Write `best_match(text, options, threshold)`. Return the element of `options` (a list of strings) that is **most similar** to `text`, using `difflib.SequenceMatcher(None, text, option).ratio()`, **if** its score is at least `threshold`; otherwise return `None`. If two options have the same best score, return the **first** of them. An empty `options` list returns `None`.',
      starter: `from difflib import SequenceMatcher

def best_match(text, options, threshold):
    # TODO: score every option with SequenceMatcher(None, text, option).ratio(); keep the best (first on ties)
    return None
`,
      tests: `options = ["INV06832526", "INV06892526", "INV88122526"]
assert best_match("INV06892526", options, 0.85) == "INV06892526"
assert best_match("INV0689252", options, 0.85) == "INV06892526"
assert best_match("INV06983526", options, 0.95) is None
assert best_match("INV06983526", options, 0.8) == "INV06832526"
assert best_match("ABC", [], 0.1) is None
assert best_match("INV06893526", options, 0.9) == "INV06832526"
assert best_match("INV8125", ["INV8123", "INV8124"], 0.8) == "INV8123"
assert best_match("INV7777", ["INV8123", "INV8124"], 0.5) is None
assert best_match("INV7777", ["INV7777"], 1.0) == "INV7777"`,
      solution: `from difflib import SequenceMatcher

def best_match(text, options, threshold):
    best, best_score = None, 0.0
    for option in options:
        score = SequenceMatcher(None, text, option).ratio()
        if score >= threshold and score > best_score:
            best, best_score = option, score
    return best
`,
      hint: 'Loop over the options and keep the one with the highest score. Use a strict "greater than" (\`score > best_score\`) so that on a tie the first option stays. Only accept a score that is at least \`threshold\`.',
    } },
    { pychallenge: {
      id: 'pandas-reconciliation-lab-ch4',
      prompt: 'Write `bridge(result)`. `result` has one row per record, with the columns `status` and `gst_effect`. Return a DataFrame with the columns `status`, `invoices` (the number of rows) and `gst_effect` (the sum, rounded to 2 decimals), **sorted by `status`** (A to Z), with a last row whose `status` is `"TOTAL"`, the total number of rows and the total of `gst_effect` (rounded to 2 decimals). The index must be `0, 1, 2 …`.',
      starter: `import pandas as pd

def bridge(result):
    # TODO: groupby("status") with named aggregation, round, sort, then append the TOTAL row
    return result
`,
      tests: `import pandas as pd
result = pd.DataFrame({
    "status": ["only in books", "identical", "within tolerance", "within tolerance", "only in supplier file", "identical"],
    "gst_effect": [100.5, 0.0, -0.4, -0.4, -30.25, 0.0],
})
r = bridge(result)
assert list(r.columns) == ["status", "invoices", "gst_effect"], list(r.columns)
assert r["status"].tolist() == ["identical", "only in books", "only in supplier file", "within tolerance", "TOTAL"], r["status"].tolist()
assert r["invoices"].tolist() == [2, 1, 1, 2, 6], r["invoices"].tolist()
assert r["gst_effect"].tolist() == [0.0, 100.5, -30.25, -0.8, 69.45], r["gst_effect"].tolist()
assert r.index.tolist() == [0, 1, 2, 3, 4]
assert all(type(v) is int for v in r["invoices"].tolist()), r["invoices"].tolist()
assert list(result.columns) == ["status", "gst_effect"]`,
      solution: `import pandas as pd

def bridge(result):
    table = (result.groupby("status")["gst_effect"]
                   .agg(invoices="count", gst_effect="sum")
                   .round(2)
                   .reset_index()
                   .sort_values("status"))
    total = pd.DataFrame({"status": ["TOTAL"], "invoices": [int(table["invoices"].sum())],
                          "gst_effect": [round(float(table["gst_effect"].sum()), 2)]})
    return pd.concat([table, total], ignore_index=True)
`,
      hint: '`result.groupby("status")["gst_effect"].agg(invoices="count", gst_effect="sum")` gives the two columns; `.round(2).reset_index()` turns the status back into a column, and the groupby already sorts by status. Build the TOTAL row as its own one-row DataFrame (use `int(...)` for the count) and `pd.concat([...], ignore_index=True)`.',
    } },
    { real: `This is the monthly GST reconciliation your finance team does, with the manual parts made repeatable. The purchase team gets the list of suppliers to chase, accounts payable gets the list of invoices that are missing in the books, a person confirms the four probable matches, and the manager gets a bridge that ties to the control gap. The same shape of tool works for **bank reconciliation** (bank statement against the cash book, with tolerance on dates and amounts), **intercompany matching** (entity A's payable against entity B's receivable, in the right currency), **vendor statements** against the ledger, and **payroll** against the bank file. The pieces are always the same: control totals, cleaned keys, passes from strict to loose, one status per record, a bridge, and exception lists with an owner.` },
    { interview: `**"How would you reconcile two large datasets in Python?"**
Model answer: "I start with control totals so I know the gap I have to explain. Then I match in passes from strict to loose: the exact composite key first, then keys cleaned of case and punctuation, then keys without the unreliable column, and a guarded fuzzy pass last. Each pass only sees what the earlier ones left, and each record is matched at most once, which I enforce by numbering repeated keys with \`cumcount\`. Every record ends with one status, probable matches keep their own status for review, and a bridge by status must add up to the control gap. The outputs are exception lists for the teams that have to act."

**"How do you avoid false matches in fuzzy matching?"**
"Never use similarity alone, especially on identifiers that all look alike. I require the same entity key (the GSTIN), an amount within a tolerance and a high similarity score together, run the fuzzy pass last, give its matches a separate status so a person reviews them, and measure the effect of the threshold on a sample."

**"What does the bridge prove, and what does it not?"**
"It proves that every rupee of the difference is accounted for: matched pairs explain their differences, unmatched records explain themselves, and the total equals the control gap. Because it is an identity, it ties even if the pairs are wrong, so it does not prove correct matching. For that I review the probable matches and the exceptions, and I test the matching rules on small hand-made cases."` },
    `## Recap
- A reconciliation starts with **rules** and **control totals**: every record ends with exactly one status, a record matches at most once, passes go **strict to loose** on what is left, probable matches keep their own status, and the bridge must tie to the control gap (here 45,415.88).
- **\`match_pass\`** pairs on the key columns plus \`groupby(keys).cumcount()\`, so repeated keys pair 1st with 1st and surplus rows stay unmatched. **\`amount_status\`** rounds the difference first and then applies the tolerance (identical, within tolerance, amount differs).
- Passes on the Kollana data: exact key 23 pairs (13 / 6 / 4), cleaned invoice number plus GSTIN 2, cleaned invoice number plus taxable value 2, fuzzy 0. Left: **3 only in books** (+55,538.28) and **2 only in the supplier file** (-9,720.00). Statuses 13 / 6 / 4 / 4 / 3 / 2, the same as the SQL lesson.
- **Fuzzy matching needs guards**: invoice numbers all look alike, so similarity alone scores unrelated invoices 0.64 to 0.82. Combine a high similarity with the same GSTIN and the same amount, and keep it last.
- The **bridge** proves every rupee is accounted for, not that the pairs are right: review the cleaned and fuzzy matches, assert your own rules in code, hand over exception lists with an owner, and test the matcher on tiny cases.`,
  ],
  quiz: [
    { q: 'Why do the reconciliation passes run from strict to loose, each on what the earlier passes left?', o: ['it makes the code shorter', 'the strictest match is the most certain, and a looser rule can then never steal a record from a better match', 'pandas can only merge one key at a time', 'loose rules are always faster'], a: 1, why: 'An exact key is almost certainly right. Running loose rules only on the leftovers keeps them from pairing a record that has an exact partner.' },
    { q: 'On the Kollana data, merging the books and the supplier file on the GSTIN alone gives 156 rows from 30 and 29 invoices. Why?', o: ['the GSTIN column contains duplicates by mistake', 'pandas always multiplies row counts', 'the supplier file has errors', 'a supplier files many invoices, so every invoice of a GSTIN matches every invoice of that GSTIN: a fan-out'], a: 3, why: 'GSTIN is not a unique key of an invoice. The complete key is GSTIN plus invoice number, which gave 23 exact pairs.' },
    { q: 'Why do the pairs found after cleaning the keys get their own status, `matched after cleaning`?', o: ['pandas requires a different label for each pass', 'they are always wrong', 'they are probable matches that a person should be able to review before they are accepted', 'the bridge cannot add them otherwise'], a: 2, why: 'A match on a cleaned key is likely but not certain. Keeping it visible, with both invoice numbers and both GSTINs, lets a person confirm it.' },
    { q: 'At a similarity threshold of 0.7 the leftover invoices would produce four pairs, all wrong. What makes invoice numbers so risky for fuzzy matching?', o: ['they are too long', 'they contain numbers', 'they all look alike (INV + four digits + 25-26), so unrelated invoices score high; you must also require the same GSTIN and the same amount', 'difflib cannot compare digits'], a: 2, why: 'The shared pattern gives every pair a high base similarity. The GSTIN and the taxable value are what actually identify an invoice.' },
    { q: 'How do you know the reconciliation is finished?', o: ['the code ran without an error', 'every record has exactly one status and the bridge adds up to the control gap, with the review lists checked by a person', 'the number of passes is 4', 'the fuzzy pass found something'], a: 1, why: 'Completeness is shown by one status per record and a bridge that equals the control gap (45,415.88). The bridge does not prove the pairs are right, so the probable matches are reviewed.' },
    { q: 'Two books invoices have the same key and the supplier file has one invoice with that key. What should the matcher do?', o: ['pair the first books invoice with it and leave the second as "only in books"', 'pair both books invoices with it', 'drop both books invoices', 'pair neither and flag all three'], a: 0, why: 'A record may match at most once. Numbering repeated keys with `cumcount` pairs the 1st with the 1st; the surplus invoice remains an exception.' },
  ],
  task: {
    title: 'Run the reconciliation, break it, and hand it over',
    steps: [
      'In `C:\\fde\\pandas-lab` create `10_reconciliation.py` from the functions of the last playground and the `local` callout. Run it and compare your bridge with the expected one (13 / 6 / 4 / 4 / 3 / 2, TOTAL 32 and 45415.88).',
      'Open `gst_reconciliation.xlsx` and write, in a comment at the top of the script, one line for each exception list: who owns it and what they should do with it.',
      'Change the tolerance to 0.30 and re-run. Which status do the six rounding pairs move to, and does the bridge still tie? Write the answer as a comment, then put the tolerance back to 1.00.',
      'Inject two typos into a copy of the supplier file as in the fuzzy playground (a swapped pair of digits, a lost digit). Run `reconcile` with `fuzzy_threshold=0.85` and with `fuzzy_threshold=1.01` (fuzzy off). Compare the two bridges: both tie to 45415.88, but the statuses differ. Explain in a comment why a tying bridge does not prove correct matching.',
      'Write `test_reconcile.py` in the style of the validation lesson with a tiny hand-made pair of frames (one identical pair, one rounding pair, one pair with a dash typo, one invoice only in each file) and assert each status once and the bridge total. Run it with `python -m pytest -q`.',
      'Add the **validation report** from the validation lesson as the first step of the script (no copied GL-style duplicates, GSTIN shapes valid, invoice numbers unique in each file) and stop with a clear message if an error rule fails.',
    ],
    deliverable: '`10_reconciliation.py`, `gst_reconciliation.xlsx`, `test_reconcile.py` with its pytest output, and the comments that explain the tolerance experiment and the typo experiment.',
  },
};
