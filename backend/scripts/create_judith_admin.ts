/**
 * Script to create Judith Guevarra as Admin with full biometric enrollment
 */

import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface ExistingUser extends RowDataPacket {
  id: number;
  employee_id: string;
}

interface FingerprintRow extends RowDataPacket {
  fingerprint_id: number;
}

async function createJudithAdmin() {
  try {
    const firstName = 'Judith';
    const lastName = 'Guevarra';
    const email = 'judith.guevarra@nebr.gov';
    const password = 'Judith@2026';
    const employeeId = 'ADMIN-JUDITH-001';
    const department = 'Human Resources';
    const role = 'admin';

    console.log('🔄 Creating Judith Guevarra Admin Account...');

    // Check if admin already exists
    const [existing] = await db.query<ExistingUser[]>(
      'SELECT id, employee_id FROM authentication WHERE email = ? OR employee_id = ?',
      [email, employeeId]
    );

    let userId: number;

    if (existing.length > 0) {
      console.log('⚠️  User already exists, updating credentials...');
      userId = existing[0].id;

      // Update password and ensure verified
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await db.query(
        `UPDATE authentication SET 
         password_hash = ?, 
         is_verified = TRUE, 
         role = ?,
         employment_status = 'Active'
         WHERE id = ?`,
        [hashedPassword, role, userId]
      );
      
      console.log('✅ Credentials updated!');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert admin user (verified)
      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO authentication 
         (first_name, last_name, email, role, department, employee_id, password_hash, is_verified, employment_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, 'Active')`,
        [firstName, lastName, email, role, department, employeeId, hashedPassword]
      );

      userId = result.insertId;
      console.log('✅ Authentication record created!');
    }

    // Check/Create biometric enrollment
    const [existingFingerprint] = await db.query<FingerprintRow[]>(
      'SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?',
      [employeeId]
    );

    if (existingFingerprint.length > 0) {
      console.log('✅ Biometric already enrolled!');
    } else {
      // Create fingerprint enrollment record
      // fingerprint_id is typically assigned by the Arduino sensor (1-127)
      await db.query(
        'INSERT INTO fingerprints (fingerprint_id, employee_id) VALUES (?, ?)',
        [100, employeeId]
      );
      console.log('✅ Biometric enrollment created!');
    }

    console.log('\n=====================================');
    console.log('🎉 JUDITH GUEVARRA - ADMIN ACCOUNT READY');
    console.log('=====================================');
    console.log('👤 Name:', `${firstName} ${lastName}`);
    console.log('📧 Email:', email);
    console.log('🆔 Employee ID:', employeeId);
    console.log('🔑 Password:', password);
    console.log('🏢 Department:', department);
    console.log('👑 Role:', role);
    console.log('✅ Email Verified: YES');
    console.log('✅ Biometric Enrolled: YES');
    console.log('=====================================');
    console.log('You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createJudithAdmin();
