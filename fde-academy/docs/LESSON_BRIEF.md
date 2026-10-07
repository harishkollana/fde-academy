# How to write a lesson (the working brief)

Read this before writing any lesson file. It complements `docs/CONTENT_SPEC.md` (the format) with the workflow and the mistakes already made once. Finished examples to imitate: `src/content/phases/foundations/foundations-dns.js` (widget + Python + challenge), `foundations-proxies-load-balancing.js`, `foundations-authorization-secrets.js`, `foundations-data-product.js` (SQL playground + SQL challenge), and `src/content/phases/sql/sql-select.js`.

## The reader
Harish: 4.6 years in finance process automation in India, learning to be a Forward Deployed / data engineer. This app is his ONLY resource. Teach from zero in simple English (B1), short sentences, one idea per paragraph, every term explained the first time. Use Indian finance examples (GL journals, GST, GSTIN, IFSC, PAN, payroll, ₹, FY April–March, MIS packs) and the synthetic Kollana Tech data. No emojis in prose. Warm, direct, no hype. No time estimates, weeks or hours anywhere (he goes at his own pace).

## What a lesson must contain
- 800–1600 words of explanation across the markdown blocks, **concept first**: the problem in his words, then the mental model, vocabulary, how it fails, only then commands.
- At least one hand-drawn `sketch` that shows a mechanism (flow, layers, before/after table), not decoration.
- At least one runnable thing where the browser allows: `{ sql: … }` (real PostgreSQL), `{ py: … }` (Python in the browser), an auto-graded `{ challenge: … }` (SQL) or `{ pychallenge: … }` (Python), or a `{ widget: '…' }`.
- Callouts: `warn`, plus at least one of `interview` (a model answer to a real interview question) and `real` ("in your real job"). `analogy` once if it helps. `local` for exact Windows steps, commands and the OUTPUT TO EXPECT.
- A final markdown block `## Recap` with 3–6 bullets.
- `quiz`: 6 questions, **one per line** exactly like `{ q: '…', o: ['…','…','…','…'], a: 2, why: '…' },` with the correct answer spread across A–D (see tooling below).
- `task`: `{ title, steps: [...], deliverable }` (hands-on, on his laptop).
- Never state prices, quotas, free-tier terms, model names or salary as facts: write "check the current page". Say which tool version a tool lesson was written against.

File shape (see `docs/example-lesson.js`):
```js
export default {
  id: 'foundations-xxx',            // = file name without .js; must start with the phase id + '-'
  title: '…', goal: 'You can …',
  roadmap: ['…', '…'],
  blocks: [ `markdown`, { sketch: {…} }, { py: {…} }, { widget: 'LoadBalancer' }, { warn: '…' }, … `## Recap …` ],
  quiz: [ … ],
  task: { title: '…', steps: ['…'], deliverable: '…' },
};
```

## Escaping: the mistakes already made once
1. Markdown blocks are JS **template literals**: write `\`` for a backtick and `\${` for a literal `${`. A single-quoted callout string needs `\'` for an apostrophe (and `\`` is fine for a backtick).
2. **Python code inside a template literal**: a backslash must be doubled. To get `"\n"` in the Python source, type `\\n` in the file. `\\s` → regex `\s`. Same for `starter`, `tests`, `solution`.
3. **Sketch text**: use a single `\n` for a line break (`'column\nrenamed'`). Never `\\n` there.
4. `${…}` inside tests or text (for example a placeholder like `${DB_PASSWORD}`) must be written `\${DB_PASSWORD}`.
5. The renderer for `prompt`, `note`, `hint`, quiz text and callout `text` fields is **inline only**: no lists, no line breaks, no `~~strike~~`. Put numbered steps in one sentence: "(1) … (2) …". Full markdown (lists, tables, code fences, headings) works only in the plain-string blocks.
6. A markdown table needs a header row and a `|---|` row. Pipes inside cells break it.
7. SQL `challenge` solutions must be ONE `SELECT`/`WITH` statement returning at least one row. Tell the learner exactly which columns to return and in which order.
8. A `pychallenge` **starter must FAIL the tests** and the solution must pass them. Ask for a function with a fixed name and signature. Tests are plain `assert`s (an exception in the tests = fail). To assert that something raises, use `try: … raise AssertionError('expected an error') except ValueError: pass`.
9. Python in the browser (Pyodide) has the standard library, pandas 2.3, numpy, pydantic v2, pyyaml, python-dateutil, jsonschema. **No** requests, httpx, fastapi, sqlalchemy, psycopg, openpyxl, pytest, faker, dotenv, typer, openai, qdrant, dlt, dagster, azure, sockets or network. Show those as fenced code blocks inside markdown or inside a `local` callout, never in a runnable block (the validator rejects them). The working directory has the Kollana CSVs: `dim_entity.csv, dim_bu.csv, dim_account.csv, fx_rates.csv, fact_gl.csv, fact_budget.csv, employees.csv, payroll.csv, purchase_register.csv, supplier_invoices.csv, products.csv, customers.csv, orders.csv`, plus `input/sales_2026-08.csv`, `input/sales_2026-09.csv`. Prefer `hashlib.pbkdf2_hmac`, `hmac`, `secrets`, `base64`, `json`, `ipaddress`, `urllib.parse`, `re`, `datetime`, `decimal`, `collections`, `itertools`, `heapq`, `random` with a fixed seed, `time` for timings. Avoid `hashlib.scrypt`. **The browser's Python has NO `hashlib.pbkdf2_hmac`** (and no `threading` threads, `multiprocessing`, `socket`, `ssl`, `sqlite3`): the local validator will NOT catch this because your local Python has them. Either avoid them, or write the code to fall back to a pure-Python version when `hasattr(hashlib, "pbkdf2_hmac")` is false (see `foundations-authentication.js`). Browser timers are coarse: time 10,000 repetitions and average instead of timing one call. After writing a lesson, the only real proof is running its playgrounds in the app (the crawl script approach: serve `npm run build` with `vite preview` and click Run on every playground).
10. Keep each browser run under a few seconds. Make outputs deterministic where you quote them in text.
11. Check **every number you state about the Kollana data** against the database: `node scripts/sql-run.mjs "SELECT …"` (see CONTENT_SPEC §6 for the tables and the planted quirks). For Python facts, run the code.
12. Widgets that exist: `JoinVisualizer WindowViz RegexTester FuzzyMatch FlowSimulator CronHelper GitGraph ApiPlayground JwtDecoder DockerCache MedallionStepper TokenCost LoadBalancer OAuthFlow DnsResolver RetryBackoff` (the other AI widgets are still stubs: do not use them). Do not invent a widget name.

