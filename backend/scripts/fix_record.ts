
import db from '../db/connection.js';

const fixRecord = async () => {
  try {
    await db.query(
      `INSERT INTO fingerprints (fingerprint_id, employee_id) 
       VALUES (1, 'Admin-001') 
       ON DUPLICATE KEY UPDATE employee_id = 'Admin-001'`
    );
    console.log('✅ Fingerprint record added!');
    
    const [rows] = await db.query('SELECT * FROM fingerprints');
    console.table(rows);
  } catch (err) {
    console.error(err);
  }
  process.exit();
};

fixRecord();
