import { useMemo, useState } from 'react';

const PRESETS = {
  GSTIN: { re: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$', tests: ['36AABCS1429B1Z5', '37AAFCV7781M1ZQ', '36aabcs1429b1z5', '36AABCS1429B1Y5', '3AABCS1429B1Z5'], explain: '2-digit state code · 5 letters + 4 digits + 1 letter (the PAN) · entity number · the letter Z · checksum' },
  IFSC: { re: '^[A-Z]{4}0[A-Z0-9]{6}$', tests: ['HDFC0001234', 'SBIN0ABC123', 'HDFC123456', 'sbin0001234', 'ICIC10001234'], explain: '4 letters (bank) · a zero · 6 letters/digits (branch)' },
  PAN: { re: '^[A-Z]{5}[0-9]{4}[A-Z]$', tests: ['ABCPE1234F', 'ABCDE12345', 'abcpe1234f', 'AB1PE1234F'], explain: '5 letters · 4 digits · 1 letter' },
  'Invoice no': { re: '^INV/[0-9]{4}/[0-9]{2}-[0-9]{2}$', tests: ['INV/0042/25-26', 'INV-0042/25-26', 'INV/42/25-26'], explain: 'INV / four digits / fiscal year like 25-26' },
  Email: { re: '^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$', tests: ['asha@example.com', 'asha@example', 'as ha@x.com'], explain: 'something @ something . letters' },
};

export default function RegexTester({ preset = 'GSTIN' }) {
  const [name, setName] = useState(preset);
  const [pattern, setPattern] = useState(PRESETS[preset].re);
  const [flags, setFlags] = useState('');
  const [text, setText] = useState(PRESETS[preset].tests.join('\n'));
  const choose = (k) => { setName(k); setPattern(PRESETS[k].re); setText(PRESETS[k].tests.join('\n')); };
  const { re, err } = useMemo(() => { try { return { re: new RegExp(pattern, flags) }; } catch (e) { return { err: e.message }; } }, [pattern, flags]);
  return (
    <div className="w-regex">
      <div className="w-title">Regex tester — validate Indian finance IDs</div>
      <div className="chips">{Object.keys(PRESETS).map((k) => <button key={k} className={k === name ? 'chip on' : 'chip'} onClick={() => choose(k)}>{k}</button>)}</div>
      <div className="row">
        <label className="lbl">pattern</label>
        <input className="mono-in" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <label className="toggle"><input type="checkbox" checked={flags === 'i'} onChange={(e) => setFlags(e.target.checked ? 'i' : '')} /> ignore case</label>
      </div>
      {PRESETS[name] && pattern === PRESETS[name].re && <p className="muted small">Reads as: {PRESETS[name].explain}</p>}
      {err && <div className="error">{err}</div>}
      <div className="row top">
        <textarea className="mono-in" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
        <ul className="regex-res">
          {text.split('\n').map((t, i) => <li key={i} className={re && re.test(t) ? 'ok' : 'bad'}>{re && re.test(t) ? '✓' : '✗'} <code>{t || '(empty)'}</code></li>)}
        </ul>
      </div>
      <pre className="sqlsnip">{`-- PostgreSQL\nSELECT ifsc, ifsc ~ '${pattern}' AS valid FROM employees;\n-- Python\nimport re\nre.fullmatch(r"${pattern.replace(/^\^|\$$/g, '')}", value)`}</pre>
      <p className="muted small">Cheat sheet: <code>^</code> start · <code>$</code> end · <code>[A-Z]</code> one capital · <code>{'{4}'}</code> exactly 4 · <code>+</code> one or more · <code>*</code> zero or more · <code>?</code> optional · <code>\d</code> digit · <code>|</code> or · <code>( )</code> group</p>
    </div>
  );
}
