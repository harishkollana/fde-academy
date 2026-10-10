import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PROGRAMME, SEMESTERS, CALENDAR, CALENDAR_NOTE, KINDS, ASSESSMENT, subjectById, eventById, lessonsOfModule, lessonsOfSubject, lessonPath, lessonRef } from '../content/mba/sem1.js';
import { contentOf } from '../content/mba/lessons/index.js';
import { Bar, Empty, fmtDate, useDocTitle } from './shared';
import { mba, useMba, lessonKey } from '../lib/mbaStore';
import NotFound from './NotFound';

const DAY = 86400000;
const dayNo = (key) => Date.parse(`${key}T00:00:00Z`) / DAY;
// The calendar is written in local dates, so "today" is the local date (not UTC like the progress store).
const localKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function rangeLabel(e) {
  if (!e.end) return fmtDate(e.start);
  const same = e.start.slice(0, 7) === e.end.slice(0, 7);
  return same
    ? `${fmtDate(e.start, { day: 'numeric' })}–${fmtDate(e.end)}`
    : `${fmtDate(e.start, { day: 'numeric', month: 'short' })} – ${fmtDate(e.end)}`;
}

function status(e, today) {
  const last = e.end || e.start;
  if (last < today) return 'past';
  if (e.start <= today) return 'now';
  return 'soon';
}

function when(e, today) {
  const s = status(e, today);
  if (s === 'past') return 'Done';
  if (s === 'now') return e.end ? `On now, until ${fmtDate(e.end, { day: 'numeric', month: 'short' })}` : 'Today';
  const n = dayNo(e.start) - dayNo(today);
  return n === 1 ? 'Tomorrow' : `In ${n} days`;
}

function Chip({ kind }) {
  const k = KINDS[kind];
  return <span className={`mc-chip k-${kind}`}><span aria-hidden>{k.ico}</span> {k.label}</span>;
}

function SemSwitch({ sem, onChange }) {
  return (
    <div className="mc-sems" role="group" aria-label="Semester">
      {SEMESTERS.map((s) => (
        <button key={s.n} type="button" className="mc-sem" aria-pressed={sem === s.n} onClick={() => onChange(s.n)}>{s.short}</button>
      ))}
    </div>
  );
}

function NotYet({ sem }) {
  const s = SEMESTERS[sem - 1];
  return (
    <Empty icon="🗓️" title={`${s.short} is not added yet.`}>
      Once the {s.short} academic calendar and assessment files are added, they will show up here.
    </Empty>
  );
}

// sem={null} is for pages that apply to every semester: the kicker then leaves the semester out.
function Head({ sem = 1, title, lead }) {
  return (
    <header className="page-head">
      <div className="mc-kicker">{[PROGRAMME.name, sem && SEMESTERS[sem - 1].name, PROGRAMME.university].filter(Boolean).join(' · ')}</div>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
    </header>
  );
}

