import { useSyncExternalStore } from 'react';
import { CAMPAIGN_RENAMES, UNION_CLIENT_ID, UNION_COMPANY } from './unionClient';
import type { LeadUploadBatch } from './mockClients';

// ─── UNION OPS pipeline state ────────────────────────────────────────────────
// The kitchen behind the Northwind portal: what data came in per campaign
// (CSV upload or CRM pull), how it QA'd, what went to Relish for enrichment,
// what came back, and what is live on the client portal. All mock, shaped so
// every number the ops screens show agrees with what the client login sees.

/** The demo clock. Every timestamp on the ops surface sits inside this month. */
export const OPS_MONTH = '2026-08';
export const OPS_MONTH_LABEL = 'August 2026';

// ── QA exceptions ───────────────────────────────────────────────────────────
// Declared before the pipelines so `qa.flagged` can be derived from them — the
// board, the CleanRich integration card and the task queue all quote the same
// count, and deriving it means they can never drift apart.

export interface QaException {
  id: string;
  campaignId: string;
  /** Where it sits in the source file, e.g. 'Row 45'. */
  rowRef: string;
  contact: string;
  company: string;
  field: 'Email' | 'Phone' | 'Job title' | 'Company size';
  reason: string;
  severity: 'invalid' | 'caution';
  suggestedAction: 'Drop row' | 'Enrich via Relish' | 'Send back to source';
  status: 'open' | 'fixed' | 'dropped';
  flaggedAt: string;
}

export const qaExceptions: QaException[] = [
  {
    id: 'qa-1', campaignId: '46888', rowRef: 'Row 45', contact: 'D. Whitfield', company: 'Meridian Grid Systems',
    field: 'Email', reason: 'Free-mail domain — not a corporate address', severity: 'invalid',
    suggestedAction: 'Drop row', status: 'open', flaggedAt: '2026-07-30',
  },
  {
    id: 'qa-2', campaignId: '46888', rowRef: 'Row 78', contact: 'P. Anand', company: 'Corvus Analytics',
    field: 'Email', reason: 'Soft-bounce risk — mailbox full on last send', severity: 'caution',
    suggestedAction: 'Enrich via Relish', status: 'open', flaggedAt: '2026-07-30',
  },
  {
    id: 'qa-3', campaignId: '46888', rowRef: 'Row 112', contact: 'S. Okafor', company: 'Halden Manufacturing',
    field: 'Job title', reason: 'Title below the seniority floor agreed in the job card', severity: 'invalid',
    suggestedAction: 'Send back to source', status: 'open', flaggedAt: '2026-07-30',
  },
  {
    id: 'qa-4', campaignId: '46888', rowRef: 'Row 140', contact: 'R. Lindqvist', company: 'Northbridge Energy',
    field: 'Phone', reason: 'Number fails E.164 validation for the stated country', severity: 'caution',
    suggestedAction: 'Enrich via Relish', status: 'open', flaggedAt: '2026-07-31',
  },
  {
    id: 'qa-5', campaignId: '46888', rowRef: 'Row 187', contact: 'M. Castellanos', company: 'Vireo Health Group',
    field: 'Company size', reason: 'Employee band outside the target range', severity: 'caution',
    suggestedAction: 'Send back to source', status: 'open', flaggedAt: '2026-07-31',
  },
  {
    id: 'qa-6', campaignId: '46888', rowRef: 'Row 221', contact: 'T. Brennan', company: 'Meridian Grid Systems',
    field: 'Email', reason: 'Duplicate of Row 45 after domain normalisation', severity: 'invalid',
    suggestedAction: 'Drop row', status: 'open', flaggedAt: '2026-07-31',
  },
  {
    id: 'qa-7', campaignId: '46873', rowRef: 'Row 63', contact: 'A. Duval', company: 'Cobalt Rail Systems',
    field: 'Phone', reason: 'Direct dial missing — switchboard number only', severity: 'caution',
    suggestedAction: 'Enrich via Relish', status: 'open', flaggedAt: '2026-08-06',
  },
];

