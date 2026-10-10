import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import rough from 'roughjs';
import { PHASES, STAGE_GROUPS, ALL_LESSONS, lessonById, plannedLessonCount } from '../content/index.js';
import GLOSSARY from '../content/glossary.js';
import { useProgress, streak, level } from '../lib/store';
import { Ring, phaseProgress } from '../pages/shared';
import McaShell from './McaShell';
import CmShell from './CmShell';
import StudyTopBar, { QuickSearch, useShellChrome } from './StudyTopBar';

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
];

function Logo() {
  const underline = useMemo(() => roughEls(gen.curve([[4, 8], [60, 4], [120, 9], [176, 5]], { stroke: '#e8590c', strokeWidth: 2.4, roughness: 1.2, seed: 11 }), 'u'), []);
  return (
    <Link to="/" className="logo" aria-label="FDE home">
      <span className="logo-t">FDE</span>
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
const PAGES = [...NAV, ['/settings', '⚙️', 'Settings']].map(([to, ico, label]) => ({ kind: 'page', to, title: label, sub: 'Page', ico }));

function fdeSearch(q) {
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
}

function FdeTopBar({ onMenu, onSearch }) {
  const { state } = useProgress();
  return <StudyTopBar onMenu={onMenu} onSearch={onSearch} logo={{ to: '/', text: 'FDE' }} homeTo="/" status={{ xp: state.xp, lv: level(state.xp), streak: streak(state.activity) }} />;
}

function FdeShell({ children }) {
  const { pathname } = useLocation();
  const { drawer, setDrawer, search, setSearch } = useShellChrome(pathname);

  return (
    <div className="shell">
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Course navigation">
        <button className="drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">✕</button>
        <Sidebar pathname={pathname} />
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden />}
      <div className="main-col">
        <FdeTopBar onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
      {search && (
        <QuickSearch onClose={() => setSearch(false)} search={fdeSearch} label="Search lessons and glossary" placeholder="Search lessons, phases, glossary terms…"
          hint="Type to search. Try “left join”, “GSTIN”, “docker” or “phase 4”." emptyNote=" Lessons may still be on their way." />
      )}
    </div>
  );
}

// ---------- Site tabs (top of every page) ----------
export const SITE_TABS = [
  { id: 'fde', label: 'FDE', to: '/' },
  { id: 'mba-acca', label: 'MBA + ACCA', to: '/mba-acca' },
  { id: 'corporate-mitra', label: 'Corporate Mitra', to: '/corporate-mitra' },
  { id: 'settings', label: '⚙️ Settings', to: '/settings' },
];

export const sectionOf = (pathname) => SITE_TABS.find((t) => t.id !== 'fde' && (pathname === t.to || pathname.startsWith(`${t.to}/`)))?.id || 'fde';

function SiteTabs({ current }) {
  return (
    <nav className="site-tabs" aria-label="Sections">
      {SITE_TABS.map((t) => (
        <Link key={t.id} to={t.to} className={`site-tab ${current === t.id ? 'active' : ''}`} aria-current={current === t.id ? 'page' : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}

// Site-wide pages (Settings) have no sidebar: they belong to no single domain.
function SoloShell({ children }) {
  return (
    <div className="solo-shell">
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <main id="main" className="main solo" tabIndex={-1}>{children}</main>
    </div>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const current = sectionOf(pathname);
  return (
    <>
      <SiteTabs current={current} />
      {current === 'settings' && <SoloShell>{children}</SoloShell>}
      {current === 'fde' && <FdeShell>{children}</FdeShell>}
      {current === 'corporate-mitra' && <CmShell>{children}</CmShell>}
      {current === 'mba-acca' && <McaShell>{children}</McaShell>}
    </>
  );
}
