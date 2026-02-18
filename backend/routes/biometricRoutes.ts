import { Router } from 'express';
import {
  getEnrolledUsers,
  getBiometricLogs,
  getSyncStatus,
} from '../controllers/biometricController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/enrolled', verifyAdmin, getEnrolledUsers);
router.get('/logs', verifyAdmin, getBiometricLogs);
router.get('/sync-status', verifyAdmin, getSyncStatus);

export default router;
