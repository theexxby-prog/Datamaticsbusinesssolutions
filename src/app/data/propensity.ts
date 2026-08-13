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
  { abmCampaignId: 'abm_101', syndicationCampaignId: '46888', syndicationCampaignName: 'Atlas AI Infrastructure — Q3' },
  { abmCampaignId: 'abm_102', syndicationCampaignId: '46873', syndicationCampaignName: 'Resilience Suite Lead Gen' },
  { abmCampaignId: 'abm_103', syndicationCampaignId: '46936', syndicationCampaignName: 'GridWorks FY2026 — Q3' },
];

const ABM_CAMPAIGNS: AbmCampaign[] = [
  {
    id: 'abm_101',
    name: 'Atlas AI Infrastructure — ABM Air Cover',
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
    name: 'Resilience Suite — Channel ABM',
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
    name: 'GridWorks FY2026 — Industrial ICP Display',
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

// Real media channels, per Ben: the buy runs across social and video networks
// with PDN as a small always-on slice. NOTE: these are *channels* — distinct
// from AssetType below, which is the creative format (display/native/video).
export interface PdnSpendDay {
  date: string;
  linkedin: number;
  meta: number;
  reddit: number;
  youtube: number;
  pdn: number;
}

/** Daily media spend by channel, oldest first. Totals are unchanged from the
 *  previous format-based split so getBlendedSpend's monthly sums still hold. */
export function getPdnSpend(days = 30): PdnSpendDay[] {
  const out: PdnSpendDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = days - 1 - i;
    out.push({
      date: isoDaysAgo(i),
      linkedin: Math.round(148 + ripple(t) * 22),
      meta: Math.round(94 + ripple(t, 1) * 18),
      reddit: Math.round(62 + ripple(t, 2) * 14),
      youtube: Math.round(48 + ripple(t, 3) * 12),
      pdn: Math.round(28 + ripple(t, 4) * 8),
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
  { assetId: 'ast_03', name: 'Atlas AI benchmark native card', type: 'native', abmCampaignId: 'abm_101', impressions: 64800, clicks: 940, ctrPct: 1.45, engagements: 402 },
  { assetId: 'ast_04', name: 'Resilience uptime calculator — 728x90', type: 'display', abmCampaignId: 'abm_102', impressions: 58800, clicks: 620, ctrPct: 1.05, engagements: 268 },
  { assetId: 'ast_05', name: 'Resilience SLA checklist native card', type: 'native', abmCampaignId: 'abm_102', impressions: 49300, clicks: 710, ctrPct: 1.44, engagements: 305 },
  { assetId: 'ast_06', name: 'GridWorks industrial ICP — 300x600', type: 'display', abmCampaignId: 'abm_103', impressions: 41600, clicks: 430, ctrPct: 1.03, engagements: 174 },
  { assetId: 'ast_07', name: 'Powering the smart plant — 30s video', type: 'video', abmCampaignId: 'abm_103', impressions: 36500, clicks: 505, ctrPct: 1.38, engagements: 231 },
  { assetId: 'ast_08', name: 'GridWorks FY26 line card native', type: 'native', abmCampaignId: 'abm_103', impressions: 28700, clicks: 330, ctrPct: 1.15, engagements: 129 },
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
      { syndicationCampaignId: '46888', syndicationCampaignName: 'Atlas AI Infrastructure — Q3', abmCampaignName: 'Atlas AI Infrastructure — ABM Air Cover', leads: 112, engagedAccounts: 4 },
      { syndicationCampaignId: '46873', syndicationCampaignName: 'Resilience Suite Lead Gen', abmCampaignName: 'Resilience Suite — Channel ABM', leads: 64, engagedAccounts: 3 },
      { syndicationCampaignId: '46936', syndicationCampaignName: 'GridWorks FY2026 — Q3', abmCampaignName: 'GridWorks FY2026 — Industrial ICP Display', leads: 44, engagedAccounts: 2 },
    ],
  };
}

/** The freshness line shown on the Programmatic page. */
export const PROPENSITY_SYNC_LABEL = 'Synced Jul 30, 2026 · api.propensity.com';

// ── Cohort breakdown ────────────────────────────────────────────────────────
// Propensity reports per cohort — waves inside one campaign, keyed by name
// strings like "…-Cohort 2" — and the campaign total is ours to add up. The
// rule the ops screen exists to teach: one campaign, cohorts roll up; the
// client only ever sees the sum. Splits are deterministic and sum exactly to
// the AbmCampaign totals, so the cohort table and the summary tiles above it
// can never disagree.

export interface AbmCohort {
  cohort: number;
  startDate: string; // ISO
  impressions: number;
  clicks: number;
  spend: number;
}

export function getCohortBreakdown(abmCampaignId: string): AbmCohort[] {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm) return [];
  // Wave 2 carries 42% of delivery; remainders land on wave 1 so sums are exact.
  const imp2 = Math.round(abm.impressions * 0.42);
  const clk2 = Math.round(abm.clicks * 0.42);
  const spend2 = Math.round(abm.spendToDate * 0.42);
  const start2 = `${abm.startDate.slice(0, 7)}-28`;
  return [
    { cohort: 1, startDate: abm.startDate, impressions: abm.impressions - imp2, clicks: abm.clicks - clk2, spend: abm.spendToDate - spend2 },
    { cohort: 2, startDate: start2, impressions: imp2, clicks: clk2, spend: spend2 },
  ];
}

// ── Engaged colleagues (account-level, not leads) ───────────────────────────
// The contact-matching rule made visible: only an exact work-email match
// attaches ad engagement to an individual lead. People the ad campaign
// reached whose email matches no lead are held at the ACCOUNT level — kept,
// shown, never merged onto a person and never counted as leads.

export interface EngagedColleague {
  name: string;
  title: string;
  warmth: 'hot' | 'warm';
  activity: string;
}

const COLLEAGUE_POOL: EngagedColleague[] = [
  { name: 'Priya Raman', title: 'Director, IT Procurement', warmth: 'warm', activity: '3 site visits · 14 ad impressions in 90 days' },
  { name: 'Tom Okafor', title: 'Security Architect', warmth: 'hot', activity: '2 ad clicks · visited the pricing page twice' },
  { name: 'Elena Vasquez', title: 'VP Infrastructure', warmth: 'warm', activity: '9 ad impressions · followed on LinkedIn' },
  { name: 'Mark Delaney', title: 'Head of Platform Engineering', warmth: 'warm', activity: '6 ad impressions · 1 site visit' },
  { name: 'Sofia Lindqvist', title: 'Procurement Analyst', warmth: 'hot', activity: '4 site visits · downloaded a spec sheet' },
];

/** 2–3 engaged non-lead colleagues for an account, stable per slug. */
export function getEngagedColleagues(accountSlug: string): EngagedColleague[] {
  let h = 0;
  for (let i = 0; i < accountSlug.length; i++) h = (h * 31 + accountSlug.charCodeAt(i)) >>> 0;
  const count = 2 + (h % 2);
  const start = h % COLLEAGUE_POOL.length;
  return Array.from({ length: count }, (_, i) => COLLEAGUE_POOL[(start + i) % COLLEAGUE_POOL.length]);
}

// ── Account-level analytics ─────────────────────────────────────────────────
// The ABM question a lead count can't answer: of the named accounts we set out
// to reach, how many did we actually touch, engage, reach more than once, and
// turn sales-ready? Every figure below derives from the AbmCampaign record, so
// the funnel, the tiles above it and the account table can never disagree —
// same discipline as getCohortBreakdown. Rounding remainders land on the
// largest bucket so the parts always sum to the whole.

/** Stable per-campaign variation without Math.random (which would re-roll on every render). */
function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Split a total across weights, giving the rounding remainder to the biggest share. */
function splitTotal(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  const parts = weights.map(w => Math.round((total * w) / sum));
  const drift = total - parts.reduce((s, p) => s + p, 0);
  if (drift !== 0) {
    const biggest = parts.indexOf(Math.max(...parts));
    parts[biggest] += drift;
  }
  return parts;
}

export interface AccountFunnelStage {
  key: 'targeted' | 'reached' | 'engaged' | 'multiTouch' | 'salesReady';
  label: string;
  hint: string;
  accounts: number;
  /** Share of the targeted list, for the bar width. */
  pctOfTargeted: number;
}

export function getAccountFunnel(abmCampaignId: string): AccountFunnelStage[] {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm) return [];
  const targeted = abm.goalAccounts;
  const engaged = abm.engagedAccounts;
  // Reached derives from engaged rather than from targeted, so it can never
  // fall below the engaged count no matter how the campaign totals move.
  const reached = Math.min(targeted, Math.round(engaged / 0.83));
  const multiTouch = Math.round(engaged * 0.55);
  const salesReady = Math.round(engaged * 0.22);

  const stages: Array<Omit<AccountFunnelStage, 'pctOfTargeted'>> = [
    { key: 'targeted', label: 'Targeted', hint: 'Named accounts in the audience', accounts: targeted },
    { key: 'reached', label: 'Reached', hint: 'Served at least one impression', accounts: reached },
    { key: 'engaged', label: 'Engaged', hint: 'Clicked or visited the site', accounts: engaged },
    { key: 'multiTouch', label: 'Multi-touch', hint: 'Engaged on more than one channel', accounts: multiTouch },
    { key: 'salesReady', label: 'Sales-ready', hint: 'Hot warmth — worth a call now', accounts: salesReady },
  ];
  return stages.map(s => ({ ...s, pctOfTargeted: Math.round((s.accounts / targeted) * 100) }));
}

export interface UnreachedAccount {
  name: string;
  industry: string;
  employees: string;
}

const UNREACHED_POOL: UnreachedAccount[] = [
  { name: 'Kestrel Manufacturing Group', industry: 'Manufacturing', employees: '1,000-4,999' },
  { name: 'Pinnacle Freight Systems', industry: 'Logistics', employees: '500-999' },
  { name: 'Copperline Energy', industry: 'Energy & utilities', employees: '5,000+' },
  { name: 'Marlowe Financial Partners', industry: 'Financial services', employees: '1,000-4,999' },
  { name: 'Ashford Health Network', industry: 'Healthcare', employees: '5,000+' },
  { name: 'Verity Payments', industry: 'Financial services', employees: '500-999' },
  { name: 'Stonebridge Industrial', industry: 'Manufacturing', employees: '1,000-4,999' },
  { name: 'Harrowgate Retail Group', industry: 'Retail & ecommerce', employees: '5,000+' },
  { name: 'Lyndon Aerospace', industry: 'Manufacturing', employees: '1,000-4,999' },
  { name: 'Cobalt Telecom', industry: 'Telecom & media', employees: '5,000+' },
  { name: 'Ravensworth Insurance', industry: 'Insurance', employees: '1,000-4,999' },
  { name: 'Dunmore Chemicals', industry: 'Manufacturing', employees: '500-999' },
];

