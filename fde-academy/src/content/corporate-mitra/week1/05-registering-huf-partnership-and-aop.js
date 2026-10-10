import { sk, flow2, steps } from '../_kit.js';

export default {
  title: `Registering an HUF, a partnership firm and an AOP`,
  goal: `You can get a PAN for an HUF, draft and execute a partnership deed, register a partnership firm, and set up the written agreement an AOP needs.`,
  covers: [`HUF: separate PAN`, `Partnership deed`, `Stamp paper, witnesses, notary`, `Registrar of Firms`, `AOP / BOI: memorandum and bylaws`],
  terms: [
    [`HUF`, `Hindu Undivided Family. A family treated by tax law as one unit that can run a business. The head is the Karta.`],
    [`PAN`, `Permanent Account Number: a 10-character ID (letters and digits) given by the Income Tax Department. It follows a person or entity for all tax matters.`],
    [`e-PAN`, `The electronic copy of the PAN, sent by email and downloadable. The physical card arrives later by post. All carry the same number.`],
    [`Acknowledgement number`, `The tracking number you get when you submit an application. Keep it until the final document arrives.`],
    [`Partnership deed`, `The written agreement between partners: who puts in how much money, how profit is split, who does what, and what happens when someone joins or leaves.`],
    [`Non-judicial stamp paper`, `Special paper (or an e-stamp) on which an agreement is printed, to pay the state stamp duty. It makes the document valid and admissible.`],
    [`Notary`, `A legally authorised person who certifies that the people who signed a document really signed it, on that day.`],
    [`Registrar of Firms`, `The state officer who keeps the Register of Firms. Usually works at the district level, often from the District Industries Centre (DIC).`],
    [`NSWS`, `National Single Window System. A central government portal that brings many registrations together in one place.`],
    [`AOP / BOI`, `Association of Persons / Body of Individuals. People who join hands to do business without forming a firm or a company.`],
    [`Memorandum and bylaws`, `For an AOP: the memorandum says who the group is and what it does; the bylaws are its working rules.`],
    [`Governing body`, `The group of members who run an AOP or society and take its decisions.`],
  ],
  blocks: [
    `## Where we are
Last lesson covered a single owner. Now we move to businesses with **many people**. Three of the unincorporated forms need more paperwork, because there must be a record of **who owns what**:

| Form | What the Corporate Mitra does |
|---|---|
| **HUF business** | Gets a **separate PAN** for the HUF |
| **Partnership firm** | Drafts a **partnership deed**, registers the firm, gets a PAN |
| **AOP / BOI** | Creates a **memorandum and bylaws**, gets a PAN |

All three can also take **Udyam**, **Shops and Establishment** and **trademark** registrations, exactly as in the previous lesson. The only difference is that the **business name is different from the owner's name**, and for trademarks one person must be **authorised** to apply on behalf of the group.

> **A change in the tax law.** The course notes that the old income-tax law has been replaced by a new one that took effect from **1 April 2026** (the lecture calls it the *Income Tax Code 2026*). PAN applications are now made under the new law. The steps below are the same in practice. Always check the form names on the official PAN portal.

## 1. HUF business: getting a separate PAN
A proprietor uses his own PAN, but an **HUF is a separate tax unit**, so it needs **its own PAN**. This is straightforward and you can easily do it for clients.

**Steps:**
1. Open an official PAN application portal. Two authorised ones are **Protean (formerly NSDL)** and **UTIITSL**.
2. Choose the form for the right **applicant category**. For an HUF no **photograph** is needed (for an individual it is).
3. Choose the **mode**: send **physical documents**, or go **paperless** with **Aadhaar-based e-KYC and e-sign**. For paperless mode, one family member (normally the Karta) uses his Aadhaar.
4. Fill in the details: the **name of the HUF business**, the **date of "incorporation"** (here, the date the HUF business was started), the **business address**, and the **contact details** of the person authorised to apply for the HUF.
5. **Pay the fee online** (net banking, UPI, debit or credit card).
6. Submit, and **save the acknowledgement number**. There is a gap between submission and PAN allotment, so keep it for tracking.
7. Complete the **Aadhaar authentication or e-sign**, or post the physical documents with the acknowledgement to the processing centre.
8. The **Income Tax Department verifies** and allots the PAN.

**What arrives:** the PAN by **email**, the **e-PAN** (downloadable), and a **physical card** by post at the registered address. The number is the same on all three. The letter carries the Income Tax Department and Government of India marks and a **QR code**, and the card is stuck to it with two-sided tape. Peel off the card carefully, **keep the letter**, store the originals safely, and hand them to your client with the advice to preserve them.`,

    sk(262, 'Getting a PAN for an HUF', flow2([
      { label: `Choose form`, sub: `HUF category, no photo`, fill: `blue` },
      { label: `Choose mode`, sub: `paper or Aadhaar e-KYC`, fill: `yellow` },
      { label: `Fill details`, sub: `name, date, address`, fill: `orange` },
      { label: `Pay online`, sub: `UPI, net banking, card`, fill: `purple` },
      { label: `Save the ack. no.`, sub: `then e-sign / post docs`, fill: `pink` },
      { label: `PAN issued`, sub: `email + e-PAN + card`, fill: `green` },
    ], { y: 14, h: 74, rowGap: 56, x: 14, w: 732, gap: 50, label: `then` })),

    `## 2. Partnership firm: six jobs, in this order
A partnership firm is **two or more partners** doing business together. As a Corporate Mitra you will typically do six things:

1. **Draft and execute the partnership deed.**
2. **Register the firm** under the **Indian Partnership Act, 1932** (optional, but important).
3. Get the firm's **PAN**.
4. **Udyam** registration.
5. **Shops and Establishment** registration.
6. **Trademark** registration (one partner is authorised to apply).`,

    sk(332, 'The six jobs for a new partnership firm', steps([
      { label: `Partnership deed`, desc: `the written agreement, signed and notarised` },
      { label: `Register the firm`, desc: `Registrar of Firms (optional, but advisable)` },
      { label: `PAN of the firm`, desc: `deed is a mandatory attachment` },
      { label: `Udyam`, desc: `firm name differs from partners' names` },
      { label: `Shops and Establishment`, desc: `state labour department` },
      { label: `Trademark`, desc: `one partner is authorised to apply` },
    ], { x: 36, y: 30, dy: 50, tw: 250 })),

    `### Job 1: the partnership deed
The deed is the **mother document** of the firm. Partners who trust each other still fall out over money, so everything goes in writing.

**Do your homework first.** Collect and verify, for **every partner**: full name, father's name, Aadhaar, address, and proof of address. If the address on the form does not match the proof, every later registration becomes painful. Careful checking at this stage is the mark of a good professional.

**What the deed contains:**
- The **nature of the business** and the firm's name
- The **capital** each partner brings
- The **profit-sharing ratio**
- The **roles and duties** of each partner (not every partner is active)
- **Rights** of the partners, and how the **bank account** is operated
- How a **new partner is admitted**, how a partner **retires**, and how the firm is **dissolved** (closed)
- Increasingly, a **succession clause**, so the business can carry on if a partner dies

**How to execute it:**
1. Circulate the draft. **Every partner signs every page**. The signature is each partner's consent.
2. Print the final deed on **non-judicial stamp paper** of the value set by the **state Stamp Act** (stamp duty differs by state). If the state prescribes nothing, the course advises **₹100** stamp paper.
3. Have it **witnessed**, so the witnesses can say "all partners agreed in my presence".
4. **Notarise it the same day** at the local court or a notary.
5. Keep the **original** safe for as long as the business runs.`,

    sk(262, 'Executing a partnership deed', flow2([
      { label: `Verify partners`, sub: `name, address, ID`, fill: `blue` },
      { label: `Draft the deed`, sub: `capital, profit ratio`, fill: `yellow` },
      { label: `All sign each page`, sub: `this is the consent`, fill: `orange` },
      { label: `Stamp paper`, sub: `per state Stamp Act`, fill: `purple` },
      { label: `Witnesses sign`, sub: `same day`, fill: `pink` },
      { label: `Notarise`, sub: `same day, keep original`, fill: `green` },
    ], { y: 14, h: 74, rowGap: 56, x: 14, w: 732, gap: 50, label: `then` })),

    `### Job 2: registering the firm
Registration is **optional**, but there is a strong reason to do it: in general, an **unregistered firm cannot sue an outsider in court** to enforce its contracts. A firm that expects to chase customers for payment should register.

**How:**
1. Go to your **state's Registrar of Firms** portal, or to the central **NSWS** portal that gathers many of them.
2. Fill **Form 1** (the name differs in some states): firm details, partners' details, address, profit-sharing ratio.
3. Attach: the **executed deed**, the **PAN of the partners**, **address proof of the firm**, and a **rent or lease agreement** (if the premises belong to a partner, a **no-objection certificate** from him).
4. Pay the **fee** and submit online. Some states also want **physical copies**.
5. The Registrar checks, may ask for corrections, and then **enters the firm in the Register of Firms**.

Registrars sit **at the district level** (India has about 800 districts), often inside the **District Industries Centre**. Find the right district office for physical submission and for collecting the certificate. The certificate carries the Registrar's signature and stamps, and its date is treated as the firm's registration date.

### Jobs 3 to 6
- **PAN:** same process as the HUF. The one difference is that the **partnership deed is a mandatory attachment**.
- **Udyam and Shops and Establishment:** same as before. Use the **firm's name** as the enterprise name (it differs from the partners' names).
- **Trademark:** same as before, but a **partner or another person is authorised** to apply for the whole firm.

## 3. AOP / BOI: the least formal form
An **Association of Persons** or **Body of Individuals** is a group that does business together **without forming a firm**. No special registration is required, and no law governs it directly. But a group of people will eventually disagree, so you should still write down the rules.

**Create a memorandum and bylaws:**
- **Memorandum:** name of the AOP, registered office address, objectives and activities, members, each member's **capital contribution** and **profit-sharing ratio**.
- **Bylaws (the working rules):** admission and removal of members, rights and duties, **meetings and voting**, management and decision-making power, accounts and records, **dissolution**.

Execute it like a partnership deed: **non-judicial stamp paper**, **signed by all members**, **witnesses**, **notarised the same day**.

Then: get a **separate PAN** (with the **memorandum and bylaws as a mandatory attachment**), plus **Udyam** and **Shops and Establishment**. For a **trademark**, one person must be authorised by **at least 51%** of the governing body.`,

    { analogy: `A **partnership deed** (or an AOP's memorandum and bylaws) is the **README plus the governance rules of an open-source project**. Nobody needs it while everyone is friends. The day there is a disagreement about who owns what, who can merge, or who leaves, it is the only thing everyone can point to. Writing it early is cheap. Writing it after the fight is impossible.` },

    `## Which registrations apply to which form?
| Form | Own PAN | Udyam | Shops and Estab. | Trademark | Written agreement | Firm registration |
|---|---|---|---|---|---|---|
| Individual | Owner's PAN | Yes | Yes | If a name or logo | None | None |
| Proprietorship | Owner's PAN | Yes | Yes | Yes | None | None |
| **HUF** | **Own PAN** | Yes | Yes | Yes | None | None |
| **Partnership** | **Own PAN** | Yes | Yes | Yes (authorised partner) | **Partnership deed** | **Optional**, Registrar of Firms |
| **AOP / BOI** | **Own PAN** | Yes | Yes | Yes (51% authorisation) | **Memorandum and bylaws** (advisable) | None needed |

## Worked example: Ravi and his friend Sameer
Ravi and Sameer start a biscuit unit together. They put in ₹6 lakh and ₹4 lakh and agree to split profit 60-40.

1. **Verify** both partners' IDs and addresses. The addresses must match the proofs.
2. **Draft the deed** with the capital (₹6 lakh and ₹4 lakh), profit ratio **60:40**, roles (Ravi runs production, Sameer handles sales), how the bank account is operated, and what happens if one leaves or dies.
3. Both **sign every page** on ₹100 (or state-prescribed) stamp paper, with **witnesses**, and **notarise the same day**.
4. **Register** the firm with the district Registrar of Firms (Form 1 + deed + PANs + rent agreement).
5. Get the **firm's PAN** (deed attached), then **Udyam** and **Shops and Establishment**.
6. If they want the brand protected, **authorise Ravi** to file the **trademark**.`,

    { warn: `Typical slips:
- Using the **partners' PANs** for the firm. The firm has to apply for **its own PAN**.
- **Different addresses** on different documents. Fix it before you begin.
- **Signing at different times** or skipping the **same-day notarisation**.
- Forgetting a **succession clause**, so the firm's future is uncertain if a partner dies.
- Treating **registration as unnecessary** because it is optional. An unregistered firm is weak in court.` },

    { real: `Your first meeting with a new partnership is really a **negotiation session**. Ask each partner: how much money, how much time, how will profit be split, what happens if one wants to leave? Writing the answers into the deed is the most useful service you provide.` },

    { remember: `- **HUF, partnership and AOP** each need their **own PAN**. Proprietor and individual use the owner's.
- HUF PAN: category form (no photo), paper or **Aadhaar e-KYC**, pay online, **save the acknowledgement number**, receive PAN + **e-PAN** + card.
- Partnership firm = **deed → register (optional) → PAN → Udyam → Shops and Establishment → trademark**. Minimum **two partners**.
- Deed: **capital, profit ratio, roles, bank operation, admission, retirement, dissolution, succession**. Sign every page, **state stamp paper (₹100 if none prescribed)**, witnesses, **notarise the same day**.
- Firm registration: **Registrar of Firms** (district level) or **NSWS**, Form 1 + deed + partners' PAN + address proof + lease or NOC.
- AOP/BOI: **memorandum and bylaws**, PAN with these attached, trademark authorisation by **51%** of the governing body.` },
  ],
  quiz: [
    { q: `What is the minimum number of partners in a partnership firm?`, o: [`1`, `2`, `7`, `10`], a: 1, why: `A partnership needs two or more persons.` },
    { q: `Which of these needs a separate PAN of its own?`, o: [`An individual business`, `A proprietorship`, `An HUF business`, `None of them`], a: 2, why: `An HUF is a separate tax unit, so it has its own PAN. Individuals and proprietors use the owner's PAN.` },
    { q: `Which document is a mandatory attachment when a partnership firm applies for PAN?`, o: [`The partnership deed`, `A trademark certificate`, `A GST return`, `A bank loan letter`], a: 0, why: `The executed partnership deed must be attached to the PAN application of the firm. An HUF has no such deed.` },
    { q: `When should a partnership deed be notarised?`, o: [`Within a year`, `On the same day the partners and witnesses sign`, `Only if the firm has a loan`, `Never`], a: 1, why: `The course advises notarising on the same day, so the signatures and witnesses are authenticated together.` },
    { q: `Who must authorise a trademark application for an AOP?`, o: [`Any one member`, `A notary`, `At least 51% of the governing body members`, `The bank`], a: 2, why: `Because many persons own the business, one person is authorised by at least a 51% majority of the governing body.` },
    { q: `Is registration of a partnership firm compulsory?`, o: [`Yes, always`, `No, but an unregistered firm is weak in court`, `Only in Delhi`, `Only above 1 crore sales`], a: 1, why: `Registration is optional, but in general an unregistered firm cannot sue outsiders in court to enforce contracts.` },
  ],
};
