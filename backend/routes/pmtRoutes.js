/**
 * PMT Routes (Performance Management Team)
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  getPMTMembers, addPMTMember, updatePMTMember, removePMTMember,
  getPMTMeetings, getPMTMeeting, createPMTMeeting, updatePMTMeeting, deletePMTMeeting,
  getCalibrationData, getPMTDashboard
} from '../controllers/pmtController.js';

const router = express.Router();

router.use(authenticateToken);

// Dashboard
router.get('/dashboard', requireRole(['admin', 'hr']), getPMTDashboard);

// PMT Members
router.get('/members', getPMTMembers);
router.post('/members', requireRole(['admin']), addPMTMember);
router.put('/members/:id', requireRole(['admin']), updatePMTMember);
router.delete('/members/:id', requireRole(['admin']), removePMTMember);

// PMT Meetings
router.get('/meetings', requireRole(['admin', 'hr']), getPMTMeetings);
router.get('/meetings/:id', requireRole(['admin', 'hr']), getPMTMeeting);
router.post('/meetings', requireRole(['admin', 'hr']), createPMTMeeting);
router.put('/meetings/:id', requireRole(['admin', 'hr']), updatePMTMeeting);
router.delete('/meetings/:id', requireRole(['admin', 'hr']), deletePMTMeeting);

// Calibration
router.get('/calibration', requireRole(['admin', 'hr']), getCalibrationData);

export default router;
