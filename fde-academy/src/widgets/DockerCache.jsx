import { useState } from 'react';

const GOOD = [
  { l: 'FROM python:3.12-slim', dep: 'base', t: 0 },
  { l: 'WORKDIR /app', dep: 'base', t: 0.1 },
  { l: 'COPY requirements.txt .', dep: 'req', t: 0.1 },
  { l: 'RUN pip install --no-cache-dir -r requirements.txt', dep: 'req', t: 48 },
  { l: 'COPY app/ ./app', dep: 'code', t: 0.2 },
  { l: 'CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]', dep: 'code', t: 0 },
];
const BAD = [
  { l: 'FROM python:3.12-slim', dep: 'base', t: 0 },
  { l: 'WORKDIR /app', dep: 'base', t: 0.1 },
  { l: 'COPY . .', dep: 'any', t: 0.4 },
  { l: 'RUN pip install --no-cache-dir -r requirements.txt', dep: 'any', t: 48 },
  { l: 'CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]', dep: 'any', t: 0 },
];

export default function DockerCache() {
  const [order, setOrder] = useState('good');
  const [change, setChange] = useState('code');
  const [built, setBuilt] = useState(null);
  const lines = order === 'good' ? GOOD : BAD;
  const build = (first) => {
    let broken = false;
    const res = lines.map((x) => {
      const changed = first || (x.dep === 'any' && change !== 'none') || x.dep === change || (change === 'req' && x.dep === 'code' && false);
      if (changed) broken = true;
      const cached = !first && !broken;
      return { ...x, cached };
    });
    setBuilt(res);
  };
  const total = built ? built.reduce((a, x) => a + (x.cached ? 0 : x.t), 0) : 0;
  return (
    <div className="w-docker">
      <div className="w-title">Docker layer cache simulator</div>
      <div className="row wrap">
        <div className="chips"><button className={order === 'good' ? 'chip on' : 'chip'} onClick={() => { setOrder('good'); setBuilt(null); }}>✅ good order</button><button className={order === 'bad' ? 'chip on' : 'chip'} onClick={() => { setOrder('bad'); setBuilt(null); }}>❌ COPY . . first</button></div>
      </div>
      <pre className="sqlsnip">{lines.map((x, i) => {
        const b = built?.[i];
        return `${b ? (b.cached ? 'CACHED ' : 'BUILD  ') : '       '} ${x.l}${b && !b.cached && x.t > 1 ? `   (${x.t}s)` : ''}`;
      }).join('\n')}</pre>
      <div className="row wrap">
        <button className="btn" onClick={() => build(true)}>first build</button>
        <span className="lbl">then I changed:</span>
        <select value={change} onChange={(e) => setChange(e.target.value)}>
          <option value="code">only app code (main.py)</option>
          <option value="req">requirements.txt</option>
          <option value="none">nothing</option>
        </select>
        <button className="btn primary" onClick={() => build(false)}>rebuild</button>
      </div>
      {built && <div className={total > 10 ? 'verdict bad' : 'verdict ok'}>Build time ≈ {total.toFixed(1)} s. {total > 10 ? 'pip install ran again 😩' : 'pip install came from cache 🚀'}</div>}
      <p className="muted small">Docker caches each instruction as a layer. When one layer changes, <b>every layer after it is rebuilt</b>. So copy the things that change rarely (requirements) before the things that change often (your code).</p>
    </div>
  );
}
