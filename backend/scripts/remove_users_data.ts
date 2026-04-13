import { db } from '../db/index.js';
import { 
  authentication, 
  attendanceLogs, 
  dailyTimeRecords, 
  bioAttendanceLogs,
  leaveApplications,
  leaveBalances,
  leaveLedger,
  lwopSummary,
  pdsHrDetails,
  pdsPersonalInformation,
  pdsEducation,
  pdsEligibility,
  pdsFamily,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences,
  pdsVoluntaryWork,
  pdsWorkExperience,
  pdsDeclarations,
  employeeEmergencyContacts,
  employeeCustomFields,
  employeeDocuments,
  employeeMemos,
  employeeNotes,
  employeeSkills,
  serviceRecords,
  tardinessSummary,
  dtrCorrections,
  schedules,
  socialConnections,
  googleCalendarTokens,
  notifications,
  contactInquiries,
  audit_logs
} from '../db/schema.js';
import { eq, or, inArray, sql } from 'drizzle-orm';
import { compareIds } from '../utils/idUtils.js';

const USER_IDS = [17, 27]; // Christian Ramos and Ron Cruz
const EMP_IDS = ['Emp-002', 'Emp-005'];

async function removeUsersData() {
  console.log(`Starting deletion for users: ${USER_IDS.join(', ')} and Employee IDs: ${EMP_IDS.join(', ')}`);

  try {
    // 1. Delete from tables that use string employeeId
    console.log('Cleaning attendance and DTR tables...');
    await db.delete(attendanceLogs).where(or(...EMP_IDS.map(id => compareIds(attendanceLogs.employeeId, id))));
    await db.delete(dailyTimeRecords).where(or(...EMP_IDS.map(id => compareIds(dailyTimeRecords.employeeId, id))));
    await db.delete(bioAttendanceLogs).where(or(...EMP_IDS.map(id => compareIds(bioAttendanceLogs.employeeId, id))));
    await db.delete(dtrCorrections).where(or(...EMP_IDS.map(id => compareIds(dtrCorrections.employeeId, id))));
    await db.delete(tardinessSummary).where(or(...EMP_IDS.map(id => compareIds(tardinessSummary.employeeId, id))));
    await db.delete(schedules).where(or(...EMP_IDS.map(id => compareIds(schedules.employeeId, id))));

    console.log('Cleaning leave tables...');
    await db.delete(leaveApplications).where(or(...EMP_IDS.map(id => compareIds(leaveApplications.employeeId, id))));
    await db.delete(leaveBalances).where(or(...EMP_IDS.map(id => compareIds(leaveBalances.employeeId, id))));
    await db.delete(leaveLedger).where(or(...EMP_IDS.map(id => compareIds(leaveLedger.employeeId, id))));
    await db.delete(lwopSummary).where(or(...EMP_IDS.map(id => compareIds(lwopSummary.employeeId, id))));

    // 2. Delete from tables that use integer ID (references authentication.id)
    console.log('Cleaning PDS and related tables...');
    const tablesWithEmployeeId = [
      pdsHrDetails,
      pdsPersonalInformation,
      pdsEducation,
      pdsEligibility,
      pdsFamily,
      pdsLearningDevelopment,
      pdsOtherInfo,
      pdsReferences,
      pdsVoluntaryWork,
      pdsWorkExperience,
      pdsDeclarations,
      employeeEmergencyContacts,
      employeeCustomFields,
      employeeDocuments,
      employeeMemos,
      employeeNotes,
      employeeSkills,
      serviceRecords
    ];

    for (const table of tablesWithEmployeeId) {
      // @ts-ignore
      await db.delete(table).where(inArray(table.employeeId, USER_IDS));
    }

    console.log('Cleaning social and tokens...');
    await db.delete(socialConnections).where(inArray(socialConnections.userId, USER_IDS));
    await db.delete(googleCalendarTokens).where(inArray(googleCalendarTokens.userId, USER_IDS));
    await db.delete(audit_logs).where(inArray(audit_logs.userId, USER_IDS));


    // 3. Special cases (different column names or complex relations)
    console.log('Cleaning notifications...');
    // recipientId is varchar(50) in common.ts, stores stringified ID or empId
    await db.delete(notifications).where(or(
      inArray(notifications.recipientId, USER_IDS.map(id => String(id))),
      inArray(notifications.recipientId, EMP_IDS),
      inArray(notifications.senderId, EMP_IDS)
    ));

    console.log('Cleaning inquiries...');
    await db.delete(contactInquiries).where(or(
      eq(contactInquiries.email, 'capstone682@gmail.com'),
      eq(contactInquiries.email, 'primeagen5@gmail.com')
    ));

    // 4. Finally, delete from authentication
    console.log('Deleting from authentication table...');
    await db.delete(authentication).where(inArray(authentication.id, USER_IDS));

    console.log('SUCCESS: All data for Christian Ramos and Ron Cruz has been removed.');
  } catch (error) {
    console.error('ERROR during deletion:', error);
  }

  process.exit(0);
}

removeUsersData().catch(err => {
  console.error(err);
  process.exit(1);
});


