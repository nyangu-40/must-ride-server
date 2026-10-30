import express from 'express';
import multer from 'multer';
import * as organizerController from '../controllers/organizerController.js';
import * as payoutController from '../controllers/payoutController.js';
import { requireAuth, requireOrganizer } from '../middleware/requireAuth.js';

const router = express.Router();
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) return callback(null, true);
    return callback(new Error('Logo must be a PNG, JPEG, or WebP image.'));
  },
});
const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) return callback(null, true);
    return callback(new Error('Cover image must be a PNG, JPEG, or WebP image.'));
  },
});
router.use(requireAuth);
router.get('/me', organizerController.getApplicationStatus);
router.use(requireOrganizer);

router.get('/profile', organizerController.getProfile);
router.post('/branding/logo', (req, res, next) => logoUpload.single('logo')(req, res, (error) => {
  if (!error) return next();
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  return res.status(status).json({ message: error.message });
}), organizerController.uploadLogo);
router.patch('/branding', organizerController.updateBranding);
router.post('/uploads/trip-cover', (req, res, next) => coverUpload.single('cover')(req, res, (error) => {
  if (!error) return next();
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  return res.status(status).json({ message: error.message });
}), organizerController.uploadTripCover);
router.get('/trips', organizerController.getTrips);
router.post('/trips', organizerController.createTrip);
router.get('/trips/:tripId/seats', organizerController.getTripSeatMap);
router.get('/trips/:tripId', organizerController.getTripById);
router.patch('/trips/:tripId', organizerController.updateTrip);
router.delete('/trips/:tripId', organizerController.deleteTrip);
router.get('/trips/:tripId/registrations', organizerController.getRegistrations);
router.get('/registrations', organizerController.getRegistrations);
router.get('/registrations/:registrationId', organizerController.getRegistrationById);
router.patch('/registrations/:registrationId', organizerController.updateRegistration);
router.delete('/registrations/:registrationId', organizerController.deleteRegistration);
router.get('/wallet', organizerController.getWallet);
router.get('/wallet/transactions', organizerController.getTransactions);
router.get('/payouts/lookups', payoutController.getLookups);
router.get('/payouts', payoutController.listPayouts);
router.post('/payouts', payoutController.createPayout);
router.get('/subscription', organizerController.getSubscription);

export default router;
