import { Router } from 'express';
import {
  // Leave Applications
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  processLeave,
  finalizeLeave,
  approveLeave,
  rejectLeave,
  // Credits
  getMyCredits,
  getEmployeeCredits,
  getAllEmployeeCredits,
  updateEmployeeCredit,
  deleteEmployeeCredit,
  allocateDefaultCredits,
  // Accrual
  accrueMonthlyCredits,
  // Ledger
  getMyLedger,
  getEmployeeLedger,
  // Holidays
  getHolidays,
  addHoliday,
  deleteHoliday,
  // LWOP
  getLWOPSummary,
  // Service Record & Tardiness
  getServiceRecord,
  processMonthlyTardiness,
  getTotalLWOPForRetirement,
} from '../controllers/leaveController.js';
import { verifyToken, verifyAdmin, restrictSuspended } from '../middleware/authMiddleware.js';
import { uploadLeave } from '../middleware/uploadMiddleware.js';

const router: Router = Router();

// ============================================================================
// Employee Routes (require token)
// ============================================================================

// Leave Applications
router.post('/apply', verifyToken, restrictSuspended, uploadLeave.single('attachment'), applyLeave);
router.get('/my-applications', verifyToken, getMyLeaves);
router.put('/:id/finalize', verifyToken, restrictSuspended, uploadLeave.single('finalForm'), finalizeLeave);

// Credits
router.get('/my-credits', verifyToken, getMyCredits);

// Ledger
router.get('/my-ledger', verifyToken, getMyLedger);

// ============================================================================
// Admin Routes (require admin)
// ============================================================================

// Leave Applications - Admin
router.get('/applications/all', verifyAdmin, getAllLeaves);
router.put('/:id/process', verifyAdmin, uploadLeave.single('adminForm'), processLeave);
router.put('/:id/approve', verifyAdmin, approveLeave);
router.put('/:id/reject', verifyAdmin, rejectLeave);

// Credits - Admin
router.get('/credits/all', verifyAdmin, getAllEmployeeCredits);
router.get('/credits/:employeeId', verifyAdmin, getEmployeeCredits);
router.put('/credits/:employeeId', verifyAdmin, updateEmployeeCredit);
router.delete('/credits/:employeeId', verifyAdmin, deleteEmployeeCredit);

// Accrual - Admin
router.post('/accrue-monthly', verifyAdmin, accrueMonthlyCredits);

// Ledger - Admin
router.get('/ledger/:employeeId', verifyAdmin, getEmployeeLedger);

// Holidays - Admin
router.get('/holidays', verifyAdmin, getHolidays);
router.post('/holidays', verifyAdmin, addHoliday);
router.delete('/holidays/:id', verifyAdmin, deleteHoliday);

// LWOP Summary - Admin
router.get('/lwop-summary/:employeeId', verifyAdmin, getLWOPSummary);

// Service Record - Admin (Career History)
router.get('/service-record/:employeeId', verifyAdmin, getServiceRecord);
router.get('/service-record/:employeeId/lwop-total', verifyAdmin, getTotalLWOPForRetirement);

// Tardiness Processing - Admin
router.post('/process-tardiness', verifyAdmin, processMonthlyTardiness);

// ============================================================================
// Legacy Route Aliases (for backward compatibility)
// ============================================================================

// Keep old routes working during transition
router.get('/my-leaves', verifyToken, getMyLeaves);
router.get('/all', verifyAdmin, getAllLeaves);

export default router;
