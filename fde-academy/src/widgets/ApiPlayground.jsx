import { useRef, useState } from 'react';
import { signJwt, verifyJwt } from './jwt';

// A mock "Payroll Bank Mandate Validation API" that behaves like a FastAPI service.
const USERS = { uploader: 'uploader', reviewer: 'reviewer', admin: 'admin' };
const EXC = [
  { id: 1, emp_id: 7, rule: 'IFSC_FORMAT', detail: 'IFSC HDFC123456 is not 11 chars', status: 'open' },
  { id: 2, emp_id: 14, rule: 'IFSC_FORMAT', detail: 'IFSC sbin0001234 must be uppercase', status: 'open' },
  { id: 3, emp_id: 12, rule: 'DUPLICATE_ACCOUNT', detail: 'Account ******4821 also used by emp 4', status: 'open' },
  { id: 4, emp_id: 6, rule: 'SALARY_JUMP', detail: 'Gross up 140% vs last month', status: 'open' },
  { id: 5, emp_id: 9, rule: 'MISSING_PAN', detail: 'PAN is empty', status: 'open' },
  { id: 6, emp_id: 18, rule: 'MISSING_PAN', detail: 'PAN is empty', status: 'open' },
];

function useServer() {
  const st = useRef({ jobs: {}, idem: {}, hits: [], nextJob: 41, exc: EXC.map((e) => ({ ...e })) });
  return async (method, path, headers, bodyText) => {
    const s = st.current; const now = Date.now();
    s.hits = s.hits.filter((t) => now - t < 10000); s.hits.push(now);
    if (s.hits.length > 8) return [429, { detail: 'Too many requests. Slow down.' }, { 'Retry-After': '10' }];
    let body = null;
    if (bodyText && bodyText.trim()) { try { body = JSON.parse(bodyText); } catch { return [400, { detail: 'Body is not valid JSON' }]; } }
    const [p, qs] = path.split('?'); const q = Object.fromEntries(new URLSearchParams(qs || ''));
    const auth = async () => {
      const h = headers.authorization || '';
      if (!h.startsWith('Bearer ')) return [401, { detail: 'Not authenticated' }, { 'WWW-Authenticate': 'Bearer' }];
      const v = await verifyJwt(h.slice(7));
      if (!v.ok) return [401, { detail: 'Could not validate credentials: ' + v.reason }];
      return v.payload;
    };
    if (method === 'GET' && p === '/health') return [200, { status: 'ok', version: '1.0.0' }];
    if (method === 'POST' && p === '/token') {
      if (!body?.username || !body?.password) return [422, { detail: [{ loc: ['body', !body?.username ? 'username' : 'password'], msg: 'Field required', type: 'missing' }] }];
      if (USERS[body.username] !== body.password) return [401, { detail: 'Incorrect username or password' }];
      const token = await signJwt({ sub: body.username, role: body.username, exp: Math.floor(now / 1000) + 3600 });
      return [200, { access_token: token, token_type: 'bearer', expires_in: 3600 }];
    }
    if (method === 'POST' && p === '/payroll-files') {
      const u = await auth(); if (Array.isArray(u)) return u;
      if (!['uploader', 'admin'].includes(u.role)) return [403, { detail: `Role '${u.role}' cannot upload files` }];
      if (!body?.file_name) return [422, { detail: [{ loc: ['body', 'file_name'], msg: 'Field required', type: 'missing' }] }];
      const key = headers['idempotency-key'];
      if (key && s.idem[key]) return [202, { ...s.jobs[s.idem[key]], note: 'Same Idempotency-Key → returning the original job, no duplicate created' }];
      const id = s.nextJob++;
      s.jobs[id] = { job_id: id, file_name: body.file_name, status: 'queued', created_at: new Date(now).toISOString(), _t: now };
      if (key) s.idem[key] = id;
      return [202, { job_id: id, status: 'queued', links: { self: `/jobs/${id}`, exceptions: `/jobs/${id}/exceptions` } }, { Location: `/jobs/${id}` }];
    }
    let m;
    if (method === 'GET' && (m = p.match(/^\/jobs\/(\d+)$/))) {
      const u = await auth(); if (Array.isArray(u)) return u;
      const j = s.jobs[m[1]]; if (!j) return [404, { detail: 'Job not found' }];
      const age = (now - j._t) / 1000;
      const status = age < 3 ? 'queued' : age < 7 ? 'running' : 'completed';
      const { _t, ...rest } = j;
      return [200, { ...rest, status, ...(status === 'completed' ? { rows: 20, passed: 14, exceptions: s.exc.length } : {}) }];
    }
    if (method === 'GET' && (m = p.match(/^\/jobs\/(\d+)\/exceptions$/))) {
      const u = await auth(); if (Array.isArray(u)) return u;
      if (!s.jobs[m[1]]) return [404, { detail: 'Job not found' }];
      const page = Math.max(1, +(q.page || 1)), size = Math.min(50, Math.max(1, +(q.size || 3)));
      let list = s.exc; if (q.rule) list = list.filter((e) => e.rule === q.rule);
      const items = list.slice((page - 1) * size, page * size);
      return [200, { items, page, size, total: list.length, next: page * size < list.length ? `/jobs/${m[1]}/exceptions?page=${page + 1}&size=${size}${q.rule ? '&rule=' + q.rule : ''}` : null }];
    }
    if (method === 'POST' && (m = p.match(/^\/exceptions\/(\d+)\/resolve$/))) {
      const u = await auth(); if (Array.isArray(u)) return u;
      if (!['reviewer', 'admin'].includes(u.role)) return [403, { detail: `Role '${u.role}' cannot resolve exceptions` }];
      const e = s.exc.find((x) => x.id === +m[1]); if (!e) return [404, { detail: 'Exception not found' }];
      if (!body?.comment) return [422, { detail: [{ loc: ['body', 'comment'], msg: 'Field required', type: 'missing' }] }];
      e.status = 'resolved';
      return [200, { ...e, resolved_by: u.sub, comment: body.comment, audit: 'logged' }];
    }
    return [404, { detail: 'Not Found' }];
  };
}

