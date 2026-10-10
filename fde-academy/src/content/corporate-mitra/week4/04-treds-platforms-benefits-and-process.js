import { sk, hub, steps } from '../_kit.js';

export default {
  title: `TReDS: RBI-regulated online invoice discounting for MSMEs`,
  goal: `You can explain what TReDS is, who takes part, why it is better for an MSME than a paper discount, how factoring differs from reverse factoring, how to join a platform and discount an invoice, and which technical terms to know.`,
  covers: [`What TReDS is`, `Benefits for the MSME`, `The five platforms`, `Participants and rules`, `Joining and discounting step by step`],
  terms: [
    [`TReDS`, `Trade Receivables electronic Discounting System: an online platform, regulated by the RBI, where MSME sellers, large buyers and financiers meet to discount invoices.`],
    [`Factoring unit (FU)`, `The name TReDS uses for an invoice or bill of exchange once it is uploaded to the platform.`],
    [`Factoring`, `The seller uploads the invoice and the buyer accepts it.`],
    [`Reverse factoring`, `The buyer uploads the invoice on behalf of the MSME supplier, and chooses the finance. Good for large buyers who want to help their supplier chain.`],
    [`Without recourse`, `If the buyer does not pay, the financier cannot ask the MSME seller for the money.`],
    [`Auction`, `Several financiers bid in competition for the right to discount an invoice, so the rate falls.`],
    [`T+1`, `The day after the trade. Here, money reaches the MSME's account one day after it picks a bid.`],
    [`Maker-checker`, `One party uploads (the maker) and the other confirms (the checker). If the seller uploads, the buyer checks, and the other way round.`],
    [`Cap rate`, `The highest discount rate a buyer or seller will accept. A buyer can set one cap rate; a seller can set several.`],
    [`Counterparty`, `The other side of a deal: the buyer for a seller, the seller for a buyer.`],
    [`Residual tenor`, `How many days are left before the invoice falls due.`],
    [`CERSAI`, `Central Registry of Securitisation Asset Reconstruction and Security Interest: a national register where TReDS deals are recorded.`],
  ],
  blocks: [
    `## From NSIC's paper scheme to an online market
Last lesson explained **bill discounting**: a seller gets cash today for an invoice that will be paid later. NSIC's scheme is the **paper** version: one lender, the seller deals directly with NSIC, and there is no competition. **TReDS** is the **online** version, and it is where most discounting of MSME bills now happens.

**TReDS** is an **RBI-regulated digital platform** that brings together **MSME sellers, large corporate buyers and financiers** in one place, for **transparent, efficient bill discounting at competitive rates**. It finances the invoices of MSMEs raised on **public sector undertakings, government departments, the private sector and large companies**. The financiers discount the invoices so that the MSME's **short-term working capital** need is met. It rests on the Payment and Settlement Systems Act.

## Why an MSME likes it
- **No collateral.** The money is given on the **buyer's credit**, not the MSME's, so the MSME pledges nothing.
- **Without recourse.** If the buyer does not pay, the MSME is **not responsible**.
- **Cash earlier.** The MSME gets money against credit sales soon, and the platform turns receivables into cash at a fair price.
- **Settlement on the due date.** The buyer pays the financier directly, by **auto-debit** on the date agreed.
- **Easy.** The MSME only **uploads invoices** of its reputed customers, and the buyer **accepts them online**. There is **no paper**.
- **Competitive rates.** Several financiers **bid** in an **online auction** for each invoice. The competition **lowers the discount rate**, and the MSME **chooses the bid**.
- **Fast.** Money normally reaches the MSME's account in **T+1**: one day after it picks a bid. The MSME receives **80% to 90% of the invoice value** at that point.

The lecture calls it a **triple-win model**: the MSME gets cash, the buyer gets relief (it need not pay early and its supplier is supported), and the financiers get business.

**Features.** RBI-regulated; standard procedures laid down by the RBI; **one shared platform** for seller, buyer and financier; **fully paperless**; a choice of financiers; **no human intervention** at upload, payment or settlement; **competitive auction rates**; and the **operator watches all the time**, because the money passes through the operator's system.

## The five RBI-licensed platforms
The numbers are the lecture's, as at the time it was recorded: they grow every month. Check each platform's site for current figures.`,

    `| Platform | Backed by, and a few facts |
|---|---|
| **RXIL** (Receivables Exchange of India Ltd) | A joint venture of **SIDBI** and the **National Stock Exchange**. The **first** platform to get RBI approval; started in December 2016; first TReDS deal in 2017. Over 60,000 MSMEs, 3,300 buyers and 70 financiers |
| **M1xchange** | Backed by investors including **IndiaMART** and **Jindal Stainless**. Started April 2017. Over 85,000 MSMEs, 10,000 buyers, 74 financiers, more than 2,500 cities, and over ₹3 lakh crore of bills discounted |
| **Invoicemart** (A.TReDS Ltd) | A joint venture of **Axis Bank** and **mjunction**. RBI approval June 2017, working from July 2017. Described as India's **largest**; strong in metros and big industrial areas; aims at 10 lakh MSMEs by 2030 |
| **C2Treds** | Run by **C2FO Factoring Solutions**; the lecture calls it a recently approved platform that brings international experience in invoice financing. Over 1.4 lakh MSMEs benefited; 8,000+ buyers; 75+ financiers |
| **DTX** (the lecture's name, spoken) | Launched in **January 2025**: the **newest**. Backed by venture investors; over 1 lakh MSMEs; 3,000+ companies. The fifth platform licensed by the RBI. Check the exact name on the RBI list |`,

    sk(300, 'Three parties meet on one RBI-regulated platform', hub(
      { label: `TReDS\nplatform`, fill: `yellow` },
      [
        { label: `MSME sellers`, sub: `upload invoices`, fill: `green` },
        { label: `Large buyers`, sub: `accept and pay`, fill: `blue` },
        { label: `Financiers`, sub: `bid to discount`, fill: `orange` },
      ],
      { cx: 380, cy: 160, rx: 250, ry: 100, r: 52, bw: 190, bh: 58 },
    )),

    `## Who takes part
- The **regulator**: the **RBI**.
- The **platform operators**.
- **Buyers:** large public and private companies with a turnover above ₹250 crore (the lecture says the limit has been **raised to ₹500 crore**), **central public sector undertakings**, some **state public sector undertakings** and **government departments**.
- **Sellers:** **MSMEs only**.
- **Financiers:** **banks and financial institutions**, **NBFCs** that do factoring, and, newly, **insurance companies**, which may now act as the fourth participant and **insure the transactions** for the financiers.

**Rules of play.** All deals are **without recourse for the MSME**. Both **factoring** and **reverse factoring** are allowed. **Invoices and bills of exchange** can be discounted. A deal's **minimum residual tenor is 15 days**: the invoice must be due at least 15 days after the day it is discounted.

## Factoring and reverse factoring`,

    sk(232, 'Who uploads decides the name', [
      { t: 'table', x: 70, y: 44, cols: [``, `Factoring`, `Reverse factoring`], colW: [150, 220, 230], rowH: 34, title: `Two ways to start a deal on TReDS`,
        rows: [
          [`Who uploads`, `the MSME seller`, `the buyer, for the seller`],
          [`Who checks`, `the buyer (accepts)`, `the MSME (confirms)`],
          [`Who sets terms`, `the seller (cap rates)`, `the buyer (terms, finance)`],
          [`Best for`, `any MSME with bills`, `big buyers backing suppliers`],
        ] },
    ]),

    `**Seller's flow (factoring):** the MSME uploads the accepted invoice as a **factoring unit**. The **buyer accepts it on the platform**. **Several banks and NBFCs bid** with their discount rates. The MSME **picks the best bid** and **gets 80% to 90% of the invoice value in T+1**. On the **due date** the buyer **pays the whole amount to the financier**.

**Buyer's flow (reverse factoring):** the buyer uploads the supplier's invoice, chooses the terms and the finance, the MSME **gets paid at once**, and the buyer repays the financier at the end. It helps **new OEMs** that need to prove their credibility to MSME suppliers, and lets the suppliers **sell on credit and still get cash without waiting**.

**Limits to keep in mind.**
- **Confidentiality:** some MSMEs fear that rivals may learn their customers and prices.
- **Recovery:** MSMEs often want to give customers long credit and may not collect within the 45 days (see Week 2, lesson 5).
- **Image:** if customers learn that the MSME discounts its bills, they might think it is short of money.

## Joining a platform, step by step`,

    sk(300, 'From choosing a platform to renewing every year', steps([
      { label: `1. Choose a platform`, desc: `where your buyers and financiers are` },
      { label: `2. Create a login`, desc: `name, entity, PAN, mobile, email` },
      { label: `3. Register`, desc: `forms, KYC, then fee and approval` },
      { label: `4. Upload invoices`, desc: `of reputed customers` },
      { label: `5. Pick a bid`, desc: `cash in T+1; buyer pays on due date` },
      { label: `6. Renew every year`, desc: `fee due by 30 April` },
    ], { y: 28, dy: 46, tw: 250 })),

    `**1. Choose the platform.** Look at its **network of buyers and financiers**, since that decides how fast and how cheaply you get cash. **Go where your main customers already are**: the buyer and the seller **must be on the same platform**, because the buyer has to accept the seller's invoice (or the seller has to confirm the buyer's). Check the **technology and ease of use**: bulk upload of many invoices, **API integration** with your accounts software, a simple screen. Strong platforms save effort. You may register on **more than one platform**.

**2. Create a login.** Open the platform's web portal and choose **New registration**. It usually asks for the **name, entity name and type** (buyer or seller), **mobile, email and PAN**. After this you can fill the online application.

**3. Register.** The papers differ a little between platforms. Typically: the **application form**; a **master agreement on non-judicial stamp paper**; a **bank confirmation letter and a debit mandate form** for the account from which money will be debited (needed by buyers and financiers); and the **KYC of the entity**, its **promoters**, **directors** and **authorised signatories**. Then you **submit the physical documents**, the platform team **verifies** them and sends a **deficiency report**, you **fix the gaps**, you receive **approval**, and you pay the **annual fee**. Only then are you registered.

**4. Upload bills.** Whenever goods are supplied or services rendered and the invoice has gone to the customer, upload it as a **factoring unit**.

**5. Pick a bid.** The counterparty accepts, financiers bid, you **choose the best**, and the financier pays you at the agreed rate; on the due date the buyer pays the financier.

**6. Renew yearly.** The registration is for **one year**. The renewal fee is generally due in **April, by 30 April**.

## Technical terms and key points
- **Maker-checker:** if the seller uploads, the buyer checks; if the buyer uploads, the seller checks.
- A **status tracker page** shows where your onboarding stands. A **tax invoice** means an invoice with GST.
- **Cap rate:** a buyer sets **one**; a seller can set **many**, per buyer and accepted document.
- **Accepted FU:** an invoice that the counterparty has confirmed.
- **Cut-off time:** bids can be accepted only within a stated time, not for ever.
- The **login ID and password** are usually valid for about **30 days**.
- **Discounting is not guaranteed.** It may or may not happen. A factoring unit can be **withdrawn before a bid is accepted**.
- The **operator earns fees** (transaction charges, renewal and onboarding fees), **not interest**, which belongs to the financier.
- **No security** is needed. The invoice is **assigned** to the financier, and **every deal is recorded on CERSAI**.
- Buyers pay on the due date by **auto-debit**. Sellers can only be **MSMEs**.

## Worked example: Kavya's invoice on TReDS
Kavya's masala unit sells ₹12 lakh of spice blends to a large food company on **60 days'** credit. The buyer accepts the invoice on the platform the same day. Three financiers bid (for illustration): **9.5%**, **9.2%** and **9.0%** a year. She picks 9.0%.

| Item | Figure |
|---|---|
| Advance at T+1 (90%) | ₹10.8 lakh |
| Discount at 9% for 60 days on ₹10.8 lakh | ₹10.8 lakh × 9% × 60 ÷ 365 = about **₹16,000** |
| Buyer pays the financier on day 60 | ₹12 lakh |
| What an overdraft at an assumed 12% would have cost for the same time | about ₹21,300 |

She gets cash a day after choosing, owes **nothing to the financier if the buyer does not pay** (without recourse), and has pledged nothing. (How the balance beyond the 90% is settled follows each platform's rules: check.)

## The professional opportunity
Awareness of TReDS among MSMEs is **very low**, they have **little time**, and their papers are scattered with outside advisers. They may need you to **explain the benefits**, **choose the right platform**, **create the login**, **register and upload documents**, and **pay the annual renewal**. Be the **bridge** between NSIC's paper scheme, the MSME and the TReDS platforms. **Track the RBI's approved platforms** and the operators' sites, **learn the information and documents each platform needs**, follow **RBI notifications**, and join **awareness sessions** run through business associations.

**Emerging trends** (the lecture says the Union Budget of 2026 proposes): central public sector enterprises to make **all their MSME purchases through TReDS**; a **government credit guarantee** to back invoice discounting on TReDS; **GeM procurement data to be integrated** with TReDS; and TReDS receivables to be **securitised** like asset-backed securities. Check which of these have become rules.`,

    { analogy: `TReDS is an **exchange with an order book for receivables**: the invoice is the asset, financiers are the market makers who **quote a rate**, and the MSME takes the **best bid**. The **maker-checker** step is a **two-person approval** on a transaction. **Auto-debit on the due date** is a **settlement run**. Registration on CERSAI is a **public ledger** so the same invoice cannot be sold twice. And "without recourse" means the MSME has **transferred the risk**, like selling a position instead of pledging it.` },

    { warn: `Easy mistakes:
- **Choosing a platform your customers are not on.** The buyer must be on it.
- **Uploading an unaccepted invoice.** It cannot be discounted until the counterparty accepts.
- **Expecting discounting every time.** It is not guaranteed.
- **Forgetting the minimum 15 days** left to the due date.
- **Missing the annual renewal** by 30 April.
- **Confusing the discount with an interest-free gift.** The financier's rate is deducted from your advance.
- **Treating the figures here as fixed.** The numbers of MSMEs and platforms, the turnover limit and the trends are as recorded: check the RBI and each platform.` },

    { real: `Take the unit's receivables list and mark every buyer that is a PSU, a government department or a large company above the turnover limit. Then check which TReDS platform each of those buyers is on, and propose the one that covers the most of them. Prepare the registration papers, then upload the first invoice together with the owner so that the owner sees the bids come in live. After that, schedule the renewal date in your diary.` },

    { remember: `- **TReDS** = Trade Receivables electronic Discounting System: **RBI-regulated**, online, **paperless**; MSME sellers, large buyers and financiers on one platform.
- **Benefits:** no collateral, **without recourse**, competitive **auction** rates, **T+1** cash of **80% to 90%**, buyer pays the financier on the due date by auto-debit.
- **Five licensed platforms:** RXIL, M1xchange, Invoicemart, C2Treds, DTX (check names and figures).
- **Buyers:** companies above ₹250 crore (now ₹500 crore), CPSUs, some state PSUs, departments. **Sellers:** MSMEs only. **Financiers:** banks, NBFCs, now insurers too.
- **Factoring** (seller uploads) and **reverse factoring** (buyer uploads). **Minimum 15 days** to the due date.
- **Join:** choose platform → login → register (forms, KYC, stamped agreement, mandate) → upload → pick a bid → **renew by 30 April**.
- **Trends:** CPSEs buying via TReDS, credit guarantee, GeM link, securitisation.` },
  ],
  quiz: [
    { q: `What does "without recourse" mean for an MSME on TReDS?`, o: [`The MSME pays no fees`, `The MSME need not register`, `The financier cannot claim the money back from the MSME if the buyer does not pay`, `The invoice is never discounted`], a: 2, why: `All TReDS deals are without recourse for the MSME seller: the financier bears the buyer's default risk.` },
    { q: `What is the minimum number of days that must remain before an invoice's due date for it to be discounted?`, o: [`7 days`, `15 days`, `30 days`, `60 days`], a: 1, why: `The lecture gives a minimum residual tenor of 15 days.` },
    { q: `Who uploads the invoice in reverse factoring?`, o: [`The financier`, `The RBI`, `The MSME seller`, `The buyer, on behalf of the supplier`], a: 3, why: `In reverse factoring the buyer uploads the supplier's invoice, chooses the terms and the finance, and the MSME confirms.` },
    { q: `Which of these is NOT a source of income for a TReDS operator?`, o: [`Interest income`, `Transaction charges`, `Renewal fees`, `Onboarding fees`], a: 0, why: `Interest is earned by the financier. The operator earns fees: onboarding, renewal and transaction charges.` },
    { q: `Why must the seller and the buyer be on the same TReDS platform?`, o: [`Because the buyer has to accept the invoice on that platform`, `Because the RBI requires one platform per state`, `Because platforms charge a joint fee`, `Because invoices cannot be uploaded twice`], a: 0, why: `A deal needs the counterparty to accept the factoring unit on the platform, so both must be registered there.` },
    { q: `By when is the TReDS annual renewal fee usually due?`, o: [`31 March`, `30 April`, `30 June`, `31 December`], a: 1, why: `The registration is valid for one year and the renewal is generally needed in April, by 30 April.` },
  ],
};
