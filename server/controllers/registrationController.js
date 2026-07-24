import Joi from 'joi';
import {
  createRegistration as createRegistrationRecord,
  getAllRegistrations as fetchAllRegistrations,
  getRegistrationById as fetchRegistrationById,
} from '../services/registrationService.js';
import { createPaychanguCheckout } from '../services/paychanguService.js';
import { PRICE_PER_SEAT } from '../config/index.js';

const registrationSchema = Joi.object({
  fullname: Joi.string().trim().min(3).required(),
  phone: Joi.string().trim().pattern(/^\+?\d{7,15}$/).required(),
  pickup_location: Joi.string().trim().min(2).required(),
  destination: Joi.string().trim().min(2).required(),
  seats: Joi.number().integer().min(1).required(),
});

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
