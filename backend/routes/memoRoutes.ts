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
router.get('/', authenticateToken, requireRole(['Administrator', 'Human Resource']), getAllMemos);
router.get('/:id', authenticateToken, requireRole(['Administrator', 'Human Resource']), getMemoById);
router.post('/', authenticateToken, requireRole(['Administrator', 'Human Resource']), createMemo);
router.put('/:id', authenticateToken, requireRole(['Administrator', 'Human Resource']), updateMemo);
router.delete('/:id', authenticateToken, requireRole(['Administrator', 'Human Resource']), deleteMemo);

// Employee acknowledgment
router.post('/:id/acknowledge', authenticateToken, restrictSuspended, acknowledgeMemo);

export default router;
