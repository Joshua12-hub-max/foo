import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkPlantillaSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // Check all plantilla-related tables
    const [tables] = await connection.query(`SHOW TABLES LIKE 'plantilla%'`);
    console.log('📋 Plantilla-related tables:');
    console.log(tables);
    console.log('\n');

    // Check salary_schedule table
    const [salaryTables] = await connection.query(`SHOW TABLES LIKE 'salary%'`);
    console.log('💰 Salary-related tables:');
    console.log(salaryTables);
    console.log('\n');

    // If plantilla_positions exists, show its schema
    try {
      const [positionsSchema] = await connection.query('DESCRIBE plantilla_positions');
      console.log('🏢 plantilla_positions schema:');
      console.log(positionsSchema);
      console.log('\n');
    } catch (error) {
      console.log('⚠️ plantilla_positions table does not exist\n');
    }

    // If plantilla_audit_log exists, show its schema
    try {
      const [auditSchema] = await connection.query('DESCRIBE plantilla_audit_log');
      console.log('📝 plantilla_audit_log schema:');
      console.log(auditSchema);
      console.log('\n');
    } catch (error) {
      console.log('⚠️ plantilla_audit_log table does not exist\n');
    }

    // If plantilla_position_history exists, show its schema
    try {
      const [historySchema] = await connection.query('DESCRIBE plantilla_position_history');
      console.log('📜 plantilla_position_history schema:');
      console.log(historySchema);
      console.log('\n');
    } catch (error) {
      console.log('⚠️ plantilla_position_history table does not exist\n');
    }

    // If salary_schedule exists, show its schema
    try {
      const [salarySchema] = await connection.query('DESCRIBE salary_schedule');
      console.log('💵 salary_schedule schema:');
      console.log(salarySchema);
      console.log('\n');
    } catch (error) {
      console.log('⚠️ salary_schedule table does not exist\n');
    }

    // Check authentication table for plantilla-related fields
    try {
      const [authSchema] = await connection.query('DESCRIBE authentication');
      console.log('👤 authentication table schema (for reference):');
      console.log(authSchema);
    } catch (error) {
      console.log('⚠️ authentication table does not exist\n');
    }

  } catch (error) {
    console.error('❌ Error fetching schema:', error);
  } finally {
    await connection.end();
  }
}

checkPlantillaSchema();
