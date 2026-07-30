import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Layers,
  Upload,
  UsersRound,
  BarChart2,
  FileBarChart,
  Users,
  Receipt,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TabItem {
  name: string;
  icon: React.ElementType;
  path: string;
  primary?: boolean; // highlighted center button
}

const tabsByRole: Record<string, TabItem[]> = {
  ops_manager: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/ops' },
    { name: 'Campaigns', icon: Layers, path: '/internal/campaigns' },
    { name: 'Admin', icon: UsersRound, path: '/internal/admin', primary: true },
    { name: 'Override', icon: BarChart2, path: '/internal/ops-override' },
    { name: 'Job Cards', icon: FolderOpen, path: '/documents' },
  ],
  campaign_manager: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/manager' },
    { name: 'Campaigns', icon: BarChart2, path: '/internal/campaigns' },
    { name: 'Upload', icon: Upload, path: '/internal/leads', primary: true },
    { name: 'Reports', icon: FileBarChart, path: '/internal/reports' },
  ],
  campaign_backup: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/manager' },
    { name: 'Campaigns', icon: BarChart2, path: '/internal/campaigns' },
    { name: 'Upload', icon: Upload, path: '/internal/leads', primary: true },
    { name: 'Reports', icon: FileBarChart, path: '/internal/reports' },
  ],
  client: [
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Campaigns', icon: BarChart2, path: '/campaigns' },
    { name: 'Leads', icon: Users, path: '/leads' },
    { name: 'Reports', icon: FileBarChart, path: '/reports' },
    { name: 'Invoices', icon: Receipt, path: '/invoices' },
  ],
  account_manager: [
    { name: 'Job Cards', icon: FolderOpen, path: '/documents' },
    { name: 'Invoices', icon: Receipt, path: '/invoices' },
    { name: 'Campaigns', icon: BarChart2, path: '/internal/campaigns' },
  ],
  accounts: [
    { name: 'Invoices', icon: Receipt, path: '/invoices' },
    { name: 'Job Cards', icon: FolderOpen, path: '/documents' },
  ],
};

export function MobileTabBar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = useMemo(
    () => tabsByRole[currentUser.role] ?? tabsByRole.client,
    [currentUser.role]
  );

  return (
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
      <div className="flex items-end w-full px-2 pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            location.pathname === tab.path ||
            location.pathname.startsWith(tab.path + '/');

          if (tab.primary) {
            // Elevated centre "Upload" button
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center pb-2"
                style={{ minHeight: 56 }}
                aria-label={tab.name}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -mt-4"
                  style={{
                    background: isActive
                      ? 'var(--color-primary-dark)'
                      : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                    boxShadow: '0 4px 16px rgba(186,32,39,0.35)',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#fff' }} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    marginTop: 2,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center pb-2 pt-1 transition-colors"
              style={{ minHeight: 56 }}
              aria-label={tab.name}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  marginTop: 3,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  letterSpacing: '0.02em',
                }}
              >
                {tab.name}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: 'var(--color-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}