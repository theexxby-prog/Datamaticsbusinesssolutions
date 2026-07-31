// ─── Propensity mock reporting data ──────────────────────────────────────────
// Shaped after Propensity's ten read-only reporting API endpoints
// (api.propensity.com — ABM Campaign Summary, ABM ROI Analytics, Account
// Engagement, Asset Analytics, Campaign Pacing, Campaign Snapshot, Contact
// Engagement, Daily ABM Activities, Daily PDN Spend, Website Analytics) so the
// UI built on this module previews the real integration one-for-one. Every
// series is DETERMINISTIC (index/sine generators, no Math.random()) so charts
// are stable across reloads and screenshots.
//
// The crosswalk below ties each ABM campaign to the TCC content-syndication
// campaign it supports — the join the production build will make via
// campaign_id (per the "Integrate Propensity Data into Pulse Dashboards" epic).

import { allClients } from './mockClients';

// ── Campaign summary / snapshot / pacing (folded to one record) ─────────────

export type AbmCampaignStatus = 'active' | 'completed';

export interface AbmCampaign {
  id: string;
  name: string;
  status: AbmCampaignStatus;
  startDate: string; // ISO
  endDate: string;
  budget: number;
  spendToDate: number;
  pacingPct: number; // spend/time pacing vs plan, 100 = on plan
  goalAccounts: number;
  engagedAccounts: number;
  impressions: number;
  clicks: number;
  roi: number; // pipeline value / spend
  linkedSyndicationCampaignId: string;
}

export interface CrosswalkEntry {
  abmCampaignId: string;
  syndicationCampaignId: string;
  syndicationCampaignName: string;
}

export const ABM_SYNDICATION_CROSSWALK: CrosswalkEntry[] = [
  { abmCampaignId: 'abm_101', syndicationCampaignId: '46888', syndicationCampaignName: 'Lenovo Intel FIFA AI' },
  { abmCampaignId: 'abm_102', syndicationCampaignId: '46873', syndicationCampaignName: 'Uptime Solutions CRN2 - Lead Gen' },
  { abmCampaignId: 'abm_103', syndicationCampaignId: '46936', syndicationCampaignName: 'Eaton 2026 Full Year 1_Q3' },
];

const ABM_CAMPAIGNS: AbmCampaign[] = [
  {
    id: 'abm_101',
    name: 'Lenovo AI Infrastructure — ABM Air Cover',
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-10-31',
    budget: 18000,
    spendToDate: 7420,
    pacingPct: 103,
    goalAccounts: 120,
    engagedAccounts: 86,
    impressions: 412600,
    clicks: 5310,
    roi: 3.4,
    linkedSyndicationCampaignId: '46888',
  },
  {
    id: 'abm_102',
    name: 'Uptime Solutions CRN2 — Channel ABM',
    status: 'active',
    startDate: '2026-06-15',
    endDate: '2026-09-30',
    budget: 9500,
    spendToDate: 3980,
    pacingPct: 96,
    goalAccounts: 80,
    engagedAccounts: 47,
    impressions: 228400,
    clicks: 2740,
    roi: 2.8,
    linkedSyndicationCampaignId: '46873',
  },
  {
    id: 'abm_103',
    name: 'Eaton FY2026 — Industrial ICP Display',
    status: 'active',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    budget: 12000,
    spendToDate: 2310,
    pacingPct: 89,
    goalAccounts: 95,
    engagedAccounts: 28,
    impressions: 131900,
    clicks: 1490,
    roi: 2.1,
    linkedSyndicationCampaignId: '46936',
  },
];

export function getAbmSummary(): AbmCampaign[] {
  return ABM_CAMPAIGNS;
}

export function getCrosswalkForAbm(abmCampaignId: string): CrosswalkEntry | undefined {
  return ABM_SYNDICATION_CROSSWALK.find(c => c.abmCampaignId === abmCampaignId);
}

// ── Deterministic daily series ───────────────────────────────────────────────
// All series end on the demo's "today" (Jul 30, 2026) and are generated from
// the day index with sine ripples — smooth, plausible, and identical on every
// render.

const SERIES_END = new Date(2026, 6, 30); // Jul 30, 2026 (local, matches demo date)