export function exceptionsFor(campaignId: string): QaException[] {
  return qaExceptions.filter(e => e.campaignId === campaignId);
}

export function openExceptionCount(): number {
  return qaExceptions.filter(e => e.status === 'open').length;
}

// ── Integration health ──────────────────────────────────────────────────────

export type IntegrationState = 'connected' | 'syncing' | 'attention';

export interface IntegrationStatus {
  key: 'relish' | 'propensity' | 'crm' | 'cleanrich';
  name: string;
  state: IntegrationState;
  detail: string;
  lastActivity: string;
}

export const integrationStatuses: IntegrationStatus[] = [
  {
    key: 'relish',
    name: 'Relish API',
    state: 'connected',
    detail: '1,240 of 5,000 monthly enrichments used',
    lastActivity: 'Last call Aug 5, 8:40 AM',
  },
  {
    key: 'propensity',
    name: 'Propensity API',
    state: 'connected',
    detail: '3 ABM campaigns paired',
    lastActivity: 'Audience sync Aug 6, 2:00 AM',
  },
  {
    key: 'crm',
    name: 'Northwind Salesforce',
    state: 'connected',
    detail: 'Nightly lead pull enabled',
    lastActivity: 'Last pull Aug 6, 1:30 AM',
  },
  {
    key: 'cleanrich',
    name: 'CleanRich QA',
    state: 'attention',
    detail: `${openExceptionCount()} flagged rows awaiting a decision`,
    lastActivity: 'Batch checked Aug 5, 6:15 PM',
  },
];

// ── Per-campaign pipeline ───────────────────────────────────────────────────

export type EnrichmentStage = 'idle' | 'queued' | 'sent' | 'review' | 'published';

export interface CampaignPipeline {
  campaignId: string;
  campaignName: string;
  intake: {
    source: 'csv' | 'crm' | 'none';
    label: string;
    rows: number;
    receivedAt?: string; // ISO date
  };
  qa: { validPct: number; flagged: number } | null;
  enrichment: {
    stage: EnrichmentStage;
    sent: number;
    returned: number;
    label: string;
  };
  published: { count: number; at: string } | null;
  programmatic: { abmName: string; synced: boolean };
}

export const campaignPipelines: CampaignPipeline[] = [
  {
    campaignId: '46888',
    campaignName: CAMPAIGN_RENAMES['46888'],
    intake: { source: 'csv', label: 'atlas-q3-batch4.csv', rows: 252, receivedAt: '2026-07-30' },
    qa: { validPct: 97, flagged: exceptionsFor('46888').length },
    enrichment: { stage: 'review', sent: 246, returned: 20, label: '20 enriched briefings back Aug 2 — in review' },
    published: { count: 232, at: '2026-07-28' },
    programmatic: { abmName: 'Atlas AI Infrastructure — ABM Air Cover', synced: true },
  },
  {
    campaignId: '46873',
    campaignName: CAMPAIGN_RENAMES['46873'],
    intake: { source: 'crm', label: 'Salesforce nightly pull', rows: 118, receivedAt: '2026-08-06' },
    qa: { validPct: 99, flagged: exceptionsFor('46873').length },
    enrichment: { stage: 'published', sent: 118, returned: 118, label: 'Batch enriched and published Aug 4' },
    published: { count: 118, at: '2026-08-04' },
    programmatic: { abmName: 'Resilience Suite — Channel ABM', synced: true },
  },
  {
    campaignId: '46936',
    campaignName: CAMPAIGN_RENAMES['46936'],
    intake: { source: 'none', label: 'Awaiting August batch', rows: 0 },
    qa: null,
    enrichment: { stage: 'idle', sent: 0, returned: 0, label: 'Next batch due Aug 8' },
    published: { count: 96, at: '2026-07-21' },
    programmatic: { abmName: 'GridWorks FY2026 — Industrial ICP Display', synced: true },
  },
];

// ── Ops task queue ──────────────────────────────────────────────────────────

export interface OpsTask {
  id: string;
  label: string;
  sub: string;
  campaignId: string;
  /** Where the task takes you. 'intake' → the intake flow; the rest land in
   *  phase-2 screens, so they surface as context for now. */
  kind: 'intake' | 'review' | 'publish' | 'qa';
  due?: string;
}

