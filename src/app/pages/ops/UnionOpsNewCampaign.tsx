import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Building2, Check, ChevronDown, CloudCog, FileText, Layers,
  Loader2, Plus, Radio, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CAMPAIGN_TYPES_META, createCampaign, mintCampaignId, slugForClient, clientIdFor,
  type CampaignTypeCode,
} from '../../data/unionOps';
import { UNION_COMPANY } from '../../data/unionClient';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// ─── UNION OPS · campaign initiation ─────────────────────────────────────────
// Campaigns are born here. Pulse mints the campaign ID at save — the naming
// convention {CLIENT}-{TYPE}-{YYYYMM}-{SEQ} — because Salesforce cannot:
// clients on a master service agreement never get a per-campaign opportunity.
// The optional Salesforce fields tie the record back when an OLI does exist.
// Ops-only: the client login never sees this screen.

const KNOWN_CLIENTS = [
  UNION_COMPANY,
  'Acme Analytics',
  'Beacon Health Systems',
  'Cirrus Networks',
  'Fairhaven Financial',
  'Orbital Media Group',
];

const TYPE_ICONS: Record<CampaignTypeCode, typeof FileText> = {
  CS: FileText,
  SA: Users,
  SS: Layers,
  PG: Radio,
};

const FIELD_LABEL = 'block text-[12.5px] font-semibold mb-1.5';
const INPUT = 'input-base h-[38px] w-full px-3 text-sm';

