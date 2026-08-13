// ============================================
// LEAD DEMOGRAPHICS + PACING — manual entry store
// --------------------------------------------
// Convertr's API does not return geo / industry / size / title
// breakdowns or per-month pacing, so an Ops or Campaign Manager
// enters them by hand in the Lead Demographics module. Data is
// persisted to localStorage and read back by the client-facing
// Reports page — the same proven pattern as the Metrics Override.
//
// DESIGN NOTES
//  - Counts are stored, never percentages. Percentages are derived
//    at render time so the "All campaigns" view is an accurate
//    weighted aggregate (sum of counts), not an average of percents.
//  - "All campaigns" is ALWAYS computed, never stored, and respects
//    the active/completed scope chosen on the client Reports page.
//  - Every lead has a geo AND industry AND size AND title, so the
//    four dimension totals for a campaign should match. The entry
//    UI surfaces mismatches (data-integrity check).
//  - Campaign keys must match the Reports page campaign options.
// ============================================

export const GEO_REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM', 'Other'] as const;

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Manufacturing',
  'Retail',
  'Other',
] as const;

export const COMPANY_SIZES = [
  'Enterprise (10K+)',
  'Large (1K-10K)',
  'Mid-Market',
  'SMB (<100)',
] as const;

export const TITLES = [
  'C-Level',
  'VP/Director',
  'Manager',
  'Senior Specialist',
  'Other',
] as const;

export type DimensionKey = 'geo' | 'industry' | 'size' | 'title';

export const DIMENSIONS: { key: DimensionKey; label: string; options: readonly string[] }[] = [
  { key: 'geo', label: 'Geographic Distribution', options: GEO_REGIONS },
  { key: 'industry', label: 'Industry Distribution', options: INDUSTRIES },
  { key: 'size', label: 'Company Size', options: COMPANY_SIZES },
  { key: 'title', label: 'Title Distribution', options: TITLES },
];

export type CampaignStatus = 'active' | 'completed';

// Campaign keys + status. Must match the Reports page campaign filter.
export const REPORT_CAMPAIGNS: { key: string; status: CampaignStatus }[] = [
  { key: 'IT Security', status: 'active' },
  { key: 'Healthcare Synd.', status: 'active' },
  { key: 'Financial BANT', status: 'active' },
  { key: 'SaaS Appts', status: 'completed' },
];

export function campaignsForScope(scope: CampaignStatus): string[] {
  return REPORT_CAMPAIGNS.filter((c) => c.status === scope).map((c) => c.key);
}

export type Counts = Record<string, number>;

export interface Pacing {
  monthTarget: number;
  monthDelivered: number;
}

export interface DemographicEntry {
  geo: Counts;
  industry: Counts;
  size: Counts;
  title: Counts;
  pacing: Pacing;
}

export interface ChartPoint {
  name: string;
  count: number;
  percentage: number;
}

const STORAGE_KEY = 'datamatics-demographics-overrides';

const SEED: Record<string, DemographicEntry> = {
  'IT Security': {
    geo: { 'North America': 180, EMEA: 80, APAC: 40, LATAM: 15, Other: 5 },
    industry: { Technology: 140, 'Financial Services': 60, Healthcare: 50, Manufacturing: 40, Retail: 20, Other: 10 },
    size: { 'Enterprise (10K+)': 90, 'Large (1K-10K)': 110, 'Mid-Market': 80, 'SMB (<100)': 40 },
    title: { 'C-Level': 60, 'VP/Director': 96, Manager: 80, 'Senior Specialist': 54, Other: 30 },
    pacing: { monthTarget: 400, monthDelivered: 320 },
  },
  'Healthcare Synd.': {
    geo: { 'North America': 120, EMEA: 60, APAC: 30, LATAM: 10, Other: 5 },
    industry: { Healthcare: 150, Technology: 30, 'Financial Services': 20, Manufacturing: 10, Retail: 5, Other: 10 },
    size: { 'Enterprise (10K+)': 70, 'Large (1K-10K)': 75, 'Mid-Market': 50, 'SMB (<100)': 30 },
    title: { 'C-Level': 40, 'VP/Director': 70, Manager: 55, 'Senior Specialist': 35, Other: 25 },
    pacing: { monthTarget: 300, monthDelivered: 240 },
  },
  'Financial BANT': {
    geo: { 'North America': 90, EMEA: 70, APAC: 25, LATAM: 8, Other: 7 },
    industry: { 'Financial Services': 130, Technology: 35, Healthcare: 15, Manufacturing: 8, Retail: 5, Other: 7 },
    size: { 'Enterprise (10K+)': 80, 'Large (1K-10K)': 70, 'Mid-Market': 35, 'SMB (<100)': 15 },
    title: { 'C-Level': 35, 'VP/Director': 60, Manager: 50, 'Senior Specialist': 35, Other: 20 },
    pacing: { monthTarget: 350, monthDelivered: 300 },
  },
  'SaaS Appts': {
    geo: { 'North America': 60, EMEA: 30, APAC: 20, LATAM: 5, Other: 5 },
    industry: { Technology: 70, 'Financial Services': 25, Healthcare: 12, Manufacturing: 6, Retail: 4, Other: 3 },
    size: { 'Enterprise (10K+)': 30, 'Large (1K-10K)': 45, 'Mid-Market': 30, 'SMB (<100)': 15 },
    title: { 'C-Level': 18, 'VP/Director': 36, Manager: 30, 'Senior Specialist': 22, Other: 14 },
    pacing: { monthTarget: 450, monthDelivered: 320 },
  },
};

