import { Router } from 'express';
import { authenticateToken, requireRole, restrictSuspended } from '../middleware/authMiddleware.js';
import {
  getAllMemos,
  getMyMemos,
  getMemoById,
  createMemo,
  updateMemo,
  deleteMemo,
  acknowledgeMemo
} from '../controllers/memoController.js';

const router: Router = Router();

// Employee route
router.get('/my', authenticateToken, getMyMemos);

// Admin routes
router.get('/', authenticateToken, requireRole(['Admin', 'Human Resource']), getAllMemos);
router.get('/:id', authenticateToken, requireRole(['Admin', 'Human Resource']), getMemoById);
router.post('/', authenticateToken, requireRole(['Admin', 'Human Resource']), createMemo);
router.put('/:id', authenticateToken, requireRole(['Admin', 'Human Resource']), updateMemo);
router.delete('/:id', authenticateToken, requireRole(['Admin', 'Human Resource']), deleteMemo);

// Employee acknowledgment
router.post('/:id/acknowledge', authenticateToken, restrictSuspended, acknowledgeMemo);

export default router;
