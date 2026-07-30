import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, CheckCircle, Download,
  Share2, BarChart3, Activity, Zap, Filter,
  Globe, Building2, IdCard
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getCampaignDemographics, getPacing, campaignsForScope, type CampaignStatus } from '../data/demographics';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { UnifiedKpiCard } from '../components/UnifiedKpiCard';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExportModal } from '../components/ExportModal';
import { ProgressBar } from '../components/ProgressBar';
import { motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../components/Reveal';

const CHART_COLORS = ['var(--color-primary)', 'var(--color-primary-light)', 'var(--color-error)', 'var(--color-info)', 'var(--color-success)', 'var(--color-warning)'];
const CHART_H = typeof window !== 'undefined' && window.innerWidth < 640 ? 160 : 240;
const CHART_H_SM = typeof window !== 'undefined' && window.innerWidth < 640 ? 140 : 220;

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--color-text-primary)',
  boxShadow: 'var(--shadow-md)',
  padding: '8px'
};

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

function ChartCard({ title, children, actions }: any) {
  return (
    <div className="glass-card p-4 transition-all hover:shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
          <BarChart3 className="w-4 h-4" />
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

// Uniform horizontal-bar card for a distribution dimension (geo/industry/size/title).
// Single brand color, length encodes value — no rainbow, consistent across all four.
function DemoBars({ title, data, chipBg, chipColor, icon: Icon }: any) {
  const reduce = useReducedMotion();
  const maxPct = data && data.length ? data[0].percentage || 1 : 1;
  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
        <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 24, height: 24, background: chipBg, color: chipColor }}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        {title}
      </h3>
      {(!data || data.length === 0) ? (
        <div className="text-sm py-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>No data entered yet.</div>
      ) : (
        <div>
          {data.map((d: any, i: number) => (
            <div key={d.name} className="flex items-center gap-3 my-2">
              <span className="text-xs flex-shrink-0 truncate" style={{ width: 116, color: 'var(--color-text-secondary)' }}>{d.name}</span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--background-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: i === 0 ? 'var(--color-primary)' : '#3E5C8A' }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${Math.max(3, Math.round((d.percentage / maxPct) * 100))}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                />
              </div>
              <span className="text-xs font-semibold text-right flex-shrink-0" style={{ width: 46, color: 'var(--color-text-primary)' }}>{d.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [dateRange, setDateRange] = useState('30days');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [scope, setScope] = useState<CampaignStatus>('active');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Campaign-specific data
  const campaignMetrics: Record<string, any> = {
    'all': {
      totalLeads: 1265,
      acceptance: 93,
      conversions: 168,
      revenue: 198250,
      activeCampaigns: 3,
      completedCampaigns: 1,
      monthlyData: [
        { month: 'Jan', revenue: 18000, leads: 350, conversions: 65 },
        { month: 'Feb', revenue: 24500, leads: 520, conversions: 95 },
        { month: 'Mar', revenue: 29000, leads: 680, conversions: 115 },
        { month: 'Apr', revenue: 36500, leads: 820, conversions: 142 },
        { month: 'May', revenue: 42000, leads: 1050, conversions: 185 },
        { month: 'Jun', revenue: 48250, leads: 1280, conversions: 224 },
      ],
      titleDistribution: [
        { title: 'C-Level', percentage: 18 },
        { title: 'VP/Director', percentage: 30 },
        { title: 'Manager', percentage: 24 },
        { title: 'Senior Specialist', percentage: 18 },
        { title: 'Other', percentage: 10 }
      ],
      companySizeData: [
        { size: 'Enterprise (10K+)', percentage: 24 },
        { size: 'Large (1K-10K)', percentage: 30 },
        { size: 'Mid-Market', percentage: 30 },
        { size: 'SMB (<100)', percentage: 16 }
      ]
    },
    'IT Security': {
      totalLeads: 320,
      acceptance: 88,
      conversions: 45,
      revenue: 52000,
      activeCampaigns: 1,
      completedCampaigns: 0,
      monthlyData: [
        { month: 'Jan', revenue: 5000, leads: 80, conversions: 12 },
        { month: 'Feb', revenue: 7200, leads: 105, conversions: 18 },
        { month: 'Mar', revenue: 9500, leads: 135, conversions: 24 },
        { month: 'Apr', revenue: 10800, leads: 160, conversions: 28 },
        { month: 'May', revenue: 11500, leads: 185, conversions: 32 },
        { month: 'Jun', revenue: 8000, leads: 95, conversions: 16 },
      ],
      titleDistribution: [
        { title: 'C-Level', percentage: 35 },
        { title: 'VP/Director', percentage: 30 },
        { title: 'Manager', percentage: 20 },
        { title: 'Senior Specialist', percentage: 10 },
        { title: 'Other', percentage: 5 }
      ],
      companySizeData: [
        { size: 'Enterprise (10K+)', percentage: 45 },
        { size: 'Large (1K-10K)', percentage: 35 },
        { size: 'Mid-Market', percentage: 15 },
        { size: 'SMB (<100)', percentage: 5 }
      ]
    },
    'Healthcare Synd.': {
      totalLeads: 850,
      acceptance: 95,
      conversions: 95,
      revenue: 128000,
      activeCampaigns: 1,
      completedCampaigns: 0,
      monthlyData: [
        { month: 'Jan', revenue: 12000, leads: 240, conversions: 42 },
        { month: 'Feb', revenue: 15800, leads: 350, conversions: 62 },
        { month: 'Mar', revenue: 17200, leads: 480, conversions: 78 },
        { month: 'Apr', revenue: 22500, leads: 580, conversions: 98 },
        { month: 'May', revenue: 28000, leads: 780, conversions: 135 },
        { month: 'Jun', revenue: 32500, leads: 1050, conversions: 178 },
      ],
      titleDistribution: [
        { title: 'C-Level', percentage: 12 },
        { title: 'VP/Director', percentage: 28 },
        { title: 'Manager', percentage: 35 },
        { title: 'Senior Specialist', percentage: 20 },
        { title: 'Other', percentage: 5 }
      ],
      companySizeData: [
        { size: 'Enterprise (10K+)', percentage: 70 },
        { size: 'Large (1K-10K)', percentage: 20 },
        { size: 'Mid-Market', percentage: 8 },
        { size: 'SMB (<100)', percentage: 2 }
      ]
    },
    'Financial BANT': {
      totalLeads: 65,
      acceptance: 92,
      conversions: 18,
      revenue: 12500,
      activeCampaigns: 1,
      completedCampaigns: 0,
      monthlyData: [
        { month: 'Jan', revenue: 800, leads: 15, conversions: 5 },
        { month: 'Feb', revenue: 1200, leads: 28, conversions: 8 },
        { month: 'Mar', revenue: 2000, leads: 35, conversions: 10 },
        { month: 'Apr', revenue: 2500, leads: 42, conversions: 12 },
        { month: 'May', revenue: 3000, leads: 52, conversions: 15 },
        { month: 'Jun', revenue: 3000, leads: 65, conversions: 18 },
      ],
      titleDistribution: [
        { title: 'C-Level', percentage: 69 },
        { title: 'VP/Director', percentage: 20 },
        { title: 'Manager', percentage: 8 },
        { title: 'Senior Specialist', percentage: 2 },
        { title: 'Other', percentage: 1 }
      ],
      companySizeData: [
        { size: 'Enterprise (10K+)', percentage: 85 },
        { size: 'Large (1K-10K)', percentage: 12 },
        { size: 'Mid-Market', percentage: 3 },
        { size: 'SMB (<100)', percentage: 0 }
      ]
    },
    'SaaS Appts': {
      totalLeads: 30,
      acceptance: 89,
      conversions: 10,
      revenue: 5750,
      activeCampaigns: 0,
      completedCampaigns: 1,
      monthlyData: [
        { month: 'Jan', revenue: 200, leads: 5, conversions: 1 },
        { month: 'Feb', revenue: 300, leads: 8, conversions: 2 },
        { month: 'Mar', revenue: 300, leads: 10, conversions: 3 },
        { month: 'Apr', revenue: 700, leads: 12, conversions: 4 },
        { month: 'May', revenue: 2500, leads: 18, conversions: 6 },
        { month: 'Jun', revenue: 1750, leads: 30, conversions: 10 },
      ],
      titleDistribution: [
        { title: 'C-Level', percentage: 72 },
        { title: 'VP/Director', percentage: 22 },
        { title: 'Manager', percentage: 6 },
        { title: 'Senior Specialist', percentage: 0 },
        { title: 'Other', percentage: 0 }
      ],
      companySizeData: [
        { size: 'Enterprise (10K+)', percentage: 50 },
        { size: 'Large (1K-10K)', percentage: 30 },
        { size: 'Mid-Market', percentage: 15 },
        { size: 'SMB (<100)', percentage: 5 }
      ]
    }
  };

  const currentMetrics = campaignMetrics[selectedCampaign] || campaignMetrics['all'];

  // Geo/Industry/Size/Title — manually entered via the Demographics module,
  // computed (and scope-aggregated for 'all') from the demographics store.
  const demographics = getCampaignDemographics(selectedCampaign, scope);
  const pacing = getPacing(selectedCampaign, scope);
  const pacingPct = pacing.monthTarget > 0 ? Math.round((pacing.monthDelivered / pacing.monthTarget) * 100) : 0;

  // Campaigns matching the chosen scope + search, for the drill-down dropdown.
  const scopedCampaigns = campaignsForScope(scope).filter((c) =>
    c.toLowerCase().includes(search.trim().toLowerCase()),
  );

  // KPI movement vs the previous month in the series.
  const md = currentMetrics.monthlyData || [];
  const pctChange = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);
  const leadDelta = md.length >= 2 ? pctChange(md[md.length - 1].leads, md[md.length - 2].leads) : 0;
  const revDelta = md.length >= 2 ? pctChange(md[md.length - 1].revenue, md[md.length - 2].revenue) : 0;
  const convDelta = md.length >= 2 ? pctChange(md[md.length - 1].conversions, md[md.length - 2].conversions) : 0;
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

  // Get active and completed counts
  const activeCampaigns = currentMetrics.activeCampaigns;
  const completedCount = currentMetrics.completedCampaigns;
  const totalCampaigns = activeCampaigns + completedCount;
  const pausedCampaigns = 0;

  // Snapshot of exactly what the client sees, handed to the export modal so the
  // PDF/CSV/XLSX match this page (KPIs, pacing, 12-mo YoY trend, demographics).
  const reportData = {
    clientName: currentUser?.company || currentUser?.name || 'Client',
    asOf: 'Jun 14, 2026',
    scope: scope.charAt(0).toUpperCase() + scope.slice(1),
    campaignLabel: selectedCampaign === 'all' ? `All ${scope} campaigns` : selectedCampaign,
    kpis: [
      { label: 'Total Leads', value: currentMetrics.totalLeads.toLocaleString(), delta: `${leadDelta >= 0 ? '▲' : '▼'} ${Math.abs(leadDelta)}%`, up: leadDelta >= 0 },
      { label: 'Acceptance', value: `${currentMetrics.acceptance}%`, delta: '▲ 2 pts', up: true },
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
    <AppLayout>
      <div className={`max-w-[1120px] mx-auto page-content animate-fadeIn`}>
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
              className="btn-primary px-3 py-2 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Account-level billing overview — sits above (and independent of) the
            campaign filters. Slate-washed surface so it reads as its own section
            and doesn't get lost among the white analytics cards. */}
        <Reveal>
        <div
          className="rounded-2xl p-5 mb-4 animate-fadeIn"
          style={{
            background:
              'linear-gradient(135deg, rgba(62,92,138,0.13), rgba(62,92,138,0.05))',
            border: '1px solid rgba(62,92,138,0.22)',
            boxShadow: '0 10px 30px rgba(30,45,73,0.10)',
          }}
        >
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
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: '#E0A8AB', display: 'inline-block' }} />
                  Last year
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--color-primary)', display: 'inline-block' }} />
                This year
              </span>
            </div>
          </div>
          <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Across all campaigns · last 12 months{hasPrevYear ? ' vs prior year' : ''}
          </p>
          <ResponsiveContainer width="100%" height={CHART_H}>
            <BarChart data={billableTrend} barGap={3} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="0" stroke="rgba(120,140,170,0.18)" vertical={false} />
              <XAxis dataKey="label" style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} stroke="none" tickLine={false} />
              <YAxis
                style={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                stroke="none"
                tickLine={false}
                width={44}
                tickFormatter={(v: any) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} />
              {hasPrevYear && <Bar dataKey="prev" name="Last year" fill="#E0A8AB" radius={[4, 4, 0, 0]} maxBarSize={22} />}
              <Bar dataKey="current" name="This year" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={22} />
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
                      background: scope === s ? 'var(--color-primary)' : 'transparent',
                      color: scope === s ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
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
                      background: period === p ? 'var(--color-primary)' : 'transparent',
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
            <div style={{ fontSize: '10px', fontWeight: 600, color: leadDelta >= 0 ? 'var(--color-success)' : 'var(--color-primary)' }}>{leadDelta >= 0 ? '▲' : '▼'} {Math.abs(leadDelta)}% vs last mo</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>{currentMetrics.acceptance}%</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Acceptance</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-success)' }}>▲ 2 pts</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>{currentMetrics.conversions}</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Conversions</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: convDelta >= 0 ? 'var(--color-success)' : 'var(--color-primary)' }}>{convDelta >= 0 ? '▲' : '▼'} {Math.abs(convDelta)}% vs last mo</div>
          </div>

          <div className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
            </div>
            <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>${(currentMetrics.revenue / 1000).toFixed(0)}K</div>
            <div className="kpi-card__label" style={{ fontSize: '11px' }}>Billable</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: revDelta >= 0 ? 'var(--color-success)' : 'var(--color-primary)' }}>{revDelta >= 0 ? '▲' : '▼'} {Math.abs(revDelta)}% vs last mo</div>
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

        {/* Monthly Pacing + Conversion — paired on one row */}
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Monthly Pacing */}
            <div className="glass-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  <Target className="w-4 h-4 text-[var(--color-primary)]" /> Monthly Pacing
                </h3>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  style={{
                    background: pacingPct >= 60 ? 'rgba(16,163,127,0.12)' : 'rgba(245,158,11,0.14)',
                    color: pacingPct >= 60 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> {pacingPct >= 60 ? 'On track' : 'Behind pace'}
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
              <div className="w-full h-3.5 rounded-full overflow-hidden mt-auto" style={{ background: 'var(--background-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--color-primary)' }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${Math.min(100, pacingPct)}%` }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex gap-5 mt-2.5" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--color-primary)' }} />Delivered {pacingPct}%</span>
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
                    background: acceptedPct >= 80 ? 'rgba(16,163,127,0.12)' : 'rgba(245,158,11,0.14)',
                    color: acceptedPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> {acceptedPct >= 80 ? 'Healthy' : 'Needs review'}
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
            <DemoBars title="Geographic Distribution" data={demographics.geo} icon={Globe} chipBg="var(--color-accent-purple-bg)" chipColor="var(--color-accent-purple)" />
            <DemoBars title="Industry Distribution" data={demographics.industry} icon={Building2} chipBg="var(--color-success-bg)" chipColor="var(--color-success)" />
            <DemoBars title="Title Distribution" data={demographics.title} icon={IdCard} chipBg="var(--color-warning-bg)" chipColor="var(--color-warning)" />
            <DemoBars title="Company Size" data={demographics.size} icon={Users} chipBg="var(--color-error-bg)" chipColor="var(--color-error)" />
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
    </AppLayout>
  );
}