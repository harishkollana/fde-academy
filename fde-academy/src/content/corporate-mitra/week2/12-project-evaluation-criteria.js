import { sk } from '../_kit.js';

export default {
  title: `Judging a project with numbers: payback, ARR, NPV and IRR`,
  goal: `You can compute the payback period, the accounting rate of return, the net present value and the internal rate of return of a small project, apply the accept-or-reject rule of each, and say which method is better and why.`,
  covers: [`Cost-benefit analysis`, `Payback period`, `Accounting rate of return`, `Net present value`, `Internal rate of return`],
  terms: [
    [`Cash flow`, `Money actually coming in or going out in a year. Cash inflow is money coming in, outflow is money going out.`],
    [`Cost-benefit analysis`, `Comparing the money the project will cost with the money it will bring in over a period.`],
    [`Payback period`, `How long a project takes to earn back the money put into it.`],
    [`Accounting rate of return (ARR)`, `The average yearly profit of a project as a percentage of the money invested.`],
    [`Hurdle rate`, `The minimum return a business decides a project must earn before it is accepted. Also called the cut-off rate.`],
    [`Cost of capital`, `What the money used in the project costs: the interest on loans, or what the owner's own money could have earned elsewhere.`],
    [`Time value of money`, `₹1 received today is worth more than ₹1 received next year, because today's rupee can be used or invested.`],
    [`Discount rate`, `The rate used to shrink future money back to today's value. In practice it is the cost of money.`],
    [`Present value`, `The worth today of money that will arrive in the future.`],
    [`NPV`, `Net present value: the present value of all the money coming in, minus the money put in.`],
    [`IRR`, `Internal rate of return: the discount rate at which a project's NPV is exactly zero. It is the project's own yearly return.`],
    [`Break-even`, `Neither profit nor loss: NPV of zero, or IRR equal to the cost of capital.`],
  ],
  blocks: [
    `## Why use numbers?
The last lesson said: collect data, write the project report, then run the numbers. The numbers **remove guesswork from the decision**. Suppose the project is a new line in Ravi's biscuit unit. We can write down the cost of the machinery and its installation, how much will be produced and at what price it will sell, and the raw material, labour and other costs. From that we forecast the **inflows** (money coming in) and **outflows** (money going out) year by year. This is **cost-benefit analysis**, and it goes into the project report. Later, when real results arrive, we compare them with the report. The four tools below turn the same forecast into a yes or no.

| Tool | The question it answers |
|---|---|
| Payback period | How soon do I get my money back? |
| Accounting rate of return | What average profit do I earn on the money I put in? |
| Net present value | What is the project worth, in today's rupees? |
| Internal rate of return | What yearly return does the project itself give? |

## 1. Payback period
**Payback period** is the time a project takes to **recover its initial investment**. Add the yearly inflows until they equal the cost.

**Lecture example.** A project costs ₹10,000. It earns ₹2,000 in year 1, ₹3,000 in year 2, ₹2,500 in year 3 and ₹3,000 in year 4. After three years the total is ₹7,500. Another ₹2,500 is needed, and year 4 brings ₹3,000, so the payback period is about **3.8 years** (nearly 4). **Decision rule:** if two projects are compared, the one with the **shorter payback** is preferred.

**Why people like it.** It is simple, quick to explain and gives comfort: "my machine pays for itself in four years, and everything after that is profit."

**Why it is not perfect.**
- It **ignores timing**. Take two projects costing ₹10,000 each. A earns 4,000, 3,000, 2,000 and 1,000 in years 1 to 4. B earns nothing in the first two years, then 4,000 and 6,000. **Both pay back in 4 years**, yet A's money comes sooner, and sooner money can be reinvested.
- It **ignores what happens after payback**, the rest of the project's life.
- It **prefers short projects**. A steel mill, a fertiliser plant or a highway has a huge cost and a payback of many years (a highway may take 30 to 40 years). Real development needs these projects too.`,

    sk(262, 'Same payback, different projects: A gets its money earlier', [
      ...[`Year 1`, `Year 2`, `Year 3`, `Year 4`].map((t, i) => ({ t: 'text', x: 205 + i * 150, y: 22, text: t, size: 15, color: `#4a5568` })),
      { t: 'text', x: 20, y: 68, text: `Project A`, size: 17, bold: true, anchor: `start` },
      { t: 'box', x: 140, y: 44, w: 130, h: 48, label: `₹4,000`, fill: `green`, size: 18 },
      { t: 'box', x: 290, y: 44, w: 130, h: 48, label: `₹3,000`, fill: `green`, size: 18 },
      { t: 'box', x: 440, y: 44, w: 130, h: 48, label: `₹2,000`, fill: `green`, size: 18 },
      { t: 'box', x: 590, y: 44, w: 130, h: 48, label: `₹1,000`, fill: `green`, size: 18 },
      { t: 'text', x: 20, y: 138, text: `Project B`, size: 17, bold: true, anchor: `start` },
      { t: 'box', x: 140, y: 114, w: 130, h: 48, label: `₹0`, fill: `grey`, size: 18 },
      { t: 'box', x: 290, y: 114, w: 130, h: 48, label: `₹0`, fill: `grey`, size: 18 },
      { t: 'box', x: 440, y: 114, w: 130, h: 48, label: `₹4,000`, fill: `orange`, size: 18 },
      { t: 'box', x: 590, y: 114, w: 130, h: 48, label: `₹6,000`, fill: `orange`, size: 18 },
      { t: 'note', x: 40, y: 192, w: 680, h: 52, text: `Each costs ₹10,000 and pays back in 4 years. At a 10% cost of money, A is worth -₹1,699 and B -₹2,897:\nboth only just get the cost back, and B's late money is worth less.`, fill: `yellow`, size: 14 },
    ]),

    `## 2. Accounting rate of return (ARR)
ARR measures the **average yearly profit** a project earns as a percentage of the money invested.

> **ARR = (average annual net profit ÷ investment) × 100**

The lecture gives two ways to count the investment: the **average investment** (investment at the start plus investment at the end, divided by two) or, as a shortcut, the **initial investment**. The two give different percentages, so use **the same way for every project you compare**, and set your hurdle rate on the same basis. Net profit is revenue minus expenses, **including depreciation and taxes**, averaged over the life of the project.

**Example.** A project costs ₹20,000 and its profit over 5 years is 3,000, 2,000, 4,000, 3,000 and 3,000. The average is ₹3,000, so ARR on the initial investment is 3,000 ÷ 20,000 = **15%**.

**Decision rule.** Management sets a **hurdle rate** before it starts. Example from the lecture: the money costs 8%, so the business says "I will only take a project that earns at least **12%**." That leaves a small margin of 4%. A project with a **negative** ARR is never taken. Among projects above the hurdle, the **highest ARR** wins, and the projects can be **ranked**: 17%, then 15%, then 12%.

**Strengths:** simple, quick, uses the **whole life** of the project, averages out good and bad years.
**Weaknesses:** it treats money from year 1 and money from year 7 as equal (it **ignores the time value of money**), and it is based on **profit, not cash**. A business must pay its debts in cash. Non-cash items such as depreciation are in profit but do not move any money.

## 3. Net present value (NPV)
The idea. ₹5,000 that arrives **a year from now** is worth less than ₹5,000 today, because today's money could earn something in the meantime. So to compare money at different dates we **shrink each future amount back to today's value** using a **discount rate**, usually the cost of money, and then add them up.

> **NPV = R1 ÷ (1 + i) + R2 ÷ (1 + i)^2 + ... + Rn ÷ (1 + i)^n − initial investment**

R is the net cash received in each year, i is the discount rate, and the exponent is the year number.

**Example.** Cost ₹10,000. Cash comes in as 5,000, 4,000, 3,000 and 2,000 over four years. The discount rate is 10%.`,

    sk(300, 'Present value: each year\'s money shrunk to today\'s value, then added', [
      { t: 'table', x: 150, y: 46, cols: [`Year`, `Cash`, `x factor at 10%`, `= Today's value`], colW: [90, 130, 170, 170], rowH: 30, hl: [5], title: `NPV of a ₹10,000 project, step by step`,
        rows: [
          [`0`, `-10,000`, `1.0000`, `-10,000`],
          [`1`, `5,000`, `0.9091`, `4,545`],
          [`2`, `4,000`, `0.8264`, `3,306`],
          [`3`, `3,000`, `0.7513`, `2,254`],
          [`4`, `2,000`, `0.6830`, `1,366`],
          [`NPV`, ``, ``, `+1,471`],
        ] },
      { t: 'note', x: 150, y: 256, w: 560, h: 32, text: `Inflows today: 4,545 + 3,306 + 2,254 + 1,366 = 11,471. Minus 10,000 = +1,471.`, fill: `yellow`, size: 14 },
    ]),

    `The **factor** for year t is 1 ÷ (1.10)^t, so it falls each year: 0.9091, 0.8264, 0.7513, 0.6830. The project's inflows are worth ₹11,471 in today's money, and it costs ₹10,000. **NPV = +₹1,471.**

**Decision rule.**
- **Positive NPV:** accept. The project earns more than the cost of the money used.
- **Zero NPV:** break-even; normally not taken.
- **Negative NPV:** reject. It destroys value.
- Between projects, choose the **highest NPV**.

**Strengths:** it **uses the time value of money** and the **whole life** of the project, including any scrap value at the end. **Weakness:** you must choose a discount rate, and the arithmetic is heavier (in practice a spreadsheet's NPV function does it).

## 4. Internal rate of return (IRR)
NPV needs you to know the cost of money. **IRR turns the question around:** what yearly return does the project itself deliver? It is the **discount rate at which the NPV becomes exactly zero**, so that the present value of the money in equals the present value of the money out.

For the same project, NPV is +1,471 at 10% and +488 at 15%, but **-355 at 20%**. So the NPV reaches zero between 15% and 20%. Trying values gives **IRR = about 17.8%**. Nobody does this by hand: a spreadsheet's IRR function does it.`,

    sk(250, 'NPV falls as the discount rate rises; the IRR is where it touches zero', [
      { t: 'line', x1: 70, y1: 14, x2: 70, y2: 196 },
      { t: 'line', x1: 70, y1: 120, x2: 710, y2: 120 },
      { t: 'text', x: 60, y: 120, text: `0`, size: 14, anchor: `end` },
      { t: 'text', x: 60, y: 24, text: `NPV`, size: 14, anchor: `end` },
      { t: 'line', x1: 80, y1: 8, x2: 320, y2: 79, color: `#2f6fd0` },
      { t: 'line', x1: 320, y1: 79, x2: 440, y2: 106, color: `#2f6fd0` },
      { t: 'line', x1: 440, y1: 106, x2: 560, y2: 130, color: `#2f6fd0` },
      { t: 'line', x1: 560, y1: 130, x2: 680, y2: 150, color: `#2f6fd0` },
      { t: 'circle', x: 507, y: 120, r: 9, label: ``, fill: `yellow`, solid: true },
      { t: 'text', x: 507, y: 100, text: `IRR = 17.8%`, size: 16, bold: true, color: `#c2410c` },
      { t: 'text', x: 345, y: 52, text: `+1,471 at 10%`, size: 14, color: `#2f6fd0` },
      { t: 'text', x: 560, y: 152, text: `-355 at 20%`, size: 14, color: `#2f6fd0` },
      { t: 'text', x: 80, y: 214, text: `0%`, size: 14 },
      { t: 'text', x: 320, y: 214, text: `10%`, size: 14 },
      { t: 'text', x: 560, y: 214, text: `20%`, size: 14 },
      { t: 'text', x: 400, y: 238, text: `discount rate`, size: 14, color: `#4a5568` },
    ]),

    `**Decision rule.** Compare the IRR with the **cost of capital** (or the hurdle rate).
- **IRR higher than the cost:** accept.
- **IRR equal to the cost:** break-even.
- **IRR lower than the cost:** reject.
- Between projects, the **higher IRR** is preferred.

## The four side by side
| | Payback | ARR | NPV | IRR |
|---|---|---|---|---|
| Uses time value of money | No | No | **Yes** | **Yes** |
| Uses the whole life of the project | No | Yes | **Yes** | **Yes** |
| Based on | Cash | Profit | Cash | Cash |
| Easy to calculate | Very | Yes | Needs a calculator | Needs a calculator |
| Accept when | Shorter is better | Above the hurdle rate | Positive | Above the cost of capital |

The lecture's verdict: payback and ARR are **simple and quick**, but **NPV and IRR are the best** because they respect the time value of money and the full life of the project. In real work use payback as a **quick first screen** and NPV or IRR for the final decision.

## Worked example: Ravi's two surviving projects
In the last lesson Ravi kept two ideas. All figures are in **₹ lakh**. Each costs ₹10 lakh. His bank loan costs 10%.
- **Namkeen line:** net cash 5, 4, 3 and 2 lakh over four years (it sells all year, so money comes early).
- **Gift cookie packs:** net cash 2, 3, 4 and 5 lakh (the brand takes time to build, so money comes late).

| | Namkeen line | Gift cookie packs |
|---|---|---|
| Total cash over 4 years | 14 | 14 |
| **Payback** | 2.3 years | 3.2 years |
| **ARR** (profit 4 lakh over 4 years = 1 lakh a year, on ₹10 lakh) | 10% | 10% |
| **NPV at 10%** | **+₹1.47 lakh** | +₹0.72 lakh |
| **IRR** | **17.8%** | 12.8% |

ARR cannot tell the two apart, because the totals are the same. Payback, NPV and IRR show that the namkeen line is better because its money comes sooner. If Ravi sets a **hurdle of 15%**, only the namkeen line passes. He chooses it.`,

    { analogy: `Payback is the **time to recoup an infrastructure spend**. ARR is the **average utilisation**. NPV is a **total return expressed in today's rupees**, like valuing a stream of future payments by what they are worth now. IRR is the **APR of the project**: just as you can work backwards from a loan's EMIs to the interest rate being charged, you can work backwards from a project's cash flows to the yearly return it gives. A slow system that responds late is worth less, and so is late money.` },

    { warn: `Easy mistakes:
- **Choosing by payback alone.** Two projects with equal payback can be very different.
- **Mixing the ARR basis** (average investment for one project, initial for another).
- **Treating profit as cash.** Depreciation lowers profit but takes no cash out.
- **Using an unrealistic discount rate.** Use the real cost of the money: the loan interest or what the owner's own money could earn.
- **Believing the forecast.** The numbers are only as good as the sales, cost and price estimates. Test them against a worse case.
- **Quoting 17.8% as a fact** in a report without saying how the cash flows were estimated.` },

    { real: `Put these four numbers in the project report as a small table, and write one sentence on each ("Money is back in 2.3 years; NPV is positive at the bank's 10%; IRR is 17.8%"). Ask a bank which discount or hurdle rate it expects, so your table uses the same one. Build a one-sheet spreadsheet template with the NPV and IRR functions for your clients.` },

    { remember: `- **Payback:** time to recover the cost. **Shorter is better.** Ignores timing and later years.
- **ARR = average yearly profit ÷ investment × 100.** Accept if above the **hurdle rate**; never if negative. Ignores time value; based on profit.
- **NPV = present value of inflows − investment.** Accept if **positive**; zero = break-even; negative = reject. Highest NPV wins.
- **IRR:** the rate at which NPV = 0. Accept if **above the cost of capital**. Higher IRR is better.
- **NPV and IRR are the best methods**: they use the time value of money and the whole life.` },
  ],
  quiz: [
    { q: `A project costs ₹10,000 and earns ₹3,000, ₹4,000, ₹3,000 and ₹5,000 in years 1 to 4. What is the payback period?`, o: [`About 2.5 years`, `About 3 years`, `Exactly 3 years`, `About 4 years`], a: 2, why: `After 3 years the total is 3,000 + 4,000 + 3,000 = 10,000, so the cost is just recovered at the end of year 3.` },
    { q: `What is the main weakness of the payback period?`, o: [`It needs a computer`, `It ignores when the money comes and what happens after payback`, `It cannot be calculated`, `It uses the cost of capital`], a: 1, why: `Payback ignores the timing of inflows inside the payback period and the project's later life.` },
    { q: `A business has a hurdle rate of 12%. A project's ARR is 9%. What should it do?`, o: [`Accept it`, `Accept it if payback is short`, `Reject it`, `Wait a year`], a: 2, why: `An ARR below the hurdle rate means the project earns less than the minimum the business decided on.` },
    { q: `The NPV of a project at the business's cost of money is +₹2,000. What does that mean?`, o: [`The project earns more than the cost of money, so accept`, `The project loses ₹2,000`, `The project has no value`, `The project breaks even`], a: 0, why: `A positive NPV means the present value of inflows is more than the money put in: accept the project.` },
    { q: `A project's IRR is 14% and the loan costs 10%. What is the decision?`, o: [`Cannot tell without the payback`, `Reject: IRR is higher than the cost`, `Break-even`, `Accept: IRR is higher than the cost`], a: 3, why: `When the IRR is above the cost of capital, the project earns more than it costs to finance, so it is accepted.` },
    { q: `Why are NPV and IRR considered better than payback and ARR?`, o: [`They are shorter to write`, `They use the time value of money and the whole life of the project`, `They ignore costs`, `They need no estimates`], a: 1, why: `NPV and IRR discount future money and cover the entire life of the project, which payback and ARR do not.` },
  ],
};
