import express from 'express';
import * as publicController from '../controllers/publicController.js';
import * as payoutController from '../controllers/payoutController.js';

const router = express.Router();

// True server-to-server webhook, if PayChangu sends one for your account type
router.post('/paychangu', publicController.handlePayChanguWebhook);
router.post('/paychangu/payout', payoutController.handlePayoutWebhook);

// What PayChangu is actually calling for this checkout flow: a browser GET
// redirect with tx_ref as a query param
router.get('/paychangu', publicController.handlePayChanguRedirect);

export default router;