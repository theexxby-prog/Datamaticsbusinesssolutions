import { useNavigate } from 'react-router';
import {
  Users, Layers, TrendingUp, Sparkles, Gauge, Radar, ArrowRight, AlertOctagon,
  ListOrdered, FileBarChart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { allClients } from '../data/mockClients';
import {
  signalMeta, signalContacts, getSynthesis, getAccountsByReadiness, getIntentMix,
  getSignalContact, signalLeadId,
} from '../data/signalRoom';
import { getBlendedSpend } from '../data/propensity';
import { INTENT_META } from '../components/signal/signalMeta';
import { SignalTimelineView } from '../components/signal/SignalTimelineView';

// ─── UNION dashboard ─────────────────────────────────────────────────────────
// The reimagined client dashboard for the preview login: compact and
// data-rich. One greeting line, a six-stat strip, then the intelligence that
// matters — account readiness, intent mix, fresh signals, and the next best
// actions — all tap-through to the deeper surfaces.

export default function UnionDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const client = allClients.find(c => c.id === 'client_1');
  const activeCampaigns = client?.campaigns.filter(c => c.status === 'active').length ?? 0;
  const leadsThisMonth = client?.leadsThisMonth ?? 0;

  const blended = getBlendedSpend();
  const blendedRoi = blended[blended.length - 1]?.blendedRoi ?? 0;

  const scores = signalContacts.map(c => getSynthesis(c.id)?.intentScore ?? c.signalScore);
  const avgIntent = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  const ranked = getAccountsByReadiness();
  const readyAccounts = ranked.filter(x => x.insight.readiness >= 70).length;
  const intentMix = getIntentMix();
  const mixTotal = intentMix.reduce((s, m) => s + m.count, 0);

  // Next best actions: step 1 of the engagement sequence at the three
  // readiest accounts.
  const nextActions = ranked
    .slice(0, 3)
    .map(({ account, insight }) => {
      const step = insight.sequence[0];
      const person = step ? getSignalContact(step.contactId) : undefined;
      return person && step ? { account, person, why: step.why } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const stats = [
    { icon: Users, value: leadsThisMonth.toLocaleString('en-US'), label: 'Leads this month' },
    { icon: Layers, value: String(activeCampaigns), label: 'Active campaigns' },
    { icon: TrendingUp, value: `${blendedRoi}×`, label: 'Blended ROI' },
    { icon: Sparkles, value: `${signalMeta.rows}`, label: `Enriched of ${signalMeta.sampleOf}` },
    { icon: Gauge, value: String(avgIntent), label: 'Avg intent score' },
    { icon: AlertOctagon, value: String(readyAccounts), label: 'Accounts ready (70+)' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto page-content space-y-5">
      {/* Compact greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 select-none items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)' }}
          >
            {currentUser?.name?.slice(0, 1) ?? 'U'}
          </div>
          <div>
            <div className="text-[17px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {greeting}, {currentUser?.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {currentUser?.company} · {today} · {signalMeta.campaign}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/programmatic')}
          className="btn-outline inline-flex min-h-[38px] items-center gap-1.5 px-3.5 text-sm font-semibold"
        >
          <Radar className="h-4 w-4" /> Programmatic ABM
        </button>
      </div>

      {/* Six-stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 stagger-children">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="kpi-card animate-slideInUp" style={{ padding: '12px' }}>
              <div className="mb-1 flex items-center justify-between">
                <Icon className="kpi-card__icon" style={{ width: '15px', height: '15px' }} />
              </div>
              <div className="kpi-card__number" style={{ fontSize: '20px', marginBottom: '2px' }}>{stat.value}</div>
              <div className="kpi-card__label" style={{ fontSize: '10.5px' }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: account readiness + intent mix */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <Gauge className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Accounts by readiness
              </h3>
              <button onClick={() => navigate('/leads')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                All accounts <ArrowRight className="ml-0.5 inline h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1">
              {ranked.slice(0, 6).map(({ account, insight }) => (
                <button
                  key={account.slug}
                  onClick={() => navigate(`/leads/account/${account.slug}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {account.name}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {account.contactIds.length === 1 ? 'Sole contact' : `${account.contactIds.length} on committee`}
                      {insight.gaps.length > 0 ? ` · ${insight.gaps.length} gap${insight.gaps.length > 1 ? 's' : ''}` : ''}
                    </span>
                  </span>
                  <span className="h-1.5 w-24 flex-shrink-0 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                    <span className="block h-full rounded-full" style={{ width: `${insight.readiness}%`, background: 'var(--color-primary)' }} />
                  </span>
                  <span className="w-8 flex-shrink-0 text-right text-sm font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {insight.readiness}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Intent mix — {mixTotal} enriched contacts
            </h3>
            <div className="space-y-2">
              {intentMix.map(mix => {
                const meta = INTENT_META[mix.type];
                return (
                  <div key={mix.type} className="flex items-center gap-3">
                    <span className="w-[128px] flex-shrink-0 truncate text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      {meta.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                      <span className="block h-full rounded-full" style={{ width: `${(mix.count / mixTotal) * 100}%`, background: meta.color }} />
                    </span>
                    <span className="w-5 flex-shrink-0 text-right text-xs font-bold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {mix.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <ListOrdered className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Next best actions
            </h3>
            <div className="space-y-2">
              {nextActions.map((action, index) => (
                <button
                  key={action.person.id}
                  onClick={() => navigate(`/leads/${signalLeadId(action.person.id)}`)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {action.person.name}
                      <span className="ml-1.5 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{action.account.name}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {action.why}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: fresh signals */}
        <div className="glass-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <FileBarChart className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Fresh signals
            </h3>
            <button onClick={() => navigate('/leads')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Full timeline <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <SignalTimelineView limit={7} />
        </div>
      </div>
    </div>
  );
}
