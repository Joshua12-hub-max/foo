import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { eq, and, or, sql, desc, like, ne } from 'drizzle-orm';
import type { AuthenticatedRequest, EmploymentStatus, Gender, CivilStatus, AppointmentType, CitizenshipType } from '../types/index.js';
import { UserService } from '../services/user.service.js';
import { 
  authentication, 
  departments, 
  plantillaPositions, 
  employeeSkills, 
  employeeEducation, 
  employeeEmergencyContacts, 
  employeeCustomFields 
} from '../db/schema.js';
import { 
  CreateEmployeeSchema, 
  UpdateEmployeeSchema, 
  RevertStatusSchema,
  AddSkillSchema,
  AddEducationSchema,
  AddContactSchema,
  AddCustomFieldSchema,
  UpdateCustomFieldSchema
} from '../schemas/employeeSchema.js';

// ============================================================================
// HELPERS
// ============================================================================

const sanitizePDSFields = (updates: any) => {
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

    // Pass the conditions array directly to the service
    // Assuming UserService.getAllEmployees can handle the conditions array
    // If not, we might need to adjust UserService or pass 'and(...conditions)'
    // Looking at the previous code, it seems UserService expects an array or undefined.
    
    const employees = await UserService.getAllEmployees(conditions);
    res.json({ success: true, employees });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeData = await UserService.getEmployeeById(parseInt(id));

    if (!employeeData) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const employee = { ...employeeData } as any;

    // Security: PII Filtering
    const authReq = req as AuthenticatedRequest;
    const requester = authReq.user;
    const isSelf = requester.id === parseInt(id);
    const isAdmin = ['admin', 'hr'].includes(requester.role?.toLowerCase());

    if (!isSelf && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access Denied: You can only view your own profile.' });
      return;
    }

    // Remove sensitive fields always
    delete employee.passwordHash;
    delete employee.verificationToken;
    delete employee.resetPasswordToken;
    delete employee.resetPasswordExpires;

    // Fetch related data
    const { skills, education, emergencyContacts, customFields } = await UserService.getRelatedData(parseInt(id));

    // Filter contacts for non-admins
    const finalContacts = !isSelf && !isAdmin ? [] : emergencyContacts;

    res.json({
      success: true,
      employee: {
        ...employee,
        skills,
        education,
        emergencyContacts: finalContacts,
        customFields
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

    // Handle Plantilla
    let finalItemNumber = item_number || null;
    let finalPosId = position_id || null;

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
        await db.update(plantillaPositions)
          .set({ isVacant: 0 })
          .where(eq(plantillaPositions.id, finalPosId));
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
        await db.update(plantillaPositions)
          .set({ isVacant: 0 })
          .where(eq(plantillaPositions.id, finalPosId));
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
      role: role as any,
      employmentStatus: (employment_status || 'Active') as EmploymentStatus,
      employmentType: (sanitizedData.employment_type || 'Probationary') as any,
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
      weightKg: sanitizedData.weight_kg ? String(sanitizedData.weight_kg) : null,
      bloodType: sanitizedData.blood_type as any,
      placeOfBirth: sanitizedData.place_of_birth || null,
      citizenship: sanitizedData.citizenship || null,
      citizenshipType: sanitizedData.citizenship_type as CitizenshipType,
      dualCitizenshipCountry: sanitizedData.dual_citizenship_country || null,
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
       await db.update(plantillaPositions)
         .set({ incumbentId: newEmployeeIdNum })
         .where(eq(plantillaPositions.id, finalPosId));
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

    const updateFields: any = {};

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
      height_m: 'heightCm', // SCHEMA is heightCm
      weight_kg: 'weightKg',
      blood_type: 'bloodType',
      place_of_birth: 'placeOfBirth',
      citizenship: 'citizenship',
      citizenship_type: 'citizenshipType',
      dual_citizenship_country: 'dualCitizenshipCountry',
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
      years_of_experience: 'yearsOfExperience'
    };

    for (const [jsonKey, value] of Object.entries(sanitizedUpdates)) {
      if (fieldMapping[jsonKey]) {
        const drizzleKey = fieldMapping[jsonKey];
        if (value !== undefined) {
           let processedVal = value === '' ? null : value;
           // Handle dates (schema mode string)
           if (['birthDate', 'dateHired', 'contractEndDate', 'regularizationDate', 'eligibilityDate'].includes(drizzleKey) && processedVal) {
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
           if (['heightCm', 'weightKg'].includes(drizzleKey) && processedVal !== null) {
              processedVal = String(processedVal);
           }
           // Handle int
           if (drizzleKey === 'yearsOfExperience' && processedVal !== null) {
              processedVal = Number(processedVal);
           }
           updateFields[drizzleKey] = processedVal;
        }
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
          if (updates.salary_grade === undefined) updateFields.salaryGrade = plantilla.salaryGrade;
        }
      } else {
          if (updates.item_number === undefined) updateFields.itemNumber = null;
          if (updates.position_title === undefined) updateFields.positionTitle = null;
      }
    }

    if (Object.keys(updateFields).length === 0) {
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
    res.json({ success: true, skills });
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
      category: (category || 'Technical') as any,
      proficiencyLevel: (proficiency_level || 'Intermediate') as any,
      yearsExperience: years_experience ? String(years_experience) : null
    });

    res.status(201).json({ success: true, message: 'Skill added', skillId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add skill' });
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
    res.json({ success: true, education });
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
      type: (type || 'Education') as any,
      description: description || null
    });

    res.status(201).json({ success: true, message: 'Education added', educationId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add education' });
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
    res.json({ success: true, contacts });
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

    const drizzleUpdates: any = {};
    if (updates.section) drizzleUpdates.section = updates.section;
    if (updates.field_name) drizzleUpdates.fieldName = updates.field_name;
    if (updates.field_value !== undefined) drizzleUpdates.fieldValue = updates.field_value;

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
