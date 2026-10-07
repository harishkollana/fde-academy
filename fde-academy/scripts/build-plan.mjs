// Turns docs/roadmap-v2/*.md into src/content/plan.json so the app can show every planned lesson
// (titles + what each covers) on the phase pages, even before the lesson is written.
// Run:  npm run plan     (re-run after editing the roadmap docs)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs/roadmap-v2');
const plan = {};

for (const file of readdirSync(DOCS).filter((f) => /^\d\d-.*\.md$/.test(f) && f !== '00-index.md').sort()) {
  let phase = null; let mod = null;
  for (const line of readFileSync(path.join(DOCS, file), 'utf8').split(/\r?\n/)) {
    const h = line.match(/^## (?:Phase \d+|X\d) · `([a-z0-9-]+)` — /);
    if (h) { phase = h[1]; mod = null; plan[phase] = []; continue; }
    if (!phase) continue;
    const m = line.match(/^### Module [A-Z] · (.+)$/);
    if (m) { mod = { module: m[1].trim(), lessons: [] }; plan[phase].push(mod); continue; }
    if (/^###? /.test(line) && !/^### Module/.test(line)) { if (/^### (Project|Interview)/.test(line) || /^## /.test(line)) mod = null; }
    const l = line.match(/^- (?:✅ )?`([a-z0-9-]+)` (.+?)(?: — (.+))?$/);
    if (l) {
      if (!mod) { mod = { module: null, lessons: [] }; plan[phase].push(mod); }
      mod.lessons.push({ id: l[1], title: l[2].trim(), covers: (l[3] || '').trim() });
    }
  }
}

const out = path.join(ROOT, 'src/content/plan.json');
writeFileSync(out, JSON.stringify(plan, null, 1) + '\n');
const n = Object.values(plan).flat().reduce((a, m) => a + m.lessons.length, 0);
console.log(`plan.json: ${Object.keys(plan).length} phases, ${n} planned lessons`);
