import { Request, Response } from 'express';
import { InferSelectModel } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../db/index.js';
import { departments, authentication, plantillaPositions, bioEnrolledUsers } from '../db/schema.js';
import { eq, asc, sql, or, isNull, ne, and, like, getTableColumns } from 'drizzle-orm';
import { DepartmentApiResponse, DepartmentDetailedApiResponse, DepartmentDbModel } from '../types/org.js';
import { EmployeeApiResponse } from '../types/employee.js';
import { mapToEmployeeApi } from './user.controller.js';
import { 
  CreateDepartmentSchema, 
  UpdateDepartmentSchema, 
  AssignEmployeeSchema, 
  DepartmentIdParams 
} from '../schemas/departmentSchema.js';
import { pdsHrDetails } from '../db/schema.js';

/** Input type for the department mapper — DB model with optional computed fields */
type DepartmentMapperInput = Partial<DepartmentDbModel> & { id: number; name: string; employeeCount?: number | string };

/**
 * Strictly maps a Department DB model to its API response counterpart.
 */
const mapToDepartmentApi = (dept: DepartmentMapperInput): DepartmentApiResponse => {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description || null,
    headOfDepartment: dept.headOfDepartment || null,
    budget: dept.budget || '0.00',
    parentDepartmentId: dept.parentDepartmentId || null,
    location: dept.location || null,
    createdAt: dept.createdAt ? new Date(dept.createdAt).toISOString() : null,
    updatedAt: dept.updatedAt ? new Date(dept.updatedAt).toISOString() : null,
    employeeCount: dept.employeeCount !== undefined ? Number(dept.employeeCount) : undefined
  };
};

export const getPublicDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .orderBy(asc(departments.name));

    // Manual mapping for public list
    const mappedDepartments = result.map(dept => ({
      id: dept.id,
      name: dept.name
    }));

    res.status(200).json({ success: true, departments: mappedDepartments });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 100% Accuracy: Use LEFT JOIN with GROUP BY for reliable counting
    const result = await db.select({
      ...getTableColumns(departments),
      employeeCount: sql<number>`CAST(COUNT(${authentication.id}) AS UNSIGNED)`
    })
    .from(departments)
    .leftJoin(pdsHrDetails, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(authentication, eq(authentication.id, pdsHrDetails.employeeId))
    .where(and(
        or(
            eq(pdsHrDetails.employmentStatus, 'Active'),
            eq(pdsHrDetails.employmentStatus, 'Probationary')
        )
    ))
    .groupBy(departments.id)
    .orderBy(asc(departments.name));

    const mappedDepartments = result.map(mapToDepartmentApi);
    res.status(200).json({ success: true, departments: mappedDepartments });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};


