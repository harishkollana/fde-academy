import { useSyncExternalStore } from 'react';

// Corporate Mitra progress lives in its own small store, so it never touches the FDE XP, levels or streak.
const KEY = 'corporate-mitra-progress-v1';
// Local date, not UTC: in India toISOString() gives the previous day between midnight and 05:30, which would break the streak.
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); return { done: d.done || {}, notes: d.notes || {}, quiz: d.quiz || {} }; }
  } catch { /* ignore */ }
  return { done: {}, notes: {}, quiz: {} };
}

let state = load();
const subs = new Set();
const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((fn) => fn());
}

export const cm = {
  toggleDone(id) {
    const done = { ...state.done };
    if (done[id]) delete done[id]; else done[id] = today();
    commit({ ...state, done });
  },
  saveQuiz(id, score, total) {
    if ((state.quiz[id]?.score || 0) >= score) return;
    commit({ ...state, quiz: { ...state.quiz, [id]: { score, total } } });
  },
  setNote(id, text) {
    const notes = { ...state.notes };
    if (text) notes[id] = text; else delete notes[id];
    commit({ ...state, notes });
  },
};

export const useCm = () => useSyncExternalStore(subscribe, () => state);
