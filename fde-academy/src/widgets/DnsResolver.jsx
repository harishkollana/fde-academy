import { useState } from 'react';
import './extra.css';

// A tiny DNS: two zones, three cache layers, recursive resolution with TTLs. Addresses come from the documentation ranges (RFC 5737).
const ZONES0 = {
  'kollana-tech.in': {
    ns: 'ns1.dns-host.example', tld: 'in',
    records: {
      '@': [{ type: 'A', value: '203.0.113.10', ttl: 300 }, { type: 'MX', value: '10 mail.kollana-tech.in', ttl: 3600 }, { type: 'TXT', value: '"v=spf1 include:spf.protection.outlook.com -all"', ttl: 3600 }],
      www: [{ type: 'CNAME', value: 'kollana-tech.in', ttl: 300 }],
      app: [{ type: 'CNAME', value: 'kollana-app.azurewebsites.net', ttl: 300 }],
      mail: [{ type: 'A', value: '203.0.113.25', ttl: 3600 }],
    },
  },
  'azurewebsites.net': {
    ns: 'ns1.cloud-dns.example', tld: 'net',
    records: { 'kollana-app': [{ type: 'A', value: '198.51.100.20', ttl: 60 }] },
  },
};
const NAMES = ['kollana-tech.in', 'www.kollana-tech.in', 'app.kollana-tech.in', 'mail.kollana-tech.in', 'ghost.kollana-tech.in'];
const TYPES = ['A', 'MX', 'TXT'];
const MS = { browser: 0, os: 1, resolver: 8, root: 25, tld: 30, auth: 40 };
const LAYERS = [['browser', 'your browser cache'], ['os', 'the OS cache (and hosts file)'], ['resolver', 'the resolver cache (ISP or 8.8.8.8)']];
const NS_TTL = 86400;

const zoneFor = (name, zones) => Object.keys(zones).find((z) => name === z || name.endsWith(`.${z}`));
const labelOf = (name, zone) => (name === zone ? '@' : name.slice(0, -(zone.length + 1)));
const emptyCaches = () => ({ browser: {}, os: {}, resolver: {} });

function resolve(name0, type, zones, caches0, now) {
  const caches = { browser: { ...caches0.browser }, os: { ...caches0.os }, resolver: { ...caches0.resolver } };
  const steps = []; let total = 0; let name = name0; let answer = null; let status = null;
  const put = (key, val) => LAYERS.forEach(([lay]) => { caches[lay][key] = val; });
  for (let hop = 0; hop < 6 && !answer && !status; hop++) {
    if (hop > 0) steps.push({ kind: 'note', text: `Now the same job for ${name} (the CNAME pointed here)` });
    let hit = null;
    for (const [lay, label] of LAYERS) {
      const e = [`${name}|${type}`, `${name}|CNAME`].map((k) => caches[lay][k]).find((x) => x && x.exp > now);
      total += MS[lay];
      if (e) { hit = { lay, label, e }; steps.push({ kind: 'hit', text: `${label}: HIT  ${name} → ${e.value}   (${e.exp - now}s of TTL left)`, ms: MS[lay] }); break; }
      steps.push({ kind: 'miss', text: `${label}: miss`, ms: MS[lay] });
    }
    if (hit) { if (hit.e.type === 'CNAME') { name = hit.e.value; continue; } answer = { value: hit.e.value, ttl: hit.e.exp - now }; break; }
    const zone = zoneFor(name, zones);
    const tld = name.split('.').pop();
    if (!caches.resolver[`NS|${tld}`] || caches.resolver[`NS|${tld}`].exp <= now) {
      total += MS.root; steps.push({ kind: 'ask', text: `Resolver asks a ROOT server for ${name}: "I don't know it, but ask the .${tld} servers"`, ms: MS.root });
      caches.resolver[`NS|${tld}`] = { value: `.${tld} servers`, exp: now + NS_TTL, type: 'NS' };
    } else steps.push({ kind: 'skip', text: `Resolver already knows the .${tld} servers (cached): skips the root`, ms: 0 });
    if (!zone) { total += MS.tld; steps.push({ kind: 'ask', text: `Resolver asks the .${tld} servers: "no such domain"`, ms: MS.tld }); status = 'NXDOMAIN'; break; }
    if (!caches.resolver[`NS|${zone}`] || caches.resolver[`NS|${zone}`].exp <= now) {
      total += MS.tld; steps.push({ kind: 'ask', text: `Resolver asks a .${tld} server: "ask ${zones[zone].ns} about ${zone}"`, ms: MS.tld });
      caches.resolver[`NS|${zone}`] = { value: zones[zone].ns, exp: now + NS_TTL, type: 'NS' };
    } else steps.push({ kind: 'skip', text: `Resolver already knows who runs ${zone} (cached): skips the .${tld} servers`, ms: 0 });
    total += MS.auth;
    const recs = zones[zone].records[labelOf(name, zone)] || [];
    const exact = recs.find((r) => r.type === type); const cname = recs.find((r) => r.type === 'CNAME');
    if (exact) { steps.push({ kind: 'ans', text: `Authoritative ${zones[zone].ns}: ${name} ${exact.type} ${exact.value}  (TTL ${exact.ttl}s)`, ms: MS.auth }); put(`${name}|${type}`, { value: exact.value, exp: now + exact.ttl, type }); answer = { value: exact.value, ttl: exact.ttl }; }
    else if (cname) { steps.push({ kind: 'ans', text: `Authoritative ${zones[zone].ns}: ${name} is a CNAME for ${cname.value}  (TTL ${cname.ttl}s)`, ms: MS.auth }); put(`${name}|CNAME`, { value: cname.value, exp: now + cname.ttl, type: 'CNAME' }); name = cname.value; }
    else { steps.push({ kind: 'ans', text: `Authoritative ${zones[zone].ns}: ${recs.length ? 'that name exists but has no ' + type + ' record (NODATA)' : 'no such name (NXDOMAIN)'}`, ms: MS.auth }); status = recs.length ? 'NODATA' : 'NXDOMAIN'; }
  }
  return { steps, total, answer, status, caches };
}

