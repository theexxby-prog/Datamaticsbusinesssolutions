// ─── Content syndication performance ─────────────────────────────────────────
// The part of the consultant's dashboard Pulse had no equivalent for, and the
// part that matters most to us because syndication is the core business. Four
// questions, none of which a delivered-lead count answers on its own:
//
//   Which asset actually converts?      → getAssetPerformance
//   Which publisher is worth renewing?  → getPublisherPerformance
//   Were the leads any good?            → getLeadQuality
//
// Everything derives from the campaign's delivered-lead total, so the parts
// always sum to the whole and can never disagree with the delivery timeline
// sitting above them. Same discipline as propensity.ts — no Math.random, so
// charts are stable across reloads and screenshots.

/** Stable per-campaign variation. Mirrors seedOf in propensity.ts. */
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

// ── Asset performance ────────────────────────────────────────────────────────

export type SyndicationAssetType = 'Whitepaper' | 'Case study' | 'Webinar' | 'Analyst report' | 'Buyer guide';

export interface AssetPerformance {
  assetId: string;
  name: string;
  type: SyndicationAssetType;
  /** Times the gated asset was put in front of someone. */
  views: number;
  leads: number;
  /** leads / views, as a percentage. */
  conversionRate: number;
  /** Share of the campaign's delivered leads. */
  sharePct: number;
}

const ASSET_POOL: Array<{ name: string; type: SyndicationAssetType; pull: number }> = [
  { name: 'The 2026 Zero-Trust Readiness Report', type: 'Analyst report', pull: 30 },
  { name: 'Migrating Without Downtime: A Buyer Guide', type: 'Buyer guide', pull: 24 },
  { name: 'How Meridian Cut Incident Response to 9 Minutes', type: 'Case study', pull: 19 },
  { name: 'Securing the Hybrid Estate', type: 'Whitepaper', pull: 15 },
  { name: 'Live: Architecting for Resilience', type: 'Webinar', pull: 12 },
];

/**
 * Which asset earned the leads. Conversion rate is the number that changes
 * behaviour: a whitepaper with half the volume but twice the conversion is the
 * one to put more budget behind, and volume alone hides that completely.
 */
export function getAssetPerformance(campaignId: string, totalLeads: number): AssetPerformance[] {
  if (totalLeads <= 0) return [];
  const seed = seedOf(campaignId);
  const weights = ASSET_POOL.map((a, i) => a.pull + ((seed + i * 5) % 7));
  const leadCounts = splitTotal(totalLeads, weights);

  return ASSET_POOL.map((asset, i) => {
    const leads = leadCounts[i];
    // Conversion sits between roughly 6% and 15%. The rate is the driver and
    // views are derived from it, not the other way round, so a high-converting
    // asset shows the smaller audience that earned its rate.
    const rate = 6 + ((seed + i * 11) % 90) / 10;
    const views = Math.max(leads, Math.round(leads / (rate / 100)));
    return {
      assetId: `asset_${i + 1}`,
      name: asset.name,
      type: asset.type,
      views,
      leads,
      conversionRate: Math.round((leads / views) * 1000) / 10,
      sharePct: Math.round((leads / totalLeads) * 100),
    };
  }).sort((a, b) => b.leads - a.leads);
}

// ── Publisher performance ────────────────────────────────────────────────────

export interface PublisherPerformance {
  publisher: string;
  leads: number;
  /** Share of this publisher's leads the client accepted. */
  acceptanceRate: number;
  /** 0-100 blend of title match, firmographic match and acceptance. */
  qualityScore: number;
  /** Ops only — omitted entirely from client responses, never just hidden. */
  costPerLead?: number;
}

const PUBLISHER_POOL = [
  { name: 'TechTarget Network', weight: 26, quality: 88 },
  { name: 'Foundry (IDG)', weight: 21, quality: 85 },
  { name: 'Informa Tech', weight: 17, quality: 81 },
  { name: 'QuinStreet B2B', weight: 14, quality: 74 },
  { name: 'Madison Logic', weight: 12, quality: 79 },
  { name: 'Direct outreach', weight: 10, quality: 91 },
];

