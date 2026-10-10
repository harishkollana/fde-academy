# FDE Academy

A hand-drawn, interactive course on the road to **Forward Deployed Engineer / AI Automation / Data Engineer** roles: **41 phases in 12 stages, 403 lessons planned** (plus a 6-phase optional track), one tool or topic per phase, concepts first, and no deadlines: you go at your own pace. Real in-browser PostgreSQL and Python playgrounds, auto-graded challenges, quizzes, simulators, 7 guided portfolio projects and 7 apply gates. The curriculum is in `docs/roadmap-v2/`; lessons are written phase by phase (`npm run status` shows how far along it is).

## Run it
```powershell
npm install
npm run dev          # http://localhost:5173
```

## Run it in Docker
```powershell
docker compose up --build   # http://localhost:8080
```

## Three domains, one site
The app has three tabs, each with its own content, progress and agent files: **FDE** (this course), **MBA + ACCA** (`src/content/mba/`) and **Corporate Mitra** (`src/content/corporate-mitra/`). `CLAUDE.md` and `RESUME.md` in this folder are site-wide; every domain has its own `CLAUDE.md` and `RESUME.md` (the FDE pair is in `src/content/phases/`).

## Continue building
Start with `CLAUDE.md` (site-wide), then the `CLAUDE.md` and `RESUME.md` of the domain you are working on. For FDE also see `docs/TASKS.md` and `docs/PROMPT.md`: check content with `npm run validate`, the plan with `npm run status`.

## How it works
- **SQL playgrounds**: PostgreSQL 18 compiled to WebAssembly (PGlite), seeded with a synthetic finance dataset (GL, budget, FX, GST, payroll, sales). Each playground gets its own copy, so you can't break anything.
- **Python playgrounds**: Pyodide (Python + pandas in the browser), loaded from a CDN the first time.
- **Progress** (XP, streaks, quiz scores, notes, job applications) is saved in your browser. Export it from Settings to back it up.
