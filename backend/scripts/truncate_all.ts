import pool from '../db/index.js';
import { db } from '../db/index.js';
import { departments, plantillaPositions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const departmentsData = [
    { name: "Office of the City Mayor", description: "CMO" },
    { name: "Office of the City Vice Mayor", description: "CVMO" },
    { name: "Office of the Sangguniang Panlungsod", description: "SPO" },
    { name: "Office of the City Accountant", description: "CAcO" },
    { name: "Office of the City Administrator", description: "CAdO" },
    { name: "Office of the City Agriculturist", description: "CAgO" },
    { name: "Office of the City Assessor", description: "CAsO" },
    { name: "Office of the City Budget Officer", description: "CBO" },
    { name: "Office of the City Civil Registrar", description: "CCRO" },
    { name: "Office of the City Cooperatives Development Officer", description: "CCDO" },
    { name: "Office of the Local Disaster Risk Reduction and Management Officer", description: "LDRRMO" },
    { name: "Office of the City Engineer", description: "CEO" },
    { name: "Office of the City Environment and Natural Resources Officer", description: "CENRO" },
    { name: "Office of the City General Services Officer", description: "CGSO" },
    { name: "Office of the City Health Officer", description: "CHO" },
    { name: "Office of the City Human Resource Management Officer", description: "CHRMO" },
    { name: "Office of the City Information Officer", description: "CIO" },
    { name: "Office of the City Legal Officer", description: "CLO" },
    { name: "Office of the City Planning and Development Coordinator", description: "CPDO" },
    { name: "Office of the City Population Officer", description: "CPO" },
    { name: "Office of the City Public Employment Service Manager", description: "CPESO" },
    { name: "Office of the City Social Welfare and Development Officer", description: "CSWDO" },
    { name: "Office of the City Treasurer", description: "CTO" },
    { name: "Office of the City Veterinarian", description: "CVO" },
    { name: "Office of the City Business Permit and Licensing Officer", description: "CBPLO" },
    { name: "Polytechnic College of the City of Meycauayan", description: "PCCM" },
    { name: "Ospital ng Meycauayan", description: "OsMeyc" },
    { name: "Office of the Secretary to the Sangguniang Panlungsod", description: "SSPO" }
];

async function truncateAndSeed() {
    console.log('--- CRITICAL RESET: Truncating All Tables & Re-seeding Setup Portal ---');
    const conn = await pool.getConnection();
    try {
        const dbName = process.env.DB_NAME || 'chrmo_db';
        console.log(`Using database: ${dbName}`);

        // Fetch only BASE TABLEs, not VIEWs
        const [tables]: unknown[] = await conn.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
            [dbName]
        );

        // Disable foreign key checks to allow truncation of tables with relations
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const row of tables) {
            const tableName = row.TABLE_NAME;
            if (tableName && tableName !== '__drizzle_migrations') {
                console.log(`Truncating table: ${tableName}`);
                try {
                    await conn.query(`TRUNCATE TABLE \`${tableName}\``);
                } catch (truncErr: unknown) {
                    console.error(`Failed to truncate ${tableName}: ${truncErr.message}`);
                    await conn.query(`DELETE FROM \`${tableName}\``);
                }
            }
        }

        // Re-enable foreign key checks
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database wiped clean. Starting mandatory re-seeding for Setup Portal...');

        // 1. Seed Departments
        for (const dept of departmentsData) {
            await db.insert(departments).values(dept);
            console.log(`Seeded Department: ${dept.name}`);
        }

        // 2. Seed HR Positions
        const hrDept = await db.query.departments.findFirst({
            where: eq(departments.name, "Office of the City Human Resource Management Officer")
        });

        if (hrDept) {
            await db.insert(plantillaPositions).values([
                {
                    itemNumber: "CHRMO-HEAD-001",
                    positionTitle: "City Government Department Head I",
                    salaryGrade: 26,
                    departmentId: hrDept.id,
                    department: hrDept.name,
                    isVacant: true
                },
                {
                    itemNumber: "CHRMO-AV-001",
                    positionTitle: "Administrative Officer V",
                    salaryGrade: 18,
                    departmentId: hrDept.id,
                    department: hrDept.name,
                    isVacant: true
                }
            ]);
            console.log('Seeded HR High-Level Positions for Setup Portal.');
        }

        console.log('SYSTEM RESET COMPLETE: Setup Portal is now active and ready.');

    } catch (err: unknown) {
        console.error('Error during critical reset:', err.message);
    } finally {
        conn.release();
        process.exit();
    }
}

truncateAndSeed();