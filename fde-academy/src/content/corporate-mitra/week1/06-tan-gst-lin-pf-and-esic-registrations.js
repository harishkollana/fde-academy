import { sk, hub, bar } from '../_kit.js';

export default {
  title: `TAN, GST, LIN, PF and ESIC: the other popular registrations`,
  goal: `You can say what each of these five numbers is for, who must have it, and how to apply, and you can work out which ones a given business needs from its type, turnover and number of employees.`,
  covers: [`TAN and TDS/TCS`, `GSTIN and the turnover limits`, `LIN (labour ID)`, `PF number (EPFO)`, `ESIC number`],
  terms: [
    [`TDS`, `Tax Deducted at Source. When you pay someone (salary, rent, a contractor), you hold back a small part as tax and send it to the government on their behalf.`],
    [`TCS`, `Tax Collected at Source. A seller of certain goods collects an extra tax from the buyer at the time of sale and deposits it with the government.`],
    [`Deductor / deductee`, `The deductor is the one who pays and deducts tax. The deductee is the one who receives the payment minus the tax.`],
    [`TAN`, `Tax deduction and Collection Account Number: a 10-character ID for anyone who deducts or collects tax at source.`],
    [`GST`, `Goods and Services Tax. An indirect tax added to the price of goods and services. The customer pays it, the business passes it on to the government.`],
    [`GSTIN`, `GST Identification Number: the 15-character ID of a GST-registered business.`],
    [`ARN`, `Application Reference Number: the tracking number the GST portal gives you after you submit an application.`],
    [`DSC / EVC`, `Two ways to sign online. DSC is a digital signature token. EVC is a code sent to the registered mobile or email.`],
    [`LIN`, `Labour Identification Number: a 16-digit ID issued to an establishment through the Shram Suvidha portal, linked to its labour-law records.`],
    [`EPF / EPFO`, `Employees' Provident Fund Organisation. It runs a retirement-savings scheme where both employee and employer put in a share of wages every month.`],
    [`ESI / ESIC`, `Employees' State Insurance Corporation. It runs health and social-security insurance for workers earning below a wage ceiling.`],
    [`Establishment`, `The legal word for a workplace: a factory, shop or office that employs people.`],
    [`Labour Codes`, `Four new laws (wages, industrial relations, social security, safety and working conditions) that replaced many older labour laws. The course says they came into force in late 2025.`],
  ],
  blocks: [
    `## One business, many ID numbers
A business gets a **PAN** from the tax department. That is its basic identity. But as it hires people, deducts tax and sells goods, the government wants to keep separate records for each activity, and each one has its **own number**.

Think of it as an ID badge with several stickers: the more activities, the more stickers.

| Number | What it is for | Who issues it |
|---|---|---|
| **TAN** | Deducting or collecting tax at source | Income Tax Department |
| **GSTIN** | Charging and paying GST | GST department |
| **LIN** | Labour-law records of a workplace | Ministry of Labour (Shram Suvidha) |
| **PF number** | Provident fund contributions | EPFO |
| **ESIC number** | Employee health insurance | ESIC |

All five are a **professional opportunity** for a Corporate Mitra: the paperwork is easy to get wrong, and most small owners do not want to do it.`,

    sk(380, 'The PAN is the base identity. Each activity adds its own number.', hub(
      { label: `PAN\nbusiness ID`, fill: `yellow` },
      [
        { label: `TAN`, sub: `deduct or collect tax`, fill: `blue` },
        { label: `GSTIN`, sub: `charge and pay GST`, fill: `green` },
        { label: `LIN`, sub: `labour records`, fill: `orange` },
        { label: `PF number`, sub: `retirement fund`, fill: `purple` },
        { label: `ESIC number`, sub: `health insurance`, fill: `pink` },
      ],
      { cx: 380, cy: 195, rx: 285, ry: 118, r: 54, bw: 180, bh: 62 },
    )),

    `## 1. TAN: the number for deducting tax
**Why does it exist?** Many payments are made **after holding back a little tax**. A company pays salary: it keeps a part as tax and sends it to the government. An employee then receives the rest. This is **TDS**. **TCS** is the mirror image: certain sellers collect tax from buyers. The government needs to know who is doing the holding back, so that person gets a **TAN**.

**Who must have it?**
- **Companies, LLPs, partnership firms and trusts**: always.
- **Individuals, proprietors and HUFs**: only if their business or profession is **subject to a tax audit**.
- **No TAN needed** when deducting TDS on a **property purchase**, on **rent** or on certain **contract payments** by individuals. The deductor's **PAN** is used instead.

**How to apply:**
1. Apply on the **Income Tax Department portal**, or through the **Protean (formerly NSDL)** portal.
2. The form under the new income-tax law is **Form 135** for all non-government applicants (and **Form 134** for government bodies), as taught in the course. Check the form name on the portal.
3. Documents: **proof of identity**, **proof of address**, and **proof of date of incorporation or birth**. For a business that is a certificate of incorporation, **CIN** (company number) or **LLPIN** (LLP number), the partnership deed, trust deed, or a registration certificate.
4. Pay the **small fee**. An acknowledgement slip is generated.
5. Send the slip and documents to **Protean** for verification. The **TAN allotment letter** then arrives.

## 2. GSTIN: the number for charging GST
**GST** is the tax added to the price of most goods and services. A **GST-registered** business charges it to customers and sends it to the government, after subtracting the GST it paid on its own purchases. (The details of that mechanism come later in the course.)

**The GSTIN has 15 characters.** It is not random: it is built from parts, including the business's own PAN.`,

    sk(366, 'Two things to know about GST: what a GSTIN is made of, and when registration is compulsory', [
      { t: 'text', x: 380, y: 20, text: `A GSTIN is built like this`, size: 19, bold: true },
      ...bar([
        { v: 2, top: `29`, label: `state\ncode`, fill: `yellow`, size: 13 },
        { v: 10, top: `ABCDE1234F  (the PAN)`, label: `the business's own PAN`, fill: `blue`, size: 14 },
        { v: 1, top: `1`, label: `entity\nno.`, fill: `green`, size: 13 },
        { v: 1, top: `Z`, label: `always\nZ`, fill: `orange`, size: 13 },
        { v: 1, top: `5`, label: `check\ndigit`, fill: `pink`, size: 13 },
      ], { x: 30, y: 44, w: 700, h: 44 }),
      { t: 'line', x1: 30, y1: 160, x2: 730, y2: 160, dashed: true },
      { t: 'text', x: 380, y: 184, text: `Annual turnover: when must a business register for GST?`, size: 19, bold: true },
      ...bar([
        { v: 20, top: `up to 20 lakh`, label: `not mandatory`, fill: `green`, size: 15 },
        { v: 20, top: `20 to 40 lakh`, label: `services must register,\ngoods need not`, fill: `yellow`, size: 15 },
        { v: 30, top: `above 40 lakh`, label: `both must register`, fill: `red`, size: 15 },
      ], { x: 30, y: 208, w: 700, h: 46 }),
      { t: 'note', x: 120, y: 296, w: 520, h: 52, text: `Special category states have lower limits. Sellers on e-commerce platforms\nregister whatever their turnover.`, fill: `yellow`, size: 14 },
    ]),

    `**Who needs GST registration?**
- Companies, LLPs, partnership firms and proprietorships making **taxable supplies** once turnover crosses the limit: **₹40 lakh for goods, ₹20 lakh for services** (limits are lower in special category states).
- **E-commerce sellers** and operators, **whatever their turnover**.
- Businesses that supply **across state borders**, **casual taxable persons**, **non-resident taxable persons**, persons who must **deduct or collect tax under GST**, **input service distributors** and **agents** acting for suppliers.
- Even trusts and societies, if they cross the limit.

**How to apply:** on the official **GST portal**, **Form GST REG-01**. Verify with **OTP, DSC or EVC**. You get an **ARN** to track the application. After the GST officer verifies, the **certificate (Form GST REG-06)** containing the GSTIN is issued. **There is no government fee.**

**Documents:** **PAN** of the business; **Aadhaar** of the promoters, partners or directors; the business **registration or incorporation certificate**; **address proof** of the main place of business (rent or lease agreement, with an **electricity bill not more than two months old**); **bank proof** (cancelled cheque or statement); a **photograph** of the authorised signatory; a **board resolution or authorisation letter** where relevant; **DSC** where applicable. Keep everything ready **before** you start the form.

## 3. LIN: one labour identity for the workplace
Earlier, a factory dealt with separate registrations for the provident fund, state insurance, contract labour and mines safety. With the **four Labour Codes** (the course says they were brought in during late 2025), the **Labour Identification Number (LIN)** is meant to be **one common identifier**: *one unit, one identifier*.

- **What:** a **16-digit** number, system-generated, linked to the establishment's labour records, inspections and compliances.
- **Who:** every establishment **employing workers** under labour laws: factories, companies, LLPs, partnerships and others. Anyone who needs **EPFO or ESIC** registration. **Principal employers and contractors** using contract labour.
- **Where:** the **Shram Suvidha portal** (shramsuvidha.gov.in).

**Steps:** sign up → log in using the emailed link → choose "apply for LIN / establishment registration" → fill in the establishment name, constitution, **PAN, CIN or LLPIN**, address, nature of business, date of commencement, **employer or occupier** details, number of employees and applicable labour laws → upload documents → verify with OTP → submit. The **LIN** is generated.

**Documents:** PAN of the establishment, **CIN, LLPIN or registration certificate**, address proof, details of the **employer, occupier or manager**, email and mobile, **employee details**, and any existing labour-law registrations.

## 4. PF number: the retirement fund
Under the **EPF and Miscellaneous Provisions Act, 1952**, employer and employee both contribute a share of wages each month into the employee's provident fund account, run by **EPFO**.

- **Who:** establishments with **20 or more employees**. Also **notified** establishments and **specified industries** even below 20.
- **Where:** the **EPFO employer portal** (the Unified Shram Suvidha portal links to it). The employer side and the employee side are separate.
- **Steps:** create an employer login (email and mobile verification) → choose establishment registration → fill in the name, PAN, address, date of incorporation, type of business, number of employees, employer details → upload PAN, incorporation certificate, address proof and bank details → verify with **OTP and DSC** → submit.
- **What you get:** a PF **establishment code**, built from a **region code + office code + establishment number**, for example TN / MAS / 1234567 (Tamil Nadu, Chennai office). It is used to pay monthly contributions, register employees and file returns.

## 5. ESIC number: health insurance for workers
The **Employees' State Insurance** scheme (ESI Act, 1948, now folded into the labour codes) gives workers **medical and social-security cover**. Employers contribute for every covered worker.

- **Who:** establishments with **10 or more employees** (limits can differ by state), including factories, shops, commercial establishments and service organisations.
- **What:** a **17-digit** registration number.
- **How:** almost the same process and documents as PF registration, on the **ESIC employer portal**.`,

    sk(236, 'How many employees? That decides PF and ESIC', [
      { t: 'text', x: 380, y: 24, text: `Number of employees in the establishment`, size: 19, bold: true },
      ...bar([
        { v: 10, top: `under 10`, label: `generally neither\nESIC nor PF`, fill: `green`, size: 16 },
        { v: 10, top: `10 to 19`, label: `ESIC applies\nPF only if notified`, fill: `yellow`, size: 16 },
        { v: 20, top: `20 or more`, label: `both ESIC and PF apply`, fill: `orange`, size: 16 },
      ], { x: 30, y: 50, w: 700, h: 52 }),
      { t: 'note', x: 120, y: 160, w: 520, h: 56, text: `Rules can differ for notified industries and some states.\nCheck the current threshold before you advise a client.`, fill: `yellow`, size: 14 },
    ]),

    { analogy: `Each number is a **separate API key** to a different government system, but all of them carry a reference to the same business. The **PAN is the master key** (the GSTIN literally contains it). TAN, GSTIN, LIN, PF and ESIC are **scoped keys**, each granting access to one function: deducting tax, charging GST, reporting labour data, paying retirement contributions, paying health insurance. Lose track of one and *that* system starts sending penalties.` },

    `## Worked example: which numbers does Ravi's biscuit unit need?
Ravi's unit is a **partnership firm** with **25 employees** and about **₹2.5 crore** of annual sales of goods. It pays salaries and rent.

| Number | Needed? | Why |
|---|---|---|
| **PAN** | Yes | It is the base identity (the firm's own PAN) |
| **TAN** | **Yes** | Partnership firms must have a TAN because they deduct tax on salaries and some payments |
| **GSTIN** | **Yes** | Goods sales of ₹2.5 crore are above the ₹40 lakh limit |
| **LIN** | **Yes** | It employs workers under labour laws |
| **PF number** | **Yes** | 25 employees is above the limit of 20 |
| **ESIC number** | **Yes** | 25 employees is above the limit of 10 |

Now take Meena's tailoring unit: a **proprietorship**, sales ₹8 lakh, **3 employees**. She needs her **PAN** and **Udyam**, but **no TAN** (no tax audit), **no GSTIN** (below ₹20 lakh), **no PF or ESIC** (under 10). Doing the right amount of registration, not the maximum, is part of good advice.`,

    { warn: `Easy mistakes:
- **Collecting GST without a GSTIN.** Only a registered business can charge GST.
- **Applying for a TAN when it is not needed**, or skipping it when it is (companies, LLPs and firms always need one).
- **Uploading an old electricity bill** for GST address proof (it must be recent).
- **Counting only full-time staff** for PF and ESIC. Check who counts as an employee under the scheme.
- Using **numbers and form names from this lesson without checking** the portal: the new income-tax law and the labour codes have changed form names and thresholds recently.` },

    { real: `Make a one-page **"registration map"** for every new client: the form of business, the turnover, the number of employees, and then a tick or cross against **PAN, TAN, GSTIN, Udyam, LIN, PF, ESIC**. It stops you forgetting one, and it shows the client what you are doing for the fee.` },

    { remember: `- **TAN**: 10-character ID for those who deduct or collect tax at source (TDS, TCS). **Always** for companies, LLPs, firms, trusts. Individuals, proprietors, HUFs only with a **tax audit**. Property purchase, rent and some contracts use **PAN** instead.
- **GSTIN**: 15 characters (**state code + PAN + entity no. + Z + check digit**). Mandatory above **₹40 lakh (goods)** or **₹20 lakh (services)**, for e-commerce sellers, and some other cases. Form **GST REG-01**, ARN, certificate **REG-06**, **no fee**.
- **LIN**: 16-digit labour ID from **Shram Suvidha**, one identifier for the workplace under the new labour codes.
- **PF number**: **EPFO**, for **20 or more** employees (and notified cases). Code = region + office + establishment number.
- **ESIC number**: **17-digit**, for **10 or more** employees. Process similar to PF.
- Always check the **current** form names and limits on the official portal.` },
  ],
  quiz: [
    { q: `What is the most commonly used portal for registering a LIN?`, o: [`epfindia.gov.in`, `esic.gov.in`, `shramsuvidha.gov.in`, `nsws.gov.in`], a: 2, why: `The Labour Identification Number is issued through the Shram Suvidha portal.` },
    { q: `A service business must register for GST once its annual turnover is above...`, o: [`₹10 lakh`, `₹20 lakh`, `₹40 lakh`, `₹75 lakh`], a: 1, why: `The limit is ₹20 lakh for services and ₹40 lakh for goods (lower in special category states).` },
    { q: `For which of these is a TAN NOT mandatory?`, o: [`A one-person company`, `A private limited company`, `A partnership firm`, `An individual business with no tax audit`], a: 3, why: `Companies, LLPs, firms and trusts need a TAN. Individuals, proprietors and HUFs need one only if they are subject to a tax audit.` },
    { q: `ESIC registration applies to an establishment with...`, o: [`up to 2 employees`, `up to 5 employees`, `up to 9 employees`, `10 or more employees`], a: 3, why: `The ESIC threshold is 10 or more employees (it can vary for certain states).` },
    { q: `Which part of a GSTIN is the business's own PAN?`, o: [`The first two characters`, `Characters 3 to 12`, `The last character`, `None of it`], a: 1, why: `A GSTIN is the 2-digit state code, then the 10-character PAN, then an entity number, the letter Z and a check character.` },
    { q: `Is there a government fee for GST registration?`, o: [`Yes, ₹1,000`, `Yes, ₹500 for firms`, `No official fee`, `Only for companies`], a: 2, why: `GST registration on the official portal has no government fee.` },
  ],
};
