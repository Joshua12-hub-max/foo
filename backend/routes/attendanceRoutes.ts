import { Router } from 'express';
import {
  getLogs,
  getRecentActivity,
  getRawLogs,
  getDashboardStats,
} from '../controllers/attendanceController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/logs', verifyToken, getLogs);
router.get('/raw-logs', verifyAdmin, getRawLogs);
router.get('/recent-activity', verifyAdmin, getRecentActivity);
router.get('/dashboard-stats', verifyAdmin, getDashboardStats);

export default router;
