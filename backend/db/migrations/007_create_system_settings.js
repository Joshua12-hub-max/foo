import db from '../connection.js';

const up = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Migration 007 applied: Created system_settings table");
    process.exit(0);
  } catch (error) {
    console.error("Migration 007 failed:", error);
    process.exit(1);
  }
};

up();
