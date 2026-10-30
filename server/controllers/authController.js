import Joi from 'joi';
import { createClient } from '@supabase/supabase-js';
import supabase from '../database/supabaseClient.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/index.js';

const credentialsSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(1).required(),
});

let authClient;

function getAuthClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for login.');
  }
  if (!authClient) {
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return authClient;
}

export async function login(req, res, next) {
  try {
    const { error: validationError, value } = credentialsSchema.validate(req.body, { abortEarly: false });
    if (validationError) return res.status(400).json({ message: 'Valid email and password are required.' });

    const { data, error } = await getAuthClient().auth.signInWithPassword(value);
    if (error || !data.session) return res.status(401).json({ message: 'Invalid email or password.' });

    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('role').eq('user_id', data.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return res.status(403).json({ message: 'Account role is not configured.' });

    if (profile.role === 'superadmin') {
      const { error: auditError } = await supabase.from('audit_log').insert({
        actor_id: data.user.id,
        action: 'superadmin_login',
        target_type: 'user',
        target_id: data.user.id,
      });
      if (auditError) throw auditError;
    }

    return res.json({ session: data.session, role: profile.role });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    let organizer = null;
    if (req.profile.role === 'organizer' && req.impersonation) {
      organizer = {
        id: req.organizer.id,
        name: req.organizer.name,
        slug: req.organizer.slug,
        logo_url: req.organizer.logo_url,
        primary_color: req.organizer.primary_color,
        tagline: req.organizer.tagline,
        contact_phone: req.organizer.contact_phone,
        status: req.organizer.status,
        rejection_reason: req.organizer.rejection_reason,
        subscription_plan: req.organizer.subscription_plan,
        active_until: req.organizer.active_until,
      };
      return res.json({
        user: { id: req.user.id, email: null },
        role: req.profile.role,
        organizer,
        impersonating: true,
      });
    }
    if (req.profile.role === 'organizer') {
      const { data, error } = await supabase.from('organizers')
        .select('id, name, slug, logo_url, primary_color, tagline, contact_phone, status, rejection_reason, subscription_plan, active_until')
        .eq('owner_user_id', req.user.id).maybeSingle();
      if (error) throw error;
      organizer = data;
    }
    return res.json({
      user: { id: req.user.id, email: req.user.email },
      role: req.profile.role,
      organizer,
    });
  } catch (error) {
    return next(error);
  }
}
