import type { Campaign } from './mockClients';
import { unionClient } from './unionClient';

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
