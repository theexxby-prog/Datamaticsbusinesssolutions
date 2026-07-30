import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LeftSidebar } from './LeftSidebar';
import { MobileTabBar } from './MobileTabBar';
import { DemoRibbon } from './DemoRibbon';
import { IS_CLIENT_DEMO, isInternalPath } from '../config/demo';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Client demo mode: internal routes do not exist — hard-redirect to the
  // client dashboard even on direct URL entry.
  useEffect(() => {
    if (IS_CLIENT_DEMO && isInternalPath(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (IS_CLIENT_DEMO && isInternalPath(location.pathname)) {
    return null; // guard against a flash of internal content before redirect
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--color-main-bg)' }}
    >
      {/* Desktop sidebar — hidden on mobile, replaced by MobileTabBar */}
      <LeftSidebar />
      <DemoRibbon />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 overflow-y-auto h-screen flex flex-col">
        <div className="flex-1">
          {children}
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
