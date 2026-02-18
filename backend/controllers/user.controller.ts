import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { eq, and, or, sql, desc, like, ne, InferSelectModel } from 'drizzle-orm';
import type { AuthenticatedRequest, EmploymentStatus, Gender, CivilStatus, AppointmentType } from '../types/index.js';
import { UserService } from '../services/user.service.js';
import { 
  authentication, 
  departments, 
  plantillaPositions, 
  plantillaPositionHistory,
  employeeSkills, 
  employeeEducation, 
  employeeEmergencyContacts, 
  employeeCustomFields,
  schedules 
} from '../db/schema.js';
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
import { 
  EmployeeApiResponse, 
  EmployeeMapperInput,
  EmployeeSkillsResponse, 
  EmployeeEducationResponse, 
  EmployeeEmergencyContactResponse, 
  EmployeeCustomFieldResponse 
} from '../types/employee.js';


type UserRole = 'admin' | 'hr' | 'employee';

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
  sssNumber?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
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
  isRegular?: number;
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
  highestEducation?: string | null;
  yearsOfExperience?: number;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  middleName?: string | null;
  firstDayOfService?: string | null;
  supervisor?: string | null;
  officeAddress?: string | null;
  originalAppointmentDate?: string | null;
  lastPromotionDate?: string | null;
  [key: string]: string | number | null | undefined;
}

// ============================================================================
// HELPERS
// ============================================================================

export const mapToEmployeeApi = (emp: EmployeeMapperInput): EmployeeApiResponse => {
  return {
    id: emp.id,
    first_name: String(emp.firstName || ''),
    last_name: String(emp.lastName || ''),
    middle_name: emp.middleName || null,
    email: String(emp.email || ''),
    role: (emp.role || 'employee') as UserRole,
    department: emp.department || null,
    department_id: emp.departmentId || null,
    employee_id: String(emp.employeeId || ''),
    job_title: emp.jobTitle || null,
    position_title: emp.positionTitle || null,
    employment_status: emp.employmentStatus as EmploymentStatus || null,
    employment_type: emp.employmentType || null,
    date_hired: emp.dateHired || null,
    contract_end_date: emp.contractEndDate || null,
    regularization_date: emp.regularizationDate || null,
    is_regular: emp.isRegular || 0,
    birth_date: emp.birthDate || null,
    gender: emp.gender as Gender || null,
    civil_status: emp.civilStatus as CivilStatus || null,
    nationality: emp.nationality || null,
    phone_number: emp.phoneNumber || null,
    address: emp.address || null,
    permanent_address: emp.permanentAddress || null,
    avatar_url: emp.avatarUrl || null,
    sss_number: emp.sssNumber || null,
    philhealth_number: emp.philhealthNumber || null,
    pagibig_number: emp.pagibigNumber || null,
    tin_number: emp.tinNumber || null,
    gsis_number: emp.gsisNumber || null,
    salary_grade: emp.salaryGrade || null,
    step_increment: emp.stepIncrement || 1,
    appointment_type: emp.appointmentType as AppointmentType || null,
    station: emp.station || null,
    item_number: emp.itemNumber || null,
    position_id: emp.positionId || null,
    duties: emp.duties || 'No Schedule',
    
    height_m: emp.heightM || null,
    weight_kg: emp.weightKg || null,
    blood_type: emp.bloodType || null,
    place_of_birth: emp.placeOfBirth || null,
    residential_address: emp.residentialAddress || null,
    residential_zip_code: emp.residentialZipCode || null,
    permanent_zip_code: emp.permanentZipCode || null,
    telephone_no: emp.telephoneNo || null,
    mobile_no: emp.mobileNo || null,
    agency_employee_no: emp.agencyEmployeeNo || null,
    emergency_contact: emp.emergencyContact || null,
    emergency_contact_number: emp.emergencyContactNumber || null,
    
    eligibility_type: emp.eligibilityType || null,
    eligibility_number: emp.eligibilityNumber || null,
    eligibility_date: emp.eligibilityDate || null,
    highest_education: emp.highestEducation || null,
    years_of_experience: emp.yearsOfExperience || 0,

    facebook_url: emp.facebookUrl || null,
    linkedin_url: emp.linkedinUrl || null,
    twitter_handle: emp.twitterHandle || null,
    first_day_of_service: emp.firstDayOfService || null,
    supervisor: emp.supervisor || null,
    office_address: emp.officeAddress || null
  };
};

