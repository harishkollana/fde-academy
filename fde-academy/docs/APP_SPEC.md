# FDE Academy — App shell, pages & styles spec

> **V2 update (4 Oct 2026).** The journey is now 41 main phases in 12 stages (+ 6 optional), defined in `docs/roadmap-v2/`. What changed in the app:
> - `src/content/meta.js` holds `STAGES` and `META` (one entry per phase, in journey order; gates and project names are data, not hard-coded). Phase ids are names (`sql`, `power-automate`…); lesson ids start with their phase id (`sql-select`).
> - `src/content/index.js` auto-loads `src/content/phases/<phase-id>.js` (no wiring) and merges `plan.json` (generated from the roadmap docs by `npm run plan`), so a phase page lists every planned lesson and marks unwritten ones "coming soon". Also exports `STAGE_GROUPS`, `plannedLessonCount`, `TOTAL_WEEKS`.
> - Not every phase has a project or gate: only the last phase of a stage does (`phase.projectName`, `phase.gateLetter`). `/project/:phaseId` and `/gate/:phaseId` show a helpful page for phases without one. Optional phases (`phase.optional`) have no weeks and are skipped by "Continue", the weekly plan and the map.
> - Sidebar groups phases under stage headings. Dashboard: `RoadmapMap` lays out any number of stations on a winding road (8, 5 or 3 per row by width), plus a "Every phase, by stage" overview. Phase page: planned + written lessons, previous/next phase.
> - Glossary entries use `phase: '<phase id>'`. XP level thresholds in `src/lib/store.jsx` are scaled for 403 lessons.
> - **No calendar.** There are no weeks, durations, start date, lesson minutes, Mon–Sun plan or deadlines anywhere. "You are here" and the Dashboard's current phase = the first phase whose planned lessons are not all done (`currentPhase`); a gate is "open" when its phase is finished (`gateOpen`), and you may apply earlier. Progress is measured against *planned* lessons (`phaseProgress`). The Dashboard's "What's next" card replaced "This week's plan". Settings has no start date.
> The original page table below predates this: read "phase" as the V2 phase and ignore any week / minutes / start-date / 30-minute-drill wording in it.

React 18 + Vite 5 + react-router-dom 6 (**use HashRouter** so it works behind any static server / Docker nginx without rewrites). Fonts are installed via @fontsource (offline-friendly): import in `src/main.jsx`:
```js
import '@fontsource/kalam/400.css'; import '@fontsource/kalam/700.css';
import '@fontsource/caveat/600.css';
import '@fontsource/nunito/400.css'; import '@fontsource/nunito/600.css'; import '@fontsource/nunito/800.css';
import '@fontsource/jetbrains-mono/400.css';
```

## Aesthetic: "engineer's sketchbook"
A warm paper notebook with ink drawings. Calm, readable, a little playful; never childish.
- Page background: paper `#fbf8f1` with a faint blue dot/grid (CSS background-image, 24px), a red margin line on the left of the main column is a nice touch.
- Ink `#1f2a44` for text and borders; muted `#5c6478`; highlighter yellow `#fff3a3`; accent orange `#e8590c`; success `#2f9e44`; error `#e03131`.
- Phase colours come from `META[].color` and `.tint` (see `src/content/meta.js`).
- Headings: **Kalam 700**. Hand annotations / big numbers: **Caveat 600**. Body: **Nunito** 17px, line-height 1.7, max reading width ~760px. Code: **JetBrains Mono**.
- Cards: white-ish `#fffdf7`, 2px ink border, slightly irregular radius (e.g. `border-radius: 14px 18px 12px 16px / 16px 12px 18px 14px`), offset hard shadow `3px 4px 0 #1f2a44` (like paper cutouts). Buttons similar, press-down on :active.
- Subtle: no gradients, no glassmorphism, no generic purple SaaS look.
- Responsive: sidebar collapses to a drawer under 900px. No horizontal page scroll; wide tables/code scroll inside their own box.
- Respect `prefers-reduced-motion`.

