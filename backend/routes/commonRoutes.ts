
import { Router } from 'express';
import { getBarangays, getEmploymentMetadata } from '../controllers/common.controller.js';

const router: Router = Router();

// GET /api/common/barangays
router.get('/barangays', getBarangays);

// GET /api/common/employment-metadata
router.get('/employment-metadata', getEmploymentMetadata);

export default router;
