export default {
  id: 'sql-dml',
  title: 'INSERT, UPDATE, DELETE: changing data safely',
  goal: 'You can add, change and remove rows with INSERT, UPDATE and DELETE (including INSERT ... SELECT, UPDATE ... FROM and DELETE with a subquery), see what changed with RETURNING, move rows atomically, and follow a routine that stops a data fix from going wrong silently.',
  roadmap: [
    'INSERT, INSERT ... SELECT',
    'UPDATE ... FROM, DELETE ... USING',
    'RETURNING',
    'Changing data safely',
  ],
  blocks: [
    `## The problem
The month-end review has found three defects in the ledger data:

1. The **SGD exchange rate for February 2026 is missing**, so 34 Singapore journal lines cannot be converted to rupees (you found them with a LEFT JOIN).
2. **Three journal lines were loaded twice** (the duplicates from the window and aggregate lessons).
3. One journal has a **debit of ₹500 that should not be there**, so it does not balance.

Until now every query you wrote only **read** data, and a wrong \`SELECT\` costs nothing: you fix it and run it again. Changing data is different. A \`DELETE\` without a \`WHERE\` removes the whole ledger. An \`UPDATE\` that touches the wrong rows cannot be undone by "fixing the query". This lesson teaches the three commands, and then the **routine** that professionals follow so that a data fix can be checked, and undone, before it becomes permanent.`,
    `## The three commands
| Command | What it does | Basic shape |
|---|---|---|
| \`INSERT\` | adds new rows | \`INSERT INTO t (col1, col2) VALUES (…), (…)\` or \`INSERT INTO t (…) SELECT …\` |
| \`UPDATE\` | changes columns of existing rows | \`UPDATE t SET col = value WHERE …\` |
| \`DELETE\` | removes rows | \`DELETE FROM t WHERE …\` |

All three finish by reporting **how many rows they touched**: *INSERT 0 1*, *UPDATE 5*, *DELETE 3*. Read that number every time. If you expected 1 and see 1,227, stop. A statement that matches **no** row is not an error: \`DELETE FROM employees WHERE emp_id = 999\` simply reports *DELETE 0*.

**INSERT.** Always write the **column list**. Without it the values are matched to the columns by position, and the day someone adds a column to the table, your script breaks or, worse, writes into the wrong column. Columns you leave out get their \`DEFAULT\` (or NULL). A table's rules (primary key, \`NOT NULL\`, foreign keys, \`CHECK\`) are enforced here. Insert the same \`(currency, rate_month)\` twice and the second attempt stops with *duplicate key value violates unique constraint "fx_rates_pkey"*. That protection is a feature: the next lesson shows how to turn it into an "update if it exists" (an upsert).

Defect 1 is a plain insert. The treasury team gives you the rate (the number below is made up for the exercise), and you add it:

\`\`\`sql
INSERT INTO fx_rates (currency, rate_month, rate_to_inr)
VALUES ('SGD', '2026-02-01', 62.4500)
RETURNING *;
\`\`\`
After that, the missing-FX query from the joins lesson returns **0** rows instead of 34. A single insert repaired a whole month of Singapore reporting.

**INSERT … SELECT** inserts the **result of a query**: \`INSERT INTO archive_table SELECT * FROM orders WHERE order_date < '2025-07-01'\`. It is how you copy data, build summary tables and load from a staging table.

## RETURNING: see exactly what changed
Add \`RETURNING\` to any of the three commands and it **returns the affected rows** as a result set: the generated ids of new rows, the rows that were changed, the rows that were deleted. It turns "UPDATE 1" into proof. PostgreSQL 18 (the version this course was written against) can also return the **old and the new** values side by side, \`RETURNING old.debit AS old_debit, new.debit AS new_debit\`. On earlier versions you get only the new values.`,
    { sql: {
      title: 'INSERT with RETURNING, and the exception report before and after',
      starter: `-- The missing-rate exception report from the joins lesson: 34 lines have no rate
SELECT COUNT(*) AS lines_without_rate
FROM fact_gl g
LEFT JOIN fx_rates r
       ON r.currency = g.currency AND r.rate_month = DATE_TRUNC('month', g.posting_date)::date
WHERE r.rate_to_inr IS NULL;

-- Add the missing rate (illustrative number) and look at what was stored
INSERT INTO fx_rates (currency, rate_month, rate_to_inr)
VALUES ('SGD', '2026-02-01', 62.4500)
RETURNING currency, rate_month, rate_to_inr;

-- The same report again
SELECT COUNT(*) AS lines_without_rate
FROM fact_gl g
LEFT JOIN fx_rates r
       ON r.currency = g.currency AND r.rate_month = DATE_TRUNC('month', g.posting_date)::date
WHERE r.rate_to_inr IS NULL;

-- Remove the dashes and run it again to read the primary-key error:
-- INSERT INTO fx_rates (currency, rate_month, rate_to_inr) VALUES ('SGD', '2026-02-01', 62.4500);`,
      note: 'The first count is 34 and the second is 0. Every playground starts from a fresh copy of the data, so you cannot damage anything: re-open the page and the table is back to normal. In a real database the INSERT is permanent once it is committed.',
    } },
    `## UPDATE and DELETE: the dangerous pair
\`UPDATE\` and \`DELETE\` act on every row that matches the \`WHERE\`, and on **every row of the table if there is no \`WHERE\`**. Two forms let you use a second table:

- **\`UPDATE target SET col = s.col FROM source s WHERE s.key = target.key\`** changes rows of one table using values from another, a staging table or a list. Rows of the target with no partner in the source are left alone.
- **\`DELETE FROM t WHERE key IN (SELECT …)\`**, or \`DELETE FROM t USING other WHERE other.key = t.key\`, removes rows chosen by a query.

Defect 2 uses the ranking recipe from the window lesson inside a \`DELETE\`: number the lines of each identical group, and delete every line with number 2 or more. \`RETURNING\` lists the three rows that disappear:

\`\`\`sql
WITH numbered AS (
  SELECT gl_id,
         ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date,
                                         currency, debit, credit, source_system
                            ORDER BY gl_id) AS rn
  FROM fact_gl
)
DELETE FROM fact_gl
WHERE gl_id IN (SELECT gl_id FROM numbered WHERE rn > 1)
RETURNING gl_id, journal_id, debit, credit;
\`\`\`
The ledger drops from 1,227 to 1,224 lines, and the number of unbalanced journals falls from 4 to **1**.

### Defect 3, and a fix that passes the check but is wrong
The remaining journal, \`JV202504-0051\`, is out by ₹500. It has two lines. Look at them before you touch anything:

| gl_id | account | debit | credit |
|---|---|---|---|
| 101 | 6400 Software | 204.10 | 0.00 |
| 102 | 2000 Payables | **500.00** | 204.10 |

The payables line (102) has **both** a debit and a credit, which a posting line should never have. The ₹500 debit does not belong there. The correct fix is \`UPDATE fact_gl SET debit = 0 WHERE gl_id = 102 AND debit = 500\`.

But there is a tempting shortcut: "the debit side is ₹500 too big, so take 500 off a debit", for example \`SET debit = debit - 500\` on line 101. Run the balance check and it **passes**, because the sums are equal again. But line 101 now holds a **negative debit of -295.90**, and line 102 still carries the wrong ₹500. The control said "balanced" and the data is still wrong. **A passing check is not proof that the fix was right.** Always look at the actual rows, and write the **old value you expect into the WHERE** (\`AND debit = 500\`). If the row is not what you think it is, the update touches 0 rows and tells you so.`,
    { sketch: { w: 760, h: 284, caption: 'The safe routine for any data change. Each step is cheap, and the last one lets you take it all back.', items: [
      { t: 'box', x: 10, y: 38, w: 124, h: 70, label: '1 Preview', sub: 'same WHERE', fill: 'blue', size: 17 },
      { t: 'box', x: 162, y: 38, w: 124, h: 70, label: '2 BEGIN', sub: 'open transaction', fill: 'yellow', size: 17 },
      { t: 'box', x: 314, y: 38, w: 124, h: 70, label: '3 Change', sub: 'guard + count', fill: 'orange', size: 17 },
      { t: 'box', x: 466, y: 38, w: 124, h: 70, label: '4 Verify', sub: 'control queries', fill: 'green', size: 17 },
      { t: 'box', x: 618, y: 38, w: 124, h: 70, label: '5 End', sub: 'COMMIT/ROLLBACK', fill: 'pink', size: 17 },
      { t: 'arrow', x1: 136, y1: 73, x2: 160, y2: 73 },
      { t: 'arrow', x1: 288, y1: 73, x2: 312, y2: 73 },
      { t: 'arrow', x1: 440, y1: 73, x2: 464, y2: 73 },
      { t: 'arrow', x1: 592, y1: 73, x2: 616, y2: 73 },
      { t: 'note', x: 4, y: 124, w: 142, h: 66, fill: 'grey', size: 14, text: 'A SELECT with the\nsame WHERE. How\nmany rows? Expected?' },
      { t: 'note', x: 156, y: 124, w: 142, h: 66, fill: 'grey', size: 14, text: 'Nothing is final\nuntil COMMIT. Other\nusers see no change.' },
      { t: 'note', x: 308, y: 124, w: 142, h: 66, fill: 'grey', size: 14, text: 'AND debit = 500 is\nthe guard. Read the\nrow count: UPDATE 1.' },
      { t: 'note', x: 460, y: 124, w: 142, h: 66, fill: 'grey', size: 14, text: 'Counts and balances\nback to normal? Any\nnegative amounts?' },
      { t: 'note', x: 612, y: 124, w: 142, h: 66, fill: 'grey', size: 14, text: 'Not happy? ROLLBACK\nundoes every change\nof steps 3.' },
      { t: 'note', x: 10, y: 206, w: 732, h: 64, fill: 'yellow', size: 15, text: 'Autocommit warning: DBeaver and psql commit every statement by themselves\nunless you open a transaction first. In those tools a plain UPDATE is\nalready final the moment it finishes.' },
    ] } },
    { sql: {
      title: 'Rehearse the data fix, roll it back, then do it for real',
      starter: `-- REHEARSAL: change, check, and take it back
BEGIN;

WITH numbered AS (
  SELECT gl_id,
         ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date,
                                         currency, debit, credit, source_system ORDER BY gl_id) AS rn
  FROM fact_gl
)
DELETE FROM fact_gl
WHERE gl_id IN (SELECT gl_id FROM numbered WHERE rn > 1)
RETURNING gl_id, journal_id, debit, credit;

UPDATE fact_gl SET debit = 0
WHERE gl_id = 102 AND debit = 500                       -- the guard: only if the row is what we expect
RETURNING gl_id, old.debit AS old_debit, new.debit AS new_debit;

SELECT COUNT(*) AS lines_now,
       (SELECT COUNT(*) FROM (SELECT 1 FROM fact_gl GROUP BY journal_id
                              HAVING SUM(debit) <> SUM(credit)) AS u) AS unbalanced_journals
FROM fact_gl;

ROLLBACK;

SELECT COUNT(*) AS lines_after_rollback,
       (SELECT COUNT(*) FROM (SELECT 1 FROM fact_gl GROUP BY journal_id
                              HAVING SUM(debit) <> SUM(credit)) AS u) AS unbalanced_after_rollback
FROM fact_gl;

-- THE REAL RUN: the same two changes, this time committed
BEGIN;
DELETE FROM fact_gl WHERE gl_id IN (1225, 1226, 1227);
UPDATE fact_gl SET debit = 0 WHERE gl_id = 102 AND debit = 500;
COMMIT;

SELECT COUNT(*) AS lines_final,
       (SELECT COUNT(*) FROM (SELECT 1 FROM fact_gl GROUP BY journal_id
                              HAVING SUM(debit) <> SUM(credit)) AS u) AS unbalanced_final
FROM fact_gl;`,
      note: 'The rehearsal deletes gl_id 1225, 1226 and 1227, changes line 102 from a debit of 500.00 to 0.00, and shows 1224 lines and 0 unbalanced journals. After the ROLLBACK the data is back to 1227 lines and 4 unbalanced journals. The real run commits and ends with 1224 lines and 0 unbalanced journals. (In the real run we deleted by the three ids found in the rehearsal.)',
    } },
    { tip: 'In this browser playground the whole script is sent to PostgreSQL as one message, so a statement after a `ROLLBACK` or `COMMIT` belongs to a new implicit transaction (the transactions lesson explains this gotcha). That is why every experiment here ends with an explicit `COMMIT` or `ROLLBACK`. In DBeaver and psql, each statement is sent on its own.' },
    { sql: {
      title: 'The wrong fix that passes the check',
      starter: `BEGIN;

-- The tempting shortcut: "the debit side is 500 too high, so take 500 off line 101"
UPDATE fact_gl SET debit = debit - 500
WHERE gl_id = 101
RETURNING gl_id, old.debit AS old_debit, new.debit AS new_debit;

-- The balance check for that journal now says "balanced" ...
SELECT journal_id, SUM(debit) - SUM(credit) AS difference
FROM fact_gl
WHERE journal_id = 'JV202504-0051'
GROUP BY journal_id;

-- ... but the data is wrong. A second control exposes it:
SELECT COUNT(*) AS negative_debits FROM fact_gl WHERE debit < 0;
SELECT gl_id, debit, credit FROM fact_gl WHERE debit > 0 AND credit > 0;   -- lines posting to BOTH sides

ROLLBACK;`,
      note: 'The journal shows a difference of 0.00, so the balance check is happy. Yet one debit is -295.90 and the query for lines with both a debit and a credit still finds line 102, the real culprit. Pair every balance check with a sanity check on the rows you changed.',
    } },
    `## Moving rows: a data-modifying CTE
A common job is to **archive** old rows: copy them into an archive table, then delete them from the live table. Written as two statements, a failure between them leaves you with a copy but no delete (duplicates) or a delete but no copy (lost data). PostgreSQL lets you put \`DELETE … RETURNING\` inside a \`WITH\` and feed the deleted rows straight into an \`INSERT\`, **in one statement**, which succeeds or fails as a whole:

\`\`\`sql
WITH moved AS (
  DELETE FROM orders WHERE order_date < DATE '2025-07-01' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;
\`\`\`
The 38 orders before July 2025 leave \`orders\` (220 becomes 182) and arrive in the archive together, or not at all.`,
    { sketch: { w: 760, h: 245, caption: 'DELETE ... RETURNING feeds INSERT inside one statement. Either all 38 rows move or none do.', items: [
      { t: 'db', x: 20, y: 40, w: 120, h: 80, label: 'orders', fill: 'blue', size: 18 },
      { t: 'arrow', x1: 142, y1: 80, x2: 222, y2: 80 },
      { t: 'box', x: 224, y: 50, w: 200, h: 60, label: 'DELETE ... RETURNING *', sub: 'the rows before July 2025', fill: 'pink', size: 15 },
      { t: 'arrow', x1: 426, y1: 80, x2: 486, y2: 80, label: '38 rows', lx: 0, ly: -12 },
      { t: 'box', x: 488, y: 50, w: 160, h: 60, label: 'INSERT ... SELECT', sub: 'FROM moved', fill: 'green', size: 15 },
      { t: 'arrow', x1: 650, y1: 80, x2: 672, y2: 80 },
      { t: 'db', x: 674, y: 40, w: 80, h: 80, label: 'archive', fill: 'yellow', size: 14 },
      { t: 'brace', x: 224, y: 124, w: 424, label: 'one statement: all or nothing', color: '#c2410c' },
      { t: 'note', x: 20, y: 184, w: 722, h: 48, fill: 'yellow', size: 15, text: 'If the INSERT fails (for example a duplicate key in the archive), the DELETE is undone too.\nNo copy without a delete, no delete without a copy.' },
    ] } },
    { sql: {
      title: 'UPDATE ... FROM with old and new values, and an atomic archive',
      starter: `-- Apply a price list from a small staging table (rows are matched by sku)
UPDATE products p
SET unit_price = s.new_price
FROM (VALUES ('SKU-LAP-01', 96600.00),
             ('SKU-MOU-04',  1890.00)) AS s(sku, new_price)
WHERE p.sku = s.sku
RETURNING p.sku, old.unit_price AS old_price, new.unit_price AS new_price;

-- Archive the orders before July 2025 in one atomic statement
CREATE TABLE orders_archive (LIKE orders INCLUDING ALL);

WITH moved AS (
  DELETE FROM orders WHERE order_date < DATE '2025-07-01' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;

SELECT (SELECT COUNT(*) FROM orders)         AS live_orders,
       (SELECT COUNT(*) FROM orders_archive) AS archived_orders;`,
      note: 'The laptop goes from 92,000.00 to 96,600.00 (+5%) and the mouse from 1,800.00 to 1,890.00 (+5%). The archive step moves 38 orders: 182 remain live and 38 are archived, which adds up to the original 220. Products that are not in the price list are not touched.',
    } },
    `## The safe-change routine
1. **Preview.** Turn the statement into a \`SELECT\` with the same \`WHERE\`. Count the rows. Do they match your expectation?
2. **Open a transaction** (\`BEGIN\`). Until \`COMMIT\`, no other user sees your change, and \`ROLLBACK\` undoes all of it.
3. **Guard** the change: key columns **and** the old value in the \`WHERE\`; use \`RETURNING\`; read the row count.
4. **Verify** with control queries: counts, balances, *and* a sanity check on the rows you touched (negative amounts, NULLs, both-sides postings).
5. **\`COMMIT\`**, or \`ROLLBACK\` if anything looks wrong.

Add these habits: **keep a copy** before a large delete (\`CREATE TABLE … AS SELECT\`, or an archive table); never type a \`DELETE\` or \`UPDATE\` without a \`WHERE\` into a tool that autocommits; work with a database user that has only the privileges the job needs; and prefer a **soft delete** (a \`deleted_at\` column) when people may need the row back. Know your three removers: \`DELETE\` removes chosen rows and can be rolled back; \`TRUNCATE\` removes **all** rows very fast (no \`WHERE\`, it takes a heavy lock, and PostgreSQL can still roll it back inside a transaction); \`DROP TABLE\` removes the table itself.

If a \`DELETE\` hits a row that other tables point to with a foreign key, PostgreSQL refuses (*violates foreign key constraint*). That is the database protecting you, and the next-but-one lesson on constraints shows how to choose the behaviour.`,
    { local: 'Do this on your laptop. **DBeaver** is in **auto-commit** mode by default, so each statement is final at once. Switch to manual commit with the transaction-mode button in the toolbar (the icon that shows "Auto"; click it so it shows "Manual"), or simply type `BEGIN;` as the first statement of your script. In **psql** the same is true: type `BEGIN;` first.\n\n```text\nfde_practice=# BEGIN;\nBEGIN\nfde_practice=*# UPDATE fact_gl SET debit = 0 WHERE gl_id = 102 AND debit = 500;\nUPDATE 1\nfde_practice=*# ROLLBACK;\nROLLBACK\n```\nThe star in the prompt (`=*#`) tells you that a transaction is open. If the UPDATE had said `UPDATE 0`, your guard did its job: the row was not what you expected.' },
    `## Practice
These challenges use only \`SELECT\`, because they **preview** changes. Previewing is step 1 of the routine, and it is where most mistakes are caught.`,
    { challenge: {
      id: 'sql-dml-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Preview a price update. The staging list is `(\'SKU-LAP-01\', 96600.00), (\'SKU-MOU-04\', 1890.00), (\'SKU-KEY-03\', 5400.00)`. Return the products whose price would **change**: `sku, old_price, new_price, pct_change`, where `pct_change` is `100 * (new - old) / old` rounded to 1 decimal. Sort by `sku`. (2 rows: the keyboard keeps its price.)',
      starter: `WITH staging(sku, new_price) AS (
  VALUES ('SKU-LAP-01', 96600.00), ('SKU-MOU-04', 1890.00), ('SKU-KEY-03', 5400.00)
)
SELECT s.sku
FROM staging s
ORDER BY s.sku`,
      hint: 'JOIN products p ON p.sku = s.sku, keep only rows where p.unit_price <> s.new_price, and calculate the percentage with 100.0 first.',
      solution: `WITH staging(sku, new_price) AS (
  VALUES ('SKU-LAP-01', 96600.00), ('SKU-MOU-04', 1890.00), ('SKU-KEY-03', 5400.00)
)
SELECT s.sku,
       p.unit_price AS old_price,
       s.new_price,
       ROUND(100.0 * (s.new_price - p.unit_price) / p.unit_price, 1) AS pct_change
FROM staging s
JOIN products p ON p.sku = s.sku
WHERE p.unit_price <> s.new_price
ORDER BY s.sku`,
    } },
    { challenge: {
      id: 'sql-dml-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Find the row to correct. A posting line must have **either** a debit **or** a credit, never both. Return the lines of `fact_gl` that have a **non-zero debit and a non-zero credit**: `gl_id, journal_id, debit, credit`, sorted by `gl_id`. (1 row: the Payables line of the journal that does not balance.)',
      hint: 'WHERE debit <> 0 AND credit <> 0.',
      solution: `SELECT gl_id, journal_id, debit, credit
FROM fact_gl
WHERE debit <> 0 AND credit <> 0
ORDER BY gl_id`,
    } },
    { challenge: {
      id: 'sql-dml-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Preview the effect of the duplicate delete. **As if** the extra copies of the duplicated lines (every line numbered 2 or higher among identical lines, ordered by `gl_id`) had already been deleted, which journals would still be unbalanced? Return `journal_id, difference` (total debit minus total credit), sorted by `journal_id`. (1 row, with a difference of 500.00.)',
      hint: 'In a CTE number the lines with ROW_NUMBER() over every column except gl_id. Group only the lines with rn = 1 by journal_id and filter with HAVING SUM(debit) <> SUM(credit).',
      solution: `WITH numbered AS (
  SELECT journal_id, debit, credit,
         ROW_NUMBER() OVER (PARTITION BY journal_id, entity_id, bu_id, account_id, posting_date,
                                         currency, debit, credit, source_system
                            ORDER BY gl_id) AS rn
  FROM fact_gl
)
SELECT journal_id, SUM(debit) - SUM(credit) AS difference
FROM numbered
WHERE rn = 1
GROUP BY journal_id
HAVING SUM(debit) <> SUM(credit)
ORDER BY journal_id`,
    } },
    { real: 'Almost every data-fix incident has the same cause: a statement ran without the preview, or in autocommit mode without a way back. Make the routine a habit and also **write the fix as a script**: the preview, the change, the verification, with a comment on why. Keep the script in Git, attach it to the ticket and run it with a peer looking at the preview. In a production pipeline you will not fix data by hand at all; the pipeline reloads from the source. But the day a hand fix is unavoidable, the preview and the transaction are what you will be most glad you used.' },
    { interview: '"How do you safely run an UPDATE or DELETE on a production table?" Model answer: "I first run a SELECT with the same WHERE and check the row count. Then I run the change inside a transaction, with the key and the expected old value in the WHERE and a RETURNING clause so I see what changed. I verify with control queries and only then COMMIT, or ROLLBACK if something looks wrong. For big deletes I keep a copy first, and I never run it in autocommit mode without a WHERE." Follow-ups: "What is the difference between DELETE, TRUNCATE and DROP?" (selected rows with rollback; all rows, fast, no WHERE; the table itself) and "how do you move rows from one table to another atomically?" (a data-modifying CTE: `WITH moved AS (DELETE … RETURNING *) INSERT … SELECT * FROM moved`).' },
    `## Recap
- \`INSERT\` adds rows (always list the columns), \`UPDATE\` changes them, \`DELETE\` removes them. Each reports how many rows it touched; read that number. A statement that matches nothing is not an error (\`DELETE 0\`).
- \`INSERT … SELECT\` copies a query result. \`UPDATE … FROM\` changes rows from a staging list. \`DELETE … WHERE key IN (SELECT …)\` removes rows chosen by a query, for example the duplicate lines found with \`ROW_NUMBER\`.
- \`RETURNING\` shows the affected rows; in PostgreSQL 18 also \`old.col\` and \`new.col\`.
- A **balance check that passes is not proof** that a fix is right. The ₹500 error was on the Payables line; subtracting 500 from the expense line balanced the journal and left a negative debit. Guard the update with the old value, and add a sanity check.
- A data-modifying CTE moves rows atomically: \`WITH moved AS (DELETE … RETURNING *) INSERT … SELECT * FROM moved\`. The 38 orders before July 2025 move together.
- The routine: **preview, BEGIN, change with a guard and RETURNING, verify, COMMIT or ROLLBACK**. DBeaver and psql autocommit unless you open a transaction.`,
  ],
  quiz: [
    { q: 'What does `UPDATE fact_gl SET debit = 0;` do, with no WHERE clause?', o: ['It changes the debit of every row in the table', 'It raises an error because WHERE is required', 'It changes only the first row', 'It changes nothing until you add COMMIT'], a: 0, why: 'Without a WHERE, UPDATE and DELETE act on every row. In an autocommit tool the change is final at once. Preview and use a transaction.' },
    { q: 'You run `DELETE FROM employees WHERE emp_id = 999` and no employee has that id. What happens?', o: ['An error: row not found', 'The whole table is deleted', 'It completes and reports DELETE 0 (no row matched, which is not an error)', 'PostgreSQL asks for confirmation'], a: 2, why: 'A statement that matches no row simply affects 0 rows. That is why you must read the reported row count.' },
    { q: 'What does RETURNING do in `UPDATE … RETURNING gl_id, old.debit, new.debit`?', o: ['Undoes the update', 'Returns the changed rows as a result set, with the old and new values (PostgreSQL 18)', 'Returns the number of rows only', 'Commits the transaction'], a: 1, why: 'RETURNING gives back the affected rows, so you can see exactly what changed. In PostgreSQL 18 you can ask for old and new values.' },
    { q: 'A journal is out by 500, and subtracting 500 from one of its debit lines makes the balance check pass. Why can the fix still be wrong?', o: ['A balance check can never pass after an update', 'Because UPDATE cannot change a debit', 'Because balanced journals must have three lines', 'Passing a check does not prove the right row was fixed: the real error was on another line, and the "fix" left a negative debit'], a: 3, why: 'The sums matched again, but the actual defect (a debit of 500 on the Payables line) was untouched, and a new defect (a negative debit) appeared. Look at the rows and add sanity checks.' },
    { q: 'What is the safest way to try a risky DELETE on a table?', o: ['Run it and fix mistakes afterwards', 'Run it in autocommit mode, because that is faster', 'Run it twice to be sure', 'Preview with a SELECT, then BEGIN, run the DELETE, verify the result, and COMMIT or ROLLBACK'], a: 3, why: 'The preview shows how many rows to expect, the transaction lets you take the change back, and the verification catches surprises before they become permanent.' },
    { q: 'What does `WITH moved AS (DELETE FROM orders WHERE … RETURNING *) INSERT INTO orders_archive SELECT * FROM moved` guarantee?', o: ['The rows are deleted only if they are also inserted: it is one statement, all or nothing', 'The rows are copied, never deleted', 'The archive table is created automatically', 'Nothing: it needs two separate transactions'], a: 0, why: 'A data-modifying CTE runs as part of the single outer statement. If the INSERT fails, the DELETE is undone as well.' },
  ],
  task: {
    title: 'Fix the ledger safely on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `19_dml.sql` in `C:\\sql-practice`. Switch the connection to **manual commit**, or start the script with `BEGIN;`. Work on your own copy of the data.',
      'Step 1: run the missing-rate report (expect 34 lines), insert the SGD rate for 2026-02-01 with `RETURNING`, and run the report again (expect 0). Then try the same INSERT again and write the error text in a comment.',
      'Step 2: preview the duplicate lines with `ROW_NUMBER` (expect gl_id 1225, 1226, 1227), delete them with `RETURNING`, and check the line count (expect 1224) and the number of unbalanced journals (expect 1).',
      'Step 3: look at journal `JV202504-0051`, correct line 102 with the guarded update (`AND debit = 500`, expect UPDATE 1), and verify (expect 0 unbalanced journals, no negative debits, no line with both a debit and a credit). Then run `ROLLBACK` and confirm everything is back, and finally repeat with `COMMIT`.',
      'Step 4: archive the orders before 1 July 2025 with the data-modifying CTE (expect 182 live and 38 archived).',
    ],
    deliverable: '`19_dml.sql` with the four steps, comments on every expected row count, and the output of the final control queries.',
  },
};
