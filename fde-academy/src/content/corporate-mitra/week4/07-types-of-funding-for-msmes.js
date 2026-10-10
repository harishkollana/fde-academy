import { sk, flow } from '../_kit.js';

export default {
  title: `Types of funding for MSMEs: own money, debt and equity`,
  goal: `You can name the traditional and modern sources of MSME funding, match each source to a stage of a business's life, explain the kinds of debt and equity, and compare debt with equity on ownership, cost, risk and control.`,
  covers: [`The potential and the funding gap`, `Traditional sources`, `The four life-cycle stages`, `Debt: kinds and features`, `Equity: kinds, advantages, debt versus equity`],
  terms: [
    [`Internal accruals / retained earnings`, `Profit the business keeps and reinvests instead of paying out.`],
    [`Debt financing`, `Raising money by borrowing, to be repaid with interest on a fixed schedule.`],
    [`Equity financing`, `Raising money by selling a share of ownership of the business.`],
    [`Angel investor`, `A rich individual or small group who invests their own money in a very young business.`],
    [`Venture capital (VC)`, `Money from a fund that invests in young, fast-growing businesses in return for shares.`],
    [`Private equity (PE)`, `Money from a fund that invests larger amounts in established, growing businesses in return for shares.`],
    [`Venture debt`, `A loan for an early-stage business that usually asks for no collateral and no shares, so it costs more interest.`],
    [`Debenture / bond`, `A loan certificate that a company issues to investors, promising interest and repayment on a date.`],
    [`Preference share`, `A share that gets its dividend before ordinary shareholders do, and usually has no vote.`],
    [`Convertible instrument`, `A bond or preference share that can later be turned into ordinary shares.`],
    [`Dilution`, `The fall in the owner's percentage share when new shares are issued to an investor.`],
    [`Valuation`, `The price put on the whole business, used to decide how many shares an investor's money buys.`],
  ],
  blocks: [
    `## The potential and the gap
By 2026 the MSME sector has become the **backbone of industrial growth**, and it is central to the country's growth targets ("Viksit Bharat 2047"). It **grows entrepreneurs and nurtures innovation at the grass roots**. A growing MSME sector spreads industry to **backward areas** and moves the economy towards a **more equal Gini coefficient** (the **Gini index** is a statistical measure of how unequal incomes are in a population).

The size limits are the ones you know from Week 2: micro up to ₹2.5 crore of investment and ₹10 crore of turnover, small up to ₹25 crore and ₹100 crore, medium up to ₹125 crore and ₹500 crore. The lecture says MSMEs give jobs to **nearly 33 crore people**, the **second-largest source of employment after agriculture** (the figure differs between sources and dates; see Week 2, lesson 5). They also drive **exports**, and bring work to many regions.

**The challenge is money.** The sector faces a **high cost of credit that does not arrive on time**, **too little capital**, and **too little data** about what it really needs.

## Where money has come from
Historically MSMEs have relied on **retained earnings**; **selling assets**; **ancestral capital and personal savings**; **loans from relatives**; **loans from the unregulated market** (moneylenders); **institutional finance** from scheduled commercial banks; and, more recently, **venture capital and seed funds**.

## Four stages in a business's life, and the money that fits each`,

    sk(300, 'Where funding comes from at each stage', [
      ...flow([
        { label: `Early`, sub: `idea and start`, fill: `green` },
        { label: `Seed`, sub: `first outside money`, fill: `yellow` },
        { label: `Growth`, sub: `expansion`, fill: `orange` },
        { label: `Mature`, sub: `established`, fill: `blue` },
      ], { y: 18, h: 72, gap: 44, max: 20 }),
      { t: 'note', x: 10, y: 116, w: 152, h: 128, text: `Own savings\nFamily, friends\nThe founder's\nmoney`, fill: `green`, size: 14 },
      { t: 'note', x: 206, y: 116, w: 152, h: 128, text: `Angel investors\nSeed funds\n(individuals or\nfirms with\nsurplus cash)`, fill: `yellow`, size: 14 },
      { t: 'note', x: 402, y: 116, w: 152, h: 128, text: `Bank term loans\nWorking capital\nVenture capital\nand private\nequity`, fill: `orange`, size: 14 },
      { t: 'note', x: 598, y: 116, w: 152, h: 128, text: `IPO, NSE Emerge,\nBSE SME listing\nPrivate equity\nAcquisition\nExits for investors`, fill: `blue`, size: 14 },
      { t: 'text', x: 380, y: 270, text: `Match the money to the stage: the wrong source at the wrong stage is expensive`, size: 15, color: `#c2410c` },
    ]),

    `- **Early stage:** the founder's own money and help from **friends and relatives**.
- **Seed or angel stage:** **angel investors**, individuals or entities with **surplus cash**, give the first outside money.
- **Growth or expansion stage:** the unit can now go to **banks and financial institutions** for **term loans** and **working capital**.
- **Mature stage:** after successful expansion, the business may raise money **from the public through an IPO**, **list on NSE Emerge or the BSE SME platform**, take **private equity** or be **acquired**. Existing investors often **exit** at this stage (later lessons study the exits).

## Comparing the sources
| Source | How much | Cost | Speed and catches |
|---|---|---|---|
| **Self-funding**, **internal accruals** | Limited | Very low | May be too little, or not there when needed most |
| **Family and friends** | Limited | Low | Can be fast but small, and sometimes hard to manage |
| **Loans (debt)** | Medium | Medium to low | Faster than family money, but lenders may want **collateral**; the stage of the business matters |
| **Equity investors** | Medium to high | Variable (and high in the end) | They invest for **5 to 7 years or more**, become **shareholders** and expect **high growth and returns** |

## Debt financing: borrow and repay
**Debt financing** means raising money for **working capital** (day-to-day costs) or **capital expenditure** (expansion, buildings, machinery) through loans, **debentures or bonds** and similar instruments. Whatever the form, debt has a **fixed or floating interest cost** and a **set repayment period**: monthly or yearly instalments and sometimes other **obligations** attached.

**The kinds of debt:**
- **Loans from banks or NBFCs:** the most traditional way. For **equipment finance**, **general purposes** and **working capital**.
- **Venture debt:** a loan for an **early-stage** business, usually **without collateral and without giving up shares**. Because it has neither, it **costs more interest** than other debt.
- **Bonds and debentures:** a company may issue them to **qualified institutional buyers** and to retail investors. They carry **high compliance cost**, since several regulators have their own rules.
- **Fintech platforms:** a new-age alternative for MSMEs to raise debt, at a **higher cost** than the traditional sources.

## Equity financing: sell a share of the business
**Equity financing** is raising money by **selling shares**. The investor gets an **ownership interest** in the company, so the owner **gives up part of the ownership**. That needs careful thought, because it has real benefits and real problems.

**Equity and quasi-equity.** Besides **equity (ordinary) shares**, which are the **owned capital**, there are **quasi-equity** instruments that behave partly like debt and partly like equity:
- **Preference shares**, which come in kinds: **cumulative** (unpaid dividends pile up) or **non-cumulative**; **redeemable** (repaid after a fixed time) or **non-redeemable**; **participating** (share in extra profits) or **non-participating**; **convertible** (can become equity) or **non-convertible**; some with a **call or put option**.
- **Convertible debentures** and **warrants**.

A deal can use **one instrument or a mixture**. It depends on the **type and stage of business**, its **future projections**, the **investor's demands** and, above all, the **valuation**. The valuation may be fixed when the money comes in, or, for a convertible instrument, **tied to a milestone**. If the instrument is convertible, the investor may later get a **controlling, investing or participating interest**, as the terms say.

## Debt versus equity`,

    sk(332, 'Debt and equity compared', [
      { t: 'table', x: 40, y: 44, cols: [``, `Debt`, `Equity`], colW: [200, 220, 220], rowH: 34, title: `The trade-offs`,
        rows: [
          [`Ownership`, `no dilution`, `owner gives up a share`],
          [`Control`, `little say for lender`, `votes, maybe a board seat`],
          [`Repayment`, `fixed dates, fixed`, `none; no fixed dividend`],
          [`Claim on assets`, `comes first (senior)`, `comes last (junior)`],
          [`Needs collateral`, `usually yes`, `no`],
          [`Cost`, `cheaper (priority)`, `higher (more risk)`],
          [`Tax`, `interest is deductible`, `no tax shield`],
        ] },
    ]),

    `**What equity gives that debt does not:**
- **Less burden.** No loan to repay and no monthly instalment, which matters when the business is not yet making a profit. More money can go into growth.
- **Learning from partners.** A VC or PE firm brings **experience**, **contacts** and **business sense** from the same field.
- **Follow-up funding.** A satisfied investor may put in more as the business grows.
- **No collateral.** It rests on the **business plan and revenue model**, not on property.

**What equity costs.** Equity has **no maturity date and no duty to pay a dividend**, so it is flexible. But **investors expect more return** because they carry more risk, and the cost of equity is **higher** than the cost of debt. They are **residual owners**, paid after lenders.

**How to decide.** Weigh the company's **current and target debt-equity ratio**, its **ability to access** each source, whether the owner is **willing to dilute**, the **cost of compliance**, **existing commitments** to lenders and investors, the **credit rating**, and the **end use of the funds**.

**The three equity investors, by stage.** **Angel investors** put in **small** amounts in the **early stage**. **Venture capital firms** come at about the **break-even stage**. **Private equity firms** invest **larger** amounts in **growth and mature** businesses. Later lessons show how to approach them.

## Worked example: ₹1 crore by debt or by equity?
Kavya's masala unit needs **₹1 crore** to build a second plant. (The rates and values are **assumed for illustration**.)

| | **Debt** (bank loan at 10%) | **Equity** (20% share to an investor) |
|---|---|---|
| What the owner gives up | Interest of **₹10 lakh a year**, fixed, and the loan must be repaid | **20% of the company** (the company is valued at ₹5 crore after the money comes in) |
| If the business is later worth ₹20 crore | Over five years the owner paid about ₹50 lakh of interest and repaid ₹1 crore | The investor's 20% is worth **₹4 crore**, four times the money |
| If the business fails | The loan is still owed (and security may be taken) | The investor loses the money; the owner owes nothing |
| Pressure in the early years | Instalments must be paid even without profit | None |

So equity looks **free** early on but can be the **dearer** source if the business does very well. Debt costs a **known amount** whatever happens, but it is a **fixed obligation**.`,

    { analogy: `Debt is a **lease**: you pay a fixed rent for the use of money and you keep the asset. Equity is **selling a stake**: you get cash now, no rent, but the buyer owns a share of every future gain and may vote on decisions. **Preference shares and convertibles** are **hybrid contracts**, like a loan that can turn into ownership if a trigger is met. And **valuation** is the **price per share** you negotiate: set it too low and you give up too much of the company for the cash.` },

    { warn: `Easy mistakes:
- **Choosing equity "because it is free".** It is usually the costliest source over the long run.
- **Choosing debt for a business with no cash flow.** Instalments fall due whether or not there is profit.
- **Using the wrong source for the stage.** An IPO is not for a start-up; family money is not for a plant.
- **Forgetting dilution.** Every round reduces the owner's share.
- **Overlooking compliance costs** of bonds and debentures.
- **Believing venture debt is cheap.** It carries no collateral and no shares, so it carries higher interest.
- **Ignoring the investor's horizon.** Equity investors want an exit in five to seven years.` },

    { real: `When a client says "I need ₹1 crore", ask three things: what is it for (working capital or capital expenditure)? what stage is the business in? and how much of the business is the owner willing to give up? Then draw the table above with the client's own numbers. Often a blend is best: a bank loan for the machine, and a small equity round only if the business needs to grow faster than its cash flow allows.` },

    { remember: `- **Sources over a business's life:** own money, family and friends → **angels and seed funds** → **bank loans, VC and PE** → **IPO or listing, PE, acquisition**.
- **Debt:** fixed or floating interest, repayment schedule, collateral, **no dilution**. Kinds: **bank or NBFC loans**, **venture debt** (no collateral or shares, costs more), **bonds and debentures** (compliance cost), **fintech platforms** (costlier).
- **Equity:** sale of shares; **dilution**, votes, maybe a board seat; **no repayment**; higher expected return. **Quasi-equity:** preference shares (cumulative, redeemable, participating, convertible), convertible debentures, warrants.
- **Debt versus equity:** ownership, control, repayment, claim on assets, collateral, cost, tax shield.
- **Investors by stage:** **angels** (early, small), **VC** (around break-even), **PE** (growth and mature, larger).
- **Decide with:** target debt-equity ratio, willingness to dilute, compliance cost, existing commitments, rating and end use.` },
  ],
  quiz: [
    { q: `At which stage do angel investors usually step in?`, o: [`Mature stage`, `Early or seed stage`, `After an IPO`, `After the business is acquired`], a: 1, why: `Angel investors, individuals or entities with surplus cash, give money to young businesses in the early or seed stage.` },
    { q: `Which feature belongs to debt, not equity?`, o: [`Dilution of the owner's share`, `A vote for the lender`, `Interest that is tax-deductible`, `No fixed repayment`], a: 2, why: `Interest on debt is a tax shield. Equity brings dilution, voting rights and no fixed repayment.` },
    { q: `Why is venture debt costlier than an ordinary bank loan?`, o: [`It has no collateral and no equity dilution, so the lender charges more interest`, `It needs a government guarantee`, `It is always for large companies`, `It must be repaid in a day`], a: 0, why: `Venture debt is for early-stage units and asks for no collateral and no shares, so lenders compensate with a higher interest rate.` },
    { q: `What does a cumulative preference share mean?`, o: [`It can be turned into equity`, `Unpaid dividends of earlier years pile up and must be paid`, `It carries a vote`, `It is repaid after a fixed time`], a: 1, why: `For cumulative preference shares, a dividend that is not paid in one year accumulates. Convertible is the kind that turns into equity.` },
    { q: `A company is valued at ₹5 crore after an investor puts in ₹1 crore. What share does the investor hold?`, o: [`10%`, `25%`, `50%`, `20%`], a: 3, why: `₹1 crore out of a ₹5 crore valuation is 20%.` },
    { q: `Which investor typically puts larger sums into growth and mature businesses?`, o: [`Private equity firms`, `Angel investors`, `Family and friends`, `Moneylenders`], a: 0, why: `Angels invest early and small. Private equity firms invest larger amounts in growth and mature stages.` },
  ],
};
