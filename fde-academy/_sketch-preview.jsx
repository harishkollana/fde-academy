import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/kalam/400.css';
import '@fontsource/kalam/700.css';
import '@fontsource/caveat/600.css';
import '@fontsource/nunito/400.css';
import '@fontsource/jetbrains-mono/400.css';
import './src/styles.css';
import Sketch from './src/components/Sketch';
import { LESSONS } from './src/content/corporate-mitra/index.js';

const q = new URLSearchParams(location.search).get('l') || '';
const only = LESSONS.filter((l) => l.id.includes(q));
ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ width: 800, padding: 10 }}>
    {only.map((l) => (
      <div key={l.id}>
        <div style={{ font: '700 14px sans-serif', margin: '6px 0' }}>{l.id}</div>
        {l.blocks.filter((b) => b.sketch).map((b, i) => <div key={i} style={{ marginBottom: 12 }}><Sketch spec={b.sketch} seed={LESSONS ? l.blocks.indexOf(b) + 3 : 3} /></div>)}
      </div>
    ))}
  </div>,
);
