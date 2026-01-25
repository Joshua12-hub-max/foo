import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as stepIncrementController from '../controllers/stepIncrementController.js';

const router: Router = Router();

// Get all step increments
router.get('/', verifyAdmin, stepIncrementController.getStepIncrements);

// Get eligible employees
router.get('/eligible', verifyAdmin, stepIncrementController.getEligibleEmployees);

// Create step increment request
router.post('/', verifyAdmin, stepIncrementController.createStepIncrement);

// Process step increment (Approve/Deny)
router.post('/process', verifyAdmin, stepIncrementController.processStepIncrement);

export default router;
