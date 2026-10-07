import { useMemo, useState } from 'react';

const PRESETS = { 'Every day 7:30': '30 7 * * *', 'Weekdays 9:00': '0 9 * * 1-5', 'Every 15 minutes': '*/15 * * * *', '1st of month 6:00': '0 6 1 * *', 'Mondays 8:45': '45 8 * * 1' };

function field(spec, min, max) {
  const set = new Set();
  for (const part of spec.split(',')) {
    let [range, step] = part.split('/'); step = step ? +step : 1;
    let lo = min, hi = max;
    if (range !== '*') { if (range.includes('-')) [lo, hi] = range.split('-').map(Number); else lo = hi = +range; }
    for (let v = lo; v <= hi; v += step) set.add(v);
  }
  return set;
}

function nextRuns(expr, n = 5) {
  const p = expr.trim().split(/\s+/);
  if (p.length !== 5) throw new Error('Cron needs 5 parts: minute hour day month weekday');
  const [mi, h, dom, mon, dow] = [field(p[0], 0, 59), field(p[1], 0, 23), field(p[2], 1, 31), field(p[3], 1, 12), field(p[4], 0, 6)];
  const out = []; const d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
  for (let i = 0; i < 600000 && out.length < n; i++) {
    if (mi.has(d.getMinutes()) && h.has(d.getHours()) && dom.has(d.getDate()) && mon.has(d.getMonth() + 1) && dow.has(d.getDay())) out.push(new Date(d));
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

export default function CronHelper() {
  const [expr, setExpr] = useState('30 7 * * 1-5');
  const r = useMemo(() => { try { return { runs: nextRuns(expr) }; } catch (e) { return { err: e.message }; } }, [expr]);
  const parts = expr.trim().split(/\s+/);
  return (
    <div className="w-cron">
      <div className="w-title">Cron expression helper</div>
      <div className="chips">{Object.entries(PRESETS).map(([k, v]) => <button key={k} className={v === expr ? 'chip on' : 'chip'} onClick={() => setExpr(v)}>{k}</button>)}</div>
      <input className="mono-in big" value={expr} onChange={(e) => setExpr(e.target.value)} />
      <div className="cron-parts">{['minute', 'hour', 'day of month', 'month', 'weekday (0=Sun)'].map((l, i) => <div key={l}><code>{parts[i] ?? '?'}</code><span>{l}</span></div>)}</div>
      {r.err ? <div className="error">{r.err}</div> : <><div className="mini-cap">next 5 runs (your local time)</div><ul className="plain">{r.runs.map((d, i) => <li key={i}>🕒 {d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</li>)}</ul></>}
    </div>
  );
}
