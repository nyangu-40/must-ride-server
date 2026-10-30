import Joi from 'joi';
import supabase from '../database/supabaseClient.js';
import { PAYOUTS_ENABLED } from '../config/index.js';
import {
  getPaychanguPayoutLookups,
  initializePaychanguPayout,
  verifyWebhookSignature,
} from '../services/paychanguService.js';

const payoutSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  method: Joi.string().valid('mobile_money', 'bank').required(),
  destination: Joi.object({
    operator_id: Joi.string().trim(),
    phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/),
    bank_id: Joi.string().trim(),
    account_name: Joi.string().trim().min(2).max(100),
    account_number: Joi.string().trim().min(4).max(40),
  }).unknown(false).required(),
}).custom((value, helpers) => {
  const allowedFields = value.method === 'mobile_money'
    ? ['operator_id', 'phone']
    : ['bank_id', 'account_name', 'account_number'];
  const destinationKeys = Object.keys(value.destination);
  if (destinationKeys.some((key) => !allowedFields.includes(key))
    || allowedFields.some((key) => !value.destination[key])) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'payout destination validation');

function requirePayoutsEnabled(res) {
  if (PAYOUTS_ENABLED) return true;
  res.status(503).json({ message: 'Payouts are not enabled for this platform.' });
  return false;
}

function lookupItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export async function getLookups(req, res, next) {
  try {
    if (!requirePayoutsEnabled(res)) return;
    const lookups = await getPaychanguPayoutLookups();
    return res.json(lookups);
  } catch (error) {
    return next(error);
  }
}

export async function createPayout(req, res, next) {
  try {
    if (!requirePayoutsEnabled(res)) return;
    const { error: validationError, value } = payoutSchema.validate(req.body, { abortEarly: false });
    if (validationError) return res.status(400).json({ message: 'Invalid payout amount, method, or destination.' });

    const lookups = await getPaychanguPayoutLookups();
    const items = lookupItems(value.method === 'mobile_money' ? lookups.operators : lookups.banks);
    const lookupId = value.method === 'mobile_money' ? value.destination.operator_id : value.destination.bank_id;
    const accepted = items.some((item) => String(
      item.id || item.operator_id || item.bank_id || item.bank_code || item.code,
    ) === String(lookupId));
    if (!accepted) return res.status(400).json({ message: 'Choose a valid payout operator or bank from the lookup list.' });

    const { data: created, error: createError } = await supabase.rpc('request_payout', {
      p_organizer_id: req.organizer.id,
      p_amount: value.amount,
      p_method: value.method,
      p_destination: value.destination,
    });
    if (createError) {
      if (createError.code === '22023') return res.status(400).json({ message: createError.message });
      throw createError;
    }
    const payout = Array.isArray(created) ? created[0] : created;

    try {
      const response = await initializePaychanguPayout(payout);
      const responseData = response?.data || {};
      const reference = responseData.reference || responseData.payout_reference || responseData.ref || null;
      const { data: updated, error: settleError } = await supabase.rpc('settle_payout', {
        p_payout_id: payout.id,
        p_status: 'processing',
        p_paychangu_ref: reference,
        p_raw_response: response,
      });
      if (settleError) throw settleError;
      return res.status(201).json({ payout: Array.isArray(updated) ? updated[0] : updated });
    } catch (providerError) {
      const { error: settleError } = await supabase.rpc('settle_payout', {
        p_payout_id: payout.id,
        p_status: 'failed',
        p_raw_response: { message: 'Payout initialization failed.' },
      });
      if (settleError) throw settleError;
      return res.status(502).json({ message: 'Payout provider could not initialize the withdrawal. The amount is available again.' });
    }
  } catch (error) {
    return next(error);
  }
}

export async function listPayouts(req, res, next) {
  try {
    const { data, error } = await supabase.from('payouts').select('id, amount, method, destination, status, paychangu_ref, created_at, updated_at')
      .eq('organizer_id', req.organizer.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function handlePayoutWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paychangu-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature.' });
    }
    const payload = req.body || {};
    const payoutId = payload.reference || payload.tx_ref || payload.data?.reference || payload.data?.tx_ref;
    const status = String(payload.status || payload.data?.status || '').toLowerCase();
    if (!payoutId || !['success', 'successful', 'paid', 'failed', 'declined', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payout notification.' });
    }
    const nextStatus = ['success', 'successful', 'paid'].includes(status) ? 'paid' : 'failed';
    const { data, error } = await supabase.rpc('settle_payout', {
      p_payout_id: payoutId,
      p_status: nextStatus,
      p_paychangu_ref: payload.payment_reference || payload.data?.payment_reference || null,
      p_raw_response: payload,
    });
    if (error) throw error;
    return res.json({ success: true, payoutId: (Array.isArray(data) ? data[0] : data).id });
  } catch (error) {
    return next(error);
  }
}
