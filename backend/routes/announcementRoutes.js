import express from 'express';
import { getAnnouncements, createAnnouncement } from '../controllers/announcementController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow all authenticated users to see announcements, but only admins to create them
router.get('/all', verifyToken, getAnnouncements);
router.post('/create', verifyAdmin, createAnnouncement);

export default router;
