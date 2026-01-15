import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/all', verifyToken, getAnnouncements);
router.post('/create', verifyAdmin, createAnnouncement);
router.put('/:id', verifyAdmin, updateAnnouncement);
router.delete('/:id', verifyAdmin, deleteAnnouncement);

export default router;
