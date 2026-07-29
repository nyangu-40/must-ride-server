import axios from 'axios';
import crypto from 'crypto';
import { PAYCHANGU_SECRET_KEY, PAYCHANGU_WEBHOOK_SECRET, FRONTEND_URL, SERVER_URL } from '../config/index.js';

const PAYCHANGU_API_URL = 'https://api.paychangu.com/payment';

if (!PAYCHANGU_SECRET_KEY) {
  throw new Error('PayChangu secret key is required.');
}

export async function createPaychanguCheckout({ fullName, email, phone, amount, reference }) {
  // callback_url: PayChangu calls this SERVER-TO-SERVER after payment finishes.
  // Must be your real public backend URL — falls back to localhost if
  // SERVER_URL isn't set as an env var on Render, which is exactly what
  // caused the broken redirect you saw.
  const webhookUrl = `${SERVER_URL}/webhook/paychangu`;

  // return_url: where the person's BROWSER lands after checkout.
  const returnUrl = `${FRONTEND_URL}/#/receipt/${reference}?status=success`;

  console.log('Using SERVER_URL:', SERVER_URL);
  console.log('Using FRONTEND_URL:', FRONTEND_URL);

  const payload = {
    amount,
    currency: 'MWK',
    tx_ref: reference,
    callback_url: webhookUrl,
    return_url: returnUrl,
    first_name: fullName.split(' ')[0],
    last_name: fullName.split(' ').slice(1).join(' ') || fullName.split(' ')[0],
    email: email || 'customer@example.com',
    meta: {
      reference,
      phone,
    },
  };

  console.log('PayChangu checkout payload callback_url:', payload.callback_url);
  console.log('PayChangu checkout payload return_url:', payload.return_url);

  const response = await axios.post(PAYCHANGU_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.data?.data?.checkout_url) {
    throw new Error('PayChangu checkout URL not returned.');
  }

  const checkoutUrl = response.data.data.checkout_url;
  return { checkout_url: checkoutUrl, raw: response.data };
}

export function verifyWebhookSignature(payload, signature) {
  if (!PAYCHANGU_WEBHOOK_SECRET) {
    throw new Error('PayChangu webhook secret is required.');
  }

  const hmac = crypto.createHmac('sha256', PAYCHANGU_WEBHOOK_SECRET);
  hmac.update(payload);
  const expected = hmac.digest('hex');
  return expected === signature;
}