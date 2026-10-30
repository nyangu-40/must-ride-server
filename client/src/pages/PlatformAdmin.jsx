import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs } from '../components/ui.jsx';
import { LogOut } from 'lucide-react';

const box = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-card';
const navItems = [
  ['Overview', '/platform'],
  ['Applications', '/platform/applications'],
  ['Organizers', '/platform/organizers'],
  ['Transactions', '/platform/transactions'],
  ['Payouts', '/platform/payouts'],
  ['Reconciliation', '/platform/reconciliation'],
  ['Audit log', '/platform/audit-log'],
];

export function PlatformLayout() {
  const { signOut } = useAuth();
  const { data: applications } = usePlatformData('/api/platform/applications');
  const pendingCount = (applications || []).filter((item) => item.status === 'pending').length;
  return <div className="mx-auto w-full min-w-0 text-slate-900">
    <header className="mb-5 flex items-center justify-between rounded-2xl bg-slate-950 p-5 text-white">
      <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Platform Admin</p><p className="mt-1 text-lg font-semibold">Must Ride Platform</p></div>
    </header>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[210px_minmax(0,1fr)] xl:gap-5">
      <nav aria-label="Platform administration" className="sticky top-2 flex min-w-0 items-center gap-2 overflow-x-auto rounded-2xl bg-slate-950 p-2 sm:p-3 lg:top-0 lg:h-[calc(100vh-1rem)] lg:items-stretch lg:flex-col lg:justify-between lg:overflow-visible">
        <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
          {navItems.map(([label, to]) => <NavLink key={to} to={to} end={to === '/platform'}
            className={({ isActive }) => `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm ${isActive ? 'bg-emerald-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>{label}{label === 'Applications' && pendingCount > 0 && <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-950">{pendingCount}</span>}</NavLink>)}
        </div>
        <button type="button" onClick={() => signOut()} className="whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 lg:mt-auto"><LogOut size={16} aria-hidden="true" className="mr-2 inline" />Sign out</button>
      </nav>
      <main className="w-full min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-5 lg:p-6"><Outlet /></main>
    </div>
  </div>;
}

export function PlatformApplications() {
  const { data: applications, error, loading, reload } = usePlatformData('/api/platform/applications');
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'approve') {
        await api.post(`/api/platform/organizers/${selected.id}/approve`, {
          months: Number(formData.get('months')),
          amount: Number(formData.get('amount')),
          method: formData.get('method'),
          note: formData.get('note'),
        });
        setMessage(`${selected.name} approved.`);
      } else {
        await api.post(`/api/platform/organizers/${selected.id}/reject`, { reason: formData.get('reason') });
        setMessage(`${selected.name} application declined.`);
      }
      setSelected(null);
      setMode('');
      reload();
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Unable to update this application.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-semibold text-slate-950">Organizer applications</h1><p className="mt-1 text-slate-700">Review new requests and manage declined applications.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-slate-100 p-3 text-slate-900">{message}</p>}
    <section className={box}>
      {loading ? <p>Loading applications…</p> : (applications || []).length === 0 ? <p className="text-slate-700">No applications to review.</p> : <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm"><thead><tr className="text-slate-600"><th className="py-2 pr-4">Organization</th><th className="pr-4">Owner</th><th className="pr-4">Contact</th><th className="pr-4">Status</th><th>Actions</th></tr></thead>
          <tbody>{applications.map((application) => <tr key={application.id} className="border-t border-slate-200 align-top"><td className="py-3 pr-4"><span className="font-semibold text-slate-950">{application.name}</span><span className="block text-xs text-slate-600">/{application.slug}</span></td><td className="pr-4">{application.owner_name}<span className="block text-xs text-slate-600">{application.owner_email}</span></td><td className="pr-4">{application.contact_phone}</td><td className="pr-4 capitalize">{application.status}</td><td className="whitespace-nowrap"><button onClick={() => { setSelected(application); setMode('approve'); }} className="mr-2 rounded-full bg-brand px-3 py-1.5 font-semibold text-white">Approve</button><button onClick={() => { setSelected(application); setMode('reject'); }} className="rounded-full border border-slate-300 px-3 py-1.5 text-slate-800">{application.status === 'rejected' ? 'Update reason' : 'Reject'}</button>{application.rejection_reason && <p className="mt-1 max-w-xs whitespace-normal text-xs text-slate-700">{application.rejection_reason}</p>}</td></tr>)}</tbody>
        </table>
      </div>}
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
        <div><h2 className="text-xl font-semibold">{mode === 'approve' ? `Approve ${selected.name}` : `Decline ${selected.name}`}</h2><p className="mt-1 text-sm text-slate-700">{selected.owner_name} · {selected.owner_email}</p></div>
        {mode === 'approve' ? <>
          <label className="block text-sm font-medium text-slate-800">Months of access<input name="months" type="number" min="1" max="36" defaultValue="1" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-800">Amount received<input name="amount" type="number" min="0" step="0.01" defaultValue="0" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-800">Payment method<input name="method" maxLength="80" defaultValue="manual" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-800">Note (optional)<textarea name="note" maxLength="500" rows="2" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>
        </> : <label className="block text-sm font-medium text-slate-800">Reason for declining<textarea name="reason" minLength="3" maxLength="1000" required rows="4" defaultValue={selected.rejection_reason || ''} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>}
        <div className="flex justify-end gap-2"><button type="button" onClick={() => { setSelected(null); setMode(''); }} className="rounded-full border border-slate-300 px-4 py-2 text-slate-800">Cancel</button><button disabled={busy} className="rounded-full bg-brand px-4 py-2 font-semibold text-white">{busy ? 'Saving…' : mode === 'approve' ? 'Approve application' : 'Save decision'}</button></div>
      </form>
    </div>}
  </div>;
}

function usePlatformData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(path).then(({ data: value }) => { if (active) setData(value); })
      .catch((requestError) => { if (active) setError(requestError?.response?.data?.message || 'Unable to load platform data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, reloadKey]);
  return { data, error, loading, setData, reload: () => setReloadKey((key) => key + 1) };
}

export function PlatformOverview() {
  const { data: overview, error, loading } = usePlatformData('/api/platform/overview');
  const { data: organizers } = usePlatformData('/api/platform/organizers');
  const { data: payouts } = usePlatformData('/api/platform/payouts');
  const { data: reconciliation } = usePlatformData('/api/platform/reconciliation');
  const expiring = (organizers || []).filter((item) => item.active_until
    && new Date(item.active_until) - new Date() < 7 * 86400000
    && new Date(item.active_until) > new Date());
  const failedPayouts = (payouts || []).filter((item) => ['failed', 'requested', 'processing'].includes(item.status));
  const inactive = (organizers || []).filter((item) => new Date(item.last_activity) < new Date(Date.now() - 30 * 86400000));
  const stat = (title, value, note) => <div key={title} className={box}><p className="text-sm text-slate-600">{title}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>{note && <p className="mt-1 text-xs text-slate-600">{note}</p>}</div>;
  if (loading) return <p className={box}>Loading platform overview...</p>;
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-semibold text-slate-950">Platform overview</h1><p className="mt-1 text-slate-700">Tenant activity, ledger balances, and platform operations.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-950 p-3 text-red-200">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stat('Active organizers', overview?.organizers?.active || 0, `${overview?.organizers?.suspended || 0} suspended · ${overview?.organizers?.expired || 0} expired`)}
      {stat('Trips', overview?.trips || 0)}
      {stat('Registrations', overview?.registrations?.total || 0, `${overview?.registrations?.paid || 0} paid · ${overview?.registrations?.pending || 0} pending`)}
      {stat('Revenue processed', formatCurrency(overview?.total_revenue_processed || 0))}
      {stat('Owed to organizers', formatCurrency(overview?.total_owed_to_organizers || 0))}
      {stat('Paid out', formatCurrency(overview?.total_paid_out || 0))}
      {stat('Pending payouts', formatCurrency(overview?.pending_payouts || 0))}
    </div>
    <section className={box}><h2 className="font-semibold text-slate-950">Needs attention</h2><ul className="mt-3 space-y-2 text-sm text-slate-700">
      <li>{expiring.length} subscription{expiring.length === 1 ? '' : 's'} expiring within 7 days</li>
      <li>{failedPayouts.length} failed or pending payout{failedPayouts.length === 1 ? '' : 's'}</li>
      <li>{reconciliation?.matched === false ? 'PayChangu balance mismatch detected' : reconciliation?.matched === true ? 'Balances reconciled' : 'Reconciliation unavailable'} · <Link to="/platform/reconciliation" className="text-emerald-900 underline">Review</Link></li>
      <li>{inactive.length} organizer{inactive.length === 1 ? '' : 's'} inactive for 30 days</li>
    </ul></section>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={box}><h2 className="mb-4 font-semibold text-slate-950">Bookings per day</h2><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview?.time_series || []}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} hide /><YAxis tick={{ fill: '#475569', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }} /><Bar dataKey="bookings" fill="#047857" /></BarChart></ResponsiveContainer></div></section>
      <section className={box}><h2 className="mb-4 font-semibold text-slate-950">Revenue per day</h2><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview?.time_series || []}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} hide /><YAxis tick={{ fill: '#475569', fontSize: 10 }} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#fff', borderColor: '#cbd5e1', color: '#0f172a' }} /><Bar dataKey="revenue" fill="#0369a1" /></BarChart></ResponsiveContainer></div></section>
    </div>
  </div>;
}

export function PlatformOrganizers() {
  const { data: organizers, error, loading, reload } = usePlatformData('/api/platform/organizers');
  const { enterViewAs } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', email: '', primary_color: '#059669', tagline: '', contact_phone: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);

  async function createOrganizer(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/platform/organizers', form);
      setShowCreate(false);
      setForm({ name: '', slug: '', email: '', primary_color: '#059669', tagline: '', contact_phone: '' });
      reload();
    } catch (requestError) { setMessage(requestError?.response?.data?.message || 'Unable to invite organizer.'); }
    finally { setBusy(false); }
  }

  async function changeStatus(organizer) {
    try {
      await api.patch(`/api/platform/organizers/${organizer.id}`, { status: organizer.status === 'active' ? 'suspended' : 'active' });
      reload();
    } catch (requestError) { setMessage(requestError?.response?.data?.message || 'Unable to update organizer.'); }
  }

  async function startViewAs(organizer) {
    setBusy(true);
    try {
      const { data } = await api.post(`/api/platform/organizers/${organizer.id}/view-as`);
      await enterViewAs(data.readOnlyToken);
      navigate('/dashboard');
    } catch (requestError) { setMessage(requestError?.response?.data?.message || 'Unable to start read-only view.'); }
    finally { setBusy(false); }
  }

  async function extendSubscription(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await api.patch(`/api/platform/organizers/${selected.id}`, {
        active_until: new Date(formData.get('active_until')).toISOString(),
        subscription_method: formData.get('method'),
        subscription_amount: Number(formData.get('amount') || 0),
        subscription_note: formData.get('note'),
      });
      setSelected(null);
      reload();
    } catch (requestError) { setMessage(requestError?.response?.data?.message || 'Unable to extend subscription.'); }
  }

  const filtered = (organizers || []).filter((item) => `${item.name} ${item.slug}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold text-slate-950">Organizers</h1><p className="mt-1 text-slate-700">Manage tenants, access, and subscriptions.</p></div><button onClick={() => setShowCreate(true)} className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white">Invite organizer</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{error}</p>}{message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-amber-950">{message}</p>}
    <section className={box}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organizers" className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500" />
      {loading ? <p>Loading organizers...</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="text-slate-600"><th className="py-2">Organizer</th><th>Status</th><th>Plan expiry</th><th>Trips</th><th>Seats sold</th><th>Revenue</th><th>Balance</th><th /></tr></thead><tbody>
        {filtered.map((item) => <tr key={item.id} className="border-t border-slate-200"><td className="py-3"><Link to={`/platform/organizers/${item.id}`} className="font-medium text-emerald-900 underline">{item.name}</Link><span className="block text-xs text-slate-600">/{item.slug}</span></td><td>{item.status}{item.expired ? ' · expired' : ''}</td><td>{item.active_until ? new Date(item.active_until).toLocaleDateString() : 'Not set'}</td><td>{item.trips}</td><td>{item.seats_sold}</td><td>{formatCurrency(item.revenue)}</td><td>{formatCurrency(item.balance)}</td><td><div className="flex flex-wrap gap-2"><button onClick={() => changeStatus(item)} className="rounded-lg border border-slate-300 px-2 py-1">{item.status === 'active' ? 'Suspend' : 'Unsuspend'}</button><button onClick={() => setSelected(item)} className="rounded-lg border border-slate-300 px-2 py-1">Extend</button><button disabled={busy} onClick={() => startViewAs(item)} className="rounded-lg border border-slate-300 px-2 py-1">View as</button></div></td></tr>)}
      </tbody></table>{filtered.length === 0 && <p className="py-4 text-slate-600">No organizers found.</p>}</div>}
    </section>
    {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={createOrganizer} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
      <h2 className="text-xl font-semibold">Invite organizer</h2>{[['name','Organizer name'],['slug','Public slug'],['email','Owner email'],['primary_color','Brand colour'],['tagline','Tagline'],['contact_phone','Contact phone']].map(([key,label])=><label key={key} className="block text-sm font-medium text-slate-800">{label}<input required={['name','slug','email'].includes(key)} type={key==='email'?'email':'text'} value={form[key]} onChange={(event)=>setForm((current)=>({...current,[key]:event.target.value}))} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2" /></label>)}
      <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowCreate(false)} className="rounded-full border border-slate-300 px-4 py-2 text-slate-800">Cancel</button><button disabled={busy} className="rounded-full bg-brand px-4 py-2 text-white">{busy?'Inviting...':'Send invite'}</button></div>
    </form></div>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={extendSubscription} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
      <h2 className="text-xl font-semibold">Extend {selected.name}</h2><label className="block text-sm font-medium">New expiry<input name="active_until" type="datetime-local" required defaultValue={selected.active_until ? new Date(new Date(selected.active_until).getTime()-new Date(selected.active_until).getTimezoneOffset()*60000).toISOString().slice(0,16) : ''} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2" /></label>
      <label className="block text-sm font-medium">Amount received<input name="amount" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2" /></label>
      <label className="block text-sm font-medium">Method<input name="method" required defaultValue="manual" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2" /></label>
      <label className="block text-sm font-medium">Note<input name="note" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={()=>setSelected(null)} className="rounded-full border border-slate-300 px-4 py-2">Cancel</button><button className="rounded-full bg-brand px-4 py-2 text-white">Record extension</button></div>
    </form></div>}
  </div>;
}

export function PlatformOrganizerDetail() {
  const { id } = useParams();
  const { data, error, loading } = usePlatformData(`/api/platform/organizers/${id}`);
  const [tab, setTab] = useState('Overview');
  if (loading) return <p className={box}>Loading organizer...</p>;
  if (error || !data) return <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{error || 'Organizer not found.'}</p>;
  const tabs = ['Overview', 'Trips', 'Registrations', 'Wallet', 'Payouts', 'Subscription'];
  const content = {
    Overview: <p>{data.organizer.name} · {data.organizer.status} · expires {data.organizer.active_until ? new Date(data.organizer.active_until).toLocaleDateString() : 'not set'}</p>,
    Trips: <SimpleRows rows={data.trips} columns={['title', 'origin', 'destination', 'status']} />,
    Registrations: <SimpleRows rows={data.registrations} columns={['fullname', 'phone', 'payment_status', 'amount']} />,
    Wallet: <SimpleRows rows={data.transactions} columns={['type', 'amount', 'created_at']} />,
    Payouts: <SimpleRows rows={data.payouts} columns={['amount', 'method', 'status', 'created_at']} />,
    Subscription: <SimpleRows rows={data.subscriptions} columns={['amount', 'method', 'period_start', 'period_end']} />,
  };
  return <div className="space-y-5"><Link to="/platform/organizers" className="text-sm text-emerald-900 underline">← Organizers</Link><h1 className="text-2xl font-semibold text-slate-950">{data.organizer.name}</h1>
    <Tabs tabs={tabs.map((item) => ({ value: item, label: item }))} value={tab} onChange={setTab} />
    <section className={box}>{content[tab]}</section>
  </div>;
}

function SimpleRows({ rows, columns }) {
  if (!rows?.length) return <p className="text-slate-700">No records.</p>;
  return <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr>{columns.map((key)=><th key={key} className="py-2 pr-4 text-slate-600">{key.replace('_',' ')}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id||index} className="border-t border-slate-200">{columns.map((key)=><td key={key} className="py-2 pr-4 text-slate-900">{key==='amount'?formatCurrency(row[key]):String(row[key]??'')}</td>)}</tr>)}</tbody></table></div>;
}

function downloadCsv(filename, rows) {
  const text = rows.map((row) => row.map((field) => `"${String(field ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function PlatformTransactions() {
  const { data, error, loading } = usePlatformData('/api/platform/transactions');
  const [type, setType] = useState('');
  const rows = (data || []).filter((item) => !type || item.type === type);
  return <div className="space-y-5"><h1 className="text-2xl font-semibold text-slate-950">Global transactions</h1>{error && <p role="alert" className="text-red-800">{error}</p>}<section className={box}>
    <div className="flex flex-wrap justify-between gap-3"><select value={type} onChange={(event)=>setType(event.target.value)} className="rounded-xl border border-slate-300 bg-white p-2 text-slate-900"><option value="">All transaction types</option>{['sale','payout','payout_reversal','adjustment'].map((item)=><option key={item}>{item}</option>)}</select><button onClick={()=>downloadCsv('platform-transactions.csv',[['Organizer','Type','Amount','Created'],...rows.map((item)=>[item.organizers?.name,item.type,item.amount,item.created_at])])} className="rounded-full border border-slate-300 px-4 py-2 text-slate-800">Export CSV</button></div>
    {loading?'Loading transactions...':<SimpleRows rows={rows.map((item)=>({...item,type:`${item.organizers?.name||''} · ${item.type}`}))} columns={['type','amount','created_at']} />}
  </section></div>;
}

export function PlatformPayouts() {
  const { data, error, loading, reload } = usePlatformData('/api/platform/payouts');
  const [message, setMessage] = useState('');
  const [responsePayout, setResponsePayout] = useState(null);
  async function action(payout, actionName) {
    try { await api.post(`/api/platform/payouts/${payout.id}/actions`, { action: actionName }); setMessage(`${actionName} completed.`); reload(); }
    catch (requestError) { setMessage(requestError?.response?.data?.message || 'Payout action failed.'); }
  }
  return <div className="space-y-5"><h1 className="text-2xl font-semibold text-slate-950">Payouts</h1>{error && <p role="alert" className="text-red-800">{error}</p>}{message && <p role="status" className="text-amber-900">{message}</p>}<section className={box}>
    {loading?'Loading payouts...':<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="text-slate-600"><th className="py-2">Organizer</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(data||[]).map((item)=><tr key={item.id} className="border-t border-slate-200"><td className="py-3">{item.organizers?.name}</td><td>{formatCurrency(item.amount)}</td><td>{item.method}</td><td>{item.status}</td><td className="flex gap-2 py-3"><button onClick={()=>setResponsePayout(item)} className="rounded-lg border border-slate-300 px-2 py-1">Response</button>{item.status==='failed'&&<button onClick={()=>action(item,'retry')} className="rounded-lg border border-slate-300 px-2 py-1">Retry</button>}{item.status!=='paid'&&<button onClick={()=>action(item,'mark_paid')} className="rounded-lg border border-slate-300 px-2 py-1">Mark paid</button>}</td></tr>)}</tbody></table></div>}
  </section>
    {responsePayout && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-slate-900 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">PayChangu response</h2><button onClick={()=>setResponsePayout(null)} className="rounded-full border border-slate-300 px-3 py-1">Close</button></div><pre className="mt-4 max-h-[60vh] overflow-auto rounded-xl bg-slate-100 p-4 text-xs text-slate-800">{JSON.stringify(responsePayout.raw_response || { message: 'No provider response stored.' }, null, 2)}</pre></div></div>}
  </div>;
}

export function PlatformReconciliation() {
  const { data, error, loading, reload } = usePlatformData('/api/platform/reconciliation');
  return <div className="space-y-5"><h1 className="text-2xl font-semibold text-slate-950">Reconciliation</h1><p className="text-slate-700">Platform PayChangu balance compared with organizer available balances.</p><section className={`${box} ${data?.matched === true?'border-emerald-300':data?.matched===false?'border-rose-300':''}`}>
    {loading?'Loading balances...':error?<p role="alert" className="text-rose-900">{error}</p>:<><p className={`text-2xl font-semibold ${data?.matched===true?'text-emerald-900':data?.matched===false?'text-rose-900':'text-amber-900'}`}>{data?.matched===true?'Reconciled':data?.matched===false?'Mismatch':'Provider balance unavailable'}</p><dl className="mt-5 grid gap-4 sm:grid-cols-3"><div><dt className="text-sm text-slate-600">PayChangu balance</dt><dd className="mt-1 text-slate-950">{data?.platform_balance===null? 'Unavailable':formatCurrency(data?.platform_balance)}</dd></div><div><dt className="text-sm text-slate-600">Organizers available</dt><dd className="mt-1 text-slate-950">{formatCurrency(data?.organiser_available_balances)}</dd></div><div><dt className="text-sm text-slate-600">Difference</dt><dd className="mt-1 text-slate-950">{data?.difference===null?'Unavailable':formatCurrency(data?.difference)}</dd></div></dl>{data?.provider_error&&<p className="mt-4 text-xs text-amber-900">{data.provider_error}</p>}</>}
    <button onClick={reload} className="mt-5 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-800">Refresh</button></section>
  </div>;
}

export function PlatformAuditLog() {
  const { data, error, loading } = usePlatformData('/api/platform/audit-log');
  return <div className="space-y-5"><h1 className="text-2xl font-semibold text-slate-950">Audit log</h1>{error && <p role="alert" className="text-red-800">{error}</p>}<section className={box}>{loading?'Loading audit events...':<SimpleRows rows={data} columns={['action','target_type','target_id','created_at']} />}</section></div>;
}
