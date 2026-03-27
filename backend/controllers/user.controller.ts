import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import path from 'path';
import { db } from '../db/index.js';
import { eq, and, sql, desc, ne, InferSelectModel, SQL, or, lte, gte, inArray } from 'drizzle-orm';
import type { AuthenticatedRequest, EmploymentStatus, Gender, CivilStatus, AppointmentType, UserRole } from '../types/index.js';
import { UserService } from '../services/user.service.js';
import { convertTo24Hour } from '../utils/dateUtils.js';
import { AuditService } from '../services/audit.service.js';
import { 
  authentication, 
  departments, 
  plantillaPositions, 
  plantillaPositionHistory,
  employeeSkills, 
  employeeEducation, 
  employeeEmergencyContacts, 
  employeeCustomFields,
  schedules,
  pdsFamily,
  pdsVoluntaryWork,
  pdsLearningDevelopment,
  pdsWorkExperience,
  pdsOtherInfo,
  pdsReferences,
  pdsEducation,
  pdsEligibility,
  recruitmentApplicants,
  employeeDocuments,
  shiftTemplates,
  pdsPersonalInformation,
  pdsDeclarations,
  pdsHrDetails,
  bioEnrolledUsers
} from '../db/schema.js';
import { 
  EmployeeApiResponse, 
  EmployeeFamilyResponse,
  VoluntaryWorkResponse,
  LearningDevelopmentResponse,
  WorkplaceExperienceResponse,
  EmployeeMapperInput,
  EmployeeSkillsResponse, 
  EmployeeEducationResponse, 
  EmployeeEmergencyContactResponse, 
  EmployeeCustomFieldResponse,
  PdsOtherInfoResponse,
  PdsReferenceResponse,
  EmployeeEligibilityResponse
} from '../types/employee.js';
import { 
  CreateEmployeeSchema, 
  UpdateEmployeeSchema, 
  RevertStatusSchema,
  AddSkillSchema,
  AddEducationSchema,
  AddContactSchema,
  AddCustomFieldSchema,
  UpdateCustomFieldSchema,
  UpdateEmployeeInput,
  UpdateSkillSchema,
  UpdateEducationSchema,
  UpdateContactSchema
} from '../schemas/employeeSchema.js';
import { formatFullName } from '../utils/nameUtils.js';
import { checkSystemWideUniqueness } from '../services/validationService.js';
import { PdsQuestions } from '../schemas/pdsSchema.js';
import { normalizeIdSql } from '../utils/idUtils.js';


// Standardized role type from global types

interface UpdateFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  departmentId?: number | null;
  jobTitle?: string;
  role?: UserRole;
  employmentStatus?: EmploymentStatus;
  employeeId?: string;
  birthDate?: string | null;
  gender?: Gender;
  civilStatus?: CivilStatus;
  nationality?: string;
  phoneNumber?: string | null;
  address?: string | null;
  permanentAddress?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  educationalBackground?: string | null;
  salaryGrade?: string | null;
  stepIncrement?: number;
  appointmentType?: AppointmentType;
  station?: string | null;
  positionTitle?: string | null;
  itemNumber?: string | null;
  positionId?: number | null;
  dateHired?: string | null;
  avatarUrl?: string | null;
  contractEndDate?: string | null;
  regularizationDate?: string | null;
  isRegular?: boolean;
  employmentType?: string;
  heightM?: string | null;
  weightKg?: string | null;
  bloodType?: string | null;
  placeOfBirth?: string | null;

  residentialAddress?: string | null;
  residentialZipCode?: string | null;
  permanentZipCode?: string | null;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  agencyEmployeeNo?: string | null;
  emergencyContact?: string | null;
  emergencyContactNumber?: string | null;
  eligibilityType?: string | null;
  eligibilityNumber?: string | null;
  eligibilityDate?: string | null;
  yearsOfExperience?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  middleName?: string | null;
  firstDayOfService?: string | null;
  officeAddress?: string | null;
  originalAppointmentDate?: string | null;
  lastPromotionDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isMeycauayan?: boolean;
  dateAccomplished?: string | null;
  pdsQuestions?: PdsQuestions | null;
  [key: string]: string | number | boolean | null | undefined | PdsQuestions;
}

// ============================================================================
// HELPERS
// ============================================================================

export const mapToEmployeeApi = (emp: EmployeeMapperInput): EmployeeApiResponse => {
  return {
    id: emp.id,
    employeeName: formatFullName(emp.lastName, emp.firstName, emp.middleName, emp.suffix),
    firstName: String(emp.firstName || ''),
    lastName: String(emp.lastName || ''),
    middleName: emp.middleName || null,
    suffix: emp.suffix || null,
    email: String(emp.email || ''),
    role: (emp.role === 'Human Resource' ? 'Human Resource' : (emp.role === 'Administrator' ? 'Administrator' : 'Employee')) as UserRole,
    department: emp.department || null,
    departmentId: emp.departmentId || null,
    employeeId: String(emp.employeeId || ''),
    jobTitle: emp.jobTitle || null,
    positionTitle: emp.positionTitle || null,
    employmentStatus: emp.employmentStatus as EmploymentStatus || null,
    employmentType: emp.employmentType || null,
    dateHired: emp.dateHired || null,
    contractEndDate: emp.contractEndDate || null,
    regularizationDate: emp.regularizationDate || null,
    isRegular: !!emp.isRegular,
    avatarUrl: emp.avatarUrl || null,
    salaryGrade: emp.salaryGrade || null,
    stepIncrement: emp.stepIncrement || 1,
    appointmentType: emp.appointmentType as AppointmentType || null,
    station: emp.station || null,
    itemNumber: emp.itemNumber || null,
    positionId: emp.positionId || null,
    duties: emp.duties || 'No Schedule',
    shift: emp.shift || null,
    
    facebookUrl: emp.facebookUrl || null,
    linkedinUrl: emp.linkedinUrl || null,
    twitterHandle: emp.twitterHandle || null,

    firstDayOfService: emp.firstDayOfService || null,
    officeAddress: emp.officeAddress || null,
    originalAppointmentDate: emp.originalAppointmentDate || null,
    lastPromotionDate: emp.lastPromotionDate || null,

    barangay: emp.resBarangay || null,
    religion: emp.religion || null,
    isBiometricEnrolled: !!emp.isBiometricEnrolled,
    startTime: emp.startTime || null,
    endTime: emp.endTime || null,
    isMeycauayan: emp.isMeycauayan === true,
    dutyType: emp.dutyType || null,

    // PDS Personal Info Fields
    birthDate: emp.birthDate ? String(emp.birthDate) : null,
    placeOfBirth: String(emp.placeOfBirth || ''),
    gender: String(emp.gender || ''),
    civilStatus: String(emp.civilStatus || ''),
    heightM: emp.heightM ? Number(emp.heightM) : null,
    weightKg: emp.weightKg ? Number(emp.weightKg) : null,
    bloodType: String(emp.bloodType || ''),
    citizenship: String(emp.citizenship || ''),
    residentialAddress: String(emp.residentialAddress || ''),
    permanentAddress: String(emp.permanentAddress || ''),
    mobileNo: String(emp.mobileNo || ''),
    telephoneNo: String(emp.telephoneNo || ''),
    umidNumber: emp.umidNumber || null,
    philsysId: emp.philsysId || null,
    philhealthNumber: emp.philhealthNumber || null,
    pagibigNumber: emp.pagibigNumber || null,
    tinNumber: emp.tinNumber || null,
    gsisNumber: emp.gsisNumber || null,
    agencyEmployeeNo: emp.agencyEmployeeNo || null,
    resHouseBlockLot: emp.resHouseBlockLot || null,
    resStreet: emp.resStreet || null,
    resSubdivision: emp.resSubdivision || null,
    resBarangay: emp.resBarangay || null,
    resCity: emp.resCity || null,
    resProvince: emp.resProvince || null,
    resRegion: emp.resRegion || null,
    permHouseBlockLot: emp.permHouseBlockLot || null,
    permStreet: emp.permStreet || null,
    permSubdivision: emp.permSubdivision || null,
    permBarangay: emp.permBarangay || null,
    permCity: emp.permCity || null,
    permProvince: emp.permProvince || null,
    permRegion: emp.permRegion || null,
  };
};

