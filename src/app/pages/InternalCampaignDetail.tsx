import {
  Target, TrendingUp, CheckCircle, DollarSign, ArrowLeft,
  Calendar, Users, BarChart3, Upload, Activity,
} from 'lucide-react';
import { allClients } from '../data/mockClients';
import { AnimatedDonutChart } from '../components/AnimatedDonutChart';
import { DeliveryScheduleSection } from '../components/DeliveryScheduleSection';
import { LeadUploadModal } from '../components/LeadUploadModal';
import { CampaignThread } from '../components/thread/CampaignThread';
import { CampaignKpiBand } from '../components/campaign/CampaignKpiBand';
import { CampaignAnalyticsTabs, TAB_ICONS } from '../components/campaign/CampaignAnalyticsTabs';
import { useCampaignThread } from '../context/CampaignThreadContext';
import { getCampaignHealth } from '../utils/campaignHealth';
import { TalBadge } from '../components/thread/TalBadge';
import { getActivitiesForCampaign } from '../data/campaignActivities';
import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';

export default function InternalCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { openRequestsFor } = useCampaignThread();

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
      <>
        <div className="max-w-[1440px] mx-auto page-content">
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
      </>
    );
  }

  const target = campaign.target ?? campaign.totalLeads ?? 0;
  const delivered = campaign.delivered ?? campaign.deliveredLeads ?? campaign.totalLeads ?? 0;
  const progressPct = target > 0 ? Math.min(Math.round((delivered / target) * 100), 100) : 0;
  const acceptanceRate = campaign.acceptanceRate ?? 0;
  const budget = campaign.budget ?? 0;
  const cpl = (campaign as any).cpl ?? (budget && target ? Math.round(budget / target) : 0);
  const health = getCampaignHealth(campaign);

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
    <>
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
              {budget > 0 && (
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  ${budget.toLocaleString()} budget
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

        {/* Same KPI band and layout as the client's view of this campaign, so
            both sides are reading the identical page. */}
        <CampaignKpiBand
          billable={cpl > 0 ? `$${(cpl * delivered).toLocaleString()}` : '—'}
          cpl={cpl > 0 ? `$${cpl.toLocaleString()}` : '—'}
          delivered={delivered}
          target={target}
          progressPercent={progressPct}
          acceptanceRate={acceptanceRate}
          timeElapsedPercent={health.timeElapsedPercent}
          paceColor={health.color}
          paceLabel={health.label}
          openRequests={openRequestsFor(campaign.id)}
          onOpenRequests={() => document.getElementById('campaign-discussion')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 items-start">
          <div className="lg:col-span-3">
            <CampaignAnalyticsTabs
              tabs={[{
                key: 'delivery', label: 'Delivery', Icon: TAB_ICONS.delivery,
                content: 
                campaign.deliverySchedule && campaign.deliverySchedule.length > 0 ? (
                  <DeliveryScheduleSection campaign={campaign} bare />
                ) : (
                  <div className="py-10 text-center">
                    <Calendar className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--color-text-muted)' }} />
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      No delivery schedule set for this campaign yet.
                    </p>
                  </div>
                ),
              }, {
                key: 'details', label: 'Campaign Details', Icon: Users,
                content: (
                <div className="space-y-4">
                  {[
                    { label: 'Client', value: client.companyName, note: client.industry },
                    { label: 'Campaign Manager', value: client.campaignManager, note: client.campaignManagerEmail },
                    { label: 'Backup Manager', value: client.backupManager, note: client.backupManagerEmail },
                    ...(campaign.leadsPerDelivery ? [{ label: 'Leads Per Delivery', value: campaign.leadsPerDelivery.toLocaleString(), note: '' }] : []),
                    ...(campaign.deliveryDays?.length ? [{ label: 'Delivery Days', value: campaign.deliveryDays.join(', '), note: '' }] : []),
                  ].map(row => (
                    <div key={row.label}>
                      <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {row.label}
                      </p>
                      <p className="mt-0.5" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        {row.value}
                      </p>
                      {row.note && (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.note}</p>
                      )}
                    </div>
                  ))}
                </div>
                ),
              }]}
            />
          </div>

          <div id="campaign-discussion" className="lg:col-span-2 lg:sticky lg:top-5">
            <CampaignThread
              campaignId={campaign.id}
              campaignName={campaign.name}
              activities={getActivitiesForCampaign(campaign.id)}
              variant="rail"
            />
          </div>
        </div>
      </div>
      <LeadUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        clientId={client.id}
        clientName={client.companyName}
        campaignId={campaign.id}
        campaignName={campaign.name}
      />
    </>
  );
}