import { AlertTriangle, Download, Layers, Clock, Ban } from 'lucide-react';
import {
  type EnrichmentBatch, type BatchProgressBlock,
  BATCH_STATUS_LABEL, RELISH_LIMITS,
  batchProgressPct, dedupSaving, formatDuration, batchElapsed, isInFlight,
} from '../../data/unionEnrichment';
import { StatusBadge } from '../StatusBadge';
import { formatDateLong } from '../../utils/formatDate';

// Detail for one Relish enrichment batch. Shows the two research passes
// separately, what deduplication saved, and — when the batch did not simply
// succeed — exactly what went wrong and whether anything is still usable.

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--color-main-bg)' }}>
      <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      <div
        className="mt-0.5 text-[15px] font-extrabold"
        style={{ color: tone ?? 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * The two passes move independently — accounts are researched first and
 * contacts resolve against them — so they get a bar each. A single combined
 * percentage hides which pass a slow batch is actually stuck in.
 */
function ProgressPass({ title, block }: { title: string; block: BatchProgressBlock }) {
  const done = block.completed + block.failed + block.cached;
  const pct = block.total > 0 ? Math.min(100, Math.round((done / block.total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{title}</span>
        <span className="text-[11.5px]" style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {block.completed.toLocaleString()} / {block.total.toLocaleString()}
          {block.cached > 0 && ` · ${block.cached.toLocaleString()} cached`}
          {block.failed > 0 && ` · ${block.failed.toLocaleString()} failed`}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}>
        <div style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
      </div>
    </div>
  );
}

export function BatchDetail({ batch }: { batch: EnrichmentBatch }) {
  const dedup = dedupSaving(batch);
  const elapsed = batchElapsed(batch);
  const eta = formatDuration(batch.estimatedTimeRemaining);
  const overBatchCap = batch.totalLeads > RELISH_LIMITS.maxBatchSize;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={BATCH_STATUS_LABEL[batch.status]} />
        <span className="font-mono text-[12px]" style={{ color: 'var(--color-text-muted)' }}>{batch.batchId}</span>
        <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
          · {batch.workflowName} · submitted {formatDateLong(batch.createdAt.slice(0, 10))}
        </span>
      </div>

      {/* Error first when there is one: on a 429 or 403 nothing was accepted,
          so the progress figures below are all zero and would only mislead. */}
      {batch.error && (
        <div
          className="rounded-xl border p-3.5"
          style={{ background: 'var(--color-error-bg)', borderColor: 'color-mix(in srgb, var(--color-error) 25%, transparent)' }}
        >
          <div className="flex items-start gap-2.5">
            <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-error)' }} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold" style={{ color: 'var(--color-error)' }}>
                HTTP {batch.error.status} · {batch.error.status === 429 ? 'Quota reached' : batch.error.status === 403 ? 'Workflow not assigned' : 'Batch failed'}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {batch.error.message}
              </p>
              {batch.error.retryAfter !== undefined && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  <Clock className="h-3.5 w-3.5" />
                  Retry-After {formatDuration(batch.error.retryAfter)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {overBatchCap && (
        <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--color-warning)' }}>
          <AlertTriangle className="h-3.5 w-3.5" />
          {batch.totalLeads.toLocaleString()} records exceeds the {RELISH_LIMITS.maxBatchSize.toLocaleString()} per-call cap — split across calls.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Submitted" value={batch.totalLeads.toLocaleString()} />
        <Stat
          label="Valid"
          value={batch.validLeads.toLocaleString()}
          tone={batch.invalidLeads > 0 ? 'var(--color-warning)' : undefined}
        />
        <Stat
          label="Delivered"
          value={batch.completed.toLocaleString()}
          tone={batch.completed > 0 ? 'var(--color-success)' : undefined}
        />
        <Stat
          label="Failed"
          value={batch.failed.toLocaleString()}
          tone={batch.failed > 0 ? 'var(--color-error)' : undefined}
        />
      </div>

      {(isInFlight(batch) || batch.progress.contactProfiles.total > 0) && (
        <div className="space-y-3 rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Research progress · {batchProgressPct(batch)}%
            </span>
            <span className="text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
              {isInFlight(batch)
                ? eta
                  ? `~${eta} remaining`
                  : 'Estimating…'
                : elapsed
                  ? `Completed in ${elapsed}`
                  : ''}
            </span>
          </div>
          <ProgressPass title="Account profiles (companyAgainst)" block={batch.progress.againstProfiles} />
          <ProgressPass title="Contact profiles" block={batch.progress.contactProfiles} />
        </div>
      )}

      {dedup.saved > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border-light)' }}>
          <Layers className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {batch.uniquePairings.toLocaleString()} unique account pairings
            </span>{' '}
            across {batch.validLeads.toLocaleString()} contacts — {dedup.saved.toLocaleString()} fewer company
            researches ({dedup.pct}%). Each account is researched once and billed once however many contacts share it.
          </p>
        </div>
      )}

      {/* Invalid records are itemised and skipped; the rest of the batch still
          runs. Showing them as a list rather than a count is the difference
          between "9 failed" and knowing which column to fix upstream. */}
      {batch.invalidLeadDetails.length > 0 && (
        <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border-light)' }}>
          <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: 'var(--color-warning)' }}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {batch.invalidLeads} record{batch.invalidLeads === 1 ? '' : 's'} rejected at submission
          </p>
          <ul className="space-y-1.5">
            {batch.invalidLeadDetails.map(detail => (
              <li key={detail.field} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <code className="font-mono text-[11.5px]" style={{ color: 'var(--color-text-primary)' }}>{detail.field}</code>
                <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>{detail.reason}</span>
              </li>
            ))}
          </ul>
          {batch.invalidLeads > batch.invalidLeadDetails.length && (
            <p className="mt-2 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
              Showing the first {batch.invalidLeadDetails.length}; the API itemises up to 10.
            </p>
          )}
        </div>
      )}

      {batch.downloadUrl && (
        <a
          href={batch.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[38px] items-center gap-2 rounded-xl px-3.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          <Download className="h-4 w-4" />
          Signed CSV export
        </a>
      )}
    </div>
  );
}
