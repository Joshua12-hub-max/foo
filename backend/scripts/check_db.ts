import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function seedDepartments() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: Number(process.env.DB_PORT) || 3306,
            database: process.env.DB_NAME || 'chrmo_db',
        });

        // Set test departments for enrolled users (simulating C# program)
        await connection.query("UPDATE bio_enrolled_users SET department='CHRMO' WHERE employee_id=1");
        await connection.query("UPDATE bio_enrolled_users SET department='Engineering' WHERE employee_id=2");
        await connection.query("UPDATE bio_enrolled_users SET department='Accounting' WHERE employee_id=3");
        
        const [rows] = await connection.query('SELECT employee_id, full_name, department, user_status FROM bio_enrolled_users');
        console.log('Updated bio_enrolled_users:');
        console.log(JSON.stringify(rows, null, 2));
        
        await connection.end();
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}

seedDepartments();
