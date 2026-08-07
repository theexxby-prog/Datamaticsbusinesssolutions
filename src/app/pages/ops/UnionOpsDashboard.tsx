import { useNavigate } from 'react-router';
import {
  Eye, AlertTriangle, ArrowRight, ClipboardList, RefreshCw, Plus, Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  integrationStatuses, campaignPipelines, opsTasks, useRelishJobs, jobsFor,
  adOnlyCampaigns, useCreatedCampaigns, CAMPAIGN_TYPES_META,
  type CampaignPipeline, type IntegrationStatus, type OpsTask,
} from '../../data/unionOps';
import { CampaignTypeChip } from '../../components/ops/CampaignTypeChip';
import { enrichmentBatches } from '../../data/unionEnrichment';
import { PipelineStages } from '../../components/ops/PipelineStages';
import { UNION_COMPANY } from '../../data/unionClient';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// ─── UNION OPS · pipeline dashboard ──────────────────────────────────────────
// The ops home: integration health on top, the per-campaign pipeline board in
// the middle (data in → QA → Relish → portal → programmatic), and the task
// queue below. Preview buttons drop into the exact client view at any point.

const STATE_META: Record<IntegrationStatus['state'], { color: string; label: string }> = {
  connected: { color: 'var(--color-success)', label: 'Connected' },
  syncing: { color: 'var(--color-info)', label: 'Syncing' },
  attention: { color: 'var(--color-warning)', label: 'Needs attention' },
};

