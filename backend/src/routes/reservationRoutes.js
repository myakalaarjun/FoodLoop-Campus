import { Router } from 'express';
import { body } from 'express-validator';
import { assignVolunteer, cancelReservation, createReservation, listReservations, listVolunteers, verifyPickup } from '../controllers/reservationController.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(authenticate);
router.get('/volunteers', allowRoles('donor', 'admin'), asyncHandler(listVolunteers));
router.get('/', asyncHandler(listReservations));
router.post('/:listingId', allowRoles('recipient'), [body('quantity').isInt({ min: 1 }), validate], asyncHandler(createReservation));
router.post('/:id/assign', allowRoles('volunteer', 'donor', 'admin'), asyncHandler(assignVolunteer));
router.post('/:id/verify', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }), allowRoles('donor', 'volunteer', 'admin'), [body('pickupCode').isLength({ min: 6, max: 6 }).isNumeric(), validate], asyncHandler(verifyPickup));
router.post('/:id/cancel', allowRoles('recipient', 'admin'), asyncHandler(cancelReservation));
export default router;
