import express from 'express';
import { clockIn, clockOut, getLogs, getTodayStatus, getRecentActivity } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/logs', getLogs);
router.get('/recent-activity', getRecentActivity);
router.get('/today-status', getTodayStatus);

export default router;
