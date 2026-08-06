import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Wallet, GitMerge } from 'lucide-react';
import { ChartCard, TOOLTIP_STYLE } from '../ChartCard';
import { useIsMobile } from '../ui/use-mobile';
import { getPdnSpend, getBlendedSpend } from '../../data/propensity';
import { formatMoney as fmtMoney } from '../../utils/format';
import { formatDateShort } from '../../utils/formatDate';

// Daily PDN Spend by channel, and the blended view the crosswalk unlocks:
// programmatic (PDN) spend next to content-syndication spend with blended ROI.



// The real media channels the buy runs across. Keys must match PdnSpendDay in
// data/propensity.ts — recharts resolves dataKey loosely, so a mismatch renders
// empty bars rather than failing the build. Order is load-bearing: the last
// entry gets the rounded top of the stack.
const CHANNELS = [
  { key: 'linkedin', label: 'LinkedIn', color: 'var(--color-primary)' },
  { key: 'meta', label: 'Meta', color: 'var(--color-chart-2)' },
  { key: 'reddit', label: 'Reddit', color: 'var(--color-warning)' },
  { key: 'youtube', label: 'YouTube', color: 'var(--color-error)' },
  { key: 'pdn', label: 'PDN', color: 'var(--color-info)' },
] as const;

export function SpendChannelsSection() {
  const isMobile = useIsMobile();
  const pdn = getPdnSpend(30);
  const blended = getBlendedSpend();

  return (
    <div className="space-y-4">
      <ChartCard title="Daily spend by channel" icon={Wallet}>
        <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Media spend across social, video and the Propensity Display Network · last 30 days
        </p>
        <ResponsiveContainer width="100%" height={isMobile ? 190 : 240}>
          <BarChart data={pdn} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="0" stroke="rgba(120,140,170,0.18)" vertical={false} />
            <XAxis
              dataKey="date"
              style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              stroke="none"
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={formatDateShort}
            />
            <YAxis
              style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              stroke="none"
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number, name: string) => [fmtMoney(v), CHANNELS.find(c => c.key === name)?.label ?? name]}
              labelFormatter={(v: string) => formatDateShort(v)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => CHANNELS.find(c => c.key === v)?.label ?? v} />
            {CHANNELS.map((c, i) => (
              <Bar
                key={c.key}
                dataKey={c.key}
                stackId="pdn"
                fill={c.color}
                radius={i === CHANNELS.length - 1 ? [3, 3, 0, 0] : undefined}
                maxBarSize={22}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Programmatic vs content syndication spend" icon={GitMerge}>
        <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          PDN media spend beside your syndication program spend, joined via the campaign crosswalk · monthly
        </p>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <BarChart data={blended} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="0" stroke="rgba(120,140,170,0.18)" vertical={false} />
            <XAxis dataKey="month" style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} stroke="none" tickLine={false} />
            <YAxis
              style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              stroke="none"
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
            />
            {/* Blended ROI is no longer shown to clients — leadership pulled
                the figure from the client render pending a methodology review. */}
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number, name: string) =>
                [fmtMoney(v), name === 'pdn' ? 'PDN (programmatic)' : 'Content syndication']}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v: string) => (v === 'pdn' ? 'PDN (programmatic)' : 'Content syndication')}
            />
            <Bar dataKey="pdn" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={44} />
            <Bar dataKey="syndication" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
