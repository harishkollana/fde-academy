// Validates course content files: schema, unique ids, sketches, widgets, and EXECUTES
// every SQL (PGlite) and Python (python3 + pandas 2.3) snippet that is meant to run.
// Usage: node scripts/validate-content.mjs [file ...]     (default: every file in src/content)
// Needs Python with: pip install pandas==2.3.3 numpy pydantic pyyaml python-dateutil jsonschema
// Set PYTHON env var to choose the interpreter (default: python on Windows, python3 elsewhere).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const CONTENT = path.join(ROOT, 'src/content');
const WIDGETS = ['JoinVisualizer', 'WindowViz', 'RegexTester', 'FuzzyMatch', 'FlowSimulator', 'CronHelper', 'GitGraph', 'ApiPlayground', 'JwtDecoder', 'DockerCache', 'MedallionStepper', 'TokenCost', 'RagSearch', 'ToolCallDemo', 'AgentGraph', 'GuardrailTester', 'EvalRunner', 'LoadBalancer', 'OAuthFlow', 'DnsResolver', 'RetryBackoff', 'IsolationLevels', 'ExplainViz', 'ScdViz'];
const SKETCH_TYPES = ['box', 'db', 'doc', 'circle', 'cloud', 'person', 'note', 'arrow', 'line', 'text', 'table', 'mark', 'brace'];
const CALLOUTS = ['tip', 'warn', 'analogy', 'interview', 'real', 'remember', 'local'];

