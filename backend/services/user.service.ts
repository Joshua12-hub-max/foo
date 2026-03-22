import { db } from '../db/index.js';
import { authentication, employeeSkills, employeeEmergencyContacts, employeeCustomFields, pdsFamily, pdsVoluntaryWork, pdsLearningDevelopment, pdsWorkExperience, pdsOtherInfo, pdsReferences, bioEnrolledUsers, pdsEducation, pdsEligibility, pdsHrDetails, departments, shiftTemplates } from '../db/schema.js';
import { eq, and, desc, SQL, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

type NewEmployee = typeof authentication.$inferInsert;
type UpdateEmployee = Partial<NewEmployee>;

export class UserService {
  static async getAllEmployees(conditions: SQL[] = []) {
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const query = db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      email: authentication.email,
      department: departments.name,
      departmentId: pdsHrDetails.departmentId,
      jobTitle: pdsHrDetails.jobTitle,
      employmentStatus: pdsHrDetails.employmentStatus,
      employmentType: pdsHrDetails.employmentType,
      role: authentication.role,
      avatarUrl: authentication.avatarUrl,
      dateHired: pdsHrDetails.dateHired,
      contractEndDate: pdsHrDetails.contractEndDate,
      regularizationDate: pdsHrDetails.regularizationDate,
      isRegular: pdsHrDetails.isRegular,
      positionTitle: pdsHrDetails.positionTitle,
      positionId: pdsHrDetails.positionId,
      station: pdsHrDetails.station,
      appointmentType: pdsHrDetails.appointmentType,
      itemNumber: pdsHrDetails.itemNumber,
      salaryGrade: pdsHrDetails.salaryGrade,
      stepIncrement: pdsHrDetails.stepIncrement,
      facebookUrl: pdsHrDetails.facebookUrl,
      linkedinUrl: pdsHrDetails.linkedinUrl,
      twitterHandle: pdsHrDetails.twitterHandle,
      firstDayOfService: pdsHrDetails.firstDayOfService,
      officeAddress: pdsHrDetails.officeAddress,
      religion: pdsHrDetails.religion,
      barangay: pdsHrDetails.barangay,
      dutyType: pdsHrDetails.dutyType,
      isMeycauayan: pdsHrDetails.isMeycauayan,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM ${shiftTemplates} WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM ${shiftTemplates} WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`,
      isBiometricEnrolled: sql<boolean>`CASE WHEN ${bioEnrolledUsers.employeeId} IS NOT NULL THEN true ELSE false END`
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, eq(authentication.employeeId, bioEnrolledUsers.employeeId))
    .where(where)
    .orderBy(authentication.lastName);

    return await query;
  }

  static async getEmployeeById(id: number) {
    const results = await db.select({
      id: authentication.id,
      email: authentication.email,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      role: authentication.role,
      employeeId: authentication.employeeId,
      rfidCardUid: authentication.rfidCardUid,
      avatarUrl: authentication.avatarUrl,
      lastLogin: authentication.createdAt,
      department: departments.name,
      departmentId: pdsHrDetails.departmentId,
      jobTitle: pdsHrDetails.jobTitle,
      employmentStatus: pdsHrDetails.employmentStatus,
      employmentType: pdsHrDetails.employmentType,
      dateHired: pdsHrDetails.dateHired,
      contractEndDate: pdsHrDetails.contractEndDate,
      regularizationDate: pdsHrDetails.regularizationDate,
      isRegular: pdsHrDetails.isRegular,
      positionTitle: pdsHrDetails.positionTitle,
      positionId: pdsHrDetails.positionId,
      station: pdsHrDetails.station,
      appointmentType: pdsHrDetails.appointmentType,
      itemNumber: pdsHrDetails.itemNumber,
      salaryGrade: pdsHrDetails.salaryGrade,
      stepIncrement: pdsHrDetails.stepIncrement,
      firstDayOfService: pdsHrDetails.firstDayOfService,
      officeAddress: pdsHrDetails.officeAddress,
      religion: pdsHrDetails.religion,
      barangay: pdsHrDetails.barangay,
      dutyType: pdsHrDetails.dutyType,
      isMeycauayan: pdsHrDetails.isMeycauayan,
      facebookUrl: pdsHrDetails.facebookUrl,
      linkedinUrl: pdsHrDetails.linkedinUrl,
      twitterHandle: pdsHrDetails.twitterHandle,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM ${shiftTemplates} WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE schedules.employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM ${shiftTemplates} WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`,
      isBiometricEnrolled: sql<boolean>`CASE WHEN ${bioEnrolledUsers.employeeId} IS NOT NULL THEN true ELSE false END`
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, eq(authentication.employeeId, bioEnrolledUsers.employeeId))
    .where(eq(authentication.id, id))
    .limit(1);

    return results[0] || null;
  }

  static async getRelatedData(id: number) {
    const [skills, education, emergencyContacts, customFields, familyBackground, voluntaryWork, learningDevelopment, workExperience, otherInfo, references, eligibilities] = await Promise.all([
      db.select()
        .from(employeeSkills)
        .where(eq(employeeSkills.employeeId, id))
        .orderBy(employeeSkills.skillName),

      db.select()
        .from(pdsEducation)
        .where(eq(pdsEducation.employeeId, id)),

      db.select()
        .from(employeeEmergencyContacts)
        .where(eq(employeeEmergencyContacts.employeeId, id))
        .orderBy(desc(employeeEmergencyContacts.isPrimary)),

      db.select()
        .from(employeeCustomFields)
        .where(eq(employeeCustomFields.employeeId, id)),
      
      db.select()
        .from(pdsFamily)
        .where(eq(pdsFamily.employeeId, id)),

      db.select()
        .from(pdsVoluntaryWork)
        .where(eq(pdsVoluntaryWork.employeeId, id))
        .orderBy(desc(pdsVoluntaryWork.dateFrom)),

      db.select()
        .from(pdsLearningDevelopment)
        .where(eq(pdsLearningDevelopment.employeeId, id))
        .orderBy(desc(pdsLearningDevelopment.dateFrom)),

      db.select()
        .from(pdsWorkExperience)
        .where(eq(pdsWorkExperience.employeeId, id))
        .orderBy(desc(pdsWorkExperience.dateFrom)),

      db.select()
        .from(pdsOtherInfo)
        .where(eq(pdsOtherInfo.employeeId, id)),

      db.select()
        .from(pdsReferences)
        .where(eq(pdsReferences.employeeId, id)),

      db.select()
        .from(pdsEligibility)
        .where(eq(pdsEligibility.employeeId, id))
    ]);

    return { skills, education, emergencyContacts, customFields, familyBackground, voluntaryWork, learningDevelopment, workExperience, otherInfo, references, eligibilities };
  }

  static async createEmployee(data: any) {
    return await db.transaction(async (tx) => {
      // 1. Split data
      const authData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        suffix: data.suffix,
        email: data.email,
        role: data.role || 'employee',
        employeeId: data.employeeId,
        avatarUrl: data.avatarUrl,
        passwordHash: data.password ? await bcrypt.hash(data.password, 10) : undefined,
      };

      const [authResult] = await tx.insert(authentication).values(authData);
      const newId = (authResult as any).insertId;

      // 2. Prepare HR data
      const hrData: any = {
        employeeId: newId,
        employmentStatus: data.employmentStatus || 'Active',
        employmentType: data.employmentType || 'Probationary',
        jobTitle: data.jobTitle,
        departmentId: data.departmentId,
        positionId: data.positionId,
        salaryGrade: data.salaryGrade,
        stepIncrement: data.stepIncrement,
        dateHired: data.dateHired,
        contractEndDate: data.contractEndDate,
        regularizationDate: data.regularizationDate,
        isRegular: data.isRegular ? 1 : 0,
        positionTitle: data.positionTitle,
        station: data.station,
        appointmentType: data.appointmentType,
        itemNumber: data.itemNumber,
        firstDayOfService: data.firstDayOfService,
        officeAddress: data.officeAddress,
        religion: data.religion,
        barangay: data.barangay,
        dutyType: data.dutyType || 'Standard',
        isMeycauayan: data.isMeycauayan ? 1 : 0,
        facebookUrl: data.facebookUrl,
        linkedinUrl: data.linkedinUrl,
        twitterHandle: data.twitterHandle,
      };

      await tx.insert(pdsHrDetails).values(hrData);

      return authResult;
    });
  }

  static async updateEmployee(id: number, data: any) {
    return await db.transaction(async (tx) => {
      // 1. Auth fields
      const authFields = ['firstName', 'lastName', 'middleName', 'suffix', 'email', 'role', 'employeeId', 'avatarUrl', 'rfidCardUid'];
      const authUpdate: any = {};
      authFields.forEach(f => { if (data[f] !== undefined) authUpdate[f] = data[f]; });

      if (Object.keys(authUpdate).length > 0) {
        await tx.update(authentication).set(authUpdate).where(eq(authentication.id, id));
      }

      // 2. HR fields
      const hrFields = [
        'employmentStatus', 'employmentType', 'jobTitle', 'departmentId', 'positionId',
        'salaryGrade', 'stepIncrement', 'dateHired', 'contractEndDate', 'regularizationDate',
        'isRegular', 'positionTitle', 'station', 'appointmentType', 'itemNumber',
        'firstDayOfService', 'officeAddress', 'religion', 'barangay', 'dutyType',
        'isMeycauayan', 'facebookUrl', 'linkedinUrl', 'twitterHandle', 'managerId'
      ];
      const hrUpdate: any = {};
      hrFields.forEach(f => { if (data[f] !== undefined) hrUpdate[f] = data[f]; });

      if (Object.keys(hrUpdate).length > 0) {
        // Check if HR record exists
        const [existing] = await tx.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, id));
        if (existing) {
          await tx.update(pdsHrDetails).set(hrUpdate).where(eq(pdsHrDetails.employeeId, id));
        } else {
          await tx.insert(pdsHrDetails).values({ ...hrUpdate, employeeId: id });
        }
      }

      return { success: true };
    });
  }

  static async deleteEmployee(id: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(pdsHrDetails).where(eq(pdsHrDetails.employeeId, id));
      return await tx.delete(authentication).where(eq(authentication.id, id));
    });
  }
}
