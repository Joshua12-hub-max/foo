import db from './connection.js';

const checkTables = async () => {
    try {
        const [rows] = await db.query("SHOW TABLES");
        console.log('Tables:', rows.map(r => Object.values(r)[0]));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkTables();
