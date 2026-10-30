import crypto from 'crypto';
import Joi from 'joi';
import { createClient } from '@supabase/supabase-js';
import supabase from '../database/supabaseClient.js';
import { PAYOUTS_ENABLED, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IMPERSONATION_SECRET } from '../config/index.js';
import { getPaychanguBalance, initializePaychanguPayout } from '../services/paychanguService.js';
import { isValidOrganizerSlug } from '../services/organizerSlug.js';

async function writeAudit(req, action, targetType, targetId, metadata = {}) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: req.user.id, action, target_type: targetType, target_id: String(targetId || ''), metadata,
  });
  if (error) throw error;
}

function isExpired(organizer) {
  return Boolean(organizer.active_until && new Date(organizer.active_until) <= new Date());
}

function asNum(value) {
  return Number(value || 0);
}

export async function getOverview(req, res, next) {
  try {
    const { data, error } = await supabase.rpc('platform_overview_metrics');
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function listOrganizers(req, res, next) {
  try {
    const { data: organizers, error } = await supabase.from('organizers')
      .select('id, owner_user_id, name, slug, status, subscription_plan, active_until, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const search = String(req.query.search || '').toLowerCase();
    const result = await Promise.all((organizers || []).map(async (organizer) => {
      const [tripCount, registrations, ledger] = await Promise.all([
        supabase.from('trips').select('id', { count: 'exact', head: true }).eq('organizer_id', organizer.id),
        supabase.from('registrations').select('seats, payment_status, created_at').eq('organizer_id', organizer.id)
          .order('created_at', { ascending: false }),
        supabase.from('wallet_transactions').select('amount, type').eq('organizer_id', organizer.id),
      ]);
      if (tripCount.error) throw tripCount.error;
      if (registrations.error) throw registrations.error;
      if (ledger.error) throw ledger.error;
      const records = registrations.data || [];
      const transactions = ledger.data || [];
      return {
        ...organizer,
        expired: isExpired(organizer),
        trips: tripCount.count || 0,
        seats_sold: records.filter((row) => row.payment_status === 'Paid').reduce((sum, row) => sum + Number(row.seats || 0), 0),
        revenue: transactions.filter((row) => row.type === 'sale').reduce((sum, row) => sum + asNum(row.amount), 0),
        balance: transactions.reduce((sum, row) => sum + asNum(row.amount), 0),
        last_activity: records[0]?.created_at || organizer.created_at,
      };
    }));
    return res.json(result.filter((row) => !search || `${row.name} ${row.slug}`.toLowerCase().includes(search)));
  } catch (error) {
    return next(error);
  }
}

export async function listApplications(req, res, next) {
  try {
    const { data, error } = await supabase.from('organizers')
      .select('id, name, slug, owner_name, owner_email, contact_phone, status, rejection_reason, created_at')
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

function addCalendarMonths(from, months) {
  const date = new Date(from);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

const approveApplicationSchema = Joi.object({
  months: Joi.number().integer().min(1).max(36),
  active_until: Joi.date().iso().greater('now'),
  amount: Joi.number().min(0).required(),
  method: Joi.string().trim().min(1).max(80).required(),
  note: Joi.string().trim().max(500).allow('', null),
}).xor('months', 'active_until');

export async function approveApplication(req, res, next) {
  try {
    const { error: validation, value } = approveApplicationSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json({ message: validation.details.map((item) => item.message).join(', ') });
    const activeUntil = value.active_until || addCalendarMonths(new Date(), value.months);
    const { data, error } = await supabase.rpc('approve_organizer_application', {
      p_organizer_id: req.params.id,
      p_active_until: activeUntil.toISOString(),
      p_amount: value.amount,
      p_method: value.method,
      p_note: value.note || null,
      p_approved_by: req.user.id,
    });
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ message: error.message });
      if (error.code === '22023') return res.status(409).json({ message: error.message });
      throw error;
    }
    return res.json(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    return next(error);
  }
}

const rejectApplicationSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(1000).required(),
}).unknown(false);

export async function rejectApplication(req, res, next) {
  try {
    const { error: validation, value } = rejectApplicationSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json({ message: validation.details.map((item) => item.message).join(', ') });
    const { data, error } = await supabase.rpc('reject_organizer_application', {
      p_organizer_id: req.params.id,
      p_reason: value.reason,
      p_rejected_by: req.user.id,
    });
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ message: error.message });
      if (error.code === '22023') return res.status(409).json({ message: error.message });
      throw error;
    }
    return res.json(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    return next(error);
  }
}

const createOrganizerSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required(),
  email: Joi.string().trim().email().required(),
  primary_color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#059669'),
  tagline: Joi.string().trim().max(160).allow('', null),
  contact_phone: Joi.string().trim().max(30).allow('', null),
  active_until: Joi.date().iso().allow(null),
});

