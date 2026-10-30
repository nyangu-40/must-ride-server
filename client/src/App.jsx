import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
const PlatformHomePage = lazy(() => import('./pages/PlatformHomePage.jsx'));
const PublicOrganizerPage = lazy(() => import('./pages/PublicOrganizerPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const OrganizerSignupPage = lazy(() => import('./pages/OrganizerSignupPage.jsx'));
const OrganizerApplicationStatus = lazy(() => import('./pages/OrganizerApplicationStatus.jsx'));
const OrganizerLayout = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerLayout })));
const OrganizerOverview = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerOverview })));
const OrganizerTrips = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerTrips })));
const OrganizerTripDetail = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerTripDetail })));
const OrganizerWallet = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerWallet })));
const OrganizerBranding = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerBranding })));
const OrganizerAccount = lazy(() => import('./pages/OrganizerDashboard.jsx').then((module) => ({ default: module.OrganizerAccount })));
const PlatformLayout = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformLayout })));
const PlatformOverview = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformOverview })));
const PlatformApplications = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformApplications })));
const PlatformOrganizers = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformOrganizers })));
const PlatformOrganizerDetail = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformOrganizerDetail })));
const PlatformTransactions = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformTransactions })));
const PlatformPayouts = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformPayouts })));
const PlatformReconciliation = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformReconciliation })));
const PlatformAuditLog = lazy(() => import('./pages/PlatformAdmin.jsx').then((module) => ({ default: module.PlatformAuditLog })));
import RequireRole from './auth/RequireRole.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useAuth } from './auth/AuthProvider.jsx';
import Layout from './layouts/Layout';

function ViewAsBanner() {
  const { impersonating, organizer, exitViewAs } = useAuth();
  const navigate = useNavigate();
  if (!impersonating) return null;
  async function exit() {
    try {
      await exitViewAs();
      navigate('/platform', { replace: true });
    } catch (error) {
      console.error('Unable to exit read-only view:', error);
    }
  }
  return <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3 rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-amber-950">
    <span>Viewing as {organizer?.name || 'organizer'} (read-only)</span>
    <button onClick={exit} className="rounded-full border border-amber-900/30 px-4 py-1.5">Exit</button>
  </div>;
}

function App() {
  return (
    <AuthProvider>
      <Layout>
        <ViewAsBanner />
        <Suspense fallback={<div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 text-center text-slate-600">Loading page...</div>}>
          <Routes>
            <Route path="/" element={<PlatformHomePage />} />
            <Route path="/o/:slug" element={<PublicOrganizerPage />} />
            <Route path="/o/:slug/trip/:tripId" element={<RegisterPage />} />
            <Route path="/register" element={<Navigate to="/o/mpoto-ride" replace />} />
            <Route path="/receipt/:id" element={<ReceiptPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/become-organizer" element={<OrganizerSignupPage />} />
            <Route path="/application-status" element={<RequireRole role="organizer" allowApplicationStatus><OrganizerApplicationStatus /></RequireRole>} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<RequireRole role="organizer"><OrganizerLayout /></RequireRole>}>
              <Route index element={<OrganizerOverview />} />
              <Route path="trips" element={<OrganizerTrips />} />
              <Route path="trips/:tripId" element={<OrganizerTripDetail />} />
              <Route path="wallet" element={<OrganizerWallet />} />
              <Route path="branding" element={<OrganizerBranding />} />
              <Route path="account" element={<OrganizerAccount />} />
            </Route>
            <Route path="/platform" element={<RequireRole role="superadmin"><PlatformLayout /></RequireRole>}>
              <Route index element={<PlatformOverview />} />
              <Route path="applications" element={<PlatformApplications />} />
              <Route path="organizers" element={<PlatformOrganizers />} />
              <Route path="organizers/:id" element={<PlatformOrganizerDetail />} />
              <Route path="transactions" element={<PlatformTransactions />} />
              <Route path="payouts" element={<PlatformPayouts />} />
              <Route path="reconciliation" element={<PlatformReconciliation />} />
              <Route path="audit-log" element={<PlatformAuditLog />} />
            </Route>
          </Routes>
        </Suspense>
      </Layout>
    </AuthProvider>
  );
}

export default App;
