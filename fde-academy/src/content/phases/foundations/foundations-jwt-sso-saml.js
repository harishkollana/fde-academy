export default {
  id: 'foundations-jwt-sso-saml',
  title: 'JWT, single sign-on and SAML',
  goal: 'You can read a JWT, explain how an API trusts it without calling the identity provider, list the checks a validator must make, and compare SAML with OpenID Connect for single sign-on.',
  roadmap: ['JWT structure and validation', 'JWKS and key rotation', 'SSO, SAML vs OIDC, federation'],
  blocks: [
    `## The problem
Your API receives \`Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOi...\`. It is a long string with two dots. Three questions:
1. What is inside it?
2. How does the API *trust* it, without phoning the identity provider on every request?
3. What checks must it make before acting on it?

The string is a **JWT** (*JSON Web Token*, said "jot"). It is the format of most access tokens and every OpenID Connect ID token.

## Anatomy of a JWT
A JWT is three parts joined by dots: \`header.payload.signature\`. The first two are JSON, encoded with **base64url**; the third is a cryptographic signature.
- **Header**: the signing algorithm and key id: \`{"alg": "RS256", "typ": "JWT", "kid": "abc123"}\`.
- **Payload**: the **claims**, statements about the subject.
- **Signature**: proof that the header and payload were produced by the holder of the signing key and have not been changed.

Common claims (the short names are standard):
| Claim | Meaning | You must check |
|---|---|---|
| \`iss\` | **Issuer**: who created the token | equals the identity provider you trust |
| \`sub\` | **Subject**: who the token is about | (identifies the user or app) |
| \`aud\` | **Audience**: who the token is for | equals **your** API |
| \`exp\` | **Expiry** (Unix time) | now is before it |
| \`nbf\` / \`iat\` | Not before / issued at | now is after nbf |
| \`scp\` / \`roles\` | Delegated scopes / app roles | contains what this endpoint needs |

Try the decoder: change the payload and watch what happens to the signature.`,
    { widget: 'JwtDecoder' },
    `## How can the API trust it without asking?
Because of the **signature**. There are two families:
- **Symmetric, HS256**: one shared secret signs and verifies. Simple, but anyone who can *verify* can also *forge*. Fine inside one system; wrong when many separate APIs must check tokens from a provider.
- **Asymmetric, RS256 or ES256**: the identity provider signs with a **private key** only it holds; anyone can verify with the matching **public key**. Your API can check tokens but cannot make them. This is what Entra ID and other providers use.

The public keys are published at a **JWKS** (*JSON Web Key Set*) URL. The token header's \`kid\` says which key was used. The API downloads the keys once, **caches** them, and re-fetches when it sees an unknown \`kid\`. That is how the provider can **rotate keys** without telling you.

## The validation checklist
Every API that accepts JWTs must do all of these, in code or through a trusted library:
1. **Parse safely**; reject anything malformed.
2. **Allow-list the algorithm.** Never trust the token's own \`alg\` header blindly. Attackers have forged tokens with \`"alg": "none"\` (no signature) or by switching RS256 to HS256 and signing with the public key. Decide in your code which algorithm you accept.
3. **Verify the signature** using the right key (by \`kid\`).
4. Check **\`iss\`** is your provider, **\`aud\`** is your API, **\`exp\`** has not passed (allow a few seconds of clock skew), and **\`nbf\`** has begun.
5. Then do **authorization**: do \`scp\` or \`roles\` allow *this* action?

A JWT that passes 1 to 4 proves who issued it and that it was not changed. It does **not** prove the user is still allowed today; that is why lifetimes are short.

## Limits you must know
- **Signed, not encrypted.** Anyone holding the token can decode and read the payload (it is only base64). Put nothing secret in it, and only the data the API needs.
- **Hard to revoke.** Stateless validation means a token stays valid until \`exp\`, even if the user is fired a minute later. Keep access tokens short (minutes to an hour), use refresh tokens, and for emergencies keep a small deny-list or use reference ("opaque") tokens with an introspection call.
- **Size.** Tokens ride on every request. Stuffing many claims in makes headers large.

Here is the entire mechanism for HS256 in 25 lines. Tamper with the payload and the signature check fails.`,
    { py: {
      title: 'Create and verify a JWT by hand (HS256)',
      starter: `import base64, hashlib, hmac, json, time

def b64url(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

def b64url_decode(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def sign(payload, secret):
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    body = b64url(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    return f"{header}.{body}.{b64url(sig)}"

def check_signature(token, secret):
    header, body, sig = token.split(".")
    expected = hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    return hmac.compare_digest(expected, b64url_decode(sig))

secret = "keep-this-on-the-server"
token = sign({"sub": "asha", "role": "viewer", "aud": "payroll-api", "exp": int(time.time()) + 600}, secret)
print(token, "\\n")
print("payload anyone can read:", json.loads(b64url_decode(token.split(".")[1])))
print("valid signature      :", check_signature(token, secret))

# An attacker edits the payload to become admin but cannot recompute the signature
h, p, s = token.split(".")
forged_body = b64url(json.dumps({"sub": "asha", "role": "admin", "aud": "payroll-api", "exp": 9999999999}).encode())
print("forged token accepted:", check_signature(f"{h}.{forged_body}.{s}", secret))`,
      note: 'The attacker can read and rewrite the payload, but without the secret they cannot produce a matching signature. With RS256 the only difference is that the private key signs and the public key verifies.',
    } },
    { pychallenge: {
      id: 'foundations-pych-verify-jwt',
      prompt: 'Write `verify_jwt(token, secret, now, audience)` for **HS256** tokens. Return the payload dict if valid, otherwise raise `ValueError` with exactly one of these messages, checking in this order: `"malformed token"` (not three dot-separated parts, or the header/payload are not valid base64 JSON), `"unsupported algorithm"` (header `alg` is not `HS256`, so `none` is rejected), `"bad signature"`, `"expired"` (`now >= exp`), `"wrong audience"` (`aud` differs from `audience`). Compare signatures with `hmac.compare_digest`.',
      starter: `import base64, hashlib, hmac, json

def verify_jwt(token, secret, now, audience):
    return {}`,
      tests: `import base64, hashlib, hmac, json
def b64(b): return base64.urlsafe_b64encode(b).rstrip(b"=").decode()
def make(payload, secret, alg="HS256"):
    h = b64(json.dumps({"alg": alg, "typ": "JWT"}).encode())
    p = b64(json.dumps(payload).encode())
    sig = b64(hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()) if alg == "HS256" else ""
    return f"{h}.{p}.{sig}"

good = make({"sub": "asha", "aud": "payroll-api", "exp": 2000}, "s3cret")
assert verify_jwt(good, "s3cret", 1000, "payroll-api")["sub"] == "asha"

def fails(token, secret, now, aud, msg):
    try:
        verify_jwt(token, secret, now, aud)
    except ValueError as e:
        assert str(e) == msg, str(e)
        return
    raise AssertionError("expected: " + msg)

fails("abc.def", "s3cret", 1000, "payroll-api", "malformed token")
fails(good, "wrong-secret", 1000, "payroll-api", "bad signature")
fails(good, "s3cret", 2000, "payroll-api", "expired")
fails(good, "s3cret", 1000, "other-api", "wrong audience")
fails(make({"sub": "x", "aud": "payroll-api", "exp": 2000}, "s3cret", alg="none"), "s3cret", 1000, "payroll-api", "unsupported algorithm")
h, p, s = good.split(".")
evil = b64(json.dumps({"sub": "asha", "aud": "payroll-api", "exp": 99999}).encode())
fails(f"{h}.{evil}.{s}", "s3cret", 1000, "payroll-api", "bad signature")`,
      solution: `import base64, hashlib, hmac, json

def _d(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def verify_jwt(token, secret, now, audience):
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("malformed token")
    h_b64, p_b64, sig_b64 = parts
    try:
        header = json.loads(_d(h_b64))
        payload = json.loads(_d(p_b64))
    except Exception:
        raise ValueError("malformed token")
    if header.get("alg") != "HS256":
        raise ValueError("unsupported algorithm")
    expected = hmac.new(secret.encode(), f"{h_b64}.{p_b64}".encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, _d(sig_b64)):
        raise ValueError("bad signature")
    if now >= payload.get("exp", 0):
        raise ValueError("expired")
    if payload.get("aud") != audience:
        raise ValueError("wrong audience")
    return payload`,
      hint: 'Decode header and payload with base64url (add back the = padding). Check alg before the signature, because "none" tokens have an empty signature. Check exp and aud only after the signature is proven good.',
    } },
    `## Single sign-on (SSO)
**SSO** means you sign in once with the identity provider (IdP) and then open many applications without typing a password again. Each app trusts the IdP and redirects you there; the IdP already has your session, so it sends you straight back with proof of who you are. Benefits: one place for MFA and password policy, one place to disable a leaver, fewer passwords. This is how your work laptop opens Outlook, Teams, SharePoint, Power BI and the Azure portal after a single login.`,
    { sketch: { w: 760, h: 300, caption: 'SSO: one sign-in at the identity provider, then each app gets proof without asking you again', items: [
      { t: 'person', x: 380, y: 232, label: 'Asha' },
      { t: 'box', x: 290, y: 24, w: 180, h: 70, label: 'Identity provider', sub: 'Microsoft Entra ID', fill: 'orange', size: 17 },
      { t: 'box', x: 30, y: 128, w: 170, h: 56, label: 'App A', sub: 'Power BI', fill: 'yellow', size: 17 },
      { t: 'box', x: 560, y: 128, w: 170, h: 56, label: 'App B', sub: 'SharePoint', fill: 'green', size: 17 },
      { t: 'arrow', x1: 200, y1: 140, x2: 292, y2: 80, label: '1 not signed in →\nredirect', lx: -34, ly: -6 },
      { t: 'arrow', x1: 330, y1: 94, x2: 120, y2: 128, label: '3 token', lx: -10, ly: 6, bend: -24 },
      { t: 'arrow', x1: 560, y1: 150, x2: 468, y2: 86, label: '4 redirect', lx: 34, ly: -8 },
      { t: 'arrow', x1: 438, y1: 96, x2: 646, y2: 128, label: '5 token, no prompt', lx: 8, ly: 6, bend: 24 },
      { t: 'arrow', x1: 360, y1: 232, x2: 372, y2: 96, label: '2 signs in once\n(+ MFA)', lx: -56, ly: 30 },
    ] } },
    `## SAML vs OpenID Connect
SSO has two main protocols. You will meet both.
| | **SAML 2.0** | **OpenID Connect** |
|---|---|---|
| Era | 2005, enterprise web | 2014, built on OAuth 2.0 |
| Format | XML **assertions** (signed) | JSON, **JWT** ID tokens |
| Typical use | Older enterprise and SaaS apps (many HR, finance and legacy tools) | Modern web, mobile and single-page apps, APIs |
| Needs APIs too? | No, sign-in only | Yes: same family as OAuth access tokens |
| Setup words | IdP, **Service Provider (SP)**, metadata, **ACS URL** | client id, redirect URI, scopes |

If an app supports both, choose **OIDC**. If the vendor supports only SAML, you set it up with metadata exchange and map attributes (email, name, group) into the assertion.

## Federation and provisioning
- **Federation** is trust between identity systems: your Entra ID can trust a partner's directory, so their staff sign in with their own company login and appear as **guests** (this is Entra **B2B**). No new passwords to manage.
- **Provisioning (SCIM)**: an SSO login only proves identity at the moment. To **create and remove** user accounts in each SaaS app automatically (so a leaver's account actually disappears), identity providers use the **SCIM** standard.
- **Single logout** is harder than single login. Closing one app rarely signs you out of the rest; tokens and sessions have their own lifetimes. Do not promise "log out everywhere" to a customer.`,
    { warn: 'Do not build your own JWT validation from scratch in production. Use a maintained library (or your platform\'s built-in token validation) configured with the **issuer, audience and an algorithm allow-list**. The hand-written code above is for understanding; real libraries also handle key rotation, caching, clock skew and the many subtle attacks.' },
    { interview: '**"How does an API validate a JWT, and why is a JWT not secret?"** Model answer: "It checks the format, enforces an algorithm allow-list, verifies the signature with the issuer\'s public key found by kid in the JWKS, then checks iss, aud, exp and nbf, and finally the scope or role for the action. A JWT is only signed, not encrypted, so anyone with the token can read the payload; that is why it carries no secrets, why lifetimes are short, and why revocation needs refresh tokens or a deny-list." Adding "alg none and key-confusion attacks" shows you know why the allow-list matters.' },
    { real: 'Your Azure Function protected by Entra ID ("Easy Auth") does most of these checks for you before your code runs, and gives you the claims in a header. Knowing the checklist lets you answer two practical questions: *what exactly did the platform verify?* and *what must my code still check?* (Usually: that the caller has the right role for this specific action.)' },
    `## Recap
- A **JWT** is \`header.payload.signature\`, base64url JSON plus a signature. It is **signed, not encrypted**.
- APIs verify with the issuer's **public key** from the **JWKS** (found by \`kid\`), so they need no call per request; keys **rotate** without notice.
- Validate: **algorithm allow-list, signature, iss, aud, exp/nbf**, then scope or role. Never accept \`alg: none\`.
- Short lifetimes plus refresh tokens compensate for the difficulty of revoking stateless tokens.
- **SSO** = sign in once at the IdP. **SAML** (XML assertions, older enterprise) vs **OIDC** (JWT, modern). **Federation** trusts external directories; **SCIM** provisions and removes accounts.`,
  ],
  quiz: [
    { q: 'Why can an API verify an RS256 token without calling the identity provider each time?', o: ['The token is encrypted', 'It checks the signature with the provider\'s public key, cached from the JWKS', 'The token contains the password', 'The API trusts every token'], a: 1, why: 'The public key can verify but not create signatures, so verification is local and safe.' },
    { q: 'Which claim says which API a token is meant for?', o: ['nbf', 'iss', 'sub', 'aud'], a: 3, why: 'aud is the audience. An API must reject tokens whose aud is not itself.' },
    { q: 'A token arrives with header {"alg":"none"} and an empty signature. What should your validator do?', o: ['Reject it, because only allow-listed algorithms are accepted', 'Ask the user to sign in again later', 'Treat it as an ID token', 'Accept it, there is no signature to fail'], a: 0, why: 'Accepting "none" would let anyone forge any token. Algorithms must be decided by your code, not by the token.' },
    { q: 'Which is TRUE about a JWT payload?', o: ['It disappears after one use', 'It is encrypted, so secrets are safe in it', 'Anyone who has the token can read it; it is only signed', 'It can only be read by the API'], a: 2, why: 'Base64url is an encoding. Treat the payload as public to the token holder.' },
    { q: 'Why are access tokens kept short-lived?', o: ['Because SAML requires it', 'To make the signature smaller', 'To save storage', 'Stateless tokens cannot easily be revoked, so a stolen one should expire soon'], a: 3, why: 'Until exp passes, a valid token works. Short lifetimes limit the damage window.' },
    { q: 'For a new web app, with the choice between SAML and OpenID Connect, which is usually better?', o: ['SAML, because it is older', 'OpenID Connect, because it is JSON/JWT based and also fits API access', 'Neither, write your own', 'SAML, because it is lighter'], a: 1, why: 'OIDC is the modern default for web, mobile and APIs. SAML is mainly for legacy or vendor-limited apps.' },
  ],
  task: {
    title: 'Decode and judge a token',
    steps: [
      'In the JwtDecoder widget, read the sample token. Write down its algorithm, subject (`sub`), `role` and expiry (`exp`). Notice this simple demo token has no `iss` or `aud`; say which two validator checks you could not do on it and why real tokens include them.',
      'Click the widget\'s "change role to admin (tamper)" button, then "expired token". For each, say which validator check catches it.',
      'In the Python playground, change `exp` to a time in the past and add an `expired` check to `check_signature`. Then explain why you check the signature before reading `exp`.',
    ],
    deliverable: 'A table of the claims you read, which validator step checks each, and your explanation of the check ordering.',
  },
};
