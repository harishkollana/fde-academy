import { sk, flow2 } from '../_kit.js';

export default {
  title: `PSB Loans in 59 Minutes: the online MSME loan portal`,
  goal: `You can explain what the portal is and what its 59 minutes really mean, say who can apply, what it costs, which documents it needs, how an application moves, and what its limits are, and you can guide a client to use it safely.`,
  covers: [`Myths and fears about loans`, `What the portal is and offers`, `Fees, limits and rates`, `The application, step by step`, `Documents, advantages and limits`],
  terms: [
    [`PSB Loans in 59 Minutes`, `An online loan portal developed by SIDBI with public sector banks, with the Government of India. It gives a digital in-principle approval within 59 minutes.`],
    [`In-principle approval`, `A first, machine-generated "yes, you look eligible". It is not the final loan sanction.`],
    [`AI and machine learning`, `Software that studies data and improves its own judgements. The portal uses them to assess loan applications without human intervention.`],
    [`Product matching`, `The portal matches the borrower's request with the loan products of the participating lenders.`],
    [`Digital sanction letter`, `The online letter you can download after paying a small fee. It shows the lender's in-principle offer.`],
    [`Convenience fee`, `The ₹1,000 plus GST charged for the digital sanction letter. It is the only fee on the portal.`],
    [`Term loan`, `A loan with the whole amount paid out at the start and repaid on a schedule, usually for assets and expansion.`],
    [`Working capital limit`, `A limit for day-to-day costs. It is reviewed every year: the bank may raise it, cut it, continue it or withdraw it.`],
    [`ITR in XML format`, `The income tax return in the electronic file format used for uploading to government and bank systems.`],
    [`Ineligible application`, `An application the system rejects, for example because there are no six months of bank statements.`],
    [`Waiting period`, `The 60 days an ineligible applicant must wait before applying again.`],
    [`Phishing / fake site`, `A copy of a real website made by fraudsters to steal money or data.`],
  ],
  blocks: [`## Why small owners fear loans
MSMEs have **few skilled staff** and **little time**: when the owner is away, output and performance fall. Their money needs are often **sudden and unplanned**. Bank loans are hard to get because of **complex documents, slow checking** and **repeated visits** to banks. They do not get the attention of bank managers. And they believe **myths**:`,

    sk(262, 'Myths about loans, and what the portal says', [
      { t: 'table', x: 45, y: 44, cols: [`The myth`, `The fact on this portal`], colW: [320, 350], rowH: 34, title: `Five myths`,
        rows: [
          [`Loans take months`, `digital letter in 59 minutes`],
          [`Only for sick businesses`, `for growth and working capital`],
          [`Only big firms get loans`, `MSME loans start at ₹10 lakh`],
          [`Collateral is always needed`, `CGTMSE cover is possible`],
          [`New units are not eligible`, `true here: needs 6 months of data`],
        ] },
    ]),

    `Behind the myths sit real fears: **the burden of debt**, **losing assets and guarantees**, **a long process with many documents**, **rejection**, **hidden charges** and **jargon**, plus a lack of financial awareness. Each of these keeps MSMEs away from formal credit.

## What the portal is
**psbloansin59minutes.com** is a new-generation **digital lending platform** developed by **SIDBI** with the public sector banks, as an initiative of the **Government of India and SIDBI**. It uses **AI and machine learning** to **automate and digitise the loan process** for borrowers and lenders. It has become one of India's largest online loan platforms. The operator is a company in which SIDBI and the public sector banks hold most of the shares. For data safety it uses encryption that meets the **ISO 27001** standard to protect sensitive GST, ITR and banking data.

**What it offers** (the lecture's figures, as recorded; check the portal for today's):
- **MSME business loans** from **₹10 lakh to ₹5 crore**, recently raised to **₹10 crore**.
- **Mudra loans** (the earlier limit of ₹10 lakh, now **₹20 lakh**).
- **Home loans** up to ₹2 crore, **personal loans** up to ₹20 lakh and **vehicle loans** up to ₹1 crore.

**What you can do on it:** download the **common loan form**, attach documents, track the application, pay the fee **online** and get a **digital sanction letter**. At the in-principle stage there is **no human involvement**.

**What an MSME can borrow for:** buying **plant and machinery**, **expanding** the business, **working capital**, building **infrastructure**, **modernising technology**, buying **raw material**, increasing operations, **diversifying** and **extending products or services**.

**What the system looks at.** Because it is built on machine learning, its tests are refined over time, but the lecture lists these: **repayment capacity**, **details of existing loans**, **earning capacity**, the **quality of the security and any extra security**, the **CIBIL score of the owners** and the **payment history**.

## Fees, limits and rates`,

    `| Item | The lecture's figures |
|---|---|
| Registration fee | **None** |
| Application fee | **None** (and none for uploading the application) |
| **Digital sanction fee** | **₹1,000 plus GST** |
| Loan size | ₹10 lakh to ₹5 crore, recently ₹10 crore |
| Interest rate | From about **6.8%** up to as high as **21%**, depending on the strength of the income tax return and the **regularity and volume of GST returns** |
| Processing fee | About **0.1% to 6%** (charged by the lender) |
| Repayment period | **1 year to 15 years** |
| Security | **CGTMSE cover** is possible |

**Partner lenders** include almost every public sector bank (State Bank of India, Canara Bank, Bank of Baroda, Punjab National Bank, Indian Bank, Bank of India, Bank of Maharashtra, Central Bank, IDBI, Indian Overseas Bank, Punjab and Sind Bank, UCO Bank, Union Bank), SIDBI itself, and some private banks (ICICI, Federal, IDFC First, Yes Bank, Axis Finance). The list grows every year.

## The application, step by step`,

    sk(262, 'From registration to the money', flow2([
      { label: `Register, make\na login`, fill: `blue` },
      { label: `Fill the form,\nattach papers`, fill: `blue` },
      { label: `Pick banks\nand branches`, fill: `yellow` },
      { label: `Digital letter:\n₹1,000 + GST`, fill: `orange` },
      { label: `Bank calls, checks,\nsanctions`, fill: `orange` },
      { label: `Charge created,\nmoney paid`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `1. **Go to the portal.** Check that it is the real one: it is a **SIDBI initiative**. **Beware of fake websites**: fraudsters sometimes build copies, so type the address yourself and be very careful before you enter any data.
2. **Register**: create a **login ID and password** with a username, **mobile number** and **email**.
3. **Choose the purpose** of the loan.
4. **Study the form** and the information it needs, and **collect the information and documents**. Some need uploads, some links.
5. **Fill in the online form.** It may take **more than one sitting**: what you have filled is **saved**, so you do not have to start again.
6. **Attach the documents** and **choose your banks and branches** (you choose at least three branches, or more than one bank).
7. **Submit.** The portal **matches** your request with lenders' products. If lenders are interested, it tells you by email and SMS and offers a **digital sanction letter** for **₹1,000 plus GST**.
8. **Pay and download** the digital letter. **A digital letter is not a loan.**
9. **The banks or NBFCs contact you** by phone or email, often calling you to meet. They may ask for **more documents**, **check the security** and **value it**. Then the **bank issues its own sanction letter** with terms and conditions.
10. **The MSME meets the conditions.** The **charge** on the security is created, and **the loan is paid**.

**How fast?** The **digital letter can arrive within 59 minutes** of submitting the papers. After that, **post-approval work usually takes 7 to 10 working days** to disbursal. The loan that owners think will take months can reach them in about two weeks. Note that **59 minutes is the time to a machine's in-principle answer, not to the money.**

## Documents
- **GST details.** One GST registration: give the **GSTIN, GST username**, and an **OTP**. Several registrations: give the details and an OTP for **each**, and mark **one as the primary**. If the borrower is **not registered under GST**, sales details are filled in **by hand with a self-declaration**.
- **Income tax:** the **last three years' ITRs in XML format**. For a **working capital limit**, at least **last year's** ITR in XML.
- **Bank statements:** **six months**, for **up to three accounts**.
- **KYC** of the owner, partners, directors or promoters; **basic documents of the entity**; **details of the collateral security**; **bank-account documents**.

The portal shows the current list free of charge.

## What is good, and what is not
**Advantages:** advanced algorithms and analytics; **real-time tracking**; **choice of lender**; **7 to 10 working days** from sanction to money on average; **one application for 21 or more banks**; contactless and easy; **apply anywhere, any time**; fast in-principle approval in **59 minutes**.

**Limits.**
- The **digital approval is not a guarantee**. It is only a machine check, a signal.
- **Your application goes to other branches too**, not only to the ones you chose, and you may get calls from several banks.
- MSMEs are **not tech-savvy**, and many **do not know the portal exists**.
- **No six months of bank statements, no ITR, or a unit less than a year old: not eligible.** New MSMEs are left out. **Defaulters** cannot apply.
- An **ineligible applicant must wait 60 days** before applying again.
- Final sanction and disbursement still depend on the **chosen bank's checks**.`,

    sk(238, 'Not eligible on this portal (as the lecture says)', [
      ...[
        [`No bank statements for six months`, `new units are left out`],
        [`No income tax return`, `units under a year old cannot qualify`],
        [`A loan defaulter`, `past non-payment bars the application`],
        [`A trader or other excluded party`, `check the portal's current rules`],
      ].flatMap(([a, b], i) => [
        { t: 'mark', x: 34, y: 34 + i * 48 },
        { t: 'text', x: 60, y: 34 + i * 48, text: a, size: 17, bold: true, anchor: `start` },
        { t: 'text', x: 400, y: 34 + i * 48, text: b, size: 14, color: `#4a5568`, anchor: `start` },
      ]),
      { t: 'note', x: 120, y: 206, w: 520, h: 28, text: `Rejected applicants may re-apply after 60 days.`, fill: `yellow`, size: 14 },
    ]),

    `## Worked example: two clients, two answers
- **Ravi** wants **₹8 lakh** for the namkeen line. The portal's **MSME business loan starts at ₹10 lakh**, so the plain business-loan route does not fit. He could apply under the portal's **Mudra** category, or approach a bank directly. His firm has Udyam, a GSTIN, three ITRs and clean bank statements, so he would pass the eligibility tests.
- **Meena** has sales of ₹8 lakh, no GSTIN and **no ITR**, because her income is below the tax limit. On this portal she is **not eligible**. The advice: **file an ITR** (it builds a record that every lender wants), keep six months of clean bank statements and a good CIBIL score, then try again. Until then, a Mudra loan directly through her bank is the route.

## The professional opportunity
Awareness of this portal among MSMEs is **low**, and they cannot judge its web-portal requirements themselves. Owners and staff find the process **hard to follow** and **depend on personal contacts**, then pay **higher interest and tougher terms**. A Corporate Mitra can:
- **Explain the benefits** of the portal and help the client **register**.
- **Separate the information and documents** the form needs.
- **Apply on the client's behalf** and **track the digital sanction**.
- **Go with the owner to the bank** after the digital letter: first-time owners are nervous and want an expert beside them.
- Help with **post-sanction compliance**.

**Golden tips.** Visit the portal regularly and keep learning the exact information and documents. Spread awareness whenever you can. Take on a client's request whenever it comes.

**Emerging trends.** Many **banks have started online sanction on their own portals**. **NBFCs** offer **doorstep service** for MSME loans. Online loans are becoming **popular** among MSMEs, but **small towns and villages still use them little** because of weak internet access and low digital awareness.`,

    { analogy: `This portal is an **automated pre-approval pipeline**: a **machine-learning model scores the application** (a risk model on GST, ITR and bank data) and returns an **instant provisional decision**, which a **human underwriter** (the bank) must confirm later. The **digital letter** is a **soft hold**, not a committed transaction. The **single common form sent to many banks** is a **broadcast request**: it creates competition but also a flood of replies. And the fake-site warning is **phishing awareness**: always type the real URL yourself.` },

    { warn: `Easy mistakes:
- **Taking the digital letter as a loan.** It is a signal; the bank decides.
- **Paying a fee to anyone for "registration".** The portal has no registration or application fee. The only fee is ₹1,000 plus GST for the digital letter.
- **Using a fake website.** Type the address yourself and check it.
- **Applying without six months of statements or an ITR.** The application will be rejected, and you must wait 60 days.
- **Choosing too many branches and then being surprised by calls.** Expect several banks to contact you.
- **Quoting rates and limits as fixed.** They are as recorded in the lecture: check the portal.
- **Skipping the post-sanction conditions.** The charge must be created before the money is paid.` },

    { real: `Before using the portal for a client, do the **eligibility check**: Is the unit more than a year old? Has it filed at least last year's ITR (three years for a term loan)? Are six months of bank statements clean? Is the CIBIL score good? Is there GST data? If yes, collect the documents, register, and apply together with the owner. If not, tell the client what to fix, for example filing the ITR, and when to come back.` },

    { remember: `- **PSB Loans in 59 Minutes:** an online loan portal built by **SIDBI** with public sector banks (Government of India and SIDBI initiative), using AI and ML.
- **Offers:** MSME loans **₹10 lakh to ₹5 crore (recently ₹10 crore)**, Mudra loans (to ₹20 lakh), home, personal and vehicle loans.
- **Fees:** **no registration or application fee**; **₹1,000 plus GST** for the digital sanction letter. Interest about **6.8% to 21%**; tenor **1 to 15 years**; CGTMSE cover possible.
- **59 minutes** = a **digital in-principle letter**. The bank's sanction and money take about **7 to 10 working days** more.
- **Documents:** GST details, ITRs of 3 years in XML (1 year for working capital), 6 months' bank statements (up to 3 accounts), KYC, entity papers, security details.
- **Not eligible:** no 6 months' statements, no ITR, a unit under a year old, defaulters. Wait **60 days** to re-apply.
- **Beware** fake websites. **Your role:** explain, register, collect documents, apply, track, accompany, and comply.` },
  ],
  quiz: [
    { q: `What is the fee for the digital sanction letter on the portal?`, o: [`₹500 plus GST`, `₹10,000`, `₹1,000 plus GST`, `0.1% of the loan`], a: 2, why: `The only fee is ₹1,000 plus GST for the digital sanction letter. There is no registration or application fee.` },
    { q: `What does "59 minutes" refer to?`, o: [`The time for the money to reach the account`, `The time to a digital in-principle approval after the papers are submitted`, `The time to register`, `The time a bank takes to visit`], a: 1, why: `The digital letter can come within 59 minutes. The bank's own sanction and disbursal take usually 7 to 10 working days more.` },
    { q: `What is the smallest MSME business loan on the portal, as the lecture says?`, o: [`₹1 lakh`, `₹5 lakh`, `₹10 lakh`, `₹25 lakh`], a: 2, why: `MSME business loans start at ₹10 lakh and go up to ₹5 crore (recently ₹10 crore).` },
    { q: `Who gives the final approval and disbursement of the loan?`, o: [`The lender, after its own checks`, `The portal`, `SIDBI's computer`, `The borrower`], a: 0, why: `The digital approval is in-principle only. The chosen bank or NBFC verifies and decides.` },
    { q: `Which of these makes an applicant ineligible on the portal?`, o: [`Having a GSTIN`, `Having a good CIBIL score`, `Having three years of ITRs`, `Having no six months of bank statements`], a: 3, why: `Without six months of bank statements (and without an ITR) an applicant is ineligible, so new units are left out.` },
    { q: `After an application is rejected as ineligible, when can the applicant try again?`, o: [`After 60 days`, `Immediately`, `After 5 years`, `Never`], a: 0, why: `The lecture gives a waiting period of 60 days before re-applying.` },
  ],
};
