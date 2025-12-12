import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import * as plantillaController from '../controllers/plantillaController.js';

const router = express.Router();

router.get('/', verifyToken, plantillaController.getPlantilla);
router.post('/', verifyAdmin, plantillaController.createPosition);
router.put('/:id', verifyAdmin, plantillaController.updatePosition);
router.delete('/:id', verifyAdmin, plantillaController.deletePosition);

export default router;
