import express from 'express';
import { clockIn, clockOut, getLogs, getTodayStatus, getRecentActivity, getRawLogs, getDashboardStats } from '../controllers/attendanceController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/clock-in', verifyToken, clockIn);
router.post('/clock-out', verifyToken, clockOut);
router.get('/logs', verifyToken, getLogs);
router.get('/raw-logs', verifyAdmin, getRawLogs);
router.get('/recent-activity', verifyAdmin, getRecentActivity);
router.get('/today-status', verifyToken, getTodayStatus);
router.get('/dashboard-stats', verifyAdmin, getDashboardStats);

export default router;

