import { sk } from '../_kit.js';

// 100 dots: 99 micro (blue) + 1 small/medium (green)
const dots = Array.from({ length: 100 }, (_, i) => ({
  t: 'circle', x: 46 + (i % 10) * 26, y: 56 + Math.floor(i / 10) * 26, r: 9, solid: true, fill: i === 99 ? 'green' : 'blue',
}));

export default {
  title: `Growth and contribution of MSMEs`,
  goal: `You can quote the size of the MSME sector in India, say who dominates it (micro units, traders, a few big states), explain why Udyam Assist exists, and list what MSMEs give the economy in jobs, exports and output.`,
  covers: [`How many MSMEs exist`, `Udyam vs Udyam Assist`, `Split by sector, size, state, gender`, `Share of GDP, exports, jobs`, `Why MSMEs matter`],
  terms: [
    [`Udyam portal`, `The government website where a business registers as an MSME and gets an Udyam certificate. It needs a PAN (tax ID).`],
    [`Udyam Assist Platform (UAP)`, `A second portal for the tiniest informal units that have no PAN or GST. A bank or other helper registers them using their customer ID.`],
    [`PAN`, `Permanent Account Number: the tax ID card issued by the Income Tax Department. Individuals and businesses both can hold one.`],
    [`Pavement / informal business`, `A tiny unit with no shop address, no registered name and no PAN: a street vendor, a roadside repair stall.`],
    [`NBFC`, `Non-Banking Finance Company. A lender that is not a bank but is regulated, such as a vehicle-loan or gold-loan company.`],
    [`Small finance bank`, `A bank licensed to focus on small borrowers and small businesses.`],
    [`Customer ID`, `The number a bank gives to each of its account holders. UAP uses it in place of a PAN.`],
    [`Real-time data`, `Numbers that update continuously. The Udyam dashboard changes through the day as new units register.`],
    [`Annual report`, `A yearly report published by the Ministry of MSME with the official figures. The trusted source for statistics.`],
    [`B2B and B2C`, `Business-to-business: selling to other businesses (a workshop supplying parts to a factory). Business-to-consumer: selling to ordinary customers (a local shop).`],
    [`Profit-sharing ratio`, `The share of profit each partner gets. A firm counts as women-owned when women partners hold more than 50% of it.`],
    [`Inclusive development`, `Growth that reaches small towns and villages, not just big cities.`],
  ],
  blocks: [
    `## Why learn the numbers?
Before you serve a sector, you should know how big it is and who is in it. These numbers are your first sales pitch: *"There are crores of businesses like yours, and you can help them."*

Every figure below comes from the course, which takes it from the **Ministry of MSME Annual Report 2024-25** (position as on **31 December 2024**) and from the live **Udyam dashboard** (recorded on **10 May 2026**). These numbers change. To get fresh ones, download the latest annual report from the Ministry of MSME website (msme.gov.in) and open the dashboard on udyamregistration.gov.in.

## How many MSMEs are there?
| Date | What was counted | MSMEs |
|---|---|---|
| 31 Dec 2024 | Udyam + Udyam Assist together | about **5.77 crore** |
| 10 May 2026 | Udyam portal alone | about **4.88 crore** |
| 10 May 2026 | Udyam Assist alone | about **3.45 crore** |
| 10 May 2026 | Both together | about **8.33 crore** |

Two things to notice. First, the Udyam dashboard is **real-time**: look at 10 AM and again at 4 PM and the number has gone up. Second, in under 18 months about **2.5 crore** new units were added. That jump came almost entirely from the second portal.`,

    sk(352, 'Two doors into the same register: Udyam (self-serve) and Udyam Assist (helped in by a bank)', [
      { t: 'person', x: 80, y: 28, label: `Owner with PAN,\naddress, GST`, fill: `green` },
      { t: 'person', x: 80, y: 208, label: `Street vendor:\nno PAN, no address`, fill: `orange` },
      { t: 'arrow', x1: 150, y1: 70, x2: 262, y2: 70, label: `registers`, ly: -10 },
      { t: 'box', x: 264, y: 38, w: 200, h: 66, label: `Udyam portal`, sub: `needs PAN, GST details`, fill: `blue` },
      { t: 'box', x: 118, y: 154, w: 122, h: 50, label: `Bank / NBFC /\nsmall finance bank`, fill: `yellow`, size: 13 },
      { t: 'arrow', x1: 110, y1: 232, x2: 150, y2: 208, label: `` },
      { t: 'arrow', x1: 240, y1: 180, x2: 262, y2: 232, bend: 6 },
      { t: 'box', x: 264, y: 222, w: 200, h: 66, label: `Udyam Assist (UAP)`, sub: `uses the bank customer ID`, fill: `purple`, size: 17 },
      { t: 'arrow', x1: 464, y1: 70, x2: 530, y2: 150 },
      { t: 'arrow', x1: 464, y1: 255, x2: 530, y2: 188 },
      { t: 'db', x: 530, y: 124, w: 140, h: 90, label: `One MSME\nregister`, fill: `teal` },
      { t: 'text', x: 600, y: 238, text: `8.33 crore units`, size: 18, bold: true, color: `#c2410c` },
      { t: 'text', x: 600, y: 262, text: `(10 May 2026)`, size: 14, color: `#5c6478` },
      { t: 'text', x: 364, y: 20, text: `4.88 crore`, size: 15, color: `#1971c2` },
      { t: 'text', x: 364, y: 314, text: `3.45 crore, in about 3.5 years`, size: 15, color: `#7048e8` },
      { t: 'text', x: 380, y: 340, text: `Udyam Assist is 3.5 years old. It already has about 75% as many units as Udyam.`, size: 13, color: `#5c6478` },
    ]),

    { analogy: `Udyam is **self-serve sign-up**: you bring your own verified ID (PAN) and create the account yourself. Udyam Assist is **assisted onboarding through a trusted partner**: a bank that has already verified the person (the customer ID) signs them up. Same register at the end, two doors in, because the people at the second door cannot meet the first door's ID requirement.` },

    `## Why does Udyam Assist exist?
Walk through any market. Many people trade on the pavement with **no shop address, no registered name and no PAN**. Udyam registration needs a PAN, so these units could not be counted or helped. The government built **Udyam Assist** so these **tiny units** can join the system and reach the schemes meant for them.

Who helps them? **Banks, NBFCs, small finance banks and payment banks.** The street vendor may have no PAN but usually has a bank account, and so a **customer ID**. A bank staff member registers the vendor on UAP. A vendor cannot sign up on UAP alone: it only works through these assisting institutions.

You, as a Corporate Mitra, will register businesses on the **Udyam** portal: the ones with a PAN, an address and, usually, a GST number.

## Who are the MSMEs? Four ways to slice the numbers
### By sector (31 December 2024)
| Sector | Units | Share |
|---|---|---|
| **Trading** | about 2.58 crore | **45%** |
| **Services** | about 2.01 crore | **35%** |
| **Manufacturing** | about 1.18 crore | **20%** |

Trading is the biggest group even though traders were allowed in only about four and a half years ago, while manufacturing and services have been in the MSME family since 2006.

### By size
Micro enterprises are **98.6%** of all MSMEs. Small ones are just about **1.3%** (roughly 7.3 lakh units) and medium ones are well under 1% (about 69,000 units). So if you pick 100 MSMEs at random, about 99 are micro.`,

    sk(318, 'Pick any 100 MSMEs: about 99 are micro and about 1 is small or medium', [
      ...dots,
      { t: 'text', x: 440, y: 40, text: `Each dot = 1 MSME out of 100`, size: 18, bold: true, anchor: `start` },
      { t: 'circle', x: 452, y: 84, r: 9, solid: true, fill: `blue` }, { t: 'text', x: 474, y: 84, text: `Micro: 98.6%`, size: 17, anchor: `start` },
      { t: 'circle', x: 452, y: 118, r: 9, solid: true, fill: `green` }, { t: 'text', x: 474, y: 118, text: `Small + medium: about 1.4%`, size: 17, anchor: `start` },
      { t: 'text', x: 474, y: 146, text: `small: 1.3% (about 7.3 lakh units)`, size: 14, color: `#4a5568`, anchor: `start` },
      { t: 'text', x: 474, y: 166, text: `medium: under 0.2% (about 69,000)`, size: 14, color: `#4a5568`, anchor: `start` },
      { t: 'note', x: 440, y: 196, w: 290, h: 76, text: `Most of your clients will be micro.\nThey cannot afford a full-time\naccountant: that is your opening.`, fill: `yellow`, size: 15 },
    ]),

    `### By state (31 December 2024)
| Rank | State | Region | MSMEs |
|---|---|---|---|
| 1 | **Maharashtra** | West | about 75 lakh |
| 2 | **Uttar Pradesh** | North | more than 61 lakh |
| 3 | **Tamil Nadu** | South | (between UP and West Bengal) |
| 4 | **West Bengal** | East | about 41.6 lakh |
| 5 | **Karnataka** | South | about 38.2 lakh |

The top four cover all four regions of India: west, north, south and east.

### By gender of the owner
About **70.8%** of MSMEs are owned by men, about **28.8%** by women and about **0.4%** by others. The share of women is rising. For a **partnership firm**, ownership is decided by the **profit-sharing ratio**: if women partners hold **more than 50%** of the profit, the firm counts as women-owned; if men hold more than 50%, it counts as men-owned.

## What MSMEs give the economy
The course quotes these as the most recent annual-report figures (the first three are for 2022-23):

| Contribution | Figure |
|---|---|
| **Share of GDP** | about **30.1%**. The course says it has risen since, so check the latest annual report |
| **Share of manufacturing output** | about **36%** |
| **Share of India's exports** | about **45%** |
| **Jobs** | about **24.4 crore** people. That is roughly **one in every six Indians** |

After agriculture, MSMEs are the **second-largest employer** in India. And inside MSME, **micro enterprises create most of the jobs** (about 22.2 crore of the 24.4 crore). The medium tier, which many people expect to lead, is actually the smallest source of jobs.`,

    sk(250, 'What the sector gives India', [
      { t: 'box', x: 14, y: 14, w: 174, h: 112, label: `30.1%`, sub: `of GDP (2022-23)`, fill: `blue`, size: 30 },
      { t: 'box', x: 200, y: 14, w: 174, h: 112, label: `36%`, sub: `of manufacturing`, fill: `green`, size: 30 },
      { t: 'box', x: 386, y: 14, w: 174, h: 112, label: `45%`, sub: `of exports`, fill: `orange`, size: 30 },
      { t: 'box', x: 572, y: 14, w: 174, h: 112, label: `24.4 cr`, sub: `people employed`, fill: `purple`, size: 30 },
      { t: 'text', x: 380, y: 158, text: `The second-largest employer after agriculture: about 1 in 6 Indians works in an MSME.`, size: 16, bold: true },
      { t: 'note', x: 120, y: 188, w: 520, h: 48, text: `Micro enterprises alone employ about 22.2 crore of the 24.4 crore.`, fill: `yellow`, size: 16 },
    ]),

    `## Why MSMEs matter (the reasons behind the numbers)
- **Jobs at low cost.** It costs less capital to create each new job in a small unit than in a large one. As a firm grows, the cost per extra person rises.
- **Spread of industry.** Large factories cluster in big towns. An MSME needs little land and little capital, so it can open in a small town, a village or a remote area. That is **inclusive industrial development**: growth that reaches everyone.
- **Supply chains.** Rural and small units supply goods **B2B** (to larger businesses) and **B2C** (to customers directly, like a local shop).
- **A culture of entrepreneurship.** Think about *you*. Starting as a Corporate Mitra for MSMEs, you become a small **service** business yourself. Later you may hire a team, or even start a factory. Every helper becomes a job-giver.

## Worked example: read the data like a Corporate Mitra
Sunita runs a small stitching unit in a tier 3 town with six workers. From this lesson, you can tell her:
1. She is almost certainly a **micro** enterprise (98.6% are).
2. If she has **no PAN and no GST**, her bank could register her on **Udyam Assist**. If she has a PAN, you register her on **Udyam**.
3. If she is **women-owned** (profit share above 50% for women partners), she is counted in the 28.8% group, and some state schemes have extra benefits for women.
4. She is one of **about 24 crore** people whose work is part of the MSME story.`,

    { warn: `Do **not** quote these numbers as "today's figure" in front of a client. They carry dates (31 Dec 2024, 2022-23, 10 May 2026). Always say "as per the Ministry of MSME annual report 2024-25" and check the website for the latest.` },

    { real: `Open **msme.gov.in**, find the annual report, and look up the number of MSMEs in **your own state and district**. Use it in your first conversation: "There are X lakh units like yours in our state. I help them with registrations and schemes."` },

    { remember: `- About **5.77 crore** MSMEs on 31 Dec 2024; about **8.33 crore** on 10 May 2026 (Udyam 4.88 crore + Udyam Assist 3.45 crore).
- **Udyam** needs a PAN; **Udyam Assist** is for tiny informal units and works only through banks, NBFCs and other assisting institutions using a **customer ID**.
- By sector: **trading 45%, services 35%, manufacturing 20%**. By size: **micro 98.6%**, small 1.3%, medium under 0.2%.
- Top states: **Maharashtra, Uttar Pradesh, Tamil Nadu, West Bengal, Karnataka**.
- Gender: about **70.8% men, 28.8% women**. A firm counts as women-owned if women hold **over 50%** of profit.
- Contribution: **30.1% of GDP, about 36% of manufacturing, about 45% of exports, 24.4 crore jobs**. Micro units give most of the jobs.
- Always check the **latest annual report** before you quote a figure.` },
  ],
  quiz: [
    { q: `As on 31 December 2024, the total number of MSMEs was more than...`, o: [`5 crore`, `6 crore`, `7 crore`, `8 crore`], a: 0, why: `The annual report puts it at about 5.77 crore, so it is more than 5 crore but less than 6 crore.` },
    { q: `Which segment of MSMEs is the smallest in absolute numbers?`, o: [`Micro`, `Medium`, `Small`, `They are all equal`], a: 1, why: `About 69,000 units are medium, against about 7.3 lakh small and the rest micro.` },
    { q: `Why was the Udyam Assist Platform created?`, o: [`To replace the Udyam portal`, `To register large companies`, `To bring in tiny informal units that have no PAN`, `To collect GST`], a: 2, why: `Pavement-type units had no PAN, and Udyam registration needs one. Banks and other helpers register them on UAP using a customer ID.` },
    { q: `A partnership firm is counted as women-owned when...`, o: [`Any partner is a woman`, `Women partners share more than 50% of the profit`, `The firm has a woman accountant`, `It has a woman-only name`], a: 1, why: `The profit-sharing ratio decides it: more than 50% for women means women-owned.` },
    { q: `Which group creates the largest number of jobs inside MSME?`, o: [`Medium enterprises`, `Small enterprises`, `Micro enterprises`, `Large enterprises`], a: 2, why: `Micro units are 98.6% of all MSMEs, and employ about 22.2 crore of the 24.4 crore people.` },
    { q: `Where do the official MSME figures come from?`, o: [`Any news website`, `The Ministry of MSME annual report and the Udyam dashboard`, `Social media`, `A company's brochure`], a: 1, why: `The Ministry of MSME publishes an annual report, and the Udyam portal shows a real-time dashboard.` },
  ],
};