export const opsTasks: OpsTask[] = [
  {
    id: 'task-1',
    label: 'Send the GridWorks August batch to Relish',
    sub: `${CAMPAIGN_RENAMES['46936']} · intake due Aug 8`,
    campaignId: '46936',
    kind: 'intake',
    due: '2026-08-08',
  },
  {
    id: 'task-2',
    label: 'Review 20 enriched briefings from Relish',
    sub: `${CAMPAIGN_RENAMES['46888']} · returned Aug 2`,
    campaignId: '46888',
    kind: 'review',
  },
  {
    id: 'task-3',
    label: 'Publish Atlas batch 4 to the client portal',
    sub: `${CAMPAIGN_RENAMES['46888']} · after enrichment review`,
    campaignId: '46888',
    kind: 'publish',
  },
  {
    id: 'task-4',
    label: `Clear ${exceptionsFor('46888').length} CleanRich QA exceptions`,
    sub: `${CAMPAIGN_RENAMES['46888']} · flagged rows from batch 4`,
    campaignId: '46888',
    kind: 'qa',
  },
];

// ── Batch history ───────────────────────────────────────────────────────────
// Every file and CRM pull that has landed, per campaign. Reuses the shape the
// internal upload dashboard already uses; the newest row per campaign matches
// that campaign's `intake`, and the older rows sum to roughly what is published.

export const opsBatches: LeadUploadBatch[] = [
  {
    id: 'ub_atlas_4', campaignId: '46888', campaignName: CAMPAIGN_RENAMES['46888'],
    clientId: UNION_CLIENT_ID, clientName: UNION_COMPANY, uploadedBy: 'Praful Sanil',
    uploadedAt: '2026-07-30T09:15:00Z', status: 'completed', fileName: 'atlas-q3-batch4.csv',
    totalRows: 252, processedRows: 252, successCount: 246, errorCount: 6,
    errorDetails: exceptionsFor('46888').map(e => `${e.rowRef}: ${e.reason}`),
  },
  {
    id: 'ub_atlas_3', campaignId: '46888', campaignName: CAMPAIGN_RENAMES['46888'],
    clientId: UNION_CLIENT_ID, clientName: UNION_COMPANY, uploadedBy: 'Praful Sanil',
    uploadedAt: '2026-07-14T08:40:00Z', status: 'completed', fileName: 'atlas-q3-batch3.csv',
    totalRows: 128, processedRows: 128, successCount: 126, errorCount: 2,
  },
  {
    id: 'ub_atlas_2', campaignId: '46888', campaignName: CAMPAIGN_RENAMES['46888'],
    clientId: UNION_CLIENT_ID, clientName: UNION_COMPANY, uploadedBy: 'Brijesh Singh',
    uploadedAt: '2026-06-30T10:05:00Z', status: 'completed', fileName: 'atlas-q3-batch2.csv',
    totalRows: 112, processedRows: 112, successCount: 110, errorCount: 2,
  },
  {
    id: 'ub_resilience_2', campaignId: '46873', campaignName: CAMPAIGN_RENAMES['46873'],
    clientId: UNION_CLIENT_ID, clientName: UNION_COMPANY, uploadedBy: 'Salesforce sync',
    uploadedAt: '2026-08-06T01:30:00Z', status: 'completed', fileName: 'Salesforce nightly pull',
    totalRows: 118, processedRows: 118, successCount: 117, errorCount: 1,
    errorDetails: exceptionsFor('46873').map(e => `${e.rowRef}: ${e.reason}`),
  },
  {
    id: 'ub_resilience_1', campaignId: '46873', campaignName: CAMPAIGN_RENAMES['46873'],
    clientId: UNION_CLIENT_ID, clientName: UNION_COMPANY, uploadedBy: 'Salesforce sync',
    uploadedAt: '2026-07-16T01:30:00Z', status: 'completed', fileName: 'Salesforce nightly pull',
    totalRows: 96, processedRows: 96, successCount: 95, errorCount: 1,
  },
  {
    id: 'ub_gridworks_1', campaignId: '46936', campaignName: CAMPAIGN_RENAMES['46936'],
    clientId: UNION_CLIENT_ID, clientName: UNION_COMPANY, uploadedBy: 'Praful Sanil',
    uploadedAt: '2026-07-21T11:20:00Z', status: 'completed', fileName: 'gridworks-jul-batch2.csv',
    totalRows: 98, processedRows: 98, successCount: 96, errorCount: 2,
  },
];

