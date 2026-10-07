import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PHASES, STAGE_GROUPS, ALL_LESSONS, lessonById } from '../content/index.js';
import { useProgress, streak, level } from '../lib/store';
import RoadmapMap from '../components/RoadmapMap';
import {
  Bar, Empty, PhaseTag, useDocTitle, nextLesson, projectProgress, currentPhase, phaseComplete, gateOpen, phaseProgress,
  weekWindow, addDays, todayKey, fmtDate, MAIN_PHASES, GATE_PHASES, pct,
} from './shared';

function Heatmap({ activity }) {
  const cells = useMemo(() => {
    const [mon] = weekWindow();
    const first = addDays(mon, -11 * 7);
    const today = todayKey();
    const cols = [];
    for (let w = 0; w < 12; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = addDays(first, w * 7 + d);
        const xp = activity[key] || 0;
        const lvl = key > today ? 'f' : xp === 0 ? 0 : xp < 20 ? 1 : xp < 50 ? 2 : xp < 100 ? 3 : 4;
        col.push({ key, xp, lvl });
      }
      cols.push(col);
    }
    return cols;
  }, [activity]);
  const total = cells.flat().reduce((n, c) => n + (c.xp > 0 ? 1 : 0), 0);
  return (
    <div>
      <div className="heat" role="img" aria-label={`Activity calendar: ${total} active days recently`}>
        <div className="heat-days" aria-hidden>{['M', '', 'W', '', 'F', '', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
        {cells.map((col, i) => (
          <div className="heat-col" key={i}>
            {col.map((c) => <span key={c.key} className={`heat-cell h${c.lvl}`} title={c.lvl === 'f' ? fmtDate(c.key) : `${fmtDate(c.key)}: ${c.xp} XP`} />)}
          </div>
        ))}
      </div>
      <div className="heat-legend muted small">
        <span>{total} active day{total === 1 ? '' : 's'} so far</span>
        <span className="spacer" />
        less <i className="heat-cell h0" /><i className="heat-cell h1" /><i className="heat-cell h2" /><i className="heat-cell h3" /><i className="heat-cell h4" /> more
      </div>
    </div>
  );
}

export default function Dashboard() {
  useDocTitle('');
  const { state } = useProgress();
  const phase = currentPhase(state); // first phase you have not finished; null when everything is done
  const phProg = phase ? phaseProgress(phase, state) : null;
  const lv = level(state.xp);
  const st = streak(state.activity);
  const next = nextLesson(state);
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((l) => state.done[l.id]).length;
  const solved = Object.keys(state.solved).length;
  const projTotals = PHASES.reduce((a, p) => { const pp = projectProgress(p.project, state); return { total: a.total + pp.total, done: a.done + pp.done }; }, { total: 0, done: 0 });
  const lvPct = lv.next ? (state.xp - lv.floor) / (lv.next - lv.floor) : 1;
  const journey = MAIN_PHASES.reduce((a, p) => { const pr = phaseProgress(p, state); return { done: a.done + pr.done, total: a.total + pr.total }; }, { done: 0, total: 0 });
  const journeyPct = journey.total ? journey.done / journey.total : 0;

  // What's next (no calendar: just the next useful thing in each category)
  const queue = ALL_LESSONS.filter((l) => !l.phase.optional && !state.done[l.id]);
  const nextFive = queue.slice(0, 5);
  let buildStep = null;
  const projPhase = [phase, ...PHASES].filter(Boolean).find((p) => p.project?.steps?.some((s, i) => (s.checklist || []).some((_, j) => !state.checks[`proj:${p.project.id}:${i}:${j}`])));
  if (projPhase) {
    const i = projPhase.project.steps.findIndex((s, si) => (s.checklist || []).some((_, j) => !state.checks[`proj:${projPhase.project.id}:${si}:${j}`]));
    if (i >= 0) buildStep = { phase: projPhase, title: projPhase.project.steps[i].title };
  }
  const weak = Object.entries(state.quiz).filter(([id, q]) => lessonById[id] && q.total && q.score / q.total < 0.7).slice(0, 5);
  const openGates = GATE_PHASES.filter((p) => gateOpen(p, state));
  const gate = openGates[openGates.length - 1];
  const upcomingGate = GATE_PHASES.find((p) => !phaseComplete(p, state));
  const nextProject = MAIN_PHASES.find((p) => p.projectName && !phaseComplete(p, state));

  return (
    <div className="page dash">
      <header className="dash-hero">
        <div>
          <h1 className="hero-h">Small steps, every day. That's how big things get built<span className="hero-dot">.</span></h1>
          <p className="lead">
            {phase
              ? <>You are on <PhaseTag phase={phase} /> <strong>{phase.title}</strong> <span className="muted">· {phProg.done} of {phProg.total} lessons done. Go at your own pace.</span></>
              : <>You have finished every phase. Keep polishing the projects and applying.</>}
          </p>
        </div>
      </header>

      <section className="continue card pad" aria-label="Continue learning">
        {total === 0 && <Empty icon="📭" title="No lessons are loaded yet.">Lessons appear here as soon as they are written.</Empty>}
        {total > 0 && next && (
          <>
            <div className="lbl">{done === 0 ? 'Start here' : 'Continue where you stopped'}</div>
            <div className="continue-body">
              <div>
                <div className="chips"><PhaseTag phase={next.phase} /><span className="chip">{next.moduleTitle}</span></div>
                <h2 className="continue-t">{next.title}</h2>
                <p className="muted">{next.goal}</p>
              </div>
              <Link className="btn primary big-btn" to={`/lesson/${next.id}`}>{done === 0 ? 'Start lesson' : 'Continue'} →</Link>
            </div>
          </>
        )}
        {total > 0 && !next && <Empty icon="🏁" title="Every lesson written so far is done.">Practise in the <Link to="/practice">arena</Link>, or build the next project step. More lessons are on their way.</Empty>}
      </section>

      <section className="stats" aria-label="Your numbers">
        <div className="stat card">
          <div className="stat-n hand big">{state.xp}</div>
          <div className="stat-l">XP · {lv.name}</div>
          <Bar pct={lvPct} color="#e8590c" label="Progress to next level" />
          <div className="muted small">{lv.next ? `${lv.next - state.xp} XP to ${lv.nextName}` : 'Top level reached'}</div>
        </div>
        <div className="stat card">
          <div className="stat-n hand big">🔥 {st}</div>
          <div className="stat-l">day streak</div>
          <div className="muted small">{st ? 'Nice run. Skipping days is fine.' : 'Just a bonus: earn XP to start one.'}</div>
        </div>
        <div className="stat card">
          <div className="stat-n hand big">{done}</div>
          <div className="stat-l">lessons finished</div>
          <Bar pct={journeyPct} color="#1971c2" label="Share of the whole journey finished" />
          <div className="muted small">{pct(journeyPct)} of the journey</div>
        </div>
        <div className="stat card">
          <div className="stat-n hand big">{solved}</div>
          <div className="stat-l">challenges solved</div>
          <div className="muted small"><Link to="/practice">Open the arena</Link></div>
        </div>
        <div className="stat card">
          <div className="stat-n hand big">{projTotals.done}<span className="stat-of">/{projTotals.total}</span></div>
          <div className="stat-l">project items ticked</div>
          <Bar pct={projTotals.total ? projTotals.done / projTotals.total : 0} color="#2f9e44" label="Project items done" />
        </div>
      </section>

      <section aria-label="Roadmap map">
        <h2 className="h2">Your road</h2>
        <div className="card map-card"><RoadmapMap /></div>
      </section>

      <div className="cols dash-cols">
        <section className="card pad col" aria-label="What is next">
          <h2 className="h2">What's next</h2>
          <ol className="plan">
            <li>
              <div className="plan-d">Learn</div>
              <div className="plan-b">
                {nextFive.length === 0 && <div className="muted small">Nothing queued. Every lesson written so far is done; more are on their way.</div>}
                <ul className="plainlist">
                  {nextFive.map((l) => <li key={l.id}><Link to={`/lesson/${l.id}`}>{l.title}</Link></li>)}
                </ul>
              </div>
            </li>
            <li>
              <div className="plan-d">Build</div>
              <div className="plan-b">
                {buildStep
                  ? <div><Link to={`/project/${buildStep.phase.id}`}>{buildStep.title}</Link> <span className="muted small">· {buildStep.phase.project.title}</span></div>
                  : <div className="muted small">{nextProject ? <>Next project: <Link to={`/project/${nextProject.id}`}>{nextProject.projectName}</Link>, which closes {nextProject.short}. Its steps appear here once written.</> : 'No project is waiting.'}</div>}
              </div>
            </li>
            <li>
              <div className="plan-d">Revise</div>
              <div className="plan-b">
                {weak.length === 0 ? <div className="muted small">No weak quizzes (under 70%). Re-take any quiz to test yourself.</div>
                  : <ul className="plainlist">{weak.map(([id, q]) => <li key={id}><Link to={`/lesson/${id}`}>{lessonById[id].title}</Link> <span className="muted small">· best {q.score}/{q.total}</span></li>)}</ul>}
              </div>
            </li>
            <li>
              <div className="plan-d">Apply</div>
              <div className="plan-b">
                {gate
                  ? <div className="apply-line">Gate {gate.gateLetter} is open. <Link to={`/gate/${gate.id}`}>Find roles and log applications</Link> <span className="muted small">· {state.apps.length} logged so far</span></div>
                  : <div className="muted small">{upcomingGate ? <>Gate {upcomingGate.gateLetter} opens when you finish {upcomingGate.short}. <Link to={`/gate/${upcomingGate.id}`}>See what it needs</Link>.</> : 'All gates are open.'}</div>}
              </div>
            </li>
          </ol>
        </section>

        <section className="card pad col" aria-label="Activity">
          <h2 className="h2">Your activity</h2>
          <Heatmap activity={state.activity} />
          <h2 className="h2 mt">Rules of this roadmap</h2>
          <ul className="plainlist rules">
            <li><strong>Your pace:</strong> there are no deadlines. Finish a phase when you understand it, not when a calendar says so.</li>
            <li><strong>Data rule:</strong> every project uses synthetic data you generate yourself. No client data or names.</li>
            <li><strong>Resume rule:</strong> do not list individual client projects. Keep domain groupings (Finance, Sales, Supply Chain, HR &amp; Compliance) and put portfolio projects in a separate Projects section with GitHub links.</li>
          </ul>
        </section>
      </div>

      <section aria-label="Phases by stage">
        <h2 className="h2">Every phase, by stage</h2>
        <p className="muted small">★ core · ◆ plus · ○ breadth. Lessons you have finished / lessons planned. Start with the ★ phases; the optional extended track is only for when a job asks.</p>
        <div className="stage-grid">
          {STAGE_GROUPS.map((s) => {
            return (
              <div key={s.id} className="stage-card card" style={{ '--sc': s.color, '--st': s.tint }}>
                <div className="stage-card-h">
                  <span className="stage-card-t">{s.num !== null ? `Stage ${s.num} · ` : ''}{s.title}</span>
                  <span className="stage-card-w">{s.phases.length} phase{s.phases.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="stage-list">
                  {s.phases.map((p) => {
                    const pr = phaseProgress(p, state);
                    return (
                      <li key={p.id}>
                        <Link to={`/phase/${p.id}`} className="stage-row" style={{ '--pc': p.color }}>
                          <span className="sr-emoji" aria-hidden>{p.emoji}</span>
                          <span className="sr-t">{p.short}{p.gateLetter && <span className="sr-gate" title={`Gate ${p.gateLetter}`}>🚩{p.gateLetter}</span>}</span>
                          <span className="sr-pri" title={p.priority}>{p.priority === 'core' ? '★' : p.priority === 'plus' ? '◆' : '○'}</span>
                          <span className="sr-n muted small">{pr.done}/{pr.total || '?'}{pr.done ? ` · ${pct(pr.pct)}` : ''}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
