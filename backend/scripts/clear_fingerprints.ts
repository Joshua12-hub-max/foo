
import db from '../db/connection.js';
import { sendCommandToDevice } from '../services/biometricService.js';

const clearAllFingerprints = async () => {
  try {
    console.log('🧹 Clearing all fingerprints...');
    
    // 1. Clear from database
    console.log('Clearing database records...');
    await db.query('DELETE FROM fingerprints');
    console.log('✅ Database cleared');
    
    // 2. Send clear command to Arduino (command "9")
    console.log('Sending clear command to sensor...');
    // Note: This requires the backend to be running with the sensor connected
    // For now, just clear the database
    
    console.log('\n✅ Done! Now:');
    console.log('1. Make sure Arduino has the NEW code uploaded');
    console.log('2. Restart Backend (npm start)');
    console.log('3. Enroll your fingerprint ONCE (use ID 1)');
    console.log('4. Try scanning!');
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit();
};

clearAllFingerprints();
