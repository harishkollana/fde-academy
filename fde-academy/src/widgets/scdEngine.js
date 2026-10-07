// ScdViz engine: slowly changing dimensions, Types 1, 2 and 3, including a change that arrives late.
// Pure JS (no React, no database) so Node can test it. The facts are the real Kollana payroll amounts for Aug and Sep 2026;
// the months after September are illustrative (they repeat September) so that the scenarios have enough history.

export const OPEN_END = '9999-12-31';

export const addDays = (iso, d) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + d * 86400000).toISOString().slice(0, 10);

export const PEOPLE = [
  { emp_id: 5, name: 'Rohan Iyer', department: 'Operations', since: '2020-06-07' },
  { emp_id: 6, name: 'Ananya Rao', department: 'Sales', since: '2015-06-01' },
  { emp_id: 7, name: 'Kabir Menon', department: 'Engineering', since: '2023-10-08' },
];

const MONTHS = ['2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01'];
const monthName = (m) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m.slice(5, 7) - 1];
export const monthLabel = (m) => `${monthName(m)} ${m.slice(0, 4)}`;

// Gross pay per employee per month (Aug and Sep are the real rows of the payroll table).
const PAY = { 5: () => 166666.67, 7: () => 58333.33, 6: (m) => (m === '2026-08-01' ? 108333.33 : 259999.99) };
export const factsFor = (months) => months.flatMap((m) => PEOPLE.map((p) => ({ emp_id: p.emp_id, month: m, amount: PAY[p.emp_id](m) })));

export const SCENARIOS = [
  {
    id: 'one',
    title: 'One move',
    story: 'Ananya Rao (employee 6) moves from Sales to Finance on 1 September 2026. Her pay jumped in September too. Which department should the August payroll belong to?',
    months: MONTHS.slice(0, 2),
    events: [{ id: 'E1', emp_id: 6, value: 'Finance', effective: '2026-09-01', text: 'HR moves Ananya to Finance from 1 Sep 2026' }],
  },
  {
    id: 'two',
    title: 'Two moves in a row',
    story: 'Ananya moves to Finance on 1 September and again to Operations on 1 November. The months after September are illustrative (her September pay repeats).',
    months: MONTHS,
    events: [
      { id: 'E1', emp_id: 6, value: 'Finance', effective: '2026-09-01', text: 'HR moves Ananya to Finance from 1 Sep 2026' },
      { id: 'E2', emp_id: 6, value: 'Operations', effective: '2026-11-01', text: 'HR moves Ananya to Operations from 1 Nov 2026' },
    ],
  },
  {
    id: 'late',
    title: 'A change arrives late',
    story: 'The November move reaches the warehouse first. The September move is entered in the HR system late and reaches the warehouse second, with an effective date in the past. The real timeline is Sales, then Finance, then Operations.',
    months: MONTHS,
    events: [
      { id: 'E1', emp_id: 6, value: 'Operations', effective: '2026-11-01', text: 'arrives first: Ananya moves to Operations from 1 Nov 2026' },
      { id: 'E2', emp_id: 6, value: 'Finance', effective: '2026-09-01', text: 'arrives LATE: Ananya moved to Finance on 1 Sep 2026' },
    ],
  },
];

// What really happened in the world, ordered by effective date and not by arrival.
export function truthDept(scn, emp_id, month) {
  let d = PEOPLE.find((p) => p.emp_id === emp_id).department;
  [...scn.events].filter((e) => e.emp_id === emp_id).sort((a, b) => (a.effective < b.effective ? -1 : 1)).forEach((e) => { if (e.effective <= month) d = e.value; });
  return d;
}

const sqlText = (s) => `'${String(s).replace(/'/g, "''")}'`;
const dt = (d) => `DATE '${d}'`;

