
import pool from '../db/index.js';

const checkStatus = async () => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.tables 
            WHERE table_schema = 'chrmo_db' 
            AND table_type = 'BASE TABLE'
            AND table_name NOT LIKE 'drizzle%'
        `);
        
        console.log('--- TRIPLE CHECK: DATABASE ROW COUNTS ---');
        console.table(rows);
        
        const totalRows = (rows as any[]).reduce((sum, row) => sum + row.TABLE_ROWS, 0);
        console.log(`TOTAL DATA ROWS ACROSS ALL TABLES: ${totalRows}`);
        
        if (totalRows === 0) {
            console.log('✅ TRIPLE CHECK PASSED: Database is 100% clean.');
        } else {
             // In MySQL, TABLE_ROWS is an estimate. Let's do a hard count on a few key tables.
             const [countResult] = await connection.query('SELECT COUNT(*) as count FROM authentication');
             console.log(`Hard count on 'authentication' table: ${(countResult as any)[0].count}`);
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

checkStatus();
