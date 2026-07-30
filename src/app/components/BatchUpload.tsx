import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Sparkles, Check, AlertTriangle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DIMENSIONS, type DimensionKey, type Counts } from '../data/demographics';
import { parseRows, learnValue, learnedCount, sampleRows, type ParseResult } from '../data/leadMapping';

const DIM_LABEL: Record<DimensionKey, string> = {
  geo: 'Geography', industry: 'Industry', size: 'Company Size', title: 'Title',
};

interface Props {
  campaignKey: string;
  onMerge: (counts: Record<DimensionKey, Counts>) => void;
}

export function BatchUpload({ campaignKey, onMerge }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [learned, setLearned] = useState(0);

  function ingest(rows: Record<string, any>[], sourceLabel: string) {
    setBusy(true);
    // Small delay so the "reading…" state is visible — mimics the eventual async call.
    setTimeout(() => {
      const r = parseRows(rows, { acceptedOnly: true });
      setResult(r);
      setBusy(false);
      const dims = (Object.keys(r.detected) as DimensionKey[]).filter((d) => r.detected[d]);
      if (dims.length === 0) {
        toast.error(`No recognisable columns in ${sourceLabel}. Expected geo / industry / size / title.`);
      } else {
        toast.success(`${sourceLabel}: read ${r.rowsCounted.toLocaleString()} accepted leads`);
      }
    }, 450);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      // xlsx is heavy (~340kB); load it on demand so it stays out of the page's initial chunk.
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
      ingest(rows, file.name);
    } catch (err) {
      console.error(err);
      toast.error('Could not read that file. Make sure it is a valid .xlsx / .csv.');
      setBusy(false);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Operator assigns an unmapped raw value to a bucket → learn it + fold the count in.
  function resolve(dim: DimensionKey, raw: string, bucket: string) {
    if (!result) return;
    learnValue(dim, raw, bucket);
    setLearned((n) => n + 1);
    const count = result.unmapped[dim][raw] || 0;
    const nextCounts = { ...result.counts, [dim]: { ...result.counts[dim], [bucket]: (result.counts[dim][bucket] || 0) + count } };
    const nextUnmapped = { ...result.unmapped, [dim]: { ...result.unmapped[dim] } };
    delete nextUnmapped[dim][raw];
    setResult({ ...result, counts: nextCounts, unmapped: nextUnmapped });
  }

  function merge() {
    if (!result) return;
    onMerge(result.counts);
    const totalUnmapped = (Object.keys(result.unmapped) as DimensionKey[]).reduce((n, d) => n + Object.keys(result.unmapped[d]).length, 0);
    toast.success(`Batch merged into ${campaignKey}.${totalUnmapped ? ` ${totalUnmapped} unmapped value(s) skipped.` : ''}`);
    setResult(null);
  }

  const unmappedTotal = result
    ? (Object.keys(result.unmapped) as DimensionKey[]).reduce((n, d) => n + Object.keys(result.unmapped[d]).length, 0)
    : 0;

  return (
    <div className="glass-card p-4 mb-4" style={{ border: '1px dashed var(--color-border)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 36, height: 36, background: 'var(--color-accent-purple-bg)', color: 'var(--color-accent-purple)' }}>
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              Upload delivery batch
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Drop the ops Excel for <strong>{campaignKey}</strong> — recognised values are counted automatically and added to the totals below. You can still edit anything by hand.
              {learnedCount() + learned > 0 && (
                <> · <span style={{ color: 'var(--color-accent-purple)', fontWeight: 600 }}>{learnedCount() + learned} learned mapping(s)</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary px-3 py-2 flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {busy ? 'Reading…' : 'Upload Excel'}
          </button>
          <button onClick={() => ingest(sampleRows(), 'Sample file')} disabled={busy} className="btn-outline px-3 py-2 flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)' }}>
            <FileSpreadsheet className="w-4 h-4" />
            Try a sample
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
      </div>

      {result && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* Detected columns */}
          <div className="flex flex-wrap gap-2 mb-3" style={{ fontSize: 'var(--font-size-xs)' }}>
            {(Object.keys(result.detected) as DimensionKey[]).map((d) => (
              <span key={d} className="px-2 py-1 rounded-md flex items-center gap-1.5"
                style={{ background: result.detected[d] ? 'var(--color-success-bg)' : 'var(--background-muted)', color: result.detected[d] ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                {result.detected[d] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {DIM_LABEL[d]}: {result.detected[d] || 'not found'}
              </span>
            ))}
            <span className="px-2 py-1 rounded-md" style={{ background: 'var(--background-muted)', color: 'var(--color-text-secondary)' }}>
              {result.rowsCounted.toLocaleString()} leads {result.hasQtyColumn ? '(from quantity column)' : '(row count)'}
            </span>
          </div>

          {/* Mapped counts preview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {(Object.keys(result.counts) as DimensionKey[]).map((d) => {
              const entries = Object.entries(result.counts[d]).sort((a, b) => b[1] - a[1]);
              return (
                <div key={d} className="rounded-lg p-2.5" style={{ background: 'var(--background-muted)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)' }} className="mb-1.5">{DIM_LABEL[d]}</div>
                  {entries.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>—</div>
                  ) : entries.map(([name, n]) => (
                    <div key={name} className="flex justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      <span className="truncate pr-1">{name}</span><span style={{ fontWeight: 600 }}>+{n}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Unmapped review — the learning loop */}
          {unmappedTotal > 0 && (
            <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--color-warning-bg)' }}>
              <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-warning)' }}>
                <AlertTriangle className="w-3.5 h-3.5" /> {unmappedTotal} value(s) not recognised — map once and they're remembered
              </div>
              <div className="space-y-1.5">
                {(Object.keys(result.unmapped) as DimensionKey[]).flatMap((d) =>
                  Object.entries(result.unmapped[d]).map(([raw, n]) => (
                    <div key={`${d}-${raw}`} className="flex items-center gap-2 flex-wrap" style={{ fontSize: 'var(--font-size-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{DIM_LABEL[d]}:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{raw}</strong>
                      <span style={{ color: 'var(--color-text-secondary)' }}>({n})</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
                      <select className="input-base px-2 py-1" style={{ fontSize: '11px' }} defaultValue=""
                        onChange={(e) => e.target.value && resolve(d, raw, e.target.value)}>
                        <option value="" disabled>map to…</option>
                        {DIMENSIONS.find((dim) => dim.key === d)!.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )),
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={merge} className="btn-primary px-4 py-2 flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)' }}>
              <Check className="w-4 h-4" /> Merge into {campaignKey}
            </button>
            <button onClick={() => setResult(null)} className="btn-outline px-4 py-2" style={{ fontSize: 'var(--font-size-sm)' }}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
