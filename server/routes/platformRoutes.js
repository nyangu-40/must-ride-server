import express from 'express';
import * as platformController from '../controllers/platformController.js';
import { requireAuth, requireSuperadmin } from '../middleware/requireAuth.js';

const router = express.Router();
router.use(requireAuth, requireSuperadmin);

router.get('/overview', platformController.getOverview);
router.get('/applications', platformController.listApplications);
router.get('/organizers', platformController.listOrganizers);
router.post('/organizers', platformController.createOrganizer);
router.post('/organizers/:id/approve', platformController.approveApplication);
router.post('/organizers/:id/reject', platformController.rejectApplication);
router.get('/organizers/:id', platformController.getOrganizerDetail);
router.patch('/organizers/:id', platformController.updateOrganizer);
router.post('/organizers/:id/view-as', platformController.createViewAsToken);
router.get('/transactions', platformController.listTransactions);
router.get('/registrations', platformController.listRegistrations);
router.get('/payouts', platformController.listPayouts);
router.post('/payouts/:id/actions', platformController.payoutAction);
router.get('/reconciliation', platformController.reconcile);
router.get('/audit-log', platformController.listAuditLog);

export default router;
