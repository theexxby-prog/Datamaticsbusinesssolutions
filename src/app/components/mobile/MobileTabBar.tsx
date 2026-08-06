import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTabsForRole, tabLabel, useNavBadges, type NavItem } from '../../config/navigation';
import { showFutureModules, isUnionOps } from '../../config/demo';
import { MoreSheet } from './MoreSheet';
import { useUnionPrefs } from '../../config/unionPrefs';

// Bottom tab bar: up to four primary destinations per role plus a "More" tab
// that opens a sheet with everything else. Driven by the same navigation
// config as the desktop sidebar so both always agree.
export function MobileTabBar() {
  const { currentUser } = useAuth();
  const unionPrefs = useUnionPrefs();
  const navigate = useNavigate();
  const location = useLocation();
  const badges = useNavBadges();
  const [moreOpen, setMoreOpen] = useState(false);

  const { tabs, more } = useMemo(
    () => getTabsForRole(currentUser?.role, showFutureModules(currentUser), isUnionOps(currentUser)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, unionPrefs],
  );

  const isItemActive = (item: NavItem) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  // "More" lights up when the current page lives inside the sheet.
  const moreActive = !tabs.some(isItemActive) && more.some(isItemActive);
  const moreBadgeCount = more.reduce(
    (sum, item) => sum + (item.badgeKey ? badges[item.badgeKey] : 0),
    0,
  );

  const renderLabel = (text: string, active: boolean) => (
    <span
      style={{
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        marginTop: 3,
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </span>
  );

  return (
    <>
      <nav
        className="mobile-tab-bar md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-end"
        style={{
          background: 'var(--color-surface-raised)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex w-full items-end px-2 pt-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = isItemActive(tab);
            const count = tab.badgeKey ? badges[tab.badgeKey] : 0;

            if (tab.primary) {
              // Elevated centre button (e.g. Upload for campaign managers)
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex min-h-[56px] flex-1 flex-col items-center pb-2"
                  aria-label={tab.name}
                >
                  <div
                    className="-mt-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
                    style={{
                      background: isActive
                        ? 'var(--color-primary-dark)'
                        : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                      boxShadow: '0 4px 16px rgba(186,32,39,0.35)',
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: '#fff' }} />
                  </div>
                  {renderLabel(tabLabel(tab), isActive)}
                </button>
              );
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex min-h-[56px] flex-1 flex-col items-center pb-2 pt-1 transition-colors"
                aria-label={tab.name}
              >
                <span className="relative">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                  />
                  {count > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-white"
                      style={{ background: 'var(--color-primary)', fontSize: '9px', fontWeight: 700 }}
                    >
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                {renderLabel(tabLabel(tab), isActive)}
                {isActive && (
                  <span className="mt-0.5 h-1 w-1 rounded-full" style={{ background: 'var(--color-primary)' }} />
                )}
              </button>
            );
          })}

          {/* More tab — opens the overflow sheet */}
          {more.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex min-h-[56px] flex-1 flex-col items-center pb-2 pt-1 transition-colors"
              aria-label="More"
            >
              <span className="relative">
                <LayoutGrid
                  className="h-5 w-5"
                  style={{ color: moreActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                />
                {moreBadgeCount > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-white"
                    style={{ background: 'var(--color-primary)', fontSize: '9px', fontWeight: 700 }}
                  >
                    {moreBadgeCount > 9 ? '9+' : moreBadgeCount}
                  </span>
                )}
              </span>
              {renderLabel('More', moreActive)}
              {moreActive && (
                <span className="mt-0.5 h-1 w-1 rounded-full" style={{ background: 'var(--color-primary)' }} />
              )}
            </button>
          )}
        </div>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} items={more} badges={badges} />
    </>
  );
}
