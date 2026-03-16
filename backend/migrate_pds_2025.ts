
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Starting PDS 2025 Revised Fields Migration...');
    
    try {
        // Add missing fields to authentication table
        await db.execute(sql`
            ALTER TABLE authentication 
            ADD COLUMN IF NOT EXISTS mother_maiden_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS is_indigenous BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS indigenous_group VARCHAR(255),
            ADD COLUMN IF NOT EXISTS is_pwd BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS pwd_id_no VARCHAR(100),
            ADD COLUMN IF NOT EXISTS is_solo_parent BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS solo_parent_id_no VARCHAR(100),
            ADD COLUMN IF NOT EXISTS pds_questions JSON
        `);
        
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
