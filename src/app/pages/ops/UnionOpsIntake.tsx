import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, UploadCloud, FileSpreadsheet, Database, Check, ShieldCheck,
  Sparkles, Loader2, RefreshCw, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { CAMPAIGN_RENAMES } from '../../data/unionClient';
import { enqueueRelishJob } from '../../data/unionOps';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// ─── UNION OPS · data intake ─────────────────────────────────────────────────
// Campaign → source (CSV upload | CRM pull) → column mapping → QA snapshot →
// save → send to Relish. Everything is mock: the "upload" loads a canned
// batch, the mapping is pre-matched, and Send enqueues a job the pipeline
// dashboard picks up live.

type Source = 'csv' | 'crm';

const MOCK_BATCH: Record<Source, { label: string; rows: number }> = {
  csv: { label: 'gridworks-aug-batch1.csv', rows: 244 },
  crm: { label: 'Salesforce · GridWorks — August MQLs', rows: 187 },
};

const COLUMN_MAP: Array<{ source: string; target: string; note?: string }> = [
  { source: 'First Name', target: 'First name' },
  { source: 'Last Name', target: 'Last name' },
  { source: 'Work Email', target: 'Email' },
  { source: 'Company', target: 'Company' },
  { source: 'Job Title', target: 'Title' },
  { source: 'Phone', target: 'Phone' },
  { source: 'Country', target: 'Country' },
  { source: 'Employee Band', target: 'Company size' },
  { source: 'Asset Downloaded', target: 'Ignored', note: 'Not a portal field — kept in the raw batch' },
];

