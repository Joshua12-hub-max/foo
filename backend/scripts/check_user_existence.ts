import pool from '../db/index.js';
import { RowDataPacket } from 'mysql2';

interface EmailRow extends RowDataPacket {
  email: string;
}

async function checkUser() {
  try {
    const [applicant] = await pool.query<EmailRow[]>('SELECT email FROM recruitment_applicants WHERE id = 4');
    if (applicant.length === 0) {
      console.log('Applicant ID 4 not found');
      return;
    }
    const email = applicant[0].email;
    console.log(`Checking applicant email: ${email}`);
    
    const [userRows] = await pool.query<EmailRow[]>('SELECT email FROM authentication WHERE LOWER(email) = ?', [email.toLowerCase()]);
    console.log('--- Matching Authentication Rows ---');
    console.log(JSON.stringify(userRows, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkUser();
