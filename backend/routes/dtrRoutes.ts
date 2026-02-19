import { Router } from 'express';
import { 
  getAllRecords, 
  updateRecord, 
  requestCorrection, 
  getCorrectionRequests, 
  updateCorrectionStatus 
} from '../controllers/dtrController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/all', verifyAdmin, getAllRecords);
router.put('/:id', verifyAdmin, updateRecord);
router.post('/request', verifyToken, requestCorrection);

// Admin Routes for Corrections
router.get('/corrections', verifyAdmin, getCorrectionRequests); 
router.patch('/corrections/status', verifyAdmin, updateCorrectionStatus);

export default router;
