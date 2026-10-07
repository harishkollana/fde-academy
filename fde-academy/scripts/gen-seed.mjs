// Generates a deterministic synthetic finance dataset for the in-browser PostgreSQL + Python playgrounds.
// Run: node scripts/gen-seed.mjs  -> writes src/data/seed.sql and src/data/csv.js
import { writeFileSync, mkdirSync } from 'node:fs';

let s = 20260904;
const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const r2 = (x) => Math.round(x * 100) / 100;
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const pad = (n, l = 2) => String(n).padStart(l, '0');

const out = [];
const csv = {};
const table = (name, ddl, cols, rows) => {
  out.push(ddl.trim());
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    out.push(`INSERT INTO ${name} (${cols.join(', ')}) VALUES\n` + chunk.map((r) => '(' + r.map(q).join(', ') + ')').join(',\n') + ';');
  }
  csv[name] = [cols.join(','), ...rows.map((r) => r.map((v) => (v === null ? '' : String(v).includes(',') ? `"${v}"` : v)).join(','))].join('\n');
};

// ---------- masters ----------
const entities = [
  [1, 'IN01', 'Kollana Tech India Pvt Ltd', 'India', 'INR'],
  [2, 'SG01', 'Kollana Tech Singapore Pte', 'Singapore', 'SGD'],
  [3, 'US01', 'Kollana Tech USA Inc', 'USA', 'USD'],
];
table('dim_entity', `CREATE TABLE dim_entity (entity_id INT PRIMARY KEY, entity_code TEXT UNIQUE NOT NULL, entity_name TEXT NOT NULL, country TEXT, currency CHAR(3) NOT NULL);`,
  ['entity_id', 'entity_code', 'entity_name', 'country', 'currency'], entities);

const bus = [[1, 'SALES', 'Sales'], [2, 'OPS', 'Operations'], [3, 'TECH', 'Technology'], [4, 'CORP', 'Corporate']];
table('dim_bu', `CREATE TABLE dim_bu (bu_id INT PRIMARY KEY, bu_code TEXT UNIQUE NOT NULL, bu_name TEXT NOT NULL);`, ['bu_id', 'bu_code', 'bu_name'], bus);

const accounts = [
  [1000, '1000', 'Bank', 'Asset', null],
  [2000, '2000', 'Payables', 'Liability', null],
  [4000, '4000', 'Revenue', 'Revenue', null],
  [4100, '4100', 'Product Sales', 'Revenue', 4000],
  [4200, '4200', 'Service Revenue', 'Revenue', 4000],
  [5000, '5000', 'Cost of Goods Sold', 'COGS', null],
  [5100, '5100', 'Materials', 'COGS', 5000],
  [5200, '5200', 'Freight', 'COGS', 5000],
  [6000, '6000', 'Operating Expenses', 'Opex', null],
  [6100, '6100', 'People Costs', 'Opex', 6000],
  [6110, '6110', 'Salaries', 'Opex', 6100],
  [6120, '6120', 'Bonus', 'Opex', 6100],
  [6200, '6200', 'Rent', 'Opex', 6000],
  [6300, '6300', 'Travel', 'Opex', 6000],
  [6400, '6400', 'Software Subscriptions', 'Opex', 6000],
];
table('dim_account', `CREATE TABLE dim_account (account_id INT PRIMARY KEY, account_code TEXT UNIQUE NOT NULL, account_name TEXT NOT NULL, account_type TEXT NOT NULL, parent_account_id INT REFERENCES dim_account(account_id));`,
  ['account_id', 'account_code', 'account_name', 'account_type', 'parent_account_id'], accounts);

// FY 2025-26 : Apr 2025 .. Mar 2026
const months = [];
for (let i = 0; i < 12; i++) { const m = ((3 + i) % 12) + 1; const y = i < 9 ? 2025 : 2026; months.push([y, m]); }
const fx = [];
months.forEach(([y, m], i) => {
  fx.push(['INR', `${y}-${pad(m)}-01`, 1]);
  fx.push(['USD', `${y}-${pad(m)}-01`, r2(83.1 + i * 0.12 + rnd() * 0.4)]);
  if (!(y === 2026 && m === 2)) fx.push(['SGD', `${y}-${pad(m)}-01`, r2(61.5 + i * 0.08 + rnd() * 0.5)]); // deliberately missing SGD Feb-2026
});
table('fx_rates', `CREATE TABLE fx_rates (currency CHAR(3) NOT NULL, rate_month DATE NOT NULL, rate_to_inr NUMERIC(10,4) NOT NULL, PRIMARY KEY (currency, rate_month));`,
  ['currency', 'rate_month', 'rate_to_inr'], fx);

