import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';

function DeleteConfirmModal({ registration, onCancel, onConfirm, isDeleting }) {
  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>

        <h3 className="text-center text-xl font-semibold text-slate-900">Delete this registration?</h3>

        <p className="mt-3 text-center text-slate-600">
          You're about to permanently remove the booking for:
        </p>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
          <p className="text-lg font-semibold text-slate-900">{registration.fullname}</p>
          <p className="mt-1 text-sm text-slate-600">{registration.phone}</p>
          <p className="mt-2 text-sm text-slate-600">
            Seat{registration.selected_seats?.length === 1 ? '' : 's'}: {registration.selected_seats?.join(', ') || '—'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {registration.pickup_location} → {registration.destination}
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-red-600">
          This cannot be undone. The registration will be permanently removed and the seat(s) will become available for someone else to book.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel, keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Yes, delete it'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditRegistrationModal({ registration, onCancel, onSave, isSaving, error }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (registration) {
      setForm({
        fullname: registration.fullname || '',
        phone: registration.phone || '',
        pickup_location: registration.pickup_location || '',
        destination: registration.destination || '',
        selected_seats: (registration.selected_seats || []).join(', '),
      });
    } else {
      setForm(null);
    }
  }, [registration]);

  if (!registration || !form) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const selected_seats = form.selected_seats
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (selected_seats.length === 0) {
      onSave(null, 'Please enter at least one seat number.');
      return;
    }

    onSave({
      fullname: form.fullname.trim(),
      phone: form.phone.trim(),
      pickup_location: form.pickup_location.trim(),
      destination: form.destination.trim(),
      selected_seats,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-slate-900">Edit registration</h3>
        <p className="mt-1 text-sm text-slate-500">
          Update details for this booking — changing the seats updates the seat count and total automatically.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Pickup</span>
              <input
                name="pickup_location"
                value={form.pickup_location}
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Destination</span>
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Seat numbers</span>
            <input
              name="selected_seats"
              value={form.selected_seats}
              onChange={handleChange}
              required
              placeholder="e.g. 12, 13"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
            <span className="mt-1 block text-xs text-slate-500">Separate multiple seats with commas.</span>
          </label>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminPage() {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadRegistrations() {
      setIsLoading(true);
      try {
        const response = await api.get('/api/registrations', {
          headers: { 'x-admin-token': token },
        });
        setRegistrations(response.data || []);
        setError('');
      } catch (err) {
        if (err?.response?.status === 401) {
          setError('Unauthorized admin token. Please sign in again.');
          localStorage.removeItem('adminToken');
          setToken('');
        } else {
          setError(err?.response?.data?.message || 'Unable to load registrations.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadRegistrations();
  }, [token]);

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

  const handleLogin = (event) => {
    event.preventDefault();
    const trimmedToken = tokenInput.trim();

    if (!trimmedToken) {
      setError('Please enter the admin token.');
      return;
    }

    localStorage.setItem('adminToken', trimmedToken);
    setToken(trimmedToken);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setTokenInput('');
    setRegistrations([]);
    setSearch('');
    setError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError('');

    try {
      await api.delete(`/api/registration/${deleteTarget.id}`, {
        headers: { 'x-admin-token': token },
      });
      setRegistrations((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete registration.');
    } finally {
      setIsDeleting(false);
    }
  };

  const saveEdit = async (updates, validationError) => {
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setIsSaving(true);
    setEditError('');

    try {
      const response = await api.patch(`/api/registration/${editTarget.id}`, updates, {
        headers: { 'x-admin-token': token },
      });
      setRegistrations((current) =>
        current.map((item) => (item.id === editTarget.id ? { ...item, ...response.data } : item))
      );
      setEditTarget(null);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Unable to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPassengers = (item) =>
    item.passengers?.length > 0
      ? item.passengers.map((p) => `Seat ${p.seat}: ${p.name}`).join('; ')
      : item.fullname;

  const downloadCSV = () => {
    const headers = ['Full Name', 'Phone', 'Pickup', 'Destination', 'Seats', 'Selected Seats', 'Passengers', 'Amount', 'Status', 'Reference', 'Payment Date', 'Created At'];
    const rows = filtered.map((item) => [
      item.fullname,
      item.phone,
      item.pickup_location,
      item.destination,
      item.seats,
      item.selected_seats?.join(', ') || '',
      formatPassengers(item),
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

  const escapeHtml = (value) =>
    String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const downloadWord = () => {
    const headers = ['Payer', 'Phone', 'Pickup', 'Destination', 'Selected Seats', 'Passengers', 'Amount', 'Status'];

    const headerRow = headers.map((h) => `<th style="border:1px solid #ccc;padding:8px;background:#f1f5f9;text-align:left;">${h}</th>`).join('');

    const bodyRows = filtered
      .map((item) => {
        const cells = [
          item.fullname,
          item.phone,
          item.pickup_location,
          item.destination,
          item.selected_seats?.join(', ') || '',
          formatPassengers(item),
          formatCurrency(item.amount),
          item.payment_status,
        ];
        return `<tr>${cells.map((c) => `<td style="border:1px solid #ccc;padding:8px;">${escapeHtml(c)}</td>`).join('')}</tr>`;
      })
      .join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>Mpoto Ride Registrations</title></head>
        <body>
          <h2>Mpoto Ride — Registrations</h2>
          <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'must-ride-registrations.doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Strips everything but digits, so a stored phone number like
  // "+265 999 123 456" or "0999123456" becomes a clean wa.me-compatible
  // number. Adjust the country code below if yours differs.
  const toWhatsAppNumber = (phone) => {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '265' + digits.slice(1);
    }
    return digits;
  };

  const generateReceiptDoc = (item) => {
    const receiptNumber = item.payment_reference || item.id;
    const statusColor = item.payment_status === 'Paid' ? '#059669' : '#d97706';

    const passengerRows = (item.passengers?.length > 0
      ? item.passengers
      : [{ seat: item.selected_seats?.[0] || '-', name: item.fullname }]
    )
      .map(
        (p) =>
          `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(p.seat)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(p.name)}</td></tr>`
      )
      .join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Receipt ${escapeHtml(receiptNumber)}</title>
          <style>
            @page Section1 {
              size: 11in 8.5in;
              mso-page-orientation: landscape;
            }
            div.Section1 { page: Section1; }
          </style>
        </head>
        <body style="font-family:Arial,sans-serif;color:#1e293b;margin:0;">
          <div class="Section1">
            <table width="100%" height="100%" style="border-collapse:collapse;">
              <tr>
                <td align="center" valign="middle">
                  <div style="width:520px;text-align:left;">
                    <div style="background:#047857;padding:26px 30px;border-radius:12px 12px 0 0;">
                      <h1 style="color:#ffffff;margin:0;font-size:30px;">Mpoto Ride</h1>
                      <p style="color:#d1fae5;margin:6px 0 0;font-size:15px;">Official Booking Receipt</p>
                    </div>

                    <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 12px 12px;">
                      <table style="width:100%;margin-bottom:20px;">
                        <tr>
                          <td style="font-size:14px;color:#64748b;">Receipt No.</td>
                          <td style="font-size:14px;color:#64748b;text-align:right;">Status</td>
                        </tr>
                        <tr>
                          <td style="font-size:18px;font-weight:bold;">${escapeHtml(receiptNumber)}</td>
                          <td style="text-align:right;">
                            <span style="background:${statusColor};color:#ffffff;padding:6px 14px;border-radius:14px;font-size:13px;font-weight:bold;">
                              ${escapeHtml(item.payment_status)}
                            </span>
                          </td>
                        </tr>
                      </table>

                      <table style="width:100%;margin-bottom:20px;">
                        <tr>
                          <td style="padding:8px 0;color:#64748b;font-size:14px;">Name</td>
                          <td style="padding:8px 0;font-weight:bold;text-align:right;font-size:16px;">${escapeHtml(item.fullname)}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#64748b;font-size:14px;">Phone</td>
                          <td style="padding:8px 0;font-weight:bold;text-align:right;font-size:16px;">${escapeHtml(item.phone)}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#64748b;font-size:14px;">Route</td>
                          <td style="padding:8px 0;font-weight:bold;text-align:right;font-size:16px;">${escapeHtml(item.pickup_location)} → ${escapeHtml(item.destination)}</td>
                        </tr>
                      </table>

                      <p style="font-size:14px;color:#64748b;margin-bottom:8px;">Passengers</p>
                      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                        <thead>
                          <tr>
                            <th style="padding:10px;border:1px solid #e2e8f0;background:#f0fdf4;text-align:left;font-size:14px;">Seat</th>
                            <th style="padding:10px;border:1px solid #e2e8f0;background:#f0fdf4;text-align:left;font-size:14px;">Name</th>
                          </tr>
                        </thead>
                        <tbody>${passengerRows}</tbody>
                      </table>

                      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:18px;border-radius:10px;text-align:right;">
                        <p style="margin:0;color:#64748b;font-size:14px;">Total Paid</p>
                        <p style="margin:4px 0 0;color:#047857;font-size:30px;font-weight:bold;">${formatCurrency(item.amount)}</p>
                      </div>

                      <div style="margin-top:28px;">
                        <img src="${window.location.origin}/signature.png" alt="" style="height:55px;" />
                        <p style="border-top:1px solid #94a3b8;display:inline-block;padding-top:5px;margin-top:3px;font-size:13px;color:#64748b;">Authorized signature</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `receipt-${item.fullname.replace(/\s+/g, '-')}-${receiptNumber.slice(0, 8)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendReceipt = (item) => {
    generateReceiptDoc(item);

    const whatsappNumber = toWhatsAppNumber(item.phone);
    const message = encodeURIComponent(
      `Hello ${item.fullname}, this is your Mpoto Ride receipt.\n\nThank you for riding with us!`
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
      {!token ? (
        <div className="mx-auto max-w-xl rounded-3xl bg-slate-50 p-8 shadow-sm shadow-slate-200">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-secondary">Admin login</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Secure access</h2>
            <p className="mt-2 text-slate-600">Enter the admin token to view registrations.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Admin token</label>
            <input
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Enter admin token"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Sign in
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-secondary">Admin dashboard</p>
              <h2 className="text-3xl font-semibold text-slate-900">Registration summary</h2>
              <p className="text-slate-600">Review recent signups, payment status, and export registrations.</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={downloadCSV}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={downloadWord}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Download Word
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
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
                <th className="px-5 py-4 font-medium">Payer</th>
                <th className="px-5 py-4 font-medium">Phone</th>
                <th className="px-5 py-4 font-medium">Pickup</th>
                <th className="px-5 py-4 font-medium">Destination</th>
                <th className="px-5 py-4 font-medium">Selected seats</th>
                <th className="px-5 py-4 font-medium">Passengers</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((registration) => (
                <tr key={registration.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-slate-800">{registration.fullname}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.phone}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.pickup_location}</td>
                  <td className="px-5 py-4 text-slate-600">{registration.destination}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {registration.selected_seats?.join(', ') || '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {registration.passengers?.length > 0 ? (
                      <ul className="space-y-0.5">
                        {registration.passengers.map((p) => (
                          <li key={p.seat}>
                            <span className="font-medium text-slate-800">Seat {p.seat}:</span> {p.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-800">{formatCurrency(registration.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${registration.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {registration.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => sendReceipt(registration)}
                        className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Send Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditError('');
                          setEditTarget(registration);
                        }}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(registration)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-5 py-10 text-center text-slate-500">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      <DeleteConfirmModal
        registration={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <EditRegistrationModal
        registration={editTarget}
        onCancel={() => setEditTarget(null)}
        onSave={saveEdit}
        isSaving={isSaving}
        error={editError}
      />
    </section>
  );
}

export default AdminPage;