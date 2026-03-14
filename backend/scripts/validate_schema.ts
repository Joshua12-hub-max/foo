import pool from '../db/index.js';
import { recruitmentApplicants } from '../db/tables/recruitment.js';
import { getTableColumns } from 'drizzle-orm';
import { RowDataPacket } from 'mysql2';

interface ColumnInfo extends RowDataPacket {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

async function checkSchema() {
  try {
    const [cols] = await pool.query<ColumnInfo[]>('SHOW COLUMNS FROM recruitment_applicants');
    const dbCols: string[] = cols.map((c: ColumnInfo) => c.Field).sort();
    
    const schemaCols = getTableColumns(recruitmentApplicants);
    const schemaDbNames: string[] = Object.values(schemaCols).map((c) => (c as any).name as string).sort();
    
    console.log('--- DB Columns ---');
    console.log(dbCols.join(', '));
    
    console.log('\n--- Schema DB Names ---');
    console.log(schemaDbNames.join(', '));
    
    console.log('\n--- Mismatches ---');
    const missingInDb = schemaDbNames.filter((name: string) => !dbCols.includes(name));
    const extraInDb = dbCols.filter((name: string) => !schemaDbNames.includes(name));
    
    console.log('Missing in DB:', missingInDb);
    console.log('Extra in DB:', extraInDb);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
