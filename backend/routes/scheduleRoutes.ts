import { Router } from 'express';
import { 
    getSchedules, 
    createDepartmentSchedule, 
    getNextCutOffSchedules,
    getScheduleAuditLogs,
    getDepartmentSchedulesSummary,
    getShiftTemplates,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
    getDefaultShiftTemplate
} from '../controllers/scheduleController.js';   
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

// Public/Debug (above verifyToken)
router.get('/shift-templates/default', getDefaultShiftTemplate);

router.use(verifyToken);

// Specific POST routes BEFORE generic ones
console.log('[DEBUG] Loading Schedule Routes - Registering dept-bulk-create');
router.post('/dept-bulk-create', createDepartmentSchedule);

// Specific GET routes
router.get('/audit-logs', getScheduleAuditLogs);
router.get('/next-cutoff', getNextCutOffSchedules);
router.get('/department-summary', getDepartmentSchedulesSummary);

// Shift Templates Library
router.get('/shift-templates', getShiftTemplates);
router.post('/shift-templates', createShiftTemplate);
router.put('/shift-templates/:id', updateShiftTemplate);
router.delete('/shift-templates/:id', deleteShiftTemplate);

// Generic routes
router.get('/', getSchedules);

export default router;
