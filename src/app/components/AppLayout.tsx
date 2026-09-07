import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { LeftSidebar } from './LeftSidebar';
import { MobileTabBar } from './mobile/MobileTabBar';
import { MobileAppBar } from './mobile/MobileAppBar';
import { DemoRibbon } from './DemoRibbon';
import { useAuth } from '../context/AuthContext';
import {
  IS_CLIENT_DEMO,
  isInternalPath,
  isDemoGateOpen,
  isFutureModulePath,
  showFutureModules,
  isUnionOps,
  isUnionOpsPath,
} from '../config/demo';
import { Eye } from 'lucide-react';

// The persistent app shell, mounted once as a router layout route. Pages
// render into <Outlet/>; the sidebar, mobile app bar, and tab bar survive
// navigation instead of remounting on every page change.
//
// Scroll model is hybrid: on mobile the document itself scrolls (so the
// browser URL bar can collapse and momentum scroll works), while desktop
// keeps the fixed h-screen shell with the inner column scrolling so the
// sidebar stays put.
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isPreviewingClient, setPreviewingClient } = useAuth();
  const scrollColumnRef = useRef<HTMLDivElement>(null);

  // Three shell-level guards, all enforced here (not just in Login) because
  // AuthContext falls back to the client persona, so deep links never hit the
  // login page:
  //  1. Client demo: internal routes do not exist — redirect to the dashboard.
  //  2. Client demo: the access-code gate must have been passed — else back
  //     to the landing page.
  //  3. Future modules (Propensity/Relish previews) are visible only to the
  //     UNION preview login — everyone else bounces to the dashboard.
  const gateClosed = IS_CLIENT_DEMO && !isDemoGateOpen();
  const blockedInternal = IS_CLIENT_DEMO && isInternalPath(location.pathname);
  const blockedFuture =
    isFutureModulePath(location.pathname) && !showFutureModules(currentUser);
  // The ops mirror belongs to the UNION OPS login alone. While previewing the
  // client, currentUser IS the client — so ops routes bounce there too, which
  // is exactly right: the preview shows only what the client can see.
  const blockedOpsUnion = isUnionOpsPath(location.pathname) && !isUnionOps(currentUser);

  // UNION used to stamp data-brand="union" here, which swapped the token layer
  // over to a blue palette with a gradient canvas and translucent cards. That
  // treatment is gone: every login now shares the Datamatics red-on-white
  // identity, so there is no brand attribute to set. The token layer is the
  // only place colour was defined, so removing the stamp and its rules was the
  // whole revert — no component changed.

  useEffect(() => {
    if (gateClosed) {
      navigate('/', { replace: true });
    } else if (blockedInternal || blockedFuture) {
      navigate('/dashboard', { replace: true });
    } else if (blockedOpsUnion) {
      navigate('/dashboard', { replace: true });
    }
  }, [gateClosed, blockedInternal, blockedFuture, blockedOpsUnion, navigate]);

  // With a persistent shell the scroll position no longer resets via remount;
  // reset both scroll containers (document on mobile, inner column on desktop)
  // whenever the route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollColumnRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  if (gateClosed || blockedInternal || blockedFuture || blockedOpsUnion) {
    return null; // guard against a flash of blocked content before redirect
  }

  return (
    <div className="app-canvas min-h-dvh md:flex md:h-screen md:w-screen md:overflow-hidden">
      {/* Desktop sidebar — hidden on mobile, replaced by MobileAppBar + MobileTabBar */}
      <LeftSidebar />
      <DemoRibbon />

      {/* Main Content Area */}
      <div
        ref={scrollColumnRef}
        className="flex flex-col min-h-dvh md:flex-1 md:min-w-0 md:h-screen md:min-h-0 md:overflow-y-auto"
      >
        <MobileAppBar />
        <div className="flex-1">
          <Outlet />
        </div>
        {/* Footer watermark + disclaimer — hidden on mobile */}
        <div className="hidden sm:flex flex-col items-center justify-center py-3 gap-1 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>Powered by</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em' }}>Datamatics</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>Business Solutions</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              © {new Date().getFullYear()} Datamatics Business Solutions. All rights reserved. Authorised users only.
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }} aria-hidden="true">·</span>
            <a
              href="mailto:support@datamaticsbpm.com?subject=Datamatics Business Solutions Client Portal"
              style={{ fontSize: '11px', color: 'var(--color-primary)', opacity: 0.6, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
            >
              Made with ♥ by Vishal
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar — only visible below md breakpoint */}
      <MobileTabBar />

      {/* UNION OPS previewing the client portal: floating pill with the way
          back. Sits above the mobile tab bar; on desktop it floats free. */}
      {isPreviewingClient && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center md:bottom-5">
          <div
            className="pointer-events-auto flex items-center gap-2.5 rounded-full py-2 pl-4 pr-2 shadow-xl"
            style={{ background: 'var(--color-surface-inverse)', color: 'var(--color-text-inverse)' }}
            data-testid="client-preview-bar"
          >
            <Eye className="h-4 w-4 flex-shrink-0" style={{ opacity: 0.75 }} />
            <span className="text-[13px] font-semibold">
              Viewing as Northwind Technologies
            </span>
            <button
              onClick={() => { setPreviewingClient(false); navigate('/ops-union'); }}
              className="tap-target rounded-full px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-85"
              style={{ background: 'var(--color-text-inverse)', color: 'var(--color-surface-inverse)' }}
            >
              Exit preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
