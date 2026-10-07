export default {
  id: 'foundations-authorization-secrets',
  title: 'Authorization, secrets and encryption',
  goal: 'You can choose between ACL, RBAC and ABAC, apply least privilege and maker-checker, say where secrets must and must not live, tell encoding from hashing from encryption, and describe what an audit log needs.',
  roadmap: ['RBAC, ABAC, ACL and least privilege', 'Secrets management and rotation', 'Encryption at rest and in transit; key management', 'Audit logs'],
  blocks: [
    `## The problem
A contractor leaves. Two weeks later you find that the production database password is still sitting in a \`.env\` file that was pushed to a public GitHub repository. Automated bots scan GitHub constantly for exactly this and found it within minutes.

That single incident has three causes, and this lesson covers each: **too much access** (a contractor with a production password), **secrets in the wrong place**, and **no trail** to show who used what. Authentication told you *who* is calling. Now we decide **what they may do**, **how their credentials are kept safe**, and **how we prove it afterwards**.

## Authorization models
- **ACL (Access Control List):** each resource carries a list: "file X: Asha can read, Kabir can edit". Fine for a few files; unmanageable for thousands of resources and people.
- **RBAC (Role-Based Access Control):** you give people **roles**, and roles carry **permissions**. Asha is an \`uploader\`; uploaders may upload files and read jobs. Add a person, assign a role, done. This is the workhorse of Azure (Azure RBAC), Power BI workspaces, databases and most business apps.
- **ABAC (Attribute-Based Access Control):** decisions use **attributes** of the user, the resource and the context, written as a policy: "Finance users may read payroll rows of **their own entity**, during business hours, from a managed device." More flexible, harder to reason about. Row-level security in databases and Power BI is ABAC in practice.

Three principles sit above all models:
1. **Least privilege.** Give the smallest set of permissions needed, for the shortest time needed. Contributor on one resource group beats Owner on the subscription.
2. **Separation of duties** (also called **maker-checker** or four-eyes). The person who creates a sensitive thing may not also approve it. In payroll: the person who uploads the bank file cannot approve the payment.
3. **Default deny.** No explicit allow means no access.`,
    { sketch: { w: 760, h: 330, caption: 'RBAC: people get roles, roles carry permissions. Maker-checker: uploading and approving are different roles.', items: [
      { t: 'box', x: 14, y: 54, w: 112, h: 42, label: 'Asha', fill: 'yellow', size: 17 },
      { t: 'box', x: 14, y: 124, w: 112, h: 42, label: 'Kabir', fill: 'yellow', size: 17 },
      { t: 'box', x: 14, y: 194, w: 112, h: 42, label: 'Meera', fill: 'yellow', size: 17 },
      { t: 'box', x: 188, y: 54, w: 140, h: 42, label: 'uploader', fill: 'blue', size: 17 },
      { t: 'box', x: 188, y: 124, w: 140, h: 42, label: 'reviewer', fill: 'blue', size: 17 },
      { t: 'box', x: 188, y: 194, w: 140, h: 42, label: 'admin', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 126, y1: 75, x2: 188, y2: 75 },
      { t: 'arrow', x1: 126, y1: 145, x2: 188, y2: 145 },
      { t: 'arrow', x1: 126, y1: 215, x2: 188, y2: 215 },
      { t: 'table', x: 370, y: 50, title: 'what each role may do', cols: ['permission', 'upload', 'review', 'admin'], colW: [150, 70, 70, 70], rows: [['file:upload', '✓', '–', '–'], ['job:read', '✓', '✓', '✓'], ['exception:resolve', '–', '✓', '✓'], ['user:manage', '–', '–', '✓']], fill: 'green' },
      { t: 'note', x: 30, y: 268, w: 700, h: 44, text: 'Maker-checker: whoever uploaded a payroll file may NOT also approve its exceptions,\neven if their role would normally allow it.', fill: 'pink', size: 15 },
    ] } },
    `## Try an RBAC engine with a maker-checker rule`,
    { py: {
      title: 'Roles, permissions and separation of duties',
      starter: `ROLE_PERMISSIONS = {
    "uploader": {"file:upload", "job:read"},
    "reviewer": {"job:read", "exception:read", "exception:resolve"},
    "admin":    {"job:read", "exception:read", "exception:resolve", "user:manage"},
}
USER_ROLES = {"asha": {"uploader"}, "kabir": {"reviewer"}, "meera": {"admin", "uploader"}}

def allowed(user, permission):
    return any(permission in ROLE_PERMISSIONS[r] for r in USER_ROLES.get(user, ()))   # default deny: unknown user -> False

def can_resolve(user, file_owner):
    # RBAC says the role may resolve; maker-checker says not your own upload
    return allowed(user, "exception:resolve") and user != file_owner

for user, perm in [("asha", "file:upload"), ("asha", "exception:resolve"), ("kabir", "exception:resolve"), ("stranger", "job:read")]:
    print(f"{user:>8} {perm:<20} -> {allowed(user, perm)}")

print("kabir resolving Asha's upload :", can_resolve("kabir", "asha"))
print("meera resolving her own upload:", can_resolve("meera", "meera"), " <- blocked although she is an admin")`,
      note: 'Meera is both an uploader and an admin. RBAC alone would let her approve her own upload; the extra rule closes that gap.',
    } },
    `## Service accounts and permission creep
Not every caller is a person. A scheduled job or a Power Automate flow needs an identity too: a **service account**, **service principal** or, best of all, a **managed identity**, an identity the cloud platform creates and rotates for your resource, with no password anywhere. Give each automation its **own** identity, so logs say which one acted and so you can remove one without breaking others.

Over time people collect access they no longer need (**permission creep**). Counter it with **access reviews** every quarter, **expiring** grants (just-in-time elevation), and removing access in the same ticket that moves or removes a person.

## Secrets: what they are and where they go
A **secret** is anything that grants access if someone else gets it: passwords, API keys, connection strings, private keys, client secrets, tokens, certificates' private parts.

**Never keep secrets in:** source code, Git history, \`.env\` files that are committed, Excel or Word documents, chat messages, tickets, screenshots, or logs.

**Where they belong (best to least good):**
1. **No secret at all.** A managed identity or workload-identity federation lets one service prove itself to another with no stored password. Prefer this.
2. A **secret manager**: Azure Key Vault, AWS Secrets Manager, HashiCorp Vault. Access is controlled by identity, every read is logged, and values can be rotated centrally. The app reads the secret at start-up or on demand.
3. **Environment variables** injected at runtime by the platform or the CI system, never committed. A \`.env\` file is acceptable on your own laptop **only if it is in \`.gitignore\`**.

**Rotate** secrets on a schedule and immediately after any suspicion of exposure. If a secret leaks, the order is: **revoke or rotate first, investigate second, clean up Git history last.** Deleting the commit does not help because bots and clones already copied it.

Add automated scanners: a pre-commit hook, GitHub's secret scanning and push protection, and a CI check. The challenge below builds a mini version of one.`,
    { pychallenge: {
      id: 'foundations-pych-secrets',
      prompt: 'Write `find_secrets(text)` that returns the **1-based line numbers** that probably contain a hard-coded secret. Flag a line if it matches any of: (a) a word `password`, `pwd`, `secret`, `api_key`/`apikey`/`api-key` or `token` (any case) followed by `=` or `:` and then a value of **at least 6 characters** that does not start with `<` or `$` (so placeholders like `<your password>` and `${DB_PASSWORD}` are fine); (b) `AccountKey=` followed by at least 20 base64 characters; (c) `Bearer ` followed by at least 20 token characters (letters, digits, `.`, `_`, `-`).',
      starter: `import re

def find_secrets(text):
    return []`,
      tests: `text = """db_host = localhost
password = hunter2hunter2
API_KEY: "abcd1234efgh5678"
conn = DefaultEndpointsProtocol=https;AccountName=kollana;AccountKey=Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MA==;EndpointSuffix=core.windows.net
password = <your password here>
password = \${DB_PASSWORD}
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abcdef123456
token: abc
print("token expired")"""
assert find_secrets(text) == [2, 3, 4, 7]
assert find_secrets("") == []
assert find_secrets("PWD=sh0rt") == []
assert find_secrets("PWD=sh0rt-but-long-enough") == [1]`,
      solution: `import re

PATTERNS = [
    re.compile(r"(password|pwd|secret|api[_-]?key|token)\\s*[=:]\\s*[\\"']?[^\\s\\"'<$]{6,}", re.I),
    re.compile(r"AccountKey=[A-Za-z0-9+/=]{20,}"),
    re.compile(r"Bearer [A-Za-z0-9._-]{20,}"),
]

def find_secrets(text):
    return [i for i, line in enumerate(text.splitlines(), 1) if any(p.search(line) for p in PATTERNS)]`,
      hint: 'Use re.compile with the re.I flag. For rule (a): the keyword, optional spaces, [=:], optional spaces, an optional quote, then [^\\s"\'<$]{6,}. Number lines with enumerate(..., 1).',
    } },
    { warn: 'Regex scanners are a safety net, not a guarantee: they miss secrets in odd formats and flag harmless lines (for example \`token = get_token()\`). Treat a hit as "look at this", not "this is a leak", and keep the human habit: **if you would not paste it in a public chat, it does not belong in code.**' },
    `## Encoding, hashing, encryption: three different things
People use these words as if they were the same. They are not:
| | Reversible? | Needs a key? | Purpose | Example |
|---|---|---|---|---|
| **Encoding** | Yes, by anyone | No | Represent data in another format | Base64, URL-encoding |
| **Hashing** | **No** (one-way) | No (or a salt) | Fingerprint, integrity, password storage | SHA-256, Argon2 |
| **Encryption** | Yes, **only with the key** | **Yes** | Keep data secret | AES, RSA |

"We encrypted it with base64" is a sentence that makes security engineers wince.

## Encryption at rest and in transit
- **In transit:** TLS between every pair of systems (previous lessons). Include internal traffic; "inside the network" is not a defence.
- **At rest:** data on disks, databases and storage is encrypted. Cloud platforms do this by default with **platform-managed keys**. For stricter rules, **customer-managed keys** held in your own Key Vault let you control and revoke access.
- **Field-level / application-level:** encrypt or tokenise very sensitive fields (PAN, bank account) inside the app so even a database admin sees ciphertext.

**Key management** is where encryption is won or lost. Keys live in a **KMS** or **HSM** (hardware security module), never next to the data they protect. A common design is **envelope encryption**: each record or file is encrypted with its own random *data key*; the data key is itself encrypted by a *master key* that never leaves the key service. Rotating the master key re-wraps small data keys instead of re-encrypting terabytes. Use separate people or roles to manage keys and to read data.

## Audit logs: prove what happened
An **audit log** answers *who did what, to which thing, when, from where, and did it work?* For payroll: who uploaded, who resolved an exception, what changed, from which IP. Good audit logs are:
- **Complete** for sensitive actions (logins, permission changes, reads of sensitive data, deletes, approvals).
- **Tamper-resistant**: append-only, shipped to a separate store the actors cannot edit.
- **Retained** for as long as policy or law requires, and searchable.
- **Free of secrets and unnecessary personal data.** Log that a PAN was read, not the PAN itself.
- **Watched**: alerts on unusual events such as a new admin or a bulk export.`,
    { interview: '**"What is the difference between authentication and authorization, and how would you design access for a payroll tool?"** Model answer: "Authentication proves who the caller is; authorization decides what they may do. For payroll I would use RBAC with roles for uploader, reviewer and admin, least privilege per role, and a maker-checker rule so nobody approves their own upload. Service accounts get their own managed identity, secrets live in Key Vault and never in code, data is encrypted in transit and at rest, and every sensitive action goes to an append-only audit log with alerts on privilege changes. Access is reviewed quarterly." That walks through every idea in the lesson.' },
    { real: 'When you hand a Power Automate flow a service account, ask: *who owns it, what can it touch, where is its password, and would I notice if it did something odd?* If the answers are "me, everything, in the flow description, no", you have just found your first four tickets.' },
    `## Recap
- **Authorization** models: **ACL** (per resource list), **RBAC** (roles carry permissions), **ABAC** (policies on attributes). Apply **least privilege**, **default deny** and **separation of duties (maker-checker)**.
- Give each automation its **own identity**; prefer **managed identities**; run **access reviews** to fight permission creep.
- **Secrets** go in a secret manager or runtime environment, never in code or Git. Best secret = **no secret**. **Rotate**, and on a leak: revoke first, clean up last.
- **Encoding** is not hashing is not **encryption**. Encrypt **in transit** and **at rest**, keep keys in a **KMS/HSM**, use **envelope encryption**.
- **Audit logs** are complete, tamper-resistant, retained, free of secrets and watched.`,
  ],
  quiz: [
    { q: 'Which model best expresses "Finance users may read payroll rows of their own entity, only from managed devices"?', o: ['ACL', 'RBAC with a single role', 'ABAC (attribute-based)', 'Basic auth'], a: 2, why: 'The rule depends on attributes of the user, the data and the context, which is what ABAC policies describe.' },
    { q: 'Meera is an admin and uploaded a payroll file. The system blocks her from resolving its exceptions. Which principle is this?', o: ['Separation of duties (maker-checker)', 'Password rotation', 'Encryption at rest', 'Default allow'], a: 0, why: 'The person who creates a sensitive item should not also approve it, even if their role would normally permit it.' },
    { q: 'A client secret was committed to a public repo. What is the first action?', o: ['Rename the repo', 'Email the team', 'Delete the commit', 'Rotate or revoke the secret immediately'], a: 3, why: 'Assume it is already copied. Only rotation makes the leaked value useless; cleaning history comes later.' },
    { q: 'Which is NOT a form of protecting data from being read?', o: ['Encrypting it with AES', 'Base64-encoding it', 'Storing it on an encrypted disk', 'Putting it behind a private endpoint'], a: 1, why: 'Base64 is a reversible encoding that anyone can undo. It hides nothing.' },
    { q: 'Why is a managed identity better than a stored client secret?', o: ['There is no password to leak, store or rotate; the platform proves the identity', 'It removes the need for RBAC', 'It works without Azure', 'It is faster'], a: 0, why: 'Removing the secret removes a whole class of leaks and rotation chores.' },
    { q: 'What belongs in an audit log of a payroll system?', o: ['Only successful actions', 'Nothing, to save space', 'The full PAN of every employee read', 'Who did what, to which record, when, from where, and the result'], a: 3, why: 'A good audit trail shows actor, action, target, time, origin and outcome without recording secrets or unnecessary personal data.' },
  ],
  task: {
    title: 'Draw your access model and clean up one secret',
    steps: [
      'For one tool you own (a Power Automate flow, a shared drive, a script), list every person and automation that has access and what each can do. Mark any access that is no longer needed.',
      'Write the roles and permissions for it as a table like the one in the sketch. Add one maker-checker rule.',
      'Find one secret in a place it should not be (a script, a flow description, a shared sheet). Write the steps to move it to a secret manager or replace it with a managed identity, including how you will rotate the old value.',
    ],
    deliverable: 'A roles-and-permissions table, one maker-checker rule, and a written migration plan for one secret.',
  },
};
