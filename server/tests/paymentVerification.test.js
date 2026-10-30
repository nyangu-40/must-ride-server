import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesVerifiedPayment } from '../services/paymentVerification.js';
import { calculateTripPrice } from '../services/tripPricing.js';

const registration = { id: 'reg-123', amount: 20000 };

test('accepts verified payment with the expected transaction, amount and currency', () => {
  assert.equal(matchesVerifiedPayment({
    isPaid: true, txRef: registration.id, amount: '20000.00', currency: 'MWK',
  }, registration), true);
});

test('rejects unverified transactions', () => {
  assert.equal(matchesVerifiedPayment({
    isPaid: false, txRef: registration.id, amount: 20000, currency: 'MWK',
  }, registration), false);
});

test('rejects amount, currency and reference mismatches', () => {
  for (const verification of [
    { isPaid: true, txRef: registration.id, amount: 19999, currency: 'MWK' },
    { isPaid: true, txRef: registration.id, amount: 20000, currency: 'USD' },
    { isPaid: true, txRef: 'another-registration', amount: 20000, currency: 'MWK' },
    { isPaid: true, txRef: registration.id, amount: 'not-a-number', currency: 'MWK' },
  ]) {
    assert.equal(matchesVerifiedPayment(verification, registration), false);
  }
});

test('enforces flexible trip minimum and maximum per seat', () => {
  const trip = { price_mode: 'flexible', min_amount: 2000, max_amount: 5000, price_per_seat: 3000 };
  assert.throws(() => calculateTripPrice(trip, 2, 1999, 100), /between 2000 and 5000/);
  assert.throws(() => calculateTripPrice(trip, 2, 5001, 100), /between 2000 and 5000/);
});

test('calculates the stored charge from trip pricing and ignores a client total', () => {
  const trip = { price_mode: 'flexible', min_amount: 2000, max_amount: 5000, price_per_seat: 3000 };
  const clientRequest = { chosenAmountPerSeat: 2500, totalAmount: 1 };
  const priced = calculateTripPrice(trip, 2, clientRequest.chosenAmountPerSeat, 100);
  assert.deepEqual(priced, { amount: 5000, chosenAmountPerSeat: 2500 });
  assert.equal(matchesVerifiedPayment({
    isPaid: true, txRef: registration.id, amount: 5000, currency: 'MWK',
  }, { ...registration, amount: priced.amount }), true);
});

test('fixed trip pricing comes from the trip row, not client price or total', () => {
  assert.deepEqual(
    calculateTripPrice({ price_mode: 'fixed', price_per_seat: 10000 }, 2, 1, 100),
    { amount: 20000, chosenAmountPerSeat: null },
  );
});
