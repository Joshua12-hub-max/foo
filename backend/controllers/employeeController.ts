import { Request, Response } from 'express';
import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest, UserRow } from '../types/index.js';
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
// Interfaces
// ============================================================================

interface EmployeeRow extends RowDataPacket {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  department_id?: number;
  job_title?: string;
  employment_status?: string;
  role: string;
  avatar_url?: string;
  date_hired?: Date;
  position_title?: string;
  station?: string;
  appointment_type?: string;
  item_number?: string;
  birth_date?: Date;
  gender?: string;
  password_hash?: string;
  verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  sss_number?: string;
  gsis_number?: string;
  philhealth_number?: string;
  pagibig_number?: string;
  tin_number?: string;
  phone_number?: string;
  address?: string;
  permanent_address?: string;
  emergency_contact?: string;
  emergency_contact_number?: string;
  position_id?: number;
  manager_id?: number;
}

interface SkillRow extends RowDataPacket {
  id: number;
  employee_id: number;
  skill_name: string;
  category: string;
  proficiency_level: string;
  years_experience?: number;
}

interface EducationRow extends RowDataPacket {
  id: number;
  employee_id: number;
  institution: string;
  degree?: string;
  field_of_study?: string;
  start_date?: Date;
  end_date?: Date;
  is_current: boolean;
  type: string;
  description?: string;
}

interface ContactRow extends RowDataPacket {
  id: number;
  employee_id: number;
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  address?: string;
  is_primary: boolean;
}

interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
}

interface CustomFieldRow extends RowDataPacket {
  id: number;
  employee_id: number;
  section: string;
  field_name: string;
  field_value: string;
}

interface PlantillaRow extends RowDataPacket {
  id: number;
  item_number: string;
  position_title: string;
  salary_grade: number;
  step_increment: number;
  is_vacant: boolean;
}

