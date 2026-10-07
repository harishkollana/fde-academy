import { useProgress } from '../lib/store';
import Md, { Inline } from './Md';
import Sketch from './Sketch';
import SqlPlayground from './SqlPlayground';
import PyPlayground, { PyChallenge } from './PyPlayground';
import Challenge from './Challenge';
import { WIDGETS } from '../widgets';

const CALLOUTS = {
  tip: ['💡', 'Tip'], warn: ['⚠️', 'Watch out'], analogy: ['🧠', 'Think of it like this'], interview: ['🎤', 'Interview angle'],
  real: ['🏢', 'In your real job'], remember: ['📌', 'Remember'], local: ['💻', 'Do this on your laptop'],
};

export function Callout({ kind, text }) {
  const [icon, label] = CALLOUTS[kind];
  return (
    <div className={`callout ${kind}`}>
      <div className="callout-h">{icon} {label}</div>
      <Md text={text} />
    </div>
  );
}

export function Checklist({ items, prefix, xp = 10 }) {
  const { state, dispatch } = useProgress();
  return (
    <ul className="checklist">
      {items.map((it, i) => {
        const key = `${prefix}:${i}`;
        const on = !!state.checks[key];
        return (
          <li key={key} className={on ? 'on' : ''}>
            <label>
              <input type="checkbox" checked={on} onChange={() => dispatch({ type: 'check', key, xp })} />
              <span className="box" aria-hidden>{on ? '✓' : ''}</span>
              <span><Inline text={it} /></span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export default function Blocks({ blocks, idBase }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        const key = `${idBase}-${i}`;
        if (typeof b === 'string') return <Md key={key} text={b} />;
        if (b.sketch) return <Sketch key={key} spec={b.sketch} seed={i + 3} />;
        if (b.sql) return <SqlPlayground key={key} id={`${idBase}-sql-${i}`} {...b.sql} />;
        if (b.py) return <PyPlayground key={key} id={`${idBase}-py-${i}`} {...b.py} />;
        if (b.challenge) return <Challenge key={key} id={b.challenge.id || `${idBase}-ch-${i}`} {...b.challenge} />;
        if (b.pychallenge) return <PyChallenge key={key} id={b.pychallenge.id || `${idBase}-pch-${i}`} {...b.pychallenge} />;
        if (b.widget) { const W = WIDGETS[b.widget]; return W ? <div className="widget" key={key}><W {...(b.props || {})} /></div> : <div key={key} className="error">Missing widget {b.widget}</div>; }
        if (b.checklist) return <Checklist key={key} items={b.checklist} prefix={`${idBase}-cl-${i}`} />;
        if (b.cols) return <div key={key} className="cols">{b.cols.map((c, j) => <div key={j} className="col card"><Md text={c} /></div>)}</div>;
        const kind = Object.keys(CALLOUTS).find((k) => b[k]);
        if (kind) return <Callout key={key} kind={kind} text={b[kind]} />;
        return null;
      })}
    </div>
  );
}
