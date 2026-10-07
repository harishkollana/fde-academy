# FDE Academy — instructions for AI coding agents

This is a React 18 + Vite learning app: Harish's complete, self-contained course on the road to Forward Deployed Engineer / AI Automation / Data Engineer roles. The journey is **41 phases in 12 stages, 403 lessons planned, 7 projects, 7 apply gates; no schedule (no weeks, hours or deadlines: Harish goes at his own pace)**, plus a 6-phase optional track. One tool or topic per phase; concepts first. It must be his ONLY learning resource, so content has to be complete, accurate and taught from zero in simple English.

## Read before doing anything
1. `docs/TASKS.md` — what is done, what is left, which files each task owns. Work on ONE task per session.
2. `docs/roadmap-v2/00-index.md` — the journey: stages, phases, gates, projects, principles. Then the **stage file for your phase** (`01-concepts.md` … `12-career-and-optional.md`). The lesson lists there (ids, titles, what each covers) are the contract.
3. `docs/CONTENT_SPEC.md` — content format, writing style, the practice dataset, block types, sketch (hand-drawn diagram) API, widgets, project/gate schemas, and **§11 V2 depth rules**.
4. `docs/APP_SPEC.md` — app shell, pages, design system, CSS classes (includes the V2 update note).
5. `docs/ROADMAP.md` — the ORIGINAL plan (text of the Notion page, now complete; ignore its week numbers and time rules). The PDF it came from is in the parent folder: `../bd93cce7-2240-4758-8d4c-dce90e4843f2_Harishs_Master_FDE__AI_Automation_Roadmap.pdf`. **V2 supersedes it** wherever they differ (Harish asked for a deeper, one-tool-per-phase plan on 4 Oct 2026); every item in the original is still taught.
6. `docs/LESSON_BRIEF.md` — **the working brief for writing a lesson**: required parts, every escaping mistake already made once, and the validate / quiz-balance / SQL-check workflow. Read it before writing any lesson.
7. `docs/example-lesson.js` and any finished lesson (e.g. `src/content/phases/foundations/foundations-dns.js`, `src/content/phases/sql/sql-select.js`) — the quality bar and exact format.

## Rules
- Content lives in `src/content/phases/`: one aggregator per phase `phases/<phase-id>.js` (auto-loaded by the app, nothing to register) and one lesson per file `phases/<phase-id>/<lesson-id>.js`. Lesson ids start with their phase id (`sql-joins`). Pure-data ES modules (no React). Imports need explicit `.js` extensions.
- Markdown blocks are JS template literals: escape backticks as \` and `${` as `\${`.
- After every 2–3 lessons run `npm run validate -- src/content/phases/<phase-id>.js`. It executes every SQL snippet against the real seeded PostgreSQL (PGlite) and every Python snippet with your local Python. Finish with **0 errors**. Then `npm run status` (plan vs files, must report no problems).
- Validator needs Python with `pip install pandas==2.3.3 numpy pydantic pyyaml python-dateutil jsonschema pyarrow` (pandas 2.3 matches the in-browser Pyodide; pyarrow is needed by the Parquet lesson). Set `PYTHON` env var if `python` is not the right interpreter.
- If you change the curriculum, edit `docs/roadmap-v2/*.md` (keep the line format `- [✅] \`lesson-id\` Title — covers`), run `npm run plan` and `npm run status`, and update `src/content/meta.js` if a phase, duration, gate or project changes.
- Don't edit `src/lib/*`, `src/data/*`, or `src/components/{Sketch,Md,Blocks,Quiz,Editor,SqlPlayground,PyPlayground,Challenge}.jsx` unless fixing a real bug.
- Never invent prices, salary facts, free-tier terms, quotas or model names as facts; use placeholders and "check the current page". Tool-heavy lessons say which version they were written against.
- After finishing a task, update its status in `docs/TASKS.md`.

## Commands
- `npm install` · `npm run dev` (http://localhost:5173) · `npm run build` · `npm run validate`
- `node scripts/sql-run.mjs "SELECT …"` runs SQL on the seeded Kollana database (use it to check every number you quote) · `node scripts/quiz-balance.mjs <lesson-file> [--fix]` spreads the correct quiz answers over A–D
- `npm run plan` regenerates `src/content/plan.json` from the roadmap docs · `npm run status` shows planned vs written lessons per phase and checks the plan
- `npm run seed` regenerates `src/data/seed.sql` + `src/data/csv.js` (deterministic). Don't change the data without updating CONTENT_SPEC §6 and re-validating everything.
- Docker: `docker compose up --build` → http://localhost:8080
- Python playgrounds load Pyodide from the jsDelivr CDN on first use (needs internet once). SQL runs fully offline.