export function getPublisherPerformance(
  campaignId: string,
  totalLeads: number,
  opsView = false,
): PublisherPerformance[] {
  if (totalLeads <= 0) return [];
  const seed = seedOf(campaignId);
  const counts = splitTotal(totalLeads, PUBLISHER_POOL.map((p, i) => p.weight + ((seed + i * 3) % 5)));

  return PUBLISHER_POOL.map((pub, i) => {
    const qualityScore = Math.min(99, pub.quality + ((seed + i * 7) % 6) - 2);
    // Acceptance tracks quality closely — that is what quality means here.
    const acceptanceRate = Math.min(99, Math.round(qualityScore * 0.96 + ((seed + i) % 5)));
    return {
      publisher: pub.name,
      leads: counts[i],
      acceptanceRate,
      qualityScore,
      // Better publishers cost more per lead. That trade-off is exactly the
      // ops decision this table exists to inform.
      ...(opsView ? { costPerLead: Math.round((28 + qualityScore * 0.55 + ((seed + i * 4) % 9)) * 100) / 100 } : {}),
    };
  }).sort((a, b) => b.leads - a.leads);
}

// ── Sales disposition ────────────────────────────────────────────────────────
// The loop nothing else in Pulse closes. We report what we delivered; this
// reports what the client's sales team did with it. Four mutually exclusive
// states that sum to the delivered total.

export interface DispositionStage {
  key: 'converted' | 'working' | 'accepted' | 'rejected';
  label: string;
  hint: string;
  leads: number;
  pct: number;
}

export interface LeadDisposition {
  delivered: number;
  stages: DispositionStage[];
  /** Accepted + working + converted, as a percentage of delivered. */
  acceptedPct: number;
}

// No longer a public selector. What a client's sales team does with a lead is
// their business and outside what we can source, so the disposition panel is
// gone. getLeadQuality still needs the accepted/rejected split, which is ours
// and which we do know, so the derivation stays here as a private helper.
function getLeadDisposition(campaignId: string, totalLeads: number): LeadDisposition | null {
  if (totalLeads <= 0) return null;
  const seed = seedOf(campaignId);
  const counts = splitTotal(totalLeads, [11 + (seed % 5), 27, 47, 9 + (seed % 4)]);

  const defs: Array<Omit<DispositionStage, 'leads' | 'pct'>> = [
    { key: 'converted', label: 'Converted to opportunity', hint: 'in the pipeline with a value against it' },
    { key: 'working', label: 'Being worked', hint: 'sales has made contact' },
    { key: 'accepted', label: 'Accepted, not yet worked', hint: 'in the queue' },
    { key: 'rejected', label: 'Rejected', hint: 'returned to us, replaced free of charge' },
  ];
  const stages: DispositionStage[] = defs.map((d, i) => ({
    ...d,
    leads: counts[i],
    pct: Math.round((counts[i] / totalLeads) * 100),
  }));

  return {
    delivered: totalLeads,
    stages,
    acceptedPct: Math.round(((totalLeads - counts[3]) / totalLeads) * 100),
  };
}

// ── Lead quality ─────────────────────────────────────────────────────────────

export interface LeadQuality {
  /** Delivered leads whose job title matched the agreed target list. */
  titleMatchPct: number;
  /** Delivered leads matching the agreed company size, industry and geography. */
  firmographicMatchPct: number;
  /** Deliveries that landed on or before the scheduled date. */
  slaOnTimePct: number;
  rejected: number;
  replaced: number;
}

export function getLeadQuality(campaignId: string, totalLeads: number): LeadQuality | null {
  if (totalLeads <= 0) return null;
  const seed = seedOf(campaignId);
  // Read the rejected count off the disposition rather than deriving it again.
  // Two independent formulas for the same number is how a dashboard ends up
  // showing "12 rejected" beside "14 replaced" and losing the reader's trust.
  const disposition = getLeadDisposition(campaignId, totalLeads);
  const rejected = disposition?.stages.find(s => s.key === 'rejected')?.leads ?? 0;
  return {
    titleMatchPct: 92 + (seed % 6),
    firmographicMatchPct: 94 + (seed % 5),
    slaOnTimePct: 96 + (seed % 4),
    rejected,
    // Everything rejected gets replaced — that is the commitment, and showing
    // the two numbers together is what makes the rejection count safe to show.
    replaced: rejected,
  };
}
