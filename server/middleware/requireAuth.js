import supabase from '../database/supabaseClient.js';
import crypto from 'crypto';
import { IMPERSONATION_SECRET } from '../config/index.js';

export function rejectViewAsWrites(req, res, next) {
  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer v1.') && req.method !== 'GET') {
    return res.status(403).json({ message: 'View-as sessions are read-only.' });
  }
  return next();
}

async function authenticateViewAs(token, req, res) {
  const parts = token.split('.');
  if (!IMPERSONATION_SECRET || parts.length !== 3 || parts[0] !== 'v1') {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return false;
  }
  const expected = crypto.createHmac('sha256', IMPERSONATION_SECRET).update(parts[1]).digest();
  let actual;
  try {
    actual = Buffer.from(parts[2], 'base64url');
  } catch {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return false;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return false;
  }
  if (payload.type !== 'view_as' || !Number.isInteger(payload.exp)
    || payload.exp <= Math.floor(Date.now() / 1000) || !payload.actorId || !payload.organizerId) {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return false;
  }
  if (req.method !== 'GET') {
    res.status(403).json({ message: 'View-as sessions are read-only.' });
    return false;
  }

  const { data: actorProfile, error: profileError } = await supabase.from('profiles')
    .select('role').eq('user_id', payload.actorId).maybeSingle();
  if (profileError) throw profileError;
  if (actorProfile?.role !== 'superadmin') {
    res.status(401).json({ message: 'Invalid or expired session.' });
    return false;
  }
  const { data: organizer, error: organizerError } = await supabase.from('organizers')
    .select('id, name, slug, logo_url, primary_color, tagline, contact_phone, status, subscription_plan, active_until, created_at, owner_user_id')
    .eq('id', payload.organizerId).maybeSingle();
  if (organizerError) throw organizerError;
  if (!organizer) {
    res.status(404).json({ message: 'Organizer not found.' });
    return false;
  }

  req.user = { id: organizer.owner_user_id || payload.actorId, email: null };
  req.profile = { role: 'organizer' };
  req.organizer = organizer;
  req.impersonation = { actorId: payload.actorId };

  const { error: auditError } = await supabase.from('audit_log').insert({
    actor_id: payload.actorId,
    action: 'organizer_view_as_request',
    target_type: 'organizer',
    target_id: organizer.id,
    metadata: { method: req.method, path: req.originalUrl },
  });
  if (auditError) throw auditError;
  return true;
}

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (token.startsWith('v1.')) {
      const valid = await authenticateViewAs(token, req, res);
      return valid ? next() : undefined;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return res.status(403).json({ message: 'Account role is not configured.' });

    req.user = data.user;
    req.profile = profile;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireOrganizer(req, res, next) {
  try {
    if (req.profile?.role !== 'organizer') {
      return res.status(403).json({ message: 'Organizer access required.' });
    }

    if (req.impersonation && req.organizer) return next();

    const { data, error } = await supabase
      .from('organizers')
      .select('id, name, slug, logo_url, primary_color, tagline, contact_phone, status, subscription_plan, active_until, rejection_reason, created_at')
      .eq('owner_user_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(403).json({ message: 'Organizer account is unavailable.' });
    }
    if (data.status === 'pending') return res.status(403).json({ code: 'APPLICATION_PENDING', message: 'Your application is awaiting approval.' });
    if (data.status === 'rejected') return res.status(403).json({ code: 'APPLICATION_REJECTED', message: 'Your application was declined.' });
    if (data.status !== 'active') {
      return res.status(403).json({ message: 'Organizer account is unavailable.' });
    }

    req.organizer = data;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireSuperadmin(req, res, next) {
  if (req.profile?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required.' });
  }
  return next();
}

export function requireOrganizerOrSuperadmin(req, res, next) {
  if (!['organizer', 'superadmin'].includes(req.profile?.role)) {
    return res.status(403).json({ message: 'Administrative access required.' });
  }
  return next();
}
