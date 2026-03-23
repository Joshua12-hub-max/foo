
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [columns]: Record<string, never> = await connection.query('DESCRIBE authentication');
    console.log('Columns in authentication:', columns.map((c: Record<string, never>) => c.Field).join(', '));
    
    const [tables]: Record<string, never> = await connection.query('SHOW TABLES');
    console.log('Tables:', tables.map((t: Record<string, never>) => Object.values(t)[0]).join(', '));
  } finally {
    await connection.end();
  }
}

check().catch(console.error);
