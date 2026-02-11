import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as allowanceController from '../controllers/allowanceController.js';

const router: Router = Router();

// Schedules
router.get('/schedules', verifyToken, allowanceController.getAllowanceSchedules);
router.post('/schedules', verifyAdmin, allowanceController.createAllowanceSchedule);
router.get('/schedules/:id/allowances', verifyToken, allowanceController.getScheduleAllowances);
router.put('/schedules/:id/activate', verifyAdmin, allowanceController.setActiveAllowanceSchedule);

// Active Schedule
router.get('/active', verifyToken, allowanceController.getActiveAllowanceSchedule);

// Definitions
router.post('/definitions', verifyAdmin, allowanceController.upsertAllowanceDefinition);

export default router;
