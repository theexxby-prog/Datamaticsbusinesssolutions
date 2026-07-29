// ─── Campaign thread ─────────────────────────────────────────────────────────
// One feed per campaign carrying everything people need to say about it:
// comments, file attachments and change requests. Before this existed the same
// traffic lived in Teams messages and a shared network folder, which meant a
// request could be agreed in chat and then lost, and nobody could tell which
// version of a target account list was actually live.
//
// The three kinds are deliberately one data type rather than three features —
// they interleave chronologically and are read together.

export type ThreadEntryKind = 'comment' | 'attachment' | 'change_request';

/** Change requests carry state so they can't quietly disappear into the chat. */
export type RequestStatus = 'open' | 'acknowledged' | 'done';

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  done: 'Done',
};

/**
 * Attachment kinds we treat specially. A target account list is versioned
 * because the only question that matters mid-campaign is *which list is live*
 * — a filename in a folder never answered that.
 */
export type AttachmentKind = 'tal' | 'suppression' | 'creative' | 'brief' | 'other';

export const ATTACHMENT_KIND_LABEL: Record<AttachmentKind, string> = {
  tal: 'Target account list',
  suppression: 'Suppression list',
  creative: 'Creative',
  brief: 'Brief',
  other: 'Document',
};

export interface ThreadAttachment {
  id: string;
  name: string;
  /** Pre-formatted for display — there is no real file store behind this. */
  sizeLabel: string;
  kind: AttachmentKind;
  /** Set for versioned kinds (TAL). v3 supersedes v2. */
  version?: number;
}

export interface ThreadAuthor {
  name: string;
  /** Drives the side the entry renders on and the avatar colour. */
  side: 'client' | 'datamatics';
  jobTitle: string;
}

export interface CampaignThreadEntry {
  id: string;
  campaignId: string;
  kind: ThreadEntryKind;
  author: ThreadAuthor;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  attachments?: ThreadAttachment[];
  /** Present only on change requests. */
  status?: RequestStatus;
  /** Audit trail for a request's status transitions. */
  statusLog?: { status: RequestStatus; at: string; by: string }[];
}

export const RENUKA: ThreadAuthor = {
  name: 'Renuka Lawless',
  side: 'client',
  jobTitle: 'The Channel Company',
};

export const BRIJESH: ThreadAuthor = {
  name: 'Brijesh Singh',
  side: 'datamatics',
  jobTitle: 'Campaign Manager',
};

// ─── Seeded conversation ─────────────────────────────────────────────────────
// Written to look like a fortnight of real traffic on each campaign: an open
// request waiting on Datamatics, one already acknowledged, one closed out, and
// a TAL that has been revised twice.