export default function UnionOpsIntake() {
  useDocumentTitle('Data Intake');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [campaignId, setCampaignId] = useState(() => {
    const c = searchParams.get('campaign');
    return c && CAMPAIGN_RENAMES[c] ? c : '46936';
  });
  const [source, setSource] = useState<Source>('csv');
  // idle → loading (parsing/pulling) → loaded (mapping + QA visible) →
  // saved → sending → done (navigates away)
  const [step, setStep] = useState<'idle' | 'loading' | 'loaded' | 'saved' | 'sending'>('idle');

  const batch = MOCK_BATCH[source];
  const qaValid = Math.round(batch.rows * 0.97);
  const qaCaution = Math.round(batch.rows * 0.02);
  const qaInvalid = batch.rows - qaValid - qaCaution;

  const loadBatch = () => {
    setStep('loading');
    window.setTimeout(() => setStep('loaded'), 900);
  };

  const changeSource = (next: Source) => {
    setSource(next);
    setStep('idle');
  };

  const saveBatch = () => {
    setStep('saved');
    toast.success('Batch saved — ready to send');
  };

  const sendToRelish = () => {
    setStep('sending');
    window.setTimeout(() => {
      enqueueRelishJob({
        campaignId,
        campaignName: CAMPAIGN_RENAMES[campaignId],
        rows: qaValid,
        source,
      });
      toast.success(`${qaValid} rows sent to Relish for enrichment`);
      navigate('/ops-union');
    }, 1400);
  };

  const selectCls = 'input-base h-[38px] px-3 text-sm';
  const stepDone = (s: 'loaded' | 'saved') =>
    step === s || (s === 'loaded' && (step === 'saved' || step === 'sending')) || (s === 'saved' && step === 'sending');

  return (
    <div className="max-w-[1140px] mx-auto page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate('/ops-union')}
          className="btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Pipeline
        </button>
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Valid rows go to Relish · flagged rows stay in CleanRich QA
        </span>
      </div>

      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          Data intake
        </h1>
        <p className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
          Bring campaign leads in, map them to portal fields, QA, and send to Relish for enrichment.
        </p>
      </div>

      {/* 1 · Campaign + source */}
      <div className="glass-card space-y-3 p-4">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
          1 · Campaign &amp; source
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={campaignId}
            onChange={e => { setCampaignId(e.target.value); setStep('idle'); }}
            className={selectCls}
          >
            {Object.entries(CAMPAIGN_RENAMES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <div
            className="grid grid-cols-2 gap-1 rounded-xl p-1"
            style={{ background: 'var(--background-muted)' }}
            role="tablist"
          >
            {([['csv', 'Upload CSV', FileSpreadsheet], ['crm', 'Pull from CRM', Database]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                role="tab"
                aria-selected={source === key}
                onClick={() => changeSource(key)}
                className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors ${
                  source === key ? 'bg-[var(--color-primary-solid)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {step === 'idle' && source === 'csv' && (
          <button
            onClick={loadBatch}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-tint)]"
            style={{ borderColor: 'var(--color-border)' }}
            data-testid="csv-dropzone"
          >
            <UploadCloud className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Drop a CSV here or click to browse
            </span>
            <span className="text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
              Demo loads {MOCK_BATCH.csv.label} · {MOCK_BATCH.csv.rows} rows
            </span>
          </button>
        )}

        {step === 'idle' && source === 'crm' && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--color-primary-tint)' }}>
                <Database className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              </span>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Northwind Salesforce — connected
                </div>
                <div className="text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>
                  List view: GridWorks — August MQLs · {MOCK_BATCH.crm.rows} records match
                </div>
              </div>
            </div>
            <button onClick={loadBatch} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <RefreshCw className="h-4 w-4" /> Pull records
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border px-4 py-8" style={{ borderColor: 'var(--color-border-light)' }}>
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              {source === 'csv' ? 'Parsing file…' : 'Pulling from Salesforce…'}
            </span>
          </div>
        )}

        {step !== 'idle' && step !== 'loading' && (
          <div
            className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--color-success)', background: 'var(--color-success-bg)' }}
          >
            <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {batch.label} · {batch.rows} rows loaded
            </span>
          </div>
        )}
      </div>

      {/* 2 · Column mapping + 3 · QA (appear once a batch is in) */}
      {step !== 'idle' && step !== 'loading' && (
        <>
          <div className="glass-card p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              2 · Column mapping
            </h2>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
              Auto-matched against the portal lead schema — adjust anything that mapped wrong.
            </p>
            <div className="mt-2.5 divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
              {COLUMN_MAP.map(col => (
                <div key={col.source} className="flex items-center gap-3 py-2">
                  <span className="w-[38%] truncate text-[12.5px] font-semibold sm:w-[30%]" style={{ color: 'var(--color-text-primary)' }}>
                    {col.source}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  <span
                    className="truncate text-[12.5px] font-medium"
                    style={{ color: col.target === 'Ignored' ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}
                  >
                    {col.target}
                  </span>
                  {col.note ? (
                    <span className="ml-auto hidden truncate text-[11px] sm:block" style={{ color: 'var(--color-text-muted)' }}>{col.note}</span>
                  ) : (
                    <Check className="ml-auto h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
              <ShieldCheck className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
              3 · QA snapshot
            </h2>
            <div className="mt-2.5 flex h-2 overflow-hidden rounded-full">
              <span style={{ width: '97%', background: 'var(--color-success)' }} />
              <span style={{ width: '2%', background: 'var(--color-warning)' }} />
              <span style={{ width: '1%', background: 'var(--color-error)' }} />
            </div>
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
              <b style={{ color: 'var(--color-success)' }}>{qaValid}</b> valid ·{' '}
              <b style={{ color: 'var(--color-warning)' }}>{qaCaution}</b> caution (missing phone / soft bounce risk) ·{' '}
              <b style={{ color: 'var(--color-error)' }}>{qaInvalid}</b> invalid — flagged rows route to CleanRich, not Relish.
            </p>
          </div>

          {/* 4 · Save + send */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              onClick={saveBatch}
              disabled={stepDone('saved')}
              className="btn-outline flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {stepDone('saved') ? <Check className="h-4 w-4" /> : null}
              {stepDone('saved') ? 'Batch saved' : 'Save batch'}
            </button>
            <button
              onClick={sendToRelish}
              disabled={!stepDone('saved') || step === 'sending'}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {step === 'sending'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending to Relish…</>
                : <><Sparkles className="h-4 w-4" /> Send {qaValid} rows to Relish</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
