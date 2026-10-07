import { useState } from 'react';

// Rough token splitter for intuition only (real tokenizers use BPE vocabularies).
function roughTokens(text) {
  const words = text.match(/\s*[A-Za-z]+|\s*\d{1,3}|\s*[^\sA-Za-z\d]/g) || [];
  const out = [];
  words.forEach((w) => {
    const core = w.trim();
    if (core.length > 7 && /^[A-Za-z]+$/.test(core)) {
      const lead = w.slice(0, w.length - core.length);
      for (let i = 0; i < core.length; i += 5) out.push((i === 0 ? lead : '') + core.slice(i, i + 5));
    } else out.push(w);
  });
  return out;
}

const NEXT = [['approved', 3.1], ['pending', 2.4], ['rejected', 1.6], ['flagged', 1.2], ['banana', -1.5]];

export default function TokenCost() {
  const [text, setText] = useState('Extract supplier GSTIN, invoice number, date and total from this invoice. Return JSON only.');
  const [inP, setInP] = useState(2.5);
  const [outP, setOutP] = useState(10);
  const [docTokens, setDocTokens] = useState(1500);
  const [outTokens, setOutTokens] = useState(250);
  const [calls, setCalls] = useState(2000);
  const [temp, setTemp] = useState(1);
  const toks = roughTokens(text);
  const perCall = ((toks.length + docTokens) * inP + outTokens * outP) / 1e6;
  const month = perCall * calls * 30;
  const exps = NEXT.map(([w, l]) => [w, Math.exp(l / Math.max(temp, 0.05))]);
  const Z = exps.reduce((a, [, e]) => a + e, 0);
  return (
    <div className="w-tokens">
      <div className="w-title">Tokens, cost and temperature</div>
      <textarea className="mono-in" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="tok-view">{toks.map((t, i) => <span key={i} className={`tok t${i % 5}`}>{t.replace(/ /g, '·')}</span>)}</div>
      <p className="muted small">≈ {toks.length} tokens for {text.length} characters (rule of thumb: 1 token ≈ ¾ of an English word ≈ 4 characters). Real tokenizers differ by model.</p>
      <div className="cost-grid">
        <label>input price $/1M tokens <input type="number" step="0.1" value={inP} onChange={(e) => setInP(+e.target.value)} /></label>
        <label>output price $/1M tokens <input type="number" step="0.1" value={outP} onChange={(e) => setOutP(+e.target.value)} /></label>
        <label>invoice text tokens / call <input type="number" value={docTokens} onChange={(e) => setDocTokens(+e.target.value)} /></label>
        <label>output tokens / call <input type="number" value={outTokens} onChange={(e) => setOutTokens(+e.target.value)} /></label>
        <label>calls per day <input type="number" value={calls} onChange={(e) => setCalls(+e.target.value)} /></label>
      </div>
      <div className="verdict ok">≈ ${perCall.toFixed(4)} per call → <b>${month.toFixed(0)} per month</b> (≈ ₹{(month * 84).toLocaleString('en-IN', { maximumFractionDigits: 0 })}). Prices here are placeholders. Always check your provider's current price page.</div>
      <div className="mini-cap" style={{ marginTop: 16 }}>Temperature: the model picks the next word for “Invoice status: ___”</div>
      <div className="row"><label className="lbl">temperature {temp.toFixed(1)}</label><input type="range" min="0" max="2" step="0.1" value={temp} onChange={(e) => setTemp(+e.target.value)} /></div>
      <div className="bars">
        {exps.map(([w, e]) => <div key={w} className="bar-row"><span className="mono">{w}</span><div className="bar"><div style={{ width: `${(e / Z) * 100}%` }} /></div><span className="mono small">{((e / Z) * 100).toFixed(1)}%</span></div>)}
      </div>
      <p className="muted small">Low temperature = the model almost always picks the top word (good for extraction, SQL, JSON). High temperature = more random (good for brainstorming, bad for finance).</p>
    </div>
  );
}
