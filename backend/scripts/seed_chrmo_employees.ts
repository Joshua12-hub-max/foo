
import { db } from '../db/index.js';
import { authentication, departments, bioEnrolledUsers } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const CHRMO_DEPARTMENT = 'City Human Resource Management Office';

const employees = [
  // Department Head
  { name: 'Judith S. Guevarra', role: 'Human Resource', title: 'Department Head', isHead: true },
  { name: 'Ron Micheal Nito', role: 'Administrator', title: 'Administrative Assistant I (Computer Operator I)' },


  // Staff (Employees)
  { name: 'Loida Init', role: 'Employee', title: 'Senior Administrative Assistant II (Computer Operator IV)' },
  { name: 'Carmina Lim', role: 'Employee', title: 'Senior Administrative Assistant I (Data Entry Machine Operator I)' },
  { name: 'Cristina Peña', role: 'Employee', title: 'Administrative Officer IV (Human Resource Management Officer II)' },
  { name: 'Gemma Carpon', role: 'Employee', title: 'Administrative Assistant II (Human Resource Management Assistant)' },
  { name: 'Jay Ar Rodriguez', role: 'Employee', title: 'Administrative Aide IV (Human Resource Management Aide)' },
  { name: 'Jeffrey Ganacias', role: 'Employee', title: 'Administrative Officer V (Human Resource Management Officer III)' },
  { name: 'Federic Montes', role: 'Employee', title: 'Administrative Assistant II (Human Resource Management Assistant)' },
  { name: 'Tricia May De Guzman', role: 'Employee', title: 'Administrative Aide IV (Driver II)' },
  { name: 'Hannah Lyn A. Abacan', role: 'Employee', title: 'Job Order' },
  { name: 'Jeamy Shane D. Nebrida', role: 'Employee', title: 'Job Order' },
  { name: 'Ron O. Cruz', role: 'Employee', title: 'Job Order' },
  { name: 'Vohn Ferdinand R. Baldogo', role: 'Employee', title: 'Job Order' },
  { name: 'Pinky A. Pajarillo', role: 'Employee', title: 'Job Order' }
];

function parseName(fullName: string) {
  // Remove suffixes like MPA
  const cleanedName = fullName.replace(/,?\s*MPA$/i, '').trim();
  
  const parts = cleanedName.split(' ');
  let firstName = '';
  let lastName = '';

  // Basic heuristic: Last word is last name (unless it's a suffix like Jr, III, etc which we handle simply here)
  // For 'Ron Micheal Nito', First: Ron Micheal, Last: Nito
  // For 'Judith S. Guevarra', First: Judith, Middle: S., Last: Guevarra
  
  if (parts.length === 2) {
      firstName = parts[0];
      lastName = parts[1];
  } else {
      lastName = parts.pop() || '';
      // Check if lastName is a suffix
      if (['Jr.', 'Jr', 'Sr.', 'Sr', 'III', 'II', 'IV'].includes(lastName)) {
          const suffix = lastName;
          lastName = parts.pop() || '';
          lastName = `${lastName} ${suffix}`;
      }
      firstName = parts.join(' ');
  }
  
  return { firstName, lastName };
}

function generateEmail(firstName: string, lastName: string) {
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return `${cleanFirst}.${cleanLast}@cityhall.gov.ph`;
}

async function seedCHRMO() {
  console.log('Seeding CHRMO Employees...');

  // 1. Ensure Department Exists
  let deptId: number;
  const existingDept = await db.query.departments.findFirst({
    where: eq(departments.name, CHRMO_DEPARTMENT)
  });

  if (existingDept) {
    console.log(`Region '${CHRMO_DEPARTMENT}' already exists.`);
    deptId = existingDept.id;
  } else {
    console.log(`Creating department '${CHRMO_DEPARTMENT}'...`);
    const [result] = await db.insert(departments).values({
      name: CHRMO_DEPARTMENT,
      description: 'Human Resources Management',
      headOfDepartment: 'Judith S. Guevarra'
    });
    deptId = result.insertId;
  }

  // Common Password
  const salt = await bcrypt.genSalt(10);
  const genericPassword = await bcrypt.hash('Password123!', salt);

  // 2. Iterate and Upsert Employees
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const { firstName, lastName } = parseName(emp.name);
    const email = generateEmail(firstName, lastName);
    // Generate a CHRMO specific ID
    const employeeId = `CHRMO-${(i + 1).toString().padStart(3, '0')}`; 

    const existingUser = await db.query.authentication.findFirst({
        where: or(
            eq(authentication.email, email),
            eq(authentication.employeeId, employeeId)
        )
    });

    if (existingUser) {
        console.log(`Skipping existing user: ${emp.name} (${email})`);
        
        // Update head of department connection if needed
        if (emp.isHead) {
            await db.update(departments)
                .set({ headOfDepartment: emp.name })
                .where(eq(departments.id, deptId));
        }
        continue;
    }

    console.log(`Creating user: ${emp.name} (${email})`);
    
    // Create user
    try {
        await db.insert(authentication).values({
            firstName,
            lastName,
            email,
            role: emp.role as 'Administrator' | 'Human Resource' | 'Employee',
            department: CHRMO_DEPARTMENT,
            departmentId: deptId,
            employeeId,
            passwordHash: genericPassword,
            isVerified: true, // Auto verified
            jobTitle: emp.title,
            employmentStatus: 'Active',
            employmentType: emp.title === 'Job Order' ? 'Job Order' : 'Permanent',
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        // Also add to bio_enrolled_users simulation if it exists/is used
        // so they can login if biometric check is active
        const bioId = 9000 + i; // Fake bio ID range
         try {
             const [__enrollment] = await db.insert(bioEnrolledUsers).values({
                 employeeId: bioId,
                 fullName: `${firstName} ${lastName}`,
                 department: CHRMO_DEPARTMENT,
                 userStatus: 'active'
             });
             // Update the authentication record with the emp-id format if needed, 
             // but here we used CHRMO-XXX. The auth controller attempts to parse ints from EMP-XXX or raw.
             // If we use CHRMO-XXX, logic might fail if it strictly expects numbers.
             // Let's check auth controller again.
         } catch (e: unknown) {
             console.log('Bio enrollment skipped/failed (might duplicate):', e instanceof Error ? e.message : String(e));
         }

    } catch (err) {
        console.error(`Failed to create ${emp.name}:`, err);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seedCHRMO();
