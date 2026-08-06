import { useSyncExternalStore } from 'react';
import { CAMPAIGN_RENAMES } from './unionClient';

// ─── UNION OPS pipeline state ────────────────────────────────────────────────
// The kitchen behind the Northwind portal: what data came in per campaign
// (CSV upload or CRM pull), how it QA'd, what went to Relish for enrichment,
// what came back, and what is live on the client portal. All mock, shaped so
// every number the ops screens show agrees with what the client login sees.

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
    detail: '6 flagged rows awaiting a decision',
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
    qa: { validPct: 97, flagged: 6 },
    enrichment: { stage: 'review', sent: 246, returned: 20, label: '20 enriched briefings back Aug 2 — in review' },
    published: { count: 232, at: '2026-07-28' },
    programmatic: { abmName: 'Atlas AI Infrastructure — ABM Air Cover', synced: true },
  },
  {
    campaignId: '46873',
    campaignName: CAMPAIGN_RENAMES['46873'],
    intake: { source: 'crm', label: 'Salesforce nightly pull', rows: 118, receivedAt: '2026-08-06' },
    qa: { validPct: 99, flagged: 1 },
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
    label: 'Clear 6 CleanRich QA exceptions',
    sub: `${CAMPAIGN_RENAMES['46888']} · flagged rows from batch 4`,
    campaignId: '46888',
    kind: 'qa',
  },
];

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
