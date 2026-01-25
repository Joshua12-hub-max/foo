import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL', message: string) {
  results.push({ test, status, message });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
}

async function testDatabase() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 DATABASE SCHEMA VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // Test 1: Check if compliance tables exist
    console.log('📋 Checking Compliance Tables...\n');

    const complianceTables = [
      'qualification_standards',
      'nepotism_relationships',
      'step_increment_tracker',
      'budget_allocation',
      'position_publications'
    ];

    for (const tableName of complianceTables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = (rows as any)[0].count;
        logTest(
          `Table: ${tableName}`,
          'PASS',
          `Exists with ${count} record(s)`
        );
      } catch (error) {
        logTest(`Table: ${tableName}`, 'FAIL', 'Table does not exist');
      }
    }

    // Test 2: Check plantilla_positions compliance fields
    console.log('\n📋 Checking plantilla_positions Compliance Fields...\n');

    const plantillaFields = [
      'ordinance_number',
      'ordinance_date',
      'abolishment_ordinance',
      'abolishment_date',
      'qualification_standards_id',
      'budget_source',
      'is_coterminous',
      'status'
    ];

    try {
      const [columns] = await connection.query('DESCRIBE plantilla_positions');
      const columnNames = (columns as any[]).map(col => col.Field);

      for (const field of plantillaFields) {
        if (columnNames.includes(field)) {
          logTest(`Field: plantilla_positions.${field}`, 'PASS', 'Field exists');
        } else {
          logTest(`Field: plantilla_positions.${field}`, 'FAIL', 'Field missing');
        }
      }
    } catch (error) {
      logTest('plantilla_positions fields', 'FAIL', 'Could not check fields');
    }

    // Test 3: Check authentication eligibility fields
    console.log('\n📋 Checking authentication Eligibility Fields...\n');

    const authFields = [
      'eligibility_type',
      'eligibility_number',
      'eligibility_date',
      'highest_education',
      'years_of_experience'
    ];

    try {
      const [columns] = await connection.query('DESCRIBE authentication');
      const columnNames = (columns as any[]).map(col => col.Field);

      for (const field of authFields) {
        if (columnNames.includes(field)) {
          logTest(`Field: authentication.${field}`, 'PASS', 'Field exists');
        } else {
          logTest(`Field: authentication.${field}`, 'FAIL', 'Field missing');
        }
      }
    } catch (error) {
      logTest('authentication fields', 'FAIL', 'Could not check fields');
    }

    // Test 4: Check seeded Qualification Standards
    console.log('\n📋 Checking Seeded Qualification Standards...\n');

    try {
      const [standards] = await connection.query(
        'SELECT position_title, salary_grade FROM qualification_standards ORDER BY salary_grade DESC'
      );
      
      if ((standards as any[]).length > 0) {
        logTest(
          'Seeded QS Data',
          'PASS',
          `Found ${(standards as any[]).length} qualification standards`
        );
        
        console.log('\n   Seeded Positions:');
        (standards as any[]).forEach((qs: any) => {
          console.log(`   - ${qs.position_title} (SG ${qs.salary_grade})`);
        });
      } else {
        logTest('Seeded QS Data', 'FAIL', 'No qualification standards found');
      }
    } catch (error) {
      logTest('Seeded QS Data', 'FAIL', 'Could not retrieve data');
    }

    // Test 5: Check foreign key constraints
    console.log('\n📋 Checking Foreign Key Constraints...\n');

    try {
      const [constraints] = await connection.query(`
        SELECT 
          CONSTRAINT_NAME,
          TABLE_NAME,
          REFERENCED_TABLE_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
          AND REFERENCED_TABLE_NAME IS NOT NULL
          AND TABLE_NAME IN ('qualification_standards', 'nepotism_relationships', 'step_increment_tracker', 'plantilla_positions')
      `, [process.env.DB_NAME]);

      if ((constraints as any[]).length > 0) {
        logTest(
          'Foreign Key Constraints',
          'PASS',
          `Found ${(constraints as any[]).length} constraint(s)`
        );
        
        console.log('\n   Constraints:');
        (constraints as any[]).forEach((c: any) => {
          console.log(`   - ${c.TABLE_NAME} → ${c.REFERENCED_TABLE_NAME}`);
        });
      } else {
        logTest('Foreign Key Constraints', 'FAIL', 'No constraints found');
      }
    } catch (error) {
      logTest('Foreign Key Constraints', 'FAIL', 'Could not check constraints');
    }

    // Test 6: Check salary_schedule table
    console.log('\n📋 Checking Salary Schedule...\n');

    try {
      const [salaries] = await connection.query(
        'SELECT COUNT(DISTINCT salary_grade) as grades, COUNT(DISTINCT step) as steps FROM salary_schedule'
      );
      
      const data = (salaries as any[])[0];
      logTest(
        'Salary Schedule',
        'PASS',
        `${data.grades} salary grades, ${data.steps} steps`
      );
    } catch (error) {
      logTest('Salary Schedule', 'FAIL', 'Table missing or empty');
    }

  } catch (error: any) {
    console.error('Database test failed:', error.message);
  } finally {
    await connection.end();
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`✅ PASSED: ${passed}`);
  console.log(`❌ FAILED: ${failed}`);
  console.log(`📝 TOTAL:  ${results.length}\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.test}: ${r.message}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

testDatabase().catch(error => {
  console.error('Test crashed:', error);
  process.exit(1);
});
