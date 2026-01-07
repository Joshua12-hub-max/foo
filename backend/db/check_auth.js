import db from './connection.js';

const checkAuth = async () => {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM authentication");
        console.log('Columns:', rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkAuth();
