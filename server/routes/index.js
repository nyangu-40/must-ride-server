import express from 'express';
import registrationRoutes from './registrationRoutes.js';

const router = express.Router();

router.use('/', registrationRoutes);

export default router;
