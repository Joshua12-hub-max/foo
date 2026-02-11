import { Request, Response } from 'express';
import { ResultSetHeader } from 'mysql2';
import { db } from '../db/index.js';
import { departments, authentication } from '../db/schema.js';
import { eq, asc, sql, or, isNull, ne, and, like, getTableColumns } from 'drizzle-orm';

export const getPublicDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .orderBy(asc(departments.name));
      
    res.status(200).json({ success: true, departments: result });
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

    res.status(200).json({ success: true, departments: result });
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
    
    const employees = await db.select({
      id: authentication.id,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      email: authentication.email,
      job_title: authentication.jobTitle,
      avatar_url: authentication.avatarUrl,
      employment_status: authentication.employmentStatus,
      date_hired: authentication.dateHired
    })
    .from(authentication)
    .where(eq(authentication.department, dept.name));

    res.status(200).json({ success: true, department: dept, employees });
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

    const result = await db.update(authentication)
      .set({ department: dept.name, departmentId: Number(id) })
      .where(eq(authentication.id, employeeId));

    // Drizzle update result doesn't have affectedRows directly in all drivers, but mysql2 does in [ResultSetHeader]
    // However, Drizzle's `run` or `execute` returns [ResultSetHeader]
    // db.update returns Promise<[ResultSetHeader]>
    
    // Check if user existed by trying to select first? Or just assume success if no error?
    // The previous code checked affectedRows.
    // In Drizzle mysql2: result is [ResultSetHeader, FieldPacket[]]
    const updateResult = result[0] as unknown as ResultSetHeader;
    const affectedRows = updateResult.affectedRows;

    if (affectedRows === 0) { res.status(404).json({ success: false, message: 'Employee not found' }); return; }

    res.status(200).json({ success: true, message: 'Employee assigned to department successfully' });
  } catch (error) {
    console.error('Assign Employee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign employee to department' });
  }
};

export const removeEmployeeFromDepartment = async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.params;
  try {
    const result = await db.update(authentication)
      .set({ department: null, departmentId: null })
      .where(eq(authentication.id, Number(employeeId)));

    const deleteResult = result[0] as unknown as ResultSetHeader;
    const affectedRows = deleteResult.affectedRows;
    if (affectedRows === 0) { res.status(404).json({ success: false, message: 'Employee not found' }); return; }
    
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

      const updates: any = {};
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
  } catch (error: any) {
    console.error('Update Department Error:', error);
    if (error.message === 'DEPARTMENT_NOT_FOUND') {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }
    if (error.message === 'DEPARTMENT_NAME_TAKEN') {
      res.status(409).json({ success: false, message: 'Department name already taken' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await db.delete(departments).where(eq(departments.id, Number(id)));
    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete Department Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
};