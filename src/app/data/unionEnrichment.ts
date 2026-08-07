// ─── Relish enrichment batches — the processing lifecycle ────────────────────
// Mirrors the Relish Enrichment API v1.0 batch contract so the ops screens show
// what the integration will actually have to handle.
//
// This is a DIFFERENT axis from `EnrichmentStage` in unionOps.ts. That one
// ('idle' → 'queued' → 'sent' → 'review' → 'published') is the Datamatics
// business workflow: who has looked at the rows and whether they reached the
// client. This one is the API's own processing lifecycle for a single POST.
// A batch can be `completed` here while its campaign is still `review` there.
//
// The states below are deliberately not a happy path. Every one is reachable
// against the live API, and each is something the build has to render:
// partial failure, records rejected at submission, total failure, the daily
// quota, and a workflow that is not assigned to the calling key.

/** `status` on GET /enrichment/batch/:batchId. */
export type BatchStatus = 'pending' | 'grouping' | 'processing' | 'completed' | 'failed';

/** Documented HTTP failures worth rendering distinctly. */
export type BatchErrorStatus = 400 | 401 | 403 | 404 | 429 | 500;

export interface BatchProgressBlock {
  total: number;
  completed: number;
  failed: number;
  /** Company pairings served from a previous run rather than researched again. */
  cached: number;
}

export interface EnrichmentBatch {
  batchId: string;
  campaignId: string;
  campaignName: string;
  workflowId: string;
  workflowName: string;
  status: BatchStatus;
  totalLeads: number;
  validLeads: number;
  invalidLeads: number;
  /** The API itemises the first 10 rejections; the rest still process. */
  invalidLeadDetails: Array<{ field: string; reason: string }>;
  /**
   * Company-level deduplication. Each unique pairing is researched once and
   * billed once however many contacts share it, so this is the billing basis
   * and not a cosmetic number — worth showing next to totalLeads.
   */
  uniquePairings: number;
  completed: number;
  failed: number;
  progress: {
    againstProfiles: BatchProgressBlock;
    contactProfiles: BatchProgressBlock;
  };
  /** Seconds, or null before the platform has enough signal to estimate. */
  estimatedTimeRemaining: number | null;
  createdAt: string;
  completedAt?: string;
  /** Signed CSV/XLSX link from the completion webhook; expires. */
  downloadUrl?: string;
  error?: { status: BatchErrorStatus; message: string; retryAfter?: number };
}

/** Published limits, from the contract's capacity table. */
export const RELISH_LIMITS = {
  maxBatchSize: 10_000,
  dailyAllowance: 50_000,
  resultsPerPage: 1_000,
  maxParallelWorkers: 800,
} as const;

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  pending: 'Queued',
  grouping: 'Grouping',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

/**
 * The reference batch is the run Relish cites in the documentation: 252
 * contacts across 185 unique accounts, completed in 8m02s at 95.6% field
 * completeness. Keeping the healthy fixture on those exact numbers means the
 * screen matches the evidence the vendor gave us.
 */
