/**
 * Migration 014: Service Records & DTR-Leave Integration
 * 
 * Creates:
 * - service_records table for career history tracking
 * - Adds salary_deduction column to lwop_summary
 * 
 * Purpose:
 * - Track leaves and LWOP for Service Record (retirement calculation)
 * - Support DTR override when leave is approved
 */

import db from '../connection.ts';

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Service Records & DTR Integration Migration...');

  try {
    // 1. Create service_records table for career history
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        event_type ENUM(
          'Appointment',
          'Promotion', 
          'Leave',
          'LWOP',
          'Return from Leave',
          'Transfer',
          'Suspension',
          'Resignation',
          'Retirement',
          'Other'
        ) NOT NULL,
        event_date DATE NOT NULL,
        end_date DATE,
        leave_type VARCHAR(50),
        days_count DECIMAL(5,1),
        is_with_pay BOOLEAN DEFAULT TRUE,
        remarks TEXT,
        reference_id INT,
        reference_type VARCHAR(50),
        processed_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        INDEX idx_event_type (event_type),
        INDEX idx_event_date (event_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created service_records table');

    // 2. Add salary_deduction column to lwop_summary if not exists
    try {
      await db.query(`
        ALTER TABLE lwop_summary 
        ADD COLUMN salary_deduction DECIMAL(12,2) DEFAULT 0 AFTER total_lwop_days
      `);
      console.log('✅ Added salary_deduction column to lwop_summary');
    } catch (alterError: any) {
      if (alterError.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ salary_deduction column already exists in lwop_summary');
      } else {
        throw alterError;
      }
    }

    // 3. Create tardiness_summary table for monthly tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS tardiness_summary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        year INT NOT NULL,
        month INT NOT NULL,
        total_late_minutes INT DEFAULT 0,
        total_undertime_minutes INT DEFAULT 0,
        total_minutes INT GENERATED ALWAYS AS (total_late_minutes + total_undertime_minutes) STORED,
        days_equivalent DECIMAL(5,3) GENERATED ALWAYS AS ((total_late_minutes + total_undertime_minutes) / 480) STORED,
        deducted_from_vl DECIMAL(5,3) DEFAULT 0,
        charged_as_lwop DECIMAL(5,3) DEFAULT 0,
        processed_at TIMESTAMP NULL,
        processed_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_tardiness (employee_id, year, month),
        INDEX idx_employee (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created tardiness_summary table');

    // 4. Add leave_override column to daily_time_record if needed
    try {
      // Check if status column has 'On Leave' option
      const [columns] = await db.query(`
        SHOW COLUMNS FROM daily_time_record WHERE Field = 'status'
      `) as any;
      
      if (columns.length > 0) {
        const statusType = columns[0].Type;
        if (!statusType.includes('On Leave')) {
          // Modify enum to include 'On Leave' and 'LWOP'
          await db.query(`
            ALTER TABLE daily_time_record 
            MODIFY COLUMN status ENUM('Present', 'Absent', 'Late', 'On Leave', 'LWOP', 'Holiday', 'Rest Day', 'Undertime') DEFAULT 'Absent'
          `);
          console.log('✅ Updated daily_time_record status enum to include On Leave and LWOP');
        } else {
          console.log('ℹ️ daily_time_record status already includes On Leave');
        }
      }
    } catch (enumError: any) {
      console.log('ℹ️ Could not update daily_time_record enum:', enumError.message);
    }

    // 5. Add leave_application_id reference to daily_time_record
    try {
      await db.query(`
        ALTER TABLE daily_time_record 
        ADD COLUMN leave_application_id INT NULL AFTER status,
        ADD COLUMN leave_type VARCHAR(50) NULL AFTER leave_application_id
      `);
      console.log('✅ Added leave reference columns to daily_time_record');
    } catch (columnError: any) {
      if (columnError.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Leave reference columns already exist in daily_time_record');
      } else {
        console.log('ℹ️ Could not add leave columns:', columnError.message);
      }
    }

    console.log('🎉 Service Records & DTR Integration Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
migration()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });

export default migration;
