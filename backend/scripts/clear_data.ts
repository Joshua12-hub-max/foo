import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Clears all test data from the database.
 * PRESERVES: bio_attendance_logs, bio_enrolled_users, attendance_logs
 * These 3 tables represent real biometric data from C# middleware that should NOT be wiped.
 */
async function clearTestData() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: Number(process.env.DB_PORT) || 3306,
            database: process.env.DB_NAME || 'chrmo_db',
        });

        // Tables to PRESERVE (biometric + synced data)
        const preserveTables = [
            'bio_attendance_logs',
            'bio_enrolled_users',
            'attendance_logs',
        ];

        // Get all tables in the database
        const [tables] = await connection.query('SHOW TABLES') as any[];
        const allTables = tables.map((row: any) => Object.values(row)[0] as string);

        // Tables to clear (everything except preserved ones)
        const tablesToClear = allTables.filter(
            (t: string) => !preserveTables.includes(t)
        );

        console.log('=== Clearing Test Data ===');
        console.log(`Total tables: ${allTables.length}`);
        console.log(`Preserving: ${preserveTables.join(', ')}`);
        console.log(`Clearing: ${tablesToClear.length} tables\n`);

        // Disable foreign key checks for clean truncation
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tablesToClear) {
            try {
                const [countResult] = await connection.query(`SELECT COUNT(*) as cnt FROM \`${table}\``) as any[];
                const count = countResult[0].cnt;
                
                if (count > 0) {
                    await connection.query(`TRUNCATE TABLE \`${table}\``);
                    console.log(`  CLEARED: ${table} (${count} rows removed)`);
                } else {
                    console.log(`  SKIP: ${table} (already empty)`);
                }
            } catch (err: any) {
                console.error(`  FAIL: ${table} - ${err.message}`);
            }
        }

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // Verify preserved tables
        console.log('\n=== Preserved Tables ===');
        for (const table of preserveTables) {
            try {
                const [countResult] = await connection.query(`SELECT COUNT(*) as cnt FROM \`${table}\``) as any[];
                console.log(`  ${table}: ${countResult[0].cnt} rows (preserved)`);
            } catch (err: any) {
                console.log(`  ${table}: table does not exist`);
            }
        }

        await connection.end();
        console.log('\n✅ Test data cleared! Biometric data preserved.');
    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

clearTestData();
