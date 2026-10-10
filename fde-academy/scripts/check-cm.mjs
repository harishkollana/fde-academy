// Checks the Corporate Mitra lesson files: schema, block types, and sketch layout (bounds + text that would overflow its box).
// Usage: node scripts/check-cm.mjs [file-substring]
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'corporate-mitra');
const only = process.argv[2];
const weeks = ['intro', 'week1', 'week2', 'week3', 'week4', 'week5', 'week6'];
const CALLOUTS = ['tip', 'warn', 'analogy', 'interview', 'real', 'remember', 'local'];
const TYPES = ['box', 'db', 'doc', 'circle', 'cloud', 'person', 'note', 'arrow', 'line', 'text', 'table', 'mark', 'brace'];

let errors = 0; let warns = 0; let total = 0;
const err = (f, m) => { errors++; console.log(`  ERROR ${f}: ${m}`); };
const warn = (f, m) => { warns++; console.log(`  warn  ${f}: ${m}`); };

// Measured on rendered Kalam: regular ~0.44 em per character, bold ~0.48 em. Slightly padded.
const cw = (size, bold) => size * (bold ? 0.5 : 0.46);
const lines = (s) => String(s).split('\n');
const textW = (s, size, bold) => Math.max(...lines(s).map((l) => l.length)) * cw(size, bold);

function checkSketch(f, sp, n) {
  const tag = `sketch#${n} "${(sp.caption || '').slice(0, 30)}"`;
  if (sp.w !== 760) warn(f, `${tag}: w should be 760 (is ${sp.w})`);
  if (!(sp.h >= 160 && sp.h <= 480)) warn(f, `${tag}: h ${sp.h} outside 160..480`);
  if (!sp.caption) warn(f, `${tag}: no caption`);
  const inb = (x, y, what) => { if (x < -2 || y < -2 || x > sp.w + 2 || y > sp.h + 2) err(f, `${tag}: ${what} out of bounds (${Math.round(x)},${Math.round(y)})`); };
  const rects = [];
  for (const it of sp.items || []) {
    if (!TYPES.includes(it.t)) { err(f, `${tag}: unknown item type ${it.t}`); continue; }
    const rect = (x, y, w, h) => { inb(x, y, it.t); inb(x + w, y + h, `${it.t} corner`); };
    switch (it.t) {
      case 'box': {
        rect(it.x, it.y, it.w, it.h);
        const size = it.size || 19;
        if (it.label) {
          if (textW(it.label, size, true) > it.w - 8) warn(f, `${tag}: box label "${it.label.replace(/\n/g, '/')}" too wide for ${it.w}px (needs ~${Math.round(textW(it.label, size, true))})`);
          const need = lines(it.label).length * size * 1.15 + (it.sub ? 22 : 0);
          if (need > it.h - 6) warn(f, `${tag}: box "${it.label.replace(/\n/g, '/')}" too short (${it.h}px, needs ~${Math.round(need)})`);
        }
        if (it.sub && textW(it.sub, 14, false) > it.w - 8) warn(f, `${tag}: box sub "${it.sub}" too wide for ${it.w}px`);
        rects.push({ x: it.x, y: it.y, w: it.w, h: it.h, id: it.label });
        break;
      }
      case 'note': {
        rect(it.x, it.y, it.w, it.h);
        const size = it.size || 15;
        if (textW(it.text, size, false) > it.w - 10) warn(f, `${tag}: note "${it.text.replace(/\n/g, '/')}" too wide for ${it.w}px (needs ~${Math.round(textW(it.text, size))})`);
        if (lines(it.text).length * size * 1.15 > it.h - 4) warn(f, `${tag}: note "${it.text.replace(/\n/g, '/')}" too tall for ${it.h}px`);
        rects.push({ x: it.x, y: it.y, w: it.w, h: it.h, id: it.text });
        break;
      }
      case 'db': case 'doc': case 'cloud': {
        rect(it.x, it.y, it.w, it.h);
        if (it.label && textW(it.label, it.size || 16, true) > it.w - 8) warn(f, `${tag}: ${it.t} label "${it.label.replace(/\n/g, '/')}" too wide for ${it.w}px`);
        rects.push({ x: it.x, y: it.y, w: it.w, h: it.h, id: it.label });
        break;
      }
      case 'circle': {
        inb(it.x - it.r, it.y - it.r, 'circle'); inb(it.x + it.r, it.y + it.r, 'circle');
        if (it.label && textW(it.label, it.size || 17, true) > it.r * 1.8) warn(f, `${tag}: circle label "${it.label.replace(/\n/g, '/')}" too wide for r=${it.r}`);
        break;
      }
      case 'person': inb(it.x - 20, it.y - 12, 'person'); inb(it.x + 20, it.y + 82, 'person'); break;
      case 'arrow': case 'line': inb(it.x1, it.y1, it.t); inb(it.x2, it.y2, it.t); break;
      case 'text': {
        const size = it.size || 18; const w = textW(it.text, size, it.bold); const a = it.anchor || 'middle';
        const left = a === 'start' ? it.x : a === 'end' ? it.x - w : it.x - w / 2;
        const right = left + w;
        const half = (lines(it.text).length * size * 1.15) / 2;
        if (left < -2 || right > sp.w + 2) err(f, `${tag}: text "${it.text.replace(/\n/g, '/')}" runs off the canvas (${Math.round(left)}..${Math.round(right)})`);
        if (it.y - half < -2 || it.y + half > sp.h + 2) err(f, `${tag}: text "${it.text.replace(/\n/g, '/')}" outside canvas vertically`);
        break;
      }
      case 'table': {
        const W = (it.colW || it.cols.map(() => 90)).reduce((a, b) => a + b, 0);
        rect(it.x, it.y, W, (it.rowH || 28) * (it.rows.length + 1));
        rects.push({ x: it.x, y: it.y, w: W, h: (it.rowH || 28) * (it.rows.length + 1), id: 'table' });
        break;
      }
      default: break;
    }
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i]; const b = rects[j];
    if (a.x < b.x + b.w - 4 && b.x < a.x + a.w - 4 && a.y < b.y + b.h - 4 && b.y < a.y + a.h - 4) warn(f, `${tag}: boxes overlap: "${String(a.id).replace(/\n/g, '/')}" and "${String(b.id).replace(/\n/g, '/')}"`);
  }
}

