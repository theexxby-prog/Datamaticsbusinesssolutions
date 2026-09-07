import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Activity, Building2, Eye, Gauge, Layers, MousePointerClick, Radar, Sparkle, TrendingUp, Wallet,
} from 'lucide-react';
import { AssetsSection } from '../propensity/AssetsSection';
import { SpendChannelsSection } from '../propensity/SpendChannelsSection';
import { SyndicationInfluenceSection } from '../propensity/SyndicationInfluenceSection';
import { ChartCard, TOOLTIP_STYLE } from '../ChartCard';
import { useIsMobile } from '../ui/use-mobile';
import { InsightStrip } from '../ui/InsightStrip';
import { getAdvertisingInsights } from '../../data/insights';
import {
  getAbmSummary, getAudienceOverlap, getChannelPerformance, getCohortBreakdown,
  getCreativePerformance, getFrequencyDistribution, PROPENSITY_SYNC_LABEL,
} from '../../data/propensity';
import { formatMoney as fmtMoney } from '../../utils/format';
import { format, parseISO } from 'date-fns';

// ─── Advertising tab ─────────────────────────────────────────────────────────
// Just the ads now. Account reach and audience composition used to live here,
// which made this tab a catch-all and buried the things it was actually about;
// they're campaign-level truths that happen to be measured through ad data, so
// they moved to their own tabs. What's left is delivery, saturation, channel
// mix and creative — plus the ops-only cost view.
//
// Spend, pacing and ROI are ops-only. They used to render for clients here,
// which contradicted the rule that a client sees one combined spend figure
// with margins already applied.

interface CampaignProgrammaticTabProps {
  /** The paired ABM campaign (from ABM_SYNDICATION_CROSSWALK). */
  abmCampaignId: string;
  /** Ops workspace only: cohorts, spend channels and the cost tiles. */
  opsView?: boolean;
}

