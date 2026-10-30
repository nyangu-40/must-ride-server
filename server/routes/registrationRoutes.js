import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import * as registrationController from '../controllers/registrationController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import publicRoutes from './publicRoutes.js';
import * as publicController from '../controllers/publicController.js';

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});
const paymentVerificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many payment verification attempts. Please try again later.' },
});

router.post('/auth/login', loginLimiter, authController.login);
router.get('/auth/me', requireAuth, authController.getCurrentUser);
router.use('/public', publicRoutes);
router.get('/registration/:id/receipt', registrationController.getReceiptById);
router.post('/registration/:id/confirm-payment', paymentVerificationLimiter, publicController.confirmTripPayment);

export default router;