export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  const validation = DepartmentIdParams.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ success: false, message: 'Invalid department ID', errors: validation.error.format() });
    return;
  }
  const { id } = validation.data.params;
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
      positionTitle: pdsHrDetails.positionTitle,
      jobTitle: pdsHrDetails.jobTitle,
      avatarUrl: auth.avatarUrl,
      employmentStatus: pdsHrDetails.employmentStatus,
      dateHired: pdsHrDetails.dateHired,
      department: departments.name,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE schedules.employee_id = auth.employee_id AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE schedules.employee_id = auth.employee_id AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE schedules.employee_id = auth.employee_id AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE schedules.employee_id = auth.employee_id AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`,
      isBiometricEnrolled: sql<boolean>`CASE WHEN ${bioEnrolledUsers.employeeId} IS NOT NULL THEN true ELSE false END`
    })
    .from(auth)
    .leftJoin(pdsHrDetails, eq(auth.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(bioEnrolledUsers, eq(auth.employeeId, bioEnrolledUsers.employeeId))
    .where(eq(pdsHrDetails.departmentId, Number(id)));

    const mappedEmployees: EmployeeApiResponse[] = employees.map(mapToEmployeeApi);

    const departmentDetail: DepartmentDetailedApiResponse = {
      ...mapToDepartmentApi(dept),
      employees: mappedEmployees
    };

    res.status(200).json({ success: true, department: departmentDetail, employees: mappedEmployees });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch department details' });
  }
};

export const getAvailableEmployees = async (req: Request, res: Response): Promise<void> => {
  const validation = DepartmentIdParams.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ success: false, message: 'Invalid request', errors: validation.error.format() });
    return;
  }
  const { id } = validation.data.params;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

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
      or(isNull(pdsHrDetails.departmentId), ne(pdsHrDetails.departmentId, Number(id))),
      search ? or(
        like(authentication.firstName, `%${search}%`),
        like(authentication.lastName, `%${search}%`),
        like(authentication.email, `%${search}%`),
        like(authentication.employeeId, `%${search}%`)
      ) : undefined
    );

    const employees = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      email: authentication.email,
      jobTitle: pdsHrDetails.jobTitle,
      department: departments.name,
      avatarUrl: authentication.avatarUrl
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(whereClause)
    .orderBy(asc(authentication.lastName))
    .limit(20);

    res.status(200).json({ success: true, employees });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch available employees' });
  }
};


export const assignEmployeeToDepartment = async (req: Request, res: Response): Promise<void> => {
  const validation = AssignEmployeeSchema.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.format() });
    return;
  }
  const { id } = validation.data.params;
  const { employeeId } = validation.data.body;

  try {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, Number(id)),
      columns: { name: true }
    });

    if (!dept) { res.status(404).json({ success: false, message: 'Department not found' }); return; }

    await db.update(pdsHrDetails)
      .set({ departmentId: Number(id) })
      .where(eq(pdsHrDetails.employeeId, employeeId));

    res.status(200).json({ success: true, message: 'Employee assigned to department successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to assign employee to department' });
  }
};

export const removeEmployeeFromDepartment = async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.params;
  try {
    await db.update(pdsHrDetails)
      .set({ departmentId: null })
      .where(eq(pdsHrDetails.employeeId, Number(employeeId)));

    res.status(200).json({ success: true, message: 'Employee removed from department' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to remove employee from department' });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  const validation = CreateDepartmentSchema.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.format() });
    return;
  }
  const { name, description, headOfDepartment } = validation.data.body;

  try {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, name)
    });

    if (existing) { res.status(409).json({ success: false, message: 'Department already exists' }); return; }

    await db.insert(departments).values({
      name,
      description,
      headOfDepartment: headOfDepartment
    });

    res.status(201).json({ success: true, message: 'Department created successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  const validation = UpdateDepartmentSchema.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.format() });
    return;
  }
  const { id } = validation.data.params;
  const { name, description, headOfDepartment } = validation.data.body;

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
      if (headOfDepartment) updates.headOfDepartment = headOfDepartment;

      if (Object.keys(updates).length > 0) {
        await tx.update(departments)
          .set(updates)
          .where(eq(departments.id, Number(id)));
      }

      if (name && name !== oldName) {
        // No need to update authentication string 'department' as it's removed.
        // If there were other tables referencing department name, we'd update them here.
      }
    });

    res.status(200).json({ success: true, message: 'Department updated successfully' });
  } catch (error: unknown) {
    const err = error as Error;

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
  const validation = DepartmentIdParams.safeParse(req);
  if (!validation.success) {
    res.status(400).json({ success: false, message: 'Invalid ID', errors: validation.error.format() });
    return;
  }
  const { id } = validation.data.params;
  const deptId = Number(id);

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
      await tx.update(pdsHrDetails)
        .set({ departmentId: null })
        .where(eq(pdsHrDetails.departmentId, deptId));

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

    res.status(200).json({ success: true, message: 'Department successfully deleted' });
  } catch (error: unknown) {
    // const _errMsg = error instanceof Error ? error.message : String(error);

    res.status(500).json({ success: false, message: 'Failed to delete department.' });
  }
};

