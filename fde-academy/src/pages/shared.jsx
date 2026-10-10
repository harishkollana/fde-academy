// Small helpers and UI atoms shared by the pages (progress maths, rings, bars, empty states).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PHASES, ALL_LESSONS, plannedLessonCount } from '../content/index.js';

// There is no schedule anywhere in this app: no weeks, no deadlines. "Where you are" comes only from what you have finished.
const DAY = 86400000;
// The progress store keys activity by UTC date (toISOString), so we do the same everywhere.
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const keyOf = (d) => d.toISOString().slice(0, 10);
const parseDay = (s) => Date.parse(`${s}T00:00:00Z`);

/** Main (non-optional) phases only: the optional extended track is not on the road. */
export const MAIN_PHASES = PHASES.filter((p) => !p.optional);

/** Phases that close with an apply gate, in journey order. */
export const GATE_PHASES = PHASES.filter((p) => p.gateLetter);

/** The previous / next phase in the journey (optional phases are reachable but not part of "next"). */
export function neighbours(phase) {
  const i = PHASES.findIndex((p) => p.id === phase.id);
  const ok = (p) => p && (phase.optional || !p.optional);
  return { prev: ok(PHASES[i - 1]) ? PHASES[i - 1] : null, next: ok(PHASES[i + 1]) ? PHASES[i + 1] : null };
}

export const lessonsOf = (p) => p.modules.flatMap((m) => m.lessons || []);

/** Progress is measured against every PLANNED lesson, so an unwritten lesson counts as "not done yet". */
export function phaseProgress(p, state) {
  const ls = lessonsOf(p);
  const done = ls.filter((l) => state.done[l.id]).length;
  const total = Math.max(plannedLessonCount(p), ls.length);
  return { total, written: ls.length, done, pct: total ? done / total : 0 };
}

export const phaseComplete = (p, state) => { const pr = phaseProgress(p, state); return pr.total > 0 && pr.done >= pr.total; };

/** The first main-path phase you have not finished: where "you are here" sits. null = everything is done. */
export const currentPhase = (state) => MAIN_PHASES.find((p) => !phaseComplete(p, state)) || null;

/** An apply gate is "open" once the phase that owns it is finished (you may of course apply earlier). */
export const gateOpen = (p, state) => !!p.gateLetter && phaseComplete(p, state);

export function projectProgress(project, state) {
  let total = 0; let done = 0;
  (project?.steps || []).forEach((s, i) => (s.checklist || []).forEach((_, j) => {
    total++; if (state.checks[`proj:${project.id}:${i}:${j}`]) done++;
  }));
  return { total, done, pct: total ? done / total : 0 };
}

export function checklistProgress(items = [], prefix, state) {
  const done = items.filter((_, i) => state.checks[`${prefix}:${i}`]).length;
  return { total: items.length, done, pct: items.length ? done / items.length : 0 };
}

/** First unfinished lesson on the main path (optional extended-track lessons are never "next"). */
export const nextLesson = (state) => ALL_LESSONS.find((l) => !l.phase.optional && !state.done[l.id]) || null;

/** Monday-to-Sunday window (UTC day keys) containing `day`. */
export function weekWindow(day = new Date()) {
  const d = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  const mon = new Date(d.getTime() - dow * DAY);
  const sun = new Date(mon.getTime() + 6 * DAY);
  return [keyOf(mon), keyOf(sun)];
}

export function fmtDate(s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const t = parseDay(s);
  if (Number.isNaN(t)) return s || '';
  return new Date(t).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}

export function useDocTitle(title) {
  useEffect(() => { document.title = title ? `${title} · My Academy` : 'My Academy'; }, [title]);
}

export function Ring({ pct = 0, color = '#1f2a44', size = 22, stroke = 3, label }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2d9c4" strokeWidth={stroke} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * Math.min(1, pct)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
    </svg>
  );
}

export function Bar({ pct = 0, color, label }) {
  return (
    <div className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={label}>
      <div className="pbar-fill" style={{ width: `${Math.min(100, pct * 100)}%`, background: color }} />
    </div>
  );
}

export function Empty({ icon = '✏️', title, children }) {
  return (
    <div className="empty">
      <div className="empty-ico" aria-hidden>{icon}</div>
      <div>
        <div className="empty-t">{title}</div>
        {children && <div className="empty-b">{children}</div>}
      </div>
    </div>
  );
}

export function PhaseTag({ phase }) {
  return <Link to={`/phase/${phase.id}`} className="phase-tag" style={{ '--pc': phase.color, '--pt': phase.tint }}>{phase.emoji} Phase {phase.num}</Link>;
}

export const pct = (x) => `${Math.round(x * 100)}%`;

export const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Add n days to a yyyy-mm-dd key (UTC, same convention as the progress store). */
export const addDays = (key, n) => keyOf(new Date(parseDay(key) + n * DAY));

/** Deterministic shuffle so "random" picks stay stable between renders. */
export function seededShuffle(arr, seedStr) {
  let h = 2166136261;
  for (const ch of String(seedStr)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function CopyButton({ text, label = 'copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn-mini" onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); }}>
      {done ? 'copied ✓' : label}
    </button>
  );
}
