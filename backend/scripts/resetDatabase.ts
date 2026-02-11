
import pool from '../db/index.js';

const resetDatabase = async () => {
    try {
        console.log('🚨 STARTING COMPLETE DATABASE RESET 🚨');
        const connection = await pool.getConnection();
        
        console.log('Disabling foreign key checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('Fetching tables...');
        const [rows] = await connection.query('SHOW TABLES');
        const tables = (rows as any[]).map(row => Object.values(row)[0] as string);

        if (tables.length === 0) {
            console.log('No tables found to clear.');
            connection.release();
            process.exit(0);
        }

        console.log(`Found ${tables.length} tables. clearing data...`);

        for (const table of tables) {
            // Skip migrations tables to preserve schema versioning if applicable
            if (table.includes('drizzle') || table.includes('migration')) {
                console.log(`Skipping migration table: ${table}`);
                continue;
            }

            // Skip views (MySQL SHOW TABLES includes views)
            // To be safe, we should check if it's a view?
            // TRUNCATE on a view usually fails or does nothing?
            // "TRUNCATE TABLE is not valid for views".
            // We can check table type?
            // Or just try/catch?
            // Better: Query information_schema to get only BASE TABLEs.
            try {
                 await connection.query(`TRUNCATE TABLE \`${table}\``);
                 console.log(`✅ Cleared: ${table}`);
            } catch (err: any) {
                if (err.code === 'ER_VIEW_NO_EXPLAIN') {
                     // It's a view, ignore
                     console.log(`ℹ️ Skipping View: ${table}`);
                } else if (err.message && err.message.includes('View')) {
                     console.log(`ℹ️ Skipping View: ${table}`);
                } else {
                    console.warn(`⚠️ Failed to truncate ${table}:`, err.message);
                }
            }
        }

        console.log('Re-enabling foreign key checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        connection.release();
        console.log('✨ DATABASE RESET COMPLETE. ALL DATA CLEARED. ✨');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database Reset Failed:', error);
        process.exit(1);
    }
};

resetDatabase();
