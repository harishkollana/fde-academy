export default {
  id: 'python-security-secrets',
  title: 'Security basics in code',
  goal: 'You can recognise and block the common ways Python automation gets attacked or leaks: path traversal and zip slip, SSRF, unsigned webhooks, unsafe YAML/pickle/eval/shell calls, secrets in code, URLs and logs, weak password hashing and risky dependencies.',
  roadmap: ['secrets handling', 'input validation', 'hashing', 'SQL injection', 'SSRF', 'dependency risks'],
  blocks: [
    `## The problem
Automation code is trusted code: it runs on a server with access to files, networks and databases. Yet almost every script **trusts input it should not**:
- It builds a file path from a name in a vendor's upload (\`../../secrets/db.env\`).
- It fetches a URL that sits in a config or a request (\`http://169.254.169.254/...\` is a cloud server's private "metadata" address).
- It accepts a "payment received" webhook from anyone who can type the URL.
- It loads a YAML or pickle file, or builds a shell command, from text it did not write.
- It carries a password in a variable, a URL and a log line.
- It installs a package whose name is one letter off from the famous one.

You do not need to become a security specialist. You need a **small set of habits**, and the ability to say what they are. The Foundations phase already covered the concepts (authentication, authorization, secrets management, network security, encryption). This lesson is the **code-level** companion: the specific mistakes in Python that cause incidents, with the guard for each, small enough to write yourself and to explain in an interview.

**The mental model.** Everything that comes from **outside your program** (files, names, URLs, headers, API answers, environment, packages) is **untrusted** until checked. Check it with an **allow-list** (what is allowed), not a block-list (what you remembered to forbid). Give the code the **least privilege** it needs. Keep **secrets** out of code, logs and URLs. Keep the **dependencies** few and known. The playgrounds below only use harmless stand-ins: nothing here attacks anything.`,
    { sketch: { w: 760, h: 300, caption: 'Everything crossing the line from outside must be checked; the code behind the line should have little power', items: [
      { t: 'box', x: 14, y: 34, w: 190, h: 220, fill: 'pink' },
      { t: 'text', x: 109, y: 58, text: 'untrusted input', size: 15, bold: true, anchor: 'middle' },
      { t: 'text', x: 109, y: 90, text: 'file and folder names', size: 13, anchor: 'middle' },
      { t: 'text', x: 109, y: 116, text: 'URLs from configs', size: 13, anchor: 'middle' },
      { t: 'text', x: 109, y: 142, text: 'webhooks and API data', size: 13, anchor: 'middle' },
      { t: 'text', x: 109, y: 168, text: 'YAML, pickle, text', size: 13, anchor: 'middle' },
      { t: 'text', x: 109, y: 194, text: 'zip files', size: 13, anchor: 'middle' },
      { t: 'text', x: 109, y: 220, text: 'packages from PyPI', size: 13, anchor: 'middle' },
      { t: 'arrow', x1: 208, y1: 144, x2: 300, y2: 144 },
      { t: 'box', x: 304, y: 94, w: 160, h: 100, label: 'CHECK', sub: 'allow-lists, resolve(),\nsignatures, safe loaders', fill: 'yellow', size: 18 },
      { t: 'arrow', x1: 468, y1: 144, x2: 530, y2: 144 },
      { t: 'box', x: 534, y: 34, w: 212, h: 220, fill: 'green' },
      { t: 'text', x: 640, y: 58, text: 'your code, least privilege', size: 14, bold: true, anchor: 'middle' },
      { t: 'text', x: 640, y: 94, text: 'read-only DB role', size: 13, anchor: 'middle' },
      { t: 'text', x: 640, y: 120, text: 'one folder, not the disk', size: 13, anchor: 'middle' },
      { t: 'text', x: 640, y: 146, text: 'secrets only from the', size: 13, anchor: 'middle' },
      { t: 'text', x: 640, y: 164, text: 'environment, never logged', size: 13, anchor: 'middle' },
      { t: 'text', x: 640, y: 196, text: 'few, pinned dependencies', size: 13, anchor: 'middle' },
      { t: 'note', x: 14, y: 262, w: 732, h: 30, fill: 'grey', size: 14, text: 'Allow-list what is expected. Anything else is refused, logged, and never "fixed" quietly.' },
    ] } },
    `## Path traversal and zip slip
**The mistake.** A vendor's upload is called \`sales_2026-09.csv\`, so your code does \`open(folder / name)\`. Then one day the name is \`../../config/db.env\`. The \`..\` parts walk **out** of your folder, and your script reads (or overwrites) something it should never touch. This is **path traversal**. The same happens when you unpack a **zip file** whose entries are named like \`../../x\`: the file lands outside the folder you meant (**zip slip**).

**The cure** has three steps, and the order matters:
1. Build the path: \`target = base / user_name\`.
2. **Resolve** it: \`target.resolve()\` removes \`.\` and \`..\`, makes it absolute and follows symbolic links.
3. Check that the result is **inside the base folder**: \`target.is_relative_to(base.resolve())\`. Refuse otherwise.

Two traps: **a plain \`str.startswith\` check is wrong**, because \`C:\\fde\\incoming_old\` starts with the text \`C:\\fde\\incoming\`. \`is_relative_to\` compares path **parts**. And an **absolute** name (\`/etc/passwd\`, \`C:\\Windows\\x\`) **replaces** the base when you use the \`/\` operator, so the resolve-and-check step must catch that too.

Python's own \`ZipFile.extract\` removes leading slashes and \`..\` parts from member names, which is why it is safe by default, but other tools (\`tarfile\` in older settings, shell \`unzip\`, your own loops) may not be, so **validate the final path yourself**. Also limit the **size** of what you unpack (a "zip bomb" is a tiny file that expands to many gigabytes).`,
    { sketch: { w: 760, h: 292, caption: 'Path traversal: ".." walks out of the folder. Resolve first, then check the result is inside', items: [
      { t: 'box', x: 14, y: 40, w: 300, h: 120, fill: 'blue' },
      { t: 'text', x: 164, y: 62, text: 'C:\\fde\\incoming   (the base folder)', size: 13, bold: true, anchor: 'middle' },
      { t: 'doc', x: 60, y: 82, w: 90, h: 60, label: 'a.csv', fill: 'white' },
      { t: 'doc', x: 180, y: 82, w: 100, h: 60, label: 'b.csv', fill: 'white' },
      { t: 'doc', x: 14, y: 196, w: 300, h: 56, label: 'C:\\fde\\config\\db.env', fill: 'pink' },
      { t: 'arrow', x1: 164, y1: 164, x2: 164, y2: 192, dashed: true, color: '#c0392b', label: '..\\config\\db.env', lx: 98, ly: 4 },
      { t: 'text', x: 346, y: 100, text: 'name from outside:', size: 13, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 346, y: 120, text: '"..\\config\\db.env"', font: 'mono', size: 13, anchor: 'start', bold: true },
      { t: 'arrow', x1: 440, y1: 138, x2: 440, y2: 158 },
      { t: 'box', x: 346, y: 162, w: 400, h: 96, label: 'safe_join(base, name)', sub: '1. target = (base / name).resolve()\n2. is_relative_to(base)?  no: refuse', fill: 'green', size: 15 },
      { t: 'mark', x: 722, y: 186, ok: false },
      { t: 'note', x: 346, y: 36, w: 400, h: 46, fill: 'yellow', size: 13, text: 'startswith() is NOT a safe check:\n...\\incoming_old starts with ...\\incoming' },
    ] } },
    { py: {
      title: 'Path traversal, the startswith trap, and what a zip with hostile names does',
      starter: `import io
import tempfile
import zipfile
from pathlib import Path

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    base = root / "incoming"
    base.mkdir()
    (root / "incoming_old").mkdir()
    (root / "secrets").mkdir()
    (root / "secrets" / "db.env").write_text("DB_PASSWORD=fake-value-for-the-demo", encoding="utf-8")

    def shown(path):
        return Path(path).resolve().relative_to(root.resolve()).as_posix()

    print("1. a naive join follows '..' out of the folder")
    for name in ("a.csv", "../secrets/db.env", "sub/../../secrets/db.env"):
        target = base / name
        print(f"   {name:<28} -> {shown(target)}")

    print("2. startswith is the wrong check (it compares TEXT, not folders)")
    base_text = str(base.resolve())
    sibling = (base / "../incoming_old/x.csv").resolve()
    print("   sibling folder is inside the base?  startswith says:", str(sibling).startswith(base_text),
          "| is_relative_to says:", sibling.is_relative_to(base.resolve()))

    print("3. is_relative_to on the RESOLVED path gives the right answer")
    for name in ("a.csv", "sub/b.csv", "../secrets/db.env", "../incoming_old/x.csv", "/etc/passwd"):
        target = (base / name).resolve()
        print(f"   {name:<24} inside the base: {target.is_relative_to(base.resolve())}")

    print("4. a zip with hostile member names")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as z:
        z.writestr("ok.csv", "invoice_no,amount\\nINV/1,100\\n")
        z.writestr("../evil.txt", "should not escape")
        z.writestr("/abs.txt", "should not land at the root")
        z.writestr("sub/../../up.txt", "should not climb")
    target_dir = root / "unpacked"
    target_dir.mkdir()
    with zipfile.ZipFile(buffer) as z:
        print("   names in the zip:", z.namelist())
        for member in z.namelist():
            z.extract(member, target_dir)             # ZipFile.extract cleans the name
    created = sorted(p.relative_to(root).as_posix() for p in root.rglob("*.txt")) + sorted(
        p.relative_to(root).as_posix() for p in target_dir.rglob("*.csv"))
    print("   files created:", created)
    print("   anything outside 'unpacked/'? ->", [c for c in created if not c.startswith("unpacked/") and c != "secrets/db.env"])`,
      note: 'Step 1 shows two of the three names walking into the secrets folder. Step 2 is the bug that survives many code reviews: the sibling folder incoming_old "starts with" the base path as text, so startswith accepts it, while is_relative_to compares folders and refuses it. Step 3 also refuses an absolute name. In step 4 the standard library cleans the hostile member names, so every file stays under unpacked/: that is a feature of ZipFile.extract, not something you can assume from other tools. Challenge 1 asks you to wrap steps 1 to 3 into one function.',
    } },
    `## SSRF: when your code is tricked into calling an internal address
**SSRF** (server-side request forgery) happens when your code fetches a URL that **someone else controls**: a "callback URL" in a config, a file location in a request, a link in a vendor sheet. The attacker points it at something only **your server** can reach: \`http://localhost:5432\`, a database on the internal network (\`http://10.0.0.5/\`), or the **cloud metadata service** (\`http://169.254.169.254/\`), which can hand out credentials to whoever asks from inside the machine.

**The guard, in four checks** (code you write in challenge 2):
1. **Only \`https\`** (and nothing like \`file://\` or \`ftp://\`), and **no credentials** inside the URL.
2. Take the **host name from a parser** (\`urllib.parse.urlsplit(url).hostname\`), never from string searching. \`https://api.example.com@evil.test/\` goes to **evil.test**, and \`https://api.example.com.evil.test/\` too, yet both contain the text you were looking for.
3. If you know the few places you call, use an **allow-list of host names**. This is the strongest control.
4. Otherwise **resolve the name to IP addresses** and refuse if **any** address is not **public** (\`ipaddress.ip_address(x).is_global\`, and also refuse multicast, which \`is_global\` does not always exclude): loopback (\`127.0.0.1\`, \`::1\`), private ranges (\`10.x\`, \`172.16-31.x\`, \`192.168.x\`), link-local (\`169.254.x\`, the metadata address) and so on. Also re-check after every **redirect**, and connect to the **address you checked** (a name can change its answer between your check and the call: "DNS rebinding").

On a cloud server, also lock down the metadata service (a setting on the machine) and give the machine the **least privilege** possible, so a successful SSRF finds little.`,
    { py: {
      title: 'Which addresses are public? And why checking the text of a URL is not enough',
      starter: `import ipaddress
from urllib.parse import urlsplit

addresses = ["93.184.216.34", "127.0.0.1", "10.0.0.5", "192.168.1.10", "172.16.5.4",
             "169.254.169.254", "0.0.0.0", "224.0.0.1", "::1", "fe80::1", "2606:2800:220:1:248:1893:25c8:1946"]
print(f"{'address':<38}{'public?':<12}reason")
for text in addresses:
    ip = ipaddress.ip_address(text)
    reasons = [name[3:] for name in ("is_loopback", "is_private", "is_link_local", "is_multicast", "is_unspecified") if getattr(ip, name)]
    print(f"{text:<38}{'yes' if ip.is_global else 'NO':<12}{', '.join(reasons)}")

print()
print("The host name must come from a parser, not from a text search:")
urls = [
    "https://api.example.com/rates",
    "https://api.example.com:443/rates",
    "https://api.example.com@evil.test/x",
    "https://api.example.com.evil.test/x",
    "https://evil.test/?next=https://api.example.com",
    "https://user:secret@api.example.com/x",
    "http://api.example.com/rates",
]
for url in urls:
    parts = urlsplit(url)
    naive = "api.example.com" in url
    right = parts.scheme == "https" and parts.hostname == "api.example.com" and parts.username is None
    print(f"{url:<52} text search: {str(naive):<6} parsed host: {parts.hostname!s:<24} allowed: {right}")`,
      note: 'The first table shows that "public" is more than "not 192.168.x": is_global rejects loopback, private, link-local (the metadata address) and unspecified addresses, for both IPv4 and IPv6. Look at 224.0.0.1 too: it is a multicast address, it is not private, and is_global may still say yes (this depends on the Python version), so a guard must refuse multicast explicitly. The second table is the reason never to use "api.example.com" in url: the text search says yes to three hostile URLs, and the parsed host name says no to them. The last three rows show the other checks: credentials in the URL, and a plain http scheme.',
    } },
    `## Webhooks: prove that the message came from who you think
A **webhook** is an HTTP call that another system makes to **you** ("a payment was received", "a file is ready"). The URL is public, so anyone can send fake events. The standard defence is a **signature**:
- You and the sender share a **secret**. The sender computes an **HMAC** (a keyed hash, \`hmac.new(secret, message, hashlib.sha256)\`) of the message and sends it in a header, for example \`X-Signature: sha256=<hex>\`.
- You recompute the HMAC over the **raw body bytes exactly as received** (not over JSON that you parsed and printed again, which changes spaces and key order) and compare.
- Compare with **\`hmac.compare_digest\`**, which takes the same time however many characters match. A normal \`==\` stops at the first difference, and the tiny timing difference can leak the signature to a patient attacker.
- To stop **replay** (someone resending a real, old, signed message), the signed text includes a **timestamp**, and you reject messages whose timestamp is more than a few minutes away from your clock. Keep the **secret** out of code (the Logging and configuration lesson) and rotate it if it leaks. For bigger money movements also make the handler **idempotent** (store event ids).`,
    { sketch: { w: 760, h: 298, caption: 'A signed webhook: the secret never travels, only its fingerprint of the message does', items: [
      { t: 'box', x: 14, y: 36, w: 150, h: 76, label: 'sender', sub: 'knows the secret', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 168, y1: 74, x2: 236, y2: 74, label: 'sign', ly: -14 },
      { t: 'box', x: 240, y: 30, w: 270, h: 88, label: 'HMAC-SHA256(secret,', sub: 'timestamp + "." + raw body)\n= a hex fingerprint', fill: 'yellow', size: 15 },
      { t: 'arrow', x1: 514, y1: 74, x2: 580, y2: 74, label: 'sends', ly: -14 },
      { t: 'box', x: 584, y: 36, w: 162, h: 76, label: 'body + headers', sub: 'timestamp\nX-Signature: sha256=...', fill: 'white', size: 14 },
      { t: 'arrow', x1: 665, y1: 116, x2: 665, y2: 148 },
      { t: 'box', x: 14, y: 152, w: 732, h: 96, fill: 'green' },
      { t: 'text', x: 380, y: 176, text: 'receiver (you), in this order:', size: 15, bold: true, anchor: 'middle' },
      { t: 'text', x: 380, y: 200, text: '1. is the timestamp within a few minutes of now?   (stops replays)', size: 13, anchor: 'middle' },
      { t: 'text', x: 380, y: 218, text: '2. recompute the HMAC over the RAW body with your copy of the secret', size: 13, anchor: 'middle' },
      { t: 'text', x: 380, y: 236, text: '3. hmac.compare_digest(recomputed, received)  ->  trust it, or answer 401', size: 13, anchor: 'middle' },
      { t: 'note', x: 14, y: 258, w: 732, h: 32, fill: 'pink', size: 13, text: 'Wrong secret, changed body or old timestamp: the check fails. Never compare with == and never log the secret.' },
    ] } },
    { py: {
      title: 'Sign a message, tamper with it, replay it: what HMAC and a timestamp catch',
      starter: `import hashlib
import hmac
import json
import secrets

SECRET = b"demo-only-not-a-real-secret"          # in real code: from the environment, never a literal

def sign(secret, body, timestamp):
    signed = str(timestamp).encode() + b"." + body            # the timestamp is part of what is signed
    return "sha256=" + hmac.new(secret, signed, hashlib.sha256).hexdigest()

body = json.dumps({"event": "payment.received", "amount": "125000.50", "invoice": "INV/0042/25-26"}).encode()
now = 1_790_000_000                                            # a fixed "current time", in seconds
header = sign(SECRET, body, now)
print("header     :", header[:30] + "...")
print("length     :", len(header) - len("sha256="), "hex characters (a SHA-256 fingerprint)")

def naive_check(secret, body, timestamp, received):
    return sign(secret, body, timestamp) == received            # == is not constant time: do not use it

def check(secret, body, timestamp, received, now, tolerance=300):
    if abs(now - timestamp) > tolerance:                         # too old or too far ahead: possible replay
        return "rejected: timestamp outside the window"
    expected = sign(secret, body, timestamp)
    if not hmac.compare_digest(expected.encode(), received.encode()):
        return "rejected: signature does not match"
    return "accepted"

print()
print("genuine message          :", check(SECRET, body, now, header, now))
tampered = body.replace(b"125000.50", b"925000.50")
print("body changed in transit  :", check(SECRET, tampered, now, header, now))
print("signed with another key  :", check(SECRET, body, now, sign(b"someone-elses-key", body, now), now))
print("re-sent two hours later  :", check(SECRET, body, now, header, now + 7200), "<- the signature is still valid, the age is not")
print("same JSON, re-formatted  :", check(SECRET, json.dumps(json.loads(body), indent=2).encode(), now, header, now),
      "<- always verify the RAW bytes you received")

print()
print("random values for tokens come from 'secrets', never from 'random':", len(secrets.token_urlsafe(32)), "characters")
print("compare_digest also protects token checks:", hmac.compare_digest(b"abc123", b"abc123"), hmac.compare_digest(b"abc123", b"abc124"))`,
      note: 'Three different attacks, three different answers: a changed body or the wrong key breaks the HMAC, and a replayed old message has a perfectly valid signature but fails the age check, which is why the timestamp is signed too. The re-formatted JSON line is a common real bug: the data is "the same", but the bytes are not, so the check must use the raw body. In your handler you also store event ids, so the same genuine event processed twice does nothing the second time.',
    } },
    `## Unsafe loading, \`eval\` and shell commands
Some Python functions **execute** what they read. That is fine for **your** data and a disaster for anyone else's:
- **\`pickle.loads\`** can run any code that the file author chose. **Never unpickle data you did not create** (not from email, a download or a queue that others write to). Use JSON, CSV or Parquet to exchange data.
- **\`yaml.load\`** with an unsafe loader (such as \`UnsafeLoader\`, or the old \`Loader\` that many older tutorials still use) can build arbitrary Python objects, which includes calling functions. Always use **\`yaml.safe_load\`**, which only builds plain lists, dictionaries, text and numbers.
- **\`eval\` and \`exec\`** run text as code. If you only need to read a literal (a list or a dictionary written as text), use **\`ast.literal_eval\`**, which refuses anything else.
- **Shell commands built from text.** \`subprocess.run(f"convert {name}", shell=True)\` lets a name such as \`a.csv; del *.xlsx\` run a **second command**. Pass a **list** (\`["convert", name]\`) without \`shell=True\`, so the name stays one argument. If you really need a shell, quote with \`shlex.quote\`.
- **SQL built from text** is the same family of mistake: pass values as **parameters** (the Databases lesson).
- **Temporary files** made with names you chose can be guessed or hijacked: use \`tempfile\` (\`TemporaryDirectory\`, \`NamedTemporaryFile\`), which creates them safely.
- **XML from strangers** can contain tricks (entity expansion). Prefer JSON, or parse XML with the \`defusedxml\` package.`,
    { py: {
      title: 'Data that runs code: YAML, pickle, eval and a shell command, with harmless stand-ins',
      starter: `import ast
import pickle
import shlex
import yaml

print("1. YAML")
print("   safe_load on normal data:", yaml.safe_load("name: Kollana\\nentities: [IN01, SG01]\\n"))
hostile = "!!python/object/apply:os.getcwd []\\n"      # asks the loader to CALL os.getcwd (harmless, but it shows the power)
try:
    yaml.safe_load(hostile)
except yaml.YAMLError as exc:
    print("   safe_load refuses the Python tag:", type(exc).__name__)
result = yaml.unsafe_load(hostile)
print("   unsafe_load RAN a function chosen by the data, and returned a", type(result).__name__, "(the current folder)")

print("2. pickle")
class Hostile:
    def __reduce__(self):                                # pickle asks: how do I rebuild this? The answer can be 'call print'
        return (print, ("   pickle.loads just executed a call chosen by the data",))
payload = pickle.dumps(Hostile())
pickle.loads(payload)

print("3. eval versus literal_eval")
print("   literal_eval reads a literal:", ast.literal_eval("[1, 2, {'currency': 'INR'}]"))
try:
    ast.literal_eval("__import__('os').getcwd()")
except ValueError as exc:
    print("   literal_eval refuses code:", type(exc).__name__)

print("4. a file name that is really two commands")
filename = "a.csv; del important.xlsx"
print("   built as text :", f"convert {filename}")
print("   how a shell splits it:", shlex.split(f"convert {filename}"), "<- 'del' becomes a command of its own")
print("   as a list     :", ["convert", filename], "<- one argument, however strange the name")
print("   shlex.quote   :", shlex.quote(filename))`,
      note: 'Every demonstration is a harmless stand-in (getcwd, print) but the mechanism is the same one an attacker uses with something worse: the data decides which function runs. The safe_load, literal_eval and list-argument forms are not "more careful" versions of the same thing: they cannot run the code at all. When a tool offers a safe loader, use it by default, and treat "it needs the unsafe one" as a design smell.',
    } },
    `## Secrets and hashing in code
The Foundations lesson explained **what** secrets are and **where** they belong (environment, vault, managed identity). In code, the habits are:
- **Load secrets once, at start-up, from the environment**, into a \`SecretStr\` field (Pydantic prints stars). Fail fast if one is missing.
- **Never in the code, the repository, the notebook, a screenshot, or a message.** Add a **secret scanner** to pre-commit and CI (for example \`detect-secrets\` or \`gitleaks\`; check their pages) so a leak is caught **before** it is pushed. If a secret was ever committed, **rotate it** (create a new one and disable the old): deleting the line later does not remove it from history.
- **Not in URLs or command-line arguments.** URLs end up in logs, browser history and proxies; arguments are visible in the process list. Use headers and environment variables. When you must log a URL, **redact** it (challenge 4).
- **Not in logs.** Mask tokens and personal data before logging (the Logging lesson).
- **One credential per purpose and per environment**, with the **least privilege**: a read-only database role for the reporting job (the SQL roles lesson), not the admin account.
- **Hashing is not one tool.** To fingerprint data or files, \`hashlib.sha256\` is fine. To store a **password** you need a **slow, salted** method (scrypt, argon2, bcrypt or PBKDF2 with many iterations), because a fast hash lets an attacker try billions of guesses per second. Never invent your own. For random tokens use **\`secrets\`** (\`secrets.token_urlsafe(32)\`), never \`random\`, which is predictable. Check the current OWASP guidance for parameters: they change with hardware.
- **Personal and financial data** (PAN, bank accounts, salary, GSTIN of individuals): collect only what you need, keep production data off laptops (that is why this course uses synthetic Kollana data), mask it in logs and test files, and delete exports when done. For regulations that apply to your employer, ask the data-protection or compliance team: do not guess.

**TLS:** never turn off certificate checks (\`verify=False\`) to make an error go away; fix the certificate or the trust store.`,
    { local: `**Password hashing with scrypt, and a token** (standard library only; scrypt is not available in the browser playground, so run it on your laptop). Save as \`pw_demo.py\`:
\`\`\`python
import hashlib
import hmac
import os
import secrets
import time


def hash_password(password, *, n=2**14, r=8, p=1):
    salt = os.urandom(16)                                    # a new random salt for every password
    digest = hashlib.scrypt(password.encode(), salt=salt, n=n, r=r, p=p, dklen=32)
    return f"scrypt\${n}\${r}\${p}\${salt.hex()}\${digest.hex()}"


def verify_password(password, stored):
    _, n, r, p, salt_hex, digest_hex = stored.split("$")
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex),
                            n=int(n), r=int(r), p=int(p), dklen=32)
    return hmac.compare_digest(digest.hex(), digest_hex)


stored = hash_password("correct horse battery staple")
print(stored[:40] + "...")
print("same password   :", verify_password("correct horse battery staple", stored))
print("wrong password  :", verify_password("Correct horse battery staple", stored))
print("two hashes of the same password differ:", hash_password("abc") != hash_password("abc"))

start = time.perf_counter()
for _ in range(1000):
    hashlib.sha256(b"abc").digest()
fast = (time.perf_counter() - start) / 1000
start = time.perf_counter()
verify_password("abc", hash_password("abc"))
slow = (time.perf_counter() - start) / 2
print(f"scrypt is about {slow / fast:,.0f} times slower than one sha256 (that is the point)")

print("token:", len(secrets.token_urlsafe(32)), "characters, e.g.", secrets.token_urlsafe(8))
\`\`\`
Output to expect (the salt, the token and the ratio are different on every run and every computer; the shape is the same):
\`\`\`text
scrypt$16384$8$1$fec0a2dff2af27c7e809ab8...
same password   : True
wrong password  : False
two hashes of the same password differ: True
scrypt is about 94,426 times slower than one sha256 (that is the point)
token: 43 characters, e.g. io-Jxa89suA
\`\`\`
The stored text holds the method, its settings, the **salt** and the hash, so a login can be verified later and the settings upgraded without breaking old users. In real systems use a maintained library for this (the Foundations authentication lesson shows the idea), and keep the hash comparison constant-time.

**Check your dependencies for known vulnerabilities** with \`pip-audit\` (\`pip install pip-audit\`). Run it on your requirements or in your environment (it asks a vulnerability database, so it needs the internet). With a deliberately old \`requirements.txt\` (\`requests==2.19.0\`, \`urllib3==1.24.1\`) it prints:
\`\`\`text
Found 35 known vulnerabilities in 2 packages
Name     Version ID              Fix Versions
-------- ------- --------------- -------------
requests 2.19.0  PYSEC-2018-28   2.20.0
requests 2.19.0  PYSEC-2023-74   2.31.0
urllib3  1.24.1  PYSEC-2019-133  1.24.2
urllib3  1.24.1  PYSEC-2019-132  1.24.3
urllib3  1.24.1  PYSEC-2020-148  1.25.9
...
\`\`\`
(The number and the ids change as new vulnerabilities are published; the exit code is non-zero when something is found, so CI can fail the build. The tool also prints a warning that pinned requirements should be hashed.) To make installs tamper-evident, **lock with hashes** (\`pip-compile --generate-hashes\`, or the lock file of \`uv\`) and install with \`pip install --require-hashes -r requirements.txt\`; check the current pip-tools and pip documentation for the exact options.` },
    `## Dependencies: you run other people's code
Every \`pip install\` runs code from strangers with your permissions. Real attacks use this: **typosquatting** (a package named \`reqeusts\` or \`python-dateutils\` that steals credentials), a **compromised release** of a popular package, an **abandoned** package that nobody maintains, and "install this one-liner" instructions in chats and forums.

Habits that reduce the risk:
- **Fewer dependencies.** Every package is trust you extend. Do not add one for a five-line function.
- **Check the name** before you install: spelling, download counts, the project page and repository, last release date, who maintains it.
- **Pin and lock** (the Environments lesson), ideally with **hashes**, so you install exactly what you tested. Update on purpose, reading the change log, not blindly.
- **Scan** for known vulnerabilities (\`pip-audit\`, GitHub Dependabot or Renovate) in CI.
- **Install from the official index** (or your company's mirror) only. Never install with administrator rights, and never run \`curl ... | sh\` or \`pip install\` from a message you cannot verify.
- **Keep secrets out of the build environment**, so a hostile install script has nothing to steal.`,
    { py: {
      title: 'Two small defences: a secret scanner for source text, and a look-alike package name check',
      starter: `import difflib
import re

SAMPLE = '''DB_HOST = "db.internal"
DB_PASSWORD = "S3cr3tPassw0rd!"
AWS_KEY = "AKIAIOSFODNN7EXAMPLE"
API_URL = "https://api.example.com/rates?token=abc123def456"
PRIVATE = "-----BEGIN PRIVATE KEY-----"
LOG_LEVEL = "INFO"
'''

PATTERNS = [
    ("hard-coded password", re.compile(r"(?i)\\w*(?:password|passwd|pwd)\\w*\\s*[:=]\\s*['\\"][^'\\"]{6,}['\\"]")),
    ("AWS access key id", re.compile(r"\\bAKIA[0-9A-Z]{16}\\b")),
    ("token in a URL", re.compile(r"(?i)[?&](token|api_key|key|secret)=[^&\\s'\\"]{6,}")),
    ("private key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
]

print("1. scanning source text (matches are hidden in the output)")
found = 0
for number, line in enumerate(SAMPLE.splitlines(), start=1):
    for kind, pattern in PATTERNS:
        if pattern.search(line):
            found += 1
            print(f"   line {number}: {kind:<20} {pattern.sub('<hidden>', line)}")
print("   findings:", found, "(a real scanner runs in pre-commit and CI, and blocks the push)")

print()
print("2. look-alike package names")
POPULAR = ["requests", "pandas", "numpy", "pydantic", "sqlalchemy", "httpx", "pytest", "openpyxl", "psycopg", "pyyaml", "fastapi"]
requirements = ["pandas", "reqeusts", "numpyy", "pydantik", "fastapi", "pytes", "kollana-reports"]
for name in requirements:
    if name in POPULAR:
        print(f"   {name:<18} known, spelled exactly")
        continue
    close = difflib.get_close_matches(name, POPULAR, n=1, cutoff=0.8)
    if close:
        print(f"   {name:<18} SUSPICIOUS: one typo away from '{close[0]}'?")
    else:
        print(f"   {name:<18} not on the list: check who publishes it before you install")`,
      note: 'Both tools are small and have limits. The scanner finds patterns, so it misses secrets with unusual shapes and flags harmless look-alikes: that is why teams use proven tools (detect-secrets, gitleaks) and tune them. The name check only knows ten packages; real defences compare against the whole index and look at the publisher. The AKIA value is the documented example key from the AWS documentation, not a real one. The habit is what matters: look at the name, and scan before you push.',
    } },
    { warn: `Things that go wrong with security in Python code:
- **\`startswith\` for path or URL checks.** \`incoming_old\` starts with \`incoming\`, and \`api.example.com.evil.test\` contains \`api.example.com\`. Parse and compare parts.
- **Joining user text to a path and opening it.** Resolve, then check it is inside the base folder; do not extract or write archives without the same check.
- **Fetching a URL you did not choose** without an allow-list, an address check and a redirect check.
- **Comparing signatures with \`==\`**, verifying parsed JSON instead of the raw body, or skipping the timestamp.
- **\`yaml.load\`, \`pickle.loads\`, \`eval\`, \`exec\`** on data from outside. Use \`safe_load\`, JSON, \`literal_eval\`.
- **\`shell=True\` with an f-string.** Pass an argument list.
- **Secrets in code, notebooks, URLs, command-line arguments, screenshots or logs**; a secret committed once must be **rotated**.
- **\`random\` for tokens**, a plain SHA-256 or MD5 for passwords, your own invented encryption.
- **\`verify=False\`** to silence a certificate error.
- **Installing packages by memory of the name**, from chat messages, or with admin rights; unpinned dependencies that change under you.
- **One powerful account for everything.** A leak then gives away everything. Use a role per job with the least privilege.
- **Copying production personal data to a laptop or a test file.** Use synthetic or masked data.` },
    { pychallenge: {
      id: 'python-security-secrets-ch1',
      prompt: 'Write `safe_join(base, user_path)` for names that come from outside. Return the **resolved** absolute `Path` of `base / user_path` if it lies **inside** the base folder (it does not have to exist). Raise `ValueError` if the resolved path is outside the base (a `..` that climbs out, an absolute path, a sibling folder whose name merely starts with the base name) or if it is the base folder itself (an empty name or `.`). Do not use string `startswith`.',
      starter: `from pathlib import Path

def safe_join(base, user_path):
    # TODO: resolve base and (base / user_path); refuse unless the target is strictly inside the base
    return Path(base) / user_path
`,
      tests: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as d:
    root = Path(d)
    base = root / "incoming"
    base.mkdir()
    (root / "incoming_old").mkdir()
    (base / "a.csv").write_text("x", encoding="utf-8")

    assert safe_join(base, "a.csv") == (base / "a.csv").resolve()
    assert safe_join(base, "sub/b.csv") == (base / "sub" / "b.csv").resolve()
    assert safe_join(base, "./a.csv") == (base / "a.csv").resolve()
    assert safe_join(base, "sub/../a.csv") == (base / "a.csv").resolve()
    assert isinstance(safe_join(base, "a.csv"), Path)

    for bad in ["../secret.txt", "../../etc/passwd", "sub/../../x", "../incoming_old/x.csv",
                "/etc/passwd", "", ".", "sub/.."]:
        try:
            safe_join(base, bad)
            raise AssertionError(f"expected ValueError for {bad!r}")
        except ValueError:
            pass`,
      solution: `from pathlib import Path

def safe_join(base, user_path):
    base = Path(base).resolve()
    target = (base / user_path).resolve()
    if target == base or not target.is_relative_to(base):
        raise ValueError(f"path is outside the folder: {user_path!r}")
    return target
`,
      hint: 'Resolve both: `base = Path(base).resolve()` and `target = (base / user_path).resolve()`. Then refuse when `target == base` or `not target.is_relative_to(base)` (this compares path parts, so a sibling folder with a similar name is refused). An absolute `user_path` replaces the base in the `/` operator, so it lands outside and is refused by the same check.',
    } },
    { pychallenge: {
      id: 'python-security-secrets-ch2',
      prompt: 'Write `is_safe_url(url, resolve, allowed_hosts=None)` as an SSRF guard. `resolve(hostname)` returns a list of IP address strings for a host name (it is passed in, so tests need no network). Return `True` only if: the scheme is `https`; there is a host name; there is **no user name or password** in the URL; if `allowed_hosts` is given the host (lower case) is in it; and **every** address is public (`ipaddress.ip_address(x).is_global`; for an IPv4-mapped IPv6 address check the IPv4 address inside it). If the host is already an IP literal, check that address directly. A host that resolves to no address is unsafe. Anything unparseable returns `False`; never raise.',
      starter: `import ipaddress
from urllib.parse import urlsplit

def is_safe_url(url, resolve, allowed_hosts=None):
    # TODO: parse with urlsplit; check scheme, host, credentials, allow-list; check every address is public
    return False
`,
      tests: `hosts = {
    "api.example.com": ["93.184.216.34"],
    "internal.corp": ["10.0.0.5"],
    "mixed.example.com": ["93.184.216.34", "127.0.0.1"],
    "meta.example.com": ["169.254.169.254"],
    "nothing.example.com": [],
    "mapped.example.com": ["::ffff:127.0.0.1"],
    "v6.example.com": ["2606:2800:220:1:248:1893:25c8:1946"],
}

def resolve(host):
    return hosts.get(host, [])

assert is_safe_url("https://api.example.com/rates", resolve) is True
assert is_safe_url("https://v6.example.com/", resolve) is True
assert is_safe_url("https://93.184.216.34/", resolve) is True
assert is_safe_url("http://api.example.com/rates", resolve) is False
assert is_safe_url("ftp://api.example.com/", resolve) is False
assert is_safe_url("https://internal.corp/x", resolve) is False
assert is_safe_url("https://mixed.example.com/", resolve) is False
assert is_safe_url("https://meta.example.com/", resolve) is False
assert is_safe_url("https://mapped.example.com/", resolve) is False
assert is_safe_url("https://nothing.example.com/", resolve) is False
assert is_safe_url("https://169.254.169.254/latest/meta-data/", resolve) is False
assert is_safe_url("https://127.0.0.1:8000/", resolve) is False
assert is_safe_url("https://[::1]/", resolve) is False
assert is_safe_url("https://user:pw@api.example.com/", resolve) is False
assert is_safe_url("https://user@api.example.com/", resolve) is False
assert is_safe_url("https:///nohost", resolve) is False
assert is_safe_url("not a url", resolve) is False
assert is_safe_url("", resolve) is False
assert is_safe_url("https://api.example.com@internal.corp/x", resolve) is False

allow = {"api.example.com"}
assert is_safe_url("https://api.example.com/", resolve, allowed_hosts=allow) is True
assert is_safe_url("https://API.EXAMPLE.COM/", resolve, allowed_hosts=allow) is True
assert is_safe_url("https://api.example.com.evil.test/", resolve, allowed_hosts=allow) is False
assert is_safe_url("https://v6.example.com/", resolve, allowed_hosts=allow) is False`,
      solution: `import ipaddress
from urllib.parse import urlsplit

def is_safe_url(url, resolve, allowed_hosts=None):
    try:
        parts = urlsplit(url)
        host = parts.hostname
    except ValueError:
        return False
    if parts.scheme != "https" or not host or parts.username is not None or parts.password is not None:
        return False
    if allowed_hosts is not None and host.lower() not in {h.lower() for h in allowed_hosts}:
        return False
    try:
        addresses = [str(ipaddress.ip_address(host))]
    except ValueError:
        addresses = list(resolve(host))
    if not addresses:
        return False
    for text in addresses:
        try:
            ip = ipaddress.ip_address(text)
        except ValueError:
            return False
        mapped = getattr(ip, "ipv4_mapped", None)
        if mapped is not None:
            ip = mapped
        if not ip.is_global or ip.is_multicast:
            return False
    return True
`,
      hint: 'Parse with `urlsplit` (inside `try/except ValueError`). Return `False` unless `parts.scheme == "https"`, there is a `parts.hostname`, and `parts.username` and `parts.password` are `None`. If `allowed_hosts` is given, check the lower-case host against it. Try `ipaddress.ip_address(host)`: if that works the host is an IP literal; otherwise call `resolve(host)`. For each address take `ip.ipv4_mapped` when it exists and require `ip.is_global`. An empty list of addresses is `False`.',
    } },
    { pychallenge: {
      id: 'python-security-secrets-ch3',
      prompt: 'Write `verify_webhook(secret, body, signature, timestamp, now, tolerance=300)`. `secret` and `body` are `bytes`; `signature` is the header text `"sha256=<hex>"`; `timestamp` and `now` are integer seconds. The signed message is `str(timestamp).encode() + b"." + body`, and the expected signature is `"sha256=" +` the hex of `HMAC-SHA256(secret, message)`. Return `True` only if the timestamp is within `tolerance` seconds of `now` (in either direction; exactly `tolerance` is still fine) **and** the signature matches, compared with `hmac.compare_digest` on **bytes** (the hex may be in any letter case). Never raise: a missing prefix, wrong text, non-ASCII text or `None` returns `False`.',
      starter: `import hashlib
import hmac

def verify_webhook(secret, body, signature, timestamp, now, tolerance=300):
    # TODO: check the age, recompute the HMAC over timestamp + "." + body, compare in constant time
    return False
`,
      tests: `import hashlib
import hmac

SECRET = b"demo-only-secret"

def sign(secret, body, ts):
    return "sha256=" + hmac.new(secret, str(ts).encode() + b"." + body, hashlib.sha256).hexdigest()

body = b'{"event": "payment.received", "amount": "125000.50"}'
now = 1_790_000_000
good = sign(SECRET, body, now)

assert verify_webhook(SECRET, body, good, now, now) is True
assert verify_webhook(SECRET, body, good, now, now + 300) is True
assert verify_webhook(SECRET, body, good, now, now + 301) is False
assert verify_webhook(SECRET, body, sign(SECRET, body, now - 100), now - 100, now) is True
assert verify_webhook(SECRET, body, sign(SECRET, body, now + 400), now + 400, now) is False
assert verify_webhook(SECRET, body + b" ", good, now, now) is False
assert verify_webhook(b"other-secret", body, good, now, now) is False
assert verify_webhook(SECRET, body, good, now + 1, now) is False
assert verify_webhook(SECRET, body, good.upper().replace("SHA256=", "sha256="), now, now) is True
assert verify_webhook(SECRET, body, good.replace("sha256=", "md5="), now, now) is False
assert verify_webhook(SECRET, body, good[len("sha256="):], now, now) is False
assert verify_webhook(SECRET, body, "sha256=" + "é" * 64, now, now) is False
assert verify_webhook(SECRET, body, "", now, now) is False
assert verify_webhook(SECRET, body, None, now, now) is False
assert verify_webhook(SECRET, body, good, now, now, tolerance=0) is True
assert verify_webhook(SECRET, body, good, now - 1, now, tolerance=0) is False`,
      solution: `import hashlib
import hmac

def verify_webhook(secret, body, signature, timestamp, now, tolerance=300):
    if not isinstance(signature, str) or not signature.startswith("sha256="):
        return False
    if abs(now - timestamp) > tolerance:
        return False
    message = str(timestamp).encode() + b"." + body
    expected = "sha256=" + hmac.new(secret, message, hashlib.sha256).hexdigest()
    received = "sha256=" + signature[len("sha256="):].lower()
    return hmac.compare_digest(expected.encode("utf-8"), received.encode("utf-8"))
`,
      hint: 'First reject anything that is not a string starting with "sha256=". Then check `abs(now - timestamp) > tolerance`. Recompute `hmac.new(secret, str(timestamp).encode() + b"." + body, hashlib.sha256).hexdigest()`. Lower-case the received hex part, then compare **bytes** with `hmac.compare_digest(expected.encode(), received.encode())`: encoding first means non-ASCII input cannot make `compare_digest` raise.',
    } },
    { pychallenge: {
      id: 'python-security-secrets-ch4',
      prompt: 'Write `redact_url(url)` so a URL can be logged safely. (1) A **password** in the user-info part (`scheme://user:password@host`) becomes `***`; the user name stays. A user name without a password is unchanged. (2) In the query string, the value of any parameter whose name (case-insensitive) is `password`, `passwd`, `pwd`, `token`, `secret`, `api_key`, `apikey`, `key`, `access_token`, `signature` or `sig` becomes `***` (even when the value is empty). All other parameters, the path and the fragment stay exactly as they were, and the order does not change. A URL without a query or credentials comes back unchanged.',
      starter: `from urllib.parse import urlsplit, urlunsplit

def redact_url(url):
    # TODO: hide the password in the user-info and the values of sensitive query parameters
    return url
`,
      tests: `assert redact_url("postgresql://etl:S3cr3t@db.internal:5432/fde?sslmode=require") == "postgresql://etl:***@db.internal:5432/fde?sslmode=require"
assert redact_url("https://api.example.com/rates?token=abc123&page=2") == "https://api.example.com/rates?token=***&page=2"
assert redact_url("https://api.example.com/x?API_KEY=k1&Signature=zz&q=1") == "https://api.example.com/x?API_KEY=***&Signature=***&q=1"
assert redact_url("https://api.example.com/x") == "https://api.example.com/x"
assert redact_url("https://user@host.example/x") == "https://user@host.example/x"
assert redact_url("postgresql://etl:p%40ss@db/fde") == "postgresql://etl:***@db/fde"
assert redact_url("https://h.example/p?a=1&token=&b=2") == "https://h.example/p?a=1&token=***&b=2"
assert redact_url("https://h.example/p?note=token=abc&x=1") == "https://h.example/p?note=token=abc&x=1"
assert redact_url("https://u:pw@h.example/p?sig=xyz#section") == "https://u:***@h.example/p?sig=***#section"
assert redact_url("https://h.example/p?flag&token=abc") == "https://h.example/p?flag&token=***"`,
      solution: `from urllib.parse import urlsplit, urlunsplit

SENSITIVE = {"password", "passwd", "pwd", "token", "secret", "api_key", "apikey", "key",
             "access_token", "signature", "sig"}

def redact_url(url):
    parts = urlsplit(url)
    netloc = parts.netloc
    if "@" in netloc:
        userinfo, _, hostport = netloc.rpartition("@")
        if ":" in userinfo:
            user = userinfo.partition(":")[0]
            netloc = f"{user}:***@{hostport}"
    query = parts.query
    if query:
        pieces = []
        for piece in query.split("&"):
            name, equals, _ = piece.partition("=")
            if equals and name.lower() in SENSITIVE:
                piece = f"{name}=***"
            pieces.append(piece)
        query = "&".join(pieces)
    return urlunsplit((parts.scheme, netloc, parts.path, query, parts.fragment))
`,
      hint: 'Use `urlsplit`. In `parts.netloc`, split at the last "@" with `rpartition`; if the user-info contains ":" keep the part before it and write `user:***`. For the query, split on "&", then for each piece use `name, equals, value = piece.partition("=")` and replace the piece with `name=***` when `equals` is not empty and `name.lower()` is in your set. Join the pieces with "&" (do not re-encode them) and rebuild with `urlunsplit`.',
    } },
    { real: 'In a data-engineering job these habits show up in code review and in the questions you are asked. "How do you handle secrets?" (environment, vault, never logged, scanner in pre-commit, rotate on leak). "How do you stop SQL injection?" (parameters, the Databases lesson). "A vendor can upload a zip: what could go wrong?" (zip slip, size, file types, a quarantine folder). "Your service fetches a customer-supplied URL" (SSRF guard, allow-list). "You receive webhooks from a bank" (signature, timestamp, idempotency). When you add a new dependency to Project A, write one line in the README: what it is for and who maintains it. Small, visible habits like these are what make an automation engineer trusted with real data.' },
    { interview: `**"How do you handle secrets in a Python project?"**
Model answer: "They never go in code, in the repository or in logs. I load them at start-up from environment variables or a secret store such as Key Vault into a settings object with \`SecretStr\`, and the job fails fast if one is missing. A pre-commit hook and CI run a secret scanner. Each job gets its own least-privilege credential. If a secret is ever committed or logged, I rotate it, because removing it from the file does not remove it from history."

**"What is path traversal and how do you prevent it?"** "It is when a file name from outside contains \`..\` or is absolute and makes the program read or write outside the intended folder. I join the name to the base folder, resolve the result, and check that it is still inside the resolved base with \`is_relative_to\`, not with \`startswith\`. The same applies when extracting archives (zip slip)."

**"What is SSRF?"** "Server-side request forgery: an attacker makes my server request a URL of their choice, for example an internal service or the cloud metadata endpoint. I defend with an allow-list of hosts, https only, parsing the URL instead of searching text, resolving the host and refusing non-public addresses, re-checking redirects, and giving the server minimal rights."

**"How do you verify a webhook?"** "The sender signs the timestamp and raw body with a shared secret using HMAC-SHA256. I recompute it over the raw bytes, compare with \`hmac.compare_digest\` so timing does not leak, and reject messages outside a short time window to prevent replays. I also make the handler idempotent."

**"Is it safe to \`pickle.load\` or \`yaml.load\` a file?"** "Only for data I created myself. Pickle can execute code chosen by whoever wrote the file, and so can \`yaml.load\` with an unsafe loader. For untrusted input I use JSON, CSV or Parquet, \`yaml.safe_load\`, and \`ast.literal_eval\` instead of \`eval\`."` },
    `## Recap
- Treat everything from **outside** as untrusted: validate with **allow-lists**, give code the **least privilege**, keep **secrets** out of code, URLs, arguments and logs, and keep **dependencies** few and known.
- **Path traversal and zip slip:** \`(base / name).resolve()\` then \`is_relative_to(base.resolve())\`; never \`startswith\`; an absolute name replaces the base. **SSRF:** https only, host from \`urlsplit\`, allow-list, every resolved address \`is_global\`, re-check redirects.
- **Webhooks:** HMAC-SHA256 over the **raw** body plus a signed **timestamp**, compared with \`hmac.compare_digest\`, with an age check and idempotent handling.
- **Never load or run untrusted data** with \`pickle\`, an unsafe \`yaml.load\`, \`eval\`, \`exec\` or \`shell=True\`: use JSON, \`yaml.safe_load\`, \`ast.literal_eval\`, argument **lists**, and SQL **parameters**. Use \`secrets\`, not \`random\`; a **slow salted** hash (scrypt, argon2, bcrypt) for passwords; never \`verify=False\`.
- **Secrets:** environment into \`SecretStr\`, secret scanner in pre-commit and CI, **rotate** after any leak, **redact** URLs and tokens before logging. **Dependencies:** check names (typosquatting), pin and lock with hashes, scan with \`pip-audit\`, install from the official index, never as administrator.`,
  ],
  quiz: [
    { q: 'Why is `str(path).startswith(str(base))` a bad check that a path is inside a folder?', o: ['it compares text, so a sibling folder such as incoming_old passes as "inside" incoming; use resolve() and is_relative_to', 'it is too slow', 'it only works on Linux', 'it cannot handle spaces'], a: 0, why: 'Text prefixes are not folder relationships. is_relative_to compares whole path parts after resolve() has removed ".." and followed links.' },
    { q: 'Which check best protects a function that downloads a URL given by a user?', o: ['check that the text "example.com" is in the URL', 'call the URL with a short timeout', 'strip the word "localhost"', 'only https, parse the host name, use an allow-list, resolve and refuse non-public addresses, and re-check redirects'], a: 3, why: 'Text searches are fooled by user:pass@evil.test and look-alike names. Parse the host, allow-list it, and refuse addresses that are not public to block SSRF.' },
    { q: 'Why compare webhook signatures with `hmac.compare_digest` instead of `==`?', o: ['`==` does not work on bytes', 'compare_digest is shorter', 'compare_digest takes the same time wherever the first difference is, so timing cannot leak the signature', 'it also checks the timestamp'], a: 2, why: 'A normal comparison can stop at the first different character; measuring that tiny timing difference can help an attacker build a valid signature.' },
    { q: 'A signed webhook from last week is sent to you again. Its signature is valid. How do you stop it?', o: ['you cannot', 'include a timestamp in the signed text and reject messages outside a short window (and store event ids)', 'change the secret every minute', 'compare with `==`'], a: 1, why: 'A replay carries a genuine signature. Signing the timestamp and checking its age rejects old messages, and idempotent handling makes a repeat harmless.' },
    { q: 'What is the safest way to read a YAML config file from a vendor?', o: ['`yaml.load(text, Loader=yaml.UnsafeLoader)`', '`eval(text)`', '`yaml.safe_load(text)`, which builds only plain data', '`pickle.loads(text)`'], a: 2, why: 'safe_load cannot build arbitrary Python objects or call functions. The unsafe YAML loader, eval and pickle can execute code chosen by the file author.' },
    { q: 'You committed a database password to Git by mistake and deleted it in the next commit. What must you do?', o: ['nothing: it is deleted', 'rotate the password (create a new one and disable the old), because the old value stays in the history', 'rename the repository', 'make the repository private and keep the password'], a: 1, why: 'Anything committed lives in the history and may already be copied. The only safe fix is to invalidate the leaked secret.' },
  ],
  task: {
    title: 'Harden a small file-and-URL loader and scan your own project',
    steps: [
      'In `C:\\fde\\py-recap` create `security_practice.py` with `safe_join` (challenge 1). Make a folder `incoming`, a sibling `incoming_old` and a `secrets\\fake.env`. Test the six cases from the lesson, including a name with `..` and one with a drive letter, and print which are refused.',
      'Write a function `unpack(zip_path, target)` that checks every member name with `safe_join`, refuses a total uncompressed size above a limit you choose (use `ZipInfo.file_size`), and extracts only `.csv` files. Build a hostile zip like the one in the lesson and show it is refused or cleaned.',
      'Write `is_safe_url` (challenge 2) with a real resolver using `socket.getaddrinfo` (it returns the addresses for a host name). Test it on `https://example.com`, `https://localhost:8000`, `https://127.0.0.1`, and a name you control that points at 127.0.0.1 if you can (or a fake resolver).',
      'Write `verify_webhook` (challenge 3). Extend the practice API from the HTTP lesson with `POST /webhook` that verifies a signed body and returns 401 when the check fails. Send a good call, a tampered call and a replayed call with `requests` and print the three status codes.',
      'Write `redact_url` (challenge 4) and apply it in a logging `Filter` so no URL with a token or password reaches `run.log`. Log your database URL and show the log line.',
      'Run `pip install pip-audit detect-secrets` (check the current docs for the commands) in your `kollana-reports` project: run `pip-audit` on your lock file and a secret scan on the repository. Write down what each tool found and what you did about it.',
    ],
    deliverable: '`security_practice.py` with the four guards and their test output, the 401/200 results of the webhook test, a log line with the redacted URL, and the output of `pip-audit` and the secret scan.',
  },
};