export const seedThreadEntries: CampaignThreadEntry[] = [
  // ── 46888 Lenovo Intel FIFA AI ────────────────────────────────────────────
  {
    id: 'th_1', campaignId: '46888', kind: 'comment', author: RENUKA,
    body: 'Pacing looks good on this one. The FIFA angle is landing better with the MSP segment than we expected — worth noting for the Q4 planning.',
    createdAt: '2026-07-14T09:20:00Z',
  },
  {
    id: 'th_2', campaignId: '46888', kind: 'attachment', author: RENUKA,
    body: 'Refreshed target account list — added 60 EMEA solution providers, removed the 12 accounts that went to a competitor last quarter.',
    createdAt: '2026-07-21T11:05:00Z',
    attachments: [
      { id: 'att_1', name: 'Lenovo_FIFA_AI_TAL_v2.xlsx', sizeLabel: '184 KB', kind: 'tal', version: 2 },
    ],
  },
  {
    id: 'th_3', campaignId: '46888', kind: 'comment', author: BRIJESH,
    body: 'Received, thanks. The new EMEA accounts are loaded and live from the Jul 27 batch onward. The 12 removals are in suppression so they will not resurface.',
    createdAt: '2026-07-21T15:42:00Z',
  },
  {
    id: 'th_4', campaignId: '46888', kind: 'change_request', author: RENUKA,
    body: 'Can we tighten the job title filter? We are seeing a few "IT Coordinator" titles come through and Lenovo wants director level and above for this one. Everything else stays as is.',
    createdAt: '2026-07-24T10:15:00Z',
    status: 'acknowledged',
    statusLog: [
      { status: 'open', at: '2026-07-24T10:15:00Z', by: 'Renuka Lawless' },
      { status: 'acknowledged', at: '2026-07-24T13:30:00Z', by: 'Brijesh Singh' },
    ],
  },
  {
    id: 'th_5', campaignId: '46888', kind: 'comment', author: BRIJESH,
    body: 'Noted — filter is updated for the next batch. The 4 coordinator-level leads already delivered will be replaced at no charge.',
    createdAt: '2026-07-24T13:31:00Z',
  },
  {
    id: 'th_6', campaignId: '46888', kind: 'attachment', author: RENUKA,
    body: 'Latest TAL with the EMEA mid-market tier added. This supersedes v2 — please use this from the August batches.',
    createdAt: '2026-07-28T08:50:00Z',
    attachments: [
      { id: 'att_2', name: 'Lenovo_FIFA_AI_TAL_v3.xlsx', sizeLabel: '211 KB', kind: 'tal', version: 3 },
    ],
  },
  {
    id: 'th_7', campaignId: '46888', kind: 'change_request', author: RENUKA,
    body: 'One more — could we hold the Aug 3 batch until Wednesday? Lenovo are re-running their own outreach that Monday and we would rather not overlap.',
    createdAt: '2026-07-29T09:05:00Z',
    status: 'open',
    statusLog: [{ status: 'open', at: '2026-07-29T09:05:00Z', by: 'Renuka Lawless' }],
  },

  // ── 46873 Uptime Solutions CRN2 ───────────────────────────────────────────
  {
    id: 'th_8', campaignId: '46873', kind: 'attachment', author: RENUKA,
    body: 'Suppression list for this campaign — these are accounts Uptime are already engaged with directly.',
    createdAt: '2026-07-09T14:30:00Z',
    attachments: [
      { id: 'att_3', name: 'Uptime_CRN2_Suppression.csv', sizeLabel: '38 KB', kind: 'suppression' },
    ],
  },
  {
    id: 'th_9', campaignId: '46873', kind: 'change_request', author: RENUKA,
    body: 'We are at 59 of 80 with a month to go. Can we lift the weekly volume from 6 to 8 so we land the full target before Aug 31?',
    createdAt: '2026-07-22T16:10:00Z',
    status: 'done',
    statusLog: [
      { status: 'open', at: '2026-07-22T16:10:00Z', by: 'Renuka Lawless' },
      { status: 'acknowledged', at: '2026-07-23T09:40:00Z', by: 'Brijesh Singh' },
      { status: 'done', at: '2026-07-27T10:00:00Z', by: 'Brijesh Singh' },
    ],
  },
  {
    id: 'th_10', campaignId: '46873', kind: 'comment', author: BRIJESH,
    body: 'Volume is up from the Jul 27 batch — 7 delivered against 6 scheduled, and the remaining weeks are set to 7. That puts us at 80 by Aug 24, a week ahead of the end date.',
    createdAt: '2026-07-27T10:02:00Z',
  },

  // ── 46936 Eaton 2026 Full Year 1_Q3 ───────────────────────────────────────
  {
    id: 'th_11', campaignId: '46936', kind: 'comment', author: RENUKA,
    body: 'Eaton have asked for a mid-campaign read on industry mix. Anything you can share on where the 41 have come from so far?',
    createdAt: '2026-07-23T11:00:00Z',
  },
  {
    id: 'th_12', campaignId: '46936', kind: 'comment', author: BRIJESH,
    body: 'Roughly 40% manufacturing, 25% data centre, 20% commercial construction, the rest spread. I can put the full breakdown in the weekly digest on Monday if that is easier to forward on.',
    createdAt: '2026-07-23T12:35:00Z',
  },
  {
    id: 'th_13', campaignId: '46936', kind: 'attachment', author: RENUKA,
    body: 'Eaton refreshed their account list for Q3. Same structure as before.',
    createdAt: '2026-07-27T15:20:00Z',
    attachments: [
      { id: 'att_4', name: 'Eaton_Q3_TAL_v2.xlsx', sizeLabel: '97 KB', kind: 'tal', version: 2 },
    ],
  },
];

/** The live TAL for a campaign — highest version wins. */
export function latestTal(entries: CampaignThreadEntry[]): { attachment: ThreadAttachment; entry: CampaignThreadEntry } | null {
  let best: { attachment: ThreadAttachment; entry: CampaignThreadEntry } | null = null;
  for (const entry of entries) {
    for (const attachment of entry.attachments ?? []) {
      if (attachment.kind !== 'tal') continue;
      if (!best || (attachment.version ?? 0) > (best.attachment.version ?? 0)) {
        best = { attachment, entry };
      }
    }
  }
  return best;
}

/** Requests still waiting on Datamatics. Drives the badge counts. */
export function openRequestCount(entries: CampaignThreadEntry[]): number {
  return entries.filter(e => e.kind === 'change_request' && e.status !== 'done').length;
}
