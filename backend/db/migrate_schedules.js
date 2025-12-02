import db from './connection.js';

const migrateSchedules = async () => {
  try {
    console.log('Starting migration for schedules table...');

    // Add new columns if they don't exist
    // schedule_title, start_date, end_date, repeat_pattern
    
    const columns = [
      "ADD COLUMN schedule_title VARCHAR(255) DEFAULT 'Regular Schedule' AFTER employee_id",
      "ADD COLUMN start_date DATE NULL AFTER schedule_title",
      "ADD COLUMN end_date DATE NULL AFTER start_date",
      "ADD COLUMN repeat_pattern VARCHAR(50) DEFAULT 'Weekly' AFTER end_time"
    ];

    for (const colSql of columns) {
      try {
        await db.query(`ALTER TABLE schedules ${colSql}`);
        console.log(`Executed: ${colSql}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists (skipped): ${colSql}`);
        } else {
          console.error(`Error executing ${colSql}:`, err);
        }
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateSchedules();
