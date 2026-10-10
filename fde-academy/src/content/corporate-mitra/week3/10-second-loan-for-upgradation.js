import { sk, hub } from '../_kit.js';

export default {
  title: `The second loan: upgrading a successful PMEGP, REGP or Mudra unit`,
  goal: `You can explain who may apply for the second loan, work out the subsidy and bank loan for an upgrade, follow the scoring and approval steps, and describe the follow-up, workshops and exhibitions that a PMEGP unit receives.`,
  covers: [`What the second loan is for`, `Rates and ceilings`, `Eligibility`, `The application and its safeguards`, `Follow-up, workshops and exhibitions`],
  terms: [
    [`Second loan`, `A later loan, with a fresh subsidy, for a unit that has already used its first PMEGP, REGP or Mudra support and now wants to expand or modernise.`],
    [`Upgradation`, `Expanding capacity or modernising technology so that the unit earns more and employs more.`],
    [`REGP`, `Rural Employment Generation Programme: one of the two older schemes merged into PMEGP in 2008.`],
    [`Self-assessed score`, `The score the PMEGP portal works out from the applicant's own entries, such as education, training, project viability, category, location and job potential.`],
    [`Nodal officer`, `The official of the implementing agency who is the applicant's point of contact and helps correct the application.`],
    [`Preliminary scrutiny`, `The first check of an application for completeness and correctness, before it goes to a bank.`],
    [`Hand-holding`, `Help given to the applicant to fix problems, instead of rejecting at once.`],
    [`Gestation period`, `The gap between sanctioning a loan and actually releasing it, while the borrower does what the bank requires.`],
    [`MIS portal`, `The management information system on which every unit visit is recorded.`],
    [`Third-party verification`, `A check carried out by an outside agency that KVIC hires, to confirm that units exist and work.`],
    [`Gram Expo, Gram Utsav, Gram Mela`, `Names for exhibitions of rural PMEGP units. The word "Gram" means village.`],
    [`Sick unit`, `A unit in financial trouble that may be helped to recover under RBI guidelines.`],
  ],
  blocks: [
    `## Why a second loan?
A first PMEGP or Mudra loan starts a unit. If the unit does well, it soon needs **more machines, a bigger shed or better technology**. But the first subsidy is a **one-time** benefit: it is not given again when the bank simply raises the credit limit, when the owner buys more machines two years later, or when the unit modernises on a fresh bank loan. The remedy is a **separate scheme: the second loan for upgradation of existing PMEGP, REGP and Mudra units**, which can carry **a fresh subsidy**.

The same agencies run it as the first PMEGP: **KVIC** nationally, and the state KVIC offices, **Khadi and Village Industries Boards**, **DICs** and the **Coir Board** in the states.

## What it gives
- **Own contribution:** **10%** of the project cost (the lecture's recap says "5% or 10% depending on the case").
- **Subsidy:** **15%** in general areas and **20%** in the **North-Eastern and hill regions**, not repaid.
- **Ceilings for the subsidy:** project cost up to **₹1 crore in manufacturing** and **₹25 lakh in service or business**.
- The **balance** (cost minus own money minus subsidy) is financed by the **bank**.
- If the project costs more than the ceiling (₹1 crore or ₹25 lakh), the **bank may finance the extra at its discretion, but no subsidy** applies to it.
- The maximum subsidy is therefore **₹15 lakh** (general) or **₹20 lakh** (NE and hills) for manufacturing, and **₹3.75 lakh** or **₹5 lakh** for service.`,

    sk(310, 'The first loan and the second loan side by side', [
      { t: 'table', x: 70, y: 44, cols: [``, `First loan (new unit)`, `Second loan (upgrade)`], colW: [150, 230, 240], rowH: 36, title: `Same agencies, bigger projects, a smaller subsidy rate`,
        rows: [
          [`Who`, `a new unit`, `a successful existing unit`],
          [`Own money`, `5% or 10%`, `10%`],
          [`Subsidy`, `15% to 35%`, `15% (20% NE, hills)`],
          [`Cap, manufacturing`, `₹50 lakh`, `₹1 crore`],
          [`Cap, service`, `₹20 lakh`, `₹25 lakh`],
          [`EDP training`, `needed`, `not needed`],
        ] },
    ]),

    `## Who can apply
- A unit that has taken a **first benefit under PMEGP, REGP or Mudra** (all categories of beneficiaries). Check the current guidelines for exactly which Mudra bands qualify.
- It has **repaid the first loan on time**. The subsidy of the first loan must have been **adjusted after the three-year lock-in** and the unit verified.
- It is **profitable, with good and growing turnover**, and has potential for more growth. "Unless and until it is profit-making and has good turnover, there is no point in granting the second loan."
- It plans **real modernisation**: technology upgrade or capital investment, linked to **more turnover, more profit and more jobs**.
- **Only one project** per subsidy: no **joint financing** by two lenders.

## The application
**1. Online only.** KVIC has built the **PMEGP portal**. **Handwritten or paper applications are not accepted.** It keeps the process transparent, trackable and fast.

**2. Two forms.** A **new unit** gives its business idea, project report, planned investment, planned jobs, new machinery and loan need. An **existing unit** gives its **current investment and turnover**, the jobs already created, the expansion planned and the **additional loan** needed. The portal has a separate form for each, and the **applicant chooses "upgradation of an existing unit"**.

**3. Login and documents.** The portal sends a **user ID and password** to the registered mobile number, and an **application ID** on final submission. **Aadhaar verification and Udyam registration are mandatory.** Documents are uploaded; those already on the portal need not be uploaded again, but the papers that show the first loan was a **success** must be.

**4. The score.** On final submission the portal gives a **self-assessed score** from the education, training, viability, category, location and job potential entered. An **acknowledgement** can be downloaded and printed. The application goes electronically to the implementing agency.`,

    sk(262, 'The score decides whether an application goes to the bank', [
      { t: 'box', x: 60, y: 54, w: 320, h: 40, label: `below 50: rejected`, fill: `red`, size: 16 },
      { t: 'box', x: 380, y: 54, w: 64, h: 40, label: ``, fill: `yellow` },
      { t: 'box', x: 444, y: 54, w: 256, h: 40, label: `60 or more: goes to bank`, fill: `green`, size: 16 },
      { t: 'text', x: 60, y: 112, text: `0`, size: 14 }, { t: 'text', x: 380, y: 112, text: `50`, size: 14 },
      { t: 'text', x: 444, y: 112, text: `60`, size: 14 }, { t: 'text', x: 700, y: 112, text: `100`, size: 14 },
      { t: 'text', x: 412, y: 28, text: `50 to 59: passes only for projects up to ₹10 lakh`, size: 14, color: `#b45309` },
      { t: 'arrow', x1: 412, y1: 160, x2: 412, y2: 98 },
      { t: 'text', x: 400, y: 174, text: `Tailoring unit, score 55, project up to ₹10 lakh: forwarded`, size: 14, anchor: `end` },
      { t: 'arrow', x1: 431, y1: 214, x2: 431, y2: 98, color: `#e03131` },
      { t: 'text', x: 444, y: 226, text: `Food unit, score 58, project above\n₹10 lakh: not forwarded`, size: 14, anchor: `start`, color: `#c2410c` },
    ]),

    `**5. The nodal officer.** Within **five working days** the agency's nodal officer calls or meets the applicant. The application is checked for completeness and correctness. If a paper or detail is missing, the officer **helps to correct it**: there is **no outright rejection**. Then the agency checks that the **activity is not on the negative list**.

**6. Scoring and forwarding.** The pass marks are as in the first loan: **50 out of 100 for projects up to ₹10 lakh and 60 for larger ones**. A tailoring unit with 55 passes; a food-processing unit with 58 and a project above ₹10 lakh does not. A complete application is forwarded to the **bank the applicant chose within three weeks**. An application that remains incomplete despite the hand-holding is **rejected, with the reason recorded and communicated**. A blank rejection is not allowed.

**7. Safeguards.** There is an **online grievance portal** and a **grievance cell at KVIC headquarters**, and complaints are to be acted on within **48 hours**. KVIC can instruct the state officers, and the applicant has a **right of appeal**.

**8. The bank decides on its own.** A high score is **not** a loan. The bank judges **technical and economic viability** and follows its own and RBI's rules on collateral. It must **sanction or reject within 30 days**; if it delays, the applicant files a complaint. A sanction is not a **disbursement**: there is a gestation period. The **own contribution** must be deposited before the loan is paid out. (The first-loan EDP linkage is **not** needed for upgrades.)

**9. The subsidy claim.** Once the **first instalment** is released and the **own contribution** is in, the bank sends the claim. KVIC validates it within **three working days** and forwards it to the nodal bank, or returns it with the defects, which the nodal officer helps fix. As with the first loan, the subsidy is **locked in for three years**, the unit is **verified**, and then the subsidy is adjusted.

## Four worked cases (₹ lakh)
Take Kavya's masala unit from the last lesson. She has repaid her first loan, her subsidy has been adjusted, and sales have grown.

| Case | Project | Area | Own 10% | Subsidy | Bank loan |
|---|---|---|---|---|---|
| **A** manufacturing | 60 | General | 6 | 15% of 60 = **9** | 60 − 6 − 9 = **45** |
| **B** manufacturing, above the cap | 120 | General | 12 | 15% of 100 (cap) = **15** | 120 − 12 − 15 = **93**, of which 20 above the cap has no subsidy and is the bank's choice |
| **C** manufacturing | 100 | NE or hills | 10 | 20% of 100 = **20** | 100 − 10 − 20 = **70** |
| **D** service | 30 | General | 3 | 15% of 25 (cap) = **3.75** | 30 − 3 − 3.75 = **23.25** |

**What the second loan will not do:** bank limits raised later, extra machines bought later, or modernisation on a fresh loan **do not earn a subsidy**. Only a proper second-loan application does.`,

    sk(382, 'What a PMEGP unit gets after the loan', hub(
      { label: `PMEGP\nunit`, fill: `yellow` },
      [
        { label: `Visits`, sub: `every 3 months, on MIS`, fill: `blue` },
        { label: `Verification`, sub: `100% checked, geo-tagged`, fill: `green` },
        { label: `Workshops`, sub: `twice a year per state`, fill: `orange` },
        { label: `Exhibitions`, sub: `district, state, zonal`, fill: `purple` },
        { label: `Bankers' review`, sub: `quarterly, state and zonal`, fill: `pink` },
        { label: `Rescue`, sub: `help for sick units`, fill: `teal` },
      ],
      { cx: 380, cy: 192, rx: 280, ry: 130, r: 54, bw: 190, bh: 58 },
    )),

    `## The support that continues after the loan
KVIC does not walk away after giving the subsidy. It **tracks** the unit:
- **Visits.** Implementing-agency officials visit every PMEGP unit **at least once every three months**, and the visit is recorded on the **MIS portal**.
- **Physical verification** covers **100% of units**, with **geo-tagging**. KVIC hires **third-party agencies** for it, while banks and DICs help and KVIC monitors and reports to the Ministry.
- **Workshops.** State-level workshops are held **twice a year** to make units aware of government schemes, to build data banks and to collect feedback. KVIC takes prior approval of the Ministry for the number of workshops. Marketing and export support is also offered.
- **Exhibitions.** To promote the units' products, KVIC holds exhibitions at **district, state and zonal level** (one a year at each level), plus special ones for the **North-East**. Rural units' fairs carry the names **Gram Expo, Gram Utsav and Gram Mela**. Exhibitors meet **wholesalers and institutional buyers**, build their brand, hear what customers want and may get orders and partnership offers. KVIC also picks units for **international exhibitions** (the lecture's example: wooden handicrafts, chosen for quality and sales record).
- **Bankers' review** meetings every quarter at state and zonal levels check how much has been financed, and the **Ministry reviews PMEGP every quarter**.
- **Rescue.** A **sick unit** can seek rehabilitation under RBI guidelines.

## How the second loan fits the whole Mudra and PMEGP picture
Mudra's first loan is small (micro credit up to ₹1 lakh, then refinance up to ₹20 lakh). Moving from Tarun to Tarun Plus is itself a kind of "second loan". PMEGP's first loan is capped at ₹50 lakh (manufacturing) and ₹20 lakh (service) with a subsidy. The **second loan** is for a unit that has **proved itself**: it asks for **capital investment or technology upgrade that creates jobs**. The Nodal Agency's approval is never a permission by itself; the bank must still approve the loan.`,

    { analogy: `The second loan is a **promotion to a higher tier after a clean track record**: your uptime and payment history unlock a bigger quota and a smaller discount rate. The **self-assessed score** is an **automated pre-screening check** that triages applications before a human sees them. The **nodal officer** is **developer support**: they fix your pull request before closing it. And **geo-tagged verification every three months** is **monitoring with an on-call visit**: the credit is real only if the service stays up.` },

    { warn: `Easy mistakes:
- **Expecting a subsidy when the bank just raises the limit.** Only the second-loan route gives a subsidy.
- **Applying before the first loan is repaid and the first subsidy adjusted.**
- **Uploading the first-loan success papers late.** The application stalls.
- **Thinking a good score guarantees the loan.** The bank decides separately.
- **Using the old ceilings.** The upgrade cap is ₹1 crore (manufacturing) and ₹25 lakh (service).
- **Forgetting Aadhaar and Udyam.** Both are mandatory.
- **Ignoring the visits and workshops.** They are part of the scheme, and a unit that cannot be found cannot get its subsidy adjusted.` },

    { real: `Keep a diary of your PMEGP clients' dates: loan release, lock-in end, verification visits, workshop dates. Remind each client about quarterly visits, keep their books updated, and start planning the second loan as soon as the first is repaid. A client who arrives at the nodal officer with a clean repayment record, rising sales and a plan for new machines is easy to approve.` },

    { remember: `- **Second loan** = fresh subsidy for a **successful** PMEGP, REGP or Mudra unit that wants to **expand or modernise**. A bank raising the limit or buying machines later gives **no** subsidy.
- **Own 10%**; **subsidy 15%** (**20%** in NE and hills); caps **₹1 crore (manufacturing)** and **₹25 lakh (service)**; extra over the cap, bank's choice, **no subsidy**.
- **Conditions:** first loan repaid on time, profitable, growing turnover, real **technology or capital upgrade** that adds jobs; one subsidy per project; no joint financing.
- **Process:** online only; separate form; **Aadhaar and Udyam**; self-assessed score (**50**, or **60** above ₹10 lakh); nodal officer helps within **5 working days**; forward to bank within **3 weeks**; bank decides in **30 days**; grievance in **48 hours**; own money, then loan, then claim, **3-day** validation, **3-year lock-in**.
- **After the loan:** quarterly visits, **100% verification and geo-tagging**, workshops twice a year, **Gram Expo**-type exhibitions, quarterly reviews, help for sick units.` },
  ],
  quiz: [
    { q: `A unit's bank raises its credit limit from ₹5 lakh to ₹10 lakh. Does it get a fresh PMEGP subsidy?`, o: [`Yes, automatically`, `No, only the second-loan route gives a subsidy`, `Yes, if it applies within a year`, `Only in the North-East`], a: 1, why: `The first subsidy is one-time. Extra limits, later machinery or modernisation on a fresh bank loan do not earn one; a proper second-loan application does.` },
    { q: `What is the subsidy rate for a second loan in a general (not NE or hilly) area?`, o: [`10%`, `15%`, `25%`, `35%`], a: 1, why: `The second loan gives 15% in general areas and 20% in the North-Eastern and hilly regions.` },
    { q: `What is the maximum project cost on which subsidy is given for an upgrade of a manufacturing unit?`, o: [`₹25 lakh`, `₹50 lakh`, `₹1 crore`, `₹5 crore`], a: 2, why: `For upgradation the manufacturing ceiling is ₹1 crore (₹25 lakh for service or business).` },
    { q: `A tailoring unit applying for a project up to ₹10 lakh scores 55. What happens?`, o: [`It is rejected`, `It passes the score and is forwarded to a bank`, `It gets the loan at once`, `It must resubmit`], a: 1, why: `For projects up to ₹10 lakh the minimum score is 50, so 55 passes. The bank still takes its own decision.` },
    { q: `How often must implementing-agency officials visit a PMEGP unit?`, o: [`At least once every three months`, `Once a year`, `Only once at the start`, `Every month`], a: 0, why: `Every PMEGP unit is to be visited at least once every three months and the details are recorded on the MIS portal.` },
    { q: `Which is a condition for the second loan?`, o: [`The unit has no Aadhaar`, `The unit has stopped trading`, `The first loan is still unpaid`, `The first loan is repaid on time and the unit is profitable`], a: 3, why: `The unit must have shown credit-worthiness by timely repayment and good, profitable performance, and plan a real upgrade.` },
  ],
};
