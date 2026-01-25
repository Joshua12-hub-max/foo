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
router.get('/', authenticateToken, requireRole(['admin', 'hr']), getAllMemos);
router.get('/:id', authenticateToken, requireRole(['admin', 'hr']), getMemoById);
router.post('/', authenticateToken, requireRole(['admin', 'hr']), createMemo);
router.put('/:id', authenticateToken, requireRole(['admin', 'hr']), updateMemo);
router.delete('/:id', authenticateToken, requireRole(['admin', 'hr']), deleteMemo);

// Employee acknowledgment
router.post('/:id/acknowledge', authenticateToken, restrictSuspended, acknowledgeMemo);

export default router;