## Existing modules you must use (do not rewrite them)
- `src/lib/store.jsx`: `ProgressProvider`, `useProgress()` → `{ state, dispatch }`, `streak(activity)`, `level(xp)`. State: `startDate, done{lessonId:date}, quiz{lessonId:{score,total}}, checks{key:true}, solved{id:date}, notes{lessonId:text}, activity{yyyy-mm-dd:xp}, xp, apps[], stories{}, playground{}`. Actions: `complete{id}` (toggles), `quiz{id,score,total}`, `check{key,xp?}` (toggles), `solve{id}`, `note{id,text}`, `code{id,code}`, `apps{apps}`, `story{id,story}`, `import{data}`, `reset`, `setStart{date}`.
- `src/content/index.js`: `PHASES` (each: META fields + `modules[{id,title,lessons[]}]`, `project`, `gate`), `ALL_LESSONS` (flattened, each with `phaseId, moduleId, moduleTitle, phase`), `lessonById`, `phaseById`. Content may be partially empty while other agents write it — every page must handle empty modules / null project / null gate gracefully ("Coming soon").
- `src/content/meta.js`: `META`.
- Content data files (owned by other agents, read-only for you): `practice.js` → `{ sql:[{id,title,level,topic,prompt,solution,hint,ordered}], python:[{id,title,level,topic,prompt,starter,tests,solution,hint}] }`; `interview.js` → `{ star:[{id,title,prompt,tips:[],example}], systemDesign:[{id,title,prompt,blocks:[]}], questions:[{id,topic,q,a}] }`; `glossary.js` → `[{term,simple,example?,phase?}]`.
- `src/components/Blocks.jsx`: `<Blocks blocks idBase />` renders lesson blocks; also exports `Checklist({items, prefix, xp})` and `Callout({kind,text})`.
- `src/components/Md.jsx`: `<Md text />`, `inline(text)`, `<Inline text />`, `<CodeBlock code lang />`.
- `src/components/Sketch.jsx`: `<Sketch spec seed />` hand-drawn diagrams (see docs/CONTENT_SPEC.md §5), exports `C` (fills) and `INK`.
- `src/components/Quiz.jsx`: `<Quiz id questions />`.
- `src/components/SqlPlayground.jsx` (`default`, `ResultGrid`, `SchemaPeek`), `PyPlayground.jsx` (`default`, `PyChallenge`), `Challenge.jsx`, `Editor.jsx`.
- `src/lib/db.js`: `warmup()` — call once on app start (after first paint, e.g. `requestIdleCallback`) so PostgreSQL is ready by the time a playground is used.
- `roughjs` is installed if you want extra hand-drawn decorations (e.g. the roadmap map).

## Files you own
`src/main.jsx`, `src/App.jsx`, `src/styles.css`, `src/components/Layout.jsx`, `src/components/RoadmapMap.jsx`, `src/pages/*.jsx`. (Widget-specific extra styles for 5 new widgets live in `src/widgets/extra.css`, owned by the widget agent — do not touch.)

## Routes
| route | page |
|---|---|
| `/` | **Dashboard**: greeting ("Hi Harish"), current week number since `startDate` (week 1 = first 7 days) mapped to the phase for that week, "Continue" card → first not-done lesson, stats row (XP + level name + progress bar to next level, 🔥 streak, lessons done / total, challenges solved, projects steps done), the **hand-drawn roadmap map** (`RoadmapMap`: a winding path with 6 stations for phases + 5 small flag markers for gates A, B, C, C+/D, E; station shows emoji, title, weeks, % complete; click → phase), this week's plan (Mon–Fri 2–3 h learn: list next 5 lessons; Sat: project step; Sun: revise weak quizzes (score < 70%) + 5 applications if gate reached), 12-week activity heatmap from `activity`, "Rules of this roadmap" card (time, data rule, resume rule — see docs/ROADMAP.md top). |
| `/phase/:id` | **Phase**: coloured header (emoji, title, target salary, summary), progress bar, modules → lesson cards (title, goal, ✓ done, quiz best), project card, gate card. |
| `/lesson/:id` | **Lesson**: breadcrumb (Phase › Module), title, goal, "Covers" chips from `roadmap[]`, `<Blocks blocks={lesson.blocks} idBase={lesson.id} />`, `<Quiz id={lesson.id} questions={lesson.quiz} />`, Task section (`Checklist` with prefix `task:${id}`, xp 15, plus `deliverable`), "My notes" textarea (saved to `notes`), big "Mark lesson complete" toggle (+20 XP) and prev/next lesson buttons (across phases using `ALL_LESSONS`). Scroll to top on navigation. |
| `/project/:phaseId` | **Project**: title, tagline, stack chips, problem (Md), architecture `Sketch`, folder (Md), steps as numbered sections each with `why` (Md), `Blocks` (idBase `${project.id}-s${i}`), and `Checklist` prefix `proj:${project.id}:${i}` (xp 10); overall progress; resume line with copy button; Definition of done checklist (prefix `dod:${project.id}`); video script list. |
| `/gate/:phaseId` | **Apply gate**: letter, week, target, titles as chips, checklist (prefix `gate:${gate.id}`), `Blocks`, job search buttons: for each title open LinkedIn (`https://www.linkedin.com/jobs/search/?keywords=<title>&f_WT=2` remote), Naukri (`https://www.naukri.com/<title-slug>-jobs?wfhType=2`), Wellfound, Instahyre search URLs in new tabs; **Application tracker** (all gates share `state.apps`): add row (company, role, link, date, gate, status Applied/Screening/Interview/Offer/Rejected, notes), edit status inline, delete, counts per status, "this week: n / 5" target. |
| `/practice` | **Practice arena**: tabs SQL / Python; filters by level and topic; list with solved ticks and counts; selecting an item renders `<Challenge {...c} />` (SQL) or `<PyChallenge {...c} />` (Python) with prev/next. Also show "30-minute daily drill" suggestion: 2 random unsolved. |
| `/sandbox` | Free **SQL playground** (`SqlPlayground` id `sandbox-sql`, starter `SELECT * FROM fact_gl LIMIT 20;`) + free **Python playground** + a data catalogue (table list with one-line descriptions and the deliberate quirks — copy from docs/CONTENT_SPEC.md §6). |
| `/interview` | **Interview prep**: STAR story builder (for each `interview.star` prompt: fields Situation/Task/Action/Result + metric, saved in `state.stories[id]`, word count, "read aloud" timer 2 min), system design prompts (render `blocks`), Q&A bank with topic filter and reveal-answer cards. |
| `/glossary` | Search box, A–Z list grouped, phase filter, flashcard mode (flip card, next/prev, shuffle). |
| `/settings` | Export progress JSON (download), import JSON (file input), reset (confirm), about (how this app works, Docker note). |

