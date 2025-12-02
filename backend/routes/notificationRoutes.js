import express from 'express';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  deleteNotification 
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this router
router.use(verifyToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
