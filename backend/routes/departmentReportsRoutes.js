import express from 'express';
import { 
  getDepartmentAttendanceSummary,
  getDepartmentAttendanceDetails,
  exportDepartmentReport,
  getDepartmentList,
  getDepartmentReportHistory,
  saveDepartmentReport,
  deleteDepartmentReport
} from '../controllers/departmentReportsController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdmin);

// Get department list for filter dropdown
router.get('/departments', getDepartmentList);

// Get attendance summary grouped by department
router.get('/summary', getDepartmentAttendanceSummary);

// Get detailed attendance records for a specific department
router.get('/details/:department', getDepartmentAttendanceDetails);

// Export report data (for CSV/PDF generation)
router.get('/export', exportDepartmentReport);

// Report history CRUD
router.get('/history', getDepartmentReportHistory);
router.post('/history', saveDepartmentReport);
router.delete('/history/:id', deleteDepartmentReport);

export default router;
