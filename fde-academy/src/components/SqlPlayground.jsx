import { useEffect, useRef, useState } from 'react';
import Editor from './Editor';
import { newDb, runSql, schema } from '../lib/db';
import { useProgress } from '../lib/store';
import { Inline } from './Md';

export function ResultGrid({ res, max = 200 }) {
  if (!res) return null;
  if (!res.cols.length) return <div className="res-msg">✓ Statement ran{res.affected != null ? ` — ${res.affected} row(s) affected` : ''}.</div>;
  return (
    <div className="grid-wrap">
      <table className="grid">
        <thead><tr>{res.cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {res.rows.slice(0, max).map((r, i) => (
            <tr key={i}>{r.map((v, j) => <td key={j} className={v === null ? 'null' : typeof v === 'number' ? 'num' : ''}>{v === null ? 'NULL' : String(v)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <div className="grid-foot">{res.rows.length} row{res.rows.length === 1 ? '' : 's'}{res.rows.length > max ? ` (showing first ${max})` : ''}</div>
    </div>
  );
}

export function SchemaPeek() {
  const [s, setS] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => { schema().then(setS); }, []);
  if (!s) return <div className="muted small">loading tables…</div>;
  return (
    <div className="schema">
      {Object.entries(s).map(([t, cols]) => (
        <div key={t} className="schema-t">
          <button className="schema-name" onClick={() => setOpen(open === t ? null : t)}>{open === t ? '▾' : '▸'} {t}</button>
          {open === t && <ul>{cols.map(([c, ty]) => <li key={c}><code>{c}</code> <span className="muted">{ty}</span></li>)}</ul>}
        </div>
      ))}
    </div>
  );
}

export default function SqlPlayground({ id, starter = '', setup, hint, solution, title, note }) {
  const { state, dispatch } = useProgress();
  const saved = id && state.playground[id];
  const [code, setCode] = useState(saved ?? starter);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const dbRef = useRef(null);

  useEffect(() => () => { dbRef.current?.then((d) => d.close?.()); }, []);

  const getDb = () => {
    if (!dbRef.current) dbRef.current = newDb().then(async (d) => { if (setup) await d.exec(setup); return d; });
    return dbRef.current;
  };

  const run = async () => {
    setBusy(true); setErr(null);
    try {
      const db = await getDb();
      const r = await runSql(db, code);
      setOut(r);
    } catch (e) { setErr(e.message); setOut(null); }
    setBusy(false);
    if (id) dispatch({ type: 'code', id, code });
  };
  const reset = async () => {
    dbRef.current?.then((d) => d.close?.()); dbRef.current = null; setOut(null); setErr(null);
  };

  const shown = out ? out.results.filter((r, i) => r.cols.length || i === out.results.length - 1) : [];

  return (
    <div className="playground">
      <div className="pg-head">
        <span className="pg-badge sql">PostgreSQL playground</span>
        {title && <span className="pg-title">{title}</span>}
        <span className="spacer" />
        <button className="btn-mini" onClick={() => setShowSchema(!showSchema)}>{showSchema ? 'hide tables' : 'tables'}</button>
        <button className="btn-mini" title="Restore the original data" onClick={reset}>reset data</button>
        <button className="btn-mini" onClick={() => setCode(starter)}>restore code</button>
      </div>
      {note && <div className="pg-note"><Inline text={note} /></div>}
      <div className={showSchema ? 'pg-body with-schema' : 'pg-body'}>
        {showSchema && <SchemaPeek />}
        <div className="pg-main">
          <Editor value={code} onChange={setCode} lang="sql" onRun={run} />
          <div className="pg-actions">
            <button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Running…' : '▶ Run'}</button>
            <span className="muted small">Ctrl/⌘ + Enter</span>
            <span className="spacer" />
            {hint && <button className="btn-mini" onClick={() => setShowHint(!showHint)}>💡 hint</button>}
            {solution && <button className="btn-mini" onClick={() => setShowSol(!showSol)}>👀 solution</button>}
          </div>
          {showHint && <div className="hint"><Inline text={hint} /></div>}
          {showSol && <pre className="solution">{solution}</pre>}
          {err && <div className="error">⚠ {err}</div>}
          {out && (
            <div className="pg-out">
              {shown.map((r, i) => <ResultGrid key={i} res={r} />)}
              <div className="muted small">{out.results.length} statement(s) · {out.ms} ms · changes stay until you press “reset data”</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
