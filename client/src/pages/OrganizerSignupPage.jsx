import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const initialForm = { name: '', owner_name: '', email: '', phone: '', slug: '', password: '' };
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function OrganizerSignupPage() {
  const [form, setForm] = useState(initialForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugCheck, setSlugCheck] = useState({ loading: false, available: null, message: '' });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const publicLink = useMemo(() => `${window.location.origin}/#/o/${form.slug || 'your-link'}`, [form.slug]);

  useEffect(() => {
    if (!form.slug) {
      setSlugCheck({ loading: false, available: null, message: '' });
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSlugCheck({ loading: true, available: null, message: '' });
      try {
        const { data } = await api.get(`/api/public/slug-available/${encodeURIComponent(form.slug)}`);
        if (active) setSlugCheck({ loading: false, available: data.available, message: data.message });
      } catch {
        if (active) setSlugCheck({ loading: false, available: null, message: 'Could not check this link. Try again.' });
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.slug]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'slug' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) : value,
      ...(name === 'name' && !slugTouched ? { slug: slugify(value) } : {}),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/api/public/organizer-signup', form);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to submit your application.');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-900">Application submitted</h1>
      <p className="mt-3 text-slate-600">Your organizer application is awaiting approval. Sign in to check its status.</p>
      <Link to="/login" className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white">Sign in</Link>
    </section>;
  }

  return <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_.8fr]">
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 shadow-soft sm:p-8">
      <div><p className="text-sm font-semibold text-emerald-700">ORGANIZER APPLICATION</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">Bring your trips online</h1><p className="mt-2 text-slate-600">Apply for a branded booking page. We’ll review your details before enabling bookings.</p></div>
      {[['name', 'Organization name', 'text'], ['owner_name', 'Your full name', 'text'], ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel']].map(([name, label, type]) => <label key={name} className="block text-sm font-medium text-slate-700">{label}<input required name={name} type={type} value={form[name]} onChange={updateField} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>)}
      <label className="block text-sm font-medium text-slate-700">Your public link
        <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-300"><span className="bg-slate-100 px-3 py-2.5 text-slate-600">must-ride/</span><input required name="slug" minLength="3" maxLength="40" pattern="[a-z0-9-]{3,40}" value={form.slug} onChange={(event) => { setSlugTouched(true); updateField(event); }} className="min-w-0 flex-1 px-3 py-2.5" /></div>
        <span className={`mt-1 block text-xs ${slugCheck.available ? 'text-emerald-700' : slugCheck.available === false ? 'text-red-700' : 'text-slate-500'}`} aria-live="polite">{slugCheck.loading ? 'Checking address…' : slugCheck.message || 'Use 3–40 lowercase letters, numbers, or hyphens.'}</span>
      </label>
      <label className="block text-sm font-medium text-slate-700">Password <span className="font-normal text-slate-500">(at least 8 characters)</span><input required name="password" type="password" minLength="8" autoComplete="new-password" value={form.password} onChange={updateField} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={saving || slugCheck.available === false || slugCheck.loading} className="w-full rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Submitting…' : 'Submit application'}</button>
      <p className="text-center text-sm text-slate-600">Already applied? <Link to="/login" className="font-semibold text-emerald-800 underline">Sign in</Link></p>
    </form>
    <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="font-semibold text-slate-900">Your page preview</h2>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Your booking page</p><p className="mt-2 text-lg font-semibold text-slate-900">{form.name || 'Your organization'}</p><p className="mt-2 break-all text-sm text-emerald-800">{publicLink}</p><span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Bookings open after approval</span></div>
      <p className="mt-4 text-sm text-slate-600">Your account is created when you apply. You can sign in to see when your application is reviewed.</p>
    </aside>
  </section>;
}

export default OrganizerSignupPage;