export async function createOrganizer(req, res, next) {
  try {
    const { error: validation, value } = createOrganizerSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json({ message: validation.details.map((item) => item.message).join(', ') });
    if (!isValidOrganizerSlug(value.slug)) return res.status(400).json({ message: 'That public address is reserved or invalid.' });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: invite, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(value.email);
    if (inviteError) return res.status(400).json({ message: inviteError.message });
    const { data: organizer, error: createError } = await supabase.from('organizers').insert({
      owner_user_id: invite.user.id,
      name: value.name,
      slug: value.slug,
      primary_color: value.primary_color,
      tagline: value.tagline || null,
      contact_phone: value.contact_phone || null,
      active_until: value.active_until || new Date().toISOString(),
    }).select('id, name, slug, status, active_until').single();
    if (createError) {
      if (createError.code === '23505' || createError.code === '23514') {
        await adminClient.auth.admin.deleteUser(invite.user.id);
        return res.status(409).json({ message: 'That public address is reserved or already in use.' });
      }
      throw createError;
    }
    const { error: profileError } = await supabase.from('profiles').upsert({ user_id: invite.user.id, role: 'organizer' });
    if (profileError) throw profileError;
    await writeAudit(req, 'organizer_created', 'organizer', organizer.id, { email: value.email });
    return res.status(201).json(organizer);
  } catch (error) {
    return next(error);
  }
}

const updateOrganizerSchema = Joi.object({
  name: Joi.string().trim().min(2),
  status: Joi.string().valid('active', 'suspended'),
  subscription_plan: Joi.string().trim().min(1),
  active_until: Joi.date().iso().allow(null),
  subscription_amount: Joi.number().min(0),
  subscription_method: Joi.string().trim().min(1),
  subscription_note: Joi.string().trim().allow('', null),
}).min(1);

