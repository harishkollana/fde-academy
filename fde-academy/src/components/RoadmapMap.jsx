import { useEffect, useMemo, useRef, useState } from 'react';
import rough from 'roughjs';
import { PHASES, STAGES } from '../content/index.js';
import { useProgress } from '../lib/store';
import { phaseProgress, checklistProgress, phaseComplete, gateOpen } from '../pages/shared';

/*
  The hand-drawn road from Day 1 to an FDE offer, one station per main phase (the optional extended track is not on the road).
  Stations are laid out row by row, snaking left-to-right then right-to-left, joined by a Catmull-Rom curve.
  The road is parametrised by `u` (control-point index + fraction of that segment): station k sits at u = stationU[k],
  and phase k owns the stretch from the midpoint with its previous station to the midpoint with its next one.
  That stretch is painted in the stage colour as lessons get done. "You are here" sits in the first phase you have not finished,
  part-way along its stretch by how many of its lessons are done. There is no calendar: the road only moves when you do.
*/

const INK = '#1f2a44';
const gen = rough.generator();
const R = (drawable, key, extra = {}) => gen.toPaths(drawable).map((p, i) => (
  <path key={`${key}-${i}`} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill || 'none'} strokeLinecap="round" strokeLinejoin="round" {...extra} />
));

const MAIN = PHASES.filter((p) => !p.optional);
const N = MAIN.length;
const S = 124; // distance between stations
const M = 70; // side margin
const RH = 178; // row height
const TOP = 124;
const STATION_R = 26;

function geometry(cols) {
  const W = 2 * M + (cols - 1) * S;
  const pos = (k) => {
    const row = Math.floor(k / cols); const c = k % cols;
    return [M + (row % 2 === 0 ? c : cols - 1 - c) * S, TOP + row * RH + (c % 2 === 0 ? -14 : 14)];
  };
  const start = [30, pos(0)[1] - 50];
  const ctrl = [start]; const stationU = [];
  for (let k = 0; k <= N; k++) {
    if (k < N) stationU.push(ctrl.length);
    ctrl.push(pos(k));
    if (k < N && (k + 1) % cols === 0) {
      const row = Math.floor(k / cols); const [x, y] = pos(k); const [, y2] = pos(k + 1);
      ctrl.push([x + (row % 2 === 0 ? 46 : -46), (y + y2) / 2]);
    }
  }
  const rows = Math.ceil((N + 1) / cols);
  return { cols, W, H: TOP + (rows - 1) * RH + 118, pos, start, ctrl, stationU, finishIdx: ctrl.length - 1, finish: pos(N) };
}

const cr = (p0, p1, p2, p3, t) => {
  const t2 = t * t; const t3 = t2 * t;
  const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
};

function buildRoad(ctrl, n = 40) {
  const pts = [];
  for (let k = 0; k < ctrl.length - 1; k++) {
    const p0 = ctrl[k - 1] || ctrl[k]; const p1 = ctrl[k]; const p2 = ctrl[k + 1]; const p3 = ctrl[k + 2] || ctrl[k + 1];
    const seg = []; for (let s = 0; s <= n; s++) seg.push(cr(p0, p1, p2, p3, s / n));
    const cum = [0]; for (let i = 1; i < seg.length; i++) cum.push(cum[i - 1] + Math.hypot(seg[i][0] - seg[i - 1][0], seg[i][1] - seg[i - 1][1]));
    const L = cum[cum.length - 1] || 1;
    seg.forEach((p, i) => { if (k > 0 && i === 0) return; pts.push({ x: p[0], y: p[1], u: k + cum[i] / L }); });
  }
  const at = (u) => {
    if (u <= pts[0].u) return pts[0];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].u >= u) { const a = pts[i - 1]; const b = pts[i]; const f = (u - a.u) / ((b.u - a.u) || 1); return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, u }; }
    }
    return pts[pts.length - 1];
  };
  const between = (u0, u1) => (u1 <= u0 ? [] : [at(u0), ...pts.filter((p) => p.u > u0 && p.u < u1), at(u1)]);
  return { pts, at, between };
}

