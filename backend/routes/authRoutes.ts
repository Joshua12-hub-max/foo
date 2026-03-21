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
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorOTP,
  resendTwoFactorOTP,
  getSetupPositions,
  setupPortal,
  findHiredApplicant,
  checkEmailUniqueness,
  updateProfile,
  getNextId,
  checkGovtIdUniqueness
} from '../controllers/auth.controller.js';
import { verifyToken, authLimiter, strictAuthLimiter } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router: Router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.post('/login', authLimiter, login as any);
router.post('/register', upload.single('avatar'), register as any);
router.get('/verify-enrollment/:employeeId', verifyEnrollment as any);
router.post('/verify-otp', verifyRegistrationOTP as any);
router.post('/resend-verification', resendVerificationEmail as any);
router.post('/google-login', googleLogin as any);
router.post('/forgot-password', authLimiter, forgotPassword as any);
router.post('/reset-password', authLimiter, resetPassword as any);

// Initial Setup
router.get('/setup-positions', getSetupPositions as any);
router.post('/setup-portal', setupPortal as any);

// Registration Helpers
router.get('/find-hired-applicant', findHiredApplicant as any);
router.get('/check-email', checkEmailUniqueness as any);
router.get('/check-govt-id', checkGovtIdUniqueness as any);
router.get('/next-id', getNextId as any);

// ============================================================================
// Protected Routes (Token Required)
// ============================================================================

router.get('/me', verifyToken, getMe as any);
router.put('/profile/:id', verifyToken, upload.single('avatar'), updateProfile as any);
router.post('/logout', verifyToken, logout as any);

// User Management (Basic)
router.get('/users', verifyToken, getUsers as any);
router.get('/users/:id', verifyToken, getUserById as any);

// Two-Factor Authentication
router.post('/2fa/enable', verifyToken, enableTwoFactor as any);
router.post('/2fa/disable', verifyToken, disableTwoFactor as any);
router.post('/2fa/verify', strictAuthLimiter, verifyTwoFactorOTP as any);
router.post('/2fa/resend', authLimiter, resendTwoFactorOTP as any);

export default router;
