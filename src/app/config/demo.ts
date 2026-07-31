import type { User } from '../context/AuthContext';

/**
 * Client demo mode.
 *
 * When the environment variable VITE_CLIENT_DEMO is set to '1' at build time,
 * the app becomes a client-only demo:
 *   - Login becomes a passcode-gated TCC landing page — no internal personas
 *     exist, and entry requires the shared access code below.
 *   - Every internal route (/internal/*, ops and manager dashboards)
 *     redirects to the client dashboard.
 *   - A "Preview environment" ribbon is shown on every page.
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

// ─── Access-code gate (client demo builds only) ──────────────────────────────
// The shared code TCC uses to enter the portal. Override per deployment with
// VITE_DEMO_PASSCODE on the pulse-client-demo Vercel project; the default
// keeps local `VITE_CLIENT_DEMO=1 npm run dev` working out of the box.
export const DEMO_PASSCODE: string =
  (((import.meta as any).env?.VITE_DEMO_PASSCODE ?? '') as string) || 'channel-2026';

// sessionStorage (per-tab): a refresh mid-session doesn't re-ask for the code,
// a fresh tab does. AuthContext falls back to the client persona when its own
// storage is empty, so Login alone cannot gate the app — AppLayout checks this
// flag and bounces un-gated deep links back to '/'.
const GATE_KEY = 'demo-gate-passed';

export function isDemoGateOpen(): boolean {
  if (!IS_CLIENT_DEMO) return true;
  try {
    return window.sessionStorage.getItem(GATE_KEY) === '1';
  } catch {
    return false;
  }
}

export function openDemoGate(): void {
  try {
    window.sessionStorage.setItem(GATE_KEY, '1');
  } catch {
    /* private mode — the in-page login flow still works, deep links re-ask */
  }
}

// ─── Future modules (Propensity ABM + Relish intelligence previews) ──────────
// Gated per-login, not per-build: only the UNION preview persona sees them.
// Existing logins keep today's portal exactly; the TCC client demo build never
// shows them regardless of user.
export const UNION_USER_ID = 'u9';

export const FUTURE_MODULE_PREFIXES = ['/programmatic'];

export function isFutureModulePath(pathname: string): boolean {
  return FUTURE_MODULE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function showFutureModules(user: Pick<User, 'id'> | null | undefined): boolean {
  return !IS_CLIENT_DEMO && user?.id === UNION_USER_ID;
}
