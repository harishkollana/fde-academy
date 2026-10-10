import { sk } from '../_kit.js';

const col = (x, fill, items) => items.map((text, i) => ({ t: 'note', x, y: 72 + i * 52, w: 172, h: 44, text, fill, size: 15 }));

export default {
  title: `Choosing the right form of business`,
  goal: `You can name the 15 factors that decide which form of business suits an entrepreneur, and use them to recommend a form for a real client, including when to start simple and move up later.`,
  covers: [`15 deciding factors`, `Money, risk, control, business type`, `Simple to complex: the scale`, `Worked examples`],
  terms: [
    [`Scale of business`, `How big the business is or plans to be: one shop or a chain of outlets.`],
    [`Capital requirement`, `The money needed to start and to keep growing.`],
    [`Deployable funds`, `The spare money the owner is actually ready to put into the business.`],
    [`Debt vs equity`, `Debt is borrowed money you must repay. Equity is money put in by owners, who share profit and loss.`],
    [`Cost of formation`, `The one-time cost (fees, time, paperwork) of setting up the form.`],
    [`Compliance cost`, `The ongoing cost of obeying rules: returns, audits, meetings, records.`],
    [`Pass-through taxation`, `The business pays no tax itself. Its income is added to the owner's income and taxed there.`],
    [`Perpetual succession`, `A company keeps existing when owners die or change. The business has "no end date".`],
    [`Professional management`, `Ownership and day-to-day management are in different hands: owners hire experts to run the business.`],
    [`Startup recognition`, `A government status (from DPIIT) that unlocks tax benefits and support for new, innovative businesses.`],
    [`Equity shareholder`, `An owner of a company who gets a share of the profit in proportion to the shares held.`],
    [`Dissolve`, `To formally close a partnership or firm.`],
  ],
  blocks: [
    `## There is no "best" form, only the best fit
The last four lessons showed ten forms. A first-time entrepreneur will ask: **"Which one should I choose?"** The answer is never "always a company" or "always a proprietorship". It depends on **who the entrepreneur is, how much money is involved and where he wants to go**.

The same factors matter again later: when a business **grows**, it may move to a bigger form. When it **struggles**, it may scale down to a lighter one.

There are **15 factors**. Learn them in **four groups**.`,

    sk(338, 'The 15 factors, in four groups', [
      { t: 'box', x: 14, y: 10, w: 172, h: 48, label: `Money`, fill: `green`, size: 19 },
      { t: 'box', x: 204, y: 10, w: 172, h: 48, label: `Risk and rules`, fill: `red`, size: 19 },
      { t: 'box', x: 394, y: 10, w: 172, h: 48, label: `People and control`, fill: `blue`, size: 17 },
      { t: 'box', x: 584, y: 10, w: 172, h: 48, label: `The business`, fill: `orange`, size: 19 },
      ...col(14, `green`, [`Capital\nneeded`, `Cost of\nformation`, `Surplus funds\nthe owner has`, `Taxation`, `Division\nof profits`]),
      ...col(204, `pink`, [`Degree of\nliability`, `Continuity\nand stability`, `Rules and\ncompliance cost`, `Incentives and\nstartup status`]),
      ...col(394, `blue`, [`Control and\nmanagement`, `Managerial\nskills`, `Flexibility in\ndecisions`, `Transfer of\nownership`]),
      ...col(584, `orange`, [`Nature of\nbusiness`, `Size (scale)\nof business`, `Plans for\nexpansion`]),
    ]),

    `## Group 1: Money
| Factor | What to ask | How it pushes the choice |
|---|---|---|
| **Capital requirement** | How much money does this business need, now and as it grows? | Small needs: proprietorship or partnership. **Huge, repeated needs** (like a motorcycle maker, which keeps raising money for expansion): a **company**, usually public, so it can collect capital from many people. |
| **Deployable funds** | How much can the owner actually put in? | If the business needs more than the owner has, he must **borrow** or **bring in a partner** (see Anil's example below). |
| **Cost of formation** | What does it cost to set up? | **Lowest** for individual and proprietorship. **Highest and slowest** for a public limited company. Many beginners start simple and move up when they succeed. |
| **Taxation** | How is the income taxed? | An **individual or proprietor** has **pass-through** tax: business income is taxed in the owner's hands, and a basic amount is exempt. **Companies, LLPs and partnership firms** are taxed on income from the **first rupee**, and what they pay out to partners or shareholders may be taxed again or exempt. |
| **Division of profits** | Who gets the profit? | Proprietor: **100%**. Partnership: by the **profit-sharing ratio**. Company: **equity shareholders**, in proportion to their shares. |

## Group 2: Risk and rules
| Factor | What to ask | How it pushes the choice |
|---|---|---|
| **Degree of liability** | If the business fails, what can the owner lose? | **Unincorporated:** unlimited. The owner's house and savings can be used. **Company, cooperative, LLP:** limited. An **investor** especially wants limited risk, so companies suit investors. |
| **Continuity and stability** | What happens when the owner dies or leaves? | Proprietorships and partnerships **generally end** with the death or exit of the owner or partner. A **company** is a separate legal entity and continues. Short, temporary ventures can be proprietorships. |
| **Regulation and compliance cost** | How heavy are the rules? | Proprietorship and partnership: **light** rules. Companies and cooperatives: **strict**, with published accounts. Big businesses still choose companies, because **other factors outweigh the cost**. |
| **Incentives and benefits** | Does the form qualify for government support? | Startup recognition goes only to certain forms (see the warning below). |

> **A correction to the lecture on LLP liability.** The lecture says designated partners of an LLP have unlimited liability. Under the LLP Act, **every partner's liability is limited** to the agreed contribution. What is true is that **designated partners carry the legal compliance duties** and can be **penalised personally** if the LLP does not comply, and any partner is personally liable for **his own fraud**. Treat it as extra *exposure*, not unlimited debt.

## Group 3: People and control
| Factor | What to ask | How it pushes the choice |
|---|---|---|
| **Control and management** | Does the owner want to decide everything? | **Individual/proprietor:** full control. **Partnership:** shared control, nobody has all of it. **Company:** ownership and control can be **separate**, with professional managers, and professionals feel more secure in this setup. |
| **Managerial skills** | Can the owner run every function (finance, HR, sales)? | A sole proprietor is rarely an expert in all. As the business gets complex, a **company** with professional management fits better. |
| **Flexibility in decisions** | How fast can he change course? | **Proprietorship and partnership:** very flexible, since decisions sit with one or few people. **Company:** board approvals and bylaws make change slower. |
| **Transferability of ownership** | Can the business be sold or handed over? | **Proprietorship:** hard to transfer. **Partnership:** needs **all partners' consent**. **Company:** shares can be transferred smoothly, and the business continues without disturbance. |

## Group 4: The business itself
| Factor | Example | How it pushes the choice |
|---|---|---|
| **Nature of business** | The neighbourhood *kirana* shop relies on personal trust and a friendly shopkeeper. | Small, personal businesses suit simple forms. |
| **Size (scale)** | A fast-food chain has the same menu and look in thousands of outlets. | Even for the same kind of business, **bigger scale needs a bigger form**. |
| **Plans for expansion** | Will it stay one shop or become a chain? | Choose the form for the **size you will grow into**, not only where you start. |

> **Startup recognition: check it.** The lecture says partnership firms and public companies cannot get startup status. The official DPIIT definition lists **private limited companies, LLPs and registered partnership firms** as eligible entities, while **proprietorships and public limited companies are not**. Rules change, so confirm on the Startup India site before you advise a founder.`,

    sk(268, 'From the simplest form to the most complex: what changes along the way', [
      { t: 'text', x: 30, y: 20, text: `Simple end`, size: 18, bold: true, anchor: `start`, color: `#2f9e44` },
      { t: 'text', x: 30, y: 44, text: `cheap and quick to set up`, size: 14, anchor: `start`, color: `#4a5568` },
      { t: 'text', x: 30, y: 62, text: `light compliance, full control`, size: 14, anchor: `start`, color: `#4a5568` },
      { t: 'text', x: 30, y: 80, text: `unlimited liability, small capital`, size: 14, anchor: `start`, color: `#4a5568` },
      { t: 'text', x: 730, y: 20, text: `Complex end`, size: 18, bold: true, anchor: `end`, color: `#c2410c` },
      { t: 'text', x: 730, y: 44, text: `costly and slower to set up`, size: 14, anchor: `end`, color: `#4a5568` },
      { t: 'text', x: 730, y: 62, text: `heavy compliance, shared control`, size: 14, anchor: `end`, color: `#4a5568` },
      { t: 'text', x: 730, y: 80, text: `limited liability, huge capital`, size: 14, anchor: `end`, color: `#4a5568` },
      { t: 'arrow', x1: 30, y1: 150, x2: 735, y2: 150 },
      ...[[70, `Individual /\nproprietor`], [190, `Partnership\nfirm`], [310, `LLP`], [430, `One Person\nCompany`], [550, `Private\nLimited`], [670, `Public\nLimited`]].flatMap(([x, label], i) => [
        { t: 'circle', x, y: 150, r: 10, solid: true, fill: ['green', 'green', 'yellow', 'yellow', 'orange', 'orange'][i] },
        { t: 'text', x, y: 196, text: label, size: 15, bold: true },
      ]),
      { t: 'text', x: 380, y: 244, text: `A business can start at the left and move right as it grows.`, size: 15, color: `#5c6478` },
    ]),

    { analogy: `Choosing a form is like choosing **software architecture**. A one-person project starts as a **script**: fast, flexible, nothing to maintain, but only you can run it and it dies with your laptop. A product with users needs **services, tests, on-call and access control**: heavier, but it scales and survives people leaving. The skill is not picking the fanciest architecture on day one. It is picking the **lightest form that fits now and knowing when you will have to migrate**.` },

    `## Worked examples
### Anil: ₹1 lakh needed, ₹50,000 available
Anil's business needs **₹1,00,000**, but he is ready to invest only **₹50,000**. He has a **gap of ₹50,000** and two choices.`,

    sk(236, 'Anil has two ways to close the gap', [
      { t: 'box', x: 20, y: 14, w: 210, h: 66, label: `Needs ₹1,00,000`, fill: `blue`, size: 17 },
      { t: 'text', x: 252, y: 47, text: `−`, size: 34 },
      { t: 'box', x: 274, y: 14, w: 210, h: 66, label: `Anil has ₹50,000`, fill: `green`, size: 17 },
      { t: 'text', x: 506, y: 47, text: `=`, size: 34 },
      { t: 'box', x: 528, y: 14, w: 214, h: 66, label: `Gap: ₹50,000`, fill: `red`, size: 18 },
      { t: 'arrow', x1: 600, y1: 84, x2: 220, y2: 142 },
      { t: 'arrow', x1: 660, y1: 84, x2: 570, y2: 142 },
      { t: 'box', x: 40, y: 144, w: 340, h: 72, label: `A: borrow the gap`, sub: `sole proprietorship plus a loan`, fill: `orange` },
      { t: 'box', x: 410, y: 144, w: 340, h: 72, label: `B: bring a partner`, sub: `partnership: the partner adds ₹50,000`, fill: `purple`, size: 18 },
    ]),

    `### Rashmi's boutique, two ways
- **One boutique, her own money, no plan to grow:** a **proprietorship** (light rules, full control, easy to run).
- **Five boutiques now, more cities later:** the scale is large, she will need more capital, managers and a name that outlives her. She should start with a **more complex form** (an **LLP** or a **private limited company**), so the business is ready for the next level.

### A kirana shop vs a motorcycle maker
The kirana runs on **personal trust and a small stock**, so a **proprietorship** fits. The motorcycle maker needs **huge, repeated capital** to build factories and expand worldwide, so it has to be a **company**, and when capital needs are very huge, a **public limited company**.

## A quick decision guide
| If the entrepreneur... | Lean towards |
|---|---|
| is alone, small, wants full control and low cost | Proprietorship |
| has a business needing a little more than his money, and a trusted partner | Partnership firm or LLP |
| wants limited liability and a modest compliance burden | LLP or OPC |
| wants outside investors, a startup status or to grow fast | Private limited company |
| needs very large capital from the public | Public limited company |

Always **talk it through** with the client. A form can be changed later, but the change costs time and money.`,

    { warn: `Do not "decide for" the client from one factor. **One factor sometimes dominates** (for example, huge capital) and sometimes **four or five factors together** decide. Things that are **not** factors: the owner's height, **political stability**, and **availability of raw materials** (these affect the business, but they do not decide its legal form).` },

    { real: `Sit with the client and take the 15 factors as a **questionnaire**: money available, who else is putting money in, risk appetite, how much control he wants, plans for five years, tax position. Then recommend a form and say **why**. Clients trust a reason.` },

    { remember: `- **15 factors** in four groups: **Money** (capital, formation cost, surplus funds, taxation, profit share), **Risk and rules** (liability, continuity, compliance, incentives), **People and control** (control, managerial skills, flexibility, transfer of ownership), **The business** (nature, size, expansion plans).
- Simple forms: **cheap, flexible, full control, unlimited liability, end with the owner**. Complex forms: **costly, rigid, limited liability, perpetual succession, big capital**.
- Proprietors have **pass-through taxation**. Companies, LLPs and firms are **taxed from the first rupee**.
- **Huge capital need → public limited company.**
- A funding gap is closed by **borrowing** or **bringing in a partner**.
- **Not** factors: owner's height, political stability, raw-material availability.
- LLP: all partners have limited liability, but designated partners have extra compliance exposure. Startup recognition covers **private limited, LLP and registered partnership**, not proprietorship or public companies. Check the current rules.` },
  ],
  quiz: [
    { q: `If the capital requirement is very huge, the most suitable form is...`, o: [`Partnership firm`, `Private limited company`, `Public limited company`, `LLP`], a: 2, why: `Only a public limited company can raise very large capital from the public at regular intervals.` },
    { q: `Is the height of the owner a factor in choosing the form of business?`, o: [`Yes`, `No`, `Cannot say`, `Only for companies`], a: 1, why: `The factors are about money, risk, control and the business itself. The owner's height has nothing to do with it.` },
    { q: `"More capital requirement leads to a more complex form of organisation." This statement is...`, o: [`True without any exception`, `True, but there may be exceptions`, `False`, `False, as capital is not a factor`], a: 1, why: `Capital is a major factor and generally pushes towards companies, but other factors can override it.` },
    { q: `Is political stability a factor governing the form of business organisation?`, o: [`True without any exception`, `True but there may be exceptions`, `False`, `Cannot say`], a: 2, why: `It affects the business environment but is not one of the factors that decide the legal form.` },
    { q: `Anil needs ₹1 lakh but will invest only ₹50,000. Which is NOT a way to close the gap?`, o: [`Borrow ₹50,000`, `Bring in a partner for ₹50,000`, `Start a partnership firm`, `Ask the government to pay the gap automatically`], a: 3, why: `He can borrow or take a partner. Subsidies are given under specific schemes, not automatically.` },
    { q: `Which form of business generally ends when the owner dies?`, o: [`Private limited company`, `Public limited company`, `Sole proprietorship`, `All of these`], a: 2, why: `A proprietorship has no separate existence from the owner. A company has perpetual succession.` },
  ],
};
