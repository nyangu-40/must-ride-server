import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';

function AdminPage() {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRegistrations() {
      try {
        const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';
        const response = await api.get('/api/registrations', {
          headers: { 'x-admin-token': ADMIN_TOKEN },
        });
        setRegistrations(response.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load registrations.');
      }
    }

    loadRegistrations();
  }, []);

  const filtered = useMemo(() => {
    return registrations.filter((item) => item.fullname.toLowerCase().includes(search.toLowerCase()));
  }, [registrations, search]);

  const totals = useMemo(() => {
    const paid = registrations.filter((item) => item.payment_status === 'Paid').length;
    const pending = registrations.filter((item) => item.payment_status === 'Pending').length;
    return {
      total: registrations.length,
      paid,
      pending,
    };
  }, [registrations]);

  const downloadCSV = () => {
    const headers = ['Full Name', 'Phone', 'Pickup', 'Destination', 'Seats', 'Selected Seats', 'Passengers', 'Amount', 'Status', 'Reference', 'Payment Date', 'Created At'];
    const rows = filtered.map((item) => [
      item.fullname,
      item.phone,
      item.pickup_location,
      item.destination,
      item.seats,
      item.selected_seats?.join(', ') || '',
      item.passengers?.map((p) => `${p.seat}: ${p.name}`).join('; ') || '',
      item.amount,
      item.payment_status,
      item.payment_reference || '',
      item.payment_date || '',
      item.created_at || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'must-ride-registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-secondary">Admin dashboard</p>
          <h2 className="text-3xl font-semibold text-slate-900">Registration summary</h2>
          <p className="text-slate-600">Review recent signups, payment status, and export registrations.</p>
        </div>
        <button
          type="button"
          onClick={downloadCSV}
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          Download CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-6">
          <p className="text-sm text-slate-500">Total registrations</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.total}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-600">{totals.paid}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-3 text-3xl font-semibold text-amber-600">{totals.pending}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by full name"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
        />

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Phone</th>
                <th className="px-5 py-4 font-medium">Pickup</th>
                <th className="px-5 py-4 font-medium">Destination</th>
                <th className="px-5 py-4 font-medium">Seats</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((registration) => (
                <tr key={registration.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-slate-800">{registration.fullname}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.phone}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.pickup_location}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.destination}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.seats}</td>
                  <td className="px-5 py-4 text-slate-800">{formatCurrency(registration.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${registration.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {registration.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminPage;
