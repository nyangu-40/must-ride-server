export function matchesVerifiedPayment(verification, registration) {
  return Boolean(
    verification?.isPaid
    && verification.txRef === registration.id
    && Number.isFinite(Number(verification.amount))
    && Number(verification.amount) === Number(registration.amount)
    && String(verification.currency || '').toUpperCase() === 'MWK',
  );
}
