import { Briefcase, Factory, Layers, UserRound, Users } from 'lucide-react';
import { DistributionBars } from '../DistributionBars';
import { getBuyingCentre, getIndustryMix } from '../../data/propensity';

// ─── Audience tab ────────────────────────────────────────────────────────────
// Not "how many people" but "which people". A campaign that reaches one
// practitioner at every account looks identical to one that reaches the whole
// buying committee, until you split it by seniority. Both splits derive from
// the campaign record so they stay consistent with the reach figures.

export function CampaignAudienceTab({ abmCampaignId }: { abmCampaignId: string }) {
  const centre = getBuyingCentre(abmCampaignId);
  const industries = getIndustryMix(abmCampaignId);
  if (!centre) return null;

  const tiles = [
    { Icon: Users, label: 'People reached', value: centre.stakeholders.toLocaleString('en-US'), sub: 'inside engaged accounts' },
    { Icon: Layers, label: 'Buying-centre depth', value: `${centre.avgPerAccount}`, sub: 'stakeholders per account' },
    { Icon: UserRound, label: 'Director and above', value: `${centre.directorPlusPct}%`, sub: 'of everyone reached' },
    { Icon: Factory, label: 'Verticals engaged', value: `${industries.filter(i => i.accounts > 0).length}`, sub: 'industries represented' },
  ];

  // Seniority reads top-down, so it keeps its declared order rather than being
  // sorted by size — the shape is the point.
  const maxSeniority = Math.max(...centre.seniority.map(s => s.percentage));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <p className="mt-3 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
          Director and above accounts for {centre.directorPlusPct}% of everyone the campaign has reached.
        </p>
      </div>

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