function HealthStrip() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {integrationStatuses.map(integration => {
        const meta = STATE_META[integration.state];
        return (
          // .kpi-card rather than a bespoke bordered div: the hand-rolled
          // version missed the blur, the brand's card shadow and its glass
          // wash, so this strip read flat against the rest of the page.
          <div key={integration.key} className="kpi-card" style={{ padding: '12px 14px' }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {integration.name}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: meta.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{integration.detail}</div>
            <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{integration.lastActivity}</div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineRow({
  pipeline, onOpen, onPreview,
}: {
  pipeline: CampaignPipeline;
  onOpen: (campaignId: string) => void;
  onPreview: (campaignId: string) => void;
}) {
  const jobs = jobsFor(pipeline.campaignId, useRelishJobs());
  const liveJob = jobs[jobs.length - 1];

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => onOpen(pipeline.campaignId)} className="flex flex-wrap items-center gap-2 text-left">
          <span
            className="text-sm font-bold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {pipeline.campaignName}
          </span>
          <CampaignTypeChip type={pipeline.type} />
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
          >
            #{pipeline.campaignId}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(pipeline.campaignId)}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            Open <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPreview(pipeline.campaignId)}
            className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>

      <div className="mt-3">
        <PipelineStages pipeline={pipeline} liveJob={liveJob} />
      </div>
    </div>
  );
}

function TaskQueue() {
  const navigate = useNavigate();

  // Intake has its own flow; everything else is worked in the campaign workspace.
  const act = (task: OpsTask) => {
    if (task.kind === 'intake') {
      navigate(`/ops-union/intake?campaign=${task.campaignId}`);
    } else {
      navigate(`/ops-union/campaigns/${task.campaignId}`);
    }
  };

  return (
    <div className="glass-card p-4">
      <h2 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <ClipboardList className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        Up next
      </h2>
      <div className="mt-2 divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
        {opsTasks.map(task => (
          <div key={task.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {task.label}
              </div>
              <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{task.sub}</div>
            </div>
            <button
              onClick={() => act(task)}
              className="btn-ghost inline-flex flex-shrink-0 items-center gap-1 px-2.5 py-1.5 text-xs font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              {task.kind === 'intake' ? 'Start' : 'Open'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UnionOpsDashboard() {
  useDocumentTitle('Operations');
  const navigate = useNavigate();
  const { setPreviewingClient } = useAuth();

  const preview = (path: string) => {
    setPreviewingClient(true);
    navigate(path);
  };

  const attention = integrationStatuses.filter(i => i.state === 'attention').length;
  // Anything the API rejected or dropped records on — the reason to open the
  // batch screen rather than assume the enrichment side is quiet.
  const batchesNeedingAttention = enrichmentBatches.filter(
    b => b.status === 'failed' || b.failed > 0 || b.invalidLeads > 0,
  ).length;

  return (
    <div className="max-w-[1600px] mx-auto page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            Operations pipeline
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            {UNION_COMPANY} · everything that feeds the client portal
            {attention > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle className="h-3.5 w-3.5" /> {attention} integration needs attention
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/ops-union/enrichment')}
            className="btn-ghost flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Layers className="h-4 w-4" />
            Enrichment batches
            {batchesNeedingAttention > 0 && (
              <span
                className="inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}
              >
                {batchesNeedingAttention}
              </span>
            )}
          </button>
          <button
            onClick={() => preview('/dashboard')}
            className="btn-outline flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Eye className="h-4 w-4" /> Preview client view
          </button>
          <button
            onClick={() => navigate('/ops-union/campaigns/new')}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            data-testid="new-campaign"
          >
            <Plus className="h-4 w-4" /> New campaign
          </button>
        </div>
      </div>

      <HealthStrip />

      <RecentlyCreated />

      <div className="flex items-center gap-2 pt-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
          Campaign pipelines
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <RefreshCw className="h-3 w-3" /> CRM pulls nightly · CSV any time
        </span>
      </div>
      <div className="space-y-3">
        {campaignPipelines.map(pipeline => (
          <PipelineRow
            key={pipeline.campaignId}
            pipeline={pipeline}
            onOpen={id => navigate(`/ops-union/campaigns/${id}`)}
            onPreview={id => preview(`/campaigns/${id}`)}
          />
        ))}
        {/* Pure programmatic runs have no intake/QA/enrichment — they deliver
            impressions and bill on them, so the row shows that shape. */}
        {adOnlyCampaigns.map(c => (
          <div key={c.campaignId} className="glass-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{c.name}</span>
              <CampaignTypeChip type={c.type} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              <span>
                <b style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {c.impressionsDelivered.toLocaleString('en-US')}
                </b>{' '}
                of {c.impressionsTarget.toLocaleString('en-US')} impressions
              </span>
              <span><b style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{c.clicks.toLocaleString('en-US')}</b> clicks</span>
              <span>{c.cohorts} cohorts</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--color-gray-100)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((c.impressionsDelivered / c.impressionsTarget) * 100))}%`,
                  background: 'var(--color-primary-solid)',
                }}
              />
            </div>
            <div className="mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.note}</div>
          </div>
        ))}
      </div>

      {/* The month roll-up card is gone on purpose: its one load-bearing
          number (open QA exceptions) already lives in the CleanRich health
          tile, and the board itself is the per-campaign truth. */}
      <TaskQueue />
    </div>
  );
}

// Campaigns minted this session, newest first. They have no pipeline yet —
// intake hasn't run — so they render as a compact strip above the board with
// the minted ID front and centre, and a jump straight into data intake.
function RecentlyCreated() {
  const navigate = useNavigate();
  const created = useCreatedCampaigns();
  if (created.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
        Recently created
      </h2>
      {created.map(c => {
        const meta = CAMPAIGN_TYPES_META.find(t => t.code === c.type);
        return (
          <div key={c.id} className="glass-card flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--color-primary)' }}>
                  {c.id}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
                >
                  {meta?.label ?? c.type}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {c.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {c.clientName} (<span className="font-mono">{c.clientId}</span>) · {c.startDate} → {c.endDate}
                {c.targetLeads ? ` · ${c.targetLeads.toLocaleString('en-US')} leads` : ''}
                {c.targetImpressions ? ` · ${c.targetImpressions.toLocaleString('en-US')} impressions` : ''}
                {' · '}{c.createdLabel}
              </div>
              {/* Why creation exists (per Ben): aligning data to the campaign.
                  Ad-bearing types surface their one pending alignment step. */}
              {c.type !== 'CS' && (
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Awaiting Propensity link — the ad campaign's name must start with{' '}
                  <span className="font-mono font-semibold">{c.id}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/ops-union/intake?campaign=${c.id}`)}
              className="btn-outline inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              Start intake <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
