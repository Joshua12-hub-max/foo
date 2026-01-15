import { Router } from 'express';
import { getAllRecords, updateRecord } from '../controllers/dtrController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/all', verifyAdmin, getAllRecords);
router.put('/:id', verifyAdmin, updateRecord);

export default router;
