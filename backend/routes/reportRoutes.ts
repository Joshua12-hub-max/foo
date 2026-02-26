import { Router } from 'express';
import { 
  getForm9Data, 
  getForm33Data, 
  getPSIPOPData 
} from '../controllers/reportController.js';

const router: Router = Router();

// Publication of Vacant Positions
router.get('/form9', getForm9Data);

// Appointment Form (requires position_id)
router.get('/form33', getForm33Data);


// Plantilla of Personnel
router.get('/psipop', getPSIPOPData);

export default router;
