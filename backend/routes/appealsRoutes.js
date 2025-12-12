/**
 * Appeals Routes
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getAppeals, getAppeal, fileAppeal, reviewAppeal, decideAppeal, withdrawAppeal
} from '../controllers/appealsController.js';

const router = express.Router();

router.use(authenticateToken);

// Employee can file appeal for their own IPCR
router.post('/', fileAppeal);

// View appeals (filtered by role)
router.get('/', getAppeals);
router.get('/:id', getAppeal);

// Employee can withdraw their own appeal
router.post('/:id/withdraw', withdrawAppeal);

// PMT/Admin actions
router.post('/:id/review', requireRole(['admin', 'hr']), reviewAppeal);
router.post('/:id/decide', requireRole(['admin', 'hr']), decideAppeal);

export default router;
