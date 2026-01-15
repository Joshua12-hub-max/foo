import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/all', verifyToken, getEvents);
router.post('/create', verifyAdmin, createEvent);
router.put('/:id', verifyAdmin, updateEvent);
router.delete('/:id', verifyAdmin, deleteEvent);

export default router;
