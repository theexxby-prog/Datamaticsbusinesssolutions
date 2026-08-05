import type { Campaign } from './mockClients';
import { unionClient, UNION_CLIENT_ID } from './unionClient';
import { mockInvoiceRecords } from './mockInvoiceRecords';
import { formatMoney } from '../utils/format';

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

export function getLeadOutcomes(): LeadOutcomeFunnel {
  const delivered = unionClient.totalLeads;
  const accepted = Math.round(delivered * 0.921);
  const synced = accepted - 3; // real-time CRM sync, minus the batch in flight
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

export function getCampaignForecasts(): CampaignForecast[] {
  const campaigns = unionClient.campaigns;
  const now = Date.now();

  return campaigns.map(c => {
    const target = c.goalLeads ?? c.target ?? 0;
    const delivered = c.deliveredLeads ?? c.delivered ?? 0;

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
  const dues: UpcomingEvent[] = mockInvoiceRecords
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
