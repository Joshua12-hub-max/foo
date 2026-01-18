import { Router } from 'express';
import { getZoomStatus, createZoomMeeting, generateZoomSignature } from '../controllers/zoomController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

// Check if Zoom is configured
router.get('/status', verifyToken, getZoomStatus);

// Create a new Zoom meeting
router.post('/meeting', verifyToken, createZoomMeeting);

// Generate Zoom Web SDK signature for embedding
router.post('/signature', verifyToken, generateZoomSignature);

export default router;
