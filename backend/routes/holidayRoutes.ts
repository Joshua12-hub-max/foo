import { Router } from 'express';
import { getHolidays } from '../controllers/holidayController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

// GET /api/holidays
router.get('/', verifyToken, getHolidays);

export default router;
