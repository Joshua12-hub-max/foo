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
  deleteEmployeeContact,
  addEmployeeCustomField,
  deleteEmployeeCustomField,
  updateEmployeeCustomField
} from '../controllers/employeeController.js';
import { verifyToken, verifyAdmin, verifyOwnerOrAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

// Main Employee CRUD
router.get('/', verifyToken, verifyAdmin, getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById); // Controller enforces isSelf or Admin

// ADMIN ONLY - Create and Delete employees
router.post('/', verifyToken, verifyAdmin, createEmployee);
router.delete('/:id', verifyToken, verifyAdmin, deleteEmployee);
router.patch('/:id/revert-status', verifyToken, verifyAdmin, revertEmployeeStatus);

// OWNER OR ADMIN - Update profile
router.put('/:id', verifyToken, verifyOwnerOrAdmin, updateEmployee);

// Employee Skills
router.get('/:id/skills', verifyToken, getEmployeeSkills);
router.post('/:id/skills', verifyToken, verifyOwnerOrAdmin, addEmployeeSkill);
router.delete('/:id/skills/:skillId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeSkill);

// Employee Education
router.get('/:id/education', verifyToken, getEmployeeEducation);
router.post('/:id/education', verifyToken, verifyOwnerOrAdmin, addEmployeeEducation);
router.delete('/:id/education/:educationId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeEducation);

// Employee Emergency Contacts
router.get('/:id/contacts', verifyToken, getEmployeeContacts);
router.post('/:id/contacts', verifyToken, verifyOwnerOrAdmin, addEmployeeContact);
router.delete('/:id/contacts/:contactId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeContact);

// Employee Custom Fields
router.post('/:id/custom-fields', verifyToken, verifyOwnerOrAdmin, addEmployeeCustomField);
router.put('/:id/custom-fields/:fieldId', verifyToken, verifyOwnerOrAdmin, updateEmployeeCustomField);
router.delete('/:id/custom-fields/:fieldId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeCustomField);

export default router;
