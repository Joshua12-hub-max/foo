import db from '../db/connection.ts';

const updateSchema = async () => {
  try {
    console.log('Checking columns in authentication table...');
    
    // Check if columns exist
    const [columns] = await db.query<any[]>('SHOW COLUMNS FROM authentication');
    const columnNames = columns.map(c => c.Field);
    
    const queries = [];
    
    if (!columnNames.includes('contract_end_date')) {
      queries.push("ADD COLUMN contract_end_date DATE NULL AFTER date_hired");
    }
    
    if (!columnNames.includes('regularization_date')) {
      queries.push("ADD COLUMN regularization_date DATE NULL AFTER contract_end_date");
    }
    
    if (!columnNames.includes('is_regular')) {
      queries.push("ADD COLUMN is_regular BOOLEAN DEFAULT FALSE AFTER regularization_date");
    }
    
    if (queries.length > 0) {
      console.log('Adding missing columns...');
      const query = `ALTER TABLE authentication ${queries.join(', ')}`;
      await db.query(query);
      console.log('Database schema updated successfully.');
    } else {
      console.log('All columns already exist.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
};

updateSchema();
