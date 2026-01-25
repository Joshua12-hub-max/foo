import { Router } from 'express';
import {
  startEnrollment,
  getEnrollmentStatus,
  getDeviceStatus
} from '../controllers/biometricsController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

// ============================================================================
// Admin Routes (Authenticated)
// ============================================================================

// Start enrollment for an employee
router.post('/enroll/start', verifyAdmin, startEnrollment);

// Check if employee is enrolled
router.get('/enroll/status/:employeeId', verifyAdmin, getEnrollmentStatus);

// Get device connection status (Arduino via Serial)
router.get('/device/status', verifyAdmin, getDeviceStatus);

export default router;
