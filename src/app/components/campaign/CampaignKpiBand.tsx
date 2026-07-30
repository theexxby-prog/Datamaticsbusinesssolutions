import { DollarSign, TrendingUp, CheckCircle, Gauge, ShieldCheck, MessageSquareWarning } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── One KPI band ────────────────────────────────────────────────────────────
// This replaces the old four-tile row *and* the 379px "Campaign Progress" card
// beneath it. The donut said one thing — 90% — that the Delivered tile now says
// with a progress bar in a fraction of the height, and Target/Delivered/
// Remaining are all recoverable from "314 / 350 · 36 to go".
//
// The Pace tile likewise absorbs the old Delivery Pace card: time elapsed
// against leads delivered is the whole point of it, and it reads better beside
// the number it qualifies than in a sidebar.

interface Tile {
  key: string;
  label: string;
  value: string;
  sub?: string;
  Icon: LucideIcon;
  /** CSS colour token for the icon and any bar. */
  tone: string;
  toneBg: string;
  /** Renders a progress bar inside the tile when set. */
  bar?: { pct: number; trackPct?: number };
  onClick?: () => void;
}

interface CampaignKpiBandProps {
  billable: string;
  cpl: string;
  delivered: number;
  target: number;
  progressPercent: number;
  acceptanceRate: number;
  timeElapsedPercent: number;
  paceColor: string;
  paceLabel: string;
  /** Omitted for clients on manual review, where there is no automated QA. */
  qaValidPercent?: number;
  openRequests: number;
  onOpenRequests: () => void;
}

export function CampaignKpiBand({
  billable, cpl, delivered, target, progressPercent, acceptanceRate,
  timeElapsedPercent, paceColor, paceLabel, qaValidPercent, openRequests, onOpenRequests,
}: CampaignKpiBandProps) {
  const remaining = Math.max(0, target - delivered);

  const tiles: Tile[] = [
    {
      key: 'billable',
      label: 'Total Billable',
      value: billable,
      sub: `${delivered.toLocaleString()} leads × ${cpl} CPL`,
      Icon: DollarSign,
      tone: 'var(--color-primary)',
      toneBg: 'var(--color-primary-tint)',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      value: `${delivered.toLocaleString()} / ${target.toLocaleString()}`,
      sub: remaining > 0 ? `${remaining.toLocaleString()} to go · ${progressPercent}%` : `Target met · ${progressPercent}%`,
      Icon: TrendingUp,
      tone: 'var(--color-primary)',
      toneBg: 'var(--color-primary-tint)',
      bar: { pct: progressPercent },
    },
    {
      key: 'pace',
      label: 'Pace',
      value: paceLabel,
      sub: `${timeElapsedPercent}% of time · ${progressPercent}% delivered`,
      Icon: Gauge,
      tone: paceColor,
      toneBg: 'var(--color-surface)',
      bar: { pct: progressPercent, trackPct: timeElapsedPercent },
    },
    {
      key: 'acceptance',
      label: 'Acceptance',
      value: `${acceptanceRate}%`,
      Icon: CheckCircle,
      tone: 'var(--color-success)',
      toneBg: 'var(--color-success-bg)',
    },
  ];

  if (qaValidPercent !== undefined) {
    tiles.push({
      key: 'qa',
      label: 'QA Valid',
      value: `${qaValidPercent}%`,
      sub: 'Automated validation',
      Icon: ShieldCheck,
      tone: 'var(--color-accent-purple)',
      toneBg: 'rgba(99,102,241,0.1)',
    });
  }

  tiles.push({
    key: 'requests',
    label: 'Open Requests',
    value: String(openRequests),
    sub: openRequests > 0 ? 'Awaiting Datamatics' : 'Nothing outstanding',
    Icon: MessageSquareWarning,
    tone: openRequests > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
    toneBg: openRequests > 0 ? 'var(--color-warning-bg)' : 'var(--color-surface)',
    onClick: onOpenRequests,
  });

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map(tile => {
        const interactive = Boolean(tile.onClick);
        const Tag = interactive ? 'button' : 'div';

        return (
          <Tag
            key={tile.key}
            {...(interactive ? { type: 'button' as const, onClick: tile.onClick } : {})}
            className={`glass-card flex flex-col p-3.5 text-left ${
              interactive
                ? 'transition-colors hover:bg-[var(--color-primary-tint)] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                : ''
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: tile.toneBg }}
              >
                <tile.Icon className="h-3.5 w-3.5" style={{ color: tile.tone }} />
              </div>
              <span
                className="truncate text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {tile.label}
              </span>
            </div>

            <div
              className="text-[22px] font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {tile.value}
            </div>

            {tile.bar && (
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--color-border-light)' }}
              >
                {/* On the Pace tile the muted marker is elapsed time, so a
                    coloured bar short of it reads as "behind" at a glance. */}
                {tile.bar.trackPct !== undefined && (
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${tile.bar.trackPct}%`, background: 'var(--color-text-muted)', opacity: 0.35 }}
                  />
                )}
                <div
                  className="-mt-1.5 h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${tile.bar.pct}%`, background: tile.tone }}
                />
              </div>
            )}

            {tile.sub && (
              <div className="mt-1.5 truncate text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                {tile.sub}
              </div>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
