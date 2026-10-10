import { SUBJECTS, CALENDAR, KINDS, lessonsOfSubject, lessonRef, lessonPath } from '../content/mba/sem1.js';
import { contentOf } from '../content/mba/lessons/index.js';
import { useMba } from './mbaStore';
import { XP_LESSON, XP_QUIZ_POINT, xpOf, streakOf, levelOf } from './studyMeta';

// ---------- XP, level, streak (own to MBA + ACCA, never the FDE ones) ----------
const known = (key) => {
  const i = key.indexOf(':');
  return i > 0 && !!lessonRef(key.slice(0, i), key.slice(i + 1));
};

// Everything you can earn: every lesson, plus a point for every quiz question. The level names are shares of this.
const MAX_XP = SUBJECTS.reduce((sum, s) => sum + lessonsOfSubject(s).reduce((n, l) => n + XP_LESSON + XP_QUIZ_POINT * (contentOf(s.id, l.no)?.quiz.length || 0), 0), 0);

const LADDER = [
  [0, 'Fresh Student'], [0.1, 'Settling In'], [0.25, 'Classroom Regular'], [0.4, 'Case Reader'],
  [0.55, 'Halfway Scholar'], [0.7, 'Number Cruncher'], [0.85, 'Exam Ready'], [1, 'Semester Done'],
];

export function useMbaStatus() {
  const { done, quiz } = useMba();
  const xp = xpOf(done, quiz, known);
  return { xp, lv: levelOf(xp, MAX_XP, LADDER), streak: streakOf(done, known) };
}

// ---------- quick search (Ctrl/⌘ + K) ----------
const PAGES = [
  { kind: 'page', to: '/mba-acca', title: 'Important Dates', sub: 'Page', ico: '📅' },
  { kind: 'page', to: '/mba-acca/assessment', title: 'Assessment', sub: 'Page', ico: '📝' },
];

let index = null;
function build() {
  const items = [];
  SUBJECTS.forEach((s) => {
    items.push({ kind: 'subject', to: `/mba-acca/subjects/${s.id}`, title: s.title, sub: `${lessonsOfSubject(s).length} lessons`, ico: s.ico, hay: s.title.toLowerCase(), t: s.title.toLowerCase(), base: 2 });
    s.modules.forEach((m, mi) => {
      const t = `module ${mi + 1} ${m.title}`.toLowerCase();
      items.push({ kind: 'module', to: `/mba-acca/subjects/${s.id}`, title: `Module ${mi + 1}: ${m.title}`, sub: `${s.ico} ${s.title}`, ico: '📚', hay: `${t} ${s.title.toLowerCase()}`, t, base: 1.8 });
      m.sections.forEach((sec) => sec.lessons.forEach((l) => {
        const t = `${l.no} ${l.title}`.toLowerCase();
        items.push({
          kind: 'lesson', to: lessonPath(s.id, l.no), title: `${l.no} ${l.title}`, sub: `${s.ico} ${s.title} · Module ${mi + 1}`, ico: '📄',
          hay: `${t} ${sec.title} ${m.title} ${s.title}`.toLowerCase(), t, base: 1,
          points: (contentOf(s.id, l.no)?.points || []).join(' ').toLowerCase(),
        });
      }));
    });
  });
  CALENDAR.forEach((e) => {
    const t = e.title.toLowerCase();
    items.push({ kind: 'date', to: '/mba-acca', title: e.title, sub: `${KINDS[e.kind]?.label || 'Date'} · ${e.start}`, ico: KINDS[e.kind]?.ico || '📅', hay: t, t, base: 1.4 });
  });
  return items;
}

export function mbaSearch(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const words = s.split(/\s+/);
  const hit = (text) => words.every((w) => text.includes(w));
  index = index || build();
  const out = [];
  PAGES.forEach((p) => { if (hit(p.title.toLowerCase())) out.push({ ...p, score: 3 }); });
  index.forEach((it) => {
    if (hit(it.hay)) out.push({ kind: it.kind, to: it.to, title: it.title, sub: it.sub, ico: it.ico, score: it.base + (hit(it.t) ? 0.5 : 0) });
    else if (it.points && hit(it.points)) out.push({ kind: it.kind, to: it.to, title: it.title, sub: it.sub, ico: it.ico, score: 0.6 });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 14);
}

export const MBA_SEARCH_HINT = 'Type to search. Try “depreciation”, “elasticity”, “marketing mix” or “assignment 2”.';
