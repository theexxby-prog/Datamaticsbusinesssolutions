import { Grid3x3 } from 'lucide-react';
import { getAwarenessHeatmap, HEATMAP_CHANNELS } from '../../data/propensity';

// ─── Awareness heatmap ───────────────────────────────────────────────────────
// Accounts down the side, channels across the top, colour = impression density.
// The best visual on the consultant's dashboard, because it shows coverage and
// concentration at once: a row dark in one column and empty everywhere else is
// an account reached by exactly one channel, which is a different problem from
// an account not reached at all, and no bar chart separates those two.
//
// Intensity is banded rather than a continuous ramp, and that is a readability
// decision, not a stylistic one. A smooth opacity gradient puts text on an
// arbitrary background somewhere in the middle of the scale, which is precisely
// where contrast fails. Three bands mean three text/background pairs we can
// actually hold to AA: muted on the empty ground, primary text on the two
// tints, white on the solid brand fill (the sanctioned fixed pair).

const BANDS = [
  { max: 0, bg: 'var(--background-muted)', fg: 'var(--color-text-muted)' },
  { max: 0.3, bg: 'color-mix(in srgb, var(--color-primary-solid) 16%, transparent)', fg: 'var(--color-text-primary)' },
  { max: 0.6, bg: 'color-mix(in srgb, var(--color-primary-solid) 38%, transparent)', fg: 'var(--color-text-primary)' },
  { max: Infinity, bg: 'var(--color-primary-solid)', fg: '#FFFFFF' },
];

function bandFor(value: number, peak: number) {
  if (value === 0) return BANDS[0];
  const ratio = value / peak;
  return BANDS.find(b => ratio <= b.max) ?? BANDS[BANDS.length - 1];
}

function compact(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return n.toLocaleString('en-US');
}

export function AwarenessHeatmap({ abmCampaignId }: { abmCampaignId: string }) {
  const { rows, peak } = getAwarenessHeatmap(abmCampaignId);
  if (rows.length === 0) return null;

  const thin = rows.filter(r => r.channelsTouched === 1).length;

  return (
    <div className="glass-card p-5">
      <h3
        className="mb-1 flex items-center gap-2"
        style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
      >
        <Grid3x3 className="h-4 w-4" />
        Awareness by account and channel
      </h3>
      <p className="mb-4" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
        Impressions served to the eight highest-intent accounts. Darker means heavier exposure.
      </p>

      {/* Scrolls inside its own container so a narrow viewport never forces the
          whole page sideways. */}
      <div className="scroll-shadows -mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[520px] border-separate" style={{ borderSpacing: '2px' }}>
          <thead>
            <tr>
              <th className="w-[34%] text-left text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Account
              </th>
              {HEATMAP_CHANNELS.map(channel => (
                <th key={channel} className="text-center text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  {channel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.account} data-testid="heatmap-row" data-channels-touched={row.channelsTouched}>
                <td className="py-0.5 pr-2">
                  <div className="truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {row.account}
                  </div>
                  <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {row.industry}
                  </div>
                </td>
                {row.cells.map((value, i) => {
                  const band = bandFor(value, peak);
                  return (
                    <td key={HEATMAP_CHANNELS[i]} className="p-0">
                      <div
                        className="flex h-9 items-center justify-center rounded-md text-[11px] font-semibold"
                        style={{ background: band.bg, color: band.fg, fontVariantNumeric: 'tabular-nums' }}
                        title={`${row.account} · ${HEATMAP_CHANNELS[i]} · ${value.toLocaleString('en-US')} impressions`}
                      >
                        {value === 0 ? '—' : compact(value)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {thin > 0 && (
        <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {thin} of these {rows.length} accounts have been reached on one channel only.
        </p>
      )}
    </div>
  );
}
