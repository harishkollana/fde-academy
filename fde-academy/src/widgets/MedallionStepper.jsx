import { useState } from 'react';

const RAW = [
  ['1001', ' 2026-09-01', 'sku-lap-01', 'Online', '92000', '_file=orders_0901.csv'],
  ['1002', '01/09/2026', 'SKU-MOU-04', 'online ', '1800', '_file=orders_0901.csv'],
  ['1002', '01/09/2026', 'SKU-MOU-04', 'online ', '1800', '_file=orders_0901.csv'],
  ['1003', '2026-09-02', 'SKU-LIC-05', 'Partner', '36,000', '_file=orders_0902.csv'],
  ['1004', '2026-09-02', 'SKU-LAP-01', 'Direct', '', '_file=orders_0902.csv'],
];
const SILVER = [
  ['1001', '2026-09-01', 'SKU-LAP-01', 'Online', '92000.00'],
  ['1002', '2026-09-01', 'SKU-MOU-04', 'Online', '1800.00'],
  ['1003', '2026-09-02', 'SKU-LIC-05', 'Partner', '36000.00'],
  ['1004', '2026-09-02', 'SKU-LAP-01', 'Direct', 'NULL ⚑'],
];
const GOLD = [
  ['2026-09-01', 'Online', '2', '93800.00'],
  ['2026-09-02', 'Partner', '1', '36000.00'],
  ['2026-09-02', 'Direct', '1', '0.00 ⚑'],
];

const STAGES = [
  { k: 'Source files', c: '#e9ecef', cols: ['order_id', 'date', 'sku', 'channel', 'amount', 'meta'], rows: RAW, note: 'Messy CSV drops from the ERP: mixed date formats, lowercase SKUs, trailing spaces, a duplicate, a comma in a number, a blank amount.' },
  { k: 'Bronze (raw)', c: '#ffd8a8', cols: ['order_id', 'date', 'sku', 'channel', 'amount', '_dlt_load_id'], rows: RAW, note: 'Loaded AS-IS by dlt, everything as text, plus load metadata. Never edit bronze: it is your receipt of what arrived.' },
  { k: 'Silver (clean)', c: '#dee2e6', cols: ['order_id', 'order_date', 'sku', 'channel', 'amount'], rows: SILVER, note: 'dbt staging model: cast types, parse both date formats, UPPER + TRIM, dedupe with ROW_NUMBER, flag the blank amount. One row = one order.' },
  { k: 'Gold (business)', c: '#ffec99', cols: ['day', 'channel', 'orders', 'revenue'], rows: GOLD, note: 'dbt mart: aggregated, named the way the business talks. Dashboards and AI agents read ONLY from gold.' },
];

export default function MedallionStepper() {
  const [i, setI] = useState(0);
  const s = STAGES[i];
  return (
    <div className="w-medal">
      <div className="w-title">Medallion layers — follow 5 rows through the pipeline</div>
      <div className="medal-track">
        {STAGES.map((x, j) => (
          <button key={x.k} className={`medal ${j === i ? 'on' : ''}`} style={{ background: x.c }} onClick={() => setI(j)}>{x.k}</button>
        ))}
      </div>
      <table className="grid mini"><thead><tr>{s.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{s.rows.map((r, j) => <tr key={j} className={i >= 2 && r.some((v) => String(v).includes('⚑')) ? 'k-left' : i === 1 && j === 2 ? 'k-left' : ''}>{r.map((v, k) => <td key={k}><code>{JSON.stringify(v).slice(1, -1)}</code></td>)}</tr>)}</tbody></table>
      <p className="w-desc">{s.note}</p>
      <div className="row"><button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>← back</button><button className="btn primary" disabled={i === 3} onClick={() => setI(i + 1)}>next layer →</button></div>
    </div>
  );
}
