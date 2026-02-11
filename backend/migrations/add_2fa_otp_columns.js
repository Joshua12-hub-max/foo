import db from '../db/index.js';

const runMigration = async () => {
  try {
    console.log("Adding 2FA columns to authentication table...");
    
    // Check if columns exist first to avoid errors
    const [columns] = await db.query("SHOW COLUMNS FROM authentication");
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('two_factor_enabled')) {
        await db.query("ALTER TABLE authentication ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE");
        console.log("Added two_factor_enabled column.");
    } else {
        console.log("Column two_factor_enabled already exists.");
    }

    if (!columnNames.includes('two_factor_otp')) {
        await db.query("ALTER TABLE authentication ADD COLUMN two_factor_otp VARCHAR(6) NULL");
        console.log("Added two_factor_otp column.");
    } else {
        console.log("Column two_factor_otp already exists.");
    }

    if (!columnNames.includes('two_factor_otp_expires')) {
        await db.query("ALTER TABLE authentication ADD COLUMN two_factor_otp_expires DATETIME NULL");
        console.log("Added two_factor_otp_expires column.");
    } else {
        console.log("Column two_factor_otp_expires already exists.");
    }

    console.log("Migration completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

runMigration();
