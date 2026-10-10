import { sk, flow, hub } from '../_kit.js';

export default {
  title: `Raising equity, part 1: preparing, choosing an investor and writing the business plan`,
  goal: `You can say what a company should check before raising equity, what to look for in an investor and what investors look for in a company, list the drawbacks of venture funding, follow the four steps of the process with their usual timings, and build the sections of a business plan.`,
  covers: [`Preparing to raise equity`, `Choosing the investor`, `What investors want`, `Drawbacks of venture capital`, `The pitch and the business plan`],
  terms: [
    [`Pitch`, `A short presentation by the founders to an investor, explaining the business and the money needed.`],
    [`Term sheet`, `A preliminary, non-binding paper that sets out the main financial and legal terms of a planned investment. It is the road map to the binding contracts.`],
    [`Due diligence`, `The investor's detailed check of a business: its books, legal position, contracts and people, before it invests.`],
    [`Vendor due diligence`, `A check that the seller (the company) arranges on itself in advance, so there are fewer surprises.`],
    [`Nominee director / observer`, `A person the investor places on the board to see and influence decisions (a nominee votes, an observer only attends).`],
    [`Shareholders' agreement`, `The contract among the shareholders about voting, transfer of shares, exits and rights.`],
    [`Drawdown`, `The actual release of the agreed money from the investor to the company.`],
    [`USP`, `Unique selling point: the thing that sets a product or service apart from the competition.`],
    [`Business plan`, `The written document that tells an investor who you are, what you do, how you will grow, what you need and how they will earn.`],
    [`Executive summary`, `The one- or two-page summary at the front of a business plan. It decides whether the rest gets read.`],
    [`Scenario analysis`, `Working out the results under different assumptions: best case, worst case, and in between.`],
    [`Barriers to entry`, `The things that make it hard for new competitors to enter a market, such as patents or heavy investment.`],
  ],
  blocks: [
    `## Before you raise equity: check yourself
The investor will scrutinise the business. The founders should scrutinise it first. The lecture asks the management to look at these risks, and to prepare for them:
- **Is this the first time** the company raises equity? A first-timer usually makes more mistakes.
- Is there **a lack of clarity** about strategy, objectives or the business plan?
- Does the business **lack growth potential**, or can it not give the **returns an investor needs**?
- Has the fund-raising **started at the last moment**, when the money is urgently needed? That puts the founders in a weak position.
- Will there be **delays in giving information** to investors, because the promoters are also running the business? Unjustified delays can cost the deal.

## What the company should look for in an investor
The relationship will be **long**, so evaluate the investor and its **term sheet**: its **reputation**, **investment objectives**, **eligibility criteria**, **fund life** (how long the fund has left), **exit time horizon** (4 years? 10?), **experience in investing in MSMEs** and **in your industry**, the **amount** it will invest, how it **values** the business and by what method, **the rights it asks for**, and whether it wants an **active or a passive role**. **Approach only investors whose preferences match yours**: they appreciate being chosen with care, and a mismatch wastes months. Any one negative can hurt the deal.

## What the investor expects of the company
- **An open mind.** Investors want enterprises that **accept strategic and operational support** to grow fast.
- **A seat on the board.** Many ask for a **nominee director or an observer**, and for **regular board meetings** with their nominee present, so that they know the **day-to-day affairs**.
- **Approval rights.** Important decisions may need the investor's consent through the nominee: **business strategy, senior hiring** (the managing director, for example), **pay policy**, **raising more debt or equity**, and **large contracts**.
- **A company.** Investors usually want the enterprise to be a **company**, not a proprietorship or partnership (which may have ignored regulation), so that it can issue **equity or quasi-equity**. A proprietor may be asked to **convert or transfer the business into a company**. (Week 3, lesson 3 shows how.)
- **A real board and structure:** a **functioning board of directors**, a **clear organisation**, a **management team with defined roles**, and a **strong finance team** that gives **reliable data in the investor's formats**: reporting, analysis, cash-flow management, cost control and **well-kept books**.

## The drawbacks
- **A perceived loss of control.** The investor is taken into confidence on major decisions, and some of the founder's rights pass to the investor. Its main interest is to **exit later at a profit**.
- **Potential conflict.** Shared ownership and shared decisions can create **stress** if the vision or management style differ. The investor may be a **partner** or may turn into a **dictator**.
- **It is demanding, slow and costly.** It takes **management time** away from the core business while the money is being raised: do not let current operations suffer.

## What investors look for in a business
- **Growth prospects:** the **competitive landscape**; how **strong the product** is; **barriers to entry**; **multiple markets and products**; the industry's outlook; changing customer tastes; **disruptive technology**; industry growth; and regulatory risk.
- **A sturdy business model:** a **large customer base**, a **strong supply chain**, **steady and recurring cash flows** and **low capital spending** are positives, and the opposites are negatives.
- **The management team:** **experience, commitment, alignment with investors and the ability to execute**. A weak team gets only a small cheque, if any, because investors back **people** as much as products.

## The four steps, with their usual time`,

    sk(262, 'From pitch to money', [
      ...flow([
        { label: `1. Pitch and\nfirst check`, fill: `blue` },
        { label: `2. Evaluate and\nnegotiate`, fill: `yellow` },
        { label: `3. Sign and\nclose`, fill: `orange` },
        { label: `4. Money is\ndrawn down`, fill: `green` },
      ], { y: 20, h: 76, gap: 44, max: 17 }),
      ...[`pitch, plan, investors\nvendor check: 2 to 6 months`, `meetings, term sheets,\nvaluation: 2 to 3 months`, `definitive agreements\nabout 1 month`, `after conditions are met\nabout 1 month`].map((t, i) => ({ t: 'text', x: 86 + i * 196, y: 142, text: t, size: 13, color: `#4a5568` })),
      { t: 'note', x: 100, y: 196, w: 560, h: 44, text: `Add these up: raising equity commonly takes months, not weeks.\nStart early, before the money is urgent.`, fill: `yellow`, size: 14 },
    ]),

    `1. **Preparing the pitch and a preliminary check.** A **rapid screening**: the **founding team**, **market viability**, **initial financials** and the **legal baseline** (how many compliances are done, how many pending). It validates the business model so that the investor can spot **red flags** and decide on a **term sheet**. In this stage you **prepare a business plan**, **appoint advisors** if needed, **identify and approach investors**, and **decide your key selling points**. A **vendor due diligence** may be done and can take **2 to 6 months**.
2. **Evaluation and negotiation:** meetings, **term sheets**, **preliminary due diligence**, **proposed valuations** and negotiating **valuation and other terms**. It can take **2 to 3 months**.
3. **Execute and close:** evaluate the proposed financial structure and sign the **definitive agreements** (a **purchase and sale agreement for the equity subscription** and a **shareholders' agreement**). About **one month**, depending on the negotiation.
4. **Drawdown:** after the **conditions** are complied with, the investor releases the funds. About **one month**.

**The term sheet** is **non-binding**, but it fixes the main points and so acts as a **road map** to the binding contracts.

## The pitch
A **business pitch** is a **presentation by one or more people to an investor or group of investors**. It should say: the **stage** of the business (seed, start-up, early, expansion, management buy-out); the **industry** it works in; **how much money** it needs (firms that start with **smaller sums** are more attractive, since the investor can add more later after studying the risk); and **where** it operates. The usual **structure**: **introduction**, **core team**, **business model**, **valuation and the amount of investment required**.

## The business plan
Once the preliminary check is done, have a **business plan ready**. Its **main purpose** is to **market the proposal**: to show the investor that investing gives **a unique chance to share in an excellent return**. Keeping it ready is easy; **deciding what to put in it** is the skill.`,

    sk(398, 'What a business plan must contain', hub(
      { label: `Business\nplan`, fill: `yellow` },
      [
        { label: `Background`, sub: `product, market`, fill: `blue` },
        { label: `Financials`, sub: `3 to 5 years`, fill: `green` },
        { label: `Product or service`, sub: `in plain English`, fill: `orange` },
        { label: `Distribution`, sub: `how it reaches buyers`, fill: `purple` },
        { label: `Competition`, sub: `who and how strong`, fill: `pink` },
        { label: `Money and exit`, sub: `need, use, schedule`, fill: `teal` },
        { label: `Team`, sub: `roles and strengths`, fill: `yellow` },
        { label: `Executive summary`, sub: `at the front`, fill: `grey` },
      ],
      { cx: 380, cy: 198, rx: 290, ry: 140, r: 56, bw: 170, bh: 58 },
    )),

    `**Business background.** The **product**, the **market it serves**, the **key revenue segments** and **future plans** (if three of four products are doing well, focus on them and say what you will do with the fourth). The **location and size of facilities**, **labour availability**, **access to materials**, **closeness to distribution channels**, **government grants, tax and incentives**, and the **equipment used or planned**. **Outsourcing** to subcontractors avoids the need to expand facilities: say so. Investors check for **inconsistencies** and for **uncertainty in production**, so include a **budget and timetable** for product development. Be ready for questions such as: *if sales grow 25% a year, can the present site expand? Are there suppliers? Is there a trained workforce?*

**Financial features.** **Historical** sales, profits, cash flow and return on investment, and a **full set of cohesive statements**: a **balance sheet**, an **income statement** and a **cash flow statement** for **3 to 5 years**, **monthly** until break-even and then yearly. Make the numbers **easy to update**, and put **major assumptions in notes**, since hidden assumptions distort the picture. Show **all costs**, and **split sales costs from marketing costs**. Give **prices or fee structures**, a **budget for each activity** and the **steps you will take to stay within or improve it**. Show **scenarios**, short and long term, by asking **what-if** questions, such as the one in the example below. Keep the plan **flexible, not over-optimistic**, and show how challenges will be met.

**Product or service.** Explain it **in plain English**, even if it is technical. Stress the **USP**: lower price, higher quality, longer life, faster, smaller, easier to maintain, extra support. A **technology** company must show a **world-class opportunity** to balance the risk, whether it is **vulnerable to technology elsewhere**, and its **legal protection** (patents granted or pending). If it is still being developed, list the **milestones reached and still to come**. A **single-product** company worries investors, so mention a **second-generation product** or other products.

**Distribution.** For a manufacturer, the **channels to the end user**, why you chose them, and the **financial benefit**, with a **price schedule, discounts and commissions** built into the sales estimates. For a service provider, the **means of promotion** matter more.

**Competition.** Who they are, how many, **what share of the market**, their **strengths and weaknesses** and your own, a **comparison of price, quality, warranties, updates and new features**, and **how you will answer their moves**.

**Money and exit.** The **total financing need** (fixed assets and working capital), how the money will be **used**, an **implementation schedule** (capital spending, production, orders) and **how the investor will earn and exit**.

**Management team.** Experience, **strategy**, **marketing and finance professionals**, their **roles** and **special abilities**. For technology firms, the **mix of technical and business skills** is what backers look for.

**Executive summary.** At the **front**, it summarises everything. Give it **time**: it **may decide how much attention the detailed plan gets**. Be **clear and persuasive, but realistic**.

## Worked example: a what-if table
ChargeNest's plan: sales ₹10 crore, variable cost 60% of sales, fixed cost ₹2.5 crore. (Assumed figures.) The investor asks: *what if sales fall 20%? what if supply costs rise 30%? what if both?*

| Case | Sales | Variable cost | Fixed cost | **Profit** |
|---|---|---|---|---|
| Plan | ₹10 crore | ₹6.0 crore | ₹2.5 crore | **₹1.5 crore** |
| Sales down 20% | ₹8 crore | ₹4.8 crore | ₹2.5 crore | **₹0.7 crore** |
| Supply cost up 30% | ₹10 crore | ₹7.8 crore | ₹2.5 crore | **− ₹0.3 crore** |
| Both | ₹8 crore | ₹6.24 crore | ₹2.5 crore | **− ₹0.74 crore** |

The plan survives a fall in sales but not a rise in costs, and the combination is a loss. An investor who sees this analysis in the plan trusts the founders more than one who sees only the happy case.`,

    { analogy: `Raising equity is a **procurement with due diligence**. The **pitch** is the **RFP response**, the **term sheet** is the **letter of intent** (non-binding), **due diligence** is the **security and architecture review**, the **definitive agreements** are the **contract**, and **drawdown** is the **payment run**. The **nominee director** is an **auditor with admin access**. And the **what-if table** is a **stress test**: run the system at 80% traffic and 130% cost, and report what breaks.` },

    { warn: `Easy mistakes:
- **Starting when the cash has nearly run out.** Raising equity takes months.
- **Approaching every investor.** Target only those whose objectives and stage match.
- **Hiding assumptions.** State them in notes.
- **Showing only the best case.** Show scenarios.
- **A weak finance team.** Investors need reliable data in their formats.
- **A single-product story with no second product.**
- **A long, rambling executive summary.**
- **Agreeing to approval rights without reading them.** Strategy, hiring, debt and big contracts may need the nominee's consent.` },

    { real: `Offer clients a **readiness review** before any investor meeting: Is it a company? Are the books up to date and in a standard format? Is there a finance person? Is the business plan complete, with an executive summary and a what-if table? Has the founder thought about what to give up (board seats, approval rights, shares)? Fix the gaps first. The time you spend here is the cheapest in the whole process.` },

    { remember: `- **Prepare:** check first-time risk, unclear strategy, weak growth, last-minute need, slow replies.
- **Choose the investor** by reputation, objectives, fund life, exit horizon, MSME and industry experience, amount, valuation method, rights asked, active or passive role.
- **Investors expect:** a **company**, a **functioning board** (nominee or observer), **approval rights**, a clear structure, a **strong finance team**.
- **Drawbacks:** perceived loss of control, conflict, a demanding and slow process.
- **Investors look for:** growth prospects, a sturdy model, a capable team.
- **Steps and time:** pitch and first check (vendor due diligence 2 to 6 months) → evaluate and negotiate (2 to 3 months) → sign and close (about 1 month) → drawdown (about 1 month). The **term sheet** is non-binding.
- **Business plan:** background, financials (3 to 5 years, what-ifs), product, distribution, competition, money and exit, team, **executive summary**.` },
  ],
  quiz: [
    { q: `What is a term sheet?`, o: [`A final, binding contract`, `A tax return`, `A bank loan sanction`, `A preliminary non-binding paper setting out the main terms of an investment`], a: 3, why: `A term sheet is non-binding, but it is the road map to the binding contracts.` },
    { q: `Why do investors often ask for a nominee director or an observer?`, o: [`To keep in touch with day-to-day affairs and influence key decisions`, `To reduce their tax`, `To run the factory`, `To register the company`], a: 0, why: `A nominee or observer lets the investor see and, for a nominee, influence what the board does.` },
    { q: `Which structure do investors generally prefer?`, o: [`A proprietorship`, `A partnership`, `A company`, `An informal group`], a: 2, why: `A company can issue equity and quasi-equity, and has the regulatory structure investors want.` },
    { q: `How long does the "evaluate and negotiate" step usually take, as the lecture says?`, o: [`Up to 2 to 3 months`, `One day`, `Over two years`, `Exactly one week`], a: 0, why: `Preliminary meetings, term sheets, due diligence and negotiating the valuation and terms can take up to two to three months.` },
    { q: `A plan has sales ₹10 crore, variable cost 60% of sales and fixed cost ₹2.5 crore. If sales fall 20%, what is the profit?`, o: [`₹1.5 crore`, `₹0.3 crore`, `₹0.7 crore`, `A loss of ₹0.74 crore`], a: 2, why: `Sales ₹8 crore minus variable cost ₹4.8 crore minus fixed cost ₹2.5 crore is ₹0.7 crore.` },
    { q: `Where does the executive summary go, and why does it matter?`, o: [`At the end; it is optional`, `At the front; it may decide how much attention the detailed plan gets`, `In the appendix; investors never read it`, `Only in the financial statements`], a: 1, why: `The executive summary sits at the front and often decides whether the rest of the plan is read closely.` },
  ],
};
