import { useEffect, useMemo, useRef, useState } from 'react';
import { newDb } from '../lib/db';
import { SCENARIOS, LEVERS, defaultState, stateKey, queryFor, buildState, explain, annotate, label, detail, extra, helpFor, verdict, BIG_ROWS } from './explainEngine';
import './extra.css';

// Reading a query plan. Every plan here is REAL: the widget builds a 1,00,000-line table in the in-browser PostgreSQL,
// applies the levers you switch (indexes, statistics) and runs EXPLAIN (ANALYZE) on the query.
const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('en-IN');

export default function ExplainViz() {
  const [scnId, setScnId] = useState(SCENARIOS[0].id);
  const scn = SCENARIOS.find((s) => s.id === scnId);
  const [st, setSt] = useState(defaultState());
  const [formId, setFormId] = useState(null);
  const [sel, setSel] = useState(0);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');
  const dbp = useRef(null);
  const queue = useRef(Promise.resolve());
  const built = useRef(null);
  const cache = useRef(new Map());

  const form = scn.forms ? (formId && scn.forms.some((f) => f.id === formId) ? formId : scn.forms[0].id) : null;
  const sql = queryFor(scn, form);
  const key = `${scn.id}|${stateKey(st)}|${form || ''}`;

  useEffect(() => {
    let dead = false;
    dbp.current = newDb();
    return () => { dead = true; const p = dbp.current; dbp.current = null; built.current = null; cache.current = new Map(); if (p) p.then((d) => { if (dead) d.close().catch(() => {}); }).catch(() => {}); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (cache.current.has(key)) { setRes(cache.current.get(key)); setSel(0); setBusy(false); setErr(''); return () => { cancelled = true; }; }
    setBusy(true);
    queue.current = queue.current.then(async () => {
      if (cancelled || !dbp.current) return;
      try {
        const db = await dbp.current;
        const sk = stateKey(st);
        if (built.current !== sk) { await buildState(db, st); built.current = sk; }
        const r = await explain(db, sql);
        cache.current.set(key, r);
        if (!cancelled) { setRes(r); setSel(0); setBusy(false); setErr(''); }
      } catch (e) { if (!cancelled) { setErr(String(e.message || e)); setBusy(false); } }
    });
    return () => { cancelled = true; };
  }, [key]);

  const info = useMemo(() => {
    if (!res) return new Map();
    return new Map(annotate(res.root).map((a, i) => [a.node, { ...a, i }]));
  }, [res]);
  const order = useMemo(() => [...info.values()].sort((a, b) => a.i - b.i), [info]);
  const chosen = order[sel] || order[0];

  const pickScenario = (id) => { setScnId(id); setSt(defaultState()); setFormId(null); };
  const flip = (k) => setSt((s) => ({ ...s, [k]: !s[k] }));

  // A plain function (not a component), so React keeps the same buttons between renders.
  const card = (n, k = 0) => {
    const { m, i } = info.get(n);
    const loops = n['Actual Loops'] || 1;
    const bits = detail(n).slice(0, 2);
    return (
      <li className="ev-li" key={k}>
        <button type="button" className={`ev-node ${m.level}${i === sel ? ' on' : ''}`} onClick={() => setSel(i)} aria-pressed={i === sel}>
          <span className="ev-name">{label(n)}</span>
          {bits.map((b) => <span key={b} className="ev-bit">{b}</span>)}
          <span className="ev-nums">
            expected {fmt(n['Plan Rows'])} row{Math.round(n['Plan Rows']) === 1 ? '' : 's'}, got {fmt(n['Actual Rows'])}{loops > 1 ? ` each time, ${fmt(loops)} times` : ''}
            {m.early && ' (stopped early by the LIMIT)'}
            {m.level !== 'ok' && <b className={`ev-flag ${m.level}`}>{Math.round(m.factor)}x off</b>}
          </span>
        </button>
        {n.Plans && <ul className="ev-ul">{n.Plans.map((c, j) => card(c, j))}</ul>}
      </li>
    );
  };

  const help = chosen ? helpFor(chosen.node) : null;
  const ex = chosen ? extra(chosen.node) : [];

  return (
    <div className="w-ev">
      <div className="w-title">Reading a query plan, on a real table of {fmt(BIG_ROWS)} lines</div>
      <div className="chips" role="group" aria-label="Scenario">
        {SCENARIOS.map((s) => <button key={s.id} type="button" className={s.id === scnId ? 'chip on' : 'chip'} onClick={() => pickScenario(s.id)}>{s.title}</button>)}
      </div>
      <p className="w-desc">{scn.story}</p>
      {scn.forms && (
        <div className="chips" role="group" aria-label="Way of writing the filter">
          <span className="lbl">write the filter as</span>
          {scn.forms.map((f) => <button key={f.id} type="button" className={f.id === form ? 'chip on' : 'chip'} onClick={() => setFormId(f.id)}>{f.label}</button>)}
        </div>
      )}
      <pre className="ev-sql">{sql}</pre>
      <div className="row wrap" role="group" aria-label="Levers">
        <span className="lbl">change the database:</span>
        {scn.levers.map((k) => <label key={k} className="toggle"><input type="checkbox" checked={!!st[k]} onChange={() => flip(k)} /> {LEVERS[k].label}</label>)}
      </div>

      {err && <div className="verdict bad">Could not run the plan: {err}</div>}
      <div className={busy ? 'ev-plan busy' : 'ev-plan'} aria-busy={busy}>
        {busy && <div className="ev-wait">{res ? 'Rebuilding the table and re-planning ...' : 'Building a table of 1,00,000 lines in your browser ...'}</div>}
        {res && (
          <>
            <div className="mini-cap">The plan. Data flows <b>upward</b>: the indented node runs first and feeds the one above it. Click a node.</div>
            <ul className="ev-tree">{card(res.root)}</ul>
            <div className="ev-stats">
              <span><b>{fmt(res.pages)}</b> pages touched</span>
              <span>plan cost <b>{Number(res.cost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b></span>
              <span><b>{fmt(res.rows)}</b> row{res.rows === 1 ? '' : 's'} returned</span>
            </div>
            <div className="ev-say">{verdict(res)}</div>
            {help && (
              <div className="ev-help">
                <div className="ev-help-h">{label(chosen.node)}{chosen.node['Relation Name'] ? ` on ${chosen.node['Relation Name']}` : ''}</div>
                <p><b>What it does.</b> {help.what}</p>
                {help.good && <p><b>Good when.</b> {help.good}</p>}
                {help.bad && <p><b>Watch out.</b> {help.bad}</p>}
                <p className="small ev-nn">Cost {chosen.node['Startup Cost']} to {chosen.node['Total Cost']} (start-up to finish, in the planner's own units) · {fmt((chosen.node['Shared Hit Blocks'] || 0) + (chosen.node['Shared Read Blocks'] || 0))} pages</p>
                {detail(chosen.node).map((b) => <p key={b} className="small ev-nn">{b}</p>)}
                {ex.map((b) => <p key={b} className="small ev-nn ev-warn">{b}</p>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
