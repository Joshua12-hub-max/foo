import db from '../connection.js';

const up = async () => {
  try {
    await db.query("ALTER TABLE recruitment_jobs ADD COLUMN linkedin_post_id VARCHAR(255) NULL AFTER fb_post_id");
    console.log("Migration 008 applied: Added linkedin_post_id to recruitment_jobs");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("Column already exists, skipping...");
        process.exit(0);
    }
    console.error("Migration 008 failed:", error);
    process.exit(1);
  }
};

up();
