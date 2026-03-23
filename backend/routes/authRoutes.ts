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

router.post('/login', authLimiter, login as never);
router.post('/register', upload.single('avatar'), register as never);
router.get('/verify-enrollment/:employeeId', verifyEnrollment as never);
router.post('/verify-otp', verifyRegistrationOTP as never);
router.post('/resend-verification', resendVerificationEmail as never);
router.post('/google-login', googleLogin as never);
router.post('/forgot-password', authLimiter, forgotPassword as never);
router.post('/reset-password', authLimiter, resetPassword as never);

// Initial Setup
router.get('/setup-positions', getSetupPositions as never);
router.post('/setup-portal', setupPortal as never);

// Registration Helpers
router.get('/find-hired-applicant', findHiredApplicant as never);
router.get('/check-email', checkEmailUniqueness as never);
router.get('/check-govt-id', checkGovtIdUniqueness as never);
router.get('/next-id', getNextId as never);

// ============================================================================
// Protected Routes (Token Required)
// ============================================================================

router.get('/me', verifyToken, getMe as never);
router.put('/profile/:id', verifyToken, upload.single('avatar'), updateProfile as never);
router.post('/logout', verifyToken, logout as never);

// User Management (Basic)
router.get('/users', verifyToken, getUsers as never);
router.get('/users/:id', verifyToken, getUserById as never);

// Two-Factor Authentication
router.post('/2fa/enable', verifyToken, enableTwoFactor as never);
router.post('/2fa/disable', verifyToken, disableTwoFactor as never);
router.post('/2fa/verify', strictAuthLimiter, verifyTwoFactorOTP as never);
router.post('/2fa/resend', authLimiter, resendTwoFactorOTP as never);

export default router;
