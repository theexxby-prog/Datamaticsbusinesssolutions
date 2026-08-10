import { FileSpreadsheet, FileText, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  ATTACHMENT_KIND_LABEL,
  REQUEST_STATUS_LABEL,
  type CampaignThreadEntry,
  type RequestStatus,
  type ThreadAttachment,
} from '../../data/campaignThread';
import { formatEntryTime, initials } from './threadFormat';

const STATUS_STYLE: Record<RequestStatus, { chip: string; Icon: typeof Clock }> = {
  open: {
    chip: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    Icon: AlertCircle,
  },
  acknowledged: {
    chip: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    Icon: Clock,
  },
  done: {
    chip: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    Icon: CheckCircle2,
  },
};

const NEXT_STATUS: Partial<Record<RequestStatus, { to: RequestStatus; label: string }>> = {
  open: { to: 'acknowledged', label: 'Acknowledge' },
  acknowledged: { to: 'done', label: 'Mark done' },
};

function AttachmentRow({ attachment }: { attachment: ThreadAttachment }) {
  const Icon = /\.(xlsx?|csv)$/i.test(attachment.name) ? FileSpreadsheet : FileText;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-tint)]">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {attachment.name}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {ATTACHMENT_KIND_LABEL[attachment.kind]}
          {attachment.version ? ` · v${attachment.version}` : ''} · {attachment.sizeLabel}
        </div>
      </div>
      <button
        type="button"
        title={`Download ${attachment.name}`}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)] active:bg-[var(--color-primary-glow)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ThreadEntryCardProps {
  entry: CampaignThreadEntry;
  /** Datamatics-side viewers can move a request along; clients cannot. */
  canResolve: boolean;
  onSetStatus: (entryId: string, status: RequestStatus) => void;
}

export function ThreadEntryCard({ entry, canResolve, onSetStatus }: ThreadEntryCardProps) {
  const isClient = entry.author.side === 'client';
  const isRequest = entry.kind === 'change_request';
  const status = entry.status ?? 'open';
  const statusStyle = STATUS_STYLE[status];
  const next = isRequest ? NEXT_STATUS[status] : undefined;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
          isClient ? 'bg-[var(--color-primary-solid)]' : 'bg-[var(--brand-gray)]'
        }`}
      >
        {initials(entry.author.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {entry.author.name}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{entry.author.jobTitle}</span>
          <span className="text-xs text-[var(--color-text-muted)]">·</span>
          <span className="text-xs text-[var(--color-text-muted)]">{formatEntryTime(entry.createdAt)}</span>

          {isRequest && (
            <span
              className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.chip}`}
            >
              <statusStyle.Icon className="h-3 w-3" />
              {REQUEST_STATUS_LABEL[status]}
            </span>
          )}
        </div>

        <div
          className={`mt-2 rounded-2xl p-4 ${
            isRequest
              ? 'border-l-4 border-l-[var(--color-primary)] bg-[var(--color-primary-tint)]'
              : 'bg-[var(--color-surface-raised)]'
          }`}
        >
          {isRequest && (
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
              Change requested
            </div>
          )}

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-primary)]">
            {entry.body}
          </p>

          {entry.attachments?.map(attachment => (
            <AttachmentRow key={attachment.id} attachment={attachment} />
          ))}

          {isRequest && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-border-light)] pt-3">
              {entry.statusLog && entry.statusLog.length > 1 && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  {REQUEST_STATUS_LABEL[entry.statusLog[entry.statusLog.length - 1].status]} by{' '}
                  {entry.statusLog[entry.statusLog.length - 1].by} ·{' '}
                  {formatEntryTime(entry.statusLog[entry.statusLog.length - 1].at)}
                </span>
              )}

              {canResolve && next && (
                <button
                  type="button"
                  onClick={() => onSetStatus(entry.id, next.to)}
                  className="ml-auto rounded-lg bg-[var(--color-primary-solid)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                >
                  {next.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