## Sketch API (inside `{ sketch: { w: 760, h: 180–460, caption, items: [...] } }`)
Item types (always `t:`): `box {x,y,w,h,label,sub?,fill?,size?}`, `db`, `doc`, `circle {x,y,r,label,fill}`, `cloud`, `person {x,y,label}` (≈80 px tall incl. label), `note {x,y,w,h,text,fill?,size?}`, `arrow {x1,y1,x2,y2,label?,dashed?,color?,bend?,lx?,ly?}`, `line`, `text {x,y,text,size?,color?,anchor?,bold?,font?}`, `table {x,y,cols,rows,colW,rowH?,title?,hl?,dim?,fill?}` (title is drawn 14 px above `y`), `mark {x,y,ok}`, `brace`. Fills: blue green yellow pink orange purple teal grey red white. Everything must stay inside the canvas. Allow about 9 px per character at the default 18 px label size and 7 px at 14 px. Draw MECHANISMS (data flowing, before/after tables, layers), 3–10 items for simple ideas. Look at the finished lessons for coordinates that work.

## Workflow and tools (Windows, PowerShell)
Project root: `E:\youtube\Harish Kollana\FDE\fde-academy`.
1. Write your lesson files in `src/content/phases/<phase-id>/<lesson-id>.js` (one file per lesson).
2. **Validate with a temporary aggregator of your own** so you never depend on other people's half-written files. Create `src/content/_tmp-<yourname>.js`:
   ```js
   import a from './phases/foundations/foundations-xxx.js';
   export default { modules: [{ id: 'tmp-<yourname>', title: 'tmp', lessons: [a] }] };
   ```
   then run (set PYTHON to a Python that has pandas 2.3.3, numpy, pydantic, pyyaml, python-dateutil, jsonschema):
   ```powershell
   $env:PYTHON = "<path to that python.exe>"
   cd "E:\youtube\Harish Kollana\FDE\fde-academy"
   npm run validate -- src/content/_tmp-<yourname>.js
   ```
   You must reach **0 error(s), 0 warning(s)**. The validator really executes every SQL and Python snippet and every challenge solution, and checks starters fail. **Delete your `_tmp-*.js` file when finished.**
3. Balance the quiz answer positions: `node scripts/quiz-balance.mjs src/content/phases/<phase-id>/<lesson-id>.js --fix` (run it on YOUR files only, one path per run), then validate again.
4. Do NOT edit the phase aggregator (`src/content/phases/<phase-id>.js`), other people's lessons, `src/widgets`, `src/components`, `src/lib`, `scripts`, or `docs/roadmap-v2`. Do not run the full build or a dev server. Do not run `npm run validate` without a file argument.
5. When you are done, reply with a SHORT report: files written, validation result, and anything you could not do or decided differently from the plan.
