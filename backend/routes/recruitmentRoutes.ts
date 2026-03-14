import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadResume, uploadGeneral } from '../middleware/uploadMiddleware.js';
import * as recruitmentController from '../controllers/recruitmentController.js';
import { manualCheckEmails } from '../services/emailReceiverService.js';
import { namingMiddleware } from '../middleware/namingMiddleware.js';
import multer from 'multer';

const router: Router = Router();

// Anti-Spam: Rate Limit for public applications
const applyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 applications per hour per IP (Spam prevention)
  message: { success: false, message: 'Too many applications from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer error handler wrapper
const handleMulterError = (err: Error, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    return;
  } else if (err) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  next();
};

// Public Routes
router.get('/jobs', recruitmentController.getJobs as RequestHandler);
router.get('/jobs/:id', recruitmentController.getJob as RequestHandler);
router.get('/feed', recruitmentController.generateJobFeed as RequestHandler);
router.post('/apply', 
  applyRateLimit,
  uploadResume.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'eligibilityCert', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  handleMulterError,
  recruitmentController.applyJob as RequestHandler
);

// Admin Routes
router.post('/jobs', verifyAdmin, uploadGeneral.single('file'), handleMulterError, namingMiddleware, recruitmentController.createJob as RequestHandler);
router.put('/jobs/:id', verifyAdmin, uploadGeneral.single('file'), handleMulterError, namingMiddleware, recruitmentController.updateJob as RequestHandler);
router.delete('/jobs/:id', verifyAdmin, recruitmentController.deleteJob as RequestHandler);
router.get('/applicants', verifyAdmin, recruitmentController.getApplicants as RequestHandler);
router.get('/hired-by-duty', verifyAdmin, recruitmentController.getHiredByDuty as RequestHandler);
router.get('/applicants/:id/pdf', verifyAdmin, recruitmentController.generateApplicationPDF as RequestHandler);
router.get('/applicants/:id/photo/:type', verifyAdmin, recruitmentController.generatePhotoPDF as RequestHandler);
router.put('/applicants/:id/stage', verifyAdmin, recruitmentController.updateApplicantStage as RequestHandler);
router.post('/applicants/:id/confirm', verifyAdmin, recruitmentController.confirmHiredApplicant as RequestHandler);
router.delete('/applicants/:id', verifyAdmin, recruitmentController.deleteApplicant as RequestHandler);


router.post('/check-emails', verifyAdmin, async (_req: Request, res: Response): Promise<void> => {
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
router.get('/interviewers', verifyAdmin, recruitmentController.getPotentialInterviewers as RequestHandler);
router.put('/applicants/:applicantId/assign-interviewer', verifyAdmin, recruitmentController.assignInterviewer as RequestHandler);
router.post('/applicants/:applicantId/offer-letter', verifyAdmin, recruitmentController.generateOfferLetter as RequestHandler);
router.get('/applicant-stats', verifyAdmin, recruitmentController.getApplicantStats as RequestHandler);

// Meeting Link Generation
router.post('/generate-meeting-link', verifyAdmin, recruitmentController.generateMeetingLink as RequestHandler);

// Interview Notes
router.post('/applicants/:id/interview-notes', verifyAdmin, recruitmentController.saveInterviewNotes as RequestHandler);

// Security Audit
router.get('/security-logs', verifyAdmin, recruitmentController.getSecurityLogs as RequestHandler);





export default router;