const mapToSkillApi = (skill: InferSelectModel<typeof employeeSkills>): EmployeeSkillsResponse => ({
  id: skill.id,
  skillName: skill.skillName,
  category: skill.category || 'Technical',
  proficiencyLevel: skill.proficiencyLevel || 'Intermediate',
  yearsExperience: skill.yearsExperience ? Number(skill.yearsExperience) : null
});

const mapToEducationApi = (edu: InferSelectModel<typeof pdsEducation>): EmployeeEducationResponse => ({
  id: edu.id,
  institution: edu.schoolName || '',
  degree: edu.degreeCourse || null,
  fieldOfStudy: null,
  startDate: edu.dateFrom ? String(edu.dateFrom) : null,
  endDate: edu.dateTo ? String(edu.dateTo) : null,
  isCurrent: false,
  level: edu.level,
  yearGraduated: edu.yearGraduated ? String(edu.yearGraduated) : null,
  honors: edu.honors,
  unitsEarned: edu.unitsEarned
});

const mapToEligibilityApi = (el: InferSelectModel<typeof pdsEligibility>): EmployeeEligibilityResponse => ({
  id: el.id,
  eligibilityType: el.eligibilityName || '',
  rating: el.rating,
  examDate: el.examDate,
  examPlace: el.examPlace,
  eligibilityNumber: el.licenseNumber,
  validityDate: el.validityDate
});

const mapToContactApi = (contact: InferSelectModel<typeof employeeEmergencyContacts>): EmployeeEmergencyContactResponse => ({
  id: contact.id,
  name: contact.name,
  relationship: contact.relationship,
  phoneNumber: contact.phoneNumber,
  email: contact.email || null,
  address: contact.address || null,
  isPrimary: contact.isPrimary || false
});

const mapToCustomFieldApi = (field: InferSelectModel<typeof employeeCustomFields>): EmployeeCustomFieldResponse => ({
  id: field.id,
  section: field.section,
  fieldName: field.fieldName,
  fieldValue: field.fieldValue || null
});

const mapToFamilyApi = (fam: InferSelectModel<typeof pdsFamily>): EmployeeFamilyResponse => ({
  id: fam.id,
  relationType: fam.relationType,
  lastName: fam.lastName,
  firstName: fam.firstName,
  middleName: fam.middleName,
  nameExtension: fam.nameExtension,
  occupation: fam.occupation,
  employer: fam.employer,
  businessAddress: fam.businessAddress,
  telephoneNo: fam.telephoneNo,
  dateOfBirth: fam.dateOfBirth
});

const mapToVoluntaryWorkApi = (vw: InferSelectModel<typeof pdsVoluntaryWork>): VoluntaryWorkResponse => ({
  id: vw.id,
  organizationName: vw.organizationName,
  address: vw.address,
  dateFrom: vw.dateFrom,
  dateTo: vw.dateTo,
  hoursNumber: vw.hoursNumber,
  position: vw.position
});

const mapToLdApi = (ld: InferSelectModel<typeof pdsLearningDevelopment>): LearningDevelopmentResponse => ({
  id: ld.id,
  title: ld.title,
  dateFrom: ld.dateFrom,
  dateTo: ld.dateTo,
  hoursNumber: ld.hoursNumber,
  typeOfLd: ld.typeOfLd,
  conductedBy: ld.conductedBy
});

const mapToWorkExperienceApi = (we: InferSelectModel<typeof pdsWorkExperience>): WorkplaceExperienceResponse => ({
  id: we.id,
  dateFrom: we.dateFrom,
  dateTo: we.dateTo,
  positionTitle: we.positionTitle,
  companyName: we.companyName,
  monthlySalary: we.monthlySalary,
  salaryGrade: we.salaryGrade,
  appointmentStatus: we.appointmentStatus,
  isGovernment: !!we.isGovernment
});

const mapToOtherInfoApi = (oi: InferSelectModel<typeof pdsOtherInfo>): PdsOtherInfoResponse => ({
  id: oi.id,
  type: oi.type,
  description: oi.description
});

const mapToReferencesApi = (ref: InferSelectModel<typeof pdsReferences>): PdsReferenceResponse => ({
  id: ref.id,
  name: ref.name,
  address: ref.address,
  telNo: ref.telNo
});

const sanitizePDSFields = (updates: UpdateEmployeeInput): UpdateEmployeeInput => {
  // Auto-convert Height (cm -> m) if likely in cm (> 3 meters is unlikely for humans)
  if (updates.heightM && updates.heightM > 3) {

    updates.heightM = parseFloat((updates.heightM / 100).toFixed(2));
  }
  
  // Auto-convert Weight to be safe (if in grams > 1000)
  if (updates.weightKg && updates.weightKg > 1000) {

     updates.weightKg = parseFloat((updates.weightKg / 1000).toFixed(2));
  }

  // Ensure precision for DECIMAL(4,2)
  if (updates.heightM) updates.heightM = parseFloat(Number(updates.heightM).toFixed(2));
  if (updates.weightKg) updates.weightKg = parseFloat(Number(updates.weightKg).toFixed(2));

  return updates;
};

