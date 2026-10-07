// In-browser PostgreSQL (PGlite). One "template" database is seeded once,
// dumped, and cloned for each playground so learners can never break the shared data.
import { PGlite } from '@electric-sql/pglite';
import seedSql from '../data/seed.sql?raw';

let templatePromise = null;
let graderPromise = null;

function template() {
  if (!templatePromise) {
    templatePromise = (async () => {
      const db = new PGlite();
      await db.exec(seedSql);
      const dump = await db.dumpDataDir('none');
      return { db, dump };
    })();
  }
  return templatePromise;
}

export async function newDb() {
  const { dump } = await template();
  const db = new PGlite({ loadDataDir: dump });
  await db.waitReady;
  return db;
}

async function grader() {
  if (!graderPromise) graderPromise = newDb();
  return graderPromise;
}

const clean = (v) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v && typeof v === 'object') return JSON.stringify(v);
  return v;
};

export function toResult(r) {
  const cols = (r.fields || []).map((f) => f.name);
  const rows = (r.rows || []).map((row) => cols.map((c) => clean(row[c])));
  return { cols, rows, affected: r.affectedRows };
}

export async function runSql(db, sql) {
  const t = performance.now();
  const results = await db.exec(sql);
  const ms = Math.round(performance.now() - t);
  return { results: results.map(toResult), ms };
}

const norm = (rows, ordered) => {
  const s = rows.map((r) => JSON.stringify(r.map((v) => (v === null ? null : typeof v === 'number' ? Math.round(v * 100) / 100 : isNaN(Number(v)) || v === '' ? String(v) : Math.round(Number(v) * 100) / 100))));
  return ordered ? s : [...s].sort();
};

// Compare learner query result with the solution result (values only; column names ignored).
export async function grade(userSql, solutionSql, { ordered = false } = {}) {
  const trimmed = userSql.trim().replace(/;\s*$/, '');
  if (!/^(select|with)\b/i.test(trimmed)) return { ok: false, msg: 'Challenges only accept a SELECT (or WITH … SELECT) query.' };
  if (/;\s*\S/.test(trimmed)) return { ok: false, msg: 'Please submit a single query (no extra statements).' };
  const db = await grader();
  let u, s;
  try { u = toResult(await db.query(trimmed)); } catch (e) { return { ok: false, msg: 'Your query has an error: ' + e.message }; }
  s = toResult(await db.query(solutionSql));
  if (u.cols.length !== s.cols.length) return { ok: false, msg: `Expected ${s.cols.length} column(s) but you returned ${u.cols.length}.`, user: u, expected: s };
  if (u.rows.length !== s.rows.length) return { ok: false, msg: `Expected ${s.rows.length} row(s) but you returned ${u.rows.length}.`, user: u, expected: s };
  const a = norm(u.rows, ordered), b = norm(s.rows, ordered);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return { ok: false, msg: ordered ? 'Values or the row ORDER do not match yet.' : 'Same shape, but some values differ.', user: u, expected: s };
  return { ok: true, msg: 'Correct! Your result matches exactly.', user: u };
}

export async function schema() {
  const { db } = await template();
  const r = await db.query(`select table_name, column_name, data_type from information_schema.columns where table_schema='public' order by table_name, ordinal_position`);
  const out = {};
  r.rows.forEach((x) => { (out[x.table_name] ||= []).push([x.column_name, x.data_type]); });
  return out;
}

export function warmup() { template(); }
