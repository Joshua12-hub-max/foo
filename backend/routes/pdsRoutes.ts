import { Router } from 'express';
import { getPDSSection, updatePDSSection, parsePDSUpload } from '../controllers/pdsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadPDS } from '../middleware/uploadMiddleware.js';

const router: Router = Router();

// Apply auth middleware to all PDS routes
router.use(verifyToken);

// Generic routes for accessing PDS sections
// :section can be 'family', 'education', 'work_experience', etc.
router.get('/:section', getPDSSection);
router.put('/:section', updatePDSSection);
router.post('/parse', uploadPDS.single('pds'), parsePDSUpload);

export default router;