// ============================================================================
// EMPLOYEE CRUD OPERATIONS
// ============================================================================

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, departmentId } = req.query;
    
    const conditions: SQL[] = [];
    if (departmentId) {
      conditions.push(eq(pdsHrDetails.departmentId, Number(departmentId)));
    } else if (department && department !== 'All Departments' && department !== 'All') {
      conditions.push(eq(departments.name, department as string));
    }

    const employees = await UserService.getAllEmployees(conditions.filter((c): c is SQL => !!c));

    const mappedEmployees = employees.map(mapToEmployeeApi);
    res.json({ success: true, employees: mappedEmployees });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    console.warn(`[DEBUG] Fetching employee profile for ID: ${id}`);
    
    const [employeeData, relatedData] = await Promise.all([
      UserService.getEmployeeById(parseInt(id)),
      UserService.getRelatedData(parseInt(id))
    ]);

    if (!employeeData) {
      console.warn(`[DEBUG] Employee not found for ID: ${id}`);
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    console.warn(`[DEBUG] Found employee data for: ${employeeData.firstName} ${employeeData.lastName}`);

    // Security: PII Filtering
    const authReq = req as AuthenticatedRequest;
    const requester = authReq.user;
    const isSelf = requester.id === parseInt(id);
    const roleLower = requester.role?.toLowerCase() || '';
    const isAdmin = ['administrator', 'human resource'].includes(roleLower);

    if (!isSelf && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access Denied: You can only view your own profile.' });
      return;
    }

    console.warn(`[DEBUG] Mapping employee profile data...`);
    // Map everything to the strict API response format
    const mappedEmployee = mapToEmployeeApi(employeeData);
    const { skills, education, emergencyContacts, customFields, familyBackground, voluntaryWork, learningDevelopment, workExperience, otherInfo, references, eligibilities, declarations } = relatedData;

    console.warn(`[DEBUG] Related data counts: Skills=${skills.length}, Edu=${education.length}, Eligibilities=${eligibilities.length}`);

    // Filter contacts for non-admins
    const finalContacts = !isSelf && !isAdmin ? [] : emergencyContacts;

    const response = {
      success: true,
      employee: {
        ...mappedEmployee,
        skills: skills.map(mapToSkillApi),
        education: (education as InferSelectModel<typeof pdsEducation>[]).map(mapToEducationApi),
        emergencyContacts: finalContacts.map(mapToContactApi),
        customFields: customFields.map(mapToCustomFieldApi),
        familyBackground: familyBackground.map(mapToFamilyApi),
        voluntaryWork: voluntaryWork.map(mapToVoluntaryWorkApi),
        learningDevelopment: learningDevelopment.map(mapToLdApi),
        workExperience: workExperience.map(mapToWorkExperienceApi),
        otherInfo: otherInfo.map(mapToOtherInfoApi),
        references: references.map(mapToReferencesApi),
        eligibilities: eligibilities.map(mapToEligibilityApi),
        declarations: declarations
      }
    };

    console.warn(`[DEBUG] Successfully built response for employee ID: ${id}`);
    res.json(response);
  } catch (error) {
    console.error('[ERROR] Failed to fetch employee profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CreateEmployeeSchema.parse(req.body);
    const {
      firstName, lastName, email, department, departmentId, jobTitle, role,
      employmentStatus, employeeId, password,
      birthDate, gender, civilStatus, nationality,
      phoneNumber, address, permanentAddress,
      philhealthNumber, pagibigNumber, tinNumber, gsisNumber, umidNumber,
      salaryGrade, stepIncrement, appointmentType, station, positionTitle,
      itemNumber, positionId, dateAccomplished, pdsQuestions
    } = validatedData;

    // Validate department
    let finalDeptId = departmentId;
    let finalDeptName = department;

    if (finalDeptId) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, finalDeptId)
      });
      if (!dept) {
        res.status(400).json({ success: false, message: 'Invalid department ID' });
        return;
      }
      finalDeptName = dept.name;
    } else if (finalDeptName) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.name, finalDeptName)
      });
      if (!dept) {
        res.status(400).json({ success: false, message: 'Invalid department' });
        return;
      }
      finalDeptId = dept.id;
    }

    // Check system-wide uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email,
        umidNumber: validatedData.umidNumber,
        philsysId: validatedData.philsysId,
        philhealthNumber: validatedData.philhealthNumber,
        pagibigNumber: validatedData.pagibigNumber,
        tinNumber: validatedData.tinNumber,
        gsisNumber: validatedData.gsisNumber
    });

    if (Object.keys(uniqueErrors).length > 0) {
        res.status(409).json({ success: false, message: 'Uniqueness validation failed.', errors: uniqueErrors });
        return;
    }

    // Generate Sequential Numeric ID if not provided
    let finalEmployeeId = employeeId;
    if (!finalEmployeeId) {
       // Find last numeric ID to increment (interpreted as number even with prefix)
       const lastIdResult = await db.select({
         maxId: sql<number>`MAX(CAST(REGEXP_REPLACE(employee_id, '[^0-9]', '') AS UNSIGNED))`
       })
       .from(authentication);

       const nextSeq = (lastIdResult[0]?.maxId || 0) + 1;
       // Format back to Emp-XXX as requested by user
       finalEmployeeId = `Emp-${String(nextSeq).padStart(3, '0')}`;
    }

    // Hash password
    const passwordToHash = password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    // Handle Plantilla — validation only, actual update after employee insert
    let finalItemNumber = itemNumber || null;
    let finalPosId = positionId || null;
    let plantillaPositionTitle: string | null = null;

    if (finalPosId) {
      const plantilla = await db.query.plantillaPositions.findFirst({
        where: eq(plantillaPositions.id, finalPosId)
      });
      if (plantilla) {
        if (!plantilla.isVacant) {
          res.status(409).json({ success: false, message: `Plantilla Item ${plantilla.itemNumber} is already filled.` });
          return;
        }
        finalItemNumber = plantilla.itemNumber;
        plantillaPositionTitle = plantilla.positionTitle;
      }
    } else if (finalItemNumber && finalItemNumber !== 'N/A') {
      const plantilla = await db.query.plantillaPositions.findFirst({
        where: eq(plantillaPositions.itemNumber, finalItemNumber)
      });
      if (plantilla) {
        if (!plantilla.isVacant) {
          res.status(409).json({ success: false, message: `Plantilla Item ${finalItemNumber} is already filled.` });
          return;
        }
        finalPosId = plantilla.id;
        plantillaPositionTitle = plantilla.positionTitle;
      }
    }

    // Auto-calculate Regularization Date for Probationary
    let finalRegularizationDate = null;
    if (validatedData.employmentType === 'Probationary' && !validatedData.regularizationDate) {
        const hireDate = new Date(validatedData.dateHired || Date.now());
        hireDate.setMonth(hireDate.getMonth() + 6);
        finalRegularizationDate = hireDate;
    } else if (validatedData.regularizationDate) {
        finalRegularizationDate = new Date(validatedData.regularizationDate);
    }

    // Sanitize PDS fields (height/weight conversion)
    const sanitizedData = sanitizePDSFields({ ...validatedData });

    // 2. Insert Authentication Record
    const [result] = await db.insert(authentication).values({
      firstName,
      lastName,
      email,
      role: role,
      employeeId: finalEmployeeId,
      passwordHash: hashedPassword,
      isVerified: true,
    });

    const newEmployeeIdNum = result.insertId;

    if (newEmployeeIdNum) {
      // 3. Insert HR Details
      await db.insert(pdsHrDetails).values({
        employeeId: newEmployeeIdNum,
        employmentStatus: employmentStatus || 'Active',
        employmentType: (sanitizedData.employmentType || 'Probationary'),
        jobTitle: jobTitle || 'N/A',
        positionTitle: positionTitle || null,
        departmentId: finalDeptId,
        salaryGrade: salaryGrade ? String(salaryGrade) : null,
        stepIncrement: stepIncrement || 1,
        appointmentType: appointmentType,
        station: station || null,
        itemNumber: finalItemNumber,
        positionId: finalPosId,
        dateHired: String(validatedData.dateHired || new Date().toISOString().split('T')[0]),
        contractEndDate: sanitizedData.contractEndDate ? String(sanitizedData.contractEndDate) : null,
        regularizationDate: finalRegularizationDate ? finalRegularizationDate.toISOString().split('T')[0] : null,
        isRegular: !!sanitizedData.isRegular,
        isMeycauayan: sanitizedData.isMeycauayan === true
      });
      await db.insert(pdsPersonalInformation).values({
        employeeId: newEmployeeIdNum,
        birthDate: birthDate ? String(birthDate) : null,
        placeOfBirth: sanitizedData.placeOfBirth || null,
        gender: gender || null,
        civilStatus: civilStatus || null,
        heightM: sanitizedData.heightM ? String(sanitizedData.heightM) : null,
        weightKg: sanitizedData.weightKg ? String(sanitizedData.weightKg) : null,
        bloodType: sanitizedData.bloodType || null,
        citizenship: nationality || 'Filipino',
        citizenshipType: sanitizedData.citizenshipType || null,
        dualCountry: sanitizedData.dualCountry || null,
        residentialAddress: address || sanitizedData.residentialAddress || null,
        residentialZipCode: sanitizedData.residentialZipCode || null,
        permanentAddress: permanentAddress || null,
        permanentZipCode: sanitizedData.permanentZipCode || null,
        telephoneNo: sanitizedData.telephoneNo || null,
        mobileNo: phoneNumber || sanitizedData.mobileNo || null,
        email: email,
        umidNumber: umidNumber || null,
        philsysId: sanitizedData.philsysId || null,
        philhealthNumber: philhealthNumber || null,
        pagibigNumber: pagibigNumber || null,
        tinNumber: tinNumber || null,
        gsisNumber: gsisNumber || null,
        agencyEmployeeNo: sanitizedData.agencyEmployeeNo || null,
        resHouseBlockLot: sanitizedData.resHouseBlockLot || null,
        resStreet: sanitizedData.resStreet || null,
        resSubdivision: sanitizedData.resSubdivision || null,
        resBarangay: sanitizedData.resBarangay || null,
        resCity: sanitizedData.resCity || null,
        resProvince: sanitizedData.resProvince || null,
        resRegion: sanitizedData.resRegion || null,
        permHouseBlockLot: sanitizedData.permHouseBlockLot || null,
        permStreet: sanitizedData.permStreet || null,
        permSubdivision: sanitizedData.permSubdivision || null,
        permBarangay: sanitizedData.permBarangay || null,
        permCity: sanitizedData.permCity || null,
        permProvince: sanitizedData.permProvince || null,
        permRegion: sanitizedData.permRegion || null,
      });

      const q = (pdsQuestions || {}) as Partial<typeof pdsDeclarations.$inferInsert>;
      await db.insert(pdsDeclarations).values({
        employeeId: newEmployeeIdNum,
        relatedThirdDegree: (q.relatedThirdDegree as 'Yes' | 'No') || sanitizedData.relatedThirdDegree || null,
        relatedThirdDetails: q.relatedThirdDetails || sanitizedData.relatedThirdDetails || null,
        relatedFourthDegree: (q.relatedFourthDegree as 'Yes' | 'No') || sanitizedData.relatedFourthDegree || null,
        relatedFourthDetails: q.relatedFourthDetails || sanitizedData.relatedFourthDetails || null,
        foundGuiltyAdmin: (q.foundGuiltyAdmin as 'Yes' | 'No') || sanitizedData.foundGuiltyAdmin || null,
        foundGuiltyDetails: q.foundGuiltyDetails || sanitizedData.foundGuiltyDetails || null,
        criminallyCharged: (q.criminallyCharged as 'Yes' | 'No') || sanitizedData.criminallyCharged || null,
        dateFiled: q.dateFiled || (sanitizedData.dateFiled ? String(sanitizedData.dateFiled) : null),
        statusOfCase: q.statusOfCase || sanitizedData.statusOfCase || null,
        convictedCrime: (q.convictedCrime as 'Yes' | 'No') || sanitizedData.convictedCrime || null,
        convictedDetails: q.convictedDetails || sanitizedData.convictedDetails || null,
        separatedFromService: (q.separatedFromService as 'Yes' | 'No') || sanitizedData.separatedFromService || null,
        separatedDetails: q.separatedDetails || sanitizedData.separatedDetails || null,
        electionCandidate: (q.electionCandidate as 'Yes' | 'No') || sanitizedData.electionCandidate || null,
        electionDetails: q.electionDetails || sanitizedData.electionDetails || null,
        resignedToPromote: (q.resignedToPromote as 'Yes' | 'No') || sanitizedData.resignedToPromote || null,
        resignedDetails: q.resignedDetails || sanitizedData.resignedDetails || null,
        immigrantStatus: (q.immigrantStatus as 'Yes' | 'No') || sanitizedData.immigrantStatus || null,
        immigrantDetails: q.immigrantDetails || sanitizedData.immigrantDetails || null,
        indigenousMember: (q.indigenousMember as 'Yes' | 'No') || sanitizedData.indigenousMember || null,
        indigenousDetails: q.indigenousDetails || sanitizedData.indigenousDetails || null,
        personWithDisability: (q.personWithDisability as 'Yes' | 'No') || sanitizedData.personWithDisability || null,

        disabilityIdNo: q.disabilityIdNo || sanitizedData.disabilityIdNo || null,
        soloParent: q.soloParent || sanitizedData.soloParent || null,
        soloParentIdNo: q.soloParentIdNo || sanitizedData.soloParentIdNo || null,
        govtIdType: sanitizedData.govtIdType || null,
        govtIdNo: sanitizedData.govtIdNo || null,
        govtIdIssuance: sanitizedData.govtIdIssuance || null,
        dateAccomplished: dateAccomplished ? String(dateAccomplished) : null,
      });
    }

    // --- AUTOMATIC DOCUMENT SYNC FROM RECRUITMENT ---
    if (newEmployeeIdNum && validatedData.applicantId) {
      const applicant = await db.query.recruitmentApplicants.findFirst({
        where: eq(recruitmentApplicants.id, validatedData.applicantId)
      });

      if (applicant) {
        const docsToSync = [];
        if (applicant.resumePath) {
          docsToSync.push({
            employeeId: newEmployeeIdNum,
            documentType: 'Resume',
            documentName: `Resume_${lastName}_${newEmployeeIdNum}${path.extname(applicant.resumePath)}`,
            filePath: `/uploads/resumes/${applicant.resumePath}`,
            mimeType: 'application/pdf'
          });
        }
        if (applicant.photoPath) {
          docsToSync.push({
            employeeId: newEmployeeIdNum,
            documentType: '2x2 ID Photo',
            documentName: `Photo2x2_${lastName}_${newEmployeeIdNum}${path.extname(applicant.photoPath)}`,
            filePath: `/uploads/resumes/${applicant.photoPath}`, // Recruitment stores all in resumes folder usually
            mimeType: applicant.photoPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
          });
        }
        if (applicant.eligibilityPath) {
          docsToSync.push({
            employeeId: newEmployeeIdNum,
            documentType: 'Eligibility Certificate',
            documentName: `Eligibility_${lastName}_${newEmployeeIdNum}${path.extname(applicant.eligibilityPath)}`,
            filePath: `/uploads/resumes/${applicant.eligibilityPath}`,
            mimeType: 'application/pdf'
          });
        }

        if (docsToSync.length > 0) {
          await db.insert(employeeDocuments).values(docsToSync);
        }
      }
    }
    
    if (finalPosId && newEmployeeIdNum) {
       const today = new Date().toISOString().split('T')[0];
       await db.update(plantillaPositions)
         .set({ incumbentId: newEmployeeIdNum, isVacant: false, filledDate: today })
         .where(eq(plantillaPositions.id, finalPosId));

       await db.insert(plantillaPositionHistory).values({
         positionId: finalPosId,
         employeeId: newEmployeeIdNum,
         employeeName: formatFullName(lastName, firstName),
         positionTitle: plantillaPositionTitle,
         startDate: today
       });
    }

    // 100% SUCCESS GUARANTEE: Ensure biometric record exists in our system
    // The C# middleware normally does this, but we do it here as well for absolute reliability
    const [existingBio] = await db.select().from(bioEnrolledUsers).where(
      sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(finalEmployeeId)}`
    ).limit(1);

    if (existingBio) {
      await db.update(bioEnrolledUsers).set({
        fullName: formatFullName(lastName, firstName, validatedData.middleName, validatedData.suffix),
        department: finalDeptName || 'Unassigned',
        userStatus: 'active',
        updatedAt: sql`CURRENT_TIMESTAMP`
      }).where(sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(finalEmployeeId)}`);
    } else {
      await db.insert(bioEnrolledUsers).values({
        employeeId: finalEmployeeId,
        fullName: formatFullName(lastName, firstName, validatedData.middleName, validatedData.suffix),
        department: finalDeptName || 'Unassigned',
        userStatus: 'active'
      });
    }

    res.status(201).json({ success: true, message: 'Employee created successfully', employeeId: finalEmployeeId });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
};

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export const getEmployeeDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const documents = await db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, parseInt(id as string)));
    res.json({ success: true, documents });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

