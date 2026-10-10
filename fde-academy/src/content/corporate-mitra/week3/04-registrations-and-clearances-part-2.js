import { sk, flow, flow2 } from '../_kit.js';

export default {
  title: `Registrations and clearances, part 2: GST, licences, labour, sector rules and quality marks`,
  goal: `You can walk a client through GST registration and e-PAN, name the municipal, pollution, fire, factory, labour and sector licences a unit may need, and say which quality certificates exist and why a unit takes them.`,
  covers: [`GST registration step by step`, `PAN`, `Municipal, pollution and fire`, `Factory and labour`, `Sector rules and quality marks`],
  terms: [
    [`TRN`, `Temporary Reference Number: the number given after Part A of the GST form. You log in with it to complete Part B.`],
    [`ARN`, `Application Reference Number: the number given once the GST application is submitted. It lets you track the application.`],
    [`EVC`, `Electronic Verification Code: an OTP-style code that lets a proprietor sign an online form without a digital signature.`],
    [`e-PAN`, `An electronic PAN issued instantly on the income tax portal against an Aadhaar OTP. For individuals.`],
    [`Trade licence`, `A permit from the local municipal body to carry on a business in a locality.`],
    [`Consent to establish / operate`, `Two permissions from the State Pollution Control Board: one before building the unit, one before starting production.`],
    [`Red category`, `The most polluting group of industries (such as electroplating and some chemicals), which gets the strictest checks.`],
    [`Fire NOC`, `A fire no-objection certificate: proof from the state fire service that the premises meet fire-safety rules.`],
    [`Factory licence`, `Permission to run a factory, needed when the premises and the number of workers cross the limits in the law.`],
    [`Deemed approval`, `Permission that is treated as granted automatically if the authority does not answer within the time limit.`],
    [`FSSAI`, `Food Safety and Standards Authority of India: registers and licenses anyone who makes or sells food.`],
    [`ISO 9001 and others`, `International standards that a certification body audits you against. They signal to buyers that you follow a recognised system.`],
  ],
  blocks: [
    `## What is left after the entity
The last lesson registered the **business entity**. The lecture now takes up **everything the unit needs to start work lawfully**. Remember that the **Udyam registration** is free, online, needs only the Aadhaar and PAN, and is "not mandatory but very necessary" to claim any benefit. After that come the **tax registrations**, then the **licences**.

## 1. GST registration
**GST** is the tax on supply of goods or services. A **registered** business can claim **input tax credit** (the GST it paid on purchases) against the GST it charges.

**Who must register?**
- If aggregate yearly turnover is above **₹40 lakh (goods)** or **₹20 lakh (services)**. In some **special category states** (the course names the North East, Himachal Pradesh and Ladakh) the limits are **₹20 lakh and ₹10 lakh**. Check your state.
- **Whatever the turnover:** anyone making **inter-state supplies of goods**, selling through an **e-commerce operator** (and the operators themselves), anyone who pays tax under the **reverse charge** method, a **casual taxable person**, a **non-resident taxable person** and an **input service distributor**.
- **Who need not:** a **farmer** selling his own agricultural produce, and anyone who supplies only **fully exempt** goods or services.

**Documents to keep ready:** **Aadhaar** (for authentication), **PAN** of the business or proprietor, **address proof** of the principal place of business (for owned premises a conveyance deed or municipal khata copy, for rented premises a registered or notarised rent agreement with the **owner's NOC and KYC**, or an electricity bill), **bank details** (can follow a little later), and **proof of the constitution**: the partnership deed, the LLP certificate and agreement, or the company's certificate with MOA and AOA, plus a list of directors or partners with their KYC. A **DSC** is needed for LLPs and companies. **Proprietors** can sign with an **EVC**.`,

    sk(262, 'GST registration: two parts, one reference number each', flow2([
      { label: `Part A: Aadhaar,\nname, OTP`, fill: `blue` },
      { label: `Temporary\nreference no.`, fill: `blue` },
      { label: `Part B: details\nand documents`, fill: `yellow` },
      { label: `Aadhaar\nauthentication`, fill: `yellow` },
      { label: `Sign (EVC or\nDSC), get ARN`, fill: `orange` },
      { label: `GSTIN and\ncertificate`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `**The steps.** On the GST portal go to **Services, Registration, New Registration**. Fill **Part A of Form GST REG-01**, verify with an OTP sent to the registered mobile and email, and receive a **temporary reference number (TRN)**. Log in with it, fill **Part B** (the business details of the promoters, partners, directors, and bank details), upload the documents, **authenticate through Aadhaar**, which speeds approval and usually avoids a physical visit, and **sign** (EVC for a proprietor, DSC for an LLP or company). The portal gives an **ARN** to track the application.

**Timing and cost.** There is **no fee**. The department normally issues the certificate within **about seven days** on the strength of the Aadhaar verification. If it judges the risk **high**, an officer may visit the place of business, and approval takes longer. You then receive the **15-character GSTIN** and download the certificate. **Within 30 days** the bank details must be on the portal. Compliance duties start **from the registration date**.

## 2. PAN
Every business needs a **PAN**. For an individual (a proprietor) the quickest route is the **instant e-PAN**: on the income tax e-filing portal choose **Instant e-PAN, Get new e-PAN**, enter the **Aadhaar number** (with a mobile linked to it), accept the terms, enter the **OTP**, and the e-PAN is generated, e-mailed and can be downloaded. It is free and paperless. A note: the lecture says any business entity can do this, but the instant e-PAN is meant for **individuals**. A firm, LLP or company gets its own PAN through the regular PAN application, and a company usually gets it along with SPICe+ (check the current route).

## 3. Licences that depend on the business
**Municipal trade licence.** Issued by the local municipal body to let a business operate in a locality and to make sure it follows basic **health, safety and legal standards**. A **general trade and storage licence** covers retail shops, offices and general trade. A **health trade licence** is for **restaurants, food stalls, bakeries and clinics**. Applications are online, with a processing fee (the lecture says it is usually around ₹500, plus other charges that depend on the nature and size of the business; check your municipality).

**Environment and pollution.** Not every business needs this: a software office causes no pollution problem. But **manufacturing, chemicals and heavy processing** are watched according to their **pollution footprint**. Industries such as **metallurgy, electroplating and chemicals** fall in the **red category** and meet the strictest scrutiny. Even industries exempt from prior environmental clearance (the lecture names wind, solar and some fly-ash brick units) still need the **State Pollution Control Board's consent**. Industries in the least polluting (white) category are generally spared this. Applications go through the government's online system, **PARIVESH**.`,

    sk(200, 'Pollution consent comes twice: before you build, and before you run', [
      ...flow([
        { label: `Find the unit's\ncategory`, fill: `blue` },
        { label: `Consent to\nestablish`, fill: `yellow` },
        { label: `Build, install\nthe machines`, fill: `orange` },
        { label: `Consent to\noperate`, fill: `green` },
      ], { y: 30, h: 78, gap: 44, max: 17 }),
      ...[`red, orange, green or white`, `before any building`, `only after consent`, `before the first run`].map((t, i) => ({ t: 'text', x: 86 + i * 196, y: 134, text: t, size: 14, color: `#4a5568` })),
    ]),

    `**Fire no-objection certificate (NOC).** The **state fire service** checks that the premises meet fire-safety codes: **alarms, extinguishers, emergency exits** and so on. It is compulsory for **commercial buildings** (malls, hotels, offices, **warehouses**), **high-rise residential buildings**, **schools, colleges and hospitals**, and **public assembly venues**. An MSME may not run a mall, but it may have a warehouse or an office in a high-rise, so check that **the building you occupy has a fire NOC**.

**Factory licence.** A **factory** is a premises where a **manufacturing process** is carried on by workers above a size limit. The older limits were **10 workers with power or 20 without**. The **Occupational Safety, Health and Working Conditions Code** (the course says it is in force from 2025) raises them to **20 with power or 40 without**, and merges factory licensing into **one unified electronic registration**. The licence is typically valid for about **5 years**. If the authority does not answer within **30 days**, approval is **deemed granted**. Check your state's rules for the exact limits.

**Hazard licences.** A business that stores or handles **petroleum, diesel, gases, inflammable material or explosives** needs a **petroleum or explosives licence**.

## 4. Labour and employment
- The **four labour codes** aim for a **single registration, single licence and single return** per employer.
- A **contractor** supplying manpower needs a licence, but **fewer than 50 workers** needs none (the limit was 20 earlier). Approval is meant to come within **30 days**.
- **EPF** is registered on the unified **Shram Suvidha** portal, giving a unique **establishment code** (usually from 20 employees; see Week 1).
- **ESIC** is mandatory for businesses with **10 or more employees** earning up to **₹21,000 a month**: Form 1 on the ESIC portal, and a **17-digit** employer number.
- **Shop and Establishment Act** registration is normally needed for **retail shops, offices and even home-based businesses**. It governs **working hours, leave and employee rights**, and is paperless.

## 5. Sector-specific registrations
| If the unit does this | It needs |
|---|---|
| Makes or sells food | **FSSAI** registration or licence |
| Deals in medicines or drugs | A **drug licence** |
| Makes certain electrical or other notified products | **BIS** registration |
| Makes measuring equipment or weights | **Legal Metrology** registration |
| Imports or exports | An **IEC** from the Director General of Foreign Trade |
| Trades internationally in a sector | A **registration-cum-membership certificate** from the Export Promotion Council |`,

    sk(300, 'Which clearances a unit usually has to look at (a guide, not a rule)', [
      { t: 'table', x: 55, y: 44, cols: [`Unit`, `Trade`, `Pollution`, `Fire`, `Factory`, `FSSAI`], colW: [190, 90, 100, 90, 90, 90], rowH: 34, title: `Illustration: the usual checks, by type of unit`,
        rows: [
          [`Software office`, `yes`, `no`, `check`, `no`, `no`],
          [`Retail shop`, `yes`, `no`, `check`, `no`, `no`],
          [`Bakery or snacks`, `yes`, `consent`, `yes`, `if big`, `yes`],
          [`Garment factory`, `yes`, `consent`, `yes`, `if big`, `no`],
          [`Electroplating unit`, `yes`, `red`, `yes`, `yes`, `no`],
        ] },
      { t: 'note', x: 55, y: 258, w: 650, h: 30, text: `check = depends on the building; if big = once the unit passes the factory-licence size`, fill: `yellow`, size: 14 },
    ]),

    `## 6. Quality certification
Quality certification **builds credibility**, **opens doors to large buyers and to government tenders**, and helps with **regulatory compliance**. The Ministry of MSME **subsidises** certification costs under its technology-upgrade schemes (the course says up to 75% in some cases; check the scheme).
- **ISO 9001**: quality management. **ISO 14001**: environment. **ISO 27001**: information security. **ISO 45001**: occupational health and safety. They suit some units and not others.
- **ZED**: the national **Zero Defect, Zero Effect** certification. It shows that a unit makes goods without defects and without harming the environment, and brings incentives (the course says registration is free; check what the certification itself costs).
- **BIS**: the product safety standard mark, where required by law.`,

    sk(200, 'Quality marks: what each one tells a buyer', [
      { t: 'box', x: 10, y: 14, w: 230, h: 60, label: `ISO 9001`, sub: `quality management`, fill: `blue` },
      { t: 'box', x: 265, y: 14, w: 230, h: 60, label: `ISO 14001`, sub: `environment`, fill: `green` },
      { t: 'box', x: 520, y: 14, w: 230, h: 60, label: `ISO 27001`, sub: `information security`, fill: `purple` },
      { t: 'box', x: 10, y: 100, w: 230, h: 60, label: `ISO 45001`, sub: `health and safety at work`, fill: `orange` },
      { t: 'box', x: 265, y: 100, w: 230, h: 60, label: `ZED`, sub: `zero defect, zero effect`, fill: `yellow` },
      { t: 'box', x: 520, y: 100, w: 230, h: 60, label: `BIS`, sub: `product safety mark`, fill: `pink` },
      { t: 'text', x: 380, y: 184, text: `Take only those a buyer or a law actually asks for`, size: 15, color: `#c2410c` },
    ]),

    `## Worked example: Ravi's biscuit factory
Ravi's firm already has Udyam, PAN and a partnership deed. It has **25 workers** and sells biscuits all over the district. Walk the list:

| Item | Needed? | Why |
|---|---|---|
| GSTIN | **Yes** | Goods sales above ₹40 lakh; also needed to sell across states |
| Municipal trade licence (health) | **Yes** | It makes and stores food |
| FSSAI | **Yes** | Biscuits are food |
| Pollution board consent | **Check the category** | A food unit is usually low risk; confirm with the Board |
| Fire NOC | **Yes** (check the building) | A factory with stock and a godown |
| Factory licence | **Yes** | 25 workers is above the 20-with-power limit in the course; check the state |
| EPF and ESIC, LIN | **Yes** | 25 employees is above both limits (Week 1) |
| ISO 9001 or ZED | **Optional** | Useful if he wants to supply large buyers or tenders |`,

    { analogy: `A launch checklist for a production service. **Entity** is the account. **GST, PAN** are the billing and identity records. **Municipal, fire, pollution, factory** are the **environment permits**, like quota approvals and security reviews you must clear before going live. **Labour registrations** are the **people and payroll integrations**. **Sector registrations** are the **domain-specific compliance** (a payments service needs one set, a health app another). **ISO, ZED, BIS** are **third-party audits** that you take when a customer or a regulator asks. Skipping one does not stop the service from running today; it stops it at the next audit.` },

    { warn: `Easy mistakes:
- **Collecting GST before registering.** Only a registered business can charge it.
- **Using the instant e-PAN for a firm or company.** It is for individuals.
- **Applying for the wrong municipal licence.** A bakery needs the health trade licence, not just the general one.
- **Building before getting the pollution board's consent to establish.**
- **Forgetting to ask the landlord for a fire NOC** for a rented warehouse.
- **Counting only full-time staff** for factory, EPF and ESIC thresholds.
- **Taking an ISO certificate nobody asked for.** It costs money and time.
- **Treating thresholds as fixed.** The labour codes and state rules keep changing: check the current rule.` },

    { real: `For each new client, tick through **six questions**: Do they sell above the GST limit or across states? Is there food or a regulated product? How many workers? What does the building look like (fire, warehouse)? Does the process pollute? Does a buyer or tender ask for a quality mark? The answers give you the exact list, and the order: **entity, PAN, Udyam, GST, local licences, labour, sector, quality**.` },

    { remember: `- **GST:** compulsory above **₹40 lakh (goods) / ₹20 lakh (services)**, lower in special category states; always for inter-state goods, e-commerce, reverse charge and some others. **Part A, TRN, Part B, Aadhaar, EVC or DSC, ARN, GSTIN** in about **7 days**, no fee.
- **PAN:** instant e-PAN is for **individuals**.
- **Municipal trade licence** (general or health), **pollution consent to establish and to operate** (red category strictest, via PARIVESH), **fire NOC**.
- **Factory licence** (course: 20 workers with power, 40 without; deemed approval after 30 days), **hazard licences**.
- **Labour:** single registration under the codes, contractor licence below 50 workers not needed, **EPF** (Shram Suvidha), **ESIC** (10 or more, up to ₹21,000 a month), **Shop and Establishment**.
- **Sector:** FSSAI, drug licence, BIS, Legal Metrology, IEC, export council.
- **Quality:** ISO 9001, 14001, 27001, 45001, ZED, BIS.` },
  ],
  quiz: [
    { q: `After Part A of the GST registration form is filed and verified, what does the applicant receive?`, o: [`The GSTIN`, `A temporary reference number`, `The ARN`, `The certificate`], a: 1, why: `Part A gives a Temporary Reference Number (TRN), which is used to log in and complete Part B. The ARN comes after final submission.` },
    { q: `Which of these must register for GST irrespective of turnover?`, o: [`A farmer selling his own produce`, `A small tailor selling locally`, `A supplier of fully exempt goods`, `A seller who supplies goods through an e-commerce operator`], a: 3, why: `Sellers who supply through e-commerce operators (and the operators) must register whatever their turnover. A farmer selling his own produce and suppliers of exempt goods need not.` },
    { q: `What does a unit need from the State Pollution Control Board before it starts building?`, o: [`Consent to operate`, `Consent to establish`, `A fire NOC`, `An ISO certificate`], a: 1, why: `The consent to establish is needed before construction, and the consent to operate before starting production.` },
    { q: `A bakery or snack unit usually needs which food-related registration?`, o: [`BIS`, `IEC`, `FSSAI`, `Legal Metrology`], a: 2, why: `Anyone who makes or sells food needs FSSAI registration or a licence.` },
    { q: `ESIC registration is mandatory for businesses with...`, o: [`2 or more employees`, `5 or more employees`, `10 or more employees earning up to ₹21,000 a month`, `100 or more employees`], a: 2, why: `The course gives ESIC as mandatory for 10 or more employees earning up to ₹21,000 a month.` },
    { q: `What does ZED certification show?`, o: [`That a unit makes goods without defects and without harming the environment`, `That a unit has no debts`, `That a unit exports`, `That a unit pays no tax`], a: 0, why: `ZED means Zero Defect, Zero Effect: no defects in the product and no harm to the environment.` },
  ],
};
