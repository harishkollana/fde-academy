import { useState } from 'react';

export function lev(a, b) {
  const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const ratio = (a, b) => (a.length + b.length === 0 ? 100 : Math.round((1 - lev(a, b) / Math.max(a.length, b.length)) * 100));

const PAIRS = [
  ['INV/0042/25-26', 'INV-0042/25-26', 18000, 18000],
  ['INV/1187/25-26', 'INV/1187/25-26', 9440, 9440.4],
  ['INV/0310/25-26', 'INV/0301/25-26', 5600, 5600],
  ['inv/2201/25-26 ', 'INV/2201/25-26', 12000, 12300],
  ['INV/7777/25-26', 'INV/9012/25-26', 4500, 4500],
];

export default function FuzzyMatch() {
  const [a, setA] = useState('INV/0042/25-26');
  const [b, setB] = useState('INV-0042/25-26');
  const [normalize, setNormalize] = useState(true);
  const [threshold, setThreshold] = useState(90);
  const [tol, setTol] = useState(1);
  const n = (s) => (normalize ? s.toUpperCase().replace(/[^A-Z0-9]/g, '') : s);
  const score = ratio(n(a), n(b));
  return (
    <div className="w-fuzzy">
      <div className="w-title">Fuzzy matcher — how reconciliation catches typos</div>
      <div className="row">
        <input className="mono-in" value={a} onChange={(e) => setA(e.target.value)} />
        <span className="hand">vs</span>
        <input className="mono-in" value={b} onChange={(e) => setB(e.target.value)} />
      </div>
      <div className="row">
        <label className="toggle"><input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} /> normalise first (UPPER + remove symbols)</label>
      </div>
      <div className="meter"><div className="meter-fill" style={{ width: score + '%', background: score >= threshold ? '#8ce99a' : '#ffa8a8' }} /><span>{score}% similar · edit distance {lev(n(a), n(b))}</span></div>
      <p className="muted small">Compared: <code>{n(a)}</code> vs <code>{n(b)}</code>. Edit distance = the number of single-character inserts, deletes or swaps needed to turn one into the other.</p>
      <div className="row">
        <label className="lbl">match if ≥ {threshold}%</label><input type="range" min="50" max="100" value={threshold} onChange={(e) => setThreshold(+e.target.value)} />
        <label className="lbl">amount tolerance ₹{tol}</label><input type="range" min="0" max="500" step="1" value={tol} onChange={(e) => setTol(+e.target.value)} />
      </div>
      <table className="grid mini">
        <thead><tr><th>our books</th><th>supplier</th><th>₹ ours</th><th>₹ theirs</th><th>name score</th><th>verdict</th></tr></thead>
        <tbody>
          {PAIRS.map(([x, y, p, q], i) => {
            const s = ratio(n(x), n(y)); const exact = n(x) === n(y); const amtOk = Math.abs(p - q) <= tol;
            const v = exact && amtOk ? 'Matched' : s >= threshold && amtOk ? 'Matched (fuzzy)' : s >= threshold ? 'Amount mismatch' : 'Not found';
            return <tr key={i} className={v.startsWith('Matched') ? 'k-both' : 'k-left'}><td><code>{x}</code></td><td><code>{y}</code></td><td>{p}</td><td>{q}</td><td>{s}%</td><td>{v}</td></tr>;
          })}
        </tbody>
      </table>
      <p className="w-desc">Try a high threshold (98%) and watch “INV/0310 vs INV/0301” fail. Those are swapped digits, a real typo pattern. Then lower it to 85% and see the risk: different invoices can start matching. A fuzzy match should be <b>flagged for review</b>, never silently accepted.</p>
    </div>
  );
}
