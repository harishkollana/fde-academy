import { useReducer } from 'react';
import './extra.css';

// A load balancer in front of three servers. Deterministic: the same clicks always give the same result.
const ALGOS = {
  'Round robin': 'Take the servers in turn: 1, 2, 3, 1, 2, 3 …  Simple and fair when requests cost about the same.',
  'Least connections': 'Send each request to the server with the fewest open connections right now. Good when some requests take much longer than others.',
  'IP hash': 'Hash the client IP address. The same client always lands on the same server (a cheap form of stickiness).',
  'Weighted round robin': 'Round robin, but a bigger server (weight 3) gets 3 turns for every 1 turn of a small one (weight 1).',
};
const CLIENTS = ['10.0.0.11', '10.0.0.12', '10.0.0.13', '10.0.0.14', '10.0.0.15', '10.0.0.16'];
const DURATIONS = [4, 1, 3, 2, 5, 1, 2, 4, 3, 1]; // how many ticks each request keeps its connection open
const CHECK_EVERY = 3; // the LB health-checks every 3 requests (a stand-in for "every few seconds")

const fresh = () => ({
  algo: 'Round robin', sticky: false, n: 0, rr: 0, wrr: 0, since: 0, stickyMap: {}, log: [], total: 0, failed: 0,
  servers: [
    { id: 1, name: 'S1', weight: 1, alive: true, known: true, active: [], served: 0, errors: 0 },
    { id: 2, name: 'S2', weight: 1, alive: true, known: true, active: [], served: 0, errors: 0 },
    { id: 3, name: 'S3', weight: 3, alive: true, known: true, active: [], served: 0, errors: 0 },
  ],
});

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function healthCheck(s) {
  const log = [...s.log];
  const servers = s.servers.map((v) => {
    if (v.known !== v.alive) log.push(`health check: ${v.name} marked ${v.alive ? 'UP again' : 'DOWN'} — no more traffic goes there${v.alive ? '' : ' until it recovers'}`);
    return { ...v, known: v.alive };
  });
  return { ...s, servers, log, since: 0 };
}

function send(s) {
  const client = CLIENTS[s.n % CLIENTS.length];
  const dur = DURATIONS[s.n % DURATIONS.length];
  let servers = s.servers.map((v) => ({ ...v, active: v.active.map((d) => d - 1).filter((d) => d > 0) })); // time passes
  const cands = servers.filter((v) => v.known);
  const out = { ...s, n: s.n + 1, since: s.since + 1, total: s.total + 1 };
  let log = [...s.log]; let pick = null; let why = '';
  if (!cands.length) {
    log.push(`#${s.n + 1} ${client} → 503: the load balancer has no healthy server`);
    out.failed += 1;
  } else {
    const stuck = s.sticky && s.stickyMap[client] && cands.find((v) => v.id === s.stickyMap[client]);
    if (stuck) { pick = stuck; why = 'sticky cookie'; }
    else if (s.algo === 'Round robin') { pick = cands[s.rr % cands.length]; out.rr = s.rr + 1; why = 'next in turn'; }
    else if (s.algo === 'Least connections') { pick = [...cands].sort((a, b) => a.active.length - b.active.length || a.id - b.id)[0]; why = `${pick.active.length} open connection(s)`; }
    else if (s.algo === 'IP hash') { pick = cands[hash(client) % cands.length]; why = 'hash of the client IP'; }
    else { const wheel = cands.flatMap((v) => Array(v.weight).fill(v)); pick = wheel[s.wrr % wheel.length]; out.wrr = s.wrr + 1; why = `weight ${pick.weight}`; }
    servers = servers.map((v) => {
      if (v.id !== pick.id) return v;
      if (!v.alive) return { ...v, errors: v.errors + 1 };
      return { ...v, served: v.served + 1, active: [...v.active, dur] };
    });
    if (!pick.alive) { log.push(`#${s.n + 1} ${client} → ${pick.name} ✗ connection refused (the LB has not noticed it is down yet)`); out.failed += 1; }
    else { log.push(`#${s.n + 1} ${client} → ${pick.name} ✓ (${why})`); if (s.sticky) out.stickyMap = { ...s.stickyMap, [client]: pick.id }; }
  }
  return { ...out, servers, log: log.slice(-40) };
}

