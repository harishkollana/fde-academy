# Build tasks — V2 deep-dive journey (status as of 5 Oct 2026)

Legend: ✅ done · 🟡 partly done · ⬜ not started.
**Work on ONE task per session.** The curriculum (every lesson id, title and what it covers) is in `docs/roadmap-v2/`; the lesson lists there are the contract. Live counts: `npm run status` (planned vs written per phase, plus plan errors) and `npm run status -- --missing <phase-id>` (the lessons still to write in one phase). After editing the roadmap docs run `npm run plan`.

**Every content task:** read `src/content/phases/CLAUDE.md`, `docs/CONTENT_SPEC.md` (esp. §11 V2 depth rules), `docs/roadmap-v2/00-index.md`, the stage file for your phase, `docs/example-lesson.js`, and two finished lessons (e.g. `src/content/phases/sql/sql-select.js`, `src/content/phases/python/python-collections.js`). Write only the ⬜ lessons, one file each in `src/content/phases/<phase-id>/<lesson-id>.js`, wire them into `src/content/phases/<phase-id>.js`, run `npm run validate -- src/content/phases/<phase-id>.js` until 0 errors, run `npm run status`, then update this file.

---
## Done
- **Infrastructure** ✅ — components (Sketch, Md, Blocks, Quiz, Editor, SqlPlayground, PyPlayground, Challenge), `src/lib/*` (store, in-browser PostgreSQL via PGlite, Pyodide), `src/data/*` (Kollana Tech dataset), validator, Dockerfile/nginx/compose, 12 of 17 widgets (JoinVisualizer, WindowViz, RegexTester, FuzzyMatch, FlowSimulator, CronHelper, GitGraph, ApiPlayground, JwtDecoder, DockerCache, MedallionStepper, TokenCost).
- **App shell, pages, styles** ✅ — all pages, tested in a real browser at 1280px and 390px (no console errors).
- **V2 re-plan** ✅ (4 Oct 2026) — `docs/ROADMAP.md` completed from the PDF; `docs/roadmap-v2/` written (11 stages, 39 phases + 6 optional, 376 + 31 lessons); app reworked for it: `meta.js` (stages, phases, gates, projects; no weeks or durations), auto-loading `phases/`, `plan.json`, stage-grouped sidebar, N-station roadmap map, stage overview, phase pages with planned lessons, optional gates/projects, rescaled XP levels; `npm run plan` / `npm run status`.
- **Stage 0 / Phase 0 `foundations` is COMPLETE (5 Oct 2026): 22 of 22 lessons**, all validated 0/0 and exercised in a real browser. Next task: **T03** (`sql` modules A–E). Browser-only bug to remember: Pyodide has no `hashlib.pbkdf2_hmac` (see `docs/LESSON_BRIEF.md`). Earlier note on Phase 0 (4 Oct): 14 lessons finished and validated; `glossary.js` already holds 283 foundations terms and `interview.js` 52 foundations Q&As (both validate; later tasks T40/T41 append for other phases and fill `star`/`systemDesign`). `docs/LESSON_BRIEF.md`, `scripts/quiz-balance.mjs` and `scripts/sql-run.mjs` were added for lesson writers. The Python playground and Python/SQL auto-grading were confirmed working in a real browser.
- **Roadmap revision ✅ (5 Oct 2026, Harish's request: a real end-to-end Azure data product with a React app as the end product, API phases before Azure).** `docs/roadmap-v2/`: new stage file `04-apis-web.md` (Stage 3: `http-rest` and `fastapi` moved here, new `react-dashboards`, 10 lessons); stage files 04–11 renamed 05–12; `azure` +3 lessons (`azure-postgres-lab`, `azure-sql-lab`, `azure-vm-lab`); `entra` +1 (`entra-register-api-and-spa`); new phase `azure-e2e` (13 lessons) closing Stage 5 "Ship it", which now owns Project C and Gate C. Totals: **41 main phases, 12 stages, 403 lessons** (was 39 / 11 / 376). App: `meta.js` (new stage `apis`, new phases, reordered, optional stage index 12), stubs `phases/react-dashboards.js` and `phases/azure-e2e.js`, XP levels in `src/lib/store.jsx` (13 levels, scaled for 403 lessons), `plan.json` regenerated. `npm run status`: no problems. Tasks T17/T18 now come before T14; new tasks T49 and T50 (table below). Nothing else was changed: written lessons are untouched.
- **Phase 1 `sql` modules A–E is COMPLETE (5 Oct 2026): 14 of 14 lessons** (`sql-setup`, `sql-select`, `sql-operators`, `sql-nulls`, `sql-case-cast`, `sql-aggregates`, `sql-conditional-agg`, `sql-rollup`, `sql-joins`, `sql-joins-advanced`, `sql-subqueries`, `sql-ctes`, `sql-window-ranking`, `sql-window-analytics`), wired in `src/content/phases/sql.js`, whole phase validates 0/0. `node scripts/qa-crawl.mjs sql` ran 40 playgrounds in a real browser with no console errors, and every new sketch was checked by screenshot. Next task: **T04** (`sql` modules F–J).
- **Phase 1 `sql` is COMPLETE (5 Oct 2026): 38 of 38 lessons.** T05 added the last 10: `sql-performance`, `sql-indexes-deep`, `sql-explain-deep`, `sql-partitioning-maintenance`, `sql-incremental-loads`, `sql-scd2`, `sql-advanced-patterns`, `sql-data-quality`, `sql-dialects`, `sql-interview-method`. **Total written now: 63 of 376** (22 foundations + 38 sql + 2 python + 1 dlt). Next task: **T06** (`python` modules A–C).
- Earlier note: **Phase 1 `sql` modules F–J is COMPLETE (5 Oct 2026): 14 more lessons** (`sql-dates`, `sql-strings-regex`, `sql-json-arrays`, `sql-set-ops`, `sql-reconciliation`, `sql-dml`, `sql-upsert-merge`, `sql-transactions-isolation`, `sql-locks-deadlocks`, `sql-ddl`, `sql-modelling`, `sql-functions-procedures`, `sql-roles-security`, `sql-ops-backup`). **Total written now: 53 of 376** (22 foundations + 28 sql + 2 python + 1 dlt).

---
## Simulators first (needed by the lessons that use them)
| Task | Build | Needed before | Status |
|---|---|---|---|
| W | The 5 AI stubs → full: `RagSearch`, `ToolCallDemo`, `AgentGraph`, `GuardrailTester`, `EvalRunner` (spec: CONTENT_SPEC §7; `src/widgets/extra.css`) | `vector-db`, `rag`, `llm-apis`, `evals`, `guardrails`, `langgraph` | ⬜ (stubs exist) |
| W2a | `LoadBalancer`, `OAuthFlow`, `DnsResolver`, `RetryBackoff` | `foundations` modules B–D | ✅ built (`src/widgets/`, styles in `extra.css`). LoadBalancer, DnsResolver, OAuthFlow clicked through in a real browser. RetryBackoff also tested in the browser (its "busiest second" metric was changed to count only attempts after the server recovers, which is the honest measure). |
| W2b | `IsolationLevels`, `ExplainViz`, `ScdViz` | `sql` modules H, K, L; `modelling` | `IsolationLevels` ✅ built (real mini-MVCC engine, 7 scenarios x 4 levels checked in Node and in the browser); `ExplainViz` ✅ built 5 Oct 2026 (`src/widgets/ExplainViz.jsx` + `explainEngine.js`: real EXPLAIN ANALYZE on a 1,00,000-line table, 18 scenario/lever combinations clicked in the browser at 1280 and 390 px); `ScdViz` ✅ built 5 Oct 2026 (`ScdViz.jsx` + `scdEngine.js`: 3 scenarios x 3 SCD types x 2 loaders, invariants tested in Node, clicked in the browser) |
| W2c | `ShuffleViz`, `KafkaPartitions`, `DagViz` | `spark`, `kafka`, `airflow`, `dagster` | ⬜ |
Specs for W2: `docs/roadmap-v2/00-index.md` ("New simulators"). Each must be deterministic, dependency-free, styled in `src/widgets/extra.css`, registered in `src/widgets/index.js` **and** in `WIDGETS` in `scripts/validate-content.mjs`.

---
## Content tasks, in journey order
| Task | Phase(s) → lessons | Also | Status |
|---|---|---|---|
| T01 | `foundations` modules A–C (14) | | ✅ 14 lessons written, wired in `src/content/phases/foundations.js`, validated 0 errors / 0 warnings |
| T02 | `foundations` modules D–F (8) | | ✅ all 8 written and wired; whole phase validates 0/0; `node scripts/qa-crawl.mjs foundations` ran all 22 lessons and 38 playgrounds in a real browser with no problems (5 Oct 2026) |
| T03 | `sql` modules A–E (14; 3 earlier + 11 new) | | ✅ 14/14 written and wired in `src/content/phases/sql.js`; phase validates 0/0; browser crawl clean for the new lessons (5 Oct 2026) |
| T04 | `sql` modules F–J (14) | needs W2b for `sql-transactions-isolation` | ✅ 14/14 written and wired, whole phase validates 0/0, browser QA done (5 Oct 2026): `qa-crawl.mjs sql` 28 lessons / 91 playgrounds clean, all 35 new sketches screenshotted (10 had text overflowing its box and were fixed), IsolationLevels clicked through in both lessons that embed it (28 combinations each, desktop and phone) |
| T05 | `sql` modules K–M (10) | needs W2b (`ExplainViz`, `ScdViz`) | ✅ 10/10 written and wired (modules `sql-mod-performance`, `sql-mod-data-engineering`, `sql-mod-dialects-interviews`), whole phase validates 0/0, `qa-crawl.mjs sql` = 38 lessons / 133 playgrounds clean in the browser, all new sketches screenshotted and fixed, both new widgets clicked through inside their lessons (5 Oct 2026). The SQL phase is COMPLETE (38 of 38). |
| T06 | `python` modules A–C (12; 2 ✅ → 10 to write) | | ✅ 12/12 written (6 on 5 Oct, the last 6 on 6 Oct 2026: `python-decorators-context-managers`, `python-oop-dataclasses`, `python-typing-pydantic`, `python-errors`, `python-files`, `python-text-time-money`); validated 0/0 and every playground and challenge run in real Pyodide. Final QA done 7 Oct 2026 together with T07 (quiz answer audit, sketch screenshots, browser crawl: see T07). |
| T07 | `python` modules D–G (14) | | ✅ 14/14 written (13 on 6 Oct 2026: concurrency, asyncio, performance; logging-config, testing-pytest, quality-debugging, environments-packaging, cli; databases, http-apis, scheduling, security-secrets; algorithms-de; the last one, `python-interview-method`, on 7 Oct 2026). **The `python` phase is COMPLETE: 26 of 26 lessons**, whole phase validates 0/0, `npm run status` clean. QA done 7 Oct 2026: (1) every quiz answer of all 25 other lessons was read and checked against real Python (3 fixes: `python-oop-dataclasses` Q4 wrong `a`, `python-functions` Q2 missing function body, `python-setup-types` Q6 balance; `python-security-secrets` wording of `yaml.load` made precise); (2) all sketches of the 14 lessons listed in RESUME were screenshotted and fixed; (3) `node scripts/qa-crawl.mjs python` = 26 lessons / 96 playgrounds, no console errors, no overflow at 1280 or 390 px; (4) app bug fixed: a quiz question with several inline code spans overflowed at phone width (`.q-text` is a flex row, so every text node and code span became its own flex item): `Quiz.jsx` now wraps the question in `<span className="q-body">` (`styles.css`). Next: T08 `pandas` |
| T08 | `pandas` (10) | | ✅ 10/10 written on 7 Oct 2026 (session 6): `pandas-basics`, `pandas-groupby-window`, `pandas-combine`, `pandas-dates-text`, `pandas-cleaning` (module `pandas-mod-core`), `pandas-performance`, `pandas-parquet-arrow`, `pandas-excel-openpyxl` (`pandas-mod-scale-formats`), `pandas-validation-testing`, `pandas-reconciliation-lab` (`pandas-mod-quality-lab`). **The `pandas` phase is COMPLETE: 10 of 10**, 1,500-2,100 words each, 3 sketches, 5 playgrounds and 3-4 `pychallenge`s per lesson (all starters fail, all solutions pass, run in real Pyodide), whole phase validates 0/0, `npm run status` clean (97 of 403 lessons written overall). QA done 7 Oct 2026: all 60 quiz answers read and checked against real runs; every sketch screenshotted and fixed; `node scripts/qa-crawl.mjs pandas` = 10 lessons / 50 playgrounds, and the python (26 / 96) and foundations (22 / 38) crawls re-run clean, no console errors, no overflow. **App fix:** `src/lib/py.js` `runPy` now also loads `pyarrow` whenever the code imports pandas (all playgrounds share one interpreter and pandas looks for pyarrow only on its first import, so Parquet and Arrow dtypes broke for the rest of the page session if an earlier playground had run pandas first). Task folder for the whole phase: `C:\fde\pandas-lab`. Verified for real outside the browser: openpyxl packs (`08_pack.py`, `08_check.py`), pandera and pytest output, the Parquet lake script. Next: T09 `git` |
| T09 | `git` (9) | | ⬜ |
| T10 | `modelling` (11) | **Project A** (`proj-a`) + **Gate A** (`gate-a`) | ⬜ |
| T11 | `power-automate` (11) | | ⬜ |
| T12 | `power-bi` (10) | | ⬜ |
| T13 | `copilot-studio` (6) | | ⬜ |
| T17 | `http-rest` (6) | moved BEFORE Azure on 5 Oct 2026 (Stage 3), so do it before T14 | ⬜ |
| T18 | `fastapi` (10) | moved BEFORE Azure on 5 Oct 2026 (Stage 3); `entra-protect-your-api` uses it | ⬜ |
| T49 | `react-dashboards` (10) | NEW 5 Oct 2026 (Stage 3, after `fastapi`). No JavaScript is assumed. Laptop labs only (React does not run in the lesson playgrounds), so no playground blocks; the lab builds the reviewer screen for the Payroll Bank Mandate Validation API | ⬜ |
| T14 | `azure` (14: 11 + 3 new, `azure-postgres-lab`, `azure-sql-lab`, `azure-vm-lab`) | needs T17, T18; every lab ends with a tear-down step | ⬜ |
| T15 | `entra` (12: 11 + 1 new, `entra-register-api-and-spa`) | | ⬜ |
| T16 | `azure-functions` (7) | **Project B** (`proj-b`) + **Gate B** | ⬜ |
| T19 | `docker` (8) | `docker-lab` also containerises the React app | ⬜ |
| T20 | `github-actions` (6) | | ⬜ |
| T21 | `azure-deploy` (8) | no longer closes with Project C (moved to T50) | ⬜ |
| T50 | `azure-e2e` (13) | NEW 5 Oct 2026: Blob, PostgreSQL, FastAPI on Container Apps, Entra sign-in, React app, VM variant. **Project C** (`proj-c`, now "API and Web App") + **Gate C**. Needs T14–T21 and T49 | ⬜ |
| T22 | `dlt` (8; 1 ✅ → 7 to write) and `airbyte` (7) | | 🟡 1/15 |
| T23 | `dbt` (11) | | ⬜ |
| T24 | `adf` (9) | | ⬜ |
| T25 | `airflow` (9) | needs W2c | ⬜ |
| T26 | `dagster` (8) | **Project D** (`proj-d`) + **Gate D**; needs W2c | ⬜ |
| T27 | `spark` (10) | needs W2c | ⬜ |
| T28 | `databricks` (9) | | ⬜ |
| T29 | `snowflake` (9) | | ⬜ |
| T30 | `kafka` (7) | **Project E** (`proj-e`) + **Gate E**; needs W2c | ⬜ |
| T31 | `llm-basics` (6) and `llm-apis` (7) | needs W | ⬜ |
| T32 | `vector-db` (7) | needs W | ⬜ |
| T33 | `rag` (8) | needs W | ⬜ |
| T34 | `evals` (5) and `guardrails` (6) | **Project F** (`proj-f`) + **Gate F**; needs W | ⬜ |
| T35 | `langgraph` (8) | needs W | ⬜ |
| T36 | `mcp` (5) | | ⬜ |
| T37 | `observability` (6) | **Project G** (`proj-g`, flagship) + **Gate G** | ⬜ |
| T38 | `system-design` (9) | | ⬜ |
| T39 | `fde-craft` (6) and `interview-prep` (6) | | ⬜ |
| T40 | `src/content/interview.js` | 6 STAR prompts (exactly the PDF's list), ≥ 10 system-design prompts, ≥ 300 Q&A (ids `iv-<phase>-NN`, topic = phase id) built from each phase's "Interview questions" | ⬜ |
| T41 | `src/content/glossary.js` | ≥ 500 terms, each with `phase: '<phase id>'`, plain English | ⬜ |
| T42 | `src/content/practice.js` (+ `practice/`) | 50 SQL (15 easy / 25 medium / 10 hard) + 30 Python (10/14/6), ids `pr-sql-01…`, `pr-py-01…`; 0 errors AND 0 warnings. Topics must include transactions, JSON, dedupe/gaps-and-islands, incremental loads | ⬜ |

Project/gate content shape: CONTENT_SPEC §8 and §9. Project steps are in the roadmap-v2 stage file (they extend the PDF's steps).

### Optional extended track (only when a job asks; same rules)
T43 `kubernetes` (6) · T44 `terraform` (5) · T45 `bicep` (4) · T46 `fabric` (7) · T47 `duckdb` (5) · T48 `redis` (4) — all ⬜.

---
## Final QA (after each stage, and at the end)
`npm run validate` (0 errors) → `npm run status` (no plan problems) → `npm run build` → click through every page at desktop and phone width → check the console → `docker compose up --build` → open http://localhost:8080. The Docker image has never been built yet.

## Known open points
- Python phase (6 Oct 2026): 25 of 26 lessons are written (all but `python-interview-method`). None of the 23 newer ones has been through `node scripts/qa-crawl.mjs python` (browser crawl at 1280 and 390 px). Their playgrounds and challenges were run in real Pyodide with a helper script and all pass; sketches of the first 14 new lessons were screenshotted and fixed, those of `python-databases`, `python-http-apis`, `python-scheduling`, `python-security-secrets` and `python-algorithms-de` were not yet. All quizzes still need a read-through of the marked answers (one wrong answer index was found and fixed in `python-http-apis`).
- ~~Phone-width overflow in `sql-setup`~~ FIXED (5 Oct 2026): the cause was a long URL in a numbered-list item that could not wrap, not the code blocks. `.md` and `.q-text` now have `overflow-wrap: anywhere` in `src/styles.css`; the sql and foundations crawls are clean at 390 px.
- ~~`sql-select` and `sql-setup` quizzes have 4 answers at B~~ FIXED (5 Oct 2026): every quiz in `src/content/phases/sql/` is now balanced.
- The validator needs Python packages: `pip install pandas==2.3.3 numpy pydantic pyyaml python-dateutil jsonschema pyarrow` (`pyarrow` is needed since the pandas phase: the Parquet lesson runs `to_parquet` and `pyarrow.parquet`). Not yet installed on Harish's PC at the time of writing.
- Gate E (big-data engineer) has **no salary target** on purpose: the PDF has none and salary facts must not be invented; verify against live job posts.
- Python playgrounds need internet once (Pyodide from a CDN). Not yet tested in the browser QA.
- The Instahyre job-search URL pattern on the Gate page is unconfirmed.
- Version drift: lessons for Airflow, dbt, Databricks, Snowflake, Azure, Power Platform, LangGraph and MCP must state the version they were written against.
