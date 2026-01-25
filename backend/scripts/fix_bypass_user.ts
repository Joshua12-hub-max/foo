
import db from './db_connection.ts';
import bcrypt from 'bcryptjs';

const emailToUpdate = 'capstone682@gmail.com';
const newPassword = '12345';
const dummyFingerprintId = 999; // Arbitrary ID for bypass

const run = async () => {
  try {
    console.log(`Starting update for ${emailToUpdate}...`);

    // 1. Get user details
    const [users] = await db.query<any[]>('SELECT id, employee_id FROM authentication WHERE email = ?', [emailToUpdate]);
    
    if (users.length === 0) {
      console.error(`User with email ${emailToUpdate} not found.`);
      process.exit(1);
    }
    
    // Handle potential duplicates (keep the first one, delete others if necessary, or just warn)
    // For this script, we'll assume we work with the first match, but let's warn if there are multiple
    if (users.length > 1) {
        console.warn(`WARNING: Multiple users found with email ${emailToUpdate}. Updating the first one found (ID: ${users[0].id}).`);
    }

    const user = users[0];
    console.log(`User found: ID ${user.id}, EmployeeID ${user.employee_id}`);

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update password, verify account, and disable 2FA
    await db.query('UPDATE authentication SET password_hash = ?, is_verified = TRUE, two_factor_enabled = FALSE WHERE id = ?', [hashedPassword, user.id]);
    console.log('Password updated, Account Verified, and 2FA Disabled.');

    // 4. Insert dummy fingerprint for bypass
    // Check if fingerprint already exists
    const [fingerprints] = await db.query<any[]>('SELECT * FROM fingerprints WHERE employee_id = ?', [user.employee_id]);
    
    if (fingerprints.length > 0) {
        console.log('User is already enrolled in biometrics (fingerprint found). Login should work.');
    } else {
        // Check if dummy ID is taken
         const [existingDummy] = await db.query<any[]>('SELECT * FROM fingerprints WHERE fingerprint_id = ?', [dummyFingerprintId]);
         let finalFingerprintId = dummyFingerprintId;

         if (existingDummy.length > 0) {
             // If 999 is taken by another user, find detailed next free one? Or just use it if it's the SAME user.
             // If taken by another user, we need another ID.
             if (existingDummy[0].employee_id !== user.employee_id) {
                 console.log(`Fingerprint ID ${dummyFingerprintId} is taken. Generating random ID...`);
                 finalFingerprintId = Math.floor(Math.random() * 100) + 200; // 200-300 range to avoid conflicts
             }
         }

        await db.query('INSERT INTO fingerprints (fingerprint_id, employee_id) VALUES (?, ?)', [finalFingerprintId, user.employee_id]);
        console.log(`Dummy fingerprint record inserted (ID: ${finalFingerprintId}). Biometric check bypassed.`);
    }

    console.log('DONE: Password reset and biometrics bypassed.');
    process.exit(0);

  } catch (error) {
    console.error('Error during update:', error);
    process.exit(1);
  }
};

run();
