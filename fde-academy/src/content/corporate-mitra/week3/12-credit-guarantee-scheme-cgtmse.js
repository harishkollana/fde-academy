import { sk, flow2, bar } from '../_kit.js';

export default {
  title: `The Credit Guarantee Fund Scheme (CGTMSE): collateral-free loans for micro and small units`,
  goal: `You can explain how CGTMSE lets a bank lend without collateral, say which borrowers, lenders and loans qualify, read the cover table, follow the fee, claim and recovery rules in plain terms, and explain the hybrid model.`,
  covers: [`What the scheme is`, `Who and what is covered`, `Cover table and ceilings`, `Annual guarantee fee`, `Claims, recoveries and the hybrid model`],
  terms: [
    [`CGTMSE`, `Credit Guarantee Fund Trust for Micro and Small Enterprises: the trust set up by the Government of India and SIDBI to guarantee loans to micro and small units.`],
    [`Guarantee cover`, `The percentage of the loss in default that the Trust promises to pay the lender.`],
    [`Primary security`, `The asset created or financed by the loan itself (a machine, stock), pledged to the bank.`],
    [`Collateral security`, `An extra asset (a house, land) pledged on top of the primary security. CGTMSE removes the need for it.`],
    [`Third-party guarantee`, `A guarantee from someone other than the owner or the business, such as a friend or a relative.`],
    [`Member lending institution (MLI)`, `A bank or financial institution that has signed an agreement with the Trust and can seek guarantees.`],
    [`NPA`, `Non-performing asset: a loan on which an instalment has been overdue for 90 days or more.`],
    [`Amount in default`, `The unpaid principal plus interest outstanding on the relevant date, up to the guaranteed amount.`],
    [`Annual guarantee fee (AGF)`, `The yearly fee the lender pays the Trust for the guarantee.`],
    [`Lock-in period`, `The minimum time after a loan is disbursed before a claim can be made.`],
    [`Subrogation`, `The Trust steps into the lender's place to share in recoveries after it pays a claim.`],
    [`Hybrid model`, `A loan where part is covered by collateral and the rest by the CGTMSE guarantee.`],
  ],
  blocks: [
    `## The idea
Many young people have a **good business idea but no collateral and no one to give a third-party guarantee**. Banks normally ask for both: security, and someone else who will pay if the borrower cannot. The **Credit Guarantee Fund Scheme** removes both requirements. The scheme's new logo is a **colourful flying bird**, meant to "give wings to the entrepreneurial zeal of millions of youth" and to turn **job seekers into job providers**.

- It is for **micro and small enterprises, not medium ones**. (Older papers call it a scheme for "small industries".)
- It was set up by the **Government of India and SIDBI** (the government funds 80% and SIDBI 20%). It started on **1 August 2000** and covers credit facilities given from **1 June 2000**. The rules are revised from time to time, so check the current version.
- It is **not a direct loan or subsidy**. It is a **guarantee to the lender**: an indirect support that lets the bank lend collateral-free. The Trust is the **guarantor**.
- **Banks apply**, through the Development Commissioner (MSME) or an MSME Development Institute. **The entrepreneur just approaches the bank.**

## What is covered

**Borrowers:** **new or existing** micro and small enterprises, in **any activity**: manufacturing, services, **and also trading, retail, wholesale and education or training**.

**Credit facilities:** **term loans** and **working capital**, fund-based (cash credit, overdraft) or non-fund-based (a bank guarantee or letter of credit).

**Lenders** (the **member lending institutions**, which must sign an **agreement** with the Trust): commercial banks (public, private, foreign), regional rural banks, small finance banks, urban, state and district central cooperative banks, state financial institutions and other institutions the Trust may specify.

**The security needed.** The borrower still gives the **primary security**, the asset the loan creates or buys. But **no collateral security and no third-party guarantee** may be asked for. (A third-party guarantee means a guarantee by anybody other than the owner side: not the proprietor, partners, promoters or directors.)

**The ceilings per borrower** depend on the lender:
| Lender | Maximum cover per borrower |
|---|---|
| Banks (public, private, foreign) and selected financial institutions | **₹10 crore** |
| Small finance banks, RRBs, state financial institutions, urban, state and district cooperative banks | **₹2 crore** |
| Microfinance institutions | **₹50 lakh** |

This explains the two figures you may meet. An older slide says the scheme covers loans **up to ₹100 lakh**; the ceiling has been raised over time. **₹10 crore** and **₹2 crore** are both right: they are for different kinds of lender. Even if several lenders finance one borrower, the total stays within the ceiling.

## How much of the loss is covered
The cover is a **percentage of the amount in default**, up to the ceiling. The lecture gives the table that applies to **guarantees approved on or after 1 April 2025**. It was spoken quickly, so confirm it on the Trust's site.`,

    sk(330, 'Guarantee cover for guarantees approved from 1 April 2025 (as in the course)', [
      { t: 'table', x: 70, y: 44, cols: [`Borrower`, `Cover of the loss`], colW: [390, 240], rowH: 34, title: `What share of the default the Trust pays`,
        rows: [
          [`Women entrepreneurs, Agniveers`, `90%`],
          [`Scheduled Caste, Scheduled Tribe`, `85%`],
          [`Micro enterprise, loan up to ₹5 lakh`, `85%`],
          [`North-East, Ladakh (up to ₹50 lakh)`, `80%`],
          [`Everyone else, any loan size`, `75%`],
          [`Credit-deficient district (ICDD)`, `+5 points`],
        ] },
      { t: 'note', x: 70, y: 288, w: 630, h: 30, text: `Loans above ₹50 lakh need an internal investment-grade rating by the lender.`, fill: `yellow`, size: 13 },
    ]),

    `Notes on the table: **the borrower's category sets the cover** (women, SC or ST, North-East and so on). Where a category is not mentioned, the general **75%** applies. In **identified credit-deficient districts**, the cover rises by **5 percentage points** (75% becomes 80%, 80% becomes 85%), from 15 December 2023. All proposals above ₹50 lakh must be rated **investment grade** by the lender under its own guidelines. The older table in the lecture's first part gave 85% up to ₹5 lakh for micro units, 75% to ₹50 lakh and 50% above that: that was the earlier structure.

## What is not covered
- Loans **already guaranteed** by the government, general insurance, an indemnity, the DICGC or **NCGTC** (the Mudra guarantee).
- **Illegal or non-compliant** facilities.
- A borrower with a **past default** where a claim was paid and dues remain unrecovered.
- Loans **fully backed by collateral**, since there is nothing left to guarantee.
- A loan with **no primary security**, because the guarantee is invoked after the primary security is realised.
- An account that was an **NPA or in SMA-2** (60 to 90 days overdue), or **restructured**, within **one year** before the application.

## The guarantee fee
The **lender** pays the Trust an **annual guarantee fee (AGF)**. The way it works:
- **First year:** charged on the **guaranteed amount**, payable **within 30 days** of the credit being disbursed. **The guarantee starts the day the fee is paid.**
- **Later years:** charged on the **outstanding** amount (a term loan as on 31 December, or the working capital outstanding). Notices come in the second week of February, payment by **30 March**. **If the fee is not paid, the guarantee lapses.** Late payment attracts interest at **bank rate plus 4%**. The fee includes **GST** and is not refundable, except for excess or duplicate payment.
- **The rate** is set by the Trust in slabs of loan size (up to ₹10 lakh, ₹10 to 50 lakh, ₹50 lakh to ₹1 crore, ₹1 to 2 crore, and so on up to ₹10 crore; the standard rates were revised from 1 April 2025). Older slides show about 1% as the normal rate, lower for small loans and special categories: check the current table.
- **Adjustments to the rate:** a **10% discount** for a lender with a healthy portfolio, and a **risk premium of 15% to 70%** for a high-risk or new lender (rated by an outside agency). **Concessions** of **10%** each for women, SC, ST, persons with disabilities, Agniveers, transgender entrepreneurs, units in the North-East, Sikkim, J&K and Ladakh (for credit up to ₹50 lakh), **aspirational districts**, credit-deficient districts and **ZED-certified** units. **The combined concession cannot go beyond 30%.**

Ask the lender whether any of the fee is passed on to you.

## How long the guarantee lasts
- **Term loan:** for the agreed tenure **plus four extra months**, to cover a default on the last instalment.
- **Working capital:** a **five-year block**, **renewable**, with no maximum.
- The Trust may specify a different period in particular cases. The guarantee **ends** if the liability passes to an ineligible borrower or the borrower stops being an MSE. It **does not end** if a partner dies or retires and the surviving partners carry on, with the account not an NPA.

## What happens when the loan goes bad`,

    sk(282, 'From default to payout', flow2([
      { label: `Loan paid out,\nfee paid`, sub: `guarantee starts`, fill: `green` },
      { label: `Instalment 90\ndays overdue`, sub: `the account is an NPA`, fill: `red` },
      { label: `Bank tries to\nrecover first`, sub: `lock-in must pass`, fill: `orange` },
      { label: `Bank lodges\nthe claim`, sub: `within 3 years`, fill: `yellow` },
      { label: `Trust pays\n75% in 30 days`, sub: `of the guaranteed sum`, fill: `blue` },
      { label: `Balance 25%`, sub: `after 3 years or OTS`, fill: `blue` },
    ], { y: 14, h: 90, rowGap: 52, gap: 60, max: 16, label: `then` })),

    `- **NPA.** An account is an NPA when an instalment is **overdue for 90 days or more**. The lender marks it on the portal every quarter.
- **Amount in default** is **principal plus unpaid interest**, as at the NPA date or the date of lodging, whichever is lower, **up to the guaranteed amount**. (Example from the lecture: a ₹10 lakh loan with ₹2 lakh of interest due is a default of ₹12 lakh.)
- **When a claim can be made.** The guarantee must have been **active on the NPA date**. A **lock-in** must have passed: **18 months** after the last disbursement or guarantee start, or **9 months** for loans up to ₹10 lakh with tenure up to 36 months. The **claim must be lodged within three years** of the NPA date or the end of the lock-in, whichever is later. The lender must **start recovery proceedings first**.
- **No claim** if there is **fraud, wilful default or non-cooperation**, or if the account became an NPA within 90 days of the **first** default (a "quick" NPA).
- **Payout.** The Trust pays **75% of the guaranteed amount within 30 days** of an eligible claim (interest at bank rate if later than 30 days) and the **remaining 25%** after **three years** from the first settlement, or after a full **one-time settlement**, whichever is earlier. If the lender takes a **single, reduced settlement** (say 60% in a one-time settlement), the Trust is discharged once it is paid.
- **Recoveries** are shared **pro rata**, with **legal expenses taken off first**, and sent by NEFT or RTGS. This is **subrogation**: the Trust steps into the lender's rights. The lender must hold its lien on the borrower's assets, appropriate post-NPA payments against the guaranteed debt, give details of recoveries and not use the guaranteed account's security to cover other loans.
- **Audit.** The lender sends a **statutory audit certificate** by **30 September** of the next year.

## The hybrid or partial-collateral model
A lender may take **collateral for part** of a big loan and ask the Trust to guarantee the **unsecured part** (up to ₹10 crore). The Trust then has a **notional second charge** on the collateral after the lender. The **fee** is charged only on the **unsecured portion**.`,

    sk(206, 'A ₹12 crore loan: ₹2 crore on collateral, ₹10 crore under the guarantee', [
      ...bar([
        { v: 2, top: `Collateral ₹2 cr`, label: `the lender's own security`, fill: `blue`, size: 14 },
        { v: 10, top: `Guaranteed part: ₹10 crore`, label: `the Trust covers the cover % of a default here`, fill: `green` },
      ], { x: 20, y: 24, w: 720, h: 52 }),
      { t: 'note', x: 60, y: 130, w: 640, h: 56, text: `Example from the lecture: loan ₹2 crore, collateral ₹1 crore, outstanding ₹1.8 crore.\nThe fee is charged only on the unsecured ₹0.8 crore.`, fill: `yellow`, size: 14 },
    ]),

    `## Worked example: the namkeen loan, and what happens if it fails
Ravi's partnership firm gets an **₹8 lakh collateral-free** loan for the namkeen line, and the bank pays the fee. His category is "everyone else", so the cover is **75%**.

Later the loan turns bad. The **amount in default** is ₹6 lakh of principal plus ₹0.5 lakh of interest = **₹6.5 lakh**.
- **Guaranteed amount:** 75% of ₹6.5 lakh = **₹4.875 lakh**. The bank bears the other ₹1.625 lakh.
- **First payout (75%):** **₹3.66 lakh** within 30 days of an eligible claim.
- **Balance (25%):** **₹1.22 lakh** after three years, or sooner after a one-time settlement.

Had the borrower been a **woman** (cover **90%**), the guaranteed amount would have been 90% of ₹6.5 lakh = **₹5.85 lakh**. The borrower still **owes the money**. The Trust recovers from the borrower and shares recoveries with the bank.`,

    { analogy: `CGTMSE is **credit insurance sold to the lender**, with premiums and claims much like a managed service. The **annual guarantee fee** is the **premium**, billed on the exposure. The **lock-in** is a **minimum term** before you may claim. The **90-day NPA** is the **trigger event**. **Subrogation** means that after the insurer pays, it **inherits the claim** against the borrower. And the **discount and risk premium** on the fee are **experience rating**: a clean portfolio pays less, a risky one pays more.` },

    { warn: `Easy mistakes:
- **Believing the guarantee is a loan or a subsidy for the borrower.** It is for the lender. The borrower still repays.
- **Assuming collateral-free means security-free.** Primary security is still needed.
- **Quoting only one ceiling.** ₹10 crore for banks, ₹2 crore for smaller lenders, ₹50 lakh for MFIs.
- **Applying to the Trust directly.** The borrower goes to a bank; the bank goes to the Trust.
- **Applying for a medium enterprise.** The scheme is for micro and small units only.
- **Forgetting the fee deadlines (lender side).** A missed fee lapses the guarantee, so a failed loan would not be covered.
- **Counting on the cover table without checking.** The percentages and slabs change with each revision.` },

    { real: `Before you recommend a loan to a first-time entrepreneur, ask the bank three questions: **"Is this loan covered by CGTMSE? Is your branch a member lending institution? Will you need collateral or a third-party guarantee?"** If the answer is yes, yes and no, the loan can move without the family's property being pledged. Carry the cover table and ceilings on a card, and note the date you last checked them.` },

    { remember: `- **CGTMSE** (Government of India and SIDBI, from **1 August 2000**) guarantees loans by **banks and other lenders** to **new or existing micro and small** units (**not medium**), **without collateral or a third-party guarantee**. **Primary security is still required.**
- **Ceilings per borrower:** **₹10 crore** (banks), **₹2 crore** (SFBs, RRBs, cooperative and state financial institutions), **₹50 lakh** (MFIs).
- **Cover (from 1 April 2025, as in the course):** women and Agniveers **90%**, SC or ST **85%**, micro up to ₹5 lakh **85%**, North-East and Ladakh **80%**, others **75%**; **+5 points** in credit-deficient districts.
- **Fee:** paid by the **lender**, first year on the guaranteed amount within 30 days, then yearly on outstanding; **lapses if unpaid**; concessions up to 30%.
- **Term loan guarantee** = tenure + 4 months; **working capital** = 5-year renewable block.
- **Claim:** NPA at 90 days; lock-in 18 months (9 for small loans); lodge within 3 years; **75% in 30 days, 25% after 3 years or one-time settlement**; recoveries shared pro rata.
- **Hybrid model:** guarantee only the unsecured part; fee on that part.` },
  ],
  quiz: [
    { q: `Who applies to the Credit Guarantee Trust for the guarantee?`, o: [`The micro or small entrepreneur directly`, `The lending bank or institution`, `The GST officer`, `The Udyam portal automatically`], a: 1, why: `The scheme is a guarantee to the lender. The entrepreneur applies to a bank, and the bank (a member lending institution) deals with the Trust.` },
    { q: `Under CGTMSE, which of these is still required from the borrower?`, o: [`Primary security, the asset financed by the loan`, `A mortgage on the owner's house`, `A third-party guarantee`, `A GST registration`], a: 0, why: `Collateral security and third-party guarantees are not asked for, but the primary security (the asset financed) is still required.` },
    { q: `For guarantees approved on or after 1 April 2025, what cover does a woman entrepreneur get, as given in the course?`, o: [`50%`, `75%`, `85%`, `90%`], a: 3, why: `The course gives 90% for women entrepreneurs and Agniveers, 85% for SC and ST, and 75% for others.` },
    { q: `After how many days overdue is an account treated as an NPA?`, o: [`30 days`, `60 days`, `90 days or more`, `180 days`], a: 2, why: `A loan with an instalment overdue for 90 days or more is an NPA, the trigger for a possible claim.` },
    { q: `A claim is eligible. How much of the guaranteed amount does the Trust pay within 30 days?`, o: [`25%`, `50%`, `75%`, `100%`], a: 2, why: `The Trust pays 75% within 30 days and the remaining 25% after three years from the first settlement, or after a full one-time settlement, whichever is earlier.` },
    { q: `What happens if the lender does not pay the annual guarantee fee?`, o: [`Nothing`, `The loan is cancelled`, `The borrower is jailed`, `The guarantee lapses`], a: 3, why: `If the fee is not paid, the guarantee lapses. The Trust may consider revival on its own terms.` },
  ],
};
