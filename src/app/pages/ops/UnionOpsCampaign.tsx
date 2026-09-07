import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, ArrowRight, Eye, UploadCloud, Calendar, ShieldAlert,
  ChevronLeft, ChevronRight, Send, CircleCheck, Link2, RefreshCw, Wallet,
  Target, UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useCampaignThread } from '../../context/CampaignThreadContext';
import { useUnionLens } from '../../hooks/useUnionLens';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  campaignPipelines, getPipeline, tasksFor, exceptionsFor, batchesFor,
  useRelishJobs, jobsFor, type QaException,
} from '../../data/unionOps';
import { resolveCampaignForUser, CAMPAIGN_RENAMES, UNION_CLIENT_ID } from '../../data/unionClient';
import { mockJobCards } from '../../data/mockJobCards';
import { getActivitiesForCampaign, getReplacementStats } from '../../data/campaignActivities';
import { ABM_SYNDICATION_CROSSWALK } from '../../data/propensity';
import { getCampaignHealth } from '../../utils/campaignHealth';
import { formatDateShort } from '../../utils/formatDate';
import { formatMoney as fmtMoney } from '../../utils/format';
import { PipelineStages } from '../../components/ops/PipelineStages';
import { DeliveryAcceptanceTab } from '../../components/ops/DeliveryAcceptanceTab';
import { ConnectionsPanel } from '../../components/ops/ConnectionsPanel';
import { CampaignReachTab } from '../../components/campaign/CampaignReachTab';
import { CampaignAudienceTab } from '../../components/campaign/CampaignAudienceTab';
import { SyndicationPerformance } from '../../components/campaign/SyndicationPerformance';
import { CampaignKpiBand } from '../../components/campaign/CampaignKpiBand';
import { CampaignAnalyticsTabs, TAB_ICONS } from '../../components/campaign/CampaignAnalyticsTabs';
import { CampaignProgrammaticTab } from '../../components/campaign/CampaignProgrammaticTab';
import { CampaignHealthBadge, ReplacementTracker } from '../../components/CampaignHealthBadge';
import { DeliveryScheduleSection } from '../../components/DeliveryScheduleSection';
import { ConvertrQAStats } from '../../components/ConvertrQAStatus';
import { CampaignThread } from '../../components/thread/CampaignThread';
import { TalBadge } from '../../components/thread/TalBadge';
import { DataTable, type Column } from '../../components/ui/DataTable';

// ─── UNION OPS · campaign workspace ──────────────────────────────────────────
// The back of house for one campaign: what came in, what QA caught, what went
// to Relish, what is live on the portal, and what the client is asking for.
// This is where the two tiles the client never sees — QA Valid and Open
// Requests — actually get worked.

