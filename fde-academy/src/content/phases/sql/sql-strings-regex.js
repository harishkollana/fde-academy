export default {
  id: 'sql-strings-regex',
  title: 'Strings and regular expressions: cleaning and validating text',
  goal: 'You can clean and reshape text with TRIM, SPLIT_PART, REPLACE and REGEXP_REPLACE, test formats with the regex operators, validate IFSC, PAN, GSTIN and invoice numbers, and build a rules-as-data validator that does not lose NULL rows.',
  roadmap: [
    'TRIM, SUBSTRING, SPLIT_PART, CONCAT, REPLACE',
    'REGEXP_REPLACE, REGEXP_MATCH and the ~ operators',
    'Validate GSTIN, IFSC and PAN',
    'RegexTester',
  ],
  blocks: [
    `## The problem
Payroll goes to the bank on Friday, and the bank rejects a file when one IFSC code is wrong. The purchase register has to be matched with the vendors' GST data, but some invoice numbers use \`/\` and some use \`-\`. The GST team wants the **state** and the **PAN** pulled out of every GSTIN.

All three problems are about **text**. Most data you receive from Excel files, ERP exports and emails is text with small defects: stray spaces, wrong case, different separators, characters in the wrong place. Cleaning and checking it is a large share of a data engineer's day, and SQL has a good toolbox for it.`,
    `## The text toolbox
| You want | Function | Example and result |
|---|---|---|
| remove spaces at both ends | \`TRIM(s)\` (also \`LTRIM\`, \`RTRIM\`) | \`TRIM('  Nandi  ')\` gives \`Nandi\` |
| remove other characters at the ends | \`TRIM(BOTH '0' FROM s)\` | \`TRIM(LEADING '0' FROM '000420')\` gives \`420\` |
| change case | \`UPPER\`, \`LOWER\`, \`INITCAP\` | \`INITCAP('nandi electricals')\` gives \`Nandi Electricals\` |
| length | \`LENGTH(s)\` | \`LENGTH('HDFC123456')\` is 10 |
| first or last characters | \`LEFT(s, n)\`, \`RIGHT(s, n)\` | \`LEFT(gstin, 2)\` is the state code |
| a slice | \`SUBSTRING(s FROM start FOR n)\` | \`SUBSTRING(gstin FROM 3 FOR 10)\` is the PAN |
| find a character | \`POSITION('/' IN s)\` | \`POSITION(' ' IN 'Apex Retail')\` is 5 |
| split on a separator | \`SPLIT_PART(s, '/', n)\` | \`SPLIT_PART('INV/3523/25-26', '/', 2)\` gives \`3523\` |
| replace text | \`REPLACE(s, '/', '-')\`, \`TRANSLATE(s, '/-', '__')\` | \`REPLACE('INV/3523/25-26', '/', '')\` gives \`INV352325-26\` |
| pad to a width | \`LPAD(s, 6, '0')\` | \`LPAD('7', 6, '0')\` gives \`000007\` |
| join pieces | the double-bar operator, \`CONCAT(…)\`, \`CONCAT_WS(sep, …)\`, \`FORMAT(…)\` | see below |

Positions in SQL start at **1**, not 0.

**Joining text and NULL.** The \`||\` operator returns **NULL** if any part is NULL (the rule from the NULLs lesson): \`'IN' || NULL\` is NULL. \`CONCAT\` treats NULL as empty text, so \`CONCAT('IN', NULL, '01')\` is \`IN01\`. \`CONCAT_WS(' | ', 'IN01', NULL, 'HDFC')\` skips NULLs and their separators: \`IN01 | HDFC\`. Choose on purpose: \`||\` when a missing part should make the whole thing missing, \`CONCAT_WS\` when you are building a label from optional parts.

### A GSTIN is a code with parts
A GSTIN has 15 characters: a 2-digit **state code**, then the supplier's 10-character **PAN**, then an entity number, the letter **Z**, and a final **check character**. With positions you can take it apart. 29 is Karnataka, 36 is Telangana and 37 is Andhra Pradesh, and the Kollana purchase register has exactly 10 invoices from each of those three states.`,
    { sql: {
      title: 'Taking text apart',
      starter: `-- 1) The parts of every supplier GSTIN
SELECT DISTINCT supplier_gstin,
       LEFT(supplier_gstin, 2)                  AS state_code,
       SUBSTRING(supplier_gstin FROM 3 FOR 10)  AS pan_part,
       SUBSTRING(supplier_gstin FROM 13 FOR 1)  AS entity_no,
       RIGHT(supplier_gstin, 1)                 AS check_char,
       supplier_name
FROM purchase_register
ORDER BY supplier_gstin;

-- 2) Invoices per state, with a small lookup table written as VALUES
WITH st(code, state) AS (VALUES ('29', 'Karnataka'), ('36', 'Telangana'), ('37', 'Andhra Pradesh'))
SELECT st.state, COUNT(*) AS invoices, SUM(p.taxable_value) AS taxable_value
FROM purchase_register p
JOIN st ON st.code = LEFT(p.supplier_gstin, 2)
GROUP BY st.state
ORDER BY st.state;

-- 3) Cleaning and joining text
SELECT TRIM('  Nandi Electricals  ') || '|'              AS trimmed,
       TRIM(LEADING '0' FROM '000420')                    AS no_leading_zeros,
       LPAD(order_id::text, 6, '0')                       AS padded_order_id,
       SPLIT_PART('INV/3523/25-26', '/', 2)               AS invoice_number,
       'IN' || NULL                                       AS pipes_with_null,
       CONCAT('IN', NULL, '01')                           AS concat_with_null,
       CONCAT_WS(' | ', 'IN01', NULL, 'HDFC')             AS concat_ws
FROM orders
WHERE order_id = 7;`,
      note: 'Six GSTINs appear in the register: Nandi Electricals (29), Sri Lakshmi Traders, Deccan Packaging and Krishna Logistics (36), Godavari Chemicals and Vizag Steel Supplies (37). Each state has 10 invoices. Order 7 padded gives 000007. The trimmed name ends in a bar so you can see the spaces are gone, and `||` with NULL gives NULL while CONCAT gives IN01.',
    } },
    `## Regular expressions: patterns for text
\`LIKE\` can only say "starts with" or "contains". A **regular expression** (regex) describes the **shape** of text: how many characters, which kinds, in which order. PostgreSQL has four match operators:

| Operator | Meaning |
|---|---|
| \`text ~ pattern\` | matches the pattern (case-sensitive) |
| \`text ~* pattern\` | matches, ignoring case |
| \`text !~ pattern\` | does **not** match |
| \`text !~* pattern\` | does not match, ignoring case |

The building blocks you will use again and again:

| Piece | Means |
|---|---|
| \`^\` and \`$\` | start and end of the text |
| \`[A-Z]\`, \`[0-9]\`, \`[A-Z0-9]\` | **one** character from this set. \`[^0-9]\` is any character that is not a digit |
| \`{4}\`, \`{2,5}\` | exactly 4 times; between 2 and 5 times |
| \`+\`, \`*\`, \`?\` | one or more; zero or more; optional |
| \`\\d\`, \`\\w\`, \`\\s\` | a digit; a letter, digit or underscore; a space |
| \`( )\` | a group, used to capture a part or to repeat several characters |

A vertical bar between choices inside brackets means either-or: \`^(SBIN|HDFC)0\` accepts both banks.

**The \`^\` and \`$\` are the most important characters in validation.** Without them the pattern matches **anywhere** inside the text: \`'abc123xyz' ~ '[0-9]{3}'\` is true, because the text contains three digits somewhere. With \`^[0-9]{3}$\` it must be **exactly** three digits and nothing else. To validate a whole value, always anchor both ends.

Here is the GSTIN pattern, read piece by piece:`,
    { sketch: { w: 760, h: 270, caption: 'The GSTIN regex, piece by piece, over a real GSTIN from the register. The ^ at the start and the $ at the end force the whole text to fit.', items: [
      { t: 'text', x: 65, y: 34, text: 'state', size: 15, color: '#1971c2', bold: true },
      { t: 'text', x: 341, y: 34, text: "the supplier's PAN", size: 15, color: '#2f9e44', bold: true },
      { t: 'text', x: 594, y: 34, text: 'entity', size: 15, color: '#c2410c', bold: true },
      { t: 'text', x: 640, y: 34, text: 'Z', size: 16, color: '#7048e8', bold: true, font: 'mono' },
      { t: 'text', x: 686, y: 34, text: 'check', size: 15, color: '#c2255c', bold: true },
      { t: 'box', x: 20, y: 52, w: 44, h: 42, fill: 'blue' },
      { t: 'text', x: 42, y: 73, text: '2', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 66, y: 52, w: 44, h: 42, fill: 'blue' },
      { t: 'text', x: 88, y: 73, text: '9', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 112, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 134, y: 73, text: 'A', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 158, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 180, y: 73, text: 'A', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 204, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 226, y: 73, text: 'H', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 250, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 272, y: 73, text: 'C', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 296, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 318, y: 73, text: 'N', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 342, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 364, y: 73, text: '9', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 388, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 410, y: 73, text: '9', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 434, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 456, y: 73, text: '0', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 480, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 502, y: 73, text: '2', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 526, y: 52, w: 44, h: 42, fill: 'green' },
      { t: 'text', x: 548, y: 73, text: 'L', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 572, y: 52, w: 44, h: 42, fill: 'orange' },
      { t: 'text', x: 594, y: 73, text: '1', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 618, y: 52, w: 44, h: 42, fill: 'purple' },
      { t: 'text', x: 640, y: 73, text: 'Z', size: 20, bold: true, font: 'mono' },
      { t: 'box', x: 664, y: 52, w: 44, h: 42, fill: 'pink' },
      { t: 'text', x: 686, y: 73, text: 'X', size: 20, bold: true, font: 'mono' },
      { t: 'brace', x: 20, y: 102, w: 90, color: '#1971c2' },
      { t: 'text', x: 65, y: 142, text: '[0-9]{2}', size: 13, color: '#1971c2', font: 'mono' },
      { t: 'brace', x: 112, y: 102, w: 458, color: '#2f9e44' },
      { t: 'text', x: 341, y: 142, text: '[A-Z]{5}[0-9]{4}[A-Z]', size: 13, color: '#2f9e44', font: 'mono' },
      { t: 'brace', x: 572, y: 102, w: 44, color: '#c2410c' },
      { t: 'text', x: 594, y: 142, text: '[1-9A-Z]', size: 13, color: '#c2410c', font: 'mono' },
      { t: 'brace', x: 618, y: 102, w: 44, color: '#7048e8' },
      { t: 'text', x: 640, y: 142, text: 'Z', size: 13, color: '#7048e8', font: 'mono' },
      { t: 'brace', x: 664, y: 102, w: 44, color: '#c2255c' },
      { t: 'text', x: 686, y: 142, text: '[0-9A-Z]', size: 13, color: '#c2255c', font: 'mono' },
      { t: 'note', x: 20, y: 184, w: 700, h: 64, text: '', fill: 'yellow' },
      { t: 'text', x: 370, y: 203, text: 'Full pattern:  ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$', size: 14, font: 'mono' },
      { t: 'text', x: 370, y: 229, text: 'This checks the SHAPE. It cannot check that the last character is the correct check character.', size: 15 },
    ] } },
    `The regex functions:
- \`REGEXP_REPLACE(text, pattern, replacement, 'g')\` replaces matches. **Add \`'g'\` (global)** or only the first match changes. \`REGEXP_REPLACE('INV-0689/25-26', '[^A-Za-z0-9]', '', 'g')\` removes every character that is not a letter or digit and gives \`INV06892526\`. This **normalising** step is the key to matching text that differs only by separators.
- \`REGEXP_MATCH(text, pattern)\` returns the **first match** as an array of the **bracketed groups**. \`(REGEXP_MATCH(invoice_no, '^INV[/-]([0-9]+)[/-]([0-9]{2}-[0-9]{2})$'))[2]\` is the fiscal-year part. (\`REGEXP_MATCHES\` with \`'g'\` returns every match.)
- \`SUBSTRING(text FROM 'pattern')\` returns the first match as text.

Try the visualizer: choose **GSTIN** and look at the five test lines. The first two pass. The lower-case one fails, and ticking **ignore case** turns it green (that is the \`~*\` operator). The line with \`Y\` instead of \`Z\` and the line with a one-digit state code fail whatever the case. Then choose **IFSC** and see that \`sbin0001234\` (the code of employee 14) behaves the same way. The tester uses the browser's regex engine, which understands the same patterns PostgreSQL does.`,
    { widget: 'RegexTester', props: { preset: 'GSTIN' } },
    `## Validating with a regex, and the NULL trap
Employee IFSC codes should match \`^[A-Z]{4}0[A-Z0-9]{6}$\` (four letters for the bank, a zero, six characters for the branch). In the Kollana data two codes are wrong: employee 7 has \`HDFC123456\` (no zero, only 10 characters), and employee 14 has \`sbin0001234\` (valid except it is in lower case). A good validator tells these apart, because the second one is **fixable** with \`UPPER()\`.

Now the trap. PANs should match \`^[A-Z]{5}[0-9]{4}[A-Z]$\`. Two employees (9 and 18) have **no PAN**. The natural query returns **no rows**:

\`\`\`sql
SELECT emp_id FROM employees WHERE pan !~ '^[A-Z]{5}[0-9]{4}[A-Z]$';   -- 0 rows
\`\`\`
\`NULL !~ pattern\` is **NULL**, not true, so \`WHERE\` throws those rows away. The query says "no bad PANs" when two are missing.`,
    { sketch: { w: 760, h: 215, caption: 'A regex test has three outcomes, not two. A NULL value gives NULL, and WHERE keeps only TRUE.', items: [
      { t: 'text', x: 380, y: 30, text: "PAN check:  value !~ '^[A-Z]{5}[0-9]{4}[A-Z]$'", size: 15, bold: true, color: '#c2410c', font: 'mono' },
      { t: 'table', x: 20, y: 52, cols: ['value', 'value ~ pattern', 'value !~ pattern', 'kept by WHERE?'], colW: [190, 160, 170, 170], rows: [['XUUPT1655R', 'TRUE', 'FALSE', 'no (a good PAN)'], ['HDFC123456', 'FALSE', 'TRUE', 'yes (a bad PAN)'], [null, 'NULL', 'NULL', 'no, silently lost']], hl: [2] },
      { t: 'note', x: 20, y: 160, w: 690, h: 40, text: 'Fix: COALESCE(value ~ pattern, false), or a CASE with an explicit missing branch.', fill: 'yellow', size: 15 },
    ] } },
    { sql: {
      title: 'Format checks: valid, fixable, invalid, missing',
      starter: `-- 1) The naive PAN check finds nothing (NULL rows are dropped)
SELECT COUNT(*) AS naive_bad_pans
FROM employees
WHERE pan !~ '^[A-Z]{5}[0-9]{4}[A-Z]$';

-- 2) A three-way classification that does not lose NULLs
SELECT CASE WHEN pan IS NULL                               THEN 'missing'
            WHEN pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'           THEN 'valid'
            ELSE 'invalid' END AS pan_status,
       COUNT(*) AS employees
FROM employees
GROUP BY 1
ORDER BY 1;

-- 3) IFSC: valid, fixable by upper-casing, or invalid
SELECT CASE WHEN ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'        THEN 'valid'
            WHEN UPPER(ifsc) ~ '^[A-Z]{4}0[A-Z0-9]{6}$' THEN 'fix case'
            ELSE 'invalid' END AS ifsc_status,
       COUNT(*) AS employees
FROM employees
GROUP BY 1
ORDER BY 1;

-- 4) Invoice numbers: which supplier-side numbers break the standard format?
SELECT si_id, invoice_no,
       REGEXP_REPLACE(invoice_no, '[^A-Za-z0-9]', '', 'g') AS normalised
FROM supplier_invoices
WHERE invoice_no !~ '^INV/[0-9]{4}/[0-9]{2}-[0-9]{2}$'
ORDER BY si_id;`,
      note: 'The naive count is 0. The three-way view finds 18 valid and 2 missing PANs. For IFSC there are 18 valid, 1 fixable (employee 14) and 1 invalid (employee 7). In the supplier file, invoices 11 and 22 use a dash after INV (INV-0689/25-26), and their normalised forms INV06892526 and INV88122526 will match the register once you normalise both sides.',
    } },
    `## Rules as data: a validator you can extend
A pipeline rarely checks one column. A better design keeps the rules **in a table** (field, rule name, regex) and applies them to every value in one query. Adding a rule is then a new row, not new code. The employee columns are first turned into rows (field, value) with \`UNION ALL\`, then joined to the rules:

\`\`\`sql
WITH rules(field, rule_name, regex) AS (VALUES
  ('ifsc', 'IFSC format', '^[A-Z]{4}0[A-Z0-9]{6}$'),
  ('pan',  'PAN format',  '^[A-Z]{5}[0-9]{4}[A-Z]$')),
vals AS (
  SELECT emp_id, 'ifsc' AS field, ifsc AS value FROM employees
  UNION ALL
  SELECT emp_id, 'pan',  pan  FROM employees)
SELECT v.emp_id, v.field, v.value, r.rule_name
FROM vals v JOIN rules r ON r.field = v.field
WHERE NOT COALESCE(v.value ~ r.regex, false);      -- NULL counts as a failure
\`\`\`
The \`COALESCE\` is the fix for the NULL trap: a missing value is a failed value. The result is an **exception list** that a person can work through, which is exactly what Project A will ask your pipeline to produce.`,
    { sql: {
      title: 'A rules-as-data validator',
      starter: `WITH rules(field, rule_name, regex) AS (
  VALUES ('ifsc', 'IFSC format', '^[A-Z]{4}0[A-Z0-9]{6}$'),
         ('pan',  'PAN format',  '^[A-Z]{5}[0-9]{4}[A-Z]$')
),
vals AS (
  SELECT emp_id, 'ifsc' AS field, ifsc AS value FROM employees
  UNION ALL
  SELECT emp_id, 'pan' AS field, pan AS value FROM employees
)
SELECT v.emp_id, v.field, v.value, r.rule_name
FROM vals v
JOIN rules r ON r.field = v.field
WHERE NOT COALESCE(v.value ~ r.regex, false)
ORDER BY v.emp_id, v.field;`,
      note: 'Four exceptions: employee 7 (IFSC HDFC123456), employee 9 (PAN missing), employee 14 (IFSC sbin0001234) and employee 18 (PAN missing). Add a third rule row, for example for a 12-digit bank account number, and run it again.',
    } },
    { warn: '**A regex proves the shape, not the truth.** All seven GSTINs in the data, including the supplier-side `29AAHCN9902L1ZZ` (a typo for `...L1ZX`), pass the format pattern, because the last character may be any letter or digit. The real last character is a **check character** calculated from the other fourteen, and a regex cannot calculate it. Whether a GSTIN, IFSC code or PAN actually **exists** needs a checksum or a lookup against the official source. Use regex to catch typing errors early, and a lookup for the final answer.' },
    { tip: 'Regular expressions and `LIKE \'%x%\'` cannot use an ordinary index, so on a very large table they read every row. Filter first with cheap conditions (a date range, an entity) and apply the regex to what is left. Also keep each pattern in one place (a rules table or a view), so a change to a format is made once.' },
    `## Practice
Each challenge is checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-strings-regex-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Bank-file check. Return the employees whose `ifsc` does **not** match the format "four capital letters, a zero, then six capital letters or digits": `emp_id, emp_name, ifsc`, sorted by `emp_id`. (2 rows: employees 7 and 14.)',
      hint: "ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'. Remember the ^ and $ anchors.",
      solution: `SELECT emp_id, emp_name, ifsc
FROM employees
WHERE ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'
ORDER BY emp_id`,
    } },
    { challenge: {
      id: 'sql-strings-regex-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Take the supplier GSTINs apart. For each **different** `supplier_gstin` in `purchase_register`, return `supplier_gstin, state_code, pan_part`: the first 2 characters, and the 10 characters from position 3 (the supplier\'s PAN). Sort by `supplier_gstin`. (6 rows.)',
      hint: 'SELECT DISTINCT, LEFT(supplier_gstin, 2), and SUBSTRING(supplier_gstin FROM 3 FOR 10).',
      solution: `SELECT DISTINCT supplier_gstin,
       LEFT(supplier_gstin, 2) AS state_code,
       SUBSTRING(supplier_gstin FROM 3 FOR 10) AS pan_part
FROM purchase_register
ORDER BY supplier_gstin`,
    } },
    { challenge: {
      id: 'sql-strings-regex-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Classify the employee IFSC codes. Return `ifsc_status, employees`, where `ifsc_status` is `valid` (matches `^[A-Z]{4}0[A-Z0-9]{6}$` as it is), `fix case` (matches only after `UPPER`) or `invalid` (anything else), and `employees` is how many employees are in each class. Sort by `ifsc_status`. (3 rows: 1, 1 and 18.)',
      hint: 'A CASE with the strict test first, the UPPER(ifsc) test second and ELSE for the rest, then GROUP BY 1.',
      solution: `SELECT CASE WHEN ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$' THEN 'valid'
            WHEN UPPER(ifsc) ~ '^[A-Z]{4}0[A-Z0-9]{6}$' THEN 'fix case'
            ELSE 'invalid' END AS ifsc_status,
       COUNT(*) AS employees
FROM employees
GROUP BY 1
ORDER BY 1`,
    } },
    { real: 'Before any bank or GST upload, your pipeline should run a **validation pass** and refuse to send a file with errors. Keep three outputs: the clean rows, the **fixable** rows (case, spaces, separators, with the automatic fix recorded) and the **exceptions** for a human. Always log the rule name and the original value, so that a rejected row can be explained in one line to the person who owns the data. The same rules table can feed your SQL checks, your Python code and your documentation.' },
    { interview: '"How would you validate PAN, IFSC and GSTIN formats in SQL, and what are the limits?" Model answer: "I write an anchored regex for each, for example `^[A-Z]{5}[0-9]{4}[A-Z]$` for PAN, and use the `~` operator. I handle NULL explicitly with COALESCE or a CASE, because `NULL !~ pattern` is NULL and the row would vanish from the exception list. I keep the patterns in a rules table. The limit is that a regex checks shape only: it cannot verify a GSTIN check character or prove that an IFSC branch exists, so for that I need a checksum or a lookup against the official list." Follow-up: "What is the difference between LIKE and a regex?" (LIKE has only % and _; a regex describes the full shape of the text.)' },
    `## Recap
- Text tools: \`TRIM\`, \`UPPER\`/\`LOWER\`, \`LEFT\`/\`RIGHT\`/\`SUBSTRING\` (positions start at 1), \`SPLIT_PART\`, \`REPLACE\`, \`LPAD\`. \`||\` returns NULL if any part is NULL; \`CONCAT\` and \`CONCAT_WS\` skip NULLs.
- A GSTIN splits into state code (2), PAN (10), entity number, \`Z\` and a check character. Kollana has 10 invoices from each of three states.
- Regex operators: \`~\`, \`~*\`, \`!~\`, \`!~*\`. **Anchor with \`^\` and \`$\`** or the pattern matches anywhere. \`REGEXP_REPLACE(…, 'g')\` normalises text, \`REGEXP_MATCH\` extracts groups.
- A regex test is TRUE, FALSE or **NULL**. \`WHERE col !~ pattern\` silently drops NULL rows, so classify with \`CASE\` or \`COALESCE(col ~ pattern, false)\`.
- Keep rules as data (a table of field, rule name, regex) and produce an **exception list**. IFSC: 18 valid, 1 fixable (lower case), 1 invalid. PAN: 2 missing.
- A regex proves shape, not truth: the GSTIN check character and the existence of an IFSC or PAN need a checksum or a lookup.`,
  ],
  quiz: [
    { q: 'What does `SELECT \'abc123xyz\' ~ \'[0-9]{3}\'` return?', o: ['false, because the text contains letters', 'An error', 'NULL', 'true, because without ^ and $ the pattern may match anywhere inside the text'], a: 3, why: 'The pattern finds three digits inside the text. To demand that the whole text is exactly three digits, write ^[0-9]{3}$.' },
    { q: 'What do `\'IN\' || NULL` and `CONCAT(\'IN\', NULL)` return?', o: ['IN and IN', 'NULL and IN', 'IN and NULL', 'NULL and NULL'], a: 1, why: 'The || operator returns NULL if any part is NULL. CONCAT treats NULL as empty text and returns IN.' },
    { q: '`WHERE pan !~ \'^[A-Z]{5}[0-9]{4}[A-Z]$\'` returns 0 rows, yet two employees have no PAN. Why?', o: ['The pattern is wrong', 'PAN cannot be tested with a regex', 'NULL !~ pattern is NULL, and WHERE keeps only TRUE', 'NULL matches every pattern'], a: 2, why: 'A regex test on NULL gives NULL, not TRUE, so the rows are dropped. Use CASE WHEN pan IS NULL … or COALESCE(pan ~ pattern, false).' },
    { q: 'Which pattern checks a complete IFSC code exactly (4 capital letters, a zero, 6 capital letters or digits)?', o: ['^[A-Z]{4}0[A-Z0-9]{6}$', '[A-Z]{4}0[A-Z0-9]{6}', '^[A-Z]{4}[0-9][A-Z0-9]{6}', '^[A-Z]+0[A-Z0-9]+$'], a: 0, why: 'Both anchors are needed and the counts must be exact. The second option has no anchors, the third has no end anchor and allows any digit, and the fourth allows any length.' },
    { q: 'All GSTINs in the data pass the format regex, but one supplier-side GSTIN has a wrong last character. What does that show?', o: ['The regex is broken', 'A regex checks the shape, not the check character or whether the GSTIN exists', 'GSTINs cannot be validated at all', 'The data has no errors'], a: 1, why: 'The last character is a calculated check character. A regex cannot calculate it, so it needs a checksum or a lookup against the official source.' },
    { q: 'What does `REGEXP_REPLACE(\'INV-0689/25-26\', \'[^A-Za-z0-9]\', \'\', \'g\')` return?', o: ['INV-0689/25-26', 'INV0689/25-26', 'INV06892526', 'An empty text'], a: 2, why: 'The pattern matches every character that is not a letter or digit, the g flag replaces all of them, and the replacement is empty. Without g only the first dash would go.' },
  ],
  task: {
    title: 'Build a validator on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `15_strings_regex.sql` in `C:\\sql-practice`.',
      'Query 1: the parts of every supplier GSTIN (state code, PAN part, entity number, check character) and the invoices per state (expect 10 each for 29, 36 and 37).',
      'Query 2: classify employee IFSC codes as valid, fix case or invalid (expect 18, 1 and 1) and PANs as valid, invalid or missing (expect 18, 0 and 2). Add a comment on why `WHERE pan !~ …` alone would report 0 problems.',
      'Query 3: the rules-as-data validator with a third rule of your own (for example, the bank account number must be 11 or 12 digits: `^[0-9]{11,12}$`, field `bank_account`). Count the exceptions it adds (expect 0, because every account number has 11 digits). Then change one account number in a copy of the table and see it caught.',
      'Query 4: normalise the invoice numbers of both `supplier_invoices` and `purchase_register` with `REGEXP_REPLACE(…, \'[^A-Za-z0-9]\', \'\', \'g\')` and count the register invoices that have a match in the supplier file: 25 match exactly and 27 match after normalising (this prepares the reconciliation lesson).',
    ],
    deliverable: '`15_strings_regex.sql` with four commented queries; the counts 10/10/10, 18/1/1, 18/0/2, the four-row exception list and 25 against 27 appear in your results.',
  },
};
