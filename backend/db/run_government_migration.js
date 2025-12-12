import db from './connection.js';

const columnsToAdd = [
    // Personal Information
    { name: 'birth_date', definition: 'DATE DEFAULT NULL' },
    { name: 'gender', definition: "ENUM('Male', 'Female') DEFAULT NULL" },
    { name: 'civil_status', definition: "ENUM('Single', 'Married', 'Widowed', 'Separated', 'Annulled') DEFAULT NULL" },
    { name: 'nationality', definition: "VARCHAR(50) DEFAULT 'Filipino'" },
    { name: 'blood_type', definition: 'VARCHAR(5) DEFAULT NULL' },
    { name: 'height_cm', definition: 'DECIMAL(5,2) DEFAULT NULL' },
    { name: 'weight_kg', definition: 'DECIMAL(5,2) DEFAULT NULL' },
    
    // Contact Information
    { name: 'phone_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'address', definition: 'TEXT DEFAULT NULL' },
    { name: 'permanent_address', definition: 'TEXT DEFAULT NULL' },
    { name: 'emergency_contact', definition: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'emergency_contact_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    
    // Government IDs
    { name: 'sss_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'philhealth_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'pagibig_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'tin_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'gsis_number', definition: 'VARCHAR(20) DEFAULT NULL' },
    
    // Employment Details (Government-specific)
    { name: 'salary_grade', definition: 'VARCHAR(10) DEFAULT NULL' },
    { name: 'step_increment', definition: 'INT DEFAULT 1' },
    { name: 'appointment_type', definition: "ENUM('Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary') DEFAULT NULL" },
    { name: 'office_address', definition: 'TEXT DEFAULT NULL' },
    { name: 'station', definition: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'position_title', definition: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'item_number', definition: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'first_day_of_service', definition: 'DATE DEFAULT NULL' },
    { name: 'supervisor', definition: 'VARCHAR(100) DEFAULT NULL' }
];

async function columnExists(columnName) {
    try {
        const [rows] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'authentication' 
             AND COLUMN_NAME = ?`,
            [columnName]
        );
        return rows.length > 0;
    } catch (error) {
        return false;
    }
}

async function runMigration() {
    try {
        console.log('Starting Government Fields Migration...\n');
        
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const col of columnsToAdd) {
            const exists = await columnExists(col.name);
            
            if (exists) {
                console.log(`  → Skipped (exists): ${col.name}`);
                skippedCount++;
            } else {
                try {
                    await db.query(`ALTER TABLE authentication ADD COLUMN ${col.name} ${col.definition}`);
                    console.log(`  ✓ Added: ${col.name}`);
                    addedCount++;
                } catch (err) {
                    console.log(`  ✗ Error adding ${col.name}: ${err.message}`);
                }
            }
        }
        
        console.log(`\n✓ Migration complete!`);
        console.log(`  ${addedCount} columns added`);
        console.log(`  ${skippedCount} columns skipped (already exist)`);
        
        // Verify key government columns
        const [columns] = await db.query('DESCRIBE authentication');
        const govFields = ['sss_number', 'philhealth_number', 'pagibig_number', 'tin_number', 'gsis_number', 
                          'salary_grade', 'birth_date', 'civil_status', 'appointment_type'];
        const existingGov = columns.filter(c => govFields.includes(c.Field));
        console.log(`\n  Government fields verified: ${existingGov.length}/${govFields.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
