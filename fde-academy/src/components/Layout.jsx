import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import rough from 'roughjs';
import { PHASES, STAGE_GROUPS, ALL_LESSONS, lessonById, plannedLessonCount } from '../content/index.js';
import GLOSSARY from '../content/glossary.js';
import { useProgress, streak, level } from '../lib/store';
import { Ring, phaseProgress } from '../pages/shared';

const gen = rough.generator();
const roughEls = (drawable, key) => gen.toPaths(drawable).map((p, i) => (
  <path key={`${key}${i}`} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill || 'none'} strokeLinecap="round" />
));

const NAV = [
  ['/', '🗺️', 'Dashboard'],
  ['/practice', '🎯', 'Practice'],
  ['/sandbox', '🧪', 'Sandbox'],
  ['/interview', '🎤', 'Interview'],
  ['/glossary', '📖', 'Glossary'],
  ['/settings', '⚙️', 'Settings'],
];

function Logo() {
  const underline = useMemo(() => roughEls(gen.curve([[4, 8], [60, 4], [120, 9], [176, 5]], { stroke: '#e8590c', strokeWidth: 2.4, roughness: 1.2, seed: 11 }), 'u'), []);
  return (
    <Link to="/" className="logo" aria-label="FDE Academy home">
      <span className="logo-t">FDE Academy</span>
      <svg className="logo-u" viewBox="0 0 180 14" aria-hidden>{underline}</svg>
      <span className="logo-sub">The road to Forward Deployed Engineer, at your own pace</span>
    </Link>
  );
}

