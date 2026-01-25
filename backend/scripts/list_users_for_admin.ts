import type { RowDataPacket } from 'mysql2';
// or mysql2/promise depending on how project is set up, connection.ts usually uses mysql2/promise
import db from '../db/connection.js';

const listUsers = async () => {
  try {
    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id, first_name, last_name, email, role, employee_id FROM authentication'
    );
    console.log('Users found:', users.length);
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
};

listUsers();