function isoDaysAgo(daysAgo: number): string {
  const d = new Date(SERIES_END);
  d.setDate(d.getDate() - daysAgo);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Smooth deterministic ripple in [-1, 1] for a day index. */
function ripple(i: number, phase = 0): number {
  return Math.sin(i / 5 + phase) * 0.6 + Math.sin(i / 11 + phase * 2) * 0.4;
}

export interface RoiDailyPoint {
  date: string;
  spend: number;
  pipelineValue: number;
  roi: number;
}

/** ABM ROI Analytics — day-over-day ROI, oldest first. */
export function getRoiTrend(days = 90): RoiDailyPoint[] {
  const out: RoiDailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = days - 1 - i; // 0 → days-1, oldest first
    const spend = Math.round(150 + t * 0.9 + ripple(t) * 35);
    // ROI climbs as the audience warms: 1.6 → ~3.4 with ripples.
    const roi = Math.max(1.1, 1.6 + (t / days) * 1.7 + ripple(t, 1) * 0.25);
    out.push({
      date: isoDaysAgo(i),
      spend,
      pipelineValue: Math.round(spend * roi),
      roi: Math.round(roi * 100) / 100,
    });
  }
  return out;
}

export interface DailyAbmActivity {
  date: string;
  impressions: number;
  clicks: number;
  accountsEngaged: number;
  contactsEngaged: number;
}

/** Daily ABM Activities — oldest first. */
export function getDailyActivity(days = 30): DailyAbmActivity[] {
  const out: DailyAbmActivity[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = days - 1 - i;
    const impressions = Math.round(8200 + t * 55 + ripple(t) * 1400);
    out.push({
      date: isoDaysAgo(i),
      impressions,
      clicks: Math.round(impressions * (0.011 + ripple(t, 2) * 0.002)),
      accountsEngaged: Math.round(34 + t * 0.4 + ripple(t, 1) * 6),
      contactsEngaged: Math.round(61 + t * 0.7 + ripple(t, 3) * 9),
    });
  }
  return out;
}

export interface PdnSpendDay {
  date: string;
  display: number;
  native: number;
  video: number;
  ctv: number;
}

/** Daily PDN Spend — spend by Propensity Display Network channel, oldest first. */
export function getPdnSpend(days = 30): PdnSpendDay[] {
  const out: PdnSpendDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = days - 1 - i;
    out.push({
      date: isoDaysAgo(i),
      display: Math.round(182 + ripple(t) * 28),
      native: Math.round(96 + ripple(t, 1) * 18),
      video: Math.round(64 + ripple(t, 2) * 16),
      ctv: Math.round(38 + ripple(t, 3) * 12),
    });
  }
  return out;
}

export interface WebsiteAnalyticsDay {
  date: string;
  icpVisitors: number;
  totalVisitors: number;
  pageViews: number;
}

/** Website Analytics — ICP visitors captured by the Propensity tracking script. */
export function getWebsiteTrend(days = 30): WebsiteAnalyticsDay[] {
  const out: WebsiteAnalyticsDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = days - 1 - i;
    const total = Math.round(420 + t * 3 + ripple(t) * 60);
    const icp = Math.round(total * (0.24 + t * 0.002 + ripple(t, 1) * 0.02));
    out.push({ date: isoDaysAgo(i), icpVisitors: icp, totalVisitors: total, pageViews: Math.round(total * 2.7) });
  }
  return out;
}

// ── Account Engagement ───────────────────────────────────────────────────────
// Accounts reuse companies from the delivered-leads table so the syndication
// tie-in reads as one dataset.

export type AccountWarmth = 'hot' | 'warm' | 'cool';

export interface AccountEngagement {
  accountId: string;
  name: string;
  industry: string;
  employeeSize: string;
  warmth: AccountWarmth;
  intentScore: number; // 0-100
  adInteractions: number;
  webVisits: number;
  lastActivity: string; // ISO date
  sourcedFromSyndication: boolean;
}

