import { useSyncExternalStore } from 'react';

// MBA + ACCA progress lives in its own small store, so it never touches the FDE or Corporate Mitra progress.
// `done` maps a lesson key (see lessonKey) to the local date the lesson was marked complete.
// `quiz` maps a lesson key to the best end-of-lesson quiz score: { score, total }.
const KEY = 'mba-acca-progress-v1';
// Local date, not UTC: in India toISOString() gives the previous day between midnight and 05:30.
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Lesson numbers repeat across subjects (every book has a 1.1.1), so the key carries the subject id.
export const lessonKey = (subjectId, no) => `${subjectId}:${no}`;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); return { done: d.done || {}, quiz: d.quiz || {} }; }
  } catch { /* ignore */ }
  return { done: {}, quiz: {} };
}

let state = load();
const subs = new Set();
const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((fn) => fn());
}

export const mba = {
  toggleLesson(key) {
    const done = { ...state.done };
    if (done[key]) delete done[key]; else done[key] = today();
    commit({ ...state, done });
  },
  // Keeps the best score; a lower score on a retry does not replace it.
  saveQuiz(key, score, total) {
    if ((state.quiz[key]?.score || 0) >= score && state.quiz[key]?.total === total) return;
    commit({ ...state, quiz: { ...state.quiz, [key]: { score, total } } });
  },
};

export const useMba = () => useSyncExternalStore(subscribe, () => state);
