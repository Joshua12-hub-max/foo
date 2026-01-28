import express from 'express';
import { 
  startConversation, 
  sendMessage, 
  getMessages, 
  getActiveConversations,
  closeConversation
} from '../controllers/chatController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/Applicant Routes
router.post('/start', startConversation);
router.post('/message', sendMessage); // applicant sends
router.get('/messages/:conversationId', getMessages); // applicant fetches

// Admin Routes (Protected)
router.get('/conversations', verifyAdmin, getActiveConversations);
router.post('/admin/message', verifyAdmin, sendMessage); // admin sends
router.get('/admin/messages/:conversationId', verifyAdmin, getMessages); // admin fetches
router.patch('/conversations/:id/close', verifyAdmin, closeConversation);

export default router;
