import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, Flame, Globe, Link2 } from 'lucide-react';
import { ChartCard, TOOLTIP_STYLE } from '../ChartCard';
import { DataTable, type Column } from '../ui/DataTable';
import { useIsMobile } from '../ui/use-mobile';
import { getAccountEngagement, getWebsiteTrend, type AccountEngagement, type AccountWarmth } from '../../data/propensity';
import { formatDateShort } from '../../utils/formatDate';

// Account Engagement + Website Analytics: which target accounts are warming
// up, and how much of the web traffic Propensity's tracking script sees is
// in-ICP.

const WARMTH_META: Record<AccountWarmth, { label: string; bg: string; color: string }> = {
  hot: { label: 'Hot', bg: 'rgba(220,38,38,0.10)', color: 'var(--color-error)' },
  warm: { label: 'Warm', bg: 'rgba(217,119,6,0.12)', color: 'var(--color-warning)' },
  cool: { label: 'Cool', bg: 'rgba(100,116,139,0.12)', color: 'var(--color-text-secondary)' },
};


function WarmthPill({ warmth }: { warmth: AccountWarmth }) {
  const meta = WARMTH_META[warmth];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      {warmth === 'hot' && <Flame className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

export function AccountsSection() {
  const isMobile = useIsMobile();
  const accounts = getAccountEngagement();
  const web = getWebsiteTrend(30);

  const hot = accounts.filter(a => a.warmth === 'hot').length;
  const warm = accounts.filter(a => a.warmth === 'warm').length;
  const fromSynd = accounts.filter(a => a.sourcedFromSyndication).length;

  const columns: Column<AccountEngagement>[] = [
    {
      key: 'name', header: 'Account', icon: Building2, primary: true,
      widthClass: 'w-[45%] lg:w-[30%] xl:w-[26%]',
      sortValue: a => a.name, text: a => a.name,
      render: a => (
        <div className="min-w-0">
          <div className="truncate font-bold" style={{ color: 'var(--color-text-primary)' }}>{a.name}</div>
          <div className="truncate" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{a.industry} · {a.employeeSize}</div>
        </div>
      ),
    },
    {
      key: 'warmth', header: 'Warmth', widthClass: 'w-[25%] lg:w-[14%] xl:w-[11%]',
      sortValue: a => ({ hot: 2, warm: 1, cool: 0 }[a.warmth]), text: a => a.warmth,
      render: a => <WarmthPill warmth={a.warmth} />,
    },
    {
      key: 'intent', header: 'Signal', widthClass: 'w-[30%] lg:w-[18%] xl:w-[15%]',
      sortValue: a => a.intentScore, text: a => String(a.intentScore),
      render: a => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-[64px] overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${a.intentScore}%`, background: a.intentScore >= 80 ? 'var(--color-primary)' : '#3E5C8A' }}
            />
          </div>
          <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {a.intentScore}
          </span>
        </div>
      ),
      mobileRender: a => <span className="font-bold">{a.intentScore} / 100</span>,
    },
    {
      key: 'interactions', header: 'Ad + web', align: 'right',
      widthClass: 'hidden lg:table-cell lg:w-[22%] xl:w-[18%]',
      sortValue: a => a.adInteractions + a.webVisits, text: a => `${a.adInteractions + a.webVisits}`,
      render: a => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>
          {a.adInteractions} ads · {a.webVisits} visits
        </span>
      ),
    },
    {
      key: 'source', header: 'Source', mobileHidden: true, sortable: false,
      widthClass: 'hidden xl:table-cell xl:w-[15%]',
      render: a =>
        a.sourcedFromSyndication ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
          >
            <Link2 className="h-3 w-3" /> Syndication
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>ABM only</span>
        ),
    },
    {
      key: 'last', header: 'Last activity', align: 'right', mobileHidden: true,
      widthClass: 'hidden lg:table-cell lg:w-[16%] xl:w-[15%]',
      sortValue: a => a.lastActivity, text: a => a.lastActivity,
      render: a => <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{formatDateShort(a.lastActivity)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Warmth summary strip */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: `${hot} hot accounts`, bg: WARMTH_META.hot.bg, color: WARMTH_META.hot.color },
          { label: `${warm} warm accounts`, bg: WARMTH_META.warm.bg, color: WARMTH_META.warm.color },
          { label: `${fromSynd} sourced from syndication`, bg: 'var(--color-primary-tint)', color: 'var(--color-primary)' },
        ].map(chip => (
          <span
            key={chip.label}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: chip.bg, color: chip.color }}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={accounts}
        getRowId={a => a.accountId}
        layout="fixed"
        searchPlaceholder="Search accounts…"
        countLabel={n => `${n} target accounts`}
        empty={{ icon: Building2, title: 'No engaged accounts', description: 'Accounts appear once Propensity reports engagement.' }}
      />

      <ChartCard title="ICP website visitors" icon={Globe}>
        <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Visitors matched to your ICP by the Propensity tracking script vs total traffic · last 30 days
        </p>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <AreaChart data={web}>
            <defs>
              <linearGradient id="icpFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(120,140,170,0.18)" vertical={false} />
            <XAxis
              dataKey="date"
              style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              stroke="none"
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={formatDateShort}
            />
            <YAxis style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} stroke="none" tickLine={false} width={34} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v: string) => formatDateShort(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="totalVisitors" name="All visitors" stroke="#3E5C8A" strokeWidth={1.5} fill="transparent" />
            <Area type="monotone" dataKey="icpVisitors" name="ICP visitors" stroke="var(--color-primary)" strokeWidth={2} fill="url(#icpFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
