import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WEEKS, LESSONS, lessonById, lessonsOfWeek } from '../content/corporate-mitra/index.js';
import { cm, useCm } from '../lib/cmStore';
import Blocks from '../components/Blocks';
import { Inline } from '../components/Md';
import { Bar, useDocTitle, fmtDate } from './shared';
import NotFound from './NotFound';

const base = '/corporate-mitra';

// ---------- Overview ----------
export function CmHome() {
  useDocTitle('Corporate Mitra');
  const { done } = useCm();
  const doneCount = LESSONS.filter((l) => done[l.id]).length;
  const next = LESSONS.find((l) => !done[l.id]);
  return (
    <div className="page">
      <header className="page-head">
        <div className="lbl">Course notes</div>
        <h1 className="hero-h">Corporate Mitra<span className="hero-dot">.</span></h1>
        <p className="lead">
          A Corporate Mitra is a trained helper for small businesses: someone who knows the registrations, taxes, loans and schemes an entrepreneur has to deal with.
          These notes explain each lesson from zero, in plain English, with a hand-drawn picture, for an engineer who has never studied finance or accounts.
        </p>
      </header>

      <section className="card pad cm-continue">
        <div>
          <div className="lbl">{doneCount === 0 ? 'Start here' : doneCount === LESSONS.length ? 'All done' : 'Continue where you stopped'}</div>
          <div className="continue-t hand">{next ? next.title : 'You have finished every lesson.'}</div>
          <p className="muted small">{doneCount} of {LESSONS.length} lessons marked done</p>
          <Bar pct={LESSONS.length ? doneCount / LESSONS.length : 0} color="var(--accent)" label="Corporate Mitra progress" />
        </div>
        {next && <Link className="btn primary" to={`${base}/${next.id}`}>{doneCount === 0 ? 'Start lesson 1' : 'Open next lesson'} →</Link>}
      </section>

      <section className="card pad">
        <h2 className="h2">How every lesson is laid out</h2>
        <ol className="cm-how">
          <li><b>After this lesson</b>: one sentence on what you will be able to do.</li>
          <li><b>Words you will meet</b>: every new term in plain English, before you need it.</li>
          <li><b>Pictures and notes</b>: hand-drawn diagrams, tables and worked examples with real numbers.</li>
          <li><b>Think of it like this</b>: a comparison with something from engineering you already know.</li>
          <li><b>Remember</b>: the short version to revise from.</li>
          <li><b>My notes</b>: a box of your own, saved in this browser.</li>
        </ol>
      </section>

      {WEEKS.map((w) => {
        const ls = lessonsOfWeek(w.id);
        const n = ls.filter((l) => done[l.id]).length;
        return (
          <section key={w.id} className="cm-week" style={{ '--pc': w.color, '--pt': w.tint }}>
            <div className="cm-week-head">
              <span className="cm-week-emoji" aria-hidden>{w.emoji}</span>
              <div>
                <div className="lbl">{w.label} · {ls.length} {ls.length === 1 ? 'lesson' : 'lessons'}{n > 0 ? ` · ${n} done` : ''}</div>
                <h2 className="h2">{w.title}</h2>
                <p className="muted small">{w.blurb}</p>
              </div>
            </div>
            <div className="lesson-list">
              {ls.map((l, i) => (
                <Link key={l.id} to={`${base}/${l.id}`} className={`lesson-card card ${done[l.id] ? 'done' : ''}`}>
                  <span className="lc-num hand" aria-hidden>{done[l.id] ? '✓' : (w.id === 'intro' ? '▶' : i + 1)}</span>
                  <span className="lc-body">
                    <span className="lc-t">{l.title}</span>
                    {l.goal && <span className="lc-goal">{l.goal}</span>}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ---------- Lesson ----------
function Terms({ terms }) {
  if (!terms?.length) return null;
  return (
    <section className="cm-terms card pad" aria-label="Words you will meet">
      <div className="lbl">Words you will meet</div>
      <dl>
        {terms.map(([term, meaning]) => (
          <div key={term} className="cm-term">
            <dt>{term}</dt>
            <dd><Inline text={meaning} /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CmQuiz({ id, questions }) {
  const { quiz } = useCm();
  const [picked, setPicked] = useState({});
  const [round, setRound] = useState(0);
  const best = quiz[id];
  const answered = Object.keys(picked).length;
  const score = questions.reduce((n, q, i) => n + (picked[i] === q.a ? 1 : 0), 0);

  const choose = (qi, oi) => {
    if (picked[qi] !== undefined) return;
    const next = { ...picked, [qi]: oi };
    setPicked(next);
    if (Object.keys(next).length === questions.length) cm.saveQuiz(id, questions.reduce((n, q, i) => n + (next[i] === q.a ? 1 : 0), 0), questions.length);
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
          <span>{score === questions.length ? 'Perfect! 🎉' : score >= questions.length * 0.6 ? 'Good. Re-read the ones you missed.' : 'Re-read the lesson, then try again.'}</span>
          <button className="btn" onClick={() => { setPicked({}); setRound(round + 1); }}>Retry</button>
        </div>
      )}
    </section>
  );
}

function NotesBox({ id }) {
  const { notes } = useCm();
  const [text, setText] = useState(notes[id] || '');
  const [saved, setSaved] = useState(true);
  const latest = useRef(text);
  const timer = useRef(null);
  latest.current = text;

  const flush = () => { clearTimeout(timer.current); cm.setNote(id, latest.current); setSaved(true); };
  const onChange = (e) => {
    setText(e.target.value); setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };
  useEffect(() => () => { clearTimeout(timer.current); cm.setNote(id, latest.current); }, [id]);

  return (
    <section className="notes card pad" aria-label="My notes">
      <div className="row"><h2 className="h2">My notes</h2><span className="spacer" /><span className="muted small">{saved ? 'saved in this browser' : 'saving…'}</span></div>
      <textarea className="notes-ta" value={text} onChange={onChange} onBlur={flush} rows={5}
        placeholder="What clicked? What confused you? Write it in your own words." aria-label="Notes for this lesson" />
    </section>
  );
}

function LessonBody({ lesson }) {
  const { done } = useCm();
  const isDone = done[lesson.id];
  const prev = LESSONS[lesson.index - 1];
  const next = LESSONS[lesson.index + 1];
  const w = lesson.week;
  const inWeek = lessonsOfWeek(w.id);
  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];

  return (
    <article className="page lesson" style={{ '--pc': w.color, '--pt': w.tint }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to={base} className="phase-tag">{w.emoji} {w.label}</Link>
        <span aria-hidden>›</span>
        <span>{w.title}</span>
        <span className="muted small crumb-pos">lesson {lesson.index + 1} of {LESSONS.length}{inWeek.length > 1 ? ` · ${inWeek.indexOf(lesson) + 1}/${inWeek.length} this week` : ''}</span>
      </nav>

      <header className="lesson-head">
        <h1>{lesson.title}</h1>
        {lesson.goal && <p className="lesson-goal"><span className="goal-lbl hand">After this lesson</span> <Inline text={lesson.goal} /></p>}
        <div className="chips">{isDone && <span className="chip on">✓ done {fmtDate(isDone, { day: 'numeric', month: 'short' })}</span>}</div>
        {lesson.covers?.length > 0 && (
          <div className="covers"><span className="lbl">Covers</span><div className="chips">{lesson.covers.map((c) => <span key={c} className="chip">{c}</span>)}</div></div>
        )}
      </header>

      <Terms terms={lesson.terms} />
      <Blocks blocks={blocks} idBase={lesson.id} />
      {lesson.quiz?.length > 0 && <CmQuiz id={lesson.id} questions={lesson.quiz} />}
      <NotesBox id={lesson.id} />

      <div className="complete-row">
        <button className={`btn complete ${isDone ? 'is-done' : 'primary'}`} onClick={() => cm.toggleDone(lesson.id)} aria-pressed={!!isDone}>
          {isDone ? `✓ Done on ${fmtDate(isDone)}. Click to undo` : 'Mark lesson as done'}
        </button>
      </div>

      <nav className="pn" aria-label="Previous and next lesson">
        {prev ? <Link className="btn pn-l" to={`${base}/${prev.id}`}><span className="muted small">← Previous</span><span className="pn-t">{prev.title}</span></Link> : <span />}
        {next ? <Link className="btn pn-r" to={`${base}/${next.id}`}><span className="muted small">Next →</span><span className="pn-t">{next.title}</span></Link> : <span />}
      </nav>
    </article>
  );
}

export function CmLesson() {
  const { id } = useParams();
  const lesson = lessonById[id];
  useDocTitle(lesson?.title);
  if (!lesson) return <NotFound what="lesson" />;
  return <LessonBody key={lesson.id} lesson={lesson} />;
}