const errors = []; const warnings = [];
const err = (where, msg) => errors.push(`Ã¢Å“â€” ${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`! ${where}: ${msg}`);

let files = process.argv.slice(2).map((f) => path.resolve(f));
// No arguments: validate every phase aggregator in src/content/phases/ plus the practice, interview and glossary banks.
if (!files.length) {
  files = readdirSync(path.join(CONTENT, 'phases')).filter((f) => f.endsWith('.js')).map((f) => path.join(CONTENT, 'phases', f));
  for (const f of ['practice.js', 'interview.js', 'glossary.js']) if (existsSync(path.join(CONTENT, f))) files.push(path.join(CONTENT, f));
}

// ---------- SQL + Python runners ----------
let tmpl = null;
async function freshDb() {
  if (!tmpl) {
    const db = new PGlite();
    await db.exec(readFileSync(path.join(ROOT, 'src/data/seed.sql'), 'utf8'));
    tmpl = await db.dumpDataDir('none');
  }
  const d = new PGlite({ loadDataDir: tmpl }); await d.waitReady; return d;
}
async function runSql(where, sql, setup, { expectRows = false } = {}) {
  const db = await freshDb();
  try {
    if (setup) await db.exec(setup);
    const res = await db.exec(sql);
    const last = res[res.length - 1];
    if (expectRows && (!last || !last.rows.length)) err(where, 'solution returned 0 rows (a challenge should return at least one row)');
    return res;
  } catch (e) { err(where, `SQL error: ${e.message}\n      SQL: ${sql.slice(0, 160).replace(/\n/g, ' ')}Ã¢â‚¬Â¦`); }
  finally { await db.close(); }
}

const PYDIR = path.join(os.tmpdir(), 'fde-py-data');
function setupPyDir() {
  if (existsSync(path.join(PYDIR, 'orders.csv'))) return;
  mkdirSync(path.join(PYDIR, 'input'), { recursive: true });
  const src = readFileSync(path.join(ROOT, 'src/data/csv.js'), 'utf8');
  const CSV = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  for (const [k, v] of Object.entries(CSV)) writeFileSync(path.join(PYDIR, `${k}.csv`), v);
  const lines = CSV.orders.split('\n');
  writeFileSync(path.join(PYDIR, 'input/sales_2026-08.csv'), lines.slice(0, 60).join('\n'));
  writeFileSync(path.join(PYDIR, 'input/sales_2026-09.csv'), [lines[0], ...lines.slice(60, 120)].join('\n'));
  writeFileSync(path.join(PYDIR, 'input/notes.txt'), 'not a csv file');
}
const BANNED_PY = /^\s*(import|from)\s+(requests|fastapi|openpyxl|pytest|sqlalchemy|psycopg|httpx|faker|dotenv|typer|langgraph|langchain|openai|qdrant_client|dlt|dagster|azure|uvicorn|reportlab|rapidfuzz)\b/m;
function runPy(where, code, { mustFail = false } = {}) {
  setupPyDir();
  if (BANNED_PY.test(code)) { err(where, 'imports a package that is not available in the browser playground (show it as a ```python code block inside markdown instead)'); return; }
  try {
    const out = execFileSync(PYTHON, ['-c', code], { cwd: PYDIR, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    if (mustFail) warn(where, 'the STARTER code already passes the tests (challenge is too easy or tests are too weak)');
    return out;
  } catch (e) {
    if (!mustFail) err(where, `Python error:\n${String(e.stderr || e.message).split('\n').slice(-6).join('\n')}`);
  }
}

// ---------- schema checks ----------
const ids = new Map();
const claim = (id, where) => { if (!id) return; if (ids.has(id)) err(where, `duplicate id "${id}" (also in ${ids.get(id)})`); else ids.set(id, where); };
const isStr = (x) => typeof x === 'string' && x.trim().length > 0;

function checkSketch(where, sk) {
  if (typeof sk.w !== 'number' || typeof sk.h !== 'number') err(where, 'sketch needs numeric w and h');
  if (!Array.isArray(sk.items) || !sk.items.length) return err(where, 'sketch needs items[]');
  sk.items.forEach((it, i) => {
    if (!SKETCH_TYPES.includes(it.t)) err(where, `sketch item ${i} has unknown type "${it.t}"`);
    for (const k of ['x', 'y', 'w', 'h', 'r', 'x1', 'y1', 'x2', 'y2']) if (k in it && typeof it[k] !== 'number') err(where, `sketch item ${i} field ${k} must be a number`);
    const xs = [it.x, it.x1, it.x2].filter((v) => typeof v === 'number'); const ys = [it.y, it.y1, it.y2].filter((v) => typeof v === 'number');
    if (xs.some((v) => v < -5 || v > sk.w + 5) || ys.some((v) => v < -5 || v > sk.h + 5)) warn(where, `sketch item ${i} (${it.t}) is outside the ${sk.w}x${sk.h} canvas`);
    if (it.t === 'table' && (!Array.isArray(it.cols) || !Array.isArray(it.rows))) err(where, `sketch table ${i} needs cols[] and rows[][]`);
  });
}

async function checkBlocks(where, blocks) {
  if (!Array.isArray(blocks)) return err(where, 'blocks must be an array');
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]; const w = `${where} block[${i}]`;
    if (typeof b === 'string') { if (/```(sql|python)\n[\s\S]*?```/.test(b) && /\t/.test(b)) warn(w, 'tab characters inside code'); continue; }
    if (!b || typeof b !== 'object') { err(w, 'block must be a string or object'); continue; }
    const keys = Object.keys(b);
    if (b.sketch) checkSketch(w, b.sketch);
    else if (b.sql) {
      if (!isStr(b.sql.starter)) err(w, 'sql playground needs a starter');
      else await runSql(w + ' (starter)', b.sql.starter, b.sql.setup);
      if (b.sql.solution) await runSql(w + ' (solution)', b.sql.solution, b.sql.setup);
    } else if (b.py) {
      if (!isStr(b.py.starter)) err(w, 'py playground needs a starter');
      else runPy(w + ' (starter)', b.py.starter);
      if (b.py.solution) runPy(w + ' (solution)', b.py.solution);
    } else if (b.challenge) await checkSqlChallenge(w, b.challenge);
    else if (b.pychallenge) checkPyChallenge(w, b.pychallenge);
    else if (b.widget) { if (!WIDGETS.includes(b.widget)) err(w, `unknown widget "${b.widget}"`); }
    else if (b.checklist) { if (!Array.isArray(b.checklist) || !b.checklist.every(isStr)) err(w, 'checklist must be string[]'); }
    else if (b.cols) { if (!Array.isArray(b.cols) || !b.cols.every(isStr)) err(w, 'cols must be string[] (markdown)'); }
    else if (keys.length === 1 && CALLOUTS.includes(keys[0])) { if (!isStr(b[keys[0]])) err(w, 'callout text must be a non-empty string'); }
    else err(w, `unknown block type with keys ${JSON.stringify(keys)}`);
  }
}

