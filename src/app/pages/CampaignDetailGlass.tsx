import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronRight, FileText, Download, ArrowLeft, Copy, Wallet, UserRound, MessageSquare, Clock3, Target, UsersRound, CalendarClock
} from 'lucide-react';
import { JobCardModal } from '../components/JobCardModalGlass';
import { CampaignDiscussionPanel } from '../components/CampaignDiscussionPanel';
import { CloneCampaignModal } from '../components/CloneCampaignModal';
import { NewCampaignModal, type CampaignFormData } from '../components/NewCampaignModal';
import { CampaignHealthBadge, ReplacementTracker } from '../components/CampaignHealthBadge';
import { CampaignThread } from '../components/thread/CampaignThread';
import { TalBadge } from '../components/thread/TalBadge';
import { CampaignKpiBand } from '../components/campaign/CampaignKpiBand';
import { CampaignAnalyticsTabs, TAB_ICONS } from '../components/campaign/CampaignAnalyticsTabs';
import { DeliveryAndQuality } from '../components/campaign/DeliveryAndQuality';
import { OutreachFunnel } from '../components/campaign/OutreachFunnel';
import { CampaignProgrammaticTab } from '../components/campaign/CampaignProgrammaticTab';
import { CampaignReachTab } from '../components/campaign/CampaignReachTab';
import { CampaignAudienceTab } from '../components/campaign/CampaignAudienceTab';
import { SyndicationPerformance } from '../components/campaign/SyndicationPerformance';
import { showFutureModules } from '../config/demo';
import { ABM_SYNDICATION_CROSSWALK, getAssetAnalytics, getFlightStatus } from '../data/propensity';
import { campaignTypeFor } from '../data/outcomes';
import { useCampaignThread } from '../context/CampaignThreadContext';
import { useAuth } from '../context/AuthContext';
import { useUnionLens } from '../hooks/useUnionLens';
import { resolveCampaignForUser } from '../data/unionClient';
import { useDeliveryOverrides, overrideFor } from '../data/unionOps';
import { getActivitiesForCampaign, getReplacementStats } from '../data/campaignActivities';
import { getCampaignHealth } from '../utils/campaignHealth';
import { toast } from 'sonner';
import { formatMoney as fmtMoney } from '../utils/format';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const lens = useUnionLens();
  const [showJobCard, setShowJobCard] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [clonePrefill, setClonePrefill] = useState<Partial<CampaignFormData> | undefined>(undefined);
  const { openRequestsFor } = useCampaignThread();
  // Phones can't fit analytics and the conversation side by side; a segmented
  // switch shows one at a time instead of stacking a very long page.
  const [showDiscussion, setShowDiscussion] = useState(false);
  
  // Find the campaign across all clients, under this login's identity
  const resolved = resolveCampaignForUser(currentUser, id);
  const campaign = resolved?.campaign ?? null;
  const client = resolved?.client ?? null;

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

  // Ops-entered delivery & acceptance figures win over the feed: acceptance is
  // manual for clients without Convertr, suppressed leads are never charged,
  // and ops's entry is the number the portal stands behind.
  const override = overrideFor(campaign.id, useDeliveryOverrides());
  const acceptanceRate = override?.accepted != null && override?.delivered
    ? Math.round((override.accepted / override.delivered) * 100)
    : campaign.acceptanceRate || 0;

  // Use goalLeads/deliveredLeads if available, otherwise fall back to target/delivered
  const targetLeads = campaign.goalLeads || campaign.target || campaign.totalLeads || 0;
  const deliveredLeads = override?.delivered ?? (campaign.deliveredLeads || campaign.delivered || campaign.totalLeads || 0);

  const progressPercentage = targetLeads > 0
    ? Math.min(100, Math.round((deliveredLeads / targetLeads) * 100))
    : 0;

  // CPL × billable leads = total billable to the client (client-facing "revenue").
  // Billable is what the client accepted — suppressed leads are never charged.
  // CPL derives from the agreed budget ÷ target when not set explicitly.
  const cpl = (campaign as any).cpl ?? (campaign.budget && targetLeads ? Math.round(campaign.budget / targetLeads) : 50);
  const billableLeads = override?.accepted ?? deliveredLeads;
  const totalBillable = cpl * billableLeads;
  
  // UNION preview: Programmatic merged into Campaigns. Crosswalk-paired
  // campaigns grow a Programmatic tab, an Impressions bar on the funnel, and
  // audience demographics; Renuka and the TCC build see none of this.
  const showFuture = showFutureModules(currentUser);
  const pairedAbm = showFuture
    ? ABM_SYNDICATION_CROSSWALK.find(x => x.syndicationCampaignId === campaign.id)
    : undefined;
  const abmImpressions = pairedAbm
    ? getAssetAnalytics()
        .filter(a => a.abmCampaignId === pairedAbm.abmCampaignId)
        .reduce((sum, a) => sum + a.impressions, 0)
    : undefined;
  // Self-serve (clone / new campaign) is hidden in the UNION preview —
  // leadership hasn't approved client-initiated campaigns yet.
  const hideSelfServe = showFuture && currentUser?.role === 'client';

  const flight = pairedAbm ? getFlightStatus(pairedAbm.abmCampaignId, campaign) : null;
  const health = getCampaignHealth(campaign);
  const activities = lens(getActivitiesForCampaign(campaign.id));
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
              {showFuture && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
                >
                  {campaignTypeFor(campaign.id)}
                </span>
              )}
              <CampaignHealthBadge health={health} showDetails />
              {campaign.startDate && campaign.endDate && (
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {campaign.startDate} – {campaign.endDate}
                </span>
              )}
              {/* Where we are in the flight, and whether reach is keeping up
                  with the clock. Client-safe: it compares accounts reached to
                  days elapsed, never spend to budget. */}
              {flight && (
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}
                  title={`${flight.reachPct}% of the target list reached, ${flight.elapsedPct}% of the flight elapsed`}
                >
                  <CalendarClock className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  Day {flight.dayOfFlight} of {flight.totalDays}
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      color: flight.pace === 'behind' ? 'var(--color-warning)' : 'var(--color-success)',
                      background: flight.pace === 'behind' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                    }}
                  >
                    {/* "reach" is load-bearing. The Pace tile above measures
                        LEAD DELIVERY against time; this measures accounts
                        reached. They can legitimately disagree, and an
                        unqualified "ahead" beside "On Track" just reads as a
                        contradiction. */}
                    reach {flight.pace}
                  </span>
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
            {/* The conversation is now opened deliberately rather than occupying
                two of five columns on every visit. The badge is what makes that
                safe — an open request stays visible without the panel being. */}
            <button
              onClick={() => setShowDiscussion(true)}
              className="btn-outline relative px-3.5 py-2 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Discussion
              {openRequestsFor(campaign.id) > 0 && (
                <span
                  className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: 'var(--color-primary-solid)' }}
                >
                  {openRequestsFor(campaign.id)}
                </span>
              )}
            </button>
            <button onClick={() => setShowJobCard(true)} className="btn-outline px-3.5 py-2 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Job Card
            </button>
            {!hideSelfServe && (
              <button onClick={() => setShowCloneModal(true)} className="btn-outline px-3.5 py-2 flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />
                Clone
              </button>
            )}
            <button
              onClick={() => toast.success('Exporting report… your download will begin shortly.')}
              className="btn-primary px-3.5 py-2 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Delivery under client review — some clients hold blind suppression
            lists, so final acceptance can take a couple of days. Shown plainly
            rather than pretending the numbers are final. */}
        {override?.status === 'awaiting_client' && (
          <div
            className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5"
            style={{ borderColor: 'var(--color-warning)', background: 'var(--color-warning-bg)' }}
          >
            <Clock3 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Latest delivery under your team's review
            </span>
            <span className="hidden text-[12px] sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
              — accepted counts update once the review lands
            </span>
          </div>
        )}

        {/* KPI band — absorbs the old donut card and Delivery Pace card. */}
        <CampaignKpiBand
          hideOps={showFuture}
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
          onOpenRequests={() => setShowDiscussion(true)}
        />

        {/* Analytics now own the full width. The conversation used to sit here
            as a permanent two-of-five column; it opens from the header instead. */}
        <div className="space-y-5">
          <CampaignAnalyticsTabs
            // Tabs answer the client's questions in order — am I getting my
            // leads, who did you reach, who exactly, how are the ads doing —
            // rather than being organised by which vendor supplied the data.
            tabs={[
              {
                // Delivery, Quality and the outreach funnel were three tabs
                // that between them printed the same delivery repeatedly.
                key: 'delivery', label: 'Delivery', Icon: TAB_ICONS.delivery,
                content: (
                  <div className="space-y-4">
                    <DeliveryAndQuality campaign={campaign} qa={isConvertr ? convertrStats : undefined} />
                    {campaign.outreachMetrics && (
                      <OutreachFunnel
                        metrics={campaign.outreachMetrics}
                        deliveredLeads={deliveredLeads}
                        impressions={abmImpressions}
                      />
                    )}
                    {/* Which asset earned the leads, which publisher supplied
                        them, and what sales did with them afterwards. */}
                    <SyndicationPerformance campaignId={campaign.id} totalLeads={deliveredLeads} />
                  </div>
                ),
              },
              Boolean(pairedAbm) && {
                key: 'reach', label: 'Reach', Icon: Target,
                content: <CampaignReachTab abmCampaignId={pairedAbm!.abmCampaignId} />,
              },
              Boolean(pairedAbm) && {
                key: 'audience', label: 'Audience', Icon: UsersRound,
                content: <CampaignAudienceTab abmCampaignId={pairedAbm!.abmCampaignId} />,
              },
              Boolean(pairedAbm) && {
                key: 'advertising', label: 'Advertising', Icon: TAB_ICONS.programmatic,
                content: <CampaignProgrammaticTab abmCampaignId={pairedAbm!.abmCampaignId} />,
              },
            ]}
          />

          <ReplacementTracker
            totalRejected={replacementStats.totalRejected}
            totalReplaced={replacementStats.totalReplaced}
            remaining={replacementStats.remaining}
          />

        </div>
      </div>

      <CampaignDiscussionPanel
        open={showDiscussion}
        onClose={() => setShowDiscussion(false)}
        campaignId={campaign.id}
        campaignName={campaign.name}
        activities={activities}
      />

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