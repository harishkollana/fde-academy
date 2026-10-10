# RESUME (MBA + ACCA domain) — read this first in a new MBA + ACCA session

Last updated: 10 Oct 2026, end of the session. **Writing lesson content was paused on Harish's request in the middle of Professional Communication (Module 3 is next); 324 of 449 lessons are written.** Read `CLAUDE.md` in this folder first. Paths are relative to the `fde-academy/` project root.

## State
- **Built (all still uncommitted in git):** `/mba-acca` Important Dates (22 calendar events, "next up" cards, past events fade out), `/mba-acca/assessment` (30% internal / 70% ETE split, passing marks, internal rules, ETE structure, rules to pass; same for every semester), `/mba-acca/subjects/:id` for the 5 subjects (modules with start page, Module Assessment due date, lesson list per module) and **the lesson page `/mba-acca/subjects/:id/lessons/:no`**. Sidebar, top bar and mobile drawer are in `McaShell.jsx` (the logo has the same hand-drawn orange underline as FDE and Corporate Mitra, roughjs, `seed: 31`); data in `sem1.js`.
- **Sidebar shape (Harish's wording, 10 Oct 2026):** Important Dates, Assessment, then a plain heading **"1st Sem · Subjects · 5"** (not a dropdown). Under it each subject is its own expandable group (same row and caret as the FDE phases): click the name to open the subject page, click the caret to show its 5 modules. Each module is a toggle (open state is in memory only) with a `done/total` pill that turns green when complete; opening it shows its lessons **in the FDE style**: each lesson is a link with a small read-only tick box (`sb-lesson` + `sb-tick`), the current lesson is highlighted and scrolled into view. The sidebar never completes a lesson.
- **Lesson flow (Harish, 10 Oct 2026: "the checkbox in the sidebar is not for completing the lesson, style same as FDE", then "on click lesson, end of lesson quiz, answer, mark lesson complete"):** click a lesson → the lesson page shows its **key points**, a **quiz** (3 questions, one click each, right/wrong with a reason, best score saved) and a **"Mark lesson as done"** button, then previous/next. The button is **disabled until the quiz has been answered once (any score)**; a lesson with no written content can be marked done at once. Undo is always allowed. To require a pass mark instead, change `canComplete` in `LessonBody` (`src/pages/MbaAcca.jsx`). The Subject page lists every lesson as a link with the same read-only tick, its page number and a progress bar.
- **Lesson content (the big job):** key points and quiz questions are written by Claude from the five study books, one file per module: `src/content/mba/lessons/<subject-id>/m1.js … m5.js` (format in `lessons/index.js` and `CLAUDE.md`). Progress, from `node scripts/check-mba.mjs`:
  - Accounting for Managers **78/78** done
  - Managerial Economics **89/89** done
  - Marketing Management **128/128** done
  - Professional Communication **29/57**: `m1` (12) and `m2` (17) done; **`m3` (10 lessons), `m4` (8) and `m5` (10) are left**
  - Statistics for Management **0/97**: `m1` (25), `m2` (19), `m3` (14), `m4` (17), `m5` (22) all left
  Option order is shuffled in `lessons/index.js` when the page loads (the right answer lands evenly on A to D), so write options in any natural order.
- **Saved progress:** `mbaStore.js` (key `mba-acca-progress-v1`) holds `done` (lesson key → date completed) and `quiz` (lesson key → best `{ score, total }`). The Settings page (another session) backs it up and resets it.
- **Semester switches:** Important Dates has four switches (1st to 4th Sem; `SEMESTERS` in `sem1.js`, `SemSwitch` in `MbaAcca.jsx`). Only 1st Sem has data (`ready: true`). **Assessment has no semester level** (Harish: "all sems same content"). To add a semester: put its calendar and subjects in a new data file, set `ready: true`, and make the pages and sidebar read the selected semester.
- **Top bar (another session, 10 Oct 2026):** the same bar as FDE is on every MBA + ACCA page: search (Ctrl/⌘ K over lessons, key points, subjects, modules, calendar dates), an XP pill with a level name and a streak pill, worked out from the saved completions and quiz scores (20 per lesson, 5 per best quiz point; `src/lib/mbaTopBar.js`). It reads `contentOf(subject, no).points` and `.quiz.length`, so **do not change the shape that `contentOf` returns**. The level names are placeholders.
- **Verified on 10 Oct 2026 (Edge through Playwright, 1280 and 390 px):** `npm run build` passes and `node scripts/check-mba.mjs` reports 0 problems. The lesson flow works end to end: open from the Subject page, sidebar lesson highlighted with its module auto-opened, the button disabled before the quiz and enabled after it, completing turns the sidebar tick and the pill, it survives a reload, undo works, next/previous work, a lesson with no content opens and can be completed, no horizontal overflow on a phone, console clean. Earlier: dates, assessment and subject pages and the drawer. Only the MBA tab was checked. Not done by a person: nobody has read the written questions through for mistakes.
- **Not built:** anything for ACCA; ticking off assignments; "mark whole module done"; Semester 2; a pass mark for the quiz.

## Resume here (next steps, in order)
1. **Finish the lesson content** (Professional Communication `m3`–`m5`, then Statistics `m1`–`m5`; 125 lessons). Method that was used for the 324 done: run the slicing scripts in `scripts/mba-slice/` (steps in `CLAUDE.md`, output to a folder **outside the repo**), read one module's slice, write its `mN.js` from what the book says (2 to 6 key points, 3 questions, a reason for each answer), run `node scripts/check-mba.mjs`, then `npm run build`. Statistics has formulas and worked numericals: take figures from the book and recompute them before writing a question.
2. After the last module, update the counts above, look at one lesson of each subject in the browser, and ask Harish to spot-check a few lessons for wrong facts.
3. Ask Harish before anything else (see below).

## Questions to put to Harish when the content is finished
1. What should the ACCA part contain? (Source files are in `D:\Ed\ACCA`: Business & Technology study book, chart book, syllabus and study guide, lesson videos.)
2. Does he also want to tick off assignments (add to `mbaStore.js`), or a "mark module done" button, or a pass mark on the quiz?

## Dates to keep in mind (from `sem1.js`; re-read the file, they are not repeated as truth here)
SAMAGAM offline orientation 10 Oct 2026 · Milestone 1 (Module 1 assessment) 21 Oct · M2 30 Oct · M3 10 Nov · M4 20 Nov · M5 30 Nov · M6 (Assignment 2, case study) 10 Dec · last date to submit assignments 21 Dec · End Term Exam 12–31 Jan 2027 · result 1 Mar 2027. The calendar itself says dates may change; changes are announced in AMIGO.

## Open points
- The whole domain (`src/content/mba/`, `McaShell.jsx`, `MbaAcca.jsx`, `mbaStore.js`, `mbaTopBar.js`, `scripts/check-mba.mjs`, `scripts/mba-slice/`, the `mc-*` styles) is untracked or modified but not committed.
- If Harish sends a revised calendar, replace `CALENDAR` in `sem1.js` and update the dates above.
- Book quirks to remember: Marketing Management Module 4 is titled "Environmental Law, Legislations and Treaties" but teaches pricing and channels; the Marketing Module 1 body numbers 1.8.3 to 1.8.5 differently from its contents page; the Accounting book has some loose or inconsistent sentences (the lesson text follows the book, and figures were checked).
- Shared files touched by this work: `src/App.jsx` (the lesson route), `src/styles.css` (`mc-*` rules). The build passed after both.
