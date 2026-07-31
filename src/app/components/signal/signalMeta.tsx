import type { IntentType, RoleClass } from '../../data/signalRoom';
import { INTENT_TYPE_LABEL } from '../../data/signalRoom';

// Shared colour + chip vocabulary for the Signal Room surfaces. Intent types
// and influence roles each get one token-backed colour used consistently on
// chips, dots, and card edges.

export const INTENT_META: Record<IntentType, { label: string; color: string; bg: string }> = {
  'compliance-driven': { label: INTENT_TYPE_LABEL['compliance-driven'], color: 'var(--color-info)', bg: 'rgba(8,145,178,0.10)' },
  'event-triggered': { label: INTENT_TYPE_LABEL['event-triggered'], color: 'var(--color-warning)', bg: 'rgba(217,119,6,0.12)' },
  'company-driven': { label: INTENT_TYPE_LABEL['company-driven'], color: 'var(--color-success)', bg: 'rgba(5,150,105,0.10)' },
  'personal-career': { label: INTENT_TYPE_LABEL['personal-career'], color: 'var(--color-accent-purple)', bg: 'rgba(124,58,237,0.10)' },
  'weak-fit': { label: INTENT_TYPE_LABEL['weak-fit'], color: 'var(--color-text-secondary)', bg: 'rgba(100,116,139,0.12)' },
};

export const ROLE_META: Record<RoleClass, { label: string; color: string }> = {
  champion: { label: 'Champion', color: 'var(--color-success)' },
  'decision-maker': { label: 'Decision-maker', color: 'var(--color-primary)' },
  influencer: { label: 'Influencer', color: 'var(--color-info)' },
  gatekeeper: { label: 'Gatekeeper', color: 'var(--color-warning)' },
};

export function IntentChip({ type, score }: { type: IntentType; score?: number }) {
  const meta = INTENT_META[type];
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
      {score !== undefined && <b style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</b>}
    </span>
  );
}

export function RoleDot({ roleClass }: { roleClass: RoleClass }) {
  return (
    <span
      className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      style={{ background: ROLE_META[roleClass].color }}
      title={ROLE_META[roleClass].label}
    />
  );
}

export function fmtSignalDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
