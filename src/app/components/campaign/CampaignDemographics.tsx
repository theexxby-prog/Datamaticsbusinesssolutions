import { Globe, Building2, IdCard, Users } from 'lucide-react';
import { DistributionBars } from '../DistributionBars';
import { getCampaignDemographics, REPORT_CAMPAIGNS } from '../../data/demographics';

// ─── Audience demographics on the campaign detail page ───────────────────────
// The four distribution widgets the Reports page renders (geo / industry /
// title / company size), reused here in a compact 2×2 grid. The demographics
// store keys by the Reports-page campaign key; when this campaign has no
// per-campaign entry (the UNION campaigns don't yet), it falls back to the
// all-campaigns aggregate — same data, wider scope, labelled as such.

interface CampaignDemographicsProps {
  /** The campaign's display name, matched against the demographics store keys. */
  campaignName: string;
}

export function CampaignDemographics({ campaignName }: CampaignDemographicsProps) {
  const hasOwnEntry = REPORT_CAMPAIGNS.some(c => c.key === campaignName);
  const demographics = getCampaignDemographics(hasOwnEntry ? campaignName : 'all');

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
          Audience demographics
        </h2>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {hasOwnEntry ? 'This campaign' : 'Across all active campaigns'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DistributionBars title="Geographic Distribution" data={demographics.geo} icon={Globe} chipBg="var(--color-accent-purple-bg)" chipColor="var(--color-accent-purple)" />
        <DistributionBars title="Industry Distribution" data={demographics.industry} icon={Building2} chipBg="var(--color-success-bg)" chipColor="var(--color-success)" />
        <DistributionBars title="Title Distribution" data={demographics.title} icon={IdCard} chipBg="var(--color-warning-bg)" chipColor="var(--color-warning)" />
        <DistributionBars title="Company Size" data={demographics.size} icon={Users} chipBg="var(--color-error-bg)" chipColor="var(--color-error)" />
      </div>
    </div>
  );
}
