import db from '../db/index.js';
import { RowDataPacket } from 'mysql2/promise';

interface ColumnRow extends RowDataPacket {
  Field: string;
}

const runMigration = async () => {
  try {
    console.log("Adding attachment_path to recruitment_jobs table...");
    
    const [columns] = await db.query<ColumnRow[]>("SHOW COLUMNS FROM recruitment_jobs");
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('attachment_path')) {
        await db.query(`ALTER TABLE recruitment_jobs ADD COLUMN attachment_path VARCHAR(255) NULL`);
        console.log(`Added attachment_path column.`);
    } else {
        console.log(`Column attachment_path already exists.`);
    }

    console.log("Migration completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

runMigration();
