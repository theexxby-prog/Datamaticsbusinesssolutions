import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Demo: always play on dashboard load. Set false to show once per browser.
const INTRO_ALWAYS = false;
// The showcase loops every 21s; advance during the held end card (~17.6-21s)
// so the hand-off to the dashboard lands on the brand frame, not mid-replay.
const AUTO_DISMISS_MS = 20500;

export function shouldShowIntro(): boolean {
  if (INTRO_ALWAYS) return true;
  try { return !localStorage.getItem('pulse_intro_seen'); } catch { return true; }
}

export function markIntroSeen(): void {
  try { localStorage.setItem('pulse_intro_seen', '1'); } catch { /* ignore */ }
}

export function IntroShowcase({ onDone }: { onDone: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    setLeaving(true);
    window.setTimeout(onDone, 450); // let the fade play out
  };

  // The animation is a ~380 kB self-contained HTML file (Claude Design export).
  // Load it on demand so it never weighs down the dashboard's initial bundle.
  useEffect(() => {
    let alive = true;
    import('../intro/pulse-demo.html?raw').then((m) => { if (alive) setHtml(m.default); });
    return () => { alive = false; };
  }, []);

  // Start the auto-advance timer once the animation is actually playing.
  useEffect(() => {
    if (!html) return;
    const t = window.setTimeout(finish, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[var(--color-surface)] transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      role="dialog"
      aria-label="Product showcase"
    >
      {html && (
        <iframe
          title="Pulse showcase"
          srcDoc={html}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
      <button
        onClick={finish}
        className="absolute top-5 right-5 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)] text-gray-800 shadow-lg backdrop-blur transition-colors"
      >
        Skip intro <X className="w-4 h-4" />
      </button>
    </div>
  );
}
