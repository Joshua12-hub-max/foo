import express from 'express';
import { 
    getMyCorrections, 
    getAllCorrections, 
    approveCorrection, 
    rejectCorrection, 
    updateCorrectionByAdmin,
    createCorrection
} from '../controllers/dtrCorrectionController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', verifyToken, createCorrection);
router.get('/my-corrections', verifyToken, getMyCorrections);
router.get('/all', verifyAdmin, getAllCorrections);
router.put('/:id/approve', verifyAdmin, approveCorrection);
router.put('/:id/reject', verifyAdmin, rejectCorrection);
router.put('/:id/update', verifyAdmin, updateCorrectionByAdmin);

export default router;
