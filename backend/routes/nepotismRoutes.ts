import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as nepotismController from '../controllers/nepotismController.js';

const router: Router = Router();

// Get all relationships
router.get('/relationships', verifyAdmin, nepotismController.getNepotismRelationships);

// Get relationships for specific employee
router.get('/relationships/:employee_id', verifyToken, nepotismController.getEmployeeRelationships);

// Register new relationship (Admin only)
router.post('/relationships', verifyAdmin, nepotismController.createNepotismRelationship);

// Delete relationship (Admin only)
router.delete('/relationships/:id', verifyAdmin, nepotismController.deleteNepotismRelationship);

// Check for nepotism violations
router.post('/check', verifyAdmin, nepotismController.checkNepotism);

export default router;
