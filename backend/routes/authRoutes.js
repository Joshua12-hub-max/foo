import express from 'express';
import { login, register, getUsers, getUserById, logout, verifyEmail, googleLogin, getMe, resendVerificationEmail, forgotPassword, resetPassword, updateProfile } from '../controllers/authController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/google', authLimiter, googleLogin);
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.get('/verify-email', verifyEmail);
router.get('/me', verifyToken, getMe);
router.post('/profile', verifyToken, uploadAvatar.single('avatar'), updateProfile);
router.post('/resend-verification', authLimiter, resendVerificationEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
