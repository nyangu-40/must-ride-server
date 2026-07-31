import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/registrations', adminAuth, registrationController.getAllRegistrations);
router.get('/registration/:id', adminAuth, registrationController.getRegistrationById);
router.patch('/registration/:id/status', adminAuth, registrationController.updateRegistrationStatus);
router.patch('/registration/:id', adminAuth, registrationController.editRegistration);
router.delete('/registration/:id', adminAuth, registrationController.deleteRegistration);
router.get('/registration/:id/receipt', registrationController.getReceiptById);
router.post('/registration/:id/confirm-payment', registrationController.confirmPayment);
router.get('/payment/success/:id', registrationController.handlePaymentSuccess);
router.get('/payment/cancel/:id', registrationController.handlePaymentCancel);
router.get('/seats', registrationController.getTakenSeats);
router.post('/register', registrationController.createRegistration);
router.post('/payment', registrationController.createPayment);

export default router;