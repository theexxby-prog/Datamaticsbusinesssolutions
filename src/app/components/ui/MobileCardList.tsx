import type { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';

// ─── MobileCardList ──────────────────────────────────────────────────────────
// The standard mobile companion for a bespoke desktop <table>: the caller
// wraps its table in `hidden md:block` and renders this with `md:hidden`.
// Each row becomes a stacked card — bold title line, optional status badge,
// label/value rows, and an optional action row — sized for touch. Chrome
// matches DataTable's card view so lists feel identical across the app.

export interface CardField<T> {
  label: string;
  icon?: LucideIcon;
  value: (row: T) => ReactNode;
  /** Skip the row when `value` returns null/undefined/''. */
  hideWhenEmpty?: boolean;
}

interface MobileCardListProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  /** Bold first line of the card — the row's identity. */
  title: (row: T) => ReactNode;
  /** Optional badge slot rendered top-right (e.g. a StatusBadge). */
  badge?: (row: T) => ReactNode;
  fields: CardField<T>[];
  /** Optional bottom action row (buttons); receives the row. */
  actions?: (row: T) => ReactNode;
  onClick?: (row: T) => void;
  /** Callers typically pass "md:hidden". */
  className?: string;
  /** Shown when `rows` is empty; keep it short and helpful. */
  emptyMessage?: string;
}

export function MobileCardList<T>({
  rows, getRowId, title, badge, fields, actions, onClick, className = '', emptyMessage,
}: MobileCardListProps<T>) {
  if (rows.length === 0) {
    return emptyMessage ? (
      <div
        className={`rounded-2xl border py-8 text-center text-sm ${className}`}
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
      >
        {emptyMessage}
      </div>
    ) : null;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {rows.map(row => {
        return (
          // A div, not a <button>: the actions slot renders buttons of its
          // own and nested buttons are invalid HTML.
          <div
            key={getRowId(row)}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick ? () => onClick(row) : undefined}
            onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(row); } } : undefined}
            className={`w-full rounded-2xl border p-4 text-left ${onClick ? 'cursor-pointer transition-colors active:opacity-90' : ''}`}
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {title(row)}
              </div>
              <span className="flex flex-shrink-0 items-center gap-1.5">
                {badge?.(row)}
                {onClick && <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {fields.map(field => {
                const v = field.value(row);
                if (field.hideWhenEmpty && (v === null || v === undefined || v === '')) return null;
                return (
                  <div key={field.label} className="flex min-h-[24px] items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {field.icon && <field.icon className="h-3.5 w-3.5" />}
                      {field.label}
                    </span>
                    <span className="min-w-0 text-right text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>

            {actions && (
              <div
                className="mt-3 flex items-center gap-2 border-t pt-3"
                style={{ borderColor: 'var(--color-border-light)' }}
                // Keep taps on action buttons from also triggering the card's onClick.
                onClick={e => e.stopPropagation()}
              >
                {actions(row)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
