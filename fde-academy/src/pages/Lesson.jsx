import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ALL_LESSONS, lessonById } from '../content/index.js';
import { useProgress } from '../lib/store';
import Blocks, { Checklist } from '../components/Blocks';
import Quiz from '../components/Quiz';
import { Inline } from '../components/Md';
import { PhaseTag, useDocTitle, fmtDate } from './shared';
import NotFound from './NotFound';

function NotesBox({ id }) {
  const { state, dispatch } = useProgress();
  const [text, setText] = useState(state.notes[id] || '');
  const [saved, setSaved] = useState(true);
  const latest = useRef(text);
  const timer = useRef(null);
  latest.current = text;

  const flush = () => {
    clearTimeout(timer.current);
    dispatch({ type: 'note', id, text: latest.current });
    setSaved(true);
  };
  const onChange = (e) => {
    setText(e.target.value); setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };
  // Save any pending text when leaving the lesson.
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (latest.current !== (state.notes[id] || '')) dispatch({ type: 'note', id, text: latest.current });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="notes card pad" aria-label="My notes">
      <div className="row"><h2 className="h2">My notes</h2><span className="spacer" /><span className="muted small">{saved ? 'saved in this browser' : 'saving…'}</span></div>
      <textarea className="notes-ta" value={text} onChange={onChange} onBlur={flush} rows={5}
        placeholder="What clicked? What confused you? Write it in your own words. These notes are for you." aria-label="Notes for this lesson" />
    </section>
  );
}

function LessonBody({ lesson }) {
  const { state, dispatch } = useProgress();
  const done = state.done[lesson.id];
  const meta = lessonById[lesson.id];
  const prev = ALL_LESSONS[meta.index - 1];
  const next = ALL_LESSONS[meta.index + 1];
  const task = lesson.task;
  const blocks = Array.isArray(lesson.blocks) ? lesson.blocks : [];
  const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];

  return (
    <article className="page lesson" style={{ '--pc': lesson.phase.color, '--pt': lesson.phase.tint }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <PhaseTag phase={lesson.phase} />
        <span aria-hidden>›</span>
        <Link to={`/phase/${lesson.phaseId}`}>{lesson.moduleTitle}</Link>
        <span className="muted small crumb-pos">lesson {meta.index + 1} of {ALL_LESSONS.length}</span>
      </nav>

      <header className="lesson-head">
        <h1>{lesson.title}</h1>
        {lesson.goal && <p className="lesson-goal"><span className="goal-lbl hand">After this lesson</span> <Inline text={lesson.goal} /></p>}
        <div className="chips">
          {done && <span className="chip on">✓ done {fmtDate(done, { day: 'numeric', month: 'short' })}</span>}
        </div>
        {lesson.roadmap?.length > 0 && (
          <div className="covers"><span className="lbl">Covers</span><div className="chips">{lesson.roadmap.map((r) => <span key={r} className="chip">{r}</span>)}</div></div>
        )}
      </header>

      {blocks.length === 0 ? <div className="empty"><div className="empty-ico" aria-hidden>✏️</div><div><div className="empty-t">This lesson has no content yet.</div></div></div>
        : <Blocks blocks={blocks} idBase={lesson.id} />}

      {quiz.length > 0 && <Quiz id={lesson.id} questions={quiz} />}

      {task && (
        <section className="task card pad" aria-label="Task">
          <div className="lbl">Your task</div>
          <h2 className="h2">💻 {task.title || 'Do it on your laptop'}</h2>
          {Array.isArray(task.steps) && task.steps.length > 0 && <Checklist items={task.steps} prefix={`task:${lesson.id}`} xp={15} />}
          {task.deliverable && <div className="deliverable"><strong>Proof it is done:</strong> <Inline text={task.deliverable} /></div>}
        </section>
      )}

      <NotesBox id={lesson.id} />

      <div className="complete-row">
        <button className={`btn complete ${done ? 'is-done' : 'primary'}`} onClick={() => dispatch({ type: 'complete', id: lesson.id })} aria-pressed={!!done}>
          {done ? `✓ Completed on ${fmtDate(done)}. Click to undo` : 'Mark lesson complete · +20 XP'}
        </button>
      </div>

      <nav className="pn" aria-label="Previous and next lesson">
        {prev ? <Link className="btn pn-l" to={`/lesson/${prev.id}`}><span className="muted small">← Previous</span><span className="pn-t">{prev.title}</span></Link> : <span />}
        {next ? <Link className="btn pn-r" to={`/lesson/${next.id}`}><span className="muted small">Next →</span><span className="pn-t">{next.title}</span></Link> : <span />}
      </nav>
    </article>
  );
}

export default function Lesson() {
  const { id } = useParams();
  const lesson = lessonById[id];
  useDocTitle(lesson?.title);
  if (!lesson) return <NotFound what="lesson" />;
  // key = lesson id, so editors, quiz answers and notes reset cleanly when you move to another lesson
  return <LessonBody key={lesson.id} lesson={lesson} />;
}
