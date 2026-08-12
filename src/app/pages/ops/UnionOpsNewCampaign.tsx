import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Building2, Calendar, ChevronDown, CloudCog, Crosshair, FileText,
  Layers, ListChecks, Loader2, Paperclip, Plus, Radio, Shapes, Users, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CAMPAIGN_TYPES_META, createCampaign, mintCampaignId, slugForClient, clientIdFor,
  type CampaignTypeCode,
} from '../../data/unionOps';
import { UNION_COMPANY } from '../../data/unionClient';
import { ChipSelect, TagInput, FileSlot } from '../../components/ops/NewCampaignControls';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// ─── UNION OPS · campaign initiation ─────────────────────────────────────────
// Campaigns are born here. Pulse mints the campaign ID at save — the naming
// convention {CLIENT}-{TYPE}-{YYYYMM}-{SEQ} — because Salesforce cannot:
// clients on a master service agreement never get a per-campaign opportunity.
// The rest of the form is the job card: the ICP that bounds who a lead may
// be, the delivery rules, the files (suppression, TAL, assets) and the
// commercials. Ops-only, and laid out dense on purpose: full width, no side
// rail, the live ID and the save button pinned in the header — ops fills
// this several times a week and it should fit in about one screen.

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

// The ICP vocabulary — the same bands the QA rules and job cards use.
const GEOS = ['NAM', 'EMEA', 'APAC', 'LATAM'] as const;
const INDUSTRIES = [
  'Software & SaaS', 'Financial services', 'Healthcare & life sciences', 'Manufacturing',
  'Retail & ecommerce', 'Energy & utilities', 'Telecom & media', 'Public sector',
] as const;
const EMPLOYEE_BANDS = ['1-99', '100-499', '500-999', '1,000-4,999', '5,000+'] as const;
const REVENUE_BANDS = ['<$10M', '$10M-50M', '$50M-250M', '$250M-1B', '$1B+'] as const;
const JOB_FUNCTIONS = ['IT & infrastructure', 'Security', 'Finance', 'Operations', 'Marketing', 'Procurement', 'HR'] as const;
const SENIORITY = ['C-level', 'VP', 'Director', 'Manager', 'Practitioner'] as const;
const CONSENT = ['GDPR', 'CCPA', 'CASL'] as const;

// Mock uploads — clicking a slot attaches the next canned file.
const CANNED_SUPPRESSION = ['northwind-global-suppression.csv · 1,204 domains'] as const;
const CANNED_TAL = ['q4-named-accounts.csv · 350 accounts'] as const;
const CANNED_ASSETS = [
  'zero-trust-buyers-guide.pdf',
  'infra-modernization-webinar.mp4',
  'display-banners-q4.zip',
] as const;

const FIELD_LABEL = 'block text-[12px] font-semibold mb-1';
const INPUT = 'input-base h-[36px] w-full px-3 text-sm';

// Each section gets its own colour so the eye can land without reading:
// an icon chip on the section's tint plus a matching left edge on the card.
// All from the token set — the semantic colours are tuned to be legible on
// their own tints in both themes.
interface SectionTone { color: string; bg: string }
const TONES: Record<string, SectionTone> = {
  primary: { color: 'var(--color-primary)', bg: 'var(--color-primary-tint)' },
  info: { color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  success: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  muted: { color: 'var(--color-text-muted)', bg: 'var(--color-gray-100)' },
};

function SectionHead({ icon: Icon, tone, children, note }: {
  icon: typeof FileText;
  tone: SectionTone;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <h2 className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-secondary)' }}>
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg }}>
        <Icon className="h-3.5 w-3.5" style={{ color: tone.color }} />
      </span>
      {children}
      {note && (
        <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--color-text-muted)' }}>
          · {note}
        </span>
      )}
    </h2>
  );
}

/** Card with the section's colour on its left edge. */
const cardStyle = (tone: SectionTone) => ({ borderLeft: `3px solid ${tone.color}` });

