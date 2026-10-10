import { WEEKS, LESSONS, lessonById, lessonsOfWeek } from '../content/corporate-mitra/index.js';
import { useCm } from './cmStore';
import { XP_LESSON, XP_QUIZ_POINT, xpOf, streakOf, levelOf } from './studyMeta';

const base = '/corporate-mitra';

// ---------- XP, level, streak (own to Corporate Mitra, never the FDE ones) ----------
const known = (id) => !!lessonById[id];

// Everything you can earn: every lesson, plus a point for every quiz question. The level names are shares of this,
// so they move by themselves as more lessons are added.
const maxXp = () => LESSONS.reduce((n, l) => n + XP_LESSON + XP_QUIZ_POINT * (l.quiz?.length || 0), 0);

const LADDER = [
  [0, 'New to Finance'], [0.12, 'Knows the Basics'], [0.3, 'Paperwork Pro'], [0.5, 'Scheme Spotter'],
  [0.7, 'Money Navigator'], [0.88, 'Books Reader'], [1, 'Corporate Mitra'],
];

export function useCmStatus() {
  const { done, quiz } = useCm();
  const xp = xpOf(done, quiz, known);
  return { xp, lv: levelOf(xp, maxXp(), LADDER), streak: streakOf(done, known) };
}

// ---------- quick search (Ctrl/⌘ + K) ----------
let index = null;
function build() {
  const items = [{ kind: 'page', to: base, title: 'Overview', sub: 'Page', ico: '🏠', hay: 'overview', t: 'overview', base: 3 }];
  WEEKS.forEach((w) => {
    const t = `${w.label} ${w.title}`.toLowerCase();
    items.push({ kind: 'week', to: lessonsOfWeek(w.id)[0] ? `${base}/${lessonsOfWeek(w.id)[0].id}` : base, title: `${w.label}: ${w.title}`, sub: `${lessonsOfWeek(w.id).length} lessons`, ico: w.emoji, hay: `${t} ${(w.blurb || '').toLowerCase()}`, t, base: 2 });
  });
  LESSONS.forEach((l) => {
    const t = l.title.toLowerCase();
    items.push({
      kind: 'lesson', to: `${base}/${l.id}`, title: l.title, sub: `${l.week.emoji} ${l.week.label} · ${l.week.title}`, ico: '📄',
      hay: `${t} ${l.week.label} ${l.week.title} ${(l.covers || []).join(' ')} ${l.goal || ''}`.toLowerCase(), t, base: 1,
    });
    (l.terms || []).forEach(([term, meaning]) => {
      const tt = String(term).toLowerCase();
      items.push({ kind: 'term', to: `${base}/${l.id}`, title: term, sub: `${l.week.label} · ${l.title}`, ico: '📖', hay: `${tt} ${String(meaning || '').toLowerCase()}`, t: tt, base: 0.8 });
    });
  });
  return items;
}

export function cmSearch(q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const words = s.split(/\s+/);
  const hit = (text) => words.every((w) => text.includes(w));
  index = index || build();
  const out = [];
  index.forEach((it) => {
    if (hit(it.hay)) out.push({ kind: it.kind, to: it.to, title: it.title, sub: it.sub, ico: it.ico, score: it.base + (hit(it.t) ? 1.5 : 0) });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 14);
}

export const CM_SEARCH_HINT = 'Type to search. Try “Udyam”, “Mudra”, “NPV” or “week 3”.';
