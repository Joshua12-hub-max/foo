
import { Router } from 'express';
import { devLogin, simulateBiometricLog } from '../controllers/devController.js';

const router: Router = Router();

// Auth Bypass
router.post('/login', devLogin);

// Biometric Simulation
router.post('/biometric-log', simulateBiometricLog);

export default router;
