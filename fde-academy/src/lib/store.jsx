import { createContext, useContext, useEffect, useReducer } from 'react';

const KEY = 'fde-academy-progress-v1';
const today = () => new Date().toISOString().slice(0, 10);

const initial = {
  startDate: today(),
  done: {},        // lessonId -> date
  quiz: {},        // lessonId -> {score,total}
  checks: {},      // any checkbox key -> true  (tasks, project steps, gate items)
  solved: {},      // challengeId -> true
  notes: {},       // lessonId -> text
  activity: {},    // yyyy-mm-dd -> xp earned that day
  xp: 0,
  apps: [],        // job applications
  stories: {},     // STAR stories
  playground: {},  // saved code per playground id
};

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...initial, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return initial;
}

const gain = (s, n) => ({ ...s, xp: s.xp + n, activity: { ...s.activity, [today()]: (s.activity[today()] || 0) + n } });

function reducer(s, a) {
  switch (a.type) {
    case 'complete':
      if (s.done[a.id]) return { ...s, done: Object.fromEntries(Object.entries(s.done).filter(([k]) => k !== a.id)) };
      return gain({ ...s, done: { ...s.done, [a.id]: today() } }, 20);
    case 'quiz': {
      const prev = s.quiz[a.id]?.score || 0;
      const best = Math.max(prev, a.score);
      return gain({ ...s, quiz: { ...s.quiz, [a.id]: { score: best, total: a.total } } }, Math.max(0, best - prev) * 5);
    }
    case 'check': {
      const on = !s.checks[a.key];
      const checks = { ...s.checks }; if (on) checks[a.key] = true; else delete checks[a.key];
      return on ? gain({ ...s, checks }, a.xp ?? 10) : { ...s, checks };
    }
    case 'solve':
      if (s.solved[a.id]) return s;
      return gain({ ...s, solved: { ...s.solved, [a.id]: today() } }, 25);
    case 'note': return { ...s, notes: { ...s.notes, [a.id]: a.text } };
    case 'code': return { ...s, playground: { ...s.playground, [a.id]: a.code } };
    case 'apps': return { ...s, apps: a.apps };
    case 'story': return { ...s, stories: { ...s.stories, [a.id]: a.story } };
    case 'import': return { ...initial, ...a.data };
    case 'reset': return { ...initial, startDate: today() };
    case 'setStart': return { ...s, startDate: a.date };
    default: return s;
  }
}

const Ctx = createContext(null);

export function ProgressProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useProgress = () => useContext(Ctx);

export function streak(activity) {
  let n = 0; const d = new Date();
  if (!activity[today()]) d.setDate(d.getDate() - 1);
  for (;;) { const k = d.toISOString().slice(0, 10); if (activity[k]) { n++; d.setDate(d.getDate() - 1); } else break; }
  return n;
}

export function level(xp) {
  // ~85 XP per finished lesson (20 complete + quiz + task + challenges); thresholds line up with the end of each stage of the 403-lesson journey (12 stages; one level per stage end).
  const levels = [[0, 'Curious Beginner'], [1800, 'Systems Thinker'], [9500, 'SQL & Python Engineer'], [12000, 'Automation Builder'], [14000, 'API Builder'],
    [17000, 'Cloud Engineer'], [19500, 'Backend Engineer'], [22000, 'Pipeline Builder'], [24500, 'Orchestrator'], [27000, 'Data Platform Engineer'],
    [30500, 'AI Builder'], [32000, 'Agent Engineer'], [34000, 'Forward Deployed Engineer']];
  let cur = levels[0], next = null;
  for (let i = 0; i < levels.length; i++) { if (xp >= levels[i][0]) { cur = levels[i]; next = levels[i + 1] || null; } }
  return { name: cur[1], floor: cur[0], next: next?.[0], nextName: next?.[1] };
}
