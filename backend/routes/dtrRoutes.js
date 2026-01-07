import express from 'express';
import { getAllRecords } from '../controllers/dtrController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/all', verifyAdmin, getAllRecords);

export default router;
