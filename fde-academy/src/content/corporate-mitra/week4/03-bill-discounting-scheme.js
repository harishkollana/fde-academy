import { sk, flow2 } from '../_kit.js';

export default {
  title: `Bill discounting: getting paid today for a bill due later`,
  goal: `You can explain bill discounting and its kinds, say how NSIC's bill discounting scheme works and who can use it, work out what a seller receives and repays on a discounted invoice, and prepare a client's file.`,
  covers: [`The cash trap of selling on credit`, `What bill discounting is`, `Kinds of bill discounting`, `NSIC's scheme`, `A full worked example`],
  terms: [
    [`Invoice (bill)`, `The document a seller sends to say what the buyer owes for goods or services supplied.`],
    [`Credit period / usance`, `The time the buyer is allowed to pay after receiving the goods. Also called usance when it is written on a bill.`],
    [`Bill discounting`, `Getting most of an unpaid invoice's value in cash today from a financier, who keeps a fee (the discount) and is repaid when the bill falls due.`],
    [`Discount`, `The interest and charges the financier deducts in advance. It is the difference between the face value of the bill and the cash the seller receives.`],
    [`Financier`, `The bank, NBFC or NSIC that gives the money against the bill.`],
    [`Drawee / buyer`, `The party who owes the money on the bill.`],
    [`Recourse`, `The financier's right to go back to the seller for the money if the buyer does not pay.`],
    [`Letter of credit (LC)`, `A promise by the buyer's bank to pay the seller once the documents are in order.`],
    [`Annual credit limit`, `The most that NSIC will have outstanding for one seller at a time, sanctioned for a year and renewable.`],
    [`Penal charge`, `An extra charge on an amount that is overdue.`],
    [`Processing fee`, `A one-time fee charged when a new limit is sanctioned.`],
    [`ECGC`, `Export Credit Guarantee Corporation: the body that insures and supports exports.`],
  ],
  blocks: [
    `## The problem: you sell today, you are paid in three months
A small manufacturer supplies goods to a big buyer: a government department, a public sector company or a well-known firm. The big buyer says "payment in 90 days". The goods are gone, the **money is stuck** in the customer's books, and the small unit still has to **pay wages, buy material and pay interest** today. Small units have **limited capital** and little working capital, so they borrow short-term at **high interest**, and the high interest eats the profit.

## The idea: sell the bill to a financier
**Bill discounting** is short-term finance in which the seller gets payment **before** the due date. The steps:
1. The seller supplies the goods and raises an **invoice** with a credit period.
2. A **financier** (a bank, an NBFC or, here, NSIC) pays the seller **most of the invoice value now**. The lecture says **not more than 90%**.
3. The financier **deducts interest and other charges** in advance. That deduction is the **discount**, and that is how the name arises.
4. At the **end of the credit period**, the buyer pays, and the seller repays the financier.

The financier does not ask for a long loan file about the seller's whole business. It looks mainly at **the bill and the buyer**. That is why a small unit that sells to a strong buyer can raise cash quickly.

## The kinds of bill discounting
The lecture groups them in pairs, and a bill can fall in several pairs at once.`,

    sk(318, 'Five ways of describing a discounting arrangement', [
      { t: 'table', x: 30, y: 44, cols: [`The question`, `One kind`, `The other kind`], colW: [170, 270, 270], rowH: 36, title: `Pick one from each row`,
        rows: [
          [`Who knows?`, `ordinary: all three`, `confidential: buyer unaware`],
          [`How many bills?`, `full turnover: every bill`, `partial: chosen bills only`],
          [`What backs it?`, `clean: no supporting paper`, `guarantee or LC backed`],
          [`If buyer fails?`, `with recourse: seller pays`, `without recourse: costs more`],
          [`How is it done?`, `paper: direct, one lender`, `online: lenders compete`],
        ] },
    ]),

    `- **Ordinary (open) discounting:** the seller, the buyer and the financier all know. In **confidential** discounting the buyer is not told.
- **Full turnover** discounting covers **all the bills of the whole agreed period**, so the seller gets cash continuously (the discount per bill is limited). **Partial turnover** discounting covers **only chosen bills**, which gives the seller more freedom.
- **Clean** (plain) discounting needs **no supporting document**, so the **financier's risk is higher**. **Guarantee-backed** discounting rests on a **bank guarantee**, and **LC-backed** discounting rests on a **letter of credit** issued by the buyer's bank (the lecture says LC-backed is common in international sales). Both lower the financier's risk.
- **With recourse:** if the buyer does not pay, the financier can recover from the **seller**. **Without recourse:** the financier cannot go back to the seller, so it **costs more**.
- **Paper (offline)** discounting is the old way: seller and lender deal directly, and there is usually **no competition** among lenders. **Online** discounting is newer: the **RBI has approved five electronic platforms** (called TReDS, next lesson) made for MSMEs, and several financiers **compete** for each bill.

## NSIC's bill discounting scheme
**NSIC** started the scheme when no one else discounted MSME bills, to give small units **short-term money**. It gives **early payment against bills accepted by the buyer for goods or services supplied to reputed buyers**.

**Who can sell (the MSME):** **manufacturing or service** MSMEs only. **Traders are not eligible.** Check the **Udyam registration**: if the unit is registered as a trader, it cannot use the scheme.

**Who can be the buyer:** central and state **government departments**, **public sector undertakings**, **reputed public and private limited companies**, and **LLPs and partnership firms** (reputed).

**How long a bill can run:** the maximum credit period is **180 days**. The scheme began when units gave up to six months of credit. Since then an income tax amendment has shortened the credit periods that are practical (see Week 2, lesson 5, on the 45-day rule), so most bills are now shorter.

**Security.** NSIC takes a **bank guarantee equal to the assistance**. If there is no bank guarantee and the seller has a **good credit record**, NSIC may accept the **personal guarantee** of the owner, partners or directors (not every MSME gets this). The bank guarantee can be given by the **seller or by the buyer**. A buyer or seller can approach NSIC for an **annual credit limit**; forms and documents are on NSIC's website.

**What it costs** (the lecture's figures; the rates change, so **check NSIC's website**):`,

    `| | Micro unit | Small or medium unit |
|---|---|---|
| Top-rated (SME-1) | about **7.75%** a year | about **8.25%** a year |
| SME-2 rated | add **0.5%** | add **0.5%** |
| SME-3 rated or unrated | add another **0.5%** | add another **0.5%** |
| Penal charge on an overdue bill | **1.25% a quarter**, from the seller | same |
| Processing fee on a new limit | **1%** | **1%** |
| Renewal fee | **0.5%** | **1%** |

The rating is the **SME rating** from Week 4 lesson 2: a better rating means cheaper discounting.

**What NSIC needs.**
- *For approval:* the **assistance and limit** wanted; the **constitution** (partnership, LLP, private limited and so on); **year of establishment**; **GST and PAN**; details of any **sister concerns**; details of each **proprietor, partner or director**; the **nature of business**; **orders from eligible buyers**; and the **security** offered (bank or personal guarantee).
- *Documents:* a **photograph** and **Aadhaar and PAN** of every owner; each owner's **statement of personal assets and liabilities**; the unit's **Udyam, shop and establishment and incorporation certificates and PAN**; **constitutional papers** (partnership deed, LLP deed, or MOA and AOA); for a company, a **board resolution in NSIC's favour**; **address proof and utility bills of both the entity and the owners**; **six months' bank statements**; **conduct reports** from the banks; the **undertaking that the unit and owners are not on the RBI defaulters list**; **CIBIL score** of the owner and **rank** of the entity; the **nature of business and prospects**; the **last audited statements**; **ITRs of the last three years**; **provisional** and **projected** statements; and the **sanction letters** of limits already taken from banks **and NBFCs**, so NSIC can see the unit's total debt.`,

    sk(262, 'The discounting cycle', flow2([
      { label: `Download form,\nsubmit papers`, fill: `blue` },
      { label: `NSIC scrutiny,\npossible visit`, fill: `blue` },
      { label: `Bank guarantee\nsubmitted`, fill: `orange` },
      { label: `Limit sanctioned\nfor a year`, fill: `yellow` },
      { label: `Supply goods;\nbuyer accepts bill`, fill: `green` },
      { label: `Discount the bill;\nrepay when due`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `Each cycle: **supply** goods or services on the agreed credit terms to an eligible buyer, get the **invoice accepted by the buyer**, **submit it for discounting**. NSIC releases the money after **deducting interest and charges**. On or before the due date the seller **pays NSIC back**, and then the next bill can be discounted. The limit is **renewed** when the year ends, and renewal can be repeated.

**Eligibility conditions.**
- A **documented contract and payment agreement** between NSIC and the seller, with a **clear fixed payment date**.
- Both parties **legally registered and operating in India**.
- **Domestic supplies only.** The scheme is **not for exports**; for exports, study the **ECGC**.
- The business should have been operating for **at least three years** before the limit is sanctioned.
- NSIC specifies a **minimum invoice value**.
- A **good credit history** of seller and buyer, and a **valid, recent, undisputed invoice** for a sale that is actually **completed** and **verified by the buyer**.
- The seller's **stability is checked first**, because if the bill is not paid on the due date NSIC comes to the seller.
- **Business and tax registrations and returns** are part of the limit-sanctioning stage.`,

    sk(206, 'The lecture\'s example: a ₹3 crore bill discounted on day 5 of 90', [
      { t: 'box', x: 20, y: 30, w: 440, h: 60, label: `Cash received now: ₹2.65 crore`, fill: `green`, size: 18 },
      { t: 'box', x: 460, y: 30, w: 110, h: 60, label: `Discount`, sub: `₹5 lakh`, fill: `yellow`, size: 16 },
      { t: 'box', x: 570, y: 30, w: 170, h: 60, label: `Held back`, sub: `₹30 lakh`, fill: `blue`, size: 16 },
      { t: 'brace', x: 20, y: 100, w: 550, label: `NSIC advances 90% = ₹2.70 crore, less ₹5 lakh discount` },
      { t: 'note', x: 30, y: 160, w: 700, h: 36, text: `The bill is ₹3 crore. The shaded parts are not to scale: the discount is only about 1.7% of the bill.`, fill: `yellow`, size: 14 },
    ]),

    `## Worked example (from the lecture)
**APL Private Limited** has a ₹5 crore bill discounting limit with NSIC, valid for one year from 1 May 2026, backed by a ₹5 crore bank guarantee.

| Date | What happens |
|---|---|
| 15 May 2026 | APL supplies batteries worth ₹3 crore to the public sector company BHEL on **90 days'** credit. BHEL accepts the bill and the goods |
| 20 May 2026 | APL has to pay wages and buy material, so it submits the bill to NSIC for discounting |
| 20 May | NSIC checks and releases **₹2.65 crore**. 90% of ₹3 crore is ₹2.70 crore, so the **₹5 lakh difference is the discount**: interest for the credit period plus other charges |
| 11 Aug 2026 | BHEL pays APL the full **₹3 crore** |
| 13 Aug 2026 | APL repays NSIC **₹2.70 crore**, the amount NSIC advanced. APL keeps ₹30 lakh |

**Reading the numbers.** APL received ₹2.65 crore on 20 May and ₹3 crore on 11 Aug, and paid back ₹2.70 crore. Net: 2.65 + 3.00 − 2.70 = **₹2.95 crore**, so the **cost of getting cash 83 days early was ₹5 lakh**. As a check, interest on ₹2.70 crore for 83 days (from 20 May to 11 Aug) at 8.25% a year is about ₹5.07 lakh, close to the ₹5 lakh. That is what a bill discount is: **a short loan, with its interest taken out in advance**.

The ₹3 crore bill used up ₹2.70 crore of the ₹5 crore limit. Once APL repaid, that part of the limit became free again for the next bill.

## The professional opportunity
Awareness of this scheme is **low**. MSMEs have **no semi-qualified staff** who understand the document requirements, their papers are **unorganised** (some sit with outside consultants), collecting them takes **coordination**, and owners are busy "firefighting". A Corporate Mitra can:
- **Find the nearest NSIC office**, get the form (from the office or website), and gather the annexures **inside the unit**.
- **Coordinate with the NSIC officer**, and follow up on **verification**.
- When the invoice is ready, **prepare it and submit it for discounting**, and see that the **invoice meets the compliance** (accepted by the buyer, dated, GST-correct).

**Golden tips.** Visit your nearest NSIC branch and its website. The scheme is on the portal: read it carefully. Prepare an enterprise-wise **document list**. Link small units with NSIC's scheme.

**New trends.** Many **banks** now discount bills. **Finance companies** approach units. The RBI has approved **five TReDS platforms**, and **most of the business has moved to these online platforms**. Some manufacturers have their **own finance companies** that offer this credit. TReDS platforms also run **awareness programmes through MSME associations**.`,

    { analogy: `Bill discounting is **selling a receivable**, like **invoice factoring** or a **pre-paid forward**: you hand the right to collect to a third party and take a slightly smaller amount now. **With recourse** is a **refundable sale** (the buyer can send it back if the customer defaults); **without recourse** is **final sale**, so the price is worse. The **annual limit** is a **revolving credit line**: each repaid bill gives the capacity back. The 90% advance is a **haircut** that protects the financier against disputes.` },

    { warn: `Easy mistakes:
- **Calling it a gift.** Bill discounting is borrowing. You repay when the due date comes, whether or not the buyer has paid you (with recourse).
- **Registering as a trader** on Udyam and then applying: traders are excluded.
- **Using an invoice the buyer has not accepted.** NSIC needs an accepted, undisputed bill.
- **Missing the due date.** A penal charge of 1.25% a quarter applies, and it harms the credit record.
- **Expecting the full bill value.** The advance is at most 90%, less the discount.
- **Using the scheme for exports.** It is for domestic supplies.
- **Forgetting the three-year operating history rule.**
- **Quoting rates as fixed.** They depend on the rating and change: check NSIC's website.` },

    { real: `Ask each client: "Who are your three biggest buyers, and how many days do they take to pay?" A unit that sells to PSUs or reputed companies on 60 to 90 days' credit is a natural client for discounting. Map its invoices for the last year, calculate what the early cash would have saved in outside interest, and prepare the NSIC file with the bank guarantee arrangement. Then compare NSIC's cost with a TReDS platform's rate for each bill.` },

    { remember: `- **Bill discounting:** a financier pays a seller most of an unpaid invoice now (not more than **90%**), **deducting interest and charges** (the **discount**), and is repaid at the end of the credit period.
- **Kinds:** ordinary or confidential; full or partial turnover; clean, guarantee-backed or LC-backed; **with** or **without recourse** (without costs more); **paper** or **online**.
- **NSIC scheme:** for **manufacturing and service MSMEs** (not traders), selling to **government, PSUs and reputed companies, LLPs and firms**; bills up to **180 days**; security a **bank guarantee** equal to the assistance (or a personal guarantee for good credit records); **domestic supplies only**; business at least **3 years old**.
- **Charges (as given):** about 7.75% (micro) and 8.25% (small and medium) when top-rated; plus 0.5% for each rating step down; **penal 1.25% a quarter**; **1% processing**; renewal 0.5% or 1%. Check the current rates.
- **Cycle:** form → scrutiny → bank guarantee → annual limit → supply and accepted invoice → discount → repay → repeat.
- **Online alternative:** five RBI-approved **TReDS** platforms.` },
  ],
  quiz: [
    { q: `In bill discounting, what is the discount?`, o: [`The price cut the seller gives the buyer`, `The interest and charges deducted in advance by the financier`, `The GST on the bill`, `A government subsidy`], a: 1, why: `The financier pays the bill's value less its interest and other charges. That deduction is the discount.` },
    { q: `Which MSME is NOT eligible for NSIC's bill discounting scheme?`, o: [`A manufacturing MSME`, `A service MSME`, `A trading MSME`, `A micro manufacturer`], a: 2, why: `Only manufacturing and service MSMEs are eligible. Trading MSMEs are not.` },
    { q: `A seller's ₹3 crore bill is discounted with a 90% advance, and the discount is ₹5 lakh. How much cash does the seller receive?`, o: [`₹2.70 crore`, `₹3 crore`, `₹2.95 crore`, `₹2.65 crore`], a: 3, why: `90% of ₹3 crore is ₹2.70 crore. Less the ₹5 lakh discount, the seller receives ₹2.65 crore.` },
    { q: `What does "without recourse" mean?`, o: [`The financier cannot go back to the seller if the buyer does not pay`, `The seller need not repay`, `The buyer is not told`, `There is no interest`], a: 0, why: `In non-recourse discounting the financier cannot recover from the seller. Because the financier takes the risk, it costs more.` },
    { q: `How many electronic bill discounting platforms has the RBI approved, as the lecture says?`, o: [`Three`, `Four`, `Seven`, `Five`], a: 3, why: `The lecture says the RBI has approved five electronic (TReDS) platforms for MSME bill discounting.` },
    { q: `Why does NSIC check the seller's stability before sanctioning the limit?`, o: [`Because the seller must be a company`, `Because the buyer pays NSIC directly`, `Because if the bill is unpaid on the due date NSIC turns to the seller`, `Because exports are included`], a: 2, why: `The scheme is with recourse: NSIC comes back to the seller on default, so the seller's soundness matters.` },
  ],
};
