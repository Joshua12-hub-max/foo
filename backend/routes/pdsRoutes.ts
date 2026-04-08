import { Router } from 'express';
import { getPDSSection, updatePDSSection, parsePDSUpload, getPdsPersonal, updatePdsPersonal, getPdsQuestions, updatePdsQuestions } from '../controllers/pdsController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadPDS } from '../middleware/uploadMiddleware.js';

const router: Router = Router();

// FIX: /parse must be PUBLIC (called during unauthenticated self-registration).
// optionalAuth attaches user if token exists but does NOT block unauthenticated requests.
router.post('/parse', optionalAuth, uploadPDS.single('pds'), parsePDSUpload);

// All other PDS routes require authentication
router.use(verifyToken);

// Dedicated routes for Personal Information and Declarations (C4)
router.get('/personal', getPdsPersonal);
router.put('/personal', updatePdsPersonal);
router.get('/questions', getPdsQuestions);
router.put('/questions', updatePdsQuestions);

// Generic routes for accessing PDS sections
// :section can be 'family', 'education', 'work_experience', etc.
router.get('/:section', getPDSSection);
router.put('/:section', updatePDSSection);
export default router;
