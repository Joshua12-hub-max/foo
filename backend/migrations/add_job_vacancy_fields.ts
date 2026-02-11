import db from '../db/index.js';
import { RowDataPacket } from 'mysql2/promise';

interface ColumnRow extends RowDataPacket {
  Field: string;
}

const runMigration = async () => {
  try {
    console.log("Adding new job vacancy fields to recruitment_jobs table...");
    
    const [columns] = await db.query<ColumnRow[]>("SHOW COLUMNS FROM recruitment_jobs");
    const columnNames = columns.map(c => c.Field);

    const fields = [
        { name: 'education', type: 'TEXT' },
        { name: 'experience', type: 'TEXT' },
        { name: 'training', type: 'TEXT' },
        { name: 'eligibility', type: 'TEXT' },
        { name: 'other_qualifications', type: 'TEXT' },
        { name: 'office_name', type: 'VARCHAR(255)' },
        { name: 'submission_address', type: 'TEXT' },
        { name: 'submission_email', type: 'VARCHAR(255)' }
    ];

    for (const field of fields) {
        if (!columnNames.includes(field.name)) {
            await db.query(`ALTER TABLE recruitment_jobs ADD COLUMN ${field.name} ${field.type} NULL`);
            console.log(`Added ${field.name} column.`);
        } else {
            console.log(`Column ${field.name} already exists.`);
        }
    }

    console.log("Migration completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

runMigration();
