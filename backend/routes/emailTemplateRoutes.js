import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as emailTemplateController from '../controllers/emailTemplateController.js';

const router = express.Router();

// Admin only routes
router.get('/', verifyAdmin, emailTemplateController.getTemplates);
router.put('/:id', verifyAdmin, emailTemplateController.updateTemplate);

export default router;