export const uploadEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentType } = req.body as { documentType?: string };
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const [result] = await db.insert(employeeDocuments).values({
      employeeId: parseInt(id as string),
      documentType: documentType || 'Other',
      documentName: file.originalname,
      filePath: `/uploads/resumes/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    res.json({ 
      success: true, 
      message: 'Document uploaded successfully', 
      document: { id: result.insertId, documentName: file.originalname, filePath: `/uploads/resumes/${file.filename}` } 
    });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

export const deleteEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, docId } = req.params;
    
    const [doc] = await db.select().from(employeeDocuments).where(and(
      eq(employeeDocuments.id, parseInt(docId as string)),
      eq(employeeDocuments.employeeId, parseInt(id as string))
    ));

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Optional: Delete physical file
    // const fullPath = path.join(process.cwd(), doc.filePath);
    // if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, parseInt(docId as string)));
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const authReq = req as AuthenticatedRequest;

    if (authReq.user.id === parseInt(id)) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      return;
    }

    const emp = await db.query.authentication.findFirst({
      where: eq(authentication.id, parseInt(id)),
      with: {
        hrDetails: true
      }
    });

    await db.delete(authentication).where(eq(authentication.id, parseInt(id)));

    // Audit Log
    await AuditService.log({
      userId: authReq.user.id,
      module: 'USER_MANAGEMENT',
      action: 'DELETE',
      details: { targetUserId: id, employeeId: emp?.employeeId },
      req
    });

    // Free up plantilla item
    if (emp?.hrDetails) {
      if (emp.hrDetails.positionId) {
        await db.update(plantillaPositions)
          .set({ isVacant: true, incumbentId: null })
          .where(eq(plantillaPositions.id, emp.hrDetails.positionId));
      } else if (emp.hrDetails.itemNumber && emp.hrDetails.itemNumber !== 'N/A') {
        await db.update(plantillaPositions)
          .set({ isVacant: true, incumbentId: null })
          .where(eq(plantillaPositions.itemNumber, emp.hrDetails.itemNumber));
      }
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: unknown) {
    console.error('[DELETE EMPLOYEE ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const updates = UpdateEmployeeSchema.parse(req.body);

    const currentEmployee = await db.query.authentication.findFirst({
      where: eq(authentication.id, parseInt(id)),
      with: {
        hrDetails: true
      }
    });

    if (!currentEmployee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Check system-wide uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email: updates.email && updates.email !== currentEmployee.email ? updates.email : undefined,
        umidNumber: updates.umidNumber,
        philsysId: updates.philsysId,
        philhealthNumber: updates.philhealthNumber,
        pagibigNumber: updates.pagibigNumber,
        tinNumber: updates.tinNumber,
        gsisNumber: updates.gsisNumber,
        excludeAuthId: parseInt(id)
    });

    if (Object.keys(uniqueErrors).length > 0) {
        res.status(409).json({ success: false, message: 'Uniqueness validation failed.', errors: uniqueErrors });
        return;
    }

    // 1. Sanitize PDS fields (height/weight conversion)
    const sanitizedUpdates = sanitizePDSFields({ ...updates });

    const updateFields: UpdateFields = {};

    // Handle Avatar Upload
    if (req.file) {
      const avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${req.file.filename}`;
      updateFields.avatarUrl = avatarUrl;
    }

    const skippedEnumFields: { field: string; value: unknown; validValues: string[] }[] = [];

    // Mapping manual updates to Drizzle fields
    const fieldMapping: Record<string, string> = {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      department: 'department',
      departmentId: 'departmentId',
      jobTitle: 'jobTitle',
      role: 'role',
      employmentStatus: 'employmentStatus',
      employeeId: 'employeeId',
      salaryGrade: 'salaryGrade',
      stepIncrement: 'stepIncrement',
      appointmentType: 'appointmentType',
      station: 'station',
      positionTitle: 'positionTitle',
      itemNumber: 'itemNumber',
      positionId: 'positionId',
      dateHired: 'dateHired',
      avatarUrl: 'avatarUrl',
      isMeycauayan: 'isMeycauayan',
      dutyType: 'dutyType',
      contractEndDate: 'contractEndDate',
      regularizationDate: 'regularizationDate',
      isRegular: 'isRegular',
      employmentType: 'employmentType',
      facebookUrl: 'facebookUrl',
      linkedinUrl: 'linkedinUrl',
      twitterHandle: 'twitterHandle',
      middleName: 'middleName',
      firstDayOfService: 'firstDayOfService',
      officeAddress: 'officeAddress',
      originalAppointmentDate: 'originalAppointmentDate',
      lastPromotionDate: 'lastPromotionDate',
      barangay: 'barangay',
      religion: 'religion',
      startTime: 'startTime',
      endTime: 'endTime',
      duties: 'duties',
    };

    for (const [jsonKey, value] of Object.entries(sanitizedUpdates)) {
      if (fieldMapping[jsonKey]) {
        const drizzleKey = fieldMapping[jsonKey];
        if (value !== undefined) {
           let processedVal = value === '' ? null : value;
           // Handle dates (schema mode string)
           if (['birthDate', 'dateHired', 'contractEndDate', 'regularizationDate', 'eligibilityDate', 'originalAppointmentDate', 'lastPromotionDate'].includes(drizzleKey) && processedVal) {
             processedVal = String(processedVal);
           }
           // Handle booleans
           if (['isRegular', 'isMeycauayan'].includes(drizzleKey)) {
             processedVal = processedVal ? true : false;
           }
           // Handle salaryGrade (varchar in authentication)
           if (drizzleKey === 'salaryGrade' && processedVal !== null) {
              processedVal = String(processedVal);
           }


           // Handle decimals
           if (['heightCm', 'weightKg', 'heightM'].includes(drizzleKey) && processedVal !== null) {
              processedVal = String(processedVal);
           }
           // Handle int
           if (['stepIncrement'].includes(drizzleKey) && processedVal !== null) {
              processedVal = Number(processedVal);
           }
           // Handle varchar
           if (['yearsOfExperience'].includes(drizzleKey) && processedVal !== null) {
              processedVal = String(processedVal);
           }
           // Validate MySQL ENUM fields — skip invalid values to prevent DB crash
           const enumValidation: Record<string, string[]> = {
             appointmentType: ['Permanent','Contractual','Casual','Job Order','Coterminous','Temporary'],
             employmentStatus: ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause'],
             gender: ['Male','Female'],
             civilStatus: ['Single','Married','Widowed','Separated','Annulled'],
             dutyType: ['Standard', 'Irregular'],
       
           };
            if (enumValidation[drizzleKey] && processedVal !== null) {
              if (!enumValidation[drizzleKey].includes(String(processedVal))) {
                console.warn(`Skipping invalid enum value for ${drizzleKey}: "${processedVal}"`);
                skippedEnumFields.push({ field: jsonKey, value: processedVal, validValues: enumValidation[drizzleKey] });
                continue;
              }
            }
            
            if (drizzleKey === 'duties') {
               // Special handling for duties - do not add to authentication updateFields
               // We will handle this separately below
            } else {
                const key = drizzleKey as keyof UpdateFields;
                updateFields[key] = processedVal as UpdateFields[keyof UpdateFields];
            }
        }
      }
    }


    // Handle duties and schedule time updates (Schedule Title, Start/End Times)
    if ((sanitizedUpdates.duties !== undefined || sanitizedUpdates.startTime !== undefined || sanitizedUpdates.endTime !== undefined) && currentEmployee.employeeId) {
      const empId = currentEmployee.employeeId;
      const today = new Date().toISOString().split('T')[0];
      const newDuties = sanitizedUpdates.duties !== undefined ? String(sanitizedUpdates.duties) : null;
      
      // Check for ALL currently active schedule records (multi-day)
      const currentActiveSchedules = await db.query.schedules.findMany({
        where: and(
            eq(schedules.employeeId, empId),
            or(sql`${schedules.startDate} IS NULL`, lte(schedules.startDate, today)),
            or(sql`${schedules.endDate} IS NULL`, gte(schedules.endDate, today))
        )
      });

      if (currentActiveSchedules.length > 0) {
          // If duties is being updated, we check if it's a future transition
          const targetStartDate = sanitizedUpdates.startDate ? String(sanitizedUpdates.startDate) : today;
          
          if (targetStartDate > today && newDuties !== null) {
              // FUTURE TRANSITION: Prepare next schedule set
              // 1. Close current schedules
              const endDateOneDayBefore = new Date(targetStartDate);
              endDateOneDayBefore.setDate(endDateOneDayBefore.getDate() - 1);
              const endDateStr = endDateOneDayBefore.toISOString().split('T')[0];

              await db.update(schedules)
                .set({ endDate: endDateStr })
                .where(and(
                    eq(schedules.employeeId, empId),
                    inArray(schedules.id, currentActiveSchedules.map(s => s.id))
                ));

              // 2. Insert new schedules for each day the employee had (maintaining their pattern)
              for (const oldSched of currentActiveSchedules) {
                  await db.insert(schedules).values({
                      employeeId: empId,
                      scheduleTitle: newDuties,
                      startTime: sanitizedUpdates.startTime ? convertTo24Hour(String(sanitizedUpdates.startTime)) : oldSched.startTime,
                      endTime: sanitizedUpdates.endTime ? convertTo24Hour(String(sanitizedUpdates.endTime)) : oldSched.endTime,
                      dayOfWeek: oldSched.dayOfWeek,
                      startDate: targetStartDate,
                      repeatPattern: oldSched.repeatPattern || 'Weekly'
                  });
              }
          } else {
              // IMMEDIATE UPDATE or TIME-ONLY UPDATE
              const updateSchedFields: Partial<typeof schedules.$inferInsert> = {};
              if (newDuties !== null) updateSchedFields.scheduleTitle = newDuties;
              if (sanitizedUpdates.startTime !== undefined) updateSchedFields.startTime = convertTo24Hour(String(sanitizedUpdates.startTime));
              if (sanitizedUpdates.endTime !== undefined) updateSchedFields.endTime = convertTo24Hour(String(sanitizedUpdates.endTime));

              if (Object.keys(updateSchedFields).length > 0) {
                  await db.update(schedules)
                    .set(updateSchedFields)
                    .where(and(
                        eq(schedules.employeeId, empId),
                        inArray(schedules.id, currentActiveSchedules.map(s => s.id))
                    ));
              }
          }
      } else if (newDuties !== null) {
        // No current schedules found - create default Mon-Fri set (Standard 8-5 or provided times)
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const endDate = nextYear.toISOString().split('T')[0];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Get System Default Shift for fallback
        const [defaultShift] = await db.select({
          startTime: shiftTemplates.startTime,
          endTime: shiftTemplates.endTime
        })
        .from(shiftTemplates)
        .where(eq(shiftTemplates.isDefault, true))
        .limit(1);

        const fallbackStart = defaultShift?.startTime || '08:00:00';
        const fallbackEnd = defaultShift?.endTime || '17:00:00';

        for (const day of days) {
          await db.insert(schedules).values({
              employeeId: empId,
              scheduleTitle: newDuties,
              startTime: sanitizedUpdates.startTime ? convertTo24Hour(String(sanitizedUpdates.startTime)) : fallbackStart,
              endTime: sanitizedUpdates.endTime ? convertTo24Hour(String(sanitizedUpdates.endTime)) : fallbackEnd,
              dayOfWeek: day,
              startDate: today,
              endDate: endDate,
              repeatPattern: 'Weekly'
          });
        }
      }
    }


    // Handle department sync if department_id changed
    if (updates.departmentId && updates.departmentId !== currentEmployee.hrDetails?.departmentId) {
       const dept = await db.query.departments.findFirst({
         where: eq(departments.id, updates.departmentId)
       });
       if (dept) {
         updateFields.department = dept.name;
       }
    }

    // Handle plantilla changes
    const newPosId = updates.positionId;
    const oldPosId = currentEmployee.hrDetails?.positionId;

    if (newPosId !== undefined && newPosId !== oldPosId) {
      if (oldPosId) {
        await db.update(plantillaPositions)
          .set({ isVacant: true, incumbentId: null })
          .where(eq(plantillaPositions.id, oldPosId));
      }
      if (newPosId) {
        const plantilla = await db.query.plantillaPositions.findFirst({
          where: eq(plantillaPositions.id, newPosId)
        });
        if (plantilla) {
          if (!plantilla.isVacant) {
            res.status(409).json({ success: false, message: `Plantilla Item ${plantilla.itemNumber} is already filled.` });
            return;
          }
          await db.update(plantillaPositions)
            .set({ isVacant: false, incumbentId: parseInt(id) })
            .where(eq(plantillaPositions.id, newPosId));
          
          if (updates.itemNumber === undefined) updateFields.itemNumber = plantilla.itemNumber;
          if (updates.positionTitle === undefined) updateFields.positionTitle = plantilla.positionTitle;
          if (updates.salaryGrade === undefined) updateFields.salaryGrade = String(plantilla.salaryGrade);
        }
      } else {
          if (updates.itemNumber === undefined) updateFields.itemNumber = null;
          if (updates.positionTitle === undefined) updateFields.positionTitle = null;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      // We will perform the DB update below if there are fields, 
      // but we need to check if there are ANY fields including HR ones.
    }

    // Separate updates for decoupled schema
    const authFields = ['firstName', 'lastName', 'email', 'role', 'employeeId', 'avatarUrl', 'middleName', 'suffix'];
    const hrFields = [
      'employmentStatus', 'employmentType', 'jobTitle', 'departmentId', 'positionId',
      'salaryGrade', 'stepIncrement', 'dateHired', 'contractEndDate', 'regularizationDate',
      'isRegular', 'positionTitle', 'station', 'appointmentType', 'itemNumber',
      'firstDayOfService', 'officeAddress', 'religion', 'barangay', 'dutyType',
      'isMeycauayan', 'facebookUrl', 'linkedinUrl', 'twitterHandle'
    ];
    const personalFields = [
      'birthDate', 'placeOfBirth', 'gender', 'civilStatus', 'heightM', 'weightKg',
      'bloodType', 'citizenship', 'residentialAddress', 'permanentAddress',
      'mobileNo', 'telephoneNo', 'nationality', 'phoneNumber'
    ];

    const authUpdates: Partial<typeof authentication.$inferInsert> = {};
    const hrUpdates: Partial<typeof pdsHrDetails.$inferInsert> = {};
    const personalUpdates: Record<string, unknown> = {};

    Object.entries(sanitizedUpdates).forEach(([key, value]) => {
      if (authFields.includes(key)) {
        (authUpdates as Record<string, unknown>)[key] = value;
      } else if (hrFields.includes(key)) {
        (hrUpdates as Record<string, unknown>)[key] = value;
      } else if (personalFields.includes(key)) {
        if (key === 'nationality') personalUpdates['citizenship'] = value;
        else if (key === 'phoneNumber') personalUpdates['mobileNo'] = value;
        else personalUpdates[key] = value;
      }
    });

    if (Object.keys(authUpdates).length === 0 && Object.keys(hrUpdates).length === 0 && Object.keys(personalUpdates).length === 0) {
      res.json({ success: true, message: 'No changes detected' });
      return;
    }

    // Email uniqueness
    if (updates.email && updates.email !== currentEmployee.email) {
      const emailExists = await db.query.authentication.findFirst({
        where: and(eq(authentication.email, updates.email), ne(authentication.id, parseInt(id)))
      });
      if (emailExists) {
        res.status(409).json({ success: false, message: 'Email already exists' });
        return;
      }
    }

    // Employee ID uniqueness
    if (updates.employeeId && updates.employeeId !== currentEmployee.employeeId) {
      const idExists = await db.query.authentication.findFirst({
        where: and(eq(authentication.employeeId, updates.employeeId), ne(authentication.id, parseInt(id)))
      });
      if (idExists) {
        res.status(409).json({ success: false, message: 'Employee ID already exists' });
        return;
      }
    }

    await db.transaction(async (tx) => {
      if (Object.keys(authUpdates).length > 0) {
        await tx.update(authentication)
          .set(authUpdates)
          .where(eq(authentication.id, parseInt(id)));
      }

      if (Object.keys(hrUpdates).length > 0) {
        const [existingHr] = await tx.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, parseInt(id)));
        if (existingHr) {
          await tx.update(pdsHrDetails)
            .set(hrUpdates)
            .where(eq(pdsHrDetails.employeeId, parseInt(id)));
        } else {
          await tx.insert(pdsHrDetails).values({ ...hrUpdates, employeeId: parseInt(id) });
        }
      }

      if (Object.keys(personalUpdates).length > 0) {
        const [existingPersonal] = await tx.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, parseInt(id)));
        if (existingPersonal) {
          await tx.update(pdsPersonalInformation)
            .set(personalUpdates)
            .where(eq(pdsPersonalInformation.employeeId, parseInt(id)));
        } else {
          await tx.insert(pdsPersonalInformation).values({ ...personalUpdates, employeeId: parseInt(id) });
        }
      }
    });


    res.json({ success: true, message: 'Employee updated successfully' });

    await AuditService.log({
      userId: (req as AuthenticatedRequest).user.id,
      module: 'USER_MANAGEMENT',
      action: 'UPDATE',
      details: { targetUserId: id, updates: Object.keys(sanitizedUpdates) },
      req
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {

        res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
        return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Failed to update employee: ${errorMessage}` });
  }
};

export const revertEmployeeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { newStatus, reason: _reason } = RevertStatusSchema.parse(req.body);

    const existing = await db.query.authentication.findFirst({
      where: eq(authentication.id, parseInt(id)),
      with: {
        hrDetails: true
      }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const oldStatus = existing.hrDetails?.employmentStatus;

    await db.update(pdsHrDetails)
      .set({ employmentStatus: newStatus as EmploymentStatus })
      .where(eq(pdsHrDetails.employeeId, parseInt(id)));

    res.json({
      success: true,
      message: `Employee status changed from ${oldStatus} to ${newStatus}`,
      previousStatus: oldStatus,
      newStatus: newStatus
    });

    await AuditService.log({
      userId: (req as AuthenticatedRequest).user.id,
      module: 'USER_MANAGEMENT',
      action: 'ROLE_UPDATE', // Re-using ROLE_UPDATE or Status change
      details: { targetUserId: id, oldStatus, newStatus },
      req
    });

  } catch (error: unknown) {
    console.error('[REVERT STATUS ERROR]', error);
    res.status(500).json({ success: false, message: 'Failed to revert employee status' });
  }
};

// ============================================================================
// EMPLOYEE SKILLS
// ============================================================================

export const getEmployeeSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const skills = await db.select()
      .from(employeeSkills)
      .where(eq(employeeSkills.employeeId, parseInt(id)))
      .orderBy(employeeSkills.skillName);
    
    const mappedSkills = skills.map(mapToSkillApi);
    res.json({ success: true, skills: mappedSkills });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch skills' });
  }
};

export const addEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { skillName, category, proficiencyLevel, yearsExperience } = AddSkillSchema.parse(req.body);

    const [result] = await db.insert(employeeSkills).values({
      employeeId: parseInt(id),
      skillName,
      category: (category || 'Technical'),
      proficiencyLevel: (proficiencyLevel || 'Intermediate') as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
      yearsExperience: yearsExperience ? String(yearsExperience) : null
    });

    res.status(201).json({ success: true, message: 'Skill added', skillId: result.insertId });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to add skill' });
  }
};

export const updateEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params as { id: string; skillId: string };
    const updates = UpdateSkillSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    const drizzleUpdates: Partial<typeof employeeSkills.$inferInsert> = {};
    if (updates.skillName) drizzleUpdates.skillName = updates.skillName;
    if (updates.category) drizzleUpdates.category = updates.category;
    if (updates.proficiencyLevel) drizzleUpdates.proficiencyLevel = updates.proficiencyLevel;
    if (updates.yearsExperience !== undefined) drizzleUpdates.yearsExperience = updates.yearsExperience ? String(updates.yearsExperience) : null;

    await db.update(employeeSkills)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeSkills.id, parseInt(skillId)),
        eq(employeeSkills.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Skill updated' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update skill' });
  }
};

export const deleteEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params as { id: string; skillId: string };
    await db.delete(employeeSkills)
      .where(and(
        eq(employeeSkills.id, parseInt(skillId)),
        eq(employeeSkills.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Skill deleted' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete skill' });
  }
};

// ============================================================================
// EMPLOYEE EDUCATION
// ============================================================================

export const getEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const education = await db.select()
      .from(pdsEducation)
      .where(eq(pdsEducation.employeeId, parseInt(id)));
    
    const mappedEducation = (education as InferSelectModel<typeof pdsEducation>[]).map(mapToEducationApi);
    res.json({ success: true, education: mappedEducation });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch education' });
  }
};

export const addEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { institution, degree, fieldOfStudy, startDate, endDate, isCurrent, type, description } = AddEducationSchema.parse(req.body);

    const [result] = await db.insert(employeeEducation).values({
      employeeId: parseInt(id),
      institution,
      degree: degree || null,
      fieldOfStudy: fieldOfStudy || null,
      startDate: startDate ? String(startDate) : null,
      endDate: endDate ? String(endDate) : null,
      isCurrent: isCurrent ? true : false, // boolean
      type: (type || 'Education') as 'Education' | 'Certification' | 'Training',
      description: description || null
    });

    res.status(201).json({ success: true, message: 'Education added', educationId: result.insertId });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to add education' });
  }
};

export const updateEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, educationId } = req.params as { id: string; educationId: string };
    const updates = UpdateEducationSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    const drizzleUpdates: Partial<typeof employeeEducation.$inferInsert> = {};
    if (updates.institution) drizzleUpdates.institution = updates.institution;
    if (updates.degree !== undefined) drizzleUpdates.degree = updates.degree || null;
    if (updates.fieldOfStudy !== undefined) drizzleUpdates.fieldOfStudy = updates.fieldOfStudy || null;
    if (updates.startDate !== undefined) drizzleUpdates.startDate = updates.startDate ? String(updates.startDate) : null;
    if (updates.endDate !== undefined) drizzleUpdates.endDate = updates.endDate ? String(updates.endDate) : null;
    if (updates.isCurrent !== undefined) drizzleUpdates.isCurrent = updates.isCurrent ? true : false;
    if (updates.type) drizzleUpdates.type = updates.type as 'Education' | 'Certification' | 'Training';
    if (updates.description !== undefined) drizzleUpdates.description = updates.description || null;

    await db.update(employeeEducation)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeEducation.id, parseInt(educationId)),
        eq(employeeEducation.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Education updated' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update education' });
  }
};

export const deleteEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, educationId } = req.params as { id: string; educationId: string };
    await db.delete(employeeEducation)
      .where(and(
        eq(employeeEducation.id, parseInt(educationId)),
        eq(employeeEducation.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Education deleted' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete education' });
  }
};

// ============================================================================
// EMPLOYEE EMERGENCY CONTACTS
// ============================================================================

export const getEmployeeContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const contacts = await db.select()
      .from(employeeEmergencyContacts)
      .where(eq(employeeEmergencyContacts.employeeId, parseInt(id)))
      .orderBy(desc(employeeEmergencyContacts.isPrimary));
    
    const mappedContacts = contacts.map(mapToContactApi);
    res.json({ success: true, contacts: mappedContacts });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
};

export const addEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name, relationship, phoneNumber, email, address, isPrimary } = AddContactSchema.parse(req.body);

    if (isPrimary) {
      await db.update(employeeEmergencyContacts)
        .set({ isPrimary: false })
        .where(eq(employeeEmergencyContacts.employeeId, parseInt(id)));
    }

    const [result] = await db.insert(employeeEmergencyContacts).values({
      employeeId: parseInt(id),
      name,
      relationship,
      phoneNumber: phoneNumber,
      email: email || null,
      address: address || null,
      isPrimary: isPrimary ? true : false // boolean
    });

    res.status(201).json({ success: true, message: 'Contact added', contactId: result.insertId });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to add contact' });
  }
};

export const updateEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, contactId } = req.params as { id: string; contactId: string };
    const updates = UpdateContactSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    if (updates.isPrimary) {
      await db.update(employeeEmergencyContacts)
        .set({ isPrimary: false })
        .where(eq(employeeEmergencyContacts.employeeId, parseInt(id)));
    }

    const drizzleUpdates: {
      name?: string;
      relationship?: string;
      phoneNumber?: string;
      email?: string | null;
      address?: string | null;
      isPrimary?: boolean;
    } = {};
    if (updates.name) drizzleUpdates.name = updates.name;
    if (updates.relationship) drizzleUpdates.relationship = updates.relationship;
    if (updates.phoneNumber) drizzleUpdates.phoneNumber = updates.phoneNumber;
    if (updates.email !== undefined) drizzleUpdates.email = updates.email || null;
    if (updates.address !== undefined) drizzleUpdates.address = updates.address || null;
    if (updates.isPrimary !== undefined) drizzleUpdates.isPrimary = updates.isPrimary ? true : false;

    await db.update(employeeEmergencyContacts)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeEmergencyContacts.id, parseInt(contactId)),
        eq(employeeEmergencyContacts.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Contact updated' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
};

export const deleteEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, contactId } = req.params as { id: string; contactId: string };
    await db.delete(employeeEmergencyContacts)
      .where(and(
        eq(employeeEmergencyContacts.id, parseInt(contactId)),
        eq(employeeEmergencyContacts.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Contact deleted' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
};


// ============================================================================
// EMPLOYEE CUSTOM FIELDS
// ============================================================================

export const addEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { section, fieldName, fieldValue } = AddCustomFieldSchema.parse(req.body);

    const [result] = await db.insert(employeeCustomFields).values({
      employeeId: parseInt(id),
      section,
      fieldName: fieldName,
      fieldValue: fieldValue || ''
    });

    res.status(201).json({ success: true, message: 'Custom field added', fieldId: result.insertId });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to add custom field' });
  }
};

export const updateEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, fieldId } = req.params as { id: string; fieldId: string };
    const updates = UpdateCustomFieldSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    const drizzleUpdates: {
      section?: string;
      fieldName?: string;
      fieldValue?: string;
    } = {};
    if (updates.section) drizzleUpdates.section = updates.section;
    if (updates.fieldName) drizzleUpdates.fieldName = updates.fieldName;
    if (updates.fieldValue !== undefined && updates.fieldValue !== null) drizzleUpdates.fieldValue = updates.fieldValue;

    await db.update(employeeCustomFields)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeCustomFields.id, parseInt(fieldId)),
        eq(employeeCustomFields.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Custom field updated' });
  } catch (_error: unknown) {

    res.status(500).json({ success: false, message: 'Failed to update custom field' });
  }
};

export const deleteEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, fieldId } = req.params as { id: string; fieldId: string };
    await db.delete(employeeCustomFields)
      .where(and(
        eq(employeeCustomFields.id, parseInt(fieldId)),
        eq(employeeCustomFields.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Custom field deleted' });
  } catch (_error: unknown) {

    res.status(500).json({ success: false, message: 'Failed to delete custom field' });
  }
};
