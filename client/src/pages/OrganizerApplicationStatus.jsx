import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import api from '../services/api.js';

function OrganizerApplicationStatus() {
  const { organizer: identityOrganizer, signOut } = useAuth();
  const [organizer, setOrganizer] = useState(identityOrganizer);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/api/organizer/me')
      .then(({ data }) => { if (active) setOrganizer(data.organizer); })
      .catch((requestError) => { if (active) setError(requestError?.response?.data?.message || 'Unable to load application status.'); });
    return () => { active = false; };
  }, []);

  const rejected = organizer?.status === 'rejected';
  return <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-soft">
    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Organizer application</p>
    <h1 className="mt-2 text-2xl font-semibold text-slate-900">{rejected ? 'Application declined' : 'Awaiting approval'}</h1>
    <p className="mt-3 text-slate-600">{rejected ? 'Your application was reviewed and declined.' : 'Thanks for applying. Your booking tools will become available after the platform team approves your application.'}</p>
    {rejected && organizer?.rejection_reason && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-950">Review note</h2><p className="mt-1 text-sm text-amber-900">{organizer.rejection_reason}</p></div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-6"><button onClick={signOut} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Sign out</button></div>
  </section>;
}

export default OrganizerApplicationStatus;
