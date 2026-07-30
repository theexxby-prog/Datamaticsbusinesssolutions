import { CheckCircle2, Loader2, CircleDashed, AlertTriangle } from 'lucide-react';
import type { IntegrationSyncStatus } from '../../types';

interface IntegrationChipProps {
  /** e.g. "Salesforce", "Tally", "DocuSign" */
  system: string;
  status: IntegrationSyncStatus;
  /** Optional detail shown after the system name, e.g. an opportunity / voucher id. */
  detail?: string;
  /** Error message rendered as a title tooltip when status === 'failed'. */
  error?: string;
}

const statusConfig: Record<IntegrationSyncStatus, { icon: React.ElementType; color: string; bg: string; label: string; spin?: boolean }> = {
  not_synced: { icon: CircleDashed, color: 'var(--color-text-muted)', bg: 'var(--color-border-light)', label: 'Not synced' },
  syncing: { icon: Loader2, color: 'var(--color-warning)', bg: 'rgba(217,119,6,0.1)', label: 'Syncing', spin: true },
  synced: { icon: CheckCircle2, color: 'var(--color-success, var(--color-success))', bg: 'var(--color-success-bg, rgba(15,157,88,0.1))', label: 'Synced' },
  failed: { icon: AlertTriangle, color: 'var(--color-error)', bg: 'rgba(220,38,38,0.1)', label: 'Failed' },
};

/** Small chip communicating the sync state of an external system. */
export function IntegrationChip({ system, status, detail, error }: IntegrationChipProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, fontSize: '11px', fontWeight: 500, color: cfg.color }}
      title={status === 'failed' && error ? error : `${system}: ${cfg.label}${detail ? ` · ${detail}` : ''}`}
    >
      <Icon className={`w-3 h-3 ${cfg.spin ? 'animate-spin' : ''}`} />
      {system}
      {detail && status === 'synced' && (
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{detail}</span>
      )}
      {status !== 'synced' && <span style={{ fontWeight: 400 }}>· {cfg.label}</span>}
    </span>
  );
}