/** Batches for one campaign, newest first. */
export function batchesFor(campaignId: string): LeadUploadBatch[] {
  return opsBatches
    .filter(b => b.campaignId === campaignId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

// ── Selectors ───────────────────────────────────────────────────────────────

export function getPipeline(campaignId: string | undefined): CampaignPipeline | undefined {
  return campaignPipelines.find(p => p.campaignId === campaignId);
}

export function tasksFor(campaignId: string): OpsTask[] {
  return opsTasks.filter(t => t.campaignId === campaignId);
}

/** Stage order for the pipeline stepper. */
export const ENRICHMENT_STAGES: EnrichmentStage[] = ['idle', 'queued', 'sent', 'review', 'published'];

// ── Live Relish queue (intake flow → dashboard) ─────────────────────────────
// The intake flow enqueues a job here when "Send to Relish" is clicked; the
// pipeline dashboard subscribes so the new job shows up the moment you land
// back on it. In-memory only — a refresh resets the demo, which is fine.

export interface RelishJob {
  id: string;
  campaignId: string;
  campaignName: string;
  rows: number;
  source: 'csv' | 'crm';
  status: 'sent';
  sentLabel: string;
}

let jobs: RelishJob[] = [];
const listeners = new Set<() => void>();

export function enqueueRelishJob(job: Omit<RelishJob, 'id' | 'status' | 'sentLabel'>): void {
  jobs = [
    ...jobs,
    { ...job, id: `job-${jobs.length + 1}`, status: 'sent', sentLabel: 'Sent to Relish just now' },
  ];
  listeners.forEach(l => l());
}

export function useRelishJobs(): RelishJob[] {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => jobs,
    () => jobs,
  );
}

/** Live jobs for one campaign, oldest first. */
export function jobsFor(campaignId: string, list: RelishJob[]): RelishJob[] {
  return list.filter(j => j.campaignId === campaignId);
}

// ── Month roll-up ───────────────────────────────────────────────────────────
// Everything the "This month" card shows, derived from the pipelines so the
// card, the board and the campaign detail can never disagree. Pass the live
// Relish jobs in and the sent figure grows as batches are dispatched.

export interface OpsMonthRollup {
  rowsIngested: number;
  sentToRelish: number;
  enrichedBack: number;
  publishedToPortal: number;
  qaPassRatePct: number;
  openExceptions: number;
}

export function getMonthRollup(liveJobs: RelishJob[] = []): OpsMonthRollup {
  const sum = (fn: (p: CampaignPipeline) => number) => campaignPipelines.reduce((s, p) => s + fn(p), 0);
  const rowsIngested = sum(p => p.intake.rows);
  const qaWeighted = campaignPipelines.reduce(
    (s, p) => s + (p.qa ? p.qa.validPct * p.intake.rows : 0),
    0,
  );
  const qaRows = campaignPipelines.reduce((s, p) => s + (p.qa ? p.intake.rows : 0), 0);

  return {
    rowsIngested,
    sentToRelish: sum(p => p.enrichment.sent) + liveJobs.reduce((s, j) => s + j.rows, 0),
    enrichedBack: sum(p => p.enrichment.returned),
    publishedToPortal: campaignPipelines.reduce(
      (s, p) => s + (p.published?.at.startsWith(OPS_MONTH) ? p.published.count : 0),
      0,
    ),
    qaPassRatePct: qaRows > 0 ? Math.round((qaWeighted / qaRows) * 10) / 10 : 0,
    openExceptions: openExceptionCount(),
  };
}