function reducer(s, a) {
  switch (a.type) {
    case 'algo': return { ...fresh(), algo: a.algo, sticky: s.sticky };
    case 'sticky': return { ...fresh(), algo: s.algo, sticky: a.on };
    case 'send': { let t = s; for (let i = 0; i < a.n; i++) { t = send(t); if (t.since >= CHECK_EVERY) t = healthCheck(t); } return t; }
    case 'toggle': return { ...s, servers: s.servers.map((v) => (v.id === a.id ? { ...v, alive: !v.alive } : v)), log: [...s.log, `${s.servers[a.id - 1].name} ${s.servers[a.id - 1].alive ? 'CRASHED' : 'recovered'} (the load balancer finds out at its next health check)`].slice(-40) };
    case 'check': return healthCheck(s);
    case 'reset': return fresh();
    default: return s;
  }
}

export default function LoadBalancer() {
  const [s, dispatch] = useReducer(reducer, undefined, fresh);
  const okTotal = s.servers.reduce((n, v) => n + v.served, 0);
  return (
    <div className="w-lb">
      <div className="w-title">Load balancer: pick an algorithm, send traffic, crash a server</div>
      <div className="chips" role="group" aria-label="Algorithm">
        {Object.keys(ALGOS).map((k) => <button key={k} className={k === s.algo ? 'chip on' : 'chip'} onClick={() => dispatch({ type: 'algo', algo: k })}>{k}</button>)}
      </div>
      <p className="w-desc">{ALGOS[s.algo]}</p>
      <div className="row wrap">
        <button className="btn primary" onClick={() => dispatch({ type: 'send', n: 1 })}>Send 1 request</button>
        <button className="btn" onClick={() => dispatch({ type: 'send', n: 10 })}>Send 10</button>
        <label className="toggle"><input type="checkbox" checked={s.sticky} onChange={(e) => dispatch({ type: 'sticky', on: e.target.checked })} /> sticky sessions (cookie)</label>
        <button className="btn-mini" onClick={() => dispatch({ type: 'check' })}>health check now</button>
        <button className="btn-mini" onClick={() => dispatch({ type: 'reset' })}>reset</button>
      </div>
      <div className="w-lb-grid">
        <div className="w-lb-front">
          <div className="w-lb-clients">{CLIENTS.slice(0, 3).map((c) => <span key={c}>{c}</span>)}<span>…</span></div>
          <div className="w-lb-arrow" aria-hidden>↓</div>
          <div className="w-lb-box">load balancer</div>
          <div className="w-lb-arrow" aria-hidden>↓ ↓ ↓</div>
        </div>
        <div className="w-lb-servers">
          {s.servers.map((v) => {
            const state = !v.alive ? (v.known ? 'down' : 'crashed') : 'up';
            return (
              <div key={v.id} className={`w-lb-srv ${state}`}>
                <div className="w-lb-name">{v.name} <span className="muted small">weight {v.weight}</span></div>
                <div className="w-lb-badge">{state === 'up' ? 'healthy' : state === 'down' ? 'marked down' : 'crashed, LB unaware'}</div>
                <div className="w-lb-conns" aria-label={`${v.active.length} open connections`}>{v.active.length ? v.active.map((_, i) => <i key={i} />) : <span className="muted small">no open connections</span>}</div>
                <div className="w-lb-bar"><div style={{ width: `${okTotal ? (v.served / okTotal) * 100 : 0}%` }} /></div>
                <div className="small">{v.served} served{okTotal ? ` · ${Math.round((v.served / okTotal) * 100)}%` : ''}{v.errors ? <b className="w-lb-err"> · {v.errors} failed</b> : null}</div>
                <button className="btn-mini" onClick={() => dispatch({ type: 'toggle', id: v.id })}>{v.alive ? 'crash it' : 'recover it'}</button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mini-cap">log (newest at the bottom) · {s.total} sent · {s.failed} failed</div>
      <ol className="w-lb-log" aria-live="polite">{s.log.length ? s.log.slice(-8).map((l, i) => <li key={i} className={l.includes('✗') || l.includes('503') || l.includes('CRASH') ? 'bad' : ''}>{l}</li>) : <li className="muted">Nothing sent yet.</li>}</ol>
      <p className="muted small">Try this: choose “Round robin”, crash S2, then send 10. The first requests to S2 fail because the health check only runs every {CHECK_EVERY} requests. After it marks S2 down, traffic flows to S1 and S3 only. That gap is why health-check frequency matters.</p>
    </div>
  );
}
