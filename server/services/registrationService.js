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

export async function findRegistrationByReference(reference) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('payment_reference', reference)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
