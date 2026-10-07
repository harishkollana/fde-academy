export default {
  id: 'foundations-governance-quality-lineage',
  title: 'Quality, contracts, lineage and ownership',
  goal: 'You can measure data quality along six dimensions with SQL, write a simple data contract, read a lineage graph to judge the impact of a change, and mask personal data such as PAN.',
  roadmap: ['Data quality dimensions', 'Data contracts and SLAs', 'Lineage, catalog and ownership', 'PII and the DPDP Act (concept)'],
  blocks: [
    `## The problem
Two numbers for the same thing. The sales dashboard says September revenue is ₹4.2 crore. The finance MIS says ₹4.0 crore. The CFO asks: *"Which one is right, and how do you know?"*

If your answer is "let me check the query", you do not have a data product, you have a spreadsheet with extra steps. **Governance** is the set of habits that answer that question *before* it is asked: what the number means, where it came from, who is responsible, how good it is, and who may see it.

## Six dimensions of data quality
"Bad data" is vague. Name the *kind* of bad, because each kind has a different fix.

| Dimension | Question | Example in Kollana Tech data |
|---|---|---|
| **Completeness** | Is anything missing? | PAN is empty for 2 employees. |
| **Validity** | Does it follow the allowed format or range? | Two IFSC codes are not in the 4-letter + 0 + 6-character format. |
| **Uniqueness** | Is each thing recorded once? | Three GL lines are duplicated; two employees share one bank account. |
| **Consistency** | Do related facts agree? | Four journals where debits do not equal credits. |
| **Referential integrity** | Does every reference point to something real? | Order 77 belongs to customer 99, who does not exist. |
| **Timeliness** | Is it fresh enough? | The SGD FX rate for February 2026 never arrived. |

A seventh word you will hear is **accuracy**: does it match the real world? It is the hardest to test automatically, because you need a trusted second source to compare against (a bank statement, a physical count).

Run the scorecard below. Each row is one check that returns the number of bad rows. A real platform runs a list like this after every load.`,
    { sql: {
      title: 'A data quality scorecard',
      starter: `SELECT 'completeness: employees without PAN' AS check_name, COUNT(*) AS bad_rows
FROM employees WHERE pan IS NULL
UNION ALL
SELECT 'validity: IFSC not in the right format', COUNT(*)
FROM employees WHERE ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'
UNION ALL
SELECT 'uniqueness: bank accounts shared by 2+ employees', COUNT(*)
FROM (SELECT bank_account FROM employees GROUP BY bank_account HAVING COUNT(*) > 1) d
UNION ALL
SELECT 'referential: orders whose customer does not exist', COUNT(*)
FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL
UNION ALL
SELECT 'consistency: journals where debit <> credit', COUNT(*)
FROM (SELECT journal_id FROM fact_gl GROUP BY journal_id
      HAVING ABS(SUM(debit) - SUM(credit)) > 0.005) j;`,
      note: 'Read the check names, not just the numbers. Each line is one dimension from the table above. `!~` means "does not match this regular expression".',
    } },
    { challenge: {
      id: 'foundations-ch-ifsc',
      level: 'easy',
      prompt: 'List the employees whose **IFSC code is invalid**, meaning it does not match the pattern `^[A-Z]{4}0[A-Z0-9]{6}$` (four capital letters, a zero, then six letters or digits). Return `emp_id, emp_name, ifsc`, ordered by `emp_id`.',
      ordered: true,
      hint: 'WHERE ifsc !~ \'^[A-Z]{4}0[A-Z0-9]{6}$\' and ORDER BY emp_id.',
      solution: `SELECT emp_id, emp_name, ifsc
FROM employees
WHERE ifsc !~ '^[A-Z]{4}0[A-Z0-9]{6}$'
ORDER BY emp_id`,
    } },
    `## Data contracts and SLAs
A *data contract* is a written agreement between the team that **produces** a dataset and the teams that **consume** it. It exists because of the most common failure in data engineering: *the source team renames a column and nobody downstream is told.*

A contract states: the **schema** (names, types), the **meaning** of each field, **freshness** (when it will arrive), **quality** promises, who the **owner** is, and how **breaking changes** are announced. A **data SLA** is the freshness and quality promise made measurable: "the GL extract is available by 08:00 IST on 95% of business days".

\`\`\`yaml
# contracts/gl_extract.yaml  (a simple, human-readable contract)
dataset: gl_extract
owner: finance-systems@kollana-tech.in
description: One row per general-ledger line, posted in the previous business day.
schema:
  - { name: journal_id,   type: string,  required: true }
  - { name: posting_date, type: date,    required: true }
  - { name: account_id,   type: integer, required: true }
  - { name: debit,        type: decimal(18,2), required: true, min: 0 }
  - { name: credit,       type: decimal(18,2), required: true, min: 0 }
quality:
  - journals balance: sum(debit) = sum(credit) per journal_id
  - no duplicate (journal_id, account_id, posting_date, debit, credit)
freshness: available by 08:00 IST on business days
breaking_changes: announced 14 days ahead; new columns are not breaking
\`\`\`

The value is not the YAML. It is that **a change now has a process**. A pipeline can even *check* the contract on arrival and reject a bad file.

## Lineage, catalog and ownership
**Lineage** is the map of where data came from and where it goes. It answers two questions: *"Where did this number come from?"* (upstream) and *"If I change this, what breaks?"* (downstream, called **impact analysis**). **Column-level** lineage goes further and tracks single fields.

A **data catalog** is the searchable index: every table, its owner, description, last refresh, and the business glossary ("net revenue = invoiced amount less credit notes"). Without one, people ask in chat and get five answers. Typical tools include Microsoft Purview, Databricks Unity Catalog and open-source DataHub; dbt also generates a catalog and lineage graph for free. Check each vendor's current features before relying on them.

**Ownership** has three hats: the **data owner** (a business person accountable for the data), the **data steward** (looks after quality and definitions) and the **custodian** (the engineers who store and move it). If nobody wears the hat, nobody fixes it.`,
    { sketch: { w: 760, h: 300, caption: 'Lineage answers "what breaks if this changes?" The red path is the impact of a missing FX rate.', items: [
      { t: 'doc', x: 10, y: 30, w: 96, h: 62, label: 'SAP GL\nexport', fill: 'yellow' },
      { t: 'doc', x: 10, y: 168, w: 96, h: 62, label: 'FX rates\nCSV', fill: 'yellow' },
      { t: 'box', x: 150, y: 36, w: 120, h: 52, label: 'bronze_gl', fill: 'orange', size: 16 },
      { t: 'box', x: 150, y: 174, w: 120, h: 52, label: 'bronze_fx', fill: 'orange', size: 16 },
      { t: 'box', x: 316, y: 36, w: 120, h: 52, label: 'silver_gl', fill: 'grey', size: 16 },
      { t: 'box', x: 316, y: 174, w: 120, h: 52, label: 'silver_fx', fill: 'red', size: 16 },
      { t: 'box', x: 482, y: 104, w: 120, h: 62, label: 'gold_pnl', fill: 'green', size: 16 },
      { t: 'box', x: 640, y: 104, w: 112, h: 62, label: 'Power BI\nP&L', fill: 'blue', size: 15 },
      { t: 'arrow', x1: 106, y1: 62, x2: 150, y2: 62 },
      { t: 'arrow', x1: 106, y1: 200, x2: 150, y2: 200 },
      { t: 'arrow', x1: 270, y1: 62, x2: 316, y2: 62 },
      { t: 'arrow', x1: 270, y1: 200, x2: 316, y2: 200 },
      { t: 'arrow', x1: 436, y1: 62, x2: 482, y2: 124 },
      { t: 'arrow', x1: 436, y1: 200, x2: 482, y2: 148, color: '#e03131' },
      { t: 'arrow', x1: 602, y1: 135, x2: 640, y2: 135, color: '#e03131' },
      { t: 'note', x: 300, y: 246, w: 220, h: 42, text: 'Feb SGD rate missing here...', fill: 'red' },
      { t: 'note', x: 560, y: 208, w: 190, h: 60, text: '...so the Singapore P&L is wrong here.', fill: 'red' },
    ] } },
    `## Privacy: personal data and the DPDP Act
Your finance data is full of **personal data (PII)**: PAN, bank account number, IFSC with a name, phone, email, address, salary. Aadhaar numbers carry extra legal restrictions, so avoid storing them at all unless you have a clear legal basis.

India's **Digital Personal Data Protection Act, 2023** (DPDP Act) governs how digital personal data is collected and processed. At concept level it expects: a clear **purpose** and **consent** for collecting data, collecting only what you need (**minimisation**), keeping it only as long as needed, keeping it **secure**, and respecting people's rights to access and correct it. The detailed rules and timelines have been evolving, so **check the current text and ask your legal or compliance team** before you design anything that stores personal data of real people. In this course all data is synthetic, but build the habits now:
- **Minimise**: do not copy PAN or bank accounts into a table that does not need them.
- **Mask** in places people look (reports, logs, support screens): show only the last characters.
- **Restrict** who can read the raw values, and log who did.`,
    { py: {
      title: 'Mask PAN before it reaches a report',
      starter: `import pandas as pd

def mask_pan(pan):
    """ABCDE1234F -> XXXXXX234F (keep the last four characters)."""
    if pan is None or pd.isna(pan):
        return None
    pan = str(pan).strip().upper()
    if len(pan) != 10:
        return "INVALID"
    return "X" * 6 + pan[-4:]

emp = pd.read_csv("employees.csv")
emp["pan_masked"] = emp["pan"].map(mask_pan)
print(emp[["emp_id", "emp_name", "pan", "pan_masked"]].head(10).to_string(index=False))
print("employees with no PAN:", emp["pan"].isna().sum())`,
      note: 'The raw PAN column should never be shown in a dashboard. The masked column still lets a human tell two rows apart.',
    } },
    { warn: 'Never "fix" a bad value silently in your pipeline. If the source says IFSC is \`HDFC123456\`, do not guess the right one. **Quarantine** the row, report it, and let the data owner correct it at the source. A silent fix hides the root cause and creates a number nobody can reproduce.' },
    { interview: '**"How do you make sure the data in your pipeline is good?"** Model answer: "I check at three points. On arrival, schema and contract checks reject malformed files. After each transform, tests for uniqueness, not-null, valid values and referential integrity, plus reconciliation of totals back to the source. In production, monitors for freshness, row counts and anomalies, with alerts to a named owner. Failing rows go to a quarantine table with a report, not into the dashboard." Adding *quarantine* and *named owner* is what interviewers listen for.' },
    { real: 'Remember the last time two reports disagreed. Which dimension was it? Usually *consistency* (different filters) or *timeliness* (one refreshed before a late journal arrived). Naming the dimension tells you the fix: align definitions, or align refresh times.' },
    `## Recap
- Name the kind of bad data: **completeness, validity, uniqueness, consistency, referential integrity, timeliness** (and accuracy against a trusted source).
- A **data contract** is a written producer-to-consumer agreement on schema, meaning, freshness, quality, owner and how changes are announced. A **data SLA** makes the promise measurable.
- **Lineage** shows upstream sources and downstream impact; a **catalog** makes data findable; **ownership** puts a name on the problem.
- **PII** needs minimisation, masking, restricted access and a legal check. Under India's DPDP Act, check the current rules and involve compliance.
- Quarantine bad rows; do not fix them silently.`,
  ],
  quiz: [
    { q: 'Order 77 points to customer 99, who does not exist. Which dimension is violated?', o: ['Referential integrity', 'Timeliness', 'Uniqueness', 'Completeness'], a: 0, why: 'A reference (customer_id) points to a row that is not there. That is a referential-integrity failure.' },
    { q: 'What is the purpose of a data contract?', o: ['To schedule jobs', 'To compress files', 'To agree schema, meaning, freshness, quality and change process between producers and consumers', 'To encrypt a database'], a: 2, why: 'It prevents the silent breakage that happens when a source changes without telling consumers.' },
    { q: 'You are about to rename a silver table column. What helps you know what will break?', o: ['Asking every user by email', 'Column or table lineage (impact analysis)', 'A bigger server', 'Deleting the table'], a: 1, why: 'Downstream lineage lists the models and reports that read that column.' },
    { q: 'A pipeline finds an invalid IFSC. The best action is to…', o: ['Ignore it because it is only one row', 'Guess the right IFSC and fix it', 'Delete the row quietly', 'Quarantine the row, report it and let the owner correct the source'], a: 3, why: 'Silent fixes and silent deletes both hide the root cause. Quarantine keeps the evidence.' },
    { q: 'Which is the best way to show a PAN in a support report?', o: ['Not stored anywhere ever', 'The full PAN in a tooltip', 'Masked, showing only the last characters', 'Hashed with MD5 and shown'], a: 2, why: 'Masking reduces exposure while still allowing people to tell records apart. Whether to store it at all depends on the purpose and the law.' },
    { q: 'Two dashboards disagree because one refreshed before a late journal arrived. This is mainly a…', o: ['Timeliness problem', 'Uniqueness problem', 'Security problem', 'Validity problem'], a: 0, why: 'Different freshness at the time of reading. The fix is aligned refresh times and showing a "last updated" stamp.' },
  ],
  task: {
    title: 'Write a contract and a scorecard for one dataset',
    steps: [
      'Pick one dataset from your job (a monthly extract, for example). Write a short contract in the YAML style above: owner, columns with types, two quality rules, freshness, and how changes are announced.',
      'In the SQL playground, write three scorecard checks for the Kollana `payroll` table (for example: net_pay greater than gross_pay, employees missing in one month, gross_pay jumps).',
      'Draw the lineage of one report from your job as boxes and arrows. Mark the one box whose failure would hurt most.',
    ],
    deliverable: 'A contract file (`contract.yaml`), a SQL file with three checks, and a lineage sketch with the riskiest box circled.',
  },
};
