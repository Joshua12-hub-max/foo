import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { budgetAllocation, plantillaPositions } from '../db/schema.js';
import { eq, and, desc, asc, sql, count, sum, avg, InferInsertModel } from 'drizzle-orm';
import {
  BudgetAllocationSchema,
  UpdateBudgetAllocationSchema
} from '../schemas/plantillaComplianceSchema.js';
import { ZodError } from 'zod';

/**
 * Get all budget allocations
 * GET /api/budget-allocation
 */
export const getBudgetAllocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, department } = req.query;

    const conditions = [];
    if (year) {
      conditions.push(eq(budgetAllocation.year, parseInt(year as string)));
    }
    if (department) {
      conditions.push(eq(budgetAllocation.department, department as string));
    }

    const allocations = await db.select()
      .from(budgetAllocation)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(budgetAllocation.year), asc(budgetAllocation.department));

    res.json({
      success: true,
      allocations
    });
  } catch (_error) {

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
    const existing = await db.query.budgetAllocation.findFirst({
      where: and(
        eq(budgetAllocation.year, validatedData.year),
        eq(budgetAllocation.department, validatedData.department)
      )
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Budget allocation for this year and department already exists'
      });
      return;
    }

    const [result] = await db.insert(budgetAllocation).values({
      year: validatedData.year,
      department: validatedData.department,
      totalBudget: String(validatedData.totalBudget),
      notes: validatedData.notes || null
    });

    res.status(201).json({
      success: true,
      message: 'Budget allocation created successfully',
      id: result.insertId
    });
  } catch (error) {

    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
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

    const existing = await db.query.budgetAllocation.findFirst({
      where: eq(budgetAllocation.id, Number(id))
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Budget allocation not found'
      });
      return;
    }

    const updateData: Partial<InferInsertModel<typeof budgetAllocation>> = {};
    if (validatedData.totalBudget !== undefined) {
      updateData.totalBudget = String(validatedData.totalBudget);
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
      return;
    }

    await db.update(budgetAllocation)
      .set(updateData)
      .where(eq(budgetAllocation.id, Number(id)));

    res.json({
      success: true,
      message: 'Budget allocation updated successfully'
    });
  } catch (error) {

    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
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
    const { year, department } = req.body as { year: string | number; department: string };

    if (!year || !department) {
      res.status(400).json({
        success: false,
        message: 'Year and department are required'
      });
      return;
    }

    // Calculate total utilized budget from filled positions
    // Formula: monthly_salary * 12
    const [result] = await db.select({
      annualBudget: sum(sql`${plantillaPositions.monthlySalary} * 12`)
    })
    .from(plantillaPositions)
    .where(and(
      eq(plantillaPositions.department, department),
      eq(plantillaPositions.isVacant, false),
      eq(plantillaPositions.status, 'Active')
    ));

    const utilizedBudget = Number(result?.annualBudget || 0);

    // Update budget allocation
    await db.update(budgetAllocation)
      .set({ utilizedBudget: String(utilizedBudget) })
      .where(and(
        eq(budgetAllocation.year, year),
        eq(budgetAllocation.department, department)
      ));

    // Get updated allocation
    const updated = await db.query.budgetAllocation.findFirst({
      where: and(
        eq(budgetAllocation.year, year),
        eq(budgetAllocation.department, department)
      )
    });

    res.json({
      success: true,
      message: 'Budget utilization recalculated successfully',
      allocation: updated
    });
  } catch (_error) {

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

    const [summary] = await db.select({
      totalAllocated: sum(budgetAllocation.totalBudget),
      totalUtilized: sum(budgetAllocation.utilizedBudget),
      totalRemaining: sum(budgetAllocation.remainingBudget),
      avgUtilizationRate: avg(budgetAllocation.utilizationRate),
      departmentCount: count()
    })
    .from(budgetAllocation)
    .where(eq(budgetAllocation.year, parseInt(year as string)));

    const byDepartment = await db.select({
      department: budgetAllocation.department,
      totalBudget: budgetAllocation.totalBudget,
      utilizedBudget: budgetAllocation.utilizedBudget,
      remainingBudget: budgetAllocation.remainingBudget,
      utilizationRate: budgetAllocation.utilizationRate
    })
    .from(budgetAllocation)
    .where(eq(budgetAllocation.year, parseInt(year as string)))
    .orderBy(desc(budgetAllocation.utilizationRate));

    res.json({
      success: true,
      summary,
      byDepartment: byDepartment
    });
  } catch (_error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget summary'
    });
  }
};


