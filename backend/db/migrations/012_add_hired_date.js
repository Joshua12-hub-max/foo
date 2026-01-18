import db from '../connection.js';

export async function up() {
  try {
    await db.query(`
      ALTER TABLE recruitment_applicants 
      ADD COLUMN hired_date DATETIME DEFAULT NULL
    `);
    console.log('✅ Added hired_date column to recruitment_applicants');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⏩ hired_date column already exists, skipping');
    } else {
      throw error;
    }
  }
}

export async function down() {
  try {
    await db.query(`
      ALTER TABLE recruitment_applicants 
      DROP COLUMN hired_date
    `);
    console.log('✅ Removed hired_date column from recruitment_applicants');
  } catch (error) {
    console.error('Error removing hired_date column:', error);
    throw error;
  }
}
