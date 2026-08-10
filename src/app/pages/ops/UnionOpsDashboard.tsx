import { useNavigate } from 'react-router';
import {
  Eye, CircleCheck, AlertTriangle, ArrowRight, ClipboardList, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  integrationStatuses, campaignPipelines, opsTasks, useRelishJobs, jobsFor,
  exceptionsFor, getMonthRollup, OPS_MONTH_LABEL,
  type CampaignPipeline, type IntegrationStatus, type OpsTask,
} from '../../data/unionOps';
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
            <div className="mt-1 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>{integration.detail}</div>
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
        <button onClick={() => onOpen(pipeline.campaignId)} className="flex items-center gap-2 text-left">
          <span
            className="text-[14px] font-bold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {pipeline.campaignName}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
          >
            #{pipeline.campaignId}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(pipeline.campaignId)}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
          >
            Open <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPreview(pipeline.campaignId)}
            className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
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
              <div className="truncate text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>{task.sub}</div>
            </div>
            <button
              onClick={() => act(task)}
              className="btn-ghost inline-flex flex-shrink-0 items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold"
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

  return (
    <div className="max-w-[1600px] mx-auto page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            Operations pipeline
          </h1>
          <p className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
            {UNION_COMPANY} · everything that feeds the client portal
            {attention > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle className="h-3.5 w-3.5" /> {attention} integration needs attention
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => preview('/dashboard')}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Eye className="h-4 w-4" /> Preview client view
        </button>
      </div>

      <HealthStrip />

      <div className="flex items-center gap-2 pt-1">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
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
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TaskQueue />
        </div>
        <MonthRollupCard />
      </div>
    </div>
  );
}

// Derived from the pipelines, so this card and the board can never disagree.
function MonthRollupCard() {
  const navigate = useNavigate();
  const rollup = getMonthRollup(useRelishJobs());
  const rows: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Rows ingested', value: rollup.rowsIngested.toLocaleString('en-US') },
    { label: 'Sent to Relish', value: rollup.sentToRelish.toLocaleString('en-US') },
    { label: 'Enriched briefings back', value: rollup.enrichedBack.toLocaleString('en-US') },
    { label: 'Published to portal', value: rollup.publishedToPortal.toLocaleString('en-US') },
    { label: 'QA pass rate', value: `${rollup.qaPassRatePct}%`, tone: 'var(--color-success)' },
  ];

  // The campaign carrying the most exceptions is where the work actually is.
  const worst = [...campaignPipelines].sort(
    (a, b) => exceptionsFor(b.campaignId).length - exceptionsFor(a.campaignId).length,
  )[0];

  return (
    <div className="glass-card flex flex-col p-4">
      <h2 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <CircleCheck className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
        {OPS_MONTH_LABEL}
      </h2>
      {/* Spreads through the slack rather than pooling it under the last row:
          this card shares a row with the taller task queue, which sets the
          height. */}
      <div className="mt-2 flex flex-1 flex-col justify-around gap-2 text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span>{row.label}</span>
            <b style={{ color: row.tone ?? 'var(--color-text-primary)' }}>{row.value}</b>
          </div>
        ))}
        <button
          onClick={() => navigate(`/ops-union/campaigns/${worst.campaignId}`)}
          className="flex w-full items-center justify-between border-t pt-2 text-left transition-colors hover:text-[var(--color-primary)]"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          <span>QA exceptions open</span>
          <b style={{ color: rollup.openExceptions > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {rollup.openExceptions}
          </b>
        </button>
      </div>
    </div>
  );
}
