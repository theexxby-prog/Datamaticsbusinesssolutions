import { Briefcase, Building2, Factory, Layers, Repeat, UserRound, Users } from 'lucide-react';
import { DistributionBars } from '../DistributionBars';
import { InsightStrip } from '../ui/InsightStrip';
import { getAudienceInsights } from '../../data/insights';
import {
  getBuyingCentre, getIndustryMix, getReachedCompanies, getTouchesPerAccount,
} from '../../data/propensity';

// ─── Audience tab ────────────────────────────────────────────────────────────
// Not "how many people" but "which people". A campaign that reaches one
// practitioner at every account looks identical to one that reaches the whole
// buying committee, until you split it by seniority. Both splits derive from
// the campaign record so they stay consistent with the reach figures.

export function CampaignAudienceTab({ abmCampaignId }: { abmCampaignId: string }) {
  const centre = getBuyingCentre(abmCampaignId);
  const industries = getIndustryMix(abmCampaignId);
  const companies = getReachedCompanies(abmCampaignId);
  const touches = getTouchesPerAccount(abmCampaignId);
  const insights = getAudienceInsights(abmCampaignId);
  if (!centre) return null;

  const tiles = [
    { Icon: Users, label: 'People reached', value: centre.stakeholders.toLocaleString('en-US'), sub: 'inside engaged accounts' },
    { Icon: Layers, label: 'Buying-centre depth', value: `${centre.avgPerAccount}`, sub: 'stakeholders per account' },
    { Icon: UserRound, label: 'Director and above', value: `${centre.directorPlusPct}%`, sub: 'of everyone reached' },
    { Icon: Repeat, label: 'Touches per account', value: touches.toLocaleString('en-US'), sub: 'impressions, on average' },
    { Icon: Factory, label: 'Verticals engaged', value: `${industries.filter(i => i.accounts > 0).length}`, sub: 'industries represented' },
  ];

  // Seniority reads top-down, so it keeps its declared order rather than being
  // sorted by size — the shape is the point.
  const maxSeniority = Math.max(...centre.seniority.map(s => s.percentage));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(t => (
          <div key={t.label} className="glass-card flex flex-col p-3.5">
            <t.Icon className="mb-1 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <div
              className="text-[20px] font-extrabold leading-tight"
              style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {t.value}
            </div>
            <div className="text-[11.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{t.label}</div>
            <div className="text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Seniority pyramid — declared order, widest at the base */}
      <div className="glass-card p-5">
        <h3
          className="mb-1 flex items-center gap-2"
          style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
        >
          <UserRound className="h-4 w-4" />
          Seniority reached
        </h3>
        <p className="mb-4" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Whether the campaign is landing with the buying committee or only its practitioners
        </p>
        <div className="space-y-2.5">
          {centre.seniority.map((band, i) => (
            <div key={band.name} className="flex items-center gap-3">
              <span className="flex-shrink-0 truncate text-[12px]" style={{ width: 104, color: 'var(--color-text-secondary)' }}>
                {band.name}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, Math.round((band.percentage / maxSeniority) * 100))}%`,
                    background: i < 3 ? 'var(--color-progress)' : 'var(--color-chart-2)',
                  }}
                />
              </div>
              <span
                className="flex-shrink-0 text-right text-[12px] font-semibold"
                style={{ width: 40, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
              >
                {band.percentage}%
              </span>
            </div>
          ))}
        </div>
        <InsightStrip insights={insights} />
      </div>

      {/* Named companies, as chips rather than a table. At this length a reader
          wants to scan for a name they recognise, not sort a column. */}
      {companies.length > 0 && (
        <div className="glass-card p-5">
          <h3
            className="mb-1 flex items-center gap-2"
            style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
          >
            <Building2 className="h-4 w-4" />
            Companies reached
          </h3>
          <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            The {companies.length} highest-intent accounts the campaign has landed with
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map(company => (
              <div
                key={company.name}
                className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
                style={{ borderColor: 'var(--color-border-light)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {company.name}
                  </div>
                  <div className="truncate text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>
                    {company.industry}
                  </div>
                </div>
                <span
                  className="flex-shrink-0 text-[13px] font-extrabold"
                  style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                  title={`Intent score ${company.intentScore} out of 100`}
                >
                  {company.intentScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionBars
          title="Job function"
          data={centre.functions}
          icon={Briefcase}
          chipBg="var(--color-info-bg)"
          chipColor="var(--color-info)"
        />
        <DistributionBars
          title="Industry mix of engaged accounts"
          data={industries.map(i => ({ name: i.name, percentage: i.percentage }))}
          icon={Factory}
          chipBg="var(--color-success-bg)"
          chipColor="var(--color-success)"
        />
      </div>
    </div>
  );
}
