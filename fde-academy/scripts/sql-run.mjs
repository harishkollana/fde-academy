// Runs SQL against the same seeded PostgreSQL (PGlite) that the playgrounds use, and prints every result set.
// Use it to CHECK any number you quote in a lesson (row counts, totals, which rows are bad) instead of trusting memory.
// Usage:  node scripts/sql-run.mjs "SELECT count(*) FROM orders"
//         node scripts/sql-run.mjs @path/to/file.sql        (a leading @ means "read the SQL from this file")
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { PGlite } = await import(pathToFileURL(path.join(ROOT, 'node_modules/@electric-sql/pglite/dist/index.js')).href);
const db = new PGlite();
await db.exec(readFileSync(path.join(ROOT, 'src/data/seed.sql'), 'utf8'));
let sql = process.argv[2] || '';
if (sql.startsWith('@')) sql = readFileSync(sql.slice(1), 'utf8');
sql = sql.replace(/^﻿/, '');
try {
  for (const r of await db.exec(sql)) {
    if (!r.fields.length) continue;
    console.log(r.fields.map((f) => f.name).join(' | '));
    r.rows.slice(0, 40).forEach((row) => console.log(Object.values(row).map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)).join(' | ')));
    console.log(`(${r.rows.length} rows)\n`);
  }
} catch (e) { console.log('SQL ERROR:', e.message); }
await db.close();
