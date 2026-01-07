import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as plantillaController from '../controllers/plantillaController.js';

const router = express.Router();

// Summary (must be before :id routes)
router.get('/summary', verifyToken, plantillaController.getPlantillaSummary);

// Audit log
router.get('/audit-log', verifyAdmin, plantillaController.getAuditLog);

// Available employees for assignment
router.get('/available-employees', verifyAdmin, plantillaController.getAvailableEmployees);

// Salary schedule lookup
router.get('/salary-schedule', verifyToken, plantillaController.getSalarySchedule);

// Basic CRUD
router.get('/', verifyToken, plantillaController.getPlantilla);
router.post('/', verifyAdmin, plantillaController.createPosition);
router.put('/:id', verifyAdmin, plantillaController.updatePosition);
router.delete('/:id', verifyAdmin, plantillaController.deletePosition);

// Assignment management
router.post('/:id/assign', verifyAdmin, plantillaController.assignEmployee);
router.post('/:id/vacate', verifyAdmin, plantillaController.vacatePosition);

// History
router.get('/:id/history', verifyToken, plantillaController.getPositionHistory);

export default router;
