import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BusFront, CheckCircle2, CircleUserRound, LayoutDashboard, LogOut, Palette, WalletCards } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { compressImage } from '../utils/image.js';
import { coverStyle } from '../utils/trips.js';
import { Button, Card, StatCard } from '../components/ui.jsx';
import { SeatLayoutPicker, SeatMap } from '../components/SeatMap.jsx';
import { DEFAULT_SEAT_LAYOUT, SEAT_LAYOUTS, normalizeLayout } from '../utils/seatLayouts.js';

const cardClass = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm';

function useLoad(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(url).then(({ data: result }) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError?.response?.data?.message || 'Unable to load data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [url]);
  return { data, error, loading, setData };
}

const dashboardLinks = [
  ['Overview', '/dashboard', LayoutDashboard],
  ['Trips', '/dashboard/trips', BusFront],
  ['Wallet', '/dashboard/wallet', WalletCards],
  ['Branding', '/dashboard/branding', Palette],
  ['Account', '/dashboard/account', CircleUserRound],
];

function currentSection(pathname) {
  const match = [...dashboardLinks].reverse().find(([, to]) => (to === '/dashboard' ? pathname === to : pathname.startsWith(to)));
  return match ? match[0] : 'Overview';
}

export function OrganizerLayout() {
  const { organizer, user, signOut, impersonating, exitViewAs } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [pathname]);
  const leave = () => (impersonating ? exitViewAs() : signOut());
  const section = currentSection(pathname);
  const initial = (user?.email || organizer?.name || 'O').slice(0, 1).toUpperCase();
  const sideLink = ({ isActive }) => `relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`;
  const tabLink = ({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.7rem] font-medium ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'}`;
  const brandMark = <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white"><BusFront size={18} aria-hidden="true" /></span>;
  const brandLockup = <span className="flex min-w-0 items-center gap-3">{brandMark}<span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">MUST RIDE</span><span className="block truncate text-xs text-slate-500">Tiyende Bookings</span></span></span>;
  return (
    <div className="flex min-h-0 flex-1">
      {/* Sidebar: fixed on desktop, never scrolls with the page */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          {brandLockup}
        </div>
        <nav aria-label="Organizer workspace" className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-4 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
          {dashboardLinks.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} className={sideLink}>
              {({ isActive }) => <>
                {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-emerald-600" aria-hidden="true" />}
                <Icon size={18} aria-hidden="true" /><span>{label}</span>
              </>}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 border-t border-slate-100 p-3">
          <button type="button" onClick={leave} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"><LogOut size={18} aria-hidden="true" /><span>{impersonating ? 'Exit view-as' : 'Sign out'}</span></button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: fixed */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="lg:hidden">{brandLockup}</span>
            <p className="truncate text-sm text-slate-500"><span className="hidden lg:inline">{organizer?.name || 'Organizer'} <span aria-hidden="true">/</span> </span><span className="font-semibold text-slate-900">{section}</span></p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800" aria-hidden="true">{initial}</span>
            <span className="hidden max-w-[14rem] truncate text-sm text-slate-600 sm:block">{user?.email}</span>
          </div>
        </header>

        {/* Only this area scrolls */}
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
            <footer className="mt-10 pb-2 text-center text-xs text-slate-400">Powered by Tiyende Bookings</footer>
          </div>
        </main>

        {/* Mobile tab bar: part of the shell, not floating over content */}
        <nav aria-label="Organizer workspace" className="flex shrink-0 gap-1 border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
          {dashboardLinks.map(([label, to, Icon]) => <NavLink key={to} to={to} end={to === '/dashboard'} className={tabLink}><Icon size={18} aria-hidden="true" /><span>{label}</span></NavLink>)}
          <button type="button" onClick={leave} className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.7rem] font-medium text-slate-600"><LogOut size={18} aria-hidden="true" /><span>{impersonating ? 'Exit' : 'Sign out'}</span></button>
        </nav>
      </div>
    </div>
  );
}

export function OrganizerOverview() {
  const { organizer } = useAuth();
  const { data: registrations, error: registrationsError, loading: registrationsLoading } = useLoad('/api/organizer/registrations');
  const { data: trips, error: tripsError, loading: tripsLoading } = useLoad('/api/organizer/trips');
  const { data: wallet, error: walletError, loading: walletLoading } = useLoad('/api/organizer/wallet');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const paid = (registrations || []).filter((item) => item.payment_status === 'Paid');
  const todayCount = (registrations || []).filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length;
  const loading = registrationsLoading || tripsLoading || walletLoading;
  const errors = [registrationsError, tripsError, walletError].filter(Boolean);
  const publicUrl = `${window.location.origin}/#/o/${organizer?.slug || ''}`;
  async function copyPublicLink() {
    setShareMessage('');
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
      setShareMessage('Copy was blocked by the browser. Select and copy the link above.');
    }
  }
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-slate-900">Overview</h1><p className="mt-1 text-slate-500">Your trips and recent bookings.</p></div>
      {errors.map((error) => <p role="alert" key={error} className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>)}
      {loading ? <p className={cardClass}>Loading your overview...</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Available wallet" value={formatCurrency(wallet?.available_balance || 0)} icon={WalletCards} />
            <StatCard label="Bookings today" value={todayCount} icon={LayoutDashboard} />
            <StatCard label="Seats sold" value={paid.reduce((sum, item) => sum + Number(item.seats || 0), 0)} icon={BusFront} />
          </div>
          <Card className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-ink">Share your booking page</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{organizer?.name || 'Your organizer page'}</h2>
              <p className="mt-1 break-all text-sm text-slate-700">{publicUrl}</p>
              <Button className="mt-4" onClick={copyPublicLink}>{linkCopied ? 'Link copied' : 'Copy your link'}</Button>
              {shareMessage && <p role="status" className="mt-2 text-sm text-amber-900">{shareMessage}</p>}
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3">
              <QRCodeSVG value={publicUrl} size={112} level="M" title="QR code for your public booking page" />
              <p className="max-w-32 text-xs text-slate-700">Scan to open your public booking page.</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-slate-950">Getting started</h2>
            <p className="mt-1 text-sm text-slate-600">Complete these steps to prepare your booking page.</p>
            <ol className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                [Boolean(organizer?.logo_url), 'Add your logo', '/dashboard/branding'],
                [Boolean(trips?.length), 'Create your first trip', '/dashboard/trips'],
                [linkCopied, 'Copy and share your link', null],
              ].map(([done, label, href]) => <li key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <CheckCircle2 size={20} className={done ? 'text-emerald-800' : 'text-slate-400'} aria-hidden="true" />
                {href ? <Link to={href} className="font-medium text-slate-800 underline underline-offset-2">{label}</Link> : <button type="button" onClick={copyPublicLink} className="text-left font-medium text-slate-800 underline underline-offset-2">{label}</button>}
              </li>)}
            </ol>
          </Card>
          <div className={cardClass}>
            <h2 className="font-semibold text-slate-900">Upcoming trips</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {(trips || []).filter((trip) => trip.status !== 'closed').slice(0, 5).map((trip) => (
                <Link key={trip.id} to={`/dashboard/trips/${trip.id}`} className="flex items-center justify-between gap-3 py-3">
                  <span><span className="block font-medium text-slate-800">{trip.title}</span><span className="text-sm text-slate-500">{trip.origin} → {trip.destination}</span></span>
                  <span className="text-sm text-slate-500">{trip.departure_at ? new Date(trip.departure_at).toLocaleDateString() : 'Date TBA'}</span>
                </Link>
              ))}
              {(!trips || trips.length === 0) && <p className="py-4 text-sm text-slate-500">No trips have been created.</p>}
            </div>
          </div>
          <div className={cardClass}>
            <h2 className="font-semibold text-slate-900">Recent bookings</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm"><thead><tr className="text-slate-500"><th className="py-2">Passenger</th><th>Trip</th><th>Seats</th><th>Status</th></tr></thead>
                <tbody>{(registrations || []).slice(0, 6).map((record) => <tr key={record.id} className="border-t border-slate-100"><td className="py-3">{record.fullname}</td><td>{trips?.find((trip) => trip.id === record.trip_id)?.title || 'Trip'}</td><td>{record.selected_seats?.join(', ')}</td><td>{record.payment_status}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const emptyTrip = {
  title: '', origin: '', destination: '', departure_at: '', price_mode: 'fixed',
  price_per_seat: '', min_amount: '', max_amount: '',
  seat_count: 66, seat_layout: DEFAULT_SEAT_LAYOUT, pickup_locations: '', status: 'draft',
  description: '', amenities: '', cover_image_url: '', booking_image_url: '',
};

const splitList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function tripToForm(trip) {
  return {
    title: trip.title || '', origin: trip.origin || '', destination: trip.destination || '',
    departure_at: toLocalInput(trip.departure_at),
    price_mode: trip.price_mode || 'fixed',
    price_per_seat: trip.price_per_seat ?? '', min_amount: trip.min_amount ?? '', max_amount: trip.max_amount ?? '',
    seat_count: trip.seat_count ?? 66,
    seat_layout: normalizeLayout(trip.seat_layout),
    pickup_locations: (trip.pickup_locations || []).join(', '),
    status: trip.status || 'draft',
    description: trip.description || '',
    amenities: (trip.amenities || []).join(', '),
    cover_image_url: trip.cover_image_url || '',
    booking_image_url: trip.booking_image_url || '',
  };
}

function formToPayload(form, includeStatus) {
  const flexible = form.price_mode === 'flexible';
  const payload = {
    title: form.title,
    origin: form.origin,
    destination: form.destination,
    departure_at: form.departure_at ? new Date(form.departure_at).toISOString() : null,
    price_mode: form.price_mode,
    price_per_seat: Number(form.price_per_seat || form.min_amount),
    min_amount: flexible ? Number(form.min_amount) : null,
    max_amount: flexible && form.max_amount !== '' ? Number(form.max_amount) : null,
    seat_count: Number(form.seat_count),
    seat_layout: normalizeLayout(form.seat_layout),
    pickup_locations: splitList(form.pickup_locations),
    description: form.description.trim(),
    amenities: splitList(form.amenities),
    cover_image_url: form.cover_image_url || null,
    booking_image_url: form.booking_image_url || null,
  };
  if (includeStatus) payload.status = form.status;
  return payload;
}

const fieldClass = 'mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2';

export function OrganizerTrips() {
  const { data: trips, error, loading, setData } = useLoad('/api/organizer/trips');
  const [form, setForm] = useState(emptyTrip);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [listMessage, setListMessage] = useState('');
  const formRef = useRef(null);
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const amenityChips = splitList(form.amenities);

  async function saveTrip(event) {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const payload = formToPayload(form, !editingId);
      const { data } = editingId
        ? await api.patch(`/api/organizer/trips/${editingId}`, payload)
        : await api.post('/api/organizer/trips', payload);
      setData((current) => (editingId
        ? (current || []).map((item) => (item.id === editingId ? data : item))
        : [data, ...(current || [])]));
      setForm(emptyTrip);
      setEditingId(null);
      setMessage(editingId ? 'Trip updated.' : 'Trip created.');
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Unable to save trip.');
    } finally { setSaving(false); }
  }

  function startEdit(trip) {
    setEditingId(trip.id);
    setForm(tripToForm(trip));
    setMessage('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyTrip);
    setMessage('');
  }

  const uploadPhoto = (field) => async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage('');
    setUploading(field);
    try {
      const prepared = await compressImage(file);
      const body = new FormData();
      body.append('cover', prepared);
      const { data } = await api.post('/api/organizer/uploads/trip-cover', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setField(field, data.url);
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Unable to upload the photo.');
    } finally { setUploading(''); }
  };

  async function deleteTrip(trip) {
    if (!window.confirm(`Delete "${trip.title}"? This cannot be undone.`)) return;
    setListMessage('');
    try {
      await api.delete(`/api/organizer/trips/${trip.id}`);
      setData((current) => (current || []).filter((item) => item.id !== trip.id));
      if (editingId === trip.id) cancelEdit();
    } catch (requestError) {
      setListMessage(requestError?.response?.data?.message || 'Unable to delete this trip.');
    }
  }

  async function updateStatus(trip, status) {
    try {
      const { data } = await api.patch(`/api/organizer/trips/${trip.id}`, { status });
      setData((current) => current.map((item) => item.id === trip.id ? data : item));
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Unable to update trip status.');
    }
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold">Trips</h1><p className="mt-1 text-slate-500">Create trips, edit them, and control booking availability.</p></div>
      <form ref={formRef} onSubmit={saveTrip} className={`${cardClass} grid gap-3 sm:grid-cols-2`}>
        <h2 className="sm:col-span-2 font-semibold">{editingId ? 'Edit trip' : 'Create a trip'}</h2>
        {[
          ['title', 'Trip name'], ['origin', 'Origin'], ['destination', 'Destination'],
          ['departure_at', 'Departure date and time'],
          ['seat_count', 'Seat count'], ['pickup_locations', 'Pickup locations (comma separated)'],
        ].map(([name, label]) => <label key={name} className="text-sm text-slate-600">{label}
          <input required={name !== 'departure_at'} type={name === 'departure_at' ? 'datetime-local' : name === 'seat_count' ? 'number' : 'text'}
            value={form[name]} onChange={(event) => setField(name, event.target.value)}
            className={fieldClass} />
        </label>)}

        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <legend className="px-2 font-semibold text-slate-800">Bus seat layout</legend>
          <p className="text-sm text-slate-500">Pick the layout that matches your bus. Passengers book on exactly this seat map, and you see the same one on your trip page.</p>
          <SeatLayoutPicker value={form.seat_layout} onChange={(value) => setField('seat_layout', value)} />
          {editingId && <p className="text-xs text-slate-500">The layout can&apos;t be changed once seats have been booked on this trip.</p>}
          <details className="rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Preview of {SEAT_LAYOUTS[normalizeLayout(form.seat_layout)].label} with {Number(form.seat_count) || 0} seats</summary>
            <SeatMap className="mt-3" seatCount={Math.min(Number(form.seat_count) || 0, 1000)} layout={form.seat_layout} />
          </details>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <legend className="px-2 font-semibold text-slate-800">Look of your booking page</legend>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['cover_image_url', 'Landing page photo', 'Shown on your public page and on the trip card.'],
                ['booking_image_url', 'Registration page photo', 'Shown at the top of the booking page, for example the inside of the bus.'],
              ].map(([field, title, help]) => (
                <div key={field} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <div className="mt-2 h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100" style={form[field] ? coverStyle(form[field]) : undefined} role="img" aria-label={form[field] ? `${title} preview` : `No ${title.toLowerCase()} yet`} />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50">
                      {uploading === field ? 'Uploading...' : form[field] ? 'Change photo' : 'Add photo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPhoto(field)} disabled={Boolean(uploading)} className="sr-only" />
                    </label>
                    {form[field] && <button type="button" onClick={() => setField(field, '')} className="text-sm text-red-700 underline">Remove</button>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{help} JPG, PNG or WebP, resized automatically.</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">Description (optional)
                <textarea rows={3} maxLength={600} value={form.description} onChange={(event) => setField('description', event.target.value)}
                  placeholder="Tell passengers what to expect on this trip." className={fieldClass} />
              </label>
              <label className="block text-sm text-slate-600">On board (comma separated, optional)
                <input value={form.amenities} onChange={(event) => setField('amenities', event.target.value)}
                  placeholder="Comfortable seats, Charging ports, Snacks" className={fieldClass} />
              </label>
              {amenityChips.length > 0 && <div className="flex flex-wrap gap-2">{amenityChips.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{item}</span>)}</div>}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <legend className="px-2 font-semibold text-slate-800">Pricing</legend>
          <label className="block text-sm text-slate-600">Price type
            <select value={form.price_mode} onChange={(event) => setField('price_mode', event.target.value)} className={fieldClass}>
              <option value="fixed">Fixed price</option><option value="flexible">Passenger chooses amount</option>
            </select>
          </label>
          {form.price_mode === 'fixed' ? <label className="block text-sm text-slate-600">Price per seat (MWK)
            <input required type="number" min="100" step="1" value={form.price_per_seat} onChange={(event) => setField('price_per_seat', event.target.value)} className={fieldClass} />
          </label> : <>
            <p className="text-sm text-slate-500">Passengers choose a whole-number amount per seat between your limits. The total is calculated securely when they book.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-slate-600">Minimum per seat (MWK)<input required type="number" min="100" step="1" value={form.min_amount} onChange={(event) => setField('min_amount', event.target.value)} className={fieldClass} /></label>
              <label className="text-sm text-slate-600">Suggested amount<input type="number" min="100" step="1" value={form.price_per_seat} onChange={(event) => setField('price_per_seat', event.target.value)} placeholder="Defaults to minimum" className={fieldClass} /></label>
              <label className="text-sm text-slate-600">Maximum (optional)<input type="number" min="100" step="1" value={form.max_amount} onChange={(event) => setField('max_amount', event.target.value)} className={fieldClass} /></label>
            </div>
          </>}
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Passenger preview: {form.price_mode === 'fixed'
            ? `Fixed ${formatCurrency(Number(form.price_per_seat) || 0)} per seat`
            : `Choose ${formatCurrency(Number(form.min_amount) || 0)}${form.max_amount ? ` to ${formatCurrency(Number(form.max_amount))}` : ' or more'} per seat`}</p>
        </fieldset>

        {!editingId && <label className="text-sm text-slate-600">Initial status
          <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={fieldClass}>
            <option value="draft">Draft (hidden)</option><option value="open">Open (passengers can book)</option><option value="closed">Closed</option>
          </select>
        </label>}
        {message && <p role="status" className="sm:col-span-2 text-sm text-amber-700">{message}</p>}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button disabled={saving || uploading} className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create trip'}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700">Cancel</button>}
        </div>
      </form>
      <section className={cardClass}>
        <h2 className="font-semibold">All trips</h2>
        {listMessage && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{listMessage}</p>}
        {loading ? <p className="mt-3 text-slate-500">Loading trips...</p> : error ? <p role="alert" className="mt-3 text-red-700">{error}</p> : (
          <div className="mt-3 divide-y divide-slate-100">
            {(trips || []).map((trip) => <div key={trip.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-14 w-20 shrink-0 rounded-xl border border-slate-200 bg-slate-100" style={trip.cover_image_url ? coverStyle(trip.cover_image_url) : undefined} aria-hidden="true" />
                <Link to={`/dashboard/trips/${trip.id}`} className="min-w-0 font-medium text-slate-900">{trip.title} <span className="font-normal text-slate-500">· {trip.origin} → {trip.destination}</span><span className="mt-1 block text-sm font-medium text-emerald-800">{trip.price_mode === 'flexible' ? `From ${formatCurrency(trip.min_amount)}` : formatCurrency(trip.price_per_seat)} per seat <span className="font-normal text-slate-500">· {trip.seat_count} seats · {SEAT_LAYOUTS[normalizeLayout(trip.seat_layout)].label}</span></span></Link>
              </div>
              <div className="flex items-center gap-2"><span className="text-sm capitalize text-slate-500">{trip.status}</span>
                <button onClick={() => startEdit(trip)} className="rounded-full border px-3 py-1 text-sm">Edit</button>
                {trip.status === 'open' ? <button onClick={() => updateStatus(trip, 'closed')} className="rounded-full border px-3 py-1 text-sm">Close</button> : <button onClick={() => updateStatus(trip, 'open')} className="rounded-full border px-3 py-1 text-sm">Open</button>}
                <button onClick={() => deleteTrip(trip)} className="rounded-full border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50">Delete</button>
              </div>
            </div>)}
            {trips?.length === 0 && <p className="py-4 text-sm text-slate-500">No trips found.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

export function OrganizerTripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [seats, setSeats] = useState([]);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ fullname: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [tripResponse, registrationsResponse, seatsResponse] = await Promise.all([
        api.get(`/api/organizer/trips/${tripId}`),
        api.get(`/api/organizer/trips/${tripId}/registrations`),
        api.get(`/api/organizer/trips/${tripId}/seats`),
      ]);
      setTrip(tripResponse.data);
      setRegistrations(registrationsResponse.data);
      setSeats(seatsResponse.data.seats);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load this trip.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tripId]);

  const seatList = useMemo(() => seats.map((item) => item.seat), [seats]);
  const seatInfo = useMemo(() => Object.fromEntries(seats.map((item) => [item.seat, { name: item.name, status: item.status }])), [seats]);
  const filtered = useMemo(() => registrations.filter((item) =>
    item.fullname.toLowerCase().includes(search.toLowerCase())), [registrations, search]);

  async function removeRegistration(id) {
    if (!window.confirm('Delete this registration?')) return;
    try { await api.delete(`/api/organizer/registrations/${id}`); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || 'Unable to delete registration.'); }
  }

  async function saveRegistration(event) {
    event.preventDefault();
    if (!editTarget) return;
    try {
      await api.patch(`/api/organizer/registrations/${editTarget.id}`, editForm);
      setEditTarget(null);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to save registration.');
    }
  }

  async function deleteThisTrip() {
    if (!window.confirm(`Delete "${trip?.title}"? This cannot be undone.`)) return;
    try { await api.delete(`/api/organizer/trips/${tripId}`); navigate('/dashboard/trips', { replace: true }); }
    catch (requestError) { setError(requestError?.response?.data?.message || 'Unable to delete this trip.'); }
  }

  function exportCsv() {
    const rows = [['Passenger', 'Phone', 'Seats', 'Amount', 'Status'], ...filtered.map((item) => [item.fullname, item.phone, item.selected_seats?.join(' '), item.amount, item.payment_status])];
    const csv = rows.map((row) => row.map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `${trip?.title || 'trip'}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (loading) return <p className={cardClass}>Loading trip...</p>;
  if (error && !trip) return <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><Link to="/dashboard/trips" className="text-sm text-emerald-700">← All trips</Link><h1 className="mt-2 text-2xl font-semibold">{trip?.title}</h1><p className="text-slate-500">{trip?.origin} → {trip?.destination}</p></div>
      <button type="button" onClick={deleteThisTrip} className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Delete trip</button>
    </div>
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</p>}
    <section className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Seat map</h2><span className="text-sm text-slate-500">{SEAT_LAYOUTS[normalizeLayout(trip?.seat_layout)].label} layout · {seats.length} of {trip?.seat_count || 0} seats taken</span></div>
      <p className="mt-1 text-sm text-slate-500">This is the same seat map your passengers see. Tap a taken seat to see who is in it.</p>
      <SeatMap className="mt-4" seatCount={trip?.seat_count || 0} layout={trip?.seat_layout} takenSeats={seatList} seatInfo={seatInfo} />
    </section>
    <section className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Registrations</h2><button onClick={exportCsv} className="rounded-full border px-4 py-2 text-sm">Export CSV</button></div>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search passengers" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2" />
      <div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="text-slate-500"><th className="py-2">Passenger</th><th>Phone</th><th>Seats</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>
        {filtered.map((record) => <tr key={record.id} className="border-t border-slate-100"><td className="py-3">{record.fullname}</td><td>{record.phone}</td><td>{record.selected_seats?.map((seat) => { const person = record.passengers?.find((item) => item.seat === seat); return <span key={seat} className="block">{seat}{person?.name && record.selected_seats.length > 1 ? <span className="text-slate-500"> · {person.name}</span> : null}</span>; })}</td><td>{formatCurrency(record.amount)}</td><td>{record.payment_status}</td><td className="whitespace-nowrap"><button onClick={() => { setEditTarget(record); setEditForm({ fullname: record.fullname, phone: record.phone }); }} className="mr-3 text-emerald-700">Edit</button><button onClick={() => removeRegistration(record.id)} className="text-rose-700">Delete</button></td></tr>)}
      </tbody></table>
      {!filtered.length && <p className="py-5 text-sm text-slate-500">No registrations match.</p>}</div>
    </section>
    {editTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={saveRegistration} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
      <h2 className="text-xl font-semibold">Edit registration</h2>
      <label className="block text-sm">Passenger name<input required minLength="3" value={editForm.fullname} onChange={(event) => setEditForm((current) => ({ ...current, fullname: event.target.value }))} className="mt-1 block w-full rounded-xl border p-2" /></label>
      <label className="block text-sm">Phone<input required value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1 block w-full rounded-xl border p-2" /></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditTarget(null)} className="rounded-full border px-4 py-2">Cancel</button><button className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white">Save changes</button></div>
    </form></div>}
  </div>;
}

export function OrganizerWallet() {
  const { data: wallet, error, loading, setData: setWallet } = useLoad('/api/organizer/wallet');
  const { data: transactions, error: transactionsError, loading: transactionsLoading } = useLoad('/api/organizer/wallet/transactions');
  const { data: payouts, error: payoutsError, setData: setPayouts } = useLoad('/api/organizer/payouts');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [lookups, setLookups] = useState({ operators: [], banks: [] });
  const [method, setMethod] = useState('mobile_money');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState({});
  const [payoutMessage, setPayoutMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function lookupList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  }

  async function openWithdraw() {
    setPayoutMessage('');
    try {
      const { data } = await api.get('/api/organizer/payouts/lookups');
      setLookups({ operators: lookupList(data.operators), banks: lookupList(data.banks) });
      setShowWithdraw(true);
    } catch (requestError) {
      setPayoutMessage(requestError?.response?.data?.message || 'Payout options are currently unavailable.');
    }
  }

  async function submitPayout(event) {
    event.preventDefault();
    setPayoutMessage('');
    if (Number(amount) > Number(wallet?.available_balance || 0)) {
      setPayoutMessage('Amount exceeds your available balance.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/organizer/payouts', { amount: Number(amount), method, destination });
      setPayoutMessage(`Withdrawal request ${data.payout.status}.`);
      setPayouts((current) => [data.payout, ...(current || [])]);
      setWallet((current) => current && ({
        ...current,
        pending_payouts: Number(current.pending_payouts) + Number(data.payout.amount),
        available_balance: Number(current.available_balance) - Number(data.payout.amount),
      }));
      setShowWithdraw(false);
    } catch (requestError) {
      setPayoutMessage(requestError?.response?.data?.message || 'Unable to submit withdrawal.');
    } finally { setSubmitting(false); }
  }

  const methods = method === 'mobile_money' ? lookups.operators : lookups.banks;
  const chosenKey = method === 'mobile_money' ? 'operator_id' : 'bank_id';
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Wallet</h1><p className="mt-1 text-slate-500">Request a withdrawal to your mobile money wallet or bank account.</p></div>
    {(error || transactionsError) && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-red-700">{error || transactionsError}</p>}
    {(payoutsError || payoutMessage) && <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900">{payoutMessage || payoutsError}</p>}
    <section className={cardClass}>{loading ? 'Loading wallet...' : <><p className="text-sm text-slate-500">Available balance</p><p className="mt-2 text-3xl font-semibold">{formatCurrency(wallet?.available_balance || 0)}</p><p className="mt-2 text-sm text-slate-500">Pending withdrawals: {formatCurrency(wallet?.pending_payouts || 0)}</p><button onClick={openWithdraw} className="mt-4 rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-white">Withdraw</button></>}</section>
    <section className={cardClass}><h2 className="font-semibold">Payouts</h2><div className="mt-3 divide-y divide-slate-100">{(payouts || []).map((payout) => <div key={payout.id} className="flex justify-between gap-3 py-3 text-sm"><span className="capitalize">{payout.method.replace('_', ' ')} · {payout.status}</span><strong>{formatCurrency(payout.amount)}</strong></div>)}{payouts?.length === 0 && <p className="py-3 text-sm text-slate-500">No payout requests.</p>}</div></section>
    <section className={cardClass}><h2 className="font-semibold">Transactions</h2>{transactionsLoading ? <p className="mt-3 text-slate-500">Loading transactions...</p> : <div className="mt-3 divide-y divide-slate-100">{(transactions || []).map((item) => <div key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span className="capitalize">{item.type.replace('_', ' ')} <span className="block text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span></span><strong>{formatCurrency(item.amount)}</strong></div>)}{transactions?.length === 0 && <p className="py-4 text-sm text-slate-500">No wallet transactions.</p>}</div>}</section>
    {showWithdraw && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submitPayout} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Withdraw funds</h2><button type="button" onClick={() => setShowWithdraw(false)} aria-label="Close">✕</button></div>
      <p className="text-sm text-slate-500">Available: {formatCurrency(wallet?.available_balance || 0)}</p>
      <label className="block text-sm">Amount (MWK)<input type="number" min="1" step="0.01" required max={wallet?.available_balance || 0} value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 block w-full rounded-xl border p-2" /></label>
      <label className="block text-sm">Method<select value={method} onChange={(event) => { setMethod(event.target.value); setDestination({}); }} className="mt-1 block w-full rounded-xl border p-2"><option value="mobile_money">Mobile money</option><option value="bank">Bank</option></select></label>
      <label className="block text-sm">{method === 'mobile_money' ? 'Operator' : 'Bank'}<select required value={destination[chosenKey] || ''} onChange={(event) => setDestination((current) => ({ ...current, [chosenKey]: event.target.value }))} className="mt-1 block w-full rounded-xl border p-2"><option value="">Select</option>{methods.map((item) => { const id = item.id || item.operator_id || item.bank_code; return <option key={id} value={id}>{item.name || item.operator_name || item.bank_name}</option>; })}</select></label>
      {method === 'mobile_money' ? <label className="block text-sm">Mobile number<input required value={destination.phone || ''} onChange={(event) => setDestination((current) => ({ ...current, phone: event.target.value }))} className="mt-1 block w-full rounded-xl border p-2" /></label> : <>
        <label className="block text-sm">Account name<input required value={destination.account_name || ''} onChange={(event) => setDestination((current) => ({ ...current, account_name: event.target.value }))} className="mt-1 block w-full rounded-xl border p-2" /></label>
        <label className="block text-sm">Account number<input required value={destination.account_number || ''} onChange={(event) => setDestination((current) => ({ ...current, account_number: event.target.value }))} className="mt-1 block w-full rounded-xl border p-2" /></label>
      </>}
      {payoutMessage && <p role="alert" className="text-sm text-red-700">{payoutMessage}</p>}
      <button disabled={submitting} className="w-full rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white">{submitting ? 'Submitting...' : 'Request withdrawal'}</button>
    </form></div>}
  </div>;
}

export function OrganizerBranding() {
  const { organizer } = useAuth();
  const [form, setForm] = useState({ name: '', logo_url: '', primary_color: '#059669', tagline: '', contact_phone: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (organizer) setForm({
      name: organizer.name || '', logo_url: organizer.logo_url || '',
      primary_color: organizer.primary_color || '#059669', tagline: organizer.tagline || '',
      contact_phone: organizer.contact_phone || '',
    });
  }, [organizer]);
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.patch('/api/organizer/branding', form);
      setForm((current) => ({ ...current, ...data.organizer }));
      setMessage('Branding saved.');
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Unable to save branding.');
    } finally { setSaving(false); }
  }
  async function uploadLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = new FormData();
    payload.append('logo', file);
    setMessage('');
    try {
      const { data } = await api.post('/api/organizer/branding/logo', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((current) => ({ ...current, logo_url: data.organizer.logo_url }));
      setMessage('Logo uploaded.');
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Unable to upload logo.');
    }
  }
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Branding</h1><p className="mt-1 text-slate-500">Customise your public booking page.</p></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={save} className={`${cardClass} space-y-4`}>{[['name', 'Organizer name'], ['logo_url', 'Logo URL'], ['tagline', 'Tagline'], ['contact_phone', 'Contact phone']].map(([key, label]) => <label key={key} className="block text-sm text-slate-600">{label}<input value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2" /></label>)}
        <label className="block text-sm text-slate-600">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} className="mt-1 block w-full rounded-xl border border-slate-200 p-2" /></label>
        <label className="block text-sm text-slate-600">Brand colour<input type="color" value={form.primary_color} onChange={(event) => setForm((current) => ({ ...current, primary_color: event.target.value }))} className="mt-2 block h-10 w-full" /></label>
        {message && <p className="text-sm text-slate-600">{message}</p>}<button disabled={saving} className="rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-white">{saving ? 'Saving...' : 'Save branding'}</button>
      </form>
      <div className={cardClass}><p className="mb-3 text-sm font-medium text-slate-500">Live preview</p><div className="rounded-2xl p-6 text-center text-white" style={{ backgroundColor: form.primary_color }}>{form.logo_url && <img src={form.logo_url} alt="" className="mx-auto mb-2 h-12 w-12 rounded-full bg-white object-contain" />}<h2 className="text-2xl font-semibold">{form.name}</h2><p>{form.tagline}</p></div>
        <div className="mt-4 flex flex-wrap items-center gap-4"><a className="text-sm text-emerald-700 underline" href={`/#/o/${organizer?.slug}`} target="_blank" rel="noreferrer">Open public page</a><QRCodeSVG value={`${window.location.origin}/#/o/${organizer?.slug}`} size={104} /></div>
      </div>
    </div>
  </div>;
}

export function OrganizerAccount() {
  const { data, error, loading } = useLoad('/api/organizer/subscription');
  const daysLeft = data?.active_until ? Math.ceil((new Date(data.active_until) - new Date()) / 86400000) : null;
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Account</h1><p className="mt-1 text-slate-500">Subscription status and expiry.</p></div>
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-red-700">{error}</p>}
    <section className={cardClass}>{loading ? 'Loading account...' : <><p className="text-sm text-slate-500">Plan</p><p className="mt-1 text-xl font-semibold capitalize">{data?.subscription_plan || 'No plan assigned'}</p><p className="mt-4 text-sm text-slate-500">Active until</p><p className="mt-1 font-medium">{data?.active_until ? new Date(data.active_until).toLocaleDateString() : 'Not set'}</p>
      {daysLeft !== null && daysLeft < 7 && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{daysLeft < 0 ? 'Your subscription has expired. New bookings and trip publishing are disabled; wallet withdrawals and existing data remain available.' : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`}</p>}
      <h2 className="mt-6 font-semibold">Subscription history</h2><div className="mt-2 divide-y divide-slate-100">{(data?.history || []).map((item) => <div key={item.id} className="flex justify-between py-3 text-sm"><span>{item.method} · through {new Date(item.period_end).toLocaleDateString()}</span><strong>{formatCurrency(item.amount)}</strong></div>)}{!data?.history?.length && <p className="py-3 text-sm text-slate-500">No subscription extensions recorded.</p>}</div>
    </>}</section>
  </div>;
}
