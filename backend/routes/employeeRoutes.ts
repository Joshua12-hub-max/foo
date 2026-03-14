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
  updateEmployeeCustomField,
  updateEmployeeSkill,
  updateEmployeeEducation,
  updateEmployeeContact,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument
} from '../controllers/user.controller.js';
import { verifyToken, verifyAdmin, verifyOwnerOrAdmin } from '../middleware/authMiddleware.js';
import { uploadAvatar, uploadResume } from '../middleware/uploadMiddleware.js';

const router: Router = Router();

// Main Employee CRUD
router.get('/', verifyToken, verifyAdmin, getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById); // Controller enforces isSelf or Admin

// ADMIN ONLY - Create and Delete employees
router.post('/', verifyToken, verifyAdmin, createEmployee);
router.delete('/:id', verifyToken, verifyAdmin, deleteEmployee);
router.patch('/:id/revert-status', verifyToken, verifyAdmin, revertEmployeeStatus);

// OWNER OR ADMIN - Update profile
router.put('/:id', verifyToken, verifyOwnerOrAdmin, uploadAvatar.single('avatar'), updateEmployee);

// Employee Skills
router.get('/:id/skills', verifyToken, getEmployeeSkills);
router.post('/:id/skills', verifyToken, verifyOwnerOrAdmin, addEmployeeSkill);
router.put('/:id/skills/:skillId', verifyToken, verifyOwnerOrAdmin, updateEmployeeSkill);
router.delete('/:id/skills/:skillId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeSkill);

// Employee Education
router.get('/:id/education', verifyToken, getEmployeeEducation);
router.post('/:id/education', verifyToken, verifyOwnerOrAdmin, addEmployeeEducation);
router.put('/:id/education/:educationId', verifyToken, verifyOwnerOrAdmin, updateEmployeeEducation);
router.delete('/:id/education/:educationId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeEducation);

// Employee Emergency Contacts
router.get('/:id/contacts', verifyToken, getEmployeeContacts);
router.post('/:id/contacts', verifyToken, verifyOwnerOrAdmin, addEmployeeContact);
router.put('/:id/contacts/:contactId', verifyToken, verifyOwnerOrAdmin, updateEmployeeContact);
router.delete('/:id/contacts/:contactId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeContact);

// Employee Custom Fields
router.post('/:id/custom-fields', verifyToken, verifyOwnerOrAdmin, addEmployeeCustomField);
router.put('/:id/custom-fields/:fieldId', verifyToken, verifyOwnerOrAdmin, updateEmployeeCustomField);
router.delete('/:id/custom-fields/:fieldId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeCustomField);

// Employee Documents
router.get('/:id/documents', verifyToken, getEmployeeDocuments);
router.post('/:id/documents', verifyToken, verifyOwnerOrAdmin, uploadResume.single('document'), uploadEmployeeDocument);
router.delete('/:id/documents/:docId', verifyToken, verifyOwnerOrAdmin, deleteEmployeeDocument);

export default router;
