import { Router, RequestHandler } from 'express';
import { 
  startConversation,
  sendMessage,
  getMessages, 
  getActiveConversations,
  closeConversation,
  editMessage,
  deleteMessage,
  deleteConversation,
  getUnreadCount,
  getAdminUnreadTotal
} from '../controllers/chatController.js';
import { verifyAdmin, optionalAuth } from '../middleware/authMiddleware.js';
import { chatRateLimit } from '../middleware/rateLimitMiddleware.js';

const router: Router = Router();

// Public/Applicant Routes (With Optional Auth for Admin usage of same endpoints)
router.post('/start', chatRateLimit, startConversation as RequestHandler);
router.post('/message', chatRateLimit, optionalAuth, sendMessage as RequestHandler);
router.get('/messages/:conversationId', optionalAuth, getMessages as RequestHandler);
router.get('/unread-count/:conversationId', optionalAuth, getUnreadCount as RequestHandler);
router.patch('/message/:id', chatRateLimit, optionalAuth, editMessage as RequestHandler);
router.delete('/message/:id', chatRateLimit, optionalAuth, deleteMessage as RequestHandler);
router.delete('/conversations/:id', chatRateLimit, optionalAuth, deleteConversation as RequestHandler);

// Admin Routes (Protected)
router.get('/conversations', verifyAdmin, getActiveConversations as RequestHandler);
router.post('/admin/message', verifyAdmin, sendMessage as RequestHandler);
router.get('/admin/messages/:conversationId', verifyAdmin, getMessages as RequestHandler);
router.patch('/admin/message/:id', verifyAdmin, editMessage as RequestHandler);
router.delete('/admin/message/:id', verifyAdmin, deleteMessage as RequestHandler);
router.delete('/admin/conversations/:id', verifyAdmin, deleteConversation as RequestHandler);
router.get('/admin/unread-total', verifyAdmin, getAdminUnreadTotal as RequestHandler);
router.patch('/conversations/:id/close', verifyAdmin, closeConversation as RequestHandler);

export default router;