export default function UnionOpsNewCampaign() {
  useDocumentTitle('New Campaign');
  const navigate = useNavigate();

  // 1 · Campaign & client
  const [name, setName] = useState('');
  const [client, setClient] = useState(UNION_COMPANY);
  const [clientOpen, setClientOpen] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // 2 · Type + 3 · Schedule & targets
  const [type, setType] = useState<CampaignTypeCode | null>(null);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [targetLeads, setTargetLeads] = useState('');
  const [targetImpressions, setTargetImpressions] = useState('');

  // 4 · Targeting (the ICP)
  const [geos, setGeos] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [employeeBands, setEmployeeBands] = useState<string[]>([]);
  const [revenueBands, setRevenueBands] = useState<string[]>([]);
  const [jobFunctions, setJobFunctions] = useState<string[]>([]);
  const [seniority, setSeniority] = useState<string[]>([]);
  const [techKeywords, setTechKeywords] = useState<string[]>([]);

  // 5 · Delivery rules & compliance
  const [touch, setTouch] = useState<'single' | 'double'>('single');
  const [leadCap, setLeadCap] = useState('3');
  const [cadence, setCadence] = useState<'Weekly' | 'Biweekly' | 'At completion'>('Weekly');
  const [format, setFormat] = useState<'Portal' | 'CSV export' | 'CRM push'>('Portal');
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [consent, setConsent] = useState<string[]>([]);

  // 6 · Files
  const [suppression, setSuppression] = useState<string[]>([]);
  const [tal, setTal] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);

  // 7 · Commercials & Salesforce
  const [cplTarget, setCplTarget] = useState('');
  const [budget, setBudget] = useState('');
  const [ioNumber, setIoNumber] = useState('');
  const [sfOpp, setSfOpp] = useState('');
  const [sfOli, setSfOli] = useState('');

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
    && !!startDate && !!endDate && dateOrderOk
    && geos.length > 0 && industries.length > 0 && assets.length > 0;

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
        targeting: { geos, industries, employeeBands, revenueBands, jobFunctions, seniority, techKeywords },
        rules: {
          touch,
          leadCapPerAccount: leadCap ? Number(leadCap) : null,
          cadence,
          format,
          customQuestions,
          consent,
        },
        files: { suppression: suppression[0] ?? null, tal: tal[0] ?? null, assets },
        commercials: {
          cplTarget: cplTarget ? Number(cplTarget) : null,
          budget: budget ? Number(budget) : null,
          ioNumber: ioNumber.trim() || null,
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

      {/* Row 1: identity · type · schedule */}
      <div className="grid gap-3 lg:grid-cols-3">
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
      </div>

      {/* Row 2: the ICP, full width — two chip columns, rows barely wrap */}
      <div className="glass-card space-y-2 p-3.5" style={cardStyle(TONES.warning)}>
        <SectionHead icon={Crosshair} tone={TONES.warning} note="QA holds every delivered lead against this">
          4 · Targeting — the ICP
        </SectionHead>
        <div className="grid gap-x-6 gap-y-2 xl:grid-cols-2">
          <ChipSelect
            inline label="Geography" required options={GEOS} values={geos} onChange={setGeos}
            error={err(geos.length === 0) ? 'Pick at least one region' : undefined}
          />
          <ChipSelect inline label="Employees" options={EMPLOYEE_BANDS} values={employeeBands} onChange={setEmployeeBands} />
          <ChipSelect
            inline label="Industry" required options={INDUSTRIES} values={industries} onChange={setIndustries}
            error={err(industries.length === 0) ? 'Pick at least one industry' : undefined}
          />
          <ChipSelect inline label="Revenue" options={REVENUE_BANDS} values={revenueBands} onChange={setRevenueBands} />
          <ChipSelect inline label="Function" options={JOB_FUNCTIONS} values={jobFunctions} onChange={setJobFunctions} />
          <ChipSelect inline label="Seniority" options={SENIORITY} values={seniority} onChange={setSeniority} />
        </div>
        <TagInput
          label="Install base / tech stack"
          placeholder="Optional — e.g. AWS, Salesforce, SAP · press Enter to add"
          values={techKeywords}
          onChange={setTechKeywords}
        />
      </div>

      {/* Row 3: rules · files · commercials · salesforce */}
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.info)}>
          <SectionHead icon={ListChecks} tone={TONES.info}>5 · Delivery rules</SectionHead>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>Touch</span>
              <div
                className="grid grid-cols-2 gap-1 rounded-xl p-1"
                style={{ background: 'var(--background-muted)' }}
                role="radiogroup"
                aria-label="Touch type"
              >
                {(['single', 'double'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={touch === t}
                    onClick={() => setTouch(t)}
                    className={`min-h-[30px] rounded-lg px-2 text-[12px] font-semibold capitalize transition-colors ${
                      touch === t ? 'bg-[var(--color-primary-solid)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="nc-cap" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>Lead cap / account</label>
              <input id="nc-cap" type="number" min={1} value={leadCap} onChange={e => setLeadCap(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor="nc-cadence" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>Cadence</label>
              <select id="nc-cadence" value={cadence} onChange={e => setCadence(e.target.value as typeof cadence)} className={INPUT}>
                <option>Weekly</option>
                <option>Biweekly</option>
                <option>At completion</option>
              </select>
            </div>
            <div>
              <label htmlFor="nc-format" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>Delivery format</label>
              <select id="nc-format" value={format} onChange={e => setFormat(e.target.value as typeof format)} className={INPUT}>
                <option>Portal</option>
                <option>CSV export</option>
                <option>CRM push</option>
              </select>
            </div>
          </div>
          <TagInput
            label="Custom qualifying questions"
            placeholder='e.g. "Cloud migration timeline?" · Enter to add'
            values={customQuestions}
            onChange={setCustomQuestions}
          />
          <ChipSelect inline label="Consent" options={CONSENT} values={consent} onChange={setConsent} />
        </div>

        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.success)}>
          <SectionHead icon={Paperclip} tone={TONES.success}>6 · Files</SectionHead>
          <FileSlot
            label="Suppression list"
            hint="Never-touch domains — applies from day one"
            canned={CANNED_SUPPRESSION}
            attached={suppression}
            onChange={setSuppression}
          />
          <FileSlot
            label="Target account list (TAL)"
            hint="Optional — restricts delivery to named accounts"
            canned={CANNED_TAL}
            attached={tal}
            onChange={setTal}
          />
          <FileSlot
            label="Assets"
            hint="Content for syndication, creatives for ads"
            canned={CANNED_ASSETS}
            attached={assets}
            onChange={setAssets}
            multi
            error={err(assets.length === 0) ? 'Every campaign needs at least one asset' : undefined}
          />
        </div>

        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.primary)}>
          <SectionHead icon={Wallet} tone={TONES.primary}>7 · Commercials</SectionHead>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="nc-cpl" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>CPL ($)</label>
              <input id="nc-cpl" type="number" min={0} value={cplTarget} onChange={e => setCplTarget(e.target.value)} placeholder="55" className={INPUT} />
            </div>
            <div>
              <label htmlFor="nc-budget" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>Budget ($)</label>
              <input id="nc-budget" type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)} placeholder="22,000" className={INPUT} />
            </div>
            <div className="col-span-2">
              <label htmlFor="nc-io" className={FIELD_LABEL} style={{ color: 'var(--color-text-primary)' }}>IO / PO number</label>
              <input id="nc-io" type="text" value={ioNumber} onChange={e => setIoNumber(e.target.value)} placeholder="IO-2026-0917" className={INPUT} />
            </div>
          </div>
          <p className="text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>
            Ops only — the client sees one combined spend figure with margins applied
          </p>
        </div>

        {/* Deliberately grey: not connected yet. The IDs captured here mean
            campaigns link up by themselves the day Salesforce is connected. */}
        <div className="glass-card space-y-2.5 p-3.5" style={cardStyle(TONES.muted)}>
          <SectionHead icon={CloudCog} tone={TONES.muted}>
            8 · Salesforce
            <span
              className="rounded-full px-2 py-0.5 text-[9.5px] font-bold normal-case tracking-normal"
              style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
            >
              Optional
            </span>
          </SectionHead>
          <div>
            <label htmlFor="nc-opp" className={FIELD_LABEL} style={{ color: 'var(--color-text-secondary)' }}>Opportunity</label>
            <input id="nc-opp" type="text" value={sfOpp} onChange={e => setSfOpp(e.target.value)} placeholder="0064x000ABc1DeF" className={INPUT} />
          </div>
          <div>
            <label htmlFor="nc-oli" className={FIELD_LABEL} style={{ color: 'var(--color-text-secondary)' }}>Opportunity line item</label>
            <input id="nc-oli" type="text" value={sfOli} onChange={e => setSfOli(e.target.value)} placeholder="00k4x000GHi2JkL" className={INPUT} />
          </div>
          <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Not connected yet — IDs entered now link automatically when Salesforce connects later.
            MSA clients have no per-campaign opportunity; leave blank and the campaign ID stands alone.
          </p>
        </div>
      </div>
    </div>
  );
}
