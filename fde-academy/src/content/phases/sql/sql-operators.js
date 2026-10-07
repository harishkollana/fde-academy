export default {
  id: 'sql-operators',
  title: 'Operators: IN, BETWEEN, LIKE and the AND/OR trap',
  goal: 'You can combine conditions with AND, OR and NOT without precedence bugs, and filter with IN, BETWEEN, LIKE and ILIKE knowing exactly what each one includes.',
  roadmap: [
    'IN, BETWEEN, LIKE, ILIKE',
    'Comparison and logical operators',
    'AND/OR precedence',
  ],
  blocks: [
    `## The problem
The sales controller sends a message: *"Give me all Online or Partner orders worth more than ₹1,00,000."*

You write the filter exactly as you would say it out loud:

\`\`\`sql
SELECT order_id, channel, amount
FROM orders
WHERE channel = 'Online' OR channel = 'Partner' AND amount > 100000;
\`\`\`

It runs. No error. It returns **98 rows**, you send it, and the controller later finds small Online orders of ₹1,620 in the file. The right answer is **47 rows**. Postgres did not make a mistake. It read your sentence differently from the way you meant it.

This lesson is about the small words of a \`WHERE\` clause: \`AND\`, \`OR\`, \`NOT\`, \`IN\`, \`BETWEEN\`, \`LIKE\`. Each one is simple. The bugs come from the small rules hiding behind them, and these bugs are dangerous because the query still runs and the numbers still look believable.`,
    `## Comparison operators
A condition in \`WHERE\` compares two things and gives **true** or **false**. The operators:

| Operator | Meaning | Example |
|---|---|---|
| \`=\` | equal (one equals sign, not two) | \`channel = 'Online'\` |
| \`<>\` | not equal (\`!=\` also works in Postgres) | \`status <> 'Returned'\` |
| \`<\` \`>\` | less than, greater than | \`amount > 100000\` |
| \`<=\` \`>=\` | less or equal, greater or equal | \`order_date >= '2025-04-01'\` |

They work on numbers, dates and text. Text is compared letter by letter, and it is **case-sensitive** in Postgres: \`'online'\` is not equal to \`'Online'\`.

Arithmetic operators build new values inside a condition or in \`SELECT\`: \`+\`, \`-\`, \`*\`, \`/\` and \`%\` (the remainder after division). The double bar \`||\` joins text: \`'IN' || '01'\` gives \`'IN01'\`.

## AND, OR, NOT, and who goes first
\`AND\` keeps a row only when **both** sides are true. \`OR\` keeps it when **at least one** side is true. \`NOT\` flips true to false.

When you mix them, SQL needs a rule for which one is worked out first. It is the same idea as school arithmetic, where \`2 + 3 * 4\` is 14 because multiplication goes before addition:

1. \`NOT\` goes first.
2. \`AND\` goes next.
3. \`OR\` goes last.

So \`A OR B AND C\` is read as \`A OR (B AND C)\`. In the controller's request, the sentence *"Online or Partner, and big"* was meant as \`(Online OR Partner) AND big\`. SQL had no way to know that. It grouped the \`AND\` first.`,
    { sketch: { w: 760, h: 310, caption: 'The same words, two different filters. AND binds tighter than OR, so brackets change the answer from 98 rows to 47.', items: [
      { t: 'text', x: 380, y: 26, text: "WHERE channel = 'Online' OR channel = 'Partner' AND amount > 100000", size: 16, bold: true },
      { t: 'text', x: 185, y: 66, text: 'SQL reads it as (AND goes first):', size: 16, color: '#c2410c' },
      { t: 'box', x: 20, y: 82, w: 330, h: 48, label: "channel = 'Online'", fill: 'orange', size: 18 },
      { t: 'text', x: 185, y: 152, text: 'OR', bold: true, size: 20 },
      { t: 'box', x: 20, y: 168, w: 330, h: 64, label: "channel = 'Partner'", sub: 'AND amount > 1,00,000', fill: 'blue', size: 18 },
      { t: 'note', x: 20, y: 252, w: 330, h: 44, text: '98 rows: EVERY Online order,\nplus only the big Partner ones', fill: 'pink' },
      { t: 'line', x1: 380, y1: 52, x2: 380, y2: 300, dashed: true },
      { t: 'text', x: 575, y: 66, text: 'What you meant (with brackets):', size: 16, color: '#2f9e44' },
      { t: 'box', x: 410, y: 82, w: 330, h: 48, label: "(Online OR Partner)", fill: 'green', size: 18 },
      { t: 'text', x: 575, y: 152, text: 'AND', bold: true, size: 20 },
      { t: 'box', x: 410, y: 168, w: 330, h: 64, label: 'amount > 1,00,000', fill: 'blue', size: 18 },
      { t: 'note', x: 410, y: 252, w: 330, h: 44, text: '47 rows: only big orders,\nfrom either channel', fill: 'green' },
    ] } },
    { sql: {
      title: 'Same words, two answers',
      starter: `-- Without brackets: AND goes first, so this is  Online  OR  (Partner AND big)
SELECT COUNT(*) AS without_brackets
FROM orders
WHERE channel = 'Online' OR channel = 'Partner' AND amount > 100000;

-- With brackets: what the controller actually meant
SELECT COUNT(*) AS with_brackets
FROM orders
WHERE (channel = 'Online' OR channel = 'Partner') AND amount > 100000;`,
      note: 'You should see 98 and 47. Try removing the amount condition from the second query: you get 153 rows, which is all Online (74) plus all Partner (79) orders.',
    } },
    { warn: 'Whenever a WHERE clause contains **both** AND and OR, write the brackets, even where Postgres would not need them. The person who reviews your query (or you, six months later) should not have to remember the precedence table. A query that mixes them without brackets is wrong more often than not.' },
    `## IN: a list instead of a chain of ORs
\`channel = 'Online' OR channel = 'Partner'\` is a chain of ORs on one column. \`IN\` says the same thing in a shorter and safer way:

\`\`\`sql
WHERE channel IN ('Online', 'Partner')            -- same as the OR chain
  AND status  NOT IN ('Returned')                 -- NOT IN: none of these
  AND customer_id IN (1, 2, 3)                    -- works for numbers too
\`\`\`
A list inside \`IN (...)\` is wrapped in **its own brackets**, so it cannot get mixed up with the AND/OR rule above. That is one more reason to prefer it over several \`OR\`s. Later you will also put a whole query inside the brackets (the subqueries lesson).

## BETWEEN: a range, with both ends included
\`amount BETWEEN 50000 AND 100000\` means \`amount >= 50000 AND amount <= 100000\`. **Both ends are included.** On the orders table both forms return 64 rows, because \`BETWEEN\` is only a shorter way of writing the two comparisons.

For numbers and for \`DATE\` columns this is fine. For **timestamp** columns it hides a trap. When you write a date such as \`'2025-06-30'\` next to a timestamp, Postgres reads it as 30 June at **00:00:00**. An invoice posted at 15:00 on 30 June is later than that moment, so \`BETWEEN '2025-06-01' AND '2025-06-30'\` leaves it out.`,
    { sketch: { w: 760, h: 285, caption: 'On a timestamp column, BETWEEN ... AND 30 June stops at 00:00 on 30 June. A half-open range catches the whole day.', items: [
      { t: 'text', x: 380, y: 24, text: 'An invoice posted on 30 June at 15:00', size: 17, bold: true },
      { t: 'line', x1: 40, y1: 100, x2: 720, y2: 100 },
      { t: 'circle', x: 60, y: 100, r: 7, fill: 'blue' },
      { t: 'text', x: 60, y: 130, text: 'Jun 1\n00:00', size: 14 },
      { t: 'circle', x: 360, y: 100, r: 7, fill: 'orange' },
      { t: 'text', x: 360, y: 130, text: 'Jun 30\n00:00', size: 14 },
      { t: 'circle', x: 470, y: 100, r: 9, fill: 'pink' },
      { t: 'text', x: 470, y: 68, text: 'invoice 15:00', size: 15, color: '#e03131', bold: true },
      { t: 'circle', x: 640, y: 100, r: 7, fill: 'blue' },
      { t: 'text', x: 640, y: 130, text: 'Jul 1\n00:00', size: 14 },
      { t: 'arrow', x1: 60, y1: 190, x2: 360, y2: 190, color: '#e03131', label: "BETWEEN '2025-06-01' AND '2025-06-30'", lx: 80, ly: -12 },
      { t: 'text', x: 470, y: 195, text: 'misses the invoice', size: 15, color: '#e03131', anchor: 'start' },
      { t: 'arrow', x1: 60, y1: 245, x2: 640, y2: 245, color: '#2f9e44', label: ">= '2025-06-01' AND < '2025-07-01'", lx: 0, ly: -12 },
      { t: 'text', x: 660, y: 262, text: 'catches it', size: 15, color: '#2f9e44' },
    ] } },
    { sql: {
      title: 'The timestamp trap, with one made-up invoice',
      starter: `SELECT TIMESTAMP '2025-06-30 15:00' BETWEEN '2025-06-01' AND '2025-06-30' AS between_says,
       TIMESTAMP '2025-06-30 15:00' >= '2025-06-01'
         AND TIMESTAMP '2025-06-30 15:00' <  '2025-07-01'             AS half_open_says;`,
      note: 'between_says is false and half_open_says is true, for the same invoice. In the Kollana tables, order_date and posting_date are DATE columns, so BETWEEN is safe there. Real ERP exports often use timestamps, so build the habit now.',
    } },
    { tip: 'The safe rule for dates and timestamps: write **>= first day AND < first day of the next period**. It works for a month, a quarter, a fiscal year (\`>= \'2025-04-01\' AND < \'2026-04-01\'\`) and it never needs you to know how many days the month has.' },
    `## LIKE and ILIKE: match a pattern
\`LIKE\` matches text against a pattern with two wildcards:

| Wildcard | Matches | Example pattern | Matches |
|---|---|---|---|
| \`%\` | any number of characters, including none | \`'SBIN%'\` | SBIN0015327, SBIN |
| \`_\` | exactly one character | \`'____0______'\` | any 11-character text with a 0 in position 5 |

\`LIKE\` is **case-sensitive**. PostgreSQL also has \`ILIKE\`, which ignores case. Other databases do not have it; there you write \`LOWER(col) LIKE 'sbin%'\`. \`NOT LIKE\` and \`NOT ILIKE\` work as you would expect.

Two things about wildcards. If the text you search for contains a real \`%\` or \`_\`, put a backslash before it (\`LIKE '100\\%'\`). And a pattern that **starts** with \`%\` (\`'%Pharma%'\`) cannot use a normal index, so on a very large table it reads every row. You will see why in the performance lesson.

The Kollana employees table contains a good example of why case matters: employee 14 has the bank code \`sbin0001234\` in lowercase.`,
    { sql: {
      title: 'LIKE, ILIKE and the _ wildcard',
      starter: `-- Case-sensitive: misses the lowercase code of emp 14
SELECT emp_id, ifsc FROM employees WHERE ifsc LIKE 'SBIN%' ORDER BY emp_id;

-- Case-insensitive: finds all five
SELECT emp_id, ifsc FROM employees WHERE ifsc ILIKE 'SBIN%' ORDER BY emp_id;

-- Shape check: 4 characters, then 0, then 6 characters (11 in total)
SELECT emp_id, ifsc FROM employees WHERE ifsc NOT LIKE '____0______' ORDER BY emp_id;

-- Names that end with Sharma, whatever the case
SELECT emp_id, emp_name FROM employees WHERE emp_name ILIKE '%sharma' ORDER BY emp_id;`,
      note: 'The first query returns 4 rows and the second 5. The shape check finds only employee 7, whose code HDFC123456 has just 10 characters. Notice that sbin0001234 passes the shape check even though lowercase is wrong for an IFSC.',
    } },
    { warn: '`LIKE` is a search tool, not a validator. The pattern `\'____0______\'` accepts `sbin0001234` (lowercase) and `ABCD0!!!!!!` (symbols). To really validate GSTIN, IFSC or PAN you need a regular expression, which comes in the strings and regex lesson.' },
    `## Practice
Three small tasks, each checked against the real data. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-operators-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'Controller request: orders from the **Online** or **Partner** channel, with status **Delivered** or **Shipped**, and an amount **from 50,000 up to and including 2,00,000**. Return `order_id, channel, status, amount`, sorted by `order_id`.',
      hint: 'Use channel IN (...), status IN (...) and amount BETWEEN 50000 AND 200000, all joined with AND. Expect 58 rows.',
      solution: `SELECT order_id, channel, status, amount
FROM orders
WHERE channel IN ('Online', 'Partner')
  AND status IN ('Delivered', 'Shipped')
  AND amount BETWEEN 50000 AND 200000
ORDER BY order_id`,
    } },
    { challenge: {
      id: 'sql-operators-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'The query in the starter box is meant to list orders from the Online or Partner channel worth **more than 1,00,000**, but it returns 98 rows. Fix it so that it returns the correct 47 rows: `order_id, channel, amount`, sorted by `order_id`.',
      starter: `SELECT order_id, channel, amount
FROM orders
WHERE channel = 'Online' OR channel = 'Partner' AND amount > 100000
ORDER BY order_id`,
      hint: 'Put brackets around the two channel conditions, or replace them with channel IN (...).',
      solution: `SELECT order_id, channel, amount
FROM orders
WHERE channel IN ('Online', 'Partner')
  AND amount > 100000
ORDER BY order_id`,
    } },
    { challenge: {
      id: 'sql-operators-ch3',
      level: 'medium',
      ordered: true,
      prompt: 'HR bank-mandate check: list the employees whose `ifsc` does **not** have the shape "4 characters, then 0, then 6 characters" (11 characters in total, a 0 in the fifth place). Use `NOT LIKE` with `_` wildcards. Return `emp_id, emp_name, ifsc`, sorted by `emp_id`.',
      hint: "ifsc NOT LIKE '____0______' (four underscores, a zero, six underscores).",
      solution: `SELECT emp_id, emp_name, ifsc
FROM employees
WHERE ifsc NOT LIKE '____0______'
ORDER BY emp_id`,
    } },
    { real: 'Almost every "can you pull..." request from finance contains an and/or inside the sentence: "Delhi or Mumbai vendors above 5 lakh", "journals posted by Manual or Interface, not SAP". When you turn a sentence into SQL, write the brackets first and read the query back to the person in plain words before you run it. Also keep the filter in a comment at the top of the file, for example `-- scope: Online or Partner, amount > 1,00,000`. When the totals do not match someone else\'s Excel, the first thing both of you check is the filter.' },
    { interview: '"What is the difference between `WHERE A OR B AND C` and `WHERE (A OR B) AND C`?" Model answer: "AND has higher precedence than OR, so the first form is `A OR (B AND C)`. For example `channel = \'Online\' OR channel = \'Partner\' AND amount > 100000` returns every Online order of any size. I always add brackets when I mix AND and OR. Follow-up: is BETWEEN inclusive? Yes, both ends, which is a trap on timestamps, so I use `>=` and `<` for dates."' },
    `## Recap
- Comparison operators: \`=\`, \`<>\`, \`<\`, \`>\`, \`<=\`, \`>=\`. Text comparison is case-sensitive.
- Precedence: \`NOT\` first, \`AND\` next, \`OR\` last. Mixing AND and OR without brackets is the classic silent bug (98 rows instead of 47).
- \`IN (...)\` replaces a chain of ORs on one column and cannot be misread; \`NOT IN\` excludes a list.
- \`BETWEEN a AND b\` includes both ends. For dates and timestamps prefer \`>= start AND < next_start\`.
- \`LIKE\` uses \`%\` (any length) and \`_\` (one character) and is case-sensitive; \`ILIKE\` ignores case (PostgreSQL only). A leading \`%\` cannot use a normal index.
- \`LIKE\` finds patterns but does not validate formats; use regular expressions for that.`,
  ],
  quiz: [
    { q: 'Which expression does Postgres evaluate for `WHERE a = 1 OR b = 2 AND c = 3`?', o: ['(a = 1 OR b = 2) AND c = 3', 'a = 1 OR (b = 2 AND c = 3)', 'Left to right, one condition at a time', 'It raises an error because the brackets are missing'], a: 1, why: 'AND binds tighter than OR, exactly as multiplication goes before addition. Add brackets to say what you mean.' },
    { q: 'Which filter is the same as `channel = \'Online\' OR channel = \'Partner\'`?', o: ["channel BETWEEN 'Online' AND 'Partner'", "channel LIKE 'Online' AND 'Partner'", "channel IN ('Online', 'Partner')", "channel = ('Online' AND 'Partner')"], a: 2, why: 'IN (list) is the short form of an OR chain on one column. BETWEEN on text would also include other channels that sort between the two words.' },
    { q: 'Orders have amounts 50000 and 100000 exactly. Does `amount BETWEEN 50000 AND 100000` include them?', o: ['Neither', 'Only 50000', 'Only 100000', 'Both'], a: 3, why: 'BETWEEN includes both ends. It is the same as amount >= 50000 AND amount <= 100000.' },
    { q: 'Why is `ts BETWEEN \'2025-06-01\' AND \'2025-06-30\'` risky when `ts` is a timestamp column?', o: ['BETWEEN does not work on timestamps', 'Rows later than 00:00 on 30 June are left out', 'It includes July by mistake', 'Dates must be written as 01/06/2025'], a: 1, why: '\'2025-06-30\' means 30 June 00:00:00, so an invoice at 15:00 that day is after the upper limit. Use >= \'2025-06-01\' AND < \'2025-07-01\'.' },
    { q: 'Which pattern matches an 11-character text whose fifth character is 0?', o: ["'%0%'", "'____0______'", "'_0_'", "'____0%'"], a: 1, why: 'Each underscore stands for exactly one character: four, then the 0, then six more make 11. A % allows any length, so it cannot enforce 11.' },
    { q: 'You search `WHERE ifsc LIKE \'SBIN%\'` and a code stored as `sbin0001234` is missing. What is the simplest fix in PostgreSQL?', o: ["Use ILIKE 'SBIN%'", "Use = 'SBIN%'", 'Add ORDER BY ifsc', "Use LIKE 'sbin%' only"], a: 0, why: 'LIKE is case-sensitive. ILIKE ignores case. (In other databases write LOWER(ifsc) LIKE \'sbin%\'.)' },
  ],
  task: {
    title: 'Fix a wrong filter on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `03_operators.sql` in `C:\\sql-practice`.',
      'Query 1: copy the 98-row version of the controller\'s request and the 47-row version one after the other, with a `--` comment above each saying which one is right and why.',
      'Query 2: list employees whose `ifsc` does not have the 11-character shape (expect 1 row, employee 7). Then list the IFSC codes starting with SBIN using LIKE and again using ILIKE (expect 4 and 5 rows).',
      'Query 3: list customers whose name contains "lotus" in any case (expect 2 rows). Try the same with LIKE and write one line in a comment on what changes.',
    ],
    deliverable: '`03_operators.sql` with commented queries; the counts 98, 47, 1, 4, 5 and 2 appear in your results.',
  },
};
