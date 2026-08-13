import { CAMPAIGN_TYPES_META, type CampaignTypeCode } from '../../data/unionOps';

// ─── Campaign type chip ──────────────────────────────────────────────────────
// One colour per campaign type, the same assignments the initiation form's
// section tones use, so type reads consistently across the ops surface.
// Semantic colours as type on their own tints — tuned for both themes.

const TYPE_TONES: Record<CampaignTypeCode, { color: string; bg: string }> = {
  CS: { color: 'var(--color-primary)', bg: 'var(--color-primary-tint)' },
  SA: { color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  SS: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  PG: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
};

export function CampaignTypeChip({ type }: { type: CampaignTypeCode }) {
  const tone = TYPE_TONES[type];
  const label = CAMPAIGN_TYPES_META.find(t => t.code === type)?.label ?? type;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
      style={{ background: tone.bg, color: tone.color }}
      title={label}
    >
      <span className="font-mono">{type}</span>
      <span className="hidden font-semibold sm:inline">{label}</span>
    </span>
  );
}
