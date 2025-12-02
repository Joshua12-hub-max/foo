
import express from 'express';
import { startEnrollment, getEnrollmentStatus } from '../controllers/biometricsController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for the frontend to initiate fingerprint enrollment
router.post('/enroll/start', verifyAdmin, startEnrollment);
router.get('/enroll/status/:employeeId', verifyAdmin, getEnrollmentStatus);

export default router;
