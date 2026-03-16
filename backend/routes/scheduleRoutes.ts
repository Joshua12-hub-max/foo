import { Router } from 'express';
import { 
    getSchedules, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule, 
    getShiftTemplates, 
    createDepartmentSchedule, 
    getDepartmentSchedules, 
    createShiftTemplate, 
    updateShiftTemplate, 
    deleteShiftTemplate 
} from '../controllers/scheduleController.js';   
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

// Public/Debug (above verifyToken)
router.get('/shift-templates', getShiftTemplates);

router.use(verifyToken);

// Specific POST routes BEFORE generic ones
console.log('[DEBUG] Loading Schedule Routes - Registering dept-bulk-create');
router.post('/dept-bulk-create', createDepartmentSchedule);
router.post('/shift-templates', createShiftTemplate);

// Specific GET routes
router.get('/get-department-schedules', getDepartmentSchedules);

// Generic routes
router.get('/', getSchedules);
router.post('/', createSchedule);

// Generic ID routes
router.put('/shift-templates/:id', updateShiftTemplate);
router.delete('/shift-templates/:id', deleteShiftTemplate);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
