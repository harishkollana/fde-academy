// The sample "job log" is defined once. The hidden playground setup and the challenge CTEs are both generated from it,
// so the lesson text, the playgrounds and the challenges always use exactly the same six documents.
const EVENTS = [
  { id: 1, on: '2026-09-01', doc: { job_id: 'J-1001', file: 'payroll_aug.csv', uploader: { name: 'Meera', role: 'uploader' }, rows: 118, status: 'failed', errors: [{ rule: 'IFSC_INVALID', emp_id: 7 }, { rule: 'IFSC_INVALID', emp_id: 14 }], tags: ['payroll', 'bank'] } },
  { id: 2, on: '2026-09-01', doc: { job_id: 'J-1002', file: 'payroll_sep.csv', uploader: { name: 'Meera', role: 'uploader' }, rows: 120, status: 'completed', errors: [], tags: ['payroll', 'bank'] } },
  { id: 3, on: '2026-09-02', doc: { job_id: 'J-1003', file: 'gl_aug.csv', uploader: { name: 'Rohan', role: 'admin' }, rows: 4500, status: 'completed', errors: [], tags: ['gl'] } },
  { id: 4, on: '2026-09-02', doc: { job_id: 'J-1004', file: 'vendors.csv', uploader: { name: 'Diya', role: 'reviewer' }, status: 'queued', tags: [] } },
  { id: 5, on: '2026-09-03', doc: { job_id: 'J-1005', file: 'payroll_sep_v2.csv', uploader: { name: 'Meera', role: 'uploader' }, rows: 120, status: 'failed', errors: [{ rule: 'PAN_MISSING', emp_id: 9 }, { rule: 'PAN_MISSING', emp_id: 18 }, { rule: 'IFSC_INVALID', emp_id: 7 }], tags: ['payroll'] } },
  { id: 6, on: '2026-09-04', doc: { job_id: 'J-1006', file: 'gl_sep.csv', uploader: { name: 'Rohan', role: 'admin' }, rows: 5100, status: 'completed', errors: [], tags: ['gl', 'month-end'], note: null } },
];
const VALUES = EVENTS.map((e) => `(${e.id}, DATE '${e.on}', '${JSON.stringify(e.doc)}'::jsonb)`).join(',\n  ');
const SETUP = `CREATE TABLE job_events (event_id int PRIMARY KEY, received_on date, payload jsonb NOT NULL);\nINSERT INTO job_events VALUES\n  ${VALUES};`;
const CTE = `WITH job_events(event_id, received_on, payload) AS (\n  VALUES\n  ${VALUES}\n)`;

