import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function clearUserData() {
  const tablesToTruncate = [
    'authentication',
    'attendance_logs',
    'bio_attendance_logs',
    'bio_enrolled_users',
    'chat_conversations',
    'chat_messages',
    'daily_time_records',
    'dtr_corrections',
    'employee_custom_fields',
    'employee_directory',
    'employee_documents',
    'employee_education',
    'employee_emergency_contacts',
    'employee_employment_history',
    'employee_memos',
    'employee_notes',
    'employee_skills',
    'google_calendar_tokens',
    'leave_applications',
    'leave_balances',
    'leave_credits',
    'leave_ledger',
    'leave_monetization_requests',
    'leave_requests',
    'lwop_summary',
    'notifications',
    'pds_answers',
    'pds_education',
    'pds_eligibility',
    'pds_family',
    'pds_learning_development',
    'pds_other_info',
    'pds_references',
    'pds_voluntary_work',
    'pds_work_experience',
    'performance_audit_log',
    'performance_goals',
    'performance_improvement_plans',
    'performance_reviews',
    'performance_review_items',
    'plantilla_audit_log',
    'plantilla_position_history',
    'policy_violations',
    'schedules',
    'service_records',
    'social_connections',
    'step_increment_tracker',
    'synced_events',
    'tardiness_summary',
    'fingerprints',
    'recruitment_applicants',
    'nepotism_relationships',
    'announcements',
    'events'
  ];

  try {
    console.log('Starting data cleanup...');
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    for (const table of tablesToTruncate) {
      console.log(`Truncating table: ${table}`);
      await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
    }

    console.log('Resetting plantilla_positions incumbents...');
    await db.execute(sql`
      UPDATE plantilla_positions 
      SET incumbent_id = NULL, 
          is_vacant = 1, 
          filled_date = NULL, 
          vacated_date = NULL
    `);

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('Data cleanup completed successfully.');
    console.log('Departments and Plantilla Positions structural data preserved.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

clearUserData();
