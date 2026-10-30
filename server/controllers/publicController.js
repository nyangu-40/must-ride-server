import Joi from 'joi';
import { createClient } from '@supabase/supabase-js';
import supabase from '../database/supabaseClient.js';
import { FRONTEND_URL, MIN_PAYMENT_AMOUNT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config/index.js';
import {
  createPaychanguCheckout,
  verifyPaychanguPayment,
  verifyWebhookSignature,
} from '../services/paychanguService.js';
import { matchesVerifiedPayment } from '../services/paymentVerification.js';
import { isValidOrganizerSlug } from '../services/organizerSlug.js';
import { calculateTripPrice } from '../services/tripPricing.js';

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  owner_name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/).required(),
  password: Joi.string().min(8).max(128).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]{3,40}$/).required(),
}).unknown(false);

const bookingSchema = Joi.object({
  fullname: Joi.string().trim().min(3).required(),
  email: Joi.string().trim().email().allow('').optional(),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/).required(),
  pickup_location: Joi.string().trim().min(2).required(),
  selected_seats: Joi.array().items(Joi.string().trim().required()).min(1).unique().required(),
  passengers: Joi.array().items(Joi.object({
    seat: Joi.string().trim().required(),
    name: Joi.string().trim().min(1).required(),
  })).min(1).required(),
  chosen_amount_per_seat: Joi.number().integer().min(MIN_PAYMENT_AMOUNT),
}).unknown(true);

function isActive(organizer) {
  return organizer.status === 'active' && (!organizer.active_until || new Date(organizer.active_until) > new Date());
}

async function loadOrganizerBySlug(slug) {
  const { data, error } = await supabase
    .from('organizers')
    .select('id, name, slug, logo_url, primary_color, tagline, contact_phone, status, active_until')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOrganizerPublicPage(req, res, next) {
  try {
    const organizer = await loadOrganizerBySlug(req.params.slug);
    if (!organizer) return res.status(404).json({ message: 'Organizer not found.' });
    if (organizer.status !== 'active') {
      return res.json({ organizer: null, trips: [], bookingsClosed: true, notAvailable: true });
    }
    const bookingsClosed = !isActive(organizer);
    let trips = [];

    if (!bookingsClosed) {
      const { data, error } = await supabase
        .from('trips')
        .select('id, title, origin, destination, departure_at, price_per_seat, price_mode, min_amount, max_amount, seat_count, seat_layout, pickup_locations, status, description, amenities, cover_image_url, booking_image_url')
        .eq('organizer_id', organizer.id)
        .eq('status', 'open')
        .order('departure_at', { ascending: true, nullsFirst: false });
      if (error) throw error;

      trips = await Promise.all((data || []).map(async (trip) => {
        const { count, error: countError } = await supabase
          .from('registration_seats')
          .select('id', { count: 'exact', head: true })
          .eq('trip_id', trip.id)
          .in('status', ['held', 'paid'])
          .or(`status.eq.paid,and(status.eq.held,hold_expires_at.gt.${new Date().toISOString()})`);
        if (countError) throw countError;
        return { ...trip, seats_left: Math.max(0, trip.seat_count - (count || 0)) };
      }));
    }

    return res.json({ organizer, trips, bookingsClosed });
  } catch (error) {
    return next(error);
  }
}

export async function checkOrganizerSlug(req, res, next) {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
      return res.status(400).json({ available: false, message: 'Use 3–40 lowercase letters, numbers, or hyphens.' });
    }
    if (!isValidOrganizerSlug(slug)) return res.json({ available: false, message: 'That address is reserved.' });
    const { data, error } = await supabase.from('organizers').select('id').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return res.json({ available: !data, message: data ? 'That address is already in use.' : 'Address is available.' });
  } catch (error) {
    return next(error);
  }
}

