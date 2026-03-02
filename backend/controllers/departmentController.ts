import { Request, Response } from 'express';
import { InferSelectModel } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../db/index.js';
import { departments, authentication, plantillaPositions } from '../db/schema.js';
import { eq, asc, sql, or, isNull, ne, and, like, getTableColumns } from 'drizzle-orm';
import { DepartmentApiResponse, DepartmentDetailedApiResponse, DepartmentDbModel } from '../types/org.js';
import { EmployeeApiResponse } from '../types/employee.js';
import { mapToEmployeeApi } from './user.controller.js';

/** Input type for the department mapper — DB model with optional computed fields */
type DepartmentMapperInput = Partial<DepartmentDbModel> & { id: number; name: string; employee_count?: number | string };

/**
 * Strictly maps a Department DB model to its API response counterpart.
 */
const mapToDepartmentApi = (dept: DepartmentMapperInput): DepartmentApiResponse => {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description || null,
    head_of_department: dept.headOfDepartment || null,
    budget: dept.budget || '0.00',
    parent_department_id: dept.parentDepartmentId || null,
    location: dept.location || null,
    created_at: dept.createdAt ? new Date(dept.createdAt).toISOString() : null,
    updated_at: dept.updatedAt ? new Date(dept.updatedAt).toISOString() : null,
    employee_count: dept.employee_count !== undefined ? Number(dept.employee_count) : undefined
  };
};

export const getPublicDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .orderBy(asc(departments.name));
    const mappedDepartments = result.map(mapToDepartmentApi);
    res.status(200).json({ success: true, departments: mappedDepartments });
  } catch (error) {
    console.error('Get Public Departments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Using a subquery for employee count
    const result = await db.select({
      ...getTableColumns(departments),
      employee_count: sql<number>`(SELECT COUNT(*) FROM ${authentication} WHERE ${authentication.department} = ${departments.name})`
    })
    .from(departments)
    .orderBy(asc(departments.name));

    const mappedDepartments = result.map(mapToDepartmentApi);
    res.status(200).json({ success: true, departments: mappedDepartments });
  } catch (error) {
    console.error('Get Departments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, Number(id))
    });

    if (!dept) { 
      res.status(404).json({ success: false, message: 'Department not found' }); 
      return; 
    }
    
    const auth = alias(authentication, 'auth');
    const employees = await db.select({
      id: auth.id,
      employeeId: auth.employeeId,
      firstName: auth.firstName,
      lastName: auth.lastName,
      email: auth.email,
      positionTitle: auth.positionTitle,
      jobTitle: auth.jobTitle,
      phoneNumber: auth.phoneNumber,
      avatarUrl: auth.avatarUrl,
      employmentStatus: auth.employmentStatus,
      dateHired: auth.dateHired,
      department: auth.department,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE schedules.employee_id = auth.employee_id ORDER BY schedules.updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(auth)
    .where(eq(auth.department, dept.name));

    const mappedEmployees: EmployeeApiResponse[] = employees.map(mapToEmployeeApi);

    const departmentDetail: DepartmentDetailedApiResponse = {
      ...mapToDepartmentApi(dept),
      employees: mappedEmployees
    };

    res.status(200).json({ success: true, department: departmentDetail, employees: mappedEmployees });
  } catch (error) {
    console.error('Get Department By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department details' });
  }
};

export const getAvailableEmployees = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { search } = req.query;
  
  try {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, Number(id)),
      columns: { name: true }
    });

    if (!dept) { 
      res.status(404).json({ success: false, message: 'Department not found' }); 
      return; 
    }

    const whereClause = and(
      or(isNull(authentication.department), ne(authentication.department, dept.name)),
      search ? or(
        like(authentication.firstName, `%${search}%`),
        like(authentication.lastName, `%${search}%`),
        like(authentication.email, `%${search}%`),
        like(authentication.employeeId, `%${search}%`)
      ) : undefined
    );

    const employees = await db.select({
      id: authentication.id,
      employee_id: authentication.employeeId,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      email: authentication.email,
      job_title: authentication.jobTitle,
      department: authentication.department,
      avatar_url: authentication.avatarUrl
    })
    .from(authentication)
    .where(whereClause)
    .orderBy(asc(authentication.lastName))
    .limit(20);

    res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error('Get Available Employees Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available employees' });
  }
};

