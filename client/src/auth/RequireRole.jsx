import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

function RequireRole({ role, children, allowApplicationStatus = false }) {
  const { loading, session, role: currentRole, organizer } = useAuth();
  const location = useLocation();

  if (loading) return <div className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading account...</div>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (currentRole !== role) {
    return <Navigate to={currentRole === 'superadmin' ? '/platform' : currentRole === 'organizer' ? '/dashboard' : '/login'} replace />;
  }
  if (currentRole === 'organizer' && ['pending', 'rejected'].includes(organizer?.status)
    && !allowApplicationStatus && location.pathname !== '/application-status') {
    return <Navigate to="/application-status" replace />;
  }
  if (allowApplicationStatus && organizer?.status === 'active') return <Navigate to="/dashboard" replace />;
  return children;
}

export default RequireRole;
