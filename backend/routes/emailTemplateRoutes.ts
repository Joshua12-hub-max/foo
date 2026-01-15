import { Router } from 'express';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import * as emailTemplateController from '../controllers/emailTemplateController.js';

const router: Router = Router();

router.get('/', verifyAdmin, emailTemplateController.getTemplates);
router.put('/:id', verifyAdmin, emailTemplateController.updateTemplate);

export default router;
