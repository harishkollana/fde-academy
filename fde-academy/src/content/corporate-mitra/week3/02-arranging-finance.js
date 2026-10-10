import { sk } from '../_kit.js';

export default {
  title: `Arranging finance: matching the right money to the need`,
  goal: `You can split a project's money needs into long-term and short-term, name the three sources of finance (government schemes, banks, digital lenders), explain how a credit guarantee lets a bank lend without collateral, and draft a simple funding plan for a client.`,
  covers: [`Own money, loans and subsidies`, `Long-term and short-term needs`, `Government-backed options`, `Bank products`, `Digital and NBFC lenders`],
  terms: [
    [`Promoter's contribution`, `The part of the project cost the owner puts in from his own pocket. Banks expect it.`],
    [`Term loan`, `A loan for a fixed period, repaid in instalments, used for long-lasting things such as machinery.`],
    [`Working capital loan`, `Short-term borrowing for day-to-day costs: raw material, wages, electricity, and money tied up in unpaid bills.`],
    [`Cash credit / overdraft`, `A running limit at the bank. You can draw and repay as needed, and pay interest only on what you use.`],
    [`Collateral`, `An asset (land, building, stock) pledged to the bank as security for a loan.`],
    [`Credit guarantee`, `A promise by a government-backed trust to cover part of the bank's loss if the borrower cannot repay. It replaces collateral.`],
    [`Invoice (bill) discounting`, `Selling an unpaid bill to a financier at a small discount to get most of the money at once.`],
    [`TReDS`, `Trade Receivables Discounting System: an online platform on which a small seller's invoices are bought by financiers.`],
    [`NBFC`, `Non-banking finance company: a lender registered with the RBI that is not a bank.`],
    [`Underwriting`, `The lender's way of judging how likely you are to repay and deciding the loan terms.`],
    [`Equity funding`, `Money put in by an investor who gets a share of the business instead of being repaid with interest.`],
    [`Self-Reliant India (SRI) Fund`, `A government-backed fund that invests equity in MSMEs with high growth potential, through smaller funds called daughter funds.`],
  ],
  blocks: [
    `## Finance is the lifeblood of the business
A business needs money to buy land, building, equipment and raw material, and to pay wages. Part of it the **owner must bring** (the **promoter's contribution**). The rest comes from outside: **government schemes**, **banks and financial institutions**, and **private lenders** (NBFCs). A good entrepreneur does two things: **arranges enough money**, and arranges it **at the lowest possible cost**. A Corporate Mitra helps the client do both.

The lecture's main point is a **match**. Different needs call for different money:

| The need | The right kind of money |
|---|---|
| Machinery, equipment, building (lasts for years) | **Long-term**: a **term loan**, or a subsidy-linked loan |
| Raw material, wages, electricity, unpaid bills (days and weeks) | **Short-term**: **working capital**, **cash credit**, **overdraft**, **invoice discounting** |
| Export orders | An **export credit** with interest support |
| A start-up or fast-growing unit | A **start-up guarantee** or **equity** |

Borrowing short-term money for machinery is a trap: the loan comes due long before the machine has earned it back.

## Three sources, side by side`,

    sk(330, 'Three places to get money, with different strengths', [
      { t: 'box', x: 10, y: 12, w: 230, h: 50, label: `Government schemes`, fill: `green`, size: 17 },
      { t: 'box', x: 265, y: 12, w: 230, h: 50, label: `Banks`, fill: `blue` },
      { t: 'box', x: 520, y: 12, w: 230, h: 50, label: `Digital lenders, NBFCs`, fill: `orange`, size: 16 },
      { t: 'note', x: 10, y: 76, w: 230, h: 176, text: `CGTMSE: no collateral\nMudra: up to ₹20 lakh\nPMEGP: subsidy-linked\nExport interest support\nStart-up guarantee\nSRI Fund (equity)`, fill: `green`, size: 14 },
      { t: 'note', x: 265, y: 76, w: 230, h: 176, text: `Term loan for machinery\nCash credit, overdraft\nSupply-chain finance\nBill discounting (TReDS)\nQuick portals such as\nthe 59-minute loan site`, fill: `blue`, size: 14 },
      { t: 'note', x: 520, y: 76, w: 230, h: 176, text: `Approval judged on cash\nflow and sales data\nCollateral-free\nOften within a day or two\nSuits a short gap or a\nsmall urgent need`, fill: `orange`, size: 14 },
      { t: 'text', x: 380, y: 288, text: `Mix them: the aim is the lowest cost and the right fit`, size: 16, color: `#c2410c` },
    ]),

    `## 1. Government-backed options
**Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE).** Most small owners have no land or building to pledge, and cannot find a third party to guarantee the loan. This trust, set up by the Government of India and **SIDBI**, acts as the **guarantor**. If a qualifying borrower defaults, the trust **covers a large share of the loss** of the bank. The bank is protected, so it will lend **without collateral**; and the borrower does not have to sell personal assets to cover the shortfall.

**How it works for the client:** the entrepreneur does **nothing special**. He applies to the **bank** for a loan and does the usual paperwork. It is the **bank** that gets the guarantee from the trust and pays the guarantee fees. Both **new and existing** entrepreneurs are eligible. The course says the guarantee covers about **75% of the loan** in default and more for small loans (lesson 12 has the full table). Banks apply to the office of the **Development Commissioner (MSME)**; the entrepreneur approaches the bank.`,

    sk(262, 'How a credit guarantee replaces collateral', [
      { t: 'box', x: 10, y: 80, w: 170, h: 90, label: `Entrepreneur`, sub: `no collateral`, fill: `yellow` },
      { t: 'box', x: 295, y: 80, w: 170, h: 90, label: `Bank`, sub: `the lender`, fill: `blue` },
      { t: 'box', x: 580, y: 80, w: 170, h: 90, label: `Guarantee trust`, sub: `CGTMSE`, fill: `green`, size: 18 },
      { t: 'arrow', x1: 184, y1: 106, x2: 291, y2: 106, label: `applies` },
      { t: 'arrow', x1: 291, y1: 148, x2: 184, y2: 148, label: `loan`, ly: 16 },
      { t: 'arrow', x1: 469, y1: 106, x2: 576, y2: 106, label: `asks cover` },
      { t: 'arrow', x1: 576, y1: 148, x2: 469, y2: 148, label: `pays loss share`, ly: 16 },
      { t: 'note', x: 40, y: 204, w: 680, h: 44, text: `The borrower deals only with the bank. The trust pays the bank part of the loss if the loan goes bad,\nso the borrower's own assets are not pledged.`, fill: `yellow`, size: 14 },
    ]),

    `**Mudra (PMMY).** Collateral-free loans for small non-corporate, non-farm units, in four bands: **Shishu** (up to ₹50,000), **Kishore** (₹50,001 to ₹5 lakh), **Tarun** (₹5 lakh to ₹10 lakh) and **Tarun Plus** (₹10 lakh to ₹20 lakh, for borrowers who have repaid a Tarun loan). This lecture says "up to ₹10 lakh", which was the ceiling before Tarun Plus. Lessons 6 and 7 cover it.

**PMEGP.** A subsidy-linked loan for **new** micro units (term loan and working capital). KVIC is the national agency and the subsidy is routed through banks into the borrower's account. The course says subsidy is **15% to 35%** of the project cost. Lessons 8 to 10 cover it.

**Export credit with interest support.** This lecture describes a **3% interest equalisation** on pre- and post-shipment rupee export credit, not for merchant exporters (pure traders). That was the older scheme. It has been replaced by **Niryat Protsahan** from 2 January 2026, with rates notified from time to time. Lesson 13 covers both.

**Start-up guarantee and SRI Fund.** The **Credit Guarantee Scheme for Startups** gives collateral-free loans to recognised start-ups (the course says up to ₹10 crore). The **Self-Reliant India Fund** is **equity**, put in through daughter funds, for MSMEs with high growth potential.

## 2. Bank products
- **Term loans** for machinery and equipment (long-term).
- **Cash credit and overdraft**: a running limit for **inventory, debtors and day-to-day expenses**. You use what you need and pay interest on what you use.
- **Supply-chain finance and equipment finance**: banks such as **SBI** offer specialised SME products. The lecture also mentions a government-backed, quick-turnaround **online loan portal** offering MSME and Mudra loans (the course says up to ₹5 crore).
- **Bill discounting through TReDS.** A small supplier's invoice to a large buyer is put on the platform, a financier buys it at a small discount, and the supplier gets money **at once**, without waiting for the buyer's payment cycle.

## 3. Digital and non-bank lenders
The lecture names private digital lenders such as **Lendingkart, Kinara Capital, Credit Saison India, NeoGrowth, Capital Float and DMI Finance** (the speech-to-text garbled some of the names). They do **tech-driven underwriting**: instead of only the balance sheet, they look at **cash flow, sales velocity and digital payment data**. They offer **collateral-free** loans, **fast approval (often within 24 to 48 hours)**, and some work with as little as **six months** of business history. Other forms they offer: **invoice discounting**, **cash-flow-based credit** and **embedded finance** (financing offered inside a supply-chain or e-commerce app).

These lenders **fill the gap** when a bank is slow, but they may cost more. Before you recommend any private lender, check that it is **registered with the RBI**, and compare the **total cost** of the loan, not just the speed. The names in the lecture are examples; confirm that each is still operating.`,

    { analogy: `Matching finance to need is **matching storage and compute tiers to the workload**. A machine is **reserved capacity**: you commit for the long term at a lower unit cost (term loan). Working capital is **on-demand or burst capacity**: you draw it and release it as needed (overdraft). A credit guarantee is **insurance that lets the provider accept a customer it would otherwise refuse**. And a digital lender is a **fast, pay-more spot instance**: ideal for a short gap, too expensive to build the whole plant on.` },

    `## Worked example: a funding plan for Ravi's namkeen line
The project in lesson 11 and 12 costs about ₹10 lakh. This is an **illustration**; the real split depends on the bank.

| Uses of money | ₹ lakh | Sources of money | ₹ lakh |
|---|---|---|---|
| Machines and installation | 6 | Ravi's own contribution | 2 |
| Fittings for the shed | 1 | Term loan (machines, fittings) | 5 |
| Working capital (raw material, wages) | 3 | Cash credit (working capital) | 3 |
| **Total** | **10** | **Total** | **10** |

- **Uses equal sources.** Both columns add up to ₹10 lakh.
- **The machines are paid from long-term money**, the stock and wages from a running limit.
- Ravi's bank borrowing is ₹8 lakh. As a partnership firm making goods, his firm is a non-corporate, non-farm unit, so this would be a **Mudra Tarun** loan (₹5 to ₹10 lakh).
- If the bank asks for collateral he cannot give, ask whether the loan can be **covered by CGTMSE**.
- If the buyers he supplies pay late, **bill discounting** can help.
- **PMEGP** is for *new* units, so it does not apply to Ravi, whose firm already exists.`,

    { warn: `Easy mistakes:
- **Using short-term money for long-term needs.** A machine bought on an overdraft strains the cash flow.
- **Forgetting the owner's contribution.** Every lender expects some.
- **Choosing the fastest lender only.** Speed has a price: check the full cost.
- **Assuming "collateral-free" means "free of conditions".** The bank still judges the borrower; the guarantee only covers the bank's loss.
- **Going to an unregistered lender.** Check the RBI registration.
- **Applying for PMEGP for an existing unit.** It is for new projects.
- **Quoting a loan ceiling or a fee without checking the scheme's page.** They change.` },

    { real: `For each client draw the two-column **uses and sources** table before you speak to any bank. If the columns do not balance, the plan is not ready. Then list, for each source, **who is the lender, what scheme applies, and what papers are needed**. When the client says "just get me a loan", this table turns it into a clear request that a bank manager can approve.` },

    { remember: `- Finance should be **enough and cheap**, and **matched to the need**: **long-term** money for machines, **short-term** for working capital.
- **Sources:** government-backed schemes, banks and financial institutions, digital lenders and NBFCs. Mix them.
- **CGTMSE** guarantees the bank so it can lend **without collateral**. The client only deals with the bank.
- **Mudra** (four bands, up to ₹20 lakh), **PMEGP** (subsidy-linked, new units), **export interest support** (the old 3% scheme, now **Niryat Protsahan**), **start-up guarantee**, **SRI Fund** (equity).
- **Bank tools:** term loan, cash credit, overdraft, supply-chain finance, **TReDS** bill discounting.
- **Digital lenders** judge cash flow and are fast; check **RBI registration** and **total cost**.
- **Uses of money must equal sources of money.**` },
  ],
  quiz: [
    { q: `A client wants money to buy a machine that will last ten years. Which kind of finance fits best?`, o: [`An overdraft`, `Invoice discounting`, `A term loan`, `A credit card`], a: 2, why: `Long-lasting assets should be paid for with long-term money, such as a term loan, not with a running short-term limit.` },
    { q: `How does CGTMSE help a small borrower?`, o: [`It pays the borrower's wages`, `It guarantees part of the bank's loss, so the bank can lend without collateral`, `It gives a subsidy of 35%`, `It registers the unit on Udyam`], a: 1, why: `CGTMSE acts as guarantor for the bank. In case of default it covers a share of the loss, which removes the need for collateral.` },
    { q: `Who applies to the guarantee trust for cover?`, o: [`The lending bank or institution`, `The entrepreneur directly`, `The GST officer`, `The district collector`], a: 0, why: `The entrepreneur only approaches the bank. The bank gets the guarantee from the trust and pays its fees.` },
    { q: `What does TReDS allow a small supplier to do?`, o: [`Register a trademark`, `Export duty-free`, `Pay GST online`, `Sell an unpaid invoice to a financier and get cash early`], a: 3, why: `TReDS is an online platform for discounting trade receivables, so small suppliers need not wait for a large buyer's payment cycle.` },
    { q: `Which is a sound check before recommending a private digital lender?`, o: [`That it advertises quick approval`, `That it asks for no documents`, `That it is registered with the RBI and that the total cost is acceptable`, `That it is the most popular app`], a: 2, why: `Speed is not enough. Confirm RBI registration and compare the full cost of the loan.` },
    { q: `In a funding plan, which statement must always be true?`, o: [`Loans are larger than the project cost`, `The owner contributes nothing`, `Uses of money equal sources of money`, `All money is short-term`], a: 2, why: `The money raised must exactly cover the money needed, so the two columns of the plan balance.` },
  ],
};
