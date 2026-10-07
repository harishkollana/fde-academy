export default {
  id: 'sql-reconciliation',
  title: 'Reconciliation queries: matching two sources and explaining the gap',
  goal: 'You can reconcile two data sources in SQL: compare control totals, match on a full key, apply an amount tolerance, retry with cleaned keys, list the true exceptions, and prove that the difference is fully explained.',
  roadmap: [
    'Control totals and EXCEPT',
    'Mismatches with tolerance',
    'Full GST reconciliation',
    'FuzzyMatch',
  ],
  blocks: [
    `## The problem
Every month your finance team compares two lists of the same purchases. One is the **purchase register**, from your own books. The other is the **supplier-reported statement** (GSTR-2B style), built from what your suppliers have filed. In India, the tax credit you claim on a purchase should be backed by the supplier having reported that invoice, so differences between the two lists must be found and chased **before** the return is filed. (Check the current rules and deadlines with your tax team. This lesson is about the matching, not the law.)

Today this is a spreadsheet job: a few \`VLOOKUP\`s, some colours, and two days of work that nobody can repeat. In SQL it is **one reproducible query** that finishes in a second, gives the same answer every time, and can run as a step in a pipeline.

A reconciliation has a clear shape, and once you know it you can apply it to bank statements, intercompany balances, payroll against the bank file, or anything with two sources:

1. **Control totals.** Count and sum both sides first. A gap means work to do.
2. **Match on a full key.** Pair the records that clearly belong together.
3. **Compare the amounts, with a tolerance.** Decide what counts as a real difference.
4. **Retry the leftovers with cleaned keys.** Catch typos, but flag them for review.
5. **List the exceptions** for a person, and **prove the gap is fully explained.**`,
    { sketch: { w: 760, h: 372, caption: 'The reconciliation passes on the Kollana data. Every invoice ends with exactly one status, and the exceptions are the only rows a person has to look at.', items: [
      { t: 'box', x: 20, y: 14, w: 210, h: 60, label: 'our books', sub: 'purchase_register · 30', fill: 'blue', size: 18 },
      { t: 'box', x: 530, y: 14, w: 210, h: 60, label: 'supplier file', sub: 'supplier_invoices · 29', fill: 'green', size: 18 },
      { t: 'arrow', x1: 125, y1: 76, x2: 290, y2: 96 },
      { t: 'arrow', x1: 635, y1: 76, x2: 470, y2: 96 },
      { t: 'box', x: 230, y: 98, w: 300, h: 62, label: 'Pass 1: exact key', sub: 'GSTIN + invoice number', fill: 'yellow', size: 17 },
      { t: 'note', x: 20, y: 100, w: 200, h: 58, fill: 'green', size: 14, text: '23 pairs found:\n13 identical, 6 within ₹1,\n4 where the GST differs' },
      { t: 'note', x: 540, y: 100, w: 200, h: 58, fill: 'grey', size: 14, text: 'left over:\n7 in books, 6 at supplier' },
      { t: 'arrow', x1: 380, y1: 162, x2: 380, y2: 196, label: 'leftovers', lx: 40, ly: 0 },
      { t: 'box', x: 230, y: 198, w: 300, h: 62, label: 'Pass 2: clean and retry', sub: 'cleaned invoice no + value + date', fill: 'orange', size: 17 },
      { t: 'note', x: 20, y: 200, w: 200, h: 58, fill: 'green', size: 14, text: '4 more pairs found:\n2 invoice-number typos,\n2 GSTIN typos' },
      { t: 'note', x: 540, y: 200, w: 200, h: 58, fill: 'grey', size: 14, text: 'left over:\n3 in books, 2 at supplier' },
      { t: 'arrow', x1: 380, y1: 262, x2: 380, y2: 296, label: 'still unmatched', lx: 60, ly: 0 },
      { t: 'box', x: 230, y: 298, w: 300, h: 56, label: 'Exceptions for a person', sub: '3 not at the supplier, 2 not booked', fill: 'pink', size: 17 },
    ] } },
    `## Step 1: control totals
Before you match anything, **count and add up each side**. It takes one query and tells you straight away how big the problem is, and whether a whole file is missing:

\`\`\`sql
SELECT 'books' AS side, COUNT(*) AS invoices, SUM(taxable_value) AS taxable, SUM(gst_amount) AS gst FROM purchase_register
UNION ALL
SELECT 'supplier', COUNT(*), SUM(taxable_value), SUM(gst_amount) FROM supplier_invoices;
\`\`\`
Our books hold **30 invoices** with GST of **₹5,33,646.23**. The supplier file holds **29 invoices** with GST of **₹4,88,230.35**. The books are higher by **₹45,415.88** of GST. This number is your **target**: at the end of the reconciliation you must be able to explain every rupee of it. A reconciliation that ends with "unexplained difference: some amount" is not finished.

## Step 2: match on the full key, and compare
Join on the **complete key** that identifies an invoice: the supplier's GSTIN **and** the invoice number. (The join lessons showed what happens with a partial key: GSTIN alone gives 156 rows from 30 and 29.) Use a **\`FULL JOIN\`**, so that rows without a partner on either side stay visible, and give every row exactly one status:

\`\`\`sql
CASE WHEN p.pr_id IS NULL THEN 'only in supplier file'
     WHEN s.si_id IS NULL THEN 'only in our books'
     WHEN p.gst_amount = s.gst_amount THEN 'identical'
     WHEN ABS(p.gst_amount - s.gst_amount) <= 1 THEN 'within tolerance'
     ELSE 'amount differs' END
\`\`\`
**The order of the WHEN lines matters**: first the existence tests, then the amount tests, from the strictest to the loosest.

### The tolerance
Amounts rarely match to the paisa. Rounding at invoice level gives differences of a few paise, and chasing them costs more than they are worth. A **tolerance** says "up to ₹1 per invoice is rounding, not an error". The number is a **policy** for your finance team to set, not a rule of SQL, and it must be written in the report header, so that everybody reads the same result. Always compare with \`ABS(a - b) <= tolerance\`, never with \`=\` on money that may have been rounded in different places.`,
    { sketch: { w: 760, h: 215, caption: 'Three kinds of GST difference found among the 23 invoices matched on the exact key.', items: [
      { t: 'table', x: 40, y: 50, title: 'books minus supplier, per invoice', cols: ['difference', 'invoices', 'treatment'], colW: [140, 250, 290], rows: [['₹0.00', '13 invoices', 'identical'], ['-₹0.40', '5, 10, 15, 20, 25, 30', 'rounding: within the ₹1 tolerance'], ['-₹100.00', '7, 14, 21, 28', 'real mismatch: ask the supplier']], hl: [2] },
      { t: 'note', x: 40, y: 166, w: 680, h: 36, fill: 'yellow', size: 15, text: 'The tolerance (here ₹1) is a finance policy. Print it in the report header.' },
    ] } },
    { sql: {
      title: 'Control totals and the exact-key comparison',
      starter: `-- Step 1: control totals for both sides
SELECT 'books' AS side, COUNT(*) AS invoices,
       SUM(taxable_value) AS taxable_total, SUM(gst_amount) AS gst_total
FROM purchase_register
UNION ALL
SELECT 'supplier', COUNT(*), SUM(taxable_value), SUM(gst_amount)
FROM supplier_invoices;

-- The gap to explain
SELECT (SELECT SUM(gst_amount) FROM purchase_register)
     - (SELECT SUM(gst_amount) FROM supplier_invoices) AS gst_gap;

-- Step 2: FULL JOIN on the complete key, one status per row, with a tolerance of Rs 1
SELECT CASE WHEN p.pr_id IS NULL THEN 'only in supplier file'
            WHEN s.si_id IS NULL THEN 'only in our books'
            WHEN p.gst_amount = s.gst_amount THEN 'identical'
            WHEN ABS(p.gst_amount - s.gst_amount) <= 1 THEN 'within tolerance'
            ELSE 'amount differs' END AS status,
       COUNT(*) AS invoices
FROM purchase_register p
FULL JOIN supplier_invoices s
       ON s.supplier_gstin = p.supplier_gstin AND s.invoice_no = p.invoice_no
GROUP BY 1
ORDER BY 1;`,
      note: 'Books: 30 invoices, GST 5,33,646.23. Supplier: 29 invoices, GST 4,88,230.35. The gap is 45,415.88. The statuses are 13 identical, 6 within tolerance, 4 where the amount differs, 7 only in our books and 6 only in the supplier file. Notice 7 and 6: an invoice with a typo in its key shows up on BOTH sides, once as "only in books" and once as "only in supplier".',
    } },
    `## Step 3: retry the leftovers with cleaned keys
The 7 books-only and 6 supplier-only rows look suspicious: that is far more than a normal month should leave over. Some of these rows are **the same invoice with a typo in the key**: one supplier writes \`INV-0689/25-26\` where your books say \`INV/0689/25-26\`, and two GSTINs differ in the last character.

The second pass takes **only the leftovers** and matches them on a **cleaned key**. Use the normalising trick from the strings lesson (upper-case, remove every symbol) on the invoice number, and **do not trust the cleaned invoice number alone**. Require other facts to agree too: the **taxable value** and the **invoice date**. Two different invoices from the same supplier almost never share the same value and date, so this combination is safe. The GSTIN is left out of the key on purpose, because a typo in it is one of the errors you are hunting.

Every match found this way is a **probable** match. Keep it in its own status (\`matched after normalising\`) so that a person can review it. Never merge it silently into the exact matches.

The FuzzyMatch widget below shows the idea with a similarity score. With **normalise first** ticked, \`INV/0042/25-26\` and \`INV-0042/25-26\` are 100% similar (edit distance 0). Untick it and they score 93% with an edit distance of 1. In the table, \`INV/0310/25-26\` against \`INV/0301/25-26\` (two digits swapped) scores 82%, so at the default 90% threshold it is **Not found**. Slide the threshold down to 80% and it flips to **Matched (fuzzy)**, which glues two different invoices together. The fourth pair (a lower-case number with a trailing space) is identical after cleaning, but ₹12,000 against ₹12,300, so it stays **Amount mismatch** until you raise the tolerance to ₹300. A loose threshold finds more typos and also makes more **wrong** matches, which is why a fuzzy match must always go to a person for review.`,
    { widget: 'FuzzyMatch' },
    { warn: 'The browser playground has no fuzzy-matching functions: the PostgreSQL extensions `pg_trgm` and `fuzzystrmatch` (which give `similarity()` and `levenshtein()`) are not installed here. On a real PostgreSQL you would enable them and use them for the second pass. The cleaned-key approach in this lesson needs only standard SQL, is easier to explain to an auditor, and finds exactly the errors in this data.' },
    `## Step 4: the complete reconciliation, with a bridge
Now put the passes together. The query below builds the pairs in two passes (the second pass only looks at rows the first pass left over), gives every row **one** status, and finishes with a **bridge**: for each status, how many invoices and how much of the GST gap it explains. A matched pair explains \`books - supplier\`, a books-only invoice explains \`+ its GST\`, a supplier-only invoice explains \`- its GST\`. The total of the bridge **must equal the control gap**.

\`\`\`sql
WITH b AS (SELECT p.*, REGEXP_REPLACE(UPPER(p.invoice_no), '[^A-Z0-9]', '', 'g') AS inv_norm FROM purchase_register p),
     s AS (SELECT s.*, REGEXP_REPLACE(UPPER(s.invoice_no), '[^A-Z0-9]', '', 'g') AS inv_norm FROM supplier_invoices s),
     pass1 AS (SELECT b.pr_id, s.si_id, 'exact key' AS how
               FROM b JOIN s ON s.supplier_gstin = b.supplier_gstin AND s.invoice_no = b.invoice_no),
     pass2 AS (SELECT b.pr_id, s.si_id, 'normalised' AS how
               FROM b JOIN s ON s.inv_norm = b.inv_norm AND s.taxable_value = b.taxable_value AND s.invoice_date = b.invoice_date
               WHERE b.pr_id NOT IN (SELECT pr_id FROM pass1) AND s.si_id NOT IN (SELECT si_id FROM pass1)),
     pairs AS (SELECT * FROM pass1 UNION ALL SELECT * FROM pass2)
…
\`\`\`
The full text is in the playground. Read it from the top: each CTE is one step of the five-step method.`,
    { sql: {
      title: 'The full reconciliation with a bridge',
      starter: `WITH b AS (
  SELECT p.*, REGEXP_REPLACE(UPPER(p.invoice_no), '[^A-Z0-9]', '', 'g') AS inv_norm FROM purchase_register p
),
s AS (
  SELECT s.*, REGEXP_REPLACE(UPPER(s.invoice_no), '[^A-Z0-9]', '', 'g') AS inv_norm FROM supplier_invoices s
),
pass1 AS (                                   -- exact key: GSTIN + invoice number
  SELECT b.pr_id, s.si_id, 'exact key' AS how
  FROM b JOIN s ON s.supplier_gstin = b.supplier_gstin AND s.invoice_no = b.invoice_no
),
pass2 AS (                                   -- leftovers only: cleaned invoice no + value + date
  SELECT b.pr_id, s.si_id, 'normalised' AS how
  FROM b JOIN s ON s.inv_norm = b.inv_norm
               AND s.taxable_value = b.taxable_value
               AND s.invoice_date  = b.invoice_date
  WHERE b.pr_id NOT IN (SELECT pr_id FROM pass1)
    AND s.si_id NOT IN (SELECT si_id FROM pass1)
),
pairs AS (SELECT * FROM pass1 UNION ALL SELECT * FROM pass2),
matched AS (
  SELECT p.how, b.gst_amount - s.gst_amount AS gst_diff
  FROM pairs p JOIN b ON b.pr_id = p.pr_id JOIN s ON s.si_id = p.si_id
),
bridge AS (
  SELECT CASE WHEN how = 'exact key' AND gst_diff = 0          THEN '1 matched, identical'
              WHEN how = 'exact key' AND ABS(gst_diff) <= 1    THEN '2 matched, within tolerance'
              WHEN how = 'exact key'                           THEN '3 matched, amount differs'
              ELSE                                                  '4 matched after normalising' END AS status,
         gst_diff AS gst_effect
  FROM matched
  UNION ALL
  SELECT '5 only in our books', gst_amount FROM b WHERE pr_id NOT IN (SELECT pr_id FROM pairs)
  UNION ALL
  SELECT '6 only in supplier file', -gst_amount FROM s WHERE si_id NOT IN (SELECT si_id FROM pairs)
)
SELECT COALESCE(status, 'TOTAL') AS status,
       COUNT(*)                     AS invoices,
       ROUND(SUM(gst_effect), 2)    AS gst_effect
FROM bridge
GROUP BY ROLLUP (status)
ORDER BY status NULLS LAST;`,
      note: 'The statuses are 13 identical, 6 within tolerance (-2.40 in total), 4 where the amount differs (-400.00), 4 matched after normalising (0.00), 3 only in our books (+55,538.28) and 2 only in the supplier file (-9,720.00). The TOTAL is 32 invoices and 45,415.88, exactly the control gap. That equality is your proof: 55,538.28 - 9,720.00 - 400.00 - 2.40 = 45,415.88, so the unexplained difference is 0.00.',
    } },
    `## The exception list a person works from
The bridge tells you how the gap arises. The people need a **list**. After the two passes, these rows have no partner: **three invoices in our books** that the supplier has not reported (invoices \`INV/6852/25-26\`, \`INV/2693/25-26\` and \`INV/1597/25-26\`, with GST of ₹55,538.28 in total), and **two invoices only in the supplier file** (\`INV/7777/25-26\` and \`INV/8123/25-26\`, ₹9,720.00) which we have not booked. Different people act on each:
- **Not in the supplier file**: the credit on ₹55,538.28 of GST is at risk. The accounts payable team asks the supplier to report the invoices.
- **Only in the supplier file**: someone has to check whether the goods were received, and book the invoices or reject them.
- **Amount differs by ₹100**: ask the supplier which amount is right.
- **Matched after normalising**: confirm the typo, correct the master data or ask the supplier to amend.

Four checks make the reconciliation trustworthy, and each is one line of SQL: **every row has exactly one status** (the statuses add up to 32); **every record matches at most once** (a pair count equal to the distinct count on each side, the fan-out check); **the bridge equals the control gap**; and **the rules and the tolerance are printed in the output**.`,
    { tip: 'The `NOT IN (SELECT pr_id …)` filters are safe here because the keys are never NULL. If a key can be NULL, use `NOT EXISTS`, as the NULLs lesson explained. Also keep the passes **separate and ordered**: always run the strictest rule first, and let each later pass see only what the earlier ones left over. Otherwise a loose rule can steal a row that an exact rule would have matched correctly.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-reconciliation-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Control totals. Return one row per side: `side, invoices, taxable_total, gst_total`, with the side `books` (from `purchase_register`) and the side `supplier` (from `supplier_invoices`). Sort by `side`. (2 rows: 30 and 29 invoices.)',
      hint: "Two aggregate queries joined with UNION ALL, with a text label ('books', 'supplier') in the first column.",
      solution: `SELECT 'books' AS side, COUNT(*) AS invoices, SUM(taxable_value) AS taxable_total, SUM(gst_amount) AS gst_total
FROM purchase_register
UNION ALL
SELECT 'supplier', COUNT(*), SUM(taxable_value), SUM(gst_amount)
FROM supplier_invoices
ORDER BY side`,
    } },
    { challenge: {
      id: 'sql-reconciliation-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'GST differences that are not rounding. Match `purchase_register` to `supplier_invoices` on **both** `supplier_gstin` and `invoice_no`, and return the matched invoices where the GST amounts differ by **more than ₹1**: `invoice_no, gst_books, gst_supplier, difference`, where `difference = gst_books - gst_supplier`. Sort by `invoice_no`. (4 rows, each with a difference of -100.00.)',
      hint: 'JOIN on both columns, then WHERE ABS(p.gst_amount - s.gst_amount) > 1.',
      solution: `SELECT p.invoice_no,
       p.gst_amount AS gst_books,
       s.gst_amount AS gst_supplier,
       p.gst_amount - s.gst_amount AS difference
FROM purchase_register p
JOIN supplier_invoices s
  ON s.supplier_gstin = p.supplier_gstin AND s.invoice_no = p.invoice_no
WHERE ABS(p.gst_amount - s.gst_amount) > 1
ORDER BY p.invoice_no`,
    } },
    { challenge: {
      id: 'sql-reconciliation-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'The true exceptions in our books. Return the `purchase_register` invoices that have **no partner in `supplier_invoices` even after cleaning**: no supplier row with the same **cleaned invoice number** (upper-case, every character that is not a letter or digit removed) **and** the same `taxable_value`. Return `pr_id, invoice_no, gst_amount`, sorted by `pr_id`. (3 rows: 9, 18 and 27.)',
      hint: "NOT EXISTS (SELECT 1 FROM supplier_invoices s WHERE REGEXP_REPLACE(UPPER(s.invoice_no), '[^A-Z0-9]', '', 'g') = REGEXP_REPLACE(UPPER(p.invoice_no), '[^A-Z0-9]', '', 'g') AND s.taxable_value = p.taxable_value).",
      solution: `SELECT p.pr_id, p.invoice_no, p.gst_amount
FROM purchase_register p
WHERE NOT EXISTS (
  SELECT 1
  FROM supplier_invoices s
  WHERE REGEXP_REPLACE(UPPER(s.invoice_no), '[^A-Z0-9]', '', 'g') = REGEXP_REPLACE(UPPER(p.invoice_no), '[^A-Z0-9]', '', 'g')
    AND s.taxable_value = p.taxable_value
)
ORDER BY p.pr_id`,
    } },
    { real: 'Build the reconciliation once as a **view or a pipeline step**, and run it on every file. Store the output (status, both ids, amounts, difference) in an **exceptions table** with a timestamp and the tolerance used, so that last month\'s answer can be reproduced and an auditor can see who resolved what. The same skeleton fits the bank reconciliation (statement lines against the ledger), intercompany balances (entity A against entity B) and payroll (the bank file against the payroll run): count and total, match on a full key, tolerance, cleaned retry, exceptions, bridge. Project A will ask you to build exactly this.' },
    { interview: '"Two systems should hold the same invoices. How do you reconcile them in SQL, and how do you know you are done?" Model answer: "First I compare control totals (counts and sums) to size the problem. Then I do a FULL JOIN on the complete business key and give every row a single status: matched, amount differs, only in A, only in B, using an absolute tolerance for rounding. I retry the leftovers with cleaned keys (normalised text plus other facts such as value and date) and keep those as probable matches for review. I check that every record matches at most once. I am done when the statuses add up to the total number of records and the bridge of amounts equals the control difference, so there is no unexplained amount." A follow-up is "why FULL JOIN and not INNER?" (an inner join silently drops the unmatched rows, which are exactly the exceptions you are looking for).' },
    `## Recap
- A reconciliation has five steps: **control totals**, **match on a full key**, **compare with a tolerance**, **retry leftovers with cleaned keys**, **exceptions and a bridge**.
- Use a \`FULL JOIN\` so unmatched rows from either side stay visible, and give every row **one** status. Order the \`CASE\` tests from existence to amount, strict to loose. Compare money with \`ABS(a - b) <= tolerance\`, and print the tolerance.
- Typos in a key show up as **two** exceptions (one on each side). A second pass on cleaned keys (cleaned invoice number plus taxable value plus date, without the GSTIN) pairs them, as **probable** matches kept in their own status.
- On the Kollana data: 30 invoices against 29, a GST gap of ₹45,415.88, 13 identical, 6 within ₹1, 4 differing by ₹100, 4 matched after cleaning, 3 only in the books and 2 only in the supplier file.
- The **bridge** proves the result: \`+55,538.28 - 9,720.00 - 400.00 - 2.40 = 45,415.88\`. The reconciliation is finished only when the unexplained difference is zero.
- A regex or a fuzzy score finds candidates. A person confirms them. Run the strictest rule first, and never let a loose rule match what an exact rule would have matched.`,
  ],
  quiz: [
    { q: 'Why do you compare control totals (counts and sums) before matching any invoices?', o: ['Because SQL cannot join without them', 'Because the totals replace the matching step', 'Because totals are always equal', 'To see how big the gap is, catch a missing file early, and get a target that you must fully explain at the end'], a: 3, why: 'The control gap is the number the reconciliation has to explain. A wildly different count also warns you that a file is missing before you spend time matching.' },
    { q: 'After all the passes, how must the invoice counts of the statuses relate to the total?', o: ['They can be anything, because exceptions are excluded', 'They must add up to the number of distinct invoices on both sides (32), with every row in exactly one status', 'They must equal the number of invoices in our books (30)', 'They must equal the number in the supplier file (29)'], a: 1, why: 'Every record needs exactly one status. 13 + 6 + 4 + 4 + 3 + 2 = 32, which is 30 books invoices plus the 2 that exist only at the supplier.' },
    { q: 'Why does an invoice with a typo in its number appear twice in the exact-key FULL JOIN?', o: ['The join duplicates every row', 'FULL JOIN always shows each row twice', 'The keys differ, so the books row finds no partner and the supplier row finds no partner: one "only in books" and one "only in supplier"', 'Because the amounts also differ'], a: 2, why: 'With a different key neither side can find its partner. Each side keeps its row (that is what a FULL JOIN is for) with NULLs on the other side.' },
    { q: 'In the second pass you match on the cleaned invoice number. What else should you require?', o: ['Other fields that must agree, such as taxable value and invoice date, to avoid false matches', 'Nothing: the cleaned number is unique', 'That the GSTIN is also identical, so no typo can slip through', 'That the supplier name is longer than 10 characters'], a: 0, why: 'A cleaned number alone could pair two different invoices. Value and date make a wrong pairing very unlikely. The GSTIN is left out on purpose, because its typos are among the errors to catch.' },
    { q: 'What does an amount tolerance of ₹1 mean?', o: ['SQL ignores differences below ₹1 automatically', 'Differences up to ₹1 per invoice are treated as rounding and not as errors, by a policy that finance chooses and prints in the report', 'Every invoice may be wrong by ₹1 in total', 'Invoices below ₹1 are not reconciled'], a: 1, why: 'The tolerance is a business rule. You apply it with ABS(a - b) <= 1 and you state it in the report header so everyone reads the same result.' },
    { q: 'The GST gap between books and supplier file is ₹45,415.88. When is the reconciliation finished?', o: ['When the matched invoices are counted', 'When the three books-only invoices are removed from the books', 'When the effects of the books-only invoices, the supplier-only invoices and the amount differences add up exactly to the gap, with no unexplained amount', 'When the tolerance is set to 100'], a: 2, why: 'The bridge adds the GST of books-only invoices, subtracts the GST of supplier-only invoices and adds the differences of matched pairs. The total must equal the control gap, leaving zero unexplained.' },
  ],
  task: {
    title: 'Reconcile the GST data on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `18_reconciliation.sql` in `C:\\sql-practice`.',
      'Query 1: the control totals of both sides and the GST gap (expect 30 and 29 invoices and a gap of 45415.88).',
      'Query 2: the exact-key FULL JOIN with the status column (expect 13 identical, 6 within tolerance, 4 amount differs, 7 only in books, 6 only in the supplier file). Change the tolerance from 1 to 0.30 and note in a comment which status the six rounding invoices move to.',
      'Query 3: the complete two-pass reconciliation with the bridge (expect a TOTAL of 32 invoices and 45415.88). Add a column that proves "unexplained = 0.00".',
      'Query 4: write the exception list for each team: the three books-only invoices with their GST, the two supplier-only invoices, and the four matched-after-normalising pairs showing both invoice numbers and both GSTINs.',
    ],
    deliverable: '`18_reconciliation.sql` with four commented queries; the bridge total 45415.88, the status counts 13/6/4/4/3/2 and the exception lists appear in your results.',
  },
};
