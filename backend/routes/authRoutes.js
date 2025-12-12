import express from 'express';
import { login, register, getUsers, getUserById, logout, verifyEmail, googleLogin, getMe, resendVerificationEmail, forgotPassword, resetPassword, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleLogin);
router.get('/users', getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.get('/verify-email', verifyEmail);
router.get('/me', verifyToken, getMe);
router.post('/profile', verifyToken, uploadAvatar.single('avatar'), updateProfile);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
