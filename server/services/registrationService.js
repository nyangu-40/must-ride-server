import supabase from '../database/supabaseClient.js';

export async function createRegistration(payload) {
  const { data, error } = await supabase.from('registrations').insert([payload]).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getAllRegistrations() {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRegistrationById(id) {
  const { data, error } = await supabase.from('registrations').select('*').eq('id', id).single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updatePaymentStatus(id, updates) {
  const { data, error } = await supabase
    .from('registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Generic update for editing registration details (name, phone, seats, etc.)
// from the admin dashboard — separate from updatePaymentStatus, which only
// touches payment fields.
export async function updateRegistration(id, updates) {
  const { data, error } = await supabase
    .from('registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function findRegistrationByReference(reference) {
  if (!reference) {
    return null;
  }

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('payment_reference', reference)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Only PAID registrations hold a seat. A Pending registration (someone
// started checkout but never completed payment) no longer blocks the seat
// for others — it stays available until payment actually succeeds.
export async function getTakenSeats() {
  const { data, error } = await supabase
    .from('registrations')
    .select('selected_seats')
    .eq('payment_status', 'Paid');

  if (error) {
    throw new Error(error.message);
  }

  const seats = (data || []).flatMap((row) => row.selected_seats || []);
  return seats;
}

export async function deleteRegistration(id) {
  const { data, error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}