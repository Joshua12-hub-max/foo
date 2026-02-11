
import { db } from '../db/index.js';
import { 
    departments, 
    authentication, 
    plantillaPositions, 
    qualificationStandards,
    salarySchedule,
    salaryTranches,
    fingerprints,
    dailyTimeRecords,
    attendanceLogs,
    leaveCredits,
    leaveBalances,
    leaveApplications,
    leaveLedger
} from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

// --- Constants & Data ---

const DEPARTMENT_NAME = 'City Human Resource Management System (CHRMO)';
const SEED_START_DATE = new Date('2026-01-05');
const SEED_END_DATE = new Date('2026-02-19');

const EMPLOYEES = [
    { name: 'Judith S. Guevarra', role: 'Department Head', position: 'Department Head I', sg: 26, step: 6 },
    { name: 'Victor Louie', role: 'Staff', position: 'Administrative Officer V', sg: 18 },
    { name: 'Ron Micheal Nito', role: 'Staff', position: 'Administrative Officer IV', sg: 15 },
    { name: 'Loida Init', role: 'Staff', position: 'Administrative Officer II', sg: 11 },
    { name: 'Carmina Lim', role: 'Staff', position: 'Administrative Assistant III', sg: 9 },
    { name: 'Cristina Peña', role: 'Staff', position: 'Administrative Assistant II', sg: 8 },
    { name: 'Gemma Carpon', role: 'Staff', position: 'Administrative Aide VI', sg: 6 },
    { name: 'Jay Ar Rodriguez', role: 'Staff', position: 'Administrative Aide IV', sg: 4 },
    { name: 'Jeffrey Ganacias', role: 'Staff', position: 'Administrative Aide IV', sg: 4 },
    { name: 'Federic Montes', role: 'Staff', position: 'Administrative Aide III', sg: 3 },
    { name: 'Tricia May De Guzman', role: 'Staff', position: 'Administrative Aide III', sg: 3 },
    { name: 'Hannah Lyn A. Abacan', role: 'Staff', position: 'Administrative Aide I', sg: 1 },
    { name: 'Jeamy Shane D. Nebrida', role: 'Staff', position: 'Administrative Aide I', sg: 1 },
    { name: 'Ron O. Cruz', role: 'Staff', position: 'Administrative Aide I', sg: 1 },
    { name: 'Vohn Ferdinand R. Baldogo', role: 'Staff', position: 'Administrative Aide I', sg: 1 },
    { name: 'Pinky A. Pajarillo', role: 'Staff', position: 'Administrative Aide I', sg: 1 },
];

