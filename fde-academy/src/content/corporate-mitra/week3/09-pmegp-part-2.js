import { sk, steps, bar } from '../_kit.js';

export default {
  title: `PMEGP, part 2: eligibility, bank finance and the application journey`,
  goal: `You can check whether a client and a project are eligible for PMEGP, work out how much the bank will finance and how much can be working capital, apply the employment test, and walk a client through the application from first form to the adjusted subsidy.`,
  covers: [`Who and what is eligible`, `Trading and transport limits`, `Bank finance and working capital rules`, `The employment test`, `The application journey and the lock-in`],
  terms: [
    [`Negative list`, `The list of activities for which PMEGP gives no assistance.`],
    [`Capital expenditure`, `Money spent on things that last: machinery, equipment, shed, workshop and furniture.`],
    [`Composite loan`, `One loan that covers both the term loan (capital expenditure) and the working capital.`],
    [`Cash credit`, `A running limit at the bank for day-to-day working capital.`],
    [`EDP`, `Entrepreneurship Development Programme: training the borrower must complete before the loan is released.`],
    [`Scorecard`, `The marking sheet KVIC and the Indian Banks' Association use to rate a proposal out of 100.`],
    [`Lock-in period`, `The three years during which the subsidy sits in a deposit in the borrower's name and cannot be touched.`],
    [`TDR / SRF`, `Term Deposit Receipt or Subsidy Reserve Fund: the account in which the subsidy is parked during the lock-in.`],
    [`Fixed capital investment (FCI)`, `The money in the shed or workshop, machinery, equipment and furniture. Working capital is not part of it.`],
    [`Per-worker investment`, `Fixed capital investment divided by the number of full-time workers.`],
    [`Physical verification`, `A visit by the implementing agency to see that the unit exists and works. The unit is geo-tagged.`],
    [`Grievance portal`, `The online place to complain about delays or rejections.`],
  ],
  blocks: [
    `## Part 1 gave the money rules. Part 2 gives the conditions.
Last lesson showed how the subsidy is worked out. This lesson answers: **who can get it, for which projects, what the bank will lend, and what the client must do and in what order.**

## 1. Who and what is eligible`,

    sk(310, 'The PMEGP eligibility checks', [
      ...[
        [`Age 18 or above`, `no ceiling on income`],
        [`8th standard pass`, `needed only if cost is above ₹10 lakh (manufacturing) or ₹5 lakh (service)`],
        [`A NEW project`, `no existing unit, none that has taken another subsidy`],
        [`Real capital expenditure`, `machinery, equipment or tools; a project with none is not eligible`],
        [`Not on the negative list`, `and not pure trading (see below)`],
        [`One person per family`, `the lecture's recap adds this rule`],
      ].flatMap(([a, b], i) => [
        { t: 'mark', x: 34, y: 28 + i * 48, ok: true },
        { t: 'text', x: 60, y: 28 + i * 48, text: a, size: 17, bold: true, anchor: `start` },
        { t: 'text', x: 280, y: 28 + i * 48, text: b, size: 14, color: `#4a5568`, anchor: `start` },
      ]),
    ]),

    `Other eligible bodies, apart from individuals, are **self-help groups** (including those below the poverty line, if they have not taken another benefit), **institutions registered under the Societies Registration Act**, **production cooperative societies** and **charitable trusts**.

**What counts in the project cost.** **Land is not counted.** A **ready-built shed or workshop**, or **rented or leased premises**, can be counted, with rent for **up to three years**. The scheme wants **productive assets and jobs**, so a project with no machinery or tools gets nothing.

**Trading is mostly left out**, because the scheme is meant to create employment through manufacturing and services. It is allowed only in limited cases, with a **project ceiling of ₹20 lakh** and **not more than 10% of a state's yearly allocation**:
- **Sales outlets in the North-East**, in **left-wing-extremism-affected districts** and in the **Andaman and Nicobar Islands**.
- **Retail outlets selling goods made by KVIC, State KVI Boards, PMEGP units or SFURTI clusters**, anywhere in India.
- **Retail outlets backed by the unit's own manufacturing or service** (a furniture unit with its own showroom, a honey-processing unit with a retail counter).

**Not eligible:** a general grocery shop, a mobile-phone shop with no repair or manufacturing, and a wholesale business that only buys and resells.

**Transport** (a cab, van, boat, motorboat or shikara) is allowed, but **transport projects may be at most 10% of those financed**, and some areas are excluded (the lecture names Daman and Diu, Dadra and Nagar Haveli and hilly regions).

**Udyam registration is mandatory** for every new unit under the scheme. It is **not needed at the time of applying**, but it must be done **before the physical verification and before the subsidy is adjusted** in the loan account. It is free, and the expenses can be met from the linkage funds. Registering with KVIC or the DIC as well is voluntary.

## 2. Who finances, and how much
**Lenders:** all nationalised (public sector) banks, **regional rural banks** (in rural areas), state and district **cooperative banks**, private scheduled commercial banks regulated by the RBI, and **SIDBI** as the specialised MSME financier. RBI has told banks to give **priority** to PMEGP projects.

The bank finances **90% of the project cost for general-category borrowers and 95% for special-category borrowers** (matching the owner's 10% and 5%). The loan comes as a **term loan** for capital expenditure and **cash credit** for working capital, or as a **composite loan**.

**Working-capital rules.** The bank can finance up to **₹50 lakh** of project (term loan plus working capital).
- **Manufacturing:** working capital at most **40%** of the project, so capital expenditure at least **60%**.
- **Service or trading:** working capital at most **60%**, so capital expenditure at least **40%**.`,

    sk(250, 'How much of the project can be working capital', [
      { t: 'text', x: 20, y: 16, text: `Manufacturing project of ₹50 lakh`, size: 16, bold: true, anchor: `start` },
      ...bar([
        { v: 60, top: `Capital expenditure: at least 60%`, label: `₹30 lakh or more`, fill: `blue`, size: 15 },
        { v: 40, top: `Working capital: up to 40%`, label: `up to ₹20 lakh`, fill: `green`, size: 15 },
      ], { x: 20, y: 28, w: 720, h: 44 }),
      { t: 'text', x: 20, y: 134, text: `Service project of ₹20 lakh`, size: 16, bold: true, anchor: `start` },
      ...bar([
        { v: 40, top: `Capex: at least 40%`, label: `₹8 lakh or more`, fill: `blue`, size: 15 },
        { v: 60, top: `Working capital: up to 60%`, label: `up to ₹12 lakh`, fill: `green`, size: 15 },
      ], { x: 20, y: 146, w: 720, h: 44 }),
    ]),

    `**Examples.** A ₹20 lakh manufacturing project with ₹13 lakh of machinery and ₹7 lakh of working capital is fine: ₹7 lakh is 35% of the cost, below the 40% limit. A project with ₹55 lakh of machinery and ₹10 lakh of working capital costs ₹65 lakh: the subsidy applies to ₹50 lakh and the other **₹15 lakh may be financed by the bank without subsidy**.

**Loan after the subsidy.** A general-category borrower with a ₹20 lakh manufacturing project: own money 10% = ₹2 lakh, bank sanction 90% = ₹18 lakh. In a rural area the subsidy is 25% = ₹5 lakh. Once it is adjusted, the loan outstanding is **₹13 lakh** (18 − 5). (The lecture says ₹15 lakh, which forgets the owner's ₹2 lakh.) A **woman** with a ₹20 lakh service unit puts in 5% = ₹1 lakh, and the bank sanctions 95% = ₹19 lakh.

**If the money is not all spent.** The subsidy is based on the sanctioned cost. Suppose a ₹20 lakh project got a ₹5 lakh subsidy (25%), but after three years only **₹14 lakh** was actually invested (capital ₹10 lakh plus working capital ₹4 lakh). The shortfall is ₹6 lakh, so the **excess subsidy of 25% of 6 = ₹1.5 lakh must be returned to KVIC**. Never inflate a project cost to get a higher subsidy.

**Repayment.** The bank charges its **normal interest rate**. After an initial **moratorium** the loan is repaid over **3 to 7 years**.

## 3. The employment test
PMEGP is for jobs, not for machines. So the project must pass a **per-worker investment test**: **fixed capital investment ÷ full-time workers** must not exceed **₹3 lakh in the plains**, and **₹4.5 lakh in hilly areas, the Andaman and Nicobar Islands and Lakshadweep**. Fixed capital means the **shed or workshop, machinery, equipment and furniture** (not working capital). Part-time staff are not counted.

**Example.** Shed ₹4 lakh + machinery ₹6 lakh + furniture ₹2 lakh = ₹12 lakh. With **six full-time workers**: 12 ÷ 6 = **₹2 lakh per worker**, which is below ₹3 lakh, so the plains test is passed. A project that spent ₹12 lakh and employed only three people (₹4 lakh each) would fail.

**Rural or urban?** The subsidy rate depends on it. A place is **rural** if it comes under the **Panchayati Raj** administration and the revenue records call it a **village**; it is **urban** if it is under a municipality and recorded as a **town or city**. **Population does not matter.**

## 4. The application journey
Applications are invited through newspapers, radio and other media. Everything is **online on the PMEGP portal**: register (Aadhaar is mandatory), fill the form (separate forms for new units and for upgrades) and upload a photo, the **special-category certificate** if relevant, the **project report**, the education proof and the EDP certificate.`,

    sk(380, 'From the first form to the adjusted subsidy', steps([
      { label: `1. Apply online`, desc: `portal, Aadhaar, documents` },
      { label: `2. Agency checks`, desc: `within 5 working days` },
      { label: `3. Scored, sent to bank`, desc: `at least 50, or 60 above ₹10 lakh` },
      { label: `4. Bank decides`, desc: `within 30 days; sanction online` },
      { label: `5. EDP training`, desc: `before the loan is released` },
      { label: `6. Own money paid in`, desc: `within 30 working days of sanction` },
      { label: `7. Loan and subsidy claim`, desc: `bank files; KVIC validates in 3 days` },
      { label: `8. Lock-in, check, adjust`, desc: `3 years, then Udyam and verification` },
    ], { y: 28, dy: 46, tw: 260 })),

    `**Key points of the journey.**
- **Scrutiny** by the implementing agency within **5 working days**: the proposed activity must not be on the negative list. Wrongly filled or incomplete applications are rejected, with a stated reason.
- **Scoring.** A scorecard worked out by KVIC with the Indian Banks' Association rates the project. The pass mark is **50 out of 100 for projects up to ₹10 lakh and 60 for larger ones**. Eligible applications go to the banks.
- **Bank decision within 30 days.** The sanction is issued online, and by email or in writing. If it is delayed, the borrower can file a complaint on the **grievance portal**; it reaches the nodal officer in **two working days**, and complaints are meant to be acted on within **48 hours**.
- **EDP training.** It is **mandatory before the loan is released** (it can be started even before the sanction). It is **not needed up to ₹2 lakh**, **5 days for ₹2 to ₹5 lakh** and **10 days above ₹5 lakh**. A candidate who has already done **10 days offline or 60 hours online** of an entrepreneurship, skill or vocational programme need not repeat it.
- **Own contribution** is deposited **within 30 working days of the sanction**, with the EDP certificate. Then the **first instalment** of the loan is released, and the **bank files the subsidy claim online**. KVIC checks it (about three working days) and sends it through the nodal bank.
- **The lock-in.** The subsidy is **not given in cash**. It is kept in a **term deposit receipt or subsidy reserve fund in the borrower's name for three years**. It earns **no interest** for the borrower, and **no interest is charged on the part of the loan that matches it**.
- **Check and adjust.** The agency visits the unit, it is **geo-tagged**, the Aadhaar and **Udyam registration** are confirmed, and then the subsidy is **adjusted against the loan account**.
- **Rules.** Assistance is given **once**. **Joint financing** is not allowed. The unit must display a **PMEGP signboard** with the scheme, the financing bank and the district. SMS and email alerts mark each stage. **Disaster-affected areas** get priority.`,

    `## Worked example: Kavya's masala unit
Kavya, a woman in a village, plans a **masala grinding and packing unit**. Total project cost **₹20 lakh**: shed ₹3 lakh, machines ₹9 lakh, furniture ₹2 lakh (so fixed capital ₹14 lakh) and working capital ₹6 lakh. She will employ six full-time women.

| Check | Result |
|---|---|
| Age, new project, has machinery | **Yes** |
| Education | **8th pass needed** (cost above ₹10 lakh) |
| Category and area | **Special (woman), rural**: own 5%, subsidy 35% |
| Working capital | 6 ÷ 20 = **30%**, within the 40% limit |
| Per-worker investment | 14 ÷ 6 = **₹2.33 lakh**, within ₹3 lakh |
| Own money | 5% of 20 = **₹1 lakh** |
| Bank sanction | 95% of 20 = **₹19 lakh** |
| Subsidy | 35% of 20 = **₹7 lakh** (cost is below the ₹50 lakh cap) |
| Loan after adjustment | 19 − 7 = **₹12 lakh** |
| EDP | **10 days** (cost above ₹5 lakh) |
| Udyam | Register **before verification** |

Her plan passes. After the **three-year lock-in** and the verification visit, the ₹7 lakh is adjusted against her loan.`,

    { analogy: `The journey is a **CI/CD pipeline with gates**. **Eligibility** is the lint stage, the **scorecard** is the quality gate (pass at 50 or 60), the **bank** is the approval gate, the **EDP** is a mandatory training check, the **own contribution** is the deposit that unlocks the deploy, and the **lock-in plus physical verification** is the post-deploy audit before the credit is applied. Geo-tagging is the **health check** that proves the service is actually running.` },

    { warn: `Easy mistakes:
- **Applying for an existing unit.** Only new projects qualify.
- **Counting land in the project cost.** It is excluded.
- **Putting too much into working capital.** The limits are 40% (manufacturing) and 60% (service or trading).
- **Failing the per-worker test** by buying costly machines with few workers.
- **Skipping the EDP.** No loan release without it.
- **Forgetting Udyam** before the physical verification.
- **Expecting the subsidy in cash.** It sits in a lock-in deposit for three years.
- **Inflating the cost.** Excess subsidy must be returned.
- **Opening a general grocery shop** under PMEGP. Pure trading is not allowed.` },

    { real: `Make a **PMEGP file** for the client with a tick sheet: eligibility, category and area, project report, working-capital percentage, per-worker figure, EDP date, Udyam, own-money receipt. Review the file against the sheet before the application is submitted, because a rejection for a missing paper costs weeks. Keep the SMS alerts and the portal registration number in the file.` },

    { remember: `- **Eligible:** age 18 or above, no income limit, **new** project, real **capital expenditure**, 8th pass if cost is above ₹10 lakh (manufacturing) or ₹5 lakh (service), one person per family, not on the **negative list**.
- **Land is not counted.** **Trading** is limited (₹20 lakh ceiling, 10% of the state allocation); **transport** at most 10%.
- **Udyam is mandatory** before verification and subsidy adjustment, not at application.
- **Bank finances 90% (general) or 95% (special)**; **working capital at most 40% (manufacturing) or 60% (service)**; up to ₹50 lakh project.
- **Per-worker fixed capital** at most **₹3 lakh** (plains) or **₹4.5 lakh** (hills, A&N, Lakshadweep).
- **Journey:** apply online → 5 days → score (50 or 60) → bank 30 days → EDP → own money in 30 days → loan and claim → **3-year lock-in** → verification and Udyam → adjustment.
- **Repay over 3 to 7 years** after the moratorium. **Excess subsidy is returned.**` },
  ],
  quiz: [
    { q: `Which of these projects is NOT eligible for PMEGP?`, o: [`An existing unit that has already taken a subsidy`, `A new masala unit with machinery`, `A new honey-processing unit with a retail counter`, `A new furniture unit with its own showroom`], a: 0, why: `PMEGP is only for new projects. Units that exist already, or that have taken a subsidy under another scheme, are not eligible.` },
    { q: `At what stage must a PMEGP unit be registered on Udyam?`, o: [`Before the application form is opened`, `Never`, `Only after three years`, `Before the physical verification and the adjustment of the subsidy`], a: 3, why: `It is not needed at the time of application, but it is compulsory before the unit is physically verified and the margin money is adjusted.` },
    { q: `What is the most working capital allowed in a ₹40 lakh manufacturing project?`, o: [`₹8 lakh`, `₹12 lakh`, `₹16 lakh`, `₹24 lakh`], a: 2, why: `For manufacturing, working capital can be at most 40% of the project cost: 40% of ₹40 lakh is ₹16 lakh.` },
    { q: `A project has fixed capital investment of ₹15 lakh and five full-time workers in the plains. Does it pass the employment test?`, o: [`Yes, ₹3 lakh per worker is within the limit`, `No, ₹3 lakh per worker is above the limit`, `Yes, because the limit is ₹5 lakh`, `It depends on working capital`], a: 0, why: `15 ÷ 5 = ₹3 lakh per worker, which equals the plains limit of ₹3 lakh, so it passes (it must not exceed it).` },
    { q: `How long does the PMEGP margin money stay locked in a deposit in the borrower's name?`, o: [`One year`, `Two years`, `Three years`, `Five years`], a: 2, why: `The subsidy is parked in a TDR or subsidy reserve fund for three years before it is adjusted against the loan.` },
    { q: `What must a borrower complete before the loan is released in a ₹8 lakh project?`, o: [`A one-year diploma`, `No training is needed`, `A 5-day EDP only`, `A 10-day EDP, unless already trained`], a: 3, why: `For projects above ₹5 lakh the EDP is 10 days (5 days for ₹2 to ₹5 lakh), unless the person has already done an equivalent programme.` },
  ],
};
