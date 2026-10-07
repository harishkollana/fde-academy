import { Link, useParams } from 'react-router-dom';
import { phaseById, lessonById, plannedLessonCount } from '../content/index.js';
import { useProgress } from '../lib/store';
import { Inline } from '../components/Md';
import { Bar, Empty, useDocTitle, phaseProgress, projectProgress, checklistProgress, lessonsOf, neighbours, pct } from './shared';
import NotFound from './NotFound';

const PRIORITY = {
  core: ['★ core', 'Most job posts ask for this. Do it in order.'],
  plus: ['◆ plus', 'Common in job posts and a clear differentiator.'],
  breadth: ['○ breadth', 'Know it well enough to talk about it; go deeper when a job asks.'],
};

function LessonCard({ lesson, index, state }) {
  const done = !!state.done[lesson.id];
  const q = state.quiz[lesson.id];
  return (
    <Link to={`/lesson/${lesson.id}`} className={`lesson-card card ${done ? 'done' : ''}`}>
      <span className="lc-num hand" aria-hidden>{done ? '✓' : index}</span>
      <span className="lc-body">
        <span className="lc-t">{lesson.title}</span>
        {lesson.goal && <span className="lc-goal">{lesson.goal}</span>}
        <span className="lc-meta muted small">
          {[q ? `quiz best ${q.score}/${q.total}` : '', done ? 'done' : ''].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  );
}

function PlannedCard({ item, index }) {
  return (
    <div className="lesson-card card planned" aria-label={`${item.title} (coming soon)`}>
      <span className="lc-num hand" aria-hidden>{index}</span>
      <span className="lc-body">
        <span className="lc-t">{item.title}</span>
        {item.covers && <span className="lc-goal"><Inline text={item.covers} /></span>}
        <span className="lc-meta muted small">coming soon</span>
      </span>
    </div>
  );
}

export default function Phase() {
  const { id } = useParams();
  const phase = phaseById[id];
  useDocTitle(phase ? `Phase ${phase.num}: ${phase.title}` : 'Phase');
  const { state } = useProgress();
  if (!phase) return <NotFound what="phase" />;

  const prog = phaseProgress(phase, state);
  const planned = plannedLessonCount(phase);
  const project = phase.project;
  const gate = phase.gate;
  const pp = projectProgress(project, state);
  const gp = gate ? checklistProgress(gate.checklist, `gate:${gate.id}`, state) : null;
  const { prev, next } = neighbours(phase);
  const [priLabel, priHelp] = PRIORITY[phase.priority] || PRIORITY.core;

  // Group lessons by module. The plan (docs/roadmap-v2) lists every lesson; written ones link to the real lesson.
  const planIds = new Set(phase.plan.flatMap((m) => m.lessons.map((l) => l.id)));
  const groups = phase.plan.length
    ? phase.plan.map((m) => ({ title: m.module, items: m.lessons.map((pl) => (lessonById[pl.id] ? { real: lessonById[pl.id] } : { planned: pl })) }))
    : phase.modules.map((m) => ({ title: m.title, items: (m.lessons || []).map((l) => ({ real: lessonById[l.id] || l })) }));
  const extra = lessonsOf(phase).filter((l) => !planIds.has(l.id) && phase.plan.length);
  if (extra.length) groups.push({ title: 'More lessons', items: extra.map((l) => ({ real: lessonById[l.id] || l })) });
  let n = 0;

  return (
    <div className="page phase-page" style={{ '--pc': phase.color, '--pt': phase.tint }}>
      <header className="phase-head">
        <div className="ph-emoji" aria-hidden>{phase.emoji}</div>
        <div className="ph-main">
          <div className="ph-kicker">Phase {phase.num} · {phase.optional ? 'optional extended track' : phase.stageTitle}</div>
          <h1>{phase.title}</h1>
          <p className="lead">{phase.summary}</p>
          <div className="chips">
            <span className="chip" title={priHelp}>{priLabel}</span>
            {phase.gateLetter && <span className="chip">Gate {phase.gateLetter} · {phase.target}</span>}
            {phase.projectName && <span className="chip">Project</span>}
            {planned > 0 && <span className="chip">{planned} lessons planned</span>}
          </div>
          <div className="ph-prog">
            <Bar pct={prog.pct} color={phase.color} label={`${phase.title} progress`} />
            <span className="muted small">{prog.total ? `${prog.done} of ${prog.total} lessons done · ${pct(prog.pct)}${prog.written < prog.total ? ` · ${prog.written} written so far` : ''}` : 'No lessons planned yet.'}</span>
          </div>
        </div>
      </header>

      {groups.length === 0 && <Empty icon="✏️" title="This phase is not planned in detail yet." />}

      {groups.map((g, gi) => {
        const realItems = g.items.filter((x) => x.real);
        const md = realItems.filter((x) => state.done[x.real.id]).length;
        return (
          <section key={g.title || gi} className="module" aria-label={g.title || 'Lessons'}>
            {(g.title || groups.length > 1) && (
              <h2 className="h2">{g.title || 'Lessons'} <span className="muted small mod-count">{realItems.length ? `${md}/${g.items.length}` : `${g.items.length} planned`}</span></h2>
            )}
            <div className="lesson-list">
              {g.items.map((it) => { n += 1; return it.real ? <LessonCard key={it.real.id} lesson={it.real} index={n} state={state} /> : <PlannedCard key={it.planned.id} item={it.planned} index={n} />; })}
            </div>
          </section>
        );
      })}

      <div className="cols">
        {(project || phase.projectName) && (
          <section className="card pad col" aria-label="Project">
            <div className="lbl">Portfolio project</div>
            {project ? (
              <>
                <h2 className="h2">🧱 {project.title}</h2>
                <p className="muted">{project.tagline}</p>
                {project.stack?.length > 0 && <div className="chips">{project.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>}
                <Bar pct={pp.pct} color={phase.color} label="Project progress" />
                <div className="muted small">{pp.total ? `${pp.done} of ${pp.total} items ticked` : `${project.steps?.length || 0} steps`}</div>
                <Link className="btn primary" to={`/project/${phase.id}`}>Open project →</Link>
              </>
            ) : (
              <>
                <h2 className="h2">🧱 {phase.projectName}</h2>
                <p className="muted">The step-by-step build guide for this project is coming soon.</p>
                <Link className="btn" to={`/project/${phase.id}`}>See the plan →</Link>
              </>
            )}
          </section>
        )}

        {phase.gateLetter && (
          <section className="card pad col" aria-label="Apply gate">
            <div className="lbl">Apply gate</div>
            <h2 className="h2">🚩 Gate {phase.gateLetter}</h2>
            <p className="muted">Opens when you finish this phase{phase.target ? `. Rough target ${gate?.target || phase.target}` : ''}. Roles to apply for:</p>
            <div className="chips">{(gate?.titles || phase.gateTitles).map((t) => <span key={t} className="chip">{t}</span>)}</div>
            {gp && gp.total > 0 && <><Bar pct={gp.pct} color={phase.color} label="Gate checklist progress" /><div className="muted small">{gp.done} of {gp.total} checklist items ticked</div></>}
            <Link className="btn primary" to={`/gate/${phase.id}`}>Open gate →</Link>
          </section>
        )}
      </div>

      {(prev || next) && (
        <nav className="pn" aria-label="Previous and next phase">
          {prev ? <Link className="btn pn-l" to={`/phase/${prev.id}`}><span className="muted small">← Previous phase</span><span className="pn-t">{prev.emoji} {prev.title}</span></Link> : <span />}
          {next ? <Link className="btn pn-r" to={`/phase/${next.id}`}><span className="muted small">Next phase →</span><span className="pn-t">{next.emoji} {next.title}</span></Link> : <span />}
        </nav>
      )}
    </div>
  );
}