export default function DnsResolver() {
  const [zones, setZones] = useState(ZONES0);
  const [name, setName] = useState('app.kollana-tech.in');
  const [type, setType] = useState('A');
  const [now, setNow] = useState(0);
  const [caches, setCaches] = useState(emptyCaches());
  const [res, setRes] = useState(null);
  const moved = zones['azurewebsites.net'].records['kollana-app'][0].value !== '198.51.100.20';

  const go = () => { const r = resolve(name, type, zones, caches, now); setCaches(r.caches); setRes({ ...r, q: `${name} ${type}` }); };
  const wait = (s) => setNow(now + s);
  const flush = () => { setCaches(emptyCaches()); setRes(null); };
  const move = () => setZones({ ...zones, 'azurewebsites.net': { ...zones['azurewebsites.net'], records: { 'kollana-app': [{ type: 'A', value: moved ? '198.51.100.20' : '198.51.100.99', ttl: 60 }] } } });
  const live = Object.entries(caches.browser).filter(([k, v]) => !k.startsWith('NS|') && v.exp > now);

  return (
    <div className="w-dns">
      <div className="w-title">DNS resolver: watch a name become an address</div>
      <div className="row wrap">
        <label className="lbl" htmlFor="dns-name">Look up</label>
        <select id="dns-name" className="mono-in" value={name} onChange={(e) => setName(e.target.value)}>{NAMES.map((n) => <option key={n}>{n}</option>)}</select>
        <select className="mono-in" value={type} onChange={(e) => setType(e.target.value)} aria-label="Record type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <button className="btn primary" onClick={go}>Resolve</button>
        <button className="btn" onClick={() => wait(60)}>wait 60 s</button>
        <button className="btn" onClick={() => wait(600)}>wait 10 min</button>
        <button className="btn-mini" onClick={flush}>flush caches</button>
        <button className="btn-mini" onClick={move}>{moved ? 'move the site back' : 'move the site to a new server'}</button>
      </div>
      <p className="muted small">Clock: {now} s since you started. Moving the site changes the A record at <code>kollana-app.azurewebsites.net</code> (TTL 60 s). Resolve, move, resolve again: you still get the old address until the cached copy expires.</p>
      {res && (
        <>
          <div className="mini-cap">lookup: {res.q}</div>
          <ol className="w-dns-steps">{res.steps.map((s, i) => <li key={i} className={`k-${s.kind}`}><span>{s.text}</span>{s.ms !== undefined && <b>{s.ms} ms</b>}</li>)}</ol>
          <div className={res.answer ? 'verdict ok' : 'verdict bad'}>{res.answer ? <>Answer: <code>{res.answer.value}</code> · cached for {res.answer.ttl} s · total ≈ {res.total} ms</> : <>{res.status} · total ≈ {res.total} ms</>}</div>
        </>
      )}
      <div className="mini-cap">what your machine remembers right now</div>
      {live.length ? <table className="grid mini"><thead><tr><th>name</th><th>value</th><th>TTL left</th></tr></thead><tbody>{live.map(([k, v]) => <tr key={k}><td>{k.replace('|', '  ')}</td><td>{v.value}</td><td className="num">{v.exp - now} s</td></tr>)}</tbody></table> : <p className="muted small">Nothing cached.</p>}
    </div>
  );
}
