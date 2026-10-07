import { useRef, useState } from 'react';
import { useProgress } from '../lib/store';
import { ALL_LESSONS } from '../content/index.js';
import { useDocTitle, todayKey } from './shared';

export default function Settings() {
  useDocTitle('Settings');
  const { state, dispatch } = useProgress();
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fde-academy-progress-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg({ ok: true, text: 'Progress file downloaded. Keep it somewhere safe.' });
  };

  const importJson = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.done !== 'object') throw new Error('This does not look like an FDE Academy progress file.');
        if (!window.confirm('Replace your current progress with the contents of this file?')) return;
        dispatch({ type: 'import', data });
        setMsg({ ok: true, text: `Imported. ${Object.keys(data.done || {}).length} lessons marked done.` });
      } catch (err) { setMsg({ ok: false, text: `Could not import: ${err.message}` }); }
    };
    reader.onerror = () => setMsg({ ok: false, text: 'Could not read that file.' });
    reader.readAsText(f);
  };

  const reset = () => {
    if (window.confirm('Delete ALL your progress, notes, saved code and job tracker on this browser? This cannot be undone. (Export first if unsure.)')) {
      dispatch({ type: 'reset' });
      setMsg({ ok: true, text: 'Everything was reset.' });
    }
  };

  return (
    <div className="page narrow">
      <header className="page-head">
        <h1>Settings</h1>
        <p className="lead">Your progress lives only in this browser. Export it now and then so a cleared cache never costs you your progress. There is no schedule in this app: you move at your own pace.</p>
      </header>

      {msg && <div className={msg.ok ? 'verdict ok' : 'verdict bad'} role="status">{msg.text}</div>}

      <section className="card pad">
        <h2 className="h2">Back up or move your progress</h2>
        <p className="muted">One JSON file holds lessons done, quiz scores, notes, saved code, solved challenges, STAR stories and the job tracker.</p>
        <div className="row wrap">
          <button className="btn primary" onClick={exportJson}>⬇ Export progress</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Import progress</button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={importJson} hidden aria-label="Import progress file" />
        </div>
      </section>

      <section className="card pad danger">
        <h2 className="h2">Start over</h2>
        <p className="muted">Clears everything stored by this app in this browser. Lessons themselves are not affected.</p>
        <button className="btn danger-btn" onClick={reset}>Reset all progress</button>
      </section>

      <section className="card pad">
        <h2 className="h2">How this app works</h2>
        <ul className="plainlist">
          <li><strong>{ALL_LESSONS.length} lessons</strong> are loaded right now. New lessons appear in the sidebar as they are written.</li>
          <li><strong>SQL</strong> runs in your browser on a real PostgreSQL engine (PGlite) with fake finance data. No install, works offline.</li>
          <li><strong>Python</strong> runs in your browser with Pyodide. The first run downloads about 10 MB, so you need internet once.</li>
          <li><strong>Progress</strong> is saved in your browser's local storage. Different browser or device means a different copy, so use Export and Import to move it.</li>
          <li><strong>Docker:</strong> to run the whole app from a container use <code className="ic">docker compose up --build</code> and open http://localhost:8080.</li>
          <li><strong>Shortcuts:</strong> <kbd>Ctrl</kbd> + <kbd>K</kbd> searches lessons and glossary. <kbd>Ctrl</kbd> + <kbd>Enter</kbd> runs code in any editor.</li>
        </ul>
      </section>
    </div>
  );
}
