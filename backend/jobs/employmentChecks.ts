import cron from 'node-cron';
import db from '../db/connection.js';
import { RowDataPacket } from 'mysql2';
// import { sendEmailNotification } from '../controllers/recruitmentController.js'; // Assuming we can export this or move to utils

// Define interfaces for query results
interface EmployeeDateRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contract_end_date?: string;
  regularization_date?: string;
  department: string;
}

const checkEmploymentStatus = async () => {
  console.log('Running daily employment status check...');
  
  try {
    // 1. Check for Regularization (Probationary employees nearing 6 months)
    const [probationary] = await db.query<EmployeeDateRow[]>(
      `SELECT id, first_name, last_name, email, regularization_date, department 
       FROM authentication 
       WHERE employment_type = 'Probationary' 
       AND regularization_date IS NOT NULL 
       AND regularization_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
       AND is_regular = FALSE`
    );

    if (probationary.length > 0) {
      console.log(`Found ${probationary.length} employees due for regularization.`);
      // TODO: Send notification Logic
      // await sendEmailNotification(...)
    }

    // 2. Check for Contract Expiry (Job Order/Contractual)
    const [expiring] = await db.query<EmployeeDateRow[]>(
      `SELECT id, first_name, last_name, email, contract_end_date, department 
       FROM authentication 
       WHERE employment_type IN ('Job Order', 'Contractual') 
       AND contract_end_date IS NOT NULL 
       AND contract_end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)`
    );

    if (expiring.length > 0) {
      console.log(`Found ${expiring.length} contracts expiring soon.`);
      // TODO: Send notification Logic
    }

  } catch (error) {
    console.error('Error in employment status check:', error);
  }
};

// Initialize Cron Job
export const initCronJobs = () => {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    checkEmploymentStatus();
  });
  
  console.log('Employment Check Cron Job initialized (Daily at 8:00 AM)');
};
