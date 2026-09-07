import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

// ─── Week-on-week delta pill ─────────────────────────────────────────────────
// Every KPI on the consultant's dashboard carries one of these, and it's the
// cheapest way to turn a number into news: 86 engaged accounts means nothing on
// its own, "86, up 14 this week" means the campaign is working.
//
// Colour is not the only carrier — the arrow direction says the same thing, so
// the pill still reads for anyone who can't separate the red from the green.

interface WowBadgeProps {
  /** Absolute change over the period. Sign drives direction and colour. */
  change: number;
  /** Shown instead of the raw change when given (e.g. "22%"). */
  display?: string;
  /** Trailing noun, e.g. "accounts". Omit for percentage-only pills. */
  unit?: string;
  /** A rise is normally good; set false where up is bad (rejections, cost). */
  riseIsGood?: boolean;
}

export function WowBadge({ change, display, unit, riseIsGood = true }: WowBadgeProps) {
  const flat = change === 0;
  const good = change > 0 === riseIsGood;
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;

  const tone = flat
    ? { fg: 'var(--color-text-muted)', bg: 'var(--background-muted)' }
    : good
      ? { fg: 'var(--color-success)', bg: 'var(--color-success-bg)' }
      : { fg: 'var(--color-error)', bg: 'var(--color-error-bg)' };

  const magnitude = display ?? Math.abs(change).toLocaleString('en-US');
  const label = flat ? 'no change' : `${change > 0 ? '+' : '-'}${magnitude}${unit ? ` ${unit}` : ''}`;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ color: tone.fg, background: tone.bg, fontVariantNumeric: 'tabular-nums' }}
      title={`${label} vs last week`}
    >
      <Icon className="h-3 w-3 flex-shrink-0" aria-hidden />
      {label}
    </span>
  );
}
