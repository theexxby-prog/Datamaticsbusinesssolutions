import { Check, Link2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  PROPENSITY_UNLINKED, isSuggestedMatch, linkPropensityCampaign, useCampaignLinks,
  type PropensityCandidate,
} from '../../data/unionOps';

// ─── Connections panel ───────────────────────────────────────────────────────
// The linking workflow Ben asked for: the naming convention is the suggestion
// engine, never the join. Once linked (by Propensity's own id), either side
// can rename anything and nothing breaks. A name starting with our ID links
// automatically; a near-miss is suggested and ops confirms; nothing ever
// links silently on a guess. Relish needs no row here — we create Relish
// batches ourselves carrying the Pulse ID, so there's no name to reconcile.

interface ConnectionsPanelProps {
  campaignId: string;
  campaignName: string;
  /** The Pulse campaign ID (naming convention) when one exists. */
  pulseId?: string;
}

export function ConnectionsPanel({ campaignId, campaignName, pulseId }: ConnectionsPanelProps) {
  const links = useCampaignLinks();
  const link = links[campaignId];

  const candidates = PROPENSITY_UNLINKED.map(c => ({
    ...c,
    auto: pulseId ? c.name.startsWith(pulseId) : false,
    suggested: isSuggestedMatch(campaignName, c.name),
  })).sort((a, b) => Number(b.auto) - Number(a.auto) || Number(b.suggested) - Number(a.suggested));

  const doLink = (c: PropensityCandidate & { auto: boolean; suggested: boolean }) => {
    linkPropensityCampaign(campaignId, c, c.auto ? 'auto' : c.suggested ? 'suggested' : 'manual');
    toast.success(`Linked to "${c.name}" — reporting joins by their id from here on`);
  };

  return (
    <div className="glass-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <Link2 className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        Connections
      </h3>

      {/* Propensity */}
      <div className="mt-2.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--color-text-muted)' }}>
          Propensity
        </div>
        {link ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{link.propensityName}</span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{link.propensityId}</span>
            <span className="basis-full text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {link.label} · joined by their id — renames on either side can't break it
            </span>
          </div>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Not linked — pick the matching ad campaign from the client's Propensity account:
            </p>
            {candidates.map(c => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
                style={{
                  borderColor: c.auto || c.suggested ? 'var(--color-info)' : 'var(--color-border-light)',
                  background: c.auto || c.suggested ? 'var(--color-info-bg)' : 'transparent',
                }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {c.name}
                </span>
                {(c.auto || c.suggested) && (
                  <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--color-info)' }}>
                    <Sparkles className="h-3 w-3" /> {c.auto ? 'Name carries the ID' : 'Suggested match'}
                  </span>
                )}
                <button
                  onClick={() => doLink(c)}
                  className="btn-outline flex-shrink-0 px-2.5 py-1 text-xs font-semibold"
                  data-testid={`link-${c.id}`}
                >
                  Link
                </button>
              </div>
            ))}
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              A name starting with the Pulse ID links automatically; near-misses are suggested; nothing links on a guess.
            </p>
          </div>
        )}
      </div>

      {/* Convertr + Relish — stated, so the asymmetry is visible */}
      <div className="mt-3 border-t pt-2.5 text-xs" style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-muted)' }}>
        <b style={{ color: 'var(--color-text-secondary)' }}>Convertr</b> — not used for this client; delivered counts entered by ops.{' '}
        <b style={{ color: 'var(--color-text-secondary)' }}>Relish</b> — no link needed; batches carry the Pulse campaign ID from birth.
      </div>
    </div>
  );
}
