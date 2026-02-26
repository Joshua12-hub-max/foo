import { Router } from 'express';
import { getEmployeeMetrics, getAllViolations } from '../controllers/complianceController.js';

const router: Router = Router();

// GET /api/compliance/metrics/:employeeId
router.get('/metrics/:employeeId', getEmployeeMetrics);

// GET /api/compliance/violations
router.get('/violations', getAllViolations);

export default router;
