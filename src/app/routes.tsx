import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { lazy, Suspense } from 'react';
import { RouteLoader } from './components/RouteLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { AppLayout } from './components/AppLayout';

// Login is eagerly imported — it is the first thing users see,
// so it must be in the main bundle with zero extra network round-trip.
import Login from './pages/Login';

// All other pages are lazy-loaded (split into separate chunks).
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CampaignDetailGlass = lazy(() => import('./pages/CampaignDetailGlass'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Payment = lazy(() => import('./pages/Payment'));
const Account = lazy(() => import('./pages/Account'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const LeadUploadDashboard = lazy(() => import('./pages/LeadUploadDashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const Support = lazy(() => import('./pages/Support'));
const Feedback = lazy(() => import('./pages/Feedback'));
const InternalDashboard = lazy(() => import('./pages/InternalDashboard'));
const InternalCampaignList = lazy(() => import('./pages/InternalCampaignList'));
const InternalCampaignDetail = lazy(() => import('./pages/InternalCampaignDetail'));
const InternalReports = lazy(() => import('./pages/InternalReports'));
const OpsOverviewPage = lazy(() => import('./pages/OpsOverviewPage'));
const ManagerDashboardPage = lazy(() => import('./pages/ManagerDashboardPage'));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage'));
const ClientAssignmentPage = lazy(() => import('./pages/ClientAssignmentPage'));
// The 404 page. (Distinct from RouteErrorBoundary, which handles pages that
// throw — this one handles URLs that don't exist.)
const NotFound = lazy(() => import('./pages/ErrorBoundary'));
const CampaignApprovalsPage = lazy(() => import('./pages/CampaignApprovalsPage'));
const AdminManagementPage = lazy(() => import('./pages/AdminManagementPage'));
const OpsOverridePage = lazy(() => import('./pages/OpsOverridePage'));
const DemographicsEntryPage = lazy(() => import('./pages/DemographicsEntryPage'));
// UNION-preview modules: registered for everyone, but AppLayout redirects any
// non-UNION visit to /dashboard (same pattern as internal routes in demo mode).
// The briefing pages additionally self-guard on unknown ids.
const LeadBriefingPage = lazy(() => import('./pages/LeadBriefingPage'));
const AccountBriefingPage = lazy(() => import('./pages/AccountBriefingPage'));
// UNION OPS mirror: registered for everyone, but AppLayout bounces any
// non-UNION-OPS visit to /dashboard (isUnionOpsPath guard).
const UnionOpsDashboard = lazy(() => import('./pages/ops/UnionOpsDashboard'));
const UnionOpsIntake = lazy(() => import('./pages/ops/UnionOpsIntake'));

// Wraps every lazy page in a Suspense boundary with a slim top-bar loader.
// RouteLoader is a 2px brand-coloured bar that's barely noticeable and
// doesn't disrupt the user's context during route-to-route navigation.
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return () => (
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  );
};

// Guarded pages: the suspense wrapper must be created ONCE at module scope.
// Creating it inside a route's Component body would mint a new component
// identity per render, remounting (and re-suspending) the page each time.
const SuspendedAdmin = withSuspense(AdminManagementPage);
const SuspendedOpsOverride = withSuspense(OpsOverridePage);
const SuspendedDemographics = withSuspense(DemographicsEntryPage);

// Every app route lives under the AppLayout layout route, so the shell
// (sidebar, mobile app bar, tab bar) persists across navigations instead of
// remounting on every page change.
const appRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    Component: withSuspense(HomePage),
  },
  {
    path: '/dashboard/ops',
    Component: withSuspense(OpsOverviewPage),
  },
  {
    path: '/dashboard/ops/team',
    Component: withSuspense(TeamManagementPage),
  },
  {
    path: '/dashboard/manager',
    Component: withSuspense(ManagerDashboardPage),
  },
  {
    path: '/campaigns',
    Component: withSuspense(Dashboard),
  },
  {
    path: '/campaigns/:id',
    Component: withSuspense(CampaignDetailGlass),
  },
  {
    path: '/leads',
    Component: withSuspense(LeadsPage),
  },
  {
    path: '/leads/account/:slug',
    Component: withSuspense(AccountBriefingPage),
  },
  {
    path: '/leads/:leadId',
    Component: withSuspense(LeadBriefingPage),
  },
  {
    path: '/reports',
    Component: withSuspense(ReportsPage),
  },
  {
    path: '/invoices',
    Component: withSuspense(Invoices),
  },
  {
    path: '/payment',
    Component: withSuspense(Payment),
  },
  {
    path: '/payment/:invoiceId',
    Component: withSuspense(Payment),
  },
  {
    path: '/documents',
    Component: withSuspense(Documents),
  },
  {
    path: '/support',
    Component: withSuspense(Support),
  },
  {
    path: '/feedback',
    Component: withSuspense(Feedback),
  },
  {
    path: '/account',
    Component: withSuspense(Account),
  },
  {
    // Programmatic merged into Campaigns — the standalone page retired, old
    // links and bookmarks land on the campaign list instead.
    path: '/programmatic',
    element: <Navigate to="/campaigns" replace />,
  },
  {
    path: '/ops-union',
    Component: withSuspense(UnionOpsDashboard),
  },
  {
    path: '/ops-union/intake',
    Component: withSuspense(UnionOpsIntake),
  },
  {
    path: '/internal/dashboard',
    Component: withSuspense(InternalDashboard),
  },
  {
    path: '/internal/campaigns',
    Component: withSuspense(InternalCampaignList),
  },
  {
    path: '/internal/campaigns/:id',
    Component: withSuspense(InternalCampaignDetail),
  },
  {
    path: '/internal/reports',
    Component: withSuspense(InternalReports),
  },
  {
    path: '/internal/leads',
    Component: withSuspense(LeadUploadDashboard),
  },
  {
    path: '/internal/uploads',
    Component: withSuspense(LeadUploadDashboard),
  },
  {
    path: '/internal/client-assignment',
    Component: withSuspense(ClientAssignmentPage),
  },
  {
    path: '/internal/approvals',
    Component: withSuspense(CampaignApprovalsPage),
  },
  {
    path: '/internal/admin',
    Component: () => (
      <ProtectedRoute blockClient={true} requireManager={true}>
        <SuspendedAdmin />
      </ProtectedRoute>
    ),
  },
  {
    path: '/internal/ops-override',
    Component: () => (
      <ProtectedRoute blockClient={true} requireManager={true}>
        <SuspendedOpsOverride />
      </ProtectedRoute>
    ),
  },
  {
    path: '/internal/demographics',
    Component: () => (
      <ProtectedRoute blockClient={true} requireManager={true}>
        <SuspendedDemographics />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    Component: withSuspense(NotFound),
  },
];

const routes: RouteObject[] = [
  // Login rendered directly — no Suspense needed, no lazy chunk to wait for,
  // and no app shell (it lives outside the AppLayout layout route).
  {
    path: '/',
    Component: Login,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    // Pathless layout route: renders the persistent shell around every page.
    Component: AppLayout,
    ErrorBoundary: RouteErrorBoundary,
    // Every child gets its own error boundary too, applied here rather than
    // per-entry so a route added later cannot silently miss one. A page that
    // throws is replaced by the boundary INSIDE the shell — sidebar and tab
    // bar stay usable.
    children: appRoutes.map(route => ({ ErrorBoundary: RouteErrorBoundary, ...route })),
  },
];

export const router = createBrowserRouter(routes);
