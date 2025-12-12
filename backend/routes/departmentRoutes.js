import express from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Department CRUD
router.get('/', verifyAdmin, departmentController.getDepartments);
router.get('/:id', verifyAdmin, departmentController.getDepartmentById);
router.post('/', verifyAdmin, departmentController.createDepartment);
router.put('/:id', verifyAdmin, departmentController.updateDepartment);
router.delete('/:id', verifyAdmin, departmentController.deleteDepartment);

// Employee assignment to department
router.get('/:id/available-employees', verifyAdmin, departmentController.getAvailableEmployees);
router.post('/:id/assign-employee', verifyAdmin, departmentController.assignEmployeeToDepartment);
router.delete('/:id/employees/:employeeId', verifyAdmin, departmentController.removeEmployeeFromDepartment);

export default router;
