import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as plantillaController from '../controllers/plantillaController.js';

const router: Router = Router();

// Summary
router.get('/summary', verifyToken, plantillaController.getPlantillaSummary);

// Audit log
router.get('/audit-log', verifyAdmin, plantillaController.getAuditLog);

// Available employees
router.get('/available-employees', verifyAdmin, plantillaController.getAvailableEmployees);

// Salary schedule
router.get('/salary-schedule', verifyToken, plantillaController.getSalarySchedule);
router.post('/salary-schedule/upload', verifyAdmin, plantillaController.uploadSalarySchedule);
router.delete('/salary-schedule/:tranche', verifyAdmin, plantillaController.deleteSalaryScheduleByTranche);

// Tranches
router.get('/tranches', verifyToken, plantillaController.getTranches);
router.post('/tranches', verifyAdmin, plantillaController.createTranche);
router.get('/tranches/active', verifyToken, plantillaController.getActiveTranche);
router.put('/tranches/:id/activate', verifyAdmin, plantillaController.setActiveTranche);
// CRUD
router.get('/', verifyToken, plantillaController.getPlantilla);
router.post('/', verifyAdmin, plantillaController.createPosition);
router.put('/:id', verifyAdmin, plantillaController.updatePosition);
router.delete('/:id', verifyAdmin, plantillaController.deletePosition);

// Assignment
router.post('/:id/assign', verifyAdmin, plantillaController.assignEmployee);
router.post('/:id/vacate', verifyAdmin, plantillaController.vacatePosition);

// History
router.get('/:id/history', verifyToken, plantillaController.getPositionHistory);

// Abolish position
router.post('/:id/abolish', verifyAdmin, plantillaController.abolishPosition);

export default router;
