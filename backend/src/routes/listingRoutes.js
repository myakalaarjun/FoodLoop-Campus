import { Router } from 'express';
import { body } from 'express-validator';
import { cancelListing, createListing, listListings, updateListing } from '../controllers/listingController.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(listListings));
router.post('/', allowRoles('donor'), [
  body('title').trim().isLength({ min: 3, max: 120 }),
  body('description').trim().isLength({ min: 5, max: 2000 }),
  body('quantity').isInt({ min: 1 }),
  body('pickupLocation').trim().notEmpty(),
  body('pickupStart').isISO8601(),
  body('deadline').isISO8601(),
  validate
], asyncHandler(createListing));
router.patch('/:id', allowRoles('donor'), asyncHandler(updateListing));
router.post('/:id/cancel', allowRoles('donor', 'admin'), asyncHandler(cancelListing));
export default router;
