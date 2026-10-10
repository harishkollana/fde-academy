import { sk, hub } from '../_kit.js';

export default {
  title: `Government schemes for MSMEs: a map of what exists`,
  goal: `You can name the three places MSME benefits come from, group the main central schemes by what they do for a unit (money, technology, skills and markets, places and help), and match a client's need to the right scheme.`,
  covers: [`Three sources of benefits`, `The National Board and the funds`, `Schemes by purpose`, `MSME Champions`, `Benefits beyond schemes`],
  terms: [
    [`MSME Act, 2006`, `The law that defines MSMEs, sets up the National Board and the funds, and protects small suppliers' payments.`],
    [`National Board for MSME`, `A body set up under Section 3 of the Act. It advises the central government on policy for MSMEs.`],
    [`Credit guarantee`, `A government-backed promise to cover part of a lender's loss if the borrower cannot repay. It lets banks lend without collateral.`],
    [`Subsidy`, `Money the government pays towards a cost, so the entrepreneur pays less.`],
    [`Credit-linked subsidy`, `A subsidy paid only when a bank loan is also taken, such as PMEGP.`],
    [`Moratorium`, `A period at the start of a loan in which no instalments are due.`],
    [`Cluster`, `A group of small units in the same trade and place, such as a pottery village or a leather area.`],
    [`ZED`, `Zero Defect, Zero Effect: making goods without defects and without harming the environment.`],
    [`Lean manufacturing`, `A way of working that cuts waste of material, time, space and stock.`],
    [`Incubation`, `Support for a new idea or start-up: space, mentoring and money in the early stage.`],
    [`Presumptive taxation`, `A simple way of paying income tax on a fixed share of turnover, without detailed books.`],
    [`De-reservation`, `Removing an item from the list of products only small units could make.`],
  ],
  blocks: [
    `## Why a map first
Week 3 is the money-and-schemes week. Before you learn any one scheme in detail, you need to know **how many exist and where each fits**, otherwise a client mentions "that loan scheme" and you cannot tell which. This lesson gives the map. Later lessons take the main schemes one by one: the Chapter-3 topics on arranging finance, clearances and machinery, **Mudra**, **PMEGP**, **Lean**, **credit guarantee** and the interest-support and export schemes.

The lecture says support comes from **three kinds of provider**: the **Central Government** (and its schemes), **banks and financial institutions**, and **private NBFCs** (non-banking finance companies). This lesson is about the first. Banks and NBFCs come in the finance lessons.

## The three sources of benefits`,

    sk(240, 'MSME benefits come from the Act, from other laws, and from schemes', [
      { t: 'box', x: 10, y: 12, w: 230, h: 46, label: `The MSME Act`, fill: `blue` },
      { t: 'box', x: 265, y: 12, w: 230, h: 46, label: `Other laws`, fill: `green` },
      { t: 'box', x: 520, y: 12, w: 230, h: 46, label: `Central schemes`, fill: `orange` },
      { t: 'note', x: 10, y: 72, w: 230, h: 150, text: `Legal recognition (Udyam)\nPayment in 15 to 45 days\nInterest on late payment\nConciliation, arbitration\nNational Board and funds\nPreference in tenders`, fill: `blue`, size: 14 },
      { t: 'note', x: 265, y: 72, w: 230, h: 150, text: `Income tax: presumptive\ntaxation, simpler books\nRBI: priority sector\nlending, cheaper credit\nSome states: stamp duty,\nelectricity concessions`, fill: `green`, size: 14 },
      { t: 'note', x: 520, y: 72, w: 230, h: 150, text: `Credit: CGTMSE, PMEGP,\nMudra\nTechnology: CLCSS, ZED,\nLean\nSkills and markets: ESDP,\nPMS, NSIC`, fill: `orange`, size: 14 },
    ]),

    `**1. The MSME Act, 2006.** It gives legal recognition, assures **payment within 15 to 45 days** of supply, gives the supplier a **right to interest** on delay, offers **conciliation and arbitration** for disputes with buyers, and gives **preference in government tenders**. It also sets up two bodies:
- The **National Board for MSME** (Section 3), chaired by the Union Minister for MSME. Members include ministers of some state governments, Members of Parliament, secretaries of ministries, officers of the RBI and banks, and representatives of MSME associations and trade unions. Its job (Section 5) is to **examine what affects MSMEs, review the government's policies and recommend changes**, and to advise on the use of the **funds**.
- **Funds** (Sections 12 and 13). The government may create funds and credit grants to them. Through these the Government has set up, for example, the **National Small Industries Corporation (NSIC)**, which gives equipment leasing, credit support and raw material assistance, and the **credit guarantee schemes**.

**2. Other laws.**
- **Income tax.** The lecture says MSMEs enjoy **presumptive taxation** (a reduced amount of tax) and **flexibility in keeping books**. The course notes that the Income Tax Act, 1961 has been re-enacted in 2025; check the current rule before you advise.
- **RBI rules.** MSMEs get **priority sector lending**, a **lower rate of interest**, and **easy bill discounting through an online system** (the system is called **TReDS**, a platform where a seller can sell an unpaid invoice to a financier and get the money at once).
- **Some states** give **stamp duty and octroi benefits** and **electricity concessions**.

**3. Central government schemes.** The Ministry of MSME runs the schemes below. Their aim is cheap credit, technology upgrading, market development, infrastructure, and skill training for the workers.

## The main schemes, by what they do for the unit`,

    sk(300, 'Schemes grouped by the need they meet', [
      { t: 'box', x: 10, y: 12, w: 175, h: 44, label: `Money`, fill: `green` },
      { t: 'box', x: 198, y: 12, w: 175, h: 44, label: `Technology`, fill: `blue` },
      { t: 'box', x: 386, y: 12, w: 175, h: 44, label: `Skills, markets`, fill: `orange` },
      { t: 'box', x: 574, y: 12, w: 175, h: 44, label: `Places, help`, fill: `purple` },
      { t: 'note', x: 10, y: 68, w: 175, h: 196, text: `CGTMSE\n(loan guarantee)\nMCGS-MSME\nStartup guarantee\nEmergency credit line\nPMEGP (subsidy)\nMudra loans`, fill: `green`, size: 14 },
      { t: 'note', x: 198, y: 68, w: 175, h: 196, text: `CLCSS: 15% capital\nsubsidy on machines\nZED certification\nLean manufacturing\nInnovation: design,\npatents, trademarks`, fill: `blue`, size: 14 },
      { t: 'note', x: 386, y: 68, w: 175, h: 196, text: `ESDP: training for\nyouth and women\nPMS: trade fairs,\nexhibitions\nNSIC: government\ntenders\nNational SC-ST Hub\nPM Vishwakarma`, fill: `orange`, size: 14 },
      { t: 'note', x: 574, y: 68, w: 175, h: 196, text: `MSE-CDP: clusters,\ncommon facility\ncentres\nSFURTI: traditional\nindustries\nASPIRE: rural\nenterprise\nChampions portal`, fill: `purple`, size: 14 },
    ]),

    `**Money.**
- **CGTMSE** (Credit Guarantee Fund Trust for Micro and Small Enterprises): the government guarantees part of a loan so a bank can lend **without collateral**. The course gives the loan ceiling as up to ₹10 crore, with cover of about 75% to 85% and higher cover for micro units, women-owned units and the North East. A later slide quotes ₹2 crore: the ceiling has been raised over time, so **check the current limit** on the trust's site. Lesson 12 covers it.
- **Mutual Credit Guarantee Scheme for MSMEs**: aimed at the manufacturing sector, with the course giving **60% guarantee cover** on term loans to buy plant, machinery and equipment, for eligible loans up to ₹100 crore (the course says the repayment is up to 8 years with 2 years of moratorium).
- **Credit Guarantee Scheme for Startups**: for recognised start-ups; the course gives cover of up to 85% of the loan in default for loans up to ₹10 crore, and 75% for ₹10 crore to ₹20 crore.
- **Emergency credit line guarantee** (a time-bound package, as in the Covid period): extra collateral-free working capital up to 20% of the outstanding credit.
- **PMEGP**: a credit-linked subsidy of **15% to 35%** of the project cost for new non-farm units (lessons 8 to 10).
- **Mudra (PMMY)**: collateral-free loans to small non-corporate, non-farm units in four bands: **Shishu** (up to ₹50,000), **Kishore** (₹50,001 to ₹5 lakh), **Tarun** (₹5 lakh to ₹10 lakh) and **Tarun Plus** (₹10 lakh to ₹20 lakh, for those who repaid a Tarun loan) (lessons 6 and 7). Older notes stop at ₹10 lakh.

**Technology.** **CLCSS** (Credit Linked Capital Subsidy Scheme): a **15% upfront capital subsidy** for technology upgrade and modern machinery; check whether it is open. **ZED**, **Lean** and the innovation scheme sit under MSME Champions (below).

**Skills and markets.** **ESDP** (Entrepreneurship and Skill Development): training to motivate youth, women and weaker groups to become entrepreneurs. **PMS** (Procurement and Marketing Support): help to take part in trade fairs and exhibitions in India and abroad. **NSIC** (government tenders; lesson 9 of Week 2). **National SC-ST Hub**, **PM Vishwakarma** (for artisans and craftspeople).

**Places and help.** **MSE-CDP** (Cluster Development): common facility centres and infrastructure for groups of units. **SFURTI**: regeneration of traditional industries. **ASPIRE**: rural industries and entrepreneurship (the speech-to-text wrote "Quire"). **Khadi and Gramodyog schemes**, promotion of MSMEs in the **North East and Sikkim**, **tool rooms and technical institutes**, and the **Champions portal**.

## MSME Champions: three pillars in one scheme
The MSME Champions Scheme is a central initiative to **modernise manufacturing, cut waste, support innovation and help Indian units compete nationally and globally**. It has three parts.`,

    sk(300, 'The Champions scheme: three parts and one portal', [
      ...hub(
        { label: `MSME\nChampions`, fill: `yellow` },
        [
          { label: `ZED certification`, sub: `zero defect, zero effect`, fill: `green` },
          { label: `Lean manufacturing`, sub: `cut waste, raise output`, fill: `blue` },
          { label: `Innovation`, sub: `incubation, design, IPR`, fill: `orange` },
        ],
        { cx: 380, cy: 154, rx: 250, ry: 108, r: 52, bw: 210, bh: 58 },
      ),
      { t: 'note', x: 130, y: 250, w: 500, h: 44, text: `Champions portal: one place for grievances and\nguidance on finance, technology and marketing.`, fill: `yellow`, size: 14 },
    ]),

    `- **ZED (Zero Defect, Zero Effect):** zero defect means no flaws in the product, so no waste of raw material. Zero effect means no harm to the environment. Units that earn the certification can get **graded incentives**, such as interest concessions and processing-fee waivers from participating banks.
- **Lean manufacturing:** cut waste in inventory, production and space, and raise productivity (lesson 11 of Week 3).
- **Innovation:** incubation, design support and help with **patents and trademarks**.

The benefits are generally for **registered manufacturing MSMEs**.

## A little history: reserved items
Until **April 2015**, some products were **reserved** for small-scale industries. Other firms could not make them without an **industrial licence**. The idea was to protect home manufacturing from large units. In April 2015 the government **de-reserved** these items, to bring in better technology and investment. Today large firms may make items such as **bread, pickles, chutneys and mustard oil** without a licence. The definition of MSME has also been widened (lessons 2 to 4): the 2025 limits are ₹2.5 / 10 crore, ₹25 / 100 crore and ₹125 / 500 crore.

## More benefits that need no scheme
The lecture also lists: assured payment and interest on delay; **preference in government tenders**; time-bound conciliation and arbitration; **reimbursement of ISO certification costs**; **priority sector lending** and a lower rate of interest; **easy bill discounting**; **presumptive tax**; **NSIC** help with testing facilities and a **subsidy on performance and credit rating**; waiver of earnest money; a **15% price preference** in tenders; and **free tender documents**. Many of these depend on the unit being registered, which is why Week 2 came first.`,

    `## Worked example: matching needs to schemes
| Client and need | Look at first | Why |
|---|---|---|
| **Meena** wants ₹1.5 lakh for two more machines | **Mudra, Kishore** band | A micro non-farm unit; the Kishore band is ₹50,000 to ₹5 lakh |
| **Meena** wants to train two helpers | **ESDP** and training schemes | Skill support for the unit's workers |
| **Ravi** has a bank that wants collateral for a larger loan | **CGTMSE** | The guarantee lets the bank lend without collateral |
| **Ravi** wants to cut waste on the biscuit line | **Lean** under MSME Champions | The scheme helps reduce waste in materials and stock |
| **Ravi** wants to sell packed biscuits to government hostels | **NSIC** registration | Needed to bid in government purchase |
| A **new** youth wants to start a unit with no money | **PMEGP** | A subsidy-linked loan for new units |
| A pottery village wants a shared kiln | **MSE-CDP** (cluster scheme) | Funds common facility centres |

Always check that the unit is **eligible** (registered, manufacturing or service, size band, location, category). Each scheme has its own conditions.`,

    { analogy: `The schemes are **managed services in a cloud catalogue**. Credit guarantee is **insurance for the lender**, which lowers the risk so the bank agrees. A subsidy is a **credit voucher** against a cost. The Udyam number is the **account** without which none of the services can be activated. The Champions portal is the **support desk**. The National Board is the **architecture board** that reviews the catalogue and recommends changes.` },

    { warn: `Easy mistakes:
- **Quoting a limit without a date.** Loan ceilings, subsidy rates and guarantee cover are revised by the government. Say "the course gives ..., check the scheme's own site".
- **Promising a scheme that is closed or renamed.** Check the live page first.
- **Mixing scheme names.** CGTMSE is a guarantee, PMEGP is a subsidy-linked loan, Mudra is a collateral-free loan, CLCSS is a capital subsidy.
- **Forgetting registration.** Nearly all of these need an Udyam number.
- **Assuming traders are covered.** Many manufacturing schemes exclude them (Week 2, lesson 6).
- **Overlooking the state.** State governments add their own subsidies. Ask for them.` },

    { real: `Keep a **scheme sheet** for your area: the scheme name, who it is for, the loan or subsidy size, the website, and the date you last checked it. When a client describes a need, find the line on the sheet, check the live page for changes, and prepare the application. Update the sheet every few months.` },

    { remember: `- Benefits come from **the MSME Act**, **other laws** (income tax, RBI rules, state concessions) and **central schemes**.
- **National Board for MSME** (Section 3) advises on policy; **funds** (Sections 12 and 13) back NSIC and credit guarantees.
- **Money:** CGTMSE, Mutual Credit Guarantee, Startup guarantee, Emergency credit line, PMEGP (15 to 35% subsidy), Mudra (Shishu, Kishore, Tarun, Tarun Plus).
- **Technology:** CLCSS (15% capital subsidy), ZED, Lean, innovation.
- **Skills and markets:** ESDP, PMS, NSIC, SC-ST Hub, PM Vishwakarma. **Places:** MSE-CDP, SFURTI, ASPIRE.
- Reserved items were **de-reserved in April 2015**.
- Always **check the current scheme page**: limits change.` },
  ],
  quiz: [
    { q: `Which body is set up under Section 3 of the MSME Act to advise the government on MSME policy?`, o: [`The National Board for MSME`, `NSIC`, `SIDBI`, `CGTMSE`], a: 0, why: `Section 3 sets up the National Board for MSME, chaired by the Union Minister, to examine and recommend policy.` },
    { q: `Which scheme gives a credit-linked subsidy of 15% to 35% of the project cost for new non-farm units?`, o: [`Mudra`, `CLCSS`, `PMEGP`, `ESDP`], a: 2, why: `PMEGP is the credit-linked subsidy programme for setting up new units, with a subsidy of 15% to 35%.` },
    { q: `What does ZED stand for?`, o: [`Zoned Economic Development`, `Zone for Export Development`, `Zero Equity Debt`, `Zero Effect, Zero Defect`], a: 3, why: `ZED means Zero Defect, Zero Effect: products with no defects and processes with no harm to the environment.` },
    { q: `What happened to the items reserved for small-scale industries in April 2015?`, o: [`More items were reserved`, `They were de-reserved: large firms can make them without a licence`, `They were banned`, `They were moved to the states`], a: 1, why: `The government de-reserved them, so larger units can now make bread, pickles, chutneys and similar items.` },
    { q: `Which Mudra band gives loans from ₹50,000 to ₹5 lakh?`, o: [`Kishore`, `Shishu`, `Tarun`, `Sampoorna`], a: 0, why: `Shishu is up to ₹50,000, Kishore ₹50,001 to ₹5 lakh, Tarun ₹5 lakh to ₹10 lakh and Tarun Plus ₹10 lakh to ₹20 lakh.` },
    { q: `What does TReDS let a small seller do?`, o: [`File GST returns`, `Apply for a patent`, `Register on Udyam`, `Sell an unpaid invoice to a financier and get cash at once`], a: 3, why: `TReDS is the online system through which a seller's invoice can be discounted by a financier, so the seller does not wait for the buyer.` },
  ],
};
