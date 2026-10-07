export default {
  id: 'foundations-oauth2-oidc',
  title: 'OAuth 2.0 and OpenID Connect',
  goal: 'You can name the four OAuth roles, choose between authorization code with PKCE, client credentials and device code, tell an access token from an ID token and a refresh token, and spot the common OAuth mistakes.',
  roadmap: ['OAuth 2.0 roles and flows', 'OpenID Connect and ID tokens', 'PKCE, scopes and refresh tokens'],
  blocks: [
    `## The problem
Your Kollana Payroll web app needs to read a user's files from SharePoint. How does the app get permission?

The terrible old answer: *ask the user for their SharePoint password and keep it.* Now your app holds the master key to their whole account, forever, and so does anyone who hacks your app. The user cannot limit it, and cannot revoke it without changing their password everywhere.

**OAuth 2.0** is the standard fix. It works like a **valet key** for a car: a special key that starts the engine but does not open the boot or the glovebox, can be given to a stranger for an evening, and can be cancelled. The user signs in to **the real identity provider**, not to your app, and your app receives a **token** with limited, revocable permissions.

## The four roles
Every OAuth conversation has the same cast:
| Role | Who | Example here |
|---|---|---|
| **Resource owner** | The person whose data it is | Asha, a payroll manager |
| **Client** | The application that wants access | the Kollana Payroll web app |
| **Authorization server** | Signs the user in and issues tokens | Microsoft Entra ID |
| **Resource server** | The API holding the data, which accepts tokens | the Payroll API (or Microsoft Graph for SharePoint) |`,
    { sketch: { w: 760, h: 320, caption: 'The valet key: the user signs in with the identity provider, and the app only ever holds a limited token', items: [
      { t: 'person', x: 100, y: 34, label: 'Asha (resource owner)' },
      { t: 'box', x: 470, y: 34, w: 250, h: 74, label: 'Authorization server', sub: 'Microsoft Entra ID', fill: 'orange', size: 17 },
      { t: 'box', x: 40, y: 214, w: 230, h: 74, label: 'Client', sub: 'Kollana Payroll web app', fill: 'yellow', size: 17 },
      { t: 'box', x: 470, y: 214, w: 250, h: 74, label: 'Resource server', sub: 'Payroll API', fill: 'green', size: 17 },
      { t: 'arrow', x1: 150, y1: 70, x2: 470, y2: 70, label: '1 signs in + consents', ly: -10 },
      { t: 'arrow', x1: 480, y1: 108, x2: 250, y2: 214, label: '2 tokens', lx: 24, ly: 4 },
      { t: 'arrow', x1: 270, y1: 251, x2: 470, y2: 251, label: '3 Bearer access token', ly: -10 },
      { t: 'arrow', x1: 640, y1: 214, x2: 640, y2: 108, dashed: true, label: 'API checks the\nsignature', lx: 66, ly: 0 },
      { t: 'arrow', x1: 90, y1: 106, x2: 90, y2: 214, dashed: true, label: 'uses the app', lx: 54, ly: 0 },
    ] } },
    `## OAuth 2.0 vs OpenID Connect
Two standards are always mentioned together, and mixing them up is a classic interview slip.
- **OAuth 2.0** is about **authorization / delegation**: "this app may read these files on my behalf". Its main product is the **access token**.
- **OpenID Connect (OIDC)** is a thin layer on top of OAuth 2.0 about **authentication**: "this user just signed in, and here is who they are." Its main product is the **ID token**, a signed JWT with claims such as the user's id and name, plus a standard \`userinfo\` endpoint and standard scopes \`openid\`, \`profile\` and \`email\`.

If you want to *sign users in*, you use OIDC. If you also want to *call an API as them*, you use the OAuth part. In practice you ask for both in one go: \`scope=openid profile api://payroll/Payroll.Read\`.

## The three tokens
| Token | For whom | What it says | Lifetime |
|---|---|---|---|
| **Access token** | The **API** (resource server) | "The bearer may do X (scope/role) on this API" | Short: minutes to an hour |
| **ID token** | The **client app** | "This user authenticated, here are their claims" | Short; used once at sign-in |
| **Refresh token** | The authorization server | "Exchange me for a new access token without asking the user again" | Long: days or months, keep it safe |

Two rules: **an app must never send the ID token to an API as if it were an access token**, and **an API must never accept an ID token**. Each token has an *audience* (\`aud\`), the party it is meant for.

## Which flow when?
A **flow** (or *grant type*) is the choreography for getting tokens. Pick by who is calling:
| Flow | Use it when | Notes |
|---|---|---|
| **Authorization code + PKCE** | A person signs in to a web app, single-page app or mobile app | The default for users. Code comes via the browser; tokens are fetched on the back channel. |
| **Client credentials** | A service or job calls an API as itself (no user) | A flow, a Function or a pipeline. Uses an app secret, a certificate or a managed identity. |
| **Device code** | A device or tool with no browser, such as a CLI | You get a code, open a URL on another device and sign in there (\`az login --use-device-code\`). |
| **Refresh token** | Get a new access token quietly | Not a first login; a renewal. |
| Implicit, Resource owner password | **Avoid.** Older flows that expose tokens or passwords | Deprecated in current guidance. |

**PKCE** (*Proof Key for Code Exchange*, said "pixy") protects the authorization-code flow. The app invents a random secret (the **verifier**), sends only its hash (the **challenge**) at the start, and reveals the verifier when it redeems the code. A thief who steals the code on the way back cannot use it without the verifier. PKCE is required for public clients (browser and mobile apps, which cannot keep a secret) and recommended for all.

**Scopes and roles.** A **scope** names a *delegated* permission: what the app may do *on behalf of a signed-in user* (\`Payroll.Read\`). An **app role** is an *application* permission: what the app may do *as itself*, with no user. Both appear as claims in the access token (\`scp\` and \`roles\`).

Now step through both flows. In the code flow, tick **"an attacker steals the code"** and move to steps 4 and 5.`,
    { widget: 'OAuthFlow' },
    `## Build the pieces yourself
These are the two small computations a real client library does for you: the PKCE challenge, and the authorize URL. Run it. The first line is the worked example from the PKCE standard (RFC 7636), so you can check your maths against it.`,
    { py: {
      title: 'PKCE verifier, challenge and the authorize URL',
      starter: `import base64, hashlib, secrets
from urllib.parse import urlencode

def make_verifier():
    return secrets.token_urlsafe(48)                  # random, 64 characters

def challenge_of(verifier):
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()     # base64url without padding

# The worked example from the PKCE standard (RFC 7636). It must print E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
print(challenge_of("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))

verifier = make_verifier()
state = secrets.token_urlsafe(16)                      # stops forged redirects (CSRF)
params = {
    "client_id": "<app-id>",
    "response_type": "code",
    "redirect_uri": "https://app.kollana-tech.in/auth/callback",
    "scope": "openid profile api://<api-app-id>/Payroll.Read",
    "state": state,
    "code_challenge": challenge_of(verifier),
    "code_challenge_method": "S256",
}
print("https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize?" + urlencode(params))
print("keep the verifier secret:", verifier[:10] + "...")`,
      note: 'The verifier never leaves your app until the back-channel token request. The challenge is a one-way hash, so seeing it does not help an attacker.',
    } },
    { pychallenge: {
      id: 'foundations-pych-pkce',
      prompt: 'Write `code_challenge(verifier)` for **PKCE S256**: take the SHA-256 digest of the verifier (ASCII bytes), encode it as **URL-safe base64** and **remove the `=` padding**. For the verifier `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` the answer is `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`.',
      starter: `import base64
import hashlib

def code_challenge(verifier):
    return ""`,
      tests: `assert code_challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk") == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
assert "=" not in code_challenge("abc")
assert len(code_challenge("x" * 50)) == 43`,
      solution: `import base64
import hashlib

def code_challenge(verifier):
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()`,
      hint: 'hashlib.sha256(...).digest() gives raw bytes. base64.urlsafe_b64encode then .rstrip(b"=") then .decode().',
    } },
    { pychallenge: {
      id: 'foundations-pych-callback',
      prompt: 'Write `parse_callback(url, expected_state)` for the redirect your app receives after sign-in. Return the authorization **code** from the query string. Raise `ValueError` if the query contains an `error` parameter (the user denied access, for example), if `state` is missing or **does not equal `expected_state`**, or if there is no `code`. Check `error` first, then `state`, then `code`.',
      starter: `from urllib.parse import urlparse, parse_qs

def parse_callback(url, expected_state):
    return ""`,
      tests: `assert parse_callback("https://app.kollana-tech.in/auth/callback?code=ABC123&state=xyz", "xyz") == "ABC123"
bad = [
    ("https://x/cb?code=ABC&state=other", "xyz"),
    ("https://x/cb?error=access_denied&state=xyz", "xyz"),
    ("https://x/cb?state=xyz", "xyz"),
    ("https://x/cb?code=ABC", "xyz"),
]
for url, state in bad:
    try:
        parse_callback(url, state)
        raise AssertionError("should have rejected " + url)
    except ValueError:
        pass`,
      solution: `from urllib.parse import urlparse, parse_qs

def parse_callback(url, expected_state):
    q = parse_qs(urlparse(url).query)
    if "error" in q:
        raise ValueError("sign-in failed: " + q["error"][0])
    if q.get("state", [None])[0] != expected_state:
        raise ValueError("state mismatch (possible forged redirect)")
    if "code" not in q:
        raise ValueError("no authorization code returned")
    return q["code"][0]`,
      hint: 'parse_qs returns lists: q["code"][0] is the first value. Check the error key before anything else.',
    } },
    `## Mistakes that cause real breaches
- **Skipping the \`state\` check.** The \`state\` value ties the redirect to the request your app started. Without it an attacker can feed your app a code for the attacker's own account (a CSRF attack).
- **Loose \`redirect_uri\` matching.** The identity provider must match the redirect URI **exactly** against what you registered. A wildcard lets an attacker redirect the code to their own site.
- **Using the ID token as an access token**, or accepting one at the API.
- **Asking for too much.** Request the narrowest scopes. Over-broad scopes make consent screens scary and breaches worse.
- **Storing tokens carelessly.** Do not put refresh tokens where any script can read them (browser \`localStorage\`). Prefer a server component (a "backend for frontend") that holds tokens and gives the browser an \`HttpOnly\` session cookie.
- **Putting a client secret in a single-page app or a mobile app.** Anything shipped to a user's device is public. Use PKCE and no secret.`,
    { warn: 'A token is a **bearer** credential: whoever holds it can use it, with no further proof. Treat access and refresh tokens like passwords. Never log them, never put them in URLs, keep lifetimes short, and use HTTPS everywhere.' },
    { interview: '**"Explain OAuth 2.0 versus OpenID Connect, and which flow you would use for a web app and for a nightly job."** Model answer: "OAuth 2.0 delegates authorization and issues access tokens for an API. OIDC sits on top and adds authentication with an ID token. For a web app where a person signs in I use the authorization code flow with PKCE, validating state, and the app calls the API with the access token. For a nightly job there is no user, so I use client credentials, ideally with a managed identity so there is no secret. I request the narrowest scopes or app roles and keep tokens short-lived." Mention PKCE and managed identity: both are marks of current practice.' },
    { real: 'When a Power Automate flow calls your Azure Function, the HTTP action can use **Active Directory OAuth**: the flow performs client credentials against Entra ID and attaches the token. The Function validates the token and checks the app role. After this lesson, "Authentication: Active Directory OAuth, Tenant, Audience, Client ID, Secret" is no longer a list of fields to fill; each one is a part of the flow you just stepped through.' },
    `## Recap
- **OAuth 2.0** delegates authorization with limited, revocable tokens (the valet key); **OIDC** adds sign-in with an ID token.
- Roles: **resource owner, client, authorization server, resource server**.
- Tokens: **access** (for the API), **ID** (for the app), **refresh** (to renew). Each has an audience.
- Flows: **authorization code + PKCE** for users, **client credentials** for services, **device code** for browserless tools. Avoid implicit and password grants.
- Always check **state**, match **redirect_uri** exactly, ask for the **narrowest scopes**, and protect tokens like passwords.`,
  ],
  quiz: [
    { q: 'Your nightly Azure Function must call an internal API. There is no user. Which flow?', o: ['Implicit', 'Authorization code + PKCE', 'Resource owner password', 'Client credentials'], a: 3, why: 'A service acting as itself uses client credentials, ideally with a managed identity instead of a stored secret.' },
    { q: 'Which token should the API accept as proof of permission?', o: ['The ID token', 'The access token whose audience is that API', 'The refresh token', 'Any JWT'], a: 1, why: 'The access token is intended for the resource server; its aud must match the API.' },
    { q: 'What problem does PKCE solve?', o: ['It makes tokens last longer', 'It encrypts the access token', 'A stolen authorization code cannot be redeemed without the secret verifier', 'It replaces TLS'], a: 2, why: 'The attacker has the code but not the code_verifier that matches the challenge sent at the start.' },
    { q: 'Which statement about OpenID Connect is correct?', o: ['It adds authentication (an ID token) on top of OAuth 2.0', 'It replaces OAuth 2.0', 'It is only for mobile apps', 'It issues refresh tokens only'], a: 0, why: 'OIDC answers "who signed in?"; OAuth answers "what may this app do?".' },
    { q: 'A callback arrives with state=other but your app sent state=xyz. What should the app do?', o: ['Use the code anyway', 'Reject it as a possible forged redirect', 'Retry with the same code', 'Log the user in twice'], a: 1, why: 'State binds the redirect to your original request. A mismatch means it did not come from your flow.' },
    { q: 'Where is it safest for a browser-based app to keep a refresh token?', o: ['In localStorage', 'In the page URL', 'On a server component, with the browser given an HttpOnly session cookie', 'In a global JavaScript variable'], a: 2, why: 'Scripts cannot read an HttpOnly cookie, and the server keeps the refresh token out of reach of XSS.' },
  ],
  task: {
    title: 'Trace a sign-in in your browser',
    steps: [
      'Open Edge or Chrome, press F12 and choose the **Network** tab, tick *Preserve log*, and sign in to a Microsoft 365 web app in a private window.',
      'Find the request to `login.microsoftonline.com/.../authorize` and read its query parameters: client_id, redirect_uri, scope, state and (if present) code_challenge. Name each in your own words.',
      'Find the redirect back with `?code=`. Do not copy real codes anywhere. Then, in the simulator, tick the attacker box and explain in three sentences why PKCE makes the stolen code useless.',
    ],
    deliverable: 'A page naming each query parameter you saw and what it does, plus your three-sentence PKCE explanation.',
  },
};