export function CampaignProgrammaticTab({ abmCampaignId, opsView = false }: CampaignProgrammaticTabProps) {
  const isMobile = useIsMobile();
  const abm = getAbmSummary().find(c => c.id === abmCampaignId);
  if (!abm) return null;

  const ctr = abm.impressions > 0 ? Math.round((abm.clicks / abm.impressions) * 10000) / 100 : 0;
  const frequency = getFrequencyDistribution(abmCampaignId);
  const channels = getChannelPerformance(abmCampaignId, opsView);

  const stats = [
    { icon: Eye, label: 'Impressions', value: abm.impressions.toLocaleString('en-US'), foot: 'served to date' },
    { icon: MousePointerClick, label: 'Clicks', value: abm.clicks.toLocaleString('en-US'), foot: `${ctr}% CTR` },
    { icon: Building2, label: 'Accounts engaged', value: String(abm.engagedAccounts), foot: `of ${abm.goalAccounts} targeted` },
    ...(opsView
      ? [
          { icon: Wallet, label: 'Media spend', value: fmtMoney(abm.spendToDate), foot: `of ${fmtMoney(abm.budget)} budget` },
          { icon: Activity, label: 'Pacing', value: `${abm.pacingPct}%`, foot: 'of plan' },
          { icon: TrendingUp, label: 'ROI', value: `${abm.roi.toFixed(1)}×`, foot: 'pipeline / spend' },
        ]
      : []),
  ];

  const sweetSpot = frequency.find(f => f.inSweetSpot);
  const overlap = getAudienceOverlap(abmCampaignId);
  const creatives = getCreativePerformance(abmCampaignId, opsView);
  const insights = getAdvertisingInsights(abmCampaignId);

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
        <div className={`grid grid-cols-2 gap-3 ${opsView ? 'sm:grid-cols-3 xl:grid-cols-6' : 'sm:grid-cols-3'}`}>
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
                <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{stat.foot}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saturation — are accounts seeing the right amount? */}
      <ChartCard title="Impression frequency per account" icon={Gauge}>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <BarChart data={frequency} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(120,140,170,0.18)" vertical={false} />
            <XAxis dataKey="band" stroke="none" tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <YAxis stroke="none" tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} accounts`, 'Accounts']} />
            <Bar dataKey="accounts" radius={[3, 3, 0, 0]}>
              {frequency.map(f => (
                <Cell key={f.band} fill={f.inSweetSpot ? 'var(--color-primary-solid)' : 'var(--color-chart-2)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Engagement peaks between 7 and 12 impressions per account, where {sweetSpot?.accounts ?? 0} accounts currently
          sit. Below that they don't remember you; above it, returns flatten.
        </p>
        <InsightStrip insights={insights} />
      </ChartCard>

      {/* How many channels each reached account has actually seen. The
          single-channel group is the one with room to grow; the three-plus
          group is where multi-touch campaigns earn their premium. */}
      {overlap.length > 0 && (
        <div className="glass-card p-4">
          <h3
            className="mb-3 flex items-center gap-2"
            style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
          >
            <Layers className="h-4 w-4" />
            Channel overlap
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {overlap.map((band, i) => (
              <div key={band.label} className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                <div
                  className="text-lg font-extrabold leading-tight"
                  style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {band.accounts.toLocaleString('en-US')}
                </div>
                <div className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{band.label}</div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(3, band.percentage)}%`,
                      background: i === overlap.length - 1 ? 'var(--color-success)' : 'var(--color-progress)',
                    }}
                  />
                </div>
                <div className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {band.percentage}% of reached accounts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel mix */}
      <div className="glass-card p-4">
        <h3
          className="mb-3 flex items-center gap-2"
          style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
        >
          <Layers className="h-4 w-4" />
          Channel performance
        </h3>
        <div className="scroll-shadows overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            <thead>
              <tr
                className="text-left text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <th className="py-1.5 pr-3 font-bold">Channel</th>
                <th className="py-1.5 pr-3 text-right font-bold">Impressions</th>
                <th className="py-1.5 pr-3 text-right font-bold">Clicks</th>
                <th className="py-1.5 text-right font-bold">CTR</th>
                {opsView && <th className="py-1.5 pl-3 text-right font-bold">Cost</th>}
              </tr>
            </thead>
            <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
              {channels.map(c => (
                <tr key={c.channel} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <td className="py-1.5 pr-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.channel}</td>
                  <td className="py-1.5 pr-3 text-right">{c.impressions.toLocaleString('en-US')}</td>
                  <td className="py-1.5 pr-3 text-right">{c.clicks.toLocaleString('en-US')}</td>
                  <td className="py-1.5 text-right">{c.ctr}%</td>
                  {opsView && <td className="py-1.5 pl-3 text-right">{fmtMoney(c.cost ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best creative on each channel. This is a different axis from
          AssetsSection below, which splits by creative FORMAT (display /
          native / video) across the whole campaign — same word, different
          question. Here it's "what's working where". */}
      {creatives.length > 0 && (
        <div className="glass-card p-4">
          <h3
            className="mb-1 flex items-center gap-2"
            style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
          >
            <Sparkle className="h-4 w-4" />
            Top creative on each channel
          </h3>
          <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Ranked by click-through rate, best first
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {creatives.map(creative => (
              <div
                key={creative.channel}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--color-border)' }}
                data-testid="creative-card"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--color-text-muted)' }}>
                    {creative.channel}
                  </span>
                  <span
                    className="text-sm font-extrabold"
                    style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {creative.ctr}%
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {creative.name}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {creative.format} · {creative.clicks.toLocaleString('en-US')} clicks from{' '}
                  {creative.impressions.toLocaleString('en-US')} impressions
                  {creative.costPerClick !== undefined && ` · $${creative.costPerClick.toFixed(2)} per click`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creative performance by format, moved here from its own ops tab */}
      <AssetsSection abmCampaignId={abmCampaignId} />

      {/* Cohort breakdown — ops only. Propensity delivers a campaign as waves
          and reports per cohort; one campaign, cohorts roll up. The client
          view shows only the summed totals above, never the waves. */}
      {opsView && <CohortBreakdown abmCampaignId={abmCampaignId} />}

      {/* Ad → lead funnel — ops only. An ad hit is never billed directly:
          engaged people route into the content syndication motion, and only a
          positive response there becomes a lead the client pays for. */}
      {opsView && <AdToLeadFunnel abmCampaignId={abmCampaignId} />}

      {/* Spend by channel — ops only, it's cost data */}
      {opsView && <SpendChannelsSection />}

      {/* Syndication → ABM influence via the crosswalk */}
      <SyndicationInfluenceSection />
    </div>
  );
}

function AdToLeadFunnel({ abmCampaignId }: { abmCampaignId: string }) {
  const abm = getAbmSummary().find(c => c.id === abmCampaignId);
  if (!abm) return null;
  // Deterministic off the campaign's engaged-accounts figure so this strip
  // always agrees with the summary tiles above it.
  const engagedContacts = abm.engagedAccounts * 3;
  const inOutreach = Math.round(engagedContacts * 0.42);
  const converted = Math.round(inOutreach * 0.16);
  const steps = [
    { label: 'Engaged with ads', value: engagedContacts, sub: 'contacts, via Propensity' },
    { label: 'In syndication outreach', value: inOutreach, sub: 'routed automatically' },
    { label: 'Became billable leads', value: converted, sub: 'positive response' },
  ];

  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <TrendingUp className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        From ads to billable leads
      </h3>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>→</span>}
            <div
              className="rounded-xl border px-3.5 py-2"
              style={{ borderColor: 'var(--color-border)', background: i === steps.length - 1 ? 'var(--color-primary-tint)' : 'var(--background-muted)' }}
            >
              <div className="text-base font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {step.value.toLocaleString('en-US')}
              </div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{step.label}</div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{step.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Ad engagement is never billed directly — it fills the top of the funnel, syndication converts it,
        and the client pays only for leads that come out the far end.
      </p>
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
      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Propensity runs a campaign as waves and reports each separately, keyed by name. One campaign,
        cohorts roll up — the client sees the total only.
      </p>
      <div className="mt-2.5 overflow-x-auto">
        <table className="w-full min-w-[440px] text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          <thead>
            <tr className="text-left text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
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
