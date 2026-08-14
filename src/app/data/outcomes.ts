import type { Campaign } from './mockClients';
import type { DeliveryOverride } from './unionOps';
import { unionClient, UNION_CLIENT_ID } from './unionClient';
import { BILLING_MODULES_IN_SCOPE } from '../config/phase';
import { mockInvoiceRecords } from './mockInvoiceRecords';
import { formatMoney } from '../utils/format';
import { ABM_SYNDICATION_CROSSWALK, getAssetAnalytics } from './propensity';
import { mockLeads } from '../mockData';

// ─── Downstream lead outcomes + delivery forecasting ─────────────────────────
// What happened to the leads after delivery (the client's real ROI question),
// and whether each campaign will hit its contracted volume by end of flight.
// Mock ratios modelled on typical B2B content-syndication downstream rates,
// anchored to the client's live delivery totals so the funnel always agrees
// with the rest of the portal.

export interface LeadOutcomeFunnel {
  delivered: number;
  accepted: number;
  synced: number;
  opportunities: number;
  closedWon: number;
  pipelineValue: number;
  wonValue: number;
}

const AVG_OPP_VALUE = 21500;
const AVG_WON_VALUE = 18800;

export function getLeadOutcomes(deliveredOverride?: number): LeadOutcomeFunnel {
  const delivered = deliveredOverride ?? unionClient.totalLeads;
  const accepted = Math.round(delivered * 0.921);
  const synced = accepted - (delivered >= 300 ? 3 : 1); // real-time CRM sync, minus the batch in flight
  const opportunities = Math.round(delivered * 0.138);
  const closedWon = Math.round(delivered * 0.034);
  return {
    delivered,
    accepted,
    synced,
    opportunities,
    closedWon,
    pipelineValue: opportunities * AVG_OPP_VALUE,
    wonValue: closedWon * AVG_WON_VALUE,
  };
}

export interface CampaignForecast {
  campaign: Campaign;
  target: number;
  delivered: number;
  /** Leads expected by end of flight — scheduled deliveries when the campaign
   *  has a delivery schedule, current-pace extrapolation otherwise. */
  projected: number;
  projectedPct: number;
  atRisk: boolean;
}

export function getCampaignForecasts(overrides: Record<string, DeliveryOverride> = {}): CampaignForecast[] {
  const campaigns = unionClient.campaigns;
  const now = Date.now();

  return campaigns.map(c => {
    const target = c.goalLeads ?? c.target ?? 0;
    // Ops-entered delivery counts win over the feed — acceptance is manual
    // for clients without Convertr, so ops's number is the one we stand behind.
    const delivered = overrides[c.id]?.delivered ?? c.deliveredLeads ?? c.delivered ?? 0;

    let projected = delivered;
    if (c.status === 'active') {
      const upcoming = (c.deliverySchedule ?? []).filter(d => d.status === 'upcoming');
      if (upcoming.length > 0) {
        projected = delivered + upcoming.reduce((s, d) => s + d.leadsDelivered, 0);
      } else if (c.startDate && c.endDate) {
        const start = new Date(c.startDate).getTime();
        const end = new Date(c.endDate).getTime();
        if (end > start) {
          const elapsed = Math.min(Math.max(now - start, 1), end - start);
          projected = Math.min(
            Math.round((delivered / elapsed) * (end - start)),
            Math.round(target * 1.15),
          );
        }
      }
    }

    const projectedPct = target > 0 ? Math.round((projected / target) * 100) : 100;
    return {
      campaign: c,
      target,
      delivered,
      projected,
      projectedPct,
      atRisk: c.status === 'active' && projectedPct < 95,
    };
  });
}

// ─── What's coming up ────────────────────────────────────────────────────────
// The next few dated things in the relationship: scheduled lead deliveries and
// invoice due dates. Answers the client's quiet daily question — is anything
// arriving this week?

export interface UpcomingEvent {
  date: string;
  kind: 'delivery' | 'invoice_due';
  label: string;
  sub: string;
  href: string;
}

export function getUpcomingEvents(): UpcomingEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  const deliveries: UpcomingEvent[] = unionClient.campaigns.flatMap(c =>
    (c.deliverySchedule ?? [])
      .filter(d => d.status === 'upcoming' && d.date.slice(0, 10) >= today)
      .map(d => ({
        date: d.date.slice(0, 10),
        kind: 'delivery' as const,
        label: `${d.leadsDelivered} leads`,
        sub: c.name,
        href: `/campaigns/${c.id}`,
      })),
  );
  // Invoicing is deferred, so nothing due ever reaches the upcoming list. The
  // derivation stays so it comes back with the module rather than being rewritten.
  const dues: UpcomingEvent[] = !BILLING_MODULES_IN_SCOPE ? [] : mockInvoiceRecords
    .filter(i => i.clientId === UNION_CLIENT_ID && i.stage === 'sent' && (i.dueDate ?? '') >= today)
    .map(i => ({
      date: i.dueDate!,
      kind: 'invoice_due' as const,
      label: `${i.invoiceNumber} due`,
      sub: formatMoney(i.total),
      href: '/invoices',
    }));
  return [...deliveries, ...dues].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
}

// ─── Acceptance-rate trend ───────────────────────────────────────────────────
// Six months of QA acceptance, ending at the current rate the QA strip shows.

export interface TrendPoint { label: string; value: number }

export function getAcceptanceTrend(): TrendPoint[] {
  return [
    { label: 'Mar', value: 94.8 },
    { label: 'Apr', value: 95.6 },
    { label: 'May', value: 96.2 },
    { label: 'Jun', value: 96.4 },
    { label: 'Jul', value: 96.9 },
    { label: 'Aug', value: 97.1 },
  ];
}

