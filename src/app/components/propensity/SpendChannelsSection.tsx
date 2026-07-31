import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Wallet, GitMerge } from 'lucide-react';
import { ChartCard, TOOLTIP_STYLE } from '../ChartCard';
import { useIsMobile } from '../ui/use-mobile';
import { getPdnSpend, getBlendedSpend } from '../../data/propensity';

// Daily PDN Spend by channel, and the blended view the crosswalk unlocks:
// programmatic (PDN) spend next to content-syndication spend with blended ROI.

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

function fmtShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CHANNELS = [
  { key: 'display', label: 'Display', color: 'var(--color-primary)' },
  { key: 'native', label: 'Native', color: '#3E5C8A' },
  { key: 'video', label: 'Video', color: 'var(--color-info)' },
  { key: 'ctv', label: 'CTV', color: 'var(--color-warning)' },
] as const;

export function SpendChannelsSection() {
  const isMobile = useIsMobile();
  const pdn = getPdnSpend(30);
  const blended = getBlendedSpend();

  return (
    <div className="space-y-4">
      <ChartCard title="Daily PDN spend by channel" icon={Wallet}>
        <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Media spend across Propensity Display Network channels · last 30 days
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
              tickFormatter={fmtShortDate}
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
              labelFormatter={(v: string) => fmtShortDate(v)}
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
          PDN media spend beside your syndication program spend, joined via the campaign crosswalk · blended ROI per month
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
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number, name: string) =>
                name === 'blendedRoi' ? [`${v}×`, 'Blended ROI'] : [fmtMoney(v), name === 'pdn' ? 'PDN (programmatic)' : 'Content syndication']}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v: string) => (v === 'pdn' ? 'PDN (programmatic)' : v === 'syndication' ? 'Content syndication' : 'Blended ROI')}
            />
            <Bar dataKey="pdn" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={44} />
            <Bar dataKey="syndication" fill="#3E5C8A" radius={[3, 3, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {blended.map(m => (
            <span key={m.month} style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {m.month}: blended ROI{' '}
              <span className="font-bold" style={{ color: 'var(--color-success)' }}>{m.blendedRoi}×</span>
            </span>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
