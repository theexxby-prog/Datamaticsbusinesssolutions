import { useState } from 'react';
import { Check, FileUp, Plus, X } from 'lucide-react';

// ─── Form controls for campaign initiation ───────────────────────────────────
// Chip multi-selects, a free-tag input and mock file slots, shared by the
// targeting / rules / files sections of UnionOpsNewCampaign. All token-clean;
// selected chips use the primary tint + primary type, never white-on-primary.

interface ChipSelectProps {
  label: string;
  required?: boolean;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  error?: string;
}

export function ChipSelect({ label, required, options, values, onChange, error }: ChipSelectProps) {
  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);

  return (
    <div>
      <span className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map(opt => {
          const on = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(opt)}
              className="flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors hover:border-[var(--color-primary)]"
              style={{
                borderColor: on ? 'var(--color-primary)' : 'var(--color-border)',
                background: on ? 'var(--color-primary-tint)' : 'transparent',
                color: on ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {on && <Check className="h-3 w-3" />}
              {opt}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}

interface TagInputProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}

export function TagInput({ label, placeholder, values, onChange, hint }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v || values.some(x => x.toLowerCase() === v.toLowerCase())) { setDraft(''); return; }
    onChange([...values, v]);
    setDraft('');
  };

  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="input-base h-[38px] w-full px-3 text-sm"
          aria-label={label}
        />
        <button type="button" onClick={add} className="btn-outline flex-shrink-0 px-3 py-2 text-sm" aria-label={`Add ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map(v => (
            <span
              key={v}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter(x => x !== v))}
                aria-label={`Remove ${v}`}
                className="transition-colors hover:text-[var(--color-error)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {hint && <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
    </div>
  );
}

interface FileSlotProps {
  label: string;
  hint: string;
  /** Canned filenames the mock "upload" attaches, in order. */
  canned: readonly string[];
  attached: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  error?: string;
}

export function FileSlot({ label, hint, canned, attached, onChange, multi = false, error }: FileSlotProps) {
  const canAttach = multi ? attached.length < canned.length : attached.length === 0;
  const attach = () => {
    const next = canned.find(f => !attached.includes(f));
    if (next) onChange([...attached, next]);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </span>
      {attached.map(f => (
        <div
          key={f}
          className="mb-1.5 flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: 'var(--color-success)', background: 'var(--color-success-bg)' }}
        >
          <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
          <span className="min-w-0 truncate text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{f}</span>
          <button
            type="button"
            onClick={() => onChange(attached.filter(x => x !== f))}
            aria-label={`Remove ${f}`}
            className="ml-auto flex-shrink-0 transition-colors hover:text-[var(--color-error)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {canAttach && (
        <button
          type="button"
          onClick={attach}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-3 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-tint)]"
          style={{ borderColor: error ? 'var(--color-error)' : 'var(--color-border)' }}
        >
          <FileUp className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          <span className="text-[12.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            {attached.length > 0 ? 'Attach another' : 'Attach file'}
          </span>
        </button>
      )}
      {error
        ? <p className="mt-1.5 text-[12px] font-medium" style={{ color: 'var(--color-error)' }}>{error}</p>
        : <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
    </div>
  );
}
