import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, CheckCircle, AlertTriangle, Download,
  Share2, BarChart3, Activity, Zap, Filter,
  Globe, Building2, IdCard
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { toDemographics, type CampaignStatus } from '../data/demographics';
import { reportCampaigns, entryForSelection, metricsForSelection } from '../data/reportCampaigns';
import { getPortalClient } from '../data/unionClient';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { UnifiedKpiCard } from '../components/UnifiedKpiCard';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExportModal } from '../components/ExportModal';
import { ProgressBar } from '../components/ProgressBar';
import { motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { useIsMobile } from '../components/ui/use-mobile';
import { TOOLTIP_STYLE, CHART_COLORS } from '../components/ChartCard';
import { DistributionBars } from '../components/DistributionBars';

// Compact Chart Card
// Account-level billable, trailing 12 months + same month prior year (YoY).
// Mocked for the demo; the backend supplies real figures and should set
// `prev` to null for months with no prior-year history (chart degrades to
// a single series automatically — see hasPrevYear).
const BILLABLE_TREND_12 = [
  { label: 'Jul', current: 16000, prev: 12000 },
  { label: 'Aug', current: 18500, prev: 13500 },
  { label: 'Sep', current: 21000, prev: 15000 },
  { label: 'Oct', current: 23000, prev: 16500 },
  { label: 'Nov', current: 26000, prev: 18000 },
  { label: 'Dec', current: 28000, prev: 19500 },
  { label: 'Jan', current: 27000, prev: 18500 },
  { label: 'Feb', current: 31000, prev: 21000 },
  { label: 'Mar', current: 34000, prev: 23000 },
  { label: 'Apr', current: 39000, prev: 25500 },
  { label: 'May', current: 43500, prev: 28000 },
  { label: 'Jun', current: 48250, prev: 31000 },
];

// ChartCard and the horizontal-bar distribution card both live in shared
// components now (components/ChartCard.tsx, components/DistributionBars.tsx)
// so the Programmatic dashboards and Reports share one treatment.

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  // Responds to rotation/resize, unlike the old module-scope constant.
  const chartH = isMobile ? 200 : 240;
  const [dateRange, setDateRange] = useState('30days');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [scope, setScope] = useState<CampaignStatus>('active');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Campaign-specific data

  // The drill-down is built from the client's own campaigns. It used to come
  // from REPORT_CAMPAIGNS — four hardcoded legacy keys — so every client, UNION
  // included, was offered another client's campaign names, and selecting one
  // missed the metrics table and silently fell back to the all-campaigns row.
  const portalCampaigns = getPortalClient(currentUser)?.campaigns ?? [];
  const scoped = reportCampaigns(portalCampaigns, scope);

  // Switching scope can strand a selection that no longer exists in it.
  const selection = scoped.some(c => c.key === selectedCampaign) ? selectedCampaign : 'all';

  const currentMetrics = metricsForSelection(selection, scoped);

  // Geo/Industry/Size/Title: ops-entered data where it exists, otherwise
  // derived per campaign. 'all' is the true sum of the scoped campaigns.
  const entry = entryForSelection(selection, scoped);
  const demographics = toDemographics(entry);
  const pacing = entry.pacing;
  const pacingPct = pacing.monthTarget > 0 ? Math.round((pacing.monthDelivered / pacing.monthTarget) * 100) : 0;

  const scopedCampaigns = scoped
    .map(c => c.key)
    .filter(c => c.toLowerCase().includes(search.trim().toLowerCase()));

  // KPI movement vs the previous month in the series.
  const md = currentMetrics.monthlyData || [];
  const pctChange = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);
  const leadDelta = md.length >= 2 ? pctChange(md[md.length - 1].leads, md[md.length - 2].leads) : 0;
  const revDelta = md.length >= 2 ? pctChange(md[md.length - 1].revenue, md[md.length - 2].revenue) : 0;
  const convDelta = md.length >= 2 ? pctChange(md[md.length - 1].conversions, md[md.length - 2].conversions) : 0;
  // Acceptance has no prior-period value in the mock series (monthlyData carries
  // leads/revenue/conversions only), so the movement stays a fixed +2 pts until the
  // backend supplies a prior acceptance rate. Rendered through the same signed
  // conditional as its neighbours so it flips arrow + colour once it's real.
  const acceptanceDelta = 2;
  const reduce = useReducedMotion();

  // Account-level billable trend (trailing 12 months + prior year). This is the
  // total billing relationship, so it is intentionally independent of the campaign
  // scope / search / period filters below. hasPrevYear hides the prior-year series
  // (and its legend) when the backend reports no comparable history.
  const billableTrend = BILLABLE_TREND_12;
  const hasPrevYear = billableTrend.some((d) => (d.prev ?? 0) > 0);

  // Lead quality split for the accepted-vs-rejected bar.
  const acceptedPct = currentMetrics.acceptance;
  const rejectedPct = Math.round((100 - acceptedPct) * 10) / 10;
  const rejectedCount = Math.round((currentMetrics.totalLeads * (100 - acceptedPct)) / 100);

  // getPortalClient applies the brand's campaign renaming, so portalCampaigns
  // above is safe to read on a UNION login.
  const activeCampaigns = portalCampaigns.filter(c => c.status === 'active').length;
  const completedCount = portalCampaigns.filter(c => c.status === 'completed').length;
  const totalCampaigns = activeCampaigns + completedCount;
  const pausedCampaigns = 0;

  // Snapshot of exactly what the client sees, handed to the export modal so the
  // PDF/CSV/XLSX match this page (KPIs, pacing, 12-mo YoY trend, demographics).
  const reportData = {
    clientName: currentUser?.company || currentUser?.name || 'Client',
    asOf: 'Jun 14, 2026',
    scope: scope.charAt(0).toUpperCase() + scope.slice(1),
    campaignLabel: selection === 'all' ? `All ${scope} campaigns` : selection,
    kpis: [
      { label: 'Total Leads', value: currentMetrics.totalLeads.toLocaleString(), delta: `${leadDelta >= 0 ? '▲' : '▼'} ${Math.abs(leadDelta)}%`, up: leadDelta >= 0 },
      { label: 'Acceptance', value: `${currentMetrics.acceptance}%`, delta: `${acceptanceDelta >= 0 ? '▲' : '▼'} ${Math.abs(acceptanceDelta)} pts`, up: acceptanceDelta >= 0 },
      { label: 'Conversions', value: String(currentMetrics.conversions), delta: `${convDelta >= 0 ? '▲' : '▼'} ${Math.abs(convDelta)}%`, up: convDelta >= 0 },
      { label: 'Billable', value: `$${(currentMetrics.revenue / 1000).toFixed(0)}K`, delta: `${revDelta >= 0 ? '▲' : '▼'} ${Math.abs(revDelta)}%`, up: revDelta >= 0 },
      { label: 'Campaigns', value: `${activeCampaigns} active · ${completedCount} completed` },
    ],
    pacing: { delivered: pacing.monthDelivered, target: pacing.monthTarget, pct: pacingPct, onTrack: pacingPct >= 60 },
    trend: billableTrend,
    hasPrevYear,
    demographics: [
      { title: 'Geographic Distribution', rows: demographics.geo },
      { title: 'Industry Distribution', rows: demographics.industry },
      { title: 'Title Distribution', rows: demographics.title },
      { title: 'Company Size', rows: demographics.size },
    ],
    conversion: { sent: currentMetrics.totalLeads, accepted: currentMetrics.totalLeads - rejectedCount, acceptedPct, rejectedPct },
  };

  return (
    <>
      <div className={`max-w-[1440px] mx-auto page-content animate-fadeIn`}>
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 style={{ color: 'var(--color-text-primary)' }}>Reports & Analytics</h1>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Performance insights and data visualizations
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 font-bold shadow-md"
            >
              <Download className="w-4 h-4" />
              Export report
            </button>
          </div>
        </div>

        {/* Account-level billing overview — sits above (and independent of) the
            campaign filters. Uses the standard card treatment (.glass-card) so it
            follows the theme instead of a bespoke slate wash tuned for the old brand. */}
        <Reveal>
        <div className="glass-card p-5 mb-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h3
              className="flex items-center gap-2"
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-bold)' as any,
                color: 'var(--color-text-primary)',
              }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              Billing Trend
            </h3>
            <div
              className="flex items-center gap-4"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
            >
              {hasPrevYear && (
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--chart-cat-2)', display: 'inline-block' }} />
                  Last year
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--chart-cat-1)', display: 'inline-block' }} />
                This year
              </span>
            </div>
          </div>
          <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Across all campaigns · last 12 months{hasPrevYear ? ' vs prior year' : ''}
          </p>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={billableTrend} barGap={3} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} stroke="none" tickLine={false} />
              <YAxis
                style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                stroke="none"
                tickLine={false}
                width={44}
                tickFormatter={(v: any) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} />
              {hasPrevYear && <Bar dataKey="prev" name="Last year" fill="var(--chart-cat-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />}
              <Bar dataKey="current" name="This year" fill="var(--chart-cat-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </Reveal>

        {/* Filters: scope + search + period */}
        <div className="glass-card p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Active / Completed scope */}
              <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                {(['active', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setScope(s); setSelectedCampaign('all'); }}
                    className="px-4 py-2 text-sm font-semibold capitalize transition-colors"
                    style={{
                      background: scope === s ? 'var(--color-primary-solid)' : 'transparent',
                      color: scope === s ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns…"
                  className="input-base pl-9 pr-4 py-2.5 w-56"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                />
              </div>
              {/* Campaign drill-down (scoped) */}
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="input-base px-4 py-2.5"
                style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}
              >
                <option value="all">All {scope} campaigns</option>
                {scopedCampaigns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {/* Period */}
              <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                {(['month', 'quarter', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-4 py-2 text-sm font-semibold capitalize transition-colors"
                    style={{
                      background: period === p ? 'var(--color-primary-solid)' : 'transparent',
                      color: period === p ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span className="text-xs flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--background-muted)' }}>
                <Activity className="w-3.5 h-3.5" /> Data as of Jun 14
              </span>
            </div>
          </div>
        </div>

        {/* KPI summary */}
        <Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4 stagger-children">
          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <Target className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>{currentMetrics.totalLeads.toLocaleString()}</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Total Leads</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: leadDelta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{leadDelta >= 0 ? '▲' : '▼'} {Math.abs(leadDelta)}% vs last mo</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>{currentMetrics.acceptance}%</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Acceptance</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: acceptanceDelta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{acceptanceDelta >= 0 ? '▲' : '▼'} {Math.abs(acceptanceDelta)} pts</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>{currentMetrics.conversions}</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Conversions</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: convDelta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{convDelta >= 0 ? '▲' : '▼'} {Math.abs(convDelta)}% vs last mo</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>${(currentMetrics.revenue / 1000).toFixed(0)}K</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Billable</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: revDelta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{revDelta >= 0 ? '▲' : '▼'} {Math.abs(revDelta)}% vs last mo</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <Activity className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>
              {activeCampaigns}<span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}> active</span>
            </div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Campaigns</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{completedCount} completed</div>
          </div>
        </div>
        </Reveal>

        {/* Delivery vs target + Conversion — paired on one row */}
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Delivery against target for the selection */}
            <div className="glass-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  <Target className="w-4 h-4 text-[var(--color-primary)]" /> Delivery vs Target
                </h3>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  style={{
                    background: pacingPct >= 60 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                    color: pacingPct >= 60 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  {pacingPct >= 60 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {pacingPct >= 60 ? 'On track' : 'Behind pace'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2.5">
                <span style={{ fontSize: '30px', lineHeight: 1, fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  {pacing.monthDelivered.toLocaleString()}
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  / {pacing.monthTarget.toLocaleString()} target · {pacingPct}%
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full overflow-hidden mt-auto" style={{ background: 'var(--color-progress-track)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--color-progress)' }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${Math.min(100, pacingPct)}%` }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex gap-5 mt-2.5" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--color-progress)' }} />Delivered {pacingPct}%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border" style={{ background: 'var(--background-muted)', borderColor: 'var(--color-border)' }} />Remaining {Math.max(0, 100 - pacingPct)}%</span>
              </div>
            </div>

            {/* Conversion — same template as Pacing so the pair reads symmetric */}
            <div className="glass-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" /> Conversion
                </h3>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  style={{
                    background: acceptedPct >= 80 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                    color: acceptedPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  {acceptedPct >= 80 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {acceptedPct >= 80 ? 'Healthy' : 'Needs review'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2.5">
                <span style={{ fontSize: '30px', lineHeight: 1, fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  {(currentMetrics.totalLeads - rejectedCount).toLocaleString()}
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  / {currentMetrics.totalLeads.toLocaleString()} sent · {acceptedPct}%
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full overflow-hidden mt-auto" style={{ background: 'var(--background-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--color-success)' }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${acceptedPct}%` }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex gap-5 mt-2.5" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--color-success)' }} />Accepted {acceptedPct}%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border" style={{ background: 'var(--background-muted)', borderColor: 'var(--color-border)' }} />Not accepted {rejectedPct}%</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Lead Demographics — all four dimensions as consistent bars */}
        <Reveal>
        <div className="mt-4">
          <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }} className="mb-3">
            Lead Demographics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chips are decorative dimension markers, so they walk the categorical
                ramp in order — no status meaning implied. */}
            <DistributionBars title="Geographic Distribution" data={demographics.geo} icon={Globe} chipBg="color-mix(in srgb, var(--chart-cat-1) 12%, transparent)" chipColor="var(--chart-cat-1)" />
            <DistributionBars title="Industry Distribution" data={demographics.industry} icon={Building2} chipBg="color-mix(in srgb, var(--chart-cat-2) 12%, transparent)" chipColor="var(--chart-cat-2)" />
            <DistributionBars title="Title Distribution" data={demographics.title} icon={IdCard} chipBg="color-mix(in srgb, var(--chart-cat-3) 12%, transparent)" chipColor="var(--chart-cat-3)" />
            <DistributionBars title="Company Size" data={demographics.size} icon={Users} chipBg="color-mix(in srgb, var(--chart-cat-4) 12%, transparent)" chipColor="var(--chart-cat-4)" />
          </div>
        </div>
        </Reveal>

      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportData={reportData}
      />
    </>
  );
}