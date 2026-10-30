import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';
import { getBrandStyle } from '../utils/branding.js';
import { Badge } from '../components/ui.jsx';

function PublicOrganizerPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/api/public/organizers/${encodeURIComponent(slug)}`)
      .then(({ data }) => { if (active) setPage(data); })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || 'Unable to load trips.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-center shadow-soft">Loading organiser...</section>;
  }
  if (error || !page) {
    return <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-center text-red-700 shadow-soft">{error || 'Organizer not found.'}</section>;
  }
  if (page.notAvailable) {
    return <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-900">This organizer is not available yet</h1>
      <p className="mt-2 text-slate-600">This booking page is not currently accepting visitors.</p>
    </section>;
  }

  const { organizer, trips, bookingsClosed } = page;
  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-soft shadow-slate-200"
      style={getBrandStyle(organizer.primary_color)}>
      <header className="bg-emerald-700 px-6 py-10 text-center sm:px-10" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-contrast)' }}>
        {organizer.logo_url && <img src={organizer.logo_url} alt={`${organizer.name} logo`} className="mx-auto mb-4 h-16 w-16 rounded-full bg-white object-contain p-1" />}
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">Bus bookings</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{organizer.name}</h1>
        {organizer.tagline && <p className="mx-auto mt-3 max-w-xl text-white/90">{organizer.tagline}</p>}
        {organizer.contact_phone && <p className="mt-2 text-sm text-white/80">Contact: {organizer.contact_phone}</p>}
      </header>

      <div className="p-5 sm:p-8">
        {bookingsClosed ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-amber-900">Bookings are currently closed</h2>
            <p className="mt-2 text-amber-800">Please check back later or contact the organiser for assistance.</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">There are no open trips at the moment.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <article key={trip.id} className="rounded-3xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">{trip.title}</h2>
                <p className="mt-2 text-slate-600">{trip.origin} <span aria-hidden="true">→</span> {trip.destination}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {trip.departure_at ? new Date(trip.departure_at).toLocaleString() : 'Departure time to be announced'}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Per seat</p>
                    <p className="text-xl font-semibold text-emerald-700">{trip.price_mode === 'flexible' ? `From ${formatCurrency(trip.min_amount)}` : formatCurrency(trip.price_per_seat)}</p>
                    <p className="mt-1 text-xs text-slate-500">{trip.seats_left} seats left</p>
                    <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Seats available" aria-valuemin="0" aria-valuemax={trip.seat_count} aria-valuenow={trip.seats_left}>
                      <div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, (trip.seats_left / trip.seat_count) * 100))}%` }} />
                    </div>
                    <Badge className="mt-3 gap-1"><ShieldCheck size={14} aria-hidden="true" /> Secure payment</Badge>
                  </div>
                  <Link to={`/o/${encodeURIComponent(slug)}/trip/${trip.id}`}
                    className="rounded-full px-5 py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-contrast)' }}>
                    Book seats
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <footer className="flex flex-col items-center gap-1 border-t border-slate-100 px-6 py-5 text-center text-xs text-slate-600"><span className="inline-flex items-center gap-1"><ShieldCheck size={14} aria-hidden="true" /> Payments are verified securely</span><span>Powered by Must Ride</span></footer>
    </section>
  );
}

export default PublicOrganizerPage;
