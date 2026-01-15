import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
  description?: string;
  head_of_department?: string;
  employee_count?: number;
}

interface EmployeeRow extends RowDataPacket {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department?: string;
}

export const getPublicDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const [departments] = await db.query<DepartmentRow[]>('SELECT id, name FROM departments ORDER BY name ASC');
    res.status(200).json({ success: true, departments });
  } catch (error) {
    console.error('Get Public Departments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const [departments] = await db.query<DepartmentRow[]>(`
      SELECT d.*, (SELECT COUNT(*) FROM authentication WHERE department = d.name) as employee_count 
      FROM departments d ORDER BY d.name ASC
    `);
    res.status(200).json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const [depts] = await db.query<DepartmentRow[]>('SELECT * FROM departments WHERE id = ?', [id]);
    if (depts.length === 0) { res.status(404).json({ success: false, message: 'Department not found' }); return; }
    
    const [employees] = await db.query<EmployeeRow[]>(
      'SELECT id, first_name, last_name, email, job_title, avatar_url, employment_status, date_hired FROM authentication WHERE department = ?',
      [depts[0].name]
    );
    res.status(200).json({ success: true, department: depts[0], employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch department details' });
  }
};

export const getAvailableEmployees = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { search } = req.query;
  
  try {
    const [depts] = await db.query<DepartmentRow[]>('SELECT name FROM departments WHERE id = ?', [id]);
    if (depts.length === 0) { res.status(404).json({ success: false, message: 'Department not found' }); return; }

    let query = 'SELECT id, employee_id, first_name, last_name, email, job_title, department, avatar_url FROM authentication WHERE (department IS NULL OR department != ?)';
    const params: string[] = [depts[0].name];

    if (search && String(search).trim()) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
      const searchTerm = `%${String(search).trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    query += ' ORDER BY last_name ASC LIMIT 20';

    const [employees] = await db.query<EmployeeRow[]>(query, params);
    res.status(200).json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch available employees' });
  }
};

export const assignEmployeeToDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { employeeId } = req.body;
  if (!employeeId) { res.status(400).json({ success: false, message: 'Employee ID is required' }); return; }

  try {
    const [depts] = await db.query<DepartmentRow[]>('SELECT name FROM departments WHERE id = ?', [id]);
    if (depts.length === 0) { res.status(404).json({ success: false, message: 'Department not found' }); return; }

    const [result] = await db.query<ResultSetHeader>('UPDATE authentication SET department = ? WHERE id = ?', [depts[0].name, employeeId]);
    if (result.affectedRows === 0) { res.status(404).json({ success: false, message: 'Employee not found' }); return; }

    res.status(200).json({ success: true, message: 'Employee assigned to department successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign employee to department' });
  }
};

export const removeEmployeeFromDepartment = async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.params;
  try {
    const [result] = await db.query<ResultSetHeader>('UPDATE authentication SET department = NULL WHERE id = ?', [employeeId]);
    if (result.affectedRows === 0) { res.status(404).json({ success: false, message: 'Employee not found' }); return; }
    res.status(200).json({ success: true, message: 'Employee removed from department' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove employee from department' });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  const { name, description, head_of_department } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'Department name is required' }); return; }

  try {
    const [existing] = await db.query<DepartmentRow[]>('SELECT * FROM departments WHERE name = ?', [name]);
    if (existing.length > 0) { res.status(409).json({ success: false, message: 'Department already exists' }); return; }

    await db.query('INSERT INTO departments (name, description, head_of_department) VALUES (?, ?, ?)', [name, description, head_of_department]);
    res.status(201).json({ success: true, message: 'Department created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, head_of_department } = req.body;
  const connection = await db.getConnection() as PoolConnection;

  try {
    await connection.beginTransaction();
    const [currentDept] = await connection.query<DepartmentRow[]>('SELECT name FROM departments WHERE id = ?', [id]);
    if (currentDept.length === 0) { await connection.rollback(); res.status(404).json({ success: false, message: 'Department not found' }); return; }
    const oldName = currentDept[0].name;

    if (name && name !== oldName) {
      const [existing] = await connection.query<DepartmentRow[]>('SELECT * FROM departments WHERE name = ? AND id != ?', [name, id]);
      if (existing.length > 0) { await connection.rollback(); res.status(409).json({ success: false, message: 'Department name already taken' }); return; }
    }

    const updates: string[] = [];
    const params: (string | number)[] = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (description) { updates.push('description = ?'); params.push(description); }
    if (head_of_department) { updates.push('head_of_department = ?'); params.push(head_of_department); }

    if (updates.length === 0) { await connection.rollback(); res.status(400).json({ success: false, message: 'No changes provided' }); return; }
    params.push(parseInt(id));
    await connection.query(`UPDATE departments SET ${updates.join(', ')} WHERE id = ?`, params);

    if (name && name !== oldName) { await connection.query('UPDATE authentication SET department = ? WHERE department = ?', [name, oldName]); }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Department updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to update department' });
  } finally {
    connection.release();
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM departments WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
};