const ACCOUNT_ENGAGEMENT: AccountEngagement[] = [
  { accountId: 'acc_01', name: 'Summit Managed Services', industry: 'Managed IT Services', employeeSize: '200-500', warmth: 'hot', intentScore: 92, adInteractions: 41, webVisits: 28, lastActivity: isoDaysAgo(0), sourcedFromSyndication: true },
  { accountId: 'acc_02', name: 'Northgate IT Partners', industry: 'IT Consulting', employeeSize: '50-200', warmth: 'hot', intentScore: 88, adInteractions: 35, webVisits: 22, lastActivity: isoDaysAgo(1), sourcedFromSyndication: true },
  { accountId: 'acc_03', name: 'ClearPath Solutions Group', industry: 'Systems Integration', employeeSize: '200-500', warmth: 'warm', intentScore: 74, adInteractions: 26, webVisits: 15, lastActivity: isoDaysAgo(1), sourcedFromSyndication: true },
  { accountId: 'acc_04', name: 'Beacon Technology Group', industry: 'Value-Added Reseller', employeeSize: '50-200', warmth: 'warm', intentScore: 71, adInteractions: 22, webVisits: 12, lastActivity: isoDaysAgo(2), sourcedFromSyndication: false },
  { accountId: 'acc_05', name: 'Ironwood Systems Integration', industry: 'Systems Integration', employeeSize: '500-1000', warmth: 'hot', intentScore: 85, adInteractions: 31, webVisits: 19, lastActivity: isoDaysAgo(0), sourcedFromSyndication: true },
  { accountId: 'acc_06', name: 'Cascade Network Solutions', industry: 'Network Services', employeeSize: '50-200', warmth: 'warm', intentScore: 66, adInteractions: 18, webVisits: 9, lastActivity: isoDaysAgo(3), sourcedFromSyndication: false },
  { accountId: 'acc_07', name: 'Silverline Technology Partners', industry: 'IT Consulting', employeeSize: '200-500', warmth: 'warm', intentScore: 63, adInteractions: 15, webVisits: 11, lastActivity: isoDaysAgo(4), sourcedFromSyndication: true },
  { accountId: 'acc_08', name: 'Vantage Point Integrators', industry: 'Systems Integration', employeeSize: '50-200', warmth: 'cool', intentScore: 48, adInteractions: 9, webVisits: 5, lastActivity: isoDaysAgo(6), sourcedFromSyndication: false },
  { accountId: 'acc_09', name: 'Halcyon Cloud Partners', industry: 'Cloud Services', employeeSize: '200-500', warmth: 'warm', intentScore: 69, adInteractions: 21, webVisits: 14, lastActivity: isoDaysAgo(2), sourcedFromSyndication: true },
  { accountId: 'acc_10', name: 'Kestrel Security Resellers', industry: 'Security', employeeSize: '50-200', warmth: 'hot', intentScore: 83, adInteractions: 29, webVisits: 17, lastActivity: isoDaysAgo(1), sourcedFromSyndication: true },
  { accountId: 'acc_11', name: 'Ridgeline Data Centers', industry: 'Data Centers', employeeSize: '500-1000', warmth: 'cool', intentScore: 42, adInteractions: 7, webVisits: 4, lastActivity: isoDaysAgo(8), sourcedFromSyndication: false },
  { accountId: 'acc_12', name: 'Arbor Industrial Systems', industry: 'Industrial Automation', employeeSize: '1000+', warmth: 'warm', intentScore: 64, adInteractions: 16, webVisits: 8, lastActivity: isoDaysAgo(3), sourcedFromSyndication: true },
  { accountId: 'acc_13', name: 'Trailhead Energy Solutions', industry: 'Energy', employeeSize: '500-1000', warmth: 'cool', intentScore: 39, adInteractions: 5, webVisits: 3, lastActivity: isoDaysAgo(9), sourcedFromSyndication: false },
  { accountId: 'acc_14', name: 'Blue Harbor Solution Providers', industry: 'Value-Added Reseller', employeeSize: '200-500', warmth: 'warm', intentScore: 58, adInteractions: 13, webVisits: 7, lastActivity: isoDaysAgo(5), sourcedFromSyndication: true },
];

export function getAccountEngagement(): AccountEngagement[] {
  return ACCOUNT_ENGAGEMENT;
}

// ── Contact Engagement ───────────────────────────────────────────────────────
// Several contacts carry the leadId of the syndication lead they originated
// from — the account/contact join the production crosswalk will make.

export interface ContactEngagement {
  contactId: string;
  leadId: string | null;
  name: string;
  title: string;
  account: string;
  adClicks: number;
  webSessions: number;
  contentDownloads: number;
  engagementScore: number; // 0-100
  lastSeen: string;
}

