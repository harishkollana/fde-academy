// Reads docs/roadmap-v2/*.md (the curriculum) and src/content/phases/<phase>/<lesson>.js (what exists),
// then prints how many lessons each phase has planned vs written, and checks the plan for mistakes.
// Usage: node scripts/roadmap-status.mjs            (table)
//        node scripts/roadmap-status.mjs --json     (machine-readable)
//        node scripts/roadmap-status.mjs --missing sql   (list lessons still to write in one phase)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs/roadmap-v2');
const PHASES_DIR = path.join(ROOT, 'src/content/phases');

const plan = []; // { phase, kind: 'main'|'optional', title, lessons: [{id, title, marked}] }
const problems = [];
const seen = new Map();

for (const file of readdirSync(DOCS).filter((f) => /^\d\d-.*\.md$/.test(f) && f !== '00-index.md').sort()) {
  let cur = null;
  for (const line of readFileSync(path.join(DOCS, file), 'utf8').split(/\r?\n/)) {
    const h = line.match(/^## (?:Phase \d+|X\d) · `([a-z0-9-]+)` — (.+?)(?: · |$)/);
    if (h) { cur = { phase: h[1], title: h[2], kind: /^## X\d/.test(line) ? 'optional' : 'main', lessons: [], file }; plan.push(cur); continue; }
    const l = line.match(/^- (✅ )?`([a-z0-9-]+)` (.+?)(?: — |$)/);
    if (l && cur) {
      const id = l[2];
      if (!id.startsWith(`${cur.phase}-`)) problems.push(`${file}: lesson id "${id}" does not start with its phase id "${cur.phase}-"`);
      if (seen.has(id)) problems.push(`${file}: duplicate lesson id "${id}" (also in ${seen.get(id)})`);
      seen.set(id, file);
      cur.lessons.push({ id, title: l[3], marked: !!l[1] });
    }
  }
}

const exists = (phase, id) => existsSync(path.join(PHASES_DIR, phase, `${id}.js`));
const rows = plan.map((p) => {
  const written = p.lessons.filter((l) => exists(p.phase, l.id));
  p.lessons.forEach((l) => { if (l.marked && !exists(p.phase, l.id)) problems.push(`${p.phase}: ${l.id} is marked ✅ in the plan but src/content/phases/${p.phase}/${l.id}.js does not exist`); });
  const stray = existsSync(path.join(PHASES_DIR, p.phase)) ? readdirSync(path.join(PHASES_DIR, p.phase)).filter((f) => f.endsWith('.js') && f !== 'shared.js' && !p.lessons.some((l) => `${l.id}.js` === f)) : [];
  stray.forEach((f) => problems.push(`${p.phase}: file ${f} is not in the plan (add it to docs/roadmap-v2 or rename)`));
  return { phase: p.phase, kind: p.kind, planned: p.lessons.length, written: written.length };
});

if (process.argv.includes('--json')) { console.log(JSON.stringify({ rows, problems }, null, 2)); process.exit(problems.length ? 1 : 0); }

const miss = process.argv.indexOf('--missing');
if (miss > -1) {
  const p = plan.find((x) => x.phase === process.argv[miss + 1]);
  if (!p) { console.log('unknown phase'); process.exit(1); }
  p.lessons.filter((l) => !exists(p.phase, l.id)).forEach((l) => console.log(`- ${l.id}  ${l.title}`));
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('phase', 18)}${pad('kind', 10)}${pad('planned', 9)}${pad('written', 9)}`);
for (const r of rows) console.log(`${pad(r.phase, 18)}${pad(r.kind, 10)}${pad(r.planned, 9)}${pad(r.written, 9)}`);
const main = rows.filter((r) => r.kind === 'main');
const opt = rows.filter((r) => r.kind === 'optional');
const sum = (a, k) => a.reduce((n, r) => n + r[k], 0);
console.log(`\nmain: ${main.length} phases, ${sum(main, 'planned')} lessons planned, ${sum(main, 'written')} written`);
console.log(`optional: ${opt.length} phases, ${sum(opt, 'planned')} lessons planned, ${sum(opt, 'written')} written`);
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n${problems.map((p) => '  - ' + p).join('\n')}` : '\nno problems found in the plan');
process.exit(problems.length ? 1 : 0);
