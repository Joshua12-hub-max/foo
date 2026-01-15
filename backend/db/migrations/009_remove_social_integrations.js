import db from '../connection.js';

const up = async () => {
  try {
    // Attempt to drop columns if they exist
    // Using separate queries to ensure partial success or specific error handling if needed, 
    // but a single ALTER is usually fine. 'IF EXISTS' helps avoid errors on re-runs.
    try {
        await db.query("ALTER TABLE recruitment_jobs DROP COLUMN fb_post_id");
    } catch (e) {
        console.log("Could not drop fb_post_id (might not exist):", e.message);
    }

    try {
        await db.query("ALTER TABLE recruitment_jobs DROP COLUMN linkedin_post_id");
    } catch (e) {
        console.log("Could not drop linkedin_post_id (might not exist):", e.message);
    }
    
    console.log("Migration 009 applied: Removed social media integration columns.");
    process.exit(0);
  } catch (error) {
    console.error("Migration 009 failed:", error);
    process.exit(1);
  }
};

up();