export const assignEmployeeToDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { employeeId } = req.body;
  if (!employeeId) { res.status(400).json({ success: false, message: 'Employee ID is required' }); return; }

  try {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, Number(id)),
      columns: { name: true }
    });

    if (!dept) { res.status(404).json({ success: false, message: 'Department not found' }); return; }

    await db.update(authentication)
      .set({ department: dept.name, departmentId: Number(id) })
      .where(eq(authentication.id, employeeId));

    // Drizzle update result doesn't have affectedRows directly in all drivers, but mysql2 does in [ResultSetHeader]
    // However, Drizzle's `run` or `execute` returns [ResultSetHeader]
    
    res.status(200).json({ success: true, message: 'Employee assigned to department successfully' });
  } catch (error) {
    console.error('Assign Employee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign employee to department' });
  }
};

export const removeEmployeeFromDepartment = async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.params;
  try {
    await db.update(authentication)
      .set({ department: null, departmentId: null })
      .where(eq(authentication.id, Number(employeeId)));

    res.status(200).json({ success: true, message: 'Employee removed from department' });
  } catch (error) {
    console.error('Remove Employee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove employee from department' });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  const { name, description, head_of_department } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'Department name is required' }); return; }

  try {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, name)
    });
    
    if (existing) { res.status(409).json({ success: false, message: 'Department already exists' }); return; }

    await db.insert(departments).values({
      name,
      description,
      headOfDepartment: head_of_department
    });

    res.status(201).json({ success: true, message: 'Department created successfully' });
  } catch (error) {
    console.error('Create Department Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, head_of_department } = req.body;

  try {
    await db.transaction(async (tx) => {
      const currentDept = await tx.query.departments.findFirst({
        where: eq(departments.id, Number(id))
      });
      
      if (!currentDept) { 
        throw new Error('DEPARTMENT_NOT_FOUND');
      }
      
      const oldName = currentDept.name;

      if (name && name !== oldName) {
        const existing = await tx.query.departments.findFirst({
          where: and(eq(departments.name, name), ne(departments.id, Number(id)))
        });
        if (existing) { throw new Error('DEPARTMENT_NAME_TAKEN'); }
      }

      const updates: Partial<InferSelectModel<typeof departments>> = {};
      if (name) updates.name = name;
      if (description) updates.description = description;
      if (head_of_department) updates.headOfDepartment = head_of_department;

      if (Object.keys(updates).length > 0) {
        await tx.update(departments)
          .set(updates)
          .where(eq(departments.id, Number(id)));
      }

      if (name && name !== oldName) {
        await tx.update(authentication)
          .set({ department: name })
          .where(eq(authentication.department, oldName));
      }
    });

    res.status(200).json({ success: true, message: 'Department updated successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update Department Error:', err);
    if (err.message === 'DEPARTMENT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }
    if (err.message === 'DEPARTMENT_NAME_TAKEN') {
      res.status(409).json({ success: false, message: 'Department name already taken' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deptId = Number(id);

  if (isNaN(deptId)) {
    res.status(400).json({ success: false, message: 'Invalid department ID' });
    return;
  }

  try {
    const deptToDelete = await db.query.departments.findFirst({
        where: eq(departments.id, deptId)
    });

    if (!deptToDelete) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
    }

    await db.transaction(async (tx) => {
      // 1. Remove department references from employees
      await tx.update(authentication)
        .set({ department: 'Unassigned', departmentId: null })
        .where(eq(authentication.departmentId, deptId));

      // 1b. Also clear by string name just in case of inconsistency
      await tx.update(authentication)
        .set({ department: 'Unassigned', departmentId: null })
        .where(eq(authentication.department, deptToDelete.name));

      // 2. Remove department references from plantilla positions
      await tx.update(plantillaPositions)
        .set({ department: 'Unassigned', departmentId: null })
        .where(eq(plantillaPositions.departmentId, deptId));

      await tx.update(plantillaPositions)
        .set({ department: 'Unassigned', departmentId: null })
        .where(eq(plantillaPositions.department, deptToDelete.name));

      // 3. Clear self-referencing parent departments
      await tx.update(departments)
        .set({ parentDepartmentId: null })
        .where(eq(departments.parentDepartmentId, deptId));

      // 4. Finally, safely delete the target department
      await tx.delete(departments).where(eq(departments.id, deptId));
    });

    res.status(200).json({ success: true, message: 'Department successfully deleted from the software and database' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Delete Department Error:', errMsg);
    res.status(500).json({ success: false, message: 'Failed to delete department. Database constraint error.' });
  }
};