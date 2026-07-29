import express from 'express';
import * as webhookController from '../controllers/webhookController.js';

const router = express.Router();

// True server-to-server webhook, if PayChangu sends one for your account type
router.post('/paychangu', webhookController.handlePayChanguWebhook);

// What PayChangu is actually calling for this checkout flow: a browser GET
// redirect with tx_ref as a query param
router.get('/paychangu', webhookController.handlePayChanguRedirect);

export default router;