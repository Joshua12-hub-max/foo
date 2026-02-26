
import { db } from '../db/index.js';
import { plantillaPositions, departments } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const POSITIONS = [
  { title: "Department Head 1", sg: 26, item: "CHRMO-HEAD-1" }, // Assumed SG roughly
  { title: "Senior Administrative Assistant II (Computer Operator IV)", sg: 14, item: "CHRMO-SAA-II-1" },
  { title: "Senior Administrative Assistant II (Computer Operator IV)", sg: 14, item: "CHRMO-SAA-II-2" },
  { title: "Senior Administrative Assistant I (Data Entry Machine Operator I)", sg: 13, item: "CHRMO-SAA-I-1" },
  { title: "Administrative Assistant I (Computer Operator I)", sg: 7, item: "CHRMO-AA-I-1" },
  { title: "Administrative Officer IV (Human Resource Management Officer II)", sg: 15, item: "CHRMO-AO-IV-1" },
  { title: "Administrative Assistant II (Human Resource Management Assistant)", sg: 8, item: "CHRMO-AA-II-1" },
  { title: "Administrative Assistant II (Human Resource Management Assistant)", sg: 8, item: "CHRMO-AA-II-2" },
  { title: "Administrative Aide IV (Human Resource Management Aide)", sg: 4, item: "CHRMO-ADA-IV-1" },
  { title: "Administrative Officer V (Human Resource Management Officer III)", sg: 18, item: "CHRMO-AO-V-1" },
  { title: "Administrative Assistant II (Human Resource Management Assistant)", sg: 8, item: "CHRMO-AA-II-3" },
  { title: "Administrative Assistant II (Human Resource Management Assistant)", sg: 8, item: "CHRMO-AA-II-4" },
  { title: "Administrative Assistant II (Human Resource Management Assistant)", sg: 8, item: "CHRMO-AA-II-5" },
  { title: "Administrative Aide IV (Driver II)", sg: 4, item: "CHRMO-ADA-IV-2" },
];

async function seedPositions() {
  try {
    console.log("Checking for 'City Human Resource Management Office'...");
    
    // 1. Find or Create Department
    let dept = await db.query.departments.findFirst({
        where: eq(departments.name, "City Human Resource Management Office")
    });

    if (!dept) {
        console.log("Department not found. Creating...");
        await db.insert(departments).values({
            name: "City Human Resource Management Office",
            description: "HR Department",
            budget: "0"
        });
        // result.insertId is not directly available in all drivers via drizzle insert result without returning depending on driver
        // Let's query it back
        dept = await db.query.departments.findFirst({
            where: eq(departments.name, "City Human Resource Management Office")
        });
    }

    if (!dept) {
        console.error("Failed to create/find department.");
        process.exit(1);
    }

    console.log(`Target Department: ${dept.name} (ID: ${dept.id})`);

    // 2. Insert Positions
    console.log("Inserting positions...");
    const values = POSITIONS.map(p => ({
        itemNumber: p.item,
        positionTitle: p.title,
        salaryGrade: p.sg,
        department: dept.name,
        departmentId: dept.id,
        isVacant: 1
    }));

     // Using simple loop to avoid duplicate item number errors if re-run (ignoring duplicates would be better but keeping simple)
    for (const val of values) {
         try {
             await db.insert(plantillaPositions).values(val);
             console.log(`Inserted: ${val.positionTitle}`);
         } catch (e: any) {
             if (e.code === 'ER_DUP_ENTRY') {
                 console.log(`Skipped (Duplicate): ${val.positionTitle}`);
             } else {
                 console.error(`Error inserting ${val.positionTitle}:`, e.message);
             }
         }
    }

    console.log("Done.");
    process.exit(0);

  } catch (error) {
    console.error("Script error:", error);
    process.exit(1);
  }
}

seedPositions();
