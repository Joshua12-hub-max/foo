import { db } from '../db/index.js';
import { departments, plantillaPositions } from '../db/schema.js';
import { _eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const DEPARTMENTS = [
  { name: 'City Human Resource Management Office', desc: 'Responsible for human resource management and development.' },
  { name: 'City Budget Office', desc: 'Responsible for the preparation and execution of the city budget.' },
  { name: 'City Treasury Office', desc: 'Responsible for the collection and management of city funds.' },
  { name: 'City Accounting Office', desc: 'Responsible for the accounting and internal audit of city funds.' },
  { name: 'City Engineering Office', desc: 'Responsible for infrastructure and public works.' },
  { name: 'City Health Office', desc: 'Responsible for public health services.' },
  { name: 'Office of the City Mayor', desc: 'The executive office of the city government.' },
  { name: 'City Legal Office', desc: 'Responsible for legal services and representation.' },
  { name: 'City Planning and Development Office', desc: 'Responsible for urban planning and development.' },
  { name: 'City Social Welfare and Development Office', desc: 'Responsible for social welfare services.' }
];

const CHRMO_POSITIONS = [
  { title: "City Government Department Head I", sg: 26, item: "CHRMO-001" },
  { title: "Assistant Department Head", sg: 24, item: "CHRMO-002" },
  { title: "Administrative Officer V (HRMO III)", sg: 18, item: "CHRMO-003" },
  { title: "Administrative Officer IV (HRMO II)", sg: 15, item: "CHRMO-004" },
  { title: "Senior Administrative Assistant II", sg: 14, item: "CHRMO-005" },
  { title: "Senior Administrative Assistant I", sg: 13, item: "CHRMO-006" },
  { title: "Administrative Assistant II (HRMA)", sg: 8, item: "CHRMO-007" },
  { title: "Administrative Aide IV", sg: 4, item: "CHRMO-008" }
];

async function seedSystem() {
  console.log('--- Full System Seeding (Departments & Positions) ---');
  
  try {
    // 1. Clear existing departments/positions safely
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    await db.execute(sql`TRUNCATE TABLE departments`);
    await db.execute(sql`TRUNCATE TABLE plantilla_positions`);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

    console.log('Tables truncated.');

    // 2. Seed Departments
    for (const dept of DEPARTMENTS) {
      const [result] = await db.insert(departments).values({
        name: dept.name,
        description: dept.desc
      });
      const deptId = result.insertId;
      console.log(`Created: ${dept.name} (ID: ${deptId})`);

      // 3. For CHRMO, seed detailed positions
      if (dept.name === 'City Human Resource Management Office') {
        for (const pos of CHRMO_POSITIONS) {
          await db.insert(plantillaPositions).values({
            itemNumber: pos.item,
            positionTitle: pos.title,
            salaryGrade: pos.sg,
            departmentId: deptId,
            department: dept.name,
            isVacant: true
          });
        }
        console.log(`Seeded ${CHRMO_POSITIONS.length} positions for CHRMO.`);
      } else {
        // For other depts, just seed a Department Head position for initialization
        // Generate a better unique item number
        const shortName = dept.name
            .replace('City ', '')
            .replace('Office', '')
            .replace('and ', '')
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase();
            
        await db.insert(plantillaPositions).values({
          itemNumber: `${shortName}-HEAD-001`,
          positionTitle: `${dept.name} Head`,
          salaryGrade: 26,
          departmentId: deptId,
          department: dept.name,
          isVacant: true
        });
      }
    }

    console.log('System seeding completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedSystem();
