import { useState } from 'react';
import './extra.css';

// OAuth 2.0 / OpenID Connect flows as a step-through sequence diagram. All values are made up; the PKCE verifier/challenge pair is the example from RFC 7636.
const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
const AUTHZ = 'https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize';
const TOKEN = 'https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token';

const FLOWS = {
  'Authorization code + PKCE': {
    blurb: 'A person signs in through a browser. This is the flow for web apps, single-page apps and mobile apps.',
    actors: ['Browser (user)', 'Your app', 'Entra ID', 'API'],
    steps: [
      { f: 0, t: 1, short: 'click “Sign in”', title: 'The user clicks “Sign in”', detail: 'Before leaving, your app invents a random secret called the code verifier and keeps it (in the session). It also computes a hash of it, the code challenge. Only the hash will travel through the browser.', code: `code_verifier  = ${VERIFIER}   (kept secret by the app)\ncode_challenge = BASE64URL( SHA256(code_verifier) )\n               = ${CHALLENGE}\nstate          = af0ifjsldkj   (random; stops forged redirects)` },
      { f: 1, t: 0, short: '302 to sign-in page', title: 'The app sends the browser to the authorize endpoint', detail: 'This is a plain browser redirect. Notice what is in the URL: who the app is (client_id), where to come back (redirect_uri), what access is wanted (scope) and the challenge, never the verifier.', code: `GET ${AUTHZ}\n  ?client_id=<app-id>\n  &response_type=code\n  &redirect_uri=https://app.kollana-tech.in/auth/callback\n  &scope=openid profile api://<api-app-id>/Payroll.Read\n  &state=af0ifjsldkj\n  &code_challenge=${CHALLENGE}\n  &code_challenge_method=S256` },
      { f: 0, t: 2, short: 'user signs in (MFA)', title: 'The user signs in at Entra ID, not at your app', detail: 'The password, the MFA prompt and the consent screen all happen on the identity provider\'s domain. Your app never sees the password. That is the whole point of delegating sign-in.', code: 'user -> login.microsoftonline.com: username, password, MFA approval\nEntra ID: "Kollana Payroll wants to read payroll data. Allow?"  [Accept]' },
      { f: 2, t: 0, short: '302 back with ?code=', title: 'Entra ID redirects back with a one-time authorization code', detail: 'The code is short-lived and single-use. On its own it is not a token. Your app checks that state matches what it sent.', code: 'HTTP/1.1 302 Found\nLocation: https://app.kollana-tech.in/auth/callback?code=0.AXEA...&state=af0ifjsldkj', attacker: 'An attacker who steals this URL (a malicious browser extension, a log file, a shared device) now holds the code. Without PKCE that would be enough to get tokens.' },
      { f: 1, t: 2, short: 'redeem code + verifier', title: 'Your app redeems the code on the back channel', detail: 'This is a direct server-to-server call, not through the browser. The app now reveals the code verifier. Confidential clients (a server app) also send a client secret or certificate.', code: `POST ${TOKEN}\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code\n&client_id=<app-id>\n&code=0.AXEA...\n&redirect_uri=https://app.kollana-tech.in/auth/callback\n&code_verifier=${VERIFIER}`, attacker: 'The attacker tries the same call with the stolen code but does NOT have the verifier.\nEntra ID: SHA256(attacker\'s guess) != code_challenge  ->  400 invalid_grant: "PKCE verification failed".  The stolen code is useless.' },
      { f: 2, t: 1, short: 'tokens returned', title: 'Entra ID checks everything and returns tokens', detail: 'It verifies the code is unused and unexpired, the redirect_uri matches, and SHA256(code_verifier) equals the stored challenge. Then it issues three tokens for three different jobs.', code: '{\n  "token_type": "Bearer",\n  "expires_in": 3599,\n  "access_token": "eyJ0eXAiOiJKV1Qi...",   // for the API: "what may this caller do?"\n  "id_token": "eyJ0eXAiOiJKV1Qi...",       // for your app: "who just signed in?"\n  "refresh_token": "0.AXEA..."             // to get new access tokens quietly\n}', claims: [['ID token (for your app)', 'iss: https://login.microsoftonline.com/<tenant-id>/v2.0\naud: <app-id>        <- your app is the audience\nsub / oid: 5f1c...   <- stable user id\nname: Asha Menon\npreferred_username: asha@kollana-tech.in\nexp: 1767225600'], ['Access token (for the API)', 'iss: https://login.microsoftonline.com/<tenant-id>/v2.0\naud: api://<api-app-id>   <- the API is the audience\nscp: Payroll.Read         <- delegated permission (acts for the user)\noid: 5f1c...  tid: <tenant-id>\nexp: 1767225600']] },
      { f: 1, t: 3, short: 'call API with Bearer', title: 'Your app calls the API with the access token', detail: 'The access token goes in the Authorization header. The API never sees the user\'s password or your app\'s secret.', code: 'GET https://api.kollana-tech.in/payroll/jobs\nAuthorization: Bearer eyJ0eXAiOiJKV1Qi...' },
      { f: 3, t: 1, short: 'API validates, answers', title: 'The API validates the token and answers', detail: 'The API checks the signature with Entra ID\'s public keys (the JWKS endpoint), then the claims: issuer, audience, expiry and that scp/roles allow this call. No call to Entra ID is needed per request.', code: '200 OK  {"jobs":[...]}                 // valid token, permission present\n401 Unauthorized                      // missing, expired or badly signed token\n403 Forbidden                         // valid token, but scp/roles do not allow this action' },
      { f: 1, t: 2, short: 'refresh quietly', title: 'Later: a refresh token gets a new access token', detail: 'Access tokens are short-lived on purpose. When one expires, the app swaps the refresh token for a new access token without asking the user to sign in again.', code: `POST ${TOKEN}\n\ngrant_type=refresh_token&client_id=<app-id>&refresh_token=0.AXEA...&scope=...` },
    ],
  },
  'Client credentials (no user)': {
    blurb: 'A service, scheduled job or daemon calls an API as itself, with no human. This is how a Power Automate flow, an Azure Function or an Airflow task usually authenticates.',
    actors: ['Your service', 'Entra ID', 'API'],
    steps: [
      { f: 0, t: 1, short: 'ask for a token', title: 'The service proves who it is and asks for a token', detail: 'It sends its client id and a credential: a client secret, a certificate, or (best) nothing at all because it runs with a managed identity and the platform proves it. The scope ends in /.default, meaning "all the app permissions granted to me".', code: `POST ${TOKEN}\n\ngrant_type=client_credentials\n&client_id=<service-app-id>\n&client_secret=<secret from Key Vault>      // or a signed certificate assertion\n&scope=api://<api-app-id>/.default` },
      { f: 1, t: 0, short: 'access token only', title: 'Entra ID returns an access token, and nothing else', detail: 'No user is involved, so there is no ID token and no refresh token. The token carries app roles (what this application may do), not a user\'s scopes.', code: '{ "token_type": "Bearer", "expires_in": 3599, "access_token": "eyJ0eXAiOiJKV1Qi..." }', claims: [['Access token claims', 'iss: https://login.microsoftonline.com/<tenant-id>/v2.0\naud: api://<api-app-id>\nroles: ["Payroll.Validate"]     <- app role (application permission)\noid: <service principal id>\nidtyp: app\nexp: 1767225600']] },
      { f: 0, t: 2, short: 'call API with Bearer', title: 'The service calls the API', detail: 'Same header as before. To the API a token is a token; it decides what to allow from the claims.', code: 'POST https://api.kollana-tech.in/payroll-files\nAuthorization: Bearer eyJ0eXAiOiJKV1Qi...' },
      { f: 2, t: 0, short: 'API checks roles', title: 'The API validates the token and checks the role', detail: 'Signature, issuer, audience and expiry, then: does `roles` contain the role this endpoint needs? A valid token without the role gets 403, not 401.', code: '202 Accepted                     // roles contains Payroll.Validate\n403 Forbidden                    // token is valid, role is missing\n401 Unauthorized                 // token missing, expired or wrong audience' },
    ],
  },
};

