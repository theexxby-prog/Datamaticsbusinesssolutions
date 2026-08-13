import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Radar, Target, TrendingUp, Users } from 'lucide-react';
import { ChartCard, TOOLTIP_STYLE } from '../ChartCard';
import { AccountsSection } from '../propensity/AccountsSection';
import { useIsMobile } from '../ui/use-mobile';
import { WowBadge } from '../ui/WowBadge';
import { InsightStrip } from '../ui/InsightStrip';
import { AwarenessHeatmap } from './AwarenessHeatmap';
import { getReachInsights } from '../../data/insights';
import {
  getAccountFunnel, getReachDeltas, getUnreachedAccounts, getWeeklyReach,
} from '../../data/propensity';

// ─── Reach tab ───────────────────────────────────────────────────────────────
// The ABM question a lead count can't answer: of the accounts we set out to
// reach, how far down the funnel has each one travelled? Every stage derives
// from the same campaign record, so this can't disagree with the KPI band.
// The unreached list is the actionable half — those are the accounts to point
// the next flight at.

const STAGE_TONE = [
  'var(--color-primary-solid)',
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-chart-2)',
  'var(--color-warning)',
];

export function CampaignReachTab({ abmCampaignId }: { abmCampaignId: string }) {
  const isMobile = useIsMobile();
  const funnel = getAccountFunnel(abmCampaignId);
  const unreached = getUnreachedAccounts(abmCampaignId);
  const weekly = getWeeklyReach(abmCampaignId);
  const deltas = getReachDeltas(abmCampaignId);
  const insights = getReachInsights(abmCampaignId);
  if (funnel.length === 0) return null;

  const targeted = funnel[0].accounts;
  const reached = funnel[1].accounts;
  const salesReady = funnel[funnel.length - 1].accounts;

  // The target list is fixed for the flight, so it carries no delta — a "+0"
  // pill next to it would imply it could move.
  const tiles = [
    { Icon: Target, label: 'Accounts targeted', value: targeted, sub: 'named in the audience', delta: null },
    { Icon: Radar, label: 'Reached', value: reached, sub: `${funnel[1].pctOfTargeted}% of the list`, delta: deltas?.reached },
    { Icon: Users, label: 'Engaged', value: funnel[2].accounts, sub: 'clicked or visited', delta: deltas?.engaged },
    { Icon: TrendingUp, label: 'Sales-ready', value: salesReady, sub: 'hot — worth a call now', delta: deltas?.salesReady },
  ];

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
              {t.value.toLocaleString('en-US')}
            </div>
            <div className="text-[11.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{t.label}</div>
            <div className="text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>{t.sub}</div>
            {t.delta && (
              <div className="mt-1.5">
                <WowBadge change={t.delta.change} unit="this week" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* The funnel — shrinking bars, one row per stage */}
      <div className="glass-card p-5">
        <h3
          className="mb-1 flex items-center gap-2"
          style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
        >
          <Target className="h-4 w-4" />
          Account engagement funnel
        </h3>
        <p className="mb-5" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          How far through the funnel each named account has travelled
        </p>
        <div className="space-y-3.5">
          {funnel.map((stage, i) => (
            <div
              key={stage.key}
              data-testid="funnel-stage"
              data-stage={stage.key}
              data-accounts={stage.accounts}
            >
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {stage.label}
                  <span className="ml-2 text-[11.5px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
                    {stage.hint}
                  </span>
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {stage.accounts.toLocaleString('en-US')}
                  <span className="ml-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {stage.pctOfTargeted}%
                  </span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.max(3, stage.pctOfTargeted)}%`, background: STAGE_TONE[i] }}
                />
              </div>
            </div>
          ))}
        </div>
        <InsightStrip insights={insights} />
      </div>

      <AwarenessHeatmap abmCampaignId={abmCampaignId} />

      <ChartCard title="Weekly reach build-up" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={isMobile ? 190 : 240}>
          <AreaChart data={weekly} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(120,140,170,0.18)" vertical={false} />
            <XAxis dataKey="week" stroke="none" tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
            <YAxis stroke="none" tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [v.toLocaleString('en-US'), n === 'reached' ? 'Reached' : 'Engaged']} />
            <Area type="monotone" dataKey="reached" stroke="var(--color-primary)" strokeWidth={2} fill="url(#reachFill)" />
            <Area type="monotone" dataKey="engaged" stroke="var(--color-success)" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* The actionable half. The count is the true funnel gap; the chips are
          the sample we can name, so the two can differ without lying. */}
      {unreached.total > 0 && (
        <div className="glass-card p-4">
          <h3
            className="flex items-center gap-2"
            style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
          >
            <Building2 className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
            Still to reach · <span data-testid="unreached-total">{unreached.total}</span> accounts
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
            Named in the audience but not yet served an impression. These are where the next flight should point.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {unreached.named.map(a => (
              <span
                key={a.name}
                className="rounded-full border px-2.5 py-1 text-[12px] font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                title={`${a.industry} · ${a.employees} employees`}
              >
                {a.name}
              </span>
            ))}
            {unreached.total > unreached.named.length && (
              <span
                className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: 'var(--background-muted)', color: 'var(--color-text-muted)' }}
              >
                +{unreached.total - unreached.named.length} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* The account-by-account detail, moved here from the old Programmatic tab */}
      <AccountsSection />
    </div>
  );
}
