import { sk, bar } from '../_kit.js';

export default {
  title: `Measuring investment and turnover the MSME way`,
  goal: `You can work out the investment figure and the turnover figure that the Udyam portal uses: which assets count, what is left out, where the numbers come from for an old and a new unit, and why exports and GST are removed from turnover.`,
  covers: [`What counts as plant and machinery`, `What is left out`, `Written down value vs gross block`, `New unit: self-declaration`, `Turnover without exports and GST`],
  terms: [
    [`Tangible asset`, `An asset you can touch: a machine, a vehicle, a computer. The opposite of an idea or a licence.`],
    [`Supporting infrastructure`, `Things that help a business run but do not themselves make the product: land, building, furniture, safety and pollution equipment.`],
    [`Gross block`, `The original cost of an asset, before any depreciation.`],
    [`Depreciation`, `The part of an asset's cost written off each year because it wears out and ages.`],
    [`Written down value (WDV)`, `Gross block minus the depreciation charged so far. The course calls it the "return down value": that is the speech-to-text version of "written down value".`],
    [`ITR`, `Income Tax Return, filed every year with the Income Tax Department.`],
    [`Self-declaration`, `A statement made by the owner, accepted on trust, with no document checked at that moment.`],
    [`Captive power`, `Electricity that a factory makes for its own use, for example with a diesel generator (DG set).`],
    [`Input tax credit (ITC)`, `GST paid on purchases that a business can set off against the GST it collects, so it does not really bear that GST.`],
    [`Export turnover`, `Sales to customers outside India.`],
    [`Section 7 of the MSME Act`, `The section of the 2006 Act that says what is counted as investment in plant and machinery and lists the items to leave out.`],
    [`Udyam portal`, `The government website where an MSME registers. It can pull your tax data automatically.`],
  ],
  blocks: [
    `## The problem: two numbers must be measured the same way for everyone
Last lesson gave you the table: investment up to ₹2.5 crore and turnover up to ₹10 crore for micro, and so on. But a table is useless if two owners measure "investment" differently. One owner includes his factory building, another leaves it out, and the two end up in different bands. So the government fixes **exactly what to count** and **where to read the number from**.

The guiding idea, in the lecture's words: MSMEs are classified on their **productive or business assets**, not on their **supporting infrastructure**. In other words, on what the unit can *produce*, not on how fancy its building is.

## Investment: what counts
The words "plant and machinery or equipment" **do not have their everyday meaning**. They take the meaning given in the **Income Tax Rules, 1962** (and the course says the same continues under the new income-tax law from 1 April 2026; check the current text). It is **all tangible assets used in the business, except land and building, and furniture and fittings**.

**Counts:** manufacturing machines, production and packaging equipment, **commercial vehicles used in the business**, computers that **run the production** (for example monitoring a machine), and the **installation cost** that is directly tied to a machine, because that is part of bringing it to a working state.

**Left out:** land, the factory building and civil work, office furniture and workstations, interiors, and a residential property. Section 7 of the MSME Act adds more to leave out: **pollution-control equipment**, **research and development equipment**, **industrial safety devices** (a fire extinguisher is the simple example), and some other items such as **bank charges and service charges** on a machinery loan and **technical know-how fees**.

**Captive power** (a DG set, a transformer) is the grey area. It counts only if it is **used entirely for the manufacturing process**. Some power systems running on solar or wind under a state subsidy policy are left out even when captive. The full official list is longer than the lecture's, so **check the current Section 7 notification** for the item in question.`,

    sk(382, 'Count the assets that make the product, leave out the ones that support it', [
      { t: 'box', x: 20, y: 12, w: 340, h: 44, label: `COUNTS: productive assets`, fill: `green` },
      { t: 'box', x: 400, y: 12, w: 340, h: 44, label: `LEFT OUT: supporting items`, fill: `red` },
      { t: 'line', x1: 380, y1: 72, x2: 380, y2: 360, dashed: true },
      { t: 'mark', x: 38, y: 96, ok: true }, { t: 'text', x: 62, y: 96, text: `Production machines`, size: 15, anchor: `start` },
      { t: 'mark', x: 38, y: 134, ok: true }, { t: 'text', x: 62, y: 134, text: `Packaging and testing machines`, size: 15, anchor: `start` },
      { t: 'mark', x: 38, y: 172, ok: true }, { t: 'text', x: 62, y: 172, text: `Installation cost tied to a machine`, size: 15, anchor: `start` },
      { t: 'mark', x: 38, y: 210, ok: true }, { t: 'text', x: 62, y: 210, text: `Computers that run production`, size: 15, anchor: `start` },
      { t: 'mark', x: 38, y: 248, ok: true }, { t: 'text', x: 62, y: 248, text: `Vehicles used in the business`, size: 15, anchor: `start` },
      { t: 'mark', x: 38, y: 286, ok: true }, { t: 'text', x: 62, y: 286, text: `Captive power: only if used\nentirely for production`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 96 }, { t: 'text', x: 442, y: 96, text: `Land`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 134 }, { t: 'text', x: 442, y: 134, text: `Factory building, civil work`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 172 }, { t: 'text', x: 442, y: 172, text: `Furniture, fittings, interiors`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 210 }, { t: 'text', x: 442, y: 210, text: `Pollution control, R&D equipment`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 248 }, { t: 'text', x: 442, y: 248, text: `Safety devices, fire equipment`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 286 }, { t: 'text', x: 442, y: 286, text: `GST on machinery (if credit claimed)`, size: 15, anchor: `start` },
      { t: 'mark', x: 418, y: 324 }, { t: 'text', x: 442, y: 324, text: `Bank charges, know-how fees`, size: 15, anchor: `start` },
    ]),

    `### Worked example: what is the real investment?
A small factory lists its assets in its books:

| Item | Book value | Counts for MSME? |
|---|---|---|
| Manufacturing machines | ₹70 lakh | **Yes** |
| Factory building | ₹40 lakh | No (building) |
| Furniture and fixtures | ₹5 lakh | No (furniture) |
| Pollution-control equipment | ₹10 lakh | No (named in Section 7) |
| **Total in the books** | **₹1.25 crore** | |
| **Investment for MSME** | **₹70 lakh** | |

The books say ₹1.25 crore, but the number that goes into the classification is **₹70 lakh**. Another unit in the lecture has ₹4.24 crore in its books, which would look like a small enterprise, but only ₹1.62 crore of it qualifies: that makes it **micro on investment**. Counting the wrong items can push a unit into the wrong band.

## Where does the investment number come from?
It depends on whether the unit has ever filed an income tax return.

- **Existing unit (ITR filed):** use the **previous year's ITR**. The value comes from the **fixed-asset (depreciation) schedule**, and the figure is the **written down value** of plant and machinery, not the original cost. If the **gross block** is ₹5 crore and depreciation so far is ₹1.5 crore, the WDV is **₹3.5 crore** and that is the figure used.
- **New unit (no ITR yet):** the figure is a **self-declaration** by the promoter, based on the **purchase invoice value** of the machines, new or second hand, **without GST**, because GST on machinery is normally recovered through input tax credit. The government accepts it on **trust**, so the promoter must check every item carefully. This relaxation lasts only **until 31 March of the financial year in which the first ITR is filed**. After that, the ITR is the source.`,

    sk(330, 'Old unit: the portal reads the data. New unit: the owner declares it', [
      { t: 'box', x: 230, y: 14, w: 300, h: 54, label: `Has the unit filed an ITR?`, fill: `yellow` },
      { t: 'arrow', x1: 300, y1: 70, x2: 190, y2: 118, label: `yes`, lx: -22 },
      { t: 'arrow', x1: 460, y1: 70, x2: 570, y2: 118, label: `no (new unit)`, lx: 40 },
      { t: 'box', x: 20, y: 120, w: 340, h: 70, label: `Portal fetches it`, sub: `from ITR, PAN and GST data`, fill: `green` },
      { t: 'box', x: 400, y: 120, w: 340, h: 70, label: `Promoter declares it`, sub: `trust-based, first year only`, fill: `orange` },
      { t: 'note', x: 20, y: 222, w: 340, h: 76, text: `Investment = written down value\nof plant and machinery in the ITR\n(not the gross block)`, fill: `green`, size: 15 },
      { t: 'note', x: 400, y: 222, w: 340, h: 76, text: `Investment = purchase invoice value,\nnew or second hand, without GST\nTurnover = what the owner declares`, fill: `orange`, size: 15 },
    ]),

    { analogy: `The portal's auto-fetch is like **pre-filling a form from a verified API instead of letting the user type**. Once a unit has filed an ITR, the figures come from the tax department's own records, so they are hard to fake and need no typing. A new unit has no record yet, so the portal accepts a **self-declared value** for a short time, like a sign-up where you claim a name before a data source can verify it.` },

    `## Turnover: what counts
**Turnover** is the unit's sales for the year. Two things are removed before it is compared with the table:

1. **Exports** (goods or services sold outside India) are **excluded**, for micro, small and medium alike.
2. **GST collected** is **not part of turnover**: it is the government's money, deposited with it.

So the turnover that counts is **domestic sales, within a state or between states, without GST**. The figures are linked to the **Income Tax Act** and the **GST Act**, so they come from the **ITR and the GSTIN**. For a new unit they are self-declared. The lecture says that PAN and GSTIN became mandatory for Udyam registration after 31 March 2021; some activities exempt from GST have special rules, so check the current rule.

A note on a slip in the lecture: it says once that turnover is "including GST and including exports" and then corrects itself in the same breath. The rule is the one repeated several times and in the recap: **excluding GST and excluding exports**.`,

    sk(236, 'Only domestic sales count: exports and GST are removed', [
      ...bar([
        { v: 4, top: `Delhi 4 cr`, label: `counts`, fill: `green` },
        { v: 2, top: `Maharashtra 2 cr`, label: `counts`, fill: `green`, size: 14 },
        { v: 5, top: `Export to USA 5 cr`, label: `left out`, fill: `grey` },
      ], { x: 20, y: 22, w: 720, h: 46 }),
      { t: 'brace', x: 20, y: 110, w: 393, label: `MSME turnover = 4 + 2 = 6 crore` },
      { t: 'brace', x: 427, y: 110, w: 313, color: `#6b7280`, label: `excluded` },
      { t: 'note', x: 120, y: 184, w: 520, h: 40, text: `GST collected on the sales is also never part of turnover.`, fill: `yellow`, size: 15 },
    ]),

    `**Example from the lecture:** a unit sells ₹4 crore in Delhi, ₹2 crore in Maharashtra and ₹5 crore to the USA, and collects GST on the domestic sales. Delhi and Maharashtra count, the export does not, GST does not. **MSME turnover = ₹6 crore.** In another example the domestic sales were ₹6 crore, exports ₹3 crore and GST ₹90 lakh: again the turnover is ₹6 crore.

**An ITR case:** the fixed-asset schedule shows plant and machinery ₹1.80 crore, land and building ₹2 crore and furniture ₹20 lakh. Only the ₹1.80 crore goes into the classification. (The transcript garbled the furniture and land figures; the point is unchanged.)

**What the portal does for you.** When an existing unit registers on Udyam, the portal **fetches investment and turnover automatically** from the PAN, GST and ITR data. You do not type them. The same data is used later when the band changes. Typing is needed only for a new unit.`,

    { warn: `Easy mistakes:
- **Using the books' total** instead of the qualifying plant and machinery.
- **Using the gross block** instead of the written down value for an existing unit.
- **Leaving GST in** the invoice value of machines and in the sales figure.
- **Counting exports** in turnover.
- **Treating the full list of exclusions as final.** The lecture gives the main ones. Check the current Section 7 notification for odd items such as a transformer or a generator.
- **Assuming the self-declaration lasts for ever.** It ends with the financial year of the first ITR.` },

    { real: `Before you open the Udyam form, ask a client for two things: the **last filed ITR with the fixed-asset schedule**, and for a new unit the **purchase invoices of the machines**. Build the investment figure line by line in a small sheet with a "counts / left out" column, as in the worked example, and keep it in the client file. If the portal ever questions the figure, you can show how you got it.` },

    { remember: `- **Investment** = plant and machinery (goods) or equipment (services): **tangible assets used in making the product**, as in the Income Tax Rules.
- **Left out:** land, building, furniture and fittings, pollution control, R&D equipment, safety devices, bank charges, know-how fees; captive power only if used entirely for production.
- **Existing unit:** investment is the **written down value** from the previous year's ITR. **New unit:** purchase invoice value **without GST**, self-declared until 31 March of the year of the first ITR.
- **Turnover** = domestic sales, **excluding exports and GST**. Read from ITR and GST data.
- The **Udyam portal pulls the data automatically** for units that have filed.` },
  ],
  quiz: [
    { q: `Which of these is included in investment in plant and machinery for MSME classification?`, o: [`A production machine`, `Office furniture`, `The factory building`, `Pollution-control equipment`], a: 0, why: `Production machines are core plant and machinery. Buildings, furniture and pollution control are left out.` },
    { q: `For a unit that has filed ITRs, the investment figure is based on...`, o: [`The loan amount`, `The gross block`, `The owner's guess`, `The written down value in the previous year's ITR`], a: 3, why: `The figure is the written down value of plant and machinery from the fixed-asset schedule.` },
    { q: `A new unit with no ITR has bought machines for ₹50 lakh plus ₹9 lakh GST. What invoice value goes into the declaration?`, o: [`₹59 lakh`, `₹50 lakh`, `₹9 lakh`, `Nothing is declared`], a: 1, why: `GST is excluded because it is normally recovered as input tax credit.` },
    { q: `A unit sold ₹8 crore in India and ₹3 crore abroad, and collected ₹1 crore of GST. What is its MSME turnover?`, o: [`₹12 crore`, `₹11 crore`, `₹9 crore`, `₹8 crore`], a: 3, why: `Exports and GST are both removed, so only the ₹8 crore of domestic sales counts.` },
    { q: `A fire extinguisher and a chimney with pollution-control equipment are...`, o: [`Included, because they protect the machines`, `Left out of investment under Section 7`, `Included only for services`, `Included only in the first year`], a: 1, why: `Industrial safety devices and pollution-control equipment are specifically excluded.` },
    { q: `Until when can a new unit rely on a self-declared investment figure?`, o: [`Until 31 March of the financial year in which it files its first ITR`, `For five years`, `Until it hires 10 staff`, `For ever`], a: 0, why: `After the first ITR is filed, the ITR becomes the source of the figures.` },
  ],
};
