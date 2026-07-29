import { Component, type ReactNode } from 'react';
import { useRouteError, useLocation, useNavigate, isRouteErrorResponse } from 'react-router';
import { AlertTriangle, RotateCw, LayoutDashboard } from 'lucide-react';
import { AppLayout } from './AppLayout';

// ─── Route-level error boundary ──────────────────────────────────────────────
// Without one of these, any error thrown inside a page bubbles all the way to
// React Router's built-in handler, which replaces the *entire* tree — sidebar
// included. A single broken component then reads as "the whole portal is
// dead", with nothing left on screen to click.
//
// Attached per route (see routes.tsx), the damage is contained: the page is
// replaced by the card below, the shell keeps rendering, and navigation still
// works.

/**
 * A failed dynamic `import()` — the usual cause is a tab left open across a
 * deploy, pointing at chunk filenames that no longer exist on the CDN.
 * Reloading fetches the current index.html and fixes it.
 */
function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg);
}

function describe(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}

function ErrorCard({ error }: { error: unknown }) {
  const navigate = useNavigate();
  const stale = isChunkLoadError(error);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#BA2027]/10">
          <AlertTriangle className="h-7 w-7 text-[#BA2027]" />
        </div>

        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-50">
          {stale ? 'This page needs a refresh' : "This page didn't load"}
        </h2>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {stale
            ? 'The app was updated while this tab was open. Reloading will pick up the latest version.'
            : 'Something went wrong rendering this page. The rest of the portal is unaffected — you can carry on from anywhere in the menu.'}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#BA2027] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A01C22] active:bg-[#8A181D] focus:outline-none focus:ring-2 focus:ring-[#BA2027] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <RotateCw className="h-4 w-4" />
            Reload this page
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BA2027] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to dashboard
          </button>
        </div>

        {!stale && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Technical detail
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-left text-xs text-gray-700 dark:text-gray-300">
              {describe(error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Guards the shell itself. If `AppLayout` is what threw, wrapping the error
 * card in `AppLayout` would throw again and leave a blank screen — so fall
 * back to the bare card.
 */
class ShellGuard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();

  // Surface it — the card deliberately hides the stack from the client.
  console.error('[route error]', location.pathname, error);

  const card = <ErrorCard error={error} />;

  // Login and any other pre-auth route has no shell to preserve.
  if (location.pathname === '/') return card;

  return (
    <ShellGuard fallback={card}>
      <AppLayout>{card}</AppLayout>
    </ShellGuard>
  );
}
