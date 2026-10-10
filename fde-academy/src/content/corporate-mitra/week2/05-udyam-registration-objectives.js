import { sk, hub, bar } from '../_kit.js';

export default {
  title: `Udyam registration: what it is and what it is for`,
  goal: `You can explain what Udyam registration is, what the certificate and number give a business, and list the eight reasons the government wants every MSME registered.`,
  covers: [`What "Udyam" means`, `The number and the certificate`, `How many are registered`, `Eight objectives`, `Late-payment protection`],
  terms: [
    [`Udyam`, `The government's own name for an MSME in its register. The word means enterprise or venture.`],
    [`Udyam Registration Number (URN)`, `The permanent ID given to a registered enterprise.`],
    [`Udyam certificate`, `An online certificate with a QR code, issued free after registration.`],
    [`QR code`, `A square barcode. Scanning it opens the enterprise's page on the government portal.`],
    [`DIC`, `District Industries Centre: the district office of the state government that helps small units. It also runs a help desk for Udyam.`],
    [`Priority sector lending`, `An RBI rule that banks must lend a set share of their money to certain sectors, MSMEs among them.`],
    [`Collateral`, `Something valuable (land, a building) that a borrower pledges to the bank as security for a loan.`],
    [`CGTMSE`, `The credit guarantee scheme for micro and small enterprises. The government guarantees part of the loan, so the borrower needs no collateral. Week 3 covers it.`],
    [`Public procurement`, `Government departments and public companies buying goods and services.`],
    [`GeM`, `Government e-Marketplace: the government's online shop for buying from suppliers.`],
    [`EMD`, `Earnest money deposit: money a bidder puts down to take part in a tender. Registered MSMEs can be exempt.`],
    [`Facilitation Council`, `A body set up under the MSME Act to settle payment disputes between small suppliers and their buyers.`],
  ],
  blocks: [
    `## Why a special name?
The government could have called this "MSME registration". It chose **Udyam registration**, and an enterprise that is registered is called a **Udyam**. The lecture gives the reason: the aim is to **tap talent and creativity** in people who have few resources and few chances to show what they can do, and to give them a **gateway** to cheap finance, to markets and to exports. A distinct name tells everyone: *this is a recognised small enterprise, and it deserves support.*

Registration is **PAN-based**, **online**, **free** and based on a **self-declaration** for a new unit. The next lessons walk through eligibility, documents and the form. This lesson answers a simpler question: **why bother?**

## What the business actually gets
- **A permanent number**, the Udyam Registration Number. The number is like a permanent identity card. It is **16 characters** long and looks like **UDYAM, then a two-letter state code, a two-digit district code and a seven-digit serial number** (an invented example is UDYAM-DL-01-0001234). The lecture compares it to an Aadhaar for a business.
- **An online certificate with a QR code.** The QR code opens the portal page with the enterprise's details, so the certificate is itself an ID card. Nothing is posted: it is issued online.
- **No renewal, no fee.** Once registered, the number is permanent. The classification is **updated automatically** from the tax data. (When the rules changed in 2020, old registrations had to move to Udyam; with the 2025 ceilings no one had to re-register, because the test itself did not change.)
- **Help.** A **single-window help desk** works at the **DICs**, and the government runs a facilitation system for registration. Anyone who wants to register can start at the official Udyam portal.`,

    sk(250, 'What an Udyam certificate carries (the number shown is an invented example)', [
      { t: 'line', x1: 30, y1: 16, x2: 390, y2: 16 }, { t: 'line', x1: 390, y1: 16, x2: 390, y2: 224 },
      { t: 'line', x1: 390, y1: 224, x2: 30, y2: 224 }, { t: 'line', x1: 30, y1: 224, x2: 30, y2: 16 },
      { t: 'text', x: 210, y: 44, text: `UDYAM REGISTRATION CERTIFICATE`, size: 15, bold: true },
      { t: 'text', x: 52, y: 88, text: `ABC Furniture Works`, size: 17, anchor: `start`, bold: true },
      { t: 'text', x: 52, y: 124, text: `UDYAM-DL-01-0001234`, size: 14, anchor: `start`, font: `mono` },
      { t: 'text', x: 52, y: 160, text: `Micro  |  Manufacturing`, size: 15, anchor: `start` },
      { t: 'box', x: 300, y: 138, w: 70, h: 70, label: `QR`, fill: `grey`, size: 18 },
      { t: 'arrow', x1: 394, y1: 36, x2: 446, y2: 36 }, { t: 'note', x: 450, y: 16, w: 290, h: 40, text: `Permanent number: no renewal`, fill: `green`, size: 14 },
      { t: 'arrow', x1: 394, y1: 88, x2: 446, y2: 88 }, { t: 'note', x: 450, y: 68, w: 290, h: 40, text: `QR code opens the portal page`, fill: `blue`, size: 14 },
      { t: 'arrow', x1: 394, y1: 140, x2: 446, y2: 140 }, { t: 'note', x: 450, y: 120, w: 290, h: 40, text: `Size band updated from ITR and GST`, fill: `yellow`, size: 14 },
      { t: 'arrow', x1: 394, y1: 192, x2: 446, y2: 192 }, { t: 'note', x: 450, y: 172, w: 290, h: 40, text: `Free, online, issued as an e-certificate`, fill: `orange`, size: 14 },
    ]),

    `## How many are registered?
The Udyam fact sheet shown in the lecture, **dated 26 May 2026**, reads like this (the figures change every day, so open the live portal for today's):

| Size | Registered enterprises (approx.) |
|---|---|
| All together (Udyam and Udyam Assist) | **8.49 crore** |
| Micro | about **8.42 crore** |
| Small | about **5.4 lakh** |
| Medium | about **41,000** |

Look at the pattern. **Almost every registered unit is micro**, because small owners are the ones who need scheme benefits most. Small units number in lakhs, and medium ones in thousands. This matches Week 1, where micro was 98.6% of the sector. The government wants the number to rise further, because many units are working on the ground without knowing why registering helps. That is exactly the gap a Corporate Mitra fills.

## The eight objectives
The lecture lists a long set of aims. Group them and you get eight.`,

    sk(398, 'One register, eight benefits', hub(
      { label: `Udyam\nregistration`, fill: `yellow` },
      [
        { label: `Recognition`, sub: `official size band`, fill: `blue` },
        { label: `Scheme access`, sub: `PMEGP, subsidies`, fill: `green` },
        { label: `Bank loans`, sub: `priority loans, CGTMSE`, fill: `orange` },
        { label: `Payment cover`, sub: `45-day rule`, fill: `pink` },
        { label: `Govt buying`, sub: `tenders, GeM`, fill: `purple` },
        { label: `Ease of business`, sub: `online, paperless`, fill: `teal` },
        { label: `Jobs and growth`, sub: `rural, backward areas`, fill: `yellow` },
        { label: `Data for policy`, sub: `one central register`, fill: `grey` },
      ],
      { cx: 380, cy: 198, rx: 290, ry: 140, r: 56, bw: 170, bh: 58 },
    )),

    `**1. Formal recognition.** The unit is officially a micro, small or medium enterprise under the MSME Act, and it appears in the ministry's records. Banks, government offices, suppliers and customers can look it up and trust it, so it gains **credibility**.

**2. Access to schemes.** Registered MSMEs can use the **credit guarantee scheme** (the government stands guarantor for the loan), **technology-upgrade schemes**, **PMEGP**, **interest subsidies** and **procurement benefits**. Week 3 teaches the main ones. Registration is the **gateway**: without the number you cannot apply.

**3. Easier bank loans.** MSMEs fall under the RBI's **priority sector lending** norms, so banks are encouraged to lend to them. A registered micro or small unit can seek **collateral-free loans** under CGTMSE, which matters because a tiny unit often has nothing to pledge. The loans may be for **working capital** or for **fixed assets**. The certificate also saves paperwork at the bank.

**4. Protection against late payment.** See the section below.

**5. Government buying.** Public-sector buyers can place orders with registered MSMEs. Some **tenders are reserved** for them, they can be **exempt from earnest money**, and they can sell on **GeM**. Look up the current share of purchases set aside for MSMEs (the policy has a percentage target) before quoting a figure.

**6. Ease of doing business.** The process is **online, paperless and linked to PAN and GST**. No certificates are uploaded. For a unit that has filed returns, the portal pulls the data itself. A baker can finish the form from home with an **Aadhaar OTP**.

**7. Jobs, entrepreneurship and rural growth.** A woman who makes papads and pays other village women to help her, or a potter, or a stitcher with one machine, is turned from an informal worker into a recognised business. MSMEs are the second-largest employer after agriculture, about 30% of GDP and about 45% of exports (Week 1).

**8. Data for policy.** If the government does not know how many MSMEs exist, in which sector and state, it cannot design schemes or divide its budget. A central, digital register gives it that picture, and because the data is linked to **ITR and GSTIN**, it is hard to manipulate.

> **Which job figure?** The lecture quotes the jobs figure three ways: the portal's own count (37.55 crore people at registered units, on 26 May 2026, which the speech wrongly calls "crore rupees"), an older survey figure of 11 to 12 crore, and Week 1 gave 24.4 crore from the Ministry's annual report. They differ because the **source and the date differ**. When you quote a number to a client, name the source and the date.`,

    `## Late-payment protection, in detail
This one deserves a closer look because it is a real, practical right. A small supplier has little cash. It must pay raw material suppliers and wages, so it needs its sale money quickly. The **MSME Act** says:

1. The buyer must pay **within the time agreed, and in any case within 45 days**.
2. If the buyer pays late, it owes **compound interest** on the unpaid amount. (As the Act reads, the rate is three times the RBI bank rate, with monthly compounding. Check the current rule.)
3. A buyer **cannot claim that interest as an expense** for income tax, so late payment does not become a tax saving.
4. Disputes go to a **Facilitation Council**, which handles conciliation and arbitration. Being registered makes it easy to use.

One correction: the lecture says this applies to all MSMEs. The payment chapter of the Act protects **micro and small suppliers**, not medium ones, so check the current text.`,

    sk(206, 'The 45-day rule: pay on time or the interest starts running', [
      ...bar([
        { v: 45, top: `Pay within 45 days (or sooner if agreed)`, fill: `green` },
        { v: 25, top: `Late: interest runs`, fill: `red` },
      ], { x: 20, y: 24, w: 720, h: 50, below: false }),
      { t: 'text', x: 20, y: 98, text: `day 0: goods accepted`, size: 14, anchor: `start`, color: `#4a5568` },
      { t: 'text', x: 483, y: 98, text: `day 45`, size: 14, color: `#4a5568` },
      { t: 'note', x: 20, y: 134, w: 290, h: 44, text: `Disputes go to the\nFacilitation Council`, fill: `blue`, size: 14 },
      { t: 'note', x: 330, y: 134, w: 410, h: 44, text: `Buyer owes compound interest (monthly) and cannot\nclaim that interest as an expense for tax`, fill: `yellow`, size: 14 },
    ]),

    { analogy: `An Udyam number is a **permanent, verified account in a national registry**, like a developer ID that is created once and then **syncs itself from other systems** (the tax and GST databases), so the owner never maintains it by hand. Having the ID unlocks **tiers of service**: loans, schemes, tenders. The government gets a **single source of truth** (master data) about the whole sector. The 45-day rule is an **SLA with an automatic penalty**: miss the deadline and the late fee accrues without anyone having to ask.` },

    `## Worked example: Meena's tailoring unit, before and after
Meena runs a micro tailoring unit with three machines and a few helpers (sales about ₹8 lakh a year). She wants a loan for two more machines and wants to sell uniforms to a government school.

| | Without Udyam | With Udyam |
|---|---|---|
| Loan | The bank sees an informal shop and asks for collateral she does not have | The certificate shows a recognised micro unit. She can apply for priority-sector credit and, through the bank, ask for a **guaranteed, collateral-free loan** |
| School uniform order | She cannot bid as a recognised MSME | She can register as a supplier on **GeM** and bid for MSME-reserved tenders |
| A buyer pays after 90 days | She can only keep asking | The buyer owes **compound interest**, and she can go to the **Facilitation Council** |
| Schemes | She does not know they exist | She is eligible and you can show her which ones |

The registration itself cost her **nothing** and took one afternoon.`,

    { warn: `Easy mistakes:
- **Believing the website that asks for a fee.** The official Udyam registration is **free**. Lookalike sites charge money for something that costs nothing. Use only the government portal, udyamregistration.gov.in.
- **Promising a loan.** Registration opens the door. The bank still decides.
- **Saying "renewal every year".** There is none. But the unit must keep filing its ITR and GST returns, because the portal reads them.
- **Quoting the number of registrations or jobs without a date and a source.**
- **Telling a medium enterprise that the 45-day rule protects it.** Check the current text of the Act.` },

    { real: `When a client shrugs at registration ("I run the shop fine without it"), do not recite the law. Show them the table above and ask which row they want: the loan, the government order, the late payer. Then say that registration is free and takes an afternoon. Most owners say yes at the loan row.` },

    { remember: `- **Udyam** = the government's name for a registered MSME. Registration is **PAN-based, online, paperless and free**.
- You get a **permanent Udyam number** and an **online certificate with a QR code**. **No renewal.**
- Over **8.4 crore** registered (26 May 2026, check the live figure); nearly all are **micro**.
- **Eight objectives:** recognition, scheme access, bank loans, late-payment protection, government buying, ease of doing business, jobs and rural growth, data for policy.
- **Late payment:** pay within the agreed time and at most **45 days**; otherwise **compound interest**, not tax-deductible for the buyer; disputes go to the **Facilitation Council** (micro and small suppliers).` },
  ],
  quiz: [
    { q: `What does an enterprise registered on the portal get?`, o: [`A certificate that must be renewed every year`, `A licence to export`, `A guaranteed loan`, `A permanent Udyam Registration Number`], a: 3, why: `The Udyam number is permanent and there is no renewal. A loan is never guaranteed by registration alone.` },
    { q: `What does the QR code on the Udyam certificate do?`, o: [`Pays the registration fee`, `Opens the enterprise's page on the portal`, `Replaces the PAN`, `Records GST returns`], a: 1, why: `Scanning the QR code opens the portal page with the enterprise's details, so the certificate works as an ID card.` },
    { q: `What is the registration fee on the official Udyam portal?`, o: [`No fee`, `₹1,000`, `₹500`, `Depends on the size`], a: 0, why: `Registration is free. Sites that charge a fee are not the official portal.` },
    { q: `What is the maximum time a buyer should take to pay a small supplier under the MSME Act?`, o: [`15 days`, `One year`, `90 days`, `45 days (or the agreed shorter time)`], a: 3, why: `Payment is due within the agreed time and in any case within 45 days; after that interest is owed.` },
    { q: `Which scheme gives collateral-free loans to micro and small enterprises?`, o: [`CGTMSE`, `GeM`, `EMD`, `DIC`], a: 0, why: `CGTMSE is the credit guarantee scheme: the government guarantees part of the loan, so the borrower needs no collateral.` },
    { q: `Why does the government want a central digital register of MSMEs?`, o: [`To charge a yearly fee`, `To restrict their exports`, `To design schemes and divide the budget with real data`, `To replace the GST portal`], a: 2, why: `Without reliable data on how many MSMEs exist and where, it cannot target schemes or allot its budget well.` },
  ],
};
