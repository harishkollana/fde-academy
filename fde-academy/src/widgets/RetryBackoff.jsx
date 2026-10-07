import { useMemo, useState } from 'react';
import './extra.css';

// Part A: 8 clients retry against a server that is down for a while. Part B: a payment whose response gets lost.
const POLICIES = {
  'No retry': 'Fail once and give up. Simple, and every blip becomes an error.',
  'Fixed 1 s': 'Wait exactly 1 second between tries. All clients that failed together retry together.',
  Exponential: 'Wait 1 s, 2 s, 4 s, 8 s … Gentler, but clients that started together still stay in lock-step.',
  'Exponential + jitter': 'Wait a RANDOM time between 0 and the exponential limit. Clients spread out, so the recovering server is not hit by a wave.',
};
const CLIENTS = 8; const MAX_ATTEMPTS = 6; const CAP = 16;

const rng = (seed) => { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; };

function simulate(policy, outage) {
  return Array.from({ length: CLIENTS }, (_, c) => {
    const rand = rng(c * 7919 + 13);
    let t = 0; const tries = []; let end = 'gave up';
    for (let a = 1; a <= MAX_ATTEMPTS; a++) {
      const ok = t >= outage;
      tries.push({ t, ok });
      if (ok) { end = 'ok'; break; }
      if (policy === 'No retry') break;
      const limit = Math.min(CAP, 2 ** (a - 1));
      t += policy === 'Fixed 1 s' ? 1 : policy === 'Exponential' ? limit : rand() * limit;
    }
    return { tries, end };
  });
}

function Timeline({ runs, outage }) {
  const horizon = Math.max(12, Math.ceil(Math.max(...runs.flatMap((r) => r.tries.map((x) => x.t)))) + 1);
  const W = 720; const L = 40; const lane = 22; const H = runs.length * lane + 34;
  const x = (t) => L + (t / horizon) * (W - L - 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-rb-svg" role="img" aria-label="Retry attempts per client over time">
      <rect x={x(0)} y="4" width={Math.max(0, x(outage) - x(0))} height={runs.length * lane} className="rb-outage" />
      <text x={x(outage / 2)} y="16" textAnchor="middle" className="rb-t">server down</text>
      {runs.map((r, i) => (
        <g key={i}>
          <text x="4" y={i * lane + 22} className="rb-t">C{i + 1}</text>
          <line x1={x(0)} x2={x(horizon)} y1={i * lane + 18} y2={i * lane + 18} className="rb-lane" />
          {r.tries.map((tr, k) => (tr.ok
            ? <circle key={k} cx={x(tr.t)} cy={i * lane + 18} r="6" className="rb-ok"><title>{`success at ${tr.t.toFixed(1)} s`}</title></circle>
            : <path key={k} d={`M${x(tr.t) - 4} ${i * lane + 14} l8 8 m-8 0 l8 -8`} className="rb-fail"><title>{`failed at ${tr.t.toFixed(1)} s`}</title></path>))}
          {r.end === 'gave up' && <text x={x(r.tries[r.tries.length - 1].t) + 10} y={i * lane + 22} className="rb-t rb-dead">gave up → dead-letter queue</text>}
        </g>
      ))}
      {Array.from({ length: Math.floor(horizon / 2) + 1 }, (_, k) => k * 2).map((s) => (
        <text key={s} x={x(s)} y={H - 6} textAnchor="middle" className="rb-t">{s}s</text>
      ))}
    </svg>
  );
}

