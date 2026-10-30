import Joi from 'joi';
import crypto from 'crypto';
import supabase from '../database/supabaseClient.js';
import {
  getRegistration,
  getTrip,
  listRegistrations,
  listTrips,
} from '../services/organizerService.js';
import { MIN_PAYMENT_AMOUNT, SUPABASE_URL } from '../config/index.js';

const brandingSchema = Joi.object({
  name: Joi.string().trim().min(2),
  logo_url: Joi.string().uri().allow('', null),
  primary_color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
  tagline: Joi.string().trim().max(160).allow('', null),
  contact_phone: Joi.string().trim().max(30).allow('', null),
}).min(1);

const tripSchema = Joi.object({
  title: Joi.string().trim().min(2).required(),
  origin: Joi.string().trim().min(2).required(),
  destination: Joi.string().trim().min(2).required(),
  departure_at: Joi.date().iso().allow(null).optional(),
  price_mode: Joi.string().valid('fixed', 'flexible').default('fixed'),
  price_per_seat: Joi.number().min(MIN_PAYMENT_AMOUNT).allow(null),
  min_amount: Joi.number().integer().min(MIN_PAYMENT_AMOUNT).allow(null),
  max_amount: Joi.number().integer().min(MIN_PAYMENT_AMOUNT).allow(null),
  seat_count: Joi.number().integer().min(1).max(1000).required(),
  seat_layout: Joi.string().valid('2+2', '2+3').default('2+3'),
  pickup_locations: Joi.array().items(Joi.string().trim().min(2)).min(1).required(),
  status: Joi.string().valid('draft', 'open', 'closed').default('draft'),
  description: Joi.string().trim().max(600).allow('', null),
  amenities: Joi.array().items(Joi.string().trim().min(1).max(40)).max(12),
  cover_image_url: Joi.string().uri().max(500).allow('', null),
  booking_image_url: Joi.string().uri().max(500).allow('', null),
});

const tripUpdateSchema = Joi.object({
  title: Joi.string().trim().min(2),
  origin: Joi.string().trim().min(2),
  destination: Joi.string().trim().min(2),
  departure_at: Joi.date().iso().allow(null),
  price_mode: Joi.string().valid('fixed', 'flexible'),
  price_per_seat: Joi.number().min(MIN_PAYMENT_AMOUNT).allow(null),
  min_amount: Joi.number().integer().min(MIN_PAYMENT_AMOUNT).allow(null),
  max_amount: Joi.number().integer().min(MIN_PAYMENT_AMOUNT).allow(null),
  seat_count: Joi.number().integer().min(1).max(1000),
  seat_layout: Joi.string().valid('2+2', '2+3'),
  pickup_locations: Joi.array().items(Joi.string().trim().min(2)).min(1),
  status: Joi.string().valid('draft', 'open', 'closed'),
  description: Joi.string().trim().max(600).allow('', null),
  amenities: Joi.array().items(Joi.string().trim().min(1).max(40)).max(12),
  cover_image_url: Joi.string().uri().max(500).allow('', null),
  booking_image_url: Joi.string().uri().max(500).allow('', null),
}).min(1);

// Cover images must be files this API stored for THIS organiser (no arbitrary external URLs).
function isOwnCoverUrl(url, organizerId) {
  if (!url) return true;
  const base = String(SUPABASE_URL || '').replace(/\/$/, '');
  return url.startsWith(`${base}/storage/v1/object/public/trip-covers/${organizerId}/`);
}

function cleanPresentation(value) {
  const cleaned = { ...value };
  if ('description' in cleaned) cleaned.description = cleaned.description || null;
  if ('cover_image_url' in cleaned) cleaned.cover_image_url = cleaned.cover_image_url || null;
  if ('booking_image_url' in cleaned) cleaned.booking_image_url = cleaned.booking_image_url || null;
  return cleaned;
}

