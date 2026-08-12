import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Building2, Calendar, ChevronDown, FileText,
  Layers, Loader2, Plus, Radio, Shapes, Users, Wallet,
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
// Deliberately minimal for the first release (per Ben, Aug 12): creation
// exists to align contacts and data to a campaign, not to hold the job card.
// Identity, type, schedule, CPL + budget — the ICP, files and delivery rules
// stay off Pulse until a later release.

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

const FIELD_LABEL = 'block text-[12px] font-semibold mb-1';
const INPUT = 'input-base h-[36px] w-full px-3 text-sm';

// Each section gets its own colour so the eye can land without reading:
// an icon chip on the section's tint plus a matching left edge on the card.
interface SectionTone { color: string; bg: string }
const TONES: Record<string, SectionTone> = {
  primary: { color: 'var(--color-primary)', bg: 'var(--color-primary-tint)' },
  info: { color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  success: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
};

function SectionHead({ icon: Icon, tone, children }: {
  icon: typeof FileText;
  tone: SectionTone;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-secondary)' }}>
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg }}>
        <Icon className="h-3.5 w-3.5" style={{ color: tone.color }} />
      </span>
      {children}
    </h2>
  );
}

const cardStyle = (tone: SectionTone) => ({ borderLeft: `3px solid ${tone.color}` });

export default function UnionOpsNewCampaign() {
  useDocumentTitle('New Campaign');
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [client, setClient] = useState(UNION_COMPANY);
  const [clientOpen, setClientOpen] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<CampaignTypeCode | null>(null);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [targetLeads, setTargetLeads] = useState('');
  const [targetImpressions, setTargetImpressions] = useState('');

  const [cplTarget, setCplTarget] = useState('');
  const [budget, setBudget] = useState('');

  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const typeMeta = CAMPAIGN_TYPES_META.find(t => t.code === type) ?? null;

  const clientMatches = useMemo(() => {
    const q = client.trim().toLowerCase();
    return KNOWN_CLIENTS.filter(c => c.toLowerCase().includes(q));
  }, [client]);
  const isNewClient = client.trim().length > 0
    && !KNOWN_CLIENTS.some(c => c.toLowerCase() === client.trim().toLowerCase());

  // The ID assembles live in the header so ops sees what will be minted.
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
        sfOpportunityId: null,
        sfOpportunityLineItemId: null,
        commercials: {
          cplTarget: cplTarget ? Number(cplTarget) : null,
          budget: budget ? Number(budget) : null,
          ioNumber: null,
        },
      });
      toast.success(`${record.id} created — ${record.name}`);
      navigate('/ops-union');
    }, 700);
  };

  const err = (bad: boolean) => showErrors && bad;

  return (
    <div className="mx-auto max-w-[1400px] page-content space-y-3">
      {/* Header: identity, the live ID, and the actions in one row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          onClick={() => navigate('/ops-union')}
          className="btn-ghost inline-flex min-h-[32px] items-center gap-1.5 px-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Pipeline
        </button>
        <h1 className="text-[20px] font-extrabold leading-tight tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          New campaign
        </h1>
        <span
          className="rounded-lg px-2.5 py-1 font-mono text-[13px] font-bold"
          style={{
            background: 'var(--color-primary-tint)',
            color: previewId ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
          data-testid="campaign-id-preview"
          title="Minted at save; the Propensity ad campaign's name must begin with this ID"
        >
          {idParts.join('-')}
        </span>
        {client.trim() && (
          <span className="hidden text-[11px] xl:inline" style={{ color: 'var(--color-text-muted)' }}>
            + <span className="font-mono font-semibold">{clientIdFor(client.trim())}</span> — both keys on the record
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate('/ops-union')} className="btn-outline px-3.5 py-1.5 text-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-3.5 py-1.5 text-sm disabled:opacity-60"
            data-testid="create-campaign"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              : <><Plus className="h-4 w-4" /> Create campaign</>}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.primary)}>
          <SectionHead icon={Building2} tone={TONES.primary}>1 · Campaign &amp; client</SectionHead>
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
              <p className="mt-1 text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>Enter a campaign name</p>
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
            <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Type a new name to create it — slug minted once, never reused
            </p>
          </div>
        </div>

        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.info)}>
          <SectionHead icon={Shapes} tone={TONES.info}>2 · Campaign type</SectionHead>
          <div role="radiogroup" aria-label="Campaign type" className="grid grid-cols-2 gap-2">
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
                  className="flex items-start gap-2 rounded-xl border p-2.5 text-left transition-colors hover:border-[var(--color-primary)]"
                  style={{
                    borderColor: on ? 'var(--color-primary)' : 'var(--color-border)',
                    background: on ? 'var(--color-primary-tint)' : 'transparent',
                  }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: on ? 'var(--color-primary-solid)' : 'var(--color-primary-tint)' }}
                  >
                    <Icon className="h-3 w-3" style={{ color: on ? '#FFFFFF' : 'var(--color-primary)' }} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1 text-[12.5px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                      {t.label}
                      <span
                        className="rounded px-1 py-px font-mono text-[9.5px] font-bold"
                        style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
                      >
                        {t.code}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[10.5px] leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                      {t.blurb}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {err(!type) && (
            <p className="text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>Choose a campaign type</p>
          )}
        </div>

        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.success)}>
          <SectionHead icon={Calendar} tone={TONES.success}>3 · Schedule &amp; targets</SectionHead>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="nc-start" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>
                Start <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input id="nc-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor="nc-end" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>
                End <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input id="nc-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={INPUT} aria-invalid={err(!dateOrderOk)} />
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
            </div>
            <div>
              <label htmlFor="nc-imps" className={FIELD_LABEL} style={{ color: typeMeta && !typeMeta.takesImpressions ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                Impressions
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
            </div>
          </div>
          {err(!dateOrderOk) && (
            <p className="text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>End date is before the start date</p>
          )}
          {typeMeta && !typeMeta.takesLeads && (
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Programmatic delivers impressions, not a lead count
            </p>
          )}
        </div>

        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.warning)}>
          <SectionHead icon={Wallet} tone={TONES.warning}>4 · Commercials</SectionHead>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="nc-cpl" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>CPL ($)</label>
              <input id="nc-cpl" type="number" min={0} value={cplTarget} onChange={e => setCplTarget(e.target.value)} placeholder="55" className={INPUT} />
            </div>
            <div>
              <label htmlFor="nc-budget" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>Budget ($)</label>
              <input id="nc-budget" type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)} placeholder="22,000" className={INPUT} />
            </div>
          </div>
          <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Ops only — the client sees one combined spend figure with margins applied.
            Creation aligns contacts and data to the campaign; the ICP, files and delivery
            rules stay off Pulse for this release.
          </p>
        </div>
      </div>
    </div>
  );
}
