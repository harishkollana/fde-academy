// Prints, per lesson in a folder: words of explanation (markdown blocks + callouts), and counts of sketches, runnable blocks, challenges, widgets, quiz questions.
// Usage: node scripts/lesson-stats.mjs src/content/phases/foundations
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || '.');
const words = (s) => (String(s).replace(/```[\s\S]*?```/g, ' ').match(/[A-Za-z0-9₹'’-]+/g) || []).length;
const rows = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'shared.js').sort()) {
  const l = (await import(pathToFileURL(path.join(dir, f)).href)).default;
  let w = 0; const c = { sketch: 0, run: 0, challenge: 0, widget: 0, callouts: 0 };
  for (const b of l.blocks) {
    if (typeof b === 'string') w += words(b);
    else if (b.sketch) c.sketch++;
    else if (b.sql || b.py) c.run++;
    else if (b.challenge || b.pychallenge) c.challenge++;
    else if (b.widget) c.widget++;
    else { const k = Object.keys(b)[0]; if (typeof b[k] === 'string') { c.callouts++; w += words(b[k]); } }
  }
  const hasRecap = l.blocks.some((b) => typeof b === 'string' && /^## Recap/m.test(b));
  rows.push([l.id.replace(/^foundations-/, ''), w, c.sketch, c.run, c.challenge, c.widget, c.callouts, l.quiz.length, hasRecap ? 'yes' : 'NO']);
}
console.log('lesson'.padEnd(36) + 'words  sketch run chall widget callouts quiz recap');
for (const r of rows) console.log(String(r[0]).padEnd(36) + r.slice(1).map((x) => String(x).padEnd(r.indexOf(x) === 1 ? 7 : 7)).join(''));
