import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPERADMIN_EMAIL, and SUPERADMIN_PASSWORD are required.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let user = null;
for (let page = 1; !user; page += 1) {
  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (listError) throw listError;
  user = listedUsers.users.find(
    (candidate) => candidate.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase(),
  );
  if (listedUsers.users.length < 1000) break;
}

if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  user = data.user;
}

const { error: profileError } = await supabase
  .from('profiles')
  .upsert({ user_id: user.id, role: 'superadmin' }, { onConflict: 'user_id' });
if (profileError) throw profileError;

const pricePerSeat = Number(process.env.PRICE_PER_SEAT) || 10000;
const { data: organizer, error: organizerError } = await supabase.from('organizers')
  .select('id').eq('slug', 'mpoto-ride').single();
if (organizerError) throw organizerError;
const { error: tripError } = await supabase.from('trips')
  .update({ price_per_seat: pricePerSeat })
  .eq('organizer_id', organizer.id)
  .eq('title', 'Mpoto Ride to MUST');
if (tripError) throw tripError;

console.log(`Superadmin profile ensured for ${SUPERADMIN_EMAIL}.`);
