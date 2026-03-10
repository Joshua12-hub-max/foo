
const mysql = require('mysql2/promise');

async function checkData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'chrmo_db'
    });

    try {
        console.log("--- SCANNING FOR JUDITH ---");
        const [users] = await connection.execute("SELECT id, employee_id, first_name, last_name, email, department_id, department, role, duty_type, appointment_type, is_verified, employment_status FROM authentication WHERE first_name LIKE '%Judith%';");
        console.table(users);

        if (users.length > 0) {
            const deptId = users[0].department_id;
            console.log(`--- SCANNING DEPARTMENT MEMBERS (Dept ID: ${deptId}) ---`);
            const [members] = await connection.execute("SELECT id, first_name, last_name, employment_status FROM authentication WHERE department_id = ?;", [deptId]);
            console.table(members);
        }

        console.log("--- SCANNING DEPARTMENTS ---");
        const [depts] = await connection.execute("SELECT id, name FROM departments;");
        console.table(depts);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkData();
