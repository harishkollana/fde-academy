# Corporate Mitra — instructions for AI coding agents

Domain 3 of "My Academy" (see the root `fde-academy/CLAUDE.md` for the shared shell). Harish's study notes for the **Corporate Mitra** certificate course (an Indian government programme that trains para-professionals to help MSMEs with registration, tax, accounts, finance and schemes).

**Audience: an engineer with zero knowledge of finance, tax and accounts.** Every lesson must explain from zero, in plain English, with a hand-drawn sketch, a worked example, and an engineering comparison.

## Read in this order
1. `RESUME.md` — what is written, what is next.
2. `README.md` — the lesson file format and writing rules (the contract). Then one finished lesson, e.g. `week1/01-msme-sector-in-india.js`, for the quality bar.
3. `_kit.js` — sketch helpers (`sk`, `flow`, `flow2`, `stack`, `hub`, `bar`, `steps`). Raw sketch items: `src/components/Sketch.jsx`.

## Source material (outside the repo, never copy it in)
`D:\Ed\Corporate Mitra\Lessons 1-3 weeks\Cleaned\` with folders `Introduction`, `Week 1`, `Week 2`, `Week 3`. **Use only the `Cleaned` folder** (Harish's instruction). The files are speech-to-text transcripts of recorded lectures: they contain recognition errors (for example "OGT" for OJT, "GM" for GeM, "TRDS" for TReDS, "ICOAI" for ICMAI). Fix them from reliable knowledge. Lesson file `NN-...js` in `weekN/` corresponds to source file `NN - ...txt` in `Week N`.

## Rules
- Follow `README.md`. Text is always a template literal; never put a backtick or `${` inside.
- Facts: numbers, limits and dates come from the transcript. If the transcript contradicts what you reliably know (law changes, wrong speaker slips), write the correct fact and say so briefly; do not copy an error. Never invent prices, fees or limits. Anything that changes with time says "check the current rule on the official site".
- Do not change shared files (`Sketch.jsx`, `Md.jsx`, `Blocks.jsx`, `shared.jsx`, `styles.css` outside the `cm-*` block) for a lesson.
- Progress is stored by `src/lib/cmStore.js` under its own key. It must never touch FDE XP, streak or `fde-academy-progress-v1`.
- The top bar (search, XP, level, streak) is the shared `src/components/StudyTopBar.jsx`. Corporate Mitra's own numbers and search live in `src/lib/cmTopBar.js`: XP and streak are worked out from `done` and `quiz` (nothing extra is stored), and the search reads lesson titles, `covers`, `goal` and the `terms` of every lesson, so a new lesson file shows up in it by itself.

## Checks
- `node scripts/check-cm.mjs [path-substring]` after every lesson: schema, quiz shape, sketch bounds and text fit. Finish with 0 errors; clear warnings where reasonable.
- Look at new or unusual sketches: start `npx vite --port 5199`, open `http://localhost:5199/_sketch-preview.html?l=<lesson-id-substring>` (scratch file in the project root, not part of the app).
- `npm run build` must pass before you stop.
