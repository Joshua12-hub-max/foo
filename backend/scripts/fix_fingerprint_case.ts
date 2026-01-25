
import db from '../db/connection.js';

const fixCaseMismatch = async () => {
  try {
    console.log('Fixing case mismatch for Admin-001...');
    
    const [result] = await db.query(
      "UPDATE fingerprints SET employee_id = 'admin-001' WHERE employee_id = 'Admin-001'"
    );
    
    console.log('Update Result:', result);
    console.log('✅ Successfully updated fingerprint record to lowercase "admin-001"');
    
  } catch (error) {
    console.error('❌ Error updating record:', error);
  }
  process.exit();
};

fixCaseMismatch();