// Names/titles mirror mockLeads exactly — these are the same people, seen
// through Propensity's engagement lens.
const CONTACT_ENGAGEMENT: ContactEngagement[] = [
  { contactId: 'con_01', leadId: 'L001', name: 'Marcus Whitfield', title: 'IT Director', account: 'Summit Managed Services', adClicks: 12, webSessions: 9, contentDownloads: 4, engagementScore: 94, lastSeen: isoDaysAgo(0) },
  { contactId: 'con_02', leadId: 'L002', name: 'Priya Raghavan', title: 'VP IT', account: 'Northgate IT Partners', adClicks: 9, webSessions: 7, contentDownloads: 3, engagementScore: 88, lastSeen: isoDaysAgo(1) },
  { contactId: 'con_03', leadId: 'L003', name: 'Daniel Okonkwo', title: 'CIO', account: 'ClearPath Solutions Group', adClicks: 7, webSessions: 5, contentDownloads: 2, engagementScore: 79, lastSeen: isoDaysAgo(1) },
  { contactId: 'con_04', leadId: 'L004', name: 'Hannah Lindqvist', title: 'CTO', account: 'Beacon Technology Group', adClicks: 5, webSessions: 4, contentDownloads: 1, engagementScore: 68, lastSeen: isoDaysAgo(2) },
  { contactId: 'con_05', leadId: 'L005', name: 'Reuben Castellanos', title: 'IT Director', account: 'Ironwood Systems Integration', adClicks: 8, webSessions: 6, contentDownloads: 3, engagementScore: 82, lastSeen: isoDaysAgo(0) },
  { contactId: 'con_06', leadId: 'L006', name: 'Alicia Mbeki', title: 'VP IT', account: 'Cascade Network Solutions', adClicks: 4, webSessions: 3, contentDownloads: 1, engagementScore: 61, lastSeen: isoDaysAgo(3) },
  { contactId: 'con_07', leadId: 'L007', name: 'Tobias Renner', title: 'IT Director', account: 'Silverline Technology Partners', adClicks: 3, webSessions: 4, contentDownloads: 1, engagementScore: 57, lastSeen: isoDaysAgo(4) },
  { contactId: 'con_08', leadId: 'L008', name: 'Naomi Fairbanks', title: 'CTO', account: 'Vantage Point Integrators', adClicks: 2, webSessions: 2, contentDownloads: 0, engagementScore: 44, lastSeen: isoDaysAgo(6) },
  { contactId: 'con_09', leadId: 'L011', name: 'Cormac Delaney', title: 'DevOps Manager', account: 'Halcyon Cloud Partners', adClicks: 6, webSessions: 5, contentDownloads: 2, engagementScore: 73, lastSeen: isoDaysAgo(2) },
  { contactId: 'con_10', leadId: 'L015', name: 'Desmond Achterberg', title: 'IT Manager', account: 'Kestrel Security Resellers', adClicks: 7, webSessions: 6, contentDownloads: 2, engagementScore: 80, lastSeen: isoDaysAgo(1) },
  { contactId: 'con_11', leadId: 'L016', name: 'Rosalind Ferraro', title: 'Data Center Manager', account: 'Ridgeline Data Centers', adClicks: 1, webSessions: 1, contentDownloads: 0, engagementScore: 31, lastSeen: isoDaysAgo(8) },
  { contactId: 'con_12', leadId: 'L017', name: 'Anselm Kowalczyk', title: 'VP Operations', account: 'Arbor Industrial Systems', adClicks: 4, webSessions: 3, contentDownloads: 1, engagementScore: 62, lastSeen: isoDaysAgo(3) },
];

export function getContactEngagement(): ContactEngagement[] {
  return CONTACT_ENGAGEMENT;
}

// ── Asset Analytics ──────────────────────────────────────────────────────────

export type AssetType = 'display' | 'native' | 'video';

export interface AssetAnalytics {
  assetId: string;
  name: string;
  type: AssetType;
  abmCampaignId: string;
  impressions: number;
  clicks: number;
  ctrPct: number;
  engagements: number;
}

