import { sk, flow } from '../_kit.js';

export default {
  title: `MSME classification: what counts as an enterprise?`,
  goal: `You can say what the four letters M, S, M and E stand for, decide whether an activity is an enterprise, and tell a goods activity (production, manufacturing, processing) from a service activity.`,
  covers: [`The four letters of MSME`, `What an enterprise is`, `Production, manufacturing, processing`, `Service enterprises`, `Small ideas that grew big`],
  terms: [
    [`MSME`, `Micro, Small and Medium Enterprise. The official name for the small-business sector of India.`],
    [`Enterprise`, `Any activity that makes goods or provides services, run by someone who takes the risk and owns the result. The word is about WHAT you do, not how big you are.`],
    [`Production`, `Growing or generating something that did not exist before: crops, milk, sugarcane, electricity.`],
    [`Manufacturing`, `Turning raw material into a new, sellable finished product: wood into a cupboard, flour into bread.`],
    [`Processing`, `Improving or changing a material that already exists, without creating a brand-new product: polishing rice, grinding spices, assembling parts.`],
    [`WIP`, `Work in process: the half-finished stage between raw material and finished goods.`],
    [`Finished goods`, `The final product, ready to be sold.`],
    [`Service enterprise`, `An enterprise that sells a skill or a job done, not a thing: a doctor, a lawyer, a barber, a transport company.`],
    [`Make in India`, `A government campaign to encourage products to be made inside India, including by small units.`],
    [`D2C`, `Direct to consumer: a brand that sells straight to the customer online, without a shop or a distributor in between.`],
    [`Supply chain`, `The chain of businesses that pass material or work from one to the next until a product reaches the customer.`],
    [`Udyam`, `The government portal on which MSMEs are registered. Registration comes later in this week.`],
  ],
  blocks: [
    `## Where Week 2 is going
Week 1 was about the **legal form** of a business: proprietorship, partnership, LLP, company. Week 2 asks a different question: **how big is this business in the government's eyes, and how do we register it as an MSME?**

Anybody who walks up to you and says "please get my MSME registered" is sent to one place: the **Udyam registration portal**. It is the only portal on which MSMEs are registered. Before you can fill that form you must understand five things, and Week 2 teaches them in this order:

| Step | Question it answers |
|---|---|
| Classification | Is this micro, small or medium, and what was it before the rules changed? |
| Objectives and eligibility | Why does registration exist, and who can do it? |
| Documents | What must the client bring? |
| The Udyam process | Which screens, which fields, which code for the activity (the NIC code)? |
| Project selection | If the client has no business yet, how do they pick an idea that can work? |

This first lesson answers the question that comes before all of them: **what is an enterprise at all?**`,

    `## The four letters
**MSME** is four words: **M**icro, **S**mall, **M**edium and **E**nterprise.

The first three words describe **size**. How size is measured (money invested and turnover) is the next two lessons. The last word, **Enterprise**, describes the **kind of activity**. An activity must first be an enterprise. Only then does anyone ask whether it is micro, small or medium.`,

    sk(250, 'Three words give the size, one word gives the kind of activity', [
      { t: 'box', x: 20, y: 24, w: 150, h: 70, label: `Micro`, sub: `smallest`, fill: `green` },
      { t: 'box', x: 210, y: 24, w: 150, h: 70, label: `Small`, sub: `middle`, fill: `yellow` },
      { t: 'box', x: 400, y: 24, w: 150, h: 70, label: `Medium`, sub: `largest of the three`, fill: `orange` },
      { t: 'box', x: 590, y: 24, w: 150, h: 70, label: `Enterprise`, sub: `the activity itself`, fill: `blue` },
      { t: 'brace', x: 20, y: 108, w: 530, label: `SIZE: decided by investment and turnover (next lessons)` },
      { t: 'brace', x: 590, y: 108, w: 150, label: `KIND: goods or services` },
      { t: 'note', x: 120, y: 184, w: 520, h: 44, text: `First ask: is it an enterprise? Then ask: which size?`, fill: `yellow`, size: 16 },
    ]),

    `## What makes something an enterprise?
An **enterprise** is an activity that is engaged in **production, manufacturing, processing or the provision of services**. In other words, it deals either with **goods** or with **services**. And behind it there is a person who **takes the risk and owns the result**, working under their own leadership.

That last part is the point of the whole MSME idea. The government wants people to use their own talent and the resources of the economy and, instead of **taking a job**, to **give jobs**. This fits the **Make in India** campaign. Note what is *not* a condition: **age**. A person of 18 and a person of 60 can both start an enterprise.`,

    sk(400, 'Every enterprise either deals with goods (three kinds) or with services', [
      { t: 'circle', x: 455, y: 52, r: 46, label: `Enterprise`, fill: `yellow`, size: 16 },
      { t: 'box', x: 152, y: 130, w: 220, h: 56, label: `Goods`, sub: `you make a thing`, fill: `blue` },
      { t: 'box', x: 540, y: 130, w: 200, h: 56, label: `Services`, sub: `you do a job for someone`, fill: `green` },
      { t: 'arrow', x1: 422, y1: 88, x2: 310, y2: 127 },
      { t: 'arrow', x1: 488, y1: 88, x2: 600, y2: 127 },
      { t: 'box', x: 10, y: 250, w: 160, h: 64, label: `Production`, sub: `grow or generate`, fill: `teal` },
      { t: 'box', x: 182, y: 250, w: 160, h: 64, label: `Manufacturing`, sub: `makes something new`, fill: `orange` },
      { t: 'box', x: 354, y: 250, w: 160, h: 64, label: `Processing`, sub: `improves what exists`, fill: `purple` },
      { t: 'arrow', x1: 230, y1: 188, x2: 90, y2: 247 },
      { t: 'arrow', x1: 262, y1: 188, x2: 262, y2: 247 },
      { t: 'arrow', x1: 294, y1: 188, x2: 434, y2: 247 },
      { t: 'note', x: 540, y: 250, w: 200, h: 64, text: `doctor, lawyer, ITR filer\nsalon, transport, yoga`, fill: `yellow`, size: 14 },
      { t: 'arrow', x1: 640, y1: 188, x2: 640, y2: 247 },
      { t: 'text', x: 90, y: 358, text: `crops, milk,\nsolar power`, size: 14, color: `#4a5568` },
      { t: 'text', x: 262, y: 358, text: `furniture, bread,\npickles, biscuits`, size: 14, color: `#4a5568` },
      { t: 'text', x: 434, y: 358, text: `rice polishing,\nflour milling,\nlaptop assembly`, size: 14, color: `#4a5568` },
    ]),

    `## The three goods activities, one by one
**Production** means you create something that did not exist before. The simplest example is **agriculture**: growing crops and sugarcane. A small farm and a big farm are both production. **Generating electricity** is production too: the old way was water, the newer ways are **solar panels** and **biogas**. Dairy is production: you collect milk.

**Manufacturing** means you take a **raw material**, it passes through a **work-in-process** stage, and it comes out as a **finished good** that is clearly a different thing and can be sold. A carpenter buys wood and makes cupboards, beds and doors. A baker turns wheat flour into bread. A home cook who makes pickles, papads and chutneys to sell is a manufacturer, and so is an **order-based cloud kitchen**.

**Processing** means you work on a material that **already exists** and make it more usable. You are not inventing a new product. A rice mill **polishes** rice. An *atta chakki* **grinds** wheat, and the same goes for ragi flour and spice mixes. **Cleaning and packing** wheat is processing. So is **assembling a laptop** from parts: the parts already exist and you put them together.

| The question to ask | If yes |
|---|---|
| Did I make something that did not exist before, from the land, an animal or a source of energy? | Production |
| Did raw material turn into a new finished product? | Manufacturing |
| Did I improve, clean, grind, pack or assemble something that already existed? | Processing |

The lines between the three are soft. For registration, what matters is the larger point: **all three deal with goods, so all three are the "manufacturing" side of MSME**.`,

    { analogy: `Think of a data platform. **Production** is a source system that creates new data (a sensor, an app writing events). **Manufacturing** is a pipeline that takes raw files through a staging layer (the **WIP**) and builds a new, finished table that people can use. **Processing** is a cleaning step on data that already exists: dedupe, format, repack. A **service enterprise** is an API endpoint: nothing is stored on a shelf, the value is delivered at the moment someone asks.` },

    `## Service enterprises
A **service enterprise** sells your **own talent or time**, not a product you hand over. The customer pays for the work done.

- **Professionals**: a doctor treating patients, a lawyer giving legal advice, an investment advisor, a consultant who files income-tax returns.
- **Personal services**: a barber or a salon, a yoga or Zumba teacher (also online).
- **Logistics**: a transport company moving goods from one place to another.
- **New-age services**: installing **electric-vehicle charging stations**, supplying cooked food through a delivery app from your own home kitchen.

The roadside barber with one chair and one mirror is a real enterprise: he works for himself and takes the risk. As he grows, the same person may run a proper salon serving a larger customer base.

## Small ideas that grew big
The lecture lists famous names to show what a small start can become. Read them with one honest note: **most of these brands are large companies today**. They matter here because they **began small** or because **small units feed them**.

| Name | What the lecture uses it to show |
|---|---|
| **Amul** | Farmers became the owners of a dairy business through a cooperative model |
| **Classmate** notebooks | Big brands depend on many small suppliers of paper and printing |
| **Wow! Momo** and street food | Street-style food stalls that scaled into chains |
| **Biba** | A small home-based clothing business that became a leading ethnic-wear brand |
| **Sugar Cosmetics** | A fast-growing online-first (D2C) brand |
| **Hero Cycles** | A small unit that grew into one of the largest cycle makers |

The lecture also tells smaller stories: a **furniture maker** who started with an exhibition stall and later supplied hotels, a **neighbourhood grocery** that became a supermarket, and a **biogas company** that turned waste into energy and was helped by a fund of the Ministry of MSME. The pattern is always the same: a person with an idea, **funds and support**, and time.`,

    sk(200, 'The growth ladder: this is where a Corporate Mitra fits in', [
      ...flow([
        { label: `Small start`, sub: `home, stall, one room`, fill: `green` },
        { label: `Funds + support`, sub: `registration, loans`, fill: `orange` },
        { label: `Grows`, sub: `more staff, more sales`, fill: `yellow` },
        { label: `Known brand`, sub: `a name people trust`, fill: `blue` },
      ], { y: 30, h: 76, gap: 46 }),
      { t: 'note', x: 190, y: 140, w: 380, h: 44, text: `Stage 2 is the Corporate Mitra's job:\nhelp the unit get registered and funded.`, fill: `yellow`, size: 14 },
    ]),

    `## Worked example: is it an enterprise, and which kind?
Run the questions on a few activities. Ravi runs a biscuit unit. Meena runs a tailoring unit with a stitching machine in a small room.

| Activity | Enterprise? | Kind |
|---|---|---|
| Ravi's biscuit unit (flour, sugar, ghee in; packed biscuits out) | Yes | **Manufacturing** |
| Meena's tailoring unit (cloth in; stitched clothes out) | Yes | **Manufacturing** |
| A farmer growing sugarcane | Yes (the idea), though plain farming is not registered on Udyam | **Production** |
| A rooftop garden selling its vegetables | Yes (the idea), same note | **Production** |
| A rice mill polishing rice for traders | Yes | **Processing** |
| A workshop assembling laptops from bought parts | Yes | **Processing** |
| An ITR-filing consultant | Yes | **Service** |
| A tiny courier company | Yes | **Service** |
| Someone who works for a salary at a company | **No** | An employee does not take the business risk |

Notice the last row. Doing a job is not an enterprise, and it does not matter how skilled the person is.`,

    { warn: `Common mistakes:
- **Mixing up "enterprise" and "company".** A company is a legal form (Week 1). An enterprise is any goods or service activity, including a roadside barber.
- **Thinking only factories count.** A doctor, a transport operator and a yoga teacher are service enterprises.
- **Quoting the famous brands as MSMEs today.** They are examples of a small start. Whether a business is micro, small or medium depends on its numbers, which the next lessons teach.
- **Assuming age or education limits.** The lecture is clear that age is not a condition.
- **Treating "is an enterprise" as "can be registered".** This lesson is about the idea. Registration has extra rules: for example, plain crop-growing is left out of Udyam, and so are hobbies, charity and share-market investing (lesson 6).` },

    { real: `When a new client says "I want to start something", your first job is not a form. It is two questions: **"What exactly will you do, and will it be goods or services?"** and **"Who takes the risk and keeps the profit?"** Write the answer in one line, such as "manufactures pickles, sells through shops". You will need that line again for the Udyam form and for the NIC activity code.` },

    { remember: `- **MSME = Micro + Small + Medium + Enterprise.** The first three are size, the last is the kind of activity.
- An **enterprise** makes **goods** or gives **services**, and the owner **takes the risk**. Age does not matter.
- Goods activities are **production** (grow or generate), **manufacturing** (raw material to a new finished product) and **processing** (improve or assemble something that exists).
- Services sell skill or time: doctor, lawyer, barber, transport, consultant.
- Registration for all of them is on the **Udyam portal**.` },
  ],
  quiz: [
    { q: `What does the last letter, E, in MSME stand for?`, o: [`Enterprise`, `Export`, `Employment`, `Engineering`], a: 0, why: `MSME means Micro, Small and Medium Enterprise. Enterprise is the kind of activity; micro, small and medium describe its size.` },
    { q: `A baker turns wheat flour into bread. Which activity is this?`, o: [`Manufacturing`, `Production`, `Processing`, `Service`], a: 0, why: `Raw material goes through a work-in-process stage and comes out as a new finished product: that is manufacturing.` },
    { q: `A rice mill polishes rice that farmers bring. Which activity is this?`, o: [`Production`, `Manufacturing`, `Service`, `Processing`], a: 3, why: `The rice already exists. The mill improves it and makes it usable in another form, which is processing.` },
    { q: `Which of these is NOT an enterprise?`, o: [`A person working for a monthly salary`, `A roadside barber with one chair`, `A cloud kitchen working on orders`, `A farmer growing sugarcane`], a: 0, why: `An enterprise means taking the business risk yourself. An employee works for someone else's enterprise.` },
    { q: `Which word in MSME is about the kind of activity and not the size?`, o: [`Micro`, `Small`, `Medium`, `Enterprise`], a: 3, why: `Micro, small and medium describe size. Enterprise describes what the unit does: goods or services.` },
    { q: `Where are MSMEs registered by the government?`, o: [`On the Udyam registration portal`, `On the GST portal`, `At the PF office`, `On the Shram Suvidha portal`], a: 0, why: `The Udyam registration portal is the only portal on which MSMEs are registered.` },
  ],
};
