import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
  stepIncrementTracker, 
  authentication, 
  plantillaPositions, 
  plantillaPositionHistory, 
  salarySchedule 
} from '../db/schema.js';
import { eq, and, asc, desc, sql, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  StepIncrementTrackerSchema,
  ProcessStepIncrementSchema
} from '../schemas/plantillaComplianceSchema.js';

/**
 * Get all step increment records
 * GET /api/step-increment
 */
export const getStepIncrements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, employee_id } = req.query;
    const processor = alias(authentication, 'processor');

    const filters = [];
    if (status) {
      filters.push(eq(stepIncrementTracker.status, status as any));
    }
    if (employee_id) {
      filters.push(eq(stepIncrementTracker.employeeId, parseInt(employee_id as string)));
    }

    const increments = await db
      .select({
        id: stepIncrementTracker.id,
        employeeId: stepIncrementTracker.employeeId,
        positionId: stepIncrementTracker.positionId,
        currentStep: stepIncrementTracker.currentStep,
        previousStep: stepIncrementTracker.previousStep,
        eligibleDate: stepIncrementTracker.eligibleDate,
        status: stepIncrementTracker.status,
        processedAt: stepIncrementTracker.processedAt,
        processedBy: stepIncrementTracker.processedBy,
        remarks: stepIncrementTracker.remarks,
        employeeName: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
        employeeEmployeeId: authentication.employeeId,
        positionTitle: plantillaPositions.positionTitle,
        salaryGrade: plantillaPositions.salaryGrade,
        processorName: sql<string>`CONCAT(${processor.firstName}, ' ', ${processor.lastName})`
      })
      .from(stepIncrementTracker)
      .leftJoin(authentication, eq(stepIncrementTracker.employeeId, authentication.id))
      .leftJoin(plantillaPositions, eq(stepIncrementTracker.positionId, plantillaPositions.id))
      .leftJoin(processor, eq(stepIncrementTracker.processedBy, processor.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(stepIncrementTracker.eligibleDate), desc(stepIncrementTracker.createdAt));

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
export const getEligibleEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch all active regular employees with their position details
    // We use leftJoin for history because it might not exist for initial appointments
    const employees = await db.select({
      employee_id: authentication.id,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      employee_employee_id: authentication.employeeId,
      position_id: plantillaPositions.id,
      position_title: plantillaPositions.positionTitle,
      salary_grade: plantillaPositions.salaryGrade,
      current_step: authentication.stepIncrement,
      date_hired: authentication.dateHired,
      history_start_date: plantillaPositionHistory.startDate,
      contact_number: authentication.mobileNo
    })
    .from(authentication)
    .innerJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .leftJoin(plantillaPositionHistory, and(
      eq(plantillaPositions.id, plantillaPositionHistory.positionId),
      eq(authentication.id, plantillaPositionHistory.employeeId),
      sql`${plantillaPositionHistory.endDate} IS NULL`
    ))
    .where(and(
      eq(authentication.employmentStatus, 'Active'),
      lt(authentication.stepIncrement, 8) // Optimize: pre-filter steps < 8
    ));

    const eligibleEmployees = [];
    const currentTime = new Date();
    console.log('[DEBUG] getEligibleEmployees executing with updated logic');

    for (const emp of employees) {
      // Determine Start Date
      // Priority: History Start Date -> Date Hired
      let startDateStr = emp.history_start_date || emp.date_hired;
      if (!startDateStr) continue; // Cannot determine tenure

      const startDate = new Date(startDateStr);
      
      // Calculate Tenure in Years
      const diffTime = Math.abs(currentTime.getTime() - startDate.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

      if (diffYears < 3) continue; // Not yet 3 years

      // Check for Pending or Recent Approved Increments
      // Use db.select instead of db.query for safety
      const existingTracker = await db.select()
        .from(stepIncrementTracker)
        .where(eq(stepIncrementTracker.employeeId, emp.employee_id))
        .orderBy(desc(stepIncrementTracker.processedAt));

      // Check 1: Pending Request Exists
      const hasPending = existingTracker.some(t => t.status === 'Pending');
      if (hasPending) continue;

      // Check 2: Recent Approved Increment (< 3 years ago)
      const lastApproved = existingTracker.find(t => t.status === 'Approved');
      let isEligible = true;
      let eligibleDate = new Date(startDate);
      eligibleDate.setFullYear(eligibleDate.getFullYear() + 3);

      if (lastApproved && lastApproved.processedAt) {
        const lastProcessedDate = new Date(lastApproved.processedAt);
        const yearsSinceLast = (currentTime.getTime() - lastProcessedDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (yearsSinceLast < 3) {
          isEligible = false;
        } else {
           // If mostly eligible, the NEXT eligible date is 3 years from last approval
           eligibleDate = new Date(lastProcessedDate);
           eligibleDate.setFullYear(eligibleDate.getFullYear() + 3);
        }
      }

      if (isEligible) {
        // Deduplicate: Check if employee already exists in the list
        const isDuplicate = eligibleEmployees.some(e => e.employee_id === emp.employee_id);
        if (!isDuplicate) {
          eligibleEmployees.push({
            employee_id: emp.employee_id,
            employee_name: `${emp.first_name} ${emp.last_name}`,
            item_number: emp.employee_employee_id, // Mapping for UI
            position_title: emp.position_title,
            salary_grade: Number(emp.salary_grade),
            current_step: Number(emp.current_step),
            years_in_position: parseFloat(diffYears.toFixed(2)),
            eligible_date: eligibleDate.toISOString().split('T')[0],
            next_step: Number(emp.current_step) + 1
          });
        }
      }
    }

    // Sort by name
    eligibleEmployees.sort((a, b) => a.employee_name.localeCompare(b.employee_name));

    console.log(`[DEBUG: DEDUPLICATION ACTIVE] Found ${eligibleEmployees.length} unique eligible employees.`);

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

    // Verify employee exists
    const employee = await db.query.authentication.findFirst({
      where: eq(authentication.id, validatedData.employee_id),
      columns: { id: true, stepIncrement: true }
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
      return;
    }

    const result = await db.insert(stepIncrementTracker).values({
      employeeId: validatedData.employee_id,
      positionId: validatedData.position_id,
      currentStep: validatedData.current_step,
      previousStep: validatedData.previous_step || null,
      eligibleDate: validatedData.eligible_date,
      status: validatedData.status as any,
      remarks: validatedData.remarks || null
    });

    res.status(201).json({
      success: true,
      message: 'Step increment request created successfully',
      id: result[0].insertId
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
    const increment = await db.query.stepIncrementTracker.findFirst({
      where: eq(stepIncrementTracker.id, increment_id)
    });

    if (!increment) {
      res.status(404).json({
        success: false,
        message: 'Step increment request not found'
      });
      return;
    }

    if (increment.status === 'Processed') {
      res.status(400).json({
        success: false,
        message: 'This increment has already been processed'
      });
      return;
    }

    // Update increment status
    await db.update(stepIncrementTracker)
      .set({ 
        status: status as any, 
        processedAt: new Date().toISOString(), 
        processedBy: authReq.user.id, 
        remarks: remarks || null 
      })
      .where(eq(stepIncrementTracker.id, increment_id));

    // If approved, update employee and position
    if (status === 'Approved') {
      const newStep = increment.currentStep + 1;

      // Update employee step
      await db.update(authentication)
        .set({ stepIncrement: newStep })
        .where(eq(authentication.id, increment.employeeId));

      // Update position step
      await db.update(plantillaPositions)
        .set({ stepIncrement: newStep })
        .where(eq(plantillaPositions.id, increment.positionId));

      // Get new salary from salary_schedule
      // We need to fetch the salary grade of the position first
      const position = await db.query.plantillaPositions.findFirst({
        where: eq(plantillaPositions.id, increment.positionId),
        columns: { salaryGrade: true }
      });

      if (position) {
        const salary = await db.query.salarySchedule.findFirst({
          where: and(
            eq(salarySchedule.salaryGrade, position.salaryGrade),
            eq(salarySchedule.step, newStep)
          )
        });

        if (salary) {
          await db.update(plantillaPositions)
            .set({ monthlySalary: salary.monthlySalary })
            .where(eq(plantillaPositions.id, increment.positionId));
        }
      }

      // Mark as processed
      await db.update(stepIncrementTracker)
        .set({ status: 'Processed' })
        .where(eq(stepIncrementTracker.id, increment_id));
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
