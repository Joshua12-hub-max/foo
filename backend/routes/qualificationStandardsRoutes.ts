import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as qsController from '../controllers/qualificationStandardsController.js';

const router: Router = Router();

// Get all QS
router.get('/', verifyToken, qsController.getQualificationStandards);

// Get single QS by ID
router.get('/:id', verifyToken, qsController.getQualificationStandardById);

// Create QS (Admin only)
router.post('/', verifyAdmin, qsController.createQualificationStandard);

// Update QS (Admin only)
router.put('/:id', verifyAdmin, qsController.updateQualificationStandard);

// Delete QS (Admin only)
router.delete('/:id', verifyAdmin, qsController.deleteQualificationStandard);

// Validate employee against position QS
router.post('/validate', verifyToken, qsController.validateEmployeeQualifications);

export default router;
