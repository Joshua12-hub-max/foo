/**
 * OPCR Routes (Office Performance Commitment & Review)
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getOPCRs, getOPCR, createOPCR, updateOPCR, deleteOPCR,
  addOPCRItem, updateOPCRItem, deleteOPCRItem,
  submitOPCR, reviewOPCR, approveOPCR, finalizeOPCR,
  validateIPCRAgainstOPCR, getDepartmentRatingAverage
} from '../controllers/opcrController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// OPCR CRUD
router.get('/', getOPCRs);
router.get('/:id', getOPCR);
router.post('/', requireRole(['admin', 'hr']), createOPCR);
router.put('/:id', requireRole(['admin', 'hr']), updateOPCR);
router.delete('/:id', requireRole(['admin', 'hr']), deleteOPCR);

// OPCR Items
router.post('/:id/items', requireRole(['admin', 'hr']), addOPCRItem);
router.put('/:id/items/:itemId', requireRole(['admin', 'hr']), updateOPCRItem);
router.delete('/:id/items/:itemId', requireRole(['admin', 'hr']), deleteOPCRItem);

// OPCR Workflow
router.post('/:id/submit', requireRole(['admin', 'hr']), submitOPCR);
router.post('/:id/review', requireRole(['admin', 'hr']), reviewOPCR);
router.post('/:id/approve', requireRole(['admin']), approveOPCR);
router.post('/:id/finalize', requireRole(['admin']), finalizeOPCR);

// Validation
router.get('/validate/ipcr/:ipcr_id', validateIPCRAgainstOPCR);
router.get('/validate/department', getDepartmentRatingAverage);

export default router;
