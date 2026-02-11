import { Router } from 'express';
import {
  login,
  register,
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
  resendTwoFactorOTP
} from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin, restrictSuspended } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router: Router = Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/google', authLimiter, googleLogin);

// Protected routes
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.post('/verify-registration', authLimiter, verifyRegistrationOTP);
router.get('/me', verifyToken, getMe);
router.post('/profile', verifyToken, restrictSuspended, uploadAvatar.single('avatar'), updateProfile);
router.post('/resend-verification', authLimiter, resendVerificationEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// 2FA Routes
router.post('/2fa/enable', verifyToken, enableTwoFactor);
router.post('/2fa/disable', verifyToken, disableTwoFactor);
router.post('/2fa/verify', authLimiter, verifyTwoFactorOTP);
router.post('/2fa/resend', authLimiter, resendTwoFactorOTP);

export default router;
