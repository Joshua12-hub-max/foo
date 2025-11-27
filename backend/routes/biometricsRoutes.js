
import express from 'express';
import { startEnrollment, sync, getEnrollmentStatus } from '../controllers/biometricsController.js';

const router = express.Router();

// Route for the frontend to initiate fingerprint enrollment
router.post('/enroll/start', startEnrollment);
router.get('/enroll/status/:employeeId', getEnrollmentStatus);

// Route for the Python bridge to send fingerprint data
router.post('/sync', sync);

export default router;
