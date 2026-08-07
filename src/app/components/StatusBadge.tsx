import { CampaignStatus } from '../types';

interface StatusBadgeProps {
  status: CampaignStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // The remaining rgba() borders below are known literal duplicates of their
  // status tokens (success/warning/error/accent-purple). Those tokens do not
  // change per brand, so they are left for a separate tokenization pass.
  const statusStyles: Record<string, string> = {
    'Completed':          'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[rgba(5,150,105,0.2)]',
    'In progress':        'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[color-mix(in_srgb,var(--color-info)_20%,transparent)]',
    'Not started':        'bg-[var(--color-accent-purple-bg)] text-[var(--color-accent-purple)] border border-[rgba(124,58,237,0.2)]',
    'Paused':             'bg-[var(--color-accent-purple-bg)] text-[var(--color-accent-purple)] border border-[rgba(124,58,237,0.2)]',
    'Cancelled':          'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[rgba(220,38,38,0.2)]',
    'Accepted':           'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[rgba(5,150,105,0.2)]',
    'Approved':           'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[rgba(5,150,105,0.2)]',
    'Pending':            'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[rgba(217,119,6,0.2)]',
    'Under review':       'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[rgba(217,119,6,0.2)]',
    'Pending Approval':   'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[rgba(194,65,12,0.25)]',
    'Changes Requested':  'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[rgba(180,83,9,0.25)]',
    'Rejected':           'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[rgba(220,38,38,0.2)]',
    'Declined':           'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[rgba(220,38,38,0.2)]',
    'Overdue':            'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[rgba(220,38,38,0.2)]',
  };

  const style = statusStyles[status] ?? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[rgba(107,114,128,0.2)]';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}