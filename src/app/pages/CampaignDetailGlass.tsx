import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronRight, FileText, Download, ArrowLeft, Copy, Wallet, UserRound } from 'lucide-react';
import { JobCardModal } from '../components/JobCardModalGlass';
import { DeliveryScheduleSection } from '../components/DeliveryScheduleSection';
import { CloneCampaignModal } from '../components/CloneCampaignModal';
import { NewCampaignModal, type CampaignFormData } from '../components/NewCampaignModal';
import { CampaignHealthBadge, ReplacementTracker } from '../components/CampaignHealthBadge';
import { CampaignThread } from '../components/thread/CampaignThread';
import { TalBadge } from '../components/thread/TalBadge';
import { ConvertrQAStats } from '../components/ConvertrQAStatus';
import { CampaignKpiBand } from '../components/campaign/CampaignKpiBand';
import { CampaignAnalyticsTabs, TAB_ICONS } from '../components/campaign/CampaignAnalyticsTabs';
import { OutreachFunnel } from '../components/campaign/OutreachFunnel';
import { useCampaignThread } from '../context/CampaignThreadContext';
import { useIsMobile } from '../components/ui/use-mobile';
import { allClients } from '../data/mockClients';
import { getActivitiesForCampaign, getReplacementStats } from '../data/campaignActivities';
import { getCampaignHealth } from '../utils/campaignHealth';
import { toast } from 'sonner';
import { formatMoney as fmtMoney } from '../utils/format';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showJobCard, setShowJobCard] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [clonePrefill, setClonePrefill] = useState<Partial<CampaignFormData> | undefined>(undefined);
  const { openRequestsFor } = useCampaignThread();
  const isMobile = useIsMobile();
  // Phones can't fit analytics and the conversation side by side; a segmented
  // switch shows one at a time instead of stacking a very long page.
  const [mobileSection, setMobileSection] = useState<'overview' | 'discussion'>('overview');
  
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
      <>
        <div className="max-w-[1440px] mx-auto page-content">
          <div className="text-center py-12">
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xl)' }}>Campaign not found</h2>
            <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4 px-6 py-3">
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
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
  
  const health = getCampaignHealth(campaign);
  const activities = getActivitiesForCampaign(campaign.id);
  const replacementStats = getReplacementStats(campaign.id);
  const isConvertr = client?.leadAcceptanceMethod === 'convertr';

  const acceptanceMethod = isConvertr
    ? { label: 'Automated lead delivery', color: 'var(--color-accent-purple)' }
    : client?.leadAcceptanceMethod === 'csv_manual'
      ? { label: 'Manual CSV review', color: 'var(--color-warning)' }
      : { label: 'Portal review', color: 'var(--color-success)' };

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
    <>
      <div className="max-w-[1440px] mx-auto page-content">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          <button onClick={() => navigate('/dashboard')} className="hover:text-[var(--color-primary)] transition-colors">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: 'var(--color-text-primary)' }}>{campaign.name}</span>
        </div>

        {/* Header — carries what the old "Campaign Details" sidebar card held.
            Status, dates and health were already duplicated here; budget and
            account manager join them so that 313px card can go. */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="truncate" style={{ color: 'var(--color-text-primary)' }}>{campaign.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-1">
              <span className={getStatusColor(campaign.status)}>{formatStatus(campaign.status)}</span>
              <CampaignHealthBadge health={health} showDetails />
              {campaign.startDate && campaign.endDate && (
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {campaign.startDate} – {campaign.endDate}
                </span>
              )}
              {campaign.budget && (
                <span className="inline-flex items-center gap-1.5" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  {fmtMoney(campaign.budget)} budget
                </span>
              )}
              <span className="inline-flex items-center gap-1.5" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <UserRound className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                Brijesh Singh
              </span>
              <span className="inline-flex items-center gap-1.5" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: acceptanceMethod.color }} />
                {acceptanceMethod.label}
              </span>
              <TalBadge campaignId={campaign.id} />
            </div>
          </div>

          <div className="grid flex-shrink-0 grid-cols-3 gap-2 sm:flex sm:flex-row">
            <button onClick={() => setShowJobCard(true)} className="btn-outline px-3.5 py-2 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Job Card
            </button>
            <button onClick={() => setShowCloneModal(true)} className="btn-outline px-3.5 py-2 flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" />
              Clone
            </button>
            <button
              onClick={() => toast.success('Exporting report… your download will begin shortly.')}
              className="btn-primary px-3.5 py-2 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* KPI band — absorbs the old donut card and Delivery Pace card. */}
        <CampaignKpiBand
          billable={fmtMoney(totalBillable)}
          cpl={fmtMoney(cpl)}
          delivered={deliveredLeads}
          target={targetLeads}
          progressPercent={progressPercentage}
          acceptanceRate={acceptanceRate}
          timeElapsedPercent={health.timeElapsedPercent}
          paceColor={health.color}
          paceLabel={health.label}
          qaValidPercent={isConvertr ? Math.round((convertrStats.valid / convertrStats.totalProcessed) * 100) : undefined}
          openRequests={openRequestsFor(campaign.id)}
          onOpenRequests={() => {
            if (isMobile) setMobileSection('discussion');
            // Defer so the thread exists before scrolling on mobile.
            requestAnimationFrame(() =>
              document.getElementById('campaign-discussion')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            );
          }}
        />

        {/* Mobile section switch — Overview | Discussion */}
        {isMobile && (
          <div
            className="mb-4 grid grid-cols-2 gap-1 rounded-xl p-1"
            style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
          >
            {([['overview', 'Overview'], ['discussion', 'Discussion']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMobileSection(key)}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-all ${
                  mobileSection === key ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {label}
                {key === 'discussion' && openRequestsFor(campaign.id) > 0 && (
                  <span
                    className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={
                      mobileSection === key
                        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { background: 'var(--color-primary)', color: '#fff' }
                    }
                  >
                    {openRequestsFor(campaign.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Analytics on the left, the conversation pinned alongside it —
            or, on mobile, one section at a time via the switch above. */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 items-start">
          {(!isMobile || mobileSection === 'overview') && (
            <div className="lg:col-span-3 space-y-5">
              <CampaignAnalyticsTabs
                tabs={[
                  Boolean(campaign.outreachMetrics) && {
                    key: 'performance', label: 'Performance', Icon: TAB_ICONS.performance,
                    content: <OutreachFunnel metrics={campaign.outreachMetrics!} deliveredLeads={deliveredLeads} />,
                  },
                  {
                    key: 'delivery', label: 'Delivery', Icon: TAB_ICONS.delivery,
                    content: <DeliveryScheduleSection campaign={campaign} bare />,
                  },
                  isConvertr && {
                    key: 'quality', label: 'Quality', Icon: TAB_ICONS.quality,
                    content: <ConvertrQAStats {...convertrStats} />,
                  },
                ]}
              />

              <ReplacementTracker
                totalRejected={replacementStats.totalRejected}
                totalReplaced={replacementStats.totalReplaced}
                remaining={replacementStats.remaining}
              />
            </div>
          )}

          {/* The thread scrolls inside itself so the page height no longer
              depends on how much the client and the campaign manager talk. */}
          {(!isMobile || mobileSection === 'discussion') && (
            <div id="campaign-discussion" className="lg:col-span-2 lg:sticky lg:top-5">
              <CampaignThread
                campaignId={campaign.id}
                campaignName={campaign.name}
                activities={activities}
                variant="rail"
              />
            </div>
          )}
        </div>
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
    </>
  );
}