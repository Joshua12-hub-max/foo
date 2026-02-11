import { Pool } from 'mysql2/promise';

export const up = async (connection: Pool): Promise<void> => {
  try {
    const fields = [
      { name: 'eligibility_type', definition: 'VARCHAR(100) NULL' },
      { name: 'eligibility_number', definition: 'VARCHAR(50) NULL' },
      { name: 'eligibility_date', definition: 'DATE NULL' },
      { name: 'highest_education', definition: 'VARCHAR(100) NULL' },
      { name: 'years_of_experience', definition: 'INT DEFAULT 0' }
    ];

    for (const field of fields) {
      const [columns] = await connection.query<any[]>(`
        SHOW COLUMNS FROM authentication LIKE '${field.name}'
      `);

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE authentication 
          ADD COLUMN ${field.name} ${field.definition}
        `);
        console.log(`Added ${field.name} to authentication table`);
      } else {
        console.log(`${field.name} already exists`);
      }
    }

  } catch (error) {
    console.error('Migration failed: 028_add_eligibility_fields_to_auth', error);
    throw error;
  }
};

export const down = async (connection: Pool): Promise<void> => {
  try {
    const fields = [
      'eligibility_type',
      'eligibility_number',
      'eligibility_date',
      'highest_education',
      'years_of_experience'
    ];

    for (const field of fields) {
      const [columns] = await connection.query<any[]>(`
        SHOW COLUMNS FROM authentication LIKE '${field}'
      `);

      if (columns.length > 0) {
        await connection.query(`
          ALTER TABLE authentication 
          DROP COLUMN ${field}
        `);
        console.log(`Removed ${field} from authentication table`);
      }
    }
  } catch (error) {
    console.error('Migration rollback failed: 028_add_eligibility_fields_to_auth', error);
    throw error;
  }
};