const mapToSkillApi = (skill: InferSelectModel<typeof employeeSkills>): EmployeeSkillsResponse => ({
  id: skill.id,
  skill_name: skill.skillName,
  category: skill.category || 'Technical',
  proficiency_level: skill.proficiencyLevel || 'Intermediate',
  years_experience: skill.yearsExperience ? Number(skill.yearsExperience) : null
});

const mapToEducationApi = (edu: InferSelectModel<typeof employeeEducation>): EmployeeEducationResponse => ({
  id: edu.id,
  institution: edu.institution,
  degree: edu.degree || null,
  field_of_study: edu.fieldOfStudy || null,
  start_date: edu.startDate || null,
  end_date: edu.endDate || null,
  is_current: edu.isCurrent || 0
});

const mapToContactApi = (contact: InferSelectModel<typeof employeeEmergencyContacts>): EmployeeEmergencyContactResponse => ({
  id: contact.id,
  name: contact.name,
  relationship: contact.relationship,
  phone_number: contact.phoneNumber,
  email: contact.email || null,
  address: contact.address || null,
  is_primary: contact.isPrimary || 0
});

const mapToCustomFieldApi = (field: InferSelectModel<typeof employeeCustomFields>): EmployeeCustomFieldResponse => ({
  id: field.id,
  section: field.section,
  field_name: field.fieldName,
  field_value: field.fieldValue || null
});

const sanitizePDSFields = (updates: UpdateEmployeeInput): UpdateEmployeeInput => {
  // Auto-convert Height (cm -> m) if likely in cm (> 3 meters is unlikely for humans)
  if (updates.height_m && updates.height_m > 3) {
    console.log(`Auto-converting height from ${updates.height_m} cm to meters.`);
    updates.height_m = parseFloat((updates.height_m / 100).toFixed(2));
  }
  
  // Auto-convert Weight to be safe (if in grams > 1000)
  if (updates.weight_kg && updates.weight_kg > 1000) {
     console.log(`Auto-converting weight from ${updates.weight_kg} (likely grams) to kg.`);
     updates.weight_kg = parseFloat((updates.weight_kg / 1000).toFixed(2));
  }

  // Ensure precision for DECIMAL(4,2)
  if (updates.height_m) updates.height_m = parseFloat(Number(updates.height_m).toFixed(2));
  if (updates.weight_kg) updates.weight_kg = parseFloat(Number(updates.weight_kg).toFixed(2));

  return updates;
};

