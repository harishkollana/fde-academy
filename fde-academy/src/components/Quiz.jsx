import { useState } from 'react';
import { useProgress } from '../lib/store';
import { Inline } from './Md';

export default function Quiz({ id, questions }) {
  const { state, dispatch } = useProgress();
  const [picked, setPicked] = useState({});
  const [round, setRound] = useState(0);
  const best = state.quiz[id];
  const answered = Object.keys(picked).length;
  const score = questions.reduce((n, q, i) => n + (picked[i] === q.a ? 1 : 0), 0);

  const choose = (qi, oi) => {
    if (picked[qi] !== undefined) return;
    const next = { ...picked, [qi]: oi };
    setPicked(next);
    if (Object.keys(next).length === questions.length) {
      const sc = questions.reduce((n, q, i) => n + (next[i] === q.a ? 1 : 0), 0);
      dispatch({ type: 'quiz', id, score: sc, total: questions.length });
    }
  };

  return (
    <section className="quiz" key={round}>
      <div className="section-title"><span className="hand">Quick quiz</span>{best && <span className="muted small"> · best {best.score}/{best.total}</span>}</div>
      {questions.map((q, qi) => {
        const p = picked[qi];
        return (
          <div className="q" key={qi}>
            <div className="q-text"><span className="q-num">{qi + 1}</span><span className="q-body"><Inline text={q.q} /></span></div>
            <div className="q-opts">
              {q.o.map((o, oi) => {
                let cls = 'q-opt';
                if (p !== undefined) { if (oi === q.a) cls += ' right'; else if (oi === p) cls += ' wrong'; else cls += ' faded'; }
                return <button key={oi} className={cls} onClick={() => choose(qi, oi)}><Inline text={o} /></button>;
              })}
            </div>
            {p !== undefined && <div className={p === q.a ? 'why ok' : 'why bad'}>{p === q.a ? '✓ Right. ' : '✗ Not quite. '}<Inline text={q.why || ''} /></div>}
          </div>
        );
      })}
      {answered === questions.length && (
        <div className="quiz-end">
          <span className="hand big">{score}/{questions.length}</span>
          <span>{score === questions.length ? 'Perfect! 🎉' : score >= questions.length * 0.6 ? 'Good. Re-read the wrong ones.' : 'Re-read the lesson, then retry.'}</span>
          <button className="btn" onClick={() => { setPicked({}); setRound(round + 1); }}>Retry</button>
        </div>
      )}
    </section>
  );
}
