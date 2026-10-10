# RESUME (site-wide) — read this first, then go to the domain you are working on

Last updated: 10 Oct 2026. Site-wide rules are in `CLAUDE.md` (same folder). This file only holds what is true for the whole site and points to each domain's own `RESUME.md`. Update it when a shared file changes or a domain is added; do not copy domain progress into it.

## The three domains
| Domain | Tab and routes | State in one line | Its own files |
|---|---|---|---|
| **FDE** | `/` and the course pages | 97 of 403 lessons written (foundations, sql, python, pandas, plus small starts); next task **T09 `git`**; no FDE work since 7 Oct 2026 | `src/content/phases/CLAUDE.md`, `RESUME.md` |
| **MBA + ACCA** | `/mba-acca/*` | MBA Semester 1 (Amity, July 2026 session) dates, assessment rules and 5 subjects are built (10 Oct 2026: all 449 lessons listed, each with a lesson page, quiz and mark-complete; key points and quizzes written for 324 of 449, paused at Professional Communication Module 3, see the domain RESUME; Assessment is the same for every semester); ACCA not started | `src/content/mba/CLAUDE.md`, `RESUME.md` |
| **Corporate Mitra** | `/corporate-mitra/*` | App side done; **42 of 84 lessons written** on 10 Oct 2026 (Introduction, Week 2 and Week 3 complete; Week 4 has 9 of 13; Week 1 has 7 of 13; Weeks 5 and 6 not started); work paused at Harish's request; `npm run build` last passed before Week 4 was added | `src/content/corporate-mitra/CLAUDE.md`, `RESUME.md`, `README.md` |

## What changed on 10 Oct 2026 (the three-domain split)
- The site now has a tab bar (`SITE_TABS` in `src/components/Layout.jsx`) and one shell per domain: FDE (`FdeShell`), `McaShell.jsx`, `CmShell.jsx`. Routes in `src/App.jsx`. Browser title "My Academy"; the FDE logo says "FDE".
- Each domain got its own `CLAUDE.md` and `RESUME.md`. The old FDE `CLAUDE.md` and `RESUME.md` were **moved** from the project root to `src/content/phases/` (content unchanged apart from a header note and two path fixes); `docs/PROMPT.md` and `docs/TASKS.md` now point to the new FDE location. The root `CLAUDE.md` and this file are new and site-wide. The Corporate Mitra pair was written by the session that is building those lessons.
- Claude's private memory for this project (outside the repo, `C:\Users\Lenovo\.claude\projects\e--youtube-Harish-Kollana-FDE\memory\`) has one note per domain plus one about how the site is split.

## Settings tab (10 Oct 2026, later session)
- New site-level tab **⚙️ Settings** (`/settings`), right of Corporate Mitra in `SITE_TABS`, rendered by `SoloShell` in `Layout.jsx` (no sidebar). It left the FDE sidebar. `src/pages/Settings.jsx` was rewritten: backup and start-over cards at the top (all three modules, one combined JSON file), then three in-page tabs FDE / MBA + ACCA / Corporate Mitra with counts by phase (FDE), subject and module (MBA), part (Corporate Mitra) and by lesson. The "How this app works" section was removed. Details and rules: root `CLAUDE.md`, section "Settings".
- Checked in Edge at 1280 and 390 px with sample progress in all three modules: tabs switch in place, export, import (combined, old FDE-only, bad file) and reset work, no console errors, no sideways scroll. The site is deployed as a static React site with `HashRouter` (addresses look like `/#/settings`), so any static host works.

## Top bar and search in all three tabs (10 Oct 2026, last change)
- Harish asked for the FDE top bar (search with Ctrl K, XP pill with level, streak pill) in MBA + ACCA and Corporate Mitra. Done: one shared `src/components/StudyTopBar.jsx`, used by all three shells (FDE's own markup was moved into it, same look). Each domain has its own search (`mbaSearch` in `src/lib/mbaTopBar.js`: pages, subjects, modules, all 449 lessons and their key points, calendar dates; `cmSearch` in `src/lib/cmTopBar.js`: overview, weeks, lessons, the "Words you will meet" terms) and its own XP, level and streak, never the FDE ones. XP and streak are calculated from the saved ticks and quiz scores (see root `CLAUDE.md`), so no store file or Settings code changed shape.
- Side effects: the old MBA mobile-only header (`.topbar.mini`, `.top-logo-s`) and the Corporate Mitra "n / N done" pill (`.cm-pill*`, `.cm-top-title`) are gone from the CSS; the done count still shows on the Corporate Mitra overview and in Settings. `cmStore.js` now writes the done date in local time (it used UTC, which is the previous day in India between 00:00 and 05:30; the streak needs local dates).
- Checked in Edge through Playwright at 1280 and 390 px on all three tabs: bar renders, search finds and opens a lesson with Enter, Ctrl K opens and Esc closes, XP and streak match the sample progress, no console errors, no sideways scroll. `npm run build` passes. The level names for MBA + ACCA and Corporate Mitra are placeholders Harish has not seen; change them in the `LADDER` arrays.

## Verified on 10 Oct 2026
- `npm run build` passes with all three domains. FDE `npm run status`: "no problems found in the plan", 97 of 403 written.
- Not done: no browser pass over all three tabs after the split (each domain's `RESUME.md` says what was and was not checked).

## Open points
- **Nothing from the three-domain work is committed.** Last commit is `4838fd1` ("Read me file updated"). Modified: `index.html`, `src/App.jsx`, `src/components/Layout.jsx`, `src/pages/Settings.jsx`, `src/pages/shared.jsx`, `src/styles.css`, `docs/PROMPT.md`, `docs/TASKS.md`; the root `CLAUDE.md` and `RESUME.md` show as modified (their FDE text moved to `src/content/phases/`; the root files are now site-wide); new: `src/content/mba/`, `src/content/corporate-mitra/`, `src/content/phases/{CLAUDE,RESUME}.md`, the two shells, `src/pages/{MbaAcca,CorporateMitra,ComingSoon}.jsx`, `src/lib/cmStore.js`, `scripts/check-cm.mjs`, the two `_sketch-preview.*` scratch files, and the new root `CLAUDE.md` and `RESUME.md`. Ask Harish before committing.
- `AGENTS.md` and `.github/copilot-instructions.md` are still the old FDE-only instructions (for Codex and Copilot). `README.md` in this folder and the repo-root `README.md` still describe only FDE. Update them if Harish uses those tools or wants the repo described as three domains.
- `src/pages/ComingSoon.jsx` is imported in `App.jsx` but unused; delete both or use it for ACCA.
- Docker image has never been built (FDE open point, still true).
- Branding is half-done on purpose or by accident: package and folder are `fde-academy`, title is "My Academy", FDE logo is "FDE". Ask Harish if he wants a final name.
