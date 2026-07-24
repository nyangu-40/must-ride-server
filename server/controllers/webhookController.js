import { updatePaymentStatus, getRegistrationById } from '../services/registrationService.js';
import { verifyWebhookSignature } from '../services/paychanguService.js';

export async function handlePayChanguWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paychangu-signature'] || req.headers['x-paychangu-signature'.toLowerCase()];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { reference, status, payment_reference, payment_date } = req.body;
    const registration = await getRegistrationById(reference);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found for this webhook' });
    }

    const updated = await updatePaymentStatus(registration.id, {
      payment_status: status === 'paid' ? 'Paid' : 'Pending',
      payment_reference,
      payment_date,
    });

    res.json({ success: true, registration: updated });
  } catch (err) {
    next(err);
  }
}
