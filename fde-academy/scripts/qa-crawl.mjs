// Real-browser QA for one phase: opens every lesson, runs EVERY SQL and Python playground in the app (PGlite / Pyodide),
// and reports console errors, horizontal overflow at 1280 and 390 px, and empty sketches.
// The local validator cannot catch browser-only problems (for example Pyodide has no hashlib.pbkdf2_hmac), so run this per phase.
//
// Setup once:   npm i --no-save playwright          (uses the Edge that ships with Windows, no browser download)
// Each run:     npm run build ; npx vite preview --port 4173      (in another terminal)
//               node scripts/qa-crawl.mjs foundations            (a whole phase)
//               node scripts/qa-crawl.mjs sql http://localhost:4173 sql-performance,sql-indexes-deep    (only some lessons)
// Needs internet the first time (Pyodide loads from a CDN).
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const phase = process.argv[2];
const base = process.argv[3] || 'http://localhost:4173';
if (!phase) { console.log('usage: node scripts/qa-crawl.mjs <phase-id> [base-url]'); process.exit(1); }
const only = process.argv[4] ? process.argv[4].split(',') : null;   // optional: crawl just these lesson ids, e.g. sql-performance,sql-indexes-deep
const ids = readdirSync(path.join(ROOT, 'src/content/phases', phase)).filter((f) => f.endsWith('.js') && f !== 'shared.js').map((f) => f.replace('.js', '')).filter((id) => !only || only.includes(id)).sort();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const problems = []; let pgTotal = 0;

for (const [label, vp] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await (await browser.newContext({ viewport: vp })).newPage();
  let cur = '';
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${label}] ${cur}: console.error ${m.text().slice(0, 140)}`); });
  page.on('pageerror', (e) => problems.push(`[${label}] ${cur}: pageerror ${e.message.slice(0, 140)}`));
  for (const id of ids) {
    cur = id;
    await page.goto(`${base}/#/lesson/${id}`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    if (!(await page.locator('h1').first().innerText().catch(() => ''))) problems.push(`[${label}] ${id}: no h1`);
    const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
    if (ov.s > ov.w + 1) problems.push(`[${label}] ${id}: horizontal overflow ${ov.s}>${ov.w}`);
    const sk = await page.locator('figure.sketch svg').evaluateAll((els) => els.map((e) => (e.querySelector('g') ? e.querySelector('g').childElementCount : 0)));
    if (sk.some((n) => n < 3)) problems.push(`[${label}] ${id}: a sketch drew nothing`);
    if (label !== 'desktop') continue;
    const pgs = page.locator('.playground');
    const n = await pgs.count();
    for (let i = 0; i < n; i++) {
      pgTotal++;
      const pg = pgs.nth(i);
      await pg.scrollIntoViewIfNeeded();
      const isPy = (await pg.locator('.pg-badge').first().innerText()).toLowerCase().includes('python');
      await pg.getByRole('button', { name: /▶ Run/ }).click();
      try {
        await page.waitForFunction((idx) => {
          const el = document.querySelectorAll('.playground')[idx];
          const btn = el.querySelector('.btn.primary');
          return btn && !btn.disabled && /Run/.test(btn.innerText) && el.querySelector('.pg-out, pre.console, .error');
        }, i, { timeout: 90000 });
        const bad = await pg.locator('.error, pre.console.bad').count();
        if (bad) problems.push(`[desktop] ${id}: ${isPy ? 'Python' : 'SQL'} playground #${i + 1} failed: ${(await pg.locator('.error, pre.console.bad').first().innerText()).slice(-200).replace(/\n/g, ' ')}`);
      } catch { problems.push(`[desktop] ${id}: playground #${i + 1} timed out`); }
    }
    console.log(`${id.padEnd(48)} playgrounds ${n}, sketches ${sk.length}`);
  }
  await page.context().close();
}
console.log(`\n${ids.length} lessons, ${pgTotal} playgrounds executed in the browser`);
console.log(problems.length ? '\nPROBLEMS:\n' + problems.join('\n') : '\nno problems found');
await browser.close();
process.exit(problems.length ? 1 : 0);
