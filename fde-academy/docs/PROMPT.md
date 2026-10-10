# Prompts to continue in VS Code

Open the folder `E:\youtube\Harish Kollana\FDE\fde-academy` in VS Code, run `npm install` once in the terminal (and `pip install pandas==2.3.3 numpy pydantic pyyaml python-dateutil jsonschema` once for the validator), then paste ONE of these into your AI agent chat (Claude Code / Copilot agent mode). **Start a fresh chat for each task.** The task list is in `docs/TASKS.md`; run `npm run status` to see what is written.

## Prompt B — write one content task (T01 → T39, in order)

You are continuing an unfinished project. Read src/content/phases/CLAUDE.md (the FDE domain file; the root CLAUDE.md is site-wide), then docs/TASKS.md, docs/CONTENT_SPEC.md (especially §11), docs/roadmap-v2/00-index.md and the roadmap-v2 stage file that contains my phase, and docs/example-lesson.js. Then read two finished lessons to match their quality: src/content/phases/sql/sql-select.js and src/content/phases/python/python-collections.js.
Your job is **Task <T##>** in docs/TASKS.md (phase(s): <phase ids>). Run `npm run status -- --missing <phase-id>` to see exactly which lessons are still to write; write only those, with exactly the ids and titles in the roadmap file, one lesson per file in src/content/phases/<phase-id>/<lesson-id>.js, and wire each into src/content/phases/<phase-id>.js (modules follow the "Module X" headings).
This app is my ONLY learning resource, so each lesson must teach from zero in simple English with Indian finance examples: 800–1600 words, concept first (why it exists, mental model, vocabulary, how it fails), at least one hand-drawn sketch, runnable playgrounds and auto-graded challenges where the browser allows, the relevant widget, exact Windows steps with the output to expect and common errors when tools or cloud accounts are needed, 5–6 quiz questions, a laptop task and a Recap. Put a model answer for the phase's interview questions in `interview` callouts. Never state prices, quotas, free-tier terms or model names as facts ("check the current page"); say which tool version you wrote against. The last lesson of the phase is a lab; if my task includes a project and gate, write them with complete working code following the roadmap steps.
Run `npm run validate -- src/content/phases/<phase-id>.js` after every 2–3 lessons until it reports 0 errors, then `npm run status` (no plan problems), then `npm run build`. Keep the same depth on the last lesson as the first. Update docs/TASKS.md and tell me what you wrote.

## Prompt W — build simulators (Task W, W2a, W2b, W2c)

You are continuing an unfinished project. Read src/content/phases/CLAUDE.md (the FDE domain file; the root CLAUDE.md is site-wide), docs/TASKS.md, docs/CONTENT_SPEC.md §7, and docs/roadmap-v2/00-index.md ("New simulators"), then the existing widgets src/widgets/FlowSimulator.jsx, ApiPlayground.jsx and TokenCost.jsx for conventions. Build the widgets listed for **Task <W | W2a | W2b | W2c>**: deterministic, interactive, finance examples, no new npm dependencies, no real LLM or network calls. Put styles in src/widgets/extra.css. Register each new widget in src/widgets/index.js AND in the WIDGETS list in scripts/validate-content.mjs. Test each one in the browser (`npm run dev`, use a temporary test page you delete afterwards) and fix console errors. Mark the task done in docs/TASKS.md.

## Prompt D — final QA and Docker

Read src/content/phases/CLAUDE.md (the FDE domain file; the root CLAUDE.md is site-wide) and docs/TASKS.md. Run `npm run validate` and fix all errors, `npm run status`, then `npm run build`. Open every page in the browser at desktop and phone width, click through the playgrounds, quizzes, challenges and widgets, and fix bugs and layout problems. Then run `docker compose up --build`, open http://localhost:8080 and confirm the SQL playground works inside the container. Give me a short report.

## Prompt R — change the plan

Read src/content/phases/CLAUDE.md (the FDE domain file; the root CLAUDE.md is site-wide) and docs/roadmap-v2/00-index.md. I want to change the curriculum: <describe>. Edit docs/roadmap-v2/*.md (keep the line format), update src/content/meta.js if a phase, duration, gate or project changes, run `npm run plan`, `npm run status` and `npm run build`, update docs/TASKS.md, and summarise what moved.
