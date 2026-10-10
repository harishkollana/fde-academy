import { sk, hub, flow2 } from '../_kit.js';

export default {
  title: `Project selection: choosing the business that can work`,
  goal: `You can explain why an entrepreneur must select a project before spending money, walk through the steps from first idea to implementation plan, run the four feasibility checks, and say why a written project report matters.`,
  covers: [`What project selection is`, `The eight steps`, `Four feasibility checks`, `Cost, capacity, goals, risk`, `Why write a project report`],
  terms: [
    [`Project`, `A planned piece of business activity with a goal, a cost and a time: for example, setting up a namkeen line.`],
    [`Project selection`, `A structured way of listing possible projects, comparing them and choosing the best one.`],
    [`Constraint`, `A difficulty you expect to meet while setting up the project: no skilled staff, no space, no raw material.`],
    [`Feasibility`, `Whether the project can really be done and make sense. It has technical, economic, social and environmental sides.`],
    [`Detailed project report (DPR)`, `The written document that sets out everything about the project: the need, technology, cost, finance, risks. Banks and partners ask for it. Also called the feasibility report.`],
    [`Cost-benefit analysis`, `Comparing what the project will cost with what it will bring in.`],
    [`Appraisal`, `A careful check of a proposed project, usually with numbers, before the money is committed.`],
    [`Time value of money`, `The idea that ₹1 today is worth more than ₹1 a year from now, because today's money can be used or invested.`],
    [`Seed capital`, `The first money the promoter puts into a business.`],
    [`Working capital`, `Money needed day to day: raw material, wages, electricity, until sales money comes in.`],
    [`PERT chart`, `A planning chart that shows which tasks must happen in which order and what depends on what.`],
    [`Risk mitigation`, `Steps taken in advance to reduce the damage if something goes wrong.`],
  ],
  blocks: [
    `## Why this topic exists
So far Week 2 was about registering a business that exists. This lesson is for the client who **has money, time and energy but does not yet have a business**, or has one and wants a second line. Picking the wrong project is the most expensive mistake a small entrepreneur can make. The borrowed part of the money starts costing **interest from day one**, whether the project earns or not. The owner's own money also has a cost: had it not been put in, it could have earned interest elsewhere. And the owner's time and effort are lost too.

The micro, small and medium sector has grown into one of the liveliest parts of the Indian economy over more than fifty years. Whether a unit lasts depends heavily on whether its **project was chosen well**.

**Project selection** is a structured way to answer four questions:
1. What could I set up, given my skills, my area and my money?
2. What machines and technology will it need, and what will they cost?
3. What will I produce, and is there enough **market** to sell it at a fair price and earn an income?
4. Which one of the options is **best**, if I can only start one?

## The eight steps`,

    sk(256, 'From a first idea to an implementation plan', flow2([
      { label: `1. Find ideas`, sub: `what could I make?`, fill: `blue` },
      { label: `2. First look`, sub: `scope, constraints`, fill: `blue` },
      { label: `3. Collect data`, sub: `market, tech, money`, fill: `blue` },
      { label: `4. Compare options`, sub: `A against B`, fill: `yellow` },
      { label: `5. Write report`, sub: `the project report`, fill: `yellow` },
      { label: `6. Run numbers`, sub: `payback, NPV, IRR`, fill: `orange` },
      { label: `7. Get approval`, sub: `partners, board`, fill: `green` },
      { label: `8. Plan the build`, sub: `timeline, owners`, fill: `green` },
    ], { y: 14, h: 72, rowGap: 56, gap: 44, max: 16, label: `then` })),

    `**1. Identify the projects.** Look at the area where you live. What is in demand? What is short in supply? Is there a service gap you can fill? Make a list of possible projects. Say six. A little early research tells you which ones deserve a closer look.

**2. First analysis.** For each idea, state its **objective and scope**, and list the **constraints** you foresee. Then check **feasibility** (the four checks below).

**3. Collect data in detail.** For each project, gather: market data (can I sell it here? at what price?), the technical side, the financial side, the people available. This tells you the **inputs** needed (raw material, machines, skilled workers) and the **cost of setting up**.

**4. Design the project and compare alternatives.** Work out the options. If project A has a bottleneck, which alternative is next best? This is where you **rank** the projects.

**5. Write the detailed project report.** Put it all on paper (see the section below).

**6. Run the numbers.** Apply simple calculations (payback period, accounting rate of return, net present value, internal rate of return). The next lesson teaches them.

**7. Get approval.** A **sole proprietor** approves for himself. A **partnership** needs all partners, a **company** its board of directors, a **society or trust** its executive committee. After approval, arrange the funds.

**8. Plan implementation.** Fix timelines and responsibilities: who does what, by when. List the order of tasks, for example in a **PERT chart**: buy the land or lease the shed, order the machinery, install, hire, trial run. The tasks must **finish at about the same time**. Otherwise you may spend a great deal on one part and sit idle because another part is not ready. (A metro line or a highway has the same problem: the bridges, the roads and the fill must all be ready together.)

(The lecture puts "preparing the project documents" after the choice is made. In practice a short report comes first, to decide, and a full report follows once the project is chosen.)

## Four feasibility checks
A project must pass four tests.`,

    sk(380, 'Is the project feasible? Four lenses', hub(
      { label: `Is it\nfeasible?`, fill: `yellow` },
      [
        { label: `Technical`, sub: `right machine, long life`, fill: `blue` },
        { label: `Economic`, sub: `cost vs benefit, market`, fill: `green` },
        { label: `Environmental`, sub: `pollution, safety kit`, fill: `teal` },
        { label: `Social`, sub: `accepted by the community`, fill: `orange` },
      ],
      { cx: 380, cy: 190, rx: 270, ry: 130, r: 56, bw: 200, bh: 60 },
    )),

    `- **Technical:** Is the machinery the right one for the goods or services? How long will it last? Can it be repaired, and is there someone who can do it?
- **Economic:** What will it cost to set up and run? What output is possible? What are the market chances, and could part of it be exported?
- **Social:** Will the community accept the activity? Some activities are not seen as respectable in some places, and the lecture cautions that this affects whether a unit can run smoothly.
- **Environmental:** Will the unit pollute? You may need extra equipment to reduce the effect. Agencies that guard the environment may ask for details, and you must show that safety measures are in place.

## How to choose between projects
- **Cost-benefit analysis.** For each project, estimate the costs and the benefits. The best project is the one where benefits are highest and costs lowest, or where **benefit divided by cost** is highest.
- **Capacity.** A project with a big benefit that you cannot actually carry out is not the best project for you.
- **Goals.** Does it fit what the enterprise wants to be?
- **Risk.** A high-earning project may carry a high risk. (The lecture's blunt example: you might earn a lot by speculating in shares, but that is not a business plan.) Is the work **seasonal** or **regular**? Do the resources you have match?
- **Resources.** Money, time and people are limited: choose so that none is wasted. The lecture's sum-up: the aim is **return on investment without waste**.

## Why the project report is worth writing
A written **detailed project report** does three jobs.
1. **It convinces you.** Writing the pros and cons often shows that an idea is not as wise as it sounded.
2. **It raises money.** Hardly anyone can fund a project entirely alone. A bank, a financial institution, a partner or a co-investor will want a well-drafted report to rely on. If the investment is large, you may even form a company, put in your own seed capital and bring in shareholders.
3. **It teaches you later.** If the project fails you can look at the report and see what went wrong. If it succeeds, you can compare the results with what you expected.

It should cover the need for the project in that area, the technical, financial, economic, environmental and social viability, the **mode of finance and cost** (land, machinery, equipment, working capital), the risks and how they are reduced, and whether the project suits the entrepreneur and the community.`,

    { analogy: `Project selection is **design review before you write the code**. You list candidate designs (ideas), gather requirements (data), check each against hard constraints (feasibility), estimate cost and risk (appraisal), and get sign-off (approval) before anything is built. The project report is the **design document**. Skip it and you pay for the mistake with rework, which in a business means borrowed money earning nothing.` },

    `## Worked example: Ravi picks a second product line
Ravi's biscuit unit runs well. He has about ₹25 lakh to invest and three ideas. He screens them first, before any detailed calculation.`,

    sk(250, 'A screening table: knock out the weak ideas before you do the arithmetic', [
      { t: 'table', x: 60, y: 44, cols: [`Project`, `Market`, `Skills`, `Money`, `Risk`, `Fit`], colW: [190, 90, 90, 90, 100, 90], rowH: 36, hl: [1], title: `Screening three ideas for Ravi`,
        rows: [
          [`A: gift cookie packs`, `medium`, `ready`, `fits`, `seasonal`, `high`],
          [`B: namkeen line`, `strong`, `hire`, `fits`, `low`, `medium`],
          [`C: bread bakery`, `strong`, `hire`, `over`, `low`, `low`],
        ] },
      { t: 'note', x: 60, y: 200, w: 640, h: 36, text: `C needs more money than he has. A depends on festival season. B survives the screen.`, fill: `yellow`, size: 15 },
    ]),

    `- **A. Gift cookie packs.** Fits his skills and machines, but sales cluster around festivals. Seasonal risk.
- **B. A namkeen line.** Strong all-year demand, needs a skilled cook (he can hire), and fits the budget.
- **C. A bread bakery.** Demand is strong, but the ovens and shop would cost more than he has. Out.

Now Ravi puts B and A through the detailed steps: collect prices of machines, ask two suppliers, estimate the monthly sales, write the report, and run the numbers (next lesson). Only then does he decide. Screening saved him from doing full calculations on C.`,

    { warn: `Easy mistakes:
- **Choosing the project because a friend earned well from it.** The friend's area, skills and money are not yours.
- **Skipping the written report** "because it is a small business". The bank will ask for it.
- **Counting only the machine cost.** Land, installation, working capital and licences are part of the cost.
- **Ignoring the environment and the community.** A polluting or unwelcome unit meets resistance and extra cost.
- **Planning tasks one after another** when they should overlap, so that half-finished parts sit idle.
- **Forgetting the cost of one's own money.** It is not "free" because it is the owner's.` },

    { real: `A client who says "I want to start something" is your best chance to add value. Sit with them, list **three options**, and use the screening table: market, skills, money, risk, fit. Then draft a short project report, even two pages. When the client approaches the bank, the report is already in hand. Keep a template with the headings above so that each new report takes hours, not days.` },

    { remember: `- **Project selection** = structured choice of the best project before money is spent.
- **Eight steps:** identify → first analysis → collect data → design and compare → report → numbers → approval → implementation plan.
- **Four feasibility checks:** technical, economic, social, environmental.
- **Choose by:** cost-benefit, capacity, goals, risk (seasonal or regular), resources.
- **The project report:** convinces you, raises funds, teaches you later.
- **Approval:** proprietor alone; all partners; board; executive committee.
- Plan tasks so that they **finish together**.` },
  ],
  quiz: [
    { q: `What is the first step of project selection?`, o: [`Identify the possible projects`, `Buy the machinery`, `Apply for a loan`, `Appoint the staff`], a: 0, why: `The process starts by listing the possible projects for the area, the entrepreneur's skills and the market.` },
    { q: `Which feasibility check asks whether the community will accept the activity?`, o: [`Technical`, `Economic`, `Environmental`, `Social`], a: 3, why: `The social check looks at whether the activity is acceptable to the community where it will run.` },
    { q: `Who approves a project in a partnership firm with three partners?`, o: [`The oldest partner alone`, `All the partners`, `The board of directors`, `The bank`], a: 1, why: `A partnership needs approval from all partners; a company needs its board; a trust or society its executive committee.` },
    { q: `Why does a detailed project report help in raising money?`, o: [`It is a legal licence`, `It replaces the PAN`, `Banks and partners rely on it to judge the project`, `It reduces GST`], a: 2, why: `Banks, financial institutions and partners need a well-drafted report to decide whether to fund the project.` },
    { q: `Which is the best description of "constraints"?`, o: [`Difficulties expected while setting up the project`, `Government schemes the project may use`, `The profit the project will earn`, `The loan interest`], a: 0, why: `Constraints are the difficulties foreseen during implementation, such as lack of skilled workers or raw material.` },
    { q: `Why should the tasks in an implementation plan be timed to finish about together?`, o: [`To avoid paying GST`, `So that the unit pays less interest`, `Because the law requires it`, `So money is not spent on one part while another part is not ready`], a: 3, why: `If one part is finished and another is late, the money spent on the first part sits idle and the project cannot start.` },
  ],
};
