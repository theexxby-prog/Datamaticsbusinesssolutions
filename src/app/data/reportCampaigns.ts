import type { Campaign } from './mockClients';
import {
  GEO_REGIONS, INDUSTRIES, COMPANY_SIZES, TITLES,
  getEntry, type Counts, type DemographicEntry, type Pacing, type CampaignStatus,
} from './demographics';

// ─── Reports drill-down, keyed to the client's real campaigns ────────────────
// The Reports page used to drive its campaign selector from REPORT_CAMPAIGNS —
// four hardcoded keys ('IT Security', 'Healthcare Synd.', …) that predate the
// per-client campaign lists. Every client saw those four names in their own
// drill-down, including UNION, whose twelve campaigns share none of them. So
// the "per campaign" view showed another client's campaigns, and the aggregate
// summed a set the client did not own.
//
// This module resolves the selector from the logged-in client's actual
// campaigns and produces a demographic entry for each one. Precedence is
// deliberate:
//
//   1. Anything ops has entered through the Demographics module (getEntry)
//   2. Otherwise a derivation from the campaign's own delivered-lead count
//
// So real data always wins and the screen self-heals as entries are made,
// while the demo still shows a plausible, campaign-specific breakdown today.

export interface ReportCampaign {
  /** Display name — also the demographics store key, so ops entry lines up. */
  key: string;
  id: string;
  status: CampaignStatus;
  delivered: number;
  deliveredThisMonth: number;
  target: number;
  acceptanceRate: number;
}

