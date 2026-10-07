import SqlPlayground from '../components/SqlPlayground';
import PyPlayground from '../components/PyPlayground';
import { useDocTitle } from './shared';

// Copied from docs/CONTENT_SPEC.md section 6 (the synthetic "Kollana Tech" dataset).
const TABLES = [
  ['dim_entity', 3, 'The 3 group companies: IN01, SG01, US01, with country and currency.', ''],
  ['dim_bu', 4, 'Business units: SALES, OPS, TECH, CORP.', ''],
  ['dim_account', 15, 'Chart of accounts with a 3-level parent hierarchy (6000 Operating Expenses → 6100 People Costs → 6110 Salaries).', 'Good for self joins and recursive CTEs.'],
  ['fx_rates', 35, 'Monthly rate to INR for each currency.', 'The SGD rate for 2026-02-01 is missing on purpose.'],
  ['fact_gl', 1227, 'General ledger lines. Each journal has a P&L line and a balancing line to Bank or Payables. Amounts are in local currency.', '3 duplicated lines, and 4 journals where debit ≠ credit.'],
  ['fact_budget', 612, 'Monthly budget per entity, BU and P&L account, in local currency.', ''],
  ['employees', 20, 'Employees with manager, city, CTC, bank account, IFSC and PAN.', 'IFSC invalid for emp 7 and 14. Emp 12 shares emp 4’s bank account. PAN is NULL for emp 9 and 18.'],
  ['payroll', 40, 'Gross and net pay for Aug and Sep 2026.', 'Employee 6’s gross jumps ×2.4 in September.'],
  ['purchase_register', 30, 'Purchase invoices as recorded in our books.', ''],
  ['supplier_invoices', 29, 'Supplier-side invoices, like GSTR-2B.', 'Missing invoices, GST mismatches, invoice-number typos, wrong GSTIN last character, ₹0.40 rounding gaps, and 2 invoices only on the supplier side.'],
  ['products', 8, 'Product catalogue: Hardware, Accessories, Software, Services.', ''],
  ['customers', 12, 'Customers by segment and city.', 'Customers 11 and 12 never ordered.'],
  ['orders', 220, 'Sales orders for FY 2025-26 with channel, amount and status.', 'Order 77 points to customer 99, who does not exist. Every 23rd order has a NULL status.'],
];

export default function Sandbox() {
  useDocTitle('Sandbox');
  return (
    <div className="page">
      <header className="page-head">
        <h1>🧪 Sandbox</h1>
        <p className="lead">Free play. Run any SQL or Python against the practice data. Nothing here can break the lessons: every playground works on its own copy of the data.</p>
      </header>

      <section aria-label="SQL playground">
        <h2 className="h2">SQL (PostgreSQL)</h2>
        <SqlPlayground id="sandbox-sql" title="Sandbox" starter={'SELECT * FROM fact_gl LIMIT 20;'} />
      </section>

      <section aria-label="Python playground">
        <h2 className="h2">Python (pandas)</h2>
        <PyPlayground id="sandbox-py" title="Sandbox"
          note="Every table below is also a CSV file in the working folder, for example `fact_gl.csv`. The first run downloads Python (about 10 MB)."
          starter={'import pandas as pd\n\ngl = pd.read_csv("fact_gl.csv")\nprint(gl.shape)\nprint(gl.head())\n'} />
      </section>

      <section aria-label="Data catalogue">
        <h2 className="h2">The practice data</h2>
        <p className="muted">A made-up group called “Kollana Tech”. Fiscal year FY 2025-26 runs from 1 Apr 2025 to 31 Mar 2026. All data is fake. The quirks are planted on purpose, so you can practise finding them.</p>
        <div className="tablewrap">
          <table className="mdtable catalogue">
            <thead><tr><th>Table</th><th>Rows</th><th>What it holds</th><th>Planted quirks</th></tr></thead>
            <tbody>
              {TABLES.map(([t, n, d, q]) => (
                <tr key={t}><td><code className="ic">{t}</code></td><td className="num">{n.toLocaleString('en-IN')}</td><td>{d}</td><td>{q || <span className="muted">none</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">The Python folder also has <code className="ic">input/sales_2026-08.csv</code>, <code className="ic">input/sales_2026-09.csv</code> and <code className="ic">input/notes.txt</code> for file-handling practice.</p>
      </section>
    </div>
  );
}