// ============================================================================
// EMPLOYEE CRUD OPERATIONS
// ============================================================================

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, department_id } = req.query;
    
    const conditions = [];
    if (department_id) {
      conditions.push(eq(authentication.departmentId, Number(department_id)));
    } else if (department && department !== 'All Departments') {
      conditions.push(eq(authentication.department, department as string));
    }

    const employees = await UserService.getAllEmployees(conditions);

    const mappedEmployees = employees.map(mapToEmployeeApi);
    res.json({ success: true, employees: mappedEmployees });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [employeeData, relatedData] = await Promise.all([
      UserService.getEmployeeById(parseInt(id)),
      UserService.getRelatedData(parseInt(id))
    ]);

    if (!employeeData) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }


    // Security: PII Filtering
    const authReq = req as AuthenticatedRequest;
    const requester = authReq.user;
    const isSelf = requester.id === parseInt(id);
    const isAdmin = ['admin', 'hr'].includes(requester.role?.toLowerCase());

    if (!isSelf && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access Denied: You can only view your own profile.' });
      return;
    }

    // Map everything to the strict API response format
    const mappedEmployee = mapToEmployeeApi(employeeData);
    const { skills, education, emergencyContacts, customFields } = relatedData;

    // Filter contacts for non-admins
    const finalContacts = !isSelf && !isAdmin ? [] : emergencyContacts;

    res.json({
      success: true,
      employee: {
        ...mappedEmployee,
        skills: skills.map(mapToSkillApi),
        education: education.map(mapToEducationApi),
        emergencyContacts: finalContacts.map(mapToContactApi),
        emergency_contacts: finalContacts.map(mapToContactApi),
        customFields: customFields.map(mapToCustomFieldApi),
        custom_fields: customFields.map(mapToCustomFieldApi)
      }
    });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CreateEmployeeSchema.parse(req.body);
    const {
      first_name, last_name, email, department, department_id, job_title, role,
      employment_status, employee_id, password,
      birth_date, gender, civil_status, nationality,
      phone_number, address, permanent_address,
      philhealth_number, pagibig_number, tin_number, gsis_number,
      salary_grade, step_increment, appointment_type, station, position_title,
      item_number, position_id
    } = validatedData;

    // Validate department
    let finalDeptId = department_id;
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

    // Check uniqueness
    const existing = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.email, email),
        eq(authentication.employeeId, employee_id || '')
      )
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'Email or Employee ID already exists' });
      return;
    }

    // Generate Sequential ID if not provided
    let finalEmployeeId = employee_id;
    if (!finalEmployeeId) {
       // Determine prefix
       let prefix = 'EMP';
       const deptInfo = await db.query.departments.findFirst({
         where: finalDeptId ? eq(departments.id, finalDeptId) : undefined
       });
       
       if (deptInfo) {
           // Use description as prefix (e.g. CHRMO), or fallback to first 3 letters of name
           prefix = deptInfo.description || deptInfo.name.substring(0, 3).toUpperCase();
       }

       // Find last ID with this prefix to increment
       const lastIdResult = await db.query.authentication.findFirst({
           where: like(authentication.employeeId, `${prefix}-%`),
           orderBy: [desc(sql`LENGTH(${authentication.employeeId})`), desc(authentication.employeeId)]
       });

       let nextSeq = 1;
       if (lastIdResult) {
           const lastId = lastIdResult.employeeId;
           const parts = lastId.split('-');
           if (parts.length > 1) {
               const lastNum = parseInt(parts[parts.length - 1]);
               if (!isNaN(lastNum)) {
                   nextSeq = lastNum + 1;
               }
           }
       }

       finalEmployeeId = `${prefix}-${nextSeq.toString().padStart(4, '0')}`;
    }

    // Hash password
    const passwordToHash = password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    // Handle Plantilla — validation only, actual update after employee insert
    let finalItemNumber = item_number || null;
    let finalPosId = position_id || null;
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
    if (validatedData.employment_type === 'Probationary' && !validatedData.regularization_date) {
        const hireDate = new Date(validatedData.date_hired || Date.now());
        hireDate.setMonth(hireDate.getMonth() + 6);
        finalRegularizationDate = hireDate;
    } else if (validatedData.regularization_date) {
        finalRegularizationDate = new Date(validatedData.regularization_date);
    }

    // Sanitize PDS fields (height/weight conversion)
    const sanitizedData = sanitizePDSFields({ ...validatedData });

    const [result] = await db.insert(authentication).values({
      firstName: first_name,
      lastName: last_name,
      email,
      department: finalDeptName,
      departmentId: finalDeptId,
      jobTitle: job_title || 'N/A',
      role: role as UserRole,
      employmentStatus: (employment_status || 'Active') as EmploymentStatus,
      employmentType: (sanitizedData.employment_type || 'Probationary') as string,
      employeeId: finalEmployeeId,
      passwordHash: hashedPassword,
      isVerified: 1, // tinyint
      birthDate: birth_date ? String(birth_date) : null, // date mode string
      gender: gender as Gender,
      civilStatus: civil_status as CivilStatus,
      nationality: nationality || 'Filipino',
      phoneNumber: phone_number || null,
      address: address || null,
      permanentAddress: permanent_address || null,
      philhealthNumber: philhealth_number || null,
      pagibigNumber: pagibig_number || null,
      tinNumber: tin_number || null,
      gsisNumber: gsis_number || null,
      salaryGrade: salary_grade ? String(salary_grade) : null,
      stepIncrement: step_increment || 1,
      appointmentType: appointment_type as AppointmentType,
      station: station || null,
      positionTitle: position_title || null,
      itemNumber: finalItemNumber,
      positionId: finalPosId,
      contractEndDate: sanitizedData.contract_end_date ? String(sanitizedData.contract_end_date) : null,
      regularizationDate: finalRegularizationDate ? finalRegularizationDate.toISOString().split('T')[0] : null,
      isRegular: sanitizedData.is_regular ? 1 : 0, // tinyint
      heightCm: sanitizedData.height_m ? String(sanitizedData.height_m) : null,
      heightM: sanitizedData.height_m ? String(sanitizedData.height_m) : null,
      weightKg: sanitizedData.weight_kg ? String(sanitizedData.weight_kg) : null,
      bloodType: sanitizedData.blood_type || null,
      placeOfBirth: sanitizedData.place_of_birth || null,
      residentialAddress: sanitizedData.residential_address || null,
      residentialZipCode: sanitizedData.residential_zip_code || null,
      permanentZipCode: sanitizedData.permanent_zip_code || null,
      telephoneNo: sanitizedData.telephone_no || null,
      mobileNo: sanitizedData.mobile_no || null,
      agencyEmployeeNo: sanitizedData.agency_employee_no || null,
      emergencyContact: sanitizedData.emergency_contact || null,
      emergencyContactNumber: sanitizedData.emergency_contact_number || null,
      eligibilityType: sanitizedData.eligibility_type || null,
      eligibilityNumber: sanitizedData.eligibility_number || null,
      eligibilityDate: sanitizedData.eligibility_date ? String(sanitizedData.eligibility_date) : null,
      highestEducation: sanitizedData.highest_education || null,
      yearsOfExperience: sanitizedData.years_of_experience ? Number(sanitizedData.years_of_experience) : 0
    });

    const newEmployeeIdNum = result.insertId;
    
    if (finalPosId && newEmployeeIdNum) {
       const today = new Date().toISOString().split('T')[0];
       await db.update(plantillaPositions)
         .set({ incumbentId: newEmployeeIdNum, isVacant: 0, filledDate: today })
         .where(eq(plantillaPositions.id, finalPosId));

       await db.insert(plantillaPositionHistory).values({
         positionId: finalPosId,
         employeeId: newEmployeeIdNum,
         employeeName: `${first_name} ${last_name}`,
         positionTitle: plantillaPositionTitle,
         startDate: today
       });
    }

    res.status(201).json({ success: true, message: 'Employee created successfully', employeeId: finalEmployeeId });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;

    if (authReq.user.id === parseInt(id)) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      return;
    }

    const emp = await db.query.authentication.findFirst({
      where: eq(authentication.id, parseInt(id)),
      columns: { itemNumber: true, positionId: true }
    });

    await db.delete(authentication).where(eq(authentication.id, parseInt(id)));

    // Free up plantilla item
    if (emp) {
      if (emp.positionId) {
        await db.update(plantillaPositions)
          .set({ isVacant: 1, incumbentId: null })
          .where(eq(plantillaPositions.id, emp.positionId));
      } else if (emp.itemNumber && emp.itemNumber !== 'N/A') {
        await db.update(plantillaPositions)
          .set({ isVacant: 1, incumbentId: null })
          .where(eq(plantillaPositions.itemNumber, emp.itemNumber));
      }
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = UpdateEmployeeSchema.parse(req.body);
    console.log('Update Request Body:', req.body);
    console.log('Validated Updates:', updates);


    const currentEmployee = await db.query.authentication.findFirst({
      where: eq(authentication.id, parseInt(id))
    });

    if (!currentEmployee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // 1. Sanitize PDS fields (height/weight conversion)
    const sanitizedUpdates = sanitizePDSFields({ ...updates });

    const updateFields: UpdateFields = {};
    const skippedEnumFields: { field: string; value: unknown; validValues: string[] }[] = [];

    // Mapping manual updates to Drizzle fields
    const fieldMapping: Record<string, string> = {
      first_name: 'firstName',
      last_name: 'lastName',
      email: 'email',
      department: 'department',
      department_id: 'departmentId',
      job_title: 'jobTitle',
      role: 'role',
      employment_status: 'employmentStatus',
      employee_id: 'employeeId',
      birth_date: 'birthDate',
      gender: 'gender',
      civil_status: 'civilStatus',
      nationality: 'nationality',
      phone_number: 'phoneNumber',
      address: 'address',
      permanent_address: 'permanentAddress',
      sss_number: 'sssNumber',
      philhealth_number: 'philhealthNumber',
      pagibig_number: 'pagibigNumber',
      tin_number: 'tinNumber',
      gsis_number: 'gsisNumber',
      salary_grade: 'salaryGrade',
      step_increment: 'stepIncrement',
      appointment_type: 'appointmentType',
      station: 'station',
      position_title: 'positionTitle',
      item_number: 'itemNumber',
      position_id: 'positionId',
      date_hired: 'dateHired',
      avatar_url: 'avatarUrl',
      contract_end_date: 'contractEndDate',
      regularization_date: 'regularizationDate',
      is_regular: 'isRegular',
      employment_type: 'employmentType',
      height_m: 'heightM', // Corrected to map to heightM (decimal 4,2)
      weight_kg: 'weightKg',
      blood_type: 'bloodType',
      place_of_birth: 'placeOfBirth',
      residential_address: 'residentialAddress',
      residential_zip_code: 'residentialZipCode',
      permanent_zip_code: 'permanentZipCode',
      telephone_no: 'telephoneNo',
      mobile_no: 'mobileNo',
      agency_employee_no: 'agencyEmployeeNo',
      emergency_contact: 'emergencyContact',
      emergency_contact_number: 'emergencyContactNumber',
      eligibility_type: 'eligibilityType',
      eligibility_number: 'eligibilityNumber',
      eligibility_date: 'eligibilityDate',
      highest_education: 'highestEducation',
      years_of_experience: 'yearsOfExperience',
      facebook_url: 'facebookUrl',
      linkedin_url: 'linkedinUrl',
      twitter_handle: 'twitterHandle',
      middle_name: 'middleName',
      first_day_of_service: 'firstDayOfService',
      supervisor: 'supervisor',
      office_address: 'officeAddress',
      original_appointment_date: 'originalAppointmentDate',
      last_promotion_date: 'lastPromotionDate',
      duties: 'duties' // Special handling
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
           // Handle booleans (tinyint)
           if (['isRegular'].includes(drizzleKey)) {
             processedVal = processedVal ? 1 : 0;
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
           if (['yearsOfExperience', 'stepIncrement'].includes(drizzleKey) && processedVal !== null) {
              processedVal = Number(processedVal);
           }
           // Validate MySQL ENUM fields — skip invalid values to prevent DB crash
           const enumValidation: Record<string, string[]> = {
             appointmentType: ['Permanent','Contractual','Casual','Job Order','Coterminous','Temporary'],
             employmentStatus: ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause'],
             gender: ['Male','Female'],
             civilStatus: ['Single','Married','Widowed','Separated','Annulled'],
       
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
               updateFields[drizzleKey] = processedVal as string | number | null | undefined;
            }
        }
      }
    }

    // Handle duties update (Schedule Title)
    if (sanitizedUpdates.duties !== undefined) {
      const newDuties = String(sanitizedUpdates.duties);
      console.log(`Updating duties (schedule title) for employee ${currentEmployee.employeeId}: ${newDuties}`);
      
      // Check if schedule exists for current employee
      const existingSchedule = await db.query.schedules.findFirst({
        where: eq(schedules.employeeId, currentEmployee.employeeId)
      });

      if (existingSchedule) {
        // Update existing
        await db.update(schedules)
          .set({ scheduleTitle: newDuties })
          .where(eq(schedules.employeeId, currentEmployee.employeeId));
      } else {
        // Create default
        console.log(`No existing schedule found for ${currentEmployee.employeeId}. Creating default schedule with duties: ${newDuties}`);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const newSchedules = days.map(day => ({
            employeeId: currentEmployee.employeeId,
            scheduleTitle: newDuties,
            dayOfWeek: day,
            startTime: '08:00:00',
            endTime: '17:00:00',
            repeatPattern: 'Weekly'
        }));
        
        await db.insert(schedules).values(newSchedules);
      }
    }


    // Handle department sync if department_id changed
    if (updates.department_id && updates.department_id !== currentEmployee.departmentId) {
       const dept = await db.query.departments.findFirst({
         where: eq(departments.id, updates.department_id)
       });
       if (dept) {
         updateFields.department = dept.name;
       }
    }

    // Handle plantilla changes
    const newPosId = updates.position_id;
    const oldPosId = currentEmployee.positionId;

    if (newPosId !== undefined && newPosId !== oldPosId) {
      if (oldPosId) {
        await db.update(plantillaPositions)
          .set({ isVacant: 1, incumbentId: null })
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
            .set({ isVacant: 0, incumbentId: parseInt(id) })
            .where(eq(plantillaPositions.id, newPosId));
          
          if (updates.item_number === undefined) updateFields.itemNumber = plantilla.itemNumber;
          if (updates.position_title === undefined) updateFields.positionTitle = plantilla.positionTitle;
          if (updates.salary_grade === undefined) updateFields.salaryGrade = String(plantilla.salaryGrade);
        }
      } else {
          if (updates.item_number === undefined) updateFields.itemNumber = null;
          if (updates.position_title === undefined) updateFields.positionTitle = null;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      // Check if duties was updated (since it's not in updateFields)
      if (sanitizedUpdates.duties !== undefined) {
          res.json({ success: true, message: 'Employee duties updated successfully' });
          return;
      }

      if (skippedEnumFields.length > 0) {
        const details = skippedEnumFields.map(f => 
          `"${f.field}" value "${f.value}" is invalid. Valid options: ${f.validValues.join(', ')}`
        ).join('; ');
        res.status(400).json({ success: false, message: `Invalid field value: ${details}` });
        return;
      }
      res.status(400).json({ success: false, message: 'No valid fields to update' });
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
    if (updates.employee_id && updates.employee_id !== currentEmployee.employeeId) {
      const idExists = await db.query.authentication.findFirst({
        where: and(eq(authentication.employeeId, updates.employee_id), ne(authentication.id, parseInt(id)))
      });
      if (idExists) {
        res.status(409).json({ success: false, message: 'Employee ID already exists' });
        return;
      }
    }

    await db.update(authentication)
      .set(updateFields)
      .where(eq(authentication.id, parseInt(id)));

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
        console.error('Validation error:', JSON.stringify(error.issues, null, 2));
        res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
        return;
    }
    console.error('Update employee error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Failed to update employee: ${errorMessage}` });
  }
};

