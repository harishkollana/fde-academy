import { sk, flow, steps } from '../_kit.js';

export default {
  title: `The MSME memorandum, the registration process and Udyam Assist`,
  goal: `You can explain what a memorandum is and how registration evolved from SSI to Udyam, walk through the Udyam registration steps and its rules (one registration, free, penalty for false data), and say who Udyam Assist is for and who registers those units.`,
  covers: [`Memorandum and Section 8`, `SSI, EM, UAM, Udyam`, `The registration rules`, `The steps on the portal`, `Udyam Assist for informal micro units`],
  terms: [
    [`Memorandum`, `An official statement by an enterprise that it exists, what it does and which size band it belongs to. The MSME Act calls the registration paper a memorandum.`],
    [`Section 8`, `The section of the MSME Act, 2006 that provides for filing the memorandum. Every later registration system takes its authority from it.`],
    [`SSI registration`, `Registration of small-scale industries under the older system, before 2006. Paper-based and slow.`],
    [`EM Part I and Part II`, `Entrepreneurs Memorandum. Part I was filed before starting, Part II after commercial production began (2006 to 2015).`],
    [`Udyog Aadhaar Memorandum (UAM)`, `The online, Aadhaar-based registration used from 2015 to 2020.`],
    [`Udyam registration`, `The PAN-based, paperless registration from 1 July 2020. Classification comes from tax data.`],
    [`Section 27`, `The section of the Act that lays down fines for knowingly giving false information in a memorandum.`],
    [`DigiLocker`, `A government app that stores official documents digitally. A certificate in DigiLocker is treated as the original.`],
    [`Informal micro enterprise (IME)`, `A very small business that works without books, GST or often a PAN: a street vendor, a home-based worker, a small tailor.`],
    [`Udyam Assist Platform (UAP)`, `The portal where an informal micro enterprise is registered with the help of a bank or another agency.`],
    [`SIDBI`, `Small Industries Development Bank of India. The ministry has appointed it to run the Udyam Assist Platform.`],
    [`Nodal agency`, `A bank, NBFC, microfinance institution, self-help group or cooperative bank that registers informal units on Udyam Assist.`],
  ],
  blocks: [
    `## Why a memorandum at all?
The government cannot help businesses it cannot see. To give a loan, a subsidy or a government order to the right unit, it first needs to **know the unit exists**, what it does and how big it is. The **MSME Act, 2006** therefore asks an enterprise to file a **memorandum**: a short, official statement that says *we exist, this is our activity, and this is our size band.*

**Section 8** of the Act is the legal basis. The lecture explains it as a must for any unit that wants MSME support. A note of care: as the Act is worded, filing is at the owner's discretion for micro and small units (and compulsory for medium manufacturers), but without a memorandum **no scheme benefit is available**, so in practice every unit that wants help registers. Check the current text if a client asks.

The memorandum serves **both sides**. The government gets a reliable database to plan its policies and budgets. The business gets **recognition**, easier credit and access to schemes.

## How registration changed over time
Each system fixed a pain point of the one before. This is the same story as the limits in lesson 4, told from the side of the form.`,

    sk(250, 'Four generations of MSME registration', [
      ...flow([
        { label: `SSI registration`, sub: `before 2006`, fill: `red` },
        { label: `EM Part I + II`, sub: `2006 to 2015`, fill: `orange` },
        { label: `Udyog Aadhaar`, sub: `2015 to 2020`, fill: `yellow` },
        { label: `Udyam`, sub: `from 1 July 2020`, fill: `green` },
      ], { y: 20, h: 70, gap: 44, max: 17 }),
      { t: 'note', x: 10, y: 120, w: 152, h: 96, text: `Paper forms,\nmany approvals,\nslow, little\ndigital data`, fill: `red`, size: 14 },
      { t: 'note', x: 206, y: 120, w: 152, h: 96, text: `Part I before\nstarting,\nPart II after\nproduction began`, fill: `orange`, size: 14 },
      { t: 'note', x: 402, y: 120, w: 152, h: 96, text: `Online, Aadhaar-\nbased, self-\ncertified,\ninvestment only`, fill: `yellow`, size: 14 },
      { t: 'note', x: 598, y: 120, w: 152, h: 96, text: `PAN-based, GST\nand ITR linked,\nautomatic\nclassification`, fill: `green`, size: 14 },
      { t: 'text', x: 380, y: 236, text: `The direction: less paper, more automatic checking`, size: 16, color: `#c2410c` },
    ]),

    `**Before 2006: SSI registration.** Small-scale industries registered on paper. There were many approvals and little digital data, so many units never came forward.

**2006 to 2015: Entrepreneurs Memorandum (EM).** The MSME Act introduced it in two parts. **Part I** was filed before starting, to say "we intend to begin". **Part II** was filed after commercial production or service began.

**2015 to 2020: Udyog Aadhaar Memorandum (UAM).** Fully online, based on the **Aadhaar** number and **self-certification**. The test was still **investment only**.

**From 1 July 2020: Udyam registration.** **PAN-based**, linked to **GST and income tax** data, so the classification is **automatic** and the whole process is **paperless**. This is the system a Corporate Mitra works on today.

## The rules of the Udyam process
- **Only the official portal registers MSMEs.** The ministry says that apart from its portal and the government single-window system, **no private website, agency or office** is authorised to register MSMEs. Anybody who offers to "do your MSME registration" for a fee is not the government.
- **It is free.** The portal states there is no fee or charge.
- **One enterprise, one registration.** Several units, several GSTINs, one PAN: still one Udyam number. All the NIC codes of its activities go on that one registration (next lesson).
- **Aadhaar first, then PAN.** The portal then pulls investment and turnover from the tax and GST data for an existing unit. A **new unit declares them** in the first financial year, after which the tax data takes over.
- **No documents are uploaded.** It is self-declaration, plus the database checks.
- **False information is punished.** The government relies on the applicant's word, so **Section 27** of the Act provides fines for **knowingly** misstating or hiding facts. The course gives the figure: a fine up to ₹1,000 on a first conviction, and ₹1,000 to ₹10,000 for a second or later one. Check the Act for the current amounts. The key word is **intentional**: an honest mistake is a different matter.
- **The certificate lives in DigiLocker.** A circular of **1 January 2025** says that banks and government bodies must accept the Udyam certificate obtained through DigiLocker as valid and authentic. Your client does not need a printout.`,

    sk(300, 'The Udyam registration, step by step', steps([
      { label: `Open the official portal`, desc: `only the government site; no agent is authorised` },
      { label: `Aadhaar and OTP`, desc: `of the proprietor, partner, karta or signatory` },
      { label: `PAN`, desc: `the portal fetches the ITR and GST data` },
      { label: `Business details`, desc: `address, bank, NIC codes for every activity` },
      { label: `Declare and review`, desc: `a new unit declares investment and turnover` },
      { label: `Submit`, desc: `number and e-certificate; a copy sits in DigiLocker` },
    ], { y: 30, dy: 48, tw: 250 })),

    `The screens themselves are covered in the next lessons. The point here is the order: **Aadhaar, then PAN, then the data fetch, then the declaration**.

## The other door: Udyam Assist Platform
Udyam needs a **PAN**. But millions of tiny units have **none**: street vendors, small shopkeepers, home-based workers, artists, tailors, repair shops, beauty parlours. They keep no books, they are outside GST, and they cannot easily prove they are MSMEs. So they cannot get loans or benefits. A government survey (2015-16, as the course quotes it) estimated that around **6.34 crore** such enterprises were not registered, mostly informal.

The government's answer is the **Udyam Assist Platform (UAP)**, launched on **11 January 2023**, part of the **MSME formalisation project**. **SIDBI** runs it. Its design is the word *assist*: the tiny unit does **not** register itself. A **nodal agency**, such as a **bank, NBFC, microfinance institution, self-help group or cooperative bank**, identifies the unit among its own customers, guides the owner, and, **with the owner's consent**, uploads the details. After verification the unit receives an **Udyam Assist certificate** and a **unique registration number (URN)**.

The certificate is treated **at par with the Udyam certificate only for priority sector lending**. It is a lower rung, not a full registration.

| | Udyam registration | Udyam Assist |
|---|---|---|
| Who | Micro, small and medium | Informal **micro** only |
| PAN | Required | **Not** required |
| GST | If mandatory | The unit has none (not registered) |
| Who registers | The owner (self-service) | A bank or other nodal agency |
| Certificate | Udyam certificate | Udyam Assist certificate |
| Benefits | The full list of MSME benefits | Mainly bank loans through priority sector lending |

A unit **already on Udyam cannot also register on UAP**. The course puts the UAP count at about **3.5 crore** (Week 1 gives the 10 May 2026 figure).`,

    sk(290, 'Udyam and Udyam Assist side by side', [
      { t: 'table', x: 110, y: 44, cols: [`Question`, `Udyam`, `Udyam Assist`], colW: [140, 200, 200], rowH: 34, title: `Which door does this unit use?`,
        rows: [
          [`Size`, `micro, small, medium`, `informal micro only`],
          [`PAN`, `needed`, `not needed`],
          [`GSTIN`, `if GST applies`, `none`],
          [`Registered by`, `the owner`, `bank or agency`],
          [`Benefits`, `all MSME benefits`, `bank loans (PSL)`],
        ] },
    ]),

    { analogy: `The four generations are **versions of a system**: v1 is paper, v2 an online form, v3 an ID-based login (Aadhaar), v4 **an integration**: the portal pulls data from the tax and GST systems instead of asking you to type it. Section 27 is the **audit control**: the system trusts what you declare, but if you knowingly lie there is a penalty. Udyam Assist is **assisted onboarding through a trusted partner**: the bank has already verified the customer, so it can create the account on the customer's behalf.` },

    `## Worked example: which door for which client?
| Client | Which registration | Why |
|---|---|---|
| **Ravi's biscuit unit**, a partnership with a PAN and a GSTIN | **Udyam** | A formal unit with a PAN. It is small and eligible for all MSME benefits |
| **Meena's tailoring unit**, with a PAN but no GSTIN | **Udyam** | PAN is available, GST is not mandatory. Aadhaar and PAN are enough |
| A **tea stall** owner with a bank account but no PAN and no books | **Udyam Assist**, through the bank | An informal micro unit; the bank registers him with his consent |
| A medium firm already on Udyam | Not UAP | UAP is only for informal micro enterprises, and a unit on Udyam cannot also register there |`,

    { warn: `Easy mistakes:
- **Using an agent's website.** Registration is free and only the official portal does it. Look-alike sites charge fees.
- **Registering twice for one PAN.** One enterprise, one registration.
- **Confusing Udyam Assist with full Udyam.** The UAP certificate is accepted at par only for priority sector lending, not for every benefit.
- **Giving wrong numbers on purpose.** Section 27 punishes *intentional* misstatement. Declare honestly and keep your workings.
- **Telling the client to print the certificate for the bank.** Banks must accept the DigiLocker version.` },

    { real: `When you meet a new client, decide the **door** first. Ask: "Do you have a PAN? Do you keep books? Is your turnover above the GST limit?" If the answers are yes, no, no and the unit is tiny, point them to their **bank**, which can register them on Udyam Assist. Later, when they get a PAN and file a return, you help them move up to full Udyam.` },

    { remember: `- A **memorandum** is the official statement that an enterprise exists, what it does and its band. Basis: **Section 8** of the MSME Act, 2006.
- History: **SSI** (before 2006, paper) → **EM Part I and II** (2006-2015) → **Udyog Aadhaar** (2015-2020, Aadhaar, investment only) → **Udyam** (from 1 July 2020, PAN, GST, ITR linked).
- Rules: **only the official portal**, **free**, **one enterprise = one registration**, Aadhaar first, no uploads, **Section 27** fines for knowing falsehood, **DigiLocker** certificate valid (circular of 1 January 2025).
- **Udyam Assist (UAP):** informal **micro** units, no PAN needed, registered by a **bank or other nodal agency** with consent, run by **SIDBI**; certificate valid for **priority sector lending**.` },
  ],
  quiz: [
    { q: `Which was the first fully online, Aadhaar-based MSME registration?`, o: [`SSI registration`, `Entrepreneurs Memorandum Part I`, `Udyog Aadhaar Memorandum`, `Udyam registration`], a: 2, why: `The Udyog Aadhaar Memorandum (2015) was online and Aadhaar-based. Udyam (2020) then moved to PAN and added GST and ITR data.` },
    { q: `How many Udyam registrations can one enterprise (one PAN) hold?`, o: [`One for each state`, `One for each GSTIN`, `One for each unit`, `Only one`], a: 3, why: `One enterprise gets one Udyam registration, with the NIC codes of all its activities on it.` },
    { q: `Which section of the MSME Act provides for the memorandum?`, o: [`Section 8`, `Section 27`, `Section 43B`, `Section 2`], a: 0, why: `Section 8 is the basis for filing the memorandum. Section 27 deals with the penalties.` },
    { q: `Who registers an informal micro enterprise on Udyam Assist?`, o: [`The owner alone`, `A bank or other nodal agency, with the owner's consent`, `The GST officer`, `The income tax officer`], a: 1, why: `Udyam Assist is assisted registration: the nodal agency uploads the details after the owner agrees.` },
    { q: `What is the Udyam Assist certificate treated as equal to?`, o: [`An NSIC certificate`, `A GST certificate`, `A PAN card`, `The Udyam certificate, for priority sector lending`], a: 3, why: `The UAP certificate is accepted at par with the Udyam certificate only for priority sector lending.` },
    { q: `What does the circular of 1 January 2025 say?`, o: [`Registration fee is now ₹500`, `A physical copy of the certificate is compulsory`, `Banks and authorities must accept the DigiLocker Udyam certificate`, `Medium firms must register again`], a: 2, why: `The circular directs banks and government authorities to treat the DigiLocker certificate as valid and authentic.` },
  ],
};
