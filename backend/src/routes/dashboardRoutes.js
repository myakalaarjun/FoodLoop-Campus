import { Router } from 'express';
import { dashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.get('/', authenticate, asyncHandler(dashboard));
export default router;
