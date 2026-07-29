import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ChevronRight, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  FileText,
  Download,
  DollarSign,
  ArrowLeft,
  Activity,
  Package,
  Copy,
  Clock,
  Mail,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { JobCardModal } from '../components/JobCardModalGlass';
import { AnimatedDonutChart } from '../components/AnimatedDonutChart';
import { DeliveryScheduleSection } from '../components/DeliveryScheduleSection';
import { CloneCampaignModal } from '../components/CloneCampaignModal';
import { NewCampaignModal, type CampaignFormData } from '../components/NewCampaignModal';
import { CampaignHealthBadge, ReplacementTracker } from '../components/CampaignHealthBadge';
import { CampaignActivityTimeline } from '../components/CampaignActivityTimeline';
import { ConvertrQAStats } from '../components/ConvertrQAStatus';
import { allClients } from '../data/mockClients';
import { getActivitiesForCampaign, getReplacementStats } from '../data/campaignActivities';
import { getCampaignHealth } from '../utils/campaignHealth';
import { toast } from 'sonner';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showJobCard, setShowJobCard] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [clonePrefill, setClonePrefill] = useState<Partial<CampaignFormData> | undefined>(undefined);
  
  // Find the campaign across all clients
  let campaign = null;
  let client = null;
  
  for (const c of allClients) {
    const foundCampaign = c.campaigns.find(camp => camp.id === id);
    if (foundCampaign) {
      campaign = foundCampaign;
      client = c;
      break;
    }
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="text-center py-12">
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xl)' }}>Campaign not found</h2>
            <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4 px-6 py-3">
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const acceptanceRate = campaign.acceptanceRate || 0;
  
  // Use goalLeads/deliveredLeads if available, otherwise fall back to target/delivered
  const targetLeads = campaign.goalLeads || campaign.target || campaign.totalLeads || 0;
  const deliveredLeads = campaign.deliveredLeads || campaign.delivered || campaign.totalLeads || 0;
  
  const progressPercentage = targetLeads > 0
    ? Math.min(100, Math.round((deliveredLeads / targetLeads) * 100))
    : 0;

  // CPL × delivered leads = total billable to the client (client-facing "revenue").
  // CPL derives from the agreed budget ÷ target when not set explicitly.
  const cpl = (campaign as any).cpl ?? (campaign.budget && targetLeads ? Math.round(campaign.budget / targetLeads) : 50);
  const totalBillable = cpl * deliveredLeads;
  const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

  const health = getCampaignHealth(campaign);
  const activities = getActivitiesForCampaign(campaign.id);
  const replacementStats = getReplacementStats(campaign.id);
  const isConvertr = client?.leadAcceptanceMethod === 'convertr';

  // Automated QA snapshot derived from campaign delivery — mirrors the ~97%
  // acceptance rate the seeded campaigns report elsewhere.
  const qaCaution = Math.max(1, Math.round(deliveredLeads * 0.02));
  const qaInvalid = Math.max(1, Math.round(deliveredLeads * 0.01));
  const convertrStats = {
    totalProcessed: deliveredLeads + qaCaution + qaInvalid,
    valid: deliveredLeads,
    caution: qaCaution,
    invalid: qaInvalid,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge badge-active';
      case 'completed':
        return 'badge badge-completed';
      case 'paused':
        return 'badge badge-paused';
      default:
        return 'badge badge-active';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto px-6 py-6 pb-24 md:pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          <button onClick={() => navigate('/dashboard')} className="hover:text-[var(--color-primary)] transition-colors">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: 'var(--color-text-primary)' }}>{campaign.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 style={{ color: 'var(--color-text-primary)' }}>{campaign.name}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={getStatusColor(campaign.status)}>{formatStatus(campaign.status)}</span>
              <CampaignHealthBadge health={health} showDetails />
              {campaign.startDate && campaign.endDate && (
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {campaign.startDate} - {campaign.endDate}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowJobCard(true)}
              className="btn-outline px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Job Card
            </button>
            <button
              onClick={() => setShowCloneModal(true)}
              className="btn-outline px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Clone Campaign
            </button>
            <button
              onClick={() => toast.success('Exporting report… your download will begin shortly.')}
              className="btn-primary px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          {/* Total Billable — larger (spans 2), brand-tinted, CPL inside */}
          <div className="kpi-card animate-slideInUp col-span-2 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(186,32,39,0.06), rgba(186,32,39,0.01))', border: '1px solid rgba(186,32,39,0.18)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                <DollarSign className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="px-2 py-1 rounded-md" style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(186,32,39,0.10)', color: '#BA2027' }}>
                {fmtMoney(cpl)} CPL
              </span>
            </div>
            <div>
              <div className="kpi-card__number" style={{ fontSize: '30px', lineHeight: 1.1 }}>{fmtMoney(totalBillable)}</div>
              <div className="kpi-card__label">Total Billable</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {deliveredLeads.toLocaleString()} leads × {fmtMoney(cpl)} CPL
              </div>
            </div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{deliveredLeads.toLocaleString()}</div>
            <div className="kpi-card__label">Total Leads</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{acceptanceRate}%</div>
            <div className="kpi-card__label">Acceptance</div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Primary Metrics, Analytics & Activity (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Chart */}
            <div className="glass-card p-6">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-6">
                Campaign Progress
              </h2>
              <div className="flex items-center justify-center">
                <AnimatedDonutChart
                  percentage={progressPercentage}
                  size={200}
                  strokeWidth={20}
                  color="var(--color-primary)"
                />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    {campaign.target || campaign.totalLeads}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Target</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                    {campaign.delivered || campaign.totalLeads}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Delivered</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    {(campaign.target || campaign.totalLeads) - (campaign.delivered || campaign.totalLeads)}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Remaining</div>
                </div>
              </div>
            </div>

            {/* Outreach Funnel Analytics */}
            {campaign.outreachMetrics && (
              <div className="glass-card p-6 animate-slideInUp">
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                  Outreach Funnel Analytics
                </h2>

                <div className="space-y-5">
                  {/* Emails Sent */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>Emails Sent</span>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                        {campaign.outreachMetrics.emailsSent.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Opened Emails */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>Opened Emails</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                          {campaign.outreachMetrics.emailsOpened.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: '#6366F1' }}>
                          {campaign.outreachMetrics.openRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500" 
                        style={{ width: `${campaign.outreachMetrics.openRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Clicked Emails */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>Clicks (CTR)</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                          {campaign.outreachMetrics.emailsClicked.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: '#10B981' }}>
                          {campaign.outreachMetrics.clickRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" 
                        style={{ width: `${campaign.outreachMetrics.clickRate * 5}%` }}
                      />
                    </div>
                  </div>

                  {/* Delivered Leads */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>Delivered Leads</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                          {(campaign.delivered || campaign.totalLeads).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                          {Math.round(((campaign.delivered || campaign.totalLeads) / campaign.outreachMetrics.emailsSent) * 1000) / 10}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--brand-red-light)]" 
                        style={{ width: `${Math.max(2, Math.round(((campaign.delivered || campaign.totalLeads) / campaign.outreachMetrics.emailsSent) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Conversion Metrics Footer */}
                <div className="mt-6 pt-5 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-0.5">CTOR</div>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      {Math.round((campaign.outreachMetrics.emailsClicked / campaign.outreachMetrics.emailsOpened) * 1000) / 10}%
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'var(--font-weight-semibold)', color: '#10B981' }} className="mt-0.5">Excellent</div>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-0.5">Open to Lead</div>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      {Math.round(((campaign.delivered || campaign.totalLeads) / campaign.outreachMetrics.emailsOpened) * 1000) / 10}%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }} className="mt-0.5">Conversion</div>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-0.5">Click to Lead</div>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      {Math.round(((campaign.delivered || campaign.totalLeads) / campaign.outreachMetrics.emailsClicked) * 1000) / 10}%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }} className="mt-0.5">Action Rate</div>
                  </div>
                  <div className="text-center p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--background-muted)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-0.5">Bounce Rate</div>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      0.8%
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'var(--font-weight-semibold)', color: '#10B981' }} className="mt-0.5">Healthy (&lt;2%)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Automated QA results (only for automated-delivery clients) */}
            {isConvertr && (
              <ConvertrQAStats {...convertrStats} />
            )}

            {/* Activity Timeline */}
            <div className="glass-card p-6">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-4">
                Campaign Activity
              </h2>
              <CampaignActivityTimeline activities={activities} />
            </div>
          </div>

          {/* Right Column: Metadata & Detailed Trackers (1/3 width) */}
          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Campaign Details */}
            <div className="glass-card p-6">
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-4">
                Campaign Details
              </h2>
              <div className="space-y-4">
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-1">
                    Status
                  </div>
                  <span className={getStatusColor(campaign.status)}>{formatStatus(campaign.status)}</span>
                </div>
                {campaign.startDate && campaign.endDate && (
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-1">
                      Duration
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                      {campaign.startDate} - {campaign.endDate}
                    </div>
                  </div>
                )}
                {campaign.budget && (
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-1">
                      Budget
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                      ${campaign.budget.toLocaleString()}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-1">
                    Account Manager
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    Sarah Johnson
                  </div>
                </div>
              </div>
            </div>

            {/* Replacement Tracker */}
            <ReplacementTracker
              totalRejected={replacementStats.totalRejected}
              totalReplaced={replacementStats.totalReplaced}
              remaining={replacementStats.remaining}
            />

            {/* Delivery Pace */}
            <div className="glass-card p-5">
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-3">
                Delivery Pace
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between" style={{ fontSize: 'var(--font-size-xs)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Time elapsed</span>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{health.timeElapsedPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg-secondary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${health.timeElapsedPercent}%`, background: 'var(--color-text-muted)' }} />
                </div>
                <div className="flex justify-between" style={{ fontSize: 'var(--font-size-xs)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Leads delivered</span>
                  <span style={{ color: health.color, fontWeight: 'var(--font-weight-semibold)' }}>{health.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg-secondary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${health.progressPercent}%`, background: health.color }} />
                </div>
              </div>
            </div>

            {/* Lead Acceptance Method */}
            <div className="glass-card p-5">
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-2">
                Lead Acceptance
              </h3>
              <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {isConvertr ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Automated lead delivery</span>
                  </>
                ) : client?.leadAcceptanceMethod === 'csv_manual' ? (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-warning)' }} />
                    <span>Manual CSV review</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)' }} />
                    <span>Portal review</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Schedule Section */}
        <DeliveryScheduleSection campaign={campaign} />
      </div>

      {/* Job Card Modal */}
      <JobCardModal
        isOpen={showJobCard}
        onClose={() => setShowJobCard(false)}
        campaign={campaign}
      />

      {/* Clone Confirmation Modal */}
      <CloneCampaignModal
        isOpen={showCloneModal}
        campaignName={campaign.name}
        onClose={() => setShowCloneModal(false)}
        onConfirm={() => {
          setShowCloneModal(false);
          setClonePrefill({
            name: `${campaign.name} — Copy`,
          });
          setShowNewCampaignModal(true);
        }}
      />

      {/* New Campaign Modal (pre-filled for clone) */}
      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => { setShowNewCampaignModal(false); setClonePrefill(undefined); }}
        onSubmit={() => {
          setShowNewCampaignModal(false);
          navigate('/campaigns');
        }}
        prefill={clonePrefill}
      />
    </AppLayout>
  );
}