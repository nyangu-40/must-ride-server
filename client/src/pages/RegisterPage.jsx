import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BusFront } from 'lucide-react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/formatters.js';
import { getBrandStyle } from '../utils/branding.js';
import { Stepper } from '../components/ui.jsx';

function RegisterPage() {
  const { slug, tripId } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [trip, setTrip] = useState(null);
  const [seatCount, setSeatCount] = useState(0);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    pickup_location: '',
    destination: '',
  });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerNames, setPassengerNames] = useState({});
  const [takenSeats, setTakenSeats] = useState([]);
  const [seatNames, setSeatNames] = useState({});
  const [chosenAmountPerSeat, setChosenAmountPerSeat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const amountPerSeat = trip?.price_mode === 'flexible'
    ? Number(chosenAmountPerSeat)
    : Number(trip?.price_per_seat || 0);
  const totalAmount = useMemo(() => selectedSeats.length * amountPerSeat, [selectedSeats.length, amountPerSeat]);
  const minimumAmount = Math.max(Number(trip?.min_amount) || 0, 100);
  const maximumAmount = trip?.max_amount === null || trip?.max_amount === undefined ? null : Number(trip.max_amount);
  const validFlexibleAmount = trip?.price_mode !== 'flexible'
    || (Number.isInteger(amountPerSeat) && amountPerSeat >= minimumAmount && (maximumAmount === null || amountPerSeat <= maximumAmount));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function goToStep(nextStep) {
    setError('');
    if (nextStep > activeStep && activeStep === 1) {
      if (!form.fullname.trim() || !form.phone.trim() || !form.pickup_location) {
        setError('Enter your name, phone number, and pickup location to continue.');
        return;
      }
      if (form.email && !document.getElementById('booking-email')?.checkValidity()) {
        setError('Enter a valid email address or leave the email field blank.');
        return;
      }
    }
    if (nextStep > activeStep && activeStep === 2) {
      if (selectedSeats.length === 0) {
        setError('Select at least one available seat to continue.');
        return;
      }
      const missingPassenger = selectedSeats.slice(1).find((seat) => !passengerNames[seat]?.trim());
      if (missingPassenger) {
        setError(`Please enter the passenger name for seat ${missingPassenger}.`);
        return;
      }
    }
    setActiveStep(nextStep);
  }

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
    let active = true;
    async function loadTrip() {
      try {
        const { data: publicPage } = await api.get(`/api/public/organizers/${encodeURIComponent(slug)}`);
        if (!active) return;
        setOrganizer(publicPage.organizer);
        if (publicPage.bookingsClosed) {
          setError('Bookings are currently closed for this organiser.');
          return;
        }
        const currentTrip = publicPage.trips.find((item) => item.id === tripId);
        if (!currentTrip) {
          setError('This trip is not currently available for booking.');
          return;
        }
        setTrip(currentTrip);
        setChosenAmountPerSeat(String(currentTrip.price_per_seat || currentTrip.min_amount || ''));
        setSeatCount(currentTrip.seat_count);
        setPickupLocations(currentTrip.pickup_locations || []);
        setForm((current) => ({
          ...current,
          pickup_location: currentTrip.pickup_locations?.[0] || '',
          destination: currentTrip.destination,
        }));
        const { data: seats } = await api.get(`/api/public/trips/${encodeURIComponent(tripId)}/seats`);
        if (!active) return;
        setTakenSeats(seats.seats || []);
        setSeatNames(seats.seatNames || {});
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Unable to load this trip.');
      } finally {
        if (active) setIsLoadingTrip(false);
      }
    }

    loadTrip();
    return () => { active = false; };
  }, [slug, tripId]);

  function SeatMapModal({ open, onClose, selectedSeats, onToggle, takenSeats, seatNames }) {
    const [infoSeat, setInfoSeat] = useState(null);

    if (!open) return null;

    // layout: 2 seats on left, aisle, 3 seats on right (matches the desired bus seating)
    const perRow = 5; // 2 + aisle + 3
    const rows = Math.ceil(seatCount / perRow);
    const seats = [];
    let counter = 1;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < perRow; c++) {
        if (counter <= seatCount) {
          row.push(counter.toString());
        } else {
          row.push(null);
        }
        counter++;
      }
      seats.push(row);
    }

    const payerSeat = selectedSeats[0];

    const handleSeatClick = (seat) => {
      const isTaken = takenSeats.includes(seat);
      if (isTaken) {
        setInfoSeat(seat);
        return;
      }
      setInfoSeat(null);
      onToggle(seat);
    };

    const seatButton = (seat, rowIndex, seatIndex) => {
      if (!seat) return <div key={`empty-${rowIndex}-${seatIndex}`} />;

      const selected = selectedSeats.includes(seat);
      const isPayer = payerSeat === seat;
      const isTaken = takenSeats.includes(seat);

      const baseClass = 'flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold transition';

      const className = isTaken
        ? `${baseClass} border-red-500 bg-red-100 text-red-700 cursor-pointer`
        : isPayer
        ? `${baseClass} border-yellow-400 bg-yellow-100 text-yellow-800`
        : selected
        ? `${baseClass} border-amber-400 bg-amber-100 text-amber-700`
        : `${baseClass} border-green-400 bg-green-100 text-green-800 hover:bg-green-200`;

      // Note: taken seats are NOT given the native `disabled` attribute
      // anymore — disabled buttons don't fire onClick in the browser, and
      // we need the click to still register so we can show who's in it.
      // Selection is still prevented in handleSeatClick/onToggle above.
      return (
        <button key={seat} type="button" onClick={() => handleSeatClick(seat)} className={className}>
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
              <h3 className="text-lg font-semibold text-slate-900">Select seats</h3>
              <button type="button" onClick={onClose} className="text-sm text-emerald-700">Close</button>
            </div>
            <p className="text-sm text-slate-500 mt-2">Tap a seat to select it. Tap a taken (red) seat to see who's registered there.</p>
          </div>

          {/* body: only the seat grid scrolls, so header/footer stay visible on short phone screens */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {infoSeat && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Seat {infoSeat} is registered to <span className="font-semibold">{seatNames[infoSeat] || 'a passenger'}</span>.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 p-4">
              {/* front of the bus: steering wheel + front seat */}
              <div className="mb-3 grid grid-cols-[1fr_1fr_0.5rem_1fr_1fr] items-center gap-2">
                <div className="col-span-2 flex justify-start">
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 text-xs font-semibold text-slate-800">
                    <BusFront size={16} aria-hidden="true" /> FRONT
                  </div>
                </div>
                <div />
                <div className="col-span-2 flex justify-end">
                  <div className="h-11 w-11 rounded-xl border border-yellow-500 bg-yellow-100" aria-hidden="true" />
                </div>
              </div>

              <div className="grid gap-2">
                {seats.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-[1fr_1fr_0.5rem_1fr_1fr] items-center gap-2">
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      {row.slice(0, 2).map((seat, seatIndex) => seatButton(seat, rowIndex, seatIndex))}
                    </div>

                    <div className="h-8 flex items-center justify-center">
                      <div className="h-8 w-[2px] bg-slate-200 rounded" />
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-2">
                      {row.slice(2, 5).map((seat, seatIndex) => seatButton(seat, rowIndex, seatIndex + 2))}
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
                <div className="h-4 w-4 rounded border border-green-500 bg-green-100" />
                <span className="text-sm text-slate-700">Available</span>
              </div>
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
                <span className="text-sm text-slate-700">Taken (tap to see name)</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">Done</button>
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
    if (!validFlexibleAmount) {
      setError(`Enter a whole-number amount between ${formatCurrency(minimumAmount)}${maximumAmount === null ? '+' : ` and ${formatCurrency(maximumAmount)}`} per seat.`);
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

      const response = await api.post(`/api/public/trips/${encodeURIComponent(tripId)}/payment`, {
        fullname: form.fullname,
        email: form.email.trim() || undefined,
        phone: form.phone,
        pickup_location: form.pickup_location,
        selected_seats: selectedSeats,
        passengers,
        ...(trip.price_mode === 'flexible' ? { chosen_amount_per_seat: amountPerSeat } : {}),
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

  if (isLoadingTrip) {
    return <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-soft">Loading trip...</section>;
  }
  if (!trip) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-900">{organizer?.name || 'Booking unavailable'}</h1>
        <p className="mt-3 text-slate-600">{error || 'Bookings are currently closed.'}</p>
        <a href={`/#/o/${encodeURIComponent(slug)}`} className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white">Back to trips</a>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-soft shadow-slate-200" style={getBrandStyle(organizer?.primary_color)}>
      {/* Photo banner with the heading overlaid directly on it */}
      <div className="relative h-64 w-full overflow-hidden sm:h-72">
        <img src="/bus-photo1.jpg.png" alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 30%, color-mix(in srgb, var(--brand) 88%, transparent) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-center sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/80">{organizer?.name}</p>
          <h2 className="text-3xl font-semibold text-white">{trip.title}</h2>
          <p className="mx-auto max-w-md text-white/90">{trip.origin} to {trip.destination}. {trip.price_mode === 'flexible' ? `Choose from ${formatCurrency(trip.min_amount)}${trip.max_amount ? ` to ${formatCurrency(trip.max_amount)}` : ' per seat or more'}.` : `${formatCurrency(trip.price_per_seat)} per seat.`} Select seats and names, then proceed to payment.</p>
        </div>
      </div>

      <div className="p-5 pb-28 sm:p-8 sm:pb-8">
        <div className="mb-6"><Stepper steps={['Details', 'Seats', 'Pay']} activeStep={activeStep} /></div>
        <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
        {activeStep === 1 && <>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input
              name="fullname"
              type="text"
              value={form.fullname}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              placeholder="Gift Nyangu"
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
              className="mt-2 w-full rounded-3xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              placeholder="+265 999 123 456"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email (optional)</span>
          <input id="booking-email" name="email" type="email" value={form.email} onChange={handleChange}
            className="mt-2 w-full rounded-3xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            placeholder="you@example.com" />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Pickup Location</span>
            <select
              name="pickup_location"
              value={form.pickup_location}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-3xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            >
              {pickupLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Destination</span>
            <div className="mt-2 rounded-3xl border border-emerald-100 bg-slate-100 px-4 py-3 text-slate-700">{trip.destination}</div>
          </label>
        </div>
        </>}

        {activeStep === 2 && <>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Choose your seats</p>
              <p className="mt-1 text-sm text-slate-500">Click to select the seat(s) you want. The first selected seat will be assigned to the payer.</p>
            </div>
            <div className="self-start whitespace-nowrap rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} selected
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setShowSeatMap(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 sm:w-auto"
            >
              Open seat map
            </button>
            <p className="text-sm text-slate-600 sm:text-right">Selected seats: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</p>
          </div>

          <SeatMapModal
            open={showSeatMap}
            onClose={() => setShowSeatMap(false)}
            selectedSeats={selectedSeats}
            onToggle={handleSeatToggle}
            takenSeats={takenSeats}
            seatNames={seatNames}
          />
        </div>

        </>}

        {activeStep === 3 && <>
        {trip.price_mode === 'flexible' ? <div className="rounded-3xl border border-emerald-100 bg-white p-5">
          <label className="block text-sm font-semibold text-slate-800">Choose an amount per seat (MWK)
            <input type="number" inputMode="numeric" min={minimumAmount} max={maximumAmount || undefined} step="1" value={chosenAmountPerSeat}
              onChange={(event) => setChosenAmountPerSeat(event.target.value)}
              aria-invalid={Boolean(chosenAmountPerSeat) && !validFlexibleAmount}
              aria-describedby="flexible-price-help flexible-price-error"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-lg text-slate-900 focus:border-emerald-600 focus:outline-none" />
          </label>
          <p id="flexible-price-help" className="mt-2 text-sm text-slate-600">Per-seat range: {formatCurrency(minimumAmount)}{maximumAmount === null ? ' or more' : `–${formatCurrency(maximumAmount)}`}. Choose a whole number.</p>
          <div className="mt-3 flex flex-wrap gap-2">{[minimumAmount, Number(trip.price_per_seat), maximumAmount].filter((value, index, list) => Number.isInteger(value) && value >= minimumAmount && (maximumAmount === null || value <= maximumAmount) && list.indexOf(value) === index).map((value) => <button key={value} type="button" onClick={() => setChosenAmountPerSeat(String(value))} className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-900">MWK {formatCurrency(value)}</button>)}</div>
          {chosenAmountPerSeat && !validFlexibleAmount && <p id="flexible-price-error" role="alert" className="mt-2 text-sm text-red-700">Enter a whole number within this trip’s allowed range.</p>}
        </div> : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Fixed price: {formatCurrency(trip.price_per_seat)} per seat</p>}

        {selectedSeats.length > 1 && (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6">
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
                    className="mt-2 w-full rounded-3xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
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
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-sm font-medium text-slate-700">Total Amount</p>
            {trip.price_mode === 'flexible' && <p className="mt-1 text-xs text-slate-500">{formatCurrency(amountPerSeat)} × {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'}</p>}
            <p className="mt-3 text-3xl font-semibold text-emerald-700">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        </>}
        {error && activeStep !== 3 && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {activeStep > 1 && <button type="button" onClick={() => goToStep(activeStep - 1)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800">Back</button>}
          {activeStep < 3
            ? <button type="button" onClick={() => goToStep(activeStep + 1)} className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-base font-semibold text-white sm:ml-auto sm:w-auto">{activeStep === 1 ? 'Choose seats' : 'Review and pay'}</button>
            : <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 w-full justify-center rounded-full bg-brand px-6 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{isSubmitting ? 'Redirecting to PayChangu...' : 'Proceed to Payment'}</button>}
        </div>
      </form>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div><p className="text-xs text-slate-600">{selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} · Total</p><p className="text-lg font-bold text-slate-950">{formatCurrency(totalAmount)}</p></div>
          {activeStep === 3
            ? <button form="booking-form" type="submit" disabled={isSubmitting} className="min-h-11 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Please wait…' : 'Pay now'}</button>
            : <button type="button" onClick={() => goToStep(activeStep + 1)} className="min-h-11 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">{activeStep === 1 ? 'Continue' : 'Review and pay'}</button>}
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;