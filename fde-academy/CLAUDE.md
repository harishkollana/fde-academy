# My Academy — site-wide instructions for AI coding agents

One React 18 + Vite app that holds **three separate learning domains**, shown as tabs at the top of every page. The folder and npm package are still called `fde-academy`; the browser title is "My Academy". Owner: Harish (India, finance-automation background). Every domain is a self-study resource for him, written in plain English.

**Each domain keeps its own agent files, its own content folder, its own progress and its own CSS prefix. Do not mix them.**

## The three domains

| Tab | Routes | Content | Domain files (read in this order) |
|---|---|---|---|
| **FDE** | `/` and `/phase`, `/lesson`, `/project`, `/gate`, `/practice`, `/sandbox`, `/interview`, `/glossary` | `src/content/phases/`, plus `meta.js`, `glossary.js`, `interview.js`, `practice.js`, `plan.json` and `docs/` | `src/content/phases/CLAUDE.md`, then `RESUME.md` (same folder) |
| **MBA + ACCA** | `/mba-acca`, `/mba-acca/assessment`, `/mba-acca/subjects/:id` | `src/content/mba/` | `src/content/mba/CLAUDE.md`, then `RESUME.md` |
| **Corporate Mitra** | `/corporate-mitra`, `/corporate-mitra/:id` | `src/content/corporate-mitra/` | `src/content/corporate-mitra/CLAUDE.md`, then `RESUME.md`, then `README.md` (the lesson-writing contract) |

A fourth tab, **⚙️ Settings** (`/settings`), is not a domain: it is one site-level page that tracks all three (see "Settings" below).

Claude Code loads a folder's `CLAUDE.md` by itself when you work on files inside that folder, so the right domain rules arrive with the work. The FDE `CLAUDE.md` is the old root one, moved on 10 Oct 2026.

## How to start a session
1. Decide which domain the task belongs to (ask Harish if it is unclear). **One domain per session.**
2. Read that domain's `CLAUDE.md`, then its `RESUME.md`. Ignore the other two domains' files unless the task really spans them.
3. Before you stop, update **that domain's** `RESUME.md` (what is done, what is next, anything half-finished). If you changed a shared file (list below) also update the root `RESUME.md`.
4. Other Claude sessions may be working in another domain at the same time (seen on 10 Oct 2026). Stay inside your domain's folder, and never overwrite a file you did not create or read first.

## How the site is put together (shared shell)
- `src/App.jsx` has every route. `src/components/Layout.jsx` exports `SITE_TABS` and `sectionOf(pathname)`: the first URL segment picks the domain, and `Layout` renders that domain's shell around the page. `/settings` gets `SoloShell` (no sidebar). Anything that is not `/mba-acca`, `/corporate-mitra` or `/settings` is FDE.
- One shell per domain: `FdeShell` (inside `Layout.jsx`), `src/components/McaShell.jsx` (MBA + ACCA), `src/components/CmShell.jsx` (Corporate Mitra). Each has its own sidebar, logo and mobile drawer. `SiteTabs` sits above all three.
- **Top bar and quick search (same in all three shells).** `src/components/StudyTopBar.jsx` holds `StudyTopBar` (menu button, search button with Ctrl/⌘ K, XP pill with level name, streak pill), `QuickSearch` (the modal; each shell passes its own `search(q)` function) and `useShellChrome` (drawer and search state, the keys, scroll lock). FDE feeds it the saved XP and streak from `store.jsx`; its search is `fdeSearch` in `Layout.jsx`. MBA + ACCA and Corporate Mitra feed it their own numbers from `src/lib/mbaTopBar.js` and `src/lib/cmTopBar.js` (each has the status hook, the search function and the ladder of level names). Those numbers use `src/lib/studyMeta.js` and are **worked out from the domain's saved lessons and quiz scores, never stored**: 20 XP per lesson ticked done, 5 XP per point of each best quiz score, streak = days in a row (local dates) with at least one lesson ticked. Un-ticking a lesson takes its XP back. Because nothing new is saved, the Settings backup, import and reset needed no change. Level names are shares of the XP available in total, so they move by themselves when lessons are added.
- Pages: FDE in `src/pages/` (`Dashboard`, `Phase`, `Lesson`, ...), MBA + ACCA in `src/pages/MbaAcca.jsx`, Corporate Mitra in `src/pages/CorporateMitra.jsx`. `src/pages/Settings.jsx` is the site-level page (see below). `src/pages/ComingSoon.jsx` is imported in `App.jsx` but no route uses it right now.
- Browser storage (all in `localStorage`; never merge them):
  - FDE: `fde-academy-progress-v1` (`src/lib/store.jsx`: XP, levels, streak, quiz scores, notes, applications) and `fde-sb-open` (sidebar state).
  - Corporate Mitra: `corporate-mitra-progress-v1` (`src/lib/cmStore.js`: done, notes, quiz; it must never touch FDE XP or streak) and `cm-sb-open`.
  - Settings: `academy-last-backup` (localStorage: when the backup file was last downloaded) and `academy-flash` (sessionStorage: a message that survives the page reload after import or reset).
  - MBA + ACCA: `mba-acca-progress-v1` (`src/lib/mbaStore.js`: `done`, the lessons ticked off, keyed `<subject id>:<lesson no>`). Everything else on those pages is static data plus today's local date.
