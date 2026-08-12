import { useState } from 'react';
import { Check, Clock3, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  overrideFor, saveDeliveryOverride, useDeliveryOverrides,
} from '../../data/unionOps';
import type { Campaign } from '../../data/mockClients';

// ─── Delivery & billing entry (ops) ──────────────────────────────────────────
// The successor to the old Metrics Override page, rebuilt where the work
// happens. Clients without Convertr have no automated acceptance path: the
// client reviews a delivery (sometimes against a blind suppression list we
// never see, sometimes taking days), and ops enters the final split here.
// Suppressed leads are never charged. Saving updates the client portal
// instantly — this store is what the client-facing counts read through.

interface DeliveryAcceptanceTabProps {
  campaign: Campaign;
}

const FIELD = 'input-base h-[38px] w-full px-3 text-sm';
const LABEL = 'block text-[12px] font-semibold mb-1';

export function DeliveryAcceptanceTab({ campaign }: DeliveryAcceptanceTabProps) {
  const existing = overrideFor(campaign.id, useDeliveryOverrides());

  const baseDelivered = campaign.deliveredLeads ?? campaign.delivered ?? 0;
  const om = campaign.outreachMetrics;
  const init = (ov: number | null | undefined, base: number | undefined) =>
    String(ov ?? base ?? '');

  const [emailsSent, setEmailsSent] = useState(() => init(existing?.emailsSent, om?.emailsSent));
  const [emailsOpened, setEmailsOpened] = useState(() => init(existing?.emailsOpened, om?.emailsOpened));
  const [emailsClicked, setEmailsClicked] = useState(() => init(existing?.emailsClicked, om?.emailsClicked));
  const [delivered, setDelivered] = useState(() => init(existing?.delivered, baseDelivered));
  const [accepted, setAccepted] = useState(() =>
    init(existing?.accepted, Math.round(baseDelivered * ((campaign.acceptanceRate || 100) / 100))));
  const [suppressed, setSuppressed] = useState(() => init(existing?.suppressed, 0));
  const [status, setStatus] = useState<'awaiting_client' | 'final'>(existing?.status ?? 'final');
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);

  const n = (s: string) => (s.trim() === '' ? null : Number(s));
  const vSent = n(emailsSent); const vOpened = n(emailsOpened); const vClicked = n(emailsClicked);
  const vDelivered = n(delivered); const vAccepted = n(accepted); const vSuppressed = n(suppressed);

  const errors: string[] = [];
  if (vOpened != null && vSent != null && vOpened > vSent) errors.push('Opens can’t exceed emails sent');
  if (vClicked != null && vOpened != null && vClicked > vOpened) errors.push('Clicks can’t exceed opens');
  if (vDelivered != null && vAccepted != null && vSuppressed != null && vAccepted + vSuppressed > vDelivered) {
    errors.push('Accepted + suppressed can’t exceed delivered');
  }

  const billable = vAccepted ?? vDelivered ?? baseDelivered;
  const acceptancePct = vDelivered && vAccepted != null ? Math.round((vAccepted / vDelivered) * 100) : null;

  const save = () => {
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      saveDeliveryOverride({
        campaignId: campaign.id,
        emailsSent: vSent, emailsOpened: vOpened, emailsClicked: vClicked,
        delivered: vDelivered, accepted: vAccepted, suppressed: vSuppressed,
        status, note: note.trim(),
      });
      setSaving(false);
      toast.success('Saved — the client portal now shows these numbers');
    }, 500);
  };

  return (
    <div className="space-y-4">
      <p className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
        This client isn't on Convertr, so acceptance is entered here once their review lands.
        Suppression-list rejections are part of the business — suppressed leads are never billed.
        Whatever is saved here is what the client portal shows.
      </p>

      <div>
        <h3 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
          Outreach
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="da-sent" className={LABEL} style={{ color: 'var(--color-text-primary)' }}>Emails sent</label>
            <input id="da-sent" type="number" min={0} value={emailsSent} onChange={e => setEmailsSent(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="da-opened" className={LABEL} style={{ color: 'var(--color-text-primary)' }}>Opens</label>
            <input id="da-opened" type="number" min={0} value={emailsOpened} onChange={e => setEmailsOpened(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="da-clicked" className={LABEL} style={{ color: 'var(--color-text-primary)' }}>Clicks</label>
            <input id="da-clicked" type="number" min={0} value={emailsClicked} onChange={e => setEmailsClicked(e.target.value)} className={FIELD} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
          Leads
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="da-delivered" className={LABEL} style={{ color: 'var(--color-text-primary)' }}>Delivered</label>
            <input id="da-delivered" type="number" min={0} value={delivered} onChange={e => setDelivered(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="da-accepted" className={LABEL} style={{ color: 'var(--color-text-primary)' }}>Accepted</label>
            <input id="da-accepted" type="number" min={0} value={accepted} onChange={e => setAccepted(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="da-suppressed" className={LABEL} style={{ color: 'var(--color-text-primary)' }}>Suppressed</label>
            <input id="da-suppressed" type="number" min={0} value={suppressed} onChange={e => setSuppressed(e.target.value)} className={FIELD} />
            <p className="mt-1 text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>Never billed</p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <p className="text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>{errors[0]}</p>
      )}

      {/* Derived — what billing will actually see */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
      >
        <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
          <Wallet className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          {billable ?? 0} billable leads
        </span>
        {acceptancePct != null && (
          <span className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
            {acceptancePct}% acceptance
          </span>
        )}
        {vSuppressed ? (
          <span className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
            {vSuppressed} suppressed, not charged
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="grid grid-cols-2 gap-1 rounded-xl p-1"
          style={{ background: 'var(--background-muted)' }}
          role="radiogroup"
          aria-label="Review status"
        >
          {([['awaiting_client', 'Awaiting client', Clock3], ['final', 'Final', Check]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              role="radio"
              aria-checked={status === key}
              onClick={() => setStatus(key)}
              className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                status === key ? 'bg-[var(--color-primary-solid)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Note — e.g. client checking suppression list, expected back Aug 14"
          className={`${FIELD} min-w-[200px] flex-1`}
          aria-label="Acceptance note"
        />
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          data-testid="save-acceptance"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save & update client view'}
        </button>
      </div>

      {existing && (
        <p className="text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
          Last saved {existing.updatedLabel}{existing.note ? ` · ${existing.note}` : ''}
        </p>
      )}
    </div>
  );
}
