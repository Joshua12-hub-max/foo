import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';
import * as recruitmentController from '../controllers/recruitmentController.js';

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
router.put('/jobs/:id/posted', verifyAdmin, recruitmentController.markAsPosted);

export default router;
