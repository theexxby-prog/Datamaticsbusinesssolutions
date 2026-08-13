import { useRef, useState } from 'react';
import { Paperclip, Send, X, AlertCircle } from 'lucide-react';
import { ATTACHMENT_KIND_LABEL, type AttachmentKind, type ThreadAttachment } from '../../data/campaignThread';

/** Guesses the document type from the filename so the picker starts sensibly. */
function inferKind(filename: string): AttachmentKind {
  const name = filename.toLowerCase();
  if (name.includes('tal') || name.includes('account_list') || name.includes('target')) return 'tal';
  if (name.includes('suppress') || name.includes('exclusion')) return 'suppression';
  if (name.includes('brief') || name.includes('scope')) return 'brief';
  if (name.includes('creative') || name.includes('asset') || name.includes('banner')) return 'creative';
  return 'other';
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

type PendingFile = Omit<ThreadAttachment, 'id' | 'version'>;

interface ThreadComposerProps {
  onComment: (body: string) => void;
  onChangeRequest: (body: string) => void;
  onAttachment: (body: string, attachment: PendingFile) => void;
}

export function ThreadComposer({ onComment, onChangeRequest, onAttachment }: ThreadComposerProps) {
  const [body, setBody] = useState('');
  const [isRequest, setIsRequest] = useState(false);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const canPost = body.trim().length > 0 || pending !== null;

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPending({ name: file.name, sizeLabel: formatSize(file.size), kind: inferKind(file.name) });
    // Allow re-picking the same file after removing it.
    event.target.value = '';
  }

  function handlePost() {
    const text = body.trim();
    if (!canPost) return;

    if (pending) {
      onAttachment(text, pending);
    } else if (isRequest) {
      onChangeRequest(text);
    } else {
      onComment(text);
    }

    setBody('');
    setPending(null);
    setIsRequest(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        placeholder={
          isRequest
            ? 'Describe the change you need — targeting, volume, schedule…'
            : 'Add a note for the campaign team…'
        }
        className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-glow)]"
      />

      {pending && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <Paperclip className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]">
            {pending.name}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{pending.sizeLabel}</span>

          <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            Type
            <select
              value={pending.kind}
              onChange={e => setPending({ ...pending, kind: e.target.value as AttachmentKind })}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-glow)]"
            >
              {(Object.keys(ATTACHMENT_KIND_LABEL) as AttachmentKind[]).map(kind => (
                <option key={kind} value={kind}>{ATTACHMENT_KIND_LABEL[kind]}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setPending(null)}
            title="Remove attachment"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={fileInput} type="file" onChange={handleFile} className="hidden" />

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <Paperclip className="h-4 w-4" />
          Attach
        </button>

        {/* A change request is a comment that cannot be lost — it carries a
            status the campaign manager has to move along. */}
        <button
          type="button"
          onClick={() => setIsRequest(v => !v)}
          disabled={pending !== null}
          aria-pressed={isRequest}
          title={pending ? 'Post the file first, then raise a request' : undefined}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40 ${
            isRequest
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-solid)] text-white hover:bg-[var(--color-primary-dark)]'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)]'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Request a change
        </button>

        <button
          type="button"
          onClick={handlePost}
          disabled={!canPost}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-solid)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {pending ? 'Upload' : isRequest ? 'Send request' : 'Post'}
        </button>
      </div>
    </div>
  );
}