export const revertEmployeeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { new_status, reason } = RevertStatusSchema.parse(req.body);
    console.log(`Reverting status for ${id} to ${new_status}. Reason: ${reason}`);

    const existing = await db.query.authentication.findFirst({
      where: eq(authentication.id, parseInt(id))
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const oldStatus = existing.employmentStatus;

    await db.update(authentication)
      .set({ employmentStatus: new_status as EmploymentStatus })
      .where(eq(authentication.id, parseInt(id)));

    res.json({
      success: true,
      message: `Employee status changed from ${oldStatus} to ${new_status}`,
      previousStatus: oldStatus,
      newStatus: new_status
    });
  } catch (error) {
    console.error('Revert employee status error:', error);
    res.status(500).json({ success: false, message: 'Failed to revert employee status' });
  }
};

// ============================================================================
// EMPLOYEE SKILLS
// ============================================================================

export const getEmployeeSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const skills = await db.select()
      .from(employeeSkills)
      .where(eq(employeeSkills.employeeId, parseInt(id)))
      .orderBy(employeeSkills.skillName);
    
    const mappedSkills = skills.map(mapToSkillApi);
    res.json({ success: true, skills: mappedSkills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch skills' });
  }
};

export const addEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { skill_name, category, proficiency_level, years_experience } = AddSkillSchema.parse(req.body);

    const [result] = await db.insert(employeeSkills).values({
      employeeId: parseInt(id),
      skillName: skill_name,
      category: (category || 'Technical'),
      proficiencyLevel: (proficiency_level || 'Intermediate') as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
      yearsExperience: years_experience ? String(years_experience) : null
    });

    res.status(201).json({ success: true, message: 'Skill added', skillId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add skill' });
  }
};

