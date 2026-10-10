import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import rough from 'roughjs';
import { WEEKS, LESSONS, lessonById, lessonsOfWeek } from '../content/corporate-mitra/index.js';
import { useCm } from '../lib/cmStore';
import { useCmStatus, cmSearch, CM_SEARCH_HINT } from '../lib/cmTopBar';
import StudyTopBar, { QuickSearch, useShellChrome } from './StudyTopBar';
import { Ring } from '../pages/shared';

const gen = rough.generator();
const underlinePaths = () => gen.toPaths(gen.curve([[4, 8], [60, 4], [120, 9], [176, 5]], { stroke: '#e8590c', strokeWidth: 2.4, roughness: 1.2, seed: 21 }))
  .map((p, i) => <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill="none" strokeLinecap="round" />);

function Logo() {
  const underline = useMemo(underlinePaths, []);
  return (
    <Link to="/corporate-mitra" className="logo" aria-label="Corporate Mitra home">
      <span className="logo-t">Corporate Mitra</span>
      <svg className="logo-u" viewBox="0 0 180 14" aria-hidden>{underline}</svg>
      <span className="logo-sub">Clear notes for engineers who are new to finance, tax and accounts</span>
    </Link>
  );
}

function WeekNav({ week, open, onToggle, activeId, pathname }) {
  const { done } = useCm();
  const lessons = lessonsOfWeek(week.id);
  const n = lessons.filter((l) => done[l.id]).length;
  return (
    <li className={`sb-phase ${open ? 'open' : ''}`} style={{ '--pc': week.color, '--pt': week.tint }}>
      <div className={`sb-phase-row ${lessons.some((l) => l.id === activeId) ? 'here' : ''}`}>
        <button className="sb-phase-link cm-week-btn" onClick={onToggle} aria-expanded={open}>
          <Ring pct={lessons.length ? n / lessons.length : 0} color={week.color} size={24} stroke={3} label={`${n} of ${lessons.length} done`} />
          <span className="sb-phase-title"><span className="cm-week-l">{week.label}</span>{week.title}</span>
        </button>
        <button className="sb-caret" onClick={onToggle} aria-label={`${open ? 'Collapse' : 'Expand'} ${week.label}`}>{open ? '▾' : '▸'}</button>
      </div>
      {open && (
        <div className="sb-phase-body">
          {lessons.length === 0 && <div className="sb-soon">Lessons coming soon</div>}
          <ul>
            {lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/corporate-mitra/${l.id}`} className={`sb-lesson ${activeId === l.id ? 'active' : ''} ${done[l.id] ? 'done' : ''}`} aria-current={activeId === l.id ? 'page' : undefined}>
                  <span className="sb-tick" aria-hidden>{done[l.id] ? '✓' : ''}</span>
                  <span>{l.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function Sidebar({ pathname }) {
  const prefix = '/corporate-mitra/';
  const activeId = pathname.startsWith(prefix) ? decodeURIComponent(pathname.slice(prefix.length)) : null;
  const activeWeek = activeId ? lessonById[activeId]?.weekId : null;
  const [open, setOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cm-sb-open') || '{}'); } catch { return {}; }
  });
  useEffect(() => { if (activeWeek && !open[activeWeek]) setOpen((o) => ({ ...o, [activeWeek]: true })); }, [activeWeek]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { localStorage.setItem('cm-sb-open', JSON.stringify(open)); } catch { /* ignore */ } }, [open]);
  const navRef = useRef(null);
  useEffect(() => {
    navRef.current?.querySelector('.sb-lesson.active')?.scrollIntoView({ block: 'nearest' });
  }, [activeId, open]);

  return (
    <nav className="sb-inner" ref={navRef} aria-label="Corporate Mitra lessons">
      <Logo />
      <ul className="sb-nav">
        <li><NavLink to="/corporate-mitra" end className="sb-link"><span className="sb-ico" aria-hidden>🏠</span>Overview</NavLink></li>
      </ul>
      <div className="sb-head">The course · {LESSONS.length} lessons</div>
      <ul className="sb-phases cm-weeks">
        {WEEKS.map((w) => (
          <WeekNav key={w.id} week={w} open={!!open[w.id]} onToggle={() => setOpen({ ...open, [w.id]: !open[w.id] })} activeId={activeId} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

export default function CmShell({ children }) {
  const { pathname } = useLocation();
  const { drawer, setDrawer, search, setSearch } = useShellChrome(pathname);
  const status = useCmStatus();

  return (
    <div className="shell cm-shell">
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Course navigation">
        <button className="drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">✕</button>
        <Sidebar pathname={pathname} />
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden />}
      <div className="main-col">
        <StudyTopBar onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} logo={{ to: '/corporate-mitra', text: 'Corporate Mitra' }} homeTo="/corporate-mitra" status={status} />
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
      {search && (
        <QuickSearch onClose={() => setSearch(false)} search={cmSearch} label="Search Corporate Mitra lessons and terms" placeholder="Search lessons, weeks, terms…" hint={CM_SEARCH_HINT} />
      )}
    </div>
  );
}
