/**
 * Script to create a test admin user for debugging login issues
 * Run with: npx ts-node --esm scripts/create_test_admin.ts
 */

import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

async function createTestAdmin() {
  try {
    const email = 'admin@test.com';
    const password = 'Admin123!';
    const employeeId = 'ADMIN-001';

    // Check if admin already exists
    const [existing] = await db.query(
      'SELECT * FROM authentication WHERE email = ? OR employee_id = ?',
      [email, employeeId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', email);
      console.log('🆔 Employee ID:', employeeId);
      console.log('🔑 Password:', password);
      
      // Update password in case it was changed
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await db.query(
        'UPDATE authentication SET password_hash = ?, is_verified = TRUE WHERE email = ?',
        [hashedPassword, email]
      );
      
      console.log('✅ Password reset and account verified!');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert admin user (verified)
    await db.query(
      `INSERT INTO authentication 
       (first_name, last_name, email, role, department, employee_id, password_hash, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      ['Test', 'Admin', email, 'admin', 'IT Department', employeeId, hashedPassword]
    );

    console.log('✅ Test Admin Created Successfully!');
    console.log('=====================================');
    console.log('📧 Email:', email);
    console.log('🆔 Employee ID:', employeeId);
    console.log('🔑 Password:', password);
    console.log('=====================================');
    console.log('You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createTestAdmin();
