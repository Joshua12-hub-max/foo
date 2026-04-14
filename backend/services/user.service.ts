import { db } from '../db/index.js';
import { 
  authentication, 
  employeeSkills, 
  employeeEmergencyContacts, 
  employeeCustomFields, 
  pdsFamily, 
  pdsVoluntaryWork, 
  pdsLearningDevelopment, 
  pdsWorkExperience, 
  pdsOtherInfo, 
  pdsReferences, 
  bioEnrolledUsers, 
  pdsEducation, 
  pdsEligibility, 
  pdsHrDetails, 
  pdsPersonalInformation,
  pdsDeclarations,
  employeeDocuments,
  departments, 
  schedules
} from '../db/schema.js';
import { eq, and, desc, SQL, sql, inArray, or, lte, gte } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { normalizeIdSql, normalizeIdJs } from '../utils/idUtils.js';

import * as leaveService from './leaveService.js';

type NewEmployee = typeof authentication.$inferInsert;

export class UserService {
  static async getAllEmployees(conditions: SQL[] = [], limit?: number, offset?: number) {
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch default shift times once
    const defaultShift = await leaveService.getDefaultShift();
    const defaultName = defaultShift.name || 'Standard Shift';
    const defaultTime = `${defaultShift.startTime} - ${defaultShift.endTime}`;

    // Get total count for pagination
    const countResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(authentication)
      .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
      .where(where);

    const total = Number(countResult[0]?.count || 0);

    const query = db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      // ... (other fields remain same)

      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      email: authentication.email,
      department: departments.name,
      departmentId: pdsHrDetails.departmentId,
      jobTitle: pdsHrDetails.jobTitle,
      employmentStatus: pdsHrDetails.employmentStatus,
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
      firstDayOfService: pdsHrDetails.firstDayOfService,
      officeAddress: pdsHrDetails.officeAddress,
      dutyType: pdsHrDetails.dutyType,
      isMeycauayan: pdsHrDetails.isMeycauayan,

      // Personal Info Fields
      birthDate: pdsPersonalInformation.birthDate,
      placeOfBirth: pdsPersonalInformation.placeOfBirth,
      gender: pdsPersonalInformation.gender,
      civilStatus: pdsPersonalInformation.civilStatus,
      heightM: pdsPersonalInformation.heightM,
      weightKg: pdsPersonalInformation.weightKg,
      bloodType: pdsPersonalInformation.bloodType,
      citizenship: pdsPersonalInformation.citizenship,
      citizenshipType: pdsPersonalInformation.citizenshipType,
      dualCountry: pdsPersonalInformation.dualCountry,
      mobileNo: pdsPersonalInformation.mobileNo,
      telephoneNo: pdsPersonalInformation.telephoneNo,
      umidNumber: pdsPersonalInformation.umidNumber,
      philsysId: pdsPersonalInformation.philsysId,
      philhealthNumber: pdsPersonalInformation.philhealthNumber,
      pagibigNumber: pdsPersonalInformation.pagibigNumber,
      sssNumber: pdsPersonalInformation.sssNumber,
      tinNumber: pdsPersonalInformation.tinNumber,
      gsisNumber: pdsPersonalInformation.gsisNumber,
      agencyEmployeeNo: pdsPersonalInformation.agencyEmployeeNo,
      resHouseBlockLot: pdsPersonalInformation.resHouseBlockLot,
      resStreet: pdsPersonalInformation.resStreet,
      resSubdivision: pdsPersonalInformation.resSubdivision,
      resBarangay: pdsPersonalInformation.resBarangay,
      resCity: pdsPersonalInformation.resCity,
      resProvince: pdsPersonalInformation.resProvince,
      resRegion: pdsPersonalInformation.resRegion,
      residentialZipCode: pdsPersonalInformation.residentialZipCode,
      permHouseBlockLot: pdsPersonalInformation.permHouseBlockLot,
      permStreet: pdsPersonalInformation.permStreet,
      permSubdivision: pdsPersonalInformation.permSubdivision,
      permBarangay: pdsPersonalInformation.permBarangay,
      permCity: pdsPersonalInformation.permCity,
      permProvince: pdsPersonalInformation.permProvince,
      permRegion: pdsPersonalInformation.permRegion,
      permanentZipCode: pdsPersonalInformation.permanentZipCode,
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(pdsPersonalInformation, eq(authentication.id, pdsPersonalInformation.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(where)
    .orderBy(authentication.lastName);

    if (limit !== undefined && offset !== undefined) {
      query.limit(limit).offset(offset);
    }

    const employees = await query;
    if (employees.length === 0) return { employees: [], total: 0, page: 1, totalPages: 1 };

    const employeeIds = employees.map(e => e.employeeId).filter((id): id is string => !!id);

    // BATCH FETCH: Get all current active schedules for these employees
    // This is 100x faster than 2 subqueries per row.
    const today = new Date().toISOString().split('T')[0];
    const activeSchedules = await db.select({
      employeeId: schedules.employeeId,
      scheduleTitle: schedules.scheduleTitle,
      startTime: schedules.startTime,
      endTime: schedules.endTime
    })
    .from(schedules)
    .where(and(
      inArray(schedules.employeeId, employeeIds),
      or(sql`${schedules.startDate} IS NULL`, lte(schedules.startDate, today)),
      or(sql`${schedules.endDate} IS NULL`, gte(schedules.endDate, today))
    ))
    .orderBy(desc(schedules.updatedAt));

    // BATCH FETCH: Get biometric enrollment status
    const enrolledUsers = await db.select({ employeeId: bioEnrolledUsers.employeeId })
      .from(bioEnrolledUsers)
      .where(inArray(bioEnrolledUsers.employeeId, employeeIds));
    
    const enrolledSet = new Set(enrolledUsers.map(u => u.employeeId));

    // Map schedules to a lookup object
    const scheduleMap = new Map<string, { duties: string; shift: string }>();
    activeSchedules.forEach(s => {
      if (!scheduleMap.has(s.employeeId)) {
        const timeStr = `${s.startTime} - ${s.endTime}`; // Simple format for now, can be optimized further
        scheduleMap.set(s.employeeId, { 
          duties: s.scheduleTitle || defaultName, 
          shift: timeStr 
        });
      }
    });

    return {
      employees: employees.map(emp => {
        const sched = emp.employeeId ? scheduleMap.get(emp.employeeId) : null;
        return {
          ...emp,
          duties: sched?.duties || defaultName,
          shift: sched?.shift || defaultTime,
          isBiometricEnrolled: emp.employeeId ? enrolledSet.has(emp.employeeId) : false
        };
      }),
      total,
      page: limit ? Math.floor(offset! / limit) + 1 : 1,
      totalPages: limit ? Math.ceil(total / limit) : 1
    };
  }

  static async getEmployeeById(id: number) {
    // Fetch default shift times once
    const defaultShift = await leaveService.getDefaultShift();
    const defaultName = defaultShift.name || 'Standard Shift';
    const defaultTime = `${defaultShift.startTime} - ${defaultShift.endTime}`;

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
      dutyType: pdsHrDetails.dutyType,
      isMeycauayan: pdsHrDetails.isMeycauayan,

      // Personal Info Fields
      birthDate: pdsPersonalInformation.birthDate,
      placeOfBirth: pdsPersonalInformation.placeOfBirth,
      gender: pdsPersonalInformation.gender,
      civilStatus: pdsPersonalInformation.civilStatus,
      heightM: pdsPersonalInformation.heightM,
      weightKg: pdsPersonalInformation.weightKg,
      bloodType: pdsPersonalInformation.bloodType,
      citizenship: pdsPersonalInformation.citizenship,
      citizenshipType: pdsPersonalInformation.citizenshipType,
      dualCountry: pdsPersonalInformation.dualCountry,
      mobileNo: pdsPersonalInformation.mobileNo,
      telephoneNo: pdsPersonalInformation.telephoneNo,
      umidNumber: pdsPersonalInformation.umidNumber,
      philsysId: pdsPersonalInformation.philsysId,
      philhealthNumber: pdsPersonalInformation.philhealthNumber,
      pagibigNumber: pdsPersonalInformation.pagibigNumber,
      sssNumber: pdsPersonalInformation.sssNumber,
      tinNumber: pdsPersonalInformation.tinNumber,
      gsisNumber: pdsPersonalInformation.gsisNumber,
      agencyEmployeeNo: pdsPersonalInformation.agencyEmployeeNo,
      resHouseBlockLot: pdsPersonalInformation.resHouseBlockLot,
      resStreet: pdsPersonalInformation.resStreet,
      resSubdivision: pdsPersonalInformation.resSubdivision,
      resBarangay: pdsPersonalInformation.resBarangay,
      resCity: pdsPersonalInformation.resCity,
      resProvince: pdsPersonalInformation.resProvince,
      resRegion: pdsPersonalInformation.resRegion,
      residentialZipCode: pdsPersonalInformation.residentialZipCode,
      permHouseBlockLot: pdsPersonalInformation.permHouseBlockLot,
      permStreet: pdsPersonalInformation.permStreet,
      permSubdivision: pdsPersonalInformation.permSubdivision,
      permBarangay: pdsPersonalInformation.permBarangay,
      permCity: pdsPersonalInformation.permCity,
      permProvince: pdsPersonalInformation.permProvince,
      permRegion: pdsPersonalInformation.permRegion,
      permanentZipCode: pdsPersonalInformation.permanentZipCode,
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(pdsPersonalInformation, eq(authentication.id, pdsPersonalInformation.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(eq(authentication.id, id))
    .limit(1);

    const emp = results[0];
    if (!emp) return null;

    if (emp.employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const [activeSched] = await db.select({
          scheduleTitle: schedules.scheduleTitle,
          startTime: schedules.startTime,
          endTime: schedules.endTime
        })
        .from(schedules)
        .where(and(
          eq(schedules.employeeId, emp.employeeId),
          or(sql`${schedules.startDate} IS NULL`, lte(schedules.startDate, today)),
          or(sql`${schedules.endDate} IS NULL`, gte(schedules.endDate, today))
        ))
        .orderBy(desc(schedules.updatedAt))
        .limit(1);

        const [isEnrolled] = await db.select({ count: sql<number>`COUNT(*)` })
          .from(bioEnrolledUsers)
          .where(eq(bioEnrolledUsers.employeeId, emp.employeeId));

        return {
          ...emp,
          duties: activeSched?.scheduleTitle || defaultName,
          shift: activeSched ? `${activeSched.startTime} - ${activeSched.endTime}` : defaultTime,
          isBiometricEnrolled: isEnrolled.count > 0
        };
    }

    return {
      ...emp,
      duties: defaultName,
      shift: defaultTime,
      isBiometricEnrolled: false
    };
  }


  static async getRelatedData(id: number) {
    const [skills, education, emergencyContacts, customFields, familyBackground, voluntaryWork, learningDevelopment, workExperience, otherInfo, references, eligibilities, declarations, documents] = await Promise.all([
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
        .where(eq(pdsEligibility.employeeId, id)),

      db.select()
        .from(pdsDeclarations)
        .where(eq(pdsDeclarations.employeeId, id))
        .limit(1),

      db.select()
        .from(employeeDocuments)
        .where(eq(employeeDocuments.employeeId, id))
    ]);

    return {
      skills,
      education,
      emergencyContacts,
      customFields,
      familyBackground,
      voluntaryWork,
      learningDevelopment,
      workExperience,
      otherInfo,
      references,
      eligibilities,
      declarations: declarations[0] || null,
      documents
    };
  }


  static async createEmployee(data: NewEmployee & { password?: string; employmentStatus?: string; employmentType?: string; departmentId?: number; positionId?: number; salaryGrade?: string | number; stepIncrement?: number; dateHired?: string; contractEndDate?: string; regularizationDate?: string; isRegular?: boolean; positionTitle?: string; station?: string; appointmentType?: string; itemNumber?: string; firstDayOfService?: string; officeAddress?: string; religion?: string; barangay?: string; dutyType?: string; isMeycauayan?: boolean; facebookUrl?: string; linkedinUrl?: string; twitterHandle?: string; birthDate?: string; placeOfBirth?: string; gender?: string; civilStatus?: string; heightM?: string | number; weightKg?: string | number; bloodType?: string; citizenship?: string; nationality?: string; residentialAddress?: string; address?: string; permanentAddress?: string; mobileNo?: string; phoneNumber?: string; telephoneNo?: string; jobTitle?: string }) {
    return await db.transaction(async (tx) => {
      // 1. Split data
      const authData: NewEmployee = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        suffix: data.suffix,
        email: data.email,
        role: data.role || 'employee',
        employeeId: data.employeeId ? normalizeIdJs(data.employeeId) : undefined,
        avatarUrl: data.avatarUrl,
        passwordHash: data.password ? await bcrypt.hash(data.password, 10) : undefined,
      };

      const [authResult] = await tx.insert(authentication).values(authData);
      const newId = Number((authResult as { insertId: number | string }).insertId);

      // 2. Prepare HR data
      const hrData: typeof pdsHrDetails.$inferInsert = {
        employeeId: newId,
        employmentStatus: (data.employmentStatus as 'Active' | 'Probationary' | 'Terminated' | 'Resigned' | 'On Leave' | 'Suspended' | 'Verbal Warning' | 'Written Warning' | 'Show Cause') || 'Active',
        jobTitle: data.jobTitle || null,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        salaryGrade: data.salaryGrade ? String(data.salaryGrade) : null,
        stepIncrement: data.stepIncrement || 1,
        dateHired: data.dateHired || null,
        contractEndDate: data.contractEndDate || null,
        regularizationDate: data.regularizationDate || null,
        isRegular: !!data.isRegular,
        positionTitle: data.positionTitle || null,
        station: data.station || null,
        appointmentType: (data.appointmentType as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS') || null,
        itemNumber: data.itemNumber || null,
        firstDayOfService: data.firstDayOfService || null,
        officeAddress: data.officeAddress || null,
        dutyType: (data.dutyType as 'Standard' | 'Irregular') || 'Standard',
        isMeycauayan: !!data.isMeycauayan,
      };

      await tx.insert(pdsHrDetails).values(hrData);

      // 3. Prepare Personal Info data
      const personalData: typeof pdsPersonalInformation.$inferInsert = {
        employeeId: newId,
        birthDate: data.birthDate || null,
        placeOfBirth: data.placeOfBirth || null,
        gender: (data.gender as 'Male' | 'Female') || null,
        civilStatus: (data.civilStatus as 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled') || null,
        heightM: data.heightM ? String(data.heightM) : null,
        weightKg: data.weightKg ? String(data.weightKg) : null,
        bloodType: data.bloodType || null,
        citizenship: data.citizenship || data.nationality || 'Filipino',
        mobileNo: data.mobileNo || data.phoneNumber || null,
        telephoneNo: data.telephoneNo || null,
      };

      await tx.insert(pdsPersonalInformation).values(personalData);

      return authResult;
    });
  }

  static async updateEmployee(id: number, data: Partial<NewEmployee> & Record<string, unknown>) {
    return await db.transaction(async (tx) => {
      // 1. Auth fields
      const authFields = ['firstName', 'lastName', 'middleName', 'suffix', 'email', 'role', 'employeeId', 'avatarUrl', 'rfidCardUid'];
      const authUpdate: Record<string, unknown> = {};
      authFields.forEach(f => { 
        if (data[f] !== undefined) {
          if (f === 'employeeId' && data[f]) authUpdate[f] = normalizeIdJs(data[f] as string);
          else authUpdate[f] = data[f];
        }
      });

      if (Object.keys(authUpdate).length > 0) {
        await tx.update(authentication).set(authUpdate).where(eq(authentication.id, id));
      }

      // 2. HR fields
      const hrFields = [
        'employmentStatus', 'jobTitle', 'departmentId', 'positionId',
        'salaryGrade', 'stepIncrement', 'dateHired', 'contractEndDate', 'regularizationDate',
        'isRegular', 'positionTitle', 'station', 'appointmentType', 'itemNumber',
        'firstDayOfService', 'officeAddress', 'dutyType',
        'isMeycauayan', 'facebookUrl', 'linkedinUrl', 'twitterHandle', 'managerId'
      ];
      const hrUpdate: Record<string, unknown> = {};
      hrFields.forEach(f => { if (data[f] !== undefined) hrUpdate[f] = data[f]; });

      if (Object.keys(hrUpdate).length > 0) {
        const [existing] = await tx.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, id));
        if (existing) {
          await tx.update(pdsHrDetails).set(hrUpdate).where(eq(pdsHrDetails.employeeId, id));
        } else {
          await tx.insert(pdsHrDetails).values({ ...hrUpdate, employeeId: id } as typeof pdsHrDetails.$inferInsert);
        }
      }

      // 3. Personal Info fields
      const personalFields = [
        'birthDate', 'placeOfBirth', 'gender', 'civilStatus', 'heightM', 'weightKg',
        'bloodType', 'citizenship', 'citizenshipType', 'dualCountry', 'residentialAddress', 'permanentAddress',
        'mobileNo', 'telephoneNo', 'nationality', 'phoneNumber',
        'umidNumber', 'philsysId', 'philhealthNumber', 'pagibigNumber', 'tinNumber', 'gsisNumber', 'agencyEmployeeNo',
        'resHouseBlockLot', 'resStreet', 'resSubdivision', 'resBarangay', 'resCity', 'resProvince', 'resRegion',
        'permHouseBlockLot', 'permStreet', 'permSubdivision', 'permBarangay', 'permCity', 'permProvince', 'permRegion',
        'residentialZipCode', 'permanentZipCode'
      ];
      const personalUpdate: Record<string, unknown> = {};
      personalFields.forEach(f => { 
        if (data[f] !== undefined) {
          if (f === 'nationality') personalUpdate['citizenship'] = data[f];
          else if (f === 'phoneNumber') personalUpdate['mobileNo'] = data[f];
          else personalUpdate[f] = data[f];
        }
      });

      if (Object.keys(personalUpdate).length > 0) {
        const [existing] = await tx.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, id));
        if (existing) {
          await tx.update(pdsPersonalInformation).set(personalUpdate).where(eq(pdsPersonalInformation.employeeId, id));
        } else {
          await tx.insert(pdsPersonalInformation).values({ ...personalUpdate, employeeId: id } as typeof pdsPersonalInformation.$inferInsert);
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
