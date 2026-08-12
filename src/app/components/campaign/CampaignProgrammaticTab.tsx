import { Wallet, Activity, Building2, TrendingUp, Radar, Layers } from 'lucide-react';
import { AccountsSection } from '../propensity/AccountsSection';
import { SpendChannelsSection } from '../propensity/SpendChannelsSection';
import { SyndicationInfluenceSection } from '../propensity/SyndicationInfluenceSection';
import { getAbmSummary, getCohortBreakdown, PROPENSITY_SYNC_LABEL } from '../../data/propensity';
import { formatMoney as fmtMoney } from '../../utils/format';
import { format, parseISO } from 'date-fns';

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
  /** Ops workspace only: shows the per-cohort breakdown. Clients see totals. */
  opsView?: boolean;
}

export function CampaignProgrammaticTab({ abmCampaignId, opsView = false }: CampaignProgrammaticTabProps) {
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

      {/* Cohort breakdown — ops only. Propensity delivers a campaign as waves
          and reports per cohort; one campaign, cohorts roll up. The client
          view shows only the summed totals above, never the waves. */}
      {opsView && <CohortBreakdown abmCampaignId={abmCampaignId} />}

      {/* Target-account engagement (account-wide feed) */}
      <AccountsSection />

      {/* Spend by PDN channel + blended view */}
      <SpendChannelsSection />

      {/* Syndication → ABM influence via the crosswalk */}
      <SyndicationInfluenceSection />
    </div>
  );
}

function CohortBreakdown({ abmCampaignId }: { abmCampaignId: string }) {
  const cohorts = getCohortBreakdown(abmCampaignId);
  if (cohorts.length === 0) return null;
  const total = cohorts.reduce(
    (acc, c) => ({ impressions: acc.impressions + c.impressions, clicks: acc.clicks + c.clicks, spend: acc.spend + c.spend }),
    { impressions: 0, clicks: 0, spend: 0 },
  );
  const num = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <Layers className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        Delivery by cohort
      </h3>
      <p className="mt-1 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
        Propensity runs a campaign as waves and reports each separately, keyed by name. One campaign,
        cohorts roll up — the client sees the total only.
      </p>
      <div className="mt-2.5 overflow-x-auto">
        <table className="w-full min-w-[440px] text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
          <thead>
            <tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--color-text-muted)' }}>
              <th className="py-1.5 pr-3 font-bold">Cohort</th>
              <th className="py-1.5 pr-3 font-bold">Started</th>
              <th className="py-1.5 pr-3 text-right font-bold">Impressions</th>
              <th className="py-1.5 pr-3 text-right font-bold">Clicks</th>
              <th className="py-1.5 text-right font-bold">Spend</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
            {cohorts.map(c => (
              <tr key={c.cohort} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <td className="py-1.5 pr-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Cohort {c.cohort}</td>
                <td className="py-1.5 pr-3">{format(parseISO(c.startDate), 'MMM d, yyyy')}</td>
                <td className="py-1.5 pr-3 text-right">{num(c.impressions)}</td>
                <td className="py-1.5 pr-3 text-right">{num(c.clicks)}</td>
                <td className="py-1.5 text-right">{fmtMoney(c.spend)}</td>
              </tr>
            ))}
            <tr className="border-t font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              <td className="py-1.5 pr-3">Campaign total</td>
              <td className="py-1.5 pr-3" style={{ color: 'var(--color-text-muted)' }}>what the client sees</td>
              <td className="py-1.5 pr-3 text-right">{num(total.impressions)}</td>
              <td className="py-1.5 pr-3 text-right">{num(total.clicks)}</td>
              <td className="py-1.5 text-right">{fmtMoney(total.spend)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
