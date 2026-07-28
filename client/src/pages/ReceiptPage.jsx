import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';

function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setIsLoading(true);
        setError('');

        const hash = window.location.hash || '';
        const queryString = hash.includes('?') ? hash.split('?').slice(1).join('?') : '';
        const params = new URLSearchParams(queryString);
        const shouldConfirm = params.get('status') === 'success' || params.get('payment') === 'success';

        if (shouldConfirm) {
          await api.post(`/api/registration/${id}/confirm-payment`, { payment_reference: id });
          setPaymentConfirmed(true);
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
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200 text-center">
        <p className="text-slate-600">Loading receipt...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        <div className="mt-6 text-center">
          <Link to="/register" className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">
            Back to booking
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
      <div className="mb-8 space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-secondary">Payment Receipt</p>
        <h2 className="text-3xl font-semibold text-slate-900">Booking receipt</h2>
        <p className="text-slate-600">Use this receipt as proof of payment for your seats.</p>
      </div>

      {paymentConfirmed && (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          Payment completed successfully. Your receipt is ready.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Payer</p>
            <p className="mt-1 font-semibold text-slate-900">{receipt.fullname}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Phone</p>
            <p className="mt-1 font-semibold text-slate-900">{receipt.phone}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Pickup</p>
            <p className="mt-1 font-semibold text-slate-900">{receipt.pickup_location}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Destination</p>
            <p className="mt-1 font-semibold text-slate-900">{receipt.destination}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Selected seats</p>
            <p className="mt-1 font-semibold text-slate-900">{receipt.selected_seats?.join(', ') || 'None'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total paid</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{formatCurrency(receipt.amount)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-500">Passengers</p>
          <div className="mt-2 rounded-3xl bg-white p-4 text-sm text-slate-700">
            {receipt.passengers?.length > 0 ? (
              <ul className="space-y-2">
                {receipt.passengers.map((passenger) => (
                  <li key={passenger.seat}>
                    <span className="font-semibold text-slate-900">Seat {passenger.seat}:</span> {passenger.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No passenger details available.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${receipt.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {receipt.payment_status}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Payment ref</p>
            <p className="mt-1 font-semibold text-slate-900">{receipt.payment_reference || 'Not available'}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Receipt signature</p>
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
            <p className="text-lg font-semibold text-slate-900">Authorized signature</p>
            <p className="mt-2">_____________________________</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          Print receipt
        </button>
        <Link to="/register" className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
          Book another ride
        </Link>
      </div>
    </section>
  );
}

export default ReceiptPage;