/**
 * The accounts still to be reached — the gap between targeted and reached, and
 * the most actionable list on the page: these are the ones to redirect spend at.
 *
 * `total` is always the true gap; `named` is the sample we can put names to.
 * Keeping them separate matters because the headline count must reconcile with
 * the funnel (targeted − reached) even when the sample is shorter.
 */
export function getUnreachedAccounts(abmCampaignId: string): { total: number; named: UnreachedAccount[] } {
  const funnel = getAccountFunnel(abmCampaignId);
  if (funnel.length === 0) return { total: 0, named: [] };
  const total = funnel[0].accounts - funnel[1].accounts;
  const start = seedOf(abmCampaignId) % UNREACHED_POOL.length;
  const named = Array.from({ length: Math.min(total, UNREACHED_POOL.length) }, (_, i) =>
    UNREACHED_POOL[(start + i) % UNREACHED_POOL.length]);
  return { total, named };
}

export interface WeeklyReachPoint {
  week: string;
  reached: number;
  engaged: number;
}

/** Cumulative build-up, easing out and landing exactly on the current totals. */
export function getWeeklyReach(abmCampaignId: string): WeeklyReachPoint[] {
  const funnel = getAccountFunnel(abmCampaignId);
  if (funnel.length === 0) return [];
  const reached = funnel[1].accounts;
  const engaged = funnel[2].accounts;
  const weeks = 8;
  return Array.from({ length: weeks }, (_, i) => {
    const t = (i + 1) / weeks;
    const ease = 1 - Math.pow(1 - t, 2); // fast early, flattening as the audience saturates
    return {
      week: `W${i + 1}`,
      reached: Math.round(reached * ease),
      engaged: Math.round(engaged * ease * (0.82 + 0.18 * t)),
    };
  });
}

