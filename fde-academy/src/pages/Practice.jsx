import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PRACTICE from '../content/practice.js';
import { useProgress } from '../lib/store';
import Challenge from '../components/Challenge';
import { PyChallenge } from '../components/PyPlayground';
import { Bar, Empty, useDocTitle, todayKey, seededShuffle } from './shared';

const LEVELS = ['easy', 'medium', 'hard'];
const LVL_ORDER = { easy: 0, medium: 1, hard: 2 };

export default function Practice() {
  useDocTitle('Practice arena');
  const { state } = useProgress();
  const [params, setParams] = useSearchParams();
  const tab = params.get('t') === 'py' ? 'py' : 'sql';
  const selId = params.get('id');
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [shuffle, setShuffle] = useState(0);

  const sqlAll = Array.isArray(PRACTICE.sql) ? PRACTICE.sql : [];
  const pyAll = Array.isArray(PRACTICE.python) ? PRACTICE.python : [];
  const all = tab === 'sql' ? sqlAll : pyAll;
  const topics = useMemo(() => [...new Set(all.map((c) => c.topic).filter(Boolean))].sort(), [all]);
  const list = all.filter((c) => (level === 'all' || c.level === level) && (topic === 'all' || c.topic === topic))
    .slice().sort((a, b) => (LVL_ORDER[a.level] ?? 9) - (LVL_ORDER[b.level] ?? 9) || String(a.id).localeCompare(String(b.id)));
  const solvedIn = (xs) => xs.filter((c) => state.solved[c.id]).length;

  const select = (t, id) => setParams(id ? { t, id } : { t }, { replace: false });
  const switchTab = (t) => { setLevel('all'); setTopic('all'); select(t, null); };
  const current = selId ? all.find((c) => c.id === selId) : null;
  const idx = current ? list.findIndex((c) => c.id === current.id) : -1;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  // Drill: two unsolved problems, stable for the day, reshuffled on request.
  const drill = useMemo(() => {
    const pool = [...sqlAll.map((c) => ({ ...c, t: 'sql' })), ...pyAll.map((c) => ({ ...c, t: 'py' }))].filter((c) => !state.solved[c.id]);
    return seededShuffle(pool, `${todayKey()}-${shuffle}`).slice(0, 2);
  }, [sqlAll, pyAll, state.solved, shuffle]);

  const nothing = sqlAll.length === 0 && pyAll.length === 0;

  return (
    <div className="page practice">
      <header className="page-head">
        <h1>🎯 Practice arena</h1>
        <p className="lead">Interview-style problems, graded instantly. Try each one without AI first. Look at the hint only after a real attempt, and the solution last.</p>
      </header>

      {nothing && <Empty icon="🏗️" title="The practice problems are still being written.">Check back soon. In the meantime the <Link to="/sandbox">Sandbox</Link> lets you run any SQL or Python you like.</Empty>}

      {!nothing && (
        <>
          <section className="card pad drill" aria-label="Pick two to try">
            <div className="row wrap"><h2 className="h2">🎲 Pick two to try</h2><span className="spacer" /><button className="btn-mini" onClick={() => setShuffle(shuffle + 1)}>shuffle</button></div>
            {drill.length === 0 ? <div className="muted">You have solved everything available. Impressive. Redo old ones from memory.</div> : (
              <div className="drill-grid">
                {drill.map((c) => (
                  <Link key={c.id} className="drill-item" to={`/practice?t=${c.t}&id=${c.id}`}>
                    <span className={`pg-badge ${c.t === 'sql' ? 'sql' : 'py'}`}>{c.t === 'sql' ? 'SQL' : 'Python'}</span>
                    <span className="drill-t">{c.title || c.id}</span>
                    <span className={`lvl lvl-${c.level}`}>{c.level}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'sql'} className={`tab ${tab === 'sql' ? 'on' : ''}`} onClick={() => switchTab('sql')}>SQL <span className="muted small">{solvedIn(sqlAll)}/{sqlAll.length}</span></button>
            <button role="tab" aria-selected={tab === 'py'} className={`tab ${tab === 'py' ? 'on' : ''}`} onClick={() => switchTab('py')}>Python <span className="muted small">{solvedIn(pyAll)}/{pyAll.length}</span></button>
          </div>

          <div className="filters">
            <div className="chips" aria-label="Level">
              <button className={level === 'all' ? 'chip on' : 'chip'} onClick={() => setLevel('all')}>All levels</button>
              {LEVELS.map((l) => <button key={l} className={level === l ? 'chip on' : 'chip'} onClick={() => setLevel(l)}>{l} {all.filter((c) => c.level === l).length}</button>)}
            </div>
            {topics.length > 0 && (
              <label className="topic-pick"><span className="lbl">Topic</span>
                <select className="mono-in" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="all">All topics</option>
                  {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            )}
            <span className="spacer" />
            <span className="muted small">{list.length} shown · {solvedIn(list)} solved</span>
          </div>
          <Bar pct={all.length ? solvedIn(all) / all.length : 0} color="#2f9e44" label={`${tab} problems solved`} />

          {all.length === 0 && <Empty icon="🏗️" title={`No ${tab === 'sql' ? 'SQL' : 'Python'} problems yet.`}>They are on their way.</Empty>}

          <div className="practice-layout">
            <ul className="plist" aria-label="Problems">
              {list.map((c) => (
                <li key={c.id}>
                  <button className={`pitem ${current?.id === c.id ? 'on' : ''} ${state.solved[c.id] ? 'solved' : ''}`} onClick={() => select(tab, c.id)} aria-current={current?.id === c.id ? 'true' : undefined}>
                    <span className="ptick" aria-hidden>{state.solved[c.id] ? '✓' : ''}</span>
                    <span className="pt-t">{c.title || c.id}</span>
                    <span className={`lvl lvl-${c.level}`}>{c.level}</span>
                  </button>
                </li>
              ))}
              {all.length > 0 && list.length === 0 && <li className="muted pad-s">No problems match these filters.</li>}
            </ul>

            <div className="pdetail">
              {!current && all.length > 0 && <div className="empty"><div className="empty-ico" aria-hidden>👈</div><div><div className="empty-t">Pick a problem to start.</div><div className="empty-b">Easy ones first. Each correct answer earns 25 XP.</div></div></div>}
              {current && (
                <div key={current.id}>
                  <div className="row wrap pd-head">
                    <h2 className="h2">{current.title || current.id}</h2>
                    {current.topic && <span className="chip">{current.topic}</span>}
                    <span className="spacer" />
                    <span className="muted small">{idx + 1} of {list.length}</span>
                  </div>
                  {tab === 'sql'
                    ? <Challenge id={current.id} prompt={current.prompt} solution={current.solution} starter={current.starter || ''} hint={current.hint} ordered={!!current.ordered} level={current.level} />
                    : <PyChallenge id={current.id} prompt={current.prompt} starter={current.starter} tests={current.tests} hint={current.hint} solution={current.solution} />}
                  <div className="pn">
                    {prev ? <button className="btn pn-l" onClick={() => select(tab, prev.id)}><span className="muted small">← Previous</span><span className="pn-t">{prev.title || prev.id}</span></button> : <span />}
                    {next ? <button className="btn pn-r" onClick={() => select(tab, next.id)}><span className="muted small">Next →</span><span className="pn-t">{next.title || next.id}</span></button> : <span />}
                  </div>
                </div>
              )}
              {selId && !current && all.length > 0 && <div className="error">No problem with id “{selId}” in this tab.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
