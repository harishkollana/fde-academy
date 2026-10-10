// Checks the MBA + ACCA lesson content in src/content/mba/lessons against the lesson list in sem1.js.
// Usage: node scripts/check-mba.mjs [subject-id-substring]
// Reports lessons with no content, content for lessons that do not exist, and malformed key points or quiz questions.
import { SUBJECTS, lessonsOfSubject } from '../src/content/mba/sem1.js';
import { contentOf } from '../src/content/mba/lessons/index.js';

const only = process.argv[2];
let problems = 0;
let written = 0;
let total = 0;
const bad = (msg) => { problems += 1; console.log('  PROBLEM', msg); };

for (const s of SUBJECTS) {
  if (only && !s.id.includes(only)) continue;
  const lessons = lessonsOfSubject(s);
  let n = 0;
  const missing = [];
  const answerPos = [0, 0, 0, 0];
  for (const l of lessons) {
    total += 1;
    const c = contentOf(s.id, l.no);
    if (!c) { missing.push(l.no); continue; }
    n += 1; written += 1;
    const id = `${s.id} ${l.no}`;
    if (!Array.isArray(c.points) || c.points.length < 3 || c.points.length > 6) bad(`${id}: needs 3 to 6 key points (has ${c.points?.length})`);
    for (const p of c.points || []) if (typeof p !== 'string' || p.length < 20) bad(`${id}: a key point is too short`);
    if (c.quiz.length < 2 || c.quiz.length > 4) bad(`${id}: needs 2 to 4 questions (has ${c.quiz.length})`);
    c.quiz.forEach((q, i) => {
      const where = `${id} Q${i + 1}`;
      if (!q.q || q.q.length < 10) bad(`${where}: question text missing`);
      if (!Array.isArray(q.o) || q.o.length < 3 || q.o.length > 5) bad(`${where}: needs 3 to 5 options`);
      else {
        if (new Set(q.o.map((o) => o.trim().toLowerCase())).size !== q.o.length) bad(`${where}: duplicate options`);
        if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.o.length) bad(`${where}: answer index ${q.a} is out of range`);
        else answerPos[q.a] += 1;
      }
      if (!q.why || q.why.length < 10) bad(`${where}: explanation missing`);
    });
  }
  const spread = answerPos.map((x, i) => `${'ABCD'[i]}:${x}`).join(' ');
  console.log(`${s.id}: ${n}/${lessons.length} lessons written${missing.length ? ` (next missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', ...' : ''})` : ''} | right answer position ${spread}`);
}
console.log(`\n${written}/${total} lessons have key points and a quiz. ${problems} problem(s).`);
process.exitCode = problems ? 1 : 0;
