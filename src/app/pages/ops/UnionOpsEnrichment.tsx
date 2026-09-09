import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Inbox, Sparkles } from 'lucide-react';
import {
  enrichmentBatches, type EnrichmentBatch,
  BATCH_STATUS_LABEL, RELISH_LIMITS,
  batchProgressPct, formatDuration, batchElapsed, isInFlight,
} from '../../data/unionEnrichment';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { BatchDetail } from '../../components/ops/BatchDetail';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// ─── UNION OPS · Relish enrichment batches ───────────────────────────────────
// The processing view of the Relish API: what has been submitted, what is still
// running, and — the reason this screen exists — what failed and how. Selecting
// a row opens the batch detail beneath the table.

export default function UnionOpsEnrichment() {
  useDocumentTitle('Enrichment batches');
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(enrichmentBatches[0]?.batchId ?? '');
  const selected = enrichmentBatches.find(b => b.batchId === selectedId);

  const inFlight = enrichmentBatches.filter(isInFlight).length;
  const failed = enrichmentBatches.filter(b => b.status === 'failed').length;
  const recordsToday = enrichmentBatches
    .filter(b => b.createdAt.startsWith('2026-08-07'))
    .reduce((sum, b) => sum + b.validLeads, 0);

  const columns: Column<EnrichmentBatch>[] = [
    {
      key: 'batch', header: 'Batch', primary: true, widthClass: 'w-[30%]',
      sortValue: b => b.campaignName,
      text: b => `${b.campaignName} ${b.batchId} ${b.workflowName}`,
      render: b => (
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{b.campaignName}</div>
          <div className="truncate font-mono text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{b.batchId}</div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', widthClass: 'w-[14%]',
      sortValue: b => BATCH_STATUS_LABEL[b.status], text: b => BATCH_STATUS_LABEL[b.status],
      render: b => <StatusBadge status={BATCH_STATUS_LABEL[b.status]} />,
    },
    {
      key: 'records', header: 'Records', align: 'right', widthClass: 'w-[14%]',
      sortValue: b => b.totalLeads,
      text: b => `${b.completed}/${b.totalLeads}`,
      render: b => (
        <span className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          <span className="font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{b.completed.toLocaleString()}</span>
          {' / '}{b.totalLeads.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'progress', header: 'Progress', widthClass: 'w-[18%]',
      sortValue: b => batchProgressPct(b), text: b => `${batchProgressPct(b)}%`,
      render: b => {
        const pct = batchProgressPct(b);
        const tone = b.status === 'failed' ? 'var(--color-error)' : b.status === 'completed' ? 'var(--color-success)' : 'var(--color-primary)';
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
            </div>
            <span className="w-9 text-right text-[12px] font-bold" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'issues', header: 'Issues', widthClass: 'w-[12%]',
      sortValue: b => b.failed + b.invalidLeads + (b.error ? 1000 : 0),
      text: b => (b.error ? `HTTP ${b.error.status}` : `${b.failed + b.invalidLeads}`),
      render: b => {
        if (b.error) {
          return <span className="text-[12px] font-bold" style={{ color: 'var(--color-error)' }}>HTTP {b.error.status}</span>;
        }
        const issues = b.failed + b.invalidLeads;
        if (issues === 0) return <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>—</span>;
        return (
          <span className="text-[12px] font-bold" style={{ color: 'var(--color-warning)' }}>
            {issues.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'time', header: 'Time', align: 'right', mobileHidden: true,
      widthClass: 'hidden lg:table-cell lg:w-[12%]',
      sortValue: b => b.createdAt,
      text: b => batchElapsed(b) ?? formatDuration(b.estimatedTimeRemaining) ?? '—',
      render: b => {
        const elapsed = batchElapsed(b);
        const eta = formatDuration(b.estimatedTimeRemaining);
        return (
          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {elapsed ?? (isInFlight(b) ? (eta ? `~${eta}` : 'estimating') : '—')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1140px] mx-auto page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate('/ops-union')}
          className="btn-ghost inline-flex min-h-[38px] items-center gap-1.5 px-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Ops overview
        </button>
        <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
          Relish Enrichment API v1.0
        </span>
      </div>

      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Enrichment batches
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-text-muted)' }}>
          {inFlight} in flight · {failed} failed · {recordsToday.toLocaleString()} of{' '}
          {RELISH_LIMITS.dailyAllowance.toLocaleString()} records submitted today · up to{' '}
          {RELISH_LIMITS.maxBatchSize.toLocaleString()} per call
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={enrichmentBatches}
        getRowId={b => b.batchId}
        onRowClick={b => setSelectedId(b.batchId)}
        searchPlaceholder="Search campaign, batch id, workflow…"
        layout="fixed"
        countLabel={n => `${n} batches`}
        empty={{ icon: Inbox, title: 'No batches yet', description: 'Submitted enrichment batches appear here.' }}
      />

      {selected && (
        <div className="glass-card p-5">
          <BatchDetail batch={selected} />
        </div>
      )}
    </div>
  );
}