const d = (ps) => ps.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

function offset(ps, o) {
  return ps.map((p, i) => {
    const a = ps[Math.max(0, i - 1)]; const b = ps[Math.min(ps.length - 1, i + 1)];
    const dx = b.x - a.x; const dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1;
    return [p.x + (-dy / l) * o, p.y + (dx / l) * o];
  });
}

/** Greedy word wrap into at most two lines of ~max characters. */
function wrap(text, max = 14) {
  const words = text.split(' '); const lines = [''];
  words.forEach((w) => {
    const cur = lines[lines.length - 1];
    if (!cur) lines[lines.length - 1] = w;
    else if ((cur + ' ' + w).length <= max || lines.length >= 2) lines[lines.length - 1] = `${cur} ${w}`;
    else lines.push(w);
  });
  return lines;
}

function Compass({ x, y }) {
  return (
    <g aria-hidden className="rm-deco">
      {R(gen.circle(x, y, 46, { stroke: INK, strokeWidth: 1.3, seed: 21, roughness: 1.1 }), 'cc')}
      {R(gen.polygon([[x, y - 17], [x + 5, y], [x, y + 17], [x - 5, y]], { stroke: INK, strokeWidth: 1.2, fill: '#ffc9c9', fillStyle: 'solid', seed: 22 }), 'cn')}
      <text x={x} y={y - 29} className="rm-note" textAnchor="middle">N</text>
    </g>
  );
}

