import { updatePaymentStatus, getRegistrationById, findRegistrationByReference } from '../services/registrationService.js';
import { verifyWebhookSignature, verifyPaychanguPayment } from '../services/paychanguService.js';
import { FRONTEND_URL } from '../config/index.js';

function normalizePaymentStatus(status) {
  if (!status) return 'Pending';
  const normalized = String(status).toLowerCase();
  const successValues = ['paid', 'successful', 'success', 'completed', 'complete', 'succeeded', 'approved', 'confirmed'];
  if (successValues.includes(normalized)) {
    return 'Paid';
  }
  if (['failed', 'cancelled', 'canceled', 'declined', 'expired', 'pending'].includes(normalized)) {
    return 'Pending';
  }
  return 'Pending';
}

// True server-to-server webhook path, with signature verification.
// Kept in case PayChangu also sends a signed POST notification separately
// from the GET redirect below.
export async function handlePayChanguWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paychangu-signature'] || req.headers['x-paychangu-signature'.toLowerCase()];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    console.log('PayChangu webhook payload:', JSON.stringify(payload));

    const reference = payload.reference || payload.tx_ref || payload.data?.tx_ref || payload.id;
    const paymentReference = payload.payment_reference || payload.transaction_reference || payload.tx_ref || null;
    const paymentDate = payload.payment_date || payload.created_at || payload.completed_at || null;
    const paymentStatus = normalizePaymentStatus(payload.status || payload.payment_status || payload.state || payload.data?.status || payload.data?.state);

    let registration = null;

    if (reference) {
      registration = await getRegistrationById(reference).catch(() => null);
    }

    if (!registration && paymentReference) {
      registration = await findRegistrationByReference(paymentReference).catch(() => null);
    }

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found for this webhook' });
    }

    const updated = await updatePaymentStatus(registration.id, {
      payment_status: paymentStatus,
      payment_reference: paymentReference || registration.payment_reference,
      payment_date: paymentDate || registration.payment_date,
    });

    res.json({ success: true, registration: updated });
  } catch (err) {
    next(err);
  }
}

// What PayChangu is actually calling in practice: a browser-style GET
// redirect to callback_url carrying tx_ref as a query param, with no
// signature. We don't trust that alone — verify the transaction directly
// against PayChangu's API, then update the registration and send the
// browser on to the receipt page.
export async function handlePayChanguRedirect(req, res, next) {
  try {
    const txRef = req.query.tx_ref;

    if (!txRef) {
      return res.redirect(`${FRONTEND_URL}/#/register`);
    }

    console.log('PayChangu GET callback for tx_ref:', txRef);

    let verification;
    try {
      verification = await verifyPaychanguPayment(txRef);
    } catch (verifyErr) {
      console.error('PayChangu verify-payment call failed:', verifyErr?.response?.data || verifyErr.message);
      return res.redirect(`${FRONTEND_URL}/#/receipt/${txRef}?status=pending`);
    }

    console.log('PayChangu verify-payment result:', JSON.stringify(verification.raw));

    const registration = await getRegistrationById(txRef).catch(() => null);
    if (!registration) {
      return res.redirect(`${FRONTEND_URL}/#/register`);
    }

    await updatePaymentStatus(registration.id, {
      payment_status: verification.isPaid ? 'Paid' : 'Pending',
      payment_reference: txRef,
      payment_date: verification.isPaid ? new Date().toISOString() : registration.payment_date,
    });

    return res.redirect(
      `${FRONTEND_URL}/#/receipt/${txRef}?status=${verification.isPaid ? 'success' : 'pending'}`
    );
  } catch (err) {
    next(err);
  }
}