import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function createTable() {
    console.log('[AUTO] Creating accrual_rules table manually...');
    
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS accrual_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                days_present DECIMAL(10, 3) NOT NULL,
                earned_credits DECIMAL(10, 3) NOT NULL,
                rule_type VARCHAR(50) DEFAULT 'CSC_STANDARD',
                UNIQUE KEY unique_rule (days_present, rule_type)
            )
        `);
        console.log('[AUTO] accrual_rules table created/verified.');

        // Also add unique constraints to authentication table if missing
        const constraints = [
            'umid_no', 'philhealth_no', 'pagibig_no', 'tin_no', 'gsis_no', 'philsys_id'
        ];

        for (const field of constraints) {
            try {
                await db.execute(sql.raw(`ALTER TABLE authentication ADD UNIQUE INDEX ${field}_unique (${field})`));
                console.log(`[AUTO] Added unique index for ${field}`);
            } catch (e) {
                console.log(`[AUTO] Index for ${field} already exists or failed:`, (e as Error).message);
            }
        }

    } catch (error) {
        console.error('[AUTO] Error creating table:', error);
    } finally {
        process.exit(0);
    }
}

createTable();
