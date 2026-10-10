import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import rough from 'roughjs';
import { PROGRAMME, SUBJECTS, lessonsOfModule, lessonPath, lessonRef } from '../content/mba/sem1.js';
import { useMba, lessonKey } from '../lib/mbaStore';
import { useMbaStatus, mbaSearch, MBA_SEARCH_HINT } from '../lib/mbaTopBar';
import StudyTopBar, { QuickSearch, useShellChrome } from './StudyTopBar';

const NAV = [
  ['/mba-acca', '📅', 'Important Dates'],
  ['/mba-acca/assessment', '📝', 'Assessment'],
];

// The hand-drawn orange stroke under the logo, same as the FDE and Corporate Mitra shells.
const gen = rough.generator();
const underlinePaths = () => gen.toPaths(gen.curve([[4, 8], [60, 4], [120, 9], [176, 5]], { stroke: '#e8590c', strokeWidth: 2.4, roughness: 1.2, seed: 31 }))
  .map((p, i) => <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill="none" strokeLinecap="round" />);

// Same look as the FDE sidebar: a lesson is a link, the little box only shows whether it is done.
// Lessons are completed on the lesson page, after its quiz, never from here.
function ModuleNav({ subjectId, module, index, open, onToggle, activeNo }) {
  const { done } = useMba();
  const lessons = lessonsOfModule(module);
  const n = lessons.filter((l) => done[lessonKey(subjectId, l.no)]).length;
  return (
    <div className="sb-mod">
      <button type="button" className="mc-sb-mod-t" onClick={onToggle} aria-expanded={open}>
        <span aria-hidden>{open ? '▾' : '▸'}</span>
        <span>Module {index + 1} · {module.title}</span>
        <span className={`mc-sb-n ${n === lessons.length ? 'all' : ''}`} aria-label={`${n} of ${lessons.length} lessons done`}>{n}/{lessons.length}</span>
      </button>
      {open && (
        <ul>
          {lessons.map((l) => {
            const isDone = !!done[lessonKey(subjectId, l.no)];
            const active = activeNo === l.no;
            return (
              <li key={l.no}>
                <Link to={lessonPath(subjectId, l.no)} className={`sb-lesson ${active ? 'active' : ''} ${isDone ? 'done' : ''}`} aria-current={active ? 'page' : undefined}>
                  <span className="sb-tick" aria-hidden>{isDone ? '✓' : ''}</span>
                  <span><span className="mc-sb-no">{l.no}</span> {l.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SubjectNav({ subject, open, onToggle, openMods, onToggleMod, pathname, activeNo }) {
  const base = `/mba-acca/subjects/${subject.id}`;
  const here = pathname === base || pathname.startsWith(`${base}/`);
  return (
    <li className={`sb-phase ${open ? 'open' : ''}`} style={{ '--pc': 'var(--accent)', '--pt': 'var(--hl)' }}>
      <div className={`sb-phase-row ${here ? 'here' : ''}`}>
        <NavLink to={`/mba-acca/subjects/${subject.id}`} className="sb-phase-link">
          <span className="sb-ico" aria-hidden>{subject.ico}</span>
          <span className="sb-phase-title">{subject.title}</span>
        </NavLink>
        <button className="sb-caret" onClick={onToggle} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${subject.title}`}>{open ? '▾' : '▸'}</button>
      </div>
      {open && (
        <div className="sb-phase-body">
          {subject.modules.map((m, i) => (
            <ModuleNav key={m.title} subjectId={subject.id} module={m} index={i} open={!!openMods[`${subject.id}:${i}`]} onToggle={() => onToggleMod(`${subject.id}:${i}`)} activeNo={activeNo} />
          ))}
        </div>
      )}
    </li>
  );
}

function Sidebar({ pathname }) {
  const routeSubject = (pathname.match(/^\/mba-acca\/subjects\/([^/]+)/) || [])[1];
  const [open, setOpen] = useState(() => (routeSubject ? { [routeSubject]: true } : {}));
  useEffect(() => { if (routeSubject) setOpen((o) => (o[routeSubject] ? o : { ...o, [routeSubject]: true })); }, [routeSubject]);
  const [openMods, setOpenMods] = useState({});
  const toggleMod = (key) => setOpenMods((o) => ({ ...o, [key]: !o[key] }));
  // On a lesson page, open that lesson's module and scroll the lesson into view.
  const m = pathname.match(/^\/mba-acca\/subjects\/([^/]+)\/lessons\/([^/]+)/);
  const activeNo = m ? m[2] : null;
  const activeRef = m ? lessonRef(m[1], m[2]) : null;
  const activeModKey = activeRef ? `${m[1]}:${activeRef.moduleIndex}` : null;
  useEffect(() => { if (activeModKey) setOpenMods((o) => (o[activeModKey] ? o : { ...o, [activeModKey]: true })); }, [activeModKey]);
  const underline = useMemo(underlinePaths, []);
  const navRef = useRef(null);
  const activeShown = !!(activeModKey && open[m[1]] && openMods[activeModKey]);
  useEffect(() => { if (activeShown) navRef.current?.querySelector('.sb-lesson.active')?.scrollIntoView({ block: 'nearest' }); }, [activeNo, activeShown]);
  return (
    <nav className="sb-inner" ref={navRef} aria-label="MBA + ACCA">
      <div className="logo">
        <span className="logo-t">MBA + ACCA</span>
        <svg className="logo-u" viewBox="0 0 180 14" aria-hidden>{underline}</svg>
      </div>
      <ul className="sb-nav">
        {NAV.map(([to, ico, label]) => (
          <li key={to}><NavLink to={to} end className="sb-link"><span className="sb-ico" aria-hidden>{ico}</span>{label}</NavLink></li>
        ))}
      </ul>
      <div className="sb-head">{PROGRAMME.semShort} · Subjects · {SUBJECTS.length}</div>
      <ul className="sb-phases">
        {SUBJECTS.map((s) => (
          <SubjectNav key={s.id} subject={s} open={!!open[s.id]} onToggle={() => setOpen({ ...open, [s.id]: !open[s.id] })} openMods={openMods} onToggleMod={toggleMod} pathname={pathname} activeNo={m && m[1] === s.id ? activeNo : null} />
        ))}
      </ul>
    </nav>
  );
}

export default function McaShell({ children }) {
  const { pathname } = useLocation();
  const { drawer, setDrawer, search, setSearch } = useShellChrome(pathname);
  const status = useMbaStatus();

  return (
    <div className="shell">
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="MBA + ACCA navigation">
        <button className="drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">✕</button>
        <Sidebar pathname={pathname} />
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden />}
      <div className="main-col">
        <StudyTopBar onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} logo={{ to: '/mba-acca', text: 'MBA + ACCA' }} homeTo="/mba-acca" status={status} placeholder="Search lessons and dates" />
        <main id="main" className="main" tabIndex={-1}>{children}</main>
      </div>
      {search && (
        <QuickSearch onClose={() => setSearch(false)} search={mbaSearch} label="Search MBA + ACCA lessons and dates" placeholder="Search lessons, subjects, dates…" hint={MBA_SEARCH_HINT} />
      )}
    </div>
  );
}
