import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  processLeave,
  finalizeLeave,
  getEmployeeCredits,
  getMyCredits,
  getAllEmployeeCredits,
  updateEmployeeCredit,
  deleteEmployeeCredit
} from '../controllers/leaveController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadLeave } from '../middleware/uploadMiddleware.js';

const router: Router = Router();

// Employee Routes
router.post('/apply', verifyToken, uploadLeave.single('attachment'), applyLeave);
router.get('/my-leaves', verifyToken, getMyLeaves);
router.get('/my-credits', verifyToken, getMyCredits);
router.put('/:id/finalize', verifyToken, uploadLeave.single('finalForm'), finalizeLeave);

// Admin Routes
router.delete('/credits/:employeeId', verifyAdmin, deleteEmployeeCredit);
router.get('/all', verifyAdmin, getAllLeaves);
router.get('/credits/all', verifyAdmin, getAllEmployeeCredits);
// Specific employee credits
router.get('/credits/:employeeId', verifyAdmin, getEmployeeCredits);
router.put('/credits/:employeeId', verifyAdmin, updateEmployeeCredit);
router.put('/:id/approve', verifyAdmin, approveLeave);
router.put('/:id/reject', verifyAdmin, rejectLeave);
router.put('/:id/process', verifyAdmin, uploadLeave.single('adminForm'), processLeave);

export default router;
