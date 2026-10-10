import { sk, flow2, bar } from '../_kit.js';

export default {
  title: `Raw material assistance (RMA) against a bank guarantee`,
  goal: `You can explain why small units pay too much for raw material, how NSIC's RMA scheme supplies it on credit against a bank guarantee, what the limits, charges and documents are, and how a Corporate Mitra can help a client use it.`,
  covers: [`The raw material problem`, `How RMA works`, `Limits, charges and interest`, `Application and documents`, `The professional opportunity`],
  terms: [
    [`RMA`, `Raw Material Assistance: a scheme under which NSIC buys core raw material in bulk and supplies it to MSMEs on credit.`],
    [`NSIC`, `National Small Industries Corporation: a Government of India enterprise under the Ministry of MSME that supports micro and small units.`],
    [`Bank guarantee (BG)`, `A promise by a bank to pay a named party up to a stated amount if the borrower fails to pay. It stands in for collateral.`],
    [`Core raw material`, `The main material a unit cannot do without, such as steel for an auto-component maker.`],
    [`Indigenous / imported`, `Indigenous raw material is bought in India. Imported raw material is brought in from abroad.`],
    [`Quantity discount`, `A lower price per unit because you buy a large quantity.`],
    [`Cash discount`, `A lower price because you pay quickly or in cash.`],
    [`Stockyard / railway siding`, `The producer's storage yard, or the railway track beside the plant, from where material is loaded.`],
    [`Conduit`, `A channel that things pass through. Here NSIC passes material and money between producer and unit.`],
    [`Conduct report`, `A bank's report on how a customer has run an account: cheques bounced, limits exceeded, delays.`],
    [`Credit report`, `A report of a person's or business's credit history and score from a credit bureau such as CIBIL.`],
    [`Wilful defaulter`, `A borrower who can pay but does not. The RBI publishes a list of them, and they cannot use the scheme.`],
  ],
  blocks: [
    `## The problem: small buyers pay the highest price
A small manufacturer has three disadvantages when it buys raw material:
- It buys in **small quantities**, and often only **after a customer confirms an order**, which means at the last minute.
- It buys from **local traders**, who add their margin.
- It cannot bargain: with small orders there is **no quantity discount and no cash discount**.

Large producers (a steel mill, a cement company) do not want to deal with tiny units directly, because the units' **finances are fragile** and one big order would carry a big risk. So the small unit pays more for the same material than a big buyer does, and its **costs stay high**.

## The idea: NSIC buys for everybody, and the bank guarantee covers the risk
**NSIC** pioneered **Raw Material Assistance (RMA) against bank guarantee**. It works like a **group purchase**:
1. Many MSMEs join the scheme. NSIC adds up their needs and buys **in bulk**, directly from the **producer**, so it gets both a **quantity discount** and a **cash discount** (NSIC pays the producer straight away).
2. NSIC then supplies the material to the MSME at the **same price** it paid, plus a **small service charge** (the lecture says about **0.25%**; check the current charge).
3. The MSME gets **credit of up to 180 days**. Because NSIC is taking the risk, it asks the unit to give a **bank guarantee** as its collateral.

The scheme is for **manufacturing and service MSMEs**. A service unit may need steel and cement too, for example when it builds its premises. **Traders are not eligible.** The scheme is first given for **one year** and can be **renewed**.

**Which materials?** Mainly metals (iron and steel, aluminium, zinc and a few others), coal, cement, bitumen, paraffin wax and similar. The full list is on NSIC's website. It covers both **indigenous** (Indian) and **imported** material, which matters when the quality of the part depends on the exact grade, and the Indian material does not suit.`,

    sk(300, 'Who pays whom in an RMA purchase', [
      { t: 'box', x: 10, y: 50, w: 170, h: 84, label: `Producer`, sub: `mill or factory`, fill: `blue` },
      { t: 'box', x: 295, y: 50, w: 170, h: 84, label: `NSIC`, sub: `the middleman`, fill: `yellow` },
      { t: 'box', x: 580, y: 50, w: 170, h: 84, label: `MSME unit`, sub: `the buyer`, fill: `green` },
      { t: 'arrow', x1: 184, y1: 78, x2: 291, y2: 78, label: `invoice` },
      { t: 'arrow', x1: 291, y1: 108, x2: 184, y2: 108, label: `pays now`, ly: 18 },
      { t: 'arrow', x1: 469, y1: 78, x2: 576, y2: 78, label: `material, bill` },
      { t: 'arrow', x1: 576, y1: 108, x2: 469, y2: 108, label: `pays in time`, ly: 18 },
      { t: 'box', x: 580, y: 206, w: 170, h: 58, label: `MSME's bank`, fill: `orange`, size: 16 },
      { t: 'arrow', x1: 580, y1: 236, x2: 384, y2: 140, color: `#c2410c` },
      { t: 'text', x: 470, y: 224, text: `bank guarantee to NSIC`, size: 14, color: `#c2410c` },
      { t: 'note', x: 10, y: 190, w: 280, h: 74, text: `When the unit has paid NSIC,\nthe bank guarantee is released.\nMaterial leaves the producer's\nstockyard or railway siding.`, fill: `yellow`, size: 14 },
    ]),

    `**The money trail, in words.** The producer invoices NSIC. NSIC pays the producer. NSIC then invoices the MSME. The MSME pays NSIC within the credit period. As soon as it has paid, **NSIC releases the bank guarantee**. The unit never gets cash from NSIC; it gets **material**. NSIC is only a **conduit** between producer and unit.

## Limits, charges and interest
- **Credit period:** up to **180 days**.
- **How much material against the guarantee:** NSIC supplies up to **95% of the bank guarantee value**. Example from the lecture: a guarantee of ₹50 lakh lets the unit take material worth up to **₹47.5 lakh**.
- **Maximum exposure** depends on the kind of unit.`,

    sk(190, 'The most RMA a unit can have, by kind of unit (₹ crore)', [
      { t: 'box', x: 10, y: 22, w: 600, h: 40, label: `Manufacturing unit: ₹10 crore`, fill: `blue`, size: 17 },
      { t: 'box', x: 10, y: 74, w: 360, h: 40, label: `Service unit: ₹6 crore`, fill: `green`, size: 17 },
      { t: 'box', x: 10, y: 126, w: 300, h: 40, label: `Infrastructure unit: ₹5 crore`, fill: `orange`, size: 17 },
    ]),

    `- **Interest on the credit:** based on the unit's **SME rating** and the repayment period. The lecture says it usually runs between **8.5% and 11.5%**. It changes, so check NSIC's website or branch for today's rate.
- **Service charge:** about **0.25%**, much lower than a wholesaler's or retailer's margin. Check the current figure.

**Why it can mean a lot of money.** Suppose an auto-component unit uses **1,000 tons** of steel a year. If NSIC's bulk price is just **₹1 per kg** lower, the saving is 1,000 tons × 1,000 kg × ₹1 = **₹10 lakh a year**, which goes straight into profit. (Assume, for illustration only, that the steel costs ₹60 a kg: 1,000 tons cost ₹6 crore, and the 0.25% service charge is about ₹1.5 lakh. The net gain is still about ₹8.5 lakh before interest on the credit.)

## How to apply
`,

    sk(262, 'From form to material', flow2([
      { label: `Get the form\n(it is free)`, fill: `blue` },
      { label: `Fill it, attach\nthe documents`, fill: `blue` },
      { label: `NSIC appraises\nand inspects`, fill: `yellow` },
      { label: `Limit set,\nagreement signed`, fill: `yellow` },
      { label: `Bank guarantee\nis submitted`, fill: `orange` },
      { label: `Material is\nsupplied`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `1. **Get the form** from the nearest **NSIC branch** or download it from the **NSIC website**. **It costs nothing**: never pay anyone for the form.
2. **Fill it and attach the documents**, then submit it to the nearest NSIC office. (The form changes from time to time, so check the current version.)
3. NSIC does a **preliminary appraisal** and **inspects the unit**, to make sure the unit is real and is a manufacturer or service unit, not a trader.
4. NSIC **sanctions a limit** (up to ₹10 crore for manufacturing, ₹6 crore for service), and the unit and NSIC **sign an agreement**.
5. The unit's bank issues a **bank guarantee in favour of NSIC**. **Disbursement happens only after the guarantee is submitted**, and it is in the form of **material** of the quantity and quality the unit asks for.

**What the form asks:** the enterprise's name and the **assistance wanted each year** (year on year, within the limit); type of entity and year of starting; office and factory addresses; **Udyam number** (compulsory), **PAN** and **GST number** (NSIC will invoice the unit, so it needs GST); **ITR acknowledgement numbers for the last three assessment years**; bank accounts and branches; the **location** (aspirational districts and hilly areas get concessions); the **category of the owner** (some categories get extra benefits); names of **sister or group concerns**, to see how much benefit they have already taken; key details of all owners, partners, directors and promoters; the **line of activity** and products; the **core raw material needed each year**; financial help already taken and RMA taken by group entities; **details of the proposed bank guarantee** (the bank, its address and the amount); number of **employees**; and an **undertaking** that everything stated is true.

**Documents:**
- Owners' **PAN and Aadhaar**, **residence proof** and a **utility bill not more than two months old**.
- **Udyam certificate** and **GST registration** (self-attested copies).
- A **statement of personal assets and liabilities** of the proprietor, directors or partners, self-attested. For an individual who has no balance sheet, this takes its place.
- For a company, a certified **board resolution**. For a firm, a **power of attorney**. **Specimen signatures** of the authorised signatory, **attested by the bank**.
- **Sanction letters** of credit limits already given by banks.
- **Audited financial statements** of the last year, and **provisional statements** for the current year, certified by a chartered accountant.
- **Bank statements for the last six months.** They show the unit's banking habits. Dishonoured cheques show bad habits, and steady balances and no bounced cheques show good ones.
- The **latest electricity bill** (not more than two months old), because the address may have changed.
- **Conduct reports** from every bank where the unit has an account.
- **Credit reports** (the CIBIL score for an individual, the rank for a business) of the entity and each owner.
- A **certificate and undertaking** that neither the entity nor its owners are on the RBI's **wilful defaulters** list.
- **Copies of customer orders in hand**, which show the unit really needs the material. These are needed only when the limit is **above ₹5 crore**.

Without the documents NSIC's approval may not come, so do the homework before suggesting the scheme.

## Worked example: a unit asks for ₹5 crore of steel a year
Kavya's cousin runs a **sheet-metal press unit** (a manufacturer, not a trader) with a Udyam certificate, GST registration and six months of clean bank statements. He wants steel worth ₹5 crore a year.

| Step | What happens |
|---|---|
| Limit | Within ₹10 crore for a manufacturer. Because ₹5 crore is not above ₹5 crore, copies of customer orders are not required |
| Guarantee | To receive ₹5 crore of material, he needs a bank guarantee of about ₹5.26 crore (₹5 crore ÷ 0.95) |
| First lot | A ₹50 lakh guarantee gives material worth up to ₹47.5 lakh |
| Cost | The material at NSIC's bulk price, plus about 0.25%, plus interest on the credit used |
| End | He pays NSIC within the credit period (at most 180 days), and the guarantee is released |

## The professional opportunity
Awareness of this scheme among MSMEs is **very low**. Units in the **auto industry, durable consumer goods and metal packaging** use these materials every day. A Corporate Mitra can:
- **Identify** such MSMEs in the city and explain the scheme.
- **Connect** them to the nearest NSIC office, and build their **confidence** that NSIC is a fair dealer, because owners often doubt that such a scheme exists.
- **Advise** on the size of limit, **fill in the form**, collect the annexures, **talk to the banker about the bank guarantee**, **be present at the inspection** and **go with the owner when the guarantee is handed over**.

**Golden tips.** Visit NSIC's website often and find the branch nearest to you. The scheme is for one year first and can be renewed. The credit limit is at most 180 days. Traders are not eligible. NSIC pays the suppliers directly.

**Emerging trends.** Some **business member organisations** now buy collectively for their members. Some **OEMs** (large manufacturers) tie up with big producers and pass the discounted material to their vendors. Smart owners have learned to **negotiate cash discounts**. **B2B portals** make price trends visible. And some producers (the lecture names Jindal Steel) run a **separate window for MSME clusters**.`,

    { analogy: `RMA is a **bulk purchasing and credit pool**, like a cloud **reserved-capacity discount**: one buyer commits for a large volume and gets the volume price, and the smaller teams draw on it. The **bank guarantee** is the **deposit or credit line** that makes the pool safe. And the **invoice chain** (producer to NSIC to unit) is a **proxy**: the unit never pays the producer directly, so NSIC takes the producer's risk and the guarantee takes NSIC's.` },

    { warn: `Easy mistakes:
- **Paying an agent for the form.** It is free.
- **Applying as a trader.** Only manufacturing and service MSMEs qualify.
- **Forgetting that the supply is material, not cash.**
- **Quoting the rate or the charge as fixed.** 8.5% to 11.5% and 0.25% are the lecture's figures: check NSIC.
- **Skipping the bank statements and CIBIL checks** before applying. A bounced cheque or a poor score can sink the application.
- **Asking for more than the guarantee supports.** Material is up to 95% of the guarantee value.
- **Missing a name on the group-entity list.** NSIC wants to know about sister concerns' benefits.
- **Using a lapsed Udyam or GST registration.** Both are compulsory.` },

    { real: `Run a short **awareness session** for metal-working or packaging units in your area, then offer a **one-page readiness check**: Udyam, GST, last three ITR acknowledgements, six months of bank statements, CIBIL score, electricity bill, bank guarantee arrangement. Clients who pass the check go to NSIC with a ready file. Those who fail know exactly what to fix first.` },

    { remember: `- **RMA** (NSIC): bulk purchase of **core raw material** from producers, supplied to MSMEs on **credit of up to 180 days** against a **bank guarantee**.
- Material is up to **95% of the guarantee value**. **Service charge about 0.25%**; **interest about 8.5% to 11.5%** (check).
- **Limits:** manufacturing ₹10 crore, service ₹6 crore, infrastructure ₹5 crore. Manufacturing and service MSMEs only, **no traders**. First **one year**, renewable.
- **Flow:** producer invoices NSIC → NSIC pays → NSIC invoices the unit → unit pays → **guarantee released**.
- **Steps:** free form → documents → appraisal and inspection → limit and agreement → bank guarantee → material.
- **Documents:** Udyam, GST, PAN and Aadhaar, ITR acknowledgements (3 years), audited statements, bank statements (6 months), conduct and credit reports, no-defaulter certificate, orders in hand (above ₹5 crore).
- **Your role:** awareness, readiness check, bank guarantee, inspection support.` },
  ],
  quiz: [
    { q: `Which organisation pioneered the RMA against bank guarantee scheme?`, o: [`NSIC`, `RBI`, `SIDBI`, `NIMSME`], a: 0, why: `The National Small Industries Corporation (NSIC) pioneered the scheme: it buys the raw material and supplies it to MSMEs.` },
    { q: `What does the MSME receive under RMA?`, o: [`Cash`, `A subsidy cheque`, `A share in the producer`, `Raw material, on credit`], a: 3, why: `Disbursement is in the form of raw material of the quantity and quality asked for, not money.` },
    { q: `A unit gives a bank guarantee of ₹50 lakh. Up to what value of material can NSIC supply?`, o: [`₹25 lakh`, `₹50 lakh`, `₹47.5 lakh`, `₹60 lakh`], a: 2, why: `NSIC supplies material up to 95% of the guarantee value: 95% of ₹50 lakh is ₹47.5 lakh.` },
    { q: `What is the maximum credit period under the scheme?`, o: [`180 days`, `30 days`, `1 year`, `5 years`], a: 0, why: `NSIC provides short-term credit of up to 180 days. The scheme period itself is first one year, renewable.` },
    { q: `Which of these is NOT eligible for RMA?`, o: [`A manufacturing MSME`, `A service MSME that builds its premises`, `A trading firm that buys and resells steel`, `A unit that imports its raw material`], a: 2, why: `Traders are not eligible. Manufacturing and service MSMEs are, and both indigenous and imported material are covered.` },
    { q: `Copies of orders in hand are required only when the limit is...`, o: [`Above ₹5 crore`, `Above ₹1 crore`, `Above ₹10 lakh`, `Always`], a: 0, why: `Orders in hand, which show the unit needs the material, are required only for limits above ₹5 crore.` },
  ],
};
