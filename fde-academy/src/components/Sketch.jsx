import { useEffect, useRef } from 'react';
import rough from 'roughjs';

/*
  Hand-drawn diagram engine.
  spec = { w, h, items: [ ... ], caption }
  item types:
    box    {x,y,w,h,label,sub,fill,color}
    db     {x,y,w,h,label,fill}
    doc    {x,y,w,h,label,fill}
    circle {x,y,r,label,fill}
    cloud  {x,y,w,h,label}
    person {x,y,label}
    note   {x,y,w,h,text,fill}
    arrow  {x1,y1,x2,y2,label,dashed,color,bend}
    line   {x1,y1,x2,y2,dashed,color}
    text   {x,y,text,size,color,anchor,bold}
    table  {x,y,cols,rows,colW,rowH,title,hl:[rowIdx],fill}
    mark   {x,y,ok}
    brace  {x,y,w,label}  (curly underline)
*/

export const INK = '#1f2a44';
export const C = {
  blue: '#d0e4ff', green: '#d3f9d8', yellow: '#fff3a3', pink: '#ffd8e1', orange: '#ffe0c2',
  purple: '#e5dbff', teal: '#c3fae8', grey: '#eceff3', red: '#ffc9c9', white: '#ffffff',
};
const fillOf = (f) => (f ? C[f] || f : undefined);

function addText(g, x, y, text, { size = 18, color = INK, anchor = 'middle', bold = false, font = 'hand' } = {}) {
  const lines = String(text).split('\n');
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x);
  t.setAttribute('text-anchor', anchor);
  t.setAttribute('fill', color);
  t.setAttribute('font-size', size);
  t.setAttribute('font-family', font === 'mono' ? 'JetBrains Mono, monospace' : 'Kalam, Caveat, cursive');
  if (bold) t.setAttribute('font-weight', '700');
  const startY = y - ((lines.length - 1) * size * 1.15) / 2 + size * 0.35;
  lines.forEach((ln, i) => {
    const ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    ts.setAttribute('x', x);
    ts.setAttribute('y', startY + i * size * 1.15);
    ts.textContent = ln;
    t.appendChild(ts);
  });
  g.appendChild(t);
}

