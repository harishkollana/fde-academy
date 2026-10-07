import { useEffect, useMemo, useState } from 'react';
import INTERVIEW from '../content/interview.js';
import { useProgress } from '../lib/store';
import Blocks from '../components/Blocks';
import Md, { Inline } from '../components/Md';
import { Empty, useDocTitle } from './shared';

const FIELDS = [
  ['situation', 'Situation', 'Where, when, what was going wrong? One or two sentences.'],
  ['task', 'Task', 'What exactly were you responsible for?'],
  ['action', 'Action', 'What did YOU do, step by step? Say “I”, not “we”.'],
  ['result', 'Result', 'What changed? Hours saved, errors cut, money recovered.'],
  ['metric', 'Key number', 'One metric you can say out loud, e.g. “close time 5 days → 3 days”.'],
];
const words = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function ReadAloud({ wordCount }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (left === null || left <= 0) return undefined;
    const t = setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const running = left !== null && left > 0;
  return (
    <div className="readaloud">
      <button className="btn" onClick={() => setLeft(running ? null : 120)}>{running ? 'Stop' : '🎙 Read aloud · 2:00'}</button>
      {left !== null && <span className={`timer ${left === 0 ? 'bad' : ''}`} role="timer" aria-live="off">{left === 0 ? 'Time. Did you finish?' : mmss(left)}</span>}
      <span className="muted small">{wordCount > 0 ? `${wordCount} words ≈ ${Math.max(1, Math.round(wordCount / 130 * 60))} s at speaking pace. Aim for 90–120 s.` : 'Write your story first.'}</span>
    </div>
  );
}

function StoryCard({ item }) {
  const { state, dispatch } = useProgress();
  const story = state.stories[item.id] || {};
  const [open, setOpen] = useState(false);
  const total = FIELDS.reduce((n, [k]) => n + words(story[k]), 0);
  const filled = FIELDS.filter(([k]) => words(story[k]) > 0).length;
  const set = (k, v) => dispatch({ type: 'story', id: item.id, story: { ...story, [k]: v } });
  return (
    <article className="card pad story">
      <div className="row wrap">
        <h3 className="h3">{item.title}</h3><span className="spacer" />
        <span className="chip">{filled}/{FIELDS.length} parts · {total} words</span>
      </div>
      <p><Inline text={item.prompt} /></p>
      {item.tips?.length > 0 && <ul className="plainlist tips">{item.tips.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>}
      <div className="story-fields">
        {FIELDS.map(([k, label, hint]) => (
          <label key={k} className={`story-f ${k === 'metric' ? 'metric' : ''}`}>
            <span className="lbl">{label}</span>
            {k === 'metric'
              ? <input className="mono-in" value={story[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
              : <textarea className="notes-ta" rows={3} value={story[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder={hint} />}
          </label>
        ))}
      </div>
      <ReadAloud wordCount={total} />
      {item.example && (
        <div className="example">
          <button className="btn-mini" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'hide' : 'show'} a model answer</button>
          {open && <div className="reveal"><Md text={item.example} /></div>}
        </div>
      )}
    </article>
  );
}

function Design({ item }) {
  return (
    <details className="card pad design">
      <summary><span className="h3">{item.title}</span></summary>
      <p><Inline text={item.prompt} /></p>
      {Array.isArray(item.blocks) && item.blocks.length > 0 && <Blocks blocks={item.blocks} idBase={item.id} />}
    </details>
  );
}

function QA({ questions }) {
  const [topic, setTopic] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const topics = useMemo(() => [...new Set(questions.map((x) => x.topic).filter(Boolean))].sort(), [questions]);
  const s = q.trim().toLowerCase();
  const list = questions.filter((x) => (topic === 'all' || x.topic === topic) && (!s || `${x.q} ${x.a}`.toLowerCase().includes(s)));
  const allOpen = list.length > 0 && list.every((x) => open[x.id]);
  return (
    <div>
      <div className="filters">
        <input className="mono-in grow" type="search" placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <select className="mono-in" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="all">All topics ({questions.length})</option>
          {topics.map((t) => <option key={t} value={t}>{t} ({questions.filter((x) => x.topic === t).length})</option>)}
        </select>
        <button className="btn-mini" onClick={() => setOpen(allOpen ? {} : Object.fromEntries(list.map((x) => [x.id, true])))}>{allOpen ? 'hide all answers' : 'reveal all'}</button>
      </div>
      <p className="muted small">Say the answer out loud first, then reveal. {list.length} question{list.length === 1 ? '' : 's'}.</p>
      <div className="qa-list">
        {list.map((x) => (
          <div className="qa card" key={x.id}>
            <button className="qa-q" aria-expanded={!!open[x.id]} onClick={() => setOpen({ ...open, [x.id]: !open[x.id] })}>
              <span className="qa-topic chip">{x.topic}</span>
              <span className="qa-text"><Inline text={x.q} /></span>
              <span className="qa-caret" aria-hidden>{open[x.id] ? '▾' : '▸'}</span>
            </button>
            {open[x.id] && <div className="reveal"><Md text={x.a} /></div>}
          </div>
        ))}
        {list.length === 0 && <div className="muted">No questions match.</div>}
      </div>
    </div>
  );
}

export default function Interview() {
  useDocTitle('Interview prep');
  const star = Array.isArray(INTERVIEW.star) ? INTERVIEW.star : [];
  const design = Array.isArray(INTERVIEW.systemDesign) ? INTERVIEW.systemDesign : [];
  const questions = Array.isArray(INTERVIEW.questions) ? INTERVIEW.questions : [];
  const [tab, setTab] = useState('star');
  const tabs = [['star', 'STAR stories', star.length], ['design', 'System design', design.length], ['qa', 'Q&A bank', questions.length]];
  return (
    <div className="page interview">
      <header className="page-head">
        <h1>🎤 Interview prep</h1>
        <p className="lead">Forward Deployed Engineer interviews test three things: can you tell a clear story about your work, can you design a system on a whiteboard, and do you know your fundamentals.</p>
      </header>
      <div className="tabs" role="tablist">
        {tabs.map(([k, label, n]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{label} <span className="muted small">{n}</span></button>)}
      </div>

      {tab === 'star' && (star.length === 0
        ? <Empty icon="✏️" title="The STAR prompts are still being written." />
        : <div className="stack">
          <div className="callout tip"><div className="callout-h">💡 STAR in one line</div><p>Situation, Task, Action, Result. Keep it to about two minutes. Use real stories from your 4.6 years, without client names. Your notes save automatically in this browser.</p></div>
          {star.map((it) => <StoryCard key={it.id} item={it} />)}
        </div>)}

      {tab === 'design' && (design.length === 0
        ? <Empty icon="✏️" title="System design prompts are still being written." />
        : <div className="stack">{design.map((it) => <Design key={it.id} item={it} />)}</div>)}

      {tab === 'qa' && (questions.length === 0
        ? <Empty icon="✏️" title="The Q&A bank is still being written." />
        : <QA questions={questions} />)}
    </div>
  );
}
