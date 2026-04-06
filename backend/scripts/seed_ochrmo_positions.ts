import { db } from '../db/index.js';
import { departments, plantillaPositions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function seedOchrmoPositions() {
  console.log('--- STARTING OCHRMO ORGANIZATIONAL SEEDING ---');

  try {
    await db.transaction(async (tx) => {
      // 1. Create Parent Department: OCHRMO
      const [parentResult] = await tx.insert(departments).values({
        name: 'OFFICE OF THE CITY HUMAN RESOURCE MANAGEMENT OFFICER',
        description: 'CHRM Officer handles all human resource management activities for the City Government.',
      });
      const parentId = parentResult.insertId;

      // 2. Create Divisions (Child Departments)
      const divisionsData = [
        { name: 'Administrative Support Division', parentDepartmentId: parentId },
        { name: 'Human Resource Development Division', parentDepartmentId: parentId },
        { name: 'Career & Staff Development Division', parentDepartmentId: parentId },
      ];

      const divMap: Record<string, number> = {};
      for (const div of divisionsData) {
        const [res] = await tx.insert(departments).values(div);
        divMap[div.name] = res.insertId;
      }

      // 3. Define Positions Mapping
      const positions = [
        // Top Level (Head)
        { title: 'City Government Department Head I (City Human Resource Management Officer)', sg: 25, count: 1, div: null },
        
        // Administrative Support Division
        { title: 'Senior Administrative Assistant II (Computer Operator IV)', sg: 14, count: 2, div: 'Administrative Support Division' },
        { title: 'Senior Administrative Assistant I (Data Entry Machine Operator I)', sg: 13, count: 1, div: 'Administrative Support Division' },
        { title: 'Administrative Assistant I (Computer Operator I)', sg: 7, count: 1, div: 'Administrative Support Division' },
        
        // Human Resource Development Division
        { title: 'Administrative Officer IV (Human Resource Management Officer II)', sg: 15, count: 1, div: 'Human Resource Development Division' },
        { title: 'Administrative Assistant II (Human Resource Management Assistant)', sg: 8, count: 2, div: 'Human Resource Development Division' },
        { title: 'Administrative Aide IV (Human Resource Management Aide)', sg: 4, count: 1, div: 'Human Resource Development Division' },
        
        // Career & Staff Development Division
        { title: 'Administrative Officer V (Human Resource Management Officer III)', sg: 18, count: 1, div: 'Career & Staff Development Division' },
        { title: 'Administrative Assistant II (Human Resource Management Assistant)', sg: 8, count: 3, div: 'Career & Staff Development Division' },
        { title: 'Administrative Aide IV (Driver II)', sg: 4, count: 1, div: 'Career & Staff Development Division' },
      ];

      let itemCount = 1;
      for (const pos of positions) {
        const deptId = pos.div ? divMap[pos.div] : parentId;
        const deptName = pos.div || 'OCHRMO (Head)';
        
        for (let i = 0; i < pos.count; i++) {
          const itemNumber = `OCHRMO-${String(itemCount).padStart(3, '0')}`;
          await tx.insert(plantillaPositions).values({
            itemNumber,
            positionTitle: pos.title,
            salaryGrade: pos.sg,
            departmentId: deptId,
            department: deptName,
            isVacant: true,
            status: 'Active',
          });
          itemCount++;
        }
      }

      console.log(`Successfully seeded ${itemCount - 1} positions across OCHRMO and 3 divisions.`);
    });
  } catch (error) {
    console.error('FAILED TO SEED OCHRMO POSITIONS:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  console.log('--- OCHRMO SEEDING COMPLETE ---');
}

seedOchrmoPositions().catch(console.error).finally(() => process.exit());