// ─── Billing position ────────────────────────────────────────────────────────
// The commercial standing at a glance: annual commitment, billed to date, and
// remaining runway. Billed is the sum of the client's issued invoices so it
// always agrees with the Invoices page.

export interface BillingPosition {
  contracted: number;
  billed: number;
  remaining: number;
  pct: number;
}

const FY26_COMMITMENT = 148_000;

export function getBillingPosition(): BillingPosition {
  const billed = mockInvoiceRecords
    .filter(i => i.clientId === UNION_CLIENT_ID)
    .reduce((sum, i) => sum + i.total, 0);
  const remaining = Math.max(0, FY26_COMMITMENT - billed);
  return {
    contracted: FY26_COMMITMENT,
    billed,
    remaining,
    pct: Math.min(100, Math.round((billed / FY26_COMMITMENT) * 100)),
  };
}

// ─── Linked period stats (Month / Quarter / Year) ────────────────────────────
// The dashboard's top boxes share one period toggle (Ben: default month, no
// weekly). Billing is real (summed from invoice issue dates); lead volumes
// use the client's live month/lifetime totals with a deterministic quarter
// interpolation. Remaining is always against the annual commitment — per Ben,
// fall back to the year when a per-period figure doesn't exist.

export type StatPeriod = 'month' | 'quarter' | 'year';

export interface PeriodStats {
  activeCampaigns: number;
  leads: number;
  billed: number;
  contracted: number;
  remainingYear: number;
}

/** Start/end of the period the toggle is showing, in the current year. */
function periodWindow(period: StatPeriod): { from: Date; to: Date } {
  const now = new Date();
  const y = now.getFullYear();
  if (period === 'month') return { from: new Date(y, now.getMonth(), 1), to: new Date(y, now.getMonth() + 1, 0) };
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    return { from: new Date(y, q * 3, 1), to: new Date(y, q * 3 + 3, 0) };
  }
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) };
}

export function getPeriodStats(period: StatPeriod, overrides: Record<string, DeliveryOverride> = {}): PeriodStats {
  const campaigns = unionClient.campaigns;
  // Ops-entered delivered counts shift the totals by their delta from the
  // baseline, so the hero number, the funnel and the per-campaign bars agree.
  const overrideDelta = campaigns.reduce((s, c) => {
    const ov = overrides[c.id]?.delivered;
    return ov == null ? s : s + (ov - (c.deliveredLeads ?? c.delivered ?? 0));
  }, 0);
  // Campaigns whose flight overlaps the selected period, not just the ones
  // active right now — an active-status count is the same number under every
  // period, which made the Month/Quarter/Year toggle look broken on this box.
  const { from, to } = periodWindow(period);
  const activeCampaigns = campaigns.filter(c => {
    const start = c.startDate ? new Date(c.startDate) : null;
    const end = c.endDate ? new Date(c.endDate) : null;
    if (!start && !end) return false;
    return (start ?? from) <= to && (end ?? to) >= from;
  }).length;

  const monthLeads = campaigns.reduce((s, c) => s + (c.leadsThisMonth ?? 0), 0) + overrideDelta;
  const yearLeads = unionClient.totalLeads + overrideDelta;
  const quarterLeads = Math.min(yearLeads, monthLeads + Math.round((yearLeads - monthLeads) * 0.72));
  const leads = period === 'month' ? monthLeads : period === 'quarter' ? quarterLeads : yearLeads;

  const invoices = mockInvoiceRecords.filter(i => i.clientId === UNION_CLIENT_ID);
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  const quarter = Math.floor(now.getMonth() / 3);
  const inQuarter = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === quarter;
  };
  const sum = (list: typeof invoices) => list.reduce((s, i) => s + i.total, 0);
  const billedYear = sum(invoices);
  const billed = period === 'month'
    ? sum(invoices.filter(i => (i.issueDate ?? '').startsWith(ym)))
    : period === 'quarter'
      ? sum(invoices.filter(i => inQuarter(i.issueDate)))
      : billedYear;

  return {
    activeCampaigns,
    leads,
    billed,
    contracted: FY26_COMMITMENT,
    remainingYear: Math.max(0, FY26_COMMITMENT - billedYear),
  };
}

// ─── Campaign typing + per-campaign nugget ───────────────────────────────────
// Campaigns are sold bundled: the crosswalk marks which syndication programs
// carry programmatic air cover, so the list can chip each campaign's type.

const PAIRED_IDS = new Set(ABM_SYNDICATION_CROSSWALK.map(c => c.syndicationCampaignId));

export function campaignTypeFor(campaignId: string): string {
  return PAIRED_IDS.has(campaignId) ? 'Syndication + Programmatic' : 'Content Syndication';
}

/** The strongest lead on a campaign — the one-line "nugget" per campaign row. */
export function hottestLeadFor(campaignId: string): { name: string; company: string; score: number } | null {
  const best = mockLeads
    .filter(l => l.campaignId === campaignId)
    .sort((a, b) => b.leadScore - a.leadScore)[0];
  return best ? { name: `${best.firstName} ${best.lastName}`, company: best.company, score: best.leadScore } : null;
}

/** Total ad delivery across creatives — impressions + clicks for the outcomes card. */
export function getAdDelivery(): { impressions: number; clicks: number } {
  const assets = getAssetAnalytics();
  return {
    impressions: assets.reduce((s, a) => s + a.impressions, 0),
    clicks: assets.reduce((s, a) => s + a.clicks, 0),
  };
}

/** Average times one person sees an ad — turns impressions into humans reached. */
const AVG_AD_FREQUENCY = 3.2;

/** People reached — Ben's replacement for blended ROI on the client render. */
export function getPeopleReached(): number {
  return Math.round(getAdDelivery().impressions / AVG_AD_FREQUENCY);
}