// Build the dimension after applying the first `steps` events in ARRIVAL order.
// careful = false: the naive loader (assumes changes arrive in date order). careful = true: it respects effective dates.
export function buildDim(type, scn, steps, careful) {
  let sk = 0;
  const lastEff = {};
  const rows = PEOPLE.map((p) => {
    lastEff[p.emp_id] = p.since;
    if (type === 2) return { sk: ++sk, emp_id: p.emp_id, name: p.name, department: p.department, valid_from: p.since, valid_to: OPEN_END, is_current: true };
    if (type === 3) return { emp_id: p.emp_id, name: p.name, department: p.department, previous_department: null };
    return { emp_id: p.emp_id, name: p.name, department: p.department };
  });
  const log = [];
  scn.events.slice(0, steps).forEach((ev) => {
    const entry = { ev, sql: [], note: '', touched: [] };
    if (type === 1 || type === 3) {
      const row = rows.find((r) => r.emp_id === ev.emp_id);
      if (careful && ev.effective < lastEff[ev.emp_id]) {
        entry.note = `${ev.id} is older (${ev.effective}) than the value already stored (${lastEff[ev.emp_id]}), so the careful loader ignores it.`;
      } else {
        if (type === 3) { row.previous_department = row.department; entry.sql.push(`UPDATE dim_employee SET previous_department = department, department = ${sqlText(ev.value)} WHERE emp_id = ${ev.emp_id};`); }
        else entry.sql.push(`UPDATE dim_employee SET department = ${sqlText(ev.value)} WHERE emp_id = ${ev.emp_id};`);
        row.department = ev.value;
        lastEff[ev.emp_id] = ev.effective;
        entry.touched.push(row);
        entry.note = type === 1 ? 'The old value is overwritten. The history is gone.' : 'The old value moves to the previous column. Only ONE step of history survives.';
      }
    } else if (!careful) {
      const cur = rows.find((r) => r.emp_id === ev.emp_id && r.is_current);
      cur.valid_to = addDays(ev.effective, -1); cur.is_current = false;
      const n = { sk: ++sk, emp_id: ev.emp_id, name: cur.name, department: ev.value, valid_from: ev.effective, valid_to: OPEN_END, is_current: true };
      rows.push(n);
      entry.sql.push(`UPDATE dim_employee SET valid_to = ${dt(cur.valid_to)}, is_current = false WHERE emp_id = ${ev.emp_id} AND is_current;`);
      entry.sql.push(`INSERT INTO dim_employee (emp_id, name, department, valid_from, valid_to, is_current)\nVALUES (${ev.emp_id}, ${sqlText(n.name)}, ${sqlText(ev.value)}, ${dt(ev.effective)}, ${dt(OPEN_END)}, true);`);
      entry.touched.push(cur, n);
      entry.note = 'The naive loader closes "the current row" and opens a new one. That is only right when changes arrive in date order.';
    } else {
      const cover = rows.find((r) => r.emp_id === ev.emp_id && r.valid_from <= ev.effective && ev.effective <= r.valid_to);
      if (!cover) { entry.note = 'No row covers that date.'; }
      else if (cover.department === ev.value) { entry.note = `The row covering ${ev.effective} already says ${ev.value}: nothing to do.`; }
      else if (cover.valid_from === ev.effective) {
        entry.sql.push(`UPDATE dim_employee SET department = ${sqlText(ev.value)} WHERE sk = ${cover.sk};`);
        cover.department = ev.value; entry.touched.push(cover); entry.note = 'Same start date: the row was wrong, so it is corrected in place.';
      } else {
        const n = { sk: ++sk, emp_id: ev.emp_id, name: cover.name, department: ev.value, valid_from: ev.effective, valid_to: cover.valid_to, is_current: cover.is_current };
        const oldTo = cover.valid_to;
        cover.valid_to = addDays(ev.effective, -1); cover.is_current = false;
        rows.splice(rows.indexOf(cover) + 1, 0, n);
        entry.sql.push(`UPDATE dim_employee SET valid_to = ${dt(cover.valid_to)}, is_current = false WHERE sk = ${cover.sk};`);
        entry.sql.push(`INSERT INTO dim_employee (emp_id, name, department, valid_from, valid_to, is_current)\nVALUES (${ev.emp_id}, ${sqlText(n.name)}, ${sqlText(ev.value)}, ${dt(ev.effective)}, ${dt(oldTo)}, ${n.is_current});`);
        entry.touched.push(cover, n);
        entry.note = oldTo === OPEN_END ? 'The covering row is the open one: close it the day before and open the new row.' : `The covering row ended on ${oldTo}: the new row is SPLIT out of it and keeps that end date, so the later row is untouched.`;
      }
    }
    log.push(entry);
  });
  rows.sort((a, b) => a.emp_id - b.emp_id || (a.valid_from || '') .localeCompare(b.valid_from || '') || (a.sk || 0) - (b.sk || 0));
  return { rows, log };
}

