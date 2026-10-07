import { useState } from 'react';

const COLORS = ['#1971c2', '#e8590c', '#2f9e44', '#9c36b5', '#c2255c'];
const init = () => ({
  commits: [{ id: 'a1f', branch: 'main', parents: [], msg: 'initial commit' }],
  branches: { main: 'a1f' }, head: 'main', lanes: ['main'], log: ['git init', 'git commit -m "initial commit"'],
});
const hash = () => Math.random().toString(16).slice(2, 5);

export default function GitGraph() {
  const [s, setS] = useState(init);
  const [msg, setMsg] = useState('add validation rules');
  const [nb, setNb] = useState('feature/fx-check');
  const [mergeFrom, setMergeFrom] = useState('');

  const commit = () => {
    const id = hash();
    setS({ ...s, commits: [...s.commits, { id, branch: s.head, parents: [s.branches[s.head]], msg }], branches: { ...s.branches, [s.head]: id }, log: [...s.log, 'git add .', `git commit -m "${msg}"`] });
  };
  const branch = () => {
    if (!nb || s.branches[nb]) return;
    setS({ ...s, branches: { ...s.branches, [nb]: s.branches[s.head] }, head: nb, lanes: [...s.lanes, nb], log: [...s.log, `git switch -c ${nb}`] });
  };
  const checkout = (b) => setS({ ...s, head: b, log: [...s.log, `git switch ${b}`] });
  const merge = () => {
    const from = mergeFrom; if (!from || from === s.head) return;
    const id = hash();
    setS({ ...s, commits: [...s.commits, { id, branch: s.head, parents: [s.branches[s.head], s.branches[from]], msg: `Merge ${from} into ${s.head}`, merge: true }], branches: { ...s.branches, [s.head]: id }, log: [...s.log, `git merge ${from}`] });
  };

  const X = (i) => 40 + i * 70; const Y = (b) => 40 + s.lanes.indexOf(b) * 56;
  const idx = Object.fromEntries(s.commits.map((c, i) => [c.id, i]));
  const W = Math.max(500, X(s.commits.length) + 40); const H = 40 + s.lanes.length * 56;

  return (
    <div className="w-git">
      <div className="w-title">Git playground — branch, commit, merge</div>
      <div className="row wrap">
        <input className="mono-in" value={msg} onChange={(e) => setMsg(e.target.value)} style={{ maxWidth: 220 }} />
        <button className="btn" onClick={commit}>commit</button>
        <input className="mono-in" value={nb} onChange={(e) => setNb(e.target.value)} style={{ maxWidth: 180 }} />
        <button className="btn" onClick={branch}>new branch</button>
        <select value={s.head} onChange={(e) => checkout(e.target.value)}>{Object.keys(s.branches).map((b) => <option key={b}>{b}</option>)}</select>
        <select value={mergeFrom} onChange={(e) => setMergeFrom(e.target.value)}><option value="">merge from…</option>{Object.keys(s.branches).filter((b) => b !== s.head).map((b) => <option key={b}>{b}</option>)}</select>
        <button className="btn" onClick={merge}>merge into {s.head}</button>
        <button className="btn-mini" onClick={() => setS(init())}>reset</button>
      </div>
      <div className="git-svg">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, maxWidth: 'none' }}>
          {s.lanes.map((b, li) => <text key={b} x={4} y={Y(b) - 16} className="git-lane" fill={COLORS[li % 5]}>{b}</text>)}
          {s.commits.map((c, i) => c.parents.map((p) => {
            const pc = s.commits[idx[p]]; const pi = idx[p];
            return <path key={c.id + p} d={`M${X(pi)} ${Y(pc.branch)} C ${X(pi) + 35} ${Y(pc.branch)}, ${X(i) - 35} ${Y(c.branch)}, ${X(i)} ${Y(c.branch)}`} stroke="#1f2a44" strokeWidth="2" fill="none" />;
          }))}
          {s.commits.map((c, i) => (
            <g key={c.id}>
              <circle cx={X(i)} cy={Y(c.branch)} r={c.merge ? 11 : 9} fill={COLORS[s.lanes.indexOf(c.branch) % 5]} stroke="#1f2a44" strokeWidth="2" />
              <text x={X(i)} y={Y(c.branch) + 26} textAnchor="middle" className="git-id">{c.id}</text>
            </g>
          ))}
          {Object.entries(s.branches).map(([b, id]) => (
            <text key={b} x={X(idx[id]) + 12} y={Y(s.commits[idx[id]].branch) - 12} className="git-ptr">{b === s.head ? `HEAD→${b}` : b}</text>
          ))}
        </svg>
      </div>
      <pre className="sqlsnip">{s.log.slice(-8).join('\n')}</pre>
    </div>
  );
}
