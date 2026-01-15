import { Router } from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

// Public route for registration
router.get('/public', departmentController.getPublicDepartments);

// Department Read
router.get('/', verifyToken, departmentController.getDepartments);
router.get('/:id', verifyToken, departmentController.getDepartmentById);

// Department Write
router.post('/', verifyAdmin, departmentController.createDepartment);
router.put('/:id', verifyAdmin, departmentController.updateDepartment);
router.delete('/:id', verifyAdmin, departmentController.deleteDepartment);

// Employee assignment
router.get('/:id/available-employees', verifyAdmin, departmentController.getAvailableEmployees);
router.post('/:id/assign-employee', verifyAdmin, departmentController.assignEmployeeToDepartment);
router.delete('/:id/employees/:employeeId', verifyAdmin, departmentController.removeEmployeeFromDepartment);

export default router;
