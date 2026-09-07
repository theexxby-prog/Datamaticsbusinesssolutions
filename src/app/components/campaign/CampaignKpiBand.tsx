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
  /** CSS colour token for the bar, and for the value on verdict tiles. */
  tone: string;
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
  /** Retail client view: keep the ops bookkeeping tiles (QA, requests) off this band. */
  hideOps?: boolean;
  onOpenRequests: () => void;
}

export function CampaignKpiBand({
  billable, cpl, delivered, target, progressPercent, acceptanceRate,
  timeElapsedPercent, paceColor, paceLabel, qaValidPercent, openRequests, onOpenRequests, hideOps,
}: CampaignKpiBandProps) {
  const remaining = Math.max(0, target - delivered);

  const tiles: Tile[] = [
    {
      key: 'billable',
      label: 'Total Billable',
      value: billable,
      sub: `${delivered.toLocaleString()} leads × ${cpl} CPL`,
      tone: 'var(--color-primary)',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      value: `${delivered.toLocaleString()} / ${target.toLocaleString()}`,
      sub: remaining > 0 ? `${remaining.toLocaleString()} to go · ${progressPercent}%` : `Target met · ${progressPercent}%`,
      // The only tile here whose bar is progress toward a target. Pace and
      // acceptance below carry verdicts, so they keep their semantic colours.
      tone: 'var(--color-progress)',
      bar: { pct: progressPercent },
    },
    {
      key: 'pace',
      label: 'Pace',
      value: paceLabel,
      sub: `${timeElapsedPercent}% of time · ${progressPercent}% delivered`,
      tone: paceColor,
      bar: { pct: progressPercent, trackPct: timeElapsedPercent },
    },
    {
      key: 'acceptance',
      label: 'Acceptance',
      value: `${acceptanceRate}%`,
      tone: 'var(--color-success)',
    },
  ];

  if (!hideOps && qaValidPercent !== undefined) {
    tiles.push({
      key: 'qa',
      label: 'QA Valid',
      value: `${qaValidPercent}%`,
      sub: 'Automated validation',
      tone: 'var(--color-accent-purple)',
    });
  }

  if (!hideOps) tiles.push({
    key: 'requests',
    label: 'Open Requests',
    value: String(openRequests),
    sub: openRequests > 0 ? 'Awaiting Datamatics' : 'Nothing outstanding',
    tone: openRequests > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
    onClick: onOpenRequests,
  });

  return (
    <div className="glass-card mb-5 overflow-hidden">
      {/* Hairline dividers come from the 1px gap over a border-coloured ground,
          so they work whatever column count the viewport gives the grid. */}
      <div
        className={`grid grid-cols-2 gap-px md:grid-cols-3 ${
          { 4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6' }[tiles.length] ?? 'xl:grid-cols-6'
        }`}
        style={{ background: 'var(--color-border-light)' }}
      >
        {tiles.map(tile => {
          const interactive = Boolean(tile.onClick);
          const Tag = interactive ? 'button' : 'div';

          return (
            <Tag
              key={tile.key}
              {...(interactive ? { type: 'button' as const, onClick: tile.onClick } : {})}
              className={`flex flex-col justify-center px-4 py-3 text-left ${
                interactive
                  ? 'transition-colors hover:bg-[var(--color-primary-tint)] active:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]'
                  : ''
              }`}
              style={{ background: 'var(--color-surface-raised)' }}
            >
              <span
                className="truncate text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {tile.label}
              </span>

              <span
                className="mt-1 text-xl font-bold leading-tight tabular-nums"
                style={{ color: tile.key === 'pace' || tile.key === 'requests' ? tile.tone : 'var(--color-text-primary)' }}
              >
                {tile.value}
              </span>

              {tile.bar && (
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--color-progress-track)' }}
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
                <span className="mt-1 truncate text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {tile.sub}
                </span>
              )}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
