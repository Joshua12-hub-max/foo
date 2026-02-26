import { Router } from 'express';
import { initiateGoogleAuth, handleGoogleCallback, disconnectGoogleCalendar, getSyncStatus, importFromGoogle, exportToGoogle, bidirectionalSync
} from '../controllers/googleCalendarController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

// OAuth routes
router.get('/auth', verifyToken, initiateGoogleAuth);
router.get('/callback', verifyToken, handleGoogleCallback);
router.post('/disconnect', verifyToken, disconnectGoogleCalendar);

// Sync routes
router.get('/sync/status', verifyToken, getSyncStatus);
router.post('/sync/import', verifyToken, importFromGoogle);
router.post('/sync/export', verifyToken, exportToGoogle);
router.post('/sync/bidirectional', verifyToken, bidirectionalSync);

export default router;

