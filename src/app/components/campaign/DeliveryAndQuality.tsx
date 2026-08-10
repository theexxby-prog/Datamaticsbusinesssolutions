import { parseISO, format, isBefore, differenceInDays } from 'date-fns';
import { CalendarClock, ShieldCheck, Repeat } from 'lucide-react';
import type { Campaign } from '../../data/mockClients';

// ─── Delivery & QA, on one tab ───────────────────────────────────────────────
// Delivery and Quality used to be two tabs, each mostly empty. Between them
// they showed the same delivery three times: "This Week's Schedule" held a
// single card in a three-column grid, "Upcoming Deliveries" repeated that same
// delivery as the first row of a two-column grid, and the full timeline listed
// it a third time. Quality was three large tiles and a sentence occupying a
// whole tab for three numbers.
//
// This is one tab: a summary strip that answers "how often, what's next, and is
// it clean", then the timeline at full width, which is the only part with
// enough content to deserve the space.

interface DeliveryAndQualityProps {
  campaign: Campaign;
  /** Omitted when the client isn't on automated QA. */
  qa?: { totalProcessed: number; valid: number; caution: number; invalid: number };
}

function Cell({ icon: Icon, label, children }: {
  icon: typeof Repeat; label: string; children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="t-micro mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
        {label}
      </div>
      {children}
    </div>
  );
}

export function DeliveryAndQuality({ campaign, qa }: DeliveryAndQualityProps) {
  const schedule = campaign.deliverySchedule ?? [];
  const today = new Date();

  const sorted = [...schedule].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
  );
  // Nearest-term first: the next drop sits at the top rather than eighteen rows
  // down behind everything that already happened.
  const next = [...schedule]
    .filter(d => !isBefore(parseISO(d.date), today))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())[0];

  const completed = schedule.filter(d => d.status === 'completed').length;

  const daysAway = next ? differenceInDays(parseISO(next.date), today) : null;
  const whenLabel = daysAway === null ? null
    : daysAway <= 0 ? 'today'
    : daysAway === 1 ? 'tomorrow'
    : `in ${daysAway} days`;

  const pct = (n: number) => (qa && qa.totalProcessed > 0 ? Math.round((n / qa.totalProcessed) * 100) : 0);

  if (schedule.length === 0 && !qa) return null;

  return (
    <div className="space-y-4">
      {/* Summary strip — cadence, next drop, QA. One row on desktop. */}
      <div
        className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start sm:gap-8"
        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-main-bg)' }}
      >
        {campaign.deliveryDays && campaign.deliveryDays.length > 0 && (
          <Cell icon={Repeat} label="Cadence">
            <div className="t-body font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Every {campaign.deliveryDays.join(', ')}
            </div>
          </Cell>
        )}

        {next && (
          <Cell icon={CalendarClock} label="Next delivery">
            <div className="t-body font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {format(parseISO(next.date), 'EEE, MMM d')} · {next.leadsDelivered.toLocaleString()} leads
            </div>
            {whenLabel && <div className="t-meta mt-0.5">{whenLabel}</div>}
          </Cell>
        )}

        {qa && (
          <Cell icon={ShieldCheck} label="Automated QA">
            <div className="t-body flex flex-wrap items-baseline gap-x-3">
              <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
                {qa.valid.toLocaleString()} valid
              </span>
              {qa.caution > 0 && (
                <span style={{ color: 'var(--color-warning)' }}>{qa.caution} caution</span>
              )}
              {qa.invalid > 0 && (
                <span style={{ color: 'var(--color-error)' }}>{qa.invalid} invalid</span>
              )}
            </div>
            {/* The bar carries the proportion so the three counts don't each
                need a percentage spelled out beside them. */}
            <div className="mt-1.5 flex h-1.5 w-full max-w-[260px] overflow-hidden rounded-full" style={{ background: 'var(--color-progress-track)' }}>
              <div style={{ width: `${pct(qa.valid)}%`, background: 'var(--color-success)' }} />
              <div style={{ width: `${pct(qa.caution)}%`, background: 'var(--color-warning)' }} />
              <div style={{ width: `${pct(qa.invalid)}%`, background: 'var(--color-error)' }} />
            </div>
            <div className="t-meta mt-1">
              {pct(qa.valid)}% valid · delivered to your CRM in real time
            </div>
          </Cell>
        )}
      </div>

      {/* Timeline — the one part with enough content to earn the width. */}
      {schedule.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="t-title">Delivery timeline</h3>
            <span className="t-meta t-num">{completed} of {schedule.length} delivered</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {sorted.map(delivery => {
              const date = parseISO(delivery.date);
              const isCompleted = delivery.status === 'completed';
              const isPast = isBefore(date, today);
              return (
                <div
                  key={delivery.date}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-primary-tint)]"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      background: isCompleted
                        ? 'var(--color-success)'
                        : isPast ? 'var(--color-text-muted)' : 'var(--color-progress)',
                    }}
                  />
                  <span className="t-body min-w-0 flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {format(date, 'EEE, MMM d, yyyy')}
                  </span>
                  <span className="t-body t-num flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                    {delivery.leadsDelivered.toLocaleString()}
                  </span>
                  <span
                    className="t-meta w-[74px] flex-shrink-0 text-right"
                    style={{ color: isCompleted ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                  >
                    {isCompleted ? 'Delivered' : 'Scheduled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
