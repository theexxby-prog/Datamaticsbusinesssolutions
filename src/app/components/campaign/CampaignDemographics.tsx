import { Globe, Building2, IdCard, Users } from 'lucide-react';
import { DistributionBars } from '../DistributionBars';
import { getCampaignDemographics, REPORT_CAMPAIGNS } from '../../data/demographics';

// ─── Audience demographics for a single campaign ─────────────────────────────
// NOT currently mounted. Reports is the single home for demographics: it has
// the campaign drill-down and the scope control, so it answers both "this
// campaign" and "all campaigns" in one place.
//
// This was on the campaign detail page, where it could not do its job. The
// store is keyed by campaign name and no UNION campaign had an entry, so every
// one of the twelve rendered the identical all-campaigns aggregate — a
// page-level total sitting on a per-campaign page, twelve times over.
//
// Kept, rather than deleted, because per-campaign demographics are real: ops
// enter them through the Demographics module. The guard below now returns null
// instead of falling back to the aggregate, so if this is ever mounted again it
// shows this campaign's data or nothing — never someone else's numbers wearing
// this campaign's heading.

interface CampaignDemographicsProps {
  /** The campaign's display name, matched against the demographics store keys. */
  campaignName: string;
}

export function CampaignDemographics({ campaignName }: CampaignDemographicsProps) {
  const hasOwnEntry = REPORT_CAMPAIGNS.some(c => c.key === campaignName);
  if (!hasOwnEntry) return null;
  const demographics = getCampaignDemographics(campaignName);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
          Audience demographics
        </h2>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          This campaign
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
