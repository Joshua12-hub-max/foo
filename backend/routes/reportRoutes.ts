import express from 'express';
import { 
  getForm9Data, 
  getForm33Data, 
  getRAIData, 
  getPSIPOPData 
} from '../controllers/reportController.js';

const router = express.Router();

// Publication of Vacant Positions
router.get('/form9', getForm9Data);

// Appointment Form (requires position_id)
router.get('/form33', getForm33Data);

// Report on Appointments Issued
router.get('/rai', getRAIData);

// Plantilla of Personnel
router.get('/psipop', getPSIPOPData);

export default router;
