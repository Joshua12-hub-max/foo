import { db } from '../db/index.js';
import { departments, authentication, fingerprints } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const employees = [
    { firstName: "Judith S.", lastName: "Guevarra", role: "Admin", jobTitle: "Department Head" },
    // Staff with biometric checks (☑️)
    { firstName: "Ron Micheal", lastName: "Nito", role: "Employee", jobTitle: "Staff" },
    { firstName: "Loida", lastName: "Init", role: "Employee", jobTitle: "Staff" },
    { firstName: "Carmina", lastName: "Lim", role: "Employee", jobTitle: "Staff" },
    { firstName: "Cristina", lastName: "Peña", role: "Employee", jobTitle: "Staff" },
    { firstName: "Gemma", lastName: "Carpon", role: "Employee", jobTitle: "Staff" },
    { firstName: "Jay Ar", lastName: "Rodriguez", role: "Employee", jobTitle: "Staff" },
    { firstName: "Jeffrey", lastName: "Ganacias", role: "Employee", jobTitle: "Staff" },
    { firstName: "Federic", lastName: "Montes", role: "Employee", jobTitle: "Staff" },
    // Other Staff
    { firstName: "Tricia May", lastName: "De Guzman", role: "Employee", jobTitle: "Staff" },
    { firstName: "Hannah Lyn A.", lastName: "Abacan", role: "Employee", jobTitle: "Staff" },
    { firstName: "Jeamy Shane D.", lastName: "Nebrida", role: "Employee", jobTitle: "Staff" },
    { firstName: "Ron O.", lastName: "Cruz", role: "Employee", jobTitle: "Staff" },
    { firstName: "Vohn Ferdinand R.", lastName: "Baldogo", role: "Employee", jobTitle: "Staff" },
    { firstName: "Pinky A.", lastName: "Pajarillo", role: "Employee", jobTitle: "Staff" },
];

async function seed() {
    console.log('Starting CHRMO Full Enrollment...');

    // 1. Get or Create CHRMO Department
    let departmentId: number;
    const existingDept = await db.query.departments.findFirst({
        where: eq(departments.name, 'CHRMO'),
    });

    if (existingDept) {
        departmentId = existingDept.id;
    } else {
        const [result] = await db.insert(departments).values({
            name: 'CHRMO',
            description: 'City Human Resource Management Office',
            headOfDepartment: 'Judith S. Guevarra',
        });
        departmentId = result.insertId;
    }

    const defaultPassword = 'Password123!';
    const defaultPasswordHash = bcrypt.hashSync(defaultPassword, 10);
    const credentialsLog: any[] = [];

    // 2. Process Employees
    // Starting ID from 1 as requested ("1 to 200")
    for (const [index, emp] of employees.entries()) {
        const id = index + 1;
        const employeeId = id.toString(); // "1", "2", ...

        // Generate email
        // Format: firstname.lastname@chrmo.local (remove spaces/dots from name parts for email)
        const fNameClean = emp.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const lNameClean = emp.lastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const email = `${fNameClean}.${lNameClean}@chrmo.local`;

        // Check if user exists (by email to avoid duplicates if re-running without wipe)
        const existingUser = await db.query.authentication.findFirst({
            where: eq(authentication.email, email),
        });

        if (existingUser) {
            console.log(`Updating User: ${emp.firstName} ${emp.lastName} (ID: ${employeeId})`);
             await db.update(authentication)
                .set({
                    departmentId: departmentId,
                    department: 'CHRMO',
                    role: emp.role,
                    jobTitle: emp.jobTitle,
                    employeeId: employeeId, // Enforce simple numeric ID string
                    isVerified: 1,
                    passwordHash: defaultPasswordHash, // Reset password to default
                })
                .where(eq(authentication.id, existingUser.id));
        } else {
            console.log(`Creating User: ${emp.firstName} ${emp.lastName} (ID: ${employeeId})`);
            await db.insert(authentication).values({
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: email,
                role: emp.role,
                jobTitle: emp.jobTitle,
                departmentId: departmentId,
                department: 'CHRMO',
                employeeId: employeeId,
                passwordHash: defaultPasswordHash,
                isVerified: 1,
            });
        }

        // 3. Biometric Enrollment (Fingerprints)
        // Check if fingerprint exists
        const existingFp = await db.query.fingerprints.findFirst({
            where: eq(fingerprints.employeeId, employeeId)
        });

        if (!existingFp) {
            console.log(`  > Enrolling Biometrics for ${employeeId}...`);
            await db.insert(fingerprints).values({
                fingerprintId: id, // Use same ID for fingerprint ID
                employeeId: employeeId,
                template: `mock_template_${employeeId}_${Date.now()}`, // Dummy template
            });
        } else {
             console.log(`  > Biometrics already enrolled for ${employeeId}.`);
        }

        credentialsLog.push({
            "ID / Bio ID": employeeId,
            "Name": `${emp.firstName} ${emp.lastName}`,
            "Email": email,
            "Password": defaultPassword,
            "Biometrics": "Enrolled ✅"
        });
    }

    console.log('\n--- 🔐 ACCOUNT CREDENTIALS 🔐 ---');
    console.table(credentialsLog);
    console.log('-----------------------------------');
    console.log('Seeding & Enrollment complete.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
