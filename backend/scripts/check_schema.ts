import db from '../db/connection.js';

const checkSchema = async () => {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM authentication LIKE 'employment_status'");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkSchema();
