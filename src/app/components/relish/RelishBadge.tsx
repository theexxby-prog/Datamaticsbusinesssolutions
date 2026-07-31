import { Sparkles } from 'lucide-react';

// Small chip marking a lead that carries Relish intelligence. Rendered in
// both LeadsPage renderers (desktop table + mobile card); callers gate on
// showFutureModules + hasRelishIntel.
export function RelishBadge() {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
      title="Relish intelligence available"
    >
      <Sparkles className="h-3 w-3" />
      Intel
    </span>
  );
}
