import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';

function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-soft shadow-slate-200">
      {/* Landscape ticket layout: a stub on the left with the essentials
          (name, phone, seats), main details on the right. */}
      <div className="flex flex-col sm:flex-row">
        {/* Stub */}
        <div className="flex shrink-0 flex-col justify-between gap-4 bg-emerald-700 p-5 text-white sm:w-48">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100">Mpoto Ride</p>
            <p
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isPaid ? 'bg-white text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {receipt.payment_status}
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-100">Total paid</p>
            <p className="text-2xl font-semibold">{formatCurrency(receipt.amount)}</p>
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

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:flex-none"
            >
              Print
            </button>
            <Link
              to="/register"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:flex-none"
            >
              Book another
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReceiptPage;