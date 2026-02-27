import { db } from '../db/index.js';
import { 
  authentication, 
  attendanceLogs, 
  dailyTimeRecords, 
  departments, 
  bioEnrolledUsers,
  policyViolations,
  employeeMemos
} from '../db/schema.js';
import { eq, or, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { checkPolicyViolations } from '../services/violationService.js';

const CHRMO_DEPARTMENT = 'City Human Resources Management Office';
const START_DATE = new Date('2026-01-05');
const END_DATE = new Date(); // until today

// The requested employees
const EMPLOYEES = [
    { name: 'Ron Micheal Nito', empId: 'CHRMO-001', bioId: 9001, role: 'employee' },
    { name: 'Loida Init', empId: 'CHRMO-002', bioId: 9002, role: 'employee' },
    { name: 'Carmina Lim', empId: 'CHRMO-003', bioId: 9003, role: 'employee' },
    { name: 'Cristina Peña', empId: 'CHRMO-004', bioId: 9004, role: 'employee' },
    { name: 'Gemma Carpon', empId: 'CHRMO-005', bioId: 9005, role: 'employee' },
    { name: 'Jay Ar Rodriguez', empId: 'CHRMO-006', bioId: 9006, role: 'employee' },
    { name: 'Jeffrey Ganacias', empId: 'CHRMO-007', bioId: 9007, role: 'employee' },
    { name: 'Federic Montes', empId: 'CHRMO-008', bioId: 9008, role: 'employee' },
    { name: 'Tricia May De Guzman', empId: 'CHRMO-009', bioId: 9009, role: 'employee' },
    { name: 'Hannah Lyn A. Abacan', empId: 'CHRMO-010', bioId: 9010, role: 'employee' },
    { name: 'Jeamy Shane D. Nebrida', empId: 'CHRMO-011', bioId: 9011, role: 'employee' },
    { name: 'Ron O. Cruz', empId: 'CHRMO-012', bioId: 9012, role: 'employee' },
    { name: 'Vohn Ferdinand R. Baldogo', empId: 'CHRMO-013', bioId: 9013, role: 'employee' },
    { name: 'Pinky A. Pajarillo', empId: 'CHRMO-014', bioId: 9014, role: 'employee' },
];

function parseName(fullName: string) {
    const cleanedName = fullName.replace(/,?\s*MPA$/i, '').trim();
    const parts = cleanedName.split(' ');
    let firstName = '';
    let lastName = '';
  
    if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
    } else {
        lastName = parts.pop() || '';
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
    const cleanFirst = firstName.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return `${cleanFirst}.${cleanLast}@cityhall.gov.ph`;
}

// Helpers
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomTime = (year: number, month: number, day: number, baseHour: number, baseMinute: number, variationMinutes: number) => {
  const date = new Date(year, month, day, baseHour, baseMinute, 0);
  const variation = getRandomInt(-variationMinutes, variationMinutes);
  date.setMinutes(date.getMinutes() + variation);
  return date;
};

async function seedMassTestEmployees() {
  console.log('Seeding Specified Test Employees...');

  // 1. Ensure Department Exists
  let deptId: number;
  const existingDept = await db.query.departments.findFirst({
    where: eq(departments.name, CHRMO_DEPARTMENT)
  });

  if (existingDept) {
    deptId = existingDept.id;
  } else {
    const [result] = await db.insert(departments).values({
        name: CHRMO_DEPARTMENT,
        description: 'Human Resources Management',
        headOfDepartment: 'Judith S. Guevarra'
    });
    deptId = result.insertId;
  }

  // Common Password
  const salt = await bcrypt.genSalt(10);
  const plainPassword = 'Password123!';
  const genericPassword = await bcrypt.hash(plainPassword, salt);

  for (const emp of EMPLOYEES) {
      console.log(`\nProcessing: ${emp.name}`);
      const { firstName, lastName } = parseName(emp.name);
      const email = generateEmail(firstName, lastName);

      // 2. Check and Create User
      const existingUser = await db.query.authentication.findFirst({
          where: or(
              eq(authentication.email, email),
              eq(authentication.employeeId, emp.empId)
          )
      });

      if (existingUser) {
          console.log(`- User already exists in auth: ${emp.name}`);
      } else {
          console.log(`- Creating user record...`);
          await db.insert(authentication).values({
              firstName,
              lastName,
              email: email,
              role: emp.role as any,
              department: CHRMO_DEPARTMENT,
              departmentId: deptId,
              employeeId: emp.empId,
              passwordHash: genericPassword,
              isVerified: 1, 
              jobTitle: 'Seeded Staff',
              employmentStatus: 'Active',
              employmentType: 'Permanent',
              createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
      }

      // 3. Ensure Biometric Enrollment
      const existingBio = await db.query.bioEnrolledUsers.findFirst({
          where: eq(bioEnrolledUsers.employeeId, emp.bioId)
      });

      if (!existingBio) {
          console.log(`- Enrolling biometrics (Bio ID: ${emp.bioId})...`);
          try {
              await db.insert(bioEnrolledUsers).values({
                  employeeId: emp.bioId,
                  fullName: emp.name,
                  department: CHRMO_DEPARTMENT,
                  userStatus: 'active'
              });
          } catch (e) {
              console.error(`- Failed to enroll biometrics for ${emp.name}:`, e);
          }
      } else {
          console.log(`- Biometrics already enrolled.`);
      }

      // 4. Delete existing attendance logs, DTR, and old Violations/Memos
      console.log('- Clearing old attendance and violation data...');
      await db.delete(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, emp.empId));
      await db.delete(attendanceLogs).where(eq(attendanceLogs.employeeId, emp.empId));
      
      // We must clear the policyViolations to recalculate accurately
      await db.delete(policyViolations).where(eq(policyViolations.employeeId, emp.empId));
      if (existingUser) {
        await db.delete(employeeMemos).where(eq(employeeMemos.employeeId, existingUser.id));
      }
      console.log('- Generating fresh attendance records...');
      // Batch inserts
      let dtrs = [];
      let logs = [];
      
      let currentDate = START_DATE;
      while (currentDate <= END_DATE) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = formatDate(currentDate);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentDate = addDays(currentDate, 1);
          continue;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();

        const rand = Math.random();
        let status = 'Present';
        let timeInDate: Date | null = null;
        let timeOutDate: Date | null = null;
        let lateMinutes = 0;
        let undertimeMinutes = 0;

        // Spread: 60% Present, 15% Late, 15% Undertime, 10% Absent
        if (rand < 0.60) { 
            // PRESENT
            status = 'Present'; 
            timeInDate = getRandomTime(year, month, day, 7, 50, 10); 
            timeOutDate = getRandomTime(year, month, day, 17, 5, 5); 
        }
        else if (rand < 0.75) { 
            // LATE
            status = 'Late'; 
            timeInDate = getRandomTime(year, month, day, 8, 30, 20); // late by ~30 mins
            
            const eightAM = new Date(year, month, day, 8, 0, 0);
            lateMinutes = Math.floor((timeInDate.getTime() - eightAM.getTime()) / 60000); 
            if (lateMinutes < 0) lateMinutes = 0; 
            
            timeOutDate = getRandomTime(year, month, day, 17, 5, 5); 
        }
        else if (rand < 0.90) { 
            // UNDERTIME
            status = 'Undertime'; 
            timeInDate = getRandomTime(year, month, day, 7, 50, 10); 
            
            timeOutDate = getRandomTime(year, month, day, 16, 15, 20); // early by ~45 mins
            
            const fivePM = new Date(year, month, day, 17, 0, 0);
            undertimeMinutes = Math.floor((fivePM.getTime() - timeOutDate.getTime()) / 60000); 
            if (undertimeMinutes < 0) undertimeMinutes = 0; 
        }
        else { 
            // ABSENT
            status = 'Absent'; 
        }

        if (status !== 'Absent') {
             // Create Logs
             logs.push({ employeeId: emp.empId, scanTime: formatDateTime(timeInDate!), type: 'IN', source: 'BIOMETRIC' });
             logs.push({ employeeId: emp.empId, scanTime: formatDateTime(timeOutDate!), type: 'OUT', source: 'BIOMETRIC' });
             
             // Create DTR
             dtrs.push({
                employeeId: emp.empId, 
                date: dateStr, 
                timeIn: formatDateTime(timeInDate!), 
                timeOut: formatDateTime(timeOutDate!), 
                lateMinutes, 
                undertimeMinutes, 
                status, 
                createdAt: formatDateTime(new Date())
             });
        } else {
             dtrs.push({
                employeeId: emp.empId, 
                date: dateStr, 
                status: 'Absent', 
                createdAt: formatDateTime(new Date())
             });
        }

        currentDate = addDays(currentDate, 1);
      }
      
      if (logs.length > 0) {
          await db.insert(attendanceLogs).values(logs);
      }
      if (dtrs.length > 0) {
          await db.insert(dailyTimeRecords).values(dtrs);
      }
      
      console.log(`- Inserted ${dtrs.length} DTRs and ${logs.length} bio logs for ${emp.name}`);

      // 6. Retroactively Process Memos for the seeded months (Jan, Feb, March)
      console.log('- Generating Tardiness Summaries and Violation Memos...');
      const monthsToProcess = [
          { year: 2026, month: 1, endDay: 31 },
          { year: 2026, month: 2, endDay: 28 }, // Assuming non-leap year logic since ends Mar 10
          { year: 2026, month: 3, endDay: 10 }
      ];

      for (const m of monthsToProcess) {
          // Send the last day of the month as the active date for the summary processor
          const proxyDateStr = formatDate(new Date(m.year, m.month - 1, m.endDay));
          
          await updateTardinessSummary(emp.empId, proxyDateStr);
          await checkPolicyViolations(emp.empId, m.year, m.month);
      }
      console.log(`- Tardiness Summaries and Memos finalized.`);
  }

  console.log('\n--- ALL SPECIFIED EMPLOYEES SEEDED SUCCESSFULLY ---');
  console.log('Every account uses the SAME password: Password123!');
  console.log('Sample Emails generated:');
  for (const emp of EMPLOYEES) {
      const { firstName, lastName } = parseName(emp.name);
      console.log(`- ${emp.name.padEnd(25)} : ${generateEmail(firstName, lastName)}`);
  }
  console.log('--------------------------------------------------');
  
  process.exit(0);
}

seedMassTestEmployees().catch((err) => {
    console.error('Error seeding mass test employees:', err);
    process.exit(1);
});
