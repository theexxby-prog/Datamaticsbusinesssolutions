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
} from '../config/demo';

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
  const { currentUser } = useAuth();
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

  // The retail brand: UNION previews the future product, which is Tech Blue.
  // Stamping <html> lets the token layer flip every primary-coloured element
  // without touching components; all other logins keep Datamatics red.
  useEffect(() => {
    const root = document.documentElement;
    if (showFutureModules(currentUser)) root.setAttribute('data-brand', 'union');
    else root.removeAttribute('data-brand');
    return () => root.removeAttribute('data-brand');
  }, [currentUser]);

  useEffect(() => {
    if (gateClosed) {
      navigate('/', { replace: true });
    } else if (blockedInternal || blockedFuture) {
      navigate('/dashboard', { replace: true });
    }
  }, [gateClosed, blockedInternal, blockedFuture, navigate]);

  // With a persistent shell the scroll position no longer resets via remount;
  // reset both scroll containers (document on mobile, inner column on desktop)
  // whenever the route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollColumnRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  if (gateClosed || blockedInternal || blockedFuture) {
    return null; // guard against a flash of blocked content before redirect
  }

  return (
    <div
      className="min-h-dvh md:flex md:h-screen md:w-screen md:overflow-hidden"
      style={{ background: 'var(--color-main-bg)' }}
    >
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
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              © {new Date().getFullYear()} Datamatics Business Solutions. All rights reserved. Authorised users only.
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-border)' }}>·</span>
            <a
              href="mailto:support@datamaticsbpm.com?subject=Datamatics Business Solutions Client Portal"
              style={{ fontSize: '10px', color: 'var(--color-primary)', opacity: 0.6, textDecoration: 'none' }}
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
    </div>
  );
}
