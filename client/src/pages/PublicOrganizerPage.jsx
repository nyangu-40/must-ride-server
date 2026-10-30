import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import api from '../services/api.js';
import { getBrandStyle } from '../utils/branding.js';
import { coverStyle, formatDeparture, priceLabel } from '../utils/trips.js';
import { Badge } from '../components/ui.jsx';

const brandButton = { backgroundColor: 'var(--brand)', color: 'var(--brand-contrast)' };

function SeatsLeft({ trip }) {
  const percent = trip.seat_count > 0 ? Math.min(100, Math.max(0, (trip.seats_left / trip.seat_count) * 100)) : 0;
  return (
    <div>
      <p className="text-sm text-slate-600">
        {trip.seats_left > 0 ? `${trip.seats_left} of ${trip.seat_count} seats left` : 'Fully booked'}
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Seats available"
        aria-valuemin="0" aria-valuemax={trip.seat_count} aria-valuenow={trip.seats_left}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: 'var(--brand)' }} />
      </div>
    </div>
  );
}

function BookButton({ slug, trip, className = '' }) {
  if (trip.seats_left <= 0) {
    return <span className={`inline-flex items-center justify-center rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 ${className}`}>Fully booked</span>;
  }
  return (
    <Link to={`/o/${encodeURIComponent(slug)}/trip/${trip.id}`}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm ${className}`}
      style={brandButton}>
      Register now
    </Link>
  );
}

function OrganizerHeader({ organizer, compact }) {
  if (compact) {
    return (
      <header className="flex items-center justify-between gap-3 px-5 py-3 sm:px-8" style={brandButton}>
        <div className="flex min-w-0 items-center gap-3">
          {organizer.logo_url && <img src={organizer.logo_url} alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />}
          <p className="truncate font-semibold">{organizer.name}</p>
        </div>
        {organizer.contact_phone && <p className="shrink-0 text-sm opacity-90">{organizer.contact_phone}</p>}
      </header>
    );
  }
  return (
    <header className="px-6 py-10 text-center sm:px-10" style={brandButton}>
      {organizer.logo_url && <img src={organizer.logo_url} alt={`${organizer.name} logo`} className="mx-auto mb-4 h-16 w-16 rounded-full bg-white object-contain p-1" />}
      <h1 className="text-3xl font-semibold sm:text-4xl">{organizer.name}</h1>
      {organizer.tagline && <p className="mx-auto mt-3 max-w-xl opacity-90">{organizer.tagline}</p>}
      {organizer.contact_phone && <p className="mt-2 text-sm opacity-80">Contact: {organizer.contact_phone}</p>}
    </header>
  );
}

function FeaturedTrip({ organizer, trip, slug }) {
  const amenities = trip.amenities || [];
  return (
    <div>
      <div className="relative" style={coverStyle(trip.cover_image_url)}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.30), rgba(15,23,42,0.80))' }} />
        <div className="relative flex min-h-[22rem] flex-col items-center justify-end gap-2 px-6 pb-8 pt-16 text-center text-white sm:min-h-[26rem] sm:px-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/80">{organizer.tagline || 'Book your seat online'}</p>
          <h1 className="text-3xl font-semibold sm:text-5xl">{trip.title}</h1>
          <p className="text-lg text-white/95">{trip.origin} <span aria-hidden="true">→</span> {trip.destination}</p>
          <p className="text-sm text-white/80">{formatDeparture(trip.departure_at)}</p>
          {trip.description && <p className="mt-1 max-w-xl text-white/90">{trip.description}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-8" style={{ backgroundColor: 'color-mix(in srgb, var(--brand) 8%, white)' }}>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-slate-600">{trip.price_mode === 'flexible' ? 'Choose your amount per seat' : 'Seat price'}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{priceLabel(trip)}</p>
            <div className="mx-auto mt-4 max-w-xs text-left"><SeatsLeft trip={trip} /></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-center text-sm text-slate-600">On board</p>
            {amenities.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {amenities.map((item) => <li key={item} className="flex items-center gap-2 text-slate-800">
                  <Check size={16} aria-hidden="true" style={{ color: 'var(--brand)' }} /> {item}
                </li>)}
              </ul>
            ) : <p className="mt-3 text-center text-slate-700">Easy online booking and secure payment.</p>}
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <BookButton slug={slug} trip={trip} className="w-full max-w-sm text-base" />
          <Badge className="gap-1"><ShieldCheck size={14} aria-hidden="true" /> Secure payment</Badge>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, slug }) {
  const amenities = (trip.amenities || []).slice(0, 3);
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="h-40 w-full" style={coverStyle(trip.cover_image_url)} role="img" aria-label={trip.cover_image_url ? `${trip.title} cover` : ''} />
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-xl font-semibold text-slate-900">{trip.title}</h2>
        <p className="mt-1 text-slate-700">{trip.origin} <span aria-hidden="true">→</span> {trip.destination}</p>
        <p className="mt-1 text-sm text-slate-600">{formatDeparture(trip.departure_at)}</p>
        {trip.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{trip.description}</p>}
        {amenities.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
          {amenities.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{item}</span>)}
        </div>}
        <div className="mt-4"><SeatsLeft trip={trip} /></div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-600">Per seat</p>
            <p className="text-xl font-semibold text-slate-900">{priceLabel(trip)}</p>
          </div>
          <BookButton slug={slug} trip={trip} />
        </div>
      </div>
    </article>
  );
}

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
    return <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-center shadow-soft">Loading...</section>;
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
  const featured = !bookingsClosed && trips.length === 1;

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-soft shadow-slate-200"
      style={getBrandStyle(organizer.primary_color)}>
      <OrganizerHeader organizer={organizer} compact={featured} />

      {featured ? <FeaturedTrip organizer={organizer} trip={trips[0]} slug={slug} /> : (
        <div className="p-5 sm:p-8">
          {bookingsClosed ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
              <h2 className="text-xl font-semibold text-amber-900">Bookings are currently closed</h2>
              <p className="mt-2 text-amber-800">Please check back later or contact the organiser for assistance.</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-700">
              <p className="font-medium">There are no open trips at the moment.</p>
              {organizer.contact_phone && <p className="mt-1 text-sm">Contact {organizer.name} on {organizer.contact_phone} to ask about the next trip.</p>}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {trips.map((trip) => <TripCard key={trip.id} trip={trip} slug={slug} />)}
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-col items-center gap-1 border-t border-slate-100 px-6 py-5 text-center text-xs text-slate-600">
        <span className="inline-flex items-center gap-1"><ShieldCheck size={14} aria-hidden="true" /> Payments are verified securely</span>
        <span>Powered by Tiyende Bookings</span>
      </footer>
    </section>
  );
}

export default PublicOrganizerPage;