function draw(svg, spec, seed) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const rc = rough.svg(svg);
  const base = { seed, roughness: 1.3, bowing: 1.2, stroke: INK, strokeWidth: 1.8, fillStyle: 'hachure', hachureGap: 7, fillWeight: 1.2 };
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(g);
  const add = (n) => g.appendChild(n);
  // arrow marker def
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.insertBefore(defs, g);

  for (const it of spec.items || []) {
    const o = { ...base, stroke: it.color || INK, fill: fillOf(it.fill), fillStyle: it.solid ? 'solid' : base.fillStyle };
    switch (it.t) {
      case 'box': {
        add(rc.rectangle(it.x, it.y, it.w, it.h, o));
        if (it.label) addText(g, it.x + it.w / 2, it.y + it.h / 2 - (it.sub ? 9 : 0), it.label, { size: it.size || 19, bold: true });
        if (it.sub) addText(g, it.x + it.w / 2, it.y + it.h / 2 + 14, it.sub, { size: 14, color: '#4a5568' });
        break;
      }
      case 'db': {
        const { x, y, w, h } = it; const e = Math.min(18, h * 0.22);
        add(rc.path(`M${x} ${y + e / 2} L${x} ${y + h - e / 2} A${w / 2} ${e / 2} 0 0 0 ${x + w} ${y + h - e / 2} L${x + w} ${y + e / 2}`, o));
        add(rc.ellipse(x + w / 2, y + e / 2, w, e, { ...o, fill: o.fill }));
        if (it.label) addText(g, x + w / 2, y + h / 2 + e / 3, it.label, { size: it.size || 17, bold: true });
        break;
      }
      case 'doc': {
        const { x, y, w, h } = it; const f = 14;
        add(rc.path(`M${x} ${y} L${x + w - f} ${y} L${x + w} ${y + f} L${x + w} ${y + h} L${x} ${y + h} Z`, o));
        add(rc.path(`M${x + w - f} ${y} L${x + w - f} ${y + f} L${x + w} ${y + f}`, { ...base }));
        if (it.label) addText(g, x + w / 2, y + h / 2 + 4, it.label, { size: it.size || 15, bold: true });
        break;
      }
      case 'circle': {
        add(rc.circle(it.x, it.y, it.r * 2, o));
        if (it.label) addText(g, it.x, it.y, it.label, { size: it.size || 17, bold: true });
        break;
      }
      case 'cloud': {
        const { x, y, w, h } = it;
        const p = `M${x + w * 0.2} ${y + h} Q${x - w * 0.05} ${y + h} ${x + w * 0.05} ${y + h * 0.6} Q${x} ${y + h * 0.2} ${x + w * 0.3} ${y + h * 0.25} Q${x + w * 0.4} ${y - h * 0.1} ${x + w * 0.62} ${y + h * 0.15} Q${x + w * 0.95} ${y + h * 0.05} ${x + w * 0.92} ${y + h * 0.5} Q${x + w * 1.05} ${y + h} ${x + w * 0.8} ${y + h} Z`;
        add(rc.path(p, o));
        if (it.label) addText(g, x + w / 2, y + h * 0.6, it.label, { size: it.size || 18, bold: true });
        break;
      }
      case 'person': {
        const { x, y } = it;
        add(rc.circle(x, y, 22, { ...base, fill: fillOf(it.fill || 'yellow') }));
        add(rc.line(x, y + 11, x, y + 40, base));
        add(rc.line(x - 14, y + 22, x + 14, y + 22, base));
        add(rc.line(x, y + 40, x - 11, y + 58, base));
        add(rc.line(x, y + 40, x + 11, y + 58, base));
        if (it.label) addText(g, x, y + 74, it.label, { size: 16, bold: true });
        break;
      }
      case 'note': {
        add(rc.rectangle(it.x, it.y, it.w, it.h, { ...o, fill: fillOf(it.fill || 'yellow'), fillStyle: 'solid', roughness: 0.8 }));
        addText(g, it.x + it.w / 2, it.y + it.h / 2, it.text, { size: it.size || 15 });
        break;
      }
      case 'line': {
        add(rc.line(it.x1, it.y1, it.x2, it.y2, { ...o, strokeLineDash: it.dashed ? [7, 6] : undefined }));
        break;
      }
      case 'arrow': {
        const { x1, y1, x2, y2 } = it;
        const bend = it.bend || 0;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const dx = x2 - x1, dy = y2 - y1; const len = Math.hypot(dx, dy) || 1;
        const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
        const ao = { ...base, stroke: it.color || INK, strokeLineDash: it.dashed ? [7, 6] : undefined };
        if (bend) add(rc.path(`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, ao));
        else add(rc.line(x1, y1, x2, y2, ao));
        const ang = Math.atan2(y2 - (bend ? cy : y1), x2 - (bend ? cx : x1));
        const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85; const hl = 13;
        add(rc.line(x2, y2, x2 + hl * Math.cos(a1), y2 + hl * Math.sin(a1), { ...ao, strokeLineDash: undefined }));
        add(rc.line(x2, y2, x2 + hl * Math.cos(a2), y2 + hl * Math.sin(a2), { ...ao, strokeLineDash: undefined }));
        if (it.label) addText(g, bend ? cx : mx + (it.lx || 0), (bend ? cy : my) + (it.ly ?? -10), it.label, { size: 15, color: it.color || '#c2410c' });
        break;
      }
      case 'text': {
        addText(g, it.x, it.y, it.text, { size: it.size || 18, color: it.color || INK, anchor: it.anchor || 'middle', bold: it.bold, font: it.font });
        break;
      }
      case 'table': {
        const { x, y, cols, rows } = it; const rh = it.rowH || 28;
        const cw = it.colW || cols.map(() => 90);
        const W = cw.reduce((a, b) => a + b, 0);
        let ty = y;
        if (it.title) { addText(g, x + W / 2, y - 14, it.title, { size: 17, bold: true, color: it.titleColor || '#c2410c' }); }
        add(rc.rectangle(x, ty, W, rh, { ...base, fill: fillOf(it.fill || 'blue'), fillStyle: 'solid', roughness: 0.9 }));
        let cx = x;
        cols.forEach((c, i) => { addText(g, cx + cw[i] / 2, ty + rh / 2, c, { size: 14, bold: true, font: 'mono' }); cx += cw[i]; });
        rows.forEach((r, ri) => {
          ty += rh;
          const hl = (it.hl || []).includes(ri);
          const dim = (it.dim || []).includes(ri);
          add(rc.rectangle(x, ty, W, rh, { ...base, roughness: 0.7, fill: hl ? C.yellow : dim ? C.grey : undefined, fillStyle: 'solid' }));
          let cx2 = x;
          r.forEach((v, i) => { addText(g, cx2 + cw[i] / 2, ty + rh / 2, v === null ? 'NULL' : v, { size: 13, font: 'mono', color: v === null ? '#a0aec0' : dim ? '#718096' : INK }); cx2 += cw[i]; });
        });
        let lx = x;
        cw.slice(0, -1).forEach((w) => { lx += w; add(rc.line(lx, y, lx, ty + rh, { ...base, strokeWidth: 1, roughness: 0.6 })); });
        break;
      }
      case 'mark': {
        if (it.ok) add(rc.path(`M${it.x - 10} ${it.y} L${it.x - 2} ${it.y + 9} L${it.x + 12} ${it.y - 10}`, { ...base, stroke: '#2f9e44', strokeWidth: 3 }));
        else { add(rc.line(it.x - 9, it.y - 9, it.x + 9, it.y + 9, { ...base, stroke: '#e03131', strokeWidth: 3 })); add(rc.line(it.x + 9, it.y - 9, it.x - 9, it.y + 9, { ...base, stroke: '#e03131', strokeWidth: 3 })); }
        break;
      }
      case 'brace': {
        const { x, y, w } = it;
        add(rc.path(`M${x} ${y} Q${x} ${y + 12} ${x + w * 0.25} ${y + 12} Q${x + w / 2} ${y + 12} ${x + w / 2} ${y + 22} Q${x + w / 2} ${y + 12} ${x + w * 0.75} ${y + 12} Q${x + w} ${y + 12} ${x + w} ${y}`, { ...base, stroke: it.color || '#c2410c' }));
        if (it.label) addText(g, x + w / 2, y + 40, it.label, { size: 16, color: it.color || '#c2410c' });
        break;
      }
      default:
        break;
    }
  }
}

export default function Sketch({ spec, seed = 7, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    const go = () => !cancelled && draw(ref.current, spec, seed);
    // wait for fonts so text measures nicely
    if (document.fonts?.ready) document.fonts.ready.then(go); else go();
    return () => { cancelled = true; };
  }, [spec, seed]);
  return (
    <figure className={`sketch ${className}`}>
      <svg ref={ref} viewBox={`0 0 ${spec.w} ${spec.h}`} role="img" aria-label={spec.caption || 'hand-drawn diagram'} />
      {spec.caption && <figcaption>{spec.caption}</figcaption>}
    </figure>
  );
}
