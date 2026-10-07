import { useState } from 'react';
import Editor from './Editor';
import { grade } from '../lib/db';
import { useProgress } from '../lib/store';
import { ResultGrid, SchemaPeek } from './SqlPlayground';
import { Inline } from './Md';

export default function Challenge({ id, prompt, solution, starter = '', hint, ordered = false, level }) {
  const { state, dispatch } = useProgress();
  const solved = !!state.solved[id];
  const [code, setCode] = useState(state.playground[id] ?? starter);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showExp, setShowExp] = useState(false);

  const check = async () => {
    setBusy(true);
    const r = await grade(code, solution, { ordered });
    setRes(r); setBusy(false);
    if (r.ok) dispatch({ type: 'solve', id });
    dispatch({ type: 'code', id, code });
  };

  return (
    <div className={`challenge ${solved ? 'solved' : ''}`}>
      <div className="ch-head">
        <span className="pg-badge sql">SQL challenge</span>
        {level && <span className={`lvl lvl-${level}`}>{level}</span>}
        {solved && <span className="solved-tag">✓ solved · +25 XP</span>}
        <span className="spacer" />
        <button className="btn-mini" onClick={() => setShowSchema(!showSchema)}>{showSchema ? 'hide tables' : 'tables'}</button>
      </div>
      <div className="ch-prompt"><Inline text={prompt} /></div>
      <div className={showSchema ? 'pg-body with-schema' : 'pg-body'}>
        {showSchema && <SchemaPeek />}
        <div className="pg-main">
          <Editor value={code} onChange={setCode} lang="sql" onRun={check} />
          <div className="pg-actions">
            <button className="btn primary" onClick={check} disabled={busy}>{busy ? 'Checking…' : '✓ Check answer'}</button>
            <span className="muted small">{ordered ? 'row order matters' : 'row order does not matter'}</span>
            <span className="spacer" />
            {hint && <button className="btn-mini" onClick={() => setShowHint(!showHint)}>💡 hint</button>}
            <button className="btn-mini" onClick={() => setShowSol(!showSol)}>👀 solution</button>
          </div>
          {showHint && <div className="hint"><Inline text={hint} /></div>}
          {showSol && <pre className="solution">{solution}</pre>}
          {res && <div className={res.ok ? 'verdict ok' : 'verdict bad'}>{res.ok ? '🎉 ' : '✗ '}{res.msg}</div>}
          {res?.user && <ResultGrid res={res.user} max={30} />}
          {res && !res.ok && res.expected && (
            <div>
              <button className="btn-mini" onClick={() => setShowExp(!showExp)}>{showExp ? 'hide' : 'show'} expected result</button>
              {showExp && <ResultGrid res={res.expected} max={30} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
