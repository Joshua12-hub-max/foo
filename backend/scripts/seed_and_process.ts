import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function seedAndProcess() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: Number(process.env.DB_PORT) || 3306,
            database: process.env.DB_NAME || 'chrmo_db',
        });

        // ============================================================
        // 1. SEED DEPARTMENTS
        // ============================================================
        console.log('=== Seeding Departments ===');
        
        const departments = [
            { name: 'City Human Resources Management Office', code: 'CHRMO', description: 'Human Resources and Personnel Management' },
            { name: 'Engineering Office', code: 'Engineering', description: 'Infrastructure and Engineering Services' },
            { name: 'Accounting Office', code: 'Accounting', description: 'Financial Management and Accounting' },
            { name: 'Budget Office', code: 'Budget', description: 'Budget Planning and Allocation' },
            { name: 'Treasurer Office', code: 'Treasurer', description: 'Revenue Collection and Disbursement' },
            { name: 'City Planning Office', code: 'Planning', description: 'Urban Planning and Development' },
        ];

        for (const dept of departments) {
            try {
                await connection.query(
                    'INSERT INTO departments (name, code, description) VALUES (?, ?, ?)',
                    [dept.name, dept.code, dept.description]
                );
                console.log(`  ADDED: ${dept.name} (${dept.code})`);
            } catch (err: any) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`  EXISTS: ${dept.name}`);
                } else {
                    console.error(`  FAIL: ${dept.name} - ${err.message}`);
                }
            }
        }

        // ============================================================
        // 2. PROCESS DTR FROM EXISTING ATTENDANCE LOGS
        // ============================================================
        console.log('\n=== Processing DTR from Attendance Logs ===');

        // Get unique employee+date combos from attendance_logs
        const [attLogs] = await connection.query(`
            SELECT DISTINCT employee_id, DATE(scan_time) as log_date
            FROM attendance_logs
            ORDER BY log_date, employee_id
        `) as any[];

        console.log(`  Found ${attLogs.length} employee-date combos to process`);

        for (const row of attLogs) {
            const empId = row.employee_id;
            const dateStr = row.log_date;
            const formattedDate = new Date(dateStr).toISOString().split('T')[0];

            // Get first IN and last OUT for this employee on this date
            const [inOut] = await connection.query(`
                SELECT 
                    MIN(CASE WHEN type = 'IN' THEN scan_time END) as time_in,
                    MAX(CASE WHEN type = 'OUT' THEN scan_time END) as time_out
                FROM attendance_logs
                WHERE employee_id = ? AND DATE(scan_time) = ?
            `, [empId, formattedDate]) as any[];

            const timeIn = inOut[0]?.time_in || null;
            const timeOut = inOut[0]?.time_out || null;

            // Calculate late minutes (assume 8 AM standard start)
            let lateMinutes = 0;
            if (timeIn) {
                const inDate = new Date(timeIn);
                const scheduleStart = new Date(inDate);
                scheduleStart.setHours(8, 0, 0, 0);
                const diffMs = inDate.getTime() - scheduleStart.getTime();
                lateMinutes = Math.max(0, Math.floor(diffMs / 60000));
            }

            // Calculate undertime (assume 5 PM standard end)
            let undertimeMinutes = 0;
            if (timeOut) {
                const outDate = new Date(timeOut);
                const scheduleEnd = new Date(outDate);
                scheduleEnd.setHours(17, 0, 0, 0);
                const diffMs = scheduleEnd.getTime() - outDate.getTime();
                undertimeMinutes = Math.max(0, Math.floor(diffMs / 60000));
            }

            const status = timeIn ? (lateMinutes > 0 ? 'Late' : 'Present') : 'Absent';

            // Check if DTR record already exists
            const [existing] = await connection.query(
                'SELECT id FROM daily_time_records WHERE employee_id = ? AND date = ?',
                [empId, formattedDate]
            ) as any[];

            if (existing.length === 0) {
                await connection.query(`
                    INSERT INTO daily_time_records (employee_id, date, time_in, time_out, late_minutes, undertime_minutes, overtime_minutes, status)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                `, [empId, formattedDate, timeIn, timeOut, lateMinutes, undertimeMinutes, status]);
                console.log(`  DTR CREATED: ${empId} on ${formattedDate} → ${status} (late: ${lateMinutes}min)`);
            } else {
                console.log(`  DTR EXISTS: ${empId} on ${formattedDate}`);
            }
        }

        // ============================================================
        // 3. VERIFY
        // ============================================================
        console.log('\n=== Verification ===');
        const [deptCount] = await connection.query('SELECT COUNT(*) as cnt FROM departments') as any[];
        const [dtrCount] = await connection.query('SELECT COUNT(*) as cnt FROM daily_time_records') as any[];
        console.log(`  Departments: ${deptCount[0].cnt}`);
        console.log(`  DTR Records: ${dtrCount[0].cnt}`);

        await connection.end();
        console.log('\n✅ Done!');
    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

seedAndProcess();
