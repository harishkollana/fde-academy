import { sk, flow } from '../_kit.js';

export default {
  title: `Old versus new MSME classification: 2006, 2020 and 2025`,
  goal: `You can describe how the MSME definition changed in 2006, 2020 and 2025, say why each change was made, and re-classify a unit under each rule book.`,
  covers: [`The 2006 rules (investment only)`, `The 2020 reform (turnover added)`, `The 2025 limits`, `Why the rules kept changing`, `Comparing the three`],
  terms: [
    [`MSMED Act, 2006`, `The law that gave MSMEs their legal definition ("statutory recognition") for the first time.`],
    [`Statutory recognition`, `Being defined and protected by an Act of Parliament, not only by a government scheme.`],
    [`Notification`, `An official government order published to bring a rule or a change in a limit into force.`],
    [`Atmanirbhar Bharat package`, `The set of economic announcements of May 2020, made during the Covid-19 period, which included a new MSME definition.`],
    [`Investment-only test`, `The 2006 system: size was judged only by money invested in plant, machinery or equipment.`],
    [`Composite criteria`, `The test from 2020 onwards: investment and turnover, both checked.`],
    [`Ceiling`, `The upper limit of a band.`],
    [`Graduating out`, `Growing so much that a unit leaves the MSME category and loses its benefits.`],
    [`Productive capacity`, `How much a business is able to produce. Investment is a guide to it; turnover shows whether it is really used.`],
    [`Udyam registration`, `The registration system, based on PAN and GST, that came with the 2020 revision.`],
    [`Digital integration`, `Linking PAN, GST and income-tax data so that the portal reads the figures instead of trusting what the owner types.`],
    [`Manufacturing vs service enterprise`, `In 2006 the two had separate limits. Since 2020 they share one table.`],
  ],
  blocks: [
    `## Why learn the history?
A client may say "my friend told me the limit is 25 lakh", or show you an old chart or an old certificate. If you know **what the old rules were and why they were replaced**, you can explain to the client why the number is different today, and you will never quote an old limit by mistake.

There are **three eras**. The idea behind each is the real lesson, more than the numbers.`,

    sk(300, 'Three rule books, each fixing a problem of the one before', [
      ...flow([
        { label: `2006 to 2020`, sub: `investment only`, fill: `orange` },
        { label: `2020 to 2025`, sub: `investment + turnover`, fill: `yellow` },
        { label: `From 1 April 2025`, sub: `same test, new limits`, fill: `green` },
      ], { y: 20, h: 76, gap: 44, x: 10, w: 740 }),
      { t: 'note', x: 10, y: 140, w: 217, h: 84, text: `Separate limits for\ngoods and for services.\nNo turnover test.`, fill: `orange`, size: 15 },
      { t: 'note', x: 271, y: 140, w: 217, h: 84, text: `One table for both.\nTurnover test added.\nPAN and GST linked.`, fill: `yellow`, size: 15 },
      { t: 'note', x: 532, y: 140, w: 217, h: 84, text: `Ceilings raised.\nThe test itself is\nunchanged.`, fill: `green`, size: 15 },
      { t: 'text', x: 380, y: 262, text: `Each change answered a complaint about the rule before it`, size: 16, color: `#c2410c` },
    ]),

    `## Era 1: 2006 to June 2020, investment only
The **MSMED Act, 2006** gave MSMEs their first legal definition (**statutory recognition**). The rules were in force from **2 October 2006**. Two features:

- **Only investment** was measured. There was **no turnover test**.
- **Goods and services had separate limits.** A manufacturer was judged on **plant and machinery**, a service business on **equipment**, and the manufacturing limits were higher because factories need more capital.

| Band | Manufacturing: plant and machinery | Service: equipment |
|---|---|---|
| Micro | up to ₹25 lakh | up to ₹10 lakh |
| Small | above ₹25 lakh, up to ₹5 crore | above ₹10 lakh, up to ₹2 crore |
| Medium | above ₹5 crore, up to ₹10 crore | above ₹2 crore, up to ₹5 crore |

(The lecture says "2 lakh" for the micro service limit in one place; it is **₹10 lakh**, as the lecture itself says a moment later.)

**What went wrong?**
- **A fear of growing.** If you add machines and cross the ceiling, you lose MSME benefits. Many owners **avoided expanding** to stay inside.
- **Investment is a poor measure of size on its own.** A business can have few machines and a very large turnover and still look small on paper. That gave an unfair advantage and an inaccurate picture.
- **Two sets of limits caused confusion and disputes.** Is a hospital, with expensive equipment, a service or a manufacturer?

## Era 2: July 2020 to March 2025, the reform
The **Atmanirbhar Bharat package** of **13 May 2020** announced a new definition meant to **remove the fear of graduating out**. It was **notified in June 2020 and came into force from 1 July 2020** (the lecture gives 1 June as the date; check the official notification if you need the exact day). Three big changes:

1. **One definition** for manufacturing and services.
2. **A turnover test added** next to investment for the first time. This is the **composite criteria**.
3. **Higher limits.** The announcement said medium would be ₹20 crore and ₹100 crore, but the final notification **raised medium to ₹50 crore and ₹250 crore**, because the first figures did not cover enough enterprises.

Also in this era, **export turnover and GST were left out of turnover**, and **PAN and GST were linked** to the **Udyam registration**, so the classification could be made from tax data.

## Era 3: from 1 April 2025, same test, higher ceilings
The test was **not changed**. Only the **ceilings** were raised, as the economy had grown and costs and prices had risen, so that **more enterprises stay inside the MSME umbrella** and can keep growing without suddenly losing scheme benefits. (These are the limits you learned last lesson.)`,

    sk(272, 'The upper limit of each band in the three eras (₹; lakh and crore as written)', [
      { t: 'table', x: 85, y: 46, cols: [`Band`, `2006 goods`, `2006 service`, `2020 inv/turn`, `2025 inv/turn`], colW: [90, 120, 130, 140, 140], rowH: 36, title: `Ceiling of each band (cr = crore)`,
        rows: [[`Micro`, `25 lakh`, `10 lakh`, `1 / 5 cr`, `2.5 / 10 cr`], [`Small`, `5 cr`, `2 cr`, `10 / 50 cr`, `25 / 100 cr`], [`Medium`, `10 cr`, `5 cr`, `50 / 250 cr`, `125 / 500 cr`]] },
      { t: 'note', x: 85, y: 214, w: 620, h: 44, text: `2006: investment only. 2020 and 2025: investment / turnover, one table for both.\nTurnover was 5 times the investment limit in 2020; it is 4 times in 2025.`, fill: `yellow`, size: 14 },
    ]),

    `## Why each change was made
Put the complaint next to the fix and the whole history makes sense.`,

    sk(290, 'Every change in the rules answered a real problem', [
      { t: 'box', x: 20, y: 14, w: 300, h: 52, label: `Only investment was measured`, fill: `red`, size: 16 },
      { t: 'arrow', x1: 326, y1: 40, x2: 434, y2: 40 },
      { t: 'box', x: 440, y: 14, w: 300, h: 52, label: `Turnover test added (2020)`, fill: `green`, size: 16 },
      { t: 'box', x: 20, y: 80, w: 300, h: 52, label: `Separate goods/service limits`, fill: `red`, size: 16 },
      { t: 'arrow', x1: 326, y1: 106, x2: 434, y2: 106 },
      { t: 'box', x: 440, y: 80, w: 300, h: 52, label: `One table for both (2020)`, fill: `green`, size: 16 },
      { t: 'box', x: 20, y: 146, w: 300, h: 52, label: `Fear: grow and lose benefits`, fill: `red`, size: 16 },
      { t: 'arrow', x1: 326, y1: 172, x2: 434, y2: 172 },
      { t: 'box', x: 440, y: 146, w: 300, h: 52, label: `Higher ceilings (2020, 2025)`, fill: `green`, size: 16 },
      { t: 'box', x: 20, y: 212, w: 300, h: 52, label: `Typed claims, easy to fake`, fill: `red`, size: 16 },
      { t: 'arrow', x1: 326, y1: 238, x2: 434, y2: 238 },
      { t: 'box', x: 440, y: 212, w: 300, h: 52, label: `PAN, GST and ITR data linked`, fill: `green`, size: 16 },
    ]),

    `The lecture sums up the policy shift in one line: from **a static, asset-based system** (how much machinery do you own?) to **a growth-oriented system** (are you turning that machinery into real sales?). Digital integration also **reduces manipulation and fake claims**, and nobody has to re-enter figures when a ceiling is crossed: the portal updates the class from the tax data.

| | 2006 to 2020 | 2020 to 2025 | From 1 April 2025 |
|---|---|---|---|
| What is measured | Investment only | Investment and turnover | Investment and turnover |
| Goods and services | Separate limits | One table | One table |
| Exports and GST in turnover | No turnover test | Excluded | Excluded |
| Data source | Declared | PAN, GST, ITR linked | PAN, GST, ITR linked |
| What changed | The first definition | Test and structure | Only the ceilings |`,

    { analogy: `Imagine a cloud provider whose **free tier** is defined only by **how many servers you provision**. Teams quietly keep the server count low but push huge traffic through them, so the tier is being abused. The provider fixes it by adding a second limit on **traffic**, merging the separate "API plan" and "batch plan" limits into one plan, and raising the limits as hardware gets cheaper. That is the MSME history: one metric gamed, a second metric added, two plans merged into one, ceilings raised with growth.` },

    `## Worked example: the same unit under three rule books
Take two units and measure each one by the rules of each era.

**Unit A** is a **service** firm with equipment (laptops) worth **₹15 lakh** and sales of **₹8 crore**.
**Unit B** is a **factory** with machinery worth **₹7 crore** and sales of **₹60 crore**.

| Unit | 2006 rules | 2020 rules | 2025 rules |
|---|---|---|---|
| **A** (service) | Equipment ₹15 lakh is above the micro service limit of ₹10 lakh: **small** | Investment is micro, but sales of ₹8 crore pass the ₹5 crore limit: **small** | Investment is micro and sales of ₹8 crore are within ₹10 crore: **micro** |
| **B** (factory) | Machinery of ₹7 crore is above ₹5 crore: **medium** | Investment is small, but sales of ₹60 crore pass ₹50 crore: higher band wins: **medium** | Investment ₹7 crore is within ₹25 crore and sales ₹60 crore within ₹100 crore: **small** |

Unit A got *smaller* in name as the limit rose. Unit B too. Both now sit in a band that matches their real size, and both can grow further before they leave the umbrella.`,

    { warn: `Common mistakes:
- **Quoting an old limit.** 25 lakh, 5 crore, 10 crore (2006) and 1, 10, 50 crore (2020) both still show up in books, videos and old forms. Use the 2025 table and say "check the official site".
- **Thinking goods and services still differ.** They stopped differing in 2020.
- **Believing that more machines now cost you your status.** The idea of the reform is that you can grow within wider ceilings, though crossing the top of medium still takes a unit out.
- **Mixing up dates.** The reform was announced in May 2020 and came into force on 1 July 2020, and the new ceilings applied from 1 April 2025.` },

    { real: `A client who registered years ago may have an **old certificate** that still shows a band under old rules. Explain the history in two sentences ("the rules were changed in 2020 and again in 2025"), then re-check the unit with today's table and the data on the portal. This is also a good moment to remind them that the classification is **updated from their tax data** each year, so their returns must be filed on time.` },

    { remember: `- **2006 to June 2020:** investment only; separate limits for manufacturing (₹25 lakh, ₹5 crore, ₹10 crore) and service (₹10 lakh, ₹2 crore, ₹5 crore).
- **From 1 July 2020:** one table, investment **and** turnover: ₹1 / 5, ₹10 / 50, ₹50 / 250 crore. Exports and GST left out of turnover. PAN and GST linked to Udyam.
- **From 1 April 2025:** same test; ceilings ₹2.5 / 10, ₹25 / 100, ₹125 / 500 crore.
- Reasons: the fear of growing, a weak single measure, two tables, easy-to-fake claims, and a growing economy.` },
  ],
  quiz: [
    { q: `Under the original 2006 classification, size was judged by...`, o: [`Turnover only`, `Number of employees`, `Investment and turnover`, `Investment only`], a: 3, why: `The 2006 system had only an investment test. The turnover test came in 2020.` },
    { q: `Under the 2006 rules, a manufacturing unit with plant and machinery of ₹3 crore was...`, o: [`Micro`, `Small`, `Medium`, `Large`], a: 1, why: `Small manufacturing meant above ₹25 lakh and up to ₹5 crore of plant and machinery.` },
    { q: `Which was a main reason for adding turnover to the test in 2020?`, o: [`To make the form shorter`, `To count exports`, `To separate goods from services`, `Investment alone did not show the real scale of a business`], a: 3, why: `Some units had low investment but very high turnover, and a unit's real scale is shown by how much it actually sells.` },
    { q: `The medium limits finally notified in 2020 were...`, o: [`₹50 crore and ₹250 crore`, `₹20 crore and ₹100 crore`, `₹125 crore and ₹500 crore`, `₹10 crore and ₹50 crore`], a: 0, why: `The package announced ₹20 and ₹100 crore, but the final notification raised medium to ₹50 crore and ₹250 crore.` },
    { q: `What did the 2025 revision change?`, o: [`Only the ceilings of the bands`, `The test and the ceilings`, `It brought back separate goods and service tables`, `It removed the turnover test`], a: 0, why: `The composite test and the single table stayed. Only the ceilings were raised.` },
    { q: `Why did the old investment-only rule create a "fear of growing"?`, o: [`Because machines were taxed heavily`, `Because expanding could push a unit above the ceiling and cost it MSME benefits`, `Because turnover was capped`, `Because exports were banned`], a: 1, why: `A unit that invested more could cross the ceiling, leave the MSME category and lose scheme benefits, so many did not expand.` },
  ],
};