export async function updateOrganizer(req, res, next) {
  try {
    const { error: validation, value } = updateOrganizerSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json({ message: validation.details.map((item) => item.message).join(', ') });
    const { data: previous, error: getError } = await supabase.from('organizers').select('*').eq('id', req.params.id).maybeSingle();
    if (getError) throw getError;
    if (!previous) return res.status(404).json({ message: 'Organizer not found.' });
    if (value.status && !['active', 'suspended'].includes(previous.status)) {
      return res.status(409).json({ message: 'Applications must be approved or rejected from the Applications page.' });
    }

    const subscriptionFields = ['active_until', 'subscription_amount', 'subscription_method', 'subscription_note'];
    const extending = Object.keys(value).some((key) => subscriptionFields.includes(key));
    if (extending && (!value.active_until || !value.subscription_method)) {
      return res.status(400).json({ message: 'Set active_until and subscription_method to record an extension.' });
    }
    if (extending && new Date(value.active_until) <= new Date()) {
      return res.status(400).json({ message: 'Subscription expiry must be in the future.' });
    }
    if (extending && previous.active_until && new Date(previous.active_until) > new Date()
      && new Date(value.active_until) <= new Date(previous.active_until)) {
      return res.status(400).json({ message: 'New expiry must extend the current active period.' });
    }
    const updates = {};
    for (const key of ['name', 'status', 'subscription_plan']) {
      if (key in value) updates[key] = value[key];
    }
    let data = previous;
    if (Object.keys(updates).length) {
      const { data: updated, error } = await supabase.from('organizers').update(updates).eq('id', previous.id).select().single();
      if (error) throw error;
      data = updated;
    }

    if (extending) {
      const { data: extended, error: subscriptionError } = await supabase.rpc('extend_organizer_subscription', {
        p_organizer_id: previous.id,
        p_active_until: value.active_until,
        p_plan: value.subscription_plan || previous.subscription_plan,
        p_amount: value.subscription_amount || 0,
        p_method: value.subscription_method,
        p_note: value.subscription_note || null,
        p_recorded_by: req.user.id,
      });
      if (subscriptionError) throw subscriptionError;
      data = Array.isArray(extended) ? extended[0] : extended;
      await writeAudit(req, 'subscription_extended', 'organizer', previous.id, { active_until: value.active_until });
    }
    if (value.status && value.status !== previous.status) {
      await writeAudit(req, value.status === 'suspended' ? 'organizer_suspended' : 'organizer_unsuspended', 'organizer', previous.id);
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function getOrganizerDetail(req, res, next) {
  try {
    const { data: organizer, error } = await supabase.from('organizers').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!organizer) return res.status(404).json({ message: 'Organizer not found.' });
    const [trips, registrations, transactions, payouts, subscriptions] = await Promise.all([
      supabase.from('trips').select('*').eq('organizer_id', organizer.id),
      supabase.from('registrations').select('*').eq('organizer_id', organizer.id).order('created_at', { ascending: false }),
      supabase.from('wallet_transactions').select('*').eq('organizer_id', organizer.id).order('created_at', { ascending: false }),
      supabase.from('payouts').select('*').eq('organizer_id', organizer.id).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('organizer_id', organizer.id).order('period_end', { ascending: false }),
    ]);
    for (const result of [trips, registrations, transactions, payouts, subscriptions]) if (result.error) throw result.error;
    return res.json({ organizer, trips: trips.data, registrations: registrations.data, transactions: transactions.data, payouts: payouts.data, subscriptions: subscriptions.data });
  } catch (error) {
    return next(error);
  }
}

export async function listTransactions(req, res, next) {
  try {
    let query = supabase.from('wallet_transactions').select('*, organizers(name, slug)')
      .order('created_at', { ascending: false }).limit(1000);
    if (req.query.type) query = query.eq('type', req.query.type);
    if (req.query.organizer_id) query = query.eq('organizer_id', req.query.organizer_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function listRegistrations(req, res, next) {
  try {
    let query = supabase.from('registrations').select('*, organizers(name, slug), trips(title, departure_at)')
      .order('created_at', { ascending: false }).limit(1000);
    if (req.query.status) query = query.eq('payment_status', req.query.status);
    if (req.query.organizer_id) query = query.eq('organizer_id', req.query.organizer_id);
    if (req.query.trip_id) query = query.eq('trip_id', req.query.trip_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function listPayouts(req, res, next) {
  try {
    const { data, error } = await supabase.from('payouts').select('*, organizers(name, slug)')
      .order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function payoutAction(req, res, next) {
  try {
    const { action } = req.body || {};
    const { data: payout, error } = await supabase.from('payouts').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!payout) return res.status(404).json({ message: 'Payout not found.' });

    let updated;
    if (action === 'mark_paid') {
      const result = await supabase.rpc('settle_payout', { p_payout_id: payout.id, p_status: 'paid', p_raw_response: { marked_manually: true } });
      if (result.error) throw result.error;
      updated = Array.isArray(result.data) ? result.data[0] : result.data;
    } else if (action === 'retry') {
      if (!PAYOUTS_ENABLED) return res.status(503).json({ message: 'Payouts are not enabled for this platform.' });
      if (payout.status !== 'failed') return res.status(409).json({ message: 'Only failed payouts can be retried.' });
      const response = await initializePaychanguPayout(payout);
      const result = await supabase.rpc('settle_payout', {
        p_payout_id: payout.id, p_status: 'processing',
        p_paychangu_ref: response?.data?.reference || response?.data?.payout_reference || null,
        p_raw_response: response,
      });
      if (result.error) throw result.error;
      updated = Array.isArray(result.data) ? result.data[0] : result.data;
    } else {
      return res.status(400).json({ message: 'Action must be retry or mark_paid.' });
    }
    await writeAudit(req, `payout_${action}`, 'payout', payout.id, { organizer_id: payout.organizer_id, amount: payout.amount });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function reconcile(req, res, next) {
  try {
    const [{ data: ledger, error: ledgerError }, { data: payouts, error: payoutsError }] = await Promise.all([
      supabase.from('wallet_transactions').select('amount, type'),
      supabase.from('payouts').select('amount, status'),
    ]);
    if (ledgerError) throw ledgerError;
    if (payoutsError) throw payoutsError;
    const owed = (ledger || []).reduce((sum, row) => sum + asNum(row.amount), 0);
    const pending = (payouts || []).filter((row) => ['requested', 'processing'].includes(row.status))
      .reduce((sum, row) => sum + asNum(row.amount), 0);
    let platformBalance = null;
    let providerError = null;
    if (PAYOUTS_ENABLED) {
      try {
        platformBalance = await getPaychanguBalance();
      } catch (error) {
        providerError = error.message;
      }
    } else {
      providerError = 'Payout APIs are disabled.';
    }
    const internalOwed = owed - pending;
    return res.json({
      platform_balance: platformBalance,
      organiser_available_balances: internalOwed,
      difference: platformBalance === null ? null : platformBalance - internalOwed,
      matched: platformBalance === null ? null : Math.abs(platformBalance - internalOwed) < 0.01,
      pending_payouts: pending,
      provider_error: providerError,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAuditLog(req, res, next) {
  try {
    const { data, error } = await supabase.from('audit_log').select('*')
      .order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

function signImpersonationToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', IMPERSONATION_SECRET).update(encoded).digest('base64url');
  return `v1.${encoded}.${signature}`;
}

export async function createViewAsToken(req, res, next) {
  try {
    if (!IMPERSONATION_SECRET) return res.status(503).json({ message: 'Read-only view-as is not configured.' });
    const { data: organizer, error } = await supabase.from('organizers')
      .select('id, name, owner_user_id').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!organizer) return res.status(404).json({ message: 'Organizer not found.' });
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    const readOnlyToken = signImpersonationToken({
      type: 'view_as', organizerId: organizer.id, actorId: req.user.id, exp: expiresAt,
    });
    await writeAudit(req, 'organizer_view_as_started', 'organizer', organizer.id, { expires_at: expiresAt });
    return res.json({ readOnlyToken, organizer: { id: organizer.id, name: organizer.name }, expires_at: expiresAt });
  } catch (error) {
    return next(error);
  }
}

export async function extendSubscription(req, res, next) {
  return updateOrganizer(req, res, next);
}
