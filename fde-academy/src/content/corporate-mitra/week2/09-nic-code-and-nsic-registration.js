import { sk, flow, stack } from '../_kit.js';

export default {
  title: `Udyam Assist benefits, the NIC code and NSIC registration`,
  goal: `You can say what a unit gains from Udyam Assist, choose and explain a NIC code, and explain NSIC's Single Point Registration Scheme: who may join, what it gives in government tenders, and how the tender limit (monetary limit) is worked out.`,
  covers: [`What Udyam Assist gives`, `The NIC code`, `NSIC and the SPRS`, `Benefits in government tenders`, `The monetary limit`],
  terms: [
    [`URN`, `Unique Registration Number: the identity number a unit receives on Udyam Assist.`],
    [`Merchant QR code`, `A payment code a shopkeeper displays so customers can pay by UPI. Digital receipts build a record that banks can read.`],
    [`NIC`, `National Industrial Classification: the national list of business activities, each with a code. Do not confuse it with NSIC.`],
    [`NSIC`, `National Small Industries Corporation: a Government of India enterprise under the Ministry of MSME that helps micro and small units with marketing, technology and finance.`],
    [`SPRS`, `Single Point Registration Scheme: NSIC's online registration that lets a micro or small unit take part in government buying.`],
    [`Public procurement policy`, `The government's rule that central departments and public companies buy a set share of what they need from micro and small enterprises.`],
    [`L1`, `The lowest price quoted in a tender.`],
    [`Earnest money deposit (EMD)`, `Money a bidder deposits with a tender as a guarantee of seriousness. NSIC-registered units are exempt.`],
    [`Monetary limit`, `The largest value of government orders an NSIC-registered unit may hold at one time: its tender capacity.`],
    [`Provisional registration`, `A short-term NSIC registration for a unit that has not yet completed one year of commercial production.`],
    [`Consortium`, `A group of small units that join to bid for one tender and share the work.`],
    [`Blacklisted`, `Barred by a government body from taking part in its tenders.`],
  ],
  blocks: [
    `## Three rungs of one ladder
Last lesson ended with Udyam Assist. This lesson finishes the story. The full path looks like a ladder, and each rung is for a different kind of unit.`,

    sk(250, 'Three registrations, three kinds of unit', [
      ...flow([
        { label: `Udyam Assist`, sub: `informal micro, no PAN`, fill: `orange` },
        { label: `Udyam`, sub: `any MSME with a PAN`, fill: `green` },
        { label: `NSIC (SPRS)`, sub: `micro and small, with Udyam`, fill: `blue` },
      ], { y: 22, h: 76, gap: 70, max: 19 }),
      { t: 'note', x: 10, y: 130, w: 220, h: 84, text: `Bank loans through\npriority sector lending.\nA first step.`, fill: `orange`, size: 14 },
      { t: 'note', x: 270, y: 130, w: 220, h: 84, text: `Official recognition,\nschemes, loans, free,\nno renewal.`, fill: `green`, size: 14 },
      { t: 'note', x: 530, y: 130, w: 220, h: 84, text: `Government orders and\ntenders. Optional. Fee.\nRenewed every 2 years.`, fill: `blue`, size: 14 },
    ]),

    `## Udyam Assist: what the unit gets
For a micro unit that has been working informally, the Udyam Assist certificate is a **first step into the system**.

- A **unique registration number (URN)**, a central digital identity. The lecture calls it "a passport of the digital system", because other services (loans, digital marketplaces, other government systems) can recognise the unit by it.
- **Priority sector loans** as per RBI guidelines: working capital, small business loans and **Mudra** loans (Week 3). Banks are encouraged to lend to this group.
- A **merchant QR code** to accept digital payments. Every payment received and made through it adds to a **record of the unit's activity**, which improves its credit profile.
- **Better data for the government**, which can then plan for the informal sector, and **knowledge and skills** support for these units.
- **A route up.** With help from the nodal agency the unit grows, gets a **PAN**, and **moves to full Udyam**. Udyam Assist is **not the same as MSME registration**; it is a stepping stone.

**What is needed:** **Aadhaar**, mobile number, business details, bank account details and basic activity information. **No PAN.** The **bank or nodal agency uploads** the data after the owner consents. The owner uploads nothing.

**Example.** Mrs A makes pickles at home. She has no books and no GST registration, and earns about **₹4 lakh** a year. She wants a Mudra loan. Her bank recognises her as an informal micro entrepreneur, guides her and registers her on Udyam Assist. She receives the certificate, and the bank can now lend her under priority sector lending.

## The NIC code: naming the activity
Every Udyam form has a field for the **NIC code**. NIC is the **National Industrial Classification**, made by the Ministry of Statistics and Programme Implementation. It gives **every kind of business activity a code**, starting broad and getting more specific.`,

    sk(412, 'A NIC code narrows the activity step by step (the lecture\'s bakery example)', [
      ...stack([
        { label: `Section C`, sub: `manufacturing`, fill: `blue` },
        { label: `Division 10`, sub: `food products`, fill: `blue` },
        { label: `Group 107`, sub: `other food products`, fill: `blue` },
        { label: `Class 1071`, sub: `bakery products`, fill: `blue` },
        { label: `Code 10711`, sub: `one specific activity`, fill: `green` },
      ], { x: 40, y: 14, w: 300, h: 56, gap: 22 }),
      { t: 'note', x: 400, y: 36, w: 340, h: 60, text: `More digits = a more exact activity.\nThe form shows a list: pick the closest match.`, fill: `yellow`, size: 14 },
      { t: 'note', x: 400, y: 140, w: 340, h: 76, text: `The NIC code does NOT decide the size.\nSize comes only from investment\nand turnover.`, fill: `red`, size: 14 },
      { t: 'note', x: 400, y: 250, w: 340, h: 76, text: `One PAN, one Udyam number, but give\nthe NIC code of EVERY activity the\nunit carries on.`, fill: `green`, size: 14 },
    ]),

    `Why it matters. The code tells the government **what the unit actually does**. A **wrong code** can block scheme benefits and loans later. Manufacturing, consultancy and retail trade each have **different codes**. Pick the exact one for the real activity and do not guess.

## NSIC: the next step for those who want government orders
Once a micro or small unit has its Udyam number, it can also register with **NSIC**, the **National Small Industries Corporation**. It is a Government of India enterprise under the Ministry of MSME, with offices and technical centres across the country, and its mission is **integrated support**: marketing, technology and finance. (It is for **micro and small** units, not medium.)

The registration is called the **Single Point Registration Scheme (SPRS)** and it is **done online**. It is **not compulsory**. A unit needs it only if it wants to take part in **government purchase**. The course gives the portal as nsicspronline.com; check the address on NSIC's own site.

**Benefits for a registered unit:**
- **Tender documents free of cost.**
- **Exemption from earnest money deposit.**
- **Price preference.** If the lowest bid (**L1**) came from a non-MSE, a micro or small unit that quoted **within 15% above L1** can still be given **up to 25% of the order**, if it agrees to **bring its price down to L1**.
- **Consortium bidding** for large tenders.
- **A share of government purchase.** Under the public procurement policy every central ministry, department and public sector company must aim to buy **at least 25%** of its needs from micro and small enterprises. Within that, **4%** is set for units owned by SC and ST entrepreneurs and **3%** for women-owned units. The course also says that **358 items** are reserved for purchase from the MSE sector only (check the current list).`,

    sk(244, 'L1 + 15%: a higher bid can still win part of the order', [
      { t: 'text', x: 560, y: 16, text: `the MSE bids ₹1,120`, size: 16, bold: true, color: `#c2410c` },
      { t: 'arrow', x1: 560, y1: 30, x2: 560, y2: 62, color: `#c2410c` },
      { t: 'box', x: 80, y: 66, w: 600, h: 46, label: `the L1 + 15% band`, fill: `green`, size: 17 },
      { t: 'text', x: 80, y: 134, text: `₹1,000`, size: 16, bold: true },
      { t: 'text', x: 80, y: 156, text: `L1: lowest bid,\nfrom a non-MSE`, size: 14, color: `#4a5568` },
      { t: 'text', x: 680, y: 134, text: `₹1,150`, size: 16, bold: true },
      { t: 'text', x: 680, y: 156, text: `top of the band\n(15% of 1,000 = 150)`, size: 14, color: `#4a5568` },
      { t: 'note', x: 100, y: 190, w: 560, h: 40, text: `Inside the band. If the MSE matches ₹1,000, it supplies up to 25% of the order.`, fill: `yellow`, size: 14 },
    ]),

    `*The lecture's figures read "1,015", which is a speech slip: 15% of ₹1,000 is ₹150, so the band reaches ₹1,150.*

**Who can register:**
- Micro and small units **with a Udyam registration**, in **manufacturing or services**.
- A unit that has started commercial production but has **not yet completed one year** gets a **provisional registration** valid for **1 year**, with a **monetary limit of ₹5 lakh** (as the course gives it). It can apply for a full registration after that year.
- A unit with **several factories**, even in different states, registers **once**, at one branch.

**Not eligible:**
- **Traders**: wholesale, retail and commission agents.
- **Allopathic medicine and drug makers.** (Makers of Ayurvedic, Unani, Siddha and Homeopathic medicines are eligible.)
- **Blacklisted** units, while they are blacklisted.
- Units whose **proprietor, partner, director or karta** has been **convicted** of a criminal offence (the offence proved and a penalty imposed).

**Validity and cost:** the certificate is valid for **2 years**, then it is **renewed** for 2 years at a time. There **is a fee**, based on turnover as per the latest audited balance sheet, for registration, renewal and amendments. NSIC's site has a **fee calculator**. NSIC may also send an inspector to the unit's site before it approves the registration, and an **inspection fee**, also based on turnover, is charged (next lesson).

**Documents:** PAN, the Udyam certificate, details of plant and machinery, proof of ownership or a lease or rent agreement, a list of **quality-control equipment**, the latest electricity bill, **audited financial statements of the last 3 years**, a statement of results of operations, a bank report and a declaration. Each type of entity adds its own papers: the partnership deed for a firm, the MOA, AOA and board resolution for a company, the LLP agreement for an LLP, and the authorisation of the karta for an HUF.

## The monetary limit: how big an order a unit may hold
The **monetary limit** is the **largest value of government orders** the unit may have **at any one time**. NSIC works it out from the **net sales (sales minus returns)** of the last three years, and the rule gets stricter if machinery has been sold or if the unit has made losses. These are the course's rules.`,

    sk(272, 'Tender capacity depends on turnover, machinery and profit', [
      { t: 'table', x: 70, y: 44, cols: [`Situation`, `Monetary limit`], colW: [360, 290], rowH: 34, title: `NSIC monetary limit (as given in the course)`,
        rows: [
          [`Machinery not reduced`, `50% of the highest turnover`],
          [`Machinery down >10%, profit in all 3 years`, `50% of last year's turnover`],
          [`Machinery down >10%, loss in 1 year`, `40% of the 3-year average`],
          [`Machinery down >10%, loss in 2 years`, `30% of the 3-year average`],
          [`Machinery down >10%, loss in all 3 years`, `20% of the 3-year average`],
        ] },
    ]),

    `**Worked examples** (all turnovers in ₹ crore):

| Situation | Turnover of the last 3 years | Calculation | Monetary limit |
|---|---|---|---|
| Machinery not reduced | 4, 6, 8 | 50% of the highest (8) | **₹4 crore** |
| Machinery down >10%, profit all 3 years | 6, 8, 10 | 50% of the last year (10) | **₹5 crore** |
| Machinery down >10%, loss in 1 year | 6, 8, 10 | average 8, then 40% | **₹3.2 crore** |
| Machinery down >10%, loss in 2 years | 6, 8, 10 | average 8, then 30% | **₹2.4 crore** |
| Machinery down >10%, loss in all 3 years | 5, 6, 7 | average 6, then 20% | **₹1.2 crore** |

Check the limit on NSIC's own site, because the rules are revised from time to time.`,

    { analogy: `A **NIC code** is like the **category tag** you must give a product in a catalogue: it does not say how big the seller is, only what it sells, and search and filters depend on it. The **monetary limit** is a **credit limit** on a government account: how much open business the unit may carry at once, set by past turnover and tightened by risk signals (sold machinery, losses). **NSIC registration** is **vendor empanelment**: you can run your business without it, but you cannot bid on the buyer's tenders until you are on the approved list.` },

    { warn: `Easy mistakes:
- **Mixing up NIC and NSIC.** NIC is the activity list (a code). NSIC is the government corporation (a registration).
- **Picking the NIC code to get a scheme.** The code must describe the real activity.
- **Thinking NSIC is free.** The fee depends on turnover.
- **Telling a trader to register with NSIC.** Traders are not eligible.
- **Forgetting renewal.** The certificate lasts 2 years.
- **Treating Udyam Assist as full Udyam.** It is a stepping stone for informal micro units.` },

    { real: `When a client says "I want to sell to the government", you now have the whole route: **Udyam first, NSIC SPRS second**, with the audited statements of the last three years ready. Calculate the monetary limit for them and tell them honestly what size of order they can take. A unit with a ₹4 crore limit should not chase a ₹10 crore tender.` },

    { remember: `- **Udyam Assist:** URN, priority sector loans (working capital, Mudra), merchant QR code, a route up to full Udyam. No PAN; the bank or nodal agency uploads.
- **NIC code:** the activity code, from section letter to 5-digit code. It does **not** set the size. Give the codes of **all** activities. It is **not** NSIC.
- **NSIC SPRS:** for **micro and small** units **with Udyam**. Optional. For **government tenders**. Fee. Valid **2 years**. Not for traders, allopathic drug makers, blacklisted or convicted owners.
- **Benefits:** free tender sets, **no EMD**, **L1 + 15%** price preference (up to 25% of the order), consortium bids, **25%** purchase target (4% SC/ST, 3% women), reserved items.
- **Monetary limit:** 50% of the highest turnover if machinery is not reduced; 50% of last year's, then 40%, 30% and 20% of the 3-year average if machinery is down more than 10% and there are losses in 1, 2 or 3 years.` },
  ],
  quiz: [
    { q: `Which of these is needed for Udyam Assist registration?`, o: [`PAN`, `GSTIN`, `Audited balance sheet`, `Aadhaar and bank account details`], a: 3, why: `Udyam Assist needs Aadhaar, mobile number, business details, bank details and activity information. PAN is not mandatory.` },
    { q: `What does the NIC code of an enterprise decide?`, o: [`Whether it is micro, small or medium`, `Which business activity it is in`, `How much GST it pays`, `Its monetary limit`], a: 1, why: `The NIC code only names the activity. Size depends on investment and turnover.` },
    { q: `Which units are NOT eligible for NSIC's Single Point Registration Scheme?`, o: [`A micro manufacturer with Udyam`, `A small service provider with Udyam`, `A wholesale trader`, `A unit with three factories in two states`], a: 2, why: `Traders (wholesale, retail, commission agents) are not eligible. A unit with several factories registers once.` },
    { q: `The lowest bid (L1) in a tender is ₹2,000 from a non-MSE. Up to which bid can a registered MSE still get part of the order?`, o: [`₹2,015`, `₹2,100`, `₹2,300`, `₹3,000`], a: 2, why: `The price band is L1 plus 15%: 15% of ₹2,000 is ₹300, so up to ₹2,300.` },
    { q: `Turnovers of the last 3 years are ₹4, ₹6 and ₹8 crore and machinery has not been reduced. What is the monetary limit?`, o: [`₹2 crore`, `₹3 crore`, `₹4 crore`, `₹6 crore`], a: 2, why: `With no reduction in machinery the limit is 50% of the highest turnover: 50% of ₹8 crore is ₹4 crore.` },
    { q: `How long is an NSIC registration valid?`, o: [`2 years, then renew`, `6 months`, `5 years`, `For ever`], a: 0, why: `The NSIC certificate is valid for 2 years and is renewed for 2 years at a time.` },
  ],
};
