import { Router } from 'express';
import { getPolicies, createPolicy, updatePolicy } from '../controllers/policyController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/', verifyToken, getPolicies);
router.post('/', verifyAdmin, createPolicy);
router.put('/:id', verifyAdmin, updatePolicy);

export default router;
