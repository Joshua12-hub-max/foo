import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
