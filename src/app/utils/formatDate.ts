// ─── Timezone-safe date formatting ───────────────────────────────────────────
// `new Date('2026-08-27')` is parsed by JS as UTC midnight, so in any timezone
// west of UTC it renders as the *previous* day — an invoice due Aug 27 shows as
// "Aug 26" to a client in New York. Full ISO timestamps ('2026-08-27T14:30:00Z')
// are real instants and must keep their UTC parsing.
//
// These helpers tell the two apart: a bare YYYY-MM-DD is treated as a calendar
// date in the viewer's own timezone, everything else is left alone.

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parses an ISO string, treating bare calendar dates as local rather than UTC. */
export function parseDate(iso: string): Date {
  if (DATE_ONLY.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

const DEFAULT_OPTS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

/**
 * Formats a date for display as `Jan 15, 2026`, matching the house style.
 * Returns an empty string for missing input so callers can drop it inline.
 */
export function formatDate(iso?: string, opts: Intl.DateTimeFormatOptions = DEFAULT_OPTS): string {
  if (!iso) return '';
  const d = parseDate(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', opts);
}

/** Short form without the year — `Jan 15`. */
export function formatDateShort(iso?: string): string {
  return formatDate(iso, { month: 'short', day: 'numeric' });
}

/** Long form — `January 15, 2026`. */
export function formatDateLong(iso?: string): string {
  return formatDate(iso, { year: 'numeric', month: 'long', day: 'numeric' });
}
