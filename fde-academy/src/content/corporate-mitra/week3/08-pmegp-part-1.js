import { sk, flow, bar } from '../_kit.js';

export default {
  title: `PMEGP, part 1: what it is, who runs it and how the subsidy is worked out`,
  goal: `You can explain what PMEGP is and how it differs from Mudra, say who runs it and how the subsidy reaches the borrower, and calculate own contribution, subsidy and bank loan for any project cost, category and area.`,
  covers: [`Background and objective`, `Who runs the scheme`, `Margin money subsidy and linkage funds`, `Subsidy rates and project-cost caps`, `Four worked cases`],
  terms: [
    [`PMEGP`, `Prime Minister's Employment Generation Programme: a credit-linked subsidy scheme for setting up new micro enterprises in the non-farm sector.`],
    [`Credit-linked subsidy`, `A subsidy that is paid only when the project is also financed by a bank loan.`],
    [`Margin money subsidy`, `The government's share of the project cost, paid as a grant and never repaid. Also called the project subsidy.`],
    [`Central sector scheme`, `A scheme fully funded and run by the central government, here through the Ministry of MSME.`],
    [`KVIC`, `Khadi and Village Industries Commission: a statutory body under the Ministry of MSME. It is the single national agency for PMEGP.`],
    [`Nodal bank`, `The bank that receives the subsidy from KVIC and passes it to the lending branches.`],
    [`Beneficiary contribution`, `The borrower's own money in the project, a percentage of the project cost.`],
    [`Special category`, `Groups the scheme treats more generously: SC, ST, OBC, minorities, women, ex-servicemen, transgender and differently abled persons, and units in aspirational districts, hill and border areas and the North East.`],
    [`Project cost`, `The total money needed to set the unit up: machinery, raw material, building work and so on.`],
    [`Backward and forward linkage funds`, `A share of the scheme's budget for the support system around the entrepreneur: awareness, training, fairs, monitoring.`],
    [`Geo-tagging`, `Marking a unit's exact location on a map with a photo, to prove that it exists.`],
    [`Udyami Mitra`, `A helper empanelled under a government scheme to assist new entrepreneurs with their project and loan application.`],
  ],
  blocks: [
    `## Background
**PMEGP** began in **August 2008** as a **credit-linked subsidy programme**. It **merged two older schemes** that ended on 31 March 2008, the **Prime Minister's Rozgar Yojana** and the **Rural Employment Generation Programme**, both meant to create jobs through **micro enterprises in the non-farm sector**. The merged scheme has been approved for the 15th Finance Commission period, **2021-22 to 2025-26**, and is still running (check for the next cycle).

**Objective.** Create **employment** by setting up **new self-employment ventures and micro enterprises**, in **rural and urban** areas. The lecture lists the aims: bring together widely spread **traditional artisans and unemployed youth**, give them **work in their own place** (reducing migration from villages to cities), provide **continuous, sustainable employment**, and raise the **earning capacity** of artisans.

## How it differs from Mudra
| | Mudra (lessons 6 and 7) | PMEGP |
|---|---|---|
| What it gives | A **loan** with no collateral | A **loan plus a subsidy** that is never repaid |
| For whom | Existing or new non-corporate, non-farm units | **New projects** (new micro enterprises) |
| Size | Up to ₹20 lakh | Project cost up to ₹50 lakh (manufacturing) or ₹20 lakh (service or business) is eligible for subsidy |
| Run by | Banks and MUDRA | KVIC and the Ministry of MSME, through banks |

## Who runs it
PMEGP is a **central sector scheme**: funded and administered by the **Ministry of MSME**. It is **implemented by KVIC** (a statutory body under the Ministry) as the **single nodal agency at national level**. At state level it works through:
- the **state offices of KVIC** and the **State Khadi and Village Industries Boards**,
- the **District Industries Centres (DICs)**,
- the **Coir Board** for coir activities, and
- **banks**.

The government may bring in other agencies. To find beneficiaries and viable projects, give **entrepreneurship training** and **mentor** the new owners, the scheme works with **NSIC**, **state governments**, **self-help groups**, **Udyami Mitras**, **rural self-employment training institutes** and **Panchayati Raj institutions**.

## How the subsidy reaches the borrower
KVIC does not hand cash to anyone. The subsidy travels by **electronic bank transfer** through three hops.`,

    sk(200, 'The subsidy route: KVIC to the borrower, through two banks', flow([
      { label: `KVIC`, sub: `pays the subsidy`, fill: `yellow` },
      { label: `Nodal bank`, sub: `receives it`, fill: `blue` },
      { label: `Financing branch`, sub: `the lending bank`, fill: `blue` },
      { label: `Borrower`, sub: `bank account`, fill: `green` },
    ], { y: 44, h: 84, gap: 44, max: 17 })),

    `## Two kinds of assistance
**1. Margin money subsidy.** Two kinds: for **new units**, and for the **upgrade of existing units** (a "second loan" for PMEGP and Mudra units, taken up in the next lesson). The money is allotted every year in the Union Budget; the upgrade share is carved out of the same allocation.

**2. Backward and forward linkage funds.** A unit needs support before it starts and while it runs, not only money. So **5%** of the scheme's budget allocation (or as the competent authority approves) is set aside for this **ecosystem**. It pays for:
- **awareness camps**, so that prospective entrepreneurs hear of the scheme;
- **review meetings** at state and district level, **workshops and seminars**, and **bankers' meetings** to improve coordination;
- **exhibitions and trade fairs**, and publicity;
- **training programmes (EDPs)** for entrepreneur and managerial skills;
- **physical verification and geo-tagging** of units, to prove they exist and work;
- **evaluation studies** of the scheme's impact, **entrepreneurship facilitation centres** (guidance, mentoring, hand-holding), **centres of excellence**, **field experts** and **data-entry operators**, **IT systems**, **awards**, a **call centre** for queries and grievances, and **project management units**.

## The subsidy in numbers
The **project subsidy** is a part of the **project cost** that the government pays and the entrepreneur **does not repay**. The borrower must put in **some of his own money**, which "creates a devotion" to the project. Whatever is left after **own money and subsidy** is financed by the **bank as a loan**.

**The caps.** The subsidy is worked out on the project cost **up to a ceiling**: **₹50 lakh for manufacturing** and **₹20 lakh for business or service**. If the project costs more, the **extra can still be financed by the bank, but without subsidy**. (An earlier lecture in this week quoted ₹25 lakh and ₹10 lakh: those are the older ceilings.)

**The rates.** They depend on the **category** of the beneficiary and the **area** of the unit.`,

    sk(300, 'Own contribution and subsidy rates', [
      { t: 'table', x: 75, y: 44, cols: [`Category`, `Area`, `Own money`, `Subsidy`], colW: [170, 130, 150, 150], rowH: 36, title: `PMEGP rates (share of the project cost)`,
        rows: [
          [`General`, `Urban`, `10%`, `15%`],
          [`General`, `Rural`, `10%`, `25%`],
          [`Special category`, `Urban`, `5%`, `25%`],
          [`Special category`, `Rural`, `5%`, `35%`],
        ] },
      { t: 'note', x: 75, y: 250, w: 600, h: 36, text: `Own money counts on the actual cost. The subsidy counts on the cost up to the cap.`, fill: `yellow`, size: 15 },
    ]),

    `**The three-line rule.**
1. **Own contribution** = own % × the **actual** project cost.
2. **Subsidy** = subsidy % × the **lower** of the actual cost and the cap (₹50 lakh or ₹20 lakh).
3. **Bank loan** = project cost − own contribution − subsidy.`,

    sk(200, 'Splitting a ₹40 lakh project (figures in ₹ lakh): own money, subsidy and bank loan', [
      ...bar([
        { v: 4, top: `Own 4`, label: `own money`, fill: `yellow` },
        { v: 6, top: `Subsidy 6`, label: `never repaid`, fill: `green` },
        { v: 30, top: `Bank loan: 30`, label: `repaid with interest`, fill: `blue` },
      ], { x: 20, y: 26, w: 720, h: 52 }),
      { t: 'note', x: 80, y: 124, w: 600, h: 52, text: `Manufacturing, project cost ₹40 lakh, general category, urban area:\nown 10% = 4 lakh, subsidy 15% = 6 lakh, bank loan = 40 - 4 - 6 = 30 lakh`, fill: `yellow`, size: 15 },
    ]),

    `## Four worked cases (₹ lakh)
| | Sector, cost | Category and area | Own money | Subsidy | Bank loan |
|---|---|---|---|---|---|
| **1** | Manufacturing, 40 | General, urban | 10% of 40 = **4** | 15% of 40 = **6** | 40 − 4 − 6 = **30** |
| **2** | Manufacturing, 70 | Special, urban | 5% of 70 = **3.5** | 25% of 50 (cap) = **12.5** | 70 − 3.5 − 12.5 = **54** |
| **3** | Service, 15 | General, rural | 10% of 15 = **1.5** | 25% of 15 = **3.75** | 15 − 1.5 − 3.75 = **9.75** |
| **4** | Service, 30 | Special, urban | 5% of 30 = **1.5** | 25% of 20 (cap) = **5** | 30 − 1.5 − 5 = **23.5** |

- **Case 2:** the cost (70) is above the cap (50), so the subsidy is worked out on 50 only. Of the bank loan of 54, **20 lakh is the part above the cap, financed without subsidy**. (The lecture says "special category, rural" but uses 25%; special-category **rural** would earn 35%: 35% of 50 = 17.5 lakh, and the bank loan would be 70 − 3.5 − 17.5 = **49**.)
- **Case 4:** the cost (30) is above the cap (20). Of the bank loan of 23.5, **10 lakh is above the cap**, with no subsidy.
- **The lecture's rural woman:** she sets up a ₹10 lakh manufacturing unit. The lecture works the example at 15% (₹1.5 lakh) for her. But a woman is a **special-category** beneficiary, and a rural one gets **35%**. So: own 5% = ₹0.5 lakh, subsidy 35% = ₹3.5 lakh, **bank loan = 10 − 0.5 − 3.5 = ₹6 lakh**. Always apply the rate for the category and the area.`,

    { analogy: `PMEGP is a **matching grant with a cost-share formula**. The project is the cloud bill. The borrower must put in a fixed share, the government **credits a fixed percentage** (up to a **quota cap**), and a bank finances the rest. The **rates** are a **tier table** keyed by (customer type, region). **Geo-tagging** is the **verification step**: an audit that the resource really exists before the credit is applied.` },

    { warn: `Easy mistakes:
- **Treating the subsidy as a loan.** It is not repaid. The loan is the bank part.
- **Calculating the subsidy on the whole cost** when it is above the cap.
- **Computing own contribution on the cap** instead of the actual cost.
- **Using the wrong rate:** check both the category (general or special) and the area (urban or rural).
- **Applying for an existing unit.** PMEGP is for new projects (the next lesson explains the upgrade route).
- **Using old ceilings** (₹25 lakh, ₹10 lakh) when the current ones are ₹50 lakh and ₹20 lakh. Check the current guidelines.
- **Telling a client the bank will approve.** The bank still appraises the project.` },

    { real: `Put the three-line rule on a small card and calculate for the client before they ask: "Your project is ₹14 lakh, you are a woman in a rural area, so you put in ₹70,000, the government gives ₹4.9 lakh, and you borrow ₹8.4 lakh." When a client sees the exact rupees, PMEGP stops being a vague idea and becomes a plan. Always confirm the rates on KVIC's current guidelines.` },

    { remember: `- **PMEGP** (August 2008): credit-linked **subsidy** for **new** non-farm micro enterprises; created by merging **PMRY** and **REGP**; continued for 2021-22 to 2025-26.
- **Central sector scheme**, run by **Ministry of MSME**, implemented by **KVIC**, with state boards, **DICs**, Coir Board and banks.
- **Subsidy path:** KVIC → nodal bank → financing branch → borrower's account.
- **Assistance:** margin money subsidy (new units, upgrade of existing units) and **backward and forward linkage funds** (5% of the allocation).
- **Caps on the subsidy:** project cost **₹50 lakh (manufacturing)**, **₹20 lakh (service or business)**.
- **Rates:** general urban 10% own, 15% subsidy; general rural 10% / 25%; special urban 5% / 25%; special rural 5% / 35%.
- **Rule:** own % × actual cost; subsidy % × min(cost, cap); bank loan = the rest.` },
  ],
  quiz: [
    { q: `Which agency is the single national implementing agency for PMEGP?`, o: [`NSIC`, `SIDBI`, `KVIC`, `MUDRA`], a: 2, why: `KVIC (Khadi and Village Industries Commission) implements PMEGP as the single nodal agency at national level.` },
    { q: `A general-category borrower in a rural area sets up a ₹20 lakh manufacturing unit. What is the subsidy?`, o: [`₹3 lakh`, `₹4 lakh`, `₹5 lakh`, `₹7 lakh`], a: 2, why: `General rural subsidy is 25%. The cost is below the ₹50 lakh cap, so 25% of 20 lakh = ₹5 lakh.` },
    { q: `A special-category borrower in a rural area has a ₹10 lakh manufacturing project. What is the bank loan?`, o: [`₹6 lakh`, `₹7.5 lakh`, `₹8.5 lakh`, `₹9 lakh`], a: 0, why: `Own 5% = 0.5 lakh and subsidy 35% = 3.5 lakh, so the bank loan is 10 − 0.5 − 3.5 = ₹6 lakh.` },
    { q: `A service project costs ₹30 lakh. On what amount is the subsidy calculated?`, o: [`₹30 lakh`, `₹25 lakh`, `₹20 lakh, the cap`, `₹10 lakh`], a: 2, why: `For business or service projects the subsidy applies only up to ₹20 lakh; the rest is financed by the bank without subsidy.` },
    { q: `What share of the PMEGP budget is set aside for backward and forward linkage funds?`, o: [`1%`, `5%`, `25%`, `50%`], a: 1, why: `About 5% of the allocation (or as approved) is earmarked for awareness, training, verification and other ecosystem support.` },
    { q: `Which of these is a feature of PMEGP, not of Mudra?`, o: [`Collateral-free loan`, `A subsidy that is not repaid`, `Loans through banks`, `For non-farm units`], a: 1, why: `PMEGP gives a margin money subsidy that need not be repaid. Mudra gives only loans.` },
  ],
};
