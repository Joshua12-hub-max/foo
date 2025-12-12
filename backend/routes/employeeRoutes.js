import express from 'express';
import { 
    // Main CRUD
    getAllEmployees, 
    getEmployeeById, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee,
    // Skills
    getEmployeeSkills,
    addEmployeeSkill,
    deleteEmployeeSkill,
    // Education
    getEmployeeEducation,
    addEmployeeEducation,
    deleteEmployeeEducation,
    // Emergency Contacts
    getEmployeeContacts,
    addEmployeeContact,
    deleteEmployeeContact,
    // Documents
    getEmployeeDocuments,
    addEmployeeDocument,
    deleteEmployeeDocument
} from '../controllers/employeeController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// MAIN EMPLOYEE CRUD
// ==========================================
router.get('/', verifyToken, getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById);
router.post('/', verifyToken, verifyAdmin, createEmployee);
router.put('/:id', verifyToken, verifyAdmin, updateEmployee);
router.delete('/:id', verifyToken, verifyAdmin, deleteEmployee);

// ==========================================
// EMPLOYEE SKILLS
// ==========================================
router.get('/:id/skills', verifyToken, getEmployeeSkills);
router.post('/:id/skills', verifyToken, verifyAdmin, addEmployeeSkill);
router.delete('/:id/skills/:skillId', verifyToken, verifyAdmin, deleteEmployeeSkill);

// ==========================================
// EMPLOYEE EDUCATION
// ==========================================
router.get('/:id/education', verifyToken, getEmployeeEducation);
router.post('/:id/education', verifyToken, verifyAdmin, addEmployeeEducation);
router.delete('/:id/education/:educationId', verifyToken, verifyAdmin, deleteEmployeeEducation);

// ==========================================
// EMPLOYEE EMERGENCY CONTACTS
// ==========================================
router.get('/:id/contacts', verifyToken, getEmployeeContacts);
router.post('/:id/contacts', verifyToken, verifyAdmin, addEmployeeContact);
router.delete('/:id/contacts/:contactId', verifyToken, verifyAdmin, deleteEmployeeContact);

// ==========================================
// EMPLOYEE DOCUMENTS
// ==========================================
router.get('/:id/documents', verifyToken, getEmployeeDocuments);
router.post('/:id/documents', verifyToken, verifyAdmin, addEmployeeDocument);
router.delete('/:id/documents/:documentId', verifyToken, verifyAdmin, deleteEmployeeDocument);

export default router;
