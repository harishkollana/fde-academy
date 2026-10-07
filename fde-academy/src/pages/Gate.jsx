import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { phaseById } from '../content/index.js';
import { useProgress } from '../lib/store';
import Blocks, { Checklist } from '../components/Blocks';
import { Empty, PhaseTag, useDocTitle, checklistProgress, phaseProgress, gateOpen, todayKey, slug, GATE_PHASES, neighbours } from './shared';
import NotFound from './NotFound';

const STATUSES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

const searchLinks = (title) => {
  const q = encodeURIComponent(title); const s = slug(title);
  return [
    ['LinkedIn', `https://www.linkedin.com/jobs/search/?keywords=${q}&f_WT=2`],
    ['Naukri', `https://www.naukri.com/${s}-jobs?wfhType=2`],
    ['Wellfound', `https://wellfound.com/role/r/${s}`],
    ['Instahyre', `https://www.instahyre.com/${s}-jobs/`],
  ];
};

function Tracker({ gateOptions, defaultGate }) {
  const { state, dispatch } = useProgress();
  const apps = state.apps;
  const empty = { company: '', role: '', link: '', date: todayKey(), gate: defaultGate, status: 'Applied', notes: '' };
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('All');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = (next) => dispatch({ type: 'apps', apps: next });

  const add = (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    save([{ ...form, company: form.company.trim(), role: form.role.trim(), id: `${Date.now()}${Math.floor(Math.random() * 1000)}` }, ...apps]);
    setForm({ ...empty, gate: form.gate, date: form.date });
  };
  const patch = (id, change) => save(apps.map((a) => (a.id === id ? { ...a, ...change } : a)));
  const remove = (id) => { if (window.confirm('Delete this application row?')) save(apps.filter((a) => a.id !== id)); };

  const counts = Object.fromEntries(STATUSES.map((s) => [s, apps.filter((a) => a.status === s).length]));
  const shown = filter === 'All' ? apps : apps.filter((a) => a.status === filter);

  return (
    <section className="tracker card pad" aria-label="Application tracker">
      <div className="row wrap"><h2 className="h2">📋 Application tracker</h2><span className="spacer" />
        <span className="week-target">Applications logged: <strong>{apps.length}</strong></span></div>
      <p className="muted small">The tracker is shared by all gates, and stored only in this browser (export from Settings).</p>

      <div className="chips" role="tablist" aria-label="Filter by status">
        <button className={filter === 'All' ? 'chip on' : 'chip'} onClick={() => setFilter('All')}>All {apps.length}</button>
        {STATUSES.map((s) => <button key={s} className={filter === s ? 'chip on' : 'chip'} onClick={() => setFilter(s)}>{s} {counts[s]}</button>)}
      </div>

      <form className="app-form" onSubmit={add}>
        <input className="mono-in" placeholder="Company *" value={form.company} onChange={set('company')} aria-label="Company" required />
        <input className="mono-in" placeholder="Role *" value={form.role} onChange={set('role')} aria-label="Role" required />
        <input className="mono-in" placeholder="Job link" value={form.link} onChange={set('link')} aria-label="Job link" />
        <input className="mono-in" type="date" value={form.date} onChange={set('date')} aria-label="Date applied" />
        <select className="mono-in" value={form.gate} onChange={set('gate')} aria-label="Gate">{gateOptions.map((g) => <option key={g} value={g}>Gate {g}</option>)}</select>
        <select className="mono-in" value={form.status} onChange={set('status')} aria-label="Status">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input className="mono-in app-notes" placeholder="Notes (contact, referral, next step)" value={form.notes} onChange={set('notes')} aria-label="Notes" />
        <button className="btn primary" type="submit">+ Add</button>
      </form>

      {apps.length === 0 && <Empty icon="📨" title="No applications logged yet.">Add each application the day you send it, so you can follow up and see what is working.</Empty>}
      {apps.length > 0 && shown.length === 0 && <div className="muted">No rows with status “{filter}”.</div>}
      {shown.length > 0 && (
        <div className="tablewrap">
          <table className="mdtable apps-table">
            <thead><tr><th>Date</th><th>Company</th><th>Role</th><th>Gate</th><th>Status</th><th>Notes</th><th /></tr></thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap">{a.date}</td>
                  <td><strong>{a.company}</strong></td>
                  <td>{/^https?:\/\//.test(a.link || '') ? <a href={a.link} target="_blank" rel="noreferrer">{a.role}</a> : a.role}</td>
                  <td>{a.gate}</td>
                  <td><select className={`status-sel s-${a.status}`} value={a.status} onChange={(e) => patch(a.id, { status: e.target.value })} aria-label={`Status for ${a.company}`}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className="app-note-cell">{a.notes}</td>
                  <td><button className="btn-mini" onClick={() => remove(a.id)} aria-label={`Delete ${a.company}`}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Gate() {
  const { phaseId } = useParams();
  const phase = phaseById[phaseId];
  useDocTitle(phase?.gateLetter ? `Gate ${phase.gateLetter}` : 'Apply gate');
  const { state } = useProgress();
  if (!phase) return <NotFound what="gate" />;

  const gate = phase.gate;
  const gateOptions = GATE_PHASES.map((p) => p.gateLetter);

  // Not every phase closes with a gate: point to the ones that do (the tracker still works from here).
  if (!phase.gateLetter) {
    return (
      <div className="page gate" style={{ '--pc': phase.color, '--pt': phase.tint }}>
        <nav className="crumbs"><PhaseTag phase={phase} /><span aria-hidden>›</span><span>Apply gate</span></nav>
        <h1>No apply gate after this phase</h1>
        <Empty icon="🚩" title="Gates open at the end of each stage.">
          Gates: {GATE_PHASES.map((p, i) => <span key={p.id}>{i ? ' · ' : ''}<Link to={`/gate/${p.id}`}>Gate {p.gateLetter} (after {p.short})</Link></span>)}.
        </Empty>
        <Tracker gateOptions={gateOptions} defaultGate={gateOptions[0]} />
      </div>
    );
  }

  const titles = gate?.titles || phase.gateTitles;
  const gp = gate ? checklistProgress(gate.checklist, `gate:${gate.id}`, state) : null;
  const open = gateOpen(phase, state);
  const pr = phaseProgress(phase, state);
  const nextGate = GATE_PHASES[GATE_PHASES.findIndex((p) => p.id === phase.id) + 1];
  const { next } = neighbours(phase);

  return (
    <div className="page gate" style={{ '--pc': phase.color, '--pt': phase.tint }}>
      <nav className="crumbs"><PhaseTag phase={phase} /><span aria-hidden>›</span><span>Apply gate</span></nav>
      <header className="gate-head">
        <div className="gate-flag hand" aria-hidden>{gate?.letter || phase.gateLetter}</div>
        <div>
          <h1>Apply gate {gate?.letter || phase.gateLetter}</h1>
          <p className="lead">Rough target <strong>{gate?.target || phase.target}</strong>. {open ? 'You have finished this phase, so this gate is open.' : <>It opens when you finish <Link to={`/phase/${phase.id}`}>{phase.title}</Link> ({pr.done} of {pr.total} lessons done). Apply earlier whenever you feel ready; there is no deadline.</>}</p>
          <div className="chips">{titles.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
        </div>
      </header>

      {!gate && <Empty icon="🚧" title="The full gate guide (resume keywords, bullets, cover note) is still being written.">You can already search for jobs and track applications below.</Empty>}

      {gate?.checklist?.length > 0 && (
        <section className="card pad">
          <div className="row"><h2 className="h2">Before you apply</h2><span className="spacer" /><span className="muted small">{gp.done}/{gp.total}</span></div>
          <Checklist items={gate.checklist} prefix={`gate:${gate.id}`} xp={10} />
        </section>
      )}

      {Array.isArray(gate?.blocks) && gate.blocks.length > 0 && <Blocks blocks={gate.blocks} idBase={gate.id} />}

      {titles.length > 0 && (
        <section className="card pad" aria-label="Job search">
          <h2 className="h2">🔎 Search these roles (remote)</h2>
          <p className="muted small">Each button opens a search in a new tab, filtered to remote where the site allows it. If a site shows nothing, use its own search box with the same title.</p>
          <div className="job-rows">
            {titles.map((t) => (
              <div className="job-row" key={t}>
                <div className="job-title">{t}</div>
                <div className="job-btns">{searchLinks(t).map(([name, url]) => <a key={name} className="btn btn-sm" href={url} target="_blank" rel="noreferrer">{name} ↗</a>)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Tracker gateOptions={gateOptions} defaultGate={gate?.letter || phase.gateLetter} />

      <div className="pn"><Link className="btn pn-l" to={`/project/${phase.id}`}><span className="muted small">← Back</span><span className="pn-t">Project</span></Link>
        {next ? <Link className="btn pn-r" to={`/phase/${next.id}`}><span className="muted small">Next phase →</span><span className="pn-t">{next.title}</span></Link> : <span />}
      </div>
      {nextGate && <p className="muted small">Next gate: <Link to={`/gate/${nextGate.id}`}>Gate {nextGate.gateLetter}</Link> comes after {nextGate.short}.</p>}
    </div>
  );
}