export const updateEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;
    const updates = UpdateSkillSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    const drizzleUpdates: any = {};
    if (updates.skill_name) drizzleUpdates.skillName = updates.skill_name;
    if (updates.category) drizzleUpdates.category = updates.category;
    if (updates.proficiency_level) drizzleUpdates.proficiencyLevel = updates.proficiency_level;
    if (updates.years_experience !== undefined) drizzleUpdates.yearsExperience = updates.years_experience ? String(updates.years_experience) : null;

    await db.update(employeeSkills)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeSkills.id, parseInt(skillId)),
        eq(employeeSkills.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Skill updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update skill' });
  }
};

export const deleteEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;
    await db.delete(employeeSkills)
      .where(and(
        eq(employeeSkills.id, parseInt(skillId)),
        eq(employeeSkills.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete skill' });
  }
};

// ============================================================================
// EMPLOYEE EDUCATION
// ============================================================================

export const getEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const education = await db.select()
      .from(employeeEducation)
      .where(eq(employeeEducation.employeeId, parseInt(id)))
      .orderBy(desc(employeeEducation.startDate));
    
    const mappedEducation = education.map(mapToEducationApi);
    res.json({ success: true, education: mappedEducation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch education' });
  }
};

export const addEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { institution, degree, field_of_study, start_date, end_date, is_current, type, description } = AddEducationSchema.parse(req.body);

    const [result] = await db.insert(employeeEducation).values({
      employeeId: parseInt(id),
      institution,
      degree: degree || null,
      fieldOfStudy: field_of_study || null,
      startDate: start_date ? String(start_date) : null,
      endDate: end_date ? String(end_date) : null,
      isCurrent: is_current ? 1 : 0, // tinyint
      type: (type || 'Education') as 'Education' | 'Certification' | 'Training',
      description: description || null
    });

    res.status(201).json({ success: true, message: 'Education added', educationId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add education' });
  }
};

export const updateEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, educationId } = req.params;
    const updates = UpdateEducationSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    const drizzleUpdates: any = {};
    if (updates.institution) drizzleUpdates.institution = updates.institution;
    if (updates.degree !== undefined) drizzleUpdates.degree = updates.degree || null;
    if (updates.field_of_study !== undefined) drizzleUpdates.fieldOfStudy = updates.field_of_study || null;
    if (updates.start_date !== undefined) drizzleUpdates.startDate = updates.start_date ? String(updates.start_date) : null;
    if (updates.end_date !== undefined) drizzleUpdates.endDate = updates.end_date ? String(updates.end_date) : null;
    if (updates.is_current !== undefined) drizzleUpdates.isCurrent = updates.is_current ? 1 : 0;
    if (updates.type) drizzleUpdates.type = updates.type;
    if (updates.description !== undefined) drizzleUpdates.description = updates.description || null;

    await db.update(employeeEducation)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeEducation.id, parseInt(educationId)),
        eq(employeeEducation.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Education updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update education' });
  }
};

