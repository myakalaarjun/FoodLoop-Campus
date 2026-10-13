import { Router } from 'express';
import { body } from 'express-validator';
import { listUsers, monitorListings, updateUser, verifyOrganization } from '../controllers/adminController.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(authenticate, allowRoles('admin'));
router.get('/users', asyncHandler(listUsers));
router.patch('/users/:id', asyncHandler(updateUser));
router.get('/listings', asyncHandler(monitorListings));
router.patch('/organizations/:id/verification', [body('verified').isBoolean(), validate], asyncHandler(verifyOrganization));
export default router;
