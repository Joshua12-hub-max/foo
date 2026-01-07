import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';
import * as recruitmentController from '../controllers/recruitmentController.js';
import { manualCheckEmails } from '../services/emailReceiverService.js';

const router = express.Router();

// Public Routes (For Job Board)
router.get('/jobs', recruitmentController.getJobs);
router.get('/jobs/:id', recruitmentController.getJob);
router.get('/feed', recruitmentController.generateJobFeed);
router.post('/apply', uploadResume.single('resume'), recruitmentController.applyJob);

// Admin Routes
router.post('/jobs', verifyAdmin, recruitmentController.createJob);
router.put('/jobs/:id', verifyAdmin, recruitmentController.updateJob);
router.delete('/jobs/:id', verifyAdmin, recruitmentController.deleteJob);
router.get('/applicants', verifyAdmin, recruitmentController.getApplicants); // Get all or by job_id
router.put('/applicants/:id/stage', verifyAdmin, recruitmentController.updateApplicantStage);
router.put('/jobs/:id/posted', verifyAdmin, recruitmentController.markAsPostedManual);
router.post('/jobs/:id/facebook', verifyAdmin, recruitmentController.postToFacebook);
router.post('/jobs/:id/telegram', verifyAdmin, recruitmentController.postToTelegram);
router.post('/jobs/:id/linkedin', verifyAdmin, recruitmentController.postToLinkedIn);
router.get('/facebook/test', verifyAdmin, recruitmentController.testFacebookConnection);

// Email Application Routes
router.post('/check-emails', verifyAdmin, async (req, res) => {
    try {
        const result = await manualCheckEmails();
        res.json(result);
    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({ success: false, message: 'Failed to check emails', error: error.message });
    }
});

// Interviewer Assignment Routes
router.get('/interviewers', verifyAdmin, recruitmentController.getPotentialInterviewers);
router.put('/applicants/:applicantId/assign-interviewer', verifyAdmin, recruitmentController.assignInterviewer);
router.post('/applicants/:applicantId/offer-letter', verifyAdmin, recruitmentController.generateOfferLetter);
router.get('/applicant-stats', verifyAdmin, recruitmentController.getApplicantStats);

// LinkedIn OAuth Routes
router.get('/linkedin/auth-url', verifyAdmin, recruitmentController.getLinkedInAuthUrl);
router.get('/linkedin/callback', recruitmentController.linkedInCallback); // No auth - callback from LinkedIn

export default router;
