import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

function LoginPage() {
  const { session, role, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to={role === 'superadmin' ? '/platform' : '/dashboard'} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { role: loggedInRole, status } = await signIn(email, password);
      const destination = loggedInRole === 'superadmin' ? '/platform'
        : ['pending', 'rejected'].includes(status) ? '/application-status' : '/dashboard';
      navigate(location.state?.from || destination, { replace: true });
    } catch (loginError) {
      setError(loginError?.response?.data?.message || loginError.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-soft sm:p-9">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Must Ride</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-slate-600">Access your organiser dashboard.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">Email
          <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
        </label>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={submitting} className="w-full rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

export default LoginPage;
