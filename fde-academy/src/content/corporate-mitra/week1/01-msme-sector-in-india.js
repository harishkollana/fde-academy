import { sk, flow, hub } from '../_kit.js';

export default {
  title: `The MSME sector in India`,
  goal: `You can say what MSME stands for, how the law came about, how a business is sorted into micro, small, medium or large, and what help the government gives small businesses.`,
  covers: [`What MSME means`, `History: 1993 to 2007`, `Four size categories`, `Two tests for size`, `How government helps`],
  terms: [
    [`MSME`, `Micro, Small and Medium Enterprises. The small and mid-sized businesses of India. The word "enterprise" simply means a business unit.`],
    [`Manufacturing enterprise`, `A business that makes a physical product: biscuits, bolts, bags.`],
    [`Service enterprise`, `A business that provides a facility instead of a product: a repair shop, a software team, a transport company, a salon.`],
    [`Trading`, `Buying goods and selling them again, without changing them (a shop or a wholesaler). It is covered by MSME only for limited purposes.`],
    [`Plant and machinery`, `The machines, tools and equipment a business uses to produce its goods or services. Land and buildings are NOT part of this.`],
    [`Turnover`, `Total sales of the business in one year. Also called "revenue from operations".`],
    [`Subsidy`, `Money the government gives to make up the gap between what a small business needs and what it has. Often called gap funding.`],
    [`Duty and cess`, `Duty is a tax on making, selling or importing goods. A cess is an extra charge for a particular purpose. Governments sometimes refund or waive these for small units.`],
    [`Tertiary sector`, `The service sector. Economists split an economy into primary (farming, mining), secondary (factories) and tertiary (services).`],
    [`GDP`, `Gross Domestic Product: the total value of everything a country produces in a year. The usual measure of the size of an economy.`],
    [`Ease of doing business`, `How easy it is to start and run a business in a place: how few forms, how little waiting. Governments and states are ranked on it.`],
    [`PLI scheme`, `Production Linked Incentive: money for large manufacturers who produce things India now mostly imports. Meant for large enterprises, not MSMEs.`],
  ],
  blocks: [
    `## Why small businesses matter: the squirrel and the bridge
When Lord Ram's army was building the bridge to Lanka, a tiny squirrel kept carrying dust in its beak and dropping it on the bridge. Others smiled. Lord Ram did not. He said: *any bridge, however big, will not gain strength without its dust particles.*

That is the idea behind **MSMEs**. Large factories get the attention, but the economy is held together by millions of small units: the workshop, the food unit, the repair shop, the small software firm. If they are not looked after, growth never reaches the common person. So governments **nurture** them with special laws and schemes.

## What does MSME stand for?
**M**icro, **S**mall and **M**edium **E**nterprises.

An **enterprise** is a business unit. There are two main kinds:
- **Manufacturing:** makes a product.
- **Service:** provides a facility to a customer.

**Trading** (buying and selling goods) is also counted, but **only for a limited purpose**. You will see exactly which purpose in later lessons, so just remember: trading is *in*, but not for every benefit.`,

    sk(300, 'MSMEs are the "dust" that holds the economy together. Every enterprise is one of three kinds.', [
      { t: 'box', x: 270, y: 14, w: 220, h: 62, label: `Enterprise`, sub: `any business unit`, fill: `yellow` },
      { t: 'box', x: 20, y: 150, w: 210, h: 74, label: `Manufacturing`, sub: `makes a product`, fill: `blue` },
      { t: 'box', x: 275, y: 150, w: 210, h: 74, label: `Service`, sub: `provides a facility`, fill: `green` },
      { t: 'box', x: 530, y: 150, w: 210, h: 74, label: `Trading`, sub: `buys and sells goods`, fill: `orange` },
      { t: 'arrow', x1: 330, y1: 78, x2: 140, y2: 148 },
      { t: 'arrow', x1: 380, y1: 78, x2: 380, y2: 148 },
      { t: 'arrow', x1: 430, y1: 78, x2: 630, y2: 148 },
      { t: 'text', x: 125, y: 252, text: `example: biscuit factory`, size: 14, color: '#4a5568' },
      { t: 'text', x: 380, y: 252, text: `example: repair shop, IT firm`, size: 14, color: '#4a5568' },
      { t: 'text', x: 635, y: 252, text: `counted for limited purposes`, size: 14, color: '#c2410c' },
      { t: 'text', x: 380, y: 282, text: `The word "industry" used to mean only factories. Today service is the biggest part of the economy.`, size: 13, color: '#5c6478' },
    ]),

    `## How the law grew
Before 2006, Indian businesses were split into only two groups: **small scale** and **large scale**. The course dates the first formal recognition of small scale to **1993**, under the *Small Scale Industrial Undertaking* law. Look at the name: it says **industrial**, because in those days almost nobody thought about services.

Then the economy changed. By the start of the 21st century the **service sector** was growing fast and the needs of different small businesses had clearly drifted apart. A tea stall and a 100-person factory cannot be given the same help.

So in **2006** Parliament passed the **Micro, Small and Medium Enterprises Development (MSMED) Act**, which split "small scale" into **three tiers**: micro, small and medium. In **2007** the central government set up a separate **Ministry of MSME**. Most states now have their own MSME department too.

> **Why do states have their own?** India's Constitution divides subjects into lists: the *Union list* (the Centre decides), the *State list* (states decide), the *Concurrent list* (both share), and a leftover list for anything nobody thought of in 1950, which goes to the Centre. For small business, the Centre and the states both run schemes. That is why you will meet central **and** state rules throughout this course.`,

    sk(412, 'A timeline of the law, and five ways governments help MSMEs', [
      ...flow([
        { label: `Before 2006`, sub: `small-scale vs large only`, fill: `grey` },
        { label: `2006`, sub: `MSMED Act: 3 tiers`, fill: `blue` },
        { label: `2007`, sub: `Ministry of MSME`, fill: `green` },
      ], { y: 12, h: 66, x: 14, w: 732, gap: 50 }),
      ...hub(
        { label: `MSME\nhelp`, fill: `yellow` },
        [
          { label: `Subsidies`, sub: `gap funding`, fill: `orange` },
          { label: `Tax\nconcessions`, sub: `stamp duty, GST`, fill: `blue` },
          { label: `Duty and cess\nrelief`, sub: `refund or exemption`, fill: `purple` },
          { label: `Support\nservices`, sub: `consultants, clusters`, fill: `green` },
          { label: `Ease of doing\nbusiness`, sub: `states compete`, fill: `teal` },
        ],
        { cx: 380, cy: 264, rx: 290, ry: 108, r: 46, bw: 170, bh: 78 },
      ),
    ]),

    { analogy: `Think of **MSME categories as pricing tiers** of a product: Free, Pro, Enterprise. Each tier gets different features and support, so a scheme can say "available for micro and small only". And the **Constitution's lists are like API ownership**: some endpoints are owned by the Centre, some by the states, and some are shared. Always ask "who owns this rule?" first.` },

    `## How the government helps
Both the Centre and the states help MSMEs in five main ways. You will study each scheme properly in Week 3. For now, learn the five names.

| Help | What it means |
|---|---|
| **Subsidies** | A subsidy is **gap funding**. A small business has limited money but big plans, and the government pays part of the cost to close the gap. |
| **Tax concessions** | Lower stamp duty, relief in GST and other taxes under state schemes for micro, small and medium units. |
| **Refund or exemption of duties and cess** | The state gives some of the duty or cess back, or waives it, for businesses that need support. |
| **Support services** | Hands-on help, because a small owner may not know how to run a modern unit. One example is a **lean** scheme where an expert consultant improves the factory floor, with the government paying most of the consultant's fee (the course says 90%). |
| **Ease of doing business** | States are ranked every year on how easy they make it to run a business. The ranking is public so that states learn from each other and compete to offer the best support. |

Anyone starting a business, whether manufacturing or service, can use the schemes that are **active in their state at that time**. States keep renaming their policies too. You will see "industrial policy" quietly become "business policy", because "industrial" sounds like factories only.`,

    `## The four size categories
By size, an Indian enterprise is one of four kinds, from smallest to biggest:

1. **Micro**
2. **Small**
3. **Medium**
4. **Large**: anything bigger than all three of the others.

Below micro sits the **self-employed person** (a roadside vendor, a freelancer). That group is not yet an official category, though some governments are beginning to look at it. For now, remember **four**.

**Why does the category matter?** Because schemes are written for particular categories. A concession may exist only for micro and small units. A scheme like **PLI** (Production Linked Incentive) is meant for **large** companies because they have the money and technology to make products India today imports. If you do not know a business's category, you cannot tell which schemes it can use.`,

    sk(350, 'The size ladder. Micro, small and medium together are called MSME.', [
      { t: 'note', x: 20, y: 18, w: 330, h: 70, text: `Some schemes are only for micro and\nsmall units. Some are only for large\nones (example: the PLI scheme).`, fill: `yellow`, size: 15 },
      { t: 'box', x: 20, y: 206, w: 134, h: 56, label: `Self-employed`, sub: `no category yet`, fill: `grey`, size: 16 },
      { t: 'box', x: 166, y: 178, w: 134, h: 84, label: `Micro`, sub: `smallest`, fill: `blue` },
      { t: 'box', x: 312, y: 150, w: 134, h: 112, label: `Small`, sub: `bigger than micro`, fill: `green`, },
      { t: 'box', x: 458, y: 122, w: 134, h: 140, label: `Medium`, sub: `bigger than small`, fill: `yellow` },
      { t: 'box', x: 604, y: 94, w: 134, h: 168, label: `Large`, sub: `above all three`, fill: `orange` },
      { t: 'brace', x: 166, y: 274, w: 426, label: `MSME = micro + small + medium`, color: `#1971c2` },
    ]),

    `## Two tests decide the category
Which of the four does a business belong to? Two numbers decide it:

**Test 1: Investment in plant and machinery.** Count only the machines, tools and equipment the business has put money into. **Land and buildings are left out.**

**Test 2: Annual turnover.** Turnover is **sales for the whole year**, also called *revenue from operations*. Not a day, not a week, not a month. And **export sales are taken out** before you test it.

The exact rupee limits for each category are in the next lessons of Week 2. Here we only learn **what goes into each test**.`,

    sk(318, 'The two tests: what counts and what does not', [
      { t: 'box', x: 20, y: 12, w: 345, h: 62, label: `Test 1\nInvestment in plant and machinery`, fill: `blue`, size: 16 },
      { t: 'box', x: 395, y: 12, w: 345, h: 62, label: `Test 2\nAnnual sales (turnover)`, fill: `green`, size: 17 },
      { t: 'mark', x: 44, y: 106, ok: true }, { t: 'text', x: 66, y: 106, text: `machines, tools, equipment`, size: 16, anchor: `start` },
      { t: 'mark', x: 44, y: 142, ok: false }, { t: 'text', x: 66, y: 142, text: `land (left out)`, size: 16, anchor: `start` },
      { t: 'mark', x: 44, y: 178, ok: false }, { t: 'text', x: 66, y: 178, text: `buildings (left out)`, size: 16, anchor: `start` },
      { t: 'mark', x: 419, y: 106, ok: true }, { t: 'text', x: 441, y: 106, text: `sales for the full year`, size: 16, anchor: `start` },
      { t: 'mark', x: 419, y: 142, ok: true }, { t: 'text', x: 441, y: 142, text: `sales inside India`, size: 16, anchor: `start` },
      { t: 'mark', x: 419, y: 178, ok: false }, { t: 'text', x: 441, y: 178, text: `export sales (taken out)`, size: 16, anchor: `start` },
      { t: 'arrow', x1: 190, y1: 202, x2: 320, y2: 240 },
      { t: 'arrow', x1: 570, y1: 202, x2: 440, y2: 240 },
      { t: 'box', x: 190, y: 242, w: 380, h: 64, label: `Compare with the limits`, sub: `Micro? Small? Medium? Large?`, fill: `yellow` },
    ]),

    `## Worked example: Ravi's biscuit unit
Ravi's biscuit unit has these numbers for the year:

| Item | Amount |
|---|---|
| Machines and ovens | ₹40 lakh |
| Land and factory building | ₹2 crore |
| Total sales in the year | ₹3 crore |
| Of which, export sales | ₹50 lakh |

For **Test 1** only the machines count: **₹40 lakh**. The ₹2 crore of land and building is ignored.
For **Test 2** the export sales are taken out: ₹3 crore − ₹50 lakh = **₹2.5 crore**.

Those two numbers (₹40 lakh and ₹2.5 crore) are what you compare with the limits in Week 2.

> **Money units:** 1 lakh = 1,00,000 and 1 crore = 1,00,00,000 (a hundred lakh). So ₹40 lakh = ₹4,000,000 and ₹2 crore = ₹20,000,000.

## India's economy has three sectors
An economy is usually split into **primary** (agriculture), **secondary** (manufacturing) and **tertiary** (services). When India became independent, services were small. Today the **service sector is the largest contributor to GDP**. This is the pattern in every developed country: as an economy grows, agriculture's share falls, then industry's, and services rise. This is why the law moved from "small scale **industrial** undertakings" to "enterprises".`,

    { warn: `Three slips beginners make:
- **Counting land and building in the investment test.** Only plant and machinery counts.
- **Forgetting that exports are taken out of turnover.** The test uses sales excluding exports.
- **Thinking trading is fully covered.** It is included only for limited purposes, so check each scheme before promising a benefit.` },

    { real: `A first-time entrepreneur will ask, "Am I micro, small or medium, and what can I get?" You will not answer from memory. You will ask for two numbers, **machinery cost** and **yearly sales without exports**, and then check them against the current limits. Get into this habit now.` },

    { remember: `- **MSME = Micro, Small and Medium Enterprises.** An enterprise can be manufacturing, service, or (for limited purposes) trading.
- Before **2006** only small-scale and large-scale existed. The **MSMED Act 2006** created the three tiers; the **Ministry of MSME** was set up in **2007**. States have their own MSME departments too.
- Four categories: **micro, small, medium, large.** Schemes differ by category (PLI is for large units).
- Category depends on **two tests**: **investment in plant and machinery** (no land or building) and **annual turnover** (no exports).
- Help comes as **subsidies, tax concessions, duty and cess relief, support services** and an **ease-of-doing-business** race between states.
- Services are now the **largest part of GDP**.` },
  ],
  quiz: [
    { q: `What does the first M in MSME stand for?`, o: [`Mini`, `Minute`, `Micro`, `Medium`], a: 2, why: `MSME is Micro, Small and Medium Enterprises. Micro is the smallest tier.` },
    { q: `Which law created the three tiers micro, small and medium?`, o: [`MSMED Act 2006`, `Companies Act 2013`, `GST Act 2017`, `Small scale law of 1993`], a: 0, why: `The Micro, Small and Medium Enterprises Development Act 2006 split "small scale" into three tiers. The 1993 law was only about small scale.` },
    { q: `In which year was the separate Ministry of MSME set up at the Centre?`, o: [`1993`, `2006`, `2001`, `2007`], a: 3, why: `The law came in 2006 and the Ministry was set up a year later, in 2007.` },
    { q: `Which two criteria sort an enterprise into micro, small, medium or large?`, o: [`Capital and turnover`, `Investment (plant and machinery) and turnover`, `Capital and investment`, `Number of workers and profit`], a: 1, why: `The two tests are investment in plant and machinery, and annual turnover.` },
    { q: `Which of these is left out of the "investment" test?`, o: [`A lathe machine`, `An oven`, `Land and building`, `A packing machine`], a: 2, why: `Only plant and machinery counts. Land and buildings are excluded.` },
    { q: `Trading enterprises are covered under MSME...`, o: [`for all benefits`, `for no benefit`, `for limited purposes only`, `only if they export`], a: 2, why: `Trading is included in MSME, but only for limited purposes.` },
  ],
};