const SEVERITY_META: Record<QaException['severity'], { label: string; color: string; bg: string }> = {
  invalid: { label: 'Invalid', color: 'var(--color-error)', bg: 'var(--color-error-bg)' },
  caution: { label: 'Caution', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
};

function ExceptionsTab({ campaignId }: { campaignId: string }) {
  const seeded = exceptionsFor(campaignId);
  const [rows, setRows] = useState<QaException[]>(seeded);

  const resolve = (id: string, status: QaException['status'], message: string) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    toast.success(message);
  };

  const valid = Math.max(0, 252 - rows.length);
  const columns: Column<QaException>[] = [
    {
      key: 'row', header: 'Row', primary: true, widthClass: 'w-[26%] lg:w-[12%]',
      sortValue: r => r.rowRef, text: r => `${r.rowRef} ${r.contact}`,
      render: r => (
        <div className="min-w-0">
          <div className="truncate font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.rowRef}</div>
          <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.contact}</div>
        </div>
      ),
    },
    {
      key: 'company', header: 'Company', widthClass: 'hidden lg:table-cell lg:w-[18%]',
      sortValue: r => r.company, text: r => r.company,
      render: r => <span className="block truncate text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{r.company}</span>,
    },
    {
      key: 'field', header: 'Field', widthClass: 'hidden lg:table-cell lg:w-[11%]',
      sortValue: r => r.field, text: r => r.field,
      render: r => <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{r.field}</span>,
    },
    {
      key: 'reason', header: 'Reason', widthClass: 'w-[36%] lg:w-[27%]',
      sortValue: r => r.reason, text: r => r.reason,
      render: r => (
        <span className="block truncate text-[13px]" style={{ color: 'var(--color-text-secondary)' }} title={r.reason}>
          {r.reason}
        </span>
      ),
    },
    {
      key: 'severity', header: 'Severity', widthClass: 'w-[18%] lg:w-[11%]',
      sortValue: r => r.severity, text: r => r.severity,
      render: r => {
        const meta = SEVERITY_META[r.severity];
        return (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'action', header: 'Decision', align: 'right', widthClass: 'w-[20%] lg:w-[21%]',
      sortable: false, text: r => r.status,
      render: r => {
        if (r.status !== 'open') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
              <CircleCheck className="h-3.5 w-3.5" /> {r.status === 'fixed' ? 'Sent to Relish' : 'Dropped'}
            </span>
          );
        }
        return (
          <span className="inline-flex flex-wrap justify-end gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => resolve(r.id, 'fixed', `${r.rowRef} queued for enrichment`)}
              className="btn-ghost rounded-md px-2 py-1 text-xs font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              Enrich
            </button>
            <button
              onClick={() => resolve(r.id, 'dropped', `${r.rowRef} dropped from the batch`)}
              className="btn-ghost rounded-md px-2 py-1 text-xs font-semibold"
              style={{ color: 'var(--color-error)' }}
            >
              Drop
            </button>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <ConvertrQAStats
        totalProcessed={valid + rows.length}
        valid={valid}
        caution={rows.filter(r => r.severity === 'caution').length}
        invalid={rows.filter(r => r.severity === 'invalid').length}
        footnote="Flagged rows stay in CleanRich and never reach Relish. Clear each one here before the batch is published."
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={r => r.id}
        searchPlaceholder="Search row, contact, company…"
        layout="fixed"
        countLabel={n => `${n} flagged`}
        empty={{ icon: CircleCheck, title: 'No exceptions', description: 'Every row in this campaign passed automated QA.' }}
      />
    </div>
  );
}

function BatchesTab({ campaignId }: { campaignId: string }) {
  const live = jobsFor(campaignId, useRelishJobs());
  const batches = batchesFor(campaignId);

  return (
    <div className="space-y-3">
      {live.length > 0 && (
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: 'var(--color-success)', background: 'var(--color-success-bg)' }}
        >
          {live.map(job => (
            <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {job.rows} rows · {job.source === 'csv' ? 'CSV' : 'CRM'}
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{job.sentLabel}</span>
            </div>
          ))}
        </div>
      )}
      <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
        {batches.map(batch => (
          <div key={batch.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {batch.fileName}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {formatDateShort(batch.uploadedAt.slice(0, 10))} · {batch.uploadedBy}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                <b style={{ color: 'var(--color-text-primary)' }}>{batch.totalRows}</b> rows
              </span>
              <span style={{ color: 'var(--color-success)' }}><b>{batch.successCount}</b> valid</span>
              <span style={{ color: batch.errorCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                <b>{batch.errorCount}</b> flagged
              </span>
            </div>
          </div>
        ))}
        {batches.length === 0 && (
          <p className="py-8 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            No batches received for this campaign yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function UnionOpsCampaign() {
  useDocumentTitle('Campaign · Operations');
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, setPreviewingClient } = useAuth();
  const { openRequestsFor } = useCampaignThread();
  const lens = useUnionLens();
  // Every hook runs before the not-found branch — an unknown id must not change
  // the hook order.
  const relishJobs = useRelishJobs();

  const pipeline = getPipeline(id);
  const resolved = resolveCampaignForUser(currentUser, id);

  if (!pipeline || !resolved) {
    return (
      <div className="max-w-[1440px] mx-auto page-content">
        <div className="glass-card flex flex-col items-center gap-2 p-10 text-center">
          <ShieldAlert className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
          <div className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Campaign not found</div>
          <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            No pipeline exists for campaign “{id}”.
          </p>
          <button onClick={() => navigate('/ops-union')} className="btn-primary mt-1 px-4 py-2 text-sm">
            Back to pipeline
          </button>
        </div>
      </div>
    );
  }

  const { campaign } = resolved;
  const health = getCampaignHealth(campaign);
  const delivered = campaign.deliveredLeads ?? campaign.delivered ?? 0;
  const target = campaign.goalLeads ?? campaign.target ?? 0;
  const cpl = target > 0 && campaign.budget ? Math.round(campaign.budget / target) : 0;
  const replacements = getReplacementStats(campaign.id);
  const paired = ABM_SYNDICATION_CROSSWALK.find(x => x.syndicationCampaignId === campaign.id);
  const openRequests = openRequestsFor(campaign.id);
  const openExceptions = exceptionsFor(campaign.id).filter(e => e.status === 'open').length;
  const liveJobs = jobsFor(campaign.id, relishJobs);

  // Both the TCC and the Northwind copy of each job card join by name, so match
  // on the renamed name AND the client id or the wrong row comes back.
  const jobCard = mockJobCards.find(
    c => c.clientId === UNION_CLIENT_ID && c.campaignName === CAMPAIGN_RENAMES[campaign.id],
  );

  // Prev/next across the three pipelines — lateral movement without a list page.
  const idx = campaignPipelines.findIndex(p => p.campaignId === campaign.id);
  const prev = idx > 0 ? campaignPipelines[idx - 1] : undefined;
  const next = idx < campaignPipelines.length - 1 ? campaignPipelines[idx + 1] : undefined;

  const preview = () => { setPreviewingClient(true); navigate(`/campaigns/${campaign.id}`); };
  const toThread = () => document.getElementById('campaign-discussion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // What is actually blocked on ops right now, derived from live state.
  const decisions: Array<{ label: string; sub: string; go: () => void }> = [
    ...tasksFor(campaign.id)
      .filter(t => t.kind === 'intake')
      .map(t => ({ label: t.label, sub: t.sub, go: () => navigate(`/ops-union/intake?campaign=${campaign.id}`) })),
    ...(openExceptions > 0
      ? [{ label: `Clear ${openExceptions} QA exception${openExceptions === 1 ? '' : 's'}`, sub: 'Flagged rows waiting on a decision', go: toThread }]
      : []),
    ...(pipeline.enrichment.stage === 'review'
      ? [{ label: `Review ${pipeline.enrichment.returned} enriched briefings`, sub: 'Back from Relish, not yet published', go: () => toast.info('Enrichment review lands in the next build.') }]
      : []),
    ...(pipeline.intake.source === 'none'
      ? [{ label: 'No batch received', sub: pipeline.enrichment.label, go: () => navigate(`/ops-union/intake?campaign=${campaign.id}`) }]
      : []),
    ...(replacements.remaining > 0
      ? [{ label: `${replacements.remaining} replacements still owed`, sub: `${replacements.totalRejected} rejected · ${replacements.totalReplaced} replaced`, go: toThread }]
      : []),
    ...(openRequests > 0
      ? [{ label: `${openRequests} open client request${openRequests === 1 ? '' : 's'}`, sub: 'Awaiting a reply from Datamatics', go: toThread }]
      : []),
  ];

  return (
    <div className="max-w-[1440px] mx-auto page-content space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => navigate('/ops-union')} className="btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-2 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Pipeline
        </button>
        <div className="flex items-center gap-1">
          <button
            disabled={!prev}
            onClick={() => prev && navigate(`/ops-union/campaigns/${prev.campaignId}`)}
            className="btn-ghost inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-xs font-semibold disabled:opacity-35"
            title={prev ? prev.campaignName : undefined}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Previous</span>
          </button>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {idx + 1}/{campaignPipelines.length}
          </span>
          <button
            disabled={!next}
            onClick={() => next && navigate(`/ops-union/campaigns/${next.campaignId}`)}
            className="btn-ghost inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-xs font-semibold disabled:opacity-35"
            title={next ? next.campaignName : undefined}
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {pipeline.campaignName}
            </h1>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
            >
              #{campaign.id}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            <CampaignHealthBadge health={health} showDetails />
            {campaign.startDate && campaign.endDate && <span>{campaign.startDate} – {campaign.endDate}</span>}
            {campaign.budget && <span>{fmtMoney(campaign.budget)} budget</span>}
            {cpl > 0 && <span>{fmtMoney(cpl)} CPL</span>}
            <TalBadge campaignId={campaign.id} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/ops-union/intake?campaign=${campaign.id}`)}
            className="btn-outline inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold"
          >
            <UploadCloud className="h-4 w-4" /> Intake batch
          </button>
          <button
            onClick={() => pipeline.enrichment.stage === 'review'
              ? toast.success('Batch published to the client portal')
              : undefined}
            disabled={pipeline.enrichment.stage !== 'review'}
            className="btn-outline inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold disabled:opacity-40"
            title={pipeline.enrichment.stage === 'review' ? undefined : 'Nothing in review for this campaign'}
          >
            <Send className="h-4 w-4" /> Publish to portal
          </button>
          <button onClick={preview} className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold">
            <Eye className="h-4 w-4" /> Preview client view
          </button>
        </div>
      </div>

      {/* The two tiles the client never sees are live here. */}
      <CampaignKpiBand
        hideOps={false}
        billable={cpl > 0 ? fmtMoney(cpl * delivered) : '—'}
        cpl={cpl > 0 ? fmtMoney(cpl) : '—'}
        delivered={delivered}
        target={target}
        progressPercent={health.progressPercent}
        acceptanceRate={campaign.acceptanceRate ?? 0}
        timeElapsedPercent={health.timeElapsedPercent}
        paceColor={health.color}
        paceLabel={health.label}
        qaValidPercent={pipeline.qa?.validPct}
        openRequests={openRequests}
        onOpenRequests={toThread}
      />

      <div className="glass-card p-4">
        <PipelineStages pipeline={pipeline} liveJob={liveJobs[liveJobs.length - 1]} />
      </div>

      {/* Needs a decision */}
      <div className="glass-card p-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
          Needs a decision
        </h2>
        {decisions.length === 0 ? (
          <p className="mt-2 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            Nothing blocked on ops for this campaign.
          </p>
        ) : (
          <div className="mt-1 divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {decisions.map(d => (
              <button
                key={d.label}
                onClick={d.go}
                className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-[var(--color-primary)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{d.label}</span>
                  <span className="block truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{d.sub}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <CampaignAnalyticsTabs
            // Five tabs: the same four the client sees, plus intake. Batches
            // and exceptions merged (what arrived and what was wrong with it),
            // as did the delivery schedule and the acceptance entry (what was
            // promised and what was accepted). Assets moved into Advertising.
            tabs={[
              {
                // Keyed on the campaign: prev/next keeps this component mounted,
                // and its local decision state must not carry across campaigns.
                key: 'intake', label: 'Intake & QA', Icon: TAB_ICONS.quality,
                content: (
                  <div className="space-y-4" key={campaign.id}>
                    <BatchesTab campaignId={campaign.id} />
                    <ExceptionsTab campaignId={campaign.id} />
                  </div>
                ),
              },
              {
                // Ops-entered acceptance & billing sits with the schedule it
                // settles. Remounts per campaign so draft inputs never leak.
                key: 'billing', label: 'Delivery & Billing', Icon: Wallet,
                content: (
                  <div className="space-y-4" key={campaign.id}>
                    <DeliveryAcceptanceTab campaign={campaign} />
                    {/* Same section the client sees, plus cost per lead — the
                        publisher trade-off that decides what gets renewed. */}
                    <SyndicationPerformance
                      campaignId={campaign.id}
                      totalLeads={campaign.deliveredLeads ?? campaign.totalLeads}
                      opsView
                    />
                    {campaign.deliverySchedule && campaign.deliverySchedule.length > 0 ? (
                      <DeliveryScheduleSection campaign={campaign} bare />
                    ) : (
                      <div className="py-8 text-center">
                        <Calendar className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          No delivery schedule set for this campaign yet.
                        </p>
                      </div>
                    )}
                  </div>
                ),
              },
              paired && {
                key: 'reach', label: 'Reach', Icon: Target,
                content: <CampaignReachTab abmCampaignId={paired.abmCampaignId} />,
              },
              paired && {
                key: 'audience', label: 'Audience', Icon: UsersRound,
                content: <CampaignAudienceTab abmCampaignId={paired.abmCampaignId} />,
              },
              paired && {
                key: 'advertising', label: 'Advertising', Icon: TAB_ICONS.programmatic,
                content: <CampaignProgrammaticTab abmCampaignId={paired.abmCampaignId} opsView />,
              },
            ]}
          />

          {/* The linking workflow: convention suggests, ops confirms, the id joins. */}
          <ConnectionsPanel campaignId={campaign.id} campaignName={pipeline.campaignName} />

          <ReplacementTracker
            totalRejected={replacements.totalRejected}
            totalReplaced={replacements.totalReplaced}
            remaining={replacements.remaining}
          />

          {jobCard && (
            <div className="glass-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <Link2 className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Job card &amp; Salesforce
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                <span><b style={{ color: 'var(--color-text-primary)' }}>{jobCard.id}</b> · {jobCard.stage.replace(/_/g, ' ')}</span>
                <span>
                  Salesforce:{' '}
                  <b style={{ color: jobCard.salesforce.status === 'synced' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {jobCard.salesforce.status}
                  </b>
                  {jobCard.salesforce.opportunityId ? ` · ${jobCard.salesforce.opportunityId}` : ''}
                </span>
                <button
                  onClick={() => toast.success(`Re-sync queued for ${jobCard.id}`)}
                  className="btn-ghost inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-sync
                </button>
              </div>
            </div>
          )}
        </div>

        <div id="campaign-discussion" className="lg:relative lg:col-span-2">
          <CampaignThread
            campaignId={campaign.id}
            campaignName={pipeline.campaignName}
            activities={lens(getActivitiesForCampaign(campaign.id))}
            variant="rail"
            fill
          />
        </div>
      </div>
    </div>
  );
}