export const deleteEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, educationId } = req.params;
    await db.delete(employeeEducation)
      .where(and(
        eq(employeeEducation.id, parseInt(educationId)),
        eq(employeeEducation.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Education deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete education' });
  }
};

// ============================================================================
// EMPLOYEE EMERGENCY CONTACTS
// ============================================================================

export const getEmployeeContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contacts = await db.select()
      .from(employeeEmergencyContacts)
      .where(eq(employeeEmergencyContacts.employeeId, parseInt(id)))
      .orderBy(desc(employeeEmergencyContacts.isPrimary));
    
    const mappedContacts = contacts.map(mapToContactApi);
    res.json({ success: true, contacts: mappedContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
};

export const addEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, relationship, phone_number, email, address, is_primary } = AddContactSchema.parse(req.body);

    if (is_primary) {
      await db.update(employeeEmergencyContacts)
        .set({ isPrimary: 0 })
        .where(eq(employeeEmergencyContacts.employeeId, parseInt(id)));
    }

    const [result] = await db.insert(employeeEmergencyContacts).values({
      employeeId: parseInt(id),
      name,
      relationship,
      phoneNumber: phone_number,
      email: email || null,
      address: address || null,
      isPrimary: is_primary ? 1 : 0 // tinyint
    });

    res.status(201).json({ success: true, message: 'Contact added', contactId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add contact' });
  }
};

export const updateEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, contactId } = req.params;
    const updates = UpdateContactSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return;
    }

    if (updates.is_primary) {
      await db.update(employeeEmergencyContacts)
        .set({ isPrimary: 0 })
        .where(eq(employeeEmergencyContacts.employeeId, parseInt(id)));
    }

    const drizzleUpdates: {
      name?: string;
      relationship?: string;
      phoneNumber?: string;
      email?: string | null;
      address?: string | null;
      isPrimary?: number;
    } = {};
    if (updates.name) drizzleUpdates.name = updates.name;
    if (updates.relationship) drizzleUpdates.relationship = updates.relationship;
    if (updates.phone_number) drizzleUpdates.phoneNumber = updates.phone_number;
    if (updates.email !== undefined) drizzleUpdates.email = updates.email || null;
    if (updates.address !== undefined) drizzleUpdates.address = updates.address || null;
    if (updates.is_primary !== undefined) drizzleUpdates.isPrimary = updates.is_primary ? 1 : 0;

    await db.update(employeeEmergencyContacts)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeEmergencyContacts.id, parseInt(contactId)),
        eq(employeeEmergencyContacts.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Contact updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
};

