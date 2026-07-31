import { useState, useEffect, useMemo } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Globe, Building2, Users, IdCard, Save, AlertTriangle, CheckCircle2, Target, ChevronDown, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DIMENSIONS,
  REPORT_CAMPAIGNS,
  getEntry,
  saveDemographics,
  dimensionTotal,
  type Counts,
  type DemographicEntry,
  type DimensionKey,
} from '../data/demographics';
import { allClients } from '../data/mockClients';
import { BatchUpload } from '../components/BatchUpload';

const ALL = '__ALL__';

const DIM_ICON: Record<DimensionKey, any> = { geo: Globe, industry: Building2, size: Users, title: IdCard };
const DIM_CHIP: Record<DimensionKey, { bg: string; color: string }> = {
  geo: { bg: 'var(--color-accent-purple-bg)', color: 'var(--color-accent-purple)' },
  industry: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  size: { bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
  title: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
};

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function CountRow({ label, value, total, onChange, readOnly }: {
  label: string; value: number; total: number; onChange: (v: number) => void; readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <label className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <span className="w-14 text-right text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{pct(value, total)}%</span>
      <input
        type="number" min={0} value={value === 0 ? '' : value} placeholder="0"
        disabled={readOnly}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="input-base w-24 px-3 py-2 text-center text-sm font-semibold disabled:opacity-70"
      />
    </div>
  );
}

/** Sum every active campaign's entry into one combined, read-only view. */
function combinedEntry(): DemographicEntry {
  const actives = REPORT_CAMPAIGNS.filter((c) => c.status === 'active');
  const base: DemographicEntry = { geo: {}, industry: {}, size: {}, title: {}, pacing: { monthTarget: 0, monthDelivered: 0 } };
  for (const c of actives) {
    const e = getEntry(c.key);
    (['geo', 'industry', 'size', 'title'] as DimensionKey[]).forEach((dim) => {
      Object.entries(e[dim] as Counts).forEach(([k, v]) => {
        (base[dim] as Counts)[k] = ((base[dim] as Counts)[k] || 0) + v;
      });
    });
    base.pacing.monthTarget += e.pacing.monthTarget;
    base.pacing.monthDelivered += e.pacing.monthDelivered;
  }
  return base;
}

export default function DemographicsEntryPage() {
  useDocumentTitle('Lead Demographics');

  const [clientId, setClientId] = useState(allClients[0]?.id ?? '');
  const [selected, setSelected] = useState<string>(ALL);
  const [entry, setEntry] = useState<DemographicEntry>(() => combinedEntry());

  const isCombined = selected === ALL;

  useEffect(() => {
    setEntry(isCombined ? combinedEntry() : getEntry(selected));
  }, [selected, isCombined]);

  const client = allClients.find((c) => c.id === clientId);
  const activeCampaigns = REPORT_CAMPAIGNS.filter((c) => c.status === 'active');
  const uploadedCount = activeCampaigns.filter((c) => dimensionTotal(getEntry(c.key).geo, 'geo') > 0).length;
  const notUploadedCount = activeCampaigns.length - uploadedCount;

  const setDim = (dim: DimensionKey, option: string, v: number) =>
    setEntry((p) => ({ ...p, [dim]: { ...(p[dim] as Counts), [option]: v } }));
  const setPacing = (field: 'monthTarget' | 'monthDelivered', v: number) =>
    setEntry((p) => ({ ...p, pacing: { ...p.pacing, [field]: v } }));

  // Cumulative: each uploaded batch ADDS to the running totals.
  const mergeBatch = (counts: Record<DimensionKey, Counts>) => {
    setEntry((p) => {
      const next = { ...p };
      (Object.keys(counts) as DimensionKey[]).forEach((dim) => {
        const merged = { ...(p[dim] as Counts) };
        Object.entries(counts[dim]).forEach(([k, v]) => { merged[k] = (merged[k] || 0) + v; });
        next[dim] = merged;
      });
      return next;
    });
  };

  // Integrity: all four dimension totals should match.
  const totals = useMemo(
    () => DIMENSIONS.map((d) => ({ key: d.key, label: d.label, total: dimensionTotal(entry[d.key] as Counts, d.key) })),
    [entry],
  );
  const nonZero = totals.filter((t) => t.total > 0);
  const reference = nonZero.length ? Math.max(...nonZero.map((t) => t.total)) : 0;
  const mismatched = totals.filter((t) => t.total !== reference && reference > 0);
  const consistent = mismatched.length === 0 && reference > 0;

  const handleSave = () => {
    saveDemographics(selected, entry);
    toast.success(`${selected} demographics saved — now live on the client Reports page.`);
  };

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Client + Campaign selectors */}
        <div className="glass-card p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Client</label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full appearance-none bg-[var(--color-surface-raised)]"
                  style={{ padding: '10px 14px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-lg)' }}
                >
                  {allClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div>
              <label className="block" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Campaign</label>
              <div className="relative">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="input-base w-full appearance-none"
                  style={{ padding: '10px 14px', fontSize: '14px' }}
                >
                  <option value={ALL}>All Active campaigns</option>
                  {REPORT_CAMPAIGNS.map((c) => (
                    <option key={c.key} value={c.key}>{c.key} ({c.status})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Filter</span>
            <button
              onClick={() => setSelected(ALL)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                fontSize: '12px', fontWeight: 600,
                border: '1.5px solid var(--color-primary)',
                color: 'var(--color-primary)',
                background: isCombined ? 'var(--color-primary-tint)' : 'transparent',
              }}
            >
              All Active campaigns
              <span className="px-1.5 rounded-full" style={{ background: 'var(--color-primary-tint)', fontSize: '11px' }}>{activeCampaigns.length}</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-main-bg)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-success)' }} />
              Uploaded <span style={{ fontWeight: 700 }}>{uploadedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-main-bg)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-error)' }} />
              Not uploaded <span style={{ fontWeight: 700 }}>{notUploadedCount}</span>
            </span>
          </div>
          <p className="mt-2" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Viewing {isCombined ? 'combined' : 'campaign'} demographics for <strong>{client?.companyName}</strong>
            {isCombined && <> · <strong>{activeCampaigns.length} active campaigns</strong></>}
          </p>
        </div>

        {/* Combined-view info banner */}
        {isCombined && (
          <div className="glass-card p-4 mb-4 flex gap-3">
            <Users2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              This is the combined <strong>&quot;All Active campaigns&quot;</strong> view for <strong>{client?.companyName}</strong> — lead
              counts are summed across every active campaign. Select a specific campaign above to upload a delivery
              batch or edit demographics manually.
            </div>
          </div>
        )}

        {/* Batch upload — only when editing a single campaign */}
        {!isCombined && <BatchUpload campaignKey={selected} onMerge={mergeBatch} />}

        {/* Pacing */}
        <div className="glass-card p-5 mb-4">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            <Target className="w-4 h-4 text-[var(--color-primary)]" /> {isCombined ? 'Combined pacing' : 'This Month — Pacing'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Target</label>
              <input type="number" min={0} value={entry.pacing.monthTarget === 0 ? '' : entry.pacing.monthTarget} placeholder="0"
                disabled={isCombined}
                onChange={(e) => setPacing('monthTarget', Math.max(0, parseInt(e.target.value) || 0))}
                className="input-base w-full px-3 py-2 text-sm font-semibold disabled:opacity-70" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>Delivered so far</label>
              <input type="number" min={0} value={entry.pacing.monthDelivered === 0 ? '' : entry.pacing.monthDelivered} placeholder="0"
                disabled={isCombined}
                onChange={(e) => setPacing('monthDelivered', Math.max(0, parseInt(e.target.value) || 0))}
                className="input-base w-full px-3 py-2 text-sm font-semibold disabled:opacity-70" />
            </div>
          </div>
        </div>

        {/* Integrity banner — only meaningful when editing */}
        {!isCombined && (
          <div
            className="rounded-xl p-4 mb-4 flex gap-3 items-start border"
            style={{
              background: consistent ? 'rgba(16,163,127,0.06)' : 'rgba(186,32,39,0.06)',
              borderColor: consistent ? 'rgba(16,163,127,0.3)' : 'rgba(186,32,39,0.3)',
            }}
          >
            {consistent ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--color-primary)]" />}
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {consistent ? (
                <span>All four dimensions total <strong>{reference.toLocaleString()}</strong> leads — consistent and ready to save.</span>
              ) : (
                <span>
                  Totals don&apos;t match across dimensions. Every lead has a geo, industry, size and title, so all four should sum to the same number.{' '}
                  {mismatched.map((m) => `${m.label.replace(' Distribution', '')}: ${m.total.toLocaleString()}`).join(' · ')}{' '}
                  vs expected <strong>{reference.toLocaleString()}</strong>.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Four dimension panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {DIMENSIONS.map(({ key, label, options }) => {
            const Icon = DIM_ICON[key];
            const counts = entry[key] as Counts;
            const total = dimensionTotal(counts, key);
            return (
              <div key={key} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 24, height: 24, background: DIM_CHIP[key].bg, color: DIM_CHIP[key].color }}>
                      <Icon className="w-3.5 h-3.5" />
                    </span> {label}
                  </h3>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{total.toLocaleString()} leads</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {options.map((opt) => (
                    <CountRow key={opt} label={opt} value={counts[opt] || 0} total={total} readOnly={isCombined} onChange={(v) => setDim(key, opt, v)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!isCombined && (
          <div className="flex justify-end mt-5">
            <button onClick={handleSave} className="btn-primary px-6 py-3 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save &amp; Sync to Client
            </button>
          </div>
        )}
      </div>
    </>
  );
}
