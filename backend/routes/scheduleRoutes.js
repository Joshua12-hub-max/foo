import express from 'express';
import { getMySchedule, getAllSchedules, createSchedule, updateSchedule, deleteSchedule, getEmployeeSchedule, checkScheduleConflicts } from '../controllers/scheduleController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-schedule', verifyToken, getMySchedule);
router.get('/all', verifyAdmin, getAllSchedules);
router.get('/employee/:employeeId', verifyAdmin, getEmployeeSchedule);
router.post('/create', verifyAdmin, createSchedule);
router.post('/check-conflicts', verifyAdmin, checkScheduleConflicts);
router.put('/:id', verifyAdmin, updateSchedule);
router.delete('/:id', verifyAdmin, deleteSchedule);

export default router;
