import { updatePaymentStatus, getRegistrationById, findRegistrationByReference } from '../services/registrationService.js';
import { verifyWebhookSignature } from '../services/paychanguService.js';

function normalizePaymentStatus(status) {
  if (!status) return 'Pending';
  const normalized = String(status).toLowerCase();
  if (['paid', 'successful', 'success', 'completed', 'complete', 'succeeded'].includes(normalized)) {
    return 'Paid';
  }
  return 'Pending';
}

export async function handlePayChanguWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paychangu-signature'] || req.headers['x-paychangu-signature'.toLowerCase()];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    const reference = payload.reference || payload.tx_ref || payload.data?.tx_ref || payload.id;
    const paymentReference = payload.payment_reference || payload.transaction_reference || payload.tx_ref || null;
    const paymentDate = payload.payment_date || payload.created_at || payload.completed_at || null;
    const paymentStatus = normalizePaymentStatus(payload.status || payload.payment_status || payload.state);

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

    if (paymentStatus === 'Pending' && registration.payment_status === 'Paid') {
      await updatePaymentStatus(registration.id, {
        payment_status: 'Pending',
        payment_reference: paymentReference || registration.payment_reference,
        payment_date: paymentDate || registration.payment_date,
      });
    }

    res.json({ success: true, registration: updated });
  } catch (err) {
    next(err);
  }
}
