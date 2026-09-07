// ─── Lead summary strip ──────────────────────────────────────────────────────
// One row that replaces three stacked bands on the standard Leads page: the
// automated QA card, the five flat KPI tiles and the "hot leads" banner. The
// table is the point of that page, and it used to start 520px down a 900px
// viewport. Every figure here is derived from the same filtered list the table
// renders, except the QA block, which is labelled with its own scope because
// it covers everything delivered to date rather than the rows below.

interface LeadStats {
  total: number;
  pending: number;
  hotLeads: number;
  accepted: number;
  avgScore: number;
}

interface QaSnapshot {
  totalProcessed: number;
  valid: number;
  caution: number;
  invalid: number;
}

interface LeadSummaryStripProps {
  stats: LeadStats;
  /** Omitted for clients on manual review, where there is no automated QA. */
  qa?: QaSnapshot;
  /** The old banner's "View leads" action: sort the table by score. */
  onShowHot?: () => void;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function LeadSummaryStrip({ stats, qa, onShowHot }: LeadSummaryStripProps) {
  const items: { key: string; value: number; label: string; tone?: string; onClick?: () => void }[] = [
    { key: 'total', value: stats.total, label: 'Total leads' },
    { key: 'pending', value: stats.pending, label: 'Pending review', tone: stats.pending > 0 ? 'var(--color-warning)' : undefined },
    { key: 'hot', value: stats.hotLeads, label: 'Hot, scored 90+', tone: 'var(--color-primary)', onClick: onShowHot },
    { key: 'accepted', value: stats.accepted, label: 'Accepted', tone: 'var(--color-success)' },
    { key: 'score', value: stats.avgScore, label: 'Average score' },
  ];

  const validPct = qa ? pct(qa.valid, qa.totalProcessed) : 0;
  const cautionPct = qa ? pct(qa.caution, qa.totalProcessed) : 0;
  const invalidPct = qa ? pct(qa.invalid, qa.totalProcessed) : 0;

  return (
    <div className="glass-card mb-5 flex flex-col lg:flex-row lg:items-stretch">
      <div className="grid flex-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(item => {
          const Tag = item.onClick ? 'button' : 'div';
          return (
            <Tag
              key={item.key}
              {...(item.onClick ? { type: 'button' as const, onClick: item.onClick } : {})}
              className={`flex flex-col justify-center px-4 py-3.5 text-left border-b sm:border-b-0 sm:border-r last:border-b-0 border-[var(--color-border-light)] ${
                item.onClick
                  ? 'rounded-none transition-colors hover:bg-[var(--color-primary-tint)] active:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]'
                  : ''
              }`}
            >
              <span
                className="text-xl font-bold leading-tight tabular-nums"
                style={{ color: item.tone ?? 'var(--color-text-primary)' }}
              >
                {item.value.toLocaleString()}
              </span>
              <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {item.label}
              </span>
            </Tag>
          );
        })}
      </div>

      {qa && (
        <div className="flex flex-col justify-center gap-2 border-t border-[var(--color-border-light)] px-4 py-3.5 lg:w-[300px] lg:border-t-0 lg:border-l">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-progress-track)' }}>
            <div className="h-full" style={{ width: `${validPct}%`, background: 'var(--color-success)' }} />
            <div className="h-full" style={{ width: `${cautionPct}%`, background: 'var(--color-warning)' }} />
            <div className="h-full" style={{ width: `${invalidPct}%`, background: 'var(--color-error)' }} />
          </div>
          <div className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            <span style={{ color: 'var(--color-success)' }}>{validPct}% valid</span>
            <span style={{ color: 'var(--color-text-muted)' }}> · </span>
            <span style={{ color: 'var(--color-warning)' }}>{qa.caution.toLocaleString()} caution</span>
            <span style={{ color: 'var(--color-text-muted)' }}> · </span>
            <span style={{ color: 'var(--color-error)' }}>{qa.invalid.toLocaleString()} invalid</span>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Automated QA across {qa.totalProcessed.toLocaleString()} leads delivered to date
          </div>
        </div>
      )}
    </div>
  );
}
