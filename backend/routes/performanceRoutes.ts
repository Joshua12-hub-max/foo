import { Router } from 'express';
import * as performanceController from '../controllers/performanceController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.get('/summary', verifyToken, performanceController.getEvaluationSummary);
router.get('/rating-distribution', verifyToken, performanceController.getRatingDistribution);

// Cycles
router.get('/cycles', verifyToken, performanceController.getReviewCycles);
router.post('/cycles', verifyToken, performanceController.createReviewCycle);
router.put('/cycles/:id', verifyToken, performanceController.updateReviewCycle);
router.delete('/cycles/:id', verifyToken, performanceController.deleteReviewCycle);

// Criteria
router.get('/criteria', verifyToken, performanceController.getCriteria);
router.post('/criteria', verifyToken, performanceController.addCriteria);
router.put('/criteria/:id', verifyToken, performanceController.updateCriteria);
router.delete('/criteria/:id', verifyToken, performanceController.deleteCriteria);

// Reviews
router.get('/reviews', verifyToken, performanceController.getReviews);
router.get('/reviews/:id', verifyToken, performanceController.getReview);
router.post('/reviews', verifyToken, performanceController.createReview);
router.put('/reviews/:id', verifyToken, performanceController.updateReview);
router.post('/reviews/:id/submit', verifyToken, performanceController.submitReview);
router.delete('/reviews/:id', verifyToken, performanceController.deleteReview);
router.post('/reviews/:id/acknowledge', verifyToken, performanceController.acknowledgeReview);

// CSC-Compliant Routes
router.post('/reviews/:id/self-rating', verifyToken, performanceController.submitSelfRating);
router.post('/reviews/:id/supervisor-rating', verifyToken, performanceController.submitSupervisorRating);
router.post('/reviews/:id/approve', verifyToken, performanceController.approveReview);
router.post('/reviews/:id/finalize', verifyToken, performanceController.finalizeReview);

router.post('/items', verifyToken, performanceController.addItemToReview);
router.put('/items/:id', verifyToken, performanceController.updateReviewItem);
router.delete('/items/:id', verifyToken, performanceController.deleteReviewItem);

export default router;
