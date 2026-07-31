import { IS_CLIENT_DEMO } from '../config/demo';

/**
 * Fixed "Demo environment" ribbon, rendered only in client demo mode.
 * Keeps expectations honest: sample data, simulated actions.
 */
export function DemoRibbon() {
  if (!IS_CLIENT_DEMO) return null;
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none select-none"
      aria-hidden="true"
    >
      <span
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
        style={{
          background: 'rgba(28,28,30,0.82)',
          color: 'var(--color-surface-raised)',
          fontSize: '12px',
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-warning)' }} />
        Preview environment
      </span>
    </div>
  );
}
