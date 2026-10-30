import supabase from '../database/supabaseClient.js';

export async function getReceiptById(req, res, next) {
  try {
    const { data, error } = await supabase.from('registrations')
      .select('id, organizer_id, fullname, email, phone, pickup_location, destination, seats, selected_seats, passengers, amount, chosen_amount_per_seat, payment_status, payment_reference, payment_date, created_at')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Registration not found.' });

    const { data: organizer, error: organizerError } = await supabase.from('organizers')
      .select('name, slug, logo_url, primary_color, tagline')
      .eq('id', data.organizer_id)
      .maybeSingle();
    if (organizerError) throw organizerError;
    return res.json({ receipt: { ...data, organizer } });
  } catch (error) {
    return next(error);
  }
}
