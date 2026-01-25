import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as budgetController from '../controllers/budgetAllocationController.js';

const router: Router = Router();

// Get all budget allocations
router.get('/', verifyAdmin, budgetController.getBudgetAllocations);

// Get budget summary
router.get('/summary', verifyAdmin, budgetController.getBudgetSummary);

// Create budget allocation
router.post('/', verifyAdmin, budgetController.createBudgetAllocation);

// Update budget allocation
router.put('/:id', verifyAdmin, budgetController.updateBudgetAllocation);

// Recalculate budget utilization
router.post('/recalculate', verifyAdmin, budgetController.recalculateBudgetUtilization);

export default router;
