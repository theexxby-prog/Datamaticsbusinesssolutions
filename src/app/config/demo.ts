/**
 * Client demo mode.
 *
 * When the environment variable VITE_CLIENT_DEMO is set to '1' at build time,
 * the app becomes a client-only demo:
 *   - Login offers only the demo client (Renuka Lawless / The Channel Company) — no
 *     internal personas exist.
 *   - Every internal route (/internal/*, ops and manager dashboards)
 *     redirects to the client dashboard.
 *   - A "Demo environment · Sample data" ribbon is shown on every page.
 *
 * Deployment: create a second Vercel project on the same repo with
 * VITE_CLIENT_DEMO=1 in its environment variables. The main sandbox
 * deployment (no flag) is unaffected.
 */
export const IS_CLIENT_DEMO: boolean =
  ((import.meta as any).env?.VITE_CLIENT_DEMO ?? '') === '1';

/** Route prefixes that must never render in client demo mode. */
export const INTERNAL_ROUTE_PREFIXES = ['/internal', '/dashboard/ops', '/dashboard/manager'];

export function isInternalPath(pathname: string): boolean {
  return INTERNAL_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
