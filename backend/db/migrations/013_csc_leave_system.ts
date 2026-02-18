import db from '../index.js';
import type {  } from 'mysql2/promise';

/**
 * Migration: CSC-Compliant Leave System
 * 
 * Creates the following tables:
 * 1. leave_balances - Current credit balances per employee (denormalized for fast queries)
 * 2. leave_ledger - Transaction history for audit trail
 * 3. leave_applications - Leave requests with CSC-compliant workflow
 * 4. leave_monetization_requests - Credit monetization requests
 * 5. holidays - Holiday calendar for working day calculation
 * 6. lwop_summary - LWOP tracking for Service Record impact
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting CSC Leave System Migration...');

  try {
    // 1. Leave Balances (Current credits - denormalized for fast queries)
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        credit_type ENUM(
          'Vacation Leave', 
          'Sick Leave', 
          'Special Privilege Leave', 
          'Forced Leave', 
          'Maternity Leave', 
          'Paternity Leave', 
          'Solo Parent Leave', 
          'Study Leave'
        ) NOT NULL,
        balance DECIMAL(10,3) NOT NULL DEFAULT 0,
        year INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_balance (employee_id, credit_type, year),
        INDEX idx_employee (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created leave_balances table');

    // 2. Leave Ledger (Transaction history for audit trail)
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_ledger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        credit_type ENUM(
          'Vacation Leave', 
          'Sick Leave', 
          'Special Privilege Leave', 
          'Forced Leave', 
          'Maternity Leave', 
          'Paternity Leave', 
          'Solo Parent Leave', 
          'Study Leave'
        ) NOT NULL,
        transaction_type ENUM(
          'ACCRUAL', 
          'DEDUCTION', 
          'ADJUSTMENT', 
          'MONETIZATION', 
          'FORFEITURE', 
          'UNDERTIME_DEDUCTION', 
          'TARDINESS_DEDUCTION'
        ) NOT NULL,
        amount DECIMAL(10,3) NOT NULL,
        balance_after DECIMAL(10,3) NOT NULL,
        reference_id INT NULL,
        reference_type ENUM('leave_application', 'monetization', 'dtr', 'manual') NULL,
        remarks TEXT,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee_credit (employee_id, credit_type),
        INDEX idx_created (created_at),
        INDEX idx_reference (reference_id, reference_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created leave_ledger table');

    // 3. Leave Applications (Replaces old leave_requests)
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        leave_type ENUM(
          'Vacation Leave', 
          'Sick Leave', 
          'Special Privilege Leave', 
          'Forced Leave', 
          'Maternity Leave', 
          'Paternity Leave', 
          'Solo Parent Leave', 
          'Study Leave', 
          'Special Emergency Leave', 
          'Official Business', 
          'VAWC Leave', 
          'Rehabilitation Leave', 
          'Special Leave Benefits for Women', 
          'Wellness Leave'
        ) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        working_days DECIMAL(10,3) NOT NULL,
        is_with_pay BOOLEAN NOT NULL DEFAULT TRUE,
        actual_payment_status ENUM('WITH_PAY', 'WITHOUT_PAY', 'PARTIAL') NOT NULL DEFAULT 'WITH_PAY',
        days_with_pay DECIMAL(10,3) DEFAULT 0,
        days_without_pay DECIMAL(10,3) DEFAULT 0,
        cross_charged_from VARCHAR(50) NULL,
        reason TEXT NOT NULL,
        medical_certificate_path VARCHAR(255) NULL,
        status ENUM('Pending', 'Processing', 'Finalizing', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
        attachment_path VARCHAR(255),
        admin_form_path VARCHAR(255),
        final_attachment_path VARCHAR(255),
        rejection_reason TEXT,
        approved_by VARCHAR(50),
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee_status (employee_id, status),
        INDEX idx_dates (start_date, end_date),
        INDEX idx_leave_type (leave_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created leave_applications table');

    // 4. Leave Monetization Requests
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_monetization_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        credit_type ENUM('Vacation Leave', 'Sick Leave') NOT NULL,
        requested_days DECIMAL(10,3) NOT NULL,
        daily_rate DECIMAL(12,2) NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        purpose ENUM('Health', 'Medical', 'Financial Emergency') NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        approved_by VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created leave_monetization_requests table');

    // 5. Holidays Calendar
    await db.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        type ENUM('Regular', 'Special Non-Working', 'Special Working') NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_holiday (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created holidays table');

    // 6. LWOP Summary (for Service Record impact)
    await db.query(`
      CREATE TABLE IF NOT EXISTS lwop_summary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        year INT NOT NULL,
        total_lwop_days DECIMAL(10,3) DEFAULT 0,
        cumulative_lwop_days DECIMAL(10,3) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_lwop (employee_id, year),
        INDEX idx_employee (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created lwop_summary table');

    // Insert default Philippine Regular Holidays for 2026
    const holidays2026 = [
      { name: "New Year's Day", date: '2026-01-01', type: 'Regular' },
      { name: 'Maundy Thursday', date: '2026-04-02', type: 'Regular' },
      { name: 'Good Friday', date: '2026-04-03', type: 'Regular' },
      { name: 'Black Saturday', date: '2026-04-04', type: 'Special Non-Working' },
      { name: 'Araw ng Kagitingan', date: '2026-04-09', type: 'Regular' },
      { name: 'Labor Day', date: '2026-05-01', type: 'Regular' },
      { name: 'Independence Day', date: '2026-06-12', type: 'Regular' },
      { name: 'National Heroes Day', date: '2026-08-31', type: 'Regular' },
      { name: 'Bonifacio Day', date: '2026-11-30', type: 'Regular' },
      { name: 'Christmas Day', date: '2026-12-25', type: 'Regular' },
      { name: 'Rizal Day', date: '2026-12-30', type: 'Regular' },
      { name: "New Year's Eve", date: '2026-12-31', type: 'Special Non-Working' },
    ];

    for (const holiday of holidays2026) {
      try {
        await db.query(
          `INSERT IGNORE INTO holidays (name, date, type, year) VALUES (?, ?, ?, ?)`,
          [holiday.name, holiday.date, holiday.type, 2026]
        );
      } catch (err) {
        // Ignore duplicate key errors
      }
    }
    console.log('✅ Inserted 2026 Philippine holidays');

    console.log('\n🎉 CSC Leave System Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
migration()
  .then(() => {
    console.log('\n✅ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

export default migration;