// ============================================================================
// EMPLOYEE CRUD OPERATIONS
// ============================================================================

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, department_id } = req.query;
    let query = `SELECT id, employee_id, first_name, last_name, email, department, department_id, 
                 job_title, employment_status, role, avatar_url, date_hired, 
                 position_title, position_id, station, appointment_type, item_number,
                 birth_date, gender 
                 FROM authentication`;
    const params: (string | number)[] = [];

    if (department_id) {
      query += ' WHERE department_id = ?';
      params.push(Number(department_id));
    } else if (department && department !== 'All Departments') {
      query += ' WHERE department = ?';
      params.push(department as string);
    }

    query += ' ORDER BY last_name ASC';

    const [employees] = await db.query<EmployeeRow[]>(query, params);
    res.json({ success: true, employees });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [employees] = await db.query<EmployeeRow[]>(
      'SELECT * FROM authentication WHERE id = ?',
      [id]
    );

    if (employees.length === 0) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const employee = { ...employees[0] } as Partial<EmployeeRow>;

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
    delete employee.password_hash;
    delete employee.verification_token;
    delete employee.reset_password_token;
    delete employee.reset_password_expires;

    // Fetch related data
    const [skills] = await db.query<SkillRow[]>(
      'SELECT * FROM employee_skills WHERE employee_id = ? ORDER BY skill_name',
      [id]
    );
    const [education] = await db.query<EducationRow[]>(
      'SELECT * FROM employee_education WHERE employee_id = ? ORDER BY start_date DESC',
      [id]
    );
    const [emergencyContacts] = await db.query<ContactRow[]>(
      'SELECT * FROM employee_emergency_contacts WHERE employee_id = ? ORDER BY is_primary DESC',
      [id]
    );

    const [customFields] = await db.query<CustomFieldRow[]>(
      'SELECT * FROM employee_custom_fields WHERE employee_id = ?',
      [id]
    );

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
      const [deptExists] = await db.query<DepartmentRow[]>(
        'SELECT name FROM departments WHERE id = ?',
        [finalDeptId]
      );
      if (deptExists.length === 0) {
        res.status(400).json({ success: false, message: 'Invalid department ID' });
        return;
      }
      finalDeptName = deptExists[0].name;
    } else if (finalDeptName) {
      const [deptExists] = await db.query<DepartmentRow[]>(
        'SELECT id FROM departments WHERE name = ?',
        [finalDeptName]
      );
      if (deptExists.length === 0) {
        res.status(400).json({ success: false, message: 'Invalid department' });
        return;
      }
      finalDeptId = deptExists[0].id;
    }

    // Check uniqueness
    const [existing] = await db.query<EmployeeRow[]>(
      'SELECT id FROM authentication WHERE email = ? OR employee_id = ?',
      [email, employee_id]
    );
    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'Email or Employee ID already exists' });
      return;
    }

    // Generate ID if not provided
    const finalEmployeeId = employee_id || `EMP-${Date.now().toString().slice(-6)}`;

    // Hash password
    const passwordToHash = password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    // Handle Plantilla
    let finalItemNumber = item_number || null;
    let finalPosId = position_id || null;

    if (finalPosId) {
      const [plantilla] = await db.query<PlantillaRow[]>(
        'SELECT id, item_number, is_vacant FROM plantilla_positions WHERE id = ?',
        [finalPosId]
      );
      if (plantilla.length > 0) {
        if (!plantilla[0].is_vacant) {
          res.status(409).json({ success: false, message: `Plantilla Item ${plantilla[0].item_number} is already filled.` });
          return;
        }
        finalItemNumber = plantilla[0].item_number;
        await db.query('UPDATE plantilla_positions SET is_vacant = FALSE WHERE id = ?', [finalPosId]);
      }
    } else if (finalItemNumber && finalItemNumber !== 'N/A') {
      const [plantilla] = await db.query<PlantillaRow[]>(
        'SELECT id, is_vacant FROM plantilla_positions WHERE item_number = ?',
        [finalItemNumber]
      );
      if (plantilla.length > 0) {
        if (!plantilla[0].is_vacant) {
          res.status(409).json({ success: false, message: `Plantilla Item ${finalItemNumber} is already filled.` });
          return;
        }
        finalPosId = plantilla[0].id;
        await db.query('UPDATE plantilla_positions SET is_vacant = FALSE WHERE id = ?', [finalPosId]);
      }
    }

    // Auto-calculate Regularization Date for Probationary
    let finalRegularizationDate = null;
    if (validatedData.employment_type === 'Probationary' && !validatedData.regularization_date) {
        const hireDate = new Date(validatedData.date_hired || Date.now());
        hireDate.setMonth(hireDate.getMonth() + 6);
        finalRegularizationDate = hireDate; // Will be formatted by MySQL driver
    } else if (validatedData.regularization_date) {
        finalRegularizationDate = validatedData.regularization_date;
    }

    await db.query(
      `INSERT INTO authentication 
       (first_name, last_name, email, department, department_id, job_title, role, employment_status, employment_type,
        employee_id, password_hash, is_verified,
        birth_date, gender, civil_status, nationality, phone_number, address, permanent_address,
        philhealth_number, pagibig_number, tin_number, gsis_number,
        salary_grade, step_increment, appointment_type, station, position_title, item_number, position_id,
        contract_end_date, regularization_date, is_regular) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, email, finalDeptName, finalDeptId, job_title || 'N/A', role,
        employment_status || 'Active', validatedData.employment_type || 'Probationary',
        finalEmployeeId, hashedPassword,
        birth_date || null, gender || null, civil_status || null, nationality || 'Filipino',
        phone_number || null, address || null, permanent_address || null,
        philhealth_number || null, pagibig_number || null,
        tin_number || null, gsis_number || null,
        salary_grade || null, step_increment || 1, appointment_type || null,
        station || null, position_title || null, finalItemNumber, finalPosId,
        validatedData.contract_end_date || null, finalRegularizationDate, validatedData.is_regular || false
      ]
    );

    const [newEmpResult] = await db.query<ResultSetHeader>('SELECT LAST_INSERT_ID() as id');
    const newEmployeeIdNum = (newEmpResult as any)[0]?.id || newEmpResult.insertId;
    
    if (finalPosId && newEmployeeIdNum) {
       await db.query('UPDATE plantilla_positions SET incumbent_id = ? WHERE id = ?', [newEmployeeIdNum, finalPosId]);
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

    const [emp] = await db.query<EmployeeRow[]>(
      'SELECT item_number, position_id FROM authentication WHERE id = ?',
      [id]
    );

    await db.query('DELETE FROM authentication WHERE id = ?', [id]);

    // Free up plantilla item
    if (emp.length > 0) {
      if (emp[0].position_id) {
        await db.query('UPDATE plantilla_positions SET is_vacant = TRUE, incumbent_id = NULL WHERE id = ?', [emp[0].position_id]);
      } else if (emp[0].item_number && emp[0].item_number !== 'N/A') {
        await db.query('UPDATE plantilla_positions SET is_vacant = TRUE, incumbent_id = NULL WHERE item_number = ?', [emp[0].item_number]);
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

    const [existing] = await db.query<EmployeeRow[]>('SELECT * FROM authentication WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const currentEmployee = existing[0];

    const allowedFields = [
      'first_name', 'last_name', 'email', 'department', 'department_id', 'job_title', 'role',
      'employment_status', 'employee_id', 'birth_date', 'gender', 'civil_status',
      'nationality', 'phone_number', 'address', 'permanent_address',
      'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number', 'gsis_number',
      'salary_grade', 'step_increment', 'appointment_type', 'station', 'position_title',
      'item_number', 'position_id', 'date_hired', 'avatar_url',
      'contract_end_date', 'regularization_date', 'is_regular', 'employment_type'
    ];

    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    // Filter updates based on schema + logic
    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
             setClauses.push(`${key} = ?`);
             params.push(value === '' ? null : value as string | number | null);
        }
    }

    // Handle department sync if department_id changed
    if (updates.department_id && updates.department_id !== currentEmployee.department_id) {
       const [dept] = await db.query<DepartmentRow[]>('SELECT name FROM departments WHERE id = ?', [updates.department_id]);
       if (dept.length > 0) {
          setClauses.push('department = ?');
          params.push(dept[0].name);
       }
    }

    // Handle plantilla changes
    const newPosId = updates.position_id;
    const oldPosId = currentEmployee.position_id;

    if (newPosId !== undefined && newPosId !== oldPosId) {
      if (oldPosId) {
        await db.query('UPDATE plantilla_positions SET is_vacant = TRUE, incumbent_id = NULL WHERE id = ?', [oldPosId]);
      }
      if (newPosId) {
        const [plantilla] = await db.query<PlantillaRow[]>(
          'SELECT id, is_vacant, item_number, position_title, salary_grade, step_increment FROM plantilla_positions WHERE id = ?',
          [newPosId]
        );
        if (plantilla.length > 0) {
          if (!plantilla[0].is_vacant) {
            res.status(409).json({ success: false, message: `Plantilla Item ${plantilla[0].item_number} is already filled.` });
            return;
          }
          await db.query('UPDATE plantilla_positions SET is_vacant = FALSE, incumbent_id = ? WHERE id = ?', [id, newPosId]);
          
          if (updates.item_number === undefined) { setClauses.push('item_number = ?'); params.push(plantilla[0].item_number); }
          if (updates.position_title === undefined) { setClauses.push('position_title = ?'); params.push(plantilla[0].position_title); }
          if (updates.salary_grade === undefined) { setClauses.push('salary_grade = ?'); params.push(plantilla[0].salary_grade); }
        }
      } else {
          if (updates.item_number === undefined) { setClauses.push('item_number = NULL'); }
          if (updates.position_title === undefined) { setClauses.push('position_title = NULL'); }
      }
    }

    if (setClauses.length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    // Email uniqueness
    if (updates.email && updates.email !== currentEmployee.email) {
      const [emailExists] = await db.query<EmployeeRow[]>(
        'SELECT id FROM authentication WHERE email = ? AND id != ?',
        [updates.email, id]
      );
      if (emailExists.length > 0) {
        res.status(409).json({ success: false, message: 'Email already exists' });
        return;
      }
    }

    // Employee ID uniqueness
    if (updates.employee_id && updates.employee_id !== currentEmployee.employee_id) {
      const [idExists] = await db.query<EmployeeRow[]>(
        'SELECT id FROM authentication WHERE employee_id = ? AND id != ?',
        [updates.employee_id, id]
      );
      if (idExists.length > 0) {
        res.status(409).json({ success: false, message: 'Employee ID already exists' });
        return;
      }
    }

    params.push(parseInt(id));
    await db.query(`UPDATE authentication SET ${setClauses.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
};

export const revertEmployeeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { new_status, reason } = RevertStatusSchema.parse(req.body);

    const [existing] = await db.query<EmployeeRow[]>('SELECT * FROM authentication WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const oldStatus = existing[0].employment_status;

    await db.query('UPDATE authentication SET employment_status = ? WHERE id = ?', [new_status, id]);

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
    const [skills] = await db.query<SkillRow[]>(
      'SELECT * FROM employee_skills WHERE employee_id = ? ORDER BY skill_name',
      [id]
    );
    res.json({ success: true, skills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch skills' });
  }
};

export const addEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { skill_name, category, proficiency_level, years_experience } = AddSkillSchema.parse(req.body);

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO employee_skills (employee_id, skill_name, category, proficiency_level, years_experience)
       VALUES (?, ?, ?, ?, ?)`,
      [id, skill_name, category || 'Technical', proficiency_level || 'Intermediate', years_experience || null]
    );

    res.status(201).json({ success: true, message: 'Skill added', skillId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add skill' });
  }
};

export const deleteEmployeeSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;
    await db.query('DELETE FROM employee_skills WHERE id = ? AND employee_id = ?', [skillId, id]);
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
    const [education] = await db.query<EducationRow[]>(
      'SELECT * FROM employee_education WHERE employee_id = ? ORDER BY start_date DESC',
      [id]
    );
    res.json({ success: true, education });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch education' });
  }
};

export const addEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { institution, degree, field_of_study, start_date, end_date, is_current, type, description } = AddEducationSchema.parse(req.body);

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO employee_education 
       (employee_id, institution, degree, field_of_study, start_date, end_date, is_current, type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, institution, degree || null, field_of_study || null, start_date || null,
       end_date || null, is_current || false, type || 'Education', description || null]
    );

    res.status(201).json({ success: true, message: 'Education added', educationId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add education' });
  }
};

export const deleteEmployeeEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, educationId } = req.params;
    await db.query('DELETE FROM employee_education WHERE id = ? AND employee_id = ?', [educationId, id]);
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
    const [contacts] = await db.query<ContactRow[]>(
      'SELECT * FROM employee_emergency_contacts WHERE employee_id = ? ORDER BY is_primary DESC',
      [id]
    );
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
      await db.query('UPDATE employee_emergency_contacts SET is_primary = FALSE WHERE employee_id = ?', [id]);
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO employee_emergency_contacts 
       (employee_id, name, relationship, phone_number, email, address, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, relationship, phone_number, email || null, address || null, is_primary || false]
    );

    res.status(201).json({ success: true, message: 'Contact added', contactId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add contact' });
  }
};

export const deleteEmployeeContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, contactId } = req.params;
    await db.query('DELETE FROM employee_emergency_contacts WHERE id = ? AND employee_id = ?', [contactId, id]);
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

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO employee_custom_fields (employee_id, section, field_name, field_value)
       VALUES (?, ?, ?, ?)`,
      [id, section, field_name, field_value || '']
    );

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

    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    if (updates.field_value !== undefined) {
        setClauses.push('field_value = ?');
        params.push(updates.field_value);
    }
    if (updates.field_name !== undefined) {
        setClauses.push('field_name = ?');
        params.push(updates.field_name);
    }
    
    if (setClauses.length === 0) {
         res.json({ success: true, message: 'No changes made' });
         return;
    }

    params.push(fieldId);
    params.push(id);

    await db.query(
      `UPDATE employee_custom_fields SET ${setClauses.join(', ')} WHERE id = ? AND employee_id = ?`,
      params
    );

    res.json({ success: true, message: 'Custom field updated' });
  } catch (error) {
    console.error('Update custom field error:', error);
    res.status(500).json({ success: false, message: 'Failed to update custom field' });
  }
};

export const deleteEmployeeCustomField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, fieldId } = req.params;
    await db.query('DELETE FROM employee_custom_fields WHERE id = ? AND employee_id = ?', [fieldId, id]);
    res.json({ success: true, message: 'Custom field deleted' });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete custom field' });
  }
};
