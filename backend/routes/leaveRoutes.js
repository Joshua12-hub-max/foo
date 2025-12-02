import express from 'express';
import { 
    applyLeave, 
    getMyLeaves, 
    getAllLeaves, 
    approveLeave, 
    rejectLeave,
    processLeave,
    finalizeLeave,
    getEmployeeCredits,
    getMyCredits,
    getAllCredits,
    addOrUpdateCredit
} from '../controllers/leaveController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Employee Routes
router.post('/apply', verifyToken, upload.single('attachment'), applyLeave);
router.get('/my-leaves', verifyToken, getMyLeaves);
router.get('/my-credits', verifyToken, getMyCredits);
router.put('/:id/finalize', verifyToken, upload.single('finalForm'), finalizeLeave);

// Admin Routes
router.get('/all', verifyAdmin, getAllLeaves);
router.get('/credits/all', verifyAdmin, getAllCredits);
router.get('/credits/:employeeId', verifyAdmin, getEmployeeCredits);
router.post('/credits', verifyAdmin, addOrUpdateCredit);
router.put('/:id/approve', verifyAdmin, approveLeave);
router.put('/:id/reject', verifyAdmin, rejectLeave);
router.put('/:id/process', verifyAdmin, upload.single('adminForm'), processLeave);

export default router;