export const enrichmentBatches: EnrichmentBatch[] = [
  {
    batchId: 'batch_9fk2p1',
    campaignId: 'sr_q3_2026',
    campaignName: 'Q3 2026 Enriched Campaign',
    workflowId: 'wf_full_enrichment',
    workflowName: 'Full Enrichment',
    status: 'completed',
    totalLeads: 252,
    validLeads: 252,
    invalidLeads: 0,
    invalidLeadDetails: [],
    uniquePairings: 185,
    completed: 252,
    failed: 0,
    progress: {
      againstProfiles: { total: 185, completed: 185, failed: 0, cached: 0 },
      contactProfiles: { total: 252, completed: 252, failed: 0, cached: 0 },
    },
    estimatedTimeRemaining: 0,
    createdAt: '2026-08-06T11:07:23Z',
    completedAt: '2026-08-06T11:15:25Z',
    downloadUrl: 'https://storage.googleapis.com/relish-exports/batch_9fk2p1/enriched-results.csv',
  },
  {
    // In flight. The two progress blocks move independently — accounts are
    // researched first and contacts resolve against them — so a single
    // percentage would hide where the time is actually going.
    batchId: 'batch_c4m8xz',
    campaignId: 'cmp_union_q4_emea',
    campaignName: 'UNION Q4 EMEA Expansion',
    workflowId: 'wf_full_enrichment',
    workflowName: 'Full Enrichment',
    status: 'processing',
    totalLeads: 1_480,
    validLeads: 1_477,
    invalidLeads: 3,
    invalidLeadDetails: [
      { field: 'leads[311].companyAgainst.domain', reason: 'companyAgainst.domain is required' },
      { field: 'leads[884].contact.name', reason: 'contact.name is required' },
      { field: 'leads[1290].companyFor.domain', reason: 'companyFor.domain exceeds 255 characters' },
    ],
    uniquePairings: 902,
    completed: 1_016,
    failed: 4,
    progress: {
      againstProfiles: { total: 902, completed: 771, failed: 3, cached: 64 },
      contactProfiles: { total: 1_477, completed: 1_016, failed: 4, cached: 0 },
    },
    estimatedTimeRemaining: 214,
    createdAt: '2026-08-07T09:41:02Z',
  },
  {
    // Accepted, still queued — no estimate available this early.
    batchId: 'batch_j7t0qd',
    campaignId: 'cmp_union_partner_tier2',
    campaignName: 'UNION Partner Tier 2',
    workflowId: 'wf_contact_only',
    workflowName: 'Contact Intelligence Only',
    status: 'pending',
    totalLeads: 640,
    validLeads: 640,
    invalidLeads: 0,
    invalidLeadDetails: [],
    uniquePairings: 0,
    completed: 0,
    failed: 0,
    progress: {
      againstProfiles: { total: 0, completed: 0, failed: 0, cached: 0 },
      contactProfiles: { total: 640, completed: 0, failed: 0, cached: 0 },
    },
    estimatedTimeRemaining: null,
    createdAt: '2026-08-07T10:12:44Z',
  },
  {
    // Completed with losses. The doc is explicit that invalid records are
    // itemised and skipped while every valid record still processes, so the
    // useful reading is "241 of 268 delivered", not "failed".
    batchId: 'batch_2wq5vb',
    campaignId: 'cmp_union_dach_mid',
    campaignName: 'UNION DACH Mid-Market',
    workflowId: 'wf_full_enrichment',
    workflowName: 'Full Enrichment',
    status: 'completed',
    totalLeads: 268,
    validLeads: 259,
    invalidLeads: 9,
    invalidLeadDetails: [
      { field: 'leads[12].companyAgainst.domain', reason: 'companyAgainst.domain is required' },
      { field: 'leads[38].companyAgainst.name', reason: 'companyAgainst.name is required' },
      { field: 'leads[44].contact.name', reason: 'contact.name is required' },
      { field: 'leads[77].companyFor.name', reason: 'companyFor.name exceeds 255 characters' },
      { field: 'leads[90].companyAgainst.domain', reason: 'companyAgainst.domain is not a valid domain' },
      { field: 'leads[118].contact.name', reason: 'contact.name is required' },
      { field: 'leads[151].companyAgainst.domain', reason: 'companyAgainst.domain is required' },
      { field: 'leads[203].companyFor.domain', reason: 'companyFor.domain is required' },
      { field: 'leads[247].companyAgainst.name', reason: 'companyAgainst.name is required' },
    ],
    uniquePairings: 174,
    completed: 241,
    failed: 18,
    progress: {
      againstProfiles: { total: 174, completed: 168, failed: 6, cached: 22 },
      contactProfiles: { total: 259, completed: 241, failed: 18, cached: 0 },
    },
    estimatedTimeRemaining: 0,
    createdAt: '2026-08-05T14:02:10Z',
    completedAt: '2026-08-05T14:11:48Z',
    downloadUrl: 'https://storage.googleapis.com/relish-exports/batch_2wq5vb/enriched-results.csv',
  },
  {
    // batch.failed — the webhook fires this only when every record fails.
    batchId: 'batch_p0z3nn',
    campaignId: 'cmp_union_apac_pilot',
    campaignName: 'UNION APAC Pilot',
    workflowId: 'wf_full_enrichment',
    workflowName: 'Full Enrichment',
    status: 'failed',
    totalLeads: 96,
    validLeads: 96,
    invalidLeads: 0,
    invalidLeadDetails: [],
    uniquePairings: 71,
    completed: 0,
    failed: 96,
    progress: {
      againstProfiles: { total: 71, completed: 0, failed: 71, cached: 0 },
      contactProfiles: { total: 96, completed: 0, failed: 96, cached: 0 },
    },
    estimatedTimeRemaining: 0,
    createdAt: '2026-08-04T08:30:00Z',
    completedAt: '2026-08-04T08:34:12Z',
    error: { status: 500, message: 'Upstream research provider unavailable; every record failed. Retry with backoff.' },
  },
  {
    // 429 — the daily allowance, not the per-batch cap. Nothing was accepted,
    // so there is no batch to poll; only Retry-After tells you when to resubmit.
    batchId: 'batch_r8h6ly',
    campaignId: 'cmp_union_bulk_reload',
    campaignName: 'UNION Bulk Reload',
    workflowId: 'wf_full_enrichment',
    workflowName: 'Full Enrichment',
    status: 'failed',
    totalLeads: 8_200,
    validLeads: 0,
    invalidLeads: 0,
    invalidLeadDetails: [],
    uniquePairings: 0,
    completed: 0,
    failed: 0,
    progress: {
      againstProfiles: { total: 0, completed: 0, failed: 0, cached: 0 },
      contactProfiles: { total: 0, completed: 0, failed: 0, cached: 0 },
    },
    estimatedTimeRemaining: null,
    createdAt: '2026-08-06T23:52:31Z',
    error: {
      status: 429,
      message: `Daily allowance of ${RELISH_LIMITS.dailyAllowance.toLocaleString()} records reached. Resets midnight UTC.`,
      retryAfter: 1_640,
    },
  },
  {
    // 403 — the key is valid, the workflow is not assigned to this account.
    // Distinct from 401, and a configuration problem rather than a data one.
    batchId: 'batch_v1d9ks',
    campaignId: 'cmp_union_signal_refresh',
    campaignName: 'UNION Signal Refresh',
    workflowId: 'wf_signal_only',
    workflowName: 'Verified Signals Only',
    status: 'failed',
    totalLeads: 410,
    validLeads: 0,
    invalidLeads: 0,
    invalidLeadDetails: [],
    uniquePairings: 0,
    completed: 0,
    failed: 0,
    progress: {
      againstProfiles: { total: 0, completed: 0, failed: 0, cached: 0 },
      contactProfiles: { total: 0, completed: 0, failed: 0, cached: 0 },
    },
    estimatedTimeRemaining: null,
    createdAt: '2026-08-03T16:20:05Z',
    error: { status: 403, message: 'Workflow wf_signal_only is not assigned to this account.' },
  },
];

