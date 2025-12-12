/**
 * Performance Notices Routes
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getPerformanceNotices, getPerformanceNotice, createPerformanceNotice,
  issueNotice, acknowledgeNotice, updateNoticeStatus, getNoticesSummary
} from '../controllers/noticesController.js';

const router = express.Router();

router.use(authenticateToken);

// View notices (filtered by role)
router.get('/', getPerformanceNotices);
router.get('/summary', requireRole(['admin', 'hr']), getNoticesSummary);
router.get('/:id', getPerformanceNotice);

// Admin/HR actions
router.post('/', requireRole(['admin', 'hr']), createPerformanceNotice);
router.post('/:id/issue', requireRole(['admin', 'hr']), issueNotice);
router.put('/:id/status', requireRole(['admin', 'hr']), updateNoticeStatus);

// Employee can acknowledge their notice
router.post('/:id/acknowledge', acknowledgeNotice);

export default router;
