import { Radar, Layers, Wallet, TrendingUp, Building2, FileImage, GitMerge, Link2, Users } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { PropensityTabs } from '../components/propensity/PropensityTabs';
import { ExecutiveOverviewSection } from '../components/propensity/ExecutiveOverviewSection';
import { AccountsSection } from '../components/propensity/AccountsSection';
import { AssetsSection } from '../components/propensity/AssetsSection';
import { SpendChannelsSection } from '../components/propensity/SpendChannelsSection';
import { SyndicationInfluenceSection } from '../components/propensity/SyndicationInfluenceSection';
import { getAbmSummary, getBlendedSpend, PROPENSITY_SYNC_LABEL } from '../data/propensity';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Programmatic ABM ────────────────────────────────────────────────────────
// Client-facing preview of the Propensity integration: mock data shaped like
// the ten read-only reporting endpoints, presented as the dashboards the
// production epics describe. Visible only to the UNION preview login (see
// config/demo.ts showFutureModules; AppLayout enforces the route).

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export default function ProgrammaticPage() {
  useDocumentTitle('Programmatic');

  const campaigns = getAbmSummary();
  const blended = getBlendedSpend();

  const active = campaigns.filter(c => c.status === 'active').length;
  const spend = campaigns.reduce((s, c) => s + c.spendToDate, 0);
  const engaged = campaigns.reduce((s, c) => s + c.engagedAccounts, 0);
  const latestRoi = blended[blended.length - 1]?.blendedRoi ?? 0;

  const kpis = [
    { icon: Layers, value: String(active), label: 'Active ABM campaigns', foot: 'all pacing to plan' },
    { icon: Wallet, value: fmtMoney(spend), label: 'Media spend to date', foot: 'across PDN channels' },
    { icon: Building2, value: String(engaged), label: 'Accounts engaged', foot: 'of 295 targeted' },
    { icon: TrendingUp, value: `${latestRoi}×`, label: 'Blended ROI', foot: 'PDN + syndication' },
  ];

  return (
    <div className="max-w-[1120px] mx-auto page-content">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-primary-tint)' }}
          >
            <Radar className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          </span>
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              Programmatic ABM
            </h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Powered by Propensity · {PROPENSITY_SYNC_LABEL}
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-[70ch]" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Display advertising that warms your target accounts while content syndication captures them. Every ABM campaign
          here is linked to one of your syndication programs, so engagement, spend and ROI read as one story.
        </p>
      </div>

      {/* KPI band — always visible above the tabs */}
      <Reveal>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 stagger-children">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="kpi-card animate-slideInUp" style={{ padding: '14px' }}>
                <div className="mb-1 flex items-center justify-between">
                  <Icon className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
                </div>
                <div className="kpi-card__number" style={{ fontSize: '22px', marginBottom: '2px' }}>{kpi.value}</div>
                <div className="kpi-card__label" style={{ fontSize: '11px' }}>{kpi.label}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{kpi.foot}</div>
              </div>
            );
          })}
        </div>
      </Reveal>

      <PropensityTabs
        tabs={[
          { key: 'overview', label: 'Overview', Icon: TrendingUp, content: <ExecutiveOverviewSection /> },
          { key: 'accounts', label: 'Accounts', Icon: Building2, content: <AccountsSection /> },
          { key: 'assets', label: 'Assets', Icon: FileImage, content: <AssetsSection /> },
          { key: 'spend', label: 'Spend & Channels', Icon: GitMerge, content: <SpendChannelsSection /> },
          { key: 'influence', label: 'Syndication Influence', Icon: Link2, content: <SyndicationInfluenceSection /> },
        ]}
      />

      {/* Contact-level engagement note — Contact Engagement endpoint feeds the
          Leads page directly; keep this page account-level. */}
      <p className="mt-6 flex items-center gap-1.5" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        <Users className="h-3.5 w-3.5" />
        Contact-level engagement from Propensity appears on each lead in the Leads module.
      </p>
    </div>
  );
}
