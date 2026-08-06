import { useMemo } from 'react';
import {
  LayoutDashboard,
  BarChart2,
  Globe,
  Users,
  FileBarChart,
  Settings,
  Receipt,
  FolderOpen,
  Upload,
  UsersRound,
  UserCircle,
  Layers,
  MessageSquare,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../context/AuthContext';
import { allClients, recentUploadBatches } from '../data/mockClients';
import { getPendingSubmissions } from '../mockData';
import { mockInvoiceRecords } from '../data/mockInvoiceRecords';
import { getUnionPrefsSnapshot } from './unionPrefs';

// ─── Shared navigation config ────────────────────────────────────────────────
// Single source of truth for role-based navigation, consumed by LeftSidebar
// (desktop rail), MobileTabBar + MoreSheet (mobile), and MobileAppBar (page
// titles). Items reference badge counts by key so every surface shows the
// same numbers.

export type BadgeKey =
  | 'activeCampaigns'
  | 'clientActiveCampaigns'
  | 'pendingApprovals'
  | 'processingUploads'
  | 'unpaidInvoices'
  | 'openSupportTickets';

export interface NavItem {
  name: string;
  icon: LucideIcon;
  path: string;
  section: 'PLATFORM' | 'ORGANIZATION';
  badgeKey?: BadgeKey;
  /** Elevated centre button treatment on the mobile tab bar. */
  primary?: boolean;
}

export type NavBadges = Record<BadgeKey, number>;

// Badge counts, derived from the mock datasets so they can never contradict
// the pages they summarize. Memoized because the source arrays are
// module-level constants that never change at runtime.
export function useNavBadges(): NavBadges {
  return useMemo(() => {
    const processingUploads = recentUploadBatches.filter(u => u.status === 'processing').length;
    const activeCampaigns = allClients.reduce(
      (sum, c) => sum + c.campaigns.filter(camp => camp.status === 'active').length,
      0,
    );
    const pendingApprovals = getPendingSubmissions().length;

    // Client-scoped: only count campaigns belonging to client_1 (The Channel Company)
    const clientData = allClients.find(c => c.id === 'client_1');
    const clientActiveCampaigns = clientData?.campaigns.filter(c => c.status === 'active').length ?? 0;

    const unpaidInvoices = mockInvoiceRecords.filter(
      inv => inv.clientId === 'client_1' && (inv.stage === 'sent' || inv.stage === 'overdue'),
    ).length;

    // Matches the Support page's own "Active" count.
    const openSupportTickets = 1;

    return {
      processingUploads,
      activeCampaigns,
      pendingApprovals,
      clientActiveCampaigns,
      unpaidInvoices,
      openSupportTickets,
    };
  }, []);
}

/**
 * @param showFuture — true only for the UNION preview login (see
 * config/demo.ts showFutureModules). Programmatic no longer gets its own nav
 * item — it merged into Campaigns — but the parameter stays so future
 * UNION-only modules can hook in without touching every caller.
 * @param unionOps — true only for the UNION OPS login (isUnionOps): the
 * operations mirror gets its own pipeline-first nav instead of the standard
 * internal ops nav.
 */
export function getNavForRole(role: UserRole | undefined, showFuture = false, unionOps = false): NavItem[] {
  if (unionOps) {
    return [
      { name: 'Pipeline', icon: LayoutDashboard, path: '/ops-union', section: 'PLATFORM' },
      { name: 'Data Intake', icon: Upload, path: '/ops-union/intake', section: 'PLATFORM', primary: true },
      { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
    ];
  }

  if (role === 'ops_manager') {
    // Mirrors production nav (pulse.datamaticsbpm.com): Dashboard, All Campaigns,
    // Admin Management, Metrics Override, Lead Demographics + the Phase 2 modules.
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/ops', section: 'PLATFORM' },
      { name: 'All Campaigns', icon: Layers, path: '/internal/campaigns', section: 'PLATFORM', badgeKey: 'activeCampaigns' },
      { name: 'Admin Management', icon: UsersRound, path: '/internal/admin', section: 'PLATFORM' },
      { name: 'Metrics Override', icon: BarChart2, path: '/internal/ops-override', section: 'PLATFORM' },
      { name: 'Lead Demographics', icon: Globe, path: '/internal/demographics', section: 'PLATFORM' },
      { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'PLATFORM' },
      { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'PLATFORM' },
      { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
    ];
  }

  if (role === 'campaign_manager' || role === 'campaign_backup') {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/manager', section: 'PLATFORM' },
      { name: 'Campaigns', icon: BarChart2, path: '/internal/campaigns', section: 'PLATFORM', badgeKey: 'activeCampaigns' },
      { name: 'Approvals', icon: ClipboardCheck, path: '/internal/approvals', section: 'PLATFORM', badgeKey: 'pendingApprovals' },
      { name: 'Upload Leads', icon: Upload, path: '/internal/leads', section: 'PLATFORM', badgeKey: 'processingUploads', primary: true },
      { name: 'Reports', icon: FileBarChart, path: '/internal/reports', section: 'PLATFORM' },
      { name: 'Metrics Override', icon: BarChart2, path: '/internal/ops-override', section: 'PLATFORM' },
      { name: 'Lead Demographics', icon: Globe, path: '/internal/demographics', section: 'PLATFORM' },
      { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'ORGANIZATION' },
      { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'ORGANIZATION' },
      { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
      { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
    ];
  }

  if (role === 'account_manager') {
    return [
      { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'PLATFORM' },
      { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'PLATFORM' },
      { name: 'Campaigns', icon: BarChart2, path: '/internal/campaigns', section: 'PLATFORM' },
      { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
      { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
    ];
  }

  if (role === 'accounts') {
    return [
      { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'PLATFORM' },
      { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'PLATFORM' },
      { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
      { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
    ];
  }

  // Client role. For the UNION preview, the "Invoices & documents" widget
  // toggle governs the whole surface — dashboard card AND these menu items.
  const hideInvoicesDocs = showFuture && !getUnionPrefsSnapshot().widgets.invoicesDocs;
  return [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', section: 'PLATFORM' },
    { name: 'Campaigns', icon: BarChart2, path: '/campaigns', section: 'PLATFORM', badgeKey: 'clientActiveCampaigns' },
    // No count badge on Leads: the sidebar total (all leads delivered to date)
    // and the Leads page header (the current lead table) legitimately differ,
    // and showing both side by side reads as a bug.
    { name: 'Leads', icon: Users, path: '/leads', section: 'PLATFORM' },
    { name: 'Reports', icon: FileBarChart, path: '/reports', section: 'PLATFORM' },
    ...(hideInvoicesDocs
      ? []
      : [
          { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'ORGANIZATION' as const, badgeKey: 'unpaidInvoices' as const },
          { name: 'Documents', icon: FolderOpen, path: '/documents', section: 'ORGANIZATION' as const },
        ]),
    { name: 'Support', icon: MessageSquare, path: '/support', section: 'ORGANIZATION', badgeKey: 'openSupportTickets' },
    { name: 'Account', icon: UserCircle, path: '/account', section: 'ORGANIZATION' },
    { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
  ];
}

// Which nav paths get a slot on the bottom tab bar (max 4 — the 5th slot is
// the More tab). Everything else lands in the More sheet, so no role ever
// loses a section on mobile.
const TAB_PATHS_BY_ROLE: Record<UserRole, string[]> = {
  client: ['/dashboard', '/campaigns', '/leads', '/invoices'],
  campaign_manager: ['/dashboard/manager', '/internal/campaigns', '/internal/leads', '/internal/approvals'],
  campaign_backup: ['/dashboard/manager', '/internal/campaigns', '/internal/leads', '/internal/approvals'],
  ops_manager: ['/dashboard/ops', '/internal/campaigns', '/internal/admin', '/internal/ops-override'],
  account_manager: ['/documents', '/invoices', '/internal/campaigns'],
  accounts: ['/invoices', '/documents'],
};

export function getTabsForRole(role: UserRole | undefined, showFuture = false, unionOps = false): { tabs: NavItem[]; more: NavItem[] } {
  const nav = getNavForRole(role, showFuture, unionOps);
  const tabPaths = unionOps
    ? ['/ops-union', '/ops-union/intake', '/account']
    : TAB_PATHS_BY_ROLE[role ?? 'client'] ?? TAB_PATHS_BY_ROLE.client;
  const tabs = tabPaths
    .map(path => nav.find(item => item.path === path))
    .filter((item): item is NavItem => Boolean(item));
  const more = nav.filter(item => !tabPaths.includes(item.path));
  return { tabs, more };
}

// Short titles for the mobile tab bar — the sidebar's longer labels don't fit
// under a 10px tab caption.
const TAB_SHORT_NAMES: Record<string, string> = {
  'All Campaigns': 'Campaigns',
  'Admin Management': 'Admin',
  'Metrics Override': 'Override',
  'Upload Leads': 'Upload',
  Dashboard: 'Home',
};

export function tabLabel(item: NavItem): string {
  return TAB_SHORT_NAMES[item.name] ?? item.name;
}

export interface PageMeta {
  title: string;
  showBack: boolean;
}

// Detail/secondary routes that are not in any nav array, or that want a back
// chevron instead of the logo. Checked before the nav prefix match.
const DETAIL_ROUTES: Array<{ pattern: RegExp; meta: PageMeta }> = [
  { pattern: /^\/campaigns\/[^/]+$/, meta: { title: 'Campaign', showBack: true } },
  { pattern: /^\/internal\/campaigns\/[^/]+$/, meta: { title: 'Campaign', showBack: true } },
  { pattern: /^\/payment(\/[^/]+)?$/, meta: { title: 'Payment', showBack: true } },
  { pattern: /^\/dashboard\/ops\/team$/, meta: { title: 'Team', showBack: true } },
  { pattern: /^\/internal\/dashboard$/, meta: { title: 'Dashboard', showBack: false } },
  { pattern: /^\/internal\/uploads$/, meta: { title: 'Upload Leads', showBack: false } },
  { pattern: /^\/internal\/client-assignment$/, meta: { title: 'Client Assignment', showBack: false } },
  // Explicit entries so the mobile app-bar title never depends on whether the
  // nav item is visible (the routes themselves are gated in AppLayout).
  { pattern: /^\/programmatic$/, meta: { title: 'Programmatic', showBack: false } },
  { pattern: /^\/ops-union$/, meta: { title: 'Pipeline', showBack: false } },
  { pattern: /^\/ops-union\/intake$/, meta: { title: 'Data Intake', showBack: false } },
  { pattern: /^\/leads\/account\/[^/]+$/, meta: { title: 'Account briefing', showBack: true } },
  { pattern: /^\/leads\/[^/]+$/, meta: { title: 'Lead briefing', showBack: true } },
];

export function getPageMeta(pathname: string, role: UserRole | undefined): PageMeta {
  for (const { pattern, meta } of DETAIL_ROUTES) {
    if (pattern.test(pathname)) return meta;
  }
  // Longest-prefix match against the role's nav so `/campaigns` beats `/`.
  const nav = getNavForRole(role);
  let best: NavItem | undefined;
  for (const item of nav) {
    const matches = pathname === item.path || pathname.startsWith(item.path + '/');
    if (matches && (!best || item.path.length > best.path.length)) best = item;
  }
  return { title: best?.name ?? 'Datamatics', showBack: false };
}

export function roleLabel(role: UserRole | undefined): string {
  switch (role) {
    case 'campaign_manager':
      return 'Campaign Manager';
    case 'campaign_backup':
      return 'Campaign Backup';
    case 'account_manager':
      return 'Account Manager';
    case 'accounts':
      return 'Accounts';
    case 'ops_manager':
      return 'Operations Manager';
    default:
      return 'Client';
  }
}
