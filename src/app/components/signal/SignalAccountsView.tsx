import { useNavigate } from 'react-router';
import { Users, AlertOctagon } from 'lucide-react';
import { getAccountsByReadiness, getSynthesis, getSignalContact } from '../../data/signalRoom';
import { IntentChip } from './signalMeta';

// Accounts lens over the enriched dataset: readiness-ranked cards, each
// showing the committee depth, top contact's intent, and any coverage gap.

export function SignalAccountsView() {
  const navigate = useNavigate();
  const ranked = getAccountsByReadiness();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ranked.map(({ account, insight }) => {
        const topContact = getSignalContact(account.contactIds[0]);
        const topSynth = topContact ? getSynthesis(topContact.id) : undefined;
        return (
          <button
            key={account.slug}
            onClick={() => navigate(`/leads/account/${account.slug}`)}
            className="glass-card flex flex-col p-4 text-left transition-all hover:shadow-lg active:opacity-90"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{account.name}</h3>
                <p className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{account.industry}</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="text-xl font-extrabold leading-none" style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {insight.readiness}
                </div>
                <div className="text-[9px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Ready</div>
              </div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
              <div className="h-full rounded-full" style={{ width: `${insight.readiness}%`, background: 'var(--color-primary)' }} />
            </div>

            <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {insight.readinessNote}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                <Users className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {account.contactIds.length === 1 ? 'Sole contact' : `${account.contactIds.length} on committee`}
              </span>
              {topSynth && <IntentChip type={topSynth.intentType} />}
              {insight.gaps.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--color-warning)' }}>
                  <AlertOctagon className="h-3.5 w-3.5" />
                  {insight.gaps.length} gap{insight.gaps.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
