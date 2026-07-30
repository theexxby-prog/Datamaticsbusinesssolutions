import { useState } from 'react';
import {
  BarChart3, Target, DollarSign, Activity, CheckCircle, Users,
  ArrowUpRight, ArrowDownRight, Download, Bookmark, BookmarkCheck,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { mockCampaigns } from '../mockData';
import { allClients } from '../data/mockClients';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ExportModal } from '../components/ExportModal';
import type { ReportsPDFData } from '../utils/exportUtils';
import { toast } from 'sonner';
import { PersonAvatar } from '../components/PersonAvatar';

const CHART_COLORS = ['var(--color-primary)', 'var(--color-primary-light)', 'var(--color-error)', 'var(--color-info)', 'var(--color-success)', 'var(--color-warning)'];

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--color-text-primary)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  padding: '8px',
};

// Monthly performance data
const monthlyData = [
  { month: 'Jan', leads: 1240, revenue: 58000, campaigns: 8, acceptance: 88 },
  { month: 'Feb', leads: 1580, revenue: 72000, campaigns: 10, acceptance: 90 },
  { month: 'Mar', leads: 1920, revenue: 89000, campaigns: 12, acceptance: 91 },
  { month: 'Apr', leads: 2150, revenue: 98000, campaigns: 13, acceptance: 89 },
  { month: 'May', leads: 2480, revenue: 112000, campaigns: 15, acceptance: 93 },
  { month: 'Jun', leads: 2890, revenue: 128000, campaigns: 16, acceptance: 94 },
];

// Operator performance data
const operatorData = [
  { name: 'Brijesh Singh', leads: 3240, acceptance: 92, clients: 3 },
  { name: 'Michael Chen', leads: 2180, acceptance: 89, clients: 2 },
  { name: 'Emily Rodriguez', leads: 1560, acceptance: 94, clients: 1 },
  { name: 'Arjun Patel', leads: 2890, acceptance: 91, clients: 3 },
];

// Industry breakdown
const industryData = [
  { name: 'Technology', value: 35 },
  { name: 'Healthcare', value: 22 },
  { name: 'Financial', value: 18 },
  { name: 'Manufacturing', value: 14 },
  { name: 'Other', value: 11 },
];

function ChartCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="glass-card p-5 transition-all hover:shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function InternalReports() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [savedReports, setSavedReports] = useState<string[]>([]);
  const [activeMetric, setActiveMetric] = useState<'leads' | 'revenue' | 'campaigns' | 'acceptance'>('leads');

  const totalLeads = monthlyData.reduce((sum, m) => sum + m.leads, 0);
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalCampaigns = allClients.reduce((sum, c) => sum + c.campaigns.length, 0);
  const avgAcceptance = Math.round(monthlyData.reduce((sum, m) => sum + m.acceptance, 0) / monthlyData.length);
  const totalClients = allClients.length;

  const metricConfig = {
    leads: { label: 'Total Leads', color: 'var(--color-primary)', dataKey: 'leads' },
    revenue: { label: 'Revenue', color: 'var(--color-info)', dataKey: 'revenue' },
    campaigns: { label: 'Campaigns', color: 'var(--color-success)', dataKey: 'campaigns' },
    acceptance: { label: 'Acceptance Rate', color: 'var(--color-warning)', dataKey: 'acceptance' },
  };

  const isSaved = savedReports.includes('internal-report');

  // Month-over-month growth
  const lastMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const leadsGrowth = (((lastMonth.leads - prevMonth.leads) / prevMonth.leads) * 100).toFixed(1);
  const revenueGrowth = (((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1);

  // Export payload — the same shape the client-facing Reports page hands to
  // ExportModal, built from the figures already on screen. No `pacing`: this
  // roll-up spans every client and has no single delivery target.
  const operatorLeads = operatorData.reduce((sum, o) => sum + o.leads, 0);
  const reportData: ReportsPDFData = {
    clientName: 'Datamatics Business Solutions',
    asOf: `${lastMonth.month} 2026`,
    scope: 'Internal',
    campaignLabel: `All clients · ${totalClients} accounts`,
    kpis: [
      { label: 'Total Leads', value: totalLeads.toLocaleString(), delta: `${Number(leadsGrowth) >= 0 ? '▲' : '▼'} ${Math.abs(Number(leadsGrowth))}%`, up: Number(leadsGrowth) >= 0 },
      { label: 'Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, delta: `${Number(revenueGrowth) >= 0 ? '▲' : '▼'} ${Math.abs(Number(revenueGrowth))}%`, up: Number(revenueGrowth) >= 0 },
      { label: 'Avg Acceptance', value: `${avgAcceptance}%` },
      { label: 'Campaigns', value: String(totalCampaigns) },
      { label: 'Clients', value: String(totalClients) },
    ],
    trend: monthlyData.map(m => ({ label: m.month, current: m.revenue, prev: null })),
    hasPrevYear: false,
    demographics: [
      { title: 'Industry Distribution', rows: industryData.map(i => ({ name: i.name, percentage: i.value })) },
      { title: 'Leads by Operator', rows: operatorData.map(o => ({ name: o.name, percentage: Math.round((o.leads / operatorLeads) * 100) })) },
    ],
    conversion: {
      sent: totalLeads,
      accepted: Math.round((totalLeads * avgAcceptance) / 100),
      acceptedPct: avgAcceptance,
      rejectedPct: 100 - avgAcceptance,
    },
  };

  return (
    <>
      <div
        className="max-w-[1440px] mx-auto page-content animate-fadeIn"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-1">
              Internal Reports
            </h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Company-wide performance metrics and analytics
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => {
                if (isSaved) {
                  setSavedReports(savedReports.filter(r => r !== 'internal-report'));
                  toast.success('Report removed from saved');
                } else {
                  setSavedReports([...savedReports, 'internal-report']);
                  toast.success('Report saved successfully');
                }
              }}
              className="btn-outline px-3 py-2 flex items-center gap-2"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 stagger-children">
          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                <Target className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                <ArrowUpRight className="w-3 h-3" />
                {leadsGrowth}%
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={totalLeads} /></div>
            <div className="kpi-card__label">Total Leads</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <DollarSign className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                <ArrowUpRight className="w-3 h-3" />
                {revenueGrowth}%
              </div>
            </div>
            <div className="kpi-card__number">${(totalRevenue / 1000).toFixed(0)}K</div>
            <div className="kpi-card__label">Total Revenue</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <Activity className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={totalCampaigns} /></div>
            <div className="kpi-card__label">Campaigns</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{avgAcceptance}%</div>
            <div className="kpi-card__label">Avg Acceptance</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-warning-bg)' }}>
                <Users className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={totalClients} /></div>
            <div className="kpi-card__label">Active Clients</div>
          </div>
        </div>

        {/* Metric Selector + Main Trend Chart */}
        <div className="glass-card p-5 mb-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 gap-3">
            <div>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                Performance Trend
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                6-month overview — Jan to Jun 2026
              </p>
            </div>
            {/* Metric Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: 'var(--color-surface)' }}>
              {(['leads', 'revenue', 'campaigns', 'acceptance'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className="px-3 py-1.5 rounded-md transition-all"
                  style={{
                    fontSize: '12px',
                    fontWeight: activeMetric === metric ? 600 : 400,
                    background: activeMetric === metric ? 'var(--color-primary)' : 'transparent',
                    color: activeMetric === metric ? 'white' : 'var(--color-text-secondary)',
                  }}
                >
                  {metricConfig[metric].label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConfig[activeMetric].color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={metricConfig[activeMetric].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="var(--color-surface)" vertical={false} />
              <XAxis
                dataKey="month"
                style={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                stroke="none"
                tickLine={false}
              />
              <YAxis
                style={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                stroke="none"
                tickLine={false}
                tickFormatter={(v) => activeMetric === 'revenue' ? `$${(v / 1000).toFixed(0)}K` : String(v)}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any) =>
                  activeMetric === 'revenue'
                    ? [`$${value.toLocaleString()}`, metricConfig[activeMetric].label]
                    : activeMetric === 'acceptance'
                    ? [`${value}%`, metricConfig[activeMetric].label]
                    : [value.toLocaleString(), metricConfig[activeMetric].label]
                }
              />
              <Area
                type="monotone"
                dataKey={metricConfig[activeMetric].dataKey}
                stroke={metricConfig[activeMetric].color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#metricGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Monthly Revenue Bar Chart */}
          <ChartCard title="Monthly Revenue">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="0" stroke="var(--color-surface)" vertical={false} />
                <XAxis
                  dataKey="month"
                  style={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  stroke="none"
                  tickLine={false}
                />
                <YAxis
                  style={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  stroke="none"
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']}
                />
                <Bar
                  dataKey="revenue"
                  fill="rgba(186,32,39,0.85)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Acceptance Rate Trend */}
          <ChartCard title="Acceptance Rate Trend">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-surface)" vertical={false} />
                <XAxis
                  dataKey="month"
                  style={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  stroke="none"
                  tickLine={false}
                />
                <YAxis
                  domain={[80, 100]}
                  style={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  stroke="none"
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any) => [`${v}%`, 'Acceptance Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="acceptance"
                  stroke="var(--color-info)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--color-info)', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Industry Breakdown Pie */}
          <div className="glass-card p-5">
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              Client Industry Mix
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ value }) => `${value}%`}
                  labelLine={true}
                >
                  {industryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`]} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Campaign Status Distribution */}
          <div className="glass-card p-5">
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              Campaign Status
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'In Progress', value: mockCampaigns.filter(c => c.status === 'In progress').length },
                    { name: 'Completed', value: mockCampaigns.filter(c => c.status === 'Completed').length },
                    { name: 'Paused', value: mockCampaigns.filter(c => c.status === 'Paused').length },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ value }) => value > 0 ? value : ''}
                >
                  {['var(--color-info)', 'var(--color-success)', 'var(--color-warning)'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-5">
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              Key Benchmarks
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Avg Campaign Performance', value: '87%', trend: '+2%', up: true },
                { label: 'Avg Lead Quality Score', value: '8.2/10', trend: '+0.3', up: true },
                { label: 'Client Satisfaction', value: '94%', trend: '+1%', up: true },
                { label: 'On-Time Delivery', value: '96%', trend: '-1%', up: false },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      {stat.value}
                    </span>
                    <span
                      className="flex items-center gap-0.5"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: stat.up ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operator Performance Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              Team Performance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead style={{ background: 'var(--color-border-light)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  {['Team Member', 'Leads Delivered', 'Acceptance Rate', 'Clients', 'Performance'].map((header) => (
                    <th
                      key={header}
                      className="text-left px-6 py-4"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--letter-spacing-wide)',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operatorData.map((op, index) => {
                  const performanceScore = Math.round((op.leads / 3240) * 100);
                  return (
                    <tr
                      key={op.name}
                      className="border-b hover:bg-black/[0.02] transition-colors"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <PersonAvatar name={op.name} size={36} />
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                            {op.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {op.leads.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            background: op.acceptance >= 92 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                            color: op.acceptance >= 92 ? 'var(--color-success)' : 'var(--color-warning)',
                          }}
                        >
                          {op.acceptance}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                          {op.clients} assigned
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="progress-bar flex-1" style={{ minWidth: '80px' }}>
                            <div
                              className="progress-bar__fill"
                              style={{ width: `${performanceScore}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', minWidth: '30px' }}>
                            {performanceScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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