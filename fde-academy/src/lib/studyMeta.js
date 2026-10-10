// XP, level and streak for the MBA + ACCA and Corporate Mitra top bars.
// Nothing here is saved. Everything is worked out from what each store already holds (lessons ticked with the date,
// best quiz scores), so backups, imports and resets stay correct without a change to either store's saved shape,
// and neither domain ever touches the FDE XP or streak. Un-ticking a lesson takes its XP back.

export const XP_LESSON = 20;
export const XP_QUIZ_POINT = 5;

const pad = (n) => String(n).padStart(2, '0');
// Local date, not UTC: in India toISOString() gives the previous day between midnight and 05:30.
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// `known(key)` says whether a saved key still belongs to a lesson that exists.
export function xpOf(done, quiz, known) {
  let xp = 0;
  Object.keys(done).forEach((k) => { if (known(k)) xp += XP_LESSON; });
  Object.entries(quiz).forEach(([k, q]) => { if (known(k)) xp += XP_QUIZ_POINT * (q?.score || 0); });
  return xp;
}

// Days in a row (ending today, or yesterday if nothing is done yet today) with at least one lesson marked done.
export function streakOf(done, known) {
  const days = new Set(Object.entries(done).filter(([k]) => known(k)).map(([, date]) => date));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n += 1; d.setDate(d.getDate() - 1); }
  return n;
}

// `ladder` is [[share of the XP you can earn in total, level name], ...], the first share being 0.
// Same result shape as level() in store.jsx, so the top bar treats all three domains alike.
export function levelOf(xp, max, ladder) {
  const steps = ladder.map(([share, name]) => [Math.round((share * max) / 10) * 10, name]);
  let cur = steps[0];
  let next = null;
  if (max > 0) steps.forEach((s, i) => { if (xp >= s[0]) { cur = s; next = steps[i + 1] || null; } });
  return { name: cur[1], floor: cur[0], next: next?.[0], nextName: next?.[1] };
}
