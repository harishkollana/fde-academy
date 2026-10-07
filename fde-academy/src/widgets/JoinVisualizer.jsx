import { useState } from 'react';

const L = [
  { id: 1, name: 'Apex Retail' }, { id: 2, name: 'Blue Lotus' }, { id: 3, name: 'Coastal Pharma' }, { id: 4, name: 'Delta Schools' },
];
const R = [
  { oid: 101, cust: 1, amt: 5400 }, { oid: 102, cust: 1, amt: 1800 }, { oid: 103, cust: 3, amt: 21000 }, { oid: 104, cust: 9, amt: 900 },
];

const TYPES = {
  'INNER JOIN': { l: false, r: false, both: true, desc: 'Only rows that match on both sides.' },
  'LEFT JOIN': { l: true, r: false, both: true, desc: 'Every customer. Orders where they match; NULL where they do not.' },
  'RIGHT JOIN': { l: false, r: true, both: true, desc: 'Every order. Customer where it matches; NULL where it does not.' },
  'FULL OUTER JOIN': { l: true, r: true, both: true, desc: 'Everything from both sides, matched where possible.' },
  'LEFT ANTI (… WHERE o.cust IS NULL)': { l: true, r: false, both: false, desc: 'Customers with NO orders. Great for “what is missing?”' },
  'SEMI (WHERE EXISTS …)': { semi: true, desc: 'Customers that have at least one order — each customer listed once, no order columns.' },
};

function compute(t) {
  const cfg = TYPES[t];
  const rows = [];
  if (cfg.semi) {
    L.forEach((c) => { if (R.some((o) => o.cust === c.id)) rows.push({ c, o: null, kind: 'both', semi: true }); });
    return rows;
  }
  L.forEach((c) => {
    const m = R.filter((o) => o.cust === c.id);
    if (m.length && cfg.both) m.forEach((o) => rows.push({ c, o, kind: 'both' }));
    if (!m.length && cfg.l) rows.push({ c, o: null, kind: 'left' });
  });
  if (cfg.r) R.forEach((o) => { if (!L.some((c) => c.id === o.cust)) rows.push({ c: null, o, kind: 'right' }); });
  return rows;
}

function Venn({ t }) {
  const cfg = TYPES[t];
  const fl = cfg.l ? '#ffd8a8' : 'none';
  const fr = cfg.r ? '#a5d8ff' : 'none';
  const fb = cfg.both || cfg.semi ? '#b2f2bb' : 'none';
  return (
    <svg viewBox="0 0 220 130" className="venn">
      <defs>
        <clipPath id="cl"><circle cx="85" cy="65" r="52" /></clipPath>
      </defs>
      <circle cx="85" cy="65" r="52" fill={fl} />
      <circle cx="135" cy="65" r="52" fill={fr} />
      <circle cx="135" cy="65" r="52" fill={fb} clipPath="url(#cl)" />
      <circle cx="85" cy="65" r="52" fill="none" stroke="#1f2a44" strokeWidth="2.2" strokeDasharray="3 1" />
      <circle cx="135" cy="65" r="52" fill="none" stroke="#1f2a44" strokeWidth="2.2" strokeDasharray="3 1" />
      <text x="55" y="70" className="venn-t">customers</text>
      <text x="140" y="70" className="venn-t">orders</text>
    </svg>
  );
}

export default function JoinVisualizer() {
  const [t, setT] = useState('INNER JOIN');
  const rows = compute(t);
  const sem = TYPES[t].semi;
  return (
    <div className="w-join">
      <div className="w-title">Join visualizer — click a join type</div>
      <div className="chips">{Object.keys(TYPES).map((k) => <button key={k} className={k === t ? 'chip on' : 'chip'} onClick={() => setT(k)}>{k}</button>)}</div>
      <div className="join-grid">
        <div>
          <div className="mini-cap">customers (c)</div>
          <table className="grid mini"><thead><tr><th>id</th><th>name</th></tr></thead>
            <tbody>{L.map((c) => <tr key={c.id} className={rows.some((r) => r.c === c) ? 'hit' : 'miss'}><td>{c.id}</td><td>{c.name}</td></tr>)}</tbody></table>
        </div>
        <div>
          <div className="mini-cap">orders (o)</div>
          <table className="grid mini"><thead><tr><th>oid</th><th>cust</th><th>amt</th></tr></thead>
            <tbody>{R.map((o) => <tr key={o.oid} className={rows.some((r) => r.o === o) ? 'hit' : 'miss'}><td>{o.oid}</td><td>{o.cust}</td><td>{o.amt}</td></tr>)}</tbody></table>
        </div>
        <Venn t={t} />
      </div>
      <p className="w-desc"><b>{t}</b>: {TYPES[t].desc}</p>
      <pre className="sqlsnip">{sem
        ? 'SELECT c.*\nFROM customers c\nWHERE EXISTS (SELECT 1 FROM orders o WHERE o.cust = c.id);'
        : t.startsWith('LEFT ANTI')
          ? 'SELECT c.*\nFROM customers c\nLEFT JOIN orders o ON o.cust = c.id\nWHERE o.cust IS NULL;'
          : `SELECT c.id, c.name, o.oid, o.amt\nFROM customers c\n${t} orders o ON o.cust = c.id;`}</pre>
      <div className="mini-cap">result ({rows.length} rows)</div>
      <table className="grid mini">
        <thead><tr><th>c.id</th><th>c.name</th>{!sem && <><th>o.oid</th><th>o.amt</th></>}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`k-${r.kind}`}>
              <td className={!r.c ? 'null' : ''}>{r.c ? r.c.id : 'NULL'}</td><td className={!r.c ? 'null' : ''}>{r.c ? r.c.name : 'NULL'}</td>
              {!sem && <><td className={!r.o ? 'null' : ''}>{r.o ? r.o.oid : 'NULL'}</td><td className={!r.o ? 'null' : ''}>{r.o ? r.o.amt : 'NULL'}</td></>}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Notice: customer 1 appears twice in the joined result because they have two orders. That “fan-out” is why totals double when you join before you sum.</p>
    </div>
  );
}
