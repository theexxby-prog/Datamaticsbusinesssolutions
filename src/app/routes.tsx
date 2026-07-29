import { createBrowserRouter, type RouteObject } from 'react-router';
import { lazy, Suspense } from 'react';
import { RouteLoader } from './components/RouteLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

// Login is eagerly imported — it is the first thing users see,
// so it must be in the main bundle with zero extra network round-trip.
import Login from './pages/Login';

// All other pages are lazy-loaded (split into separate chunks).
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CampaignList = lazy(() => import('./pages/CampaignList'));
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

// Wraps every lazy page in a Suspense boundary with a slim top-bar loader.
// The full SplashLoader is intentionally NOT used here — it is too intrusive
// for route-to-route navigation. RouteLoader is a 2px brand-coloured bar
// that's barely noticeable and doesn't disrupt the user's context.
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return () => (
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  );
};

const routes: RouteObject[] = [
  // Login rendered directly — no Suspense needed, no lazy chunk to wait for.
  {
    path: '/',
    Component: Login,
  },
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
    Component: () => {
      const SuspendedPage = withSuspense(AdminManagementPage);
      return (
        <ProtectedRoute blockClient={true} requireManager={true}>
          <SuspendedPage />
        </ProtectedRoute>
      );
    }
  },
  {
    path: '/internal/ops-override',
    Component: () => {
      const SuspendedPage = withSuspense(OpsOverridePage);
      return (
        <ProtectedRoute blockClient={true} requireManager={true}>
          <SuspendedPage />
        </ProtectedRoute>
      );
    }
  },
  {
    path: '/internal/demographics',
    Component: () => {
      const SuspendedPage = withSuspense(DemographicsEntryPage);
      return (
        <ProtectedRoute blockClient={true} requireManager={true}>
          <SuspendedPage />
        </ProtectedRoute>
      );
    }
  },
  {
    path: '*',
    Component: withSuspense(NotFound),
  },
];

// Every route gets an error boundary, applied here rather than per-entry so a
// route added later cannot silently miss one. Without it, a single page that
// throws replaces the whole app — sidebar and all — and there is nothing left
// on screen to navigate with.
export const router = createBrowserRouter(
  routes.map(route => ({ ErrorBoundary: RouteErrorBoundary, ...route })),
);