function normalizeTripPricing(trip) {
  const mode = trip.price_mode || 'fixed';
  if (mode === 'fixed') {
    if (!Number.isFinite(Number(trip.price_per_seat)) || Number(trip.price_per_seat) < MIN_PAYMENT_AMOUNT) {
      return { error: `Fixed price must be at least ${MIN_PAYMENT_AMOUNT} MWK per seat.` };
    }
    return { value: { ...trip, price_mode: mode, min_amount: null, max_amount: null } };
  }
  const min = Number(trip.min_amount);
  const max = trip.max_amount === null || trip.max_amount === undefined || trip.max_amount === ''
    ? null
    : Number(trip.max_amount);
  const suggested = trip.price_per_seat === null || trip.price_per_seat === undefined || trip.price_per_seat === ''
    ? min
    : Number(trip.price_per_seat);
  if (!Number.isInteger(min) || min < MIN_PAYMENT_AMOUNT) {
    return { error: `Minimum flexible price must be at least ${MIN_PAYMENT_AMOUNT} MWK.` };
  }
  if (max !== null && (!Number.isInteger(max) || max < min)) {
    return { error: 'Maximum amount must be a whole number greater than or equal to the minimum.' };
  }
  if (!Number.isInteger(suggested) || suggested < min || (max !== null && suggested > max)) {
    return { error: 'Suggested price must be a whole number within the minimum and maximum.' };
  }
  return { value: { ...trip, price_mode: mode, price_per_seat: suggested, min_amount: min, max_amount: max } };
}

const registrationUpdateSchema = Joi.object({
  fullname: Joi.string().trim().min(3),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/),
  email: Joi.string().trim().email().allow('', null),
  pickup_location: Joi.string().trim().min(2),
  selected_seats: Joi.array().items(Joi.string().trim().required()).min(1).unique(),
  passengers: Joi.array().items(Joi.object({
    seat: Joi.string().trim().required(),
    name: Joi.string().trim().min(1).required(),
  })),
}).min(1);

function isExpired(organizer) {
  return Boolean(organizer.active_until && new Date(organizer.active_until) <= new Date());
}

function validationError(error) {
  return { message: error.details.map((detail) => detail.message).join(', ') };
}

export async function getProfile(req, res) {
  res.json({ organizer: req.organizer });
}

export async function getApplicationStatus(req, res, next) {
  try {
    if (req.profile?.role !== 'organizer') return res.status(403).json({ message: 'Organizer access required.' });
    const { data, error } = await supabase.from('organizers')
      .select('id, name, slug, owner_name, status, rejection_reason, active_until')
      .eq('owner_user_id', req.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Organizer application not found.' });
    return res.json({ organizer: data });
  } catch (error) {
    return next(error);
  }
}

export async function updateBranding(req, res, next) {
  try {
    const { error: validation, value } = brandingSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json(validationError(validation));
    const { data, error } = await supabase.from('organizers').update(value)
      .eq('id', req.organizer.id).select('id, name, slug, logo_url, primary_color, tagline, contact_phone, status, active_until, subscription_plan')
      .single();
    if (error) throw error;
    return res.json({ organizer: data });
  } catch (error) {
    return next(error);
  }
}

export async function uploadLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Select a logo image to upload.' });
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[req.file.mimetype];
    if (!extension) return res.status(400).json({ message: 'Logo must be a PNG, JPEG, or WebP image.' });
    const storagePath = `${req.organizer.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('organizer-logos').upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from('organizer-logos').getPublicUrl(storagePath);
    const { data, error } = await supabase.from('organizers').update({ logo_url: publicUrl.publicUrl })
      .eq('id', req.organizer.id)
      .select('id, name, slug, logo_url, primary_color, tagline, contact_phone, status, active_until, subscription_plan')
      .single();
    if (error) throw error;
    return res.json({ organizer: data });
  } catch (error) {
    return next(error);
  }
}

export async function uploadTripCover(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Select a cover image to upload.' });
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[req.file.mimetype];
    if (!extension) return res.status(400).json({ message: 'Cover image must be a PNG, JPEG, or WebP image.' });
    const storagePath = `${req.organizer.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('trip-covers').upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from('trip-covers').getPublicUrl(storagePath);
    return res.status(201).json({ url: publicUrl.publicUrl });
  } catch (error) {
    return next(error);
  }
}

export async function getTrips(req, res, next) {
  try {
    return res.json(await listTrips(req.organizer.id));
  } catch (error) {
    return next(error);
  }
}

