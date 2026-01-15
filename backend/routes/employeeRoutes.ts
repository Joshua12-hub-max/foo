import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  revertEmployeeStatus,
  getEmployeeSkills,
  addEmployeeSkill,
  deleteEmployeeSkill,
  getEmployeeEducation,
  addEmployeeEducation,
  deleteEmployeeEducation,
  getEmployeeContacts,
  addEmployeeContact,
  deleteEmployeeContact
} from '../controllers/employeeController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

// Main Employee CRUD
router.get('/', verifyToken, getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById);
router.post('/', verifyToken, verifyAdmin, createEmployee);
router.put('/:id', verifyToken, verifyAdmin, updateEmployee);
router.patch('/:id/revert-status', verifyToken, verifyAdmin, revertEmployeeStatus);
router.delete('/:id', verifyToken, verifyAdmin, deleteEmployee);

// Employee Skills
router.get('/:id/skills', verifyToken, getEmployeeSkills);
router.post('/:id/skills', verifyToken, verifyAdmin, addEmployeeSkill);
router.delete('/:id/skills/:skillId', verifyToken, verifyAdmin, deleteEmployeeSkill);

// Employee Education
router.get('/:id/education', verifyToken, getEmployeeEducation);
router.post('/:id/education', verifyToken, verifyAdmin, addEmployeeEducation);
router.delete('/:id/education/:educationId', verifyToken, verifyAdmin, deleteEmployeeEducation);

// Employee Emergency Contacts
router.get('/:id/contacts', verifyToken, getEmployeeContacts);
router.post('/:id/contacts', verifyToken, verifyAdmin, addEmployeeContact);
router.delete('/:id/contacts/:contactId', verifyToken, verifyAdmin, deleteEmployeeContact);

export default router;