const seen = new Set();
for (const wk of weeks) {
  const dir = join(root, wk);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((x) => x.endsWith('.js')).sort()) {
    const f = `${wk}/${file}`;
    if (only && !f.includes(only)) continue;
    total++;
    let mod;
    try { mod = (await import(pathToFileURL(join(dir, file)).href)).default; } catch (e) { err(f, `cannot import: ${e.message}`); continue; }
    if (!mod || typeof mod !== 'object') { err(f, 'no default export'); continue; }
    if (seen.has(file)) err(f, 'duplicate file name'); seen.add(file);
    if (!mod.title) err(f, 'missing title');
    if (!mod.goal) err(f, 'missing goal');
    if (!Array.isArray(mod.covers) || mod.covers.length === 0) warn(f, 'no covers');
    if (!Array.isArray(mod.terms) || mod.terms.length < 4) warn(f, 'fewer than 4 terms');
    else mod.terms.forEach((t) => { if (!Array.isArray(t) || t.length !== 2 || !t[0] || !t[1]) err(f, `bad term entry ${JSON.stringify(t)}`); });
    if (!Array.isArray(mod.blocks) || mod.blocks.length === 0) { err(f, 'no blocks'); continue; }
    let sketches = 0; let words = 0; let hasRemember = false; let n = 0;
    for (const b of mod.blocks) {
      if (typeof b === 'string') { words += b.split(/\s+/).length; continue; }
      if (b.sketch) { sketches++; n++; checkSketch(f, b.sketch, n); continue; }
      const k = CALLOUTS.find((c) => b[c]);
      if (k) { words += String(b[k]).split(/\s+/).length; if (k === 'remember') hasRemember = true; continue; }
      if (b.cols) { b.cols.forEach((c) => { words += c.split(/\s+/).length; }); continue; }
      if (b.checklist) continue;
      err(f, `unknown block ${Object.keys(b).join(',')}`);
    }
    if (sketches < 1) err(f, 'no sketch');
    if (!hasRemember) warn(f, 'no remember callout');
    if (!Array.isArray(mod.quiz) || mod.quiz.length < 4) warn(f, 'quiz needs at least 4 questions');
    else mod.quiz.forEach((q, i) => {
      if (!q.q || !Array.isArray(q.o) || q.o.length !== 4 || !Number.isInteger(q.a) || q.a < 0 || q.a > 3 || !q.why) err(f, `quiz question ${i + 1} is malformed`);
    });
    if (words < 700) warn(f, `short: ${words} words`);
    console.log(`${f}: ${words} words, ${sketches} sketches, ${mod.terms?.length || 0} terms`);
  }
}
console.log(`\nChecked ${total} lessons: ${errors} errors, ${warns} warnings.`);
process.exit(errors ? 1 : 0);