export interface BuyingCentre {
  /** People reached inside engaged accounts. */
  stakeholders: number;
  avgPerAccount: number;
  seniority: Array<{ name: string; percentage: number }>;
  functions: Array<{ name: string; percentage: number }>;
  /** Share sitting at Director level or above. */
  directorPlusPct: number;
}

export function getBuyingCentre(abmCampaignId: string): BuyingCentre | null {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm) return null;
  const seed = seedOf(abmCampaignId);
  const engaged = abm.engagedAccounts;
  const avgPerAccount = Math.round((4.4 + (seed % 18) / 10) * 10) / 10;
  const stakeholders = Math.round(engaged * avgPerAccount);

  // Seniority weights drift slightly per campaign, then normalise to 100.
  const senWeights = [9 + (seed % 4), 18 + (seed % 5), 31, 27, 15];
  const senValues = splitTotal(100, senWeights);
  const seniority = ['C-suite', 'VP / SVP', 'Director', 'Manager', 'Practitioner']
    .map((name, i) => ({ name, percentage: senValues[i] }));

  const fnWeights = [34, 26 + (seed % 6), 18, 12, 10];
  const fnValues = splitTotal(100, fnWeights);
  const functions = ['IT & infrastructure', 'Security', 'Operations', 'Finance', 'Other']
    .map((name, i) => ({ name, percentage: fnValues[i] }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    stakeholders,
    avgPerAccount,
    seniority,
    functions,
    directorPlusPct: seniority[0].percentage + seniority[1].percentage + seniority[2].percentage,
  };
}

/** Engaged accounts by vertical. Counts sum to the engaged total. */
export function getIndustryMix(abmCampaignId: string): Array<{ name: string; accounts: number; percentage: number }> {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm) return [];
  const seed = seedOf(abmCampaignId);
  const names = ['Financial services', 'Manufacturing', 'Healthcare', 'Technology', 'Energy & utilities', 'Other'];
  const counts = splitTotal(abm.engagedAccounts, [30 + (seed % 8), 24, 16, 13, 9, 8]);
  return names
    .map((name, i) => ({
      name,
      accounts: counts[i],
      percentage: Math.round((counts[i] / abm.engagedAccounts) * 100),
    }))
    .sort((a, b) => b.accounts - a.accounts);
}

export interface FrequencyBand {
  band: string;
  accounts: number;
  /** 7-12 impressions per account is where engagement peaks without fatigue. */
  inSweetSpot: boolean;
}

export function getFrequencyDistribution(abmCampaignId: string): FrequencyBand[] {
  const funnel = getAccountFunnel(abmCampaignId);
  if (funnel.length === 0) return [];
  const reached = funnel[1].accounts;
  const seed = seedOf(abmCampaignId);
  const bands = ['1-3', '4-6', '7-12', '13-18', '19+'];
  const counts = splitTotal(reached, [14, 22, 34 + (seed % 6), 19, 11]);
  return bands.map((band, i) => ({ band, accounts: counts[i], inSweetSpot: band === '7-12' }));
}

