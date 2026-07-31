import { useNavigate } from 'react-router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Layers, Link2, Activity, CalendarClock } from 'lucide-react';
import { ChartCard, TOOLTIP_STYLE } from '../ChartCard';
import { DataTable, type Column } from '../ui/DataTable';
import { ProgressBar } from '../ProgressBar';
import { useIsMobile } from '../ui/use-mobile';
import {
  getAbmSummary,
  getRoiTrend,
  getCrosswalkForAbm,
  type AbmCampaign,
} from '../../data/propensity';
import { formatMoney as fmtMoney } from '../../utils/format';
import { formatDate, formatDateShort } from '../../utils/formatDate';

// Executive ABM overview: roster of unarchived campaigns (Campaign Summary
// endpoint), day-over-day ROI (ROI Analytics), and pacing (Campaign Pacing) —
// each roster row carries the syndication campaign it supports via the
// crosswalk, tap-through to that campaign's detail page.



export function ExecutiveOverviewSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const campaigns = getAbmSummary();
  const roiTrend = getRoiTrend(90);

  const columns: Column<AbmCampaign>[] = [
    {
      key: 'name', header: 'ABM campaign', icon: Layers, primary: true,
      widthClass: 'w-[40%] lg:w-[24%] xl:w-[20%] 2xl:w-[17%]',
      sortValue: c => c.name, text: c => c.name,
      render: c => <div className="truncate font-bold" style={{ color: 'var(--color-text-primary)' }} title={c.name}>{c.name}</div>,
    },
    {
      key: 'linked', header: 'Supports', icon: Link2, sortable: false,
      widthClass: 'hidden lg:table-cell lg:w-[16%] xl:w-[15%] 2xl:w-[13%]',
      render: c => {
        const xw = getCrosswalkForAbm(c.id);
        if (!xw) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              navigate(`/campaigns/${xw.syndicationCampaignId}`);
            }}
            className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-[var(--color-primary)]/[0.16]"
            style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
            title={`Content syndication: ${xw.syndicationCampaignName}`}
          >
            <Link2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{xw.syndicationCampaignName}</span>
          </button>
        );
      },
    },
    {
      key: 'spend', header: 'Spend', align: 'right',
      widthClass: 'w-[38%] lg:w-[24%] xl:w-[20%] 2xl:w-[17%]',
      sortValue: c => c.spendToDate, text: c => fmtMoney(c.spendToDate),
      render: c => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{fmtMoney(c.spendToDate)}</span>
          <span style={{ color: 'var(--color-text-muted)' }}> / {fmtMoney(c.budget)}</span>
        </span>
      ),
    },
    {
      key: 'pacing', header: 'Pacing', icon: Activity, sortValue: c => c.pacingPct, sortable: true,
      widthClass: 'hidden lg:table-cell lg:w-[25%] xl:w-[20%] 2xl:w-[17%]',
      render: c => (
        <div>
          <ProgressBar
            label=""
            value={`${c.pacingPct}%`}
            percentage={Math.min(c.pacingPct, 100)}
            showBadge={false}
          />
        </div>
      ),
      mobileRender: c => <span className="font-bold">{c.pacingPct}% of plan</span>,
    },
    {
      key: 'engaged', header: 'Accounts', align: 'right',
      widthClass: 'hidden xl:table-cell xl:w-[15%] 2xl:w-[11%]',
      sortValue: c => c.engagedAccounts, text: c => String(c.engagedAccounts),
      render: c => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{c.engagedAccounts}</span>
          <span style={{ color: 'var(--color-text-muted)' }}> / {c.goalAccounts}</span>
        </span>
      ),
    },
    {
      key: 'roi', header: 'ROI', align: 'right', widthClass: 'w-[22%] lg:w-[11%] xl:w-[10%] 2xl:w-[8%]',
      sortValue: c => c.roi, text: c => `${c.roi}x`,
      render: c => (
        <span className="font-bold" style={{ color: c.roi >= 2.5 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
          {c.roi.toFixed(1)}×
        </span>
      ),
    },
    {
      key: 'dates', header: 'Flight', icon: CalendarClock, align: 'right', mobileHidden: true,
      widthClass: 'hidden 2xl:table-cell 2xl:w-[17%]',
      sortValue: c => c.endDate, text: c => c.endDate,
      render: c => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {formatDate(c.startDate)} – {formatDate(c.endDate)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ChartCard title="ROI trend — day over day" icon={TrendingUp}>
        <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Pipeline value returned per media dollar across all ABM campaigns · last 90 days
        </p>
        <ResponsiveContainer width="100%" height={isMobile ? 190 : 240}>
          <AreaChart data={roiTrend}>
            <defs>
              <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
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
              tickFormatter={(v: string) => formatDateShort(v)}
            />
            <YAxis
              style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              stroke="none"
              tickLine={false}
              width={34}
              tickFormatter={(v: number) => `${v}x`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number, name: string) =>
                name === 'roi' ? [`${v}×`, 'ROI'] : [fmtMoney(v), name === 'spend' ? 'Spend' : 'Pipeline']}
              labelFormatter={(v: string) => formatDate(v)}
            />
            <Area type="monotone" dataKey="roi" stroke="var(--color-primary)" strokeWidth={2} fill="url(#roiFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable
        columns={columns}
        rows={campaigns}
        getRowId={c => c.id}
        layout="fixed"
        searchable={false}
        countLabel={n => `${n} active ABM campaign${n === 1 ? '' : 's'}`}
        empty={{ icon: Layers, title: 'No ABM campaigns', description: 'Campaigns appear here once Propensity reports them.' }}
      />
    </div>
  );
}
