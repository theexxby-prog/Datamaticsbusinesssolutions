import { Wallet, Activity, Building2, TrendingUp, Radar } from 'lucide-react';
import { AccountsSection } from '../propensity/AccountsSection';
import { SpendChannelsSection } from '../propensity/SpendChannelsSection';
import { SyndicationInfluenceSection } from '../propensity/SyndicationInfluenceSection';
import { getAbmSummary, PROPENSITY_SYNC_LABEL } from '../../data/propensity';
import { formatMoney as fmtMoney } from '../../utils/format';

// ─── Programmatic tab on the campaign detail page ────────────────────────────
// The standalone Programmatic page merged into Campaigns: each crosswalk-paired
// syndication campaign now carries its ABM air cover as an analytics tab. The
// summary row is scoped to the ONE paired ABM campaign (spend / pacing /
// accounts / ROI come per-campaign from the Campaign Summary endpoint); the
// account, spend-channel and influence sections report at module level — the
// mock endpoints don't break those out per campaign yet, matching production,
// where PDN spend and account engagement are account-wide feeds.

interface CampaignProgrammaticTabProps {
  /** The paired ABM campaign (from ABM_SYNDICATION_CROSSWALK). */
  abmCampaignId: string;
}

export function CampaignProgrammaticTab({ abmCampaignId }: CampaignProgrammaticTabProps) {
  const abm = getAbmSummary().find(c => c.id === abmCampaignId);
  if (!abm) return null;

  const stats = [
    { icon: Wallet, label: 'Media spend', value: fmtMoney(abm.spendToDate), foot: `of ${fmtMoney(abm.budget)} budget` },
    { icon: Activity, label: 'Pacing', value: `${abm.pacingPct}%`, foot: 'of plan' },
    { icon: Building2, label: 'Accounts engaged', value: String(abm.engagedAccounts), foot: `of ${abm.goalAccounts} targeted` },
    { icon: TrendingUp, label: 'ROI', value: `${abm.roi.toFixed(1)}×`, foot: 'pipeline / spend' },
  ];

  return (
    <div className="space-y-4">
      {/* Paired ABM campaign summary */}
      <div className="glass-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-primary-tint)' }}
          >
            <Radar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {abm.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Powered by Propensity · {PROPENSITY_SYNC_LABEL}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--background-muted)' }}
              >
                <Icon className="mb-1 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                <div
                  className="text-lg font-extrabold leading-tight"
                  style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{stat.foot}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target-account engagement (account-wide feed) */}
      <AccountsSection />

      {/* Spend by PDN channel + blended view */}
      <SpendChannelsSection />

      {/* Syndication → ABM influence via the crosswalk */}
      <SyndicationInfluenceSection />
    </div>
  );
}