export interface ChannelPerformance {
  channel: string;
  impressions: number;
  clicks: number;
  ctr: number;
  /** Ops only — omitted entirely from client responses. */
  cost?: number;
}

export function getChannelPerformance(abmCampaignId: string, opsView = false): ChannelPerformance[] {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm) return [];
  const channels = ['Programmatic display', 'LinkedIn', 'Meta', 'Email'];
  const impWeights = [58, 24, 12, 6];
  const clickWeights = [42, 33, 15, 10]; // social clicks harder, but at lower volume
  const imps = splitTotal(abm.impressions, impWeights);
  const clicks = splitTotal(abm.clicks, clickWeights);
  const costs = splitTotal(abm.spendToDate, impWeights);
  return channels.map((channel, i) => ({
    channel,
    impressions: imps[i],
    clicks: clicks[i],
    ctr: Math.round((clicks[i] / imps[i]) * 10000) / 100,
    ...(opsView ? { cost: costs[i] } : {}),
  }));
}

// ── Awareness heatmap ────────────────────────────────────────────────────────
// The single most useful visual on the consultant's dashboard: accounts down
// the side, channels across the top, colour = how hard each account has been
// hit on each channel. It shows coverage AND concentration in one glance —
// a row that's dark in one column and empty everywhere else is an account
// being reached by exactly one channel, which is a different problem from an
// account not being reached at all.
//
// Cells are real impression counts, split from the campaign total the same way
// getChannelPerformance splits it, then distributed across accounts by intent.
// So the grid sums back to the channel totals rather than being decorative.

export const HEATMAP_CHANNELS = [
  'Display',
  'LinkedIn',
  'Meta',
  'Email',
  'Syndication',
] as const;

export interface HeatmapRow {
  account: string;
  industry: string;
  /** One impression count per HEATMAP_CHANNELS entry. */
  cells: number[];
  total: number;
  /** Channels this account has been touched on at all. */
  channelsTouched: number;
}

export interface AwarenessHeatmap {
  rows: HeatmapRow[];
  /** Largest single cell, so the UI can scale intensity without re-scanning. */
  peak: number;
}

export function getAwarenessHeatmap(abmCampaignId: string): AwarenessHeatmap {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm) return { rows: [], peak: 0 };
  const seed = seedOf(abmCampaignId);

  // Top 8 by intent — the accounts a reader would actually scan for.
  const accounts = [...ACCOUNT_ENGAGEMENT]
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, 8);

  // Same channel weights as getChannelPerformance, plus syndication.
  const channelWeights = [58, 24, 12, 6, 14];
  const perChannel = splitTotal(Math.round(abm.impressions * 0.42), channelWeights);

  const rows = accounts.map((acct, ai) => {
    const cells = perChannel.map((channelTotal, ci) => {
      // Every account is weighted by intent, then a stable per-cell modifier
      // creates the gaps that make the grid worth looking at: some accounts
      // genuinely aren't on LinkedIn, and a uniform grid would hide that.
      const gap = (seed + ai * 7 + ci * 13) % 11;
      if (gap < 2 && ci > 0) return 0;
      const share = acct.intentScore / accounts.reduce((s, a) => s + a.intentScore, 0);
      const skew = 0.7 + ((seed + ai * 3 + ci * 5) % 7) / 10;
      return Math.round(channelTotal * share * skew);
    });
    const total = cells.reduce((s, c) => s + c, 0);
    return {
      account: acct.name,
      industry: acct.industry,
      cells,
      total,
      channelsTouched: cells.filter(c => c > 0).length,
    };
  });

  const peak = Math.max(1, ...rows.flatMap(r => r.cells));
  return { rows, peak };
}

