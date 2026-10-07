// Checks (and optionally fixes) where the correct quiz answer sits in each lesson, so it is not always option B.
// Usage:  node scripts/quiz-balance.mjs <lesson-file-or-folder>          report only
//         node scripts/quiz-balance.mjs <lesson-file-or-folder> --fix    rotate options in unbalanced lessons (keeps relative order)
// A lesson is "unbalanced" when one position holds 4 or more of its answers. Works on quiz lines written as:
//   { q: '…', o: ['…', '…', '…', '…'], a: 1, why: '…' },      (one question per line)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
const fix = process.argv.includes('--fix');
if (!target) { console.log('usage: node scripts/quiz-balance.mjs <lesson-file-or-folder> [--fix]'); process.exit(1); }
const TARGETS = [[2, 0, 3, 1, 0, 3], [1, 3, 0, 2, 3, 1], [3, 1, 2, 0, 1, 2], [0, 2, 1, 3, 2, 0]];
const lineRe = /^(\s*\{ q: )(.*)(, o: )(\[.*\])(, a: )(\d+)(, why: .*)$/;
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((x) => x.endsWith('.js') && x !== 'shared.js').map((x) => path.join(target, x))
  : [target];

let k = 0; let anyBad = false;
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  const qs = lines.map((l, i) => ({ i, m: l.match(lineRe) })).filter((x) => x.m);
  if (!qs.length) { console.log(`${path.basename(f).padEnd(52)} no one-line quiz questions found`); continue; }
  const dist = [0, 0, 0, 0]; qs.forEach((x) => { dist[+x.m[6]] = (dist[+x.m[6]] || 0) + 1; });
  const bad = Math.max(...dist) >= 4;
  anyBad = anyBad || bad;
  console.log(`${path.basename(f).padEnd(52)} n=${qs.length} answers at A/B/C/D = ${dist.join('/')}${bad ? '  <-- unbalanced' : ''}`);
  if (fix && bad) {
    const want = TARGETS[k++ % TARGETS.length];
    qs.forEach((x, n) => {
      const opts = new Function(`return ${x.m[4]}`)();
      const a = +x.m[6]; const to = want[n % want.length] % opts.length;
      const shift = (to - a + opts.length) % opts.length;
      const rot = opts.map((_, j) => opts[(j - shift + opts.length) % opts.length]);
      const ser = '[' + rot.map((o) => "'" + o.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'").join(', ') + ']';
      lines[x.i] = x.m[1] + x.m[2] + x.m[3] + ser + x.m[5] + to + x.m[7];
    });
    writeFileSync(f, lines.join('\n'));
    console.log('   rebalanced', path.basename(f));
  }
}
process.exit(!fix && anyBad ? 1 : 0);
