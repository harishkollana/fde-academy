import { sk, flow, hub } from '../_kit.js';

export default {
  title: `Credit facilitation through banks: NSIC as the bridge to a loan`,
  goal: `You can explain why small units struggle to get bank credit, how NSIC helps for free, the kinds of credit a bank gives, the five Cs a banker judges, what documents a loan file needs, and how a Corporate Mitra adds value.`,
  covers: [`Why MSMEs need a bridge`, `What NSIC does`, `Types of credit`, `The five Cs`, `Documents and the professional opportunity`],
  terms: [
    [`Credit facilitation`, `Helping a borrower to reach a lender and get a loan sanctioned, without lending the money yourself.`],
    [`MOU`, `Memorandum of Understanding: a written agreement of how two parties will work together. NSIC has MOUs with many banks.`],
    [`Project loan`, `A complete loan package for a new unit, an expansion, modernisation or diversification: a term loan plus a working capital limit.`],
    [`Fund-based limit`, `A credit limit in which the bank actually lends money: a term loan, cash credit or overdraft.`],
    [`Non-fund-based limit`, `A limit in which the bank lends its name, not money: a bank guarantee or a letter of credit.`],
    [`Revolving credit`, `A limit that fills up again as you repay, so you can borrow again, up to the limit.`],
    [`Committed facility`, `A loan of a fixed amount with a fixed repayment schedule, such as a term loan.`],
    [`Five Cs`, `The five things a banker weighs: Character, Capital, Capacity, Collateral and Conditions.`],
    [`Debt-equity ratio`, `How much is borrowed for each rupee the owner has put in. 2:1 means ₹2 of loan for ₹1 of owner's money.`],
    [`CMA data`, `Credit Monitoring Arrangement data: the bank's standard sheets of past and projected figures, used to size a working capital limit.`],
    [`Performance and Credit Rating`, `A rating of a small unit's performance and creditworthiness by an approved rating agency, often at a subsidised fee.`],
    [`Basis point`, `One hundredth of one percent. 50 basis points is 0.5%.`],
  ],
  blocks: [
    `## Why a small unit needs a bridge
Banks do lend to MSMEs, but a small unit often cannot get a banker's attention, or it cannot meet the banker's conditions. The lecture lists the reasons:
- MSMEs are **capital shy**: they have little money of their own to put in.
- They do not have enough **collateral** to give as extra security.
- They fall back on **NBFC loans**, which are **costly**, and costly debt eats profit.
- They must **sell to bigger buyers on credit**, so their own cash is tied up while they wait to be paid.
- Every **expansion** needs fresh debt.

## The bridge: NSIC credit facilitation
**NSIC** (National Small Industries Corporation, a company set up under the Ministry of MSME) offers **credit facilitation**. It does **not lend**. It **represents the MSME to the bank**: it assesses the unit's needs and eligibility, prepares the case and puts it before a bank it has an **MOU** with, for **business loans or working capital**. NSIC pioneered this when there were few facilitators in the market.

**What the unit gains:**
- **No fee.** NSIC charges the MSME **nothing** for its hand-holding. (Banks that have signed MOUs pay NSIC a small facilitation fee, as the lecture says about 0.25% to 0.35% and never above 0.50%, so the unit pays nothing.)
- **A lower interest rate**, because NSIC negotiates with several banks.
- **Lower upfront fees.** Banks now charge a **processing fee** when they sanction a loan, and NSIC can negotiate it down.
- **A rating discount.** NSIC guides the unit to get a **Performance and Credit Rating** at a subsidised fee. The lecture says NSIC, SIDBI and others set up a rating agency for this, called **SMERA** (check its present name). A third-party rating helps NSIC win a further interest discount.
- **A wider choice of bank.** NSIC has MOUs with almost every bank, public and private, so the unit can pick the bank it prefers. The lecture's list (check NSIC's site for today's): Yes Bank, IndusInd, Federal Bank, Kotak Mahindra, ICICI, AU Small Finance Bank, Bank of Maharashtra, Bank of Baroda, Axis, State Bank of India, Central Bank, Canara Bank, Union Bank, HDFC, Karnataka Bank, Utkarsh Small Finance Bank and Punjab National Bank.`,

    sk(300, 'NSIC stands between the unit and the banks', [
      { t: 'box', x: 10, y: 100, w: 170, h: 84, label: `MSME unit`, sub: `needs a loan`, fill: `green` },
      { t: 'box', x: 295, y: 100, w: 170, h: 84, label: `NSIC`, sub: `facilitator, no fee`, fill: `yellow` },
      { t: 'box', x: 580, y: 28, w: 170, h: 52, label: `Public banks`, fill: `blue`, size: 17 },
      { t: 'box', x: 580, y: 118, w: 170, h: 52, label: `Private banks`, fill: `blue`, size: 17 },
      { t: 'box', x: 580, y: 208, w: 170, h: 52, label: `Small finance banks`, fill: `blue`, size: 16 },
      { t: 'arrow', x1: 184, y1: 142, x2: 291, y2: 142, label: `the case` },
      { t: 'arrow', x1: 469, y1: 124, x2: 576, y2: 54 },
      { t: 'arrow', x1: 469, y1: 142, x2: 576, y2: 142 },
      { t: 'arrow', x1: 469, y1: 160, x2: 576, y2: 232 },
      { t: 'text', x: 520, y: 280, text: `the bank lends; NSIC negotiates under its MOU`, size: 14, color: `#c2410c` },
      { t: 'note', x: 10, y: 214, w: 270, h: 56, text: `Lower rate, lower processing fee,\nrating discount, free of charge`, fill: `yellow`, size: 14 },
    ]),

    `## What kinds of credit?
- **Project loans:** for a **new unit**, or an **expansion, modernisation or diversification**. A project loan is a **comprehensive package** with two parts:
  - a **term loan** for fixed assets (land and building, plant and machinery);
  - a **working capital limit**, as **cash credit or overdraft**, against stock (raw material) or **book debts** (what customers owe), to pay day-to-day costs.
- **Non-fund-based limits:** **bank guarantees** and **letters of credit** (including foreign ones). The bank does not give cash; it gives its **promise**. These limits help a unit **conserve its own cash**.

Two ways the credit behaves: **revolving** credit (the most common: when you repay, the limit fills up again) and a **committed facility** (a long-term loan repaid on a schedule you chose).

## The five Cs a banker weighs
When a bank decides how much to lend, it asks five questions. The lecture calls them the five Cs.`,

    sk(236, 'The five Cs of credit', [
      ...[
        [`Character`, `score, no default`, `blue`],
        [`Capital`, `debt:equity ~2:1`, `green`],
        [`Capacity`, `profit, cash flow`, `yellow`],
        [`Collateral`, `security`, `orange`],
        [`Conditions`, `business use only`, `purple`],
      ].map(([a, b, f], i) => ({ t: 'box', x: 10 + i * 150, y: 20, w: 140, h: 70, label: a, sub: b, fill: f, size: 18 })),
      { t: 'note', x: 10, y: 120, w: 140, h: 96, text: `CIBIL score\nof the owner,\nrank of the unit,\nnot on the RBI\ndefaulters list`, fill: `blue`, size: 13 },
      { t: 'note', x: 160, y: 120, w: 140, h: 96, text: `Owner's own\nmoney versus\nborrowing.\nSome industries\nare allowed more`, fill: `green`, size: 13 },
      { t: 'note', x: 310, y: 120, w: 140, h: 96, text: `Can the unit\nrepay? Judged\nfrom profit and\ncash coming in`, fill: `yellow`, size: 13 },
      { t: 'note', x: 460, y: 120, w: 140, h: 96, text: `Assets the bank\ncan claim if the\nunit fails`, fill: `orange`, size: 13 },
      { t: 'note', x: 610, y: 120, w: 140, h: 96, text: `Loan money must\nnot be moved to\nnon-business\nuses`, fill: `purple`, size: 13 },
    ]),

    `- **Character:** the **financial character** of the owner and the unit: the **CIBIL score** (owner) and **rank** (unit), and **no name on the RBI defaulters list**. The bank usually asks for an **undertaking**.
- **Capital:** the **debt-equity ratio**. The globally accepted level is **2:1**, meaning ₹2 of loan for every ₹1 of the owner's money; some industries are allowed more.
- **Capacity:** the unit's **profit and cash inflow** available to repay.
- **Collateral:** security the owner can pledge, which comforts the bank if the unit fails. (Week 3 showed how the guarantee scheme can replace it.)
- **Conditions:** the loan must be used **only for the business**, not diverted.

## What the loan file needs
The lecture's list is "indicative, not exhaustive": always check NSIC's current checklist.

**About the owners** (a sole owner, the partners, or the promoters of a company): proof of **identity**, **residence** and **business address**, and a **statement of assets and liabilities** (of promoters, guarantors, directors) with the **latest income tax return**.

**About the unit:** name, address and **experience**, the activity, addresses of all **offices and plants**, the **shareholding pattern**, **balance sheets of the last three years with ITRs**, **projected balance sheets for the next two years**, and the **application in the prescribed format**.

**For working capital:** **CMA data**, in the bank's format, once the limit is above that bank's threshold (it differs by bank), and the **position of the unit's accounts with its present bankers**: are they run well, or are cheques dishonoured?

**For a term loan or project loan:** a **project report** (not needed for plain working capital), plus **estimates, quotations and the sanctioned building plan** if the loan is for land and building.

**Registrations:** **PAN, TAN, GST**, **Udyam**, shop and establishment; **constitutional papers** (partnership deed, or MOA and AOA), **certificate of incorporation**, **pollution control board clearance**, the **electricity board's sanction** of the power load and other statutory approvals.

**For working capital:** **month-wise production and sales** for the current year, and the values of **work in process, finished goods, debtors and creditors**.

## The professional opportunity
MSME owners can hire professionals for loan files, but that costs money, and NSIC does it free. Even so, **awareness is low**, and small units have **no staff who understand the documents**. Their papers are **unorganised**, and some are with outside consultants. Gathering them takes time and coordination, and the owner is busy "firefighting". So a Corporate Mitra can:
- **Identify** the nearest NSIC office and source the **loan application form** (on the website too).
- **Collect and arrange the annexures**, working with the unit's own team and its outside accountants.
- **Coordinate with the NSIC officer** and meet his documentation needs.
- **Follow up during processing**, because the bank may ask for more papers.

**Golden tips.** Find the nearest NSIC branch (the website lists them all). Download the NSIC bank credit facilitation scheme and read it, so you can answer the owner's questions. **Get the rating first.** NSIC usually asks for a Performance and Credit Rating before applying, because the loan may then be cheaper by about **50 basis points** on average.

## Worked example: why the rating pays
A unit wants a ₹2 crore loan at 10%.

| | Without a rating | With a rating that saves 0.5% |
|---|---|---|
| Rate | 10% | 9.5% |
| Interest a year | ₹20 lakh | ₹19 lakh |
| Saving a year | none | **₹1 lakh** |

If the rating costs less than that, and its fee is subsidised, the unit comes out ahead every year. A lower **upfront fee** is a further saving: for illustration, a 1% processing fee on ₹2 crore is ₹2 lakh, and negotiating it to 0.5% saves ₹1 lakh once.

**Emerging trends.** At first NSIC had **no competition**. Now:
- **Private financial facilitators** offer **doorstep service**, which NSIC may not, so you often need to fill that gap yourself.
- **Banks, especially private ones, appoint representatives** and pay a one-time commission for introducing a good MSME account.
- **NBFCs** knock on doors with **"competitive" rates**. The rate can look competitive and still be high, because small additions of words and charges change the real cost: compare the **total cost**.
- **SIDBI** has signed MOUs with **business member organisations**, and many banks run **awareness programmes** with MSME associations to find clients.`,

    { analogy: `NSIC is a **broker with pre-negotiated enterprise agreements**: it has volume contracts (MOUs) with many banks, so a small customer gets better terms than it could alone, and it does not charge the customer (the banks pay it a referral fee). The **five Cs** are the bank's **credit-scoring model** with five features. The **loan file** is the **API payload** the bank's system needs: if a field is missing, the request is rejected or delayed, so a good facilitator validates the payload before sending.` },

    { warn: `Easy mistakes:
- **Thinking NSIC lends.** It facilitates; the bank lends.
- **Paying an agent for NSIC's free service.**
- **Going to the bank before the rating**, then missing the 0.5% discount.
- **Sending an incomplete file.** The bank will ask again and each round costs weeks.
- **Mixing up fund-based and non-fund-based.** A guarantee does not give cash.
- **Judging an NBFC offer by the headline rate.** Compare fees and the total cost.
- **Using an old bank list or document list.** Always check NSIC's current pages.` },

    { real: `Prepare one **loan file checklist** from the lists above and use it as a template for each client. Start by telling the owner the three things you will do for free-of-cost NSIC facilitation: choose the bank, get the rating, collect the file. Then ask for the CIBIL report and the last six months of bank statements first, since they decide the bank's attitude.` },

    { remember: `- **NSIC credit facilitation:** NSIC represents the MSME to banks it has **MOUs** with. It **does not lend** and **charges the MSME nothing**.
- **Benefits:** lower rate, lower upfront fee, **rating discount** (about 50 basis points), wide choice of banks.
- **Credit types:** project loan (term loan plus working capital), cash credit or overdraft, **non-fund-based** (guarantee, LC); revolving versus committed.
- **Five Cs:** Character, Capital (debt:equity about 2:1), Capacity, Collateral, Conditions.
- **File:** owner KYC and assets and liabilities, 3 years of balance sheets and ITRs, 2 years projected, CMA data, project report (term loan), registrations, constitutional papers, clearances, production and sales data.
- **Your role:** identify the NSIC office, collect annexures, coordinate, follow up.` },
  ],
  quiz: [
    { q: `What does NSIC charge an MSME for credit facilitation?`, o: [`0.1%`, `0.25%`, `2%`, `Nothing`], a: 3, why: `NSIC does the hand-holding free of charge to the MSME. Banks with MOUs pay it a small facilitation fee.` },
    { q: `Who actually gives the loan in NSIC credit facilitation?`, o: [`The bank`, `NSIC`, `SIDBI`, `The rating agency`], a: 0, why: `NSIC acts as a bridge: the loan is sanctioned and disbursed by the bank.` },
    { q: `A ₹2 crore loan at 10% falls to 9.5% after a good rating. What is the yearly interest saved?`, o: [`₹1 lakh`, `₹50,000`, `₹5 lakh`, `₹10 lakh`], a: 0, why: `0.5% of ₹2 crore is ₹1 lakh a year (₹20 lakh at 10% becomes ₹19 lakh).` },
    { q: `Which "C" of credit looks at how profit and cash flow can repay the loan?`, o: [`Character`, `Capital`, `Conditions`, `Capacity`], a: 3, why: `Capacity is the unit's ability to repay, measured by profitability and cash inflow.` },
    { q: `A bank guarantee or letter of credit is an example of...`, o: [`A fund-based limit`, `A non-fund-based limit`, `A term loan`, `Equity`], a: 1, why: `In a non-fund-based limit the bank lends its promise, not money.` },
    { q: `For which loan is a project report needed but CMA data is not the main requirement?`, o: [`A cash credit limit`, `An overdraft`, `A term loan or project loan`, `A bill discounting limit`], a: 2, why: `A project report is required for term or project loans. For a working capital limit the banker asks for CMA data instead.` },
  ],
};
