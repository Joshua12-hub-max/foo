import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  BudgetAllocationSchema,
  UpdateBudgetAllocationSchema
} from '../schemas/plantillaComplianceSchema.js';

interface BudgetRow extends RowDataPacket {
  id: number;
  year: number;
  department: string;
  total_budget: number;
  utilized_budget: number;
  remaining_budget: number;
  utilization_rate: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all budget allocations
 * GET /api/budget-allocation
 */
export const getBudgetAllocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, department } = req.query;

    let query = 'SELECT * FROM budget_allocation WHERE 1=1';
    const params: (string | number)[] = [];

    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year as string));
    }

    if (department) {
      query += ' AND department = ?';
      params.push(department as string);
    }

    query += ' ORDER BY year DESC, department ASC';

    const [allocations] = await db.query<BudgetRow[]>(query, params);

    res.json({
      success: true,
      allocations
    });
  } catch (error) {
    console.error('Get Budget Allocations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget allocations'
    });
  }
};

/**
 * Create budget allocation
 * POST /api/budget-allocation
 */
export const createBudgetAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = BudgetAllocationSchema.parse(req.body);

    // Check if allocation already exists for this year/department
    const [existing] = await db.query<BudgetRow[]>(
      'SELECT id FROM budget_allocation WHERE year = ? AND department = ?',
      [validatedData.year, validatedData.department]
    );

    if (existing.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Budget allocation for this year and department already exists'
      });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO budget_allocation (year, department, total_budget, notes)
       VALUES (?, ?, ?, ?)`,
      [validatedData.year, validatedData.department, validatedData.total_budget, validatedData.notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Budget allocation created successfully',
      id: result.insertId
    });
  } catch (error: any) {
    console.error('Create Budget Allocation Error:', error);

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
      message: 'Failed to create budget allocation'
    });
  }
};

/**
 * Update budget allocation
 * PUT /api/budget-allocation/:id
 */
export const updateBudgetAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = UpdateBudgetAllocationSchema.parse(req.body);

    const [existing] = await db.query<BudgetRow[]>(
      'SELECT id FROM budget_allocation WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Budget allocation not found'
      });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (validatedData.total_budget !== undefined) {
      updates.push('total_budget = ?');
      values.push(validatedData.total_budget);
    }

    if (validatedData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(validatedData.notes);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
      return;
    }

    values.push(id);

    await db.query(
      `UPDATE budget_allocation SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Budget allocation updated successfully'
    });
  } catch (error: any) {
    console.error('Update Budget Allocation Error:', error);

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
      message: 'Failed to update budget allocation'
    });
  }
};

/**
 * Recalculate budget utilization for a department/year
 * POST /api/budget-allocation/recalculate
 */
export const recalculateBudgetUtilization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, department } = req.body;

    if (!year || !department) {
      res.status(400).json({
        success: false,
        message: 'Year and department are required'
      });
      return;
    }

    // Calculate total utilized budget from filled positions
    const [positions] = await db.query<RowDataPacket[]>(
      `SELECT SUM(monthly_salary * 12) as annual_budget
       FROM plantilla_positions
       WHERE department = ? AND is_vacant = 0 AND status = 'Active'`,
      [department]
    );

    const utilizedBudget = positions[0]?.annual_budget || 0;

    // Update budget allocation
    await db.query(
      `UPDATE budget_allocation 
       SET utilized_budget = ?
       WHERE year = ? AND department = ?`,
      [utilizedBudget, year, department]
    );

    // Get updated allocation
    const [updated] = await db.query<BudgetRow[]>(
      'SELECT * FROM budget_allocation WHERE year = ? AND department = ?',
      [year, department]
    );

    res.json({
      success: true,
      message: 'Budget utilization recalculated successfully',
      allocation: updated[0]
    });
  } catch (error) {
    console.error('Recalculate Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate budget utilization'
    });
  }
};

/**
 * Get budget summary across all departments
 * GET /api/budget-allocation/summary
 */
export const getBudgetSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        message: 'Year is required'
      });
      return;
    }

    const [summary] = await db.query<RowDataPacket[]>(
      `SELECT 
         SUM(total_budget) as total_allocated,
         SUM(utilized_budget) as total_utilized,
         SUM(remaining_budget) as total_remaining,
         AVG(utilization_rate) as avg_utilization_rate,
         COUNT(*) as department_count
       FROM budget_allocation
       WHERE year = ?`,
      [year]
    );

    const [byDepartment] = await db.query<RowDataPacket[]>(
      `SELECT 
         department,
         total_budget,
         utilized_budget,
         remaining_budget,
         utilization_rate
       FROM budget_allocation
       WHERE year = ?
       ORDER BY utilization_rate DESC`,
      [year]
    );

    res.json({
      success: true,
      summary: summary[0],
      by_department: byDepartment
    });
  } catch (error) {
    console.error('Get Budget Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget summary'
    });
  }
};
