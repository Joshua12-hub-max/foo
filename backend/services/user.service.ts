import { db } from '../db/index.js';
import { authentication, employeeSkills, employeeEducation, employeeEmergencyContacts, employeeCustomFields, pdsFamily, pdsVoluntaryWork, pdsLearningDevelopment, pdsWorkExperience, pdsOtherInfo, pdsReferences } from '../db/schema.js';
import { eq, and, desc, SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

type NewEmployee = typeof authentication.$inferInsert;
type UpdateEmployee = Partial<NewEmployee>;

export class UserService {
  static async getAllEmployees(conditions: SQL[] = []) {
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    const auth = alias(authentication, 'auth');
    const query = db.select({
      id: auth.id,
      employeeId: auth.employeeId,
      firstName: auth.firstName,
      lastName: auth.lastName,
      middleName: auth.middleName,
      suffix: auth.suffix,
      email: auth.email,
      department: auth.department,
      departmentId: auth.departmentId,
      jobTitle: auth.jobTitle,
      employmentStatus: auth.employmentStatus,
      employmentType: auth.employmentType,
      role: auth.role,
      avatarUrl: auth.avatarUrl,
      dateHired: auth.dateHired,
      contractEndDate: auth.contractEndDate,
      regularizationDate: auth.regularizationDate,
      isRegular: auth.isRegular,
      positionTitle: auth.positionTitle,
      positionId: auth.positionId,
      station: auth.station,
      appointmentType: auth.appointmentType,
      itemNumber: auth.itemNumber,
      salaryGrade: auth.salaryGrade,
      stepIncrement: auth.stepIncrement,
      birthDate: auth.birthDate,
      gender: auth.gender,
      civilStatus: auth.civilStatus,
      nationality: auth.nationality,
      phoneNumber: auth.phoneNumber,
      address: auth.address,
      permanentAddress: auth.permanentAddress,
      umidNumber: auth.umidNumber,
      philsysId: auth.philsysId,
      philhealthNumber: auth.philhealthNumber,
      pagibigNumber: auth.pagibigNumber,
      tinNumber: auth.tinNumber,
      gsisNumber: auth.gsisNumber,
      educationalBackground: auth.educationalBackground,
      schoolName: auth.schoolName,
      course: auth.course,
      yearGraduated: auth.yearGraduated,
      skillsText: auth.skills,
      heightM: auth.heightM,
      weightKg: auth.weightKg,
      bloodType: auth.bloodType,
      placeOfBirth: auth.placeOfBirth,
      residentialAddress: auth.residentialAddress,
      residentialZipCode: auth.residentialZipCode,
      permanentZipCode: auth.permanentZipCode,
      telephoneNo: auth.telephoneNo,
      mobileNo: auth.mobileNo,
      agencyEmployeeNo: auth.agencyEmployeeNo,
      emergencyContact: auth.emergencyContact,
      emergencyContactNumber: auth.emergencyContactNumber,
      eligibilityType: auth.eligibilityType,
      eligibilityNumber: auth.eligibilityNumber,
      eligibilityDate: auth.eligibilityDate,
      highestEducation: auth.educationalBackground,
      yearsOfExperience: auth.yearsOfExperience,
      facebookUrl: auth.facebookUrl,
      linkedinUrl: auth.linkedinUrl,
      twitterHandle: auth.twitterHandle,
      firstDayOfService: auth.firstDayOfService,
      officeAddress: auth.officeAddress,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE schedules.employee_id = auth.employee_id ORDER BY schedules.updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(auth)
    .where(where)
    .orderBy(auth.lastName);


    const res = await query;
    return res;
  }

  static async getEmployeeById(id: number) {
    const auth = alias(authentication, 'auth');
    const results = await db.select({
      authentication: auth,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE schedules.employee_id = auth.employee_id ORDER BY schedules.updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(auth)
    .where(eq(auth.id, id));

    if (results.length === 0) return null;

    return {
      ...results[0].authentication,
      duties: results[0].duties
    };
  }

  static async getRelatedData(id: number) {
    const [skills, education, emergencyContacts, customFields, familyBackground, voluntaryWork, learningDevelopment, workExperience, otherInfo, references] = await Promise.all([
      db.select()
        .from(employeeSkills)
        .where(eq(employeeSkills.employeeId, id))
        .orderBy(employeeSkills.skillName),

      db.select()
        .from(employeeEducation)
        .where(eq(employeeEducation.employeeId, id))
        .orderBy(desc(employeeEducation.startDate)),

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
        .where(eq(pdsReferences.employeeId, id))
    ]);

    return { skills, education, emergencyContacts, customFields, familyBackground, voluntaryWork, learningDevelopment, workExperience, otherInfo, references };
  }

  static async createEmployee(data: NewEmployee) {
    return await db.insert(authentication).values(data);
  }

  static async updateEmployee(id: number, data: UpdateEmployee) {
    return await db.update(authentication)
      .set(data)
      .where(eq(authentication.id, id));
  }

  static async deleteEmployee(id: number) {
    return await db.delete(authentication).where(eq(authentication.id, id));
  }
}