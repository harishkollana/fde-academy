import { useState } from 'react';
import Editor from './Editor';
import { runPy, testPy } from '../lib/py';
import { useProgress } from '../lib/store';
import { Inline } from './Md';

export default function PyPlayground({ id, starter = '', hint, solution, title, note }) {
  const { state, dispatch } = useProgress();
  const [code, setCode] = useState((id && state.playground[id]) ?? starter);
  const [out, setOut] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);

  const run = async () => {
    setBusy(true); setOut(''); setOk(null);
    try {
      const r = await runPy(code, { onStatus: setStatus, onOut: setOut });
      setOk(r.ok); setStatus(`finished in ${r.ms} ms`);
    } catch (e) { setOut(String(e.message)); setStatus(''); setOk(false); }
    setBusy(false);
    if (id) dispatch({ type: 'code', id, code });
  };

  return (
    <div className="playground">
      <div className="pg-head">
        <span className="pg-badge py">Python playground</span>
        {title && <span className="pg-title">{title}</span>}
        <span className="spacer" />
        <button className="btn-mini" onClick={() => setCode(starter)}>restore code</button>
      </div>
      {note && <div className="pg-note"><Inline text={note} /></div>}
      <Editor value={code} onChange={setCode} lang="python" onRun={run} />
      <div className="pg-actions">
        <button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Running…' : '▶ Run'}</button>
        <span className="muted small">{status || 'Ctrl/⌘ + Enter · files live in /data (gl, orders, employees… as CSV)'}</span>
        <span className="spacer" />
        {hint && <button className="btn-mini" onClick={() => setShowHint(!showHint)}>💡 hint</button>}
        {solution && <button className="btn-mini" onClick={() => setShowSol(!showSol)}>👀 solution</button>}
      </div>
      {showHint && <div className="hint"><Inline text={hint} /></div>}
      {showSol && <pre className="solution">{solution}</pre>}
      {(out || busy) && <pre className={`console ${ok === false ? 'bad' : ''}`}>{out || '…'}</pre>}
    </div>
  );
}

export function PyChallenge({ id, prompt, starter, tests, hint, solution }) {
  const { state, dispatch } = useProgress();
  const solved = !!state.solved[id];
  const [code, setCode] = useState(state.playground[id] ?? starter);
  const [res, setRes] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const check = async () => {
    setBusy(true); setRes(null);
    try {
      const r = await testPy(code, tests, { onStatus: setStatus });
      setRes(r); setStatus('');
      if (r.ok) dispatch({ type: 'solve', id });
    } catch (e) { setRes({ ok: false, out: e.message }); }
    setBusy(false);
    dispatch({ type: 'code', id, code });
  };
  return (
    <div className={`challenge ${solved ? 'solved' : ''}`}>
      <div className="ch-head"><span className="pg-badge py">Python challenge</span>{solved && <span className="solved-tag">✓ solved · +25 XP</span>}</div>
      <div className="ch-prompt"><Inline text={prompt} /></div>
      <Editor value={code} onChange={setCode} lang="python" onRun={check} />
      <div className="pg-actions">
        <button className="btn primary" onClick={check} disabled={busy}>{busy ? 'Checking…' : '✓ Check my code'}</button>
        <span className="muted small">{status}</span>
        <span className="spacer" />
        {hint && <button className="btn-mini" onClick={() => setShowHint(!showHint)}>💡 hint</button>}
        {solution && <button className="btn-mini" onClick={() => setShowSol(!showSol)}>👀 solution</button>}
      </div>
      {showHint && <div className="hint"><Inline text={hint} /></div>}
      {showSol && <pre className="solution">{solution}</pre>}
      {res && <div className={res.ok ? 'verdict ok' : 'verdict bad'}>{res.ok ? '🎉 All tests passed!' : '✗ Not yet. Read the error below, fix, and try again.'}</div>}
      {res?.out && <pre className={`console ${res.ok ? '' : 'bad'}`}>{res.out}</pre>}
    </div>
  );
}
