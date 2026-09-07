import { UploadCloud, ShieldCheck, Sparkles, Globe2, Radio, type LucideIcon } from 'lucide-react';
import type { CampaignPipeline, RelishJob } from '../../data/unionOps';
import { formatDateShort } from '../../utils/formatDate';

// ─── The five pipeline stages ────────────────────────────────────────────────
// Data in → QA → Relish → Portal → Programmatic. Shared by the ops pipeline
// board and the per-campaign workspace so the two can never tell different
// stories about the same batch.

type Tone = 'ok' | 'warn' | 'muted';

function Stage({
  icon: Icon, title, line, sub, tone,
}: {
  icon: LucideIcon; title: string; line: string; sub?: string; tone?: Tone;
}) {
  const color = tone === 'ok' ? 'var(--color-success)' : tone === 'warn' ? 'var(--color-warning)' : 'var(--color-text-muted)';
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        {title}
      </div>
      <div className="mt-1 truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }} title={line}>
        {line}
      </div>
      {sub && (
        <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }} title={sub}>{sub}</div>
      )}
    </div>
  );
}

export function PipelineStages({ pipeline, liveJob }: { pipeline: CampaignPipeline; liveJob?: RelishJob }) {
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 xl:grid-cols-5">
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
  );
}
