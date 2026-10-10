import { sk, flow2, stack } from '../_kit.js';

export default {
  title: `Unit development: place, markets, technology and choosing machinery`,
  goal: `You can describe the path from idea to a running unit, explain why clusters, common facility centres and market links help a small unit, name the technologies that modernise an MSME, and choose between two machines using payback, NPV and IRR, with a sensitivity check.`,
  covers: [`The path of unit development`, `Place, clusters and market links`, `Technology that pays`, `Government support for technology`, `Choosing machinery with numbers`],
  terms: [
    [`Conceptualisation`, `Turning a loose idea into a clear picture of what you will make or do, for whom, and how you will sell it. The lecture advises writing it down in a few pages.`],
    [`Niche`, `A narrow area where you can do better than others, for example a special spice mix or a part for one machine.`],
    [`Weighted cost of capital`, `The average cost of all the money in the project, each source weighted by how much of it is used.`],
    [`Sensitivity analysis`, `Asking "what if sales or costs turn out worse?" and re-running the numbers.`],
    [`Cluster`, `A group of small units in the same trade and place that gain by being near one another.`],
    [`Common Facility Centre (CFC)`, `A shared workshop, test lab or treatment plant that many small units use, paid for partly by a government grant (MSE-CDP) and partly by the units.`],
    [`Vendor development`, `A programme that links small suppliers to large buyers such as public sector enterprises.`],
    [`GeM`, `Government e-Marketplace: the government's online shop for buying goods and services.`],
    [`Export Promotion Council`, `A trade body that helps exporters of one sector (engineering, electrical goods, carpets, services).`],
    [`ERP`, `Enterprise Resource Planning: one software that holds accounts, stock and orders for all stores, godowns and factories.`],
    [`CRM`, `Customer Relationship Management: software that tracks customers, orders and follow-ups.`],
    [`IoT`, `Internet of Things: machines and sensors that send data over the internet.`],
  ],
  blocks: [
    `## From idea to a running unit
Unit development means **building up the unit's capacity, upgrading its technology and widening its market**. The Ministry of MSME helps through credit schemes, cluster programmes, vendor programmes and subsidies. But the order in which you do things matters.`,

    sk(262, 'The path of unit development', flow2([
      { label: `1. Conceive`, sub: `what, for whom, how`, fill: `blue` },
      { label: `2. Plan`, sub: `report: cost, capital`, fill: `blue` },
      { label: `3. Money`, sub: `own, loans, subsidy`, fill: `yellow` },
      { label: `4. Place`, sub: `roads, cluster, ports`, fill: `yellow` },
      { label: `5. Technology`, sub: `machines, software`, fill: `orange` },
      { label: `6. Markets`, sub: `tenders, GeM, export`, fill: `green` },
    ], { y: 14, h: 72, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `**1. Conceive the idea.** Decide what unique thing you will make or do, which local problem it solves, and whether there is enough **demand**. Write down a few pages: the goods or services, how you will market them (through **e-portals**?), whether the market is **local or export**, and where the **raw material** will come from. Find your **niche**: choose a product or service that matches **local demand and your own skills**, and do a **small market survey** first, so you do not spend money on a product nobody wants.

**2. Plan.** Turn the idea into a **feasibility report**: production process, raw material, machinery and its life, the **capital cost**, and the **working capital** (stock, what customers owe you, what you owe suppliers). The report states the **return** you expect.

**3. Secure money and subsidies.** The most important source is **your own pocket**. Next come **loans** (government schemes, banks, financial institutions, private portals) and **subsidies** from the Ministry of MSME. Cheap money is sometimes hard to get and easy money can be dear, so work out the **weighted cost of capital** of the whole mix. If the project's expected return is **above that cost**, it is profitable. Then add a **risk and sensitivity check** before you start.

**4. Choose the place.** An MSME cannot create roads or ports, but it can **choose a location that has them**: good road links, and for exporters, a place near a **port or an airport**.

**5. Technology and machinery** (below). **6. Markets** (below).

### Weighted cost of capital, in numbers
Suppose Ravi's ₹10 lakh project is funded as in lesson 2: ₹2 lakh of his own money, a ₹5 lakh term loan and a ₹3 lakh cash credit. Take these **assumed** yearly costs (not real quotes): own money 8% (what it could earn elsewhere), term loan 10%, cash credit 11%.

> Weighted cost = (2 × 8% + 5 × 10% + 3 × 11%) ÷ 10 = (16 + 50 + 33) ÷ 100 = **9.9%**

So the project must earn **more than about 9.9%** a year to be worth doing. That is the hurdle for the next sections.

## Place and market links
**Join a cluster.** In a **cluster** you get supplies from nearby, and, if you wish to be a **vendor**, you can sit next to a large factory (an automobile plant, for example) and supply parts or sub-assemblies. Working alone is harder than working together.

**Share a Common Facility Centre.** Some processes (testing, a special treatment, tooling) are needed by many units but too costly for one. Under the **MSE Cluster Development Programme (MSE-CDP)** the government gives funds to create **common facility centres** and special infrastructure, and the units that use them put in their share.`,

    sk(262, 'A common facility centre: units share what none could afford alone', [
      ...[`Unit A`, `Unit B`, `Unit C`, `Unit D`].map((n, i) => ({ t: 'box', x: 20, y: 14 + i * 58, w: 190, h: 46, label: n, fill: `blue` })),
      ...[0, 1, 2, 3].map((i) => ({ t: 'arrow', x1: 214, y1: 37 + i * 58, x2: 430, y2: 110 })),
      { t: 'box', x: 434, y: 56, w: 306, h: 110, label: `Common Facility Centre`, sub: `testing, tooling, treatment`, fill: `green`, size: 18 },
      { t: 'note', x: 434, y: 186, w: 306, h: 50, text: `Built with a government grant (MSE-CDP)\nplus the units' own contributions`, fill: `yellow`, size: 14 },
    ]),

    `**Link to buyers.**
- **Public procurement and vendor development.** Supply to central public sector enterprises and take part in **government tenders**. If many defence or public-sector units are near you, a **niche product** for them gives a steady market.
- **GeM and e-commerce.** Register on the **Government e-Marketplace** to sell directly to government buyers, and on e-commerce portals. Some of them open **export** doors too.
- **Export Promotion Councils.** Join the one for your sector (engineering, services, electrical goods, carpets and others) and use the **Market Development Assistance scheme** to take part in **international trade fairs**.

## Technology: from traditional to digital
The lecture stresses that technology is **no longer a support tool, it is the backbone of operations**. It lets a unit **produce at lower cost**, **keep quality uniform**, and **compete globally** across the whole chain, from manufacturing to HR, finance and design. A link exists between technology adoption and **revenue growth**. Each technology solves one problem.`,

    sk(420, 'What each technology does for a small unit', stack([
      { label: `Machines + IoT sensors`, sub: `track output, stock, energy; less waste, steadier quality`, fill: `orange` },
      { label: `ERP`, sub: `one live view of accounts, stores, godowns, factories`, fill: `blue` },
      { label: `CRM`, sub: `know your customers, orders and follow-ups`, fill: `blue` },
      { label: `Cloud computing`, sub: `data from any device, many users, no own server`, fill: `green` },
      { label: `AI and analytics`, sub: `risk management, supply-chain tracking, forecasting`, fill: `purple` },
      { label: `Digital payments`, sub: `cut costs, reach new customers, grow sales`, fill: `yellow` },
    ], { x: 90, y: 12, w: 580, h: 50, gap: 22, max: 18 })),

    `- **Energy-efficient machinery** lowers running cost and meets what **foreign buyers** may ask for: some insist on a record of **carbon footprint** and credits.
- **Risk management** means listing what could go wrong (an **export order or a tender does not come**) and preparing the remedy in advance.
- **Supply-chain tracking** matters when inputs come from far away: the lecture's example is the disruption of imports of crude oil by geopolitical events.

**Government support for technology.** The **MSME Champions** scheme (clean manufacturing: ZED, Lean, innovation, IPR, digital empowerment) and the **Technology Centre Systems Programme**: technology centres across India with facilities such as **artificial intelligence, robotics and IoT**, offering **skill training, advice and local solutions**. **Tool rooms and technology centres** run by the Ministry give access to **modern tooling and advanced manufacturing**, and train workers. Always check which are open on the Ministry's site.

## Choosing machinery with numbers
Never buy a machine on a salesman's word. **Appraise** it with the tools of Week 2: **payback**, **accounting rate of return**, **NPV** and **IRR**. Prefer the machine with the **shorter payback** and the **higher return**, and where money arrives over many years, trust **NPV and IRR**.

**Example.** Ravi can buy one of two packing machines (all in ₹ lakh). The yearly extra cash is for 4 years, and his cost of money is 10%.

| | Machine A | Machine B |
|---|---|---|
| Cost | 6 | 4 |
| Extra cash each year | 2.5 | 1.5 |
| Payback | **2.4 years** | 2.7 years |
| NPV at 10% | **+1.93** | +0.76 |
| IRR | **24.1%** | 18.5% |

Machine A is better on all three tests. Now the **sensitivity check**: what if the extra cash is **20% lower** than planned (A: 2.0 a year, B: 1.2 a year)?

| | Machine A | Machine B |
|---|---|---|
| NPV at 10% | **+0.34** | **-0.20** |
| IRR | 12.6% | 7.7% |

Machine A still pays its way. Machine B would **lose value**: its IRR (7.7%) falls below the cost of money. The more expensive machine is the safer choice. Without the sensitivity check, Ravi might have bought B because it was cheaper.`,

    { analogy: `A unit is a **platform**. The cluster is a **shared data centre**: each tenant gets far more than it could build alone, and the common facility centre is a **shared GPU pool** funded jointly. Choosing technology is **choosing the stack**: ERP is the system of record, CRM the customer database, the cloud the hosting, AI the analytics layer, IoT the telemetry. And a **sensitivity analysis** is a **load test**: it asks whether the design still works at 80% of the traffic you hoped for.` },

    { warn: `Easy mistakes:
- **Buying the machine first and finding the market later.** Survey the demand first.
- **Choosing the cheapest machine** without looking at what it earns.
- **Skipping the sensitivity check.** A plan that works only if everything goes right is not a plan.
- **Ignoring the location.** A far-away unit pays more for transport and may not be able to export.
- **Working in isolation** when a cluster or a common facility centre is nearby.
- **Buying technology nobody can run.** Include training and a repair plan.
- **Taking the weighted cost of capital as the loan rate only.** Own money has a cost too.` },

    { real: `For a client planning a unit, make a **one-page development plan**: the idea in two lines, the niche and who will buy, the place and why, the money plan with the weighted cost, the machine chosen with its payback, NPV and sensitivity result, and the three buyers or portals to approach first. If the client brings it to the bank as it is, the bank manager sees a prepared entrepreneur.` },

    { remember: `- **Path:** conceive → plan → money → place → technology → markets.
- **Niche + small market survey** before spending. Write the idea down.
- **Weighted cost of capital:** average cost of own money and all loans; the project's return must be above it.
- **Cluster** (nearby supply, vendor links), **Common Facility Centre** (shared, with MSE-CDP grant), **GeM, tenders, vendor development, Export Promotion Councils** (MDA scheme for trade fairs).
- **Technology:** IoT, ERP, CRM, cloud, AI and analytics, digital payments, energy efficiency.
- **Support:** MSME Champions, Technology Centre Systems Programme, tool rooms.
- **Choose machines by payback, NPV and IRR, then stress-test with sensitivity analysis.**` },
  ],
  quiz: [
    { q: `What should a client do before spending money on machinery for a new product?`, o: [`Order the machine and look for buyers later`, `Apply for export incentives`, `Register an ISO certificate`, `Do a small market survey and write a feasibility report`], a: 3, why: `The lecture advises identifying a niche, testing demand with a small market survey and preparing a feasibility report before spending.` },
    { q: `Ravi funds ₹10 lakh with ₹2 lakh own money at 8%, ₹5 lakh at 10% and ₹3 lakh at 11%. What is the weighted cost of capital?`, o: [`8%`, `9.9%`, `10%`, `11%`], a: 1, why: `(2 × 8 + 5 × 10 + 3 × 11) ÷ 10 = 9.9%.` },
    { q: `What is a Common Facility Centre?`, o: [`A government office that registers MSMEs`, `A bank branch for small loans`, `A shared workshop or test facility used by many small units`, `A tax counter`], a: 2, why: `A CFC is a shared facility (testing, tooling, treatment) built with a government grant and the units' own contributions.` },
    { q: `Machine A costs ₹6 lakh and earns ₹2.5 lakh a year. After a 20% fall in earnings its NPV at 10% is still positive. What does that show?`, o: [`The machine is overpriced`, `The decision is robust to a worse case`, `The machine will never wear out`, `Taxes are lower`], a: 1, why: `A positive NPV even when earnings are 20% lower means the decision does not rely on everything going perfectly.` },
    { q: `Which technology gives one live view of accounts, stock and orders across godowns and factories?`, o: [`ERP`, `CRM`, `IoT`, `Digital payments`], a: 0, why: `ERP (Enterprise Resource Planning) puts accounts, stores and orders from all units in one system.` },
    { q: `Which body lets a small exporter use a Market Development Assistance scheme to join international trade fairs?`, o: [`The GST council`, `The State Pollution Control Board`, `The Registrar of Firms`, `An Export Promotion Council`], a: 3, why: `The Export Promotion Councils help exporters of a sector, and the MDA scheme supports taking part in international trade fairs.` },
  ],
};
