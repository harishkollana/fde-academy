import { sk, flow, hub } from '../_kit.js';

export default {
  title: `Equity funding for MSMEs: venture capital, its stages and the rules`,
  goal: `You can explain venture capital as risk capital, name the six stages of venture financing with their risk and lock-in, describe how VCs exit, say how the SEBI rules changed from the 1996 VCF regulations to the 2012 AIF regulations, and describe SIDBI's venture capital arm.`,
  covers: [`Government support around equity`, `Venture capital as risk capital`, `Stages of financing`, `Exits`, `SEBI rules and SIDBI Venture Capital`],
  terms: [
    [`Risk capital`, `Money put into a business where there is a real chance of losing it, in return for a share of the gain. Venture capital is risk capital.`],
    [`Venture capital fund (VCF)`, `A pool of money, raised from investors, that buys shares in young, growing businesses.`],
    [`Seed money`, `The first, small funding that lets a founder prove a new idea.`],
    [`Mezzanine financing`, `Expansion money for a business that is already profitable. The lecture's spoken "Masneen" is this word.`],
    [`Bridge financing`, `Short-term money that carries a business until its next big event, here the public issue.`],
    [`Lock-in`, `The time an investor's money stays in the business before it can come out.`],
    [`Exit`, `The way an investor gets its money out: selling the shares back, to another investor, in a trade sale or on the stock market.`],
    [`Trade sale`, `Selling the company's shares to another company.`],
    [`AIF`, `Alternative Investment Fund: a pooled fund (venture, private equity, hedge and so on) regulated by SEBI.`],
    [`Category I AIF`, `The AIF category for funds that invest in start-ups, early-stage ventures, SMEs, social ventures and infrastructure, which the government considers worth encouraging.`],
    [`Accredited investor`, `An investor with enough wealth or income to be allowed into certain funds, such as an angel fund.`],
    [`Fund of funds`, `A fund that does not invest directly in businesses but puts its money into other funds.`],
  ],
  blocks: [
    `## Government support around equity
Governments and institutions have tried to bring money into the MSME sector for years. The lecture lists:
- **NSIC**, which gives integrated help in **marketing, technology, finance** and other services.
- The **Small Industries Development Council** (the lecture's name for a body that makes small-industry workers aware of government benefits and helps them claim them).
- The **RBI's rural planning and credit department**, which **refinances** nationalised banks and financial institutions for small industry.
- **CGTMSE**: collateral-free, merit-based credit (Week 3, lesson 12).
- The **Technology Upgradation Fund** scheme, which gives technology inputs to units.
- Newer initiatives: **Nivesh Mitra**, **MSME One Connect**, **One District One Product**, the **PM Vishwakarma** programme and others, for **faster approvals**, wider markets and better competitiveness.

The lecture also describes the **Budget of 2026-27** (check what has become law): an aim to build **globally competitive champion MSMEs**; a **₹10,000 crore SME growth fund** to identify and nurture high-potential units; more attention to **working capital and timely payment**, with **TReDS** (over ₹7 lakh crore already unlocked for MSMEs) to be made the **standard platform for purchases by central public sector enterprises** and linked to **GeM**; and **₹2,000 crore** earmarked for the **Self-Reliant India Fund**, which gives micro enterprises access to risk capital.

## Venture capital: risk capital in the form of shares
**Venture capital** is an important source of money for SMEs, especially to **start up** and to **expand**. A venture capital fund **scrutinises each project carefully** and then provides **long-term, committed share capital**.

It is **risk capital**: invested in a business whose future profits and cash flows are **uncertain**. It is given as **shares, not as a loan**, so the investor needs a **higher return** to pay for the risk. In practice venture capital can mean **seed funds for start-ups**, **first-stage financing**, or **expansion money for companies that cannot reach the public markets**.

**How a venture capitalist differs from a lender.**
- A lender wants interest and repayment. A VC wants **growth in the value of the shares**.
- A VC takes **an active part in the management**, may **share in decisions**, and brings the skills of **a good banker, a technologist, a planner and sometimes a manager**.
- As a shareholder, the VC's return depends on the **growth and profitability of the business**, and it is **earned when the VC sells its shares**: the **exit**.

VCs are now moving beyond old sectors into **clean energy, IT, healthcare, pharmaceuticals, retail and media**. They raise money **at home and abroad** from **angel investors** (rich individuals who like high risk and high returns) and **institutions** such as **pension funds and insurance companies**. Another source is a **fund of funds**.

## The stages of venture financing
Money is released **in rounds**, as the business proves itself. Early rounds are the most risky and the money is **locked in for the longest time**.`,

    sk(332, 'The six stages: the earlier the stage, the longer the lock-in and the higher the risk', [
      { t: 'table', x: 25, y: 44, cols: [`Stage`, `Lock-in`, `Risk`, `The money is used for`], colW: [130, 100, 120, 350], rowH: 36, title: `Venture financing, stage by stage`,
        rows: [
          [`Seed`, `7-10 years`, `extreme`, `prove an idea, research`],
          [`Start-up`, `5-9 years`, `very high`, `set up, build prototypes`],
          [`First stage`, `3-7 years`, `high`, `commercial production, marketing`],
          [`Second stage`, `3-5 years`, `high`, `expansion, working capital`],
          [`Third (mezzanine)`, `1-3 years`, `medium`, `grow, acquire, new products`],
          [`Fourth (bridge)`, `1-3 years`, `low`, `carry the firm to a public issue`],
        ] },
    ]),

    `- **Seed money:** low-level financing **to prove a new idea**: a concept, research, product development.
- **Start-up funding:** for early-stage firms to **set up operations** or build **prototypes**, and to pay for **marketing and product development**.
- **First round:** the business has **early sales** and needs money for **manufacturing and marketing**.
- **Second round:** **working capital** for an early company that is selling but **not yet profitable**.
- **Third round (mezzanine):** **expansion money for a new profitable company**.
- **Fourth round (bridge):** to finance **going public**.

## Exits: how the venture capitalist gets its money out
A VC does not stay for ever. The routes the lecture names:`,

    sk(310, 'Four ways a venture capitalist exits', hub(
      { label: `VC\nexit`, fill: `yellow` },
      [
        { label: `Sell back`, sub: `to the founders`, fill: `green` },
        { label: `Another investor`, sub: `such as a PE firm`, fill: `blue` },
        { label: `Trade sale`, sub: `to another company`, fill: `orange` },
        { label: `Stock market`, sub: `a listing or IPO`, fill: `purple` },
      ],
      { cx: 380, cy: 158, rx: 270, ry: 102, r: 50, bw: 190, bh: 58 },
    )),

    `These exits also help the business: they bring new money and new owners, and a listing gives it a public name.

## The rules: from the 1996 VCF regulations to AIFs
- **SEBI (Venture Capital Funds) Regulations, 1996:** India's **first rule book for venture capital**. Funds had to **register with SEBI**; **at least 66.67% (two-thirds)** of investable money had to go into **unlisted equity**; **one company could receive no more than 25%** of the fund's corpus.
- **Why they changed.** Private equity, hedge and angel funds grew under separate rules and confusion and loopholes appeared. So on **21 May 2012** SEBI replaced the old framework with the **Alternative Investment Funds (AIF) Regulations**.
- **Today:** **venture capital funds are Category I AIFs**, which invest in **start-ups, early-stage businesses, SMEs, social ventures, infrastructure** and other areas the government or regulators see as **socially or economically desirable**. Category I includes **venture capital funds, SME funds, angel funds, social impact funds, infrastructure funds and special situation funds**. They are also treated as **qualified institutional buyers**, which adds to their credibility in the capital market.
- **Old VCFs** may **keep managing their existing investments** but **cannot launch new schemes** unless they **migrate** to the AIF framework; otherwise they must wind down.
- **Angel funds** are a sub-category of Category I AIF that **raise money from accredited investors** (regulation 19A).
- **Definition.** A **venture capital fund** is an AIF that invests **mainly in unlisted securities** of start-ups and **early-stage venture capital undertakings**, those involved in **new products, new services, technology, IP-based activity or a new business model**. A **venture capital undertaking** is **a domestic company that is not listed on a recognised stock exchange when the money is put in**.

## SIDBI's venture capital arm
**SIDBI** is the main public institution in VC funding, working through its wholly owned subsidiary **SIDBI Venture Capital Limited (SVCL)**, **set up in 1999** as an investment management company. SVCL manages funds for **start-ups, early-stage technology businesses, manufacturing and service SMEs, agri-businesses and financial inclusion companies**. SIDBI also **co-finances state-level funds** and **co-invests** with private VC funds, case by case.

**What a VC fund like this gives an MSME:** **long-term equity**, which builds a **solid capital base**; a **business partner** who shares risks and rewards; and **practical advice** drawn from similar companies. In return the VC needs **business success and capital gains**.

The lecture mentions some VC and PE names for reference only (not an endorsement): Avishkaar, Banyan Tree Growth Capital, DSG, Everstone, Fireside Ventures, Sixth Sense Ventures, Kedaara Capital and others. Check which are active and what each invests in.

## How a VC decides: three stages
A VC's process has **screening**, **evaluation** and **approval**. In **screening** it looks at the **market, the product, the making and distribution of the product, and the management's skills**, because it invests **in the people as much as in the business**. In **evaluation** it weighs **risk against the much higher return** it wants. Then comes the **decision**. The next lessons cover this process and the business plan in detail.

## Worked example: a start-up on the venture ladder
Two engineers start **ChargeNest**, making electric-vehicle chargers. (All figures are **assumed for illustration**.)

| Round | Source | Money | Purpose |
|---|---|---|---|
| Seed | An angel investor | ₹50 lakh | Prove the design, build prototypes |
| First | A venture fund | ₹3 crore, for 25% | First factory line and marketing |
| Third | A growth fund | ₹10 crore | Expansion and a small acquisition |
| Exit | Trade sale in year 6 | The VC's 25% sells for ₹12 crore | The VC gets out |

For the first-round VC, ₹3 crore became ₹12 crore: **four times the money**. Over six years that is about **26% a year** (4 to the power 1/6 is about 1.26), against about 10% on a bank loan. The extra return pays for the chance, which is real: if the chargers had not sold, the VC could have lost the whole ₹3 crore. The founders, meanwhile, gave up a quarter of the company in the first round.`,

    { analogy: `Venture capital is a **seed-stage investment in an experimental project**: you fund many prototypes knowing most will fail, because the few that succeed return many times the money. The **rounds** are **funding stages tied to milestones**, like releasing budget when a project passes a gate. The **lock-in** is a **minimum holding period**. **Exits** are the **liquidity events** that realise the value: a buy-back, a secondary sale, an acquisition or a public listing. And the **AIF category** is a **regulatory class** that decides which rules, risks and incentives apply.` },

    { warn: `Easy mistakes:
- **Calling a VC a lender.** A VC buys shares: it shares in profits and in losses, and it wants an exit.
- **Pitching a stable trading business to a VC.** VCs look for fast growth and a clear exit, not steady income.
- **Using old rules.** The 1996 VCF regulations are replaced by the 2012 AIF regulations; check the current SEBI text.
- **Ignoring the lock-in.** Seed money can stay in for seven to ten years.
- **Forgetting dilution** at each round.
- **Quoting the Budget figures as final.** The lecture's ₹10,000 crore and ₹2,000 crore figures need checking.
- **Treating a list of fund names as a recommendation.** Check each fund's focus and activity.` },

    { real: `Sort your clients on one question: **can this business grow several times over, and can an investor exit in five to seven years?** If yes (a technology product, a fast-growing manufacturer with a unique process), start preparing the VC file: business plan, team profile and financial projections. If not, steer them to bank credit, bill discounting or SMILE. Telling a client honestly which door fits saves months.` },

    { remember: `- **Venture capital** = **risk capital** invested as **shares**; long-term, committed; VC takes an **active role** and earns on **exit**.
- **Six stages:** seed, start-up, first, second, third (mezzanine), fourth (bridge). Earlier means **longer lock-in (7 to 10 years for seed) and higher risk**.
- **Exits:** sell back to founders; sell to another investor (PE); **trade sale**; **stock-market listing**.
- **Rules:** SEBI **VCF Regulations 1996** (register, two-thirds in unlisted equity, 25% cap per company) replaced by **AIF Regulations, 21 May 2012**: VCFs are **Category I AIFs**; **angel funds** are a sub-category.
- **SIDBI Venture Capital Ltd (SVCL)**, set up 1999, manages funds for start-ups and SMEs.
- **Process:** screening, evaluation, approval. Investors back **the people** as well as the business.
- **Budget figures** in the lecture (SME growth fund ₹10,000 crore, SRI Fund ₹2,000 crore): check.` },
  ],
  quiz: [
    { q: `Why is venture capital called risk capital?`, o: [`It is invested in a business whose future profits are uncertain, as shares and not as a loan`, `It comes with a government guarantee`, `It is repaid with fixed interest`, `It is only for the stock market`], a: 0, why: `Venture capital goes into shares of businesses with a substantial risk about future profits and cash flows, so the investor expects a higher return.` },
    { q: `Which stage of venture financing is known as bridge financing?`, o: [`Seed`, `First stage`, `Second stage`, `Fourth stage, to carry the firm to a public issue`], a: 3, why: `Bridge financing is the fourth round: it finances the going-public process. Mezzanine is the third round.` },
    { q: `Which stage carries the longest lock-in, as the lecture says?`, o: [`Fourth stage`, `Third stage`, `Seed money (7 to 10 years)`, `Second stage`], a: 2, why: `Seed money is locked in for the longest, about 7 to 10 years, and carries extreme risk.` },
    { q: `Which regulations replaced SEBI's 1996 VCF regulations on 21 May 2012?`, o: [`The Companies Act`, `The AIF (Alternative Investment Funds) Regulations`, `The Income Tax Act`, `The MSME Act`], a: 1, why: `SEBI replaced the old framework with the AIF Regulations. Venture capital funds are now Category I AIFs.` },
    { q: `Which of these is NOT an exit route for a venture capitalist?`, o: [`A trade sale to another company`, `Selling shares back to the founders`, `Selling to another investor`, `A bank loan to the founders`], a: 3, why: `Exits are sales of the VC's shares: back to management, to another investor, in a trade sale or through a listing. A bank loan is not an exit.` },
    { q: `A VC invests ₹3 crore for 25%. The 25% later sells for ₹12 crore. How many times the money is that?`, o: [`Two times`, `Three times`, `Four times`, `Eight times`], a: 2, why: `12 ÷ 3 = 4, so the VC gets four times its money.` },
  ],
};
