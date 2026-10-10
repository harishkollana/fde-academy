import { sk } from '../_kit.js';

export default {
  title: `The revised MSME limits: two tests, one rule for moving up`,
  goal: `You can classify a business as micro, small or medium from its investment and turnover, apply the upgrade and downgrade rule, and combine several units that share one PAN.`,
  covers: [`Composite criteria`, `The limits from 1 April 2025`, `Higher band wins`, `Upgrade and downgrade`, `One PAN is one enterprise`],
  terms: [
    [`Classification`, `Putting a business into one of three size bands: micro, small or medium.`],
    [`Composite criteria`, `A test with two parts that are both checked: investment and annual turnover.`],
    [`Investment`, `Money put into plant and machinery (for a maker of goods) or into equipment (for a service business).`],
    [`Plant and machinery`, `The machines, tools and fixed installations a factory uses to make goods.`],
    [`Equipment`, `What a service business invests in, such as laptops, or the scanners and beds of a hospital.`],
    [`Annual turnover`, `Total sales of the business in a year.`],
    [`Ceiling`, `The upper limit of a band. A unit above the ceiling moves to the next band.`],
    [`MSME Act, 2006`, `The Micro, Small and Medium Enterprises Development Act, 2006: the law behind all these rules. Whenever the course says "the Act", this is the one.`],
    [`Upgrade / downgrade`, `Moving to a bigger band (upgrade) or a smaller band (downgrade).`],
    [`PAN`, `Permanent Account Number, the tax identity of a person or business.`],
    [`GSTIN`, `GST registration number. One PAN can hold several GSTINs.`],
    [`Clubbing`, `Adding the investment and turnover of all units that share one PAN, and judging the total.`],
  ],
  blocks: [
    `## Why "revised"?
The size limits for micro, small and medium are not fixed for ever. The government changes them as the economy grows, so a Corporate Mitra must always use the **latest** table. The lecture teaches the one that applies **from 1 April 2025**, shown on the website of the **Ministry of Micro, Small and Medium Enterprises**. Two things to note straight away:

- The limits are the **same for manufacturing and service** businesses. There are no separate tables.
- The rules come from the **MSME Act, 2006**.

Because limits can change again, always confirm the numbers on the official ministry or Udyam site before you advise a client.

## Two tests, and both are used
To classify a business you check **two numbers**:
1. **Investment** in plant and machinery or equipment.
2. **Annual turnover**.

This is the **composite criteria**: two conditions looked at together. The table says "plant and machinery **or** equipment" only because one table serves both kinds of business. A **maker of goods** is judged on its plant and machinery. A **service business** is judged on its equipment (a consultancy's laptops, a hospital's machines).

## The limits (₹ crore)
A unit is **micro** if investment is up to ₹2.5 crore **and** turnover is up to ₹10 crore. It is **small** if investment is above ₹2.5 crore but up to ₹25 crore **and** turnover is above ₹10 crore but up to ₹100 crore. It is **medium** if investment is above ₹25 crore but up to ₹125 crore **and** turnover is above ₹100 crore but up to ₹500 crore.`,

    sk(262, 'The limits and the pattern behind them (check the official site for the latest)', [
      { t: 'table', x: 40, y: 46, cols: [`Size`, `Investment up to`, `Turnover up to`], colW: [130, 200, 200], rowH: 36, title: `Limits in force from 1 April 2025 (₹ crore)`,
        rows: [[`Micro`, `2.5`, `10`], [`Small`, `25`, `100`], [`Medium`, `125`, `500`]] },
      { t: 'arrow', x1: 612, y1: 110, x2: 612, y2: 140, label: `x10 on both`, lx: 50 },
      { t: 'arrow', x1: 612, y1: 146, x2: 612, y2: 176, label: `x5 on both`, lx: 50 },
      { t: 'note', x: 50, y: 214, w: 510, h: 40, text: `In every row, the turnover limit is 4 times the investment limit.`, fill: `yellow`, size: 16 },
    ]),

    `**A memory trick from the lecture.** Learn only 2.5 and 10 for micro. Then multiply **by 10** to get small (25 and 100). Then multiply **by 5** to get medium (125 and 500). And in every row **turnover = 4 x investment**.

Notice what the table does *not* say. A micro unit with ₹3 crore of sales and ₹1 crore of machines is micro. A unit with ₹1 crore of machines and ₹12 crore of sales is not.

## The higher band wins
A business can fall in one band by investment and in another band by turnover. In that case it belongs to the **higher** band. The grid shows where every combination lands.`,

    sk(260, 'Investment decides one band, turnover decides another; the higher one wins', [
      { t: 'table', x: 100, y: 46, cols: [`invest. \\ turn.`, `up to 10`, `10 to 100`, `100 to 500`], colW: [170, 130, 140, 140], rowH: 36, title: `Where the unit lands (₹ crore)`,
        rows: [[`up to 2.5`, `Micro`, `Small`, `Medium`], [`2.5 to 25`, `Small`, `Small`, `Medium`], [`25 to 125`, `Medium`, `Medium`, `Medium`]] },
      { t: 'note', x: 70, y: 212, w: 640, h: 40, text: `Above 125 crore of investment or 500 crore of turnover the unit is no longer an MSME.`, fill: `yellow`, size: 15 },
    ]),

    `**Ravi's biscuit unit.** Machines worth ₹1.8 crore. Sales of ₹12 crore. By investment it is micro (under 2.5). By turnover it is small (above 10, up to 100). The higher band wins, so Ravi's unit is **small**.

**Meena's tailoring unit.** Machines worth ₹4 lakh. Sales of ₹8 lakh. Both are far below the micro ceilings, so it is **micro**.

The lecture's own example: machinery of ₹1 crore and turnover of ₹2 crore. Both are within the micro ceilings, so the unit is micro.

## Moving up is easy, moving down is hard
Think about a unit that is micro today and crosses a ceiling.

**Upgrade: ONE ceiling crossed is enough.** If investment goes above ₹2.5 crore, or turnover goes above ₹10 crore, even if the other number stays low, the unit leaves micro and goes to **small**. The same applies from small to medium.

**Downgrade: BOTH numbers must fall.** A unit is placed in a lower band only if it goes **below the ceiling of its present band in both** investment and turnover. If only one falls, the unit stays where it is.

| Case | Last year | This year | Result |
|---|---|---|---|
| A small unit | investment ₹8 cr, turnover ₹55 cr | investment ₹2 cr, turnover ₹15 cr | **Stays small.** Investment is micro-sized but turnover is still above ₹10 cr |
| A small unit | investment ₹8 cr, turnover ₹55 cr | investment ₹1.5 cr, turnover ₹8 cr | **Becomes micro.** Both are within the micro ceilings |
| A micro unit | investment ₹2 cr, turnover ₹9 cr | investment ₹3 cr, turnover ₹9 cr | **Becomes small.** One ceiling crossed |`,

    { analogy: `This is how a good **alerting system** works. An alert fires when **any one** metric crosses its threshold (CPU **or** memory **or** error rate). But the alert resolves only when **all** the metrics are back under their thresholds. If it cleared as soon as one metric dipped, it would flap on and off. The MSME rule is the same: **OR to go up, AND to come down**.` },

    `## One PAN is one enterprise
Many business owners run more than one unit. Can they split a big business into small units to look like a micro enterprise? The rule closes that gap with **one PAN = one enterprise**.

First, why one PAN can have several GSTINs:
- **Different states or union territories:** a separate GSTIN is **mandatory** in each. A company working in Delhi and Haryana has two GSTINs on one PAN.
- **Same state, different business lines:** a separate GSTIN is **optional** (and GST law has conditions). One owner with a textile business and a restaurant in Delhi has one PAN but may take two GSTINs.
- **Several branches of the same business in one state:** usually one GSTIN is enough.

For MSME purposes it does not matter how many GSTINs there are. **Udyam registration is based on the PAN.** All units under the same PAN are treated as **one enterprise**, and their **investment and turnover are added together** (clubbed) before the band is decided.`,

    sk(320, 'Two units, one PAN: add the numbers first, then classify', [
      { t: 'box', x: 20, y: 30, w: 220, h: 70, label: `Unit 1: furniture`, sub: `invest 1.70 cr, sales 20 cr`, fill: `blue` },
      { t: 'box', x: 20, y: 150, w: 220, h: 70, label: `Unit 2: electronics`, sub: `invest 2.50 cr, sales 30 cr`, fill: `green` },
      { t: 'circle', x: 385, y: 125, r: 54, label: `One PAN`, fill: `yellow`, size: 17 },
      { t: 'arrow', x1: 242, y1: 68, x2: 338, y2: 108 },
      { t: 'arrow', x1: 242, y1: 184, x2: 338, y2: 144 },
      { t: 'arrow', x1: 442, y1: 125, x2: 492, y2: 125 },
      { t: 'box', x: 494, y: 90, w: 250, h: 70, label: `4.20 cr + 50 cr`, sub: `so: SMALL enterprise`, fill: `orange` },
      { t: 'note', x: 40, y: 252, w: 680, h: 50, text: `The lecture wrote the investment total as 3.20 crore. 170 lakh + 250 lakh = 420 lakh = 4.20 crore.\nThe result is the same: above the micro ceilings, within the small ones.`, fill: `yellow`, size: 14 },
    ]),

    `**Garg's two units** (the sketch): investments of ₹1.70 crore and ₹2.50 crore add up to ₹4.20 crore, turnovers of ₹20 crore and ₹30 crore add up to ₹50 crore. Both totals are above the micro ceilings and within the small ones, so the whole enterprise is **small**. Each unit alone (₹1.70 crore, ₹20 crore) would look micro or small in different ways, but the owner is judged on the total.

**A rice mill and a flour mill under one PAN.** Investments ₹40 lakh + ₹80 lakh = ₹1.20 crore (within micro). Turnovers ₹7.5 crore + ₹3.5 crore = ₹11 crore (above the micro ceiling of ₹10 crore). Higher band wins: the enterprise is **small**, although the investment alone is tiny.`,

    { warn: `Easy mistakes:
- **Using the old table.** Old and new limits are both in circulation (the next lessons compare them). Use the table in force today, and say "check the official site".
- **Judging a unit alone** when the owner has other units on the same PAN. Add them first.
- **Downgrading because only one number fell.** Both must be below the present band.
- **Mixing units:** the table is in **crore**. Convert lakh to crore (100 lakh = 1 crore) before comparing.
- **Judging a service business by "plant and machinery".** Use its equipment.` },

    { real: `Make a small **classification sheet** for each client: columns for unit name, GSTIN, investment, turnover, with a TOTAL row for the PAN. Fill the totals first, then read off the band using the grid. When the client asks "can I stay micro if I split the business?", show them this sheet: the PAN decides, not the number of units.` },

    { remember: `- Two tests: **investment** (plant and machinery or equipment) **and annual turnover**.
- Limits from **1 April 2025** (check the official site): micro **2.5 cr / 10 cr**, small **25 cr / 100 cr**, medium **125 cr / 500 cr**. Same for manufacturing and services.
- Pattern: **x10** from micro to small, **x5** from small to medium, **turnover = 4 x investment**.
- **Higher band wins** when the two numbers disagree.
- **Upgrade if one** ceiling is crossed. **Downgrade only if both** fall below the present band.
- **One PAN = one enterprise.** Club all units' investment and turnover.` },
  ],
  quiz: [
    { q: `An enterprise has investment of ₹2 crore and turnover of ₹9 crore. Which band is it in?`, o: [`Not an MSME`, `Small`, `Medium`, `Micro`], a: 3, why: `Both numbers are within the micro ceilings of ₹2.5 crore and ₹10 crore.` },
    { q: `Investment is ₹1 crore but turnover is ₹30 crore. What is the band?`, o: [`Micro, because investment is low`, `Small, because turnover is above ₹10 crore`, `Medium`, `It cannot be classified`], a: 1, why: `Investment alone says micro, turnover says small. The higher band wins.` },
    { q: `Which pair of ceilings belongs to a medium enterprise?`, o: [`₹125 crore and ₹500 crore`, `₹2.5 crore and ₹10 crore`, `₹25 crore and ₹100 crore`, `₹250 crore and ₹1,000 crore`], a: 0, why: `Medium: investment up to ₹125 crore and turnover up to ₹500 crore.` },
    { q: `A small unit's investment falls to ₹2 crore but its turnover is still ₹15 crore. What happens?`, o: [`It becomes micro`, `It stays small`, `It becomes medium`, `Its registration is cancelled`], a: 1, why: `A downgrade needs both numbers to fall within the lower band. Turnover is still above the micro ceiling of ₹10 crore.` },
    { q: `One owner has three units with different GSTINs but the same PAN. How is the size decided?`, o: [`Each unit separately`, `Only the biggest unit`, `Only the oldest unit`, `By adding the investment and turnover of all three`], a: 3, why: `One PAN is one enterprise for classification, so the numbers are clubbed.` },
    { q: `By what number do you multiply the investment ceiling to get the turnover ceiling in each band?`, o: [`2`, `4`, `5`, `10`], a: 1, why: `2.5 x 4 = 10, 25 x 4 = 100 and 125 x 4 = 500.` },
  ],
};