## Layout
Left sidebar (logo "FDE Academy" in Kalam with a small rough.js underline; nav: Dashboard, Practice, Sandbox, Interview, Glossary, Settings; then the phases grouped under their stage headings, each expandable to modules → lessons with ✓ marks and a small progress ring; current lesson highlighted). Top bar: ⌘K / Ctrl+K quick search (lessons by title + glossary terms), XP pill with level, 🔥 streak. Footer-free.

## CSS classes already used by existing components — style ALL of these in `src/styles.css`
Generic: `btn primary btn-mini chip chips on card col cols row wrap top spacer muted small mono hand big lbl toggle mono-in error hint solution console bad ok warn verdict pill status null num plain`.
Markdown (`.md`): `h2 h3 h4 p ul ol li blockquote mark a code.ic .codeblock .codebar pre .tablewrap .mdtable`.
Sketch: `figure.sketch svg figcaption` (svg width 100%, height auto, paper-white background card; caption in Caveat).
Blocks/callouts: `.blocks .callout .callout-h` + kinds `.tip .warn .analogy .interview .real .remember .local` (each its own tint + left border), `.checklist li label input .box li.on` (hide native checkbox, draw a hand-drawn-looking box), `.widget` (card wrapper for widgets).
Playgrounds: `.playground .pg-head .pg-badge.sql .pg-badge.py .pg-title .pg-note .pg-body .with-schema (grid: 200px + 1fr) .pg-main .pg-actions .pg-out .editor .grid-wrap .grid (data table: mono 13px, sticky header, zebra) .grid td.null td.num .grid-foot .res-msg .schema .schema-t .schema-name`.
Challenges: `.challenge .challenge.solved .ch-head .ch-prompt .solved-tag .lvl .lvl-easy .lvl-medium .lvl-hard`.
Quiz: `.quiz .section-title .q .q-text .q-num .q-opts .q-opt .q-opt.right .q-opt.wrong .q-opt.faded .why.ok .why.bad .quiz-end`.
Widgets: `.w-title .w-desc .mini-cap .sqlsnip .grid.mini .clicky tr.hit tr.miss tr.cur tr.frame tr.dimrow tr.part-break tr.k-both tr.k-left tr.k-right .join-grid .venn .venn-t .regex-res li.ok li.bad .meter .meter-fill .fs-canvas .fs-step .fs-card .fs-ico .fs-name .fs-sub .fs-st .fs-step.st-Succeeded/.st-Failed/.st-Skipped .fs-step.scope .fs-step.cond .fs-step.trigger .cron-parts .git-svg .git-lane .git-id .git-ptr .api-resp .api-hist .status.ok/.warn/.bad .jwt-in .jwt-colored .jp0 .jp1 .jp2 .medal-track .medal .medal.on .tok-view .tok .t0..t4 .cost-grid .bars .bar-row .bar`.
Look at the widget JSX files in `src/widgets/` to see the exact structure before styling.

## Done criteria
`npm run build` passes. Run `npx vite preview --port 4173` and check pages with Playwright (Chromium is preinstalled; `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; launch with `executablePath: '/opt/pw-browsers/chromium'` if needed, install `playwright` as a devDependency only if missing) — screenshot dashboard, a phase, a lesson (once content exists), practice, glossary at 1280px and 390px widths, and fix layout bugs. Check the browser console for errors.
