import { useMemo, useState } from 'react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';

const PRICE_PER_SEAT = 100;

function RegisterPage() {
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    pickup_location: '',
    destination: '',
    seats: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = useMemo(() => {
    const seats = Number(form.seats) || 0;
    return seats > 0 ? seats * PRICE_PER_SEAT : 0;
  }, [form.seats]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'seats' ? Math.max(1, Number(value)) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/api/payment', {
        fullname: form.fullname,
        phone: form.phone,
        pickup_location: form.pickup_location,
        destination: form.destination,
        seats: Number(form.seats),
      });

      const { checkoutUrl } = response.data;
      if (!checkoutUrl) {
        throw new Error('Unable to create payment session.');
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to start payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
      <div className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-secondary">Register for a trip</p>
        <h2 className="text-3xl font-semibold text-slate-900">Complete your booking</h2>
        <p className="text-slate-600">Fill in your details and pay securely with PayChangu. Seats are charged at MWK 100 each.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input
              name="fullname"
              type="text"
              value={form.fullname}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
              placeholder="John Doe"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone Number</span>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
              placeholder="+265 999 123 456"
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Pickup Location</span>
            <input
              name="pickup_location"
              type="text"
              value={form.pickup_location}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
              placeholder="Mzuzu Campus"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Destination</span>
            <input
              name="destination"
              type="text"
              value={form.destination}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
              placeholder="Town Center"
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Number of Seats</span>
            <input
              name="seats"
              type="number"
              min={1}
              value={form.seats}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
            />
          </label>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Total Amount</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Redirecting to PayChangu...' : 'Proceed to Payment'}
        </button>
      </form>
    </section>
  );
}

export default RegisterPage;
