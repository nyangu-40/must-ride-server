import { useMemo, useState, useEffect } from 'react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';

const PRICE_PER_SEAT = 100;
const SEAT_COUNT = 72;
const seatLabels = Array.from({ length: SEAT_COUNT }, (_, index) => (index + 1).toString());

function RegisterPage() {
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    pickup_location: '',
    destination: '',
  });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerNames, setPassengerNames] = useState({});
  const [takenSeats, setTakenSeats] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSeatMap, setShowSeatMap] = useState(false);

  const totalAmount = useMemo(() => selectedSeats.length * PRICE_PER_SEAT, [selectedSeats.length]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSeatToggle = (seat) => {
    if (takenSeats.includes(seat)) return; // cannot toggle a taken seat
    setSelectedSeats((prevSelected) => {
      const isAlreadySelected = prevSelected.includes(seat);
      if (isAlreadySelected) {
        setPassengerNames((prevPassengers) => {
          const nextPassengers = { ...prevPassengers };
          delete nextPassengers[seat];
          return nextPassengers;
        });
        return prevSelected.filter((item) => item !== seat);
      }
      return [...prevSelected, seat];
    });
  };

  useEffect(() => {
    async function loadTaken() {
      try {
        const resp = await api.get('/api/seats');
        setTakenSeats(resp.data.seats || []);
      } catch (err) {
        // ignore load errors; seats will appear available
        console.warn('Unable to load taken seats', err?.message || err);
      }
    }

    loadTaken();
  }, []);

  function SeatMapModal({ open, onClose, selectedSeats, onToggle, takenSeats }) {
    if (!open) return null;

    // layout: 2 seats on left, aisle, 3 seats on right (matches the desired bus seating)
    const perRow = 5; // 2 + aisle + 3
    const rows = Math.ceil(SEAT_COUNT / perRow);
    const seats = [];
    let counter = 1;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < perRow; c++) {
        if (counter <= SEAT_COUNT) {
          row.push(counter.toString());
        } else {
          row.push(null);
        }
        counter++;
      }
      seats.push(row);
    }

    const payerSeat = selectedSeats[0];

    const seatButton = (seat, rowIndex) => {
      if (!seat) return <div key={`empty-${rowIndex}-${Math.random()}`} />;

      const selected = selectedSeats.includes(seat);
      const isPayer = payerSeat === seat;
      const isTaken = takenSeats.includes(seat);

      const baseClass = 'rounded-md border w-9 h-8 text-xs font-semibold transition';

      const className = isTaken
        ? `${baseClass} border-red-500 bg-red-100 text-red-700 cursor-not-allowed`
        : isPayer
        ? `${baseClass} border-yellow-400 bg-yellow-100 text-yellow-800`
        : selected
        ? `${baseClass} border-amber-400 bg-amber-100 text-amber-700`
        : `${baseClass} border-green-400 bg-green-100 text-green-800 hover:bg-green-200`;

      return (
        <button key={seat} type="button" onClick={() => onToggle(seat)} className={className} disabled={isTaken}>
          {seat}
        </button>
      );
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        {/* whole modal is capped to the viewport height and laid out as header / scrollable body / footer */}
        <div className="flex w-full max-w-md max-h-[85vh] flex-col rounded-2xl bg-white">
          {/* header: stays fixed at the top, never scrolls away */}
          <div className="shrink-0 border-b border-slate-100 p-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select seats</h3>
              <button type="button" onClick={onClose} className="text-sm text-slate-600">Close</button>
            </div>
            <p className="text-sm text-slate-500 mt-2">Tap a seat to select it. First selected seat becomes the payer.</p>
          </div>

          {/* body: only the seat grid scrolls, so header/footer stay visible on short phone screens */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              {/* front of the bus: steering wheel + front seat */}
              <div className="grid grid-cols-[1fr_1fr_0.5rem_1fr_1fr] items-center gap-2 mb-3">
                <div className="col-span-2 flex justify-start">
                  <div className="rounded-md border border-yellow-400 bg-yellow-100 w-9 h-8 flex items-center justify-center text-yellow-800">
                    🛞
                  </div>
                </div>
                <div />
                <div className="col-span-2 flex justify-end">
                  <div className="rounded-md border border-yellow-400 bg-yellow-100 w-9 h-8" />
                </div>
              </div>

              <div className="grid gap-2">
                {seats.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-[1fr_1fr_0.5rem_1fr_1fr] items-center gap-2">
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      {row.slice(0, 2).map((seat) => seatButton(seat, rowIndex))}
                    </div>

                    <div className="h-8 flex items-center justify-center">
                      <div className="h-8 w-[2px] bg-slate-200 rounded" />
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-2">
                      {row.slice(2, 5).map((seat) => seatButton(seat, rowIndex))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* footer: stays fixed at the bottom, so Done/legend are always visible without scrolling */}
          <div className="shrink-0 border-t border-slate-100 p-6 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-400" />
                <span className="text-sm text-slate-700">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-400" />
                <span className="text-sm text-slate-700">Payer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-500" />
                <span className="text-sm text-slate-700">Taken</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePassengerNameChange = (event) => {
    const { name, value } = event.target;
    setPassengerNames((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (selectedSeats.length === 0) {
      setError('Please select at least one seat before continuing.');
      return;
    }

    const missingPassenger = selectedSeats.slice(1).find((seat) => !passengerNames[seat]?.trim());
    if (missingPassenger) {
      setError(`Please enter the passenger name for seat ${missingPassenger}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const passengers = selectedSeats.map((seat, index) => ({
        seat,
        name: index === 0 ? form.fullname.trim() : passengerNames[seat].trim(),
      }));

      const response = await api.post('/api/payment', {
        fullname: form.fullname,
        phone: form.phone,
        pickup_location: form.pickup_location,
        destination: form.destination,
        seats: selectedSeats.length,
        selected_seats: selectedSeats,
        passengers,
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
      <div className="mb-8 space-y-3 text-center">
        <h2 className="text-3xl font-semibold text-slate-900">Complete your booking</h2>
        <p className="text-slate-600">Select seats, add names for additional passengers, then proceed to payment.</p>
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
              placeholder="Nyangu"
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

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Choose your seats</p>
              <p className="mt-1 text-sm text-slate-500">Click to select the seat(s) you want. The first selected seat will be assigned to the payer.</p>
            </div>
            <div className="self-start whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} selected
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setShowSeatMap(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:w-auto"
            >
              Open seat map
            </button>
            <p className="text-sm text-slate-600 sm:text-right">Selected seats: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</p>
          </div>

          <SeatMapModal open={showSeatMap} onClose={() => setShowSeatMap(false)} selectedSeats={selectedSeats} onToggle={handleSeatToggle} takenSeats={takenSeats} />
        </div>

        {selectedSeats.length > 1 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="mb-4 text-sm font-medium text-slate-700">Passenger names for additional seats</p>
            <div className="grid gap-4">
              {selectedSeats.slice(1).map((seat) => (
                <label className="block" key={seat}>
                  <span className="text-sm font-medium text-slate-700">Passenger for seat {seat}</span>
                  <input
                    name={seat}
                    type="text"
                    value={passengerNames[seat] || ''}
                    onChange={handlePassengerNameChange}
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-primary"
                    placeholder={`Passenger name for seat ${seat}`}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Summary</p>
            <p className="mt-3 text-slate-600">Seats selected: {selectedSeats.length}</p>
            <p className="mt-2 text-slate-600">Passengers: {selectedSeats.length > 0 ? selectedSeats.length : 0}</p>
          </div>
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