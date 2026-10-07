import { Link, useParams } from 'react-router-dom';
import { phaseById } from '../content/index.js';
import { useProgress } from '../lib/store';
import Blocks, { Checklist } from '../components/Blocks';
import Md from '../components/Md';
import Sketch from '../components/Sketch';
import { Bar, Empty, CopyButton, PhaseTag, useDocTitle, projectProgress, checklistProgress, GATE_PHASES, pct } from './shared';
import NotFound from './NotFound';

export default function Project() {
  const { phaseId } = useParams();
  const phase = phaseById[phaseId];
  const project = phase?.project;
  useDocTitle(project?.title || phase?.projectName || 'Project');
  const { state } = useProgress();
  if (!phase) return <NotFound what="project" />;

  const style = { '--pc': phase.color, '--pt': phase.tint };

  if (!project) {
    return (
      <div className="page" style={style}>
        <nav className="crumbs"><PhaseTag phase={phase} /><span aria-hidden>›</span><span>Project</span></nav>
        {phase.projectName ? (
          <>
            <h1>🧱 {phase.projectName}</h1>
            <Empty icon="🚧" title="This project guide is still being written.">
              It will walk you through every step with full code, expected output and common errors. It closes <Link to={`/phase/${phase.id}`}>{phase.title}</Link> and
              opens Gate {phase.gateLetter}. Meanwhile, work through the phase lessons.
            </Empty>
          </>
        ) : (
          <>
            <h1>No project in this phase</h1>
            <Empty icon="🧱" title="Portfolio projects close each stage, not every phase.">
              This phase ends with a lab inside its last lesson. The projects are: {GATE_PHASES.map((p, i) => <span key={p.id}>{i ? ', ' : ''}<Link to={`/project/${p.id}`}>{p.projectName}</Link></span>)}.
            </Empty>
          </>
        )}
      </div>
    );
  }

  const steps = Array.isArray(project.steps) ? project.steps : [];
  const pp = projectProgress(project, state);
  const dod = Array.isArray(project.dod) ? project.dod : [];
  const dp = checklistProgress(dod, `dod:${project.id}`, state);

  return (
    <div className="page project" style={style}>
      <nav className="crumbs"><PhaseTag phase={phase} /><span aria-hidden>›</span><span>Project</span></nav>
      <header className="project-head">
        <h1>🧱 {project.title}</h1>
        {project.tagline && <p className="lead">{project.tagline}</p>}
        {project.stack?.length > 0 && <div className="chips">{project.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>}
        <div className="ph-prog">
          <Bar pct={pp.pct} color={phase.color} label="Project progress" />
          <span className="muted small">{pp.total ? `${pp.done} of ${pp.total} step items ticked · ${pct(pp.pct)}` : `${steps.length} steps`}</span>
        </div>
      </header>

      {project.problem && <section className="card pad"><div className="lbl">The problem</div><Md text={project.problem} /></section>}

      {project.architecture && <Sketch spec={project.architecture} seed={5} />}

      {project.folder && <section className="card pad"><div className="lbl">Folder layout</div><Md text={project.folder} /></section>}

      {steps.length > 0 && (
        <nav className="step-index card pad" aria-label="Steps">
          <div className="lbl">Steps</div>
          <ol>{steps.map((s, i) => {
            const items = s.checklist || [];
            const d = items.filter((_, j) => state.checks[`proj:${project.id}:${i}:${j}`]).length;
            return <li key={i}><a href={`#step-${i}`} onClick={(e) => { e.preventDefault(); document.getElementById(`step-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{s.title}</a>{items.length > 0 && <span className={`muted small ${d === items.length ? 'ok-text' : ''}`}> · {d}/{items.length}</span>}</li>;
          })}</ol>
        </nav>
      )}

      {steps.map((s, i) => (
        <section className="step" id={`step-${i}`} key={i} aria-label={s.title}>
          <h2 className="step-t"><span className="step-n hand">{i + 1}</span>{(s.title || `Step ${i + 1}`).replace(/^Step\s*\d+\s*[:.\-–]?\s*/i, '')}</h2>
          {s.why && <div className="step-why"><Md text={s.why} /></div>}
          {Array.isArray(s.blocks) && <Blocks blocks={s.blocks} idBase={`${project.id}-s${i}`} />}
          {s.checklist?.length > 0 && (
            <div className="card pad step-check">
              <div className="lbl">Tick when done</div>
              <Checklist items={s.checklist} prefix={`proj:${project.id}:${i}`} xp={10} />
            </div>
          )}
        </section>
      ))}

      {steps.length === 0 && <Empty icon="🚧" title="The steps are still being written." />}

      {project.resume && (
        <section className="card pad resume">
          <div className="row"><div className="lbl">Resume line</div><span className="spacer" /><CopyButton text={project.resume} label="copy resume line" /></div>
          <p className="resume-line">{project.resume}</p>
        </section>
      )}

      {dod.length > 0 && (
        <section className="card pad">
          <div className="row"><h2 className="h2">Definition of done</h2><span className="spacer" /><span className="muted small">{dp.done}/{dp.total}</span></div>
          <Checklist items={dod} prefix={`dod:${project.id}`} xp={10} />
        </section>
      )}

      {project.video?.length > 0 && (
        <section className="card pad">
          <h2 className="h2">🎬 Walkthrough video script</h2>
          <p className="muted">Record a 3–5 minute screen share. Hit these points in order.</p>
          <ol className="plainlist numbered">{project.video.map((v, i) => <li key={i}>{v}</li>)}</ol>
        </section>
      )}

      <div className="pn"><span /><Link className="btn pn-r" to={`/gate/${phase.id}`}><span className="muted small">Next →</span><span className="pn-t">Apply gate {phase.gateLetter}</span></Link></div>
    </div>
  );
}
