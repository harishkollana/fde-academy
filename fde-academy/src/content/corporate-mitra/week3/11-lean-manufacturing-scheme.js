import { sk, flow, stack } from '../_kit.js';

export default {
  title: `The Lean Manufacturing Competitiveness Scheme: cutting waste together`,
  goal: `You can explain what lean manufacturing is and the ten lean tools in plain words, describe how a mini cluster of about ten units gets government-funded lean consultancy, and work out how the fee is shared and paid.`,
  covers: [`What lean means`, `The lean toolbox`, `The mini cluster and its structure`, `Who does what`, `Money, milestones and timeline`],
  terms: [
    [`Lean manufacturing`, `A way of working that finds and removes waste (wasted material, time, movement, stock, space, effort) while raising quality.`],
    [`SPV`, `Special Purpose Vehicle: the legal body (a trust, a society or a private company) formed by the ten or so units of a mini cluster to run the scheme together.`],
    [`Mini cluster`, `A group of about ten MSME units that join the scheme together, usually in the same place or trade.`],
    [`NMIU`, `National Monitoring and Implementing Unit. In the pilot the National Productivity Council acts as NMIU.`],
    [`SSC`, `Screening and Steering Committee: the apex body, chaired by the Development Commissioner (MSME), that takes the key decisions.`],
    [`LMC`, `Lean Manufacturing Consultant: the expert (a person or a firm) who trains and guides the units on the shop floor.`],
    [`5S`, `A workplace method with five steps: Sort, Set in order, Shine, Standardise, Sustain.`],
    [`Just in time (JIT)`, `Making or buying only what is needed, when it is needed, so that stock and waiting do not pile up.`],
    [`Kanban`, `A signal card or marker that tells you when to make or order more. Production is pulled by demand.`],
    [`Poka-yoke`, `A mistake-proofing device or step that makes it hard to do the wrong thing.`],
    [`SMED`, `Single-Minute Exchange of Dies: changing a machine from one product to another in minutes, not hours.`],
    [`Value stream mapping`, `Drawing every step from raw material to customer and marking which steps add value and which only add waste.`],
  ],
  blocks: [
    `## The problem: waste that nobody has time to remove
Every factory loses money in quiet ways: material that is spoilt, stock sitting idle, workers walking between distant machines, machines that wait for repairs, space cluttered with things nobody uses. **Large companies** in India learned long ago to attack this with **lean manufacturing**. **Small units stayed away**, for two reasons the lecture gives: they **did not know the benefits**, and **good lean consultants are scarce and expensive**, so most MSMEs cannot afford one. They are also busy with daily work and have **little time for improvement projects**.

The **Lean Manufacturing Competitiveness Scheme (LMCS)** of the Ministry of MSME is the answer. It lets about **ten MSMEs join as a group**, share one consultant, and have the government pay most of the fee. The aim is to **reduce manufacturing cost, raise quality and productivity**, and so **improve competitiveness at home and abroad**. (The scheme is now part of the **MSME Champions** family, which Week 3 lesson 1 described as "MSME Competitive (Lean)". The lecture teaches the scheme as it was set up as a **pilot for 100 mini clusters**, which means about **1,000 units**.)

The lecture adds that MSMEs are about **114 lakh units contributing nearly 40% of production** (an old figure; check the latest). If the sector must grow faster than the whole economy, it must get **cheaper and better**.

## What the lean tools actually are
Lean's core idea is simple: **find waste and remove it**. The lecture lists ten tools. Each has a plain meaning and an everyday parallel for an engineer.`,

    `| Tool | In plain words | Engineering parallel |
|---|---|---|
| **5S** | Sort, set in order, shine, standardise, sustain: a clean, ordered workplace | Repository and workspace hygiene |
| **Visual control** | Charts, signals, floor markings and safety signs so everyone sees at once what is happening | A monitoring dashboard |
| **Standard operating procedures** | Written procedures so quality does not depend on one skilled person | Runbooks and documented deployments |
| **Just in time** | Buy and make only what is demanded, when it is demanded | On-demand (lazy) loading, no idle stock |
| **Kanban** | A **pull** system: a card or signal from the customer end triggers making more | A queue with back-pressure |
| **Cellular layout** | Put machines in a small U-shaped cell so work flows smoothly, rather than one huge line (the lecture: make three lots of 400, not one of 1,200) | Small independent services instead of a monolith |
| **Value stream mapping** | Map every step, mark the **value-adding** and **non-value-adding** ones, remove the second kind | Tracing and profiling to find the slow spots |
| **Poka-yoke** | Mistake-proofing so the wrong thing cannot happen, giving **zero defects** | Input validation and type checks |
| **SMED** | **Quick changeover**: switch the setup for a new product in **under ten minutes**, so small batches are possible and a defect spoils a small lot, not a big one | Fast, repeatable deployments |
| **TPM** | Total Productive Maintenance: operators and maintenance staff keep machines healthy to **prevent breakdowns** | Observability and preventive maintenance |
| **Kaizen blitz** | A short, team-wide drive for immediate improvement, with **every employee involved** | A retrospective with quick fixes |`,

    sk(190, '5S: the base of every lean programme', flow([
      { label: `Sort`, sub: `drop what's unused`, fill: `blue` },
      { label: `Set in order`, sub: `a place for each`, fill: `blue` },
      { label: `Shine`, sub: `clean, inspect`, fill: `green` },
      { label: `Standardise`, sub: `written rules`, fill: `yellow` },
      { label: `Sustain`, sub: `keep the habit`, fill: `orange` },
    ], { y: 44, h: 76, gap: 30, max: 17 })),

    `**5S in detail.** **Sort**: take out what is not needed now; keep what is rarely needed at the back. **Set in order**: put what is needed in a fixed place, ready to use. **Shine**: keep machines, equipment and space clean; a clean place gives a positive culture and shows leaks and faults early. **Standardise**: lay down standard procedures. **Sustain**: monitor continuously so the order does not slip back. As the lecture says, 5S is the base on which every other lean technique stands.

**Pull, not push.** In a **push** system a factory guesses the demand, makes goods, and pushes them to customers, hoping they sell. In a **pull** system the **customer's order** starts the work, and purchase of material follows only what has been ordered. That is what JIT and Kanban mean, and it saves the **space and money locked up in stock**.`,

    sk(300, 'Push builds stock and hopes. Pull makes what is ordered', [
      { t: 'text', x: 20, y: 22, text: `PUSH: guess, make, stock, hope`, size: 16, bold: true, anchor: `start`, color: `#c2410c` },
      ...flow([
        { label: `Guess the\ndemand`, fill: `red` },
        { label: `Make a\nbig lot`, fill: `red` },
        { label: `Pile up\nstock`, fill: `red` },
        { label: `Push to\ncustomers`, fill: `red` },
      ], { y: 38, h: 64, gap: 44, max: 16 }),
      { t: 'text', x: 20, y: 160, text: `PULL: order first, then make`, size: 16, bold: true, anchor: `start`, color: `#2f9e44` },
      ...flow([
        { label: `Customer\norders`, fill: `green` },
        { label: `Signal (kanban)\nto make`, fill: `green` },
        { label: `Make and buy\nonly that`, fill: `green` },
        { label: `Deliver\non time`, fill: `green` },
      ], { y: 176, h: 64, gap: 44, max: 15 }),
      { t: 'note', x: 100, y: 258, w: 560, h: 30, text: `Pull cuts stock, space and waste. Push spoils a big lot if there is a defect.`, fill: `yellow`, size: 14 },
    ]),

    `## How the scheme is organised
**Who can apply.** An **industry association**, or a **group of about 10 MSME units** (the lecture says 10, with 10 plus or minus 2 permitted, and the Screening and Steering Committee may approve more or fewer) that qualify as MSMEs. They form a **mini cluster** under an **SPV** (a **trust, a society or a private company**), sign a **memorandum of understanding** among themselves, and apply in the prescribed format to the **NMIU** (the National Productivity Council, in New Delhi). The units commit to work in the scheme for **at least two years**, appoint a **nodal officer** (with a power of attorney to act for the cluster) and report regularly.

**Three tiers.** The lecture calls the structure three-tier.`,

    sk(318, 'Three tiers: units, the monitoring unit, the apex committee', stack([
      { label: `Screening and Steering Committee (SSC)`, sub: `apex: chaired by the Development Commissioner MSME; decides policy and approvals`, fill: `yellow` },
      { label: `NMIU (National Productivity Council)`, sub: `with a Technical Advisory Committee; the single point of contact; monitors and recommends`, fill: `blue` },
      { label: `SPV with Lean Consultant`, sub: `the legal body of the ten units; one consultant guides the cluster`, fill: `green` },
      { label: `Mini cluster of about 10 MSMEs`, sub: `the units that actually change how they work`, fill: `orange` },
    ], { x: 60, y: 14, w: 640, h: 58, gap: 20, max: 18 })),

    `- The **units** report to the **SPV**. The SPV and the consultants report to the **NMIU**. The NMIU reports to the **SSC**, which is the highest authority.
- The **Technical Advisory Committee** sits inside the NMIU. It has three or four productivity consultants and a representative of the Development Commissioner. It receives applications, recommends to the SSC, **checks milestones, visits units**, runs orientation programmes and keeps a reference library.
- The **SSC** is chaired by the **Development Commissioner (MSME)**, with representatives of government, industry, professional bodies and the Ministry's finance wing. It sets policy, takes key decisions and monitors the scheme.

**The consultant (LMC).** A person or firm registered or certified in manufacturing technology, quality control or a related field, with a **track record in lean**, **empanelled by the NMIU** and approved by the SSC. The LMC signs a **tripartite agreement** with the **NMIU and the SPV**. The LMC **assesses each unit's current practices**, writes procedures, schedules and milestones, **sets measurable targets** for each unit, works closely with every unit and answers questions from the SPV and NMIU. To give real attention, an individual consultant should handle only **two or three SPVs** near one another (the committee may relax this where consultants are scarce). The NMIU pays for the consultants' **orientation and refresher workshops**, but the consultants bear their own **travel and stay**.

## Money, milestones and timeline
**The split.** For the **first year** the government pays **80% of the consultancy cost**, and the **cluster pays 20%**. From the **second year** the units are expected to continue lean at their **own expense**, now that they have seen the benefit.

**How it is paid.** The fee is paid in **five milestone-based tranches of 20% each**. As the lecture describes it, the SPV pays each tranche to the consultant first, and the **government reimburses it through the NMIU after the NMIU checks that the milestone was reached and the consultant performed well**. The first 20% is the cluster's own share, so the four reimbursed tranches add up to the government's 80%. If an advance is wanted, a **bank guarantee** is needed. Funds move from the **Government of India to the NMIU (in a separate account) to the SPV (in a separate account) to the consultant**. Utilisation certificates go to the Development Commissioner, and the NMIU sends **monthly progress reports** to the SSC. (Check the current MSME Champions guidelines for the present rates.)`,

    sk(196, 'The money moves down, and only after a milestone is verified', [
      ...flow([
        { label: `Government`, sub: `80% over 4 tranches`, fill: `yellow` },
        { label: `NMIU`, sub: `separate account`, fill: `blue` },
        { label: `SPV`, sub: `separate account`, fill: `green` },
        { label: `Lean consultant`, sub: `paid per milestone`, fill: `orange` },
      ], { y: 24, h: 82, gap: 44, max: 18 }),
      { t: 'note', x: 110, y: 138, w: 540, h: 44, text: `Each tranche is released only after the NMIU checks that the milestone\nwas reached and the consultant performed well.`, fill: `yellow`, size: 14 },
    ]),

    `**Approval steps.** (1) The SSC gives **in-principle approval**. (2) The SPV meets the **conditions** and reports this. (3) The NMIU does **due diligence**. (4) The NMIU issues a **sanction memo**. (5) The SPV, the consultant and the NMIU sign the **tripartite agreement**.

**Timeline.** After approval, the lean techniques are to be **fully implemented within one year**, and the units must **keep practising for one more year**, sending periodic progress reports. The scheme is **evaluated at the end of the first year**, and if it works, it is **extended to more clusters and units**.

## Worked example: a cluster of ten namkeen and biscuit units
Ten small food units in one town form an SPV. They hire a lean consultant. **For illustration only**, assume the consultancy fee for the year is **₹10 lakh** (the real fee is agreed with the NMIU and varies).

| Item | Amount |
|---|---|
| Fee | ₹10 lakh |
| **Cluster's own share (20%)** | **₹2 lakh**, which is **₹20,000 per unit** |
| **Government's share (80%)** | **₹8 lakh**, reimbursed in four tranches of ₹2 lakh |

**What the consultant does inside Ravi's biscuit unit** (illustration):

| Waste found | Lean tool | Fix |
|---|---|---|
| Unused moulds and trays everywhere; workers hunt for tools | **5S** | Sort, give every item a place, mark it on the floor |
| Flour and sugar bought a month ahead, going stale | **JIT, Kanban** | Order against the week's confirmed orders |
| Switching from one biscuit shape to another takes 40 minutes | **SMED** | Prepare the next die while the machine still runs; changeover under 10 minutes |
| Mixer breaks down in the middle of an order | **TPM** | Operators clean and check it daily; maintenance is planned |
| Wrong packing label on a batch | **Poka-yoke** | A colour-coded label tray that only allows the right label |
| Dough waits, trays wait, packers wait | **Value stream mapping** | Draw the flow; remove the waiting steps |`,

    { analogy: `Lean is **DevOps for a factory**. 5S is clean-repo discipline. Kanban is a **work-in-progress limit with pull-based scheduling**. Poka-yoke is **type-checking at the point of entry**. SMED is **fast, safe deployment**. TPM is **observability and preventive maintenance**. Value stream mapping is **tracing a request through every hop to find the latency that adds no value**. And the **SPV with a shared consultant** is a **shared platform team**: ten small teams that could not afford one SRE hire one together.` },

    { warn: `Easy mistakes:
- **Treating lean as a one-time clean-up.** The scheme expects the units to continue on their own after the first year.
- **Expecting the government to pay the whole fee.** The cluster pays 20%.
- **Joining the scheme without commitment.** A cluster must stay for at least two years and report regularly.
- **Forming an SPV without a written understanding.** The memorandum of understanding and the power of attorney for the nodal officer are required.
- **Choosing a consultant outside the empanelled list.** The NMIU approves the consultants.
- **Using old figures.** Rates, the number of units per cluster and the tranche structure change; check the current scheme.
- **Mistaking 5S for cleaning.** It is a way of organising the work, with standard rules that are kept.` },

    { real: `Lean suits clients who make goods in the same town or trade: bakers, powerloom units, metal workshops. A Corporate Mitra can **bring the ten units together**, explain the 20% share in rupees, help form the SPV (trust, society or company), prepare the memorandum of understanding and file with the NMIU. Afterwards, check that each unit keeps the 5S routine alive.` },

    { remember: `- **LMCS:** government-supported lean consultancy for a **mini cluster of about 10 MSMEs**, through an **SPV**. Goal: cut waste and cost, raise quality and competitiveness. Pilot: **100 clusters, 1,000 units**.
- **Tools:** 5S, visual control, SOPs, **JIT**, **Kanban** (pull), cellular layout, **value stream mapping**, **poka-yoke**, **SMED** (changeover under 10 minutes), **TPM**, **Kaizen blitz**.
- **Structure:** units → SPV with consultant → **NMIU** (National Productivity Council, with the TAC) → **SSC** (chaired by the Development Commissioner).
- **Money:** govt **80%**, cluster **20%**, first year; paid in **five milestone tranches of 20%**; funds flow Government → NMIU → SPV → consultant.
- **Timeline:** implement in **1 year**, continue **1 more year**; commit for **at least 2 years**; evaluate after year one.
- Check the current **MSME Champions (Lean)** guidelines.` },
  ],
  quiz: [
    { q: `Why did MSMEs mostly stay away from lean manufacturing before this scheme?`, o: [`It was banned`, `They were unaware of the benefits and could not afford consultants`, `It needs a factory licence`, `It only works for large plants`], a: 1, why: `The lecture says MSMEs were not fully aware of the benefits and that good lean consultants are scarce and costly.` },
    { q: `How many MSME units normally form a mini cluster under the scheme?`, o: [`About 2`, `About 5`, `About 10`, `About 100`], a: 2, why: `A mini cluster is about ten units (ten plus or minus two is acceptable), formed into an SPV.` },
    { q: `Which lean tool is a pull-based system in which a signal from the customer end triggers production?`, o: [`Kanban`, `SMED`, `5S`, `TPM`], a: 0, why: `Kanban is a pull system: production and ordering follow actual demand, instead of pushing stock based on guesses.` },
    { q: `What does SMED aim for?`, o: [`Mistake-proofing`, `Machine maintenance by operators`, `A quick changeover of setup, under ten minutes`, `A clean workplace`], a: 2, why: `SMED (Single-Minute Exchange of Dies) cuts changeover time so small batches are possible and a defect affects only a small lot.` },
    { q: `In the scheme, how is the consultancy cost shared in the first year?`, o: [`50% government, 50% cluster`, `20% government, 80% cluster`, `100% government`, `80% government, 20% cluster`], a: 3, why: `The government meets up to 80% of the cost and the cluster 20% in the first year; from the second year the units continue at their own expense.` },
    { q: `Which body, chaired by the Development Commissioner (MSME), is the apex decision-making body of the scheme?`, o: [`The SPV`, `The NMIU`, `The Screening and Steering Committee`, `The Lean Manufacturing Consultant`], a: 2, why: `The SSC is the apex committee for policy, key decisions and monitoring, chaired by the Development Commissioner.` },
  ],
};