const EMPTY_PACING: Pacing = { monthTarget: 0, monthDelivered: 0 };

function readStore(): Record<string, Partial<DemographicEntry>> {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Failed to read demographics store:', e);
    return {};
  }
}

/** Raw counts + pacing for a single campaign (stored value wins over seed). */
export function getEntry(campaignKey: string): DemographicEntry {
  const store = readStore();
  const seed = SEED[campaignKey];
  const stored = store[campaignKey] || {};
  return {
    geo: { ...(seed?.geo ?? {}), ...(stored.geo ?? {}) },
    industry: { ...(seed?.industry ?? {}), ...(stored.industry ?? {}) },
    size: { ...(seed?.size ?? {}), ...(stored.size ?? {}) },
    title: { ...(seed?.title ?? {}), ...(stored.title ?? {}) },
    pacing: { ...(seed?.pacing ?? EMPTY_PACING), ...(stored.pacing ?? {}) },
  };
}

/** Persist counts + pacing for one campaign. */
export function saveDemographics(campaignKey: string, entry: DemographicEntry): void {
  try {
    const store = readStore();
    store[campaignKey] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save demographics:', e);
  }
}

function toChartPoints(counts: Counts, order: readonly string[]): ChartPoint[] {
  const total = order.reduce((sum, k) => sum + (counts[k] || 0), 0);
  return order
    .map((name) => {
      const count = counts[name] || 0;
      const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
      return { name, count, percentage };
    })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);
}

export type Demographics = Record<DimensionKey, ChartPoint[]>;

/** Raw counts → the chart shape the Reports widgets render. */
export function toDemographics(entry: DemographicEntry): Demographics {
  return {
    geo: toChartPoints(entry.geo, GEO_REGIONS),
    industry: toChartPoints(entry.industry, INDUSTRIES),
    size: toChartPoints(entry.size, COMPANY_SIZES),
    title: toChartPoints(entry.title, TITLES),
  };
}

/**
 * Chart-ready demographics for a campaign key, or a computed aggregate
 * when key === 'all'. The aggregate respects the active/completed scope.
 */
export function getCampaignDemographics(campaignKey: string, scope: CampaignStatus = 'active'): Demographics {
  const build = (entry: DemographicEntry): Demographics => ({
    geo: toChartPoints(entry.geo, GEO_REGIONS),
    industry: toChartPoints(entry.industry, INDUSTRIES),
    size: toChartPoints(entry.size, COMPANY_SIZES),
    title: toChartPoints(entry.title, TITLES),
  });

  if (campaignKey !== 'all') return build(getEntry(campaignKey));

  const totals: Record<DimensionKey, Counts> = { geo: {}, industry: {}, size: {}, title: {} };
  campaignsForScope(scope).forEach((key) => {
    const e = getEntry(key);
    DIMENSIONS.forEach(({ key: dim, options }) => {
      options.forEach((opt) => {
        totals[dim][opt] = (totals[dim][opt] || 0) + (e[dim][opt] || 0);
      });
    });
  });
  return {
    geo: toChartPoints(totals.geo, GEO_REGIONS),
    industry: toChartPoints(totals.industry, INDUSTRIES),
    size: toChartPoints(totals.size, COMPANY_SIZES),
    title: toChartPoints(totals.title, TITLES),
  };
}

/** Month pacing for a campaign, or summed across a scope when key === 'all'. */
export function getPacing(campaignKey: string, scope: CampaignStatus = 'active'): Pacing {
  if (campaignKey !== 'all') return getEntry(campaignKey).pacing;
  return campaignsForScope(scope).reduce<Pacing>(
    (acc, key) => {
      const p = getEntry(key).pacing;
      return { monthTarget: acc.monthTarget + p.monthTarget, monthDelivered: acc.monthDelivered + p.monthDelivered };
    },
    { ...EMPTY_PACING },
  );
}

/** Sum of counts for one dimension — used for the integrity check. */
export function dimensionTotal(counts: Counts, dim: DimensionKey): number {
  const options = DIMENSIONS.find((d) => d.key === dim)!.options;
  return options.reduce((s, o) => s + (Number(counts[o]) || 0), 0);
}