// Which department does a fact belong to, under this dimension?
export function attribute(type, rows, fact) {
  if (type !== 2) return rows.find((r) => r.emp_id === fact.emp_id).department;
  const hit = rows.filter((r) => r.emp_id === fact.emp_id && r.valid_from <= fact.month && fact.month <= r.valid_to);
  if (hit.length === 0) return '(no row matches)';
  if (hit.length > 1) return `(${hit.length} rows match: counted ${hit.length} times)`;
  return hit[0].department;
}

// A department x month grid of gross pay, and how it compares with the real timeline.
export function report(type, scn, rows) {
  const facts = factsFor(scn.months);
  const cell = {}; const truth = {};
  const add = (g, d, m, v) => { g[d] ||= {}; g[d][m] = (g[d][m] || 0) + v; };
  facts.forEach((f) => {
    if (type === 2) {
      const hit = rows.filter((r) => r.emp_id === f.emp_id && r.valid_from <= f.month && f.month <= r.valid_to);
      if (!hit.length) add(cell, '(no row matches)', f.month, f.amount);
      hit.forEach((r) => add(cell, r.department, f.month, f.amount)); // an overlap counts the pay once PER matching row: that is the bug it causes
    } else add(cell, attribute(type, rows, f), f.month, f.amount);
    add(truth, truthDept(scn, f.emp_id, f.month), f.month, f.amount);
  });
  const depts = [...new Set([...Object.keys(cell), ...Object.keys(truth)])].sort();
  const r2 = (x) => Math.round((x || 0) * 100) / 100;
  let wrong = 0;
  const grid = depts.map((d) => ({
    dept: d,
    cells: scn.months.map((m) => { const got = r2(cell[d]?.[m]); const want = r2(truth[d]?.[m]); const bad = got !== want; if (bad) wrong += 1; return { month: m, got, want, bad }; }),
  }));
  return { grid, wrong, total: depts.length * scn.months.length };
}

// Structural checks of a Type 2 dimension: the rules a good loader must keep true.
export function checks(rows) {
  const problems = [];
  PEOPLE.forEach((p) => {
    const rs = rows.filter((r) => r.emp_id === p.emp_id).sort((a, b) => (a.valid_from < b.valid_from ? -1 : 1));
    rs.forEach((r) => { if (r.valid_to < r.valid_from) problems.push(`${p.name}: the row ${r.department} runs from ${r.valid_from} to ${r.valid_to}, which ends before it starts.`); });
    for (let i = 1; i < rs.length; i++) {
      const prev = rs[i - 1]; const cur = rs[i];
      if (prev.valid_to >= cur.valid_from) problems.push(`${p.name}: ${prev.department} (to ${prev.valid_to}) overlaps ${cur.department} (from ${cur.valid_from}).`);
      else if (addDays(prev.valid_to, 1) !== cur.valid_from) problems.push(`${p.name}: a gap between ${prev.valid_to} and ${cur.valid_from}.`);
    }
    const open = rs.filter((r) => r.valid_to === OPEN_END);
    const cur = rs.filter((r) => r.is_current);
    if (open.length !== 1) problems.push(`${p.name}: ${open.length} rows are open-ended (there must be exactly 1).`);
    if (cur.length !== 1) problems.push(`${p.name}: ${cur.length} rows are flagged current (there must be exactly 1).`);
    else if (open.length === 1 && cur[0] !== open[0]) problems.push(`${p.name}: the row flagged current is not the open-ended one.`);
  });
  return problems;
}

export const TYPE_INFO = {
  1: { name: 'Type 1: overwrite', idea: 'Replace the old value. Simple, but yesterday\'s reports can no longer be rebuilt.' },
  2: { name: 'Type 2: add a row', idea: 'Close the old row and add a new one with a validity range. Full history, one more join condition.' },
  3: { name: 'Type 3: add a column', idea: 'Keep the current and the previous value in two columns. One step of history, no more.' },
};

export const money = (v) => (v ? v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-');
