import { Router, Request, Response } from 'express';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';
import * as recruitmentController from '../controllers/recruitmentController.js';
import { manualCheckEmails } from '../services/emailReceiverService.js';

const router: Router = Router();

// Public Routes
router.get('/jobs', recruitmentController.getJobs);
router.get('/jobs/:id', recruitmentController.getJob);
router.get('/feed', recruitmentController.generateJobFeed);
router.post('/apply', uploadResume.single('resume'), recruitmentController.applyJob);

// Admin Routes
router.post('/jobs', verifyAdmin, recruitmentController.createJob);
router.put('/jobs/:id', verifyAdmin, recruitmentController.updateJob);
router.delete('/jobs/:id', verifyAdmin, recruitmentController.deleteJob);
router.get('/applicants', verifyAdmin, recruitmentController.getApplicants);
router.put('/applicants/:id/stage', verifyAdmin, recruitmentController.updateApplicantStage);

// Email Application Routes
router.post('/check-emails', verifyAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await manualCheckEmails();
    res.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Email check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check emails', error: err.message });
  }
});

// Interviewer Assignment Routes
router.get('/interviewers', verifyAdmin, recruitmentController.getPotentialInterviewers);
router.put('/applicants/:applicantId/assign-interviewer', verifyAdmin, recruitmentController.assignInterviewer);
router.post('/applicants/:applicantId/offer-letter', verifyAdmin, recruitmentController.generateOfferLetter);
router.get('/applicant-stats', verifyAdmin, recruitmentController.getApplicantStats);

// Meeting Link Generation
router.post('/generate-meeting-link', verifyAdmin, recruitmentController.generateMeetingLink);

// Interview Notes
router.post('/applicants/:id/interview-notes', verifyAdmin, recruitmentController.saveInterviewNotes);



export default router;
