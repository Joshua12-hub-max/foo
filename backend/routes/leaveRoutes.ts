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

router.post('/apply', verifyToken, restrictSuspended, upload.single('attachment'), applyLeave as any);
router.get('/my-leaves', verifyToken, getMyLeaves as any);
router.get('/my-credits', verifyToken, getMyCredits as any);
router.get('/my-ledger', verifyToken, getMyLedger as any);

// ============================================================================
// Admin Routes (Admin Token Required)
// ============================================================================

// Applications Management
router.get('/all', verifyAdmin, getAllLeaves as any);
router.put('/:id/process', verifyAdmin, upload.single('adminForm'), processLeave as any);
router.put('/:id/finalize', verifyAdmin, upload.single('finalAttachment'), finalizeLeave as any);
router.put('/:id/approve', verifyAdmin, approveLeave as any);
router.put('/:id/reject', verifyAdmin, rejectLeave as any);

// Credits Management
router.get('/credits/all', verifyAdmin, getAllEmployeeCredits as any);
router.get('/credits/:employeeId', verifyAdmin, getEmployeeCredits as any);
router.put('/credits/:employeeId', verifyAdmin, updateEmployeeCredit as any);
router.delete('/credits/:id', verifyAdmin, deleteEmployeeCredit as any);
router.post('/accrue-monthly', verifyAdmin, accrueMonthlyCredits as any);

// Ledger and History
router.get('/ledger/:employeeId', verifyAdmin, getEmployeeLedger as any);
router.get('/lwop/:employeeId', verifyAdmin, getLWOPSummary as any);
router.get('/service-record/:employeeId', verifyAdmin, getServiceRecord as any);
router.get('/service-record/:employeeId/lwop-total', verifyAdmin, getTotalLWOPForRetirement as any);

// Holidays Management
router.get('/holidays', verifyToken, getHolidays as any);
router.post('/holidays', verifyAdmin, addHoliday as any);
router.delete('/holidays/:id', verifyAdmin, deleteHoliday as any);

// Automation/Jobs
router.post('/process-tardiness', verifyAdmin, processMonthlyTardiness as any);

export default router;
