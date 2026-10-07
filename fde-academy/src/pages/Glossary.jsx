import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GLOSSARY from '../content/glossary.js';
import { PHASES, phaseById } from '../content/index.js';
import { Empty, useDocTitle, seededShuffle } from './shared';
import { Inline } from '../components/Md';

// Glossary entries name their phase by id, e.g. { term: 'Idempotency', phase: 'foundations', ... }.
const letterOf = (t) => { const c = String(t).trim().charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };

function Flashcards({ cards }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [order, setOrder] = useState(0);
  const deck = useMemo(() => (order ? seededShuffle(cards, `deck-${order}`) : cards), [cards, order]);
  useEffect(() => { setI(0); setFlip(false); }, [cards]);
  const card = deck[Math.min(i, deck.length - 1)];
  const go = (d) => { setFlip(false); setI((x) => (x + d + deck.length) % deck.length); };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlip((f) => !f); }
  };
  if (!card) return <Empty icon="🃏" title="No cards match these filters." />;
  return (
    <div className="flash" onKeyDown={onKey}>
      <button className={`flipcard ${flip ? 'flipped' : ''}`} onClick={() => setFlip(!flip)} aria-label={flip ? 'Showing the meaning. Click to show the term' : 'Showing the term. Click to show the meaning'}>
        {!flip
          ? <><span className="fc-lbl">term</span><span className="fc-term">{card.term}</span><span className="fc-hint muted small">click, or press space, to flip</span></>
          : <><span className="fc-lbl">meaning</span><span className="fc-def"><Inline text={card.simple || ''} /></span>{card.example && <span className="fc-ex"><Inline text={`e.g. ${card.example}`} /></span>}</>}
      </button>
      <div className="flash-bar">
        <button className="btn" onClick={() => go(-1)}>← Prev</button>
        <span className="muted small">{Math.min(i, deck.length - 1) + 1} / {deck.length}</span>
        <button className="btn" onClick={() => go(1)}>Next →</button>
        <span className="spacer" />
        <button className="btn-mini" onClick={() => { setOrder(order + 1); setI(0); setFlip(false); }}>shuffle</button>
        {order > 0 && <button className="btn-mini" onClick={() => { setOrder(0); setI(0); setFlip(false); }}>A–Z order</button>}
      </div>
    </div>
  );
}

export default function Glossary() {
  useDocTitle('Glossary');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [phase, setPhase] = useState('all');
  const [mode, setMode] = useState('list');
  const terms = useMemo(() => (Array.isArray(GLOSSARY) ? GLOSSARY.filter((g) => g && g.term) : []).slice().sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' })), []);
  const s = q.trim().toLowerCase();
  const list = useMemo(
    () => terms.filter((g) => (phase === 'all' || g.phase === phase) && (!s || `${g.term} ${g.simple || ''}`.toLowerCase().includes(s))),
    [terms, phase, s],
  );
  const groups = useMemo(() => {
    const m = new Map();
    list.forEach((g) => { const l = letterOf(g.term); if (!m.has(l)) m.set(l, []); m.get(l).push(g); });
    return [...m.entries()];
  }, [list]);

  return (
    <div className="page glossary">
      <header className="page-head">
        <h1>📖 Glossary</h1>
        <p className="lead">Every term in plain English. If a word in a lesson sounds like jargon, it is probably here.</p>
      </header>

      {terms.length === 0 ? <Empty icon="✏️" title="The glossary is still being written." /> : (
        <>
          <div className="filters">
            <input className="mono-in grow" type="search" value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} placeholder="Search terms and meanings…" aria-label="Search the glossary" />
            <select className="mono-in" value={phase} onChange={(e) => setPhase(e.target.value)} aria-label="Phase">
              <option value="all">All phases</option>
              {PHASES.map((p) => <option key={p.id} value={p.id}>Phase {p.num}: {p.short}</option>)}
            </select>
            <div className="chips" role="tablist" aria-label="View">
              <button role="tab" aria-selected={mode === 'list'} className={mode === 'list' ? 'chip on' : 'chip'} onClick={() => setMode('list')}>List</button>
              <button role="tab" aria-selected={mode === 'cards'} className={mode === 'cards' ? 'chip on' : 'chip'} onClick={() => setMode('cards')}>🃏 Flashcards</button>
            </div>
          </div>
          <p className="muted small">{list.length} of {terms.length} terms</p>

          {mode === 'cards' ? <Flashcards cards={list} /> : (
            <>
              {groups.length > 1 && (
                <nav className="az" aria-label="Jump to letter">
                  {groups.map(([l]) => <a key={l} href={`#g-${l}`} onClick={(e) => { e.preventDefault(); document.getElementById(`g-${l}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{l}</a>)}
                </nav>
              )}
              {list.length === 0 && <Empty icon="🔍" title="No terms match.">Try fewer letters, or clear the phase filter.</Empty>}
              {groups.map(([l, items]) => (
                <section key={l} id={`g-${l}`} className="gl-group">
                  <h2 className="gl-letter hand">{l}</h2>
                  <dl className="gl-list">
                    {items.map((g) => (
                      <div className="gl-item" key={g.term}>
                        <dt>{g.term}{phaseById[g.phase] && <span className="chip gl-ph" style={{ '--pc': phaseById[g.phase].color, '--pt': phaseById[g.phase].tint }}>{phaseById[g.phase].short}</span>}</dt>
                        <dd><Inline text={g.simple || ''} />{g.example && <div className="gl-ex muted"><Inline text={`Example: ${g.example}`} /></div>}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