async function checkSqlChallenge(w, c) {
  if (c.id) claim(c.id, w);
  if (!isStr(c.prompt)) err(w, 'challenge needs prompt');
  if (!isStr(c.solution)) return err(w, 'challenge needs solution');
  if (!/^\s*(select|with)\b/i.test(c.solution)) err(w, 'challenge solution must be a single SELECT/WITH query');
  if (/;\s*\S/.test(c.solution.trim().replace(/;\s*$/, ''))) err(w, 'challenge solution must be ONE statement');
  await runSql(w + ' (challenge solution)', c.solution, null, { expectRows: true });
  if (c.ordered && !/order\s+by/i.test(c.solution)) warn(w, 'ordered:true but the solution has no ORDER BY');
}
function checkPyChallenge(w, c) {
  if (c.id) claim(c.id, w);
  for (const k of ['prompt', 'starter', 'tests', 'solution']) if (!isStr(c[k])) err(w, `pychallenge needs ${k}`);
  if (!isStr(c.solution) || !isStr(c.tests)) return;
  runPy(w + ' (solution+tests)', `${c.solution}\n\n# ---- tests ----\n${c.tests}\nprint("PASS")`);
  if (isStr(c.starter)) runPy(w + ' (starter+tests)', `${c.starter}\n\n${c.tests}`, { mustFail: true });
}

async function checkLesson(where, l) {
  const w = `${where} lesson "${l.id}"`;
  claim(l.id, w);
  if (!/^[a-z0-9-]+$/.test(l.id || '')) err(w, 'id must be kebab-case');
  for (const k of ['title', 'goal']) if (!isStr(l[k])) err(w, `needs ${k}`);
  if (l.minutes !== undefined) warn(w, '`minutes` is no longer used (the app shows no time estimates); delete the field');
  if (!Array.isArray(l.blocks) || l.blocks.length < 4) err(w, 'needs at least 4 blocks');
  if (!l.blocks?.some((b) => b && b.sketch)) warn(w, 'has no hand-drawn sketch');
  if (!l.blocks?.some((b) => b && (b.sql || b.py || b.widget || b.challenge || b.pychallenge))) warn(w, 'has no playground / widget / challenge');
  await checkBlocks(w, l.blocks || []);
  if (!Array.isArray(l.quiz) || l.quiz.length < 4) err(w, 'needs a quiz with at least 4 questions');
  (l.quiz || []).forEach((q, i) => {
    if (!isStr(q.q) || !Array.isArray(q.o) || q.o.length < 2 || typeof q.a !== 'number' || q.a < 0 || q.a >= q.o.length || !isStr(q.why)) err(w, `quiz[${i}] malformed (needs q, o[], a index, why)`);
  });
  const answers = (l.quiz || []).map((q) => q.a);
  if (answers.length >= 4 && new Set(answers).size === 1) warn(w, 'every quiz answer is the same option index Ã¢â‚¬â€ vary the correct position');
  if (!l.task || !isStr(l.task.title) || !Array.isArray(l.task.steps) || !l.task.steps.length) err(w, 'needs task {title, steps[]}');
}

