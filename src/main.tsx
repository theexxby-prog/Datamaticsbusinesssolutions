import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './app/App';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/index.css';

// Remove the HTML-level splash screen (rendered in index.html before React boots).
// We fade it out smoothly once React is ready to take over.
function dismissHtmlSplash() {
  const splash = document.getElementById('root-splash');
  if (!splash) return;
  splash.style.transition = 'opacity 300ms ease';
  splash.style.opacity = '0';
  splash.style.pointerEvents = 'none';
  setTimeout(() => splash.remove(), 320);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
  </React.StrictMode>
);

// Dismiss after React has painted its first frame.
requestAnimationFrame(() => requestAnimationFrame(dismissHtmlSplash));
