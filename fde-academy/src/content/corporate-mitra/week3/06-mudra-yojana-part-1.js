import { sk, bar } from '../_kit.js';

export default {
  title: `Pradhan Mantri Mudra Yojana, part 1: the four loan bands and how the money flows`,
  goal: `You can explain what Mudra is and who it is for, name the four loan bands and the stage each fits, tell the Micro Credit route from the Refinance route, list what Mudra loans can be used for, and explain the Mudra Card.`,
  covers: [`What Mudra is`, `Shishu, Kishore, Tarun, Tarun Plus`, `Two routes for the money`, `What a Mudra loan can buy`, `The Mudra Card and the interest caps`],
  terms: [
    [`Non-corporate`, `Not a company: proprietorships, partnership firms and similar small businesses.`],
    [`Non-farm`, `Not directly growing crops. Allied activities such as beekeeping or poultry are included; farming itself is not.`],
    [`MUDRA`, `Micro Units Development and Refinance Agency: the body set up by the Government of India to develop and refinance lenders to micro units.`],
    [`Refinance`, `Money a lender borrows from MUDRA so that it can lend again to micro units. The lender is financed, then the unit.`],
    [`Micro credit`, `A very small loan (up to ₹1 lakh) given directly to individuals and groups, mostly through microfinance institutions.`],
    [`MFI`, `Microfinance institution: a lender specialising in very small loans.`],
    [`SHG and JLG`, `A self-help group is a small group that saves and lends together. A joint liability group is a group in which members stand guarantee for one another.`],
    [`Shishu`, `The first loan band: up to ₹50,000. The word means a young child.`],
    [`Kishore`, `The second band: ₹50,001 to ₹5 lakh. A teenager.`],
    [`Tarun`, `The third band: above ₹5 lakh up to ₹10 lakh. A young adult.`],
    [`Tarun Plus`, `The fourth band: above ₹10 lakh up to ₹20 lakh, for borrowers who have already taken and repaid a Tarun loan.`],
    [`Mudra Card`, `A debit card issued against the working-capital part of a Mudra loan, used at ATMs and shops.`],
  ],
  blocks: [
    `## What Mudra is
**PMMY** is the **Pradhan Mantri Mudra Yojana**, launched by the Prime Minister on **8 April 2015**. It gives **collateral-free loans** to **non-corporate, non-farm small and micro enterprises**: a tea stall, a tailoring unit, a beauty parlour, a small bakery. The reason it is only for non-corporate units is that it is aimed at the **very first stage** of an enterprise, when an idea is turning into a business, and a loan ceiling that small matches that stage.

The loans are called **Mudra loans** and are given by **commercial banks, regional rural banks (RRBs), small finance banks, microfinance institutions (MFIs) and NBFCs**. A borrower can walk into any of these, or apply on the **Udyami Mitra portal** (udyamimitra.in; the speech-to-text wrote "udhyammitra").

**MUDRA** itself stands for **Micro Units Development and Refinance Agency**. It is a financial institution set up by the Government of India, announced in the Union Budget of 2015-16, to support the lenders that serve micro units. Its offerings go beyond loans: refinance, a **credit guarantee** for Mudra loans, technology support, development and promotional help, and work on **financial literacy** and institution building.

> **A Mudra loan is a loan, not a subsidy.** It must be repaid with interest, but it needs no collateral.

## Four bands, named after growing up
The names show the stage of the business. They are like a person's life: a child, a teenager, an adult and a mature adult.`,

    sk(310, 'The four Mudra bands match the stage of the unit', [
      { t: 'text', x: 15, y: 18, text: `The loan grows with the business`, size: 16, anchor: `start`, color: `#c2410c` },
      { t: 'box', x: 15, y: 190, w: 170, h: 70, label: `Shishu`, sub: `up to ₹50,000`, fill: `green` },
      { t: 'text', x: 100, y: 280, text: `start-up, tiny business`, size: 14, color: `#4a5568` },
      { t: 'box', x: 200, y: 140, w: 170, h: 70, label: `Kishore`, sub: `₹50,001 to ₹5 lakh`, fill: `yellow` },
      { t: 'text', x: 285, y: 230, text: `growing, needs to expand`, size: 14, color: `#4a5568` },
      { t: 'box', x: 385, y: 90, w: 170, h: 70, label: `Tarun`, sub: `₹5 lakh to ₹10 lakh`, fill: `orange` },
      { t: 'text', x: 470, y: 180, text: `established, wants machines`, size: 14, color: `#4a5568` },
      { t: 'box', x: 570, y: 40, w: 175, h: 70, label: `Tarun Plus`, sub: `₹10 lakh to ₹20 lakh`, fill: `pink` },
      { t: 'text', x: 657, y: 130, text: `repaid a Tarun loan,\nnow scaling up`, size: 14, color: `#4a5568` },
    ]),

    `- **Shishu (up to ₹50,000):** start-ups and very small businesses at the **initial stage**.
- **Kishore (₹50,001 to ₹5 lakh):** a growing micro enterprise that needs to **expand and strengthen operations**.
- **Tarun (above ₹5 lakh, up to ₹10 lakh):** an **established** unit that wants to **grow, modernise and expand**, for example with more plant, machinery or technology.
- **Tarun Plus (above ₹10 lakh, up to ₹20 lakh):** a **mature** borrower who has **already taken and repaid a Tarun loan**, so credit-worthiness is proven, now to **scale up**.

Older material says "Mudra loans up to ₹10 lakh". The ₹20 lakh ceiling is the later Tarun Plus band. The aim, as the lecture says, is to promote **entrepreneurship among the new generation**, especially at the Shishu stage.

## Two routes for the money
Mudra supports lenders in **two ways**.

**1. Micro Credit Scheme.** A **direct, very small loan, up to ₹1 lakh**, usually through **microfinance institutions**, to individuals, **self-help groups** or **joint liability groups**. It is meant for tiny income-generating activities (a tea vendor, for example).

**2. Refinance Scheme.** Banks, RRBs, small finance banks, urban cooperative banks, NBFCs and MFIs lend to micro and small units in the four bands (**term loans, working capital loans, or both**, up to ₹10 or ₹20 lakh a unit). **MUDRA then refinances them**: it lends them money so they can keep lending. Lenders must meet MUDRA's conditions to use it.

**Women entrepreneurs** get a boost: the lender may offer **extra facilities, including a lower interest rate**.`,

    sk(300, 'How Mudra money reaches a micro unit', [
      { t: 'box', x: 10, y: 100, w: 140, h: 70, label: `MUDRA`, sub: `refinance agency`, fill: `yellow` },
      { t: 'box', x: 270, y: 26, w: 215, h: 62, label: `Banks, RRBs, SFBs, NBFCs`, fill: `blue`, size: 16 },
      { t: 'box', x: 270, y: 186, w: 215, h: 62, label: `Microfinance institutions`, fill: `green`, size: 15 },
      { t: 'box', x: 610, y: 100, w: 140, h: 70, label: `Micro unit`, sub: `the borrower`, fill: `orange` },
      { t: 'arrow', x1: 154, y1: 118, x2: 266, y2: 66, label: `refinance`, lx: -8 },
      { t: 'arrow', x1: 154, y1: 152, x2: 266, y2: 208, label: `refinance`, lx: -8, ly: 16 },
      { t: 'arrow', x1: 489, y1: 62, x2: 606, y2: 118, label: `up to ₹20 lakh`, lx: 28, ly: -22 },
      { t: 'arrow', x1: 489, y1: 214, x2: 606, y2: 152, label: `up to ₹1 lakh`, lx: 24, ly: 26 },
      { t: 'note', x: 120, y: 268, w: 520, h: 28, text: `Women entrepreneurs may get a lower interest rate or other extras`, fill: `yellow`, size: 14 },
    ]),

    `## What a Mudra loan can be used for
The lecture gives an **illustrative list**. The test is that the activity is **income-generating, non-farm and for business**.
- **Business loans** for vendors, traders, shopkeepers and small service units.
- **Working capital** through the **Mudra Card**, and **equipment finance** for micro units (up to ₹20 lakh for a grown unit).
- **Transport for business**: auto-rickshaws, small goods carriers, tractors and trolleys, tillers and two-wheelers **used commercially**, never for personal use.
- **Services:** salons, beauty parlours, gyms, boutiques; repair shops for cycles, motorcycles and cars; photocopy and typing shops; medicine shops; courier services.
- **Food products:** pickles, papad, sweet shops, food stalls, bakeries, bread and bun units, and **cold-chain vehicles**.
- **Agri-allied, non-farm activities:** pisciculture, beekeeping, poultry, grading, sorting and aggregation, agro-industries, agri clinics and agri business, food and agro processing. **Growing crops directly is not covered.**

## The Mudra Card
A **debit card** issued against the **working-capital part** of a Mudra loan. It works like an ATM card: the borrower **withdraws when needed, as often as needed**, within the limit, and pays **interest only on the amount drawn and only for the period it is held**. That keeps the interest burden low. Because every withdrawal and repayment is recorded, it also **builds a credit history**. It works at **ATMs, micro-ATMs and shop card machines (POS)** across the country. It is **only for the working-capital portion**: the term-loan portion is paid out in the usual way.`,

    sk(212, 'A Mudra loan with a card: two parts, two ways to pay interest', [
      ...bar([
        { v: 6, top: `Term loan (machines)`, label: `paid out once; instalments`, fill: `blue`, size: 15 },
        { v: 4, top: `Working capital`, label: `Mudra Card limit`, fill: `green`, size: 15 },
      ], { x: 20, y: 24, w: 720, h: 50 }),
      { t: 'note', x: 20, y: 110, w: 420, h: 60, text: `Interest on the whole amount,\nrepaid in fixed instalments`, fill: `blue`, size: 15 },
      { t: 'note', x: 460, y: 110, w: 280, h: 60, text: `Interest only on the amount\nyou draw, for the days you hold it`, fill: `green`, size: 14 },
    ]),

    `## What does the borrower pay?
Mudra's pricing logic is simple: small units used to borrow from **informal sources at very high cost**. MUDRA **refinances** lenders so their own cost falls and that benefit can be passed on. The lecture gives these **maximum rates** (caps) that lenders may charge on Mudra-refinanced loans:
- **Commercial banks:** a cap linked to the **yield on the 10-year government security**.
- **Regional rural banks:** the **Mudra refinance rate plus 3.5%**.
- **NBFCs:** the **Mudra refinance rate plus 8%**.

These are **ceilings**, not fixed rates: the lender may charge less, and the refinance rate itself changes. Always ask the lender for the current rate.

## The "Credit Plus" idea
Small units often lack more than money. They may not have technical, managerial or accounting skills, and may not know the schemes, the markets, export chances or modern methods. They get late or wrong information, may not be **financially literate** or **business literate**, and may lack the drive to grow. So Mudra pairs credit with **development and promotional support**, called the **credit plus approach**. Part 2 covers it.

## Where Mudra fits
The scheme works together with three national efforts: **Make in India** (promoting small units), the **National Rural and Urban Livelihoods Missions** (giving poor households a path to self-employment) and the **National Skill Development Corporation** (building skills). The aim is to bring small, informal units into the **formal financial system**.

## Worked example: which band?
| Client | Need | Band | Why |
|---|---|---|---|
| A **tea stall** owner | ₹30,000 for a new stove and stock | **Shishu** | Up to ₹50,000, a tiny start |
| **Meena** | ₹1.5 lakh for two more machines | **Kishore** | ₹50,001 to ₹5 lakh, a growing unit |
| **Ravi's** firm | ₹8 lakh for machines plus a working-capital limit | **Tarun** | ₹5 to ₹10 lakh, an established firm |
| A boutique owner who **repaid a Tarun loan** | ₹15 lakh to scale up | **Tarun Plus** | ₹10 to ₹20 lakh, proven record |
| A man who wants a **car for family use** | ₹6 lakh | **Not eligible** | Personal, not income-generating |
| A farmer who wants a loan to **grow wheat** | ₹2 lakh | **Not eligible** | Direct farming is excluded. A **beekeeping or poultry** unit would qualify |`,

    { analogy: `Mudra is a **tiered programme with an automatic upgrade path**, like a developer account that starts with a small free tier and, after a clean usage record, unlocks a higher tier. The **Mudra Card** is a **pay-as-you-use** line: you draw and release capacity and are billed only for what you hold. **Refinance** is the platform lending to **resellers** (banks) so they can serve end users. And **credit plus** is the **documentation and onboarding support** that comes with the account.` },

    { warn: `Easy mistakes:
- **Calling a Mudra loan a subsidy.** It is a loan: repay with interest.
- **Using it for personal needs or a personal vehicle.**
- **Promising a rate.** Rates are set by lenders within the caps.
- **Recommending the wrong band.** Match the amount and the stage.
- **Forgetting that corporate units are not covered.** Mudra is for non-corporate units; check how the lender treats companies.
- **Drawing the whole Mudra Card limit** because it is there. Interest runs on what is withdrawn.
- **Quoting an old ceiling.** Older notes say ₹10 lakh; the Tarun Plus band raised it to ₹20 lakh. Check the current rule.` },

    { real: `A very common first client: a small trader who has been borrowing from a local moneylender. Show them the three numbers: the moneylender's monthly interest, a Mudra loan's rate, and the interest on a Mudra Card drawn for ten days. Then help them fill the bank's application with a short note on the business, what the loan will buy, and monthly sales. The bank manager then has what is needed to approve.` },

    { remember: `- **PMMY** (8 April 2015): collateral-free loans to **non-corporate, non-farm** micro and small units. A **loan**, not a subsidy.
- **Bands:** **Shishu** up to ₹50,000; **Kishore** ₹50,001 to ₹5 lakh; **Tarun** ₹5 to ₹10 lakh; **Tarun Plus** ₹10 to ₹20 lakh (after repaying a Tarun loan).
- **Two routes:** **Micro Credit** (up to ₹1 lakh via MFIs, SHGs, JLGs) and **Refinance** (banks, RRBs, SFBs, NBFCs refinanced by MUDRA).
- **Uses:** vendors, traders, services, food, repair, commercial transport, agri-allied non-farm. **Not** crops, **not** personal use.
- **Mudra Card:** for the working-capital part; interest only on what you draw.
- **Caps on interest** (as given in the course): banks linked to the 10-year G-Sec yield, RRBs refinance rate + 3.5%, NBFCs + 8%.
- Apply at any lender or on the **Udyami Mitra** portal.` },
  ],
  quiz: [
    { q: `Which Mudra band is for loans above ₹5 lakh and up to ₹10 lakh?`, o: [`Shishu`, `Kishore`, `Tarun`, `Tarun Plus`], a: 2, why: `Tarun covers above ₹5 lakh up to ₹10 lakh. Tarun Plus goes from ₹10 lakh to ₹20 lakh.` },
    { q: `A borrower who has repaid a Tarun loan wants to scale up. Which band applies?`, o: [`Shishu`, `Kishore`, `Tarun`, `Tarun Plus`], a: 3, why: `Tarun Plus (₹10 lakh to ₹20 lakh) is for borrowers who have taken and repaid a Tarun loan.` },
    { q: `Who normally gives the Micro Credit Scheme loans of up to ₹1 lakh?`, o: [`Microfinance institutions, to individuals, SHGs and JLGs`, `The GST department`, `Commercial banks only`, `NSIC`], a: 0, why: `Micro credit is a direct small loan, mostly through microfinance institutions to individuals and groups.` },
    { q: `What does MUDRA do under the Refinance Scheme?`, o: [`It lends directly to the micro unit`, `It lends money to banks and NBFCs so they can lend to micro units`, `It collects taxes`, `It audits the unit`], a: 1, why: `Refinance means MUDRA finances the lender, which then lends on to micro and small units.` },
    { q: `How is interest charged on a Mudra Card?`, o: [`On the whole limit from day one`, `On the amount withdrawn, for the period it is held`, `A flat fee per year`, `No interest`], a: 1, why: `The card is for working capital: the borrower pays interest only on the amount drawn and the days it is drawn.` },
    { q: `Which request is NOT eligible for a Mudra loan?`, o: [`A beekeeping unit`, `A beauty parlour`, `A bakery`, `A car for family use`], a: 3, why: `Mudra loans are for income-generating business use. A vehicle for personal use is excluded.` },
  ],
};
