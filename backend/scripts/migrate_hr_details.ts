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

  console.log('Fetching HR data from authentication table...');

  // 1. Get all employees with their HR data
  const [employees]: Record<string, never> = await connection.execute('SELECT * FROM authentication');

  console.log(`Found ${employees.length} records. Migrating...`);

  for (const emp of employees) {
    try {
      // Check if already exists in pds_hr_details
      const [existing]: Record<string, never> = await connection.execute(
        'SELECT id FROM pds_hr_details WHERE employee_id = ?',
        [emp.id]
      );

      // If exists, we delete and re-insert to ensure all fields (including new ones) are updated
      if (existing.length > 0) {
        await connection.execute('DELETE FROM pds_hr_details WHERE employee_id = ?', [emp.id]);
      }

      await connection.execute(`
        INSERT INTO pds_hr_details (
          employee_id, employment_status, employment_type, appointment_type,
          job_title, position_title, item_number, station, office_address,
          salary_grade, step_increment, salary_basis, date_hired,
          contract_end_date, regularization_date, first_day_of_service,
          original_appointment_date, last_promotion_date, duty_type,
          daily_target_hours, start_time, end_time, is_regular,
          is_old_employee, is_meycauayan, profile_status, religion,
          barangay, facebook_url, linkedin_url, twitter_handle,
          department_id, position_id, manager_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        emp.id,
        emp.employment_status || 'Active',
        emp.employment_type || 'Probationary',
        emp.appointment_type || null,
        emp.job_title || null,
        emp.position_title || null,
        emp.item_number || null,
        emp.station || null,
        emp.office_address || null,
        emp.salary_grade || null,
        emp.step_increment || 1,
        emp.salary_basis || 'Daily',
        emp.date_hired || null,
        emp.contract_end_date || null,
        emp.regularization_date || null,
        emp.first_day_of_service || null,
        emp.original_appointment_date || null,
        emp.last_promotion_date || null,
        emp.duty_type || 'Standard',
        emp.daily_target_hours || '8.00',
        emp.start_time || null,
        emp.end_time || null,
        emp.is_regular ? 1 : 0,
        emp.is_old_employee ? 1 : 0,
        emp.is_meycauayan ? 1 : 0,
        emp.profile_status || 'Initial',
        emp.religion || null,
        emp.barangay || null,
        emp.facebook_url || null,
        emp.linkedin_url || null,
        emp.twitter_handle || null,
        emp.department_id || null,
        emp.position_id || null,
        emp.manager_id || null
      ]);

      console.log(`Migrated employee ${emp.id}: ${emp.first_name} ${emp.last_name}`);
    } catch (e) {
      console.error(`Failed to migrate employee ${emp.id}:`, err.message);
    }
  }

  console.log('Migration complete.');
  await connection.end();
}

main().catch(console.error);