/** FNV-1a. Stable across reloads, so a campaign's mix never shuffles. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 0–1 sequence seeded by the campaign, not Math.random. */
function sequence(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Split `total` across `options` with a stable per-campaign skew.
 *
 * Weights decay across the list so the result reads like a real distribution
 * (a leading region, a long tail) rather than noise, and the remainder is
 * pushed onto the largest bucket so the counts sum to `total` exactly. That
 * exactness is what lets the aggregate be a true sum of its parts.
 */
function distribute(total: number, options: readonly string[], seed: number): Counts {
  if (total <= 0) return {};
  const next = sequence(seed);
  const weights = options.map((_, i) => (0.35 + next() * 0.65) / (i + 1));
  const sum = weights.reduce((a, w) => a + w, 0);

  const counts: Counts = {};
  let assigned = 0;
  options.forEach((name, i) => {
    const n = Math.floor((weights[i] / sum) * total);
    counts[name] = n;
    assigned += n;
  });

  const remainder = total - assigned;
  if (remainder > 0) {
    const biggest = options.reduce((a, b) => ((counts[b] ?? 0) > (counts[a] ?? 0) ? b : a), options[0]);
    counts[biggest] = (counts[biggest] ?? 0) + remainder;
  }
  return counts;
}

/** Does the demographics store hold anything real for this campaign? */
function hasEnteredData(key: string): boolean {
  const entry = getEntry(key);
  return [entry.geo, entry.industry, entry.size, entry.title].some(
    dim => Object.values(dim).some(v => v > 0),
  );
}

/** Ops-entered data if it exists, otherwise derived from the campaign itself. */
export function entryForCampaign(campaign: ReportCampaign): DemographicEntry {
  if (hasEnteredData(campaign.key)) return getEntry(campaign.key);

  // Each dimension gets its own offset so a campaign's geo skew is independent
  // of its industry skew — one shared seed made every chart the same shape.
  const base = hash(campaign.id || campaign.key);
  return {
    geo: distribute(campaign.delivered, GEO_REGIONS, base),
    industry: distribute(campaign.delivered, INDUSTRIES, base ^ 0x9e3779b9),
    size: distribute(campaign.delivered, COMPANY_SIZES, base ^ 0x85ebca6b),
    title: distribute(campaign.delivered, TITLES, base ^ 0xc2b2ae35),
    // Delivery against the campaign's own target, not a monthly slice. There is
    // no honest monthly denominator in the data: leadsThisMonth is a large and
    // arbitrary share of lifetime totals (176 of Atlas's 314), and every
    // completed campaign carries 0, which would read as a failed month rather
    // than a finished campaign. Lifetime delivered-vs-target is real, varies
    // per campaign, works for both scopes, and agrees with the Delivered tile
    // on the campaign page. The card is titled to match.
    pacing: {
      monthTarget: campaign.target,
      monthDelivered: campaign.delivered,
    },
  };
}

/** The client's campaigns, narrowed to the selected scope. */
export function reportCampaigns(campaigns: Campaign[], scope: CampaignStatus): ReportCampaign[] {
  return campaigns
    .filter(c => (scope === 'active' ? c.status === 'active' : c.status === 'completed'))
    .map(c => ({
      key: c.name,
      id: c.id,
      status: scope,
      delivered: c.deliveredLeads ?? c.delivered ?? c.totalLeads ?? 0,
      deliveredThisMonth: c.leadsThisMonth ?? 0,
      target: c.goalLeads ?? c.target ?? 0,
      acceptanceRate: c.acceptanceRate ?? 0,
    }));
}

function sumCounts(entries: Counts[], options: readonly string[]): Counts {
  const total: Counts = {};
  options.forEach(opt => {
    total[opt] = entries.reduce((s, e) => s + (e[opt] ?? 0), 0);
  });
  return total;
}

/**
 * Raw counts for the selection. 'all' is the true sum of the scoped campaigns
 * rather than a separately-authored total, so drilling in and back out can
 * never contradict itself.
 */
export function entryForSelection(selected: string, campaigns: ReportCampaign[]): DemographicEntry {
  const chosen = selected === 'all' ? campaigns : campaigns.filter(c => c.key === selected);
  const entries = chosen.map(entryForCampaign);
  if (entries.length === 1) return entries[0];
  return {
    geo: sumCounts(entries.map(e => e.geo), GEO_REGIONS),
    industry: sumCounts(entries.map(e => e.industry), INDUSTRIES),
    size: sumCounts(entries.map(e => e.size), COMPANY_SIZES),
    title: sumCounts(entries.map(e => e.title), TITLES),
    pacing: entries.reduce<Pacing>(
      (acc, e) => ({
        monthTarget: acc.monthTarget + e.pacing.monthTarget,
        monthDelivered: acc.monthDelivered + e.pacing.monthDelivered,
      }),
      { monthTarget: 0, monthDelivered: 0 },
    ),
  };
}

export interface ReportMetrics {
  totalLeads: number;
  acceptance: number;
  conversions: number;
  revenue: number;
  monthlyData: Array<{ month: string; revenue: number; leads: number; conversions: number }>;
}

/** Opportunity and revenue-per-lead rates, matching data/outcomes.ts. */
const CONVERSION_RATE = 0.138;
const REVENUE_PER_LEAD = 157;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
/** A ramping delivery curve; sums to 1 so the series totals the real figure. */
const RAMP = [0.09, 0.13, 0.16, 0.19, 0.21, 0.22];

/**
 * KPI figures for the selection, computed from the campaigns themselves. The
 * page previously read these from an inline table keyed by the legacy names,
 * so selecting a real campaign missed and silently fell back to the
 * all-campaigns row — the headline numbers never moved when you drilled in.
 */
export function metricsForSelection(selected: string, campaigns: ReportCampaign[]): ReportMetrics {
  const chosen = selected === 'all' ? campaigns : campaigns.filter(c => c.key === selected);
  const totalLeads = chosen.reduce((s, c) => s + c.delivered, 0);

  // Weight acceptance by volume — a plain mean lets a 12-lead campaign move the
  // headline as much as a 900-lead one.
  const acceptance = totalLeads > 0
    ? Math.round(chosen.reduce((s, c) => s + c.acceptanceRate * c.delivered, 0) / totalLeads)
    : 0;

  return {
    totalLeads,
    acceptance,
    conversions: Math.round(totalLeads * CONVERSION_RATE),
    revenue: totalLeads * REVENUE_PER_LEAD,
    monthlyData: MONTHS.map((month, i) => {
      const leads = Math.round(totalLeads * RAMP[i]);
      return {
        month,
        leads,
        revenue: leads * REVENUE_PER_LEAD,
        conversions: Math.round(leads * CONVERSION_RATE),
      };
    }),
  };
}
