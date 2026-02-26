
import { Router } from 'express';
import { getBarangays } from '../controllers/common.controller.js';

const router: Router = Router();

// GET /api/common/barangays
router.get('/barangays', getBarangays);

export default router;
