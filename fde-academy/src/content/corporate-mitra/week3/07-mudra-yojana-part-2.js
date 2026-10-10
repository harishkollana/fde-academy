import { sk, flow } from '../_kit.js';

export default {
  title: `Pradhan Mantri Mudra Yojana, part 2: the "credit plus" support and the system behind it`,
  goal: `You can explain Mudra's credit plus approach, tell financial literacy from business literacy, say how credit bureaus, rating agencies and a guarantee fund make collateral-free lending work, and answer whether Udyam registration is needed for a Mudra loan.`,
  covers: [`Credit plus versus plain banking`, `Financial and business literacy`, `Last-mile lenders and rural incubation`, `Credit bureaus and ratings`, `The portfolio guarantee`],
  terms: [
    [`Credit plus`, `Mudra's approach: give the loan and also give skills, information and mentoring, before and after the loan.`],
    [`Financial literacy`, `Knowing about money products: loans, savings, insurance, digital payments, interest, and where to borrow and invest.`],
    [`Financial inclusion`, `Making sure every person can actually use a bank account, credit, insurance and payments.`],
    [`Business literacy`, `Knowing how to run a business: books, costing, pricing, cash flow, stock and customers.`],
    [`Ecosystem`, `The whole network of institutions, trainers, lenders and markets that helps a small business grow.`],
    [`Market maker`, `A body that brings buyers and sellers (here, small units, lenders, trainers and markets) together.`],
    [`Last-mile financier`, `The lender closest to the borrower, such as a village moneylender or a small local finance body.`],
    [`Small business finance company`, `A new kind of lender the scheme wants to create out of last-mile financiers, dedicated to small and micro businesses.`],
    [`Incubator`, `A place that nurtures a new idea until it becomes a working business.`],
    [`Credit bureau`, `An institution that records who borrowed what and whether they repaid. CIBIL is one example. Its record is the credit history behind a credit score.`],
    [`Rating agency`, `A body that assesses and grades an institution, such as a microfinance institution, on how sound it is.`],
    [`Portfolio credit guarantee`, `A guarantee on a whole portfolio of loans: a fund covers a share of the losses so lenders can lend without collateral.`],
  ],
  blocks: [
    `## More than money
Part 1 ended with a question: small units fail not only for lack of money but for lack of **skills, information, markets and confidence**. Mudra's answer is the **credit plus approach**: it gives **finance plus development and promotional support**. It aims to take a unit from a tiny start to a larger and **more sustainable** business, and the loan bands (Shishu, Kishore, Tarun, Tarun Plus) are the ladder.

The support has four parts:
- **Skill development:** training, workshops and capacity-building programmes.
- **Business guidance:** mentors and advisory services at each step.
- **Financial literacy:** teaching the entrepreneur how to use credit.
- **Information support:** schemes, markets and opportunities, and **how to claim them**.

On top of these, Mudra plays a **market maker** role: it **connects** micro enterprises, which may know nothing about schemes, with **financial institutions, training providers, markets and support agencies**, and builds the **ecosystem** around them.

## Credit plus against plain banking
The lecture contrasts the two approaches. A traditional bank looks at papers and collateral, lends, and moves on. Mudra aims at the **whole enterprise**.`,

    sk(262, 'A bank lends. Credit plus lends and keeps helping', [
      { t: 'table', x: 70, y: 44, cols: [``, `Traditional bank`, `Mudra credit plus`], colW: [120, 230, 270], rowH: 36, title: `Two ways of serving a small unit`,
        rows: [
          [`Gives`, `the loan only`, `loan + development help`],
          [`Support`, `limited after the loan`, `before and after the loan`],
          [`Security`, `papers and collateral`, `no collateral up to 20 lakh`],
          [`Aim`, `the unit survives`, `the unit grows and lasts`],
        ] },
    ]),

    `## Two kinds of literacy
**Financial literacy** is about **money products**. A literate entrepreneur knows **where funds can be had**, how to **manage credit**, what the **interest cost** is, how to **plan the repayment** and where to invest. The wider goal is **financial inclusion**: bank accounts, credit, insurance and payment systems reaching **all sections of society**. Literacy is the **demand side** (people know what to ask for); inclusion also needs the **supply side** (products are actually available). The two are twin pillars of empowerment.

**Business literacy** is about **running the business**. It covers **bookkeeping and keeping records**, **costing** (to control costs and raise profit), **financial ratios** (to read the unit's health), **cash flow** (what comes in, what goes out and when, to stay liquid and solvent), **stock management** (an optimum stock and less waste), **market knowledge** (customers and how to grow) and **credit management** (responsible borrowing and timely repayment).`,

    sk(300, 'Financial literacy and business literacy cover different things', [
      { t: 'box', x: 10, y: 10, w: 360, h: 52, label: `Financial literacy`, sub: `how to use money products`, fill: `blue` },
      { t: 'box', x: 390, y: 10, w: 360, h: 52, label: `Business literacy`, sub: `how to run the business`, fill: `green` },
      { t: 'note', x: 10, y: 76, w: 360, h: 178, text: `Which loans and sources of money exist\nSavings and bank accounts\nInsurance and digital payments\nInterest cost and repayment plan\nWhere to invest, and the return\nWhich limit or band fits the need`, fill: `blue`, size: 15 },
      { t: 'note', x: 390, y: 76, w: 360, h: 178, text: `Bookkeeping and records\nCosting, pricing, profit\nCash flow: in, out, when\nStock at the right level\nCustomers, market, marketing\nUsing the loan for its purpose`, fill: `green`, size: 15 },
      { t: 'text', x: 380, y: 276, text: `Financial literacy: where to get money. Business literacy: how to use it well.`, size: 16, color: `#c2410c` },
    ]),

    `## Grassroot institutions: from the moneylender to a formal lender
In many villages credit still comes from **one rich local lender who charges a very high interest rate**. Mudra's aim is to **formalise these last-mile financiers**: bring them under rules and give them a new shape, **small business finance companies**, a category of lender dedicated to small and micro enterprises. For the lender, the gain is **assured repayment** and a place in the formal system. For the entrepreneur, the gain is **credit at a fair rate**, faster and more transparent service from the **nearest source**.

**Rural innovation and incubation.** Mudra also supports **incubators** at the village level, so that **educated rural youth**, artists and skilled workers can turn local ideas into **viable micro enterprises** with guidance, mentoring and resources near home. The picture the lecture gives is an ecosystem in the village itself: a microfinance body, an incubator and a mentor, close to the idea.

## Credit bureaus: a repayment record that opens doors
A **credit bureau** is an institution that **collects, keeps and shares credit information** of borrowers with lenders. You know it from the **CIBIL score**, a measure of a person's credit-worthiness. Credit bureaus are now widely accepted in the microfinance sector too.

How it helps a small unit grow:
1. The borrower takes a loan and **enters the formal credit system**.
2. He **repays the principal and interest on time**.
3. The bureau **records this**, building a **positive credit history** and a rating.
4. On the next application the lender can **see the record at once**, assess him **quickly**, and lend with confidence.

For lenders, the record **reduces default, over-lending and multiple borrowing**, and makes lending more **transparent**. For borrowers, it creates the **discipline** that good repayment is what earns the next loan.`,

    sk(200, 'A repayment record is an asset that grows with each loan', [
      ...flow([
        { label: `Takes a\nMudra loan`, fill: `blue` },
        { label: `Repays on\ntime`, fill: `green` },
        { label: `Bureau records\nthe history`, fill: `yellow` },
        { label: `A good score\nis built`, fill: `orange` },
        { label: `Next loan:\nfaster, bigger`, fill: `pink` },
      ], { y: 30, h: 74, gap: 30, max: 16 }),
      { t: 'arrow', x1: 690, y1: 108, x2: 70, y2: 108, bend: -62, label: `the cycle repeats`, ly: 22 },
    ]),

    `**Rating agencies.** Mudra also works with rating agencies so that **microfinance institutions and other lenders** to the sector are **accredited and rated**. A rating gives bankers and investors a basis to trust them, helps **formalise** the sector, and draws more capital to it.

## The portfolio credit guarantee
Mudra loans of **up to ₹20 lakh need no collateral**. How does a lender feel safe? Through the **Credit Guarantee Fund for Micro Units (CGFMU)**, which covers eligible Mudra loans **sanctioned from 8 April 2015**. It is managed by the **National Credit Guarantee Trustee Company (NCGTC)**, promoted by the Government of India. The guarantee **brings down the cost of funds**, because a lender protected by a national agency can lend more cheaply. It guarantees the **portfolio**, the pool of loans, and not one loan at a time.

## Is Udyam registration needed for a Mudra loan?
**No.** Udyam registration is **not legally mandatory** for a PM Mudra loan. But banks and other lenders **may prefer or ask for it**, as proof of business activity, especially for larger loans or when the unit wants other MSME benefits. So registering is wise (and free).

## The Mudra picture in one view
- **Mudra** (an NBFC set up by the government) supports micro enterprises through **refinance and development support**.
- Four bands: **Shishu** up to ₹50,000, **Kishore** ₹50,001 to ₹5 lakh, **Tarun** ₹5 to ₹10 lakh, **Tarun Plus** ₹10 to ₹20 lakh.
- Eligible: manufacturing, trading, services, transport and agri-allied activities, **not farming**, **not corporates**.
- **Mudra Card** for working capital. Up to ₹20 lakh **without collateral**, guaranteed through the credit guarantee fund.
- **Support:** skills, financial literacy, business literacy, mentoring, bureaus, rating, small business finance companies.
- The vision, in the lecture's words: **fund the unfunded**, and promote entrepreneurship.

## Worked example: Suma's papad unit climbs the ladder
Suma makes papad in her village and pays other village women to help her. Over time, with a good repayment record:

| Step | Loan | What it buys | What builds up |
|---|---|---|---|
| 1 | **Shishu**, ₹30,000 | Flour, oil and packing material | She repays on time. The first bureau record |
| 2 | **Kishore**, ₹2 lakh | A grinder and working capital through a **Mudra Card** | The record grows. She attends a **financial literacy** workshop |
| 3 | **Tarun**, ₹6 lakh | A packing machine and a small shed | A better credit score. A mentor helps her cost her products |
| 4 | **Tarun Plus**, ₹12 lakh | A second line and a delivery vehicle for business use | The Tarun loan was repaid, so the Plus band opens |

At each step you, her Corporate Mitra, check that the loan **fits the stage**, help her **keep the books**, and remind her that **on-time repayment is her best asset**.`,

    { analogy: `Credit plus is a **managed service with onboarding and support**, not just a bare API key. The bank gives you the key; Mudra also gives you the **documentation, training, a mentor and an account manager**. A credit bureau is a **reputation service**: every on-time repayment is a **positive event written to a shared log**, which the next lender reads in milliseconds. The portfolio guarantee is **insurance at the pool level**, so a lender can serve customers it could not price one by one.` },

    { warn: `Easy mistakes:
- **Thinking credit history only matters for big loans.** The first small loan builds the record for all later ones.
- **Missing a repayment "just once".** The bureau records it, and it lowers the score.
- **Believing Udyam is compulsory for Mudra.** It is not, but a lender may ask.
- **Taking several small loans from different lenders** without telling any of them. Bureaus show it, and lenders refuse.
- **Telling a client the guarantee protects the borrower.** It protects the lender; the borrower still owes the money.
- **Ignoring the training.** Credit plus is part of the scheme: use the workshops and mentors.` },

    { real: `Treat the first Mudra loan as the start of a **credit file**. Teach the client three habits: keep a simple cash book, repay a day early rather than a day late, and check the credit score once a year. When they apply for the next band, you have a story to tell the bank: "five on-time instalments, a growing turnover and a trained owner".` },

    { remember: `- **Credit plus** = loan + skills + business guidance + financial literacy + information, **before and after** the loan. Mudra is also a **market maker** and builds the **ecosystem**.
- **Financial literacy** = money products and how to use them; **business literacy** = running the unit (books, costing, cash flow, stock, customers).
- **Last-mile lenders** (like the village moneylender) are formalised into **small business finance companies**; **incubators** nurture rural ideas.
- **Credit bureaus** (CIBIL and others) record repayment: a good history means faster and larger loans. **Rating agencies** rate the lenders.
- **CGFMU**, managed by **NCGTC**, guarantees the loan portfolio (loans sanctioned from 8 April 2015) so lending up to ₹20 lakh needs no collateral.
- **Udyam is not mandatory** for Mudra, though lenders may ask for it.` },
  ],
  quiz: [
    { q: `What does Mudra's credit plus approach add to a loan?`, o: [`A higher interest rate`, `A guarantee of profit`, `Skill training, financial literacy, information support and mentoring`, `Free machinery`], a: 2, why: `Credit plus pairs credit with development and promotional support so that the unit can use the money well and grow.` },
    { q: `Which of these is business literacy (not financial literacy)?`, o: [`Keeping books, costing and managing cash flow`, `Knowing which loan band fits`, `Understanding insurance products`, `Knowing the bank interest rate`], a: 0, why: `Business literacy is about running the business: bookkeeping, costing, pricing, cash flow and stock. Financial literacy is about money products.` },
    { q: `What does a good record at a credit bureau do for a borrower?`, o: [`Cancels the loan`, `Speeds up and eases the next loan`, `Gives a tax refund`, `Replaces the Udyam certificate`], a: 1, why: `A positive credit history lets the lender assess the borrower quickly and lend with more confidence.` },
    { q: `Who manages the Credit Guarantee Fund for Micro Units?`, o: [`NSIC`, `The GST Council`, `The National Credit Guarantee Trustee Company`, `KVIC`], a: 2, why: `CGFMU is managed by NCGTC, an agency promoted by the Government of India.` },
    { q: `Is Udyam registration legally mandatory to get a PM Mudra loan?`, o: [`No, but lenders may ask for it as proof of business`, `Yes, always`, `Yes, for loans above ₹50,000`, `No, and it is never useful`], a: 0, why: `It is not legally mandatory, but banks often prefer it as proof of business activity and for related MSME benefits.` },
    { q: `What is the aim of formalising "last-mile financiers" into small business finance companies?`, o: [`To close them down`, `To replace the banks`, `To raise interest rates`, `To give small units credit at a fair rate from a regulated nearby lender`], a: 3, why: `The aim is a new category of regulated lenders dedicated to small businesses, ending dependence on high-cost informal lenders.` },
  ],
};
