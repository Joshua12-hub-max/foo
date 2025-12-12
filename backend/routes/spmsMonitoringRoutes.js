import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

// Import controllers
import * as coachingController from '../controllers/coachingController.js';
import * as developmentPlanController from '../controllers/developmentPlanController.js';
import * as trainingNeedsController from '../controllers/trainingNeedsController.js';

const router = express.Router();

// =====================================================
// COACHING LOGS
// =====================================================
router.get('/coaching', verifyToken, coachingController.getCoachingLogs);
router.get('/coaching/stats', verifyToken, coachingController.getCoachingStats);
router.get('/coaching/my-sessions', verifyToken, coachingController.getMyCoachingSessions);
router.get('/coaching/:id', verifyToken, coachingController.getCoachingLog);
router.post('/coaching', verifyToken, coachingController.createCoachingLog);
router.put('/coaching/:id', verifyToken, coachingController.updateCoachingLog);
router.post('/coaching/:id/complete', verifyToken, coachingController.completeCoachingSession);
router.delete('/coaching/:id', verifyToken, coachingController.deleteCoachingLog);

// =====================================================
// DEVELOPMENT PLANS (PDP)
// =====================================================
router.get('/development-plans', verifyToken, developmentPlanController.getDevelopmentPlans);
router.get('/development-plans/stats', verifyToken, developmentPlanController.getDevelopmentPlanStats);
router.get('/development-plans/my-plans', verifyToken, developmentPlanController.getMyDevelopmentPlans);
router.get('/development-plans/:id', verifyToken, developmentPlanController.getDevelopmentPlan);
router.post('/development-plans', verifyToken, developmentPlanController.createDevelopmentPlan);
router.put('/development-plans/:id', verifyToken, developmentPlanController.updateDevelopmentPlan);
router.post('/development-plans/:id/approve', verifyAdmin, developmentPlanController.approveDevelopmentPlan);
router.post('/development-plans/:id/complete', verifyToken, developmentPlanController.completeDevelopmentPlan);
router.put('/development-plans/:id/progress', verifyToken, developmentPlanController.updateProgress);
router.delete('/development-plans/:id', verifyAdmin, developmentPlanController.deleteDevelopmentPlan);

// =====================================================
// TRAINING NEEDS
// =====================================================
router.get('/training-needs', verifyToken, trainingNeedsController.getTrainingNeeds);
router.get('/training-needs/stats', verifyToken, trainingNeedsController.getTrainingStats);
router.get('/training-needs/my-trainings', verifyToken, trainingNeedsController.getMyTrainingNeeds);
router.get('/training-needs/:id', verifyToken, trainingNeedsController.getTrainingNeed);
router.post('/training-needs', verifyToken, trainingNeedsController.createTrainingNeed);
router.put('/training-needs/:id', verifyToken, trainingNeedsController.updateTrainingNeed);
router.post('/training-needs/:id/approve', verifyAdmin, trainingNeedsController.approveTrainingNeed);
router.post('/training-needs/:id/schedule', verifyToken, trainingNeedsController.scheduleTraining);
router.post('/training-needs/:id/complete', verifyToken, trainingNeedsController.completeTraining);
router.delete('/training-needs/:id', verifyToken, trainingNeedsController.deleteTrainingNeed);

export default router;
