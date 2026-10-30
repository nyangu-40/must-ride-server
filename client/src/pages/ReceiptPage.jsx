import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';
import { getBrandStyle } from '../utils/branding.js';
import { Button } from '../components/ui.jsx';

function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    async function loadReceipt() {
      try {
        setIsLoading(true);
        setError('');

        const hash = window.location.hash || '';
        const hashWithoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
        const rawQuery = hashWithoutHash.includes('?') ? hashWithoutHash.split('?').slice(1).join('?') : window.location.search?.replace(/^\?/, '') || '';
        const params = new URLSearchParams(rawQuery);
        const shouldConfirm = params.get('status') === 'success' || params.get('payment') === 'success' || params.get('confirmed') === 'true';

        if (shouldConfirm) {
          try {
            await api.post(`/api/registration/${id}/confirm-payment`, { payment_reference: id });
          } catch (confirmError) {
            console.warn('Unable to confirm payment from receipt page', confirmError);
          }
        }

        const response = await api.get(`/api/registration/${id}/receipt`);
        setReceipt(response.data.receipt);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load receipt.');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadReceipt();
    }
  }, [id]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-soft shadow-slate-200 text-center">
        <p className="text-slate-600">Loading receipt...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-soft shadow-slate-200">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <div className="mt-4 text-center">
          <Link to="/register" className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Back to booking
          </Link>
        </div>
      </section>
    );
  }

  const isPaid = receipt.payment_status === 'Paid';
  function downloadPdf() {
    const document = new jsPDF();
    document.setFontSize(20);
    document.text(receipt.organizer?.name || 'Tiyende Bookings', 20, 24);
    document.setFontSize(16);
    document.text('Booking receipt', 20, 38);
    document.setFontSize(11);
    [
      `Payment status: ${receipt.payment_status}`,
      `Passenger: ${receipt.fullname}`,
      `Phone: ${receipt.phone}`,
      `Trip: ${receipt.trip_title || `${receipt.origin} to ${receipt.destination}`}`,
      `Seats: ${receipt.selected_seats?.join(', ') || 'None'}`,
      `Pickup: ${receipt.pickup_location}`,
      `Destination: ${receipt.destination}`,
      `Amount: ${formatCurrency(receipt.amount)}`,
      `Reference: ${receipt.payment_reference || '—'}`,
    ].forEach((line, index) => document.text(line, 20, 54 + index * 9, { maxWidth: 170 }));
    document.text('Powered by Tiyende Bookings', 20, 150);
    document.save(`tiyende-bookings-receipt-${id}.pdf`);
  }

  async function shareReceipt() {
    setShareMessage('');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Booking receipt', url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage('Receipt link copied.');
    } catch {
      setShareMessage('Unable to share automatically. Copy the receipt URL from your browser.');
    }
  }

  return (
    <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-soft shadow-slate-200" style={getBrandStyle(receipt.organizer?.primary_color)}>
      {/* Landscape ticket layout: a stub on the left with the essentials
          (name, phone, seats), main details on the right. */}
      <div className="flex flex-col sm:flex-row">
        {/* Stub */}
        <div className="flex shrink-0 flex-col justify-between gap-4 bg-emerald-700 p-5 sm:w-48" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-contrast)' }}>
          <div>
            {receipt.organizer?.logo_url && <img src={receipt.organizer.logo_url} alt="" className="mb-2 h-10 w-10 rounded-full bg-white object-contain p-1" />}
            <p className="text-xs font-medium uppercase tracking-[0.2em]">{receipt.organizer?.name || 'Tiyende Bookings'}</p>
            <p
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isPaid ? 'bg-white text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {receipt.payment_status}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Total paid</p>
            <p className="text-2xl font-semibold">{formatCurrency(receipt.amount)}</p>
            {receipt.chosen_amount_per_seat && <p className="mt-1 text-xs opacity-90">{formatCurrency(receipt.chosen_amount_per_seat)} per seat</p>}
          </div>
        </div>

        {/* Main details */}
        <div className="flex-1 border-t border-dashed border-slate-200 p-5 sm:border-l sm:border-t-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="font-semibold text-slate-900">{receipt.fullname}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="font-semibold text-slate-900">{receipt.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Seats</p>
              <p className="font-semibold text-slate-900">{receipt.selected_seats?.join(', ') || 'None'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pickup</p>
              <p className="font-semibold text-slate-900">{receipt.pickup_location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Destination</p>
              <p className="font-semibold text-slate-900">{receipt.destination}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ref</p>
              <p className="truncate font-semibold text-slate-900">{receipt.payment_reference || '—'}</p>
            </div>
          </div>

          {receipt.passengers?.length > 1 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">Passengers</p>
              <p className="mt-1 text-sm text-slate-700">
                {receipt.passengers.map((p) => `Seat ${p.seat}: ${p.name}`).join(' · ')}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3 print:hidden">
            <Button type="button" onClick={downloadPdf} className="flex-1 sm:flex-none">Download PDF</Button>
            <Button type="button" variant="secondary" onClick={shareReceipt} className="flex-1 sm:flex-none">Share receipt</Button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition sm:flex-none"
            >
              Print
            </button>
            <Link
              to={receipt.organizer?.slug ? `/o/${receipt.organizer.slug}` : '/o/mpoto-ride'}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:flex-none"
            >
              Book another
            </Link>
          </div>
          {shareMessage && <p role="status" className="mt-3 text-sm text-slate-700">{shareMessage}</p>}
        </div>
      </div>
      <p className="pb-4 text-center text-xs text-slate-400">Powered by Tiyende Bookings</p>
    </section>
  );
}

export default ReceiptPage;