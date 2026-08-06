import { useNavigate } from 'react-router';
import {
  Eye, UploadCloud, ShieldCheck, Sparkles, Globe2, Radio, CircleCheck,
  AlertTriangle, ArrowRight, ClipboardList, Database, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import {
  integrationStatuses, campaignPipelines, opsTasks, useRelishJobs,
  type CampaignPipeline, type IntegrationStatus, type OpsTask,
} from '../../data/unionOps';
import { UNION_COMPANY } from '../../data/unionClient';
import { formatDateShort } from '../../utils/formatDate';
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
          <div
            key={integration.key}
            className="rounded-xl border px-3.5 py-3"
            style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
          >
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

// One stage cell on the pipeline board.
function Stage({
  icon: Icon, title, line, sub, tone,
}: {
  icon: typeof Database; title: string; line: string; sub?: string; tone?: 'ok' | 'warn' | 'muted';
}) {
  const color = tone === 'ok' ? 'var(--color-success)' : tone === 'warn' ? 'var(--color-warning)' : 'var(--color-text-muted)';
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        {title}
      </div>
      <div className="mt-1 truncate text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }} title={line}>
        {line}
      </div>
      {sub && (
        <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }} title={sub}>{sub}</div>
      )}
    </div>
  );
}

function PipelineRow({ pipeline, onPreview }: { pipeline: CampaignPipeline; onPreview: (campaignId: string) => void }) {
  const jobs = useRelishJobs().filter(j => j.campaignId === pipeline.campaignId);
  const liveJob = jobs[jobs.length - 1];

  const intakeLine = pipeline.intake.source === 'none'
    ? pipeline.intake.label
    : `${pipeline.intake.rows} rows · ${pipeline.intake.source === 'csv' ? 'CSV' : 'CRM'}`;
  const intakeSub = pipeline.intake.source === 'none'
    ? undefined
    : `${pipeline.intake.label}${pipeline.intake.receivedAt ? ` · ${formatDateShort(pipeline.intake.receivedAt)}` : ''}`;

  // A batch just sent from the intake flow supersedes the seeded Relish line.
  const relishLine = liveJob
    ? `${liveJob.rows} rows sent`
    : pipeline.enrichment.stage === 'idle' ? '—'
    : `${pipeline.enrichment.sent} sent · ${pipeline.enrichment.returned} back`;
  const relishSub = liveJob ? liveJob.sentLabel : pipeline.enrichment.label;

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {pipeline.campaignName}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
          >
            #{pipeline.campaignId}
          </span>
        </div>
        <button
          onClick={() => onPreview(pipeline.campaignId)}
          className="btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 xl:grid-cols-5">
        <Stage
          icon={UploadCloud}
          title="Data in"
          line={intakeLine}
          sub={intakeSub}
          tone={pipeline.intake.source === 'none' ? 'warn' : 'ok'}
        />
        <Stage
          icon={ShieldCheck}
          title="QA"
          line={pipeline.qa ? `${pipeline.qa.validPct}% valid` : '—'}
          sub={pipeline.qa ? `${pipeline.qa.flagged} flagged` : 'Waiting on intake'}
          tone={pipeline.qa ? (pipeline.qa.flagged > 2 ? 'warn' : 'ok') : 'muted'}
        />
        <Stage
          icon={Sparkles}
          title="Relish"
          line={relishLine}
          sub={relishSub}
          tone={liveJob ? 'ok' : pipeline.enrichment.stage === 'idle' ? 'muted' : pipeline.enrichment.stage === 'review' ? 'warn' : 'ok'}
        />
        <Stage
          icon={Globe2}
          title="Portal"
          line={pipeline.published ? `${pipeline.published.count} leads live` : 'Not published'}
          sub={pipeline.published ? `Published ${formatDateShort(pipeline.published.at)}` : undefined}
          tone={pipeline.published ? 'ok' : 'muted'}
        />
        <Stage
          icon={Radio}
          title="Programmatic"
          line={pipeline.programmatic.synced ? 'Paired · synced' : 'Not paired'}
          sub={pipeline.programmatic.abmName}
          tone={pipeline.programmatic.synced ? 'ok' : 'muted'}
        />
      </div>
    </div>
  );
}

function TaskQueue() {
  const navigate = useNavigate();

  const act = (task: OpsTask) => {
    if (task.kind === 'intake') {
      navigate(`/ops-union/intake?campaign=${task.campaignId}`);
    } else {
      toast.info('The enrichment review and publish screens land in the next build.');
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
            onPreview={id => preview(`/campaigns/${id}`)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TaskQueue />
        </div>
        <div className="glass-card p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <CircleCheck className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
            This month
          </h2>
          <div className="mt-2 space-y-2 text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center justify-between">
              <span>Rows ingested</span>
              <b style={{ color: 'var(--color-text-primary)' }}>370</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Sent to Relish</span>
              <b style={{ color: 'var(--color-text-primary)' }}>364</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Enriched briefings back</span>
              <b style={{ color: 'var(--color-text-primary)' }}>138</b>
            </div>
            <div className="flex items-center justify-between">
              <span>Published to portal</span>
              <b style={{ color: 'var(--color-text-primary)' }}>118</b>
            </div>
            <div className="flex items-center justify-between">
              <span>QA pass rate</span>
              <b style={{ color: 'var(--color-success)' }}>97.6%</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
