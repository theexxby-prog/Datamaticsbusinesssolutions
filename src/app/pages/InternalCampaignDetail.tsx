import { AppLayout } from '../components/AppLayout';
import {
  Target, TrendingUp, CheckCircle, DollarSign, ArrowLeft,
  Calendar, Users, BarChart3, Upload, Activity,
} from 'lucide-react';
import { allClients } from '../data/mockClients';
import { AnimatedDonutChart } from '../components/AnimatedDonutChart';
import { DeliveryScheduleSection } from '../components/DeliveryScheduleSection';
import { LeadUploadModal } from '../components/LeadUploadModal';
import { CampaignThread } from '../components/thread/CampaignThread';
import { TalBadge } from '../components/thread/TalBadge';
import { getActivitiesForCampaign } from '../data/campaignActivities';
import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';

export default function InternalCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Find campaign across all clients
  let campaign = null;
  let client = null;
  for (const c of allClients) {
    const found = c.campaigns.find(camp => camp.id === id);
    if (found) {
      campaign = found;
      client = c;
      break;
    }
  }

  if (!campaign || !client) {
    return (
      <AppLayout>
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="text-center py-12">
            <h2 style={{ color: 'var(--color-text-primary)' }}>Campaign not found</h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-2">
              Campaign ID "{id}" does not exist.
            </p>
            <button onClick={() => navigate('/internal/campaigns')} className="btn-primary mt-4 px-6 py-3">
              Back to Campaigns
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const target = campaign.target ?? campaign.totalLeads ?? 0;
  const delivered = campaign.delivered ?? campaign.deliveredLeads ?? campaign.totalLeads ?? 0;
  const progressPct = target > 0 ? Math.min(Math.round((delivered / target) * 100), 100) : 0;
  const acceptanceRate = campaign.acceptanceRate ?? 0;
  const budget = campaign.budget ?? 0;

  const statusClass =
    campaign.status === 'active' ? 'badge badge-active' :
    campaign.status === 'completed' ? 'badge badge-completed' :
    campaign.status === 'paused' ? 'badge badge-paused' :
    'badge';

  const statusLabel =
    campaign.status === 'active' ? 'Active' :
    campaign.status === 'completed' ? 'Completed' :
    campaign.status === 'paused' ? 'Paused' :
    campaign.status === 'pending_approval' ? 'Pending Approval' :
    campaign.status;

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto page-content">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate('/internal/campaigns')} className="btn-ghost p-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 style={{ color: 'var(--color-text-primary)' }}>{campaign.name}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={statusClass}>{statusLabel}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {client.companyName}
              </span>
              {campaign.startDate && campaign.endDate && (
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  {campaign.startDate} – {campaign.endDate}
                </span>
              )}
              <TalBadge campaignId={campaign.id} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Leads
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                <Target className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{target.toLocaleString()}</div>
            <div className="kpi-card__label">Target</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{delivered.toLocaleString()}</div>
            <div className="kpi-card__label">Delivered</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{progressPct}%</div>
            <div className="kpi-card__label">Progress</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <DollarSign className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              {budget > 0 ? `$${(budget / 1000).toFixed(0)}K` : '—'}
            </div>
            <div className="kpi-card__label">Budget</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Progress donut */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-6">
              Campaign Progress
            </h2>
            <div className="flex items-center justify-center">
              <AnimatedDonutChart
                percentage={progressPct}
                size={200}
                strokeWidth={20}
                color="var(--color-primary)"
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  {target.toLocaleString()}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Target</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                  {delivered.toLocaleString()}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Delivered</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                  {Math.max(0, target - delivered).toLocaleString()}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Remaining</div>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="glass-card p-6">
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-4">
              Campaign Info
            </h2>
            <div className="space-y-4">
              <div>
                <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Client
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }} className="mt-0.5">
                  {client.companyName}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{client.industry}</p>
              </div>

              <div>
                <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Campaign Manager
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }} className="mt-0.5">
                  {client.campaignManager}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{client.campaignManagerEmail}</p>
              </div>

              <div>
                <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Backup Manager
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }} className="mt-0.5">
                  {client.backupManager}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{client.backupManagerEmail}</p>
              </div>

              {campaign.acceptanceRate > 0 && (
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Acceptance Rate
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }} className="mt-0.5">
                    {acceptanceRate}%
                  </p>
                </div>
              )}

              {campaign.leadsPerDelivery && (
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Leads Per Delivery
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }} className="mt-0.5">
                    {campaign.leadsPerDelivery.toLocaleString()}
                  </p>
                </div>
              )}

              {campaign.deliveryDays && campaign.deliveryDays.length > 0 && (
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Delivery Days
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }} className="mt-0.5">
                    {campaign.deliveryDays.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Schedule */}
        {campaign.deliverySchedule && campaign.deliverySchedule.length > 0 && (
          <DeliveryScheduleSection campaign={campaign} />
        )}
        {(!campaign.deliverySchedule || campaign.deliverySchedule.length === 0) && (
          <div className="glass-card p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              No delivery schedule set for this campaign yet.
            </p>
          </div>
        )}

        {/* The client-facing discussion, from this side of it — the campaign
            manager is the one who acknowledges and closes requests. */}
        <CampaignThread
          campaignId={campaign.id}
          campaignName={campaign.name}
          activities={getActivitiesForCampaign(campaign.id)}
        />
      </div>
      <LeadUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        clientId={client.id}
        clientName={client.companyName}
        campaignId={campaign.id}
        campaignName={campaign.name}
      />
    </AppLayout>
  );
}