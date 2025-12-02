import express from 'express';
import { login, register, getUsers, logout, verifyEmail, googleLogin, getMe, resendVerificationEmail, forgotPassword, resetPassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleLogin);
router.get('/users', getUsers);
router.get('/verify-email', verifyEmail);
router.get('/me', verifyToken, getMe);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
