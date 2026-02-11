import { Pool } from 'mysql2/promise';

export const up = async (connection: Pool): Promise<void> => {
  try {
    // Check if column exists first to avoid errors
    const [columns] = await connection.query<any[]>(`
      SHOW COLUMNS FROM authentication LIKE 'employment_type'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE authentication 
        ADD COLUMN employment_type VARCHAR(50) DEFAULT 'Probationary' AFTER employment_status
      `);
      console.log('Added employment_type column to authentication table');
    } else {
      console.log('employment_type column already exists');
    }

  } catch (error) {
    console.error('Migration failed: 027_add_employment_type_to_auth', error);
    throw error;
  }
};

export const down = async (connection: Pool): Promise<void> => {
  try {
    const [columns] = await connection.query<any[]>(`
      SHOW COLUMNS FROM authentication LIKE 'employment_type'
    `);

    if (columns.length > 0) {
      await connection.query(`
        ALTER TABLE authentication 
        DROP COLUMN employment_type
      `);
      console.log('Removed employment_type column from authentication table');
    }
  } catch (error) {
    console.error('Migration rollback failed: 027_add_employment_type_to_auth', error);
    throw error;
  }
};
