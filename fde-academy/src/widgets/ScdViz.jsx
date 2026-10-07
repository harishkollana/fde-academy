import { useMemo, useState } from 'react';
import { SCENARIOS, TYPE_INFO, buildDim, report, checks, attribute, truthDept, factsFor, monthLabel, money, OPEN_END } from './scdEngine';
import './extra.css';

// Slowly changing dimensions. A real engine (scdEngine.js) applies the changes to a dimension and re-runs the department report,
// then compares it with what really happened. Try the third scenario with the naive loader on Type 2.
export default function ScdViz() {
  const [scnId, setScnId] = useState(SCENARIOS[0].id);
  const scn = SCENARIOS.find((s) => s.id === scnId);
  const [type, setType] = useState(2);
  const [careful, setCareful] = useState(false);
  const [steps, setSteps] = useState(0);

  const dim = useMemo(() => buildDim(type, scn, steps, careful), [type, scn, steps, careful]);
  const rep = useMemo(() => report(type, scn, dim.rows), [type, scn, dim]);
  const probs = useMemo(() => (type === 2 ? checks(dim.rows) : []), [type, dim]);
  const last = dim.log[dim.log.length - 1];
  const touched = new Set(dim.log.flatMap((l) => l.touched));
  const lastTouched = new Set(last ? last.touched : []);
  const done = steps === scn.events.length;
  const facts = factsFor(scn.months).filter((f) => f.emp_id === 6);

  const pickScenario = (id) => { setScnId(id); setSteps(0); };
  const cols = type === 2 ? ['sk', 'emp_id', 'name', 'department', 'valid_from', 'valid_to', 'is_current'] : type === 3 ? ['emp_id', 'name', 'department', 'previous_department'] : ['emp_id', 'name', 'department'];
  const cell = (r, c) => { const v = r[c]; if (v === null || v === undefined) return 'NULL'; if (typeof v === 'boolean') return v ? 'true' : 'false'; return v === OPEN_END ? '9999-12-31' : String(v); };

  return (
    <div className="w-scd">
      <div className="w-title">Slowly changing dimensions: one change, three designs</div>
      <div className="chips" role="group" aria-label="Scenario">
        {SCENARIOS.map((s) => <button key={s.id} type="button" className={s.id === scnId ? 'chip on' : 'chip'} onClick={() => pickScenario(s.id)}>{s.title}</button>)}
      </div>
      <p className="w-desc">{scn.story}</p>
      <div className="chips" role="group" aria-label="Design">
        {[1, 2, 3].map((t) => <button key={t} type="button" className={t === type ? 'chip on' : 'chip'} onClick={() => setType(t)}>{TYPE_INFO[t].name}</button>)}
      </div>
      <p className="w-desc small">{TYPE_INFO[type].idea}</p>
      <div className="row wrap" role="group" aria-label="Loader">
        <span className="lbl">the loader is</span>
        <label className="toggle"><input type="radio" name="scd-loader" checked={!careful} onChange={() => setCareful(false)} /> naive (applies changes in the order they arrive)</label>
        <label className="toggle"><input type="radio" name="scd-loader" checked={careful} onChange={() => setCareful(true)} /> careful (respects the effective date)</label>
      </div>

      <div className="mini-cap">Changes, in the order they reach the warehouse</div>
      <ol className="scd-events">
        {scn.events.map((e, i) => <li key={e.id} className={i < steps ? 'applied' : i === steps ? 'next' : ''}><b>{e.id}</b> {e.text} {i < steps ? <span className="scd-done">applied</span> : null}</li>)}
      </ol>
      <div className="row wrap">
        <button type="button" className="btn primary" disabled={done} onClick={() => setSteps((s) => s + 1)}>Apply {done ? 'next change' : scn.events[steps].id}</button>
        <button type="button" className="btn-mini" disabled={done} onClick={() => setSteps(scn.events.length)}>apply all</button>
        <button type="button" className="btn-mini" disabled={steps === 0} onClick={() => setSteps(0)}>reset</button>
      </div>

      <div className="mini-cap">dim_employee now{steps === 0 ? ' (before any change)' : ''}</div>
      <div className="scd-scroll">
        <table className="grid mini scd-dim">
          <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {dim.rows.map((r, i) => (
              <tr key={i} className={lastTouched.has(r) ? 'scd-new' : touched.has(r) ? 'scd-old' : ''}>
                {cols.map((c) => <td key={c} className={r[c] === null ? 'null' : ''}>{cell(r, c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {last && (
        <div className="scd-run">
          <div className="scd-note">{last.note}</div>
          {last.sql.length > 0 && <pre>{last.sql.join('\n')}</pre>}
        </div>
      )}
      {type === 2 && steps > 0 && (probs.length
        ? <div className="verdict bad"><b>The dimension is broken.</b><ul className="scd-probs">{probs.map((p) => <li key={p}>{p}</li>)}</ul></div>
        : <div className="verdict ok">Structure check passed: no gaps, no overlaps, exactly one open row per employee.</div>)}

      <div className="mini-cap">Ananya's payroll lines, and the department each design gives them</div>
      <div className="scd-scroll">
        <table className="grid mini">
          <thead><tr><th>month</th><th className="num">gross pay</th><th>counted under</th><th>really was</th></tr></thead>
          <tbody>
            {facts.map((f) => {
              const got = attribute(type, dim.rows, f); const want = truthDept(scn, 6, f.month);
              return <tr key={f.month} className={got === want ? '' : 'scd-bad'}><td>{monthLabel(f.month)}</td><td className="num">{money(f.amount)}</td><td>{got}</td><td>{want}</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="mini-cap">Payroll cost by department and month (all three employees)</div>
      <div className="scd-scroll">
        <table className="grid mini scd-rep">
          <thead><tr><th>department</th>{scn.months.map((m) => <th key={m} className="num">{monthLabel(m)}</th>)}</tr></thead>
          <tbody>
            {rep.grid.map((g) => (
              <tr key={g.dept}><td>{g.dept}</td>{g.cells.map((c) => (
                <td key={c.month} className={c.bad ? 'num scd-bad' : 'num'}>{money(c.got)}{c.bad && <span className="scd-want">should be {c.want ? money(c.want) : '0'}</span>}</td>
              ))}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {steps > 0 && (rep.wrong === 0
        ? <div className="verdict ok">Every cell matches what really happened in that month.</div>
        : <div className="verdict bad">{rep.wrong} of {rep.total} cells differ from what really happened in that month. {type === 1 || type === 3 ? 'The current department is applied to all of the past.' : 'The dimension no longer describes the timeline correctly.'}</div>)}
    </div>
  );
}
