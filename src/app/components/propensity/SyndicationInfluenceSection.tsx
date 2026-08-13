import { useNavigate } from 'react-router';
import { Link2, Users, Building2, Flame } from 'lucide-react';
import { getSyndicationInfluence } from '../../data/propensity';
import { getPeopleReached } from '../../data/outcomes';
import { formatMoney as fmtMoney } from '../../utils/format';

// The crosswalk pay-off: leads your syndication campaigns delivered, matched
// into ABM target accounts, and how many of those accounts are now engaging
// with the programmatic layer.

export function SyndicationInfluenceSection() {
  const navigate = useNavigate();
  const influence = getSyndicationInfluence();
  // Propensity reports impressions, not unique people — the reach conversion
  // lives in data/outcomes so the dashboard tile and this line always agree.
  const peopleReached = getPeopleReached();

  const steps = [
    { icon: Users, label: 'Syndication leads delivered', value: influence.syndicationLeads, pct: 100 },
    {
      icon: Building2,
      label: 'Accounts matched in ABM audience',
      value: influence.matchedAccounts,
      pct: Math.round((influence.matchedAccounts / influence.syndicationLeads) * 100),
    },
    {
      icon: Flame,
      label: 'Accounts now engaging with ads',
      value: influence.engagedAccounts,
      pct: Math.round((influence.engagedAccounts / influence.syndicationLeads) * 100),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Funnel: three stat rows with shrinking bars */}
      <div className="glass-card p-5">
        <h3
          className="mb-1 flex items-center gap-2"
          style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
        >
          <Link2 className="h-4 w-4" />
          From syndication lead to engaged account
        </h3>
        <p className="mb-5" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Your content-syndication leads, followed into the Propensity ABM layer via the campaign crosswalk
        </p>

        <div className="space-y-4">
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <div key={step.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    <Icon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    {step.label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {step.value}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(step.pct, 4)}%`, background: 'var(--color-progress)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Blended ROI was removed from the client render (methodology under
            review); people reached takes its place beside pipeline value. */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span>
            Attributed pipeline value:{' '}
            <span className="font-bold" style={{ color: 'var(--color-success)' }}>{fmtMoney(influence.pipelineValue)}</span>
          </span>
          <span>
            People reached:{' '}
            <span className="font-bold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {peopleReached.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      {/* Per-campaign crosswalk */}
      <div className="glass-card overflow-hidden">
        <div className="border-b p-4" style={{ borderColor: 'var(--color-border-light)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            Campaign crosswalk
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Which ABM air cover supports which syndication program
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
          {influence.perCampaign.map(row => (
            <button
              key={row.syndicationCampaignId}
              onClick={() => navigate(`/campaigns/${row.syndicationCampaignId}`)}
              className="flex w-full flex-col gap-1 p-4 text-left transition-colors hover:bg-[var(--color-primary-tint)] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {row.syndicationCampaignName}
                </span>
                <span className="block truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  ABM: {row.abmCampaignName}
                </span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-4 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{row.leads}</span> leads
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{row.engagedAccounts}</span> engaged
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