export default function RetryBackoff() {
  const [policy, setPolicy] = useState('Fixed 1 s');
  const [outage, setOutage] = useState(5);
  const runs = useMemo(() => simulate(policy, outage), [policy, outage]);
  const attempts = runs.flatMap((r) => r.tries);
  const perSecond = {};
  attempts.forEach((a) => { const b = Math.floor(a.t); perSecond[b] = (perSecond[b] || 0) + 1; });
  const peak = Math.max(...Object.values(perSecond));
  // What matters for a recovering server is the wave that arrives AFTER it is back, so count only attempts from then on.
  const afterRecovery = {};
  attempts.filter((a) => a.t >= outage).forEach((a) => { const b = Math.floor(a.t); afterRecovery[b] = (afterRecovery[b] || 0) + 1; });
  const peakAfter = Math.max(0, ...Object.values(afterRecovery));
  const good = runs.filter((r) => r.end === 'ok').length;

  const [useKey, setUseKey] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [story, setStory] = useState([]);
  const pay = () => {
    const entries = [{ n: 1, note: 'first attempt: the bank processes it' }];
    const lines = ['Attempt 1: POST /payments {"amount": 50000}' + (useKey ? ' with Idempotency-Key: inv-2026-0042' : '') + '. The server charges ₹50,000.', 'The response is LOST (timeout). The client cannot know whether the payment happened, so it retries.'];
    if (useKey) lines.push('Attempt 2: same request, same key. The server finds the key in its table and returns the original result. Nothing is charged again.');
    else { lines.push('Attempt 2: same request. With no key the server cannot tell it is a repeat, so it charges ₹50,000 AGAIN.'); entries.push({ n: 2, note: 'retry: charged a second time', dup: true }); }
    setLedger(entries.map((e) => ({ ...e, key: String(e.n) }))); setStory(lines); // each click is a fresh scenario for one invoice
  };
  const total = ledger.length * 50000;

  return (
    <div className="w-rb">
      <div className="w-title">Retries, backoff and idempotency</div>
      <div className="mini-cap">A · eight clients, one outage</div>
      <div className="chips" role="group" aria-label="Retry policy">{Object.keys(POLICIES).map((k) => <button key={k} className={k === policy ? 'chip on' : 'chip'} onClick={() => setPolicy(k)}>{k}</button>)}</div>
      <p className="w-desc">{POLICIES[policy]}</p>
      <div className="row wrap"><label className="lbl" htmlFor="rb-out">Server is down for {outage} s</label><input id="rb-out" type="range" min="2" max="12" value={outage} onChange={(e) => setOutage(+e.target.value)} /></div>
      <Timeline runs={runs} outage={outage} />
      <div className="w-rb-bars" aria-label="Requests per second">
        {Array.from({ length: Math.max(...Object.keys(perSecond).map(Number)) + 1 }, (_, s) => (
          <div key={s} className="w-rb-bar" title={`${perSecond[s] || 0} requests in second ${s}`}><div style={{ height: `${((perSecond[s] || 0) / peak) * 100}%` }} /><span>{s}</span></div>
        ))}
      </div>
      <div className={good === CLIENTS ? 'verdict ok' : 'verdict bad'}>{good} of {CLIENTS} clients succeeded · {CLIENTS - good} gave up · {attempts.length} requests in total · busiest second after the server is back: <b>{peakAfter ? `${peakAfter} request${peakAfter === 1 ? '' : 's'}` : 'none (nobody retried)'}</b>{peakAfter >= CLIENTS ? ' (everyone at once: a wave hitting a server that is trying to recover)' : ''}</div>

      <div className="mini-cap" style={{ marginTop: 18 }}>B · the response is lost, the client retries</div>
      <div className="row wrap">
        <label className="toggle"><input type="checkbox" checked={useKey} onChange={(e) => setUseKey(e.target.checked)} /> send an Idempotency-Key</label>
        <button className="btn primary" onClick={pay}>Pay ₹50,000 to the supplier</button>
        <button className="btn-mini" onClick={() => { setLedger([]); setStory([]); }}>reset ledger</button>
      </div>
      {story.length > 0 && <ol className="w-rb-story">{story.map((l, i) => <li key={i}>{l}</li>)}</ol>}
      <table className="grid mini"><thead><tr><th>#</th><th>bank ledger entry</th><th className="num">amount</th></tr></thead>
        <tbody>{ledger.length ? ledger.map((e, i) => <tr key={e.key} className={e.dup ? 'k-left' : ''}><td>{i + 1}</td><td>{e.note}{e.dup ? '  ← duplicate' : ''}</td><td className="num">₹50,000</td></tr>) : <tr><td colSpan="3" className="null">no payments yet</td></tr>}</tbody></table>
      <p className="small">Total debited: <b>₹{total.toLocaleString('en-IN')}</b>. The invoice was for ₹50,000.{total > 50000 ? ' The client did the right thing (retry); the server was not idempotent.' : ''}</p>
    </div>
  );
}