export async function signupOrganizer(req, res, next) {
  let createdUserId;
  let createdOrganizerId;
  try {
    const { error: validationError, value } = signupSchema.validate(req.body, { abortEarly: false });
    if (validationError) return res.status(400).json({ message: validationError.details.map((item) => item.message).join(', ') });
    if (!isValidOrganizerSlug(value.slug)) {
      return res.status(400).json({ message: 'That public address is reserved or invalid.' });
    }
    const { data: existing, error: existingError } = await supabase.from('organizers')
      .select('id').eq('slug', value.slug).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return res.status(409).json({ message: 'That public address is already in use.' });

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: created, error: userError } = await adminClient.auth.admin.createUser({
      email: value.email,
      password: value.password,
      email_confirm: true,
      user_metadata: { full_name: value.owner_name },
    });
    if (userError) {
      if (userError.code === 'email_exists') {
        return res.status(409).json({ message: 'An account already exists for this email.' });
      }
      throw userError;
    }
    createdUserId = created.user.id;

    const { data: organizer, error: organizerError } = await supabase.from('organizers').insert({
      owner_user_id: createdUserId,
      owner_name: value.owner_name,
      owner_email: value.email,
      name: value.name,
      slug: value.slug,
      contact_phone: value.phone,
      status: 'pending',
      active_until: null,
    }).select('id').single();
    if (organizerError) {
      if (organizerError.code === '23505' || organizerError.code === '23514') {
        const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(createdUserId);
        if (deleteUserError) console.error('Signup rollback could not delete auth user:', deleteUserError.message);
        createdUserId = null;
        return res.status(409).json({ message: 'That public address is reserved or already in use.' });
      }
      throw organizerError;
    }
    createdOrganizerId = organizer.id;

    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: createdUserId,
      role: 'organizer',
    });
    if (profileError) throw profileError;

    return res.status(201).json({
      message: 'Application submitted. You can sign in to check its status.',
      slug: value.slug,
    });
  } catch (error) {
    if (createdUserId) {
      const { error: deleteOrganizerError } = createdOrganizerId
        ? await supabase.from('organizers').delete().eq('id', createdOrganizerId)
        : { error: null };
      if (deleteOrganizerError) console.error('Signup rollback could not delete organizer:', deleteOrganizerError.message);
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(createdUserId);
      if (deleteUserError) console.error('Signup rollback could not delete auth user:', deleteUserError.message);
    }
    return next(error);
  }
}

async function getOpenTrip(tripId) {
  const { data, error } = await supabase
    .from('trips')
    .select('*, organizers!inner(id, name, slug, logo_url, primary_color, status, active_until)')
    .eq('id', tripId)
    .eq('status', 'open')
    .eq('organizers.status', 'active')
    .maybeSingle();
  if (error) throw error;
  if (!data || !isActive(data.organizers)) return null;
  return data;
}