function useCols(ref) {
  const pick = (w) => (w < 480 ? 3 : w < 820 ? 5 : 8);
  const [cols, setCols] = useState(() => (typeof window !== 'undefined' ? pick(Math.min(window.innerWidth, 900)) : 8));
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setCols(pick(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, [ref]);
  return cols;
}

export default function RoadmapMap() {
  const { state } = useProgress();
  const wrapRef = useRef(null);
  const cols = useCols(wrapRef);
  const G = useMemo(() => geometry(cols), [cols]);
  const road = useMemo(() => buildRoad(G.ctrl), [G]);

  const progs = MAIN.map((p) => phaseProgress(p, state));
  const curIdx = MAIN.findIndex((p) => !phaseComplete(p, state)); // -1 = every phase finished
  const allDone = curIdx === -1;

  const uStart = (i) => (i === 0 ? 0 : (G.stationU[i - 1] + G.stationU[i]) / 2);
  const uEnd = (i) => (G.stationU[i] + (i === N - 1 ? G.finishIdx : G.stationU[i + 1])) / 2;
  const hereU = allDone ? G.finishIdx : uStart(curIdx) + progs[curIdx].pct * (uEnd(curIdx) - uStart(curIdx));
  const here = road.at(hereU);

  const progKey = progs.map((p) => p.pct.toFixed(3)).join(',');
  const gateKey = MAIN.map((p) => (p.gate ? checklistProgress(p.gate.checklist, `gate:${p.gate.id}`, state).pct : 0).toFixed(2)).join(',');

  const roadArt = useMemo(() => {
    const all = road.pts;
    const thin = all.filter((_, i) => i % 4 === 0 || i === all.length - 1);
    const e1 = offset(thin, 14); const e2 = offset(thin, -14);
    return (
      <g aria-hidden>
        <path d={d(all)} className="rm-road" />
        {R(gen.curve(e1, { stroke: INK, strokeWidth: 1.5, roughness: 0.6, bowing: 0.5, seed: 5 }), 'e1')}
        {R(gen.curve(e2, { stroke: INK, strokeWidth: 1.5, roughness: 0.6, bowing: 0.5, seed: 6 }), 'e2')}
      </g>
    );
  }, [road]);

  const paint = useMemo(() => MAIN.map((p, i) => {
    const g = progs[i].pct; if (g <= 0) return null;
    const u0 = uStart(i);
    return <path key={p.id} d={d(road.between(u0, u0 + g * (uEnd(i) - uStart(i))))} className="rm-paint" stroke={p.color} />;
  }), [road, progKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const stations = useMemo(() => MAIN.map((p, k) => {
    const [sx, sy] = G.pos(k); const g = progs[k].pct; const isCur = k === curIdx;
    const circ = 2 * Math.PI * (STATION_R + 5);
    const lines = wrap(p.short);
    return (
      <a key={p.id} href={`#/phase/${p.id}`} className={`rm-station ${isCur ? 'cur' : ''}`}
        aria-label={`Phase ${p.num}: ${p.title}, ${Math.round(g * 100)}% of its lessons done`}>
        <title>{`Phase ${p.num}: ${p.title} · ${p.stageTitle}`}</title>
        {isCur && R(gen.circle(sx, sy, 2 * (STATION_R + 17), { stroke: 'none', fill: '#fff3a3', fillStyle: 'solid', seed: 60 + k, roughness: 1.6 }), `hl${k}`)}
        <circle cx={sx} cy={sy} r={STATION_R + 5} fill="none" stroke="#e2d9c4" strokeWidth="4" />
        {g > 0 && <circle cx={sx} cy={sy} r={STATION_R + 5} fill="none" stroke={p.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${circ * g} ${circ}`} transform={`rotate(-90 ${sx} ${sy})`} />}
        <g className="rm-disc">{R(gen.circle(sx, sy, STATION_R * 2 - 2, { stroke: INK, strokeWidth: 2, fill: p.tint, fillStyle: 'solid', roughness: 1.1, seed: 70 + k }), `st${k}`)}</g>
        <text x={sx} y={sy + 1} className="rm-emoji" textAnchor="middle" dominantBaseline="central">{p.emoji}</text>
        <circle cx={sx - 21} cy={sy - 21} r="9.5" fill={p.color} stroke={INK} strokeWidth="1.4" />
        <text x={sx - 21} y={sy - 20.5} className="rm-num" textAnchor="middle" dominantBaseline="central">{p.num}</text>
        {g >= 1 && (
          <g aria-hidden>
            <circle cx={sx + 21} cy={sy - 21} r="9" fill="#2f9e44" stroke={INK} strokeWidth="1.4" />
            <text x={sx + 21} y={sy - 20.5} textAnchor="middle" dominantBaseline="central" className="rm-check">✓</text>
          </g>
        )}
        {lines.map((ln, i) => <text key={i} x={sx} y={sy + STATION_R + 24 + i * 15} textAnchor="middle" className="rm-lbl">{ln}</text>)}
      </a>
    );
  }), [G, progKey, curIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const gates = useMemo(() => MAIN.map((p, k) => {
    if (!p.gateLetter) return null;
    const [sx, sy] = G.pos(k);
    const px = sx + 24; const py = sy - 14;
    const reached = gateOpen(p, state);
    const gp = p.gate ? checklistProgress(p.gate.checklist, `gate:${p.gate.id}`, state).pct : 0;
    return (
      <a key={p.id} href={`#/gate/${p.id}`} className="rm-gate" aria-label={`Gate ${p.gateLetter}: apply gate after ${p.title}${reached ? ' (open now)' : ''}`}>
        <title>{`Gate ${p.gateLetter} · opens when you finish ${p.short}${p.target ? ` · ${p.target}` : ''}`}</title>
        {R(gen.line(px, py, px, py - 46, { stroke: INK, strokeWidth: 2.2, seed: 80 + k, roughness: 0.8 }), `gp${k}`)}
        {R(gen.polygon([[px, py - 46], [px + 30, py - 38], [px, py - 29]], { stroke: INK, strokeWidth: 1.5, fill: reached ? '#e8590c' : '#fffdf7', fillStyle: 'solid', seed: 90 + k, roughness: 0.9 }), `gf${k}`)}
        <text x={px + 10} y={py - 38} textAnchor="middle" dominantBaseline="central" className={`rm-gl ${reached ? 'on' : ''}`}>{p.gateLetter}</text>
        {gp >= 1 && <text x={px - 4} y={py - 50} textAnchor="end" className="rm-note ok">✓</text>}
      </a>
    );
  }), [G, progKey, gateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fx, fy] = G.finish;
  const flagLeft = fx > G.W / 2;
  const finish = (
    <g aria-hidden>
      {R(gen.line(fx, fy, fx, fy - 54, { stroke: INK, strokeWidth: 2.4, seed: 120 }), 'fp')}
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((cIdx) => {
        const w = 9; const x0 = flagLeft ? fx - 36 + cIdx * w : fx + cIdx * w; const y0 = fy - 54 + r * w;
        return <rect key={`${r}${cIdx}`} x={x0} y={y0} width={w} height={w} fill={(r + cIdx) % 2 ? '#fffdf7' : INK} />;
      }))}
      {R(gen.rectangle(flagLeft ? fx - 36 : fx, fy - 54, 36, 27, { stroke: INK, strokeWidth: 1.4, seed: 121, roughness: 0.7 }), 'fr')}
      <text x={fx} y={fy + 30} textAnchor="middle" className="rm-finish">FDE offer</text>
      <text x={fx} y={fy + 48} textAnchor="middle" className="rm-meta">at your own pace</text>
    </g>
  );

  const [stx, sty] = G.start;
  const start = (
    <g aria-hidden>
      {R(gen.circle(stx, sty, 30, { stroke: INK, strokeWidth: 2, fill: '#fffdf7', fillStyle: 'solid', seed: 130 }), 'sc')}
      <text x={stx + 22} y={sty + 6} textAnchor="start" className="rm-start">Day 1</text>
    </g>
  );

  const pinY = here.y - 20;
  const hereAnchor = here.x < 150 ? 'start' : here.x > G.W - 150 ? 'end' : 'middle';
  const hereX = hereAnchor === 'start' ? Math.max(8, here.x - 18) : hereAnchor === 'end' ? Math.min(G.W - 8, here.x + 18) : here.x;
  const pin = (
    <g className="rm-pin" aria-hidden>
      <path d={`M${here.x} ${here.y - 2} L${here.x - 8} ${pinY + 4} A 11 11 0 1 1 ${here.x + 8} ${pinY + 4} Z`} fill="#e8590c" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={here.x} cy={pinY - 2} r="4" fill="#fffdf7" />
      <text x={hereX} y={pinY - 22} textAnchor={hereAnchor} className="rm-here">{allDone ? 'you made it' : 'you are here'}</text>
    </g>
  );

  return (
    <div className={`roadmap cols-${cols}`} ref={wrapRef}>
      <svg viewBox={`0 0 ${G.W} ${G.H}`} className="rm-svg" role="group" aria-label={`Roadmap: ${N} phases from foundations to a Forward Deployed Engineer offer`}>
        <Compass x={G.W / 2 + 20} y={38} />
        {roadArt}
        {paint}
        <path d={d(road.pts)} className="rm-dash" aria-hidden />
        {start}
        {finish}
        {gates}
        {stations}
        {pin}
      </svg>
      <ul className="rm-stages" aria-label="Stage colours">
        {STAGES.filter((s) => s.id !== 'optional').map((s) => <li key={s.id}><i style={{ background: s.color }} />{s.num}. {s.title}</li>)}
      </ul>
      <div className="rm-legend">
        <span><i className="rm-key paint" /> road gets painted as you finish lessons</span>
        <span><i className="rm-key flag" /> gate: time to start applying (opens when that phase is finished)</span>
        <span>click a station to open the phase</span>
      </div>
    </div>
  );
}
