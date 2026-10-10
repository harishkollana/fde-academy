import { sk, flow2, bar } from '../_kit.js';

export default {
  title: `Cheaper export credit: from the Interest Equalisation Scheme to Niryat Protsahan`,
  goal: `You can explain interest subvention, trace how the export interest scheme changed from 2015 to the Export Promotion Mission, say who is eligible and what conditions apply to a loan, describe how a claim travels from bank to RBI to DGFT, and wrap up the six schemes of this chapter.`,
  covers: [`Why export credit needs support`, `The old scheme, 2015 to 2024`, `Niryat Protsahan and Niryat Disha`, `Eligibility and conditions`, `Roles and the claim route`],
  terms: [
    [`Interest subvention`, `The government pays part of the interest on a loan, so the borrower's real rate is lower. The same idea as "interest equalisation".`],
    [`Pre-shipment credit`, `A loan taken before the goods are shipped, to buy raw material and make the goods for an export order.`],
    [`Post-shipment credit`, `A loan taken after shipment, to bridge the time until the foreign buyer pays.`],
    [`DGFT`, `Directorate General of Foreign Trade: the government body that runs foreign trade policy and issues the notices for this scheme.`],
    [`IEC`, `Import Export Code: the number every exporter or importer must have.`],
    [`UIN`, `Unique Identification Number: a number the exporter gets on the DGFT portal for a loan it wants subvention on (the course gives the fee as ₹200).`],
    [`Merchant exporter`, `A trader who buys goods and exports them without making them.`],
    [`Deemed export`, `A supply of goods within India that the law treats like an export (for example to an export unit). The new scheme leaves it out.`],
    [`Tariff line`, `A product category in the customs code. The old scheme listed which ones were covered.`],
    [`Export Promotion Mission`, `The government's six-year mission (2025-26 to 2030-31) that brings export support into one frame.`],
    [`Niryat Protsahan`, `The financial part of the mission: interest subvention and other finance help. "Niryat" means export and "protsahan" means encouragement.`],
    [`Niryat Disha`, `The non-financial part: guidance, testing, branding, trade fairs, logistics. "Disha" means direction.`],
  ],
  blocks: [
    `## Why export credit needs help
A small exporter has to **spend before it earns**. It needs money to buy material and make the goods, and then **waits for the foreign buyer to pay**. The lecture says the wait can be **60 to 180 days**. During all that time interest runs.

The problem is the interest rate. The lecture says Indian banks charge **9% to 11%** on export credit while global rates are **3% to 5%**, and some competing countries (it names China and Bangladesh) give their exporters heavily **subsidised credit**. **MSMEs** suffer most: they are small, have little collateral and no credit history. So India's answer was an **interest subvention**: the government **pays part of the interest** so the exporter's real cost is lower. The lecture's example: the bank charges **12%**, the government bears **5%**, and the exporter effectively pays **7%**.`,

    sk(206, 'Interest subvention: the government pays a slice of the interest (the lecture\'s example)', [
      ...bar([
        { v: 7, top: `Exporter pays 7%`, label: `the real cost to the exporter`, fill: `green` },
        { v: 5, top: `Government 5%`, label: `the subvention`, fill: `yellow` },
      ], { x: 20, y: 24, w: 720, h: 52 }),
      { t: 'note', x: 100, y: 128, w: 560, h: 44, text: `Bank interest on export credit = 12%. No cash is handed over: the government\nreimburses the bank for its share, so the loan simply becomes cheaper.`, fill: `yellow`, size: 14 },
    ]),

    `## The old scheme: Interest Equalisation Scheme (2015 to 2024)
The **Interest Equalisation Scheme** began in **April 2015**, under the foreign trade policy. It gave a flat **3%** on rupee pre- and post-shipment export credit, for about **416 listed tariff lines**, to MSME manufacturers; the lecture notes MSME manufacturer exporters could claim for all product codes. It was revised several times.`,

    sk(262, 'Export interest support through the years (as in the course)', flow2([
      { label: `April 2015`, sub: `3%, MSME makers`, fill: `blue` },
      { label: `Nov 2018`, sub: `MSME makers: 5%`, fill: `green` },
      { label: `Jan 2019`, sub: `merchants added, 3%`, fill: `blue` },
      { label: `Oct 2021`, sub: `MSME 3%, others 2%`, fill: `yellow` },
      { label: `July to Dec 2024`, sub: `MSMEs only; winds down`, fill: `orange` },
      { label: `2 Jan 2026`, sub: `Niryat Protsahan`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `- **November 2018:** raised to **5%** for **MSME manufacturer exporters**.
- **January 2019:** **merchant exporters** (pure traders) were brought in at **3%**.
- **October 2021:** revised to **3% for MSMEs** and **2% for non-MSME manufacturers and merchant exporters**, on about **410 tariff lines**.
- **2024:** extended to **30 June 2024**, then only **MSMEs** until **December 2024**. The total outlay was about **₹9,538 crore**, with a further ₹2,500 crore added in 2024.
- **2025:** a gap while a new scheme was planned.
- **From 2 January 2026:** the new scheme took over.

**How the old scheme ran.** An exporter applied on the **DGFT portal** for a **Unique Identification Number (UIN)** for the loan (mandatory from 1 April 2022; fee ₹200; valid one year; Aadhaar e-sign or a digital signature). The **bank** verified it and lent at the reduced rate. The bank sent **monthly, IEC-wise claims** to the **RBI**, which checked and forwarded them to the **DGFT**, which released money to the RBI for the banks. Conditions: an **active IEC**, a **Udyam registration for MSMEs**, goods made with **significant processing in India** (rules of origin), and credit in **Indian rupees only**.

## The new scheme: Export Promotion Mission
The government has gathered export support into one **Export Promotion Mission**, for **six years (2025-26 to 2030-31)**, with an outlay of **₹25,060 crore**. The lecture explains why: earlier schemes were **fragmented**, covered **limited products**, caused **delays in claims** and did not fit India's wider export goals. The mission has two parts.

**Niryat Protsahan (the financial part).** Interest subvention on pre- and post-shipment export credit, **export factoring**, **credit cards for e-commerce exporters**, **collateral support** for export credit, and **extra credit for new or high-risk markets** with support from **Exim Bank**. It is run through **DGFT trade notices of 2 and 16 January 2026**, within RBI's rules.

**Niryat Disha (the non-financial part).** Guidance on **export quality, compliance, testing and certification** (so the goods meet the importing country's standards), **international branding and packaging** help, **trade fairs and buyer-seller meets**, **warehousing and logistics** support, **inland transport reimbursement** for exporters in remote districts, and **trade intelligence and capacity building**.

## Who gets the interest support
- **MSME exporters only.** The old split into manufacturer and merchant is gone.
- An **active IEC** and a **Udyam registration** are mandatory.
- The **credit must be sanctioned on or after 2 January 2026** and be in **rupees**, for **pre- or post-shipment export finance**, as per RBI's directions.
- **Only the interest element** is supported: no processing or other fees.
- **No benefit for deemed exports.**
- **No benefit if the account becomes an NPA** before the export cycle is complete.
- **Rates are notified from time to time** and apply only to **new sanctions**. There is an **annual ceiling per IEC** (the full ceiling for 2025-26, not pro rata). If the exporter borrows from several banks, **the exporter** must keep the total within the ceiling, and any excess claim is **recoverable**.
- **Graduation buffer:** an exporter that outgrows the MSME limits stays eligible for **three more years**.`,

    sk(310, 'The old and the new interest support compared', [
      { t: 'table', x: 90, y: 44, cols: [``, `Old scheme (IES)`, `Niryat Protsahan`], colW: [150, 200, 230], rowH: 36, title: `What changed`,
        rows: [
          [`Who`, `MSMEs, then others`, `MSME exporters only`],
          [`Products`, `listed tariff lines`, `all products`],
          [`Deemed exports`, `covered in phases`, `excluded`],
          [`NPA account`, `rules unclear`, `no benefit`],
          [`Funds to banks`, `advance float`, `monthly reimbursement`],
          [`Claims`, `portal`, `100% digital`],
        ] },
    ]),

    `## The money trail
1. The **exporter** has an active IEC, a Udyam registration and (as the course describes it) a **UIN** from the DGFT portal. The **bank** verifies and lends at its **own commercial rate**, as RBI permits, and **passes on the subvention**. The government bears only the **actual interest cost** borne by the exporter.
2. The bank files **monthly claims online, IEC-wise and bank-wise, within 15 days of month-end**. **No manual submission**; a **DSC and e-sign** are mandatory.
3. The **RBI** consolidates, verifies and forwards. The **DGFT** releases the funds. The bank is **reimbursed only after verification**: banks no longer get an advance float.
4. The **DGFT** issues the notices, sets the product list, rates and ceilings and runs the portals. The **RBI** is the operational backbone and monitors NPAs. **Banks** are the front line. The **exporter** keeps its documents in order and watches its own ceiling.

## Worked example: Kavya exports masala blends
Kavya's unit is an MSME with an IEC and Udyam registration. She takes **₹20 lakh of pre-shipment credit for six months** at **12%** on a shipment to Dubai.

| Item | Figure |
|---|---|
| Interest at 12% for six months | ₹20 lakh × 12% × 6/12 = **₹1.2 lakh** |
| If the government bears 5 points (the lecture's illustration, not the notified rate) | ₹20 lakh × 5% × 6/12 = **₹0.5 lakh** |
| What Kavya really pays | **₹0.7 lakh** |

Her checklist: **IEC** active, **Udyam** done, credit **sanctioned after 2 January 2026**, in **rupees**, for a **real export** (not a deemed one), account **not an NPA**, and total claims across banks **within the annual ceiling**. She should also look at **Niryat Disha** for help with the importing country's quality tests and packaging.

## Wrap-up of the six schemes of Chapter 3
| Scheme | In one line |
|---|---|
| **Mudra** | Collateral-free loans to non-corporate, non-farm units in four bands |
| **PMEGP** | A subsidy plus a bank loan for **new** micro enterprises that create jobs |
| **Second loan** | A fresh subsidy for a **successful** PMEGP, REGP or Mudra unit that upgrades (up to ₹1 crore of manufacturing project cost; the recap's "100 crore" is a slip) |
| **Lean (LMCS)** | Ten units share a consultant; government pays most of the first-year fee |
| **CGTMSE** | A guarantee to the lender, so micro and small units can borrow without collateral |
| **Niryat Protsahan** | Cheaper rupee export credit for MSME exporters, plus non-financial export help |`,

    sk(260, 'Six schemes, six jobs', [
      ...[
        [`Mudra`, `loan, no collateral`, `blue`],
        [`PMEGP`, `subsidy + loan, new units`, `green`],
        [`Second loan`, `upgrade a good unit`, `yellow`],
        [`Lean`, `cut waste, 80% funded`, `orange`],
        [`CGTMSE`, `guarantee to the bank`, `purple`],
        [`Niryat Protsahan`, `cheaper export credit`, `pink`],
      ].map(([a, b, f], i) => ({ t: 'box', x: 10 + (i % 3) * 250, y: 20 + Math.floor(i / 3) * 100, w: 230, h: 70, label: a, sub: b, fill: f, size: 18 })),
      { t: 'text', x: 380, y: 232, text: `Always check the live scheme page before quoting a rate or a limit`, size: 15, color: `#c2410c` },
    ]),

    { analogy: `Interest subvention is a **price subsidy on API calls**: the provider charges the bank's rate but a **voucher pays the first slice**, so your effective cost is lower. The **UIN** is a **token** that identifies each subsidised loan. The claim route is **clearing and settlement**: the bank files the transaction, the RBI **reconciles**, the DGFT **funds**, and the bank is **paid only after reconciliation**, not in advance. The **annual ceiling per IEC across all banks** is a **rate limit applied to your account**, and you are responsible for staying under it.` },

    { warn: `Easy mistakes:
- **Quoting the old 3% as the current rate.** Rates are now notified from time to time and apply to new sanctions only.
- **Forgetting the dates.** The new scheme covers credit sanctioned on or after 2 January 2026.
- **Counting deemed exports.** They are excluded.
- **Expecting a benefit on an NPA account.** There is none.
- **Borrowing from several banks without tracking the ceiling.** The exporter is responsible for the total.
- **Telling a pure trader he qualifies as a "merchant exporter".** The new scheme speaks of MSME exporters; check the notice.
- **Forgetting the rules of origin and rupee-only credit.**
- **Treating the figures here as final.** The course teaches a scheme that is newly notified; the DGFT notices are the authority.` },

    { real: `Ask any manufacturing client "do you export, or could you?" If yes, check four things: IEC, Udyam, the bank's role, and the interest saving in rupees. Show the client the example of ₹20 lakh and ₹0.5 lakh of interest saved, and mention the non-financial help (testing, packaging, trade fairs). Keep the DGFT trade notices in a folder, since they decide the rates and the ceiling.` },

    { remember: `- **Interest subvention** = the government bears part of the interest on export credit. It is paid to the bank, so the loan is cheaper.
- **Old IES:** 2015 to 2024 (3%, raised to 5% for MSME makers in 2018, merchants in 2019, 3% and 2% from 2021, ended 2024). **UIN**, monthly claims, RBI, DGFT.
- **New: Export Promotion Mission** (2025-26 to 2030-31, outlay ₹25,060 crore): **Niryat Protsahan** (financial) and **Niryat Disha** (non-financial). Notices of 2 and 16 January 2026.
- **Eligible:** **MSME exporters**, active **IEC**, **Udyam**, **rupee** pre- or post-shipment credit sanctioned on or after **2 January 2026**; only the **interest element**.
- **Not eligible:** deemed exports; NPA accounts. **Annual ceiling per IEC** (exporter's duty across banks). **3-year graduation buffer.**
- **Claims:** online, within 15 days of month-end; reimbursement after verification, no advance float.
- **Chapter 3 schemes:** Mudra, PMEGP, second loan, Lean, CGTMSE, Niryat Protsahan.` },
  ],
  quiz: [
    { q: `What does "interest subvention" mean?`, o: [`The bank waives the loan`, `The government pays part of the interest on the borrower's loan`, `The borrower pays double interest`, `The exporter gets a tax refund`], a: 1, why: `Under interest subvention the government bears a part of the interest cost, usually by reimbursing the lender, so the loan is cheaper for the borrower.` },
    { q: `Under Niryat Protsahan, who is eligible for the interest support?`, o: [`Any exporter`, `Merchant exporters only`, `MSME exporters with an active IEC and Udyam registration`, `Importers`], a: 2, why: `The scheme is for MSME exporters. An active Import Export Code and a Udyam registration are mandatory.` },
    { q: `Which of these is NOT supported?`, o: [`A deemed export`, `Rupee post-shipment credit`, `Rupee pre-shipment credit`, `The interest cost on a genuine export loan`], a: 0, why: `Deemed exports are explicitly excluded. Only genuine export credit in rupees, and only the interest element, is supported.` },
    { q: `How do banks get the subvention money under the new scheme?`, o: [`In advance from the RBI`, `From the GST portal`, `From the exporter`, `By monthly reimbursement after verified claims`], a: 3, why: `Banks no longer get an advance float. They file monthly claims online and are reimbursed after the RBI verifies them.` },
    { q: `Which part of the Export Promotion Mission covers testing, packaging help, trade fairs and logistics?`, o: [`Niryat Protsahan`, `Niryat Disha`, `The Udyam portal`, `CGTMSE`], a: 1, why: `Niryat Disha is the non-financial arm: guidance, quality and compliance testing, branding, trade fairs, logistics and trade intelligence.` },
    { q: `An exporter takes loans from three banks. Who must make sure the total claim stays within the annual ceiling?`, o: [`The RBI`, `Each bank separately`, `The DGFT`, `The exporter`], a: 3, why: `The exporter is responsible for the aggregate ceiling across all banks, and any excess claim is recoverable.` },
  ],
};
