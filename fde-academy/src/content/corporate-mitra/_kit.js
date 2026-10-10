// Small helpers that build hand-drawn sketch items (see src/components/Sketch.jsx) with sane, in-bounds layouts.
// Lessons stay data-like: import { sk, flow, stack, hub, bar } from '../_kit.js' and spread the returned items.

export const W = 760;

const longest = (s) => Math.max(...String(s).split('\n').map((l) => l.length));

/** Font size that lets the longest line of `text` fit a box `w` px wide (Kalam bold is ~0.48 em per character). */
export const fit = (text, w, max = 19, min = 12) => Math.max(min, Math.min(max, Math.floor((w - 14) / (longest(text) * 0.5))));

const norm = (s) => (typeof s === 'string' ? { label: s } : s);

/** A complete sketch block: sk(height, caption, items). */
export const sk = (h, caption, items) => ({ sketch: { w: W, h, caption, items } });

/** A row of boxes joined by arrows. steps: ['text' | { label, sub, fill }]. */
export function flow(steps, { y = 20, h = 70, x = 10, w = 740, gap = 44, max = 19, fill = 'blue', labels = [] } = {}) {
  const n = steps.length;
  const bw = (w - gap * (n - 1)) / n;
  const items = [];
  steps.forEach((raw, i) => {
    const s = norm(raw);
    const bx = x + i * (bw + gap);
    items.push({ t: 'box', x: Math.round(bx), y, w: Math.round(bw), h, label: s.label, sub: s.sub, fill: s.fill || fill, size: fit(s.label, bw, max) });
    if (i < n - 1) items.push({ t: 'arrow', x1: Math.round(bx + bw + 4), y1: y + h / 2, x2: Math.round(bx + bw + gap - 4), y2: y + h / 2, label: labels[i] });
  });
  return items;
}

/** A column of boxes joined by arrows pointing down. */
export function stack(steps, { x = 200, y = 12, w = 360, h = 50, gap = 30, max = 19, fill = 'blue', labels = [] } = {}) {
  const items = [];
  steps.forEach((raw, i) => {
    const s = norm(raw);
    const by = y + i * (h + gap);
    items.push({ t: 'box', x, y: by, w, h, label: s.label, sub: s.sub, fill: s.fill || fill, size: fit(s.label, w, max) });
    if (i < steps.length - 1) items.push({ t: 'arrow', x1: x + w / 2, y1: by + h + 3, x2: x + w / 2, y2: by + h + gap - 3, label: labels[i], lx: 70 });
  });
  return items;
}

/** One centre circle with boxes around it on an ellipse, each joined by an arrow. */
export function hub(centre, spokes, { cx = W / 2, cy = 170, rx = 290, ry = 118, r = 50, bw = 150, bh = 56, fill = 'blue', max = 17, both = false } = {}) {
  const items = [{ t: 'circle', x: cx, y: cy, r, label: centre.label, fill: centre.fill || 'yellow', size: fit(centre.label, r * 1.7, 18) }];
  const n = spokes.length;
  spokes.forEach((raw, i) => {
    const s = norm(raw);
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const bx = cx + rx * Math.cos(a);
    const by = cy + ry * Math.sin(a);
    items.push({ t: 'box', x: Math.round(bx - bw / 2), y: Math.round(by - bh / 2), w: bw, h: bh, label: s.label, sub: s.sub, fill: s.fill || fill, size: fit(s.label, bw, max) });
    // arrow from the circle edge to the box edge
    const dx = bx - cx; const dy = by - cy; const d = Math.hypot(dx, dy);
    const ux = dx / d; const uy = dy / d;
    const tBox = Math.min(Math.abs(ux) < 1e-6 ? Infinity : bw / 2 / Math.abs(ux), Math.abs(uy) < 1e-6 ? Infinity : bh / 2 / Math.abs(uy));
    const p1 = [cx + ux * (r + 4), cy + uy * (r + 4)];
    const p2 = [bx - ux * (tBox + 4), by - uy * (tBox + 4)];
    items.push({ t: 'arrow', x1: Math.round(p1[0]), y1: Math.round(p1[1]), x2: Math.round(p2[0]), y2: Math.round(p2[1]) });
    if (both) items.push({ t: 'arrow', x1: Math.round(p2[0]), y1: Math.round(p2[1]), x2: Math.round(p1[0]), y2: Math.round(p1[1]) });
  });
  return items;
}

/** A segmented bar whose widths follow `parts` (numbers). Labels sit under each segment. */
export function bar(parts, { x = 20, y = 20, w = 720, h = 46, fills = ['blue', 'green', 'yellow', 'pink', 'orange', 'purple'], below = true } = {}) {
  const total = parts.reduce((a, p) => a + p.v, 0);
  const items = [];
  let cx = x;
  parts.forEach((p, i) => {
    const pw = Math.round((p.v / total) * w);
    items.push({ t: 'box', x: cx, y, w: pw, h, label: p.top, fill: p.fill || fills[i % fills.length], size: fit(p.top, pw, 19, 11) });
    if (p.label) items.push({ t: 'text', x: cx + pw / 2, y: y + h + (below ? 22 : -16), text: p.label, size: p.size || 15, color: '#3d4864' });
    cx += pw;
  });
  return items;
}

/** A numbered vertical stepper: [{ label, desc }]. Title column is `tw` px wide, description follows on the same line. */
export function steps(list, { x = 40, y = 26, dy = 44, r = 16, tw = 230, fills = ['blue', 'green', 'orange', 'yellow', 'purple', 'teal', 'pink', 'grey'] } = {}) {
  const items = [];
  list.forEach((s, i) => {
    const cy = y + i * dy;
    if (i < list.length - 1) items.push({ t: 'line', x1: x, y1: cy + r, x2: x, y2: cy + dy - r, color: '#8892a6' });
    items.push({ t: 'circle', x, y: cy, r, label: String(i + 1), fill: s.fill || fills[i % fills.length], size: 16 });
    items.push({ t: 'text', x: x + r + 14, y: cy, text: s.label, size: 18, bold: true, anchor: 'start' });
    if (s.desc) items.push({ t: 'text', x: x + r + 14 + tw, y: cy, text: s.desc, size: 15, color: '#4a5568', anchor: 'start' });
  });
  return items;
}

/** Two rows of boxes (ceil(n/2) on top), each row joined by arrows, plus one arrow in the gap from the end of row 1 to the start of row 2. */
export function flow2(list, { y = 14, h = 70, rowGap = 66, label = 'then', ...opt } = {}) {
  const per = Math.ceil(list.length / 2);
  const top = list.slice(0, per);
  const bot = list.slice(per);
  const y2 = y + h + rowGap;
  const o = { h, ...opt };
  const w = opt.w || 740; const x = opt.x || 10;
  // keep the second row's boxes the same width as the first row's, left aligned
  const gap = opt.gap ?? 44;
  const bw = (w - gap * (per - 1)) / per;
  const w2 = bot.length * bw + gap * (bot.length - 1);
  return [
    ...flow(top, { ...o, y }),
    { t: 'arrow', x1: x + w - bw / 2, y1: y + h + 6, x2: x + bw / 2, y2: y2 - 6, label, ly: -8, lx: 0 },
    ...flow(bot, { ...o, y: y2, w: w2 }),
  ];
}