// ── Week-on-week movement ────────────────────────────────────────────────────
// His KPI tiles all carry a delta pill. Deriving them from getWeeklyReach
// rather than inventing them means the pill and the chart tell the same story:
// the last two points of the series ARE the delta.

export interface ReachDelta {
  /** Absolute change over the last week. */
  change: number;
  /** Percent change, rounded. Zero when the prior week was zero. */
  pct: number;
}

function deltaBetween(prev: number, current: number): ReachDelta {
  const change = current - prev;
  return { change, pct: prev === 0 ? 0 : Math.round((change / prev) * 100) };
}

export function getReachDeltas(abmCampaignId: string): {
  reached: ReachDelta; engaged: ReachDelta; salesReady: ReachDelta;
} | null {
  const weekly = getWeeklyReach(abmCampaignId);
  const funnel = getAccountFunnel(abmCampaignId);
  if (weekly.length < 2 || funnel.length === 0) return null;
  const last = weekly[weekly.length - 1];
  const prev = weekly[weekly.length - 2];
  const salesReadyNow = funnel[4].accounts;
  // Sales-ready tracks engaged at a fixed ratio, so its prior week comes from
  // the prior week's engaged count rather than a second invented series.
  const salesReadyPrev = Math.round(prev.engaged * 0.22);
  return {
    reached: deltaBetween(prev.reached, last.reached),
    engaged: deltaBetween(prev.engaged, last.engaged),
    salesReady: deltaBetween(salesReadyPrev, salesReadyNow),
  };
}

// ── Flight status ────────────────────────────────────────────────────────────
// "Day 36 of 85, on pace" — client-safe. His version pairs this with budget
// deployed, which stays ops-only for us.
//
// The dates come from the CAMPAIGN, not the paired ABM record, and the clock is
// the real one. Both of those are deliberate: this chip renders inches away
// from the campaign's own date range and from the Pace tile, and those are
// computed by campaignHealth from campaign.startDate/endDate against
// `new Date()`. Using the ABM record's dates and the demo's frozen date made it
// read "Day 59 of 152" beside "Jun 7 – Oct 31" and "46% of time" — three
// figures on one line that couldn't all be right. Reach still comes from the
// ABM funnel; only the calendar is shared.

export interface FlightStatus {
  dayOfFlight: number;
  totalDays: number;
  elapsedPct: number;
  /** Reach progress vs time elapsed. 'ahead' | 'on pace' | 'behind'. */
  pace: 'ahead' | 'on pace' | 'behind';
  reachPct: number;
}

export function getFlightStatus(
  abmCampaignId: string,
  dates: { startDate?: string; endDate?: string },
  today = new Date(),
): FlightStatus | null {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  if (!abm || !dates.startDate || !dates.endDate) return null;
  const start = new Date(dates.startDate).getTime();
  const end = new Date(dates.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const totalDays = Math.max(1, Math.round((end - start) / 86400000));
  const dayOfFlight = Math.min(totalDays, Math.max(1, Math.round((today.getTime() - start) / 86400000)));
  // Ratio of the raw timestamps, not of the rounded day counts — that is what
  // campaignHealth does for the Pace tile, and rounding first put the two a
  // point apart on the same line.
  const elapsedPct = Math.min(100, Math.round(((today.getTime() - start) / (end - start)) * 100));

  const funnel = getAccountFunnel(abmCampaignId);
  const reachPct = funnel.length > 0 ? funnel[1].pctOfTargeted : 0;
  // Ten points of slack either way before we call a campaign off-pace; reach
  // naturally runs ahead of time early in a flight and flattens later.
  const gap = reachPct - elapsedPct;
  const pace: FlightStatus['pace'] = gap > 10 ? 'ahead' : gap < -10 ? 'behind' : 'on pace';
  return { dayOfFlight, totalDays, elapsedPct, pace, reachPct };
}

// ── Companies reached ────────────────────────────────────────────────────────
// The chip grid from his Audience panel. Named accounts with their intent
// score, so a reader can see who is in the audience without opening a table.

export interface ReachedCompany {
  name: string;
  industry: string;
  intentScore: number;
  warmth: AccountWarmth;
}

export function getReachedCompanies(abmCampaignId: string, limit = 12): ReachedCompany[] {
  const seed = seedOf(abmCampaignId);
  return [...ACCOUNT_ENGAGEMENT]
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, limit)
    .map(a => ({
      name: a.name,
      industry: a.industry,
      // Small per-campaign drift so the same account doesn't read identically
      // on every campaign, clamped so it stays a plausible score.
      intentScore: Math.min(99, Math.max(20, a.intentScore + ((seed % 9) - 4))),
      warmth: a.warmth,
    }));
}

