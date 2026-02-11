import { db } from '../db/index.js';
import { authentication, employeeSkills, employeeEducation, employeeEmergencyContacts, employeeCustomFields } from '../db/schema.js';
import { eq, and, desc, InferInsertModel, SQL } from 'drizzle-orm';

type NewEmployee = InferInsertModel<typeof authentication>;
type UpdateEmployee = Partial<NewEmployee>;

export class UserService {
  static async getAllEmployees(conditions: SQL[] = []) {
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      email: authentication.email,
      department: authentication.department,
      departmentId: authentication.departmentId,
      jobTitle: authentication.jobTitle,
      employmentStatus: authentication.employmentStatus,
      role: authentication.role,
      avatarUrl: authentication.avatarUrl,
      dateHired: authentication.dateHired,
      positionTitle: authentication.positionTitle,
      positionId: authentication.positionId,
      station: authentication.station,
      appointmentType: authentication.appointmentType,
      itemNumber: authentication.itemNumber,
      salaryGrade: authentication.salaryGrade,
      birthDate: authentication.birthDate,
      gender: authentication.gender
    })
    .from(authentication)
    .where(where)
    .orderBy(authentication.lastName);
  }

  static async getEmployeeById(id: number) {
    return await db.query.authentication.findFirst({
      where: eq(authentication.id, id)
    });
  }

  static async getRelatedData(id: number) {
    const skills = await db.select()
      .from(employeeSkills)
      .where(eq(employeeSkills.employeeId, id))
      .orderBy(employeeSkills.skillName);

    const education = await db.select()
      .from(employeeEducation)
      .where(eq(employeeEducation.employeeId, id))
      .orderBy(desc(employeeEducation.startDate));

    const emergencyContacts = await db.select()
      .from(employeeEmergencyContacts)
      .where(eq(employeeEmergencyContacts.employeeId, id))
      .orderBy(desc(employeeEmergencyContacts.isPrimary));

    const customFields = await db.select()
      .from(employeeCustomFields)
      .where(eq(employeeCustomFields.employeeId, id));

    return { skills, education, emergencyContacts, customFields };
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