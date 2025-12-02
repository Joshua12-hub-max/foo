import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow all authenticated users to see events, but only admins to create/update/delete them
router.get('/all', verifyToken, getEvents);
router.post('/create', verifyAdmin, createEvent);
router.put('/:id', verifyAdmin, updateEvent);
router.delete('/:id', verifyAdmin, deleteEvent);

export default router;
