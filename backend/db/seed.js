/**
 * =============================================================================
 * DATABASE SEEDER - NEBR Application
 * =============================================================================
 * 
 * Purpose: Creates default admin account after database initialization/reset
 * 
 * Usage:
 *   npm run seed              - Create default admin account
 *   npm run seed:reset        - Drop and recreate admin account (for testing)
 * 
 * Configuration:
 *   Set these environment variables in .env to customize admin credentials:
 *   - SEED_ADMIN_EMAIL        (default: admin@nebr.com)
 *   - SEED_ADMIN_PASSWORD     (default: Admin@123)
 *   - SEED_ADMIN_FIRST_NAME   (default: System)
 *   - SEED_ADMIN_LAST_NAME    (default: Administrator)
 *   - SEED_ADMIN_EMPLOYEE_ID  (default: ADMIN-001)
 *   - SEED_ADMIN_DEPARTMENT   (default: IT)
 * 
 * =============================================================================
 */

import db from './connection.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  admin: {
    employee_id: process.env.SEED_ADMIN_EMPLOYEE_ID || 'ADMIN-001',
    first_name: process.env.SEED_ADMIN_FIRST_NAME || 'System',
    last_name: process.env.SEED_ADMIN_LAST_NAME || 'Administrator',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@nebr.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    department: process.env.SEED_ADMIN_DEPARTMENT || 'IT',
    is_verified: true
  },
  bcrypt: {
    saltRounds: 10
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Logs a formatted message to console
 * @param {string} type - Message type: 'info', 'success', 'error', 'warn'
 * @param {string} message - Message to log
 */
const log = (type, message) => {
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warn: '⚠️ ',
    seed: '🌱'
  };
  console.log(`${icons[type] || '  '} ${message}`);
};

/**
 * Logs a separator line
 */
const logSeparator = () => {
  console.log('   ─────────────────────────────────────────────────');
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
const validatePassword = (password) => {
  if (password.length < 8) {
    return false;
  }
  // Check for at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Checks if admin account already exists
 * @param {string} email - Admin email
 * @param {string} employeeId - Admin employee ID
 * @returns {Promise<object|null>} Existing admin or null
 */
const checkExistingAdmin = async (email, employeeId) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, employee_id, role FROM authentication WHERE email = ? OR employee_id = ?',
      [email, employeeId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Creates admin account in database
 * @param {object} adminData - Admin account data
 * @param {string} hashedPassword - Bcrypt hashed password
 * @returns {Promise<number>} Inserted admin ID
 */
const createAdminAccount = async (adminData, hashedPassword) => {
  try {
    const [result] = await db.query(
      `INSERT INTO authentication 
       (employee_id, first_name, last_name, email, password_hash, role, department, is_verified, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        adminData.employee_id,
        adminData.first_name,
        adminData.last_name,
        adminData.email,
        hashedPassword,
        adminData.role,
        adminData.department,
        adminData.is_verified
      ]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Admin account already exists with this email or employee ID');
    }
    throw new Error(`Failed to create admin account: ${error.message}`);
  }
};

/**
 * Deletes existing admin account (for reset mode)
 * @param {string} email - Admin email to delete
 * @returns {Promise<boolean>} True if deleted
 */
const deleteAdminAccount = async (email) => {
  try {
    const [result] = await db.query(
      'DELETE FROM authentication WHERE email = ?',
      [email]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Failed to delete admin account: ${error.message}`);
  }
};

// =============================================================================
// MAIN SEEDER FUNCTION
// =============================================================================

/**
 * Main seeder function - creates default admin account
 * @param {boolean} forceReset - If true, deletes existing admin first
 */
const seedAdmin = async (forceReset = false) => {
  console.log('');
  log('seed', 'NEBR Database Seeder');
  logSeparator();
  console.log('');

  try {
    // Validate configuration
    if (!validateEmail(CONFIG.admin.email)) {
      throw new Error(`Invalid email format: ${CONFIG.admin.email}`);
    }

    if (!validatePassword(CONFIG.admin.password)) {
      log('warn', 'Password does not meet strength requirements!');
      log('warn', 'Recommended: 8+ chars, uppercase, lowercase, and number');
      console.log('');
    }

    // Force reset mode
    if (forceReset) {
      log('info', 'Reset mode enabled - removing existing admin...');
      const deleted = await deleteAdminAccount(CONFIG.admin.email);
      if (deleted) {
        log('success', 'Existing admin account removed');
      } else {
        log('info', 'No existing admin account found');
      }
      console.log('');
    }

    // Check for existing admin
    const existingAdmin = await checkExistingAdmin(
      CONFIG.admin.email,
      CONFIG.admin.employee_id
    );

    if (existingAdmin && !forceReset) {
      log('info', 'Admin account already exists:');
      console.log('');
      console.log(`   ID:          ${existingAdmin.id}`);
      console.log(`   Email:       ${existingAdmin.email}`);
      console.log(`   Employee ID: ${existingAdmin.employee_id}`);
      console.log(`   Role:        ${existingAdmin.role}`);
      console.log('');
      log('info', 'Skipping creation. Use "npm run seed:reset" to recreate.');
      console.log('');
      process.exit(0);
    }

    // Hash password
    log('info', 'Hashing password...');
    const salt = await bcrypt.genSalt(CONFIG.bcrypt.saltRounds);
    const hashedPassword = await bcrypt.hash(CONFIG.admin.password, salt);

    // Create admin account
    log('info', 'Creating admin account...');
    const adminId = await createAdminAccount(CONFIG.admin, hashedPassword);

    // Success output
    console.log('');
    log('success', 'Admin account created successfully!');
    console.log('');
    logSeparator();
    console.log('   📋 ADMIN CREDENTIALS');
    logSeparator();
    console.log('');
    console.log(`   ID:          ${adminId}`);
    console.log(`   Email:       ${CONFIG.admin.email}`);
    console.log(`   Password:    ${CONFIG.admin.password}`);
    console.log(`   Employee ID: ${CONFIG.admin.employee_id}`);
    console.log(`   Role:        ${CONFIG.admin.role}`);
    console.log(`   Department:  ${CONFIG.admin.department}`);
    console.log('');
    logSeparator();
    console.log('');
    log('warn', 'SECURITY: Change default credentials in production!');
    log('info', 'Set SEED_ADMIN_* environment variables in .env');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.log('');
    log('error', `Seeder failed: ${error.message}`);
    console.log('');
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
};

// =============================================================================
// SCRIPT EXECUTION
// =============================================================================

// Check for reset flag
const isResetMode = process.argv.includes('--reset') || process.argv.includes('-r');

// Run seeder
seedAdmin(isResetMode);