const ASSET_ANALYTICS: AssetAnalytics[] = [
  { assetId: 'ast_01', name: 'AI Infrastructure Buyer’s Guide — 300x250', type: 'display', abmCampaignId: 'abm_101', impressions: 96400, clicks: 1520, ctrPct: 1.58, engagements: 611 },
  { assetId: 'ast_02', name: 'FIFA AI Story — 15s pre-roll', type: 'video', abmCampaignId: 'abm_101', impressions: 71200, clicks: 1180, ctrPct: 1.66, engagements: 540 },
  { assetId: 'ast_03', name: 'Lenovo + Intel benchmark native card', type: 'native', abmCampaignId: 'abm_101', impressions: 64800, clicks: 940, ctrPct: 1.45, engagements: 402 },
  { assetId: 'ast_04', name: 'CRN2 uptime calculator — 728x90', type: 'display', abmCampaignId: 'abm_102', impressions: 58800, clicks: 620, ctrPct: 1.05, engagements: 268 },
  { assetId: 'ast_05', name: 'Uptime SLA checklist native card', type: 'native', abmCampaignId: 'abm_102', impressions: 49300, clicks: 710, ctrPct: 1.44, engagements: 305 },
  { assetId: 'ast_06', name: 'Eaton industrial ICP — 300x600', type: 'display', abmCampaignId: 'abm_103', impressions: 41600, clicks: 430, ctrPct: 1.03, engagements: 174 },
  { assetId: 'ast_07', name: 'Powering the smart plant — 30s video', type: 'video', abmCampaignId: 'abm_103', impressions: 36500, clicks: 505, ctrPct: 1.38, engagements: 231 },
  { assetId: 'ast_08', name: 'Eaton FY26 line card native', type: 'native', abmCampaignId: 'abm_103', impressions: 28700, clicks: 330, ctrPct: 1.15, engagements: 129 },
];

export function getAssetAnalytics(): AssetAnalytics[] {
  return ASSET_ANALYTICS;
}

// ── Blended spend + syndication influence (crosswalk consumers) ─────────────

export interface BlendedSpendMonth {
  month: string; // 'Jun', 'Jul', …
  pdn: number;
  syndication: number;
  blendedRoi: number;
}

/**
 * PDN media spend vs content-syndication spend, monthly. Syndication spend
 * derives from the three linked TCC campaigns' budgets in mockClients, spread
 * across the campaign months, so the two views can never disagree.
 */
export function getBlendedSpend(): BlendedSpendMonth[] {
  const tcc = allClients.find(c => c.id === 'client_1');
  const linkedIds = new Set(ABM_SYNDICATION_CROSSWALK.map(c => c.syndicationCampaignId));
  const syndicationTotal = (tcc?.campaigns ?? [])
    .filter(c => linkedIds.has(c.id))
    .reduce((sum, c) => sum + (c.budget ?? 0), 0); // 4200 + 960 + 1200 = 6360
  // Live since Jun 1: split the syndication budget across Jun/Jul with the
  // second month heavier (all three campaigns running).
  const syndication = [Math.round(syndicationTotal * 0.42), Math.round(syndicationTotal * 0.58)];
  const pdn = [5150, 8560]; // sums of the daily PDN series by month
  return [
    { month: 'Jun', pdn: pdn[0], syndication: syndication[0], blendedRoi: 2.3 },
    { month: 'Jul', pdn: pdn[1], syndication: syndication[1], blendedRoi: 2.9 },
  ];
}

export interface SyndicationInfluence {
  syndicationLeads: number;
  matchedAccounts: number;
  engagedAccounts: number;
  pipelineValue: number;
  perCampaign: Array<{
    syndicationCampaignId: string;
    syndicationCampaignName: string;
    abmCampaignName: string;
    leads: number;
    engagedAccounts: number;
  }>;
}

/** Leads sourced from syndication → accounts matched in ABM → accounts engaged. */
export function getSyndicationInfluence(): SyndicationInfluence {
  const sourced = ACCOUNT_ENGAGEMENT.filter(a => a.sourcedFromSyndication);
  return {
    syndicationLeads: 220, // TCC leads delivered to date across the 3 campaigns
    matchedAccounts: sourced.length + 4, // matched incl. not-yet-engaged
    engagedAccounts: sourced.length,
    pipelineValue: 46800,
    perCampaign: [
      { syndicationCampaignId: '46888', syndicationCampaignName: 'Lenovo Intel FIFA AI', abmCampaignName: 'Lenovo AI Infrastructure — ABM Air Cover', leads: 112, engagedAccounts: 4 },
      { syndicationCampaignId: '46873', syndicationCampaignName: 'Uptime Solutions CRN2 - Lead Gen', abmCampaignName: 'Uptime Solutions CRN2 — Channel ABM', leads: 64, engagedAccounts: 3 },
      { syndicationCampaignId: '46936', syndicationCampaignName: 'Eaton 2026 Full Year 1_Q3', abmCampaignName: 'Eaton FY2026 — Industrial ICP Display', leads: 44, engagedAccounts: 2 },
    ],
  };
}

/** The freshness line shown on the Programmatic page. */
export const PROPENSITY_SYNC_LABEL = 'Synced Jul 30, 2026 · api.propensity.com';
