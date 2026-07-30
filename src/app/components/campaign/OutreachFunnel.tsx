interface OutreachMetrics {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: number;
  clickRate: number;
}

interface OutreachFunnelProps {
  metrics: OutreachMetrics;
  deliveredLeads: number;
}

/** Lifted out of CampaignDetailGlass, which was carrying ~130 lines of it inline. */
export function OutreachFunnel({ metrics, deliveredLeads }: OutreachFunnelProps) {
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  const leadRate = pct(deliveredLeads, metrics.emailsSent);

  const stages = [
    {
      label: 'Emails Sent',
      count: metrics.emailsSent,
      width: 100,
      gradient: 'from-blue-500 to-indigo-500',
      rate: null as number | null,
      rateColor: '',
    },
    {
      label: 'Opened Emails',
      count: metrics.emailsOpened,
      width: metrics.openRate,
      gradient: 'from-indigo-400 to-purple-500',
      rate: metrics.openRate,
      rateColor: 'var(--color-accent-purple)',
    },
    {
      label: 'Clicks (CTR)',
      count: metrics.emailsClicked,
      width: Math.min(100, metrics.clickRate * 5),
      gradient: 'from-emerald-400 to-teal-500',
      rate: metrics.clickRate,
      rateColor: 'var(--color-success)',
    },
    {
      label: 'Delivered Leads',
      count: deliveredLeads,
      width: Math.max(2, leadRate),
      gradient: 'from-[var(--color-primary)] to-[var(--brand-red-light)]',
      rate: leadRate,
      rateColor: 'var(--color-primary)',
    },
  ];

  const ratios = [
    { label: 'CTOR', value: `${pct(metrics.emailsClicked, metrics.emailsOpened)}%`, note: 'Excellent', noteColor: 'var(--color-success)' },
    { label: 'Open to Lead', value: `${pct(deliveredLeads, metrics.emailsOpened)}%`, note: 'Conversion', noteColor: 'var(--color-text-secondary)' },
    { label: 'Click to Lead', value: `${pct(deliveredLeads, metrics.emailsClicked)}%`, note: 'Action Rate', noteColor: 'var(--color-text-secondary)' },
    { label: 'Bounce Rate', value: '0.8%', note: 'Healthy (<2%)', noteColor: 'var(--color-success)' },
  ];

  return (
    <div>
      <div className="space-y-3.5">
        {stages.map(stage => (
          <div key={stage.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {stage.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {stage.count.toLocaleString()}
                </span>
                {stage.rate !== null && (
                  <span className="text-sm font-bold" style={{ color: stage.rateColor }}>
                    {stage.rate}%
                  </span>
                )}
              </div>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full border border-[var(--border)]"
              style={{ background: 'var(--background-muted)' }}
            >
              <div className={`h-full rounded-full bg-gradient-to-r ${stage.gradient}`} style={{ width: `${stage.width}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-4">
        {ratios.map(ratio => (
          <div
            key={ratio.label}
            className="rounded-xl border border-[var(--border)] p-2.5 text-center"
            style={{ background: 'var(--background-muted)' }}
          >
            <div
              className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {ratio.label}
            </div>
            <div className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {ratio.value}
            </div>
            <div className="mt-0.5 text-[9px] font-semibold" style={{ color: ratio.noteColor }}>
              {ratio.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