async function checkFile(file) {
  const name = path.basename(file);
  let mod;
  try { mod = (await import(pathToFileURL(file).href + '?t=' + Date.now())).default; } catch (e) { return err(name, `cannot import: ${e.message}`); }
  if (!mod) return err(name, 'no default export');
  if (name === 'glossary.js') {
    if (!Array.isArray(mod)) return err(name, 'glossary must export an array');
    mod.forEach((g, i) => { if (!isStr(g.term) || !isStr(g.simple)) err(name, `entry ${i} needs term + simple`); claim('g:' + g.term?.toLowerCase(), name); });
    return;
  }
  if (name === 'practice.js') {
    for (const c of mod.sql || []) await checkSqlChallenge(`${name} sql "${c.id}"`, c);
    for (const c of mod.python || []) checkPyChallenge(`${name} python "${c.id}"`, c);
    for (const c of [...(mod.sql || []), ...(mod.python || [])]) { if (!isStr(c.title)) err(name, `${c.id} needs title`); if (!['easy', 'medium', 'hard'].includes(c.level)) err(name, `${c.id} level must be easy|medium|hard`); }
    return;
  }
  if (name === 'interview.js') {
    for (const s of mod.systemDesign || []) { claim(s.id, name); if (s.blocks) await checkBlocks(`${name} design "${s.id}"`, s.blocks); }
    for (const s of mod.star || []) claim(s.id, name);
    if (mod.blocks) await checkBlocks(`${name}`, mod.blocks);
    return;
  }
  if (mod.modules) {
    if (!Array.isArray(mod.modules)) err(name, 'modules must be an array');
    for (const m of mod.modules) {
      claim(m.id, `${name} module`);
      if (!isStr(m.title) || !Array.isArray(m.lessons) || !m.lessons.length) err(name, `module "${m.id}" needs title + lessons[]`);
      for (const l of m.lessons || []) await checkLesson(name, l);
    }
  }
  if (mod.project) {
    const p = mod.project; const w = `${name} project`;
    claim(p.id, w);
    for (const k of ['title', 'tagline', 'problem', 'resume']) if (!isStr(p[k])) err(w, `needs ${k}`);
    if (p.architecture) checkSketch(w + ' architecture', p.architecture); else err(w, 'needs architecture sketch');
    if (!Array.isArray(p.steps) || p.steps.length < 4) err(w, 'needs steps[] (>= 4)');
    for (const [i, s] of (p.steps || []).entries()) {
      if (!isStr(s.title) || !Array.isArray(s.checklist)) err(w, `step ${i} needs title + checklist[]`);
      if (s.blocks) await checkBlocks(`${w} step ${i}`, s.blocks);
    }
    if (!Array.isArray(p.dod) || !p.dod.length) err(w, 'needs dod[] (definition of done)');
  }
  if (mod.gate) {
    const g = mod.gate; const w = `${name} gate`;
    claim(g.id, w);
    if (!Array.isArray(g.titles) || !g.titles.length) err(w, 'needs titles[]');
    if (!Array.isArray(g.checklist)) err(w, 'needs checklist[]');
    if (g.blocks) await checkBlocks(w, g.blocks);
  }
}

// claim ids from the other content files too (cross-file duplicates), without running them
const others = [
  ...readdirSync(CONTENT).filter((f) => f.endsWith('.js') && !['index.js', 'meta.js'].includes(f)).map((f) => path.join(CONTENT, f)),
  ...readdirSync(path.join(CONTENT, 'phases')).filter((f) => f.endsWith('.js')).map((f) => path.join(CONTENT, 'phases', f)),
].filter((f) => !files.includes(f));
for (const f of others) {
  try {
    const mod = (await import(pathToFileURL(f).href)).default;
    for (const m of mod?.modules || []) { ids.set(m.id, path.basename(f)); for (const l of m.lessons || []) ids.set(l.id, path.basename(f)); }
    if (mod?.project?.id) ids.set(mod.project.id, path.basename(f));
    if (mod?.gate?.id) ids.set(mod.gate.id, path.basename(f));
  } catch { /* other agent's file may be mid-write */ }
}

for (const f of files) { console.log('checking', path.relative(ROOT, f)); await checkFile(f); }
for (const w of warnings) console.log(w);
for (const e of errors) console.log(e);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
