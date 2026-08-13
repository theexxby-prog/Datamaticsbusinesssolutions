import { useNavigate } from 'react-router';
import { getTriggerTimeline } from '../../data/signalRoom';
import { fmtSignalDate } from './signalMeta';

// Signals lens: every dated trigger event across the enriched accounts,
// newest first, grouped by month — the "why now" raw material.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function SignalTimelineView({ limit }: { limit?: number }) {
  const navigate = useNavigate();
  const items = getTriggerTimeline().slice(0, limit);

  let lastMonth = '';
  return (
    <div className="space-y-2.5">
      {items.map(item => {
        const monthKey = item.date.slice(0, 7);
        const showMonth = monthKey !== lastMonth;
        lastMonth = monthKey;
        return (
          <div key={`${item.account.slug}-${item.date}-${item.text.slice(0, 24)}`}>
            {showMonth && (
              <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.1em] first:mt-0" style={{ color: 'var(--color-text-muted)' }}>
                {MONTHS[Number(monthKey.slice(5, 7)) - 1]} {monthKey.slice(0, 4)}
              </div>
            )}
            <div className="glass-card flex items-start gap-3 p-3.5">
              <span className="mt-0.5 w-[74px] flex-shrink-0 text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtSignalDate(item.date).replace(/, \d{4}$/, '')}
              </span>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {item.kind && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
                    >
                      {item.kind}
                    </span>
                  )}
                  <button
                    onClick={() => navigate(`/leads/account/${item.account.slug}`)}
                    className="text-[13px] font-bold hover:text-[var(--color-primary)]"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.account.name}
                  </button>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.text}
                  {item.source && (
                    <span className="ml-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>[{item.source}]</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
