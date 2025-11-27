import express from 'express';
import { getMe } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// A sample protected route to get current user data
router.get('/me', protect, getMe);

// A sample admin-only route
router.get('/admin-check', protect, restrictTo('Admin'), (req, res) => {
    res.status(200).json({ message: 'Welcome Admin!' });
});


export default router;