- CSS lives in one file, `src/styles.css`. Prefixes: `mc-*` = MBA + ACCA (the `Mca` shell), `cm-*` = Corporate Mitra, `site-tab*` = the tab bar, everything else = the original FDE/shared design system. Add new styles under the right prefix; do not restyle shared classes for one domain.
- **Settings (`src/pages/Settings.jsx`, site level).** Three in-page tabs (FDE, MBA + ACCA, Corporate Mitra) switch with plain React state, no route change. Each tab shows counts by phase / subject / part and by lesson. Above the tabs sit two site-level cards: **Back up or move your progress** (one combined JSON file `{ app: 'my-academy', version: 2, fde, mba, cm }`; the older FDE-only file still imports) and **Start over** (resets all three). It **reads** the three stores (`useProgress`, `useMba`, `useCm`) and the three content indexes, and **writes the three `localStorage` keys directly** on import and reset, then reloads the page, because `mbaStore.js` and `cmStore.js` keep their state in memory. The keys are copied into `KEYS` at the top of `Settings.jsx`: if a store's key or saved shape changes, change it there too. The only change it makes to a store without a reload is FDE "mark done / clear" per phase (it hands the whole state to the FDE `import` action, so no XP is given). It must never add XP or streak, and it does not edit any store file.
- **Shared files** (a change affects more than one domain, so run `npm run build` and look at an FDE page and a Corporate Mitra lesson afterwards): `src/styles.css`, `src/pages/shared.jsx` (`Ring`, `Bar`, `Empty`, `fmtDate`, `useDocTitle`), `src/pages/NotFound.jsx`, `src/components/{Sketch,Md,Blocks}.jsx` (Corporate Mitra reuses these), `src/components/StudyTopBar.jsx` (all three shells), `src/lib/studyMeta.js`, `src/pages/Settings.jsx`, `src/App.jsx`, `src/components/Layout.jsx`, `index.html`. The FDE rule stays: do not edit `Sketch`, `Md`, `Blocks`, `Quiz`, `Editor`, `SqlPlayground`, `PyPlayground`, `Challenge`, `src/lib/*` or `src/data/*` unless fixing a real bug.
- Branding: `index.html` title and `useDocTitle` say "My Academy"; the FDE logo says "FDE"; the Settings backup file is `my-academy-progress-<date>.json`.

## Adding a new domain (or a new tab)
1. Content folder `src/content/<domain>/` with its own `CLAUDE.md` and `RESUME.md` (copy the shape of an existing pair).
2. A shell component, a page file, a store file only if it needs saved progress (own `localStorage` key, own file in `src/lib/`), CSS under its own prefix.
3. Add the tab to `SITE_TABS` (before Settings), a `sectionOf` match, the routes in `App.jsx`, and a row in the table above and in the root `RESUME.md`.
4. Give the new domain a tab in `Settings.jsx`: an entry in `TABS`, `KEYS` and `NAMES`, its numbers and rows, and its part in the export, import and reset code.

## Commands (from the `fde-academy/` folder; Windows, PowerShell or Git Bash)
- `npm install` · `npm run dev` (http://localhost:5173) · `npm run build` (must pass; the large-chunk warning is old and harmless) · `npm run preview`
- FDE only: `npm run validate -- <aggregator>`, `npm run status`, `npm run plan`, `npm run seed`, `node scripts/qa-crawl.mjs <phase>`
- Corporate Mitra only: `node scripts/check-cm.mjs [file-substring]`
- Docker: `docker compose up --build` → http://localhost:8080 (nginx falls back to `index.html`, so every route works). The image has never been built.

## Facts that are easy to get wrong
- Source material for MBA + ACCA and Corporate Mitra lives **outside the repo** in `D:\Ed\` (PDFs, transcripts, videos). Never copy those files into the repo; the app only holds data and lessons derived from them.
- `AGENTS.md` and `.github/copilot-instructions.md` are the old FDE-only instructions for other tools (Codex, Copilot). They have not been updated for three domains.
- `_sketch-preview.html` and `_sketch-preview.jsx` in the project root are untracked scratch files for screenshotting Corporate Mitra sketches in the dev server. Not part of the app.
- Git line endings: `warning: LF will be replaced by CRLF` messages are harmless.
- FDE writing rules (Kollana Tech data, ₹ examples, no prices or time estimates, validator) belong to the FDE domain. They do not automatically apply to the other two; each domain's `CLAUDE.md` says what applies there.
