import { Router } from 'express';
import {
  login,
  register,
  verifyEnrollment,
  getUsers,
  getUserById,
  logout,
  verifyRegistrationOTP,
  googleLogin,
  getMe,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorOTP,
  resendTwoFactorOTP,
  getNextId,
  findHiredApplicant,
  getSetupPositions,
  setupPortal,
  checkEmailUniqueness,
  checkGovtIdUniqueness
} from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin, restrictSuspended } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import { authLimiter, strictAuthLimiter } from '../middleware/rateLimitMiddleware.js';

const router: Router = Router();

// Public routes
router.get('/next-id', authLimiter, getNextId);
router.get('/check-email', authLimiter, checkEmailUniqueness);
router.get('/check-govt-id', authLimiter, checkGovtIdUniqueness);
router.get('/hired-applicant-search', authLimiter, findHiredApplicant);
router.get('/setup-positions', authLimiter, getSetupPositions);
router.post('/setup-portal', strictAuthLimiter, setupPortal);
router.get('/verify-enrollment/:employeeId', authLimiter, verifyEnrollment);
router.post('/register', uploadAvatar.single('avatar'), strictAuthLimiter, register);
router.post('/login', strictAuthLimiter, login);
router.post('/logout', logout);
router.post('/google', strictAuthLimiter, googleLogin);

// Protected routes
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.post('/verify-registration', strictAuthLimiter, verifyRegistrationOTP);
router.get('/me', verifyToken, getMe);
router.post('/profile', verifyToken, restrictSuspended, uploadAvatar.single('avatar'), updateProfile);
router.post('/resend-verification', authLimiter, resendVerificationEmail);
router.post('/forgot-password', strictAuthLimiter, forgotPassword);
router.post('/reset-password', strictAuthLimiter, resetPassword);

// 2FA Routes
router.post('/2fa/enable', verifyToken, enableTwoFactor);
router.post('/2fa/disable', verifyToken, disableTwoFactor);
router.post('/2fa/verify', strictAuthLimiter, verifyTwoFactorOTP);
router.post('/2fa/resend', authLimiter, resendTwoFactorOTP);

export default router;