export const deleteEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, contactId } = req.params;
    await db.delete(employeeEmergencyContacts)
      .where(and(
        eq(employeeEmergencyContacts.id, parseInt(contactId)),
        eq(employeeEmergencyContacts.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
};


// ============================================================================
// EMPLOYEE CUSTOM FIELDS
// ============================================================================

export const addEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { section, field_name, field_value } = AddCustomFieldSchema.parse(req.body);

    const [result] = await db.insert(employeeCustomFields).values({
      employeeId: parseInt(id),
      section,
      fieldName: field_name,
      fieldValue: field_value || ''
    });

    res.status(201).json({ success: true, message: 'Custom field added', fieldId: result.insertId });
  } catch (error) {
    console.error('Add custom field error:', error);
    res.status(500).json({ success: false, message: 'Failed to add custom field' });
  }
};

export const updateEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, fieldId } = req.params;
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
    if (updates.field_name) drizzleUpdates.fieldName = updates.field_name;
    if (updates.field_value !== undefined && updates.field_value !== null) drizzleUpdates.fieldValue = updates.field_value;

    await db.update(employeeCustomFields)
      .set(drizzleUpdates)
      .where(and(
        eq(employeeCustomFields.id, parseInt(fieldId)),
        eq(employeeCustomFields.employeeId, parseInt(id))
      ));

    res.json({ success: true, message: 'Custom field updated' });
  } catch (error) {
    console.error('Update custom field error:', error);
    res.status(500).json({ success: false, message: 'Failed to update custom field' });
  }
};

export const deleteEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, fieldId } = req.params;
    await db.delete(employeeCustomFields)
      .where(and(
        eq(employeeCustomFields.id, parseInt(fieldId)),
        eq(employeeCustomFields.employeeId, parseInt(id))
      ));
    res.json({ success: true, message: 'Custom field deleted' });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete custom field' });
  }
};
