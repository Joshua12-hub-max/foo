import express from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Department Read (any authenticated user can view)
router.get('/', verifyToken, departmentController.getDepartments);
router.get('/:id', verifyToken, departmentController.getDepartmentById);

// Department Write (admin/hr only)
router.post('/', verifyAdmin, departmentController.createDepartment);
router.put('/:id', verifyAdmin, departmentController.updateDepartment);
router.delete('/:id', verifyAdmin, departmentController.deleteDepartment);

// Employee assignment to department (admin/hr only)
router.get('/:id/available-employees', verifyAdmin, departmentController.getAvailableEmployees);
router.post('/:id/assign-employee', verifyAdmin, departmentController.assignEmployeeToDepartment);
router.delete('/:id/employees/:employeeId', verifyAdmin, departmentController.removeEmployeeFromDepartment);

export default router;
