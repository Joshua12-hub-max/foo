import db from './connection.js';

const checkUsers = async () => {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM users");
        console.log('Columns:', rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkUsers();
