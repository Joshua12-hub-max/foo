import { Router } from 'express';
import { startEnrollment, getEnrollmentStatus } from '../controllers/biometricsController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.post('/enroll/start', verifyAdmin, startEnrollment);
router.get('/enroll/status/:employeeId', verifyAdmin, getEnrollmentStatus);

export default router;
