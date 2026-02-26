
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Creating address_ref_barangays table...');
    
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS address_ref_barangays (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            zip_code VARCHAR(10) NOT NULL,
            UNIQUE KEY unique_barangay_name (name)
        )
    `);

    console.log('Table created successfully.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Creation failed:', err);
    process.exit(1);
});
