import supabase from '../database/supabaseClient.js';

function throwOnError(error) {
  if (error) throw new Error(error.message);
}

export async function listTrips(organizerId) {
  const { data, error } = await supabase.from('trips').select('*')
    .eq('organizer_id', organizerId).order('departure_at', { ascending: true, nullsFirst: false });
  throwOnError(error);
  return data || [];
}

export async function getTrip(organizerId, tripId) {
  const { data, error } = await supabase.from('trips').select('*')
    .eq('organizer_id', organizerId).eq('id', tripId).maybeSingle();
  throwOnError(error);
  return data;
}

export async function listRegistrations(organizerId, tripId) {
  let query = supabase.from('registrations').select('*')
    .eq('organizer_id', organizerId).order('created_at', { ascending: false });
  if (tripId) query = query.eq('trip_id', tripId);
  const { data, error } = await query;
  throwOnError(error);
  return data || [];
}

export async function getRegistration(organizerId, registrationId) {
  const { data, error } = await supabase.from('registrations').select('*')
    .eq('organizer_id', organizerId).eq('id', registrationId).maybeSingle();
  throwOnError(error);
  return data;
}
