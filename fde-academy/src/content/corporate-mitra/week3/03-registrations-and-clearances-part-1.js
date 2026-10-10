import { sk, flow2 } from '../_kit.js';

export default {
  title: `Registrations and clearances, part 1: choosing and registering the business entity`,
  goal: `You can name the six layers of registration a new unit goes through, choose between proprietorship, partnership, LLP and company for a client, and list the steps to register a partnership firm, an LLP and a company.`,
  covers: [`The six layers of clearances`, `Choosing the entity`, `Proprietorship and partnership`, `Registering an LLP`, `Incorporating a company`],
  terms: [
    [`Business entity`, `The legal form under which a business is run: proprietorship, partnership, LLP or company.`],
    [`Separate legal entity`, `A business that the law treats as a person of its own: it can own assets, sue and be sued in its own name. LLPs and companies are; proprietorships and partnerships are not.`],
    [`Partnership deed`, `The written agreement among partners: capital, profit shares, duties.`],
    [`Registrar of Firms`, `The state office with which a partnership firm can be registered. It is usually part of the state's revenue or stamps department.`],
    [`Mutual agency`, `The rule that each partner is the agent of the others: what one partner does for the firm binds all.`],
    [`DSC`, `Digital Signature Certificate: an electronic signature used to sign online forms.`],
    [`DIN`, `Director Identification Number: a unique ID for a director or designated partner, applied for online.`],
    [`SPICe+`, `The single online form of the Ministry of Corporate Affairs for incorporating a company (with PAN, TAN and other registrations offered along with it).`],
    [`MOA and AOA`, `Memorandum of Association (what the company may do) and Articles of Association (its internal rules).`],
    [`Certificate of incorporation`, `The proof that a company or LLP legally exists, issued by the Registrar.`],
    [`Registered office`, `The company's official address in India, with proof such as a rent agreement and the owner's no-objection letter.`],
    [`INC-20A`, `The declaration a new company files to say it has received the minimum money from its subscribers and can start business.`],
  ],
  blocks: [
    `## Six layers, not one registration
A client who says "I want to start a business" is really starting a **stack of registrations**. The lecture lists them. Almost every unit needs the first layer and the third; the others depend on the **kind of industry, the place and the size**.`,

    sk(380, 'Six layers of registration and clearance for a new unit', [
      ...[
        [`1. Business entity`, `Proprietorship, partnership, LLP or company: who owns it`, `blue`],
        [`2. Tax registrations`, `PAN, TAN, GST, professional tax`, `green`],
        [`3. MSME (Udyam)`, `size band and access to schemes (Week 2)`, `orange`],
        [`4. Industry and labour`, `factory licence, labour laws, PF, ESIC`, `yellow`],
        [`5. Sector and place`, `FSSAI, pollution, fire, municipal, shop and establishment`, `purple`],
        [`6. Quality marks`, `ISO, ZED and others (next lesson)`, `teal`],
      ].flatMap(([a, b, f], i) => [
        { t: 'box', x: 14, y: 14 + i * 58, w: 230, h: 46, label: a, fill: f, size: 16 },
        { t: 'note', x: 262, y: 14 + i * 58, w: 484, h: 46, text: b, fill: f, size: 15 },
      ]),
    ]),

    `This lesson covers **layer 1**, and touches the tax registrations that follow it. The next lesson covers layers 2, 4, 5 and 6 in more detail.

## Choosing the business entity
Before registering anything, decide **which form** the business will take. The lecture gives the factors: the **nature of the business, its size, the type of risk, the owner's appetite for risk and the owner's managerial ability**. The comparison below repeats Week 1 in short form (see lessons 3 to 7 of Week 1).

| Form | Good for | Main weakness |
|---|---|---|
| **Sole proprietorship** | A small, simple unit run by one person. Very flexible, easy to start, easy to close. The owner keeps all the profit | **Unlimited liability**: losses can eat into personal assets. One person must do everything, so it stays small |
| **Partnership firm** | Two or more people who pool capital, divide the work and share the risk | **Friction** between partners. **Mutual agency**: one partner can bind all. Unlimited liability |
| **LLP** | A partnership that wants **limited liability** and a simple structure | More formal: online registration, annual filings |
| **Company** (OPC, private, public) | A business that wants to **grow, raise outside money** and keep the owners' liability limited | The most compliance. Public companies are for those who wish to raise funds from the public |

## 1. Sole proprietorship: nothing to register
A proprietor trades in his **own name**, or a **trade name** such as "S Kumar Enterprises" or "S Kumar General Store". The business has **no separate legal existence**, so there is **no entity registration**. **The individual's PAN is the business's PAN.** Taxes follow: **GST** if turnover crosses the limit (₹40 lakh for goods, ₹20 lakh for services, as the lecture gives it), and income tax on the owner's income. Some products need their own **licence** (a chemist shop, a factory), but not the entity itself.

## 2. Partnership firm: register it, although the law does not force you
A partnership exists under the **Partnership Act, 1932**. Its pluses are more capital, shared work, specialisation and shared risk. Its minuses are **friction** (ego and coordination), and **mutual agency**: one partner can borrow for the firm without telling the others, and an outsider can then sue the **firm and every partner**.

**Registration of a firm is not compulsory, but it is advisable.** A registered firm can **sue outsiders** to recover money or supplies, and it is easier to deal with because it looks more credible. The steps:
1. Prepare the **partnership deed** on **stamp paper**.
2. Get it **notarised or registered**.
3. Submit the application and the deed to the **Registrar of Firms** of the area where the **principal place of business** will be.
4. Bring the **KYC of every partner** (Aadhaar, PAN) and **two witnesses with their KYC**, who sign that the deed was signed and registered in their presence.
5. Pay the **small registration fee**.
6. Receive the **certificate of registration**. Then open a **bank account**, apply for **PAN**, and take **GST** registration if turnover will pass the limit.`,

    sk(266, 'What each form needs, and how long the course says it takes', [
      { t: 'table', x: 15, y: 44, cols: [`Entity`, `Own identity?`, `Register where`, `Time taken`], colW: [170, 140, 270, 150], rowH: 36, title: `Registering each form of business`,
        rows: [
          [`Proprietorship`, `no`, `none (PAN; GST if over limit)`, `-`],
          [`Partnership firm`, `no`, `Registrar of Firms (optional)`, `-`],
          [`LLP`, `yes`, `MCA, fully online`, `1 to 2 weeks`],
          [`Company`, `yes`, `MCA, SPICe+, online`, `10 to 15 days`],
        ] },
      { t: 'text', x: 380, y: 236, text: `MCA = Ministry of Corporate Affairs. Times are the lecture's estimates.`, size: 14, color: `#4a5568` },
    ]),

    `## 3. LLP: registered online with the Ministry of Corporate Affairs
An **LLP** is registered under the **LLP Act, 2008**. The big gain is that the **partners' liability is limited to the capital they put in**. The LLP's assets are the LLP's, its debts are the LLP's, and a heavy loss means the LLP's assets are sold, not the partners' personal ones. (Week 1 explains the rule: every partner's liability is limited; the **designated partners** carry the compliance duties.) It is also a **separate legal entity**: it can own assets, hold a bank account and employ people.

The lecture lists about five steps, and the whole thing takes **one to two weeks**:
1. Get a **digital signature certificate (DSC)** for each designated partner.
2. Get a **director identification number (DIN)** for each designated partner. The speech uses the older name "DPIN". You apply online with your **KYC** and a fee.
3. **Reserve the name.** The name must **end with "LLP"**, for example "S Kumar Enterprises LLP".
4. **Prepare the LLP agreement**: each partner's capital, **profit-sharing ratio**, who the designated partners are, and any remuneration.
5. **File the incorporation forms** with the LLP agreement. The Registrar issues the **certificate of registration**, and the LLP now exists in law.

## 4. Company: online, with a single form
A company is formed on the **MCA portal**. First choose the type: **one person company**, **private limited** or **public limited**, according to the size of the operation and how much money will be raised from the market. A standard private limited company takes about **10 to 15 days**, and uses the **SPICe+** form, which can also apply for PAN, TAN, GST, EPFO and ESIC along with it.`,

    sk(262, 'Incorporating a company, step by step', flow2([
      { label: `Digital signature\nfor each director`, fill: `blue` },
      { label: `DIN for each\ndirector`, fill: `blue` },
      { label: `Name approved\nby the Registrar`, fill: `yellow` },
      { label: `File SPICe+ with\nMOA and AOA`, fill: `yellow` },
      { label: `Certificate of\nincorporation`, fill: `green` },
      { label: `Bank account,\nINC-20A filed`, fill: `green` },
    ], { y: 14, h: 76, rowGap: 56, gap: 70, max: 17, label: `then` })),

    `**What the company must have in place:**
- **A DSC and a DIN** for every director.
- **At least one director who is an Indian resident**, meaning one who has stayed in India for **182 days or more** in the year (the lecture says "100 years" and "82 days" through speech-to-text slips).
- A **registered office**: a physical address in India, with a **proof of ownership or a utility bill, or a rent agreement along with the owner's no-objection letter (NOC)**.
- An **approved name**. The registrar approves it only if it is not like the name of an existing company. It must end with **Limited** or **Private Limited** (or **OPC**).
- The **MOA and AOA** uploaded with the SPICe+ form.

**After the certificate of incorporation arrives:** a new legal person exists. Open a **bank account** with the certificate, PAN and address proof. The subscribers **deposit the paid-up capital**, and the company files **INC-20A**, the declaration that lets it **start business**. Then it takes **PAN and TAN** (if not already given with SPICe+), **GST**, **EPFO, ESIC** and any state tax registrations.

## Worked example: which form for whom?
| Client | Likely choice | Why |
|---|---|---|
| **Meena**, a lone tailor | **Proprietorship** | Small, simple, no entity registration. Her own PAN is enough |
| **Two friends** starting a snack shop | **Partnership**, registered | Pooled capital, shared work. Registration gives the right to sue for dues |
| **Ravi's** biscuit unit, now with 25 staff and bank loans | **LLP** or **private limited company** | Limited liability is now worth the extra compliance |
| A group that wants to **bring in outside investors** | **Private limited company** | Shares can be issued to investors; liability is limited |
| A venture that wants to **raise money from the public** | **Public company** | The only form that may invite the public to subscribe |`,

    { analogy: `Think of the entity as a **runtime environment**. A proprietorship is **running as root on your own laptop**: easy, but anything that breaks takes your whole machine with it. A company or an LLP is a **container**: the business runs in its own sandbox, and a crash does not take the host (your personal assets) down. The cost of the container is setup and ongoing maintenance, which is the compliance. A partnership is **two people sharing one root account**: fast, but anyone can run any command.` },

    { warn: `Easy mistakes:
- **Believing partnership registration is compulsory.** It is optional, but without it the firm cannot sue outsiders for its dues.
- **Forgetting that a registered firm is still not a separate entity.** The partners' liability stays unlimited.
- **Starting an LLP or company and then keeping money in the owner's personal account.** The money belongs to the entity.
- **Skipping the DSC and DIN** until the last day. They come first.
- **Using the wrong name ending.** An LLP ends with LLP; a private company ends with Private Limited.
- **Forgetting INC-20A**, the declaration that lets a company start business.
- **Quoting the number of days** (10 to 15, 1 to 2 weeks) as a promise. They are estimates; the portal and any queries decide.` },

    { real: `Make a **one-page chooser** for first meetings: five questions (How big will it be in 3 years? How many owners? Will outside investors come? How much personal risk can you take? Who will handle compliance?) and the likely form for each answer, with the cost and time of registering it. The client leaves knowing why you are suggesting a form, not just which one.` },

    { remember: `- **Six layers:** entity, tax, MSME (Udyam), industry and labour, sector and place, quality marks.
- **Choose the form by** nature, size, risk, risk appetite and management ability.
- **Proprietorship:** no entity registration; individual's PAN; unlimited liability.
- **Partnership:** deed on stamp paper, **Registrar of Firms**, two witnesses with KYC; registration optional but advisable; mutual agency; unlimited liability.
- **LLP:** DSC, DIN, name ending LLP, LLP agreement, online forms; **limited liability**; separate entity; about 1 to 2 weeks.
- **Company:** DSC, DIN, approved name, **SPICe+** with MOA and AOA; one resident director (182 days); registered office with proof; certificate, bank account, **INC-20A**; about 10 to 15 days.` },
  ],
  quiz: [
    { q: `Which form of business has no separate legal existence and needs no entity registration?`, o: [`Sole proprietorship`, `Private limited company`, `LLP`, `Public company`], a: 0, why: `A proprietor trades in his own name, so the business is not separate from him and needs no entity registration. His PAN is the business's PAN.` },
    { q: `Is registration of a partnership firm compulsory?`, o: [`Yes, within 30 days`, `No, but a registered firm can sue outsiders and is more credible`, `Yes, for all firms with a bank account`, `No, and it makes no difference`], a: 1, why: `It is not compulsory, but a registered firm can sue outsiders to recover its dues and looks more credible.` },
    { q: `What does "mutual agency" among partners mean?`, o: [`Partners can never borrow`, `The firm has no liability`, `Only the senior partner signs`, `Each partner is the agent of the others and can bind the firm`], a: 3, why: `One partner can borrow or contract for the firm without telling the others, and an outsider can then sue the firm and every partner.` },
    { q: `What must come first when forming an LLP or a company online?`, o: [`The bank account`, `The GST number`, `A digital signature certificate and a DIN for the directors or designated partners`, `The balance sheet`], a: 2, why: `The DSC lets the person sign online and the DIN identifies the director or designated partner. They come before the incorporation forms.` },
    { q: `How long must at least one director of a company have stayed in India during the year?`, o: [`30 days`, `91 days`, `182 days or more`, `300 days`], a: 2, why: `At least one director must be an Indian resident, meaning one who has stayed in India for 182 days or more in the year.` },
    { q: `What lets a newly incorporated company start business after the capital is deposited?`, o: [`Form INC-20A`, `The PAN`, `The GST number`, `The Udyam certificate`], a: 0, why: `INC-20A is the declaration that the subscribers have deposited the paid-up capital and the company may begin business.` },
  ],
};
