import { sk, stack } from '../_kit.js';

export default {
  title: `Who and what can be registered on Udyam?`,
  goal: `You can check, for any client, whether the owner can apply, whether the activity is eligible, and whether the numbers fit under the medium ceilings, and you can say what is NOT eligible and why.`,
  covers: [`Who can apply`, `Eligible activities`, `Trading: allowed, with limited benefits`, `What is not eligible`, `One PAN, one registration`],
  terms: [
    [`Eligibility`, `The conditions a business must meet to be allowed to register as an MSME on Udyam.`],
    [`Karta`, `The head of a Hindu Undivided Family (HUF). He or she acts for the family business.`],
    [`Board resolution`, `A written decision of a company's directors, authorising a named person to act, for example to sign the Udyam application.`],
    [`LLP`, `Limited Liability Partnership: a partnership where each partner's liability is limited to the agreed contribution.`],
    [`Cooperative society`, `A business owned and run by its members, registered under the cooperative law.`],
    [`NIC code`, `National Industrial Classification code: a number for every kind of business activity. The Udyam form asks for it.`],
    [`Trading`, `Buying goods and selling them without changing them: a wholesaler or a retail shop.`],
    [`Priority sector lending`, `The RBI rule that makes banks lend a share of their funds to sectors such as MSMEs.`],
    [`Primary agriculture`, `Growing crops or rearing animals. Processing the produce is a different activity.`],
    [`Charitable activity`, `Work done for a cause, not to earn income.`],
    [`EM Part II / UAM`, `The older MSME registrations (Entrepreneurs Memorandum Part II and Udyog Aadhaar Memorandum) that Udyam replaced.`],
    [`Self-declaration`, `The owner's own statement of the facts, accepted without uploading documents.`],
  ],
  blocks: [
    `## Eligibility is a checklist, not a feeling
Before you open the Udyam form you must be sure the client can register at all. Eligibility is **three yes-or-no checks** on three different things:

1. **The owner:** is it a kind of owner or legal form that can apply?
2. **The activity:** is what the business does an eligible activity?
3. **The numbers:** is the investment within ₹125 crore and the turnover within ₹500 crore?

Only after all three pass do you work out the size band (micro, small or medium) using last lesson's tests. The big change of 2020 is behind this: the question is no longer only "what does the business own?" but "what does it do, and how much does it sell?"

## 1. Who can apply
Registration is **PAN-based**. The PAN used is the PAN of the legal form that owns the business, and one person signs for it. (The next lesson explains why that person's **Aadhaar** is needed.)`,

    sk(318, 'Whoever owns the business applies with the PAN of that owner', [
      { t: 'table', x: 85, y: 44, cols: [`Form of business`, `Who applies`, `PAN used`], colW: [200, 200, 180], rowH: 32, title: `Who signs the Udyam application`,
        rows: [
          [`Proprietorship`, `the owner`, `owner's PAN`],
          [`Partnership firm`, `the managing partner`, `firm's PAN`],
          [`HUF`, `the karta`, `HUF's PAN`],
          [`Company`, `an authorised signatory`, `company's PAN`],
          [`LLP`, `a designated partner`, `LLP's PAN`],
          [`Cooperative society`, `authorised person`, `society's PAN`],
          [`Trust or society`, `authorised person`, `trust's PAN`],
        ] },
    ]),

    `A few notes on this table:
- **Partnership firms** can apply whether or not the firm is registered under the Partnership Act.
- **A company** acts through a **board resolution** that names the person who may apply on its behalf. A listed company is eligible too, if it fits under the ceilings.
- **An LLP** is a partnership with a company-like character. Its partners' liability is limited to their contribution, while a proprietor's or an ordinary partner's liability is unlimited.
- **A trust or society** can apply only if it is **engaged in an eligible business activity**. Doing charity alone is not enough.

## 2. Which activities are eligible
The government registers three kinds of activity.

**Manufacturing (goods).** Production, manufacturing or processing: anything that makes a new product, reshapes an existing one, or adds a use to it.

**Services.** Any activity that sells a skill: doctors, lawyers, chartered accountants, company secretaries, cost accountants, management and HR consultants, **Corporate Mitras** themselves, carpenters, painters, cooks and cleaners. **Repair services** (an AC technician, a car service shop) and **IT services** (servicing computers and networks) are in too.

**Trading.** This is the part that changed. Earlier, **pure trading** was left out, because the MSME idea was about **making** things and adding value. Today **wholesale and retail traders are allowed to get a Udyam number**, but with **limited benefits**: mainly **access to bank finance and priority sector lending**. Schemes and subsidies meant for **manufacturing** may not apply to them. A grocery shop, a mobile-phone shop and a wholesale hardware dealer can all register. Check the current notification for exactly which benefits a trader gets.

Whatever the activity, it must fit an **eligible NIC code**. The form has a field for the code, and a code for a banned activity will not pass.`,

    sk(250, 'Three kinds of activity: fully eligible, allowed with limited benefits, and not eligible', [
      { t: 'box', x: 10, y: 12, w: 230, h: 46, label: `Eligible`, fill: `green` },
      { t: 'box', x: 265, y: 12, w: 230, h: 46, label: `Allowed, limited benefits`, fill: `yellow`, size: 16 },
      { t: 'box', x: 520, y: 12, w: 230, h: 46, label: `Not eligible`, fill: `red` },
      { t: 'note', x: 10, y: 72, w: 230, h: 150, text: `Making goods:\nmanufacturing, processing\n\nServices: doctor, CA, lawyer,\nrepairs, IT, consultancy,\ncarpenter, cook, cleaner`, fill: `green`, size: 14 },
      { t: 'note', x: 265, y: 72, w: 230, h: 150, text: `Trading:\nwholesale and retail shops\n\nMainly bank finance and\npriority sector lending;\nnot the manufacturing\nsubsidies`, fill: `yellow`, size: 14 },
      { t: 'note', x: 520, y: 72, w: 230, h: 150, text: `Gambling, anything illegal\nShare-market investing\nOwn property investing\nPlain crop growing\nCharity or personal use`, fill: `red`, size: 14 },
    ]),

    `## 3. What is NOT eligible, and why
Each exclusion has the same logic: **no commercial business activity that adds to the economy**.

| Not eligible | Why |
|---|---|
| **Gambling and anything not allowed by law** | A business must be a legitimate activity |
| **Share-market investing or trading**, daily speculative trades, living on capital gains | It is investing, not running an enterprise that makes goods or gives services |
| **Investing in property for personal reasons** | A personal investment, not a business |
| **Primary agriculture**: growing crops | Left out of MSME. But **processing** farm produce (rice or wheat polishing, flour milling, packing) is eligible |
| **Charitable activity**: for example, unpaid counselling in an NGO or an old-age home | There is no commercial purpose |
| **Personal activity**: cooking only for your own family, growing food only for yourself | Nothing is sold |
| **Personal assets** of an owner | Even though a proprietor or partner has unlimited liability, **non-business assets are not counted** as investment |

Remember lesson 1: plain farming still counts as an *idea* of production, but it is not an activity you can register on Udyam.

## 4. The upper cap and "one PAN, one registration"
- A business whose investment is above **₹125 crore** or whose turnover is above **₹500 crore** is **above medium**, so it is **not eligible** at all.
- One PAN gets **one** Udyam registration, even if it has several units and GSTINs. Add their **investment and turnover together** before checking the ceilings.

**Example from the lecture.** An enterprise has two units. Unit 1: investment ₹1 crore, turnover ₹6 crore. Unit 2: investment ₹1 crore, turnover ₹3 crore. Added together: **₹2 crore** and **₹9 crore**. Both are within the micro ceilings (₹2.5 crore and ₹10 crore), so it is **one micro enterprise**. Judged one by one, you might have called the first unit, with ₹6 crore of turnover, something bigger than it is.`,

    sk(400, 'The eligibility check, in order', [
      ...stack([
        { label: `Is it a real business activity?`, sub: `to earn income, not personal or charitable`, fill: `blue` },
        { label: `Is the activity allowed?`, sub: `goods, services or trade; and legal`, fill: `blue` },
        { label: `Within the medium ceilings?`, sub: `one PAN: add all units together`, fill: `blue` },
        { label: `Eligible: find the size band`, sub: `micro, small or medium`, fill: `green` },
      ], { x: 40, y: 14, w: 380, h: 60, gap: 40, labels: [`yes`, `yes`, `yes`] }),
      { t: 'arrow', x1: 424, y1: 44, x2: 470, y2: 44, color: `#c2410c` }, { t: 'note', x: 474, y: 20, w: 270, h: 50, text: `No: hobby, cooking for yourself,\ncharity work. Not eligible`, fill: `red`, size: 14 },
      { t: 'arrow', x1: 424, y1: 144, x2: 470, y2: 144, color: `#c2410c` }, { t: 'note', x: 474, y: 120, w: 270, h: 50, text: `No: gambling, share trading, own\nproperty investing, plain farming`, fill: `red`, size: 14 },
      { t: 'arrow', x1: 424, y1: 244, x2: 470, y2: 244, color: `#c2410c` }, { t: 'note', x: 474, y: 220, w: 270, h: 50, text: `No: above 125 crore investment or\n500 crore turnover. Not an MSME`, fill: `red`, size: 14 },
    ]),

    { analogy: `Eligibility is **input validation** with three layers. First a **type check** (is the owner a valid kind of entity?). Then an **allowed-values check**, like an enum (is the activity on the allowed list, and its NIC code valid?). Last a **range check** (investment and turnover under the ceilings). Only data that passes all three layers is accepted into the register. Failing early, with the reason, saves you from submitting a form that will be rejected.` },

    `## Practical points
- The classification **changes by itself** when the ITR and GST data change. **No manual renewal.** Registration is generally permanent.
- **Wrong information can lead to cancellation or a penalty.** A self-declaration is trusted, not unverifiable.
- **Older registrations.** Units registered earlier under **EM Part II or Udyog Aadhaar (UAM)** had to **register again on the Udyam portal** from **1 July 2020**, because the test changed from investment only to investment plus turnover. The lecture says the old ones stayed valid until **31 December 2021**; check the notification for the exact position.
- **When the limits were revised in April 2025, nobody had to register again**, because the test was unchanged. The same goes for any upgrade or downgrade of a band: the portal updates it.
- **What you need in hand:** the Aadhaar number, PAN, GSTIN and bank details (next lesson).

## Worked example: five walk-in clients
| Client | What they do | Eligible? | Why |
|---|---|---|---|
| Ramesh | Retail grocery shop | **Yes, limited benefits** | Retail trade is allowed, with bank finance and priority sector lending |
| Dr Kavita | A clinic | **Yes** | A service enterprise |
| Suresh | Buys and sells shares every day | **No** | Share-market trading is investing, not an eligible activity |
| Lata | Grows wheat on 5 acres and sells it | **No** for the farming. **Yes** if she sets up a flour mill and sells packed flour | Primary agriculture is out; processing is in |
| Seva Trust | Runs free tuition classes | **No** for the charity. A separate paid activity could be | A trust must be engaged in an eligible business activity |

If a client has more than one activity, ask for the **main** one: it decides the NIC code.`,

    { warn: `Easy mistakes:
- **Registering a charity or a hobby.** The purpose must be commercial.
- **Telling a trader that all MSME subsidies apply.** Traders get limited benefits.
- **Judging each unit separately** when they share a PAN.
- **Sending a pure farmer to Udyam.** Point them to agriculture schemes instead, or suggest processing if that is a real plan.
- **Choosing the NIC code at random.** It must describe the real activity.
- **Re-registering after the 2025 revision.** It is not needed.` },

    { real: `Keep a one-page **eligibility checklist** with the three questions and the exclusion table. Fill it in with the client and keep it in the file. It protects both of you: if a registration is questioned later, you can show what you checked and what the client declared.` },

    { remember: `- Three checks: **owner**, **activity**, **numbers** (not above **₹125 crore** and **₹500 crore**).
- Registration is **PAN-based**: owner, partner, karta, authorised director or person signs. **One PAN, one registration**; add all units together.
- Eligible: **manufacturing** (production, manufacturing, processing), **services**, and **trading** (retail and wholesale) with **limited benefits**.
- **Not eligible:** illegal activity, share-market investing, personal property investing, **primary farming**, **charitable and personal** activity, personal assets.
- No renewal, classification auto-updates, wrong data can be penalised. Old EM-II and UAM registrations moved to Udyam from **1 July 2020**.` },
  ],
  quiz: [
    { q: `Which of these CAN register on Udyam?`, o: [`A person who trades shares every day`, `A wholesale hardware dealer`, `A farmer who only grows and sells wheat`, `A hobby cook who cooks for the family`], a: 1, why: `Wholesale and retail trading are allowed (with limited benefits). The others are investing, primary farming and personal activity.` },
    { q: `Who applies for a Hindu Undivided Family business?`, o: [`Any adult member`, `The bank manager`, `The oldest woman`, `The karta`], a: 3, why: `The karta, the head of the HUF, acts for the family business.` },
    { q: `What authorises a person to apply on behalf of a company?`, o: [`A board resolution`, `A GST certificate`, `A rent agreement`, `A bank letter`], a: 0, why: `A resolution of the board of directors names the person who may apply.` },
    { q: `What benefits mainly come to a registered retail trader?`, o: [`Manufacturing subsidies`, `Technology upgrade grants`, `Export incentives only`, `Bank finance and priority sector lending`], a: 3, why: `Trading enterprises can register mainly to reach institutional finance and priority sector lending.` },
    { q: `A group has two units with the same PAN: ₹1 crore and ₹1 crore of investment, ₹6 crore and ₹3 crore of turnover. What is the enterprise?`, o: [`Two micro enterprises`, `One micro enterprise (₹2 crore, ₹9 crore)`, `One small enterprise`, `Not eligible`], a: 1, why: `One PAN is one enterprise. The totals ₹2 crore and ₹9 crore are within the micro ceilings.` },
    { q: `Do units registered under the old EM-II or UAM have to re-register when the ceilings are revised in 2025?`, o: [`Yes, every year`, `Yes, every time a ceiling changes`, `No, the test did not change and the portal updates the band`, `Only if turnover is above ₹1 crore`], a: 2, why: `They had to move to Udyam from 1 July 2020. The 2025 revision changed only the ceilings, so nobody re-registers.` },
  ],
};
