// In-browser Python (Pyodide, loaded from the jsDelivr CDN on first use).
import { CSV } from '../data/csv.js';

const VERSION = '0.29.5';
const BASE = import.meta.env.VITE_PYODIDE_BASE || `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
let pyPromise = null;

function loadScript(src) {
  return new Promise((res, rej) => {
    if (window.loadPyodide) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not download Python runtime (needs internet the first time).'));
    document.head.appendChild(s);
  });
}

export function getPy(onStatus = () => {}) {
  if (!pyPromise) {
    pyPromise = (async () => {
      onStatus('Downloading Python (≈10 MB, first time only)…');
      await loadScript(BASE + 'pyodide.js');
      const py = await window.loadPyodide({ indexURL: BASE });
      py.FS.mkdirTree('/data');
      for (const [name, text] of Object.entries(CSV)) py.FS.writeFile(`/data/${name}.csv`, text);
      py.FS.mkdirTree('/data/input');
      py.FS.writeFile('/data/input/sales_2026-08.csv', CSV.orders.split('\n').slice(0, 60).join('\n'));
      py.FS.writeFile('/data/input/sales_2026-09.csv', [CSV.orders.split('\n')[0], ...CSV.orders.split('\n').slice(60, 120)].join('\n'));
      py.FS.writeFile('/data/input/notes.txt', 'not a csv file');
      await py.runPythonAsync('import os; os.chdir("/data")');
      return py;
    })().catch((e) => { pyPromise = null; throw e; });
  }
  return pyPromise;
}

export async function runPy(code, { onStatus = () => {}, onOut = () => {}, importsFrom } = {}) {
  const py = await getPy(onStatus);
  let out = '';
  const push = (s) => { out += s + '\n'; onOut(out); };
  py.setStdout({ batched: push });
  py.setStderr({ batched: push });
  onStatus('Loading packages…');
  const scan = importsFrom || code;
  try {
    await py.loadPackagesFromImports(scan);
    // pandas looks for pyarrow only when it is FIRST imported. All playgrounds share one interpreter, so if pandas ran once
    // without pyarrow, Parquet and Arrow dtypes stay broken until the page is reloaded. Load pyarrow together with pandas.
    if (/^\s*(import|from)\s+pandas\b/m.test(scan)) await py.loadPackage('pyarrow');
  } catch { /* ignore; error will show on run */ }
  onStatus('Running…');
  const t = performance.now();
  try {
    const r = await py.runPythonAsync(code);
    if (r !== undefined && r !== null) {
      let shown;
      try { shown = r.toString(); } catch { shown = String(r); }
      if (r?.destroy) r.destroy();
      push(shown);
    }
    return { ok: true, out, ms: Math.round(performance.now() - t) };
  } catch (e) {
    const msg = String(e.message || e).split('\n').filter((l) => !l.includes('/lib/python') && !l.includes('_pyodide')).join('\n');
    push(msg);
    return { ok: false, out, ms: Math.round(performance.now() - t) };
  }
}

// Runs learner code then the hidden test code (asserts) in a fresh namespace.
export async function testPy(code, tests, opts = {}) {
  const wrapped = `
__ns = {}
exec(compile(${JSON.stringify(code)}, "your_code.py", "exec"), __ns)
exec(compile(${JSON.stringify(tests)}, "tests.py", "exec"), __ns)
print("ALL_TESTS_PASSED")
`;
  const r = await runPy(wrapped, { ...opts, importsFrom: code + '\n' + tests });
  return { ...r, ok: r.ok && r.out.includes('ALL_TESTS_PASSED'), out: r.out.replace('ALL_TESTS_PASSED\n', '') };
}
