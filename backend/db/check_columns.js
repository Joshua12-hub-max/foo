import db from './connection.js';

const checkColumns = async () => {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM recruitment_applicants");
        console.log('Columns:', rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkColumns();