// ---------- GL ----------
const plAccounts = { 4100: [80000, 160000], 4200: [30000, 70000], 5100: [25000, 60000], 5200: [3000, 9000], 6110: [40000, 60000], 6120: [0, 15000], 6200: [8000, 12000], 6300: [1000, 9000], 6400: [2000, 6000] };
const buFor = { 4100: [1], 4200: [1, 3], 5100: [2], 5200: [2], 6110: [1, 2, 3, 4], 6120: [1, 3], 6200: [4], 6300: [1, 2, 3], 6400: [3, 4] };
const scale = { 1: 1, 2: 0.25, 3: 0.4 }; // local-currency scale relative to INR thousands style
const gl = [];
let gid = 1, jid = 1;
months.forEach(([y, m], mi) => {
  entities.forEach(([eid, , , , cur]) => {
    Object.entries(plAccounts).forEach(([acc, [lo, hi]]) => {
      acc = Number(acc);
      for (const bu of buFor[acc]) {
        const seasonal = 1 + 0.15 * Math.sin((mi / 12) * Math.PI * 2);
        let amt = r2((lo + rnd() * (hi - lo)) * scale[eid] * seasonal * (eid === 1 ? 1 : 0.1));
        if (amt <= 0) continue;
        const d = `${y}-${pad(m)}-${pad(int(1, 28))}`;
        const isRev = acc < 5000;
        const j = `JV${y}${pad(m)}-${pad(jid++, 4)}`;
        // P&L line
        gl.push([gid++, j, eid, bu, acc, d, cur, isRev ? 0 : amt, isRev ? amt : 0, pick(['SAP', 'SAP', 'Manual', 'Interface'])]);
        // balancing line
        gl.push([gid++, j, eid, bu, isRev ? 1000 : 2000, d, cur, isRev ? amt : 0, isRev ? 0 : amt, 'SAP']);
      }
    });
  });
});
// inject issues: 3 duplicate lines, 1 unbalanced journal
for (const k of [17, 233, 511]) { const r = [...gl[k]]; r[0] = gid++; gl.push(r); }
gl[101][7] = r2(gl[101][7] + 500); // unbalanced journal (debit inflated)
table('fact_gl', `CREATE TABLE fact_gl (gl_id INT PRIMARY KEY, journal_id TEXT NOT NULL, entity_id INT REFERENCES dim_entity(entity_id), bu_id INT REFERENCES dim_bu(bu_id), account_id INT REFERENCES dim_account(account_id), posting_date DATE NOT NULL, currency CHAR(3) NOT NULL, debit NUMERIC(14,2) DEFAULT 0, credit NUMERIC(14,2) DEFAULT 0, source_system TEXT);`,
  ['gl_id', 'journal_id', 'entity_id', 'bu_id', 'account_id', 'posting_date', 'currency', 'debit', 'credit', 'source_system'], gl);

// budget
const budget = [];
months.forEach(([y, m]) => {
  entities.forEach(([eid]) => {
    Object.entries(plAccounts).forEach(([acc, [lo, hi]]) => {
      acc = Number(acc);
      for (const bu of buFor[acc]) {
        budget.push([eid, bu, acc, `${y}-${pad(m)}-01`, r2(((lo + hi) / 2) * scale[eid] * (eid === 1 ? 1 : 0.1) * (0.95 + rnd() * 0.1))]);
      }
    });
  });
});
table('fact_budget', `CREATE TABLE fact_budget (entity_id INT, bu_id INT, account_id INT, budget_month DATE, budget_amount NUMERIC(14,2));`,
  ['entity_id', 'bu_id', 'account_id', 'budget_month', 'budget_amount'], budget);

