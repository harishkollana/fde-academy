const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const strB64 = (s) => b64url(enc.encode(s));
export const fromB64 = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); };

async function hmac(secret, data) {
  if (!globalThis.crypto?.subtle) { // non-secure context fallback (demo only, not real crypto)
    let h1 = 0x811c9dc5, h2 = 0x1234567; const s = secret + '|' + data;
    for (let i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822507); }
    return strB64((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16));
  }
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function signJwt(payload, secret = 'dev-secret') {
  const h = strB64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = strB64(JSON.stringify(payload));
  return `${h}.${p}.${await hmac(secret, `${h}.${p}`)}`;
}

export async function verifyJwt(token, secret = 'dev-secret') {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'A JWT has 3 parts separated by dots.' };
  let payload;
  try { payload = JSON.parse(fromB64(parts[1])); } catch { return { ok: false, reason: 'Payload is not valid base64 JSON.' }; }
  const sig = await hmac(secret, `${parts[0]}.${parts[1]}`);
  if (sig !== parts[2]) return { ok: false, reason: 'Signature does not match — the token was changed or signed with another key.', payload };
  if (payload.exp && payload.exp * 1000 < Date.now()) return { ok: false, reason: 'Token expired.', payload };
  return { ok: true, payload };
}
