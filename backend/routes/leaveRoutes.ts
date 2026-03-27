import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  processLeave,
  finalizeLeave,
  approveLeave,
  rejectLeave,
  getMyCredits,
  getEmployeeCredits,
  getAllEmployeeCredits,
  updateEmployeeCredit,
  deleteEmployeeCredit,
  accrueMonthlyCredits,
  getMyLedger,
  getEmployeeLedger,
  getHolidays,
  addHoliday,
  deleteHoliday,
  getLWOPSummary,
  getServiceRecord,
  getTotalLWOPForRetirement,
  processMonthlyTardiness
} from '../controllers/leaveController.js';
import { verifyToken, verifyAdmin, restrictSuspended } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/leaves/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router: Router = Router();

// ============================================================================
// Public/Employee Routes (Token Required)
// ============================================================================

router.post('/apply', verifyToken, restrictSuspended, upload.single('attachment'), applyLeave as never);
router.get('/my-leaves', verifyToken, getMyLeaves as never);
router.get('/my-applications', verifyToken, getMyLeaves as never); // Alias for frontend compatibility
router.get('/my-credits', verifyToken, getMyCredits as never);
router.get('/my-ledger', verifyToken, getMyLedger as never);

// ============================================================================
// Admin Routes (Admin Token Required)
// ============================================================================

// Applications Management
router.get('/all', verifyAdmin, getAllLeaves as never);
router.get('/applications/all', verifyAdmin, getAllLeaves as never); // Alias for frontend compatibility
router.put('/:id/process', verifyAdmin, upload.single('adminForm'), processLeave as never);
router.put('/:id/finalize', verifyAdmin, upload.single('finalAttachment'), finalizeLeave as never);
router.put('/:id/approve', verifyAdmin, approveLeave as never);
router.put('/:id/reject', verifyAdmin, rejectLeave as never);

// Credits Management
router.get('/credits/all', verifyAdmin, getAllEmployeeCredits as never);
router.get('/credits/:employeeId', verifyAdmin, getEmployeeCredits as never);
router.put('/credits/:employeeId', verifyAdmin, updateEmployeeCredit as never);
router.delete('/credits/:employeeId', verifyAdmin, deleteEmployeeCredit as never); // Alias for employeeId deletion
router.delete('/credits/:id', verifyAdmin, deleteEmployeeCredit as never);
router.post('/accrue-monthly', verifyAdmin, accrueMonthlyCredits as never);

// Ledger and History
router.get('/ledger/:employeeId', verifyAdmin, getEmployeeLedger as never);
router.get('/lwop/:employeeId', verifyAdmin, getLWOPSummary as never);
router.get('/lwop-summary/:employeeId', verifyAdmin, getLWOPSummary as never); // Alias for frontend compatibility
router.get('/service-record/:employeeId', verifyAdmin, getServiceRecord as never);
router.get('/service-record/:employeeId/lwop-total', verifyAdmin, getTotalLWOPForRetirement as never);

// Holidays Management
router.get('/holidays', verifyToken, getHolidays as never);
router.post('/holidays', verifyAdmin, addHoliday as never);
router.delete('/holidays/:id', verifyAdmin, deleteHoliday as never);

// Automation/Jobs
router.post('/process-tardiness', verifyAdmin, processMonthlyTardiness as never);

export default router;