const PRESETS = [
  { label: '1 · health check', method: 'GET', path: '/health', body: '' },
  { label: '2 · login as uploader', method: 'POST', path: '/token', body: '{\n  "username": "uploader",\n  "password": "uploader"\n}' },
  { label: '3 · upload without token', method: 'POST', path: '/payroll-files', body: '{ "file_name": "payroll_2026-09.xlsx" }', noAuth: true },
  { label: '4 · upload with token', method: 'POST', path: '/payroll-files', body: '{ "file_name": "payroll_2026-09.xlsx" }', idem: true },
  { label: '5 · poll job status', method: 'GET', path: '/jobs/41', body: '' },
  { label: '6 · exceptions page 1', method: 'GET', path: '/jobs/41/exceptions?page=1&size=3', body: '' },
  { label: '7 · filter by rule', method: 'GET', path: '/jobs/41/exceptions?rule=MISSING_PAN', body: '' },
  { label: '8 · resolve (wrong role)', method: 'POST', path: '/exceptions/5/resolve', body: '{ "comment": "PAN collected from employee" }' },
  { label: '9 · login as reviewer', method: 'POST', path: '/token', body: '{\n  "username": "reviewer",\n  "password": "reviewer"\n}' },
  { label: '10 · missing field', method: 'POST', path: '/exceptions/5/resolve', body: '{ }' },
];

const color = (c) => (c < 300 ? 'ok' : c < 500 ? 'warn' : 'bad');

export default function ApiPlayground() {
  const server = useServer();
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/health');
  const [body, setBody] = useState('');
  const [token, setToken] = useState('');
  const [useAuth, setUseAuth] = useState(true);
  const [idem, setIdem] = useState('');
  const [resp, setResp] = useState(null);
  const [hist, setHist] = useState([]);

  const send = async () => {
    const headers = { 'content-type': 'application/json' };
    if (useAuth && token) headers.authorization = 'Bearer ' + token;
    if (idem) headers['idempotency-key'] = idem;
    const t = performance.now();
    const [code, json, h = {}] = await server(method, path, headers, method === 'GET' ? '' : body);
    const r = { code, json, h, ms: Math.round(performance.now() - t + 20 + Math.random() * 40), method, path };
    setResp(r); setHist([r, ...hist].slice(0, 12));
    if (path === '/token' && code === 200) setToken(json.access_token);
  };
  const preset = (p) => { setMethod(p.method); setPath(p.path); setBody(p.body); setUseAuth(!p.noAuth); setIdem(p.idem ? 'upload-2026-09-v1' : ''); };

  return (
    <div className="w-api">
      <div className="w-title">API playground — a fake FastAPI service running in your browser</div>
      <div className="chips">{PRESETS.map((p) => <button key={p.label} className="chip" onClick={() => preset(p)}>{p.label}</button>)}</div>
      <div className="row">
        <select value={method} onChange={(e) => setMethod(e.target.value)}>{['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}</select>
        <span className="muted mono">https://payroll-api.local</span>
        <input className="mono-in" value={path} onChange={(e) => setPath(e.target.value)} />
        <button className="btn primary" onClick={send}>Send</button>
      </div>
      <div className="row wrap">
        <label className="toggle"><input type="checkbox" checked={useAuth} onChange={(e) => setUseAuth(e.target.checked)} /> send <code>Authorization: Bearer &lt;token&gt;</code></label>
        <span className="muted small">{token ? `token: ${token.slice(0, 22)}…` : 'no token yet — log in with preset 2'}</span>
        <label className="lbl">Idempotency-Key</label><input className="mono-in" style={{ maxWidth: 200 }} value={idem} onChange={(e) => setIdem(e.target.value)} placeholder="(none)" />
      </div>
      {method !== 'GET' && <textarea className="mono-in" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="JSON body" />}
      {resp && (
        <div className="api-resp">
          <div className={`status ${color(resp.code)}`}>{resp.code} {({ 200: 'OK', 201: 'Created', 202: 'Accepted', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Server Error' })[resp.code]} · {resp.ms} ms</div>
          {Object.keys(resp.h).length > 0 && <div className="muted small mono">{Object.entries(resp.h).map(([k, v]) => `${k}: ${v}`).join('  ·  ')}</div>}
          <pre className="console">{JSON.stringify(resp.json, null, 2)}</pre>
        </div>
      )}
      {hist.length > 1 && <div className="api-hist">{hist.map((h, i) => <span key={i} className={`pill ${color(h.code)}`}>{h.method} {h.path.split('?')[0]} → {h.code}</span>)}</div>}
      <p className="muted small">Try sending 9 requests quickly to hit the rate limit (429). Send preset 4 twice with the same Idempotency-Key: you get the same job back, not a duplicate. Wait ~7 s and poll the job to watch it go queued → running → completed.</p>
    </div>
  );
}
