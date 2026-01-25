import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  StepIncrementTrackerSchema,
  ProcessStepIncrementSchema
} from '../schemas/plantillaComplianceSchema.js';

interface StepIncrementRow extends RowDataPacket {
  id: number;
  employee_id: number;
  position_id: number;
  current_step: number;
  previous_step?: number;
  eligible_date: string;
  status: string;
  processed_at?: Date;
  processed_by?: number;
  remarks?: string;
  // Joined fields
  employee_name?: string;
  employee_employee_id?: string;
  position_title?: string;
  salary_grade?: number;
  processor_name?: string;
}

interface EmployeePositionRow extends RowDataPacket {
  employee_id: number;
  employee_name: string;
  employee_employee_id: string;
  position_id: number;
  position_title: string;
  salary_grade: number;
  current_step: number;
  start_date: string;
  years_in_position: number;
}

/**
 * Get all step increment records
 * GET /api/step-increment
 */
export const getStepIncrements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, employee_id } = req.query;

    let query = `
      SELECT si.*,
             CONCAT(e.first_name, ' ', e.last_name) as employee_name,
             e.employee_id as employee_employee_id,
             pp.position_title,
             pp.salary_grade,
             CONCAT(p.first_name, ' ', p.last_name) as processor_name
      FROM step_increment_tracker si
      LEFT JOIN authentication e ON si.employee_id = e.id
      LEFT JOIN plantilla_positions pp ON si.position_id = pp.id
      LEFT JOIN authentication p ON si.processed_by = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ' AND si.status = ?';
      params.push(status as string);
    }

    if (employee_id) {
      query += ' AND si.employee_id = ?';
      params.push(parseInt(employee_id as string));
    }

    query += ' ORDER BY si.eligible_date ASC, si.created_at DESC';

    const [increments] = await db.query<StepIncrementRow[]>(query, params);

    res.json({
      success: true,
      increments
    });
  } catch (error) {
    console.error('Get Step Increments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch step increments'
    });
  }
};

/**
 * Get employees eligible for step increment
 * GET /api/step-increment/eligible
 * 
 * Logic: Employee is eligible if:
 * - Has been in current position for 3+ years
 * - Current step < 8
 * - No promotion in last 3 years
 */
export const getEligibleEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all employees with their current positions and tenure
    const [employees] = await db.query<EmployeePositionRow[]>(`
      SELECT 
        a.id as employee_id,
        CONCAT(a.first_name, ' ', a.last_name) as employee_name,
        a.employee_id as employee_employee_id,
        pp.id as position_id,
        pp.position_title,
        pp.salary_grade,
        a.step_increment as current_step,
        pph.start_date,
        TIMESTAMPDIFF(YEAR, pph.start_date, CURDATE()) as years_in_position
      FROM authentication a
      INNER JOIN plantilla_positions pp ON a.id = pp.incumbent_id
      INNER JOIN plantilla_position_history pph ON pp.id = pph.position_id 
        AND a.id = pph.employee_id 
        AND pph.end_date IS NULL
      WHERE a.step_increment < 8
        AND TIMESTAMPDIFF(YEAR, pph.start_date, CURDATE()) >= 3
        AND a.employment_status = 'Active'
      ORDER BY years_in_position DESC, a.last_name ASC
    `);

    // Filter out those who already have pending/approved increments
    const eligibleEmployees = [];

    for (const emp of employees) {
      const [existing] = await db.query<StepIncrementRow[]>(
        `SELECT id FROM step_increment_tracker 
         WHERE employee_id = ? AND status IN ('Pending', 'Approved')`,
        [emp.employee_id]
      );

      if (existing.length === 0) {
        // Calculate eligible date (start_date + 3 years)
        const startDate = new Date(emp.start_date);
        const eligibleDate = new Date(startDate);
        eligibleDate.setFullYear(eligibleDate.getFullYear() + 3);

        eligibleEmployees.push({
          ...emp,
          eligible_date: eligibleDate.toISOString().split('T')[0],
          next_step: emp.current_step + 1
        });
      }
    }

    res.json({
      success: true,
      eligible_employees: eligibleEmployees,
      count: eligibleEmployees.length
    });
  } catch (error) {
    console.error('Get Eligible Employees Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible employees'
    });
  }
};

/**
 * Create step increment request
 * POST /api/step-increment
 */
export const createStepIncrement = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = StepIncrementTrackerSchema.parse(req.body);

    // Verify employee and position exist
    const [employees] = await db.query<RowDataPacket[]>(
      'SELECT id, step_increment FROM authentication WHERE id = ?',
      [validatedData.employee_id]
    );

    if (employees.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO step_increment_tracker 
       (employee_id, position_id, current_step, previous_step, eligible_date, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.employee_id,
        validatedData.position_id,
        validatedData.current_step,
        validatedData.previous_step || null,
        validatedData.eligible_date,
        validatedData.status,
        validatedData.remarks || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Step increment request created successfully',
      id: result.insertId
    });
  } catch (error: any) {
    console.error('Create Step Increment Error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create step increment request'
    });
  }
};

/**
 * Process step increment (Approve/Deny)
 * POST /api/step-increment/process
 */
export const processStepIncrement = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const validatedData = ProcessStepIncrementSchema.parse(req.body);
    const { increment_id, status, remarks } = validatedData;

    // Get increment details
    const [increments] = await db.query<StepIncrementRow[]>(
      'SELECT * FROM step_increment_tracker WHERE id = ?',
      [increment_id]
    );

    if (increments.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Step increment request not found'
      });
      return;
    }

    const increment = increments[0];

    if (increment.status === 'Processed') {
      res.status(400).json({
        success: false,
        message: 'This increment has already been processed'
      });
      return;
    }

    // Update increment status
    await db.query(
      `UPDATE step_increment_tracker 
       SET status = ?, processed_at = NOW(), processed_by = ?, remarks = ?
       WHERE id = ?`,
      [status, authReq.user.id, remarks || null, increment_id]
    );

    // If approved, update employee and position
    if (status === 'Approved') {
      const newStep = increment.current_step + 1;

      // Update employee step
      await db.query(
        'UPDATE authentication SET step_increment = ? WHERE id = ?',
        [newStep, increment.employee_id]
      );

      // Update position step
      await db.query(
        'UPDATE plantilla_positions SET step_increment = ? WHERE id = ?',
        [newStep, increment.position_id]
      );

      // Get new salary from salary_schedule
      const [salaries] = await db.query<RowDataPacket[]>(
        `SELECT monthly_salary FROM salary_schedule 
         WHERE salary_grade = (SELECT salary_grade FROM plantilla_positions WHERE id = ?)
           AND step = ?`,
        [increment.position_id, newStep]
      );

      if (salaries.length > 0) {
        await db.query(
          'UPDATE plantilla_positions SET monthly_salary = ? WHERE id = ?',
          [salaries[0].monthly_salary, increment.position_id]
        );
      }

      // Mark as processed
      await db.query(
        'UPDATE step_increment_tracker SET status = ? WHERE id = ?',
        ['Processed', increment_id]
      );
    }

    res.json({
      success: true,
      message: `Step increment ${status.toLowerCase()} successfully`
    });
  } catch (error: any) {
    console.error('Process Step Increment Error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process step increment'
    });
  }
};
