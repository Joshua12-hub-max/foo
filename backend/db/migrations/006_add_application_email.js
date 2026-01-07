import db from '../connection.js';

const up = async () => {
  try {
    await db.query("ALTER TABLE recruitment_jobs ADD COLUMN application_email VARCHAR(255) NULL AFTER status");
    console.log("Migration 006 applied: Added application_email to recruitment_jobs");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("Column already exists, skipping...");
        process.exit(0);
    }
    console.error("Migration 006 failed:", error);
    process.exit(1);
  }
};

up();