function PhaseNav({ phase, open, onToggle, activeLesson, pathname }) {
  const { state } = useProgress();
  const prog = phaseProgress(phase, state);
  const here = pathname === `/phase/${phase.id}`;
  return (
    <li className={`sb-phase ${open ? 'open' : ''}`} style={{ '--pc': phase.color, '--pt': phase.tint }}>
      <div className={`sb-phase-row ${here ? 'here' : ''}`}>
        <Link to={`/phase/${phase.id}`} className="sb-phase-link">
          <Ring pct={prog.pct} color={phase.color} size={24} stroke={3} label={`${Math.round(prog.pct * 100)}% done`} />
          <span className="sb-phase-num">{phase.num}</span>
          <span className="sb-phase-title">{phase.short}</span>
        </Link>
        <button className="sb-caret" onClick={onToggle} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} phase ${phase.num}`}>{open ? '▾' : '▸'}</button>
      </div>
      {open && (
        <div className="sb-phase-body">
          {phase.modules.length === 0 && <div className="sb-soon">Lessons coming soon{plannedLessonCount(phase) ? ` · ${plannedLessonCount(phase)} planned` : ''}</div>}
          {phase.modules.map((m) => (
            <div key={m.id} className="sb-mod">
              <div className="sb-mod-t">{m.title}</div>
              <ul>
                {(m.lessons || []).map((l) => {
                  const done = !!state.done[l.id];
                  return (
                    <li key={l.id}>
                      <Link to={`/lesson/${l.id}`} className={`sb-lesson ${activeLesson === l.id ? 'active' : ''} ${done ? 'done' : ''}`} aria-current={activeLesson === l.id ? 'page' : undefined}>
                        <span className="sb-tick" aria-hidden>{done ? '✓' : ''}</span>
                        <span>{l.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {(phase.projectName || phase.gateLetter) && (
            <div className="sb-extra">
              {phase.projectName && <NavLink to={`/project/${phase.id}`} className="sb-extra-link">🧱 Project</NavLink>}
              {phase.gateLetter && <NavLink to={`/gate/${phase.id}`} className="sb-extra-link">🚩 Gate {phase.gateLetter}</NavLink>}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Sidebar({ pathname }) {
  const activeLesson = pathname.startsWith('/lesson/') ? decodeURIComponent(pathname.slice(8)) : null;
  const routePhase = activeLesson ? lessonById[activeLesson]?.phaseId : (pathname.match(/^\/(?:phase|project|gate)\/([^/]+)/) || [])[1];
  const [open, setOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fde-sb-open') || '{}'); } catch { return {}; }
  });
  useEffect(() => { if (routePhase && !open[routePhase]) setOpen((o) => ({ ...o, [routePhase]: true })); }, [routePhase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { localStorage.setItem('fde-sb-open', JSON.stringify(open)); } catch { /* ignore */ } }, [open]);
  const navRef = useRef(null);
  useEffect(() => {
    const el = navRef.current?.querySelector('.sb-lesson.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeLesson, open]);

  return (
    <nav className="sb-inner" ref={navRef} aria-label="Main">
      <Logo />
      <ul className="sb-nav">
        {NAV.map(([to, ico, label]) => (
          <li key={to}><NavLink to={to} end={to === '/'} className="sb-link"><span className="sb-ico" aria-hidden>{ico}</span>{label}</NavLink></li>
        ))}
      </ul>
      <div className="sb-head">The journey · {PHASES.filter((p) => !p.optional).length} phases</div>
      {STAGE_GROUPS.map((s) => (
        <div key={s.id} className="sb-stage" style={{ '--sc': s.color }}>
          <div className="sb-stage-t"><i aria-hidden />{s.num !== null ? `Stage ${s.num} · ` : ''}{s.title}</div>
          <ul className="sb-phases">
            {s.phases.map((p) => (
              <PhaseNav key={p.id} phase={p} open={!!open[p.id]} onToggle={() => setOpen({ ...open, [p.id]: !open[p.id] })} activeLesson={activeLesson} pathname={pathname} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ---------- Quick search (Ctrl/⌘ + K) ----------
const PAGES = NAV.map(([to, ico, label]) => ({ kind: 'page', to, title: label, sub: 'Page', ico }));

function useSearch(q) {
  return useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const words = s.split(/\s+/);
    const hit = (text) => words.every((w) => text.includes(w));
    const out = [];
    PAGES.forEach((p) => { if (hit(p.title.toLowerCase())) out.push({ ...p, score: 3 }); });
    PHASES.forEach((p) => {
      if (hit(`phase ${p.num} ${p.title} ${p.short}`.toLowerCase())) out.push({ kind: 'phase', to: `/phase/${p.id}`, title: `Phase ${p.num}: ${p.title}`, sub: p.stageTitle, ico: p.emoji, score: 2 });
    });
    ALL_LESSONS.forEach((l) => {
      const t = l.title.toLowerCase();
      const hay = `${t} ${l.moduleTitle} ${(l.roadmap || []).join(' ')}`.toLowerCase();
      if (hit(hay)) out.push({ kind: 'lesson', to: `/lesson/${l.id}`, title: l.title, sub: `${l.phase.emoji} ${l.moduleTitle}`, ico: '📄', score: hit(t) ? 2.5 : 1 });
    });
    (Array.isArray(GLOSSARY) ? GLOSSARY : []).forEach((g) => {
      if (hit(`${g.term} ${g.simple || ''}`.toLowerCase())) out.push({ kind: 'term', to: `/glossary?q=${encodeURIComponent(g.term)}`, title: g.term, sub: g.simple, ico: '📖', score: g.term.toLowerCase().includes(s) ? 2.2 : 0.8 });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 14);
  }, [q]);
}

function QuickSearch({ onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const results = useSearch(q);
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
      <div className="qs" role="dialog" aria-modal="true" aria-label="Search lessons and glossary">
        <div className="qs-bar">
          <span aria-hidden>🔎</span>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search lessons, phases, glossary terms…"
            role="combobox" aria-expanded={results.length > 0} aria-controls="qs-list" aria-activedescendant={results[sel] ? `qs-${sel}` : undefined} />
          <kbd>Esc</kbd>
        </div>
        <ul className="qs-list" id="qs-list" role="listbox" ref={listRef}>
          {!q.trim() && <li className="qs-hint">Type to search. Try “left join”, “GSTIN”, “docker” or “phase 4”.</li>}
          {q.trim() && results.length === 0 && <li className="qs-hint">Nothing matches “{q}”. Lessons may still be on their way.</li>}
          {results.map((r, i) => (
            <li key={r.kind + r.to} id={`qs-${i}`} role="option" aria-selected={i === sel} className={`qs-item ${i === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => go(r)}>
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

function TopBar({ onMenu, onSearch }) {
  const { state } = useProgress();
  const lv = level(state.xp);
  const st = streak(state.activity);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Open menu">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M3 6.5h18M3 12h18M3 17.5h18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      </button>
      <Link to="/" className="top-logo">FDE Academy</Link>
      <button className="search-btn" onClick={onSearch}>
        <span aria-hidden>🔎</span><span className="search-ph">Search lessons and terms</span><kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <span className="spacer" />
      <Link to="/" className="xp-pill" title={lv.next ? `${lv.next - state.xp} XP to ${lv.nextName}` : 'Top level reached'}>
        <span className="xp-n">{state.xp}</span><span className="xp-u">XP</span><span className="xp-lv">{lv.name}</span>
      </Link>
      <span className={`streak-pill ${st ? 'on' : ''}`} title={st ? `${st}-day streak` : 'Earn XP today to start a streak'}>🔥 {st}</span>
    </header>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
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
  }, [drawer, search]);

  return (
    <div className="shell">
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Course navigation">
        <button className="drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">✕</button>
        <Sidebar pathname={pathname} />
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden />}
      <div className="main-col">
        <TopBar onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
      {search && <QuickSearch onClose={() => setSearch(false)} />}
    </div>
  );
}