export async function createTrip(req, res, next) {
  try {
    if (isExpired(req.organizer)) return res.status(403).json({ message: 'Your subscription has expired.' });
    const { error: validation, value: validated } = tripSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json(validationError(validation));
    const value = cleanPresentation(validated);
    if (!isOwnCoverUrl(value.cover_image_url, req.organizer.id) || !isOwnCoverUrl(value.booking_image_url, req.organizer.id)) {
      return res.status(400).json({ message: 'Upload the cover image through the dashboard.' });
    }
    const pricing = normalizeTripPricing(value);
    if (pricing.error) return res.status(400).json({ message: pricing.error });
    const { data, error } = await supabase.from('trips')
      .insert({ ...pricing.value, organizer_id: req.organizer.id }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

export async function getTripById(req, res, next) {
  try {
    const trip = await getTrip(req.organizer.id, req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    return res.json(trip);
  } catch (error) {
    return next(error);
  }
}

export async function updateTrip(req, res, next) {
  try {
    const { error: validation, value: validated } = tripUpdateSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json(validationError(validation));
    const value = cleanPresentation(validated);
    if (!isOwnCoverUrl(value.cover_image_url, req.organizer.id) || !isOwnCoverUrl(value.booking_image_url, req.organizer.id)) {
      return res.status(400).json({ message: 'Upload the cover image through the dashboard.' });
    }
    const currentTrip = await getTrip(req.organizer.id, req.params.tripId);
    if (!currentTrip) return res.status(404).json({ message: 'Trip not found.' });
    if (value.seat_count !== undefined && value.seat_count < currentTrip.seat_count) {
      const { data: bookedSeats, error: bookedError } = await supabase.from('registration_seats')
        .select('seat_label, status, hold_expires_at')
        .eq('trip_id', currentTrip.id).in('status', ['held', 'paid']);
      if (bookedError) throw bookedError;
      const highestBooked = (bookedSeats || [])
        .filter((row) => row.status === 'paid' || new Date(row.hold_expires_at) > new Date())
        .reduce((highest, row) => Math.max(highest, Number(row.seat_label) || 0), 0);
      if (value.seat_count < highestBooked) {
        return res.status(409).json({
          message: `Seat ${highestBooked} is already booked, so the seat count cannot go below ${highestBooked}.`,
        });
      }
    }
    if (value.seat_layout !== undefined && value.seat_layout !== (currentTrip.seat_layout || '2+3')) {
      // Seats are numbered row by row, so changing the layout would move people who already booked.
      const { data: activeSeats, error: activeError } = await supabase.from('registration_seats')
        .select('status, hold_expires_at')
        .eq('trip_id', currentTrip.id).in('status', ['held', 'paid']);
      if (activeError) throw activeError;
      const inUse = (activeSeats || []).some((row) => row.status === 'paid' || new Date(row.hold_expires_at) > new Date());
      if (inUse) {
        return res.status(409).json({ message: 'The seat layout cannot be changed once seats have been booked on this trip.' });
      }
    }
    if (value.status === 'open' && isExpired(req.organizer)) {
      return res.status(403).json({ message: 'Your subscription has expired. Renew to publish trips.' });
    }
    const pricing = normalizeTripPricing({ ...currentTrip, ...value });
    if (pricing.error) return res.status(400).json({ message: pricing.error });
    const { data, error } = await supabase.from('trips').update({
      ...value,
      price_mode: pricing.value.price_mode,
      price_per_seat: pricing.value.price_per_seat,
      min_amount: pricing.value.min_amount,
      max_amount: pricing.value.max_amount,
    })
      .eq('id', req.params.tripId).eq('organizer_id', req.organizer.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Trip not found.' });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const { data: trip, error: tripError } = await supabase.from('trips').select('id, status')
      .eq('id', req.params.tripId).eq('organizer_id', req.organizer.id).maybeSingle();
    if (tripError) throw tripError;
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    const { count, error: countError } = await supabase.from('registrations').select('id', { count: 'exact', head: true })
      .eq('trip_id', trip.id).eq('organizer_id', req.organizer.id);
    if (countError) throw countError;
    if (count) return res.status(409).json({ message: 'Trips with registrations cannot be deleted; close the trip instead.' });
    const { error } = await supabase.from('trips').delete()
      .eq('id', trip.id).eq('organizer_id', req.organizer.id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function getRegistrations(req, res, next) {
  try {
    const records = await listRegistrations(req.organizer.id, req.params.tripId);
    return res.json(records);
  } catch (error) {
    return next(error);
  }
}

export async function getTripSeatMap(req, res, next) {
  try {
    const trip = await getTrip(req.organizer.id, req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    const { data: seats, error } = await supabase.from('registration_seats')
      .select('registration_id, seat_label, status, hold_expires_at')
      .eq('trip_id', trip.id).in('status', ['held', 'paid']);
    if (error) throw error;
    const activeSeats = (seats || []).filter(
      (row) => row.status === 'paid' || new Date(row.hold_expires_at) > new Date(),
    );
    const ids = [...new Set(activeSeats.map((row) => row.registration_id))];
    let registrations = [];
    if (ids.length) {
      const { data, error: registrationError } = await supabase.from('registrations')
        .select('id, fullname, passengers').eq('organizer_id', req.organizer.id)
        .eq('trip_id', trip.id).in('id', ids);
      if (registrationError) throw registrationError;
      registrations = data || [];
    }
    const lookup = new Map(registrations.map((record) => [record.id, record]));
    return res.json({
      seats: activeSeats.map((row) => {
        const registration = lookup.get(row.registration_id);
        const passenger = registration?.passengers?.find((person) => person.seat === row.seat_label);
        return {
          seat: row.seat_label,
          status: row.status,
          name: passenger?.name || registration?.fullname || 'Passenger',
        };
      }),
      seat_count: trip.seat_count,
      seat_layout: trip.seat_layout || '2+3',
    });
  } catch (error) {
    return next(error);
  }
}

export async function getRegistrationById(req, res, next) {
  try {
    const record = await getRegistration(req.organizer.id, req.params.registrationId);
    if (!record) return res.status(404).json({ message: 'Registration not found.' });
    return res.json(record);
  } catch (error) {
    return next(error);
  }
}

export async function updateRegistration(req, res, next) {
  try {
    const { error: validation, value } = registrationUpdateSchema.validate(req.body, { abortEarly: false });
    if (validation) return res.status(400).json(validationError(validation));
    const record = await getRegistration(req.organizer.id, req.params.registrationId);
    if (!record) return res.status(404).json({ message: 'Registration not found.' });

    if (value.passengers) {
      const selectedSeats = value.selected_seats || record.selected_seats;
      if (value.passengers.length !== selectedSeats.length
        || selectedSeats.some((seat) => !value.passengers.some((person) => person.seat === seat))) {
        return res.status(400).json({ message: 'Provide one passenger name for each selected seat.' });
      }
    }

    let updated;
    if (value.selected_seats) {
      if (record.payment_status === 'Paid') {
        return res.status(409).json({ message: 'Paid registrations cannot change seats.' });
      }
      const passengers = value.passengers || record.passengers;
      if (passengers.length !== value.selected_seats.length
        || value.selected_seats.some((seat) => !passengers.some((person) => person.seat === seat))) {
        return res.status(400).json({ message: 'Provide one passenger name for each selected seat.' });
      }
      const details = { ...value };
      delete details.selected_seats;
      delete details.passengers;
      const { data, error } = await supabase.rpc('update_registration_seats', {
        p_registration_id: record.id,
        p_organizer_id: req.organizer.id,
        p_selected_seats: value.selected_seats,
        p_passengers: passengers,
        p_details: details,
      });
      if (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'One or more selected seats are unavailable.' });
        if (error.code === '22023') return res.status(400).json({ message: error.message });
        throw error;
      }
      updated = Array.isArray(data) ? data[0] : data;
    } else {
      const updates = { ...value };
      delete updates.passengers;
      const { data, error } = await supabase.from('registrations').update({
        ...updates,
        ...(value.passengers ? { passengers: value.passengers } : {}),
      }).eq('id', record.id).eq('organizer_id', req.organizer.id).select().single();
      if (error) throw error;
      updated = data;
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export async function deleteRegistration(req, res, next) {
  try {
    const { error } = await supabase.rpc('delete_pending_registration', {
      p_registration_id: req.params.registrationId,
      p_organizer_id: req.organizer.id,
    });
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ message: error.message });
      if (error.code === '22023') return res.status(409).json({ message: error.message });
      throw error;
    }
    return res.json({ success: true, deleted: req.params.registrationId });
  } catch (error) {
    return next(error);
  }
}

export async function getWallet(req, res, next) {
  try {
    const [{ data: balances, error: balanceError }, { data: pendingPayouts, error: payoutsError }] = await Promise.all([
      supabase.from('wallet_balance').select('balance').eq('organizer_id', req.organizer.id).maybeSingle(),
      supabase.from('payouts').select('amount').eq('organizer_id', req.organizer.id)
        .in('status', ['requested', 'processing']),
    ]);
    if (balanceError) throw balanceError;
    if (payoutsError) throw payoutsError;
    const pending = (pendingPayouts || []).reduce((total, payout) => total + Number(payout.amount), 0);
    const balance = Number(balances?.balance || 0);
    return res.json({ balance, pending_payouts: pending, available_balance: balance - pending });
  } catch (error) {
    return next(error);
  }
}

export async function getTransactions(req, res, next) {
  try {
    const { data, error } = await supabase.from('wallet_transactions').select('*')
      .eq('organizer_id', req.organizer.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function getSubscription(req, res, next) {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*')
      .eq('organizer_id', req.organizer.id).order('period_end', { ascending: false });
    if (error) throw error;
    return res.json({ active_until: req.organizer.active_until, subscription_plan: req.organizer.subscription_plan, history: data || [] });
  } catch (error) {
    return next(error);
  }
}
