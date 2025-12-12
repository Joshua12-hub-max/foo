import express from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow all authenticated users to see announcements, but only admins to create/update/delete them
router.get('/all', verifyToken, getAnnouncements);
router.post('/create', verifyAdmin, createAnnouncement);
router.put('/:id', verifyAdmin, updateAnnouncement);
router.delete('/:id', verifyAdmin, deleteAnnouncement);

export default router;

