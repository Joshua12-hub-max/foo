import db from '../db/connection.js';
import { RowDataPacket } from 'mysql2/promise';

const DEFAULT_CREDITS = [
  { type: 'Vacation Leave', balance: 15 },
  { type: 'Sick Leave', balance: 15 },
  { type: 'Special Privilege Leave', balance: 3 },
];

interface EmployeeRow extends RowDataPacket {
  employee_id: string;
  first_name: string;
  last_name: string;
}

interface CreditRow extends RowDataPacket {
  balance: number;
}

async function populateCredits() {
  try {
    console.log('🔄 Starting credit population...');

    // 1. Fetch all existing employees
    const [employees] = await db.query<EmployeeRow[]>('SELECT employee_id, first_name, last_name FROM authentication');
    console.log(`Found ${employees.length} employees.`);

    for (const emp of employees) {
      console.log(`Processing ${emp.first_name} ${emp.last_name} (${emp.employee_id})...`);
      
      for (const credit of DEFAULT_CREDITS) {
        // Check if exists
        const [existing] = await db.query<CreditRow[]>(
          'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
          [emp.employee_id, credit.type]
        );

        if (existing.length === 0) {
          await db.query(
            'INSERT INTO leave_credits (employee_id, credit_type, balance) VALUES (?, ?, ?)',
            [emp.employee_id, credit.type, credit.balance]
          );
          console.log(`  + Added ${credit.balance} ${credit.type}`);
        } else {
            // Optional: Reset balance if needed, but for now we just skip
             console.log(`  . Has ${credit.type} (${existing[0].balance})`);
        }
      }
    }

    console.log('✅ Credit population complete.');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateCredits();
