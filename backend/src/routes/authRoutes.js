import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, me, register, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { success: false, message: 'Too many sign-in attempts. Try again later.' } });
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['donor', 'recipient', 'volunteer']),
  body('organization.name').if(body('role').equals('recipient')).trim().isLength({ min: 2, max: 120 }),
  body('organization.capacity').if(body('role').equals('recipient')).isInt({ min: 0 }),
  body('organization.dietaryNeeds').optional().isArray(),
  body('organization.pickupAvailability').optional().isArray(),
  validate
], asyncHandler(register));
router.post('/login', loginLimiter, [body('email').isEmail(), body('password').isString().notEmpty(), validate], asyncHandler(login));
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, asyncHandler(updateProfile));
export default router;
