import { useEffect, useState } from 'react';
import { fromB64, signJwt, verifyJwt } from './jwt';

export default function JwtDecoder() {
  const [tok, setTok] = useState('');
  const [v, setV] = useState(null);
  useEffect(() => { signJwt({ sub: 'learner', role: 'uploader', exp: Math.floor(Date.now() / 1000) + 3600 }).then(setTok); }, []);
  useEffect(() => { if (tok) verifyJwt(tok).then(setV); }, [tok]);
  const parts = tok.split('.');
  let header = '', payload = '';
  try { header = JSON.stringify(JSON.parse(fromB64(parts[0])), null, 2); } catch { header = '(invalid)'; }
  try { payload = JSON.stringify(JSON.parse(fromB64(parts[1])), null, 2); } catch { payload = '(invalid)'; }
  const tamper = () => {
    try {
      const p = JSON.parse(fromB64(parts[1])); p.role = 'admin';
      const np = btoa(JSON.stringify(p)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      setTok(`${parts[0]}.${np}.${parts[2]}`);
    } catch { /* ignore */ }
  };
  return (
    <div className="w-jwt">
      <div className="w-title">JWT decoder — what is inside a login token?</div>
      <textarea className="mono-in jwt-in" rows={3} value={tok} onChange={(e) => setTok(e.target.value.trim())} />
      <div className="jwt-colored mono">{parts.map((p, i) => <span key={i} className={`jp${i}`}>{p}{i < 2 ? '.' : ''}</span>)}</div>
      <div className="cols">
        <div className="col card"><div className="mini-cap jp0">HEADER — algorithm</div><pre>{header}</pre></div>
        <div className="col card"><div className="mini-cap jp1">PAYLOAD — claims (who, role, expiry)</div><pre>{payload}</pre></div>
        <div className="col card"><div className="mini-cap jp2">SIGNATURE</div><p className="small">HMAC-SHA256(header + "." + payload, <b>secret</b>). Only the server knows the secret.</p></div>
      </div>
      <div className="row wrap">
        <button className="btn" onClick={tamper}>😈 change role to admin (tamper)</button>
        <button className="btn-mini" onClick={() => signJwt({ sub: 'learner', role: 'uploader', exp: Math.floor(Date.now() / 1000) + 3600 }).then(setTok)}>new valid token</button>
        <button className="btn-mini" onClick={() => signJwt({ sub: 'learner', role: 'uploader', exp: Math.floor(Date.now() / 1000) - 60 }).then(setTok)}>expired token</button>
      </div>
      {v && <div className={v.ok ? 'verdict ok' : 'verdict bad'}>{v.ok ? '✓ Server says: signature valid, token accepted.' : `✗ Server rejects it: ${v.reason}`}</div>}
      <p className="muted small">Key lesson: anyone can <b>read</b> a JWT (it is only base64, not encrypted), so never put secrets in it. Nobody can <b>change</b> it without breaking the signature.</p>
    </div>
  );
}
