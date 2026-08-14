import { useMemo, useState, type ReactNode } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '../EmptyState';

// ─── DataTable ───────────────────────────────────────────────────────────────
// The standard for every long list in the app: click-a-header to sort, a
// search box, an optional filter slot, an empty state, and pagination. On a
// phone the same rows render as stacked cards so a wide table never breaks the
// layout. Styled entirely through design tokens, so it follows light/dark.

export interface Column<T> {
  key: string;
  header: string;
  icon?: LucideIcon;
  align?: 'left' | 'right';
  /** Turn off sorting for this column (default on). */
  sortable?: boolean;
  /** Value used when sorting; falls back to the cell text. */
  sortValue?: (row: T) => string | number;
  /** Cell content. */
  render: (row: T) => ReactNode;
  /** Plain text for search + the mobile card label; defaults to render output when a string. */
  text?: (row: T) => string;
  /** Marks the column whose value becomes the mobile card's title. Defaults to the first column. */
  primary?: boolean;
  /** Omit this column from the mobile card entirely (dates, IDs, low-value cells). */
  mobileHidden?: boolean;
  /** Card-specific cell content; falls back to `render`. */
  mobileRender?: (row: T) => ReactNode;
  /** Applied to both th and td — column width (`w-[16%]`) and/or responsive visibility (`hidden xl:table-cell`). */
  widthClass?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Built-in search across each column's `text`. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Extra controls (e.g. a status filter) shown in the toolbar. */
  toolbar?: ReactNode;
  pageSize?: number;
  /**
   * 'fixed' locks column widths (set via each column's widthClass) so the table
   * always fits its container — long text truncates instead of forcing a
   * horizontal scroll. Default 'auto' sizes columns to content.
   */
  layout?: 'auto' | 'fixed';
  empty: { icon: LucideIcon; title: string; description: string };
  /** Optional caption shown above the table (e.g. "24 campaigns"). */
  countLabel?: (n: number) => string;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T>({
  columns, rows, getRowId, onRowClick, searchable = true,
  searchPlaceholder = 'Search…', toolbar, pageSize, layout = 'auto', empty, countLabel,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  const textFor = (col: Column<T>, row: T): string => {
    if (col.text) return col.text(row);
    const r = col.render(row);
    return typeof r === 'string' || typeof r === 'number' ? String(r) : '';
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(row => columns.some(c => textFor(c, row).toLowerCase().includes(q)));
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return filtered;
    const val = (row: T) => (col.sortValue ? col.sortValue(row) : textFor(col, row));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const clampedPage = Math.min(page, totalPages - 1);
  const paged = pageSize ? sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize) : sorted;

  function toggleSort(col: Column<T>) {
    if (col.sortable === false) return;
    if (sortKey !== col.key) { setSortKey(col.key); setSortDir('asc'); return; }
    setSortDir(d => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    if (sortDir === 'desc') setSortKey(null);
  }

  const primaryCol = columns.find(c => c.primary) ?? columns[0];

  return (
    <div>
      {/* Toolbar */}
      {(searchable || toolbar || countLabel) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchable && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border py-2.5 pl-10 pr-3.5 text-sm outline-none transition-shadow focus:ring-2"
                style={{
                  background: 'var(--color-surface-raised)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  // @ts-expect-error CSS var for focus ring colour
                  '--tw-ring-color': 'var(--color-primary-glow)',
                }}
              />
            </div>
          )}
          {toolbar}
          {countLabel && (
            <span className="text-sm text-[var(--color-text-muted)] sm:ml-1">{countLabel(sorted.length)}</span>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border py-10" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}>
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden overflow-hidden rounded-2xl border md:block" style={{ borderColor: 'var(--color-border)' }}>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse ${layout === 'fixed' ? 'table-fixed' : ''}`} style={{ background: 'var(--color-surface-raised)' }}>
                <thead>
                  <tr>
                    {columns.map(col => {
                      const active = sortKey === col.key && sortDir;
                      const SortIcon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
                      return (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col)}
                          className={`select-none whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sortable === false ? '' : 'cursor-pointer'} ${col.widthClass ?? ''}`}
                          style={{
                            color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            borderBottom: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                          }}
                        >
                          <span className={`inline-flex items-center gap-2 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                            {col.icon && <col.icon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />}
                            {col.header}
                            {col.sortable !== false && (
                              <SortIcon className="h-3.5 w-3.5" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: active ? 1 : 0.5 }} />
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(row => (
                    <tr
                      key={getRowId(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`group transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                      style={{ borderTop: '1px solid var(--color-border-light)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-tint)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {columns.map(col => (
                        <td
                          key={col.key}
                          className={`px-4 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.widthClass ?? ''}`}
                          style={{ height: 52, color: 'var(--color-text-primary)', fontWeight: 500, verticalAlign: 'middle' }}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {paged.map(row => (
              <button
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className="w-full rounded-2xl border p-3.5 text-left transition-colors active:opacity-90"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {(primaryCol.mobileRender ?? primaryCol.render)(row)}
                  </div>
                  {onRowClick && (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {columns
                    .filter(c => c.key !== primaryCol.key && !c.mobileHidden)
                    .map(col => (
                      <div key={col.key} className="flex min-h-[24px] items-center justify-between gap-3">
                        <span className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                          {col.icon && <col.icon className="h-3.5 w-3.5" />}{col.header}
                        </span>
                        {/* min-w-0 is load-bearing. A flex child defaults to
                            min-width:auto, so a long value ignores its own
                            `truncate` and pushes past the card: an account's
                            location ran 78px off a 390px screen and was clipped
                            away entirely. The label takes flex-shrink-0 so the
                            value gives way rather than the header. */}
                        <span className="min-w-0 text-right text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {(col.mobileRender ?? col.render)(row)}
                        </span>
                      </div>
                    ))}
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {pageSize && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">
                Page {clampedPage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={clampedPage === 0}
                  className="tap-target inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={clampedPage >= totalPages - 1}
                  className="tap-target inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
