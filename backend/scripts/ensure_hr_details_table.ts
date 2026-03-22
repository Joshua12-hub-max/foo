import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Ensuring pds_hr_details table exists...');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pds_hr_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      employment_status ENUM('Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause') DEFAULT 'Active',
      employment_type VARCHAR(50) DEFAULT 'Probationary',
      appointment_type ENUM('Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS'),
      job_title VARCHAR(100),
      position_title VARCHAR(100),
      item_number VARCHAR(50),
      station VARCHAR(100),
      office_address TEXT,
      salary_grade VARCHAR(10),
      step_increment INT DEFAULT 1,
      salary_basis ENUM('Daily','Hourly') DEFAULT 'Daily',
      date_hired DATE,
      contract_end_date DATE,
      regularization_date DATE,
      first_day_of_service DATE,
      original_appointment_date DATE,
      last_promotion_date DATE,
      duty_type ENUM('Standard', 'Irregular') DEFAULT 'Standard',
      daily_target_hours DECIMAL(4, 2) DEFAULT 8.00,
      start_time VARCHAR(50),
      end_time VARCHAR(50),
      is_regular BOOLEAN DEFAULT FALSE,
      is_old_employee BOOLEAN DEFAULT FALSE,
      is_meycauayan BOOLEAN DEFAULT FALSE,
      profile_status ENUM('Initial', 'Complete') DEFAULT 'Initial',
      religion VARCHAR(100),
      barangay VARCHAR(100),
      facebook_url VARCHAR(255),
      linkedin_url VARCHAR(255),
      twitter_handle VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_hr_employee FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE,
      INDEX idx_hr_employee_id (employee_id)
    )
  `);

  console.log('Table pds_hr_details verified.');
  await connection.end();
}

main().catch(console.error);