const SG_BASE_TRANCHE_1: Record<number, number> = {
    1: 13530, 2: 14372, 3: 15265, 4: 16209, 5: 17205,
    6: 18255, 7: 19365, 8: 20440, 9: 21790, 10: 23176,
    11: 27000, 12: 29165, 13: 31320, 14: 33843, 15: 36619,
    16: 39672, 17: 43030, 18: 46725, 19: 51357, 20: 57347,
    21: 63997, 22: 71511, 23: 79890, 24: 89296, 25: 100788,
    26: 113891, 27: 128696, 28: 145427, 29: 164324, 30: 185695,
    31: 273278, 32: 325807, 33: 411312
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getStep = (empStep?: number) => empStep || randomInt(2, 6);

const seedCHRMO = async () => {
    console.log('🚀 Starting CHRMO Seeding (2026 Test Data)...');
    
    try {
        // ... (Salary Tranche 2 logic same as before, simplified for brevity but kept intact)
        await seedSalary(); 
        const dept = await seedDepartment();
        const users = await seedEmployees(dept);
        
        console.log('📅 Seeding Timekeeping & Leaves (Jan 5 - Feb 19, 2026)...');
        await seedTimekeepingAndLeaves(users);

        console.log('✅ CHRMO Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

async function seedSalary() {
     console.log('💰 Seeding Salary Schedule (Tranche 2 - 2025)...');
     let tranche2 = await db.query.salaryTranches.findFirst({ where: eq(salaryTranches.trancheNumber, 2) });
     if (!tranche2) {
         await db.insert(salaryTranches).values({
             name: 'Second Tranche (SSL VI)',
             trancheNumber: 2,
             circularNumber: 'EO No. 64, s. 2024',
             effectiveDate: '2025-01-01',
             isActive: 1
         });
     }
    await db.delete(salarySchedule).where(eq(salarySchedule.tranche, 2));

    const salaryEntries = [];
    for (let sg = 1; sg <= 33; sg++) {
        const t1Base = SG_BASE_TRANCHE_1[sg] || (SG_BASE_TRANCHE_1[sg-1] * 1.15);
        const t2Base = Math.round(t1Base * 1.04);
        for (let step = 1; step <= 8; step++) {
            const monthly = Math.round(t2Base * Math.pow(1.011, step - 1));
            salaryEntries.push({ salaryGrade: sg, step: step, monthlySalary: String(monthly), tranche: 2 });
        }
    }
    for (let i = 0; i < salaryEntries.length; i += 500) await db.insert(salarySchedule).values(salaryEntries.slice(i, i + 500));
}

async function seedDepartment() {
    let dept = await db.query.departments.findFirst({ where: eq(departments.name, DEPARTMENT_NAME) });
    if (!dept) {
        const [res] = await db.insert(departments).values({
            name: DEPARTMENT_NAME,
            description: 'City Human Resource Management Office',
            budget: '5000000.00',
            headOfDepartment: 'Judith S. Guevarra'
        });
        // @ts-ignore
        return { id: res.insertId };
    }
    return dept;
}

async function seedEmployees(dept: any) {
    const defaultPassword = await bcrypt.hash('Password123!', 10);
    const createdUsers = [];

    for (const [index, emp] of EMPLOYEES.entries()) {
        const step = getStep(emp.step);
        
        // Qualification Standard
        let qs = await db.query.qualificationStandards.findFirst({ where: eq(qualificationStandards.positionTitle, emp.position) });
        if (!qs) {
            const [res] = await db.insert(qualificationStandards).values({
                positionTitle: emp.position,
                salaryGrade: emp.sg,
                educationRequirement: 'Bachelor Degree',
                eligibilityRequired: 'CS Prof',
                isActive: 1
            });
            // @ts-ignore
            qs = { id: res.insertId };
        }

        // Plantilla
        const itemNumber = `CHRMO-${emp.sg}-${index + 101}`;
        let pos = await db.query.plantillaPositions.findFirst({ where: eq(plantillaPositions.itemNumber, itemNumber) });
        
        if (!pos) {
             const [res] = await db.insert(plantillaPositions).values({
                 itemNumber, positionTitle: emp.position, salaryGrade: emp.sg,
                 stepIncrement: step, departmentId: dept.id, qualificationStandardsId: qs.id,
                 monthlySalary: '20000.00', // Placeholder, updated by salary sched logic really
                 isVacant: 0, status: 'Active'
             });
             // @ts-ignore
             pos = { id: res.insertId };
        }

        // User
        const email = `${emp.name.split(' ')[0].toLowerCase()}.${emp.name.split(' ').pop()?.toLowerCase()}@nebr.gov`;
        const employeeId = `EMP-2024-${1000 + index}`;

        let user = await db.query.authentication.findFirst({ where: eq(authentication.email, email) });
        let userId = user?.id;

        if (!user) {
            const [res] = await db.insert(authentication).values({
                firstName: emp.name.split(' ')[0],
                lastName: emp.name.split(' ').slice(1).join(' '),
                email, employeeId, passwordHash: defaultPassword,
                departmentId: dept.id, department: DEPARTMENT_NAME,
                positionId: pos.id, positionTitle: emp.position,
                salaryGrade: String(emp.sg), stepIncrement: step,
                isVerified: 1, employmentStatus: 'Active',
                rfidCardUid: faker.string.hexadecimal({ length: 10 }).toUpperCase()
            });
            // @ts-ignore
            userId = res.insertId;
        } else {
            await db.update(authentication).set({ employeeId, positionId: pos.id }).where(eq(authentication.id, userId));
        }
        
        createdUsers.push({ id: userId, employeeId, name: emp.name });
    }
    return createdUsers;
}

async function seedTimekeepingAndLeaves(users: any[]) {
    const logs = [];
    const dtrs = [];
    const leaveApps = [];
    const ledgerEntries = [];
    
    // Define Leaves to inject (Randomized but deterministic for test)
    // 1. Victor Louie - Sick Leave (Jan 12-14)
    // 2. Ron Micheal - Vacation Leave (Feb 2-6)
    // 3. Loida Init - Pending Sick Leave (Feb 18)
    // 4. Carmina Lim - Rejected VL (Jan 20)
    

    const plannedLeaves = [
        { 
            employeeName: 'Victor', 
            type: 'Sick Leave', 
            start: '2026-01-05', 
            end: '2026-01-07', 
            status: 'Approved', 
            pay: 'WITH_PAY' 
        },
        { 
            employeeName: 'Ron', 
            type: 'Vacation Leave', 
            start: '2026-01-08', 
            end: '2026-01-09', 
            status: 'Approved', 
            pay: 'WITH_PAY' 
        },
        { 
            employeeName: 'Loida', 
            type: 'Sick Leave', 
            start: '2026-01-12', 
            end: '2026-01-14', 
            status: 'Approved', 
            pay: 'WITH_PAY' 
        },
        { 
            employeeName: 'Carmina', 
            type: 'Vacation Leave', 
            start: '2026-01-15', 
            end: '2026-01-16', 
            status: 'Approved', 
            pay: 'WITH_PAY' 
        },
        { 
            employeeName: 'Cristina', 
            type: 'Special Privilege Leave', 
            start: '2026-01-19', 
            end: '2026-01-21', 
            status: 'Approved', 
            pay: 'WITH_PAY' 
        }
    ];


    // Seed credits first
    for (const user of users) {
        await db.insert(leaveBalances).values([
            { employeeId: user.employeeId, creditType: 'Vacation Leave', balance: '15.000', year: 2026 },
            { employeeId: user.employeeId, creditType: 'Sick Leave', balance: '15.000', year: 2026 },
        ]).onDuplicateKeyUpdate({ set: { balance: '15.000' } });
    }

    // Iterate dates
    for (let d = new Date(SEED_START_DATE); d <= SEED_END_DATE; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        for (const user of users) {
            // Check if user has leave on this date
            const activeLeave = plannedLeaves.find(l => 
                user.name.includes(l.employeeName) && 
                dateStr >= l.start && 
                dateStr <= l.end
            );

            if (activeLeave) {
                // If Approved, NO DTR/Logs for this day. (System assumes absence/leave)
                // If Rejected, they likely came to work -> Create DTR
                // If Pending, they likely didn't come -> No DTR
                
                if (activeLeave.status === 'Rejected') {
                    // Came to work despite rejection
                    createDTR(user, dateStr, logs, dtrs);
                } else {
                    // On Leave (Approved or Pending) - No Logs
                    console.log(`   -> Skipping DTR for ${user.name} on ${dateStr} (${activeLeave.type} - ${activeLeave.status})`);
                }

                // If this is the start date of the leave, create the application entry
                if (dateStr === activeLeave.start) {
                    // Calculate working days (approx)
                    const days = Math.round((new Date(activeLeave.end).getTime() - new Date(activeLeave.start).getTime()) / (1000 * 3600 * 24)) + 1; // Simple diff, assume working days

                    // Create Application
                    // We need to use insertId for ledger so we do it one by one effectively or just push to array?
                    // We'll push to a separate execute block later, but for ledger linking we might need IDs.
                    // For seeding simplicity, we'll insert immediately.
                    const [appRes] = await db.insert(leaveApplications).values({
                        employeeId: user.employeeId,
                        leaveType: activeLeave.type as any,
                        startDate: activeLeave.start,
                        endDate: activeLeave.end,
                        workingDays: String(days),
                        isWithPay: activeLeave.pay === 'WITH_PAY' ? 1 : 0,
                        actualPaymentStatus: activeLeave.pay as any,
                        daysWithPay: activeLeave.pay === 'WITH_PAY' ? String(days) : '0',
                        status: activeLeave.status as any,
                        reason: `${activeLeave.type} Request for Testing`,
                        createdAt: new Date(activeLeave.start).toISOString().replace('T', ' ').split('.')[0]
                    });

                    // Deduct if Approved and With Pay
                    if (activeLeave.status === 'Approved' && activeLeave.pay === 'WITH_PAY') {
                        // Update Balance
                         await db.execute(sql`
                            UPDATE leave_balances 
                            SET balance = balance - ${days}
                            WHERE employee_id = ${user.employeeId} 
                            AND credit_type = ${activeLeave.type}
                            AND year = 2026
                        `);
                        
                        // Ledger
                        ledgerEntries.push({
                            employeeId: user.employeeId,
                            creditType: activeLeave.type,
                            transactionType: 'DEDUCTION',
                            amount: String(days),
                            balanceAfter: '14.000', // Approx fixed for seed
                            // @ts-ignore
                            referenceId: appRes.insertId,
                            referenceType: 'leave_application',
                            remarks: 'Seeded Leave'
                        });
                    }
                }

            } else {
                // Regular Working Day
                createDTR(user, dateStr, logs, dtrs);
            }
        }
    }

    // Bulk Insert DTRs and Logs
    if (dtrs.length > 0) { // Split chunks
        for (let i = 0; i < dtrs.length; i += 500) await db.insert(dailyTimeRecords).values(dtrs.slice(i, i+500)).onDuplicateKeyUpdate({ set: { status: 'Present' }});
    }
    if (logs.length > 0) {
        for (let i = 0; i < logs.length; i += 500) await db.insert(attendanceLogs).values(logs.slice(i, i+500));
    }
    if (ledgerEntries.length > 0) {
        await db.insert(leaveLedger).values(ledgerEntries as any);
    }
}

function createDTR(user: any, dateStr: string, logs: any[], dtrs: any[]) {
    const inHour = 7;
    const inMin = randomInt(30, 59);
    const timeIn = `${dateStr} ${inHour}:00:00`; // Simplified

    const outHour = 17;
    const outMin = randomInt(0, 30);
    const timeOut = `${dateStr} ${outHour}:00:00`;

    dtrs.push({
        employeeId: user.employeeId,
        date: dateStr,
        timeIn, timeOut,
        status: 'Present'
    });
    logs.push({ employeeId: user.employeeId, scanTime: timeIn, type: 'IN', source: 'BIOMETRIC' });
    logs.push({ employeeId: user.employeeId, scanTime: timeOut, type: 'OUT', source: 'BIOMETRIC' });
}

seedCHRMO();