export default function UnionOpsNewCampaign() {
  useDocumentTitle('New Campaign');
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [client, setClient] = useState(UNION_COMPANY);
  const [clientOpen, setClientOpen] = useState(false);
  const [type, setType] = useState<CampaignTypeCode | null>(null);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [targetLeads, setTargetLeads] = useState('');
  const [targetImpressions, setTargetImpressions] = useState('');
  const [sfOpp, setSfOpp] = useState('');
  const [sfOli, setSfOli] = useState('');
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const typeMeta = CAMPAIGN_TYPES_META.find(t => t.code === type) ?? null;

  const clientMatches = useMemo(() => {
    const q = client.trim().toLowerCase();
    return KNOWN_CLIENTS.filter(c => c.toLowerCase().includes(q));
  }, [client]);
  const isNewClient = client.trim().length > 0
    && !KNOWN_CLIENTS.some(c => c.toLowerCase() === client.trim().toLowerCase());

  // The ID assembles live so ops sees what will be minted before saving.
  const slug = client.trim() ? slugForClient(client.trim()) : null;
  const month = startDate ? startDate.slice(0, 7).replace('-', '') : null;
  const previewId = slug && type && month ? mintCampaignId(slug, type, startDate) : null;
  const idParts = [slug ?? '—', type ?? '——', month ?? '———', previewId ? previewId.slice(-3) : '···'];

  const dateOrderOk = !startDate || !endDate || startDate <= endDate;
  const valid = name.trim().length > 0 && client.trim().length > 0 && type !== null
    && !!startDate && !!endDate && dateOrderOk;

  const save = () => {
    if (!valid || !typeMeta) {
      setShowErrors(true);
      toast.error('Fix the highlighted fields');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      const record = createCampaign({
        name: name.trim(),
        clientName: client.trim(),
        type: typeMeta.code,
        startDate,
        endDate,
        targetLeads: typeMeta.takesLeads && targetLeads ? Number(targetLeads) : null,
        targetImpressions: typeMeta.takesImpressions && targetImpressions ? Number(targetImpressions) : null,
        sfOpportunityId: sfOpp.trim() || null,
        sfOpportunityLineItemId: sfOli.trim() || null,
      });
      toast.success(`${record.id} created — ${record.name}`);
      navigate('/ops-union');
    }, 700);
  };

  const err = (bad: boolean) => showErrors && bad;

  return (
    <div className="mx-auto max-w-[1140px] page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate('/ops-union')}
          className="btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Pipeline
        </button>
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Ops only — clients never see campaign creation
        </span>
      </div>

      <div>
        <h1 className="text-[24px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          New campaign
        </h1>
        <p className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
          Pulse mints the campaign ID — the one key every system carries, from lead uploads to Propensity and Relish.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Form column ── */}
        <div className="space-y-4">
          <div className="glass-card space-y-4 p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              1 · Campaign &amp; client
            </h2>

            <div>
              <label htmlFor="nc-name" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>
                Campaign name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="nc-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Q4 enterprise security push"
                className={INPUT}
                aria-invalid={err(!name.trim())}
              />
              {err(!name.trim()) && (
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>Enter a campaign name</p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="nc-client" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>
                Client <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <div className="relative">
                <input
                  id="nc-client"
                  ref={clientInputRef}
                  type="text"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={clientOpen}
                  aria-controls="nc-client-list"
                  value={client}
                  onChange={e => { setClient(e.target.value); setClientOpen(true); }}
                  onFocus={() => setClientOpen(true)}
                  onBlur={() => window.setTimeout(() => setClientOpen(false), 120)}
                  placeholder="Search or enter a client name"
                  className={`${INPUT} pr-9`}
                  aria-invalid={err(!client.trim())}
                />
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </div>
              {clientOpen && (
                <div
                  id="nc-client-list"
                  role="listbox"
                  className="absolute inset-x-0 top-full z-20 mt-1 max-h-[210px] overflow-y-auto rounded-xl border shadow-lg"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                >
                  {isNewClient && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={e => { e.preventDefault(); setClientOpen(false); clientInputRef.current?.blur(); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--color-primary-tint)]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <Plus className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                      Create "{client.trim()}" · slug {slugForClient(client.trim())}
                    </button>
                  )}
                  {clientMatches.map(c => (
                    <button
                      key={c}
                      type="button"
                      role="option"
                      aria-selected={c === client}
                      onMouseDown={e => { e.preventDefault(); setClient(c); setClientOpen(false); clientInputRef.current?.blur(); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--color-primary-tint)]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                      {c}
                      <span className="ml-auto text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{slugForClient(c)}</span>
                    </button>
                  ))}
                  {!isNewClient && clientMatches.length === 0 && (
                    <div className="px-3 py-2 text-[12.5px]" style={{ color: 'var(--color-text-muted)' }}>No clients match</div>
                  )}
                </div>
              )}
              <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
                Pick an existing client or type a new name — its slug is minted once and never reused
              </p>
            </div>
          </div>

          <div className="glass-card space-y-3 p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              2 · Campaign type
            </h2>
            <div role="radiogroup" aria-label="Campaign type" className="grid gap-2 sm:grid-cols-2">
              {CAMPAIGN_TYPES_META.map(t => {
                const Icon = TYPE_ICONS[t.code];
                const on = type === t.code;
                return (
                  <button
                    key={t.code}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setType(t.code)}
                    className="flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors hover:border-[var(--color-primary)]"
                    style={{
                      borderColor: on ? 'var(--color-primary)' : 'var(--color-border)',
                      background: on ? 'var(--color-primary-tint)' : 'transparent',
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: on ? 'var(--color-primary-solid)' : 'var(--color-primary-tint)' }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: on ? '#FFFFFF' : 'var(--color-primary)' }} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {t.label}
                        <span
                          className="rounded px-1 py-px font-mono text-[10px] font-bold"
                          style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
                        >
                          {t.code}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                        {t.blurb}
                      </span>
                    </span>
                    {on && <Check className="ml-auto h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />}
                  </button>
                );
              })}
            </div>
            {err(!type) && (
              <p className="text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>Choose a campaign type</p>
            )}
          </div>

          <div className="glass-card space-y-4 p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              3 · Schedule &amp; targets
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="nc-start" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>
                  Start date <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input id="nc-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label htmlFor="nc-end" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>
                  End date <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input id="nc-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={INPUT} aria-invalid={err(!dateOrderOk)} />
                {err(!dateOrderOk) && (
                  <p className="mt-1.5 text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>End date is before the start date</p>
                )}
              </div>
              <div>
                <label htmlFor="nc-leads" className={FIELD_LABEL} style={{ color: typeMeta && !typeMeta.takesLeads ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                  Lead target
                </label>
                <input
                  id="nc-leads"
                  type="number"
                  min={0}
                  step={1}
                  value={targetLeads}
                  onChange={e => setTargetLeads(e.target.value)}
                  placeholder="250"
                  disabled={!!typeMeta && !typeMeta.takesLeads}
                  className={`${INPUT} disabled:opacity-50`}
                />
                {typeMeta && !typeMeta.takesLeads && (
                  <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
                    Programmatic campaigns deliver impressions, not a lead count
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="nc-imps" className={FIELD_LABEL} style={{ color: typeMeta && !typeMeta.takesImpressions ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                  Impressions target
                </label>
                <input
                  id="nc-imps"
                  type="number"
                  min={0}
                  step={1000}
                  value={targetImpressions}
                  onChange={e => setTargetImpressions(e.target.value)}
                  placeholder="1,000,000"
                  disabled={!typeMeta || !typeMeta.takesImpressions}
                  className={`${INPUT} disabled:opacity-50`}
                />
                <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
                  {typeMeta?.takesImpressions
                    ? `Enabled for ${typeMeta.label.toLowerCase()}`
                    : 'For social activation, short stack and programmatic'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card space-y-3 p-4">
            <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              <CloudCog className="h-4 w-4" /> 4 · Salesforce (optional)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="nc-opp" className={FIELD_LABEL} style={{ color: 'var(--color-text-secondary)' }}>Opportunity</label>
                <input id="nc-opp" type="text" value={sfOpp} onChange={e => setSfOpp(e.target.value)} placeholder="0064x000ABc1DeF" className={INPUT} />
              </div>
              <div>
                <label htmlFor="nc-oli" className={FIELD_LABEL} style={{ color: 'var(--color-text-secondary)' }}>Opportunity line item</label>
                <input id="nc-oli" type="text" value={sfOli} onChange={e => setSfOli(e.target.value)} placeholder="00k4x000GHi2JkL" className={INPUT} />
              </div>
            </div>
            <p className="text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
              Clients on a master service agreement won't have one per campaign — leave blank and the campaign ID stands alone
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pb-2">
            <button onClick={() => navigate('/ops-union')} className="btn-outline px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
              data-testid="create-campaign"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                : <><Plus className="h-4 w-4" /> Create campaign</>}
            </button>
          </div>
        </div>

        {/* ── Summary rail ── */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="glass-card p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              Campaign ID
            </h2>
            <p
              className="mt-2 break-all font-mono text-[17px] font-bold tracking-tight"
              style={{ color: previewId ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
              data-testid="campaign-id-preview"
            >
              {idParts.join('-')}
            </p>
            {client.trim() && (
              <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-text-secondary)' }}>
                Client ID <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{clientIdFor(client.trim())}</span>
                {' '}— every campaign record carries both keys
              </p>
            )}
            <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              client · type · start month · sequence. Minted at save, never changes; wholesale or retail, budgets and tooling are fields on the record, not part of the name.
            </p>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              What this creates
            </h2>
            {typeMeta ? (
              <ul className="mt-2.5 space-y-2">
                {typeMeta.flows.map(flow => (
                  <li key={flow} className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                    {flow}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[12.5px]" style={{ color: 'var(--color-text-muted)' }}>
                Pick a campaign type to see which data flows attach
              </p>
            )}
          </div>

          <div
            className="rounded-xl border p-3.5 text-[11.5px] leading-relaxed"
            style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            <b style={{ color: 'var(--color-text-primary)' }}>Naming rule for Propensity:</b> the ad campaign's
            name must begin with this ID, then free text — some Propensity responses carry only the name,
            so the ID in the name is what links their data back to this campaign.
          </div>
        </aside>
      </div>
    </div>
  );
}
