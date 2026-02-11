import { Router } from 'express';
import { getAllRecords, updateRecord, requestCorrection } from '../controllers/dtrController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/all', verifyAdmin, getAllRecords);
router.put('/:id', verifyAdmin, updateRecord);
router.post('/request', verifyToken, requestCorrection);

export default router;
