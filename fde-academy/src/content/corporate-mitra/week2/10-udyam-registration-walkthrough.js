import { sk, flow, flow2 } from '../_kit.js';

export default {
  title: `Udyam registration, screen by screen, and what comes after`,
  goal: `You can register a new unit on Udyam in the right order, update an old Udyog Aadhaar number, verify any Udyam number, read the certificate, and explain the MSME Data Bank and the NSIC steps that follow.`,
  covers: [`What Udyam is, in one page`, `The six screens`, `Old UAM holders`, `Verifying a number`, `MSME Data Bank and NSIC steps`],
  terms: [
    [`Udyam registration`, `A free, voluntary, online registration that gives a micro, small or medium enterprise an official identity and access to benefits.`],
    [`Self-certification`, `The owner confirms the facts himself. Nothing is uploaded.`],
    [`Validate`, `The button that checks a number against the government database (Aadhaar, PAN) before the form goes on.`],
    [`Captcha`, `A small picture test that proves a person, not a program, is typing.`],
    [`Declaration`, `The statement at the end of the form in which the owner confirms the details are true. A final OTP seals it.`],
    [`UAM`, `Udyog Aadhaar Memorandum: the old registration number (2015 to 2020) that is updated to Udyam.`],
    [`Self-help group (SHG)`, `A small group, often of women, who save and lend among themselves. SHGs can also register.`],
    [`Verify option`, `The page on the portal where anyone can check whether a Udyam number is genuine.`],
    [`MSME Data Bank`, `A voluntary online database and showcase of operating MSMEs, run under the Ministry of MSME.`],
    [`NSIC`, `National Small Industries Corporation, a government enterprise (a Mini Ratna) that supports micro and small units.`],
    [`Site inspection`, `A visit by NSIC's inspector to the unit, before NSIC approves its registration.`],
    [`Raw material assistance`, `NSIC finance that helps small units buy raw materials like steel, copper or aluminium when they are scarce.`],
  ],
  blocks: [
    `## Udyam in one page
The lecture for this topic is a clean summary. **Udyam registration** is a **free, official, online** system that certifies a micro, small or medium enterprise. The business gets a **16-character Udyam number** that proves it exists and opens the benefits: subsidised credit, priority bank loans, protection against delayed payment, government purchase and market help.

Five facts to carry in your head:
- It is **voluntary**. Doing business without it is legal. It is needed to **get benefits**.
- It is **self-certification**: **one online form**, **no documents to upload**, **no fee**. Only the **Aadhaar** and the **PAN** are needed.
- It is open to **any individual or business in India**, in **manufacturing or services**, and also to retail and wholesale traders (with limited benefits). The lecture lists the forms of business: **sole proprietorship, partnership firm, LLP, private company, public company, HUF, cooperative society, trust and self-help group**.
- Size is decided by **investment and turnover**: micro up to ₹2.5 crore and ₹10 crore, small up to ₹25 crore and ₹100 crore, medium up to ₹125 crore and ₹500 crore. (The lecture's table, spoken quickly, sometimes says "20 crore" or "2.5 crore" for the wrong band: the numbers here are the correct ones.)
- It can be done **at home, even on a phone or tablet**.

## For a new unit: six screens, in this order`,

    sk(262, 'A new registration: Aadhaar, OTP, PAN, details, declaration, final OTP', flow2([
      { label: `Aadhaar number\nand name`, fill: `blue` },
      { label: `OTP from\nAadhaar`, fill: `orange` },
      { label: `Type of unit\nand PAN`, fill: `blue` },
      { label: `Business\ndetails`, fill: `yellow` },
      { label: `Declaration\n(tick, confirm)`, fill: `yellow` },
      { label: `Final OTP:\ncertificate`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `1. **Open the official portal** and choose the option for **new entrepreneurs who are not yet registered**.
2. **Type the Aadhaar number and the name** of the entrepreneur (as on Aadhaar). Click **Validate and generate OTP**. An OTP arrives on the mobile linked with the Aadhaar. Enter it.
3. **Choose the type of organisation** and type the **PAN**. Click **Validate PAN**. The portal fetches the PAN details from the **Income Tax Department**.
4. **Fill the business details:** personal details, address, the nature of business (the **NIC codes**), bank details, the **investment** in plant and machinery or equipment, and the **turnover**. For a unit that has filed returns, these figures are fetched, not typed.
5. **Tick the declaration.**
6. **Final submit with one more OTP.** The **Udyam certificate** is generated at once, **sent to the email ID** and can be **downloaded from the portal**.

## For an old Udyog Aadhaar holder
A unit that still has only a **Udyog Aadhaar Memorandum (UAM)** number has an even simpler path. It picks the option **for those already registered under UAM**, types the **old number**, completes the details the portal asks for and confirms with an **OTP**. The UAM is then **updated to Udyam**. (The course says the old registrations stopped being valid from the dates given in the notifications, so advise any such client to update at once.)

## Reading the certificate
It is simple. It shows the **registration number**, the **name of the enterprise**, the **business address** and the **nature of business**. Once a unit holds it, it is entitled to the benefits of the schemes of the Government of India and to subsidised finance and marketing support. It is a **permanent registration** that needs **no renewal** unless the owner cancels it. **Any number of manufacturing or service activities can be added** to the one registration, **even later**.

## Checking someone else's Udyam number
Picture a **large company** that wants to prefer MSME vendors. A supplier shows a certificate. Is it real? Anybody can check on the same portal: open the **Print / Verify** menu, choose **Verify Udyam Registration**, type the **Udyam number** and the **captcha**, and press verify. The portal shows the registered details if the number is genuine. Always do this before you trust a certificate that a client or a vendor shows you.`,

    sk(160, 'Verifying a Udyam number takes four steps', flow([
      { label: `Open the\nUdyam portal`, fill: `blue` },
      { label: `Print / Verify\nmenu`, fill: `blue` },
      { label: `Type number\nand captcha`, fill: `yellow` },
      { label: `Details show:\nit is genuine`, fill: `green` },
    ], { y: 34, h: 76, gap: 44, max: 17 })),

    `## The MSME Data Bank: a shop window
Apart from Udyam, the lecture describes the **MSME Data Bank**, a **voluntary** online database of **operating MSMEs**, launched under the Ministry of MSME. It gives the government a picture of the sector's production capacity, technology, imports and exports. For the unit it works like **opening a shop on a large online marketplace**: it **records its presence, its products and its services**, so that any buyer who needs them can **find it and contact it by phone or email**. It adds to the unit's **credibility** and opens markets in India and abroad.

Registration is simple. The applicant says whether the Aadhaar belongs to the **North Eastern region** (some extra benefits apply there), validates the Aadhaar, gives the Udyam number and a mobile number, and the registration is cleared. The course describes it this way; check the portal for the current form.

## After Udyam: NSIC, step by step
The previous lesson explained **why** to register with **NSIC** (the Single Point Registration Scheme). This lecture adds the **how**. NSIC is a **Mini Ratna** government enterprise under the Ministry of MSME. Its services include the SPRS, **raw material assistance** (it helps small units finance purchases of scarce materials such as steel, copper and aluminium), **credit facilitation** with banks, and integrated support for marketing, technology and skills.

**Before you start, keep ready:** the **Udyam certificate**, the MSME Data Bank registration (the course lists it), **audited financial statements for the last three years** (balance sheet and profit and loss account), **details of plant and machinery**, and **ownership proof of land and building** where there is any.`,

    sk(262, 'NSIC registration: like Udyam, but slower, with papers and a possible site visit', flow2([
      { label: `Log in with\nUdyam no. + PAN`, fill: `blue` },
      { label: `Fill business\ndetails`, fill: `blue` },
      { label: `Upload the\ndocuments`, fill: `yellow` },
      { label: `Site inspection\n(if ordered)`, fill: `orange` },
      { label: `Approval, then\npay the fees`, fill: `yellow` },
      { label: `NSIC certificate\nissued`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `The process is similar to Udyam, but the NSIC portal is a different website, the form is **more detailed** (factory, office, products), documents **are uploaded**, and **NSIC may inspect the site** on a date it gives you. Only after the project is approved do you pay the **registration fee and the inspection fee**, which depend on annual turnover. Then the certificate is issued and the benefits start.

## Worked example: Meena registers
Meena's tailoring unit ("Meena Stitch") has machines worth ₹4 lakh and sales of about ₹8 lakh a year. She is a proprietor with a PAN and no GSTIN.

| Screen | What Meena enters or sees |
|---|---|
| 1. Aadhaar and name | Her 12-digit Aadhaar and her name exactly as on the card |
| 2. OTP | The code sent to her linked mobile |
| 3. Type of unit and PAN | Proprietorship; her PAN. The portal fetches her PAN record |
| 4. Business details | Name and address of the unit, bank details, NIC code for tailoring, ₹4 lakh investment, ₹8 lakh turnover (declared: it is a new registration) |
| 5. Declaration | She ticks it. You make sure she has read it |
| 6. Final OTP | The certificate appears and goes to her email. A copy is in DigiLocker |

Meena is **micro**. She pays **nothing**, uploads **nothing**, and is done in one sitting. If, later, she wants to sell uniforms to a government school, her next step is NSIC (micro and small units can register, but a unit must first be an eligible manufacturing or service unit, not a trader).`,

    { analogy: `Udyam is a **sign-up flow with identity federation**: the portal does not ask you to create credentials, it asks the Aadhaar and PAN systems to vouch for you, and then pulls your records from the tax systems. The **verify page** is a **public lookup endpoint**: any third party can query an ID and get a yes or no, so a fake certificate cannot survive. NSIC is a **second, heavier onboarding** (documents, an on-site audit, a fee) for a **higher privilege tier**, which is why it asks for evidence.` },

    { warn: `Easy mistakes:
- **A name different from the Aadhaar.** Type it exactly as on the card, or the validation fails.
- **Leaving the declaration for the client to read on their own.** It is a legal statement: read it together.
- **Not verifying a certificate** that a vendor or client shows you.
- **Registering again** instead of adding a new activity. One registration, many activities.
- **Telling a client that NSIC is just as light as Udyam.** It has uploads, a possible inspection and a fee.
- **Using a paid agent's website** for any of these steps. Udyam is free and the portal is the government's.` },

    { real: `Make a **routine** and follow it for every client: (1) decide the door (Udyam or Udyam Assist), (2) run the eligibility checklist, (3) collect the document pack, (4) fill the classification sheet, (5) register, (6) save the certificate to DigiLocker and email it to the client, (7) **verify** the number on the portal, (8) put a reminder in your diary for ITR and GST filing dates, because they keep the registration accurate, (9) tell the client about the Data Bank and NSIC if they sell to buyers or to the government.` },

    { remember: `- **Udyam:** free, online, voluntary, self-certified, **no uploads**; needs **Aadhaar and PAN**; **16-character number**; permanent, no renewal; add activities later.
- **New unit, six screens:** Aadhaar and name → OTP → type of unit and PAN → business details → declaration → final OTP → certificate (email and download).
- **Old UAM holder:** use the UAM option, type the old number, confirm with OTP: it updates to Udyam.
- **Verify any number:** Print / Verify → Verify Udyam Registration → number and captcha.
- **MSME Data Bank:** voluntary online showcase that helps buyers find you.
- **NSIC:** log in with Udyam number and PAN, fill the form, upload documents, possible **site inspection**, approval, **fees** by turnover, certificate.` },
  ],
  quiz: [
    { q: `Is Udyam registration compulsory?`, o: [`Yes, by law for every business`, `Only for companies`, `No, but it is needed to get benefits`, `Only for exporters`], a: 2, why: `It is voluntary. A business can operate without it, but it must register to claim the benefits.` },
    { q: `Which two numbers are all you need to register a unit that has no documents?`, o: [`PAN and GSTIN`, `Aadhaar and PAN`, `Aadhaar and CIN`, `PAN and TAN`], a: 1, why: `The portal needs only the Aadhaar number and the PAN. Nothing is uploaded.` },
    { q: `How can a large company check whether a vendor's Udyam certificate is genuine?`, o: [`Use the Verify Udyam Registration option on the portal`, `Call the DIC`, `Ask the vendor to send it again`, `Check the GST portal`], a: 0, why: `Anyone can verify a Udyam number on the portal's Print / Verify page with the number and the captcha.` },
    { q: `What do you do for a unit that already has only an old Udyog Aadhaar number?`, o: [`Register as a new unit`, `Apply to NSIC`, `Nothing; it stays valid for ever`, `Use the UAM option and update it to Udyam`], a: 3, why: `The portal has an option for those registered under UAM: type the old number and confirm with an OTP.` },
    { q: `What may NSIC do that Udyam never does?`, o: [`Ask for the Aadhaar number`, `Issue a certificate`, `Send an inspector to the site`, `Send an OTP`], a: 2, why: `NSIC may inspect the unit's site before it approves the registration, and it charges an inspection fee.` },
    { q: `Can one Udyam registration cover several activities?`, o: [`No, one registration per activity`, `Yes, and more can be added later`, `Only manufacturing activities`, `Only if the PAN is different`], a: 1, why: `Any number of manufacturing or service activities can be listed under the one registration, even at a later date.` },
  ],
};
