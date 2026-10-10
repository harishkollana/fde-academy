import { sk, flow } from '../_kit.js';

export default {
  title: `What to have in hand before you register on Udyam`,
  goal: `You can list every item a client must bring to an Udyam registration, say whose Aadhaar and which PAN are needed for each kind of business, and explain what the portal checks each item against.`,
  covers: [`Paperless, but not empty-handed`, `Aadhaar and the OTP`, `PAN and GSTIN`, `Entity papers`, `Address, bank, mobile, email, NIC code`],
  terms: [
    [`Paperless`, `You do not upload proof of investment or turnover. The portal checks the facts against government databases.`],
    [`Aadhaar`, `The 12-digit identity number of an individual in India. It is the first identity check on Udyam.`],
    [`OTP`, `One-time password: a short code sent to your mobile that proves the phone is yours.`],
    [`Authorised signatory`, `The person a company or other entity has named to sign for it, for example on the Udyam form.`],
    [`Managing partner`, `The partner who runs the firm and signs for it.`],
    [`Partnership deed`, `The written agreement between partners: profit shares, roles, capital.`],
    [`LLP agreement`, `The agreement between the partners of a limited liability partnership.`],
    [`Certificate of incorporation`, `The certificate the Registrar of Companies issues when a company or LLP is created.`],
    [`MOA and AOA`, `Memorandum of Association (what the company may do) and Articles of Association (its internal rules): the company's two founding documents.`],
    [`Cancelled cheque`, `A cheque marked "cancelled" with a line across it. It proves the account number, branch and IFSC without any risk of being cashed.`],
    [`IFSC`, `The code of a bank branch, used for electronic transfers.`],
    [`NIC code`, `National Industrial Classification code: a number that names the business activity.`],
  ],
  blocks: [
    `## "Paperless" does not mean "ready with nothing"
Udyam registration is **largely paperless**. The portal does **not** ask for proof of how much you invested or how much you sell. It trusts the applicant's **self-declaration** and checks the rest against **government databases**: the **Aadhaar** system, the **PAN** and **income tax** records and the **GST** records. So what you bring is not a stack of certificates. It is a handful of **numbers and facts that open those databases**.

For a new unit, investment and turnover are declared by the owner. For an existing unit, the portal fetches them. Either way, you need the following items **in hand before you start**, because a missing mobile number or a mismatched name stops the form half way.`,

    sk(332, 'The four databases the portal checks your application against', [
      { t: 'box', x: 20, y: 16, w: 250, h: 56, label: `Aadhaar`, sub: `identity, OTP on linked mobile`, fill: `blue` },
      { t: 'box', x: 20, y: 92, w: 250, h: 56, label: `PAN`, sub: `tax identity; one PAN, one Udyam`, fill: `green` },
      { t: 'box', x: 20, y: 168, w: 250, h: 56, label: `GST data`, sub: `turnover (if GST-registered)`, fill: `orange` },
      { t: 'box', x: 20, y: 244, w: 250, h: 56, label: `Income-tax data`, sub: `investment and turnover (ITR)`, fill: `purple` },
      { t: 'arrow', x1: 274, y1: 44, x2: 396, y2: 116 }, { t: 'arrow', x1: 274, y1: 120, x2: 396, y2: 146 },
      { t: 'arrow', x1: 274, y1: 196, x2: 396, y2: 176 }, { t: 'arrow', x1: 274, y1: 272, x2: 396, y2: 206 },
      { t: 'box', x: 400, y: 96, w: 160, h: 130, label: `Udyam\nportal`, fill: `yellow`, size: 20 },
      { t: 'arrow', x1: 564, y1: 161, x2: 626, y2: 161 },
      { t: 'box', x: 630, y: 111, w: 120, h: 100, label: `Number +\ncertificate`, sub: `free, online`, fill: `green`, size: 16 },
    ]),

    `## The three that matter most
For a practical registration the lecture says three things are critical: the **Aadhaar of the authorised person**, the **PAN of the enterprise**, and the **bank and business details**. The other items support them.`,

    sk(268, 'Three essentials, five supporting items', [
      { t: 'text', x: 380, y: 18, text: `The three that matter most`, size: 18, bold: true, color: `#c2410c` },
      { t: 'box', x: 20, y: 40, w: 230, h: 70, label: `Aadhaar`, sub: `of the person who signs`, fill: `green` },
      { t: 'box', x: 265, y: 40, w: 230, h: 70, label: `PAN`, sub: `of the enterprise`, fill: `green` },
      { t: 'box', x: 510, y: 40, w: 230, h: 70, label: `Bank details`, sub: `account, IFSC, cancelled cheque`, fill: `green` },
      { t: 'text', x: 380, y: 150, text: `Also keep ready`, size: 18, bold: true, color: `#c2410c` },
      { t: 'box', x: 10, y: 172, w: 140, h: 70, label: `GSTIN`, sub: `only if GST applies`, fill: `blue`, size: 17 },
      { t: 'box', x: 160, y: 172, w: 140, h: 70, label: `Entity papers`, sub: `deed, certificate`, fill: `blue`, size: 16 },
      { t: 'box', x: 310, y: 172, w: 140, h: 70, label: `Address proof`, sub: `bill or rent deed`, fill: `blue`, size: 16 },
      { t: 'box', x: 460, y: 172, w: 140, h: 70, label: `Mobile, email`, sub: `active, linked`, fill: `blue`, size: 16 },
      { t: 'box', x: 610, y: 172, w: 140, h: 70, label: `NIC code`, sub: `the right activity`, fill: `blue`, size: 17 },
    ]),

    `## 1. Aadhaar: whose, and why an OTP
Aadhaar is an **individual's** identity, so a company or a firm cannot have one. The portal therefore asks for the Aadhaar of **one named person**, who signs for the business.

| Form of business | Whose Aadhaar |
|---|---|
| Proprietorship | the proprietor |
| Partnership firm | the **managing partner** (not every partner) |
| HUF | the **karta** (not every family member) |
| Company | the **authorised signatory** named in a board resolution |
| LLP | a **designated partner** |
| Trust or society | the **authorised representative** |

Aadhaar is **mandatory**: without it you cannot register. When the number is typed, the portal sends an **OTP** to the **mobile number linked with that Aadhaar**. Entering it proves the person is really present, just like the OTP you get when you file an income tax return or make a bank transaction.`,

    sk(180, 'The Aadhaar OTP: if the linked mobile is dead, everything stops here', [
      ...flow([
        { label: `Type the\nAadhaar number`, fill: `blue` },
        { label: `OTP goes to the\nlinked mobile`, fill: `orange` },
        { label: `Type the OTP\nin the form`, fill: `yellow` },
        { label: `Name and details\nappear on screen`, fill: `green` },
      ], { y: 22, h: 76, gap: 44, max: 17 }),
      { t: 'note', x: 90, y: 124, w: 580, h: 44, text: `Rural clients: check that the mobile is switched on, has a working SIM,\nand is the one linked to the Aadhaar. If not, fix it at an Aadhaar centre first.`, fill: `yellow`, size: 14 },
    ]),

    `## 2. PAN: the enterprise's tax identity
The PAN is used to **verify the business through the income tax database**. As in the last lesson, it is the PAN of the **entity that owns the business**: the proprietor for a proprietorship, and the firm's, the company's or the LLP's own PAN (a **separate PAN**, not a person's). **One PAN gives one Udyam registration.** Because PAN links to ITR data, the investment and turnover of an existing unit are fetched automatically. A new unit declares them, and from the next year, once it has filed its first return, the tax data takes over.

## 3. GSTIN: only when GST applies
The GSTIN is needed to **verify turnover**, but only for businesses that **must** register for GST under the CGST Act (the usual limits are ₹40 lakh for goods and ₹20 lakh for services, lower in some special category and north-eastern states; check the current figures). If GST registration is **not mandatory** for the client, the registration can go ahead on **Aadhaar and PAN alone**. When a GSTIN exists, the portal reads domestic sales and export turnover from it. GST collected is **not** counted as turnover.

## 4. Entity papers: the legal base of the business
These documents prove **what kind of entity** it is.

| Form | Papers that establish its legal status |
|---|---|
| Proprietorship | none: a single owner needs no separate registration paper |
| Partnership firm | the **partnership deed** |
| LLP | the **LLP agreement** and the **certificate of incorporation** |
| Company | the **certificate of incorporation**, plus the **MOA** and the **AOA** |

(The lecture mistakenly says "partnership" in the first row; it means proprietorship.) The Udyam form mostly asks you to **type** the details from these papers. Keep the papers at hand so you copy names, dates and addresses correctly, and check on the day whether the portal asks for any upload.

## 5. Address, bank, mobile, email and the activity code
- **Address of the place of business**, with a proof such as an **electricity bill in the enterprise's name**, a **water or telephone bill**, a **property tax receipt**, a **rent agreement** (if rented) or **ownership papers**. Anything that shows the business is carried on at that place.
- **Bank account details:** bank name, account number, **IFSC**, and a **cancelled cheque**. This matters later because subsidies, reimbursements and loans are paid straight into this account.
- **Mobile number** linked with Aadhaar, and active. It is also used to confirm future changes to the profile.
- **Email ID** that works, because the **Udyam certificate is e-mailed** and the ministry writes to it.
- **Activity details and NIC code.** Manufacturing, consultancy and retail trade have **different codes**. A wrong code can cause compliance problems later, so match it to what the unit really does.
- **Investment and turnover:** fetched from ITR and GST for an existing unit, or declared for a new one.

## Worked example: two document packs
| Item | Ravi's biscuit unit (partnership, 25 staff) | Meena's tailoring unit (proprietorship) |
|---|---|---|
| Aadhaar | Managing partner's | Meena's own |
| PAN | The **firm's** PAN | Meena's PAN |
| GSTIN | **Yes**: goods sales above ₹40 lakh | Not needed: turnover is below ₹20 lakh |
| Entity papers | Partnership deed | None |
| Address proof | Electricity bill of the factory | Rent receipt or electricity bill of her room |
| Bank | The firm's current account, cancelled cheque | Her bank account, cancelled cheque |
| Mobile, email | Linked to the managing partner's Aadhaar | Linked to Meena's Aadhaar |
| NIC code | Bakery or biscuit manufacture | Tailoring and garment making |`,

    { analogy: `Think of the form as a **page that auto-fills from four back-end systems**. You do not enter the data; you supply the **keys** to those systems: the Aadhaar number, the PAN and the GSTIN. The **OTP is two-factor authentication**: knowing the number is not enough, you must also hold the phone. A mismatch (a different name on the PAN and on the bank account) is like a **foreign-key mismatch**: the join fails, and so does the form.` },

    { warn: `Easy mistakes:
- **The mobile is not linked with the Aadhaar**, or it is switched off. No OTP, no registration.
- **The wrong person's Aadhaar.** For a company it is the **signatory named in the board resolution**, not just any director.
- **Names that do not match.** Business name, PAN, bank account and address should agree.
- **A personal PAN used for a partnership or company.** Use the entity's own PAN.
- **Skipping the GSTIN** for a client who is above the GST limit.
- **A random NIC code.** It must describe the real activity.
- **Old or foreign address proof.** Use a recent bill in the name of the enterprise.` },

    { real: `Make a **one-page document pack** for each client, in the order of the table above, and tick each item with them before you open the portal. Take a photo of the cancelled cheque and the address proof for the client file. The registration then takes minutes instead of three return visits.` },

    { remember: `- Udyam is **largely paperless**: no proof of investment or turnover; details are checked against **Aadhaar, PAN, GST and income tax data**.
- **Critical three:** Aadhaar of the authorised person, PAN of the enterprise, bank and business details.
- **Aadhaar of:** proprietor, **managing partner**, **karta**, **authorised signatory** (board resolution), **designated partner**, trust's **authorised representative**. An **OTP** goes to the linked mobile.
- **GSTIN** only if GST is mandatory; otherwise Aadhaar and PAN are enough.
- **Entity papers:** partnership deed; LLP agreement and incorporation certificate; company certificate of incorporation, MOA and AOA.
- Also: address proof, bank details with cancelled cheque, active mobile and email, correct **NIC code**.` },
  ],
  quiz: [
    { q: `Whose Aadhaar is needed to register a partnership firm on Udyam?`, o: [`Every partner's`, `The managing partner's`, `The accountant's`, `The oldest partner's`], a: 1, why: `One person signs for the firm, the managing partner. The Aadhaar of every partner is not required.` },
    { q: `What is sent to the mobile number during Aadhaar verification?`, o: [`The Udyam certificate`, `The PAN`, `An OTP`, `The GST number`], a: 2, why: `A one-time password is sent to the mobile number linked with the Aadhaar.` },
    { q: `Can a business that is not required to take GST registration still register on Udyam?`, o: [`Yes, with Aadhaar and PAN`, `No, GSTIN is always mandatory`, `Only if it has employees`, `Only if it is a company`], a: 0, why: `GSTIN is needed only where GST registration is mandatory. Otherwise Aadhaar and PAN are enough.` },
    { q: `Which documents establish a company's legal status?`, o: [`Partnership deed`, `Electricity bill`, `Cancelled cheque`, `Certificate of incorporation, MOA and AOA`], a: 3, why: `A company is evidenced by its certificate of incorporation plus the Memorandum and the Articles of Association.` },
    { q: `Why does the portal want bank account details?`, o: [`To charge the registration fee`, `Because subsidies and loans are paid into the account`, `To replace the PAN`, `To open a GST account`], a: 1, why: `Government subsidies, reimbursements and loan amounts are paid by bank transfer into the declared account.` },
    { q: `Which three items matter most for a practical registration?`, o: [`Aadhaar of the authorised person, PAN of the enterprise, bank and business details`, `Rent deed, MOA, email`, `GSTIN, ITR, balance sheet`, `Partnership deed, electricity bill, photograph`], a: 0, why: `The lecture names the Aadhaar of the authorised person, the PAN of the enterprise and the bank and business details as the critical items.` },
  ],
};