export default {
  id: 'sql-json-arrays',
  title: 'JSON, JSONB and arrays: documents inside a database',
  goal: 'You can read, search, expand, build and change JSONB documents, index them, work with arrays, and decide when a field should be a real column instead.',
  roadmap: [
    'JSON and JSONB: ->, ->>, #>>, jsonb_each, jsonb_array_elements',
    'GIN-indexable queries',
    'Arrays and unnest',
    'When not to use JSON',
  ],
  blocks: [
    `## The problem
Every payroll file that is uploaded to your validation API creates a **job**, and the API logs the result of each job as one **JSON document**: the file name, who uploaded it (a nested object), the number of rows, the status, a **list** of validation errors, and some tags. The operations lead has questions:

- *How many jobs failed, and which rule fails most often?*
- *Which jobs carry the tag "payroll" and have an IFSC error?*

And the partner team needs the opposite: *"send us each customer with their big orders as JSON."*

JSON is how systems talk to each other: APIs, webhooks, logs, event streams. A data engineer receives it all day. PostgreSQL can **query** it, **take it apart into rows**, **build** it from rows, and **index** it. This lesson covers all four.`,
    `## JSON versus JSONB
PostgreSQL has two JSON types.

| | \`json\` | \`jsonb\` |
|---|---|---|
| Storage | the exact **text** you sent | a parsed **binary** form |
| Spaces and key order | kept as written | not kept (keys are reordered) |
| Duplicate keys | all kept | the last one wins |
| Speed of reading fields | re-parses the text each time | fast |
| Operators like \`@>\`, indexes | no | **yes** |

**Use \`jsonb\` almost always.** Use \`json\` only when you must keep the original text exactly, for example as audit evidence. You can see the difference by casting to text: \`'{"a":1,"a":2}'::json::text\` keeps both keys, \`'{"a":1,"a":2}'::jsonb::text\` gives \`{"a": 2}\`.

Our six sample jobs live in a table \`job_events(event_id, received_on, payload jsonb)\`. The playgrounds below have it ready. This is the content, if you want to create it yourself in DBeaver:

| event | job_id | file | uploader | rows | status | errors | tags |
|---|---|---|---|---|---|---|---|
| 1 | J-1001 | payroll_aug.csv | Meera (uploader) | 118 | failed | IFSC_INVALID for employees 7 and 14 | payroll, bank |
| 2 | J-1002 | payroll_sep.csv | Meera (uploader) | 120 | completed | none | payroll, bank |
| 3 | J-1003 | gl_aug.csv | Rohan (admin) | 4500 | completed | none | gl |
| 4 | J-1004 | vendors.csv | Diya (reviewer) | missing | queued | missing | none |
| 5 | J-1005 | payroll_sep_v2.csv | Meera (uploader) | 120 | failed | PAN_MISSING for 9 and 18, IFSC_INVALID for 7 | payroll |
| 6 | J-1006 | gl_sep.csv | Rohan (admin) | 5100 | completed | none | gl, month-end |

Job 4 is still queued, so its document has **no \`rows\` key and no \`errors\` key** at all. Job 6 has \`"note": null\`. Real documents are uneven like this, and it matters.

## Reading a document
Two arrows do most of the work. **\`->\` returns JSON**, **\`->>\` returns text**. Chain them to walk down into nested objects, use a number to pick an array element (counting from **0** here, unlike SQL arrays), or use \`#>>\` with a path in braces.`,
    { sketch: { w: 760, h: 330, caption: 'One document and four ways to read it. -> keeps the value as JSON, ->> turns it into text, and @> asks "does the document contain this?"', items: [
      { t: 'note', x: 15, y: 30, w: 378, h: 200, fill: 'yellow', size: 13, text: '{ "job_id": "J-1001",\n  "uploader": { "name": "Meera",\n                 "role": "uploader" },\n  "rows": 118,\n  "status": "failed",\n  "errors": [ { "rule": "IFSC_INVALID",\n                "emp_id": 7 },\n              { "rule": "IFSC_INVALID",\n                "emp_id": 14 } ],\n  "tags": [ "payroll", "bank" ] }' },
      { t: 'box', x: 430, y: 30, w: 315, h: 46, label: "payload ->> 'status'", sub: "text: failed", fill: 'blue', size: 15 },
      { t: 'box', x: 430, y: 92, w: 315, h: 46, label: "payload -> 'uploader' ->> 'name'", sub: 'text: Meera', fill: 'green', size: 14 },
      { t: 'box', x: 430, y: 154, w: 315, h: 46, label: "payload -> 'errors' -> 0 ->> 'rule'", sub: 'text: IFSC_INVALID', fill: 'orange', size: 14 },
      { t: 'box', x: 430, y: 216, w: 315, h: 46, label: 'payload @> \'{"status":"failed"}\'', sub: 'true', fill: 'pink', size: 14 },
      { t: 'arrow', x1: 395, y1: 60, x2: 428, y2: 54 },
      { t: 'arrow', x1: 395, y1: 100, x2: 428, y2: 114 },
      { t: 'arrow', x1: 395, y1: 150, x2: 428, y2: 176 },
      { t: 'arrow', x1: 395, y1: 200, x2: 428, y2: 238 },
      { t: 'note', x: 15, y: 250, w: 378, h: 60, fill: 'grey', size: 14, text: 'Missing key: -> returns SQL NULL.\n"note": null: -> returns the JSON value null,\nbut ->> returns SQL NULL.' },
    ] } },
    { sql: {
      title: 'Reading JSONB documents',
      setup: SETUP,
      starter: `-- Walk into the documents
SELECT event_id,
       payload ->> 'job_id'                     AS job,
       payload -> 'status'                      AS status_as_json,   -- still JSON (with quotes)
       payload ->> 'status'                     AS status_as_text,
       payload -> 'uploader' ->> 'name'         AS uploader,
       payload #>> '{uploader,role}'            AS role_by_path,
       (payload ->> 'rows')::int                AS rows,             -- cast text to a number
       payload -> 'errors' -> 0 ->> 'rule'      AS first_error_rule
FROM job_events
ORDER BY event_id;

-- Missing key, or JSON null?
SELECT event_id,
       payload -> 'rows' IS NULL        AS rows_key_missing,
       payload -> 'note' IS NULL        AS note_is_sql_null,
       jsonb_typeof(payload -> 'note')  AS note_json_type,
       payload ->> 'note' IS NULL       AS note_text_is_null
FROM job_events
WHERE event_id IN (4, 6)
ORDER BY event_id;

-- json keeps the text, jsonb cleans it
SELECT '{"a":1,"a":2}'::json::text  AS json_text,
       '{"a":1,"a":2}'::jsonb::text AS jsonb_text;

-- Text compares as text: a classic JSON bug
SELECT (payload ->> 'rows') > '9'       AS text_compare_wrong,
       (payload ->> 'rows')::int > 9    AS number_compare_right
FROM (SELECT '{"rows":120}'::jsonb AS payload) AS t;`,
      note: 'Job 4 has no rows key, so its rows value is NULL. For job 6, "note": null is a JSON null: the -> operator returns the JSON value (type "null"), while ->> returns a SQL NULL. The two JSON types differ on duplicate keys. And "120" compared with "9" as text is false, because text compares character by character, so cast to a number before you compare.',
    } },
    { warn: '`->>` always gives **text**. A comparison or sort on `payload ->> \'rows\'` is a text comparison, so 120 sorts before 9. Cast the value first: `(payload ->> \'rows\')::int`. Cast failures stop the whole query (`\'abc\'::int` raises an error), so when a field can hold junk, clean it before you cast.' },
    `## Searching documents
Three operators cover most filters, and all of them can use an index (see below):

- **\`@>\` contains.** \`payload @> '{"status":"failed"}'\` is true when the document contains that key with that value. It works on nested objects: \`payload @> '{"uploader":{"role":"admin"}}'\`.
- **\`?\` has a key or an element.** \`payload ? 'rows'\` asks if the top-level key exists. On an array, \`payload -> 'tags' ? 'payroll'\` asks if the array contains that text. \`?|\` means "any of these", \`?&\` means "all of these".
- **\`jsonb_array_length(...)\`** counts the elements of an array.

\`jsonb_path_query\` and the \`@?\` operator speak the JSON path language (\`$.errors[*].rule\`) for harder questions, but \`@>\` and \`?\` solve most day-to-day filters.

## From a document to rows
A list inside a document is not something you can \`GROUP BY\`. You must first turn it into **rows**. The set-returning functions do that, and you call them in \`FROM\` after a comma, so each document is joined to its own elements:

- \`jsonb_array_elements_text(arr)\` gives one row per element, as text (the tags).
- \`jsonb_each(obj)\` gives one row per key and value of an object.
- \`jsonb_to_recordset(arr) AS x(rule text, emp_id int)\` gives one row per element **with typed columns**. This is the most useful of the three for arrays of objects.`,
    { sketch: { w: 760, h: 285, caption: 'jsonb_to_recordset turns the errors array of every document into rows with real columns. After that you can GROUP BY like anywhere else.', items: [
      { t: 'table', x: 20, y: 56, title: 'job_events.payload -> errors', cols: ['job_id', 'errors (an array)'], colW: [90, 160], rows: [['J-1001', '2 elements'], ['J-1005', '3 elements']] },
      { t: 'arrow', x1: 285, y1: 90, x2: 352, y2: 90, label: 'jsonb_to_\nrecordset', lx: 0, ly: -36 },
      { t: 'table', x: 360, y: 56, title: 'one row per element', cols: ['job_id', 'rule', 'emp_id'], colW: [80, 150, 80], rows: [['J-1001', 'IFSC_INVALID', '7'], ['J-1001', 'IFSC_INVALID', '14'], ['J-1005', 'PAN_MISSING', '9'], ['J-1005', 'PAN_MISSING', '18'], ['J-1005', 'IFSC_INVALID', '7']], fill: 'green' },
      { t: 'note', x: 20, y: 160, w: 300, h: 66, fill: 'yellow', size: 15, text: 'Jobs with an empty errors list\nproduce no rows at all, and so\ndoes job 4 (no errors key).' },
      { t: 'note', x: 360, y: 236, w: 380, h: 36, fill: 'blue', size: 15, text: 'GROUP BY rule: IFSC_INVALID 3, PAN_MISSING 2' },
    ] } },
    { sql: {
      title: 'Searching documents and taking them apart',
      setup: SETUP,
      starter: `-- Filters: contains, has key, has tag
SELECT event_id, payload ->> 'job_id' AS job
FROM job_events
WHERE payload @> '{"status":"failed"}'
ORDER BY event_id;

SELECT event_id, payload ->> 'job_id' AS job
FROM job_events
WHERE payload -> 'tags' ? 'payroll'          -- jobs tagged payroll
  AND payload ? 'errors'                      -- and that have an errors key
ORDER BY event_id;

-- One row per tag
SELECT e.event_id, tag
FROM job_events e, jsonb_array_elements_text(e.payload -> 'tags') AS tag
ORDER BY e.event_id, tag;

-- One row per error, with typed columns
SELECT e.payload ->> 'job_id' AS job, x.rule, x.emp_id
FROM job_events e, jsonb_to_recordset(e.payload -> 'errors') AS x(rule text, emp_id int)
ORDER BY job, x.emp_id;

-- Which rule fails most often?
SELECT x.rule, COUNT(*) AS errors
FROM job_events e, jsonb_to_recordset(e.payload -> 'errors') AS x(rule text, emp_id int)
GROUP BY x.rule
ORDER BY errors DESC, x.rule;`,
      note: 'The failed jobs are events 1 and 5. The payroll-tagged jobs that have an errors key are events 1, 2 and 5. Five error rows come out of the recordset call, and the count per rule is IFSC_INVALID 3 and PAN_MISSING 2. Jobs 2, 3 and 6 have an empty list and job 4 has no list, so they add no rows.',
    } },
    `## From rows to documents
The other direction is just as common: an API must **return** JSON. Three building blocks do it:

- \`jsonb_build_object('key', value, ...)\` builds an object from pairs.
- \`jsonb_agg(expr)\` is an **aggregate** that collects values into a JSON array.
- \`to_jsonb(row)\` turns a whole row into an object, with the column names as keys.

Combine them to build "customer with their big orders". There is one trap, and it is a join trap you already know. For a customer with **no** matching order, a \`LEFT JOIN\` produces one row of NULLs, and \`jsonb_agg\` collects that NULL into \`[null]\`. A client expecting \`[]\` then breaks. Filter the NULLs out of the aggregate and give the empty result a default:

\`\`\`sql
COALESCE(jsonb_agg(o.order_id) FILTER (WHERE o.order_id IS NOT NULL), '[]'::jsonb)
\`\`\`
Also remember the lesson on joins: the \`amount >= 300000\` test belongs in the **ON** clause of the LEFT JOIN, otherwise customers without big orders would disappear.`,
    { sql: {
      title: 'Building JSON documents from tables',
      starter: `-- Each customer with their orders of 3,00,000 or more, as one JSON document
SELECT jsonb_build_object(
         'customer_id', c.customer_id,
         'name',        c.customer_name,
         'big_orders',  COALESCE(
                          jsonb_agg(jsonb_build_object('order_id', o.order_id, 'amount', o.amount)
                                    ORDER BY o.order_id) FILTER (WHERE o.order_id IS NOT NULL),
                          '[]'::jsonb)
       ) AS doc
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.amount >= 300000
WHERE c.customer_id IN (2, 9, 11)
GROUP BY c.customer_id, c.customer_name
ORDER BY c.customer_id;

-- The trap: without FILTER, a customer with no big order gets [null]
SELECT jsonb_agg(o.order_id) AS without_filter
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.amount >= 300000
WHERE c.customer_id = 11;

-- A whole row as JSON
SELECT to_jsonb(c) AS row_as_json
FROM (SELECT customer_id, customer_name, city FROM customers WHERE customer_id = 1) AS c;`,
      note: 'Blue Lotus Hotels (2) has three orders of 3,68,000 (orders 74, 174 and 189), Indus Textiles (9) has one (order 147) and Kite Media (11) has none, so its list is []. The trap query shows [null]. The to_jsonb call gives {"city": "Chennai", "customer_id": 1, "customer_name": "Apex Retail"}.',
    } },
    `## Changing a document, and indexing it
\`jsonb\` values are replaced, not edited in place. The operators return a **new** value that you then store with an \`UPDATE\`:

\`\`\`sql
jsonb_set(payload, '{status}', '"retry"')           -- replace one value (the new value is JSON, so it needs quotes)
jsonb_set(payload, '{uploader,role}', '"admin"')    -- nested path
payload || '{"reviewed": true}'                      -- add or overwrite keys
payload - 'tags'                                     -- remove a key
\`\`\`
\`jsonb_pretty(payload)\` formats a document so a person can read it.

An ordinary B-tree index cannot look **inside** a document. Two index types are used for JSONB:

- **GIN** (\`CREATE INDEX … USING GIN (payload)\`) indexes every key and value of every document. It speeds up \`@>\`, \`?\`, \`?|\` and \`?&\`. The variant \`GIN (payload jsonb_path_ops)\` is smaller and faster but only supports \`@>\`.
- A normal **B-tree on an expression**, \`CREATE INDEX … ((payload ->> 'status'))\`, speeds up equality and sorting on **one** field you query constantly.

Only about six rows live in the playground, so you cannot see the speed difference here. The performance module shows how to prove an index works with \`EXPLAIN\`.`,
    `## Arrays
PostgreSQL columns can also hold **arrays**: \`text[]\`, \`int[]\`. You write them \`ARRAY['payroll','bank']\` or \`'{payroll,bank}'\`. Differences from JSON arrays to keep in mind: SQL arrays are **typed** (every element has the same type) and are counted from **1**, so \`(ARRAY[10,20,30])[1]\` is 10, and an index outside the array (0 or 4) returns NULL, not an error.

| You want | Expression |
|---|---|
| is a value in the array | \`'payroll' = ANY(tags)\` |
| contains all of these | \`tags @> ARRAY['payroll','bank']\` |
| shares any element | \`tags && ARRAY['gl','bank']\` |
| rows from an array | \`UNNEST(tags)\`, or \`UNNEST(tags) WITH ORDINALITY\` for positions |
| array from rows | \`ARRAY_AGG(col ORDER BY …)\` |
| length | \`ARRAY_LENGTH(tags, 1)\`, \`CARDINALITY(tags)\` |

\`ARRAY_AGG\` is how you make "one line per department with all the names": \`ARRAY_AGG(emp_name ORDER BY emp_id)\`.`,
    { sql: {
      title: 'Changing JSON, indexing it, and arrays',
      setup: SETUP,
      starter: `-- Changing a document returns a new value (nothing is stored until you UPDATE)
SELECT jsonb_set(payload, '{status}', '"retry"')            AS new_status,
       jsonb_set(payload, '{uploader,role}', '"admin"')     AS nested_change,
       payload || '{"reviewed": true}'                        AS with_flag,
       payload - 'tags'                                       AS without_tags
FROM job_events
WHERE event_id = 4;

-- Two JSONB indexes and one expression index
CREATE INDEX ix_events_payload   ON job_events USING GIN (payload);
CREATE INDEX ix_events_pathops   ON job_events USING GIN (payload jsonb_path_ops);
CREATE INDEX ix_events_status    ON job_events ((payload ->> 'status'));
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'job_events' ORDER BY indexname;

-- Arrays
SELECT tags,
       tags[1]                           AS first_tag,
       CARDINALITY(tags)                 AS n,
       'payroll' = ANY(tags)             AS has_payroll,
       tags @> ARRAY['payroll', 'bank']  AS has_both,
       tags && ARRAY['gl']               AS overlaps_gl,
       tags[0]                           AS zero_is_null
FROM (VALUES (ARRAY['payroll', 'bank']), (ARRAY['gl'])) AS t(tags);

-- Rows into an array, and an array back into rows with positions
SELECT department, ARRAY_AGG(emp_name ORDER BY emp_id) AS people
FROM employees
GROUP BY department
ORDER BY department
LIMIT 3;

SELECT x, i FROM UNNEST(ARRAY['p', 'q', 'r']) WITH ORDINALITY AS t(x, i);`,
      note: 'Job 4 keeps its original document everywhere except the one change you asked for, and the nested change leaves the status as it was. pg_indexes lists the GIN, the jsonb_path_ops and the B-tree expression index, plus the primary key. In the array query, the first row has two tags, the second has one, and tags[0] is NULL because SQL arrays start at 1.',
    } },
    `## When not to use JSON
JSON is flexible, and that flexibility has a price. Keep **real columns** for:
- fields you **filter, join, sort or aggregate on all the time** (status, amount, entity). They are faster and the planner knows their statistics;
- anything that needs a **foreign key**, a \`NOT NULL\`, a \`CHECK\` or a proper type (a date inside JSON is just text);
- numbers you do arithmetic on (cast every time, and remember the text-compare bug).

JSON is the right place for **uneven** data: a payload that differs per event, a vendor response whose shape you do not control, extra attributes that few rows have. A good pattern for pipelines, which you will meet again in the dlt and dbt phases: **land the raw JSON as it arrives** (a \`jsonb\` column), then **extract the fields you need into typed columns** in a cleaned table. You never lose the original, and your reports run on proper columns. The same advice applies to arrays: use them for small, unordered lists such as tags. If the elements need their own attributes or you join on them, make a child table.`,
    `## Practice
Each challenge uses the same six job documents as the playgrounds, added to your query as a short \`WITH\` block. Column names do not matter, but the number and order of columns do.`,
    { challenge: {
      id: 'sql-json-arrays-ch1',
      level: 'easy',
      ordered: true,
      prompt: 'List the **failed** jobs: `job_id, uploader_name, rows` (the job id, the name of the uploader and the number of rows as a whole number), sorted by `job_id`. Use `->>` and a cast. (2 rows: J-1001 and J-1005.)',
      starter: `${CTE}
SELECT payload ->> 'job_id' AS job_id
FROM job_events
ORDER BY job_id`,
      hint: "WHERE payload ->> 'status' = 'failed' (or payload @> '{\"status\":\"failed\"}'), then payload -> 'uploader' ->> 'name' and (payload ->> 'rows')::int.",
      solution: `${CTE}
SELECT payload ->> 'job_id' AS job_id,
       payload -> 'uploader' ->> 'name' AS uploader_name,
       (payload ->> 'rows')::int AS rows
FROM job_events
WHERE payload @> '{"status":"failed"}'
ORDER BY job_id`,
    } },
    { challenge: {
      id: 'sql-json-arrays-ch2',
      level: 'medium',
      ordered: true,
      prompt: 'Which validation rule fails most often? Return `rule, errors`: every rule that appears in the `errors` arrays and how many times, sorted by `errors` from highest to lowest, then by `rule`. (2 rows: IFSC_INVALID with 3 and PAN_MISSING with 2.)',
      starter: `${CTE}
SELECT 1`,
      hint: 'FROM job_events e, jsonb_to_recordset(e.payload -> \'errors\') AS x(rule text, emp_id int), then GROUP BY x.rule.',
      solution: `${CTE}
SELECT x.rule, COUNT(*) AS errors
FROM job_events e, jsonb_to_recordset(e.payload -> 'errors') AS x(rule text, emp_id int)
GROUP BY x.rule
ORDER BY errors DESC, x.rule`,
    } },
    { challenge: {
      id: 'sql-json-arrays-ch3',
      level: 'hard',
      ordered: true,
      prompt: 'Payroll jobs with IFSC problems. For jobs that have the tag **payroll** and at least one `IFSC_INVALID` error, return `job_id, ifsc_errors` (how many such errors the job has), sorted by `job_id`. (2 rows: J-1001 with 2 and J-1005 with 1.)',
      starter: `${CTE}
SELECT 1`,
      hint: "Combine payload -> 'tags' ? 'payroll' with jsonb_to_recordset(e.payload -> 'errors'), keep x.rule = 'IFSC_INVALID', and GROUP BY the job id.",
      solution: `${CTE}
SELECT e.payload ->> 'job_id' AS job_id,
       COUNT(*) AS ifsc_errors
FROM job_events e, jsonb_to_recordset(e.payload -> 'errors') AS x(rule text, emp_id int)
WHERE e.payload -> 'tags' ? 'payroll'
  AND x.rule = 'IFSC_INVALID'
GROUP BY e.payload ->> 'job_id'
ORDER BY job_id`,
    } },
    { real: 'You will meet JSON in three places in this course and in your job: **API responses** (FastAPI returns what `jsonb_build_object` and `jsonb_agg` build), **logs and events** (every job, webhook and audit trail is a document), and **vendor files** (nested exports from ERPs and banks). The habit that saves you: keep the raw document in a `jsonb` column, write one view that extracts the typed columns you need, and let every report read the view. When the vendor adds a field, nothing breaks, and when a number looks wrong you can open the original document.' },
    { interview: '"What is the difference between JSON and JSONB, and how do you query a field inside a JSONB column fast?" Model answer: "JSON stores the exact text and re-parses it on every read, while JSONB stores a parsed binary form, drops duplicate keys and does not keep key order, but it supports operators like `@>` and indexing. I use JSONB. For containment and key-existence queries I create a GIN index; for equality on one hot field I create a B-tree index on the expression `(payload ->> \'status\')`. If a field is used in most queries, joins or constraints, I move it out of JSON into a real column." Follow-ups: "What does `->>` return?" (text, so cast before comparing numbers) and "How do you turn an array in a document into rows?" (`jsonb_array_elements` or `jsonb_to_recordset` in FROM).' },
    `## Recap
- Use **\`jsonb\`**, not \`json\`: it is parsed, supports \`@>\` and indexes, and drops duplicate keys. \`json\` keeps the exact text.
- \`->\` returns JSON, \`->>\` returns **text** (cast before comparing numbers), \`#>>\` follows a path. A missing key gives SQL NULL; a JSON \`null\` is a value that \`->\` returns and \`->>\` turns into SQL NULL.
- Search with \`@>\` (contains), \`?\` (key or element exists), \`?|\`, \`?&\`. Index with **GIN** for those, or a B-tree on an expression for one hot field.
- Documents to rows: \`jsonb_array_elements_text\`, \`jsonb_each\`, and \`jsonb_to_recordset(arr) AS x(col type, …)\`, called in \`FROM\` after a comma. Rows to documents: \`jsonb_build_object\`, \`jsonb_agg\`, \`to_jsonb\`. After a LEFT JOIN, use \`FILTER (WHERE … IS NOT NULL)\` and \`COALESCE(…, '[]')\` so an empty list is \`[]\`, not \`[null]\`.
- Change with \`jsonb_set\`, \`||\` and \`-\`; the whole value is replaced.
- SQL arrays are typed and start at 1: \`ANY\`, \`@>\`, \`&&\`, \`UNNEST\`, \`ARRAY_AGG\`. Use JSON and arrays for uneven or small data. Keep real columns for fields you filter, join, constrain or calculate on.`,
  ],
  quiz: [
    { q: 'What is the difference between `payload -> \'status\'` and `payload ->> \'status\'`?', o: ['-> returns JSON, ->> returns text', '-> is for arrays and ->> is for objects', '-> returns text, ->> returns JSON', 'They are the same'], a: 0, why: 'The single arrow keeps the value as JSON (a string still has its quotes). The double arrow converts it to plain text, which you may then cast.' },
    { q: 'Which type should you normally choose for JSON data you will query?', o: ['json, because it is faster to write', 'text, because it is simplest', 'jsonb, because it is parsed, supports containment operators and can be indexed', 'xml'], a: 2, why: 'jsonb is stored in a parsed binary form. It supports @>, ? and GIN indexes. json keeps only the original text.' },
    { q: 'What does `payload @> \'{"status":"failed"}\'` test?', o: ['That the document has exactly one key', 'That the document contains the key status with the value failed', 'That status is not NULL', 'That the status text starts with f'], a: 1, why: '@> means "contains": every key and value on the right must be present in the document on the left (it works on nested structures too).' },
    { q: 'You filter `payload @> …` on a table with millions of documents. Which index helps?', o: ['A B-tree on the whole payload', 'A hash index on the table', 'No index can help with JSONB', 'A GIN index on the payload column'], a: 3, why: 'A GIN index stores every key and value, so it can answer containment and key-existence searches. A plain B-tree cannot look inside a document.' },
    { q: 'A customer has no matching orders and you run `jsonb_agg(o.order_id)` after a LEFT JOIN. What do you get, and what is the fix?', o: ['[] and no fix is needed', 'An error', '[null]; use FILTER (WHERE o.order_id IS NOT NULL) and COALESCE(…, \'[]\')', 'NULL; use DISTINCT'], a: 2, why: 'The LEFT JOIN produces one row of NULLs and jsonb_agg collects that NULL. FILTER removes it, and COALESCE gives an empty aggregate the value [].' },
    { q: 'When should a field inside a JSON document become a real column?', o: ['When you filter, join, sort or constrain on it all the time', 'Only when the table has fewer than 100 rows', 'Never: JSON is always better', 'Only when the value is text'], a: 0, why: 'Real columns have types, statistics, constraints and foreign keys, and they are faster to filter on. Keep JSON for uneven or rarely used attributes.' },
  ],
  task: {
    title: 'Query a job log on your laptop',
    steps: [
      'In DBeaver (database fde_practice), create `16_json_arrays.sql` in `C:\\sql-practice`. Create the `job_events` table with the six documents (copy the table from the lesson, or paste the CREATE TABLE and INSERT you build from it).',
      'Query 1: job, uploader, rows and first error rule for all six jobs (job 4 has NULL rows). Query 2: the failed jobs and the jobs tagged payroll, using `@>` and `?`.',
      'Query 3: the error list expanded with `jsonb_to_recordset` and the count per rule (expect IFSC_INVALID 3, PAN_MISSING 2).',
      'Query 4: build one JSON document per customer with their orders of 3,00,000 or more (expect customer 2 with three orders and customer 11 with an empty list `[]`). Then remove the FILTER and see `[null]`.',
      'Query 5: create the GIN index and the expression index on `status`, then list them from `pg_indexes`. Write one comment about which field of this log you would turn into a real column first, and why.',
    ],
    deliverable: '`16_json_arrays.sql` with five commented queries; the counts 2 failed jobs, IFSC_INVALID 3 / PAN_MISSING 2, and the documents with `[]` and `[null]` appear in your results.',
  },
};
