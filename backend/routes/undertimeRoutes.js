import express from 'express';
import { getAllRequests, approveRequest, rejectRequest, applyUndertime, getMyRequests, cancelRequest } from '../controllers/undertimeController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadUndertime } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Employee Routes
router.post('/apply', verifyToken, uploadUndertime.single('attachment'), applyUndertime);
router.get('/my-requests', verifyToken, getMyRequests);
router.put('/:id/cancel', verifyToken, cancelRequest);

// Admin Routes
router.get('/all', verifyAdmin, getAllRequests);
router.put('/:id/approve', verifyAdmin, approveRequest);
router.put('/:id/reject', verifyAdmin, rejectRequest);

export default router;
