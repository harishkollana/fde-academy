import { sk, flow2, bar } from '../_kit.js';

export default {
  title: `SIDBI SMILE: long-term loans to grow, expand and modernise`,
  goal: `You can explain what SIDBI and the SMILE scheme are, who is eligible, what the loan size, debt-equity ratio, interest, moratorium and security rules are, how an application moves from the first visit to the money, and how a Corporate Mitra can help.`,
  covers: [`The problem SMILE solves`, `Key features`, `Eligibility and target sectors`, `Approval steps and documents`, `Discipline, impact and the professional role`],
  terms: [
    [`SIDBI`, `Small Industries Development Bank of India: the development bank for MSMEs, set up on 2 April 1990.`],
    [`SMILE`, `SIDBI Make in India Loan for Enterprises: a government-backed SIDBI scheme for long-term loans to MSMEs.`],
    [`Make in India`, `The campaign to make products in India, and to encourage manufacturing and service units to do so.`],
    [`Term loan`, `A loan repaid over a fixed period, for long-lasting assets.`],
    [`Debt-equity ratio`, `The rupees of loan for each rupee of the owner's own money. 3:1 means ₹3 of loan for ₹1 of own money.`],
    [`Moratorium`, `A grace period at the start of a loan when no principal is due, or only interest is paid.`],
    [`First charge`, `The lender's first claim on an asset if the borrower fails. Other lenders are paid after it.`],
    [`Residual charge`, `A lender's claim on whatever value is left in an asset after earlier claims are met.`],
    [`Personal guarantee`, `A promise by the owner or promoter to repay the loan from his own assets if the business cannot.`],
    [`Prepayment penalty`, `A fee some lenders charge when a borrower repays early. SMILE has none.`],
    [`Sanction letter`, `The lender's letter giving the loan on stated terms and conditions.`],
    [`Pre-disbursement conditions`, `Things the borrower must do after sanction and before any money is paid, such as a board resolution and creating the charge.`],
  ],
  blocks: [
    `## The problem: a lot of dreams, not much cash
MSME owners have **limited resources and unlimited dreams**. They struggle to manage day-to-day capital. They grow without a plan, and expansion comes suddenly. Borrowing is costly. They often take **short-term** loans, and the repayments press on their finances all the time, which leaves them short of money.

What they need for growth is **long-term** money with **gentle early payments**. That is what SIDBI designed SMILE to give.

## What SMILE is
**SIDBI** is the **Small Industries Development Bank of India**, set up on **2 April 1990** as a development finance institution **dedicated to promoting MSMEs**. It helps start-ups, judges units' creditworthiness and helps them solve their financing problems. **SMILE** is its main initiative: **S**IDBI **M**ake in **I**ndia **L**oan for **E**nterprises. It is a government-supported scheme for the MSME sector, to promote **manufacturing and service units** that fit the **Make in India** idea: make your product in India and make it more indigenous.

SMILE gives **easy terms**: **a long tenor**, **small payments in the early years and larger ones later**, and so **less cash going out**, which leaves the MSME with enough cash on hand. It focuses on **long-term growth**, not working capital: **short-term working capital needs can be met from other sources**.

**Objectives.** Promote Make in India; support **new and existing** MSMEs; raise their **competitiveness**; help them create **jobs and adopt new technology**; improve **operations and productivity** with financial resources; and fund **expansion and modernisation** with **long-term** money.

## Key features (as the lecture gives them)`,

    `| Feature | What SMILE offers |
|---|---|
| **Minimum loan** | **₹20 lakh** for existing units; **₹50 lakh** for new units |
| **Share of project cost** | Up to **75%** of the project cost for smaller projects (the lecture speaks of a ₹1 crore limit) |
| **Debt-equity ratio** | **3:1** for smaller projects (₹3 of loan for ₹1 of owner's money); **2:1** (two-thirds) for larger ones |
| **Interest** | **Lower for the first three years**, because cash comes in slowly early on. **From the fourth year** the rate is generally raised, based on the bank's own **MSME rating** system |
| **Repayment** | Up to **10 years**, including a **moratorium of up to 3 years**, during which only interest is paid, or nothing |
| **Security** | **First charge** on all the project's assets; the **personal guarantee** of the promoters; a **residual charge** on all assets, which may also be needed |
| **Early repayment** | **No penalty** for paying before time |

(These figures are from the lecture. SIDBI changes its terms, so **check SIDBI's website** before you quote them.)`,

    sk(212, 'A 10-year SMILE loan: a gentle start, then repayment', [
      ...bar([
        { v: 3, top: `Years 1 to 3`, label: `moratorium, lower rate`, fill: `green`, size: 17 },
        { v: 7, top: `Years 4 to 10: repayment`, label: `rate reset by the bank's MSME rating`, fill: `blue`, size: 17 },
      ], { x: 20, y: 24, w: 720, h: 52 }),
      { t: 'note', x: 60, y: 136, w: 640, h: 56, text: `In the moratorium the unit builds the project and starts earning.\nBy the time the big repayments begin, cash is coming in.`, fill: `yellow`, size: 15 },
    ]),

    `## Who is eligible
- **New** MSME units.
- **Existing manufacturing** MSMEs and **existing service** MSMEs.
- **New Make in India** enterprises.
- **Existing** MSMEs planning **expansion or modernisation**.
- MSMEs planning **domestic production or services**.

**Target sectors.** The scheme names **25 priority sectors**, but it is **not limited to them**, and units in other sectors can apply too. Some of the sectors the lecture lists: automobiles and components, aviation, construction units, biotechnology, food processing, textiles and apparel, chemicals and pharmaceuticals, electronics manufacturing, renewable energy, IT and related services, healthcare and medical devices, freight and warehousing, and tourism and hospitality. The full list is on SIDBI's website.`,

    sk(206, 'Some of the 25 priority sectors (the full list is on SIDBI\'s website)', [
      ...[`Autos and parts`, `Aviation`, `Construction`, `Biotechnology`, `Food processing`, `Textiles, apparel`, `Chemicals, pharma`, `Electronics`, `Renewable energy`, `IT and services`, `Healthcare, devices`, `Freight, warehousing`].map((t, i) => ({
        t: 'box', x: 10 + (i % 4) * 187, y: 16 + Math.floor(i / 4) * 60, w: 175, h: 46, label: t, fill: [`blue`, `green`, `orange`, `purple`][(i + Math.floor(i / 4)) % 4], size: 15,
      })),
    ]),

    `## From the first visit to the money`,

    sk(262, 'The SMILE approval path', flow2([
      { label: `Meet the nearest\nSIDBI branch`, fill: `blue` },
      { label: `Get the form,\nmake the lists`, fill: `blue` },
      { label: `Collect papers,\nfill the form`, fill: `yellow` },
      { label: `SIDBI reviews,\nasks, may visit`, fill: `orange` },
      { label: `Sanction letter;\nmeet conditions`, fill: `orange` },
      { label: `Money paid into\nthe unit's account`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `1. **First meeting.** The owner visits the nearest **SIDBI branch**, discusses the plan and checks that the unit fits the scheme.
2. **Get the application form** from the branch or download it from SIDBI's website.
3. **Study the form** and make a **list of the information and supporting documents** it needs. This is the most useful step.
4. **Collect the papers** (it takes time: they are often scattered) and **fill the form carefully**. What you state must match the documents exactly.
5. **Submit** the filled form with all the documents.
6. **SIDBI reviews** the documents, the **track record and profitability**, and may raise **queries** or ask for **more papers**, which the unit must supply. For **new units**, SIDBI officers often **visit** to see for themselves.
7. **Sanction letter.** It sets out the **conditions to be met before the money is paid** (pre-disbursement conditions): for a company, a **board resolution** accepting the limit, **creating the charge** on the assets, and **accepting the sanction letter** itself. The unit should meet these quickly.
8. **Disbursement.** When all conditions are met, the amount is paid into the **borrower's account**.

**Documents.** A **business plan** (goals and projected finances); **audited financial statements for the last three years**; **tax returns** (the last three years' **income tax and GST returns**); **business and tax registration certificates**, including **Udyam**; the **KYC of all owners** (one owner for a proprietorship, all partners for a firm, the promoters and directors of a company); and the **papers for the security** offered for the loan.

## Worked example: an ₹80 lakh new unit
A new unit plans a machinery-and-shed project costing **₹80 lakh**.

| Item | Working |
|---|---|
| Loan at 3:1 (75% of the cost) | ₹80 lakh × 75% = **₹60 lakh** (it is above the ₹50 lakh minimum for a new unit) |
| Owner's own money | ₹20 lakh |
| Years 1 to 3 (moratorium, interest only) | At an assumed 9%: ₹60 lakh × 9% = **₹5.4 lakh a year** |
| Years 4 to 10 (7 years of repayment) | Principal: ₹60 lakh ÷ 7 = **₹8.57 lakh a year**, plus interest on the balance. At an assumed 10.5% for the first repayment year: ₹6.3 lakh. First year's outgo: about **₹14.9 lakh** |

The rates here are **assumed for the illustration** only. The point is the shape: a **light first three years** while the project is being built and earning, then larger payments when income should be steady. And if the unit repays early, there is no penalty.

## Financial discipline: what the unit owes the lender
- **Use the money exactly as the sanction letter says**, in the stated heads.
- **Finish the project on time.** Delays raise costs and push back cash, and a unit whose cash is late gets into trouble.
- **Track expenses** closely.
- **Repay on time.** It builds the promoters' goodwill and **credit score**, which matter for the next loan.

## Impact of SMILE
It creates **jobs** and supports **wider economic growth**; it helps **innovation, new technology and new products**; it has helped **backward groups**: **Scheduled Castes, Scheduled Tribes, persons with disabilities and women entrepreneurs**; and it replaces **costly informal credit** with formal credit. The lecture's summary of benefits: **long-term finance with a lower burden in the early years**, better technology, more domestic production, and a better chance for small units to survive and grow.

## The professional opportunity
Awareness is **low**; units do not have even **semi-skilled staff** to understand document needs; papers are **scattered** (some with outside advisers); gathering them takes **coordination**; and owners are busy "firefighting". A Corporate Mitra can:
- **Find the nearest SIDBI branch** (the website lists them all).
- **Explain SMILE's benefits** and **compare it with other loans**: otherwise owners stay with informal moneylenders or costly private lenders.
- **Gather and arrange the documents**.
- **Go with the owner to the SIDBI office**, since owners often lose heart alone.
- **Follow up during SIDBI's review**, and help meet the **sanction conditions** (documents, the security, the board resolution for a company), because there is always a gap between sanction and payment.

**Golden tips.** Check SIDBI's website often (the lecture says "SEBI", which is a slip): the scheme is revised in the light of experience, and new points are added. **Read the scheme closely**, make **your own list of information and documents**, learn the **disadvantages** as well as the benefits, and check at once whether a client already has the papers: speed matters to an MSME.

**Emerging trends.** SMILE began around **2015**, ten years before the lecture. Since then **banks compete on interest rates**, which is good for MSMEs. **Online portals** offer MSME loans, which saves branch visits and owners' time. **SIDBI officers hold awareness programmes** with industry associations. And **SIDBI refinances other banks and NBFCs**, so that they can lend to small and medium units.`,

    { analogy: `SMILE is a **long-duration, low-rate "reserved instance" loan with a grace period**. The **moratorium** is a **free tier** at the start, when the project is being deployed and not yet earning. The **debt-equity ratio** is a **cost-share formula** (the lender funds a fixed fraction). **First charge** is a **priority queue** on the assets. **Pre-disbursement conditions** are the **deployment checklist** that must be green before the funds are released. And SIDBI **refinancing** other banks is a **wholesale layer**: SIDBI supplies capacity to retail lenders.` },

    { warn: `Easy mistakes:
- **Using SMILE for working capital.** It is for long-term growth.
- **Forgetting the minimum loan** (₹20 lakh for existing units, ₹50 lakh for new ones, as the lecture gives it).
- **Thinking the moratorium means free money.** Interest may still be payable.
- **Not meeting the pre-disbursement conditions.** The sanction alone pays nothing.
- **Letting the project run late.** A delay pushes back the income.
- **Quoting terms from memory.** SIDBI revises them; check the website.
- **Assuming only the 25 sectors qualify.** They are the focus, not the limit.` },

    { real: `When a client says "I want to expand", ask three questions: Is it a **long-term** need (machines, a shed, new technology)? Is the project **₹26 lakh or more**? Is the unit in or near one of the **priority sectors**? If yes, compare SMILE's terms with the bank's. Prepare the document list, take the owner to the SIDBI branch, and plan the **pre-disbursement conditions** with the owner's accountant so that money flows soon after the sanction.` },

    { remember: `- **SMILE** = **S**IDBI **M**ake in **I**ndia **L**oan for **E**nterprises: government-backed **long-term** loans for new and existing manufacturing and service MSMEs. **SIDBI** was set up on 2 April 1990.
- **Minimum loan:** ₹20 lakh (existing), ₹50 lakh (new). **Up to 75%** of project cost; **debt-equity 3:1** for smaller projects, **2:1** for larger.
- **Interest** lower for the **first 3 years**, then reset by the bank's MSME rating. **Repayment up to 10 years**, including a **moratorium of up to 3 years**. **No prepayment penalty.**
- **Security:** first charge on project assets, **promoters' personal guarantee**, residual charge.
- **Process:** branch visit → form and lists → papers → review and visit → **sanction letter with pre-disbursement conditions** → payment.
- **Documents:** business plan, 3 years' audited statements, ITR and GST returns, registrations (Udyam), KYC, security papers.
- **Your role:** awareness, comparison with other loans, documents, accompanying the owner, sanction conditions.` },
  ],
  quiz: [
    { q: `What does the "S" in SMILE stand for?`, o: [`Small`, `Services`, `Support`, `SIDBI`], a: 3, why: `SMILE means SIDBI Make in India Loan for Enterprises.` },
    { q: `What is the longest repayment period under SMILE, including the moratorium?`, o: [`3 years`, `5 years`, `7 years`, `10 years`], a: 3, why: `The loan can be repaid over up to 10 years, including a moratorium of up to 3 years.` },
    { q: `Which security is typically required under SMILE?`, o: [`First charge on project assets and the promoters' personal guarantee`, `No security at all`, `Only the owner's house`, `Only a bank guarantee`], a: 0, why: `A first charge on all the project assets, the promoters' personal guarantee and sometimes a residual charge on all assets.` },
    { q: `A new unit plans a ₹60 lakh project. Under 3:1 how much loan is that, and does it meet the new-unit minimum of ₹50 lakh?`, o: [`₹40 lakh, no`, `₹45 lakh, no`, `₹50 lakh, yes`, `₹45 lakh, but it still qualifies`], a: 1, why: `75% of ₹60 lakh is ₹45 lakh, which is below the ₹50 lakh minimum for new units, so this project would not qualify as stated.` },
    { q: `What do the pre-disbursement conditions of a sanction letter include?`, o: [`Paying all interest in advance`, `A board resolution, creating the charge and accepting the sanction letter`, `Repaying the loan early`, `Registering a trademark`], a: 1, why: `After sanction, the unit must meet conditions such as a board resolution, creation of the charge and acceptance of the letter before money is paid.` },
    { q: `Is SMILE meant mainly for working capital?`, o: [`Yes, that is its main aim`, `No, it is for long-term growth, expansion and modernisation`, `Yes, but only for exporters`, `Only for traders`], a: 1, why: `SMILE focuses on long-term development. Short-term working capital needs can be met from other sources.` },
  ],
};