// ---------- employees & payroll ----------
const first = ['Aarav', 'Diya', 'Ishaan', 'Meera', 'Rohan', 'Ananya', 'Kabir', 'Sneha', 'Vikram', 'Priya', 'Arjun', 'Kavya', 'Rahul', 'Nisha', 'Siddharth', 'Pooja', 'Karthik', 'Lakshmi', 'Manoj', 'Divya'];
const last = ['Reddy', 'Sharma', 'Iyer', 'Rao', 'Nair', 'Gupta', 'Menon', 'Patel', 'Kumar', 'Varma'];
const banks = ['HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK'];
const depts = ['Finance', 'Sales', 'Engineering', 'Operations', 'HR'];
const cities = ['Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Mumbai'];
const emps = [];
for (let i = 1; i <= 20; i++) {
  const mgr = i === 1 ? null : i <= 5 ? 1 : int(2, 5);
  let ifsc = `${pick(banks)}0${pad(int(0, 99999), 6)}`;
  if (i === 7) ifsc = 'HDFC123456'; // invalid
  if (i === 14) ifsc = 'sbin0001234'; // lowercase, invalid
  let acct = String(int(10000000000, 99999999999));
  if (i === 12) acct = emps[3][7]; // duplicate bank account with emp 4
  let pan = `${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}P${String.fromCharCode(65 + int(0, 25))}${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}`;
  if (i === 9 || i === 18) pan = null;
  emps.push([i, `${first[i - 1]} ${pick(last)}`, mgr, i === 1 ? 'Finance' : pick(depts), pick(cities), `20${pad(int(15, 25))}-${pad(int(1, 12))}-${pad(int(1, 28))}`, i === 1 ? 4200000 : int(6, 30) * 100000, acct, ifsc, pan]);
}
table('employees', `CREATE TABLE employees (emp_id INT PRIMARY KEY, emp_name TEXT NOT NULL, manager_id INT, department TEXT, city TEXT, hire_date DATE, annual_ctc NUMERIC(12,2), bank_account TEXT, ifsc TEXT, pan TEXT);`,
  ['emp_id', 'emp_name', 'manager_id', 'department', 'city', 'hire_date', 'annual_ctc', 'bank_account', 'ifsc', 'pan'], emps);

const payroll = [];
for (const run of ['2026-08-01', '2026-09-01']) {
  emps.forEach((e) => {
    let gross = r2(e[6] / 12);
    if (run === '2026-09-01' && e[0] === 6) gross = r2(gross * 2.4); // salary jump
    payroll.push([run, e[0], gross, r2(gross * 0.78)]);
  });
}
table('payroll', `CREATE TABLE payroll (run_month DATE, emp_id INT, gross_pay NUMERIC(12,2), net_pay NUMERIC(12,2));`, ['run_month', 'emp_id', 'gross_pay', 'net_pay'], payroll);

// ---------- GST purchase reconciliation ----------
const suppliers = [['Sri Lakshmi Traders', '36AABCS1429B1Z5'], ['Deccan Packaging', '36AADCD5521K1Z2'], ['Vizag Steel Supplies', '37AAFCV7781M1ZQ'], ['Krishna Logistics', '36AAGFK3310P1Z8'], ['Nandi Electricals', '29AAHCN9902L1ZX'], ['Godavari Chemicals', '37AABCG4471E1Z1']];
const pr = [], si = [];
for (let i = 1; i <= 30; i++) {
  const [name, gstin] = pick(suppliers);
  const inv = `INV/${pad(int(1, 9999), 4)}/25-26`;
  const d = `2026-0${int(7, 9)}-${pad(int(1, 28))}`;
  const tv = r2(int(5000, 250000));
  const gst = r2(tv * pick([0.05, 0.12, 0.18, 0.18]));
  pr.push([i, inv, gstin, name, d, tv, gst]);
  let s2 = [i, inv, gstin, d, tv, gst];
  if (i % 9 === 0) s2 = null; // missing in supplier data
  else if (i % 7 === 0) s2[5] = r2(gst + int(1, 3) * 100); // amount mismatch
  else if (i % 11 === 0) s2[1] = inv.replace('/', '-'); // typo
  else if (i % 13 === 0) s2[2] = gstin.slice(0, -1) + 'Z'; // wrong gstin
  else if (i % 5 === 0) s2[5] = r2(gst + 0.4); // rounding diff
  if (s2) si.push(s2);
}
si.push([31, 'INV/7777/25-26', '36AADCD5521K1Z2', '2026-08-14', 42000, 7560]); // missing in books
si.push([32, 'INV/8123/25-26', '37AAFCV7781M1ZQ', '2026-09-02', 18000, 2160]);
table('purchase_register', `CREATE TABLE purchase_register (pr_id INT PRIMARY KEY, invoice_no TEXT, supplier_gstin TEXT, supplier_name TEXT, invoice_date DATE, taxable_value NUMERIC(12,2), gst_amount NUMERIC(12,2));`,
  ['pr_id', 'invoice_no', 'supplier_gstin', 'supplier_name', 'invoice_date', 'taxable_value', 'gst_amount'], pr);
