import { useState } from 'react';

// A Power Automate cloud flow, simulated step by step.
const steps = (opt) => [
  { id: 'trig', kind: 'trigger', name: 'When a file is created in folder', sub: 'SharePoint › Incoming' },
  { id: 'scopeTry', kind: 'scope', name: 'Scope: Try', children: [
    { id: 'get', name: 'Get file content', sub: 'SharePoint' },
    { id: 'call', name: 'HTTP: call Azure Function /reconcile', sub: 'retry policy: 4 × exponential', fail: opt.fnFails },
    { id: 'parse', name: 'Parse JSON', sub: 'counts: matched, mismatched, missing' },
    { id: 'save', name: 'Create file in Processed', sub: 'reconciliation_report.xlsx' },
    { id: 'cond', kind: 'cond', name: 'Condition: mismatched > 0 ?', yes: opt.mismatches > 0, children: [
      { id: 'appr', name: 'Start and wait for an approval', sub: 'Teams adaptive card → finance lead', outcome: opt.approve ? 'Approve' : 'Reject' },
      { id: 'cond2', kind: 'cond', name: 'Condition: outcome = Approve ?', yes: opt.approve, children: [
        { id: 'mail', name: 'Send an email (V2)', sub: 'report to AP team', branch: 'yes' },
        { id: 'move', name: 'Move file to Exceptions', sub: 'with approver comments', branch: 'no' },
      ] },
    ] },
  ] },
  { id: 'scopeCatch', kind: 'scope', name: 'Scope: Catch', runAfter: 'has failed / has timed out', children: [
    { id: 'teams', name: 'Post message in Teams', sub: '⚠ Reconciliation flow failed' },
    { id: 'log', name: 'Create item in Run Log list', sub: 'status = Failed' },
  ] },
];

function simulate(opt) {
  const res = {}; let failed = false;
  res.trig = 'Succeeded';
  const run = (list) => {
    for (const s of list) {
      if (failed) { res[s.id] = 'Skipped'; if (s.children) s.children.forEach((c) => (res[c.id] = 'Skipped')); continue; }
      if (s.fail) { res[s.id] = 'Failed'; failed = true; continue; }
      if (s.kind === 'cond') {
        res[s.id] = 'Succeeded';
        if (!s.yes) { s.children.forEach((c) => { res[c.id] = 'Skipped'; if (c.children) c.children.forEach((cc) => (res[cc.id] = 'Skipped')); }); continue; }
        s.children.forEach((c) => {
          if (c.kind === 'cond') { res[c.id] = 'Succeeded'; c.children.forEach((cc) => (res[cc.id] = (cc.branch === 'yes') === c.yes ? 'Succeeded' : 'Skipped')); }
          else res[c.id] = 'Succeeded';
        });
        continue;
      }
      res[s.id] = 'Succeeded';
    }
  };
  const all = steps(opt);
  run(all[1].children);
  res.scopeTry = failed ? 'Failed' : 'Succeeded';
  const catchRuns = failed;
  all[2].children.forEach((c) => (res[c.id] = catchRuns ? 'Succeeded' : 'Skipped'));
  res.scopeCatch = catchRuns ? 'Succeeded' : 'Skipped';
  return { res, failed };
}

const ICON = { Succeeded: '✅', Failed: '❌', Skipped: '⏭️' };

function Step({ s, res, depth = 0 }) {
  const st = res?.[s.id];
  return (
    <div className={`fs-step ${s.kind || ''} st-${st || 'none'}`} style={{ marginLeft: depth * 18 }}>
      <div className="fs-card">
        <span className="fs-ico">{s.kind === 'trigger' ? '⚡' : s.kind === 'scope' ? '🧺' : s.kind === 'cond' ? '🔀' : '⚙️'}</span>
        <div><div className="fs-name">{s.name}</div>{s.sub && <div className="fs-sub">{s.sub}{s.outcome && st === 'Succeeded' ? ` → ${s.outcome}` : ''}</div>}{s.runAfter && <div className="fs-sub">⚙ Configure run after: <b>{s.runAfter}</b></div>}</div>
        <span className="fs-st">{st ? `${ICON[st]} ${st}` : ''}</span>
      </div>
      {s.children && s.children.map((c) => <Step key={c.id} s={c} res={res} depth={depth + 1} />)}
    </div>
  );
}

export default function FlowSimulator() {
  const [opt, setOpt] = useState({ fnFails: false, mismatches: 4, approve: true });
  const [out, setOut] = useState(null);
  const set = (k, v) => { setOpt({ ...opt, [k]: v }); setOut(null); };
  return (
    <div className="w-flow">
      <div className="w-title">Power Automate flow simulator — GST reconciliation</div>
      <div className="row wrap">
        <label className="toggle"><input type="checkbox" checked={opt.fnFails} onChange={(e) => set('fnFails', e.target.checked)} /> Azure Function is down (500 error)</label>
        <label className="lbl">mismatches found: {opt.mismatches}</label><input type="range" min="0" max="10" value={opt.mismatches} onChange={(e) => set('mismatches', +e.target.value)} />
        <label className="toggle"><input type="checkbox" checked={opt.approve} onChange={(e) => set('approve', e.target.checked)} /> finance lead approves</label>
        <button className="btn primary" onClick={() => setOut(simulate(opt))}>▶ Test flow</button>
      </div>
      <div className="fs-canvas">{steps(opt).map((s) => <Step key={s.id} s={s} res={out?.res} />)}</div>
      {out && <div className={out.failed ? 'verdict bad' : 'verdict ok'}>{out.failed ? 'The Try scope failed, so the Catch scope ran (because its “run after” is set to has failed). The run is still marked failed so you can see it in history.' : 'Flow run succeeded. The Catch scope was skipped because nothing failed.'}</div>}
      <p className="muted small">This is the <b>try/catch pattern</b> in Power Automate: put the work in one Scope, and a second Scope that runs only after the first “has failed” or “has timed out”.</p>
    </div>
  );
}
