export interface CampaignActivity {
  id: string;
  campaignId: string;
  type: 'delivery' | 'rejection' | 'replacement' | 'milestone' | 'status_change' | 'note';
  title: string;
  description: string;
  timestamp: string; // ISO date
  icon: 'truck' | 'x-circle' | 'refresh' | 'flag' | 'edit' | 'message';
}

export const campaignActivities: CampaignActivity[] = [
  // ─── 46888: Lenovo Intel FIFA AI ─────────────────────────────────────────
  {
    id: 'act_1', campaignId: '46888', type: 'delivery',
    title: '47 leads delivered',
    description: 'Batch #8 delivered - 47 validated leads, all QA checks passed.',
    timestamp: '2026-07-27T14:30:00Z', icon: 'truck',
  },
  {
    id: 'act_2', campaignId: '46888', type: 'milestone',
    title: 'Campaign reached 90% delivery',
    description: '314 of 350 target leads delivered. Tracking to complete ahead of the Oct 31 end date.',
    timestamp: '2026-07-27T16:00:00Z', icon: 'flag',
  },
  {
    id: 'act_3', campaignId: '46888', type: 'delivery',
    title: '45 leads delivered',
    description: 'Batch #7 delivered - 45 validated leads across MSP and solution-provider accounts.',
    timestamp: '2026-07-20T11:45:00Z', icon: 'truck',
  },
  {
    id: 'act_4', campaignId: '46888', type: 'delivery',
    title: '44 leads delivered',
    description: 'Batch #6 delivered - highest weekly volume to date.',
    timestamp: '2026-07-13T10:30:00Z', icon: 'truck',
  },
  {
    id: 'act_5', campaignId: '46888', type: 'milestone',
    title: 'Campaign reached 50% delivery',
    description: '178 of 350 target leads delivered, comfortably ahead of pace.',
    timestamp: '2026-07-06T16:00:00Z', icon: 'flag',
  },
  {
    id: 'act_6', campaignId: '46888', type: 'note',
    title: 'Client requested additional BANT fields',
    description: 'Renuka Lawless requested adding "Budget Authority" and "Purchase Timeline" fields to lead format.',
    timestamp: '2026-06-22T14:20:00Z', icon: 'message',
  },
  {
    id: 'act_7', campaignId: '46888', type: 'status_change',
    title: 'Campaign went live',
    description: 'Job card signed by all parties. Campaign is now active.',
    timestamp: '2026-06-07T08:00:00Z', icon: 'edit',
  },

  // ─── 46873: Uptime Solutions CRN2 - Lead Gen ─────────────────────────────
  {
    id: 'act_8', campaignId: '46873', type: 'delivery',
    title: '7 leads delivered',
    description: 'Weekly batch delivered - infrastructure and DevOps decision makers.',
    timestamp: '2026-07-27T09:00:00Z', icon: 'truck',
  },
  {
    id: 'act_9', campaignId: '46873', type: 'milestone',
    title: 'Campaign reached 75% delivery',
    description: '59 of 80 target leads delivered ahead of the Aug 31 end date.',
    timestamp: '2026-07-27T16:00:00Z', icon: 'flag',
  },
  {
    id: 'act_10', campaignId: '46873', type: 'delivery',
    title: '6 leads delivered',
    description: 'Weekly batch delivered - all leads passed QA on first review.',
    timestamp: '2026-07-20T09:00:00Z', icon: 'truck',
  },
  {
    id: 'act_11', campaignId: '46873', type: 'status_change',
    title: 'Campaign went live',
    description: 'Job card signed by all parties. Campaign is now active.',
    timestamp: '2026-05-25T08:00:00Z', icon: 'edit',
  },

  // ─── 46936: Eaton 2026 Full Year 1_Q3 ────────────────────────────────────
  {
    id: 'act_12', campaignId: '46936', type: 'delivery',
    title: '10 leads delivered',
    description: 'Weekly batch delivered - facilities and data centre operations titles.',
    timestamp: '2026-07-27T10:15:00Z', icon: 'truck',
  },
  {
    id: 'act_13', campaignId: '46936', type: 'delivery',
    title: '9 leads delivered',
    description: 'Weekly batch delivered - volume climbing week on week.',
    timestamp: '2026-07-20T10:15:00Z', icon: 'truck',
  },
  {
    id: 'act_14', campaignId: '46936', type: 'milestone',
    title: 'Campaign reached 40% delivery',
    description: '41 of 100 target leads delivered inside the first month.',
    timestamp: '2026-07-27T16:00:00Z', icon: 'flag',
  },
  {
    id: 'act_15', campaignId: '46936', type: 'status_change',
    title: 'Campaign went live',
    description: 'Job card signed by all parties. Campaign is now active.',
    timestamp: '2026-06-29T08:00:00Z', icon: 'edit',
  },

  // ─── camp_2a: Enterprise Outreach ────────────────────────────────────────
  {
    id: 'act_20', campaignId: 'camp_2a', type: 'delivery',
    title: '200 leads delivered',
    description: 'Batch #4 — North America enterprise segment.',
    timestamp: '2026-02-28T15:00:00Z', icon: 'truck',
  },
  {
    id: 'act_21', campaignId: 'camp_2a', type: 'milestone',
    title: 'Campaign reached 25% delivery',
    description: '345 of 1,200 target leads delivered.',
    timestamp: '2026-02-15T12:00:00Z', icon: 'flag',
  },

  // ─── camp_3a: UK Banking BANT ────────────────────────────────────────────
  {
    id: 'act_22', campaignId: 'camp_3a', type: 'delivery',
    title: '85 leads delivered',
    description: 'Batch #2 — UK banking sector BANT-qualified leads.',
    timestamp: '2026-02-27T10:00:00Z', icon: 'truck',
  },
  {
    id: 'act_23', campaignId: 'camp_3a', type: 'rejection',
    title: '5 leads rejected by client',
    description: 'Reasons: 3 missing BANT criteria, 2 already in CRM.',
    timestamp: '2026-02-25T14:30:00Z', icon: 'x-circle',
  },
];

export function getActivitiesForCampaign(campaignId: string): CampaignActivity[] {
  return campaignActivities
    .filter(a => a.campaignId === campaignId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Calculate lead replacement stats for a campaign
 */
export function getReplacementStats(campaignId: string) {
  const activities = campaignActivities.filter(a => a.campaignId === campaignId);

  // Count total rejected from rejection activities
  const rejections = activities.filter(a => a.type === 'rejection');
  const totalRejected = rejections.reduce((sum, a) => {
    const match = a.title.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  // Count total replacements delivered
  const replacements = activities.filter(a => a.type === 'replacement');
  const totalReplaced = replacements.reduce((sum, a) => {
    const match = a.title.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  return {
    totalRejected,
    totalReplaced,
    remaining: Math.max(0, totalRejected - totalReplaced),
    isFullyReplaced: totalReplaced >= totalRejected,
  };
}
