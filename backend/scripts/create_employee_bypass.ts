import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

const createEmployee = async () => {
  const email = 'capstone682@gmail.com';
  const password = 'qwertyuiop123';
  const firstName = 'Capstone';
  const lastName = 'Employee';
  const employeeId = 'EMP-CAPSTONE-001';
  const department = 'IT'; // Default department

  try {
    console.log(`Preparing to create/update employee: ${email}`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user exists
    const [existingUsers] = await db.query(
      'SELECT id FROM authentication WHERE email = ?',
      [email]
    );

    let userId;

    if ((existingUsers as any[]).length > 0) {
      console.log('User already exists. Updating credentials...');
      userId = (existingUsers as any[])[0].id;
      
      await db.query(
        'UPDATE authentication SET password_hash = ?, role = ?, is_verified = TRUE WHERE id = ?',
        [hashedPassword, 'employee', userId]
      );
    } else {
      console.log('Creating new user...');
      const [result] = await db.query(
        'INSERT INTO authentication (first_name, last_name, email, password_hash, role, employee_id, department, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
        [firstName, lastName, email, hashedPassword, 'employee', employeeId, department]
      );
      userId = (result as any).insertId;
    }

    console.log(`User ID: ${userId}`);

    // Check for existing fingerprint
    const [fingerprints] = await db.query(
      'SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?',
      [employeeId] // Use employee_id for fingerprint check based on controller logic
    );

    if ((fingerprints as any[]).length === 0) {
      console.log('Adding dummy biometric record to bypass login check...');
      // Using a high ID to avoid conflict with real fingerprints (1-127)
      // Note: Controller checks for *existence*, not specific ID range for login, 
      // but device might have limits. We'll use 200 just to be safe in DB.
      await db.query(
        'INSERT INTO fingerprints (fingerprint_id, employee_id) VALUES (?, ?)',
        [200, employeeId]
      );
      console.log('Dummy fingerprint added.');
    } else {
      console.log('Fingerprint record already exists.');
    }

    console.log('------------------------------------------------');
    console.log('Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('------------------------------------------------');
    console.log('SUCCESS: Account is ready for login.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating employee:', error);
    process.exit(1);
  }
};

createEmployee();
