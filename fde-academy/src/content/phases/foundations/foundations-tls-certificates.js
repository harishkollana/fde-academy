export default {
  id: 'foundations-tls-certificates',
  title: 'TLS, certificates and the chain of trust',
  goal: 'You can explain what the TLS handshake achieves, read a certificate (subject, SAN, issuer, validity), describe the chain of trust, and diagnose the five common certificate errors.',
  roadmap: ['TLS handshake and HTTPS', 'Certificates, CAs and the chain of trust', 'Mutual TLS'],
  blocks: [
    `## The problem
A Python script that has worked for a year suddenly prints:
\`ssl.SSLCertVerificationError: certificate verify failed: certificate has expired\`
Or you run the same script from the office and get \`unable to get local issuer certificate\`, while it works at home.

Both are **TLS** problems. Almost every connection in this course is wrapped in TLS: HTTPS to APIs, the Azure portal, database connections in the cloud, Kafka brokers, OAuth redirects. You do not need cryptography theory, but you do need to know what TLS promises, how a certificate proves it, and what the usual failures mean.

## What TLS gives you
**TLS** (*Transport Layer Security*, the successor of SSL) wraps a connection and gives three guarantees:
1. **Confidentiality**: nobody on the path (Wi-Fi owner, ISP, a proxy) can read the data.
2. **Integrity**: nobody can change the data without being detected.
3. **Authentication**: you are really talking to \`api.kollana-tech.in\` and not an impostor.

HTTPS is simply HTTP carried inside TLS. Use TLS 1.2 or 1.3; versions 1.0 and 1.1 are retired.

## Two kinds of encryption, used together
- **Asymmetric** (public-key) cryptography uses a pair of keys: what one locks, only the other can unlock. It is slow, but it lets two strangers agree on a secret without ever having met, and it lets a server *sign* something to prove who it is.
- **Symmetric** cryptography uses one shared key for both locking and unlocking. It is very fast, so it carries the actual data.

TLS uses the slow asymmetric part only to **agree on a fresh shared key** and to **prove identity**, then switches to fast symmetric encryption for everything else. In TLS 1.3 the key agreement uses a new temporary key pair for every connection (called *ephemeral* Diffie-Hellman), so even if the server's long-term key leaks later, old recorded traffic stays unreadable. That property is called **forward secrecy**.`,
    { sketch: { w: 760, h: 330, caption: 'The TLS handshake (simplified, TLS 1.3): agree on keys, prove identity, then send encrypted HTTP', items: [
      { t: 'box', x: 70, y: 8, w: 150, h: 40, label: 'Client (browser)', fill: 'yellow', size: 16 },
      { t: 'box', x: 540, y: 8, w: 150, h: 40, label: 'Server', fill: 'green', size: 16 },
      { t: 'line', x1: 145, y1: 48, x2: 145, y2: 318, dashed: true },
      { t: 'line', x1: 615, y1: 48, x2: 615, y2: 318, dashed: true },
      { t: 'arrow', x1: 145, y1: 78, x2: 612, y2: 78, label: '1  ClientHello: versions, ciphers, server name (SNI), key share' },
      { t: 'arrow', x1: 612, y1: 124, x2: 148, y2: 124, label: '2  ServerHello + certificate chain + signature + key share' },
      { t: 'note', x: 175, y: 146, w: 410, h: 50, text: '3  Client checks: chain to a trusted root? name matches?\ndates valid? signature OK?  Both sides now derive the same keys.', fill: 'pink', size: 14 },
      { t: 'arrow', x1: 145, y1: 224, x2: 612, y2: 224, label: '4  Finished (encrypted)' },
      { t: 'arrow', x1: 612, y1: 260, x2: 148, y2: 260, label: '4  Finished (encrypted)' },
      { t: 'arrow', x1: 145, y1: 304, x2: 612, y2: 304, label: '5  GET /v1/jobs (HTTP, now encrypted)', color: '#2f9e44' },
    ] } },
    `## Certificates: how the server proves who it is
Anyone can claim to be \`api.kollana-tech.in\`. A **certificate** (format **X.509**) is a signed statement: *"this public key belongs to this name"*. It contains:
- **Subject / SAN** (*Subject Alternative Names*): the host names it is valid for, such as \`api.kollana-tech.in\` or the wildcard \`*.kollana-tech.in\` (which matches one label, so \`api.kollana-tech.in\` yes, \`a.b.kollana-tech.in\` no, \`kollana-tech.in\` no).
- **Public key** of the server.
- **Issuer**: who signed it.
- **Validity**: *not before* and *not after* dates.
- A **signature** from the issuer.

Who signs? A **Certificate Authority (CA)**: an organisation that checks you control the name and then signs your certificate. Your operating system and browser ship with a **trust store** of root CAs they believe. Roots rarely sign servers directly; they sign **intermediate** CAs, which sign your **leaf** certificate. The result is a **chain of trust**:

\`leaf (api.kollana-tech.in)\` → signed by \`intermediate CA\` → signed by \`root CA\` (in your trust store).

The client walks the chain: is each certificate signed by the next, is every date valid, does the leaf match the host name I asked for, and does the chain end at a root I trust? Any "no" is a failure. Modern CAs issue certificates that are valid for months, not years, with **automatic renewal** (the ACME protocol). Manual yearly renewal is how companies get surprised.

## Other terms you will meet
- **SNI** (*Server Name Indication*): the client sends the host name in the ClientHello so one IP address can serve many sites, each with its own certificate.
- **TLS termination**: a load balancer or gateway decrypts TLS and forwards plain HTTP (or re-encrypts) to the app behind it. Many cloud services work this way.
- **Mutual TLS (mTLS)**: the *client* also presents a certificate, so the server knows exactly which client is calling. Used between internal services and by some bank and tax-system APIs.
- **Self-signed** certificate: signed by itself, not by a CA. Fine for a local dev server, but clients rightly refuse it by default.

Play with the logic below. The tiny numbers make the key-agreement trick visible: two parties publish a few numbers, keep one each secret, and end with the same shared key.`,
    { py: {
      title: 'Key agreement with tiny numbers (Diffie-Hellman)',
      starter: `# Real TLS uses numbers with hundreds of digits. Tiny ones show the idea.
p, g = 23, 5              # public: everyone, including an eavesdropper, can see these

a = 6                     # the client's SECRET, never sent
b = 15                    # the server's SECRET, never sent

A = pow(g, a, p)          # client sends this (g^a mod p)
B = pow(g, b, p)          # server sends this (g^b mod p)
print("sent over the wire:", A, B)

client_key = pow(B, a, p)         # (g^b)^a mod p
server_key = pow(A, b, p)         # (g^a)^b mod p
print("client computes:", client_key, "| server computes:", server_key)
print("same shared secret:", client_key == server_key)

# An eavesdropper knows p, g, A and B but not a or b. With big numbers, finding a from A is infeasible.`,
      note: 'This only agrees a key. It does not prove who you are talking to. That is the certificate\'s job, otherwise a man in the middle could do the maths with each side separately.',
    } },
    { pychallenge: {
      id: 'foundations-pych-chain',
      prompt: 'Write `check_chain(chain, trusted_roots, host, today)` (chain is a list of dicts, leaf first) and return the **first problem found, checking in this order**: (1) `"hostname mismatch"` if no name in the leaf\'s `names` matches `host`; a name matches if it is equal, or it is a wildcard `*.x.y` and `host` is exactly one label followed by `.x.y`. (2) `"expired"` if any certificate has `today > not_after`. (3) `"not yet valid"` if any has `today < not_before`. (4) `"broken chain"` if some certificate\'s `issuer` is not the `subject` of the next one. (5) `"untrusted root"` if the **last** certificate\'s `subject` is not in `trusted_roots`. If all pass, return `"ok"`. Dates are ISO strings like `"2026-09-30"`, which compare correctly as text.',
      starter: `def check_chain(chain, trusted_roots, host, today):
    return "ok"`,
      tests: `def cert(subject, issuer, names=None, nb="2026-01-01", na="2027-01-01"):
    return {"subject": subject, "issuer": issuer, "names": names or [subject], "not_before": nb, "not_after": na}

root = cert("Root CA", "Root CA")
inter = cert("Issuing CA 1", "Root CA")
leaf = cert("api.kollana-tech.in", "Issuing CA 1")
trust = {"Root CA"}
T = "2026-09-30"
assert check_chain([leaf, inter, root], trust, "api.kollana-tech.in", T) == "ok"
wild = cert("wild", "Issuing CA 1", names=["*.kollana-tech.in"])
assert check_chain([wild, inter, root], trust, "api.kollana-tech.in", T) == "ok"
assert check_chain([wild, inter, root], trust, "a.b.kollana-tech.in", T) == "hostname mismatch"
assert check_chain([wild, inter, root], trust, "kollana-tech.in", T) == "hostname mismatch"
assert check_chain([leaf, inter, root], trust, "evil.example", T) == "hostname mismatch"
old = cert("api.kollana-tech.in", "Issuing CA 1", na="2026-06-30")
assert check_chain([old, inter, root], trust, "api.kollana-tech.in", T) == "expired"
young = cert("api.kollana-tech.in", "Issuing CA 1", nb="2026-12-01")
assert check_chain([young, inter, root], trust, "api.kollana-tech.in", T) == "not yet valid"
stranger = cert("Other CA", "Root CA")
assert check_chain([leaf, stranger, root], trust, "api.kollana-tech.in", T) == "broken chain"
assert check_chain([leaf, inter, root], {"Some Other Root"}, "api.kollana-tech.in", T) == "untrusted root"`,
      solution: `def _matches(name, host):
    if name == host:
        return True
    if name.startswith("*."):
        first, _, rest = host.partition(".")
        return bool(first) and rest == name[2:]
    return False

def check_chain(chain, trusted_roots, host, today):
    if not any(_matches(n, host) for n in chain[0]["names"]):
        return "hostname mismatch"
    if any(today > c["not_after"] for c in chain):
        return "expired"
    if any(today < c["not_before"] for c in chain):
        return "not yet valid"
    for cur, nxt in zip(chain, chain[1:]):
        if cur["issuer"] != nxt["subject"]:
            return "broken chain"
    if chain[-1]["subject"] not in trusted_roots:
        return "untrusted root"
    return "ok"`,
      hint: 'Write a small helper for the wildcard rule first: split the host at the first dot and compare the rest with the wildcard name minus "*.". Then do the five checks in order.',
    } },
    `## The five certificate errors, and what each means
| Error text (typical) | Meaning | Fix |
|---|---|---|
| *certificate has expired* | A certificate in the chain is past its end date | Renew it; automate renewal; alert 30, 14, 7 days before |
| *hostname mismatch / no alternative names match* | You connected to a name that is not in the certificate | Use the correct name, or reissue with the right SAN |
| *unable to get local issuer certificate* | Your machine does not trust the issuer (missing intermediate, or a corporate proxy re-signs traffic) | Install the missing intermediate on the server, or add your company CA to the trust bundle |
| *self-signed certificate* | The chain ends at something nobody trusts | Dev only: trust it deliberately. Production: use a real CA |
| *certificate is not yet valid* | Your **clock is wrong** or the certificate was issued for the future | Fix the system time |

Many offices run a proxy that **inspects TLS**: it decrypts and re-encrypts traffic using its own company CA. Browsers on managed laptops trust that CA, but a fresh Python install may not, hence \`CERTIFICATE_VERIFY_FAILED\` only at work. The fix is to point Python at the company CA bundle (for \`requests\`, the \`REQUESTS_CA_BUNDLE\` environment variable or \`verify="path/to/bundle.pem"\`). **Never** "fix" it with \`verify=False\`: that switches off the authentication guarantee and an attacker could sit in the middle.`,
    { local: '**Inspect a real certificate.**\n1. In Edge or Chrome open any HTTPS site, click the padlock, then *Connection is secure → Certificate*. Find the **Subject Alternative Names**, **Issued by**, **Valid from/to** and the **Certification Path** (leaf → intermediate → root).\n2. Press `Win + R`, type `certmgr.msc` and open *Trusted Root Certification Authorities*. That is the trust store your Windows programs use.\n3. From Python (needs internet; run in VS Code, not the browser):\n```python\nimport socket, ssl\nctx = ssl.create_default_context()\nwith socket.create_connection(("example.com", 443)) as sock:\n    with ctx.wrap_socket(sock, server_hostname="example.com") as tls:\n        cert = tls.getpeercert()\n        print(tls.version(), cert["notAfter"])\n        print([name for kind, name in cert["subjectAltName"]])\n```\nExpected: a version such as `TLSv1.3`, an expiry date, and a list of names. If you are on a corporate network and see `CERTIFICATE_VERIFY_FAILED`, you have just reproduced the proxy case from this lesson.' },
    { warn: 'Certificate expiry is the most avoidable outage in the industry. Put every certificate you own in a list with its **expiry date and owner**, automate renewal where possible, and run a monitor that alerts at 30, 14 and 7 days. A forgotten certificate takes a whole service down at 3 am on a holiday.' },
    { interview: '**"Explain what happens in an HTTPS handshake."** Model answer: "The client sends a hello with supported versions, ciphers, the server name and a key share. The server replies with its choice, a certificate chain, a signature proving it holds the private key, and its own key share. The client verifies the chain to a trusted root, the host name and the dates, and both sides derive the same session keys. After that everything is encrypted with a fast symmetric cipher. With ephemeral keys we get forward secrecy." If you can add "and mTLS means the client presents a certificate too", you have covered the usual follow-up.' },
    { real: 'Your Azure Function behind Power Automate will sit on a \`*.azurewebsites.net\` name with a Microsoft-managed certificate: you do nothing. When you add \`api.kollana-tech.in\` as a custom domain you also bind your own certificate and become responsible for renewal. Knowing that boundary (what the platform renews for you, and what you must) is a practical FDE skill.' },
    `## Recap
- **TLS** gives confidentiality, integrity and authentication. HTTPS = HTTP inside TLS (use 1.2 or 1.3).
- Slow **asymmetric** crypto agrees a key and proves identity; fast **symmetric** crypto carries the data. Ephemeral keys give **forward secrecy**.
- A **certificate** binds a name to a public key and is signed by a **CA**. Clients verify the **chain** (leaf → intermediate → root), the **name (SAN)**, the **dates** and the **signature**.
- **SNI** lets many sites share one IP; **TLS termination** decrypts at the gateway; **mTLS** authenticates the client too.
- Common errors: expired, hostname mismatch, unknown issuer (often a corporate proxy), self-signed, clock wrong. Never use \`verify=False\`.`,
  ],
  quiz: [
    { q: 'Why does TLS switch to symmetric encryption after the handshake?', o: ['Symmetric keys are more secure', 'Asymmetric keys expire', 'Browsers require it', 'Symmetric encryption is much faster for bulk data'], a: 3, why: 'Asymmetric crypto is used only to agree on a key and to prove identity. Fast symmetric crypto then carries the traffic.' },
    { q: 'A wildcard certificate for *.kollana-tech.in is presented for a.b.kollana-tech.in. Result?', o: ['Valid', 'Hostname mismatch: a wildcard matches exactly one label', 'Expired', 'Valid only on port 443'], a: 1, why: 'The wildcard covers api.kollana-tech.in but not two labels deep, and not the bare domain.' },
    { q: 'Your script fails with "unable to get local issuer certificate" only on the office network. Most likely cause?', o: ['The server is down', 'Your password expired', 'A corporate proxy re-signs TLS traffic with a company CA your Python does not trust', 'DNS is slow'], a: 2, why: 'TLS inspection replaces the certificate with one signed by the company CA. Add that CA to the bundle; do not disable verification.' },
    { q: 'What does the client check to be sure a certificate chain is trustworthy?', o: ['Each link is signed by the next, dates are valid, the name matches, and the chain ends at a trusted root', 'Only the expiry date', 'That the server uses port 443', 'That the certificate is large'], a: 0, why: 'All of these checks together establish authentication; any failure aborts the connection.' },
    { q: 'What is mutual TLS (mTLS)?', o: ['Two servers sharing one certificate', 'Both client and server present certificates so each side is authenticated', 'TLS without encryption', 'A faster handshake'], a: 1, why: 'In normal TLS only the server proves its identity. mTLS adds a client certificate.' },
    { q: 'Which is the right response to CERTIFICATE_VERIFY_FAILED in a production script?', o: ['Set verify=False', 'Find out why the chain fails and fix the trust or the certificate', 'Switch to http://', 'Ignore it and retry'], a: 1, why: 'Disabling verification removes the authentication guarantee. Diagnose the chain instead.' },
  ],
  task: {
    title: 'Inspect and monitor certificates',
    steps: [
      'Open three HTTPS sites you use at work (or `example.com`, your bank and a government site). For each, write down the issuer, the expiry date and one SAN.',
      'Open `certmgr.msc` and find two root certificates. Note who issued them and until when they are valid.',
      'Run the Python snippet from the callout and compute days until expiry for one site. Then write a 5-line script that prints a WARNING when a site has fewer than 30 days left.',
    ],
    deliverable: 'A table of three sites with issuer, expiry and days left, plus your expiry-warning script saved as `cert_expiry_check.py`.',
  },
};
