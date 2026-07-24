import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/registrations', adminAuth, registrationController.getAllRegistrations);
router.get('/registration/:id', adminAuth, registrationController.getRegistrationById);
router.post('/register', registrationController.createRegistration);
router.post('/payment', registrationController.createPayment);

export default router;
