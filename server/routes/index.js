import express from 'express';
import registrationRoutes from './registrationRoutes.js';
import organizerRoutes from './organizerRoutes.js';
import platformRoutes from './platformRoutes.js';

const router = express.Router();

router.use('/', registrationRoutes);
router.use('/organizer', organizerRoutes);
router.use('/platform', platformRoutes);

export default router;
