import { Router } from 'express';
import { getPDSSection, updatePDSSection, parsePDSUpload, getPdsPersonal, updatePdsPersonal, getPdsQuestions, updatePdsQuestions } from '../controllers/pdsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadPDS } from '../middleware/uploadMiddleware.js';

const router: Router = Router();

// Apply auth middleware to all PDS routes
router.use(verifyToken);

// Dedicated routes for Personal Information and Declarations (C4)
router.get('/personal', getPdsPersonal);
router.put('/personal', updatePdsPersonal);
router.get('/questions', getPdsQuestions);
router.put('/questions', updatePdsQuestions);

// Generic routes for accessing PDS sections
// :section can be 'family', 'education', 'work_experience', etc.
router.post('/parse', uploadPDS.single('pds'), parsePDSUpload);
router.get('/:section', getPDSSection);
router.put('/:section', updatePDSSection);
export default router;