// ── Average touches per account ──────────────────────────────────────────────

export function getTouchesPerAccount(abmCampaignId: string): number {
  const abm = ABM_CAMPAIGNS.find(c => c.id === abmCampaignId);
  const funnel = getAccountFunnel(abmCampaignId);
  if (!abm || funnel.length === 0 || funnel[1].accounts === 0) return 0;
  return Math.round((abm.impressions / funnel[1].accounts) / 10) / 10;
}

// ── Creative performance ─────────────────────────────────────────────────────
// His "top performing creative" cards, one per channel. CTR is the client-safe
// measure; cost per click is ops-only and omitted from the response entirely
// rather than hidden in the UI.

export interface CreativePerformance {
  channel: string;
  name: string;
  format: string;
  impressions: number;
  clicks: number;
  ctr: number;
  /** Ops only. */
  costPerClick?: number;
}

const CREATIVE_NAMES: Record<string, { name: string; format: string }> = {
  'Programmatic display': { name: 'Zero-trust checklist', format: '300x250 / 728x90' },
  LinkedIn: { name: 'Buyer guide document ad', format: 'Document ad' },
  Meta: { name: 'Migration story carousel', format: 'Carousel' },
  Email: { name: 'Analyst brief invitation', format: 'HTML email' },
};

export function getCreativePerformance(abmCampaignId: string, opsView = false): CreativePerformance[] {
  return getChannelPerformance(abmCampaignId, opsView).map(ch => {
    const creative = CREATIVE_NAMES[ch.channel] ?? { name: 'Primary creative', format: 'Mixed' };
    // The top creative carries roughly a third of its channel's volume at a
    // better CTR than the channel average — that's what makes it the top one.
    const impressions = Math.round(ch.impressions * 0.34);
    const clicks = Math.round(ch.clicks * 0.46);
    return {
      channel: ch.channel,
      name: creative.name,
      format: creative.format,
      impressions,
      clicks,
      ctr: impressions === 0 ? 0 : Math.round((clicks / impressions) * 10000) / 100,
      ...(opsView && ch.cost !== undefined && clicks > 0
        ? { costPerClick: Math.round((ch.cost * 0.34 / clicks) * 100) / 100 }
        : {}),
    };
  }).sort((a, b) => b.ctr - a.ctr);
}

// ── Cross-channel overlap ────────────────────────────────────────────────────
// How many reached accounts saw one channel, two, or three-plus. The
// three-plus group is the one that converts; the single-channel group is the
// one to widen. Sums to the reached total.

export interface OverlapBand {
  label: string;
  accounts: number;
  percentage: number;
}

export function getAudienceOverlap(abmCampaignId: string): OverlapBand[] {
  const funnel = getAccountFunnel(abmCampaignId);
  if (funnel.length === 0) return [];
  const reached = funnel[1].accounts;
  const seed = seedOf(abmCampaignId);
  const counts = splitTotal(reached, [44 + (seed % 7), 33, 23]);
  return ['One channel only', 'Two channels', 'Three or more'].map((label, i) => ({
    label,
    accounts: counts[i],
    percentage: reached === 0 ? 0 : Math.round((counts[i] / reached) * 100),
  }));
}
