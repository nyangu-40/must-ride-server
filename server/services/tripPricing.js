export function calculateTripPrice(trip, seatCount, chosenAmountPerSeat, minPaymentAmount = 100) {
  if (!Number.isInteger(seatCount) || seatCount < 1) {
    throw new Error('Select at least one seat.');
  }

  if (trip.price_mode === 'flexible') {
    const chosen = Number(chosenAmountPerSeat);
    const minimum = Math.max(Number(trip.min_amount) || minPaymentAmount, minPaymentAmount);
    const maximum = trip.max_amount === null || trip.max_amount === undefined
      ? null
      : Number(trip.max_amount);
    if (!Number.isInteger(chosen) || chosen < minimum || (maximum !== null && chosen > maximum)) {
      throw new Error(`Choose a whole-number amount between ${minimum}${maximum === null ? '+' : ` and ${maximum}`} MWK per seat.`);
    }
    return { amount: chosen * seatCount, chosenAmountPerSeat: chosen };
  }

  const pricePerSeat = Number(trip.price_per_seat);
  if (!Number.isFinite(pricePerSeat) || pricePerSeat < minPaymentAmount) {
    throw new Error('This trip has an invalid fixed seat price.');
  }
  return { amount: pricePerSeat * seatCount, chosenAmountPerSeat: null };
}