export function ImportantDates() {
  useDocTitle('Important dates');
  const [sem, setSem] = useState(1);
  const ready = SEMESTERS[sem - 1].ready;
  const today = localKey();
  const upcoming = CALENDAR.filter((e) => status(e, today) !== 'past');
  const next = upcoming.slice(0, 3);
  const months = [];
  CALENDAR.forEach((e) => {
    const m = e.start.slice(0, 7);
    let g = months.find((x) => x.key === m);
    if (!g) { g = { key: m, label: fmtDate(`${m}-01`, { month: 'long', year: 'numeric' }), items: [] }; months.push(g); }
    g.items.push(e);
  });

  return (
    <div className="page narrow">
      <Head sem={sem} title="Important dates" lead={ready ? `Everything from the academic calendar for the ${PROGRAMME.session}, in order. Past dates fade out so what is next stays easy to spot.` : 'Pick a semester with the switches below.'} />
      <SemSwitch sem={sem} onChange={setSem} />
      {!ready && <NotYet sem={sem} />}

      {ready && next.length > 0 && (
        <section aria-label="Coming up">
          <div className="mc-next">
            {next.map((e, i) => (
              <div key={e.id} className="mc-next-card">
                <div className="mc-next-k">{i === 0 ? 'Next up' : 'After that'}</div>
                <div className="mc-next-t">{e.title}</div>
                <div className="mc-next-d">{rangeLabel(e)} · {when(e, today)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {ready && months.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h2 className="mc-month">{g.label}</h2>
          <ul className="mc-evs">
            {g.items.map((e) => (
              <li key={e.id} className={`mc-ev ${status(e, today)}`}>
                <div className="mc-date" aria-hidden><b>{fmtDate(e.start, { day: 'numeric' })}</b><span>{fmtDate(e.start, { month: 'short' })}</span></div>
                <div className="mc-ev-body">
                  <div className="mc-ev-t">{e.title}</div>
                  <div className="mc-ev-s">{rangeLabel(e)} · {when(e, today)}</div>
                </div>
                <Chip kind={e.kind} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {ready && <div className="callout tip"><div className="callout-h">Good to know</div><p>{CALENDAR_NOTE}</p></div>}
    </div>
  );
}

export function Assessment() {
  useDocTitle('Assessment');
  const A = ASSESSMENT;
  return (
    <div className="page narrow">
      <Head sem={null} title="Assessment" lead="How marks are split, what you must score to pass, and what the End Term Exam looks like. These marks and rules are the same in every semester." />

      <section className="mc-split" aria-label="Marks split">
        {A.split.map((s) => (
          <div key={s.label} className="mc-big">
            <div className="mc-big-n">{s.pct}%</div>
            <div className="mc-big-l">{s.label}</div>
            <div className="mc-big-s">{s.sub}</div>
          </div>
        ))}
        <div className="mc-big pass">
          <div className="mc-big-n">45%</div>
          <div className="mc-big-l">Overall to pass</div>
          <div className="mc-big-s">Aggregate of internal and ETE marks</div>
        </div>
      </section>

      <section className="card pad">
        <h2 className="h2">Passing marks</h2>
        <div className="mc-scroll">
          <table className="mdtable">
            <thead><tr><th>Category</th><th>Type</th><th>Max marks</th><th>Passing %</th><th>Passing score</th></tr></thead>
            <tbody>
              {A.passing.map((r) => (
                <tr key={r.category}><td><strong>{r.category}</strong></td><td>{r.type}</td><td>{r.max}</td><td>{r.passPct}</td><td>{r.passScore}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card pad">
        <h2 className="h2">Internal assessment (30 marks)</h2>
        <ul className="plainlist">{A.internal.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <section className="card pad">
        <h2 className="h2">End Term Examination (70 marks)</h2>
        <p className="muted">{A.ete.intro}</p>
        <div className="mc-scroll">
          <table className="mdtable">
            <thead><tr><th>Section</th><th>Question type</th><th>Questions</th><th>Marks each</th><th>Total</th></tr></thead>
            <tbody>
              {A.ete.sections.map((r) => (
                <tr key={r.section}><td><strong>{r.section}</strong></td><td>{r.type}</td><td>{r.questions}</td><td>{r.each}</td><td>{r.total}</td></tr>
              ))}
              <tr><td colSpan={4}><strong>Total</strong></td><td><strong>{A.ete.totalMarks}</strong></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card pad">
        <h2 className="h2">Rules to pass</h2>
        <ul className="plainlist">{A.rules.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <p className="muted">Assignment and exam dates change from semester to semester. Find them for each semester on <Link to="/mba-acca">Important dates</Link>.</p>

      <p className="muted mc-src">Source: {A.source}.</p>
    </div>
  );
}

export function Subject() {
  const { id } = useParams();
  const s = subjectById[id];
  useDocTitle(s ? s.title : 'Subject');
  const { done } = useMba();
  if (!s) return <NotFound what="subject" />;
  const today = localKey();
  const all = lessonsOfSubject(s);
  const doneAll = all.filter((l) => done[lessonKey(s.id, l.no)]).length;
  return (
    <div className="page narrow">
      <Head title={`${s.ico} ${s.title}`} lead={`${s.modules.length} modules and ${all.length} lessons. Open a lesson, answer its quiz and mark it done. Each module ends with a Module Assessment, and its due date from the academic calendar is shown below.`} />

      <div className="mc-prog">
        <Bar pct={doneAll / all.length} color="var(--ok)" label={`${doneAll} of ${all.length} lessons done`} />
        <span><strong>{doneAll}</strong> of {all.length} lessons done</span>
      </div>

      <ol className="mc-mods">
        {s.modules.map((m, i) => {
          const ev = eventById[`milestone-${i + 1}`];
          const n = lessonsOfModule(m).length;
          const nDone = lessonsOfModule(m).filter((l) => done[lessonKey(s.id, l.no)]).length;
          return (
            <li key={m.title} className="mc-mod">
              <div className="mc-mod-n" aria-hidden>{i + 1}</div>
              <div className="mc-mod-body">
                <div className="mc-mod-t">Module {i + 1}: {m.title}</div>
                <div className="mc-mod-s">
                  Starts on page {m.page} of the study material
                  {ev && <> · Assessment due <strong>{fmtDate(ev.start)}</strong> ({when(ev, today).toLowerCase()})</>}
                </div>
                <details className="mc-les">
                  <summary>{nDone} of {n} lessons done · {m.sections.length} {m.sections.length === 1 ? 'section' : 'sections'}</summary>
                  {m.sections.map((sec) => (
                    <div key={sec.no} className="mc-sec">
                      <h3 className="mc-sec-t"><span className="mc-no">{sec.no}</span> {sec.title}</h3>
                      <ul className="mc-lesl">
                        {sec.lessons.map((l) => {
                          const key = lessonKey(s.id, l.no);
                          return (
                            <li key={l.no} className={done[key] ? 'done' : ''}>
                              <Link to={lessonPath(s.id, l.no)} className="mc-lesl-l">
                                <span className="sb-tick" aria-hidden>{done[key] ? '✓' : ''}</span>
                                <span className="mc-no">{l.no}</span>
                                <span className="mc-lesl-t">{l.title}</span>
                              </Link>
                              <span className="mc-lesl-p">p. {l.page}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </details>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="card pad">
        <h2 className="h2">Study material</h2>
        <p className="muted">{s.file} · {s.pdfPages} pages. The PDF is kept in <code>D:\Ed\MBA\1st Sem</code> and is not part of this app.</p>
      </section>
    </div>
  );
}

// ---------- Lesson ----------
// Same one-click quiz as Corporate Mitra: pick an answer, see at once if it was right and why. Finishing it saves the best score.
function MbaQuiz({ id, questions }) {
  const { quiz } = useMba();
  const [picked, setPicked] = useState({});
  const [round, setRound] = useState(0);
  const best = quiz[id];
  const answered = Object.keys(picked).length;
  const score = questions.reduce((n, q, i) => n + (picked[i] === q.a ? 1 : 0), 0);

  const choose = (qi, oi) => {
    if (picked[qi] !== undefined) return;
    const next = { ...picked, [qi]: oi };
    setPicked(next);
    if (Object.keys(next).length === questions.length) mba.saveQuiz(id, questions.reduce((n, q, i) => n + (next[i] === q.a ? 1 : 0), 0), questions.length);
  };

  return (
    <section className="quiz" key={round}>
      <div className="section-title"><span className="hand">Quick quiz</span>{best && <span className="muted small"> · best {best.score}/{best.total}</span>}</div>
      {questions.map((q, qi) => {
        const p = picked[qi];
        return (
          <div className="q" key={qi}>
            <div className="q-text"><span className="q-num">{qi + 1}</span><span className="q-body">{q.q}</span></div>
            <div className="q-opts">
              {q.o.map((o, oi) => {
                let cls = 'q-opt';
                if (p !== undefined) { if (oi === q.a) cls += ' right'; else if (oi === p) cls += ' wrong'; else cls += ' faded'; }
                return <button key={oi} type="button" className={cls} onClick={() => choose(qi, oi)}>{o}</button>;
              })}
            </div>
            {p !== undefined && <div className={p === q.a ? 'why ok' : 'why bad'}>{p === q.a ? '✓ Right. ' : '✗ Not quite. '}{q.why}</div>}
          </div>
        );
      })}
      {answered === questions.length && (
        <div className="quiz-end">
          <span className="hand big">{score}/{questions.length}</span>
          <span>{score === questions.length ? 'Perfect! 🎉' : score >= questions.length * 0.6 ? 'Good. Re-read the ones you missed.' : 'Re-read the lesson, then try again.'}</span>
          <button type="button" className="btn" onClick={() => { setPicked({}); setRound(round + 1); }}>Retry</button>
        </div>
      )}
    </section>
  );
}

function LessonBody({ r }) {
  const { done, quiz } = useMba();
  const { subject: s, module: m, moduleIndex, section, lesson, prev, next, index, total } = r;
  const key = lessonKey(s.id, lesson.no);
  const isDone = done[key];
  const content = contentOf(s.id, lesson.no);
  const hasQuiz = !!content && content.quiz.length > 0;
  // A lesson with a quiz can be marked done once the quiz has been answered (any score); undoing is always allowed.
  const canComplete = !hasQuiz || !!quiz[key];

  return (
    <article className="page lesson" style={{ '--pc': 'var(--accent)', '--pt': 'var(--hl)' }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to={`/mba-acca/subjects/${s.id}`} className="phase-tag">{s.ico} {s.title}</Link>
        <span aria-hidden>›</span>
        <span>Module {moduleIndex + 1}: {m.title}</span>
        <span className="muted small crumb-pos">lesson {index + 1} of {total}</span>
      </nav>

      <header className="lesson-head">
        <h1><span className="mc-no">{lesson.no}</span> {lesson.title}</h1>
        <p className="muted">Section {section.no}: {section.title} · starts on page {lesson.page} of the study material</p>
        <div className="chips">{isDone && <span className="chip on">✓ done {fmtDate(isDone, { day: 'numeric', month: 'short' })}</span>}</div>
      </header>

      {content ? (
        <section className="card pad" aria-label="Key points">
          <h2 className="h2">Key points</h2>
          <ul className="plainlist">{content.points.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="muted small mc-src">Read the full lesson in {s.file}, from page {lesson.page}.</p>
        </section>
      ) : (
        <section className="card pad">
          <p className="muted">Key points and a quiz for this lesson are not written yet. Read it in {s.file}, from page {lesson.page}, then mark it done.</p>
        </section>
      )}

      {hasQuiz && <MbaQuiz id={key} questions={content.quiz} />}

      <div className="complete-row">
        <button type="button" className={`btn complete ${isDone ? 'is-done' : 'primary'}`} disabled={!isDone && !canComplete} onClick={() => mba.toggleLesson(key)} aria-pressed={!!isDone}>
          {isDone ? `✓ Done on ${fmtDate(isDone)}. Click to undo` : canComplete ? 'Mark lesson as done' : 'Answer the quiz to mark this lesson done'}
        </button>
      </div>

      <nav className="pn" aria-label="Previous and next lesson">
        {prev ? <Link className="btn pn-l" to={lessonPath(s.id, prev.lesson.no)}><span className="muted small">← Previous</span><span className="pn-t">{prev.lesson.no} {prev.lesson.title}</span></Link> : <span />}
        {next ? <Link className="btn pn-r" to={lessonPath(s.id, next.lesson.no)}><span className="muted small">Next →</span><span className="pn-t">{next.lesson.no} {next.lesson.title}</span></Link> : <span />}
      </nav>
    </article>
  );
}

export function MbaLesson() {
  const { id, no } = useParams();
  const r = lessonRef(id, no);
  useDocTitle(r ? `${r.lesson.no} ${r.lesson.title}` : 'Lesson');
  if (!r) return <NotFound what="lesson" />;
  return <LessonBody key={`${id}:${no}`} r={r} />;
}
