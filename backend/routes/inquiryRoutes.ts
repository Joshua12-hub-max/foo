import express from 'express';
import { 
  submitInquiry, 
  getInquiries, 
  updateStatus, 
  deleteInquiry 
} from '../controllers/inquiryController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Submit inquiry
router.post('/', submitInquiry);

// Admin: Manage inquiries (protected)
router.get('/', verifyAdmin, getInquiries);
router.patch('/:id/status', verifyAdmin, updateStatus);
router.delete('/:id', verifyAdmin, deleteInquiry);

export default router;
