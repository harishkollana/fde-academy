import { META, STAGES } from './meta.js';
import PLAN from './plan.json';

// Every file in ./phases/<phase-id>.js is that phase's aggregator: { modules, project?, gate? }.
// A phase without a file (or with an empty one) just shows as "coming soon". PLAN comes from docs/roadmap-v2 via `npm run plan`.
const files = import.meta.glob('./phases/*.js', { eager: true });
const parts = Object.fromEntries(Object.entries(files).map(([k, m]) => [k.match(/\/([^/]+)\.js$/)[1], m.default || {}]));

export const PHASES = META.map((m) => {
  const p = parts[m.id] || {};
  return { ...m, modules: p.modules || [], project: p.project || null, gate: p.gate || null, plan: PLAN[m.id] || [] };
});

export const ALL_LESSONS = PHASES.flatMap((p) => p.modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, phaseId: p.id, moduleId: m.id, moduleTitle: m.title, phase: p }))));
export const lessonById = Object.fromEntries(ALL_LESSONS.map((l, i) => [l.id, { ...l, index: i }]));
export const phaseById = Object.fromEntries(PHASES.map((p) => [p.id, p]));

export const plannedLessonCount = (p) => p.plan.reduce((n, m) => n + m.lessons.length, 0);

/** Stages with their phases, in journey order (the optional extended track is the last "stage"). */
export const STAGE_GROUPS = STAGES.map((s) => ({ ...s, phases: PHASES.filter((p) => p.stage === s.id) }));

export { STAGES };
