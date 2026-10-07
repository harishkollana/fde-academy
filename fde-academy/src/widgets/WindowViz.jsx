import { useState } from 'react';

const DATA = [
  ['IN01', 'Apr', 120], ['IN01', 'May', 135], ['IN01', 'Jun', 128], ['IN01', 'Jul', 150], ['IN01', 'Aug', 142],
  ['SG01', 'Apr', 40], ['SG01', 'May', 38], ['SG01', 'Jun', 45], ['SG01', 'Jul', 50], ['SG01', 'Aug', 47],
];

const FUNCS = {
  'SUM(rev) running total': { frame: 'unbounded', calc: (w) => w.reduce((a, r) => a + r[2], 0) },
  'AVG(rev) 3-month moving': { frame: 2, calc: (w) => Math.round((w.reduce((a, r) => a + r[2], 0) / w.length) * 10) / 10 },
  'LAG(rev) previous month': { lag: true },
  'ROW_NUMBER()': { rn: true },
};

export default function WindowViz() {
  const [fn, setFn] = useState('SUM(rev) running total');
  const [partition, setPartition] = useState(true);
  const [sel, setSel] = useState(3);
  const cfg = FUNCS[fn];

  const groupOf = (i) => (partition ? DATA.filter((r) => r[0] === DATA[i][0]) : DATA);
  const posIn = (i) => groupOf(i).indexOf(DATA[i]);
  const frameFor = (i) => {
    const g = groupOf(i); const p = posIn(i);
    if (cfg.lag) return p > 0 ? [g[p - 1]] : [];
    if (cfg.rn) return g.slice(0, p + 1);
    if (cfg.frame === 'unbounded') return g.slice(0, p + 1);
    return g.slice(Math.max(0, p - cfg.frame), p + 1);
  };
  const value = (i) => {
    const f = frameFor(i);
    if (cfg.lag) return f.length ? f[0][2] : null;
    if (cfg.rn) return posIn(i) + 1;
    return cfg.calc(f);
  };
  const frame = frameFor(sel);
  const sqlFn = fn.split(' ')[0];
  const over = `OVER (${partition ? 'PARTITION BY entity ' : ''}ORDER BY month${cfg.frame === 2 ? ' ROWS BETWEEN 2 PRECEDING AND CURRENT ROW' : ''})`;

  return (
    <div className="w-window">
      <div className="w-title">Window function visualizer — click any row</div>
      <div className="chips">{Object.keys(FUNCS).map((k) => <button key={k} className={k === fn ? 'chip on' : 'chip'} onClick={() => setFn(k)}>{k}</button>)}</div>
      <label className="toggle"><input type="checkbox" checked={partition} onChange={(e) => setPartition(e.target.checked)} /> PARTITION BY entity</label>
      <pre className="sqlsnip">{`SELECT entity, month, rev,\n       ${sqlFn} ${over} AS result\nFROM monthly_revenue;`}</pre>
      <table className="grid mini clicky">
        <thead><tr><th>entity</th><th>month</th><th>rev</th><th>result</th></tr></thead>
        <tbody>
          {DATA.map((r, i) => {
            const inFrame = frame.includes(r);
            const inPart = groupOf(sel).includes(r);
            return (
              <tr key={i} onClick={() => setSel(i)} className={`${i === sel ? 'cur' : ''} ${inFrame ? 'frame' : ''} ${!inPart ? 'dimrow' : ''} ${partition && i === 5 ? 'part-break' : ''}`}>
                <td>{r[0]}</td><td>{r[1]}</td><td className="num">{r[2]}</td><td className="num">{value(i) ?? <span className="null">NULL</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="w-desc">Selected row: <b>{DATA[sel][0]} {DATA[sel][1]}</b>. Yellow rows are the <b>window frame</b> the function looks at. Grey rows are in another partition, so they are invisible to this row. Unlike GROUP BY, every row stays in the output.</p>
    </div>
  );
}
