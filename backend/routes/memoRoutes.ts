import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
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
router.get('/', authenticateToken, requireRole(['Admin', 'HR']), getAllMemos);
router.get('/:id', authenticateToken, requireRole(['Admin', 'HR']), getMemoById);
router.post('/', authenticateToken, requireRole(['Admin', 'HR']), createMemo);
router.put('/:id', authenticateToken, requireRole(['Admin', 'HR']), updateMemo);
router.delete('/:id', authenticateToken, requireRole(['Admin', 'HR']), deleteMemo);

// Employee acknowledgment
router.post('/:id/acknowledge', authenticateToken, acknowledgeMemo);

export default router;