export async function getTripSeats(req, res, next) {
  try {
    const trip = await getOpenTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip is not available.' });

    const { data: seatRows, error: seatsError } = await supabase
      .from('registration_seats')
      .select('registration_id, seat_label, status, hold_expires_at')
      .eq('trip_id', trip.id)
      .in('status', ['held', 'paid']);
    if (seatsError) throw seatsError;
    const visibleSeats = (seatRows || []).filter(
      (row) => row.status === 'paid' || new Date(row.hold_expires_at) > new Date(),
    );
    const registrationIds = [...new Set(visibleSeats.map((row) => row.registration_id))];
    let registrations = [];
    if (registrationIds.length) {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, fullname, passengers')
        .eq('trip_id', trip.id)
        .eq('organizer_id', trip.organizer_id)
        .in('id', registrationIds);
      if (error) throw error;
      registrations = data || [];
    }
    const registrationsById = new Map(registrations.map((row) => [row.id, row]));
    const seatNames = {};
    const seatInfo = {};
    for (const seat of visibleSeats) {
      const registration = registrationsById.get(seat.registration_id);
      const passenger = registration?.passengers?.find((person) => person.seat === seat.seat_label);
      const name = registration ? passenger?.name || registration.fullname : null;
      if (name) seatNames[seat.seat_label] = name;
      seatInfo[seat.seat_label] = { name, status: seat.status };
    }

    return res.json({
      seats: visibleSeats.map((row) => row.seat_label),
      seatNames,
      seatInfo,
      seat_count: trip.seat_count,
      seat_layout: trip.seat_layout || '2+3',
      price_per_seat: trip.price_per_seat,
      price_mode: trip.price_mode || 'fixed',
      min_amount: trip.min_amount,
      max_amount: trip.max_amount,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createTripPayment(req, res, next) {
  try {
    const { error: validationError, value } = bookingSchema.validate(req.body, { abortEarly: false });
    if (validationError) {
      return res.status(400).json({
        message: validationError.details.map((detail) => detail.message).join(', '),
      });
    }
    if (value.selected_seats.length !== value.passengers.length
      || value.selected_seats.some((seat) => !value.passengers.some((person) => person.seat === seat))) {
      return res.status(400).json({ message: 'Provide a passenger name for each selected seat.' });
    }

    const trip = await getOpenTrip(req.params.tripId);
    if (!trip) return res.status(403).json({ message: 'Bookings are currently closed.' });
    let pricing;
    try {
      pricing = calculateTripPrice(trip, value.selected_seats.length, value.chosen_amount_per_seat, MIN_PAYMENT_AMOUNT);
    } catch (pricingError) {
      return res.status(400).json({ message: pricingError.message });
    }

    const bookingArgs = {
      p_trip_id: trip.id,
      p_fullname: value.fullname,
      p_phone: value.phone,
      p_email: value.email || null,
      p_pickup_location: value.pickup_location,
      p_seats: value.selected_seats,
      p_passengers: value.passengers,
    };
    const { data, error } = trip.price_mode === 'flexible'
      ? await supabase.rpc('create_flexible_booking_and_hold', {
        ...bookingArgs,
        p_chosen_amount_per_seat: pricing.chosenAmountPerSeat,
      })
      : await supabase.rpc('create_booking_and_hold', bookingArgs);
    if (error) {
      if (error.code === '23505') return res.status(409).json({ message: 'One or more selected seats have just been booked.' });
      if (error.code === 'P0001') return res.status(409).json({ message: error.message });
      if (error.code === '22023') return res.status(400).json({ message: error.message });
      throw error;
    }

    const registration = Array.isArray(data) ? data[0] : data;
    try {
      const checkout = await createPaychanguCheckout({
        fullName: registration.fullname,
        email: registration.email,
        phone: registration.phone,
        amount: registration.amount,
        reference: registration.id,
      });
      return res.status(201).json({ checkoutUrl: checkout.checkout_url, registrationId: registration.id });
    } catch (error) {
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
}

async function verifiedPaidRegistration(registrationId, txRef) {
  const { data: registration, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .maybeSingle();
  if (error) throw error;
  if (!registration) return { registration: null, paid: false, mismatch: false };
  if (registration.payment_status === 'Paid') return { registration, paid: true, mismatch: false };

  const verification = await verifyPaychanguPayment(txRef);
  if (!matchesVerifiedPayment(verification, registration)) {
    return { registration, paid: false, mismatch: verification.isPaid };
  }

  const { data: updated, error: rpcError } = await supabase.rpc('mark_registration_paid', {
    p_registration_id: registration.id,
    p_payment_reference: txRef,
    p_payment_date: new Date().toISOString(),
  });
  if (rpcError) throw rpcError;
  return { registration: Array.isArray(updated) ? updated[0] : updated, paid: true, mismatch: false };
}

export async function confirmTripPayment(req, res, next) {
  try {
    const result = await verifiedPaidRegistration(req.params.id, req.params.id);
    if (!result.registration) return res.status(404).json({ message: 'Registration not found.' });
    return res.json({ success: result.paid, registration: result.registration, amountMismatch: result.mismatch });
  } catch (error) {
    return next(error);
  }
}

export async function handlePayChanguWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paychangu-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature.' });
    }

    const txRef = req.body?.tx_ref || req.body?.data?.tx_ref;
    if (!txRef) return res.status(400).json({ message: 'Missing transaction reference.' });
    const result = await verifiedPaidRegistration(txRef, txRef);
    if (!result.registration) return res.status(404).json({ message: 'Registration not found.' });
    return res.json({ success: result.paid });
  } catch (error) {
    return next(error);
  }
}

export async function handlePayChanguRedirect(req, res, next) {
  try {
    const txRef = String(req.query.tx_ref || '');
    if (!txRef) return res.redirect(`${FRONTEND_URL}/#/register`);
    const result = await verifiedPaidRegistration(txRef, txRef);
    if (!result.registration) return res.redirect(`${FRONTEND_URL}/#/register`);
    const status = result.paid ? 'success' : 'pending';
    return res.redirect(`${FRONTEND_URL}/#/receipt/${txRef}?status=${status}`);
  } catch (error) {
    return next(error);
  }
}
