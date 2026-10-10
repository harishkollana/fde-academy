import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// The top bar and Ctrl/⌘ + K search that all three shells (FDE, MBA + ACCA, Corporate Mitra) share.
// Each shell passes its own search function, its own XP / level / streak and its own logo link;
// the look comes from the .topbar, .search-btn, .xp-pill, .streak-pill and .qs-* rules in styles.css.

// Drawer and search state, the Ctrl/⌘ + K and Escape keys, and the scroll lock behind an open drawer or search.
export function useShellChrome(pathname) {
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => { setDrawer(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s); }
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', drawer || search);
    return () => document.body.classList.remove('no-scroll');
  }, [drawer, search]);
  return { drawer, setDrawer, search, setSearch };
}

// `search` must be a stable function (q) => [{ kind, to, title, sub, ico, score }], best first.
export function QuickSearch({ onClose, search, label, placeholder, hint, emptyNote = '' }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const results = useMemo(() => (q.trim() ? search(q) : []), [q, search]);
  const nav = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector('.qs-item.sel')?.scrollIntoView({ block: 'nearest' }); }, [sel]);
  const go = (r) => { if (!r) return; nav(r.to); onClose(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };
  return (
    <div className="qs-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qs" role="dialog" aria-modal="true" aria-label={label}>
        <div className="qs-bar">
          <span aria-hidden>🔎</span>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={placeholder}
            role="combobox" aria-expanded={results.length > 0} aria-controls="qs-list" aria-activedescendant={results[sel] ? `qs-${sel}` : undefined} />
          <kbd>Esc</kbd>
        </div>
        <ul className="qs-list" id="qs-list" role="listbox" ref={listRef}>
          {!q.trim() && <li className="qs-hint">{hint}</li>}
          {q.trim() && results.length === 0 && <li className="qs-hint">Nothing matches “{q}”.{emptyNote}</li>}
          {results.map((r, i) => (
            <li key={r.kind + r.to + r.title + i} id={`qs-${i}`} role="option" aria-selected={i === sel} className={`qs-item ${i === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => go(r)}>
              <span className="qs-ico" aria-hidden>{r.ico}</span>
              <span className="qs-txt"><span className="qs-title">{r.title}</span>{r.sub && <span className="qs-sub">{r.sub}</span>}</span>
              <span className="qs-kind">{r.kind}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// logo = { to, text }: shown beside the menu button on small screens only (the sidebar has the logo on wide ones).
// status = { xp, lv, streak }, lv as returned by level() / levelOf(); homeTo is where the XP pill leads.
export default function StudyTopBar({ onMenu, onSearch, logo, homeTo, status, placeholder = 'Search lessons and terms' }) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const { xp, lv, streak } = status;
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Open menu">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M3 6.5h18M3 12h18M3 17.5h18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      </button>
      <Link to={logo.to} className="top-logo">{logo.text}</Link>
      <button className="search-btn" onClick={onSearch}>
        <span aria-hidden>🔎</span><span className="search-ph">{placeholder}</span><kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <span className="spacer" />
      <Link to={homeTo} className="xp-pill" title={lv.next ? `${lv.next - xp} XP to ${lv.nextName}` : 'Top level reached'}>
        <span className="xp-n">{xp}</span><span className="xp-u">XP</span><span className="xp-lv">{lv.name}</span>
      </Link>
      <span className={`streak-pill ${streak ? 'on' : ''}`} title={streak ? `${streak}-day streak` : 'Earn XP today to start a streak'}>🔥 {streak}</span>
    </header>
  );
}
