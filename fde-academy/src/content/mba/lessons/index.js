import accounting from './accounting-for-managers.js';
import economics from './managerial-economics.js';
import marketing from './marketing-management.js';
import communication from './professional-communication.js';
import statistics from './statistics-for-management.js';

// Every file default-exports { '<lesson no>': { p: [key points], q: [[question, [options], index of the right option, why], ...] } }.
// Lessons without an entry still open; they just show "not written yet" and have no quiz.
const RAW = {
  'accounting-for-managers': accounting,
  'managerial-economics': economics,
  'marketing-management': marketing,
  'professional-communication': communication,
  'statistics-for-management': statistics,
};

// The options are written in whatever order is natural, so the right answer would land in the same few places.
// Each question's options are shuffled once with a seed made from its own id: the order is different per question
// but never changes between visits, and `a` is remapped to follow the right option.
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function shuffled(seedText, options, answer) {
  const order = options.map((_, i) => i);
  const rnd = seeded(seedText);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { o: order.map((i) => options[i]), a: order.indexOf(answer) };
}

const cache = new Map();

export const contentOf = (subjectId, no) => {
  const id = `${subjectId}:${no}`;
  if (cache.has(id)) return cache.get(id);
  const c = RAW[subjectId]?.[no];
  const out = c
    ? { points: c.p, quiz: (c.q || []).map(([q, o, a, why], i) => ({ q, ...shuffled(`${id}#${i}`, o, a), why })) }
    : null;
  cache.set(id, out);
  return out;
};
