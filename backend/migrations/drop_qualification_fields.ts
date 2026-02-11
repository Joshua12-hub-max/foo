import db from '../db/index.js';
import { RowDataPacket } from 'mysql2/promise';

interface ColumnRow extends RowDataPacket {
  Field: string;
}

const runMigration = async () => {
  try {
    console.log("Dropping qualification fields from recruitment_jobs table...");
    
    // Check if columns exist before dropping to avoid errors
    const [columns] = await db.query<ColumnRow[]>("SHOW COLUMNS FROM recruitment_jobs");
    const existingColumns = columns.map(c => c.Field);
    
    const columnsToDrop = [
        'education', 
        'experience', 
        'training', 
        'eligibility', 
        'other_qualifications', 
        'office_name', 
        'submission_address', 
        'submission_email'
    ];

    const fieldsToDrop = columnsToDrop.filter(col => existingColumns.includes(col));

    if (fieldsToDrop.length > 0) {
        const dropQuery = fieldsToDrop.map(col => `DROP COLUMN ${col}`).join(', ');
        await db.query(`ALTER TABLE recruitment_jobs ${dropQuery}`);
        console.log(`Dropped columns: ${fieldsToDrop.join(', ')}`);
    } else {
        console.log("No columns to drop.");
    }

    console.log("Migration completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

runMigration();
