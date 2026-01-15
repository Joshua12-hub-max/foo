import db from '../db/connection';

const runMigration = async () => {
  try {
    console.log("Adding new application fields to recruitment_applicants table...");
    
    const [columns] = await db.query("SHOW COLUMNS FROM recruitment_applicants");
    const columnNames = columns.map(c => c.Field);

    const fields = [
        { name: 'address', type: 'TEXT' },
        { name: 'education', type: 'TEXT' },
        { name: 'experience', type: 'TEXT' },
        { name: 'skills', type: 'TEXT' }
    ];

    for (const field of fields) {
        if (!columnNames.includes(field.name)) {
            await db.query(`ALTER TABLE recruitment_applicants ADD COLUMN ${field.name} ${field.type} NULL`);
            console.log(`Added ${field.name} column.`);
        } else {
            console.log(`Column ${field.name} already exists.`);
        }
    }

    // Make resume_path nullable if it isn't already (MySQL doesn't easily show nullable in simple SHOW COLUMNS without parsing, 
    // but MODIFY COLUMN is safe to run to ensure it is nullable)
    await db.query("ALTER TABLE recruitment_applicants MODIFY COLUMN resume_path VARCHAR(255) NULL");
    console.log("Ensured resume_path is nullable.");

    console.log("Migration completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

runMigration();
