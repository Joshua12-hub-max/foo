
import db from '../db/connection.js';

const addFingerprintRecords = async () => {
  try {
    console.log('Adding fingerprint records to database...');
    
    await db.query(
      `INSERT INTO fingerprints (fingerprint_id, employee_id) VALUES 
       (1, 'admin-001'), 
       (2, 'admin-001'), 
       (3, 'admin-001') 
       ON DUPLICATE KEY UPDATE employee_id = 'admin-001'`
    );
    
    console.log('✅ Fingerprint records added!');
    
    const [rows] = await db.query('SELECT * FROM fingerprints');
    console.table(rows);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit();
};

addFingerprintRecords();