const W = 720; const TOP = 70; const ROW = 46;

export default function OAuthFlow() {
  const names = Object.keys(FLOWS);
  const [name, setName] = useState(names[0]);
  const [i, setI] = useState(0);
  const [attacker, setAttacker] = useState(false);
  const flow = FLOWS[name];
  const step = flow.steps[i];
  const xs = flow.actors.map((_, k) => (W / flow.actors.length) * (k + 0.5));
  const H = TOP + flow.steps.length * ROW + 10;
  const pick = (n) => { setName(n); setI(0); setAttacker(false); };

  return (
    <div className="w-oa">
      <div className="w-title">OAuth 2.0 / OpenID Connect: step through a sign-in</div>
      <div className="chips" role="group" aria-label="Flow">{names.map((n) => <button key={n} className={n === name ? 'chip on' : 'chip'} onClick={() => pick(n)}>{n}</button>)}</div>
      <p className="w-desc">{flow.blurb}</p>
      <div className="w-oa-svgwrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-oa-svg" role="img" aria-label="Sequence diagram of the flow">
          <defs><marker id="oa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f2a44" /></marker>
            <marker id="oa-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e8590c" /></marker></defs>
          {flow.actors.map((a, k) => (
            <g key={a}>
              <rect x={xs[k] - 70} y="8" width="140" height="34" rx="8" className="oa-actor" />
              <text x={xs[k]} y="30" textAnchor="middle" className="oa-actor-t">{a}</text>
              <line x1={xs[k]} y1="44" x2={xs[k]} y2={H - 4} className="oa-life" />
            </g>
          ))}
          {flow.steps.map((s, k) => {
            if (k > i) return null;
            const y = TOP + k * ROW; const hot = k === i; const x1 = xs[s.f]; const x2 = xs[s.t];
            const dir = x2 > x1 ? 1 : -1;
            return (
              <g key={k} className={hot ? 'oa-step hot' : 'oa-step'} onClick={() => setI(k)} style={{ cursor: 'pointer' }}>
                <line x1={x1 + 4 * dir} y1={y} x2={x2 - 4 * dir} y2={y} markerEnd={hot ? 'url(#oa-arrow-hot)' : 'url(#oa-arrow)'} />
                <circle cx={Math.min(x1, x2) + 14} cy={y - 12} r="9" className="oa-num" />
                <text x={Math.min(x1, x2) + 14} y={y - 8.5} textAnchor="middle" className="oa-num-t">{k + 1}</text>
                <text x={(x1 + x2) / 2 + 10} y={y - 7} textAnchor="middle" className="oa-lbl">{s.short}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="row wrap">
        <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>← Back</button>
        <button className="btn primary" onClick={() => setI(Math.min(flow.steps.length - 1, i + 1))} disabled={i === flow.steps.length - 1}>Next step →</button>
        <button className="btn-mini" onClick={() => setI(0)}>start over</button>
        <span className="muted small">step {i + 1} of {flow.steps.length}</span>
        {name.startsWith('Authorization') && <label className="toggle"><input type="checkbox" checked={attacker} onChange={(e) => setAttacker(e.target.checked)} /> an attacker steals the code</label>}
      </div>
      <div className="w-oa-detail">
        <h4>{i + 1}. {step.title}</h4>
        <p>{step.detail}</p>
        <pre className="sqlsnip">{step.code}</pre>
        {step.claims && step.claims.map(([h, body]) => <div key={h}><div className="mini-cap">decoded: {h}</div><pre className="sqlsnip">{body}</pre></div>)}
        {attacker && step.attacker && <div className="verdict bad"><b>Attacker view.</b> {step.attacker}</div>}
        {attacker && !step.attacker && name.startsWith('Authorization') && <p className="muted small">Step to 4 or 5 to see what the attacker can and cannot do.</p>}
      </div>
    </div>
  );
}
