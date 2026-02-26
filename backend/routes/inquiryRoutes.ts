import { Router, RequestHandler } from 'express';
import { 
  submitInquiry, 
  getInquiries, 
  updateStatus, 
  deleteInquiry 
} from '../controllers/inquiryController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { inquiryRateLimit } from '../middleware/rateLimitMiddleware.js';

const router: Router = Router();

// Public: Submit inquiry (Rate Limited)
router.post('/', inquiryRateLimit, submitInquiry as RequestHandler);

// Admin: Manage inquiries (protected)
router.get('/', verifyAdmin, getInquiries as RequestHandler);
router.patch('/:id/status', verifyAdmin, updateStatus as RequestHandler);
router.delete('/:id', verifyAdmin, deleteInquiry as RequestHandler);

export default router;
