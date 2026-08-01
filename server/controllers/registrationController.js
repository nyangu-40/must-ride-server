import Joi from 'joi';
import {
  createRegistration as createRegistrationRecord,
  getAllRegistrations as fetchAllRegistrations,
  getRegistrationById as fetchRegistrationById,
  getTakenSeats as fetchTakenSeats,
  updatePaymentStatus as updateRegistrationPaymentStatus,
  updateRegistration as updateRegistrationRecord,
  deleteRegistration as deleteRegistrationRecord,
} from '../services/registrationService.js';
import { createPaychanguCheckout, verifyPaychanguPayment } from '../services/paychanguService.js';
import { FRONTEND_URL, PRICE_PER_SEAT } from '../config/index.js';

const registrationSchema = Joi.object({
  fullname: Joi.string().trim().min(3).required(),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/).required(),
  pickup_location: Joi.string().trim().min(2).required(),
  destination: Joi.string().trim().min(2).required(),
  seats: Joi.number().integer().min(1).required(),
  selected_seats: Joi.array().items(Joi.string().trim().required()).min(1).required(),
  passengers: Joi.array()
    .items(
      Joi.object({
        seat: Joi.string().trim().required(),
        name: Joi.string().trim().min(3).required(),
      }),
    )
    .min(1)
    .required(),
});

// Looser schema for admin edits — every field optional, since an admin might
// only be changing the seat numbers and nothing else.
const editRegistrationSchema = Joi.object({
  fullname: Joi.string().trim().min(3),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/),
  pickup_location: Joi.string().trim().min(2),
  destination: Joi.string().trim().min(2),
  selected_seats: Joi.array().items(Joi.string().trim().required()).min(1),
  seats: Joi.number().integer().min(1),
  passengers: Joi.array().items(
    Joi.object({
      seat: Joi.string().trim().required(),
      name: Joi.string().trim().min(1).required(),
    }),
  ),
}).min(1);

export async function getAllRegistrations(req, res, next) {
  try {
    const data = await fetchAllRegistrations();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getRegistrationById(req, res, next) {
  try {
    const { id } = req.params;
    const data = await fetchRegistrationById(id);
    if (!data) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getReceiptById(req, res, next) {
  try {
    const { id } = req.params;
    const data = await fetchRegistrationById(id);
    if (!data) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const receipt = {
      id: data.id,
      fullname: data.fullname,
      phone: data.phone,
      pickup_location: data.pickup_location,
      destination: data.destination,
      seats: data.seats,
      selected_seats: data.selected_seats,
      passengers: data.passengers,
      amount: data.amount,
      payment_status: data.payment_status,
      payment_reference: data.payment_reference,
      payment_date: data.payment_date,
      created_at: data.created_at,
    };

    res.json({ receipt });
  } catch (error) {
    next(error);
  }
}

export async function createRegistration(req, res, next) {
  try {
    const { error, value } = registrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map((detail) => detail.message).join(', ') });
    }

    const registration = {
      ...value,
      amount: value.seats * PRICE_PER_SEAT,
      payment_status: 'Pending',
      payment_reference: null,
      payment_date: null,
      created_at: new Date().toISOString(),
    };

    const data = await createRegistrationRecord(registration);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req, res, next) {
  try {
    const { error, value } = registrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map((detail) => detail.message).join(', ') });
    }

    if (value.selected_seats.length !== value.seats) {
      return res.status(400).json({ message: 'Selected seats count must match the number of seats requested.' });
    }

    const uniqueSeats = [...new Set(value.selected_seats)];
    if (uniqueSeats.length !== value.selected_seats.length) {
      return res.status(400).json({ message: 'Selected seats must be unique.' });
    }

    const amount = value.seats * PRICE_PER_SEAT;

    const payload = {
      ...value,
      amount,
      payment_status: 'Pending',
      payment_reference: null,
      payment_date: null,
      created_at: new Date().toISOString(),
    };

    const saved = await createRegistrationRecord(payload);
    const checkout = await createPaychanguCheckout({
      fullName: saved.fullname,
      email: `${saved.fullname.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: saved.phone,
      amount: saved.amount,
      reference: saved.id,
    });

    res.status(201).json({ checkoutUrl: checkout.checkout_url, registrationId: saved.id });
  } catch (err) {
    next(err);
  }
}

// Called by the frontend ReceiptPage when it lands on ?status=success.
// IMPORTANT: that query param is set by US in return_url and does NOT mean
// payment actually succeeded — PayChangu sends the browser back here
// whether the payment succeeded, failed, or was cancelled. So this must
// verify directly with PayChangu before marking anything Paid, exactly
// like the webhook does. Never trust the URL alone.
export async function confirmPayment(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await fetchRegistrationById(id).catch(() => null);
    if (!existing) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Already confirmed by the webhook — nothing more to do
    if (existing.payment_status === 'Paid') {
      return res.json({ success: true, registration: existing });
    }

    let verification;
    try {
      verification = await verifyPaychanguPayment(id); // tx_ref === registration id
    } catch (verifyErr) {
      console.error('confirmPayment: PayChangu verify call failed:', verifyErr?.response?.data || verifyErr.message);
      return res.json({ success: false, registration: existing });
    }

    if (!verification.isPaid) {
      // Genuinely not paid — do not mark it Paid just because the person
      // landed on this URL
      return res.json({ success: false, registration: existing });
    }

    const updated = await updateRegistrationPaymentStatus(id, {
      payment_status: 'Paid',
      payment_reference: id,
      payment_date: new Date().toISOString(),
    });

    res.json({ success: true, registration: updated });
  } catch (err) {
    next(err);
  }
}

export async function getTakenSeats(req, res, next) {
  try {
    const seats = await fetchTakenSeats();
    res.json({ seats });
  } catch (err) {
    next(err);
  }
}

export async function getPrice(req, res, next) {
  try {
    res.json({ pricePerSeat: PRICE_PER_SEAT });
  } catch (err) {
    next(err);
  }
}

export async function updateRegistrationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { payment_status } = req.body || {};

    if (!['Paid', 'Pending'].includes(payment_status)) {
      return res.status(400).json({ message: 'payment_status must be either Paid or Pending.' });
    }

    const updated = await updateRegistrationPaymentStatus(id, {
      payment_status,
      payment_date: payment_status === 'Paid' ? new Date().toISOString() : null,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Admin edit — lets an admin correct/change details on an existing
// registration, most commonly the seat numbers, without touching payment
// status. Recomputes `seats` count and `amount` if selected_seats changes.
export async function editRegistration(req, res, next) {
  try {
    const { id } = req.params;

    const { error, value } = editRegistrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map((detail) => detail.message).join(', ') });
    }

    const existing = await fetchRegistrationById(id).catch(() => null);
    if (!existing) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const updates = { ...value };

    // If seats changed, keep seats count and amount consistent automatically
    if (value.selected_seats) {
      const uniqueSeats = [...new Set(value.selected_seats)];
      if (uniqueSeats.length !== value.selected_seats.length) {
        return res.status(400).json({ message: 'Selected seats must be unique.' });
      }
      updates.seats = value.selected_seats.length;
      updates.amount = value.selected_seats.length * PRICE_PER_SEAT;
    }

    const updated = await updateRegistrationRecord(id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteRegistration(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await fetchRegistrationById(id).catch(() => null);
    if (!existing) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const deleted = await deleteRegistrationRecord(id);
    res.json({ success: true, deleted });
  } catch (err) {
    next(err);
  }
}
