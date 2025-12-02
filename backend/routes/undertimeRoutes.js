import express from 'express';
import { getAllRequests, approveRequest, rejectRequest, applyUndertime } from '../controllers/undertimeController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Employee Route
router.post('/apply', verifyToken, applyUndertime);

// Admin Routes
router.get('/all', verifyAdmin, getAllRequests);
router.put('/:id/approve', verifyAdmin, approveRequest);
router.put('/:id/reject', verifyAdmin, rejectRequest);

export default router;
