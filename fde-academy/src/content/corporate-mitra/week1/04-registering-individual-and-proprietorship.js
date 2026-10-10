import { sk, flow2, steps } from '../_kit.js';

export default {
  title: `Registering an individual or a proprietorship`,
  goal: `You can list the registrations a single-owner business can take, walk a client through Udyam registration step by step, and explain how trademark registration works.`,
  covers: [`Udyam registration (free)`, `Udyam Assist for informal units`, `Shops and Establishment registration`, `Trademark registration and trademark agent`, `TM vs registered mark`],
  terms: [
    [`Registration`, `Telling the government that your business exists and getting a certificate or number in return. Each registration has its own office and purpose.`],
    [`Aadhaar`, `The 12-digit national ID number issued to residents of India. Used to verify identity with an OTP sent to the linked mobile.`],
    [`OTP`, `One-Time Password. A short code sent to your mobile or email to prove it is really you.`],
    [`URN`, `Udyam Registration Number: the unique number you get after registering on Udyam. The certificate is downloaded using it.`],
    [`GSTIN`, `GST Identification Number: the 15-character ID of a business registered for GST.`],
    [`IME`, `Informal Micro Enterprise: a tiny business with no PAN or GST, such as a street tea stall.`],
    [`Designated agency`, `A bank, small finance bank, NBFC or micro-finance institution authorised by the Ministry to register IMEs on Udyam Assist.`],
    [`KYC`, `Know Your Customer: the identity and address documents a bank collects before opening an account.`],
    [`Shops and Establishment Act`, `A state law that regulates shops and offices: working hours, holidays, employees. Businesses register with the state labour department.`],
    [`Trademark`, `A word, name, logo or sign that tells customers whose goods or services they are buying. Registering it stops others from copying it.`],
    [`Trademark class`, `Trademarks are registered for a category of goods or services (there are 45 classes). You choose the class that fits your product.`],
    [`Digital Signature Certificate (DSC)`, `An electronic ID-card for signing online documents. Trademark filing needs a Class 3 DSC.`],
    [`Opposition`, `A window in which anyone can object to a trademark that has been published for registration.`],
  ],
  blocks: [
    `## Where this fits
In the last lesson Ravi chose a form for his business. Now he has to **register** it. This lesson covers the two simplest single-owner forms:

- **Individual business:** the owner and the business are the same. Often no separate name (a street vendor).
- **Proprietorship:** one owner, but the business has a **name of its own**, such as "Ajay Garg and Associates".

Both are **unincorporated**, so there is no company-style registration. But there are **three useful registrations** that apply to them. All three are things a Corporate Mitra can help with.

| Registration | What it gives | Cost |
|---|---|---|
| **Udyam** | Official MSME status and access to schemes | **Free** |
| **Shops and Establishment** | Permission to run a shop or office under state law | State fee |
| **Trademark** (proprietorship, optional) | Legal protection for the business name or logo | Government fee |

Tax registration is simple here: a proprietor uses **his own PAN**. No separate PAN is needed for the proprietorship. Only the owner has one. (Other registrations, such as GST, can be in the business name.)

## 1. Udyam registration
**Udyam** is the government's registration for MSMEs. It is the first one a Corporate Mitra will help with, because it unlocks schemes (loans, subsidies, protection against late payments). It costs **nothing** to register.

**Which route depends on what the owner has:**
- Owner has a **PAN** (and a **GSTIN** if GST applies) → register on the **Udyam portal**, udyamregistration.gov.in. This is *your* work as a Corporate Mitra.
- Owner has **no PAN and no GST** (an informal micro enterprise) → registration goes through **Udyam Assist** and a **bank**. The owner cannot do it alone and neither can you. There is no professional opportunity here, but you must know the process so you can guide the owner to the bank.`,

    sk(420, 'Udyam registration on the main portal, step by step', steps([
      { label: `Open the portal`, desc: `udyamregistration.gov.in, choose "For New Entrepreneurs"` },
      { label: `Aadhaar and OTP`, desc: `enter the owner's Aadhaar, validate the OTP` },
      { label: `PAN details`, desc: `enter PAN, verified against the tax database` },
      { label: `Business details`, desc: `name, address, bank account, start date` },
      { label: `Type of activity`, desc: `manufacturing, service or trading` },
      { label: `People, money`, desc: `employees, investment, expected turnover` },
      { label: `GST details`, desc: `add the GSTIN if the business has one` },
      { label: `Submit and verify`, desc: `final OTP, get the URN` },
      { label: `Download certificate`, desc: `from the portal, using the URN` },
    ], { x: 36, y: 26, dy: 46, tw: 215 })),

    `**What to put in the form for an individual business:**
- **Enterprise name:** the owner's own name (there is no separate business name).
- **Bank account:** the owner's own account, as the business has none of its own.
- **Employees:** ask honestly. Most individual businesses have none, some have one or two.
- **Investment:** the actual amount put into plant and machinery.
- **Turnover:** for a **brand-new** business there is no history. Ask the owner for the **sales he is aiming for in year one** and write that estimate.

**Reading the certificate.** The Udyam certificate has the **Government of India logo** (top left), the **Ministry of MSME logo** (top right) and a **QR code** at the bottom. Anyone who needs to rely on it can scan the QR code to check that it is genuine. Nowadays the details are visible only after an OTP.

## 2. Udyam Assist (informal micro enterprises)
Think of a pavement tea shop. No PAN, no GST, no address proof. Udyam registration is out of reach, but the owner probably has a **bank account**, maybe a **Jan Dhan** account, which the bank opened without a PAN. With that account he can still be registered, **through the bank**.

| | Details |
|---|---|
| **Who registers** | The bank, small finance bank, NBFC or micro-finance institution (**designated agencies**). Self-registration is not possible. |
| **Portal** | udyamassist.gov.in, available only to the designated agencies |
| **The key number** | The bank's **customer ID** |
| **Mandatory documents** | Aadhaar, bank passbook, customer ID |
| **Mandatory details** | Name, mobile number, social category (general, SC, ST...), gender, residential address, enterprise name, type of organisation, business address, main activity, number of persons employed |
| **Optional** | Email, alternate mobile, voter ID, PAN |

Remember this rule of thumb: **PAN available → Udyam portal (you). PAN not available → bank on Udyam Assist.**`,

    sk(250, 'Which Udyam door? It depends on the PAN', [
      { t: 'box', x: 250, y: 12, w: 260, h: 56, label: `Does the owner have a PAN?`, fill: `yellow`, size: 17 },
      { t: 'arrow', x1: 320, y1: 70, x2: 170, y2: 112, label: `yes`, lx: -20 },
      { t: 'arrow', x1: 440, y1: 70, x2: 590, y2: 112, label: `no`, lx: 20 },
      { t: 'box', x: 30, y: 114, w: 280, h: 62, label: `Udyam portal`, sub: `you can register him`, fill: `green` },
      { t: 'box', x: 450, y: 114, w: 280, h: 62, label: `Udyam Assist`, sub: `his bank registers him`, fill: `purple` },
      { t: 'text', x: 170, y: 206, text: `needs Aadhaar + PAN (+ GST if any)`, size: 15, color: `#4a5568` },
      { t: 'text', x: 590, y: 206, text: `needs Aadhaar + passbook + customer ID`, size: 15, color: `#4a5568` },
      { t: 'text', x: 380, y: 236, text: `Both give an Udyam certificate with the same status.`, size: 15, color: `#c2410c` },
    ]),

    `## 3. Shops and Establishment registration
Every state has a **Shops and Commercial Establishments Act**. It is a **state law**, run by the state labour department. So the portal you use depends on the **state** where the business operates.

**Is it compulsory?** Technically **yes**, even for a one-person business. In practice authorities rarely act against very tiny units, but that does **not** make it optional.

**Steps:**
1. Open the state labour department or shops-and-establishment portal.
2. Create a login using a mobile number and email.
3. Choose "Shops and Establishment registration".
4. Fill in shop name, address, owner details, nature of business and **number of employees**.
5. Upload documents: **Aadhaar, PAN, rent agreement**, etc.
6. Pay the fee. It **varies by state**, and in some states by number of employees.
7. Review and submit. You may need an OTP or e-sign.
8. The labour department verifies. After approval, **download the certificate** (it carries the state government's logo).

## 4. Trademark registration (for proprietorships)
A proprietorship has a **business name or logo**, and a name that customers trust is worth protecting. If someone else registers it first, Ravi can be forced to stop using it.

Trademark work has a **professional opportunity** for you: you can become a **trademark agent**.`,

    sk(262, 'The trademark journey, from filing to the ® symbol', flow2([
      { label: `File form TM-A`, sub: `with the fee`, fill: `blue` },
      { label: `Examination`, sub: `registry checks it`, fill: `yellow` },
      { label: `Objection?`, sub: `reply, then hearing`, fill: `orange` },
      { label: `Published`, sub: `in Trademark Journal`, fill: `purple` },
      { label: `4-month window`, sub: `anyone may oppose`, fill: `pink` },
      { label: `Registered`, sub: `certificate, use ®`, fill: `green` },
    ], { y: 16, h: 74, rowGap: 78, x: 14, w: 732, gap: 50, label: `then` })),

    `**How to file (the process):**
1. Go to **ipindiaonline.gov.in**, open the trademark module and create a user ID.
2. Get a **Class 3 digital signature certificate (DSC)**, because most steps are online.
3. Choose **Form TM-A** (new application) and fill in the applicant's details.
4. Give the **word mark or logo**, a description, any colour claim, and whether the mark is **already in use** or **proposed to be used**.
5. Pick the **trademark class** and describe the goods or services. A free manual on the same site explains the classes.
6. Upload documents and the logo file, **review for spelling and class errors**, sign with the DSC.
7. **Pay the fee** and submit. You receive an **application number** (this is *not* the trademark number).

**The fee (as taught in the course):** the official fee is **₹10,000**. An **MSME with Udyam** gets a **50% discount** (₹5,000), and paying **online** gives a further **10%**, which brings it to about **₹4,500**. Fees change, so confirm the current amount on the website.

Note how **Udyam itself is free, but Shops and Establishment and trademark cost money.**

**After you file:** the registry examines the application. It can **object** if the mark is **too general**, or **too similar to a mark already registered**. You can **reply**, and if the registry is still not satisfied there is a **hearing**. If accepted, the mark is **published in the Trademark Journal**. For **four months** anyone, in India or abroad, can **oppose** it. If there is no opposition, or you win it, the mark is **registered** and the certificate is sent by email.

**TM versus ®.** Look at shop boards. A small **TM** next to a name means "we claim this as our trademark". The circled **®** means it is **officially registered**. You may use ® only after registration.

## Becoming a trademark agent
A trademark agent files and handles trademark applications for clients. To register as one on the same website:
- **Indian citizen**, **at least 21 years old**, and a **graduate** from a recognised university
- Pass a **written exam**, then a **viva voce** (interview)
- Submit **Form TM-G** with the fee and documents (ID proof, education certificate)
- You are then listed in the **Register of Trademark Agents**.`,

    { analogy: `Think of each registration as a **different permission from a different system**: Udyam is your MSME *profile* on a national platform; Shops and Establishment is a *state-level* licence to operate; a trademark is a *namespace reservation* so nobody else can publish under your name. Each has its own issuer, its own ID number, and its own renewal rules.` },

    `## Worked example: Meena's tailoring unit
Meena stitches clothes at home, with her own name on the board and one helper.
- **Tax ID:** She has a PAN and no GST. She is an individual business, so no separate PAN is needed for the business.
- **Udyam:** She has a PAN, so you register her on the **Udyam portal**: Aadhaar + OTP, PAN, her own name as the enterprise, her own bank account, service activity, 1 employee, small investment, estimated turnover. She gets a **URN** and downloads the certificate.
- **Shops and Establishment:** You register her on her **state's** labour portal with Aadhaar, PAN and a rent agreement.
- **Trademark:** If she later names the brand "Meena Stitch" and starts selling online, you advise her to file **Form TM-A**, paying the Udyam-discounted fee.`,

    { warn: `Common mistakes:
- **Giving the wrong turnover** for a new business. It is an *estimate of year-one sales*, not zero.
- **Registering for Udyam through an agent who charges a fee.** Udyam registration itself is **free** on the official portal.
- **Treating the application number as the trademark number.** The trademark number comes only after registration.
- **Using ® before the mark is registered.** Use TM until then.
- **Assuming Shops and Establishment is optional** because nobody checks.` },

    { real: `A client asks, "Which registrations do I need?" Start with this checklist: **Udyam (free, always), Shops and Establishment (state, compulsory), trademark (if the name or logo matters)**, and **GST** if his sales cross the limit or he sells across states (covered later in the course).` },

    { remember: `- Individual and proprietorship: **no separate PAN**, the **owner's PAN** is used.
- **Udyam** is **free**. PAN available → **Udyam portal** (your work). No PAN → **Udyam Assist through a bank**, using the **customer ID**.
- Udyam steps: portal → **Aadhaar + OTP** → PAN → business details → activity → employees, investment, turnover (estimate if new) → GST → OTP → **URN** → certificate with logos and **QR code**.
- **Shops and Establishment** is a **state law**. Compulsory, fees vary.
- **Trademark** (Form **TM-A**, Class 3 DSC): objection → hearing → **journal → 4-month opposition → registered**. **TM** = claimed, **®** = registered.
- Trademark agent: Indian, **21+**, graduate, written exam + viva, **Form TM-G**.` },
  ],
  quiz: [
    { q: `For a proprietorship business, a separate PAN number is...`, o: [`Required`, `Cannot say`, `Not required if sales are below 10 lakh`, `Not required: the proprietor's PAN is used`], a: 3, why: `A proprietorship is not separate from its owner for tax, so the owner's PAN is used. (Only HUF, partnership and AOP have their own PAN.)` },
    { q: `An owner with no PAN and no GST wants Udyam registration. What happens?`, o: [`He registers himself on udyamregistration.gov.in`, `His bank or another designated agency registers him on Udyam Assist`, `He cannot be registered at all`, `He must first form a company`], a: 1, why: `Informal micro enterprises are onboarded by designated agencies using the bank customer ID.` },
    { q: `Is a government fee payable for a trademark registration?`, o: [`Yes`, `No`, `Only for large companies`, `Only for logos`], a: 0, why: `Trademark filing has a government fee (reduced for MSMEs with Udyam and for online filing). Udyam registration is the free one.` },
    { q: `Registration under the Shops and Commercial Establishment Act is...`, o: [`Optional`, `Compulsory`, `Compulsory only for companies`, `Not required for individuals, required for others`], a: 1, why: `It is compulsory. Authorities may not enforce it for very small units, but that does not make it optional.` },
    { q: `What does the circled R (®) next to a brand name mean?`, o: [`The brand claims to be a trademark but is not registered`, `The brand is a registered trademark`, `The brand is exported`, `The brand is under objection`], a: 1, why: `® is for registered marks only. TM is used for marks that are claimed but not (yet) registered.` },
    { q: `Which of these is a requirement to become a trademark agent?`, o: [`Be a chartered accountant`, `Be at least 30`, `Be a graduate and pass a written exam and viva`, `Own a registered trademark`], a: 2, why: `An Indian citizen aged 21 or above with a graduate degree passes a written exam and a viva voce, and files Form TM-G.` },
  ],
};
