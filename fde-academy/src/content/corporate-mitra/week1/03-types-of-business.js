import { sk } from '../_kit.js';

const leaf = (x, y, w, label, sub, fill) => ({ t: 'box', x, y, w, h: 50, label, sub, fill, size: 17 });

export default {
  title: `Types of business organisations`,
  goal: `You can name the ten forms a business can take in India, tell incorporated from unincorporated, and explain in plain words what "separate legal entity" and "limited liability" mean.`,
  covers: [`Unincorporated forms`, `Incorporated forms`, `Separate legal entity`, `Limited vs unlimited liability`, `Quick comparison`],
  terms: [
    [`Business entity`, `The "thing" that does business and earns profit: a person, a firm or a company.`],
    [`Legal entity / legal person`, `Something the law treats as a person: it can own property, sign contracts, borrow, sue and be sued in its own name. A company is one. A sole trader is not separate from the owner.`],
    [`Incorporated`, `Registered so that the business becomes a legal person separate from its owners. Registration is compulsory.`],
    [`Unincorporated`, `Not a separate legal person. The business and the owner are one in the eyes of the law. Registration is optional or not needed.`],
    [`Liability`, `What you must pay if the business cannot pay its debts. Unlimited liability: your personal property can be used to pay. Limited liability: you can lose only what you put in.`],
    [`Proprietor`, `The single owner of a proprietorship.`],
    [`HUF and Karta`, `Hindu Undivided Family: a family treated as one business unit. The Karta is the head of the family who manages it.`],
    [`Partner`, `One of two or more people who own and run a firm together and share its profit and loss.`],
    [`Shareholder`, `An owner of a company, who holds part of it as "shares".`],
    [`Director`, `A person who manages a company on behalf of the shareholders.`],
    [`Nominee`, `A person named in advance to take over if the sole owner dies or cannot act (required for a one-person company).`],
    [`Cooperative society`, `A group that runs a business for the benefit of its own members, for example a dairy or credit cooperative.`],
  ],
  blocks: [
    `## The first big decision
Before Ravi can register anything, he has to answer a question that sounds simple: **"What kind of business am I?"** He can run it alone, with his brother, with a friend and an investor, or as a company. This choice decides his taxes, his paperwork, **who owns what** and, most important, **what he can lose** if things go wrong.

India has ten common forms. Learn them as **two families**:

- **Unincorporated:** the business is *not* a separate legal person.
- **Incorporated:** the business is registered and *becomes* a separate legal person.`,

    sk(432, 'Ten forms of business, in two families', [
      { t: 'box', x: 255, y: 10, w: 250, h: 44, label: `Business organisations`, fill: `yellow`, size: 18 },
      { t: 'arrow', x1: 300, y1: 56, x2: 190, y2: 78 },
      { t: 'arrow', x1: 460, y1: 56, x2: 570, y2: 78 },
      { t: 'box', x: 30, y: 80, w: 320, h: 50, label: `Unincorporated`, sub: `not a separate legal person`, fill: `orange` },
      { t: 'box', x: 410, y: 80, w: 320, h: 50, label: `Incorporated`, sub: `a separate legal person`, fill: `green` },
      leaf(50, 146, 280, `Individual`, `no business name at all`, `grey`),
      leaf(50, 204, 280, `Proprietorship`, `one owner, a business name`, `grey`),
      leaf(50, 262, 280, `HUF business`, `one family, led by a Karta`, `grey`),
      leaf(50, 320, 280, `Partnership firm`, `two or more partners`, `grey`),
      leaf(50, 378, 280, `AOP / BOI`, `group with no formal firm`, `grey`),
      leaf(430, 146, 280, `LLP`, `limited liability partnership`, `grey`),
      leaf(430, 204, 280, `One Person Company (OPC)`, `one shareholder`, `grey`),
      leaf(430, 262, 280, `Private Limited Company`, `2 to 200 shareholders`, `grey`),
      leaf(430, 320, 280, `Public Limited Company`, `shares offered to the public`, `grey`),
      leaf(430, 378, 280, `Cooperative society`, `run for its members`, `grey`),
    ]),

    `## Family 1: unincorporated forms
In all five, the law sees **no separate person**. If the business owes money, the owner owes it. The owner's **liability is unlimited**: the business debt can be paid from the owner's personal property too.

| Form | Name | Owners | PAN (tax ID) | Registration |
|---|---|---|---|---|
| **Individual** | Often **no separate name** (a street vendor) | 1 person, keeps 100% of profit and loss | The owner's own | Everything in the owner's name |
| **Proprietorship** | Has its own business name, e.g. "Ajay Garg and Associates" | 1 person, 100% | **No separate PAN**: the owner's PAN is used | Other registrations (like GST) can be in the **business name** |
| **HUF business** | Own name, often a family name: "Vaibhav and Sons" | One **family**, led by the **Karta** (head) | **Separate PAN** for the HUF | All registrations in the HUF's name |
| **Partnership firm** | Own name | **Two or more** persons (from different families, or not) | PAN in the **firm's** name | **Optional**, not compulsory. Liability of all partners is unlimited |
| **AOP / BOI** | Own name | A group that joins hands to do business, with **no formal partnership** | PAN in the AOP's name | Not registered anywhere. The **least popular** form, as it has no clear legal backing |

All five are **easy to start and easy to close**. That is their charm, and also their limit: little capital and little room to grow.

> **HUF vs partnership.** Both have many people. In an HUF they all belong to **one family**. If the people come from different families, it is a partnership.`,

    `## Family 2: incorporated forms
Each of these is **registered**, and registration is **compulsory**. Once registered, the business is a **separate legal entity** from its owners.

| Form | Law | Owners | Key rules |
|---|---|---|---|
| **LLP** | LLP Act, 2008 | Partners | Compulsory registration. Partners' liability is **limited**. Some partners are **designated partners** who carry the legal duties and need a **DIN** (a number issued by the government for people who run a registered business). |
| **OPC** | Companies Act, 2013 | **One** shareholder | Liability of the promoter is **limited**. A **nominee** must be named in case the owner dies or cannot act. |
| **Private Limited** | Companies Act, 2013 | **2 to 200** shareholders | Liability limited. Shares **cannot be freely sold** or offered to the public. At least **2 directors**. |
| **Public Limited** | Companies Act, 2013 | **At least 7**, no upper limit | Liability limited. **Can offer shares to the public.** At least **3 directors**. |
| **Cooperative society** | Cooperative Societies Act (state-wise) | Members, usually **at least 10** (varies by state) | Liability limited. Works for the **benefit of its members**. |

Compared with a partnership or proprietorship, an incorporated form costs **more** to start and to close, and has more compliance. In return it can raise **big capital** and **grow**.

> **Cooperative society is not just "society".** A "society" in everyday law is for a **charitable** cause. A **cooperative society** exists for the **money benefit of its members**. The course also notes that cooperatives were recently brought into the definition of "startup". Check the current Startup India rules before telling a client.`,

    { analogy: `**Unincorporated = running the service under your own personal account.** Any bill, any outage, any lawsuit lands on *you*. **Incorporated = a separate tenant with its own credentials and billing.** If the tenant goes bankrupt, your personal account is not touched. The "blast radius" of a failure is limited to what you deposited.` },

    sk(330, 'Liability: how far can a business debt reach?', [
      { t: 'text', x: 190, y: 22, text: `Unincorporated`, size: 20, bold: true, color: `#c2410c` },
      { t: 'text', x: 570, y: 22, text: `Incorporated (company, LLP...)`, size: 20, bold: true, color: `#2f9e44` },
      { t: 'line', x1: 380, y1: 40, x2: 380, y2: 316, dashed: true },
      { t: 'box', x: 40, y: 60, w: 300, h: 58, label: `Business owes ₹10 lakh`, fill: `red`, size: 18 },
      { t: 'arrow', x1: 190, y1: 120, x2: 190, y2: 170, label: `can be recovered from`, lx: 90 },
      { t: 'box', x: 40, y: 172, w: 300, h: 70, label: `Owner's own house,\nsavings, car`, fill: `orange`, size: 17 },
      { t: 'text', x: 190, y: 276, text: `One person. Personal property is at risk.`, size: 15, color: `#5c6478` },
      { t: 'box', x: 420, y: 60, w: 300, h: 58, label: `Company owes ₹10 lakh`, fill: `red`, size: 18 },
      { t: 'line', x1: 420, y1: 156, x2: 720, y2: 156, color: `#1f2a44` },
      { t: 'line', x1: 420, y1: 162, x2: 720, y2: 162, color: `#1f2a44` },
      { t: 'text', x: 570, y: 142, text: `separate legal person: a wall`, size: 15, color: `#5c6478` },
      { t: 'box', x: 420, y: 172, w: 300, h: 70, label: `Owner's own house,\nsavings, car`, fill: `green`, size: 17 },
      { t: 'mark', x: 700, y: 208, ok: true },
      { t: 'text', x: 570, y: 276, text: `Owner loses at most what was put into the company.`, size: 15, color: `#5c6478` },
    ]),

    `## Incorporated vs unincorporated: the five differences
| Point | Unincorporated | Incorporated |
|---|---|---|
| **Separate from its owners?** | No | **Yes**, a separate legal entity |
| **Owner's liability** | **Unlimited** | **Limited** (to what was put in) |
| **Growth potential** | Low: little capital can be gathered | **High** |
| **Capital** | Limited to what a few people can put in | Can be **huge** (many shareholders, banks, investors) |
| **Starting and closing** | Easy and cheap | Costlier and more formal |

## Worked example: where does Ravi fit?
| If Ravi... | A sensible starting form |
|---|---|
| runs a small unit alone, wants the least paperwork | **Proprietorship** |
| starts with his father and brother and the whole family runs it as one unit | **HUF** business |
| starts with his brother as two equal owners | **Partnership firm** or **LLP** |
| starts with a friend and they split profit 50-50 | **Partnership firm** or **LLP** |
| wants the owner's house protected, with a small team | **LLP** or **Private Limited** |
| is alone but wants a company's protection | **OPC** |
| plans to bring in investors and later raise public money | **Private Limited**, then possibly **Public Limited** |

Weeks 1 and 2 of the course go through each form in detail: how to register it, the cost, the documents.`,

    { warn: `Two traps for beginners:
- **"Registration" does not mean "incorporation".** A proprietorship may take a GST or Udyam registration, but it is still **not** a separate legal person. Incorporation means the special registration that **creates** a legal person (company, LLP).
- **"Limited liability" is not "no liability".** In a company the owner risks only the money put in, but directors can still be personally responsible for their own fraud or for some legal duties.` },

    { real: `A client will say, "Make me a company." Your first reply should be questions, not forms: **How many owners? How much money is coming in, and from whom? Who bears the risk? Do you want outside investors later?** The answers choose the form.` },

    { remember: `- Two families: **unincorporated** (individual, proprietorship, HUF, partnership firm, AOP/BOI) and **incorporated** (LLP, OPC, private limited, public limited, cooperative society).
- Unincorporated: **no separate legal person**, **unlimited liability**, easy start and closure, limited capital.
- Incorporated: **separate legal entity**, **limited liability**, bigger capital and growth, **higher cost** to start and close.
- Proprietorship uses the **owner's PAN**; HUF, partnership and AOP have their **own PAN**. Partnership registration is **optional**.
- Minimums: **private limited 2 shareholders and 2 directors**; **public limited 7 shareholders and 3 directors**; **OPC 1 shareholder plus a nominee**; **cooperative society usually 10 members**.
- LLP: LLP Act **2008**. OPC, private and public limited: **Companies Act 2013**.` },
  ],
  quiz: [
    { q: `In which form is the identity of the owner and the business the same, often with no business name at all?`, o: [`Proprietorship`, `One person company`, `HUF business`, `Individual business`], a: 3, why: `An individual business (like a street vendor) has no separate name or identity. A proprietorship usually has a business name even though it is not a separate legal person.` },
    { q: `Which form cannot have a non-family member as co-owner?`, o: [`Proprietorship`, `One person company`, `HUF business`, `Partnership firm`], a: 2, why: `An HUF business is owned by one family and led by the Karta. People from outside the family cannot be co-owners.` },
    { q: `True or false: registration of a partnership firm is not compulsory.`, o: [`True`, `False`, `Cannot say`, `Only compulsory above 1 crore turnover`], a: 0, why: `A partnership firm may register, but registration is optional.` },
    { q: `What is the minimum number of shareholders in a private limited company?`, o: [`1`, `7`, `10`, `2`], a: 3, why: `A private limited company needs at least 2 shareholders (up to 200) and at least 2 directors.` },
    { q: `What is the usual minimum number of members of a cooperative society?`, o: [`1`, `7`, `10`, `2`], a: 2, why: `The number varies by state, but in most states it is 10.` },
    { q: `Which statement about incorporated businesses is right?`, o: [`They are not separate from the owners`, `Owner liability is unlimited`, `They are cheaper to start than a proprietorship`, `They are a separate legal entity with limited liability`], a: 3, why: `Incorporation creates a separate legal person, and the owner's liability is limited to what was put in.` },
  ],
};
