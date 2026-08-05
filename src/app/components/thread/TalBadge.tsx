import { FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useCampaignThread } from '../../context/CampaignThreadContext';
import { useUnionLens } from '../../hooks/useUnionLens';
import { formatDate } from '../../utils/formatDate';

/**
 * The live target account list, named on the campaign header.
 *
 * Mid-campaign the only question anyone actually needs answered is *which TAL
 * are we running against right now*. A file sitting in a shared folder never
 * answered it; neither does one buried in a thread. Uploading a new list bumps
 * the version, and this is where the answer lives.
 */
export function TalBadge({ campaignId }: { campaignId: string }) {
  const { latestTalFor, openRequestsFor } = useCampaignThread();
  const lens = useUnionLens();
  const tal = lens(latestTalFor(campaignId));
  const openRequests = openRequestsFor(campaignId);

  if (!tal && openRequests === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tal && (
        <span
          title={`${tal.attachment.name} — uploaded by ${tal.entry.author.name}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          <span className="font-semibold text-[var(--color-text-primary)]">
            TAL v{tal.attachment.version}
          </span>
          <span className="text-[var(--color-text-muted)]">
            · {formatDate(tal.entry.createdAt.slice(0, 10))} · {tal.entry.author.name.split(' ')[0]}
          </span>
        </span>
      )}

      {openRequests > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-warning)]">
          <AlertCircle className="h-3.5 w-3.5" />
          {openRequests} open {openRequests === 1 ? 'request' : 'requests'}
        </span>
      )}
    </div>
  );
}
