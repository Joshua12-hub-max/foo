
import express from 'express';
import { devLogin, simulateBiometricLog } from '../controllers/devController.js';

const router = express.Router();

// Auth Bypass
router.post('/login', devLogin);

// Biometric Simulation
router.post('/biometric-log', simulateBiometricLog);

export default router;
