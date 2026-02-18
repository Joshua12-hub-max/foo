import { db } from './backend/db/index.js';
import { plantillaPositions } from './backend/db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Retrieves all plantilla positions from the database
 */
export async function getAllPositions() {
  try {
    const allPositions = await db.select().from(plantillaPositions);
    return allPositions;
  } catch (error) {
    console.error('Error fetching all positions:', error);
    throw error;
  }
}

/**
 * Retrieves only vacant plantilla positions from the database
 */
export async function getVacantPositions() {
  try {
    const vacantPositions = await db.select().from(plantillaPositions).where(eq(plantillaPositions.isVacant, true));
    return vacantPositions;
  } catch (error) {
    console.error('Error fetching vacant positions:', error);
    throw error;
  }
}

// CLI runner for vacant positions (for backward compatibility and direct execution)
async function main() {
  try {
    const vacantPositions = await getVacantPositions();
    console.log(`Found ${vacantPositions.length} vacant positions:`);
    console.table(vacantPositions.map(p => ({
      'ID': p.id,
      'Item No': p.itemNumber,
      'Position': p.positionTitle,
      'Dept ID': p.departmentId,
      'Department': p.department,
      'SG': p.salaryGrade,
      'Step': p.stepIncrement,
      'Monthly Salary': p.monthlySalary
    })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

main();