export function getEnrichmentBatch(batchId: string): EnrichmentBatch | undefined {
  return enrichmentBatches.find(b => b.batchId === batchId);
}

/** A batch is still moving — the UI should keep showing progress for these. */
export function isInFlight(batch: EnrichmentBatch): boolean {
  return batch.status === 'pending' || batch.status === 'grouping' || batch.status === 'processing';
}

/**
 * Overall completion across both research passes. Weighted by the work each
 * pass represents rather than averaging two percentages, so a batch with 900
 * accounts and 1,477 contacts does not report progress the contact pass has
 * not actually made.
 */
export function batchProgressPct(batch: EnrichmentBatch): number {
  const { againstProfiles, contactProfiles } = batch.progress;
  const total = againstProfiles.total + contactProfiles.total;
  if (total === 0) return 0;
  const done =
    againstProfiles.completed + againstProfiles.failed + againstProfiles.cached +
    contactProfiles.completed + contactProfiles.failed;
  return Math.min(100, Math.round((done / total) * 100));
}

/**
 * Contacts minus the unique pairings actually researched. This is what
 * company-level dedup saves on a run, and it is the number the commercial
 * conversation turns on.
 */
export function dedupSaving(batch: EnrichmentBatch): { saved: number; pct: number } {
  if (!batch.uniquePairings || batch.validLeads <= 0) return { saved: 0, pct: 0 };
  const saved = Math.max(0, batch.validLeads - batch.uniquePairings);
  return { saved, pct: Math.round((saved / batch.validLeads) * 100) };
}

/** "8m 02s" / "3m 34s" / "45s" — null when the platform has not estimated yet. */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/** Wall-clock a finished batch took, for comparison against the cited 8m02s. */
export function batchElapsed(batch: EnrichmentBatch): string | null {
  if (!batch.completedAt) return null;
  const ms = new Date(batch.completedAt).getTime() - new Date(batch.createdAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return formatDuration(Math.round(ms / 1000));
}
