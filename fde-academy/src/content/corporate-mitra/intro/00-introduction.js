import { sk, flow, hub, bar, steps } from '../_kit.js';

export default {
  title: 'Introduction: what is a Corporate Mitra?',
  goal: 'You can explain in one minute what a Corporate Mitra is, why small businesses need one, how the 12-month course is built, and what you will be able to do at the end.',
  covers: ['Why small businesses need help', 'Course structure: 6 + 6 months', 'The 6 subjects', 'What a Corporate Mitra can do', 'Who can apply'],
  terms: [
    ['Corporate Mitra', '"Mitra" means friend. A trained, certified helper who guides small businesses through registrations, taxes, books, loans and schemes.'],
    ['MSME', 'Micro, Small and Medium Enterprise: the small and mid-sized businesses of India (a tea stall with one machine, a 40-person factory). Lesson 1 of Week 1 goes deep.'],
    ['Entrepreneur', 'The person who starts and runs the business. Here, your client.'],
    ['Compliance', 'Following the rules: registering, filing returns on time, keeping records. Like passing the checks a build must pass before it ships.'],
    ['Paraprofessional', 'A trained helper who works under or beside fully qualified professionals (CA, CS, lawyer) and handles the routine work. Think paramedic next to a doctor.'],
    ['OJT', 'On-the-Job Training: six months of learning inside a real professional firm, with real clients.'],
    ['PAN / TAN', 'PAN is the tax ID number of a person or business. TAN is the ID a business needs to deduct and deposit tax on payments it makes.'],
    ['GST', 'Goods and Services Tax: the tax added to almost every sale in India. Every GST-registered business files regular returns.'],
    ['Udyam', 'The government registration that officially makes a small business an "MSME" and unlocks its benefits.'],
    ['GeM', 'Government e-Marketplace: the online shop where government offices buy things. A big customer for small businesses.'],
    ['TReDS', 'An online platform where a business can sell its unpaid invoices to a financier and get cash today instead of waiting 60 days.'],
    ['Tier 2 / Tier 3 city', 'Mid-size and small towns outside the big metros. Where most small businesses have no easy access to professional advisers.'],
  ],
  blocks: [
    `## The problem in one story
Ravi bakes the best biscuits in his town. He knows the recipe, the oven, and the customers who queue up every morning. So he decides to grow: rent a unit, hire six people, sell to shops in nearby towns.

The day he decides, a different set of questions arrives, and none of them is about baking.

Ravi is an expert in **making** and **selling**. He is not an expert in **rules, taxes, accounts and loans**. A big company would have a finance team and a lawyer for this. Ravi has himself and a notebook.

This is the gap the Corporate Mitra course is built to fill.`,

    sk(350, 'One entrepreneur, many questions. The Corporate Mitra stands next to him with the answers.', [
      { t: 'person', x: 380, y: 82, label: 'Ravi (baker)' },
      { t: 'note', x: 14, y: 14, w: 214, h: 52, text: 'Which form of business?\nProprietorship, LLP, company?', fill: 'yellow' },
      { t: 'note', x: 14, y: 92, w: 214, h: 52, text: 'PAN, TAN, GST, Udyam:\nwhich ones do I need?', fill: 'yellow' },
      { t: 'note', x: 14, y: 170, w: 214, h: 52, text: 'How do I keep the\nbooks of accounts?', fill: 'yellow' },
      { t: 'note', x: 532, y: 14, w: 214, h: 52, text: 'How do I get a\nbusiness loan?', fill: 'yellow' },
      { t: 'note', x: 532, y: 92, w: 214, h: 52, text: 'Which government\nschemes can help me?', fill: 'yellow' },
      { t: 'note', x: 532, y: 170, w: 214, h: 52, text: 'My customer is not\npaying. What now?', fill: 'yellow' },
      { t: 'arrow', x1: 230, y1: 40, x2: 352, y2: 76, dashed: true },
      { t: 'arrow', x1: 230, y1: 118, x2: 345, y2: 108, dashed: true },
      { t: 'arrow', x1: 230, y1: 196, x2: 352, y2: 130, dashed: true },
      { t: 'arrow', x1: 530, y1: 40, x2: 408, y2: 76, dashed: true },
      { t: 'arrow', x1: 530, y1: 118, x2: 415, y2: 108, dashed: true },
      { t: 'arrow', x1: 530, y1: 196, x2: 408, y2: 130, dashed: true },
      { t: 'box', x: 210, y: 262, w: 340, h: 62, label: 'Corporate Mitra', sub: 'trained helper who knows the answers', fill: 'green' },
      { t: 'arrow', x1: 380, y1: 260, x2: 380, y2: 192, label: 'guides', lx: 40 },
    ]),

    `## What is a Corporate Mitra?
A **Corporate Mitra** is a **trained and certified paraprofessional** who helps micro, small and medium businesses (MSMEs) with the routine business and compliance work: registrations, taxes, accounts, banking, schemes and records.

Three points to hold on to:
- It is **not** a replacement for a Chartered Accountant, Company Secretary or lawyer. It is the trained person who handles the everyday work and knows **when to call the specialist**.
- It is aimed especially at businesses in **tier 2 and tier 3 cities**, where hiring a separate accountant, tax expert and secretary is too costly.
- The idea is simple: let the entrepreneur spend his time on **products, customers and growth**, while a trained person takes care of the paperwork.

## Why does this course exist? Four objectives
| Objective | In plain words |
|---|---|
| **Create trained helpers** | A pool of young people who understand accounting, GST, tax, costing, finance, company-secretary work and compliance. |
| **Make doing business easier** | An entrepreneur should know which registrations, returns and records he needs, and by what dates. Someone guides him through it step by step. |
| **Create jobs** | Bridge the gap between what colleges teach and what a business needs on day one: classroom learning first, practical training after. |
| **Build trust** | Training is standard, followed by exams and a certificate, so a business owner can trust the person who walks in. |

> The larger vision: stronger MSMEs create jobs and growth, which the course links to the national goal of *Viksit Bharat* (a developed India).`,

    { analogy: 'Think of a small business as a **running service in production**. The owner is the product engineer: great at building features. But the service also needs monitoring, access rules, billing, audits and on-call. A Corporate Mitra is the **platform / DevOps person** for the business: handles the plumbing and the checklists so the owner can ship, and knows when to escalate to a specialist (a CA, a lawyer).' },

    `## Who can apply?
| Condition | Rule (as taught in the course) |
|---|---|
| **Nationality** | Indian national |
| **Age** | Up to **30 years** on the date the application is submitted |
| **Education** | A **graduate** from a recognised university. **Final-year** graduation students can also take part, subject to the certification conditions |

You do **not** need a commerce degree. This course starts from zero, and so do these notes.

## How the 12 months are built
The whole programme takes **12 months in two phases**.

- **Phase 1: Academic course (6 months).** About **150 hours** in total: **144 hours** of online, self-paced learning plus **6 hours** of webinar or physical sessions. Available in **English and Hindi**.
- **Phase 2: On-the-Job Training, OJT (6 months).** You work inside a recognised professional firm and see real businesses, real books and real filings.

Why both? Because there is a big gap between *knowing what GST is* and *actually helping a business file its GST return*. The first comes from lessons, the second only from practice.`,

    sk(318, 'Two phases, one certificate. Your final marks come from three parts.', [
      ...flow([
        { label: 'Phase 1: Academic', sub: '6 months · about 150 hours', fill: 'blue' },
        { label: 'Phase 2: OJT', sub: '6 months in a firm', fill: 'orange' },
        { label: 'Certificate', sub: 'Corporate Mitra', fill: 'green' },
      ], { y: 18, h: 80, x: 14, w: 732, gap: 56 }),
      { t: 'text', x: 150, y: 124, text: '144 h online + 6 h webinar', size: 15, color: '#3d4864' },
      { t: 'text', x: 400, y: 124, text: 'real clients, real books', size: 15, color: '#3d4864' },
      { t: 'line', x1: 20, y1: 160, x2: 740, y2: 160, dashed: true },
      { t: 'text', x: 380, y: 186, text: 'How your final result is made up', size: 19, bold: true },
      ...bar([
        { v: 10, top: '10%', label: 'module\ntests', fill: 'yellow' },
        { v: 50, top: '50%  final assessment', label: 'one exam at the end of Phase 1', fill: 'blue' },
        { v: 40, top: '40%  on-the-job training', label: 'your OJT performance', fill: 'orange' },
      ], { x: 20, y: 214, w: 720, h: 46 }),
    ]),

    `## What will you learn? Six subject areas
You do not need to know any of these words yet. Each one gets its own lessons.

| Subject | What it means for a beginner |
|---|---|
| **1. Accounting** | Recording a business's money in books (bookkeeping), turning it into financial statements, and doing it in Excel and Tally (accounting software). |
| **2. Taxation** | Income tax basics; **TDS** and **TCS** (tax collected at source); **GST**: registering, invoices, e-way bills (papers that travel with goods), and filing returns. |
| **3. Banking** | How MSME banking works: loans, other funding options, **CIBIL** (the credit score) and bank compliance. |
| **4. Financial management** | Where a business gets money from, **ratio analysis** (health checks using simple division) and **working capital** (cash to run day-to-day). |
| **5. Legal and secretarial** | Forming a business, registrations, government schemes, ongoing compliances, and what to do about delayed payments. |
| **6. Cost and management accounting** | What it actually costs to make a product, costing methods, **budgeting** (planning money in advance) and cost control. |

> **Assessment:** module tests count 10%, the final assessment 50% and OJT 40%. You must meet the prescribed passing marks and complete OJT. Then you receive the **Corporate Mitra certificate**, which lets you work as an **MSME compliance facilitator** under the programme.`,

    `## What can a Corporate Mitra actually do?
This is the most important part. After the course, you are expected to be able to help a business with all of these:

| Area | The job, in plain words |
|---|---|
| **Business formation** | Help register the right kind of business: proprietorship, partnership, LLP or company. |
| **PAN, TAN, GST** | Get the tax IDs and then keep up with GST returns and **e-invoicing** (invoices registered on a government portal). |
| **Udyam and income tax** | Register the business as an MSME on Udyam; help with income tax compliance and return filing. |
| **Books of accounts** | Keep the day-to-day record of money coming in and going out. |
| **Banking and finance** | Support routine banking, current-account compliance and financial planning. |
| **Corporate governance** | For companies: board meetings, **statutory registers** (official record books), director KYC. |
| **GeM** | Register the business on the government marketplace so it can sell to government offices. |
| **TReDS** | Register on TReDS and use invoice financing to improve cash flow. |
| **MSME Samadhan** | File a complaint on the government portal when a buyer pays late. |
| **Labour laws** | Professional tax, **EPF** (provident fund) and **ESI** (employee state insurance), where they apply. |
| **Local approvals** | Factory licence, fire-safety NOC, building plan, electricity and water connections, legal metrology (weights and measures). |
| **IPR** | Trademark, copyright and patent registration. A brand name is often a small business's most valuable asset. |
| **Quality and cyber** | Quality certificates like ISO, data protection, record keeping. |
| **Tracking due dates** | Remember every filing date. A missed return or renewal means penalties. |`,

    sk(350, 'The Corporate Mitra covers the whole life of a small business, not one single task.', hub(
      { label: 'Corporate\nMitra', fill: 'yellow' },
      [
        { label: 'Start the business', sub: 'form, register', fill: 'blue' },
        { label: 'Tax IDs and GST', sub: 'PAN, TAN, returns', fill: 'green' },
        { label: 'Books of accounts', sub: 'record the money', fill: 'orange' },
        { label: 'Banking and loans', sub: 'funding, schemes', fill: 'purple' },
        { label: 'Government buyers', sub: 'GeM, TReDS', fill: 'teal' },
        { label: 'Labour and licences', sub: 'PF, ESI, factory', fill: 'pink' },
        { label: 'Brand and quality', sub: 'trademark, ISO', fill: 'yellow' },
        { label: 'Due-date tracking', sub: 'no missed filings', fill: 'grey' },
      ],
      { cy: 175, rx: 290, ry: 126, bw: 160, bh: 56, r: 52 },
    )),

    `## Who runs the programme?
Three professional institutes of India work together, because the subject mix needs all three:

| Institute | Full name | Brings |
|---|---|---|
| **ICAI** | Institute of Chartered Accountants of India | Accounting, audit, taxation |
| **ICSI** | Institute of Company Secretaries of India | Company law, secretarial work, governance |
| **ICMAI** | Institute of Cost and Management Accountants of India (the "Cost Accountants" institute) | Costing and management accounting |

The **Swayam Plus** portal is the single place for enrolment, learning, OJT matching, assessment and certification.

## A worked example: one new manufacturing business
A young entrepreneur walks in: "I want to start a manufacturing business." A good Corporate Mitra does not start with one law. They think in a **sequence**:

1. **Which form of business?** (proprietorship, partnership, LLP, company)
2. **Which registrations?** PAN, TAN, GST, Udyam
3. **Does the unit need a factory licence?** Labour-law registrations?
4. **How will the books be kept?**
5. **Banking:** opening and running the business accounts.
6. **Money and customers:** government schemes, GeM, what to do if a customer pays late (MSME Samadhan).
7. **Protect the brand:** trademark. Quality certificates if customers ask.

The most valuable skill is **not** knowing every law by heart. It is seeing the **whole life cycle**: start, run, comply, finance, grow.`,

    sk(340, 'The questions a Corporate Mitra works through, in order, for a new manufacturing business', steps([
      { label: 'Form of business', desc: 'proprietorship, partnership, LLP or company?' },
      { label: 'Registrations', desc: 'PAN, TAN, GST, Udyam' },
      { label: 'Licences, labour', desc: 'factory licence, PF, ESI, local approvals' },
      { label: 'Books of accounts', desc: 'record every rupee coming in and going out' },
      { label: 'Banking and loans', desc: 'current account, schemes, credit' },
      { label: 'Customers and cash', desc: 'GeM, TReDS, late-payment complaint' },
      { label: 'Brand and quality', desc: 'trademark, ISO certificate' },
    ], { x: 36, y: 28, dy: 46, tw: 215 })),

    { warn: 'A Corporate Mitra is a **facilitator**, not an all-powerful expert. If a matter needs **specialised certification**, a **detailed legal opinion**, an **audit or attestation**, the right qualified professional (CA, CS, advocate) must handle it. A good Corporate Mitra knows **what they can do themselves and when to refer**. That judgement is itself a core professional skill.' },

    { real: `Every lesson in these notes ends with the same question: **"What would I do for Ravi's bakery?"** If you can answer that in simple words for each topic, you are ready for the job.` },

    { remember: `- A Corporate Mitra = a **trained, certified helper** who guides MSMEs through registrations, tax, books, finance and schemes.
- The course is **12 months**: **6 months academic** (about 150 hours, English and Hindi) + **6 months on-the-job training**.
- Six subjects: **accounting, taxation, banking, financial management, legal and secretarial, cost and management accounting.**
- Result = **10% module tests + 50% final assessment + 40% OJT**.
- Eligibility: **Indian, up to 30 years, graduate** (final-year students can also join).
- Run by **ICAI, ICSI and ICMAI** through the **Swayam Plus** portal.
- The real skill is seeing the **whole life cycle** of a business, and knowing **when to refer** to a specialist.` },
  ],
  quiz: [
    { q: `How long is the Corporate Mitra programme, and how is it split?`, o: [`6 months, all online`, `12 months: 6 months academic + 6 months on-the-job training`, `3 months classroom + 9 months exams`, `24 months of on-the-job training`], a: 1, why: `Phase 1 is about 150 hours of academic learning over 6 months. Phase 2 is 6 months of OJT in a professional firm.` },
    { q: `Which part of the final result is worth 40%?`, o: [`Module tests`, `Final assessment`, `On-the-job training`, `Attendance`], a: 2, why: `Module tests are 10%, the final assessment is 50% and OJT is 40%.` },
    { q: `Who can apply for the course?`, o: [`Any graduate of any age`, `An Indian graduate up to 30 years old (final-year students can also take part)`, `Only commerce graduates`, `Only practising accountants`], a: 1, why: `The conditions are Indian nationality, age up to 30 on the application date, and a graduate degree. No commerce background is needed.` },
    { q: `Which three institutes run the programme?`, o: [`RBI, SEBI and IRDAI`, `IIT, IIM and NIT`, `ICAI, ICSI and ICMAI`, `GST Council, CBDT and MCA`], a: 2, why: `The Institutes of Chartered Accountants, Company Secretaries and Cost Accountants work together through the Swayam Plus portal.` },
    { q: `A client needs an audit and a detailed legal opinion. What should a good Corporate Mitra do?`, o: [`Do it quickly to keep the client`, `Refuse to talk to the client again`, `Refer the client to the right qualified professional`, `Copy it from the internet`], a: 2, why: `A Corporate Mitra is a facilitator. Audit, attestation and legal interpretation belong to qualified professionals, and knowing when to refer is part of the job.` },
  ],
};
