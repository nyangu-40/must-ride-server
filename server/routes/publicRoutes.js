import express from 'express';
import rateLimit from 'express-rate-limit';
import * as publicController from '../controllers/publicController.js';

const router = express.Router();
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many booking attempts. Please try again later.' },
});
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many applications from this connection. Try again in an hour.' },
});
const slugLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

router.post('/organizer-signup', signupLimiter, publicController.signupOrganizer);
router.get('/slug-available/:slug', slugLimiter, publicController.checkOrganizerSlug);
router.get('/organizers/:slug', publicController.getOrganizerPublicPage);
router.get('/trips/:tripId/seats', publicController.getTripSeats);
router.post('/trips/:tripId/payment', paymentLimiter, publicController.createTripPayment);

export default router;
