import { Router, RequestHandler } from 'express';
import { 
  startConversation, 
  sendMessage, 
  getMessages, 
  getActiveConversations,
  closeConversation
} from '../controllers/chatController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { chatRateLimit } from '../middleware/rateLimitMiddleware.js';

const router: Router = Router();

// Public/Applicant Routes (Rate Limited)
router.post('/start', chatRateLimit, startConversation as RequestHandler);
router.post('/message', chatRateLimit, sendMessage as RequestHandler);
router.get('/messages/:conversationId', getMessages as RequestHandler);

// Admin Routes (Protected)
router.get('/conversations', verifyAdmin, getActiveConversations as RequestHandler);
router.post('/admin/message', verifyAdmin, sendMessage as RequestHandler);
router.get('/admin/messages/:conversationId', verifyAdmin, getMessages as RequestHandler);
router.patch('/conversations/:id/close', verifyAdmin, closeConversation as RequestHandler);

export default router;
