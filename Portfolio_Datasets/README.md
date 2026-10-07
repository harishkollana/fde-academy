# Portfolio Datasets (synthetic)

Every value here is randomly generated: companies, people, GSTINs, PANs, bank accounts,
invoices and policies are fake. Safe to put on GitHub. Regenerate any time with
`python generate_datasets.py` (seed 42 gives the same output).

Each project folder has an `_answer_key/` with the problems that were deliberately
injected. Build your pipeline first, then compare its output with the answer key.
Don't upload `_answer_key/` with your project if you want the repo to look natural;
use it as your test expectations instead.

| Folder | Roadmap phase | What's inside |
|---|---|---|
| P0_Finance_Reporting_Engine | Phase 0 | 12 monthly GL files (FY 2025-26, 3 entities, INR/GBP/USD), COA with hierarchy, entity and BU masters, budget, FX rates; errors injected in Jun-25 to Feb-26 |
| P1_GST_Reconciliation | Phase 1 | Purchase register vs supplier-reported 2B for Sep-25 (~300 invoices), supplier master; mismatches, typos, wrong GSTINs, missing on each side |
| P2_Payroll_Bank_Validation | Phase 2 | 250-employee master, Aug-25 (clean) and Sep-25 payroll; bad IFSC, duplicate accounts, bank changes, name mismatches, salary jumps, new joiners |
| P3_Sales_Inventory_Warehouse | Phase 3 | Products, price list with changes, stores/channels, promotions, opening stock; 91 days of daily order and inventory-movement drops (Jul-Sep 2025) with duplicates, unknown SKUs, a schema change and a late file |
| P4_Invoice_AI_and_Policies | Phase 4 | 50 PDF invoices in 5 layouts (one scanned-looking), 10 policy documents for RAG; ground truth for extraction and 32 eval questions including out-of-scope and prompt-injection cases |
| P5_Data_Ops_Agent_Broken_Files | Phase 5 | 40 broken versions of a GL file (renamed/missing columns, title rows, merged cells, date and currency changes, CSV variants...), expected schema, and expected diagnosis with auto_fix vs escalate |

## Error injection summary

- **P0:** Jun unknown account 9999 · Jul unbalanced journals · Aug duplicate lines · Sep unknown BU · Oct DD/MM/YYYY dates · Nov GBP FX rate missing · Dec dates from previous month · Jan blank account codes · Feb negative amounts
- **P1:** amount mismatches (some only rounding), invoice-number format differences, one-character GSTIN errors, invoices missing in books, invoices missing in supplier data
- **P2:** missing PANs in master; invalid IFSC, duplicate accounts, account changed vs master, name mismatches, salary jumps over 50%, net-pay arithmetic errors, employees not in master
- **P3:** 2025-07-15 duplicates · 2025-08-10 unknown SKU · 2025-08-20 negative quantities · 2025-09-01 new column `customer_type` · 2025-09-18 file missing, its rows arrive inside 2025-09-19
- **P4:** invoices 08, 24 and 42 print a total that doesn't equal taxable value + tax