table('supplier_invoices', `CREATE TABLE supplier_invoices (si_id INT PRIMARY KEY, invoice_no TEXT, supplier_gstin TEXT, invoice_date DATE, taxable_value NUMERIC(12,2), gst_amount NUMERIC(12,2));`,
  ['si_id', 'invoice_no', 'supplier_gstin', 'invoice_date', 'taxable_value', 'gst_amount'], si.map((r, i) => [r[0], ...r.slice(1)]));

// ---------- sales ----------
const products = [
  [1, 'SKU-LAP-01', 'Laptop Pro 14', 'Hardware', 92000], [2, 'SKU-MON-02', '27in Monitor', 'Hardware', 21000], [3, 'SKU-KEY-03', 'Mech Keyboard', 'Accessories', 5400],
  [4, 'SKU-MOU-04', 'Wireless Mouse', 'Accessories', 1800], [5, 'SKU-LIC-05', 'Analytics License (yr)', 'Software', 36000], [6, 'SKU-SUP-06', 'Support Plan (yr)', 'Services', 15000],
  [7, 'SKU-DOC-07', 'Docking Station', 'Accessories', 11500], [8, 'SKU-HDD-08', 'External SSD 1TB', 'Hardware', 8900],
];
table('products', `CREATE TABLE products (product_id INT PRIMARY KEY, sku TEXT UNIQUE, product_name TEXT, category TEXT, unit_price NUMERIC(10,2));`, ['product_id', 'sku', 'product_name', 'category', 'unit_price'], products);
const custNames = ['Apex Retail', 'Blue Lotus Hotels', 'Coastal Pharma', 'Delta Schools', 'Evergreen Foods', 'Falcon Logistics', 'Gemini Clinics', 'Horizon Realty', 'Indus Textiles', 'Jade Finance', 'Kite Media', 'Lotus Motors'];
const customers = custNames.map((n, i) => [i + 1, n, pick(cities), pick(['Enterprise', 'SMB', 'SMB', 'Mid-market']), `2024-${pad(int(1, 12))}-${pad(int(1, 28))}`]);
table('customers', `CREATE TABLE customers (customer_id INT PRIMARY KEY, customer_name TEXT, city TEXT, segment TEXT, signup_date DATE);`, ['customer_id', 'customer_name', 'city', 'segment', 'signup_date'], customers);
const orders = [];
for (let i = 1; i <= 220; i++) {
  let c = int(1, 10); // customers 11, 12 never order
  if (i === 77) c = 99; // orphan order
  const p = products[int(0, products.length - 1)];
  const qty = int(1, p[4] > 30000 ? 4 : 12);
  const disc = pick([0, 0, 0, 0.05, 0.1]);
  const [y, m] = months[int(0, 11)];
  orders.push([i, `${y}-${pad(m)}-${pad(int(1, 28))}`, c, p[0], qty, pick(['Online', 'Partner', 'Direct']), r2(qty * p[4] * (1 - disc)), i % 23 === 0 ? null : pick(['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Returned'])]);
}
table('orders', `CREATE TABLE orders (order_id INT PRIMARY KEY, order_date DATE, customer_id INT, product_id INT, qty INT, channel TEXT, amount NUMERIC(12,2), status TEXT);`, ['order_id', 'order_date', 'customer_id', 'product_id', 'qty', 'channel', 'amount', 'status'], orders);

mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/seed.sql', out.join('\n\n') + '\n');
writeFileSync('src/data/csv.js', '// Auto-generated by scripts/gen-seed.mjs\nexport const CSV = ' + JSON.stringify(csv) + ';\n');
console.log('rows:', { gl: gl.length, budget: budget.length, orders: orders.length, emps: emps.length });
