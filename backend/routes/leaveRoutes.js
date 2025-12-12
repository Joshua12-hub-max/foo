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
    addOrUpdateCredit,
    // Leave Credit Requests
    applyForCredit,
    getMyCreditRequests,
    getAllCreditRequests,
    approveCreditRequest,
    rejectCreditRequest
} from '../controllers/leaveController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadLeave } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Employee Routes
router.post('/apply', verifyToken, uploadLeave.single('attachment'), applyLeave);
router.get('/my-leaves', verifyToken, getMyLeaves);
router.get('/my-credits', verifyToken, getMyCredits);
router.put('/:id/finalize', verifyToken, uploadLeave.single('finalForm'), finalizeLeave);

// Employee Credit Request Routes
router.post('/credit-requests/apply', verifyToken, applyForCredit);
router.get('/credit-requests/my-requests', verifyToken, getMyCreditRequests);

// Admin Routes
router.get('/all', verifyAdmin, getAllLeaves);
router.get('/credits/all', verifyAdmin, getAllCredits);
router.get('/credits/:employeeId', verifyAdmin, getEmployeeCredits);
router.post('/credits', verifyAdmin, addOrUpdateCredit);
router.put('/:id/approve', verifyAdmin, approveLeave);
router.put('/:id/reject', verifyAdmin, rejectLeave);
router.put('/:id/process', verifyAdmin, uploadLeave.single('adminForm'), processLeave);

// Admin Credit Request Routes
router.get('/credit-requests/all', verifyAdmin, getAllCreditRequests);
router.put('/credit-requests/:id/approve', verifyAdmin, approveCreditRequest);
router.put('/credit-requests/:id/reject', verifyAdmin, rejectCreditRequest);

export default router;

