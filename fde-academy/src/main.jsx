import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/kalam/400.css';
import '@fontsource/kalam/700.css';
import '@fontsource/caveat/600.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/800.css';
import '@fontsource/jetbrains-mono/400.css';
import './styles.css';
import { ProgressProvider } from './lib/store';
import { warmup } from './lib/db';
import App from './App';

// Widget-specific styles (owned by the widget author). Globbed so a missing file never breaks the build.
import.meta.glob('./widgets/*.css', { eager: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </HashRouter>
  </React.StrictMode>,
);

// Seed the in-browser PostgreSQL after first paint, so playgrounds are instant when you reach them.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
idle(() => { try { warmup(); } catch { /* playgrounds will retry on first use */ } }, { timeout: 4000 });
