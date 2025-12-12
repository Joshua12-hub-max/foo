import express from 'express';
import * as spmsController from '../controllers/spmsController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// =====================================================
// CYCLE MANAGEMENT
// =====================================================
router.get('/cycles', verifyToken, spmsController.getCycles);
router.get('/cycles/:id', verifyToken, spmsController.getCycle);
router.post('/cycles', verifyAdmin, spmsController.createCycle);
router.put('/cycles/:id', verifyAdmin, spmsController.updateCycle);
router.delete('/cycles/:id', verifyAdmin, spmsController.deleteCycle);

// =====================================================
// MFO MANAGEMENT
// =====================================================
router.get('/mfo', verifyToken, spmsController.getMFOs);
router.post('/mfo', verifyAdmin, spmsController.createMFO);
router.put('/mfo/:id', verifyAdmin, spmsController.updateMFO);
router.delete('/mfo/:id', verifyAdmin, spmsController.deleteMFO);

// =====================================================
// KRA MANAGEMENT
// =====================================================
router.get('/kra', verifyToken, spmsController.getKRAs);
router.post('/kra', verifyAdmin, spmsController.createKRA);
router.put('/kra/:id', verifyAdmin, spmsController.updateKRA);
router.delete('/kra/:id', verifyAdmin, spmsController.deleteKRA);

// =====================================================
// COMPETENCIES MANAGEMENT
// =====================================================
router.get('/competencies', verifyToken, spmsController.getCompetencies);
router.post('/competencies', verifyAdmin, spmsController.createCompetency);
router.put('/competencies/:id', verifyAdmin, spmsController.updateCompetency);

// =====================================================
// IPCR MANAGEMENT
// =====================================================
router.get('/ipcr', verifyToken, spmsController.getIPCRs);
router.get('/ipcr/:id', verifyToken, spmsController.getIPCR);
router.post('/ipcr', verifyAdmin, spmsController.createIPCR);
router.put('/ipcr/:id', verifyToken, spmsController.updateIPCR);
router.delete('/ipcr/:id', verifyAdmin, spmsController.deleteIPCR);

// IPCR Items
router.post('/ipcr/:id/items', verifyToken, spmsController.addIPCRItem);
router.put('/ipcr/items/:itemId', verifyToken, spmsController.updateIPCRItem);
router.delete('/ipcr/items/:itemId', verifyToken, spmsController.deleteIPCRItem);

// IPCR Workflow Actions
router.post('/ipcr/:id/commit', verifyToken, spmsController.commitIPCR);
router.post('/ipcr/:id/submit-for-rating', verifyToken, spmsController.submitForRating);
router.post('/ipcr/:id/rate', verifyToken, spmsController.rateIPCR);
router.post('/ipcr/:id/acknowledge', verifyToken, spmsController.acknowledgeIPCR);
router.post('/ipcr/:id/approve', verifyToken, spmsController.approveIPCR);
router.post('/ipcr/:id/finalize', verifyAdmin, spmsController.finalizeIPCR);

// Competency Ratings
router.put('/ipcr/:id/competencies', verifyToken, spmsController.updateCompetencyRatings);

// =====================================================
// DASHBOARD & REPORTS
// =====================================================
router.get('/dashboard', verifyToken, spmsController.getSPMSDashboard);
router.get('/reports/department', verifyAdmin, spmsController.getDepartmentReport);
router.get('/employees-needing-pdp', verifyToken, spmsController.getEmployeesNeedingPDP);

// =====================================================
// MID-YEAR REVIEW
// =====================================================
router.get('/ipcr/:id/mid-year', verifyToken, spmsController.getMidYearReview);
router.post('/ipcr/:id/mid-year', verifyToken, spmsController.submitMidYearReview);

// =====================================================
// MFO BUDGET
// =====================================================
router.put('/mfo/:id/budget', verifyAdmin, spmsController.updateMFOBudget);

export default router;
