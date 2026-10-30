import axios from 'axios';
import crypto from 'crypto';
import {
  PAYCHANGU_SECRET_KEY, PAYCHANGU_WEBHOOK_SECRET, FRONTEND_URL, SERVER_URL,
  PAYCHANGU_PAYOUTS_URL,
} from '../config/index.js';

const PAYCHANGU_API_URL = 'https://api.paychangu.com/payment';
const PAYCHANGU_VERIFY_URL = 'https://api.paychangu.com/verify-payment';

function requirePaychanguSecret() {
  if (!PAYCHANGU_SECRET_KEY) {
    throw new Error('PayChangu secret key is required. Set PAYCHANGU_SECRET_KEY in the root .env file.');
  }
}

export async function createPaychanguCheckout({ fullName, email, phone, amount, reference }) {
  requirePaychanguSecret();
  const webhookUrl = `${SERVER_URL}/webhook/paychangu`;
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
    meta: {
      reference,
      phone,
    },
  };
  if (email) payload.email = email;

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

// Re-verifies a transaction directly with PayChangu's API rather than
// trusting a redirect query param alone. Returns { isPaid, amount, currency, raw }.
export async function verifyPaychanguPayment(txRef) {
  requirePaychanguSecret();
  const response = await axios.get(`${PAYCHANGU_VERIFY_URL}/${txRef}`, {
    headers: {
      Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
      Accept: 'application/json',
    },
  });

  const data = response.data?.data;
  const isPaid = !!data && data.status === 'success' && data.tx_ref === txRef;

  return {
    isPaid,
    amount: data?.amount ?? null,
    currency: data?.currency ?? null,
    txRef: data?.tx_ref ?? null,
    raw: response.data,
  };
}

async function payoutRequest(method, path, data) {
  requirePaychanguSecret();
  return axios({
    method,
    url: `${PAYCHANGU_PAYOUTS_URL}${path}`,
    data,
    headers: {
      Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export async function getPaychanguPayoutLookups() {
  const [operators, banks] = await Promise.all([
    payoutRequest('get', '/operators'),
    payoutRequest('get', '/banks'),
  ]);
  return { operators: operators.data, banks: banks.data };
}

export async function initializePaychanguPayout(payout) {
  const response = await payoutRequest('post', '/initialize', {
    reference: payout.id,
    amount: payout.amount,
    currency: 'MWK',
    method: payout.method,
    destination: payout.destination,
    callback_url: `${SERVER_URL}/webhook/paychangu/payout`,
  });
  return response.data;
}

export async function getPaychanguBalance() {
  requirePaychanguSecret();
  const response = await axios.get('https://api.paychangu.com/balance', {
    headers: {
      Authorization: `Bearer ${PAYCHANGU_SECRET_KEY}`,
      Accept: 'application/json',
    },
  });
  const amount = response.data?.data?.balance ?? response.data?.balance;
  if (!Number.isFinite(Number(amount))) {
    throw new Error('PayChangu balance response did not contain a numeric balance.');
  }
  return Number(amount);
}

export function verifyWebhookSignature(payload, signature) {
  if (!PAYCHANGU_WEBHOOK_SECRET) {
    throw new Error('PayChangu webhook secret is required.');
  }

  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const hmac = crypto.createHmac('sha256', PAYCHANGU_WEBHOOK_SECRET);
  hmac.update(payload);
  const expected = hmac.digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
}